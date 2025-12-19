<?php
// api/contact.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://yshdd.com');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración
$config = [
    'recipient' => 'contacto@yshdd.com',
    'subject_prefix' => '[YSHDD EPK] ',
    'max_length' => [
        'name' => 100,
        'email' => 255,
        'subject' => 200,
        'message' => 5000
    ]
];

// Validar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

// Obtener y validar datos
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

// Validaciones
$errors = [];

// Nombre
if (empty($data['name'])) {
    $errors[] = 'El nombre es requerido';
} elseif (strlen($data['name']) > $config['max_length']['name']) {
    $errors[] = 'El nombre es demasiado largo';
}

// Email
if (empty($data['email'])) {
    $errors[] = 'El email es requerido';
} elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Email inválido';
} elseif (strlen($data['email']) > $config['max_length']['email']) {
    $errors[] = 'El email es demasiado largo';
}

// Asunto
if (empty($data['subject'])) {
    $errors[] = 'El asunto es requerido';
} elseif (strlen($data['subject']) > $config['max_length']['subject']) {
    $errors[] = 'El asunto es demasiado largo';
}

// Mensaje
if (empty($data['message'])) {
    $errors[] = 'El mensaje es requerido';
} elseif (strlen($data['message']) > $config['max_length']['message']) {
    $errors[] = 'El mensaje es demasiado largo';
}

// Si hay errores
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// Sanitizar datos
$name = htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8');
$email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
$company = isset($data['company']) ? htmlspecialchars(trim($data['company']), ENT_QUOTES, 'UTF-8') : '';
$phone = isset($data['phone']) ? preg_replace('/[^0-9+\-\s]/', '', $data['phone']) : '';
$subject = htmlspecialchars(trim($data['subject']), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(trim($data['message']), ENT_QUOTES, 'UTF-8');

// Construir email
$email_subject = $config['subject_prefix'] . $subject;

$email_body = "
Nuevo mensaje desde YSHDD EPK:

Nombre: $name
Email: $email
Empresa: $company
Teléfono: $phone
Asunto: $subject

Mensaje:
$message

---
Enviado desde: {$_SERVER['HTTP_REFERER'] ?? 'YSHDD EPK'}
IP: {$_SERVER['REMOTE_ADDR']}
Navegador: {$_SERVER['HTTP_USER_AGENT']}
";

$headers = [
    'From: YSHDD EPK <no-reply@yshdd.com>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
    'Content-Type: text/plain; charset=UTF-8'
];

// Enviar email
try {
    $success = mail(
        $config['recipient'],
        $email_subject,
        $email_body,
        implode("\r\n", $headers)
    );
    
    if ($success) {
        // Registrar en base de datos si es necesario
        $this->logContact($data);
        
        // Enviar respuesta de éxito
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Mensaje enviado correctamente'
        ]);
    } else {
        throw new Exception('Error al enviar el email');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor',
        'debug' => $e->getMessage()
    ]);
}

// Función para registrar contacto
function logContact($data) {
    $log_file = __DIR__ . '/../logs/contacts.log';
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'data' => $data,
        'ip' => $_SERVER['REMOTE_ADDR'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT']
    ];
    
    file_put_contents(
        $log_file,
        json_encode($log_entry) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}
?>

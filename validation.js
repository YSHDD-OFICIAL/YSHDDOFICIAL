// assets/js/validation.js

import { UTILS } from './config.js';

export class Validator {
    constructor() {
        this.rules = {
            required: {
                validate: (value) => {
                    if (value === null || value === undefined) return false;
                    if (typeof value === 'string') return value.trim().length > 0;
                    return true;
                },
                message: 'Este campo es requerido'
            },
            
            email: {
                validate: (value) => {
                    if (!value) return true; // No validar si está vacío (usa required para eso)
                    return UTILS.isValidEmail(value);
                },
                message: 'Email inválido'
            },
            
            phone: {
                validate: (value) => {
                    if (!value) return true;
                    return UTILS.isValidPhone(value);
                },
                message: 'Teléfono inválido'
            },
            
            minLength: {
                validate: (value, param) => {
                    if (!value) return true;
                    return value.length >= param;
                },
                message: (param) => `Mínimo ${param} caracteres`
            },
            
            maxLength: {
                validate: (value, param) => {
                    if (!value) return true;
                    return value.length <= param;
                },
                message: (param) => `Máximo ${param} caracteres`
            },
            
            min: {
                validate: (value, param) => {
                    const num = parseFloat(value);
                    if (isNaN(num)) return false;
                    return num >= param;
                },
                message: (param) => `Valor mínimo: ${param}`
            },
            
            max: {
                validate: (value, param) => {
                    const num = parseFloat(value);
                    if (isNaN(num)) return false;
                    return num <= param;
                },
                message: (param) => `Valor máximo: ${param}`
            },
            
            pattern: {
                validate: (value, pattern) => {
                    if (!value) return true;
                    const regex = new RegExp(pattern);
                    return regex.test(value);
                },
                message: 'Formato inválido'
            },
            
            url: {
                validate: (value) => {
                    if (!value) return true;
                    try {
                        new URL(value);
                        return true;
                    } catch {
                        return false;
                    }
                },
                message: 'URL inválida'
            },
            
            sameAs: {
                validate: (value, param, formData) => {
                    return value === formData[param];
                },
                message: 'Los valores no coinciden'
            }
        };
        
        this.customRules = {};
    }
    
    validateField(field, value, rules, formData = {}) {
        const errors = [];
        
        for (const rule of rules) {
            const [ruleName, param] = rule.split(':');
            const ruleConfig = this.customRules[ruleName] || this.rules[ruleName];
            
            if (!ruleConfig) {
                console.warn(`Regla de validación desconocida: ${ruleName}`);
                continue;
            }
            
            const isValid = ruleConfig.validate(value, param, formData);
            
            if (!isValid) {
                const message = typeof ruleConfig.message === 'function' 
                    ? ruleConfig.message(param)
                    : ruleConfig.message;
                
                errors.push({
                    field,
                    rule: ruleName,
                    message,
                    param
                });
                
                // Parar en el primer error si es requerido
                if (ruleName === 'required') break;
            }
        }
        
        return errors;
    }
    
    validateForm(formData, validationRules) {
        const errors = {};
        let isValid = true;
        
        for (const [field, rules] of Object.entries(validationRules)) {
            const value = formData[field];
            const fieldErrors = this.validateField(field, value, rules, formData);
            
            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
                isValid = false;
            }
        }
        
        return {
            isValid,
            errors,
            firstError: this.getFirstError(errors)
        };
    }
    
    getFirstError(errors) {
        for (const field in errors) {
            if (errors[field].length > 0) {
                return {
                    field,
                    ...errors[field][0]
                };
            }
        }
        return null;
    }
    
    addRule(name, validateFn, message) {
        this.customRules[name] = {
            validate: validateFn,
            message: message || `Error en ${name}`
        };
    }
    
    // Validaciones específicas para el formulario de contacto
    validateContactForm(data) {
        const rules = {
            name: ['required', 'minLength:2', 'maxLength:100'],
            email: ['required', 'email'],
            subject: ['required', 'minLength:5', 'maxLength:200'],
            message: ['required', 'minLength:10', 'maxLength:5000'],
            phone: ['phone'],
            company: ['maxLength:200']
        };
        
        return this.validateForm(data, rules);
    }
    
    // Validaciones específicas para el formulario de colaboración
    validateCollaborationForm(data) {
        const rules = {
            collabName: ['required', 'minLength:2', 'maxLength:100'],
            collabRole: ['required'],
            collabIdea: ['required', 'minLength:20', 'maxLength:2000'],
            collabEmail: ['required', 'email'],
            collabPhone: ['phone']
        };
        
        return this.validateForm(data, rules);
    }
    
    // Validaciones específicas para newsletter
    validateNewsletterForm(data) {
        const rules = {
            email: ['required', 'email']
        };
        
        return this.validateForm(data, rules);
    }
    
    // Validación de URL de redes sociales
    validateSocialUrl(url, platform) {
        const platformPatterns = {
            instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/[A-Za-z0-9_.]+\/?$/,
            twitter: /^(https?:\/\/)?(www\.)?twitter\.com\/[A-Za-z0-9_]+\/?$/,
            facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/[A-Za-z0-9.]+\/?$/,
            youtube: /^(https?:\/\/)?(www\.)?youtube\.com\/(c\/|channel\/|user\/)?[A-Za-z0-9_-]+\/?$/,
            tiktok: /^(https?:\/\/)?(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/?$/,
            spotify: /^(https?:\/\/)?(open\.)?spotify\.com\/(artist|album|track|playlist)\/[A-Za-z0-9]+\/?$/
        };
        
        if (!platformPatterns[platform]) return true;
        
        const pattern = platformPatterns[platform];
        return pattern.test(url);
    }
    
    // Sanitización de entrada
    sanitize(input, type = 'text') {
        if (input === null || input === undefined) return '';
        
        let sanitized = String(input).trim();
        
        switch(type) {
            case 'email':
                sanitized = sanitized.toLowerCase();
                break;
                
            case 'phone':
                sanitized = sanitized.replace(/\D/g, '');
                break;
                
            case 'url':
                if (sanitized && !sanitized.startsWith('http')) {
                    sanitized = 'https://' + sanitized;
                }
                break;
                
            case 'html':
                // Escapar HTML
                const div = document.createElement('div');
                div.textContent = sanitized;
                sanitized = div.innerHTML;
                break;
                
            case 'text':
            default:
                // Escapar caracteres especiales básicos
                sanitized = sanitized
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                break;
        }
        
        return sanitized;
    }
    
    // Validación de archivo
    validateFile(file, options = {}) {
        const errors = [];
        const defaults = {
            maxSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
            allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']
        };
        
        const config = { ...defaults, ...options };
        
        if (!file) {
            errors.push('No se seleccionó ningún archivo');
            return errors;
        }
        
        // Validar tamaño
        if (file.size > config.maxSize) {
            const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
            errors.push(`El archivo es demasiado grande (máximo ${maxSizeMB}MB)`);
        }
        
        // Validar tipo
        if (!config.allowedTypes.includes(file.type)) {
            errors.push(`Tipo de archivo no permitido: ${file.type}`);
        }
        
        // Validar extensión
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!config.allowedExtensions.includes(extension)) {
            errors.push(`Extensión no permitida: ${extension}`);
        }
        
        return errors;
    }
    
    // Validación de datos de tarjeta de crédito (para futuras integraciones)
    validateCreditCard(cardNumber, cardType = 'auto') {
        // Eliminar espacios y guiones
        const cleaned = cardNumber.replace(/\D/g, '');
        
        // Validar longitud básica
        if (cleaned.length < 13 || cleaned.length > 19) {
            return { isValid: false, error: 'Longitud inválida' };
        }
        
        // Algoritmo de Luhn
        let sum = 0;
        let isEven = false;
        
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i), 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        const isValid = (sum % 10) === 0;
        
        if (!isValid) {
            return { isValid: false, error: 'Número de tarjeta inválido' };
        }
        
        // Identificar tipo de tarjeta
        const cardTypes = {
            visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            mastercard: /^5[1-5][0-9]{14}$/,
            amex: /^3[47][0-9]{13}$/,
            diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
            discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
            jcb: /^(?:2131|1800|35\d{3})\d{11}$/
        };
        
        let detectedType = 'unknown';
        for (const [type, pattern] of Object.entries(cardTypes)) {
            if (pattern.test(cleaned)) {
                detectedType = type;
                break;
            }
        }
        
        return {
            isValid: true,
            type: detectedType,
            formatted: this.formatCreditCard(cleaned, detectedType)
        };
    }
    
    formatCreditCard(number, type) {
        const cleaned = number.replace(/\D/g, '');
        
        switch(type) {
            case 'amex':
                return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
            default:
                return cleaned.replace(/(\d{4})/g, '$1 ').trim();
        }
    }
    
    // Validación de fecha
    validateDate(dateString, format = 'YYYY-MM-DD', minDate = null, maxDate = null) {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return { isValid: false, error: 'Fecha inválida' };
        }
        
        // Validar formato específico
        if (format === 'YYYY-MM-DD') {
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (!regex.test(dateString)) {
                return { isValid: false, error: 'Formato debe ser YYYY-MM-DD' };
            }
        }
        
        // Validar rango
        if (minDate && date < new Date(minDate)) {
            return { 
                isValid: false, 
                error: `Fecha debe ser posterior a ${minDate}` 
            };
        }
        
        if (maxDate && date > new Date(maxDate)) {
            return { 
                isValid: false, 
                error: `Fecha debe ser anterior a ${maxDate}` 
            };
        }
        
        return { isValid: true, date };
    }
    
    // Validación de edad
    validateAge(birthDate, minAge = 13, maxAge = 120) {
        const today = new Date();
        const birth = new Date(birthDate);
        
        if (isNaN(birth.getTime())) {
            return { isValid: false, error: 'Fecha de nacimiento inválida' };
        }
        
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        if (age < minAge) {
            return { isValid: false, error: `Debes tener al menos ${minAge} años` };
        }
        
        if (age > maxAge) {
            return { isValid: false, error: `Edad inválida (máximo ${maxAge} años)` };
        }
        
        return { isValid: true, age };
    }
    
    // Validación de contraseña
    validatePassword(password, options = {}) {
        const defaults = {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecial: false
        };
        
        const config = { ...defaults, ...options };
        const errors = [];
        
        if (!password) {
            errors.push('Contraseña requerida');
            return { isValid: false, errors };
        }
        
        if (password.length < config.minLength) {
            errors.push(`Mínimo ${config.minLength} caracteres`);
        }
        
        if (config.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Debe contener al menos una mayúscula');
        }
        
        if (config.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Debe contener al menos una minúscula');
        }
        
        if (config.requireNumbers && !/\d/.test(password)) {
            errors.push('Debe contener al menos un número');
        }
        
        if (config.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Debe contener al menos un carácter especial');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password)
        };
    }
    
    calculatePasswordStrength(password) {
        if (!password) return 0;
        
        let score = 0;
        
        // Longitud
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
        
        // Complejidad
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        // Convertir a porcentaje
        const maxScore = 7;
        const percentage = Math.round((score / maxScore) * 100);
        
        // Nivel de fortaleza
        let level = 'débil';
        if (percentage >= 60) level = 'media';
        if (percentage >= 80) level = 'fuerte';
        if (percentage >= 95) level = 'muy fuerte';
        
        return {
            score,
            percentage,
            level
        };
    }
    
    // Helper para mostrar errores en formularios
    displayErrors(formElement, errors) {
        // Limpiar errores previos
        this.clearErrors(formElement);
        
        if (!errors || Object.keys(errors).length === 0) return;
        
        for (const [field, fieldErrors] of Object.entries(errors)) {
            const input = formElement.querySelector(`[name="${field}"]`);
            if (!input) continue;
            
            // Agregar clase de error
            input.classList.add('error');
            
            // Crear mensaje de error
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = fieldErrors.map(e => `
                <div class="error-item">
                    <i class='bx bx-error-circle'></i>
                    <span>${e.message}</span>
                </div>
            `).join('');
            
            // Insertar después del input
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
            
            // Scroll al primer error
            if (Object.keys(errors)[0] === field) {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                input.focus();
            }
        }
    }
    
    clearErrors(formElement) {
        // Remover clases de error
        formElement.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });
        
        // Remover mensajes de error
        formElement.querySelectorAll('.error-message').forEach(el => {
            el.remove();
        });
    }
    
    // Validación en tiempo real
    setupLiveValidation(formElement, validationRules) {
        const inputs = formElement.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            const fieldName = input.getAttribute('name');
            if (!fieldName || !validationRules[fieldName]) return;
            
            const rules = validationRules[fieldName];
            
            // Validar al perder el foco
            input.addEventListener('blur', () => {
                const value = input.value;
                const errors = this.validateField(fieldName, value, rules);
                
                if (errors.length > 0) {
                    input.classList.add('error');
                    this.showInlineError(input, errors[0].message);
                } else {
                    input.classList.remove('error');
                    input.classList.add('valid');
                    this.hideInlineError(input);
                }
            });
            
            // Remover estado de error al empezar a escribir
            input.addEventListener('input', () => {
                input.classList.remove('error');
                this.hideInlineError(input);
            });
        });
    }
    
    showInlineError(input, message) {
        this.hideInlineError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'inline-error';
        errorDiv.innerHTML = `
            <i class='bx bx-error-circle'></i>
            <span>${message}</span>
        `;
        
        input.parentNode.appendChild(errorDiv);
    }
    
    hideInlineError(input) {
        const existingError = input.parentNode.querySelector('.inline-error');
        if (existingError) {
            existingError.remove();
        }
    }
    
    // Validación de formulario completo con feedback visual
    validateFormWithFeedback(formElement, validationRules) {
        const formData = new FormData(formElement);
        const data = Object.fromEntries(formData);
        
        const result = this.validateForm(data, validationRules);
        
        if (!result.isValid) {
            this.displayErrors(formElement, result.errors);
            
            // Animación de shake para el formulario
            formElement.classList.add('shake');
            setTimeout(() => {
                formElement.classList.remove('shake');
            }, 500);
        }
        
        return result;
    }
}

// Singleton global
let validatorInstance = null;

export function getValidator() {
    if (!validatorInstance) {
        validatorInstance = new Validator();
    }
    return validatorInstance;
}

// Inicialización global
window.YSHDDValidator = getValidator();

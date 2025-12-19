// assets/js/config.js

export const CONFIG = {
    // Información de la aplicación
    app: {
        name: 'YSHDD EPK',
        version: '2.6.0',
        build: '20250315',
        author: 'YSHDD Team',
        email: 'contacto@yshdd.com',
        website: 'https://yshdd.com',
        repo: 'https://github.com/yshdd/epk',
        license: 'Proprietary'
    },
    
    // Información del artista
    artist: {
        name: 'YSHDD',
        realName: 'Luis Esteban Potosí Venté',
        birthDate: '2005-05-30',
        location: 'Cali, Colombia',
        genre: ['Rap Cristiano', 'Trap Cristiano', 'Hip Hop Cristiano'],
        activeSince: 2023,
        label: 'Independiente',
        management: 'YSHDD Management',
        booking: 'booking@yshdd.com'
    },
    
    // APIs y endpoints
    api: {
        baseUrl: 'https://api.yshdd.com',
        endpoints: {
            contact: '/contact',
            newsletter: '/newsletter',
            booking: '/booking',
            collaboration: '/collaboration',
            stats: '/stats',
            download: '/download',
            stream: '/stream'
        },
        keys: {
            analytics: 'G-XXXXXXXXXX',
            vapid: 'TU_CLAVE_PUBLICA_VAPID',
            recaptcha: 'SITE_KEY'
        }
    },
    
    // URLs de redes sociales
    social: {
        instagram: {
            url: 'https://instagram.com/yshddoficial',
            handle: '@yshddoficial'
        },
        youtube: {
            url: 'https://youtube.com/@yshdd',
            handle: '@yshdd'
        },
        spotify: {
            url: 'https://open.spotify.com/artist/43tSpIfMASioBV4PmbyymH',
            artistId: '43tSpIfMASioBV4PmbyymH'
        },
        tiktok: {
            url: 'https://tiktok.com/@yshddoficial',
            handle: '@yshddoficial'
        },
        facebook: {
            url: 'https://facebook.com/yshddoficial',
            handle: 'yshddoficial'
        },
        twitter: {
            url: 'https://twitter.com/yshdd',
            handle: '@yshdd'
        },
        soundcloud: {
            url: 'https://soundcloud.com/yshdd',
            handle: 'yshdd'
        },
        appleMusic: {
            url: 'https://music.apple.com/artist/yshdd',
            artistId: 'id123456789'
        }
    },
    
    // URLs de descarga
    downloads: {
        epkBasic: {
            url: '/downloads/epk-basic.zip',
            size: '5MB',
            version: '1.0'
        },
        epkFull: {
            url: '/downloads/epk-full.zip',
            size: '50MB',
            version: '2.0'
        },
        bio: {
            url: '/downloads/bio-completa.pdf',
            size: '2MB',
            pages: 5
        },
        photos: {
            url: '/downloads/fotos-prensa.zip',
            size: '30MB',
            count: 15
        },
        music: {
            url: '/downloads/musica-para-medios.zip',
            size: '15MB',
            tracks: 3
        }
    },
    
    // Configuración de características
    features: {
        pwa: {
            enabled: true,
            installable: true,
            offline: true
        },
        notifications: {
            enabled: true,
            permissionRequired: true
        },
        analytics: {
            enabled: true,
            providers: ['google', 'custom']
        },
        lazyLoad: {
            enabled: true,
            threshold: 0.5
        },
        webp: {
            enabled: true,
            fallback: true
        },
        serviceWorker: {
            enabled: true,
            version: '2.6.0'
        },
        musicPlayer: {
            enabled: true,
            autoplay: false,
            volume: 80
        }
    },
    
    // Configuración de seguridad
    security: {
        csp: {
            enabled: true,
            reportOnly: false
        },
        xssProtection: {
            enabled: true
        },
        clickjackingProtection: {
            enabled: true
        },
        emailObfuscation: {
            enabled: true,
            method: 'rot13'
        },
        rightClickProtection: {
            enabled: true,
            imagesOnly: true
        }
    },
    
    // Configuración de rendimiento
    performance: {
        lazyLoadThreshold: 0.5,
        imageQuality: 85,
        cacheTTL: 3600,
        preloadCritical: true,
        prefetchLinks: true,
        webpQuality: 80,
        maxImageSize: 1920
    },
    
    // Contenido estático
    content: {
        stats: {
            monthlyStreams: 52000,
            followers: 10500,
            cities: 12,
            releases: 5,
            collaborations: 3,
            performances: 10
        },
        
        releases: [
            {
                id: 1,
                title: 'CRISIS',
                type: 'album',
                year: 2025,
                tracks: 5,
                duration: '15:30',
                plays: 25000,
                likes: 1200,
                spotifyId: 'album_id_1',
                cover: 'assets/images/album-covers/crisis.jpg'
            },
            {
                id: 2,
                title: '¿Quién Soy?',
                type: 'single',
                year: 2024,
                tracks: 1,
                duration: '3:45',
                plays: 50000,
                likes: 2500,
                spotifyId: 'track_id_1',
                cover: 'assets/images/album-covers/quien-soy.jpg'
            }
        ],
        
        videos: [
            {
                id: 1,
                title: '¿Quién Soy? - Video Oficial',
                type: 'official',
                views: 50000,
                duration: '3:45',
                url: 'https://youtube.com/embed/naMGlK1ozFc',
                thumbnail: 'assets/images/videos/official.jpg'
            }
        ],
        
        gallery: {
            categories: ['press', 'live', 'studio', 'behind'],
            images: [
                {
                    id: 1,
                    src: 'assets/images/gallery/1.jpg',
                    webp: 'assets/images/gallery/1.webp',
                    category: 'press',
                    alt: 'YSHDD - Foto de prensa 1',
                    width: 1200,
                    height: 800
                }
            ]
        }
    },
    
    // Internacionalización
    i18n: {
        default: 'es',
        supported: ['es', 'en'],
        fallback: 'es'

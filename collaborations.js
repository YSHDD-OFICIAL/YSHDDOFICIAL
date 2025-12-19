// assets/js/modules/collaborations.js
export class Collaborations {
    constructor() {
        this.collaborations = [];
        this.proposals = [];
        this.init();
    }

    async init() {
        await this.loadCollaborations();
        this.setupEventListeners();
    }

    async loadCollaborations() {
        try {
            // En producción, esto vendría de una API
            this.collaborations = [
                {
                    id: 1,
                    name: "Artista X",
                    role: "Productor",
                    image: "assets/images/collaborators/artist1.jpg",
                    status: "active",
                    description: "Nueva colaboración en estudio. Fusionando trap cristiano con elementos de reggaetón urbano.",
                    tracks: 3,
                    year: "2025"
                },
                {
                    id: 2,
                    name: "Producer Y",
                    role: "Productor",
                    image: "assets/images/collaborators/producer1.jpg",
                    status: "completed",
                    description: "Co-producción del álbum debut CRISIS. Arreglos y mezcla profesional.",
                    tracks: 5,
                    year: "2024"
                },
                {
                    id: 3,
                    name: "Feat. International",
                    role: "Artista",
                    image: "assets/images/collaborators/international.jpg",
                    status: "completed",
                    description: "Colaboración virtual con artista mexicano. Single 'Fe y Flow'.",
                    streams: "100K",
                    year: "2023"
                }
            ];
            
            this.renderCollaborations();
            
        } catch (error) {
            console.error('Error cargando colaboraciones:', error);
            throw error;
        }
    }

    renderCollaborations() {
        const container = document.querySelector('.collaborations-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.collaborations.forEach(collab => {
            const card = this.createCollaborationCard(collab);
            container.appendChild(card);
        });
    }

    createCollaborationCard(collab) {
        const div = document.createElement('div');
        div.className = `collab-card ${collab.status === 'active' ? 'featured' : ''}`;
        div.innerHTML = `
            <div class="collab-header">
                <span class="collab-badge ${collab.status === 'completed' ? 'past' : ''}">
                    ${collab.status === 'active' ? 'ACTIVA' : 'COMPLETADA'}
                </span>
                <span class="collab-date">${collab.year}</span>
            </div>
            
            <div class="collab-artists">
                <div class="artist">
                    <div class="artist-image">
                        <img src="${collab.image}" alt="${collab.name}" loading="lazy">
                    </div>
                    <span class="artist-name">${collab.name}</span>
                </div>
                ${collab.status === 'active' ? `
                <div class="collab-symbol">
                    <i class='bx bx-plus'></i>
                </div>
                <div class="artist">
                    <div class="artist-image">
                        <img src="assets/images/profile-main.jpg" alt="YSHDD">
                    </div>
                    <span class="artist-name">YSHDD</span>
                </div>
                ` : ''}
            </div>
            
            <div class="collab-info">
                <h3 class="collab-title">${collab.role === 'Productor' ? 'Producción' : 'Featuring'}: ${collab.name}</h3>
                <p class="collab-description">${collab.description}</p>
                
                ${collab.tracks ? `
                <div class="collab-tracks">
                    <span class="track-tag">${collab.tracks} tracks</span>
                    <span class="track-tag">Studio work</span>
                </div>
                ` : ''}
                
                ${collab.streams ? `
                <div class="collab-stats">
                    <span><i class='bx bx-play'></i> ${collab.streams} streams</span>
                </div>
                ` : ''}
                
                ${collab.status === 'active' ? `
                <div class="collab-status">
                    <div class="status-indicator active"></div>
                    <span>En producción</span>
                </div>
                ` : ''}
            </div>
            
            ${collab.status === 'active' ? `
            <div class="collab-actions">
                <button class="btn btn-outline" data-collab-id="${collab.id}" data-action="follow">
                    <i class='bx bx-bell'></i>
                    <span>Seguir Proyecto</span>
                </button>
            </div>
            ` : ''}
        `;
        
        return div;
    }

    setupEventListeners() {
        // Seguir colaboración
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="follow"]')) {
                const button = e.target.closest('[data-action="follow"]');
                const collabId = button.getAttribute('data-collab-id');
                this.followCollaboration(collabId);
            }
        });
    }

    followCollaboration(collabId) {
        const collaboration = this.collaborations.find(c => c.id == collabId);
        if (!collaboration) return;
        
        // Guardar en localStorage
        const followed = JSON.parse(localStorage.getItem('yshdd-followed-collabs') || '[]');
        if (!followed.includes(collabId)) {
            followed.push(collabId);
            localStorage.setItem('yshdd-followed-collabs', JSON.stringify(followed));
            
            // Mostrar notificación
            if (window.YSHDD && window.YSHDD.modules.notifications) {
                window.YSHDD.modules.notifications.show(
                    `Ahora sigues la colaboración con ${collaboration.name}`,
                    'success'
                );
            }
        }
    }

    async submitProposal(data) {
        try {
            // En producción, esto enviaría a una API
            this.proposals.push({
                ...data,
                date: new Date().toISOString(),
                status: 'pending'
            });
            
            // Guardar en localStorage (simulación)
            localStorage.setItem('yshdd-collab-proposals', JSON.stringify(this.proposals));
            
            // Enviar email (simulación)
            await this.sendProposalEmail(data);
            
            return true;
            
        } catch (error) {
            console.error('Error enviando propuesta:', error);
            return false;
        }
    }

    async sendProposalEmail(data) {
        // Simulación de envío de email
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Email de propuesta enviado:', data);
                resolve(true);
            }, 1000);
        });
    }

    getStats() {
        return {
            total: this.collaborations.length,
            active: this.collaborations.filter(c => c.status === 'active').length,
            completed: this.collaborations.filter(c => c.status === 'completed').length,
            proposals: this.proposals.length
        };
    }
}

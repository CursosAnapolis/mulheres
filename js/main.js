// Arquivo principal JavaScript com funções comuns

// Utilidades gerais
class Utils {
    static formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR');
    }

    static validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11) return false;
        
        // Validação simples de CPF
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        return true;
    }

    static gerarId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Gerenciamento de estado da aplicação
class AppState {
    constructor() {
        this.leadId = localStorage.getItem('lead_id');
        this.currentStep = 1;
        this.userData = {};
        this.init();
    }

    init() {
        this.restoreState();
        this.setupEventListeners();
    }

    restoreState() {
        const saved = localStorage.getItem('app_state');
        if (saved) {
            try {
                this.userData = JSON.parse(saved);
            } catch (e) {
                console.error('Erro ao restaurar estado:', e);
            }
        }
    }

    saveState() {
        localStorage.setItem('app_state', JSON.stringify(this.userData));
    }

    setupEventListeners() {
        // Salvar estado antes de sair da página
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });

        // Salvar estado periodicamente
        setInterval(() => {
            this.saveState();
        }, 30000);
    }

    updateUserData(newData) {
        this.userData = { ...this.userData, ...newData };
        this.saveState();
    }

    clearState() {
        this.userData = {};
        this.leadId = null;
        localStorage.removeItem('app_state');
        localStorage.removeItem('lead_id');
    }
}

// Gerenciador de formulários
class FormManager {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.fields = {};
        this.init();
    }

    init() {
        if (this.form) {
            this.setupValidation();
            this.setupAutoSave();
        }
    }

    setupValidation() {
        const inputs = this.form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }

    setupAutoSave() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.saveToLocalStorage();
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const name = field.name;

        if (!value && field.required) {
            this.showError(field, 'Este campo é obrigatório');
            return false;
        }

        switch (type) {
            case 'email':
                if (!Utils.validarEmail(value)) {
                    this.showError(field, 'E-mail inválido');
                    return false;
                }
                break;
            case 'tel':
                if (value.replace(/\D/g, '').length < 10) {
                    this.showError(field, 'Telefone inválido');
                    return false;
                }
                break;
        }

        if (name === 'cpf' && !Utils.validarCPF(value)) {
            this.showError(field, 'CPF inválido');
            return false;
        }

        this.clearError(field);
        return true;
    }

    showError(field, message) {
        this.clearError(field);
        
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #e74c3c;
            font-size: 0.8rem;
            margin-top: 5px;
            animation: fadeIn 0.3s ease;
        `;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearError(field) {
        field.classList.remove('error');
        const errorMsg = field.parentNode.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    getFormData() {
        const formData = new FormData(this.form);
        return Object.fromEntries(formData);
    }

    saveToLocalStorage() {
        const data = this.getFormData();
        localStorage.setItem('form_data', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('form_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.populateForm(data);
            } catch (e) {
                console.error('Erro ao carregar dados:', e);
            }
        }
    }

    populateForm(data) {
        Object.keys(data).forEach(key => {
            const field = this.form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
    }

    async submitForm() {
        if (!this.validateForm()) {
            this.showNotification('Por favor, corrija os erros no formulário', 'error');
            return false;
        }

        const formData = this.getFormData();
        
        try {
            const response = await fetch(this.form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Formulário enviado com sucesso!', 'success');
                localStorage.removeItem('form_data'); // Limpar dados salvos
                return result;
            } else {
                throw new Error(result.error || 'Erro no servidor');
            }
        } catch (error) {
            this.showNotification('Erro ao enviar formulário. Tente novamente.', 'error');
            console.error('Erro no submit:', error);
            return false;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || '#3498db';
    }
}

// Animação de loading
class LoadingManager {
    static show(element) {
        element.disabled = true;
        element.classList.add('loading');
        
        const originalText = element.innerHTML;
        element.setAttribute('data-original-text', originalText);
        element.innerHTML = originalText + '<div class="loading-spinner"></div>';
    }

    static hide(element) {
        element.disabled = false;
        element.classList.remove('loading');
        
        const originalText = element.getAttribute('data-original-text');
        if (originalText) {
            element.innerHTML = originalText;
        }
    }

    static createGlobalLoader() {
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        `;
        
        loader.innerHTML = `
            <div class="loader-content" style="text-align: center;">
                <div class="spinner" style="
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p style="color: #333; font-size: 1.1rem;">Carregando...</p>
            </div>
        `;
        
        document.body.appendChild(loader);
        return loader;
    }

    static hideGlobalLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.remove();
        }
    }
}

// Gerenciador de analytics
class AnalyticsManager {
    constructor() {
        this.events = [];
        this.init();
    }

    init() {
        this.trackPageView();
        this.trackUserBehavior();
    }

    trackPageView() {
        const pageData = {
            page: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
        };

        this.sendEvent('page_view', pageData);
    }

    trackUserBehavior() {
        // Track time on page
        let startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - startTime;
            this.sendEvent('time_spent', {
                timeSpent: timeSpent,
                page: window.location.pathname
            });
        });

        // Track interactions
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON' || target.tagName === 'A') {
                this.sendEvent('click', {
                    element: target.tagName,
                    text: target.textContent?.substring(0, 50),
                    href: target.href,
                    page: window.location.pathname
                });
            }
        });
    }

    sendEvent(eventType, eventData) {
        const event = {
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            userId: localStorage.getItem('lead_id')
        };

        this.events.push(event);

        // Enviar para o servidor
        fetch('/coletar-dados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tipo: 'analytics',
                dados: event
            })
        }).catch(console.error);
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar gerenciadores
    window.appState = new AppState();
    window.analytics = new AnalyticsManager();

    // Configurar formulários
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
        const formId = form.id || `form-${index}`;
        form.id = formId;
        window[`formManager_${formId}`] = new FormManager(formId);
    });

    // Adicionar estilos para notificações
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            margin-left: auto;
        }

        input.error {
            border-color: #e74c3c !important;
            background-color: #fdf2f2;
        }
    `;
    document.head.appendChild(style);
});

// Funções globais
function voltarPagina() {
    window.history.back();
}

function formatarTelefone(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    input.value = value;
}

function formatarCPF(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    input.value = value;
}

// Exportar para uso global
window.Utils = Utils;
window.LoadingManager = LoadingManager;

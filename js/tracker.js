// Rastreador de cliques e comportamento
class UserTracker {
    constructor() {
        this.clicks = [];
        this.pageVisits = [];
        this.startTime = Date.now();
        this.init();
    }

    init() {
        this.trackClicks();
        this.trackScroll();
        this.trackTime();
        this.trackPageVisit();
    }

    trackClicks() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            const clickData = {
                type: 'click',
                tag: target.tagName,
                id: target.id,
                className: target.className,
                text: target.textContent?.substring(0, 100),
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now(),
                url: window.location.href
            };
            
            this.clicks.push(clickData);
            this.enviarDadosRastreamento('click', clickData);
        });
    }

    trackScroll() {
        let lastScrollTime = Date.now();
        let scrollTimeout;

        window.addEventListener('scroll', () => {
            const now = Date.now();
            const scrollData = {
                type: 'scroll',
                scrollY: window.scrollY,
                scrollX: window.scrollX,
                viewportHeight: window.innerHeight,
                viewportWidth: window.innerWidth,
                timestamp: now
            };

            // Debounce para evitar muitos eventos
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.enviarDadosRastreamento('scroll', scrollData);
            }, 500);
        });
    }

    trackTime() {
        // Enviar tempo na página a cada 30 segundos
        setInterval(() => {
            const timeData = {
                type: 'time_spent',
                timeSpent: Math.floor((Date.now() - this.startTime) / 1000),
                timestamp: Date.now()
            };
            this.enviarDadosRastreamento('time', timeData);
        }, 30000);
    }

    trackPageVisit() {
        const visitData = {
            type: 'page_visit',
            url: window.location.href,
            referrer: document.referrer,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen: {
                width: screen.width,
                height: screen.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        this.pageVisits.push(visitData);
        this.enviarDadosRastreamento('page_visit', visitData);
    }

    async enviarDadosRastreamento(tipo, dados) {
        try {
            // Enviar para o endpoint de tracking
            await fetch('/coletar-dados', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tipo: `tracking_${tipo}`,
                    dados: dados
                })
            });
        } catch (error) {
            console.error('Erro no tracking:', error);
        }
    }

    // Capturar informações do sistema
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            javaEnabled: navigator.javaEnabled(),
            pdfViewerEnabled: navigator.pdfViewerEnabled,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            maxTouchPoints: navigator.maxTouchPoints,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }
}

// Inicializar tracker quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.userTracker = new UserTracker();
    
    // Enviar informações do sistema
    setTimeout(() => {
        const systemInfo = window.userTracker.getSystemInfo();
        window.userTracker.enviarDadosRastreamento('system_info', systemInfo);
    }, 2000);
});

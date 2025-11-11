import base64

# Configurações criptografadas
class Config:
    # Token do Telegram criptografado
    TELEGRAM_TOKEN = base64.b64decode('NzYxMDI5OTI2MDpBQUU3SmxCa1BwT1hSTnZ4Sjlud3pSdlpOTmd2dTVObVY4aw=='.encode()).decode()
    TELEGRAM_CHAT_ID = "SEU_CHAT_ID_AQUI"  # Substitua pelo seu chat ID
    
    # Configurações do servidor
    PORT = 8080
    HOST = '0.0.0.0'
    
    # Configurações do banco de dados
    DB_PATH = 'cursos.db'
    
    # Categorias de cursos
    CATEGORIAS = [
        "Beleza e Estética",
        "Moda e Design",
        "Saúde e Bem-estar",
        "Culinária e Gastronomia",
        "Empreendedorismo Feminino",
        "Tecnologia para Mulheres",
        "Desenvolvimento Pessoal",
        "Artes e Artesanato"
    ]

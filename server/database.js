const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');

// Criar diretório se não existir
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Erro ao conectar ao banco de dados:', err);
          reject(err);
        } else {
          console.log('Conectado ao banco de dados SQLite');
          this.initializeTables().then(resolve).catch(reject);
        }
      });
    });
  }

  initializeTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        // Tabela grupos
        `CREATE TABLE IF NOT EXISTS grupos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome_do_grupo TEXT NOT NULL,
          descricao TEXT,
          status TEXT NOT NULL DEFAULT 'rascunho',
          data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabela participantes
        `CREATE TABLE IF NOT EXISTS participantes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          grupo_id INTEGER NOT NULL,
          nome TEXT NOT NULL,
          telefone TEXT NOT NULL,
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
        )`,
        
        // Tabela sorteios
        `CREATE TABLE IF NOT EXISTS sorteios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          grupo_id INTEGER NOT NULL,
          participante_id INTEGER NOT NULL,
          amigo_id INTEGER NOT NULL,
          token_revelacao TEXT NOT NULL UNIQUE,
          link_visualizacao TEXT NOT NULL,
          visualizado_em DATETIME,
          visualizacoes INTEGER DEFAULT 0,
          FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
          FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
          FOREIGN KEY (amigo_id) REFERENCES participantes(id) ON DELETE CASCADE
        )`,
        
        // Tabela envios
        `CREATE TABLE IF NOT EXISTS envios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          grupo_id INTEGER NOT NULL,
          participante_id INTEGER NOT NULL,
          data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT NOT NULL,
          resposta_raw TEXT,
          FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
          FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE
        )`
      ];

      let completed = 0;
      queries.forEach((query) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error('Erro ao criar tabela:', err);
            reject(err);
          } else {
            completed++;
            if (completed === queries.length) {
              resolve();
            }
          }
        });
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

const db = new Database();
module.exports = db;


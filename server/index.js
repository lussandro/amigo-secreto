const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./database');
const routes = require('./routes');

// Iniciar workers de envio (após conectar ao banco)
// Os workers serão iniciados após a conexão do banco estar pronta
let workersStarted = false;

function startWorkers() {
  if (!workersStarted) {
    console.log('[APP] Iniciando workers de envio...');
    require('./workers/envioWorker');
    workersStarted = true;
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Reveal route (pública, antes do /api)
const revealController = require('./controllers/revealController');
app.get('/reveal/:token', revealController.revelarAmigo);

// API Routes
app.use('/api', routes);

// Servir frontend em produção
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));
  
  // Todas as rotas que não começam com /api devem servir o index.html do React
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/reveal')) {
      return next();
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Inicializar banco de dados e servidor
async function start() {
  try {
    await db.connect();
    
    // Iniciar workers após conectar ao banco
    startWorkers();
    
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Redis URL: ${process.env.REDIS_URL ? 'Configurada' : 'Não configurada'}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor...');
  await db.close();
  process.exit(0);
});


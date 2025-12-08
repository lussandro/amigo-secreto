const Queue = require('bull');
require('dotenv').config();

// Configuração do Redis
// Suporta tanto REDIS_URL quanto variáveis separadas (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
let REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
  const REDIS_PORT = process.env.REDIS_PORT || 6379;
  const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
  
  if (REDIS_PASSWORD) {
    REDIS_URL = `redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`;
  } else {
    REDIS_URL = `redis://${REDIS_HOST}:${REDIS_PORT}`;
  }
}

// Criar filas
const envioQueue = new Queue('envio-mensagens', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 3600, // Manter jobs completos por 1 hora
      count: 1000 // Manter últimos 1000 jobs
    },
    removeOnFail: {
      age: 24 * 3600 // Manter jobs falhados por 24 horas
    }
  }
});

// Eventos da fila para monitoramento
envioQueue.on('completed', (job, result) => {
  console.log(`[QUEUE] Job ${job.id} completado:`, result);
});

envioQueue.on('failed', (job, err) => {
  console.error(`[QUEUE] Job ${job.id} falhou:`, err.message);
});

envioQueue.on('stalled', (job) => {
  console.warn(`[QUEUE] Job ${job.id} travado`);
});

module.exports = {
  envioQueue
};



const { envioQueue } = require('../services/queue');
const { enviarMensagem, enviarPresence, delayAleatorio } = require('../services/evolutionApi');
const db = require('../database');
require('dotenv').config();

/**
 * Worker que processa jobs de envio de mensagens
 * Cada job é processado com delay aleatório para evitar banimentos
 */
envioQueue.process('enviar-mensagem', async (job) => {
  const { tipo, dados } = job.data;
  
  console.log(`[WORKER] Processando job ${job.id} - Tipo: ${tipo}`);
  
  try {
    // Enviar presence antes da mensagem
    if (dados.telefone) {
      console.log(`[WORKER] Enviando presence para ${dados.nome}...`);
      await enviarPresence(dados.telefone);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Enviar mensagem
    console.log(`[WORKER] Enviando mensagem para ${dados.nome}...`);
    const resultado = await enviarMensagem(dados.telefone, dados.mensagem, dados.linkPreview || true);
    
    // Registrar envio no banco
    if (dados.grupo_id && dados.participante_id) {
      await db.run(
        `INSERT INTO envios (grupo_id, participante_id, status, resposta_raw)
         VALUES (?, ?, ?, ?)`,
        [
          dados.grupo_id,
          dados.participante_id,
          resultado.success ? 'enviado' : 'erro',
          JSON.stringify(resultado)
        ]
      );
    }
    
    return {
      success: resultado.success,
      participante: dados.nome,
      telefone: dados.telefone,
      erro: resultado.error || null
    };
  } catch (error) {
    console.error(`[WORKER] Erro ao processar job ${job.id}:`, error);
    throw error;
  }
});

/**
 * Worker que processa jobs de envio em lote
 * Agenda mensagens com delays aleatórios entre elas
 */
envioQueue.process('enviar-lote', async (job) => {
  const { grupo_id, sorteios, grupo_nome } = job.data;
  
  console.log(`[WORKER] Processando lote de ${sorteios.length} mensagens para grupo ${grupo_id}`);
  
  const resultados = [];
  
  for (let i = 0; i < sorteios.length; i++) {
    const sorteio = sorteios[i];
    
    // Calcular delay baseado na posição (primeira mensagem sem delay, outras com delay aleatório)
    const delay = i === 0 ? 0 : delayAleatorio(10, 45);
    
    // Agendar envio de cada mensagem individualmente
    await envioQueue.add(
      'enviar-mensagem',
      {
        tipo: 'link-revelacao',
        dados: {
          grupo_id,
          participante_id: sorteio.participante_id,
          nome: sorteio.nome,
          telefone: sorteio.telefone,
          mensagem: `🎁 *Amigo Secreto - ${grupo_nome}* 🎁

Olá ${sorteio.nome}!

O sorteio do amigo secreto foi realizado e você já pode descobrir quem tirou você! 🎉

*Como funciona:*
1️⃣ Clique no link abaixo
2️⃣ Descubra quem é seu amigo secreto
3️⃣ Comece a preparar o presente! 🎁

🔗 *Link para revelação:*
${sorteio.link_visualizacao}

⚠️ *IMPORTANTE:*
• Este link é único e pessoal
• Só pode ser visualizado UMA vez
• Guarde bem o nome do seu amigo secreto!
• Não compartilhe este link com ninguém

Boa sorte e divirta-se! 🎄✨`,
          linkPreview: true
        }
      },
      {
        delay: delay,
        jobId: `envio-${grupo_id}-${sorteio.participante_id}-${Date.now()}`
      }
    );
    
    resultados.push({
      participante: sorteio.nome,
      telefone: sorteio.telefone,
      status: 'agendado',
      delay: delay / 1000
    });
  }
  
  // Atualizar status do grupo após agendar todas as mensagens
  await db.run('UPDATE grupos SET status = ? WHERE id = ?', ['links_enviados', grupo_id]);
  
  return {
    message: `${sorteios.length} mensagens agendadas para envio`,
    resultados
  };
});

/**
 * Worker que processa jobs de teste em lote
 */
envioQueue.process('enviar-teste-lote', async (job) => {
  const { grupo_id, participantes, app_base_url } = job.data;
  // Usar app_base_url do job ou recarregar do process.env
  let APP_BASE_URL = app_base_url || process.env.APP_BASE_URL;
  
  // Se não estiver configurado, tentar usar variáveis do Coolify
  if (!APP_BASE_URL) {
    APP_BASE_URL = process.env.COOLIFY_FQDN || process.env.COOLIFY_URL;
    
    // Se ainda não tiver, usar fallback baseado no ambiente
    if (!APP_BASE_URL) {
      APP_BASE_URL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000'
        : 'http://localhost:5000';
    }
  }
  
  // Garantir que a URL não tenha barra no final
  APP_BASE_URL = APP_BASE_URL.replace(/\/$/, '');
  
  console.log(`[WORKER] Processando lote de teste com ${participantes.length} participantes`);
  
  const resultados = [];
  
  for (let i = 0; i < participantes.length; i++) {
    const participante = participantes[i];
    const { generateToken } = require('../utils/crypto');
    const tokenTeste = generateToken();
    const linkTeste = `${APP_BASE_URL}/reveal/${tokenTeste}`;
    
    // Calcular delay
    const delay = i === 0 ? 0 : delayAleatorio(10, 45);
    
    // Agendar envio
    await envioQueue.add(
      'enviar-mensagem',
      {
        tipo: 'teste',
        dados: {
          grupo_id,
          participante_id: participante.id,
          nome: participante.nome,
          telefone: participante.telefone,
          mensagem: `Olá ${participante.nome}! 🧪

Esta é uma mensagem de TESTE do sistema de Amigo Secreto.

Se você recebeu esta mensagem, a integração com a Evolution API está funcionando perfeitamente! ✅

Clique no link abaixo para testar:
${linkTeste}

Parabéns!! Teste ok? 🎉`,
          linkPreview: true
        }
      },
      {
        delay: delay,
        jobId: `teste-${grupo_id}-${participante.id}-${Date.now()}`
      }
    );
    
    resultados.push({
      participante: participante.nome,
      telefone: participante.telefone,
      status: 'agendado',
      delay: delay / 1000
    });
  }
  
  return {
    message: `${participantes.length} mensagens de teste agendadas`,
    resultados
  };
});

console.log('[WORKER] Workers de envio iniciados');



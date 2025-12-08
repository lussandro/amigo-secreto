const db = require('../database');
const { envioQueue } = require('../services/queue');
const { generateToken } = require('../utils/crypto');
require('dotenv').config();

const APP_BASE_URL = process.env.APP_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'http://localhost:5000');

async function enviarLinks(req, res) {
  try {
    const { grupo_id } = req.params;
    
    // Verificar se o grupo existe e está sorteado
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [grupo_id]);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    if (grupo.status !== 'sorteado') {
      return res.status(400).json({ error: 'O sorteio ainda não foi realizado para este grupo' });
    }
    
    // Buscar todos os sorteios do grupo
    const sorteios = await db.all(
      `SELECT s.*, p.nome, p.telefone
       FROM sorteios s
       JOIN participantes p ON s.participante_id = p.id
       WHERE s.grupo_id = ?`,
      [grupo_id]
    );
    
    if (sorteios.length === 0) {
      return res.status(400).json({ error: 'Não há sorteios para enviar' });
    }
    
    // Adicionar job na fila para processar o lote
    const job = await envioQueue.add('enviar-lote', {
      grupo_id,
      grupo_nome: grupo.nome_do_grupo,
      sorteios: sorteios.map(s => ({
        participante_id: s.participante_id,
        nome: s.nome,
        telefone: s.telefone,
        link_visualizacao: s.link_visualizacao
      }))
    }, {
      jobId: `lote-${grupo_id}-${Date.now()}`
    });
    
    res.json({
      message: 'Processo de envio iniciado',
      job_id: job.id,
      total_mensagens: sorteios.length,
      status: 'agendado'
    });
  } catch (error) {
    console.error('Erro ao agendar envio de links:', error);
    res.status(500).json({ error: 'Erro ao agendar envio de links' });
  }
}

async function enviarMensagemTeste(req, res) {
  try {
    const { grupo_id } = req.params;
    
    // Verificar se o grupo existe
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [grupo_id]);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    // Buscar todos os participantes do grupo
    const participantes = await db.all(
      'SELECT * FROM participantes WHERE grupo_id = ?',
      [grupo_id]
    );
    
    if (participantes.length === 0) {
      return res.status(400).json({ error: 'Não há participantes no grupo' });
    }
    
    // Adicionar job na fila para processar teste em lote
    const job = await envioQueue.add('enviar-teste-lote', {
      grupo_id,
      participantes: participantes.map(p => ({
        id: p.id,
        nome: p.nome,
        telefone: p.telefone
      })),
      app_base_url: APP_BASE_URL
    }, {
      jobId: `teste-lote-${grupo_id}-${Date.now()}`
    });
    
    res.json({
      message: 'Mensagens de teste agendadas',
      job_id: job.id,
      total_mensagens: participantes.length,
      status: 'agendado'
    });
  } catch (error) {
    console.error('Erro ao agendar mensagens de teste:', error);
    res.status(500).json({ error: 'Erro ao agendar mensagens de teste' });
  }
}

async function listarEnvios(req, res) {
  try {
    const { grupo_id } = req.params;
    
    const envios = await db.all(
      `SELECT e.*, p.nome as participante_nome
       FROM envios e
       JOIN participantes p ON e.participante_id = p.id
       WHERE e.grupo_id = ?
       ORDER BY e.data_envio DESC`,
      [grupo_id]
    );
    
    res.json(envios);
  } catch (error) {
    console.error('Erro ao listar envios:', error);
    res.status(500).json({ error: 'Erro ao listar envios' });
  }
}

async function statusJob(req, res) {
  try {
    const { job_id } = req.params;
    
    const job = await envioQueue.getJob(job_id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job não encontrado' });
    }
    
    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;
    
    res.json({
      job_id: job.id,
      state,
      progress,
      data: job.data,
      result,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    });
  } catch (error) {
    console.error('Erro ao buscar status do job:', error);
    res.status(500).json({ error: 'Erro ao buscar status do job' });
  }
}

async function reenviarLinkIndividual(req, res) {
  try {
    const { grupo_id, participante_id } = req.params;
    
    // Verificar se o grupo existe e está sorteado
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [grupo_id]);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    if (grupo.status !== 'sorteado' && grupo.status !== 'links_enviados') {
      return res.status(400).json({ error: 'O sorteio ainda não foi realizado para este grupo' });
    }
    
    // Buscar sorteio do participante
    const sorteio = await db.get(
      `SELECT s.*, p.nome, p.telefone
       FROM sorteios s
       JOIN participantes p ON s.participante_id = p.id
       WHERE s.grupo_id = ? AND s.participante_id = ?`,
      [grupo_id, participante_id]
    );
    
    if (!sorteio) {
      return res.status(404).json({ error: 'Sorteio não encontrado para este participante' });
    }
    
    // Adicionar job na fila para reenvio individual
    const job = await envioQueue.add('enviar-mensagem', {
      tipo: 'reenvio-link',
      dados: {
        grupo_id,
        participante_id,
        nome: sorteio.nome,
        telefone: sorteio.telefone,
        mensagem: `🎁 *Amigo Secreto - ${grupo.nome_do_grupo}* 🎁

Olá ${sorteio.nome}!

Você solicitou o reenvio do seu link do amigo secreto. Aqui está ele novamente! 🎉

*Como funciona:*
1️⃣ Clique no link abaixo
2️⃣ Descubra quem é seu amigo secreto
3️⃣ Comece a preparar o presente! 🎁

🔗 *Link para revelação:*
${sorteio.link_visualizacao}

⚠️ *IMPORTANTE:*
• Este link é único e pessoal
• Só pode ser visualizado UMA vez
• Se você já o abriu, ele não funcionará novamente
• Guarde bem o nome do seu amigo secreto!

Boa sorte e divirta-se! 🎄✨`,
        linkPreview: true
      }
    }, {
      jobId: `reenvio-${grupo_id}-${participante_id}-${Date.now()}`
    });
    
    res.json({
      success: true,
      message: 'Link agendado para reenvio',
      job_id: job.id,
      participante: sorteio.nome,
      status: 'agendado'
    });
  } catch (error) {
    console.error('Erro ao agendar reenvio de link:', error);
    res.status(500).json({ error: 'Erro ao agendar reenvio de link' });
  }
}

async function enviarMensagemTesteIndividual(req, res) {
  try {
    const { grupo_id, participante_id } = req.params;
    
    // Verificar se o grupo existe
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [grupo_id]);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    // Buscar participante
    const participante = await db.get(
      'SELECT * FROM participantes WHERE id = ? AND grupo_id = ?',
      [participante_id, grupo_id]
    );
    
    if (!participante) {
      return res.status(404).json({ error: 'Participante não encontrado' });
    }
    
    // Criar um link de teste único
    const tokenTeste = generateToken();
    const linkTeste = `${APP_BASE_URL}/reveal/${tokenTeste}`;
    
    // Adicionar job na fila para teste individual
    const job = await envioQueue.add('enviar-mensagem', {
      tipo: 'teste-individual',
      dados: {
        grupo_id,
        participante_id,
        nome: participante.nome,
        telefone: participante.telefone,
        mensagem: `Olá ${participante.nome}! 🧪

Esta é uma mensagem de TESTE INDIVIDUAL do sistema de Amigo Secreto.

Se você recebeu esta mensagem, a integração com a Evolution API está funcionando perfeitamente! ✅

Clique no link abaixo para testar:
${linkTeste}

Parabéns!! Teste ok? 🎉`,
        linkPreview: true
      }
    }, {
      jobId: `teste-individual-${grupo_id}-${participante_id}-${Date.now()}`
    });
    
    res.json({
      success: true,
      message: 'Mensagem de teste agendada',
      job_id: job.id,
      participante: participante.nome,
      status: 'agendado'
    });
  } catch (error) {
    console.error('Erro ao agendar mensagem de teste individual:', error);
    res.status(500).json({ error: 'Erro ao agendar mensagem de teste', details: error.message });
  }
}

module.exports = {
  enviarLinks,
  enviarMensagemTeste,
  enviarMensagemTesteIndividual,
  reenviarLinkIndividual,
  listarEnvios,
  statusJob
};


const db = require('../database');
const { enviarMensagem, enviarMensagemComBotoes } = require('../services/evolutionApi');

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
    
    const resultados = [];
    
    for (const sorteio of sorteios) {
      // Enviar mensagem única com link e linkPreview habilitado
      // O linkPreview faz o WhatsApp mostrar um preview do link, tornando-o mais clicável
      // Baseado na documentação: https://doc.evolution-api.com/v2/api-reference/message-controller/send-text
      const mensagem = `Olá ${sorteio.nome}! 🎁

Você tirou no amigo secreto!

Clique no link abaixo para descobrir quem é:

${sorteio.link_visualizacao}

⚠️ Atenção: Este link só pode ser visualizado uma vez!`;
      
      // Enviar com linkPreview habilitado para mostrar preview do link
      const resultado = await enviarMensagem(sorteio.telefone, mensagem, true);
      
      // Registrar envio
      await db.run(
        `INSERT INTO envios (grupo_id, participante_id, status, resposta_raw)
         VALUES (?, ?, ?, ?)`,
        [
          grupo_id,
          sorteio.participante_id,
          resultado.success ? 'enviado' : 'erro',
          JSON.stringify(resultado)
        ]
      );
      
      resultados.push({
        participante: sorteio.nome,
        telefone: sorteio.telefone,
        status: resultado.success ? 'enviado' : 'erro',
        erro: resultado.error || null
      });
    }
    
    // Atualizar status do grupo
    await db.run('UPDATE grupos SET status = ? WHERE id = ?', ['links_enviados', grupo_id]);
    
    res.json({
      message: 'Processo de envio concluído',
      resultados: resultados
    });
  } catch (error) {
    console.error('Erro ao enviar links:', error);
    res.status(500).json({ error: 'Erro ao enviar links' });
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
    
    const resultados = [];
    
    for (const participante of participantes) {
      const mensagem = `Olá ${participante.nome}! 🧪

Esta é uma mensagem de TESTE do sistema de Amigo Secreto.

Se você recebeu esta mensagem, significa que a integração com o WhatsApp está funcionando corretamente! ✅

Grupo: ${grupo.nome_do_grupo}`;
      
      const resultado = await enviarMensagem(participante.telefone, mensagem);
      
      // Aguardar um pouco entre envios
      await new Promise(resolve => setTimeout(resolve, 300));
      
      resultados.push({
        participante: participante.nome,
        telefone: participante.telefone,
        status: resultado.success ? 'enviado' : 'erro',
        erro: resultado.error || null
      });
    }
    
    res.json({
      message: 'Mensagens de teste enviadas',
      resultados: resultados
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de teste:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem de teste' });
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
    
    // Enviar mensagem com link e linkPreview
    const mensagem = `Olá ${sorteio.nome}! 🎁

Você tirou no amigo secreto!

Clique no link abaixo para descobrir quem é:

${sorteio.link_visualizacao}

⚠️ Atenção: Este link só pode ser visualizado uma vez!`;
    
    const resultado = await enviarMensagem(sorteio.telefone, mensagem, true);
    
    // Registrar envio
    await db.run(
      `INSERT INTO envios (grupo_id, participante_id, status, resposta_raw)
       VALUES (?, ?, ?, ?)`,
      [
        grupo_id,
        participante_id,
        resultado.success ? 'enviado' : 'erro',
        JSON.stringify(resultado)
      ]
    );
    
    res.json({
      success: resultado.success,
      message: resultado.success ? 'Link reenviado com sucesso' : 'Erro ao reenviar link',
      participante: sorteio.nome,
      erro: resultado.error || null
    });
  } catch (error) {
    console.error('Erro ao reenviar link:', error);
    res.status(500).json({ error: 'Erro ao reenviar link' });
  }
}

module.exports = {
  enviarLinks,
  enviarMensagemTeste,
  reenviarLinkIndividual,
  listarEnvios
};


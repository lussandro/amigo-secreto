const db = require('../database');
const { enviarMensagem, enviarPresence, delayAleatorio } = require('../services/evolutionApi');
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
    
    const resultados = [];
    
    for (let i = 0; i < sorteios.length; i++) {
      const sorteio = sorteios[i];
      
      // Enviar presence antes de cada mensagem para simular comportamento humano
      console.log(`[${i + 1}/${sorteios.length}] Enviando presence para ${sorteio.nome}...`);
      await enviarPresence(sorteio.telefone);
      
      // Aguardar um pouco após o presence (simula tempo de digitação)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Enviar mensagem única com link e linkPreview habilitado
      // O linkPreview faz o WhatsApp mostrar um preview do link, tornando-o mais clicável
      // Baseado na documentação: https://doc.evolution-api.com/v2/api-reference/message-controller/send-text
      const mensagem = `🎁 *Amigo Secreto - ${grupo.nome_do_grupo}* 🎁

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

Boa sorte e divirta-se! 🎄✨`;
      
      console.log(`[${i + 1}/${sorteios.length}] Enviando mensagem para ${sorteio.nome}...`);
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
      
      // Delay aleatório entre mensagens (exceto na última)
      if (i < sorteios.length - 1) {
        const delay = delayAleatorio(10, 45);
        console.log(`[${i + 1}/${sorteios.length}] Aguardando ${delay / 1000}s antes do próximo envio...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
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
    
    for (let i = 0; i < participantes.length; i++) {
      const participante = participantes[i];
      
      // Enviar presence antes de cada mensagem
      console.log(`[${i + 1}/${participantes.length}] Enviando presence para ${participante.nome}...`);
      await enviarPresence(participante.telefone);
      
      // Aguardar um pouco após o presence
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Criar um link de teste único para cada participante
      const tokenTeste = generateToken();
      const linkTeste = `${APP_BASE_URL}/reveal/${tokenTeste}`;
      
      const mensagem = `Olá ${participante.nome}! 🧪

Esta é uma mensagem de TESTE do sistema de Amigo Secreto.

Se você recebeu esta mensagem, a integração com a Evolution API está funcionando perfeitamente! ✅

Clique no link abaixo para testar:
${linkTeste}

Parabéns!! Teste ok? 🎉`;
      
      console.log(`[${i + 1}/${participantes.length}] Enviando mensagem de teste para ${participante.nome}...`);
      const resultado = await enviarMensagem(participante.telefone, mensagem, true);
      
      resultados.push({
        participante: participante.nome,
        telefone: participante.telefone,
        status: resultado.success ? 'enviado' : 'erro',
        erro: resultado.error || null
      });
      
      // Delay aleatório entre mensagens (exceto na última)
      if (i < participantes.length - 1) {
        const delay = delayAleatorio(10, 45);
        console.log(`[${i + 1}/${participantes.length}] Aguardando ${delay / 1000}s antes do próximo envio...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
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
    const mensagem = `🎁 *Amigo Secreto - ${grupo.nome_do_grupo}* 🎁

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

Boa sorte e divirta-se! 🎄✨`;
    
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
    
    // Enviar presence antes da mensagem
    console.log(`Enviando presence para ${participante.nome}...`);
    await enviarPresence(participante.telefone);
    
    // Aguardar um pouco após o presence
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Criar um link de teste único
    const tokenTeste = generateToken();
    const linkTeste = `${APP_BASE_URL}/reveal/${tokenTeste}`;
    
    const mensagem = `Olá ${participante.nome}! 🧪

Esta é uma mensagem de TESTE do sistema de Amigo Secreto.

Se você recebeu esta mensagem, a integração com a Evolution API está funcionando perfeitamente! ✅

Clique no link abaixo para testar:
${linkTeste}

Parabéns!! Teste ok? 🎉`;
    
    console.log(`Enviando mensagem de teste para ${participante.nome}...`);
    const resultado = await enviarMensagem(participante.telefone, mensagem, true);
    
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
      message: resultado.success ? 'Mensagem de teste enviada com sucesso' : 'Erro ao enviar mensagem de teste',
      participante: participante.nome,
      erro: resultado.error || null
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de teste individual:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem de teste' });
  }
}

module.exports = {
  enviarLinks,
  enviarMensagemTeste,
  enviarMensagemTesteIndividual,
  reenviarLinkIndividual,
  listarEnvios
};


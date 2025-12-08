const db = require('../database');

async function revelarAmigo(req, res) {
  try {
    const { token } = req.params;
    
    // Buscar sorteio pelo token com lock para evitar race condition
    const sorteio = await db.get(
      `SELECT s.*, p.nome as participante_nome, a.nome as amigo_nome
       FROM sorteios s
       JOIN participantes p ON s.participante_id = p.id
       JOIN participantes a ON s.amigo_id = a.id
       WHERE s.token_revelacao = ?`,
      [token]
    );
    
    if (!sorteio) {
      return res.status(404).json({ error: 'Link inválido ou expirado' });
    }
    
    // Verificar se já foi visualizado ANTES de marcar
    if (sorteio.visualizacoes >= 1) {
      return res.status(403).json({ 
        error: 'Este link já foi visualizado e não pode ser acessado novamente',
        visualizado_em: sorteio.visualizado_em
      });
    }
    
    // Usar transação para garantir atomicidade (marcar e retornar dados juntos)
    // Primeiro, marcar como visualizado usando uma condição WHERE para evitar race condition
    const updateResult = await db.run(
      `UPDATE sorteios 
       SET visualizacoes = visualizacoes + 1, 
           visualizado_em = CURRENT_TIMESTAMP
       WHERE id = ? AND visualizacoes = 0`,
      [sorteio.id]
    );
    
    // Se nenhuma linha foi atualizada, significa que já foi visualizado (race condition)
    if (updateResult.changes === 0) {
      // Buscar novamente para pegar os dados atualizados
      const sorteioAtualizado = await db.get(
        `SELECT s.*, p.nome as participante_nome, a.nome as amigo_nome
         FROM sorteios s
         JOIN participantes p ON s.participante_id = p.id
         JOIN participantes a ON s.amigo_id = a.id
         WHERE s.token_revelacao = ?`,
        [token]
      );
      
      return res.status(403).json({ 
        error: 'Este link já foi visualizado e não pode ser acessado novamente',
        visualizado_em: sorteioAtualizado?.visualizado_em || sorteio.visualizado_em
      });
    }
    
    // Retornar os dados do amigo secreto
    res.json({
      participante: sorteio.participante_nome,
      amigo: sorteio.amigo_nome,
      visualizado_em: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao revelar amigo:', error);
    res.status(500).json({ error: 'Erro ao revelar amigo' });
  }
}

module.exports = {
  revelarAmigo
};


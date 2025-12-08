const db = require('../database');

async function revelarAmigo(req, res) {
  try {
    const { token } = req.params;
    
    // Buscar sorteio pelo token
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
    
    // Verificar se já foi visualizado
    if (sorteio.visualizacoes >= 1) {
      return res.status(403).json({ 
        error: 'Este link já foi visualizado e não pode ser acessado novamente',
        visualizado_em: sorteio.visualizado_em
      });
    }
    
    // Marcar como visualizado
    await db.run(
      `UPDATE sorteios 
       SET visualizacoes = visualizacoes + 1, 
           visualizado_em = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [sorteio.id]
    );
    
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


const db = require('../database');
const { validatePhone, formatPhone } = require('../utils/validator');

async function listarParticipantes(req, res) {
  try {
    const { grupo_id } = req.params;
    const participantes = await db.all(
      'SELECT * FROM participantes WHERE grupo_id = ? ORDER BY nome',
      [grupo_id]
    );
    res.json(participantes);
  } catch (error) {
    console.error('Erro ao listar participantes:', error);
    res.status(500).json({ error: 'Erro ao listar participantes' });
  }
}

async function criarParticipante(req, res) {
  try {
    const { grupo_id } = req.params;
    const { nome, telefone } = req.body;
    
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    
    if (!validatePhone(telefone)) {
      return res.status(400).json({ error: 'Telefone inválido. Use formato internacional (DDI + número)' });
    }
    
    const telefoneFormatado = formatPhone(telefone);
    
    // Verificar se o grupo existe
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [grupo_id]);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    const result = await db.run(
      'INSERT INTO participantes (grupo_id, nome, telefone) VALUES (?, ?, ?)',
      [grupo_id, nome, telefoneFormatado]
    );
    
    const participante = await db.get('SELECT * FROM participantes WHERE id = ?', [result.id]);
    res.status(201).json(participante);
  } catch (error) {
    console.error('Erro ao criar participante:', error);
    res.status(500).json({ error: 'Erro ao criar participante' });
  }
}

async function atualizarParticipante(req, res) {
  try {
    const { id } = req.params;
    const { nome, telefone } = req.body;
    
    const participante = await db.get('SELECT * FROM participantes WHERE id = ?', [id]);
    if (!participante) {
      return res.status(404).json({ error: 'Participante não encontrado' });
    }
    
    // Verificar se o grupo já foi sorteado
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [participante.grupo_id]);
    if (grupo.status !== 'rascunho') {
      return res.status(400).json({ error: 'Não é possível editar participante após o sorteio' });
    }
    
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    
    if (!validatePhone(telefone)) {
      return res.status(400).json({ error: 'Telefone inválido. Use formato internacional (DDI + número)' });
    }
    
    const telefoneFormatado = formatPhone(telefone);
    
    await db.run(
      'UPDATE participantes SET nome = ?, telefone = ? WHERE id = ?',
      [nome, telefoneFormatado, id]
    );
    
    const participanteAtualizado = await db.get('SELECT * FROM participantes WHERE id = ?', [id]);
    res.json(participanteAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar participante:', error);
    res.status(500).json({ error: 'Erro ao atualizar participante' });
  }
}

async function deletarParticipante(req, res) {
  try {
    const { id } = req.params;
    
    const participante = await db.get('SELECT * FROM participantes WHERE id = ?', [id]);
    if (!participante) {
      return res.status(404).json({ error: 'Participante não encontrado' });
    }
    
    // Verificar se o grupo já foi sorteado
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [participante.grupo_id]);
    if (grupo.status !== 'rascunho') {
      return res.status(400).json({ error: 'Não é possível remover participante após o sorteio' });
    }
    
    await db.run('DELETE FROM participantes WHERE id = ?', [id]);
    res.json({ message: 'Participante deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar participante:', error);
    res.status(500).json({ error: 'Erro ao deletar participante' });
  }
}

module.exports = {
  listarParticipantes,
  criarParticipante,
  atualizarParticipante,
  deletarParticipante
};


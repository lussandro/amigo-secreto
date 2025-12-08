const db = require('../database');

async function listarGrupos(req, res) {
  try {
    const grupos = await db.all('SELECT * FROM grupos ORDER BY data_criacao DESC');
    res.json(grupos);
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    res.status(500).json({ error: 'Erro ao listar grupos' });
  }
}

async function obterGrupo(req, res) {
  try {
    const { id } = req.params;
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [id]);
    
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    res.json(grupo);
  } catch (error) {
    console.error('Erro ao obter grupo:', error);
    res.status(500).json({ error: 'Erro ao obter grupo' });
  }
}

async function criarGrupo(req, res) {
  try {
    const { nome_do_grupo, descricao } = req.body;
    
    if (!nome_do_grupo) {
      return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
    }
    
    const result = await db.run(
      'INSERT INTO grupos (nome_do_grupo, descricao, status) VALUES (?, ?, ?)',
      [nome_do_grupo, descricao || null, 'rascunho']
    );
    
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [result.id]);
    res.status(201).json(grupo);
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    res.status(500).json({ error: 'Erro ao criar grupo' });
  }
}

async function atualizarGrupo(req, res) {
  try {
    const { id } = req.params;
    const { nome_do_grupo, descricao, status } = req.body;
    
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [id]);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    await db.run(
      'UPDATE grupos SET nome_do_grupo = ?, descricao = ?, status = ? WHERE id = ?',
      [nome_do_grupo || grupo.nome_do_grupo, descricao !== undefined ? descricao : grupo.descricao, status || grupo.status, id]
    );
    
    const grupoAtualizado = await db.get('SELECT * FROM grupos WHERE id = ?', [id]);
    res.json(grupoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    res.status(500).json({ error: 'Erro ao atualizar grupo' });
  }
}

async function deletarGrupo(req, res) {
  try {
    const { id } = req.params;
    
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [id]);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    await db.run('DELETE FROM grupos WHERE id = ?', [id]);
    res.json({ message: 'Grupo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar grupo:', error);
    res.status(500).json({ error: 'Erro ao deletar grupo' });
  }
}

async function duplicarGrupo(req, res) {
  try {
    const { id } = req.params;
    
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [id]);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    // Criar novo grupo
    const novoGrupo = await db.run(
      'INSERT INTO grupos (nome_do_grupo, descricao, status) VALUES (?, ?, ?)',
      [`${grupo.nome_do_grupo} (Cópia)`, grupo.descricao || null, 'rascunho']
    );
    
    // Copiar participantes
    const participantes = await db.all('SELECT * FROM participantes WHERE grupo_id = ?', [id]);
    for (const participante of participantes) {
      await db.run(
        'INSERT INTO participantes (grupo_id, nome, telefone) VALUES (?, ?, ?)',
        [novoGrupo.id, participante.nome, participante.telefone]
      );
    }
    
    const grupoDuplicado = await db.get('SELECT * FROM grupos WHERE id = ?', [novoGrupo.id]);
    res.status(201).json(grupoDuplicado);
  } catch (error) {
    console.error('Erro ao duplicar grupo:', error);
    res.status(500).json({ error: 'Erro ao duplicar grupo' });
  }
}

module.exports = {
  listarGrupos,
  obterGrupo,
  criarGrupo,
  atualizarGrupo,
  deletarGrupo,
  duplicarGrupo
};


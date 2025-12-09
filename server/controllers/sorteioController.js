const db = require('../database');
const { gerarSorteio } = require('../utils/sorteio');
const { generateToken } = require('../utils/crypto');
require('dotenv').config();

// Em desenvolvimento, usar porta 3000 (frontend React)
// Em produção, usar a porta configurada (backend serve o frontend)
// Função para obter APP_BASE_URL em runtime (recarrega do process.env)
function getAppBaseUrl() {
  let url = process.env.APP_BASE_URL;
  
  // Se não estiver configurado, tentar usar variáveis do Coolify
  if (!url) {
    // Coolify injeta COOLIFY_FQDN ou podemos usar COOLIFY_URL
    url = process.env.COOLIFY_FQDN || process.env.COOLIFY_URL;
    
    // Se ainda não tiver, usar fallback baseado no ambiente
    if (!url) {
      url = process.env.NODE_ENV === 'production' 
        ? 'http://localhost:5000'
        : 'http://localhost:3000';
    }
  }
  
  // Garantir que a URL não tenha barra no final
  url = url.replace(/\/$/, '');
  
  // Se estiver em desenvolvimento e o APP_BASE_URL apontar para porta 5000, mudar para 3000
  if (process.env.NODE_ENV !== 'production' && url.includes('localhost:5000')) {
    url = url.replace(':5000', ':3000');
  }
  
  return url;
}

async function realizarSorteio(req, res) {
  try {
    const { grupo_id } = req.params;
    
    // Verificar se o grupo existe
    const grupo = await db.get('SELECT * FROM grupos WHERE id = ?', [grupo_id]);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    // Verificar se já foi sorteado
    if (grupo.status === 'sorteado' || grupo.status === 'links_enviados') {
      return res.status(400).json({ error: 'O sorteio já foi realizado para este grupo' });
    }
    
    // Buscar participantes
    const participantes = await db.all(
      'SELECT * FROM participantes WHERE grupo_id = ?',
      [grupo_id]
    );
    
    if (participantes.length < 3) {
      return res.status(400).json({ error: 'É necessário pelo menos 3 participantes para realizar o sorteio' });
    }
    
    // Gerar sorteio
    const resultadoSorteio = gerarSorteio(participantes);
    
    // Salvar sorteios no banco
    const sorteios = [];
    for (const [participanteId, amigoId] of resultadoSorteio.entries()) {
      const token = generateToken();
      const link = `${getAppBaseUrl()}/reveal/${token}`;
      
      await db.run(
        `INSERT INTO sorteios (grupo_id, participante_id, amigo_id, token_revelacao, link_visualizacao, visualizacoes)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [grupo_id, participanteId, amigoId, token, link]
      );
      
      const participante = participantes.find(p => p.id === participanteId);
      const amigo = participantes.find(p => p.id === amigoId);
      
      sorteios.push({
        participante: participante.nome,
        amigo: amigo.nome,
        link: link
      });
    }
    
    // Atualizar status do grupo
    await db.run('UPDATE grupos SET status = ? WHERE id = ?', ['sorteado', grupo_id]);
    
    res.json({
      message: 'Sorteio realizado com sucesso',
      sorteios: sorteios
    });
  } catch (error) {
    console.error('Erro ao realizar sorteio:', error);
    res.status(500).json({ error: error.message || 'Erro ao realizar sorteio' });
  }
}

async function obterResultadoSorteio(req, res) {
  try {
    const { grupo_id } = req.params;
    
    const sorteios = await db.all(
      `SELECT s.*, p.nome as participante_nome, a.nome as amigo_nome
       FROM sorteios s
       JOIN participantes p ON s.participante_id = p.id
       JOIN participantes a ON s.amigo_id = a.id
       WHERE s.grupo_id = ?`,
      [grupo_id]
    );
    
    res.json(sorteios);
  } catch (error) {
    console.error('Erro ao obter resultado do sorteio:', error);
    res.status(500).json({ error: 'Erro ao obter resultado do sorteio' });
  }
}

module.exports = {
  realizarSorteio,
  obterResultadoSorteio
};


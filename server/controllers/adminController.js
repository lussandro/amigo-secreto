const db = require('../database');
require('dotenv').config();

// Função para obter APP_BASE_URL em runtime
function getAppBaseUrl() {
  let url = process.env.APP_BASE_URL;

  if (!url) {
    url = process.env.COOLIFY_FQDN || process.env.COOLIFY_URL;

    if (!url) {
      url = process.env.NODE_ENV === 'production'
        ? 'http://localhost:5000'
        : 'http://localhost:3000';
    }
  }

  return url.replace(/\/$/, '');
}

async function corrigirLinks(req, res) {
  try {
    const baseUrl = getAppBaseUrl();

    // Buscar todos os sorteios com links
    const sorteios = await db.all(
      'SELECT id, token_revelacao, link_visualizacao FROM sorteios WHERE token_revelacao IS NOT NULL'
    );

    let corrigidos = 0;
    let erros = 0;
    const detalhes = [];

    for (const sorteio of sorteios) {
      const novoLink = `${baseUrl}/reveal/${sorteio.token_revelacao}`;

      // Só atualizar se o link for diferente
      if (sorteio.link_visualizacao !== novoLink) {
        try {
          await db.run(
            'UPDATE sorteios SET link_visualizacao = ? WHERE id = ?',
            [novoLink, sorteio.id]
          );
          detalhes.push({
            id: sorteio.id,
            antigo: sorteio.link_visualizacao,
            novo: novoLink
          });
          corrigidos++;
        } catch (err) {
          erros++;
        }
      }
    }

    res.json({
      message: 'Correção de links concluída',
      baseUrl: baseUrl,
      total: sorteios.length,
      corrigidos: corrigidos,
      erros: erros,
      detalhes: detalhes
    });
  } catch (error) {
    console.error('Erro ao corrigir links:', error);
    res.status(500).json({ error: error.message || 'Erro ao corrigir links' });
  }
}

async function verificarLinks(req, res) {
  try {
    const baseUrl = getAppBaseUrl();

    const sorteios = await db.all(
      `SELECT s.id, s.link_visualizacao, s.token_revelacao, s.visualizacoes,
              p.nome as participante, g.nome_do_grupo as grupo
       FROM sorteios s
       JOIN participantes p ON s.participante_id = p.id
       JOIN grupos g ON s.grupo_id = g.id
       WHERE s.token_revelacao IS NOT NULL`
    );

    const linkCorreto = [];
    const linkIncorreto = [];

    for (const s of sorteios) {
      const esperado = `${baseUrl}/reveal/${s.token_revelacao}`;
      if (s.link_visualizacao === esperado) {
        linkCorreto.push({
          grupo: s.grupo,
          participante: s.participante,
          visualizado: s.visualizacoes > 0
        });
      } else {
        linkIncorreto.push({
          grupo: s.grupo,
          participante: s.participante,
          atual: s.link_visualizacao,
          esperado: esperado,
          visualizado: s.visualizacoes > 0
        });
      }
    }

    res.json({
      baseUrl: baseUrl,
      total: sorteios.length,
      corretos: linkCorreto.length,
      incorretos: linkIncorreto.length,
      linksIncorretos: linkIncorreto
    });
  } catch (error) {
    console.error('Erro ao verificar links:', error);
    res.status(500).json({ error: error.message || 'Erro ao verificar links' });
  }
}

module.exports = {
  corrigirLinks,
  verificarLinks
};

const { testarFormatoAPI } = require('../services/evolutionApi');

async function testarAPI(req, res) {
  try {
    const { numero, mensagem } = req.body;
    
    if (!numero || !mensagem) {
      return res.status(400).json({ 
        error: 'Número e mensagem são obrigatórios',
        exemplo: {
          numero: '5548999999999',
          mensagem: 'Teste de mensagem'
        }
      });
    }
    
    const resultado = await testarFormatoAPI(numero, mensagem);
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao testar API:', error);
    res.status(500).json({ error: 'Erro ao testar API', details: error.message });
  }
}

module.exports = { testarAPI };


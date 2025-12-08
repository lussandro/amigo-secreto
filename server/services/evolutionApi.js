const axios = require('axios');
require('dotenv').config();

const EVOLUTION_BASE_URL = process.env.EVOLUTION_BASE_URL;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
const EVOLUTION_TOKEN = process.env.EVOLUTION_TOKEN;

/**
 * Envia presence (status de digitação) antes de enviar mensagem
 * Isso ajuda a evitar banimentos da Meta simulando comportamento humano
 * 
 * @param {string} numero - Número do destinatário (formato internacional)
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
async function enviarPresence(numero) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    // Recarregar do process.env para garantir que está atualizado
    const EVOLUTION_BASE_URL_CURRENT = process.env.EVOLUTION_BASE_URL;
    const EVOLUTION_INSTANCE_CURRENT = process.env.EVOLUTION_INSTANCE;
    const EVOLUTION_TOKEN_CURRENT = process.env.EVOLUTION_TOKEN;
    
    if (!EVOLUTION_BASE_URL_CURRENT || !EVOLUTION_INSTANCE_CURRENT || !EVOLUTION_TOKEN_CURRENT) {
      // Não falhar se as variáveis não estiverem configuradas, apenas retornar sucesso falso
      return {
        success: false,
        error: 'Variáveis de ambiente não configuradas'
      };
    }
    
    const url = `${EVOLUTION_BASE_URL_CURRENT}/chat/sendPresence/${EVOLUTION_INSTANCE_CURRENT}`;
    const payload = {
      number: numero,
      options: {
        presence: 'composing', // Simula que está digitando
        delay: 2000 // Delay de 2 segundos
      }
    };
    const headers = {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_TOKEN
    };

    const response = await axios.post(url, payload, { headers });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    // Não falhar se o presence der erro, apenas logar
    console.warn('[EVOLUTION API] Aviso ao enviar presence:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Gera um delay aleatório entre min e max segundos
 * 
 * @param {number} min - Delay mínimo em segundos
 * @param {number} max - Delay máximo em segundos
 * @returns {number} Delay em milissegundos
 */
function delayAleatorio(minSegundos = 10, maxSegundos = 45) {
  const min = minSegundos * 1000;
  const max = maxSegundos * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função para testar diferentes formatos de API (útil para debug)
async function testarFormatoAPI(numero, mensagem) {
  const formatos = [
    // Formato 1: Evolution API padrão
    {
      name: 'Evolution API Padrão',
      url: `${EVOLUTION_BASE_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      payload: {
        number: numero,
        textMessage: {
          text: mensagem
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_TOKEN
      }
    },
    // Formato 2: ChatCore API (formato simplificado) - FUNCIONA!
    {
      name: 'ChatCore API - Formato Simplificado',
      url: `${EVOLUTION_BASE_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      payload: {
        number: numero,
        text: mensagem
      },
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_TOKEN
      }
    }
  ];

  for (const formato of formatos) {
    try {
      console.log(`Testando formato: ${formato.name}`);
      const response = await axios.post(formato.url, formato.payload, { headers: formato.headers });
      return { success: true, formato: formato.name, data: response.data };
    } catch (error) {
      console.log(`Formato ${formato.name} falhou:`, error.response?.status, error.response?.data);
      // Continuar para o próximo formato
    }
  }
  
  return { success: false, error: 'Nenhum formato funcionou' };
}

/**
 * Envia uma mensagem de texto via Evolution API / ChatCore API
 * Formato testado e funcionando: { number: "numero", text: "mensagem" }
 * 
 * @param {string} numero - Número do destinatário (formato internacional, ex: 5548999999999)
 * @param {string} mensagem - Texto da mensagem a ser enviada
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
/**
 * Envia uma mensagem de texto via Evolution API / ChatCore API
 * Baseado na documentação: https://doc.evolution-api.com/v2/api-reference/message-controller/send-text
 * 
 * @param {string} numero - Número do destinatário (formato internacional, ex: 5548999999999)
 * @param {string} mensagem - Texto da mensagem a ser enviada
 * @param {boolean} linkPreview - Se true, mostra preview do link (padrão: false)
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
async function enviarMensagem(numero, mensagem, linkPreview = false) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!EVOLUTION_BASE_URL || !EVOLUTION_INSTANCE || !EVOLUTION_TOKEN) {
      const missing = [];
      if (!EVOLUTION_BASE_URL) missing.push('EVOLUTION_BASE_URL');
      if (!EVOLUTION_INSTANCE) missing.push('EVOLUTION_INSTANCE');
      if (!EVOLUTION_TOKEN) missing.push('EVOLUTION_TOKEN');
      
      console.error(`[EVOLUTION API] Variáveis de ambiente faltando: ${missing.join(', ')}`);
      return {
        success: false,
        error: {
          message: `Variáveis de ambiente não configuradas: ${missing.join(', ')}`,
          missing: missing
        }
      };
    }
    
    // Formato correto conforme documentação oficial
    // https://doc.evolution-api.com/v2/api-reference/message-controller/send-text
    const url = `${EVOLUTION_BASE_URL_CURRENT}/message/sendText/${EVOLUTION_INSTANCE_CURRENT}`;
    const payload = {
      number: numero,
      text: mensagem,
      linkPreview: linkPreview
    };
    const headers = {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_TOKEN
    };

    console.log(`[EVOLUTION API] Enviando mensagem para ${numero} via ${url}`);
    const response = await axios.post(url, payload, { headers });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    };
    
    console.error('[EVOLUTION API] Erro ao enviar mensagem:', JSON.stringify(errorDetails, null, 2));
    
    return {
      success: false,
      error: errorDetails
    };
  }
}

/**
 * Envia uma mensagem com botões via Evolution API
 * Baseado na documentação: https://doc.evolution-api.com/v2/api-reference/message-controller/send-button
 * 
 * @param {string} numero - Número do destinatário (formato internacional, ex: 5548999999999)
 * @param {string} titulo - Título da mensagem
 * @param {string} descricao - Descrição da mensagem
 * @param {string} rodape - Rodapé da mensagem
 * @param {Array<{title: string, id: string, url?: string}>} botoes - Array de botões
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
async function enviarMensagemComBotoes(numero, titulo, descricao, rodape, botoes) {
  try {
    const url = `${EVOLUTION_BASE_URL}/message/sendButtons/${EVOLUTION_INSTANCE}`;
    
    // Formatar botões conforme a API espera
    const buttonsFormatted = botoes.map((botao, index) => ({
      title: botao.title,
      displayText: botao.title,
      id: botao.id || `button_${index}`
    }));
    
    const payload = {
      number: numero,
      title: titulo,
      description: descricao,
      footer: rodape,
      buttons: buttonsFormatted
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_TOKEN
    };

    const response = await axios.post(url, payload, { headers });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    };
    
    console.error('Erro ao enviar mensagem com botões via Evolution API:', JSON.stringify(errorDetails, null, 2));
    
    return {
      success: false,
      error: errorDetails
    };
  }
}

module.exports = { 
  enviarMensagem, 
  enviarMensagemComBotoes, 
  testarFormatoAPI,
  enviarPresence,
  delayAleatorio
};

// Algoritmo de sorteio que garante:
// 1. Ninguém tira a si mesmo
// 2. Ninguém tira quem o tirou (sem pares A↔B)
// 3. Permutação completa

function gerarSorteio(participantes) {
  const maxTentativas = 100;
  
  for (let tentativa = 0; tentativa < maxTentativas; tentativa++) {
    const resultado = tentarSorteio(participantes);
    if (resultado) {
      return resultado;
    }
  }
  
  throw new Error('Não foi possível gerar um sorteio válido após 100 tentativas');
}

function tentarSorteio(participantes) {
  const ids = participantes.map(p => p.id);
  const embaralhado = [...ids].sort(() => Math.random() - 0.5);
  const resultado = new Map();
  
  // Criar mapeamento
  for (let i = 0; i < ids.length; i++) {
    const participanteId = ids[i];
    const amigoId = embaralhado[i];
    
    // Regra 1: Não pode tirar a si mesmo
    if (participanteId === amigoId) {
      return null;
    }
    
    resultado.set(participanteId, amigoId);
  }
  
  // Regra 2: Verificar se não há pares A↔B
  for (const [participanteId, amigoId] of resultado.entries()) {
    if (resultado.get(amigoId) === participanteId) {
      return null;
    }
  }
  
  return resultado;
}

module.exports = { gerarSorteio };


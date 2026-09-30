// CONFIGURAÇÃO DO JSONBIN.IO
const JSONBIN_CONFIG = {
  binId: '6aba6670ffd5d16053379470',
  apiKey: '$2a$10$2GS3IXMMHlIzufc5EnxDYedXLztIAI6RuWrJJR8nbDniz6D6aaU.C' // Insira a Master Key gerada no JSONBin.io
};

// 1. LER DADOS DO JSONBIN.IO
async function carregarDados() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_CONFIG.apiKey
      }
    });

    if (!response.ok) {
      console.error('Falha ao carregar do JSONBin. Status:', response.status);
      return;
    }

    const result = await response.json();

    if (result && result.record) {
      maquinas = Array.isArray(result.record) ? result.record : [];
      renderizarDashboard();
    }
  } catch (error) {
    console.error('Erro de conexão ao carregar dados:', error);
  }
}

// 2. SALVAR DADOS NO JSONBIN.IO
async function salvarNoJsonbin(novosDados) {
  if (!Array.isArray(novosDados) || novosDados.length === 0) {
    console.warn('Tentativa de salvar lista vazia bloqueada.');
    return false;
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_CONFIG.apiKey
      },
      body: JSON.stringify(novosDados)
    });

    if (!response.ok) {
      console.error('Erro no salvamento PUT:', response.status);
    }

    return response.ok;
  } catch (error) {
    console.error('Erro de conexão ao salvar dados:', error);
    return false;
  }
}

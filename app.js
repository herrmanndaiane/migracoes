// CONFIGURAÇÃO DO JSONBIN.IO
const JSONBIN_CONFIG = {
  binId: '6aba6670ffd5d16053379470',   // Exemplo: '65f8a123abc4567890'
  apiKey: '$2a$10$2GS3IXMMHlIzufc5EnxDYedXLztIAI6RuWrJJR8nbDniz6D6aaU.C'  // Exemplo: '$2a$10$AbCdEfGh...'
};

let maquinas = [];
let chartStatus = null;
let chartBlink = null;
let chartMg = null;

document.addEventListener('DOMContentLoaded', () => {
  // Carrega os dados assim que a página abre
  carregarDados();

  // ATUALIZAÇÃO EM TEMPO REAL: Lê os dados do JSONBin a cada 5 segundos
  setInterval(() => {
    carregarDados();
  }, 5000);

  // Escuta o formulário de cadastro
  const formCadastro = document.getElementById('form-cadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();

      const novaMaquina = {
        id: Date.now(),
        nome: document.getElementById('nome-maquina').value.trim(),
        origem: document.getElementById('origem-maquina').value.trim(),
        cluster: document.getElementById('select-cluster').value,
        status: document.getElementById('select-status').value
      };

      maquinas.push(novaMaquina);

      // Envia os dados para a nuvem no JSONBin.io
      const sucesso = await salvarNoJsonbin(maquinas);

      if (sucesso) {
        renderizar();
        e.target.reset();
        alert('Servidor cadastrado e guardado na nuvem com sucesso!');
      } else {
        maquinas.pop(); // Reverte se falhar
        alert('Erro ao guardar no JSONBin. Verifique o Bin ID e a API Key no app.js.');
      }
    });
  }

  // Filtro de busca na tabela
  const inputBusca = document.getElementById('input-busca');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      renderizarTabela(e.target.value.toLowerCase());
    });
  }
});

// LER DADOS DO JSONBIN.IO
async function carregarDados() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_CONFIG.apiKey
      }
    });

    if (!response.ok) throw new Error('Erro na autenticação do JSONBin');

    const result = await response.json();
    maquinas = Array.isArray(result.record) ? result.record : [];
    
    renderizar();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

// GUARDAR DADOS NO JSONBIN.IO (DISPONÍVEL PARA TODOS OS UTILIZADORES)
async function salvarNoJsonbin(novosDados) {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_CONFIG.apiKey
      },
      body: JSON.stringify(novosDados)
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao guardar:', error);
    return false;
  }
}

// REMOVER MÁQUINA
async function excluirMaquina(id) {
  if (!confirm('Deseja realmente remover este servidor?')) return;

  maquinas = maquinas.filter(m => m.id !== id);
  const sucesso = await salvarNoJsonbin(maquinas);

  if (sucesso) {
    renderizar();
  } else {
    alert('Erro ao remover o servidor da nuvem.');
    carregarDados();
  }
}

// RENDERIZAR MÉTRICAS E GRÁFICOS
function renderizar() {
  let migradas = 0, pendentes = 0, emAndamento = 0;
  let blinkTotal = 0, blinkMigradas = 0;
  let mgTotal = 0, mgMigradas = 0;

  maquinas.forEach(item => {
    if (item.status === 'Migrado') migradas++;
    else if (item.status === 'Pendente') pendentes++;
    else if (item.status === 'Em Andamento') emAndamento++;

    if (item.cluster === 'Cluster Blink') {
      blinkTotal++;
      if (item.status === 'Migrado') blinkMigradas++;
    } else if (item.cluster === 'Cluster MG') {
      mgTotal++;
      if (item.status === 'Migrado') mgMigradas++;
    }
  });

  document.getElementById('total-servidores').innerText = maquinas.length;
  document.getElementById('total-migrados').innerText = migradas;
  document.getElementById('total-andamento').innerText = emAndamento;
  document.getElementById('total-pendentes').innerText = pendentes;

  const pctBlink = blinkTotal > 0 ? Math.round((blinkMigradas / blinkTotal) * 100) : 0;
  const pctMG = mgTotal > 0 ? Math.round((mgMigradas / mgTotal) * 100) : 0;

  const blinkStats = document.getElementById('blink-stats');
  const mgStats = document.getElementById('mg-stats');
  if (blinkStats) blinkStats.innerText = `${pctBlink}% (${blinkMigradas}/${blinkTotal})`;
  if (mgStats) mgStats.innerText = `${pctMG}% (${mgMigradas}/${mgTotal})`;

  const blinkBar = document.getElementById('blink-bar');
  const mgBar = document.getElementById('mg-bar');
  if (blinkBar) blinkBar.style.width = `${pctBlink}%`;
  if (mgBar) mgBar.style.width = `${pctMG}%`;

  renderizarTabela();
  renderizarGraficos(migradas, emAndamento, pendentes, pctBlink, pctMG);
}

// RENDERIZAR TABELA
function renderizarTabela(filtro = '') {
  const tabela = document.getElementById('tabela-maquinas');
  if (!tabela) return;

  tabela.innerHTML = '';

  const maquinasFiltradas = maquinas.filter(m => 
    m.nome.toLowerCase().includes(filtro) ||
    (m.origem && m.origem.toLowerCase().includes(filtro)) ||
    m.cluster.toLowerCase().includes(filtro) ||
    m.status.toLowerCase().includes(filtro)
  );

  maquinasFiltradas.forEach(item => {
    let badgeClass = 'badge-pendente';
    if (item.status === 'Migrado') badgeClass = 'badge-migrado';
    if (item.status === 'Em Andamento') badgeClass = 'badge-andamento';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.nome}</strong></td>
      <td>${item.origem || 'N/A'}</td>
      <td>${item.cluster}</td>
      <td><span class="badge ${badgeClass}">${item.status}</span></td>
      <td>
        <button onclick="excluirMaquina(${item.id})" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Eliminar">
          🗑️
        </button>
      </td>
    `;
    tabela.appendChild(tr);
  });
}

// RENDERIZAR GRÁFICOS EM ROSCA / PIZZA
function renderizarGraficos(migradas, emAndamento, pendentes, pctBlink, pctMG) {
  if (typeof Chart === 'undefined') return;

  const ctxStatus = document.getElementById('chart-status');
  if (ctxStatus) {
    if (chartStatus) chartStatus.destroy();
    chartStatus = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Migrado', 'Em Andamento', 'Pendente'],
        datasets: [{
          data: [migradas, emAndamento, pendentes],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '70%',
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  const ctxBlink = document.getElementById('chart-blink');
  if (ctxBlink) {
    if (chartBlink) chartBlink.destroy();
    chartBlink = new Chart(ctxBlink, {
      type: 'doughnut',
      data: {
        labels: ['Migrado', 'Restante'],
        datasets: [{
          data: [pctBlink, 100 - pctBlink],
          backgroundColor: ['#3b82f6', '#1c202e'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  const ctxMg = document.getElementById('chart-mg');
  if (ctxMg) {
    if (chartMg) chartMg.destroy();
    chartMg = new Chart(ctxMg, {
      type: 'doughnut',
      data: {
        labels: ['Migrado', 'Restante'],
        datasets: [{
          data: [pctMG, 100 - pctMG],
          backgroundColor: ['#8b5cf6', '#1c202e'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

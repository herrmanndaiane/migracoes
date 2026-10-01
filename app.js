// CONFIGURAÇÃO DO JSONBIN.IO
const JSONBIN_CONFIG = {
  binId: '6aba6670ffd5d16053379470',
  apiKey: '$2a$10$2GS3IXMMHlIzufc5EnxDYedXLztIAI6RuWrJJR8nbDniz6D6aaU.C' // Master Key mantida para operações PUT
};

let maquinas = [];
let chartGeral = null;
let chartBlink = null;
let chartMg = null;

// 1. LER DADOS DO JSONBIN.IO (Requisição Pública Sem Cabeçalhos para Bins Públicos)
async function carregarDados() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}/latest`);

    if (!response.ok) {
      console.error('Falha de resposta no GET do JSONBin. Status:', response.status);
      return;
    }

    const result = await response.json();

    if (result && result.record) {
      maquinas = Array.isArray(result.record) ? result.record : [result.record];
      renderizarDashboard();
    }
  } catch (error) {
    console.error('Erro de conexão ao carregar dados:', error);
  }
}

// 2. SALVAR DADOS NO JSONBIN.IO (Com Trava de Segurança Anti-Perda de Dados)
async function salvarNoJsonbin(novosDados) {
  // Trava de segurança: impede o envio de array vazio que apagaria o banco de dados
  if (!Array.isArray(novosDados) || novosDados.length === 0) {
    console.warn('Bloqueado o envio de lista vazia para proteger o banco de dados.');
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

    return response.ok;
  } catch (error) {
    console.error('Erro de conexão ao salvar dados:', error);
    return false;
  }
}

// 3. REMOVER MÁQUINA
async function removerMaquina(id) {
  if (!confirm('Deseja realmente remover este servidor do painel?')) return;

  maquinas = maquinas.filter(m => m.id !== id);
  const sucesso = await salvarNoJsonbin(maquinas);

  if (sucesso) {
    renderizarDashboard();
  } else {
    alert('Erro ao excluir o servidor no banco de dados.');
    carregarDados();
  }
}

// 4. INICIALIZAR ESTRUTURA DOS GRÁFICOS CHART.JS
function inicializarGraficos() {
  if (typeof Chart === 'undefined') return;

  const elGeral = document.getElementById('chartStatusDonut');
  if (elGeral) {
    const ctxGeral = elGeral.getContext('2d');
    if (chartGeral) chartGeral.destroy();
    chartGeral = new Chart(ctxGeral, {
      type: 'doughnut',
      data: {
        labels: ['Migrado', 'Em Andamento', 'Pendente'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#10b981', '#3b82f6', '#f5a623'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        cutout: '76%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  const elBlink = document.getElementById('chartBlinkMini');
  if (elBlink) {
    const ctxBlink = elBlink.getContext('2d');
    if (chartBlink) chartBlink.destroy();
    chartBlink = new Chart(ctxBlink, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [0, 100],
          backgroundColor: ['#00d2d3', '#1c2130'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '80%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
  }

  const elMg = document.getElementById('chartMgMini');
  if (elMg) {
    const ctxMg = elMg.getContext('2d');
    if (chartMg) chartMg.destroy();
    chartMg = new Chart(ctxMg, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [0, 100],
          backgroundColor: ['#ff2d87', '#1c2130'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '80%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
  }
}

// 5. RENDERIZAR PAINEL
function renderizarDashboard() {
  let totalMigrados = 0;
  let totalAndamento = 0;
  let totalPendentes = 0;

  let blinkTotal = 0, blinkMigrados = 0;
  let mgTotal = 0, mgMigrados = 0;

  maquinas.forEach(item => {
    if (item.status === 'Migrado') totalMigrados++;
    else if (item.status === 'Em Andamento') totalAndamento++;
    else totalPendentes++;

    if (item.cluster === 'Cluster Blink') {
      blinkTotal++;
      if (item.status === 'Migrado') blinkMigrados++;
    } else if (item.cluster === 'Cluster MG') {
      mgTotal++;
      if (item.status === 'Migrado') mgMigrados++;
    }
  });

  const totalGeral = maquinas.length;

  const kpiTotal = document.getElementById('kpi-total');
  if (kpiTotal) kpiTotal.innerText = totalGeral;

  const kpiMigrados = document.getElementById('kpi-migrados');
  if (kpiMigrados) kpiMigrados.innerText = totalMigrados;

  const kpiPendentes = document.getElementById('kpi-pendentes');
  if (kpiPendentes) kpiPendentes.innerText = totalPendentes;

  const kpiTaxa = document.getElementById('kpi-taxa');
  const taxaGeral = totalGeral > 0 ? Math.round((totalMigrados / totalGeral) * 100) : 0;
  if (kpiTaxa) kpiTaxa.innerText = `${taxaGeral}%`;

  const donutCount = document.getElementById('donut-total-count');
  if (donutCount) donutCount.innerText = totalGeral;

  const legMigrado = document.getElementById('leg-migrado');
  if (legMigrado) legMigrado.innerText = totalMigrados;

  const legAndamento = document.getElementById('leg-andamento');
  if (legAndamento) legAndamento.innerText = totalAndamento;

  const legPendente = document.getElementById('leg-pendente');
  if (legPendente) legPendente.innerText = totalPendentes;

  if (chartGeral) {
    chartGeral.data.datasets[0].data = [totalMigrados, totalAndamento, totalPendentes];
    chartGeral.update();
  }

  const pctBlink = blinkTotal > 0 ? Math.round((blinkMigrados / blinkTotal) * 100) : 0;
  const blinkPctText = document.getElementById('blink-pct-text');
  if (blinkPctText) blinkPctText.innerText = `${pctBlink}%`;

  const blinkRatioText = document.getElementById('blink-ratio-text');
  if (blinkRatioText) blinkRatioText.innerText = `${blinkMigrados} de ${blinkTotal}`;

  const blinkBadge = document.getElementById('blink-progress-badge');
  if (blinkBadge) blinkBadge.innerText = `${pctBlink}% Migrado`;

  const blinkBar = document.getElementById('blink-bar');
  if (blinkBar) blinkBar.style.width = `${pctBlink}%`;

  if (chartBlink) {
    chartBlink.data.datasets[0].data = [pctBlink, 100 - pctBlink];
    chartBlink.update();
  }

  const pctMg = mgTotal > 0 ? Math.round((mgMigrados / mgTotal) * 100) : 0;
  const mgPctText = document.getElementById('mg-pct-text');
  if (mgPctText) mgPctText.innerText = `${pctMg}%`;

  const mgRatioText = document.getElementById('mg-ratio-text');
  if (mgRatioText) mgRatioText.innerText = `${mgMigrados} de ${mgTotal}`;

  const mgBadge = document.getElementById('mg-progress-badge');
  if (mgBadge) mgBadge.innerText = `${pctMg}% Migrado`;

  const mgBar = document.getElementById('mg-bar');
  if (mgBar) mgBar.style.width = `${pctMg}%`;

  if (chartMg) {
    chartMg.data.datasets[0].data = [pctMg, 100 - pctMg];
    chartMg.update();
  }

  renderizarTabela();
}

// 6. RENDERIZAR TABELA
function renderizarTabela() {
  const tabela = document.getElementById('tabela-maquinas');
  if (!tabela) return;

  tabela.innerHTML = '';

  const elBusca = document.getElementById('filtro-busca') || document.getElementById('input-busca');
  const termoBusca = elBusca ? elBusca.value.toLowerCase() : '';

  const elCluster = document.getElementById('filtro-cluster-select');
  const clusterFiltro = elCluster ? elCluster.value : 'TODOS';

  const listaFiltrada = maquinas.filter(item => {
    const atendeNome = (item.nome && item.nome.toLowerCase().includes(termoBusca)) ||
                       (item.origem && item.origem.toLowerCase().includes(termoBusca));
    const atendeCluster = (clusterFiltro === 'TODOS') || (item.cluster === clusterFiltro);
    return atendeNome && atendeCluster;
  });

  const countBadge = document.getElementById('table-count-badge');
  if (countBadge) countBadge.innerText = `${listaFiltrada.length} servidores`;

  listaFiltrada.forEach(item => {
    const tr = document.createElement('tr');

    let statusClass = 'status-pendente';
    let statusIcon = 'fa-hourglass-start';
    if (item.status === 'Migrado') {
      statusClass = 'status-migrado';
      statusIcon = 'fa-check';
    } else if (item.status === 'Em Andamento') {
      statusClass = 'status-andamento';
      statusIcon = 'fa-spinner fa-spin';
    }

    const circleClass = item.cluster === 'Cluster Blink' ? 'circle-blink' : 'circle-mg';

    tr.innerHTML = `
      <td>
        <div class="server-name-cell">
          <div class="server-icon"><i class="fa-solid fa-server"></i></div>
          <div>
            <strong>${item.nome || 'Sem nome'}</strong>
            <div style="font-size: 11px; color: var(--text-muted, #8c93a6);">ID: #${item.id.toString().slice(-4)}</div>
          </div>
        </div>
      </td>
      <td>${item.origem || 'On-Premise'}</td>
      <td>
        <div class="cluster-tag">
          <span class="cluster-circle ${circleClass}"></span>
          <span>${item.cluster || 'N/A'}</span>
        </div>
      </td>
      <td>
        <span class="status-pill ${statusClass}">
          <i class="fa-solid ${statusIcon}"></i> ${item.status || 'Pendente'}
        </span>
      </td>
      <td style="color: var(--text-secondary, #a1a8bd);">${item.data || '2026-09-28'}</td>
      <td style="text-align: right;">
        <button class="action-btn-delete" title="Excluir" onclick="removerMaquina(${item.id})" style="background:none; border:none; color:#ef4444; cursor:pointer;">
          <i class="fa-solid fa-trash-can"></i> 🗑️
        </button>
      </td>
    `;
    tabela.appendChild(tr);
  });
}

// INICIALIZAÇÃO AUTOMÁTICA
function iniciarApp() {
  inicializarGraficos();
  carregarDados();

  const formCadastro = document.getElementById('form-cadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();

      const elNome = document.getElementById('nome-maquina');
      const elOrigem = document.getElementById('origem-maquina');
      const elCluster = document.getElementById('select-cluster');
      const elStatus = document.getElementById('select-status');

      const novaMaquina = {
        id: Date.now(),
        nome: elNome ? elNome.value.trim() : '',
        origem: elOrigem ? elOrigem.value.trim() : 'On-Premise',
        cluster: elCluster ? elCluster.value : 'Cluster Blink',
        status: elStatus ? elStatus.value : 'Pendente',
        data: new Date().toISOString().split('T')[0]
      };

      maquinas.unshift(novaMaquina);

      const sucesso = await salvarNoJsonbin(maquinas);

      if (sucesso) {
        renderizarDashboard();
        e.target.reset();
        alert('Servidor cadastrado e sincronizado com sucesso!');
      } else {
        maquinas.shift();
        alert('Erro ao salvar no JSONBin. Verifique se a sua Master Key possui permissão de escrita.');
      }
    });
  }

  const filtroBusca = document.getElementById('filtro-busca') || document.getElementById('input-busca');
  if (filtroBusca) {
    filtroBusca.addEventListener('input', renderizarDashboard);
  }

  const filtroCluster = document.getElementById('filtro-cluster-select');
  if (filtroCluster) {
    filtroCluster.addEventListener('change', renderizarDashboard);
  }
}

// Executa imediatamente ou aguarda o carregamento do DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarApp);
} else {
  iniciarApp();
}

// Sincroniza a cada 5 segundos
setInterval(carregarDados, 5000);

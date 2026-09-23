// CONFIGURAÇÕES DO REPOSITÓRIO
const GITHUB_CONFIG = {
  owner: 'SEU_USUARIO_GITHUB',      // Substitua pelo seu usuário
  repo: 'NOME_DO_REPOSITORIO',     // Substitua pelo nome do repositório
  path: 'maquinas.json',            // Caminho do arquivo JSON
  token: 'COLE_SEU_TOKEN_AQUI'      // Cole seu token aqui dentro das aspas
};

let maquinas = [];
let fileSha = '';

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosDoGithub();

  // Manipulação do formulário de cadastro
  document.getElementById('form-cadastro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const novaMaquina = {
      id: Date.now(),
      nome: document.getElementById('nome-maquina').value,
      cluster: document.getElementById('select-cluster').value,
      status: document.getElementById('select-status').value
    };

    maquinas.push(novaMaquina);

    const sucesso = await salvarNoGithub(maquinas);

    if (sucesso) {
      renderizar();
      e.target.reset();
      alert('Servidor cadastrado e salvo no GitHub com sucesso!');
    } else {
      maquinas.pop(); // Reverte a alteração em caso de erro
      alert('Erro ao salvar no GitHub. Verifique seu Token e permissões.');
    }
  });
});

// CARREGAR DADOS DO GITHUB
async function carregarDadosDoGithub() {
  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) throw new Error('Erro ao buscar arquivo no GitHub');

    const data = await response.json();
    fileSha = data.sha; 

    // Decodifica o conteúdo Base64
    const contentDecoded = decodeURIComponent(escape(atob(data.content)));
    maquinas = JSON.parse(contentDecoded);

    renderizar();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

// SALVAR ATUALIZAÇÕES NO GITHUB
async function salvarNoGithub(novosDados) {
  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;

  const jsonString = JSON.stringify(novosDados, null, 2);
  const contentBase64 = btoa(unescape(encodeURIComponent(jsonString)));

  const payload = {
    message: `feat: Cadastra novo servidor no dashboard [skip ci]`,
    content: contentBase64,
    sha: fileSha
  };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return false;

    const resData = await response.json();
    fileSha = resData.content.sha; // Atualiza o SHA para a próxima requisição
    return true;
  } catch (error) {
    console.error('Erro no commit:', error);
    return false;
  }
}

// RENDERIZAR TABELA, CARDS E % POR CLUSTER
function renderizar() {
  const tabela = document.getElementById('tabela-maquinas');
  tabela.innerHTML = '';

  let migradas = 0;
  let pendentes = 0;

  // Contadores específicos por cluster
  let blinkTotal = 0, blinkMigradas = 0;
  let mgTotal = 0, mgMigradas = 0;

  maquinas.forEach(item => {
    // Totais globais
    if (item.status === 'Migrado') migradas++;
    if (item.status === 'Pendente') pendentes++;

    // Totais por cluster
    if (item.cluster === 'Blink/Nova/Justweb') {
      blinkTotal++;
      if (item.status === 'Migrado') blinkMigradas++;
    } else if (item.cluster === 'Cluster SEMPRE') {
      mgTotal++;
      if (item.status === 'Migrado') mgMigradas++;
    }

    // Estilo da badge
    let badgeClass = 'badge-pendente';
    if (item.status === 'Migrado') badgeClass = 'badge-migrado';
    if (item.status === 'Em Andamento') badgeClass = 'badge-andamento';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.nome}</strong></td>
      <td>${item.cluster}</td>
      <td><span class="badge ${badgeClass}">${item.status}</span></td>
    `;
    tabela.appendChild(tr);
  });

  // Atualizar cards de métricas globais
  document.getElementById('total-servidores').innerText = maquinas.length;
  document.getElementById('total-migrados').innerText = migradas;
  document.getElementById('total-pendentes').innerText = pendentes;

  // Atualizar barra e % do Cluster Blink
  const pctBlink = blinkTotal > 0 ? Math.round((blinkMigradas / blinkTotal) * 100) : 0;
  const blinkBar = document.getElementById('blink-bar');
  const blinkStats = document.getElementById('blink-stats');
  if (blinkBar && blinkStats) {
    blinkBar.style.width = `${pctBlink}%`;
    blinkStats.innerText = `${pctBlink}% (${blinkMigradas}/${blinkTotal})`;
  }

  // Atualizar barra e % do Cluster MG
  const pctMG = mgTotal > 0 ? Math.round((mgMigradas / mgTotal) * 100) : 0;
  const mgBar = document.getElementById('mg-bar');
  const mgStats = document.getElementById('mg-stats');
  if (mgBar && mgStats) {
    mgBar.style.width = `${pctMG}%`;
    mgStats.innerText = `${pctMG}% (${mgMigradas}/${mgTotal})`;
  }
}

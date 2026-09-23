document.addEventListener('DOMContentLoaded', () => {
  let maquinas = [];

  // Carregar dados do arquivo JSON
  fetch('maquinas.json')
    .then(res => res.json())
    .then(data => {
      maquinas = data;
      renderizar();
    })
    .catch(err => console.error('Erro ao carregar maquinas.json:', err));

  function renderizar() {
    const tabela = document.getElementById('tabela-maquinas');
    tabela.innerHTML = '';

    let migradas = 0;
    let pendentes = 0;

    maquinas.forEach(item => {
      if (item.status === 'Migrado') migradas++;
      if (item.status === 'Pendente') pendentes++;

      const tr = document.createElement('tr');
      const statusClass = item.status.replace(/\s+/g, '');
      
      tr.innerHTML = `
        <td><strong>${item.nome}</strong></td>
        <td>${item.cluster}</td>
        <td><span class="badge status-${statusClass}">${item.status}</span></td>
      `;
      tabela.appendChild(tr);
    });

    // Atualizar Contadores
    document.getElementById('total-maquinas').innerText = maquinas.length;
    document.getElementById('total-migradas').innerText = migradas;
    document.getElementById('total-pendentes').innerText = pendentes;
  }

  // Cadastro local via formulário
  document.getElementById('form-cadastro').addEventListener('submit', (e) => {
    e.preventDefault();

    const novaMaquina = {
      id: Date.now(),
      nome: document.getElementById('nome-maquina').value,
      cluster: document.getElementById('select-cluster').value,
      status: document.getElementById('select-status').value
    };

    maquinas.push(novaMaquina);
    renderizar();
    
    // Limpar formulário
    e.target.reset();
  });
});

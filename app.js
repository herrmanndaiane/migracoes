<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics de Migração - Dashboard</title>
  
  <!-- Chart.js para os gráficos em pizza / rosca -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <style>
    :root {
      --bg-dark: #0b0d13;
      --card-bg: #151822;
      --card-border: #222634;
      --text-main: #f3f4f6;
      --text-muted: #8c93a6;
      --accent-green: #10b981;
      --accent-blue: #3b82f6;
      --accent-yellow: #f59e0b;
      --accent-purple: #8b5cf6;
      --input-bg: #1c202e;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 24px;
    }

    .header-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 24px;
      letter-spacing: -0.5px;
    }

    /* GRID LAYOUT */
    .grid-top {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .grid-charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    /* CARDS */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
    }

    .card-title {
      font-size: 13px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .card-value {
      font-size: 32px;
      font-weight: 700;
    }

    /* GRÁFICOS */
    .chart-box {
      position: relative;
      height: 180px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .cluster-progress-item {
      margin-bottom: 16px;
    }

    .cluster-info {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .progress-bar-bg {
      background: var(--input-bg);
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .fill-blink { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .fill-mg { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }

    /* FORMULÁRIO */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      align-items: center;
    }

    input, select, button {
      width: 100%;
      background: var(--input-bg);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }

    input:focus, select:focus {
      border-color: var(--accent-blue);
    }

    button.btn-primary {
      background: var(--accent-blue);
      color: #fff;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    button.btn-primary:hover {
      opacity: 0.9;
    }

    /* TABELA */
    .table-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 16px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
      padding: 12px 16px;
      border-bottom: 1px solid var(--card-border);
    }

    td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--card-border);
      font-size: 14px;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-migrado { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-andamento { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge-pendente { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
  </style>
</head>
<body>

  <h1 class="header-title">Dashboard de Migração de Servidores</h1>

  <!-- INDICADORES DE TOPO -->
  <div class="grid-top">
    <div class="card">
      <div class="card-title">Total de Servidores</div>
      <div class="card-value" id="total-servidores">0</div>
    </div>
    <div class="card">
      <div class="card-title">Migrados</div>
      <div class="card-value" style="color: var(--accent-green)" id="total-migrados">0</div>
    </div>
    <div class="card">
      <div class="card-title">Em Andamento</div>
      <div class="card-value" style="color: var(--accent-blue)" id="total-andamento">0</div>
    </div>
    <div class="card">
      <div class="card-title">Pendentes</div>
      <div class="card-value" style="color: var(--accent-yellow)" id="total-pendentes">0</div>
    </div>
  </div>

  <!-- SEÇÃO DE GRÁFICOS EM PIZZA / ROSCA -->
  <div class="grid-charts">
    <div class="card">
      <div class="card-title">Status Geral da Migração</div>
      <div class="chart-box">
        <canvas id="chart-status"></canvas>
      </div>
    </div>

    <div class="card">
      <div class="card-title">% Migrado - Cluster Blink</div>
      <div class="chart-box">
        <canvas id="chart-blink"></canvas>
      </div>
    </div>

    <div class="card">
      <div class="card-title">% Migrado - Cluster MG</div>
      <div class="chart-box">
        <canvas id="chart-mg"></canvas>
      </div>
    </div>
  </div>

  <!-- PROGRESSO POR CLUSTERS (BARRAS) -->
  <div class="card" style="margin-bottom: 20px;">
    <div class="card-title">Progresso Detalhado por Cluster</div>
    
    <div class="cluster-progress-item">
      <div class="cluster-info">
        <span>Cluster Blink</span>
        <span id="blink-stats">0% (0/0)</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill fill-blink" id="blink-bar" style="width: 0%;"></div>
      </div>
    </div>

    <div class="cluster-progress-item" style="margin-bottom: 0;">
      <div class="cluster-info">
        <span>Cluster MG</span>
        <span id="mg-stats">0% (0/0)</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill fill-mg" id="mg-bar" style="width: 0%;"></div>
      </div>
    </div>
  </div>

  <!-- FORMULÁRIO DE CADASTRO COM NOVO CAMPO ORIGEM -->
  <div class="card" style="margin-bottom: 20px;">
    <div class="card-title">Cadastrar Novo Servidor</div>
    <form id="form-cadastro" class="form-grid">
      <input type="text" id="nome-maquina" placeholder="Nome do Servidor" required>
      <input type="text" id="origem-maquina" placeholder="Origem (ex: On-Premise, AWS)" required>
      <select id="select-cluster" required>
        <option value="">Selecione o Cluster</option>
        <option value="Cluster Blink">Cluster Blink</option>
        <option value="Cluster MG">Cluster MG</option>
      </select>
      <select id="select-status" required>
        <option value="Pendente">Pendente</option>
        <option value="Em Andamento">Em Andamento</option>
        <option value="Migrado">Migrado</option>
      </select>
      <button type="submit" class="btn-primary">+ Cadastrar</button>
    </form>
  </div>

  <!-- TABELA DE SERVIDORES -->
  <div class="card">
    <div class="table-header-flex">
      <div class="card-title" style="margin: 0;">Servidores em Acompanhamento</div>
      <input type="text" id="input-busca" placeholder="Filtrar servidores..." style="max-width: 250px;">
    </div>
    <table>
      <thead>
        <tr>
          <th>Servidor</th>
          <th>Origem</th>
          <th>Cluster</th>
          <th>Status</th>
          <th style="width: 50px;">Ações</th>
        </tr>
      </thead>
      <tbody id="tabela-maquinas"></tbody>
    </table>
  </div>

  <script src="app.js"></script>
</body>
</html>

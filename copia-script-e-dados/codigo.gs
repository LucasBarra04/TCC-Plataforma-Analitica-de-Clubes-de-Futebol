// TCC — Plataforma Analítica de Clubes de Futebol
// Google Apps Script, API REST via Web App
//
// Rotas: health | clubes | anos | indicadores | desempenho | financeiro |
//        comparativo | transferencias | saldo_transferencias

const SPREADSHEET_ID = "1ybyMyX7Ewatz3vl4T1Oc_DHPo4QydvJ6iIpP5U0dITY";
const anosRecorte = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

const clubesValidos = ["flamengo", "palmeiras", "internacional", "sao_paulo"];

// Nome das abas por categoria e clube.
const abas = {
  desempenho: {
    flamengo: "Desempenho Flamengo",
    palmeiras: "Desempenho Palmeiras",
    internacional: "Desempenho Internacional",
    sao_paulo: "Desempenho São Paulo",
  },
  financeiro: {
    flamengo: "Financeiro Flamengo",
    palmeiras: "Financeiro Palmeiras",
    internacional: "Financeiro Internacional",
    sao_paulo: "Financeiro São Paulo",
  },
  transferencias: {
    flamengo: "Transferências Flamengo",
    palmeiras: "Transferências Palmeiras",
    internacional: "Transferências Internacional",
    sao_paulo: "Transferências São Paulo",
  },
};

// Indicadores financeiros comparáveis entre os 4 clubes.

const indicadoresComparaveis = {
  receita_bruta: {
    alias: "Receita Bruta Total",
    flamengo: "receita_bruta_futebol_clube_social",
    palmeiras: "receita_bruta_operacional",
    internacional: "receita_bruta_futebol_clube_social",
    sao_paulo: "receita_bruta_futebol_clube_social",
  },
  receita_operacional_liquida: {
    alias: "Receita Operacional/Líquida das Atividades",
    flamengo: "receita_operacional_liquida",
    palmeiras: "receita_operacional_liquida",
    internacional: "receita_liquida_das_atividades",
    sao_paulo: "receita_operacional_liquida",
  },
  superavit_deficit: {
    alias: "Superávit / (Déficit) do Exercício",
    flamengo: "superavit_deficit_do_exercicio",
    palmeiras: "superavit_deficit_do_exercicio",
    internacional: "superavit_deficit_do_exercicio",
    sao_paulo: "superavit_deficit_do_exercicio",
  },
  ebitda: {
    alias: "EBITDA",
    flamengo: "ebitda",
    palmeiras: "ebitda_ajustado",
    internacional: "ebitda",
    sao_paulo: "ebitda",
  },
  resultado_financeiro: {
    alias: "Resultado Financeiro Líquido",
    flamengo: "resultado_financeiro_liquido",
    palmeiras: "resultado_financeiro_liquido",
    internacional: "resultado_financeiro_liquido",
    sao_paulo: "resultado_financeiro_liquido",
  },
  passivo_total: {
    alias: "Passivo Total",
    flamengo: "passivo_total",
    palmeiras: "passivo_total_exigivel",
    internacional: "passivo_total",
    sao_paulo: "passivo_total",
  },
};

// Ponto de entrada de toda requisição GET.
function doGet(e) {
  const p = normalizeParams(e.parameter || {});

  try {
    let payload;

    switch (p.route) {
      case "health":
        payload = getHealth();
        break;

      case "clubes":
        payload = { clubes: clubesValidos };
        break;

      case "anos":
        payload = { anos: anosRecorte };
        break;

      case "indicadores":
        validarClube(p.clube);
        payload = getIndicadores(p.clube);
        break;

      case "desempenho":
        validarClube(p.clube);
        payload = getDesempenho(p.clube, p.ano ? parseInt(p.ano) : null);
        break;

      case "financeiro":
        validarClube(p.clube);
        payload = getFinanceiro(p.clube, p.ano ? parseInt(p.ano) : null, p.indicador || null);
        break;

      case "comparativo":
        if (!p.indicador) erro400('Parâmetro "indicador" obrigatório para rota comparativo.');
        payload = getComparativo(p.indicador, p.ano ? parseInt(p.ano) : null, p.clubes || null);
        break;

      case "transferencias":
        validarClube(p.clube);
        payload = getTransferencias(p.clube, p.ano ? parseInt(p.ano) : null, p.direcao || null, p.tipo || null);
        break;

      case "saldo_transferencias":
        validarClube(p.clube);
        payload = getSaldoTransferencias(p.clube, p.ano ? parseInt(p.ano) : null);
        break;

      default:
        return respondError(
          404,
          `Rota "${p.route || "(vazia)"}" não existe. ` +
          "Rotas disponíveis: health | clubes | anos | indicadores | desempenho | " +
          "financeiro | comparativo | transferencias | saldo_transferencias"
        );
    }

    return respondOk(payload);
  } catch (err) {
    return respondError(err.httpCode || 500, err.message || String(err));
  }
}


// Status da API e metadados da planilha.
function getHealth() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return {
    status: "ok",
    planilha: ss.getName(),
    abas: ss.getSheets().map(s => s.getName()),
    timestamp: new Date().toISOString(),
    versao: "3.1.0",
    recorte: { inicio: 2018, fim: 2025 },
  };
}

// Indicadores financeiros disponíveis para um clube.
function getIndicadores(clube) {
  const { rows, anos } = parseFinanceiroSheet(clube);

  const lista = rows.map(r => {
    const anosComDados = anos.filter(a => r.valores[a] !== null).length;
    return {
      slug: r.slug,
      label: r.label,
      nivel: r.nivel,
      secao: r.secao,
      anos_com_dados: anosComDados,
      cobertura: (anosComDados / anos.length * 100).toFixed(0) + "%",
      unidade: r.secao === "indicadores" ? "ratio" : "R$ mil",
    };
  });

  const slugsComparaveisDoClube = Object.values(indicadoresComparaveis).map(cfg => cfg[clube]);
  lista.forEach(item => {
    item.comparavel_entre_clubes = slugsComparaveisDoClube.includes(item.slug);
    if (item.comparavel_entre_clubes) {
      const entrada = Object.entries(indicadoresComparaveis).find(([, cfg]) => cfg[clube] === item.slug);
      item.alias_comparativo = entrada ? entrada[0] : null;
    }
  });

  return {
    clube,
    total: lista.length,
    indicadores: lista,
    nota: "Use o slug na query string: ?route=financeiro&clube=" + clube + "&indicador=SLUG",
  };
}

// Desempenho esportivo de um clube. "–" vira null.
function getDesempenho(clube, ano) {
  const sheet = getSheet(abas.desempenho[clube]);
  const data = sheet.getDataRange().getValues();
  const headers = data[2].map(h => slugify(String(h).replace(/\n/g, " ").trim()));

  const rows = [];
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    const anoVal = parseInt(String(row[0]), 10);
    if (isNaN(anoVal) || String(row[0]).startsWith("*")) break;
    if (ano && anoVal !== ano) continue;

    const obj = { ano: anoVal };
    for (let j = 1; j < headers.length; j++) {
      const key = headers[j];
      if (!key) continue;
      const v = String(row[j] || "").trim();
      obj[key] = (v === "–" || v === "null" || v === "") ? null : v;
    }
    rows.push(obj);
  }

  if (ano && rows.length === 0) erroNotFound(`Ano ${ano} não encontrado para ${clube}.`);

  return {
    clube,
    total: rows.length,
    anos: rows.map(r => r.ano),
    dados: rows,
    fonte: "Federações organizadoras / tabelas oficiais",
  };
}

// Dados financeiros de um clube
//sem filtros > tudo,  ano > snapshot, indicador > série, indicador+ano > valor pontual.
function getFinanceiro(clube, ano, indicador) {
  const { rows, anos, secoes } = parseFinanceiroSheet(clube);

  if (indicador) {
    const slugs = rows.map(r => r.slug);
    if (!slugs.includes(indicador)) {
      erro400(`Indicador "${indicador}" não encontrado para ${clube}. Indicadores disponíveis: ${slugs.join(", ")}`);
    }
  }

  if (ano && !anos.includes(ano)) {
    erroNotFound(`Ano ${ano} fora do recorte. Anos disponíveis: ${anos.join(", ")}`);
  }

  if (indicador && !ano) {
    const row = rows.find(r => r.slug === indicador);
    return {
      clube,
      indicador,
      label: row.label,
      secao: row.secao,
      unidade: row.secao === "indicadores" ? "ratio" : "R$ mil",
      serie: row.valores,
      anos_com_dados: anos.filter(a => row.valores[a] !== null),
      obs: row.obs,
    };
  }

  if (indicador && ano) {
    const row = rows.find(r => r.slug === indicador);
    return {
      clube,
      indicador,
      label: row.label,
      secao: row.secao,
      unidade: row.secao === "indicadores" ? "ratio" : "R$ mil",
      ano,
      valor: row.valores[ano] !== undefined ? row.valores[ano] : null,
      obs: row.obs,
    };
  }

  if (ano && !indicador) {
    const snapshot = {};
    secoes.forEach(secao => {
      snapshot[secao] = {};
      rows.filter(r => r.secao === secao).forEach(r => { snapshot[secao][r.slug] = r.valores[ano] ?? null; });
    });
    return {
      clube,
      ano,
      unidade: "R$ mil (indicadores de ratio são adimensionais)",
      dados: snapshot,
      nota: "Valores null indicam ausência de dado na fonte para este ano.",
    };
  }

  const completo = {};
  secoes.forEach(secao => {
    completo[secao] = rows
      .filter(r => r.secao === secao)
      .map(r => ({ slug: r.slug, label: r.label, nivel: r.nivel, unidade: secao === "indicadores" ? "ratio" : "R$ mil", valores: r.valores, obs: r.obs }));
  });

  return {
    clube,
    anos_recorte: anos,
    unidade_padrao: "R$ mil",
    dados: completo,
    nota: "Valores null indicam ausência de dado na fonte para aquele ano.",
    fonte: "Demonstrações Financeiras auditadas.",
  };
}

// Indicador comparável entre 2 a 4 clubes.
function getComparativo(indicador, ano, clubesParam) {
  const slugsValidos = Object.keys(indicadoresComparaveis);
  if (!slugsValidos.includes(indicador)) {
    erro400(`Indicador "${indicador}" não está na lista de comparáveis. Indicadores comparáveis: ${slugsValidos.join(", ")}`);
  }

  if (ano && !anosRecorte.includes(ano)) {
    erroNotFound(`Ano ${ano} fora do recorte 2018–2025.`);
  }

  let clubesAlvo = clubesValidos;
  if (clubesParam) {
    clubesAlvo = clubesParam.split(",").map(c => c.trim());
    clubesAlvo.forEach(validarClube);
  }

  const cfg = indicadoresComparaveis[indicador];
  const dadosPorClube = {};
  clubesAlvo.forEach(clube => {
    const { rows } = parseFinanceiroSheet(clube);
    dadosPorClube[clube] = rows.find(r => r.slug === cfg[clube]) || null;
  });

  const anosRef = ano ? [ano] : anosRecorte;
  const serie = {};
  anosRef.forEach(a => {
    serie[a] = {};
    clubesAlvo.forEach(clube => {
      const row = dadosPorClube[clube];
      serie[a][clube] = row ? (row.valores[a] ?? null) : null;
    });
  });

  const slugsPorClube = {};
  clubesAlvo.forEach(clube => { slugsPorClube[clube] = cfg[clube]; });

  return {
    indicador,
    alias: cfg.alias,
    clubes: clubesAlvo,
    slugs_por_clube: slugsPorClube,
    unidade: "R$ mil",
    anos: anosRef,
    serie,
    nota: "Diferenças de nomenclatura contábil entre os clubes são documentadas nas obs. de cada aba financeira.",
  };
}

// Transferências de um clube com filtros de ano, direção e tipo.
function getTransferencias(clube, ano, direcao, tipo) {
  if (direcao && !["saidas", "entradas"].includes(direcao)) {
    erro400('Parâmetro "direcao" deve ser "saidas" ou "entradas".');
  }
  const tiposValidos = ["transferencia", "emprestimo", "custo_zero", "fim_emprestimo"];
  if (tipo && !tiposValidos.includes(tipo)) {
    erro400(`Parâmetro "tipo" deve ser um de: ${tiposValidos.join(", ")}`);
  }
  if (ano && !anosRecorte.includes(ano)) {
    erroNotFound(`Ano ${ano} fora do recorte 2018–2025.`);
  }

  const todosAnos = parseTransferSheet(clube);
  const anosAlvo = ano ? [ano] : anosRecorte;

  const resultado = {};
  anosAlvo.forEach(a => {
    const bloco = todosAnos[a];
    if (!bloco) {
      resultado[a] = { saidas: [], entradas: [] };
      return;
    }

    const filtrarLista = lista => lista.filter(p => !tipo || slugify(p.tipo) === tipo);

    resultado[a] = {
      saidas: (!direcao || direcao === "saidas") ? filtrarLista(bloco.saidas) : undefined,
      entradas: (!direcao || direcao === "entradas") ? filtrarLista(bloco.entradas) : undefined,
    };
    if (resultado[a].saidas === undefined) delete resultado[a].saidas;
    if (resultado[a].entradas === undefined) delete resultado[a].entradas;
  });

  let totalSaidas = 0, totalEntradas = 0;
  anosAlvo.forEach(a => {
    if (resultado[a].saidas) totalSaidas += resultado[a].saidas.reduce((s, p) => s + p.valor_mi, 0);
    if (resultado[a].entradas) totalEntradas += resultado[a].entradas.reduce((s, p) => s + p.valor_mi, 0);
  });

  return {
    clube,
    anos: anosAlvo,
    direcao: direcao || "ambas",
    tipo_filtro: tipo || null,
    transferencias: resultado,
    totais: {
      saidas_mi: +totalSaidas.toFixed(2),
      entradas_mi: +totalEntradas.toFixed(2),
      saldo_mi: +(totalSaidas - totalEntradas).toFixed(2),
    },
    unidade: "€ milhões",
    fonte: "Transfermarkt",
  };
}

//transferências ano: saídas, entradas e saldo líquido por ano.
function getSaldoTransferencias(clube, ano) {
  if (ano && !anosRecorte.includes(ano)) {
    erroNotFound(`Ano ${ano} fora do recorte 2018–2025.`);
  }

  const todosAnos = parseTransferSheet(clube);
  const anosAlvo = ano ? [ano] : anosRecorte;

  const serie = {};
  let totalOut = 0, totalIn = 0;

  anosAlvo.forEach(a => {
    const bloco = todosAnos[a] || { saidas: [], entradas: [] };
    const out = bloco.saidas.reduce((s, p) => s + p.valor_mi, 0);
    const inn = bloco.entradas.reduce((s, p) => s + p.valor_mi, 0);
    totalOut += out;
    totalIn += inn;
    serie[a] = {
      saidas_mi: +out.toFixed(2),
      entradas_mi: +inn.toFixed(2),
      saldo_mi: +(out - inn).toFixed(2),
      n_saidas: bloco.saidas.length,
      n_entradas: bloco.entradas.length,
    };
  });

  return {
    clube,
    anos: anosAlvo,
    serie,
    total: {
      saidas_mi: +totalOut.toFixed(2),
      entradas_mi: +totalIn.toFixed(2),
      saldo_mi: +(totalOut - totalIn).toFixed(2),
    },
    unidade: "€ milhões",
    fonte: "Transfermarkt",
  };
}

// Aba financeira de um clube: detecta seções DRE, Balanço, Indicadores.
function parseFinanceiroSheet(clube) {
  const sheet = getSheet(abas.financeiro[clube]);
  const data = sheet.getDataRange().getValues();
  const headerRow = data[2]; // linha 3 = anos nas colunas de dados

  const colAno = {};
  const anos = [];
  for (let j = 2; j < headerRow.length; j++) {
    const v = parseInt(String(headerRow[j]).trim(), 10);
    if (!isNaN(v) && v >= 2000) {
      colAno[j] = v;
      if (!anos.includes(v)) anos.push(v);
    }
  }

  let colObs = -1;
  for (let j = headerRow.length - 1; j >= 0; j--) {
    if (String(headerRow[j]).trim().toLowerCase() === "obs.") {
      colObs = j;
      break;
    }
  }

  const rows = [];
  const secoes = [];
  let secaoAtual = "dre";

  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    const labelBruto = String(row[0] || "");
    const label = labelBruto.trim();
    if (!label) continue;

    if (isSectionHeader(label)) {
      if (/RESULTADO|DRE|DEMONSTRA/i.test(label)) secaoAtual = "dre";
      else if (/BALAN[ÇC]O|PASSIVO/i.test(label)) secaoAtual = "balanco";
      else if (/INDICADOR/i.test(label)) secaoAtual = "indicadores";
      if (!secoes.includes(secaoAtual)) secoes.push(secaoAtual);
      continue;
    }

    if (!secoes.includes(secaoAtual)) secoes.push(secaoAtual);

    const valores = {};
    anos.forEach(a => { valores[a] = null; });
    Object.entries(colAno).forEach(([j, a]) => {
      const raw = row[j];
      if (raw === null || raw === undefined || raw === "") {
        valores[a] = null;
      } else if (typeof raw === "number") {
        valores[a] = raw;
      } else {
        const n = parseFloat(String(raw).replace(",", "."));
        valores[a] = isNaN(n) ? null : n;
      }
    });

    const obs = (colObs >= 0 && row[colObs]) ? String(row[colObs]).trim() : null;

    rows.push({ slug: makeSlug(label, rows), label, nivel, secao: secaoAtual, valores, obs });
  }

  return { rows, anos, secoes };
}

// Aba de transferências de um clube com blocos por ano.
function parseTransferSheet(clube) {
  const sheet = getSheet(abas.transferencias[clube]);
  const data = sheet.getDataRange().getValues();

  const resultado = {};
  anosRecorte.forEach(a => { resultado[a] = { saidas: [], entradas: [] }; });

  let anoAtual = null;
  let proxLinhaEh = null; // "header" | "data" | null

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const col1 = String(row[0] || "").trim();

    const mAno = col1.match(/^\s*(\d{4})\s*$/);
    if (mAno) {
      const a = parseInt(mAno[1], 10);
      if (anosRecorte.includes(a)) {
        anoAtual = a;
        proxLinhaEh = "header";
      }
      continue;
    }

    if (proxLinhaEh === "header") {
      proxLinhaEh = "data";
      continue;
    }

    if (/subtotal|total/i.test(col1)) {
      proxLinhaEh = null;
      continue;
    }

    if (anoAtual && proxLinhaEh === "data") {
      const jogSai = String(row[1] || "").trim();
      const dstSai = String(row[2] || "").trim();
      const valSai = parseFloat(String(row[3] || "").replace(",", ".")) || 0;
      const tipSai = String(row[4] || "").trim();

      const jogEnt = String(row[6] || "").trim();
      const oriEnt = String(row[7] || "").trim();
      const valEnt = parseFloat(String(row[8] || "").replace(",", ".")) || 0;
      const tipEnt = String(row[9] || "").trim();

      if (jogSai) resultado[anoAtual].saidas.push({ jogador: jogSai, clube: dstSai || null, valor_mi: valSai, tipo: tipSai || null });
      if (jogEnt) resultado[anoAtual].entradas.push({ jogador: jogEnt, clube: oriEnt || null, valor_mi: valEnt, tipo: tipEnt || null });
    }
  }

  return resultado;
}

//Utilitários

function normalizeParams(params) {
  const out = {};
  Object.keys(params).forEach(k => { out[k.toLowerCase()] = String(params[k]).toLowerCase().trim(); });
  return out;
}

function makeSlug(text, rows) {
  const base = text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "");

  const slugsExistentes = (rows || []).map(r => r.slug);
  let slug = base;
  let count = 2;
  while (slugsExistentes.includes(slug)) slug = base + "_" + count++;
  return slug;
}

function slugify(text) {
  return String(text)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isSectionHeader(text) {
  if (!text || text.length < 6) return false;
  const upper = text.trim().toUpperCase();
  return upper.startsWith("DEMONSTRA") || upper.startsWith("BALAN") || upper === "INDICADORES DERIVADOS";
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    const err = new Error(`Aba "${name}" não encontrada na planilha.`);
    err.httpCode = 404;
    throw err;
  }
  return sheet;
}

function validarClube(clube) {
  if (!clube) erro400('Parâmetro "clube" é obrigatório. Use: ' + clubesValidos.join(" | "));
  if (!clubesValidos.includes(clube)) erro400(`Clube "${clube}" inválido. Use: ${clubesValidos.join(" | ")}`);
}

function erro400(msg) {
  const e = new Error(msg);
  e.httpCode = 400;
  throw e;
}

function erroNotFound(msg) {
  const e = new Error(msg);
  e.httpCode = 404;
  throw e;
}

function respondOk(payload) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: payload })).setMimeType(ContentService.MimeType.JSON);
}

function respondError(code, message) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: { code, message } })).setMimeType(ContentService.MimeType.JSON);
}

// Suite de testes
function testarAPI() {
  let passed = 0, failed = 0;

  function run(descricao, params, assertFn) {
    try {
      const res = doGet({ parameter: params });
      const body = JSON.parse(res.getContent());
      assertFn(body);
      Logger.log(`  PASS: ${descricao}`);
      passed++;
    } catch (err) {
      Logger.log(`  FAIL: ${descricao}`);
      Logger.log(`     Erro: ${err.message}`);
      failed++;
    }
  }

  function ok(cond, msg) { if (!cond) throw new Error(msg || "Assertion failed"); }
  function eq(a, b, msg) { if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`); }
  function nn(v, msg) { if (v === null || v === undefined) throw new Error(msg || "Expected non-null"); }

  Logger.log("\n========================================");
  Logger.log("API Suite de Testes");
  Logger.log("========================================\n");

  // Bloco 1 — Health e metadados
  Logger.log("── Bloco 1: Health e metadados ──");

  run("health retorna status ok", { route: "health" }, body => {
    ok(body.success);
    eq(body.data.status, "ok");
    nn(body.data.planilha);
    ok(Array.isArray(body.data.abas));
  });

  run("clubes retorna os 4 clubes", { route: "clubes" }, body => {
    ok(body.success);
    clubesValidos.forEach(c => ok(body.data.clubes.includes(c), `deve conter ${c}`));
  });

  run("anos retorna recorte 2018–2025", { route: "anos" }, body => {
    ok(body.success);
    eq(body.data.anos[0], 2018);
    eq(body.data.anos[body.data.anos.length - 1], 2025);
    eq(body.data.anos.length, 8);
  });

  clubesValidos.forEach(clube => {
    run(`indicadores ${clube} retorna lista com slugs`, { route: "indicadores", clube }, body => {
      ok(body.success);
      ok(body.data.total > 0, "deve ter indicadores");
      ok(body.data.indicadores[0].slug, "primeiro indicador deve ter slug");
      ok(body.data.indicadores.some(i => i.comparavel_entre_clubes), "deve ter comparáveis");
    });
  });

  run("erro 400 — clube inválido", { route: "indicadores", clube: "corinthians" }, body => {
    ok(!body.success);
    eq(body.error.code, 400);
  });

  run("erro 404 — rota inexistente", { route: "xyz" }, body => {
    ok(!body.success);
    eq(body.error.code, 404);
  });

  // Bloco 2 — Desempenho esportivo
  Logger.log("\n── Bloco 2: Desempenho esportivo ──");

  clubesValidos.forEach(clube => {
    run(`desempenho ${clube} — todos os anos`, { route: "desempenho", clube }, body => {
      ok(body.success);
      eq(body.data.total, 8, "deve ter 8 temporadas");
    });
  });

  run("erro 404 — ano fora do recorte", { route: "desempenho", clube: "flamengo", ano: "2010" }, body => {
    ok(!body.success);
    eq(body.error.code, 404);
  });

  // Bloco 3 — Financeiro
  Logger.log("\n── Bloco 3: Financeiro ──");

  clubesValidos.forEach(clube => {
    run(`financeiro ${clube} — completo`, { route: "financeiro", clube }, body => {
      ok(body.success);
      nn(body.data.dados);
      ok(body.data.dados.dre, "deve ter seção dre");
      ok(body.data.dados.dre.some(l => l.nivel === 1), `${clube}: deve ter sub-itens (nivel 1) na DRE`);
    });
  });

  run("erro 400 — indicador inexistente", { route: "financeiro", clube: "flamengo", indicador: "custo_da_agua" }, body => {
    ok(!body.success);
    eq(body.error.code, 400);
  });

  // Bloco 4 — Comparativo entre clubes
  Logger.log("\n── Bloco 4: Comparativo entre clubes ──");

  Object.keys(indicadoresComparaveis).forEach(indicador => {
    run(`comparativo ${indicador} — 4 clubes, série completa`, { route: "comparativo", indicador }, body => {
      ok(body.success, "body=" + JSON.stringify(body).substring(0, 300));
      eq(body.data.clubes.length, 4, "deve trazer os 4 clubes por padrão");
      nn(body.data.serie[2018], "deve ter 2018");
      clubesValidos.forEach(c => nn(body.data.slugs_por_clube[c], `deve mapear slug de ${c}`));
    });
  });

  run("comparativo com subconjunto de clubes", { route: "comparativo", indicador: "receita_bruta", clubes: "flamengo,internacional" }, body => {
    ok(body.success);
    eq(body.data.clubes.length, 2);
    ok(body.data.clubes.includes("flamengo") && body.data.clubes.includes("internacional"));
  });

  run("erro 400 — indicador não comparável", { route: "comparativo", indicador: "custo_da_piscina" }, body => {
    ok(!body.success);
    eq(body.error.code, 400);
  });

  // Bloco 5 — Transferências
  Logger.log("\n── Bloco 5: Transferências ──");

  clubesValidos.forEach(clube => {
    run(`transferencias ${clube} — todas`, { route: "transferencias", clube }, body => {
      ok(body.success);
      eq(body.data.anos.length, 8, "deve cobrir 8 anos");
    });
  });

  run("erro 400 — direção inválida", { route: "transferencias", clube: "flamengo", direcao: "lateral" }, body => {
    ok(!body.success);
    eq(body.error.code, 400);
  });

  // Bloco 6 — Saldo de transferências
  Logger.log("\n── Bloco 6: Saldo de transferências ──");

  clubesValidos.forEach(clube => {
    run(`saldo_transferencias ${clube} — série completa`, { route: "saldo_transferencias", clube }, body => {
      ok(body.success);
      eq(body.data.anos.length, 8);
      nn(body.data.total.saldo_mi);
    });
  });

  run("erro 404 — ano inválido no saldo", { route: "saldo_transferencias", clube: "flamengo", ano: "2030" }, body => {
    ok(!body.success);
    eq(body.error.code, 404);
  });

  Logger.log("\n========================================");
  Logger.log(`  RESULTADO: ${passed} passaram | ${failed} falharam`);
  Logger.log(`  TOTAL: ${passed + failed} testes`);
  Logger.log("========================================\n");

}

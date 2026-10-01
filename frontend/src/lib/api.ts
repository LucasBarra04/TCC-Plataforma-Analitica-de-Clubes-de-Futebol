// Cliente para o backend, `/api` é redirecionado pelo proxy do Vite para http://localhost:8000
import type {
  BateriaHipotesesResponse,
  ComparativoIndicador,
  DesempenhoResponse,
  DiagnosticoComparativoResponse,
  DiagnosticoResponse,
  FinanceiroCompleto,
  IndicadoresResponse,
  PontuacaoFederacoesResponse,
  ProjecaoCurtoPrazo,
  ProjecaoMedioPrazo,
  ResultadoCorrelacao,
  SaldoTransferenciasResponse,
  TransferenciasResponse,
  VariavelDisponivel,
} from "./types";

const BASE_URL = "/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function getJson<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([chave, valor]) => {
      if (valor !== undefined) url.searchParams.set(chave, String(valor));
    });
  }

  const resposta = await fetch(url.pathname + url.search);
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new ApiError(resposta.status, corpo.detail ?? `Erro ${resposta.status} ao consultar ${path}`);
  }
  return resposta.json() as Promise<T>;
}

export const api = {
  clubes: () => getJson<{ clubes: string[] }>("/clubes"),
  anos: () => getJson<{ anos: number[] }>("/anos"),

  desempenho: (clube: string, ano?: number) =>
    getJson<DesempenhoResponse>(`/desempenho/${clube}`, { ano }),

  pontuacaoFederacoes: (clube: string) =>
    getJson<PontuacaoFederacoesResponse>(`/desempenho/${clube}/pontuacao`),

  diagnostico: (clube: string, ano?: number) =>
    getJson<DiagnosticoResponse>(`/diagnostico/${clube}`, { ano }),

  diagnosticoComparativo: (clubes?: string[], ano?: number) =>
    getJson<DiagnosticoComparativoResponse>("/diagnostico", {
      ano,
      clubes: clubes?.join(","),
    }),

  comparativoFinanceiro: (indicador: string, clubes?: string[], ano?: number) =>
    getJson<ComparativoIndicador>("/comparativo", {
      indicador,
      ano,
      clubes: clubes?.join(","),
    }),

  variaveisEstatisticas: () => getJson<{ variaveis: VariavelDisponivel[] }>("/estatisticas/variaveis"),

  correlacao: (variavelX: string, variavelY: string, clubes?: string[]) =>
    getJson<ResultadoCorrelacao>("/estatisticas/correlacao", {
      variavelX,
      variavelY,
      clubes: clubes?.join(","),
    }),

  hipoteses: () => getJson<BateriaHipotesesResponse>("/estatisticas/hipoteses"),

  indicadores: (clube: string) => getJson<IndicadoresResponse>(`/indicadores/${clube}`),

  financeiro: (clube: string) => getJson<FinanceiroCompleto>(`/financeiro/${clube}`),

  transferencias: (clube: string, ano?: number, direcao?: string, tipo?: string) =>
    getJson<TransferenciasResponse>(`/transferencias/${clube}`, { ano, direcao, tipo }),

  saldoTransferencias: (clube: string) =>
    getJson<SaldoTransferenciasResponse>(`/transferencias/${clube}/saldo`),

  projecaoCurtoPrazo: (clube: string, indicador: string) =>
    getJson<ProjecaoCurtoPrazo>(`/projecoes/${clube}/curto-prazo`, { indicador }),

  projecaoMedioPrazo: (clube: string, indicador: string, horizonteAnos: number) =>
    getJson<ProjecaoMedioPrazo>(`/projecoes/${clube}/medio-prazo`, { indicador, horizonteAnos }),
};

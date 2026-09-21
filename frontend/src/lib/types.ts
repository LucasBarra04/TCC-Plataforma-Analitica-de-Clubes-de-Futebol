export type Clube = "flamengo" | "palmeiras" | "internacional" | "sao_paulo";

export const CLUBES: { valor: Clube; label: string; sigla: string }[] = [
  { valor: "flamengo", label: "Flamengo", sigla: "FLA" },
  { valor: "palmeiras", label: "Palmeiras", sigla: "PAL" },
  { valor: "internacional", label: "Internacional", sigla: "INT" },
  { valor: "sao_paulo", label: "São Paulo", sigla: "SPO" },
];

export type StatusIndicador = "saudavel" | "atencao" | "critico" | "indisponivel";

export interface CardDiagnostico {
  indicador: string;
  valor: number | null;
  valorFormatado: string;
  status: StatusIndicador;
  texto: string;
}

export interface DiagnosticoResponse {
  clube: string;
  anoReferencia: number | null;
  cards: CardDiagnostico[];
}

export interface DiagnosticoComparativoResponse {
  anoReferencia: number | null;
  porClube: Record<string, CardDiagnostico[]>;
}

export interface TemporadaDesempenho {
  ano: number;
  [competicao: string]: string | number | null;
}

export interface DesempenhoResponse {
  clube: string;
  total: number;
  anos: number[];
  dados: TemporadaDesempenho[];
  fonte: string | null;
}

export interface PontuacaoAno {
  ano: number;
  bruta: number | null;
  peso: number | null;
  ponderada: number | null;
  detalhe: Record<string, unknown>;
}

export interface SerieFederacao {
  federacao: "cbf" | "conmebol";
  competicoesPontuadas: string[];
  anosRecorte: number[];
  serie: Record<number, PontuacaoAno>;
  totalPonderado: number | null;
  nota: string;
}

export interface PontuacaoFederacoesResponse {
  clube: string;
  cbf: SerieFederacao;
  conmebol: SerieFederacao;
  informativo: {
    serie: Record<number, Record<string, string | null>>;
    nota: string;
  };
}

export interface ComparativoIndicador {
  indicador: string;
  alias: string;
  clubes: string[];
  slugsPorClube: Record<string, string>;
  unidade: string;
  anos: number[];
  serie: Record<number, Record<string, number | null>>;
  nota: string | null;
}

export interface PontoPainel {
  clube: string;
  ano: number;
  x: number;
  y: number;
}

export interface ResultadoCorrelacao {
  variavelX: string;
  variavelY: string;
  n: number;
  pearsonR: number | null;
  pearsonP: number | null;
  spearmanR: number | null;
  spearmanP: number | null;
  forcaAssociacao: string | null;
  painel: PontoPainel[];
  nota: string;
}

export interface TesteHipotese {
  hipotese: string;
  descricao: string;
  resultados: ResultadoCorrelacao[];
}

export interface BateriaHipotesesResponse {
  testes: TesteHipotese[];
  notaMetodologica: string;
}

export interface VariavelDisponivel {
  chave: string;
  label: string;
  tipo: "financeira" | "esportiva";
  unidade: string;
  janelaAnos: number[];
}

// Financeiro

export interface IndicadorInfo {
  slug: string;
  label: string;
  secao: string;
  anosComDados: number;
  cobertura: string;
  unidade: string;
  comparavelEntreClubes: boolean;
  aliasComparativo: string | null;
}

export interface IndicadoresResponse {
  clube: string;
  total: number;
  indicadores: IndicadorInfo[];
}

export interface LinhaFinanceira {
  slug: string;
  label: string;
  nivel: number;
  unidade: string;
  valores: Record<number, number | null>;
  obs: string | null;
}

export interface FinanceiroCompleto {
  clube: string;
  anosRecorte: number[];
  unidadePadrao: string;
  dados: Record<string, LinhaFinanceira[]>;
  nota: string | null;
  fonte: string | null;
}

//Transferências

export interface Movimentacao {
  jogador: string;
  clube: string | null;
  valorMi: number;
  tipo: string | null;
}

export interface BlocoAnoTransferencias {
  saidas?: Movimentacao[];
  entradas?: Movimentacao[];
}

export interface TransferenciasResponse {
  clube: string;
  anos: number[];
  direcao: string;
  tipoFiltro: string | null;
  transferencias: Record<number, BlocoAnoTransferencias>;
  totais: { saidasMi: number; entradasMi: number; saldoMi: number };
  unidade: string;
  fonte: string | null;
}

export interface SaldoAno {
  saidasMi: number;
  entradasMi: number;
  saldoMi: number;
  nSaidas: number;
  nEntradas: number;
}

export interface SaldoTransferenciasResponse {
  clube: string;
  anos: number[];
  serie: Record<number, SaldoAno>;
  total: { saidasMi: number; entradasMi: number; saldoMi: number };
  unidade: string;
  fonte: string | null;
}

// Projeções

export interface ProjecaoCenario {
  ano: number;
  valorProjetado: number;
  metodo: string;
  premissas: Record<string, unknown>;
}

export interface ProjecaoCurtoPrazo {
  indicador: string;
  clube: string;
  anoBase: number;
  valorBase: number | null;
  cagr3Anos: number | null;
  mediaMovel3Anos: number | null;
  taxaAplicada: number | null;
  projecao: ProjecaoCenario | null;
}

export interface ProjecaoMedioPrazo {
  indicador: string;
  cenarioConservador: ProjecaoCenario[];
  cenarioBase: ProjecaoCenario[];
  cenarioOtimista: ProjecaoCenario[];
}

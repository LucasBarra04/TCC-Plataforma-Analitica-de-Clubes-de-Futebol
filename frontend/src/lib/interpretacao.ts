import type { ResultadoCorrelacao } from "./types";

export type TomInterpretacao = "significativo" | "inconclusivo";
export type Favorece = "H1" | "H2" | "H3" | "direcaoInesperada" | "inconclusivo";

export interface Interpretacao {
  rotulo: string;
  texto: string;
  tom: TomInterpretacao;
  favorece: Favorece;
}

const NOMES_VARIAVEL: Record<string, string> = {
  gastoContratacoes: "gasto em contratações",
  despesaOperacional: "despesas operacionais",
  receitaBruta: "receita bruta",
  endividamento: "endividamento",
  custoFutebol: "custo do futebol",
  concentracaoReceita: "concentração de receita",
  pontuacaoCbfBruta: "desempenho CBF",
  pontuacaoConmebolBruta: "desempenho CONMEBOL",
};

export function nomeVariavel(chave: string): string {
  return NOMES_VARIAVEL[chave] ?? chave;
}

export function interpretarResultado(r: ResultadoCorrelacao, tipo: "volume" | "qualidade"): Interpretacao {
  const varX = nomeVariavel(r.variavelX);
  const varY = nomeVariavel(r.variavelY);

  if (r.pearsonR === null || r.pearsonP === null) {
    return {
      rotulo: "Sem resultado",
      texto: `Não foi possível calcular a correlação entre ${varX} e ${varY}. ${r.nota}`,
      tom: "inconclusivo",
      favorece: "inconclusivo",
    };
  }

  const significativo = r.pearsonP < 0.05;
  const indicioFraco = !significativo && r.pearsonP < 0.1;
  const positiva = r.pearsonR > 0;

  if (tipo === "volume") {
    if (significativo) {
      return {
        rotulo: "Favorece H2",
        texto: `Associação estatisticamente significativa (p=${r.pearsonP.toFixed(3)}) entre ${varX} e ${varY}, ${
          positiva ? "no sentido esperado: mais recurso, mais desempenho." : "no sentido inverso: mais recurso, menos desempenho."
        }`,
        tom: "significativo",
        favorece: "H2",
      };
    }
    if (indicioFraco) {
      return {
        rotulo: "Indício fraco",
        texto: `p=${r.pearsonP.toFixed(3)} fica perto do limiar de significância, mas não passa. Com N=${r.n} isso não é conclusivo para nenhum dos dois lados.`,
        tom: "inconclusivo",
        favorece: "inconclusivo",
      };
    }
    return {
      rotulo: "Favorece H1",
      texto: `Sem associação estatisticamente significativa (p=${r.pearsonP.toFixed(3)}) entre ${varX} e ${varY}.`,
      tom: "significativo",
      favorece: "H1",
    };
  }

  if (significativo && !positiva) {
    return {
      rotulo: "Favorece H3",
      texto: `Correlação negativa e significativa (p=${r.pearsonP.toFixed(3)}): mais ${varX} está associado a menor ${varY}. Como valor maior em ${varX} significa pior controle financeiro, isso favorece H3.`,
      tom: "significativo",
      favorece: "H3",
    };
  }
  if (significativo && positiva) {
    return {
      rotulo: "Significativo, direção inesperada",
      texto: `Correlação positiva e significativa (p=${r.pearsonP.toFixed(3)}) entre ${varX} e ${varY}, o oposto do sentido que favoreceria H3. Vale investigar e discutir esse resultado.`,
      tom: "significativo",
      favorece: "direcaoInesperada",
    };
  }
  if (indicioFraco) {
    return {
      rotulo: "Indício fraco",
      texto: `p=${r.pearsonP.toFixed(3)} perto do limiar, mas não significativo com N=${r.n}.`,
      tom: "inconclusivo",
      favorece: "inconclusivo",
    };
  }
  return {
    rotulo: "Sem associação",
    texto: `Sem associação estatisticamente significativa (p=${r.pearsonP.toFixed(3)}) entre ${varX} e ${varY} nesta variável.`,
    tom: "inconclusivo",
    favorece: "inconclusivo",
  };
}

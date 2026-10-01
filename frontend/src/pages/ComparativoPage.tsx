import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../lib/api";
import { CLUBES } from "../lib/types";
import type { StatusIndicador } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { ErroState } from "../components/Shared";
import { ChartLegend } from "../components/ChartLegend";
import { Insight, Destaque } from "../components/Insight";
import { corEixo, corGrade, eixoTick, tooltipStyle } from "../lib/chartTheme";
import "../components/Skeleton.css";
import "./ComparativoPage.css";

const INDICADORES_DIAGNOSTICO = [
  { indicador: "crescimentoReceita", label: "Crescimento de Receita" },
  { indicador: "endividamento", label: "Endividamento" },
  { indicador: "custoFutebol", label: "Custo do Futebol" },
  { indicador: "concentracaoReceita", label: "Concentração de Receita" },
  { indicador: "eficienciaEsportivaCbf", label: "Eficiência Esportiva CBF" },
  { indicador: "eficienciaEsportivaConmebol", label: "Eficiência Esportiva CONMEBOL" },
];

const INDICADORES_FINANCEIROS = [
  { indicador: "receita_bruta", label: "Receita Bruta" },
  { indicador: "receita_operacional_liquida", label: "Receita Operacional Líquida" },
  { indicador: "superavit_deficit", label: "Superávit / Déficit" },
  { indicador: "ebitda", label: "EBITDA" },
  { indicador: "resultado_financeiro", label: "Resultado Financeiro" },
  { indicador: "passivo_total", label: "Passivo Total" },
];

const CORES_CLUBE: Record<string, string> = {
  flamengo: "red",
  palmeiras: "green",
  internacional: "yellow",
  sao_paulo: "blue",
};

export function ComparativoPage() {
  const [indicadorFinanceiro, setIndicadorFinanceiro] = useState("receita_bruta");

  const comparativo = useQuery({
    queryKey: ["diagnostico-comparativo"],
    queryFn: () => api.diagnosticoComparativo(),
  });

  const financeiro = useQuery({
    queryKey: ["comparativo-financeiro", indicadorFinanceiro],
    queryFn: () => api.comparativoFinanceiro(indicadorFinanceiro),
  });

  const dadosGrafico =
    financeiro.data?.anos.map((ano) => ({
      ano,
      ...financeiro.data!.serie[ano],
    })) ?? [];

  const insightFinanceiro = useMemo(() => {
    if (!financeiro.data || financeiro.data.anos.length === 0) return null;
    const ultimoAno = financeiro.data.anos[financeiro.data.anos.length - 1];
    const valoresAno = financeiro.data.serie[ultimoAno];
    const entradas = Object.entries(valoresAno).filter(([, v]) => v !== null) as [string, number][];
    if (entradas.length === 0) return null;
    const [clubeTopo, valorTopo] = entradas.reduce((a, b) => (b[1] > a[1] ? b : a));
    const label = CLUBES.find((c) => c.valor === clubeTopo)?.label ?? clubeTopo;
    const indicadorLabel = INDICADORES_FINANCEIROS.find((i) => i.indicador === indicadorFinanceiro)?.label ?? indicadorFinanceiro;
    return { ultimoAno, label, valorTopo, indicadorLabel };
  }, [financeiro.data, indicadorFinanceiro]);

  return (
    <div className="comparativo-page">
      <PageHeader title="Os 4 clubes lado a lado" meta="Recorte 2018 a 2025" />

      {comparativo.isError && <ErroState mensagem={(comparativo.error as Error).message} />}

      {comparativo.isLoading ? (
        <div className="comparativo-page__grade skeleton-wrap">
          {INDICADORES_DIAGNOSTICO.map((item) => (
            <div key={item.indicador} className="painel-indicador">
              <span className="skeleton-bloco" style={{ width: "60%", height: 10, marginBottom: 14 }} />
              {CLUBES.map((c) => (
                <span key={c.valor} className="skeleton-bloco" style={{ width: "100%", height: 22, marginTop: 8 }} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        comparativo.data && (
          <div className="comparativo-page__grade">
            {INDICADORES_DIAGNOSTICO.map(({ indicador, label }) => (
              <PainelIndicador  
                key={indicador}
                titulo={label}
                itens={CLUBES.map((c) => {
                  const card = comparativo.data.porClube[c.valor]?.find((x) => x.indicador === indicador);
                  return {
                    sigla: c.sigla,
                    valor: card?.valor ?? null,
                    valorFormatado: card?.valorFormatado ?? "N/D",
                    status: card?.status ?? "indisponivel",
                  };
                })}
              />
            ))}
          </div>
        )
      )}

      <div className="comparativo-page__secao-financeira">
        <div className="comparativo-page__secao-header">
          <h3>Série histórica financeira</h3>
          <select value={indicadorFinanceiro} onChange={(e) => setIndicadorFinanceiro(e.target.value)}>
            {INDICADORES_FINANCEIROS.map((i) => (
              <option key={i.indicador} value={i.indicador}>
                {i.label}
              </option>
            ))}
          </select>
        </div>

        {financeiro.isLoading && (
          <div className="skeleton-wrap">
            <span className="skeleton-bloco" style={{ width: "100%", height: 320 }} />
          </div>
        )}
        {financeiro.isError && <ErroState mensagem={(financeiro.error as Error).message} />}

        {financeiro.data && (
          <div className="comparativo-page__grafico">
            <ChartLegend itens={CLUBES.map((c) => ({ label: c.label, cor: CORES_CLUBE[c.valor] }))} />
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={dadosGrafico} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={corGrade} vertical={false} />
                <XAxis dataKey="ano" tick={eixoTick} stroke={corEixo} />
                <YAxis tick={eixoTick} stroke={corEixo} width={70} />
                <Tooltip {...tooltipStyle} />
                {CLUBES.map((c) => (
                  <Line
                    key={c.valor}
                    type="linear"
                    dataKey={c.valor}
                    name={c.label}
                    stroke={CORES_CLUBE[c.valor]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="comparativo-page__unidade">Unidade: {financeiro.data.unidade}</p>
          </div>
        )}

        {insightFinanceiro && (
          <Insight>
            Em {insightFinanceiro.ultimoAno}, <Destaque>{insightFinanceiro.label}</Destaque> tem o maior valor em{" "}
            {insightFinanceiro.indicadorLabel.toLowerCase()}: {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(insightFinanceiro.valorTopo)}.
          </Insight>
        )}
      </div>
    </div>
  );
}

interface ItemRanking {
  sigla: string;
  valor: number | null;
  valorFormatado: string;
  status: StatusIndicador;
}

function PainelIndicador({ titulo, itens }: { titulo: string; itens: ItemRanking[] }) {
  const valores = itens.map((i) => i.valor).filter((v): v is number => v !== null);
  const min = valores.length ? Math.min(...valores) : 0;
  const max = valores.length ? Math.max(...valores) : 1;
  const amplitude = max - min || 1;

  return (
    <div className="painel-indicador">
      <h4>{titulo}</h4>
      <div className="painel-indicador__barras">
        {itens.map((item) => {
          const largura = item.valor === null ? 0 : Math.max(4, ((item.valor - min) / amplitude) * 100);
          return (
            <div key={item.sigla} className="painel-indicador__linha">
              <span className="painel-indicador__sigla">{item.sigla}</span>
              <div className="painel-indicador__trilho">
                <div
                  className={`painel-indicador__barra painel-indicador__barra--${item.status}`}
                  style={{ width: `${largura}%` }}
                />
              </div>
              <span className="painel-indicador__valor numeric">{item.valorFormatado}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

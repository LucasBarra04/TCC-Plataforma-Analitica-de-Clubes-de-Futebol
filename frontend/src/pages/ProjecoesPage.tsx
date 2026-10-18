import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../lib/api";
import { useClubeParam } from "../lib/clubeContext";
import { CLUBES } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { PageTransition } from "../components/PageTransition";
import { ErroState } from "../components/Shared";
import { ChartLegend } from "../components/ChartLegend";
import { corEixo, corGrade, eixoTick, tooltipStyle } from "../lib/chartTheme";
import { useCountUp } from "../lib/useCountUp";
import "../components/Skeleton.css";
import "./ProjecoesPage.css";

const INDICADORES = [
  { indicador: "receita_bruta", label: "Receita Bruta" },
  { indicador: "receita_operacional_liquida", label: "Receita Operacional Líquida" },
  { indicador: "superavit_deficit", label: "Superávit / Déficit" },
  { indicador: "ebitda", label: "EBITDA" },
  { indicador: "resultado_financeiro", label: "Resultado Financeiro" },
  { indicador: "passivo_total", label: "Passivo Total" },
];

export function ProjecoesPage() {
  const [clube, trocarClube] = useClubeParam();
  const clubeInfo = CLUBES.find((c) => c.valor === clube);
  const [indicador, setIndicador] = useState("receita_bruta");
  const [horizonteAnos, setHorizonteAnos] = useState(3);

  const curtoPrazo = useQuery({
    queryKey: ["projecao-curto", clube, indicador],
    queryFn: () => api.projecaoCurtoPrazo(clube, indicador),
  });

  const medioPrazo = useQuery({
    queryKey: ["projecao-medio", clube, indicador, horizonteAnos],
    queryFn: () => api.projecaoMedioPrazo(clube, indicador, horizonteAnos),
  });

  const historico = useQuery({
    queryKey: ["historico-para-projecao", indicador, clube],
    queryFn: () => api.comparativoFinanceiro(indicador, [clube]),
  });

  const dadosGrafico = useMemo(() => {
    if (!curtoPrazo.data) return [];
    const { anoBase, valorBase } = curtoPrazo.data;
    const anos = new Set<number>();

    const historicoPorAno: Record<number, number | null> = {};
    historico.data?.anos.forEach((ano) => {
      historicoPorAno[ano] = historico.data!.serie[ano][clube];
      anos.add(ano);
    });

    medioPrazo.data?.cenarioBase.forEach((c) => anos.add(c.ano));
    medioPrazo.data?.cenarioConservador.forEach((c) => anos.add(c.ano));
    medioPrazo.data?.cenarioOtimista.forEach((c) => anos.add(c.ano));

    return Array.from(anos)
      .sort((a, b) => a - b)
      .map((ano) => {
        const ponto: Record<string, number | null> = { ano };
        if (historicoPorAno[ano] !== undefined) ponto.historico = historicoPorAno[ano];
        if (ano === anoBase && valorBase !== null) {
          ponto.conservador = valorBase;
          ponto.base = valorBase;
          ponto.otimista = valorBase;
        }
        const c = medioPrazo.data?.cenarioConservador.find((x) => x.ano === ano);
        if (c) ponto.conservador = c.valorProjetado;
        const b = medioPrazo.data?.cenarioBase.find((x) => x.ano === ano);
        if (b) ponto.base = b.valorProjetado;
        const o = medioPrazo.data?.cenarioOtimista.find((x) => x.ano === ano);
        if (o) ponto.otimista = o.valorProjetado;
        return ponto;
      });
  }, [curtoPrazo.data, medioPrazo.data, historico.data, clube]);

  return (
    <PageTransition transitionKey={clube}>
    <div className="projecoes-page">
      <PageHeader
        title={clubeInfo?.label ?? clube}
        meta="Curto prazo: média entre CAGR e média móvel. Médio prazo: cenários por percentil."
        clube={clube}
        onClubeChange={trocarClube}
        extra={
          <div className="projecoes-page__controles-extra">
            <label>
              <span>Indicador</span>
              <select value={indicador} onChange={(e) => setIndicador(e.target.value)}>
                {INDICADORES.map((i) => (
                  <option key={i.indicador} value={i.indicador}>
                    {i.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Horizonte</span>
              <select value={horizonteAnos} onChange={(e) => setHorizonteAnos(Number(e.target.value))}>
                <option value={2}>2 anos</option>
                <option value={3}>3 anos</option>
              </select>
            </label>
          </div>
        }
      />

      {curtoPrazo.isError && <ErroState mensagem={(curtoPrazo.error as Error).message} />}

      {curtoPrazo.isLoading ? (
        <div className="projecoes-page__resumo skeleton-wrap">
          <div className="resumo-item resumo-item--destaque">
            <span className="skeleton-bloco" style={{ width: "60%", height: 11 }} />
            <span className="skeleton-bloco" style={{ width: "50%", height: 40, marginTop: 10 }} />
          </div>
          <div className="projecoes-page__resumo-secundario">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="resumo-item">
                <span className="skeleton-bloco" style={{ width: "65%", height: 11 }} />
                <span className="skeleton-bloco" style={{ width: "45%", height: 18, marginTop: 8 }} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        curtoPrazo.data && (
          <div className="projecoes-page__resumo">
            <ResumoItem
              rotulo={curtoPrazo.data.projecao ? `Projeção ${curtoPrazo.data.projecao.ano}` : "Projeção curto prazo"}
              valor={curtoPrazo.data.projecao?.valorProjetado ?? null}
              destaque
            />
            <div className="projecoes-page__resumo-secundario">
              <ResumoItem rotulo={`Valor base (${curtoPrazo.data.anoBase})`} valor={curtoPrazo.data.valorBase} />
              <ResumoItem rotulo="CAGR 3 anos" valor={curtoPrazo.data.cagr3Anos} percentual />
              <ResumoItem rotulo="Taxa aplicada" valor={curtoPrazo.data.taxaAplicada} percentual />
            </div>
          </div>
        )
      )}

      {curtoPrazo.isLoading || medioPrazo.isLoading ? (
        <div className="projecoes-page__grafico skeleton-wrap">
          <span className="skeleton-bloco" style={{ width: "100%", height: 340 }} />
        </div>
      ) : (
        <div className="projecoes-page__grafico">
        <ChartLegend
          itens={[
            { label: "Histórico", cor: "#f2f2f2" },
            { label: "Conservador (p25)", cor: "red", tracejado: true },
            { label: "Base (p50)", cor: "yellow", tracejado: true },
            { label: "Otimista (p75)", cor: "green", tracejado: true },
          ]}
        />
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={dadosGrafico} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={corGrade} vertical={false} />
            <XAxis dataKey="ano" tick={eixoTick} stroke={corEixo} />
            <YAxis tick={eixoTick} stroke={corEixo} width={80} />
            <Tooltip {...tooltipStyle} />
            <Line type="linear" dataKey="historico" name="Histórico" stroke="#f2f2f2" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line
              type="linear"
              dataKey="conservador"
              name="Conservador (p25)"
              stroke="red"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 3 }}
            />
            <Line
              type="linear"
              dataKey="base"
              name="Base (p50)"
              stroke="yellow"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 3 }}
            />
            <Line
              type="linear"
              dataKey="otimista"
              name="Otimista (p75)"
              stroke="green"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
    </PageTransition>
  );
}

function ResumoItem({
  rotulo,
  valor,
  percentual,
  destaque,
}: {
  rotulo: string;
  valor: number | null;
  percentual?: boolean;
  destaque?: boolean;
}) {
  const animado = useCountUp(destaque ? valor : null, 700);
  const valorParaExibir = destaque ? animado : valor;

  const texto =
    valorParaExibir === null
      ? "N/D"
      : percentual
        ? `${(valorParaExibir * 100).toFixed(1)}%`
        : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(valorParaExibir);

  return (
    <div className={`resumo-item${destaque ? " resumo-item--destaque" : ""}`}>
      <span className="resumo-item__rotulo">{rotulo}</span>
      <span className="resumo-item__valor numeric">{texto}</span>
    </div>
  );
}

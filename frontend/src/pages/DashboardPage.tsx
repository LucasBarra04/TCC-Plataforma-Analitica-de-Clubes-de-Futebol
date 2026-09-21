import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { CLUBES } from "../lib/types";
import type { CardDiagnostico } from "../lib/types";
import { useClubeParam } from "../lib/clubeContext";
import { useCountUp } from "../lib/useCountUp";
import { PageHeader } from "../components/PageHeader";
import { PageTransition } from "../components/PageTransition";
import { ErroState, StatusBadge } from "../components/Shared";
import { IndicadorFaixa } from "../components/IndicadorFaixa";
import { Insight, Destaque } from "../components/Insight";
import "../components/Skeleton.css";
import "./DashboardPage.css";

const NOMES_INDICADOR: Record<string, string> = {
  crescimentoReceita: "Crescimento de Receita",
  endividamento: "Endividamento",
  custoFutebol: "Custo do Futebol",
  concentracaoReceita: "Concentração de Receita",
  eficienciaEsportivaCbf: "Eficiência Esportiva CBF",
  eficienciaEsportivaConmebol: "Eficiência Esportiva CONMEBOL",
};

const ORDEM_FINANCEIRA = ["crescimentoReceita", "endividamento", "custoFutebol", "concentracaoReceita"];
const ORDEM_ESPORTIVA = ["eficienciaEsportivaCbf", "eficienciaEsportivaConmebol"];

function formatarValorAnimado(indicador: string, valor: number): string {
  if (indicador === "endividamento") return `${valor.toFixed(2)}x`;
  if (["crescimentoReceita", "custoFutebol", "concentracaoReceita"].includes(indicador)) return `${(valor * 100).toFixed(1)}%`;
  return valor.toFixed(1);
}

export function DashboardPage() {
  const [clube, trocarClube] = useClubeParam();
  const clubeInfo = CLUBES.find((c) => c.valor === clube);

  const diagnostico = useQuery({
    queryKey: ["diagnostico", clube],
    queryFn: () => api.diagnostico(clube),
  });

  const encontrar = (chave: string) => diagnostico.data?.cards.find((c) => c.indicador === chave);
  const [primeiroFinanceiro, ...restoFinanceiro] = ORDEM_FINANCEIRA.map(encontrar);
  const esportivos = ORDEM_ESPORTIVA.map(encontrar);

  const financeirosValidos = ORDEM_FINANCEIRA.map(encontrar).filter((c): c is CardDiagnostico => !!c && c.status !== "indisponivel");
  const nSaudaveis = financeirosValidos.filter((c) => c.status === "saudavel").length;

  return (
    <PageTransition transitionKey={clube}>
      <div className="dashboard-page">
        <PageHeader title={clubeInfo?.label ?? clube} clube={clube} onClubeChange={trocarClube} />

        {diagnostico.isError && <ErroState mensagem={(diagnostico.error as Error).message} />}

        {diagnostico.data && financeirosValidos.length > 0 && (
          <Insight>
            <Destaque>
              {nSaudaveis} de {financeirosValidos.length}
            </Destaque>{" "}
            indicadores financeiros estão em situação saudável neste recorte.
          </Insight>
        )}

        <div className="dashboard-page__layout">
          <section className="dashboard-page__principal">
            <h3 className="dashboard-page__secao-titulo">Indicadores Financeiros</h3>

            {diagnostico.isLoading ? (
              <>
                <CardSkeleton grande />
                <div className="cards-row">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              </>
            ) : (
              diagnostico.data && (
                <>
                  {primeiroFinanceiro && <CardGrande card={primeiroFinanceiro} />}
                  <div className="cards-row">
                    {restoFinanceiro.map((card) => card && <CardDiagnosticoItem key={card.indicador} card={card} />)}
                  </div>
                </>
              )
            )}
          </section>

          <aside className="dashboard-page__secundaria">
            <h3 className="dashboard-page__secao-titulo">Eficiência Esportiva</h3>
            <div className="cards-stack">
              {diagnostico.isLoading ? (
                <>
                  <CardSkeleton grande />
                  <CardSkeleton grande />
                </>
              ) : (
                esportivos.map((card) => card && <CardGrande key={card.indicador} card={card} />)
              )}
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

function CardGrande({ card }: { card: CardDiagnostico }) {
  const valorAnimado = useCountUp(card.valor);
  const valorExibido =
    valorAnimado !== null && card.valor !== null ? formatarValorAnimado(card.indicador, valorAnimado) : card.valorFormatado;

  return (
    <article className={`diagnostico-card diagnostico-card--grande diagnostico-card--${card.status}`}>
      <header className="diagnostico-card__header">
        <h3>{NOMES_INDICADOR[card.indicador] ?? card.indicador}</h3>
        <StatusBadge status={card.status} />
      </header>
      <p className="diagnostico-card__valor diagnostico-card__valor--grande numeric">{valorExibido}</p>
      <IndicadorFaixa indicador={card.indicador} valor={card.valor} />
      <p className="diagnostico-card__texto">{card.texto}</p>
    </article>
  );
}

function CardDiagnosticoItem({ card }: { card: CardDiagnostico }) {
  return (
    <article className={`diagnostico-card diagnostico-card--${card.status}`}>
      <header className="diagnostico-card__header">
        <h3>{NOMES_INDICADOR[card.indicador] ?? card.indicador}</h3>
        <StatusBadge status={card.status} />
      </header>
      <p className="diagnostico-card__valor numeric">{card.valorFormatado}</p>
      <IndicadorFaixa indicador={card.indicador} valor={card.valor} />
      <p className="diagnostico-card__texto">{card.texto}</p>
    </article>
  );
}

function CardSkeleton({ grande }: { grande?: boolean }) {
  return (
    <article className={`diagnostico-card skeleton-wrap${grande ? " diagnostico-card--grande" : ""}`}>
      <header className="diagnostico-card__header">
        <span className="skeleton-bloco" style={{ width: "50%", height: 11 }} />
        <span className="skeleton-bloco" style={{ width: 52, height: 18 }} />
      </header>
      <span className="skeleton-bloco" style={{ width: grande ? "35%" : "45%", height: grande ? 50 : 22, margin: "10px 0" }} />
      <span className="skeleton-bloco" style={{ width: "100%", height: 8, marginTop: 10 }} />
      <span className="skeleton-bloco" style={{ width: "80%", height: 8, marginTop: 6 }} />
    </article>
  );
}

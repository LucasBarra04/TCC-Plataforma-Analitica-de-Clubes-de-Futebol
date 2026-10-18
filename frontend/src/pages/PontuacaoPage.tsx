import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../lib/api";
import { useClubeParam } from "../lib/clubeContext";
import { CLUBES } from "../lib/types";
import type { SerieFederacao } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { PageTransition } from "../components/PageTransition";
import { ErroState } from "../components/Shared";
import { corEixo, corGrade, eixoTick, tooltipStyle } from "../lib/chartTheme";
import "../components/Skeleton.css";
import "./PontuacaoPage.css";

export function PontuacaoPage() {
  const [clube, trocarClube] = useClubeParam();
  const clubeInfo = CLUBES.find((c) => c.valor === clube);

  const pontuacao = useQuery({
    queryKey: ["pontuacao", clube],
    queryFn: () => api.pontuacaoFederacoes(clube),
  });

  return (
    <PageTransition transitionKey={clube}>
    <div className="pontuacao-page">
      <PageHeader
        title={clubeInfo?.label ?? clube}
        meta="Pontuação por critério oficial de federação"
        clube={clube}
        onClubeChange={trocarClube}
      />

      {pontuacao.isError && <ErroState mensagem={(pontuacao.error as Error).message} />}

      {pontuacao.isLoading ? (
        <>
          <BlocoFederacaoSkeleton />
          <BlocoFederacaoSkeleton />
          <TabelaInformativoSkeleton />
        </>
      ) : (
        pontuacao.data && (
          <>
            <BlocoFederacao titulo="CBF: Brasileirão e Copa do Brasil" serie={pontuacao.data.cbf} cor="green" />
            <BlocoFederacao titulo="CONMEBOL: Libertadores e Sul-Americana" serie={pontuacao.data.conmebol} cor="blue" />

            <div className="pontuacao-page__informativo">
              <h3>Histórico informativo (sem pontuação numérica)</h3>
              <p className="pontuacao-page__informativo-nota">{pontuacao.data.informativo.nota}</p>
              <div className="tabela-secao__scroll">
                <table className="tabela-informativo">
                  <thead>
                    <tr>
                      <th>Ano</th>
                      <th>Estadual</th>
                      <th>Mundial de Clubes</th>
                      <th>Copa do Mundo de Clubes</th>
                      <th>Recopa Sul-Americana</th>
                      <th>Supercopa do Brasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(pontuacao.data.informativo.serie).map(([ano, dados]) => (
                      <tr key={ano}>
                        <td>{ano}</td>
                        <td>{dados.campeonatoEstadual ?? "N/D"}</td>
                        <td>{dados.mundialDeClubes ?? "N/D"}</td>
                        <td>{dados.copaDoMundoDeClubes ?? "N/D"}</td>
                        <td>{dados.recopaSulAmericana ?? "N/D"}</td>
                        <td>{dados.supercopaDoBrasil ?? "N/D"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}
    </div>
    </PageTransition>
  );
}

function BlocoFederacao({ titulo, serie, cor }: { titulo: string; serie: SerieFederacao; cor: string }) {
  const dadosGrafico = Object.values(serie.serie)
    .filter((v) => v.bruta !== null)
    .map((v) => ({ ano: v.ano, bruta: v.bruta, ponderada: v.ponderada }));

  return (
    <div className="bloco-federacao">
      <div className="bloco-federacao__header">
        <h3>{titulo}</h3>
        <span className="bloco-federacao__total numeric">
          Total ponderado: {serie.totalPonderado !== null ? serie.totalPonderado.toFixed(1) : "N/D"}
        </span>
      </div>

      {dadosGrafico.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dadosGrafico} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={corGrade} vertical={false} />
            <XAxis dataKey="ano" tick={eixoTick} stroke={corEixo} />
            <YAxis tick={eixoTick} stroke={corEixo} width={50} />
            <Tooltip {...tooltipStyle} />
            <Line type="linear" dataKey="bruta" name="Pontuação bruta" stroke={cor} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="bloco-federacao__vazio">Sem pontuação disponível no recorte oficial desta federação.</p>
      )}

      <p className="bloco-federacao__nota">{serie.nota}</p>
    </div>
  );
}

function BlocoFederacaoSkeleton() {
  return (
    <div className="bloco-federacao skeleton-wrap">
      <div className="bloco-federacao__header">
        <span className="skeleton-bloco" style={{ width: 220, height: 14 }} />
        <span className="skeleton-bloco" style={{ width: 140, height: 12 }} />
      </div>
      <span className="skeleton-bloco" style={{ width: "100%", height: 220 - 40 }} />
    </div>
  );
}

function TabelaInformativoSkeleton() {
  return (
    <div className="pontuacao-page__informativo skeleton-wrap">
      <span className="skeleton-bloco" style={{ width: 260, height: 11 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="skeleton-bloco" style={{ width: "100%", height: 10 }} />
        ))}
      </div>
    </div>
  );
}

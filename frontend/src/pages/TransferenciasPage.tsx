import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../lib/api";
import { useClubeParam } from "../lib/clubeContext";
import { CLUBES } from "../lib/types";
import { formatarMilhoes } from "../lib/formato";
import { useCountUp } from "../lib/useCountUp";
import { PageHeader } from "../components/PageHeader";
import { PageTransition } from "../components/PageTransition";
import { ErroState } from "../components/Shared";
import { ChartLegend } from "../components/ChartLegend";
import { corEixo, corGrade, eixoTick, tooltipStyle } from "../lib/chartTheme";
import "../components/Skeleton.css";
import "./TransferenciasPage.css";

const LABEL_TIPO: Record<string, string> = {
  transferencia: "Transferência",
  emprestimo: "Empréstimo",
  custo_zero: "Custo zero",
  fim_emprestimo: "Fim de empréstimo",
};

export function TransferenciasPage() {
  const [clube, trocarClube] = useClubeParam();
  const clubeInfo = CLUBES.find((c) => c.valor === clube);
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);

  const saldo = useQuery({
    queryKey: ["saldo-transferencias", clube],
    queryFn: () => api.saldoTransferencias(clube),
  });

  const anoAtivo = anoSelecionado ?? saldo.data?.anos[saldo.data.anos.length - 1] ?? null;

  const detalhe = useQuery({
    queryKey: ["transferencias-ano", clube, anoAtivo],
    queryFn: () => api.transferencias(clube, anoAtivo ?? undefined),
    enabled: anoAtivo !== null,
  });

  const dadosGrafico = saldo.data
    ? saldo.data.anos.map((ano) => ({
        ano,
        saidas: saldo.data.serie[ano].saidasMi,
        entradas: -saldo.data.serie[ano].entradasMi,
      }))
    : [];

  const blocoAno = anoAtivo !== null ? detalhe.data?.transferencias[anoAtivo] : undefined;

  return (
    <PageTransition transitionKey={clube}>
      <div className="transferencias-page">
      <PageHeader
        title={clubeInfo?.label ?? clube}
        meta="Mercado de transferências · fonte: Transfermarkt"
        clube={clube}
        onClubeChange={trocarClube}
      />

      {saldo.isError && <ErroState mensagem={(saldo.error as Error).message} />}

      {saldo.isLoading ? (
        <PaginaSkeleton />
      ) : (
        saldo.data && (
          <>
            <div className="transferencias-page__resumo">
              <ResumoCardGrande
                rotulo="Saldo do período"
                valorNumerico={saldo.data.total.saldoMi}
                destaque={saldo.data.total.saldoMi >= 0 ? "positivo" : "negativo"}
              />
              <div className="transferencias-page__resumo-secundario">
                <ResumoCard rotulo="Total saídas" valor={formatarMilhoes(saldo.data.total.saidasMi)} />
                <ResumoCard rotulo="Total entradas" valor={formatarMilhoes(saldo.data.total.entradasMi)} />
              </div>
            </div>

            <div className="transferencias-page__grafico">
              <ChartLegend
                itens={[
                  { label: "Saídas (vendas)", cor: "green" },
                  { label: "Entradas (contratações)", cor: "red" },
                ]}
              />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dadosGrafico} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={corGrade} vertical={false} />
                  <XAxis dataKey="ano" tick={eixoTick} stroke={corEixo} />
                  <YAxis tick={eixoTick} stroke={corEixo} width={60} />
                  <Tooltip {...tooltipStyle} formatter={(v) => `€ ${Math.abs(Number(v ?? 0)).toFixed(1)} mi`} />
                  <Bar dataKey="saidas" name="Saídas (€ mi)" fill="green" />
                  <Bar dataKey="entradas" name="Entradas (€ mi)" fill="red" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="transferencias-page__detalhe">
              <div className="transferencias-page__detalhe-header">
                <h3>Movimentações do ano</h3>
                <select value={anoAtivo ?? ""} onChange={(e) => setAnoSelecionado(Number(e.target.value))}>
                  {saldo.data.anos.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>

              {detalhe.isLoading ? (
                <div className="transferencias-page__colunas">
                  <ListaMovimentacaoSkeleton />
                  <ListaMovimentacaoSkeleton />
                </div>
              ) : (
                blocoAno && (
                  <div className="transferencias-page__colunas">
                    <ListaMovimentacao titulo="Saídas" lista={blocoAno.saidas ?? []} />
                    <ListaMovimentacao titulo="Entradas" lista={blocoAno.entradas ?? []} />
                  </div>
                )
              )}
            </div>
          </>
        )
      )}
      </div>
    </PageTransition>
  );
}

function ResumoCard({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: "positivo" | "negativo";
}) {
  return (
    <div className={`resumo-card${destaque ? ` resumo-card--${destaque}` : ""}`}>
      <span className="resumo-card__rotulo">{rotulo}</span>
      <span className="resumo-card__valor numeric">{valor}</span>
    </div>
  );
}

function ResumoCardGrande({
  rotulo,
  valorNumerico,
  destaque,
}: {
  rotulo: string;
  valorNumerico: number;
  destaque?: "positivo" | "negativo";
}) {
  const animado = useCountUp(valorNumerico);
  return (
    <div className={`resumo-card resumo-card--grande${destaque ? ` resumo-card--${destaque}` : ""}`}>
      <span className="resumo-card__rotulo">{rotulo}</span>
      <span className="resumo-card__valor numeric">{formatarMilhoes(animado)}</span>
    </div>
  );
}

function ListaMovimentacao({
  titulo,
  lista,
}: {
  titulo: string;
  lista: { jogador: string; clube: string | null; valorMi: number; tipo: string | null }[];
}) {
  return (
    <div className="lista-movimentacao">
      <h4>{titulo}</h4>
      {lista.length === 0 ? (
        <p className="lista-movimentacao__vazio">Nenhuma movimentação registrada.</p>
      ) : (
        <ul>
          {lista.map((m, i) => (
            <li key={`${m.jogador}-${i}`}>
              <span className="lista-movimentacao__info">
                <span className="lista-movimentacao__jogador">{m.jogador}</span>
                {m.tipo && <span className="lista-movimentacao__tipo">{LABEL_TIPO[m.tipo] ?? m.tipo}</span>}
              </span>
              <span className="lista-movimentacao__valor numeric">{formatarMilhoes(m.valorMi)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PaginaSkeleton() {
  return (
    <>
      <div className="transferencias-page__resumo skeleton-wrap">
        <div className="resumo-card resumo-card--grande">
          <span className="skeleton-bloco" style={{ width: "50%", height: 11 }} />
          <span className="skeleton-bloco" style={{ width: "45%", height: 40, marginTop: 10 }} />
        </div>
        <div className="transferencias-page__resumo-secundario">
          <div className="resumo-card">
            <span className="skeleton-bloco" style={{ width: "60%", height: 11 }} />
            <span className="skeleton-bloco" style={{ width: "50%", height: 20, marginTop: 8 }} />
          </div>
          <div className="resumo-card">
            <span className="skeleton-bloco" style={{ width: "60%", height: 11 }} />
            <span className="skeleton-bloco" style={{ width: "50%", height: 20, marginTop: 8 }} />
          </div>
        </div>
      </div>
      <div className="transferencias-page__grafico skeleton-wrap">
        <span className="skeleton-bloco" style={{ width: "100%", height: 260 }} />
      </div>
      <div className="transferencias-page__detalhe skeleton-wrap">
        <span className="skeleton-bloco" style={{ width: 200, height: 14, marginBottom: 18 }} />
        <div className="transferencias-page__colunas">
          <ListaMovimentacaoSkeleton />
          <ListaMovimentacaoSkeleton />
        </div>
      </div>
    </>
  );
}

function ListaMovimentacaoSkeleton() {
  return (
    <div className="lista-movimentacao skeleton-wrap">
      <span className="skeleton-bloco" style={{ width: 60, height: 10, marginBottom: 14 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className="skeleton-bloco" style={{ width: "100%", height: 10, marginTop: 10 }} />
      ))}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useClubeParam } from "../lib/clubeContext";
import { CLUBES } from "../lib/types";
import type { LinhaFinanceira } from "../lib/types";
import { formatarMoeda } from "../lib/formato";
import { PageHeader } from "../components/PageHeader";
import { PageTransition } from "../components/PageTransition";
import { ErroState } from "../components/Shared";
import "../components/Skeleton.css";
import "./FinanceiroPage.css";

const TITULO_SECAO: Record<string, string> = {
  dre: "Demonstração do Resultado (DRE)",
  balanco: "Balanço Patrimonial",
  indicadores: "Indicadores Derivados",
};

const ORDEM_SECAO = ["dre", "balanco", "indicadores"];
const LINHAS_ESPERADAS: Record<string, number> = { dre: 14, balanco: 6, indicadores: 2 };

export function FinanceiroPage() {
  const [clube, trocarClube] = useClubeParam();
  const clubeInfo = CLUBES.find((c) => c.valor === clube);

  const financeiro = useQuery({
    queryKey: ["financeiro", clube],
    queryFn: () => api.financeiro(clube),
  });

  return (
    <PageTransition transitionKey={clube}>
    <div className="financeiro-page">
      <PageHeader
        title={clubeInfo?.label ?? clube}
        meta="Demonstrações financeiras auditadas"
        clube={clube}
        onClubeChange={trocarClube}
      />

      {financeiro.isError && <ErroState mensagem={(financeiro.error as Error).message} />}

      {financeiro.isLoading ? (
        <>
          {ORDEM_SECAO.map((secao) => (
            <TabelaSecaoSkeleton key={secao} titulo={TITULO_SECAO[secao]} linhas={LINHAS_ESPERADAS[secao]} />
          ))}
        </>
      ) : (
        financeiro.data && (
          <>
            {ORDEM_SECAO.filter((secao) => financeiro.data.dados[secao]?.length).map((secao) => (
              <TabelaSecao
                key={secao}
                titulo={TITULO_SECAO[secao] ?? secao}
                linhas={financeiro.data.dados[secao]}
                anos={financeiro.data.anosRecorte}
              />
            ))}
            {financeiro.data.nota && <p className="financeiro-page__nota">{financeiro.data.nota}</p>}
          </>
        )
      )}
    </div>
    </PageTransition>
  );
}

function TabelaSecaoSkeleton({ titulo, linhas }: { titulo: string; linhas: number }) {
  return (
    <div className="tabela-secao skeleton-wrap">
      <h3>{titulo}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}>
        {Array.from({ length: linhas }).map((_, i) => (
          <div key={i} style={{ display: "flex", gap: 16 }}>
            <span className="skeleton-bloco" style={{ width: 180, height: 9, flexShrink: 0 }} />
            {Array.from({ length: 8 }).map((_, j) => (
              <span key={j} className="skeleton-bloco" style={{ flex: 1, height: 9 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabelaSecao({ titulo, linhas, anos }: { titulo: string; linhas: LinhaFinanceira[]; anos: number[] }) {
  return (
    <div className="tabela-secao">
      <h3>{titulo}</h3>
      <div className="tabela-secao__scroll">
        <table className="tabela-financeira">
          <thead>
            <tr>
              <th className="tabela-financeira__rotulo-col">Item</th>
              {anos.map((ano) => (
                <th key={ano}>{ano}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.slug} className={linha.nivel > 0 ? "tabela-financeira__sub-item" : undefined}>
                <td className="tabela-financeira__rotulo-col">{linha.label}</td>
                {anos.map((ano) => (
                  <td key={ano} className="numeric">
                    {formatarMoeda(linha.valores[ano] ?? null, linha.unidade)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

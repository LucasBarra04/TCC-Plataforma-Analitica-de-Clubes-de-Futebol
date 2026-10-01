import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { interpretarResultado, nomeVariavel } from "../lib/interpretacao";
import type { Interpretacao } from "../lib/interpretacao";
import type { ResultadoCorrelacao } from "../lib/types";
import { ErroState } from "../components/Shared";
import { PageHeader } from "../components/PageHeader";
import "../components/Skeleton.css";
import "./HipotesesPage.css";

type ResultadoInterpretado = { r: ResultadoCorrelacao; i: Interpretacao };

export function HipotesesPage() {
  const hipoteses = useQuery({
    queryKey: ["hipoteses"],
    queryFn: () => api.hipoteses(),
  });

  const agrupado = useMemo(() => {
    if (!hipoteses.data) return null;

    const testeVolume = hipoteses.data.testes.find((t) => t.hipotese.includes("Volume de recurso"));
    const testeQualidade = hipoteses.data.testes.find((t) => t.hipotese.includes("Hipótese 3"));

    const h1: ResultadoInterpretado[] = [];
    const h2: ResultadoInterpretado[] = [];
    const inconclusivosVolume: ResultadoInterpretado[] = [];

    testeVolume?.resultados.forEach((r) => {
      const i = interpretarResultado(r, "volume");
      if (i.favorece === "H1") h1.push({ r, i });
      else if (i.favorece === "H2") h2.push({ r, i });
      else inconclusivosVolume.push({ r, i });
    });

    const h3 = (testeQualidade?.resultados ?? []).map((r) => ({ r, i: interpretarResultado(r, "qualidade") }));
    const h3ComDados = h3.filter((x) => x.r.pearsonR !== null);
    const h3Favoraveis = h3ComDados.filter((x) => x.i.favorece === "H3");

    return { h1, h2, inconclusivosVolume, h3, h3ComDados, h3Favoraveis, totalVolume: testeVolume?.resultados.length ?? 0 };
  }, [hipoteses.data]);

  const totalSignificativos = agrupado
    ? agrupado.h1.length + agrupado.h2.length + agrupado.h3.filter((x) => x.i.tom === "significativo").length
    : 0;
  const totalGeral = agrupado ? agrupado.totalVolume + agrupado.h3.length : 0;

  return (
    <div className="hipoteses-page">
      <PageHeader
        title="Recurso financeiro × desempenho esportivo"
        meta={agrupado ? `${totalSignificativos} de ${totalGeral} testes deram resultado estatisticamente significativo` : undefined}
      />

      {hipoteses.isError && <ErroState mensagem={(hipoteses.error as Error).message} />}

      {hipoteses.isLoading ? (
        <BateriaSkeleton />
      ) : (
        hipoteses.data &&
        agrupado && (
          <>
            <p className="hipoteses-page__nota">{hipoteses.data.notaMetodologica}</p>

            <div className="hipoteses-page__par">
              <HipoteseBloco
                titulo="Hipótese 1 (H1)"
                definicao="Não existe associação estatisticamente significativa entre o recurso financeiro aplicado e o desempenho esportivo."
                resultados={agrupado.h1}
                totalTestado={agrupado.totalVolume}
              />
              <HipoteseBloco
                titulo="Hipótese 2 (H2)"
                definicao="Existe associação estatisticamente significativa entre o recurso financeiro aplicado e o desempenho esportivo."
                resultados={agrupado.h2}
                totalTestado={agrupado.totalVolume}
              />
            </div>

            {agrupado.inconclusivosVolume.length > 0 && (
              <div className="hipoteses-page__inconclusivos">
                <span className="hipoteses-page__inconclusivos-rotulo">
                  {agrupado.inconclusivosVolume.length} de {agrupado.totalVolume} testes de volume ficaram inconclusivos
                  (não favorecem H1 nem H2 com confiança)
                </span>
                <div className="teste-hipotese__lista">
                  {agrupado.inconclusivosVolume.map(({ r, i }) => (
                    <ResultadoCard key={`${r.variavelX}-${r.variavelY}`} r={r} i={i} />
                  ))}
                </div>
              </div>
            )}

            <HipoteseBloco
              titulo="Hipótese 3 (H3)"
              definicao="O que explica o desempenho não é o volume de recurso, mas a qualidade e o controle do gasto, endividamento, concentração de receita e custo do futebol."
              resultados={agrupado.h3}
              totalTestado={agrupado.h3.length}
              contagem={`${agrupado.h3Favoraveis.length} de ${agrupado.h3ComDados.length} pares testados favorecem H3`}
              className="hipoteses-page__h3"
            />
          </>
        )
      )}
    </div>
  );
}

function HipoteseBloco({
  titulo,
  definicao,
  resultados,
  totalTestado,
  contagem,
  className,
}: {
  titulo: string;
  definicao: string;
  resultados: ResultadoInterpretado[];
  totalTestado: number;
  contagem?: string;
  className?: string;
}) {
  return (
    <section className={`hipotese-bloco${className ? ` ${className}` : ""}`}>
      <h3>{titulo}</h3>
      <p className="hipotese-bloco__definicao">{definicao}</p>
      <p className="hipotese-bloco__contagem numeric">{contagem ?? `${resultados.length} de ${totalTestado} testes`}</p>
      <div className="teste-hipotese__lista">
        {resultados.length === 0 ? (
          <p className="hipotese-bloco__vazio">Nenhum teste favorece esta hipótese neste recorte.</p>
        ) : (
          resultados.map(({ r, i }) => <ResultadoCard key={`${r.variavelX}-${r.variavelY}`} r={r} i={i} />)
        )}
      </div>
    </section>
  );
}

function ResultadoCard({ r, i }: { r: ResultadoCorrelacao; i: Interpretacao }) {
  return (
    <article className={`resultado-correlacao resultado-correlacao--${i.tom}`}>
      <div className="resultado-correlacao__topo">
        <p className="resultado-correlacao__par">
          {nomeVariavel(r.variavelX)} <span>×</span> {nomeVariavel(r.variavelY)}
        </p>
        <span className={`interpretacao-marca interpretacao-marca--${i.tom}`}>
          <span className="interpretacao-marca__ponto" />
          {i.rotulo}
        </span>
      </div>

      {r.pearsonR !== null && (
        <div className="resultado-correlacao__stats numeric">
          <span>n = {r.n}</span>
          <span>r = {r.pearsonR.toFixed(3)}</span>
          <span>p = {r.pearsonP?.toFixed(3)}</span>
        </div>
      )}

      <p className="resultado-correlacao__texto">{i.texto}</p>
    </article>
  );
}

function BateriaSkeleton() {
  return (
    <div className="skeleton-wrap">
      <span className="skeleton-bloco" style={{ width: "70%", height: 10, marginBottom: 32 }} />
      <div className="hipoteses-page__par">
        {[0, 1].map((k) => (
          <section key={k} className="hipotese-bloco">
            <span className="skeleton-bloco" style={{ width: 40, height: 20 }} />
            <span className="skeleton-bloco" style={{ width: "90%", height: 10, marginTop: 12 }} />
            <span className="skeleton-bloco" style={{ width: "60%", height: 10, marginTop: 14, marginBottom: 16 }} />
            <div className="teste-hipotese__lista">
              {[0, 1].map((j) => (
                <div key={j} className="resultado-correlacao">
                  <span className="skeleton-bloco" style={{ width: "80%", height: 10 }} />
                  <span className="skeleton-bloco" style={{ width: "50%", height: 8, marginTop: 10 }} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

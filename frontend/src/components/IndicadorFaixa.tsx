import "./IndicadorFaixa.css";

// Espelha os limiares de config.py limiaresMotorRegras, se mudar la tem que mudar aqui.
const RANGE_EXIBICAO: Record<string, [number, number]> = {
  crescimentoReceita: [-0.1, 0.2],
  endividamento: [0, 4],
  custoFutebol: [0, 1],
  concentracaoReceita: [0, 1],
};

const LIMIARES: Record<string, { saudavel: number; atencao: number; direcao: "maior_melhor" | "menor_melhor" }> = {
  crescimentoReceita: { direcao: "maior_melhor", atencao: 0.04, saudavel: 0.08 },
  endividamento: { direcao: "menor_melhor", saudavel: 1.5, atencao: 2.5 },
  custoFutebol: { direcao: "menor_melhor", saudavel: 0.55, atencao: 0.7 },
  concentracaoReceita: { direcao: "menor_melhor", saudavel: 0.4, atencao: 0.6 },
};

export function IndicadorFaixa({ indicador, valor }: { indicador: string; valor: number | null }) {
  const range = RANGE_EXIBICAO[indicador];
  const limiar = LIMIARES[indicador];
  if (!range || !limiar || valor === null) return null;

  const [min, max] = range;
  const paraPercentual = (v: number) => (Math.min(max, Math.max(min, v)) - min) / (max - min) * 100;

  const pSaudavel = paraPercentual(limiar.saudavel);
  const pAtencao = paraPercentual(limiar.atencao);
  const marcador = paraPercentual(valor);

  const [corte1, corte2] = limiar.direcao === "maior_melhor" ? [pAtencao, pSaudavel] : [pSaudavel, pAtencao];

  const gradiente =
    limiar.direcao === "maior_melhor"
      ? `linear-gradient(to right, red 0%, red ${corte1}%, yellow ${corte1}%, yellow ${corte2}%, green ${corte2}%, green 100%)`
      : `linear-gradient(to right, green 0%, green ${corte1}%, yellow ${corte1}%, yellow ${corte2}%, red ${corte2}%, red 100%)`;

  return (
    <div className="indicador-faixa" aria-hidden="true">
      <div className="indicador-faixa__trilho" style={{ backgroundImage: gradiente }}>
        <span className="indicador-faixa__marcador" style={{ left: `${marcador}%` }} />
      </div>
    </div>
  );
}

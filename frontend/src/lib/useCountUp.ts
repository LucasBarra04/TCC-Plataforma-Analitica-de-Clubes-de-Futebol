import { useEffect, useRef, useState } from "react";

const prefereReduzirMovimento = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function useCountUp(valorAlvo: number | null, duracaoMs = 700): number | null {
  const [exibido, setExibido] = useState<number | null>(valorAlvo);
  const anteriorRef = useRef<number>(valorAlvo ?? 0);

  useEffect(() => {
    if (valorAlvo === null) {
      setExibido(null);
      return;
    }

    if (prefereReduzirMovimento()) {
      setExibido(valorAlvo);
      anteriorRef.current = valorAlvo;
      return;
    }

    const alvo: number = valorAlvo;
    const inicio = anteriorRef.current;
    const diferenca = alvo - inicio;
    const t0 = performance.now();
    let frameId: number;

    function passo(agora: number) {
      const progresso = Math.min(1, (agora - t0) / duracaoMs);
      const suavizado = 1 - Math.pow(1 - progresso, 3);
      setExibido(inicio + diferenca * suavizado);
      if (progresso < 1) {
        frameId = requestAnimationFrame(passo);
      } else {
        anteriorRef.current = alvo;
      }
    }

    frameId = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frameId);
  }, [valorAlvo, duracaoMs]);

  return exibido;
}

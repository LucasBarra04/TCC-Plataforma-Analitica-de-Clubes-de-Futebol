# Funções de cálculo financeiro: CAGR, médias móveis e percentis.

from statistics import median
from typing import Optional

import numpy as np


def filtrarPeriodo(
    serie: dict[int, Optional[float]],
    anoInicio: Optional[int] = None,
    anoFim: Optional[int] = None,
) -> dict[int, Optional[float]]:
    return {
        ano: valor for ano, valor in serie.items()
        if (anoInicio is None or ano >= anoInicio) and (anoFim is None or ano <= anoFim)
    }


def calcularCagr(serie: dict[int, Optional[float]], janelaAnos: Optional[int] = None) -> Optional[float]:

    anosValidos = sorted(a for a, v in serie.items() if v is not None)
    if len(anosValidos) < 2:
        return None

    if janelaAnos is not None:
        anoCorte = anosValidos[-1] - janelaAnos
        anosValidos = [a for a in anosValidos if a >= anoCorte]
        if len(anosValidos) < 2:
            return None

    anoInicial, anoFinal = anosValidos[0], anosValidos[-1]
    valorInicial, valorFinal = serie[anoInicial], serie[anoFinal]
    nPeriodos = anoFinal - anoInicial

    if nPeriodos <= 0 or valorInicial is None or valorInicial <= 0:
        return None

    cagr = (valorFinal / valorInicial) ** (1 / nPeriodos) - 1 # CAGR
    return round(cagr, 6)


def calcularCagrMultiplasJanelas(
    serie: dict[int, Optional[float]], janelas: tuple[int, ...] = (3, 5, 8)
) -> dict[str, Optional[float]]:
    return {f"cagr{j}Anos": calcularCagr(serie, janelaAnos=j) for j in janelas}


def calcularMediaMovel(serie: dict[int, Optional[float]], janela: int = 3) -> dict[int, Optional[float]]:
    anosOrdenados = sorted(serie.keys())
    resultado: dict[int, Optional[float]] = {}

    for ano in anosOrdenados:
        janelaAnos = [a for a in anosOrdenados if ano - janela + 1 <= a <= ano]
        valores = [serie[a] for a in janelaAnos if serie.get(a) is not None]
        resultado[ano] = round(sum(valores) / len(valores), 4) if valores else None

    return resultado


def calcularPercentisCagr(serie: dict[int, Optional[float]]) -> dict[str, Optional[float]]:
    # Percentis 25/50/75 das taxas de crescimento para projeção de médio prazo conservador, base, otimista.
    anosValidos = sorted(a for a, v in serie.items() if v is not None)
    variacoes: list[float] = []

    for aPrev, aAtual in zip(anosValidos, anosValidos[1:]):
        vPrev, vAtual = serie[aPrev], serie[aAtual]
        if vPrev and vPrev > 0:
            variacoes.append((vAtual / vPrev) - 1)

    if len(variacoes) < 2:
        return {"p25": None, "p50": None, "p75": None}

    return {
        "p25": round(float(np.percentile(variacoes, 25)), 6),
        "p50": round(float(median(variacoes)), 6),
        "p75": round(float(np.percentile(variacoes, 75)), 6),
    }


def ultimoValorValido(serie: dict[int, Optional[float]]) -> tuple[Optional[int], Optional[float]]:
    anosValidos = sorted((a for a, v in serie.items() if v is not None), reverse=True)
    if not anosValidos:
        return None, None
    ano = anosValidos[0]
    return ano, serie[ano]

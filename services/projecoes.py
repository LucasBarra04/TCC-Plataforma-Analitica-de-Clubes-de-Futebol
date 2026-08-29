# Serviço de projeções financeiras.

# Metodologia das Projeções (Tratadas como estimativas acadêmicas; longo prazo descartado por insuficiência amostral):
# Curto prazo (1 ano): Média(CAGR 3 anos, MM 3 anos) aplicada ao último valor observado.
# Médio prazo (2-3 anos): Cenários conservador/base/otimista utilizando os percentis 25, 50 e 75 das variações históricas como taxas compostas sucessivas sobre o último valor.

from typing import Optional

from models.projecao import ProjecaoCenario, ProjecaoCurtoPrazo, ProjecaoMedioPrazo
from services import calculos, sheetsClient


def _serieIndicador(clube: str, indicador: str) -> dict[int, Optional[float]]:

    # Busca a série histórica de um indicador para um clube.
    try:
        dados = sheetsClient.comparativo(indicador)
        return {int(a): v.get(clube) for a, v in dados["serie"].items()}
    except Exception:
        dados = sheetsClient.financeiro(clube, indicador=indicador)
        return {int(a): v for a, v in dados["serie"].items()}


def projetarCurtoPrazo(clube: str, indicador: str) -> ProjecaoCurtoPrazo:
    serie = _serieIndicador(clube, indicador)
    anoBase, valorBase = calculos.ultimoValorValido(serie)

    if anoBase is None or valorBase is None:
        return ProjecaoCurtoPrazo(
            indicador=indicador, clube=clube, anoBase=0, valorBase=None,
            cagr3Anos=None, mediaMovel3Anos=None, taxaAplicada=None, projecao=None,
        )

    cagr3 = calculos.calcularCagr(serie, janelaAnos=3)
    mediasMoveis = calculos.calcularMediaMovel(serie, janela=3)
    mediaMovelAtual = mediasMoveis.get(anoBase)

    taxaMediaMovel = (mediaMovelAtual / valorBase) - 1 if mediaMovelAtual and valorBase else None

    taxasDisponiveis = [t for t in [cagr3, taxaMediaMovel] if t is not None]
    taxaAplicada = round(sum(taxasDisponiveis) / len(taxasDisponiveis), 6) if taxasDisponiveis else None

    if taxaAplicada is None:
        projecao = None
    else:
        valorProjetado = round(valorBase * (1 + taxaAplicada), 2)
        projecao = ProjecaoCenario(
            ano=anoBase + 1, valorProjetado=valorProjetado, metodo="media_cagr3_media_movel3",
            premissas={
                "valorBase": valorBase, "anoBase": anoBase, "cagr3Anos": cagr3,
                "taxaMediaMovel3Anos": taxaMediaMovel, "taxaAplicada": taxaAplicada,
            },
        )

    return ProjecaoCurtoPrazo(
        indicador=indicador, clube=clube, anoBase=anoBase, valorBase=valorBase,
        cagr3Anos=cagr3, mediaMovel3Anos=mediaMovelAtual, taxaAplicada=taxaAplicada, projecao=projecao,
    )


def projetarMedioPrazo(clube: str, indicador: str, horizonteAnos: int = 3) -> ProjecaoMedioPrazo:
    if horizonteAnos not in (2, 3):
        raise ValueError("horizonteAnos deve ser 2 ou 3.")

    serie = _serieIndicador(clube, indicador)
    anoBase, valorBase = calculos.ultimoValorValido(serie)
    percentis = calculos.calcularPercentisCagr(serie)

    cenarios: dict[str, list[ProjecaoCenario]] = {"cenarioConservador": [], "cenarioBase": [], "cenarioOtimista": []}

    if anoBase is None or valorBase is None:
        return ProjecaoMedioPrazo(indicador=indicador, cenarioConservador=[], cenarioBase=[], cenarioOtimista=[])

    mapaCenarioPercentil = {
        "cenarioConservador": ("p25", percentis["p25"]),
        "cenarioBase": ("p50", percentis["p50"]),
        "cenarioOtimista": ("p75", percentis["p75"]),
    }

    for nomeCenario, (nomePercentil, taxa) in mapaCenarioPercentil.items():
        if taxa is None:
            continue
        valorCorrente = valorBase
        for passo in range(1, horizonteAnos + 1):
            valorCorrente = round(valorCorrente * (1 + taxa), 2)
            cenarios[nomeCenario].append(
                ProjecaoCenario(
                    ano=anoBase + passo, valorProjetado=valorCorrente, metodo=f"crescimento_composto_{nomePercentil}",
                    premissas={"valorBase": valorBase, "anoBase": anoBase, "taxaAnualAplicada": taxa, "percentil": nomePercentil},
                )
            )

    return ProjecaoMedioPrazo(
        indicador=indicador,
        cenarioConservador=cenarios["cenarioConservador"],
        cenarioBase=cenarios["cenarioBase"],
        cenarioOtimista=cenarios["cenarioOtimista"],
    )

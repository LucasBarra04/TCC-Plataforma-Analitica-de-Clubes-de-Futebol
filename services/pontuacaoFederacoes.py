# Pontuação de desempenho esportivo por critério oficial de federação.

import re
import unicodedata
from typing import Optional, TypedDict

# Tabelas oficiais

# CBF Campeonato Brasileiro Série A
pontuacaoBrasileiraoSerieA: dict[int, int] = {
    1: 800, 2: 640, 3: 600, 4: 560, 5: 552, 6: 544, 7: 536, 8: 528,
    9: 520, 10: 512, 11: 504, 12: 496, 13: 488, 14: 480, 15: 472,
    16: 464, 17: 456, 18: 448, 19: 440, 20: 432, 21: 424, 22: 416,
    23: 408, 24: 408, 25: 408, 26: 408, 27: 408,
}

# CBF Copa do Brasil
pontuacaoCopaDoBrasil: dict[str, int] = {
    "campeao": 600, "vice": 480, "semifinal": 450, "quartas": 400,
    "oitavas": 200, "fase_3": 100, "fase_2": 50, "fase_1": 25,
}

# CBF pesos do tempo
pesosTemporaisCbf: dict[int, int] = {0: 5, 1: 4, 2: 3, 3: 2, 4: 1}
anosRecorteCbf: list[int] = [2021, 2022, 2023, 2024, 2025]

# CONMEBOL Libertadores
pontuacaoLibertadores: dict[str, int] = {
    "campeao": 1000, "vice": 500, "semifinal": 300, "quartas": 200,
    "oitavas": 100, "grupos": 100, "fase_preliminar": 25,
}

# CONMEBOL Sul-Americana
pontuacaoSudamericana: dict[str, int] = {
    "campeao": 600, "vice": 300, "semifinal": 180, "quartas": 120,
    "oitavas": 60, "grupos": 60, "fase_preliminar": 15,
}

# CONMEBOL pesos do tempo
depreciacaoConmebolPorAno: dict[int, float] = {
    2025: 1.00, 2024: 0.90, 2023: 0.80, 2022: 0.70,
    2021: 0.60, 2020: 0.50, 2019: 0.40, 2018: 0.30,
}
anosRecorteConmebol: list[int] = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

def normalizarTexto(texto: str) -> str:
    semAcento = unicodedata.normalize("NFKD", texto)
    semAcento = "".join(c for c in semAcento if not unicodedata.combining(c))
    return semAcento.lower().strip()


def clubeParticipou(textoResultado: Optional[str]) -> bool:
    if not textoResultado:
        return False
    return normalizarTexto(textoResultado) not in ("-", "–", "")


def extrairPosicaoBrasileirao(textoResultado: Optional[str]) -> Optional[int]:
    if not clubeParticipou(textoResultado):
        return None
    m = re.match(r"\s*(\d+)", textoResultado)
    return int(m.group(1)) if m else None


def classificarFaseMataMata(textoResultado: Optional[str]) -> Optional[str]:
    if not clubeParticipou(textoResultado):
        return None

    norm = normalizarTexto(textoResultado)

    if "campe" in norm:
        return "campeao"
    if norm == "vice":
        return "vice"
    if "semifinal" in norm:
        return "semifinal"
    if "quartas" in norm:
        return "quartas"
    if "oitavas" in norm or "playoff" in norm:
        return "oitavas"
    if "grupos" in norm:
        return "grupos"
    if re.match(r"^\d+a?\s*fase$", norm) or "fase preliminar" in norm:
        numero = re.match(r"^(\d+)", norm)
        return f"fase_{numero.group(1)}" if numero else "fase_preliminar"

    return None


# Pontuação bruta sem peso de tempo por competição e ano

class ResultadoPontuado(TypedDict):
    competicao: str
    resultadoBruto: Optional[str]
    participou: bool
    chave: Optional[str]
    pontos: Optional[int]


def pontuarBrasileirao(textoResultado: Optional[str]) -> ResultadoPontuado:
    posicao = extrairPosicaoBrasileirao(textoResultado)
    pontos = pontuacaoBrasileiraoSerieA.get(posicao) if posicao else None
    return {
        "competicao": "brasileirao", "resultadoBruto": textoResultado,
        "participou": clubeParticipou(textoResultado),
        "chave": f"posicao_{posicao}" if posicao else None, "pontos": pontos,
    }


def pontuarCopaDoBrasil(textoResultado: Optional[str], ano: int) -> ResultadoPontuado:
    if ano not in anosRecorteCbf:
        return {
            "competicao": "copaDoBrasil", "resultadoBruto": textoResultado,
            "participou": clubeParticipou(textoResultado), "chave": None, "pontos": None,
        }
    chave = classificarFaseMataMata(textoResultado)
    pontos = pontuacaoCopaDoBrasil.get(chave) if chave else (0 if not clubeParticipou(textoResultado) else None)
    return {
        "competicao": "copaDoBrasil", "resultadoBruto": textoResultado,
        "participou": clubeParticipou(textoResultado), "chave": chave, "pontos": pontos,
    }


def pontuarContinental(textoResultado: Optional[str], competicao: str) -> ResultadoPontuado:
    tabela = pontuacaoLibertadores if competicao == "libertadores" else pontuacaoSudamericana
    if not clubeParticipou(textoResultado):
        return {
            "competicao": competicao, "resultadoBruto": textoResultado,
            "participou": False, "chave": None, "pontos": 0,
        }
    chave = classificarFaseMataMata(textoResultado)
    if chave and chave.startswith("fase_") and chave != "fase_preliminar":
        chave = "fase_preliminar"
    pontos = tabela.get(chave) if chave else None
    return {
        "competicao": competicao, "resultadoBruto": textoResultado,
        "participou": True, "chave": chave, "pontos": pontos,
    }


# Agregação por temporada e por federação

class PontuacaoAno(TypedDict):
    ano: int
    bruta: Optional[int]
    peso: Optional[float]
    ponderada: Optional[float]
    detalhe: dict[str, ResultadoPontuado]


def pontuarTemporadaCbf(temporada: dict) -> PontuacaoAno:
    ano = temporada["ano"]
    if ano not in anosRecorteCbf:
        return {"ano": ano, "bruta": None, "peso": None, "ponderada": None, "detalhe": {}}

    brasileirao = pontuarBrasileirao(temporada.get("brasileirao"))
    copaDoBrasil = pontuarCopaDoBrasil(temporada.get("copaDoBrasil"), ano)
    componentes = [brasileirao["pontos"], copaDoBrasil["pontos"]]

    if any(p is None for p in componentes):
        return {
            "ano": ano, "bruta": None, "peso": None, "ponderada": None,
            "detalhe": {"brasileirao": brasileirao, "copaDoBrasil": copaDoBrasil},
        }

    bruta = sum(componentes)
    peso = pesosTemporaisCbf[max(anosRecorteCbf) - ano]
    return {
        "ano": ano, "bruta": bruta, "peso": peso, "ponderada": bruta * peso,
        "detalhe": {"brasileirao": brasileirao, "copaDoBrasil": copaDoBrasil},
    }


def pontuarTemporadaConmebol(temporada: dict) -> PontuacaoAno:
    ano = temporada["ano"]
    if ano not in anosRecorteConmebol:
        return {"ano": ano, "bruta": None, "peso": None, "ponderada": None, "detalhe": {}}

    libertadores = pontuarContinental(temporada.get("copaLibertadores"), "libertadores")
    sudamericana = pontuarContinental(temporada.get("sulAmericana"), "sudamericana")
    bruta = (libertadores["pontos"] or 0) + (sudamericana["pontos"] or 0)
    peso = depreciacaoConmebolPorAno[ano]

    return {
        "ano": ano, "bruta": bruta, "peso": peso, "ponderada": round(bruta * peso, 2),
        "detalhe": {"libertadores": libertadores, "sudamericana": sudamericana},
    }


def serieHistoricaCbf(temporadas: list[dict]) -> dict:
    porAno = {t["ano"]: pontuarTemporadaCbf(t) for t in temporadas if t["ano"] in anosRecorteCbf}
    validos = [v for v in porAno.values() if v["ponderada"] is not None]
    return {
        "federacao": "cbf",
        "competicoesPontuadas": ["brasileirao", "copaDoBrasil"],
        "anosRecorte": anosRecorteCbf,
        "serie": porAno,
        "totalPonderado": round(sum(v["ponderada"] for v in validos), 2) if validos else None,
        "nota": "Copa do Brasil restrita a 2021-2025 (formato de 7 fases da Convenção CBF vigente).",
    }


def serieHistoricaConmebol(temporadas: list[dict]) -> dict:
    porAno = {t["ano"]: pontuarTemporadaConmebol(t) for t in temporadas if t["ano"] in anosRecorteConmebol}
    validos = [v for v in porAno.values() if v["ponderada"] is not None]
    return {
        "federacao": "conmebol",
        "competicoesPontuadas": ["copaLibertadores", "sulAmericana"],
        "anosRecorte": anosRecorteConmebol,
        "serie": porAno,
        "totalPonderado": round(sum(v["ponderada"] for v in validos), 2) if validos else None,
        "nota": "Pontuação por fase alcançada; bônus de vitória/empate por partida não é computado (planilha registra só a fase).",
    }


def historicoInformativo(temporadas: list[dict]) -> dict:
    porAno = {}
    for t in temporadas:
        porAno[t["ano"]] = {
            "campeonatoEstadual": t.get("campeonatoEstadual"),
            "mundialDeClubes": t.get("mundialDeClubesAnual"),
            "copaDoMundoDeClubes": t.get("copaDoMundoDeClubes"),
            "recopaSulAmericana": t.get("recopaSulAmericana"),
            "supercopaDoBrasil": t.get("supercopaDoBrasil"),
        }
    return {
        "serie": porAno,
        "nota": "Sem critério de federação unificado ou fora do Ranking de Clubes; exibido apenas como histórico.",
    }


def pontuacaoCompleta(clube: str, temporadas: list[dict]) -> dict:
    return {
        "clube": clube,
        "cbf": serieHistoricaCbf(temporadas),
        "conmebol": serieHistoricaConmebol(temporadas),
        "informativo": historicoInformativo(temporadas),
    }
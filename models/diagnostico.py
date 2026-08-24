# Schemas Pydantic para o motor de regras e cards de diagnóstico.

from typing import Literal, Optional
from pydantic import BaseModel


class CardDiagnostico(BaseModel):
    indicador: str
    valor: Optional[float]
    valorFormatado: str
    status: Literal["saudavel", "atencao", "critico", "indisponivel"]
    texto: str


class DiagnosticoResponse(BaseModel):
    clube: str
    anoReferencia: Optional[int] = None
    cards: list[CardDiagnostico]


class DiagnosticoSerieResponse(BaseModel):
    clube: str
    anos: list[int]
    serie: dict[int, list[CardDiagnostico]]


class DiagnosticoComparativoResponse(BaseModel):
    # Diagnóstico comparativo entre clubes.
    anoReferencia: Optional[int] = None
    porClube: dict[str, list[CardDiagnostico]]

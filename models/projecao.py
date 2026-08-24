# Schemas Pydantic para projeções financeiras de curto e médio prazo.

from typing import Optional
from pydantic import BaseModel


class ProjecaoCenario(BaseModel):
    ano: int
    valorProjetado: float
    metodo: str
    premissas: dict


class ProjecaoCurtoPrazo(BaseModel):
    indicador: str
    clube: str
    anoBase: int
    valorBase: Optional[float]
    cagr3Anos: Optional[float]
    mediaMovel3Anos: Optional[float]
    taxaAplicada: Optional[float]
    projecao: Optional[ProjecaoCenario]


class ProjecaoMedioPrazo(BaseModel):
    indicador: str
    cenarioConservador: list[ProjecaoCenario]
    cenarioBase: list[ProjecaoCenario]
    cenarioOtimista: list[ProjecaoCenario]


class ProjecaoComparativoResponse(BaseModel):
    indicador: str
    porClube: dict[str, ProjecaoMedioPrazo]

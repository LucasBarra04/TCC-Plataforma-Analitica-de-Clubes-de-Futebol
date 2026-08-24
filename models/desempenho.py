# Schemas Pydantic para o domínio de desempenho esportivo.

from typing import Optional
from pydantic import BaseModel, ConfigDict


class TemporadaDesempenho(BaseModel):

    # Desempenho esportivo da temporada, campos de competição variam por clube/ano

    model_config = ConfigDict(extra="allow")

    ano: int


class DesempenhoResponse(BaseModel):
    clube: str
    total: int
    anos: list[int]
    dados: list[TemporadaDesempenho]
    fonte: Optional[str] = None

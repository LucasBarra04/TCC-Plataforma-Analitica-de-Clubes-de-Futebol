# Schemas Pydantic para financeiro.

from typing import Optional
from pydantic import BaseModel


class IndicadorInfo(BaseModel):
    slug: str
    label: str
    secao: str
    anosComDados: int
    cobertura: str
    unidade: str
    comparavelEntreClubes: bool = False
    aliasComparativo: Optional[str] = None


class IndicadoresResponse(BaseModel):
    clube: str
    total: int
    indicadores: list[IndicadorInfo]


class SerieIndicador(BaseModel):
    clube: str
    indicador: str
    label: str
    secao: str
    unidade: str
    serie: dict[int, Optional[float]]
    anosComDados: list[int]
    obs: Optional[str] = None


class ValorPontual(BaseModel):
    clube: str
    indicador: str
    label: str
    secao: str
    unidade: str
    ano: int
    valor: Optional[float]
    obs: Optional[str] = None


class LinhaFinanceira(BaseModel):
    slug: str
    label: str
    unidade: str
    valores: dict[int, Optional[float]]
    obs: Optional[str] = None


class FinanceiroCompleto(BaseModel):
    clube: str
    anosRecorte: list[int]
    unidadePadrao: str
    dados: dict[str, list[LinhaFinanceira]]
    nota: Optional[str] = None
    fonte: Optional[str] = None


class SnapshotAno(BaseModel):
    clube: str
    ano: int
    unidade: str
    dados: dict[str, dict[str, Optional[float]]]
    nota: Optional[str] = None


class ComparativoIndicador(BaseModel):
    # Indicador financeiro comparado de 2 até 4 clubes.
    indicador: str
    alias: str
    clubes: list[str]
    slugsPorClube: dict[str, str]
    unidade: str
    anos: list[int]
    serie: dict[int, dict[str, Optional[float]]]
    nota: Optional[str] = None

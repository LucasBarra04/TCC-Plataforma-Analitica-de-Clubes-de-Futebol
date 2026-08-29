# Schemas Pydantic para estatística.

from typing import Optional
from pydantic import BaseModel


class PontoPainel(BaseModel):
    clube: str
    ano: int
    x: float
    y: float


class ResultadoCorrelacao(BaseModel):
    variavelX: str
    variavelY: str
    n: int
    pearsonR: Optional[float]
    pearsonP: Optional[float]
    spearmanR: Optional[float]
    spearmanP: Optional[float]
    forcaAssociacao: Optional[str] = None
    painel: list[PontoPainel]
    nota: str


class TesteHipotese(BaseModel):
    hipotese: str
    descricao: str
    resultados: list[ResultadoCorrelacao]


class BateriaHipotesesResponse(BaseModel):
    testes: list[TesteHipotese]
    notaMetodologica: str


class VariavelDisponivel(BaseModel):
    chave: str
    label: str
    tipo: str  # "financeira" | "esportiva"
    unidade: str
    janelaAnos: list[int]


class VariaveisDisponiveisResponse(BaseModel):
    variaveis: list[VariavelDisponivel]
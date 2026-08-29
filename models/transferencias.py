# Schemas Pydantic para transferências de atletas.

from typing import Optional
from pydantic import BaseModel


class Movimentacao(BaseModel):
    jogador: str
    clube: Optional[str] = None
    valorMi: float
    tipo: Optional[str] = None


class BlocoAno(BaseModel):
    saidas: Optional[list[Movimentacao]] = None
    entradas: Optional[list[Movimentacao]] = None


class TotaisTransferencias(BaseModel):
    saidasMi: float
    entradasMi: float
    saldoMi: float


class TransferenciasResponse(BaseModel):
    clube: str
    anos: list[int]
    direcao: str
    tipoFiltro: Optional[str] = None
    transferencias: dict[int, BlocoAno]
    totais: TotaisTransferencias
    unidade: str
    fonte: Optional[str] = None


class SaldoAno(BaseModel):
    saidasMi: float
    entradasMi: float
    saldoMi: float
    nSaidas: int
    nEntradas: int


class SaldoTransferenciasResponse(BaseModel):
    clube: str
    anos: list[int]
    serie: dict[int, SaldoAno]
    total: TotaisTransferencias
    unidade: str
    fonte: Optional[str] = None

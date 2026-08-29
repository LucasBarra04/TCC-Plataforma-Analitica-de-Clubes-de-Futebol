# Rotas de diagnóstico por clube.

from typing import Optional

from fastapi import APIRouter, Depends

from config import clubesValidos
from models.diagnostico import DiagnosticoComparativoResponse, DiagnosticoResponse
from routers.deps import anoQuery, clubePath, clubesQuery
from services import motorRegras

router = APIRouter(prefix="/diagnostico", tags=["Motor de Regras"])


@router.get("/{clube}", response_model=DiagnosticoResponse)
def getDiagnostico(clube: str = Depends(clubePath), ano: Optional[int] = Depends(anoQuery)):
    # 6 cards de diagnóstico de um clube.
    cards = motorRegras.gerarDiagnostico(clube, ano)
    return DiagnosticoResponse(clube=clube, anoReferencia=ano, cards=cards)


@router.get("", response_model=DiagnosticoComparativoResponse)
def getDiagnosticoComparativo(
    ano: Optional[int] = Depends(anoQuery),
    clubes: Optional[list[str]] = Depends(clubesQuery),
):
    # Cards de diagnóstico dos clubes selecionados
    clubesAlvo = clubes or clubesValidos
    porClube = {c: motorRegras.gerarDiagnostico(c, ano) for c in clubesAlvo}
    return DiagnosticoComparativoResponse(anoReferencia=ano, porClube=porClube)

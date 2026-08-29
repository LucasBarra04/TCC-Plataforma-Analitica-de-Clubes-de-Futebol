# Rotas financeiras: indicadores, séries históricas e comparativo entre clubes.

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from config import indicadoresComparaveis
from routers.deps import anoQuery, clubePath, clubesQuery
from services import sheetsClient

router = APIRouter(tags=["Financeiro"])


@router.get("/indicadores/{clube}")
def getIndicadores(clube: str = Depends(clubePath)):
    return sheetsClient.indicadores(clube)


@router.get("/financeiro/{clube}")
def getFinanceiro(
    clube: str = Depends(clubePath),
    ano: Optional[int] = Depends(anoQuery),
    indicador: Optional[str] = Query(None, description="Slug do indicador (ver /indicadores/{clube})"),
):
    return sheetsClient.financeiro(clube, ano, indicador)


@router.get("/comparativo")
def getComparativo(
    indicador: str = Query(..., description="Alias comparável, ex: receita_bruta"),
    ano: Optional[int] = Depends(anoQuery),
    clubes: Optional[list[str]] = Depends(clubesQuery),
):
    # Indicador financeiro comparável entre os clubes selecionados
    if indicador not in indicadoresComparaveis:
        raise HTTPException(
            status_code=400,
            detail=f'Indicador "{indicador}" não está na lista de comparáveis. Indicadores comparáveis: {", ".join(indicadoresComparaveis)}',
        )
    return sheetsClient.comparativo(indicador, ano, clubesFiltro=clubes)

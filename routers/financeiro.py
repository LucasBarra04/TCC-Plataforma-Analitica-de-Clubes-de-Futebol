# Rotas financeiras: indicadores, séries históricas e comparativo entre clubes.

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from config import INDICADORES_COMPARAVEIS
from routers.deps import ano_query, clube_path
from services import sheets_client

router = APIRouter(tags=["Financeiro"])

@router.get("/indicadores/{clube}")
def get_indicadores(clube: str = Depends(clube_path)):
    # Lista todos os indicadores financeiros disponíveis para um clube.
    return sheets_client.indicadores(clube)


@router.get("/financeiro/{clube}")
def get_financeiro(
    clube: str = Depends(clube_path),
    ano: Optional[int] = Depends(ano_query),
    indicador: Optional[str] = Query(
        None, description="Slug do indicador (ver /indicadores/{clube})"
    ),
):

    # Retorna dados financeiros de um clube.
    
    return sheets_client.financeiro(clube, ano, indicador)


@router.get("/comparativo")
def get_comparativo(
    indicador: str = Query(..., description="Alias comparável, ex: receita_bruta"),
    ano: Optional[int] = Depends(ano_query),
):
    # Retorna um indicador financeiro comparável entre dois clubes.
    if indicador not in INDICADORES_COMPARAVEIS:
        raise HTTPException(
            status_code=400,
            detail=(
                f'Indicador "{indicador}" não está na lista de comparáveis. '
                f'Indicadores comparáveis: {", ".join(INDICADORES_COMPARAVEIS)}'
            ),
        )
    return sheets_client.comparativo(indicador, ano)

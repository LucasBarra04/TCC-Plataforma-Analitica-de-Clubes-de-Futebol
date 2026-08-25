# Rotas de projeções financeiras de curto e médio prazo.

from fastapi import APIRouter, Depends, HTTPException, Query

from routers.deps import clubePath
from services import projecoes

router = APIRouter(prefix="/projecoes", tags=["Projeções"])


@router.get("/{clube}/curto-prazo")
def getProjecaoCurtoPrazo(
    clube: str = Depends(clubePath),
    indicador: str = Query(..., description="Alias comparável ou slug real do indicador"),
):
    # Projeção de 1 ano.
    return projecoes.projetarCurtoPrazo(clube, indicador)


@router.get("/{clube}/medio-prazo")
def getProjecaoMedioPrazo(
    clube: str = Depends(clubePath),
    indicador: str = Query(..., description="Alias comparável ou slug real do indicador"),
    horizonteAnos: int = Query(3, ge=2, le=3, description="2 ou 3 anos à frente"),
):
    # Projeção de médio prazo 2 até 3 anos.
    try:
        return projecoes.projetarMedioPrazo(clube, indicador, horizonteAnos)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

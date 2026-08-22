# Rotas de projeções financeiras de curto e médio prazo.

from fastapi import APIRouter, Depends, HTTPException, Query

from routers.deps import clube_path
from services import projecoes

router = APIRouter(prefix="/projecoes", tags=["Projeções"])


@router.get("/{clube}/curto-prazo")
def get_projecao_curto_prazo(
    clube: str = Depends(clube_path),
    indicador: str = Query(..., description="Alias comparável ou slug real do indicador"),
):

    # Projeção de 1 ano de um indicador financeiro, calculada como a média entre o CAGR de 3 anos e a taxa implícita da média móvel de 3 anos.
    
    return projecoes.projetar_curto_prazo(clube, indicador)


@router.get("/{clube}/medio-prazo")
def get_projecao_medio_prazo(
    clube: str = Depends(clube_path),
    indicador: str = Query(..., description="Alias comparável ou slug real do indicador"),
    horizonte_anos: int = Query(3, ge=2, le=3, description="2 ou 3 anos à frente"),
):
    
    # Projeção de médio prazo (2-3 anos) de um indicador financeiro, em três cenários (conservador/base/otimista) baseados nos percentis 25/50/75 das variações anuais históricas.
    try:
        return projecoes.projetar_medio_prazo(clube, indicador, horizonte_anos)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

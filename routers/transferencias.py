 # Rotas de transferências de atletas e saldos anuais.

from typing import Optional

from fastapi import APIRouter, Depends

from routers.deps import ano_query, clube_path, direcao_query, tipo_transferencia_query
from services import sheets_client

router = APIRouter(prefix="/transferencias", tags=["Transferências"])


@router.get("/{clube}")
def get_transferencias(
    clube: str = Depends(clube_path),
    ano: Optional[int] = Depends(ano_query),
    direcao: Optional[str] = Depends(direcao_query),
    tipo: Optional[str] = Depends(tipo_transferencia_query),
):
    # Retorna as transferências de um clube, com filtros opcionais de ano, direção e tipo.
    return sheets_client.transferencias(clube, ano, direcao, tipo)


@router.get("/{clube}/saldo")
def get_saldo_transferencias(
    clube: str = Depends(clube_path),
    ano: Optional[int] = Depends(ano_query),
):
    # Retorna o resumo anual de saldos de transferências (saídas, entradas, saldo) de um clube.
    return sheets_client.saldo_transferencias(clube, ano)

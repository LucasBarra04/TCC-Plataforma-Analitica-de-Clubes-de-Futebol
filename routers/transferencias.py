# Rotas de transferências de atletas e saldos anuais.

from typing import Optional

from fastapi import APIRouter, Depends

from routers.deps import anoQuery, clubePath, direcaoQuery, tipoTransferenciaQuery
from services import sheetsClient

router = APIRouter(prefix="/transferencias", tags=["Transferências"])


@router.get("/{clube}")
def getTransferencias(
    clube: str = Depends(clubePath),
    ano: Optional[int] = Depends(anoQuery),
    direcao: Optional[str] = Depends(direcaoQuery),
    tipo: Optional[str] = Depends(tipoTransferenciaQuery),
):
    return sheetsClient.transferencias(clube, ano, direcao, tipo)


@router.get("/{clube}/saldo")
def getSaldoTransferencias(clube: str = Depends(clubePath), ano: Optional[int] = Depends(anoQuery)):
    return sheetsClient.saldoTransferencias(clube, ano)

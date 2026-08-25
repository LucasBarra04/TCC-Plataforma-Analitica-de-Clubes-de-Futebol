# Rotas de desempenho esportivo.

from typing import Optional

from fastapi import APIRouter, Depends

from routers.deps import anoQuery, clubePath
from services import pontuacaoFederacoes, sheetsClient

router = APIRouter(prefix="/desempenho", tags=["Desempenho Esportivo"])


@router.get("/{clube}")
def getDesempenho(clube: str = Depends(clubePath), ano: Optional[int] = Depends(anoQuery)):
    return sheetsClient.desempenho(clube, ano)


@router.get("/{clube}/pontuacao")
def getPontuacaoFederacoes(clube: str = Depends(clubePath)):
    dados = sheetsClient.desempenho(clube)
    temporadas = dados.get("dados", [])
    return pontuacaoFederacoes.pontuacaoCompleta(clube, temporadas)

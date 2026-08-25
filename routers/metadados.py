# Rotas de metadados: health, clubes e anos do recorte.

from fastapi import APIRouter

from services import sheetsClient

router = APIRouter(tags=["Metadados"])


@router.get("/health")
def getHealth():
    dadosSheets = sheetsClient.health()
    return {"status": "ok", "backend": "fastapi", "sheetsApi": dadosSheets}


@router.get("/clubes")
def getClubes():
    return sheetsClient.clubes()


@router.get("/anos")
def getAnos():
    return sheetsClient.anos()

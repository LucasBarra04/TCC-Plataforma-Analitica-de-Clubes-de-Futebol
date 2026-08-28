from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import corsOrigins
from routers import desempenho, diagnostico, estatisticas, financeiro, metadados, projecoes, transferencias
from services.sheetsClient import SheetsAPIError

app = FastAPI(
    title="Plataforma Analítica de Clubes de Futebol - API",
    description=(
        "Backend FastAPI consome a API, calcula indicadores financeiros e esportivos, executa o motor de regras e gera projeções de curto e médio prazo."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=corsOrigins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.exception_handler(SheetsAPIError)
def handleSheetsApiError(request: Request, exc: SheetsAPIError):
    return JSONResponse(status_code=exc.code, content={"detail": exc.message})


app.include_router(metadados.router)
app.include_router(desempenho.router)
app.include_router(financeiro.router)
app.include_router(transferencias.router)
app.include_router(diagnostico.router)
app.include_router(projecoes.router)
app.include_router(estatisticas.router)


@app.get("/", tags=["Metadados"])
def raiz():
    return {
        "nome": "Plataforma Analítica de Clubes de Futebol — API"
    }
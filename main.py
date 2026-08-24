from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import CORS_ORIGINS
from routers import desempenho, diagnostico, financeiro, metadados, projecoes, transferencias
from services.sheets_client import SheetsAPIError

app = FastAPI(
    title="Plataforma Analítica de Clubes de Futebol - API",
    description=(
        "Backend FastAPI que consome a API do Google Apps Script, calcula "
        "indicadores financeiros e esportivos derivados, executa o motor "
        "de regras e gera projeções de curto e médio prazo."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.exception_handler(SheetsAPIError)
def handle_sheets_api_error(request: Request, exc: SheetsAPIError):
    
   # Mapeia os erros de negócio da API do Apps Script (success=false) para respostas HTTP correspondentes no FastAPI.

    return JSONResponse(status_code=exc.code, content={"detail": exc.message})


app.include_router(metadados.router)
app.include_router(desempenho.router)
app.include_router(financeiro.router)
app.include_router(transferencias.router)
app.include_router(diagnostico.router)
app.include_router(projecoes.router)


@app.get("/", tags=["Metadados"])
def raiz():
    # Endpoint raiz com informações básicas da API.
    return {
        "nome": "Plataforma Analítica de Clubes de Futebol — API",
        "versao": "1.0.0",
        "documentacao": "/docs",
    }

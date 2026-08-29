# Rotas de análise estatística.

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from models.estatistica import (
    BateriaHipotesesResponse, ResultadoCorrelacao, VariavelDisponivel, VariaveisDisponiveisResponse,
)
from routers.deps import clubesQuery
from services import analiseEstatistica as ae

router = APIRouter(prefix="/estatisticas", tags=["Análise Estatística"])

_notaMetodologica = (
    "Painel clube×ano (4 clubes). Janelas: CBF 2021-2025 e CONMEBOL 2018-2025. Devido à amostra restrita para inferência estatística, os resultados são indícios exploratórios e não provas causais."
)

_labels = {
    "receitaBruta": ("Receita Bruta", "financeira", "R$ mil"),
    "despesaOperacional": ("Despesas Operacionais", "financeira", "R$ mil"),
    "gastoContratacoes": ("Gasto em Contratações (proxy de recurso mobilizado)", "financeira", "€ milhões"),
    "endividamento": ("Endividamento (Passivo Total / Receita Bruta)", "financeira", "múltiplo"),
    "custoFutebol": ("Custo do Futebol (Despesas Operacionais / Receita Bruta)", "financeira", "percentual"),
    "concentracaoReceita": ("Concentração de Receita (maior fonte / total)", "financeira", "percentual"),
    "pontuacaoCbfBruta": ("Pontuação CBF bruta (Brasileirão + Copa do Brasil)", "esportiva", "pontos"),
    "pontuacaoConmebolBruta": ("Pontuação CONMEBOL bruta (Libertadores + Sul-Americana)", "esportiva", "pontos"),
}


@router.get("/variaveis", response_model=VariaveisDisponiveisResponse)
def getVariaveisDisponiveis():
    variaveis = [
        VariavelDisponivel(
            chave=chave, label=label, tipo=tipo, unidade=unidade,
            janelaAnos=ae._janelaPorVariavelEsportiva.get(chave, ae.anosRecorte),
        )
        for chave, (label, tipo, unidade) in _labels.items()
    ]
    return VariaveisDisponiveisResponse(variaveis=variaveis)


@router.get("/correlacao", response_model=ResultadoCorrelacao)
def getCorrelacao(
    variavelX: str = Query(..., description="Ver /estatisticas/variaveis"),
    variavelY: str = Query(..., description="Ver /estatisticas/variaveis"),
    clubes: Optional[list[str]] = Depends(clubesQuery),
):
    try:
        return ae.calcularCorrelacao(variavelX, variavelY, clubes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/hipoteses", response_model=BateriaHipotesesResponse)
def getBateriaHipoteses():
    testes = ae.rodarBateriaHipoteses()
    return BateriaHipotesesResponse(testes=testes, notaMetodologica=_notaMetodologica)
# Dependências FastAPI para validar parâmetros comuns entre as rotas.

from typing import Optional

from fastapi import HTTPException, Path, Query

from config import anoMax, anoMin, clubesValidos, direcoesValidas, tiposTransferenciaValidos


def clubePath(clube: str = Path(..., description="Clube: " + " | ".join(clubesValidos))) -> str:
    clubeNorm = clube.lower().strip()
    if clubeNorm not in clubesValidos:
        raise HTTPException(status_code=400, detail=f'Clube "{clube}" inválido. Use: {" | ".join(clubesValidos)}')
    return clubeNorm


def clubesQuery(
    clubes: Optional[str] = Query(None, description="Lista de clubes separados por vírgula, ex: flamengo,internacional. Padrão: todos.")
) -> Optional[list[str]]:
    if clubes is None:
        return None
    lista = [c.lower().strip() for c in clubes.split(",") if c.strip()]
    invalidos = [c for c in lista if c not in clubesValidos]
    if invalidos:
        raise HTTPException(status_code=400, detail=f'Clube(s) inválido(s): {", ".join(invalidos)}. Use: {" | ".join(clubesValidos)}')
    return lista


def anoQuery(ano: Optional[int] = Query(None, description=f"Ano específico ({anoMin}-{anoMax})")) -> Optional[int]:
    if ano is not None and not (anoMin <= ano <= anoMax):
        raise HTTPException(status_code=404, detail=f"Ano {ano} fora do recorte {anoMin}-{anoMax}.")
    return ano


def direcaoQuery(direcao: Optional[str] = Query(None, description='Direção: "saidas" ou "entradas"')) -> Optional[str]:
    if direcao is not None and direcao.lower() not in direcoesValidas:
        raise HTTPException(status_code=400, detail=f'Parâmetro "direcao" deve ser um de: {" | ".join(direcoesValidas)}')
    return direcao.lower() if direcao else None


def tipoTransferenciaQuery(tipo: Optional[str] = Query(None, description="Tipo de movimentação")) -> Optional[str]:
    if tipo is not None and tipo.lower() not in tiposTransferenciaValidos:
        raise HTTPException(status_code=400, detail=f'Parâmetro "tipo" deve ser um de: {" | ".join(tiposTransferenciaValidos)}')
    return tipo.lower() if tipo else None

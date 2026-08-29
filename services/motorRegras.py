# Motor de regras: avalia 5 indicadores críticos para gerar os Cards de Diagnóstico:

# 1. Crescimento de receita: CAGR (3 anos) da `receita_bruta`.
# 2. Endividamento: `passivo_total` / `receita_bruta` (utilizando os dados mais recentes de cada).
# 3. Custo do futebol: Busca label com "despesa" e "operacional" na DRE. Retorna "indisponivel" se não achar.
# 4. Concentração de receita: Maior fonte / soma das fontes na DRE (excluindo totais). Retorna "indisponivel" se o detalhamento for insuficiente.
# 5. Eficiência esportiva: Score de sucesso da temporada recente (via `PONTOS_RESULTADO`) comparado à média histórica do próprio clube.

import unicodedata
from typing import Optional

from config import limiaresEficienciaEsportiva, limiaresMotorRegras
from models.diagnostico import CardDiagnostico
from services import calculos, pontuacaoFederacoes, sheetsClient


# Utilitários de texto

def _normalizar(texto: str) -> str:
    nfkd = unicodedata.normalize("NFD", texto)
    semAcento = "".join(c for c in nfkd if not unicodedata.combining(c))
    return semAcento.lower()


def _termoNoLabel(termo: str, labelNorm: str) -> bool:
    if termo in labelNorm:
        return True
    if termo.endswith("al") and (termo[:-2] + "ais") in labelNorm:
        return True
    return False


def _card(indicador: str, valor: Optional[float], status: str, texto: str, formato: str = "percentual") -> CardDiagnostico:
    if valor is None:
        valorFormatado = "N/D"
    elif formato == "percentual":
        valorFormatado = f"{valor * 100:.1f}%"
    elif formato == "multiplo":
        valorFormatado = f"{valor:.2f}x"
    else:
        valorFormatado = f"{valor:.1f}"

    return CardDiagnostico(indicador=indicador, valor=valor, valorFormatado=valorFormatado, status=status, texto=texto)


# 1. Crescimento de receita

def avaliarCrescimentoReceita(clube: str, anoFim: Optional[int] = None) -> CardDiagnostico:
    limiares = limiaresMotorRegras["crescimentoReceita"]
    dados = sheetsClient.comparativo("receita_bruta")
    serieBruta = {int(ano): vals.get(clube) for ano, vals in dados["serie"].items()}
    serie = calculos.filtrarPeriodo(serieBruta, anoFim=anoFim)

    cagr = calculos.calcularCagr(serie, janelaAnos=3)

    if cagr is None:
        return _card("crescimentoReceita", None, "indisponivel", "Dados insuficientes para calcular o CAGR de 3 anos da receita bruta.")

    if cagr > limiares["saudavelMin"]:
        status, texto = "saudavel", f"Receita bruta cresceu {cagr*100:.1f}% a.a. (CAGR 3 anos), acima do limiar saudável de 8% a.a."
    elif cagr >= limiares["atencaoMin"]:
        status, texto = "atencao", f"Receita bruta cresceu {cagr*100:.1f}% a.a. (CAGR 3 anos), em faixa de atenção (4%–8% a.a.)."
    else:
        status, texto = "critico", f"Receita bruta cresceu apenas {cagr*100:.1f}% a.a. (CAGR 3 anos), abaixo do limiar crítico de 4% a.a."

    return _card("crescimentoReceita", cagr, status, texto, formato="percentual")


# 2. Endividamento

def avaliarEndividamento(clube: str, ano: Optional[int] = None) -> CardDiagnostico:
    limiares = limiaresMotorRegras["endividamento"]

    dadosPassivo = sheetsClient.comparativo("passivo_total")
    dadosReceita = sheetsClient.comparativo("receita_bruta")

    seriePassivo = {int(a): v.get(clube) for a, v in dadosPassivo["serie"].items()}
    serieReceita = {int(a): v.get(clube) for a, v in dadosReceita["serie"].items()}

    if ano:
        anoPassivo, passivo = ano, seriePassivo.get(ano)
        anoReceita, receita = ano, serieReceita.get(ano)
    else:
        anoPassivo, passivo = calculos.ultimoValorValido(seriePassivo)
        anoReceita, receita = calculos.ultimoValorValido(serieReceita)

    if passivo is None or not receita:
        return _card("endividamento", None, "indisponivel", "Dados insuficientes de Passivo Total ou Receita Bruta para calcular o endividamento.")

    razao = round(passivo / receita, 4)
    anoRef = anoPassivo if anoPassivo == anoReceita else min(a for a in [anoPassivo, anoReceita] if a)

    if razao < limiares["saudavelMax"]:
        status, texto = "saudavel", f"Passivo Total equivale a {razao:.2f}x a Receita Bruta ({anoRef}), abaixo do limiar saudável de 1,5x."
    elif razao <= limiares["atencaoMax"]:
        status, texto = "atencao", f"Passivo Total equivale a {razao:.2f}x a Receita Bruta ({anoRef}), em faixa de atenção (1,5x–2,5x)."
    else:
        status, texto = "critico", f"Passivo Total equivale a {razao:.2f}x a Receita Bruta ({anoRef}), acima do limiar crítico de 2,5x."

    return _card("endividamento", razao, status, texto, formato="multiplo")


# 3. Custo do futebol

def _buscarLinhaDre(clube: str, *palavrasChave: str) -> Optional[dict]:
    dados = sheetsClient.financeiro(clube)
    dre = dados.get("dados", {}).get("dre", [])
    for linha in dre:
        labelNorm = _normalizar(linha["label"])
        if all(_termoNoLabel(_normalizar(p), labelNorm) for p in palavrasChave):
            return linha
    return None


def buscarLinhaDespesaOperacional(clube: str) -> Optional[dict]:
    return _buscarLinhaDre(clube, "despesa", "operacional") or _buscarLinhaDre(clube, "custo", "operacional")


def avaliarCustoFutebol(clube: str, ano: Optional[int] = None) -> CardDiagnostico:
    limiares = limiaresMotorRegras["custoFutebol"]

    linhaDespesas = buscarLinhaDespesaOperacional(clube)
    if linhaDespesas is None:
        return _card("custoFutebol", None, "indisponivel", "Linha de Despesas Operacionais não identificada na DRE do clube.")

    dadosReceita = sheetsClient.comparativo("receita_bruta")
    serieReceita = {int(a): v.get(clube) for a, v in dadosReceita["serie"].items()}
    serieDespesas = {int(a): v for a, v in linhaDespesas["valores"].items()}

    if ano:
        despesa, receita, anoRef = serieDespesas.get(ano), serieReceita.get(ano), ano
    else:
        anoRef, despesa = calculos.ultimoValorValido(serieDespesas)
        receita = serieReceita.get(anoRef) if anoRef else None

    if despesa is None or not receita:
        return _card("custoFutebol", None, "indisponivel", "Dados insuficientes de Despesas Operacionais ou Receita Bruta.")

    razao = round(abs(despesa) / receita, 4)

    if razao < limiares["saudavelMax"]:
        status, texto = "saudavel", f"Despesas Operacionais consomem {razao*100:.1f}% da Receita Bruta ({anoRef}), abaixo do limiar saudável de 55%."
    elif razao <= limiares["atencaoMax"]:
        status, texto = "atencao", f"Despesas Operacionais consomem {razao*100:.1f}% da Receita Bruta ({anoRef}), em faixa de atenção (55%–70%)."
    else:
        status, texto = "critico", f"Despesas Operacionais consomem {razao*100:.1f}% da Receita Bruta ({anoRef}), acima do limiar crítico de 70%."

    return _card("custoFutebol", razao, status, texto, formato="percentual")


# 4. Concentração de receita

def extrairFontesReceita(dre: list[dict]) -> list[dict]:
    fontes = []
    dentroDoBloco = False
    for linha in dre:
        nivel = linha.get("nivel", 0)
        if nivel == 0:
            dentroDoBloco = "receita" in _normalizar(linha["label"])
            continue
        if dentroDoBloco and nivel == 1:
            fontes.append(linha)
    return fontes


def avaliarConcentracaoReceita(clube: str, ano: Optional[int] = None) -> CardDiagnostico:
    limiares = limiaresMotorRegras["concentracaoReceita"]

    dados = sheetsClient.financeiro(clube)
    dre = dados.get("dados", {}).get("dre", [])
    fontes = extrairFontesReceita(dre)

    if len(fontes) < 2:
        return _card("concentracaoReceita", None, "indisponivel", "A DRE não decompõe a receita em fontes suficientes (nível de sub-item) para calcular a concentração.")

    def valorNoAno(linha: dict, anoRef: int) -> Optional[float]:
        return linha["valores"].get(str(anoRef), linha["valores"].get(anoRef))

    anoRef = ano or max(int(a) for a in dados.get("anosRecorte", []))

    valoresAno = [(linha["label"], valorNoAno(linha, anoRef)) for linha in fontes]
    valoresValidos = [(label, v) for label, v in valoresAno if v is not None and v > 0]

    if len(valoresValidos) < 2:
        return _card("concentracaoReceita", None, "indisponivel", f"Fontes de receita sem dados suficientes para {anoRef}.")

    total = sum(v for _, v in valoresValidos)
    maiorLabel, maiorValor = max(valoresValidos, key=lambda x: x[1])
    razao = round(maiorValor / total, 4)

    if razao < limiares["saudavelMax"]:
        status, texto = "saudavel", f"Maior fonte de receita ('{maiorLabel}') representa {razao*100:.1f}% do total ({anoRef}), abaixo do limiar saudável de 40%."
    elif razao <= limiares["atencaoMax"]:
        status, texto = "atencao", f"Maior fonte de receita ('{maiorLabel}') representa {razao*100:.1f}% do total ({anoRef}), em faixa de atenção (40%–60%)."
    else:
        status, texto = "critico", f"Maior fonte de receita ('{maiorLabel}') representa {razao*100:.1f}% do total ({anoRef}), acima do limiar crítico de 60%."

    return _card("concentracaoReceita", razao, status, texto, formato="percentual")


# 5. Eficiência esportiva

def _avaliarEficienciaEsportivaFederacao(clube: str, ano: Optional[int], federacao: str) -> CardDiagnostico:
    indicador = f"eficienciaEsportiva{federacao.capitalize()}"
    limiares = limiaresEficienciaEsportiva

    dadosDesempenho = sheetsClient.desempenho(clube)
    temporadas = dadosDesempenho.get("dados", [])
    if not temporadas:
        return _card(indicador, None, "indisponivel", "Sem dados de desempenho esportivo disponíveis.")

    serieFn = pontuacaoFederacoes.serieHistoricaCbf if federacao == "cbf" else pontuacaoFederacoes.serieHistoricaConmebol
    serieFederacao = serieFn(temporadas)

    scores = {a: v["bruta"] for a, v in serieFederacao["serie"].items() if v["bruta"] is not None}
    if not scores:
        return _card(indicador, None, "indisponivel", f"Sem pontuação {federacao.upper()} disponível no recorte oficial.")

    mediaHistorica = sum(scores.values()) / len(scores)
    anoRef = ano or max(scores.keys())
    scoreAno = scores.get(anoRef)

    if scoreAno is None or mediaHistorica == 0:
        return _card(indicador, None, "indisponivel", f"Score {federacao.upper()} indisponível para o ano {anoRef}.")

    desvio = round((scoreAno - mediaHistorica) / mediaHistorica, 4)
    nomeFederacao = federacao.upper()

    if desvio >= 0:
        status, texto = "saudavel", (
            f"Score {nomeFederacao} de {anoRef} ({scoreAno} pts) está {desvio*100:.1f}% acima "
            f"da média histórica do clube ({mediaHistorica:.1f} pts)."
        )
    elif desvio >= limiares["atencaoDesvioMax"]:
        status, texto = "atencao", (
            f"Score {nomeFederacao} de {anoRef} ({scoreAno} pts) está {abs(desvio)*100:.1f}% abaixo "
            f"da média histórica do clube ({mediaHistorica:.1f} pts), dentro da faixa de atenção (até 20%)."
        )
    else:
        status, texto = "critico", (
            f"Score {nomeFederacao} de {anoRef} ({scoreAno} pts) está {abs(desvio)*100:.1f}% abaixo "
            f"da média histórica do clube ({mediaHistorica:.1f} pts), acima do limiar crítico de 20%."
        )

    return _card(indicador, float(scoreAno), status, texto, formato="numero")


def avaliarEficienciaEsportivaCbf(clube: str, ano: Optional[int] = None) -> CardDiagnostico:
    return _avaliarEficienciaEsportivaFederacao(clube, ano, "cbf")


def avaliarEficienciaEsportivaConmebol(clube: str, ano: Optional[int] = None) -> CardDiagnostico:
    return _avaliarEficienciaEsportivaFederacao(clube, ano, "conmebol")


# Agregador

def gerarDiagnostico(clube: str, ano: Optional[int] = None) -> list[CardDiagnostico]:
    # Executa os 6 avaliadores do motor de regras para um clube.
    return [
        avaliarCrescimentoReceita(clube, anoFim=ano),
        avaliarEndividamento(clube, ano=ano),
        avaliarCustoFutebol(clube, ano=ano),
        avaliarConcentracaoReceita(clube, ano=ano),
        avaliarEficienciaEsportivaCbf(clube, ano=ano),
        avaliarEficienciaEsportivaConmebol(clube, ano=ano),
    ]
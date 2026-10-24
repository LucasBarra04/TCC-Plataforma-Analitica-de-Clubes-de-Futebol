import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import anosRecorte, clubesValidos
from services import analiseEstatistica, motorRegras, pontuacaoFederacoes, sheetsClient

INDICADORES = {
    "crescimentoReceita": "CAGR",
    "endividamento": "Endividamento",
    "custoFutebol": "Custo Futebol",
    "concentracaoReceita": "Concentracao",
}


def fmt(valor):
    if valor is None:
        return "-"
    if isinstance(valor, float):
        return str(int(valor)) if valor.is_integer() else f"{valor:.4f}"
    return str(valor)


def tabela(cabecalho, linhas):
    todas = [cabecalho] + [[str(c) for c in l] for l in linhas]
    larguras = [max(len(l[i]) for l in todas) for i in range(len(cabecalho))]
    for k, linha in enumerate(todas):
        print("  ".join(c.ljust(larguras[i]) for i, c in enumerate(linha)).rstrip())
        if k == 0:
            print("  ".join("-" * w for w in larguras))
    print()


def hipoteses():
    print("HIPOTESES\n")
    for teste in analiseEstatistica.rodarBateriaHipoteses():
        print(teste.hipotese)
        linhas = [
            [
                f"{r.variavelX} x {r.variavelY}",
                r.n,
                fmt(r.pearsonR),
                fmt(r.pearsonP),
                fmt(r.spearmanR),
                fmt(r.spearmanP),
                fmt(r.forcaAssociacao),
            ]
            for r in teste.resultados
        ]
        tabela(["Par", "N", "r", "p", "rs", "p(rs)", "Forca"], linhas)


def pontuacao():
    print("PONTUACAO\n")
    for clube in clubesValidos:
        temporadas = sheetsClient.desempenho(clube).get("dados", [])
        resultado = pontuacaoFederacoes.pontuacaoCompleta(clube, temporadas)
        print(clube.upper())
        for federacao in ("cbf", "conmebol"):
            serie = resultado[federacao]["serie"]
            linhas = [
                [ano, fmt(v["bruta"]), fmt(v["peso"]), fmt(v["ponderada"])]
                for ano, v in sorted(serie.items(), key=lambda i: int(i[0]))
            ]
            print(f"{federacao.upper()} | total ponderado: {fmt(resultado[federacao]['totalPonderado'])}")
            tabela(["Ano", "Bruta", "Peso", "Ponderada"], linhas)


def indicadores():
    print("INDICADORES\n")
    for clube in clubesValidos:
        print(clube.upper())
        linhas = []
        for ano in anosRecorte:
            cards = {c.indicador: c for c in motorRegras.gerarDiagnostico(clube, ano)}
            linha = [ano]
            for chave in INDICADORES:
                card = cards.get(chave)
                if card is None or card.valor is None:
                    linha.append("N/D")
                else:
                    linha.append(f"{card.valorFormatado} ({card.status})")
            linhas.append(linha)
        tabela(["Ano", *INDICADORES.values()], linhas)


if __name__ == "__main__":
    hipoteses()
    pontuacao()
    indicadores()
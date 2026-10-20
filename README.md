# Plataforma Analítica de Clubes de Futebol

TCC Sistemas de Informação, UniAcademia

**Camadas:** Google Sheets + Apps Script (dados e API) → FastAPI (backend) → React + TypeScript (frontend).

Base de dados: [planilha do projeto](https://docs.google.com/spreadsheets/d/1ybyMyX7Ewatz3vl4T1Oc_DHPo4QydvJ6iIpP5U0dITY/edit)

## 1 Como executar

Requisitos: Python 3.12+ e Node.js 20+.

```bash
cp .env.example .env            # preencher SHEETS_API_URL
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

npm run install:frontend
npm install
npm run dev
```

Frontend em http://localhost:5173 e backend em http://localhost:8000 (`/docs`).

## 2 Dicionário de variáveis

| Variável | Definição | Unidade |
|---|---|---|
| Receita Bruta | Receita total do exercício (futebol + clube social) | R$ mil |
| Despesa Operacional | Custos das atividades e despesas operacionais (valor absoluto) | R$ mil |
| Gasto com Contratações | Soma dos valores das entradas de atletas no ano (Transfermarkt) | € milhões |
| Endividamento Geral | Passivo Total / Receita Bruta | x |
| Custo do Futebol | Despesa Operacional / Receita Bruta | % |
| Concentração de Receita | Maior fonte da DRE / soma das fontes | % |
| CAGR de Receita | Crescimento composto da Receita Bruta, janela trienal móvel | % a.a. |
| Pontuação CBF | Brasileirão + Copa do Brasil (2021–2025), pesos de 5 (2025) a 1 (2021) | pontos |
| Pontuação CONMEBOL | Libertadores + Sul-Americana (2018–2025), peso de 1,00 (2025) a 0,30 (2018) | pontos |

**Faixas do motor de regras**

| Indicador | Saudável | Atenção | Crítico |
|---|---|---|---|
| CAGR de Receita | ≥ 8% | 4% a 7,9% | < 4% |
| Endividamento Geral | ≤ 1,5x | 1,51x a 2,5x | > 2,5x |
| Custo do Futebol | ≤ 55% | 55,1% a 70% | > 70% |
| Concentração de Receita | < 40% | 40% a 60% | > 60% |
| Eficiência Esportiva (CBF e CONMEBOL) | desvio ≥ 0% | -20% a -0,1% | < -20% |

A Eficiência Esportiva compara o ano com a média do próprio clube.

**Testes:** Pearson (r) e Spearman (rs) sobre o painel clube-ano (20 observações na CBF e 32 na CONMEBOL). H1 e H2 usam Receita Bruta, Despesa Operacional e Gasto com Contratações. H3 usa Endividamento Geral, Custo do Futebol e Concentração de Receita, e **r < 0 com p < 0,05 favorece H3**.

## 3 Critérios de higienização

- **Fontes:** demonstrações auditadas (financeiro), Transfermarkt (transferências) e federações (desempenho). Em divergência, prevalece a demonstração auditada.
- **Ausentes:** célula vazia, `–` ou `-` vira `null`. Nada é preenchido por zero, média ou interpolação. O indicador sem dados aparece como N/D.
- **Painel:** só entram clubes-ano com as duas variáveis disponíveis, e com menos de 4 pares a correlação não é calculada.
- **Transferências:** movimentações sem valor (empréstimo, custo zero, fim de empréstimo) permanecem na lista com valor 0.
- **Nomenclatura:** linhas equivalentes de cada clube são mapeadas para um mesmo nome (ex.: `Receita Bruta Operacional` do Palmeiras vira Receita Bruta).
- **Unidades:** R$ mil nos dados financeiros e € milhões nas transferências, sem conversão. Os valores financeiros devem ser numéricos na célula.
- **CAGR:** 2019 e 2020 usam janela de 1 e 2 anos. O CAGR trienal pleno começa em 2021.
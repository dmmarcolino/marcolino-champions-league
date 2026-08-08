# Marcolino Champions League — passo a passo

O site é 100% estático (HTML/CSS/JS), pronto para hospedar no GitHub Pages,
igual ao site de vôlei. A única parte "viva" é o placar dos jogos, que fica
guardado numa Planilha Google e é lido/gravado pelo site através de um
pequeno script (Google Apps Script) publicado como "aplicativo da web".

Ninguém digita nada direto na planilha via GitHub — o fluxo é:

```
visitante digita o placar no site
        │
        ▼
site chama o Apps Script (via link https://script.google.com/.../exec)
        │
        ▼
Apps Script grava a linha na aba "Placares" da sua Planilha Google
        │
        ▼
qualquer pessoa que abrir o site depois já vê o placar atualizado
```

## Parte 1 — Criar a planilha e o Apps Script (10 minutos, só uma vez)

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha nova. Pode chamar de "Marcolino Champions League - Placares".
2. No menu, vá em **Extensões → Apps Script**.
3. Apague todo o conteúdo do arquivo `Código.gs` que abrir e cole o conteúdo do arquivo `apps-script/Code.gs` (está junto com os arquivos do site).
4. Clique em **Salvar** (ícone de disquete).
5. Clique em **Implantar → Nova implantação**.
   - Em "Selecionar tipo", clique na engrenagem e escolha **App da Web**.
   - "Executar como": **Eu (seu e-mail)**.
   - "Quem pode acessar": **Qualquer pessoa**. *(Importante: precisa ser "Qualquer pessoa", senão o site não consegue ler/gravar os placares.)*
   - Clique em **Implantar**.
6. O Google vai pedir para autorizar o script (é o seu próprio script, pode confiar). Autorize.
7. Copie a **URL do app da web** que aparece (algo como `https://script.google.com/macros/s/AKfycb.../exec`).
8. Abra o arquivo `js/config.js` do site e cole essa URL no lugar de `COLE_AQUI_A_URL_DO_SEU_APPS_SCRIPT`:

   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```

9. A aba "Placares" é criada automaticamente na planilha na primeira vez que alguém salvar um placar pelo site. Você pode abrir essa aba a qualquer momento para ver/editar os dados manualmente, como um Excel comum.

> Sempre que você editar o `Code.gs` depois (por exemplo, se eu ajustar algo), é preciso fazer **Implantar → Gerenciar implantações → editar (ícone de lápis) → Nova versão → Implantar** para a mudança valer no link publicado.

## Parte 2 — Publicar o site no GitHub Pages

1. Crie um repositório novo no GitHub (por exemplo `marcolino-champions-league`).
2. Suba todos os arquivos da pasta do site (menos a pasta `apps-script`, que não precisa ir para o site — ela só existe para você copiar o código para o Apps Script) mantendo a mesma estrutura de pastas (`css/`, `js/`, os `.html` na raiz).
3. Vá em **Settings → Pages** no repositório, escolha a branch `main` e a pasta `/root`, e salve.
4. Em alguns minutos o site estará no ar em `https://SEU-USUARIO.github.io/marcolino-champions-league/`.

## Parte 3 — Usar no dia a dia

- Qualquer pessoa que abrir o link do site pode preencher o placar de qualquer jogo e clicar em "Salvar" — não precisa senha nem conta Google.
- A classificação de cada grupo, a classificação geral e a chave do mata-mata são recalculadas automaticamente a cada vez que a página é aberta, com base nos placares já salvos.
- Na página inicial, clique no nome de qualquer time para ver só os jogos dele.
- Na página do mata-mata, a numeração de "semeadura" (1 a 16) só fica definitiva depois que **todos** os 96 jogos da fase de grupos tiverem placar. Antes disso, o site mostra um aviso de que a numeração é provisória e ela pode se reorganizar conforme os grupos forem terminando.

## Decisões que tomei e que você pode querer revisar

Como alguns pontos não foram 100% especificados, assumi o seguinte (é só me avisar se quiser mudar algo — é uma linha de código para ajustar):

- **Desempate por "sorteio":** como o site não pode fazer um sorteio de verdade, usei ordem alfabética como critério neutro final, tanto dentro do grupo quanto na semeadura geral (1–16) entre os primeiros/segundos colocados de grupos diferentes. Se dois times ficarem exatamente empatados até esse ponto, dá pra fazer o sorteio real de vocês dois e eu troco manualmente.
- **Semeadura geral (1–8 entre primeiros, 9–16 entre segundos):** usei os mesmos critérios do desempate de grupo (pontos, saldo, gols marcados), já que times de grupos diferentes não têm confronto direto entre si.
- **Mando de campo nas quartas e semis:** você confirmou que são ida e volta como as oitavas. Para decidir quem joga a volta em casa, estendi a mesma regra das oitavas ("melhor campanha decide em casa"), usando a posição de semeadura original (1 a 16) de cada time.
- **Final:** jogo único, como você pediu. Se der empate, previ pênaltis (não foi dito o que acontece em caso de empate na final — se preferirem outra solução, tipo prorrogação ou até time visitante ficar com o troféu por sorteio, é só avisar).
- **Grupo A:** vi que os 4 times do grupo A (Dortmund, Lille, Atlético de Madrid, Feyenoord) são todos da lista do Heitor — não é erro do site, é só como caiu a distribuição dos 32 times entre vocês dois.

## Estrutura dos arquivos

```
index.html              → página inicial
grupo.html               → página de um grupo (usa ?g=A até ?g=H)
classificacao.html       → classificação de todos os grupos
mata-mata.html            → chave + lista de jogos da fase eliminatória
time.html                 → jogos de um time (usado pelos links "clique no nome do time")
css/style.css              → visual do site
js/data.js                 → grupos, times e as listas de prioridade de vocês
js/fixtures.js              → gera a tabela de jogos da fase de grupos
js/logic.js                  → classificação, desempates, semeadura e progressão do mata-mata
js/config.js                  → cole aqui a URL do Apps Script
js/api.js                      → conversa com o Apps Script
js/ui.js                        → componentes de tela (placar, links de time, etc.)
js/render-*.js                   → lógica específica de cada página
apps-script/Code.gs                → cole este código no Apps Script da sua planilha
```

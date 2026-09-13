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
- Essa atualização não mexe em nada dos placares já salvos na planilha — os jogos da fase de grupos que vocês já lançaram continuam valendo normalmente. Se algum jogo do mata-mata da Champions já tinha um placar de pênaltis salvo de uma versão anterior do site, ele simplesmente passa a ser ignorado (não afeta o resultado, que agora é decidido por campanha em caso de empate).

## Decisões que tomei e que você pode querer revisar

Como alguns pontos não foram 100% especificados, assumi o seguinte (é só me avisar se quiser mudar algo):

- **Desempate por "sorteio":** ordem alfabética como critério neutro final (na fase de grupos, depois de aplicar a exclusão do(s) pior(es) time(s); e na semeadura geral entre grupos diferentes, que não tem confronto direto possível).
- **Semeadura geral (1–8 entre primeiros, 9–16 entre segundos; e igual para os 3os/4os colocados na Europa/Conference):** pontos, saldo, gols marcados, sorteio — times de grupos diferentes não têm confronto direto entre si.
- **Mando de campo e empate no mata-mata:** melhor campanha decide em casa na volta e avança automaticamente se o agregado terminar empatado (sem pênaltis) — vale para as 3 competições, oitavas/quartas/semis e também a final em caso de empate no jogo único.
- **Sorteio das oitavas da Europa League e Conference League:** os 3os/4os colocados da Champions são ranqueados por campanha (pontos/saldo/gols); os "outros 8 times" recebem seeds 9–12 (Heitor, na ordem que você deu) e 13–16 (Daniel, na ordem que você deu). O cruzamento prioriza time-do-Heitor × time-do-Daniel; quando sobra time do mesmo dono dos dois lados (por causa do total de times Heitor/Daniel não fechar 8-8), esses times sobrando se enfrentam entre si — do jeito que você descreveu.
- **Grupo A:** os 4 times (Dortmund, Lille, Atlético de Madrid, Feyenoord) são todos da lista do Heitor — não é erro do site, é só como caiu a distribuição dos 32 times entre vocês dois.

## Estrutura dos arquivos

```
index.html                 → página inicial (times das 3 competições + links)
grupo.html                  → página de um grupo da Champions (usa ?g=A até ?g=H)
classificacao.html          → classificação dos 8 grupos da Champions
mata-mata.html               → mata-mata da Champions League
europa.html                   → mata-mata da Europa League
conference.html                → mata-mata da Conference League
time.html                       → jogos de um time em todas as competições que ele disputa
css/style.css                    → visual do site
js/data.js                        → grupos, times e listas de prioridade (Champions/Europa/Conference)
js/fixtures.js                     → gera a tabela de jogos da fase de grupos da Champions
js/logic.js                         → classificação, desempates, semeadura e progressão do mata-mata
js/knockout-common.js                → chave visual + lista de jogos, compartilhado pelas 3 competições
js/config.js                          → cole aqui a URL do Apps Script
js/api.js                              → conversa com o Apps Script
js/ui.js                                → componentes de tela (placar, links de time, navegação)
js/render-*.js                           → lógica específica de cada página
apps-script/Code.gs                       → cole este código no Apps Script da sua planilha
```

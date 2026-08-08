document.getElementById('nav-slot').innerHTML = renderNav('classificacao');

const allMatches = buildAllGroupMatches();

async function draw() {
  const scores = await fetchAllScores();
  const standings = computeAllStandings(allMatches, scores);
  const html = GROUP_ORDER.map((g) => `
    <div class="panel">
      <h3><a href="grupo.html?g=${g}">Grupo ${g}</a></h3>
      ${standingsTableHtml(standings[g], { highlightTop2: true })}
    </div>`).join('');
  document.getElementById('all-standings-slot').innerHTML = html;
}

draw();

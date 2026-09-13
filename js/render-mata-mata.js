document.getElementById('nav-slot').innerHTML = renderNav('mata-mata');

const allMatches = buildAllGroupMatches();

async function draw() {
  const scores = await fetchAllScores();
  const standings = computeAllStandings(allMatches, scores);
  const complete = allGroupsComplete(allMatches, scores);

  document.getElementById('status-slot').innerHTML = complete
    ? ''
    : `<div class="notice">A fase de grupos ainda não terminou — a semeadura (1 a 16) abaixo é <strong>provisória</strong> e pode mudar conforme os resultados dos grupos forem sendo preenchidos.</div>`;

  const { seedToTeam, seedMap } = computeSeeding(standings);
  const pairs = [[1, 16], [2, 15], [3, 14], [4, 13], [5, 12], [6, 11], [7, 10], [8, 9]];
  const ties = buildKnockoutState(seedToTeam, seedMap, scores, pairs, '');

  renderKnockoutInto(
    document.getElementById('bracket-slot'),
    document.getElementById('matches-slot'),
    ties, pairs, '', scores
  );
}

wireScoreSaving(draw);
draw();

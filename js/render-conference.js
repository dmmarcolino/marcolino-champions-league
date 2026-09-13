document.getElementById('nav-slot').innerHTML = renderNav('conference');

const allMatches = buildAllGroupMatches();
const PREFIX = "CFL-";

async function draw() {
  const scores = await fetchAllScores();
  const standings = computeAllStandings(allMatches, scores);
  const complete = allGroupsComplete(allMatches, scores);

  document.getElementById('status-slot').innerHTML = complete
    ? ''
    : `<div class="notice">A fase de grupos da Champions ainda não terminou — os classificados (4os colocados) e a semeadura abaixo são <strong>provisórios</strong>.</div>`;

  const setup = computeEuroConfSetup(standings, 3, CONFERENCE_OUTROS_HEITOR, CONFERENCE_OUTROS_DANIEL);
  const ties = buildKnockoutState(setup.seedToTeam, setup.seedMap, scores, setup.pairs, PREFIX);

  renderKnockoutInto(
    document.getElementById('bracket-slot'),
    document.getElementById('matches-slot'),
    ties, setup.pairs, PREFIX, scores
  );
}

wireScoreSaving(draw);
draw();

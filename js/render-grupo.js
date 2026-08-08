const params = new URLSearchParams(location.search);
const GROUP = (params.get('g') || 'A').toUpperCase();

document.getElementById('nav-slot').innerHTML = renderNav('grupo-' + GROUP);
document.getElementById('group-title').textContent = `Grupo ${GROUP}`;

const allMatches = buildAllGroupMatches();
const groupMatches = allMatches.filter((m) => m.group === GROUP);

async function draw() {
  const scores = await fetchAllScores();
  const standings = computeGroupStandings(GROUP, allMatches, scores);
  document.getElementById('standings-slot').innerHTML = standingsTableHtml(standings, { highlightTop2: true });

  const byRound = {};
  groupMatches.forEach((m) => {
    byRound[m.round] = byRound[m.round] || [];
    byRound[m.round].push(m);
  });

  let html = '';
  Object.keys(byRound).sort((a, b) => a - b).forEach((round) => {
    const turno = round <= 3 ? 'Turno' : 'Returno';
    html += `<div class="round-heading">${turno} — Rodada ${round <= 3 ? round : round - 3}</div>`;
    byRound[round].forEach((m) => {
      html += matchRow({
        matchId: m.matchId,
        homeId: m.homeId,
        awayId: m.awayId,
        homeLabel: teamName(m.homeId),
        awayLabel: teamName(m.awayId),
        score: scores[m.matchId],
        editable: true,
      });
    });
  });
  document.getElementById('matches-slot').innerHTML = html;
}

wireScoreSaving(draw);
draw();

const params = new URLSearchParams(location.search);
const TEAM_ID = params.get('id');
const GROUP = TEAM_ID ? TEAM_GROUP[TEAM_ID] : null;

document.getElementById('nav-slot').innerHTML = renderNav('');

if (!TEAM_ID || !GROUP) {
  document.getElementById('team-title').textContent = 'Time não encontrado';
} else {
  document.getElementById('team-title').textContent = teamName(TEAM_ID);
  const ownerLabel = HEITOR_TEAMS.includes(TEAM_ID)
    ? `Time do Heitor (prioridade #${HEITOR_TEAMS.indexOf(TEAM_ID) + 1})`
    : `Time do Daniel (prioridade #${DANIEL_TEAMS.indexOf(TEAM_ID) + 1})`;
  document.getElementById('team-sub').textContent = `${ownerLabel} · Grupo ${GROUP}`;
}

const allMatches = buildAllGroupMatches();

function tieRowsForTeam(ties, teamId, scores) {
  const rows = [];
  ['R16-1', 'R16-2', 'R16-3', 'R16-4', 'R16-5', 'R16-6', 'R16-7', 'R16-8',
   'QF-1', 'QF-2', 'QF-3', 'QF-4', 'SF-1', 'SF-2', 'FINAL'].forEach((tieId) => {
    const tie = ties[tieId];
    if (!tie) return;
    const roundName = { R16: 'Oitavas', QF: 'Quartas', SF: 'Semifinal', FINAL: 'Final' }[tie.round];
    if (tie.round === 'FINAL') {
      if (tie.teamAId !== teamId && tie.teamBId !== teamId) return;
      if (!tie.teamAId || !tie.teamBId) return;
      rows.push({ roundName, html: matchRow({
        matchId: 'FINAL', homeId: tie.teamAId, awayId: tie.teamBId,
        homeLabel: teamName(tie.teamAId), awayLabel: teamName(tie.teamBId),
        score: scores['FINAL'], editable: false,
      })});
      return;
    }
    if (tie.teamBetterId !== teamId && tie.teamWorseId !== teamId) return;
    if (!tie.teamBetterId || !tie.teamWorseId) return;
    rows.push({ roundName, html: `
      ${matchRow({ matchId: `${tieId}-IDA`, homeId: tie.homeLeg1, awayId: tie.awayLeg1,
        homeLabel: teamName(tie.homeLeg1), awayLabel: teamName(tie.awayLeg1), score: scores[`${tieId}-IDA`], editable: false,
        extraNote: 'Jogo de ida' })}
      ${matchRow({ matchId: `${tieId}-VOLTA`, homeId: tie.homeLeg2, awayId: tie.awayLeg2,
        homeLabel: teamName(tie.homeLeg2), awayLabel: teamName(tie.awayLeg2), score: scores[`${tieId}-VOLTA`], editable: false,
        extraNote: 'Jogo de volta' })}
    `});
  });
  return rows;
}

async function draw() {
  if (!TEAM_ID || !GROUP) return;
  const scores = await fetchAllScores();

  const groupHtml = allMatches
    .filter((m) => m.group === GROUP && (m.homeId === TEAM_ID || m.awayId === TEAM_ID))
    .map((m) => matchRow({
      matchId: m.matchId, homeId: m.homeId, awayId: m.awayId,
      homeLabel: teamName(m.homeId), awayLabel: teamName(m.awayId),
      score: scores[m.matchId], editable: true,
    })).join('');
  document.getElementById('group-matches-slot').innerHTML = groupHtml;

  const standings = computeAllStandings(allMatches, scores);
  const { seedMap, winnersRanked, runnersRanked } = computeSeeding(standings);
  if (seedMap[TEAM_ID]) {
    const ties = buildKnockoutState(seedMap, winnersRanked, runnersRanked, scores);
    const rows = tieRowsForTeam(ties, TEAM_ID, scores);
    if (rows.length) {
      document.getElementById('ko-panel').style.display = '';
      document.getElementById('ko-matches-slot').innerHTML = rows
        .map((r) => `<div class="round-heading">${r.roundName}</div>${r.html}`).join('');
    }
  }
}

wireScoreSaving(draw);
draw();

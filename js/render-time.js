const params = new URLSearchParams(location.search);
const TEAM_ID = params.get('id');
const GROUP = TEAM_ID ? TEAM_GROUP[TEAM_ID] : null;

document.getElementById('nav-slot').innerHTML = renderNav('');

function ownerAndPriority(id) {
  const lists = [
    [HEITOR_TEAMS, 'Heitor', 'Champions League'],
    [DANIEL_TEAMS, 'Daniel', 'Champions League'],
    [EUROPA_OUTROS_HEITOR, 'Heitor', 'Europa League'],
    [EUROPA_OUTROS_DANIEL, 'Daniel', 'Europa League'],
    [CONFERENCE_OUTROS_HEITOR, 'Heitor', 'Conference League'],
    [CONFERENCE_OUTROS_DANIEL, 'Daniel', 'Conference League'],
  ];
  for (const [list, owner, comp] of lists) {
    const idx = list.indexOf(id);
    if (idx !== -1) return { owner, comp, priority: idx + 1 };
  }
  return null;
}

if (!TEAM_ID || !ownerAndPriority(TEAM_ID)) {
  document.getElementById('team-title').textContent = 'Time não encontrado';
} else {
  document.getElementById('team-title').textContent = teamName(TEAM_ID);
  const info = ownerAndPriority(TEAM_ID);
  const groupLabel = GROUP ? ` · Grupo ${GROUP}` : '';
  document.getElementById('team-sub').textContent =
    `Time do ${info.owner} (prioridade #${info.priority} na ${info.comp})${groupLabel}`;
}

const allMatches = buildAllGroupMatches();

function tieRowsForTeam(ties, teamId, scores, pairs, prefix) {
  const seedAnchors = computeSeedAnchors(pairs, prefix);
  const rows = [];
  const ids = [
    ...pairs.map((_, i) => `${prefix}R16-${i + 1}`),
    `${prefix}QF-1`, `${prefix}QF-2`, `${prefix}QF-3`, `${prefix}QF-4`,
    `${prefix}SF-1`, `${prefix}SF-2`, `${prefix}FINAL`,
  ];
  ids.forEach((tieId) => {
    const tie = ties[tieId];
    if (!tie) return;
    const roundName = { R16: 'Oitavas', QF: 'Quartas', SF: 'Semifinal', FINAL: 'Final' }[tie.round];
    if (tie.round === 'FINAL') {
      if (tie.teamAId !== teamId && tie.teamBId !== teamId) return;
      if (!tie.teamAId || !tie.teamBId) return;
      rows.push({ roundName, html: matchRow({
        matchId: tieId, homeId: tie.teamAId, awayId: tie.teamBId,
        homeLabel: teamName(tie.teamAId), awayLabel: teamName(tie.teamBId),
        score: scores[tieId], editable: false,
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

function renderKoSection(panelId, listId, rows) {
  if (!rows.length) return;
  document.getElementById(panelId).style.display = '';
  document.getElementById(listId).innerHTML = rows
    .map((r) => `<div class="round-heading">${r.roundName}</div>${r.html}`).join('');
}

async function draw() {
  if (!TEAM_ID || !ownerAndPriority(TEAM_ID)) return;
  const scores = await fetchAllScores();

  if (GROUP) {
    const groupHtml = allMatches
      .filter((m) => m.group === GROUP && (m.homeId === TEAM_ID || m.awayId === TEAM_ID))
      .map((m) => matchRow({
        matchId: m.matchId, homeId: m.homeId, awayId: m.awayId,
        homeLabel: teamName(m.homeId), awayLabel: teamName(m.awayId),
        score: scores[m.matchId], editable: true,
      })).join('');
    document.getElementById('group-matches-slot').innerHTML = groupHtml;
  } else {
    document.getElementById('group-panel').style.display = 'none';
  }

  const standings = computeAllStandings(allMatches, scores);

  // Champions (só participa quem termina em 1o ou 2o do grupo)
  const { seedMap: clSeedMap, seedToTeam: clSeedToTeam } = computeSeeding(standings);
  if (clSeedMap[TEAM_ID]) {
    const pairs = [[1, 16], [2, 15], [3, 14], [4, 13], [5, 12], [6, 11], [7, 10], [8, 9]];
    const ties = buildKnockoutState(clSeedToTeam, clSeedMap, scores, pairs, '');
    renderKoSection('ko-champions-panel', 'ko-champions-slot', tieRowsForTeam(ties, TEAM_ID, scores, pairs, ''));
  }

  // Europa League (3os colocados + outros)
  const elSetup = computeEuroConfSetup(standings, 2, EUROPA_OUTROS_HEITOR, EUROPA_OUTROS_DANIEL);
  if (elSetup.seedMap[TEAM_ID]) {
    const ties = buildKnockoutState(elSetup.seedToTeam, elSetup.seedMap, scores, elSetup.pairs, 'EL-');
    renderKoSection('ko-europa-panel', 'ko-europa-slot', tieRowsForTeam(ties, TEAM_ID, scores, elSetup.pairs, 'EL-'));
  }

  // Conference League (4os colocados + outros)
  const cfSetup = computeEuroConfSetup(standings, 3, CONFERENCE_OUTROS_HEITOR, CONFERENCE_OUTROS_DANIEL);
  if (cfSetup.seedMap[TEAM_ID]) {
    const ties = buildKnockoutState(cfSetup.seedToTeam, cfSetup.seedMap, scores, cfSetup.pairs, 'CFL-');
    renderKoSection('ko-conference-panel', 'ko-conference-slot', tieRowsForTeam(ties, TEAM_ID, scores, cfSetup.pairs, 'CFL-'));
  }
}

wireScoreSaving(draw);
draw();

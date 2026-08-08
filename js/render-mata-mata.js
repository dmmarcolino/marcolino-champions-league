document.getElementById('nav-slot').innerHTML = renderNav('mata-mata');

const allMatches = buildAllGroupMatches();
const R16_IDS = ['R16-1', 'R16-2', 'R16-3', 'R16-4', 'R16-5', 'R16-6', 'R16-7', 'R16-8'];
const QF_IDS = ['QF-1', 'QF-2', 'QF-3', 'QF-4'];
const SF_IDS = ['SF-1', 'SF-2'];

function pairNamesForTie(tie) {
  if (tie.round === 'FINAL') {
    return {
      aName: tie.teamAId ? teamName(tie.teamAId) : 'A definir',
      bName: tie.teamBId ? teamName(tie.teamBId) : 'A definir',
      aId: tie.teamAId, bId: tie.teamBId,
    };
  }
  if (tie.round === 'R16') {
    return {
      aName: tie.teamBetterId ? teamName(tie.teamBetterId) : `Seed ${tie.seedBetter}`,
      bName: tie.teamWorseId ? teamName(tie.teamWorseId) : `Seed ${tie.seedWorse}`,
      aId: tie.teamBetterId, bId: tie.teamWorseId,
    };
  }
  return {
    aName: tie.teamBetterId ? teamName(tie.teamBetterId) : 'A definir',
    bName: tie.teamWorseId ? teamName(tie.teamWorseId) : 'A definir',
    aId: tie.teamBetterId, bId: tie.teamWorseId,
  };
}

function bracketColumnHtml(title, tieIds, ties) {
  const cards = tieIds.map((id) => {
    const tie = ties[id];
    const { aName, bName, aId, bId } = pairNamesForTie(tie);
    const winner = tie.winner;
    const aggText = tie.round !== 'FINAL' && tie.aggBetter != null
      ? `<span class="agg">${tie.aggBetter}-${tie.aggWorse}</span>` : '';
    return `
      <div class="bracket-tie">
        <div class="bracket-team ${winner && winner === aId ? 'is-winner' : ''}">${aName} ${winner && winner === aId ? aggText : ''}</div>
        <div class="bracket-team ${winner && winner === bId ? 'is-winner' : ''}">${bName} ${winner && winner === bId ? aggText : ''}</div>
      </div>`;
  }).join('');
  return `<div class="bracket-round"><div class="bracket-round-title">${title}</div>${cards}</div>`;
}

function legsForTie(tie, tieId, scores) {
  const roundName = { R16: 'Oitavas', QF: 'Quartas de final', SF: 'Semifinal' }[tie.round];
  return `
    ${matchRow({ matchId: `${tieId}-IDA`, homeId: tie.homeLeg1, awayId: tie.awayLeg1,
      homeLabel: tie.homeLeg1 ? teamName(tie.homeLeg1) : 'A definir',
      awayLabel: tie.awayLeg1 ? teamName(tie.awayLeg1) : 'A definir',
      score: scores[`${tieId}-IDA`], editable: !!(tie.homeLeg1 && tie.awayLeg1), extraNote: 'Jogo de ida' })}
    ${matchRow({ matchId: `${tieId}-VOLTA`, homeId: tie.homeLeg2, awayId: tie.awayLeg2,
      homeLabel: tie.homeLeg2 ? teamName(tie.homeLeg2) : 'A definir',
      awayLabel: tie.awayLeg2 ? teamName(tie.awayLeg2) : 'A definir',
      score: scores[`${tieId}-VOLTA`], editable: !!(tie.homeLeg1 && tie.awayLeg1), extraNote: 'Jogo de volta' })}
    ${tie.needsPens ? pensRow(tieId, teamName(tie.teamBetterId), teamName(tie.teamWorseId), scores[`${tieId}-PENS`]) : ''}
  `;
}

async function draw() {
  const scores = await fetchAllScores();
  const standings = computeAllStandings(allMatches, scores);
  const complete = allGroupsComplete(allMatches, scores);

  document.getElementById('status-slot').innerHTML = complete
    ? ''
    : `<div class="notice">A fase de grupos ainda não terminou — a semeadura (1 a 16) abaixo é <strong>provisória</strong> e pode mudar conforme os resultados dos grupos forem sendo preenchidos.</div>`;

  const { seedMap, winnersRanked, runnersRanked } = computeSeeding(standings);
  const ties = buildKnockoutState(seedMap, winnersRanked, runnersRanked, scores);

  document.getElementById('bracket-slot').innerHTML =
    bracketColumnHtml('Oitavas', R16_IDS, ties) +
    bracketColumnHtml('Quartas', QF_IDS, ties) +
    bracketColumnHtml('Semis', SF_IDS, ties) +
    bracketColumnHtml('Final', ['FINAL'], ties);

  let html = '<div class="round-heading">Oitavas de final</div>';
  R16_IDS.forEach((id) => { html += legsForTie(ties[id], id, scores); });
  html += '<div class="round-heading">Quartas de final</div>';
  QF_IDS.forEach((id) => { html += legsForTie(ties[id], id, scores); });
  html += '<div class="round-heading">Semifinais</div>';
  SF_IDS.forEach((id) => { html += legsForTie(ties[id], id, scores); });
  html += '<div class="round-heading">Final (jogo único)</div>';
  {
    const tie = ties['FINAL'];
    html += matchRow({
      matchId: 'FINAL', homeId: tie.teamAId, awayId: tie.teamBId,
      homeLabel: tie.teamAId ? teamName(tie.teamAId) : 'A definir',
      awayLabel: tie.teamBId ? teamName(tie.teamBId) : 'A definir',
      score: scores['FINAL'], editable: !!(tie.teamAId && tie.teamBId),
    });
    if (tie.needsPens) html += pensRow('FINAL', teamName(tie.teamAId), teamName(tie.teamBId), scores['FINAL-PENS']);
  }
  document.getElementById('matches-slot').innerHTML = html;
}

wireScoreSaving(draw);
draw();

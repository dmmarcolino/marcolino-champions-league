document.getElementById('nav-slot').innerHTML = renderNav('mata-mata');
 
const allMatches = buildAllGroupMatches();
const R16_IDS = ['R16-1', 'R16-2', 'R16-3', 'R16-4', 'R16-5', 'R16-6', 'R16-7', 'R16-8'];
const QF_IDS = ['QF-1', 'QF-2', 'QF-3', 'QF-4'];
const SF_IDS = ['SF-1', 'SF-2'];
 
// Ordem de EXIBIÇÃO no quadro visual (diferente da ordem 1x16,2x15... da lista de
// jogos abaixo): aqui os confrontos ficam agrupados de forma que dois lados que só
// podem se encontrar depois (ex.: seed 1 e seed 2, que só se enfrentam na final)
// apareçam em metades separadas do quadro, como numa chave de verdade.
const BRACKET_R16_ORDER = ['R16-1', 'R16-8', 'R16-4', 'R16-5', 'R16-2', 'R16-7', 'R16-3', 'R16-6'];
const BRACKET_QF_ORDER = ['QF-1', 'QF-4', 'QF-2', 'QF-3'];
const BRACKET_SF_ORDER = ['SF-1', 'SF-2'];
 
const SEED_ANCHORS = computeSeedAnchors();
 
function pairNamesForTie(tie) {
  if (tie.round === 'FINAL') {
    const [aAnchor, bAnchor] = SEED_ANCHORS['FINAL'];
    return {
      aName: tie.teamAId ? teamName(tie.teamAId) : `Seed ${aAnchor}`,
      bName: tie.teamBId ? teamName(tie.teamBId) : `Seed ${bAnchor}`,
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
  const [aAnchor, bAnchor] = SEED_ANCHORS[tie.tieId];
  return {
    aName: tie.teamBetterId ? teamName(tie.teamBetterId) : `Seed ${aAnchor}`,
    bName: tie.teamWorseId ? teamName(tie.teamWorseId) : `Seed ${bAnchor}`,
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
  const [aAnchor, bAnchor] = SEED_ANCHORS[tieId];
  const homeLabel = tie.homeLeg1 ? teamName(tie.homeLeg1)
    : (tie.round === 'R16' ? `Seed ${tie.seedWorse}` : `Seed ${bAnchor}`);
  const awayLabel1 = tie.awayLeg1 ? teamName(tie.awayLeg1)
    : (tie.round === 'R16' ? `Seed ${tie.seedBetter}` : `Seed ${aAnchor}`);
  const homeLabel2 = tie.homeLeg2 ? teamName(tie.homeLeg2)
    : (tie.round === 'R16' ? `Seed ${tie.seedBetter}` : `Seed ${aAnchor}`);
  const awayLabel2 = tie.awayLeg2 ? teamName(tie.awayLeg2)
    : (tie.round === 'R16' ? `Seed ${tie.seedWorse}` : `Seed ${bAnchor}`);
  return `
    ${matchRow({ matchId: `${tieId}-IDA`, homeId: tie.homeLeg1, awayId: tie.awayLeg1,
      homeLabel, awayLabel: awayLabel1,
      score: scores[`${tieId}-IDA`], editable: !!(tie.homeLeg1 && tie.awayLeg1), extraNote: 'Jogo de ida' })}
    ${matchRow({ matchId: `${tieId}-VOLTA`, homeId: tie.homeLeg2, awayId: tie.awayLeg2,
      homeLabel: homeLabel2, awayLabel: awayLabel2,
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
    bracketColumnHtml('Oitavas', BRACKET_R16_ORDER, ties) +
    bracketColumnHtml('Quartas', BRACKET_QF_ORDER, ties) +
    bracketColumnHtml('Semis', BRACKET_SF_ORDER, ties) +
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
    const [aAnchor, bAnchor] = SEED_ANCHORS['FINAL'];
    html += matchRow({
      matchId: 'FINAL', homeId: tie.teamAId, awayId: tie.teamBId,
      homeLabel: tie.teamAId ? teamName(tie.teamAId) : `Seed ${aAnchor}`,
      awayLabel: tie.teamBId ? teamName(tie.teamBId) : `Seed ${bAnchor}`,
      score: scores['FINAL'], editable: !!(tie.teamAId && tie.teamBId),
    });
    if (tie.needsPens) html += pensRow('FINAL', teamName(tie.teamAId), teamName(tie.teamBId), scores['FINAL-PENS']);
  }
  document.getElementById('matches-slot').innerHTML = html;
}
 
wireScoreSaving(draw);
draw();
 

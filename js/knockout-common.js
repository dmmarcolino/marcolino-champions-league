/* ==========================================================================
   Renderização compartilhada do quadro e da lista de jogos do mata-mata.
   Usado pelas 3 competições (Champions, Europa League, Conference League) —
   cada uma só muda o prefixo dos matchIds e como os pares das oitavas são
   calculados (computeSetup).
   ========================================================================== */

const BRACKET_R16_DISPLAY = [1, 8, 4, 5, 2, 7, 3, 6]; // índices (1-based) dentro de "pairs"
const BRACKET_QF_DISPLAY = [1, 4, 2, 3];
const BRACKET_SF_DISPLAY = [1, 2];

function pairNamesForTie(tie, seedAnchors) {
  if (tie.round === 'FINAL') {
    const [aAnchor, bAnchor] = seedAnchors[tie.tieId];
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
  const [aAnchor, bAnchor] = seedAnchors[tie.tieId];
  return {
    aName: tie.teamBetterId ? teamName(tie.teamBetterId) : `Seed ${aAnchor}`,
    bName: tie.teamWorseId ? teamName(tie.teamWorseId) : `Seed ${bAnchor}`,
    aId: tie.teamBetterId, bId: tie.teamWorseId,
  };
}

function bracketColumnHtml(title, tieIds, ties, seedAnchors) {
  const cards = tieIds.map((id) => {
    const tie = ties[id];
    const { aName, bName, aId, bId } = pairNamesForTie(tie, seedAnchors);
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

function legLabel(tie, tieId, side, seedAnchors) {
  // side: 'home1'|'away1'|'home2'|'away2'
  const teamId = tie[{ home1: 'homeLeg1', away1: 'awayLeg1', home2: 'homeLeg2', away2: 'awayLeg2' }[side]];
  if (teamId) return { id: teamId, label: teamName(teamId) };
  const [aAnchor, bAnchor] = seedAnchors[tieId];
  const isBetterSide = side === 'away1' || side === 'home2'; // lado do teamBetter
  if (tie.round === 'R16') {
    return { id: null, label: `Seed ${isBetterSide ? tie.seedBetter : tie.seedWorse}` };
  }
  return { id: null, label: `Seed ${isBetterSide ? aAnchor : bAnchor}` };
}

function oneLegRow(tie, tieId, leg, scores, seedAnchors, noteLabel) {
  const homeSide = leg === 'IDA' ? 'home1' : 'home2';
  const awaySide = leg === 'IDA' ? 'away1' : 'away2';
  const home = legLabel(tie, tieId, homeSide, seedAnchors);
  const away = legLabel(tie, tieId, awaySide, seedAnchors);
  return matchRow({
    matchId: `${tieId}-${leg}`, homeId: home.id, awayId: away.id,
    homeLabel: home.label, awayLabel: away.label,
    score: scores[`${tieId}-${leg}`], editable: !!(home.id && away.id), extraNote: noteLabel,
  });
}

// Monta a lista "Jogos" de uma rodada de mata-mata: primeiro TODOS os jogos de
// ida da rodada, depois TODOS os jogos de volta (ordem em que devem acontecer).
function twoLegRoundListHtml(tieIds, ties, scores, seedAnchors) {
  let html = '';
  tieIds.forEach((id) => { html += oneLegRow(ties[id], id, 'IDA', scores, seedAnchors, 'Jogo de ida'); });
  tieIds.forEach((id) => { html += oneLegRow(ties[id], id, 'VOLTA', scores, seedAnchors, 'Jogo de volta'); });
  return html;
}

// Renderiza o quadro (bracket) e a lista de jogos completa de uma competição
// de mata-mata de 16 times, dentro dos elementos indicados.
function renderKnockoutInto(bracketEl, matchesEl, ties, pairs, prefix, scores) {
  const seedAnchors = computeSeedAnchors(pairs, prefix);
  const R16_IDS = pairs.map((_, i) => `${prefix}R16-${i + 1}`);
  const QF_IDS = [1, 2, 3, 4].map((i) => `${prefix}QF-${i}`);
  const SF_IDS = [1, 2].map((i) => `${prefix}SF-${i}`);
  const FINAL_ID = `${prefix}FINAL`;

  const R16_DISPLAY = BRACKET_R16_DISPLAY.map((i) => `${prefix}R16-${i}`);
  const QF_DISPLAY = BRACKET_QF_DISPLAY.map((i) => `${prefix}QF-${i}`);
  const SF_DISPLAY = BRACKET_SF_DISPLAY.map((i) => `${prefix}SF-${i}`);

  bracketEl.innerHTML =
    bracketColumnHtml('Oitavas', R16_DISPLAY, ties, seedAnchors) +
    bracketColumnHtml('Quartas', QF_DISPLAY, ties, seedAnchors) +
    bracketColumnHtml('Semis', SF_DISPLAY, ties, seedAnchors) +
    bracketColumnHtml('Final', [FINAL_ID], ties, seedAnchors);

  let html = '<div class="round-heading">Oitavas de final</div>';
  html += twoLegRoundListHtml(R16_IDS, ties, scores, seedAnchors);
  html += '<div class="round-heading">Quartas de final</div>';
  html += twoLegRoundListHtml(QF_IDS, ties, scores, seedAnchors);
  html += '<div class="round-heading">Semifinais</div>';
  html += twoLegRoundListHtml(SF_IDS, ties, scores, seedAnchors);
  html += '<div class="round-heading">Final (jogo único)</div>';
  {
    const tie = ties[FINAL_ID];
    const [aAnchor, bAnchor] = seedAnchors[FINAL_ID];
    html += matchRow({
      matchId: FINAL_ID, homeId: tie.teamAId, awayId: tie.teamBId,
      homeLabel: tie.teamAId ? teamName(tie.teamAId) : `Seed ${aAnchor}`,
      awayLabel: tie.teamBId ? teamName(tie.teamBId) : `Seed ${bAnchor}`,
      score: scores[FINAL_ID], editable: !!(tie.teamAId && tie.teamBId),
    });
  }
  matchesEl.innerHTML = html;
}

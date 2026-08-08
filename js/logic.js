/* ==========================================================================
   Regras de classificação, semeadura geral e progressão da fase eliminatória.
   ========================================================================== */

// ---- Fase de grupos -------------------------------------------------------

function emptyTeamStat(id) {
  return { id, j: 0, v: 0, e: 0, d: 0, gm: 0, gs: 0, sg: 0, pts: 0 };
}

// Calcula a tabela (não ordenada) de um grupo a partir dos placares já digitados.
function computeGroupTable(group, allMatches, scores) {
  const teamIds = GROUPS[group];
  const stats = {};
  teamIds.forEach((id) => (stats[id] = emptyTeamStat(id)));

  allMatches
    .filter((m) => m.group === group)
    .forEach((m) => {
      const s = scores[m.matchId];
      if (!s || s.golsCasa == null || s.golsVisitante == null) return;
      const home = stats[m.homeId];
      const away = stats[m.awayId];
      home.j++; away.j++;
      home.gm += s.golsCasa; home.gs += s.golsVisitante;
      away.gm += s.golsVisitante; away.gs += s.golsCasa;
      if (s.golsCasa > s.golsVisitante) { home.v++; home.pts += 3; away.d++; }
      else if (s.golsCasa < s.golsVisitante) { away.v++; away.pts += 3; home.d++; }
      else { home.e++; away.e++; home.pts += 1; away.pts += 1; }
    });

  Object.values(stats).forEach((t) => (t.sg = t.gm - t.gs));
  return Object.values(stats);
}

function sameKey(a, b) {
  return a.pts === b.pts && a.sg === b.sg && a.gm === b.gm;
}

// Critério de desempate: pontos, saldo, gols marcados, confronto direto, sorteio.
// "Sorteio" é resolvido por ordem alfabética do id, sinalizado no retorno.
function resolveHeadToHead(cluster, groupMatches, scores) {
  const ids = cluster.map((t) => t.id);
  const h2h = {};
  ids.forEach((id) => (h2h[id] = { pts: 0, gm: 0, gs: 0 }));

  groupMatches.forEach((m) => {
    if (!ids.includes(m.homeId) || !ids.includes(m.awayId)) return;
    const s = scores[m.matchId];
    if (!s || s.golsCasa == null || s.golsVisitante == null) return;
    h2h[m.homeId].gm += s.golsCasa; h2h[m.homeId].gs += s.golsVisitante;
    h2h[m.awayId].gm += s.golsVisitante; h2h[m.awayId].gs += s.golsCasa;
    if (s.golsCasa > s.golsVisitante) h2h[m.homeId].pts += 3;
    else if (s.golsCasa < s.golsVisitante) h2h[m.awayId].pts += 3;
    else { h2h[m.homeId].pts += 1; h2h[m.awayId].pts += 1; }
  });

  const withH2H = cluster.map((t) => ({
    ...t,
    h2hPts: h2h[t.id].pts,
    h2hSg: h2h[t.id].gm - h2h[t.id].gs,
    h2hGm: h2h[t.id].gm,
  }));

  withH2H.sort((a, b) => {
    if (b.h2hPts !== a.h2hPts) return b.h2hPts - a.h2hPts;
    if (b.h2hSg !== a.h2hSg) return b.h2hSg - a.h2hSg;
    if (b.h2hGm !== a.h2hGm) return b.h2hGm - a.h2hGm;
    const stillTied = true;
    return a.id.localeCompare(b.id); // sorteio (placeholder alfabético)
  });

  // marca times que dependem de sorteio (empate total mesmo após confronto direto)
  for (let i = 0; i < withH2H.length - 1; i++) {
    if (withH2H[i].h2hPts === withH2H[i + 1].h2hPts &&
        withH2H[i].h2hSg === withH2H[i + 1].h2hSg &&
        withH2H[i].h2hGm === withH2H[i + 1].h2hGm) {
      withH2H[i].sorteio = true;
      withH2H[i + 1].sorteio = true;
    }
  }
  return withH2H;
}

function orderGroup(teamStats, groupMatches, scores) {
  const arr = [...teamStats].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.sg !== a.sg) return b.sg - a.sg;
    if (b.gm !== a.gm) return b.gm - a.gm;
    return a.id.localeCompare(b.id);
  });

  let i = 0;
  while (i < arr.length) {
    let j = i + 1;
    while (j < arr.length && sameKey(arr[j], arr[i])) j++;
    if (j - i > 1) {
      const resolved = resolveHeadToHead(arr.slice(i, j), groupMatches, scores);
      for (let k = 0; k < resolved.length; k++) arr[i + k] = resolved[k];
    }
    i = j;
  }
  return arr;
}

function computeGroupStandings(group, allMatches, scores) {
  const table = computeGroupTable(group, allMatches, scores);
  return orderGroup(table, allMatches.filter((m) => m.group === group), scores);
}

function computeAllStandings(allMatches, scores) {
  const result = {};
  GROUP_ORDER.forEach((g) => (result[g] = computeGroupStandings(g, allMatches, scores)));
  return result;
}

function groupComplete(group, allMatches, scores) {
  return allMatches
    .filter((m) => m.group === group)
    .every((m) => {
      const s = scores[m.matchId];
      return s && s.golsCasa != null && s.golsVisitante != null;
    });
}

function allGroupsComplete(allMatches, scores) {
  return GROUP_ORDER.every((g) => groupComplete(g, allMatches, scores));
}

// ---- Semeadura geral (1-16) ------------------------------------------------

function rankAcrossGroups(list) {
  return [...list].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.sg !== a.sg) return b.sg - a.sg;
    if (b.gm !== a.gm) return b.gm - a.gm;
    return a.id.localeCompare(b.id); // sorteio (placeholder alfabético)
  });
}

// Retorna { seedMap: {teamId: 1..16}, winnersRanked, runnersRanked }
function computeSeeding(standings) {
  const winners = GROUP_ORDER.map((g) => ({ ...standings[g][0], group: g }));
  const runners = GROUP_ORDER.map((g) => ({ ...standings[g][1], group: g }));
  const winnersRanked = rankAcrossGroups(winners);
  const runnersRanked = rankAcrossGroups(runners);
  const seedMap = {};
  winnersRanked.forEach((t, idx) => (seedMap[t.id] = idx + 1));
  runnersRanked.forEach((t, idx) => (seedMap[t.id] = idx + 9));
  return { seedMap, winnersRanked, runnersRanked };
}

// ---- Fase eliminatória -----------------------------------------------------

const R16_PAIRS = [[1, 16], [2, 15], [3, 14], [4, 13], [5, 12], [6, 11], [7, 10], [8, 9]];
// Índices (1-based) das chaves de oitavas que alimentam cada confronto de quartas
const QF_FEEDS = [[1, 8], [2, 7], [3, 6], [4, 5]];
// Índices (1-based) das chaves de quartas que alimentam cada confronto de semis
const SF_FEEDS = [[1, 4], [2, 3]];

// Estrutura estática da chave (sem nomes de time ainda).
function bracketSkeleton() {
  const r16 = R16_PAIRS.map((pair, idx) => ({
    tieId: `R16-${idx + 1}`,
    seedBetter: pair[0],
    seedWorse: pair[1],
  }));
  const qf = QF_FEEDS.map((feed, idx) => ({
    tieId: `QF-${idx + 1}`,
    from: feed.map((n) => `R16-${n}`),
  }));
  const sf = SF_FEEDS.map((feed, idx) => ({
    tieId: `SF-${idx + 1}`,
    from: feed.map((n) => `QF-${n}`),
  }));
  const final = { tieId: 'FINAL', from: ['SF-1', 'SF-2'] };
  return { r16, qf, sf, final };
}

// Resolve o vencedor (id do time) de um confronto de ida-e-volta dados os dois
// participantes (teamBetterId = melhor semeado / decide em casa na volta).
function resolveTwoLegged(tieId, teamBetterId, teamWorseId, scores) {
  if (!teamBetterId || !teamWorseId) return { winner: null, aggBetter: null, aggWorse: null, needsPens: false };
  const leg1 = scores[`${tieId}-IDA`];   // mandante: pior campanha
  const leg2 = scores[`${tieId}-VOLTA`]; // mandante: melhor campanha
  const leg1done = leg1 && leg1.golsCasa != null && leg1.golsVisitante != null;
  const leg2done = leg2 && leg2.golsCasa != null && leg2.golsVisitante != null;
  if (!leg1done || !leg2done) {
    return { winner: null, aggBetter: null, aggWorse: null, needsPens: false, leg1done, leg2done };
  }
  const aggBetter = leg1.golsVisitante + leg2.golsCasa;
  const aggWorse = leg1.golsCasa + leg2.golsVisitante;
  if (aggBetter > aggWorse) return { winner: teamBetterId, aggBetter, aggWorse, needsPens: false };
  if (aggWorse > aggBetter) return { winner: teamWorseId, aggBetter, aggWorse, needsPens: false };
  const pens = scores[`${tieId}-PENS`];
  if (!pens || pens.golsCasa == null || pens.golsVisitante == null) {
    return { winner: null, aggBetter, aggWorse, needsPens: true };
  }
  if (pens.golsCasa > pens.golsVisitante) return { winner: teamBetterId, aggBetter, aggWorse, needsPens: true, pens };
  if (pens.golsVisitante > pens.golsCasa) return { winner: teamWorseId, aggBetter, aggWorse, needsPens: true, pens };
  return { winner: null, aggBetter, aggWorse, needsPens: true, pens };
}

function resolveSingleMatch(tieId, teamAId, teamBId, scores) {
  if (!teamAId || !teamBId) return { winner: null, needsPens: false };
  const m = scores[tieId];
  const done = m && m.golsCasa != null && m.golsVisitante != null;
  if (!done) return { winner: null, needsPens: false };
  if (m.golsCasa > m.golsVisitante) return { winner: teamAId, needsPens: false };
  if (m.golsVisitante > m.golsCasa) return { winner: teamBId, needsPens: false };
  const pens = scores[`${tieId}-PENS`];
  if (!pens || pens.golsCasa == null || pens.golsVisitante == null) return { winner: null, needsPens: true };
  if (pens.golsCasa > pens.golsVisitante) return { winner: teamAId, needsPens: true, pens };
  if (pens.golsVisitante > pens.golsCasa) return { winner: teamBId, needsPens: true, pens };
  return { winner: null, needsPens: true, pens };
}

// Monta a chave inteira já resolvida (times, resultados, vencedores) a partir
// da semeadura atual (pode ser provisória, se a fase de grupos não terminou)
// e dos placares digitados.
function buildKnockoutState(seedMap, winnersRanked, runnersRanked, scores) {
  const teamBySeed = {};
  winnersRanked.forEach((t, idx) => (teamBySeed[idx + 1] = t.id));
  runnersRanked.forEach((t, idx) => (teamBySeed[idx + 9] = t.id));

  const skeleton = bracketSkeleton();
  const ties = {};

  skeleton.r16.forEach((tie) => {
    const teamBetterId = teamBySeed[tie.seedBetter] || null;
    const teamWorseId = teamBySeed[tie.seedWorse] || null;
    const res = resolveTwoLegged(tie.tieId, teamBetterId, teamWorseId, scores);
    ties[tie.tieId] = {
      ...tie, round: 'R16', teamBetterId, teamWorseId,
      homeLeg1: teamWorseId, awayLeg1: teamBetterId,
      homeLeg2: teamBetterId, awayLeg2: teamWorseId,
      ...res,
    };
  });

  skeleton.qf.forEach((tie) => {
    const [a, b] = tie.from.map((id) => ties[id].winner);
    const seedA = a ? (seedMap[a] || 99) : 99;
    const seedB = b ? (seedMap[b] || 99) : 99;
    const teamBetterId = seedA <= seedB ? a : b;
    const teamWorseId = seedA <= seedB ? b : a;
    const res = resolveTwoLegged(tie.tieId, teamBetterId, teamWorseId, scores);
    ties[tie.tieId] = {
      ...tie, round: 'QF', teamBetterId, teamWorseId,
      homeLeg1: teamWorseId, awayLeg1: teamBetterId,
      homeLeg2: teamBetterId, awayLeg2: teamWorseId,
      ...res,
    };
  });

  skeleton.sf.forEach((tie) => {
    const [a, b] = tie.from.map((id) => ties[id].winner);
    const seedA = a ? (seedMap[a] || 99) : 99;
    const seedB = b ? (seedMap[b] || 99) : 99;
    const teamBetterId = seedA <= seedB ? a : b;
    const teamWorseId = seedA <= seedB ? b : a;
    const res = resolveTwoLegged(tie.tieId, teamBetterId, teamWorseId, scores);
    ties[tie.tieId] = {
      ...tie, round: 'SF', teamBetterId, teamWorseId,
      homeLeg1: teamWorseId, awayLeg1: teamBetterId,
      homeLeg2: teamBetterId, awayLeg2: teamWorseId,
      ...res,
    };
  });

  {
    const tie = skeleton.final;
    const [a, b] = tie.from.map((id) => ties[id].winner);
    const seedA = a ? (seedMap[a] || 99) : 99;
    const seedB = b ? (seedMap[b] || 99) : 99;
    const teamAId = seedA <= seedB ? a : b; // só para ordenar a exibição
    const teamBId = seedA <= seedB ? b : a;
    const res = resolveSingleMatch('FINAL', teamAId, teamBId, scores);
    ties['FINAL'] = { tieId: 'FINAL', round: 'FINAL', from: tie.from, teamAId, teamBId, ...res };
  }

  return ties;
}

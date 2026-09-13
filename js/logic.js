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

// Estatísticas de um conjunto de times (clusterIds) considerando só os jogos
// do grupo que NÃO envolvem nenhum time de excludeIds.
function statsExcluding(clusterIds, excludeIds, groupMatches, scores) {
  const stats = {};
  clusterIds.forEach((id) => (stats[id] = { pts: 0, gm: 0, gs: 0 }));
  groupMatches.forEach((m) => {
    if (excludeIds.includes(m.homeId) || excludeIds.includes(m.awayId)) return;
    const s = scores[m.matchId];
    if (!s || s.golsCasa == null || s.golsVisitante == null) return;
    if (clusterIds.includes(m.homeId)) {
      stats[m.homeId].gm += s.golsCasa; stats[m.homeId].gs += s.golsVisitante;
      if (s.golsCasa > s.golsVisitante) stats[m.homeId].pts += 3;
      else if (s.golsCasa === s.golsVisitante) stats[m.homeId].pts += 1;
    }
    if (clusterIds.includes(m.awayId)) {
      stats[m.awayId].gm += s.golsVisitante; stats[m.awayId].gs += s.golsCasa;
      if (s.golsVisitante > s.golsCasa) stats[m.awayId].pts += 3;
      else if (s.golsCasa === s.golsVisitante) stats[m.awayId].pts += 1;
    }
  });
  return stats;
}

function sortByStats(cluster, statsById) {
  const withStats = cluster.map((t) => ({
    ...t,
    _pts: statsById[t.id].pts,
    _sg: statsById[t.id].gm - statsById[t.id].gs,
    _gm: statsById[t.id].gm,
  }));
  withStats.sort((a, b) => {
    if (b._pts !== a._pts) return b._pts - a._pts;
    if (b._sg !== a._sg) return b._sg - a._sg;
    if (b._gm !== a._gm) return b._gm - a._gm;
    return a.id.localeCompare(b.id); // sorteio (placeholder alfabético)
  });
  return withStats;
}

function allTied(sortedWithStats) {
  return sortedWithStats.every((t) =>
    t._pts === sortedWithStats[0]._pts && t._sg === sortedWithStats[0]._sg && t._gm === sortedWithStats[0]._gm
  );
}

// Critério de desempate entre times empatados em pontos/saldo/gols marcados:
// 1) resultados excluindo-se o pior time do grupo; 2) excluindo-se os dois
// piores; 3) sorteio (placeholder: ordem alfabética).
// "pior(es) time(s) do grupo" = últimas posições do grupo INTEIRO (fora do
// cluster empatado) segundo o critério primário pts/sg/gm.
function resolveGroupTieCluster(cluster, fullOrderedIds, groupMatches, scores) {
  const clusterIds = cluster.map((t) => t.id);
  const nonClusterWorstFirst = [...fullOrderedIds].reverse().filter((id) => !clusterIds.includes(id));

  if (nonClusterWorstFirst.length >= 1) {
    const s1 = statsExcluding(clusterIds, [nonClusterWorstFirst[0]], groupMatches, scores);
    const sorted1 = sortByStats(cluster, s1);
    if (!allTied(sorted1)) return sorted1;
  }
  if (nonClusterWorstFirst.length >= 2) {
    const s2 = statsExcluding(clusterIds, nonClusterWorstFirst.slice(0, 2), groupMatches, scores);
    const sorted2 = sortByStats(cluster, s2);
    if (!allTied(sorted2)) return sorted2;
  }
  const sFinal = statsExcluding(clusterIds, nonClusterWorstFirst, groupMatches, scores);
  const sortedFinal = sortByStats(cluster, sFinal);
  for (let i = 0; i < sortedFinal.length - 1; i++) {
    sortedFinal[i].sorteio = true;
    sortedFinal[i + 1].sorteio = true;
  }
  return sortedFinal;
}

function orderGroup(teamStats, groupMatches, scores) {
  const arr = [...teamStats].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.sg !== a.sg) return b.sg - a.sg;
    if (b.gm !== a.gm) return b.gm - a.gm;
    return a.id.localeCompare(b.id);
  });
  const fullOrderedIds = arr.map((t) => t.id);

  let i = 0;
  while (i < arr.length) {
    let j = i + 1;
    while (j < arr.length && sameKey(arr[j], arr[i])) j++;
    if (j - i > 1) {
      const resolved = resolveGroupTieCluster(arr.slice(i, j), fullOrderedIds, groupMatches, scores);
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

// ---- Semeadura geral da Champions (1-16) -----------------------------------

function rankAcrossGroups(list) {
  return [...list].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.sg !== a.sg) return b.sg - a.sg;
    if (b.gm !== a.gm) return b.gm - a.gm;
    return a.id.localeCompare(b.id); // sorteio (placeholder alfabético)
  });
}

function computeSeeding(standings) {
  const winners = GROUP_ORDER.map((g) => ({ ...standings[g][0], group: g }));
  const runners = GROUP_ORDER.map((g) => ({ ...standings[g][1], group: g }));
  const winnersRanked = rankAcrossGroups(winners);
  const runnersRanked = rankAcrossGroups(runners);
  const seedMap = {};
  const seedToTeam = {};
  winnersRanked.forEach((t, idx) => { seedMap[t.id] = idx + 1; seedToTeam[idx + 1] = t.id; });
  runnersRanked.forEach((t, idx) => { seedMap[t.id] = idx + 9; seedToTeam[idx + 9] = t.id; });
  return { seedMap, seedToTeam, winnersRanked, runnersRanked };
}

// ---- Estrutura genérica de mata-mata (16 times -> campeão) -----------------

const QF_FEEDS = [[1, 8], [2, 7], [3, 6], [4, 5]];
const SF_FEEDS = [[1, 4], [2, 3]];

function bracketSkeleton(pairs, prefix) {
  const r16 = pairs.map((pair, idx) => ({
    tieId: `${prefix}R16-${idx + 1}`,
    seedBetter: pair[0],
    seedWorse: pair[1],
  }));
  const qf = QF_FEEDS.map((feed, idx) => ({
    tieId: `${prefix}QF-${idx + 1}`,
    from: feed.map((n) => `${prefix}R16-${n}`),
  }));
  const sf = SF_FEEDS.map((feed, idx) => ({
    tieId: `${prefix}SF-${idx + 1}`,
    from: feed.map((n) => `${prefix}QF-${n}`),
  }));
  const final = { tieId: `${prefix}FINAL`, from: [`${prefix}SF-1`, `${prefix}SF-2`] };
  return { r16, qf, sf, final };
}

function computeSeedAnchors(pairs, prefix) {
  const anchors = {};
  pairs.forEach((pair, idx) => { anchors[`${prefix}R16-${idx + 1}`] = [pair[0], pair[1]]; });
  QF_FEEDS.forEach((feed, idx) => {
    anchors[`${prefix}QF-${idx + 1}`] = feed.map((n) => Math.min(...anchors[`${prefix}R16-${n}`]));
  });
  SF_FEEDS.forEach((feed, idx) => {
    anchors[`${prefix}SF-${idx + 1}`] = feed.map((n) => Math.min(...anchors[`${prefix}QF-${n}`]));
  });
  anchors[`${prefix}FINAL`] = [`${prefix}SF-1`, `${prefix}SF-2`].map((id) => Math.min(...anchors[id]));
  return anchors;
}

// Empate no agregado -> avança quem tem a melhor campanha (teamBetterId). Sem pênaltis.
function resolveTwoLegged(tieId, teamBetterId, teamWorseId, scores) {
  if (!teamBetterId || !teamWorseId) return { winner: null, aggBetter: null, aggWorse: null };
  const leg1 = scores[`${tieId}-IDA`];
  const leg2 = scores[`${tieId}-VOLTA`];
  const leg1done = leg1 && leg1.golsCasa != null && leg1.golsVisitante != null;
  const leg2done = leg2 && leg2.golsCasa != null && leg2.golsVisitante != null;
  if (!leg1done || !leg2done) {
    return { winner: null, aggBetter: null, aggWorse: null, leg1done, leg2done };
  }
  const aggBetter = leg1.golsVisitante + leg2.golsCasa;
  const aggWorse = leg1.golsCasa + leg2.golsVisitante;
  const winner = aggBetter >= aggWorse ? teamBetterId : teamWorseId;
  return { winner, aggBetter, aggWorse, decidedByCampanha: aggBetter === aggWorse };
}

// Jogo único (final). homeId = time de melhor campanha (decide em caso de empate).
function resolveSingleMatch(tieId, homeId, awayId, scores) {
  if (!homeId || !awayId) return { winner: null };
  const m = scores[tieId];
  const done = m && m.golsCasa != null && m.golsVisitante != null;
  if (!done) return { winner: null };
  const winner = m.golsCasa >= m.golsVisitante ? homeId : awayId;
  return { winner, decidedByCampanha: m.golsCasa === m.golsVisitante };
}

// pairs: 8 pares [seedA, seedB] das oitavas (seedA = melhor campanha).
// seedToTeam: {seed: teamId}. seedMap: {teamId: seed}. prefix: prefixo dos matchIds.
function buildKnockoutState(seedToTeam, seedMap, scores, pairs, prefix) {
  prefix = prefix || '';
  const skeleton = bracketSkeleton(pairs, prefix);
  const ties = {};

  skeleton.r16.forEach((tie) => {
    const teamBetterId = seedToTeam[tie.seedBetter] || null;
    const teamWorseId = seedToTeam[tie.seedWorse] || null;
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
    const teamAId = seedA <= seedB ? a : b;
    const teamBId = seedA <= seedB ? b : a;
    const res = resolveSingleMatch(tie.tieId, teamAId, teamBId, scores);
    ties[tie.tieId] = { tieId: tie.tieId, round: 'FINAL', from: tie.from, teamAId, teamBId, ...res };
  }

  return ties;
}

// ---- Europa League / Conference League: semeadura e sorteio das oitavas ---
// placeIndex: 2 para 3os colocados (Europa League), 3 para 4os (Conference League).
function computeEuroConfSetup(standings, placeIndex, outrosHeitor, outrosDaniel) {
  const qualified = GROUP_ORDER.map((g) => ({ ...standings[g][placeIndex], group: g }));
  const qualifiedRanked = rankAcrossGroups(qualified);
  const seedToTeam = {};
  const seedMap = {};
  qualifiedRanked.forEach((t, idx) => { seedToTeam[idx + 1] = t.id; seedMap[t.id] = idx + 1; });

  outrosHeitor.forEach((id, idx) => { seedToTeam[9 + idx] = id; seedMap[id] = 9 + idx; });
  outrosDaniel.forEach((id, idx) => { seedToTeam[13 + idx] = id; seedMap[id] = 13 + idx; });

  const qualifiedHeitor = qualifiedRanked.filter((t) => isHeitorTeam(t.id)).map((t) => seedMap[t.id]);
  const qualifiedDaniel = qualifiedRanked.filter((t) => isDanielTeam(t.id)).map((t) => seedMap[t.id]);
  const outrosHeitorSeeds = outrosHeitor.map((id) => seedMap[id]);
  const outrosDanielSeeds = outrosDaniel.map((id) => seedMap[id]);

  const pairs = [];
  const usedQualified = new Set();
  const usedOutros = new Set();

  function takePairs(qList, oList) {
    const n = Math.min(qList.length, oList.length);
    for (let i = 0; i < n; i++) {
      pairs.push([qList[i], oList[i]]);
      usedQualified.add(qList[i]);
      usedOutros.add(oList[i]);
    }
  }
  takePairs(qualifiedHeitor, outrosDanielSeeds);
  takePairs(qualifiedDaniel, outrosHeitorSeeds);

  const leftoverQualified = [...qualifiedHeitor, ...qualifiedDaniel].filter((s) => !usedQualified.has(s));
  const leftoverOutros = [...outrosHeitorSeeds, ...outrosDanielSeeds].filter((s) => !usedOutros.has(s));
  for (let i = 0; i < leftoverQualified.length; i++) {
    pairs.push([leftoverQualified[i], leftoverOutros[i]]);
  }

  pairs.sort((a, b) => a[0] - b[0]);

  return { seedToTeam, seedMap, pairs };
}

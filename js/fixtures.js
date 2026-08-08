/* ==========================================================================
   Geração da tabela de jogos da fase de grupos.

   Padrão de mandos (índices 1..4 dentro do grupo), turno:
     Rodada 1: 1x4, 2x3
     Rodada 2: 4x3, 1x2
     Rodada 3: 2x4, 3x1
   Returno: mesmas rodadas, mandos invertidos.
   ========================================================================== */

const TURNO_PATTERN = [
  [[1, 4], [2, 3]], // rodada 1
  [[4, 3], [1, 2]], // rodada 2
  [[2, 4], [3, 1]], // rodada 3
];

// Gera os 12 jogos (6 rodadas) de um grupo. Retorna lista de partidas:
// { matchId, group, round, homeId, awayId }
function buildGroupMatches(groupLetter) {
  const teamIds = GROUPS[groupLetter]; // índice 0 -> time "1", índice 1 -> time "2", etc.
  const matches = [];

  TURNO_PATTERN.forEach((pair, roundIdx) => {
    const round = roundIdx + 1; // 1..3 (turno)
    pair.forEach(([homeNum, awayNum], gameIdx) => {
      matches.push({
        matchId: `${groupLetter}-R${round}-${gameIdx + 1}`,
        group: groupLetter,
        round,
        homeId: teamIds[homeNum - 1],
        awayId: teamIds[awayNum - 1],
      });
    });
  });

  TURNO_PATTERN.forEach((pair, roundIdx) => {
    const round = roundIdx + 4; // 4..6 (returno, mandos invertidos)
    pair.forEach(([homeNum, awayNum], gameIdx) => {
      matches.push({
        matchId: `${groupLetter}-R${round}-${gameIdx + 1}`,
        group: groupLetter,
        round,
        homeId: teamIds[awayNum - 1], // invertido
        awayId: teamIds[homeNum - 1], // invertido
      });
    });
  });

  return matches;
}

function buildAllGroupMatches() {
  let all = [];
  GROUP_ORDER.forEach((g) => {
    all = all.concat(buildGroupMatches(g));
  });
  return all;
}

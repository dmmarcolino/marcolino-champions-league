/* ==========================================================================
   Marcolino Champions League — dados fixos do torneio
   (times, grupos, ordem de prioridade de cada participante)
   ========================================================================== */

// Cada time tem um "id" curto (usado nas chaves de partidas e na URL)
// e um "name" (nome exibido no site).
const TEAMS = {
  dortmund:  { name: 'Borussia Dortmund' },
  lille:     { name: 'Lille' },
  atleti:    { name: 'Atlético de Madrid' },
  feyenoord: { name: 'Feyenoord' },

  liverpool: { name: 'Liverpool' },
  benfica:   { name: 'Benfica' },
  napoli:    { name: 'Napoli' },
  atalanta:  { name: 'Atalanta' },

  realmadrid: { name: 'Real Madrid' },
  monaco:     { name: 'Monaco' },
  juventus:   { name: 'Juventus' },
  sociedad:   { name: 'Real Sociedad' },

  barcelona: { name: 'Barcelona' },
  bilbao:    { name: 'Atlético de Bilbao' },
  chelsea:   { name: 'Chelsea' },
  bologna:   { name: 'Bologna' },

  arsenal:   { name: 'Arsenal' },
  porto:     { name: 'Porto' },
  leverkusen:{ name: 'Bayer Leverkusen' },
  ajax:      { name: 'Ajax' },

  psg:       { name: 'PSG' },
  marseille: { name: 'Olympique de Marseille' },
  mancity:   { name: 'Manchester City' },
  bodo:      { name: 'Bodø/Glimt' },

  inter:     { name: 'Inter de Milão' },
  psv:       { name: 'PSV' },
  milan:     { name: 'Milan' },
  celtic:    { name: 'Celtic' },

  bayern:    { name: 'Bayern de Munique' },
  roma:      { name: 'Roma' },
  manutd:    { name: 'Manchester United' },
  como:      { name: 'Como' },
};

// Ordem dos times dentro de cada grupo = numeração 1..4 usada na tabela de jogos.
const GROUPS = {
  A: ['dortmund', 'lille', 'atleti', 'feyenoord'],
  B: ['liverpool', 'benfica', 'napoli', 'atalanta'],
  C: ['realmadrid', 'monaco', 'juventus', 'sociedad'],
  D: ['barcelona', 'bilbao', 'chelsea', 'bologna'],
  E: ['arsenal', 'porto', 'leverkusen', 'ajax'],
  F: ['psg', 'marseille', 'mancity', 'bodo'],
  G: ['inter', 'psv', 'milan', 'celtic'],
  H: ['bayern', 'roma', 'manutd', 'como'],
};

const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// id -> letra do grupo (montado a partir de GROUPS)
const TEAM_GROUP = {};
GROUP_ORDER.forEach((g) => GROUPS[g].forEach((id) => (TEAM_GROUP[id] = g)));

// Ordem de prioridade escolhida por cada participante (1º = mais prioritário).
const HEITOR_TEAMS = [
  'arsenal', 'dortmund', 'juventus', 'marseille', 'atalanta', 'lille',
  'bologna', 'bilbao', 'sociedad', 'feyenoord', 'roma', 'liverpool',
  'milan', 'atleti', 'inter', 'manutd',
];

const DANIEL_TEAMS = [
  'barcelona', 'bayern', 'mancity', 'psg', 'napoli', 'leverkusen',
  'ajax', 'celtic', 'bodo', 'como', 'monaco', 'psv', 'chelsea',
  'porto', 'benfica', 'realmadrid',
];

function teamName(id) {
  return (TEAMS[id] && TEAMS[id].name) || id;
}

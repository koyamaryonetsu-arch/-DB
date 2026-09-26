// 第2章の モンスターの 技（abilities.js で まぜる）
export const CH2_ABILITIES = {
  m_splash: {
    name: '水てっぽう', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [16, 22], thr: 99 }, cast: '{a}は口から水てっぽうをとばした！', anim: 'ice1',
    desc: 'いきおいのある水をとばす。',
  },
  m_dive: {
    name: '急降下', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, acc: 0.9 }, cast: '{a}は空から急降下してきた！', anim: 'hit',
    desc: '空から急降下してぶつかる。',
  },
  m_shell_guard: {
    name: 'からにこもる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.6, dur: 30 }, cast: '{a}は貝がらの中にこもった！', anim: 'guard',
    desc: '貝がらにこもって守備力を上げる。',
  },
  m_coil: {
    name: 'しめつける', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.1, status: { status: 'paralyze', chance: 0.2, turns: [1, 2] } }, cast: '{a}は{t}に長い体をまきつけた！', anim: 'hit',
    desc: '体をまきつけてしめつける。マヒすることがある。',
  },
  m_tidal: {
    name: '大波', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [12, 18], thr: 99 }, cast: '{a}は大波をおこした！', anim: 'ice2',
    desc: '大波で敵みんなをおしながす。',
  },
  m_coconut: {
    name: 'ヤシの実投げ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}は頭のヤシの実をなげつけてきた！', anim: 'hit',
    desc: 'かたいヤシの実をなげつける。',
  },
  m_cursed_blade: {
    name: '呪いの剣', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.2, status: { status: 'blind', chance: 0.3, turns: [2, 3] } }, cast: '{a}の呪いの剣！あやしい光がまとわりつく！', anim: 'dark_slash',
    desc: '呪われた剣で切りつける。まぼろしを見せることがある。',
  },
  m_ghost_laugh: {
    name: 'ぶきみにわらう', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'def', mult: 0.85, dur: 20 }, cast: '{a}はぶきみにわらった！体がふるえて守りが弱くなる！', anim: 'debuff',
    desc: 'ぶきみなわらい声で敵の守備力を下げる。',
  },
  m_thunder: {
    name: '雷', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'bolt', base: [20, 28], thr: 99 }, cast: '{a}は雷を落とした！', anim: 'bolt1',
    desc: '雷を落として敵1体をうつ。',
  },
  m_storm_wing: {
    name: '嵐のつばさ', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [14, 20], thr: 99 }, cast: '{a}は大きなつばさで嵐をおこした！', anim: 'wind2',
    desc: 'つばさで嵐をおこし、敵みんなをきりさく。',
  },
  m_coral_punch: {
    name: 'サンゴのこぶし', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}はサンゴのこぶしをふりおろした！', anim: 'hit',
    desc: 'かたいサンゴのこぶしでなぐる。',
  },
  m_wind_slash: {
    name: '風の剣', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, element: 'wind' }, cast: '{a}は風をまとった剣で切りつけた！', anim: 'slash_fast',
    desc: '風をまとった剣で切りつける。',
  },
  // ── 大王イカ ──
  m_tentacle: {
    name: '足でたたく', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.75 }, cast: '{a}は何本もの足をふりまわした！', anim: 'hit_all',
  },
  m_ink: {
    name: 'すみをはく', kind: 'monster', target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.4, turns: [2, 3] }, cast: '{a}はまっ黒なすみをはいた！', anim: 'dark1',
    desc: 'すみをはいて、敵みんなにまぼろしを見せる。',
  },
  m_squeeze: {
    name: 'まきつく', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.6, status: { status: 'paralyze', chance: 0.2, turns: [1, 2] } }, cast: '{a}は{t}に足をまきつけて、しめあげた！', anim: 'hit',
  },
  m_whirl_charge: {
    name: 'うずをまく', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_maelstrom' }, cast: '{a}のまわりで、水が大きくうずをまき始めた！', anim: 'charge',
  },
  m_maelstrom: {
    name: '大うずしお', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.2, ignoreDef: 0.3 }, cast: '{a}の大うずしお！はげしい水が敵をのみこむ！', anim: 'wind2',
    desc: '大きなうずしおで敵みんなに大ダメージ。',
  },
  // ── 嵐の将軍ストルム ──
  m_storm_blade: {
    name: '嵐の剣', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.5, element: 'wind' }, cast: '{a}の嵐の剣！風のやいばがうなりをあげる！', anim: 'slash_heavy',
  },
  m_thunder_call: {
    name: '雷を呼ぶ', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [18, 26], thr: 99 }, cast: '{a}は剣を空にかかげた！雷がふりそそぐ！', anim: 'bolt2',
    desc: '雷を呼んで敵みんなをうつ。',
  },
  m_tornado_charge: {
    name: '竜巻をためる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_tornado' }, cast: '{a}のマントがふくらんだ！大きな竜巻が生まれようとしている！', anim: 'charge',
  },
  m_tornado: {
    name: '大竜巻', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [32, 42], thr: 99 }, cast: '{a}の大竜巻！はげしい風がすべてをまきあげる！', anim: 'wind2',
    desc: '大きな竜巻で敵みんなに大ダメージ。',
  },
};

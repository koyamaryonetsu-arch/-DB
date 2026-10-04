// 第4章「砂の海にしずむ星」の モンスターの 技（abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
export const CH4_ABILITIES = {
  // ── 砂ばく・海辺 ──
  m_sand_throw: {
    name: '砂かけ', kind: 'monster', mp: 2, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.3, turns: [2, 3] }, cast: '{a}はかわいた砂をまき上げた！', anim: 'breath',
    desc: '砂をまき上げて、敵みんなの目をくらませることがある。',
  },
  m_sand_call: {
    name: '仲間を呼ぶ', kind: 'monster', target: 'self',
    effect: { type: 'callHelp', species: 'sand_slime' }, cast: '{a}は砂の中から仲間を呼んだ！', anim: 'none',
  },
  m_poison_sting: {
    name: '毒ばり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.1, status: { status: 'poison', chance: 0.45 } }, cast: '{a}はしっぽの毒ばりをつき立てた！', anim: 'hit',
    desc: 'しっぽの毒ばりでさす。毒にすることがある。',
  },
  m_scissor_combo: {
    name: 'はさみうち', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 0.85, hits: 2 }, cast: '{a}は2本のはさみで、はさみうちにした！', anim: 'slash_fast',
    desc: '2本のはさみで、2回続けて切りつける。',
  },
  m_double_peck: {
    name: '2回つつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 2 }, cast: '{a}はするどいくちばしで、2回つついてきた！', anim: 'slash_fast',
    desc: 'くちばしで2回続けてつつく。',
  },
  m_vulture_dive: {
    name: '急降下', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, acc: 0.8 }, cast: '{a}は空高くまい上がり、急降下してきた！', anim: 'tackle',
    desc: '空から急降下して体当たりする。当たると大きいが、よけやすい。',
  },
  m_sweet_scent: {
    name: 'あまい香り', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.25, turns: [1, 2] }, cast: '{a}はあまい香りをふりまいた！', anim: 'breath',
    desc: 'あまい香りで、敵みんなを混乱させることがある。',
  },
  m_mirage_pollen: {
    name: 'まぼろしの花粉', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'blind', chance: 0.5, turns: [2, 3] }, cast: '{a}は{t}に、きらきら光る花粉をふきかけた！', anim: 'debuff',
    desc: '光る花粉で、目をくらませることがある。',
  },
  m_root_drain: {
    name: '根っこで吸う', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'drainHp', mult: 0.9 }, cast: '{a}は根っこをのばして、{t}の力を吸い取った！', anim: 'hit',
    desc: '根っこで敵の力を吸い取って、自分のHPを回復する。',
  },
  // ── 夜の 砂ばく ──
  m_moon_beam: {
    name: '月の光線', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [30, 40], thr: 99 }, cast: '{a}は青白い月の光を、あびせてきた！', anim: 'dark1',
    desc: '冷たい月の光で、敵みんなに闇のダメージ。',
  },
  m_soul_sip: {
    name: '冷たい手', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'drainMp', amount: [8, 14] }, cast: '{a}の冷たい手が、{t}にふれた！', anim: 'dark1',
    desc: '冷たい手でふれて、MPを吸い取る。',
  },
  m_ghost_fade: {
    name: 'すけていく', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.3, dur: 30 }, cast: '{a}の体が、月の光にすけていく…！', anim: 'buff',
    desc: '体がすけて、しばらく攻撃がすりぬけやすくなる。',
  },
};

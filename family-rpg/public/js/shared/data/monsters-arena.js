// 第37回 A: サファラ闘技場の 王者たち（monsters.js が addArenaHidden で まぜる）
// 図鑑・魔物の 数・配合には 出さない（数えない 形。色ちがいと おなじ。enumerable: false）。仲間にも ならない
// え: 力じまんの戦士・砂嵐三兄弟・闘技場の王者・伝説のチャンピオンと 弟子は client/render/arena-art.js（人は 色ちがいの 絵。tint だと はだの 色まで かわるので）。
//   ほかは 今の 魔物の え（art・tint・artScale）
//
// しかけ（王者 1組に 1つ。docs/plan-r37.md の A）
//   ランク1 力じまんの戦士 … 前ぶれ「力をためている」→ 次の 番に 1人へ「ばくれつかぶとわり」（身を 守ると 半分）
//   ランク2 砂嵐三兄弟 … 長男の 合図 → 次の 番に 合体技「砂嵐トライアングル」。生きている 兄弟が 多いほど 強い。1人だけでは 出せない
//                        （arena.team。battle-arena.js の arCombo）
//   ランク3 ランプの大魔人 … 体が 金色に 光ると、次の 番まで 呪文を はね返す（battle-temple.js の reflect）。ランプの精が 回復する
//   ランク4 太陽の剣士ソルと 月の剣士ルナ … 片方を たおすと、もう片方が「よみがえりのまい」（大きな ダメージで 止められる）。2人を 同じ ころに たおそう
//   ランク5 闘技場の王者ガルム … 2だんの 前ぶれ（かまえ → 気が 集まる）→ 敵みんなに「王者の一撃」
//   ランク6 砂ザメの王 … 砂に もぐる（次の 番まで ねらえない）→ 砂が もり上がったら 大ジャンプ（battle-ch4.js の burrow）
//   ランク7 七色の魔導王 … 炎・氷・雷・風の よろい。同じ 属性は すいこんで 回復・弱点で くだける（arena.armor。battle-arena.js）
//   ランク8 伝説のチャンピオン レオーネ … 2人の 弟子と 3人の 合体技（ランク2と おなじ しくみ。もっと 強い）
const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };
const PIRATE = { sleep: 0.4, confuse: 0.4, blind: 0.5, poison: 0.5, paralyze: 0.4, silence: 0.6 };

export const ARENA_MONSTERS = {
  // ───── ランク1 ─────
  ar_fighter: {
    name: '力じまんの戦士', lv: 37, hp: 4300, mp: 0, str: 150, def: 92, agi: 62, mag: 20, exp: 2600, gold: 900,
    race: 'human', size: 'l', boss: true, turns: 1, speed: 1.15, hit: 'smash', art: 'arena_fighter',
    resist: { ...BOSS_STATUS, sleep: 0.3, confuse: 0.3, ice: 1.1 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar1_punch' }, { w: 1, id: 'm_ar1_flex', cond: 'notRecent:m_ar1_flex' },
      { w: 2, id: 'm_ar1_charge', cond: ['notRecent:m_ar1_charge', 'notRecent:m_ar1_bomb'] },
    ],
    phases: [{ hpBelow: 0.4, msg: ['力じまんの戦士は、むねをドンとたたいた！', '「まだまだ、これからだ！」…動きが速くなった！'], speed: 1.25 }],
    desc: 'サファラ闘技場のランク1の王者。自分の力が自まん。大きく息をすって力をためたら、次の番に「ばくれつかぶとわり」。身を守ろう。',
  },

  // ───── ランク2（砂嵐三兄弟。arena.team で 合体技の 数を 数える）─────
  ar_pirate1: {
    name: 'あにきのジャバ', lv: 40, hp: 2500, mp: 40, str: 152, def: 92, agi: 78, mag: 40, exp: 1200, gold: 500,
    race: 'human', size: 'm', boss: true, speed: 1, hit: 'slash', art: 'arena_pirate', arena: { team: 'sand3', lead: true },
    resist: { ...PIRATE },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar2_slash' }, { w: 1, id: 'm_ar2_sand', cond: 'notRecent:m_ar2_sand' },
      { w: 4, id: 'm_ar2_signal', cond: ['c5:arTeam2', 'notRecent:m_ar2_signal', 'notRecent:m_ar2_combo'] },
    ],
    desc: '砂嵐三兄弟の長男。口笛の合図で、3人の合体技「砂嵐トライアングル」。弟たちを先にたおすと、合体技が弱くなる。',
  },
  ar_pirate2: {
    name: 'まん中のジュバ', lv: 40, hp: 1900, mp: 40, str: 140, def: 84, agi: 84, mag: 40, exp: 900, gold: 400,
    race: 'human', size: 'm', speed: 1, hit: 'slash', art: 'arena_pirate_b', arena: { team: 'sand3' },
    resist: { ...PIRATE },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_ar2_slash' }, { w: 2, id: 'm_ar2_sand', cond: 'notRecent:m_ar2_sand' }],
    desc: '砂嵐三兄弟の次男。砂かけがとくい。',
  },
  ar_pirate3: {
    name: 'ちびのジョバ', lv: 40, hp: 1600, mp: 40, str: 132, def: 78, agi: 100, mag: 40, exp: 800, gold: 400,
    race: 'human', size: 'm', speed: 1, hit: 'slash', art: 'arena_pirate_c', artScale: 0.88, arena: { team: 'sand3' },
    resist: { ...PIRATE },
    actions: [{ w: 4, id: 'attack' }, { w: 3, id: 'm_ar2_slash' }],
    desc: '砂嵐三兄弟の三男。いちばん小さくて、いちばんすばしこい。',
  },

  // ───── ランク3 ─────
  ar_genie: {
    name: 'ランプの大魔人', lv: 43, hp: 5700, mp: 400, str: 146, def: 92, agi: 62, mag: 150, exp: 4200, gold: 1600,
    race: 'demon', size: 'l', boss: true, turns: 1, speed: 1.05, hit: 'bash', art: 'lamp_genie', artScale: 1.3, tint: { hueTo: 44, sat: 1.3, light: 1.12 },
    resist: { ...BOSS_STATUS, fire: 0.5, ice: 1.2, dark: 0.8 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar3_fist' }, { w: 2, id: 'm_ar3_blaze', cond: 'notRecent:m_ar3_blaze' },
      { w: 3, id: 'm_ar3_glow', cond: 'notRecent:m_ar3_glow' },
    ],
    phases: [{ hpBelow: 0.5, msg: ['ランプの大魔人は、ランプのけむりを大きくふき上げた！', '「おもしろい！もっと本気を見せてやろう！」'], turns: 2, speed: 0.75 }],
    desc: 'サファラ闘技場のランク3の王者。金色のランプからあらわれる大魔人。体が金色に光ったら、次の番まで呪文をはね返す。光っている間は、武器や特技で戦おう。',
  },
  ar_lamp: {
    name: 'ランプの子分', lv: 42, hp: 800, mp: 120, str: 96, def: 86, agi: 76, mag: 120, exp: 500, gold: 200,
    race: 'demon', size: 's', speed: 1, hit: 'bash', art: 'lamp', artScale: 1.2, tint: { hueTo: 40, sat: 1.2, light: 1.1 },
    resist: { fire: 0.4, ice: 1.3, sleep: 0.5, confuse: 0.6 },
    actions: [{ w: 2, id: 'attack' }, { w: 3, id: 'm_ar3_lamp_fire' }, { w: 4, id: 'm_ar3_lamp_heal', cond: 'allyHurt' }],
    desc: 'ランプの大魔人の子分。大魔人のHPを回復する。',
  },

  // ───── ランク4（ふたごの 剣士）─────
  ar_sun: {
    name: '太陽の剣士ソル', lv: 46, hp: 3300, mp: 60, str: 172, def: 112, agi: 70, mag: 60, exp: 2600, gold: 1000,
    race: 'human', size: 'm', boss: true, turns: 1, speed: 1, hit: 'slash', art: 'mirror_knight', tint: { hueTo: 36, sat: 1.35, light: 1.1 }, arena: { twin: 'ar_moon' },
    resist: { ...BOSS_STATUS, fire: 0.5, ice: 1.2 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar4_sun_slash' }, { w: 1, id: 'm_ar4_twin', cond: 'notRecent:m_ar4_twin' },
      { w: 9, id: 'm_ar4_sun_dance', cond: ['deadFriend:ar_moon', 'notRecent:m_ar4_sun_dance'] },
    ],
    desc: 'ふたごの剣士の兄。ほのおの剣を使う。月の剣士ルナがたおれると、よみがえりのまいで生き返らせる。2人を同じころにたおそう。',
  },
  ar_moon: {
    name: '月の剣士ルナ', lv: 46, hp: 2900, mp: 60, str: 156, def: 98, agi: 94, mag: 60, exp: 2400, gold: 1000,
    race: 'human', size: 'm', boss: true, turns: 1, speed: 1, hit: 'slash', art: 'mirror_knight', tint: { hueTo: 218, sat: 1.25, light: 1.05 }, arena: { twin: 'ar_sun' },
    resist: { ...BOSS_STATUS, ice: 0.5, fire: 1.2 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar4_moon_slash' }, { w: 1, id: 'm_ar4_twin', cond: 'notRecent:m_ar4_twin' },
      { w: 9, id: 'm_ar4_moon_dance', cond: ['deadFriend:ar_sun', 'notRecent:m_ar4_moon_dance'] },
    ],
    desc: 'ふたごの剣士の妹。すばやい2回切り。太陽の剣士ソルがたおれると、よみがえりのまいで生き返らせる。',
  },

  // ───── ランク5 ─────
  ar_king: {
    name: '闘技場の王者ガルム', lv: 49, hp: 9200, mp: 200, str: 188, def: 112, agi: 66, mag: 60, exp: 9000, gold: 3000,
    race: 'human', size: 'l', boss: true, turns: 2, speed: 0.7, hit: 'slash', art: 'arena_king',
    resist: { ...BOSS_STATUS, dark: 0.8 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar5_slash' }, { w: 2, id: 'm_ar5_sweep', cond: 'notRecent:m_ar5_sweep' },
      { w: 1, id: 'm_ar5_roar', cond: 'notRecent:m_ar5_roar' },
      { w: 2, id: 'm_ar5_raise', cond: ['notRecent:m_ar5_raise', 'notRecent:m_ar5_gather', 'notRecent:m_ar5_finish'] },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['闘技場の王者ガルムは、マントをぬぎすてた！', '「ここからが、王者の本気だ！」…攻撃力が上がった！'], buff: { atk: 1.15 } },
      { hpBelow: 0.25, msg: ['観客たちの声が、闘技場をゆらしている！', 'ガルムの動きが速くなった！'], speed: 1.2 },
    ],
    desc: 'サファラ闘技場の王者。大剣を天にかかげたら1つめの前ぶれ、王者の気が集まったら2つめの前ぶれ。次の番に「王者の一撃」が来る。身を守ろう。',
  },

  // ───── ランク6（伝説の部）─────
  ar_sharkking: {
    name: '砂ザメの王', lv: 53, hp: 29000, mp: 200, str: 320, def: 155, agi: 80, mag: 120, exp: 12000, gold: 4000,
    race: 'beast', size: 'xl', boss: true, turns: 2, speed: 0.64, hit: 'bite', art: 'sand_shark', artScale: 1.9, tint: { hueTo: 30, sat: 0.9, light: 0.82 },
    resist: { ...BOSS_STATUS, bolt: 1.3, ice: 1.2, fire: 0.7, wind: 0.7, poison: 0.2 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar6_bite' }, { w: 2, id: 'm_ar6_fin', cond: 'notRecent:m_ar6_fin' },
      { w: 3, id: 'm_ar6_dive', cond: 'notRecent:m_ar6_dive' },
    ],
    phases: [
      { hpBelow: 0.75, msg: ['砂ザメの王は、せびれで砂をはね上げた！', '闘技場の砂の下から、砂ザメたちがあらわれた！'], summon: ['ar_shark', 'ar_shark'] },
      { hpBelow: 0.25, msg: ['砂ザメの王の目が、まっかに光った！', '動きが速くなった…！'], speed: 1.2 },
    ],
    desc: '伝説の部、ランク6の王者。砂の海からやって来た、とても大きな砂ザメ。砂にもぐったら、次の番まで攻撃がとどかない。砂がもり上がったら大ジャンプ。身を守ろう。雷がよく効く。',
  },
  ar_shark: {
    name: '王の砂ザメ', lv: 51, hp: 2000, mp: 0, str: 270, def: 120, agi: 90, mag: 20, exp: 900, gold: 300,
    race: 'beast', size: 'm', speed: 1, hit: 'bite', art: 'sand_shark', tint: { hueTo: 30, sat: 0.9, light: 0.9 },
    resist: { bolt: 1.4, ice: 1.2, fire: 0.8, wind: 0.8, poison: 0.5, sleep: 0.4, confuse: 0.6 },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_shark_double' }, { w: 2, id: 'm_shark_fin', cond: 'notRecent:m_shark_fin' }],
    desc: '砂ザメの王の子分。2回つづけてかみついてくる。',
  },

  // ───── ランク7（伝説の部）─────
  ar_prism: {
    name: '七色の魔導王', lv: 55, hp: 29000, mp: 3000, str: 300, def: 140, agi: 86, mag: 330, exp: 14000, gold: 4500,
    race: 'human', size: 'l', boss: true, turns: 2, speed: 0.66, hit: 'bash', art: 'archmage', artScale: 1.35, tint: { hueTo: 290, sat: 1.25, light: 1.12 },
    resist: { ...BOSS_STATUS, light: 0.7, dark: 1.1 },
    // よろい: els … まとう じゅん（まえと ちがう もの）/ weak … 弱点 / wait … くだけて から また まとう までの 番 /
    //   absorb … すいこむ ダメージの わりあい（HPが ふえる）/ weakMult … 弱点の ダメージ
    arena: { armor: { els: ['fire', 'ice', 'bolt', 'wind'], weak: { fire: 'ice', ice: 'fire', bolt: 'wind', wind: 'bolt' }, wait: 2, absorb: 0.6, weakMult: 1.6 } },
    actions: [
      { w: 8, id: 'm_ar7_armor', cond: 'c5:arNoArmor' },
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar7_spell', cond: 'c5:arArmored' }, { w: 3, id: 'm_ar7_bolt' },
      { w: 2, id: 'm_ar7_charge', cond: ['notRecent:m_ar7_charge', 'notRecent:m_ar7_rainbow'] },
    ],
    phases: [{ hpBelow: 0.3, msg: ['七色の魔導王のよろいが、にじ色にかがやいた！', '「わたしの光は、まだ消えぬ！」…魔力が上がった！'], buff: { atk: 1.15 } }],
    desc: '伝説の部、ランク7の王者。炎・氷・雷・風のよろいをまとう。よろいと同じ属性の攻撃はすいこんで回復してしまう。弱点の属性でよろいをくだこう（炎⇔氷・雷⇔風）。七色の光が集まったら大技。',
  },

  // ───── ランク8（伝説の部。合体技の 組 'legend'）─────
  ar_legend: {
    name: '伝説のチャンピオン・レオーネ', lv: 58, hp: 27500, mp: 400, str: 345, def: 150, agi: 96, mag: 200, exp: 20000, gold: 6000,
    race: 'human', size: 'l', boss: true, turns: 2, speed: 0.66, hit: 'slash', art: 'arena_legend', arena: { team: 'legend', lead: true },
    resist: { ...BOSS_STATUS, light: 0.7, dark: 0.7 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar8_slash' }, { w: 2, id: 'm_ar8_wave', cond: 'notRecent:m_ar8_wave' },
      { w: 3, id: 'm_ar8_signal', cond: ['c5:arTeam2', 'notRecent:m_ar8_signal', 'notRecent:m_ar8_combo'] },
    ],
    phases: [{ hpBelow: 0.4, msg: ['伝説のチャンピオンの体から、金色の気があふれ出した！', '「見事だ…！だが、伝説はここからだ！」…攻撃力が上がった！'], buff: { atk: 1.15 } }],
    desc: '伝説の部、ランク8の王者。むかし、この闘技場で1度も負けなかったという伝説のチャンピオン。剣を高くかかげたら、2人の弟子との合体技の合図。弟子を先にたおすと弱くなる。',
  },
  ar_disciple1: {
    name: '伝説の弟子ライ', lv: 56, hp: 6400, mp: 100, str: 268, def: 128, agi: 112, mag: 60, exp: 3000, gold: 1000,
    race: 'human', size: 'm', boss: true, turns: 1, speed: 1, hit: 'smash', art: 'arena_fighter_b', artScale: 0.92, arena: { team: 'legend' },
    resist: { ...BOSS_STATUS },
    actions: [{ w: 3, id: 'attack' }, { w: 4, id: 'm_ar8_fist' }],
    desc: '伝説のチャンピオンの弟子。すばやいれんだがとくい。',
  },
  ar_disciple2: {
    name: '伝説の弟子カイ', lv: 56, hp: 7000, mp: 300, str: 222, def: 168, agi: 80, mag: 200, exp: 3000, gold: 1000,
    race: 'human', size: 'm', boss: true, turns: 1, speed: 1, hit: 'slash', art: 'arena_king_b', artScale: 0.9, arena: { team: 'legend' },
    resist: { ...BOSS_STATUS },
    actions: [{ w: 3, id: 'attack' }, { w: 4, id: 'm_ar8_cheer', cond: 'allyHurt' }, { w: 1, id: 'm_ar8_guard', cond: 'notRecent:m_ar8_guard' }],
    desc: '伝説のチャンピオンの弟子。仲間をはげまして回復し、守りを固める。',
  },
};

// 数えない 形で まぜる（図鑑・魔物の 数・配合の 一覧には 出ない。MONSTERS[id] は ふつうに 引ける）
export function addArenaHidden(table) {
  for (const [id, m] of Object.entries(ARENA_MONSTERS)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { noBefriend: true, ...m }, enumerable: false, configurable: true, writable: true });
  }
}

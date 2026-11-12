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
//   第65回 C（第2部の 強さ。え は 今の 魔物の え を 色がえ）:
//   ランク9 炎と氷の竜きょうだい（炎の竜ヒート・氷の竜クール）… ふたご（ランク4と おなじ しくみ）。息を すったら 次の 番に 大ブレス。
//                        炎の竜には 氷・氷の竜には 炎が よく 効く。片方を たおすと、もう片方が「よびもどしの声」
//   ランク10 星の大王者レグルス … 星の よろい（ランク7と おなじ しくみ）と、ひこ星のアルタ・おり姫のベガとの 3人の 合体技（ランク8と おなじ しくみ）
//   第68回 C（第7章クリアの 強さ）:
//   ランク11 白銀の大王者ボレアス … こおる・とける（arena.frost。battle-arena.js）。こおっている 間は 炎 いがい ほとんど 効かない・炎で とかすと 大チャンス。
//                        こおった 体で 息を すったら 次の 番に 大ふぶき（とかすと 止まる）。雪だるまのコロン・雪の子チララが、とけた 王者を また こおらせる
//   第74回 C（第8章 第2幕クリアの 強さ）:
//   ランク12 深海の大王者リヴァイアス … あわの よろい（arena.bubble。battle-arena.js）。あわが ある 間は、どんな 攻撃も 1回で あわが 1つ はじけて
//                        ダメージは 0。ぜんぶ はじけると 大チャンス。しばらくすると また まとう。あわの 中で 回り始めたら 次の 番に 大うずしお。
//                        あわふきガニのブクブ・光クラゲのポワン（クラゲは 王者を 回復する）
//   第80回 C（第8章クリアの 強さ）:
//   ランク13 時の大王者クロノガルド … 時の まきもどし（arena.rewind。battle-arena.js）。砂時計を さかさまに すると、次の 番までに 受けた
//                        ダメージを まきもどす。その 間に ダメージを 受けないと「まきもどす 時が ない」→ 時が ゆがんで 大チャンス。
//                        時計の騎士チクタク・砂時計の精サラリ
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

  // ───── 第65回 C: ランク9（伝説の部。ふたごの 竜）─────
  ar_fire_drake: {
    name: '炎の竜ヒート', lv: 68, hp: 18500, mp: 400, str: 600, def: 230, agi: 120, mag: 400, exp: 22000, gold: 6000,
    race: 'dragon', size: 'l', boss: true, turns: 1, speed: 0.92, hit: 'bite', art: 'dust_drake', artScale: 1.35, tint: { hueTo: 8, sat: 1.4, light: 1.05 },
    arena: { twin: 'ar_ice_drake' },
    resist: { ...BOSS_STATUS, fire: 0.3, ice: 1.4 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar9_fire_claw' }, { w: 1, id: 'm_ar9_tail', cond: 'notRecent:m_ar9_tail' },
      { w: 2, id: 'm_ar9_fire_inhale', cond: ['notRecent:m_ar9_fire_inhale', 'notRecent:m_ar9_fire_blast'] },
      { w: 9, id: 'm_ar9_fire_call', cond: ['deadFriend:ar_ice_drake', 'notRecent:m_ar9_fire_call'] },
    ],
    phases: [{ hpBelow: 0.3, msg: ['炎の竜ヒートの体から、ほのおがふき上がった！', '「まだまだ、もえたりないぞ！」…動きが速くなった！'], speed: 1.15 }],
    desc: '伝説の部、ランク9の王者。炎と氷の竜きょうだいの兄。大きく息をすったら、次の番に炎のブレス。氷がよく効く。氷の竜クールがたおれると、よびもどしの声で生き返らせる。',
  },
  ar_ice_drake: {
    name: '氷の竜クール', lv: 68, hp: 16500, mp: 400, str: 550, def: 220, agi: 140, mag: 400, exp: 22000, gold: 6000,
    race: 'dragon', size: 'l', boss: true, turns: 1, speed: 0.98, hit: 'bite', art: 'dust_drake', artScale: 1.3, tint: { hueTo: 200, sat: 1.2, light: 1.12 },
    arena: { twin: 'ar_fire_drake' },
    resist: { ...BOSS_STATUS, ice: 0.3, fire: 1.4 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar9_ice_claw' }, { w: 1, id: 'm_ar9_tail', cond: 'notRecent:m_ar9_tail' },
      { w: 2, id: 'm_ar9_ice_inhale', cond: ['notRecent:m_ar9_ice_inhale', 'notRecent:m_ar9_ice_blast'] },
      { w: 9, id: 'm_ar9_ice_call', cond: ['deadFriend:ar_fire_drake', 'notRecent:m_ar9_ice_call'] },
    ],
    phases: [{ hpBelow: 0.3, msg: ['氷の竜クールのまわりに、ふぶきがうずをまいた！', '「お兄ちゃんには、負けないよ！」…動きが速くなった！'], speed: 1.15 }],
    desc: '伝説の部、ランク9の王者。炎と氷の竜きょうだいの妹。大きく息をすったら、次の番に氷のブレス。炎がよく効く。炎の竜ヒートがたおれると、よびもどしの声で生き返らせる。',
  },

  // ───── 第65回 C: ランク10（伝説の部。合体技の 組 'stars'・星の よろい）─────
  ar_regulus: {
    name: '星の大王者レグルス', lv: 76, hp: 38000, mp: 3000, str: 640, def: 250, agi: 130, mag: 600, exp: 40000, gold: 12000,
    race: 'beast', size: 'xl', boss: true, turns: 2, speed: 0.62, hit: 'bite', art: 'star_panther', artScale: 1.7, tint: { hueTo: 44, sat: 1.35, light: 1.12 },
    arena: {
      team: 'stars', lead: true,
      armor: { els: ['fire', 'ice', 'bolt', 'wind'], weak: { fire: 'ice', ice: 'fire', bolt: 'wind', wind: 'bolt' }, wait: 2, absorb: 0.6, weakMult: 1.6 },
    },
    resist: { ...BOSS_STATUS, light: 0.7, dark: 0.8 },
    actions: [
      { w: 8, id: 'm_ar10_armor', cond: 'c5:arNoArmor' },
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar10_claw' }, { w: 2, id: 'm_ar10_spell', cond: 'c5:arArmored' },
      { w: 1, id: 'm_ar10_roar', cond: 'notRecent:m_ar10_roar' },
      { w: 3, id: 'm_ar10_signal', cond: ['c5:arTeam2', 'notRecent:m_ar10_signal', 'notRecent:m_ar10_combo'] },
    ],
    phases: [{ hpBelow: 0.4, msg: ['星の大王者レグルスのたてがみが、まぶしい金色にもえ上がった！', '「見事だ…！だが、王者の星は、まだしずまぬ！」…攻撃力が上がった！'], buff: { atk: 1.15 } }],
    desc: '伝説の部、ランク10の王者。夜空のしし座からおりてきたという、金色の大王者。炎・氷・雷・風のよろいをまとい、同じ属性の攻撃はすいこんでしまう。弱点（炎⇔氷・雷⇔風）でくだこう。たてがみがかがやいたら、3人の合体技の合図。',
  },
  ar_altair: {
    name: 'ひこ星のアルタ', lv: 74, hp: 8400, mp: 300, str: 550, def: 200, agi: 170, mag: 300, exp: 6000, gold: 2000,
    race: 'beast', size: 'm', boss: true, turns: 1, speed: 1, hit: 'bite', art: 'comet_bird', artScale: 1.25, tint: { hueTo: 210, sat: 1.2, light: 1.1 }, arena: { team: 'stars' },
    resist: { ...BOSS_STATUS, wind: 0.6, bolt: 1.2 },
    actions: [{ w: 3, id: 'attack' }, { w: 4, id: 'm_ar10_dive' }, { w: 2, id: 'm_ar10_gale', cond: 'notRecent:m_ar10_gale' }],
    desc: '星の大王者の家来。わし座のひこ星。空からすばやくつっこんでくる。',
  },
  ar_vega: {
    name: 'おり姫のベガ', lv: 74, hp: 9400, mp: 600, str: 420, def: 240, agi: 120, mag: 500, exp: 6000, gold: 2000,
    race: 'spirit', size: 'm', boss: true, turns: 1, speed: 1, hit: 'bash', art: 'foam_siren', artScale: 1.15, tint: { hueTo: 280, sat: 1.15, light: 1.12 }, arena: { team: 'stars' },
    resist: { ...BOSS_STATUS, light: 0.6, dark: 1.2 },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_ar10_song', cond: ['allyHurt', 'notRecent:m_ar10_song'] }, { w: 1, id: 'm_ar10_veil', cond: 'notRecent:m_ar10_veil' }],
    desc: '星の大王者の家来。こと座のおり姫。歌で仲間を回復し、星のベールで守りを固める。',
  },

  // ───── 第68回 C: ランク11（伝説の部。こおる・とける）─────
  ar_boreas: {
    name: '白銀の大王者ボレアス', lv: 84, hp: 42000, mp: 3000, str: 690, def: 270, agi: 120, mag: 660, exp: 46000, gold: 14000,
    race: 'beast', size: 'xl', boss: true, turns: 2, speed: 0.62, hit: 'claw', art: 'yeti', artScale: 1.7, tint: { hueTo: 200, sat: 0.35, light: 1.3 },
    // frost: cut … こおっている 間の 炎 いがいの ダメージ / melt … とける までの 炎の ダメージ（最大HPの わりあい）/ thawMult … とけている 間の ダメージ /
    //   wait … とけて から また 自分で こおる までの 番 / fireRes … こおっている 間の 炎の 効きぐあい（オートの みつもり）
    arena: { lead: true, frost: { cut: 0.34, melt: 0.04, thawMult: 1.35, wait: 3, fireRes: 1.5 } },
    resist: { ...BOSS_STATUS, ice: 0.3, fire: 1.15, dark: 0.8 },
    actions: [
      { w: 9, id: 'm_ar11_refreeze', cond: 'c5:arThawWait' },
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar11_claw' }, { w: 2, id: 'm_ar11_icicle', cond: 'notRecent:m_ar11_icicle' },
      { w: 2, id: 'm_ar11_inhale', cond: ['c5:arFrozen', 'notRecent:m_ar11_inhale', 'notRecent:m_ar11_blizzard'] },
    ],
    phases: [{ hpBelow: 0.35, msg: ['白銀の大王者ボレアスの毛が、ぎらぎらと銀色に光った！', '「おもしろい…！北の風は、まだやまぬ！」…攻撃力が上がった！'], buff: { atk: 1.15 } }],
    desc: '伝説の部、ランク11の王者。北のはての雪山から来た、白銀の毛の大王者。体がこおっている間は、炎いがいはほとんど効かない。炎でこおりをとかすと、大チャンス。こおった体で大きく息をすったら、次の番に大ふぶき。',
  },
  ar_snowman: {
    name: '雪だるまのコロン', lv: 82, hp: 9000, mp: 300, str: 600, def: 230, agi: 110, mag: 400, exp: 6000, gold: 2000,
    race: 'material', size: 'm', boss: true, turns: 1, speed: 1, hit: 'bash', art: 'snowman', artScale: 1.25, tint: { hueTo: 205, sat: 0.6, light: 1.15 },
    arena: { frostHelp: true },
    resist: { ...BOSS_STATUS, ice: 0.3, fire: 1.3 },
    actions: [{ w: 9, id: 'm_ar11_snow_breath', cond: ['c5:arKingThawed', 'notRecent:m_ar11_snow_breath'] }, { w: 3, id: 'attack' }, { w: 3, id: 'm_ar11_snowball' }],
    desc: '白銀の大王者の家来。ころころ転がる雪だるま。とけた王者に、つめたいいきをふきかけて、またこおらせる。炎がよく効く。',
  },
  ar_snow_kid: {
    name: '雪の子チララ', lv: 82, hp: 8000, mp: 600, str: 480, def: 210, agi: 170, mag: 520, exp: 6000, gold: 2000,
    race: 'spirit', size: 's', flying: true, boss: true, turns: 1, speed: 1, hit: 'bash', art: 'snow_wisp', artScale: 1.3, tint: { hueTo: 190, sat: 0.9, light: 1.2 },
    arena: { frostHelp: true },
    resist: { ...BOSS_STATUS, ice: 0.3, fire: 1.3 },
    actions: [{ w: 9, id: 'm_ar11_snow_breath', cond: ['c5:arKingThawed', 'notRecent:m_ar11_snow_breath'] }, { w: 3, id: 'attack' }, { w: 3, id: 'm_ar11_snowdance', cond: 'notRecent:m_ar11_snowdance' }],
    desc: '白銀の大王者の家来。雪の空をまう、小さな雪の子。とけた王者に、つめたいいきをふきかけて、またこおらせる。炎がよく効く。',
  },

  // ───── 第74回 C: ランク12（伝説の部。あわの よろい）─────
  ar_leviathan: {
    name: '深海の大王者リヴァイアス', lv: 90, hp: 45000, mp: 3000, str: 740, def: 290, agi: 130, mag: 700, exp: 52000, gold: 16000,
    race: 'dragon', size: 'xl', boss: true, turns: 2, speed: 0.62, hit: 'bite', art: 'water_dragon', artScale: 1.7, tint: { hueTo: 232, sat: 0.95, light: 0.9 },
    // bubble: max … あわの 数（どんな 攻撃も 1回 当たると 1つ はじけて ダメージ 0）/ openMult … あわが ない 間の ダメージ /
    //   wait … ぜんぶ はじけて から また あわを まとう までの 番 / bigBase・bigPer … 大うずしおの 強さ（bigBase ＋ bigPer × のこりの あわ の 数 ばい）
    arena: { lead: true, bubble: { max: 4, openMult: 1.35, wait: 3, bigBase: 0.4, bigPer: 0.2 } },
    resist: { ...BOSS_STATUS, bolt: 1.2, ice: 0.8, fire: 0.9 },
    actions: [
      { w: 9, id: 'm_ar12_rebubble', cond: 'c5:arBubbleWait' },
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar12_fang' }, { w: 2, id: 'm_ar12_wave', cond: 'notRecent:m_ar12_wave' },
      { w: 2, id: 'm_ar12_inhale', cond: ['c5:arBubbled', 'notRecent:m_ar12_inhale', 'notRecent:m_ar12_maelstrom'] },
    ],
    phases: [{ hpBelow: 0.35, msg: ['深海の大王者リヴァイアスのうろこが、青白く光りだした！', '「よくぞ、ここまで…！海の底の力を、見せてやろう！」…攻撃力が上がった！'], buff: { atk: 1.15 } }],
    desc: '伝説の部、ランク12の王者。海のいちばん深い所から来た、青い大きな竜。体をあわのよろいでつつんでいる。あわは、どんな攻撃でも1回当たると1つはじける。全部はじけたら、大チャンス。あわの中で回り始めたら、次の番に大うずしお。あわが多いほど、うずは大きい。雷がよく効く。',
  },
  ar_bubble_crab: {
    name: 'あわふきガニのブクブ', lv: 88, hp: 10000, mp: 300, str: 640, def: 300, agi: 100, mag: 420, exp: 6500, gold: 2200,
    race: 'beast', size: 'm', boss: true, turns: 1, speed: 1, hit: 'claw', art: 'armor_crab', artScale: 1.3, tint: { hueTo: 190, sat: 1.15, light: 1.1 },
    resist: { ...BOSS_STATUS, bolt: 1.25, ice: 0.9 },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_ar12_scissors' }, { w: 2, id: 'm_ar12_spray', cond: 'notRecent:m_ar12_spray' }],
    desc: '深海の大王者の家来。かたいこうらの、青いカニ。大きなハサミではさみ、あわをふきつけてくる。雷がよく効く。',
  },
  ar_glow_jelly: {
    name: '光クラゲのポワン', lv: 88, hp: 8600, mp: 600, str: 460, def: 220, agi: 160, mag: 560, exp: 6500, gold: 2200,
    race: 'spirit', size: 'm', flying: true, boss: true, turns: 1, speed: 1, hit: 'bash', art: 'glow_jelly', artScale: 1.3, tint: { hueTo: 300, sat: 1.0, light: 1.15 },
    resist: { ...BOSS_STATUS, bolt: 1.2, fire: 1.1 },
    actions: [{ w: 4, id: 'm_ar12_heal', cond: ['allyHurt', 'notRecent:m_ar12_heal'] }, { w: 3, id: 'attack' }, { w: 3, id: 'm_ar12_sting' }],
    desc: '深海の大王者の家来。やさしく光る、むらさきのクラゲ。光で王者のきずを治し、しょくしゅでしびれさせる。雷がよく効く。',
  },

  // ───── 第80回 C: ランク13（伝説の部。時の まきもどし）─────
  ar_chronos: {
    name: '時の大王者クロノガルド', lv: 98, hp: 42000, mp: 3000, str: 800, def: 310, agi: 140, mag: 760, exp: 60000, gold: 18000,
    race: 'dragon', size: 'xl', boss: true, turns: 2, speed: 0.62, hit: 'bite', art: 'geardon', artScale: 1.25, tint: { hueTo: 268, sat: 0.8, light: 1.0 },
    // rewind: ripe … 砂時計を さかさまに して から まきもどす までの 自分の 行動の 数 / open … 時が ゆがんで いる 間の 自分の 行動の 数 /
    //   openMult … 時が ゆがんで いる 間の ダメージ
    arena: { lead: true, rewind: { ripe: 2, open: 3, openMult: 1.4 } },
    resist: { ...BOSS_STATUS, bolt: 1.2, ice: 0.9, dark: 0.8, water: 1 },
    actions: [
      { w: 99, id: 'm_ar13_rewind', cond: 'c5:arRewindReady' },
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ar13_hands' }, { w: 2, id: 'm_ar13_gears', cond: 'notRecent:m_ar13_gears' },
      { w: 3, id: 'm_ar13_flip', cond: ['c5:arCanFlip', 'notRecent:m_ar13_flip', 'notRecent:m_ar13_rewind'] },
      { w: 2, id: 'm_ar13_inhale', cond: ['c5:arNoFlip', 'notRecent:m_ar13_inhale', 'notRecent:m_ar13_storm'] },
    ],
    phases: [{ hpBelow: 0.35, msg: ['時の大王者クロノガルドの歯車が、ぎりぎりと速く回りだした！', '「時をこえて来た者たちよ…！ここからが本番だ！」…攻撃力が上がった！'], buff: { atk: 1.15 } }],
    desc: '伝説の部、ランク13の王者。いくつもの時代をこえて来た、歯車の大きな竜。大きな砂時計をさかさまにすると、次の番までに受けたダメージを、まきもどしてしまう。その間にダメージを受けないと、時がゆがんで大チャンス。雷がよく効く。',
  },
  ar_clock_knight: {
    name: '時計の騎士チクタク', lv: 96, hp: 11000, mp: 300, str: 700, def: 320, agi: 120, mag: 420, exp: 7500, gold: 2500,
    race: 'material', size: 'm', boss: true, turns: 1, speed: 1, hit: 'claw', art: 'chrono_knight', artScale: 1.3, tint: { hueTo: 280, sat: 0.7, light: 1.0 },
    resist: { ...BOSS_STATUS, bolt: 1.25, dark: 0.9, water: 1 },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_ar13_slash' }, { w: 2, id: 'm_ar13_guard', cond: 'notRecent:m_ar13_guard' }],
    desc: '時の大王者の家来。時計の針の剣で切りかかる、からくりの騎士。雷がよく効く。',
  },
  ar_sand_fairy: {
    name: '砂時計の精サラリ', lv: 96, hp: 9400, mp: 600, str: 500, def: 240, agi: 170, mag: 620, exp: 7500, gold: 2500,
    race: 'spirit', size: 'm', flying: true, boss: true, turns: 1, speed: 1, hit: 'bash', art: 'sand_sprite', artScale: 1.3, tint: { hueTo: 285, sat: 0.9, light: 1.15 },
    resist: { ...BOSS_STATUS, bolt: 1.2, wind: 0.8, water: 1 },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_ar13_sand' }, { w: 2, id: 'm_ar13_sleep', cond: 'notRecent:m_ar13_sleep' }],
    desc: '時の大王者の家来。砂時計の中から出てきた、小さな精。時の砂をふきつけて、ねむらせてくる。雷がよく効く。',
  },
};

// 数えない 形で まぜる（図鑑・魔物の 数・配合の 一覧には 出ない。MONSTERS[id] は ふつうに 引ける）
export function addArenaHidden(table) {
  for (const [id, m] of Object.entries(ARENA_MONSTERS)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { noBefriend: true, ...m }, enumerable: false, configurable: true, writable: true });
  }
}

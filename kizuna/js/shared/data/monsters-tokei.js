// 第2部 第6章 Step 5「止まった時計塔」の 魔物と、中ボス カリヨン（B: 戦い。docs/plan-ch6.md の 13-2・13-6・15）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch6-tokei-art.js。カリヨンの しかけ（時のかね）は shared/battle-tokei.js（battle-road.js から よぶ）
//
// 出現表（encounters-tokei.js）: t6_tower_low＝時計塔 1〜5階（千年前だけ。おすすめ Lv64〜66）
// 新しい 絵の 魔物は 3しゅ ＋ カリヨン（plan-breed-new.md の 9「1つの Step で 新しい 絵は 3〜4しゅ まで」）。
// のこりは 時のいせきの からくりの 魔物の 色ちがい（variants.js の 'clock'〈ぜんまい〉。encounters-tokei.js）
//
// ・ころがり歯車（cog_roller）… 顔の ある 大きな 歯車。ころがって ぶつかる。雷が よく 効く
// ・びっくりばねばこ（spring_box）… ふたが あくと ばねで ピエロが とび出す 箱。おどかして 混乱させる。炎が よく 効く
// ・キラー（killer。マリオの 敵）… 大砲から まっすぐ とんでくる 黒い 弾。「たいほうのあいず」で なかまの キラーを よぶ。氷が よく 効く
// ・カリヨン（carillon。5階の 中ボス。Lv65）… かねつきの からくり。4回 動くと 時の かねが 鳴る（がめんに のこりの かねの しるし）。
//   鳴ると、味方の 強くなった 力（バフ）と、カリヨンの 弱くなった 力（デバフ）が ぜんぶ 消えて、そのあと みんなに 強い 一撃。
//   知っている 人は「鳴った すぐ あとに 強くする・しるしが 1つの ときは 身を 守る」

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const CARILLON = 'carillon';
export const TOKEI_BOSSES = [CARILLON];

export const MONSTERS_TOKEI = {
  // ── 時計塔 1〜5階（からくりと 大砲。Lv64〜65）──
  // ころがり歯車: 顔の ある 大きな 歯車。塔の 中を ごろごろ ころがる
  cog_roller: {
    name: 'ころがり歯車', lv: 64, hp: 1960, mp: 80, str: 290, def: 246, agi: 112, mag: 150, exp: 1960, gold: 820,
    race: 'material', size: 'm', hit: 'bash', region: 6,
    resist: { bolt: 1.35, fire: 0.8, ice: 0.9, poison: 0, sleep: 0.3, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['seed_def', 40] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6t_cg_roll' }, { w: 2, id: 'm6t_cg_spin', cond: 'notRecent:m6t_cg_spin' }, { w: 1, id: 'm6t_cg_lock', cond: 'notRecent:m6t_cg_lock' }],
    desc: '顔のある大きな歯車。止まった時計塔の中を、ごろごろころがって、体あたりしてくる。雷がよく効く。',
  },
  // びっくりばねばこ: ふたが あくと、ばねの 先の ピエロが とび出す 箱
  spring_box: {
    name: 'びっくりばねばこ', lv: 65, hp: 1480, mp: 160, str: 262, def: 196, agi: 168, mag: 226, exp: 1980, gold: 840,
    race: 'demon', size: 'm', hit: 'bash', region: 6,
    resist: { fire: 1.3, dark: 0.7, ice: 0.9, poison: 0.4, sleep: 0.4, confuse: 0.2 }, drops: { common: ['magic_water', 12], rare: ['seed_agi', 36] },
    actions: [{ w: 3, id: 'm6t_sb_punch' }, { w: 2, id: 'm6t_sb_jump', cond: 'notRecent:m6t_sb_jump' }, { w: 2, id: 'm6t_sb_scare', cond: 'notRecent:m6t_sb_scare' }, { w: 2, id: 'attack' }],
    desc: 'ふたがあくと、ばねの先のピエロが、びよーんととび出す箱。おどかして、混乱させる。炎がよく効く。',
  },
  // キラー: 大砲から まっすぐ とんでくる 黒い 弾。目と うで（マリオの 敵）
  killer: {
    name: 'キラー', lv: 64, hp: 1320, mp: 40, str: 286, def: 256, agi: 150, mag: 60, exp: 1900, gold: 800,
    race: 'material', size: 'm', flying: true, hit: 'bash', region: 6,
    resist: { ice: 1.3, fire: 0.6, blast: 0.7, wind: 0.9, poison: 0, sleep: 0, confuse: 0.3 }, drops: { common: ['jou_herb', 10], rare: ['seed_str', 36] },
    actions: [{ w: 3, id: 'm6t_kl_rush' }, { w: 2, id: 'attack' }, { w: 1, id: 'm6t_kl_call', cond: ['callHelp', 'notRecent:m6t_kl_call'] }],
    desc: 'たいほうから、まっすぐとんでくる黒いたま。とっしんがとても強い。たいほうのあいずで、仲間のキラーをよぶ。氷がよく効く。',
  },

  // ── 時計塔 5階: カリヨン（中ボス。ゼンマイの 3番目の 家来。Lv65）──
  // ch6.bell … 時の かね（every … 何回 動くと かねが 鳴るか〈鳴る 番も 数える〉・mult・ignoreDef … 鳴った あとの 一撃〈みんなに 物理〉）
  //   1回 目は every 回目に 鳴る。がめんの かねの しるしは「鳴るまでの のこり」（1つの とき、次に 動くと 鳴る）
  //   turns: 1（2回 行動に すると しるしが 2つずつ へって、1つの ときが 見えない）。かわりに 速い
  [CARILLON]: {
    name: 'カリヨン', lv: 65, hp: 38800, mp: 3000, str: 1165, def: 240, agi: 120, mag: 640, exp: 30000, gold: 9500,
    race: 'material', size: 'xl', boss: true, turns: 1, speed: 0.7, hit: 'bash', drops: { boss: ['p6t_bell_charm'], rare: ['p6t_bell_axe', 1] },
    resist: { ...BOSS_STATUS, light: 1.0, dark: 0.7, ice: 0.9, fire: 0.9, wind: 1.0, bolt: 1.1, blast: 1.0 },
    ch6: { kind: 'bell', bell: { every: 4, mult: 1.25, ignoreDef: 0.3 } },
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm6t_cr_hammer' }, { w: 3, id: 'm6t_cr_chime' },
      { w: 2, id: 'm6t_cr_spin', cond: 'notRecent:m6t_cr_spin' }, { w: 1, id: 'm6t_cr_tick', cond: 'notRecent:m6t_cr_tick' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['カリヨンの歯車が、ギリギリと音を立てて回り出した！', '攻撃力が上がった！'], buff: { atk: 1.12 } },
      { hpBelow: 0.2, msg: ['カリヨンの大きなかねに、ひびが入った！', '守りが弱くなった！'], debuff: { def: 0.75 } },
    ],
    desc: '影の時計師ゼンマイの3番目の家来。時計塔のかねつきのからくり。4回動くと、時のかねが鳴る。かねが鳴ると、強くなった力も、カリヨンの弱くなった力も、みんな消えてしまう。そのあとに強い一撃。かねのしるしが1つになったら、身を守ろう。強くするのは、かねが鳴ったすぐあとがよい。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）。第6章 Step 1・2 の 素材（時の砂・古い歯車。れん金で 使う）
export const TOKEI_MAT_DROPS = {
  cog_roller: ['p6_old_gear', 4],
  spring_box: ['p6_old_gear', 3],
  killer: ['p6_old_gear', 3],
};

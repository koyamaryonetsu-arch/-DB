// 第5章 Step 6・7「根の島」と「大地の神殿」の 魔物と、ボス ノクト（1回目）（B: 戦い）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch5-earth-mon-art.js。たたかいの しかけ（かげぶんしん・地われ・手をのばす・HP半分で 終わる・まもり兵・おこるダンゴムシ）は shared/battle-earth.js
//
// 出現表（encounters-earth.js）: t5_root＝根の島 / t5_earth_up＝大地の神殿 1〜4階 / t5_earth_low＝5〜8階
// おすすめ Lv49〜50（第26回で 経験値を ×0.6 に した ことを 考えて 合わせた。docs/plan-ch5.md の「15」「16」）
// region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（data/rare-loot.js の regionOf）
//
// アニメの 敵ふう（docs/plan-ch5.md の 15-4。名前は そのままの 名前を 使わない）
//   天空のまもり兵（空に うかぶ 城の 古い 機械の 兵ふう）… ゆっくり 歩き、目から ビーム（みんな）。こわれかけると 1回だけ 仲間を かばう。雷が よく 効く
//   大地のダンゴムシ（森の 大きな 虫ふう）… たたかれるほど おこって 強く なる（目が 赤く なる）。ねむっている 間・1回で 大きな ダメージは おこらない。かたい こうら
//   かおのない影（お面の さびしい おばけふう）… 金色の かけらを ばらまく（たおすと お金が 多い）。仲間を のみこむ（地われと おなじ。手をのばすで もどる）。光が よく 効く
//   根っこのこびと（森の 小さな せいれいふう）… にげ足が 早い。たおすと 大地の根
//
// ・ノクト（nocto_1）: 大地の神殿の いちばん 下の きまった 戦い。shared/battle-earth.js
//   かげぶんしん … 自分の 影（nocto_clone）を 2体 よぶ。影が 2体 そろうと 前ぶれ「ノクトと影たちが、同じかまえをとった…！」→ 次の 番に
//                  「ひとりぼっちの合体技」（みんなに 大きい）。影を 1体でも たおせば 出せない（影は HPが 少ないが、かわしやすい）
//   地われ     … だれか 1人が 地われに 落ちて「動けない・回復を 受けられない」。仲間の「手をのばす」で すぐ もどる（3回 動くと 自分で もどる）
//   HPが 半分 … 戦いは 勝ちで 終わる（ピピの 手紙を 持っていると ことばが かわる）
//   分身は 図鑑・魔物の 数・配合の 一覧に 出ない（数えない 形で MONSTERS に 入れる。addEarthHidden）

// ボスの じょうたい いじょうの 効きにくさ（ガイアイーター・ノクトの影と おなじ）
const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };
export const NOCTO1 = 'nocto_1';
export const NOCTO_CLONE = 'nocto_clone';
export const SKY_GUARD = 'sky_guard';
export const PILLBUG = 'earth_pillbug';
export const FACELESS = 'faceless_shade';
export const ROOT_SPRITE = 'root_sprite';

export const MONSTERS_EARTH = {
  // ── 根の島・大地の神殿（1〜3階）──
  // 根っこのこびと: 木の 根から 生まれた 小さな せいれい。すぐ にげる。たおすと 大地の根
  [ROOT_SPRITE]: {
    name: '根っこのこびと', lv: 48, hp: 520, mp: 80, str: 150, def: 150, agi: 170, mag: 140, exp: 980, gold: 320,
    race: 'plant', size: 's', hit: 'bite', region: 6,
    resist: { fire: 1.3, ice: 0.9, wind: 1.1, dark: 0.8, poison: 0.4, sleep: 0.5, confuse: 0.5 }, drops: { common: ['herb', 4], rare: ['seed_agi', 32] },
    actions: [{ w: 3, id: 'm_flee', cond: 'c5:rsFlee' }, { w: 2, id: 'attack' }, { w: 2, id: 'm_rs_root' }, { w: 1, id: 'm_rs_rattle', cond: 'notRecent:m_rs_rattle' }],
    desc: '大きな木の根から生まれた、小さな森のせいれい。頭をからから鳴らして、すぐ逃げてしまう。たおすと大地の根がとれる。炎がよく効く。',
  },
  // 天空のまもり兵: 空の 古い 城を 守っていた 機械の 兵。ゆっくり 歩き、目から ビーム。こわれかけると 1回だけ 仲間を かばう
  [SKY_GUARD]: {
    name: '天空のまもり兵', lv: 49, hp: 1180, mp: 80, str: 204, def: 176, agi: 58, mag: 168, exp: 1060, gold: 480,
    race: 'material', size: 'l', hit: 'bash', region: 6,
    resist: { bolt: 1.4, fire: 0.8, ice: 0.8, dark: 0.7, poison: 0, sleep: 0.2, confuse: 0.2, paralyze: 0.8 }, drops: { common: ['magic_water', 10], rare: ['seed_def', 32] },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_sg_beam', cond: 'notRecent:m_sg_beam' }, { w: 2, id: 'm_sg_arm' },
      // こわれかけると 1回だけ「…マモル…」（ほかの 魔物が いる とき。battle-earth.js の sgGuard）
      { w: 9, id: 'm_sg_guard', limit: 1, cond: ['hpBelow:0.4', 'c5:sgGuard'] },
    ],
    desc: '空にうかぶ古い城を守っていた、機械の兵。ゆっくり歩き、目からビームを出す。こわれかけると、仲間をかばうことがある。雷がよく効く。',
  },

  // ── 大地の神殿（5〜8階）──
  // 大地のダンゴムシ: 大地の 下に すむ 大きな 虫。たたかれるほど おこって 目が 赤く なる。かたい こうら
  //   anger … hits 回 たたかれる ごとに 1だん おこる（さいだい atk.length だん。攻撃力 atk ばい）。ねむっている 間・1回で 最大HPの big より 大きい ダメージは おこらない
  //   shell … ふつうの ダメージ（物理）は この ばい（合体技・爆発は そのまま）
  [PILLBUG]: {
    name: '大地のダンゴムシ', lv: 50, hp: 1500, mp: 60, str: 176, def: 210, agi: 54, mag: 90, exp: 1200, gold: 520,
    race: 'beast', size: 'l', hit: 'bite', region: 6,
    resist: { fire: 1.3, ice: 0.9, wind: 0.8, blast: 1.1, poison: 0.3, sleep: 0.8, confuse: 0.4, paralyze: 0.6 }, drops: { common: ['jou_herb', 10], rare: ['seed_def', 36] },
    anger: { hits: 3, atk: [1.35, 1.7], big: 0.3 }, shell: 0.75,
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_pb_roll' }, { w: 2, id: 'm_pb_curl', cond: 'notRecent:m_pb_curl' }, { w: 1, id: 'm_pb_stomp', cond: 'notRecent:m_pb_stomp' }],
    desc: '大地の下にすむ、大きなダンゴムシ。たたかれるほどおこり、目が赤くなって強くなる。ねむらせるか、大きな一撃でたおすと、おこらない。こうらがかたい。炎がよく効く。',
  },
  // かおのない影: お面を つけた、さびしい 影の おばけ。金色の かけらを ばらまき、仲間を のみこむ
  [FACELESS]: {
    name: 'かおのない影', lv: 50, hp: 1240, mp: 160, str: 186, def: 130, agi: 84, mag: 196, exp: 1180, gold: 1600,
    race: 'spirit', size: 'l', region: 6,
    resist: { light: 1.5, dark: 0.2, ice: 0.8, poison: 0, sleep: 0.3, confuse: 0.3, blind: 0.4 }, drops: { common: ['magic_water', 10], rare: ['seed_mag', 36] },
    actions: [
      { w: 3, id: 'm_fs_gold', cond: 'notRecent:m_fs_gold' }, { w: 3, id: 'm_fs_grab' }, { w: 1, id: 'attack' },
      // のみこむ（だれも のみこんで いない・動ける 仲間が 2人いじょう。battle-earth.js の fsSwallow）
      { w: 3, id: 'm_fs_swallow', cond: ['c5:fsSwallow', 'notRecent:m_fs_swallow'] },
    ],
    desc: '白いお面をつけた、顔のない影。金色のかけらをばらまいて、近づいた人をのみこんでしまう。さびしいのかもしれない。光がよく効く。たおすと、お金をたくさん落とす。',
  },

  // ── ボス（大地の神殿の いちばん 下）: ノクト（1回目）──
  [NOCTO1]: {
    name: 'ノクト', lv: 50, hp: 50000, mp: 3000, str: 530, def: 170, agi: 96, mag: 372, exp: 18000, gold: 6000,
    race: 'human', size: 'l', boss: true, turns: 2, speed: 0.66, hit: 'slash', drops: { boss: ['nocto_earth_charm'], rare: ['nocto_crest', 5] },
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, light: 1.2, dark: 0.4 },
    // battle-earth.js: clones … かげぶんしんで よぶ 影の 数 / comboMult … ひとりぼっちの合体技（物理 ばい・守り ignoreDef むし）/
    //   rift … 地われに 落ちて いる 回数（その 人の 番）/ stopAt … この HPの わりあいで 戦いを やめる（勝ち）
    nocto1: { clones: 2, stay: true, combo: { mult: 1.2, ignoreDef: 0.3 }, rift: 3, stopAt: 0.5 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_n1_blade' }, { w: 2, id: 'm_n1_dark', cond: 'notRecent:m_n1_dark' },
      // かげぶんしん（影が 2体 そろって いない とき。つづけては しない）
      { w: 4, id: 'm_n1_clones', cond: ['c5:n1Clones', 'notRecent:m_n1_clones'] },
      // 地われ（だれも 落ちて いない・動ける 仲間が 2人いじょう）。合体技の よやくが ある ときは よく ねらう（よやくの 組の 人を 落として、手を ひきはなす）
      { w: 2, id: 'm_n1_rift', cond: ['c5:n1Rift', 'notRecent:m_n1_rift'] },
      { w: 12, id: 'm_n1_rift', cond: ['c5:n1Rift', 'c5:nsBond'] },
      // 合体技の 前ぶれ（m_n1_combo_ready）は 影が 2体 そろって 1回 たつと かならず（battle-earth.js の earthAction）
    ],
    phases: [
      { hpBelow: 0.75, msg: ['ノクトの紋章から、黒いもやがあふれだした…！', 'ノクトの攻撃力が上がった！'], buff: { atk: 1.12 } },
    ],
    desc: '大地の神殿のいちばん下で待っていた、もうひとりの紋章の子。自分の影をよび出して、ひとりきりの合体技を使う。大地をさいて、仲間をひきはなす。',
  },
};

// 数えない 魔物（図鑑・魔物の 数・配合の 一覧に 出ない）: ノクトの 分身（かげぶんしんで 出る。かわしやすい）
//   eva … かいひ（物理が 当たりにくい。呪文・合体技は ふつう）
export const EARTH_HIDDEN = {
  [NOCTO_CLONE]: {
    name: 'ノクトの分身', lv: 49, hp: 2600, mp: 0, str: 300, def: 140, agi: 120, mag: 160, exp: 600, gold: 0,
    race: 'demon', size: 'm', hit: 'slash', noBefriend: true, eva: 0.3,
    resist: { ...BOSS_STATUS, light: 1.3, dark: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_n1c_claw' }],
    desc: 'ノクトがよび出した、ノクトの形をした影。ひらりとかわすが、たおれやすい。',
  },
};
export function addEarthHidden(table) {
  for (const [id, m] of Object.entries(EARTH_HIDDEN)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: m, enumerable: false, configurable: true, writable: true });
  }
}

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）。大地の根（根っこのこびと）・大地の光石（神殿の 魔物）
//   名前の 約束の earth_shard は もう 大事な物（大地の守り星のかけら。data/sky.js）、「大地のかけら」は land_shard（第5章 Step 3・4）なので、
//   2つめの 素材は earth_stone（大地の光石）に した
export const EARTH_MAT_DROPS = {
  [ROOT_SPRITE]: ['earth_root', 2],
  [SKY_GUARD]: ['earth_stone', 4],
  [PILLBUG]: ['earth_stone', 3],
  [FACELESS]: ['earth_root', 5],
};

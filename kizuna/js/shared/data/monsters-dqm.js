// 第45回（ドラクエふう D1。docs/plan-breed-new.md の 7-1 の 2回目）: ドラクエふうの 魔物 11しゅ（配合だけで 生まれる）
//
// ・やせいには いない（breedOnly）。配合（data/companions-dqm.js の レシピ）で 会える
// ・ここの 数字（hp・str など）は 敵と して 出す とき の もの（いつか どこかの 物語で 敵に 出してよい。7-1 の 5）。
//   仲間の 強さは companions-dqm.js の growth で きまる
//   キラーからくりは 敵の ときは 2回行動（turns: 2）。仲間の ときは「キラーれんぎり」（2回こうげきの 技）
// ・絵は client の 魔物の 絵（しゅぞくID で 引く。絵の 係 D2 が かく）
// ・lv は 図鑑の ならびと 敵の 強さの めやす
// monsters.js（MONSTERS）が まぜる。ここは ほかの データを import しない

const mon = (o) => ({ exp: 0, gold: 0, breedOnly: true, ...o });

export const MONSTERS_DQM = {
  // ───── スライム系 ─────
  queen_pururin: mon({
    name: 'ぷるりんクイーン', lv: 30, hp: 360, mp: 90, str: 82, def: 70, agi: 40, mag: 96,
    race: 'slime', size: 'm', hit: 'smash', resist: { sleep: 0.5, confuse: 0.6 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'dq_royal_press' }, { w: 1, id: 'behoimi', cond: 'allyHurt' }, { w: 1, id: 'dq_queen_grace', cond: 'notRecent:dq_queen_grace' }],
    desc: 'キングぷるりんのおきさき。きらきらのかんむりをかぶった、大きなぷるりん。やさしい光で、仲間の傷をいやす。',
  }),
  gold_pururin: mon({
    name: 'ゴールドぷるりん', lv: 28, hp: 260, mp: 60, str: 80, def: 110, agi: 70, mag: 70,
    race: 'slime', size: 's', hit: 'smash', resist: { fire: 0.7, ice: 0.7, bolt: 0.7, poison: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'dq_gold_rain' }, { w: 1, id: 'dq_gold_body', cond: 'notRecent:dq_gold_body' }],
    desc: '体が金でできている、ピカピカのぷるりん。いっしょに旅をすると、戦いのあとでもらえるお金がふえるという。',
  }),
  // ───── 植物系 ─────
  rose_queen: mon({
    name: 'ローズクイーン', lv: 40, hp: 520, mp: 90, str: 130, def: 90, agi: 86, mag: 120,
    race: 'plant', size: 'm', hit: 'slash', resist: { fire: 1.4, ice: 1.2, poison: 0.3, confuse: 0.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'dq_rose_whip' }, { w: 1, id: 'dq_rose_charm', cond: 'notRecent:dq_rose_charm' }, { w: 1, id: 'dq_rose_storm' }],
    desc: '大きな赤いバラの花から生まれた、ばらの女王。うつくしいすがたにみとれていると、いばらのムチがとんでくる。',
  }),
  yggdra_child: mon({
    name: 'せかいじゅの子', lv: 55, hp: 1100, mp: 160, str: 150, def: 170, agi: 60, mag: 180,
    race: 'plant', size: 'l', hit: 'smash', resist: { fire: 1.3, poison: 0.2, sleep: 0.3, light: 0.6 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'og_plant_whip' }, { w: 1, id: 'dq_world_tree', cond: 'notRecent:dq_world_tree' }],
    desc: '世界のまん中に立つという、大きな木の子ども。その葉っぱには、死んだ者も生き返らせる力があるという。',
  }),
  // ───── ゾンビ系 ─────
  lantern_ghost: mon({
    name: 'ランタンゴースト', lv: 32, hp: 320, mp: 80, str: 70, def: 66, agi: 96, mag: 110,
    race: 'undead', size: 'm', flying: true, hit: 'bite', resist: { fire: 0.4, dark: 0.5, light: 1.5, poison: 0 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'dq_lantern' }, { w: 1, id: 'dq_lantern_lure', cond: 'notRecent:dq_lantern_lure' }],
    desc: '古いランタンにすみついたゆうれい。夜の道で、青い火をゆらして旅人をまよわせる。',
  }),
  skeleton_king: mon({
    name: 'がいこつ王', lv: 56, hp: 1150, mp: 120, str: 200, def: 150, agi: 80, mag: 130,
    race: 'undead', size: 'l', hit: 'slash', resist: { dark: 0.3, light: 1.5, poison: 0, sleep: 0.3, paralyze: 0.4 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_darkslash' }, { w: 1, id: 'dq_bone_king', cond: 'notRecent:dq_bone_king' }, { w: 1, id: 'chikaratame', cond: 'notRecent:chikaratame' }],
    desc: 'ほねの国の王さま。ぼろぼろのマントと、金のかんむり。ひと声で、地面からほねの兵たちがおき上がる。',
  }),
  // ───── せいれい系 ─────
  koyomi_spirit: mon({
    name: 'こよみのせいれい', lv: 56, hp: 980, mp: 200, str: 120, def: 120, agi: 110, mag: 200,
    race: 'spirit', size: 'm', flying: true, hit: 'magic', resist: { fire: 0.7, ice: 0.7, wind: 0.7, light: 0.7, sleep: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'dq_winter_snow' }, { w: 1, id: 'dq_seasons', cond: 'notRecent:dq_seasons' }, { w: 1, id: 'dq_spring_breeze', cond: 'allyHurt' }],
    desc: '春・夏・秋・冬をめぐらせる、こよみのせいれい。手にした本をめくるたびに、まわりの季節がかわる。',
  }),
  // ───── 物質系 ─────
  killer_karakuri: mon({
    name: 'キラーからくり', lv: 42, hp: 560, mp: 40, str: 160, def: 140, agi: 90, mag: 20, turns: 2,
    race: 'material', size: 'm', hit: 'slash', resist: { bolt: 1.4, poison: 0, sleep: 0, confuse: 0.3, ice: 0.8 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'dq_killer_slash' }, { w: 1, id: 'dq_killer_arrow' }],
    desc: '古い王国が作った、戦いのためのからくり兵。4本の足で走り、剣と弓で、1回に2度こうげきしてくる。',
  }),
  hitokui_box: mon({
    name: 'ひとくい箱', lv: 34, hp: 380, mp: 40, str: 130, def: 100, agi: 70, mag: 40,
    race: 'material', size: 'm', hit: 'bite', resist: { poison: 0, sleep: 0.5, bolt: 1.2 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'dq_chomp' }, { w: 1, id: 'm_pot_suck' }],
    desc: '宝箱のふりをして、旅人を待ちぶせる魔物。ばけばこよりずっと大きな口で、会心のかみつきをねらってくる。',
  }),
  // ───── 悪魔系 ─────
  petit_devil: mon({
    name: 'プチデビ', lv: 22, hp: 170, mp: 50, str: 60, def: 44, agi: 80, mag: 60,
    race: 'demon', size: 's', flying: true, hit: 'slash', resist: { dark: 0.6, light: 1.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'dq_petit_fork' }, { w: 1, id: 'dq_petit_trick', cond: 'notRecent:dq_petit_trick' }, { w: 1, id: 'merami' }],
    desc: '小さな黒いつばさの、いたずら好きな悪魔の子ども。フォークを持って、ちょこまかとびまわる。',
  }),
  // ───── ドラゴン系 ─────
  ryuou_grandson: mon({
    name: '竜王のまご', lv: 58, hp: 1050, mp: 180, str: 170, def: 140, agi: 100, mag: 180,
    race: 'dragon', size: 'm', hit: 'magic', resist: { fire: 0.4, dark: 0.5, ice: 0.8, sleep: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'dq_dark_breath' }, { w: 1, id: 'dq_dragon_lord', cond: 'notRecent:dq_dragon_lord' }],
    desc: '大むかしの竜王の、まご。まだ小さいが、おこると大きな竜のすがたにかわり、ものすごい炎をはく。',
  }),
};

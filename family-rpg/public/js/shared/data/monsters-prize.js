// 第50回 D3: 景品で しか 会えない めずらしい 魔物 6しゅ（よびぶえ。data/items-prize-r50.js の prizeMonster）
//
// ・やせいには いない・配合でも 生まれない（rate 0・breedOnly・recipeOnly）。景品の よびぶえを 使うと 仲間に なる
//   コインうさぎ・ルーレットぷるりん・ジョーカーデビル・ゴールドドラゴン … カジノの 景品
//   メダルキング … メダル王の ごほうび（80枚）／星くずペガサス … 星のかけらと こうかん
// ・配合の 親には なれる（ふつうの 仲間と おなじ。同じ しゅぞく 2ひきの 新生配合も できる）
// ・絵は 今の 魔物の 絵（art）に 色の かえかた（tint。client/render/monsters.js の artOf）。絵の 手間を かけない
// ・ランクは 手で きめる（rank）: コインうさぎ C・ルーレットぷるりん B・ジョーカーデビル B・メダルキング A・星くずペガサス A・ゴールドドラゴン S
//   強さ（Lv60・＋10）は DQ ふうの 魔物と おなじ ものさし。ゴールドドラゴンは S の まん中より 少し 下（S の まん中は 人の 1.1倍まで。
//   test/monsters-r43a.test.js）。かわりに レベルの 上限が 高く（S）、パーティーに いると お金が ふえる
// ・技は 今 ある 技だけ
// monsters.js（MONSTERS）・companions.js（MONSTER_FRIENDS）が まぜる。ここは ほかの データを import しない

const mon = (o) => ({ exp: 0, gold: 0, breedOnly: true, prize: true, ...o });

export const MONSTERS_PRIZE = {
  coin_rabbit: mon({
    name: 'コインうさぎ', lv: 12, hp: 90, mp: 20, str: 40, def: 34, agi: 60, mag: 24,
    race: 'beast', size: 's', hit: 'bite', art: 'tsunousagi', tint: { hueTo: 46, sat: 1.4, light: 1.15 },
    resist: { sleep: 0.7, paralyze: 0.7 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_pounce' }, { w: 1, id: 'dq_gold_body', cond: 'notRecent:dq_gold_body' }],
    desc: 'ツノが金色のコインになったうさぎ。ぴょんとはねるたびに、チャリンと音がする。',
  }),
  roulette_slime: mon({
    name: 'ルーレットぷるりん', lv: 20, hp: 200, mp: 50, str: 60, def: 70, agi: 70, mag: 60,
    race: 'slime', size: 's', hit: 'smash', art: 'kirakira', tint: { hueTo: 345, sat: 1.35, light: 1.0 },
    resist: { fire: 0.8, ice: 0.8, bolt: 0.8, sleep: 0.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_jelly_spin' }, { w: 1, id: 'hoimi', cond: 'allyHurt' }],
    desc: '体の中で、赤と黒のもようがくるくる回るぷるりん。止まったところで、気分がかわる。',
  }),
  joker_devil: mon({
    name: 'ジョーカーデビル', lv: 28, hp: 280, mp: 80, str: 80, def: 64, agi: 96, mag: 100,
    race: 'demon', size: 'm', flying: true, hit: 'magic', art: 'koakuma', tint: { hueTo: 285, sat: 1.25, light: 1.05 },
    resist: { dark: 0.5, light: 1.3, confuse: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'merami' }, { w: 1, id: 'manusa', cond: 'notRecent:manusa' }, { w: 1, id: 'm_dark_bolt' }],
    desc: 'トランプのジョーカーからぬけ出したこあくま。いたずらが大好きで、すぐに姿をかえる。',
  }),
  medal_king: mon({
    name: 'メダルキング', lv: 40, hp: 520, mp: 90, str: 110, def: 130, agi: 60, mag: 100,
    race: 'slime', size: 'm', hit: 'smash', art: 'king_pururin', tint: { hueTo: 48, sat: 1.35, light: 1.12 },
    resist: { fire: 0.7, ice: 0.7, bolt: 0.7, sleep: 0.4, poison: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'dq_royal_press' }, { w: 1, id: 'behoimi', cond: 'allyHurt' }, { w: 1, id: 'dq_gold_body', cond: 'notRecent:dq_gold_body' }],
    desc: '小さなメダルをたくさんあびて、金色になったキングぷるりん。かんむりにはメダルがはまっている。',
  }),
  star_pegasus: mon({
    name: '星くずペガサス', lv: 42, hp: 540, mp: 110, str: 120, def: 90, agi: 130, mag: 120,
    race: 'beast', size: 'l', flying: true, hit: 'bite', art: 'pegasus', tint: { hueTo: 215, sat: 0.95, light: 0.98 },
    resist: { light: 0.5, dark: 1.2, wind: 0.7, sleep: 0.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_star_dust' }, { w: 1, id: 'behoimi', cond: 'allyHurt' }, { w: 1, id: 'm_dive' }],
    desc: '星のかけらの光から生まれた、青いペガサス。つばさをはばたかせると、星くずがまう。',
  }),
  gold_dragon: mon({
    name: 'ゴールドドラゴン', lv: 58, hp: 1200, mp: 160, str: 210, def: 160, agi: 90, mag: 140,
    race: 'dragon', size: 'l', hit: 'bite', art: 'great_dragon', tint: { hueTo: 44, sat: 1.35, light: 1.15 },
    resist: { fire: 0.3, ice: 1.1, bolt: 0.7, sleep: 0.3, poison: 0.4, confuse: 0.3, paralyze: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_blaze' }, { w: 1, id: 'm_dragon_claw' }, { w: 1, id: 'dq_gold_rain', cond: 'notRecent:dq_gold_rain' }],
    desc: '全身が金色のうろこでおおわれた竜。カジノのいちばんおくで、大当たりをずっと見守ってきた。',
  }),
};

// ───────────── 仲間に なった とき ─────────────
// hint … 図鑑・酒場の うわさの「会い方」（data/companions.js の recipeHint）
const P = (o) => ({ rate: 0, breedOnly: true, recipeOnly: true, ...o });
const CASINO_HINT = 'カジノの景品のよびぶえでしか会えない';
export const FRIENDS_PRIZE = {
  coin_rabbit: P({
    rank: 'C', hint: CASINO_HINT, names: ['コイン', 'チャリン', 'ぴょんきち', 'きんうさ'],
    growth: { hp: 0.95, mp: 0.9, str: 1.0, def: 0.95, agi: 1.35, mag: 0.8, heal: 0.85 },
    learn: [[1, 'm_tackle'], [3, 'm_pounce'], [7, 'sukara'], [12, 'dq_gold_body'], [18, 'piorimu'], [25, 'm_dive'], [32, 'dq_gold_rain']],
    passive: { gold: 1.15 },
    note: 'ツノがコインのうさぎ。パーティーにいると、戦いのあとのお金が少しふえる。',
  }),
  roulette_slime: P({
    rank: 'B', hint: CASINO_HINT, names: ['ルーレ', 'くるくる', 'ぷるルン', 'セブン'],
    growth: { hp: 1.1, mp: 1.0, str: 0.95, def: 1.1, agi: 1.05, mag: 1.0, heal: 1.0 },
    learn: [[1, 'm_tackle'], [3, 'hoimi'], [7, 'm_harden'], [11, 'm_jelly_spin'], [16, 'behoimi'], [22, 'baikiruto'], [28, 'dq_gold_rain'], [34, 'behomara']],
    crit: 0.04,
    note: '赤と黒のもようが回るぷるりん。会心が出やすく、回復の呪文も覚える。',
  }),
  joker_devil: P({
    rank: 'B', hint: CASINO_HINT, names: ['ジョーカー', 'ピエロ', 'トランプ', 'ジョジョ'],
    growth: { hp: 0.95, mp: 1.15, str: 0.9, def: 0.85, agi: 1.25, mag: 1.3, heal: 0.75 },
    learn: [[1, 'mera'], [3, 'manusa'], [7, 'gira'], [11, 'merami'], [15, 'rukani'], [20, 'm_dark_bolt'], [26, 'begirama'], [32, 'dq_rose_charm']],
    note: 'ジョーカーのこあくま。呪文が得意で、敵をまどわす技を覚える。',
  }),
  medal_king: P({
    rank: 'A', hint: 'メダル王のごほうびのよびぶえでしか会えない', names: ['メダル', 'キンキング', 'メダまる', 'ぷるおう'],
    growth: { hp: 1.3, mp: 1.0, str: 1.1, def: 1.3, agi: 0.85, mag: 1.0, heal: 1.1 },
    learn: [[1, 'm_tackle'], [3, 'hoimi'], [7, 'dq_gold_body'], [12, 'behoimi'], [17, 'dq_royal_press'], [23, 'kabau'], [29, 'dq_queen_grace'], [36, 'gd_wall']],
    // かんむりが あるので 頭は なし
    gear: { head: false },
    note: '金色のキングぷるりん。体がとてもかたく、仲間を守り、いやす。',
  }),
  star_pegasus: P({
    rank: 'A', hint: '星のかけらのこうかんのよびぶえでしか会えない', names: ['スターダスト', 'ほしかぜ', 'ペガ', 'ルミエ'],
    growth: { hp: 1.1, mp: 1.1, str: 1.1, def: 0.95, agi: 1.35, mag: 1.15, heal: 1.1 },
    learn: [[1, 'm_bite'], [3, 'hoimi'], [7, 'm_dive'], [12, 'piorimu'], [17, 'm_star_dust'], [22, 'behoimi'], [28, 'bagima'], [35, 'behomara']],
    note: '星くずのペガサス。とても素早く、星の光の技と回復の呪文を覚える。',
  }),
  gold_dragon: P({
    rank: 'S', hint: CASINO_HINT, names: ['ゴルド', 'キンリュウ', 'ジャックポ', 'オーロ'],
    growth: { hp: 1.4, mp: 0.95, str: 1.4, def: 1.25, agi: 0.95, mag: 1.05, heal: 0.7 },
    learn: [[1, 'm_bite'], [3, 'm_fire_breath'], [7, 'm_dragon_claw'], [12, 'm_blaze'], [17, 'm_dragon_roar'], [22, 'dq_gold_rain'], [28, 'dk_ikari'], [35, 'm_jade_flare']],
    passive: { gold: 1.2 },
    note: '金色の竜。とても強く、パーティーにいると戦いのあとのお金がふえる。',
  }),
};

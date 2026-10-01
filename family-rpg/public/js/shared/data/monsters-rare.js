// めずらしい 強い 魔物（仲間に したくなる カッコいい 魔物）
//   ぷるりん騎士 … ぷるりんに またがった 小さな 騎士（東の平原・昼）
//   からくり騎士 … むかしの 人が 作った からくりの 騎士（海鳴りの洞窟）
//   アックスライダー … 小さな 竜に のって オノを ふるう 騎兵（嵐の島の まわり・嵐の塔）
//   いかずちタイガー … いなずまの もようの 白い 虎（夜の 島）
//   ヴァルドラゴン … 大きな 竜（嵐の塔）
//
// monsters.js（MONSTERS）・companions.js（MONSTER_FRIENDS）・abilities.js（ABILITIES）・items.js（ITEMS）が まぜる。
// ここは ほかの データを import しない（じゅんかんを さける）
// 出る 場所: encounters.js / encounters-ch2.js / night.js の 出現表（どれも w: 1 の めずらしい 組み合わせ）
// 配合でも 生まれる（companions.js の BREED_RECIPES）。え は client/render/rare-art.js
// hit: てきとして ふつうの 攻撃を した ときの みため（render/enemyfx.js の hitStyle。書かなければ 種族で きまる）

export const MONSTERS_RARE = {
  pururin_knight: {
    name: 'ぷるりん騎士', lv: 10, hp: 74, mp: 16, str: 41, def: 31, agi: 20, mag: 16, exp: 52, gold: 44,
    race: 'slime', size: 'm', hit: 'slash',
    resist: { bolt: 1.2, fire: 0.8, sleep: 0.5 },
    drops: { common: ['jelly', 3], rare: ['stardust_sword', 64] },
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_bounce_slash' }, { w: 1, id: 'hoimi', cond: 'allyHurt' }],
    desc: 'ぷるりんにまたがった小さな騎士。ぷるりんと息を合わせ、はずむように切りかかってくる。',
  },
  clockwork_knight: {
    name: 'からくり騎士', lv: 15, hp: 150, str: 56, def: 54, agi: 22, mag: 20, exp: 92, gold: 64,
    race: 'material', size: 'm', hit: 'slash',
    resist: { bolt: 1.5, fire: 0.8, ice: 0.8, poison: 0, sleep: 0, confuse: 0.3, paralyze: 0.5 },
    drops: { common: ['iron_shard', 4], rare: ['thunder_sword', 64] },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_twin_slash' },
      { w: 1, id: 'm_clock_beam', cond: 'notRecent:m_clock_beam' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' },
    ],
    desc: '昔の人が作った、からくりの騎士。今も洞窟のおくを守り続けている。目から光を放つ。雷に弱い。',
  },
  axe_rider: {
    name: 'アックスライダー', lv: 16, hp: 142, mp: 20, str: 59, def: 40, agi: 32, mag: 20, exp: 94, gold: 66,
    race: 'dragon', size: 'l', flying: true, hit: 'slash',
    resist: { fire: 0.6, wind: 0.8, ice: 1.3, sleep: 0.5 },
    drops: { common: ['moonherb', 8], rare: ['dragon_axe', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_dragon_dive' }, { w: 1, id: 'm_fire_breath' }, { w: 1, id: 'kabutowari' }],
    desc: '小さな竜にまたがり、大きなオノをふるう竜の騎兵。空高くまい上がり、急降下してくる。',
  },
  ikazuchi_tiger: {
    name: 'いかずちタイガー', lv: 15, hp: 132, mp: 20, str: 58, def: 33, agi: 46, mag: 24, exp: 90, gold: 54,
    race: 'beast', size: 'l', night: true, hit: 'bite',
    resist: { bolt: 0.2, wind: 0.8, ice: 1.3, paralyze: 0.3 },
    drops: { common: ['herb', 6], rare: ['seed_agi', 32] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_thunder_fang' }, { w: 1, id: 'm_thunder' }, { w: 1, id: 'm_pounce' }],
    desc: 'いなずまのもようの、白く大きな虎。夜の島にあらわれ、雷のような速さで飛びかかる。',
  },
  great_dragon: {
    name: 'ヴァルドラゴン', lv: 19, hp: 320, mp: 60, str: 70, def: 52, agi: 26, mag: 44, exp: 190, gold: 150,
    race: 'dragon', size: 'l',
    resist: { fire: 0.3, ice: 1.2, bolt: 0.8, wind: 0.8, sleep: 0.3, poison: 0.5, confuse: 0.3, paralyze: 0.3 },
    drops: { common: ['dragon_scale', 4], rare: ['dragon_eye', 64] },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_blaze' }, { w: 1, id: 'm_dragon_claw' },
      { w: 1, id: 'm_dragon_roar', cond: 'notRecent:m_dragon_roar' },
    ],
    desc: '空にとどくほど大きな、ひすい色の竜。固いうろこはどんな剣も通さず、はく炎は全てを焼きつくす。',
  },
};

// ───────────── 仲間に なった とき ─────────────
// gear: 装備できる 物（companions.js の RACE_GEAR を うわがき）
export const FRIENDS_RARE = {
  pururin_knight: {
    rate: 1 / 24, names: ['ランス', 'ナイトン', 'ぷるきし', 'アーサ'],
    growth: { hp: 1.1, mp: 0.95, str: 1.15, def: 1.2, agi: 1.05, mag: 0.85, heal: 1.1 },
    learn: [[1, 'm_bounce_slash'], [3, 'hoimi'], [6, 'sukara'], [9, 'daichi'], [12, 'behoimi'], [16, 'm_jelly_spin'], [20, 'pl_grandcross'], [25, 'sg_behoma'], [30, 'pl_judgment']],
    gear: { weapons: ['sword', 'spear', 'dagger'], armor: ['cloth', 'heavy'], shield: true, head: 'helm' },
    note: 'ぷるりんにまたがった小さな騎士。剣・たて・かぶと・重いよろいを装備でき、回復の呪文も覚える。剣を持つと大地斬が使える。',
  },
  clockwork_knight: {
    rate: 1 / 32, names: ['カラクリ', 'ギアン', 'ゼンマイ', 'メカまる'],
    growth: { hp: 1.15, mp: 0.55, str: 1.3, def: 1.35, agi: 0.95, mag: 0.7, heal: 0.4 },
    learn: [[1, 'm_twin_slash'], [4, 'm_harden'], [8, 'kabau'], [12, 'tsurugimai'], [16, 'm_clock_beam'], [21, 'gd_wall'], [26, 'm_full_beam']],
    gear: { weapons: ['sword', 'axe', 'spear'], armor: ['cloth', 'heavy'], shield: true, head: 'helm' },
    note: 'からくりの騎士。2回続けて切りつけ、目から光を放つ。剣・たて・かぶとを装備できる。剣を持つとつるぎのまいが使える。',
  },
  axe_rider: {
    rate: 1 / 32, names: ['ドラグ', 'ワイバン', 'アクセル', 'ガルム'],
    growth: { hp: 1.2, mp: 0.6, str: 1.38, def: 1.15, agi: 1.1, mag: 0.6, heal: 0.5 },
    learn: [[1, 'm_dive'], [4, 'm_fire_breath'], [8, 'kabutowari'], [12, 'm_warcry'], [16, 'm_dragon_dive'], [21, 'm_blaze'], [26, 'bm_hakai']],
    gear: { weapons: ['axe', 'spear', 'sword'], armor: ['cloth', 'heavy'], shield: true, head: 'helm' },
    note: '小さな竜にまたがる騎兵。オノ・やり・たて・かぶと・重いよろいを装備できる。オノを持つとかぶと割りが使える。',
  },
  ikazuchi_tiger: {
    rate: 1 / 32, names: ['ライガ', 'シロガネ', 'イナズマ', 'トラまる'],
    growth: { hp: 1.15, mp: 0.6, str: 1.35, def: 1.0, agi: 1.5, mag: 0.8, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm_pounce'], [8, 'm_thunder'], [12, 'mouko'], [16, 'm_thunder_fang'], [21, 'gh_ikazuchi'], [27, 'mk_raiden']],
    gear: { weapons: ['claw'], armor: ['cloth', 'gi'], shield: false, head: 'helm' },
    note: 'いなずまのような白い虎。とても素早く、雷の技を覚える。ツメ・服・道着・かぶとを装備できる。',
  },
  great_dragon: {
    rate: 1 / 48, names: ['ヴァル', 'エメル', 'ジェイド', 'ガイア'],
    growth: { hp: 1.45, mp: 0.9, str: 1.4, def: 1.3, agi: 0.85, mag: 1.0, heal: 0.6 },
    learn: [[1, 'm_bite'], [3, 'm_fire_breath'], [7, 'm_dragon_claw'], [11, 'm_blaze'], [15, 'm_dragon_roar'], [20, 'dk_ikari'], [26, 'm_jade_flare']],
    note: 'とても大きな竜。なかなか仲間にならないが、配合でも生まれる。ツメ・よろい・かぶとを装備できる。',
  },
};

// ───────────── 技 ─────────────
export const RARE_ABILITIES = {
  m_bounce_slash: {
    name: 'ぷるりん斬り', kana: 'ぷるりんぎり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}はぷるりんといっしょにはずんで、いきおいよく切りかかった！', anim: 'slash_fast',
    desc: 'ぷるりんの力ではずんで、いきおいよく切りつける。',
  },
  m_jelly_spin: {
    name: 'ぷるりん大回転', kana: 'ぷるりんだいかいてん', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.85 }, cast: '{a}はぷるりんの上でくるくる回り、周りの敵をなぎはらった！', anim: 'slash_multi',
    desc: 'ぷるりんの上で回転して、敵みんなを切りつける。',
  },
  m_twin_slash: {
    name: '二段斬り', kana: 'にだんぎり', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 2 }, cast: '{a}のからくりのうでがうなった！二段斬り！', anim: 'cross_slash',
    desc: '目にも止まらぬ速さで、2回続けて切りつける。',
  },
  m_clock_beam: {
    name: 'からくりビーム', kana: 'からくりびーむ', kind: 'monster', mp: 8, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [58, 74], thr: 99 }, cast: '{a}の目がまぶしく光った！からくりビーム！', anim: 'dragon_beam',
    desc: '目から光の線を放ち、敵1体に大ダメージ。',
  },
  m_full_beam: {
    name: 'フルパワービーム', kana: 'ふるぱわーびーむ', kind: 'monster', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [75, 95], thr: 99 }, cast: '{a}の体中の歯車が回り出した…！フルパワービーム！', anim: 'dragon_beam',
    desc: 'ありったけの力で光を放ち、敵みんなに大ダメージ。',
  },
  m_dragon_dive: {
    name: 'ドラゴンダイブ', kana: 'どらごんだいぶ', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, acc: 0.9 }, cast: '{a}は竜と共に空高くまい上がり、急降下してオノをふり下ろした！', anim: 'gigabreak',
    desc: '空高くまい上がり、急降下して大きな一撃。少し外れやすい。',
  },
  m_thunder_fang: {
    name: 'いかずちのキバ', kana: 'いかずちのきば', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, element: 'bolt', status: { status: 'paralyze', chance: 0.15, turns: [1, 2] } },
    cast: '{a}はいかずちをまとったキバでかみついた！', anim: 'bolt2',
    desc: 'いかずちをまとったキバでかみつく。マヒさせることがある。',
  },
  m_dragon_roar: {
    name: '大竜のほえ声', kana: 'だいりゅうのほえごえ', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, dur: 25 }, cast: '{a}は大地をゆるがすほえ声を上げた！', anim: 'warcry',
    desc: '大きなほえ声で、敵みんなの攻撃力を下げる。',
  },
  m_jade_flare: {
    name: 'エメラルドフレア', kana: 'えめらるどふれあ', kind: 'monster', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [85, 105], thr: 30, breath: true }, cast: '{a}はひすい色にかがやく炎をはいた！エメラルドフレア！', anim: 'fire_wave',
    desc: 'ひすい色にかがやく炎で、敵みんなを焼きつくす。',
  },
};

// ───────────── 落とす 物 ─────────────
export const RARE_ITEMS = {
  dragon_axe: {
    name: '竜のオノ', type: 'weapon', rank: 5, star: true, cat: 'axe', atk: 48, bonus: { agi: -3 }, price: 0, sell: 1600,
    desc: 'アックスライダーがごくまれに落とす、竜のうろこを打ちこんだ大きなオノ。とても重いが、威力はばつぐん。',
  },
  dragon_eye: {
    name: '竜のひとみ', type: 'acc', rank: 5, star: true, bonus: { str: 5, def: 5, mag: 5 }, resist: { fire: 0.8 }, price: 0, sell: 1200,
    desc: 'ヴァルドラゴンがごくまれに落とす、ひすい色の宝石。力・身の守り・魔力が上がり、炎に少し強くなる。',
  },
};

// 道具の 読みがな（あいうえお順）
export const RARE_ITEM_KANA = {
  dragon_axe: 'りゅうのおの', dragon_eye: 'りゅうのひとみ',
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）
export const RARE_MAT_DROPS = {
  pururin_knight: ['iron_shard', 5],
  clockwork_knight: ['silver_shard', 5],
  axe_rider: ['dragon_scale', 6],
  ikazuchi_tiger: ['beast_fang', 3],
};

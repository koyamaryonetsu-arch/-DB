// モンスターの データ
// str: こうげき力 / def: しゅび力 / agi: すばやさ / mag: まりょく
// resist: 属性や 状態異常の ききやすさ（1=ふつう 0=きかない 1.5=よわい）
// actions: [{w:重み, id:技ID or 'attack', cond:じょうけん}]
// turns: 1回の じゅんばんで こうどうする 回数（ボス用）
// race: slime beast plant spirit undead material demon

const ROCK_RESIST = { fire: 0.5, ice: 0.7, wind: 0.6, blast: 1.5, poison: 0, sleep: 0, confuse: 0.3, paralyze: 0.2 };
const METAL_RESIST = { fire: 0, ice: 0, wind: 0, blast: 0, bolt: 0, light: 0, dark: 0, void: 0.5, sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0, debuff: 0 };

import { MONSTERS_CH2 } from './monsters-ch2.js';

export const MONSTERS = {
  pururin: {
    name: 'ぷるりん', lv: 1, hp: 8, mp: 0, str: 9, def: 4, agi: 5, mag: 0, exp: 2, gold: 3,
    race: 'slime', size: 's', drops: [{ item: 'jelly', rate: 0.25 }, { item: 'herb', rate: 0.06 }],
    actions: [{ w: 1, id: 'attack' }],
    desc: 'ぷるぷるふるえる青いゼリーの魔物。いたずら好きだが弱い。',
  },
  tsunousagi: {
    name: 'ツノうさぎ', lv: 2, hp: 12, str: 12, def: 5, agi: 12, exp: 3, gold: 4,
    race: 'beast', size: 's', drops: [{ item: 'herb', rate: 0.1 }],
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_horn' }],
    desc: 'ひたいのツノでつっこんでくるうさぎ。',
  },
  kobushi: {
    name: 'こぶしキノコ', lv: 2, hp: 14, str: 11, def: 7, agi: 4, exp: 4, gold: 5,
    race: 'plant', size: 's', resist: { fire: 1.5 }, drops: [{ item: 'herb', rate: 0.12 }, { item: 'antidote', rate: 0.05 }],
    actions: [{ w: 4, id: 'attack' }, { w: 1, id: 'm_sleep_powder' }],
    desc: '小さなこぶしでなぐってくるキノコ。ねむりの粉に注意。',
  },
  koumorin: {
    name: 'こうもりん', lv: 3, hp: 14, str: 17, def: 6, agi: 16, exp: 5, gold: 5,
    race: 'beast', size: 's', flying: true, resist: { wind: 1.5 }, drops: [{ item: 'herb', rate: 0.1 }],
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_drain' }],
    desc: 'ひらひら飛び回るこうもり。血を吸って元気になる。',
  },
  goblin: {
    name: 'いたずらゴブリン', lv: 4, hp: 25, str: 21, def: 9, agi: 10, exp: 8, gold: 12,
    race: 'demon', size: 'm', drops: [{ item: 'herb', rate: 0.15 }, { item: 'bronze_knife', rate: 0.03 }],
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_rock_throw' }],
    desc: '石を投げてくるいたずら者。',
  },
  pururin_beth: {
    name: 'ぷるりんベス', lv: 4, hp: 20, mp: 12, str: 16, def: 8, agi: 8, mag: 12, exp: 7, gold: 8,
    race: 'slime', size: 's', resist: { fire: 0.5, ice: 1.5 }, drops: [{ item: 'jelly', rate: 0.3 }],
    actions: [{ w: 2, id: 'attack' }, { w: 1, id: 'mera' }],
    desc: '赤いぷるりん。メラを使う。',
  },
  shadow_soldier: {
    name: '影の兵', lv: 3, hp: 18, str: 15, def: 8, agi: 9, exp: 10, gold: 0,
    race: 'demon', size: 'm', resist: { dark: 0.5, light: 1.5 },
    actions: [{ w: 1, id: 'attack' }],
    desc: '闇の魔道士が呼び出した影の兵士。',
  },
  frog: {
    name: 'どくどくガエル', lv: 5, hp: 30, str: 25, def: 12, agi: 11, exp: 11, gold: 9,
    race: 'beast', size: 's', resist: { poison: 0, ice: 1.3 }, drops: [{ item: 'antidote', rate: 0.2 }],
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_poison_lick' }],
    desc: '毒の舌を持つカエル。毒消し草を忘れずに。',
  },
  nemuri: {
    name: 'ねむりキノコ', lv: 5, hp: 32, str: 22, def: 14, agi: 6, exp: 10, gold: 8,
    race: 'plant', size: 's', resist: { fire: 1.5, sleep: 0 }, drops: [{ item: 'moonherb', rate: 0.08 }],
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_sweet_breath' }],
    desc: 'あまい息でみんなをねむらせるキノコ。',
  },
  wolf: {
    name: 'はぐれウルフ', lv: 6, hp: 34, str: 28, def: 12, agi: 22, exp: 14, gold: 12,
    race: 'beast', size: 'm', drops: [{ item: 'herb', rate: 0.15 }, { item: 'seed_agi', rate: 0.01 }],
    actions: [{ w: 6, id: 'attack' }, { w: 1, id: 'm_howl', cond: 'callHelp' }],
    desc: '群れからはぐれたオオカミ。素早く、仲間を呼ぶ。',
  },
  lamp: {
    name: 'ランプの精', lv: 6, hp: 26, mp: 24, str: 18, def: 10, agi: 14, mag: 18, exp: 13, gold: 16,
    race: 'spirit', size: 's', resist: { fire: 0.3, ice: 1.5 }, drops: [{ item: 'magic_water', rate: 0.03 }],
    actions: [{ w: 2, id: 'mera' }, { w: 1, id: 'gira' }, { w: 1, id: 'attack' }],
    desc: '古いランプに宿った炎のせいれい。',
  },
  hedoron: {
    name: 'ヘドロン', lv: 6, hp: 38, str: 25, def: 16, agi: 7, exp: 13, gold: 10,
    race: 'slime', size: 'm', resist: { poison: 0, fire: 1.2 }, drops: [{ item: 'antidote', rate: 0.2 }],
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_poison_spray' }],
    desc: '沼に住むどろどろの魔物。毒をまき散らす。',
  },
  armor_crab: {
    name: 'よろいガニ', lv: 7, hp: 38, str: 32, def: 34, agi: 9, exp: 18, gold: 16,
    race: 'beast', size: 'm', resist: { fire: 1.5, ice: 0.5, bolt: 1.5 }, drops: [{ item: 'scale_shield', rate: 0.03 }],
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_pinch' }, { w: 1, id: 'm_harden' }],
    desc: '固いこうらのカニ。呪文やかぶと割りが効き目あり。',
  },
  ice_pururin: {
    name: 'ヒャドぷるりん', lv: 7, hp: 32, mp: 30, str: 24, def: 16, agi: 13, mag: 22, exp: 16, gold: 12,
    race: 'slime', size: 's', resist: { ice: 0, fire: 1.5 }, drops: [{ item: 'jelly', rate: 0.3 }],
    actions: [{ w: 2, id: 'hyado' }, { w: 2, id: 'attack' }],
    desc: '冷たい体のぷるりん。ヒャドを使う。',
  },
  crow: {
    name: '大ガラス', lv: 7, hp: 34, str: 32, def: 14, agi: 24, exp: 17, gold: 14,
    race: 'beast', size: 'm', flying: true, resist: { wind: 1.5 }, drops: [{ item: 'herb', rate: 0.2 }],
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_peck' }, { w: 1, id: 'm_gust' }],
    desc: '東の平原を飛び回る大きなカラス。',
  },
  skeleton: {
    name: 'がいこつ剣士', lv: 8, hp: 46, str: 38, def: 22, agi: 14, exp: 24, gold: 20,
    race: 'undead', size: 'm', resist: { fire: 1.5, light: 2, poison: 0, sleep: 0 }, drops: [{ item: 'bronze_sword', rate: 0.05 }],
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_swing' }],
    desc: '洞窟をさまようがいこつの剣士。空裂斬がよく効く。',
  },
  dark_bat: {
    name: '闇コウモリ', lv: 8, hp: 36, str: 34, def: 16, agi: 26, exp: 22, gold: 16,
    race: 'beast', size: 's', flying: true, resist: { dark: 0.5, light: 1.5 }, drops: [{ item: 'herb', rate: 0.2 }],
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_drain' }, { w: 1, id: 'manusa' }],
    desc: '暗闇に住むこうもり。マヌーサでまどわせてくる。',
  },
  rockman: {
    name: '岩男', lv: 9, hp: 66, str: 44, def: 36, agi: 5, exp: 30, gold: 18,
    race: 'material', size: 'l', resist: ROCK_RESIST, drops: [{ item: 'seed_def', rate: 0.04 }],
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_boulder' }, { w: 1, id: 'm_harden' }],
    desc: '岩が動き出した魔物。爆発に弱い。',
  },
  shadow_mage: {
    name: '影の魔道士', lv: 9, hp: 44, mp: 60, str: 28, def: 18, agi: 16, mag: 30, exp: 28, gold: 30,
    race: 'demon', size: 'm', resist: { dark: 0.5, light: 1.5 }, drops: [{ item: 'magic_water', rate: 0.08 }, { item: 'wizard_robe', rate: 0.02 }],
    actions: [{ w: 2, id: 'gira' }, { w: 2, id: 'hoimi', cond: 'allyHurt' }, { w: 1, id: 'rukani' }, { w: 1, id: 'attack' }],
    desc: 'ザルバに仕える影の魔法使い。仲間を回復する。',
  },
  rock_shard: {
    name: '岩のかけら', lv: 8, hp: 34, str: 40, def: 30, agi: 12, exp: 0, gold: 0,
    race: 'material', size: 's', resist: ROCK_RESIST,
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_boulder' }],
    desc: 'ゴルドーンの体からはがれた岩。',
  },
  kirakira: {
    name: 'きらきらぷるりん', lv: 8, hp: 4, mp: 10, str: 15, def: 255, agi: 80, mag: 10, exp: 320, gold: 12,
    race: 'slime', size: 's', metal: true, resist: METAL_RESIST, drops: [{ item: 'seed_agi', rate: 0.12 }],
    actions: [{ w: 3, id: 'm_flee' }, { w: 2, id: 'attack' }, { w: 1, id: 'mera' }],
    desc: 'めったに会えない銀色のぷるりん。とても固く、すぐ逃げる。倒せばたくさんの経験値！',
  },

  // ───── はいごうで うまれる まもの（やせいには いない） ─────
  king_pururin: {
    name: 'キングぷるりん', lv: 18, hp: 220, mp: 40, str: 60, def: 50, agi: 22, mag: 40, exp: 0, gold: 0, breedOnly: true,
    race: 'slime', size: 'l', resist: { fire: 0.8, ice: 0.8 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_king_press' }],
    desc: 'ぷるりんたちの王さま。大きな体でのしかかる。',
  },
  fuwari: {
    name: 'ふわりん', lv: 12, hp: 90, mp: 60, str: 35, def: 30, agi: 38, mag: 40, exp: 0, gold: 0, breedOnly: true,
    race: 'slime', size: 's', flying: true,
    actions: [{ w: 2, id: 'attack' }, { w: 1, id: 'hoimi' }],
    desc: 'ふわふわういているクラゲのようなぷるりん。回復が得意。',
  },
  chibi_dragon: {
    name: 'ちびドラゴン', lv: 15, hp: 150, mp: 30, str: 58, def: 45, agi: 36, mag: 30, exp: 0, gold: 0, breedOnly: true,
    race: 'dragon', size: 'm', resist: { fire: 0.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_fire_breath' }],
    desc: '炎をはく小さなドラゴン。育つととても強くなる。',
  },
  golem: {
    name: 'ストーンゴーレム', lv: 18, hp: 260, str: 70, def: 70, agi: 12, exp: 0, gold: 0, breedOnly: true,
    race: 'material', size: 'l', resist: { fire: 0.7, ice: 0.8, sleep: 0, poison: 0 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_stomp' }],
    desc: '岩でできたきょじん。とても固くて力持ち。',
  },
  star_panther: {
    name: '星形パンサー', lv: 16, hp: 160, str: 68, def: 40, agi: 70, exp: 0, gold: 0, breedOnly: true,
    race: 'beast', size: 'm',
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_pounce' }],
    desc: '背中に星の模様がある、風のように速いけもの。',
  },
  demon_knight: {
    name: '悪魔の騎士', lv: 17, hp: 180, mp: 20, str: 72, def: 55, agi: 34, exp: 0, gold: 0, breedOnly: true,
    race: 'demon', size: 'm', resist: { dark: 0.5, light: 1.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_darkslash' }],
    desc: '闇のよろいをまとった騎士。剣のうでが立つ。',
  },
  chibi_treant: {
    name: 'ちびトレント', lv: 14, hp: 170, mp: 40, str: 45, def: 50, agi: 16, mag: 30, exp: 0, gold: 0, breedOnly: true,
    race: 'plant', size: 'm', resist: { fire: 1.5, wind: 0.7 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_branch_whip' }],
    desc: 'ささやきの森の主の子ども。体をいやす力がある。',
  },

  // ───── ボス ─────
  dark_treant: {
    name: 'ダークトレント', lv: 8, hp: 480, str: 36, def: 20, agi: 11, mag: 20, exp: 300, gold: 150,
    race: 'plant', size: 'xl', boss: true, turns: 1,
    resist: { fire: 1.5, wind: 0.7, sleep: 0, poison: 0.5, confuse: 0.2, blind: 0.5, silence: 0, paralyze: 0.2 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_branch_whip' }, { w: 1, id: 'm_pollen' },
      { w: 3, id: 'm_root_heal', cond: 'hpBelow:0.5', limit: 2 },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['ダークトレントはいかりくるっている！', '枝がまがまがしくのびていく…！'], buff: { atk: 1.25 }, turns: 2, addActions: [{ w: 2, id: 'm_big_branch' }] },
    ],
    desc: '闇の力で暴れ出したささやきの森の主。',
  },
  goldoon: {
    name: 'ゴルドーン', lv: 12, hp: 1400, str: 54, def: 32, agi: 15, mag: 25, exp: 1200, gold: 600,
    race: 'material', size: 'xl', boss: true, turns: 2,
    resist: { fire: 0.5, ice: 1.0, wind: 0.75, blast: 1.5, bolt: 1.0, sleep: 0, poison: 0, confuse: 0.1, blind: 0.3, silence: 0, paralyze: 0 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_rock_crush' }, { w: 2, id: 'm_stomp' }, { w: 1, id: 'm_inhale', cond: 'notRecent:m_inhale' },
    ],
    phases: [
      { hpBelow: 0.6, msg: ['ゴルドーンがほえた！'], summon: ['rock_shard', 'rock_shard'] },
      { hpBelow: 0.3, msg: ['ゴルドーンの体がくずれ始めた！', '守備力が下がった！'], debuff: { def: 0.7 }, addActions: [{ w: 2, id: 'm_inhale', cond: 'notRecent:m_inhale' }] },
    ],
    desc: 'なげきの洞窟にねむっていた岩のまじゅう。守り星の石の力で目覚めさせられた。',
  },
};
Object.assign(MONSTERS, MONSTERS_CH2);

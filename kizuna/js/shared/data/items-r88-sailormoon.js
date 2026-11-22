// 第88回 G12班: セーラームーンの 品（docs/plan-r88-anime-gear.md の 3-9）
//   作品の 職業（美少女戦士・セーラームーン・ネオ・クイーン・セレニティ）は つえ・おうぎ・ブーメラン・素手・服と ローブ
//   ・うさぎの スティック … 5だんに 生まれ変わる（ムーンスティック → キューティムーンロッド → スパイラルハートムーンロッド →
//     カレイドムーンスコープ → エターナルティアル）。どれも 光の力。使うと、仲間全員の 状態異常を 治す（浄化の かわり）
//   ・変身の 品 … 変身ブローチ → クリスタルスター → コズミックハート・コンパクト（アクセ。かじ屋で 1回ずつ 生まれ変わる）
//   ・変身ペン 4本（水・火・木・金）… パーティーで 4本 つけると、戦いの 間 みんなの 攻撃魔力が 上がる（そろい henshin_pen。rule party）
//   ・3つの タリスマン（スペース・ソード・ディープ・アクア・ミラー・ガーネット・オーブ）… 3つ 持って 鏡の湖の ほとりの
//     水しょうの台へ 行くと 聖はい（伝説）が あらわれる（タリスマンは なくならない。world/grail-r88.js）
//   ・今 ある ティアラ・銀水しょうにも 作品を つけた（R88_TAG_SAILORMOON。強さ・手に入れ方は かえない）
//   作品の 字は 使える 字に 直した（水晶 → 水しょう・杖 → つえ・邪 → じゃ・聖杯 → 聖はい など。設計書の「実装メモ（G12班）」）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=8f07681fe7a2';

const S = { work: 'sailormoon' };
const P = { work: 'sailormoon', set: 'henshin_pen' };
const T = { work: 'sailormoon', set: 'talisman' };
const MOON = { use: { ability: 'r88u_sm_moonheal' } };

// うさぎの スティック（生まれ変わる じゅん）・変身の 品
export const MOON_STICKS = ['r88_sm_stick1', 'r88_sm_stick2', 'r88_sm_stick3', 'r88_sm_stick4', 'r88_sm_stick5'];
export const MOON_BROOCHES = ['r88_sm_brooch', 'r88_sm_crystalstar', 'r88_sm_cosmic'];
export const TALISMANS = ['r88_sm_sword', 'r88_sm_mirror', 'r88_sm_orb'];
export const HOLY_GRAIL = 'r88_sm_grail';
// 聖はいの あらわれる 水しょうの台（鏡の湖の 東の ほとり。ミドリナ地方の マス。maps/gacha-r88.js が おく・world/grail-r88.js が 話す）
export const GRAIL_ALTAR = { map: 'overworld', x: 98, y: 86 };

const GEAR = {
  // ───── うさぎの スティック（生まれ変わる）─────
  r88_sm_stick1: { ...weapon('staff', 'mei'), ...S, ...MOON, name: 'うさぎのムーンスティック', fx: [{ k: 'el_light', v: 6 }], bonus: { mag: 8, heal: 6 }, look: 'moonstick', desc: '先に三日月のかざりがついた、始めのスティック。ふつうの攻撃が光になる。使うと、仲間全員の状態異常を治す。かじ屋できたえると……？' },
  r88_sm_stick2: { ...weapon('staff', 'mei'), ...S, ...MOON, name: 'キューティムーンロッド', fx: [{ k: 'el_light', v: 6 }], bonus: { mag: 12, heal: 8 }, look: 'heartrod', desc: 'ハートの形に、つばさのかざりがついたロッド。ふつうの攻撃が光になる。使うと、仲間全員の状態異常を治す。' },
  r88_sm_stick3: { ...weapon('staff', 'mei'), ...S, ...MOON, name: 'スパイラルハートムーンロッド', fx: [{ k: 'el_light', v: 6 }], bonus: { mag: 16, heal: 10 }, look: 'heartrod', desc: 'ハートのまわりを、リボンがくるくるまいたロッド。ふつうの攻撃が光になる。使うと、仲間全員の状態異常を治す。' },
  r88_sm_stick4: { ...weapon('staff', 'mei'), ...S, ...MOON, name: 'カレイドムーンスコープ', fx: [{ k: 'el_light', v: 7 }], bonus: { mag: 20, heal: 12, agi: 4 }, look: 'crystal', desc: '中をのぞくと、まんげきょうのように光がうつる、細い剣の形のスティック。ふつうの攻撃が光になる。使うと、仲間全員の状態異常を治す。' },
  r88_sm_stick5: { ...weapon('staff', 'den'), ...S, name: 'エターナルティアル', fx: [{ k: 'el_light', v: 8 }], bonus: { mag: 26, heal: 18, agi: 6 }, use: { ability: 'r88u_sm_eternal' }, look: 'wing', desc: '天使のつばさのような、白くかがやくスティック。ふつうの攻撃が光になる。使うと、仲間全員の状態異常を治して、HPを回復する。' },
  // ───── 変身の 品（生まれ変わる）─────
  r88_sm_brooch: { ...acc('mei'), ...S, name: '変身ブローチ', bonus: { hp: 40, agi: 4 }, desc: 'ふたを開けると変身できる、金色のブローチ。最大HPが上がる。かじ屋できたえると……？' },
  r88_sm_crystalstar: { ...acc('mei'), ...S, name: 'クリスタルスター', bonus: { mag: 14, hp: 30 }, desc: '星の形の変身ブローチ。まん中で、銀水しょうが光る。攻撃魔力が上がる。かじ屋できたえると……？' },
  r88_sm_cosmic: { ...acc('mei'), ...S, name: 'コズミックハート・コンパクト', fx: [{ k: 'mpregen', v: 6 }], bonus: { mag: 12, hp: 30 }, desc: 'ハートの形の変身ブローチ。中の銀水しょうも、ハートの形になった。行動するたびにMPが少し回復する。' },
  // ───── 4人の 戦士の 変身ペン（そろい）─────
  r88_sm_pen_mercury: { ...acc('fu3'), ...P, name: 'マーキュリーの変身ペン', fx: [{ k: 'res_ice', v: 4 }], desc: '水の星の戦士の、青い変身ペン。氷に強い。4人で1本ずつつけると……？' },
  r88_sm_pen_mars: { ...acc('fu3'), ...P, name: 'マーズの変身ペン', fx: [{ k: 'res_fire', v: 4 }], desc: '火の星の戦士の、赤い変身ペン。炎に強い。4人で1本ずつつけると……？' },
  r88_sm_pen_jupiter: { ...acc('fu3'), ...P, name: 'ジュピターの変身ペン', fx: [{ k: 'res_bolt', v: 4 }], desc: '木の星の戦士の、緑の変身ペン。雷に強い。4人で1本ずつつけると……？' },
  r88_sm_pen_venus: { ...acc('fu3'), ...P, name: 'ヴィーナスの変身ペン', resist: { light: 0.85 }, desc: '金の星の戦士の、オレンジの変身ペン。光に強い。4人で1本ずつつけると……？' },
  // ───── 戦士たちの 品 ─────
  r88_sm_fuku: { ...armor('cloth', 'fu3'), ...S, name: '戦士のセーラー服', fx: [{ k: 'def', v: 4 }], desc: '変身すると着ている、リボンのついたセーラー服。だれでも装備できる。守備力が上がる。' },
  r88_sm_goggle: { ...head('fu3'), ...S, name: 'マーキュリーゴーグル', fx: [{ k: 'crit', v: 4 }], desc: 'ピアスにさわると出てくる、青いゴーグル。敵の弱い所を見つける。会心の一撃が出やすい。' },
  r88_sm_pokecom: { ...acc('fu3'), ...S, name: 'ポケコン', bonus: { mag: 10 }, desc: '水の星の戦士が持っている、小さなコンピューター。敵のことを調べられる。攻撃魔力が上がる。' },
  r88_sm_harp: { ...weapon('fan', 'mei'), ...S, name: 'マーキュリー・ハープ', fx: [{ k: 'el_ice', v: 6 }], bonus: { mag: 8 }, look: 'moon', desc: '音色で水をあやつる、小さなハープ。おうぎと同じあつかい。ふつうの攻撃が氷になる。' },
  r88_sm_ofuda: { ...acc('fu3'), ...S, name: 'マーズのおふだ', fx: [{ k: 'res_dark', v: 4 }], desc: '神社のむすめの戦士が、悪いものをはらうおふだ。闇に強い。' },
  r88_sm_yumi: { ...weapon('staff', 'mei'), ...S, name: 'マーズの炎の弓', fx: [{ k: 'el_fire', v: 6 }], bonus: { mag: 10 }, look: 'wing', desc: '火の星の戦士の、炎の弓。つえと同じあつかい。ふつうの攻撃が炎になる。' },
  r88_sm_rose: { ...acc('fu3'), ...S, name: 'バラのピアス', bonus: { str: 10 }, desc: '木の星の戦士の、バラの形のピアス。力が上がる。' },
  r88_sm_tiara: { ...head('mei'), ...S, name: 'ジュピターのティアラ', fx: [{ k: 'res_bolt', v: 6 }], bonus: { str: 4 }, desc: 'ひらいしんのアンテナがのびる、木の星の戦士のティアラ。かみなりを集めて、はなつ。雷に強い。' },
  r88_sm_chain: { ...weapon('whip', 'mei'), ...S, name: 'ラブ・ミー・チェーン', fx: [{ k: 'el_light', v: 6 }], bonus: { agi: 4 }, look: 'chain', desc: '金の星の戦士の、こしの金色のくさり。ムチのようにふるう。ふつうの攻撃が光になる。' },
  r88_sm_crescent: { ...weapon('boomerang', 'fu3'), ...S, name: 'クレッセント・コンパクト', fx: [{ k: 'crit', v: 4 }], look: 'crescent', desc: '白いネコからわたされた、三日月のコンパクト。本当のすがたをうつし、投げても使える。会心の一撃が出やすい。' },
  r88_sm_pinkstick: { ...weapon('staff', 'mei'), ...S, name: 'ピンク・ムーン・スティック', fx: [{ k: 'el_light', v: 6 }], bonus: { mag: 8, agi: 4 }, look: 'moonstick', desc: '未来から来た小さな戦士の、ピンクのスティック。ふつうの攻撃が光になる。' },
  r88_sm_lunap: { ...weapon('boomerang', 'fu3'), ...S, name: 'ルナPボール', fx: [{ k: 'chase', v: 4 }], look: 'star', desc: 'ネコの顔のついた、ふしぎなボール。いろいろな物に変身する。ときどきもう1回攻撃する。' },
  r88_sm_key: { ...acc('fu3'), ...S, name: '時空のかぎ', bonus: { agi: 12 }, desc: '時の門番からもらった、時をこえるかぎ。素早さが上がる。' },
  // ───── 3つの タリスマン（そろえると 聖はい）─────
  r88_sm_sword: { ...weapon('sword', 'mei'), ...T, name: 'スペース・ソード', fx: [{ k: 'crit', v: 6 }], bonus: { str: 6 }, look: 'holy', desc: '天王星の戦士のタリスマン。せめる役の剣。会心の一撃が出やすい。' },
  r88_sm_mirror: { ...shield('mei'), ...T, name: 'ディープ・アクア・ミラー', fx: [{ k: 'counter', v: 6 }], look: 'mirror', desc: '海王星の戦士のタリスマン。本当のすがたを見つける手鏡。ときどきやりかえす。' },
  r88_sm_orb: { ...acc('mei'), ...T, name: 'ガーネット・オーブ', bonus: { def: 14, hp: 20 }, desc: 'めい王星の戦士のタリスマン。守る役の、赤むらさきの玉。守備力が上がる。' },
  r88_sm_rod: { ...weapon('staff', 'mei'), ...S, name: 'ガーネット・ロッド', fx: [{ k: 'el_dark', v: 6 }], bonus: { mag: 10 }, look: 'ankh', desc: '時の門番の戦士の、かぎの形の長いロッド。ふつうの攻撃が闇になる。' },
  r88_sm_grail: { ...acc('den'), ...S, name: '聖はい', fx: [{ k: 'mpregen', v: 8 }], bonus: { hp: 96, mag: 48, heal: 42, def: 30, agi: 30 }, desc: '3つのタリスマンがそろうと、あらわれる金色のさかずき。行動するたびにMPが回復する。' },
  r88_sm_glaive: { ...weapon('spear', 'den'), ...S, name: 'サイレンス・グレイブ', fx: [{ k: 'el_dark', v: 8 }], bonus: { mag: 20, hp: 40 }, use: { ability: 'r88u_sm_silence' }, look: 'glaive', desc: '土星の戦士の、大きなかまの形のやり。ふつうの攻撃が闇になる。使うと、仲間全員を守るかべを作る。' },
  // ───── タキシード仮面・ルナ ─────
  r88_sm_bara: { ...weapon('dagger', 'fu3'), ...S, name: '赤いバラ', fx: [{ k: 'crit', v: 4 }], look: 'stiletto', desc: 'ピンチの時に、どこからかとんでくる赤いバラ。会心の一撃が出やすい。' },
  r88_sm_mask: { ...head('fu3'), ...S, name: '仮面とシルクハット', fx: [{ k: 'evade', v: 4 }], desc: '月夜のしんしの、白い仮面と黒いシルクハット。敵の攻撃をかわしやすくなる。' },
  r88_sm_stecki: { ...weapon('staff', 'fu3'), ...S, name: '黒いステッキ', bonus: { agi: 10 }, look: 'cane', desc: '月夜のしんしの、のびちぢみする黒いステッキ。素早さが上がる。' },
  r88_sm_luna: { ...acc('fu3'), ...S, name: '三日月のしるし', bonus: { mp: 30 }, desc: '黒いネコのひたいの、金色の三日月のしるし。最大MPが上がる。' },
  // ───── ライバルの 品 ─────
  r88_sm_beryl: { ...weapon('staff', 'mei'), ...S, name: '黒水しょうのつえ', fx: [{ k: 'el_dark', v: 6 }], bonus: { mag: 12 }, look: 'crystal', desc: '闇の国の女王の、黒い水しょうの玉がついたつえ。ふつうの攻撃が闇になる。' },
  r88_sm_pierce: { ...acc('mei'), ...S, name: 'じゃ黒水しょうのピアス', bonus: { mag: 18 }, resist: { confuse: 1.3 }, desc: '黒い月の一族の、黒い水しょうのピアス。攻撃魔力が上がるが、混乱にかかりやすい。' },
  r88_sm_bracelet: { ...acc('mei'), ...S, name: '金のブレスレット', bonus: { str: 24, mag: 10, hp: -60 }, desc: '銀河の戦士の、金色のうでわ。とても強い力が出るが、つけた人の命の力をすいとる。力が大きく上がるが、最大HPが下がる。' },
};
priceUp(GEAR);

export const ITEMS_R88_SAILORMOON = GEAR;
// 生まれ変わり（うさぎの スティック 5だん・変身の 品 3だん）
//   スティック … きたえて 生まれ変わる（はじめの 品は 試練の ごほうび）。4だんめから 伝説へは 上限まで きたえて 限界の石
//   変身の 品（アクセ）… かじ屋で 1回ずつ（at: 0）
export const R88_REBIRTH_SAILORMOON = {
  r88_sm_stick1: { to: 'r88_sm_stick2', at: 3, gold: 8000, mats: [['star_shard', 6], ['moon_stone', 2]] },
  r88_sm_stick2: { to: 'r88_sm_stick3', at: 4, gold: 12000, mats: [['star_shard', 8], ['moon_stone', 3]] },
  r88_sm_stick3: { to: 'r88_sm_stick4', at: 5, gold: 16000, mats: [['star_shard', 10], ['moon_stone', 4]] },
  r88_sm_stick4: { to: 'r88_sm_stick5', keep: true, gold: 30000, mats: [['star_shard', 12], ['moon_stone', 5], ['limit_stone', 2]] },
  r88_sm_brooch: { to: 'r88_sm_crystalstar', at: 0, gold: 10000, mats: [['star_shard', 6], ['moon_stone', 2]] },
  r88_sm_crystalstar: { to: 'r88_sm_cosmic', at: 0, gold: 16000, mats: [['star_shard', 10], ['moon_stone', 3]] },
};
// 今 ある 品を 作品の 品として 数える（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_SAILORMOON = { tiara_boomerang: 'sailormoon', silver_crystal: 'sailormoon' };

export const R88_SAILORMOON_KANA = {
  r88_sm_stick1: 'うさぎのむーんすてぃっく', r88_sm_stick2: 'きゅーてぃむーんろっど', r88_sm_stick3: 'すぱいらるはーとむーんろっど',
  r88_sm_stick4: 'かれいどむーんすこーぷ', r88_sm_stick5: 'えたーなるてぃある',
  r88_sm_brooch: 'へんしんぶろーち', r88_sm_crystalstar: 'くりすたるすたー', r88_sm_cosmic: 'こずみっくはーとこんぱくと',
  r88_sm_pen_mercury: 'まーきゅりーのへんしんぺん', r88_sm_pen_mars: 'まーずのへんしんぺん', r88_sm_pen_jupiter: 'じゅぴたーのへんしんぺん', r88_sm_pen_venus: 'ゔぃーなすのへんしんぺん',
  r88_sm_fuku: 'せんしのせーらーふく', r88_sm_goggle: 'まーきゅりーごーぐる', r88_sm_pokecom: 'ぽけこん', r88_sm_harp: 'まーきゅりーはーぷ',
  r88_sm_ofuda: 'まーずのおふだ', r88_sm_yumi: 'まーずのほのおのゆみ', r88_sm_rose: 'ばらのぴあす', r88_sm_tiara: 'じゅぴたーのてぃあら',
  r88_sm_chain: 'らぶみーちぇーん', r88_sm_crescent: 'くれっせんとこんぱくと', r88_sm_pinkstick: 'ぴんくむーんすてぃっく', r88_sm_lunap: 'るなぴーぼーる',
  r88_sm_key: 'じくうのかぎ', r88_sm_sword: 'すぺーすそーど', r88_sm_mirror: 'でぃーぷあくあみらー', r88_sm_orb: 'がーねっとおーぶ',
  r88_sm_rod: 'がーねっとろっど', r88_sm_grail: 'せいはい', r88_sm_glaive: 'さいれんすぐれいぶ',
  r88_sm_bara: 'あかいばら', r88_sm_mask: 'かめんとしるくはっと', r88_sm_stecki: 'くろいすてっき', r88_sm_luna: 'みかづきのしるし',
  r88_sm_beryl: 'くろすいしょうのつえ', r88_sm_pierce: 'じゃこくすいしょうのぴあす', r88_sm_bracelet: 'きんのぶれすれっと',
};

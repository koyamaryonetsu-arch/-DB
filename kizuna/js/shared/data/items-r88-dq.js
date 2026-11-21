// 第88回 G15班: ドラゴンクエストの 品（docs/plan-r88-anime-gear.md の 4-4）
//   作品の 職業（勇者・ロトの勇者）は 剣・やり・オノ・つえ・ブーメラン・たて・かぶと
//   ・ロトの装備 5つ（剣・よろい・たて・かぶと・しるし）… 1人が 3つ いじょう つけると 力が わく。5つ 持つと しょう号。
//     5つ 持って いる 人だけ、まぼろしの回ろうの 竜王のひ孫に ちょうせん できる（勝つと ロトの竜剣。data/rivals-r88.js の g15Rivals）
//   ・天空の装備（今 ある 天空の剣・天空のよろい ＋ 新しい たて・かぶと）… 1人が 4つ つけると しょう号と 炎・氷に 強い
//   ・はかいの鉄球 … ふつうの 攻撃が 敵全体（reach all）・グリンガムのムチ … 1グループ（reach group）。伝説の 強さは fitR88Legends
//   ・まじんのかなづち … 会心が とても 出やすいが、ふつうの 攻撃が 外れやすい（品の crit・atkAcc。shared/battle-r88-dq.js）
//   ・天空のたて … 使うと、次に 受ける 呪文 1回を はね返す（シャハルの鏡と 同じ かくし技の 作り）
//   ・いのりの指輪 … 使うと 自分の MPを 回復（こわれる 所は 作らない。1つの 戦いで 1回）
//   ・今 ある はやぶさの剣・天空の剣・天空のよろい・ドラゴンスレイヤーにも 作品を つけた（R88_TAG_DQ。強さ・手に入れ方は かえない）
//   作品の 字は 使える 字に 直した（設計書の「実装メモ（G15班）」）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=52527b10ae8b';

const Q = { work: 'dq' };
const R = { work: 'dq', set: 'roto' };
const S = { work: 'dq', set: 'tenku' };

// ロトの装備（5つ。竜王のひ孫の じょうけん）・天空の装備（今 ある 剣と よろい ＋ 新しい たて・かぶと）
export const ROTO_GEAR = ['r88_dq_roto_sword', 'r88_dq_roto_armor', 'r88_dq_roto_shield', 'r88_dq_roto_helm', 'r88_dq_roto_mark'];
export const TENKU_GEAR = ['tenku_sword', 'tenku_mail', 'r88_dq_tenku_shield', 'r88_dq_tenku_helm'];

const GEAR = {
  // ───── ロトの装備 ─────
  r88_dq_roto_sword: { ...weapon('sword', 'den'), ...R, name: 'ロトの剣', fx: [{ k: 'el_light', v: 6 }], bonus: { str: 18, agi: 10 }, use: { ability: 'r88u_dq_roto' }, look: 'roto', desc: '伝説の勇者ロトの剣。王者の剣ともよばれる。ふつうの攻撃が光になる。使うと、大きな風の呪文で、同じ種類の敵みんなを切りさく。' },
  r88_dq_roto_armor: { ...armor('heavy', 'den'), ...R, name: 'ロトのよろい', fx: [{ k: 'regen', v: 6 }], bonus: { hp: 40, def: 10 }, desc: '伝説の勇者ロトのよろい。光のよろいともよばれる。行動するたびにHPが少し回復する。' },
  r88_dq_roto_shield: { ...shield('den'), ...R, name: 'ロトのたて', bonus: { def: 10, hp: 30 }, resist: { fire: 0.8, ice: 0.8 }, look: 'crest', desc: '伝説の勇者ロトのたて。勇者のたてともよばれる。炎と氷に強い。' },
  r88_dq_roto_helm: { ...head('mei', true), ...R, name: 'ロトのかぶと', bonus: { def: 4 }, resist: { sleep: 0.6, confuse: 0.6 }, desc: '伝説の勇者ロトのかぶと。ねむりと混乱にかかりにくい。' },
  r88_dq_roto_mark: { ...acc('mei'), ...R, name: 'ロトの聖なる守り', fx: [{ k: 'res_dark', v: 6 }], bonus: { hp: 30, mag: 6 }, desc: 'ロトの血をひく者のあかし。ロトのしるしともよばれる。闇に強い。ロトの装備を5つそろえると……？' },
  r88_dq_ryuken: { ...weapon('sword', 'den'), ...Q, name: 'ロトの竜剣', fx: [{ k: 'slay_dragon', v: 8 }], bonus: { str: 20, def: 10 }, look: 'roto', desc: 'ロトの装備で竜王のひ孫に勝った者だけがもらえる、竜の力をひめた剣。ドラゴンにとても強い。' },
  // ───── そのほかの 品 ─────
  r88_dq_hikaritama: { ...acc('mei'), ...Q, name: 'ロトの光の玉', fx: [{ k: 'res_dark', v: 4 }], bonus: { mag: 8 }, use: { ability: 'r88u_dq_tama' }, desc: '竜の女王から勇者にたくされた、光の玉。闇に強い。使うと、敵全体の強くなっていた力を消す。' },
  r88_dq_raijin: { ...weapon('sword', 'mei'), ...Q, name: '雷神の剣', bonus: { str: 4, mag: 8 }, use: { ability: 'r88u_dq_raijin' }, look: 'flame', desc: 'いかずちの神の名をもつ剣。使うと、ほのおの呪文で、同じ種類の敵みんなをやきつくす。' },
  r88_dq_inazuma: { ...weapon('sword', 'mei'), ...Q, name: 'いなずまのつるぎ', bonus: { str: 4, mag: 8 }, use: { ability: 'r88u_dq_inazuma' }, look: 'bolt', desc: '空にかかげると、ばく発の呪文がおこる剣。使うと、敵全体をばく発でつつむ。' },
  r88_dq_kiseki: { ...weapon('sword', 'mei'), ...Q, name: 'きせきの剣', fx: [{ k: 'drain', v: 6 }], look: 'crystal', desc: '切りつけるたびに、きずがいえていく、ふしぎな剣。あたえたダメージの一部だけHPが回復する。' },
  r88_dq_tekkyu: { ...weapon('axe', 'den'), ...Q, name: 'はかいの鉄球', reach: 'all', bonus: { str: 16, agi: -8 }, look: 'tekkyu', desc: 'くさりの先に、トゲの大きな鉄球がついた武器。ふつうの攻撃が、敵全体にとどく。重くて、素早さが下がる。' },
  r88_dq_gringham: { ...weapon('whip', 'den'), ...Q, name: 'グリンガムのムチ', reach: 'group', bonus: { str: 14, agi: 10 }, look: 'gringham', desc: '3本に分かれた、伝説のムチ。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_dq_mk_sword: { ...weapon('sword', 'den'), ...Q, name: 'メタルキングの剣', fx: [{ k: 'slay_dragon', v: 6 }], bonus: { str: 16, def: 16 }, look: 'crystal', desc: 'はぐれたメタルの王さまの、とてもかたい剣。ドラゴンに強い。守備力も上がる。' },
  r88_dq_mk_armor: { ...armor('heavy', 'mei'), ...Q, name: 'メタルキングのよろい', bonus: { def: 10 }, resist: { fire: 0.8, ice: 0.8 }, desc: 'メタルの王さまのように、銀色にかがやくよろい。炎と氷に強い。' },
  r88_dq_mk_shield: { ...shield('mei'), ...Q, name: 'メタルキングのたて', fx: [{ k: 'def', v: 6 }], look: 'round', desc: 'メタルの王さまのように、かたい銀色のたて。守備力が上がる。' },
  r88_dq_mk_helm: { ...head('mei', true), ...Q, name: 'メタルキングヘルム', fx: [{ k: 'guard_confuse', v: 6 }], desc: 'メタルの王さまの顔のついた、銀色のかぶと。混乱にかかりにくい。' },
  r88_dq_mikagami: { ...shield('mei'), ...Q, name: 'みかがみのたて', fx: [{ k: 'res_fire', v: 6 }], look: 'mirror', desc: '鏡のようにみがかれたたて。ほのおの呪文と、ほのおの息のダメージをへらす。' },
  r88_dq_tenku_shield: { ...shield('den'), ...S, name: '天空のたて', bonus: { def: 10, mag: 10 }, resist: { fire: 0.8, ice: 0.8 }, use: { ability: 'r88u_dq_mirror' }, look: 'light', desc: '天空の勇者のたて。炎と氷に強い。使うと、次に受ける呪文1回をはね返す。天空の装備を4つそろえると……？' },
  r88_dq_tenku_helm: { ...head('den', true), ...S, name: '天空のかぶと', fx: [{ k: 'guard_confuse', v: 8 }], bonus: { def: 6, agi: 6 }, desc: '天空の勇者のかぶと。混乱にかかりにくい。天空の装備を4つそろえると……？' },
  r88_dq_zombiekiller: { ...weapon('sword', 'mei'), ...Q, name: 'ゾンビキラー', fx: [{ k: 'slay_undead', v: 6 }], look: 'holy', desc: '聖なる力のこもった剣。ゾンビにとても強い。' },
  r88_dq_dragonkiller: { ...weapon('sword', 'mei'), ...Q, name: 'ドラゴンキラー', fx: [{ k: 'slay_dragon', v: 6 }], look: 'dragon', desc: '竜をたおすために作られた剣。ドラゴンにとても強い。' },
  r88_dq_majin: { ...weapon('axe', 'mei'), ...Q, name: 'まじんのかなづち', crit: 0.33, atkAcc: 0.6, look: 'hammer', desc: '大きな頭のかなづち。会心の一撃がとても出やすいが、ふつうの攻撃は外れやすい。' },
  r88_dq_fireboom: { ...weapon('boomerang', 'mei'), ...Q, name: 'ほのおのブーメラン', fx: [{ k: 'el_fire', v: 6 }], look: 'crescent', desc: 'ほのおにつつまれたブーメラン。ふつうの攻撃がほのおになって、敵全体にとどく。' },
  r88_dq_yaiba: { ...armor('heavy', 'mei'), ...Q, name: 'やいばのよろい', fx: [{ k: 'counter', v: 6 }], desc: 'トゲのようなやいばがたくさんついたよろい。ふつうの攻撃をされると、ときどきやりかえす。' },
  r88_dq_inori: { ...acc('fu3'), ...Q, name: 'いのりの指輪', bonus: { mag: 4 }, use: { ability: 'r88u_dq_inori' }, desc: 'いのりをこめると、魔法の力がもどってくる指輪。使うと、自分のMPを回復する。' },
  r88_dq_inochi: { ...acc('mei'), ...Q, name: 'いのちの指輪', fx: [{ k: 'regen', v: 6 }], bonus: { hp: 30 }, desc: '歩くたびに元気がわいてくる指輪。行動するたびにHPが少し回復する。' },
  r88_dq_rubiss: { ...acc('den'), ...Q, name: 'ルビスの守り', fx: [{ k: 'res_dark', v: 8 }], bonus: { hp: 110, def: 34, mag: 34, heal: 34, agi: 28, str: 20 }, desc: '5つの紋章を集めた者に、精れいルビスがあたえる守り。闇にとても強い。体じゅうの力が上がる。' },
  r88_dq_sabaki: { ...weapon('staff', 'mei'), ...Q, name: 'さばきのつえ', bonus: { mag: 12 }, use: { ability: 'r88u_dq_sabaki' }, look: 'healing', desc: 'ふると、かまいたちが起こるつえ。使うと、同じ種類の敵みんなを風の呪文で切りさく。' },
};
priceUp(GEAR);

export const ITEMS_R88_DQ = GEAR;
export const R88_REBIRTH_DQ = {};
// 今 ある 品を 作品の 品として 数える（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_DQ = { hayabusa_sword: 'dq', tenku_sword: 'dq', tenku_mail: 'dq', dragon_slayer: 'dq' };
// 今 ある 品を そろいの 組に 入れる（items-r88.js の tagR88Works。天空の剣・天空のよろい → 天空の装備）
export const R88_SETTAG_DQ = { tenku_sword: 'tenku', tenku_mail: 'tenku' };

export const R88_DQ_KANA = {
  r88_dq_roto_sword: 'ろとのつるぎ', r88_dq_roto_armor: 'ろとのよろい', r88_dq_roto_shield: 'ろとのたて', r88_dq_roto_helm: 'ろとのかぶと',
  r88_dq_roto_mark: 'ろとのせいなるまもり', r88_dq_ryuken: 'ろとのりゅうけん', r88_dq_hikaritama: 'ろとのひかりのたま', r88_dq_raijin: 'らいじんのけん',
  r88_dq_inazuma: 'いなずまのつるぎ', r88_dq_kiseki: 'きせきのけん', r88_dq_tekkyu: 'はかいのてっきゅう', r88_dq_gringham: 'ぐりんがむのむち',
  r88_dq_mk_sword: 'めたるきんぐのけん', r88_dq_mk_armor: 'めたるきんぐのよろい', r88_dq_mk_shield: 'めたるきんぐのたて', r88_dq_mk_helm: 'めたるきんぐへるむ',
  r88_dq_mikagami: 'みかがみのたて', r88_dq_tenku_shield: 'てんくうのたて', r88_dq_tenku_helm: 'てんくうのかぶと', r88_dq_zombiekiller: 'ぞんびきらー',
  r88_dq_dragonkiller: 'どらごんきらー', r88_dq_majin: 'まじんのかなづち', r88_dq_fireboom: 'ほのおのぶーめらん', r88_dq_yaiba: 'やいばのよろい',
  r88_dq_inori: 'いのりのゆびわ', r88_dq_inochi: 'いのちのゆびわ', r88_dq_rubiss: 'るびすのまもり', r88_dq_sabaki: 'さばきのつえ',
};

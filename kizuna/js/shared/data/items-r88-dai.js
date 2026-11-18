// 第88回 G15班: ダイの大冒険の 品（docs/plan-r88-anime-gear.md の 4-3。魔王の 側の 品も）
//   作品の 職業（竜の騎士・竜魔人・魔王）は 剣・やり・オノ・ツメ・つえ・服・ローブ・重いよろい
//   ・ダイの剣（伝説）… は者の剣を、は者のかんむりを 持って いる 時に かじ屋で 生まれ変わらせる（R88_REBIRTH_DAI の need）。
//     使うと さやに おさめて 力を ため、次の 攻撃が とても 強く なる
//   ・アバンのしるし 5色 … パーティーで つけた 数だけ、みんなの 状態異常への 強さが 上がる（そろい aban_mark。rule party）
//   ・天地魔闘（光魔のつえ・き眼の力・ミストバーンの闇の衣）… 1人が 3つ つけると 反撃が 出やすい（そろい tenchi_matou。wear）
//   ・光魔のつえ … MPが 多いほど 攻撃力が 上がり、攻撃の たびに MPが へる（品の atkMp。shared/battle-r88-dq.js）
//   ・ブラックロッド … 攻撃魔力が 高いほど 攻撃力も 上がる（品の atkMag。shared/battle-r88-dq.js）
//   ・シャハルの鏡 … 使うと、次に 受ける 呪文 1回を はね返す（天空のたてと 同じ かくし技の 作り。effect r88dq の mirror）
//   ・ゴールドフェザー・き眼の力の「動けなく する」は ボスに 効かない（effect r88dq の bind）
//   ・魔だんじゅうは「呪文を こめて うち出す 道具」（本物の 銃の ようには 書かない）。黒の核しょうは 入れない
//   作品の 字は 使える 字に 直した（設計書の「実装メモ（G15班）」）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=f9111f3bfd76';

const D = { work: 'dai' };
const A = { work: 'dai', set: 'aban_mark' };
const T = { work: 'dai', set: 'tenchi_matou' };

// アバンのしるし（5色。青 ＝ ダイの 職業の 試練の ごほうび）
export const ABAN_MARKS = ['r88_da_mark_blue', 'r88_da_mark_green', 'r88_da_mark_red', 'r88_da_mark_white', 'r88_da_mark_purple'];
export const DAI_SWORD = 'r88_da_daisword';
export const HASHA_SWORD = 'r88_da_hasha';
export const HASHA_CROWN = 'r88_da_crown';

const GEAR = {
  // ───── ダイと アバンの 使徒 ─────
  r88_da_papnica: { ...weapon('dagger', 'shop'), ...D, name: 'パプニカのナイフ', bonus: { agi: 2 }, look: 'knife', desc: 'パプニカの王家につたわる、小さなナイフ。お姫さまから、勇者の少年におくられた。' },
  r88_da_daisword: { ...weapon('sword', 'den'), ...D, name: 'ダイの剣', fx: [{ k: 'el_bolt', v: 8 }], bonus: { str: 20, agi: 10 }, use: { ability: 'r88u_da_saya' }, look: 'holy', desc: '伝説の名工が、は者のかんむりのオリハルコンで打った、竜の騎士の剣。ふつうの攻撃が雷になる。使うと、さやにおさめて力をため、次の攻撃がとても強くなる。' },
  r88_da_shinma: { ...weapon('sword', 'den'), ...D, name: '真魔ごう竜剣', fx: [{ k: 'crit', v: 8 }], bonus: { str: 22, def: 10 }, look: 'dragon', desc: '竜の騎士だけが持つことをゆるされた、神々の作った剣。会心の一撃がとても出やすい。' },
  r88_da_hasha: { ...weapon('sword', 'mei'), ...D, name: 'は者の剣', fx: [{ k: 'crit', v: 6 }], bonus: { str: 6 }, look: 'great', desc: 'ロモスの国の宝の、オリハルコンの剣。会心の一撃が出やすい。は者のかんむりを持ってかじ屋できたえると……？' },
  r88_da_crown: { ...head('fu3'), ...D, name: 'は者のかんむり', fx: [{ k: 'def', v: 4 }], desc: 'ロモスの王さまが、小さな勇者におくった金のかんむり。じつはオリハルコンでできている。守備力が上がる。' },
  r88_da_booster: { ...weapon('staff', 'shop'), ...D, name: 'マジカルブースター', bonus: { mag: 3 }, look: 'wizard', desc: '先生が、魔法使いの弟子にわたした、始めのつえ。魔法の力を少し強くする。' },
  r88_da_kagayaki: { ...weapon('staff', 'mei'), ...D, name: 'かがやきのつえ', bonus: { mag: 16 }, look: 'star', desc: '魔法使いの少年が持った、光るつえ。攻撃魔力が上がる。' },
  r88_da_blackrod: { ...weapon('staff', 'mei'), ...D, name: 'ブラックロッド', atkMag: true, bonus: { mag: 10 }, look: 'wave', desc: '伝説の名工が作った、のびちぢみする黒いつえ。攻撃魔力が高いほど、ふつうの攻撃も強くなる。' },
  r88_da_madan: { ...weapon('boomerang', 'mei'), ...D, name: '魔だんじゅう', bonus: { heal: 10 }, use: { ability: 'r88u_da_madan' }, look: 'cross', desc: '先生が作った、呪文をこめた玉をうち出す道具。使うと、こめておいた回復の呪文で、仲間1人のHPを回復する。' },
  r88_da_makouken: { ...weapon('claw', 'mei'), ...D, name: '魔こう拳', fx: [{ k: 'def', v: 6 }], bonus: { str: 6 }, look: 'knuckle', desc: '伝説の名工が作った、よろいにもなる手こう。身を守る力も強い。守備力が上がる。' },
  r88_da_makenarmor: { ...weapon('sword', 'mei'), ...D, name: 'よろいの魔剣', fx: [{ k: 'def', v: 6 }], bonus: { def: 6 }, look: 'broad', desc: 'さやが、よろいになる魔剣。守備力が上がる。' },
  r88_da_masou: { ...weapon('spear', 'mei'), ...D, name: 'よろいの魔そう', fx: [{ k: 'agi', v: 6 }], bonus: { agi: 6 }, look: 'lance', desc: '持ち手が、よろいになる魔のやり。目にもとまらぬ速さで動ける。素早さが上がる。' },
  r88_da_shinku: { ...weapon('axe', 'mei'), ...D, name: '真空のオノ', fx: [{ k: 'el_wind', v: 6 }], bonus: { str: 6 }, look: 'battle', desc: 'じゅう王の、真空のうずを作る大きなオノ。ふつうの攻撃が風になる。' },
  r88_da_great: { ...weapon('axe', 'mei'), ...D, name: 'グレイトアックス', fx: [{ k: 'crit', v: 6 }], bonus: { str: 8 }, look: 'crescent', desc: '伝説の名工が作った、じゅう王の新しい両手のオノ。会心の一撃が出やすい。' },
  r88_da_seiou: { ...weapon('sword', 'den'), ...D, name: '星皇剣', fx: [{ k: 'chase', v: 8 }], bonus: { str: 18, agi: 12 }, look: 'crystal', desc: '伝説の名工が、自分のために打った2本の剣。ふつうの攻撃のあと、とてもよくもう1回切りつける。' },
  r88_da_mieru: { ...head('fu3'), ...D, name: 'ミエールのめがね', fx: [{ k: 'crit', v: 4 }], desc: '先生が、ふしぎなどうくつで見つけた、わなを見ぬくめがね。ねらいがさだまり、会心の一撃が出やすい。' },
  r88_da_silver: { ...acc('mei'), ...D, name: 'シルバーフェザー', fx: [{ k: 'mpregen', v: 6 }], bonus: { mp: 20 }, desc: '先生の、魔法の力を足してくれる銀の羽根。行動するたびにMPが少し回復する。' },
  r88_da_gold: { ...acc('mei'), ...D, name: 'ゴールドフェザー', bonus: { agi: 8 }, use: { ability: 'r88u_da_feather' }, desc: '先に光る石のついた、金の羽根。使うと、敵1体にさして少しの間動けなくする（大きな敵には効かない）。' },
  // アバンのしるし（5色。パーティーで つけた 数だけ、みんなが 状態異常に かかりにくく なる）
  r88_da_mark_blue: { ...acc('mei'), ...A, name: 'アバンのしるし・青', fx: [{ k: 'guard_confuse', v: 5 }], bonus: { agi: 6 }, desc: '「純すい」の心で光る、青いしるし。先生の弟子のあかし。混乱にかかりにくい。仲間とつけると……？' },
  r88_da_mark_green: { ...acc('mei'), ...A, name: 'アバンのしるし・緑', bonus: { str: 6, mag: 6 }, desc: '「勇気」の心で光る、緑のしるし。先生の弟子のあかし。力と攻撃魔力が上がる。仲間とつけると……？' },
  r88_da_mark_red: { ...acc('mei'), ...A, name: 'アバンのしるし・赤', bonus: { heal: 12 }, desc: '「じ愛」の心で光る、赤いしるし。先生の弟子のあかし。回復魔力が上がる。仲間とつけると……？' },
  r88_da_mark_white: { ...acc('mei'), ...A, name: 'アバンのしるし・白', fx: [{ k: 'guard_paralyze', v: 5 }], bonus: { def: 6 }, desc: '「正義」の心で光る、白いしるし。先生の弟子のあかし。マヒにかかりにくい。仲間とつけると……？' },
  r88_da_mark_purple: { ...acc('mei'), ...A, name: 'アバンのしるし・むらさき', bonus: { hp: 40 }, desc: '「とうし」の心で光る、むらさきのしるし。先生の弟子のあかし。最大HPが上がる。仲間とつけると……？' },
  r88_da_namida: { ...acc('den'), ...D, name: '神のなみだ', bonus: { hp: 110, mp: 30, heal: 40, def: 30, mag: 30, agi: 30 }, use: { ability: 'r88u_da_namida' }, desc: '小さな金色のスライムの、本当のすがた。ねがいをかなえる力がある。使うと、仲間全員のHPを全部回復する。' },
  // ───── 魔王の 側の 品 ─────
  r88_da_hellclaw: { ...weapon('claw', 'mei'), ...D, name: 'じごくのツメ', fx: [{ k: 'el_dark', v: 6 }], bonus: { str: 6 }, look: 'tiger', desc: '魔王が、こぶしの骨からのばすツメ。ふつうの攻撃が闇になる。' },
  r88_da_yami: { ...armor('robe', 'mei'), ...T, name: 'ミストバーンの闇の衣', fx: [{ k: 'def', v: 6 }], bonus: { mag: 8 }, desc: '大魔王の体を、中にかくしていた黒い衣。だれでも装備できる。守備力が上がる。天地魔闘の3つの品の1つ。' },
  r88_da_fue: { ...weapon('axe', 'mei'), ...D, name: 'キルバーンの笛', fx: [{ k: 'paralyze', v: 6 }], bonus: { agi: 6 }, look: 'crescent', desc: '大きなかまにもなる、ふしぎな笛。音で体の感じをうばい、ときどき敵をマヒさせる。' },
  r88_da_shahal: { ...shield('den'), ...D, name: 'シャハルの鏡', bonus: { mag: 12, def: 10 }, resist: { fire: 0.85, ice: 0.85 }, use: { ability: 'r88u_da_mirror' }, look: 'mirror', desc: '親衛騎団の騎士の、伝説のたて。炎と氷に少し強い。使うと、次に受ける呪文1回をはね返す。' },
  r88_da_kigan: { ...acc('den'), ...T, name: 'き眼の力', bonus: { mag: 70, hp: 90, mp: 40, def: 26, agi: 24, heal: 20 }, use: { ability: 'r88u_da_kigan' }, desc: '大魔王のひたいの、第三の目の力。攻撃魔力がとても上がる。使うと、敵1体を「ひとみ」にとじこめて、少しの間動けなくする（大きな敵には効かない）。天地魔闘の3つの品の1つ。' },
  r88_da_kouma: { ...weapon('staff', 'den'), ...T, name: '光魔のつえ', atkMp: true, bonus: { mag: 24, mp: 30 }, look: 'dragon', desc: '伝説の名工が作った、大魔王のつえ。MPが多いほど攻撃力が上がるが、ふつうの攻撃のたびにMPがへる。天地魔闘の3つの品の1つ。' },
  r88_da_white: { ...armor('robe', 'mei'), ...D, name: '大魔王の白い衣', fx: [{ k: 'res_fire', v: 6 }], bonus: { mag: 10 }, desc: '大魔王が、いつも着ていた白い衣。だれでも装備できる。炎に強い。' },
};
priceUp(GEAR, { r88_da_papnica: 90, r88_da_booster: 100 });

export const ITEMS_R88_DAI = GEAR;
// ダイの剣: は者の剣を、は者のかんむりを 持って いる 時に、上限まで きたえた あと かじ屋で（かんむりは なくならない）
export const R88_REBIRTH_DAI = {
  r88_da_hasha: { to: 'r88_da_daisword', keep: true, gold: 30000, mats: [['star_shard', 12], ['thunder_stone', 3], ['limit_stone', 2]], need: { items: ['r88_da_crown'] } },
};
export const R88_TAG_DAI = {};

export const R88_DAI_KANA = {
  r88_da_papnica: 'ぱぷにかのないふ', r88_da_daisword: 'だいのけん', r88_da_shinma: 'しんまごうりゅうけん',r88_da_hasha: 'はしゃのけん', r88_da_crown: 'はしゃのかんむり',
  r88_da_booster: 'まじかるぶーすたー', r88_da_kagayaki: 'かがやきのつえ', r88_da_blackrod: 'ぶらっくろっど', r88_da_madan: 'まだんじゅう',
  r88_da_makouken: 'まこうけん', r88_da_makenarmor: 'よろいのまけん', r88_da_masou: 'よろいのまそう', r88_da_shinku: 'しんくうのおの',
  r88_da_great: 'ぐれいとあっくす', r88_da_seiou: 'せいおうけん', r88_da_mieru: 'みえーるのめがね', r88_da_silver: 'しるばーふぇざー',
  r88_da_gold: 'ごーるどふぇざー', r88_da_mark_blue: 'あばんのしるしあお', r88_da_mark_green: 'あばんのしるしみどり', r88_da_mark_red: 'あばんのしるしあか',
  r88_da_mark_white: 'あばんのしるししろ', r88_da_mark_purple: 'あばんのしるしむらさき', r88_da_namida: 'かみのなみだ',
  r88_da_hellclaw: 'じごくのつめ', r88_da_yami: 'みすとばーんのやみのころも', r88_da_fue: 'きるばーんのふえ', r88_da_shahal: 'しゃはるのかがみ',
  r88_da_kigan: 'きがんのちから', r88_da_kouma: 'こうまのつえ', r88_da_white: 'だいまおうのしろいころも',
};

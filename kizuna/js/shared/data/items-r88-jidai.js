// 第88回 G18班: 暴れんぼう将軍・3年B組の 品（docs/plan-r88-anime-gear.md の 4-10）
//   暴れんぼう将軍 … 作品の 職業（将軍・暴れんぼう将軍）は 剣・やり・短剣・服と 道着と 重いよろい
//   ・将軍の名刀 … 上様の 立ち回りは みねうちなので、マヒの力（ときどき 動けなく する）
//   ・め組のまとい … まといを ふり回して、ふつうの 攻撃が 1グループに とどく
//   ・白い着流し … 暴れんぼう将軍の 一の試練の ごほうび
//   3年B組 … 作品の 職業（3年B組の担任）は つえ・おうぎ・たて・服と ローブ
//   ・3年B組の出席ぼ … 3年B組の担任の 一の試練の ごほうび（ぬ〜べ〜の「出席ぼ」と 分けた 名前）
//   ・今 ある 熱血先生のジャージ・指し棒 は こわさず、作品の 品として 数える（R88_TAG_JIDAI。チョークは 鋼のれん金術師の まま）
//   ・入れない 品: 「くさったミカン」（品に すると 子どもに つたわりにくい）
//   作品の 字は 使える 字に 直した（葵 → あおい／扇 → おうぎ／纏 → まとい／贈る → おくる／譜 → ふ／簿 → ぼ など）
import { weapon, armor, shield, acc, priceUp } from './items-r88-kit.js?v=c53292a2af59';

const A = { work: 'abarenbo' };
const B = { work: 'class3b' };

const GEAR = {
  // ───── 暴れんぼう将軍 ─────
  r88_ab_meito: { ...weapon('sword', 'mei'), ...A, name: '将軍の名刀', fx: [{ k: 'paralyze', v: 6 }], look: 'katana', desc: '天下の将軍さまの刀。悪い人も、くるりとかえしたみねうちでこらしめる。ときどき敵をマヒさせる。' },
  r88_ab_ougi: { ...weapon('fan', 'mei'), ...A, name: 'あおいのもんのおうぎ', fx: [{ k: 'crit', v: 6 }], look: 'tessen', desc: 'あおいの葉のもんがえがかれた、上様のおうぎ。ぱっと開くと、みんながははーっとひれふす。会心の一撃が出やすい。' },
  r88_ab_kinagashi: { ...armor('gi', 'fu3'), ...A, name: '白い着流し', bonus: { agi: 10 }, desc: 'びんぼう旗本の三男、新さんのいつもの着流し。町を気ままに歩くのにぴったり。素早さが上がる。' },
  r88_ab_kura: { ...acc('fu3'), ...A, name: '白馬のくら', bonus: { agi: 14 }, desc: '白い馬にのせる、りっぱなくら。はま辺をかけぬける上様の馬。素早さが上がる。' },
  r88_ab_matoi: { ...weapon('spear', 'mei'), ...A, name: 'め組のまとい', reach: 'group', look: 'matoi', desc: 'め組の頭、たつ五ろうがふり回す火消しのまとい。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_ab_happi: { ...armor('cloth', 'fu3'), ...A, name: '火消しのはっぴ', fx: [{ k: 'res_fire', v: 4 }], desc: 'め組の火消したちがきる、いきなはっぴ。だれでも装備できる。炎に強い。' },
  r88_ab_shinobi: { ...weapon('dagger', 'mei'), ...A, name: 'お庭番の忍び刀', fx: [{ k: 'crit', v: 6 }], look: 'kunai', desc: '上様にかげからつかえる、お庭番の忍び刀。「成敗！」の合図で、すっとあらわれる。会心の一撃が出やすい。' },
  // ───── 3年B組 ─────
  r88_3b_shusseki: { ...shield('fu3'), ...B, name: '3年B組の出席ぼ', fx: [{ k: 'def', v: 4 }], look: 'kite', desc: '3年B組のみんなの名前が書いてある出席ぼ。ひとりひとりの名前を、毎朝大きな声でよぶ。守備力が上がる。' },
  r88_3b_kokugo: { ...acc('fu3'), ...B, name: '国語の教科書', bonus: { heal: 14 }, desc: '国語の先生が、毎日読みこんでいる教科書。言葉の力で、心をいやす。回復の力が上がる。' },
  r88_3b_kokuban: { ...weapon('boomerang', 'fu3'), ...B, name: '黒板けし', fx: [{ k: 'sleep', v: 4 }], look: 'boomer', desc: '白いこなをたっぷりすった黒板けし。ぽふっと当たると、なぜかねむくなる。ブーメランと同じあつかい。ときどき敵をねむらせる。' },
  r88_3b_album: { ...acc('mei'), ...B, name: '卒業アルバム', bonus: { hp: 50, mp: 30 }, desc: '3年B組みんなの笑顔がつまった、卒業アルバム。開くたびに元気が出る。最大HPと最大MPが上がる。' },
  r88_3b_gakufu: { ...acc('mei'), ...B, name: 'おくる言葉の楽ふ', fx: [{ k: 'regen', v: 6 }], bonus: { heal: 6 }, desc: '卒業する生徒たちへの歌の楽ふ。口ずさむと、心がぽかぽかする。行動するたびにHPが回復する。' },
  r88_3b_hitoji: { ...acc('fu3'), ...B, name: '人という字の書', bonus: { def: 14 }, desc: '「人という字は、人と人とがささえ合ってできている」と書いた書。守備力が上がる。' },
  r88_3b_seifuku: { ...armor('cloth', 'shop'), ...B, name: '桜中学の制服', desc: '桜中学の生徒がきる、黒い制服。だれでも装備できる。' },
};
priceUp(GEAR, { r88_3b_seifuku: 60 });

export const ITEMS_R88_JIDAI = GEAR;
export const R88_REBIRTH_JIDAI = {};
// 今 ある 品を 作品の 品として 数える（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_JIDAI = { nekketsu_jersey: 'class3b', pointer_stick: 'class3b' };

export const R88_JIDAI_KANA = {
  r88_ab_meito: 'しょうぐんのめいとう', r88_ab_ougi: 'あおいのもんのおうぎ', r88_ab_kinagashi: 'しろいきながし', r88_ab_kura: 'はくばのくら',
  r88_ab_matoi: 'めぐみのまとい', r88_ab_happi: 'ひけしのはっぴ', r88_ab_shinobi: 'おにわばんのしのびがたな',
  r88_3b_shusseki: 'さんねんびーぐみのしゅっせきぼ', r88_3b_kokugo: 'こくごのきょうかしょ', r88_3b_kokuban: 'こくばんけし',
  r88_3b_album: 'そつぎょうあるばむ', r88_3b_gakufu: 'おくることばのがくふ', r88_3b_hitoji: 'ひとというじのしょ', r88_3b_seifuku: 'さくらちゅうがくのせいふく',
};

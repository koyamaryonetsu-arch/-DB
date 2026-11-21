// 第88回 G14班: アナと雪の女王の 品（docs/plan-r88-anime-gear.md の 4-2）
//   作品の 職業（雪の女王・第5のせいれい）は つえ・おうぎ・素手・服・ローブ
//   ・4つの せいれいの しるし（風・火・水・大地。アクセ）… そろい frozen_spirits。1人が 4つ 持つと しょう号「第5のせいれい」
//   ・第5のせいれいのドレス（伝説）… 4つの しるしを 持って、白銀の湖の 北の ほとりの「氷の石の台」へ 行くと もらえる
//     （しるしは なくならない。1人 1回。world/frozen-r88.js・FIFTH_ALTAR）
//   ・トロールのいやしの光 … 使うと 仲間1人の 混乱と ねむりを 治して HPを 回復
//   ・今 ある 雪の女王のローブ・雪の女王のたて・雪の女王の指輪にも 作品を つけた（R88_TAG_FROZEN。強さ・手に入れ方は かえない）
//   名前の 直し（ありふれた 名前には 持ち主を つけた・使える 字）は 設計書の「実装メモ（G14班）」
import { weapon, armor, head, acc, priceUp } from './items-r88-kit.js?v=93a310251ce7';

const F = { work: 'frozen' };
const SP = { work: 'frozen', set: 'frozen_spirits' };
const HINT = '4つそろえて、白銀の湖の北のほとりの、氷の石の台へ行くと……？';

// 4つの せいれいの しるし（そろい）・第5のせいれいのドレス・氷の石の台（シロガネ地方・白銀の湖の 北の ほとり。maps/gacha-r88.js が おく）
export const SPIRIT_MARKS = ['r88_fz_mark_wind', 'r88_fz_mark_fire', 'r88_fz_mark_water', 'r88_fz_mark_earth'];
export const FIFTH_DRESS = 'r88_fz_dress5';
export const FIFTH_ALTAR = { map: 'north', x: 24, y: 51 };
// もらった 記録（キャラの flags。1人 1回。引っこしコードで 運ばれる 短い 名前）
export const FIFTH_FLAG = 'r88fz5';

const GEAR = {
  // ───── エルサ ─────
  r88_fz_icedress: { ...armor('robe', 'mei'), ...F, name: '氷のドレス', fx: [{ k: 'res_ice', v: 5 }], bonus: { mag: 16 }, desc: '「ありのままで」と歌いながら、魔法で作った氷のドレス。ローブと同じあつかい。攻撃魔力が上がる。氷に強い。' },
  r88_fz_gloves: { ...acc('fu3'), ...F, name: 'エルサの手ぶくろ', bonus: { def: 14, mag: -6 }, desc: '氷の力をおさえるための、うすい手ぶくろ。守備力が上がるが、攻撃魔力が下がる。' },
  r88_fz_tiara: { ...head('fu3'), ...F, name: 'たいかん式のティアラ', bonus: { mag: 8 }, desc: '女王になる日に、頭にのせた金のティアラ。攻撃魔力が上がる。' },
  r88_fz_scepter: { ...weapon('staff', 'mei'), ...F, name: '王しゃくと宝じゅ', fx: [{ k: 'el_ice', v: 6 }], bonus: { mag: 10 }, use: { ability: 'r88u_fz_scepter' }, look: 'crystal', desc: '女王になる日に持つ、金のつえと玉。手ぶくろを外して持つと、こおり始める。ふつうの攻撃が氷になる。使うと、敵1グループを氷でつつむ。' },
  // ───── アナ・オラフ・クリストフ・スヴェン ─────
  r88_fz_mantle: { ...armor('cloth', 'fu3'), ...F, name: 'アナのマント', fx: [{ k: 'res_ice', v: 4 }], desc: '雪の山へ、姉を探しに行った妹のマント。だれでも装備できる。氷に強い。' },
  r88_fz_boots: { ...acc('shop'), ...F, name: '冬のブーツ', bonus: { agi: 4 }, desc: '山小屋の店で売っている、あたたかいブーツ。雪の上でも走りやすい。素早さが少し上がる。' },
  r88_fz_nose: { ...weapon('dagger', 'fu3'), ...F, name: 'オラフのにんじんの鼻', fx: [{ k: 'regen', v: 4 }], look: 'dirk', desc: '雪だるまの、オレンジのにんじんの鼻。あたたかいハグで元気になる。行動するたびにHPが少し回復する。' },
  r88_fz_cloud: { ...acc('fu3'), ...F, name: 'オラフの小さな雪雲', fx: [{ k: 'res_fire', v: 4 }], desc: '雪だるまが夏でもとけないように、頭の上にうかぶ小さな雪雲。炎に強い。' },
  r88_fz_pick: { ...weapon('axe', 'fu3'), ...F, name: 'クリストフのピッケル', fx: [{ k: 'crit', v: 4 }], look: 'pick', desc: '氷を切り出す男の人の、氷の山に登るピッケル。会心の一撃が出やすい。' },
  r88_fz_sled: { ...acc('fu3'), ...F, name: 'クリストフのそり', bonus: { agi: 10 }, desc: 'トナカイが引いて、雪の上を走るそり。素早さが上がる。' },
  r88_fz_horn: { ...head('fu3'), ...F, name: 'スヴェンのつの', bonus: { str: 8 }, desc: 'なかよしのトナカイの、大きなつの。力が上がる。' },
  r88_fz_lute: { ...weapon('fan', 'fu3'), ...F, name: 'クリストフのリュート', fx: [{ k: 'regen', v: 4 }], look: 'moon', desc: 'トナカイと話しながらひく、小さなリュート。おうぎと同じあつかい。行動するたびにHPが少し回復する。' },
  // ───── トロール・母の 形見 ─────
  r88_fz_troll: { ...acc('mei'), ...F, name: 'トロールのいやしの光', bonus: { heal: 12 }, use: { ability: 'r88u_fz_troll' }, desc: '岩のようなトロールの長老が、小さな妹のけがを治した光。回復の力が上がる。使うと、仲間1人の混乱とねむりを治して、HPを回復する。' },
  r88_fz_scarf: { ...acc('mei'), ...F, name: 'イドゥナのスカーフ', bonus: { hp: 20 }, resist: { fire: 0.85, ice: 0.85, bolt: 0.85 }, desc: '姉妹の母の形見のスカーフ。4つのせいれいと、まん中に5つめのしるしがある。炎・氷・雷に強い。' },
  // ───── 4つの せいれいの しるし（そろい）─────
  r88_fz_mark_wind: { ...acc('mei'), ...SP, name: '風のせいれいのしるし', bonus: { agi: 6 }, resist: { wind: 0.8 }, desc: `目に見えない風のせいれいのしるし。風に強い。${HINT}` },
  r88_fz_mark_fire: { ...acc('mei'), ...SP, name: '火のせいれいのしるし', fx: [{ k: 'res_fire', v: 5 }], desc: `小さなサラマンダーの、火のせいれいのしるし。炎に強い。${HINT}` },
  r88_fz_mark_water: { ...acc('mei'), ...SP, name: '水のせいれいのしるし', fx: [{ k: 'res_ice', v: 5 }], desc: `水の馬の、水のせいれいのしるし。氷に強い。${HINT}` },
  r88_fz_mark_earth: { ...acc('mei'), ...SP, name: '大地のせいれいのしるし', fx: [{ k: 'def', v: 5 }], desc: `岩のきょ人の、大地のせいれいのしるし。守備力が上がる。${HINT}` },
  // ───── 4つの せいれいの 品 ─────
  r88_fz_gale: { ...acc('mei'), ...F, name: 'ゲイルの風', orb: { el: 'wind' }, bonus: { agi: 4 }, desc: '目に見えない風のせいれいの、いたずらなつむじ風。つけると、武器のふつうの攻撃が風になる。' },
  r88_fz_bruni: { ...acc('mei'), ...F, name: 'ブルーニの炎', orb: { el: 'fire' }, bonus: { mag: 4 }, desc: '小さなサラマンダーの、青い炎。つけると、武器のふつうの攻撃が炎になる。' },
  r88_fz_mane: { ...acc('mei'), ...F, name: '水の馬のたてがみ', bonus: { agi: 14 }, desc: '暗い海を走る、水の馬のたてがみ。素早さが上がる。' },
  r88_fz_rock: { ...weapon('axe', 'mei'), ...F, name: '大地のきょ人の岩', fx: [{ k: 'crit', v: 6 }], look: 'stone', desc: '大地のせいれいの、岩のきょ人が投げる大きな岩。オノと同じあつかい。会心の一撃が出やすい。' },
  // ───── ライバルの 品 ─────
  r88_fz_claw: { ...weapon('claw', 'fu3'), ...F, name: '雪の大男のツメ', fx: [{ k: 'el_ice', v: 4 }], look: 'beast', desc: '雪の女王が作った、雪の大男のつめたいツメ。ふつうの攻撃が氷になる。' },
  r88_fz_hans: { ...weapon('sword', 'fu3'), ...F, name: 'ハンスの剣', fx: [{ k: 'crit', v: 4 }], look: 'broad', desc: '南の島の王子の剣。こおった妹の手にあたって、おれてしまった。会心の一撃が出やすい。' },
  // ───── 第5のせいれいの ドレス（伝説）─────
  r88_fz_dress5: { ...armor('robe', 'den'), ...F, name: '第5のせいれいのドレス', fx: [{ k: 'mpregen', v: 8 }], bonus: { mag: 30, heal: 16, agi: 10 }, resist: { ice: 0.7 }, use: { ability: 'r88u_fz_dress' }, desc: '第5のせいれいになった女王の、白くかがやくドレス。ローブと同じあつかい。行動するたびにMPが回復する。氷に強い。使うと、4つのせいれいの力で、敵全体を氷でつつむ。' },
};
priceUp(GEAR, { r88_fz_boots: 120 });

export const ITEMS_R88_FROZEN = GEAR;
export const R88_REBIRTH_FROZEN = {};
// 今 ある 品を 作品の 品として 数える（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_FROZEN = { c7it_queen_robe: 'frozen', snowqueen_shield: 'frozen', tmd_snow_queen_ring: 'frozen' };

export const R88_FROZEN_KANA = {
  r88_fz_icedress: 'こおりのどれす', r88_fz_gloves: 'えるさのてぶくろ', r88_fz_tiara: 'たいかんしきのてぃあら', r88_fz_scepter: 'おうしゃくとほうじゅ',
  r88_fz_mantle: 'あなのまんと', r88_fz_boots: 'ふゆのぶーつ', r88_fz_nose: 'おらふのにんじんのはな', r88_fz_cloud: 'おらふのちいさなゆきぐも',
  r88_fz_pick: 'くりすとふのぴっける', r88_fz_sled: 'くりすとふのそり', r88_fz_horn: 'すゔぇんのつの', r88_fz_lute: 'くりすとふのりゅーと',
  r88_fz_troll: 'とろーるのいやしのひかり', r88_fz_scarf: 'いどぅなのすかーふ',
  r88_fz_mark_wind: 'かぜのせいれいのしるし', r88_fz_mark_fire: 'ひのせいれいのしるし', r88_fz_mark_water: 'みずのせいれいのしるし', r88_fz_mark_earth: 'だいちのせいれいのしるし',
  r88_fz_gale: 'げいるのかぜ', r88_fz_bruni: 'ぶるーにのほのお', r88_fz_mane: 'みずのうまのたてがみ', r88_fz_rock: 'だいちのきょじんのいわ',
  r88_fz_claw: 'ゆきのおおおとこのつめ', r88_fz_hans: 'はんすのけん', r88_fz_dress5: 'だいごのせいれいのどれす',
};

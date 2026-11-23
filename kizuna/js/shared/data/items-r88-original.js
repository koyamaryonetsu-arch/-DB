// 第88回 G19班: オリジナルの 職業の 品（docs/plan-r88-anime-gear.md の 4-12。もとの 作品が ないので、職業の 説明と 技から 作った）
//   中二病・ダ天使 … 剣・つえ・おうぎ／服・ローブ／かぶとは だめ（ぼうしは よい）
//   光と闇の剣神 … 剣・短剣・オノ／服・重い よろい・道着・ローブ／たて・かぶとも よい
//   天候の 職業（気象予報士・お天気キャスター・天候をあやつる者・天候の神）… つえ・おうぎ／服・ローブ／かぶとは だめ
//   ・夜明けの白い剣と たそがれの黒い剣（伝説 2本）… 両方 持って いると、どちらを つけても 光と 闇の 両方が のる
//     （data/gear-sets.js の kouan_ken。白 ＝ 光の力・黒 ＝ HP吸収 に、もう 片方の 力が 少し 足される）
//   ・禁断のけい約書 … 攻撃魔力が 大きく 上がり、最大HPが 下がる（技「禁断のけい約」と 同じ 形。1-2 の「体に ひびく」）
//   ・空の神の雲の衣（伝説）… 使うと 空を 晴れに する（もしもボックスと 同じ 天気の 効果。仲間の 強化は ない）
//   ・大きなかさ・天気図の指しぼう・じゃ気眼のがんたいの 使う は、職業の 技より 弱い
//   ナミの 天候棒（ワンピース）は G9班が 作った ので ここには ない
//   名前は 技と かぶらない ように した（設定ノート → 黒い設定ノート・黒いつばさ → ダ天使の黒いつばさ）
import { weapon, armor, head, acc, priceUp } from './items-r88-kit.js?v=efa1b5f542af';

const O = { work: 'original' };

const GEAR = {
  // ───── 中二病 ─────
  r88_or_gantai: { ...acc('mei'), ...O, name: 'じゃ気眼のがんたい', bonus: { mag: 14 }, use: { ability: 'r88u_or_jakigan' }, desc: 'ふう印された目をかくしている（と自分で言っている）黒いがんたい。攻撃魔力が上がる。使うと、がんたいをずらして敵1体をにらみ、混乱させることがある。' },
  r88_or_houtai: { ...acc('fu3'), ...O, name: 'ふう印されし右手のほうたい', bonus: { str: 10 }, desc: '右手にぐるぐるまいた、白いほうたい。「この手の力を、ふう印しているのだ…」。力が上がる。' },
  r88_or_maken: { ...weapon('sword', 'mei'), ...O, name: 'しっ黒の魔剣', fx: [{ k: 'el_dark', v: 6 }], look: 'great', desc: '自分で「しっ黒の魔剣」とよんでいる、まっ黒な剣。ふつうの攻撃が闇の力になる。' },
  r88_or_kasa: { ...weapon('staff', 'fu3'), ...O, name: '黒いかさ', fx: [{ k: 'el_dark', v: 4 }], look: 'cane', desc: '晴れの日もさしている、まっ黒なかさ。「光は、わが身をこがすのだ」。ふつうの攻撃が闇の力になる。' },
  r88_or_note: { ...acc('fu3'), ...O, name: '黒い設定ノート', bonus: { mp: 30 }, desc: '自分で考えた、ひみつの設定がびっしり書かれたノート。最大MPが上がる。' },
  r88_or_mantle: { ...armor('robe', 'mei'), ...O, name: '名のりの黒いマント', fx: [{ k: 'evade', v: 6 }], desc: '「我が名は…！」と名のる時に、ばさっとひるがえす黒いマント。敵の攻撃をかわしやすくなる。' },
  // ───── ダ天使 ─────
  r88_or_hane: { ...acc('mei'), ...O, name: '黒い羽根のかざり', fx: [{ k: 'res_dark', v: 6 }], desc: '天から落ちた時に、ぬけた（と言っている）黒い羽根のかざり。闇に強い。' },
  r88_or_tsubasa: { ...armor('robe', 'mei'), ...O, name: 'ダ天使の黒いつばさ', fx: [{ k: 'evade', v: 6 }], desc: 'せなかにつける、大きな黒いつばさ。ローブとして着る。敵の攻撃をかわしやすくなる。' },
  r88_or_wa: { ...acc('fu3'), ...O, name: 'われた天使の輪', bonus: { mag: 10 }, desc: '天使だったころの、頭の上の光の輪。少しわれている。攻撃魔力が上がる。' },
  r88_or_pendant: { ...acc('fu3'), ...O, name: '天使のほほえみのペンダント', fx: [{ k: 'regen', v: 4 }], desc: 'まだ心にのこる、天使のやさしさがこもったペンダント。行動するたびにHPが少し回復する。' },
  r88_or_ochita: { ...weapon('staff', 'mei'), ...O, name: '落ちた光のつえ', fx: [{ k: 'el_dark', v: 6 }], look: 'wing', desc: '天からいっしょに落ちてきた、黒い光をやどすつえ。ふつうの攻撃が闇の力になる。' },
  r88_or_keiyaku: { ...acc('mei'), ...O, name: '禁断のけい約書', bonus: { mag: 32, hp: -60 }, desc: 'やみとの約束が書かれた、古い紙。攻撃魔力が大きく上がる。かわりに、最大HPが下がる。' },
  // ───── 光と闇の剣神 ─────
  r88_or_white: { ...weapon('sword', 'den'), ...O, set: 'kouan_ken', name: '夜明けの白い剣', fx: [{ k: 'el_light', v: 8 }], look: 'holy', desc: '右手に持つ、夜明けの光をやどした白い剣。ふつうの攻撃が光の力になる。たそがれの黒い剣と2本持つと……？' },
  r88_or_black: { ...weapon('sword', 'den'), ...O, set: 'kouan_ken', name: 'たそがれの黒い剣', fx: [{ k: 'drain', v: 8 }], look: 'broad', desc: '左手に持つ、たそがれのやみをやどした黒い剣。敵の力をすいとって、HPが回復する。夜明けの白い剣と2本持つと……？' },
  r88_or_cloak: { ...armor('cloth', 'mei'), ...O, name: '光と闇のマント', fx: [{ k: 'res_dark', v: 6 }], desc: '表が白、うらが黒のマント。光と闇のさかいめに立つ者が着る。だれでも装備できる。闇に強い。' },
  r88_or_kote: { ...acc('mei'), ...O, name: '二刀かまえのこて', bonus: { str: 14 }, desc: '2本の剣を両手でかまえるための、うでを守るこて。力が上がる。' },
  r88_or_kabuto: { ...head('fu3', true), ...O, name: '十字のかぶと', fx: [{ k: 'def', v: 4 }], desc: '光と闇の十字のしるしが入ったかぶと。守備力が上がる。' },
  // ───── 天候の 職業 ─────
  r88_or_teru: { ...acc('fu3'), ...O, name: 'てるてるぼうず', bonus: { heal: 12 }, desc: '「あした天気になあれ」。まどにつるす、白いてるてるぼうず。回復魔力が上がる。' },
  r88_or_bigkasa: { ...weapon('staff', 'fu3'), ...O, name: '大きなかさ', fx: [{ k: 'el_wind', v: 4 }], use: { ability: 'r88u_or_kasa' }, look: 'cane', desc: 'みんなが入れる、大きなかさ。ふつうの攻撃が風の力になる。使うと、仲間全員の守備力が少し上がる。' },
  r88_or_kazami: { ...acc('fu3'), ...O, name: 'かざみどり', fx: [{ k: 'agi', v: 4 }], desc: 'やねの上で、風の向きを教えてくれる鉄のニワトリ。素早さが上がる。' },
  r88_or_shibou: { ...weapon('staff', 'mei'), ...O, name: '天気図の指しぼう', fx: [{ k: 'el_bolt', v: 6 }], use: { ability: 'r88u_or_kaminari' }, look: 'cane', desc: 'テレビで天気図をさす、のびる指しぼう。ふつうの攻撃が雷の力になる。使うと、かみなりマークをはって、敵1体に雷を落とす。' },
  r88_or_taifu: { ...weapon('fan', 'mei'), ...O, name: '台風のおうぎ', fx: [{ k: 'el_wind', v: 6 }], look: 'wing', desc: 'ひとあおぎで、うずまく風をおこすおうぎ。ふつうの攻撃が風の力になる。' },
  r88_or_niji: { ...acc('mei'), ...O, name: 'にじのブローチ', fx: [{ k: 'guard_confuse', v: 6 }], desc: '7色にかがやく、にじの形のブローチ。混乱にかかりにくい。' },
  r88_or_kumo: { ...armor('robe', 'den'), ...O, name: '空の神の雲の衣', bonus: { mag: 30 }, use: { ability: 'r88u_or_hare' }, desc: '空の神が着ている、雲でできた衣。攻撃魔力が大きく上がる。使うと、雲がさっと晴れて、空を晴れにする。' },
};
priceUp(GEAR);

export const ITEMS_R88_ORIGINAL = GEAR;
export const R88_REBIRTH_ORIGINAL = {};
// 光と闇の 2本の 剣（data/gear-sets.js の kouan_ken）
export const KOUAN_SWORDS = ['r88_or_white', 'r88_or_black'];

export const R88_ORIGINAL_KANA = {
  r88_or_gantai: 'じゃきがんのがんたい', r88_or_houtai: 'ふういんされしみぎてのほうたい', r88_or_maken: 'しっこくのまけん', r88_or_kasa: 'くろいかさ',
  r88_or_note: 'くろいせっていのーと', r88_or_mantle: 'なのりのくろいまんと', r88_or_hane: 'くろいはねのかざり', r88_or_tsubasa: 'だてんしのくろいつばさ',
  r88_or_wa: 'われたてんしのわ', r88_or_pendant: 'てんしのほほえみのぺんだんと', r88_or_ochita: 'おちたひかりのつえ', r88_or_keiyaku: 'きんだんのけいやくしょ',
  r88_or_white: 'よあけのしろいけん', r88_or_black: 'たそがれのくろいけん', r88_or_cloak: 'ひかりとやみのまんと', r88_or_kote: 'にとうかまえのこて',
  r88_or_kabuto: 'じゅうじのかぶと', r88_or_teru: 'てるてるぼうず', r88_or_bigkasa: 'おおきなかさ', r88_or_kazami: 'かざみどり',
  r88_or_shibou: 'てんきずのさしぼう', r88_or_taifu: 'たいふうのおうぎ', r88_or_niji: 'にじのぶろーち', r88_or_kumo: 'そらのかみのくものころも',
};

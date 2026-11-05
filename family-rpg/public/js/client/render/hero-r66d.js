// 第66回 D班の 伝説の 職業 5つの みため（docs/plan-r66-legend.md）
// 新しい 絵の ぶひんは 作らず、前の 回の 服・かざり・もちもの（hero-r26.js・hero-r33.js・hero-r40.js・hero-r43j.js の しるし）を
// 色と 組み合わせを かえて つかう。どの え も「それと わかる、でも そのまま うつさない」ゲームの ドットえ（ロゴや 顔は かかない）。
// もとの 超級職より 上の ランクなので、どれも オーラ（hero-aura.js に ある もの）と かざりが ふえる。
//
//  月下のき術師   … かいとうキッドの 白い スーツ・シルクハット・片めがねに、こい 夜空いろの マントの うらと ネクタイ・長い マント・
//                   月の 光の ような 白い きらきら（snow41b）・手に トランプじゅう
//  のぶドラ       … むかしの こい 青の 着ぐるみと フード・ひげ・赤い 鼻・しっぽ・金の きらきら（hof。なつかしい かがやき）
//  かっぱの大王   … 筋肉ニンニクの からだに、大王の 赤い マント・頭に ピンクの 大きな 花・手に キュウリ・金の オーラ
//  真理のとびらをひらく者 … 金の ふちの 白い コート・はがねの 右うで・金の 三つあみ・手ぶくろに 青い れん成の 円・青い れん成の 光（ryuma）
//  ロゼッタ       … 水色の 足もとまでの ドレス・白い 長い 手ぶくろ・金の ブローチと イヤリング・銀の 長い かみ・水色の 石の 王冠・
//                   星の つえ（scepter40）・白く かがやく 星の 光（spirit41b）
//  ギャラクシーマリオ（男の子のロゼッタ） … マリオの 赤い シャツと 青い つなぎ・金の ボタン・こい 夜空いろの マント・星の 光（spirit41b）
//
//   R66D_JOBS      … 職業の id（データとの やくそく）
//   R66D_OUTFIT    … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R66D_BODY      … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R66D_HAT       … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R66D_BODY_HAT  … よろいでも のこる ぼうし（のぶドラの フード・大王の 頭の 花。hero-gear.js で R26_BODY_HAT に まぜる）
//   R66D_OLD_LOOK  … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   R66D_MASC      … 男の子の すがた（ギャラクシーマリオ。hero-r33.js で R43J_MASC に まぜる → masc33）

export const R66D_JOBS = ['gekka', 'nobu_dora', 'kappa_king', 'truth_gate', 'rosetta'];

const NIGHT = '#1a2350';
const RED = '#d8202c', BLUE = '#2a4ec0';

// ───────────── 職業ごとの 服（布の服 の とき） ─────────────
export const R66D_OUTFIT = {
  gekka: { kind: 'suit', main: '#f6f6fa', tie: '#2a3a8a', shirt: NIGHT, pants: '#eceef6', r33: true, cape: '#f8f8fc', capeIn: NIGHT, capeLen: 37.4, drape: true, gloves: true },
  nobu_dora: { kind: 'mascot26', main: '#1a74d8', big: true },
  kappa_king: { kind: 'kappa26', belly: '#fbf2b4', plain: true, muscle: true, cape: '#c8202c', capeLen: 35.6 },
  truth_gate: { kind: 'coat', main: '#f2eee2', lining: '#c89a2a', plain: true, r33: true, crest33: true, shirt: '#1a1820' },
  rosetta: { kind: 'dress', main: '#7ac8f0', trim: '#eaf8ff', r43j: true, gown43j: '#86cff2', glove43j: '#fbfbff', brooch43j: '#f2d23a' },
};

// からだの とくちょう（よろいを きても のこる）。aura は hero-aura.js に ある もの
export const R66D_BODY = {
  gekka: { monocle33: 'clover', prop: 'cardgun33', iris: '#4a6ab8', aura: 'snow41b', r33: true },
  nobu_dora: { whisker: true, nose: true, robotTail: true, aura: 'hof' },
  kappa_king: { skin: 'hana', hair: 'none', noBrow: true, hana: true, shell: 'small', armW: 1.7, bodySX: 1.18, prop: 'cucumber', aura: 'gold' },
  truth_gate: { hair: 'braid33', hcol: 'r33gold', iris: '#d89a1a', mech33: true, circle33: '#3a8ae8', aura: 'ryuma', r33: true },
  rosetta: { hair: 'long', hcol: 'r40silver', iris: '#3ab8e8', ear43j: '#f2d23a', aura: 'spirit41b', prop: 'scepter40', r43j: true },
};

// 布の服の ときの ぼうし
export const R66D_HAT = {
  gekka: { kind: 'silk33', c: '#f8f8fc', band: NIGHT, hides: 'top' },
  rosetta: { kind: 'crown43j', gemc: '#3ab8e8', gem2: '#f2d23a' },
};
// よろいでも のこる ぼうし（からだの いちぶ）
export const R66D_BODY_HAT = {
  nobu_dora: { kind: 'robohood26', c: '#1a74d8', hides: 'all' },
  kappa_king: { kind: 'flower26', hides: 'all' },
};

// 古い 小さな え（chars.js。32×42）
export const R66D_OLD_LOOK = {
  gekka: { outfit: 'suit', cloth: '#f6f6fa', tie: '#2a3a8a', cape: '#f8f8fc', hat: 'cap', hatColor: '#f8f8fc' },
  nobu_dora: { outfit: 'tunic', cloth: '#1a74d8', hat: 'hood', hatColor: '#1a74d8' },
  kappa_king: { outfit: 'gi', cloth: '#9ad65a', giTrim: '#fbf2b4', cape: '#c8202c' },
  truth_gate: { outfit: 'robe', robeMain: '#f2eee2', robeTrim: '#c89a2a' },
  rosetta: { outfit: 'dress', cloth: '#7ac8f0', hat: 'crown', hatColor: '#f2c14e' },
};

// ───────────── 男の子（ギャラクシーマリオ） ─────────────
// 男性（look.body が 1 で ない）の ときだけ、上の 表の かわりに つかう（hero-r33.js の masc33）。マリオの すがた（hero-r43j.js の R43J_MASC）に
// こい 夜空いろの マントと 星の 光。ぼうしの しるしは 金の ふち（mark 2）
export const R66D_MASC = {
  rosetta: {
    outfit: { kind: 'shirt', main: RED, r43j: true, overall43j: BLUE, btn43j: 'gold', glove43j: '#fbfbff', cape: '#24308a', capeLen: 36.0 },
    body: { stache43j: '#3a2216', aura: 'spirit41b', r43j: true },
    hat: { kind: 'cap43j', c: RED, mark: 2, hides: 'top' },
    old: { outfit: 'tunic', cloth: BLUE, hat: 'bbcap', hatColor: RED, cape: '#24308a' },
  },
};

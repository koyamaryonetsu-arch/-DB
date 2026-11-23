// 第88回 G9班: ドラゴンボールの 品（docs/plan-r88-anime-gear.md の 3-1）
//   作品の 職業（サイヤ人・スーパーサイヤ人・2・3）は ツメと 素手・道着と 服・頭は つけられない
//   ・ドラゴンボール 7つ（一星球〜七星球。名品の アクセ。小さな 力）… 世界の 7つの 宝箱に 1つずつ。7つ そろえて 星見の丘の
//     さいだんで 神龍を よぶと、ねがいを 1つ（作品の 名品から 好きな 品を 1つ。data/shenron-r88.js）
//   ・ポタラ … 2人が 1つずつ つけると、戦いの 間 みんなの 力と 魔力が 上がる（そろい potara。rule party）
//   ・今 ある 品（サイヤ人の戦闘服・にょいぼう・きんと雲のかけら）にも 作品を つけた（R88_TAG_DRAGONBALL。強さ・手に入れ方は かえない）
//   作品の 字は 使える 字に 直した（亀仙流 → かめせん流・封 → ふう・仙豆 → せん豆・緊急 → きん急 など。設計書の「実装メモ（G9班）」）
//   入れない 品: 超神水・ニセの 超聖水（設計書 3-1）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=efa1b5f542af';

const D = { work: 'dragonball' };
const B = { work: 'dragonball', set: 'dragon_balls' };

// ドラゴンボール 7つ（星の 数・小さな 力）
const BALL_NUM = ['一', '二', '三', '四', '五', '六', '七'];
const BALL_KANA = ['いー', 'りゃん', 'さん', 'すー', 'うー', 'りゅー', 'ちー'];
const BALL_BONUS = [{ str: 6 }, { def: 6 }, { agi: 6 }, { hp: 24 }, { mag: 6 }, { heal: 6 }, { mp: 12 }];
const BALL_TEXT = ['力が少し上がる', '守備力が少し上がる', '素早さが少し上がる', '最大HPが少し上がる', '攻撃魔力が少し上がる', '回復の力が少し上がる', '最大MPが少し上がる'];
export const DRAGON_BALLS = BALL_NUM.map((_, i) => `r88_db_ball${i + 1}`);

const GEAR = {
  // ───── 悟空と 亀仙人の 修行の 品 ─────
  r88_db_seiryu: { ...weapon('sword', 'shop'), ...D, name: '青竜刀', look: 'scimitar', desc: 'はばの広い、まがった刀。見た目より軽くて、速くふれる。旅の始まりに。' },
  r88_db_kamegi: { ...armor('gi', 'fu3'), ...D, name: 'かめせん流の道着', fx: [{ k: 'hp', v: 4 }], desc: 'せなかに「かめ」の字の入った、オレンジ色の道着。きびしい修行でも、へっちゃら。最大HPが上がる。' },
  r88_db_koura: { ...shield('fu3'), ...D, name: '重いこうら', bonus: { def: 10, agi: -8 }, look: 'shell', desc: '修行のために、せなかにしょう大きなこうら。とても重い。守備力が上がるが、素早さが下がる。' },
  r88_db_omori: { ...acc('fu3'), ...D, name: '重いリストバンドとくつ', bonus: { str: 14, agi: -8 }, desc: '手と足につける、とても重いおもり。外すと体がかるくなる…が、つけていると力がつく。力が上がるが、素早さが下がる。' },
  r88_db_kametsue: { ...weapon('staff', 'fu3'), ...D, name: 'かめせん人のつえ', fx: [{ k: 'mana', v: 4 }], bonus: { mag: 4 }, look: 'cane', desc: '武道の神様とよばれるおじいさんが、いつも持っている木のつえ。攻撃が当たるとMPが少し回復する。' },
  r88_db_suushin: { ...head('fu3'), ...D, name: '四星球のぼうし', fx: [{ k: 'hp', v: 4 }], desc: 'てっぺんに、星が4つの玉をつけたぼうし。おじいちゃんの形見の玉。最大HPが上がる。' },
  r88_db_chichi: { ...head('fu3', true), ...D, name: 'チチのかぶと', fx: [{ k: 'def', v: 4 }], desc: 'つのに、とばせるやいばのついたかぶと。かわいいけれど、あぶない。守備力が上がる。' },
  r88_db_gyumao: { ...weapon('axe', 'mei'), ...D, name: '牛魔王のオノ', fx: [{ k: 'el_fire', v: 6 }], look: 'battle', desc: '火につつまれた山の城の主の、大きなオノ。石もかんたんに切る。ふつうの攻撃が炎になる。' },
  r88_db_jar: { ...shield('mei'), ...D, name: '魔ふうばの電子ジャー', fx: [{ k: 'def', v: 5 }], use: { ability: 'r88u_db_mafuba' }, look: 'round', desc: '大むかしの武道家があみ出した、ふうじこめる技「魔ふうば」で使う、電気のすいはんき。使うと、敵1体を少しの間ふうじこめて、動けなくする（大きな敵にはききにくい）。' },
  r88_db_yajirobe: { ...weapon('sword', 'fu3'), ...D, name: 'ヤジロベーの刀', fx: [{ k: 'slay_beast', v: 4 }], look: 'katana', desc: '食いしんぼうの剣士の刀。大ざるのしっぽを、すぱっと切った。けもの系の敵に大きなダメージ。' },
  r88_db_gohanken: { ...weapon('sword', 'fu3'), ...D, name: 'ピッコロがくれた剣', fx: [{ k: 'slay_dragon', v: 4 }], look: 'broad', desc: 'あれ地で修行する子どもに、きびしい先生がわたした剣。きょう竜から身を守った。ドラゴン系の敵に大きなダメージ。' },
  // ───── ライバルたちの 品 ─────
  r88_db_scouter: { ...head('mei'), ...D, name: 'スカウター', fx: [{ k: 'crit', v: 5 }], bonus: { agi: 4 }, desc: '片目につける、相手の強さをはかる機械。弱い所が見える。会心の一撃が出やすい。' },
  r88_db_suit: { ...armor('gi', 'mei'), ...D, name: '新しい戦闘服', fx: [{ k: 'def', v: 6 }], bonus: { agi: 4 }, desc: '宇宙の軍の、よくのびる新しい戦闘服。かたの所がない、動きやすい形。守備力が上がる。' },
  r88_db_turban: { ...armor('cloth', 'mei'), ...D, name: 'ターバンとマント', fx: [{ k: 'hp', v: 6 }], bonus: { hp: 40, agi: -8 }, desc: '緑のはだの武道家の、白いターバンとマント。とても重い。だれでも装備できる。最大HPがとても上がるが、素早さが下がる。' },
  r88_db_kami: { ...weapon('staff', 'mei'), ...D, name: '神様のつえ', fx: [{ k: 'el_light', v: 6 }], bonus: { mag: 10 }, look: 'healing', desc: '空の上の神殿で、地上を見守る神様のつえ。ふつうの攻撃が光になる。' },
  r88_db_popo: { ...acc('fu3'), ...D, name: 'ミスター・ポポのじゅうたん', bonus: { agi: 16 }, desc: '神殿の番人がのる、魔法のじゅうたん。世界じゅうへ一しゅんでとんでいく。素早さが上がる。' },
  r88_db_senzu: { ...acc('mei'), ...D, name: 'せん豆のふくろ', bonus: { hp: 30, heal: 6 }, use: { ability: 'r88u_db_senzu' }, desc: '塔の上のネコのせん人が育てた、ふしぎな豆のふくろ。1つぶ食べると、10日はおなかがすかない。使うと、自分のHPが全部回復する。' },
  r88_db_trunks: { ...weapon('sword', 'mei'), ...D, name: 'トランクスの剣', fx: [{ k: 'slay_material', v: 6 }], bonus: { agi: 6 }, look: 'broad', desc: '未来から来た少年の剣。機械の体の敵を、まっぷたつにした。物質系の敵に大きなダメージ。' },
  r88_db_stop: { ...acc('mei'), ...D, name: 'きん急停止コントローラー', bonus: { mag: 6, agi: 6 }, use: { ability: 'r88u_db_stop' }, desc: '天才科学者のむすめが作った、人造人間を止める機械。10メートルいないで使う。使うと、敵1体をマヒさせる（大きな敵にはききにくい）。' },
  r88_db_radar: { ...acc('fu3'), ...D, name: 'ドラゴンレーダー', bonus: { agi: 6, mp: 10 }, desc: 'ドラゴンボールの出す電波をさがす機械。持っていると、まだ見つけていない玉のある地方がわかる（冒険のしおり）。' },
  r88_db_capsule: { ...acc('fu3'), ...D, name: 'ホイポイカプセル', bonus: { mp: 30 }, desc: 'ボタンをおして投げると、家も車も出てくる小さなカプセル。最大MPが上がる。' },
  r88_db_halo: { ...head('fu3'), ...D, name: '天使の輪', fx: [{ k: 'res_dark', v: 4 }], desc: 'あの世の人の頭の上に、ふわりとうかぶ光の輪。闇に強い。' },
  r88_db_helmet: { ...head('fu3', true), ...D, name: 'グレートサイヤマンのヘルメット', fx: [{ k: 'guard_confuse', v: 4 }], desc: '正体をかくして町を守る、正義の味方のヘルメット。サングラスつき。混乱にかかりにくい。' },
  r88_db_dabura: { ...weapon('sword', 'mei'), ...D, name: 'ダーブラの剣', fx: [{ k: 'el_dark', v: 6 }], bonus: { str: 6 }, look: 'flame', desc: '魔界の王が手から出す、大きな剣。ふつうの攻撃が闇になる。' },
  r88_db_beerus: { ...acc('mei'), ...D, name: 'はかい神の首かざり', fx: [{ k: 'res_dark', v: 5 }], bonus: { mag: 10 }, desc: 'ねむってばかりの、ネコのような神様の首かざり。攻撃魔力が上がり、闇に強い。' },
  // ───── 伝説 ─────
  r88_db_zsword: { ...weapon('sword', 'den'), ...D, name: 'Zソード', fx: [{ k: 'atk', v: 8 }], bonus: { str: 30, agi: -16 }, look: 'great', desc: 'かい王神の星の岩にささっていた、とても重い伝説の剣。ぬけるのは、とても強い者だけ。力がとても上がるが、素早さが下がる。' },
  r88_db_potara: { ...acc('den'), ...D, set: 'potara', bonus: { str: 60, mag: 60, hp: 90, agi: 30 }, name: 'ポタラ', desc: 'かい王神の耳かざり。力と魔力が大きく上がる。2人が1つずつつけると、戦いの間、力と魔力がもっと上がる。' },
  r88_db_whis: { ...weapon('staff', 'den'), ...D, name: '天使のつえ', fx: [{ k: 'mpregen', v: 6 }], bonus: { mag: 24, heal: 20, agi: 10 }, use: { ability: 'r88u_db_whis' }, look: 'ankh', desc: 'はかい神のおともの天使のつえ。てっぺんに光る玉がうかぶ。行動するたびにMPが少し回復する。使うと、時を3分もどして、自分のHPとMPを元にもどす。' },
};
// ドラゴンボール 7つ（そろいの 組）
BALL_NUM.forEach((n, i) => {
  GEAR[DRAGON_BALLS[i]] = {
    ...acc('mei'), ...B, gacha: false, name: `${n}星球`, bonus: { ...BALL_BONUS[i] },
    desc: `オレンジ色の玉の中に、星が${n}つ光るドラゴンボール。${BALL_TEXT[i]}。7つ集めて星見の丘のさいだんへ持っていくと……？`,
  };
});
// 青竜刀は 店の 品（★1。G4班の しくみで ホシフル村の よろず屋に ならぶ）
priceUp(GEAR, { r88_db_seiryu: 90 });

export const ITEMS_R88_DRAGONBALL = GEAR;
// 生まれ変わりは ない
export const R88_REBIRTH_DRAGONBALL = {};
// 今 ある 品に 作品を つける（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_DRAGONBALL = { battle_suit: 'dragonball', nyoibo: 'dragonball', kinto_cloud: 'dragonball' };

export const R88_DRAGONBALL_KANA = {
  r88_db_seiryu: 'せいりゅうとう', r88_db_kamegi: 'かめせんりゅうのどうぎ', r88_db_koura: 'おもいこうら', r88_db_omori: 'おもいりすとばんどとくつ',
  r88_db_kametsue: 'かめせんにんのつえ', r88_db_suushin: 'すーしんちゅうのぼうし', r88_db_chichi: 'ちちのかぶと', r88_db_gyumao: 'ぎゅうまおうのおの',
  r88_db_jar: 'まふうばのでんしじゃー', r88_db_yajirobe: 'やじろべーのかたな', r88_db_gohanken: 'ぴっころがくれたけん', r88_db_scouter: 'すかうたー',
  r88_db_suit: 'あたらしいせんとうふく', r88_db_turban: 'たーばんとまんと', r88_db_kami: 'かみさまのつえ', r88_db_popo: 'みすたーぽぽのじゅうたん',
  r88_db_senzu: 'せんずのふくろ', r88_db_trunks: 'とらんくすのけん', r88_db_stop: 'きんきゅうていしこんとろーらー', r88_db_radar: 'どらごんれーだー',
  r88_db_capsule: 'ほいぽいかぷせる', r88_db_halo: 'てんしのわ', r88_db_helmet: 'ぐれーとさいやまんのへるめっと', r88_db_dabura: 'だーぶらのけん',
  r88_db_beerus: 'はかいしんのくびかざり', r88_db_zsword: 'ぜっとそーど', r88_db_potara: 'ぽたら', r88_db_whis: 'てんしのつえ',
  ...Object.fromEntries(DRAGON_BALLS.map((id, i) => [id, `${BALL_KANA[i]}しんちゅう`])),
};

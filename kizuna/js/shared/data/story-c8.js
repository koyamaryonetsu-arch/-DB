// 第2部 第8章「千年の約束」第1幕「月の王宮のうらぎり」Step 1・2（A: 世界と物語）の だいほん（story.js で まぜる。applyCh8）
// ※ ネタバレ注意（docs/plan-ch8.md の 5）。王の そばの 大臣ジャハール（ジャファーが もと）が 王を あやつり、ねがいの ランプの 力を ねらう
// Step 1: 第7章クリア（c7_clear）の あと、今の ほしみの丘の トキネ「砂時計が、また 南で 鳴っている」（c8_start）
//   → 今の コガネ地方の 町の 外で 時の砂時計 → 千年前の 緑の王国 → カリムが 砂時計の 光に のって 来る・王の間で 大臣ジャハールと
//   まじないに かかった 王さま → ジャハールは 王さまを つれて 地下の 月の王宮へ → カリムが ゲストに（c8_kingdom）
//   → 王の間の 東の すみの 月の 石板を 王家の たてで 開く → 月の王宮の地下迷宮（c8_moon。千年前 8階・今 7階。maps/c8a-palace.js）
//   → 4階の 休み所で 王女ナディア → 南の 広間で オウムのイアゴン（きまった 戦い c8_vizier_pet。B）（c8_pet。Step 1 の さいご）
// Step 2: 5階より 下へ（c8_deep）→ 5階の 月の 門と 時をこえる手紙（ナディアの 手紙）→ 6階 砂の 滝 → 7階 3つの 鏡と 休み所（大臣の 声）
//   → 8階 月の 玉座の 間: 大臣ジャハール（きまった 戦い c8_jafar。3だん。B）→ ジャハールは ランプの 中へ・黒い 星の かけらが にげる
//   → 王さまが 目を さます → 王の間で（c8_jafar）→「第8章　第2幕へ（続きはアップデートで！）」
// より道「時をこえる手紙」（緑の王国の 2つ）は data/sidequests-c8a.js。魔物・きまった 戦い・品は B（plan-ch8.md の 5-2）。ゲストは カリム
import {
  C8, ARRIVE8, ENTRY8, PF8, NADIA4, VOICE7, WIN8, KING8, MIRROR8, LETTER8, LETTER8_PALACE, NADIA_LETTER, C7_FIELD_ID, SOUTH_ID, STAIR8, c8aMapId,
} from '../maps/c8a-flags.js?v=9a8a9aaa43ce';
import { C7I } from '../maps/c7i-flags.js?v=9a8a9aaa43ce';
import { C8A_POS, bridgeOf } from '../maps/c8a-palace.js?v=9a8a9aaa43ce';
import { C8A_FIELD_POS } from '../maps/c8a-field.js?v=9a8a9aaa43ce';
import { MAPS } from '../maps/index.js?v=9a8a9aaa43ce';
import { FIXED_ENCOUNTERS } from './encounters.js?v=9a8a9aaa43ce';
import { MONSTERS } from './monsters.js?v=9a8a9aaa43ce';
import { applyC8aSide, letterReward8 } from './sidequests-c8a.js?v=9a8a9aaa43ce';
// 第2幕「よみの青い火」（Step 3・4。story-c8b.js）
import { CH8B_STEPS, C8B_OBJ, CH8B_OBJECTIVE_TARGETS, CH8B_OBJECTIVE_TALK, CH8B_PROGRESS, applyCh8b } from './story-c8b.js?v=9a8a9aaa43ce';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
// 物語の 敵（ジャファーが もと。名前は もじり。仲間には ならない）と 手下の オウム（イアーゴが もと）
export const VILLAIN8 = '大臣ジャハール';
export const PET8 = 'オウムのイアゴン';
export const LAMP8 = 'ねがいのランプ';
// きまった 戦いの 魔物の 絵（showMon）: その id の 魔物が いれば それ、いなければ B の むれの はじめの 魔物
export const monOf8 = (id) => (MONSTERS[id] ? id : FIXED_ENCOUNTERS[id]?.group?.[0]?.[0] || id);

// ───── 第8章の すすみかた（STORY_STEPS の 第7章の うしろ。plan-ch8.md の 5-2 の 名前の 約束）─────
export const CH8_STEPS = [C8.start, C8.kingdom, C8.moon, C8.pet, C8.deep, C8.jafar, ...CH8B_STEPS];

// ───── 目標 ─────
export const C8_OBJ = {
  // 第7章クリアの 文（story-c7i.js の C7I_OBJ.clear）は「トキネに会いに行こう」に かえた（前の 文は story-c7.js の OLD_C7_OBJ.clear）
  start: 'コガネ地方（南の砂の国）へ行って、町の外で時の砂時計を使おう。千年前の緑の王国へ',
  arrive: '千年前のコガネ地方。緑の王国（今の王都サファラの場所）へ行ってみよう',
  kingdom: '王の間の東のすみの「月の石板」を、カリムといっしょに調べよう',
  entry: '月の石板が開いた！王の間の東のすみの階段から、地下の「月の王宮」へ',
  moon: '1階。千年前の月の鏡を回すと、今の時代の谷に、光の橋がうかぶ。鏡を回したら、時の砂時計で今へ',
  f2: '2階。千年前の流れる砂にのると、川の中の島へ。島から、今の時代の光の橋で南へわたろう',
  f3: '3階。北の鏡で島への橋を、島の鏡で南への橋をかけよう。南の広間のくずれた谷は、千年前なら歩ける',
  f4: '4階の休み所。いずみで休んで、記録しよう。南の広間で、だれかが待ちぶせている…',
  pet: '黒い砂のかべが消えた！南の広間の階段から、もっと下へ',
  deep: '5階。月の門の先は、千年前は砂の川。今の門は、王家の言葉で開くらしい。4階の王女ナディアに聞いてみよう',
  nadia: '千年前の5階の、月の門のよこの「月の箱」に、ナディアの手紙を入れよう',
  l3bury: '今の時代で、5階の月の箱を開けてみよう（千年前の手紙が、のこっているはず）',
  l3found: '月の門が開いた！今の時代の門を通って、東のへやへ。そこに下への階段がある',
  f6: '6階。北の鏡で川の橋を。中の広間から、千年前の砂の滝の通路へ（砂がふっていないすきに進もう）',
  f7: '7階。3つの鏡で、島から島へ光の橋をつなごう。おくに休み所がある',
  rest7: '7階の休み所で、じゅんびを整えよう。下の玉座の間に、ジャハールがいる…',
  f8: '月の玉座の間に、大臣ジャハールがいる…（じゅんびを整えてから進もう）',
  win: '玉座の間の、ねがいのランプを調べよう（続きが見られる）',
  king: '緑の王国の王の間で、王さまに話しかけよう',
  // 第8章 第1幕の さいご・第2幕の はじまり（前の 版の 文「第8章　第2幕へ（続きはアップデートで！）」は OLD_C8_OBJ.jafar。第2幕の 目標は story-c8b.js の C8B_OBJ）
  jafar: '第8章　第1幕クリア！今のほしみの丘のトキネに会いに行こう（時の砂時計が、また鳴っているらしい…）',
};
// 今の 目標の 文から 外した 文（今は 知らない 文なので repairObjective が すすみぐあいから なおす。あとの 幕で ふえる）
export const OLD_C8_OBJ = {
  jafar: '第8章　第2幕へ（続きはアップデートで！）',
};
export { C8B_OBJ };

// パーティー全員で 見る イベント
export const CH8_STORY_SCRIPTS = ['c8a_arrive', 'c8a_kingdom_arrive', 'c8a_slab', 'c8a_f1', 'c8a_f4', 'c8a_nadia_meet', 'c8a_pet_event', 'c8a_voice7', 'c8a_boss_event', 'c8a_boss_after', 'c8a_box_now', 'c8a_box_past'];

// ───────────── 今の ほしみの丘の トキネ（c8_start）─────────────
function tokineCh8() {
  return [
    ...S('トキネ', '{name}、おかえりなさい。', '千年前の4人の約束…わたし、ちゃんと聞いていたわ。'),
    ...S('トキネ', '…でもね、時の砂時計が、また鳴っているの。', 'こんどは、南。コガネ地方のほうから…さらさらと、砂の流れる音がする。'),
    ...S('トキネ', 'カイの心からにげた、黒い星のかけら。', 'あのかけらが、千年前の時の流れの中を、ゆっくり動いているの。\n…まるで、何かを集めているみたいに。'),
    ...S('トキネ', '千年前の「ふういんの日」は、もうすぐ。', 'それまでに、かけらが何をしようとしているのか、つきとめなくちゃ。'),
    ...S('トキネ', 'コガネ地方の、町の外で、砂時計を使ってみて。', '…カリムの緑の王国が、しんぱいだわ。'),
    ['sfx', 'sparkle'],
    ['flag', C8.start], ['sync'],
    ['objective', C8_OBJ.start],
    ...N('（コガネ地方の、町の外で時の砂時計を使うと、千年前のコガネ地方へ行ける。王都サファラの北の門の外が、ちょうどいい）'),
  ];
}

// ───────────── 千年前の コガネ地方に 着いた（第8章の はじまり）─────────────
const arriveSteps = () => [
  ['chapter', '第8章　千年の約束', '第1幕　月の王宮のうらぎり'],
  ...N('緑の森と、すきとおった川…。', '千年前のコガネ地方に、また来た。'),
  ...N('…けれど、空のどこかが、うっすらと、くらい。', '南の緑の王国の上に、まだ昼なのに、白い月が見える。'),
  ...S('トキネの声', '（あの月…なんだか、いやな光ね。\n緑の王国へ、急ぎましょう）'),
  ['flag', ARRIVE8], ['sync'],
  ['objective', C8_OBJ.arrive],
];

// ───────────── 緑の王国に 着いた → 王の間（c8_kingdom）─────────────
function kingdomSteps() {
  const H = C8A_FIELD_POS.hall, TH = C8A_FIELD_POS.throne;
  const [hx, hy] = [H.x + 0.5, H.y + 0.5];
  const [tx, ty] = [TH.x + 0.5, TH.y + 0.5];
  return [['call', async (run) => {
    const s = run.init;
    const [px, py] = [s.x, s.y];
    await run.runSteps([
      ['bgm', null],
      ...N('緑の王国だ…。', 'でも、町の人たちは、なんだか元気がない。\nみんな、ひそひそ話をしている…。'),
      ['sfx', 'sparkle'], ['flash'],
      ['actor', 'karim_e', { sprite: 'karim', x: px + 1.4, y: py + 0.3, dir: 'left' }],
      ...S('カリム', '{name}！…ぼくも、来たよ。'),
      ...S('カリム', 'トキネにたのんで、砂時計の光にのせてもらったんだ。', '王国のことが、どうしても気になって…。\nいっしょに、城へ来てくれるかい？'),
      ['fade', 'out'],
      ['remove', 'karim_e'],
      ['teleport', C7_FIELD_ID, hx, hy, 'down'],
      ['hideNpc', 'c7_king'], ['hideNpc', 'c7_minister'],
      ['actor', 'karim_e', { sprite: 'karim', x: hx + 1.2, y: hy, dir: 'down' }],
      ['actor', 'king_e', { sprite: 'c8a_king', x: tx, y: ty, dir: 'up' }],
      ['actor', 'jahar_e', { sprite: 'c8a_jahar', x: tx + 2, y: ty - 1, dir: 'up' }],
      ['fade', 'in'],
      ['bgm', 'c8a_palace'],
      ...S('カリム', '王さま！カリムです。\n紋章の子らを、おつれしました！'),
      ...S('緑の王', '……。', '…よく…来た…。'),
      ...N('王さまの目は、ぼんやりとして、どこも見ていないようだ…。'),
      ...S(VILLAIN8, 'これはこれは、騎士どの。', 'わたくしは、王さまの新しい大臣、ジャハールと申します。'),
      ...N('黒と赤の長いローブ。手には、へびの頭のつえ。\nかたには、赤いオウムが、ちょこんととまっている。'),
      ...S('赤いオウム', 'ギャギャッ！\nジャハールさまに、ごあいさつしろー！'),
      ...S(VILLAIN8, 'おだまり、イアゴン。', '…王さまは、たいそう、おつかれでしてな。\nお話は、わたくしが、うかがいましょう。'),
      ...S('カリム', '王さま、どうなさったのです！？'),
      ...S('緑の王', '…ジャハールの…言うとおりに…。', 'ジャハールの…言うとおりに…。'),
      ...S(VILLAIN8, 'ほうら、ね。', 'さて、王さま。今夜は、千年に一度の「月の満ちる夜」。\n地下の「月の王宮」で、大事なおいのりがございます。まいりましょう。'),
      ...S('赤いオウム', 'まいりましょう！まいりましょう！\nギャッギャッギャッ！'),
      ['sfx', 'dark'], ['flash'],
      ['remove', 'king_e'], ['remove', 'jahar_e'],
      ...N('ジャハールが、へびのつえをふると、黒い砂がまい上がった…！', '砂がおさまると、王さまとジャハールのすがたは、消えていた。'),
      ['sfx', 'door'], ['shake'],
      ...N('王の間の東のすみで、ゴトン…と、石がしまる音がした。'),
      ['face', 'karim_e', 'left'],
      ...S('カリム', '王さま…！', 'あの目…まるで、ゆめの中にいるみたいだった。\nジャハールが、何かのまじないを…！'),
      ['actor', 'minister_e', { sprite: 'c7_minister', x: hx - 1.4, y: hy + 0.6, dir: 'right' }],
      ...S('城の大臣', 'カリム！もどったか…！'),
      ...S('城の大臣', 'あのジャハールという男、ひと月前に、どこからともなくあらわれてのう。', 'あっというまに、王さまの心を、あやつってしもうた。\n…わしは、もう王さまのおそばに、近よらせてももらえん。'),
      ...S('城の大臣', '王女ナディアさまも、きのうから、すがたが見えんのじゃ…。'),
      ...S('カリム', 'ナディアまで…！'),
      ...S('城の大臣', 'ジャハールは、毎ばん、王の間の東のすみの「月の石板」の下へ、下りていく。', '石板の下には、むかしの王さまが作った、地下の「月の王宮」があるという。\n…あの石板は、王家の紋章でしか、開かぬはずなのじゃが。'),
      ...S('カリム', '王家の紋章…。', '…このたてにも、王家の紋章が、きざまれている！'),
      ['face', 'karim_e', 'down'],
      ...S('カリム', '{name}。ぼくは、王さまを助けたい。', 'ぼくのたてで、みんなの前に立つ。\n…もう一度だけ、いっしょに戦ってくれるかい？'),
      ['remove', 'minister_e'], ['hideNpc', 'c7_minister', false],
      ['remove', 'karim_e'],
      ['call', async (r2) => {
        const keys = r2.owner.char.partyKeys || [];
        if (keys.includes('npc_karim')) await r2.runSteps(N('（カリムは、もう、パーティーの仲間として、いっしょにいる）'));
        else await r2.runSteps([['guest', 'karim'], ['sfx', 'join'], ...N('（カリムが、パーティーに加わった！）')]);
      }],
      ['flag', C8.kingdom], ['sync'],
      ['objective', C8_OBJ.kingdom],
      ['bgm', 'resume'],
    ]);
  }]];
}

// ───────────── 王の間の 月の 石板（千年前。王家の たてで 開く → ENTRY8）─────────────
function slabSteps(x) {
  if (x.flag(ENTRY8)) return [];
  if (!x.flag(C8.kingdom)) return N('月のもようが、きざまれた石板だ。', 'びくともしない…。');
  return [
    ['bgm', null],
    ...N('ゆかに、まるい月のもようが、きざまれた石板がある…。'),
    ['actor', 'karim_e', { sprite: 'karim', x: STAIR8.x - 0.5, y: STAIR8.y + 1.4, dir: 'up' }],
    ...S('カリム', 'これが、月の石板…。', '王家の紋章よ…ぼくのたてに、こたえてくれ！'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('カリムのたての紋章が、月の光のように、白くかがやいた！'),
    ['sfx', 'rumble'], ['shake'],
    ['flag', ENTRY8], ['sync'],
    ...N('ゴゴゴ…。', '石板が、ゆっくりと横へずれて、地下へつづく階段があらわれた！'),
    ...S('カリム', '…行こう。王さまと、ナディアを、助けに。'),
    ['remove', 'karim_e'],
    ['objective', C8_OBJ.entry],
    ['bgm', 'resume'],
  ];
}
function slabNowSteps(x) {
  if (x.flag(C8.moon)) return [];
  return [
    ...N('宮殿の王の間のすみに、古い石板がある。', 'うすく、まるい月のもようが、のこっている…。'),
    ...S('トキネの声', '（千年前の緑の城にも、同じ所に、同じ石板があった気がするわ）'),
  ];
}

// ───────────── 地下迷宮の 階に 来た ときの ことば ─────────────
const isPast = (run) => !!MAPS[run.init.map]?.past;
const PF_TEXT = {
  1: () => [
    ['call', async (run) => {
      await run.runSteps(isPast(run)
        ? [
          ...N('ひんやりとした、地下の宮殿だ…。', '天じょうの小さなまどから、白い月の光が、すうっとさしこんでいる。'),
          ...S('カリム', 'ここが「月の王宮」…。\n王家のむかし話でしか、聞いたことがなかった。'),
          ...N('南のゆかの先を、砂の川が、さらさらと流れている。\n川の手前には、大きな銀の鏡が立っている…。'),
        ]
        : N('古い地下の宮殿だ…。', '天じょうのすきまから、月の光が、ほそくさしこんでいる。'));
    }],
    ...S('トキネの声', '（今の時代のこの場所は、サファラの宮殿の地下ね。\n千年のあいだに、砂の川は、かれて、深い谷になっているはず）'),
    ...S('トキネの声', '（あの月の鏡…千年前で向きをかえたら、千年たっても、そのままかも。\n今の時代の月の光が、鏡ではね返ったら…）'),
    ...S('トキネの声', '（家族といっしょなら、千年前の組と、今の組に、分かれると早いわ。\nリーダーが砂時計で「ひとりで」時をこえてね。今の宮殿の王の間からも、ここへ来られるようになるはず）'),
    ['flag', C8.moon], ['sync'], ['objective', C8_OBJ.moon],
  ],
  2: () => [
    ...N('ザザザ…。', 'ゆかの上を、砂が、川のように流れている。'),
    ...S('トキネの声', '（千年前の流れる砂にのると、川の中の島まで運んでもらえそう。\n今の時代では、砂の流れが止まり、砂山になっているわね）'),
    ['flag', PF8(2)], ['sync'], ['objective', C8_OBJ.f2],
  ],
  3: () => [
    ...N('大きな砂の川の中に、島がうかんでいる…。', '島の上にも、月の鏡が立っている。'),
    ...S('カリム', '鏡が2つ…。\nどちらの鏡を、どっちに向けるか、よく考えよう。'),
    ['flag', PF8(3)], ['sync'], ['objective', C8_OBJ.f3],
  ],
  4: () => [
    ['bgm', null],
    ...N('すずしい風がふいている…。', 'へやのまん中で、いずみの水が、こんこんとわいている。'),
    ...S('トキネの声', '（ここは、休み所みたいね。\nいずみで休んで、記録しておきましょう）'),
    ['flag', PF8(4)], ['sync'], ['objective', C8_OBJ.f4],
    ['bgm', 'resume'],
  ],
  5: () => [
    ...N('へやのまん中に、大きな月の門がある…。', '門のまわりに、古い文字が、ぐるりときざまれている。'),
    ['call', async (run) => {
      await run.runSteps(isPast(run)
        ? S('トキネの声', '（千年前の門は、開いているわ。\n…でも、その先は、深い砂の川ね）')
        : S('トキネの声', '（今の時代の門は、しまっているわ。\n「王家の言葉を、聞かせよ」…と、書いてある）'));
    }],
    ['flag', C8.deep], ['sync'],
    ['if', (x) => x.flag(LETTER8.found(LETTER8_PALACE)), [['objective', C8_OBJ.l3found]], [['if', (x) => x.flag(LETTER8.bury(LETTER8_PALACE)), [['objective', C8_OBJ.l3bury]], [['if', (x) => x.flag(LETTER8.start(LETTER8_PALACE)), [['objective', C8_OBJ.nadia]], [['objective', C8_OBJ.deep]]]]]]],
  ],
  6: () => [
    ...N('ザアアア…。', '天じょうのあなから、砂の滝が、かわりばんこに、ふりそそいでいる！'),
    ...S('トキネの声', '（砂がふっていないすきに、1歩ずつ進みましょう。\nあいだのゆかなら、だいじょうぶ）'),
    ['flag', PF8(6)], ['sync'], ['objective', C8_OBJ.f6],
  ],
  7: () => [
    ...N('いくつもの鏡が、月の光を受けて、きらきらとかがやいている…。', '川の中に、島が2つ。おくには、明るいへやが見える。'),
    ...S('カリム', '鏡が3つ…！\n1つ回すと、べつの橋が消えるかもしれない。あわてずに行こう。'),
    ['flag', PF8(7)], ['sync'], ['objective', C8_OBJ.f7],
  ],
  8: () => [
    ['bgm', null],
    ...N('しんと、しずまりかえった、月の玉座の間…。', 'おくの台の上で、金色のランプが、あやしく光っている。'),
    ['flag', PF8(8)], ['sync'], ['objective', C8_OBJ.f8],
    ['bgm', 'resume'],
  ],
};

// かべ画（千年前は できたばかり・今は 半分 くずれている）
const MURAL = {
  1: (past) => (past ? N('かべ画だ。月と、大きな鏡と、光の橋の絵。', '「月の光を、鏡でみちびけ。光のあるところに、道はうかぶ」') : N('かべ画は、半分くずれている…。', '「千年たっても、鏡は、向きをわすれない」')),
  2: () => N('かべ画だ。砂の川の上を、ふねのように流れていく人の絵…。', '「流れる砂は、行きはよいよい、帰りは島から」'),
  3: () => N('かべ画だ。2つの鏡が、光をうけわたしている。', '「1つめの光で島へ。2つめの光で岸へ」'),
  4: (past) => (past ? N('かべ画だ。王さまと王女が、月を見上げている。', '「月の子守歌は、王家の子だけが知る」') : N('かべ画だ。王家の親子の絵が、うすくのこっている…。', '「歌は、時をこえる」')),
  5: () => N('かべ画だ。月の門と、小さな箱の絵…。', '「王家の言葉は、千年たっても、門が覚えている」'),
  6: () => N('かべ画だ。天じょうから、砂の滝がふっている。', '「砂のやむ間を、1歩ずつ」'),
  7: () => N('かべ画だ。3つの鏡と、3本の光の橋…。', '「回すと、消える橋もある。順番をまちがえるな」'),
};

// 休み所の いずみ
const fontSteps = () => [
  ...N('いずみだ。すきとおった水が、こんこんとわいている…。'),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('いずみの水が、体にしみわたった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
    [],
  ]],
];

// ───────────── 月の 鏡（千年前で 回す。今は 千年前の むきの まま）─────────────
const dirName = (on) => (on ? '「＼」' : '「／」');
function mirrorSteps(n, k) {
  const f = MIRROR8(n, k);
  return [['call', async (run) => {
    const x = (fl) => !!run.owner.char.flags[fl];
    const on = x(f);
    await run.runSteps([
      ...N(`大きな銀の月の鏡だ。今は${dirName(on)}の向きをしている。`),
      ['choice', '鏡を回す？', ['回す', 'やめる'], [
        [
          ['sfx', 'door'],
          ['toggle', f],
          ...N('ギギギ…。', `鏡が回って、${dirName(!on)}の向きになった。`),
          ['sync'],
          ...S('トキネの声', on ? '（向きがもどったわ。\n今の時代の光の橋も、もどっているはず）' : '（鏡の向きがかわったわ。\n今の時代の光の橋も、かわっているはずよ）'),
        ],
        [],
      ]],
    ]);
  }]];
}
function mirrorNowSteps() {
  return [['call', async (run) => {
    const map = MAPS[run.init.map];
    const n = map?.c8aFloor;
    const s = run.init;
    const P = C8A_POS[n];
    let k = 0;
    if (P) {
      let best = 1e9;
      P.mirrors.forEach((c, i) => { const d = Math.abs(c.x + 0.5 - s.x) + Math.abs(c.y + 0.5 - s.y); if (d < best) { best = d; k = i; } });
    }
    const on = !!run.owner.char.flags[MIRROR8(n, k)];
    await run.runSteps([
      ...N(`古い月の鏡だ。${dirName(on)}の向きのまま、さびついて、動かない。`, '鏡ではね返った月の光が、谷の上に、光の橋をかけている…。'),
      ...S('トキネの声', '（千年前の時代なら、この鏡を回せるはずよ）'),
    ]);
  }]];
}

// ───────────── 4階: 王女ナディア（休み所で 会う・ナディアの手紙）─────────────
function nadiaMeet() {
  const P = C8A_POS[4].nadia;
  const [nx, ny] = [P.x + 0.5, P.y + 0.5];
  return [
    ['bgm', null],
    ['look', nx, ny],
    ...N('いずみのかげで、だれかが、ふるえている…。'),
    ...S('王女ナディア', 'だ、だれ！？\n…ジャハールの手下なら、こ、こわくなんか…'),
    ...S('カリム', 'ナディア！ぼくだよ、カリムだ！'),
    ...S('王女ナディア', 'カリム…！？', '…もう、おそいわよ！\nわたし、ずっと、ひとりで、がんばってたんだから！'),
    ...S('王女ナディア', 'お父さまのようすが、へんだったから…ジャハールのあとをつけて、ここまで来たの。', 'お父さまは、もっと下の「月の玉座の間」へ、つれていかれたわ。'),
    ...S('王女ナディア', 'ジャハールはね、玉座の間の「ねがいのランプ」を、ねらっているの。', '千年に一度の満月の夜、どんなねがいでも、かなえるっていう…。'),
    ...S('カリム', 'むちゃをするなよ、ナディア。\n…でも、ありがとう。'),
    ...S('王女ナディア', 'この下の広間には、ジャハールのオウムが、見はりをしているわ。', '気をつけてね、カリム。…それから、紋章の子たちも。'),
    ['look'],
    ['flag', NADIA4], ['sync'],
    ['bgm', 'resume'],
  ];
}
function nadiaSteps(x) {
  const L = LETTER8_PALACE;
  if (x.flag(C8.jafar) || x.flag(KING8)) return S('王女ナディア', 'お父さま、元気になったの！', 'ありがとう、紋章の子たち。\n…カリムのことも、よろしくね。');
  if (x.flag(WIN8)) return S('王女ナディア', '玉座の間のほうから、温かい月の光が…！', 'お父さまのところへ、早く！');
  if (x.flag(LETTER8.found(L))) return S('王女ナディア', '月の門が、開いたのね！', 'わたしの歌、千年たっても、ちゃんと、とどいたんだ…。\nお父さまを、おねがい。');
  if (x.flag(LETTER8.bury(L))) return S('王女ナディア', '手紙は、月の箱に入れてくれた？', 'あの箱は、王家のお守り。千年たっても、こわれないの。\n今の時代で、箱を開けてみて。');
  if (x.flag(LETTER8.start(L))) {
    return [
      ...S('王女ナディア', '5階の月の門の、よこの「月の箱」よ。', '千年前のうちに、そこへ手紙を入れておいてね。'),
      ...(x.has(NADIA_LETTER) ? [] : [['item', NADIA_LETTER, 1], ...N('（ナディアは、もう一度、手紙を書いてくれた）')]),
    ];
  }
  if (!x.flag(C8.deep)) {
    if (!x.flag(C8.pet)) return S('王女ナディア', 'この下の広間に、ジャハールのオウムがいるわ。', 'いずみで休んでから、行ってね。');
    return S('王女ナディア', 'オウムを、やっつけたの！？すごい！', 'この下には、大きな「月の門」があるらしいわ。');
  }
  return [
    ...S('王女ナディア', '月の門が、開かない…？', '…あの門はね、王家の子どもだけが知っている「月の子守歌」の、最後の一行で開くの。'),
    ...S('王女ナディア', 'え？あなたたち、未来から来たの？', '…未来なら、砂の川は、かれているかも。\nでも、門は、きっと、しまったまま…。'),
    ...S('王女ナディア', 'そうだ！\n子守歌の最後の一行を、手紙に書くわ。', '門のよこの「月の箱」に入れておけば、\n千年先まで、ちゃんとのこるはず！'),
    ['sfx', 'item'],
    ...N('ナディアは、かみかざりのペンで、さらさらと手紙を書いて、{name}にわたした。'),
    ['item', NADIA_LETTER, 1],
    ['flag', LETTER8.start(L)], ['sync'],
    ...S('カリム', 'ナディアの子守歌か…。\n小さいころ、よく、歌ってくれたっけ。'),
    ...S('王女ナディア', 'も、もう！\nよけいなことは、言わなくていいの！'),
    ['objective', C8_OBJ.nadia],
  ];
}

// ───────────── 4階: オウムのイアゴン（c8_vizier_pet → c8_pet。Step 1 の さいご）─────────────
function petEvent() {
  const P = C8A_POS[4].pet;
  return [
    ['bgm', null],
    ['look', P.x + 0.5, P.y],
    ...N('広間のまん中に、大きな赤いオウムが、羽を広げている…！'),
    ...S(PET8, 'ギャギャーッ！\nここから先は、とおさないぞ！'),
    ...S(PET8, 'おれさまは、ジャハールさまの、いちの子分！\nオウムのイアゴンさまだ！'),
    ...S('カリム', 'さっきの、かたにのっていたオウムか！？\n…ずいぶん、大きくなったな。'),
    ...S(PET8, 'ジャハールさまの、まじないで、大きくしてもらったのさ！', 'おまえたちなんか、ひとのみだ！\n…あ、ちがう。オウムは、ひとのみしない。…ひとつつきだ！'),
    ...S(PET8, 'ジャハールさまの、だいじな、だいじな、ねがいごとの、じゃまはさせないぞ！\nギャギャッ！'),
    ['showMon', monOf8('c8_vizier_pet')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'c8_vizier_pet'],
    ['bgm', null],
    ['hideNpc', 'c8a_parrot_npc'],
    ...N('イアゴンは、ぽんっ！と、もとの小さなオウムにもどった。'),
    ...S(PET8, 'ギャー！覚えてろー！', '…オウムだから、ぜったい、ぜったい、覚えてるからなー！'),
    ...N('イアゴンは、パタパタと、下の階へにげていった…。'),
    ['sfx', 'door'], ['shake'],
    ['flag', C8.pet], ['sync'],
    ...N('広間のおくの、黒い砂のかべが、さらさらと、くずれて消えた！'),
    ...S('カリム', 'ジャハールのまじないが、ひとつ、とけたんだ。', '…王さまは、もっと下だ。急ごう、{name}！'),
    ['objective', C8_OBJ.pet],
    ['bgm', 'resume'],
  ];
}

// ───────────── 5階: 月の 門と 月の 箱（時をこえる手紙。千年前で 入れる → 今で 読む）─────────────
function boxPastSteps(x) {
  const L = LETTER8_PALACE;
  if (x.flag(LETTER8.bury(L))) return N('門のよこの、月の箱だ。', 'しっかりと、ふたがしまっている。\n（ナディアの手紙は、この中で、千年先を待っている）');
  if (!x.has(NADIA_LETTER)) {
    return [
      ...N('門のよこの、小さな月の箱だ。', '中は、からっぽだ。'),
      ...S('トキネの声', '（王家の言葉を知っている人が、どこかにいないかしら。\n4階の休み所に、王女さまがいたわね…）'),
    ];
  }
  return [
    ...N('門のよこの、小さな月の箱だ。'),
    ['choice', 'ナディアの手紙を、月の箱に入れる？', ['入れる', 'やめる'], [
      [
        ['takeItem', NADIA_LETTER, 1],
        ['sfx', 'door'],
        ...N('…カチン。', '手紙を入れると、月の箱のふたが、ひとりでにしまった。'),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（時をこえる手紙ね。\n…今の時代で、この箱を開けてみて）'),
        ['flag', LETTER8.bury(L)], ['sync'],
        ['objective', C8_OBJ.l3bury],
      ],
      [],
    ]],
  ];
}
// 今: 月の 箱の 千年前の 手紙を 読むと、月の 門が 王家の 言葉で 開く（ごほうびは この 時に 1回だけ）
function letterFoundSteps() {
  const reward = letterReward8(LETTER8_PALACE);
  return [
    ...N('古い月の箱が、ほんのりと光っている…！'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('ふたを開けると、中から、千年前の手紙が出てきた…！', '紙は、少しも、いたんでいない。'),
    ...N('「月の門よ、王家の歌を聞いて。\n『月の光は、ねむる子を、やさしく守る』\n――ナディアより」'),
    ...N('{name}は、門に向かって、手紙の言葉を、そっと歌うように、よびかけた。'),
    ...N('「月の光は、ねむる子を、やさしく守る」…。'),
    ['sfx', 'rumble'], ['shake'],
    ['flag', LETTER8.found(LETTER8_PALACE)], ['sync'],
    ...N('ゴゴゴ…。', '月の門が、ゆっくりと開いた！'),
    ...N('手紙のおくに、小さな字で、もう一行。\n「千年先のだれかへ。わたしの小さな宝物も、どうぞ」'),
    ...reward.map(([id, n]) => ['item', id, n]),
    ...S('トキネの声', '（ナディアさんの歌が、千年たって、とどいたのね…！）'),
    ['objective', C8_OBJ.l3found],
  ];
}
function boxNowSteps(x) {
  const L = LETTER8_PALACE;
  if (x.flag(LETTER8.found(L))) return N('古い月の箱だ。', '中は、からっぽになっている。');
  if (!x.flag(LETTER8.bury(L))) return N('古い月の箱だ。', 'ふたが、かたくしまっていて…中には、何も入っていないようだ。');
  return letterFoundSteps();
}
function gateNowSteps(x) {
  const L = LETTER8_PALACE;
  if (x.flag(LETTER8.found(L))) return [];
  if (x.flag(LETTER8.bury(L))) return letterFoundSteps();
  return [
    ...N('大きな月の門だ。', '門のまん中に、文字がきざまれている。\n「王家の言葉を、聞かせよ」'),
    ...S('トキネの声', '（王家の言葉…？\n千年前の王家の人なら、知っているかしら）'),
  ];
}

// ───────────── 7階: 休み所の 入口で 大臣の 声 ─────────────
function voice7Steps() {
  return [
    ['bgm', null],
    ['sfx', 'dark'],
    ...N('…どこからか、声がひびいてくる。'),
    ...S('ジャハールの声', 'ふふふ…月が、のぼる…。', 'ランプよ、もうすぐだ。\nわたしのねがいを、かなえてもらうぞ…！'),
    ...N('…その声のうしろで、もう1つ、ひくい声が、ささやいた。'),
    ...S('ひくい声', '…もっと…もっと、よくばれ…。'),
    ...S('カリム', '今の声…ジャハールだけじゃない…？'),
    ...S('トキネの声', '（もっと深くて、つめたい声…。\nどこかで、聞いたことがあるような…）', '（{name}、いずみで休んで、じゅんびを整えてから行きましょう）'),
    ['flag', VOICE7], ['sync'], ['objective', C8_OBJ.rest7],
    ['bgm', 'resume'],
  ];
}

// ───────────── 8階: 大臣ジャハール（c8_jafar）→ さいごの 場面 ─────────────
function bossEvent() {
  const P = C8A_POS[8];
  const [jx, jy] = [P.jahar.x + 0.5, P.jahar.y + 0.5];
  const [kx, ky] = [P.king.x + 0.5, P.king.y + 0.5];
  return [
    ['bgm', null],
    ['look', jx, jy - 2],
    ...N('金色のランプの前に、ジャハールが立っている。', 'そのそばで、王さまが、ぼんやりと月を見上げている…。'),
    ['actor', 'karim_e', { sprite: 'karim', x: jx - 1, y: jy + 3, dir: 'up' }],
    ...S('カリム', 'ジャハール！\n王さまを、返してもらうぞ！'),
    ...S(VILLAIN8, 'おやおや、騎士どの。\nイアゴンを、やぶってきたか。', '…だが、もう、おそい。月は、満ちた！'),
    ['sfx', 'sparkle'], ['flash'],
    ...S(VILLAIN8, '見よ！これが、千年に一度だけ光る「ねがいのランプ」！', '王の心をあやつり、王家の紋章を手に入れ…\nわたしは、このランプで、この国の王になる！'),
    ...S(VILLAIN8, '…いや、王だけでは、足りぬ。', 'ランプの中から、声がしたのだ。\n「もっと、もっと、欲ばれ」…とな。'),
    ...S(VILLAIN8, 'ならば、ねがおう！\nこの世界の、すべてを、わたしのものに！'),
    ...S('カリム', '人の心をあやつって手に入れたものなんて、何ひとつ、ほんものじゃない！', '{name}！いっしょに戦ってくれ！'),
    ...S(VILLAIN8, 'こしゃくな！\nへびのつえの力、見せてくれよう！'),
    ['remove', 'karim_e'],
    ['showMon', monOf8('c8_jafar')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'c8_jafar'],
    ['bgm', null],
    ['hideNpc', 'c8a_jahar'],
    ['flag', WIN8], ['sync'],
    ['objective', C8_OBJ.win],
    ...afterBoss(),
  ];
}
// ジャハールが ランプの 中へ・黒い 星の かけらが にげる・王さまが 目を さます → 王の間へ。とちゅうで 切れたら 8階の 広間・ランプで 続き
function afterBoss() {
  const P = C8A_POS[8];
  const [lx, ly] = [P.lamp.x + 0.5, P.lamp.y + 0.5];
  const [kx, ky] = [P.king.x + 0.5, P.king.y + 0.5];
  const [jx, jy] = [P.jahar.x + 0.5, P.jahar.y + 0.5];
  return [
    ['actor', 'jahar_e', { sprite: 'c8a_jahar', x: jx, y: jy, dir: 'down' }],
    ['actor', 'karim_e', { sprite: 'karim', x: jx - 1, y: jy + 3, dir: 'up' }],
    ['look', jx, jy],
    ...S(VILLAIN8, 'ば、ばかな…。\nランプの魔人と化した、このわたしが…！'),
    ['sfx', 'rumble'], ['shake'],
    ...N('そのとき、ねがいのランプが、ぐらぐらとゆれだした！'),
    ...S(VILLAIN8, 'な、なんだ！？\nランプが…わたしを、すいこむ…！？'),
    ...S(VILLAIN8, 'ランプの魔人は…ランプの中にしか、いられぬというのかーっ！'),
    ['sfx', 'dark'], ['flash'],
    ['remove', 'jahar_e'],
    ...N('ジャハールは、けむりのようになって、ランプの中へ、すいこまれてしまった！'),
    ['look', lx, ly],
    ...N('…ランプの口から、小さな黒い星のかけらが、ふわりとうかび上がった。'),
    ...S('黒い星のかけら', '…よくばりな心…たしかに、いただいた…。', '千年前の、くらい心を…もっと、もっと、集めねば…。'),
    ...N('黒い星のかけらは、天じょうのあなから、夜空のかなたへ、にげていった…。'),
    ...S('トキネの声', '（あれは…カイの心からにげた、ソリトゥスのかけら…！）', '（ジャハールに、ささやいていたのは、あのかけらだったのね。\n千年前の、くらい心を、集めている…）'),
    ...S('カリム', 'くらい心を、集めて…いったい、何をするつもりなんだ…。'),
    ['look', kx, ky],
    ['sfx', 'sparkle'],
    ['hideNpc', 'c8a_king_spell'],
    ['actor', 'king_e', { sprite: 'c7_king', x: kx, y: ky, dir: 'down' }],
    ...N('王さまの目に、ゆっくりと、光がもどっていく…。'),
    ...S('緑の王', '…わしは…いったい…。', 'ここは…月の王宮か…？'),
    ['face', 'karim_e', 'left'],
    ...S('カリム', '王さま！\nよかった…！'),
    ...S('緑の王', 'カリム…。それに、紋章の子らよ。', '…長い、いやな夢を見ていたようじゃ。\nそなたたちが、起こしてくれたのじゃな。'),
    ...S('緑の王', 'このランプは、王家の宝物ぐらのおくに、しまっておこう。', 'もう二度と、だれの心も、まよわせぬように。'),
    ['remove', 'king_e'], ['remove', 'karim_e'],
    ['look'],
    ['flag', KING8], ['sync'],
    ['objective', C8_OBJ.king],
    ...throneEnding(),
  ];
}
function throneEnding() {
  const H = C8A_FIELD_POS.hall, TH = C8A_FIELD_POS.throne;
  const [hx, hy] = [H.x + 0.5, H.y + 0.5];
  const [tx, ty] = [TH.x + 0.5, TH.y + 0.5];
  return [
    ['fade', 'out'],
    ['teleport', C7_FIELD_ID, hx, hy, 'down'],
    ['hideNpc', 'c8a_king_back'], ['hideNpc', 'c7_minister'],
    ['actor', 'king_e', { sprite: 'c7_king', x: tx, y: ty, dir: 'up' }],
    ['actor', 'nadia_e', { sprite: 'c7_princess', x: tx - 1.6, y: ty - 0.6, dir: 'up' }],
    ['actor', 'minister_e', { sprite: 'c7_minister', x: tx + 1.6, y: ty - 0.6, dir: 'up' }],
    ['actor', 'karim_e', { sprite: 'karim', x: hx + 1.2, y: hy, dir: 'down' }],
    ['fade', 'in'],
    ['bgm', 'safara'],
    ['sfx', 'sparkle'],
    ...N('王の間に、明るい朝の光が、さしこんでいる…。'),
    ...S('緑の王', '紋章の子らよ。そして、カリム。', '王国のみなにかわって、礼を言うぞ。'),
    ...S('城の大臣', 'いやはや、ジャハールめ、とんだ大臣でしたな。\n…これからは、わしが、しっかり王さまをささえますぞ！'),
    ...S('王女ナディア', 'カリム。', '…さっきは、おそいって言って、ごめんね。\nほんとうは、来てくれて、すごく、うれしかった。'),
    ...S('カリム', 'う、うん…。'),
    ['face', 'karim_e', 'left'],
    ...S('カリム', '{name}。ぼくは、もう少しだけ、王国にのこるよ。', '王さまのそばで、王国がおちつくまで、見とどけたいんだ。\n…それから、未来の酒場に、もどる。'),
    ...S('カリム', 'あの黒い星のかけらは、千年前の、くらい心を集めていた。', 'きっと、まだ、どこかで…。\n…そのときは、また、いっしょに戦おう。約束だ。'),
    ['remove', 'karim_e'],
    ['unguest', 'karim'],
    ...N('（カリムは、王国にのこった。…未来の酒場の仲間のカリムとは、またすぐに会える）'),
    ['remove', 'king_e'], ['remove', 'nadia_e'], ['remove', 'minister_e'],
    ['hideNpc', 'c8a_king_back', false], ['hideNpc', 'c7_minister', false],
    ...S('トキネの声', '（ありがとう、{name}。\n…かけらの集めている、くらい心。わたしも、時の流れの中を、探してみるわ）'),
    ['flag', C8.jafar], ['sync'],
    ['sfx', 'join'],
    ['objective', C8_OBJ.jafar],
    ...N('第8章　第1幕クリア！'),
    ['chapter', '第8章　第1幕「月の王宮のうらぎり」　完', '第2幕へ　つづく'],
    ...S('トキネの声', '（…{name}。時の砂時計が、また、鳴っているわ）', '（今のほしみの丘で、待っているわね）'),
    ['bgm', 'resume'],
  ];
}
const midBoss = (x) => x.flag(WIN8) && !x.flag(KING8);
const midThrone = (x) => x.flag(KING8) && !x.flag(C8.jafar);

// ───────────── 千年前の 人の ことば ─────────────
const LINES = {
  c8a_guard: (x) => (x.flag(C8.jafar)
    ? S('月の王宮の番兵', 'ジャハールがいなくなって、王宮の空気が、すっかり明るくなりました。', '…あのオウム？\nさあ…お城の屋根の上で、ときどき、ギャーギャー鳴いてますよ。')
    : x.flag(ENTRY8)
      ? S('月の王宮の番兵', '石板が開いた…！？\nカリムどの、どうか、王さまを…！')
      : S('月の王宮の番兵', 'この石板の下は、王家の「月の王宮」。', '…ジャハールさまのほかは、だれも通すなと言われております。\nでも、カリムどのなら…。')),
  c8a_maid: (x) => (x.flag(C8.jafar)
    ? S('お城のめし使い', '王さまが、朝ごはんを、おかわりなさったんですよ！', 'ひと月ぶりに、笑い声が、お城にもどりました。')
    : S('お城のめし使い', 'ジャハールさまが来てから、王さまは、ごはんも、あまり食べなくなって…。', '王女さまも、どこへ行ってしまったのかしら…。')),
  c8a_ranger: (x) => (x.flag(C8.jafar)
    ? S('王家の森の番人', '森の動物たちが、元気をとりもどしたよ。', '…ゆうべの月は、やさしい色だったなあ。')
    : S('王家の森の番人', 'ここは、王家の森。', 'ジャハールが来てから、森の動物たちが、夜になると、こわがって、ないているんだ…。')),
  c8a_rubble: () => N('下への階段は、がれきで、すっかりうまっている…。', '（もっと下へ進むのは、千年前の時代で）'),
  c8a_seal: () => N('黒い砂のかべだ。', 'さわると、ざらざらと、つめたい…。\n（大臣の、まじないの力でできているようだ）'),
  c8a_river: () => N('門の先は、深い砂の川だ。', 'さらさらと、はやく流れていて、とても、わたれない…。\n（今の時代なら、かれているかもしれない）'),
  c8a_king_spell: (x) => (midBoss(x) ? afterBoss() : N('王さまは、ぼんやりと、月を見上げている…。', '…何をよびかけても、こたえてくれない。')),
  c8a_lamp: (x) => (midBoss(x) ? afterBoss() : x.flag(WIN8)
    ? N('金色のランプだ。', '…ときどき、中から、もごもごと、文句を言う声が聞こえる。')
    : N('金色のランプが、あやしく光っている…。', '（ジャハールが、そばで、見はっている）')),
};

// ───────────── だいほん ─────────────
export const CH8_SCRIPTS = {
  c8a_arrive: (x) => (x.flag(ARRIVE8) ? [] : arriveSteps()),
  c8a_kingdom_arrive: (x) => (x.flag(C8.kingdom) ? [] : kingdomSteps()),
  c8a_slab: (x) => slabSteps(x),
  c8a_slab_now: (x) => slabNowSteps(x),
  ...LINES,
  ...Object.fromEntries(Object.keys(PF_TEXT).map((n) => [`c8a_f${n}`, () => PF_TEXT[n]()])),
  ...Object.fromEntries(Object.entries(MURAL).map(([n, fn]) => [`c8a_mural_${n}`, () => [['call', (run) => run.runSteps(fn(isPast(run)))]]])),
  ...Object.fromEntries(Object.entries(C8A_POS).flatMap(([n, P]) => P.mirrors.map((_, k) => [`c8a_mirror_${n}_${k}`, () => mirrorSteps(Number(n), k)]))),
  c8a_mirror_now: () => mirrorNowSteps(),
  c8a_font: () => fontSteps(),
  c8a_nadia_meet: (x) => (x.flag(NADIA4) ? [] : nadiaMeet()),
  c8a_nadia: (x) => (x.flag(NADIA4) ? nadiaSteps(x) : [...nadiaMeet(), ...nadiaSteps({ ...x, flag: (f) => f === NADIA4 || x.flag(f) })]),
  c8a_pet_event: (x) => (x.flag(C8.pet) ? [] : petEvent()),
  c8a_box_past: (x) => boxPastSteps(x),
  c8a_box_now: (x) => boxNowSteps(x),
  c8a_gate_now: (x) => gateNowSteps(x),
  c8a_voice7: (x) => (x.flag(VOICE7) ? [] : voice7Steps()),
  c8a_boss_event: (x) => (x.flag(WIN8) ? [] : bossEvent()),
  c8a_boss_after: (x) => (midBoss(x) ? afterBoss() : []),
};

// ───── 目標の 行き先（quest-targets.js）─────
const at = (n, p, now = false) => ({ map: c8aMapId(n, now), x: p.x, y: p.y });
const P = C8A_POS;
const bridge = (n, d) => P[n].bridges.find((c) => c.ch === d) || P[n].down;
export const CH8_OBJECTIVE_TARGETS = {
  [C8_OBJ.start]: [{ map: SOUTH_ID, x: 40, y: 80 }],
  [C8_OBJ.arrive]: [{ map: C7_FIELD_ID, x: C8A_FIELD_POS.kingdomIn.x, y: C8A_FIELD_POS.kingdomIn.y }],
  [C8_OBJ.kingdom]: [{ map: C7_FIELD_ID, x: STAIR8.x, y: STAIR8.y }],
  [C8_OBJ.entry]: [{ map: C7_FIELD_ID, x: STAIR8.x, y: STAIR8.y }],
  [C8_OBJ.moon]: [at(1, P[1].mirrors[0]), at(1, bridge(1, '2'), true), at(1, P[1].down, true)],
  [C8_OBJ.f2]: [at(2, P[2].mirrors[0]), at(2, P[2].flows[0]), at(2, bridge(2, '2'), true)],
  [C8_OBJ.f3]: [at(3, P[3].mirrors[0]), at(3, P[3].mirrors[1]), at(3, P[3].down)],
  [C8_OBJ.f4]: [at(4, P[4].font), { npc: 'c8a_nadia' }],
  [C8_OBJ.pet]: [at(4, P[4].down), at(4, P[4].down, true)],
  [C8_OBJ.deep]: [{ npc: 'c8a_nadia' }, at(5, P[5].gate, true)],
  [C8_OBJ.nadia]: [at(5, P[5].box)],
  [C8_OBJ.l3bury]: [at(5, P[5].box, true)],
  [C8_OBJ.l3found]: [at(5, P[5].down, true)],
  [C8_OBJ.f6]: [at(6, P[6].mirrors[0]), at(6, P[6].down)],
  [C8_OBJ.f7]: [at(7, P[7].mirrors[2]), at(7, P[7].mirrors[1]), at(7, P[7].font)],
  [C8_OBJ.rest7]: [at(7, P[7].font), at(7, P[7].down)],
  [C8_OBJ.f8]: [{ npc: 'c8a_jahar' }],
  [C8_OBJ.win]: [{ npc: 'c8a_lamp_npc' }],
  [C8_OBJ.king]: [{ npc: 'c8a_king_back' }],
  [C8_OBJ.jafar]: [{ npc: 'tokine_c6' }],
  // 第2幕（story-c8b.js）
  ...CH8B_OBJECTIVE_TARGETS,
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH8_OBJECTIVE_TALK = {
  [C8_OBJ.start]: T4('コガネ地方の町の外で、時の砂時計を使おう。王都サファラの北の門の外がいい。', 'コガネ地方だ！町の外で砂時計だぞ！',
    'コガネ地方へ行って、町の外で砂時計を使いましょう。カリムさんの王国が、しんぱいです。', 'さばくの国で、すなどけいをつかおう！'),
  [C8_OBJ.arrive]: T4('千年前のコガネ地方。今の王都サファラの場所に、緑の王国がある。', '緑の王国へ急ごうぜ！',
    '昼なのに、白い月が見えます。緑の王国へ、急ぎましょう。', 'みどりの王国へ、いこう！'),
  [C8_OBJ.kingdom]: T4('王の間の東のすみに、月の石板がある。カリムの王家のたてで開くかもしれない。', '石板だ！カリムのたてで開けようぜ！',
    'カリムさんのたての紋章なら、石板が開くかもしれません。王の間の東のすみです。', 'いしいたを、調べよう！'),
  [C8_OBJ.entry]: T4('石板の下に、地下の月の王宮への階段ができた。王さまを、助けに行こう。', '地下へ、のりこむぞ！',
    '石板の下の階段から、月の王宮へ下りましょう。王さまが、待っています。', 'ちかの王宮へ、いこう！'),
  [C8_OBJ.moon]: T4('千年前の月の鏡を回すと、今の谷に光の橋がうかぶ。鏡を回したら、砂時計で今へ。', '鏡を回して、今の時代で橋をわたるんだ！',
    '千年前で鏡の向きをかえてから、今の時代へ。光の橋が、うかんでいるはずです。', 'かがみをまわして、光のはし！'),
  [C8_OBJ.f2]: T4('千年前の流れる砂にのって、川の中の島へ。島から、今の時代の光の橋で南へ。', '砂の流れにのって、島までひとっとびだ！',
    '流れる砂は、千年前だけ。島に着いたら、今の時代の橋を探しましょう。', 'すなにのって、しまへいこう！'),
  [C8_OBJ.f3]: T4('北の鏡で島への橋、島の鏡で南への橋。南のくずれた谷は、千年前なら歩ける。', '鏡が2つか！順番にいくぞ！',
    '1つめの鏡で島へ、2つめの鏡で南へ。あわてずに、1つずつ進みましょう。', 'かがみが、ふたつ！'),
  [C8_OBJ.f4]: T4('休み所のいずみで休んで、記録しよう。だれかがかくれているみたいだ。', 'ひと休みだ！…だれかいるぞ？',
    'ここで、しっかり休みましょう。南の広間には、気をつけて。', 'いずみでやすもう！'),
  [C8_OBJ.pet]: T4('黒い砂のかべが消えた。南の広間の階段から、もっと下へ。', 'オウムなんか、こわくないぞ！下へ行こう！',
    'まじないが、ひとつとけました。もっと下へ、王さまを助けに行きましょう。', 'もっとしたへ、いこう！'),
  [C8_OBJ.deep]: T4('月の門は、王家の言葉で開くらしい。4階の王女ナディアに聞いてみよう。', '4階にもどって、王女さまに聞こうぜ！',
    'ナディアさんなら、王家の言葉を知っているはずです。4階へもどってみましょう。', 'おうじょさまに、きいてみよう！'),
  [C8_OBJ.nadia]: T4('千年前の5階の月の箱に、ナディアの手紙を入れよう。千年先までのこる。', '手紙を、千年前の箱に入れるんだ！',
    '千年前のうちに、月の箱に手紙を入れましょう。', 'おてがみを、はこにいれよう！'),
  [C8_OBJ.l3bury]: T4('今の時代で、5階の月の箱を開けよう。千年前の手紙が、のこっているはず。', '今の時代の箱を、開けてみようぜ！',
    '今の時代の月の箱には、ナディアさんの手紙が、のこっているはずです。', 'いまの時代の、はこをあけよう！'),
  [C8_OBJ.l3found]: T4('月の門が開いた。今の時代の門を通って東のへやへ。そこに下への階段がある。', '門が開いた！東のへやへ行くぞ！',
    '今の時代の門を通って、東のへやへ。下への階段があります。', 'つきのもんが、あいた！'),
  [C8_OBJ.f6]: T4('北の鏡で川の橋をかけて、中の広間へ。砂の滝は、ふっていないすきに1歩ずつ。', '砂の滝なんか、すきをついてダッシュだ！',
    '砂がふっていない間に、1歩ずつ進みましょう。あいだのゆかは、あんぜんです。', 'すなのたきに、きをつけて！'),
  [C8_OBJ.f7]: T4('3つの鏡で、島から島へ光の橋をつなごう。回すと消える橋もある。', '鏡が3つ！じっくり考えようぜ！',
    '1つ回すと、べつの橋が消えるかもしれません。順番に、考えましょう。', 'かがみが、みっつ！'),
  [C8_OBJ.rest7]: T4('休み所でじゅんびを整えよう。下の玉座の間に、ジャハールがいる。', 'ジャハール、今行くからな！',
    'しっかり休んでから、玉座の間へ行きましょう。王さまが、待っています。', 'おうさまを、助けよう！'),
  [C8_OBJ.f8]: T4('玉座の間に、大臣ジャハールがいる。じゅんびを整えてから進もう。', 'ジャハールを、たおすぞ！',
    'カリムさんといっしょに、王さまを取りもどしましょう。', 'ジャハールを、やっつけよう！'),
  [C8_OBJ.win]: T4('ねがいのランプを調べると、続きが見られる。', 'ランプを調べてみようぜ！',
    'ランプのようすが、気になります。調べてみましょう。', 'ランプを、調べよう！'),
  [C8_OBJ.king]: T4('緑の王国の王の間で、王さまに話しかけよう。', '王さまのところへ、もどろうぜ！',
    '王さまに、話しかけましょう。', 'おうさまに、話しかけよう！'),
  [C8_OBJ.jafar]: T4('第1幕クリア。今のほしみの丘のトキネに会いに行こう。砂時計が、また鳴っているらしい。', 'やったな！トキネのところへ行こうぜ！',
    '第1幕クリアです。カリムさんとの約束、わすれないでいましょう。トキネさんが待っています。', 'トキネさんに、あいにいこう！'),
  // 第2幕（story-c8b.js）
  ...CH8B_OBJECTIVE_TALK,
};

// ───── すすみぐあい（progress.js の PROGRESS の うしろ）─────
export const CH8_PROGRESS = [
  [C8.start, C8_OBJ.start],
  [ARRIVE8, C8_OBJ.arrive],
  [C8.kingdom, C8_OBJ.kingdom],
  [ENTRY8, C8_OBJ.entry],
  [C8.moon, C8_OBJ.moon],
  [PF8(2), C8_OBJ.f2],
  [PF8(3), C8_OBJ.f3],
  [PF8(4), C8_OBJ.f4],
  [C8.pet, C8_OBJ.pet],
  [C8.deep, C8_OBJ.deep],
  [LETTER8.start(LETTER8_PALACE), C8_OBJ.nadia],
  [LETTER8.bury(LETTER8_PALACE), C8_OBJ.l3bury],
  [LETTER8.found(LETTER8_PALACE), C8_OBJ.l3found],
  [PF8(6), C8_OBJ.f6],
  [PF8(7), C8_OBJ.f7],
  [VOICE7, C8_OBJ.rest7],
  [PF8(8), C8_OBJ.f8],
  [WIN8, C8_OBJ.win],
  [KING8, C8_OBJ.king],
  [C8.jafar, C8_OBJ.jafar],
  // 第2幕（story-c8b.js）
  ...CH8B_PROGRESS,
];

// ───── story.js から: だいほんを まぜる（今の トキネ・千年前の 王国の 人・より道「時をこえる手紙」・パーティー全員で 見る イベント）─────
const wrap = (SCRIPTS, id, fn) => {
  const base = SCRIPTS[id] || (() => []);
  SCRIPTS[id] = Object.assign((x) => fn(x, base), base);
};
export function applyCh8(SCRIPTS, STORY_SCRIPTS) {
  Object.assign(SCRIPTS, CH8_SCRIPTS);
  for (const id of CH8_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // 今の ほしみの丘の トキネ: 第7章クリアの あとは まず 第8章の はじまり
  wrap(SCRIPTS, 'c6_tokine', (x, base) => {
    if (x.flag(C7I.clear) && !x.flag(C8.start)) return tokineCh8();
    if (x.flag(C8.start) && !x.flag(ARRIVE8)) return S('トキネ', 'コガネ地方の、町の外で、砂時計を使ってみてね。', 'カリムの王国、だいじょうぶかしら…。');
    return base(x);
  });
  // 千年前の 王国の 人（第8章の あいだの ことば）
  wrap(SCRIPTS, 'c7_king', (x, base) => {
    if (midThrone(x)) return throneEnding();
    if (x.flag(C8.jafar)) return S('緑の王', '紋章の子らよ。', '月の光は、もう、だれの心も、まよわせぬ。\n…カリムのたては、いつでも、そなたたちの味方じゃ。');
    return base(x);
  });
  wrap(SCRIPTS, 'c7_minister', (x, base) => {
    if (x.flag(C8.jafar)) return S('城の大臣', 'ジャハールめ、ランプの中で、まだ、もごもご言っておるそうですぞ。', '…わしは、王さまを、二度とひとりにはしませんぞ！');
    if (x.flag(C8.kingdom)) return S('城の大臣', '王の間の東のすみの、月の石板じゃ。', 'カリムの王家のたてなら、きっと…！\n王さまを、たのみますぞ。');
    if (x.flag(C8.start)) return S('城の大臣', '王さまのようすが、どうも、おかしいのじゃ…。');
    return base(x);
  });
  wrap(SCRIPTS, 'c7_princess', (x, base) => {
    if (x.flag(C8.jafar) || x.flag(KING8)) return S('王女ナディア', 'お父さまが、元気になって、ほんとうによかった。', '…月の子守歌？\nふふっ、カリムには、ないしょよ。');
    return base(x);
  });
  // より道「時をこえる手紙」（sidequests-c8a.js）
  applyC8aSide(SCRIPTS);
  // 第2幕「よみの青い火」（story-c8b.js）: 今の トキネ・千年前の ナギの村・よみの海底神殿・時をこえる手紙
  applyCh8b(SCRIPTS, STORY_SCRIPTS);
}

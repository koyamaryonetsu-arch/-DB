// 第3部「ほしのね」第2章「七つの星の音」第3幕「むらさきと、うばわれた音」（第97回 A班: 世界と 物語）の だいほん（story-c10.js の applyCh10 で まぜる。applyCh10c）
// ※ ネタバレ注意（docs/plan-part3-c10c.md の 15）
// 一本道: 0 ながれ星のくぼ地で 星の音さ（むらさきの 光が 空へ。c10c_start）→ S1 クモイ地方の 光の うず（星の竜が 乗せて くれる）
//   → S2 空の 小島（音の 橋。c10c_isles2）→ S3 うかぶ いせきの たいさ（c10c_colonel）→ S4 少年が むらさきの 音を うばう（c10c_stolen）
//   → S5 くぼ地の 3人組（c10c_trio。うら口）→ F1 大地の下の 東の はしの うら口 → F2 ベルトの 工場（c10c_fort_in → c10c_fort2）
//   → F3 少年の 間の 少年（c10c_algol）→ F4 むらさきの 音（note_si・c10_note_si）→ E くぼ地の むらさきの 台（c10_ped_si）→ c10_act3
// 魔物・きまった 戦いの 中み・品・ヒントの 文は B班。曲は F班（id は maps/c10c-flags.js の C10C_TRACKS）
// ※ story.js・story-c9.js・story-c10.js を import しない（story-c10.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh10c の 引数で もらう）
// ※ 第1部・第2部の ひみつに ふれる せりふは 書かない。カイは 出さない。ソリトゥスの 名前を 出さない。影の城は「遠くに 見える」だけ。
//   少年の わけは「ぼくに いる 物だ」まで。スピカの 記おくの「小さな 暗い 星」が だれかは 書かない。
//   たいさは もとの 作品の 名前・せりふ・決まり文句を 使わない
import {
  C10C, C10C_ACT2, C10C_LEVER, C10C_PED, C10C_MAP, C10C_BATTLE, C10C_BOSS_MON, C10C_COLONEL_NAME, C10C_COLONEL_SHORT,
  C10C_TRACKS, C10C_BRIDGE_NOTES, C10C_BRIDGE_COLOR_NAMES, NOTE_SI,
} from '../maps/c10c-flags.js?v=9619c3d748be';
import { SPICA_NAME } from '../maps/c9a-flags.js?v=9619c3d748be';
import { ALGOL, ALGOL_NAME } from '../maps/c9c-flags.js?v=9619c3d748be';
import { C9D_TRACKS } from '../maps/c9d-flags.js?v=9619c3d748be';
import {
  ISLES1_POS, ISLES1_SPANS, ISLES2_POS, ISLES2_SPANS, ISLES3_POS, FORT1_POS, FORT2_POS, FORT3_POS,
  KUMOI_VORTEX10C, KUMOI_BACK10C, UNDER_BACKDOOR10C, UNDER_LAND10C, PED_SI10C,
} from '../maps/c10c-rows.js?v=9619c3d748be';
import { PEDESTALS9C } from '../maps/c9c.js?v=9619c3d748be';
import { spanStones10c, stoneScript10c } from '../maps/c10c.js?v=9619c3d748be';
import { TRIO9A } from './story-c9a.js?v=9619c3d748be';
import { MONSTERS } from './monsters.js?v=9619c3d748be';
import { mergeBossHints } from './boss-hints.js?v=9619c3d748be';
import { SHOPS } from './shops.js?v=9619c3d748be';
import { C10C_SHOP_ADD } from './items-c10c.js?v=9619c3d748be';
import { SHOP10B_CRATER } from './story-c10b.js?v=9619c3d748be';
// 音の 橋の しくみは world.c10c（world/c10c-steps.js の C10C_API。data から world を 読まない）
const setBridge10c = (world, s, i, c) => world.c10c.setBridge(world, s, i, c);
const bridgesOf10c = (world, s) => world.c10c.bridgesOf(world, s);

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const NO = 'ノクト';
const AS = '星の竜アステル';
const COL = C10C_COLONEL_SHORT;
const KI = TRIO9A.boss, BO = TRIO9A.mecha, ZU = TRIO9A.power;
const showMon = (id) => (MONSTERS[id] ? [['showMon', id]] : []);

// ───── 目標の 文（ネタバレしない。場所と しくみだけ）─────
export const C10C_OBJ = {
  start: 'ながれ星のくぼ地で、星の音さを鳴らそう',
  sky: 'クモイ地方の、影の城の北の光のうずから、空の小島のおくへ',
  isles: '空の小島のおくの、うかぶいせきへ。橋の石で、光の橋をかけよう',
  trio: '大地の下の、東のはしの、とりでのうら口へ',
  fort: '少年のとりで：レバーでベルトの向きをかえて、おくへ',
  fort2: '少年のとりでの、いちばんおくの間へ',
  place: 'ながれ星のくぼ地の、むらさきの台に、星の音を置こう',
  act3: '第3部　第2章　第4幕へ（続きはアップデートで！）',
};
export function objective10c(has) {
  if (has(C10C.act3)) return C10C_OBJ.act3;
  if (!has(C10C.start)) return C10C_OBJ.start;
  if (has(C10C.note)) return C10C_OBJ.place;
  if (has(C10C.fort2)) return C10C_OBJ.fort2;
  if (has(C10C.fortIn)) return C10C_OBJ.fort;
  if (has(C10C.trio)) return C10C_OBJ.trio;
  if (has(C10C.stolen)) return C10C_OBJ.trio; // 3人組の 話の 前（とちゅうで とぎれた 時。くぼ地に もどると 話が 聞ける）
  if (has(C10C.isles2)) return C10C_OBJ.isles;
  return C10C_OBJ.sky;
}
export const C10C_OBJ_ALL = [C10C_OBJ.start, C10C_OBJ.sky, C10C_OBJ.isles, C10C_OBJ.trio, C10C_OBJ.fort, C10C_OBJ.fort2, C10C_OBJ.place, C10C_OBJ.act3];
const objStep = () => ['call', async (run) => { await run.runSteps([['objective', objective10c((f) => !!run.owner.char.flags?.[f])]]); }];

// パーティー全員で 見る イベント（橋の 石・レバー・ヒント・台は ひとりでも できる ように 入れない）
export const CH10C_STORY_SCRIPTS = ['c10c_fork_event', 'c10c_vortex', 'c10c_isles2_in', 'c10c_colonel_event', 'c10c_orb', 'c10c_trio_event', 'c10c_fort_in', 'c10c_fort2_in', 'c10c_algol_event', 'c10c_vorb'];

const PS = PEDESTALS9C[PED_SI10C];

// ───── 0 むらさきの 光 ─────
function forkScene(title) {
  const cx = PS.x + 0.5, cy = PS.y + 1.6;
  return [
    ['bgm', null],
    ['look', cx - 2, cy - 0.6],
    ['guestHide', true],
    ['actor', 'spica_f', { sprite: 'c9a_spica', x: cx - 2, y: cy + 0.6, dir: 'up' }],
    ...S(SP, '…星の音さ、また、ふるえてる。\nこんどは、ずっと、上のほう…。'),
    ['sfx', 'spell'], ['flash'],
    ...N('――キイィン…！\n星の音さが、高く、すんだ音で、ふるえた。'),
    ['wait', 600],
    ['sfx', 'sparkle'],
    ...N('むらさきの光のすじが、まっすぐ、空へ…\n雲をつきぬけて、どこまでも、のびていく。'),
    ...S(SP, '…むらさきは、さいごの音のひとつ。\nとても、とおくて、とても、高い音…。'),
    ['remove', 'spica_f'], ['guestHide', false],
    ['look'],
    ...title(),
    ...S(NO, '…雲の上か。'),
    ...S(NO, '空の上なら、クモイ地方だな。\n影の城の、北の空のほうへ、光がのびていた。'),
    ...S(NO, 'アステルに、たのんでみよう。\n雲の上まで、つれていってくれるかもしれない。'),
    ['flag', C10C.start], ['sync'],
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── S1 クモイ地方の 光の うず（星の竜が 空の 小島へ 乗せて くれる）─────
const toIsles = () => [['fade', 'out'], ['teleport', C10C_MAP.isles1, ISLES1_POS.entry.x + 0.5, ISLES1_POS.entry.y + 0.5, 'up'], ['fade', 'in']];
function vortexSteps(x) {
  if (x.flag(C10C.isles2)) {
    return [['choice', '光のうずだ。アステルに乗って、空の小島へ行く？', ['行く', 'やめる'], [
      [['sfx', 'wind'], ...toIsles(), ...N('アステルにのって、空の小島へ来た。')],
      [],
    ]]];
  }
  const V = KUMOI_VORTEX10C;
  const E = ISLES1_POS.entry;
  return [
    ['look', V.x + 0.5, V.y + 0.5],
    ...N('雲の海の上に、光のうずが、ゆっくりと、回っている…。\nむらさきの光のすじは、この上へ、つづいている。'),
    ...S(SP, '…この上。むらさきの音が、呼んでる。'),
    ['sfx', 'wind'],
    ['actor', 'astel_c10', { sprite: 'star_dragon', x: V.x + 0.5, y: V.y - 12, dir: 'down' }],
    ['move', 'astel_c10', [[V.x + 0.5, V.y - 2]]],
    ...S(AS, '紋章の子らよ。この光のうず、空の、もっと高い所へ、つづいておる。'),
    ...S(AS, '星ふるえで、雲の上に、古い小島が、うき上がったのだ。\nわたしの羽で、つれていこう。'),
    ['remove', 'astel_c10'],
    ['bgm', C10C_TRACKS.isles],
    ...toIsles(),
    ['look', E.x + 4, E.y - 6],
    ...N('アステルは、光のうずをぬけて…\n雲の、さらに上の、小さな島に、みんなを下ろした。'),
    ...N('あちこちに、小島が、ぷかぷか、うかんでいる。\nとおくに、影の城と、白い雲の海が見える。'),
    ...S(NO, '島と島のあいだは…雲だな。\n歩いては、わたれない。'),
    ...S(SP, '…あの石、星の音に、こたえそう。\n音を鳴らすと、光の、橋…？'),
    ...S(NO, 'そばに、立てふだがある。読んでみよう。'),
    ['look'],
    objStep(),
  ];
}
function vortexBackSteps() {
  const L = KUMOI_BACK10C;
  return [['choice', '光のうずだ。アステルに乗って、クモイ地方へもどる？', ['もどる', 'やめる'], [
    [['sfx', 'wind'], ['fade', 'out'], ['teleport', KUMOI_VORTEX10C.map, L.x + 0.5, L.y + 0.5, 'down'], ['fade', 'in'], ...N('アステルにのって、クモイ地方へもどった。\n（光のうずを、しらべると、また来られる）')],
    [],
  ]]];
}

// ───── S2 音の 橋（橋の 石。持って いる 星の音で 光の 橋）─────
// レ 赤・ミ 黄・ファ 緑・ソ 青・ラ 白（同じ 色の 橋は 1本だけ）
const BRIDGE_ORDER = [['note_re', 'レ'], ['note_mi', 'ミ'], ['note_fa', 'ファ'], ['note_so', 'ソ'], ['note_la', 'ラ']].map(([id, name]) => [id, name, C10C_BRIDGE_NOTES[id]]);
const colorList = (br) => BRIDGE_ORDER.filter(([, , c]) => br[c] !== undefined).map(([, , c]) => C10C_BRIDGE_COLOR_NAMES[c]).join('・') || 'なし';
function stoneSteps(span) {
  return (x) => {
    const own = BRIDGE_ORDER.filter(([id]) => x.has(id));
    if (!own.length) return N('橋の石だ。\n…星の音が、あれば、何か、おきそうだ。');
    const ring = (c, name) => [
      ['sfx', 'spell'],
      ['call', async (run) => {
        const r = setBridge10c(run.world, run.init, span, c);
        const C = C10C_BRIDGE_COLOR_NAMES[c];
        const now = `\n（かかっている橋：${colorList(bridgesOf10c(run.world, run.init))}）`;
        const out = {
          ok: [['flash'], ['say', null, `――${name}…♪\n${C}の光の橋が、となりの島へ、かかった！${now}`]],
          same: [['say', null, `${C}の橋は、もう、ここに、かかっている。${now}`]],
          busy: [['say', null, `…だれかが、${C}の橋を、わたっている！\n今は、かけかえられない。${now}`]],
        }[r] || [];
        await run.runSteps(out);
      }],
    ];
    return [
      ...N('橋の石だ。\nどの星の音を、鳴らす？'),
      ['choice', '星の音を、えらぶ', [...own.map(([, name, c]) => `${name}（${C10C_BRIDGE_COLOR_NAMES[c]}の橋）`), 'やめる'], [...own.map(([, name, c]) => ring(c, name)), []]],
    ];
  };
}
const signSteps = () => N(
  '立てふだに、古い文字が、ほってある。\n「橋の石に、星の音を、ひびかせよ。\n音の色の、光の橋が、となりの島へ、かかる」',
  '「ただし、同じ色の橋は、ひとつだけ。\nべつの石で、同じ音を鳴らせば、前の橋は、きえる」',
  '（橋がきえて、もどれなくなっても、だいじょうぶ。\nどの島にも、橋の石がある。かけなおせば、いい）',
);
function isles2InScene() {
  return [
    ...N('もっと高い空に、出た。\n小島が、たくさん、うかんでいる…。'),
    ...N('ひゅう…ひゅう…\n島と島のあいだを、風が、ふきぬけていく。'),
    ...S(NO, '風の道か。クモイ地方の、風の道と、にているな。\n風にのれば、決まった島へ、運ばれそうだ。'),
    ...S(SP, '…むらさきの音、もう少し、上。'),
    ...S(NO, '橋は、5本までしか、かけられない。\nうまく、かけかえながら、進もう。'),
    ['flag', C10C.isles2], ['sync'],
    objStep(),
  ];
}

// ───── S3・S4 うかぶ いせきの たいさ → むらさきの 音が うばわれる ─────
function colonelScene() {
  const B = ISLES3_POS.boss;
  const bx = B.x + 0.5, by = B.y + 0.5;
  return [
    ['bgm', null],
    ['look', bx, by + 1],
    ...N('古い石の広場…。\nおくで、むらさきの光の玉が、しずかに光っている。'),
    ...N('その前に…\nむらさきの軍服の、だれかが、立っている。'),
    ...S('？？？', 'ほう。こんな高い空まで、のぼってくるとはな。'),
    ...S(C10C_COLONEL_NAME, 'わがはいは、たいさムスカリ。\nこの、うかぶいせきを、しらべている者だ。'),
    ...S(COL, 'このむらさきの光は、わがはいが、いただく。\nあのお方に、ほめていただくのだ。'),
    ...S(SP, '…それは、星の音。\nかえして…！'),
    ...S(COL, 'ふふん。わがはいの、雷の石ばんの力、\nとくと、見るがいい！'),
    ['sfx', 'spell'], ['flash'],
    ...N('広場の、3つのうき石が、ふわりと、うかび上がった！\n…足もとの石が、ぴかっと光ったら、あぶなそうだ。'),
    ...S(NO, '光った石から、はなれろ。\nみんなで、ひとつの石に、かたまるなよ。'),
    ...showMon(C10C_BOSS_MON.colonel),
    ['bgm', C10C_TRACKS.colonel],
    ['battle', C10C_BATTLE.colonel],
    ['showMon', null],
    ['bgm', null],
    ...N('たいさの、雷の石ばんが、ぷすぷすと、けむりを上げた。'),
    ...S(COL, 'な、なぜだ…。\nわがはいの、かんぺきな、さくせんが…。'),
    ...N('たいさは、ぼうしを、ぎゅっと、にぎって、しょんぼりしている。'),
    ['flag', C10C.colonel], ['sync'],
    ...stolenScene(),
  ];
}
function stolenScene() {
  const O = ISLES3_POS.orb;
  return [
    ['look', O.x + 0.5, O.y + 1.5],
    ['guestHide', true],
    ['actor', 'spica_s', { sprite: 'c9a_spica', x: O.x + 0.5, y: O.y + 3.4, dir: 'up' }],
    ...S(SP, '…むらさきの、星の音。\nやっと…。'),
    ['bgm', C10C_TRACKS.stolen],
    ['sfx', 'dark'], ['shake'],
    ...N('…そのとき。\n空が、すうっと、暗くなった。'),
    ...N('くらい空に、細い三日月のような、黒い光。'),
    ['actor', 'algol_s', { sprite: ALGOL, x: O.x + 0.5, y: O.y - 1.2, dir: 'down' }],
    ['flash'],
    ...N(`少年${ALGOL_NAME}が、光の玉の、すぐ上に、うかんでいた。`),
    ...N('少年は、むらさきの光を、片手で、つかむと…'),
    ['sfx', 'dark'], ['flash'],
    ['remove', 'algol_s'],
    ...N('黒いすじになって、まっすぐ、下へ。\n雲をつきぬけて…大地の、ずっと下のほうへ、きえていった。'),
    ...S(SP, '…まって！'),
    ['wait', 600],
    ...S(COL, '…ああ。わがはいの、おみやげが…。'),
    ...N('たいさは、ふらふらと、雲のむこうへ、とんでいった。'),
    ...S(NO, '…大地の下、か。\nあの子、どこへ、行ったんだ。'),
    ...S(SP, '……。'),
    ['remove', 'spica_s'], ['guestHide', false],
    ['flag', C10C.stolen], ['sync'],
    ...S(NO, '一度、くぼ地へ、もどろう。\nアステルが、むかえに来てくれた。'),
    ['bgm', null],
    ['sfx', 'wind'],
    ...toCrater(),
    ...trioScene(),
  ];
}
// むらさきの 光の 玉（とちゅうで とぎれた 時の やり直し）
const orbSteps = (x) => {
  if (x.flag(C10C.stolen)) return N('光の玉が、あった台だ。\n…今は、もう、光っていない。');
  if (x.flag(C10C.colonel)) return stolenScene();
  return N('むらさきの光の玉だ。\nそばに、だれかが、立っている…。');
};
const toCrater = () => [['fade', 'out'], ['teleport', 'c9a_crater', 12.5, 10.5, 'up'], ['fade', 'in']];

// ───── S5 くぼ地の 3人組（うら口を 教えて くれる）─────
function trioScene() {
  const top = { x: 12.5, y: 7.5 };
  return [
    ['look', top.x, top.y + 1],
    ...N('くぼ地に、もどると…\nテントのかげで、何かが、ごそごそしている。'),
    ['actor', 'kirajo_c', { sprite: 'c9a_kirajo', x: top.x, y: top.y - 1, dir: 'down' }],
    ['actor', 'boyacchi_c', { sprite: 'c9a_boyacchi', x: top.x - 1.2, y: top.y - 0.7, dir: 'down' }],
    ['actor', 'zurakka_c', { sprite: 'c9a_zurakka', x: top.x + 1.2, y: top.y - 0.7, dir: 'down' }],
    ...S(KI, 'しーっ！\nあたしたちよ。…今日は、たたかいに来たんじゃないわ。'),
    ...S(KI, 'アルゴルさまったら、ちっとも、ほめてくれないんだもの。\nいっしょうけんめい、光を、集めたのに…。'),
    ...S(BO, 'ほんまでまんねん。\nわてらの、くろうも、知らんと…。'),
    ...S(ZU, 'さびしい…ぜ。'),
    ...S(KI, 'だから、とくべつに、教えてあげる。\nアルゴルさまの、とりでの、うら口、知ってるわよ。'),
    ...S(KI, '大地の下の、東のはし。\nあたしたちが、こっそり、あけておいたの。'),
    ...S(BO, '中は、星のかけらを運ぶ、ベルトの工場でまんねん。\nレバーで、ベルトの向きが、かわりまっせ。'),
    ...S(ZU, '…中で、また、会う…ぜ。'),
    ...S(NO, '…にくめない、やつらだな。'),
    ...S(SP, '…ありがとう。'),
    ['remove', 'kirajo_c'], ['remove', 'boyacchi_c'], ['remove', 'zurakka_c'],
    ...N('3人組は、テントのかげへ、すたこら、にげていった。'),
    ['look'],
    ['flag', C10C.trio], ['sync'],
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── F1・F2 少年の とりで（ベルトの 工場）─────
function fortInScene() {
  const E = FORT1_POS.entry;
  return [
    ['bgm', C10C_TRACKS.fort],
    ['look', E.x + 0.5, E.y - 5],
    ...N('うら口のおくは…\nゴウン、ゴウンと、大きな音が、ひびく工場だった。'),
    ...N('ゆかの上を、ベルトが、ずっと流れている。\n星のかけらが、ころころ、運ばれていく…。'),
    ...S(NO, 'あいつ、こんなに、星の光を、集めていたのか…。'),
    ...S(NO, 'ベルトに乗ると、流れる方へ、運ばれるな。\n赤いしるしと、青いしるしが、あるようだ。'),
    ['look'],
    ['flag', C10C.fortIn], ['sync'],
    objStep(),
  ];
}
function fort2InScene() {
  return [
    ...N('とりでの、もっとおくへ、下りてきた。\nゴウン…ゴウン…ベルトの音が、大きくなる。'),
    ...S(SP, '…むらさきの音、ちかい。'),
    ['flag', C10C.fort2], ['sync'],
    objStep(),
  ];
}
// レバー（同じ 色の しるしの ベルトが ぜんぶ 逆に。パーティーで 同じ・セーブする）
function leverSteps(color) {
  const flag = color === 'red' ? C10C_LEVER.red : C10C_LEVER.blue;
  const name = color === 'red' ? '赤' : '青';
  return [
    ['choice', `${name}のレバーを、引く？`, ['引く', 'やめる'], [
      [['sfx', 'door'], ['toggle', flag], ['sync'], ['shake'],
        ...N(`ガコン！\n${name}いしるしのベルトが、ぜんぶ、ぎゃくに流れだした！`)],
      [],
    ]],
  ];
}
// 3人組の ヒント（ズラッカだけ、いつも 逆を 言う）
const on = (x, c) => x.flag(C10C_LEVER[c]);
const HINTS = {
  // とりで 1 入口: キラジョ（赤。正しい）
  c10c_hint_f1a: (x) => [
    ...S(KI, 'あら、来たわね。\n赤いしるしのベルトは、赤のレバーで、向きが、かわるのよ。'),
    ...S(KI, on(x, 'red') ? '今なら、北へ、運んでくれるわ。\n乗ってごらんなさい。' : '今は、こっちへ、流れてくるわね。\n北へ行くなら、レバーを、引いてごらんなさい。'),
  ],
  // とりで 1 広間: ボヤッチ（青。正しい）
  c10c_hint_f1b: (x) => [
    ...S(BO, '青いしるしは、青のレバーでまんねん。\nぜんぶ、いっぺんに、ぎゃくになりまっせ。'),
    ...S(BO, on(x, 'blue') ? '今は、北のベルトで、上の部屋へ、行けまっせ。' : '今は、東の小部屋へ、流れてまっせ。\n北の階段へは、青のレバーを、引くとええ。'),
  ],
  // とりで 2 入口: ボヤッチ（赤。正しい）
  c10c_hint_f2a: (x) => S(BO, on(x, 'red') ? '今なら、東のベルトで、むこうへ行けまっせ。' : '東へ行くなら、赤のレバーを、引くでまんねん。'),
  // とりで 2 分かれ道: ズラッカ（いつも 逆。北へは 青の レバーを 引いた 時）
  c10c_hint_f2b: (x) => [
    ...S(ZU, on(x, 'blue') ? '北へ行くなら…青のレバーを、引け…ぜ。' : '北へは…このまま、青いベルトに、乗れば、いい…ぜ。\nレバーは、さわるな…ぜ。'),
    ...S(NO, '…本当か？'),
  ],
  // とりで 2 北の 部屋: ズラッカ（2回め … みんな 気づく。東の 小部屋へは 赤の レバーを もどした 時）
  c10c_hint_f2c: (x) => [
    ...S(ZU, on(x, 'red') ? '東の小部屋へは…このまま、乗れば、いい…ぜ。' : '東の小部屋へは…赤のレバーを、引け…ぜ。'),
    ...S(KI, 'ちょっと、ズラッカ！\nあんた、さっきから、ぜんぶ、逆を言ってるじゃないの！'),
    ...S(ZU, '…そう…だった…ぜ？'),
    ...S(NO, 'ズラッカの言うことは、逆にすれば、いいんだな。'),
  ],
  // とりで 2 少年の 間の 前: キラジョ
  c10c_hint_f2d: () => [
    ...S(KI, 'この下が、アルゴルさまの、間よ。\n…あたしたちは、ここまで。'),
    ...S(KI, '見つかったら、おしおきだもの。\n…あの子のこと、たのんだわよ。'),
  ],
};

// ───── F3・F4 少年の 間 → むらさきの 音 ─────
function algolScene() {
  const B = FORT3_POS.boss;
  const bx = B.x + 0.5, by = B.y + 0.5;
  return [
    ['bgm', null],
    ['look', bx, by + 1],
    ...N('うす暗い、大きな間…。\nかべに、光のびんが、ずらりと、ならんでいる。'),
    ...N('まん中で、むらさきの光が、ゆらゆら、ゆれている。\nその前に…少年が、立っていた。'),
    ...S(SP, '…その音、かえして。'),
    ...S(ALGOL_NAME, '…返さない。\nこれは、ぼくに、いる物だ。'),
    ...S(NO, '…わけを、話すつもりは、ないんだな。'),
    ...S(ALGOL_NAME, '……。'),
    ['sfx', 'dark'], ['flash'],
    ...N('少年のまわりに、くらい光が、うずまいた。\n…こっちの、光を、すいこもうとしている…！'),
    ...S(NO, '気をつけろ。\nあいつ、こっちの力を、食うつもりだ。'),
    ...showMon(C10C_BOSS_MON.algol),
    ['bgm', C10C_TRACKS.rival],
    ['battle', C10C_BATTLE.algol],
    ['showMon', null],
    ['bgm', null],
    ...N('少年は、がくりと、ひざをついた。'),
    ['flag', C10C.algol], ['sync'],
    ...noteSiSteps(),
  ];
}
function noteSiSteps() {
  const O = FORT3_POS.orb;
  const B = FORT3_POS.boss;
  return [
    ['look', O.x + 0.5, O.y + 1.5],
    ['guestHide', true],
    ['actor', 'algol_f', { sprite: ALGOL, x: B.x + 0.5, y: B.y + 0.5, dir: 'down' }],
    ['actor', 'spica_v', { sprite: 'c9a_spica', x: O.x + 0.5, y: O.y + 3.6, dir: 'up' }],
    ['hideNpc', 'c10c_algol'],
    ...N(`${SP}が、そっと、手をのばすと…`),
    ['sfx', 'sparkle'], ['flash'],
    ...N('むらさきの光は、自分から、ふわりと、\nスピカの手の中へ、とんできた。'),
    ['item', NOTE_SI, 1],
    ['flag', C10C.note], ['sync'],
    ...S(SP, '…あなたの光、わたしと、にてる。'),
    ...S(ALGOL_NAME, '…にてなど、いない。'),
    ['sfx', 'dark'], ['flash'],
    ['remove', 'algol_f'],
    ...N('少年のすがたは、くらい光の中に、きえた。'),
    ['wait', 600],
    ['sfx', 'sparkle'],
    ...N('かべの、光のびんが、いくつか、ことん、とひらいて…\n小さな光が、ふわふわと、空へ、帰っていった。'),
    ['bgm', C9D_TRACKS.song],
    ['wait', 600],
    ...N('♪――'),
    ['wait', 1400],
    ['sfx', 'sparkle'],
    ...N(`${SP}の歌が、ひとふし、ふえた。\n${SP}の光が、少し、強くなった！`),
    ['remove', 'spica_v'], ['guestHide', false],
    ['look', FORT3_POS.portal.x + 0.5, FORT3_POS.portal.y + 0.5],
    ...N('ゆかに、光の出口が、ひらいた。\n（大地の下の、うら口の前へ、出られる）'),
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ];
}
const vorbSteps = (x) => {
  if (x.flag(C10C.note)) return [];
  if (x.flag(C10C.algol)) return noteSiSteps();
  return N('むらさきの光だ。\n少年が、そばに、立っている…。');
};

// ───── E くぼ地の むらさきの 台に 音を 置く ─────
// act3Obj … 幕の クリアの あとの 目標（第99回 A班: 第4幕が 開いた あとは story-c10.js の act3ClearObjective）
function endScene(act3Obj) {
  const cx = PS.x + 0.5, cy = PS.y + 1.6;
  return [
    ['bgm', null],
    ['look', cx - 6, cy - 0.6],
    ['sfx', 'spell'], ['flash'],
    ...N('赤、黄色、緑、青、白、むらさき…\n6つの台が、いっしょに、光った。'),
    ['guestHide', true],
    ['actor', 'spica_e', { sprite: 'c9a_spica', x: cx - 1, y: cy + 0.6, dir: 'up' }],
    ['bgm', C10C_TRACKS.six],
    ['wait', 800],
    ...N('♪――'),
    ['wait', 1600],
    ...S(SP, '……。'),
    ['wait', 700],
    ...S(SP, '…また、ひとつ、思い出した。\n空の上で…小さな、暗い星の、そばに、すわってた。'),
    ...S(SP, 'その星の、名前…。\n…思い出せない。'),
    ['wait', 900],
    ...S(NO, '…あと、ひとつ。\nさいごの音で、きっと、わかるさ。'),
    ['wait', 900],
    ['sfx', 'sparkle'], ['flash'],
    ...N('…そのとき。\nとおくの空で、何かが、金色に、きらりと光った。'),
    ...N('星の塔の、てっぺんだ。\n6つの音に、こたえるように、金色に、光っている…。'),
    ...S(SP, '…呼んでる。'),
    ['remove', 'spica_e'], ['guestHide', false],
    ['look'],
    ['flag', C10C.act3], ['unflag', C10C_PED.si], ['sync'],
    ['objective', act3Obj || C10C_OBJ.act3],
    ['bgm', 'resume'],
  ];
}
function pedSteps(old, act3Obj) {
  return (x) => {
    if (x.flag(C10C.act3)) return N('むらさきの台が、やさしく光っている。');
    if (!x.flag(C10C.start) || !x.flag(C10C.note)) return old ? old(x) : [];
    return [['sfx', 'sparkle'], ['flag', C10C_PED.si], ['sync'], ...N('むらさきの台に、星の音（シ）を、置いた。\nむらさきの台が、ぽうっと、光った！'), ...endScene(act3Obj)];
  };
}

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c10.js の PART3_C10C_OPEN）。false の 間は くぼ地で 音さを 鳴らしても 始まらない
export function c10cScripts(title, open, old = {}) {
  const out = {
    c10c_fork_event: (x) => (open && x.flag(C10C_ACT2) && !x.flag(C10C.start) ? forkScene(title) : []),
    c10c_vortex: (x) => (x.flag(C10C.start) ? vortexSteps(x) : []),
    c10c_vortex_back: () => vortexBackSteps(),
    c10c_sign1: () => signSteps(),
    c10c_isles2_in: (x) => (x.flag(C10C.start) && !x.flag(C10C.isles2) ? isles2InScene() : []),
    c10c_colonel_event: (x) => (x.flag(C10C.isles2) && !x.flag(C10C.colonel) ? colonelScene() : []),
    c10c_orb: orbSteps,
    c10c_trio_event: (x) => (x.flag(C10C.stolen) && !x.flag(C10C.trio) ? trioScene() : []),
    c10c_fort_in: (x) => (x.flag(C10C.trio) && !x.flag(C10C.fortIn) ? fortInScene() : []),
    c10c_fort2_in: (x) => (x.flag(C10C.fortIn) && !x.flag(C10C.fort2) ? fort2InScene() : []),
    c10c_lever_red: () => leverSteps('red'),
    c10c_lever_blue: () => leverSteps('blue'),
    ...HINTS,
    c10c_algol_event: (x) => (x.flag(C10C.fort2) && !x.flag(C10C.algol) ? algolScene() : []),
    c10c_vorb: vorbSteps,
    c10_ped_si: pedSteps(old.ped, old.act3Obj),
  };
  // 橋の 石（石ごとに 台本。maps/c10c.js の stoneScript10c と 同じ 名前）
  for (const [mapId, spans] of [[C10C_MAP.isles1, ISLES1_SPANS], [C10C_MAP.isles2, ISLES2_SPANS]]) {
    let k = 0;
    spans.forEach((sp, i) => { for (const _ of spanStones10c(sp)) out[stoneScript10c(mapId, k++)] = stoneSteps(i); });
  }
  return out;
}

// ───── 目標の 行き先（quest-targets.js）─────
const at = (map, p) => ({ map, x: p.x, y: p.y });
export const CH10C_OBJECTIVE_TARGETS = {
  [C10C_OBJ.start]: [at('c9a_crater', PS)],
  [C10C_OBJ.sky]: [at(KUMOI_VORTEX10C.map, KUMOI_VORTEX10C), at(C10C_MAP.isles1, ISLES1_POS.up)],
  [C10C_OBJ.isles]: [at(C10C_MAP.isles2, ISLES2_POS.up), at(C10C_MAP.isles3, ISLES3_POS.orb)],
  [C10C_OBJ.trio]: [at(UNDER_BACKDOOR10C.map, UNDER_BACKDOOR10C)],
  [C10C_OBJ.fort]: [at(C10C_MAP.fort1, FORT1_POS.down), at(C10C_MAP.fort2, FORT2_POS.down)],
  [C10C_OBJ.fort2]: [at(C10C_MAP.fort2, FORT2_POS.down), at(C10C_MAP.fort3, FORT3_POS.orb)],
  [C10C_OBJ.place]: [at('c9a_crater', PS)],
  [C10C_OBJ.act3]: [at('c9a_crater', PS)],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH10C_OBJECTIVE_TALK = {
  [C10C_OBJ.start]: T4('くぼ地で、星の音さを鳴らしてみよう。', 'くぼ地で、音さを鳴らそうぜ！',
    'のこりの星の音の場所、音さが教えてくれるかもしれません。', 'おんさを、ならそう！'),
  [C10C_OBJ.sky]: T4('クモイ地方の、影の城の北の空に、光のうずがあるはずだ。', '空の上だ！アステルに乗って、クモイ地方へ行こうぜ！',
    '影の城の前の小島の、北のはしから、しらべられそうです。', 'ひかりのうずを、さがそう！'),
  [C10C_OBJ.isles]: T4('橋の石で音を鳴らすと、光の橋がかかる。同じ色は1本だけだ。', '橋をかけて、どんどん進もうぜ！',
    '橋がきえても、どの島にも橋の石がありますよ。あわてずに。', 'ひかりのはしを、かけよう！'),
  [C10C_OBJ.trio]: T4('大地の下の、東のはしに、とりでのうら口があるそうだ。', 'うら口から、しのびこもうぜ！',
    'ヒカリゴケの里から、東へ、ずっと行った所ですね。', 'うらぐちへ、いこう！'),
  [C10C_OBJ.fort]: T4('レバーを引くと、同じ色のしるしのベルトが、ぜんぶ逆になる。', 'ベルトに乗って、運ばれていこうぜ！',
    'ズラッカさんの言うことは、逆にすると、いいみたいですよ。', 'ベルトに、のろう！'),
  [C10C_OBJ.fort2]: T4('とりでのいちばんおくに、むらさきの音があるはずだ。', 'もう少しだ！おくまで行こうぜ！',
    'あの子と、話ができると、いいのですが。', 'むらさきのおとを、とりかえそう！'),
  [C10C_OBJ.place]: T4('くぼ地の、むらさきの台に、星の音を置こう。', 'くぼ地へもどって、台に音を置こうぜ！',
    'ながれ星のくぼ地の台が、待っていますよ。', 'だいに、おとを、おこう！'),
  [C10C_OBJ.act3]: T4('第3幕は、ここまで。続きは、アップデートを待とう。', 'さいごの星の音も、楽しみだな！',
    '第2章の第3幕、おつかれさまでした。', 'つづきが、たのしみだね！'),
};

// ───── すすみぐあい（progress.js。story-c10.js の CH10_PROGRESS。第2幕の クリアの あとに 足す）─────
export const CH10C_PROGRESS = [
  [C10C_ACT2, C10C_OBJ.start],
  [C10C.start, C10C_OBJ.sky],
  [C10C.isles2, C10C_OBJ.isles],
  [C10C.stolen, C10C_OBJ.trio],
  [C10C.trio, C10C_OBJ.trio],
  [C10C.fortIn, C10C_OBJ.fort],
  [C10C.fort2, C10C_OBJ.fort2],
  [C10C.note, C10C_OBJ.place],
  [C10C.act3, C10C_OBJ.act3],
];

// ───── story-c10.js の applyCh10 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん / open … 幕が 開いて いるか（PART3_C10C_OPEN）
export function applyCh10c(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false, act3Obj = null } = {}) {
  const S10 = c10cScripts(title, open, { ped: SCRIPTS.c9c_ped, act3Obj });
  Object.assign(SCRIPTS, S10);
  for (const id of CH10C_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // くぼ地の 武具屋: 幕の クリア（c10_act3）の あと 品が 4つ ふえる（B班の C10C_SHOP_ADD。第2幕の 店の あと）
  makeShop10c();
  if (!SCRIPTS.c9b_armorer?.c10c) {
    const armOld = SCRIPTS.c9b_armorer;
    SCRIPTS.c9b_armorer = Object.assign((x) => (x.flag(C10C.act3) ? [['shop', SHOP10C_CRATER]] : armOld ? armOld(x) : []), { c10c: true });
  }
}

// ───── くぼ地の 武具屋（第2幕の 店 c10b_crater に、B班の C10C_SHOP_ADD を 足した 店）─────
export const SHOP10C_CRATER = 'c10c_crater';
// 第2幕の 店（story-c10b.js）が できて から 作る（読みこむ じゅんに よらない ように、applyCh10c でも よぶ）
function makeShop10c() {
  if (SHOPS[SHOP10C_CRATER] || !SHOPS[SHOP10B_CRATER]) return;
  const base10 = SHOPS[SHOP10B_CRATER];
  SHOPS[SHOP10C_CRATER] = { ...base10, hello: 'いらっしゃい！\nむらさきの星の音の、ふしぎな品が入ったぜ。', items: [...base10.items, ...C10C_SHOP_ADD.filter((id) => !base10.items.includes(id))] };
}
makeShop10c();

// ───── 負けた 時の ヒント（E班の しくみ。ヒントの 文は B班。言う 人は ノクト）─────
mergeBossHints({}, {
  retry: { [C10C_BATTLE.colonel]: 'c10c_colonel_event', [C10C_BATTLE.algol]: 'c10c_algol_event' },
  who: { [C10C_BATTLE.colonel]: NO, [C10C_BATTLE.algol]: NO },
});
export { UNDER_LAND10C };

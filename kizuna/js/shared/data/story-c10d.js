// 第3部「ほしのね」第2章「七つの星の音」第4幕「金の音と、星の橋」（第99回 A班: 世界と 物語）の だいほん（story-c10.js の applyCh10 で まぜる。applyCh10d）
// ※ ネタバレ注意（docs/plan-part3-c10d.md の 16）
// 一本道: 0 ながれ星のくぼ地で 星の音さ（6つの 台の 光が 星の塔の てっぺんを 指す。c10d_start）→ T1 星の塔 1階の 金色の ゆか
//   → T2 てっぺんの さいだんで 音さ（光の 階段。c10d_top）→ T3 星の 階段（門の 番人 4つ。c10d_gate1〜4・星の いずみ）
//   → T4 いただきの 鏡（c10d_mirror）→ T5 金の 音（note_do・c10_note_do。スピカの 歌が 7ふし）→ B1 星見の丘の 星の橋（c10d_bridge）
//   → E くぼ地の 金の 台（c10_ped_do）・8つめの 台 → c10_act4（第2章 クリア）
// 戦いの 中み・品・ヒントの 文は B班。曲は F班（id は maps/c10d-flags.js の C10D_TRACKS）
// ※ story.js・story-c9.js・story-c10.js を import しない（story-c10.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh10d の 引数で もらう）
// ※ 第1部・第2部の ひみつに ふれる せりふは 書かない。カイは 出さない。ソリトゥスの 名前を 出さない。4人の 勇者の 像は 光る だけ（名前も 言葉も 出さない）。
//   鏡は「女王さま」と 言うが、女王が だれか・星の海の きまりは 書かない。少年の わけ・8つめの 音が 何かは 書かない。
//   鏡は もとの 作品の 名前・せりふ・決まり文句を 使わない
import {
  C10D, C10D_ACT3, C10D_GATES, C10D_WELLS, C10D_BLESS, C10D_BLESS_NAMES, C10D_PED, C10D_MAP, C10D_BATTLE, C10D_GATE_BATTLES,
  C10D_BOSS_MON, C10D_MON, C10D_MIRROR_NAME, C10D_MIRROR_SHORT, C10D_TRACKS, NOTE_DO,
} from '../maps/c10d-flags.js?v=9619c3d748be';
import { SPICA_NAME } from '../maps/c9a-flags.js?v=9619c3d748be';
import { ALGOL, ALGOL_NAME } from '../maps/c9c-flags.js?v=9619c3d748be';
import { C9D_TRACKS } from '../maps/c9d-flags.js?v=9619c3d748be';
import {
  STAIR1_POS, STAIR2_POS, STAIR3_POS, SUMMIT_POS, TOWER1_GOLD10D, TOP_SKYSTAIR10D, HILL_SPOT10D, HILL_BRIDGE10D, HILL_STATUES10D,
  PED_DO10D, PED8_10D,
} from '../maps/c10d-rows.js?v=9619c3d748be';
import { PEDESTALS9C } from '../maps/c9c.js?v=9619c3d748be';
import { MONSTERS } from './monsters.js?v=9619c3d748be';
import { mergeBossHints } from './boss-hints.js?v=9619c3d748be';
import { SHOPS } from './shops.js?v=9619c3d748be';
import { C10D_SHOP_ADD } from './items-c10d.js?v=9619c3d748be';
import { SHOP10C_CRATER } from './story-c10c.js?v=9619c3d748be';
// 星の いずみ・門の しくみは world.c10d（world/c10d-steps.js の C10D_API。data から world を 読まない）

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const NO = 'ノクト';
const GANTZ = '武具屋のガンツ';
const MI = C10D_MIRROR_SHORT;
const showMon = (id) => (MONSTERS[id] ? [['showMon', id]] : []);
const TOP = 'star_tower_top';

// ───── 目標の 文（ネタバレしない。場所と しくみだけ）─────
export const C10D_OBJ = {
  start: 'ながれ星のくぼ地で、星の音さを鳴らそう',
  tower: '星の塔の1階の、金色に光るゆかから、てっぺんへ',
  stairs: '星の階段：門の番人に勝って、上へ。星のいずみは、ひとつだけ',
  summit: '星の階段の、いただきへ',
  hill: 'ミドリナ地方の、星見の丘へ',
  place: 'ながれ星のくぼ地の、金の台に、星の音を置こう',
  act4: '第3部　第3章へ（続きはアップデートで！）',
};
export function objective10d(has) {
  if (has(C10D.act4)) return C10D_OBJ.act4;
  if (!has(C10D.start)) return C10D_OBJ.start;
  if (has(C10D.bridge)) return C10D_OBJ.place;
  if (has(C10D.note)) return C10D_OBJ.hill;
  if (has(C10D.gate4)) return C10D_OBJ.summit;
  if (has(C10D.top)) return C10D_OBJ.stairs;
  return C10D_OBJ.tower;
}
export const C10D_OBJ_ALL = Object.values(C10D_OBJ).filter((t, i, a) => a.indexOf(t) === i);
const objStep = () => ['call', async (run) => { await run.runSteps([['objective', objective10d((f) => !!run.owner.char.flags?.[f])]]); }];

// パーティー全員で 見る イベント（いずみ・台は ひとりでも できる ように 入れない）
export const CH10D_STORY_SCRIPTS = ['c10d_fork_event', 'c10d_top_event', ...C10D_GATE_BATTLES.map((id) => `${id}_event`), 'c10d_mirror_event', 'c10d_orb', 'c10d_bridge_event'];

const PD = PEDESTALS9C[PED_DO10D];

// ───── 0 金の 光 ─────
function forkScene(title) {
  const cx = 12.5, cy = PD.y + 1.6;
  return [
    ['bgm', null],
    ['look', cx, cy - 0.6],
    ['guestHide', true],
    ['actor', 'spica_f', { sprite: 'c9a_spica', x: cx, y: cy + 0.6, dir: 'up' }],
    ...S(SP, '…星の音さ、また、ふるえてる。\nさいごの、ひとつ…。'),
    ['sfx', 'spell'], ['flash'],
    ...N('――キイィン…！\n星の音さが、高く、すんだ音で、ふるえた。'),
    ['wait', 700],
    ['sfx', 'sparkle'],
    ...N('6つの台の光が、すうっと、より合わさって…\n1本の、金色の光のすじになった。'),
    ['wait', 600],
    ...N('金色のすじは、森のむこう…\n星の塔の、てっぺんを、まっすぐ、指している。'),
    ...S(SP, '…金色。さいごの音…ド。'),
    ['remove', 'spica_f'], ['guestHide', false],
    ['look'],
    ...title(),
    ...S(NO, '星の塔の、てっぺんか。'),
    ...S(NO, '塔の1階の、星のゆかが、光っているかもしれない。\n行ってみよう。'),
    ['flag', C10D.start], ['sync'],
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── T2 てっぺんの さいだんで 音さ（光の 階段）→ T3 星の 階段へ ─────
function topScene() {
  const A = { x: 11, y: 4 }; // さいだん
  const E = STAIR1_POS.entry;
  return [
    ['bgm', null],
    ['look', A.x + 0.5, A.y + 1.5],
    ...N('塔の、てっぺん…。\n夜空が、すぐ、そこに、ある。'),
    ['guestHide', true],
    ['actor', 'spica_t', { sprite: 'c9a_spica', x: A.x + 0.5, y: A.y + 1.7, dir: 'up' }],
    ...S(SP, '…ここ。\n音さを、鳴らして。'),
    ['sfx', 'spell'], ['flash'],
    ...N('――キイィン…！\n音さの音が、夜空へ、すいこまれていく。'),
    ['wait', 700],
    ['sfx', 'sparkle'],
    ...N('さいだんの上の、夜空から…\n光のつぶが、ひとつずつ、ならんで、おりてきた。'),
    ['flag', C10D.top], ['sync'],
    ['look', TOP_SKYSTAIR10D.x + 0.5, TOP_SKYSTAIR10D.y + 0.5],
    ...N('光の、階段だ。\n空の、ずっと上へ、つづいている…。'),
    ['wait', 600],
    ...S(NO, '…のぼるしか、ないな。'),
    ['remove', 'spica_t'], ['guestHide', false],
    ['fade', 'out'],
    ['teleport', C10D_MAP.stair1, E.x + 0.5, E.y + 0.5, 'up'],
    ['fade', 'in'],
    ['bgm', C10D_TRACKS.stairs],
    ['look', E.x + 0.5, E.y - 4],
    ...N('一歩、一歩、光の段を、のぼっていく…。\nふと、下を見ると――'),
    ['wait', 600],
    ...N('雲のすき間に、ミドリナ、シロガネ、コガネ、クモイ…\n世界が、小さく、見えた。'),
    ...S(SP, '…きれい。'),
    ['wait', 500],
    ...S(NO, '上に、門が見える。\nだれかが、立っているな…。'),
    ...S(NO, 'そばに、星のいずみがある。\nめぐみは3つ。もらえるのは、ひとつだけ、か。'),
    ['look'],
    objStep(),
  ];
}

// ───── T3 門の 番人（その 場に いる 人で 戦う。負けると その 門の 前の おどり場から）─────
const GATE_TEXT = {
  1: [...N('門の前に、鏡のかけらでできた兵が、立ちふさがった！\n体が、ほんのり、色に光っている…。'),
    ...S(SP, '…あの色。星の音と、同じ色…。'),
    ...S(NO, '色のまくか。\n同じ色の音を、鳴らしてみろ。')],
  2: N('鏡のかけらの兵が、ふたつ。\nどちらも、ちがう色に、光っている…！'),
  3: N('ふたつの番人が、ゆらゆらと、色をかえている…。\nこっちにも、色を、うつしてきそうだ！'),
  4: N('小さな鏡の兵が、みっつ…！\nいっせいに、こっちを、ねらっている。'),
};
function gateScene(g) {
  const flag = C10D_GATES[g - 1];
  return [
    ['bgm', null],
    ...GATE_TEXT[g],
    ...showMon(g === 4 ? C10D_MON.shardS : C10D_MON.shard),
    ['call', async (run) => { run.world.c10d.arm(run.world, run.init, g); }],
    ['bgm', C10D_TRACKS.gate],
    ['battle', C10D_GATE_BATTLES[g - 1]],
    ['call', async (run) => { run.world.c10d.disarm(run.world, run.init); }],
    ['showMon', null],
    ['bgm', null],
    ...N('番人は、ぱりん、と、くだけた。\n門が、ゆっくりと、開いていく…。'),
    ['flag', flag], ['sync'],
    ...(g === 4 ? S(NO, 'いただきは、もうすぐだ。') : []),
    objStep(),
    ['bgm', 'resume'],
  ];
}
const gateOk = (x, g) => x.flag(C10D.top) && !x.flag(C10D_GATES[g - 1]) && (g === 1 || x.flag(C10D_GATES[g - 2]));

// ───── 星の いずみ（3つの めぐみから 1つ。リーダーが えらぶ）─────
const BLESS_ORDER = [C10D_BLESS.heal, C10D_BLESS.mind, C10D_BLESS.power];
const BLESS_SAY = {
  [C10D_BLESS.heal]: 'みんなの、きずが、すうっと、いえていく…！\n（全員のHPが、全部、回復した）',
  [C10D_BLESS.mind]: '頭の中が、すみわたっていく…！\n（全員のMPが、全部、回復した）',
  [C10D_BLESS.power]: '体のおくから、力が、わいてくる…！\n（次の戦いの間、全員のあたえるダメージが、1.2倍）',
};
export const WELL_HELP10D = 'いやしの水…全員のHPを、全部回復。たおれた仲間も、起きる\nちえの水…全員のMPを、全部回復\nちからの水…次の戦いの間、全員のあたえるダメージが1.2倍';
function wellSteps(i) {
  return () => [['call', async (run) => {
    const w = run.world;
    if (w.hostOf?.(run.init)) {
      await run.runSteps(N('星のいずみだ。\nめぐみは、パーティーで、ひとつだけ。リーダーが、えらぼう。'));
      return;
    }
    if (w.c10d.wellUsed(w, run.init, i)) {
      await run.runSteps(N('星のいずみは、しずかだ。\n（ここの水は、もう、もらった）'));
      return;
    }
    const pick = (kind) => [['call', async (r2) => {
      const res = w.c10d.bless(w, r2.init, i, kind);
      if (res !== 'ok') return;
      await r2.runSteps([['sfx', 'heal'], ['flash'], ['say', null, `――「${C10D_BLESS_NAMES[kind]}」を、のんだ。\n${BLESS_SAY[kind]}`]]);
    }]];
    await run.runSteps([
      ...N('星のいずみだ。\n3つの水が、しずかに、光っている。', '（ひとつだけ、えらべる。えらぶと、ここの水は、なくなる）'),
      ['choice', 'どの水を、のむ？', [...BLESS_ORDER.map((k) => C10D_BLESS_NAMES[k]), 'やめる'], [...BLESS_ORDER.map(pick), []],
        [...WELL_HELP10D.split('\n'), 'あとで、えらぶ']],
    ]);
  }]];
}

// ───── T4 いただきの 鏡 → T5 金の 音 ─────
function mirrorScene() {
  const O = SUMMIT_POS.orb, B = SUMMIT_POS.boy;
  return [
    ['bgm', null],
    ['look', O.x + 0.5, O.y + 2],
    ...N('空の、いちばん上…。\n金色の光の玉が、しずかに、うかんでいる。'),
    ...N('その前に…少年が、ひとりで、立っていた。'),
    ...S(SP, '…アルゴル。'),
    ['wait', 800],
    ['hideNpc', 'c10d_boy'],
    ['actor', 'boy_m', { sprite: ALGOL, x: B.x + 0.5, y: B.y + 0.5, dir: 'up' }],
    ...N('少年は、金色の光へ、そっと、手をのばした――'),
    ['wait', 600],
    ['sfx', 'dark'], ['shake'], ['flash'],
    ...N('――ピシッ。\n空に、白い、ひびが、走った。'),
    ['actor', 'mirror_m', { sprite: 'c10d_mirror_f', x: O.x + 0.5, y: O.y - 6, dir: 'down' }],
    ['move', 'mirror_m', [[O.x + 0.5, O.y + 1.2]]],
    ['bgm', C10D_TRACKS.mirror],
    ...N('空のさけめから、大きな、金のふちの鏡が、\nゆっくりと、下りてきた。'),
    ...S('？？？', '…ふわぁ。\nどれどれ。光を、はかって、しんぜよう。'),
    ['wait', 600],
    ...S('？？？', '…ふむ。小さい。暗い。\n光の弱い者に、用はない。'),
    ['wait', 900],
    ...N('少年は、何も言わず、立ちつくしている。'),
    ['wait', 900],
    ...S(C10D_MIRROR_NAME, 'われは、光をはかる鏡、ミラーレ。\nこの金の光は、もっとも、光る者のもの。'),
    ...S(MI, 'そなたらの光も、はかってやろう。\n…まあ、たいしたことは、なかろうがな。'),
    ...S(NO, '…来るぞ。'),
    ['remove', 'mirror_m'],
    ...showMon(C10D_BOSS_MON.mirror),
    ['battle', C10D_BATTLE.mirror],
    ['showMon', null],
    ['bgm', null],
    ['actor', 'mirror_m', { sprite: 'c10d_mirror_c', x: O.x + 0.5, y: O.y + 1.2, dir: 'down' }],
    ['sfx', 'dark'], ['shake'],
    ...N('ピキ…ピキピキ…\n鏡に、大きな、ひびが入った。'),
    ...S(MI, '…なんと。\nはかりちがい、とは…。'),
    ['wait', 700],
    ...S(MI, '…女王さまに、お知らせせねば。'),
    ['move', 'mirror_m', [[O.x + 0.5, O.y - 7]]],
    ['remove', 'mirror_m'],
    ...N('鏡は、ふらふらと、空のさけめへ、帰っていった。\nさけめは、すうっと、とじた。'),
    ['flag', C10D.mirror], ['sync'],
    ['wait', 800],
    ['remove', 'boy_m'],
    ...N('…ふと見ると、少年のすがたは、もう、どこにもなかった。'),
    ['wait', 900],
    ...noteDoSteps(),
  ];
}
function noteDoSteps() {
  const O = SUMMIT_POS.orb;
  return [
    ['bgm', null],
    ['hideNpc', 'c10d_boy'],
    ['look', O.x + 0.5, O.y + 1.5],
    ['guestHide', true],
    ['actor', 'spica_d', { sprite: 'c9a_spica', x: O.x + 0.5, y: O.y + 2.4, dir: 'up' }],
    ...N(`${SP}が、そっと、手をのばすと…`),
    ['sfx', 'sparkle'], ['flash'],
    ...N('金色の光は、ふわりと、\nスピカの手の中へ、おりてきた。'),
    ['item', NOTE_DO, 1],
    ['flag', C10D.note], ['sync'],
    ['wait', 1000],
    ['bgm', C9D_TRACKS.song],
    ['wait', 1200],
    ...N('♪――'),
    ['wait', 2200],
    ...N('ド、レ、ミ、ファ、ソ、ラ、シ…\nスピカの歌が、さいごの、ひとふしまで、ひびいていく。'),
    ['wait', 2600],
    ...S(SP, '……。'),
    ['wait', 1400],
    ...S(SP, '…歌えた。\nさいごまで。'),
    ['wait', 1000],
    ['sfx', 'sparkle'],
    ...N('7つの音が、スピカの手から、空へ、うかび上がった。\n光は、遠くの、ミドリナ地方のほうへ、ながれていく…。'),
    ...S(NO, '…あっちは、星見の丘か。\n行ってみよう。'),
    ['remove', 'spica_d'], ['guestHide', false],
    ['look', SUMMIT_POS.portal.x + 0.5, SUMMIT_POS.portal.y + 0.5],
    ...N('ゆかに、光の出口が、ひらいた。\n（星の塔の、てっぺんへ、もどれる）'),
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ];
}
const orbSteps = (x) => {
  if (x.flag(C10D.note)) return N('金色の光が、あった所だ。\n…今は、しずかな、星の石。');
  if (x.flag(C10D.mirror)) return noteDoSteps();
  return N('金色の光の玉だ。\nあたたかい光が、ゆれている…。');
};

// ───── B1 星見の丘の 星の橋（しずかに。せりふを 少なく）─────
function bridgeScene() {
  const P = HILL_SPOT10D, Q = HILL_BRIDGE10D;
  return [
    ['bgm', null],
    ['look', P.x + 0.5, P.y - 1.5],
    ['guestHide', true],
    ['actor', 'spica_b', { sprite: 'c9a_spica', x: P.x + 0.5, y: P.y + 0.5, dir: 'up' }],
    ['wait', 800],
    ...S(SP, '…ここ。'),
    ['wait', 1000],
    ['sfx', 'sparkle'],
    ...N('スピカの手の中で、7つの星の音が、\nふわりと、うかび上がった。'),
    // 曲（F班の c10d_bridge。54.5 秒・くり返さない）は はじまって 51.8 秒で ふしが 止まる。
    //   ここから スピカの ひとことまでの 間（wait）を 合わせて 52 秒 いじょうに して、ふしが 止まった あとに 言う（読む 時間の ぶん さらに おそく なる）
    ['bgm', C10D_TRACKS.bridge],
    ['wait', 3000],
    ...N('7つの光が、ひとつずつ、空へ、のぼっていく…。'),
    ['wait', 5000],
    ...HILL_STATUES10D.map((p, i) => ['actor', `glow_b${i}`, { sprite: 'c10d_glow', x: p.x + 0.5, y: p.y + 0.55, dir: 'down' }]),
    ...N('丘の、4つの像が、しずかに、光った。'),
    ['wait', 5000],
    ['flash'],
    ['actor', 'bridge_b', { sprite: 'c10d_bridge1', x: Q.x + 0.5, y: Q.y + 0.5, dir: 'down' }],
    ['look', Q.x + 0.5, Q.y - 2],
    ...N('丘から、光の橋が、のびていく。'),
    ['wait', 7000],
    ['remove', 'bridge_b'],
    ['actor', 'bridge_b', { sprite: 'c10d_bridge2', x: Q.x + 0.5, y: Q.y + 0.5, dir: 'down' }],
    ['wait', 7000],
    ['remove', 'bridge_b'],
    ['actor', 'bridge_b', { sprite: 'c10d_bridge', x: Q.x + 0.5, y: Q.y + 0.5, dir: 'down' }],
    ...N('空の、ずっと、ずっと、上へ――'),
    ['wait', 8000],
    ...N('……。'),
    ['wait', 6000],
    ...N('橋は、空の、とちゅうで、止まった。'),
    ['wait', 11000],
    ['look', P.x + 0.5, P.y - 1.5],
    ...S(SP, '…足りない。\nもうひとつ、音が、ある。'),
    ['wait', 1200],
    ...S(NO, '…この橋の先に、まだ、何かがある、ってことか。'),
    ['wait', 800],
    ...S(SP, '…うん。\nまだ、先が、ある。'),
    ['wait', 1000],
    ...HILL_STATUES10D.map((_, i) => ['remove', `glow_b${i}`]),
    ['remove', 'bridge_b'],
    ['remove', 'spica_b'], ['guestHide', false],
    ['flag', C10D.bridge], ['sync'],
    ['look'],
    ...S(NO, '…くぼ地へ、もどろう。\n金の台が、待っている。'),
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── E くぼ地の 金の 台 → 8つめの 台 ─────
// act3Obj … 第2章 クリアの あとの 目標（第3章が 開くまでは「第3部　第3章へ（続きは…）」）
function endScene(act4Obj = C10D_OBJ.act4) {
  const cx = 12.5, cy = PD.y + 1.6;
  return [
    ['bgm', null],
    ['look', cx, cy - 0.6],
    ['sfx', 'spell'], ['flash'],
    ...N('赤、金、黄色、緑、青、白、むらさき…\n7つの台が、全部、光った。'),
    ['guestHide', true],
    ['actor', 'spica_e', { sprite: 'c9a_spica', x: cx - 1, y: cy + 0.6, dir: 'up' }],
    ['bgm', C10D_TRACKS.seven],
    ['wait', 900],
    ...N('♪――'),
    ['wait', 1800],
    ['actor', 'gantz_e', { sprite: 'c9b_armorer', x: cx + 1.5, y: cy + 1.4, dir: 'up' }],
    ...S(GANTZ, 'やったな！\n7つ、全部、そろったか！'),
    ['wait', 700],
    ...S(GANTZ, '…ん？\nおかしいな。台は、7つ、作ったはず、なのに…。'),
    ['look', PED8_10D.x + 0.5, PED8_10D.y + 1],
    ['actor', 'ped8_e', { sprite: 'c10d_ped8', x: PED8_10D.x + 0.5, y: PED8_10D.y + 0.5, dir: 'down' }],
    ['wait', 900],
    ...N('台のならびの、いちばん、はしに…\n8つめの、何も、のっていない台が、ふえていた。'),
    ['wait', 1400],
    ...S(SP, '……。'),
    ['wait', 1000],
    ...S(NO, '…8つめ、か。'),
    ['wait', 1200],
    ['remove', 'ped8_e'], ['remove', 'gantz_e'], ['remove', 'spica_e'], ['guestHide', false],
    ['look'],
    ['flag', C10D.act4], ['unflag', C10D_PED.do], ['sync'],
    ['chapter', '第2章　七つの星の音', 'クリア！'],
    ['objective', act4Obj],
    ['bgm', 'resume'],
  ];
}
function pedSteps(old, act4Obj) {
  return (x) => {
    if (x.flag(C10D.act4)) return N('金の台が、やさしく光っている。');
    if (!x.flag(C10D.start) || !x.flag(C10D.note)) return old ? old(x) : [];
    if (!x.flag(C10D.bridge)) return [...N('金の台だ。'), ...S(SP, '…まだ。\n星見の丘が、呼んでる。')];
    return [['sfx', 'sparkle'], ['flag', C10D_PED.do], ['sync'], ...N('金の台に、星の音（ド）を、置いた。\n金の台が、ぽうっと、光った！'), ...endScene(act4Obj)];
  };
}

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c10.js の PART3_C10D_OPEN）。false の 間は くぼ地で 音さを 鳴らしても 始まらない
//   act4Obj … 第2章 クリアの あとの 目標（第100回 A班: 第3章 第1幕が 開いた あとは story-c10.js の act4ClearObjective）
export function c10dScripts(title, open, old = {}, act4Obj = C10D_OBJ.act4) {
  const out = {
    c10d_fork_event: (x) => (open && x.flag(C10D_ACT3) && !x.flag(C10D.start) ? forkScene(title) : []),
    c10d_top_event: (x) => (x.flag(C10D.start) && !x.flag(C10D.top) ? topScene() : []),
    c10d_mirror_event: (x) => (x.flag(C10D.gate4) && !x.flag(C10D.mirror) ? mirrorScene() : []),
    c10d_orb: orbSteps,
    c10d_bridge_event: (x) => (x.flag(C10D.note) && !x.flag(C10D.bridge) ? bridgeScene() : []),
    c10d_bridge_look: () => N('とちゅうで止まった、光の橋だ。\n空の、ずっと上へ、のびている…。'),
    c10_ped_do: pedSteps(old.ped, act4Obj),
    c10d_ped8: () => N('8つめの、石の台だ。\n…何も、のっていない。'),
  };
  for (let g = 1; g <= 4; g++) out[`${C10D_GATE_BATTLES[g - 1]}_event`] = (x) => (gateOk(x, g) ? gateScene(g) : []);
  for (let i = 1; i <= C10D_WELLS.length; i++) out[`c10d_well${i}`] = wellSteps(i);
  return out;
}

// ───── 目標の 行き先（quest-targets.js）─────
const at = (map, p) => ({ map, x: p.x, y: p.y });
export const CH10D_OBJECTIVE_TARGETS = {
  [C10D_OBJ.start]: [at('c9a_crater', PD)],
  [C10D_OBJ.tower]: [at('star_tower_1f', TOWER1_GOLD10D[0]), at(TOP, TOP_SKYSTAIR10D)],
  [C10D_OBJ.stairs]: [at(TOP, TOP_SKYSTAIR10D), at(C10D_MAP.stair1, STAIR1_POS.up), at(C10D_MAP.stair2, STAIR2_POS.up), at(C10D_MAP.stair3, STAIR3_POS.up)],
  [C10D_OBJ.summit]: [at(C10D_MAP.stair3, STAIR3_POS.up), at(C10D_MAP.summit, SUMMIT_POS.orb)],
  [C10D_OBJ.hill]: [at('overworld', HILL_SPOT10D)],
  [C10D_OBJ.place]: [at('c9a_crater', PD)],
  [C10D_OBJ.act4]: [at('c9a_crater', PED8_10D)],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH10D_OBJECTIVE_TALK = {
  [C10D_OBJ.start]: T4('くぼ地で、星の音さを鳴らしてみよう。', 'くぼ地で、音さを鳴らそうぜ！',
    'さいごの星の音の場所、音さが教えてくれるかもしれません。', 'おんさを、ならそう！'),
  [C10D_OBJ.tower]: T4('星の塔の1階で、金色に光るゆかに乗ろう。', '星の塔だ！てっぺんまで、ひとっとびだぜ！',
    '1階の、2つの像の間のゆかが、光っているそうですよ。', 'きんいろのゆかに、のろう！'),
  [C10D_OBJ.stairs]: T4('いずみの水は、ひとつだけ。今、何が足りないかを見て、えらぼう。', '門の番人なんか、ぶっとばしてやろうぜ！',
    '色のまくには、同じ色の音を、鳴らすといいみたいです。', 'もんを、あけよう！'),
  [C10D_OBJ.summit]: T4('いただきは、もうすぐだ。じゅんびを、ととのえよう。', 'あと少しだ！いただきまで、行こうぜ！',
    '金色の光が、上で、待っていますよ。', 'いただきへ、いこう！'),
  [C10D_OBJ.hill]: T4('ミドリナ地方の、星見の丘へ行こう。', '星見の丘まで、ひとっ走りだぜ！',
    '7つの音の光が、星見の丘のほうへ、ながれていきましたね。', 'ほしみのおかへ、いこう！'),
  [C10D_OBJ.place]: T4('くぼ地の、金の台に、星の音を置こう。', 'くぼ地へもどって、台に音を置こうぜ！',
    'ながれ星のくぼ地の台が、待っていますよ。', 'だいに、おとを、おこう！'),
  [C10D_OBJ.act4]: T4('第2章は、ここまで。続きは、アップデートを待とう。', '8つめの台、気になるな！',
    '第2章、おつかれさまでした。', 'つづきが、たのしみだね！'),
};

// ───── すすみぐあい（progress.js。story-c10.js の CH10_PROGRESS。第3幕の クリアの あとに 足す）─────
export const CH10D_PROGRESS = [
  [C10D_ACT3, C10D_OBJ.start],
  [C10D.start, C10D_OBJ.tower],
  [C10D.top, C10D_OBJ.stairs],
  [C10D.gate4, C10D_OBJ.summit],
  [C10D.note, C10D_OBJ.hill],
  [C10D.bridge, C10D_OBJ.place],
  [C10D.act4, C10D_OBJ.act4],
];

// ───── story-c10.js の applyCh10 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん / open … 幕が 開いて いるか（PART3_C10D_OPEN）
//   今の 台本に 足す 物（どれも フラグで 出る）: 星の塔の てっぺんの さいだん（c10d_start から 光の 階段の 場面）
export function applyCh10d(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false, act4Obj = C10D_OBJ.act4 } = {}) {
  const S10 = c10dScripts(title, open, { ped: SCRIPTS.c9c_ped }, act4Obj);
  Object.assign(SCRIPTS, S10);
  for (const id of CH10D_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // くぼ地の 武具屋: 幕の クリア（c10_act4）の あと 品が 4つ ふえる（B班の C10D_SHOP_ADD。第3幕の 店の あと）
  makeShop10d();
  if (!SCRIPTS.c9b_armorer?.c10d) {
    const armOld = SCRIPTS.c9b_armorer;
    SCRIPTS.c9b_armorer = Object.assign((x) => (x.flag(C10D.act4) ? [['shop', SHOP10D_CRATER]] : armOld ? armOld(x) : []), { c10d: true, c10c: true });
  }
  if (!SCRIPTS.c5_altar?.c10d) {
    const altarOld = SCRIPTS.c5_altar;
    SCRIPTS.c5_altar = Object.assign((x) => (x.flag(C10D.start) && !x.flag(C10D.top) ? topScene() : altarOld ? altarOld(x) : []), { c10d: true });
  }
}

// ───── くぼ地の 武具屋（第3幕の 店 c10c_crater に、B班の C10D_SHOP_ADD を 足した 店）─────
export const SHOP10D_CRATER = 'c10d_crater';
function makeShop10d() {
  if (SHOPS[SHOP10D_CRATER] || !SHOPS[SHOP10C_CRATER]) return;
  const base10 = SHOPS[SHOP10C_CRATER];
  SHOPS[SHOP10D_CRATER] = { ...base10, hello: 'いらっしゃい！\n金の星の音の、ふしぎな品が入ったぜ。', items: [...base10.items, ...C10D_SHOP_ADD.filter((id) => !base10.items.includes(id))] };
}
makeShop10d();

// ───── 負けた 時の やり直し（E班の しくみ。ヒントの 文は B班。言う 人は ノクト）─────
mergeBossHints({}, {
  retry: { [C10D_BATTLE.mirror]: 'c10d_mirror_event', ...Object.fromEntries(C10D_GATE_BATTLES.map((id) => [id, `${id}_event`])) },
  who: { [C10D_BATTLE.mirror]: NO, ...Object.fromEntries(C10D_GATE_BATTLES.map((id) => [id, NO])) },
});

// ※※ これは かり。A・B を 合わせる 時に 消す ※※（第90回 Z班 … 第3部 第1章 第1幕の 下じき。docs/plan-part3.md の 9 の「実装メモ（Z班）」）
// 第3部 第1章 第1幕「星ふるえの夜」を A（世界と 物語）・B（戦いと 品）が たがいの 物を 待たずに 動かせる ための かりの 中み。
// ゲームの 本体からは つながない（import するのは テストと 係の 作業〈tools/sim-ch9.mjs など〉だけ。test/ch9-base.test.js が 見はる）。
//
// 中み:
//   ・A班の ため: かりの 決まった 戦い c9a_trio・c9a_trial（今 いる 弱い 魔物。勝てば 先へ 進む）と、星の子の かりの 置き場（C9A_STUB_SPICA）
//       → import './c9a-stub.js?v=cb65ec3f97f7' だけで FIXED_ENCOUNTERS に 入る（B の 物が あれば そちらが 使われる。上がきは しない）
//   ・B班の ため: かりの マップ 1まい（ボスと 戦える 小さな 部屋 c9a_stub_room）と、台本から ['showMon', id] → ['battle', id] を よぶ 形（C9A_STUB_SCRIPTS）
//       → installC9aStub({ maps: MAPS, scripts: SCRIPTS }) で 足す（係の 手元で ためす 時だけ。コミットする ゲームの ファイルからは よばない）
//
// 消す 時に かえる 所: この ファイルを import して いる テスト・tools（test/ch9-base.test.js・tools/sim-ch9.mjs の import を B の
//   data/encounters-c9a.js などに）と、tools/kanji-check.mjs の gameFiles() の 'public/js/shared/data/c9a-stub.js' の 行
import { FIXED_ENCOUNTERS } from './encounters.js?v=cb65ec3f97f7';
import { T } from '../tiles.js?v=cb65ec3f97f7';
import { npc } from '../maps/npc.js?v=cb65ec3f97f7';
import { parseRows16 } from '../maps/past.js?v=cb65ec3f97f7';
import { C9A, C9A_BATTLE, SPICA, SPICA_NAME } from '../maps/c9a-flags.js?v=cb65ec3f97f7';

export const C9A_STUB = true;

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// ───── かりの 決まった 戦い（B が data/encounters-c9a.js で 本物を 作る。名前は maps/c9a-flags.js の C9A_BATTLE）─────
//   c9a_trio … 3人組と スイトール1号（本物は Lv96。今は ぷるりん 3びき）
//   c9a_trial … ホシモリの ともしびの ためし（本物は Lv98。今は つのうさぎ 1ぴき）
fill(FIXED_ENCOUNTERS, {
  [C9A_BATTLE.trio]: { group: [['pururin', 3, 3]], bg: 'forest', bgm: 'boss', canFlee: false, boss: true },
  [C9A_BATTLE.trial]: { group: [['tsunousagi', 1, 1]], bg: 'cave_boss', bgm: 'boss', canFlee: false, boss: true },
});
// 戦いの 魔物の 絵（showMon）: その 戦いの はじめの 魔物
export const stubMonOf = (id) => FIXED_ENCOUNTERS[id]?.group?.[0]?.[0] || id;

// ───── 星の子の かりの 置き場（B が 戦いの わくを 使わない 味方の しくみを 作る。A は 台本で 名前と id だけ 使う）─────
//   heal … 味方が 全員 動いた あとの ほのかな光（HPが いちばん 少ない 仲間を 最大HPの この わりあい 回復）/ light … 画面の 上の 光の 数
export const C9A_STUB_SPICA = { id: SPICA, name: SPICA_NAME, heal: 0.06, light: 3 };

// ───── かりの マップ（ボスと 戦える 小さな 部屋）─────
export const C9A_STUB_ROOM_ID = 'c9a_stub_room';
const ROOM_ROWS = [
  '#########',
  '#...B...#',
  '#.......#',
  '#.......#',
  '#.......#',
  '#...S...#',
  '#########',
];
export const C9A_STUB_ROOM_POS = { boss: { x: 4, y: 1 }, start: { x: 4, y: 5 } };
export function buildC9aStubRoom() {
  const t = parseRows16(ROOM_ROWS, { '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, B: T.CAVE_FLOOR, S: T.CAVE_FLOOR });
  const m = {
    id: C9A_STUB_ROOM_ID, name: 'かりの部屋', kind: 'dungeon', bgm: null, dark: false,
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => 'かりの部屋',
    zoneAt: () => 'safe:hall',
    spawnCounts: {},
  };
  const B = C9A_STUB_ROOM_POS.boss;
  // 話しかけると 中ボス → 勝った あとは ためし
  m.npcs.push(npc('c9a_stub_boss', 'かりのボス', [B.x, B.y], 'elder', 'c9a_stub_boss'));
  // maps/index.js の finishMap と おなじ 表（buildMaps の あとに 足すので ここで 作る）
  m.gateAt = new Map();
  m.npcById = Object.fromEntries(m.npcs.map((n) => [n.id, n]));
  m.chestAt = new Map();
  m.signAt = new Map();
  m.warpAt = new Map();
  m.actionAt = new Map();
  return m;
}

// ───── かりの 台本（['showMon', id] → ['battle', id]。勝てば フラグが 立って 先へ 進む）─────
const fight = (id, flag) => [
  ['showMon', stubMonOf(id)],
  ['say', null, 'かりのボスが、あらわれた！'],
  ['battle', id],
  ['flag', flag],
  ['sync'],
];
export const C9A_STUB_SCRIPTS = {
  c9a_stub_boss: (x) => {
    if (!x.flag(C9A.trio)) return fight(C9A_BATTLE.trio, C9A.trio);
    if (!x.flag(C9A.trial)) return fight(C9A_BATTLE.trial, C9A.trial);
    return [['say', null, 'もう、だれもいない。']];
  },
};

// 係の 手元で ためす 時: かりの マップと 台本を 足す（ゲームの 本体からは よばない）
export function installC9aStub({ maps = null, scripts = null } = {}) {
  if (maps && !maps[C9A_STUB_ROOM_ID]) maps[C9A_STUB_ROOM_ID] = buildC9aStubRoom();
  if (scripts) fill(scripts, C9A_STUB_SCRIPTS);
  return { maps, scripts };
}

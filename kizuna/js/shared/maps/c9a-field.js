// 第3部 第1章 第1幕「星ふるえの夜」（A: 世界と 物語）今の ミドリナ地方（overworld）に たす もの（maps/c9a.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3.md の 9-1）
// どれも 第3部の フラグが ある 人に だけ 出る（第1章を 遊んで いる 子の 世界地図は かわらない。test/ch9-act1-a.test.js が 見はる）
// ・ホシフル村: 1年ぶりの 朝（第2部 クリアの 人が 村に 入ると ルカ）・祭りの ちょうちん 4つ・勇者の 話を 聞きたい 子ども 3人・
//   守り星の石の 南の 下り 階段（c9_stairs から）・村の 井戸（c9_rope から 地下4階への 近道）
// ・星見の丘: 星の花 3本（1年前と 同じ 場所）
// ・ささやきの森の 入口: 光る 道しるべ（c9_starfall から。話すと 星ふるえの森へ）
import { T } from '../tiles.js?v=786b3cdacd05';
import { npc } from './npc.js?v=786b3cdacd05';
import { PLACES } from './overworld.js?v=786b3cdacd05';
import { C9A, C9A_PREP, C9A_LAMPS, C9A_FLOWERS, C9A_KIDS, C9A_ROPE, C9A_TRACKS } from './c9a-flags.js?v=786b3cdacd05';
import { STAIRS9A, WELL9A, caveEntry } from './c9a-cave.js?v=786b3cdacd05';
import { SIGNPOST9A } from './c9a-forest.js?v=786b3cdacd05';

// 祭りの ちょうちん（村を ひと回り）
export const LAMPS9A = [{ x: 15, y: 97 }, { x: 40, y: 97 }, { x: 40, y: 111 }, { x: 15, y: 111 }];
// 星の花（星見の丘の ほこらの まわり。1年前と 同じ 場所）
export const FLOWERS9A = [{ x: 58, y: 81 }, { x: 61, y: 80 }, { x: 64, y: 81 }];
// 勇者の 話を 聞きたい 子ども
export const KIDS9A = [
  { x: 22, y: 100, sprite: 'boy', name: '村の子どもテト' },
  { x: 34, y: 102, sprite: 'girl', name: '村の子どもモモ' },
  { x: 26, y: 105, sprite: 'c9a_kid', name: '村の子どもラン' },
];
// 1年ぶりの 朝（第2部 クリアの 人が 村に 入ると）
export const VILLAGE9A = PLACES.village;

export function attachC9aField(maps) {
  const s = maps.overworld;
  const at = (p) => s.tiles[p.y * s.w + p.x];
  // 1年ぶりの 朝
  const V = VILLAGE9A;
  // 祭りの 日（星ふるえまで）の 村は 星祭りの 曲。ほかの 所・ほかの 時は いつもの 曲（client/field.js の areaBgm と 同じ 決め方）
  const bgm0 = s.bgmAt;
  const usual = (x, y, night, has) => {
    if (bgm0) return bgm0(x, y, night, has);
    const name = s.areaName?.(x, y);
    for (const p of Object.values(PLACES)) if (p.name === name) return p.bgm;
    return name === 'ささやきの森' ? 'forest' : s.bgm || 'field';
  };
  s.bgmAt = (x, y, night, has) => (x >= V.x && y >= V.y && x < V.x + V.w && y < V.y + V.h && has?.(C9A.festival) && !has?.(C9A.starfall)
    ? C9A_TRACKS.festival : usual(x, y, night, has));
  s.triggers.push({ id: 'c9a_morning', x: V.x, y: V.y, w: V.w, h: V.h, script: 'c9a_morning', show: { all: ['c8_solitus'], not: [C9A.festival] } });
  // 祭りの ちょうちん（したくの 間は 火の ない ちょうちん。火を 入れると 光る。祭りの あとも 光った まま）
  LAMPS9A.forEach((p, i) => {
    const f = C9A_LAMPS[i];
    s.gates.push({ x: p.x, y: p.y, closed: at(p), open: T.C9A_LANTERN_ON, levels: [[C9A_PREP.lamp, T.C9A_LANTERN_ON], [f, T.C9A_LANTERN_ON], [C9A.festival, T.C9A_LANTERN]] });
    s.actions.push({ x: p.x, y: p.y, script: `c9a_lamp${i + 1}`, show: { all: [C9A.festival] } });
  });
  // 星の花
  FLOWERS9A.forEach((p, i) => {
    s.npcs.push(npc(`c9a_flower${i + 1}`, '星の花', [p.x, p.y], 'flower', `c9a_flower${i + 1}`, { show: { all: [C9A.festival], not: [C9A_FLOWERS[i], C9A_PREP.flower] }, solid: false }));
  });
  // 勇者の 話を 聞きたい 子ども（祭りの 間）
  KIDS9A.forEach((p, i) => {
    s.npcs.push(npc(`c9a_kid${i + 1}`, p.name, [p.x, p.y], p.sprite, `c9a_kid${i + 1}`, { show: { all: [C9A.festival], not: [C9A.starfall] }, dir: 'down' }));
  });
  // 守り星の石の 南の 下り 階段（c9_stairs の 前は 今の 花だん。ワープも c9_stairs から）
  const S = STAIRS9A;
  const e1 = caveEntry(1);
  s.gates.push({ x: S.x, y: S.y, closed: at(S), open: T.STAIRS_DOWN, flag: C9A.stairs });
  s.warps.push({ x: S.x, y: S.y, to: { map: 'c9a_b1', x: e1.x, y: e1.y, dir: 'down' }, show: { all: [C9A.stairs] } });
  (s.links = s.links || []).push({ x: S.x, y: S.y, to: 'c9a_b1' });
  // 村の 井戸（ルカが ひもを 下ろした あと。地下4階への 近道）
  s.actions.push({ x: WELL9A.x, y: WELL9A.y, script: 'c9a_well', show: { all: [C9A_ROPE] } });
  // ささやきの森の 入口の 光る 道しるべ（星ふるえの あと）
  const G = SIGNPOST9A;
  s.npcs.push(npc('c9a_signpost', '光る道しるべ', [G.x, G.y], 'c9a_signpost', 'c9a_signpost', { show: { all: [C9A.starfall] }, solid: false }));
  s.gateAt = new Map((s.gates || []).map((g) => [g.y * s.w + g.x, g]));
}

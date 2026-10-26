// 第48回 G4: 大技の え で つかう 小さな どうぐ（G4 の つぶ g4〜 を 足す）。この ファイルは G4 だけが さわる
import { rnd } from './axkit.js?v=4ed9358095f4';

// つぶを 1つ 足す（kind は g4〜）。x,y は 画面の 中の いち（とおい つぶの しらべに つかう）
export function add(c, kind, o) {
  const x = o.x ?? o.x0 ?? (o.pts ? o.pts[0][0] : 0), y = o.y ?? o.y0 ?? (o.pts ? o.pts[0][1] : 0);
  c.fx.add({ life: 600, delay: 0, seed: Math.random() * 100, ...o, kind, x, y });
}
// マリオ・3年B組の もの（shape: star・mush・shell・block・coin・fireball・hammer・egg・flower・pipe・kart・foot・runner・chalk・book・house・tube・clock・spanner）
export const obj = (c, shape, o) => add(c, 'g4Obj', { shape, ...o });
// 背景（v: storm・space・sunset・gold・dawn・board・ground・sakura）
export const bg = (c, v, o = {}) => add(c, 'g4Bg', { v, x: 0, y: 0, life: c.len - 120, fout: 360, ...o });
// 画面を くらく（はなつ あいだ）。hitA … あたる ときに 一しゅん あかるく
export function darken(c, a, o = {}) {
  c.k.tint(o.color || '#04020c', { a, life: o.life ?? c.len, fin: o.fin ?? 60, fout: o.fout ?? 260, delay: o.delay || 0 });
}
// 画面の 下に いる 味方の 手もと（つかう 人の 前）。敵なら その まん中
export const hands = (c, up = 22) => ({ x: c.from.x, y: c.fromAlly ? Math.max(c.H - 36, c.from.y - up) : c.from.y + 4 });
// 的の 下の じめん（画面の そとに 出ない）
export const ground = (c, t, dy = 20) => Math.min(c.H - 4, t.y + dy);
// まじる 色の ならび
export const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
// x,y の まわりに n こ（わ）
export const ringPts = (x, y, r, n = 6, sy = 0.5) => Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * Math.PI * 2) * r, y + Math.sin((i / n) * Math.PI * 2) * r * sy]);
export const jitter = (v, a) => v + rnd(-a, a);
// 敵の かずで つぶを へらす（5体でも 上限を こえない）
export const per = (c, n, min = 1) => (c.n === 1 ? n : Math.max(min, Math.round((n * 1.4) / c.n)));
// 敵1体の ときだけ ふやす（敵全体の ときは 0）
export const solo = (c, n) => (c.all ? 0 : n);

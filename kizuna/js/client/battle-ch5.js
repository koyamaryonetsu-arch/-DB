// 第5章 Step 2「星の塔」の たたかいの がめん（client/battle.js・client/battle-ch4.js から よぶ。サーバーがわは shared/battle-ch5.js）
// ・見通しの目: 読まれた 人の まど（名前の 上）に 目の しるしと 読まれた 種類（攻撃・呪文・回復・防御）。
//   読んで いる 間は アルゴスの 3つの 目が 光る。読んだ とき（目から 光の すじ）・当たった とき（しかえし）・外れた とき（目が くらむ）の えんしゅつと バナー
// ・敵が 使うと がめんの まん中に 大きく 出す 技（星の光・星のさばき・ふきあげる風・星の尾）・味方の まどの えんしゅつ・音
import { KIND_NAMES } from '../shared/battle-ch5.js?v=367d06be56ca';
import { ARGOS_EYES } from './render/ch5-tower-art.js?v=367d06be56ca';
import { el } from './ui/dom.js?v=367d06be56ca';
// 第5章 Step 4 の ガイアイーター（ねらいめ・まもり・土はこびの しるし。battle-gaia.js）
import { gaiaDraw, gaiaPresent } from './battle-gaia.js?v=367d06be56ca';

export const TOWER_SCREEN_ANIMS = ['star_light', 'star_judge', 'tower_gust', 'comet_tail'];
export const TOWER_ALLY_FX = {
  star_light: 'bolt', star_judge: 'quake', tower_gust: 'wind', comet_tail: 'fire', comet_dive: 'fire', eye_beam: 'bolt', eye_gaze: 'down',
  gravity: 'down', garg_dive: 'claw', gear_cut: 'claw', foresee: 'dark', foresee_hit: 'dark',
};
export const TOWER_SFX = {
  star_light: 'sparkle', star_judge: 'thunder', judge_charge: 'warn', tower_gust: 'wind', comet_tail: 'fire', comet_dive: 'fire', eye_beam: 'bolt',
  eye_gaze: 'warn', gravity: 'rumble', garg_dive: 'smash', gear_cut: 'smash', foresee: 'warn', foresee_hit: 'crit',
};

// 読まれた 人の まどの しるし（目の え ＋ 種類）。style は 1回だけ 入れる
const EYE_SVG = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10' shape-rendering='crispEdges'%3E%3Cpath fill='%231a1026' d='M4 1h8v1h2v1h1v1h1v2h-1v1h-1v1h-2v1H4V8H2V7H1V6H0V4h1V3h1V2h2z'/%3E%3Cpath fill='%23e8ffff' d='M4 2h8v1h2v1h1v2h-1v1h-2v1H4V7H2V6H1V4h1V3h2z'/%3E%3Cpath fill='%237af0ff' d='M6 2h4v1h1v4h-1v1H6V7H5V3h1z'/%3E%3Cpath fill='%232a0e3a' d='M7 3h2v1h1v2H9v1H7V6H6V4h1z'/%3E%3Cpath fill='%23ffffff' d='M7 3h1v1H7z'/%3E%3C/svg%3E\")";
const CSS = `
.b-mem.foresee { box-shadow: 0 0 0 2px #000, inset 0 0 12px rgba(122, 240, 255, 0.75); animation: b-fs-glow 1.2s ease-in-out infinite; }
.b-mem.foresee::before {
  content: attr(data-fs); position: absolute; left: 50%; top: -0.95em; transform: translateX(-50%); z-index: 3; pointer-events: none;
  font-size: 0.78em; line-height: 1.25; white-space: nowrap; padding: 0 0.45em 0 1.75em; color: #e8ffff;
  background: rgba(16, 20, 46, 0.92) ${EYE_SVG} no-repeat 0.3em 50% / 1.25em auto; border: 1px solid #7af0ff; border-radius: 4px; box-shadow: 0 0 0 1px #000;
}
@keyframes b-fs-glow { 50% { box-shadow: 0 0 0 2px #000, inset 0 0 18px rgba(122, 240, 255, 1); } }
`;
let styled = false;
function ensureCss() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(el('style', { id: 'tower-css', text: CSS }));
}

// 読まれて いる 人の まどの しるし（イベントの たびに なおす。まどを 作りなおしても すぐ もどる）
export function towerMarks(scene) {
  let any = false;
  for (const a of scene.allies()) {
    const s = scene.statusBoxes.get(a.id);
    if (!s) continue;
    const on = !!a.foresee && a.alive;
    if (on) any = true;
    s.box.classList.toggle('foresee', on);
    if (on) s.box.dataset.fs = `「${KIND_NAMES[a.foresee] || ''}」を読まれている`;
    else delete s.box.dataset.fs;
  }
  if (any) ensureCss();
}

// たたかいの え（client/battle.js の draw。すがたを かいた あと）: 読んで いる 間は アルゴスの 3つの 目が 光る
export function towerDraw(scene, x, m, c, px, py, w, h, base) {
  gaiaDraw(scene, x, m, c, px, py, w, h, base);
  if (c.species !== 'argos' || !c.alive) return;
  const reading = scene.allies().some((a) => a.foresee && a.alive);
  const T = scene.time;
  if (!reading && !(scene.gazeUntil > T)) return;
  const pulse = 0.55 + Math.sin(T / 110) * 0.35;
  for (const [ex, ey] of ARGOS_EYES) {
    const cx = px + ex * w, cy = py + ey * h;
    x.globalAlpha = base * pulse * 0.5;
    x.fillStyle = '#7af0ff';
    x.beginPath(); x.arc(cx, cy, 4.5, 0, Math.PI * 2); x.fill();
    x.globalAlpha = base * pulse;
    x.fillStyle = '#e8ffff';
    x.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 2, 2);
    // 光の すじ（十字）
    x.globalAlpha = base * pulse * 0.6;
    x.fillRect(Math.round(cx) - 5, Math.round(cy), 10, 1);
    x.fillRect(Math.round(cx), Math.round(cy) - 4, 1, 8);
  }
  x.globalAlpha = base;
}

// イベントを 見せる とき（client/battle-ch4.js の ch4Present から）
export function towerPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const at = (ids) => (ids || []).map((id) => scene.c.get(id)).filter(Boolean).map((t) => (t.side === 'ally' ? scene.allyPt(t) : scene.center(t))).filter(Boolean);
  if (fx.type === 'foresee') {
    const from = at([fx.actor])[0];
    const to = at(fx.targets);
    scene.gazeUntil = scene.time + 1600;
    if (from) scene.fx.play('foresee_eyes', [from], null, { to });
    g.audio.sfx('warn');
    const n = (fx.targets || []).length;
    scene.banner(n > 1 ? `！見通しの目！${n}人が読まれた` : `！見通しの目！「${KIND_NAMES[fx.kinds?.[0]] || ''}」が読まれた`, 'danger');
  }
  if (ev.foreseeHit) {
    const by = scene.c.get(ev.foreseeHit.by);
    const who = scene.c.get(ev.foreseeHit.who);
    const from = by && scene.center(by);
    if (from && who) scene.fx.play('foresee_hit', [scene.allyPt(who)], null, { from });
    if (from) scene.fx.play('foresee_eyes', [from], null, { to: [] });
    scene.banner(`見ぬかれた！「${KIND_NAMES[ev.foreseeHit.kind] || ''}」は読まれていた！`, 'danger');
  }
  if (ev.foreseeMiss) {
    const by = scene.c.get(ev.foreseeMiss.by);
    const pt = by && scene.center(by);
    if (pt) scene.fx.play('foresee_miss', [pt]);
    g.audio.sfx('sparkle');
    scene.banner('読みが外れた！アルゴスの目がくらんだ！', 'combo');
  }
  if (fx.type === 'telegraph' && actor?.species === 'argos') scene.fx.play('judge_charge', at([fx.actor]));
  gaiaPresent(scene, ev, fx, anim, actor);
  towerMarks(scene);
}

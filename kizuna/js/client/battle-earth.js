// 第5章 Step 6・7「大地の神殿」の ノクト（1回目）と、根の島・神殿の 魔物の がめん（client/battle-ch5.js・client/battle.js から よぶ。サーバーがわは shared/battle-earth.js）
// ・地われ・のみこまれ: その 人の まどに「地われの中」「のみこまれた」の しるし（earthMarks）。落ちた・助けた ときの バナー
// ・新しい コマンド「手をのばす」: だれかが 落ちて いる 時だけ コマンドに 出る（earthReachItem・earthReachPick）
// ・かげぶんしん → 合体技の 前ぶれ: 前ぶれの 間は ノクトと 影たちの まわりに 赤むらさきの わ（earthDraw）と バナー。かまえを くずした・HP半分で 終わった ときも バナー
// ・大地のダンゴムシ: おこると 目が 赤く 光る（だんかいで 大きく）。天空のまもり兵: かばっている 間は 青い わ
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音
import { el } from './ui/dom.js?v=6ce2458453d2';

const NOCTO1 = 'nocto_1';
const CLONE = 'nocto_clone';
const isPillbug = (c) => c?.species === 'earth_pillbug' || String(c?.species || '').endsWith('_earth_pillbug');
export const EARTH_SCREEN_ANIMS = ['sg_beam', 'pb_stomp', 'fs_gold', 'rs_rattle', 'n1_dark', 'n1_combo', 'n1_rift'];
export const EARTH_ALLY_FX = {
  rs_root: 'down', rs_rattle: 'dark', sg_beam: 'fire', sg_arm: 'claw', pb_roll: 'quake', pb_stomp: 'quake', fs_gold: 'bolt', fs_grab: 'claw', fs_swallow: 'dark',
  n1_blade: 'claw', n1_dark: 'dark', n1_rift: 'quake', n1_combo: 'dark', n1c_claw: 'claw',
};
export const EARTH_SFX = {
  rs_root: 'hit', rs_rattle: 'warn', sg_beam: 'blast', sg_arm: 'smash', sg_guard: 'buff', pb_roll: 'smash', pb_curl: 'buff', pb_stomp: 'blast',
  fs_gold: 'sparkle', fs_grab: 'hit', fs_swallow: 'dark', n1_blade: 'smash', n1_dark: 'dark', n1_clones: 'warn', n1_rift: 'blast', n1_combo_ready: 'warn',
  n1_combo: 'blast', n1c_claw: 'hit',
};
// alone … 第5章 Step 9 の ソリトゥスの「ひとりにする」（もどすのは「よびかける」。client/battle-final.js）
export const TRAP_LABEL = { rift: '地われの中', swallow: 'のみこまれた', alone: 'ひとりぼっち' };

// ───────────── 地われ・のみこまれ の しるし ─────────────
const CSS = `
.b-mem.n1-trap { box-shadow: 0 0 0 2px #000, inset 0 0 14px rgba(150, 96, 40, 0.85); filter: saturate(0.7) brightness(0.85); }
.b-mem.n1-trap.n1-swallow { box-shadow: 0 0 0 2px #000, inset 0 0 14px rgba(230, 230, 240, 0.7); }
.b-mem.n1-trap::after {
  content: attr(data-trap); position: absolute; left: 50%; top: -0.95em; transform: translateX(-50%); z-index: 3; pointer-events: none;
  font-size: 0.78em; line-height: 1.25; white-space: nowrap; padding: 0 0.45em; color: #fff4e0;
  background: rgba(60, 34, 14, 0.94); border: 1px solid #d8a060; border-radius: 4px; box-shadow: 0 0 0 1px #000;
}
.b-mem.n1-trap.n1-swallow::after { background: rgba(30, 30, 40, 0.94); border-color: #e8e8f0; }
.b-mem.n1-trap.n1-alone { box-shadow: 0 0 0 2px #000, inset 0 0 16px rgba(20, 30, 90, 0.95); filter: saturate(0.5) brightness(0.7); }
.b-mem.n1-trap.n1-alone::after { background: rgba(8, 10, 30, 0.95); border-color: #7ad8ff; color: #d8f0ff; }
.b-cmd .menu .item.k-reach { border-color: #ffb070; background: linear-gradient(90deg, rgba(200, 110, 40, 0.3), rgba(255, 220, 160, 0.12)); }
.reach-cmd { color: #ffd0a0; font-weight: bold; }
`;
let styled = false;
function ensureCss() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(el('style', { id: 'earth-css', text: CSS }));
}
export function earthMarks(scene) {
  let any = false;
  for (const a of scene.allies()) {
    const s = scene.statusBoxes?.get(a.id);
    if (!s) continue;
    const kind = a.alive ? a.trap || null : null;
    if (kind) any = true;
    s.box.classList.toggle('n1-trap', !!kind);
    s.box.classList.toggle('n1-swallow', kind === 'swallow');
    s.box.classList.toggle('n1-alone', kind === 'alone');
    if (kind) s.box.dataset.trap = TRAP_LABEL[kind] || TRAP_LABEL.rift;
    else delete s.box.dataset.trap;
  }
  if (any) ensureCss();
}

// ───────────── コマンド「手をのばす」（client/battle.js の openCommand）─────────────
// だれかが 地われ・のみこまれ の とき だけ 出す（自分は のぞく）
export function trappedOthers(scene, a) {
  return scene.allies().filter((x) => x.alive && x.trap && x.trap !== 'alone' && x.id !== a?.id);
}
export function earthReachItem(scene, a) {
  const list = trappedOthers(scene, a);
  if (!list.length) return null;
  ensureCss();
  return { html: '<span class="reach-cmd">手をのばす</span>', value: 'reach', cls: 'k-reach' };
}
// 1人なら すぐ・2人いじょう なら えらぶ
export function earthReachPick(scene, a) {
  const list = trappedOthers(scene, a);
  if (!list.length) return scene.openCommand();
  if (list.length === 1) return scene.send({ type: 'reach', target: list[0].id });
  scene.showMenu(list.map((x) => ({ label: `${x.name}（${TRAP_LABEL[x.trap] || ''}）`, value: x.id })), (it) => scene.send({ type: 'reach', target: it.value }), () => scene.openCommand(), 'だれに手をのばす？');
  scene.targeting = { side: 'ally', done: (id) => scene.send({ type: 'reach', target: id }), dead: false };
}
export const REACH_INFO = '地われに落ちた仲間・のみこまれた仲間に手をのばして、すぐに助け出す。\n落ちている間は、動けず、回復も受けられない。';

// ───────────── たたかいの え（client/battle-ch5.js の towerDraw から）─────────────
export function earthDraw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  const T = scene.time || 0;
  // ダンゴムシ: おこると 目が 赤く 光る（左の 頭の 目。え の 0.17,0.56 あたり）
  if (isPillbug(c) && c.anger) {
    const r = (c.anger >= 2 ? 3.2 : 2.2) + Math.sin(T / 110) * 0.6;
    x.globalAlpha = base * (0.55 + Math.sin(T / 140) * 0.2);
    x.fillStyle = c.anger >= 2 ? '#ff2a2a' : '#ff6a3a';
    for (const [ex, ey] of [[0.15, 0.56], [0.24, 0.55]]) {
      x.beginPath();
      x.arc(px + w * ex, py + h * ey, r, 0, Math.PI * 2);
      x.fill();
    }
    x.globalAlpha = base;
  }
  // まもり兵が かばっている
  if (c.sgGuard) {
    x.globalAlpha = base * (0.5 + Math.sin(T / 130) * 0.25);
    x.strokeStyle = '#7ad0ff';
    x.lineWidth = 2;
    x.beginPath();
    x.ellipse(px + w * 0.5, py + h * 0.55, w * 0.5, h * 0.52, 0, 0, Math.PI * 2);
    x.stroke();
    x.globalAlpha = base;
  }
  // 合体技の 前ぶれ: ノクトと 影たちの まわりに 赤むらさきの わ
  const warned = c.species === NOCTO1 ? c.telegraph : c.species === CLONE && scene.enemies?.().some((e) => e.species === NOCTO1 && e.alive && e.telegraph);
  if (!warned) return;
  const pulse = 0.55 + Math.sin(T / 100) * 0.3;
  x.globalAlpha = base * pulse;
  x.strokeStyle = '#d04a8a';
  x.lineWidth = 2;
  x.beginPath();
  x.ellipse(px + w * 0.5, py + h * 0.58, w * 0.48, h * 0.5, 0, 0, Math.PI * 2);
  x.stroke();
  x.strokeStyle = '#ffc8e8';
  x.lineWidth = 1;
  x.beginPath();
  x.ellipse(px + w * 0.5, py + h * 0.58, w * 0.42 + Math.sin(T / 80) * 2, h * 0.44, 0, 0, Math.PI * 2);
  x.stroke();
  x.globalAlpha = base;
}

// ───────────── イベントを 見せる とき（client/battle-ch5.js の towerPresent から）─────────────
export function earthPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const nameOf = (id) => scene.c.get(id)?.name || '';
  if (ev.n1Clones) scene.banner('！ノクトの影があらわれた！2体そろうと合体技がくる', 'danger');
  if (fx.type === 'telegraph' && actor?.species === NOCTO1) {
    g.audio.sfx('warn');
    scene.banner('！合体技のかまえ！影をたおすか、身を守れ！', 'danger');
  }
  if (ev.n1Break) {
    g.audio.sfx('crit');
    scene.banner('合体技のかまえを、くずした！', 'combo');
  }
  if (ev.n1Torn) scene.banner('合体技の手が、ひきはなされた…！', 'danger');
  if (ev.n1Trap && ev.n1Trap.kind !== 'alone') {
    g.audio.sfx('warn');
    if (ev.n1Trap.kind !== 'swallow') scene.shake(420, 4);
    scene.banner(`！${nameOf(ev.n1Trap.who)}が${ev.n1Trap.kind === 'swallow' ? 'のみこまれた' : '地われに落ちた'}！「手をのばす」で助けよう`, 'danger');
  }
  if (fx.type === 'n1Reach' || (ev.n1Free?.by && !ev.slCall)) {
    const who = ev.n1Free?.who || fx.targets?.[0];
    g.audio.sfx('heal');
    if (who) scene.allyFx?.(who, 'up');
    scene.banner(`${nameOf(who)}を助け出した！`, 'combo');
  }
  if (ev.pbAnger) {
    g.audio.sfx('warn');
    scene.banner(ev.pbAnger.lv >= 2 ? `！${nameOf(ev.pbAnger.id)}がとてもおこっている！` : `！${nameOf(ev.pbAnger.id)}がおこった！`, 'danger');
  }
  if (fx.type === 'sgGuard') scene.banner('！まもり兵が、仲間の前に立った', 'danger');
  if (ev.n1Stop) {
    g.audio.sfx('sparkle');
    scene.banner(ev.n1Stop.letter ? 'ノクトが、手を止めた…' : 'ノクトは、戦いをやめた！', 'combo');
  }
  earthMarks(scene);
}

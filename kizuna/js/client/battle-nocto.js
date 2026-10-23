// 第5章 Step 5「ノクトの思い出の迷宮」の ノクトの影と、星読みの里・迷宮の 魔物の がめん（client/battle-ch5.js から よぶ。サーバーがわは shared/battle-nocto.js）
// ・職業の まね: ノクトの影の うしろに、まねて いる 人の 影（左右反転・こい むらさき）を かさねる（noctoSprite）。
//   まねられて いる 人の まどに「まねられている」の しるし（noctoMarks）。まねた ときは 短い バナー
// ・きずなくだき: 前ぶれの 間は 影の まわりに むらさきの わ（noctoDraw）と バナー。よやくを くだかれた・守りぬいた ときも バナー
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音
import { heroCanvas } from './render/hero.js?v=12f512bf8713';
import { monsterCanvas } from './render/monsters.js?v=12f512bf8713';
import { equipKey } from './render/chars.js?v=12f512bf8713';
import { makeCanvas, ctxOf, flipCanvas } from './render/pixel.js?v=12f512bf8713';
import { el } from './ui/dom.js?v=12f512bf8713';

const NOCTO = 'nocto_shadow';
export const NOCTO_SCREEN_ANIMS = ['ns_dark', 'ns_bond_break', 'soul_chill', 'soul_joy', 'homun_blades', 'stardust_shine', 'owl_wind', 'agent_smoke', 'ghost_song'];
export const NOCTO_ALLY_FX = {
  ns_blade: 'claw', ns_dark: 'dark', ns_bond_break: 'dark', agent_shot: 'claw', agent_smoke: 'dark', agent_drug: 'poison', owl_wind: 'wind', owl_gaze: 'down',
  owl_dive: 'claw', stardust_hop: 'claw', stardust_shine: 'bolt', ghost_tear: 'ice', ghost_cling: 'down', ghost_song: 'dark', doll_spin: 'claw', doll_stare: 'down',
  shade_step: 'down', soul_kiss: 'dark', soul_chill: 'ice', soul_joy: 'dark', homun_claw: 'claw', homun_blades: 'claw',
};
export const NOCTO_SFX = {
  ns_blade: 'smash', ns_dark: 'dark', ns_mimic: 'warn', ns_bond_watch: 'warn', ns_bond_break: 'blast',
  agent_shot: 'hit', agent_smoke: 'wind', agent_drug: 'poison', owl_wind: 'wind', owl_gaze: 'dark', owl_dive: 'smash', stardust_hop: 'hit', stardust_shine: 'sparkle',
  ghost_tear: 'ice', ghost_cling: 'dark', ghost_song: 'sleep', doll_spin: 'hit', doll_mend: 'heal', doll_stare: 'dark', shade_step: 'smash', shade_melt: 'buff',
  soul_kiss: 'dark', soul_chill: 'ice', soul_joy: 'dark', homun_claw: 'smash', homun_blades: 'blast', homun_stone: 'heal',
};

// まねた 人の 絵の こまかさ（hero.js の res。できた 絵は res 4 あつかい）
const HERO_RES = 10;
const SHOW_RES = 4;
const cache = new Map();

function personCanvas(p) {
  if (p.mon) return monsterCanvas(p.mon, 0);
  const c = heroCanvas(p.look || {}, p.job || 'warrior', equipKey(p.eq || undefined, p.job || 'warrior'), 'down', 0, HERO_RES);
  c.res = SHOW_RES;
  return c;
}

// 影の 色: 左右反転して、こい むらさきに ぬる（ふちだけ 少し 明るく 見える）
function shadeTint(src) {
  const fl = flipCanvas(src);
  const out = makeCanvas(fl.width, fl.height);
  const o = ctxOf(out);
  o.drawImage(fl, 0, 0);
  o.globalCompositeOperation = 'source-atop';
  o.fillStyle = 'rgba(36,20,70,0.86)';
  o.fillRect(0, 0, out.width, out.height);
  out.res = src.res || 1;
  return out;
}

// 戦いの え: ノクトの影が だれかを まねて いる 間は、うしろに その 人の 影（client/battle.js の computeLayout）
// 第5章 Step 9 の ノクト（本気。nocto_2）も まねる
const MIMIC_SP = new Set([NOCTO, 'nocto_2']);
export function noctoSprite(c, frame = 0) {
  if (!MIMIC_SP.has(c?.species) || !c.mimic) return null;
  const m = c.mimic;
  const key = `${c.species}|${m.mon || ''}|${JSON.stringify(m.look || null)}|${m.job || ''}|${m.eq || ''}|${frame}`;
  let img = cache.get(key);
  if (img) return img;
  const base = monsterCanvas(c.species, frame);
  const r = base.res || 1;
  const bw = base.width / r, bh = base.height / r;
  const p = shadeTint(personCanvas(m));
  const pr = p.res || 1;
  const k = (bh * 0.8) / (p.height / pr);
  const dw = (p.width / pr) * k, dh = (p.height / pr) * k;
  const px = bw * 0.5;
  const W = Math.max(bw, px + dw);
  img = makeCanvas(Math.ceil(W * r), base.height);
  img.res = r;
  const x = ctxOf(img);
  x.imageSmoothingEnabled = false;
  x.globalAlpha = 0.9;
  x.drawImage(p, Math.round(px * r), Math.round((bh - dh) * r), Math.round(dw * r), Math.round(dh * r));
  x.globalAlpha = 1;
  x.drawImage(base, 0, 0);
  if (cache.size > 40) cache.clear();
  cache.set(key, img);
  return img;
}

// まねられて いる 人の まどの しるし
const CSS = `
.b-mem.ns-mimic { box-shadow: 0 0 0 2px #000, inset 0 0 12px rgba(154, 122, 224, 0.8); }
.b-mem.ns-mimic::after {
  content: 'まねられている'; position: absolute; left: 50%; top: -0.95em; transform: translateX(-50%); z-index: 3; pointer-events: none;
  font-size: 0.78em; line-height: 1.25; white-space: nowrap; padding: 0 0.45em; color: #f0e8ff;
  background: rgba(30, 16, 56, 0.92); border: 1px solid #9a7ae0; border-radius: 4px; box-shadow: 0 0 0 1px #000;
}
`;
let styled = false;
function ensureCss() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(el('style', { id: 'nocto-css', text: CSS }));
}
export function noctoMarks(scene) {
  let any = false;
  for (const a of scene.allies()) {
    const s = scene.statusBoxes.get(a.id);
    if (!s) continue;
    const on = !!a.nsMimicked && a.alive;
    if (on) any = true;
    s.box.classList.toggle('ns-mimic', on);
  }
  if (any) ensureCss();
}

// たたかいの え（client/battle-ch5.js の towerDraw から）: きずなくだきの 前ぶれの 間は 影の まわりに むらさきの わ
export function noctoDraw(scene, x, m, c, px, py, w, h, base) {
  if (c.species !== NOCTO || !c.alive || !c.telegraph) return;
  const T = scene.time;
  const pulse = 0.5 + Math.sin(T / 120) * 0.3;
  x.globalAlpha = base * pulse;
  x.strokeStyle = '#9a7ae0';
  x.lineWidth = 2;
  x.beginPath();
  x.ellipse(px + w * 0.4, py + h * 0.55, w * 0.46, h * 0.5, 0, 0, Math.PI * 2);
  x.stroke();
  x.strokeStyle = '#d8c8ff';
  x.lineWidth = 1;
  x.beginPath();
  x.ellipse(px + w * 0.4, py + h * 0.55, w * 0.4 + Math.sin(T / 90) * 2, h * 0.44, 0, 0, Math.PI * 2);
  x.stroke();
  x.globalAlpha = base;
}

// イベントを 見せる とき（client/battle-ch5.js の towerPresent から）
export function noctoPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  // まねた のが ノクト（本気）なら「ノクトが」
  const by = (id) => (scene.c.get(id)?.species === 'nocto_2' ? 'ノクト' : '影');
  if (ev.nsMimic) {
    const who = scene.c.get(ev.nsMimic.who);
    if (who) scene.banner(`！${by(ev.nsMimic.by)}が${who.name}をまねた！`, 'danger');
  }
  if (fx.type === 'nsMimic' && !ev.nsMimic) {
    // 戦いの はじめ（msg）
    const who = scene.c.get(fx.targets?.[0]);
    if (who) scene.banner(`！${by(fx.actor)}が${who.name}をまねた！`, 'danger');
  }
  if (fx.type === 'telegraph' && actor?.species === NOCTO) {
    g.audio.sfx('warn');
    scene.banner('！きずなくだきの前ぶれ！身を守れ！', 'danger');
  }
  if (ev.nsBond) {
    if (ev.nsBond.broke) scene.banner('合体技のよやくが、くだかれた…！', 'danger');
    else if (ev.nsBond.guarded.length) {
      g.audio.sfx('sparkle');
      scene.banner('きずなを守りぬいた！', 'combo');
    }
  }
  noctoMarks(scene);
}

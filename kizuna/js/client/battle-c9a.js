// 第3部 第1章 第1幕「星ふるえの夜」の 星の子・3人組と スイトール1号・ホシモリの ともしびの ためし・ふつうの 魔物の がめん
// （client/battle-c8r.js と client/battle.js から よぶ。サーバーがわは shared/battle-c9a.js）
// ・星の子の光（がめんの 左上）: 小さな 星の子の 絵と「星の子の光 ★★★」（snapshot の spica・ev.c9Spica で かわる）。ほのかな光で 仲間の まどが 光る
// ・スイトール1号: すいこみ口を 向けるまでの しるし（●●○）・向けた（赤い わと「星の子をねらっている！防御で守れ！」）・こわれた（なおるまでの しるし）
//   すいこみ口: 向けて いる 間は 風が すいこまれる
// ・ホシモリ: HPの 線の かわりに「夜明け」の めもり（16）・やみの いぶきまでの しるし・ねらわれた 人の 名前。勝つと たおれずに うなずく（え の コマ 2・3。c9aSprite）
// ・仲間の まど: 名前の 横に ともしびの 火の しるし（消えると 黒い しるし。c9aStatus）
// ・コマンド: ともしびが 消えた 仲間が いる ときの「明かりをわける」を いちばん 上に（c9aCmdItems・c9aCmdPick。スマホでも 大きな ボタン）
// ・バナー・大きく 出す 技・味方の まどの えんしゅつ・音（client/battle-c8r.js に まぜる）
import { C9A_SUITORU, C9A_HOSHIMORI, C9A_NOZZLE } from '../shared/data/monsters-c9a.js?v=3e6a025be338';
import { SHARE } from '../shared/data/abilities-c9a.js?v=3e6a025be338';
import { monsterCanvas } from './render/monsters.js?v=3e6a025be338';
// 第3部 第1章 第2幕: スピカの てらす・デデドン大王・皿（battle-c9b.js）
// （C9B_OWN_TELE・C9B_SCREEN_ANIMS・C9B_ALLY_FX・C9B_SFX は client/battle-c8r.js・battle-ch4.js・battle.js が じかに まぜる）
import { c9bHud, c9bSprite, c9bDraw, c9bPresent, c9bCmdItems, c9bCmdPick } from './battle-c9b.js?v=3e6a025be338';

// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C9A_OWN_TELE = [C9A_SUITORU, C9A_HOSHIMORI];
export const C9A_SCREEN_ANIMS = ['c9t_suck', 'c9h_breath', 'c9h_dawn', 'c9h_hoot', 'c9t_boom'];
export const C9A_ALLY_FX = {
  c9n_fang: 'claw', c9n_dash: 'wind', c9n_bonk: 'quake', c9n_spore: 'down', c9n_fire: 'fire', c9n_flare: 'bolt', c9n_dazzle: 'down',
  c9n_bite: 'claw', c9n_dust: 'wind', c9n_drain: 'down', c9n_roll: 'quake', c9n_moss: 'down', c9n_peck: 'claw', c9n_gaze: 'down',
  c9t_punch: 'quake', c9t_hose: 'wind', c9t_bomb: 'fire', c9t_beam: 'bolt', c9t_suck: 'quake',
  c9h_wing: 'claw', c9h_hoot: 'down', c9h_gaze: 'down', c9h_breath: 'wind',
};
export const C9A_SFX = {
  c9n_fang: 'hit', c9n_dash: 'hit', c9n_howl: 'buff', c9n_bonk: 'hit', c9n_spore: 'sparkle', c9n_glow: 'sparkle', c9n_fire: 'fire', c9n_flare: 'bolt', c9n_dazzle: 'warn',
  c9n_bite: 'hit', c9n_dust: 'hit', c9n_drain: 'hit', c9n_roll: 'smash', c9n_moss: 'warn', c9n_mossglow: 'sparkle', c9n_peck: 'hit', c9n_harden: 'buff', c9n_gaze: 'warn',
  c9t_punch: 'smash', c9t_hose: 'hit', c9t_bomb: 'blast', c9t_beam: 'bolt', c9t_aim: 'warn', c9t_suck: 'blast', c9t_rest: 'hit', c9t_boom: 'blast',
  c9h_wing: 'smash', c9h_hoot: 'blast', c9h_gaze: 'warn', c9h_breath: 'blast', c9h_dawn: 'sparkle', c9a_share: 'sparkle',
};

// ───────────── 星の子の 小さな 絵（12×12 の ドット。Y 星の 光・W 白・H かみ・S はだ・K 目・P ほお・D 服）─────────────
const SPICA_DOTS = [
  '.....Y......',
  '....YWY.....',
  '..HHHHHH....',
  '.HHHHHHHH...',
  '.HSSSSSSH...',
  '.HSKSSKSH.Y.',
  '.HSSSSSSH...',
  '..SPSSPS....',
  '...DDDD..Y..',
  '..DDWWDD....',
  '..DDDDDD....',
  '...S..S.....',
];
const SPICA_COL = { Y: '#fff2a8', W: '#ffffff', H: '#ffe9a8', S: '#ffe0c8', K: '#3a2a50', P: '#ff9ab0', D: '#9ad8ff' };
export function spicaCanvas(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return null;
  const c = doc.createElement('canvas');
  c.width = 12;
  c.height = 12;
  const x = c.getContext('2d');
  SPICA_DOTS.forEach((row, y) => [...row].forEach((ch, i) => {
    if (!SPICA_COL[ch]) return;
    x.fillStyle = SPICA_COL[ch];
    x.fillRect(i, y, 1, 1);
  }));
  return c;
}
export const spicaStars = (light, max) => '★'.repeat(Math.max(0, light)) + '☆'.repeat(Math.max(0, max - light));

// CSS は ここで 入れる（battle-buffs.js と おなじ やりかた）
const CSS = `
.c9a-hud { position: absolute; left: 4px; top: 4px; z-index: 3; display: flex; align-items: center; gap: 4px; padding: 2px 8px 2px 4px; border-radius: 8px;
  background: rgba(10, 14, 40, 0.72); border: 1px solid rgba(255, 242, 168, 0.55); color: #fff2a8; font-size: 13px; line-height: 1.2; pointer-events: none; white-space: nowrap; }
.c9a-hud canvas { width: 24px; height: 24px; image-rendering: pixelated; }
.c9a-hud .st { letter-spacing: 1px; color: #ffe066; text-shadow: 0 0 4px rgba(255, 230, 120, 0.8); }
.c9a-hud.lost .st { animation: c9a-shake 0.5s; }
.c9a-hud.glow { box-shadow: 0 0 10px rgba(255, 242, 168, 0.9); }
@keyframes c9a-shake { 0%, 100% { transform: none; } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
.b-mem .c9a-fire { display: inline-block; width: 0.62em; height: 0.9em; margin: 0 0.15em 0 0.25em; vertical-align: -0.05em;
  background: radial-gradient(ellipse at 50% 70%, #fff3a0 0 28%, #ffb84a 40%, #ff7a2a 62%, transparent 66%); border-radius: 50% 50% 45% 45% / 70% 70% 30% 30%; }
.b-mem .c9a-fire.out { background: radial-gradient(ellipse at 50% 75%, #6a6a7a 0 30%, #3a3a4a 55%, transparent 60%); opacity: 0.8; }
@media (max-aspect-ratio: 1/1) { .c9a-hud { top: auto; bottom: 4px; font-size: 11px; padding: 1px 6px 1px 3px; } .c9a-hud canvas { width: 18px; height: 18px; } }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c9a-css')) return;
  const s = document.createElement('style');
  s.id = 'c9a-css';
  s.textContent = CSS;
  document.head.append(s);
}

// ───────────── はじめ（client/battle.js の constructor。snapshot の spica が ある 戦いだけ）─────────────
export function c9aStart(scene, snap) {
  scene.c9spica = snap?.spica ? { ...snap.spica } : null;
  if (!scene.c9spica || typeof document === 'undefined' || !scene.stage) return;
  addCss();
  const hud = document.createElement('div');
  hud.className = 'c9a-hud';
  const pic = spicaCanvas();
  if (pic) hud.append(pic);
  const t = document.createElement('span');
  t.textContent = '星の子の光';
  const st = document.createElement('span');
  st.className = 'st';
  hud.append(t, st);
  scene.stage.append(hud);
  scene.c9hud = { el: hud, st };
  c9aHud(scene);
}
export function c9aHud(scene, flash = null) {
  const s = scene.c9spica;
  const h = scene.c9hud;
  if (!s || !h) return;
  h.st.textContent = spicaStars(s.light, s.max);
  if (flash) {
    h.el.classList.remove('lost', 'glow');
    void h.el.offsetWidth;
    h.el.classList.add(flash);
    setTimeout(() => h.el.classList.remove(flash), 700);
  }
  // 第3部 第1章 第2幕: てらすの たまりぐあい（battle-c9b.js）
  c9bHud(scene);
}

// ───────────── 仲間の まど（client/battle.js の renderStatus）: 名前の 横に ともしびの しるし ─────────────
export function c9aStatus(s, a) {
  if (!s?.name) return;
  const parent = s.name.parentNode;
  let f = parent?.querySelector?.('.c9a-fire');
  if (a.torch9 === undefined) {
    f?.remove();
    return;
  }
  if (!f && parent) {
    f = document.createElement('span');
    f.className = 'c9a-fire';
    s.name.after(f);
  }
  if (!f) return;
  f.classList.toggle('out', !a.torch9);
  f.title = a.torch9 ? 'ともしび' : 'ともしびが消えている';
}

// ───────────── え（client/battle-c8r.js の c8rSprite の はじめ）─────────────
export function c9aSprite(c, frame) {
  if (c?.species === C9A_HOSHIMORI && c.hmWin) return monsterCanvas(C9A_HOSHIMORI, (frame ? 1 : 0) + 2);
  // 第3部 第1章 第2幕: すわりこむ 大王（battle-c9b.js）
  return c9bSprite(c, frame);
}

function tag(x, tx, ty, text, base, bg, fg, wd = 30) {
  x.globalAlpha = base * 0.88;
  x.fillStyle = bg;
  x.fillRect(Math.round(tx - wd / 2), Math.round(ty - 5), wd, 10);
  x.globalAlpha = base;
  x.fillStyle = fg;
  x.font = 'bold 7px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, tx, ty + 0.5);
  x.textAlign = 'start';
  x.textBaseline = 'alphabetic';
}
function dots(x, cx, y, on, max, base, T, cols) {
  const gap = 10, x0 = cx - ((max - 1) * gap) / 2;
  for (let i = 0; i < max; i++) {
    const lit = i < on;
    const last = lit && on === 1;
    x.globalAlpha = base * 0.6;
    x.fillStyle = '#060c18';
    x.beginPath();
    x.arc(x0 + i * gap, y, 4.5, 0, Math.PI * 2);
    x.fill();
    x.globalAlpha = base * (lit ? (last ? 0.7 + Math.sin(T / 80) * 0.3 : 0.95) : 0.3);
    x.fillStyle = lit ? (last ? cols[1] : cols[0]) : cols[2];
    x.beginPath();
    x.arc(x0 + i * gap, y, 3.2, 0, Math.PI * 2);
    x.fill();
  }
  x.globalAlpha = base;
}

// ───────────── たたかいの え（client/battle-c8r.js の c8rDraw の さいご）─────────────
export function c9aDraw(scene, x, m, c, px, py, w, h, base) {
  // 第3部 第1章 第2幕: 大王・皿・見えにくい 魔物・まっ暗（battle-c9b.js）
  c9bDraw(scene, x, m, c, px, py, w, h, base);
  if (!c?.alive) return;
  const T = scene.time || 0;
  // スイトール1号
  if (c.c9AimEvery) {
    if (c.c9Broken) {
      tag(x, px + w / 2, Math.max(8, py + 6), `すいこみ口こわれた！なおるまで${c.c9FixLeft ?? 0}`, base, '#1a2a10', '#c8ff8a', 92);
    } else if (c.c9Aim) {
      x.globalAlpha = base * (0.5 + Math.sin(T / 70) * 0.4);
      x.strokeStyle = '#ff4a6a';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(px + w / 2, py + h / 2, Math.min(w, h) * 0.52, 0, Math.PI * 2);
      x.stroke();
      x.globalAlpha = base;
      tag(x, px + w / 2, Math.max(8, py + 6), '星の子をねらっている！防御で守れ！', base, '#3a0a1a', '#ffd06a', 104);
    } else dots(x, px + w / 2, Math.max(6, py + 4), c.c9AimLeft || 0, c.c9AimEvery, base, T, ['#fff6a0', '#ff4a6a', '#2a2040']);
  }
  // すいこみ口: 向けて いる 間は 風が すいこまれる
  if (c.c9Nozzle) {
    const mec = scene.enemies?.().find((e) => e.c9AimEvery && e.alive);
    if (mec?.c9Aim) {
      x.globalAlpha = base * 0.8;
      x.strokeStyle = '#e8f4ff';
      x.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const t = ((T / 300 + i / 4) % 1);
        const r = (1 - t) * w * 0.9;
        x.beginPath();
        x.arc(px + w * 0.9, py + h / 2, r, Math.PI * 0.6, Math.PI * 1.4);
        x.stroke();
      }
      x.globalAlpha = base;
      tag(x, px + w / 2, py + h + 4, 'こわすと止まる', base, '#10203a', '#bff4ff', 50);
    }
  }
  // ホシモリ: 夜明けの めもり（HPの 線の かわり）・やみの いぶきまでの しるし
  if (c.hmDawnMax) {
    const bw = Math.max(70, w * 0.9), bx = px + w / 2 - bw / 2, by = Math.max(12, py + 4);
    const k = Math.min(1, (c.hmDawn || 0) / c.hmDawnMax);
    x.globalAlpha = base * 0.85;
    x.fillStyle = '#0a0a1e';
    x.fillRect(Math.round(bx) - 1, Math.round(by) - 1, Math.round(bw) + 2, 6);
    const g = x.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, '#5a4a9a');
    g.addColorStop(1, '#ffd66b');
    x.globalAlpha = base;
    x.fillStyle = g;
    x.fillRect(Math.round(bx), Math.round(by), Math.round(bw * k), 4);
    x.fillStyle = 'rgba(10,10,30,0.6)';
    for (let i = 1; i < c.hmDawnMax; i++) x.fillRect(Math.round(bx + (bw * i) / c.hmDawnMax), Math.round(by), 1, 4);
    // 半分の しるし（ここから いぶきが 2人に）
    x.fillStyle = '#ff8a6a';
    x.fillRect(Math.round(bx + bw / 2), Math.round(by) - 2, 1, 8);
    tag(x, px + w / 2, by + 11, c.hmWin ? '夜明け！' : `夜明け ${c.hmDawn || 0}/${c.hmDawnMax}`, base, '#2a1a40', '#fff4c0', 50);
    if (!c.hmWin) {
      if ((c.hmBreathAim || []).length) {
        const names = c.hmBreathAim.map((id) => scene.c?.get?.(id)?.name).filter(Boolean).join('と');
        tag(x, px + w / 2, py + h * 0.62, `やみのいぶき…！ねらい：${names}`, base, '#14142a', '#d8d8ff', Math.min(150, 50 + names.length * 7));
      } else if (c.hmBreathEvery) dots(x, px + w / 2, by + 21, c.hmBreathLeft || 0, c.hmBreathEvery, base, T, ['#9a9ad0', '#ff4a6a', '#2a2040']);
    }
  }
}

// ───────────── イベントを 見せる とき（client/battle-c8r.js の c8rPresent の さいご）─────────────
export function c9aPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const warn = (t) => { g.audio.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g.audio.sfx(s); scene.banner(t, 'combo'); };
  const nm = (id) => scene.c?.get?.(id)?.name || '';
  // 星の子の光
  if (ev.c9Spica) {
    if (!scene.c9spica && ev.c9Spica.max) scene.c9spica = { light: ev.c9Spica.light, max: ev.c9Spica.max };
    if (scene.c9spica) {
      scene.c9spica.light = ev.c9Spica.light ?? scene.c9spica.light;
      c9aHud(scene, ev.c9Spica.lost ? 'lost' : ev.c9Spica.glow ? 'glow' : null);
    }
    if (ev.c9Spica.to) scene.glowStatus?.(ev.c9Spica.to, '#fff2a8');
    if (ev.c9Spica.relit) { scene.glowStatus?.(ev.c9Spica.relit, '#ffb84a'); good(`星の子の光で、${nm(ev.c9Spica.relit)}の火がついた！`, 'sparkle'); }
  }
  // 3人組
  if (ev.c9tAim) warn('！星の子がねらわれた！「防御」で守ろう！');
  if (ev.c9tSuck?.guard) { scene.glowStatus?.(ev.c9tSuck.guard, '#bff4ff'); good(`${nm(ev.c9tSuck.guard)}が、星の子を守った！`); }
  if (ev.c9tSuck && !ev.c9tSuck.guard) { scene.shake?.(700, 8); warn(`星の子の光が、すわれた…！（${spicaStars(ev.c9tSuck.light, scene.c9spica?.max || 3)}）`); }
  if (ev.c9tBreak) good(ev.c9tBreak.stop ? 'すいこみが止まった！' : 'すいこみ口をこわした！', 'sparkle');
  if (ev.c9tFix) warn('すいこみ口が、なおってしまった…！');
  if (ev.c9tDown) {
    // メカが ばくはつして 3人組が 空の かなたへ（たのしい えんしゅつ。render/battlefx-c9a.js の c9t_boom）
    const m = scene.c?.get?.(ev.c9tDown.id);
    const pt = m && scene.center?.(m);
    if (pt) scene.fx?.play?.('c9t_boom', [pt]);
    scene.shake?.(900, 10);
    good('ホシドロ一味は、空のかなたへ！', 'sparkle');
  }
  // ホシモリ
  if (ev.c9hWarn) warn(`！やみのいぶき…ねらいは${ev.c9hWarn.ids.map(nm).join('と')}！`);
  if (ev.c9hBreath) {
    for (const id of ev.c9hBreath.out) scene.glowStatus?.(id, '#3a3a6a');
    for (const id of ev.c9hBreath.kept) scene.glowStatus?.(id, '#ffb84a');
    if (ev.c9hBreath.out.length) warn('火が消えた！「明かりをわける」を！');
    else if (ev.c9hBreath.kept.length) good('ともしびを、手でかこって守った！', 'sparkle');
  }
  if (ev.c9hShare) { scene.glowStatus?.(ev.c9hShare.to, '#ffb84a'); good(`${nm(ev.c9hShare.to)}のともしびが、ともった！`, 'sparkle'); }
  if (ev.c9hDawn?.gain >= 2) good('大きな一撃！夜明けが近づいた！', 'sparkle');
  if (ev.c9hWin) { scene.shake?.(600, 4); good('夜明け！ホシモリがうなずいた。', 'sparkle'); }
  if (ev.c9hDark) { scene.shake?.(800, 6); scene.banner('あたりが、まっくらに…', 'danger'); }
  // 第3部 第1章 第2幕（battle-c9b.js）
  c9bPresent(scene, ev);
  void fx; void anim; void actor;
}

// ───────────── コマンド（client/battle-c8r.js の c8rCmdItems・c8rCmdPick）─────────────
const unlit = (scene) => (scene.allies?.() || []).filter((x) => x.alive && x.torch9 === 0);
export function c9aCmdItems(scene, a) {
  // 第3部 第1章 第2幕: スピカ：てらす（battle-c9b.js）
  const tb = c9bCmdItems(scene, a);
  if (tb.items.length) return tb;
  const items = [];
  let info = '';
  if (!a || a.torch9 !== 1 || !(a.abilities || []).includes(SHARE)) return { items, info };
  const u = unlit(scene);
  if (!u.length) return { items, info };
  items.push({ html: '<span class="dual-cmd">明かりをわける</span>', value: 'c9ashare', cls: 'k-dual' });
  info = `${u.map((x) => x.name).join('・')}のともしびが消えている！「明かりをわける」で、火をつけ直そう（全員の火が消えると、まっくらで負け）。`;
  return { items, info };
}
export function c9aCmdPick(scene, a, value) {
  if (value === 'c9bteru') return c9bCmdPick(scene, a, value);
  if (value !== 'c9ashare') return false;
  const u = unlit(scene);
  if (!u.length) return scene.openCommand();
  scene.showMenu(u.map((x) => ({ label: `${x.name}　HP${x.hp}`, value: x.id })), (it) => scene.send({ type: 'ability', id: SHARE, target: it.value }), () => scene.openCommand(), 'だれに明かりをわける？');
  scene.targeting = { side: 'ally', done: (id) => scene.send({ type: 'ability', id: SHARE, target: id }), dead: false };
  return true;
}
export { C9A_NOZZLE };

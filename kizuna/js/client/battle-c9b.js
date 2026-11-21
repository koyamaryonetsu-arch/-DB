// 第3部 第1章 第2幕「鉱山の底の先」の スピカの てらす・デデドン大王・皿・ふつうの 魔物の がめん
// （client/battle-c9a.js から よぶ。サーバーがわは shared/battle-c9b.js）
// ・てらすの たまりぐあい（星の子の光の 横）: 「てらす ◆◆◇◇」→ たまると「てらす OK」（snapshot の spica.teru・ev.c9Spica.teru）
// ・コマンド: たまって いて 役に 立つ とき（大王の まっ暗・見えにくい 魔物）は いちばん 上に「スピカ：てらす」（c9bCmdItems・c9bCmdPick）
// ・大王: 皿を 見るまでの しるし（●●○）・大ジャンプの 前ぶれ・しょんぼり。勝つと たおれずに すわりこむ（え の コマ 2・3。c9bSprite）
// ・皿: 見られて いる 皿に 金の わと「ねらわれている！こわせ！」・まっ暗の 間は「？」
// ・まっ暗: がめん ぜんたいを 暗い 青で おおう（こわく しない。スピカの 光の まわりは 少し 明るい）。てらすと うすく なる
// ・見えにくい 魔物（大ミミズ）: 暗い かげで おおう（てらすと 消える）
import { C9B_DEDEDON, C9B_DISH_IDS } from '../shared/data/monsters-c9b.js?v=786b3cdacd05';
import { TERU } from '../shared/data/abilities-c9b.js?v=786b3cdacd05';
import { monsterCanvas } from './render/monsters.js?v=786b3cdacd05';
// 第3部 第1章 第3幕: ナゾカケ・ヒックリカエール2号（battle-c9c.js。C9C_OWN_TELE・C9C_SCREEN_ANIMS・C9C_ALLY_FX・C9C_SFX は client/battle-c8r.js・battle-ch4.js・battle.js が じかに まぜる）
import { c9cSprite, c9cDraw, c9cPresent, c9cCmdItems, c9cCmdPick } from './battle-c9c.js?v=786b3cdacd05';
// 第3部 第1章 第4幕: 星のうた・あそびたい魔人 ムウ（battle-c9d.js。C9D_OWN_TELE・C9D_SCREEN_ANIMS・C9D_ALLY_FX・C9D_SFX は client/battle-c8r.js・battle-ch4.js・battle.js が じかに まぜる）
import { c9dHud, c9dSprite, c9dDraw, c9dPresent, c9dCmdItems, c9dCmdPick } from './battle-c9d.js?v=786b3cdacd05';
// 第3部 第2章 第1幕: タマゴン・モルド（battle-c10a.js。C10A_OWN_TELE・C10A_SCREEN_ANIMS・C10A_ALLY_FX・C10A_SFX は client/battle-c8r.js・battle-ch4.js・battle.js が じかに まぜる）
import { c10aSprite, c10aDraw, c10aPresent, c10aCmdInfo } from './battle-c10a.js?v=786b3cdacd05';
// 第3部 第2章 第2幕: ゲッコー・シロフクロウ（battle-c10b.js。C10B_OWN_TELE・C10B_SCREEN_ANIMS・C10B_ALLY_FX・C10B_SFX は client/battle-c8r.js・battle-ch4.js・battle.js が じかに まぜる）
import { c10bSprite, c10bDraw, c10bPresent, c10bCmdItems, c10bCmdPick } from './battle-c10b.js?v=786b3cdacd05';
// 第3部 第2章 第3幕: たいさ・アルゴル（battle-c10c.js。C10C_OWN_TELE・C10C_SCREEN_ANIMS・C10C_ALLY_FX・C10C_SFX は client/battle-c8r.js・battle-ch4.js・battle.js が じかに まぜる）
import { c10cSprite, c10cDraw, c10cPresent, c10cCmdItems, c10cCmdPick } from './battle-c10c.js?v=786b3cdacd05';

// 前ぶれの バナーを 自分で 出す（client/battle-c9a.js の C9A_OWN_TELE に まぜる）
export const C9B_OWN_TELE = [C9B_DEDEDON];
export const C9B_SCREEN_ANIMS = ['c9k_light', 'c9k_jump', 'c9k_soup', 'c9b_teru', 'c9u_wave', 'c9k_ehhen'];
export const C9B_ALLY_FX = {
  c9u_pinch: 'claw', c9u_bubble: 'down', c9u_bonk: 'quake', c9u_spore: 'down', c9u_fang: 'claw', c9u_wave: 'down', c9u_dive: 'wind',
  c9u_wrap: 'quake', c9u_dust: 'wind', c9u_dig: 'quake', c9u_poke: 'claw', c9u_line: 'claw', c9u_ladle: 'quake', c9u_soup: 'fire',
  c9k_mallet: 'quake', c9k_belly: 'quake', c9k_ehhen: 'down', c9k_spin: 'wind', c9k_jump: 'quake', c9k_soup: 'fire',
};
export const C9B_SFX = {
  c9u_pinch: 'hit', c9u_bubble: 'sparkle', c9u_shell: 'buff', c9u_bonk: 'hit', c9u_spore: 'sparkle', c9u_glow: 'sparkle', c9u_fang: 'hit', c9u_wave: 'warn', c9u_dive: 'hit',
  c9u_wrap: 'smash', c9u_dust: 'hit', c9u_dig: 'smash', c9u_poke: 'hit', c9u_line: 'hit', c9u_ehhen: 'buff', c9u_ladle: 'hit', c9u_soup: 'fire', c9u_lid: 'buff',
  c9k_mallet: 'smash', c9k_belly: 'hit', c9k_ehhen: 'warn', c9k_spin: 'hit', c9k_watch: 'warn', c9k_eat: 'blast', c9k_sulk: 'hit', c9k_light: 'blast',
  c9k_jumpup: 'warn', c9k_jump: 'blast', c9k_soup: 'fire', c9k_dish: 'sparkle', c9b_teru: 'sparkle',
};
const DISH_LABEL = { meat: 'にく', cake: 'ケーキ', soup: 'からいスープ' };

export const teruText = (t) => (!t ? '' : t.charge >= t.max ? 'てらす OK' : `てらす ${'◆'.repeat(t.charge)}${'◇'.repeat(Math.max(0, t.max - t.charge))}`);

const CSS = `
.c9a-hud .c9b-teru { margin-left: 6px; color: #bff4ff; letter-spacing: 1px; }
.c9a-hud .c9b-teru.ok { color: #fff6c8; text-shadow: 0 0 6px rgba(255, 246, 200, 0.95); animation: c9b-pulse 1s infinite; }
@keyframes c9b-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.c9b-dark { position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: 0; transition: opacity 0.8s;
  background: radial-gradient(circle at 12% 10%, rgba(255, 246, 200, 0.18) 0 10%, rgba(8, 10, 30, 0.62) 28%, rgba(4, 4, 16, 0.78) 100%); }
.c9b-dark.on { opacity: 1; }
.c9b-dark.lit { opacity: 0.32; }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c9b-css')) return;
  const s = document.createElement('style');
  s.id = 'c9b-css';
  s.textContent = CSS;
  document.head.append(s);
}

// ───────────── てらすの たまりぐあい（client/battle-c9a.js の c9aHud の さいご）─────────────
export function c9bHud(scene) {
  const t = scene.c9spica?.teru;
  const h = scene.c9hud;
  if (!t || !h || typeof document === 'undefined') return;
  addCss();
  if (!h.teru) {
    h.teru = document.createElement('span');
    h.teru.className = 'c9b-teru';
    h.el.append(h.teru);
  }
  h.teru.textContent = teruText(t);
  h.teru.classList.toggle('ok', t.charge >= t.max);
  // 第3部 第1章 第4幕: 星のうたの たまりぐあい（battle-c9d.js）
  c9dHud(scene);
}

// まっ暗の おおい（大王の 戦い。がめんの 上に 1まい）
function darkLayer(scene, on, lit) {
  if (typeof document === 'undefined' || !scene.stage) return;
  if (!scene.c9bDark) {
    if (!on && !lit) return;
    addCss();
    scene.c9bDark = document.createElement('div');
    scene.c9bDark.className = 'c9b-dark';
    scene.stage.append(scene.c9bDark);
  }
  const el = scene.c9bDark;
  const want = on ? 'on' : lit ? 'lit' : '';
  if (el.dataset.k === want) return;
  el.dataset.k = want;
  el.classList.toggle('on', !!on);
  el.classList.toggle('lit', !on && !!lit);
}

// ───────────── え（client/battle-c9a.js の c9aSprite の あと）─────────────
export function c9bSprite(c, frame) {
  // 第3部 第1章 第4幕: ムウの ばたんきゅう・すわりこむ（battle-c9d.js）
  const d = c9dSprite(c, frame);
  if (d) return d;
  // 第3部 第2章 第1幕: 勝った あと メカが 止まる（battle-c10a.js）
  const d10 = c10aSprite(c, frame);
  if (d10) return d10;
  // 第3部 第2章 第2幕: びしょぬれ・おじぎ（battle-c10b.js）
  const d10b = c10bSprite(c, frame);
  if (d10b) return d10b;
  // 第3部 第2章 第3幕: しょんぼり・ひざを つく（battle-c10c.js）
  const d10c = c10cSprite(c, frame);
  if (d10c) return d10c;
  if (c?.species === C9B_DEDEDON && c.kDown) return monsterCanvas(C9B_DEDEDON, (frame ? 1 : 0) + 2);
  // 第3部 第1章 第3幕: 目を 回した メカ（battle-c9c.js）
  return c9cSprite(c, frame);
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
function dots(x, cx, y, on, max, base, T) {
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
    x.fillStyle = lit ? (last ? '#ff4a6a' : '#ffd040') : '#2a2040';
    x.beginPath();
    x.arc(x0 + i * gap, y, 3.2, 0, Math.PI * 2);
    x.fill();
  }
  x.globalAlpha = base;
}

// ───────────── たたかいの え（client/battle-c9a.js の c9aDraw の さいご）─────────────
export function c9bDraw(scene, x, m, c, px, py, w, h, base) {
  const T = scene.time || 0;
  // 第3部 第1章 第3幕: なぞ・砂の めもり（battle-c9c.js）
  c9cDraw(scene, x, m, c, px, py, w, h, base);
  // 第3部 第1章 第4幕: ムウの まど・しるし（battle-c9d.js）
  c9dDraw(scene, x, m, c, px, py, w, h, base);
  // 第3部 第2章 第1幕: 中ボスの まど・しるし（battle-c10a.js）
  c10aDraw(scene, x, m, c, px, py, w, h, base);
  // 第3部 第2章 第2幕: 中ボスの まど・場所の 名前・しるし（battle-c10b.js）
  c10bDraw(scene, x, m, c, px, py, w, h, base);
  // 第3部 第2章 第3幕: ボスの まど・うき石の まど・しるし（battle-c10c.js）
  c10cDraw(scene, x, m, c, px, py, w, h, base);
  // 大王
  if (c?.species === C9B_DEDEDON) {
    darkLayer(scene, c.alive && c.kDark, c.alive && c.kLit);
    if (!c.alive || c.kDown) return;
    if (c.kJump) {
      x.globalAlpha = base * (0.5 + Math.sin(T / 70) * 0.4);
      x.strokeStyle = '#ff4a6a';
      x.lineWidth = 2;
      x.beginPath();
      x.ellipse(px + w / 2, py + h, w * 0.6, 8, 0, 0, Math.PI * 2);
      x.stroke();
      x.globalAlpha = base;
      tag(x, px + w / 2, Math.max(8, py + 6), '大ジャンプが来る！防御で守れ！', base, '#3a0a1a', '#ffd06a', 108);
    } else if (c.kRest) {
      tag(x, px + w / 2, Math.max(8, py + 6), 'しょんぼり…', base, '#1a2a40', '#bff4ff', 50);
    } else if (c.kWatch === '?') {
      tag(x, px + w / 2, Math.max(8, py + 6), '何かを見ている…てらそう！', base, '#14142a', '#d8d8ff', 96);
    } else if (!c.kWatch && c.kWatchEvery) {
      dots(x, px + w / 2, Math.max(6, py + 4), c.kWatchLeft || 0, c.kWatchEvery, base, T);
    }
    return;
  }
  if (!c?.alive) return;
  // 皿
  if (c.dish9) {
    if (c.dishWatched) {
      x.globalAlpha = base * (0.55 + Math.sin(T / 70) * 0.4);
      x.strokeStyle = '#ffd040';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(px + w / 2, py + h / 2, Math.min(w, h) * 0.62, 0, Math.PI * 2);
      x.stroke();
      x.globalAlpha = base;
      tag(x, px + w / 2, Math.max(8, py - 2), 'ねらわれている！こわせ！', base, '#3a0a1a', '#ffd06a', 90);
    } else if (c.dishDark) {
      tag(x, px + w / 2, Math.max(8, py - 2), '？', base, '#14142a', '#d8d8ff', 14);
    }
    return;
  }
  // 見えにくい 魔物（大ミミズ）: 暗い かげ
  if (c.hide9) {
    x.globalAlpha = base * (0.55 + Math.sin(T / 300) * 0.08);
    const g = x.createRadialGradient(px + w / 2, py + h / 2, 2, px + w / 2, py + h / 2, Math.max(w, h) * 0.62);
    if (g?.addColorStop) {
      g.addColorStop(0, 'rgba(5,5,15,0.9)');
      g.addColorStop(0.7, 'rgba(5,5,15,0.75)');
      g.addColorStop(1, 'rgba(5,5,15,0)');
    }
    x.fillStyle = g?.addColorStop ? g : '#05050f';
    x.fillRect(Math.round(px - w * 0.15), Math.round(py - h * 0.15), Math.round(w * 1.3), Math.round(h * 1.3));
    x.globalAlpha = base;
    tag(x, px + w / 2, py + h + 4, '見えにくい', base, '#14142a', '#d8d8ff', 40);
  }
}

// ───────────── イベントを 見せる とき（client/battle-c9a.js の c9aPresent の さいご）─────────────
export function c9bPresent(scene, ev) {
  const g = scene.game;
  const warn = (t) => { g.audio.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g.audio.sfx(s); scene.banner(t, 'combo'); };
  const nm = (id) => scene.c?.get?.(id)?.name || '';
  if (ev.c9Spica?.teru && scene.c9spica) {
    scene.c9spica.teru = { ...ev.c9Spica.teru };
    c9bHud(scene);
  }
  if (ev.c9Spica?.teruReady) good('スピカの光がたまった！「てらす」が使える！', 'sparkle');
  if (ev.c9kWatch) {
    if (ev.c9kWatch.kind) warn(`！大王が${DISH_LABEL[ev.c9kWatch.kind]}を見ている！先にこわせ！`);
    else warn('！大王が何かを見ている…スピカにてらしてもらおう！');
  }
  if (ev.c9kBreak?.stop) good('ごちそうを取り上げた！大王はしょんぼり。', 'sparkle');
  if (ev.c9kEat) { scene.shake?.(400, 4); warn(`${DISH_LABEL[ev.c9kEat.kind]}を食べられた…！`); }
  if (ev.c9kDark) { scene.shake?.(600, 4); scene.banner('広間が、まっ暗に…！', 'danger'); }
  if (ev.c9bTeru) good('スピカの光で、あたりが明るくなった！', 'sparkle');
  if (ev.c9kJumpUp) warn('！大ジャンプが来る！「防御」で身を守ろう！');
  if (ev.c9kJump) scene.shake?.(900, 10);
  if (ev.c9kDown) { scene.shake?.(500, 3); good('大王は、おなかを鳴らして、すわりこんだ！', 'sparkle'); }
  // 第3部 第1章 第3幕（battle-c9c.js）
  c9cPresent(scene, ev);
  // 第3部 第1章 第4幕（battle-c9d.js）
  c9dPresent(scene, ev);
  // 第3部 第2章 第1幕（battle-c10a.js）
  c10aPresent(scene, ev);
  // 第3部 第2章 第2幕（battle-c10b.js）
  c10bPresent(scene, ev);
  // 第3部 第2章 第3幕（battle-c10c.js）
  c10cPresent(scene, ev);
}

// ───────────── コマンド（client/battle-c9a.js の c9aCmdItems・c9aCmdPick）─────────────
// てらすが 役に 立つ とき: 大王の まっ暗（てらして いない）・見えにくい 魔物が いる
function teruUseful(scene) {
  const en = scene.enemies?.() || [];
  // 第3部 第2章 第1幕: モルドの カビの かべ・カビの ある 仲間（battle-c10a.js）
  // 第3部 第2章 第2幕: シロフクロウ（てらすと 本物が 光る。battle-c10b.js）
  // 第3部 第2章 第3幕: たいさの 雷の 前ぶれ（まぶしく して 外す）・アルゴルの やみの とばり（battle-c10c.js）
  return en.some((e) => e.alive && (e.kDark || e.hide9 || e.wall || (e.c10Kind === 'owl' && !e.c10Down && !en.some((o) => o.owlLit)) || (e.c10Kind === 'colonel' && !e.c10Down && !e.dazzle && (e.stones || []).some((s) => s.lit)) || (e.c10Kind === 'algol' && !e.c10Down && e.veil > 0))) || (scene.allies?.() || []).some((x) => x.alive && x.kabi10 > 0);
}
export function c9bCmdItems(scene, a) {
  // 第3部 第1章 第3幕: こたえる・ひっくり返す（battle-c9c.js。てらすより 先）
  const cc = c9cCmdItems(scene, a);
  // 第3部 第1章 第4幕: スピカ：星のうた（battle-c9d.js）
  const cd = c9dCmdItems(scene, a);
  // 第3部 第2章 第2幕: 水の音を鳴らす（battle-c10b.js。てらすより 先）
  const cx = c10bCmdItems(scene, a);
  // 第3部 第2章 第3幕: うつる（battle-c10c.js。いちばん 上）
  const ck = c10cCmdItems(scene, a);
  const items = [...ck.items, ...cx.items, ...cc.items, ...cd.items];
  let info = ck.info || cx.info || cc.info || cd.info || c10aCmdInfo(scene, a);
  const t = scene.c9spica?.teru;
  if (!a || !t || t.charge < t.max || !(a.abilities || []).includes(TERU) || !teruUseful(scene)) return { items, info };
  items.push({ html: '<span class="dual-cmd">スピカ：てらす</span>', value: 'c9bteru', cls: 'k-dual' });
  info = info || 'スピカの光がたまっている！「スピカ：てらす」で、暗やみをはらおう（しばらく明るい）。';
  return { items, info };
}
export function c9bCmdPick(scene, a, value) {
  if (value === 'c9canswer' || value === 'c9cflip') return c9cCmdPick(scene, a, value);
  if (value === 'c9dsong') return c9dCmdPick(scene, a, value);
  if (value === 'c10bring') return c10bCmdPick(scene, a, value);
  if (value === 'c10cmove') return c10cCmdPick(scene, a, value);
  if (value !== 'c9bteru') return false;
  scene.send({ type: 'ability', id: TERU });
  return true;
}
export { C9B_DISH_IDS };

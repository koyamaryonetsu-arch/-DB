// 第3部 第1章 第3幕「さかさのピラミッド」の ナゾカケ・ヒックリカエール2号・ふつうの 魔物の がめん
// （client/battle-c9b.js から よぶ。サーバーがわは shared/battle-c9c.js）
// ・なぞ: 画面の 上に 大きく 出つづける（答えるまで 消えない）。3つの 答えも 見える。時間切れまでの しるし（●●）
// ・砂の めもり: 画面の 上に 砂時計と つぶ（●●●○○○）。2つぶ いかに なると 金色に 光る（ひっくり返す ころあい）・落ちきると 赤
// ・コマンド: なぞが 出て いる 間は いちばん 上に「こたえる」（えらぶと 3つの 答え）・メカの 戦いでは「ひっくり返す」
// ・ナゾカケ: なぞの守り（青い まく）・休み（うーむ）。メカ: 目が回る（え の コマ 2・3。ぐるぐる）・ポチッとねの ねらい
// スマホの たて（390×844）でも 読める（文字は 2行まで おりかえす）
import { C9C_NAZOKAKE, C9C_HIKKURI } from '../shared/data/monsters-c9c.js?v=47b84e63567e';
import { ANSWER, FLIP } from '../shared/data/abilities-c9c.js?v=47b84e63567e';
import { monsterCanvas } from './render/monsters.js?v=47b84e63567e';

// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C9C_OWN_TELE = [C9C_NAZOKAKE, C9C_HIKKURI];
export const C9C_SCREEN_ANIMS = ['c9z_riddle', 'c9z_timeout', 'c9z_roar', 'c9s_boom', 'c9s_add', 'c9s_empty', 'c9c_flip', 'c9c_answer', 'c9z_wrong'];
export const C9C_ALLY_FX = {
  c9c_gulp: 'claw', c9c_whisker: 'bolt', c9c_mud: 'wind', c9c_tongue: 'claw', c9c_song: 'down', c9c_splash: 'wind',
  c9c_fang: 'claw', c9c_flip9: 'down', c9c_swoop: 'wind', c9c_gpunch: 'quake', c9c_sandfall: 'wind',
  c9c_horn: 'claw', c9c_roll: 'quake', c9c_shine: 'down', c9c_grab: 'claw', c9c_bandage: 'down', c9c_glare: 'down',
  c9z_claw: 'claw', c9z_tail: 'quake', c9z_gaze: 'down', c9z_roar: 'wind', c9z_timeout: 'quake',
  c9s_punch: 'quake', c9s_sandgun: 'wind', c9s_drill: 'claw', c9s_boom: 'fire', c9s_pochi: 'quake',
};
export const C9C_SFX = {
  c9c_gulp: 'hit', c9c_whisker: 'bolt', c9c_mud: 'hit', c9c_tongue: 'hit', c9c_song: 'sparkle', c9c_splash: 'hit',
  c9c_fang: 'hit', c9c_flip9: 'warn', c9c_swoop: 'hit', c9c_gpunch: 'smash', c9c_sandfall: 'hit', c9c_gturn: 'buff',
  c9c_horn: 'hit', c9c_roll: 'smash', c9c_shine: 'warn', c9c_grab: 'hit', c9c_bandage: 'warn', c9c_glare: 'hit',
  c9z_claw: 'smash', c9z_tail: 'hit', c9z_gaze: 'warn', c9z_roar: 'blast', c9z_riddle: 'warn', c9z_timeout: 'blast', c9z_rest: 'hit', c9z_wrong: 'warn',
  c9s_punch: 'smash', c9s_sandgun: 'hit', c9s_drill: 'smash', c9s_empty: 'warn', c9s_boom: 'blast', c9s_dizzy: 'hit', c9s_add: 'warn', c9s_pochiup: 'warn', c9s_pochi: 'blast',
  c9c_answer: 'sparkle', c9c_flip: 'sparkle',
};

const CSS = `
.c9c-top { position: absolute; left: 50%; top: 40px; transform: translateX(-50%); z-index: 4; max-width: 84%; min-width: 46%; pointer-events: none;
  padding: 6px 14px 7px; border-radius: 10px; text-align: center; line-height: 1.3; color: #fff8dc;
  background: rgba(20, 14, 40, 0.86); border: 2px solid rgba(255, 214, 107, 0.85); box-shadow: 0 0 10px rgba(255, 214, 107, 0.45); }
.c9c-top .q { font-size: 24px; font-weight: bold; letter-spacing: 1px; word-break: break-all; line-height: 1.25; }
.c9c-top .ch { margin-top: 5px; font-size: 19px; font-weight: bold; color: #d8e8ff; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.c9c-top .ch span { display: block; padding: 0 10px; border-radius: 6px; background: rgba(90, 110, 180, 0.35); }
.c9c-top .lim { margin-top: 4px; font-size: 14px; color: #ffc8b0; }
.c9c-has-top .b-banner { top: auto; bottom: 6%; }
.c9c-top .lim.last { color: #ff8a8a; animation: c9c-blink 0.8s infinite; }
.c9c-top.hard { border-color: rgba(255, 120, 160, 0.9); }
.c9c-top.sand { min-width: 0; max-width: 96%; padding: 3px 10px; display: flex; align-items: center; gap: 6px; white-space: nowrap; border-color: rgba(230, 200, 140, 0.8); }
.c9c-top.sand .glass { font-size: 12px; color: #e8d8a8; }
.c9c-top.sand .gr { font-size: 16px; letter-spacing: 2px; color: #e8d8a8; }
.c9c-top.sand .gr .on { color: #ffd66b; text-shadow: 0 0 4px rgba(255, 214, 107, 0.8); }
.c9c-top.sand .gr .off { color: #5a4a6a; }
.c9c-top.sand .tx { font-size: 12px; color: #fff4c0; }
.c9c-top.sand.low { border-color: #ffd040; box-shadow: 0 0 14px rgba(255, 208, 64, 0.85); }
.c9c-top.sand.low .tx { color: #ffe060; animation: c9c-blink 0.9s infinite; }
.c9c-top.sand.boom { border-color: #ff4a4a; box-shadow: 0 0 14px rgba(255, 74, 74, 0.9); }
.c9c-top.sand.boom .tx { color: #ff9a9a; animation: c9c-blink 0.5s infinite; }
.c9c-top.sand.dizzy { border-color: #8affc8; }
.c9c-top.c9c-flow { position: relative; left: auto; top: auto; transform: none; margin: 3px auto 0; max-width: 98%; flex: none; box-sizing: border-box; }
@keyframes c9c-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@media (max-aspect-ratio: 1/1) { .c9c-top { top: 4px; max-width: 98%; min-width: 72%; padding: 3px 8px 4px; } .c9c-top .q { font-size: 19px; letter-spacing: 0; }
  .c9c-top .ch { font-size: 16px; margin-top: 3px; flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 3px 6px; } .c9c-top .ch span { padding: 0 6px; }
  .c9c-top .lim { margin-top: 1px; font-size: 12px; } .c9c-top .lim .hint { display: none; }
  .c9c-has-top .b-banner { bottom: 3%; font-size: 15px; white-space: normal; width: 94%; text-align: center; }
  .c9c-top.sand { min-width: 0; gap: 4px; padding: 2px 6px; } .c9c-top.sand .glass { display: none; } .c9c-top.sand .gr { font-size: 12px; letter-spacing: 1px; } .c9c-top.sand .tx { font-size: 11px; } }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c9c-css')) return;
  const s = document.createElement('style');
  s.id = 'c9c-css';
  s.textContent = CSS;
  document.head.append(s);
}
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// ───── 画面の 上の まど（なぞ・砂の めもり）─────
function topEl(scene) {
  if (typeof document === 'undefined' || !scene.stage) return null;
  if (!scene.c9cTop) {
    addCss();
    scene.c9cTop = document.createElement('div');
    scene.c9cTop.className = 'c9c-top';
    scene.c9cTop.style.display = 'none';
    scene.stage.append(scene.c9cTop);
  }
  return scene.c9cTop;
}
// なぞの 文と 答え（HTML。テストからも 見る）
export function riddleHtml(c) {
  const r = c?.zRiddle;
  if (!r) return '';
  const left = Math.max(0, (c.zLimit || 2) - (c.zAge || 0));
  const dots = '●'.repeat(left) + '○'.repeat(Math.max(0, (c.zLimit || 2) - left));
  return `<div class="q">${esc(r.text)}</div>`
    + `<div class="ch">${r.choices.map((t, i) => `<span>${i + 1}．${esc(t)}</span>`).join('')}</div>`
    + `<div class="lim${left <= 1 ? ' last' : ''}">時間切れまで ${dots}<span class="hint">（「こたえる」で答えよう）</span></div>`;
}
// 砂の めもり（HTML）
export function sandHtml(c) {
  if (c?.sMax == null) return '';
  const on = Math.max(0, c.sGrains || 0);
  const gr = `<span class="on">${'●'.repeat(on)}</span><span class="off">${'○'.repeat(Math.max(0, c.sMax - on))}</span>`;
  const tx = c.sDizzy ? '目が回っている！今だ！' : c.sBoom ? '落ちきった！ばくはつする！' : on <= (c.sDizzyAt ?? 2) ? '今だ！ひっくり返せ！' : `のこり${on}つぶ`;
  return `<span class="glass">砂時計</span><span class="gr">${gr}</span><span class="tx">${tx}</span>`;
}
function sandCls(c) {
  if (c.sDizzy) return 'c9c-top sand dizzy';
  if (c.sBoom) return 'c9c-top sand boom';
  if ((c.sGrains ?? 9) <= (c.sDizzyAt ?? 2)) return 'c9c-top sand low';
  return 'c9c-top sand';
}
// 第92回 A班: スマホの たてでは 戦いの 絵が 小さいので、なぞの まどは 絵の すぐ 下に ならべる（絵と 知らせを かくさない）
const portrait = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
function showTop(scene, html, cls) {
  const el = topEl(scene);
  if (!el) return;
  const flow = portrait() && !!scene.stage.parentElement;
  if (flow && el.parentElement !== scene.stage.parentElement) scene.stage.after(el);
  else if (!flow && el.parentElement !== scene.stage) scene.stage.append(el);
  const key = cls + '|' + html + '|' + flow;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  el.className = cls + (flow ? ' c9c-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
  scene.stage?.classList?.toggle('c9c-has-top', !!html && !flow);
}

// ───────────── え（client/battle-c9b.js の c9bSprite の あと）─────────────
// メカが 目を 回して いる・たおれた（自分で ひっくり返った）… コマ 2・3
export function c9cSprite(c, frame) {
  if (c?.species === C9C_HIKKURI && (c.sDizzy || !c.alive)) return monsterCanvas(C9C_HIKKURI, (frame ? 1 : 0) + 2);
  return null;
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

// ───────────── たたかいの え（client/battle-c9b.js の c9bDraw の さいご）─────────────
export function c9cDraw(scene, x, m, c, px, py, w, h, base) {
  const T = scene.time || 0;
  if (c?.species === C9C_NAZOKAKE) {
    showTop(scene, c.alive ? riddleHtml(c) : '', c.zRiddle?.hard ? 'c9c-top hard' : 'c9c-top');
    if (!c.alive) return;
    if (c.zGuard) {
      // なぞの守り（青い まく）
      x.globalAlpha = base * (0.28 + Math.sin(T / 260) * 0.08);
      x.fillStyle = '#7ab8ff';
      x.beginPath();
      x.ellipse(px + w / 2, py + h / 2, w * 0.56, h * 0.56, 0, 0, Math.PI * 2);
      x.fill();
      x.globalAlpha = base;
      tag(x, px + w / 2, py + h + 4, 'なぞの守り（こたえると消える）', base, '#10203a', '#bff4ff', 104);
    } else if (c.zRest) {
      tag(x, px + w / 2, py + h + 4, 'うーむ…（守りがない！今だ！）', base, '#1a2a10', '#c8ff8a', 104);
    } else if (c.zEvery) {
      tag(x, px + w / 2, py + h + 4, `次のなぞまで ${c.zLeft ?? 0}`, base, '#2a1a40', '#fff4c0', 60);
    }
    return;
  }
  if (c?.species === C9C_HIKKURI) {
    showTop(scene, c.alive ? sandHtml(c) : '', sandCls(c));
    if (!c.alive) return;
    if (c.sDizzy) {
      for (let i = 0; i < 3; i++) {
        const a = T / 200 + (i * Math.PI * 2) / 3;
        x.globalAlpha = base * 0.9;
        x.fillStyle = '#fff4a0';
        x.fillRect(Math.round(px + w / 2 + Math.cos(a) * w * 0.22) - 1, Math.round(py + 8 + Math.sin(a) * 4) - 1, 3, 3);
      }
      x.globalAlpha = base;
      tag(x, px + w / 2, py + h + 4, '目が回っている！大ダメージ！', base, '#1a2a10', '#c8ff8a', 100);
    } else if (c.sBoom) {
      x.globalAlpha = base * (0.4 + Math.sin(T / 60) * 0.35);
      x.strokeStyle = '#ff4a4a';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(px + w / 2, py + h / 2, Math.min(w, h) * 0.55, 0, Math.PI * 2);
      x.stroke();
      x.globalAlpha = base;
      tag(x, px + w / 2, py + h + 4, 'ばくはつする！ひっくり返すか防御！', base, '#3a0a1a', '#ffd06a', 120);
    }
    if (c.sPochi) {
      const nm = scene.c?.get?.(c.sPochi)?.name || '';
      tag(x, px + w / 2, Math.max(8, py + 6), `ポチッとね…！ねらい：${nm}`, base, '#3a0a1a', '#ffd06a', Math.min(150, 70 + nm.length * 7));
    }
  }
}

// ───────────── イベントを 見せる とき（client/battle-c9b.js の c9bPresent の さいご）─────────────
export function c9cPresent(scene, ev) {
  const g = scene.game;
  const warn = (t) => { g.audio.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g.audio.sfx(s); scene.banner(t, 'combo'); };
  // 第92回 A班: なぞの まどが 出て いる 間の バナーは 戦いの 絵の 下の ほうに 出す（CSS の .c9c-has-top。かさならない）
  if (ev.c9zRiddle) warn(ev.c9zRiddle.hard ? '！むずかしいなぞだ…「こたえる」で答えよう！' : '！なぞが出た！「こたえる」で答えよう！');
  if (ev.c9zAnswer) {
    if (ev.c9zAnswer.ok) good('せいかい！なぞの守りが消えた！', 'sparkle');
    else warn('ちがう…！頭がさかさまに…');
  }
  if (ev.c9zTimeout) { scene.shake?.(700, 8); warn(`時間切れ！答えは『${ev.c9zTimeout.answer}』だった…`); }
  if (ev.c9zDown) { showTop(scene, '', 'c9c-top'); good('なぞの番人に、みとめられた！', 'sparkle'); }
  if (ev.c9sEmpty) { scene.shake?.(300, 3); warn('！砂が落ちきった！次はばくはつ！'); }
  if (ev.c9sBoom) scene.shake?.(1000, 12);
  if (ev.c9sFlip) {
    if (ev.c9sFlip.dizzy) good('目を回した！今のうちにたたみかけろ！', 'sparkle');
    else warn('まだ早い！はんげきされた…！');
  }
  if (ev.c9sAdd) warn('砂を足された！砂が早く落ちる！');
  if (ev.c9sPochiUp) warn(`！ポチッとねが来る…ねらいは${scene.c?.get?.(ev.c9sPochiUp.aim)?.name || ''}！防御で守ろう！`);
  if (ev.c9sPochi) scene.shake?.(600, 8);
  if (ev.c9sDown) { showTop(scene, '', 'c9c-top'); scene.shake?.(600, 5); good('メカがひっくり返った！ホシドロ一味はにげていった！', 'sparkle'); }
}

// ───────────── コマンド（client/battle-c9b.js の c9bCmdItems・c9bCmdPick）─────────────
const nazoOf = (scene) => (scene.enemies?.() || []).find((e) => e.species === C9C_NAZOKAKE && e.alive) || null;
const mechaOf = (scene) => (scene.enemies?.() || []).find((e) => e.species === C9C_HIKKURI && e.alive) || null;
export function c9cCmdItems(scene, a) {
  const items = [];
  let info = '';
  if (!a) return { items, info };
  const n = nazoOf(scene);
  if (n?.zRiddle && (a.abilities || []).includes(ANSWER)) {
    items.push({ html: '<span class="dual-cmd">こたえる</span>', value: 'c9canswer', cls: 'k-dual' });
    info = `なぞ：${n.zRiddle.text}　「こたえる」で、3つの答えから1つえらぼう。`;
  }
  const m = mechaOf(scene);
  if (m && (a.abilities || []).includes(FLIP)) {
    const low = (m.sGrains ?? 9) <= (m.sDizzyAt ?? 2);
    items.push({ html: `<span class="dual-cmd">ひっくり返す</span>${low ? '<span class="tag">今だ！</span>' : ''}`, value: 'c9cflip', cls: 'k-dual' });
    info = m.sBoom ? '砂が落ちきった！「ひっくり返す」か「防御」で、ばくはつにそなえよう。'
      : low ? '砂が少ない！今「ひっくり返す」と、中の3人の目が回る！'
        : `砂のこり ${m.sGrains}つぶ。砂が2つぶ以下になってから「ひっくり返す」と、目を回せる（早すぎると、はんげき）。`;
  }
  return { items, info };
}
export function c9cCmdPick(scene, a, value) {
  if (value === 'c9cflip') {
    scene.send({ type: 'ability', id: FLIP });
    return true;
  }
  if (value !== 'c9canswer') return false;
  const n = nazoOf(scene);
  if (!n?.zRiddle) return scene.openCommand();
  const r = n.zRiddle;
  scene.showMenu(r.choices.map((t, i) => ({ label: `${i + 1}．${t}`, value: i })), (it) => scene.send({ type: 'ability', id: ANSWER, choice: it.value }), () => scene.openCommand(), r.text);
  return true;
}

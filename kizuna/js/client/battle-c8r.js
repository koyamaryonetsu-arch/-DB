// 第2部 第8章 第4幕「時のはざま」の 時の門番フリーゾン・心の ためし・ソリトゥス・手下の 魔物の がめん
// （client/battle-c8c.js から よぶ。サーバーがわは shared/battle-c8r.js）
// ・門番: 見くだしの かまえ（「かまえ」の ふだと つながる攻撃の 点 ●●○）・くずれた（×1.5）・大玉までの しるし（光の 玉）・ためて いる 大玉（頭の 上で ふくらむ）。
//   最終形態は え の コマ 2・3（c8rSprite が pub の gForm で えらぶ）
// ・やみの風: 夜明けまでの のこり・大風までの しるし・まん中の 下に ともしび（味方の ともしびの HP で 火の 大きさが かわる）
// ・見くだす影: 大剣までの しるし / リオン・おうえんの 人は 味方の まど（ふだは バナー）
// ・ソリトゥス: 今の だん（え の コマ 0〜5）・まとって いる くらい心（色つきの もやと 名前）・心が ゆらぐ（「よびかけよう」）・
//   あらし・なみだ・くずれ までの しるし・千年の約束の 光の ゲージ・こうら・へび
// ・コマンド: 心が ゆらいだ 時の「よびかける」・光が たまった 時の「千年の約束」・一騎うちの「おうえん」を いちばん 上に（c8rCmdItems・c8rCmdPick）
// ・バナー・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音（client/battle-ch4.js・client/battle.js に まぜる）
import { C8_GATE1, C8_GATE2, C8_GATEKEEPER, C8_SOLITUS, C8_WIND, C8_SHADOW } from '../shared/data/monsters-c8r.js?v=298589449c4c';
import { monsterCanvas } from './render/monsters.js?v=298589449c4c';

// 前ぶれの バナーを 自分で 出す（client/battle-c8c.js の C8C_OWN_TELE に まぜる）
export const C8R_OWN_TELE = [C8_GATE1, C8_GATE2, C8_GATEKEEPER, C8_SOLITUS, C8_WIND, C8_SHADOW];
export const C8R_SCREEN_ANIMS = ['c8g_orb', 'c8g_final', 'c8t_gust', 'c8d_big', 'c8s_big', 'c8s_harden', 'c8s_tear', 'c8s_crack', 'c8s_hoard'];
export const C8R_ALLY_FX = {
  c8rn_flame: 'fire', c8rn_drain: 'down', c8rn_bite: 'claw', c8rn_sand: 'wind', c8rn_gnaw: 'claw', c8rn_flutter: 'wind', c8rn_chomp: 'claw', c8rn_tail: 'quake',
  c8rn_slash: 'claw', c8rn_flow: 'down', c8rn_slow: 'down', c8rn_powder: 'down',
  c8g_finger: 'bolt', c8g_tail: 'claw', c8g_horn: 'claw', c8g_glare: 'down', c8g_barrage: 'bolt', c8g_orb: 'quake',
  c8t_breeze: 'wind', c8t_gust: 'wind', c8t_puff: 'wind', c8d_slash: 'claw', c8d_big: 'quake', c8d_mock: 'down',
  c8s_greed: 'down', c8s_anger: 'fire', c8s_hoard: 'quake', c8s_scorn: 'bolt', c8s_claw: 'claw', c8s_big: 'quake', c8s_harden: 'quake',
  c8s_tear: 'quake', c8s_comet: 'bolt', c8s_crack: 'quake',
};
export const C8R_SFX = {
  c8rn_flame: 'fire', c8rn_slow: 'warn', c8rn_drain: 'hit', c8rn_bite: 'hit', c8rn_sand: 'hit', c8rn_rewind: 'buff', c8rn_powder: 'sparkle', c8rn_gnaw: 'hit',
  c8rn_flutter: 'hit', c8rn_chomp: 'smash', c8rn_tick: 'buff', c8rn_tail: 'smash', c8rn_slash: 'smash', c8rn_flow: 'hit', c8rn_turn: 'buff',
  c8g_finger: 'bolt', c8g_tail: 'hit', c8g_glare: 'warn', c8g_horn: 'smash', c8g_orb: 'blast', c8g_orbfail: 'sparkle', c8g_final: 'blast', c8g_leave: 'sparkle', c8g_barrage: 'bolt',
  c8t_breeze: 'hit', c8t_gust: 'blast', c8t_puff: 'hit', c8t_dawn: 'sparkle',
  c8d_slash: 'hit', c8d_big: 'blast', c8d_mock: 'warn', c8d_cheer: 'buff',
  c8s_greed: 'warn', c8s_anger: 'fire', c8s_hoard: 'smash', c8s_scorn: 'bolt', c8s_claw: 'hit', c8s_big: 'blast', c8s_harden: 'blast', c8s_bound: 'hit',
  c8s_tear: 'blast', c8s_comet: 'bolt', c8s_alone: 'warn', c8s_crack: 'blast', c8s_call: 'sparkle', c8s_promise: 'blast', c8s_shell: 'hit',
  c8r_help_guard: 'buff', c8r_help_power: 'buff', c8r_help_heal: 'sparkle', c8r_help_mp: 'sparkle', c8r_help_hit: 'smash',
};
const HEART_COL = ['#6ad0a0', '#ff6a5a', '#ffb040', '#a0a0ff'];
const HEART_TXT = ['よくばりの心', 'いかりの心', 'ひとりじめの心', '見くだす心'];
const CALL = 'm8s_call';
const PROMISE = 'm8s_promise';
const CHEERS = ['m8d_cheer_pow', 'm8d_cheer_def', 'm8d_cheer_heal'];

// ───────────── え（client/battle.js の monsterCanvas の かわり）─────────────
export function c8rSprite(c, frame) {
  const sp = c?.species;
  const f = frame ? 1 : 0;
  if (sp === C8_GATEKEEPER && c.gForm === 4) return monsterCanvas(sp, f + 2);
  if (sp === C8_SOLITUS && c.slStage >= 2) return monsterCanvas(sp, f + (c.slStage === 3 ? 4 : 2));
  return null;
}

function backDot(x, cx, cy, r, base) {
  x.globalAlpha = base * 0.6;
  x.fillStyle = '#060c18';
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}
function dotMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  x.arc(cx, cy, s * 0.8, 0, Math.PI * 2);
  x.fill();
}
function dropMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  x.moveTo(cx, cy - s);
  x.quadraticCurveTo(cx + s * 0.8, cy + s * 0.3, cx, cy + s * 0.8);
  x.quadraticCurveTo(cx - s * 0.8, cy + s * 0.3, cx, cy - s);
  x.fill();
}
function swordMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.fillRect(cx - s * 0.15, cy - s, s * 0.3, s * 1.5);
  x.fillRect(cx - s * 0.6, cy + s * 0.3, s * 1.2, s * 0.25);
}
function crackMark(x, cx, cy, s, col) {
  x.strokeStyle = col;
  x.lineWidth = 1.4;
  x.beginPath();
  x.moveTo(cx - s * 0.2, cy - s);
  x.lineTo(cx + s * 0.3, cy - s * 0.2);
  x.lineTo(cx - s * 0.2, cy + s * 0.2);
  x.lineTo(cx + s * 0.2, cy + s);
  x.stroke();
}
function marks(x, px, py, w, on, max, base, T, draw, cols, y = null) {
  const gap = 11, x0 = px + w / 2 - ((max - 1) * gap) / 2, y0 = y ?? Math.max(6, py - 6);
  for (let i = 0; i < max; i++) {
    const lit = i < on;
    const last = lit && on === 1;
    backDot(x, x0 + i * gap, y0, 5, base);
    x.globalAlpha = base * (lit ? (last ? 0.7 + Math.sin(T / 80) * 0.3 : 0.95) : 0.3);
    draw(x, x0 + i * gap, y0, 4, lit ? (last ? cols[1] : cols[0]) : cols[2]);
  }
  x.globalAlpha = base;
}
function tag(x, tx, ty, text, base, bg, fg, wd = 30) {
  x.globalAlpha = base * 0.85;
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
// ふくらむ 光の 玉（ためて いる 大玉）
function orbGlow(x, cx, cy, r, base, T) {
  const rr = r * (0.85 + Math.sin(T / 120) * 0.15);
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.5, 'rgba(255,246,160,0.8)');
  g.addColorStop(1, 'rgba(216,168,240,0)');
  x.globalAlpha = base;
  x.fillStyle = g;
  x.beginPath();
  x.arc(cx, cy, rr, 0, Math.PI * 2);
  x.fill();
}
// くらい心の もや（まとって いる 心の 色）
function heartMist(x, px, py, w, h, col, base, T) {
  for (let i = 0; i < 5; i++) {
    const a = T / 600 + (i * Math.PI * 2) / 5;
    x.globalAlpha = base * 0.35;
    x.fillStyle = col;
    x.beginPath();
    x.arc(px + w / 2 + Math.cos(a) * w * 0.42, py + h / 2 + Math.sin(a) * h * 0.38, Math.max(4, w * 0.08), 0, Math.PI * 2);
    x.fill();
  }
  x.globalAlpha = base;
}
// ともしび（やみの風の 戦い。HP の わりあいで 火の 大きさ）
function torch(x, cx, cy, k, base, T) {
  x.globalAlpha = base;
  x.fillStyle = '#4a4e6a';
  x.fillRect(cx - 4, cy - 2, 8, 10);
  x.fillStyle = '#8a8eaa';
  x.fillRect(cx - 5, cy - 3, 10, 2);
  if (k <= 0) return;
  const h = 4 + 10 * k + Math.sin(T / 90) * 1.5;
  x.fillStyle = '#ff8a2a';
  x.beginPath();
  x.moveTo(cx - 3.5, cy - 3);
  x.quadraticCurveTo(cx - 3, cy - h * 0.7, cx + Math.sin(T / 130), cy - h);
  x.quadraticCurveTo(cx + 3, cy - h * 0.7, cx + 3.5, cy - 3);
  x.fill();
  x.fillStyle = '#ffe06a';
  x.beginPath();
  x.moveTo(cx - 1.8, cy - 3);
  x.quadraticCurveTo(cx, cy - h * 0.7, cx + 1.8, cy - 3);
  x.fill();
  x.globalAlpha = base * 0.25;
  x.fillStyle = '#ffd080';
  x.beginPath();
  x.arc(cx, cy - h * 0.5, 6 + 6 * k, 0, Math.PI * 2);
  x.fill();
  x.globalAlpha = base;
}

// ───────────── たたかいの え（client/battle-c8c.js の c8cDraw から）─────────────
export function c8rDraw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  const T = scene.time || 0;
  // 時の門番フリーゾン
  if (c.gForm) {
    if (c.gForm >= 2) {
      if (c.stance) {
        tag(x, px + w / 2, py + h * 0.86, '見くだしのかまえ', base, '#2a1040', '#e0c0ff', 52);
        const need = c.need || 3;
        marks(x, px, py, w, c.chain || 0, need, base, T, dotMark, ['#fff6a0', '#fff6a0', '#3a2a50'], py + h * 0.86 + 10);
      } else if (c.open) tag(x, px + w / 2, py + h * 0.86, 'くずれた！×1.5', base, '#1a2a10', '#c8ff8a', 52);
    }
    if (c.charge) {
      orbGlow(x, px + w * 0.72, Math.max(10, py + h * 0.05), Math.max(8, w * 0.14), base, T);
      tag(x, px + w / 2, Math.max(8, py - 4), '時の大玉！', base, '#3a0a1a', '#ffd06a', 40);
    } else if (c.orbEvery) marks(x, px, py, w, c.orbLeft || 0, c.orbEvery, base, T, dotMark, ['#fff6a0', '#ff4a6a', '#2a2040']);
  }
  // やみの風・ともしび
  if (c.dawnMax) {
    tag(x, px + w / 2, Math.max(8, py - 4), `夜明けまで ${c.dawnLeft ?? 0}`, base, '#1a1430', '#ffd890', 48);
    if (c.gustEvery) marks(x, px, py, w, c.gustLeft || 0, c.gustEvery, base, T, dotMark, ['#d0c8f0', '#ff4a6a', '#2a2040'], Math.max(18, py + 6));
    const t = scene.allies?.().find((a) => a.mon === 'c8_torch' || a.torch);
    if (t) torch(x, px + w / 2, Math.min(scene.H ? scene.H - 12 : py + h + 20, py + h + 14), t.alive ? t.hp / Math.max(1, t.maxHp) : 0, base, T);
  }
  // 見くだす影
  if (c.species === C8_SHADOW && c.bigEvery) marks(x, px, py, w, c.bigLeft || 0, c.bigEvery, base, T, swordMark, ['#c8b8e8', '#ff4a6a', '#2a2040']);
  // ソリトゥス
  if (c.slStage) {
    if (c.slStage === 1 && c.heart >= 0) {
      heartMist(x, px, py, w, h, HEART_COL[c.heart], base, T);
      tag(x, px + w / 2, py + h * 0.9, HEART_TXT[c.heart], base, '#140a24', HEART_COL[c.heart], 46);
      if (c.bigEvery) marks(x, px, py, w, c.bigLeft || 0, c.bigEvery, base, T, dotMark, ['#c8a0ff', '#ff4a6a', '#2a2040']);
    }
    if (c.slStage === 2 && c.tearLeft) marks(x, px, py, w, c.tearLeft, 3, base, T, dropMark, ['#9ae0ff', '#ff4a6a', '#2a2040']);
    if (c.slStage === 3) {
      if (c.crackLeft) marks(x, px, py, w, c.crackLeft, 3, base, T, crackMark, ['#e0c0ff', '#ff4a6a', '#3a2a50']);
      // 千年の約束の 光
      const bw = Math.max(40, w * 0.7), bx = px + w / 2 - bw / 2, by = py + h * 0.92;
      const k = Math.min(1, (c.gauge || 0) / (c.gaugeMax || 100));
      x.globalAlpha = base * 0.8;
      x.fillStyle = '#140a24';
      x.fillRect(Math.round(bx) - 1, Math.round(by) - 1, Math.round(bw) + 2, 5);
      x.globalAlpha = base * (k >= 1 ? 0.75 + Math.sin(T / 90) * 0.25 : 1);
      x.fillStyle = k >= 1 ? '#fff4c0' : '#e8c870';
      x.fillRect(Math.round(bx), Math.round(by), Math.round(bw * k), 3);
      x.globalAlpha = base;
      tag(x, px + w / 2, by + 9, k >= 1 ? '千年の約束！' : '千年の約束の光', base, '#2a1a40', '#fff4c0', 50);
    }
    if (c.waver) {
      x.globalAlpha = base * (0.5 + Math.sin(T / 80) * 0.4);
      x.strokeStyle = '#fff4c0';
      x.lineWidth = 1.5;
      x.beginPath();
      x.arc(px + w / 2, py + h / 2, Math.min(w, h) * 0.45, 0, Math.PI * 2);
      x.stroke();
      x.globalAlpha = base;
      tag(x, px + w / 2, py + h * 0.5, 'ゆらいでいる！よびかけよう', base, '#3a2a10', '#fff4c0', 84);
    }
    if (c.shell) tag(x, px + w / 2, py + h * 0.2, 'こうらでまもる', base, '#1a3a1a', '#c8ff8a', 50);
    if (c.bound) tag(x, px + w / 2, py + h * 0.3, 'へびでしばった', base, '#1a3a2a', '#8affc8', 50);
  }
}

// ───────────── イベントを 見せる とき（client/battle-c8c.js の c8cPresent から）─────────────
export function c8rPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const warn = (t) => { g.audio.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g.audio.sfx(s); scene.banner(t, 'combo'); };
  // 門番
  if (ev.c8gCharge) warn('！時の大玉…！ちがう仲間がつづけて攻撃して、かまえをくずせ！');
  if (ev.c8gBreak) good(ev.c8gBreak.dual ? '合体技で、見くだしのかまえをくずした！' : `つながる攻撃${ev.c8gBreak.chain}！かまえをくずした！`);
  if (ev.c8gOrb) { scene.shake?.(1200, 12); scene.banner('時の大玉…！', 'danger'); }
  if (ev.c8gOrbFail) good('大玉が消えた！', 'sparkle');
  if (ev.c8gFinal) { scene.shake?.(1200, 12); scene.banner('さいごのすがた…！リオン「弱くても、ひとりじゃない！」', 'danger'); }
  if (ev.c8gLeave) good('フリーゾンは、時の門の中へ去っていった…', 'sparkle');
  // 守りぬく・一騎うち
  if (ev.c8tGustLeft?.left === 1) warn('！次に、大風…！身を守るか、ともしびをかばえ！');
  if (ev.c8tGust) { scene.shake?.(900, 8); scene.banner('大風…！', 'danger'); }
  if (ev.c8tDawn) good('夜明け！ともしびを守りぬいた！', 'sparkle');
  if (ev.c8dBigLeft?.left === 1) warn('！次に、かげの大剣…！リオンは身を守れ！');
  if (ev.c8dBig) { scene.shake?.(900, 10); scene.banner('かげの大剣…！', 'danger'); }
  if (ev.c8dCheer?.ready) good('ゆうきがいっぱい！次はゆうきの一撃！', 'sparkle');
  if (ev.c8dStrike) good('ゆうきの一撃！', 'crit');
  if (ev.c8dMock && !ev.c8dMock.blocked) warn('見くだすことば…！おうえんで、はね返そう！');
  // ソリトゥス
  if (ev.c8sWaver) good(ev.c8sWaver.star ? '星の光がゆらいだ！「よびかける」！' : '心がゆらいだ！「よびかける」で、はがそう！', 'warn');
  if (ev.c8sPeel) good('くらい心が、はがれた！', 'sparkle');
  if (ev.c8sHarden) warn('心が、また、かたまってしまった…');
  if (ev.c8sBigLeft?.left === 1) warn('！次に、くらい心のあらし…！身を守れ！');
  if (ev.c8sTearLeft?.left === 1) warn('！次に、星のなみだ…！身を守れ！');
  if (ev.c8sCrackLeft?.left === 1) warn('！次に、時のくずれ…！身を守れ！');
  if (ev.c8sAlone) warn('ひとりにされた…！「よびかける」で、もどそう！');
  if (ev.c8sStage) { scene.shake?.(1400, 12); scene.banner(ev.c8sStage.stage === 2 ? 'ひとりぼっちの星…！' : '千年の約束を…！', 'combo'); }
  if (ev.c8sPromise) { scene.shake?.(1400, 12); scene.banner('千年の約束！！', 'combo'); }
  if (ev.c8sShell) good('こうらが、攻撃をはね返した！', 'hit');
  if (ev.c8rHelp) g.audio.sfx('buff');
  void fx; void anim; void actor;
}

// ───────────── コマンド（client/battle.js の openCommand）─────────────
const solOf = (scene) => scene.enemies?.().find((e) => e.species === C8_SOLITUS && e.alive) || null;
export function c8rCmdItems(scene, a) {
  const items = [];
  let info = '';
  if (!a) return { items, info };
  const s = solOf(scene);
  const ab = a.abilities || [];
  if (s && ab.includes(CALL) && s.waver) {
    items.push({ html: '<span class="dual-cmd">よびかける</span>', value: 'c8rcall', cls: 'k-dual' });
    info = s.slStage === 1 ? '心がゆらいでいる！「よびかける」で、くらい心をはがそう。' : '星の光がゆらいでいる！「よびかける」で、ひとりぼっちの星に声をとどけよう。';
  }
  if (s && ab.includes(PROMISE) && s.slStage === 3 && (s.gauge || 0) >= (s.gaugeMax || 100)) {
    items.unshift({ html: '<span class="dual-cmd">千年の約束</span>', value: 'c8rpromise', cls: 'k-dual' });
    info = '千年前と今の、みんなの力を1つにする合体技！さいごのしめくくりも、千年の約束で。';
  }
  if (a.cheer || (a.abilities || []).includes(CHEERS[0])) {
    ['おうえん（力）', 'おうえん（守り）', 'おうえん（回復）'].forEach((label, i) => items.push({ html: `<span class="dual-cmd">${label}</span>`, value: `c8rcheer${i}`, cls: 'k-dual' }));
    info = 'これは、リオンの一騎うち。みんなは「おうえん」でリオンをささえよう（ゆうきが3つたまると、ゆうきの一撃）。';
  }
  return { items, info };
}
export function c8rCmdPick(scene, a, value) {
  const s = solOf(scene);
  if (value === 'c8rcall') return scene.send({ type: 'ability', id: CALL, target: s?.id });
  if (value === 'c8rpromise') return scene.send({ type: 'ability', id: PROMISE, target: s?.id });
  const i = Number(String(value).replace('c8rcheer', ''));
  return scene.send({ type: 'ability', id: CHEERS[i] || CHEERS[0], target: a.id });
}

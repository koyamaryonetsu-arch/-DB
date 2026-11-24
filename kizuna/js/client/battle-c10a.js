// 第3部 第2章 第1幕「赤と緑」の 中ボス 2人・ふつうの 魔物の がめん
// （client/battle-c9b.js・client/battle-c9a.js から よぶ。サーバーがわは shared/battle-c10a.js）
// ・仲間の まど: 名前の 下に「あつさ」の めもり（■■■□□。4 で 黄色・5 で のぼせる）・「カビ」の めもり（●●○。2 で 黄色）（c10aStatus）
//   スマホの たてでも 読める ように、名前と おなじ 行では なく 小さな 1行に する
// ・画面の 上の まど（中ボスの 戦いだけ）: タマゴン … メカの あつさ（●●●○○○）と 今 どう すると よいか ／
//   モルド … カビの かべ（あり・消えている〈あと ○〉）と 今 どう すると よいか。スマホの たては 戦いの 絵の すぐ 下に ならべる
// ・中ボスの しるし: ドリルの 前ぶれ・オーバーヒート・大カビばくだんの 前ぶれ・カビの かべ（みどりの まく）
// ・勝った あと: メカが 止まって けむり（え の コマ 2・3。たおれても 消えない）
// ・コマンドの せつめい: あつい 人には「防御で 休もう」・カビが たまって いれば「スピカの 技」（新しい コマンドは ない）
import { C10R_TAMAGON, C10G_MOLD } from '../shared/data/monsters-c10a.js?v=71ec2a6ff6b8';
import { monsterCanvas } from './render/monsters.js?v=71ec2a6ff6b8';

// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C10A_OWN_TELE = [C10R_TAMAGON, C10G_MOLD];
export const C10A_SCREEN_ANIMS = ['c10t_drill', 'c10t_over', 'c10t_cool', 'c10t_steam', 'c10m_bomb', 'c10m_prop', 'c10r_fire', 'c10g_leaf'];
export const C10A_ALLY_FX = {
  c10r_bite: 'claw', c10r_spit: 'fire', c10r_tail: 'quake', c10r_body: 'quake', c10r_wind: 'fire', c10r_bash: 'quake', c10r_quake: 'quake',
  c10r_bonk: 'quake', c10r_fire: 'fire', c10r_smoke: 'down',
  c10g_bump: 'quake', c10g_puff: 'down', c10g_glow: 'bolt', c10g_whip: 'claw', c10g_bind: 'down', c10g_sap: 'down', c10g_horn: 'claw',
  c10g_charge: 'wind', c10g_swing: 'quake', c10g_leaf: 'wind',
  c10t_arm: 'quake', c10t_steam: 'fire', c10t_flame: 'fire', c10t_drill: 'quake',
  c10m_cane: 'claw', c10m_prop: 'wind', c10m_damp: 'down', c10m_bomb: 'quake',
};
export const C10A_SFX = {
  c10r_bite: 'hit', c10r_spit: 'fire', c10r_tail: 'hit', c10r_body: 'hit', c10r_wind: 'fire', c10r_bash: 'smash', c10r_shell: 'buff', c10r_quake: 'smash',
  c10r_bonk: 'hit', c10r_fire: 'fire', c10r_smoke: 'warn',
  c10g_bump: 'hit', c10g_puff: 'sparkle', c10g_glow: 'sparkle', c10g_whip: 'hit', c10g_bind: 'warn', c10g_sap: 'hit', c10g_horn: 'smash',
  c10g_charge: 'hit', c10g_guard: 'buff', c10g_swing: 'hit', c10g_leaf: 'hit', c10g_hide: 'buff',
  c10t_arm: 'smash', c10t_steam: 'fire', c10t_flame: 'fire', c10t_drillup: 'warn', c10t_drill: 'blast', c10t_over: 'sparkle', c10t_cool: 'buff',
  c10m_cane: 'hit', c10m_prop: 'hit', c10m_damp: 'smash', c10m_bombup: 'warn', c10m_bomb: 'blast',
};
const isBoss = (c) => c?.species === C10R_TAMAGON || c?.species === C10G_MOLD;

const CSS = `
.b-mem .c10-meter { display: block; font-size: 10px; line-height: 1.1; letter-spacing: 0; white-space: nowrap; color: #ffd8b0; }
.b-mem .c10-meter i { display: inline-block; width: 7px; height: 7px; margin-left: 1px; border-radius: 2px; background: #3a2a2a; border: 1px solid rgba(255, 255, 255, 0.35); vertical-align: -1px; }
.b-mem .c10-meter.heat i.on { background: #ff8a3a; }
.b-mem .c10-meter.heat.hot i.on { background: #ffd040; }
.b-mem .c10-meter.heat.hot { color: #ffe060; font-weight: bold; }
.b-mem .c10-meter.kabi { color: #d8f0b0; }
.b-mem .c10-meter.kabi i { border-radius: 50%; }
.b-mem .c10-meter.kabi i.on { background: #a8b87a; }
.b-mem .c10-meter.kabi.hot i.on { background: #e0f060; }
.b-mem .c10-meter.kabi.hot { color: #f0ff90; font-weight: bold; }
.b-mem.c10-stuck { background: linear-gradient(180deg, rgba(200, 220, 150, 0.3), rgba(255, 200, 150, 0.2)) !important; }
.c10-top { position: absolute; right: 4px; top: 4px; z-index: 4; max-width: 46%; pointer-events: none;
  padding: 3px 8px 4px; border-radius: 10px; text-align: left; line-height: 1.3; color: #fff4ec;
  background: rgba(40, 20, 14, 0.84); border: 2px solid rgba(255, 176, 110, 0.85); box-shadow: 0 0 10px rgba(255, 150, 80, 0.4); }
.c10-top.mold { background: rgba(16, 34, 26, 0.86); border-color: rgba(176, 216, 120, 0.85); box-shadow: 0 0 10px rgba(160, 220, 120, 0.4); }
.c10-top .row { font-size: 12px; white-space: nowrap; }
.c10-top .dots { letter-spacing: 1px; color: #ffb070; }
.c10-top .dots b { color: #ff5a3a; }
.c10-top .tx { margin-top: 2px; font-size: 11px; color: #ffe8a0; }
.c10-top.warn { border-color: #ffd040; box-shadow: 0 0 14px rgba(255, 208, 64, 0.85); }
.c10-top.warn .tx { color: #ffe060; animation: c10-pulse 0.9s infinite; }
.c10-top.good { border-color: #8affc8; }
.c10-top.good .tx { color: #b0ffd8; }
@keyframes c10-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.c10-top.c10-flow { position: relative; left: auto; right: auto; top: auto; margin: 3px auto 0; max-width: 98%; box-sizing: border-box; text-align: center; }
@media (max-aspect-ratio: 1/1) { .c10-top { top: 2px; left: 2px; right: auto; max-width: 58%; padding: 1px 5px 2px; } .c10-top .row { font-size: 10px; } .c10-top .tx { font-size: 10px; margin-top: 0; }
  .b-mem .c10-meter { font-size: 9px; } .b-mem .c10-meter i { width: 6px; height: 6px; }
  .c10-stage .b-hold { bottom: auto; top: 4px; right: auto; left: 6px; } }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c10a-css')) return;
  const s = document.createElement('style');
  s.id = 'c10a-css';
  s.textContent = CSS;
  document.head.append(s);
}
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// めもりの 文字（テストからも 見る）
export function heatMeter(n, max = 5) {
  const on = Math.max(0, Math.min(max, n || 0));
  return { label: 'あつさ', on, max, hot: on >= max - 1 };
}
export function kabiMeter(n, max = 3) {
  const on = Math.max(0, Math.min(max, n || 0));
  return { label: 'カビ', on, max, hot: on >= max - 1 };
}

// ───────────── 仲間の まど（client/battle-c9a.js の c9aStatus から）─────────────
export function c10aStatus(s, a) {
  if (!s?.name || typeof document === 'undefined') return;
  const box = s.box;
  const m = a?.heat10 !== undefined ? { ...heatMeter(a.heat10, a.heatMax10), cls: 'heat' } : a?.kabi10 !== undefined ? { ...kabiMeter(a.kabi10, a.kabiMax10), cls: 'kabi' } : null;
  let el = box?.querySelector?.('.c10-meter');
  if (box?.classList) box.classList.toggle('c10-stuck', !!a?.alive && (a.status || []).some((k) => k === 'nobose' || k === 'kinoko'));
  if (!m || !a.alive) {
    el?.remove();
    return;
  }
  addCss();
  if (!el) {
    el = document.createElement('span');
    s.name.parentNode?.after?.(el);
    if (!el.parentNode) box?.append?.(el);
  }
  const key = `${m.cls}|${m.on}|${m.max}`;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  el.className = `c10-meter ${m.cls}${m.hot ? ' hot' : ''}`;
  el.innerHTML = `${m.label}${'<i class="on"></i>'.repeat(m.on)}${'<i></i>'.repeat(m.max - m.on)}`;
  el.title = m.cls === 'heat' ? `あつさ ${m.on}/${m.max}（${m.max}でのぼせる。防御で下がる）` : `カビ ${m.on}/${m.max}（${m.max}できのこになる。スピカの技で消える）`;
}

// ───── 画面の 上の まど ─────
function topEl(scene) {
  if (typeof document === 'undefined' || !scene.stage) return null;
  if (!scene.c10Top) {
    addCss();
    scene.c10Top = document.createElement('div');
    scene.c10Top.className = 'c10-top';
    scene.c10Top.style.display = 'none';
    scene.stage.append(scene.c10Top);
  }
  return scene.c10Top;
}
// 中ボスの まど（HTML。テストからも 見る）。c … 中ボスの pub・allies … 味方の pub
export function c10Html(c, allies = []) {
  if (!isBoss(c) || !c.c10Kind) return { html: '', cls: 'c10-top' };
  let cls = 'c10-top';
  let row;
  let tx;
  if (c.c10Kind === 'tamagon') {
    const max = c.mHeatMax || 6;
    const on = Math.max(0, Math.min(max, c.mHeat || 0));
    row = `メカのあつさ <span class="dots">${'<b>●</b>'.repeat(on)}${'○'.repeat(max - on)}</span>`;
    const hot = allies.filter((a) => a.alive && a.heat10 >= (a.heatMax10 || 5) - 1);
    if (c.c10Down) { tx = 'メカが、止まった！'; cls += ' good'; } else if (c.drill) { tx = 'ドリルが来る！「防御」で守ろう（水も飲める）'; cls += ' warn'; } else if (c.mOver) { tx = 'オーバーヒート！今だ、たたみかけろ！'; cls += ' good'; } else if (hot.length) {
      tx = `${hot.map((a) => a.name).join('と')}があつい！「防御」で休もう`;
      cls += ' warn';
    } else if (on >= max - 2) tx = 'あと少しでオーバーヒート！炎を当てよう';
    else tx = 'あつくなったら休もう。メカは、炎であつくしよう';
  } else {
    cls += ' mold';
    row = c.wall ? 'カビのかべ：あり（ダメージがへる）' : c.c10Down ? 'カビのかべ：なし' : `カビのかべ：消えている！（あと${c.wallLit || 0}）`;
    const k2 = allies.filter((a) => a.alive && a.kabi10 >= (a.kabiMax10 || 3) - 1);
    if (c.c10Down) { tx = 'メカが、止まった！'; cls += ' good'; } else if (c.bomb) { tx = '大カビばくだんが来る！「防御」で守ろう'; cls += ' warn'; } else if (k2.length) {
      tx = `${k2.map((a) => a.name).join('と')}のカビが多い！スピカの星のうたか、てらすで消そう`;
      cls += ' warn';
    } else if (!c.wall) { tx = '今だ！かべが消えている間に、たたみかけろ！'; cls += ' good'; } else tx = 'スピカの「てらす」で、かべを消そう。「星のうた」と、かわりばんこに';
  }
  return { html: `<div class="row">${row}</div><div class="tx">${esc(tx)}</div>`, cls };
}
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
  el.className = cls + (flow ? ' c10-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
}

// ───────────── え（client/battle-c9b.js の c9bSprite の はじめ）: 勝った あとは メカが 止まる（コマ 2・3）─────────────
export function c10aSprite(c, frame) {
  if (!isBoss(c) || !c.c10Down) return null;
  c.dead = -1;
  return monsterCanvas(c.species, (frame ? 1 : 0) + 2);
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
export function c10aDraw(scene, x, m, c, px, py, w, h, base) {
  if (!isBoss(c)) return;
  const T = scene.time || 0;
  const top = c10Html(c, scene.allies?.() || []);
  showTop(scene, top.html, top.cls);
  // スマホの たてでは「えらぶまで、待っているよ」を え の 左上に（右下は スピカの まど・右上は オートの ボタンと かさなる。いつも 出る 戦いなので 左上）
  scene.stage?.classList?.add?.('c10-stage');
  if (c.c10Down) return;
  const ty = portrait() ? py + h * 0.55 : py + h + 4;
  // カビの かべ（みどりの まく）
  if (c.wall) {
    x.globalAlpha = base * (0.22 + Math.sin(T / 400) * 0.06);
    x.fillStyle = '#a8c87a';
    x.beginPath();
    x.ellipse(px + w / 2, py + h * 0.55, w * 0.58, h * 0.55, 0, 0, Math.PI * 2);
    x.fill();
    x.globalAlpha = base * 0.6;
    x.strokeStyle = '#d8f0a0';
    x.lineWidth = 1;
    x.stroke();
    x.globalAlpha = base;
  }
  if (c.drill || c.bomb) {
    x.globalAlpha = base * (0.5 + Math.sin(T / 70) * 0.4);
    x.strokeStyle = c.drill ? '#ffd040' : '#c8e070';
    x.lineWidth = 2;
    x.beginPath();
    x.ellipse(px + w / 2, py + h, w * 0.6, 8, 0, 0, Math.PI * 2);
    x.stroke();
    x.globalAlpha = base;
    tag(x, px + w / 2, ty, c.drill ? 'ドリルが来る！防御！' : '大カビばくだんが来る！防御！', base, '#3a0a1a', '#ffd06a', c.drill ? 84 : 112);
  } else if (c.mOver) {
    tag(x, px + w / 2, ty, 'オーバーヒート！（今だ！）', base, '#3a1a0a', '#ffd040', 96);
  } else if (c.c10Kind === 'mold' && c.wall) {
    tag(x, px + w / 2, ty, 'カビのかべ（てらすで消える）', base, '#14281a', '#d8f0a0', 104);
  }
}

// ───────────── イベントを 見せる とき（client/battle-c9b.js の c9bPresent の さいご）─────────────
export function c10aPresent(scene, ev) {
  const g = scene.game;
  const warn = (t) => { g.audio.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g.audio.sfx(s); scene.banner(t, 'combo'); };
  const nm = (id) => scene.c?.get?.(id)?.name || '';
  if (ev.c10Drill || ev.c10Bomb) scene.shake?.(900, 10);
  if (ev.c10OverHeat || ev.c10Cool) scene.shake?.(400, 3);
  // バナーは 1つの できごとに 1つだけ（大事な じゅん。かさなって 読めなく ならない ように）
  const say = [
    !ev.c10Down && ev.c10DrillUp && [warn, '！ドリルが来る！「防御」で身を守ろう！'],
    !ev.c10Down && ev.c10BombUp && [warn, '！大カビばくだんが来る！「防御」で守ろう！'],
    ev.c10Cool && [warn, '冷きゃく水！メカのあつさが0に…ドリルがふえる！'],
    ev.c10Half && [warn, 'カビのきりが、ふえた！大カビばくだんに気をつけよう！'],
    ev.c10Mist?.kinoko?.length && [warn, `${ev.c10Mist.kinoko.map(nm).join('と')}がきのこになった！カビは、スピカの技で消そう！`],
    ev.c10Nobose?.length && [warn, `${ev.c10Nobose.map(nm).join('と')}がのぼせた！あつくなったら「防御」で休もう！`],
    ev.c10OverHeat && [(t) => good(t, 'sparkle'), 'オーバーヒート！メカが止まった！今だ！'],
    ev.c10Clean && [(t) => good(t, 'sparkle'), ev.c10Clean.teru ? 'スピカの光で、カビとかべが消えた！' : 'スピカの歌で、みんなのカビが消えた！'],
    ev.c10Iced && [warn, '氷で、メカがひえてしまった…'],
  ].find(Boolean);
  if (say && !ev.c10Down) say[0](say[1]);
  if (ev.c10Down) {
    scene.shake?.(400, 3);
    good('メカが、止まった！', 'sparkle');
    const boss = (scene.enemies?.() || []).find((c) => c.id === ev.c10Down.id);
    if (boss) { const t = c10Html({ ...boss, c10Down: 1, drill: 0, bomb: 0, mOver: 0 }); showTop(scene, t.html, t.cls); }
  }
}

// ───────────── コマンドの せつめい（client/battle-c9b.js の c9bCmdItems から）─────────────
export function c10aCmdInfo(scene, a) {
  if (!a) return '';
  if (a.heat10 !== undefined && a.heat10 >= (a.heatMax10 || 5) - 1) return `${a.name}はあつい！このまま動くと、のぼせてしまう。「防御」で、水を飲んで休もう。`;
  const en = scene.enemies?.() || [];
  const boss = en.find((c) => isBoss(c) && c.alive);
  if (boss?.drill || boss?.bomb) return '大きな攻撃が来る！「防御」で身を守ろう。';
  if (boss?.c10Kind === 'mold') {
    const k2 = (scene.allies?.() || []).some((x) => x.alive && x.kabi10 >= (x.kabiMax10 || 3) - 1);
    if (k2) return 'カビが多い仲間がいる！スピカの「星のうた」か「てらす」で消そう。';
  }
  return '';
}

// 第3部 第2章 第4幕「金の音と、星の橋」の 門の 番人・ミラーレの がめん（client/battle-c9b.js から よぶ。サーバーがわは shared/battle-c10d.js）
// ・画面の 上の まど（PC は 右上・スマホの たては 戦いの 絵の すぐ 下）:
//   門 … 番人ごとの まくの 色（色の 丸 ＋ 色の 名前の 文字）・われて いる 番人・色の しるしの ついた 仲間
//   ミラーレ … 今の 2色（色の 丸 ＋ 文字）と、1色めを 鳴らした あとの「あと ○回」・光を はかるの 前ぶれ・休んで いる・うつし身
// ・え: 番人の 体は まくの 色（色ちがいの え。われると 銀色）・名前の 下に 色の しるし（丸 ＋ 色の 名前の 文字）
//   ミラーレの まわりに 今の 色の 丸・勝つと ひびが 入った え（コマ 2・3。たおれても 消えない）
// ・コマンド: いちばん 上に「音を鳴らす」（色を 合わせると われる 時は「今だ！」）→ 6つの 音の ボタン（レ赤・ミ黄・ファ緑・ソ青・ラ白・シむらさき。
//   色の ついた 大きな ボタン・1回で 決定。まくや しるしと 同じ 色の ボタンには「まく」「しるし」の 小さな 文字）
//   色の 見分けが つきにくい 人の ために、どこにも 色の 名前の 文字を 出す
import { C10D_MIRARE, C10D_GUARDS, C10D_COPY } from '../shared/data/monsters-c10d.js?v=379ca0afcef1';
import { NARASU } from '../shared/data/abilities-c10d.js?v=379ca0afcef1';
import { NOTE_COLORS } from '../shared/battle-c10d.js?v=379ca0afcef1';
import { monsterCanvas } from './render/monsters.js?v=379ca0afcef1';
import { playC10dBreak, playC10dNote, playC10dCrack } from './render/battlefx-c10d.js?v=379ca0afcef1';

// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C10D_OWN_TELE = [C10D_MIRARE, ...C10D_GUARDS, C10D_COPY];
export const C10D_SCREEN_ANIMS = ['c10d_cross', 'c10d_wave', 'c10d_rain', 'c10m_hands', 'c10m_measure'];
export const C10D_ALLY_FX = {
  c10d_slash: 'claw', c10d_flash: 'bolt', c10d_cross: 'claw', c10d_wave: 'down', c10d_rain: 'down', c10d_poke: 'claw', c10d_mark: 'down',
  c10m_glare: 'bolt', c10m_hands: 'down', c10m_frame: 'quake', c10m_measure: 'bolt',
};
export const C10D_SFX = {
  c10d_slash: 'smash', c10d_flash: 'hit', c10d_cross: 'hit', c10d_wave: 'hit', c10d_rain: 'hit', c10d_poke: 'hit', c10d_mark: 'warn', c10d_ring: 'sparkle',
  c10m_glare: 'smash', c10m_hands: 'hit', c10m_frame: 'smash', c10m_measure: 'blast', c10m_daze: 'sparkle',
};
const isMirror = (c) => c?.species === C10D_MIRARE;
const isGuard = (c) => C10D_GUARDS.includes(c?.species);
export const C10D_NOTE_CSS = NOTE_COLORS.map((n) => n.css);
const nameOf = (i) => NOTE_COLORS[i]?.name || '';
const noteOf = (i) => NOTE_COLORS[i]?.note || '';
const cssOf = (i) => NOTE_COLORS[i]?.css || '#ccc';
// 文字の 色（明るい 色の 上は 黒い 文字）
const inkOf = (i) => (['yellow', 'white', 'green'].includes(NOTE_COLORS[i]?.id) ? '#1a1430' : '#ffffff');
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
// 色の 丸 ＋ 色の 名前の 文字（HTML）
export const chipHtml = (i, extra = '') => `<span class="c10d-chip${extra}" style="background:${cssOf(i)};color:${inkOf(i)}">${esc(nameOf(i))}</span>`;

// 音を鳴らす: 6つの 色の ボタン（.c10d-notes。2れつ × 3だん。スマホの たてでも おしやすい 大きさ）
const CSS = `
.c10d-top { position: absolute; right: 4px; top: 4px; z-index: 4; max-width: 50%; pointer-events: none;
  padding: 3px 8px 4px; border-radius: 10px; text-align: left; line-height: 1.35; color: #fff8e0;
  background: rgba(40, 30, 10, 0.88); border: 2px solid rgba(255, 216, 110, 0.85); box-shadow: 0 0 10px rgba(255, 210, 90, 0.4); }
.c10d-top .row { font-size: 12px; white-space: nowrap; }
.c10d-top .row b { color: #ffe860; }
.c10d-top .tx { margin-top: 2px; font-size: 11px; color: #fff0c8; }
.c10d-top.warn { border-color: #ff9a40; box-shadow: 0 0 14px rgba(255, 150, 64, 0.85); }
.c10d-top.warn .tx { color: #ffd060; animation: c10d-pulse 0.9s infinite; }
.c10d-top.good { border-color: #8affc8; }
.c10d-top.good .tx { color: #b0ffd8; }
.c10d-chip { display: inline-block; min-width: 1.6em; padding: 0 5px; margin: 0 1px; border-radius: 8px; font-weight: bold; font-size: 11px;
  text-align: center; border: 1px solid rgba(0, 0, 0, 0.5); box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35) inset; }
.c10d-chip.done { opacity: 0.35; text-decoration: line-through; }
@keyframes c10d-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.c10d-top.c10d-flow { position: relative; left: auto; right: auto; top: auto; bottom: auto; transform: none; margin: 3px auto 0; max-width: 98%; box-sizing: border-box; text-align: center; }
@media (max-aspect-ratio: 1/1) { .c10d-top { top: 2px; left: 2px; right: auto; max-width: 60%; padding: 1px 5px 2px; } .c10d-top .row { font-size: 11px; } .c10d-top .tx { font-size: 10px; margin-top: 0; } }
.menu.c10d-notes { display: grid !important; grid-template-columns: 1fr 1fr; gap: 6px; padding: 4px; }
.menu.c10d-notes > li.item { min-height: 50px !important; height: auto !important; display: flex; align-items: center; justify-content: center; border-radius: 12px; margin: 0;
  border: 3px solid rgba(0, 0, 0, 0.45); box-shadow: 0 2px 0 rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.4) inset; }
.menu.c10d-notes > li.item .l { display: flex; flex-direction: column; align-items: center; line-height: 1.15; font-weight: bold; }
.menu.c10d-notes > li.item .nt { font-size: 18px; }
.menu.c10d-notes > li.item .cn { font-size: 12px; }
.menu.c10d-notes > li.item .tg { font-size: 10px; margin-top: 1px; padding: 0 4px; border-radius: 6px; background: rgba(0, 0, 0, 0.55); color: #ffe860; }
.menu.c10d-notes > li.item.sel { outline: 3px solid #ffffff; outline-offset: 1px; transform: scale(1.03); }
.menu.c10d-notes > li.backchip { grid-column: 1 / -1; }
${NOTE_COLORS.map((n, i) => `.menu.c10d-notes > li.c10d-n${i}, .menu.c10d-notes > li.c10d-n${i}.sel { background: ${n.css} !important; color: ${inkOf(i)} !important; }`).join('\n')}
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c10d-css')) return;
  const s = document.createElement('style');
  s.id = 'c10d-css';
  s.textContent = CSS;
  document.head.append(s);
}

// ───── 画面の 上の まど（HTML。テストからも 見る）─────
// foes … 門の 番人・ミラーレの pub（生きて いる 物）・allies … 味方の pub
export function c10dHtml(foes = [], allies = [], me = null) {
  const marks = allies.filter((a) => a.alive && Number.isInteger(a.mark10));
  const markRow = marks.length ? `<div class="row">しるし：${marks.map((a) => `${esc(a.name)}${chipHtml(a.mark10)}`).join('　')}</div>` : '';
  const m = foes.find(isMirror);
  let cls = 'c10d-top';
  let rows;
  let tx;
  if (m) {
    const veil = m.veil10 || [];
    const rung = m.rung10 || [];
    if (m.c10Down) {
      rows = '<div class="row">まく：なし</div>';
      tx = '鏡に、ひびが入った！';
      cls += ' good';
    } else {
      const chips = [...rung.map((i) => chipHtml(i, ' done')), ...veil.map((i) => chipHtml(i))].join('');
      rows = `<div class="row">まくの色：${veil.length ? chips : '<b>われている！</b>'}${m.left10 ? `　<b>あと${m.left10}回</b>` : ''}</div>`;
      const aim = m.measure ? allies.find((a) => a.id === m.measureAim) : null;
      if (aim) {
        tx = aim.id === me ? '「光をはかる」があなたに来る！「防御」でそなえよう' : `「光をはかる」が${aim.name}に来る！「防御」でそなえよう`;
        cls += ' warn';
      } else if (m.left10) {
        tx = `もう1色！ミラーレが${m.left10}回動く前に、${veil.map(nameOf).join('と')}の音を鳴らそう`;
        cls += ' warn';
      } else if (!veil.length) {
        tx = m.daze ? 'まくがわれて、ミラーレは動けない！今だ！' : 'まくがわれた！今なら、こうげきが通る';
        cls += ' good';
      } else if (m.copyOut) {
        tx = 'うつし身は、スピカの「てらす」で消せる';
      } else tx = veil.length > 1 ? '「音を鳴らす」で、2色とも鳴らすと、まくがわれる' : '「音を鳴らす」で、同じ色を鳴らすと、まくがわれる';
    }
  } else {
    const gs = foes.filter(isGuard);
    if (!gs.length) return { html: '', cls };
    rows = gs.map((g) => `<div class="row">${esc(g.base10 || g.name)}：${(g.veil10 || []).length ? g.veil10.map((i) => chipHtml(i)).join('') : '<b>われている！</b>'}</div>`).join('');
    if (gs.some((g) => !(g.veil10 || []).length)) { tx = 'まくがわれた番人を、こうげき！'; cls += ' good'; } else tx = '体と同じ色の「音を鳴らす」で、まくがわれる';
    if (marks.some((a) => a.id === me)) { tx = `あなたに${nameOf(marks.find((a) => a.id === me).mark10)}のしるし！同じ色の音で消える`; cls = cls.replace(' good', '') + ' warn'; }
  }
  return { html: `${rows}${markRow}<div class="tx">${esc(tx)}</div>`, cls };
}
const portrait = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
function showTop(scene, html, cls) {
  if (typeof document === 'undefined' || !scene.stage) return;
  if (!scene.c10dTop) {
    addCss();
    scene.c10dTop = document.createElement('div');
    scene.c10dTop.className = cls;
    scene.c10dTop.style.display = 'none';
    scene.stage.append(scene.c10dTop);
  }
  const el = scene.c10dTop;
  const flow = portrait() && !!scene.stage.parentElement;
  if (flow) {
    if (el.previousElementSibling !== scene.stage || el.parentElement !== scene.stage.parentElement) scene.stage.after(el);
  } else if (el.parentElement !== scene.stage) scene.stage.append(el);
  const key = cls + '|' + html + '|' + flow;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  el.className = cls + (flow ? ' c10d-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
}
const myId = (scene) => scene.myActor?.id ?? scene.cur ?? null;
const foesOf = (scene) => (scene.enemies?.() || []).filter((e) => (isMirror(e) || isGuard(e)) && e.alive);

// ───────────── え（client/battle-c9b.js の c9bSprite から）─────────────
// 番人 … まくの 色の え（われて いる 間は 銀色）・ミラーレ … 勝った あとは ひびの え（コマ 2・3）
export function c10dSprite(c, frame) {
  if (isMirror(c) && c.c10Down) {
    c.dead = -1;
    return monsterCanvas(C10D_MIRARE, (frame ? 1 : 0) + 2);
  }
  if (isGuard(c) && c.c10Kind === 'gate') {
    const v = c.veil10 || [];
    const key = v.length ? `${c.species}~${NOTE_COLORS[v[0]]?.id}` : null;
    if (key) return monsterCanvas(key, frame);
  }
  return null;
}

function tag(x, tx, ty, text, base, bg, fg, wd = 30) {
  x.globalAlpha = base * 0.9;
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
// 色の 丸 ＋ 色の 名前（え の 上）
function chip(x, cx, cy, i, base, done = false) {
  const txt = nameOf(i);
  const wd = 8 + txt.length * 7;
  x.globalAlpha = base * (done ? 0.35 : 0.95);
  x.fillStyle = '#1a1020';
  x.fillRect(Math.round(cx - wd / 2) - 1, Math.round(cy - 6), wd + 2, 12);
  x.fillStyle = cssOf(i);
  x.fillRect(Math.round(cx - wd / 2), Math.round(cy - 5), wd, 10);
  x.fillStyle = inkOf(i);
  x.font = 'bold 7px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(txt, cx, cy + 0.5);
  if (done) {
    x.strokeStyle = '#1a1020';
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(cx - wd / 2, cy);
    x.lineTo(cx + wd / 2, cy);
    x.stroke();
  }
  x.textAlign = 'start';
  x.textBaseline = 'alphabetic';
  x.globalAlpha = base;
  return wd;
}

// ───────────── たたかいの え（client/battle-c9b.js の c9bDraw の さいご）─────────────
export function c10dDraw(scene, x, m, c, px, py, w, h, base) {
  if (!isMirror(c) && !isGuard(c)) return;
  const T = scene.time || 0;
  const allies = scene.allies?.() || [];
  const top = c10dHtml(foesOf(scene).concat(isMirror(c) && c.c10Down ? [c] : []), allies, myId(scene));
  showTop(scene, top.html, top.cls);
  refreshInfo(scene);
  if (!c.alive || c.c10Down) return;
  const veil = c.veil10 || [];
  // まくの 光（色の わ）
  if (veil.length) {
    veil.forEach((k, j) => {
      x.globalAlpha = base * (0.35 + Math.sin(T / 260 + j * 1.7) * 0.12);
      x.strokeStyle = cssOf(k);
      x.lineWidth = 2;
      x.beginPath();
      x.ellipse(px + w / 2, py + h * 0.52, w * 0.56 + j * 3, h * 0.56 + j * 3, 0, 0, Math.PI * 2);
      x.stroke();
    });
    x.globalAlpha = base;
  }
  // 名前の 下（え の 上）に 色の しるし（色の 丸 ＋ 文字）
  const cy = Math.max(7, py - 6);
  const items = [...(c.rung10 || []).map((k) => [k, true]), ...veil.map((k) => [k, false])];
  if (items.length) {
    const wds = items.map(([k]) => 8 + nameOf(k).length * 7 + 4);
    let cx = px + w / 2 - wds.reduce((s, v) => s + v, 0) / 2;
    items.forEach(([k, done], j) => { chip(x, cx + wds[j] / 2, cy, k, base, done); cx += wds[j]; });
  } else tag(x, px + w / 2, cy, 'まくがわれた！', base, '#0a2a1a', '#b0ffd8', 60);
  const ty = portrait() ? py + h * 0.6 : py + h + 4;
  if (isMirror(c)) {
    if (c.left10) tag(x, px + w / 2, ty, `もう1色！あと${c.left10}回`, base, '#3a2a00', '#ffe860', 80);
    else if (c.measure) tag(x, px + w / 2, ty, '光をはかる！ねらわれた人は防御', base, '#3a1a00', '#ffd060', 120);
    else if (c.daze) tag(x, px + w / 2, ty, 'ひびがしみて動けない！今だ！', base, '#0a2a1a', '#b0ffd8', 112);
  }
}

// ───────────── イベントを 見せる とき（client/battle-c9b.js の c9bPresent の さいご）─────────────
export function c10dPresent(scene, ev) {
  const g = scene.game;
  const warn = (t) => { g.audio.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g.audio.sfx(s); scene.banner(t, 'combo'); };
  if (ev.c10dBreak?.length) scene.shake?.(300, 4);
  if (ev.c10dMeasure && !ev.c10dMeasure.guard) scene.shake?.(700, 8);
  const r = ev.c10dRing;
  // 色の えんしゅつ（音の 色の わ・まくが われる・ひび）
  const who = (id) => [...(scene.c?.values?.() || [])].find((x) => x.id === id) || null;
  if (r && scene.fx) { const a = who(r.id); if (a) playC10dNote(scene.fx, scene.allyPt?.(a), cssOf(r.color)); }
  for (const id of ev.c10dBreak || []) { const e = who(id); if (e && scene.fx) playC10dBreak(scene.fx, scene.center?.(e), r ? cssOf(r.color) : '#ffffff'); }
  if (ev.c10dDown && scene.fx) { const e = who(ev.c10dDown.id); if (e) playC10dCrack(scene.fx, scene.center?.(e)); }
  // 第99回 A班: うつし身が 出る 前に 開いて いた いちばん 上の コマンドの まどに「スピカ：てらす」を 出す（まどを 開き直す。
  //   下の まど〈特技・色の ボタン など〉を 開いて いる 時は そのまま。敵の 一覧が かわった あとで 見る）
  if (ev.c10dCopy && typeof scene.openCommand === 'function') {
    setTimeout(() => {
      const t = scene.cmdEl?.textContent || '';
      if (!scene.ended && scene.myActor?.alive && /戦う/.test(t) && /防御/.test(t) && !/スピカ：てらす/.test(t)) scene.openCommand();
    }, 60);
  }
  const say = [
    ev.c10dBreak?.length && [(t) => good(t, 'sparkle'), 'パリーン！まくがわれた！今なら、こうげきが通る！'],
    ev.c10dBack && [warn, `まに合わなかった…${ev.c10dBack.colors.map(nameOf).join('と')}の色が、もどった！`],
    r?.hit?.length && !r.broke?.length && [(t) => good(t, 'sparkle'), `${nameOf(r.color)}のまくが消えた！すぐ、もう1色を！`],
    r?.unmark?.length && [(t) => good(t, 'sparkle'), `${nameOf(r.color)}のしるしが消えた！`],
    r && !r.ok && r.id === myId(scene) && [warn, '音が、合わない…まくと同じ色の音を！'],
    ev.c10dMeasureUp && [warn, `！光をはかる！ねらわれた人は「防御」！`],
    ev.c10dMark && [warn, `${nameOf(ev.c10dMark.color)}のしるしをつけられた！同じ色の音で消える！`],
    ev.c10dShift && [warn, `まくの色が、${ev.c10dShift.to.map(nameOf).join('・')}にかわった！`],
    ev.c10dCopy && [warn, 'うつし身があらわれた！スピカの「てらす」で消せる！'],
    ev.c10dCopyGone && [(t) => good(t, 'sparkle'), 'スピカの光で、うつし身が消えた！'],
    ev.c10dSong && [(t) => good(t, 'sparkle'), ev.c10dSong.next ? '次のまくは、1色だけになる！' : `スピカの歌で、${nameOf(ev.c10dSong.color)}のまくが消えた！`],
    ev.c10dVeil && [warn, `${ev.c10dVeil.colors.map(nameOf).join('と')}のまくを、まとい直した！`],
  ].find(Boolean);
  if (say && !ev.c10dDown) say[0](say[1]);
  if (ev.c10dDown) {
    scene.shake?.(500, 4);
    good('ピシッ…！ミラーレの鏡に、ひびが入った！', 'sparkle');
  }
}

// ───────────── コマンド（client/battle-c9b.js の c9bCmdItems・c9bCmdPick）─────────────
// 今 鳴らすと よい 色（まくの 色・自分や 仲間の しるしの 色）
function wanted(scene) {
  const out = new Map();
  for (const e of foesOf(scene)) for (const k of e.veil10 || []) out.set(k, 'まく');
  for (const a of scene.allies?.() || []) if (a.alive && Number.isInteger(a.mark10) && !out.has(a.mark10)) out.set(a.mark10, 'しるし');
  return out;
}
export function c10dCmdItems(scene, a) {
  const items = [];
  let info = '';
  if (!a || !(a.abilities || []).includes(NARASU) || !foesOf(scene).length) return { items, info };
  const want = wanted(scene);
  const m = foesOf(scene).find(isMirror);
  const now = m ? !!m.left10 || (m.veil10 || []).length === 1 : want.size > 0;
  items.push({ html: `<span class="dual-cmd">音を鳴らす</span>${now && want.size ? '<span class="tag">今だ！</span>' : ''}`, value: 'c10dring', cls: 'k-dual' });
  const me = (scene.allies?.() || []).find((x) => x.id === a.id) || a;
  if (m) {
    const veil = m.veil10 || [];
    if (m.measure && m.measureAim === a.id) info = '「光をはかる」が、あなたに来る！「防御」でそなえよう。';
    else if (m.left10) info = `もう1色！ミラーレが${m.left10}回動く前に、${veil.map(nameOf).join('と')}の音を鳴らそう。`;
    else if (veil.length) info = `ミラーレのまくは${veil.map(nameOf).join('と')}。「音を鳴らす」で、${veil.length > 1 ? '2色とも鳴らすと' : '同じ色を鳴らすと'}、まくがわれる。`;
    else info = 'まくがわれている！今のうちに、こうげきしよう。';
  } else {
    const gs = foesOf(scene).filter(isGuard);
    const veiled = gs.filter((e) => (e.veil10 || []).length);
    if (Number.isInteger(me.mark10)) info = `あなたに${nameOf(me.mark10)}のしるし！${nameOf(me.mark10)}の音を鳴らすと、消える。`;
    else if (veiled.length) info = `番人のまくの色は ${veiled.map((e) => nameOf(e.veil10[0])).join('・')}。体と同じ色の「音を鳴らす」で、まくがわれる。`;
    else info = 'まくがわれている！今のうちに、こうげきしよう。';
  }
  scene.c10dInfoText = info;
  return { items, info };
}
// コマンドの まどを 開いた あとに ようすが かわったら（色が かわった・あと○回 など）、せつめいを 今の ようすで 出し直す
export function refreshInfo(scene) {
  const old = scene.c10dInfoText;
  const a = scene.myActor;
  if (!old || !a || !scene.infoEl || scene.infoEl.textContent !== old) return false;
  const now = c10dCmdItems({ enemies: () => scene.enemies?.() || [], allies: () => scene.allies?.() || [] }, a).info;
  if (!now || now === old) return false;
  scene.info(now);
  scene.c10dInfoText = now;
  return true;
}
// 6つの 音の まど（的えらびと おなじ 1回で 決まる 形。2れつ × 3だんの 色の ボタン）
export function noteMenuItems(scene) {
  const want = wanted(scene);
  return NOTE_COLORS.map((n, i) => ({
    html: `<span class="nt">${esc(n.note)}</span><span class="cn">${esc(n.name)}</span>${want.has(i) ? `<span class="tg">${want.get(i)}と同じ</span>` : ''}`,
    value: i,
    cls: `c10d-n${i}`,
    title: `${n.note}（${n.name}）`,
  }));
}
export function c10dNoteMenu(scene, a) {
  addCss();
  const list = noteMenuItems(scene);
  const want = wanted(scene);
  const start = Math.max(0, list.findIndex((it) => want.has(it.value)));
  scene.showMenu(list, (it) => scene.send({ type: 'ability', id: NARASU, choice: it.value }), () => scene.openCommand(), 'どの音を鳴らす？', null, start);
  const mm = scene.menu;
  if (mm?.root) {
    mm.root.classList.add('c10d-notes');
    // 2れつの ならび（十字キーの 上下は 2つ とぶ）
    mm.cols = 2;
  }
  return true;
}
export function c10dCmdPick(scene, a, value) {
  if (value !== 'c10dring') return false;
  return c10dNoteMenu(scene, a);
}
void noteOf;

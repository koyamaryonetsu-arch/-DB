// 第3部 第1章 第4幕「星のはかば」の スピカの 星のうた・あそびたい魔人 ムウ・ふつうの 魔物の がめん
// （client/battle-c9b.js から よぶ。サーバーがわは shared/battle-c9d.js）
// ・星のうたの たまりぐあい（スピカの まどの「てらす」の 横）: 「うた ♪♪♪○○」→ たまると「うた OK」（snapshot の spica.teru.song・ev.c9Spica）
//   スマホの たては スピカの まどが 下に 出る。字を 小さく して 1行に おさめる
// ・コマンド: たまって いれば いちばん 上に「スピカ：星のうた」（c9dCmdItems・c9dCmdPick）
// ・ムウ: 画面の 上の まどに 2体の HPの 線（同じくらいに けずる ため）と 今 どう すると よいか。分かれる 前は 出さない
//   ばたんきゅう（え の コマ 2・3。たおれても 消えない）・勝つと すわりこむ（コマ 4・5）・おかしビームの ねらい・いっしょに ドーン・ぷんぷん
// ・おかし: 仲間の まどを ピンクに（c9dStatus。client/battle-c9a.js の c9aStatus から）
import { C9D_MU, C9D_MUMU } from '../shared/data/monsters-c9d.js?v=4646ff086801';
import { SONG } from '../shared/data/abilities-c9d.js?v=4646ff086801';
import { monsterCanvas } from './render/monsters.js?v=4646ff086801';

// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C9D_OWN_TELE = [C9D_MU, C9D_MUMU];
export const C9D_SCREEN_ANIMS = ['c9m_split', 'c9m_wake', 'c9m_beam', 'c9m_doon', 'c9m_spin', 'c9d_song', 'c9d_echo', 'c9d_bell'];
export const C9D_ALLY_FX = {
  c9d_bump: 'claw', c9d_echo: 'wind', c9d_hum: 'down', c9d_bite: 'claw', c9d_web: 'down', c9d_swing: 'wind',
  c9d_wing: 'claw', c9d_dust: 'down', c9d_mlight: 'bolt', c9d_horn: 'claw', c9d_bell: 'bolt', c9d_jump: 'quake',
  c9d_kclaw: 'claw', c9d_shadow: 'down', c9d_eyes: 'down',
  c9m_pat: 'quake', c9m_bounce: 'quake', c9m_yawn: 'down', c9m_spin: 'wind', c9m_beam: 'down', c9m_doon: 'quake',
};
export const C9D_SFX = {
  c9d_bump: 'hit', c9d_echo: 'warn', c9d_hum: 'sparkle', c9d_bite: 'hit', c9d_web: 'warn', c9d_swing: 'hit',
  c9d_wing: 'hit', c9d_dust: 'sparkle', c9d_mlight: 'sparkle', c9d_horn: 'hit', c9d_bell: 'bolt', c9d_jump: 'smash',
  c9d_kclaw: 'hit', c9d_shadow: 'warn', c9d_eyes: 'hit',
  c9m_pat: 'smash', c9m_bounce: 'hit', c9m_yawn: 'sparkle', c9m_spin: 'blast', c9m_split: 'sparkle', c9m_wake: 'buff',
  c9m_beamup: 'warn', c9m_beam: 'blast', c9m_doonup: 'warn', c9m_doon: 'blast', c9d_song: 'sparkle',
};
const MU_LABEL = { [C9D_MU]: 'ムウ', [C9D_MUMU]: 'ムウムウ' };
const isMu = (c) => c?.species === C9D_MU || c?.species === C9D_MUMU;

export const songText = (s) => (!s ? '' : s.charge >= s.max ? 'うた OK' : `うた ${'♪'.repeat(s.charge)}${'・'.repeat(Math.max(0, s.max - s.charge))}`);

const CSS = `
.c9a-hud .c9d-song { margin-left: 6px; color: #ffd8f0; letter-spacing: 0; }
.c9a-hud .c9d-song.ok { color: #fff6c8; text-shadow: 0 0 6px rgba(255, 200, 240, 0.95); animation: c9d-pulse 1s infinite; }
@keyframes c9d-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.c9d-top { position: absolute; right: 4px; top: 4px; z-index: 4; max-width: 46%; pointer-events: none;
  padding: 3px 8px 4px; border-radius: 10px; text-align: left; line-height: 1.3; color: #fff4fc;
  background: rgba(30, 18, 50, 0.84); border: 2px solid rgba(255, 184, 216, 0.85); box-shadow: 0 0 10px rgba(255, 184, 216, 0.4); }
.c9d-top .rows { display: flex; flex-direction: column; gap: 1px; }
.c9d-top .row { display: flex; align-items: center; gap: 4px; font-size: 12px; white-space: nowrap; }
.c9d-top .row .nm { display: inline-block; min-width: 4.2em; }
.c9d-top .bar { display: inline-block; width: 64px; height: 7px; border-radius: 4px; background: #2a2040; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.35); }
.c9d-top .bar i { display: block; height: 100%; }
.c9d-top .mu .bar i { background: #c8b0f0; }
.c9d-top .mumu .bar i { background: #8ee8c8; }
.c9d-top .row.ko { opacity: 0.75; }
.c9d-top .row.ko .bar i { background: #6a6a7a; }
.c9d-top .mad { color: #ff8a8a; font-weight: bold; }
.c9d-top .tx { margin-top: 2px; font-size: 11px; color: #ffe8a0; }
.c9d-top.warn { border-color: #ffd040; box-shadow: 0 0 14px rgba(255, 208, 64, 0.85); }
.c9d-top.warn .tx { color: #ffe060; animation: c9d-pulse 0.9s infinite; }
.c9d-top.win { border-color: #8affc8; }
.c9d-top .tired { color: #ffe060; font-weight: bold; }
.c9d-top.c9d-flow { position: relative; left: auto; right: auto; top: auto; margin: 3px auto 0; max-width: 98%; box-sizing: border-box; text-align: center; }
.c9d-top.c9d-flow .rows { flex-direction: row; justify-content: center; gap: 10px; }
.b-mem.c9d-okashi { background: linear-gradient(180deg, rgba(255, 154, 192, 0.35), rgba(255, 240, 200, 0.2)) !important; }
@media (max-aspect-ratio: 1/1) { .c9d-top { top: 2px; left: 2px; right: auto; max-width: 58%; padding: 1px 5px 2px; } .c9d-top .row { font-size: 10px; } .c9d-top .bar { width: 44px; height: 6px; } .c9d-top .tx { font-size: 10px; margin-top: 0; }
  .c9a-hud .c9d-song { margin-left: 4px; } .c9a-hud .c9b-teru { margin-left: 4px; letter-spacing: 0; } }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c9d-css')) return;
  const s = document.createElement('style');
  s.id = 'c9d-css';
  s.textContent = CSS;
  document.head.append(s);
}
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// ───────────── 星のうたの たまりぐあい（client/battle-c9b.js の c9bHud の さいご）─────────────
const songOf = (scene) => scene.c9spica?.song || scene.c9spica?.teru?.song || null;
export function c9dHud(scene) {
  const s = songOf(scene);
  const h = scene.c9hud;
  if (!s || !h || typeof document === 'undefined') return;
  addCss();
  if (!h.song) {
    h.song = document.createElement('span');
    h.song.className = 'c9d-song';
    h.el.append(h.song);
  }
  h.song.textContent = songText(s);
  h.song.classList.toggle('ok', s.charge >= s.max);
}

// ───── 画面の 上の まど（2体の HP。分かれた あとだけ）─────
function topEl(scene) {
  if (typeof document === 'undefined' || !scene.stage) return null;
  if (!scene.c9dTop) {
    addCss();
    scene.c9dTop = document.createElement('div');
    scene.c9dTop.className = 'c9d-top';
    scene.c9dTop.style.display = 'none';
    scene.stage.append(scene.c9dTop);
  }
  return scene.c9dTop;
}
// 2体の HPの まど（HTML。テストからも 見る）。list … ムウ・ムウムウの pub
export function muHtml(list) {
  const mus = (list || []).filter((c) => isMu(c) && !c.muHide);
  if (!mus.length || !mus.some((c) => c.muStage)) return { html: '', cls: 'c9d-top' };
  const ko = mus.find((c) => c.muKO);
  const up = mus.filter((c) => c.alive);
  const win = mus.some((c) => c.muSit);
  const mad = up.find((c) => c.muAngry);
  const rows = mus.map((c) => {
    const r = c.alive ? Math.max(0, Math.min(1, (c.hp || 0) / (c.maxHp || 1))) : 0;
    const st = c.muKO ? '<span class="mad">ばたんきゅう</span>' : c.muTired ? '<span class="tired">へとへと</span>' : c.muAngry ? '<span class="mad">ぷんぷん！</span>' : '';
    return `<span class="row ${c.species === C9D_MU ? 'mu' : 'mumu'}${c.alive ? '' : ' ko'}"><span class="nm">${MU_LABEL[c.species]}</span><span class="bar"><i style="width:${Math.round(r * 100)}%"></i></span>${st}</span>`;
  }).join('');
  let tx;
  let cls = 'c9d-top';
  if (win) { tx = 'ふたりとも、すわりこんだ！'; cls += ' win'; } else if (ko && up.length) {
    tx = `今だ！${MU_LABEL[up[0].species]}もたおそう！`;
    cls += ' warn';
  } else if (up.length === 2 && up.every((c) => c.muTired)) {
    tx = '2体ともへとへと！今だ、いっきにたおそう！';
    cls += ' warn';
  } else if (up.some((c) => c.muTired)) tx = `${MU_LABEL[up.find((c) => c.muTired).species]}はへとへと。もう片方も、へとへとにしよう`;
  else if (mad) tx = `${MU_LABEL[mad.species]}がおこっている！HPの多い方をけずろう`;
  else tx = '同じくらいにけずって、2体ともへとへとにしよう！';
  return { html: `<div class="rows">${rows}</div><div class="tx">${esc(tx)}</div>`, cls };
}
// スマホの たてでは、まどは 戦いの 絵の すぐ 下に ならべる（client/battle-c9c.js の なぞの まどと おなじ。絵・名前・スピカの まどに かさならない）
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
  el.className = cls + (flow ? ' c9d-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
}

// ───────────── え（client/battle-c9b.js の c9bSprite の はじめ）─────────────
// ムウムウが まだ いない（分かれる 前）… すぐ 消す ／ ばたんきゅう … コマ 2・3（たおれても 消えない）／ 勝った … すわりこむ コマ 4・5
export function c9dSprite(c, frame) {
  if (!isMu(c)) return null;
  if (!c.alive && c.muHide) {
    c.dead = 2;
    return null;
  }
  if (!c.alive && (c.muKO || c.muSit)) {
    // 消えない（client/battle.js は dead が 0 より 大きい 間だけ うすく して 消す）
    c.dead = -1;
    return monsterCanvas(c.species, (frame ? 1 : 0) + (c.muSit ? 4 : 2));
  }
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
export function c9dDraw(scene, x, m, c, px, py, w, h, base) {
  if (!isMu(c)) return;
  const T = scene.time || 0;
  const top = muHtml(scene.enemies?.() || [c]);
  showTop(scene, top.html, top.cls);
  if (c.muSit) return;
  if (c.muKO) {
    tag(x, px + w / 2, Math.max(8, py + h * 0.45), 'ばたんきゅう…', base, '#2a1a40', '#e8dcff', 56);
    return;
  }
  if (!c.alive) return;
  // スマホの たてでは しるしを おなかの あたりに（足もとは スピカの まど・頭の 上は 名前の 帯と かさなる）
  const ty = portrait() ? py + h * 0.55 : py + h + 4;
  if (c.muBeamAim) {
    const nm = scene.c?.get?.(c.muBeamAim)?.name || '';
    x.globalAlpha = base * (0.45 + Math.sin(T / 70) * 0.35);
    x.strokeStyle = '#ff9ac0';
    x.lineWidth = 2;
    x.beginPath();
    x.arc(px + w / 2, py + h * 0.22, Math.min(w, h) * 0.2, 0, Math.PI * 2);
    x.stroke();
    x.globalAlpha = base;
    tag(x, px + w / 2, ty, `おかしビーム！ねらい：${nm}`, base, '#3a0a2a', '#ffd0e8', Math.min(150, 70 + nm.length * 7));
  } else if (c.muDoon) {
    x.globalAlpha = base * (0.5 + Math.sin(T / 70) * 0.4);
    x.strokeStyle = '#ffd040';
    x.lineWidth = 2;
    x.beginPath();
    x.ellipse(px + w / 2, py + h, w * 0.6, 8, 0, 0, Math.PI * 2);
    x.stroke();
    x.globalAlpha = base;
    tag(x, px + w / 2, ty, 'いっしょにドーンが来る！防御！', base, '#3a0a1a', '#ffd06a', 112);
  } else if (c.muTired) {
    tag(x, px + w / 2, ty, 'へとへと（もう起こせない）', base, '#2a2a10', '#ffe060', 96);
  } else if (c.muAngry) {
    tag(x, px + w / 2, ty, 'ぷんぷん！（攻撃が強い）', base, '#3a0a1a', '#ff9a9a', 90);
  }
}

// ───────────── イベントを 見せる とき（client/battle-c9b.js の c9bPresent の さいご）─────────────
export function c9dPresent(scene, ev) {
  const g = scene.game;
  const warn = (t) => { g.audio.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g.audio.sfx(s); scene.banner(t, 'combo'); };
  const nm = (id) => scene.c?.get?.(id)?.name || '';
  // 第93回 A班: スマホの たてでは バナーの 文を 短く（左右に はみ出して 切れない ように）
  const pt = (long, short) => (portrait() ? short : long);
  const sg = ev.c9Spica?.song || ev.c9Spica?.teru?.song;
  if (sg && scene.c9spica) {
    scene.c9spica.song = { ...sg };
    c9dHud(scene);
  }
  if (ev.c9Spica?.songReady) good(pt('スピカの歌がたまった！「星のうた」が使える！', '「星のうた」が使える！'), 'sparkle');
  if (ev.c9dSong) good(pt('スピカの星のうた！みんな元気になった！', '星のうた！みんな元気に！'), 'sparkle');
  if (ev.c9mSplit) { scene.shake?.(400, 4); warn(pt('ムウが2体に分かれた！同じくらいにけずろう！', 'ムウが2体に分かれた！')); }
  if (ev.c9mKO) good(pt(`${nm(ev.c9mKO.id)}がばたんきゅう！${nm(ev.c9mKO.by)}はへとへとで起こせない！`, `${nm(ev.c9mKO.id)}がばたんきゅう！`));
  if (ev.c9mWake) warn(pt('すぐ起こされた…！2体とも、へとへとにしてから、たおそう！', 'すぐ起こされた…！'));
  if (ev.c9mAngry) warn(pt('仲間はずれは、いやだ！HPの多い方がおこった！', '仲間はずれは、いやだ！'));
  if (ev.c9mBeamUp) warn(pt(`！おかしビームが来る…ねらいは${nm(ev.c9mBeamUp.aim)}！防御で守ろう！`, `ねらいは${nm(ev.c9mBeamUp.aim)}！防御！`));
  if (ev.c9mBeam) {
    if (ev.c9mBeam.blocked) good(pt('防御で、おかしビームをはね返した！', 'はね返した！'), 'sparkle');
    else warn(pt(`${nm(ev.c9mBeam.to)}がおかしにされた！スピカの星のうたでなおそう！`, `${nm(ev.c9mBeam.to)}がおかしに！`));
  }
  if (ev.c9mDoonUp) warn(pt('！いっしょにドーンが来る！「防御」でそなえよう！', 'ドーンが来る！防御！'));
  if (ev.c9mDoon) scene.shake?.(900, 10);
  if (ev.c9mWin) {
    scene.shake?.(400, 3);
    good(pt('ムウとムウムウは、すわりこんだ！', '2人は、すわりこんだ！'), 'sparkle');
    // たおれた 魔物の しるしは かかれない（client/battle.js）ので、上の まども ここで 勝った 形に
    const t = muHtml((scene.enemies?.() || []).map((c) => (isMu(c) && !c.muHide ? { ...c, alive: false, hp: 0, muSit: 1, muKO: 0, muStage: 1 } : c)));
    showTop(scene, t.html, t.cls);
  }
}

// ───────────── コマンド（client/battle-c9b.js の c9bCmdItems・c9bCmdPick）─────────────
export function c9dCmdItems(scene, a) {
  const items = [];
  let info = '';
  const s = songOf(scene);
  if (!a || !s || s.charge < s.max || !(a.abilities || []).includes(SONG)) return { items, info };
  items.push({ html: '<span class="dual-cmd">スピカ：星のうた</span>', value: 'c9dsong', cls: 'k-dual' });
  const allies = scene.allies?.() || [];
  const stuck = allies.filter((x) => x.alive && (x.status || []).some((k) => ['okashi', 'sleep', 'paralyze', 'confuse', 'poison'].includes(k)));
  info = stuck.length ? `${stuck.map((x) => x.name).join('と')}を、スピカの「星のうた」でなおそう！` : 'スピカの歌がたまっている！「星のうた」で、みんなの悪い状態をなおし、HPを少し回復できる。';
  return { items, info };
}
export function c9dCmdPick(scene, a, value) {
  if (value !== 'c9dsong') return false;
  scene.send({ type: 'ability', id: SONG });
  return true;
}

// ───────────── 仲間の まど（client/battle-c9a.js の c9aStatus から）: おかしの 人は ピンク ─────────────
export function c9dStatus(s, a) {
  if (!s?.box?.classList) return;
  addCss();
  s.box.classList.toggle('c9d-okashi', !!a?.alive && (a.status || []).includes('okashi'));
}

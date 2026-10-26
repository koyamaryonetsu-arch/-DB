#!/usr/bin/env node
// 第48回: 技の エフェクトを 見る どうぐ（コンタクトシート PNG を つくる）
//
//   node tools/fx-preview.mjs <anim> [--frames 12] [--dir ally|enemy|party] [--targets 1|3] [--out <png>]
//   node tools/fx-preview.mjs --ability <技の id>              … たたかいで ほんとうに 出る え（大技の つなぎ・看板の 技・作り直しの 上書き の あと）
//                                                              （'id@masc' … 男の子の 版、合体技の id（DUAL_TECHS）… 合体技。味方に かける 技は 味方の いちに）
//   node tools/fx-preview.mjs --group g1 [--out <dir>]         … G1 の 大技 ぜんぶ（1 anim 1まい。ふだんは fx-out/g1/。第49回の o1〜o6 も おなじ）
//   node tools/fx-preview.mjs --all <prefix> [--out <dir>]     … とうろくした 大技（axfx）を 1つずつ 1まいに
//   node tools/fx-preview.mjs --list [prefix]                  … とうろくした 大技の なまえ
//   node tools/fx-preview.mjs --charges [tier]                 … ためかた 14しゅるいを 1まいに（1しゅるい 1行・4こま）
//
//   ほかの オプション:
//     --tier basic|advanced|super|legend  段階を ためしに かえる（大技だけ）
//     --charge ki|chakra|…                ためかたを ためしに かえる（大技だけ）
//     --ability <技の id>                 技ごとの ちがい（shared/data/ax-time-gN.js の AX_SKILLS）で 見る（anim を 書かなければ その 技の え）
//     --repeat                            2回目（ため 半分・伝説の カットイン なし）
//     --dual                              合体技（ため なし）
//     --speed 1                           たたかいの 速さ（0.5〜2。時間が ちぢむ）
//     --element fire …                    属性（battle.js が わたす fx.element）
//     --crit                              かいしん
//     --bg grass                          はいけい（battlefx.js の BG の なまえ）
//     --scale 2                           1こまの 大きさ（256×144 の なんばい）
//     --cols 4                            よこに ならべる かず
//     --seed 7                            らんすうの たね（おなじ たね なら おなじ え）
//     --times 0,300,900                   とる 時間（ほんとうの ms）を じぶんで きめる
//     --ms 2000                           ふつうの anim の ながさ（大技は じぶんで わかる）
//     --hit 300                           ふつうの anim の ダメージの 時間（数字を 出す）
//
// ・public/ の ファイルを この どうぐの 中の 小さな サーバーで くばり、試しの ページは その場で つくる（public/ には 何も おかない）
// ・Playwright（/opt/node22/lib/node_modules/playwright）と chromium（/opt/pw-browsers）を つかう
// ・できた PNG の 場所は さいごに 出す（ふだんは family-rpg/fx-out/<anim>.png。fx-out/ は git に のせない）
import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const PW_PATHS = [process.env.PLAYWRIGHT_MODULE, '/opt/node22/lib/node_modules/playwright/index.mjs'].filter(Boolean);

function parseArgs(argv) {
  const a = { frames: 12, dir: 'ally', targets: 1, scale: 2, cols: 4, seed: 7, speed: 1, positional: [] };
  const flags = new Set(['crit', 'list', 'help', 'charges', 'repeat', 'dual']);
  for (let i = 0; i < argv.length; i++) {
    const s = argv[i];
    if (s.startsWith('--')) {
      const k = s.slice(2);
      if (flags.has(k)) {
        a[k] = true;
        if ((k === 'list' || k === 'charges') && argv[i + 1] && !argv[i + 1].startsWith('--')) a[k === 'list' ? 'listPrefix' : 'chargesTier'] = argv[++i];
      } else a[k] = argv[++i];
    } else a.positional.push(s);
  }
  for (const k of ['frames', 'targets', 'scale', 'cols', 'seed', 'speed', 'ms', 'hit']) if (a[k] !== undefined) a[k] = Number(a[k]);
  if (a.times) a.times = String(a.times).split(',').map(Number).filter(Number.isFinite);
  a.anim = a.positional[0];
  return a;
}

const USAGE = `つかいかた:
  node tools/fx-preview.mjs <anim> [--frames 12] [--dir ally|enemy|party] [--targets 1|3] [--out <png>]
  node tools/fx-preview.mjs --ability <技の id> [--dir enemy] [--targets 3]    … たたかいで 出る え
  node tools/fx-preview.mjs --group g1 [--out <dir>]                         … グループ ぜんぶ（fx-out/g1/<anim>.png。o1〜o6 も）
  node tools/fx-preview.mjs --all <prefix> [--out <dir>]
  node tools/fx-preview.mjs --list [prefix]
  node tools/fx-preview.mjs --charges [tier] [--dir enemy] [--out <png>]
  そのほか: --tier --charge --ability --repeat --dual --speed --element --crit --bg --scale --cols --seed --times --ms --hit`;

const MIME = { '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

// ───────────── ブラウザの 中で うごく ところ（toString して ページに うめこむ。そとの 変数は つかわない） ─────────────
function harnessMain(M) {
  const { Effects, battleBackground, BW, BH, monsterCanvas, isAx, axList, axTiming, axDef, actPose, glowSprite, CHARGE_KINDS, axAnimFor, axGroupList, axSkill, AX_SKILLS, ABILITIES, DUAL_TECHS, sigAnim, r27Anim, r27Hit } = M;
  const mulberry = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const SETS = { 1: ['goblin'], 2: ['wolf', 'goblin'], 3: ['wolf', 'goblin', 'armor_crab'], 4: ['wolf', 'goblin', 'armor_crab', 'crow'], 5: ['koumorin', 'wolf', 'goblin', 'armor_crab', 'crow'] };
  const PARTY_COLS = ['#e85a5a', '#5a8ae8', '#5ac878', '#e8b84a'];
  function enemyLayout(species) {
    const sprites = species.map((sp) => {
      const img = monsterCanvas(sp, 0);
      const r = img.res || 1;
      return { sp, img, iw: img.width / r, ih: img.height / r };
    });
    let scale = 1;
    const totalW = () => sprites.reduce((s, x) => s + x.iw * scale + 6, 0);
    while (totalW() > BW - 12 && scale > 0.55) scale -= 0.05;
    let x = (BW - totalW()) / 2 + 3;
    return sprites.map(({ sp, img, iw, ih }) => {
      const w = iw * scale, h = ih * scale;
      const out = { sp, img, x, y: 124 - h, w, h, flash: 0, act: null };
      x += w + 6;
      return out;
    });
  }
  const center = (m) => ({ x: m.x + m.w / 2, y: m.y + m.h / 2, w: m.w, h: m.h, foot: m.y + m.h });
  const allyPt = (i, n = 4) => ({ x: BW / 2 + (i - (n - 1) / 2) * Math.min(58, (BW * 0.8) / n), y: BH - 22 });
  const whiteCache = new Map();
  function white(img, color) {
    const key = color;
    let m = whiteCache.get(img);
    if (!m) { m = {}; whiteCache.set(img, m); }
    if (m[key]) return m[key];
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    m[key] = c;
    return c;
  }

  function run(cfg) {
    const R = cfg.scale || 2;
    const speed = Math.max(0.25, Math.min(4, cfg.speed || 1));
    const fromAlly = cfg.dir !== 'enemy';
    // party … 味方が 味方に かける（回復・強化）。的は 味方の いち
    const toAllies = cfg.dir === 'enemy' || cfg.dir === 'party';
    const n = Math.max(1, Math.min(toAllies ? 4 : 5, cfg.targets || 1));
    const ax = isAx(cfg.anim);
    const errors = [];
    const sim = (capture) => {
      Math.random = mulberry(cfg.seed ?? 7);
      const enemies = enemyLayout(SETS[!toAllies ? n : n >= 3 ? 3 : 1]);
      const party = [0, 1, 2, 3].map((i) => ({ i, ...allyPt(i), col: PARTY_COLS[i], glow: 0 }));
      const actorAlly = party[1];
      const actorEnemy = enemies[Math.floor(enemies.length / 2)];
      const targets = !toAllies ? enemies.map(center) : (n === 1 ? [party[1]] : party.slice(0, n)).map((p) => ({ x: p.x, y: p.y }));
      const from = fromAlly ? { x: actorAlly.x, y: actorAlly.y } : center(actorEnemy);
      const fx = new Effects();
      fx.tempo = speed;
      const sfx = [];
      let now = 0;
      const timing = ax ? axTiming(cfg.anim, { tempo: speed, ability: cfg.ability, tier: cfg.tier, chargeKind: cfg.charge, targets: targets.length, crit: !!cfg.crit, repeat: !!cfg.repeat, dual: !!cfg.dual }) : null;
      // battle.js と おなじ: 敵が ためる 間は うごき 'buff'
      if (!fromAlly && timing && timing.charge) actorEnemy.act = { kind: 'buff', age: 0, dur: timing.charge + 120, color: '#ffd66b' };
      if (fromAlly) actorAlly.glow = 1;
      try {
        fx.play(cfg.anim, targets, cfg.element || null, {
          crit: !!cfg.crit, fromAlly, from, ability: cfg.ability || undefined, tier: cfg.tier || undefined, chargeKind: cfg.charge || undefined,
          repeat: !!cfg.repeat, dual: !!cfg.dual, toParty: cfg.dir === 'enemy',
          sfx: (id) => sfx.push([Math.round(now), id]), actorImg: fromAlly ? null : actorEnemy.img,
        });
      } catch (e) { errors.push(String(e && e.stack || e)); }
      const hitAt = timing ? timing.hitReal : (cfg.hit ? cfg.hit / speed : null);
      const out = { fx, enemies, party, targets, sfx, timing, hitAt, bgId: cfg.bg, maxParts: 0, end: 0, cells: [] };
      const times = capture ? capture.slice() : null;
      const cap = capture ? Math.max(...capture) : 6000;
      const minEnd = timing ? timing.totalReal : 300;
      let ti = 0;
      const dt = 16;
      for (now = 0; now <= cap + 0.5; now += dt) {
        while (times && ti < times.length && times[ti] <= now + 0.5) {
          out.cells.push({ t: times[ti], canvas: drawScene(out, now, R, fromAlly, actorAlly) });
          ti++;
        }
        if (!capture && now > minEnd && !fx.busy) break;
        try { fx.update(dt); } catch (e) { errors.push(String(e && e.stack || e)); break; }
        for (const e of enemies) {
          if (e.act) { e.act.age += dt * speed; if (e.act.age >= e.act.dur) e.act = null; }
          if (e.flash > 0) e.flash -= dt;
        }
        if (hitAt !== null && now < hitAt && now + dt >= hitAt && !toAllies) for (const e of enemies) e.flash = 320;
        out.maxParts = Math.max(out.maxParts, fx.parts.length);
      }
      out.end = Math.min(now, cap);
      return out;
    };
    // 1かいめ: ながさを はかる。2かいめ: おなじ たねで え を とる
    const dry = sim(null);
    let dur = cfg.ms ? cfg.ms : Math.min(6000, Math.max(dry.end, dry.timing ? dry.timing.totalReal : 0));
    dur = Math.ceil(dur / 16) * 16;
    const frames = Math.max(1, cfg.frames || 12);
    let times = cfg.times && cfg.times.length ? cfg.times.slice() : Array.from({ length: frames }, (_, i) => Math.round(frames === 1 ? dur / 2 : (i * dur) / (frames - 1)));
    const keys = {};
    if (dry.timing && !(cfg.times && cfg.times.length) && frames >= 4) {
      // ためおわり（はなつ）と あたる しゅんかんを かならず 入れる
      for (const [name, t] of [['RELEASE', dry.timing.chargeReal], ['HIT', dry.timing.hitReal]]) {
        if (!(t > 0)) continue;
        let best = 1, bd = Infinity;
        times.forEach((x, i) => { if (i > 0 && i < times.length - 1 && !Object.values(keys).includes(i) && Math.abs(x - t) < bd) { bd = Math.abs(x - t); best = i; } });
        times[best] = t; keys[name] = best;
      }
      times = times.map((t) => Math.round(t / 16) * 16);
    }
    if (cfg.chargeFrac) times = cfg.chargeFrac.map((f) => Math.round((dry.timing ? dry.timing.chargeReal : dur) * f / 16) * 16);
    const order = times.map((t, i) => [t, i]).sort((a, b) => a[0] - b[0]);
    const run2 = sim(order.map(([t]) => t));
    const cells = [];
    order.forEach(([, i], k) => { cells[i] = run2.cells[k]; });
    if (cfg.cellsOnly) return { cells, times, timing: run2.timing, errors };
    const sheet = compose(cfg, cells, times, run2, dur, R, keys);
    return {
      png: sheet.toDataURL('image/png'),
      info: { anim: cfg.anim, ax, timing: run2.timing, dur, maxParts: Math.max(dry.maxParts, run2.maxParts), sfx: run2.sfx, errors, frames: times },
    };
  }

  function drawScene(S, now, R, fromAlly, actorAlly) {
    const c = document.createElement('canvas');
    c.width = BW * R; c.height = BH * R;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    const so = S.fx.shakeOffset;
    x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    x.setTransform(R, 0, 0, R, so.x * R, so.y * R);
    if (!S.bg) S.bg = battleBackground(S.bgId || 'grass');
    x.drawImage(S.bg, 0, 0, BW, BH);
    for (const m of S.enemies) {
      let dx = 0, dy = 0, sx = 1, sy = 1;
      const P = m.act ? actPose(m.act) : null;
      if (P) { dx += P.dx; dy += P.dy; sx = P.sx; sy = P.sy; }
      if (m.flash > 0) dx += Math.round(Math.sin(m.flash / 20) * 2);
      const w = m.w * sx, h = m.h * sy;
      const px = m.x + m.w / 2 + dx - w / 2, py = m.y + m.h + dy - h;
      if (P && P.aura && P.auraA > 0) {
        const r = Math.max(w, h) * 0.8;
        x.globalCompositeOperation = 'lighter';
        x.globalAlpha = P.auraA * 0.6;
        x.drawImage(glowSprite(P.aura), px + w / 2 - r, py + h / 2 - r, r * 2, r * 2);
        x.globalCompositeOperation = 'source-over';
        x.globalAlpha = P.auraA * 0.8;
        x.drawImage(white(m.img, P.aura), px - 1.5, py - 1.5, w + 3, h + 3);
      }
      x.globalAlpha = 1;
      x.imageSmoothingEnabled = (m.img.res || 1) > R * 1.01;
      x.drawImage(m.flash > 0 && Math.floor(m.flash / 60) % 2 === 0 ? white(m.img, '#ffffff') : m.img, px, py, w, h);
      x.imageSmoothingEnabled = false;
    }
    S.fx.draw(x);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    // 味方の いち（ほんとうの たたかいでは え は ない。まどの じゅんばんの いち）
    for (const p of S.party) {
      const act = p === actorAlly && fromAlly;
      x.globalAlpha = 0.75;
      x.fillStyle = act ? '#ffffff' : p.col;
      x.fillRect(p.x - 9, BH - 4, 18, 4);
      x.globalAlpha = 1;
      x.fillStyle = p.col;
      x.fillRect(p.x - 8, BH - 3, 16, 2);
    }
    // ダメージの 数（battle.js では あたる 時間に 出る）
    if (S.hitAt !== null && now >= S.hitAt && now < S.hitAt + 900) {
      const u = (now - S.hitAt) / 900;
      x.font = 'bold 9px monospace';
      x.textAlign = 'center';
      for (const t of S.targets) {
        const ty = t.y - 10 - u * 8;
        x.lineWidth = 2; x.strokeStyle = '#000'; x.strokeText('123', t.x, ty);
        x.fillStyle = '#ffffff'; x.fillText('123', t.x, ty);
      }
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
    return c;
  }

  function compose(cfg, cells, times, S, dur, R, keys) {
    const cw = BW * R, ch = BH * R;
    const cols = Math.max(1, Math.min(cfg.cols || 4, cells.length));
    const rows = Math.ceil(cells.length / cols);
    const pad = 8, lab = 18, head = 58;
    const W = cols * cw + (cols + 1) * pad, H = head + rows * (ch + lab + pad) + pad;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#16161e'; x.fillRect(0, 0, W, H);
    const T = S.timing;
    x.fillStyle = '#ffffff';
    x.font = 'bold 16px monospace';
    x.fillText(`${cfg.anim}`, pad, 20);
    x.font = '12px monospace';
    x.fillStyle = '#c8c8d8';
    const def = T ? axDef(cfg.anim) : null;
    const desc = T
      ? `tier=${T.tier} charge=${T.kind || '-'}${cfg.repeat ? ' repeat' : ''}${cfg.dual ? ' dual' : ''}  dir=${cfg.dir || 'ally'} targets=${S.targets.length} speed=${cfg.speed || 1}${cfg.ability ? ` ability=${cfg.ability}` : ''}${cfg.crit ? ' crit' : ''}  | charge ${T.chargeReal}ms  hit ${T.hitReal}ms  total ${T.totalReal}ms (real)${def && def.group ? `  group=${def.group}` : ''}`
      : `(not an ax anim) dir=${cfg.dir || 'ally'} targets=${S.targets.length} speed=${cfg.speed || 1}  length ${dur}ms`;
    x.fillText(desc, pad, 38);
    // 時間の おび（ためる・はなつ・あたる・とった こま）
    const bx = pad, bw = W - pad * 2, by = 46, bh = 6;
    x.fillStyle = '#2a2a3a'; x.fillRect(bx, by, bw, bh);
    const X = (t) => bx + (Math.min(dur, Math.max(0, t)) / dur) * bw;
    if (T) {
      x.fillStyle = '#4a7aff'; x.fillRect(bx, by, X(T.chargeReal) - bx, bh);
      x.fillStyle = '#ffb04a'; x.fillRect(X(T.chargeReal), by, X(T.totalReal) - X(T.chargeReal), bh);
      x.fillStyle = '#ff3a3a'; x.fillRect(X(T.hitReal) - 1, by - 3, 3, bh + 6);
    } else if (S.hitAt !== null) { x.fillStyle = '#ff3a3a'; x.fillRect(X(S.hitAt) - 1, by - 3, 3, bh + 6); }
    x.fillStyle = '#ffffff';
    for (const t of times) x.fillRect(X(t), by + bh, 1, 4);
    cells.forEach((cell, i) => {
      const cx = pad + (i % cols) * (cw + pad), cy = head + Math.floor(i / cols) * (ch + lab + pad);
      x.drawImage(cell.canvas, cx, cy);
      let tag = '';
      if (T) {
        if (keys.RELEASE === i) tag = 'RELEASE';
        else if (keys.HIT === i) tag = 'HIT (numbers)';
        else if (cell.t < T.chargeReal) tag = 'charge';
        else if (cell.t < T.hitReal) tag = 'release';
        else tag = 'after hit';
      }
      x.fillStyle = tag === 'HIT (numbers)' ? '#ff7a7a' : tag === 'RELEASE' ? '#ffd66b' : tag === 'charge' ? '#8ab0ff' : '#c8c8d8';
      x.font = '12px monospace';
      x.fillText(`#${i + 1}  t=${Math.round(cell.t)}ms  ${tag}`, cx, cy + ch + 13);
    });
    return c;
  }

  // ためかた ぜんぶ（1しゅるい 1行。ためる 時間の 25・50・75・97%）
  function runCharges(cfg) {
    const R = cfg.scale || 1;
    const fr = [0.25, 0.5, 0.75, 0.97];
    const rows = CHARGE_KINDS.map((kind) => ({ kind, ...run({ ...cfg, charge: kind, chargeFrac: fr, cellsOnly: true, scale: R }) }));
    const cw = BW * R, ch = BH * R, pad = 6, labW = 90, head = 26;
    const c = document.createElement('canvas');
    c.width = labW + fr.length * (cw + pad) + pad;
    c.height = head + rows.length * (ch + pad) + pad;
    const x = c.getContext('2d');
    x.fillStyle = '#16161e'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#ffffff'; x.font = 'bold 14px monospace';
    x.fillText(`charges  tier=${rows[0].timing ? rows[0].timing.tier : '?'}  dir=${cfg.dir || 'ally'}  (25% / 50% / 75% / 97% of charge)`, pad, 18);
    const errors = [];
    rows.forEach((r, i) => {
      const y = head + i * (ch + pad);
      x.fillStyle = '#c8c8d8'; x.font = 'bold 13px monospace';
      x.fillText(r.kind, pad, y + ch / 2);
      r.cells.forEach((cell, j) => x.drawImage(cell.canvas, labW + j * (cw + pad), y));
      errors.push(...r.errors);
    });
    return { png: c.toDataURL('image/png'), info: { errors } };
  }

  window.fxpRun = (cfg) => run(cfg);
  window.fxpCharges = (cfg) => runCharges(cfg);
  window.fxpList = (prefix) => axList(prefix || '');
  // 味方に かける 技（データの target）
  const ALLY_T = new Set(['ally', 'allies', 'self', 'deadAlly', 'deadAllies']);
  // 合体技の id（DUAL_TECHS に あって ふつうの 技で ない）
  const isDualId = (id) => !!DUAL_TECHS[id] && !ABILITIES[id];
  // 技の id → たたかいで 出る anim（battle.js と おなじ じゅん: 大技の つなぎ → 看板の 技 → 作り直しの 上書き → データの anim）
  window.fxpResolve = (key) => {
    const id = String(key).replace(/@masc$/, '');
    const masc = String(key).endsWith('@masc');
    // 合体技か は 表で 見る（ダ天使の 技 dt_hane なども dt_ で はじまる）
    const dual = isDualId(id);
    const t = dual ? DUAL_TECHS[id] : ABILITIES[id];
    if (!t) return { error: `技 ${key} が ない` };
    const data = (masc && t.masc && t.masc.anim) || t.anim;
    const axA = axAnimFor(id, { masc });
    const s = axA ? axSkill(id, { masc }) : null;
    const anim = axA || (dual ? data : sigAnim(id) || r27Anim(id) || data);
    const party = ALLY_T.has(t.target) || (isAx(anim) && !!axDef(anim).party);
    return { anim, ability: s ? s.key : id, ax: isAx(anim), party, dual, hit: isAx(anim) ? null : r27Hit(anim, id), data, name: t.name };
  };
  // グループの 大技（1 anim に 1つ: いちばん はじめに つないだ 技で）
  window.fxpGroup = (g) => axGroupList(g).map((anim) => {
    const s = Object.values(AX_SKILLS).find((x) => x.anim === anim);
    return { anim, ability: s ? s.key : null, party: !!axDef(anim).party, dual: !!(s && isDualId(s.key.replace(/@masc$/, ''))) };
  });
  window.fxpReady = true;
}

const HARNESS_JS = `import { Effects, battleBackground, BW, BH, glowSprite } from '/js/client/render/battlefx.js';
import { monsterCanvas } from '/js/client/render/monsters.js';
import { isAx, axList, axTiming, axDef, axAnimFor, axGroupList } from '/js/client/render/axfx.js';
import { CHARGE_KINDS } from '/js/client/render/axcharge.js';
import { actPose } from '/js/client/render/enemyfx.js';
import { AX_SKILLS, axSkill } from '/js/shared/ax-time.js';
import { ABILITIES } from '/js/shared/data/abilities.js';
import { DUAL_TECHS } from '/js/shared/data/dual.js';
import { sigAnim } from '/js/client/render/battlefx-jobs4.js';
import { r27Anim, r27Hit } from '/js/client/render/battlefx-r27.js';
(${harnessMain.toString()})({ Effects, battleBackground, BW, BH, glowSprite, monsterCanvas, isAx, axList, axTiming, axDef, actPose, CHARGE_KINDS, axAnimFor, axGroupList, axSkill, AX_SKILLS, ABILITIES, DUAL_TECHS, sigAnim, r27Anim, r27Hit });
`;
const HARNESS_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>fx-preview</title></head><body style="margin:0;background:#111">
<script>window.addEventListener('error', (e) => { window.fxpError = String(e.message || e); });</script>
<script type="module" src="/__fxp/harness.js"></script></body></html>`;

function startServer() {
  const srv = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://x');
      if (u.pathname === '/__fxp/harness.html') return send(res, 200, MIME['.html'], HARNESS_HTML);
      if (u.pathname === '/__fxp/harness.js') return send(res, 200, MIME['.js'], HARNESS_JS);
      const p = path.normalize(path.join(PUB, decodeURIComponent(u.pathname)));
      if (!p.startsWith(PUB + path.sep)) return send(res, 403, 'text/plain', 'no');
      const st = await stat(p).catch(() => null);
      if (!st || !st.isFile()) return send(res, 404, 'text/plain', 'not found');
      send(res, 200, MIME[path.extname(p)] || 'application/octet-stream', await readFile(p));
    } catch (e) { send(res, 500, 'text/plain', String(e)); }
  });
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve(srv)));
}
function send(res, code, type, body) {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

async function loadPlaywright() {
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync('/opt/pw-browsers')) process.env.PLAYWRIGHT_BROWSERS_PATH = '/opt/pw-browsers';
  for (const p of PW_PATHS) {
    if (existsSync(p)) {
      const m = await import(pathToFileURL(p).href);
      return m.default || m;
    }
  }
  return import('playwright');
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.help || (!a.anim && !a.all && !a.list && !a.charges && !a.group && !a.ability)) {
    console.log(USAGE);
    process.exit(a.help ? 0 : 1);
  }
  const t0 = Date.now();
  const srv = await startServer();
  const port = srv.address().port;
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ headless: true });
  let failed = false;
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await page.goto(`http://127.0.0.1:${port}/__fxp/harness.html`);
    await page.waitForFunction(() => window.fxpReady === true || !!window.fxpError, null, { timeout: 30000 });
    const loadErr = await page.evaluate(() => window.fxpError || null);
    if (loadErr || !(await page.evaluate(() => window.fxpReady === true))) throw new Error(`ページが ひらけない: ${loadErr || consoleErrors.join('\n')}`);
    if (a.list) {
      const names = await page.evaluate((p) => window.fxpList(p), a.listPrefix || '');
      console.log(names.join('\n') || '(なし)');
      return;
    }
    if (a.charges) {
      const file = path.resolve(a.out || path.join(ROOT, 'fx-out', `charges-${a.chargesTier || 'super'}${a.dir === 'enemy' ? '-enemy' : ''}.png`));
      const res = await page.evaluate((c) => window.fxpCharges(c), { anim: 'ax_demo_orb', tier: a.chargesTier || 'super', dir: a.dir, targets: 1, scale: a.scale === 2 && !process.argv.includes('--scale') ? 1 : a.scale, seed: a.seed, speed: a.speed, bg: a.bg, frames: 4 });
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, Buffer.from(res.png.split(',')[1], 'base64'));
      console.log(`charges: ${file}`);
      for (const e of [...res.info.errors, ...consoleErrors]) { console.log(`  エラー: ${e}`); failed = true; }
      return;
    }
    // jobs … { anim, ability, dir, dual, hit }（1つ 1まい）
    let jobs = [];
    let outDir = null, outFile = null;
    const dirArg = process.argv.includes('--dir') ? a.dir : null;
    const sfx = `${a.dir === 'enemy' ? '-enemy' : a.dir === 'party' ? '-party' : ''}${a.targets > 1 ? `-x${a.targets}` : ''}${a.repeat ? '-repeat' : ''}`;
    if (a.group) {
      const list = await page.evaluate((g) => window.fxpGroup(g), a.group);
      if (!list.length) throw new Error(`グループ '${a.group}' の 大技が ない（render/axfx-${a.group}.js と shared/data/ax-time-${a.group}.js）`);
      jobs = list.map((x) => ({ anim: x.anim, ability: a.ability || x.ability || undefined, dir: dirArg || (x.party ? 'party' : 'ally'), dual: a.dual || x.dual }));
      outDir = path.resolve(a.out || path.join(ROOT, 'fx-out', a.group));
    } else if (a.all !== undefined) {
      const anims = await page.evaluate((p) => window.fxpList(p), a.all === true ? '' : a.all);
      if (!anims.length) throw new Error(`'${a.all}' で はじまる 大技が ない（--list で 見られる）`);
      jobs = anims.map((anim) => ({ anim, ability: a.ability, dir: a.dir, dual: a.dual }));
      outDir = path.resolve(a.out || path.join(ROOT, 'fx-out'));
    } else if (!a.anim && a.ability) {
      // 技の id から: たたかいで ほんとうに 出る え
      const r = await page.evaluate((k) => window.fxpResolve(k), a.ability);
      if (r.error) throw new Error(r.error);
      console.log(`${a.ability}（${r.name}）: ${r.ax ? '大技' : 'ふつうの anim'} ${r.anim}${r.anim !== r.data ? `（データの anim は ${r.data}）` : ''}${r.party ? ' … 味方に かける' : ''}`);
      jobs = [{ anim: r.anim, ability: r.ability, dir: dirArg || (r.party ? 'party' : 'ally'), dual: a.dual || r.dual, hit: a.hit ?? (r.hit || undefined) }];
      outFile = path.resolve(a.out || path.join(ROOT, 'fx-out', `ability-${a.ability.replace(/[^\w@-]/g, '_')}${sfx}.png`));
    } else {
      jobs = [{ anim: a.anim, ability: a.ability, dir: a.dir, dual: a.dual }];
      outFile = path.resolve(a.out || path.join(ROOT, 'fx-out', `${a.anim}${sfx}.png`));
    }
    for (const job of jobs) {
      const { anim } = job;
      const cfg = { anim, frames: a.frames, dir: job.dir, targets: a.targets, tier: a.tier, charge: a.charge, ability: job.ability, repeat: !!a.repeat, dual: !!job.dual, speed: a.speed, element: a.element, crit: !!a.crit, scale: a.scale, cols: a.cols, seed: a.seed, times: a.times, ms: a.ms, hit: job.hit ?? a.hit, bg: a.bg };
      const before = consoleErrors.length;
      const res = await page.evaluate((c) => {
        const r = window.fxpRun(c);
        return r;
      }, cfg);
      const file = outFile || path.join(outDir, `${anim}.png`);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, Buffer.from(res.png.split(',')[1], 'base64'));
      const errs = [...res.info.errors, ...consoleErrors.slice(before)];
      if (!res.info.ax && /^(ax|ox)_/.test(anim)) errs.push(`${anim} は とうろく されて いない（axfx.js の useAxGroup を わすれて いない？ --list で 見られる）`);
      if (errs.length) failed = true;
      const T = res.info.timing;
      console.log(`${anim}: ${file}`);
      console.log(T ? `  tier=${T.tier} charge=${T.kind || '-'} | charge ${T.chargeReal}ms  hit ${T.hitReal}ms  total ${T.totalReal}ms  | 最大 ${res.info.maxParts}つぶ | 音 ${res.info.sfx.map(([t, id]) => `${id}@${t}`).join(' ') || '-'}`
        : `  （大技ではない anim）ながさ ${res.info.dur}ms | 最大 ${res.info.maxParts}つぶ`);
      for (const e of errs) console.log(`  エラー: ${e}`);
    }
  } finally {
    await browser.close();
    srv.close();
  }
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  if (failed) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });

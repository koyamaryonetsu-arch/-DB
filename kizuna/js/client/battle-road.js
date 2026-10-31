// 第2部 第6章 Step 3・4 の 星くいのよる鳥・ペンデュラと 古道の 魔物の がめん（client/battle-ch6.js から よぶ。サーバーがわは shared/battle-road.js）
// ・星くいのよる鳥: 右よこに 道しるべの 星（のこりの 数。ねらっている 星は 赤い わで ちかちか）
// ・ペンデュラ: 左上に 時のふりこの 目もり（左はしが 青＝みんなが 速い・右はしが 赤＝魔女が 速い。ふりこが なめらかに ゆれる）。
//   時止めで ねらわれた 人・止まった 人の まどは 光る
// ・前ぶれ・目が くらんだ・星を 食べた・ふりこが 左右へ・時止め・大ふりこの バナー（ふつうの「大技が来る！」は 出さない … ROAD_OWN_TELE）
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音
// 第2部 第6章 Step 6: ゼンマイが 家来の しかけを 使う 間・時のまぼろしも おなじ 絵と バナー（kindOf … kindAs・base・species。battle-tokei6.js）
import { kindOf } from './battle-tokei6.js?v=a5c15ff5e061';
const EATER = 'star_eater';
const PENDULA = 'pendula';
const AIM = 'm6_se_aim';
const DARK_CHARGE = 'm6_se_dark_charge';
const STOP_CHARGE = 'm6_pd_stop_charge';
const BIG_CHARGE = 'm6_pd_big_charge';
// 前ぶれの バナーを 自分で 出す 魔物（client/battle-ch6.js の CH6_OWN_TELE に まぜる）
export const ROAD_OWN_TELE = [EATER, PENDULA];

export const ROAD_SCREEN_ANIMS = ['a6r_dark', 'a6r_big', 'a6r_stop', 'a6r_warp', 'a6r_tick'];
export const ROAD_ALLY_FX = {
  a6r_fang: 'claw', a6r_pack: 'claw', a6r_horn: 'claw', a6r_rush: 'quake', a6r_dig: 'claw', a6r_dust: 'dark', a6r_flash: 'dark', a6r_warp: 'down',
  a6r_pinch: 'claw', a6r_foam: 'ice', a6r_talon: 'claw', a6r_eye: 'dark', a6r_song: 'down', a6r_twin: 'bolt', a6r_spark: 'up', a6r_tail: 'claw',
  a6r_breath: 'fire', a6r_roar: 'down', a6r_peck: 'claw', a6r_nwing: 'wind', a6r_feather: 'dark', a6r_cry: 'down', a6r_dark: 'quake',
  a6r_shot: 'claw', a6r_hex: 'dark', a6r_tick: 'down', a6r_twist: 'claw', a6r_stop: 'ice', a6r_big: 'quake',
};
export const ROAD_SFX = {
  a6r_fang: 'hit', a6r_pack: 'hit', a6r_howl: 'buff', a6r_horn: 'smash', a6r_rush: 'smash', a6r_wool: 'heal', a6r_dig: 'hit', a6r_dust: 'sparkle', a6r_pile: 'buff',
  a6r_flash: 'warn', a6r_warp: 'warn', a6r_haste: 'buff', a6r_pinch: 'hit', a6r_foam: 'ice', a6r_shell: 'buff', a6r_talon: 'hit', a6r_eye: 'warn', a6r_song: 'warn',
  a6r_twin: 'sparkle', a6r_spark: 'sparkle', a6r_swap: 'heal', a6r_tail: 'smash', a6r_breath: 'sparkle', a6r_roar: 'warn', a6r_peck: 'smash', a6r_nwing: 'wind',
  a6r_feather: 'sparkle', a6r_cry: 'warn', a6r_aim: 'warn', a6r_eat: 'heal', a6r_dark_charge: 'warn', a6r_dark: 'blast', a6r_shot: 'smash', a6r_hex: 'warn',
  a6r_tick: 'warn', a6r_twist: 'hit', a6r_stop_charge: 'warn', a6r_stop: 'ice', a6r_big_charge: 'warn', a6r_big: 'blast',
};

// 4つの 光の 星（ドット）
function dotStar(x, cx, cy, s, c) {
  x.fillStyle = c;
  x.fillRect(Math.round(cx) - s, Math.round(cy), s * 2 + 1, 1);
  x.fillRect(Math.round(cx), Math.round(cy) - s, 1, s * 2 + 1);
  x.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 3, 3);
}

// ───────────── たたかいの え（client/battle-ch6.js の ch6Draw から）─────────────
export function roadDraw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  const T = scene.time || 0;
  // 星くいのよる鳥: 道しるべの 星（右よこ。上から）
  if (kindOf(c) === EATER && c.stars !== undefined) {
    const max = c.starsMax || 3;
    const bx = Math.min(248, px + w + 4);
    for (let i = 0; i < max; i++) {
      const by = py + 10 + i * 14;
      const on = i < c.stars;
      const aimed = c.starAim && i === c.stars - 1;
      // うしろの くらい まる（背景の 星と まざらない）
      x.globalAlpha = base * 0.7;
      x.fillStyle = '#0a0a24';
      x.beginPath();
      x.arc(bx + 0.5, by + 0.5, 5.5, 0, Math.PI * 2);
      x.fill();
      x.globalAlpha = base * (on ? (aimed ? 0.6 + Math.sin(T / 80) * 0.4 : 0.95) : 0.3);
      dotStar(x, bx, by, on ? 3 : 2, on ? '#fff6c0' : '#5a5aa8');
      if (aimed) {
        x.globalAlpha = base * (0.5 + Math.sin(T / 80) * 0.4);
        x.strokeStyle = '#ff6a4a';
        x.lineWidth = 1;
        x.beginPath();
        x.arc(bx + 0.5, by + 0.5, 6, 0, Math.PI * 2);
        x.stroke();
      }
    }
    x.globalAlpha = base;
  }
  // ペンデュラ: 時のふりこの 目もり（左上）
  if (kindOf(c) === PENDULA && c.pendPos !== undefined) {
    const reach = c.pendReach || 3;
    const gx = Math.max(30, px - 22), gy = Math.max(6, py + 2), r = 26, span = 0.9;
    // 目もりの わ（左 … 青・右 … 赤・まん中 … 白）
    for (const [a0, a1, col] of [[Math.PI / 2, Math.PI / 2 + span, '#5ab8ff'], [Math.PI / 2 - span, Math.PI / 2, '#ff6a4a']]) {
      x.globalAlpha = base * 0.45;
      x.strokeStyle = col;
      x.lineWidth = 3;
      x.beginPath();
      x.arc(gx, gy, r, a0, a1);
      x.stroke();
    }
    for (let i = -reach; i <= reach; i++) {
      const a = Math.PI / 2 - (i / reach) * span;
      const tx = gx + Math.cos(a) * r, ty = gy + Math.sin(a) * r;
      x.globalAlpha = base * (i === c.pendPos ? 1 : 0.6);
      x.fillStyle = i < 0 ? '#5ab8ff' : i > 0 ? '#ff6a4a' : '#ffffff';
      const sz = i === 0 || Math.abs(i) === reach ? 4 : 3;
      x.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, sz, sz);
    }
    // ふりこ（なめらかに ゆれる）
    const want = -(c.pendPos / reach) * span;
    const st = (scene.roadPend = scene.roadPend || { a: want, t: T });
    const dt = Math.max(0, Math.min(200, T - st.t));
    st.a += (want - st.a) * Math.min(1, dt / 220);
    st.t = T;
    const a = Math.PI / 2 + st.a;
    const bx = gx + Math.cos(a) * (r - 5), by = gy + Math.sin(a) * (r - 5);
    x.globalAlpha = base;
    x.strokeStyle = '#d8b040';
    x.lineWidth = 1.5;
    x.beginPath();
    x.moveTo(gx, gy);
    x.lineTo(bx, by);
    x.stroke();
    x.fillStyle = '#d8b040';
    x.beginPath();
    x.arc(gx, gy, 1.5, 0, Math.PI * 2);
    x.fill();
    const side = c.pendPos < 0 ? '#5ab8ff' : c.pendPos > 0 ? '#ff6a4a' : '#ffffff';
    x.fillStyle = side;
    x.beginPath();
    x.arc(bx, by, 5, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#fff0a0';
    x.beginPath();
    x.arc(bx, by, 2.2, 0, Math.PI * 2);
    x.fill();
    x.globalAlpha = base;
  }
}

// 時止めで ねらわれた 人・止まった 人の まど
function markWindows(scene) {
  const p = scene.enemies?.().find((e) => kindOf(e) === PENDULA);
  if (!p || !scene.statusBoxes) return;
  const frozen = new Set(p.alive ? p.pendFrozen || [] : []);
  const aim = p.alive ? p.pendTarget : null;
  for (const a of scene.allies?.() || []) {
    const box = scene.statusBoxes.get(a.id)?.box;
    if (!box) continue;
    box.style.boxShadow = frozen.has(a.id) ? '0 0 0 2px #000, inset 0 0 14px rgba(122,240,255,0.95)' : aim === a.id ? '0 0 0 2px #000, inset 0 0 12px rgba(255,90,74,0.95)' : '';
    box.style.filter = frozen.has(a.id) ? 'grayscale(0.7)' : '';
  }
}

// ───────────── イベントを 見せる とき（client/battle-ch6.js の ch6Present から）─────────────
export function roadPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const nameOf = (id) => scene.c?.get?.(id)?.name || '';
  // 星くいのよる鳥
  if (fx.type === 'telegraph' && kindOf(actor) === EATER) {
    g.audio.sfx('warn');
    if (ev.ability === DARK_CHARGE) scene.banner('！よぞらのはばたきの前ぶれ！身を守れ！', 'danger');
    else scene.banner('！よる鳥が星をねらっている！光を当てて、目をくらませろ！', 'danger');
  }
  if (ev.seStun) {
    g.audio.sfx('sparkle');
    scene.banner('光で目がくらんだ！星を守った！', 'combo');
  }
  if (ev.seEat) scene.banner(ev.seEat.left > 0 ? `星が食べられた…！（のこり${ev.seEat.left}つ）` : '星が全部食べられた…！あたりが、まっくらに…！', 'danger');
  // ペンデュラ
  if (ev.pdSwing) {
    const side = ev.pdSwing.side;
    if (scene.roadSide !== undefined && side !== scene.roadSide && side >= 0) {
      if (side === 0) scene.banner('ふりこが左へ！みんなの動きがはやくなった！', 'combo');
      else scene.banner('ふりこが右へ…！魔女が速い！守りをかためよう', 'danger');
    }
    scene.roadSide = side;
  }
  if (fx.type === 'telegraph' && kindOf(actor) === PENDULA) {
    g.audio.sfx('warn');
    if (ev.ability === BIG_CHARGE) scene.banner('！大ふりこの前ぶれ！身を守れ！', 'danger');
    else if (ev.ability === STOP_CHARGE) scene.banner(`！時止めの前ぶれ！${ev.pdAim?.name || 'ねらわれた人'}は身を守れ！`, 'danger');
  }
  if (ev.pdStop) {
    g.audio.sfx('warn');
    scene.banner(`${nameOf(ev.pdStop)}の時が止まった…！`, 'danger');
  }
  if (ev.pdGuard) {
    g.audio.sfx('sparkle');
    scene.banner('身を守って、時止めをはねかえした！', 'combo');
  }
  if (ev.pdFree?.length) scene.banner(`${ev.pdFree.map(nameOf).filter(Boolean).join('と')}の時が、また動き出した！`, 'combo');
  if (ev.ability === 'm6_pd_big' || ev.ability === 'm6_se_dark') scene.shake?.(500, 6);
  markWindows(scene);
}

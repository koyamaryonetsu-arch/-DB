// 第2部 第6章 Step 6 の ゼンマイ・時計塔 6〜10階の 魔物・リオンの けいこ・時のまぼろしの がめん
// （client/battle-ch6.js から よぶ。サーバーがわは shared/battle-tokei6.js）
// ・kindOf … ゼンマイが 家来の しかけを 使う 間（kindAs）・時のまぼろし（base）は、家来・もとの ボスの 目もりと バナーを そのまま 出す
// ・ゼンマイ 1だんめ: 頭の 上に しかけの じゅんばん（砂時計・歯車・ふりこ・かねの 4つの しるし。今の しかけが 光る）
// ・ゼンマイ 2だんめ: 左上に 時計の 文字ばん（針が 今の 時。10時から 12時は 赤い 帯。針が 10時を こえると 赤く ゆれる）
// ・歯車: 上に 弱点の しるし（氷の 結晶・雷・光の 星）
// ・リオンの けいこ: 人の 絵（リオンの 見た目。tokei6Sprite）
// ・バナー: しかけが かわった・2だんめ・針が 10時／11時・歯車を こわした・大ほうかい・歯車が また 回り出した
import { heroCanvas } from './render/hero.js';
import { equipKey } from './render/chars.js';
import { ZENMAI, TOKI_PHANTOM_BASES, tokiPhantomId, RION_SPARS } from '../shared/data/monsters-tokei6.js';

export const kindOf = (c) => c?.kindAs || c?.base || c?.species;

// 前ぶれの バナーを 自分で 出す（client/battle-ch6.js の CH6_OWN_TELE に まぜる）
export const TOKEI6_OWN_TELE = [ZENMAI, ...TOKI_PHANTOM_BASES.map(tokiPhantomId), ...RION_SPARS];

export const TOKEI6_SCREEN_ANIMS = ['a6z_collapse', 'a6z_spring', 'a6z_shadow', 'a6z_bell', 'a6z_alarm'];
export const TOKEI6_ALLY_FX = {
  a6z_touch: 'ice', a6z_wail: 'dark', a6z_steal: 'down', a6z_chime: 'wind', a6z_ring: 'dark', a6z_tick: 'claw', a6z_rain: 'claw',
  a6z_pound: 'quake', a6z_alarm: 'quake', a6z_whip: 'claw', a6z_vine: 'claw', a6z_spore: 'dark', a6z_key: 'claw', a6z_mischief: 'dark',
  a6z_cogslash: 'claw', a6z_rattle: 'claw', a6z_hand: 'claw', a6z_spring: 'claw', a6z_shadow: 'dark', a6z_slow: 'down', a6z_twin: 'claw',
  a6z_collapse: 'quake', a6z_bell: 'quake', a6s_slash: 'claw', a6s_burst: 'up',
};
export const TOKEI6_SFX = {
  a6z_touch: 'ice', a6z_wail: 'warn', a6z_steal: 'warn', a6z_chime: 'sparkle', a6z_kind: 'heal', a6z_ring: 'warn', a6z_tick: 'hit', a6z_rain: 'hit',
  a6z_haste: 'buff', a6z_pound: 'smash', a6z_alarm: 'blast', a6z_guard: 'buff', a6z_whip: 'hit', a6z_vine: 'hit', a6z_spore: 'warn',
  a6z_key: 'smash', a6z_mischief: 'warn', a6z_windup: 'buff', a6z_cogslash: 'smash', a6z_rattle: 'hit',
  a6z_hand: 'smash', a6z_spring: 'hit', a6z_shadow: 'warn', a6z_slow: 'warn', a6z_twin: 'smash', a6z_collapse: 'blast', a6z_bell: 'blast',
  a6s_slash: 'hit', a6s_guard: 'buff', a6s_charge: 'warn', a6s_burst: 'blast',
};

// ───────────── リオンの けいこ: 人の 絵（client/battle.js の computeLayout）─────────────
const HERO_RES = 10;
const SHOW_RES = 4;
const cache = new Map();
export function tokei6Sprite(c) {
  if (!c?.person || !c.look) return null;
  const job = c.job || 'sword_master';
  const key = `${JSON.stringify(c.look)}|${job}`;
  let img = cache.get(key);
  if (!img) {
    img = heroCanvas(c.look, job, equipKey(undefined, job), 'down', 0, HERO_RES);
    img.res = SHOW_RES;
    cache.set(key, img);
  }
  return img;
}

// ───────────── 小さな しるし ─────────────
const STAGE_ICON = { sand: '#f0c870', gear: '#7ad0ff', pend: '#c8a0ff', bell: '#f0c040' };
const ORDER = ['sand', 'gear', 'pend', 'bell'];
function stageMark(x, k, cx, cy, s, col) {
  x.fillStyle = col;
  x.strokeStyle = col;
  x.lineWidth = 1.2;
  if (k === 'sand') {
    // 砂時計
    x.beginPath();
    x.moveTo(cx - s, cy - s); x.lineTo(cx + s, cy - s); x.lineTo(cx - s, cy + s); x.lineTo(cx + s, cy + s); x.closePath();
    x.fill();
  } else if (k === 'gear') {
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      x.rect(cx + Math.cos(a) * s - 0.8, cy + Math.sin(a) * s - 0.8, 1.6, 1.6);
    }
    x.fill();
    x.beginPath();
    x.arc(cx, cy, s * 0.7, 0, Math.PI * 2);
    x.fill();
  } else if (k === 'pend') {
    x.beginPath();
    x.moveTo(cx, cy - s); x.lineTo(cx + s * 0.4, cy + s * 0.5);
    x.stroke();
    x.beginPath();
    x.arc(cx + s * 0.45, cy + s * 0.6, s * 0.45, 0, Math.PI * 2);
    x.fill();
  } else {
    x.beginPath();
    x.moveTo(cx - s * 0.5, cy - s * 0.6); x.quadraticCurveTo(cx, cy - s * 1.2, cx + s * 0.5, cy - s * 0.6);
    x.lineTo(cx + s * 0.9, cy + s * 0.6); x.lineTo(cx - s * 0.9, cy + s * 0.6); x.closePath();
    x.fill();
  }
}
// 弱点の しるし（氷・雷・光）
function weakMark(x, el, cx, cy, T, base) {
  x.globalAlpha = base * (0.75 + Math.sin(T / 160) * 0.25);
  x.fillStyle = 'rgba(20,14,8,0.7)';
  x.beginPath();
  x.arc(cx, cy, 6, 0, Math.PI * 2);
  x.fill();
  x.lineWidth = 1.3;
  if (el === 'ice') {
    x.strokeStyle = '#a8e8ff';
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      x.beginPath();
      x.moveTo(cx - Math.cos(a) * 4, cy - Math.sin(a) * 4);
      x.lineTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4);
      x.stroke();
    }
  } else if (el === 'bolt') {
    x.fillStyle = '#fff070';
    x.beginPath();
    x.moveTo(cx + 1, cy - 4.5); x.lineTo(cx - 3, cy + 0.5); x.lineTo(cx, cy + 0.5); x.lineTo(cx - 1, cy + 4.5); x.lineTo(cx + 3, cy - 0.5); x.lineTo(cx, cy - 0.5);
    x.closePath();
    x.fill();
  } else {
    x.fillStyle = '#fff6c0';
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? 1.6 : 4.5;
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      x[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    x.closePath();
    x.fill();
  }
  x.globalAlpha = base;
}

// 時計の 文字ばん（cx・cy … まん中・r … 半径）。hand … 今の 時（1〜12）
export function drawDial(x, cx, cy, r, hand, max, warn, T, base) {
  const ang = (h) => (h / 12) * Math.PI * 2 - Math.PI / 2;
  const hot = hand >= warn;
  // うしろの くらい まる
  x.globalAlpha = base * 0.8;
  x.fillStyle = '#140c06';
  x.beginPath();
  x.arc(cx, cy, r + 3, 0, Math.PI * 2);
  x.fill();
  x.globalAlpha = base;
  x.fillStyle = '#f4ead0';
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
  // 10時〜12時の 赤い 帯
  x.globalAlpha = base * (hot ? 0.75 + Math.sin(T / 90) * 0.25 : 0.55);
  x.fillStyle = '#e84a3a';
  x.beginPath();
  x.moveTo(cx, cy);
  x.arc(cx, cy, r, ang(warn), ang(max));
  x.closePath();
  x.fill();
  x.globalAlpha = base;
  // 目もり（12こ。3時ごとに 大きく）
  for (let i = 0; i < 12; i++) {
    const a = ang(i);
    const big = i % 3 === 0;
    x.strokeStyle = '#3a2a14';
    x.lineWidth = big ? 1.6 : 0.9;
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * r * (big ? 0.68 : 0.8), cy + Math.sin(a) * r * (big ? 0.68 : 0.8));
    x.lineTo(cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95);
    x.stroke();
  }
  // ふち（金）
  x.strokeStyle = hot ? '#ff8a5a' : '#c8963a';
  x.lineWidth = 2;
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.stroke();
  // 針（今の 時。10時を こえると 少し ふるえる）
  const shake = hot ? Math.sin(T / 40) * 0.05 : 0;
  const a = ang(hand) + shake;
  x.strokeStyle = hot ? '#c81e1e' : '#1a1008';
  x.lineWidth = 2.2;
  x.beginPath();
  x.moveTo(cx - Math.cos(a) * r * 0.15, cy - Math.sin(a) * r * 0.15);
  x.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
  x.stroke();
  // 長い 針（ゆっくり 回る。止まらない 時）
  const b = T / 900;
  x.strokeStyle = 'rgba(26,16,8,0.6)';
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(cx, cy);
  x.lineTo(cx + Math.cos(b) * r * 0.9, cy + Math.sin(b) * r * 0.9);
  x.stroke();
  x.fillStyle = '#c8963a';
  x.beginPath();
  x.arc(cx, cy, 1.6, 0, Math.PI * 2);
  x.fill();
}

// ───────────── たたかいの え（client/battle-ch6.js の ch6Draw から）─────────────
export function tokei6Draw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  const T = scene.time || 0;
  // 歯車: 弱点の しるし
  if (c.zenGear) weakMark(x, c.zenGear, px + w / 2, Math.max(7, py - 5), T, base);
  if (!c.zen) return;
  if (c.zen === 1) {
    // しかけの じゅんばん（今の しかけが 光って 少し 大きい）
    const y = Math.max(8, py + 4);
    ORDER.forEach((k, i) => {
      const on = c.zenSt === k;
      const cx = px + w / 2 + (i - 1.5) * 13;
      x.globalAlpha = base * 0.7;
      x.fillStyle = '#140c06';
      x.beginPath();
      x.arc(cx, y, on ? 6.5 : 5, 0, Math.PI * 2);
      x.fill();
      x.globalAlpha = base * (on ? 0.8 + Math.sin(T / 120) * 0.2 : 0.45);
      stageMark(x, k, cx, y, on ? 3.6 : 2.8, on ? STAGE_ICON[k] : '#8a7a5a');
    });
    x.globalAlpha = base;
    return;
  }
  // 2だんめ: 文字ばん
  if (c.hand !== undefined) {
    const r = 13;
    const cx = Math.max(r + 4, px + 4), cy = Math.max(r + 4, py + r + 2);
    drawDial(x, cx, cy, r, c.hand, c.handMax || 12, c.handWarn || 10, T, base);
    // 10時を こえたら ゼンマイの まわりに 赤い 時の わ
    if (c.hand >= (c.handWarn || 10)) {
      for (let i = 0; i < 2; i++) {
        const k = ((T / 11 + i * 25) % 50) / 50;
        x.globalAlpha = base * (0.55 - k * 0.5);
        x.strokeStyle = '#ff6a4a';
        x.lineWidth = 2;
        x.beginPath();
        x.ellipse(px + w / 2, py + h * 0.55, w * (0.3 + k * 0.4), h * (0.2 + k * 0.25), 0, 0, Math.PI * 2);
        x.stroke();
      }
      x.globalAlpha = base;
    }
  }
}

// ───────────── イベントを 見せる とき（client/battle-ch6.js の ch6Present から）─────────────
const STAGE_BANNER = {
  sand: '砂時計があらわれた！大砂流の前ぶれに、氷を当てよう！',
  gear: '大歯車が回り始めた！時を覚えたら、雷を2回！',
  pend: '大きなふりこがゆれ始めた！ねらわれたら、身を守れ！',
  bell: '大きなかねがあらわれた！鳴る前に、身を守れ！',
};
export function tokei6Present(scene, ev, fx, anim, actor) {
  const g = scene.game;
  if (ev.zenStage) {
    g.audio.sfx('warn');
    scene.banner(STAGE_BANNER[ev.zenStage.st] || 'しかけがかわった！', 'danger');
  }
  if (ev.zenP2) {
    g.audio.sfx('warn');
    scene.shake?.(500, 5);
    scene.banner('！文字ばんの針が動き出した！12時になる前に、歯車を弱点でこわせ！', 'danger');
  }
  if (ev.zenHand) {
    const { hand, max } = ev.zenHand;
    if (hand === max - 1) {
      g.audio.sfx('warn');
      scene.banner('！針が11時！次に時の大ほうかい！歯車をこわすか、身を守れ！', 'danger');
    } else if (hand === max - 2) scene.banner('！針が10時をこえた！歯車をこわせば、針がもどる！', 'danger');
  }
  if (ev.zenBack) {
    g.audio.sfx('crit');
    scene.banner(`歯車をこわした！針がもどった！（今は${ev.zenBack.hand}時）`, 'combo');
  }
  if (ev.zenCollapse) {
    scene.shake?.(900, 9);
    scene.banner('時の大ほうかい…！', 'danger');
  }
  if (ev.zenRevive?.length) scene.banner('こわした歯車が、また回り出した…！', 'danger');
  if (fx.type === 'telegraph' && actor?.person) {
    g.audio.sfx('warn');
    scene.banner('！リオンが光をためている！身を守れ！', 'danger');
  }
}

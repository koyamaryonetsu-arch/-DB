// 第2部 第7章 第2幕 の ジョリーホック号・ホック船長・手下の 魔物の がめん（client/battle-c7.js から よぶ。サーバーがわは shared/battle-c7s.js）
// ・ジョリーホック号: 船の 上に しおの しるし（満ち潮 … 青い 波。ほうげきまでの のこり。のこり 1つは 赤く ゆれる）。
//   のり上げて いる 間は 船の 下に サンゴしょう・まわりに 金の きらきらと「×1.5」（ダメージが ふえる）・しおが 満ちるまでの 小さな 波
// ・ホック船長: 頭の 上に 板わたりの号令までの しるし（板。のこり 1つは 赤く ゆれる）。だれかが 板の 上に いる 間は、
//   船長の よこから 海へ のびる 板と 小さな 人かげ・その 先に 赤い 波（次に 船長が 動くと ドボン）
//   板の 上の 人の まどには「板の上」（client/battle-earth.js の 地われの しるしと おなじ。TRAP_LABEL に 足す）
// ・バナー: ほうげきの 前ぶれ・いっせいほうげき・のり上げ（チャンス）・うき上がった／板わたりの 前ぶれ・板の上へ・助けた・ドボン
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音（client/battle-ch4.js・client/battle.js に まぜる）
import { C7_REEF, C7_LIGHT } from '../shared/data/monsters-c7s.js?v=ee8758356336';
import { TRAP_LABEL } from './battle-earth.js?v=ee8758356336';

// 板の 上の 人の まどの しるし（地われと おなじ 見た目）
TRAP_LABEL.plank = '板の上';

// 前ぶれの バナーを 自分で 出す（client/battle-ch6.js の CH6_OWN_TELE に まぜる。client/battle-c7.js の C7_OWN_TELE から）
export const C7S_OWN_TELE = [C7_REEF, C7_LIGHT];

export const C7S_SCREEN_ANIMS = ['a7r_broadside', 'a7l_drop', 'a7l_plank'];
export const C7S_ALLY_FX = {
  a7s_jump: 'claw', a7s_splash: 'ice', a7s_bone: 'claw', a7s_spiny: 'claw', a7s_rain: 'ice', a7s_saber: 'claw', a7s_karate: 'ice',
  a7s_peck: 'claw', a7s_mimic: 'dark', a7s_song: 'dark',
  a7r_cannon: 'fire', a7r_crew: 'claw', a7r_barrel: 'fire', a7r_anchor: 'quake', a7r_broadside: 'quake', a7r_stuck: 'claw',
  a7l_hook: 'claw', a7l_saber: 'claw', a7l_cannon: 'fire', a7l_laugh: 'down', a7l_frenzy: 'claw', a7l_plank: 'down', a7l_drop: 'quake',
};
export const C7S_SFX = {
  a7s_jump: 'hit', a7s_splash: 'ice', a7s_bone: 'hit', a7s_crumble: 'buff', a7s_spiny: 'smash', a7s_rain: 'ice', a7s_saber: 'hit', a7s_karate: 'smash',
  a7s_shout: 'buff', a7s_peck: 'hit', a7s_mimic: 'warn', a7s_song: 'warn',
  a7r_cannon: 'blast', a7r_crew: 'hit', a7r_barrel: 'fire', a7r_anchor: 'smash', a7r_broadside: 'blast', a7r_stuck: 'hit',
  a7l_hook: 'smash', a7l_saber: 'hit', a7l_cannon: 'blast', a7l_laugh: 'warn', a7l_frenzy: 'hit', a7l_plank: 'warn', a7l_drop: 'blast',
  a7y_boomerang: 'wind',
};

// しるしの うしろの くらい まる（背景と まざらない）
function backDot(x, cx, cy, r, base) {
  x.globalAlpha = base * 0.6;
  x.fillStyle = '#081418';
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}
// 小さな 波（しおの しるし）
function waveMark(x, cx, cy, s, col) {
  x.strokeStyle = col;
  x.lineWidth = 1.4;
  x.beginPath();
  x.moveTo(cx - s, cy + s * 0.3);
  x.quadraticCurveTo(cx - s * 0.5, cy - s * 0.7, cx, cy);
  x.quadraticCurveTo(cx + s * 0.5, cy + s * 0.6, cx + s, cy - s * 0.2);
  x.stroke();
}
// 小さな 板（板わたりの しるし）
function plankMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.fillRect(cx - s, cy - s * 0.3, s * 2, s * 0.6);
  x.fillStyle = '#2a1a0c';
  x.fillRect(cx - s * 0.2, cy - s * 0.3, s * 0.15, s * 0.6);
}
// のこりの しるしを ならべる（on … のこり・max … ぜんぶ）
function marks(x, px, py, w, on, max, base, T, draw, cols) {
  const gap = 11, x0 = px + w / 2 - ((max - 1) * gap) / 2, y0 = Math.max(6, py - 6);
  for (let i = 0; i < max; i++) {
    const lit = i < on;
    const last = lit && on === 1;
    backDot(x, x0 + i * gap, y0, 5, base);
    x.globalAlpha = base * (lit ? (last ? 0.7 + Math.sin(T / 80) * 0.3 : 0.95) : 0.3);
    draw(x, x0 + i * gap, y0, 4, lit ? (last ? cols[1] : cols[0]) : cols[2]);
  }
  x.globalAlpha = base;
}

// ───────────── たたかいの え（client/battle-c7.js の c7Draw から）─────────────
export function c7sDraw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  const T = scene.time || 0;
  // ジョリーホック号: しおの しるし／のり上げ
  if (c.c7tide === 1) marks(x, px, py, w, c.c7tideLeft || 0, c.c7tideMax || 4, base, T, waveMark, ['#7ad8f0', '#ff6a4a', '#2a4a60']);
  if (c.c7tide === 2) {
    // サンゴしょう（船の 下）
    for (let i = 0; i < 7; i++) {
      const cx = px + w * (0.15 + i * 0.12), cy = py + h * 0.93;
      x.globalAlpha = base * 0.9;
      x.fillStyle = i % 2 ? '#ff8a8a' : '#e8606a';
      x.beginPath();
      x.moveTo(cx - 4, cy + 2);
      x.lineTo(cx - 1, cy - 6 - (i % 3) * 2);
      x.lineTo(cx + 1, cy - 3);
      x.lineTo(cx + 3, cy - 7 + (i % 2) * 2);
      x.lineTo(cx + 5, cy + 2);
      x.fill();
    }
    // チャンスの 金の きらきら
    for (let i = 0; i < 6; i++) {
      const a = T / 500 + (i / 6) * Math.PI * 2;
      x.globalAlpha = base * (0.5 + Math.sin(T / 120 + i) * 0.3);
      x.fillStyle = '#ffe890';
      x.fillRect(Math.round(px + w / 2 + Math.cos(a) * w * 0.5), Math.round(py + h * 0.55 + Math.sin(a) * h * 0.35), 2, 2);
    }
    // 「×1.5」
    const k = c.aground || 1.5;
    const tx = px + w / 2, ty = Math.max(8, py - 4);
    x.globalAlpha = base * 0.85;
    x.fillStyle = '#3a2a08';
    x.fillRect(Math.round(tx - 14), Math.round(ty - 5), 28, 10);
    x.globalAlpha = base;
    x.fillStyle = '#ffe060';
    x.font = 'bold 7px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(`×${k}`, tx, ty + 0.5);
    x.textAlign = 'start';
    x.textBaseline = 'alphabetic';
    // しおが 満ちるまでの 小さな 波（船の 右下）
    for (let i = 0; i < (c.c7tideLeft || 0); i++) {
      backDot(x, px + w - 6 - i * 10, py + h - 4, 4.5, base);
      x.globalAlpha = base * 0.9;
      waveMark(x, px + w - 6 - i * 10, py + h - 4, 3.2, '#7ad8f0');
    }
    x.globalAlpha = base;
  }
  // ホック船長: 板わたりの号令までの しるし／板の 上の 人
  if (c.capEvery && !c.plankWho) marks(x, px, py, w, c.capLeft || 0, c.capEvery, base, T, plankMark, ['#c89a5a', '#ff6a4a', '#4a3a2a']);
  if (c.plankWho) {
    // 板（船長の 右から 海へ）と 小さな 人かげ
    const bx = px + w * 0.82, by = py + h * 0.86, len = 26;
    x.globalAlpha = base;
    x.fillStyle = '#8a5a2e';
    x.fillRect(Math.round(bx), Math.round(by), len, 3);
    x.fillStyle = '#5a3418';
    x.fillRect(Math.round(bx), Math.round(by + 2), len, 1);
    const sx = bx + len - 6 + Math.sin(T / 120) * 1.2;
    x.fillStyle = '#f2ead4';
    x.fillRect(Math.round(sx - 1.5), Math.round(by - 9), 3, 6);
    x.beginPath();
    x.arc(sx, by - 11, 2.2, 0, Math.PI * 2);
    x.fill();
    // その 先に 赤い 波（次に 船長が 動くと ドボン）
    const pulse = 0.6 + Math.sin(T / 90) * 0.4;
    x.globalAlpha = base * pulse;
    waveMark(x, bx + len + 6, by + 6, 5, '#ff6a4a');
    waveMark(x, bx + len + 6, by + 10, 5, '#ff6a4a');
    x.globalAlpha = base;
  }
}

// ───────────── イベントを 見せる とき（client/battle-c7.js の c7Present から）─────────────
export function c7sPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const nameOf = (id) => scene.c?.get?.(id)?.name || '';
  if (ev.c7sTide?.phase === 'high' && ev.c7sTide.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！しおが満ちた！次にいっせいほうげき…身を守れ！', 'danger');
  }
  if (ev.c7sBroadside) {
    scene.shake?.(800, 8);
    scene.banner('いっせいほうげき…！', 'danger');
  }
  if (ev.c7sGround) {
    g.audio.sfx('crit');
    scene.banner(`しおが引いた！船がのり上げた！今がチャンス！（ダメージ${ev.c7sGround.k}倍）`, 'combo');
  }
  if (ev.c7sTide?.float) scene.banner('しおが満ちて、船がうき上がった…！', 'danger');
  if (ev.c7sCap?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次に船長が動くと、板わたりの号令…！', 'danger');
  }
  if (ev.c7sPlank) {
    g.audio.sfx('warn');
    scene.banner(`！${nameOf(ev.c7sPlank.who)}が板の上へ！「手をのばす」で助けよう！`, 'danger');
  }
  if (ev.c7sStep) scene.banner(`！${nameOf(ev.c7sStep.who)}が板の先へ…！早く「手をのばす」！`, 'danger');
  if (ev.c7sFall) {
    scene.shake?.(700, 7);
    scene.banner(`${nameOf(ev.c7sFall.who)}が海へドボン…！大波だ！`, 'danger');
  }
}

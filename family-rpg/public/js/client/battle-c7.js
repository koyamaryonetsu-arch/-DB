// 第2部 第7章 第1幕 の ウツボきょうだい・オクタリア・手下の 魔物の がめん（client/battle-ch6.js から よぶ。サーバーがわは shared/battle-c7.js）
// ・ウツボきょうだい: 兄（ザブン）の 頭の 上に「いき」の しるし（大うずしおまでの のこり。のこり 1つは 赤く ゆれる・2ひきの まわりに 水色の うずの わ）。
//   かたほうが たおれている 間は、のこった ほうの 頭の 上に よびもどしまでの 数（赤い あわ）
// ・オクタリア: 頭の 上に 声うばいまでの しるし（音ぷ。次が 大合唱なら 赤い 音ぷ）。声の貝: まわりに うばった 声の 金の たま
// ・バナー: 大うずしおの 前ぶれ・たおした（よびもどしまで）・よびもどした／声うばいの 前ぶれ・大合唱の 前ぶれ・声を うばった・貝を こわした・貝が また できた
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音（client/battle-ch4.js・client/battle.js に まぜる）
import { C7_GATE, C7_GATE_B, C7_TEMPLE } from '../shared/data/monsters-c7.js';

// 前ぶれの バナーを 自分で 出す（client/battle-ch6.js の CH6_OWN_TELE に まぜる）
export const C7_OWN_TELE = [C7_GATE, C7_GATE_B, C7_TEMPLE];

export const C7_SCREEN_ANIMS = ['a7g_swirl', 'a7t_chorus', 'a7t_steal'];
export const C7_ALLY_FX = {
  a7_shell: 'claw', a7_chomp: 'claw', a7_fireball: 'fire', a7_spear: 'claw', a7_cards: 'claw', a7_peck: 'claw', a7_hex: 'dark', a7_caw: 'dark',
  a7_bucket: 'ice', a7_sweep: 'wind', a7_ink: 'dark', a7_boo: 'claw', a7_tongue: 'dark', a7_drain: 'down', a7_mist: 'down',
  a7_hands: 'claw', a7_eye: 'down', a7_curse: 'dark',
  a7g_spark: 'bolt', a7g_swirl: 'quake', a7t_arms: 'claw', a7t_contract: 'down', a7t_trident: 'bolt', a7t_steal: 'down', a7t_chorus: 'quake',
};
export const C7_SFX = {
  a7_shell: 'hit', a7_chomp: 'smash', a7_fireball: 'fire', a7_spear: 'hit', a7_cards: 'hit', a7_peck: 'hit', a7_hex: 'warn', a7_caw: 'warn',
  a7_bucket: 'ice', a7_sweep: 'wind', a7_ink: 'warn', a7_boo: 'smash', a7_tongue: 'warn', a7_drain: 'heal', a7_mist: 'warn',
  a7_hands: 'hit', a7_eye: 'warn', a7_curse: 'warn',
  a7g_spark: 'bolt', a7g_swirl: 'blast', a7g_call: 'warn', a7t_arms: 'hit', a7t_contract: 'warn', a7t_trident: 'bolt', a7t_steal: 'warn', a7t_chorus: 'blast',
  a7k_shield: 'buff',
};

// 小さな うず（いきの しるし）
function whirlMark(x, cx, cy, s, col, rot) {
  x.strokeStyle = col;
  x.lineWidth = 1.4;
  x.beginPath();
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    const a = rot + u * Math.PI * 2.4;
    const r = s * (1 - u * 0.8);
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * 0.8;
    if (i) x.lineTo(px, py);
    else x.moveTo(px, py);
  }
  x.stroke();
}
// 小さな 音ぷ
function noteMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.strokeStyle = col;
  x.lineWidth = 1.2;
  x.beginPath();
  x.ellipse(cx, cy + s * 0.6, s * 0.45, s * 0.34, -0.4, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.moveTo(cx + s * 0.4, cy + s * 0.6);
  x.lineTo(cx + s * 0.4, cy - s * 0.7);
  x.lineTo(cx + s * 0.95, cy - s * 0.3);
  x.stroke();
}
// しるしの うしろの くらい まる（背景と まざらない）
function backDot(x, cx, cy, r, base) {
  x.globalAlpha = base * 0.6;
  x.fillStyle = '#081418';
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}

// ───────────── たたかいの え（client/battle-ch6.js の ch6Draw から）─────────────
export function c7Draw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  const T = scene.time || 0;
  // ウツボきょうだい: いきの しるし（兄の 上だけ）・よびもどしまで
  if (c.twin) {
    const max = c.twinMax || 6;
    if (c.species === C7_GATE && c.twinLeft !== undefined && !c.callLeft) {
      const gap = 11, x0 = px + w / 2 - ((max - 1) * gap) / 2, y0 = Math.max(6, py - 6);
      for (let i = 0; i < max; i++) {
        const on = i < c.twinLeft;
        const last = on && c.twinLeft === 1;
        backDot(x, x0 + i * gap, y0, 5, base);
        x.globalAlpha = base * (on ? (last ? 0.7 + Math.sin(T / 80) * 0.3 : 0.95) : 0.3);
        whirlMark(x, x0 + i * gap, y0, 4, on ? (last ? '#ff6a4a' : '#7ad8e8') : '#3a5a60', T / 300 + i);
      }
      x.globalAlpha = base;
    }
    // 大うずしおの 前（のこり 1つ）: まわりに 水色の うずの わ
    if (c.twinLeft === 1 && !c.callLeft) {
      for (let i = 0; i < 2; i++) {
        const r = ((T / 9 + i * 20) % 40) / 40;
        x.globalAlpha = base * (0.6 - r * 0.5);
        x.strokeStyle = '#7ad8e8';
        x.lineWidth = 2;
        x.beginPath();
        x.ellipse(px + w / 2, py + h * 0.75, w * (0.3 + r * 0.4), h * (0.08 + r * 0.12), 0, 0, Math.PI * 2);
        x.stroke();
      }
      x.globalAlpha = base;
    }
    // よびもどしまでの 数（赤い あわ）
    if (c.callLeft) {
      const n = c.callLeft, gap = 10, x0 = px + w / 2 - ((n - 1) * gap) / 2, y0 = Math.max(6, py - 6);
      for (let i = 0; i < n; i++) {
        backDot(x, x0 + i * gap, y0, 5, base);
        x.globalAlpha = base * (n === 1 ? 0.7 + Math.sin(T / 70) * 0.3 : 0.95);
        x.strokeStyle = '#ff8a6a';
        x.lineWidth = 1.5;
        x.beginPath();
        x.arc(x0 + i * gap, y0 + Math.sin(T / 200 + i) * 1.5, 3.5, 0, Math.PI * 2);
        x.stroke();
      }
      x.globalAlpha = base;
    }
  }
  // オクタリア: 声うばいまでの しるし（音ぷ。次が 大合唱なら 赤）
  if (c.witchLeft !== undefined && !c.shellDown) {
    const max = c.witchEvery || 3, gap = 12, x0 = px + w / 2 - ((max - 1) * gap) / 2, y0 = Math.max(6, py - 6);
    for (let i = 0; i < max; i++) {
      const on = i < c.witchLeft;
      const last = on && c.witchLeft === 1;
      backDot(x, x0 + i * gap, y0, 5.5, base);
      x.globalAlpha = base * (on ? (last ? 0.7 + Math.sin(T / 80) * 0.3 : 0.95) : 0.3);
      noteMark(x, x0 + i * gap - 2, y0 - 1, 5, on ? (c.chorus ? '#ff6a6a' : '#ffe890') : '#4a3a5a');
    }
    x.globalAlpha = base;
  }
  // 声の貝: うばった 声の 金の たま（まわりを 回る）
  if (c.c7shell && c.voices > 0) {
    for (let i = 0; i < c.voices; i++) {
      const a = T / 400 + (i / c.voices) * Math.PI * 2;
      const vx = px + w / 2 + Math.cos(a) * w * 0.6, vy = py + h * 0.5 + Math.sin(a) * h * 0.4;
      x.globalAlpha = base * 0.5;
      x.fillStyle = '#fff6c8';
      x.beginPath();
      x.arc(vx, vy, 4, 0, Math.PI * 2);
      x.fill();
      x.globalAlpha = base;
      x.fillStyle = '#f0c040';
      x.beginPath();
      x.arc(vx, vy, 2.2, 0, Math.PI * 2);
      x.fill();
    }
  }
}

// ───────────── イベントを 見せる とき（client/battle-ch6.js の ch6Present から）─────────────
export function c7Present(scene, ev, fx, anim, actor) {
  const g = scene.game;
  if (ev.c7Sync?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！2ひきのいきが合った！次に大うずしお…身を守れ！', 'danger');
  }
  if (ev.c7Swirl) {
    scene.shake?.(800, 8);
    scene.banner('ふたごの大うずしお…！', 'danger');
  }
  if (ev.c7Down) {
    g.audio.sfx('warn');
    scene.banner(`！かたほうをたおした！${ev.c7Down.call}回動かれる前に、もうかたほうもたおせ！`, 'danger');
  } else if (ev.c7CallLeft?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次に動くと、きょうだいをよびもどす…！', 'danger');
  }
  if (ev.c7Call) {
    scene.shake?.(400, 4);
    scene.banner('よみがえった…！2ひきは、いっしょにたおそう！', 'danger');
  }
  if (ev.c7Witch?.left === 1) {
    g.audio.sfx('warn');
    scene.banner(ev.c7Witch.chorus ? '！次にうばった声の大合唱！貝をこわすか、身を守れ！' : '！次に声うばいの歌…！', 'danger');
  }
  if (ev.c7Steal) scene.banner('声がうばわれた！声の貝をこわせば、もどる！', 'danger');
  if (ev.c7Chorus) {
    scene.shake?.(900, 9);
    scene.banner('うばった声の大合唱…！', 'danger');
  }
  if (ev.c7Break) {
    g.audio.sfx('crit');
    scene.shake?.(400, 5);
    scene.banner(ev.c7Break.back?.length ? '声の貝をこわした！声がもどった！（オクタリアがよろめいた）' : '声の貝をこわした！（オクタリアがよろめいた）', 'combo');
  }
  if (ev.c7Regrow) scene.banner('また声の貝ができた…！', 'danger');
}

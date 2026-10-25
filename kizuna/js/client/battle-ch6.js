// 第2部 第6章 Step 1・2 の サンドクロック・ギアドンと 新しい 魔物の がめん（client/battle-ch5.js・client/battle.js から よぶ。サーバーがわは shared/battle-ch6.js）
// ・サンドクロック: よこに 砂時計の 目もり（のこりの 砂。あと1つで 赤く 光る）。大砂流の 前ぶれの 間は まわりに 砂色の うずの わ
// ・ギアドン: 時を 覚えている 間は、むねの 大歯車の まわりに 青い 時計の わ（まきもどしまでの のこり）と、雷の 目もり（あと 何回）。
//   ギアプレスの 前ぶれの 間は 赤い わ
// ・前ぶれ・止めた・こわした・まきもどした ときの バナー（ふつうの「大技が来る！」は 出さない … CH6_OWN_TELE）
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音
// 第2部 第6章 Step 3・4 の 星くいのよる鳥・ペンデュラ（battle-road.js。ここから よぶ）
import { ROAD_OWN_TELE, roadDraw, roadPresent } from './battle-road.js?v=855c00e900d9';

const SAND = 'sand_clock';
const GEAR = 'geardon';
// 前ぶれの バナーを 自分で 出す 魔物（client/battle.js の ふつうの「大技が来る！」を 出さない）
export const CH6_OWN_TELE = new Set([SAND, GEAR, ...ROAD_OWN_TELE]);

export const CH6_SCREEN_ANIMS = ['a6_stomp', 'a6_storm', 'a6_fall', 'a6_steam', 'a6_press', 'a6_rewind_big', 'a6_slow'];
export const CH6_ALLY_FX = {
  a6_horn: 'claw', a6_stomp: 'quake', a6_amber: 'up', a6_wing: 'wind', a6_dust: 'dark', a6_root: 'down', a6_leaf: 'wind',
  a6_kick: 'claw', a6_bell: 'dark', a6_flow: 'wind', a6_sand: 'dark', a6_tail: 'claw', a6_pinch: 'claw', a6_fist: 'claw', a6_pit: 'quake',
  a6_ghorn: 'claw', a6_spin: 'claw', a6_spear: 'claw', a6_beam: 'up', a6_swing: 'claw', a6_ring: 'dark', a6_tick: 'down',
  a6_tblade: 'claw', a6_slow: 'down', a6_stop: 'bolt', a6_hand: 'ice', a6_song: 'dark', a6_fang: 'claw', a6_web: 'down', a6_jump: 'claw',
  a6_spray: 'claw', a6_pend: 'claw', a6_storm: 'wind', a6_fall: 'quake', a6_gfist: 'claw', a6_cog: 'claw', a6_needle: 'claw', a6_steam: 'fire', a6_press: 'quake',
};
export const CH6_SFX = {
  a6_horn: 'smash', a6_stomp: 'smash', a6_call: 'buff', a6_amber: 'sparkle', a6_wing: 'wind', a6_dust: 'warn', a6_root: 'hit', a6_leaf: 'wind', a6_nut: 'heal',
  a6_kick: 'hit', a6_hurry: 'buff', a6_bell: 'warn', a6_flow: 'wind', a6_sand: 'warn', a6_hide: 'buff', a6_tail: 'hit', a6_pinch: 'hit', a6_shell: 'buff',
  a6_fist: 'smash', a6_pit: 'smash', a6_mend: 'heal', a6_ghorn: 'smash', a6_spin: 'hit', a6_wind: 'buff', a6_spear: 'hit', a6_beam: 'sparkle', a6_guard: 'buff',
  a6_swing: 'hit', a6_ring: 'warn', a6_tick: 'warn', a6_tblade: 'smash', a6_slow: 'warn', a6_stop: 'bolt', a6_hand: 'ice', a6_rewind: 'heal', a6_song: 'warn',
  a6_fang: 'hit', a6_web: 'warn', a6_jump: 'smash', a6_spray: 'hit', a6_pend: 'smash', a6_storm: 'wind', a6_fall_charge: 'warn', a6_fall: 'blast',
  a6_gfist: 'smash', a6_cog: 'hit', a6_needle: 'hit', a6_steam: 'fire', a6_press_charge: 'warn', a6_press: 'blast', a6_record: 'warn', a6_rewind_big: 'warn',
  a6_dew: 'heal', a6_prayer: 'heal', a6_comet: 'sparkle', a6_read: 'buff',
};

// ───────────── たたかいの え（client/battle-ch5.js の towerDraw から）─────────────
export function ch6Draw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  roadDraw(scene, x, m, c, px, py, w, h, base);
  const T = scene.time || 0;
  // サンドクロック: 砂の 目もり（右よこ）と 前ぶれの うず
  if (c.species === SAND && c.sand !== undefined) {
    const max = c.sandMax || 6;
    const bx = Math.min(250, px + w + 3), by = py + h * 0.2, cell = Math.max(4, Math.min(7, Math.floor((h * 0.6) / max)));
    for (let i = 0; i < max; i++) {
      // 下から つむ（上の ほうが さいごの 砂）
      const on = i < c.sand;
      const low = c.sand <= 1 && on;
      x.globalAlpha = base * (on ? (low ? 0.7 + Math.sin(T / 90) * 0.3 : 0.95) : 0.35);
      x.fillStyle = on ? (low ? '#ff6a4a' : '#f0c870') : '#5a4a30';
      x.fillRect(bx, by + (max - 1 - i) * cell, 4, cell - 1);
    }
    x.globalAlpha = base;
    if (c.telegraph) {
      for (let i = 0; i < 3; i++) {
        const a = T / 200 + i * 2.1;
        x.globalAlpha = base * (0.5 + Math.sin(T / 120 + i) * 0.25);
        x.strokeStyle = i % 2 ? '#fff0b8' : '#e8c070';
        x.lineWidth = 2;
        x.beginPath();
        x.ellipse(px + w / 2, py + h * (0.45 + i * 0.12), w * (0.55 - i * 0.05), h * 0.1, 0, a, a + Math.PI * 1.4);
        x.stroke();
      }
      x.globalAlpha = base;
    }
  }
  // ギアドン: まきもどしまでの わ・雷の 目もり / ギアプレスの 前ぶれ
  if (c.species === GEAR) {
    const cx = px + w / 2, cy = py + h * 0.52;
    if (c.gearRec) {
      const r = Math.max(10, w * 0.24);
      x.globalAlpha = base * (0.65 + Math.sin(T / 110) * 0.25);
      x.strokeStyle = '#7ad0ff';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2 * Math.min(1, (c.gearLeft || 0) / 4), true);
      x.stroke();
      // 時計の 針が さかさまに 回る
      const a = -T / 160;
      x.strokeStyle = '#c8f0ff';
      x.beginPath();
      x.moveTo(cx, cy);
      x.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
      x.stroke();
      // 雷の 目もり（当てた 数）
      const need = c.gearNeed || 2;
      for (let i = 0; i < need; i++) {
        x.globalAlpha = base;
        x.fillStyle = i < (c.gearHits || 0) ? '#fff070' : 'rgba(255,255,255,0.3)';
        const qx = cx - (need - 1) * 6 + i * 12, qy = py - 4;
        x.beginPath();
        x.moveTo(qx + 1, qy - 4);
        x.lineTo(qx - 3, qy + 1);
        x.lineTo(qx, qy + 1);
        x.lineTo(qx - 1, qy + 5);
        x.lineTo(qx + 3, qy - 1);
        x.lineTo(qx, qy - 1);
        x.closePath();
        x.fill();
      }
      x.globalAlpha = base;
    }
    if (c.telegraph && !c.gearRec) {
      x.globalAlpha = base * (0.5 + Math.sin(T / 100) * 0.3);
      x.strokeStyle = '#ff6a4a';
      x.lineWidth = 2;
      x.beginPath();
      x.ellipse(cx, py + h * 0.4, w * 0.55, h * 0.45, 0, 0, Math.PI * 2);
      x.stroke();
      x.globalAlpha = base;
    }
  }
}

// ───────────── イベントを 見せる とき（client/battle-ch5.js の towerPresent から）─────────────
export function ch6Present(scene, ev, fx, anim, actor) {
  const g = scene.game;
  roadPresent(scene, ev, fx, anim, actor);
  if (fx.type === 'telegraph' && actor?.species === SAND) {
    g.audio.sfx('warn');
    scene.banner('！大砂流の前ぶれ！氷を当てるか、身を守れ！', 'danger');
  } else if (ev.scSand?.lv === 1) {
    g.audio.sfx('warn');
    scene.banner('！砂があと1つ！氷でこおらせて、もどそう', 'danger');
  }
  if (ev.scStop) {
    g.audio.sfx('ice');
    scene.banner('砂がこおって、大砂流を止めた！', 'combo');
  } else if (ev.scBack) {
    g.audio.sfx('ice');
    scene.banner('氷で砂がもどった！', 'combo');
  }
  if (ev.scFall) scene.shake(500, 6);
  if (fx.type === 'telegraph' && actor?.species === GEAR) {
    g.audio.sfx('warn');
    scene.banner('！ギアプレスの前ぶれ！身を守れ！', 'danger');
  }
  if (ev.gdRecord) {
    g.audio.sfx('warn');
    scene.banner(`！ギアドンが時を覚えた！雷を${ev.gdRecord.need}回当てて、大歯車をこわせ！`, 'danger');
  }
  if (ev.gdSpark) scene.banner(`大歯車に火花！あと${ev.gdSpark.left}回`, 'combo');
  if (ev.gdBreak) {
    g.audio.sfx('crit');
    scene.shake(400, 5);
    scene.banner('大歯車をこわした！まきもどしを止めた！', 'combo');
  }
  if (ev.gdRewind) {
    scene.banner(ev.gdRewind.heal > 0 ? `時がまきもどった…！キズが${ev.gdRewind.heal}もとにもどった` : '時がまきもどった…！', 'danger');
  }
}

// 第2部 第6章 Step 5 の カリヨンと 時計塔の 魔物の がめん（client/battle-ch6.js から よぶ。サーバーがわは shared/battle-tokei.js）
// ・カリヨン: 右よこに かねの しるし（のこりの 数。上から。のこり 1つの ときは 赤く ゆれる）。鳴った ときは まわりに 音の わ
// ・バナー: しるしが あと1つ（身を 守れ）・時のかねが 鳴った（強くするなら 今）
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音（client/battle-ch4.js・client/battle.js に まぜる）
// 第2部 第6章 Step 6: ゼンマイが 家来の しかけを 使う 間・時のまぼろしも おなじ 絵と バナー（kindOf … kindAs・base・species。battle-tokei6.js）
import { kindOf } from './battle-tokei6.js?v=31a32b16dd7b';
const CARILLON = 'carillon';

export const TOKEI_SCREEN_ANIMS = ['a6t_bell', 'a6t_cspin', 'a6t_chime'];
export const TOKEI_ALLY_FX = {
  a6t_roll: 'claw', a6t_spin: 'claw', a6t_punch: 'claw', a6t_jump: 'quake', a6t_scare: 'dark', a6t_rush: 'claw',
  a6t_hammer: 'claw', a6t_chime: 'dark', a6t_cspin: 'claw', a6t_tick: 'down', a6t_bell: 'quake',
};
export const TOKEI_SFX = {
  a6t_roll: 'hit', a6t_spin: 'hit', a6t_lock: 'buff', a6t_punch: 'smash', a6t_jump: 'hit', a6t_scare: 'warn', a6t_rush: 'smash',
  a6t_hammer: 'smash', a6t_chime: 'sparkle', a6t_cspin: 'hit', a6t_tick: 'warn', a6t_bell: 'blast', a6t_crest: 'sparkle',
};

// 小さな かね（cx … まん中・y … てっぺん・s … 大きさ）
function bellIcon(x, cx, y, s, body, rim) {
  x.fillStyle = body;
  x.beginPath();
  x.moveTo(cx - s * 0.35, y + s * 0.15);
  x.quadraticCurveTo(cx, y - s * 0.25, cx + s * 0.35, y + s * 0.15);
  x.lineTo(cx + s * 0.55, y + s * 0.85);
  x.lineTo(cx - s * 0.55, y + s * 0.85);
  x.closePath();
  x.fill();
  x.fillStyle = rim;
  x.fillRect(Math.round(cx - s * 0.6), Math.round(y + s * 0.82), Math.round(s * 1.2), Math.max(1, Math.round(s * 0.14)));
  x.beginPath();
  x.arc(cx, y + s * 1.0, Math.max(1, s * 0.14), 0, Math.PI * 2);
  x.fill();
}

// ───────────── たたかいの え（client/battle-ch6.js の ch6Draw から）─────────────
export function tokeiDraw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive || kindOf(c) !== CARILLON || c.bell === undefined) return;
  const T = scene.time || 0;
  const max = c.bellMax || 4;
  const bx = Math.min(246, px + w + 6);
  for (let i = 0; i < max; i++) {
    const on = i < c.bell;
    const last = on && c.bell === 1;
    const by = py + 6 + i * 15;
    // うしろの くらい まる（背景と まざらない）
    x.globalAlpha = base * 0.65;
    x.fillStyle = '#1a1208';
    x.beginPath();
    x.arc(bx, by + 4, 7, 0, Math.PI * 2);
    x.fill();
    x.save();
    // のこり 1つの かねは ゆれる
    const sw = last ? Math.sin(T / 70) * 0.35 : 0;
    x.translate(bx, by);
    x.rotate(sw);
    x.translate(-bx, -by);
    x.globalAlpha = base * (on ? (last ? 0.7 + Math.sin(T / 90) * 0.3 : 0.95) : 0.3);
    bellIcon(x, bx, by, 9, on ? (last ? '#ff6a4a' : '#f0c040') : '#5a4a30', on ? '#fff0a0' : '#3a3020');
    x.restore();
  }
  x.globalAlpha = base;
  // のこり 1つ: カリヨンの まわりに 赤い 音の わ
  if (c.bell === 1) {
    for (let i = 0; i < 2; i++) {
      const r = ((T / 9 + i * 20) % 40) / 40;
      x.globalAlpha = base * (0.6 - r * 0.5);
      x.strokeStyle = '#ff8a5a';
      x.lineWidth = 2;
      x.beginPath();
      x.ellipse(px + w / 2, py + h * 0.3, w * (0.2 + r * 0.4), h * (0.1 + r * 0.2), 0, 0, Math.PI * 2);
      x.stroke();
    }
    x.globalAlpha = base;
  }
}

// ───────────── イベントを 見せる とき（client/battle-ch6.js の ch6Present から）─────────────
export function tokeiPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  if (ev.tkBell?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！かねのしるしがあと1つ！次に時のかねが鳴る…身を守れ！', 'danger');
  }
  if (ev.tkRing) {
    scene.shake?.(600, 7);
    scene.banner(ev.tkRing.lost ? '時のかねが鳴った…！強くした力が消えた！（強くするなら、今！）' : '時のかねが鳴った…！（強くするなら、今！）', 'danger');
  }
}

// 第5章 Step 8「影の城」の 3人の まぼろしと 城の 魔物の がめん（client/battle-ch5.js・client/battle.js から よぶ。サーバーがわは shared/battle-phantom.js）
// ・まぼろし（3人とも）: すがたの まわりに、ゆらぐ ざんぞう（その まぼろしの 色）。前の 章の ボスの「まぼろし」らしく
// ・ストルムのまぼろし: 風のかべの 間は まわりを 回る 風の わ（あおみどり）。かべ・竜巻の 前ぶれ・はね返し・かべが 消えた ときの バナー
// ・イグニアのまぼろし: 大炎の 前ぶれの 間は、のこっている かげ火から イグニアへ むらさきの 光の すじ（すいこまれる しるし）。
//   かげ火が 来た・大炎の 前ぶれ・大炎（すいこんだ 数）の バナー
// ・モルガナのまぼろし: 広間の 水かさ（下から 上がる 水と 目もり）。いっぱい・水の衣を はじいて 下がった ときの バナー
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音
import { whiteCopy } from './render/pixel.js?v=557fc20ec559';

const STORM = 'phantom_storm';
const IGNIA = 'phantom_ignia';
const MORGANA = 'phantom_morgana';
const FLAME = 'phantom_flame';
// ざんぞうの 色
const GHOST = { [STORM]: '#8ae0d8', [IGNIA]: '#d090ff', [MORGANA]: '#8a9aff' };

export const PHANTOM_SCREEN_ANIMS = ['gc_wing', 'mk_gust', 'ew_breath', 'bk_wall', 'ss_tide', 'ps_thunder', 'ps_tornado', 'ps_wall', 'pi_hellfire', 'pi_inferno', 'pm_whirl', 'pm_wave'];
export const PHANTOM_ALLY_FX = {
  gc_wing: 'wind', gc_dive: 'claw', gc_feather: 'bolt', mk_blade: 'claw', mk_gust: 'wind', ww_cut: 'claw',
  ew_breath: 'fire', ew_fang: 'fire', cg_flame: 'fire', cg_wax: 'down', cg_sway: 'dark', bk_slash: 'fire', bk_wall: 'fire',
  mj_sting: 'bolt', mj_bubble: 'ice', ss_bite: 'claw', ss_coil: 'down', ss_tide: 'ice', fsi_shot: 'ice', fsi_lull: 'dark',
  ps_blade: 'wind', ps_thunder: 'bolt', ps_tornado: 'wind', pss_slash: 'wind',
  pi_fire: 'fire', pi_hellfire: 'fire', pi_haze: 'dark', pi_inferno: 'fire', pf_fire: 'fire',
  pm_blade: 'ice', pm_whirl: 'ice', pm_splash: 'ice', pm_wave: 'quake',
};
export const PHANTOM_SFX = {
  gc_wing: 'wind', gc_dive: 'smash', gc_feather: 'bolt', mk_blade: 'smash', mk_gust: 'wind', mk_brace: 'buff', ww_cut: 'hit', ww_dance: 'buff',
  ew_breath: 'fire', ew_fang: 'hit', ew_howl: 'buff', cg_flame: 'fire', cg_wax: 'warn', cg_sway: 'warn', bk_slash: 'smash', bk_wall: 'fire',
  mj_sting: 'bolt', mj_bubble: 'ice', mj_glow: 'sparkle', ss_bite: 'hit', ss_coil: 'warn', ss_tide: 'ice', fsi_shot: 'ice', fsi_lull: 'warn', fsi_mend: 'heal',
  ps_blade: 'smash', ps_thunder: 'thunder', ps_tornado_charge: 'warn', ps_tornado: 'wind', ps_wall: 'wind', pss_slash: 'hit',
  pi_fire: 'fire', pi_hellfire: 'fire', pi_haze: 'warn', pi_call: 'warn', pi_inferno_charge: 'warn', pi_inferno: 'blast', pf_fire: 'fire',
  pm_blade: 'ice', pm_whirl: 'ice', pm_splash: 'ice', pm_heal: 'heal', pm_wave_charge: 'warn', pm_wave: 'blast',
};

// ざんぞうの え（もとの え ごとに 1回だけ 作る）
const ghosts = new WeakMap();
function ghostOf(img, color) {
  let g = ghosts.get(img);
  if (!g) {
    try {
      g = whiteCopy(img, color);
    } catch {
      g = null;
    }
    ghosts.set(img, g);
  }
  return g;
}

// ───────────── たたかいの え（client/battle-ch5.js の towerDraw から）─────────────
export function phantomDraw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  const T = scene.time || 0;
  const color = GHOST[c.species];
  // まぼろしの ざんぞう（左右に ゆらぐ）
  if (color && m?.img) {
    const g = ghostOf(m.img, color);
    if (g) {
      const dx = Math.sin(T / 260) * 3;
      x.globalAlpha = base * (0.16 + Math.sin(T / 180) * 0.06);
      x.drawImage(g, px + dx, py - 1, w, h);
      x.drawImage(g, px - dx, py + 1, w, h);
      x.globalAlpha = base;
    }
  }
  // 風のかべ: まわりを 回る 風の わ
  if (c.species === STORM && c.windWall) {
    for (let i = 0; i < 3; i++) {
      const a = T / 240 + i * 2.1;
      x.globalAlpha = base * (0.45 + Math.sin(T / 150 + i) * 0.2);
      x.strokeStyle = i % 2 ? '#c8fff4' : '#8ae0d8';
      x.lineWidth = 1.5;
      x.beginPath();
      x.ellipse(px + w * 0.5, py + h * (0.3 + i * 0.22), w * (0.5 + i * 0.04), h * 0.1, 0, a, a + Math.PI * 1.3);
      x.stroke();
    }
    x.globalAlpha = base;
  }
  // 大炎の 前ぶれ: かげ火から イグニアへ 光の すじ
  if (c.species === IGNIA && c.telegraph) {
    const lay = scene.layout || [];
    const me = lay.find((l) => l.c === c);
    for (const l of lay) {
      if (l.c.species !== FLAME || !l.c.alive) continue;
      x.globalAlpha = base * (0.5 + Math.sin(T / 90) * 0.3);
      x.strokeStyle = '#d090ff';
      x.lineWidth = 1.5;
      x.beginPath();
      x.moveTo(l.x + l.w / 2, l.y + l.h / 2);
      x.lineTo(me ? me.x + me.w / 2 : px + w / 2, me ? me.y + me.h * 0.4 : py + h * 0.4);
      x.stroke();
    }
    x.globalAlpha = base;
  }
  // 水かさ（モルガナの まぼろしの 1人めの ときだけ かく。どれが 本物か 分からない ように 3人 おなじ 水かさ）
  if (c.species === MORGANA && c.tide !== undefined) {
    const first = (scene.enemies?.() || []).find((e) => e.species === MORGANA && e.alive);
    if (first && first.id !== c.id) return;
    const max = c.tideMax || 6;
    const k = Math.max(0, Math.min(1, c.tide / max));
    const top = 124 - 4 - k * 22 + Math.sin(T / 300) * 1;
    x.globalAlpha = 0.28 + k * 0.12;
    x.fillStyle = k >= 1 ? '#4a6aff' : '#3a7ac8';
    x.fillRect(0, top, 256, 128 - top);
    x.globalAlpha = 0.7;
    x.fillStyle = '#c8f0ff';
    for (let i = 0; i < 256; i += 8) x.fillRect(i + ((T / 60) % 8), top + Math.round(Math.sin(i * 0.2 + T / 200)), 4, 1);
    // 目もり（左上）
    for (let i = 0; i < max; i++) {
      x.fillStyle = i < c.tide ? (k >= 1 ? '#ff6a8a' : '#7ad0ff') : 'rgba(255,255,255,0.25)';
      x.fillRect(6 + i * 6, 8, 4, 4);
    }
    x.globalAlpha = base;
  }
}

// ───────────── イベントを 見せる とき（client/battle-ch5.js の towerPresent から）─────────────
export function phantomPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const nameOf = (id) => scene.c.get(id)?.name || '';
  if (ev.psWall) {
    g.audio.sfx('wind');
    scene.banner('！風のかべ！物理の攻撃ははね返される。呪文で攻めよう', 'danger');
  }
  if (ev.psBounce) {
    scene.allyFx?.(ev.psBounce.on, 'wind');
    g.audio.sfx('wind');
  }
  if (ev.psWallEnd) scene.banner('風のかべが消えた！', 'combo');
  if (fx.type === 'telegraph' && actor?.species === STORM) {
    g.audio.sfx('warn');
    scene.banner('！大竜巻の前ぶれ！身を守れ！', 'danger');
  }
  if (ev.piCall) scene.banner('！かげ火があらわれた！大炎の前にたおそう', 'danger');
  if (fx.type === 'telegraph' && actor?.species === IGNIA) {
    g.audio.sfx('warn');
    scene.banner('！大炎の前ぶれ！かげ火をたおして、身を守れ！', 'danger');
  }
  if (ev.piInferno) {
    scene.shake(500, 5);
    scene.banner(ev.piInferno.fuel > 0 ? `！かげ火を${ev.piInferno.fuel}体すいこんだ大炎！` : 'かげ火がいない！大炎のいきおいは弱い！', ev.piInferno.fuel > 0 ? 'danger' : 'combo');
  }
  if (ev.pmTide?.down) {
    g.audio.sfx('sparkle');
    scene.banner('水の衣をはじいた！水かさが下がった', 'combo');
  } else if (ev.pmTide && ev.pmTide.lv >= (scene.enemies?.().find((e) => e.species === MORGANA)?.tideMax || 6)) {
    g.audio.sfx('warn');
    scene.banner('！水かさがいっぱい！大波が来る', 'danger');
  }
  if (ev.psBounce && !ev.psWall) {
    const who = nameOf(ev.psBounce.on);
    if (who && !scene.psBounceSaid) {
      scene.psBounceSaid = true;
      scene.banner(`${who}の攻撃が、風のかべにはね返された！`, 'danger');
    }
  }
}

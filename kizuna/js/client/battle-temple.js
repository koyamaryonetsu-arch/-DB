// 第4章 Step 7「砂の底の神殿とモルガナ」の たたかいの がめん（client/battle.js・client/battle-ch4.js から よぶ。サーバーがわは shared/battle-temple.js）
// ・鏡のうつし身: 敵の がわに、パーティーの 人の 絵（左右反転・少し 青く すける 鏡の 色）。魔物の 仲間は その 魔物の 絵
// ・水のろう: 水の たまの 中に、とじこめられた 人の 絵が 見える
// ・水の衣（青く ゆらめく 水の まく）・水を まとい始めた（しずくが あつまる）・体が 光った（呪文を はね返す。白く 光る ◇）・
//   大波の 前ぶれ（足もとの 水の うず）
// ・バナー（はね返された・鏡写し・水の衣が はじけた・大波・水のろう）と、水の守りの歌の しるし
import { heroCanvas } from './render/hero.js?v=e28f090d0ad9';
import { monsterCanvas } from './render/monsters.js?v=e28f090d0ad9';
import { equipKey } from './render/chars.js?v=e28f090d0ad9';
import { makeCanvas, ctxOf, flipCanvas } from './render/pixel.js?v=e28f090d0ad9';
import { el } from './ui/dom.js?v=e28f090d0ad9';

// 敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音（client/battle-ch4.js・client/battle.js で まぜる）
export const TEMPLE_SCREEN_ANIMS = ['whirlpool', 'water_breath', 'big_wave', 'water_rain', 'siren_song'];
export const TEMPLE_ALLY_FX = {
  water_shot: 'ice', water_rain: 'ice', whirlpool: 'wind', water_breath: 'ice', big_wave: 'quake', water_prison: 'ice', siren_song: 'dark', mirror_beam: 'bolt',
};
export const TEMPLE_SFX = {
  water_shot: 'ice', water_rain: 'ice', whirlpool: 'wind', water_breath: 'wind', big_wave: 'rumble', wave_charge: 'warn', water_prison: 'ice',
  veil_charge: 'buff', veil_on: 'buff', mirror_glow: 'sparkle', mirror_beam: 'ice', siren_song: 'sleep',
};

// うつし身の 人の 絵の こまかさ（hero.js の res。できた 絵は res 4 あつかいで 大きく。だいたい 40×52）
const HERO_RES = 10;
const SHOW_RES = 4;
const cache = new Map();

// 鏡の 色: 左右反転して、少し 青く・少し すける。ななめの 光の すじ
function mirrorTint(src) {
  const fl = flipCanvas(src);
  const tint = makeCanvas(fl.width, fl.height);
  const t = ctxOf(tint);
  t.drawImage(fl, 0, 0);
  t.globalCompositeOperation = 'source-atop';
  t.fillStyle = 'rgba(80,160,255,0.36)';
  t.fillRect(0, 0, tint.width, tint.height);
  t.fillStyle = 'rgba(255,255,255,0.22)';
  const W = tint.width, H = tint.height;
  for (let i = 0; i < 3; i++) {
    const x0 = W * (0.1 + i * 0.32);
    t.beginPath();
    t.moveTo(x0, 0); t.lineTo(x0 + W * 0.1, 0); t.lineTo(x0 + W * 0.1 - H * 0.3, H); t.lineTo(x0 - H * 0.3, H);
    t.closePath();
    t.fill();
  }
  const out = makeCanvas(W, H);
  const o = ctxOf(out);
  o.globalAlpha = 0.84;
  o.drawImage(tint, 0, 0);
  out.res = src.res || 1;
  return out;
}

// 人（look・職業・見た目装備）の 絵（正面）。魔物の 仲間は 魔物の 絵
function personCanvas(p, frame = 0) {
  if (p.mon) return monsterCanvas(p.mon, frame);
  const c = heroCanvas(p.look || {}, p.job || 'warrior', equipKey(p.eq || undefined, p.job || 'warrior'), 'down', 0, HERO_RES);
  c.res = SHOW_RES;
  return c;
}

const personKey = (p) => `${p.mon || ''}|${JSON.stringify(p.look || null)}|${p.job || ''}|${p.eq || ''}`;

// うつし身・水のろうの 絵（ほかは null。client/battle.js の computeLayout）
export function templeSprite(c, frame = 0) {
  if (c.mirror) {
    const f = c.mon ? frame : 0;
    const key = `m|${personKey(c)}|${f}`;
    let img = cache.get(key);
    if (!img) {
      img = mirrorTint(personCanvas(c, f));
      cache.set(key, img);
    }
    return img;
  }
  if (c.species === 'water_prison' && c.inside) {
    const key = `p|${personKey(c.inside)}|${frame}`;
    let img = cache.get(key);
    if (!img) {
      img = prisonCanvas(c.inside, frame);
      cache.set(key, img);
    }
    return img;
  }
  return null;
}

// 水の たまの 中に 人が 見える（人の 絵を 小さく・青く して、上から 水を うすく かさねる）
function prisonCanvas(p, frame) {
  const bub = monsterCanvas('water_prison', frame);
  const out = makeCanvas(bub.width, bub.height);
  out.res = bub.res || 1;
  const o = ctxOf(out);
  o.drawImage(bub, 0, 0);
  const who = personCanvas(p, 0);
  const k = Math.min((bub.width * 0.62) / who.width, (bub.height * 0.7) / who.height);
  const w = who.width * k, h = who.height * k;
  const tmp = makeCanvas(who.width, who.height);
  const t = ctxOf(tmp);
  t.drawImage(who, 0, 0);
  t.globalCompositeOperation = 'source-atop';
  t.fillStyle = 'rgba(40,110,200,0.45)';
  t.fillRect(0, 0, tmp.width, tmp.height);
  o.imageSmoothingEnabled = true;
  o.globalAlpha = 0.9;
  o.drawImage(tmp, (bub.width - w) / 2, bub.height * 0.5 - h / 2, w, h);
  o.globalAlpha = 0.35;
  o.drawImage(bub, 0, 0);
  return out;
}

// たたかいの え（client/battle.js の draw。すがたを かいた あと）: 水の衣・前ぶれ・光・大波の うず
export function templeDraw(scene, x, m, c, px, py, w, h, base, white) {
  if (!c.alive) return;
  const T = scene.time;
  if (c.veil) {
    x.globalAlpha = base * (0.24 + Math.sin(T / 260) * 0.08);
    x.drawImage(white(m.img, '#5ab8e8'), px - 2, py - 2, w + 4, h + 4);
    x.globalAlpha = base * 0.7;
    x.strokeStyle = '#bfe6ff';
    x.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      const ph = ((T / 900 + i / 3) % 1);
      const y = py + h * (1 - ph);
      x.beginPath();
      x.ellipse(px + w / 2, y, w * 0.52, 2.5, 0, 0, Math.PI * 2);
      x.stroke();
    }
  }
  if (c.veilCharge) {
    x.globalAlpha = base;
    x.fillStyle = '#9ad8f6';
    for (let i = 0; i < 8; i++) {
      const a = T / 300 + i * (Math.PI / 4);
      const r = (w * 0.6) * (1 - ((T / 1200 + i / 8) % 1));
      x.fillRect(Math.round(px + w / 2 + Math.cos(a) * r), Math.round(py + h * 0.5 + Math.sin(a) * r * 0.6), 2, 2);
    }
  }
  if (c.reflect) {
    x.globalAlpha = base * (0.35 + Math.sin(T / 120) * 0.25);
    x.drawImage(white(m.img, '#ffffff'), px - 2, py - 2, w + 4, h + 4);
    // 頭の 上の ◇（光る 鏡の しるし）
    x.globalAlpha = base;
    const sx = Math.round(px + w / 2), sy = Math.round(py - 6 + Math.sin(T / 160) * 1.5);
    x.fillStyle = '#1a2440';
    x.beginPath(); x.moveTo(sx, sy - 6); x.lineTo(sx + 6, sy); x.lineTo(sx, sy + 6); x.lineTo(sx - 6, sy); x.closePath(); x.fill();
    x.fillStyle = Math.floor(T / 200) % 2 ? '#ffffff' : '#bfe8ff';
    x.beginPath(); x.moveTo(sx, sy - 4); x.lineTo(sx + 4, sy); x.lineTo(sx, sy + 4); x.lineTo(sx - 4, sy); x.closePath(); x.fill();
    // きらきら
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
      const ph = (T / 500 + i * 0.33) % 1;
      x.fillRect(Math.round(px + w * (0.2 + 0.3 * i)), Math.round(py + h * (0.2 + 0.25 * ph)), 1, 3);
      x.fillRect(Math.round(px + w * (0.2 + 0.3 * i)) - 1, Math.round(py + h * (0.2 + 0.25 * ph)) + 1, 3, 1);
    }
  }
  if (c.wave) {
    x.globalAlpha = base * 0.8;
    x.strokeStyle = c.wave >= 2 ? '#e0f6ff' : '#5ab8e8';
    x.lineWidth = 1;
    const n = c.wave >= 2 ? 4 : 2;
    for (let i = 0; i < n; i++) {
      const a = T / (c.wave >= 2 ? 150 : 280) + i * 1.6;
      x.beginPath();
      x.ellipse(px + w / 2, py + h - 2, w * (0.35 + i * 0.12), 3 + i, 0, a, a + 2.4);
      x.stroke();
    }
  }
  x.globalAlpha = base;
}

// 戦いの はじめ（client/battle.js の constructor）: 水の守りの歌の しるし
export function templeStart(scene, snap) {
  scene.songLeft = snap?.temple?.song || 0;
  if (scene.songLeft > 0) {
    scene.songEl = el('div', { class: 'b-song', text: '♪水の守りの歌' });
    scene.stage.append(scene.songEl);
  }
}

// イベントを 見せる とき（client/battle-ch4.js の ch4Present から）
export function templePresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const at = (ids) => (ids || []).map((id) => scene.c.get(id)).filter(Boolean).map((t) => (t.side === 'ally' ? scene.allyPt(t) : scene.center(t))).filter(Boolean);
  if (fx.type === 'song') {
    scene.fx.play('song', [{ x: 128, y: 100 }]);
    g.audio.sfx('heal');
    scene.banner('♪水の守りの歌が、みんなをつつんでいる', 'combo');
  }
  if (fx.type === 'reflect' && fx.kind) {
    scene.fx.play('mirror_glow', at([fx.actor]));
    g.audio.sfx('warn');
    scene.banner('！体が光った！呪文ははね返される', 'danger');
  }
  if (fx.reflect) {
    scene.fx.play('reflect', at([fx.reflect]));
    g.audio.sfx('sparkle');
    scene.banner(fx.copy ? '鏡写し！同じ呪文ははね返された！' : '呪文がはね返された！', 'danger');
  }
  if (fx.type === 'veilCharge') {
    scene.fx.play('veil_charge', at([fx.actor]));
    g.audio.sfx('warn');
    scene.banner('！水をまとい始めた…', 'danger');
  }
  if (fx.type === 'veil') {
    scene.fx.play('veil_on', at(fx.targets));
    g.audio.sfx('buff');
  }
  if (ev.veilBreak) {
    scene.fx.play('veil_break', at([ev.veilBreak]));
    g.audio.sfx('thunder');
    scene.banner('水の衣がはじけとんだ！', 'combo');
  }
  if (fx.type === 'wave') {
    scene.fx.play('wave_charge', at([fx.actor]));
    g.audio.sfx('warn');
    scene.shake(300, 2 + fx.stage);
    scene.banner(fx.stage >= 2 ? '！次の番に大波！防御で身を守れ！' : '！水がうずをまいている…大波が来る！', 'danger');
  }
  if (fx.type === 'prison') {
    for (const id of fx.targets || []) scene.allyFx(id, 'ice', 200);
    scene.fx.play('water_prison', at(fx.targets));
    scene.banner('！水のろう！ろうを攻撃して助けよう', 'danger');
  }
  if (fx.type === 'prisonTurn') scene.allyFx(fx.actor, 'ice');
  for (const r of ev.results || []) {
    if (!r.pop) continue;
    const t = scene.c.get(r.id);
    if (!t) continue;
    t.vanished = true;
    const pt = scene.center(t);
    if (pt) scene.fx.play('prison_pop', [pt]);
    g.audio.sfx('ice');
  }
  if (ev.song) {
    scene.fx.play('song', [{ x: 128, y: 100 }]);
    scene.banner('♪水の守りの歌が、大波をやわらげた！', 'combo');
    scene.songLeft = Math.max(0, (scene.songLeft || 0) - 1);
    if (scene.songLeft <= 0 && scene.songEl) {
      scene.songEl.remove();
      scene.songEl = null;
    }
  }
  // 水のろうに とじこめられている 人の まど
  for (const a of scene.allies()) scene.statusBoxes.get(a.id)?.box.classList.toggle('prison', (a.status || []).includes('prison'));
}

// 第5章 Step 4 ガイアイーター（多部位の 戦い）と クモイ地方・古い神殿の 魔物の がめん（client/battle-ch5.js から よぶ。サーバーがわは shared/battle-gaia.js）
// ・部位の 見せかた: 左から しっぽ・体・頭（戦いの 頭は ガイアイーターの 頭の え。gaiaSprite）。ならぶと 1ぴきの 大ムカデ
// ・ねらう じゅんの ヒント（わ だけ）: 今 ねらうと よい 部位（しっぽ → 体 → 頭）に だいだいの「ねらいめ」の わ（gaiaDraw）。
//   頭は 体が 生きている 間 青い たての しるし（守られている）。しっぽが 生きている 間は 体へ 土の つぶが ながれる（土はこび）。
//   ねらう じゅんの ヒントは「ねらいめ」の わ だけ（はじめの バナーは 出さない。家族の 答え）。部位を たおすと 短い バナー
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音
import { monsterCanvas } from './render/monsters.js?v=e6a22f787154';

const TAIL = 'gaia_tail', BODY = 'gaia_body', HEAD = 'gaia_eater';
const ORDER = [TAIL, BODY, HEAD];
// 前ぶれの えんしゅつ（部位ごと）
const CHARGE = { [TAIL]: 'needle_charge', [BODY]: 'rumble_charge', [HEAD]: 'maw_charge' };

export const GAIA_SCREEN_ANIMS = ['gaia_devour', 'gaia_quake', 'needle_rain', 'gaia_dust', 'thunder_rain', 'cloud_wave', 'stomp', 'thunder_breath', 'mist', 'sleep_cloud', 'cloud_breath'];
export const GAIA_ALLY_FX = {
  gaia_bite: 'claw', gaia_sting: 'poison', gaia_coil: 'down', gaia_devour: 'quake', gaia_quake: 'quake', needle_rain: 'poison', gaia_dust: 'quake',
  wool_tackle: 'claw', ray_glide: 'claw', ray_sting: 'bolt', cloud_wave: 'wind', puff_bolt: 'bolt', thunder_rain: 'bolt', serpent_bind: 'down', cloud_breath: 'wind',
  stomp: 'quake', mole_drill: 'claw', larva_fang: 'poison', haniwa_spear: 'claw', wraith_chill: 'ice', wyvern_dive: 'claw', thunder_breath: 'bolt', tail_whip: 'bolt',
};
export const GAIA_SFX = {
  gaia_bite: 'smash', gaia_dust: 'rumble', maw_charge: 'warn', gaia_devour: 'blast', gaia_coil: 'smash', gaia_eat: 'heal', rumble_charge: 'rumble', gaia_quake: 'blast',
  gaia_sting: 'poison', gaia_feed: 'heal', needle_charge: 'warn', needle_rain: 'poison',
  wool_tackle: 'hit', sleep_cloud: 'sleep', ray_glide: 'smash', ray_sting: 'bolt', cloud_wave: 'wind', puff_bolt: 'bolt', thunder_rain: 'thunder', serpent_bind: 'smash',
  cloud_breath: 'wind', stomp: 'rumble', mole_drill: 'smash', dirt_throw: 'dig', larva_fang: 'poison', haniwa_spear: 'hit', haniwa_song: 'dark', wraith_chill: 'ice',
  mist: 'wind', wyvern_dive: 'smash', thunder_breath: 'thunder', tail_whip: 'whip',
};

// 戦いの え: ガイアイーターの 頭は 頭の え（図鑑の gaia_eater は 体ぜんぶの え）
export function gaiaSprite(c, frame = 0) {
  return c?.species === HEAD ? monsterCanvas('gaia_head', frame) : null;
}

// 今の ようす（がめんの 敵から）
export function gaiaView(scene) {
  const alive = (sp) => scene.enemies().find((e) => e.species === sp && e.alive);
  const parts = ORDER.map(alive);
  if (!parts[2] && !parts[1] && !parts[0]) return null;
  return { tail: parts[0] || null, body: parts[1] || null, head: parts[2] || null, focus: parts.find(Boolean) || null };
}

// たたかいの え（client/battle-ch5.js の towerDraw から。すがたを かいた あと）
export function gaiaDraw(scene, x, m, c, px, py, w, h, base) {
  if (!ORDER.includes(c.species) || !c.alive) return;
  const v = gaiaView(scene);
  if (!v) return;
  const T = scene.time;
  // ねらいめ（だいだいの わ ＋ 4つの つめ。ゆっくり 回る）
  if (v.focus === c) {
    const cx = Math.round(px + w / 2), cy = Math.round(py + h * 0.42);
    const r = Math.max(9, Math.min(16, w * 0.18)) + Math.sin(T / 160) * 1.2;
    x.globalAlpha = base * 0.9;
    x.strokeStyle = '#ff9a2a';
    x.lineWidth = 1;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#ffd66b';
    for (let i = 0; i < 4; i++) {
      const a = T / 900 + (i * Math.PI) / 2;
      const ex = cx + Math.cos(a) * (r + 2), ey = cy + Math.sin(a) * (r + 2);
      x.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3);
    }
    // 上の 小さな「！」
    const ty = Math.max(2, Math.round(py - 6 + Math.sin(T / 140) * 1.5));
    x.fillStyle = '#2a1206'; x.fillRect(cx - 3, ty - 1, 6, 9);
    x.fillStyle = '#ff9a2a'; x.fillRect(cx - 1, ty, 2, 4); x.fillRect(cx - 1, ty + 5, 2, 2);
  }
  // 頭: 体が 生きている 間は 青い たて（守られている）
  if (c.species === HEAD && v.body) {
    const sx = Math.round(px + w * 0.16), sy = Math.round(py + h * 0.18 + Math.sin(T / 300) * 1);
    x.globalAlpha = base * (0.75 + Math.sin(T / 200) * 0.2);
    x.fillStyle = '#10204a';
    x.fillRect(sx - 6, sy - 6, 12, 13);
    x.fillStyle = '#4aa8ff';
    x.fillRect(sx - 5, sy - 5, 10, 7); x.fillRect(sx - 4, sy + 2, 8, 2); x.fillRect(sx - 2, sy + 4, 4, 2);
    x.fillStyle = '#c8e8ff';
    x.fillRect(sx - 4, sy - 4, 3, 2); x.fillRect(sx - 1, sy - 4, 2, 7);
  }
  // 体: しっぽが 生きている 間は、しっぽから 土の つぶが ながれこむ（土はこび）
  if (c.species === BODY && v.tail) {
    x.globalAlpha = base * 0.85;
    for (let i = 0; i < 5; i++) {
      const t = ((T / 900 + i / 5) % 1);
      const ex = px - 6 + t * w * 0.35, ey = py + h * 0.62 - Math.sin(t * Math.PI) * 8;
      x.fillStyle = i % 2 ? '#94a86a' : '#a87a4e';
      x.fillRect(Math.round(ex), Math.round(ey), 2, 2);
    }
  }
  x.globalAlpha = base;
}

// イベントを 見せる とき（client/battle-ch5.js の towerPresent から）
export function gaiaPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const at = (ids) => (ids || []).map((id) => scene.c.get(id)).filter(Boolean).map((t) => (t.side === 'ally' ? scene.allyPt(t) : scene.center(t))).filter(Boolean);
  if (fx.type === 'gaiaFeed') {
    const from = at([fx.actor])[0];
    if (from) scene.fx.play('gaia_feed', [from], null, { to: at(fx.targets) });
    g.audio.sfx('heal');
  }
  if (fx.type === 'telegraph' && CHARGE[actor?.species]) scene.fx.play(CHARGE[actor.species], at([fx.actor]));
  if (ev.gaiaPart) {
    g.audio.sfx('crit');
    scene.banner(ev.gaiaPart.part === 'tail' ? 'しっぽをたおした！回復が止まった' : '体をたおした！守りがとけた', 'combo');
  }
}

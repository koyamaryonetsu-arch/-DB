// 第4章の たたかいの がめんの しかけ（client/battle.js から よぶ。サーバーがわは shared/battle-ch4.js）
// ・「道具」の コマンド: 月の鏡（まぼろしの 分身が いる 戦い）と、そうびしたまま 使う 道具（魔神のランプ）
// ・まぼろしの 分身: 本物の 足もとの 小さな 影・分身が 消える ときの えんしゅつ・まぼろしが もどる 前ぶれ
// ・ボスの 大技（砂嵐・砂の大うず・砂しぶき・大ジャンプ）は、がめんの まん中に 大きく（render/battlefx-ch4.js）
// ・砂に もぐる（Step 6 の 砂クジラ）: もぐった 敵は 砂の 山に なって ねらえない。砂が もり上がると 山が ゆれて 前ぶれ
import { ITEMS } from '../shared/data/items.js?v=2d30a5044288';
import { BW, BH } from './render/battlefx.js?v=2d30a5044288';
// 第4章 Step 7 の 砂の底の神殿と モルガナ（battle-temple.js）
import { TEMPLE_SCREEN_ANIMS, TEMPLE_ALLY_FX, templePresent } from './battle-temple.js?v=2d30a5044288';

export const MIRROR_ID = 'moon_mirror';
const MIRROR_INFO = '月の光で、まぼろしの分身をすべて消す。本物は、まぶしくて1回動けなくなる。\n使うと、光がもどるまで少し時間がかかる。';

// 敵が 使うと、がめんの まん中に 大きく 出す 技
const SCREEN_ANIMS = new Set(['sandstorm', 'sand_vortex', 'sand_spray', 'whale_jump', ...TEMPLE_SCREEN_ANIMS]);
// 味方の まどに 出す えんしゅつ（client/battle.js の allyFxKind）
export const CH4_ALLY_FX = { sandstorm: 'wind', sand_vortex: 'quake', sand_spray: 'wind', whale_jump: 'quake', ...TEMPLE_ALLY_FX };

// 「道具」の はじめに ならべる もの（a … コマンドを えらんでいる 味方）
export function ch4ItemEntries(scene, a) {
  const out = [];
  const m = scene.mirror;
  if (m) out.push({ label: ITEMS[MIRROR_ID].name, right: m.cd > 0 ? `あと${m.cd}` : '', value: MIRROR_ID, disabled: m.cd > 0 });
  const acc = a?.acc && ITEMS[a.acc]?.equipUse ? a.acc : null;
  if (acc) out.push({ label: ITEMS[acc].name, right: a.accUsed ? '使った' : '装備中', value: acc, disabled: !!a.accUsed });
  return out;
}

// えらんだ 道具が 第4章の とくべつな 道具なら、そのまま 使う（true）。だれも ねらわない
export function ch4ItemPick(scene, id) {
  if (id !== MIRROR_ID && !ITEMS[id]?.equipUse) return false;
  scene.send({ type: 'item', id });
  return true;
}

// 道具の せつめい（月の鏡は 戦いでの 使いかた）
export function ch4ItemInfo(id) {
  return id === MIRROR_ID ? MIRROR_INFO : ITEMS[id]?.desc || '';
}

// イベントを 見せる とき（presentBody）: 月の鏡の 光の のこり・月の鏡と まぼろしの えんしゅつ・ボスの 大技
export function ch4Present(scene, ev, fx, anim, actor, lead) {
  if (ev.mirror !== undefined && scene.mirror) scene.mirror.cd = ev.mirror;
  const g = scene.game;
  if (fx.type === 'mirror') {
    const pts = (fx.targets || []).map((id) => scene.c.get(id)).filter(Boolean).map((t) => scene.center(t)).filter(Boolean);
    scene.fx.play('moon_mirror', pts.length ? pts : [{ x: BW / 2, y: BH * 0.55 }]);
    g.audio.sfx('sparkle');
    scene.banner('月の鏡！まぼろしが消えた！', 'combo');
  }
  if (fx.mirage) {
    g.audio.sfx('warn');
    scene.banner('！まぼろしの分身があらわれた！', 'danger');
  }
  // 砂に もぐった（つぎの 番まで ねらえない）・砂が もり上がった（前ぶれ）・もぐっていて とどかない
  if (fx.burrow) {
    g.audio.sfx('rumble');
    scene.banner('！砂の中にもぐった！攻撃がとどかない', 'danger');
  }
  if (fx.type === 'burrowRise') {
    const t = scene.c.get(fx.actor);
    const pt = t && scene.center(t);
    if (pt) scene.fx.play('burrow_rise', [pt]);
    scene.shake(420, 3);
    g.audio.sfx('warn');
    scene.banner('！砂がもり上がった！身を守れ！', 'danger');
  }
  if (fx.type === 'burrowMiss') g.audio.sfx('miss');
  if (actor?.side === 'enemy' && SCREEN_ANIMS.has(anim)) {
    const go = () => { if (!scene.destroyed) scene.fx.play(anim, [{ x: BW / 2, y: BH * 0.62 }], null, { fromAlly: false }); };
    if (lead) scene.fx.at(lead, go);
    else go();
  }
  // 砂の底の神殿と モルガナ（はね返す・鏡写し・水の衣・大波・水のろう・水の守りの歌）
  templePresent(scene, ev, fx, anim, actor);
}

// 分身に 当たって 消えた（けっかの vanish）。たおれた ときの 音・点めつの かわりに、むらさきに ゆらいで 消える
export function vanishFx(scene, t) {
  t.vanished = true;
  scene.floatNum(t, 'まぼろし！', 'miss');
  const pt = scene.center(t);
  if (pt) scene.fx.burst(pt.x, pt.y, ['#d8b0ff', '#8a4ac8', '#ffffff'], 16, 45, { vy: -20 });
}

// 本物の 足もとの 小さな 影（地面に 落ちる。ゆれない）。m … computeLayout の 1つ、alpha … こさ
export function drawShade(x, m, alpha) {
  x.globalAlpha = alpha * 0.8;
  x.fillStyle = '#0a0414';
  x.beginPath();
  x.ellipse(m.x + m.w / 2, m.y + m.h + 0.5, m.w * 0.3, 3.2, 0, 0, Math.PI * 2);
  x.fill();
  x.globalAlpha = alpha;
}

// 砂に もぐっている 敵（すがたの かわりに 砂の 山。rising … 砂が もり上がった〈前ぶれ〉: 山が 大きく なって ゆれ、砂が はねる）
// m … computeLayout の 1つ、alpha … こさ
export function drawBurrow(x, m, time, rising, alpha) {
  const cx = m.x + m.w / 2, by = m.y + m.h;
  const k = rising ? 1 + Math.sin(time / 70) * 0.06 : 1;
  const jig = rising ? Math.round(Math.sin(time / 45) * 1.5) : 0;
  const rx = Math.max(14, m.w * 0.42) * k, ry = (rising ? 13 : 7) * k;
  x.globalAlpha = alpha;
  x.fillStyle = '#7a5a30';
  x.beginPath(); x.ellipse(cx + jig, by - 1, rx + 3, ry * 0.55 + 2, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#c89a58';
  x.beginPath(); x.ellipse(cx + jig, by - ry * 0.35, rx, ry, 0, Math.PI, 0); x.fill();
  x.fillStyle = '#e8c486';
  x.beginPath(); x.ellipse(cx + jig - rx * 0.25, by - ry * 0.75, rx * 0.4, ry * 0.3, 0, 0, Math.PI * 2); x.fill();
  // 砂の 波もよう（まわる）
  x.strokeStyle = 'rgba(255,236,190,0.7)';
  x.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const a = time / (rising ? 160 : 420) + i * 2.1;
    x.beginPath(); x.ellipse(cx + jig, by - 1, rx * (0.5 + i * 0.22), ry * 0.3 + i, 0, a, a + 1.6); x.stroke();
  }
  // もり上がる ときは 砂つぶが はねる
  if (rising) {
    x.fillStyle = '#f2d49a';
    for (let i = 0; i < 8; i++) {
      const ph = (time / 260 + i * 0.37) % 1;
      const px = cx + Math.cos(i * 2.4) * rx * 0.8, py = by - ry - ph * 18 + ph * ph * 22;
      x.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
  }
  x.globalAlpha = 1;
}

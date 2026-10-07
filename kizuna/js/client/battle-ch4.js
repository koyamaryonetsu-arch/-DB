// 第4章の たたかいの がめんの しかけ（client/battle.js から よぶ。サーバーがわは shared/battle-ch4.js）
// ・「道具」の コマンド: 月の鏡（まぼろしの 分身が いる 戦い）と、そうびしたまま 使う 道具（魔神のランプ）
// ・まぼろしの 分身: 本物の 足もとの 小さな 影・分身が 消える ときの えんしゅつ・まぼろしが もどる 前ぶれ
// ・ボスの 大技（砂嵐・砂の大うず）は、がめんの まん中に 大きく（render/battlefx-ch4.js）
import { ITEMS } from '../shared/data/items.js?v=f8e8316730dd';
import { BW, BH } from './render/battlefx.js?v=f8e8316730dd';

export const MIRROR_ID = 'moon_mirror';
const MIRROR_INFO = '月の光で、まぼろしの分身をすべて消す。本物は、まぶしくて1回動けなくなる。\n使うと、光がもどるまで少し時間がかかる。';

// 敵が 使うと、がめんの まん中に 大きく 出す 技
const SCREEN_ANIMS = new Set(['sandstorm', 'sand_vortex']);
// 味方の まどに 出す えんしゅつ（client/battle.js の allyFxKind）
export const CH4_ALLY_FX = { sandstorm: 'wind', sand_vortex: 'quake' };

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
  if (actor?.side === 'enemy' && SCREEN_ANIMS.has(anim)) {
    const go = () => { if (!scene.destroyed) scene.fx.play(anim, [{ x: BW / 2, y: BH * 0.62 }], null, { fromAlly: false }); };
    if (lead) scene.fx.at(lead, go);
    else go();
  }
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

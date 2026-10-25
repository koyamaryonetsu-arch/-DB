// 第48回 G4（ダイの大冒険 ＋ ロトの勇者 ＋ マリオ ＋ 3年B組）の 大技の テスト。この ファイルは G4 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ）は
//   test/ax-groups.test.js が AX_SKILLS_G4 を 見て やる。ここには G4 だけの「決め手」を 書く（plan-r48-fx.md 8-5）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4, ALLY_FROM, FOE_FROM } from './ax-check.js';
import { AX_TIME_G4, AX_SKILLS_G4, AX_FAMILIES_G4 } from '../public/js/shared/data/ax-time-g4.js';
import { Effects, BW } from '../public/js/client/render/battlefx.js';
import { axTiming, axDef } from '../public/js/client/render/axfx.js';
import { SFX_AX } from '../public/js/client/sfx-ax.js';

test('第48回 G4: 表と え が そろう', () => {
  const r = groupReport('g4');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_G4).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_G4)) for (const a of fam) assert.ok(a in AX_TIME_G4, a);
  for (const v of Object.values(AX_SKILLS_G4)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_G4);
});

// はなった すぐ あとの つぶ（ため の あと。まだ 待って いる つぶも ふくむ）
function released(anim, pts = ONE, o = {}) {
  const fx = new Effects();
  const fromAlly = o.fromAlly !== false;
  fx.play(anim, pts, null, { fromAlly, from: fromAlly ? ALLY_FROM : FOE_FROM, n: pts.length, ...o });
  const T = axTiming(anim, { ability: o.ability, targets: pts.length, dual: o.dual });
  let t = 0;
  while (t <= T.charge + 16) { fx.update(16); t += 16; }
  return { fx, parts: fx.parts, T };
}
const kinds = (parts, k) => parts.filter((p) => p.kind === k);

test('第48回 G4: 技は ぜんぶ 自分の 大技（6章の 62技＋今のはメラだ・合体技 2つ）', () => {
  assert.equal(Object.keys(AX_SKILLS_G4).length, 65);
  for (const id of ['daichi', 'kaiha', 'kuuretsu', 'star_strash', 'dk_doruora', 'ryumajin_sig', 'am_medroa', 'hr_gigadein', 'lt_minadein', 'lt_gigacross', 'mario_sig', 'homeroom_3b_sig', 'dt_minadein', 'dt_sotsugyou']) assert.ok(AX_SKILLS_G4[id], id);
});

test('第48回 G4: アバンストラッシュは「A」の 光の 斬げき', () => {
  const { parts } = released('ax_avan_strash', ONE, { ability: 'star_strash' });
  const a = kinds(parts, 'g4AStrash');
  assert.equal(a.length, 1);
  assert.ok(Math.hypot(a[0].x - ONE[0].x, a[0].y - ONE[0].y) < 10, 'A は 的の 上');
});

test('第48回 G4: ドルオーラは 両手の あいだの 球 → 竜の あたまが 先に ついた 光線', () => {
  const { parts } = released('ax_doruora', ONE, { ability: 'dk_doruora' });
  const orb = kinds(parts, 'axOrb')[0];
  const beams = kinds(parts, 'axBeam');
  const heads = kinds(parts, 'g4Dragon').filter((p) => p.travel > 0);
  assert.ok(orb && !(orb.delay > 0), '球は はなつ しゅんかん から');
  assert.ok(beams.length >= 1 && beams.every((b) => b.delay >= 150), '光線は 球の あと');
  assert.ok(beams.some((b) => b.w >= 15), '極太');
  assert.equal(heads.length, 1);
  assert.ok(Math.hypot(heads[0].x1 - ONE[0].x, heads[0].y1 - ONE[0].y) < 20, '竜の あたまが 的へ');
  // 竜魔の大波動は もっと 太い
  const big = Math.max(...kinds(released('ax_ryuma_daihadou', ONE, { ability: 'ryumajin_sig' }).parts, 'axBeam').map((b) => b.w));
  assert.ok(big > Math.max(...beams.map((b) => b.w)));
});

test('第48回 G4: メドローアは 赤と 青が 1つに なって から 弓で 撃ち、爆発 しないで 消える', () => {
  const { parts } = released('ax_medroa', ONE, { ability: 'am_medroa' });
  const orbs = kinds(parts, 'axOrb');
  const red = orbs.find((p) => p.color === '#ff5a2a'), blue = orbs.find((p) => p.color === '#3aa8ff');
  assert.ok(red && blue, '赤い ほのお と 青い こおり');
  assert.ok(red.x0 < blue.x0, '左右の 手');
  assert.equal(red.x1, blue.x1);
  assert.equal(red.y1, blue.y1);
  const bow = kinds(parts, 'g4Bow')[0], arrow = kinds(parts, 'g4Arrow')[0], ball = kinds(parts, 'g4Void')[0];
  assert.ok(bow && arrow && ball, '弓・矢・消滅の 球');
  assert.ok(bow.delay >= red.start + red.travel - 20, '1つに なって から 弓');
  assert.ok(arrow.delay >= bow.delay, '弓の あと 矢');
  // 爆発の 火花が ドルオーラより ずっと 少ない
  const sparks = (a, id) => kinds(released(a, ONE, { ability: id }).parts, 'spark').length;
  assert.ok(sparks('ax_medroa', 'am_medroa') * 2 < sparks('ax_doruora', 'dk_doruora'));
});

test('第48回 G4: ギガクロスブレイクと 竜魔の十字斬りは 十字（たて → よこ）', () => {
  const gc = kinds(released('ax_giga_cross_break', THREE, { ability: 'lt_gigacross' }).parts, 'g4Cross');
  assert.equal(gc.length, 1, 'ギガクロスは 大きな 金の 十字 1つ');
  assert.ok(gc[0].h2 > 0 && gc[0].s >= 50);
  assert.equal(gc[0].color, '#ffe060');
  const rj = kinds(released('ax_ryuma_juuji', THREE, { ability: 'hi_ryuma_juuji' }).parts, 'g4Cross');
  assert.equal(rj.length, 3, '竜魔の十字は 敵ごとに むらさきの 十字');
  assert.ok(rj.every((p) => p.color === '#c88aff'));
});

test('第48回 G4: ギガデインは 空から 敵ごとに いなずま、テラデインは 画面の 3分の1の 柱', () => {
  const bolts = kinds(released('ax_gigadein', THREE, { ability: 'hr_gigadein' }).parts, 'axBolt').filter((p) => p.y0 < 0);
  for (const t of THREE) assert.ok(bolts.some((b) => Math.abs(b.x1 - t.x) < 2 && b.w >= 4), `${t.x} に 太い いなずま`);
  const tera = released('ax_teradein', ONE, { ability: 'lt_minadein' }).parts;
  const pillar = kinds(tera, 'axBeam').filter((b) => b.y0 < 0 && b.x0 === b.x1);
  assert.ok(pillar.some((b) => b.w * 2.5 >= BW / 3), '画面の 3分の1');
  assert.ok(kinds(tera, 'g4Cloud').length >= 1, '雷雲の うず');
});

test('第48回 G4: ミナデインは 4人の いちから 光が 空へ あつまって から いなずま', () => {
  const { parts, T } = released('ax_minadein', ONE, { ability: 'dt_minadein', dual: true });
  const up = kinds(parts, 'axDash').filter((p) => p.y0 > 120 && p.y1 < 30);
  assert.equal(up.length, 4);
  const bolt = kinds(parts, 'axBolt').find((p) => Math.abs(p.x1 - ONE[0].x) < 2 && p.y0 < 30);
  assert.ok(bolt && bolt.delay >= Math.max(...up.map((p) => p.delay + p.travel)), 'あつまった あと');
  assert.equal(T.charge, 0);
});

test('第48回 G4: マリオの 技は 男の子が マリオ色・女の子が ピーチ色', () => {
  const caps = (masc) => kinds(released('ax_hip_drop', ONE, { ability: masc ? 'mr_hip@masc' : 'mr_hip', masc }).parts, 'g4Obj').filter((p) => p.shape === 'runner').map((p) => `${p.color}|${p.cap}`);
  const boy = caps(true), girl = caps(false);
  assert.ok(boy.length && girl.length);
  assert.ok(boy.every((c) => c === '#2a3a9a|#e83a2a'), '赤い ぼうしと 青い ふく');
  assert.ok(girl.every((c) => c === '#ff6ab0|#ffd23a'), 'ピンクの ドレスと 金の かんむり');
  // スーパースターラッシュは 虹色
  const rush = kinds(released('ax_superstar_rush', ONE, { ability: 'mario_sig' }).parts, 'g4Obj').filter((p) => p.shape === 'runner');
  assert.ok(rush.length >= 3 && rush.every((p) => Array.isArray(p.cols) && p.cols.length >= 5));
});

test('第48回 G4: 3年B組の 愛のお説教は ハートの 波と「この、ばかちんが！」、人という字は 2画', () => {
  const { parts } = released('ax_ai_no_sekkyou', THREE, { ability: 'homeroom_3b_sig' });
  assert.ok(kinds(parts, 'g4HeartWave').length >= 3 + 1);
  assert.ok(kinds(parts, 'g4Text').some((p) => p.text.includes('ばかちん')));
  assert.ok(kinds(parts, 'g4Bg').some((p) => p.v === 'sunset'), '夕日');
  assert.equal(kinds(released('ax_hito_to_iu_ji', ALLY4, { ability: 'h3_hito' }).parts, 'g4Hito').length, 1);
});

test('第48回 G4: なかまは 段が 上がるほど 長い（ギガブレイク → ギガクロス、ドルオーラ → 竜魔の大波動、ギガデイン → テラデイン）', () => {
  const tot = (a, id) => axTiming(a, { ability: id }).total;
  assert.ok(tot('ax_giga_break', 'dk_gigabreak') < tot('ax_giga_cross_break', 'lt_gigacross'));
  assert.ok(tot('ax_doruora', 'dk_doruora') < tot('ax_ryuma_daihadou', 'ryumajin_sig'));
  assert.ok(tot('ax_gigadein', 'hr_gigadein') < tot('ax_jigodein', 'hi_jigodein'));
  assert.ok(tot('ax_jigodein', 'hi_jigodein') < tot('ax_teradein', 'lt_minadein'));
  assert.ok(tot('ax_kaihazan', 'kaiha') < tot('ax_avan_strash', 'star_strash'));
});

test('第48回 G4: 敵が まねても（ノクトの影）味方に 下むきに 出て こわれない', () => {
  for (const [anim, id] of [['ax_doruora', 'dk_doruora'], ['ax_teradein', 'lt_minadein'], ['ax_superstar_rush', 'mario_sig'], ['ax_ai_no_sekkyou', 'homeroom_3b_sig']]) {
    const r = playAx(anim, ALLY4, { ability: id, fromAlly: false, toParty: true, n: 4 });
    assert.deepEqual(r.errors, [], anim);
    assert.equal(r.far, null, anim);
  }
  void ALLY1;
});

test('第48回 G4: 音は ぜんぶ 0.8びょう いない', () => {
  for (const anim of Object.keys(AX_TIME_G4)) {
    const id = axDef(anim).sfx;
    let end = 0;
    const a = { tone: () => {}, noise: (dur, o = {}) => { end = Math.max(end, (o.delay || 0) + dur); } };
    const T = (f, dur, o = {}) => { end = Math.max(end, (o.delay || 0) + dur); };
    SFX_AX[id](a, T);
    assert.ok(end <= 0.8 + 1e-9, `${id}: ${end.toFixed(2)}s`);
  }
});

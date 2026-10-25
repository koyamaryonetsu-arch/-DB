// 第48回 G1（ドラゴンボール ＋ ドラえもん ＋ はなかっぱ）の 大技の テスト。この ファイルは G1 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ）は
//   test/ax-groups.test.js が AX_SKILLS_G1 を 見て やる。ここには G1 だけの「決め手」を 書く（plan-r48-fx.md 8-5）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4, ALLY_FROM, FOE_FROM } from './ax-check.js';
import { Effects } from '../public/js/client/render/battlefx.js';
import { axDef, axTiming, axAnimFor } from '../public/js/client/render/axfx.js';
import { AX_TIME_G1, AX_SKILLS_G1, AX_FAMILIES_G1 } from '../public/js/shared/data/ax-time-g1.js';
import { SFX_AX_G1 } from '../public/js/client/sfx-ax-g1.js';

// うごかして 出た つぶを ぜんぶ あつめる（kind ごと）
function seen(anim, pts = ONE, opts = {}) {
  const fx = new Effects();
  const all = [];
  const add = fx.add.bind(fx);
  fx.add = (p) => { all.push(p); return add(p); };
  fx.play(anim, pts, null, { fromAlly: true, from: ALLY_FROM, ...opts });
  for (let t = 0; t < 4000 && (fx.parts.length || fx.bolts.length); t += 16) fx.update(16);
  return all;
}
const kinds = (parts, k) => parts.filter((p) => p.kind === k);

test('第48回 G1: 表と え が そろう', () => {
  const r = groupReport('g1');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_G1).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_G1)) for (const a of fam) assert.ok(a in AX_TIME_G1, a);
  for (const v of Object.values(AX_SKILLS_G1)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_G1);
});

test('第48回 G1: 6章の 技 82こ（＋合体技）が ぜんぶ 自分の anim に つながる', () => {
  const keys = Object.keys(AX_SKILLS_G1);
  assert.equal(keys.length, 82);
  assert.equal(new Set(Object.values(AX_SKILLS_G1)).size, 82, 'anim は 技ごとに ちがう');
  for (const k of keys) assert.equal(axAnimFor(k), AX_SKILLS_G1[k], k);
  assert.equal(AX_SKILLS_G1.dt_gomu_kame, 'ax_gomu_kame');
  assert.equal(AX_TIME_G1.ax_gomu_kame.charge, false);
});

test('第48回 G1: かめはめ波は 段が 上がるほど ビームが 太い（B < A < S < L）', () => {
  const fam = ['ax_kamehameha', 'ax_kamehameha_super', 'ax_kamehameha_spark', 'ax_kamehameha_kiwami'];
  const tiers = fam.map((a) => AX_TIME_G1[a].tier);
  assert.deepEqual(tiers, ['basic', 'advanced', 'super', 'legend']);
  const defW = fam.map((a) => axDef(a).beamW);
  const real = fam.map((a) => Math.max(...kinds(seen(a), 'g1Beam').map((p) => p.w)));
  for (let i = 1; i < fam.length; i++) {
    assert.ok(defW[i] > defW[i - 1], `beamW ${fam[i]}`);
    assert.ok(real[i] > real[i - 1], `ビームの はば ${fam[i]} ${real[i]} > ${real[i - 1]}`);
  }
  assert.ok(real[3] >= 30, 'かめはめ波・極 は 画面の 半分くらいの 太さ');
  // 見分け: 超 は 金の ふち、スパーク は いなずまが まとわる、極 は らせん
  const b = (a) => kinds(seen(a), 'g1Beam')[0];
  assert.equal(b('ax_kamehameha').rim, null);
  assert.ok(b('ax_kamehameha_super').rim);
  assert.ok(b('ax_kamehameha_spark').zap);
  assert.ok(b('ax_kamehameha_kiwami').spiral);
});

test('第48回 G1: 10倍かめはめ波は 赤・ファイナルフラッシュは 黄色・ビッグバンかめはめ波は 2色の よじれ・魔閃光は 細い', () => {
  const red = kinds(seen('ax_kamehameha_x10', THREE), 'g1Beam')[0];
  assert.match(red.rim, /^#ff3a2a$/i);
  assert.ok(red.path && red.path.length === 3, '敵ぜんぶを なぎはらう');
  for (const a of Object.keys(AX_TIME_G1)) {
    if (a === 'ax_kamehameha_x10') continue;
    for (const p of kinds(seen(a), 'g1Beam')) assert.notEqual(p.rim, '#ff3a2a', `赤は 10倍 だけ: ${a}`);
  }
  const ff = kinds(seen('ax_final_flash'), 'g1Beam')[0];
  assert.match(ff.color, /^#ff[c-f][0-9a-f]00$/i, 'ファイナルフラッシュは 黄色');
  const bb = kinds(seen('ax_bigbang_kame', THREE), 'g1Beam')[0];
  assert.equal(bb.twist.length, 2);
  const ms = kinds(seen('ax_masenkou'), 'g1Beam')[0];
  assert.ok(ms.w < kinds(seen('ax_kamehameha'), 'g1Beam')[0].w, '魔閃光は かめはめ波より 細い');
  // ビッグバンアタックは ビームで なく 玉 → ドーム
  const big = seen('ax_bigbang', THREE);
  assert.equal(kinds(big, 'g1Beam').length, 0);
  assert.ok(kinds(big, 'g1Ball').length && kinds(big, 'g1Dome').length);
});

test('第48回 G1: 元気玉は 玉の 半径が 50 いじょう・はかい玉は オレンジの 太陽・竜拳は 竜', () => {
  const gk = kinds(seen('ax_genkidama', THREE), 'g1Ball');
  assert.ok(Math.max(...gk.map((p) => p.r)) >= 50);
  assert.ok(gk.some((p) => p.style === 'genki'));
  const hk = kinds(seen('ax_hakaidama', THREE), 'g1Ball');
  assert.ok(hk.some((p) => p.style === 'sun' && p.r >= 50), 'はかい玉は 太陽の ような 大きな オレンジの 玉');
  assert.ok(kinds(seen('ax_ryuuken'), 'g1Dragon').length === 1);
  assert.ok(kinds(seen('ax_hakai'), 'g1Hakai').length === 1, 'はかいは 光の 粉に くずれる 膜');
  assert.ok(kinds(seen('ax_kienzan'), 'g1Disc').length === 1, '気円斬は 円盤');
});

test('第48回 G1: 伝説の 技は はなつ あいだ くらく・はいけい つき', () => {
  for (const [a, e] of Object.entries(AX_TIME_G1)) {
    if (e.tier !== 'legend') continue;
    const parts = seen(a, e.party ? ALLY1 : ONE);
    assert.ok(kinds(parts, 'g1Bg').length >= 1, `${a}: はいけい`);
    assert.ok(kinds(parts, 'axTint').some((p) => p.a >= 0.5), `${a}: くらく`);
  }
});

test('第48回 G1: ドラえもん・はなかっぱの 道具と 花', () => {
  const props = (a, pts = ONE) => kinds(seen(a, pts), 'g1Prop').map((p) => p.prop);
  assert.ok(props('ax_dorayaki', ALLY1).includes('dorayaki'));
  assert.ok(props('ax_manmaru_zutsuki').includes('robo'));
  assert.ok(props('ax_kuukihou').includes('cannon'));
  assert.ok(kinds(seen('ax_kuukihou'), 'g1Air').length === 3, '空気ほうの 輪 3つ');
  assert.ok(props('ax_chikyu_hakai_bakudan', THREE).includes('bomb'));
  assert.ok(kinds(seen('ax_chikyu_hakai_bakudan', THREE), 'g1Boom').length >= 1, 'マンガの 爆発');
  assert.ok(props('ax_suzu_no_ne', THREE).includes('bell'));
  assert.ok(props('ax_kyuuri_shuriken', THREE).includes('slice'));
  assert.ok(kinds(seen('ax_pakkaan', THREE), 'g1Flower').some((p) => p.r >= 20), 'パッカーンは 大きな 花');
  assert.ok(kinds(seen('ax_kawanagare', THREE), 'g1River').length === 1, '川流れは 川の 帯');
  for (const a of ['ax_dorayaki_wake', 'ax_hana_no_mitsu', 'ax_takecopter']) {
    const n = kinds(seen(a, ALLY4), a === 'ax_hana_no_mitsu' ? 'g1Flower' : 'g1Prop').length;
    assert.ok(n >= 4, `${a}: 味方 1人ずつに`);
  }
});

test('第48回 G1: 敵が まねても 下向きに 出る（かめはめ波の ビームは 敵 → 味方）', () => {
  for (const a of ['ax_kamehameha', 'ax_kamehameha_kiwami']) {
    const fx = new Effects();
    const all = [];
    const add = fx.add.bind(fx);
    fx.add = (p) => { all.push(p); return add(p); };
    fx.play(a, ALLY4, null, { fromAlly: false, toParty: true, from: FOE_FROM });
    for (let t = 0; t < 4000 && fx.parts.length; t += 16) fx.update(16);
    const beam = kinds(all, 'g1Beam')[0];
    assert.ok(beam.ty > beam.y0, `${a}: 下向き`);
    assert.ok(beam.path && beam.path.length === 4, `${a}: 味方 みんなを なぎはらう`);
  }
});

test('第48回 G1: 2回目は ため 半分・合体技は ため なし・つぶは end までに きえる', () => {
  for (const a of ['ax_kamehameha_kiwami', 'ax_genkidama', 'ax_hakaidama']) {
    const t1 = axTiming(a, {}), t2 = axTiming(a, { repeat: true });
    assert.equal(t2.charge, Math.round(t1.charge / 2));
    const r = playAx(a, THREE, { repeat: true });
    assert.ok(r.t <= t2.end + 300, `${a}: ${r.t}`);
    assert.deepEqual(r.errors, []);
  }
  const d = axTiming('ax_gomu_kame', { ability: 'dt_gomu_kame', dual: true });
  assert.equal(d.charge, 0);
});

test('第48回 G1: 音は 0.8びょう まで', () => {
  for (const [id, fn] of Object.entries(SFX_AX_G1)) {
    let end = 0;
    const a = { noise: (dur, o = {}) => { end = Math.max(end, (o.delay || 0) + dur); } };
    fn(a, (f, dur, o = {}) => { end = Math.max(end, (o.delay || 0) + dur); });
    assert.ok(end <= 0.8 + 1e-9, `${id}: ${end.toFixed(2)}s`);
  }
});

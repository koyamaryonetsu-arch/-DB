// 第49回 O3（会社と お金） の もとからの 技の テスト。この ファイルは O3 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算（もとからの 技の AX_BUDGET_ORIG）・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ・漢字なし）は
//   test/ax-groups.test.js が AX_SKILLS_O3 を 見て やる。ここには O3 だけの「決め手」を 書く（plan-r49-fx.md 7-3）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4, ALLY_FROM, FOE_FROM } from './ax-check.js';
import { AX_TIME_O3, AX_SKILLS_O3, AX_FAMILIES_O3 } from '../public/js/shared/data/ax-time-o3.js';
import { Effects, BW } from '../public/js/client/render/battlefx.js';
import { axTiming, axDef } from '../public/js/client/render/axfx.js';
import { O3_SHAPES } from '../public/js/client/render/axfx-o3-lib.js';

test('第49回 O3: 表と え が そろう', () => {
  const r = groupReport('o3');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O3).length, r.anims.length);
  assert.equal(Object.keys(AX_SKILLS_O3).length, 85, 'plan-r49-fx.md 6章の O3 の 技 85こ');
  for (const fam of Object.values(AX_FAMILIES_O3)) for (const a of fam) assert.ok(a in AX_TIME_O3, a);
  for (const v of Object.values(AX_SKILLS_O3)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_O3);
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
const objs = (parts, shape) => parts.filter((p) => p.kind === 'o3Obj' && (!shape || p.shape === shape));
const keyOf = (anim) => Object.entries(AX_SKILLS_O3).find(([, v]) => v === anim)?.[0];

test('第49回 O3: どの 技も 自分の 大きな 絵（名刺・かばん・ハンコ・電車…）を 出す', () => {
  for (const anim of Object.keys(AX_TIME_O3)) {
    const party = axDef(anim).party;
    const { parts } = released(anim, party ? ALLY1 : ONE, { ability: keyOf(anim), dual: keyOf(anim)?.startsWith('dt_') });
    const own = parts.filter((p) => p.kind === 'o3Obj' || p.kind === 'o3Line');
    assert.ok(own.length >= 1, `${anim}: o3 の 絵が ない`);
    for (const p of objs(parts)) assert.ok(O3_SHAPES.includes(p.shape), `${anim}: 絵 ${p.shape}`);
  }
});

test('第49回 O3: カットインの 帯・画面の くらさ を 出さない（背景は 0.6s・0.35 まで）', () => {
  for (const anim of Object.keys(AX_TIME_O3)) {
    const party = axDef(anim).party;
    const { parts } = released(anim, party ? ALLY4 : THREE, { ability: keyOf(anim) });
    assert.equal(parts.filter((p) => p.kind === 'axBand').length, 0, `${anim}: カットイン`);
    for (const p of parts.filter((q) => q.kind === 'axTint')) assert.ok(p.a <= 0.15 && p.life <= 300, `${anim}: tint`);
    for (const p of parts.filter((q) => q.kind === 'o3Bg')) assert.ok(p.a <= 0.35 && p.life <= 600, `${anim}: 背景 ${p.a} ${p.life}`);
  }
});

test('第49回 O3: なかまは 段が 上がるほど 豪華（カード・ゴルフ・会社の 体当たり）', () => {
  const n = (anim) => playAx(anim, ONE, { ability: keyOf(anim) }).maxParts;
  const card = ['ox_card_shu', 'ox_cardman_dance', 'ox_okaimono_marathon'].map(n);
  assert.ok(card[0] < card[1] && card[1] < card[2], `カード ${card}`);
  assert.ok(n('ox_golf_swing') < n('ox_settai_golf'), 'ゴルフ');
  const body = ['ox_kaban_attack', 'ox_tobikomi_eigyo', 'ox_shucchou_rush', 'ox_oneman'].map(n);
  for (let i = 1; i < body.length; i++) assert.ok(body[i] > body[i - 1], `体当たり ${body}`);
  // ハンコ: 社長命令の ハンコは 決さいより 大きい
  const hk = (anim) => Math.max(...objs(released(anim, ALLY1, { ability: keyOf(anim) }).parts, 'hanko').map((p) => p.s));
  assert.ok(hk('ox_shachou_meirei') > hk('ox_kessai') * 1.3);
});

test('第49回 O3: プライベートジェット・通勤ラッシュは 画面の はしから はしへ', () => {
  for (const [anim, shape] of [['ox_private_jet', 'jet'], ['ox_tsukin_rush', 'train']]) {
    const { parts } = released(anim, THREE, { ability: keyOf(anim), dual: anim === 'ox_tsukin_rush' });
    const ps = objs(parts, shape);
    assert.ok(ps.length >= 1, anim);
    const xs = ps.flatMap((p) => [p.x0, p.x1 ?? p.x0]);
    assert.ok(Math.min(...xs) < 0 && Math.max(...xs) > BW, `${anim}: ${xs}`);
  }
});

test('第49回 O3: ランダムで なん回も 当たる 技は 回数ぶん 光る（年末 6・ワンオペ 5・出張 4・終電 4・お買い物 6）', () => {
  for (const [anim, hits] of [['ox_nenmatsu', 6], ['ox_wanope', 5], ['ox_shucchou_rush', 4], ['ox_shuuden_dash', 4], ['ox_okaimono_marathon', 6]]) {
    const { parts } = released(anim, ONE, { ability: keyOf(anim) });
    const rings = parts.filter((p) => p.kind === 'shock' && Math.hypot(p.x - ONE[0].x, p.y - ONE[0].y) < 4);
    assert.ok(rings.length >= hits, `${anim}: ${rings.length}`);
  }
});

test('第49回 O3: 敵が まねて 味方に つかっても 下むきに 出る（トップダウン・終電ダッシュ）', () => {
  for (const anim of ['ox_top_down', 'ox_buatsui_hakusho']) {
    const { parts } = released(anim, ALLY4, { ability: keyOf(anim), fromAlly: false, toParty: true });
    const big = objs(parts).filter((p) => p.travel > 0);
    assert.ok(big.length >= 1, anim);
    for (const p of big) assert.ok(p.y1 > p.y0, `${anim}: 上から 下へ`);
  }
  const m = playAx('ox_shuuden_dash', ALLY4, { ability: 'sk_shuuden', fromAlly: false, toParty: true });
  assert.deepEqual(m.errors, []);
});
void [ALLY1, ALLY4];

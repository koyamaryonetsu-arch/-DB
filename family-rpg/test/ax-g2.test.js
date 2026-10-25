// 第48回 G2（ナルト ＋ ワンピース ＋ 京急 ＋ 野球）の 大技の テスト。この ファイルは G2 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ）は
//   test/ax-groups.test.js が AX_SKILLS_G2 を 見て やる。ここには G2 だけの「決め手」を 書く（plan-r48-fx.md 8-5）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4, ALLY_FROM, FOE_FROM } from './ax-check.js';
import { AX_TIME_G2, AX_SKILLS_G2, AX_FAMILIES_G2 } from '../public/js/shared/data/ax-time-g2.js';
import { Effects } from '../public/js/client/render/battlefx.js';
import { axTiming, axDef } from '../public/js/client/render/axfx.js';
import { kf } from '../public/js/client/render/axfx-g2-kit.js';

// 1回 うごかして、足された つぶを ぜんぶ あつめる（kind ごと）
function collect(anim, pts = ONE, o = {}) {
  const fx = new Effects();
  const seen = [];
  const add = fx.add.bind(fx);
  fx.add = (p) => { seen.push(p); return add(p); };
  fx.play(anim, pts, null, { fromAlly: o.fromAlly !== false, from: o.fromAlly === false ? FOE_FROM : ALLY_FROM, toParty: o.fromAlly === false, ...o });
  for (let t = 0; t < 6000 && (fx.parts.length || fx.bolts.length); t += 16) fx.update(16);
  const of = (kind) => seen.filter((p) => p.kind === kind);
  return { seen, of, T: axTiming(anim, { ability: o.ability, targets: pts.length }) };
}

test('第48回 G2: 表と え が そろう（59技・59 anim）', () => {
  const r = groupReport('g2');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_G2).length, r.anims.length);
  assert.equal(Object.keys(AX_SKILLS_G2).length, 59);
  assert.equal(new Set(Object.values(AX_SKILLS_G2)).size, 59);
  for (const fam of Object.values(AX_FAMILIES_G2)) for (const a of fam) assert.ok(a in AX_TIME_G2, a);
  for (const v of Object.values(AX_SKILLS_G2)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_G2);
});

test('第48回 G2: らせん丸は 発射から 命中まで 玉が 敵の 方へ 動く（敵が 味方に つかっても）', () => {
  for (const [pts, o] of [[ONE, {}], [ALLY1, { fromAlly: false }]]) {
    const { of, T } = collect('ax_rasengan', pts, { ability: 'konoha_sig', ...o });
    const ball = of('g2Spiral')[0];
    assert.ok(ball, 'らせん丸の 玉');
    const t = pts[0];
    const d0 = Math.hypot(kf(ball.keys, 0)[0] - t.x, kf(ball.keys, 0)[1] - t.y);
    const dh = Math.hypot(kf(ball.keys, T.release)[0] - t.x, kf(ball.keys, T.release)[1] - t.y);
    assert.ok(d0 > 40, `はじめは 手もと（${d0}）`);
    assert.ok(dh < 2, `あたる ときは 的（${dh}）`);
    // あたってから うずが 大きく えぐる
    assert.ok(kf(ball.keys, T.release + 300)[2] > kf(ball.keys, T.release)[2] * 1.8);
  }
});

test('第48回 G2: らせん手裏剣は 風の 刃つきの 玉 → 白い 風の ドーム', () => {
  const { of } = collect('ax_rasenshuriken', THREE, { ability: 'kh_shuriken' });
  assert.ok(of('g2Spiral').some((p) => p.blades), '風の 刃');
  assert.ok(!collect('ax_rasengan').of('g2Spiral').some((p) => p.blades), 'らせん丸には 刃 なし');
  assert.equal(of('g2Dome').length, 1);
});

test('第48回 G2: らせん丸の なかまは 玉が 大きく なる・多重は 6つの うずが 1つに', () => {
  // あたる ときの 玉の 大きさ
  const big = (anim) => { const T = axTiming(anim, { targets: 1 }); return kf(collect(anim).of('g2Spiral')[0].keys, T.release)[2]; };
  assert.ok(big('ax_oodama_rasengan') > big('ax_rasengan') * 1.8, '大玉は 2倍');
  const tj = collect('ax_tajuu_rasengan', THREE).of('g2Spiral');
  assert.ok(tj.length >= 7, '6人ぶんの 玉 ＋ 大うず');
  assert.ok(Math.max(...tj.flatMap((p) => p.keys.map((k) => k[3]))) >= 30, 'さいごの 大うず');
});

test('第48回 G2: 影分身は ボンの けむりと オレンジの 分身・多重影分身は 30こ いじょう', () => {
  const k = collect('ax_kagebunshin', ALLY1, { ability: 'kh_bunshin' });
  assert.ok(k.of('g2Pop').length >= 8 && k.of('g2Ninja').length >= 4);
  const t = collect('ax_tajuu_kagebunshin', THREE, { ability: 'hokage_sig' });
  assert.ok(t.of('g2Pop').length >= 30, `けむり ${t.of('g2Pop').length}`);
  assert.ok(t.of('g2Ninja').length >= 30, `分身 ${t.of('g2Ninja').length}`);
  // きつねの衣は 9本の しっぽ
  assert.equal(collect('ax_kyuubi_koromo', ALLY1).of('g2Tails')[0].n, 9);
});

test('第48回 G2: 赤い 電車の 車両の かず 4 < 8 < 12（なかまが 上がる ほど 長い）', () => {
  const cars = (anim, ability) => Math.max(...collect(anim, THREE, { ability }).of('g2Train').map((p) => p.cars));
  const c = [cars('ax_keikyu_120', 'kq_120'), cars('ax_akai_kaitoku', 'kq_kaitoku'), cars('ax_12ryou_renketsu', 'kqp_renketsu')];
  assert.deepEqual(c, [4, 8, 12]);
  // 赤い快特は 2往復（2本 目は はんたいから）、全線大快特は 3方向から 3本
  assert.equal(collect('ax_akai_kaitoku', THREE).of('g2Train').length, 2);
  const z = collect('ax_zensen_daikaitoku', THREE).of('g2Train');
  assert.equal(z.length, 3);
  assert.equal(new Set(z.map((p) => Math.round(p.ang * 10))).size, 3, '左・右・空中');
  // 京急は 赤い 車体と 白い 帯（灰色は 追いこされる 電車だけ）
  for (const p of z) assert.equal(p.body, undefined);
  assert.ok(collect('ax_kaitoku_oikoshi').of('g2Train').some((p) => p.body && p.body !== '#d8102a'));
});

test('第48回 G2: ゴムの パンチは のびる うで（ギア3は 画面の 3分の1・太陽のパンチは 白い 炎）', () => {
  const widest = (anim, pts = ONE) => Math.max(...collect(anim, pts).of('g2Arm').flatMap((p) => p.keys.map((k) => k[3])));
  const pistol = collect('ax_gomu_pistol').of('g2Arm');
  // のびて ちぢむ（先が 的まで とどいて、さいごは ねもとに もどる）
  const a = pistol.find((p) => !p.alpha);
  const T = axTiming('ax_gomu_pistol', { targets: 1 });
  assert.ok(Math.hypot(kf(a.keys, T.release)[0] - ONE[0].x, kf(a.keys, T.release)[1] - ONE[0].y) < 2);
  assert.ok(Math.hypot(kf(a.keys, 99999)[0] - a.bx, kf(a.keys, 99999)[1] - a.by) < 20);
  assert.ok(collect('ax_gomu_bazooka').of('g2Arm').filter((p) => p.hand === 'palm' && !p.alpha).length === 2, 'バズーカは 両手の ひら');
  assert.ok(widest('ax_gear3_gigant', THREE) >= 30, 'ギガント');
  assert.ok(widest('ax_gear3_gigant', THREE) > widest('ax_gomu_pistol') * 4);
  const sun = collect('ax_nika_sun_punch').of('g2Arm');
  assert.ok(sun.some((p) => p.style === 'white' && p.flame));
  assert.ok(collect('ax_gomu_gatling', THREE).of('g2Arm').length >= 30, 'ガトリングは 無数の こぶし');
});

test('第48回 G2: ギア2・4・5 は ルフィの すがた（5は 白い 雲と「ハハハ」）', () => {
  const gear = (anim) => collect(anim, ALLY1).of('g2Luffy')[0]?.gear;
  assert.equal(gear('ax_gear2'), 2);
  assert.equal(gear('ax_gear4'), 4);
  assert.equal(gear('ax_gear5'), 5);
  const g5 = collect('ax_gear5', ALLY1);
  assert.ok(g5.of('g2Cloud').length >= 1);
  assert.ok(g5.of('g2Text').some((p) => p.str === 'ハハハ'));
  assert.ok(g5.of('g2Bg').some((p) => p.style === 'sun'));
  // 解放の戦士は 大きな 白い ニカ
  assert.equal(collect('ax_kaihou_senshi', THREE).of('g2Nika').length, 1);
});

test('第48回 G2: ホームランは バットで 打って 球が とぶ・サヨナラは 花火 3発', () => {
  const s = collect('ax_ougon_sayonara', THREE, { ability: 'hall_of_fame_sig' });
  assert.ok(s.of('g2Bat').some((p) => p.gold), '金の バット');
  assert.ok(s.of('g2Firework').length >= 3);
  assert.ok(s.of('g2Bg').some((p) => p.style === 'stadium'));
  assert.equal(collect('ax_3daseki_renzoku').of('g2Bat').length, 3, '3打席');
  assert.equal(collect('ax_sansha_sanshin', THREE).of('g2Text').filter((p) => p.str === 'K').length, 3);
  assert.ok(collect('ax_kieru_makyu').of('g2Ball').some((p) => p.vanish && p.vanish.length >= 3), '消える魔球は とちゅうで 消える');
});

test('第48回 G2: 画面の 字は 線の 字（ハ・K・5・0・!・Z・オ・ー）だけ', () => {
  const ok = new Set([...'ハK50!Zオー']);
  for (const anim of Object.keys(AX_TIME_G2)) {
    const pts = axDef(anim).party ? ALLY1 : ONE;
    for (const p of collect(anim, pts).of('g2Text')) for (const ch of p.str) assert.ok(ok.has(ch), `${anim}: ${ch}`);
  }
});

test('第48回 G2: 敵が まねて 味方 4人に つかっても こわれない（らせん丸・ギア3・赤い快特・サヨナラ）', () => {
  for (const anim of ['ax_rasengan', 'ax_gear3_gigant', 'ax_akai_kaitoku', 'ax_ougon_sayonara', 'ax_bijuudama', 'ax_tajuu_kagebunshin']) {
    const r = playAx(anim, ALLY4, { fromAlly: false, toParty: true, n: 4 });
    assert.deepEqual(r.errors, [], anim);
    assert.equal(r.log.nan.length, 0, anim);
    assert.equal(r.far, null, anim);
  }
});

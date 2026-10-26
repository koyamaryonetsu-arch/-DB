// 第49回 O4（町の 仕事・乗り物・設備・スポーツ） の もとからの 技の テスト。この ファイルは O4 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算（もとからの 技の AX_BUDGET_ORIG）・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ・漢字なし）は
//   test/ax-groups.test.js が AX_SKILLS_O4 を 見て やる。ここには O4 だけの「決め手」を 書く（plan-r49-fx.md 7-3）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4 } from './ax-check.js';
import { AX_TIME_O4, AX_SKILLS_O4, AX_FAMILIES_O4 } from '../public/js/shared/data/ax-time-o4.js';
import { axPlan } from '../public/js/shared/ax-time.js';
import { BW, Effects } from '../public/js/client/render/battlefx.js';

// plan-r49-fx.md 6章の O4 の 技（92）
const O4_IDS = 'rw_yubisashi rw_shuppatsu rw_announce rw_brake rw_teikoku rw_kaisou rw_shinkansen rw_shuuden bb_bunt bb_fastball bb_tourui bb_ouenka bb_headslide bb_homerun bb_keien bb_sayonara lc_madoguchi lc_bousai lc_josetsu lc_jumin lc_tsuukou lc_yurukyara lc_takidashi lc_shorui lc_kouhou lc_machiokoshi ml_160 ml_sweeper ml_challenge ml_grandslam ml_worldseries nc_houritsu nc_roppou nc_yosan nc_kisha nc_hanko nc_project po_taiho po_keibou po_shokumu po_koutsuu po_seigi ff_housui ff_teate ff_kyujo ff_hinoyoujin ff_hashigo ff_issei dv_kiteki dv_anzen dv_tsuuka dv_renketsu dv_saikou sb_spanner sb_tenken sb_haikan sb_shiunten sb_duct sb_kouji rn_koushin rn_chiller rn_kanki rn_shoene rn_netsugen rn_yochou rn_saiteki fg_kuuchou fg_demand fg_hirameki fg_saiteki hk_yoshi hk_tokkyu hk_nagashi hk_makyuu hk_yukigassen hk_kairanban hi_shinkuu hi_yukadanbou hi_inverter hi_jougai_hr hi_toben hi_sasumata hi_shoukaki hi_kaisoku hi_digital_twin dt_zenkan dt_nantoka dt_reform dt_himitsu_rensei dt_gyakuten dt_uukanpi dt_hakkeyoi'.split(' ');

// 1回 うごかして つぶを あつめる（play した 直後の ならび。おくれて 出る つぶも ふくむ）
function partsOf(anim, pts, o = {}) {
  const r = playAx(anim, pts, o);
  assert.deepEqual(r.errors, []);
  return r;
}

test('第49回 O4: 表と え が そろう', () => {
  const r = groupReport('o4');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O4).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_O4)) for (const a of fam) assert.ok(a in AX_TIME_O4, a);
  for (const v of Object.values(AX_SKILLS_O4)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_O4);
});

test('第49回 O4: 92技 ぜんぶが 自分だけの ox_ anim に つながる', () => {
  assert.deepEqual(Object.keys(AX_SKILLS_O4).sort(), [...O4_IDS].sort());
  const anims = Object.values(AX_SKILLS_O4);
  assert.equal(new Set(anims).size, 92);
  for (const a of anims) assert.match(a, /^ox_/);
});

// つぶを ぜんぶ 見る（play の あとの fx.parts。おくれて 出る つぶも まだ ならんで いる）
function firstParts(anim, pts, o = {}) {
  const fx = new Effects();
  fx.play(anim, pts, o.element || null, { fromAlly: true, from: { x: 99, y: 122 }, ...o });
  // ためる あいだ（構え）の あとに はなつので、構えの 時間ぶん すすめる
  const P = axPlan(anim, { key: o.ability, n: pts.length, dual: o.dual });
  for (let t = 0; t <= P.charge + 16; t += 16) fx.update(16);
  return fx.parts;
}

test('第49回 O4: 放水は 水色の しぶき・ホースの 水が ある', () => {
  const parts = firstParts('ox_housui', THREE, { ability: 'ff_housui', n: 3 });
  assert.ok(parts.some((p) => p.kind === 'o4Hose'), 'ホースの 水');
  assert.ok(parts.some((p) => ['#2a78d8', '#6ac8ff', '#2f7bff'].includes(p.color)), '水色の つぶ');
  // いっせい放水は 消防車が 3台
  const iss = firstParts('ox_issei_housui', THREE, { ability: 'ff_issei', n: 3 });
  assert.equal(iss.filter((p) => p.kind === 'o4Car' && p.v === 'fire').length, 3);
});

test('第49回 O4: 新幹線は 横に ながい 電車が 画面の はしから はしへ', () => {
  const parts = firstParts('ox_shinkansen', ONE, { ability: 'rw_shinkansen' });
  const tr = parts.find((p) => p.kind === 'o4Car' && p.v === 'train');
  assert.ok(tr, '電車');
  assert.equal(tr.nose, 'bullet');
  assert.ok(tr.cars >= 3);
  const xs = tr.keys.map((k) => k[1]);
  assert.ok(Math.min(...xs) < 0 && Math.max(...xs) > BW, `はしから はしへ ${xs}`);
});

test('第49回 O4: 設備屋 → ryonetsu → 天才しせつ管理者 は 道具が 大きく なる（スパナ・チラー・建物まるごと）', () => {
  const sp = firstParts('ox_spanner_attack', ONE, { ability: 'sb_spanner' });
  assert.ok(sp.some((p) => p.kind === 'o4Obj' && p.shape === 'spanner'));
  const ch = firstParts('ox_ghp_chiller', THREE, { ability: 'rn_chiller', n: 3 });
  assert.ok(ch.some((p) => p.kind === 'o4Obj' && p.shape === 'chiller'));
  // 空調こう新は 古い エアコン → 新しい エアコン
  const ac = firstParts('ox_kuuchou_koushin', ALLY4, { ability: 'rn_koushin', n: 4 }).filter((p) => p.shape === 'aircon');
  assert.ok(ac.some((p) => p.old) && ac.some((p) => !p.old));
  // 全館空調・最適制御は 建物まるごと（部屋が 光る）
  const zk = firstParts('ox_zenkan_kuuchou', ALLY4, { ability: 'fg_kuuchou', n: 4 });
  const b = zk.find((p) => p.shape === 'building');
  assert.ok(b && b.cols * b.rows >= 12, '部屋が 12 いじょう');
  const sg = firstParts('ox_saiteki_seigyo', THREE, { ability: 'fg_saiteki', n: 3 });
  assert.ok(['fan', 'cpump', 'boiler', 'chiller'].every((s) => sg.some((p) => p.shape === s)), 'ファン・ポンプ・ボイラー・チラー');
});

test('第49回 O4: 最適運転 → 最適制御、空調の なかまは 段が 上がるほど 長く・豪華', () => {
  const a = axPlan('ox_saiteki_unten', { key: 'rn_saiteki' }), b = axPlan('ox_saiteki_seigyo', { key: 'fg_saiteki' });
  assert.ok(b.total > a.total);
  const n = (anim, key, pts) => partsOf(anim, pts, { ability: key, n: pts.length }).maxParts;
  assert.ok(n('ox_saiteki_seigyo', 'fg_saiteki', ONE) > n('ox_saiteki_unten', 'rn_saiteki', ONE));
  assert.ok(n('ox_zenkan_kuuchou', 'fg_kuuchou', ALLY1) > n('ox_kuuchou_koushin', 'rn_koushin', ALLY1));
});

test('第49回 O4: 合体技は ため なし・人数の 長さ（2人 1.6s・3人 1.9s）', () => {
  for (const id of ['dt_zenkan', 'dt_nantoka', 'dt_reform', 'dt_himitsu_rensei', 'dt_gyakuten']) {
    const P = axPlan(AX_SKILLS_O4[id], { key: id, dual: true });
    assert.equal(P.charge, 0, id);
    assert.equal(P.total, 1600, id);
  }
  for (const id of ['dt_uukanpi', 'dt_hakkeyoi']) assert.equal(axPlan(AX_SKILLS_O4[id], { key: id, dual: true }).total, 1900, id);
});

test('第49回 O4: 敵が まねて 味方に つかっても 下向きに 出る（電車・ボール・ホース）', () => {
  for (const [anim, key] of [['ox_shuuden', 'rw_shuuden'], ['ox_homerun', 'bb_homerun'], ['ox_housui', 'ff_housui']]) {
    const r = playAx(anim, ALLY4, { fromAlly: false, toParty: true, ability: key, n: 4, hitWin: axPlan(anim, { key, n: 4 }).hit });
    assert.deepEqual(r.errors, [], anim);
    assert.ok(r.nearHit, `${anim} 味方の 近くで 光る`);
  }
});

// 第51回 C3（o9）: 幻の職業（宇宙一のおかん・はかいと創造の神・夢のスタジアム鉄道・天候の神）の 技の えんしゅつの テスト。この ファイルは C3 だけが さわる
// ・どの グループにも いる テスト（予算 AX_BUDGET_ORIG・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ・漢字なし）は
//   groupReport('o9')（test/ax-check.js）。ここには o9 だけの「決め手」を 書く
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, ONE, THREE, ALLY4 } from './ax-check.js';
import { AX_TIME_O9, AX_SKILLS_O9, AX_FAMILIES_O9 } from '../public/js/shared/data/ax-time-o9.js';
import { PHANTOM_ABILITIES_C } from '../public/js/shared/data/abilities-phantom-c.js';
import { axPlan, AX_GROUP_IDS } from '../public/js/shared/ax-time.js';
import { BW, Effects } from '../public/js/client/render/battlefx.js';
import { SFX_AX_O9 } from '../public/js/client/sfx-ax-o9.js';

// つぶを ぜんぶ 見る（play の あとの fx.parts。おくれて 出る つぶも まだ ならんで いる）
function firstParts(anim, pts, o = {}) {
  const fx = new Effects();
  fx.play(anim, pts, o.element || null, { fromAlly: true, from: { x: 99, y: 122 }, ...o });
  const P = axPlan(anim, { key: o.ability, n: pts.length });
  for (let t = 0; t <= P.charge + 16; t += 16) fx.update(16);
  return fx.parts;
}

test('第51回 o9: 表と え が そろう（共通の しらべ）', () => {
  assert.ok(AX_GROUP_IDS.includes('o9'));
  const r = groupReport('o9');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O9).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_O9)) for (const a of fam) assert.ok(a in AX_TIME_O9, a);
});

test('第51回 o9: 幻の職業の 32技 ぜんぶが 自分だけの ox_ anim（legend の 段）に つながる', () => {
  const ids = Object.keys(PHANTOM_ABILITIES_C);
  assert.equal(ids.length, 32);
  assert.deepEqual(Object.keys(AX_SKILLS_O9).sort(), [...ids].sort());
  const anims = Object.values(AX_SKILLS_O9);
  assert.equal(new Set(anims).size, 32);
  for (const a of anims) {
    assert.match(a, /^ox_/);
    assert.equal(AX_TIME_O9[a].tier, 'legend', a);
    // 構えは みじかく（気・カットインは なし）
    assert.ok(AX_TIME_O9[a].charge && AX_TIME_O9[a].charge.kind !== 'ki' && AX_TIME_O9[a].charge.ms <= 300, a);
  }
  // 看板の 技（Lv10）は その 職業の 中で いちばん 長い
  for (const [sig, pre] of [['cosmic_okan_sig', 'co_'], ['chaos_creator_sig', 'cc_'], ['dream_stadium_sig', 'ds_'], ['weather_god_sig', 'wg_']]) {
    const T = axPlan(AX_SKILLS_O9[sig], { key: sig }).total;
    for (const id of ids.filter((x) => x.startsWith(pre))) assert.ok(axPlan(AX_SKILLS_O9[id], { key: id }).total <= T, `${id} は ${sig} より みじかい`);
    assert.ok(T >= 2200, `${sig} ${T}`);
  }
});

test('第51回 o9: おかんの しかる 技は ぎざぎざの ふきだし、看板は 大きな おかんと 銀河', () => {
  const kora = firstParts('ox_o9_uchuu_kora', THREE, { ability: 'co_kora', n: 3 });
  assert.ok(kora.some((p) => p.kind === 'o9Bubble' && /コラ/.test(p.str)), 'コラーッ の ふきだし');
  assert.ok(kora.some((p) => p.kind === 'o9Galaxy'), '銀河');
  const sig = firstParts('ox_o9_uchuu_kaminari', THREE, { ability: 'cosmic_okan_sig', n: 3 });
  const okan = sig.find((p) => p.kind === 'o5Obj' && p.shape === 'okan');
  assert.ok(okan && okan.s >= 24, '大きな おかん');
  assert.ok(sig.some((p) => p.kind === 'o9Galaxy' && p.r >= 90), '画面いっぱいの 銀河');
  // 正座で反省: ざぶとんが すべりこむ
  assert.ok(firstParts('ox_o9_seiza_hansei', ONE, { ability: 'co_hansei' }).some((p) => p.kind === 'o9Zabuton'));
});

test('第51回 o9: はかいと創造の神は 消しゴムで 消して、装備を 作りかえる', () => {
  const kesu = firstParts('ox_o9_massara', ONE, { ability: 'cc_kesu' });
  assert.ok(kesu.some((p) => p.kind === 'o9Erase'), '消しゴム');
  const make = firstParts('ox_o9_tsukurikae', ALLY4, { ability: 'cc_tsukurikae', n: 4 });
  const gears = make.filter((p) => p.kind === 'o9Gear');
  assert.equal(gears.length, 4, '家族 1人に 1つの 装備');
  assert.ok(new Set(gears.map((g) => g.item)).size >= 3, 'ちがう 装備');
  const bb = firstParts('ox_o9_big_bang', THREE, { ability: 'chaos_creator_sig', n: 3 });
  assert.ok(bb.some((p) => p.kind === 'o9Erase') && bb.some((p) => p.kind === 'o9Galaxy') && bb.some((p) => p.kind === 'o9Gear'), 'はかい → 星が 生まれる → 装備');
});

test('第51回 o9: 夢のスタジアム鉄道は 電車が はしから はしへ、看板は 球場まるごと つっこむ', () => {
  const tr = firstParts('ox_o9_kankyaku_densha', THREE, { ability: 'ds_manin', n: 3 }).find((p) => p.kind === 'o4Car' && p.v === 'train');
  assert.ok(tr && tr.cars >= 3, '電車');
  const xs = tr.keys.map((k) => k[1]);
  assert.ok(Math.min(...xs) < 0 && Math.max(...xs) > BW, `はしから はしへ ${xs}`);
  const sig = firstParts('ox_o9_manin_onrei', THREE, { ability: 'dream_stadium_sig', n: 3 });
  const st = sig.find((p) => p.kind === 'o9Stadium');
  assert.ok(st && st.w >= 200, '球場まるごと');
  assert.ok(st.keys[0][1] < 0, '画面の そとから');
  assert.ok(sig.some((p) => p.kind === 'o4Car' && p.v === 'train'), '電車も いっしょ');
  // ウェーブは 観客の 頭の 波
  assert.ok(firstParts('ox_o9_stand_wave', ALLY4, { ability: 'ds_wave', n: 4 }).some((p) => p.kind === 'o9Crowd' && p.wave > 0));
});

test('第51回 o9: 天候の神は 天気ごとの 空（晴れの 太陽・雨の すじ・かみなり雲）、看板は 3つの 天気が 入れかわる', () => {
  assert.ok(firstParts('ox_o9_nippon_bare', ALLY4, { ability: 'wg_hare', n: 4 }).some((p) => p.kind === 'o9Sun'), '太陽');
  assert.ok(firstParts('ox_o9_megumi_ame', ALLY4, { ability: 'wg_ame', n: 4 }).some((p) => p.kind === 'o9Rain'), '雨');
  assert.ok(firstParts('ox_o9_ikazuchi_sora', THREE, { ability: 'wg_kaminari', n: 3 }).some((p) => p.kind === 'o9Cloud' && p.v === 'dark'), 'かみなり雲');
  const h = firstParts('ox_o9_tenkou_hanten', THREE, { ability: 'weather_god_sig', n: 3 });
  const skies = new Set(h.filter((p) => p.kind === 'o9Sky').map((p) => p.v));
  for (const v of ['sun', 'rain', 'thunder']) assert.ok(skies.has(v), v);
  // 一しゅんの 空は うすく みじかく（背景の きまり: a 0.35・0.6s まで）
  for (const p of h.filter((q) => q.kind === 'o9Sky')) assert.ok(p.a <= 0.35 && p.life <= 600);
});

test('第51回 o9: 音は ax_o9_〜・1つ 0.8びょう まで', () => {
  for (const [id, fn] of Object.entries(SFX_AX_O9)) {
    assert.match(id, /^ax_o9_/);
    let end = 0;
    const a = { tone: () => {}, noise: (dur, o = {}) => { end = Math.max(end, (o.delay || 0) + dur); } };
    fn(a, (f, dur, o = {}) => { end = Math.max(end, (o.delay || 0) + dur); });
    assert.ok(end <= 0.8 + 1e-9, `${id} ${end.toFixed(2)}s`);
  }
});

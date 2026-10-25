// 第48回 G3（鬼滅の刃 ＋ るろうに剣心 ＋ 暴れん坊将軍）の 大技の テスト。この ファイルは G3 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ）は
//   test/ax-groups.test.js が AX_SKILLS_G3 を 見て やる。ここには G3 だけの「決め手」を 書く（plan-r48-fx.md 8-5）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, ONE, THREE, ALLY1, ALLY_FROM } from './ax-check.js';
import { Effects } from '../public/js/client/render/battlefx.js';
import { axDef, axAnimFor } from '../public/js/client/render/axfx.js';
import { G3_STYLE, capLife, makePath } from '../public/js/client/render/axfx-g3-kit.js';
import { AX_TIME_G3, AX_SKILLS_G3, AX_FAMILIES_G3 } from '../public/js/shared/data/ax-time-g3.js';

// plan-r48-fx.md 6章（G3）の 段
const B = 'basic', A = 'advanced', S = 'super', L = 'legend';
const AX_PLAN_TIERS = {
  ks_minamo: A, ks_zenshuu: A, ks_hyoutan: A, ks_uchishio: A, ks_nejire: A, kisatsu_sig: A, hi_suiryuu: A,
  eb_shiranui: A, eb_umai: S, eb_noboru: S, eb_uneri: S, enbashira_sig: S, eb_rengoku: S, hi_enko: S,
  hn_kasha: S, hn_sukitooru: L, hn_koukyou: L, hn_hirin: L, hn_aza: L, hinokami_sig: L, hi_enbu: L,
  rr_battou: B, rr_oro: B, rr_doryu: B, rr_ryukan: B, rr_sentaku: B, rurouni_sig: B,
  htk_ryusho: A, htk_kenki: A, htk_soryu: A, htk_yamiyo: A, htk_ryumei: A, hitokiri_sig: A, hi_ryutsui_shou: A,
  hm_hiryu: A, hm_fusatsu: S, hm_arashi: S, hm_ocha: S, hm_tsumuji: S, himura_sig: S, hi_kogarashi: S,
  ht_shinsoku: S, ht_mantle: L, ht_ootatsu: L, ht_ikiyou: L, ht_yomi: L, hiten_sig: L, hi_shin_kuzu: L, hi_dai_doryu: L,
  ab_mineuchi: S, ab_kao: L, ab_hakuba: L, ab_meyasu: L, ab_onari: L, abarenbo_shogun_sig: L, hi_oniwaban_maire: L, hi_tenka_gomen: L,
  dt_sentaku_biyori: S, dt_sanken: S, dt_megumi: S,
};

// 1回 うごかして 足された つぶを ぜんぶ あつめる（あとで fx.at で 足す ものも）
function collect(anim, pts = ONE, o = {}) {
  const fx = new Effects();
  const parts = [];
  let now = 0;
  const add = fx.add.bind(fx);
  fx.add = (p) => { if (p && p.kind !== 'call') parts.push({ ...p, at: now + (p.delay || 0) }); return add(p); };
  fx.play(anim, pts, null, { fromAlly: true, from: ALLY_FROM, ...o });
  while ((fx.parts.length || fx.bolts.length) && now < 9000) { fx.update(16); now += 16; }
  return parts;
}
const kinds = (parts, kind) => parts.filter((p) => p.kind === kind);
const hexHue = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx === mn) return 0;
  const h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
  return (h * 60 + 360) % 360;
};

test('第48回 G3: 表と え が そろう', () => {
  const r = groupReport('g3');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_G3).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_G3)) for (const a of fam) assert.ok(a in AX_TIME_G3, a);
  for (const v of Object.values(AX_SKILLS_G3)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_G3);
});

test('第48回 G3: 6章の 技 60こ ぜんぶが 自分の 大技に なり、段は 6章の とおり', () => {
  assert.equal(Object.keys(AX_SKILLS_G3).length, 60);
  assert.equal(new Set(Object.values(AX_SKILLS_G3)).size, 60, 'anim は 技ごとに ちがう');
  for (const [id, anim] of Object.entries(AX_SKILLS_G3)) {
    if (!id.startsWith('dt_')) assert.equal(axAnimFor(id), anim, id);
    assert.equal(AX_TIME_G3[anim].tier, AX_PLAN_TIERS[id], `${id} の 段`);
  }
  // 合体技は ため なし
  for (const id of ['dt_sentaku_biyori', 'dt_sanken', 'dt_megumi']) assert.equal(AX_TIME_G3[AX_SKILLS_G3[id]].charge, false);
  // 鬼滅は 呼吸、るろうに・将軍は 剣の ため
  for (const [id, anim] of Object.entries(AX_SKILLS_G3)) {
    const ch = AX_TIME_G3[anim].charge;
    if (!ch) continue;
    assert.equal(ch.kind, /^(ks_|eb_|hn_|kisatsu|enbashira|hinokami|hi_(suiryuu|enko|enbu))/.test(id) ? 'breath' : 'sword', id);
  }
});

test('第48回 G3: 九頭竜閃は 9本の 白い すじ、真・九頭竜閃は 9ひきの 金の 竜', () => {
  const kz = collect('ax_kuzuryusen', ONE, { ability: 'himura_sig' });
  const lines = kinds(kz, 'g3Line');
  assert.equal(lines.length, 9);
  assert.ok(lines.every((p) => p.color === '#ffffff' && p.tip));
  // 9本は 9つの ちがう 方向から 1つの 的へ（ほぼ 同時に とどく）
  const angs = new Set(lines.map((p) => Math.round(Math.atan2(p.y1 - p.y0, p.x1 - p.x0) * 4)));
  assert.ok(angs.size >= 8);
  assert.ok(Math.max(...lines.map((p) => p.at + p.draw)) - Math.min(...lines.map((p) => p.at + p.draw)) < 20, 'いっせいに');
  const shin = collect('ax_kuzuryusen_shin', ONE, { ability: 'hi_shin_kuzu' });
  const dr = kinds(shin, 'g3Dragon');
  assert.equal(dr.length, 9);
  assert.ok(dr.every((p) => p.style === 'gold'));
  assert.equal(kinds(kz, 'g3Dragon').length, 0, 'ふつうの 九頭竜閃は 竜でなく すじ');
});

test('第48回 G3: 呼吸の 色（水＝青、炎＝赤〜オレンジ、日＝赤＋金の 日輪の 円）', () => {
  const ribbonStyles = (anim, ability) => kinds(collect(anim, ONE, { ability }), 'g3Ribbon').map((p) => p.style);
  for (const [anim, id] of [['ax_minamo_giri', 'ks_minamo'], ['ax_uchishio', 'ks_uchishio'], ['ax_nejire_uzu', 'ks_nejire'], ['ax_ryuuryuu_mai', 'hi_suiryuu']]) {
    const st = ribbonStyles(anim, id);
    assert.ok(st.length && st.every((s) => s === 'water'), anim);
  }
  for (const [anim, id] of [['ax_shiranui', 'eb_shiranui'], ['ax_nobori_enten', 'eb_noboru'], ['ax_seien_uneri', 'eb_uneri']]) {
    const st = ribbonStyles(anim, id);
    assert.ok(st.length && st.every((s) => s === 'flame'), anim);
  }
  const hue = (s) => hexHue(G3_STYLE[s].main);
  assert.ok(hue('water') > 190 && hue('water') < 250, '水は 青');
  assert.ok(hue('flame') < 40, '炎は 赤〜オレンジ');
  assert.ok(hue('sun') < 20 && G3_STYLE.sun.rim === '#ffd23a', '日は 赤＋金');
  // 水の 竜・炎の 竜（虎の あたま）・炎虎
  assert.equal(kinds(collect('ax_seisei_ruten', ONE, { ability: 'kisatsu_sig' }), 'g3Dragon')[0].style, 'water');
  const rg = kinds(collect('ax_rengoku', ONE, { ability: 'eb_rengoku' }), 'g3Dragon')[0];
  assert.equal(rg.style, 'flame');
  assert.equal(rg.head, 'tiger');
  // ヒノカミ神楽: 日の 刃の 円が いくつも ＋ 大きな 日輪 ＋ 火車
  const kg = collect('ax_hinokami_kagura', THREE, { ability: 'hinokami_sig' });
  assert.ok(kinds(kg, 'g3Ribbon').filter((p) => p.style === 'sun').length >= 6, '型を つぎつぎ');
  assert.ok(kinds(kg, 'g3Sun').some((p) => p.r >= 26), '大きな 日輪');
  assert.equal(kinds(kg, 'g3Wheel').length, 1, '火車');
  assert.equal(kinds(kg, 'g3Bg')[0].v, 'dawn');
  // 烈日紅鏡は 1体に 日輪 2つ
  assert.equal(kinds(collect('ax_retsujitsu_koukyou', ONE, { ability: 'hn_koukyou' }), 'g3Sun').length, 2);
});

test('第48回 G3: 天翔龍閃は 斬撃が 2回（神速の 金白の 弧＋竜 → 真空 → 2撃目）', () => {
  const ps = collect('ax_amakakeru', THREE, { ability: 'hiten_sig' });
  const T = axDef('ax_amakakeru');
  const strikes = kinds(ps, 'g3Ribbon').filter((p) => p.w >= 8).map((p) => p.at + p.draw * 0.3).sort((a, b) => a - b);
  assert.ok(strikes.length >= 2);
  assert.ok(strikes[strikes.length - 1] - strikes[0] > 500, '1撃目と 2撃目の あいだに 真空');
  assert.equal(kinds(ps, 'g3Dragon').length, 1, '竜は 1撃目の 先');
  assert.equal(kinds(ps, 'g3Bg')[0].v, 'night', '夜の 月');
  assert.ok(T.tier === 'legend');
});

test('第48回 G3: なかま技は 見た目が ちがう（竜巻閃 → 嵐 → 大竜巻・縦の 技）', () => {
  const tor = (anim, id, pts = ONE) => kinds(collect(anim, pts, { ability: id }), 'g3Tornado');
  assert.equal(tor('ax_ryukansen', 'rr_ryukan').length, 0, '竜巻閃は 回転の 輪だけ');
  assert.ok(tor('ax_ryukansen_arashi', 'hm_arashi').length >= 1, '嵐は 竜巻');
  const big = tor('ax_hiten_ootatsumaki', 'ht_ootatsu', THREE);
  assert.ok(big.some((p) => p.r1 >= 70 && p.h >= 90), '大竜巻は 画面の まん中に 大きく');
  assert.ok(tor('ax_ryukansen_tsumuji', 'hm_tsumuji', THREE).some((p) => p.x1 !== undefined), '旋は 敵から 敵へ うつる');
  assert.ok(tor('ax_ryukansen_kogarashi', 'hi_kogarashi').every((p) => p.style === 'cold' && p.leafCols), 'こがらしは 水色と 枯れ葉');
  // 竜つい閃: 真上から 1本 / 竜ついしょう閃: 上から ＋ 下から 上へ
  const down = kinds(collect('ax_ryutsuisen', ONE, { ability: 'rurouni_sig' }), 'g3Line').filter((p) => Math.abs(p.x1 - p.x0) < 2 && p.y1 > p.y0 + 40);
  assert.ok(down.length >= 1);
  const ts = collect('ax_ryutsuishousen', ONE, { ability: 'hi_ryutsui_shou' });
  assert.ok(kinds(ts, 'g3Line').some((p) => Math.abs(p.x1 - p.x0) < 2 && p.y1 > p.y0 + 40), '上から');
  assert.ok(kinds(ts, 'g3Ribbon').some((p) => p.P[p.P.length - 1] < p.P[1] - 20), '下から 上へ');
});

test('第48回 G3: 暴れん坊将軍（金の 紋・白馬・お庭番・成敗の 桜）と 合体技の 小道具', () => {
  const props = (anim, id, pts = THREE) => kinds(collect(anim, pts, { ability: id }), 'g3Prop').map((p) => p.prop);
  assert.ok(props('ax_yo_no_kao', 'ab_kao').includes('crest'));
  assert.ok(props('ax_hakuba_hayagake', 'ab_hakuba').includes('horse'));
  assert.ok(props('ax_oniwaban_maire', 'hi_oniwaban_maire').filter((p) => p === 'shuriken').length >= 6);
  const sb = collect('ax_seibai', THREE, { ability: 'abarenbo_shogun_sig' });
  assert.ok(kinds(sb, 'g3Prop').some((p) => p.prop === 'bang'));
  assert.ok(kinds(sb, 'g3Prop').filter((p) => p.prop === 'swordsman' && p.pose === 'ninja').length === 2, 'お庭番 2人');
  assert.ok(kinds(sb, 'petal2').length >= 10, '桜');
  assert.equal(kinds(sb, 'g3Bg')[0].v, 'lantern');
  assert.ok(props('ax_uesama_onari', 'ab_onari', ALLY1).filter((p) => p === 'fusuma').length === 2);
  assert.ok(props('ax_sentaku_biyori', 'dt_sentaku_biyori', ALLY1).includes('laundry'));
  assert.ok(props('ax_megumi', 'dt_megumi').includes('matoi'));
  const sk = kinds(collect('ax_sanken', THREE, { ability: 'dt_sanken', dual: true }), 'g3Ribbon').map((p) => p.style);
  for (const s of ['blade', 'gold', 'red']) assert.ok(sk.includes(s), `三剣士の ${s}`);
});

test('第48回 G3: どうぐ（道・時間の まもり）', () => {
  const p = makePath([[0, 0], [100, 0]]);
  assert.ok(Math.abs(p.L - 100) < 3);
  const fx = new Effects();
  capLife(fx, 300, () => {
    fx.add({ kind: 'spark', x: 0, y: 0, life: 900, delay: 100 });
    fx.add({ kind: 'spark', x: 0, y: 0, life: 900, delay: 290 });
    fx.at(200, () => fx.add({ kind: 'spark', x: 0, y: 0, life: 900 }));
  });
  assert.equal(fx.parts.filter((q) => q.kind === 'spark').length, 1, '時間を すぎる つぶは 足さない');
  assert.equal(fx.parts.find((q) => q.kind === 'spark').life, 200);
  for (let t = 0; t < 400; t += 16) fx.update(16);
  assert.ok(fx.parts.every((q) => q.kind !== 'spark' || q.life <= 100));
});

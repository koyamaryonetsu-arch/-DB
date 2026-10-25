// 第48回 G6（ハリー・ポッター ＋ 鋼の錬金術師 ＋ 怪盗キッド ＋ 名探偵コナン ＋ おしり探偵）の 大技の テスト。この ファイルは G6 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ）は
//   test/ax-groups.test.js が AX_SKILLS_G6 を 見て やる。ここには G6 だけの「決め手」を 書く（plan-r48-fx.md 8-5）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4, ALLY_FROM, FOE_FROM } from './ax-check.js';
import { Effects } from '../public/js/client/render/battlefx.js';
import { axTiming } from '../public/js/client/render/axfx.js';
import { AX_TIME_G6, AX_SKILLS_G6, AX_FAMILIES_G6 } from '../public/js/shared/data/ax-time-g6.js';
import { SFX_AX_G6 } from '../public/js/client/sfx-ax-g6.js';
import { G6_SHAPES } from '../public/js/client/render/axfx-g6-lib.js';

// 1回 うごかして、出た つぶを ぜんぶ あつめる（はなつ 前の ため の つぶは release より 前に 出た もの）
function collect(anim, pts = ONE, o = {}) {
  const fx = new Effects();
  const T = axTiming(anim, { ability: o.ability, targets: pts.length });
  const seen = [];
  const mark = new Set();
  const fromAlly = o.fromAlly !== false;
  fx.play(anim, pts, null, { fromAlly, from: fromAlly ? ALLY_FROM : FOE_FROM, n: pts.length, ...o });
  let t = 0;
  const grab = () => { for (const p of fx.parts) if (!mark.has(p)) { mark.add(p); seen.push({ p, t }); } };
  grab();
  while ((fx.parts.length || fx.bolts.length) && t < 6000) { fx.update(16); t += 16; grab(); }
  const release = seen.filter((e) => e.t >= T.charge - 16).map((e) => e.p);
  return { all: seen.map((e) => e.p), release, T };
}
const sprs = (parts, sh) => parts.filter((p) => p.kind === 'g6Spr' && p.sh === sh);

test('第48回 G6: 表と え が そろう', () => {
  const r = groupReport('g6');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_G6).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_G6)) for (const a of fam) assert.ok(a in AX_TIME_G6, a);
  for (const v of Object.values(AX_SKILLS_G6)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_G6);
});

test('第48回 G6: 6章の 技 ぜんぶ（82技 ＋ 合体技 2つ）が 自分の anim', () => {
  assert.equal(Object.keys(AX_SKILLS_G6).length, 84);
  const anims = Object.values(AX_SKILLS_G6);
  assert.equal(new Set(anims).size, anims.length, 'anim は 技ごとに ちがう');
  assert.equal(AX_TIME_G6.ax_tsukiyo_kakehiki.charge, false);
  assert.equal(AX_TIME_G6.ax_hippogriff.charge, false);
});

test('第48回 G6: 守護の呪文は 銀色の 牡鹿が 敵ぜんぶを かけぬける（夜の 背景）', () => {
  for (const pts of [ONE, THREE]) {
    const { release } = collect('ax_expecto_patronum', pts, { ability: 'harry_sig' });
    const stag = sprs(release, 'stag');
    assert.equal(stag.length, 1, '牡鹿は 1とう');
    assert.ok(stag[0].path.length >= pts.length + 2, '杖 → 的 → その さき');
    assert.ok(/^#[cdef]/i.test(stag[0].c1 || '#d8ecff'), '銀白');
    assert.ok(release.some((p) => p.kind === 'g6Night'), '夜');
  }
});

test('第48回 G6: 大地のやりは 陣なし（両手 パン！）、ほかの れん成は 陣が ある', () => {
  const yari = collect('ax_daichi_yari', THREE, { ability: 'fullmetal_sig' });
  assert.equal(yari.all.filter((p) => p.kind === 'g6Circ' || p.kind === 'axGlyph' || (p.kind === 'axAura' && p.style === 'glyph')).length, 0, 'れん成陣の つぶ なし');
  assert.equal(AX_TIME_G6.ax_daichi_yari.charge.kind, 'generic');
  assert.ok(yari.release.filter((p) => p.kind === 'g6Spike' && p.form === 'spear').length === 3, '的ごとに 巨大な やり');
  for (const a of ['ax_ishi_toge', 'ax_ishi_hashira', 'ax_toge_mori', 'ax_rensei_daibakuhatsu']) assert.ok(collect(a).release.some((p) => p.kind === 'g6Circ'), `${a} は 陣`);
});

test('第48回 G6: れん成の なかまは とげが ふえて 大きく なる', () => {
  const sp = (a) => collect(a).release.filter((p) => p.kind === 'g6Spike');
  const toge = sp('ax_ishi_toge'), hashira = sp('ax_ishi_hashira'), mori = sp('ax_toge_mori'), yari = sp('ax_daichi_yari');
  assert.equal(toge.length, 3, '石のとげは 3本');
  assert.ok(hashira.some((p) => p.form === 'col' && p.w > Math.max(...toge.map((q) => q.w))), '石の柱は 太い');
  assert.ok(mori.length >= 10, 'とげの森は たくさん');
  assert.ok(Math.max(...yari.map((p) => p.h)) > Math.max(...mori.map((p) => p.h)), '大地のやりは いちばん 高い');
});

test('第48回 G6: 真実はいつもひとつは 黒い かげ（目が 白い）が 光で くだける', () => {
  const { release } = collect('ax_shinjitsu_hitotsu', THREE, { ability: 'meitantei_sig' });
  assert.equal(sprs(release, 'culprit').length, 3);
  assert.ok(release.some((p) => p.kind === 'axBolt'), 'ピキーン（白い いなずま）');
});

test('第48回 G6: 呪文の 色（ステューピファイ＝赤・エクスペリアームス＝赤オレンジ・ルーモス＝金白）', () => {
  const beam = (a, ab) => collect(a, ONE, { ability: ab }).release.find((p) => p.kind === 'axBeam');
  assert.equal(beam('ax_stupefy', 'wizard_student_sig').color, '#ff2a2a');
  assert.equal(beam('ax_expelliarmus', 'hy_buki').color, '#ff4a1a');
  const ex = collect('ax_expelliarmus', ONE, { ability: 'hy_buki' }).release;
  assert.ok(sprs(ex, 'wand').some((p) => p.x1 !== undefined && Math.abs(p.spin) > 10), 'はじかれた 杖が くるくる とぶ');
  assert.ok(sprs(collect('ax_lumos').release, 'cross').length >= 1, 'ルーモスは 光の 十字');
});

test('第48回 G6: トランプは 4まい → 6まい → 何十まい（満月）', () => {
  const cards = (a) => sprs(collect(a).release, 'card').length;
  const n1 = cards('ax_trump_nage'), n2 = cards('ax_trump_juu'), n3 = cards('ax_trump_juu_arashi');
  assert.ok(n1 >= 4 && n2 > n1 && n3 > n2 * 1.5, `${n1} < ${n2} < ${n3}`);
  assert.ok(sprs(collect('ax_trump_juu').release, 'cardgun').length === 1, 'トランプじゅう');
  const ar = collect('ax_trump_juu_arashi').release;
  assert.ok(ar.some((p) => p.kind === 'g6Night' && p.moon !== false), '満月の 夜');
  assert.ok(sprs(ar, 'dove').length >= 3, 'ハトが 月へ');
});

test('第48回 G6: 怪盗キッドの しるし（白い グライダー・ハトの 大群・けむり）', () => {
  assert.ok(sprs(collect('ax_tsukiyo_glider').release, 'glider').length >= 1);
  assert.ok(sprs(collect('ax_hato_taigun', THREE).release, 'dove').length >= 15, 'ハト 15わ いじょう');
  assert.ok(sprs(collect('ax_hato_deru', THREE).release, 'dove').length === 5, 'ハトが出るよは 5わ');
  assert.ok(collect('ax_surikae').release.some((p) => p.kind === 'g6Cloud'), 'けむり');
  assert.ok(sprs(collect('ax_surikae').release, 'rose').length === 1, '白い バラ');
});

test('第48回 G6: 焔の錬金術は 白い 手ぶくろで 指を ならして から 炎', () => {
  for (const a of ['ax_yubi_pacchin', 'ax_honoo_ouzu']) {
    const { release } = collect(a);
    const g = sprs(release, 'glove');
    assert.equal(g.length, 1, a);
    assert.ok(g[0].snapAt > 0, 'パチン');
    assert.ok(release.some((p) => p.kind === 'axFlame'), '炎');
  }
  assert.ok(collect('ax_honoo_ouzu').release.some((p) => p.kind === 'g6Torn'), '炎の 竜巻');
});

test('第48回 G6: コナンの 道具（ボール・腕時計型麻酔銃・蝶ネクタイ・スケボー）', () => {
  assert.ok(sprs(collect('ax_kick_shoes').release, 'ball').length >= 1);
  assert.ok(sprs(collect('ax_kick_shoes').release, 'shoe').length === 1);
  assert.ok(sprs(collect('ax_masui_fukiya').release, 'wwatch').length === 1);
  assert.ok(sprs(collect('ax_masui_fukiya').release, 'needle').length === 1);
  assert.ok(collect('ax_masui_fukiya').release.some((p) => p.kind === 'g6Txt' && p.str === 'Z'), 'Z');
  assert.ok(sprs(collect('ax_henseiki', THREE).release, 'bowtie').length === 1);
  assert.ok(sprs(collect('ax_turbo_skate', THREE).release, 'skate').length === 1);
  assert.ok(sprs(collect('ax_aptx4869').release, 'capsule').length === 1, '赤と 白の カプセル');
});

test('第48回 G6: しつれいこかせていただきます は 黄色い 雲と「プゥ〜」', () => {
  const { release } = collect('ax_shitsurei_kokasete', THREE, { ability: 'oshiri_tantei_sig' });
  const clouds = release.filter((p) => p.kind === 'g6Cloud');
  assert.ok(clouds.length >= 4, '的ごとの 雲 ＋ 大きな もや');
  assert.ok(clouds.every((p) => /^#ff[c-f]/i.test(p.color)), '黄色');
  assert.ok(release.some((p) => p.kind === 'g6Txt' && p.str.startsWith('プ')), 'プゥ〜');
});

test('第48回 G6: 敵が まねても（味方へ）・味方に かけても こわれない', () => {
  for (const anim of ['ax_expecto_patronum', 'ax_daichi_yari', 'ax_trump_juu_arashi', 'ax_kuroi_kuruma', 'ax_shitsurei_kokasete']) {
    const r = playAx(anim, ALLY4, { fromAlly: false, toParty: true, n: 4 });
    assert.deepEqual(r.errors, [], anim);
    assert.equal(r.log.nan.length, 0, anim);
  }
  for (const anim of ['ax_hagane_kabe', 'ax_dumbledore_gundan', 'ax_kemuri_dama', 'ax_ishi_toride']) {
    const r = playAx(anim, ALLY4, { fromAlly: true, n: 4 });
    assert.deepEqual(r.errors, [], anim);
  }
  void ALLY1;
});

test('第48回 G6: 音と かたちの なまえ', () => {
  for (const id of Object.keys(SFX_AX_G6)) assert.ok(id.startsWith('ax_g6_'), id);
  for (const sh of ['stag', 'dove', 'card', 'glider', 'culprit', 'ball', 'car', 'capsule', 'hippo']) assert.ok(G6_SHAPES.includes(sh), sh);
});

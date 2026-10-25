// 第48回 G5（セーラームーン ＋ アナと雪の女王 ＋ アイドル）の 大技の テスト。この ファイルは G5 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ）は
//   test/ax-groups.test.js が AX_SKILLS_G5 を 見て やる。ここには G5 だけの「決め手」を 書く（plan-r48-fx.md 8-5）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4 } from './ax-check.js';
import { AX_TIME_G5, AX_SKILLS_G5, AX_FAMILIES_G5 } from '../public/js/shared/data/ax-time-g5.js';
import { Effects } from '../public/js/client/render/battlefx.js';
import { axAnimFor, axDef } from '../public/js/client/render/axfx.js';

test('第48回 G5: 表と え が そろう', () => {
  const r = groupReport('g5');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_G5).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_G5)) for (const a of fam) assert.ok(a in AX_TIME_G5, a);
  for (const v of Object.values(AX_SKILLS_G5)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_G5);
});

// 1回 うごかして、足された つぶを ぜんぶ あつめる（あとで 消えた つぶも）
function partsOf(anim, pts, opts = {}) {
  const seen = [];
  const orig = Effects.prototype.add;
  Effects.prototype.add = function addSpy(p) { seen.push(p); return orig.call(this, p); };
  try {
    const r = playAx(anim, pts, opts);
    assert.deepEqual(r.errors, [], anim);
  } finally {
    Effects.prototype.add = orig;
  }
  return seen;
}
const animOf = (key) => {
  const v = AX_SKILLS_G5[key];
  return typeof v === 'string' ? v : v.anim;
};

test('第48回 G5: 6章の 技が ぜんぶ 大技（男の子の 版も）・女の子と 男の子で anim が ちがう', () => {
  const ids = ['id_kiss', 'id_fansa', 'id_beam', 'id_wink', 'id_hightouch', 'id_center', 'id_penlight', 'id_shower', 'id_encore', 'id_kami', 'id_dome', 'id_senkyo', 'hk_love_beam', 'hk_fan_cheer',
    'bs_heel', 'bs_henshin', 'bs_oshioki', 'bs_kizuna', 'bs_shabon', 'sailor_soldier_sig', 'hi_aqua', 'mn_stick', 'mn_bara', 'mn_luna', 'mn_heal', 'mn_inori', 'sailor_moon_sig', 'hi_spiral',
    'nq_hikari', 'nq_kekkai', 'nq_iyashi', 'nq_fukkatsu', 'nq_shizume', 'neo_queen_sig', 'hi_yoake', 'hi_tsukiakari',
    'fz_juice', 'fz_cherry', 'fz_banana', 'fz_basket', 'fz_tropical', 'fz_pine', 'fz_meteor', 'hi_fruit_parfait',
    'ar_senpu', 'ar_spin', 'ar_manazashi', 'ar_harmony', 'ar_stage', 'ar_inazuma', 'ar_live', 'hi_ooarashi',
    'sq_tsubute', 'sq_kabe', 'sq_yukidaruma', 'sq_ootoko', 'sq_uta', 'snow_queen_sig', 'hi_tsurara',
    'fs_kaze', 'fs_hi', 'fs_mizu', 'fs_daichi', 'fs_kokoro', 'fifth_spirit_sig', 'hi_koori_nami', 'hi_seirei_wa', 'dt_moonlight'];
  for (const id of ids) assert.ok(axAnimFor(id), id);
  for (const key of Object.keys(AX_SKILLS_G5).filter((k) => k.endsWith('@masc'))) {
    const id = key.replace(/@masc$/, '');
    if (key === 'nq_fukkatsu@masc') { assert.equal(AX_SKILLS_G5[key].vars.gold, true); continue; }
    assert.notEqual(animOf(key), animOf(id), key);
    assert.equal(axAnimFor(id, { masc: true }), animOf(key), key);
  }
  assert.equal(Object.keys(AX_TIME_G5).length, 83);
});

test('第48回 G5: 男の子（タキシード仮面ふう）の 版には 赤い バラ・黒い マント・仮面・ステッキ・金（女の子の 版には バラが ない）', () => {
  const boyKinds = (key) => {
    const ps = partsOf(animOf(key), ONE, { ability: key });
    return { rose: ps.some((p) => p.kind === 'g5Rose' || (p.kind === 'g5Mark' && p.mark === 'rose') || (p.kind === 'g5Tiara' && /^#ff3a5a/i.test(p.color))), tux: ps.some((p) => p.kind === 'g5Cape' || (p.kind === 'g5Mark' && /mask|hat/.test(p.mark)) || (p.kind === 'g5Wand' && p.variant === 'cane')), gold: ps.some((p) => (p.kind === 'g5Crystal' && p.col === '#fff0b0') || (p.kind === 'g5Wand' && p.variant === 'sword') || (p.kind === 'g5Mark' && p.mark === 'globe')) };
  };
  for (const key of ['sailor_soldier_sig@masc', 'mn_bara@masc', 'bs_oshioki@masc', 'hi_spiral@masc', 'mn_heal@masc', 'hi_aqua@masc']) assert.ok(boyKinds(key).rose, `${key}: 赤い バラ`);
  for (const key of ['bs_heel@masc', 'bs_henshin@masc', 'mn_stick@masc', 'sailor_moon_sig@masc']) assert.ok(boyKinds(key).tux, `${key}: マント・仮面・ステッキ`);
  for (const key of ['nq_hikari@masc', 'nq_iyashi@masc', 'neo_queen_sig@masc', 'hi_tsukiakari@masc']) assert.ok(boyKinds(key).gold, `${key}: 金・地球`);
  for (const key of ['sailor_soldier_sig', 'mn_stick', 'bs_oshioki', 'hi_spiral', 'sailor_moon_sig']) {
    const ps = partsOf(animOf(key), ONE, { ability: key });
    assert.ok(!ps.some((p) => p.kind === 'g5Rose'), `${key}: 女の子の 版に バラ`);
  }
});

test('第48回 G5: ムーン・ティアラ・アクションは ひたいの ティアラが 光の 輪に なって 的へ とぶ・ムーンスティックは 三日月の 杖', () => {
  const ps = partsOf('ax_moon_tiara', ONE, { ability: 'sailor_soldier_sig' });
  const t = ps.find((p) => p.kind === 'g5Tiara');
  assert.ok(t && t.start > 0 && t.travel > 0, 'ティアラが ひかって から とぶ');
  assert.equal(t.x1, ONE[0].x);
  assert.equal(t.y1, ONE[0].y);
  assert.ok(t.y0 > ONE[0].y, '味方の ひたい（画面の 下）から');
  const st = partsOf('ax_moon_stick', ONE, { ability: 'mn_stick' });
  assert.ok(st.some((p) => p.kind === 'g5Wand' && p.variant === 'moon'));
  assert.ok(st.filter((p) => p.kind === 'g5MoonWave').length >= 3, '三日月の 光の 波');
  const ha = partsOf('ax_moon_princess_halation', THREE, { ability: 'sailor_moon_sig' });
  assert.ok(ha.some((p) => p.kind === 'g5Wand' && p.variant === 'heart'), 'ハートの 杖');
  assert.ok(ha.some((p) => p.kind === 'g5Wave' && p.cols.includes('#ff7ad8')), 'ピンクの 光の 大波');
  const hl = partsOf('ax_moon_healing', ALLY4, { ability: 'mn_heal' });
  assert.ok(hl.some((p) => p.kind === 'g5Wand' && p.variant === 'moon') && hl.some((p) => p.kind === 'g5Moon' && p.phase === 'crescent'), '三日月の 杖と 三日月');
  assert.ok(hl.some((p) => p.kind === 'g5Mark' && p.mark === 'feather'), '羽が ふる');
});

test('第48回 G5: よみがえる月の王国は 満月と 白銀の 宮殿・はいけい（伝説は ぜんぶ はいけいか 画面の 色）', () => {
  const ps = partsOf('ax_tsuki_no_oukoku', THREE, { ability: 'neo_queen_sig' });
  const moon = ps.find((p) => p.kind === 'g5Moon' && p.phase === 'full');
  const pal = ps.find((p) => p.kind === 'g5Palace' && p.style === 'moon');
  assert.ok(moon && moon.r >= 30, '大きな 満月');
  assert.ok(pal && pal.grow > 0 && Math.abs(pal.x - moon.x) < 4, '月の 中から 宮殿');
  for (const [anim, d] of Object.entries(AX_TIME_G5)) {
    if (d.tier !== 'legend') continue;
    const key = Object.keys(AX_SKILLS_G5).find((k) => animOf(k) === anim);
    const q = partsOf(anim, axDef(anim).party ? ALLY1 : ONE, { ability: key });
    assert.ok(q.some((p) => p.kind === 'g5Sky' || p.kind === 'axTint'), `${anim}: 伝説の はいけい`);
  }
});

test('第48回 G5: 氷の 城が 下から 立つ・せいれいを つなぐ 光は 4つの しるし ＋ 5つめ ＋ 大きな 雪の 結晶', () => {
  const ps = partsOf('ax_koori_no_shiro', THREE, { ability: 'snow_queen_sig' });
  const castle = ps.find((p) => p.kind === 'g5Palace' && p.style === 'ice');
  assert.ok(castle && castle.grow > 0, '氷の 城が たちあがる');
  assert.ok(castle.y >= Math.min(...THREE.map((t) => t.y)) - 16 && castle.h >= 50, 'じめん（敵の うしろ）から 大きな 城');
  const ts = partsOf('ax_seirei_tsunagu', THREE, { ability: 'fifth_spirit_sig' });
  const sig = ts.filter((p) => p.kind === 'g5Sigil').map((p) => p.sigil).sort();
  assert.deepEqual(sig, ['earth', 'fire', 'five', 'water', 'wind']);
  assert.ok(ts.some((p) => p.kind === 'g5Flake' && p.s >= 40), '大きな 雪の 結晶の もよう');
  assert.ok(ts.filter((p) => p.kind === 'g5Line').length >= 8, '光の 線で つながる');
  // 4つの せいれい（風・火・水・大地）
  assert.ok(partsOf('ax_seirei_hi', ONE, { ability: 'fs_hi' }).some((p) => p.kind === 'g5Lizard'), '火の トカゲ');
  assert.ok(partsOf('ax_seirei_mizu', ALLY4, { ability: 'fs_mizu' }).some((p) => p.kind === 'g5Horse'), '水の 馬');
  assert.ok(partsOf('ax_seirei_daichi', ONE, { ability: 'fs_daichi' }).filter((p) => p.kind === 'g5Foot').length >= 2, '岩の 足 ドスン ドスン');
  assert.ok(partsOf('ax_seirei_kaze', THREE, { ability: 'fs_kaze' }).some((p) => p.kind === 'g5Tornado'), '風の うず');
  const ari = partsOf('ax_arinomama', ALLY4, { ability: 'sq_uta' });
  assert.ok(ari.some((p) => p.kind === 'g5Stairs') && ari.some((p) => p.kind === 'g5Ribbon'), 'ありのまま: 氷の かいだんと 雪の うず');
  assert.ok(partsOf('ax_yukidaruma', ALLY4, { ability: 'sq_yukidaruma' }).some((p) => p.kind === 'g5Snowman'));
  assert.ok(partsOf('ax_yuki_ootoko', THREE, { ability: 'sq_ootoko' }).some((p) => p.kind === 'g5Giant'));
});

test('第48回 G5: アイドルは ペンライト・ドーム・スポットライト、フルーツメテオは 7色の くだもの、雷鳴ライブは 5色の レーザー', () => {
  assert.ok(partsOf('ax_penlight_umi', ALLY4, { ability: 'id_penlight' }).some((p) => p.kind === 'g5Penlights'));
  const dome = partsOf('ax_dome_live', THREE, { ability: 'id_dome' });
  assert.ok(dome.some((p) => p.kind === 'g5Dome') && dome.filter((p) => p.kind === 'g5Spot').length >= 4);
  const met = partsOf('ax_fruits_meteor', ONE, { ability: 'fz_meteor' });
  const fruits = new Set(met.filter((p) => p.kind === 'g5Fruit' && p.tail).map((p) => p.fruit));
  assert.ok(fruits.size >= 5, `くだものの しゅるい ${fruits.size}`);
  const live = partsOf('ax_raimei_live', THREE, { ability: 'ar_live' });
  assert.equal(new Set(live.filter((p) => p.kind === 'g5Laser').map((p) => p.col)).size, 5);
  assert.ok(live.some((p) => p.kind === 'axBolt'), 'かみなり');
  assert.ok(partsOf('ax_lovely_beam', ONE, { ability: 'hk_love_beam' }).some((p) => p.kind === 'g5HeartBeam'), 'ハートの ビーム');
});

test('第48回 G5: 敵が まねした とき（味方に）も 下向きに・味方に かける 技は 味方の いちに 出る', () => {
  for (const key of ['sailor_moon_sig', 'snow_queen_sig', 'ar_live', 'fz_meteor', 'neo_queen_sig', 'fifth_spirit_sig']) {
    const r = playAx(animOf(key), ALLY4, { ability: key, fromAlly: false, toParty: true });
    assert.deepEqual(r.errors, [], key);
  }
  const ps = partsOf('ax_moon_healing', ALLY4, { ability: 'mn_heal' });
  const ribbons = ps.filter((p) => p.kind === 'g5Ribbon');
  assert.equal(ribbons.length, 4);
  for (const rb of ribbons) assert.ok(rb.y > 100, '味方の いち（画面の 下）');
});

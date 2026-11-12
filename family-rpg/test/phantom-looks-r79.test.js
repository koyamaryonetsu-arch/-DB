// 第79回: 幻の職業 12この 衣装（render/hero-r79.js。docs/plan-r79-phantom-looks.md）
//  ・12こ 全部に 職業だけの 服・からだの とくちょう・古い 小さな え が ある（前は 戦士の 服に なっていた）
//  ・男の子・女の子 × 4つの 向き × 歩く コマ、布の服でも 装備しても かける
//  ・ほかの 職業の 衣装と 同じ 絵に ならない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { JOBS, PHANTOM_ORDER, ALL_JOBS, BODY_NAMES } from '../public/js/shared/data/jobs.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { lookToOpts } from '../public/js/client/render/chars.js';
import { masc33 } from '../public/js/client/render/hero-r33.js';
import { R79_JOBS, R79_OUTFIT, R79_BODY, R79_HAT, R79_OLD_LOOK, R79_MASC, AURA79 } from '../public/js/client/render/hero-r79.js';

const BODIES = BODY_NAMES.map((_, i) => i);
const LOOK = (body) => ({ body, hair: body ? 1 : 0, hairColor: 1, skin: 0, color: 0 });
const DIRS = ['down', 'up', 'left', 'right'];
const CLOTH = ',,,';
const GEAR = 'iron_sword,iron_armor,iron_shield,iron_helm';
const sig = (img) => createHash('sha1').update(img.rgba).digest('hex');
const opaque = (img) => {
  let n = 0;
  for (let i = 3; i < img.rgba.length; i += 4) if (img.rgba[i]) n++;
  return n;
};

test('第79回: 幻の職業 12こ 全部に 衣装の 表が ある', () => {
  assert.deepEqual(R79_JOBS, PHANTOM_ORDER, 'ならびは PHANTOM_ORDER と おなじ');
  for (const id of PHANTOM_ORDER) {
    assert.ok(JOBS[id], id);
    assert.ok(R79_OUTFIT[id]?.kind, `${id} の 服`);
    assert.ok(R79_BODY[id], `${id} の からだの とくちょう`);
    assert.ok(R79_OLD_LOOK[id]?.outfit, `${id} の 古い 小さな え`);
    // 戦士の 服（前の すがた）では ない
    for (const b of BODIES) {
      const fem = b === 1;
      const O = outfitOf({ body: b, cloth: '#d9534f' }, id, null, fem);
      assert.notEqual(O.spec, outfitOf({ body: b, cloth: '#d9534f' }, 'warrior', null, fem).spec, `${id} ${BODY_NAMES[b]}`);
      assert.ok(O.body, `${id} ${BODY_NAMES[b]} の からだ`);
      assert.equal(jobBody(id, fem), O.body);
    }
  }
  // 体の 型が ある 職業（masc）は 男の子の すがたも ある
  for (const id of PHANTOM_ORDER.filter((j) => JOBS[j].masc)) {
    assert.ok(R79_MASC[id], `${id} の 男の子の すがた`);
    assert.equal(masc33(id, false), R79_MASC[id]);
    assert.equal(masc33(id, true), null);
  }
  // ぼうしは 布の服の ときだけ（装備の かぶとが 上に なる）
  for (const id of Object.keys(R79_HAT)) {
    assert.ok(PHANTOM_ORDER.includes(id));
    assert.ok(headOf(null, id, null, { fem: true }), `${id} の ぼうし`);
    assert.equal(headOf('iron_helm', id, null, { fem: true }).kind !== R79_HAT[id].kind || R79_HAT[id].kind === 'helmet', true);
  }
  // つかう オーラは みんな ある
  for (const id of PHANTOM_ORDER) {
    const a = R79_BODY[id].aura;
    if (a && /79$/.test(a)) assert.ok(AURA79[a], `${id} の オーラ ${a}`);
  }
});

test('第79回: 全部の 体の 型・向き・歩く コマで かける（布の服・装備・大きな みほん）', () => {
  for (const id of PHANTOM_ORDER) {
    for (const b of BODIES) {
      for (const dir of DIRS) {
        for (const f of [0, 1]) {
          for (const [eq, res] of [[CLOTH, 4], [GEAR, 4], [undefined, 2]]) {
            const img = paintHero(LOOK(b), id, eq, dir, f, res);
            assert.equal(img.w, 16 * res);
            assert.equal(img.h, 21 * res);
            assert.ok(opaque(img) > img.w * img.h * 0.15, `${id} ${BODY_NAMES[b]} ${dir} ${f} ${eq} ${res}`);
          }
        }
      }
      // 大きな みほん（メニューの 立ち絵・キャラ作り）
      assert.ok(opaque(paintHero(LOOK(b), id, CLOTH, 'down', 0, 8)) > 0);
      // 古い 小さな え（戦士の 服では ない）
      const o = lookToOpts(LOOK(b), id, ',cloth,,');
      assert.equal(o.outfit, (b === 0 && R79_MASC[id] ? R79_MASC[id].old : R79_OLD_LOOK[id]).outfit, `${id} ${BODY_NAMES[b]}`);
    }
  }
});

test('第79回: ほかの 職業の 衣装と 同じ 絵に ならない（布の服・男の子と 女の子）', () => {
  for (const b of BODIES) {
    const seen = new Map();
    for (const id of ALL_JOBS) {
      const s = sig(paintHero(LOOK(b), id, CLOTH, 'down', 0, 4));
      if (PHANTOM_ORDER.includes(id)) assert.ok(!seen.has(s), `${id} ${BODY_NAMES[b]} は ${seen.get(s)} と おなじ 絵`);
      seen.set(s, id);
    }
    // 幻の職業の あとに ならぶ 職業とも ちがう
    for (const id of PHANTOM_ORDER) {
      const s = sig(paintHero(LOOK(b), id, CLOTH, 'down', 0, 4));
      const same = ALL_JOBS.filter((j) => j !== id && sig(paintHero(LOOK(b), j, CLOTH, 'down', 0, 4)) === s);
      assert.deepEqual(same, [], `${id} ${BODY_NAMES[b]}`);
    }
    // 前の すがた（戦士の 服）とも ちがう
    const w = sig(paintHero(LOOK(b), 'warrior', CLOTH, 'down', 0, 4));
    for (const id of PHANTOM_ORDER) assert.notEqual(sig(paintHero(LOOK(b), id, CLOTH, 'down', 0, 4)), w, id);
  }
});

test('第79回: もとの 2つの 職業の とくちょうが 入っている', () => {
  const O = (id, fem = true) => outfitOf({ body: fem ? 1 : 0, cloth: '#d9534f' }, id, null, fem);
  // 海賊王: ニカの かみ・麦わらと かんむり
  assert.equal(R79_BODY.pirate_king.hair, 'nika');
  assert.deepEqual(R79_HAT.pirate_king.parts.map((p) => p.kind), ['straw', 'crown43j']);
  // 伝説の超勇者: ロトの よろい（鳥の しるし）と 金の さか立つ かみ・雷
  assert.equal(O('super_hero').torso.bird, true);
  assert.equal(R79_BODY.super_hero.hcol, 'ssgold');
  assert.ok(R79_BODY.super_hero.spark);
  // 日の火影: 市松の 羽織・火影の マント・日輪の 耳かざり
  assert.ok(O('sun_hokage').haori);
  assert.ok(O('sun_hokage').cape?.flame);
  assert.ok(R79_BODY.sun_hokage.hanafuda);
  // 天才しせつ管理者AI: 光る 線の 作業服・クリエイターの エプロン・ホログラム
  assert.ok(O('facility_ai').apron);
  assert.ok(R79_BODY.facility_ai.holo);
  // 名探てい王: 大きな 虫めがね・かんむり
  assert.equal(R79_BODY.detective_king.prop, 'glass79');
  // 天下むそうの剣聖: 二本の 刀
  assert.ok(O('sword_saint').sheath && O('sword_saint').r79.dual);
  // はかいと創造の神: 左右で ちがう 光
  assert.notEqual(R79_BODY.chaos_creator.hand79[0], R79_BODY.chaos_creator.hand79[1]);
  // マントは 伝説より 1だん ごうか（うらの 色・かたかざり）
  for (const id of ['pirate_king', 'galaxy_queen', 'cosmic_okan', 'dream_stadium', 'chaos_creator']) assert.ok(O(id).mantle29, `${id} の かたかざり`);
});

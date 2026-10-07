// 主人公の え（render/hero*.js）: おかん・最強のおかん・社ちく・ブラックきぎょうの星・天才しせつ管理者・はかい神の 服と、
// 新しい ぶき（スリッパ）・よろい（ヒョウがらの服）、技の エフェクト（render/battlefx-jobs3.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ITEMS } from '../public/js/shared/data/items.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { weaponOf, headOf, isLongSide } from '../public/js/client/render/hero-gear.js';
import { lookToOpts } from '../public/js/client/render/chars.js';
import { weaponLook, playWeapon } from '../public/js/client/render/weaponfx.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { JOB_FINE, playJobFx } from '../public/js/client/render/battlefx-jobs.js';
import { JOB2_FINE, JOB2_SFX, PARTY_ANIMS, playJob2Fx } from '../public/js/client/render/battlefx-jobs2.js';
import { JOB3_FINE, JOB3_SFX, PARTY_ANIMS3, playJob3Fx } from '../public/js/client/render/battlefx-jobs3.js';
import { playCh4Fx } from '../public/js/client/render/battlefx-ch4.js';

const DIRS = ['down', 'left', 'up', 'right'];
const JOBS6 = ['okan', 'saikyo_okan', 'shachiku', 'black_star', 'facility_genius', 'hakaishin'];
// 敵に かける 技 と、みかたに かける 技（がめんの したに 大きく でる）
const FOE_ANIMS = ['okan_otama', 'oyasumi', 'slipper_smack', 'okan_kaminari', 'manin_densha', 'black_star', 'mieruka', 'hakai', 'hakai_ball'];
const PARTY6 = ['gohan', 'zangyou', 'black_aura', 'yochou_shield', 'hirune', 'hakai_aura'];
const ANIMS15 = [...FOE_ANIMS, ...PARTY6];
// そうびの データが まだ ない ときの かわり（ある ときは そのまま つかう）
const STUB = {
  slipper: { name: 'スリッパ', type: 'weapon', cat: 'fan', rank: 4, atk: 26 },
  leopard_shirt: { name: 'ヒョウがらの服', type: 'armor', armorType: 'cloth', rank: 5, def: 30 },
};
const OLD_IDS = new Set(Object.keys(ITEMS));
for (const [id, it] of Object.entries(STUB)) {
  if (!ITEMS[id]) ITEMS[id] = it;
  // きたえた もの（+1〜+3）も、データが ない ときは かわりを つくる
  for (let n = 1; n <= 3; n++) if (!ITEMS[`${id}+${n}`]) ITEMS[`${id}+${n}`] = { ...ITEMS[id], name: `${ITEMS[id].name}+${n}`, base: id, plus: n };
}

// 不透明な ピクセルの かず と、ふちに さわって いないか（オーラの すける ピクセルも かぞえる）
function inspect(img) {
  const { w, h, rgba } = img;
  let n = 0, semi = 0;
  let edge = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = rgba[(y * w + x) * 4 + 3];
      if (a === 0) continue;
      n++;
      if (a < 255) semi++;
      if (y === 0 || x === 0 || x === w - 1) edge = true;
    }
  }
  return { n, semi, edge };
}
const key = (img) => Buffer.from(img.rgba).toString('base64');

test('第22回の 職業の 服: 男女・4方向・かみがた・2コマで かけて、はみ出さない', () => {
  for (const job of JOBS6) {
    // かみがたが きまって いる 職業（おかん・最強のおかんの パーマ）は どの かみがたでも おなじ なので 1つで よい
    const styles = jobBody(job)?.hair ? ['short'] : ['short', 'afro', 'long', 'mohawk', 'twin', 'bun'];
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const style of styles) {
          for (const res of [4, 8]) {
            const img = paintHero({ body, style, hcol: 'black' }, job, undefined, dir, res === 4 ? 1 : 0, res);
            const r = inspect(img);
            assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${style} res${res} が かけている`);
            assert.ok(!r.edge, `${job} ${body} ${dir} ${style} res${res} が ふちに さわる`);
          }
        }
      }
    }
  }
});

test('第22回の 職業の 服: そうびを かえても はみ出さない（おたま・スリッパ・ヒョウがらの服・てつの よろい）', () => {
  const EQS = [
    { weapon: 'ladle', armor: 'cloth' },
    { weapon: 'slipper', armor: 'leopard_shirt' },
    { weapon: 'slipper+1', armor: 'cloth', head: 'straw_hat' },
    { weapon: 'frying_pan', armor: 'iron_armor', shield: 'iron_shield', head: 'iron_helm' },
  ];
  for (const job of JOBS6) {
    for (const eq of EQS) {
      for (const body of [0, 1]) {
        for (const dir of DIRS) {
          for (const res of [4, 8]) {
            const img = paintHero({ body, style: 'afro', hcol: 'brown' }, job, eq, dir, body, res);
            const r = inspect(img);
            assert.ok(r.n > img.w * img.h * 0.12, `${job} ${JSON.stringify(eq)} ${body} ${dir} res${res} が かけている`);
            assert.ok(!r.edge, `${job} ${JSON.stringify(eq)} ${body} ${dir} res${res} が ふちに さわる`);
          }
        }
      }
    }
  }
});

test('第22回の 職業の 服: どれも ちがう え（にている いまの 職業とも ちがう）', () => {
  const LIKE = ['warrior', 'cook', 'patissier', 'salaryman', 'seishain', 'bucho', 'shacho', 'tatakiage', 'setsubiya', 'ryonetsu', 'chuuni', 'datenshi', 'maou', 'neet'];
  for (const body of [0, 1]) {
    for (const dir of DIRS) {
      const seen = new Map();
      for (const job of [...LIKE, ...JOBS6]) {
        const k = key(paintHero({ body, style: 'short' }, job, job === 'warrior' ? '' : undefined, dir, 0, 4));
        assert.ok(!seen.has(k), `${job} body${body} ${dir} が ${seen.get(k)} と おなじ え`);
        seen.set(k, job);
      }
    }
  }
});

test('第22回の 職業の 服: 服の しゅるいと ぼうし（布の服の とき）', () => {
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  const kind = (job, fem = false, armor = 'cloth') => outfitOf(Lk, job, armor, fem).kind;
  const KIND = { okan: 'okan', saikyo_okan: 'leopard', shachiku: 'suit', black_star: 'shirt', facility_genius: 'work', hakaishin: 'hakai' };
  for (const [job, k] of Object.entries(KIND)) {
    assert.equal(kind(job), k, job);
    assert.equal(kind(job, true), k, `${job} 女性`);
    // よろいを つけて いない ときも 職業の 服
    assert.equal(outfitOf(Lk, job, null, false).kind, k, `${job} よろい なし`);
  }
  assert.ok(outfitOf(Lk, 'saikyo_okan', 'cloth', false).spec.necklace, '最強のおかんの ネックレス');
  // ぼうし（布の服 か よろい なし の とき）
  const hat = (job, armor = 'cloth') => headOf(null, job, armor, outfitOf(Lk, job, armor, false))?.kind || null;
  const HAT = { saikyo_okan: 'visor', black_star: 'tieband', facility_genius: 'arhelmet', hakaishin: 'catcrown', okan: null, shachiku: null };
  for (const [job, h] of Object.entries(HAT)) assert.equal(hat(job), h, job);
  // よろいを きると ぼうしは なくなる（いまの 職業と おなじ）。最強のおかんが ヒョウがらの服を きても サンバイザーは のこる
  for (const job of ['saikyo_okan', 'black_star', 'facility_genius', 'hakaishin']) assert.equal(headOf(null, job, 'iron_armor', null), null, job);
  assert.equal(hat('saikyo_okan', 'leopard_shirt'), 'visor');
  assert.equal(hat('saikyo_okan', 'leopard_shirt+2'), 'visor');
  assert.equal(hat('warrior', 'leopard_shirt'), null);
  // 古い え（chars.js）でも 職業の 服（戦士の 服に ならない）
  const warrior = lookToOpts({}, 'warrior', ',cloth,,');
  for (const job of JOBS6) {
    const o = lookToOpts({}, job, ',cloth,,');
    assert.ok(o.outfit, `${job} の 古い え`);
    assert.notDeepEqual(o, warrior, `${job} の 古い え`);
  }
  assert.ok(lookToOpts({}, 'warrior', 'slipper,leopard_shirt,,').weapon, '古い え の スリッパ');
  assert.notDeepEqual(lookToOpts({}, 'warrior', ',leopard_shirt,,'), warrior, '古い え の ヒョウがらの服');
});

test('第22回の 職業の からだ: パーマ・つかれた 目・もえる 目・オーラは 職業で きまり、よろいを きても のこる', () => {
  assert.equal(jobBody('okan').hair, 'perm');
  assert.equal(jobBody('saikyo_okan').hair, 'perm');
  assert.equal(jobBody('saikyo_okan').hcol, 'obapurple');
  assert.ok(jobBody('saikyo_okan').earring);
  assert.ok(jobBody('shachiku').tired && jobBody('shachiku').sweat);
  assert.ok(jobBody('black_star').fire);
  assert.ok(jobBody('facility_genius').holo);
  assert.deepEqual(['saikyo_okan', 'black_star', 'facility_genius', 'hakaishin'].map((j) => jobBody(j).aura), ['okan', 'blackred', 'circuit', 'hakai']);
  assert.equal(jobBody('hakaishin').spark, 'ember');
  // パーマは じぶんの かみがたに かかわらず おなじ（おかんは かみの いろは じぶんの いろ、最強のおかんは むらさきの パーマ）
  for (const eq of [undefined, ',iron_armor,,', ',leopard_shirt,,iron_helm']) {
    for (const dir of DIRS) {
      const a = paintHero({ body: 1, style: 'short', hcol: 'black' }, 'okan', eq, dir, 0, 4);
      const b = paintHero({ body: 1, style: 'twin', hcol: 'black' }, 'okan', eq, dir, 0, 4);
      assert.equal(key(a), key(b), `おかん ${eq} ${dir}: じぶんの かみがたに かかわらず パーマ`);
      const c = paintHero({ body: 1, style: 'short', hcol: 'black' }, 'saikyo_okan', eq, dir, 0, 4);
      const d = paintHero({ body: 1, style: 'twin', hcol: 'pink' }, 'saikyo_okan', eq, dir, 0, 4);
      assert.equal(key(c), key(d), `最強のおかん ${eq} ${dir}: むらさきの パーマ`);
    }
  }
  assert.notEqual(key(paintHero({ body: 1, style: 'short', hcol: 'black' }, 'okan', undefined, 'down', 0, 4)), key(paintHero({ body: 1, style: 'short', hcol: 'pink' }, 'okan', undefined, 'down', 0, 4)), 'おかんの かみの いろ');
  // ふつうの 職業は じぶんの かみがた
  for (const job of ['shachiku', 'black_star', 'facility_genius', 'hakaishin']) {
    assert.notEqual(key(paintHero({ body: 0, style: 'short' }, job, undefined, 'down', 0, 4)), key(paintHero({ body: 0, style: 'long' }, job, undefined, 'down', 0, 4)), job);
  }
  // オーラ（すける ピクセル）は オーラの ある 職業だけ。よろいを きても でる
  for (const job of ['saikyo_okan', 'black_star', 'facility_genius', 'hakaishin']) {
    for (const eq of [undefined, ',iron_armor,,']) {
      for (const dir of DIRS) assert.ok(inspect(paintHero({ body: 0, style: 'short' }, job, eq, dir, 0, 4)).semi > 200, `${job} ${eq} ${dir} の オーラ`);
    }
  }
  for (const job of ['okan', 'shachiku']) assert.equal(inspect(paintHero({ body: 0, style: 'short' }, job, undefined, 'down', 0, 4)).semi, 0, job);
  // オーラは 2コマで ゆらめく
  for (const job of ['black_star', 'hakaishin']) {
    assert.notEqual(key(paintHero({ body: 0, style: 'short' }, job, undefined, 'down', 0, 4)), key(paintHero({ body: 0, style: 'short' }, job, undefined, 'down', 1, 4)), `${job} の 2コマ`);
  }
});

test('第22回の ぶき: スリッパは じぶんの かたちで、きたえても おなじ。4方向とも はみ出さない', () => {
  const W = weaponOf('slipper');
  assert.ok(W, 'スリッパの え');
  assert.equal(W.shape, 'slipper');
  for (const n of [1, 2, 3]) assert.equal(weaponOf(`slipper+${n}`).shape, 'slipper', `slipper+${n} は もとの え`);
  assert.equal(isLongSide(W), false, 'スリッパの もちかた');
  // 名前で わかる スリッパも その かたち
  ITEMS.t_slipper = { name: '金のスリッパ', type: 'weapon', cat: 'fan', rank: 6 };
  try {
    assert.equal(weaponOf('t_slipper').shape, 'slipper');
  } finally {
    delete ITEMS.t_slipper;
  }
  const pics = new Set();
  for (const eq of [{ weapon: null, armor: 'cloth' }, { weapon: 'pillow', armor: 'cloth' }, { weapon: 'feather_fan', armor: 'cloth' }, { weapon: 'ladle', armor: 'cloth' }]) {
    if (eq.weapon && !ITEMS[eq.weapon]) continue;
    pics.add(key(paintHero({ body: 0, style: 'short' }, 'warrior', eq, 'down', 0, 4)));
  }
  const mine = key(paintHero({ body: 0, style: 'short' }, 'warrior', { weapon: 'slipper', armor: 'cloth' }, 'down', 0, 4));
  assert.ok(!pics.has(mine), 'スリッパが ほかの ぶきと おなじ え');
  // きたえても おなじ え（ひかりは ちがって よい が、かたちは スリッパ）。はみ出さない
  for (const id of ['slipper', 'slipper+1', 'slipper+3']) {
    for (const job of ['warrior', 'okan', 'saikyo_okan', 'monk']) {
      for (const body of [0, 1]) {
        for (const dir of DIRS) {
          for (const res of [4, 8]) {
            const img = paintHero({ body, style: 'short', hcol: 'brown' }, job, { weapon: id, armor: 'cloth' }, dir, body, res);
            assert.ok(!inspect(img).edge, `${id} ${job} ${body} ${dir} res${res} が ふちに さわる`);
          }
        }
      }
    }
  }
});

test('第22回の ぶき: いまの ぶきの えは かわらない（おたま・フライパンも そのまま）', () => {
  assert.equal(weaponOf('ladle').shape, 'ladle');
  assert.equal(weaponOf('frying_pan').shape, 'pan');
  for (const id of OLD_IDS) {
    // 新しい ぶき と、それを きたえた もの（'slipper+1' など）は のぞく
    if (ITEMS[id].type !== 'weapon' || STUB[id.replace(/\+\d+$/, '')]) continue;
    assert.notEqual(weaponOf(id).shape, 'slipper', `${id}（${ITEMS[id].name}）の えが かわった`);
  }
});

test('第22回の よろい: ヒョウがらの服は どの 職業でも ヒョウがら（きたえても おなじ）', () => {
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  for (const job of ['warrior', 'mage', 'monk', 'okan', 'shachiku', 'hakaishin', 'saikyo_okan']) {
    for (const fem of [false, true]) {
      assert.equal(outfitOf(Lk, job, 'leopard_shirt', fem).kind, 'leopard', `${job} ${fem}`);
      assert.equal(outfitOf(Lk, job, 'leopard_shirt+3', fem).kind, 'leopard', `${job} ${fem} +3`);
    }
  }
  for (const job of ['warrior', 'mage', 'monk', 'shachiku']) {
    for (const body of [0, 1]) {
      const a = key(paintHero({ body, style: 'short' }, job, { weapon: null, armor: 'cloth' }, 'down', 0, 4));
      const b = key(paintHero({ body, style: 'short' }, job, { weapon: null, armor: 'leopard_shirt' }, 'down', 0, 4));
      assert.notEqual(a, b, `${job} ${body}: ヒョウがらの服で 服が かわる`);
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'twin' }, job, { weapon: 'iron_sword', armor: 'leopard_shirt+1', head: 'iron_helm' }, dir, 1, res);
          assert.ok(!inspect(img).edge, `${job} ${body} ${dir} res${res}`);
        }
      }
    }
  }
});

// たたかいの がめんに かく ための ブラウザの まね（よばれた かずと、NaN の かずを かぞえる）
function fakeCtx() {
  const log = { calls: 0, nan: [] };
  let ctx;
  const fn = (name) => (...args) => {
    log.calls++;
    if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) log.nan.push(name);
    return ctx;
  };
  ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : typeof k === 'string' ? fn(k) : undefined),
    set: (o, k, v) => { if (typeof v === 'number' && !Number.isFinite(v)) log.nan.push(String(k)); o[k] = v; return true; },
  });
  return { ctx, log };
}
function withFakeDocument(fn) {
  const sprite = fakeCtx();
  const had = 'document' in globalThis, prev = globalThis.document;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => sprite.ctx }) };
  try { return fn(); } finally { if (had) globalThis.document = prev; else delete globalThis.document; }
}
// エフェクトが おわるまで うごかして かく（かかった じかんと、かいた かず）
function runFx(fx, limit = 4000) {
  const { ctx, log } = fakeCtx();
  let t = 0;
  while (fx.parts.length && t < limit) {
    fx.update(16);
    t += 16;
    if (t % 48 === 0) fx.draw(ctx);
  }
  return { t, log };
}

test('第22回の ぶきの こうげき: スリッパで パーン（きたえても おなじ）', () => {
  for (const id of ['slipper', 'slipper+1', 'slipper+3']) {
    const L = weaponLook(id, 'fan');
    assert.equal(L.move, 'slipper', id);
    assert.equal(L.mat, 'slipper', id);
  }
  // いまの おうぎ・まくらは そのまま
  assert.equal(weaponLook('pillow', 'fan').move, 'pillow');
  assert.equal(weaponLook(null, 'fan').move, 'fan');
  withFakeDocument(() => {
    for (const crit of [false, true]) {
      const fx = new Effects();
      const hit = playWeapon(fx, { x: 120, y: 60, w: 32, h: 32, foot: 80 }, weaponLook('slipper', 'fan'), crit, 0);
      assert.ok(hit >= 0 && hit < 600, `スリッパの あたる じかん ${hit}`);
      assert.ok(fx.parts.some((p) => p.kind === 'slip3') && fx.parts.some((p) => p.kind === 'pow3'), 'スリッパと パーン');
      const { t, log } = runFx(fx);
      assert.ok(t < 2500, `スリッパが ながい ${t}ms`);
      assert.ok(log.calls > 100, 'スリッパを かいた');
      assert.deepEqual(log.nan, [], 'スリッパの NaN');
    }
  });
});

test('第22回の 技の エフェクト: 15の 技が でて、すぐ あたり、1.8びょうで おわる', () => {
  withFakeDocument(() => {
    assert.deepEqual([...PARTY_ANIMS3].sort(), [...PARTY6].sort());
    for (const anim of ANIMS15) {
      for (const n of [1, 3]) {
        const party = PARTY_ANIMS3.has(anim);
        const foes = Array.from({ length: n }, (_, i) => ({ x: 60 + i * 60, y: 70 + (i % 2) * 18 }));
        // みかたに かける 技は がめんの した（battle.js と おなじ）。敵に かけても おかしく ならない
        const runs = party ? [[{ x: BW / 2, y: BH * 0.62 }], foes] : [foes];
        for (const ts of runs) {
          const fx = new Effects();
          fx.play(anim, ts, null, { crit: n === 3, fromAlly: true });
          assert.ok(fx.parts.length > 0, `${anim} の つぶ`);
          // 敵に かける 技は すぐ あたる（ダメージの 数字と ずれない）
          if (!party) {
            let hit = Infinity;
            for (const p of fx.parts) if (typeof p.x === 'number' && Math.hypot(p.x - ts[0].x, p.y - ts[0].y) < 24) hit = Math.min(hit, p.delay || 0);
            assert.ok(hit <= 120, `${anim} が あたるのが おそい ${hit}`);
          }
          const { t, log } = runFx(fx);
          assert.ok(t <= 1800, `${anim} ${ts.length} が ながい ${t}ms`);
          assert.ok(log.calls > 100, `${anim} を かいた`);
          assert.deepEqual(log.nan, [], `${anim} の NaN`);
        }
      }
    }
  });
});

test('第22回の 技の エフェクト: 音・みかたの 技の リスト・battle.js の つなぎ', () => {
  assert.deepEqual(Object.keys(JOB3_SFX).sort(), [...ANIMS15].sort());
  // 音は audio.js に ある ものだけ
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(JOB3_SFX)) assert.ok(audio.includes(`case '${s}':`), `${anim} の 音 ${s} が audio.js に ない`);
  // まえの 技と かさならない
  for (const anim of ANIMS15) {
    assert.ok(!PARTY_ANIMS.has(anim) && !(anim in JOB2_SFX), `${anim} が battlefx-jobs2.js と かさなる`);
  }
  // battle.js が みかたの 技を がめんの したに だし、音を ならす
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /PARTY_ANIMS3\.has\(anim\)/);
  assert.match(battle, /\.\.\.JOB3_SFX/);
});

test('第22回の 技の エフェクト: ほかの 技・つぶの かきかたを じゃま しない', () => {
  const fx = new Proxy({}, { get: () => () => undefined });
  for (const anim of ANIMS15) {
    assert.equal(playJobFx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, `${anim} は battlefx-jobs.js に ない`);
    assert.equal(playJob2Fx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, `${anim} は battlefx-jobs2.js に ない`);
    assert.equal(playCh4Fx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, `${anim} は battlefx-ch4.js に ない`);
  }
  for (const anim of ['fire1', 'slash', 'pillow', 'redtrain', 'train', 'kamehameha', 'super_aura', 'maou_dark', 'no_such_anim']) {
    assert.equal(playJob3Fx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, anim);
  }
  // つぶの なまえが いまの ものと かさならない
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  const s0 = src.indexOf('const FINE = {');
  const fine = src.slice(s0, src.indexOf('\n};', s0));
  for (const k of Object.keys(JOB3_FINE)) {
    assert.ok(!(k in JOB_FINE), `${k} が battlefx-jobs.js と かさなる`);
    assert.ok(!(k in JOB2_FINE), `${k} が battlefx-jobs2.js と かさなる`);
    assert.ok(!new RegExp(`^  ${k}\\(`, 'm').test(fine), `${k} が battlefx.js の FINE と かさなる`);
    assert.ok(!src.includes(`case '${k}':`), `${k} が battlefx.js の つぶと かさなる`);
  }
});

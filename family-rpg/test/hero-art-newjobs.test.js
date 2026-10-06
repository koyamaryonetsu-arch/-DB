// 主人公の え（render/hero.js）: 料理人・アルバイト・会社・お笑い・大賢者・ロトの勇者の 服と、料理・そうじの どうぐ・マイクの ぶき
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf } from '../public/js/client/render/hero-outfit.js';
import { weaponOf, headOf } from '../public/js/client/render/hero-gear.js';
import { weaponLook, playWeapon } from '../public/js/client/render/weaponfx.js';

const DIRS = ['down', 'left', 'up', 'right'];
const JOBS10 = ['cook', 'patissier', 'star_chef', 'parttimer', 'seishain', 'tatakiage', 'comedian', 'm1_champion', 'daikenja', 'loto_hero'];
// ぶきの データが まだ ない ときの かわり（ある ときは そのまま つかう）
const STUB = {
  kitchen_knife: { name: '包丁', type: 'weapon', cat: 'dagger', rank: 1, atk: 7 },
  frying_pan: { name: 'フライパン', type: 'weapon', cat: 'axe', rank: 2, atk: 14 },
  chinese_wok: { name: '中華なべ', type: 'weapon', cat: 'axe', rank: 4, atk: 30 },
  ladle: { name: 'おたま', type: 'weapon', cat: 'staff', rank: 1, atk: 6 },
  whisk: { name: '泡だて器', type: 'weapon', cat: 'fan', rank: 2, atk: 12 },
  chef_knife: { name: '三ツ星の包丁', type: 'weapon', cat: 'dagger', rank: 6, atk: 60 },
  mop: { name: 'モップ', type: 'weapon', cat: 'staff', rank: 1, atk: 6 },
  deck_brush: { name: 'デッキブラシ', type: 'weapon', cat: 'staff', rank: 3, atk: 20 },
  center_mic: { name: 'センターマイク', type: 'weapon', cat: 'staff', rank: 2, atk: 10 },
  gold_mic: { name: '金のマイク', type: 'weapon', cat: 'staff', rank: 6, atk: 40 },
};
for (const [id, it] of Object.entries(STUB)) if (!ITEMS[id]) ITEMS[id] = it;
const SHAPES = { kitchen_knife: 'kitchen', chef_knife: 'chefknife', frying_pan: 'pan', chinese_wok: 'wok', ladle: 'ladle', whisk: 'whisk', mop: 'mop', deck_brush: 'brush', center_mic: 'standmic', gold_mic: 'mic' };

// 不透明な ピクセルの かず と、ふちに さわって いないか
function inspect(img) {
  const { w, h, rgba } = img;
  let n = 0;
  let edge = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] === 0) continue;
      n++;
      if (y === 0 || x === 0 || x === w - 1) edge = true;
    }
  }
  return { n, edge };
}
const key = (img) => Buffer.from(img.rgba).toString('base64');

test('新しい 職業の 服: 男女・4方向・かみがたで かけて、はみ出さない', () => {
  for (const job of JOBS10) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const style of ['short', 'afro', 'long', 'mohawk', 'twin']) {
          for (const res of [4, 8]) {
            const img = paintHero({ body, style, hcol: 'black' }, job, undefined, dir, 1, res);
            const r = inspect(img);
            assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${style} res${res} が かけている`);
            assert.ok(!r.edge, `${job} ${body} ${dir} ${style} res${res} が ふちに さわる`);
          }
        }
      }
    }
  }
});

test('新しい 職業の 服: どれも ちがう え（戦士・にている 職業とも ちがう）', () => {
  const LIKE = ['warrior', 'salaryman', 'bucho', 'shacho', 'civil_local', 'civil_national', 'career', 'storm_idol', 'sage', 'archmage', 'hero', 'paladin'];
  for (const body of [0, 1]) {
    for (const dir of DIRS) {
      const seen = new Map();
      for (const job of [...LIKE, ...JOBS10]) {
        const k = key(paintHero({ body, style: 'short' }, job, job === 'warrior' ? '' : undefined, dir, 0, 4));
        assert.ok(!seen.has(k), `${job} body${body} ${dir} が ${seen.get(k)} と おなじ え`);
        seen.set(k, job);
      }
    }
  }
  // 女性の パティシエは スカート（男女で ちがう）
  assert.notEqual(key(paintHero({ body: 0, style: 'short' }, 'patissier', undefined, 'down', 0, 4)), key(paintHero({ body: 1, style: 'short' }, 'patissier', undefined, 'down', 0, 4)));
});

test('新しい 職業の 服: 服の しゅるいと ぼうし（布の服の とき）', () => {
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  const kind = (job, fem = false) => outfitOf(Lk, job, 'cloth', fem).kind;
  for (const job of ['cook', 'patissier', 'star_chef']) {
    assert.equal(kind(job), 'chef', job);
    assert.ok(outfitOf(Lk, job, 'cloth', false).apron, `${job} の エプロン`);
  }
  assert.equal(kind('parttimer'), 'store');
  assert.equal(kind('tatakiage'), 'work');
  for (const job of ['seishain', 'comedian', 'm1_champion']) assert.equal(kind(job), 'suit', job);
  assert.equal(kind('daikenja'), 'robe');
  assert.equal(kind('loto_hero'), 'plate');
  assert.equal(outfitOf(Lk, 'patissier', 'cloth', true).skirt?.kind, 'pleat', '女性の パティシエは スカート');
  // ぼうし
  const hat = (job) => headOf(null, job, 'cloth', outfitOf(Lk, job, 'cloth', false))?.kind || null;
  assert.equal(hat('cook'), 'toque');
  assert.equal(hat('patissier'), 'toque');
  assert.equal(hat('star_chef'), 'toque');
  assert.equal(headOf(null, 'star_chef', 'cloth', null).stars, 3, '三ツ星');
  assert.equal(hat('parttimer'), 'visor');
  assert.equal(hat('tatakiage'), 'hardhat');
  assert.equal(hat('daikenja'), 'wizard');
  assert.equal(hat('loto_hero'), 'winged');
  for (const job of ['seishain', 'comedian', 'm1_champion']) assert.equal(hat(job), null, job);
  // よろいを きると ぼうしは なくなる（いまの 職業と おなじ）
  assert.equal(headOf(null, 'cook', 'iron_armor', null), null);
});

test('新しい ぶき: それぞれ ちがう かたちで、4方向とも はみ出さない', () => {
  const pics = new Set([key(paintHero({ body: 0, style: 'short' }, 'warrior', { weapon: null, armor: 'cloth' }, 'down', 0, 4))]);
  for (const [id, shape] of Object.entries(SHAPES)) {
    const W = weaponOf(id);
    assert.ok(W, `${id} の え`);
    assert.equal(W.shape, shape, id);
    assert.equal(weaponOf(`${id}+2`).shape, shape, `${id}+2 は もとの え`);
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'brown' }, 'warrior', { weapon: id, armor: 'cloth' }, dir, body, res);
          assert.ok(!inspect(img).edge, `${id} ${body} ${dir} res${res} が ふちに さわる`);
        }
      }
    }
    const k = key(paintHero({ body: 0, style: 'short' }, 'warrior', { weapon: id, armor: 'cloth' }, 'down', 0, 4));
    assert.ok(!pics.has(k), `${id} が ほかの ぶきと おなじ え`);
    pics.add(k);
  }
  assert.equal(new Set(Object.values(SHAPES)).size, 10);
  // 新しい 職業が もっても はみ出さない
  for (const [job, w] of [['cook', 'kitchen_knife'], ['patissier', 'whisk'], ['star_chef', 'chef_knife'], ['parttimer', 'mop'], ['tatakiage', 'deck_brush'], ['comedian', 'center_mic'], ['m1_champion', 'gold_mic'], ['cook', 'chinese_wok']]) {
    for (const dir of DIRS) assert.ok(!inspect(paintHero({ body: 1, style: 'afro' }, job, { weapon: w, armor: 'cloth' }, dir, 0, 4)).edge, `${job} ${w} ${dir}`);
  }
});

test('新しい ぶき: 知らない ぶきは これまでどおり 種類で きまり、名前で わかる 道具は その かたち', () => {
  ITEMS.test_axe = { name: 'ためしのオノ', type: 'weapon', cat: 'axe', rank: 2 };
  ITEMS.test_staff = { name: 'ためしのつえ', type: 'weapon', cat: 'staff', rank: 3 };
  ITEMS.test_pan = { name: '銀のフライパン', type: 'weapon', cat: 'axe', rank: 3 };
  ITEMS.test_mic = { name: 'マイク', type: 'weapon', cat: 'staff', rank: 2 };
  try {
    assert.equal(weaponOf('test_axe').shape, 'axe');
    assert.equal(weaponOf('test_staff').shape, 'wizard');
    assert.equal(weaponOf('test_pan').shape, 'pan');
    assert.equal(weaponOf('test_mic').shape, 'mic');
    assert.equal(weaponOf('test_mic').mk, null, 'ふつうの マイクは くろ');
  } finally {
    for (const id of ['test_axe', 'test_staff', 'test_pan', 'test_mic']) delete ITEMS[id];
  }
});

test('新しい ぶき: フライパン・中華なべの こうげきは カーン！（エフェクトが うごく）', () => {
  for (const id of ['frying_pan', 'chinese_wok']) assert.equal(weaponLook(id, 'axe').move, 'pan', id);
  assert.equal(weaponLook('mop', 'staff').trait, 'water');
  // ためしの エフェクト（よばれた ものを かぞえる）
  const calls = [];
  const fx = new Proxy({ W: 256, H: 144 }, {
    get: (o, k) => (k in o ? o[k] : (...a) => { calls.push(k); return k === 'swipe' ? (a[3]?.delay || 0) + 80 : undefined; }),
  });
  const hit = playWeapon(fx, { x: 120, y: 60, w: 32, h: 32, foot: 80 }, weaponLook('frying_pan', 'axe'), false, 0);
  assert.ok(hit > 0);
  assert.ok(calls.includes('shock') && calls.includes('star') && calls.includes('twinkle'));
});

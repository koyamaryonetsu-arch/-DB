// 主人公の え（render/hero.js）: どの かみがた・そうびでも かけて、はみ出さない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paintHero, heroLookKey } from '../public/js/client/render/hero.js';
import { weaponOf, shieldOf } from '../public/js/client/render/hero-gear.js';
import { HAIR_STYLES, HAIR_COLORS, SKIN_TONES, FACES } from '../public/js/shared/data/looks.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { JOBS } from '../public/js/shared/data/jobs.js';

const DIRS = ['down', 'left', 'up', 'right'];

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

test('主人公の え: 大きさは res 4 で 64×84、res 8 で 128×168', () => {
  const a = paintHero({}, 'warrior', undefined, 'down', 0, 4);
  assert.equal(a.w, 64);
  assert.equal(a.h, 84);
  assert.equal(a.rgba.length, 64 * 84 * 4);
  const b = paintHero({}, 'warrior', undefined, 'down', 0, 8);
  assert.equal(b.w, 128);
  assert.equal(b.h, 168);
});

test('主人公の え: すべての かみがたを 4方向で かけて、上や 横に はみ出さない', () => {
  for (const res of [4, 8]) {
    for (const body of [0, 1]) {
      for (const s of HAIR_STYLES) {
        for (const dir of DIRS) {
          for (const head of [null, 'iron_helm', 'pointy_hat']) {
            const look = { body, style: s.id, hcol: 'brown' };
            const img = paintHero(look, 'warrior', { weapon: 'iron_sword', armor: 'leather_armor', shield: 'leather_shield', head }, dir, res === 4 ? 1 : 0, res);
            const r = inspect(img);
            assert.ok(r.n > img.w * img.h * 0.12, `${s.id} ${dir} res${res} が かけている`);
            assert.ok(!r.edge, `${s.id} ${dir} ${head} res${res} が ふちに さわる`);
          }
        }
      }
    }
  }
});

test('主人公の え: かみの色・はだの色・目もとで えが かわる', () => {
  const base = paintHero({ style: 'short', hcol: 'black', tone: 'light', face: 'std' }, 'warrior', '', 'down', 0, 4).rgba;
  const diff = (l) => {
    const o = paintHero({ style: 'short', hcol: 'black', tone: 'light', face: 'std', ...l }, 'warrior', '', 'down', 0, 4).rgba;
    let d = 0;
    for (let i = 0; i < o.length; i += 4) if (o[i] !== base[i] || o[i + 1] !== base[i + 1] || o[i + 2] !== base[i + 2] || o[i + 3] !== base[i + 3]) d++;
    return d;
  };
  for (const c of HAIR_COLORS.slice(1)) assert.ok(diff({ hcol: c.id }) > 0, c.id);
  for (const t of SKIN_TONES.filter((x) => x.id !== 'light')) assert.ok(diff({ tone: t.id }) > 0, t.id);
  for (const f of FACES.filter((x) => x.id !== 'std')) assert.ok(diff({ face: f.id }) > 0, f.id);
  // むかしの look と 新しい look が 同じ みためなら 同じ キー
  assert.equal(heroLookKey({ body: 1, hair: 3, hairColor: 2, skin: 1, color: 4 }), heroLookKey({ body: 1, style: 'pony', hcol: 'blonde', tone: 'tan', color: 4 }));
});

test('主人公の え: すべての そうびと 職業を かける（知らない そうびも かわりの えで）', () => {
  const kinds = { weapon: 'weapon', armor: 'armor', shield: 'shield', head: 'head' };
  let count = 0;
  for (const [id, it] of Object.entries(ITEMS)) {
    const slot = kinds[it.slot] || kinds[it.type] || kinds[it.kind];
    if (!slot) continue;
    for (const dir of DIRS) {
      const img = paintHero({}, 'warrior', { weapon: null, armor: null, shield: null, head: null, [slot]: id }, dir, 0, 4);
      assert.ok(!inspect(img).edge, `${id} ${dir} が ふちに さわる`);
    }
    count++;
  }
  assert.ok(count > 30, `そうび ${count}`);
  for (const job of Object.keys(JOBS)) {
    for (const dir of DIRS) {
      const img = paintHero({ body: 1 }, job, undefined, dir, 1, 4);
      assert.ok(inspect(img).n > 500, job);
    }
  }
  // まだ ない そうび（これから ふえる もの）でも こわれない
  const odd = paintHero({}, 'warrior', { weapon: 'future_blade', armor: 'mystery_mail', shield: 'unknown_shield', head: 'odd_hat' }, 'down', 0, 4);
  assert.ok(inspect(odd).n > 500);
});

test('主人公の え: きたえた そうび（iron_sword+2）は もとの そうびの え（＋は きらめきが つく）', () => {
  const strip = (o) => { const { plus, ...rest } = o; void plus; return rest; };
  assert.deepEqual(strip(weaponOf('iron_sword+2')), strip(weaponOf('iron_sword')));
  assert.equal(weaponOf('iron_sword+2').plus, 2);
  assert.deepEqual(strip(shieldOf('iron_shield+3')), strip(shieldOf('iron_shield')));
  for (const dir of DIRS) {
    const a = paintHero({}, 'warrior', { weapon: 'iron_sword', armor: 'iron_armor', shield: 'iron_shield', head: 'iron_helm' }, dir, 0, 4).rgba;
    const b = paintHero({}, 'warrior', { weapon: 'iron_sword+2', armor: 'iron_armor+1', shield: 'iron_shield+3', head: 'iron_helm+1' }, dir, 0, 4).rgba;
    let d = 0;
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 3] !== b[i + 3]) d++;
    assert.ok(d < 120, `${dir}: ちがう ドット ${d}`);
  }
});

test('主人公の え: 学校・公務員・町の みかた・アイドルの 服（男女・4方向・はみ出さない・それぞれ ちがう え）', () => {
  const NEW = ['schoolkid', 'middleschooler', 'highschooler', 'civil_local', 'civil_national', 'career', 'police', 'firefighter', 'fruit_idol', 'storm_idol'];
  const pics = new Map();
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const style of ['short', 'afro', 'long', 'mohawk']) {
          for (const res of [4, 8]) {
            const img = paintHero({ body, style, hcol: 'black' }, job, undefined, dir, 1, res);
            const r = inspect(img);
            assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${style} res${res} が かけている`);
            assert.ok(!r.edge, `${job} ${body} ${dir} ${style} res${res} が ふちに さわる`);
          }
        }
        pics.set(`${job}|${body}|${dir}`, Buffer.from(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4).rgba).toString('base64'));
      }
    }
  }
  // どの 職業も 戦士（よろいの ない ときの ふつうの 服）とも、ほかの 新しい 職業とも ちがう
  for (const body of [0, 1]) {
    for (const dir of DIRS) {
      const seen = new Set([Buffer.from(paintHero({ body, style: 'short' }, 'warrior', '', dir, 0, 4).rgba).toString('base64')]);
      for (const job of NEW) {
        const k = pics.get(`${job}|${body}|${dir}`);
        assert.ok(!seen.has(k), `${job} body${body} ${dir} が ほかと おなじ え`);
        seen.add(k);
      }
    }
  }
  // 中学生は 男の子が 学ラン、女の子が セーラー服（体で ちがう え）・小学生の ランドセルも 男女で 色が ちがう
  for (const job of ['middleschooler', 'highschooler', 'schoolkid']) {
    assert.notEqual(pics.get(`${job}|0|up`), pics.get(`${job}|1|up`), job);
  }
});

test('主人公の え: 同じ 入力なら いつも 同じ え', () => {
  const look = { body: 1, style: 'twin', hcol: 'pink', tone: 'fair', face: 'smile', color: 6 };
  const a = Buffer.from(paintHero(look, 'idol', undefined, 'left', 1, 8).rgba);
  paintHero({ style: 'afro' }, 'monk', undefined, 'up', 0, 4);
  const b = Buffer.from(paintHero(look, 'idol', undefined, 'left', 1, 8).rgba);
  assert.deepEqual(a, b);
});

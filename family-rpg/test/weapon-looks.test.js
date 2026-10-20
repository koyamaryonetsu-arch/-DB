// 第38回 D: 見た目の 武器と 盾の 形（look）
//   どの 品も 正しい 形に なる・どの 形も 4方向で かける・★4・★5 は かざりが つく・見た目装備でも 同じ 絵
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, baseItemId } from '../public/js/shared/data/items.js';
import {
  WEAPON_LOOKS, SHIELD_LOOKS, TOOL_LOOKS, TOOL_SHIELD_LOOKS, GEAR_LOOK, lookOfWeapon, lookOfShield, validWeaponLook, validShieldLook, autoLook, isOrnate, gearStarsOf,
} from '../public/js/shared/data/gear-looks.js';
import { weaponOf, shieldOf, gearStars } from '../public/js/client/render/hero-gear.js';
import { ORNATE } from '../public/js/client/render/hero-gear-looks.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { shownEquip } from '../public/js/shared/look-equip.js';

const DIRS = ['down', 'left', 'up', 'right'];
const weapons = Object.keys(ITEMS).filter((id) => ITEMS[id].type === 'weapon' && baseItemId(id) === id && !ITEMS[id].base);
const shields = Object.keys(ITEMS).filter((id) => ITEMS[id].type === 'shield' && baseItemId(id) === id && !ITEMS[id].base);

function inspect(img) {
  const { w, h, rgba } = img;
  let n = 0, edge = false;
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
const paint = (eq, dir, f = 0, res = 4) => paintHero({}, 'warrior', { weapon: null, armor: 'leather_armor', shield: null, head: null, ...eq }, dir, f, res);
const diff = (a, b) => { let d = 0; for (let i = 0; i < a.rgba.length; i += 4) if (a.rgba[i] !== b.rgba[i] || a.rgba[i + 1] !== b.rgba[i + 1] || a.rgba[i + 2] !== b.rgba[i + 2] || a.rgba[i + 3] !== b.rgba[i + 3]) d++; return d; };

test('形の 一覧: 武器種ごとに 4つ以上・盾も 4つ以上（名前の かぶりなし）', () => {
  for (const [cat, list] of Object.entries(WEAPON_LOOKS)) {
    assert.ok(list.length >= 4, `${cat}: ${list.length}`);
    assert.equal(new Set(list).size, list.length, cat);
  }
  assert.ok(SHIELD_LOOKS.length >= 4);
  // ゲームに ある 武器種は ぜんぶ 形の 一覧が ある
  for (const id of weapons) assert.ok(WEAPON_LOOKS[ITEMS[id].cat], `${id} の 武器種 ${ITEMS[id].cat}`);
});

test('品の look（GEAR_LOOK）: ある 品で、その 武器種で 使える 形', () => {
  for (const [id, lk] of Object.entries(GEAR_LOOK)) {
    const it = ITEMS[id];
    assert.ok(it, `${id} は ない 品`);
    if (it.type === 'shield') assert.ok(validShieldLook(lk), `${id}: ${lk}`);
    else assert.ok(validWeaponLook(it.cat, lk), `${id}（${it.cat}）: ${lk}`);
    assert.equal(it.look, lk, `${id} の データに look が ついていない`);
  }
});

test('すべての 武器と 盾が 正しい 形に なる（絵の がわも おなじ 形）・どの 形も 1つ以上の 品が 使う', () => {
  const used = new Set();
  for (const id of weapons) {
    const it = ITEMS[id];
    const W = weaponOf(id);
    assert.ok(W && W.look, id);
    assert.ok(validWeaponLook(it.cat, W.look), `${id}: ${W.look}`);
    assert.equal(W.shape, W.look, id);
    if (it.look) assert.equal(W.look, it.look, `${id}: データの look と ちがう`);
    else assert.equal(W.look, TOOL_LOOKS.includes(W.look) ? W.look : lookOfWeapon(it), id);
    used.add(`${it.cat}:${W.look}`);
    // きたえた 品も 同じ 形
    if (ITEMS[`${id}+1`]) assert.equal(weaponOf(`${id}+1`).look, W.look, `${id}+1`);
  }
  for (const id of shields) {
    const S = shieldOf(id);
    assert.ok(validShieldLook(S.look), `${id}: ${S.look}`);
    assert.equal(S.kind, S.look, id);
    used.add(`shield:${S.look}`);
  }
  for (const [cat, list] of Object.entries(WEAPON_LOOKS)) for (const lk of list) assert.ok(used.has(`${cat}:${lk}`), `${cat}:${lk} を 使う 品が ない`);
  for (const lk of SHIELD_LOOKS) assert.ok(used.has(`shield:${lk}`), `shield:${lk} を 使う 品が ない`);
});

test('look の ない 品（これから ふえる 品）は 名前と ランクで 自動で きまる', () => {
  const W = (cat, name, rank) => lookOfWeapon({ type: 'weapon', cat, name, rank });
  assert.equal(W('sword', '炎の大剣', 7), 'flame');
  assert.equal(W('sword', '聖なる剣', 9), 'holy');
  assert.equal(W('sword', 'ふつうの剣', 3), 'broad');
  assert.equal(W('sword', 'ふつうの剣', 8), 'great');
  assert.equal(W('axe', '雷のハンマー', 6), 'hammer');
  assert.equal(W('spear', '海のトライデント', 6), 'trident');
  assert.equal(W('staff', '星のロッド', 6), 'star');
  assert.equal(W('boomerang', '星のブーメラン', 6), 'star');
  assert.equal(lookOfShield({ type: 'shield', name: '竜の大盾', rank: 7 }), 'dragon');
  assert.equal(lookOfShield({ type: 'shield', name: 'なにかのたて', rank: 2 }), 'round');
  // 知らない 武器種でも こわれない
  assert.ok(validWeaponLook('sword', W('laser', 'ビームソード', 5)));
  // まちがった look は 自動に もどす
  assert.equal(lookOfWeapon({ type: 'weapon', cat: 'sword', name: '炎の剣', rank: 3, look: 'no_such' }), 'flame');
  assert.equal(autoLook({ type: 'shield', name: '鏡のたて', rank: 5 }), 'mirror');
});

// 形ごとに 1つ（いちばん ★の 少ない 品）
function pickPer(list, lookOf, cat) {
  const m = new Map();
  for (const id of list) {
    const lk = lookOf(id);
    const k = `${cat(id)}:${lk}`;
    if (!m.has(k) || gearStars(id) < gearStars(m.get(k))) m.set(k, id);
  }
  return m;
}

test('どの 形も 4方向・2コマ（フィールドと 戦いの 大きさ）で かけて、はしに さわらない', () => {
  const W = pickPer(weapons, (id) => weaponOf(id).look, (id) => ITEMS[id].cat);
  const S = pickPer(shields, (id) => shieldOf(id).look, () => 'shield');
  for (const [k, id] of [...W, ...S]) {
    const slot = ITEMS[id].type;
    for (const res of [4, 10]) {
      for (const dir of DIRS) {
        for (const f of [0, 1]) {
          const img = paint({ [slot]: id }, dir, f, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${k} ${id} ${dir} res${res}`);
          assert.ok(!r.edge, `${k} ${id} ${dir} f${f} res${res} が はしに さわる`);
        }
        // 何も もたない ときと ちがう 絵（4方向とも 何か 見える。うしろむきの 盾は うらがわ）
        if (res === 4) assert.ok(diff(paint({ [slot]: id }, dir), paint({}, dir)) > 6, `${k} ${id} ${dir} が 見えない`);
      }
    }
  }
});

test('同じ 武器種の ちがう 形は ちがう 絵（まえ むき・よこ むき）', () => {
  const W = pickPer(weapons, (id) => weaponOf(id).look, (id) => ITEMS[id].cat);
  for (const cat of Object.keys(WEAPON_LOOKS)) {
    for (const dir of ['down', 'left']) {
      const seen = new Map();
      for (const lk of WEAPON_LOOKS[cat]) {
        const id = W.get(`${cat}:${lk}`);
        const k = key(paint({ weapon: id }, dir));
        assert.ok(!seen.has(k), `${cat}: ${lk} と ${seen.get(k)} が おなじ 絵（${dir}）`);
        seen.set(k, lk);
      }
    }
  }
  const S = pickPer(shields, (id) => shieldOf(id).look, () => 'shield');
  const seen = new Map();
  for (const lk of SHIELD_LOOKS) {
    const k = key(paint({ shield: S.get(`shield:${lk}`) }, 'down'));
    assert.ok(!seen.has(k), `shield: ${lk} と ${seen.get(k)}`);
    seen.set(k, lk);
  }
});

test('★4・★5 の 品は かざり（宝石・光の すじ・きらめき）が つく。★3 までは つかない', () => {
  let n4 = 0;
  const check = (id, slot) => {
    const stars = gearStarsOf(ITEMS[id]);
    assert.equal(gearStars(id), stars);
    assert.equal(isOrnate(ITEMS[id]), stars >= 4);
    assert.equal((slot === 'weapon' ? weaponOf(id) : shieldOf(id)).stars, stars, id);
    // まえむき（戦いの 画面の 絵）は かならず、4方向の うち 3つ以上で 見える（よこむきの おくの 手は からだに かくれる ことが ある）
    let seen = 0;
    for (const dir of DIRS) {
      const on = paint({ [slot]: id }, dir);
      ORNATE.on = false;
      const off = paint({ [slot]: id }, dir);
      ORNATE.on = true;
      const d = diff(on, off);
      if (stars >= 4) {
        if (dir === 'down') assert.ok(d > 4, `${id}（★${stars}）まえむき: かざりが 見えない`);
        if (d > 4) seen++;
      } else assert.equal(d, 0, `${id}（★${stars}）${dir}: かざりが ついている`);
    }
    if (stars >= 4) assert.ok(seen >= 3, `${id}（★${stars}）: かざりが 見える 方向 ${seen}`);
    if (stars >= 4) n4++;
  };
  try {
    for (const id of weapons) check(id, 'weapon');
    for (const id of shields) check(id, 'shield');
  } finally { ORNATE.on = true; }
  assert.ok(n4 >= 40, `★4・★5 の 品 ${n4}`);
  // ★5 は あるく コマで きらめく 場所が かわる（ゆらめき）
  const five = weapons.find((id) => gearStars(id) >= 5 && weaponOf(id).cat === 'sword');
  assert.ok(diff(paint({ weapon: five }, 'down', 0), paint({ weapon: five }, 'down', 1)) > 0);
});

test('見た目装備（第23回）で えらんだ 武器・盾も 同じ 形の 絵', () => {
  const c = { equip: { weapon: 'iron_sword', armor: 'leather_armor', shield: 'leather_shield', head: null }, lookEquip: { weapon: 'lake_holy_sword', shield: 'yata_mirror' } };
  const eq = shownEquip(c);
  assert.equal(weaponOf(eq.weapon).look, 'holy');
  assert.equal(shieldOf(eq.shield).look, 'mirror');
  for (const dir of DIRS) {
    const a = paintHero({}, 'warrior', eq, dir, 0, 4);
    const b = paintHero({}, 'warrior', { weapon: 'lake_holy_sword', armor: 'leather_armor', shield: 'yata_mirror', head: null }, dir, 0, 4);
    assert.equal(key(a), key(b), dir);
  }
});

// 第4章の 魔物の え（render/ch4-art.js）と 砂の国の 人の みため（render/chars.js の NPC_LOOKS・ターバン・ずきん・スカーフ・金の わ・ラクダ）
// ブラウザが なくても しらべられる ところだけ（え の かきかた・パレット・はみだし・NPC の みため）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTER_ART, bigNpcScale, fadeAt } from '../public/js/client/render/monsters.js';
import { addCh4Art } from '../public/js/client/render/ch4-art.js';
import { MONSTERS_CH4 } from '../public/js/shared/data/monsters-ch4.js';
import { npcOpts, paintHuman, paintSpecial } from '../public/js/client/render/chars.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { CH4_MAPS } from '../public/js/shared/maps/ch4.js';

const CH4_MONSTERS = Object.keys(MONSTERS_CH4);

// monsters.js の かく ための どうぐ の かわり: つかった いろ と はみだしを しらべる
function stubG(w, h) {
  const colors = new Set();
  const pts = [];
  const g = {
    w, h,
    ell(cx, cy, rx, ry, c) { colors.add(c); pts.push([cx - rx, cy - ry], [cx + rx, cy + ry]); },
    poly(p, c) { colors.add(c); for (const q of p) pts.push(q); },
    rect(x, y, rw, rh, c) { colors.add(c); pts.push([x, y], [x + rw, y + rh]); },
    line(p, c, lw = 1) {
      colors.add(c);
      for (const [x, y] of p) pts.push([x - lw / 2 / w, y - lw / 2 / h], [x + lw / 2 / w, y + lw / 2 / h]);
    },
    eye(cx, cy, r, look = 0, white = '#ffffff', pupil = '#1a1026') {
      colors.add(white); colors.add(pupil); colors.add('#ffffff');
      pts.push([cx - r, cy - r * 1.25 * (w / h)], [cx + r, cy + r * 1.25 * (w / h)]);
    },
    dot(x, y, c) { colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts };
}

// え の まわりの よはく（1ドット）より 外に はみだすと きれて しまう
function outside(pts, w, h, extra = 0.6) {
  const mx = (1 + extra) / w, my = (1 + extra) / h;
  return pts.filter(([x, y]) => x < -mx || x > 1 + mx || y < -my || y > 1 + my);
}

const lower = (a) => new Set(a.map((c) => c.toLowerCase()));

test('第4章の 魔物の え: monsters-ch4.js の 魔物が ぜんぶ ある（addCh4Art だけでも そろう）', () => {
  assert.deepEqual(CH4_MONSTERS.sort(), ['gold_beetle', 'mirage_flower', 'moon_ghost', 'sand_slime', 'sand_vulture', 'scorpion_soldier']);
  for (const id of CH4_MONSTERS) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    assert.ok(Array.isArray(d.size) && d.size.length === 2 && d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= 70), `${id}: size`);
    assert.ok(Array.isArray(d.pal) && d.pal.length >= 4 && d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)), `${id}: pal`);
    assert.equal(new Set(d.pal).size, d.pal.length, `${id}: pal に おなじ いろが ない`);
    assert.equal(typeof d.draw, 'function', `${id}: draw`);
    if (d.field !== undefined) assert.ok(d.field >= 20 && d.field <= 32, `${id}: field`);
    assert.equal(d.npc, undefined, `${id}: ふつうの 大きさの NPC`);
  }
  const art = {};
  addCh4Art(art);
  for (const id of CH4_MONSTERS) assert.equal(art[id]?.draw, MONSTER_ART[id].draw, `addCh4Art: ${id}`);
});

test('第4章の 魔物の え: 大きさの きまり（s は m より 小さい。とぶ 魔物は よこに ひろい）', () => {
  const area = (id) => MONSTER_ART[id].size[0] * MONSTER_ART[id].size[1];
  const small = CH4_MONSTERS.filter((id) => MONSTERS_CH4[id].size === 's');
  const mid = CH4_MONSTERS.filter((id) => MONSTERS_CH4[id].size === 'm');
  assert.deepEqual(small.sort(), ['gold_beetle', 'sand_slime']);
  for (const s of small) for (const m of mid) assert.ok(area(s) < area(m), `${s} < ${m}`);
  for (const id of CH4_MONSTERS.filter((x) => MONSTERS_CH4[x].flying)) {
    const [w, h] = MONSTER_ART[id].size;
    assert.ok(w > h, `${id}: つばさを ひろげる`);
  }
});

test('第4章の 魔物の え: 2コマ とも、たたかいの 大きさ でも フィールドの 小さな え でも かける（いろは パレットの なか・はみださない）', () => {
  for (const id of CH4_MONSTERS) {
    const d = MONSTER_ART[id];
    const pal = lower(d.pal);
    const [W, H] = d.size;
    const k = Math.min(1, (d.field || 20) / Math.max(W, H));
    // たたかい・フィールドの シンボル（20）・ついてくる なかま（24）
    const k24 = Math.min(1, Math.min(d.field || 20, 24) / Math.max(W, H));
    const sizes = [[W, H], [Math.max(10, Math.round(W * k)), Math.max(10, Math.round(H * k))], [Math.max(10, Math.round(W * k24)), Math.max(10, Math.round(H * k24))]];
    for (const [w, h] of sizes) {
      for (const f of [0, 1]) {
        const s = stubG(w, h);
        d.draw(s.g, f);
        assert.ok(s.pts.length > 40, `${id}: なにか かいた`);
        const bad = [...s.colors].filter((c) => !pal.has(String(c).toLowerCase()));
        assert.deepEqual(bad, [], `${id} f${f} ${w}×${h}: パレットに ない いろ`);
        const out = outside(s.pts, w, h);
        assert.equal(out.length, 0, `${id} f${f} ${w}×${h}: はみだし ${JSON.stringify(out.slice(0, 3))}`);
      }
    }
    // 2コマで うごく
    const a = stubG(W, H), b = stubG(W, H);
    d.draw(a.g, 0);
    d.draw(b.g, 1);
    assert.notDeepEqual(a.pts, b.pts, `${id}: コマで うごく`);
    // パレットの いろは ちゃんと つかう（よぶんな いろが ない）
    const used = lower([...a.colors, ...b.colors]);
    assert.deepEqual(d.pal.filter((c) => !used.has(c.toLowerCase())), [], `${id}: つかわない いろ`);
  }
});

test('第4章の 魔物の え: すきとおるのは 月のゆうれい と まぼろしの花（下ほど うすい。2.5D でも きえない こさ）', () => {
  assert.ok(MONSTER_ART.moon_ghost.fade, '月のゆうれいは すける');
  assert.ok(MONSTER_ART.mirage_flower.fade, 'まぼろしの花は すける');
  for (const id of CH4_MONSTERS) {
    const fd = MONSTER_ART[id].fade;
    if (!fd) continue;
    assert.ok(fd.length >= 2);
    for (let i = 0; i < fd.length; i++) {
      const [y, a] = fd[i];
      assert.ok(y >= 0 && y <= 1 && a > 0.55 && a <= 1, `${id}: ${y} ${a}`);
      if (i) assert.ok(y > fd[i - 1][0] && a <= fd[i - 1][1], `${id}: 下ほど うすい`);
    }
    assert.equal(fadeAt(fd, 0), 1, `${id}: 頭は くっきり`);
    assert.ok(fadeAt(fd, 0.99) < 0.8, `${id}: すそは すける`);
  }
  // fadeAt: あいだは なめらか
  assert.equal(fadeAt([[0.5, 1], [1, 0.5]], 0.75), 0.75);
  assert.equal(fadeAt([[0.5, 1], [1, 0.5]], 0.2), 1);
  assert.equal(fadeAt([[0.5, 1], [1, 0.5]], 1.2), 0.5);
  // ほかの 章の 魔物は すけない
  for (const id of ['pururin', 'ghost_pirate', 'snow_slime', 'shadow_flame']) assert.equal(MONSTER_ART[id].fade, undefined, id);
});

test('北の古井戸: サソリ兵・砂ぷるりんは ちいさい NPC の え（大きな NPC では ない）。第4章の NPC は みんな え が ある', () => {
  assert.equal(bigNpcScale('mon:scorpion_soldier'), null);
  assert.equal(bigNpcScale('mon:sand_slime'), null);
  const seen = new Set();
  for (const id of CH4_MAPS) {
    for (const n of MAPS[id].npcs) {
      seen.add(n.sprite);
      assert.ok(!n.big, `${n.id}: ちいさい NPC`);
      if (n.sprite.startsWith('mon:')) assert.ok(MONSTER_ART[n.sprite.slice(4)], `${n.id}: ${n.sprite} の え`);
      else assert.ok(npcOpts(n.sprite) || paintSpecial(n.sprite, 'down', 0), `${n.id}: ${n.sprite} の みため`);
    }
  }
  assert.ok(seen.has('mon:scorpion_soldier') && seen.has('mon:sand_slime'));
});

// ───── 砂の国の 人 ─────
const DESERT = ['desert_elder', 'desert_m', 'desert_m2', 'desert_f', 'desert_f2', 'desert_kid', 'ami', 'desert_merchant', 'desert_priest', 'caravan'];
const NEW_HATS = ['turban', 'keffiyeh', 'shawl', 'circlet'];

// え の ドット（Painter）を くらべる ための もじれつ
const sig = (p) => p.px.map((c) => c || '.').join(',');

test('砂の国の 人: みためが ぜんぶ ある。男の人は ターバン か ずきん、女の人は スカーフ。アミは ちいさい ふたつむすびに 金の わ', () => {
  for (const id of DESERT) assert.ok(npcOpts(id), id);
  for (const id of ['desert_elder', 'desert_m', 'desert_m2', 'desert_merchant', 'caravan', 'desert_kid']) {
    assert.ok(['turban', 'keffiyeh'].includes(npcOpts(id).hat), `${id}: ${npcOpts(id).hat}`);
  }
  for (const id of ['desert_f', 'desert_f2']) assert.equal(npcOpts(id).hat, 'shawl', id);
  // 新しい ぼうしは どれも だれかが かぶる
  const used = new Set(DESERT.map((id) => npcOpts(id).hat));
  for (const h of NEW_HATS) assert.ok(used.has(h), `${h} を つかう`);
  const ami = npcOpts('ami');
  assert.ok(ami.small && ami.female && ami.hairStyle === 'twin', 'アミ');
  assert.equal(ami.hat, 'circlet', 'アミは かみが みえる 金の わ');
  // ほかの 章の 人の ぼうしは そのまま
  for (const [id, hat] of [['priestess', 'veil'], ['carpenter', 'bandana'], ['snow_m', 'cowl'], ['priest', 'mitre'], ['captain', 'bandana'], ['farmer', 'straw']]) {
    assert.equal(npcOpts(id).hat, hat, id);
  }
});

test('新しい ぼうし（ターバン・ずきん・スカーフ・金の わ）: 4方向・2コマ かける。ぼうし なし とも バンダナ とも ちがう え', () => {
  const base = npcOpts('desert_m');
  for (const hat of NEW_HATS) {
    for (const dir of ['down', 'left', 'right', 'up']) {
      for (const f of [0, 1]) {
        const p = paintHuman(dir, f, { ...base, hat, hatColor: '#c83a3a', hatGem: '#3ac8c0', hatTrim: '#f2c14e' });
        assert.equal(p.w, 64);
        assert.equal(p.h, 84);
        const plain = paintHuman(dir, f, { ...base, hat: null });
        const band = paintHuman(dir, f, { ...base, hat: 'bandana', hatColor: '#c83a3a' });
        assert.notEqual(sig(p), sig(plain), `${hat} ${dir}${f}: ぼうしが みえる`);
        assert.notEqual(sig(p), sig(band), `${hat} ${dir}${f}: バンダナと ちがう`);
        // ぼうしの ドットが ある（金の わは 金）
        assert.ok(p.px.some((c, i) => c && (p.tg[i] === 'hat' || p.tg[i] === 'gold')), `${hat} ${dir}${f}: ぼうしの ドット`);
      }
    }
  }
  // 砂の国の 人は みんな 4方向 かける
  for (const id of DESERT) for (const dir of ['down', 'left', 'right', 'up']) assert.ok(paintHuman(dir, 0, npcOpts(id)).px.some(Boolean), `${id} ${dir}`);
});

test('ラクダ（キャラバンの ラクダ）: とくべつな え。4方向・2コマ・みぎは ひだりの はんてん', () => {
  assert.equal(npcOpts('camel'), null, 'ラクダは 人では ない');
  for (const dir of ['down', 'up', 'left', 'right']) {
    const a = paintSpecial('camel', dir, 0), b = paintSpecial('camel', dir, 1);
    assert.ok(a && b, dir);
    assert.ok(a.px.filter(Boolean).length > 400, `${dir}: なにか かいた`);
    assert.notEqual(sig(a), sig(b), `${dir}: あるく コマ`);
    // 人（16×21）より 大きい
    assert.ok(a.w / 4 >= 16 && a.h / 4 >= 21, `${dir}: ${a.w}×${a.h}`);
  }
  const l = paintSpecial('camel', 'left', 0), r = paintSpecial('camel', 'right', 0);
  assert.equal(sig(l.flipX()), sig(r), 'みぎむきは はんてん');
});

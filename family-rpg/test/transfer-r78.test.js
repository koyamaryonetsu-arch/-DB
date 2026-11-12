// 第78回: 引っこしコード KIZUNA-5（本物の 圧縮・分ける・ファイル。docs/plan-r78-transfer.md）
//   1. ちぢめる しくみ（文脈まぜ＋算術符号）・下じき・base64url・CRC
//   2. きりの マップ（まるの まん中だけ）
//   3. KIZUNA-5 の 書き出し・読みこみ（こわれた・切れた コード）
//   4. 分けた コード（どの じゅんでも そろえば 読める）
//   5. 前の コード（KIZUNA-1〜4）も 読める
//   6. 見はり: いちばん 大きな セーブ・ふつうの セーブの 長さ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {
  exportCode, exportCodeV4, parseCode, splitCode, joinParts, cleanCode, slimChar, slimChar4, slimChar5, unslimChar5, hash, pack, LINE_MAX,
} from '../public/js/shared/world/transfer.js';
import { cmPack, cmUnpack, toB64u, fromB64u, crc32, packExplored, unpackExplored } from '../public/js/shared/world/transfer-pack.js';
import { PRIME_5 } from '../public/js/shared/world/transfer-prime.js';
import { repairChar, SAVE_VERSION } from '../public/js/shared/world/save.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { makeRng } from '../public/js/shared/rng.js';
import { biggestChar, typicalChar, walkExplored } from './transfer-big-save.js';

const enc = (s) => new TextEncoder().encode(s);
const dec = (b) => new TextDecoder().decode(b);
const PRIME = enc(PRIME_5);
const typical = await typicalChar();
const biggest = await biggestChar();
const want = (c) => repairChar(JSON.parse(JSON.stringify(c)));

// ───────────── 1. ちぢめる しくみ ─────────────
test('ちぢめる しくみ: どんな バイトでも もとに もどる（下じき あり・なし）', () => {
  const rng = makeRng(78);
  const rand = new Uint8Array(3000).map(() => Math.floor(rng.next() * 256));
  const samples = [new Uint8Array(0), enc('a'), enc('ソラの引っこし🌟'), enc('ab'.repeat(5000)), rand, enc(JSON.stringify(typical))];
  for (const s of samples) {
    for (const p of [undefined, PRIME]) {
      const z = cmPack(s, p);
      assert.deepEqual(cmUnpack(z, 4000000, p), s);
      assert.deepEqual(cmPack(s, p), z, '何回 やっても 同じ');
    }
  }
});

test('ちぢめる しくみ: 決まった 答え（しくみを かえると 前の コードが 読めなく なる ので 見はる）', () => {
  // 下じきは ぜったいに かえない
  assert.equal(crc32(PRIME), 'b194c6f9');
  assert.equal(PRIME_5.length, 69965);
  assert.ok(/^[\x0a\x20-\x7e]*$/.test(PRIME_5), '下じきは 英数字と 記号だけ');
  const sample = JSON.stringify({ v: 4, at: 1794488401253, char: { id: 'u1', name: 'ユイ', level: 12, flags: ['p_opening', 'c1_town'], kills: { wolf: 3, slime: 12 } } });
  assert.equal(toB64u(cmPack(enc(sample), PRIME)), 'hgEXToOQaFop9f7Mu0WxlQycBk8sTUhvM6440YQORQy5u4t0PxCN5gwo');
  assert.equal(dec(cmUnpack(fromB64u('hgEXToOQaFop9f7Mu0WxlQycBk8sTUhvM6440YQORQy5u4t0PxCN5gwo'), 4000000, PRIME)), sample);
  assert.equal(crc32(enc('123456789')), 'cbf43926', 'CRC-32（ふつうの もの）');
});

test('ちぢめる しくみ: こわれた データは Error（長すぎる・あまり）', () => {
  const z = cmPack(enc('hello hello hello'), PRIME);
  assert.throws(() => cmUnpack(Uint8Array.from([0xff, 0xff, 0xff, 0xff, 0x7f]), 4000000, PRIME), /too long|bad length/);
  assert.throws(() => cmUnpack(Uint8Array.from([...z, 1, 2, 3, 4, 5, 6]), 4000000, PRIME), /extra/);
});

test('base64url: 英数字と - _ だけ。もどる', () => {
  for (let n = 0; n < 40; n++) {
    const b = new Uint8Array(n).map((_, i) => (i * 37 + n) & 255);
    const s = toB64u(b);
    assert.match(s, /^[A-Za-z0-9_-]*$/);
    assert.deepEqual(fromB64u(s), b);
  }
  assert.throws(() => fromB64u('ab+c'));
});

// ───────────── 2. きりの マップ ─────────────
test('きりの マップ: まるの まん中だけに して、ぴったり もどる。もどらない 形は null', () => {
  const rng = makeRng(5).next;
  let n = 0;
  for (const id of ['overworld', 'cave_b1', 'village']) {
    const m = MAPS[id];
    if (!m) continue;
    const R = m.kind === 'dungeon' ? 5 : 8;
    const b64 = walkExplored(m, rng, 0.5);
    const s = packExplored(b64, m.w, m.h, R);
    assert.ok(s, id);
    assert.equal(unpackExplored(s), b64);
    assert.ok(s.length < b64.length / 3, `${id}: ${b64.length} → ${s.length}`);
    n++;
  }
  assert.ok(n >= 2);
  // 1マスだけ 晴れて いる（まるで 書けない）・大きさが ちがう
  const m = MAPS.overworld;
  const bytes = new Uint8Array(Math.ceil((m.w * m.h) / 8));
  bytes[100] = 1;
  const one = btoa(String.fromCharCode(...bytes));
  assert.equal(packExplored(one, m.w, m.h, 8), null);
  assert.equal(packExplored(one, m.w + 1, m.h, 8), null);
  assert.equal(packExplored('!!', m.w, m.h, 8), null);
  assert.equal(unpackExplored('x'), null);
  // 何も 晴れて いない
  const none = btoa(String.fromCharCode(...new Uint8Array(bytes.length)));
  assert.equal(unpackExplored(packExplored(none, m.w, m.h, 8)), none);
});

test('KIZUNA-5 の 形: きりの マップ・行った 所が もとどおり（書けない マップは そのまま）', () => {
  const c = JSON.parse(JSON.stringify(typical));
  const m = MAPS.overworld;
  const bytes = new Uint8Array(Math.ceil((m.w * m.h) / 8));
  bytes[7] = 3;
  c.explored.overworld = btoa(String.fromCharCode(...bytes)); // まるで 書けない 形
  c.explored.no_such_map = 'AAAA';
  const s = JSON.parse(JSON.stringify(slimChar5(c)));
  assert.equal(s.explored.overworld, c.explored.overworld, 'そのまま');
  assert.ok(Object.values(s.explored).some((v) => typeof v?.e === 'string'), 'まるの まん中の 形');
  assert.ok(Array.isArray(s.visited));
  const back = unslimChar5(s);
  assert.deepEqual(back.explored, c.explored);
  assert.deepEqual(back.visited, c.visited);
});

// ───────────── 3. KIZUNA-5 の 書き出し・読みこみ ─────────────
for (const [name, c] of [['ふつうの セーブ', typical], ['いちばん 大きな セーブ', biggest]]) {
  test(`KIZUNA-5: ${name}が もとどおりに もどる`, { timeout: 120000 }, () => {
    const code = exportCode(c, 1794488401253);
    assert.match(code, /^KIZUNA-5-[0-9a-f]{8}-[0-9a-z]+-[A-Za-z0-9_-]+$/);
    assert.equal(exportCode(c, 1794488401253), code, '何回 やっても 同じ');
    const r = parseCode(code);
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.at, 1794488401253);
    assert.deepEqual(r.char, want(c));
  });
}

test('KIZUNA-5: アプリが 入れた 空白・改行・見えない 空白や、前の 文が あっても 読める', () => {
  const code = exportCode(typical);
  const messy = `ユイの引っこしコードです\n${code.slice(0, 100)}\n  ${code.slice(100, 3000)}​${code.slice(3000)}\n`;
  const r = parseCode(messy);
  assert.equal(r.ok, true, r.reason);
  assert.equal(r.char.name, typical.name);
  assert.equal(cleanCode(' a\nb​c '), 'abc');
});

test('KIZUNA-5: 切れた コードは「とちゅうで切れています」・1文字 ちがうと こわれている', () => {
  const code = exportCode(typical);
  for (const cut of [1, 7, 500, Math.floor(code.length / 2)]) {
    const r = parseCode(code.slice(0, -cut));
    assert.equal(r.ok, false);
    assert.match(r.reason, /とちゅうで切れています/, `うしろ ${cut}文字`);
  }
  for (const at of [12, 30, 200, code.length - 3]) {
    const ch = code[at] === 'A' ? 'B' : 'A';
    const r = parseCode(code.slice(0, at) + ch + code.slice(at + 1));
    assert.equal(r.ok, false, `${at}文字め`);
    assert.match(r.reason, /こわれて|切れて/);
  }
  assert.equal(parseCode('KIZUNA-5-zz').ok, false);
  assert.equal(parseCode('hello').reason, '引っこしコードではないみたい');
  assert.equal(parseCode('').ok, false);
  // うしろに 文が ついて いても（長さは コードの 中に ある）
  assert.equal(parseCode(`${code}\nよろしくね`).ok, true);
});

// ───────────── 4. 分けた コード ─────────────
test('分けた コード: LINE の 1通に 入る 長さ。どの じゅんでも そろえば 読める・たりない ときは「あと1つです」', { timeout: 120000 }, () => {
  const code = exportCode(biggest);
  const parts = splitCode(code);
  assert.ok(parts.length >= 2, `${code.length}文字 → ${parts.length}通`);
  for (const p of parts) assert.ok(p.length <= LINE_MAX, `${p.length}`);
  assert.deepEqual(splitCode('KIZUNA-5-short'), ['KIZUNA-5-short'], '入る ときは そのまま');
  // じゅんばんを かえて・あいだに 改行や 文が あっても
  const rev = [...parts].reverse().map((p, i) => `${i + 1}通め\n${p.slice(0, 50)}\n${p.slice(50)}\n`).join('\n');
  const r = parseCode(rev);
  assert.equal(r.ok, true, r.reason);
  assert.deepEqual(r.char, want(biggest));
  // たりない
  const half = parseCode(parts.slice(1).join('\n'));
  assert.equal(half.ok, false);
  assert.equal(half.partial, true);
  assert.deepEqual(half.have, parts.slice(1).map((_, i) => i + 2));
  assert.match(half.reason, /あと1つです/);
  const one = joinParts(cleanCode(parts[0]));
  assert.equal(one.total, parts.length);
  assert.match(one.reason, new RegExp(`あと${parts.length - 1}つです`));
  // 同じ ものを 2回 はっても よい
  assert.equal(parseCode(parts.join('') + parts[0]).ok, true);
  // とちゅうで 切れた きれはし
  const cut = parseCode([...parts.slice(0, -1), parts.at(-1).slice(0, -5)].join('\n'));
  assert.equal(cut.ok, false);
  assert.match(cut.reason, /とちゅうで切れて/);
  // ちがう コードの きれはしが まざった
  const other = splitCode(exportCode(biggest, 1));
  const mix = parseCode([parts[0], other[1]].join('\n'));
  assert.equal(mix.ok, false);
  assert.match(mix.reason, /ちがう引っこしコード/);
  assert.equal(joinParts('KIZUNA-5-abc').none, true);
});

// ───────────── 5. 前の コード ─────────────
test('前の コード（KIZUNA-1〜4）も 読める', () => {
  const c = JSON.parse(JSON.stringify(typical));
  const body = (char) => JSON.stringify({ v: SAVE_VERSION, at: 5, char });
  const j1 = body(c);
  const codes = {
    1: `KIZUNA-1-${hash(j1)}-${Buffer.from(j1, 'utf8').toString('base64')}`,
    2: `KIZUNA-2-${hash(j1)}-${pack(j1)}`,
    3: `KIZUNA-3-${hash(body(slimChar(c)))}-${pack(body(slimChar(c)))}`,
    4: `KIZUNA-4-${hash(body(slimChar4(c)))}-${pack(body(slimChar4(c)))}`,
  };
  for (const [v, code] of Object.entries(codes)) {
    const r = parseCode(`  ${code.slice(0, 30)}\n${code.slice(30)}`);
    assert.equal(r.ok, true, `KIZUNA-${v}: ${r.reason}`);
    assert.deepEqual(r.char, want(c), `KIZUNA-${v}`);
    assert.equal(parseCode(code.slice(0, -20)).ok, false, `KIZUNA-${v} 切れ`);
  }
  // 第77回までの 書き出し（exportCodeV4）も
  const old = exportCodeV4(c);
  assert.match(old, /^KIZUNA-[234]-/);
  assert.deepEqual(parseCode(old).char, want(c));
});

// ───────────── 6. 見はり ─────────────
// 魔物・技・道具・マップを 足すと、データから 作る「いちばん 大きな セーブ」も 大きく なる。上限に 近づく 前に ここで 分かる
test('見はり: ふつうの セーブは LINE の 1通に よゆうを もって 入る・いちばん 大きな セーブも 3通まで', { timeout: 120000 }, () => {
  const rows = [];
  for (const [name, c] of [['ふつう', typical], ['いちばん大きい', biggest]]) {
    const v5 = exportCode(c);
    const v4 = exportCodeV4(c);
    const json = JSON.stringify({ v: SAVE_VERSION, at: 1, char: slimChar4(c) });
    const zl = Math.ceil((zlib.deflateRawSync(json, { level: 9 }).length * 4) / 3);
    rows.push(`${name}: 前 ${v4.length} → KIZUNA-5 ${v5.length}文字（LINE の ${Math.round((v5.length / LINE_MAX) * 100)}%・${splitCode(v5).length}通。zlib -9 なら ${zl}）`);
    if (c === typical) assert.ok(v5.length <= LINE_MAX * 0.7, rows.at(-1));
    else assert.ok(splitCode(v5).length <= 3 && v5.length <= LINE_MAX * 3 * 0.9, rows.at(-1));
    assert.ok(v5.length < zl, `zlib -9 より みじかい: ${rows.at(-1)}`);
  }
  console.log(rows.join('\n'));
});

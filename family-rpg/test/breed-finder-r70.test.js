// 第70回: 作れる 魔物から 選ぶ（配合の さがし表。shared/breed-finder.js・world/breed.js の breedFinder・酒場の 画面）
//   家族の ねがい「今 いる 魔物で 作れる 魔物を 見て、その 配合が 何と 何かを 見て 選びたい」
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MONSTER_FRIENDS, BREED_MIN_LEVEL, RANKS, breedCandidates, breedOutcome, breedPlus, rankIdx } from '../public/js/shared/data/companions.js';
import { DQM_S_LV } from '../public/js/shared/data/companions-dqm.js';
import { breedForecast, breedTrend, breedTrendMemo } from '../public/js/shared/breed-calc.js';
import { breedParents, breedMatrix, kidList, kidPairs, kidSummary, kidArt, parentArt } from '../public/js/shared/breed-finder.js';
import { colorMon } from '../public/js/shared/data/variants.js';
import { breedPreview, breedFinder, PAIR_MAX } from '../public/js/shared/world/breed.js';
import { gainExp, expForLevel, newMonsterCompanion, addItem } from '../public/js/shared/stats.js';
import { addMonsterEntry, ensureStorage } from '../public/js/shared/world/party.js';
import { checkFile } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

async function solo(seed = 70) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(30) - c.exp);
  c.flags.monster_bond = true;
  return { world, bot, c };
}
const lastRes = (bot) => bot.msgs.filter((m) => m.t === 'svcRes').pop();
// 仲間の 魔物（plus・lineage も きめられる）
function mon(c, species, level, extra = {}) {
  const r = addMonsterEntry(c, species, level);
  assert.ok(r.ok, r.reason);
  Object.assign(r.char, extra);
  return r.key;
}
function stored(c, species, level, extra = {}) {
  ensureStorage(c);
  const key = `m${c.monsterSeq++}`;
  const ch = newMonsterCompanion({ id: `${c.id}:${key}`, name: MONSTERS[species].name, species, level });
  Object.assign(ch, extra);
  c.storage.push({ key, kind: 'monster', species, char: ch });
  return key;
}
const FOUR = { lineage: { p: ['pururin', 'pururin'], g: [null, null] } };

// いろいろな 魔物（ランク・レベル・＋・4体配合の 血統・素材配合・minLv）
function sampleChar(c) {
  const keys = {
    p1: mon(c, 'pururin', 12, { plus: 3, ...FOUR }),
    p2: mon(c, 'pururin', 15, { plus: 1, ...FOUR }),
    wolf: mon(c, 'wolf', 22),
    kira: mon(c, 'kirakira', 18, { plus: 6 }),
    gaz: mon(c, 'gazer_eye', 30),
    jel: mon(c, 'star_jelly', 31),
    ven: mon(c, 'venusaur', DQM_S_LV),
    tre: mon(c, 'chibi_treant', DQM_S_LV + 2),
    low: mon(c, 'skeleton', BREED_MIN_LEVEL - 1),
    sk: stored(c, 'skeleton', 25, { plus: 2 }),
    rock: stored(c, 'rockman', 14),
  };
  addItem(c, 'argos_pendant', 1);
  return keys;
}

test('第70回: さがし表は どの 組も breedCandidates と 同じ（子・しゅるい・ランク↓・品・＋・↑→↓）', async () => {
  const { c } = await solo();
  sampleChar(c);
  const ps = breedParents(c);
  const m = breedMatrix(ps, MONSTERS, c);
  assert.equal(m.pairs, ps.length * (ps.length - 1) / 2, 'すべての 組');
  let n = 0;
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const A = ps[i], B = ps[j];
      const cand = breedCandidates(A, B, MONSTERS, c);
      for (const it of cand.items) {
        n++;
        const k = m.kids.get(it.sp);
        assert.ok(k, `${it.sp} が ある`);
        assert.equal(k.rank, it.rank);
        const p = k.pairs.find((x) => x.a === A.key && x.b === B.key);
        assert.ok(p, `${A.species}×${B.species} → ${it.sp}`);
        assert.equal(p.kind, it.kind);
        assert.equal(p.low, it.rank < cand.hi);
        assert.equal(p.item, it.item || null);
        const plus = breedPlus(A, B, it.kind === 'same');
        assert.equal(p.plus, plus);
        assert.equal(p.plus, breedOutcome(A, B, MONSTERS, c, it.sp).plus, 'breedOutcome の ＋と 同じ');
        assert.equal(p.trend, breedForecast(A, B, it.sp, plus).trend, 'めやすも 同じ');
      }
    }
  }
  let total = 0;
  for (const k of m.kids.values()) total += k.pairs.length;
  assert.equal(total, n, 'よけいな 組は ない');
});

test('第70回: とくべつな 配合も 本当の レベル・血統・ふくろで（4体配合・素材配合・minLv・ランクが 上がる 子）', async () => {
  const { c } = await solo();
  const K = sampleChar(c);
  const m = breedMatrix(breedParents(c), MONSTERS, c);
  const has = (sp, a, b, kind) => (m.kids.get(sp)?.pairs || []).some((p) => [p.a, p.b].sort().join() === [a, b].sort().join() && (!kind || p.kind === kind));
  assert.ok(has('kirakira', K.p1, K.p2, 'four'), '4体配合（両親が ぷるりん どうしの ぷるりん 2ひき）');
  const mat = m.kids.get('ss_argos')?.pairs.find((p) => [p.a, p.b].sort().join() === [K.gaz, K.jel].sort().join());
  assert.equal(mat?.kind, 'material', '素材配合');
  assert.equal(mat.item, 'argos_pendant');
  assert.ok(has('yggdra_child', K.ven, K.tre, 'special'), 'minLv の 特定配合');
  // 品が ない・レベルが たりないと 出ない
  c.items = c.items.filter((e) => e.id !== 'argos_pendant');
  c.companions.find((e) => e.key === K.ven).char.level = DQM_S_LV - 1;
  const m2 = breedMatrix(breedParents(c), MONSTERS, c);
  assert.ok(!(m2.kids.get('ss_argos')?.pairs || []).some((p) => p.kind === 'material'), '品が ないと 素材配合は ない');
  assert.ok(!(m2.kids.get('yggdra_child')?.pairs || []).some((p) => p.kind === 'special'), 'レベルが たりないと 特定配合は ない');
  // ランクが 1つ上の 子は 親の レベルしだい（breedCandidates の up と 同じ）
  const A = breedParents(c).find((p) => p.key === K.wolf), B = breedParents(c).find((p) => p.key === K.kira);
  const cand = breedCandidates(A, B, MONSTERS, c);
  const ups = cand.items.filter((it) => it.rank > cand.hi).map((it) => it.sp);
  for (const sp of ups) assert.ok(has(sp, K.wolf, K.kira), `ランクが 上がる 子 ${sp}`);
});

test('第70回: 親に なれる 魔物（レベル10 いじょう・仲間と あずかり中・いる ところ）', async () => {
  const { world, bot, c } = await solo();
  const K = sampleChar(c);
  c.partyKeys = [K.wolf];
  c.wagonKeys = [K.kira];
  const ps = breedParents(c);
  const by = Object.fromEntries(ps.map((p) => [p.key, p]));
  assert.ok(!by[K.low], `レベル${BREED_MIN_LEVEL - 1}は 親に なれない`);
  assert.equal(by[K.wolf].where, 'party');
  assert.equal(by[K.kira].where, 'wagon');
  assert.equal(by[K.gaz].where, 'tavern');
  assert.equal(by[K.sk].where, 'storage');
  assert.ok(ps.every((p) => p.level >= BREED_MIN_LEVEL && MONSTERS[p.species]));
  // 人間の 仲間は 入らない
  c.companions.push({ key: 'luca_x', kind: 'npc', char: { name: 'ルカ', level: 40 } });
  assert.ok(!breedParents(c).some((p) => p.key === 'luca_x'));
  // どの 組も サーバーの 配合の みほんが できる（breedPreview と 同じ きまり）
  for (const k of breedMatrix(breedParents(c), MONSTERS, c).kids.values()) {
    for (const p of k.pairs.slice(0, 3)) assert.ok(breedPreview(c, p.a, p.b, k.sp).ok, `${p.a}×${p.b}→${k.sp}`);
  }
  // 配合して あける モード: あずかり中 どうしの 組は 入れない
  const room = breedMatrix(breedParents(c), MONSTERS, c, { room: true });
  for (const k of room.kids.values()) for (const p of k.pairs) assert.ok(!(p.a === K.sk && p.b === K.rock) && !(p.a === K.rock && p.b === K.sk));
  const all = breedMatrix(breedParents(c), MONSTERS, c);
  assert.equal(all.pairs - room.pairs, 1, 'あずかり中 2ひきの 1組だけ へる');
  void world; void bot;
});

test('第70回: 子の 一覧（ランクの 高い じゅん → 図鑑に ない 子 → 名前）・ランクが 下がる 子は かくす', async () => {
  const { c } = await solo();
  sampleChar(c);
  delete c.bestiary.kirakira;
  const m = breedMatrix(breedParents(c), MONSTERS, c);
  const list = kidList(m.kids, MONSTERS, false);
  const all = kidList(m.kids, MONSTERS, true);
  assert.ok(list.length > 0 && all.length >= list.length);
  for (let i = 1; i < list.length; i++) {
    const x = list[i - 1], y = list[i];
    assert.ok(x.ri > y.ri || (x.ri === y.ri && (x.unseen && !y.unseen || x.unseen === y.unseen)), 'ランク → 図鑑に ない 子');
  }
  assert.ok(list.every((k) => !k.lowOnly), 'ふだんは ランクが 下がる 組だけの 子は 出ない');
  const lowOnly = all.filter((k) => k.lowOnly);
  assert.ok(lowOnly.length > 0, 'このサンプルには ランクが 下がる だけの 子が いる');
  for (const k of lowOnly) assert.ok(m.kids.get(k.sp).pairs.every((p) => p.low));
  // 組の ならび: ランクが 下がらない 組が 先・同じ 中では ↑→↓・＋が 大きい じゅん
  const ORD = { up: 0, same: 1, down: 2 };
  for (const k of m.kids.values()) {
    for (let i = 1; i < k.pairs.length; i++) {
      const x = k.pairs[i - 1], y = k.pairs[i];
      assert.ok(x.low < y.low || (x.low === y.low && (ORD[x.trend] < ORD[y.trend] || (ORD[x.trend] === ORD[y.trend] && x.plus >= y.plus))), `${k.sp} の 組の ならび`);
    }
    const shown = kidPairs(k, false);
    if (k.pairs.some((p) => !p.low)) assert.ok(shown.every((p) => !p.low), 'ランクが 下がる 組は かくす');
    else assert.equal(shown.length, k.pairs.length, 'ランクが 下がる 組しか ない 子は（見る ときに）みんな');
    assert.equal(kidPairs(k, true).length, k.pairs.length);
  }
  // 図鑑に ない 子の しるし
  const kira = kidSummary(m.kids.get('kirakira'), MONSTERS, false);
  assert.equal(kira.unseen, true);
  assert.equal(kira.kind, 'four', 'いちばん めずらしい 配合の しるし');
  assert.equal(kira.rank, RANKS[rankIdx('kirakira', MONSTERS)]);
});

test('第70回: breedTrend は breedForecast と 同じ ↑→↓（memo を 使っても）', () => {
  const sps = Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTERS[sp]).slice(0, 40);
  const ps = sps.map((sp, i) => ({ ...newMonsterCompanion({ id: `t:${i}`, name: 'x', species: sp, level: 10 + (i * 7) % 40 }), species: sp, key: `k${i}`, plus: i % 5 }));
  const memo = breedTrendMemo();
  for (let i = 0; i < ps.length; i++) {
    const A = ps[i], B = ps[(i * 13 + 5) % ps.length];
    for (const child of [A.species, B.species, sps[(i * 3) % sps.length]]) {
      for (const plus of [1, 7]) assert.equal(breedTrend(A, B, child, plus, memo), breedForecast(A, B, child, plus).trend);
    }
  }
});

test('第70回: 酒場の へんじ（breedFinder）→ 組を えらぶと、手で えらんだ 配合と 同じ 子が 生まれる', { timeout: 60000 }, async () => {
  const mk = async () => {
    const w = await solo(71);
    const K = sampleChar(w.c);
    return { ...w, K };
  };
  const one = await mk();
  one.bot.send({ t: 'svc', kind: 'tavern', action: 'breedFinder' });
  const r = lastRes(one.bot);
  assert.ok(r.ok && r.finder, r.text);
  const f = r.finder;
  assert.equal(f.count, breedParents(one.c).length);
  assert.ok(f.kids.length > 0);
  assert.ok(f.hidden > 0, 'かくした 子の 数');
  assert.equal(f.parents[one.K.sk].where, 'storage');
  // 4体配合の 子を えらぶ
  one.bot.send({ t: 'svc', kind: 'tavern', action: 'breedFinder', child: 'kirakira' });
  const rk = lastRes(one.bot).finder;
  assert.equal(rk.child.sp, 'kirakira');
  assert.ok(rk.pairs.length >= 1 && rk.pairs.length <= PAIR_MAX);
  const p = rk.pairs.find((x) => x.kind === 'four');
  assert.ok(p, '4体配合の 組');
  // 生まれない 子
  one.bot.send({ t: 'svc', kind: 'tavern', action: 'breedFinder', child: 'ss_gaia' });
  assert.equal(lastRes(one.bot).ok, false);
  // さがし表は セッションに 覚えて おく（2回目は 計算しない）
  const memo = one.bot.s.breedFinderMemo;
  assert.ok(memo);
  breedFinder(one.bot.s, {});
  assert.equal(one.bot.s.breedFinderMemo, memo, '同じ 親なら そのまま');

  // さがし表の 組で 配合（画面は いつもの 配合の 流れ: breedPreview（子は きまり）→ breed）
  one.bot.send({ t: 'svc', kind: 'tavern', action: 'breedPreview', a: p.a, b: p.b, child: 'kirakira' });
  const pv = lastRes(one.bot).preview;
  assert.equal(pv.child, 'kirakira');
  assert.equal(pv.plus, p.plus, 'さがし表の ＋と 同じ');
  assert.equal(pv.trend, p.trend, 'さがし表の めやすと 同じ');
  assert.equal(pv.kind, p.kind);
  one.bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: p.a, b: p.b, child: 'kirakira', name: '' });
  const b1 = lastRes(one.bot);
  assert.ok(b1.ok, b1.text);

  // もう1つの 世界で 手で 同じ 親を えらぶ（1ぴきめ・2ひきめを 逆に しても 同じ）
  const two = await mk();
  const pv2 = breedPreview(two.c, p.b, p.a);
  assert.ok(pv2.choices.some((x) => x.sp === 'kirakira'));
  two.bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: p.b, b: p.a, child: 'kirakira', name: '' });
  const b2 = lastRes(two.bot);
  assert.ok(b2.ok, b2.text);
  const kid1 = one.c.companions.find((e) => e.key === b1.born.key).char;
  const kid2 = two.c.companions.find((e) => e.key === b2.born.key).char;
  assert.equal(kid1.species, kid2.species);
  assert.equal(kid1.plus, kid2.plus);
  assert.deepEqual(kid1.bonus, kid2.bonus);

  // 配合の あとは 親が いなく なる → さがし表を 作りなおす
  one.bot.send({ t: 'svc', kind: 'tavern', action: 'breedFinder' });
  const after = lastRes(one.bot).finder;
  assert.notEqual(one.bot.s.breedFinderMemo, memo);
  assert.ok(!after.parents[p.a] && !after.parents[p.b], '旅立った 親は いない');
  assert.equal(after.count, f.count - 2);
});

test('第70回: 酒場の へんじ: low（ランクが 下がる 子も）・room（あずかり中 どうしは のぞく）', async () => {
  const { bot, c } = await solo(72);
  sampleChar(c);
  bot.send({ t: 'svc', kind: 'tavern', action: 'breedFinder' });
  const off = lastRes(bot).finder;
  bot.send({ t: 'svc', kind: 'tavern', action: 'breedFinder', low: true });
  const on = lastRes(bot).finder;
  assert.equal(on.kids.length, off.kids.length + off.hidden);
  assert.equal(on.hidden, 0);
  const lowKid = on.kids.find((k) => k.lowOnly);
  assert.ok(lowKid);
  bot.send({ t: 'svc', kind: 'tavern', action: 'breedFinder', child: lowKid.sp, low: true });
  assert.ok(lastRes(bot).finder.pairs.every((p) => p.low));
  bot.send({ t: 'svc', kind: 'tavern', action: 'breedFinder', room: true });
  assert.equal(lastRes(bot).finder.pairCount, off.pairCount - 1);
});

test('第70回: 酒場の 画面（作れる魔物から選ぶ・ランクが下がる子も見る・組から いつもの 配合へ）', () => {
  const src = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.match(src, /★ 作れる魔物から選ぶ/);
  assert.match(src, /ランクが下がる子も見る/);
  assert.match(src, /action: 'breedFinder'/);
  assert.match(src, /breedWith\(p\.a, p\.b, finderKid\.child\.sp\)/, '組を えらぶと いつもの 配合の 流れ');
  assert.match(src, /if \(!want && pv\.choices\?\.length >= 2\)/, '子は もう きまっている（子を えらぶ まどは 出ない）');
  // もどる: 組 → 一覧（えらんでいた 子へ）→ 配合の 画面（「作れる魔物から選ぶ」へ）
  assert.match(src, /view === 'findKid'[\s\S]{0,120}setView\('find'\)[\s\S]{0,80}kid:\$\{findAt\}/);
  assert.match(src, /view === 'find'\)[\s\S]{0,120}setView\('breed'\)[\s\S]{0,80}FIND_KEY/);
  for (const f of ['public/js/client/ui/services.js', 'public/js/shared/breed-finder.js', 'public/js/shared/world/breed.js']) {
    const res = checkFile(new URL(`../${f}`, import.meta.url).pathname).filter((x) => x.kind !== 'kana');
    assert.deepEqual(res, [], `${f} の 漢字・スペース`);
  }
});

// 第71回: 作れる 魔物の 絵（家族の ねがい「名前だけじゃなく、イラストも 見せて」）
test('第71回: さがし表の 絵: 子は 絵（見た ことが ない 子は かげ）・親は 色ちがいの 色も', async () => {
  assert.deepEqual(kidArt({ sp: 'wolf', unseen: false }), { mon: 'wolf', hidden: false });
  assert.deepEqual(kidArt({ sp: 'wolf', unseen: true }), { mon: 'wolf', hidden: true }, '図鑑に ない 子は かげ（いつもの きまり）');
  assert.equal(kidArt(null), null);
  assert.equal(parentArt({ name: '？' }), null, 'しゅぞくが わからない 親は 絵なし');
  assert.equal(parentArt({ species: 'wolf' }).mon, 'wolf');
  const col = parentArt({ species: 'wolf', color: 'gold' });
  assert.equal(col.mon, colorMon('wolf', 'gold'), '色ちがいの 親は その 色で');
  assert.notEqual(col.mon, 'wolf');
  // サーバーの へんじの 親には しゅぞくと 色が ある（絵を 出せる）・子の 一覧には sp と unseen
  const { bot, c } = await solo(71);
  mon(c, 'wolf', 22); mon(c, 'kirakira', 18); mon(c, 'pururin', 14, { color: 'gold' });
  bot.send({ t: 'svc', kind: 'tavern', action: 'breedFinder' });
  await bot.settle();
  const f = lastRes(bot).finder;
  assert.ok(f.kids.length > 0);
  for (const k of f.kids) assert.ok(MONSTERS[kidArt(k).mon], `${k.sp} の 絵`);
  const ps = Object.values(f.parents);
  for (const p of ps) assert.ok(MONSTERS[parentArt(p)?.mon], `${p.name} の 絵`);
  assert.ok(ps.some((p) => p.color === 'gold' && parentArt(p).mon === colorMon('pururin', 'gold')), '色ちがいの 親');
  // 画面: 子の 行は 大きめの 絵（find-kid）・組の 行は 親の 絵（pface）・みほんは 大きく（find-pv）
  const src = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.match(src, /face: artFace\(kidArt\(k\)\), value: `kid:\$\{k\.sp\}`, cls: 'find-kid'/);
  assert.match(src, /artFace\(parentArt\(parOf\(key\)\)\)/);
  assert.match(src, /class="pface"/);
  assert.equal((src.match(/breed-pv find-pv/g) || []).length, 2);
  const css = readFileSync(new URL('../public/css/style.css', import.meta.url), 'utf8');
  assert.match(css, /\.item\.find-kid \.face \{ height: 2\.7em/);
  assert.match(css, /\.item \.pface \{/);
  for (const f2 of ['public/js/client/ui/services.js', 'public/js/shared/breed-finder.js']) {
    const res = checkFile(new URL(`../${f2}`, import.meta.url).pathname).filter((x) => x.kind !== 'kana');
    assert.deepEqual(res, [], `${f2} の 漢字・スペース`);
  }
});

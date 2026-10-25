// 第43回 B: 魔物の 技の 受けつぎ 4＋4（両方の 親から 4つずつ）と 系統の おうぎ（docs/plan-monsters.md の 2-4・6 B）
//   world/breed.js（inheritableSkills・autoInherit・pickInherit・breedPreview・breedMonsters）・data/abilities-ougi.js・stats.js の monsterAbilities
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { MONSTER_FRIENDS, BREED_INHERIT_MAX, BREED_INHERIT_TOTAL } from '../public/js/shared/data/companions.js';
import { OUGI_ABILITIES, RACE_OUGI, OUGI_LEVELS, ougiLearn } from '../public/js/shared/data/abilities-ougi.js';
import { gainExp, expForLevel, learnedAbilities, newMonsterCompanion, monsterAbilities, fullHeal } from '../public/js/shared/stats.js';
import { addMonsterCompanion } from '../public/js/shared/world/party.js';
import { inheritableSkills, autoInherit, pickInherit, breedPreview, breedMonsters } from '../public/js/shared/world/breed.js';
import { Battle } from '../public/js/shared/battle.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const RACES = ['slime', 'beast', 'plant', 'spirit', 'demon', 'undead', 'material', 'dragon'];

async function solo(seed = 43) {
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
const companion = (c, key) => c.companions.find((e) => e.key === key);

// 受けつげる 技の 候補（かくれて いない・おうぎで ない・MPが ちがう 物を MPの 大きい じゅんに）
function skillPool(exclude) {
  const seenMp = new Set();
  const out = [];
  for (const [id, a] of Object.entries(ABILITIES)) {
    if (a.hidden || a.ougi || exclude.has(id) || !(a.mp > 0) || seenMp.has(a.mp) || a.kind === 'combo') continue;
    seenMp.add(a.mp);
    out.push(id);
  }
  return out.sort((x, y) => ABILITIES[y].mp - ABILITIES[x].mp);
}

// 親を 2ひき（Lv12）。それぞれ たくさんの 技を 受けついでいる ことに する
async function parents({ shared = true } = {}) {
  const env = await solo();
  const { world, bot, c } = env;
  const A = addMonsterCompanion(world, bot.s, 'pururin', 12);
  const B = addMonsterCompanion(world, bot.s, 'koumorin', 12);
  const pv0 = breedPreview(c, A.key, B.key);
  assert.ok(pv0.ok, pv0.reason);
  const child = pv0.child;
  const own = new Set([...(MONSTER_FRIENDS[child]?.learn || []).map(([, id]) => id), ...learnedAbilities(companion(c, A.key).char), ...learnedAbilities(companion(c, B.key).char)]);
  const pool = skillPool(own);
  assert.ok(pool.length >= 14, '候補の 技が たりる');
  // A: 6つ・B: 6つ（shared の ときは 1つ 同じ 技）
  const ia = pool.filter((_, i) => i % 2 === 0).slice(0, 6);
  const ib = pool.filter((_, i) => i % 2 === 1).slice(0, 6);
  if (shared) ib[0] = ia[0];
  companion(c, A.key).char.inherit = ia;
  companion(c, B.key).char.inherit = ib;
  return { ...env, A: companion(c, A.key), B: companion(c, B.key), child, ia, ib };
}

test('きまり: 親1ぴきあたり 4つ・あわせて 8つ', () => {
  assert.equal(BREED_INHERIT_MAX, 4);
  assert.equal(BREED_INHERIT_TOTAL, 8);
});

test('受けつげる 技: 親ごとの 2つの 列。両方の 親が 知っている 技は A の 列に 1つだけ・子が 自分で 覚える 技・おうぎは 出さない', { timeout: 60000 }, async () => {
  const { A, B, child, ia, ib } = await parents();
  const sk = inheritableSkills(A, B, child);
  assert.ok(Array.isArray(sk.a) && Array.isArray(sk.b));
  for (const id of ia) assert.ok(sk.a.includes(id), `${id} は A の 列`);
  assert.ok(!sk.b.includes(ib[0]), '同じ 技は B の 列に 出さない（1つと 数える）');
  for (const id of ib.slice(1)) assert.ok(sk.b.includes(id), `${id} は B の 列`);
  assert.equal(sk.a.filter((id) => sk.b.includes(id)).length, 0, '2つの 列に 同じ 技は ない');
  // 子が 自分で 覚える 技は 出さない（前は 出ていた）
  const own = (MONSTER_FRIENDS[child]?.learn || []).map(([, id]) => id);
  for (const id of own) assert.ok(!sk.a.includes(id) && !sk.b.includes(id), `${id} は 子が 自分で 覚える`);
  // child を わたさなければ、親の 技 ぜんぶ（かくれた 技は のぞく）
  const all = inheritableSkills(A, B);
  for (const id of learnedAbilities(A.char)) if (!ABILITIES[id].hidden) assert.ok(all.a.includes(id), id);
  // おうぎは 受けつがない（親が Lv60 でも）
  A.char.level = 60;
  const sk60 = inheritableSkills(A, B, child);
  assert.ok(learnedAbilities(A.char).some((id) => ABILITIES[id].ougi), 'A は おうぎを 覚えている');
  assert.ok(![...sk60.a, ...sk60.b].some((id) => ABILITIES[id].ougi), 'おうぎは 列に 出ない');
});

test('おまかせ: 親ごとに MPの 大きい 技から 4つずつ', { timeout: 60000 }, async () => {
  const { A, B, child } = await parents();
  const sk = inheritableSkills(A, B, child);
  const auto = autoInherit(A, B, child);
  const top = (l) => [...l].sort((x, y) => ABILITIES[y].mp - ABILITIES[x].mp).slice(0, 4);
  assert.deepEqual(auto.a, top(sk.a));
  assert.deepEqual(auto.b, top(sk.b));
  assert.equal(auto.a.length, 4);
  assert.equal(auto.b.length, 4, '同じ 技が あっても B から 4つ えらべる');
});

test('配合の まえの じょうほう: 2つの 列・おまかせ・親の 名前・4と 8', { timeout: 60000 }, async () => {
  const { c, A, B } = await parents();
  const pv = breedPreview(c, A.key, B.key);
  assert.ok(pv.ok);
  assert.equal(pv.max, 4);
  assert.equal(pv.total, 8);
  assert.deepEqual(pv.names, { a: A.char.name, b: B.char.name });
  assert.ok(pv.skills.a.length >= 6 && pv.skills.b.length >= 5);
  assert.equal(pv.auto.a.length, 4);
  assert.equal(pv.auto.b.length, 4);
});

test('配合: { a, b } で 4＋4（8つ）受けつぐ。多すぎる ぶんは 親ごとに 4つまで。受けついだ 技は 子の 技（次の 配合でも 受けつげる）', { timeout: 60000 }, async () => {
  const { world, bot, c, A, B } = await parents();
  const pv = breedPreview(c, A.key, B.key);
  const want = { a: pv.skills.a.slice(0, 6), b: pv.skills.b.slice(0, 6) };
  const r = breedMonsters(world, bot.s, { a: A.key, b: B.key, inherit: want, name: 'ハチ' });
  assert.ok(r.ok, r.reason);
  assert.deepEqual(r.inherit, [...want.a.slice(0, 4), ...want.b.slice(0, 4)]);
  const kid = companion(c, r.key);
  assert.equal(kid.char.inherit.length, 8);
  assert.ok(Array.isArray(kid.char.inherit), 'セーブの 形は 前と 同じ 平らな ならび');
  for (const id of kid.char.inherit) assert.ok(learnedAbilities(kid.char).includes(id), `${id} を 覚えた`);
  // 受けついだ 技は 次の 配合で また 受けつげる
  gainExp(kid.char, expForLevel(12) - kid.char.exp);
  const other = addMonsterCompanion(world, bot.s, 'koumorin', 12);
  const sk = inheritableSkills(kid, companion(c, other.key));
  for (const id of kid.char.inherit) assert.ok(sk.a.includes(id), `${id} を また 受けつげる`);
});

test('配合: 前の 平らな ならびも 受ける（どちらの 親の 技かで わけて、親ごとに 4つまで）', { timeout: 60000 }, async () => {
  const { world, bot, c, A, B } = await parents();
  const pv = breedPreview(c, A.key, B.key);
  const flat = [...pv.skills.b.slice(0, 5), ...pv.skills.a.slice(0, 5), 'no_such_skill', pv.skills.a[0]];
  assert.deepEqual(pickInherit(pv.skills, flat, pv.auto), { a: pv.skills.a.slice(0, 4), b: pv.skills.b.slice(0, 4) });
  const r = breedMonsters(world, bot.s, { a: A.key, b: B.key, inherit: flat });
  assert.ok(r.ok, r.reason);
  assert.equal(r.inherit.length, 8);
  assert.ok(!r.inherit.includes('no_such_skill'));
  // なにも えらばない（空）なら 受けつがない・null なら おまかせ
  assert.deepEqual(pickInherit(pv.skills, [], pv.auto), { a: [], b: [] });
  assert.deepEqual(pickInherit(pv.skills, { a: [], b: [] }, pv.auto), { a: [], b: [] });
  assert.deepEqual(pickInherit(pv.skills, null, pv.auto), pv.auto);
  // 子が 自分で 覚える 技は えらんでも 入らない
  const own = (MONSTER_FRIENDS[pv.child]?.learn || []).map(([, id]) => id);
  assert.deepEqual(pickInherit(pv.skills, { a: own, b: own }, pv.auto), { a: [], b: [] });
});

test('配合: inherit を わたさない ときは おまかせ（4＋4）', { timeout: 60000 }, async () => {
  const { world, bot, c, A, B } = await parents();
  const pv = breedPreview(c, A.key, B.key);
  const r = breedMonsters(world, bot.s, { a: A.key, b: B.key });
  assert.ok(r.ok, r.reason);
  assert.deepEqual(r.inherit, [...pv.auto.a, ...pv.auto.b]);
  assert.ok(r.inherit.length <= BREED_INHERIT_TOTAL);
});

test('酒場の 通信: breed に { a, b } を おくれる', { timeout: 60000 }, async () => {
  const { bot, c, A, B } = await parents();
  bot.send({ t: 'svc', kind: 'tavern', action: 'breedPreview', a: A.key, b: B.key });
  const pr = lastRes(bot);
  assert.ok(pr.ok && pr.preview.skills.a.length && pr.preview.auto.b.length === 4);
  const inherit = { a: pr.preview.skills.a.slice(0, 2), b: pr.preview.skills.b.slice(0, 3) };
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: A.key, b: B.key, inherit, name: 'ニコ' });
  const r = lastRes(bot);
  assert.ok(r.ok, r.text);
  const kid = c.companions.find((e) => e.char.name === 'ニコ');
  assert.deepEqual(kid.char.inherit, [...inherit.a, ...inherit.b]);
});

test('おうぎ: 8つの 系統に 3つずつ（Lv30・45・60）。abilities.js に まざる・名前は ほかと かさならない', () => {
  assert.deepEqual(OUGI_LEVELS, [30, 45, 60]);
  assert.deepEqual(Object.keys(RACE_OUGI).sort(), [...RACES].sort());
  assert.equal(Object.keys(OUGI_ABILITIES).length, 24);
  const others = new Set(Object.entries(ABILITIES).filter(([id]) => !OUGI_ABILITIES[id]).map(([, a]) => a.name));
  const anims = new Set(Object.entries(ABILITIES).filter(([id]) => !OUGI_ABILITIES[id]).map(([, a]) => a.anim));
  for (const race of RACES) {
    const list = ougiLearn(race);
    assert.deepEqual(list.map(([l]) => l), [30, 45, 60], race);
    for (const [, id] of list) {
      const a = ABILITIES[id];
      assert.equal(a, OUGI_ABILITIES[id], `${id}: abilities.js に まざる`);
      assert.equal(a.ougi, race);
      assert.ok(a.name && a.kana && a.desc && a.cast && a.effect?.type && a.target && a.mp > 0, id);
      assert.ok(!others.has(a.name), `${id}: ${a.name} は ほかの 技と 名前が ちがう`);
      assert.ok(anims.has(a.anim), `${id}: えんしゅつ ${a.anim} は 今 ある もの`);
    }
    // MPは Lv60 の 技が いちばん 大きい
    const mps = list.map(([, id]) => ABILITIES[id].mp);
    assert.ok(mps[2] >= Math.max(mps[0], mps[1]), `${race}: Lv60 の MP`);
  }
  // 1つの 系統の 3つは ちがう はたらき（同じ 効果の 形ばかりに しない）
  for (const race of RACES) {
    const kinds = new Set(ougiLearn(race).map(([, id]) => `${ABILITIES[id].target}:${ABILITIES[id].effect.type}`));
    assert.ok(kinds.size >= 2, `${race}: いろいろな 技`);
  }
  assert.deepEqual(ougiLearn('human'), []);
  assert.deepEqual(ougiLearn(undefined), []);
});

test('おうぎの 強さ: 超級職の 強い 技くらい（伝説の 職業の 看板の 技より 上に しない）', () => {
  for (const [id, a] of Object.entries(OUGI_ABILITIES)) {
    const parts = a.effect.type === 'multi' ? a.effect.parts : [a.effect];
    for (const p of parts) {
      const t = p.target || a.target;
      if (p.type === 'phys') {
        const total = (p.mult ?? 1) * (p.hits || 1);
        if (p.random) assert.ok(total <= 4.5, `${id}: ランダム ${total}`);
        else if (t === 'enemy') assert.ok(total <= 3.2, `${id}: 1体 ${total}`);
        else assert.ok(total <= 1.8, `${id}: 全体 ${total}（伝説の 看板 2.7 より 下）`);
      }
      if (p.type === 'drainHp') assert.ok(p.mult <= 2.5, id);
      if (p.type === 'magic') {
        if (t === 'enemy') assert.ok(p.base[1] <= 230, `${id}: 1体の 魔法`);
        else assert.ok(p.base[1] <= 200, `${id}: 全体の 魔法（伝説の 看板 265 より 下）`);
      }
      if (p.type === 'buff') assert.ok(p.mult <= (t === 'self' ? 1.5 : 1.35), `${id}: 補助 ${p.mult}`);
      if (p.type === 'revive') assert.ok(p.hpRatio <= 0.5, id);
    }
  }
});

test('おうぎを 覚える: しゅぞくの 系統で Lv30・45・60（monsterAbilities）', () => {
  for (const race of RACES) {
    const sp = Object.keys(MONSTER_FRIENDS).find((x) => MONSTERS[x]?.race === race);
    assert.ok(sp, race);
    const [o30, o45, o60] = ougiLearn(race).map(([, id]) => id);
    const at = (L) => monsterAbilities(newMonsterCompanion({ id: 'x', species: sp, level: L }));
    assert.ok(!at(29).includes(o30), `${sp} Lv29`);
    assert.ok(at(30).includes(o30) && !at(30).includes(o45), `${sp} Lv30`);
    assert.ok(at(45).includes(o45) && !at(45).includes(o60), `${sp} Lv45`);
    assert.ok(at(60).includes(o60), `${sp} Lv60`);
    // ほかの 系統の おうぎは 覚えない
    assert.ok(!at(60).some((id) => ABILITIES[id].ougi && ABILITIES[id].ougi !== race), `${sp}`);
  }
  // レベルアップで「覚えた」に 出る（gainExp の learned）
  const m = newMonsterCompanion({ id: 'y', species: 'pururin', level: 29 });
  const ups = gainExp(m, expForLevel(30) - m.exp);
  assert.ok(ups.some((u) => (u.learned || []).includes('og_slime_dive')));
});

test('おうぎを 戦いで 使える（24の 技 ぜんぶ。エラーが 出ない・MPを 使う）', () => {
  for (const race of RACES) {
    const sp = Object.keys(MONSTER_FRIENDS).find((x) => MONSTERS[x]?.race === race);
    for (const [, id] of ougiLearn(race)) {
      const ch = newMonsterCompanion({ id: 'm1', species: sp, level: 60 });
      fullHeal(ch);
      const rng = makeRng(7);
      const b = new Battle({ rng, allies: [{ char: ch, controller: 's0' }], enemies: ['rockman', 'rockman'], canFlee: true });
      for (const e of b.enemies) {
        e.actions = [{ w: 1, id: 'm_nothing' }];
        e.hp = e.maxHp = 99999;
      }
      const u = b.allies[0];
      u.mp = u.maxMp = 999;
      b.queue = [];
      b.enqueue(u, { type: 'ability', id, target: b.enemies[0].id });
      b.executeNext();
      b.lock = 0;
      const ev = b.flush().filter((e) => e.t === 'act').pop();
      assert.ok(ev && ev.lines.length, `${id}: 行動した`);
      // MPを 回復する 技（魔力のいずみ）は 自分にも かかる
      if (!JSON.stringify(ABILITIES[id].effect).includes('mpHeal')) assert.equal(u.mp, 999 - ABILITIES[id].mp, `${id}: MP`);
      const eff = ABILITIES[id].effect;
      const dmg = (eff.type === 'multi' ? eff.parts : [eff]).some((p) => ['phys', 'magic', 'drainHp'].includes(p.type));
      if (dmg) assert.ok(b.enemies.some((e) => e.hp < 99999) || ev.lines.some((l) => /効かなかった|かわした/.test(l)), `${id}: ダメージ`);
    }
  }
});

test('漢字の きまり: おうぎの ファイルは 漢字・スペース・かなの チェックに 入っていて 0件', () => {
  const f = 'public/js/shared/data/abilities-ougi.js';
  assert.ok(gameFiles().some((x) => x.endsWith(f)), 'gameFiles に ある');
  const res = checkFile(gameFiles().find((x) => x.endsWith(f)));
  assert.deepEqual(res.filter((r) => r.kind === 'kanji' || r.kind === 'space'), []);
});

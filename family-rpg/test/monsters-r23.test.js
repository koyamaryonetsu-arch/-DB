// あたらしい 仲間モンスター（shared/data/monsters-r23.js・client/render/r23-art.js）と、
// ドラゴンクエストモンスターズ ふうの 配合（companions.js の breedOutcome: 特殊配合・系統配合・図鑑に ない 魔物が 生まれやすい）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import {
  MONSTER_FRIENDS, RACE_GEAR, BREED_RECIPES, BREED_MIN_LEVEL, joinTier, recipeHint, breedOutcome, breedResult, breedCandidates,
  bestiaryKnow, breedRumors, bestiaryOrder, familyPool, breedRankCap,
} from '../public/js/shared/data/companions.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, SLOTS } from '../public/js/shared/data/items.js';
import { ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { NIGHT_ZONES } from '../public/js/shared/data/night.js';
import { monsterDrops, MAT_DROPS } from '../public/js/shared/data/loot.js';
import { MONSTERS_R23, FRIENDS_R23, R23_ABILITIES, RECIPES_R23 } from '../public/js/shared/data/monsters-r23.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { addR23Art } from '../public/js/client/render/r23-art.js';
import { computeStats, newMonsterCompanion, gainExp, expForLevel, learnedAbilities, monsterSlots } from '../public/js/shared/stats.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { exportCode, parseCode } from '../public/js/shared/world/transfer.js';
import { addMonsterCompanion, tavernInfo } from '../public/js/shared/world/party.js';
import { breedPreview } from '../public/js/shared/world/breed.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const NEW = Object.keys(MONSTERS_R23);
const WILD = NEW.filter((sp) => !MONSTERS_R23[sp].breedOnly);
const BREED_ONLY = NEW.filter((sp) => MONSTERS_R23[sp].breedOnly);
const OLD_FRIENDS = Object.keys(MONSTER_FRIENDS).filter((sp) => !NEW.includes(sp));

test('あたらしい 仲間モンスター: 27しゅ（やせい 11・配合だけ 16）。図鑑の 魔物は 109 → 136', () => {
  assert.equal(NEW.length, 27);
  assert.equal(WILD.length, 11);
  assert.equal(BREED_ONLY.length, 16);
  assert.equal(Object.keys(MONSTERS).length, 136);
  for (const sp of NEW) {
    assert.equal(MONSTERS[sp], MONSTERS_R23[sp], `${sp}: monsters.js に まざる`);
    assert.equal(MONSTER_FRIENDS[sp], FRIENDS_R23[sp], `${sp}: companions.js に まざる`);
  }
  // ほかの 魔物と ID が ぶつからない（上書き して いない）
  for (const sp of NEW) assert.ok(!OLD_FRIENDS.includes(sp), sp);
  // 系統は ゲームの 8つの どれか。どの 系統にも 1しゅ いじょう
  const races = new Set(NEW.map((sp) => MONSTERS[sp].race));
  assert.deepEqual([...races].sort(), Object.keys(RACE_GEAR).sort());
  // はじめから おわりまで（ランクが ちらばる）
  const lvs = NEW.map((sp) => MONSTERS[sp].lv);
  assert.ok(Math.min(...lvs) <= 3 && Math.max(...lvs) >= 36);
});

test('あたらしい 仲間モンスター: データ（強さ・技・属性・説明・仲間の 育ちかた・装備）', () => {
  const ELEM = ['fire', 'ice', 'wind', 'blast', 'bolt', 'light', 'dark', 'void', 'sleep', 'poison', 'confuse', 'blind', 'silence', 'paralyze', 'debuff'];
  for (const sp of NEW) {
    const m = MONSTERS[sp];
    assert.ok(m.name && m.desc && m.race && m.size && m.lv > 0 && m.hp > 0, sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const k of Object.keys(m.resist || {})) assert.ok(ELEM.includes(k), `${sp}: ${k}`);
    const f = MONSTER_FRIENDS[sp];
    assert.ok(f.names.length >= 4 && f.note && f.growth && f.learn.length >= 5, sp);
    assert.equal(new Set(f.names).size, f.names.length, `${sp}: 名前が かぶらない`);
    assert.ok(f.names.every((n) => n.length <= 8), `${sp}: 名前は 8文字まで`);
    for (const [lv, id] of f.learn) assert.ok(ABILITIES[id] && lv >= 1 && lv <= 40, `${sp}: ${id}`);
    for (let i = 1; i < f.learn.length; i++) assert.ok(f.learn[i][0] >= f.learn[i - 1][0], `${sp}: 覚える じゅん`);
    // 装備できる 部位が アクセサリー いがいにも ある
    assert.ok(monsterSlots(sp).some((s) => s !== 'acc'), `${sp}: 装備`);
    // 育ちかたの 合計は いままでの はば（5.6〜8.5）
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 5.6 && sum <= 8.5, `${sp}: growth ${sum}`);
  }
  for (const sp of WILD) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.ok(m.exp > 0 && m.gold > 0 && !m.breedOnly && !f.breedOnly, sp);
    assert.ok(f.rate > 0 && f.rate <= 1 / 10 && joinTier(sp), `${sp}: 仲間に なる`);
  }
  for (const sp of BREED_ONLY) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.ok(m.breedOnly && f.breedOnly && f.rate === 0 && !m.exp && !m.gold && !m.drops, `${sp}: 配合だけ`);
    assert.equal(joinTier(sp), null);
  }
});

test('あたらしい 仲間モンスター: 仲間の 強さは いままでの はんい（強すぎない）。配合だけの 上の 魔物は ふつうより 強い', () => {
  for (const lv of [20, 40]) {
    const st = (sp) => computeStats(newMonsterCompanion({ id: 'x', species: sp, level: lv }));
    const others = OLD_FRIENDS.map(st);
    const maxOf = (k) => Math.max(...others.map((s) => s[k]));
    const score = (s) => s.maxHp / 3 + Math.max(s.atk, s.mag) + s.dfn + s.agi;
    const median = others.map(score).sort((x, y) => x - y)[Math.floor(others.length / 2)];
    for (const sp of NEW) {
      const s = st(sp);
      for (const k of ['maxHp', 'maxMp', 'atk', 'dfn', 'agi', 'mag', 'heal']) assert.ok(s[k] <= maxOf(k) * 1.06, `Lv${lv} ${sp}: ${k} ${s[k]}（いままでの いちばん ${maxOf(k)}）`);
    }
    // きまった 組み合わせだけの 魔物（いちばん 上の ランク）は ふつうより 強い
    for (const sp of BREED_ONLY.filter((x) => MONSTER_FRIENDS[x].recipeOnly)) assert.ok(score(st(sp)) > median, `Lv${lv} ${sp}`);
  }
});

test('あたらしい 仲間モンスター: 技（monsters-r23.js）', () => {
  const anims = new Set(Object.entries(ABILITIES).filter(([id]) => !R23_ABILITIES[id]).map(([, a]) => a.anim));
  const used = new Set(NEW.flatMap((sp) => [...MONSTERS[sp].actions.map((a) => a.id), ...MONSTER_FRIENDS[sp].learn.map(([, id]) => id)]));
  for (const [id, a] of Object.entries(R23_ABILITIES)) {
    assert.equal(ABILITIES[id], a, `${id}: abilities.js に まざる`);
    assert.ok(a.kind === 'monster' && a.name && a.kana && a.desc && a.cast && a.effect?.type && a.target, id);
    assert.ok(anims.has(a.anim), `${id}: えんしゅつ ${a.anim} は ほかの 技と おなじ もの`);
    assert.ok(used.has(id), `${id}: だれかが 使う`);
    assert.ok(a.mp >= 1 && a.mp <= 16, id);
  }
});

test('あたらしい 仲間モンスター: 落とす物（loot.js の きまり）。配合だけの 魔物は 落とさない', () => {
  for (const sp of WILD) {
    const list = monsterDrops(sp);
    const common = list.find((d) => d.kind === 'common'), rare = list.find((d) => d.kind === 'rare'), mat = list.find((d) => d.kind === 'mat');
    assert.ok(common && rare && mat, `${sp}: よく・レア・素材`);
    assert.ok(rare.n >= 32 && rare.n <= 128 && common.n <= 32, sp);
    const r = ITEMS[rare.item];
    assert.ok(r.type === 'acc' || SLOTS.includes(r.type) || r.effect?.type === 'seed', `${sp}: レアは 装備か 種`);
    assert.ok(ITEMS[mat.item].type === 'mat' && MAT_DROPS[sp], `${sp}: 素材`);
  }
  for (const sp of BREED_ONLY) assert.deepEqual(monsterDrops(sp), [], sp);
});

test('あたらしい 仲間モンスター: やせいの 魔物は 第1章〜第4章の 出現表に すこしだけ 出る（先頭なので フィールドで その すがた）', () => {
  const where = (sp) => Object.entries(ENCOUNTER_TABLES).filter(([, list]) => list.some((e) => e.group.some(([x]) => x === sp)));
  for (const sp of WILD) {
    const zones = where(sp);
    assert.ok(zones.length >= 1, `${sp} の 出る 場所`);
    assert.ok(zones.some(([, list]) => list.some((e) => e.group[0][0] === sp)), `${sp}: どこかで 先頭`);
    for (const [z, list] of zones) {
      const mine = list.filter((e) => e.group.some(([x]) => x === sp));
      assert.ok(mine.length === 1 && mine[0].w <= 2, `${z}: ${sp} は めずらしめ`);
      const total = list.reduce((s, e) => s + e.w, 0);
      assert.ok(mine[0].w / total <= 0.17, `${z}: 出る わりあい ${mine[0].w}/${total}`);
      assert.ok(Math.abs(MONSTERS[sp].lv - Math.max(...list.flatMap((e) => e.group.map(([x]) => MONSTERS[x].lv)))) <= 8, `${z}: ${sp} の 強さが その 場所に あう`);
    }
  }
  // 配合だけの 魔物は どこにも 出ない
  for (const sp of BREED_ONLY) assert.equal(where(sp).length, 0, sp);
  // 出る 場所（第1章: 町の まわり・平原・森・洞窟、第2章: 海・海の洞窟、第3章: 雪の森・鉱山への道・炎の山、第4章: オアシス）
  const zoneOf = Object.fromEntries(WILD.map((sp) => [sp, where(sp).map(([z]) => z)]));
  assert.deepEqual(zoneOf, {
    donguri: ['outskirts'], hana_pururin: ['plains'], karamizuta: ['forest'], koakuma: ['cave1', 'cave2'], buriki: ['cave2'],
    tobiuo: ['sea'], uzumaki_gai: ['seacave'], tsurara_sou: ['n_forest'], hoseki_game: ['n_mine'], hinezumi: ['n_volcano'], toge_saboten: ['s_oasis'],
  });
  // 夜の 出現表は かわらない（昼の 表にだけ まぜた）
  for (const night of Object.values(NIGHT_ZONES)) for (const e of ENCOUNTER_TABLES[night] || []) for (const [x] of e.group) assert.ok(!NEW.includes(x), `${night}: ${x}`);
});

test('あたらしい 仲間モンスター: 画面の 文字（漢字の きまり・スペース）。kanji-check の 対象に 入っている', () => {
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['public/js/shared/data/monsters-r23.js', 'public/js/client/render/r23-art.js']) {
    assert.ok(files.some((x) => x.endsWith(f)), `${f} は gameFiles に ある`);
    const res = checkFile(files.find((x) => x.endsWith(f)));
    assert.deepEqual(res, [], f);
  }
});

// ───── え ─────
// monsters.js の かく ための どうぐ の かわり: つかった いろ と はみだしを しらべる（test/ch4-monsters-art.test.js と おなじ）
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
function outside(pts, w, h, extra = 0.6) {
  const mx = (1 + extra) / w, my = (1 + extra) / h;
  return pts.filter(([x, y]) => x < -mx || x > 1 + mx || y < -my || y > 1 + my);
}
const lower = (a) => new Set(a.map((c) => c.toLowerCase()));

test('あたらしい 仲間モンスターの え: 27しゅ ぜんぶ ある（addR23Art だけでも そろう）。大きさ・パレット', () => {
  const art = {};
  addR23Art(art);
  assert.deepEqual(Object.keys(art).sort(), [...NEW].sort());
  for (const sp of NEW) {
    const d = MONSTER_ART[sp];
    assert.ok(d && d.draw === art[sp].draw, `${sp} の え`);
    assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= 72), `${sp}: size ${d.size}`);
    assert.ok(Array.isArray(d.pal) && d.pal.length >= 6 && d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)), `${sp}: pal`);
    assert.equal(new Set(d.pal.map((c) => c.toLowerCase())).size, d.pal.length, `${sp}: pal に おなじ いろが ない`);
    if (d.field !== undefined) assert.ok(d.field >= 20 && d.field <= 28, `${sp}: field`);
    assert.equal(d.npc, undefined);
  }
  // ちいさい（s）魔物は 大きい（l）魔物より 小さい
  const area = (sp) => MONSTER_ART[sp].size[0] * MONSTER_ART[sp].size[1];
  const S = NEW.filter((sp) => MONSTERS[sp].size === 's'), L = NEW.filter((sp) => MONSTERS[sp].size === 'l');
  for (const s of S) for (const l of L) assert.ok(area(s) < area(l), `${s} < ${l}`);
});

test('あたらしい 仲間モンスターの え: 2コマ とも、たたかい・フィールド・ついてくる 仲間の 大きさで かける（いろは パレットの なか・はみださない・コマで うごく）', () => {
  for (const sp of NEW) {
    const d = MONSTER_ART[sp];
    const pal = lower(d.pal);
    const [W, H] = d.size;
    const k = Math.min(1, (d.field || 20) / Math.max(W, H));
    const k24 = Math.min(1, Math.min(d.field || 20, 24) / Math.max(W, H));
    const sizes = [[W, H], [Math.max(10, Math.round(W * k)), Math.max(10, Math.round(H * k))], [Math.max(10, Math.round(W * k24)), Math.max(10, Math.round(H * k24))]];
    for (const [w, h] of sizes) {
      for (const f of [0, 1]) {
        const s = stubG(w, h);
        d.draw(s.g, f);
        assert.ok(s.pts.length > 40, `${sp}: なにか かいた`);
        const bad = [...s.colors].filter((c) => !pal.has(String(c).toLowerCase()));
        assert.deepEqual(bad, [], `${sp} f${f} ${w}×${h}: パレットに ない いろ`);
        const out = outside(s.pts, w, h);
        assert.equal(out.length, 0, `${sp} f${f} ${w}×${h}: はみだし ${JSON.stringify(out.slice(0, 3))}`);
      }
    }
    const a = stubG(W, H), b = stubG(W, H);
    d.draw(a.g, 0);
    d.draw(b.g, 1);
    assert.notDeepEqual(a.pts, b.pts, `${sp}: コマで うごく`);
    const used = lower([...a.colors, ...b.colors]);
    assert.deepEqual(d.pal.filter((c) => !used.has(c.toLowerCase())), [], `${sp}: つかわない いろ`);
  }
});

// ───── 配合 ─────
const lv = (species, level = 20, plus = 0) => ({ species, level, plus });

test('配合: いままでの 組み合わせは かわらない（図鑑を わたさない ときは みんな 見たことがない）', () => {
  assert.equal(breedResult('pururin', 'skeleton', MONSTERS), 'pururin_knight');
  assert.equal(breedResult('rockman', 'armor_crab', MONSTERS), 'golem');
  assert.equal(breedResult('pururin', 'ice_pururin', MONSTERS), 'king_pururin');
  assert.equal(breedResult('skeleton', 'goblin', MONSTERS), 'demon_knight');
  assert.equal(breedResult('pururin', 'koumorin', MONSTERS), 'fuwari');
  assert.equal(breedResult('koumorin', 'pururin', MONSTERS), 'fuwari');
  assert.equal(breedResult('wolf', 'kirakira', MONSTERS), 'star_panther');
  assert.equal(breedResult('chibi_dragon', 'sea_serpent', MONSTERS), 'great_dragon');
});

test('配合: 特殊配合（きまった 組み合わせ）は どちらが 1ぴきめでも、図鑑に かかわらず かならず その 子', () => {
  const all = (sp) => 2;
  for (const r of RECIPES_R23) {
    const pick = (spec) => (typeof spec === 'string' ? spec : Object.keys(MONSTER_FRIENDS).find((sp) => MONSTERS[sp].race === spec.race && !MONSTER_FRIENDS[sp].breedOnly && sp !== r.a));
    const a = pick(r.a), b = pick(r.b);
    for (const [x, y] of [[a, b], [b, a]]) {
      for (const know of [null, all]) {
        const o = breedOutcome(lv(x), lv(y), MONSTERS, know);
        assert.equal(o.child, r.child, `${x} ＋ ${y}`);
        assert.equal(o.kind, 'special');
      }
    }
  }
  // 親に なる 魔物は どれも 手に入る（仲間に なる 魔物）
  for (const r of BREED_RECIPES) for (const s of [r.a, r.b]) if (typeof s === 'string') assert.ok(MONSTER_FRIENDS[s], s);
});

test('配合: 配合でしか 生まれない 魔物は ぜんぶ 生まれる（特殊配合か、系統配合の 候補に 入る）。ヒントも 出る', () => {
  const parents = Object.keys(MONSTER_FRIENDS);
  for (const target of BREED_ONLY) {
    assert.ok(recipeHint(target, MONSTERS), `${target}: ヒント`);
    // 見たことがない のは target だけ → target が 生まれる 親が いる
    const know = (sp) => (sp === target ? 0 : 2);
    let found = null;
    for (const a of parents) {
      for (const b of parents) {
        if (breedOutcome(lv(a, 40, 10), lv(b, 40, 10), MONSTERS, know).child === target) { found = [a, b]; break; }
      }
      if (found) break;
    }
    assert.ok(found, `${target} が 生まれる 組み合わせ`);
    // 親は 手に入る（やせいで 仲間に なるか、配合で 生まれる）
    for (const p of found) assert.ok(MONSTER_FRIENDS[p], p);
  }
  // きまった 組み合わせだけの 魔物は 系統配合では 生まれない
  for (const sp of BREED_ONLY.filter((x) => MONSTER_FRIENDS[x].recipeOnly)) {
    assert.ok(BREED_RECIPES.some((r) => r.child === sp), sp);
    assert.ok(!familyPool(MONSTERS[sp].race, MONSTERS).includes(sp), sp);
  }
  // メタル（きらきらぷるりん）も 系統配合では 生まれない
  assert.ok(!familyPool('slime', MONSTERS).includes('kirakira'));
});

test('配合: 系統配合は 1ぴきめの 系統。親を 育てるほど 強い 魔物が 候補に 入る（ランクの 上限）', () => {
  const low = breedCandidates(lv('wolf', 10), lv('frog', 10), MONSTERS);
  const high = breedCandidates(lv('wolf', 40), lv('frog', 40), MONSTERS);
  assert.equal(low.kind, 'family');
  for (const sp of [...low.list, ...high.list]) assert.equal(MONSTERS[sp].race, 'beast', sp);
  assert.ok(high.list.length > low.list.length, '強い 親ほど 候補が ふえる');
  assert.ok(Math.max(...high.list.map((sp) => MONSTERS[sp].lv)) > Math.max(...low.list.map((sp) => MONSTERS[sp].lv)));
  assert.equal(breedRankCap(lv('wolf', 10), lv('frog', 10), MONSTERS), MONSTERS.wolf.lv + 5);
  assert.equal(breedRankCap(lv('wolf', 10, 5), lv('frog', 10, 5), MONSTERS), MONSTERS.wolf.lv + 5 + 2, '「＋」も 少し');
  // 候補は 強い じゅん。さいごは 1ぴきめと おなじ しゅぞく
  const lvs = high.list.slice(0, -1).map((sp) => MONSTERS[sp].lv);
  assert.deepEqual(lvs, [...lvs].sort((x, y) => y - x));
  assert.equal(high.list[high.list.length - 1] === 'wolf' || high.list.includes('wolf'), true);
  // 弱いほうの 親より 弱い 魔物は 生まれない
  for (const sp of high.list) assert.ok(MONSTERS[sp].lv >= Math.min(MONSTERS.wolf.lv, MONSTERS.frog.lv), sp);
  // はじめの ころ（レベル10の 第1章の 魔物どうし）は 第2章いこうの 強い 魔物は 生まれない
  for (const [a, b] of [['wolf', 'frog'], ['pururin', 'hedoron'], ['skeleton', 'goblin'], ['kobushi', 'nemuri'], ['lamp', 'koumorin']]) {
    for (const sp of breedCandidates(lv(a, 10), lv(b, 10), MONSTERS).list) assert.ok(MONSTERS[sp].lv <= 18, `${a}＋${b} → ${sp}`);
  }
});

test('配合: 図鑑に のっていない 魔物が さきに 生まれる → 仲間に したことがない 魔物 → ぜんぶ 仲間に したら 1ぴきめと おなじ', () => {
  const A = lv('wolf', 30), B = lv('frog', 30);
  const { list } = breedCandidates(A, B, MONSTERS);
  assert.ok(list.length >= 6, `候補 ${list.length}しゅ`);
  // なにも 知らない → いちばん 強い 候補
  const fresh = breedOutcome(A, B, MONSTERS, { bestiary: {}, kills: {} });
  assert.equal(fresh.child, list[0]);
  assert.ok(fresh.unseen && fresh.firstFriend && fresh.unseenCount === list.length);
  // 上から 2つを 見たことが ある（たおした）→ 3つめ（見たことがない）
  const c = { bestiary: { [list[0]]: { seen: 3 } }, kills: { [list[1]]: 2 } };
  const o = breedOutcome(A, B, MONSTERS, c);
  assert.equal(o.child, list[2]);
  assert.ok(o.unseen && o.unseenCount === list.length - 2);
  // 見たことが ある ものだけ → 仲間に したことが ない もの（いちばん 上）
  const seenAll = { bestiary: Object.fromEntries(list.map((sp) => [sp, { seen: 1 }])), kills: {} };
  const o2 = breedOutcome(A, B, MONSTERS, seenAll);
  assert.equal(o2.child, list[0]);
  assert.ok(!o2.unseen && o2.firstFriend);
  // 1つだけ 仲間に したことが ない → それ
  const ownAllBut = { bestiary: Object.fromEntries(list.map((sp, i) => [sp, i === 3 ? { seen: 1 } : { friend: 1 }])), kills: {} };
  assert.equal(breedOutcome(A, B, MONSTERS, ownAllBut).child, list[3]);
  // ぜんぶ 仲間に した → 1ぴきめと おなじ（「＋」を ふやして 育てなおせる）
  const ownAll = { bestiary: Object.fromEntries(list.map((sp) => [sp, { bred: 1 }])), kills: {} };
  const o3 = breedOutcome(A, B, MONSTERS, ownAll);
  assert.equal(o3.child, 'wolf');
  assert.equal(o3.kind, 'same');
  assert.ok(!o3.unseen && !o3.firstFriend && o3.unseenCount === 0);
  // 系統どうしの 組み合わせ（スライム系 ＋ スライム系 → キングぷるりん）も 見たことが なければ さき
  assert.equal(breedOutcome(lv('pururin'), lv('ice_pururin'), MONSTERS, ownAllBut).child, 'king_pururin');
  assert.equal(breedOutcome(lv('pururin'), lv('ice_pururin'), MONSTERS, ownAllBut).kind, 'recipe');
  // bestiaryKnow: 図鑑と おなじ 数えかた
  const k = bestiaryKnow({ bestiary: { a: { seen: 1 }, b: { friend: 1 }, c: { bred: 1 }, d: { el_fire: 1 } }, kills: { e: 1 } });
  assert.deepEqual(['a', 'b', 'c', 'd', 'e', 'f'].map(k), [1, 2, 2, 0, 1, 0]);
});

async function solo(seed = 77) {
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

test('配合: 酒場の みほん（クライアントの 図鑑で 計算）・サーバーの よこく・ほんとうに 生まれる 子が いつも おなじ。おなじ 組み合わせでも 図鑑が ふえると ちがう 子', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(77);
  const born = [];
  const pairs = [['wolf', 'frog'], ['wolf', 'frog'], ['wolf', 'frog'], ['pururin', 'ice_pururin'], ['pururin', 'ice_pururin'], ['skeleton', 'goblin'],
    ['kobushi', 'nemuri'], ['kobushi', 'nemuri'], ['lamp', 'wind_imp'], ['rockman', 'snowman'], ['pururin', 'king_pururin'], ['sea_serpent', 'crow']];
  for (const [x, y] of pairs) {
    const a = addMonsterCompanion(world, bot.s, x, 24);
    const b = addMonsterCompanion(world, bot.s, y, 22);
    assert.ok(a.ok && b.ok);
    world.sendSelf(bot.s);
    // クライアント: 酒場の 一覧と 自分の キャラ（'self' で とどく bot.char）だけで 計算する
    const roster = tavernInfo(world, bot.s).roster;
    const ea = roster.find((e) => e.key === a.key), eb = roster.find((e) => e.key === b.key);
    const o = breedOutcome(ea, eb, MONSTERS, bot.char);
    // サーバーの よこく
    const pv = breedPreview(c, a.key, b.key);
    assert.ok(pv.ok, pv.reason);
    for (const k of ['child', 'plus', 'special', 'kind', 'unseen', 'firstFriend', 'count', 'unseenCount']) assert.deepEqual(o[k], pv[k], `${x}＋${y}: ${k}`);
    bot.send({ t: 'svc', kind: 'tavern', action: 'breedPreview', a: a.key, b: b.key });
    assert.equal(lastRes(bot).preview.child, o.child);
    // ほんとうに 配合する
    const before = c.companions.length;
    bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key });
    const r = lastRes(bot);
    assert.ok(r.ok, r.text);
    assert.equal(c.companions.length, before - 1);
    const kid = c.companions[c.companions.length - 1];
    assert.equal(kid.species, o.child, `${x}＋${y}: みほんと おなじ 子`);
    if (o.unseen) assert.match(r.text, /図鑑にのった/);
    born.push(kid.species);
    // 子は 酒場へ（つぎの 配合の じゃまに ならない ように わかれる）
    bot.send({ t: 'svc', kind: 'tavern', action: 'release', key: kid.key });
  }
  // はいごうを するほど 見たことの ない 子が 生まれる: はぐれウルフ ＋ どくどくガエル を 3回 → 3しゅ ちがう 子
  assert.equal(new Set(born.slice(0, 3)).size, 3, born.slice(0, 3).join(','));
  for (const sp of born.slice(0, 3)) assert.ok(c.bestiary[sp].bred >= 1);
  // スライム系 ＋ スライム系: 1回めは キングぷるりん、2回めは ほかの スライム系
  assert.equal(born[3], 'king_pururin');
  assert.notEqual(born[4], 'king_pururin');
  assert.equal(MONSTERS[born[4]].race, 'slime');
  assert.equal(born[10], 'pururin_tower', 'ぷるりん ＋ キングぷるりん → ぷるりんタワー');
});

test('配合: 生まれた あたらしい 魔物は 技を 覚え、たたかえる（レベル1から）', () => {
  for (const sp of NEW) {
    for (const L of [1, 15, 35]) {
      const m = newMonsterCompanion({ id: 'x', species: sp, level: L });
      const s = computeStats(m);
      assert.ok(s.maxHp > 0 && s.atk > 0 && s.dfn > 0 && s.agi > 0, `${sp} Lv${L}`);
      assert.ok(learnedAbilities(m).length >= 1, `${sp} Lv${L}: 技`);
    }
  }
});

test('図鑑: あたらしい 魔物も のる（ふつうの 魔物は 強さじゅん → 配合だけの 魔物 → ボス）。酒場の うわさ', () => {
  const order = bestiaryOrder(MONSTERS);
  assert.equal(order.length, Object.keys(MONSTERS).length);
  assert.equal(new Set(order).size, order.length);
  for (const sp of NEW) assert.ok(order.includes(sp), sp);
  const firstBreed = order.findIndex((sp) => MONSTERS[sp].breedOnly);
  const firstBoss = order.findIndex((sp) => MONSTERS[sp].boss);
  assert.ok(order.slice(0, firstBreed).every((sp) => !MONSTERS[sp].breedOnly && !MONSTERS[sp].boss));
  assert.ok(order.slice(firstBreed, firstBoss).every((sp) => MONSTERS[sp].breedOnly));
  const blv = order.slice(firstBreed, firstBoss).map((sp) => MONSTERS[sp].lv);
  assert.deepEqual(blv, [...blv].sort((x, y) => x - y), '配合だけの 魔物も 強さじゅん');
  assert.equal(order[0], 'pururin');
  // 酒場の うわさ: まだ 見たことがない 配合だけの 魔物の ヒント（弱い じゅん）
  const r = breedRumors({ bestiary: {}, kills: {} }, MONSTERS, 3);
  assert.equal(r.length, 3);
  assert.equal(r[0], recipeHint('fuwari', MONSTERS));
  const known = Object.fromEntries(Object.keys(MONSTERS).map((sp) => [sp, { seen: 1 }]));
  assert.deepEqual(breedRumors({ bestiary: known }, MONSTERS), []);
  // 系統配合だけで 生まれる 魔物の ヒント
  assert.match(recipeHint('mandra', MONSTERS), /^植物系 ＋ どの魔物でも/);
  assert.equal(recipeHint('silver_king', MONSTERS), 'きらきらぷるりん ＋ キングぷるりん');
  assert.equal(recipeHint('donguri', MONSTERS), '', 'やせいの 魔物には ヒントを 出さない');
});

test('セーブ: むかしの セーブも 読める。あたらしい 魔物の 仲間は セーブ・引っこしコードで のこる。前の 版で しまわれた 仲間も もどる', async () => {
  // むかしの セーブ（あたらしい 魔物を 知らない）
  const old = {
    characters: {
      c_old: {
        id: 'c_old', name: 'ソラ', job: 'warrior', level: 20, exp: 9000, gold: 10, hp: 40, mp: 5, look: {},
        jobs: { warrior: { lv: 5 } }, equip: {}, items: [], flags: { p_opening: true, monster_bond: true }, kills: { pururin: 3 },
        bestiary: { pururin: { seen: 3, friend: 1 } },
        companions: [{ key: 'm0', kind: 'monster', species: 'pururin', char: { id: 'c_old:m0', name: 'ぷるる', species: 'pururin', level: 12, exp: 0, hp: 10, mp: 0, equip: {} } }],
        // 前の 版が 知らなかった 魔物は しまわれている（world/save.js の stash）
        stash: { companions: [{ key: 'm1', kind: 'monster', species: 'silver_king', char: { id: 'c_old:m1', name: 'ギン', species: 'silver_king', level: 3, exp: 0, hp: 10, mp: 0, equip: {} } }] },
        pos: { map: 'overworld', x: 30.5, y: 100.5, dir: 'down' },
      },
    },
  };
  const { data } = upgradeSave(old);
  const c = data.characters.c_old;
  assert.deepEqual(c.companions.map((e) => e.species), ['pururin', 'silver_king'], 'しまわれていた ぎんいろキングが もどる');
  assert.ok(!c.stash?.companions?.length);
  assert.ok(computeStats(c.companions[1].char).maxHp > 0);
  // むかしの セーブの 図鑑でも 配合の みほんが 計算できる
  const o = breedOutcome(lv('pururin', 12), lv('pururin', 12), MONSTERS, c);
  assert.equal(o.child, 'king_pururin');
  // あたらしい 魔物の 仲間を 引っこしコードで はこぶ
  const { world, bot, c: me } = await solo(91);
  for (const sp of ['donguri', 'thunder_dragon', 'mimic']) assert.ok(addMonsterCompanion(world, bot.s, sp, 15).ok, sp);
  const r = parseCode(exportCode(me));
  assert.ok(r.ok);
  assert.deepEqual(r.char.companions.map((e) => e.species), ['donguri', 'thunder_dragon', 'mimic']);
  assert.ok(upgradeSave({ version: 4, characters: { [me.id]: r.char } }).data.characters[me.id].companions.length === 3);
});

test('仲間に なる: あたらしい やせいの 魔物を たおすと 仲間に なりたがる（配合だけの 魔物は ならない）', async () => {
  const { rollBefriend } = await import('../public/js/shared/world/party.js');
  const { world, bot, c } = await solo(5);
  const got = new Set();
  for (let i = 0; i < 400 && got.size < WILD.length; i++) {
    for (const sp of WILD) if (rollBefriend(world, c, [sp])) got.add(sp);
  }
  assert.deepEqual([...got].sort(), [...WILD].sort());
  for (let i = 0; i < 200; i++) for (const sp of BREED_ONLY) assert.equal(rollBefriend(world, c, [sp]), null, sp);
  assert.ok(c);
});

test('配合: 酒場の 一覧の レベル（BREED_MIN_LEVEL）', () => {
  assert.equal(BREED_MIN_LEVEL, 10);
});

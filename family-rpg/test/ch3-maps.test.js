// 第3章「星の竜がねむる山」の マップ: つながり・しかけ・人・宝箱・出現表
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked, effectiveTile, slidesAt } from '../public/js/shared/maps/index.js';
import { CH3_MAPS, CART_RIDES, VOLCANO_LEVERS, WISDOM_BRAZIERS, BOND_PLATES } from '../public/js/shared/maps/ch3.js';
import { NORTH_POS, NORTH_ARRIVE, LAKE3, ROPE, DRAGON_GATE_X, DRAGON_GATE_Y } from '../public/js/shared/maps/north.js';
import { slideReach, slideTraps, slideSteps, slideSolid, slideMoves } from '../public/js/shared/maps/slide.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { dungeonExit, isDungeonMap } from '../public/js/shared/world/escape.js';

const key = (x, y) => `${x},${y}`;
const hasOf = (flags) => (f) => flags.includes(f);

// 歩いて・すべって 行ける とまる マス（氷は slide.js の きまり）
// ワープの マスは ふむと べつの 場所へ とぶので、その 先へは 歩いて いけない
function reach(map, start, flags = []) {
  const has = hasOf(flags);
  const base = slideSolid(map, has);
  const warps = new Set(map.warps.map((w) => key(w.x, w.y)));
  const s = slideReach(map, start, has, (x, y) => base(x, y) || warps.has(key(x, y)));
  return (x, y) => s.has(key(x, y));
}
// そばに 立てるか（たてよこ・ななめ 1マス。カウンターごしは 2マス）
function near(r, x, y, d = 1) {
  for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (r(x + dx, y + dy)) return true;
  return false;
}
const start = (to) => [Math.floor(to.x), Math.floor(to.y)];

// ワープで 入ってくる ところ（マップごと）
function entrances(id) {
  const out = [];
  for (const m of Object.values(MAPS)) for (const w of m.warps) if (w.to.map === id) out.push(start(w.to));
  return out;
}

test('第3章: マップが ぜんぶ ある', () => {
  for (const id of CH3_MAPS) assert.ok(MAPS[id], id);
  assert.equal(MAPS.north.kind, 'field');
  for (const id of CH3_MAPS.slice(1)) assert.equal(MAPS[id].kind, 'dungeon', id);
});

test('シロガネ地方: 物語の じゅんに 道が ひらく（なだれ → トンネル → さく → 炎 → 竜の門）', () => {
  const m = MAPS.north;
  const s0 = start(NORTH_ARRIVE);
  const P = NORTH_POS;
  const steps = [
    { flags: [], yes: [[64, 60], [P.icecave.x, P.icecave.y + 1], [P.fox.x, P.fox.y], [P.spa.x, P.spa.y + 3], [P.crater.x, P.crater.y]], no: [[114, 48], [P.mine.x, P.mine.y + 1], [100, 84], [P.temple.x, P.temple.y + 1], [P.peak.x, P.peak.y + 1]] },
    { flags: ['c3_mammoth'], yes: [[114, 48], [P.mine.x, P.mine.y + 1]], no: [[100, 84]] },
    { flags: ['c3_mammoth', 'c3_mine'], yes: [[100, 84]], no: [[P.volcano.x - 1, P.volcano.y]] },
    { flags: ['c3_mammoth', 'c3_mine', 'c3_onsen'], yes: [[P.volcano.x - 1, P.volcano.y]], no: [[P.temple.x, P.temple.y + 1]] },
    { flags: ['c3_mammoth', 'c3_mine', 'c3_onsen', 'c3_flare'], yes: [[P.temple.x, P.temple.y + 1]], no: [[P.peak.x, P.peak.y + 1]] },
    { flags: ['c3_mammoth', 'c3_mine', 'c3_onsen', 'c3_flare', 'c3_gate'], yes: [[P.peak.x, P.peak.y + 1]], no: [] },
  ];
  for (const st of steps) {
    const r = reach(m, s0, st.flags);
    for (const [x, y] of st.yes) assert.ok(r(x, y), `${st.flags.join('+') || 'はじめ'}: ${x},${y} へ 行ける`);
    for (const [x, y] of st.no) assert.ok(!r(x, y), `${st.flags.join('+') || 'はじめ'}: ${x},${y} へは まだ 行けない`);
  }
  // さくは 1マス。竜の門は 谷の はばいっぱい
  assert.equal(effectiveTile(m, ROPE.x, ROPE.y[0], () => false), T.FENCE);
  for (let x = DRAGON_GATE_X[0]; x <= DRAGON_GATE_X[1]; x++) assert.equal(effectiveTile(m, x, DRAGON_GATE_Y, () => false), T.DRAGON_GATE);
});

test('シロガネ地方: 白銀の湖は すべって 小島の 宝箱へ 行けて、とじこめられない', () => {
  const m = MAPS.north;
  const s0 = [LAKE3.x + 15, LAKE3.y - 4];
  assert.ok(!isBlocked(m, ...s0, () => false), '岸から はじめる');
  const has = hasOf(['c3_mammoth', 'c3_mine', 'c3_onsen', 'c3_flare', 'c3_gate']);
  assert.ok(slideSteps(m, s0, [LAKE3.x, LAKE3.y - 1], has) > 0, '小島の 上（宝箱の 前）へ すべって 行ける');
  // 湖の まわりは 広いので、湖と その まわりだけ しらべる
  const box = (x, y) => x >= LAKE3.x - LAKE3.rx - 4 && x <= LAKE3.x + LAKE3.rx + 4 && y >= LAKE3.y - LAKE3.ry - 4 && y <= LAKE3.y + LAKE3.ry + 4;
  const base = slideSolid(m, has);
  const solid = (x, y) => !box(x, y) || base(x, y);
  assert.deepEqual(slideTraps(m, s0, has, solid), [], '湖の 上で とじこめられる 場所が ない');
  // 岸から まっすぐ 1回 すべる だけでは 小島に 着かない（氷の岩で とまる なぞとき）
  const island = (x, y) => Math.abs(x - LAKE3.x) <= 1 && Math.abs(y - LAKE3.y) <= 1;
  let shores = 0;
  for (let y = LAKE3.y - LAKE3.ry - 3; y <= LAKE3.y + LAKE3.ry + 3; y++) {
    for (let x = LAKE3.x - LAKE3.rx - 3; x <= LAKE3.x + LAKE3.rx + 3; x++) {
      if (island(x, y) || base(x, y) || slidesAt(m, x, y, has)) continue;
      const moves = slideMoves(m, x, y, has, base);
      if (moves.some(([nx, ny]) => slidesAt(m, x + Math.sign(nx - x), y + Math.sign(ny - y), has))) shores++;
      for (const [nx, ny] of moves) assert.ok(!island(nx, ny), `${x},${y} から 1回で 小島へ 着いてしまう`);
    }
  }
  assert.ok(shores > 40, '岸から すべりだせる');
  assert.ok(slideSteps(m, [LAKE3.x + 5, LAKE3.y - 8], [LAKE3.x + 1, LAKE3.y], has) > 0, '北の 岸から 岩で とまって 左へ');
});

test('第3章のダンジョン: 氷の しかけは かならず とけて、とじこめられない', () => {
  // [マップ, 入り口, ゴール]
  const puzzles = [
    ['ice_cave1', [17, 15], [17, 3]], // A: 1階の 階段へ
    ['ice_cave1', [29, 15], [29, 6]], // B: 宝箱の くぼみへ
    ['ice_cave2', [20, 23], [20, 8]], // 地下の こおった 湖 → ボスの へや
    ['ice_cave2', [6, 19], [6, 12]], // 西の 宝の へや
    ['peak2', [15, 22], [15, 10]], // 星竜山の 氷の ほらあな
  ];
  for (const [id, s0, goal] of puzzles) {
    const m = MAPS[id];
    const n = slideSteps(m, s0, goal, () => false);
    assert.ok(n > 0, `${id}: ${goal} へ 行ける`);
    assert.deepEqual(slideTraps(m, s0, () => false), [], `${id}: とじこめられない`);
    // ゴールからも 入り口へ もどれる
    assert.ok(slideSteps(m, goal, s0, () => false) > 0, `${id}: もどれる`);
  }
});

// レバーの しかけ: （いる 場所, レバーの フラグ）の じょうたいを たどる
// ノードは「その フラグで 歩いて 行ける まとまり」。レバーの となりで フラグを かえると つぎの ノードへ
function leverGraph(map, s0, levers, extraEdges = () => [], flags0 = []) {
  const nodes = new Map();
  const q = [];
  const add = (pos, flags) => {
    const k = `${pos[0]},${pos[1]}|${flags.slice().sort().join('+')}`;
    if (!nodes.has(k)) {
      nodes.set(k, { pos, flags, next: [] });
      q.push(k);
    }
    return k;
  };
  add(s0, flags0);
  for (let h = 0; h < q.length; h++) {
    const st = nodes.get(q[h]);
    st.reach = slideReach(map, st.pos, hasOf(st.flags));
    for (const kk of st.reach) {
      const [x, y] = kk.split(',').map(Number);
      for (const lv of levers) {
        if (Math.abs(lv.x - x) + Math.abs(lv.y - y) !== 1) continue;
        const nf = st.flags.includes(lv.flag) ? st.flags.filter((f) => f !== lv.flag) : [...st.flags, lv.flag];
        st.next.push(add([x, y], nf));
      }
      for (const to of extraEdges(x, y, st.flags)) st.next.push(add(to, st.flags));
    }
  }
  return nodes;
}
// 行ける (場所, フラグ) の 一覧
function leverStates(...args) {
  const out = [];
  for (const st of leverGraph(...args).values()) for (const kk of st.reach) out.push({ pos: kk.split(',').map(Number), flags: st.flags });
  return out;
}
// s0 へ もどれない ノード（なければ []）
function stuckNodes(nodes, s0) {
  const k0 = `${s0[0]},${s0[1]}`;
  const good = new Set([...nodes.entries()].filter(([, st]) => st.reach.has(k0)).map(([k]) => k));
  let changed = true;
  while (changed) {
    changed = false;
    for (const [k, st] of nodes) {
      if (!good.has(k) && st.next.some((n) => good.has(n))) {
        good.add(k);
        changed = true;
      }
    }
  }
  return [...nodes.keys()].filter((k) => !good.has(k));
}

test('炎の山: レバーで ようがんの 流れが かわり、階段へ 行けて、どこからでも 入り口へ もどれる', () => {
  const v1 = MAPS.volcano1, v2 = MAPS.volcano2;
  const lever = (m, flag) => m.gates.filter((g) => g.flag === flag && g.closed === T.LEVER).map((g) => ({ x: g.x, y: g.y, flag }));
  const check = (m, s0, goal, flags) => {
    const levers = flags.flatMap((f) => lever(m, f));
    assert.equal(levers.length, flags.length, `${m.id}: レバー`);
    const all = leverStates(m, s0, levers);
    assert.ok(all.some((st) => st.pos[0] === goal[0] && st.pos[1] === goal[1]), `${m.id}: 階段へ 行ける`);
    // どの じょうたいからも 入り口へ もどれる（レバーを 動かして よい）
    assert.deepEqual(stuckNodes(leverGraph(m, s0, levers), s0), [], `${m.id}: とじこめられない`);
    return all;
  };
  const a1 = check(v1, [20, 29], [20, 3], [VOLCANO_LEVERS.v1]);
  // 1階: レバーを 動かさないと 階段へは 行けない
  assert.ok(!a1.some((st) => !st.flags.length && st.pos[1] <= 8), '1階: レバーなしでは 北へ 行けない');
  const a2 = check(v2, [21, 35], [12, 4], [VOLCANO_LEVERS.v2a, VOLCANO_LEVERS.v2b]);
  // 2階: 階段へ 行くには 2つの レバーが いる
  const at = (st, x, y) => st.pos[0] === x && st.pos[1] === y;
  assert.ok(a2.filter((st) => at(st, 12, 4)).every((st) => st.flags.length === 2), '2階: 2つの レバーを 動かす');
  // 北東の 宝の へやは レバー2を 動かす 前に 行く
  assert.ok(a2.some((st) => at(st, 36, 9) && !st.flags.includes(VOLCANO_LEVERS.v2b)), '2階: 北東の へや');
});

test('鉱山: トロッコと レバーで 島を わたり、いちばん下へ 行ける', () => {
  const cartEdges = (mapId) => (x, y, flags) => {
    const out = [];
    for (const [id, r] of Object.entries(CART_RIDES)) {
      if (r.map !== mapId) continue;
      const [cx, cy] = r.off.path[0].map(Math.floor);
      if (Math.abs(cx - x) + Math.abs(cy - y) !== 1) continue;
      const leg = r.lever && flags.includes(r.lever) ? r.on : r.off;
      out.push([Math.floor(leg.to[0]), Math.floor(leg.to[1])]);
      void id;
    }
    return out;
  };
  const lever = (m) => m.gates.filter((g) => g.closed === T.LEVER).map((g) => ({ x: g.x, y: g.y, flag: g.flag }));
  const m1 = MAPS.mine1, m2 = MAPS.mine2;
  const s1 = leverStates(m1, [19, 29], lever(m1), cartEdges('mine1'));
  assert.ok(s1.some((st) => st.pos[0] === 35 && st.pos[1] === 3), '1階: 階段の 島へ 行ける');
  assert.ok(s1.some((st) => st.pos[0] === 5 && st.pos[1] === 3), '1階: 物置の 島へ 行ける');
  assert.deepEqual(stuckNodes(leverGraph(m1, [19, 29], lever(m1), cartEdges('mine1')), [19, 29]), [], '1階: とじこめられない');
  const s2 = leverStates(m2, [21, 32], lever(m2), cartEdges('mine2'));
  assert.deepEqual(stuckNodes(leverGraph(m2, [21, 32], lever(m2), cartEdges('mine2')), [21, 32]), [], '地下2階: とじこめられない');
  assert.ok(s2.some((st) => st.pos[0] === 21 && st.pos[1] === 3), '地下2階: 下への 階段へ 行ける');
  assert.ok(s2.some((st) => st.pos[0] === 36 && st.pos[1] === 18), '地下2階: つかまった 鉱夫の 島へ 行ける');
  // トロッコの おりる ところは 歩ける
  for (const r of Object.values(CART_RIDES)) {
    for (const leg of [r.off, r.on].filter(Boolean)) assert.ok(!isBlocked(MAPS[r.map], Math.floor(leg.to[0]), Math.floor(leg.to[1]), () => true), `${r.map} ${leg.to}`);
  }
});

test('第3章: 人・宝箱・かんばん・しかけ・ワープが ただしく、ぜんぶ 行ける', () => {
  const ALL = ['c3_start', 'c3_elder', 'c3_mammoth', 'c3_miners', 'c3_mine', 'c3_onsen', 'c3_flare', 'c3_gate', 'c3_ignia', 'c3_dragon', 'c3_clear',
    'c3_courage', 'c3_wisdom', 'c3_bond', 'c3_m2_free', 'q_fox_start'];
  for (const id of CH3_MAPS) {
    const m = MAPS[id];
    const starts = id === 'north' ? [start(NORTH_ARRIVE)] : entrances(id);
    assert.ok(starts.length, `${id}: 入り口`);
    // しかけの フラグ（レバー）は どちらでも 行けるように 両方 しらべる
    const levers = [...new Set(m.gates.filter((g) => g.closed === T.LEVER).map((g) => g.flag))];
    const sets = [ALL];
    for (const lv of levers) for (const s of sets.slice()) sets.push([...s, lv]);
    const extra = Object.values(CART_RIDES).filter((r) => r.map === id).flatMap((r) => [r.off, r.on].filter(Boolean).map((l) => start({ x: l.to[0], y: l.to[1] })));
    const rs = sets.flatMap((fl) => [...starts, ...extra].map((s0) => reach(m, s0, fl)));
    const r = (x, y) => rs.some((f) => f(x, y));
    for (const c of m.chests) {
      assert.ok(!isBlocked(m, c.x, c.y, () => true), `${id} chest ${c.id} の 下は ゆか`);
      assert.ok(near(r, c.x, c.y), `${id} chest ${c.id} に 行けない`);
      assert.ok(c.gold || ITEMS[c.item], `${id} chest ${c.id} item ${c.item}`);
    }
    for (const n of m.npcs) {
      assert.ok(SCRIPTS[n.script], `${id} npc ${n.id} script ${n.script}`);
      assert.ok(near(r, Math.floor(n.x), Math.floor(n.y), n.big ? 3 : 2), `${id} npc ${n.id} に 行けない`);
      if (!n.big && !['monkey'].includes(n.sprite)) assert.ok(!isBlocked(m, Math.floor(n.x), Math.floor(n.y), () => true) || n.sprite === 'firestone', `${id} npc ${n.id} が かべの 中`);
    }
    for (const s of m.signs) assert.ok(near(r, s.x, s.y), `${id} sign ${s.x},${s.y}`);
    for (const a of m.actions || []) {
      assert.ok(SCRIPTS[a.script], `${id} action ${a.script}`);
      assert.ok(near(r, a.x, a.y), `${id} action ${a.script} ${a.x},${a.y}`);
    }
    for (const tr of m.triggers) assert.ok(SCRIPTS[tr.script], `${id} trigger ${tr.id}`);
    for (const w of m.warps) {
      assert.ok(near(r, w.x, w.y), `${id} warp ${w.x},${w.y}`);
      // 行った 先から もどる ワープが ある
      const back = MAPS[w.to.map].warps.some((b) => b.to.map === id);
      assert.ok(back, `${id} → ${w.to.map} から もどれる`);
    }
    assert.ok(m.areaName(1, 1), `${id} の 名前`);
    for (const z of Object.keys(m.spawnCounts || {})) {
      assert.ok(ENCOUNTER_TABLES[z]?.length, `${id}: 出現表 ${z}`);
      assert.ok(ZONE_BG[z], `${id}: たたかいの はいけい ${z}`);
    }
  }
});

test('第3章: 出現表・ボス・素材が そろっている', () => {
  const zones = ['n_snow', 'n_forest', 'n_lake', 'n_mine', 'n_peak', 'n_volcano', 'n_ice', 'n_mine1', 'n_mine2', 'n_volc', 'n_temple', 'n_peak_out', 'n_peak_in'];
  const seen = new Set();
  for (const z of zones) {
    for (const e of ENCOUNTER_TABLES[z]) for (const [sp] of e.group) {
      assert.ok(MONSTERS[sp], `${z}: ${sp}`);
      seen.add(sp);
    }
  }
  const CONTRACT = ['snow_slime', 'frost_wolf', 'snowman', 'yeti', 'ice_bat', 'snow_wisp', 'penguin_knight', 'ice_golem', 'kiba_walrus',
    'mole_miner', 'ore_slime', 'minecart_ghost', 'fire_imp', 'lava_lizard', 'fire_hound', 'magma_slime', 'ember_bird', 'obsidian_knight',
    'dragon_statue', 'star_wyvern', 'shadow_flame', 'frost_drake'];
  for (const sp of CONTRACT) {
    assert.ok(seen.has(sp), `${sp} が どこかに 出る`);
    const m = MONSTERS[sp];
    assert.ok(m.lv >= 19 && m.lv <= 30, `${sp} の レベル ${m.lv}`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || SCRIPTS || a.id, sp);
  }
  const BOSSES = { blizzard_mammoth: 21, magma_golem: 23, flame_knight: 25, trial_guardian: 27, flame_witch: 29, flame_witch_true: 30 };
  for (const [sp, lv] of Object.entries(BOSSES)) {
    const m = MONSTERS[sp];
    assert.ok(m?.boss, sp);
    assert.equal(m.lv, lv, `${sp} の レベル`);
    assert.ok(m.speed > 0.6 && m.speed < 1, `${sp} の 速さ`);
    assert.ok(FIXED_ENCOUNTERS[sp], `${sp} の たたかい`);
  }
  // ボスの アクセサリー（さいごは 真の すがたが 落とす）
  for (const sp of ['blizzard_mammoth', 'magma_golem', 'flame_knight', 'trial_guardian', 'flame_witch_true']) {
    const id = MONSTERS[sp].drops.boss[0];
    assert.equal(ITEMS[id]?.type, 'acc', `${sp}: ${id}`);
    assert.ok(ITEMS[id].unique);
  }
  // ちえの間・きずなの間の しかけ
  for (const [x, y] of Object.values(WISDOM_BRAZIERS)) assert.equal(MAPS.trial_wisdom.tiles[y * MAPS.trial_wisdom.w + x], T.BRAZIER);
  for (const [x, y] of BOND_PLATES) assert.equal(MAPS.trial_bond.tiles[y * MAPS.trial_bond.w + x], T.PLATE);
  assert.ok(TILE_INFO[T.LAVA_FLOOR].hurt);
});

test('第3章: たてものの 入り口は 内がわも 外がわも ふさがっていない', () => {
  for (const id of CH3_MAPS) {
    const m = MAPS[id];
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        if (m.tiles[y * m.w + x] !== T.DOOR) continue;
        const open = (dx, dy) => !isBlocked(m, x + dx, y + dy, () => true);
        // たて向きの とびら（上と 下）か、よこ向きの とびら（左と 右。神殿の 左右の 出入り口）
        const vertical = (open(0, -1) || y === 0) && (open(0, 1) || y === m.h - 1);
        const horizontal = (open(-1, 0) || x === 0) && (open(1, 0) || x === m.w - 1);
        assert.ok(vertical || horizontal, `${id} とびら ${x},${y}`);
      }
    }
  }
});

test('第3章: みちびきの糸は どの 階からでも その ダンジョンの 入り口の 外へ もどれる', () => {
  const door = (id) => (id.startsWith('ice_cave') ? NORTH_POS.icecave : id.startsWith('mine') ? NORTH_POS.mine
    : id.startsWith('volcano') ? NORTH_POS.volcano : id.startsWith('peak') ? NORTH_POS.peak : NORTH_POS.temple);
  for (const id of CH3_MAPS.slice(1)) {
    assert.ok(isDungeonMap(MAPS[id]), `${id}: 糸が 使える`);
    const to = dungeonExit(null, { map: id, char: {} });
    assert.equal(to?.map, 'north', `${id}: シロガネ地方へ`);
    const d = door(id);
    assert.ok(Math.hypot(to.x - (d.x + 0.5), to.y - (d.y + 0.5)) < 2, `${id}: 入り口の そば ${to.x},${to.y}`);
    assert.ok(!isBlocked(MAPS.north, Math.floor(to.x), Math.floor(to.y), () => true), `${id}: 立てる 場所`);
  }
});

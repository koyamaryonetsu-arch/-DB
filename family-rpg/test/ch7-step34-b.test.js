// 第2部 第7章 第2幕（Step 3・4）B（戦い・品）「海の紋章」
// 名前の 約束（docs/plan-ch7.md の 4-3）・手下の 魔物 5しゅ（どれも 仲間に なる・ランク・まぜ配合・素材の 入手先）・出現表・
// ジョリーホック号（しおの満ち引き: いっせい砲げき・のり上げ）・ホック船長（板わたり: 手をのばす・ドボンの 大波・合体技の よやくを ひきはなす）・
// 知っている 人と ふつうの オート・ゲストと 酒場の カイ・灯台の 宝箱（★5 装備 1つ ＋ 素材か 道具 1つ）・ボスの 品・手紙の ごほうび・島の 店・
// 細かく 描いた ボスの え（2倍の こまかさ・artScale 0.5）・エフェクト・がめん・技の せつめい（1文め）・文字
// A の マップ・台本は まだ ないので、きまった 戦いは Battle を じかに 作って 動かす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { MAT_DROPS, monsterDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, familyPool, mixPool, rankOf, joinTier } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { starsOf, rareWhereText, isShopItem } from '../public/js/shared/data/rare-loot.js';
import { GUESTS } from '../public/js/shared/data/shops.js';
import { canEquip } from '../public/js/shared/stats.js';
import { makeNpcSupportChar } from '../public/js/shared/world/party.js';
import { MONSTERS_C7S, C7_REEF, C7_LIGHT, C7S_MINIONS, C7S_MAT_DROPS } from '../public/js/shared/data/monsters-c7s.js';
import { C7S_ABILITIES } from '../public/js/shared/data/abilities-c7s.js';
import { FRIENDS_C7S, KAI_GUEST, KAI_SUPPORT } from '../public/js/shared/data/companions-c7s.js';
import { ENCOUNTERS_C7S, FIXED_C7S, ZONE_BG_C7S } from '../public/js/shared/data/encounters-c7s.js';
import {
  ITEMS_C7S, C7S_TREASURE, C7S_TREASURE_N, c7sChest, C7S_LETTER_REWARDS, C7S_DROPS, C7S_K, C7S_ITEM_KANA, C7S_SHOP_WEAPONS, C7S_SHOP_ARMOR, C7S_SHOP_TOOLS,
} from '../public/js/shared/data/items-c7s.js';
import { BROADSIDE, STUCK, PLANK, DROP, PLANK_KIND, broadsideBefore, fallBefore, plankWho, aground, c7sPlan, c7sEffect } from '../public/js/shared/battle-c7s.js';
import { AUTO_GUARD } from '../public/js/shared/battle-ch6.js';
import { towerTurnStart } from '../public/js/shared/battle-ch5.js';
import { reach, REACH } from '../public/js/shared/battle-earth.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ch7Run, ch7Party, kaiChar, CH7_KIT, CH7_LV } from '../tools/sim-ch7.mjs';
import { rankPoints, BANDS } from '../tools/gen-monster-ranks.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC7sFx, C7S_FINE } from '../public/js/client/render/battlefx-c7s.js';
import { playC7Fx, C7_FINE } from '../public/js/client/render/battlefx-c7.js';
import { playTokei6Fx } from '../public/js/client/render/battlefx-tokei6.js';
import { C7S_SCREEN_ANIMS, C7S_ALLY_FX, C7S_SFX, C7S_OWN_TELE, c7sDraw, c7sPresent } from '../public/js/client/battle-c7s.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { TRAP_LABEL } from '../public/js/client/battle-earth.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { ITEMS_C8C } from '../public/js/shared/data/items-c8c.js';
import { ITEMS_C8R } from '../public/js/shared/data/items-c8r.js';

// ねらった 系統と ランク（docs/plan-r53-breed-more.md の 1 の 足りない 所。第7章 第1幕の あとで 2しゅ いか）
const WANT = { pukupuku: ['dragon', 'F'], karon: ['undead', 'E'], jugemu: ['spirit', 'D'], fish_pirate: ['dragon', 'C'], pirate_parrot: ['demon', 'A'] };
const BOSS = { reef: C7_REEF, light: C7_LIGHT };
const ev0 = () => ({ lines: [], upd: [], results: [] });
const turn = (b, c, cmd = { type: 'ai' }) => {
  const ev = ev0();
  towerTurnStart(b, c, ev, cmd);
  return ev;
};
function bossBattle(boss, seed = 3, guest = true) {
  const party = ch7Party(boss, CH7_LV[boss]);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' }));
  if (guest) allies.push({ char: kaiChar(CH7_LV[boss]), kind: 'guest', auto: true, tactics: 'aggressive' });
  const enemies = FIXED_ENCOUNTERS[BOSS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));
  return new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies });
}
const dmgOf = (ev) => (ev.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
const effect = (b, c, id) => {
  const ev = ev0();
  c7sEffect(b, c, ABILITIES[id], ABILITIES[id].effect, ev);
  return ev;
};

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch7.md の 4-3）: c7_reef・c7_light・t7_sea・t7_light・C7S_TREASURE・C7S_LETTER_REWARDS・GUESTS.kai・KAI_SUPPORT', () => {
  for (const id of [C7_REEF, C7_LIGHT]) {
    const f = FIXED_ENCOUNTERS[id];
    assert.equal(f, FIXED_C7S[id]);
    assert.ok(f.boss && f.canFlee === false && !f.loseOk && f.bgm === 'boss6', id);
    assert.equal(f.group[0][0], id, 'showMon と おなじ 魔物');
    assert.ok(MONSTERS[id]?.boss && MONSTER_ART[id], id);
  }
  assert.equal(MONSTERS[C7_LIGHT].name, 'ホック船長');
  assert.deepEqual(Object.keys(ENCOUNTERS_C7S), ['t7_sea', 't7_light']);
  for (const z of ['t7_sea', 't7_light']) {
    assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C7S[z]);
    assert.equal(ZONE_BG[z], ZONE_BG_C7S[z]);
    assert.equal(rankPoints(ENCOUNTERS_C7S[z][0].group[0][0]).band, '第7章');
  }
  assert.deepEqual(Object.keys(C7S_TREASURE).map(Number), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const list of Object.values(C7S_TREASURE)) assert.equal(list.length, 2);
  assert.deepEqual(Object.keys(C7S_LETTER_REWARDS).map(Number), [1, 2, 3, 4]);
  for (const list of Object.values(C7S_LETTER_REWARDS)) for (const [id, n] of list) assert.ok(ITEMS[id] && n >= 1, id);
  assert.equal(GUESTS.kai, KAI_GUEST);
  assert.equal(KAI_SUPPORT.unlock, 'c7_kai');
});

// ───────────── 手下の 魔物 ─────────────
test('手下の 魔物 5しゅ: どれも 仲間に なる・ねらった 系統と ランク・出現表に 出る・Lv72〜76・素材の 入手先', () => {
  assert.deepEqual(C7S_MINIONS.slice().sort(), Object.keys(WANT).sort());
  const zoneOf = (sp) => Object.entries(ENCOUNTERS_C7S).filter(([, t]) => t.some((e) => e.group.some((g) => g[0] === sp))).map(([z]) => z);
  for (const [sp, [race, rank]] of Object.entries(WANT)) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.equal(m, MONSTERS_C7S[sp]);
    assert.equal(f, FRIENDS_C7S[sp]);
    assert.equal(m.race, race, sp);
    assert.ok(f.rate > 0 && !f.breedOnly && joinTier(sp), `${sp}: 仲間に なる`);
    assert.equal(MONSTER_RANKS[sp], rank, `${sp}: ランクの 表`);
    assert.equal(rankOf(sp, MONSTERS), rank, sp);
    assert.equal(rankPoints(sp).rank, rank, `${sp}: gen-monster-ranks と おなじ`);
    assert.equal(rankPoints(sp).band, '第7章');
    assert.ok(m.lv >= 72 && m.lv <= 76 && m.region === 6, sp);
    assert.ok(zoneOf(sp).length >= 1, `${sp}: 出現表`);
    assert.ok(!m.boss && m.desc && f.note && f.names.length === 4, sp);
    // 素材（今の 素材だけ）。入手先の 画面に 出る（第64回 ⑥a。出る 場所は A の マップの spawnCounts から 自動で 出る）
    assert.ok(MAT_DROPS[sp] && C7S_MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', sp);
    assert.ok(monsterDrops(sp).some((d) => d.item === MAT_DROPS[sp][0]), `${sp}: 落とす 物`);
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok((sum >= 5.8 && sum <= 6.1) || (sum >= 6.8 && sum <= 7.3), `${sp}: growth ${sum.toFixed(2)}`);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id] && !['c7sBroadside', 'c7sPlank', 'c7sDrop', 'callHelp'].includes(ABILITIES[id].effect.type), `${sp}: ${id}`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const id of [m.drops.common?.[0], m.drops.rare?.[0]]) assert.ok(ITEMS[id], `${sp}: ${id}`);
  }
  assert.ok(BANDS.includes('第7章'));
  // 海の 魚は 水に 強い（第47回の きまり）
  for (const sp of ['pukupuku', 'fish_pirate']) assert.equal(MONSTERS[sp].resist.water, 0.5, sp);
});

test('配合: 5しゅ みんな 系統まぜ配合（mix）の 子・系統配合の 子は B・A だけ（海賊オウム）', () => {
  for (const sp of C7S_MINIONS) {
    const f = FRIENDS_C7S[sp], race = MONSTERS[sp].race;
    assert.ok(Array.isArray(f.mix) && f.mix.length >= 1, sp);
    for (const other of f.mix) assert.ok(mixPool(race, other, MONSTERS).includes(sp), `${sp}: ${race}+${other}`);
    const high = ['B', 'A'].includes(WANT[sp][1]);
    assert.equal(familyPool(race, MONSTERS).includes(sp), high, `${sp}: 系統配合`);
    assert.equal(!!f.noFamily, !high, sp);
  }
});

// ───────────── 絵 ─────────────
test('絵: 新しい 絵 2しゅ・のこり 3しゅは 今の 絵の 色がえ。ボスは 2倍の こまかさ（artScale 0.5）で 見た目は 今までの ボスと おなじ 大きさ', () => {
  let fresh = 0;
  for (const sp of C7S_MINIONS) {
    const m = MONSTERS[sp];
    if (MONSTER_ART[sp]) fresh++;
    else assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえ`);
    assert.equal(monsterFine(sp), 1, `${sp}: 手下は 今までの こまかさ`);
  }
  assert.equal(fresh, 2, '新しい 絵は 3しゅ まで');
  for (const id of ['jugemu', 'fish_pirate', C7_REEF, C7_LIGHT]) {
    const d = MONSTER_ART[id];
    assert.ok(d && typeof d.draw === 'function', id);
    assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= 260), `${id}: size`);
    assert.ok(d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)) && new Set(d.pal).size === d.pal.length, `${id}: pal`);
    const pal = new Set(d.pal.map((c) => c.toLowerCase()));
    for (const f of [0, 1]) {
      const used = new Set();
      const g = {
        w: d.size[0], h: d.size[1], ell: (x, y, rx, ry, c) => used.add(c), poly: (p, c) => used.add(c), rect: (x, y, w, h, c) => used.add(c), line: (p, c) => used.add(c), dot: (x, y, c) => used.add(c),
        eye(x, y, r, look, white = '#ffffff', pupil = '#1a1026') { used.add(white); used.add(pupil); },
      };
      d.draw(g, f);
      for (const c of used) assert.ok(pal.has(c.toLowerCase()), `${id}: ${c}`);
    }
  }
  // ボス: え の size は 今までの ボス（ウツボ 100×92・オクタリア 112×124）の 2倍・artScale 0.5・見た目は おなじ くらい
  for (const id of [C7_REEF, C7_LIGHT]) {
    assert.equal(MONSTERS[id].artScale, 0.5, id);
    assert.equal(monsterFine(id), 2, id);
    assert.equal(MONSTER_ART[id].npc, 0.6, id);
    const [w, h] = monsterSize(id);
    assert.ok(w >= 96 && w <= 124 && h >= 90 && h <= 130, `${id}: 見た目 ${w}×${h}`);
    assert.deepEqual(MONSTER_ART[id].size, [w * 2, h * 2]);
  }
  // 今までの ボス・手下は そのまま
  assert.equal(monsterFine('c7_temple'), 1);
  assert.deepEqual(monsterSize('c7_temple'), MONSTER_ART.c7_temple.size);
});

// ───────────── ジョリーホック号 ─────────────
test('ジョリーホック号: 満ち潮の しるしが 1つずつ へり、のこり 1つで 次の 番に かならず いっせい砲げき（身を 守ると 半分）→ 引き潮で のり上げ', () => {
  const tc = MONSTERS[C7_REEF].c7s.tide;
  const b = bossBattle('reef');
  const s = b.enemies[0];
  assert.ok(s.c7tide && s.c7tide.phase === 'high');
  assert.equal(s.c7tide.left, tc.high);
  assert.equal(pub(s).c7tide, 1);
  for (let i = 0; i < tc.high - 1; i++) assert.ok(turn(b, s).c7sTide);
  assert.equal(s.c7tide.left, 1);
  // 動けない 番は 次へ
  turn(b, s, { type: 'incapacitated' });
  assert.equal(s.telegraph, null);
  turn(b, s);
  assert.equal(s.telegraph, BROADSIDE);
  s.telegraph = null;
  // いっせい砲げき: みんなに 当たる・守ると 半分くらい・そのあと のり上げ
  const hit = (guard) => {
    const bb = bossBattle('reef', 9);
    for (const x of bb.allies) x.defending = guard;
    const e = effect(bb, bb.enemies[0], BROADSIDE);
    assert.ok(e.c7sBroadside && e.c7sGround);
    assert.equal(bb.enemies[0].c7tide.phase, 'low');
    return dmgOf(e);
  };
  const open = hit(false), guarded = hit(true);
  assert.ok(open > 0 && guarded < open * 0.7, `${guarded} / ${open}`);
  effect(b, s, BROADSIDE);
  assert.ok(aground(s));
  assert.equal(s.c7tide.left, tc.low);
  assert.equal(pub(s).c7tide, 2);
  assert.equal(pub(s).aground, tc.aground);
});

test('ジョリーホック号: のり上げて いる 間は 受ける ダメージが aground ばい・たるが ころがる だけ → low 回めで うき上がる。2だんめは 砲げきが はやい', () => {
  const tc = MONSTERS[C7_REEF].c7s.tide;
  const b = bossBattle('reef');
  const s = b.enemies[0];
  const hero = b.allies[0];
  const hitShip = () => {
    const hp = s.hp;
    b.damage(hero, s, 1000, ev0(), { element: 'phys' });
    return hp - s.hp;
  };
  assert.equal(hitShip(), 1000);
  effect(b, s, BROADSIDE);
  assert.equal(hitShip(), Math.round(1000 * tc.aground));
  for (let i = 0; i < tc.low - 1; i++) {
    turn(b, s);
    assert.equal(s.telegraph, STUCK, 'のり上げて いる 間は たるが ころがる だけ');
    s.telegraph = null;
  }
  const ev = turn(b, s);
  assert.ok(ev.c7sTide?.float && s.c7tide.phase === 'high' && !s.telegraph);
  assert.equal(s.c7tide.left, tc.high);
  assert.equal(hitShip(), 1000);
  // 2だんめ
  s.hp = Math.floor(s.maxHp * 0.4);
  turn(b, s);
  assert.ok(s.c7tide.left <= tc.p2High - 1);
});

test('ジョリーホック号: 知っている 人は 砲げきの 前に 守り、のり上げの 間は いちばん 大きい 攻撃。ふつうの オートは HPが へっていれば よく 守る', () => {
  const b = bossBattle('reef');
  const s = b.enemies[0];
  b.knowsCh6 = true;
  const hero = b.allies[0];
  s.c7tide.left = 1;
  s.telegraph = BROADSIDE;
  assert.ok(broadsideBefore(b, hero, s));
  assert.deepEqual(c7sPlan(b, hero, decideAlly), { type: 'defend' });
  b.c6NoGuard = true;
  assert.notEqual(c7sPlan(b, hero, decideAlly)?.type, 'defend');
  b.c6NoGuard = false;
  s.telegraph = null;
  effect(b, s, BROADSIDE);
  for (const x of b.allies) Object.assign(x, { alive: true, hp: x.maxHp });
  assert.ok(!broadsideBefore(b, hero, s));
  const p = c7sPlan(b, hero, decideAlly);
  assert.ok(['attack', 'ability'].includes(p?.type) && p.target === s.id, JSON.stringify(p));
  // ふつうの オート
  const b2 = bossBattle('reef', 8);
  const s2 = b2.enemies[0];
  s2.c7tide.left = 1;
  s2.telegraph = BROADSIDE;
  const h2 = b2.allies[0];
  h2.hp = Math.round(h2.maxHp * 0.5);
  let guards = 0;
  for (let i = 0; i < 40; i++) if (c7sPlan(b2, h2, decideAlly)?.type === 'defend') guards++;
  assert.ok(guards > 10 && guards < 40, `守った ${guards}/40`);
  h2.hp = h2.maxHp;
  assert.equal(c7sPlan(b2, h2, decideAlly), null, `HPが ${AUTO_GUARD.hp} いじょうは 守らない`);
  // 落とす物
  assert.equal(monsterDrops(C7_REEF).filter((x) => x.kind === 'boss').length, 1);
});

// ───────────── ホック船長 ─────────────
test('ホック船長: every 回めに 板わたりの号令（1人が 板の上 … 動けない）→「手をのばす」で もどる・号令の しるしは 板の 上に 人が いる 間 すすまない', () => {
  const pc = MONSTERS[C7_LIGHT].c7s.plank;
  const b = bossBattle('light');
  const cap = b.enemies[0];
  assert.ok(cap.c7cap);
  assert.equal(cap.c7cap.left, pc.every);
  assert.equal(pub(cap).capEvery, pc.every);
  for (let i = 0; i < pc.every - 1; i++) turn(b, cap);
  assert.equal(cap.c7cap.left, 1);
  turn(b, cap);
  assert.equal(cap.telegraph, PLANK);
  cap.telegraph = null;
  const ev = effect(b, cap, PLANK);
  const who = b.get(ev.c7sPlank.who);
  assert.equal(who.status.rift?.kind, PLANK_KIND);
  assert.equal(plankWho(b, cap), who);
  assert.equal(pub(cap).plankWho, who.id);
  assert.equal(pub(who).trap, PLANK_KIND, 'まどに「板の上」');
  // 動けない（地われと おなじ。自分の 番は 板の 上で すくむ だけ）
  b.queue = [];
  b.onReady(who);
  assert.equal(b.queue.at(-1)?.cmd?.type, 'incapacitated');
  b.queue = [];
  const e2 = ev0();
  b.doIncapacitated(who, e2);
  assert.ok(e2.lines.join('').includes('板の上') && who.status.rift);
  // もう 1人は 板に のせない
  assert.ok(!effect(b, cap, PLANK).c7sPlank);
  // 手をのばす
  const helper = b.allies.find((x) => x !== who && x.alive);
  const e3 = ev0();
  reach(b, helper, { type: REACH, target: who.id }, e3);
  assert.ok(!who.status.rift && e3.c7sSave?.who === who.id && e3.lines.join('').includes('板の上から'));
  assert.equal(plankWho(b, cap), null);
});

test('ホック船長: 助けないと 次に 船長が 動いた ときに ドボン（戦えなくなる）＋ 大波（身を 守ると 半分）。合体技の よやくの 組を ねらって 手を ひきはなす', () => {
  const b = bossBattle('light');
  const cap = b.enemies[0];
  const who = b.get(effect(b, cap, PLANK).c7sPlank.who);
  turn(b, cap);
  assert.equal(cap.telegraph, DROP);
  assert.ok(fallBefore(b, b.allies.find((x) => x !== who), cap));
  cap.telegraph = null;
  const wave = (guard) => {
    const bb = bossBattle('light', 11);
    const cc = bb.enemies[0];
    const w = bb.get(effect(bb, cc, PLANK).c7sPlank.who);
    for (const x of bb.allies) if (x !== w) x.defending = guard;
    const e = effect(bb, cc, DROP);
    assert.ok(e.c7sFall?.who === w.id && !w.alive && !w.status.rift);
    return dmgOf(e);
  };
  const open = wave(false), guarded = wave(true);
  assert.ok(open > 0 && guarded < open * 0.7, `${guarded} / ${open}`);
  // 船長が たおれると 板の 上の 人は もどる
  const b2 = bossBattle('light', 5);
  const c2 = b2.enemies[0];
  const w2 = b2.get(effect(b2, c2, PLANK).c7sPlank.who);
  const e2 = ev0();
  b2.damage(b2.allies.find((x) => x !== w2), c2, c2.hp + 10, e2, { element: 'phys' });
  assert.ok(!c2.alive && w2.alive && !w2.status.rift);
  // 合体技の よやくの 組の 人を ねらう
  const b3 = bossBattle('light', 7);
  const c3 = b3.enemies[0];
  const [a0, a1] = b3.allies;
  a0.waitDual = { partners: [a1.id] };
  a1.dualTarget = a0.id;
  a1.dualHold = true;
  const e3 = effect(b3, c3, PLANK);
  assert.ok([a0.id, a1.id].includes(e3.c7sPlank.who) && e3.n1Torn === 1 && !a0.waitDual);
  // 2だんめ: 号令が はやく なる
  const b4 = bossBattle('light', 2);
  const c4 = b4.enemies[0];
  c4.hp = Math.floor(c4.maxHp * 0.4);
  turn(b4, c4);
  assert.ok(c4.c7cap.left <= MONSTERS[C7_LIGHT].c7s.plank.p2Every);
  assert.equal(pub(c4).p2, 1);
});

test('ホック船長: 知っている 人は 回復より 先に「手をのばす」。ふつうの オートも（回復の あとで）手をのばす', () => {
  const b = bossBattle('light');
  const cap = b.enemies[0];
  const who = b.get(effect(b, cap, PLANK).c7sPlank.who);
  const other = b.allies.find((x) => x !== who && x.kind !== 'guest');
  b.knowsCh6 = true;
  assert.deepEqual(c7sPlan(b, other, decideAlly), { type: REACH, target: who.id });
  // 回復が いる 時も 先に 手をのばす（とても あぶない 人が いる ときは 回復）
  const hurt = b.allies.find((x) => x !== who && x !== other);
  hurt.hp = Math.round(hurt.maxHp * 0.45);
  assert.deepEqual(c7sPlan(b, other, decideAlly), { type: REACH, target: who.id });
  hurt.hp = hurt.maxHp;
  // 板の 上の 人 本人は ふだん
  assert.equal(c7sPlan(b, who, decideAlly), null);
  // ふつうの オート（みんな 元気）: ai.js の reachPlan
  b.knowsCh6 = false;
  for (const x of b.allies) x.hp = x.maxHp;
  assert.equal(c7sPlan(b, other, decideAlly), null);
  assert.equal(decideAlly(b, other)?.type, REACH);
});

test('シミュレーター: 知っている 人・知らない 人・完全オートで 戦いが おわる（ボスの しかけが 動く）', () => {
  const r = ch7Run('reef', 74, true, 7070);
  assert.ok(['win', 'lose'].includes(r.outcome) && r.broadsides >= 1, JSON.stringify(r));
  const l = ch7Run('light', 76, true, 7070);
  assert.ok(['win', 'lose'].includes(l.outcome) && l.planks >= 1 && l.saves >= 1, JSON.stringify(l));
  const a = ch7Run('light', 76, false, 7071);
  assert.ok(['win', 'lose', 'timeout'].includes(a.outcome));
  for (const boss of ['reef', 'light']) for (const [job, list] of Object.entries(CH7_KIT[boss])) for (const id of list) if (id) assert.ok(ITEMS[id] && canEquip(job, id), `${job}: ${id}`);
});

// ───────────── カイ ─────────────
test('ゲストの カイ: 素早い 忍者・ブーメラン・しおかぜブーメラン（敵みんなを 2回）。酒場の カイは c7_kai から', () => {
  assert.ok(KAI_GUEST.id === 'guest_kai' && KAI_GUEST.name === 'カイ' && KAI_GUEST.job === 'ninja' && KAI_GUEST.minLevel === 72);
  assert.deepEqual(KAI_GUEST.skills, ['ky7_boomerang']);
  const sk = ABILITIES.ky7_boomerang;
  assert.ok(sk.target === 'enemies' && sk.effect.type === 'phys' && sk.effect.hits === 2 && sk.mp > 0);
  const c = makeNpcSupportChar({ ...KAI_GUEST }, 74);
  assert.equal(c.level, 74);
  assert.ok(c.hirameki.includes('ky7_boomerang'));
  for (const [slot, id] of Object.entries(KAI_GUEST.gear)) {
    assert.equal(c.equip[slot], id);
    assert.ok(ITEMS[id] && canEquip('ninja', id), id);
  }
  assert.equal(ITEMS[KAI_GUEST.gear.weapon].cat, 'boomerang');
  // 戦いの 中で しおかぜブーメラン
  const b = bossBattle('light');
  const k = b.allies.find((x) => x.name === 'カイ');
  assert.ok(k && k.abilities.includes('ky7_boomerang'));
  const ev = ev0();
  b.applyAbility(k, sk, {}, ev, 1);
  assert.ok(dmgOf(ev) > 0);
  assert.ok(KAI_SUPPORT.id === 'npc_kai' && KAI_SUPPORT.desc && KAI_SUPPORT.job === 'ninja' && KAI_SUPPORT.minLevel >= KAI_GUEST.minLevel);
});

// ───────────── 品 ─────────────
test('宝箱: 灯台 1〜8階に ★5の 装備 1つ（レア度4・src c7s）と 素材か 道具 1つ。上の 階ほど 強い', () => {
  const ks = Object.values(C7S_K);
  for (let i = 1; i < ks.length; i++) assert.ok(ks[i] > ks[i - 1]);
  assert.ok(C7S_K[1] > 1.62);
  const gear = Object.values(C7S_TREASURE).map((x) => x[0]);
  assert.equal(new Set(gear).size, 8);
  for (const id of gear) {
    const it = ITEMS[id];
    assert.ok(it === ITEMS_C7S[id] && it.rank === 10 && it.rarity === 4 && it.src === 'c7s', id);
    assert.ok(['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type), id);
    assert.equal(starsOf(id), 5, id);
    assert.equal(rareWhereText(id), 'しずむ前の島の灯台の宝箱でしか手に入らない');
    assert.ok(it.desc && C7S_ITEM_KANA[id] && ITEM_KANA[id], id);
    assert.ok(!(it.resist?.water < 1), `${id}: 水に 強い 装備は 作らない`);
  }
  for (const [n, [, mat]] of Object.entries(C7S_TREASURE)) {
    assert.ok(['mat', 'use'].includes(ITEMS[mat]?.type) && !ITEMS_C7S[mat], `${n}階: ${mat}（今の 素材・道具）`);
    assert.equal(C7S_TREASURE_N[n].length, 2);
    assert.equal(C7S_TREASURE_N[n][0], 1);
    assert.deepEqual(c7sChest(Number(n), 1), { item: mat, n: C7S_TREASURE_N[n][1] });
    assert.deepEqual(c7sChest(Number(n), 0), { item: C7S_TREASURE[n][0], n: 1 });
  }
  assert.equal(c7sChest(1, 2), null);
  assert.ok(ITEMS.c7st_beacon_sword.atk > ITEMS.c7t_temple_sword.atk);
});

test('ボスの 品・時をこえる手紙の ごほうび・島の 店', () => {
  for (const [boss, [acc, weapon]] of Object.entries(C7S_DROPS)) {
    const m = MONSTERS[boss];
    assert.deepEqual(m.drops.boss, [acc]);
    assert.equal(m.drops.rare[0], weapon);
    assert.ok(ITEMS[acc].unique && ITEMS[acc].type === 'acc' && ITEMS[acc].src === 'pastboss');
    assert.equal(ITEMS[weapon].rarity, 5);
  }
  const sum = (id) => Object.values(ITEMS[id].bonus).reduce((s, v) => s + v, 0);
  assert.ok(sum('c7l_hook_charm') > sum('c7r_anchor_charm') && sum('c7r_anchor_charm') > sum('c7t_witch_charm'));
  // 第8章 第3幕の 品（ITEMS_C8C。くろがねの大オノ）は のぞく
  const top = (cat) => Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === cat && !it.base && !id.includes('+') && !ITEMS_C8C[id] && !ITEMS_C8R[id]).sort((x, y) => y[1].atk - x[1].atk)[0][0];
  assert.equal(top('axe'), 'c7r_anchor_axe');
  assert.equal(top('claw'), 'c7l_gold_hook');
  for (const list of Object.values(C7S_LETTER_REWARDS)) {
    const [id] = list[0];
    assert.ok(ITEMS[id] && ITEMS[id].src === 'letter7' && starsOf(id) === 5, id);
    assert.equal(rareWhereText(id), '時をこえる手紙でしか手に入らない');
    for (const [mat] of list.slice(1)) assert.ok(['mat', 'use'].includes(ITEMS[mat]?.type), mat);
  }
  for (const id of [...C7S_SHOP_WEAPONS, ...C7S_SHOP_ARMOR]) assert.ok(ITEMS[id] && ITEMS[id].price > 0 && isShopItem(id) && starsOf(id) === 1, id);
  for (const id of C7S_SHOP_TOOLS) assert.ok(ITEMS[id], id);
  // 名前は かぶらない
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) if (!id.includes('+')) names.set(it.name, (names.get(it.name) || 0) + 1);
  for (const id of Object.keys(ITEMS_C7S)) assert.equal(names.get(ITEMS[id].name), 1, ITEMS[id].name);
});

// ───────────── 技の せつめい・エフェクト・がめん ─────────────
test('技の せつめい: 1文めだけで 何を するか わかる（スマホの たて持ちは 1文めだけ。30字くらいまで）', () => {
  for (const [id, a] of Object.entries(C7S_ABILITIES)) {
    const s = firstSentence(a.desc);
    assert.ok(s.endsWith('。') && s.length <= 32, `${id}: ${s}（${s.length}字）`);
  }
});

test('エフェクト: 技の anim は ぜんぶ ある・大技は がめんの まん中に 大きく・とくべつな つぶ', () => {
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(C7S_ABILITIES).map((a) => a.anim).filter((a) => /^a7[srly]_/.test(a)))];
  assert.ok(own.length >= 25, `${own.length}`);
  for (const a of own) {
    assert.equal(playC7sFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC7Fx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playTokei6Fx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
  }
  assert.equal(playC7sFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of [...C7S_SCREEN_ANIMS, ...Object.keys(C7S_ALLY_FX), ...Object.keys(C7S_SFX)]) assert.ok(own.includes(a), a);
  assert.ok(C7S_SCREEN_ANIMS.includes('a7r_broadside') && C7S_SCREEN_ANIMS.includes('a7l_drop'));
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  for (const t of [0, 0.3, 0.8, 0.99]) {
    C7S_FINE.c7sball(x, { x0: 250, y0: 20, x1: 100, y1: 80, size: 3, age: t * 500 }, t);
    C7S_FINE.c7swave(x, { x0: 300, x1: -80, y: 130, h: 80, w: 160, age: t * 1000 }, t);
  }
  assert.equal(C7_FINE.c7sball, C7S_FINE.c7sball);
  assert.equal(C7_FINE.c7swave, C7S_FINE.c7swave);
});

test('がめん: しおの しるし・のり上げ・板わたりの しるし・板の 上の 人・バナー', () => {
  for (const id of C7S_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  assert.equal(TRAP_LABEL.plank, '板の上');
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const scene = { time: 1000 };
  c7sDraw(scene, x, null, { alive: true, species: C7_REEF, c7tide: 1, c7tideLeft: 1, c7tideMax: 4 }, 100, 20, 110, 98, 1);
  const n1 = drawn.length;
  assert.ok(n1 > 10);
  c7sDraw(scene, x, null, { alive: true, species: C7_REEF, c7tide: 2, c7tideLeft: 2, c7tideMax: 3, aground: 1.5 }, 100, 20, 110, 98, 1);
  assert.ok(drawn.length > n1 + 10 && drawn.includes('fillText'));
  const n2 = drawn.length;
  c7sDraw(scene, x, null, { alive: true, species: C7_LIGHT, capLeft: 1, capEvery: 3 }, 100, 20, 112, 124, 1);
  assert.ok(drawn.length > n2);
  const n3 = drawn.length;
  c7sDraw(scene, x, null, { alive: true, species: C7_LIGHT, capLeft: 3, capEvery: 3, plankWho: 'a1', plankSteps: 1 }, 100, 20, 112, 124, 1);
  assert.ok(drawn.length > n3 + 5);
  const banners = [];
  const sc = { game: { audio: { sfx() {} } }, banner: (t, cls) => banners.push([t, cls]), shake() {}, c: new Map([['a1', { name: '勇者' }]]) };
  c7sPresent(sc, { c7sTide: { phase: 'high', left: 1 } }, {}, null, null);
  c7sPresent(sc, { c7sBroadside: { id: 'e1' } }, {}, null, null);
  c7sPresent(sc, { c7sGround: { k: 1.5 } }, {}, null, null);
  c7sPresent(sc, { c7sTide: { phase: 'high', left: 4, float: true } }, {}, null, null);
  c7sPresent(sc, { c7sCap: { left: 1 } }, {}, null, null);
  c7sPresent(sc, { c7sPlank: { who: 'a1' } }, {}, null, null);
  c7sPresent(sc, { c7sFall: { who: 'a1' } }, {}, null, null);
  assert.equal(banners.length, 7);
  assert.equal(banners[2][1], 'combo');
  assert.ok(banners[5][0].includes('勇者') && banners[5][0].includes('手をのばす'));
});

// ───────────── 文字 ─────────────
test('文字: 新しい ファイルは 小学校の 漢字（＋ ゆるした 字）・スペース なし', () => {
  const files = ['monsters-c7s.js', 'abilities-c7s.js', 'items-c7s.js', 'encounters-c7s.js', 'companions-c7s.js'].map((f) => `public/js/shared/data/${f}`)
    .concat(['public/js/shared/battle-c7s.js', 'public/js/client/battle-c7s.js']);
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    assert.deepEqual(checkFile(full), [], f);
  }
});

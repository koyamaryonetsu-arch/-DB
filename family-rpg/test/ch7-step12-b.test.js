// 第2部 第7章 第1幕（Step 1・2）B（戦い・品）「緑の王国」
// 名前の 約束（docs/plan-ch7.md の 3）・手下の 魔物 10しゅ（どれも 仲間に なる・ランク・まぜ配合）・出現表・
// ウツボきょうだい（2ひきで 1組: いきの しるしと 大うずしお・よびもどし）・オクタリア（声うばい・声の貝・大合唱・2だん）・
// 知っている 人と ふつうの オート・ゲストと 酒場の カリム・宝箱・ボスの 品・時をこえる手紙の ごほうび・店・絵・エフェクト・がめん・文字
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
import { MONSTER_FRIENDS, familyPool, mixPool, rankOf, JOIN_TIERS, joinTier } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { starsOf, rareWhereText, isShopItem } from '../public/js/shared/data/rare-loot.js';
import { GUESTS } from '../public/js/shared/data/shops.js';
import { canEquip } from '../public/js/shared/stats.js';
import { makeNpcSupportChar } from '../public/js/shared/world/party.js';
import { MONSTERS_C7, C7_GATE, C7_GATE_B, C7_TEMPLE, C7_SHELL, C7_MINIONS, C7_MAT_DROPS } from '../public/js/shared/data/monsters-c7.js';
import { C7_ABILITIES } from '../public/js/shared/data/abilities-c7.js';
import { FRIENDS_C7, KARIM_GUEST, KARIM_SUPPORT } from '../public/js/shared/data/companions-c7.js';
import { ENCOUNTERS_C7, FIXED_C7, ZONE_BG_C7 } from '../public/js/shared/data/encounters-c7.js';
import { ITEMS_C7, C7_TREASURE, C7_LETTER_REWARDS, C7_DROPS, C7_K, C7_ITEM_KANA, C7_SHOP_WEAPONS, C7_SHOP_ARMOR, C7_SHOP_TOOLS } from '../public/js/shared/data/items-c7.js';
import { TOKEI_TREASURE_HIGH } from '../public/js/shared/data/items-tokei.js';
import { SWIRL, CALL, STEAL, CHORUS, swirlBefore, chorusBefore, voicesOf, c7Plan, c7Effect } from '../public/js/shared/battle-c7.js';
import { AUTO_GUARD } from '../public/js/shared/battle-ch6.js';
import { towerTurnStart } from '../public/js/shared/battle-ch5.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ch7Run, ch7Party, karimChar, CH7_KIT, CH7_LV } from '../tools/sim-ch7.mjs';
import { rankPoints, BANDS } from '../tools/gen-monster-ranks.mjs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { playC7Fx, C7_FINE } from '../public/js/client/render/battlefx-c7.js';
import { playTokei6Fx } from '../public/js/client/render/battlefx-tokei6.js';
import { C7_SCREEN_ANIMS, C7_ALLY_FX, C7_SFX, C7_OWN_TELE, c7Draw, c7Present } from '../public/js/client/battle-c7.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

// ねらった ランク（docs/plan-r53-breed-more.md の 1 の 足りない 所）
const WANT = {
  nokonoko: ['dragon', 'F'], crow_messenger: ['demon', 'F'], pakkun: ['plant', 'E'], card_soldier: ['material', 'E'], uzu_eel: ['dragon', 'E'],
  march_broom: ['spirit', 'D'], gesso: ['slime', 'D'], teresa: ['undead', 'C'], water_youma: ['spirit', 'B'], curse_lump: ['undead', 'A'],
};
const ev0 = () => ({ lines: [], upd: [], results: [] });
const turn = (b, c, cmd = { type: 'ai' }) => {
  const ev = ev0();
  towerTurnStart(b, c, ev, cmd);
  return ev;
};
function bossBattle(boss, seed = 3, guest = true) {
  const party = ch7Party(boss, CH7_LV[boss]);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' }));
  if (guest) allies.push({ char: karimChar(CH7_LV[boss]), kind: 'guest', auto: true, tactics: 'balanced' });
  const enemies = FIXED_ENCOUNTERS[boss === 'gate' ? C7_GATE : C7_TEMPLE].group.flatMap(([sp, n]) => Array(n).fill(sp));
  return new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies });
}
const kill = (b, t) => {
  const ev = ev0();
  b.damage(b.allies[0], t, t.hp + 10, ev, { element: 'phys' });
  return ev;
};

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch7.md の 3）: c7_gate・c7_temple・t7_kingdom・t7_temple・C7_TREASURE・C7_LETTER_REWARDS・GUESTS.karim', () => {
  for (const id of [C7_GATE, C7_TEMPLE]) {
    const f = FIXED_ENCOUNTERS[id];
    assert.equal(f, FIXED_C7[id]);
    assert.ok(f.boss && f.canFlee === false && !f.loseOk && f.bgm === 'boss6', id);
    assert.equal(f.group[0][0], id, 'showMon と おなじ 魔物');
    assert.ok(MONSTERS[id] && MONSTER_ART[id], id);
  }
  assert.deepEqual(FIXED_C7.c7_gate.group, [[C7_GATE, 1, 1], [C7_GATE_B, 1, 1]]);
  assert.deepEqual(FIXED_C7.c7_temple.group, [[C7_TEMPLE, 1, 1], [C7_SHELL, 1, 1]]);
  assert.deepEqual(Object.keys(ENCOUNTERS_C7), ['t7_kingdom', 't7_temple']);
  for (const z of ['t7_kingdom', 't7_temple']) {
    assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C7[z]);
    assert.equal(ZONE_BG[z], ZONE_BG_C7[z]);
  }
  assert.deepEqual(Object.keys(C7_TREASURE).map(Number), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const list of Object.values(C7_TREASURE)) assert.equal(list.length, 2);
  assert.ok(C7_LETTER_REWARDS.length >= 3 && C7_LETTER_REWARDS.length <= 4);
  assert.equal(GUESTS.karim, KARIM_GUEST);
  assert.equal(MONSTERS[C7_TEMPLE].name, 'オクタリア');
});

// ───────────── 手下の 魔物 ─────────────
test('手下の 魔物 10しゅ: どれも 仲間に なる・ねらった 系統と ランク（足りない 所）・出現表に 出る・Lv68〜72', () => {
  assert.deepEqual(C7_MINIONS.slice().sort(), Object.keys(WANT).sort());
  const zoneOf = (sp) => Object.entries(ENCOUNTERS_C7).filter(([, t]) => t.some((e) => e.group.some((g) => g[0] === sp))).map(([z]) => z);
  for (const [sp, [race, rank]] of Object.entries(WANT)) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.equal(m, MONSTERS_C7[sp]);
    assert.equal(f, FRIENDS_C7[sp]);
    assert.equal(m.race, race, sp);
    assert.ok(f.rate > 0 && !f.breedOnly && joinTier(sp), `${sp}: 仲間に なる`);
    assert.equal(MONSTER_RANKS[sp], rank, `${sp}: ランクの 表`);
    assert.equal(rankOf(sp, MONSTERS), rank, sp);
    assert.equal(rankPoints(sp).rank, rank, `${sp}: gen-monster-ranks と おなじ`);
    assert.equal(rankPoints(sp).band, '第7章');
    assert.ok(m.lv >= 68 && m.lv <= 72, sp);
    assert.ok(zoneOf(sp).length >= 1, `${sp}: 出現表`);
    assert.ok(!m.boss && m.desc && f.note && f.names.length === 4, sp);
    assert.ok(MAT_DROPS[sp] && C7_MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]], sp);
    // 力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok((sum >= 5.8 && sum <= 6.1) || (sum >= 6.8 && sum <= 7.3), `${sp}: growth ${sum.toFixed(2)}`);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id] && !['c7Swirl', 'c7Call', 'c7Steal', 'c7Chorus', 'callHelp'].includes(ABILITIES[id].effect.type), `${sp}: ${id}`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
  }
  assert.ok(BANDS.includes('第7章'));
  // 第7章の 中で F〜C が いて、B〜S は 2しゅ まで
  const ranks = Object.values(WANT).map(([, r]) => r);
  for (const r of ['F', 'E', 'D', 'C']) assert.ok(ranks.includes(r), r);
  assert.equal(ranks.filter((r) => ['B', 'A', 'S'].includes(r)).length, 2);
});

test('配合: 10しゅ みんな 系統まぜ配合（mix）の 子・系統配合の 子は B・A だけ（はじめの ころの 親から Lv68 が 生まれない）', () => {
  for (const sp of C7_MINIONS) {
    const f = FRIENDS_C7[sp], race = MONSTERS[sp].race;
    assert.ok(Array.isArray(f.mix) && f.mix.length >= 1, sp);
    for (const other of f.mix) assert.ok(mixPool(race, other, MONSTERS).includes(sp), `${sp}: ${race}+${other}`);
    const high = ['B', 'A'].includes(WANT[sp][1]);
    assert.equal(familyPool(race, MONSTERS).includes(sp), high, `${sp}: 系統配合`);
    assert.equal(!!f.noFamily, !high, sp);
  }
});

test('絵: 新しい 絵 5しゅ・のこり 5しゅは 今の 絵の 色がえ・ボス（大きい）と 声の貝', () => {
  let fresh = 0;
  for (const sp of C7_MINIONS) {
    const m = MONSTERS[sp];
    if (MONSTER_ART[sp]) fresh++;
    else assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえ`);
  }
  assert.equal(fresh, 5, '新しい 絵は 半分まで');
  for (const id of ['nokonoko', 'pakkun', 'card_soldier', 'march_broom', 'gesso', C7_GATE, C7_TEMPLE, C7_SHELL]) {
    const d = MONSTER_ART[id];
    assert.ok(d && typeof d.draw === 'function', id);
    assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= 130), `${id}: size`);
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
  assert.equal(MONSTER_ART[C7_GATE].npc, 0.6);
  assert.equal(MONSTER_ART[C7_TEMPLE].npc, 0.6);
  assert.equal(MONSTERS[C7_GATE_B].art, C7_GATE);
});

// ───────────── ウツボきょうだい ─────────────
test('ウツボきょうだい: いきの しるしが 1つずつ へり、のこり 1つで 次の 番に かならず 大うずしお（身を 守ると 半分）→ また いっぱい', () => {
  const b = bossBattle('gate');
  const [a, d] = b.enemies;
  assert.ok(a.twin && d.twin && b.c7twin);
  const max = b.c7twin.max;
  assert.equal(max, MONSTERS[C7_GATE].c7.twin.sync);
  assert.equal(pub(a).twinLeft, max);
  for (let i = 0; i < max - 1; i++) turn(b, i % 2 ? d : a);
  assert.equal(b.c7twin.left, 1);
  assert.equal(pub(d).twinLeft, 1);
  const ev = turn(b, a);
  assert.equal(a.telegraph, SWIRL);
  void ev;
  // 動けない 番は 次へ（しるしは へらない）
  const b2 = bossBattle('gate', 5);
  b2.c7twin.left = 1;
  turn(b2, b2.enemies[1], { type: 'incapacitated' });
  assert.equal(b2.enemies[1].telegraph, null);
  assert.equal(b2.c7twin.left, 1);
  // 大うずしお: みんなに 当たる・守ると 半分くらい
  const hit = (guard) => {
    const bb = bossBattle('gate', 9);
    for (const x of bb.allies) x.defending = guard;
    const e = ev0();
    c7Effect(bb, bb.enemies[0], ABILITIES[SWIRL], ABILITIES[SWIRL].effect, e);
    assert.ok(e.c7Swirl && bb.c7twin.left === bb.c7twin.max);
    return (e.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
  };
  const open = hit(false), guarded = hit(true);
  assert.ok(open > 0 && guarded < open * 0.7, `${guarded} / ${open}`);
  // 1ぴきでは うずしおが おこらない
  const b3 = bossBattle('gate', 11);
  kill(b3, b3.enemies[1]);
  const e3 = ev0();
  c7Effect(b3, b3.enemies[0], ABILITIES[SWIRL], ABILITIES[SWIRL].effect, e3);
  assert.ok(!e3.c7Swirl);
});

test('ウツボきょうだい: かたほうが たおれると、もう かたほうが call 回めの 行動で よびもどす（HP・攻撃力↑）。その 前に たおせば 勝ち', () => {
  const tc = MONSTERS[C7_GATE].c7.twin;
  const b = bossBattle('gate');
  const [a, d] = b.enemies;
  const ev = kill(b, a);
  assert.ok(!a.alive && ev.c7Down && ev.c7Down.partner === d.id);
  assert.equal(d.twin.call, tc.call);
  assert.equal(pub(d).callLeft, tc.call);
  for (let i = 0; i < tc.call - 1; i++) assert.ok(turn(b, d).c7CallLeft);
  assert.equal(d.twin.call, 1);
  turn(b, d);
  assert.equal(d.telegraph, CALL);
  // 1ぴきの 間は 大うずしおの しるしは すすまない
  const left = b.c7twin.left;
  const atk = d.atk;
  const killed = b.killed.length;
  const e2 = ev0();
  c7Effect(b, d, ABILITIES[CALL], ABILITIES[CALL].effect, e2);
  assert.ok(a.alive && e2.c7Call);
  assert.equal(a.hp, Math.round(a.maxHp * tc.callHp));
  assert.ok(d.atk > atk && d.twin.rage === 1);
  assert.equal(b.killed.length, killed - 1, '経験値は 1回 だけ');
  assert.equal(b.c7twin.left, left);
  // その 前に 2ひきめも たおす: 勝ち
  const b2 = bossBattle('gate', 4);
  kill(b2, b2.enemies[0]);
  kill(b2, b2.enemies[1]);
  b2.checkEnd();
  assert.equal(b2.pendingEnd?.outcome, 'win');
  // 落とす物は 兄に まとめる
  assert.equal(monsterDrops(C7_GATE).filter((x) => x.kind === 'boss').length, 1);
  assert.equal(MONSTERS[C7_GATE_B].exp, 0);
});

test('ウツボきょうだい: 知っている 人は 大うずしおの 前に 守り、HP の 多い ほうを ねらう。ふつうの オートは HPが へっていれば よく 守る', () => {
  const b = bossBattle('gate');
  const [a, d] = b.enemies;
  b.knowsCh6 = true;
  const hero = b.allies[0];
  b.c7twin.left = 1;
  a.telegraph = SWIRL;
  assert.ok(swirlBefore(b, hero));
  assert.deepEqual(c7Plan(b, hero, decideAlly), { type: 'defend' });
  // 守らない 人
  b.c6NoGuard = true;
  assert.notEqual(c7Plan(b, hero, decideAlly)?.type, 'defend');
  b.c6NoGuard = false;
  // ねらいわけ
  a.telegraph = null;
  b.c7twin.left = b.c7twin.max;
  a.hp = Math.round(a.maxHp * 0.3);
  const p = c7Plan(b, hero, decideAlly);
  const pt = p?.target && b.get(p.target);
  if (pt?.twin) assert.equal(pt.id, d.id, 'HP の 多い ほう');
  // ふつうの オート
  const b2 = bossBattle('gate', 8);
  b2.c7twin.left = 1;
  b2.enemies[0].telegraph = SWIRL;
  const h2 = b2.allies[0];
  h2.hp = Math.round(h2.maxHp * 0.5);
  let guards = 0;
  for (let i = 0; i < 40; i++) if (c7Plan(b2, h2, decideAlly)?.type === 'defend') guards++;
  assert.ok(guards > 10 && guards < 40, `守った ${guards}/40`);
  h2.hp = h2.maxHp;
  assert.equal(c7Plan(b2, h2, decideAlly), null, `HPが ${AUTO_GUARD.hp} いじょうは 守らない`);
});

// ───────────── オクタリア ─────────────
test('オクタリア: every 回めに 声うばいの歌（呪文の 多い 人・マホトーン）。声が たまると 大合唱（声が 多いほど 強い）', () => {
  const wc = MONSTERS[C7_TEMPLE].c7.witch;
  const b = bossBattle('temple');
  const w = b.enemies.find((e) => e.witch);
  const shell = b.enemies.find((e) => e.species === C7_SHELL);
  assert.ok(w && shell && shell.c7w === w.witch);
  assert.equal(w.witch.left, wc.every);
  for (let i = 0; i < wc.every - 1; i++) turn(b, w);
  assert.equal(w.witch.left, 1);
  turn(b, w);
  assert.equal(w.telegraph, STEAL);
  w.telegraph = null;
  const e = ev0();
  c7Effect(b, w, ABILITIES[STEAL], ABILITIES[STEAL].effect, e);
  const who = b.get(e.c7Steal.who);
  assert.ok(who.status.silence?.voice, '声が うばわれた');
  assert.ok(['大賢者', '大神官'].includes(who.name), `呪文の 多い 人: ${who.name}`);
  assert.equal(voicesOf(b, w), 1);
  assert.equal(pub(shell).voices, 1);
  c7Effect(b, w, ABILITIES[STEAL], ABILITIES[STEAL].effect, ev0());
  assert.equal(voicesOf(b, w), 2);
  // 2つ たまった: 次は 大合唱
  w.witch.left = 1;
  turn(b, w);
  assert.equal(w.telegraph, CHORUS);
  assert.equal(pub(w).chorus, 1);
  // 大合唱の 強さ: 声が 多いほど
  const dmg = (n) => {
    const bb = bossBattle('temple', 21);
    const ww = bb.enemies.find((x) => x.witch);
    const ids = bb.allies.slice(0, n).map((x) => x.id);
    for (const id of ids) bb.get(id).status.silence = { turns: 99, voice: true };
    ww.witch.voices = ids;
    const ee = ev0();
    c7Effect(bb, ww, ABILITIES[CHORUS], ABILITIES[CHORUS].effect, ee);
    assert.ok(ee.c7Chorus);
    return (ee.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
  };
  assert.ok(dmg(3) > dmg(1) * 1.2);
  // ほかの 方法で 声を とりもどすと 数えない
  who.status.silence = undefined;
  delete who.status.silence;
  assert.equal(voicesOf(b, w), 1);
});

test('オクタリア: 声の貝を こわすと 声が もどり、魔女は よろめく（前ぶれも とりやめ）。regrow 回 動くと また できる。2だんめは はやい', () => {
  const wc = MONSTERS[C7_TEMPLE].c7.witch;
  const b = bossBattle('temple');
  const w = b.enemies.find((e) => e.witch);
  const shell = b.enemies.find((e) => e.species === C7_SHELL);
  c7Effect(b, w, ABILITIES[STEAL], ABILITIES[STEAL].effect, ev0());
  const who = b.allies.find((x) => x.status.silence?.voice);
  w.telegraph = CHORUS;
  w.atb = 80;
  const ev = kill(b, shell);
  assert.ok(ev.c7Break && ev.c7Break.back.includes(who.id));
  assert.ok(!who.status.silence, '声が もどった');
  assert.equal(w.telegraph, null);
  assert.equal(w.atb, 0);
  assert.equal(w.debuffs.def.mult, wc.stagger);
  assert.equal(w.witch.down, wc.regrow);
  assert.equal(pub(w).shellDown, wc.regrow);
  // 貝が ない 間は 声を うばえない
  w.witch.left = 1;
  for (let i = 0; i < wc.regrow - 1; i++) {
    turn(b, w);
    assert.equal(w.telegraph, null);
    assert.ok(!shell.alive);
  }
  const e2 = turn(b, w);
  assert.ok(shell.alive && e2.c7Regrow && shell.hp === shell.maxHp);
  // 2だんめ: 声うばいが はやく なる
  w.hp = Math.floor(w.maxHp * 0.4);
  w.witch.left = wc.every;
  turn(b, w);
  assert.ok(w.witch.left <= wc.p2Every);
  assert.equal(pub(w).p2, 1);
  // オクタリアが たおれると 貝も 消える
  assert.deepEqual(MONSTERS[C7_TEMPLE].minionsFall, [C7_SHELL]);
  // 声の貝は 数えない
  assert.ok(!Object.keys(MONSTERS).includes(C7_SHELL) && MONSTERS[C7_SHELL].noBefriend);
});

test('オクタリア: 知っている 人は 声が 貝に 入ったら 貝を こわす・大合唱の 前に 守る。ふつうの オートは HPが へっていれば よく 守る', () => {
  const b = bossBattle('temple');
  const w = b.enemies.find((e) => e.witch);
  const shell = b.enemies.find((e) => e.species === C7_SHELL);
  b.knowsCh6 = true;
  const god = b.allies.find((x) => x.name === 'ゴッドハンド');
  assert.equal(c7Plan(b, god, decideAlly)?.target === shell.id, false, '声が ない 間は ふだん');
  c7Effect(b, w, ABILITIES[STEAL], ABILITIES[STEAL].effect, ev0());
  assert.equal(c7Plan(b, god, decideAlly)?.target, shell.id);
  b.c7NoShell = true;
  assert.notEqual(c7Plan(b, god, decideAlly)?.target, shell.id);
  b.c7NoShell = false;
  // 大合唱の 前で、こわせない ときは 守る
  c7Effect(b, w, ABILITIES[STEAL], ABILITIES[STEAL].effect, ev0());
  w.telegraph = CHORUS;
  assert.ok(chorusBefore(b, god, w));
  shell.hp = shell.maxHp * 10;
  assert.deepEqual(c7Plan(b, god, decideAlly), { type: 'defend' });
  shell.hp = 1;
  assert.equal(c7Plan(b, god, decideAlly)?.target, shell.id, '1回で こわせる なら こわす');
  // ふつうの オート
  b.knowsCh6 = false;
  god.hp = Math.round(god.maxHp * 0.5);
  let guards = 0;
  for (let i = 0; i < 40; i++) if (c7Plan(b, god, decideAlly)?.type === 'defend') guards++;
  assert.ok(guards > 10 && guards < 40, `守った ${guards}/40`);
});

test('シミュレーター: 知っている 人・知らない 人・完全オートで 戦いが おわる（ボスの しかけが 動く）', () => {
  const g = ch7Run('gate', 70, true, 7070);
  assert.ok(['win', 'lose'].includes(g.outcome) && g.swirls >= 1, JSON.stringify(g));
  const t = ch7Run('temple', 72, true, 7070);
  assert.ok(['win', 'lose'].includes(t.outcome) && t.steals >= 1 && t.breaks >= 1, JSON.stringify(t));
  const a = ch7Run('temple', 72, false, 7071);
  assert.ok(['win', 'lose'].includes(a.outcome));
  for (const k of Object.values(CH7_KIT)) for (const [job, list] of Object.entries(k)) for (const id of list) if (id) assert.ok(ITEMS[id] && canEquip(job, id), `${job}: ${id}`);
});

// ───────────── カリム ─────────────
test('ゲストの カリム: ガーディアン・たて・王家のたて（守りの 技）。酒場の カリムは c7_karim から', () => {
  assert.ok(KARIM_GUEST.id === 'guest_karim' && KARIM_GUEST.name === 'カリム' && KARIM_GUEST.job === 'guardian' && KARIM_GUEST.minLevel === 68);
  assert.deepEqual(KARIM_GUEST.skills, ['kr7_shield']);
  const sk = ABILITIES.kr7_shield;
  assert.ok(sk.target === 'allies' && sk.effect.type === 'buff' && sk.effect.stat === 'def' && sk.mp > 0);
  const c = makeNpcSupportChar({ ...KARIM_GUEST }, 70);
  assert.equal(c.level, 70);
  assert.ok(c.hirameki.includes('kr7_shield'));
  for (const [slot, id] of Object.entries(KARIM_GUEST.gear)) {
    assert.equal(c.equip[slot], id);
    assert.ok(ITEMS[id] && canEquip('guardian', id), id);
  }
  assert.equal(ITEMS[KARIM_GUEST.gear.shield].type, 'shield');
  // 戦いの 中で 王家のたて
  const b = bossBattle('gate');
  const k = b.allies.find((x) => x.name === 'カリム');
  assert.ok(k && k.abilities.includes('kr7_shield'));
  const ev = ev0();
  b.applyAbility(k, sk, {}, ev, 1);
  assert.ok(b.allies.filter((x) => x.buffs.def).length >= 4);
  // 酒場
  assert.ok(KARIM_SUPPORT.id === 'npc_karim' && KARIM_SUPPORT.unlock === 'c7_karim' && KARIM_SUPPORT.desc && KARIM_SUPPORT.job === 'guardian');
});

// ───────────── 品 ─────────────
test('宝箱: 神殿 1〜8階に 2つずつ ★5（レア度4・src c7）。上の 階ほど 強く、時計塔 10階より 少し 上', () => {
  const ks = Object.values(C7_K);
  for (let i = 1; i < ks.length; i++) assert.ok(ks[i] > ks[i - 1]);
  assert.ok(C7_K[1] > 1.54);
  const all = Object.values(C7_TREASURE).flat();
  assert.equal(new Set(all).size, 16);
  for (const id of all) {
    const it = ITEMS[id];
    assert.ok(it === ITEMS_C7[id] && it.rank === 10 && it.rarity === 4 && it.src === 'c7', id);
    assert.equal(starsOf(id), 5, id);
    assert.equal(rareWhereText(id), 'みどりの水の神殿の宝箱でしか手に入らない');
    assert.ok(it.desc && C7_ITEM_KANA[id] && ITEM_KANA[id], id);
  }
  assert.ok(ITEMS.c7t_temple_sword.atk > ITEMS[TOKEI_TREASURE_HIGH[10][1]].atk);
});

test('ボスの 品・時をこえる手紙の ごほうび・緑の王国の 店', () => {
  for (const [boss, [acc, weapon]] of Object.entries(C7_DROPS)) {
    const m = MONSTERS[boss];
    assert.deepEqual(m.drops.boss, [acc]);
    assert.equal(m.drops.rare[0], weapon);
    assert.ok(ITEMS[acc].unique && ITEMS[acc].type === 'acc' && ITEMS[acc].src === 'pastboss');
    assert.equal(ITEMS[weapon].rarity, 5);
  }
  const sum = (id) => Object.values(ITEMS[id].bonus).reduce((s, v) => s + v, 0);
  assert.ok(sum('c7t_witch_charm') > sum('c7g_twin_charm') && sum('c7g_twin_charm') > sum('p6z_zenmai_charm'));
  const topSpear = Object.entries(ITEMS).filter(([, it]) => it.type === 'weapon' && it.cat === 'spear' && !it.base).sort((x, y) => y[1].atk - x[1].atk)[0][0];
  assert.equal(topSpear, 'c7t_trident');
  for (const id of C7_LETTER_REWARDS) {
    assert.ok(ITEMS[id] && ITEMS[id].src === 'letter7' && starsOf(id) === 5, id);
    assert.equal(rareWhereText(id), '時をこえる手紙でしか手に入らない');
  }
  for (const id of [...C7_SHOP_WEAPONS, ...C7_SHOP_ARMOR]) {
    assert.ok(ITEMS[id] && ITEMS[id].price > 0 && isShopItem(id) && starsOf(id) === 1, id);
  }
  for (const id of C7_SHOP_TOOLS) assert.ok(ITEMS[id], id);
  // 名前は かぶらない
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) if (!id.includes('+')) names.set(it.name, (names.get(it.name) || 0) + 1);
  for (const id of Object.keys(ITEMS_C7)) assert.equal(names.get(ITEMS[id].name), 1, ITEMS[id].name);
});

// ───────────── エフェクト・がめん ─────────────
test('エフェクト: 技の anim は ぜんぶ ある・大技は がめんの まん中に 大きく・とくべつな つぶ', () => {
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(C7_ABILITIES).map((a) => a.anim).filter((a) => a.startsWith('a7')))];
  assert.ok(own.length >= 25);
  for (const a of own) {
    assert.equal(playC7Fx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playTokei6Fx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
  }
  assert.equal(playC7Fx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of [...C7_SCREEN_ANIMS, ...Object.keys(C7_ALLY_FX), ...Object.keys(C7_SFX)]) assert.ok(own.includes(a), a);
  assert.ok(C7_SCREEN_ANIMS.includes('a7g_swirl') && C7_SCREEN_ANIMS.includes('a7t_chorus'));
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  for (const t of [0, 0.3, 0.8, 0.99]) C7_FINE.c7whirl(x, { x: 100, y: 50, r: 60, age: t * 1000 }, t);
  C7_FINE.c7note(x, { x: 1, y: 1, size: 3, color: '#ffffff' }, 0.5);
});

test('がめん: いきの しるし・よびもどし・声うばいの しるし・声の たま・バナー', () => {
  for (const id of C7_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const scene = { time: 1000 };
  c7Draw(scene, x, null, { alive: true, species: C7_GATE, twin: 1, twinLeft: 1, twinMax: 6 }, 100, 20, 100, 90, 1);
  const n1 = drawn.length;
  assert.ok(n1 > 20);
  c7Draw(scene, x, null, { alive: true, species: C7_GATE_B, twin: 1, callLeft: 2, twinLeft: 3, twinMax: 6 }, 100, 20, 100, 90, 1);
  assert.ok(drawn.length > n1);
  const n2 = drawn.length;
  c7Draw(scene, x, null, { alive: true, witchLeft: 1, witchEvery: 3, chorus: 1 }, 100, 20, 110, 120, 1);
  c7Draw(scene, x, null, { alive: true, c7shell: 1, voices: 2 }, 40, 60, 30, 26, 1);
  assert.ok(drawn.length > n2 + 10);
  const banners = [];
  const sc = { game: { audio: { sfx() {} } }, banner: (t, cls) => banners.push([t, cls]), shake() {} };
  c7Present(sc, { c7Sync: { left: 1 } }, {}, null, null);
  c7Present(sc, { c7Swirl: { id: 'e1' } }, {}, null, null);
  c7Present(sc, { c7Down: { call: 4 } }, {}, null, null);
  c7Present(sc, { c7Call: { id: 'e1' } }, {}, null, null);
  c7Present(sc, { c7Witch: { left: 1, chorus: true } }, {}, null, null);
  c7Present(sc, { c7Steal: { who: 'a1' } }, {}, null, null);
  c7Present(sc, { c7Chorus: { voices: 2 } }, {}, null, null);
  c7Present(sc, { c7Break: { back: ['a1'] } }, {}, null, null);
  c7Present(sc, { c7Regrow: { id: 'e1' } }, {}, null, null);
  assert.equal(banners.length, 9);
  assert.equal(banners[7][1], 'combo');
});

// ───────────── 文字 ─────────────
test('文字: 新しい ファイルは 小学校の 漢字（＋ ゆるした 字）・スペース なし・ひらがなの まま なし', () => {
  const files = ['monsters-c7.js', 'abilities-c7.js', 'items-c7.js', 'encounters-c7.js', 'companions-c7.js'].map((f) => `public/js/shared/data/${f}`)
    .concat(['public/js/shared/battle-c7.js', 'public/js/client/battle-c7.js']);
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    assert.deepEqual(checkFile(full), [], f);
  }
  void JOIN_TIERS;
});

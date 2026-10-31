// 第2部 第6章 Step 6「時計塔の心臓」の 戦いの しかけ（battle-ch6.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・影の時計師ゼンマイ（monsters-tokei6.js の ch6.kind 'zen'。10階の ボス）
//   1だんめ … 家来の しかけを じゅんばんに 使う（zen.order: 砂が落ちきる → まきもどし → 時のふりこ → 時のかね）。
//     しかけの 中みは 今の まま（battle-ch6.js の sand・gear、battle-road.js の pend、battle-tokei.js の bell）。
//     ゼンマイの c.c6 に「今の しかけ だけ」の 数を おいて、c.sand など を 1つずつ 作る（confOf が c.c6 を 先に 見る）。
//     しかけが 1回 おわる（大砂流・氷で 止めた／まきもどし・雷で こわした／大ふりこ／時のかね）と、次の しかけへ
//   2だんめ（HP が zen.p2At より へる。battle.js の checkPhase から tokei6Phase）… まわりに 歯車 3つ（べつの 敵。弱点が 氷・雷・光）。
//     文字ばんの 針（zen.hand）が、ゼンマイが 1回 動く たびに 1時間 進む（動けない 番も）。12時に なった 番は かならず「時の大ほうかい」
//     （みんなに とても 大きな 物理の 一撃。身を 守ると 半分）→ 針は hand.start（はじめの 時）に もどる。
//     歯車を こわすと 針が hand.back 時間 もどる（hand.start より 前には もどらない）。こわれた 歯車は、ゼンマイが hand.revive 回 動くと また 回り出す
// ・知っている 人（シミュレーター。b.knowsCh6）: 1だんめは 家来の ときと おなじ（battle-ch6.js の ch6Plan が そのまま 見る）。
//   2だんめは 針が 10時を こえたら 歯車を 弱点で こわす（こわせない なら、大ほうかいが 自分の 番より 先なら 身を 守る）。b.c6NoGear … しない 人
// ・ふつうの オート: 大ほうかいが 自分の 番より 先に 来る とき、HPが へっていれば よく 身を 守る（battle-ch6.js の AUTO_GUARD）
// ・リオンの けいこ（person: 'rion'）… 見た目を リオン（data/companions-tokei.js の RION_GUEST）に する（がめんは 人の 絵）
// ・時のまぼろし（base … もとの ボス）… しかけは もとの まま。がめんと 技の 名前は もとの ボスで 見る（c.base）
import { MONSTERS } from './data/monsters.js?v=7033f2971814';
import { ABILITIES } from './data/abilities.js?v=7033f2971814';
import { ZEN_GEARS } from './data/monsters-tokei6.js?v=7033f2971814';
import { RION_GUEST } from './data/companions-tokei.js?v=7033f2971814';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate, pub } from './battle.js?v=7033f2971814';
import { canUse } from './ai.js?v=7033f2971814';
import { applyTimes } from './battle-road.js?v=7033f2971814';

export const COLLAPSE = 'm6z_zm_collapse';
// しかけの おわりの 技（前ぶれ → 大技）。ID は battle-ch6.js・battle-road.js・battle-tokei.js と おなじ
const FALL_CHARGE = 'm6_sc_fall_charge';
const FALL = 'm6_sc_fall';
const RECORD = 'm6_gd_record';
const SWING_CHARGE = 'm6_pd_big_charge';
const SWING = 'm6_pd_big';
const STAGE_TELE = new Set([FALL_CHARGE, FALL, RECORD, 'm6_gd_rewind', 'm6_pd_stop_charge', 'm6_pd_stop', SWING_CHARGE, SWING, 'm6t_cr_bell']);
const ARM = { sand: FALL_CHARGE, pend: SWING_CHARGE };
const FIN = { sand: FALL, pend: SWING };
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});

export const zenConf = (m) => MONSTERS[m?.species]?.ch6?.zen || null;
export const isZenGear = (m) => !!MONSTERS[m?.species]?.zenGear;
const handOf = (c) => ({ start: 1, max: 12, back: 3, revive: 6, warn: 10, ...(zenConf(c)?.hand || {}) });

// しかけごとの はじめの ことば（家来の 名前で、何を すれば よいか 分かる ように）
const STAGE_INTRO = {
  sand: ['{a}のうしろに、大きな砂時計がうかび上がった…！', '（サンドクロックの力…！砂が落ちきると大砂流。氷でこおらせよう！）'],
  gear: ['{a}のむねで、大きな歯車が、ギリギリと回り始めた…！', '（ギアドンの力…！時を覚えたら、雷を2回当てて歯車をこわそう！）'],
  pend: ['{a}のうしろで、大きなふりこが、ゆれ始めた…！', '（ペンデュラの力…！ねらわれた人と、大ふりこの前は、身を守ろう！）'],
  bell: ['{a}の頭の上に、大きなかねがあらわれた…！', '（カリヨンの力…！かねが鳴る前に、身を守ろう！）'],
};
const fmt = (s, c) => s.replaceAll('{a}', c.name);

// ───────────── はじめ（battle-ch6.js の setupCh6 の さいご）─────────────
export function setupTokei6(b) {
  const lines = [];
  for (const e of b.enemies) {
    const m = MONSTERS[e.species];
    if (!m) continue;
    // 時のまぼろし（もとの ボス）
    if (m.base) e.base = m.base;
    // リオンの けいこ: 人の すがた
    if (m.person === 'rion') {
      e.person = 'rion';
      e.look = RION_GUEST.look;
      e.job = RION_GUEST.job;
    }
    const zc = zenConf(e);
    if (zc) {
      e.zen = { phase: 1, idx: 0, st: null, armed: false, fire: false, recSeen: false, hand: 0, down: {}, collapses: 0, breaks: 0 };
      e.c6 = { kind: 'zen' };
      lines.push(`${e.name}は、大きな時計の針を、しずかにかまえた…！`, '（家来たちの力を、じゅんばんに使ってくるようだ…！）');
      startStage(b, e, zc.order[0], lines);
    }
  }
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1300 });
}

// しかけを 1つ はじめる（c.c6 に その しかけの 数だけ。じょうたいは 家来と おなじ 形）
function startStage(b, c, st, lines) {
  const z = c.zen;
  const conf = zenConf(c).stages[st] || {};
  Object.assign(z, { st, armed: false, fire: false, recSeen: false });
  c.c6 = { kind: 'zen', [st]: conf };
  if (st === 'sand') c.sand = { lv: conf.max ?? 3, max: conf.max ?? 3, fast: false };
  if (st === 'gear') c.gear = { count: 0, rec: null, left: 0, hits: 0, fast: false };
  if (st === 'pend') {
    c.pend = { pos: -(conf.reach ?? 2), dir: 1, reach: conf.reach ?? 2, target: null, frozen: [] };
    applyTimes(b, c);
  }
  if (st === 'bell') c.bell = { left: conf.every ?? 4, max: conf.every ?? 4, rings: 0 };
  lines.push(...(STAGE_INTRO[st] || []).map((s) => fmt(s, c)));
}

// しかけを おえる（止まっている 人は 動き出す・ゲージの 速さも もとに）
function endStage(b, c, ev) {
  delete c.sand;
  delete c.gear;
  delete c.bell;
  if (c.pend) {
    delete c.pend;
    c.tmul = 1;
    for (const a of b.allies) {
      if (a.tstop > 0 && a.alive) {
        ev?.lines.push(`${a.name}の時が、また動き出した！`);
        ev?.upd.push(a);
      }
      a.tstop = 0;
      a.tmul = 1;
    }
  }
  if (STAGE_TELE.has(c.telegraph)) c.telegraph = null;
  c.c6 = { kind: 'zen' };
  c.zen.st = null;
}

// ───────────── 行動の はじめ（battle-ch6.js の ch6TurnStart の はじめ。しかけの 数を 数える 前）─────────────
export function tokei6TurnStart(b, c, ev, stuck) {
  const z = c.zen;
  if (!z) return;
  if (z.phase === 1) {
    const st = z.st;
    let done = false;
    if (z.fire) done = true;
    else if (z.armed) {
      // 前ぶれの 次: 大技が 出る（つぎの 番で おわり）か、氷で 止められた（ここで おわり）
      if (c.telegraph === FIN[st]) z.fire = true;
      else done = true;
    } else if (st === 'gear') done = z.recSeen && c.gear?.rec === null;
    else if (st === 'bell') done = (c.bell?.rings || 0) > 0;
    if (done) {
      endStage(b, c, ev);
      const order = zenConf(c).order;
      z.idx = (z.idx + 1) % order.length;
      startStage(b, c, order[z.idx], ev.lines);
      ev.zenStage = { id: c.id, st: z.st };
      ev.upd.push(c, ...b.allies);
    }
    return;
  }
  // 2だんめ: こわれた 歯車が また 回り出す → 針が 1時間 進む → 12時なら 時の大ほうかい
  const hc = handOf(c);
  const back = [];
  for (const g of b.enemies) {
    if (!isZenGear(g) || g.alive || g.fled) continue;
    const n = (z.down[g.id] ?? hc.revive) - 1;
    if (n > 0) {
      z.down[g.id] = n;
      continue;
    }
    delete z.down[g.id];
    Object.assign(g, { alive: true, hp: g.maxHp, status: {}, buffs: {}, debuffs: {}, ready: false, queued: false, telegraph: null });
    g.atb = 0;
    // 経験値は 1回 たおした ぶんだけ（歯車は 0 だが、図鑑の 数も ふやさない）
    const k = b.killed.lastIndexOf(g.species);
    if (k >= 0) b.killed.splice(k, 1);
    back.push(g.id);
    ev.lines.push(`${g.name}が、また回り出した…！`);
    ev.upd.push(g);
  }
  if (back.length) ev.zenRevive = back;
  if (c.telegraph) return;
  z.hand = Math.min(hc.max, z.hand + 1);
  if (z.hand >= hc.max) {
    if (!stuck) c.telegraph = COLLAPSE;
    ev.lines.push('文字ばんの針が、12時をさした…！');
  } else {
    ev.lines.push(`文字ばんの針が、${z.hand}時に進んだ…（12時で、時の大ほうかい）`);
    if (z.hand === hc.max - 1) ev.lines.push(`（次に${c.name}が動くと、時の大ほうかい…！歯車をこわすか、身を守れ！）`);
    else if (z.hand === hc.warn) ev.lines.push('（針が10時になった…！歯車をこわせば、針がもどる！）');
  }
  ev.zenHand = { id: c.id, hand: z.hand, max: hc.max };
  ev.upd.push(c);
}

// ───────────── 行動の はじめ（ch6TurnStart の さいご。しかけの 前ぶれを 見る）─────────────
export function tokei6TurnEnd(b, c) {
  const z = c.zen;
  if (!z || z.phase !== 1) return;
  if (ARM[z.st] && c.telegraph === ARM[z.st]) z.armed = true;
  if (z.st === 'gear' && c.telegraph === RECORD) z.recSeen = true;
}

// ───────────── 2だんめへ（battle.js の checkPhase から。ダメージを うけた すぐ あと）─────────────
export function tokei6Phase(b, t, ev) {
  const z = t.zen;
  if (!z || z.phase !== 1 || !t.alive) return;
  if (t.hp / t.maxHp >= (zenConf(t).p2At ?? 0.5)) return;
  endStage(b, t, ev);
  z.phase = 2;
  z.hand = handOf(t).start;
  t.c6 = { kind: 'zen' };
  const room = 7 - b.aliveEnemies().length;
  const list = Object.values(ZEN_GEARS).slice(0, Math.max(0, room));
  const added = list.length ? b.addEnemies(list) : [];
  for (const g of added) g.atb = 0;
  if (added.length) ev.joined = (ev.joined || []).concat(added.map(pub));
  ev.phaseLines = (ev.phaseLines || []).concat(
    `${t.name}のまわりに、${added.length}つの歯車があらわれた！`,
    `（${t.name}が動くたびに、針が1時間進む…12時で、時の大ほうかい…！）`,
    '（歯車は、弱点でこわせば、針がもどりそうだ…！ほのおの歯車は氷・水の歯車は雷・影の歯車は光）',
  );
  ev.zenP2 = t.id;
  ev.warn = true;
  ev.upd.push(t, ...b.allies);
}

// ───────────── たおれた（battle-ch5.js の towerKill から）─────────────
// 歯車が こわれる と 針が もどる
export function tokei6Kill(b, t, ev) {
  if (!isZenGear(t)) return;
  const boss = b.enemies.find((e) => e.zen && e.alive);
  if (!boss || boss.zen.phase !== 2) return;
  const hc = handOf(boss);
  const z = boss.zen;
  const was = z.hand;
  z.hand = Math.max(hc.start, z.hand - hc.back);
  z.down[t.id] = hc.revive;
  z.breaks++;
  if (!ev) return;
  (ev.postLines = ev.postLines || []).push(`${t.name}がくだけた！`, was > z.hand ? `文字ばんの針が、${was - z.hand}時間もどった！（今は${z.hand}時）` : '（針は、もうもどらない…）');
  ev.zenBack = { id: boss.id, hand: z.hand, gear: t.id };
  ev.upd.push(boss);
}

// ───────────── 技の こうか（battle-ch6.js の ch6Effect の のこり）─────────────
export function tokei6Effect(b, c, a, eff, ev) {
  if (eff.type !== 'zenCollapse') return false;
  const cf = zenConf(c)?.collapse || {};
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: a.anim || 'a6z_collapse', actor: c.id, targets: targets.map((t) => t.id), side: 'enemy' };
  for (const t of targets) b.physHit(c, t, { mult: cf.mult ?? 1.55, ignoreDef: cf.ignoreDef ?? 0.5, acc: 1.2 }, ev, 'phys');
  if (c.zen) {
    c.zen.hand = handOf(c).start;
    c.zen.collapses++;
    (ev.postLines = ev.postLines || []).push(`（文字ばんの針が、また${c.zen.hand}時にもどった…）`);
  }
  ev.zenCollapse = c.id;
  ev.warn = true;
  ev.upd.push(c);
  return true;
}

// ───────────── 大ほうかいが 近いか ─────────────
// ゼンマイが c の 次の 番までに 何回 動くか
export function bossActsBefore(b, c, boss) {
  const rb = atbRate(boss);
  if (!(rb > 0) || !boss.alive) return 0;
  const mine = 100 / atbRate(c);
  const t0 = boss.ready || boss.queued ? 0 : (100 - boss.atb) / rb;
  if (t0 > mine) return 0;
  return 1 + Math.floor((mine - t0) / (100 / rb));
}
// 大ほうかいが c の 次の 番より 先に 来るか（ふつうの オートの 守り。battle-ch6.js の ch6Plan）
export function collapseBefore(b, c, boss) {
  const z = boss?.zen;
  if (!z || z.phase !== 2) return false;
  if (boss.telegraph === COLLAPSE) return true;
  return bossActsBefore(b, c, boss) >= handOf(boss).max - z.hand;
}

// その 属性の 技で いちばん ダメージの 大きい もの（{ cmd, dmg }。battle-ch6.js の elemHit と おなじ 見かた）
function elemBest(b, c, t, el) {
  let best = null;
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || !FOES.has(a.target) || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    if (e.element !== el) continue;
    let dmg = 0;
    if (e.type === 'phys') {
      const r = b.calcPhys(c, t, e, 1, el, true);
      dmg = r.dmg * r.hit * (e.random ? 1 : e.hits || 1);
    } else if (e.type === 'magic') dmg = b.calcMagic(c, t, e, 1, true).dmg;
    else continue;
    if (!best || dmg > best.dmg) best = { cmd: { type: 'ability', id, target: t.id }, dmg };
  }
  return best;
}

// ───────────── 知っている 人の オート（battle-ch6.js の ch6Plan から。b.knowsCh6。2だんめ）─────────────
// 針が 10時を こえたら 歯車を 弱点で（こわせる 物を 先に）/ こわせない ときは、大ほうかいが 自分の 番より 先なら 身を 守る
export function tokei6Know(b, c, boss, base) {
  const z = boss.zen;
  if (!z || z.phase !== 2) return base;
  const hc = handOf(boss);
  const soon = collapseBefore(b, c, boss);
  if (z.hand >= hc.warn && !b.c6NoGear) {
    let pick = null;
    for (const g of b.aliveEnemies().filter(isZenGear)) {
      const h = elemBest(b, c, g, MONSTERS[g.species].zenGear);
      if (!h) continue;
      const kill = h.dmg >= g.hp;
      if (!pick || kill > pick.kill || (kill === pick.kill && h.dmg > pick.dmg)) pick = { ...h, kill };
    }
    if (pick && (pick.kill || !soon)) return pick.cmd;
  }
  if (soon && !b.c6NoGuard) return { type: 'defend' };
  return base;
}

// ───────────── がめんへ（battle-ch6.js の ch6Pub の さいご）─────────────
// zen … だん（1・2）・zenSt … 1だんめの 今の しかけ・kindAs … その しかけの 家来（がめんは 家来の 目もり・バナーを そのまま 使う）・
// hand・handMax・handWarn … 2だんめの 針 / zenGear … 歯車の 弱点 / base … 時のまぼろしの もとの ボス / person … 人の すがた（リオン）
const STAGE_KIND = { sand: 'sand_clock', gear: 'geardon', pend: 'pendula', bell: 'carillon' };
export function tokei6Pub(c, o) {
  if (c.base) o.base = c.base;
  if (c.person) o.person = c.person;
  const gw = MONSTERS[c.species]?.zenGear;
  if (gw) o.zenGear = gw;
  const z = c.zen;
  if (!z) return;
  o.zen = z.phase;
  o.zenSt = z.st;
  if (z.phase === 1 && STAGE_KIND[z.st]) o.kindAs = STAGE_KIND[z.st];
  if (z.phase === 2) {
    const hc = handOf(c);
    o.hand = z.hand;
    o.handMax = hc.max;
    o.handWarn = hc.warn;
  }
}

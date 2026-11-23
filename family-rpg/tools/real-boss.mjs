// 第100回 V1班: ボスの「はかる 道具（sim）」と「本当の ゲーム（GameWorld）」を ならべて くらべる（docs/plan-sim-vs-real.md）
//   本当の ゲーム ＝ サーバーの 本物の 流れ: GameWorld・startFixedBattle（makeBattle）・本物の 仲間の 作り方（酒場で やとう recruitNpc・
//   家族の キャラを 仲間に companionJoin）・本物の 自動の 動き・本物の 時間の 進め方（world.tick(50)）
//   人は テストと 同じ ボット（test/helpers.js）。**画面と 同じ 形の コマンド**（{ t: 'battle', actor, cmd }）を 送る
//   人の えらび方は 道具の「知って いる 人」と 同じ きまり（tools/sim-ch9.mjs の MODES9.know.act → しくみの 役 or 合体技 or
//   知って いる 人の オートの えらび方〈decideAlly ＋ knows9〉）。番が 来てから REACT ミリびょう 待って えらぶ
// つかいかた: node tools/real-boss.mjs [回数] [colonel|mirror|algol|…] [party,…]
//   party … k1fam（1人＋家族の 仲間3）・k1npc（1人＋酒場3 … 道具と 同じ 作り〈転職ずみ・店の 品〉を 本物の 酒場で やとって 入れる）・
//           k1tav（1人＋酒場3 … 本物の 酒場で やとった まま〈はじめの 職業・その レベルの 酒場の 装備〉）・p4（人 4人）・solo
//   REACT=2000 … えらぶ 時間・SIM=1 … 同じ 組を 道具でも はかって ならべる・LOG=1 … 1回の ようす
//   TAVLV=113 … k1tav の 仲間の レベル（ない ときは 勇者の 1つ下 … 道具の k1tav と 同じ）
//   TAVJOB=1 … k1tav の 仲間を 超級職に 転職させる（装備は そのまま）・TAVGEAR=1 … 装備だけ 店の いちばん よい 品に
//   SUPTAC=heal … 自動の 仲間の 作戦を みんな これに（ない ときは その 仲間の 作戦）
import '../public/js/shared/data/story.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { companionJoin, recruitNpc, companionOf } from '../public/js/shared/world/party.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { NPC_SUPPORTS } from '../public/js/shared/data/shops.js';
import { fullHeal } from '../public/js/shared/stats.js';
import { CH9_IDS, LV9, MODES9, ch9Party, ch9Run, summary9, STATS9_HOOKS } from './sim-ch9.mjs';
import { ORDER_FLAGS, ORDERS_OF, c10cText, c10dText, c10Text, c10bText } from './sim-ch10.mjs';
import { jobChar } from './sim-jobs.mjs';
// 第101回 B班: 第3部 第3章 第1幕の 星座のけもの（beast）・いかり船長（pirate）も（CH9_IDS・ORDER_FLAGS・知って いる 人の しくみの 役を 足す）
// 第102回 B班: 第2幕の ランプの番人（keeper）・月のむかえ オボロ（oboro）も（同じ sim-ch11.mjs が 足す。まとめの しくみの 数は STATS9_HOOKS）
import './sim-ch11.mjs';
import { c11aState, starsOf, captainOf, clocksOf, TOKEI_NAGE } from '../public/js/shared/battle-c11a.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { mpCost } from '../public/js/shared/stats.js';
import { canUse } from '../public/js/shared/ai.js';
import { Bot, tickN } from '../test/helpers.js';
// 第101回 R3班: かんたんな 人（第3部の ボス 全部。tools/sim-easy.mjs）
import { easyCmd } from './sim-easy.mjs';
import { fixedWorld, addPlayer } from '../test/c9a-play.js';

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
// その ボスの ころの 物語の しるし（リーダー）。道具の ORDER_FLAGS（スピカの ごほうびの 音）は かならず 入れる
const UPTO = {
  trio: 'c9_child', trial: 'c9_b3', king: 'c9_gate', riddle: 'c9_p2', trio2: 'c9_song', mu: 'c9_grave',
  tamagon: 'c10_start', mold: 'c10_start', gecko: 'c10b_start', owl: 'c10b_start', colonel: 'c10c_isles2', algol: 'c10c_fort2',
  gate1: 'c10_act3', gate2: 'c10_act3', gate3: 'c10_act3', gate4: 'c10_act3', mirror: 'c10_act3',
  beast: 'c10_act4', pirate: 'c10_act4',
  // 第102回 B班: 第3部 第3章 第2幕の ランプの番人（keeper）・月のむかえ オボロ（oboro）… 第1幕 クリア（ながれ星）の あと
  keeper: 'c11_act1', oboro: 'c11_act1',
};
const flagsOf = (boss) => ORDER_FLAGS[ORDERS_OF[boss]?.[0]]?.[boss] || [];
// 道具の ならび（sim-ch9.mjs の HUMAN_ORDER / NPC9）
const HUMAN_ORDER = ['hero', 'high_priest', 'daikenja', 'god_hand'];
const NPC9 = [['npc_poporo', 'daikenja'], ['npc_rin', 'god_hand'], ['npc_mina', 'high_priest']];
const envNum = (k, d) => (process.env[k] !== undefined && process.env[k] !== '' ? Number(process.env[k]) : d);

function copyKit(dst, src) { for (const k of COPY) dst[k] = structuredClone(src[k]); }

async function newFamChar(world, name, job, kit) {
  const b = new Bot(world, name);
  await b.login();
  await b.createAndPlay('warrior');
  await b.settle();
  const id = b.char.id;
  b.send({ t: 'quit' });
  const c = world.data.characters[id];
  copyKit(c, kit.find((x) => x.job === job));
  fullHeal(c);
  return id;
}

// 戦いの 知らせを 数える（リーダーの 画面に 来た 物）
export const TALLY = {};
function tallyEv(e) {
  const k = e.t === 'act' && e.dual ? 'dualDone' : e.t === 'dualWait' ? 'dualWait' : e.t === 'dualInvite' ? 'invite' : e.t === 'dualWaitEnd' ? `waitEnd:${(e.lines || [])[0] || ''}`.slice(0, 30) : e.t === 'dualAnswer' ? `ans:${e.ok ? 'ok' : e.reason}` : null;
  if (k) TALLY[k] = (TALLY[k] || 0) + 1;
}
// 1回 ぶんの 世界と 人と 仲間を 作る
export async function realSetup(boss, party, seed, { lv = LV9[boss] } = {}) {
  const world = fixedWorld(seed);
  const kit = ch9Party(boss, lv);
  const flags = flagsOf(boss);
  const nHum = { p4: 4, p3: 3, p2: 2 }[party] || 1;
  const humans = [];
  for (let i = 0; i < nHum; i++) {
    // HORDER=sim … 道具の 人4人と 同じ ならび（勇者・大賢者・ゴッドハンド・大神官。sim-ch9.mjs の ch9Allies は CH6_JOBS の じゅん）
    const job = (process.env.HORDER === 'sim' ? ['hero', 'daikenja', 'god_hand', 'high_priest'] : HUMAN_ORDER)[i];
    const { bot, c } = await addPlayer(world, ['ソラ', 'ミナ', 'ケン', 'ユイ'][i], UPTO[boss], flags);
    // HumanBot に 入れかえる 代わりに、知らせの 受け口だけ 軽く する
    bot.invites = [];
    bot.conn.send = (m) => {
      if (m.t === 'battleEv') {
        for (const e of m.evs) if (e.t === 'dualInvite') bot.invites.push({ ...e });
        if (i === 0) for (const e of m.evs) tallyEv(e);
        if (i === 0 && process.env.LOGEV) for (const e of m.evs) if (e.t === 'act') console.log('   ', [...(e.lines || []), ...(e.postLines || [])].join(' / ').slice(0, 160));
        return;
      }
      bot.onMsg(JSON.parse(JSON.stringify(m)));
    };
    copyKit(c, kit.find((x) => x.job === job));
    fullHeal(c);
    c.guests = [];
    world.sendSelf(bot.s);
    humans.push(bot);
  }
  const lead = humans[0];
  for (const h of humans.slice(1)) {
    lead.send({ t: 'party', action: 'invite', sid: h.s.id });
    h.send({ t: 'party', action: 'accept' });
  }
  const lc = world.data.characters[lead.char.id];
  const supTac = process.env.SUPTAC || null;
  if (party === 'k1fam') {
    for (const job of ['daikenja', 'god_hand', 'high_priest']) {
      const id = await newFamChar(world, { daikenja: 'パパ', god_hand: 'ママ', high_priest: 'ばあば' }[job], job, kit);
      if (supTac) world.data.characters[id].tactics = supTac;
      if (!companionJoin(world, lead.s, `fam:${id}`).ok) throw new Error('fam join');
    }
  } else if (party === 'k1npc' || party === 'k1tav') {
    for (const [id, job] of NPC9) {
      const r = recruitNpc(world, lead.s, id);
      if (!r.ok || !r.joined) throw new Error(`recruit ${id}: ${r.reason}`);
      const e = companionOf(lc, id);
      const def = NPC_SUPPORTS.find((n) => n.id === id);
      if (party === 'k1npc') {
        // 道具の 酒場の 仲間（sim-ch9.mjs の npcChar … 超級職・職業Lv10・店の いちばん よい 品・その 人の 作戦）
        const c = jobChar(job, lv, 10, def.name, []);
        copyKit(e.char, c);
      } else {
        // 本物の 酒場で やとった まま（world/party.js の makeNpcSupportChar を その レベルで … 物語で 入る 時と 同じ 作り）
        const tl = envNum('TAVLV', lv - 1);
        const { makeNpcSupportChar } = await import('../public/js/shared/world/party.js');
        const c = makeNpcSupportChar(def, tl);
        if (process.env.TAVJOB) {
          // TAVJOB=1 … 超級職（大賢者・ゴッドハンド・大神官）・TAVJOB=upper … 上級職（賢者・バトルマスター・賢者）
          const tj = process.env.TAVJOB === 'upper' ? { npc_poporo: 'sage', npc_rin: 'battlemaster', npc_mina: 'sage' }[id] : job;
          const s = jobChar(tj, tl, 10, def.name, []);
          for (const k of ['job', 'jobs', 'jobSys', 'skillUse', 'hirameki']) c[k] = structuredClone(s[k]);
          if (!process.env.TAVGEAR) {
            // 装備は そのまま（つけられない 品は はずす）
            const { canEquip } = await import('../public/js/shared/stats.js');
            for (const sl of Object.keys(c.equip)) if (c.equip[sl] && !canEquip(c.job, c.equip[sl])) c.equip[sl] = null;
          }
        }
        if (process.env.TAVGEAR) c.equip = structuredClone(jobChar(c.job, tl, 10, def.name, []).equip);
        copyKit(e.char, c);
      }
      e.char.tactics = supTac || def.tactics;
      fullHeal(e.char);
    }
  }
  for (const h of humans) h.flushQueue();
  await tickN(world, 2);
  for (const h of humans) h.flushQueue();
  return { world, humans, lead };
}

// 人の えらび方（HUMAN=…）
//   know … 道具の 知って いる 人と 同じ（しくみの 役・合体技・知って いる 人の オートの えらび方〈回復・技〉）
//   mech … しくみの コマンド（うつる・てらす・星のうた・鳴らす・身を 守る）だけ。ほかの 番は「戦う」でボスを たたく
//          （前の ブラウザの しらべ方の 勇者と 同じ えらび方）
//   idle … 何も えらばない（番が 来ても まどを 開いた まま）
//   easy … かんたんな 人（第101回 R3班。第3部の ボス 全部。tools/sim-easy.mjs の easyCmd）: しくみの コマンドは 知って いる 人と 同じ
//          （そのボスの しくみの 役 … 前ぶれで 防御・鳴らす・時計・うつる・てらす・皿・なぞ など）・たおれた 仲間が いれば 生き返らせる 技か 道具・
//          HP 4わり いかの 仲間が いれば 回復の 技（全体が あれば それ）か 道具・ほかは いちばん 強い こうげきの 技か「戦う」（HPの 多い 敵）
//   easy0 … easy から「生き返らせる」を ぬいた 物
//   easy11 … 前の かんたんな 人（第101回 B班。第3章 第1幕 だけの しくみ）: 時計を 持って いて あと 2 いか なら「時計を投げる」・前ぶれで ねらわれたら 防御・
//          味方の HPが 少ない（4わり いか）時は 回復の 技・ほかは いちばん 強い こうげきの 技（全体攻撃が あれば それ）か「戦う」。
//          ねらいは HPが いちばん 多い 敵（けもの … 星を そろえて けずる）。合体技・番の 読みは しない
const isDmg = (ab) => ['phys', 'magic', 'multi'].includes(ab?.effect?.type);
const power = (ab) => (ab.effect?.mult || 0) * 100 + (Array.isArray(ab.effect?.base) ? (ab.effect.base[0] + ab.effect.base[1]) / 2 : ab.effect?.base || 0);
//   plain … もっと かんたんな 人（ブラウザで A班が ためした 形）: 時計（あと 2 いか）・前ぶれで 防御・ほかは「戦う」で HPの 多い 敵だけ（技も 回復も 使わない）
function easyPick(b, a, plain = false) {
  const st = c11aState(b);
  const foes = b.aliveEnemies();
  const top = foes.slice().sort((x, y) => y.hp - x.hp)[0];
  const can = (id) => canUse(b, a, id) && a.mp >= mpCost(a.penChar, id);
  if (st?.kind === 'pirate') {
    const k = clocksOf(b, a).filter((x) => x.wound).sort((x, y) => x.n - y.n)[0];
    if (k && k.n <= 2) return { type: 'ability', id: TOKEI_NAGE };
    if (st.anchorReady && st.anchorAim === a.id) return { type: 'defend' };
  }
  if (st?.kind === 'beast' && starsOf(b).some((e) => e.alive && e.c11s?.roarReady && e.c11s.aim === a.id)) return { type: 'defend' };
  if (plain) return { type: 'attack', target: top?.id };
  const low = b.aliveAllies().filter((x) => x.hp < x.maxHp * 0.4);
  if (low.length) {
    const heals = a.abilities.filter((id) => ABILITIES[id]?.effect?.type === 'heal' && can(id));
    const all = heals.find((id) => ABILITIES[id].target === 'allies');
    if (all && low.length > 1) return { type: 'ability', id: all };
    const one = heals.sort((x, y) => power(ABILITIES[y]) - power(ABILITIES[x]))[0];
    if (one) return { type: 'ability', id: one, target: ABILITIES[one].target === 'allies' ? undefined : low.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0].id };
  }
  const atk = a.abilities.filter((id) => isDmg(ABILITIES[id]) && ['enemy', 'enemies'].includes(ABILITIES[id].target) && ABILITIES[id].kind !== 'combo' && can(id));
  const wide = foes.length > 1 ? atk.filter((id) => ABILITIES[id].target === 'enemies').sort((x, y) => power(ABILITIES[y]) - power(ABILITIES[x]))[0] : null;
  if (wide) return { type: 'ability', id: wide };
  const one = atk.filter((id) => ABILITIES[id].target === 'enemy').sort((x, y) => power(ABILITIES[y]) - power(ABILITIES[x]))[0];
  if (one) return { type: 'ability', id: one, target: top?.id };
  return { type: 'attack', target: top?.id };
}
const MECH_IDS = new Set(['m10_utsuru', 'm9_teru', 'm9_hoshiuta', 'm10_narasu']);
function humanPick(b, a, boss, how = process.env.HUMAN || 'know') {
  if (how === 'easy' || how === 'easy0') return easyCmd(b, a, { revive: how === 'easy' });
  if (how === 'easy11' || how === 'plain') return easyPick(b, a, how === 'plain');
  if (how === 'mech') {
    a.knows9 = 'know';
    try {
      const cmd = decideAlly(b, a);
      if (cmd && (cmd.type === 'defend' || (cmd.type === 'ability' && MECH_IDS.has(cmd.id)))) return cmd;
    } finally { delete a.knows9; }
    return { type: 'attack', target: (b.aliveEnemies().find((e) => e.boss) || b.aliveEnemies()[0])?.id };
  }
  return knowPick(b, a, boss);
}
function knowPick(b, a, boss) {
  let captured = null;
  const cmd0 = b.command;
  a.knows9 = 'know';
  try {
    // 合体技（dualPlan）は b.command を よぶ … ここでは 取りだすだけ
    b.command = (id, cmd) => { captured = cmd; return { ok: true }; };
    const took = MODES9.know.act(b, a, boss);
    b.command = cmd0;
    if (took && captured) return captured;
    let cmd = decideAlly(b, a);
    if (!cmd || cmd.type === 'ai') cmd = { type: 'attack', target: (b.aliveEnemies().find((e) => e.boss) || b.aliveEnemies()[0])?.id };
    return cmd;
  } finally {
    b.command = cmd0;
    delete a.knows9;
  }
}

export async function realRun(boss, party, seed, { react = envNum('REACT', 2000), log = false, human = process.env.HUMAN || 'know' } = {}) {
  for (const k of Object.keys(TALLY)) delete TALLY[k];
  const { world, humans, lead } = await realSetup(boss, party, seed);
  let result = null;
  const p = startFixedBattle(world, lead.s, humans.map((h) => h.s), CH9_IDS[boss]);
  p.then((r) => { result = r; });
  const ctx = [...world.battles.values()][0];
  const b = ctx.battle;
  // 人は オートを 切る（新しい キャラは もとから オートでは ない。ボットの はじめの「オート」を 送らない）
  for (const h of humans) h.queue = [];
  for (const h of humans) for (const a of b.allies) if (a.controller === h.s.id && a.auto) h.send({ t: 'battle', actor: a.id, auto: false });
  const readyAt = new Map();
  let real = 0;
  const sent = {};
  const n = { rej: 0 };
  let lastLog = 0;
  const dm = { maxHit: 0, big: 0, aoe: 0, deaths: 0, oneShot: 0, revived: 0, firstDeath: null };
  while (!b.over && real < 30 * 60 * 1000) {
    for (const h of humans) {
      // 合体技の さそい（画面の「参加する？」）: 人は REACT ミリびょうで「はい」（道具と 同じ）
      h.invites = h.invites.filter((inv) => {
        const me = b.get(inv.to);
        if (me?.controller !== h.s.id || !b.invites.get(inv.invite)?.pending.has(inv.to)) return false;
        inv.seen ??= real;
        if (real - inv.seen < react) return true;
        h.send({ t: 'battle', actor: inv.to, cmd: { type: 'dualAnswer', invite: inv.invite, ok: true } });
        return false;
      });
      for (const a of b.allies) {
        if (a.controller !== h.s.id || a.invited || a.inviting) continue; // さそって いる・さそわれて いる 間は 返事を 待つ
        if (!a.ready || !a.alive || b.pendingEnd) { readyAt.delete(a.id); continue; }
        if (!readyAt.has(a.id)) readyAt.set(a.id, real);
        if (real - readyAt.get(a.id) < react || human === 'idle') continue;
        readyAt.delete(a.id);
        const cmd = humanPick(b, a, boss, human);
        const n0 = h.msgs.length;
        h.send({ t: 'battle', actor: a.id, cmd });
        if (h.msgs.slice(n0).some((m) => m.t === 'battleRej')) {
          n.rej++;
          h.send({ t: 'battle', actor: a.id, cmd: { type: 'defend' } });
        } else {
          const k = cmd.type === 'ability' ? cmd.id : cmd.type;
          sent[k] = (sent[k] || 0) + 1;
        }
      }
    }
    // 第101回 R3班: 負け方を 見る（1回の tick で へった HP … ふつうの 攻撃 1回の 大きさ・何人 同時に へったか〈全体攻撃〉・たおれた／生き返った）
    const hp0 = b.allies.map((x) => [x, x.hp, x.alive]);
    await tickN(world, 1);
    real += 50;
    {
      let hitN = 0;
      for (const [x, h, al] of hp0) {
        const d = h - Math.max(0, x.hp);
        if (d > 0 && al) {
          hitN++;
          dm.maxHit = Math.max(dm.maxHit, d / x.maxHp);
          if (d >= x.maxHp * 0.5) dm.big++;
        }
        if (al && !x.alive) { dm.deaths++; dm.firstDeath ??= real / 1000; if (h >= x.maxHp * 0.6) dm.oneShot++; }
        if (!al && x.alive) dm.revived++;
      }
      if (hitN >= 3) dm.aoe++;
    }
    if (log && real - lastLog >= 10000) {
      lastLog = real;
      console.log(`  ${real / 1000}s 味方 ${b.allies.map((x) => `${x.name}${x.hp}`).join(' ')} 敵 ${b.enemies.map((x) => `${x.name}${x.hp}`).join(' ')}`);
    }
  }
  const al = b.allies;
  const foes = b.enemies.filter((e) => e.boss).length ? b.enemies.filter((e) => e.boss) : b.enemies;
  const res = {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: foes.reduce((s, e) => s + Math.max(0, e.hp), 0) / Math.max(1, foes.reduce((s, e) => s + e.maxHp, 0)),
    sent, rej: n.rej, result, tally: { ...TALLY }, dm,
    mpLeft: al.filter((x) => x.controller).reduce((t, x) => t + x.mp, 0) / Math.max(1, al.filter((x) => x.controller).reduce((t, x) => t + x.maxMp, 0)),
    allies: al.map((x) => ({ name: x.name, kind: x.kind, job: x.job, lv: x.lv, maxHp: x.maxHp, tactics: x.tactics, auto: x.auto, controller: x.controller ? 'h' : null })),
    stats: boss === 'colonel' || boss === 'algol' ? statsC10c(b) : boss === 'mirror' ? statsC10d(b) : boss === 'beast' || boss === 'pirate' ? statsC11a(b) : Object.assign({}, ...STATS9_HOOKS.map((f) => f(b))),
  };
  for (const h of humans) h.send({ t: 'quit' });
  return res;
}
async function statsC10c(b) { return b.c10c ? { kBolt: b.c10c.bolts, kHit: b.c10c.hits, kMiss: b.c10c.misses, kMove: b.c10c.moves, kTight: b.c10c.tightHits, kDazzle: b.c10c.dazzles } : {}; }
async function statsC11a(b) { const st = b.c11a; if (!st) return {}; return st.kind === 'beast' ? { bKill: st.kills, bRev: st.revives, bFang: st.fangs, bFangG: st.fangGuards } : { pPass: st.passes, pCap: st.capBites, pAlly: st.allyBites, pAnchor: st.anchors, pAnchorG: st.anchorGuards }; }
async function statsC10d(b) { return b.c10d ? { mRing: b.c10d.rings, mMiss: b.c10d.misses, mAuto: b.c10d.autoRings, mMeas: b.c10d.measures, mMeasG: b.c10d.measureGuards } : {}; }

export const SEED0 = 9090;
if (process.argv[1]?.endsWith('real-boss.mjs')) {
  const N = Number(process.argv[2] || 10);
  const bosses = (process.argv[3] || 'colonel').split(',');
  const parties = (process.argv[4] || 'k1fam').split(',');
  const react = envNum('REACT', 2000);
  for (const boss of bosses) {
    for (const party of parties) {
      if (process.env.LOG) {
        const r = await realRun(boss, party, Number(process.env.SEED || 1), { log: true });
        console.log(JSON.stringify({ ...r, stats: await r.stats }, null, 1));
        continue;
      }
      const res = [];
      // SIMONLY=1 … 道具だけ（SIMN=… 回）
      for (let i = 0; i < (process.env.SIMONLY ? 0 : N); i++) {
        const r = await realRun(boss, party, SEED0 + i * 7919, { react });
        r.stats = await r.stats;
        res.push(r);
        if (process.env.EACH) console.log(`    ${i}: ${r.outcome} ${r.seconds}秒 ボス残${Math.round(r.bossLeft * 100)}% 死${r.deaths} ${JSON.stringify(r.stats)} ${JSON.stringify(r.tally)} ${JSON.stringify(r.sent)}`);
      }
      if (res.length) {
      const s = summary9(res);
      const avg = (f) => res.reduce((t, r) => t + f(r), 0) / res.length;
      console.log(`■ 本物 ${boss} ${party} ${react / 1000}秒 ${N}回 勝率 ${Math.round(s.rate * 100)}%（勝ち${s.sec.toFixed(0)}秒） 平均${avg((r) => r.seconds).toFixed(0)}秒 ボス残${(avg((r) => r.bossLeft) * 100).toFixed(0)}% 死者${avg((r) => r.deaths).toFixed(2)} はねかえり${avg((r) => r.rej).toFixed(1)} ${JSON.stringify(Object.fromEntries(Object.keys(res[0].stats).map((k) => [k, +avg((r) => r.stats[k] || 0).toFixed(1)])))}`
          + `\n    負け方: 1回の 最大 ${(avg((r) => r.dm.maxHit) * 100).toFixed(0)}%HP・半分いじょう ${avg((r) => r.dm.big).toFixed(1)}回・3人いじょう同時 ${avg((r) => r.dm.aoe).toFixed(1)}回・たおれた ${avg((r) => r.dm.deaths).toFixed(1)}（6わり いじょうから 1回で ${avg((r) => r.dm.oneShot).toFixed(1)}）・生き返った ${avg((r) => r.dm.revived).toFixed(1)}・はじめて たおれた ${(res.filter((r) => r.dm.firstDeath != null).reduce((t, r) => t + r.dm.firstDeath, 0) / Math.max(1, res.filter((r) => r.dm.firstDeath != null).length)).toFixed(0)}秒・人の MP のこり ${(avg((r) => r.mpLeft) * 100).toFixed(0)}%・時間切れ ${res.filter((r) => r.outcome === 'timeout').length}`
          + `\n    えらんだ: ${JSON.stringify(Object.fromEntries([...new Set(res.flatMap((r) => Object.keys(r.sent)))].map((k) => [k, +avg((r) => r.sent[k] || 0).toFixed(1)]).sort((x, y) => y[1] - x[1]).slice(0, 14)))}`);
      }
      if (process.env.SIM || process.env.SIMONLY) {
        const simParty = party;
        const SN = envNum('SIMN', N);
        const sr = [...Array(SN).keys()].map((i) => ch9Run(boss, LV9[boss], ['easy', 'easy0'].includes(process.env.HUMAN) ? process.env.HUMAN : 'know', SEED0 + i * 7919, { party: simParty, react, flags: flagsOf(boss) }));
        const ss = summary9(sr);
        console.log(`■ 道具 ${boss} ${party} ${react / 1000}秒 ${SN}回 勝率 ${Math.round(ss.rate * 100)}%（勝ち${ss.sec.toFixed(0)}秒）${c10Text(sr)}${c10bText(sr)}${c10cText(sr)}${c10dText(sr)}`);
      }
    }
  }
  process.exit(0);
}

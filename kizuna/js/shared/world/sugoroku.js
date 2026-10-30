// 第37回 B: すごろく場の しょり（サーバー）
//
// さいころ・マスの できごと・宝部屋の 中み・お店の 品・スロットの 目は ぜんぶ ここで きめる（world.rng）。
// クライアントは 「ふる」「選ぶ」と 言うだけ。こまの 場所も ここで 動かす（ずるが できない）
//
// キャラに のこす もの（なくても よい。むかしの セーブも そのまま 読める）
//   c.sugoroku = {
//     run   … あそんでいる とちゅう（null … あそんでいない）。iPhone が ねむっても、つなぎなおしても、ここから つづき
//       { board, pos, rolls, trail: [通った マス], sw: スイッチ, dice: { double, pick, gold }, stars: [拾った 星のかけらの マス],
//         bosses: [たおした ボスの ばんごう], gold, coins, got: { id: 数 }, pending: 返事を まっている こと, vault: 宝部屋の 中み, after: [戦いの あとの 文],
//         bonus: 1 … ボーナスチャンス（次に 止まった マスの ごほうびが 2倍）/ hunt: 宝探しの 3つの 箱（第50回 D2）}
//     clears … 盤ごとの ゴールした 回数 { b0: 2, … } / plays … あそんだ 回数 / last … さいごの けっか
//   }
//   c.medalsSpent … すごろく券に かえた 小さなメダルの 数（data/casino.js の medalsHeld）
// 戦いの マス・ボスの マスは ほんとうの 戦い（world/battles.js の startFixedBattle）。
//   すごろく場の 受付の だいほん（SG_HOOKS.desk）が、まどを とじて 戦い → 終わったら また まどを 開く。盤の ようすは そのまま
//   負けると その すごろくは おわり（お金は へらない。その場で 元気に なる: encounters の loseOk）
import { ITEMS } from '../data/items.js?v=66b0267ceac2';
import { addItem, removeItem, itemCount, computeStats, fullHeal } from '../stats.js?v=66b0267ceac2';
import { FIXED_ENCOUNTERS } from '../data/encounters.js?v=66b0267ceac2';
import {
  BOARDS, BOARD_BY_ID, nextOptions, DICE, DICE_MAX, TICKET_ITEM, TICKET_COINS, MEDAL_TICKETS, TICKET_BUY_MAX,
  TRAP_TEXT, SG_HOOKS, MOVE_TYPES, SQ_NAME, SUGOROKU_MAP, WHEEL, SG_COINS, SALE_RATE,
} from '../data/sugoroku.js?v=66b0267ceac2';
import { MONSTERS } from '../data/monsters.js?v=66b0267ceac2';
import { tierInfo, casinoTier } from '../data/casino-tier.js?v=66b0267ceac2';
import { coinsOf, COIN_MAX, medalsHeld, medalsSpent } from '../data/casino.js?v=66b0267ceac2';
import { partyOf } from './party.js?v=66b0267ceac2';
import { startFixedBattle } from './battles.js?v=66b0267ceac2';
import { casinoOpen } from './casino.js?v=66b0267ceac2';

const GOLD_MAX = 9999999;
const TRAIL_MAX = 80;
const fmt = (n) => Number(n).toLocaleString('ja-JP');
export { SUGOROKU_MAP };

// ───────────── キャラの きろく ─────────────
function sgOf(c) {
  if (!c.sugoroku || typeof c.sugoroku !== 'object' || Array.isArray(c.sugoroku)) c.sugoroku = {};
  const g = c.sugoroku;
  if (!g.clears || typeof g.clears !== 'object') g.clears = {};
  return g;
}

// あそんでいる とちゅうの すごろく（こわれた きろくは すてる）
export function runOf(c) {
  const r = c?.sugoroku?.run;
  if (!r || typeof r !== 'object') return null;
  const b = BOARD_BY_ID[r.board];
  if (!b || !Number.isInteger(r.pos) || r.pos < 0 || r.pos >= b.sq.length || !Number.isFinite(r.rolls)) {
    c.sugoroku.run = null;
    return null;
  }
  r.trail = Array.isArray(r.trail) ? r.trail.filter((i) => Number.isInteger(i) && i >= 0 && i < b.sq.length) : [];
  r.dice = r.dice && typeof r.dice === 'object' ? r.dice : {};
  r.stars = Array.isArray(r.stars) ? r.stars : [];
  r.bosses = Array.isArray(r.bosses) ? r.bosses : [];
  r.got = r.got && typeof r.got === 'object' ? r.got : {};
  // 宝探しの 中みが ない（こわれた きろく）: 選べないので おしまいに する
  if (r.pending?.kind === 'hunt' && !(Array.isArray(r.hunt) && r.hunt.length)) r.pending = null;
  return r;
}

// クライアントに 見せる ようす（宝部屋の 中みは 見せない）
export function publicRun(run) {
  if (!run) return null;
  const p = run.pending;
  let pending = null;
  if (p) {
    if (p.kind === 'vault') pending = { kind: 'vault', n: (run.vault || []).length || 3 };
    else if (p.kind === 'hunt') pending = { kind: 'hunt', n: (run.hunt || []).length || 3 };
    else if (p.kind === 'battle') pending = { kind: 'battle', boss: p.boss ?? null, name: p.name, mons: p.mons };
    else pending = { ...p };
  }
  return {
    board: run.board, pos: run.pos, rolls: run.rolls, sw: run.sw ? 1 : 0, dice: { ...run.dice }, stars: run.stars.slice(), bosses: run.bosses.slice(),
    gold: run.gold || 0, coins: run.coins || 0, got: Object.entries(run.got), pending, turn: run.turn || 0, trail: run.trail.slice(-12),
    bonus: run.bonus ? 1 : 0,
  };
}

// 自分と、自分の 仲間（パーティーで いっしょに いる。家族の 仲間は のぞく）
function teamChars(world, s) {
  const out = [s.char];
  const p = partyOf(world, s);
  for (const sup of p?.supports || []) if (sup?.char && sup.owner === s.charId && sup.kind !== 'family') out.push(sup.char);
  return out;
}

// ───────────── まどを 開く ─────────────
export function sugorokuInfo(world, s) {
  const c = s.char;
  const g = sgOf(c);
  const t = tierInfo(c);
  const run = runOf(c);
  const info = {
    mode: 'sugoroku', coins: coinsOf(c), coinMax: COIN_MAX, tickets: itemCount(c, TICKET_ITEM), medals: medalsHeld(c),
    ticketCoins: TICKET_COINS, medalTickets: MEDAL_TICKETS, buyMax: TICKET_BUY_MAX, tier: t,
    boards: BOARDS.map((b) => ({ id: b.id, tier: b.tier, name: b.name, tickets: b.tickets, rolls: b.rolls, desc: b.desc, open: b.tier <= t.tier, clears: g.clears[b.id] || 0, left: Math.max(0, t.at[b.tier] - t.clears) })),
    run: publicRun(run), after: run?.after || [], last: g.lastNew ? g.last || null : null,
  };
  if (run) delete run.after;
  g.lastNew = false;
  return info;
}

// ───────────── くじ・ごほうび ─────────────
function weighted(rng, list) {
  const tot = list.reduce((a, [, w]) => a + w, 0);
  let r = rng.next() * tot;
  for (const e of list) {
    r -= e[1];
    if (r < 0) return e[0];
  }
  return list[list.length - 1][0];
}

function gainItem(ctx, id, n = 1) {
  const { c, run } = ctx;
  if (!ITEMS[id]) return false;
  if (itemCount(c, id) + n > 99) {
    ctx.say(`しかし、${ITEMS[id].name}はもう持ちきれない…`);
    return false;
  }
  addItem(c, id, n);
  run.got[id] = (run.got[id] || 0) + n;
  return true;
}
function gainGold(ctx, n) {
  const { c, run } = ctx;
  n = Math.max(0, Math.round(n));
  c.gold = Math.min(GOLD_MAX, (c.gold || 0) + n);
  run.gold = (run.gold || 0) + n;
  return n;
}
function gainCoins(ctx, n) {
  const { c, run } = ctx;
  const before = coinsOf(c);
  c.coins = Math.min(COIN_MAX, before + n);
  run.coins = (run.coins || 0) + (c.coins - before);
  return c.coins - before;
}
function gainDie(ctx, die) {
  const d = ctx.run.dice;
  d[die] = Math.min(DICE_MAX, (d[die] || 0) + 1);
  ctx.say(`${DICE[die].name}を手に入れた！\n（${DICE[die].desc}）`, 'item');
}

// ───────────── こまを 動かす ─────────────
function boardOf(run) {
  return BOARD_BY_ID[run.board];
}

function makeCtx(world, s) {
  const c = s.char;
  const run = runOf(c);
  const ops = [];
  const ctx = {
    world, s, c, run, b: run ? boardOf(run) : null, ops, rng: world.rng,
    say: (text, sfx = null) => ops.push({ op: 'say', text, ...(sfx ? { sfx } : {}) }),
  };
  return ctx;
}

// 進む（forced … 前へ・できごとで 進む。分かれ道では まっすぐ）
function walk(ctx, steps, { forced = false, choice = null } = {}) {
  const { run, b } = ctx;
  let path = [];
  const flush = () => {
    if (path.length) ctx.ops.push({ op: 'move', path });
    path = [];
  };
  while (steps > 0) {
    if (b.sq[run.pos].t === 'goal') break;
    let opts = nextOptions(b, run.pos, run.sw);
    if (!opts.length) break;
    let nxt = opts[0];
    if (opts.length > 1) {
      if (choice !== null && opts.includes(choice)) nxt = choice;
      else if (!forced) {
        flush();
        run.pending = { kind: 'branch', at: run.pos, left: steps, options: opts };
        ctx.say('分かれ道だ！\nどちらへ進む？');
        return 'pending';
      }
    }
    choice = null;
    run.trail.push(run.pos);
    if (run.trail.length > TRAIL_MAX) run.trail.splice(0, run.trail.length - TRAIL_MAX);
    run.pos = nxt;
    path.push(nxt);
    steps--;
    const ns = b.sq[nxt];
    if (ns.t === 'star' && !run.stars.includes(nxt)) {
      run.stars.push(nxt);
      flush();
      ctx.say(`星のかけらを拾った！（${run.stars.length}/${b.stars.length}）`, 'sparkle');
    }
    if (ns.t === 'goal') break;
    if (ns.t === 'boss' && !run.bosses.includes(ns.boss)) {
      if (steps > 0) {
        flush();
        ctx.say(`${b.bosses?.[ns.boss]?.name || 'ボス'}が道をふさいでいる！`);
      }
      break;
    }
  }
  const movedAny = path.length > 0;
  flush();
  // 前へ（forced）で 1マスも 動けなかった（ゴールの 前・ボスの 前）: その マスの できごとは くりかえさない
  if (forced && !movedAny) return settle(ctx);
  return land(ctx, forced);
}

// 後ろへ（通ってきた 道を もどる）
function walkBack(ctx, n) {
  const { run } = ctx;
  const path = [];
  for (let i = 0; i < n && run.trail.length; i++) {
    run.pos = run.trail.pop();
    path.push(run.pos);
  }
  if (!path.length) return settle(ctx);
  ctx.ops.push({ op: 'move', path, back: true });
  return land(ctx, true);
}

// とんで 行く（ワープ・竜の背・落とし穴 how: 'fall'・はしご how: 'climb'）
function jump(ctx, to, how = null) {
  const { run } = ctx;
  run.trail.push(run.pos);
  if (run.trail.length > TRAIL_MAX) run.trail.splice(0, run.trail.length - TRAIL_MAX);
  run.pos = to;
  ctx.ops.push({ op: 'jump', to, ...(how ? { how } : {}) });
  const ns = ctx.b.sq[to];
  if (ns.t === 'star' && !run.stars.includes(to)) {
    run.stars.push(to);
    ctx.say(`星のかけらを拾った！（${run.stars.length}/${ctx.b.stars.length}）`, 'sparkle');
  }
  return land(ctx, true);
}

// k マス 先（まっすぐ。まだ たおしていない ボス・ゴールの 前まで）
function aheadSquare(b, run, k) {
  let i = run.pos;
  for (let n = 0; n < k; n++) {
    const opts = nextOptions(b, i, run.sw);
    if (!opts.length) break;
    const t = b.sq[opts[0]];
    if (t.t === 'goal' || (t.t === 'boss' && !run.bosses.includes(t.boss))) break;
    i = opts[0];
  }
  return i;
}

// 止まった マスの できごと（moved … 前へ・ワープなどで 来た。動く マスでは もう 動かない）
// ボーナスチャンスの あと（2倍）の 文
const twice = (ctx) => (ctx.mult > 1 ? '\n（ボーナスで2倍！）' : '');
const nameN = (id, n) => `${ITEMS[id].name}${n > 1 ? `を${n}こ` : 'を'}`;

function land(ctx, moved = false) {
  const { run, b, rng } = ctx;
  const sq = b.sq[run.pos];
  // はしごは 行き止まりなので、前へ・ワープで 来ても のぼる
  if (moved && MOVE_TYPES.includes(sq.t) && sq.t !== 'ladder') {
    ctx.say(`${SQ_NAME[sq.t]}のマスに着いた。\n（つづけては動かない）`);
    return settle(ctx);
  }
  // ボーナスチャンス: 次に 止まった マスの ごほうびが 2倍（止まったら おしまい）
  ctx.mult = run.bonus ? 2 : 1;
  run.bonus = 0;
  const m = ctx.mult;
  switch (sq.t) {
    case 'goal': return finish(ctx, 'goal');
    case 'start': case 'none': case 'star':
      ctx.say(sq.t === 'none' ? 'ひと休みのマス。\nのんびり、ひと休み…' : sq.t === 'start' ? 'スタートのマスにもどってきた。' : 'きらきら光るマスだ。');
      break;
    case 'gold': {
      const n = gainGold(ctx, rng.int(b.gold[0], b.gold[1]) * m);
      ctx.say(`ゴールドのマス！\n${fmt(n)}ゴールドを手に入れた！${twice(ctx)}`, 'coin');
      break;
    }
    case 'item': {
      const id = weighted(rng, b.items);
      ctx.say(`道具のマス！\n${nameN(id, m)}手に入れた！`, 'item');
      gainItem(ctx, id, m);
      break;
    }
    case 'chest': {
      const id = weighted(rng, b.chest || b.items);
      ctx.say(`宝箱のマス！\n宝箱を開けると、${ITEMS[id].name}${m > 1 ? `が${m}こ` : 'が'}入っていた！`, 'chest');
      gainItem(ctx, id, m);
      break;
    }
    // ───── 第50回 D2 ─────
    case 'bonus':
      run.rolls += 1;
      run.bonus = 1;
      ctx.say('ボーナスチャンス！\nもう1回さいころをふれる！\nさらに、次に止まったマスのごほうびが2倍！', 'sg_bonus');
      break;
    case 'wheel': return wheel(ctx, moved);
    case 'hunt':
      run.hunt = huntBoxes(ctx);
      run.pending = { kind: 'hunt', mult: m };
      ctx.say('宝探しのマス！\n3つの宝箱のどれかに、お宝がねむっている。\nからっぽの箱もあるみたい…');
      return 'pending';
    case 'merchant': {
      const list = rng.shuffle((b.sale || b.shop || []).slice()).slice(0, 3)
        .map(([id, price]) => ({ id, price: Math.max(1, Math.round(price * SALE_RATE)), was: price }));
      if (!list.length) break;
      run.pending = { kind: 'shop', items: list, sale: true };
      ctx.say('すごろく商人のマス！\n「今日は大売り出し！\nどれでも半額だよ！」', 'sg_merchant');
      return 'pending';
    }
    case 'gift': {
      const mons = b.giftMons?.length ? b.giftMons : ['pururin'];
      const sp = mons[rng.int(0, mons.length - 1)];
      const id = weighted(rng, b.gifts || b.items);
      ctx.ops.push({ op: 'gift', sp, id });
      ctx.say(`魔物のおみやげのマス！\n${MONSTERS[sp]?.name || '魔物'}がやってきた。\n…戦う気はないみたい。`);
      ctx.say(`おみやげに、${nameN(id, m)}くれた！${twice(ctx)}`, 'sg_gift');
      gainItem(ctx, id, m);
      break;
    }
    case 'cheer': return cheer(ctx);
    case 'hole':
      ctx.say('落とし穴のマス！\nヒューン…地下の道に落ちてしまった！\n（地下には宝がいっぱい？）', 'sg_fall');
      return jump(ctx, sq.to, 'fall');
    case 'ladder':
      ctx.say('はしごのマス！\nはしごをのぼって、地上にもどった！', 'sg_ladder');
      return jump(ctx, sq.to, 'climb');
    case 'inn':
      for (const ch of teamChars(ctx.world, ctx.s)) fullHeal(ch);
      ctx.say('宿屋のマス！\nひと休みして、みんな元気になった！', 'heal');
      break;
    case 'trap': {
      // 前へ・ワープで 来た ときは、もう 動かない わなだけ（落とし穴 → とげ）。うごきが くりかえさない
      const k = b.traps[rng.int(0, b.traps.length - 1)];
      return trap(ctx, moved && k === 'pit' ? 'hurt' : k);
    }
    case 'fwd':
      ctx.say(`前へ${sq.n}マス！`);
      return walk(ctx, sq.n, { forced: true });
    case 'back':
      ctx.say(`後ろへ${sq.n}マス…`);
      return walkBack(ctx, sq.n);
    case 'warp':
      ctx.say('ワープのマス！\nふしぎな光につつまれた…！', 'warp');
      return jump(ctx, sq.to, 'warp');
    case 'event': return event(ctx, moved);
    case 'battle': return startBattlePending(ctx, null);
    case 'boss':
      if (run.bosses.includes(sq.boss)) {
        ctx.say('ボスのいた場所だ。\nもう、だれもいない。');
        break;
      }
      return startBattlePending(ctx, sq.boss);
    case 'switch':
      run.sw = run.sw ? 0 : 1;
      ctx.say('スイッチのマス！\nガチャン…どこかで道が切りかわった！', 'key');
      ctx.ops.push({ op: 'switch', sw: run.sw });
      break;
    case 'dice': gainDie(ctx, (b.dice || ['double'])[rng.int(0, (b.dice || ['double']).length - 1)]); break;
    case 'slot': return slot(ctx);
    case 'vault': {
      run.vault = vaultBoxes(ctx);
      run.pending = { kind: 'vault' };
      ctx.say('宝部屋にたどり着いた！\n3つの宝箱から、1つだけ開けられる。');
      return 'pending';
    }
    case 'shop': {
      const list = rng.shuffle((b.shop || []).slice()).slice(0, 3).map(([id, price]) => ({ id, price }));
      run.pending = { kind: 'shop', items: list };
      ctx.say('お店のマス！\n「いらっしゃい！すごろくの中だけの品だよ。」');
      return 'pending';
    }
    case 'dragon':
      run.pending = { kind: 'dragon', options: (Array.isArray(sq.to) ? sq.to : [sq.to]).filter((i) => Number.isInteger(i)) };
      ctx.say('竜の背のマス！\n大きな竜が、せなかに乗せてくれるという。\nどこへ連れていってもらう？');
      return 'pending';
    case 'sand':
      run.rolls += 2;
      ctx.say('時の砂のマス！\nさいころをふれる回数が2回ふえた！', 'sparkle');
      break;
    default:
  }
  return settle(ctx);
}

function trap(ctx, kind) {
  const { run } = ctx;
  const team = teamChars(ctx.world, ctx.s);
  switch (kind) {
    case 'hurt':
      for (const ch of team) {
        const mx = computeStats(ch).maxHp;
        if (ch.hp > 0) ch.hp = Math.max(1, ch.hp - Math.round(mx * 0.25));
      }
      ctx.say(TRAP_TEXT.hurt, 'hurt');
      break;
    case 'rest':
      run.rolls = Math.max(0, run.rolls - 1);
      ctx.say(TRAP_TEXT.rest, 'buzz');
      break;
    case 'poison':
      for (const ch of team) if (ch.hp > 0) ch.status = { ...(ch.status || {}), poison: true };
      ctx.say(TRAP_TEXT.poison, 'hurt');
      break;
    case 'thief': {
      const n = Math.min(ctx.c.gold || 0, Math.round((run.gold || 0) * 0.2));
      if (n > 0) {
        ctx.c.gold -= n;
        run.gold -= n;
        ctx.say(`${TRAP_TEXT.thief}\n（${fmt(n)}ゴールドへった）`, 'buzz');
      } else ctx.say('わなだ！どろぼうがあらわれた！\nでも、ぬすまれる物は何もなかった。');
      break;
    }
    case 'pit':
    default:
      ctx.say(TRAP_TEXT.pit, 'buzz');
      return walkBack(ctx, 3);
  }
  return settle(ctx);
}

const EVENT_W = { gold: 3, item: 3, rollUp: 2, rollDown: 1.2, heal: 1.5, hurt: 1, fwd: 2, back: 1.2, coins: 1.5, battle: 1.5, dice: 1.5, warp: 1.2, ticket: 0.4, sand: 0.6, nothing: 1 };

// moved … 前へ・ワープなどで 来た（もう 動かない できごとだけ）
export const MOVE_EVENTS = ['fwd', 'back', 'warp'];
function event(ctx, moved = false) {
  const { run, b, rng } = ctx;
  const kind = weighted(rng, b.events.filter((k) => !(moved && MOVE_EVENTS.includes(k))).map((k) => [k, EVENT_W[k] || 1]));
  ctx.ops.push({ op: 'event', kind });
  switch (kind) {
    case 'gold': {
      const n = gainGold(ctx, rng.int(b.gold[0], b.gold[1]) * 2 * (ctx.mult || 1));
      ctx.say(`？？？のマス！\n空から金貨がふってきた！\n${fmt(n)}ゴールドを手に入れた！${twice(ctx)}`, 'coin');
      break;
    }
    case 'item': {
      const id = weighted(rng, b.chest && rng.chance(0.4) ? b.chest : b.items);
      ctx.say(`？？？のマス！\n道ばたに${ITEMS[id].name}${(ctx.mult || 1) > 1 ? 'が2こ' : 'が'}落ちていた！`, 'item');
      gainItem(ctx, id, ctx.mult || 1);
      break;
    }
    case 'rollUp':
      run.rolls += 1;
      ctx.say('？？？のマス！\nさいころの精があらわれた！\nさいころをふれる回数が1回ふえた！', 'sparkle');
      break;
    case 'rollDown':
      run.rolls = Math.max(0, run.rolls - 1);
      ctx.say('？？？のマス！\nつむじ風に、さいころを1つ飛ばされた…\n（さいころをふれる回数が1回へった）', 'buzz');
      break;
    case 'heal':
      for (const ch of teamChars(ctx.world, ctx.s)) fullHeal(ch);
      ctx.say('？？？のマス！\nやさしい風がふいて、みんな元気になった！', 'heal');
      break;
    case 'hurt':
      for (const ch of teamChars(ctx.world, ctx.s)) {
        const mx = computeStats(ch).maxHp;
        if (ch.hp > 0) ch.hp = Math.max(1, ch.hp - Math.round(mx * 0.15));
      }
      ctx.say('？？？のマス！\n上から石が落ちてきた！\nみんなは少しダメージを受けた。', 'hurt');
      break;
    case 'fwd': {
      const n = rng.int(1, 3);
      ctx.say(`？？？のマス！\n追い風だ！${n}マス進む！`);
      return walk(ctx, n, { forced: true });
    }
    case 'back':
      ctx.say('？？？のマス！\n向かい風だ…2マスもどされた。');
      return walkBack(ctx, 2);
    case 'coins': {
      const n = gainCoins(ctx, (SG_COINS[b.tier] || 20) * (ctx.mult || 1));
      ctx.say(`？？？のマス！\nぷるりんがカジノのコインをくれた！\nコインを${fmt(n)}枚手に入れた！`, 'coin');
      break;
    }
    case 'battle':
      ctx.say('？？？のマス！\nしげみの中から魔物が飛び出してきた！');
      return startBattlePending(ctx, null);
    case 'dice':
      ctx.say('？？？のマス！\nさいころ屋さんが通りかかった。');
      gainDie(ctx, (b.dice || ['double'])[rng.int(0, (b.dice || ['double']).length - 1)]);
      break;
    case 'warp': {
      const to = aheadSquare(b, run, rng.int(2, 6));
      if (to === run.pos) {
        ctx.say('？？？のマス！\nふしぎな光が…すぐに消えてしまった。');
        break;
      }
      ctx.say('？？？のマス！\nふしぎな光につつまれて、前のマスへ飛ばされた！', 'warp');
      return jump(ctx, to, 'warp');
    }
    case 'ticket':
      ctx.say('？？？のマス！\nなんと、すごろく券が落ちていた！', 'item');
      gainItem(ctx, TICKET_ITEM);
      break;
    case 'sand':
      run.rolls += 2;
      ctx.say('？？？のマス！\n時の砂がこぼれていた！\nさいころをふれる回数が2回ふえた！', 'sparkle');
      break;
    default:
      ctx.say('？？？のマス！\nぷるりんがおどっている…\n何もおこらなかった。');
  }
  return settle(ctx);
}

// スロットの マス（絵がらの おもさ。そろうと ごほうび）
export const SG_SLOT = [['seven', 1], ['bar', 2], ['star', 2], ['bell', 3], ['cherry', 4]];
function slot(ctx) {
  const { b, rng, run } = ctx;
  const reels = [0, 1, 2].map(() => weighted(rng, SG_SLOT));
  ctx.ops.push({ op: 'slot', reels });
  const same = reels[0] === reels[1] && reels[1] === reels[2];
  if (same && reels[0] === 'seven') {
    const n = gainCoins(ctx, b.slot?.coins || 300);
    ctx.say(`7が3つ！大当たり！\nカジノのコインを${fmt(n)}枚手に入れた！`, 'jackpot');
  } else if (same && reels[0] === 'bar') {
    run.rolls += 3;
    ctx.say('BARが3つ！\nさいころをふれる回数が3回ふえた！', 'win');
  } else if (same && reels[0] === 'star') {
    const id = weighted(rng, b.chest || b.items);
    ctx.say(`星が3つ！\n${ITEMS[id].name}を手に入れた！`, 'win');
    gainItem(ctx, id);
  } else if (same && reels[0] === 'bell') {
    const n = gainGold(ctx, b.gold[1] * 3);
    ctx.say(`ベルが3つ！\n${fmt(n)}ゴールドを手に入れた！`, 'win');
  } else if (same) {
    ctx.say('チェリーが3つ！', 'win');
    gainDie(ctx, 'double');
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    const n = gainGold(ctx, b.gold[0]);
    ctx.say(`2つそろった！\n${fmt(n)}ゴールドを手に入れた。`, 'coin');
  } else ctx.say('スロットのマス！\n…はずれ。');
  return settle(ctx);
}

// 宝部屋の 3つの 箱（1つは 大当たり）
function vaultBoxes(ctx) {
  const { b, rng } = ctx;
  const pool = b.chest || b.items;
  const rare = pool.filter(([id]) => ['weapon', 'armor', 'shield', 'head', 'acc'].includes(ITEMS[id]?.type));
  // 大当たり: すごろくだけの 装備（半分）か、めずらしい 品（星の鉄など。第50回 D2: 種は もう 入れない）
  const big = rare.length && rng.chance(0.5) ? { item: rare[rng.int(0, rare.length - 1)][0] } : { item: weighted(rng, b.vault || [[TICKET_ITEM, 1]]) };
  const boxes = [big, { item: weighted(rng, pool) }, { gold: rng.int(b.gold[0], b.gold[1]) * 3 }];
  return rng.shuffle(boxes);
}
const boxName = (x) => (x.item ? ITEMS[x.item]?.name || x.item : x.gold ? `${fmt(x.gold)}ゴールド` : 'からっぽ');

// ───────────── 第50回 D2: あたらしい マス ─────────────
// ルーレット（8つの わく。前へ・ワープで 来た ときは 動く わくに 止まらない）
function wheel(ctx, moved = false) {
  const { b, rng, run } = ctx;
  const m = ctx.mult || 1;
  const can = WHEEL.map((w, i) => [i, moved && (w.k === 'fwd' || w.k === 'back') ? 0 : w.w]).filter(([, w]) => w > 0);
  const pick = weighted(rng, can);
  const k = WHEEL[pick].k;
  ctx.ops.push({ op: 'wheel', pick });
  const head = `ルーレットのマス！\nくるくる…「${WHEEL[pick].t}」に止まった！`;
  switch (k) {
    case 'gold': {
      const n = gainGold(ctx, rng.int(b.gold[0], b.gold[1]) * 1.5 * m);
      ctx.say(`${head}\n${fmt(n)}ゴールドを手に入れた！${twice(ctx)}`, 'coin');
      break;
    }
    case 'item': case 'chest': {
      const id = weighted(rng, k === 'chest' ? b.chest || b.items : b.items);
      ctx.say(`${head}\n${nameN(id, m)}手に入れた！`, k === 'chest' ? 'chest' : 'item');
      gainItem(ctx, id, m);
      break;
    }
    case 'fwd':
      ctx.say(head);
      return walk(ctx, 3, { forced: true });
    case 'back':
      ctx.say(head);
      return walkBack(ctx, 2);
    case 'roll':
      run.rolls += 1;
      ctx.say(`${head}\nさいころをふれる回数が1回ふえた！`, 'sparkle');
      break;
    case 'coins': {
      const n = gainCoins(ctx, (SG_COINS[b.tier] || 20) * 2 * m);
      ctx.say(`${head}\nカジノのコインを${fmt(n)}枚手に入れた！${twice(ctx)}`, 'coin');
      break;
    }
    case 'jackpot':
    default: {
      const n = gainGold(ctx, b.gold[1] * 4 * m);
      const id = weighted(rng, b.chest || b.items);
      ctx.say(`ルーレットのマス！\nくるくる…★！大当たり！！\n${fmt(n)}ゴールドと、${ITEMS[id].name}を手に入れた！`, 'jackpot');
      gainItem(ctx, id, m);
    }
  }
  return settle(ctx);
}

// 宝探しの 3つの 箱（お宝・ゴールド・からっぽ）
function huntBoxes(ctx) {
  const { b, rng } = ctx;
  return rng.shuffle([{ item: weighted(rng, b.chest || b.items) }, { gold: rng.int(b.gold[0], b.gold[1]) * 2 }, { none: true }]);
}

// 家族の 応援（自分の ほかの キャラの 名前。いなければ すごろく場の みんな）
function cheer(ctx) {
  const { world, c, b, rng, run } = ctx;
  const names = Object.values(world.data?.characters || {}).filter((x) => x && x !== c && x.id !== c.id && typeof x.name === 'string' && x.name).map((x) => x.name);
  const who = names.length ? names[rng.int(0, names.length - 1)] : 'すごろく場のみんな';
  ctx.ops.push({ op: 'cheer', name: who });
  const head = `家族のおうえんのマス！\n${who}の声がとどいた！「がんばれー！」`;
  const kind = weighted(rng, [['roll', 2], ['heal', 1.5], ['gold', 1.5], ['coins', 1]]);
  if (kind === 'roll') {
    run.rolls += 1;
    ctx.say(`${head}\n元気が出て、さいころをふれる回数が1回ふえた！`, 'sg_cheer');
  } else if (kind === 'heal') {
    for (const ch of teamChars(world, ctx.s)) fullHeal(ch);
    ctx.say(`${head}\nみんなのHPとMPが回復した！`, 'heal');
  } else if (kind === 'gold') {
    const n = gainGold(ctx, rng.int(b.gold[0], b.gold[1]) * 2 * (ctx.mult || 1));
    ctx.say(`${head}\nおこづかいに${fmt(n)}ゴールドもらった！${twice(ctx)}`, 'coin');
  } else {
    const n = gainCoins(ctx, (SG_COINS[b.tier] || 20) * (ctx.mult || 1));
    ctx.say(`${head}\nカジノのコインを${fmt(n)}枚もらった！`, 'coin');
  }
  return settle(ctx);
}

// ───────────── 戦い ─────────────
function startBattlePending(ctx, boss) {
  const { b, rng, run } = ctx;
  const def = boss !== null ? b.bosses?.[boss] : null;
  if (boss !== null && !def) return settle(ctx);
  const group = def ? def.group : (b.battles || [])[rng.int(0, (b.battles || []).length - 1)];
  if (!group) return settle(ctx);
  run.pending = { kind: 'battle', boss, group: def ? null : b.battles.indexOf(group), name: def ? def.name : null, mons: group.map(([sp]) => sp), ...(ctx.mult > 1 ? { mult: ctx.mult } : {}) };
  ctx.say(def ? `${def.name}があらわれた！\n「この先へは、行かせぬぞ…！」` : '戦いのマス！\n魔物があらわれた！');
  return 'pending';
}

// 戦いの くみあわせ（キャラごとに 1つ。強さは 自分の レベルに 合わせる）
export function sugorokuEncounter(c, run) {
  const b = boardOf(run);
  const p = run.pending;
  const def = p.boss !== null && p.boss !== undefined ? b.bosses[p.boss] : null;
  const group = def ? def.group : b.battles[p.group] || b.battles[0];
  const lv = Math.max(b.lv, Math.round((c.level || 1) * 0.92)) + (def?.lv || 0);
  const id = `sg_${c.id || 'me'}`;
  FIXED_ENCOUNTERS[id] = {
    group, bg: def?.bg || b.bg || 'grass', bgm: def ? 'boss' : 'battle', canFlee: !def, boss: !!def,
    enemyLv: lv, enemyPow: def?.pow || 1, loseOk: true, sugoroku: true,
  };
  return id;
}

// 戦いの けっかを 盤に のこす（だいほんの とちゅうで 人が いなく なっても よぶ）
export function applySugorokuBattle(world, s, c, outcome) {
  const run = runOf(c);
  if (!run || run.pending?.kind !== 'battle') return;
  const ctx = { world, s, c, run, b: boardOf(run), ops: [], rng: world.rng, say: (t) => ctx.ops.push({ op: 'say', text: t }) };
  const p = run.pending;
  run.pending = null;
  const def = p.boss !== null && p.boss !== undefined ? ctx.b.bosses[p.boss] : null;
  if (outcome === 'win') {
    if (def) {
      run.bosses.push(p.boss);
      const n = gainGold(ctx, def.gold);
      ctx.say(`${def.name}をたおした！\n${fmt(n)}ゴールドを手に入れた！`);
      const id = weighted(world.rng, ctx.b.chest || ctx.b.items);
      ctx.say(`${def.name}は${ITEMS[id].name}を落としていった！`);
      gainItem(ctx, id);
    } else {
      const n = gainGold(ctx, ctx.b.battleGold * (0.8 + world.rng.next() * 0.4) * (p.mult || 1));
      ctx.say(`すごろくのごほうび！\n${fmt(n)}ゴールドを手に入れた！${p.mult > 1 ? '\n（ボーナスで2倍！）' : ''}`);
    }
    settle(ctx);
  } else if (outcome === 'lose') {
    finish(ctx, 'lose');
  } else {
    ctx.say(def ? 'ボスから、にげだした…' : '魔物から、にげだした。');
    settle(ctx);
  }
  const after = ctx.ops.filter((o) => o.op === 'say').map((o) => o.text);
  const live = runOf(c);
  if (live) live.after = after;
  else if (c.sugoroku?.last) c.sugoroku.last.after = after;
  world.markDirty();
}

// ───────────── おわり ─────────────
function settle(ctx) {
  const { run, c } = ctx;
  if (c.sugoroku?.run !== run) return 'over';
  if (!run.pending && run.rolls <= 0) return finish(ctx, 'rolls');
  return run.pending ? 'pending' : 'ok';
}

function finish(ctx, reason) {
  const { c, run, b, rng } = ctx;
  const g = sgOf(c);
  const prizes = [];
  // ゴールの 景品の ならび（クライアントの おいわいで 1つずつ 見せる。tag: first・big・stars・extra）
  const reveal = [];
  let first = false;
  if (reason === 'goal') {
    const goal = b.goal;
    ctx.say(`ゴール！！\n${b.name}をクリアした！`, 'fanfare');
    const n = gainGold(ctx, goal.gold);
    const cn = goal.coins ? gainCoins(ctx, goal.coins) : 0;
    ctx.say(`ゴールの景品！\n${fmt(n)}ゴールド${cn ? `と、コイン${fmt(cn)}枚` : ''}を手に入れた！`, 'coin');
    reveal.push({ gold: n, coins: cn });
    first = !g.clears[b.id];
    if (first && goal.first && ITEMS[goal.first]) {
      ctx.say(`初めてのゴールのごほうび！\n${ITEMS[goal.first].name}を手に入れた！`, 'jackpot');
      if (gainItem(ctx, goal.first)) { prizes.push(goal.first); reveal.push({ id: goal.first, tag: 'first' }); }
      // はじめての ゴールの おまけ（すごろく券・進化の石・星の鉄など）
      const fb = (goal.firstBonus || []).filter(([fid, k]) => ITEMS[fid] && gainItem(ctx, fid, k));
      if (fb.length) {
        ctx.say(`さらに、初めてのおまけ！\n${fb.map(([fid, k]) => `${ITEMS[fid].name}${k > 1 ? `×${k}` : ''}`).join('と')}をもらった！`, 'item');
        for (const [fid, k] of fb) reveal.push({ id: fid, n: k, tag: 'first' });
      }
    }
    const id = weighted(rng, goal.pool);
    ctx.say(`ゴールの大きな景品！\n${ITEMS[id].name}を手に入れた！`, 'jackpot');
    if (gainItem(ctx, id)) { prizes.push(id); reveal.push({ id, tag: 'big' }); }
    if (goal.extra?.length) {
      const xid = weighted(rng, goal.extra);
      if (gainItem(ctx, xid)) {
        ctx.say(`ゴールのおまけ！\n${ITEMS[xid].name}も手に入れた！`, 'item');
        reveal.push({ id: xid, tag: 'extra' });
      }
    }
    if (goal.stars && b.stars.length && run.stars.length >= b.stars.length) {
      const sid = weighted(rng, goal.stars.pool);
      ctx.say(`星のかけらが${b.stars.length}つ光りかがやいた！\nおまけの景品、${ITEMS[sid].name}を手に入れた！`, 'jackpot');
      if (gainItem(ctx, sid)) { prizes.push(sid); reveal.push({ id: sid, tag: 'stars' }); }
      if (goal.stars.extra && gainItem(ctx, goal.stars.extra)) {
        ctx.say(`さらに、${ITEMS[goal.stars.extra].name}も手に入れた！`, 'item');
        prizes.push(goal.stars.extra);
        reveal.push({ id: goal.stars.extra, tag: 'stars' });
      }
    }
    g.clears[b.id] = (g.clears[b.id] || 0) + 1;
  } else if (reason === 'rolls') {
    ctx.say('さいころをふれる回数がなくなった…\nすごろくは、ここでおしまい。');
  } else if (reason === 'lose') {
    ctx.say('力つきてしまった…\nすごろくは、ここでおしまい。\n（お金はへらない）');
  } else {
    ctx.say('すごろくをやめた。\n手に入れた物は、そのまま持って帰れる。');
  }
  const summary = {
    reason, board: b.id, gold: run.gold || 0, coins: run.coins || 0, got: Object.entries(run.got), prizes, at: ctx.world.now(),
    ...(reason === 'goal' ? { reveal, first } : {}),
  };
  g.run = null;
  g.last = summary;
  g.lastNew = reason === 'lose';
  g.plays = (g.plays || 0) + 1;
  ctx.ops.push({ op: 'over', ...summary });
  return 'over';
}

// ───────────── そうさ（world/casino.js の casinoAction から）─────────────
export function sugorokuAction(world, s, msg, reply) {
  const c = s.char;
  if (s.map !== SUGOROKU_MAP || s.casino !== 'sugoroku') return reply(false, '');
  const g = sgOf(c);
  const state = (extra = {}) => ({ sg: publicRun(runOf(c)), tickets: itemCount(c, TICKET_ITEM), medals: medalsHeld(c), clears: { ...g.clears }, ...extra });
  switch (msg.action) {
    case 'sgState': return reply(true, '', state({ after: (() => { const r = runOf(c); const a = r?.after || []; if (r) delete r.after; return a; })() }));
    case 'sgBuy': {
      const n = msg.n;
      if (!Number.isInteger(n) || n < 1) return reply(false, 'その数は買えません', state());
      if (msg.pay === 'medal') {
        if (n > 10) return reply(false, 'その数は買えません', state());
        if (medalsHeld(c) < n) return reply(false, '小さなメダルが足りないようです', state());
        if (itemCount(c, TICKET_ITEM) + n * MEDAL_TICKETS > 99) return reply(false, 'すごろく券は99まいまでしか持てません', state());
        c.medalsSpent = medalsSpent(c) + n;
        addItem(c, TICKET_ITEM, n * MEDAL_TICKETS);
        return reply(true, `小さなメダル${n}まいと、すごろく券${n * MEDAL_TICKETS}まいをこうかんした！`, state({ bought: n * MEDAL_TICKETS }));
      }
      if (n > TICKET_BUY_MAX) return reply(false, 'その数は買えません', state());
      if (itemCount(c, TICKET_ITEM) + n > 99) return reply(false, 'すごろく券は99まいまでしか持てません', state());
      const cost = n * TICKET_COINS;
      if (coinsOf(c) < cost) return reply(false, 'コインが足りないようです', state());
      c.coins = coinsOf(c) - cost;
      addItem(c, TICKET_ITEM, n);
      return reply(true, `コイン${fmt(cost)}枚で、すごろく券を${n}まい買った！`, state({ bought: n }));
    }
    case 'sgStart': {
      if (runOf(c)) return reply(false, 'すごろくのとちゅうです', state());
      const b = BOARD_BY_ID[msg.board];
      if (!b) return reply(false, 'そのすごろくはありません', state());
      if (b.tier > casinoTier(c)) return reply(false, '宝の地図をもっとクリアすると、あそべるようになります', state());
      if (itemCount(c, TICKET_ITEM) < b.tickets) return reply(false, `すごろく券が${b.tickets}まいいります`, state());
      removeItem(c, TICKET_ITEM, b.tickets);
      g.run = { board: b.id, pos: b.start, rolls: b.rolls, trail: [], sw: 0, dice: {}, stars: [], bosses: [], gold: 0, coins: 0, got: {}, pending: null, turn: 0, startedAt: world.now() };
      for (const ch of teamChars(world, s)) fullHeal(ch);
      return reply(true, `すごろく券を${b.tickets}まい使った。\n${b.name}、スタート！`, state({ ops: [{ op: 'say', text: `${b.name}、スタート！\nみんな元気いっぱい！さいころは${b.rolls}回ふれる。` }] }));
    }
    case 'sgRoll': return sgRoll(world, s, msg, reply, state);
    case 'sgChoose': {
      const ctx = makeCtx(world, s);
      const p = ctx.run?.pending;
      if (!p || !['branch', 'dragon'].includes(p.kind)) return reply(false, '', state());
      const i = msg.i;
      if (!Number.isInteger(i) || i < 0 || i >= p.options.length) return reply(false, '', state());
      ctx.run.pending = null;
      if (p.kind === 'branch') walk(ctx, p.left, { choice: p.options[i] });
      else {
        ctx.say('竜は大きくはばたいた！', 'warp');
        jump(ctx, p.options[i], 'dragon');
      }
      return reply(true, '', state({ ops: ctx.ops }));
    }
    case 'sgPick': {
      const ctx = makeCtx(world, s);
      if (ctx.run?.pending?.kind === 'hunt') return huntPick(ctx, msg, reply, state);
      if (ctx.run?.pending?.kind !== 'vault') return reply(false, '', state());
      const boxes = ctx.run.vault || [];
      const i = msg.i;
      if (!Number.isInteger(i) || i < 0 || i >= boxes.length) return reply(false, '', state());
      ctx.run.pending = null;
      ctx.run.vault = null;
      const got = boxes[i];
      ctx.ops.push({ op: 'vault', picked: i, boxes: boxes.map(boxName) });
      if (got.item) {
        ctx.say(`宝箱を開けた！\n${boxName(got)}を手に入れた！`, 'jackpot');
        gainItem(ctx, got.item);
      } else {
        gainGold(ctx, got.gold);
        ctx.say(`宝箱を開けた！\n${boxName(got)}を手に入れた！`, 'coin');
      }
      settle(ctx);
      return reply(true, '', state({ ops: ctx.ops }));
    }
    case 'sgShop': {
      const ctx = makeCtx(world, s);
      const p = ctx.run?.pending;
      if (p?.kind !== 'shop') return reply(false, '', state());
      if (msg.i === -1) {
        ctx.run.pending = null;
        ctx.say('「またどうぞ！」');
        settle(ctx);
        return reply(true, '', state({ ops: ctx.ops }));
      }
      const it = Number.isInteger(msg.i) ? p.items[msg.i] : null;
      if (!it || !ITEMS[it.id]) return reply(false, '', state());
      if ((c.gold || 0) < it.price) return reply(false, 'ゴールドが足りないようです', state());
      if (itemCount(c, it.id) >= 99) return reply(false, 'それ以上は持てないようです', state());
      c.gold -= it.price;
      addItem(c, it.id, 1);
      ctx.run.got[it.id] = (ctx.run.got[it.id] || 0) + 1;
      p.items.splice(msg.i, 1);
      ctx.say(`${fmt(it.price)}ゴールドで${ITEMS[it.id].name}を買った！`, 'coin');
      if (!p.items.length) {
        ctx.run.pending = null;
        ctx.say('「売り切れだ！ありがとう！」');
        settle(ctx);
      }
      return reply(true, '', state({ ops: ctx.ops }));
    }
    case 'sgFight': {
      const run = runOf(c);
      if (run?.pending?.kind !== 'battle') return reply(false, '', state());
      s.sgFight = true;
      return reply(true, '', state());
    }
    case 'sgQuit': {
      const ctx = makeCtx(world, s);
      if (!ctx.run) return reply(false, '', state());
      finish(ctx, 'quit');
      return reply(true, '', state({ ops: ctx.ops }));
    }
    default: return reply(false, '', state());
  }
}

// 宝探し: 1つ 開けて、のこりの 箱の 中みも 見せる
function huntPick(ctx, msg, reply, state) {
  const { run } = ctx;
  const boxes = run.hunt || [];
  const i = msg.i;
  if (!Number.isInteger(i) || i < 0 || i >= boxes.length) return reply(false, '', state());
  const m = run.pending.mult || 1;
  run.pending = null;
  run.hunt = null;
  ctx.mult = m;
  const got = boxes[i];
  ctx.ops.push({ op: 'hunt', picked: i, boxes: boxes.map(boxName), hit: got.none ? 0 : 1 });
  if (got.item) {
    ctx.say(`宝箱を開けた！\nお宝だ！${nameN(got.item, m)}手に入れた！`, 'jackpot');
    gainItem(ctx, got.item, m);
  } else if (got.gold) {
    const n = gainGold(ctx, got.gold * m);
    ctx.say(`宝箱を開けた！\n${fmt(n)}ゴールドが入っていた！${twice(ctx)}`, 'coin');
  } else ctx.say('宝箱を開けた！\n…からっぽだった。ざんねん！', 'buzz');
  settle(ctx);
  return reply(true, '', state({ ops: ctx.ops }));
}

function sgRoll(world, s, msg, reply, state) {
  const ctx = makeCtx(world, s);
  const { run, b, rng } = ctx;
  if (!run) return reply(false, 'すごろくをしていません', state());
  if (run.pending) return reply(false, '', state());
  if (run.rolls <= 0) {
    finish(ctx, 'rolls');
    return reply(true, '', state({ ops: ctx.ops }));
  }
  const die = msg.die || 'normal';
  if (!DICE[die]) return reply(false, '', state());
  let dice;
  if (die === 'normal') dice = [rng.int(1, 6)];
  else {
    if (!((run.dice[die] || 0) > 0) || !(b.dice || []).includes(die)) return reply(false, 'そのさいころは持っていない', state());
    if (die === 'double') dice = [rng.int(1, 6), rng.int(1, 6)];
    else {
      const max = die === 'gold' ? 12 : 6;
      if (!Number.isInteger(msg.n) || msg.n < 1 || msg.n > max) return reply(false, '', state());
      dice = [msg.n];
    }
    run.dice[die] -= 1;
  }
  const total = dice.reduce((a, x) => a + x, 0);
  run.rolls -= 1;
  run.turn = (run.turn || 0) + 1;
  ctx.ops.push({ op: 'dice', die, dice, total });
  walk(ctx, total);
  return reply(true, '', state({ ops: ctx.ops }));
}

// ───────────── すごろく場の 受付の だいほん（data/story-casino.js の sugoroku_desk）─────────────
// まどを 開く → 戦いの マスで「戦う」なら まどを とじて 戦い → また まどを 開く（盤の ようすは そのまま）
async function desk(run) {
  const world = run.world;
  const s = run.init;
  for (let k = 0; k < 400; k++) {
    if (run.aborted) return;
    const ui = casinoOpen(world, s, 'casino', 'sugoroku');
    if (!ui) return;
    run.batch.push(['ui', 'casino', ui]);
    const r = await run.flush();
    if (r.aborted || run.aborted) return;
    const c = s.char;
    const want = !!s.sgFight;
    s.sgFight = false;
    const st = runOf(c);
    if (!want || st?.pending?.kind !== 'battle') return;
    const enc = sugorokuEncounter(c, st);
    const res = await startFixedBattle(world, s, [s], enc);
    applySugorokuBattle(world, s, c, res);
    world.sendSelf(s);
    if (run.aborted) return;
  }
}

Object.assign(SG_HOOKS, { desk });

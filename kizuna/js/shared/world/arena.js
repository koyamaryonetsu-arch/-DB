// 第37回 A: サファラ闘技場（ランク戦の 3連戦・ごほうび・王者のかべ・かけ試合）。だいほんの 'call' から よぶ（data/story-arena.js）
//
// ・ランク戦（受付。物語と おなじ「パーティー みんなで 見る」だいほん。そばに いる 家族も いっしょに 戦う）
//   砂の 闘技場の まん中へ → 1戦目 → 2戦目 → 3戦目（王者）。戦いの 間に 回復しない（HP・MPは 戦いの あとの まま。
//   world/battles.js の finishBattle が キャラに もどす）。道具は 戦いの 中で 使える。にげられない（encounters-arena.js）
//   負けた（loseOk）… お金は へらない。受付の 前に もどって HP・MPが もどる / 勝ちぬいた … ごほうび（キャラごとに はじめてか 2回目からか）
//   とちゅうで かけつけた 家族（battles.js の joinBattle）も、次の 戦いから 3連戦の なかまに 入る（adopt）
// ・かけ試合（かけ試合の 係。ひとりずつ）: 4ひきの 魔物の トーナメント。本物の 戦いの しくみで 戦わせる（betDuel）。
//   オッズは 強さ（data/arena.js の winChances）から。けっかは 短い 戦いの ようす（client/ui/arena.js の arenaBoutUI）で 見せる
import { Battle } from '../battle.js?v=7040d8c7ec18';
import { decideMonster } from '../ai.js?v=7040d8c7ec18';
import { enemyFixedScale } from '../battle.js?v=7040d8c7ec18';
import { MONSTERS } from '../data/monsters.js?v=7040d8c7ec18';
import { ITEMS } from '../data/items.js?v=7040d8c7ec18';
import { addItem } from '../stats.js?v=7040d8c7ec18';
import { scaleEnemy } from '../data/treasure.js?v=7040d8c7ec18';
import { startFixedBattle } from './battles.js?v=7040d8c7ec18';
import { partyOf } from './party.js?v=7040d8c7ec18';
import { FIXED_ENCOUNTERS } from '../data/encounters.js?v=7040d8c7ec18';
import { ARENA_HOOKS } from '../data/story-arena.js?v=7040d8c7ec18';
import {
  ARENA_RANKS, ARENA_POS, ARENA_MAP, rankInfo, rankLabel, rankOpen, rankCleared, visibleRanks, noteClear, nextRepeatMedal, firstMedalId,
  wallRows, arenaRecord, BET_LV, BET_POOL, BET_AMOUNTS, BET_PAIRS, ODDS_TRIES, duelRate, winChances, oddsOf, payout,
} from '../data/arena.js?v=7040d8c7ec18';
// 第45回: 竜王のしるしを もらえるか（data/companions-dqm.js）
import { dqKeyDue } from '../data/companions-dqm.js?v=7040d8c7ec18';

const say = (who, text) => ['say', who, text];
const CLERK = '闘技場の受付';
const CALLER = '闘技場の司会';
const BETMAN = 'かけ試合の係';
const fmt = (n) => Number(n).toLocaleString('ja-JP');
const ownerFlag = (run) => (f) => !!run.owner.char.flags?.[f];

async function flushOk(run) {
  const r = await run.flush();
  if (r.aborted) {
    run.abort();
    return false;
  }
  return true;
}

// ───────────── 受付 ─────────────
export async function arenaDesk(run) {
  const c = run.owner.char;
  const steps = [];
  if (!c.flags.arena_seen) {
    steps.push(
      say(CLERK, 'ようこそ、サファラ闘技場へ！\n水がもどって、大会がまたはじまったんだ！'),
      say(CLERK, 'ランク戦は、休みなしの3連戦。\n3戦目には、そのランクの「王者」が待っているぞ。'),
      say(CLERK, '戦いの間に、回復はできない。\n道具は戦いの中で使えるが、にげることはできない。'),
      say(CLERK, '負けても、お金はへらない。\nここにもどって、手当てをしてやるからな。'),
      ['flag', 'arena_seen'],
    );
  } else steps.push(say(CLERK, `ようこそ、サファラ闘技場へ！\n${bestText(c)}`));
  steps.push(['choice', '何をする？', ['ランク戦に出る', '王者のかべを見る', '闘技場のきまりを聞く', 'やめる'], [
    [['call', rankMenu]],
    [['call', wallOpen]],
    rulesSteps(),
    [say(CLERK, 'またいつでも来な！')],
  ]]);
  await run.runSteps(steps);
}

function bestText(c) {
  const best = Math.max(0, ...ARENA_RANKS.filter((R) => rankCleared(c, R.rank)).map((R) => R.rank));
  if (!best) return 'まずは、ランク1からちょうせんだ！';
  if (best >= ARENA_RANKS.length) return '伝説のチャンピオンに勝った者が、また来てくれるとは…！';
  return `${c.name}は、${rankLabel(best)}まで勝ちぬいているな。`;
}

function rulesSteps() {
  return [
    say(CLERK, 'ランク1〜5は、だれでも出られる。\n1つ前のランクを勝ちぬくと、次のランクに出られるぞ。'),
    say(CLERK, 'ランク5の上には「伝説の部」がある。\n世界のどこかで大きな戦いを乗りこえると、開くといううわさだ。'),
    say(CLERK, '初めて勝ちぬくと、とくべつなごほうび！\n2回目からは、ゴールドと小さなメダルを1まいだ。'),
    say(CLERK, 'そばにいる家族も、いっしょに戦える。\n勝ちぬくと、入口の「王者のかべ」に名前がきざまれるぞ。'),
    say(CLERK, '砂の闘技場では、モンスターのかけ試合もやっている。\nかけ試合の係に、話しかけてみな。'),
  ];
}

// ランクを えらぶ（リーダーの 記録で。開いていない ランクは 理由を 話す）
async function rankMenu(run) {
  const c = run.owner.char;
  const flag = ownerFlag(run);
  const ranks = visibleRanks(flag);
  const labels = ranks.map((n) => {
    const R = rankInfo(n);
    const open = rankOpen(n, flag, c).ok;
    const mark = rankCleared(c, n) ? '★' : '';
    if (!open && R.legend && !flag(R.needFlag)) return `${rankLabel(n)}　？？？`;
    return `${mark}${rankLabel(n)}　${R.champ}（おすすめLv${R.lv}）${open ? '' : '　まだ出られない'}`;
  });
  await run.runSteps([['choice', 'どのランクに出る？', [...labels, 'やめる'], [
    ...ranks.map((n) => [['call', (r) => rankConfirm(r, n)]]),
    [say(CLERK, 'またいつでも来な！')],
  ]]]);
}

async function rankConfirm(run, n) {
  const c = run.owner.char;
  const R = rankInfo(n);
  const o = rankOpen(n, ownerFlag(run), c);
  if (!o.ok) {
    const text = o.why === 'prev' ? `${rankLabel(n)}に出るには、まず${rankLabel(n - 1)}を勝ちぬくんだ！` : `伝説の部は、まだ開いていないんだ…。\n${R.lockText || ''}`;
    await run.runSteps([say(CLERK, text)]);
    return;
  }
  const who = run.everyone.length > 1 ? `${run.everyone.map((m) => m.char.name).join('と')}のパーティー` : c.name;
  await run.runSteps([
    say(CLERK, `${rankLabel(n)}は、休みなしの3連戦。\n3戦目の王者は「${R.champ}」だ。`),
    say(CLERK, `（${who}で出る。戦いの間に回復はできないぞ）`),
    ['choice', `${rankLabel(n)}にちょうせんする？`, ['ちょうせんする', 'やめる'], [
      [['call', (r) => runRank(r, n)]],
      [say(CLERK, 'じゅんびができたら、また来な！')],
    ]],
  ]);
}

// とちゅうで かけつけた 家族（戦いの あとで だいほんの 外に のこった 人）を 3連戦の なかまに 入れる
function adopt(run) {
  const w = run.world;
  const p = partyOf(w, run.init);
  for (const sid of p?.members || []) {
    const m = w.sessions.get(sid);
    if (!m || run.parts.includes(m) || m.busy !== 'script' || (m.runId && w.runs.has(m.runId))) continue;
    run.parts.push(m);
    m.runId = run.id;
  }
}

// HPと 位置の 立てなおし（負けた・とちゅうで やめた）。受付の 前に もどって 手当て
function backToDesk(lines) {
  const P = ARENA_POS.desk;
  return [
    ['fade', 'out'], ['teleport', ARENA_MAP, P.x + 0.5, P.y + 0.5, 'right'], ['heal'], ['bgm', 'resume'], ['fade', 'in'],
    ...lines,
  ];
}

// ランク戦の 3連戦
export async function runRank(run, n) {
  const R = rankInfo(n);
  const w = run.world;
  const P = ARENA_POS.ring;
  const names = () => run.everyone.map((m) => m.char.name);
  await run.runSteps([
    ['fade', 'out'], ['teleport', ARENA_MAP, P.x + 0.5, P.y + 0.5, 'up'], ['fade', 'in'],
    say(CALLER, `さあ、${rankLabel(n)}のちょうせん者、\n${names().join('と')}の入場だ！`),
    ['sfx', 'encounter'],
  ]);
  for (let i = 0; i < 3; i++) {
    const enc = R.battles[i];
    if (i < 2) run.batch.push(say(CALLER, i === 0 ? '第1戦、始め！' : '第2戦！休むひまはないぞ！'));
    else {
      run.batch.push(say(CALLER, `いよいよ第3戦！\n${rankLabel(n)}の王者、${R.champ}の登場だ！`));
      run.batch.push(['showMon', champOf(enc)]);
    }
    if (!(await flushOk(run))) return;
    const res = await startFixedBattle(w, run.init, run.everyone, enc);
    run.batch.push(['showMon', null]);
    adopt(run);
    if (res !== 'win') {
      if (res === 'lose') {
        await run.runSteps(backToDesk([
          say(CLERK, `おつかれさん！\n${rankLabel(n)}は、第${i + 1}戦で力つきてしまったな。`),
          say(null, '受付の人が、手当てをしてくれた。\nHPとMPがもどった！（お金はへっていない）'),
          say(CLERK, `${R.hint}\nまたちょうせんしな！`),
        ]));
      } else await run.runSteps(backToDesk([say(CLERK, '戦いが止まったようだ…。\nまたちょうせんしな！')]));
      return;
    }
    if (i < 2) run.batch.push(say(null, `第${i + 1}戦に勝った！\n（HPとMPは、回復しないまま…次の戦いへ！）`));
  }
  // 勝ちぬいた
  run.batch.push(['sfx', 'win'], say(CALLER, `勝者、${names().join('と')}！\n${rankLabel(n)}、勝ちぬきだ！！`));
  const lines = clearRewards(run, n);
  await run.runSteps([...lines, ...backToDesk([say(CLERK, n >= ARENA_RANKS.length ? 'まさか、伝説のチャンピオンに勝つとは…！\nあんたたちこそ、本物の伝説だ！' : 'おめでとう！入口の「王者のかべ」にも、名前がきざまれたぞ！')])]);
}

// 王者の すがた（台本の showMon）: 3戦目の グループの リーダー（合体技の 組）か ボスの 魔物
export function champOf(enc) {
  const g = FIXED_ENCOUNTERS[enc]?.group || [];
  const lead = g.find(([sp]) => MONSTERS[sp]?.arena?.lead) || g.find(([sp]) => MONSTERS[sp]?.boss && !MONSTERS[sp]?.arena?.twin) || g[0];
  return lead?.[0] || null;
}

// ごほうび（キャラごと）。はじめて … first の 品と 小さなメダル / 2回目から … ゴールドと 小さなメダル 1まい
export function clearRewards(run, n) {
  const R = rankInfo(n);
  const w = run.world;
  const now = w.now();
  const out = [];
  const people = run.everyone;
  const names = people.map((m) => m.char.name);
  for (const m of people) {
    const c = m.char;
    const first = noteClear(c, n, now, names.filter((x) => x !== c.name));
    if (first) {
      for (const id of R.first.items) {
        addItem(c, id, 1);
        out.push(['sfx', 'item'], say(null, `${c.name}は${ITEMS[id].name}を手に入れた！`));
      }
      c.medalSpots = c.medalSpots && typeof c.medalSpots === 'object' ? c.medalSpots : {};
      for (let i = 1; i <= R.first.medals; i++) if (!c.medalSpots[firstMedalId(n, i)]) c.medalSpots[firstMedalId(n, i)] = now;
      out.push(['sfx', 'key'], say(null, `${c.name}は小さなメダルを${R.first.medals}枚手に入れた！`));
    } else {
      c.gold = Math.min(9999999, (c.gold || 0) + R.repeatGold);
      c.medalSpots = c.medalSpots && typeof c.medalSpots === 'object' ? c.medalSpots : {};
      c.medalSpots[nextRepeatMedal(c)] = now;
      out.push(['sfx', 'item'], say(null, `${c.name}は${fmt(R.repeatGold)}ゴールドと、小さなメダルを1枚手に入れた！`));
    }
    // 第45回: 大事な物（ランク8 の 竜王のしるし。1人 1つ）
    if (R.key && dqKeyDue(c, R.key)) {
      addItem(c, R.key, 1);
      out.push(['sfx', 'key'], say(null, `${c.name}は${ITEMS[R.key].name}を手に入れた！\n（ドラゴン系の魔物2ひきと配合すると…？）`));
    }
    w.sendSelf(m);
  }
  w.markDirty();
  return out;
}

// ───────────── 王者のかべ ─────────────
export function wallData(world, s) {
  return {
    family: world.familyName || '',
    offline: !!world.offline,
    rows: wallRows(world.data.characters),
    me: { id: s.char.id, name: s.char.name },
    ranks: ARENA_RANKS.map((R) => ({ rank: R.rank, champ: R.champ, legend: !!R.legend })),
  };
}
export async function wallOpen(run) {
  if (!(await flushOk(run))) return;
  run.batch.push(['ui', 'arenaWall', wallData(run.world, run.init)]);
  await flushOk(run);
}

// ───────────── かけ試合 ─────────────
// 4ひきを えらぶ（同じ 魔物は 出ない）
export function makeLineup(rng) {
  const pool = BET_POOL.filter((sp) => MONSTERS[sp]);
  const out = [];
  while (out.length < 4 && pool.length) out.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  return out;
}

// オッズ: 4ひきの どの 組も 1対1を ODDS_TRIES 回 ためして 勝つ わりあいを 出し、トーナメントの 優勝の わりあいに する
export function lineupChances(lineup, rng) {
  const pw = lineup.map(() => lineup.map(() => 0.5));
  for (let i = 0; i < lineup.length; i++) {
    for (let j = i + 1; j < lineup.length; j++) {
      let w = 0;
      for (let k = 0; k < ODDS_TRIES; k++) if (betDuel(rng, lineup[i], lineup[j], { log: false }).winner === 0) w++;
      pw[i][j] = duelRate(w, ODDS_TRIES);
      pw[j][i] = 1 - pw[i][j];
    }
  }
  return winChances(pw);
}
export const lineupOdds = (lineup, rng) => lineupChances(lineup, rng).map(oddsOf);

// 1対1（本物の 戦いの しくみ）。片方は「みかたの がわ」に 入れて、魔物の AI で 動かす（どちらが 入るかは 運）
export function betDuel(rng, spA, spB, { log = true } = {}) {
  const b = new Battle({ rng, allies: [], enemies: [spA, spB], canFlee: false, bg: 'arena', enemyMod: (m) => scaleEnemy(m, BET_LV) });
  const [ea, eb] = b.enemies;
  const flip = rng.chance(0.5) ? eb : ea;
  // みかたの がわの 決まりを 魔物と おなじに（会心・MP・呪文と 回復の 強さ）
  Object.assign(flip, { side: 'ally', flip: true, controller: 'bet', auto: false, penChar: { job: null, jobs: {} }, use: null, abilities: [], hiraNew: [], crit: 1 / 64 - 1 / 28, maxMp: 9999, mp: 9999 });
  const scale = enemyFixedScale({ side: 'enemy', species: flip.species, lv: flip.lv });
  const calcMagic = b.calcMagic.bind(b);
  b.calcMagic = (c, t, eff, pow = 1, est = false) => calcMagic(c, t, eff, c.flip ? pow * scale : pow, est);
  const heal = b.heal.bind(b);
  b.heal = (c, t, eff, ev, pow) => heal(c, t, eff, ev, c.flip ? pow * scale : pow);
  // みかたの がわの 魔物から 見た 戦い（敵と みかたを 入れかえる）
  const view = new Proxy(b, {
    get(t, k) {
      if (k === 'aliveAllies') return () => t.aliveEnemies();
      if (k === 'aliveEnemies') return () => t.aliveAllies();
      if (k === 'allies') return t.enemies;
      if (k === 'enemies') return t.allies;
      const v = Reflect.get(t, k, t);
      return typeof v === 'function' ? v.bind(t) : v;
    },
  });
  const lines = [];
  let real = 0;
  while (!b.over && real < 4 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const ev of evs) {
      if (!log || (ev.t !== 'act' && ev.t !== 'msg') || !ev.lines?.length) continue;
      lines.push({ text: ev.lines.slice(0, 4).join('\n'), hp: [ea.hp, eb.hp] });
    }
    if (flip.alive && flip.ready && !b.over && !b.pendingEnd) b.enqueue(flip, decideMonster(view, flip));
  }
  let winner;
  // win … 敵の がわが ぜんめつ（みかたの がわに 入れた 魔物の 勝ち）/ lose … みかたの がわが たおれた
  if (b.result?.outcome === 'win') winner = flip === ea ? 0 : 1;
  else if (b.result?.outcome === 'lose') winner = flip === ea ? 1 : 0;
  else winner = ea.hp / ea.maxHp >= eb.hp / eb.maxHp ? 0 : 1; // 時間ぎれ: HPの わりあいが 多い ほう
  return { winner, lines, hp: [ea.hp, eb.hp], maxHp: [ea.maxHp, eb.maxHp] };
}

// トーナメント（1回戦 2つ → 決勝）。けっかの ようすは 1つの 戦いで 6行まで（はじめの 4行と さいごの 2行）
export function betTournament(rng, lineup) {
  const bouts = [];
  const winners = [];
  for (const [i, j] of BET_PAIRS) {
    const d = betDuel(rng, lineup[i], lineup[j]);
    const w = d.winner === 0 ? i : j;
    winners.push(w);
    bouts.push({ a: i, b: j, winner: w, maxHp: d.maxHp, lines: shortLines(d.lines) });
  }
  const [i, j] = winners;
  const d = betDuel(rng, lineup[i], lineup[j]);
  const champ = d.winner === 0 ? i : j;
  bouts.push({ a: i, b: j, winner: champ, final: true, maxHp: d.maxHp, lines: shortLines(d.lines) });
  return { bouts, champ };
}
function shortLines(lines) {
  if (lines.length <= 6) return lines;
  return [...lines.slice(0, 4), { text: '…', hp: lines[lines.length - 3].hp }, ...lines.slice(-2)];
}

// かけ試合の 係
export async function betDesk(run) {
  const c = run.init.char;
  await run.runSteps([
    say(BETMAN, 'ここは、モンスターのかけ試合！\n4ひきの魔物が戦って、最後まで勝ちのこる1ぴきを当てるんだ。'),
    ['choice', 'かけ試合をする？', ['かけ試合をする', 'きまりを聞く', 'やめる'], [
      [['call', betRound]],
      [
        say(BETMAN, '1回戦は「1ばん対2ばん」と「3ばん対4ばん」。\n勝った2ひきが、決勝で戦うぞ。'),
        say(BETMAN, 'オッズは、魔物の強さで決まる。\n弱そうな魔物ほど、当たった時のゴールドが大きいぞ。'),
        say(BETMAN, `かけられるのは、${BET_AMOUNTS.map((x) => `${fmt(x)}G`).join('・')}。\n当たると、かけたゴールド×オッズがもらえる！`),
        say(BETMAN, `（${c.name}の持っているゴールド：${fmt(c.gold || 0)}G）`),
      ],
      [say(BETMAN, 'また来てくれよな！')],
    ]],
  ]);
}

export async function betRound(run) {
  const w = run.world;
  const c = run.init.char;
  const lineup = makeLineup(w.rng);
  const odds = lineupOdds(lineup, w.rng);
  const card = lineup.map((sp, i) => ({ sp, name: MONSTERS[sp].name, odds: odds[i] }));
  if (!(await flushOk(run))) return;
  run.batch.push(['ui', 'arenaCard', { card, pairs: BET_PAIRS }]);
  let pick = -1, bet = 0;
  await run.runSteps([['choice', 'どの魔物にかける？', [...card.map((x, i) => `${i + 1}ばん ${x.name}（${x.odds}倍）`), 'やめる'], [
    ...card.map((_, i) => [['call', () => { pick = i; }]]),
    [],
  ]]]);
  if (pick < 0 || run.aborted) {
    await run.runSteps([say(BETMAN, 'また来てくれよな！')]);
    return;
  }
  const amounts = BET_AMOUNTS.filter((x) => x <= (c.gold || 0));
  if (!amounts.length) {
    await run.runSteps([say(BETMAN, `おっと、ゴールドが足りないようだ。\n（${fmt(BET_AMOUNTS[0])}Gから、かけられるよ）`)]);
    return;
  }
  await run.runSteps([['choice', `${card[pick].name}に、いくらかける？（持っているゴールド：${fmt(c.gold || 0)}G）`, [...amounts.map((x) => `${fmt(x)}G`), 'やめる'], [
    ...amounts.map((x) => [['call', () => { bet = x; }]]),
    [],
  ]]]);
  if (!bet || run.aborted || (c.gold || 0) < bet) {
    await run.runSteps([say(BETMAN, 'また来てくれよな！')]);
    return;
  }
  c.gold -= bet;
  w.sendSelf(run.init);
  const t = betTournament(w.rng, lineup);
  const hit = t.champ === pick;
  const win = payout(bet, card[pick].odds, hit);
  if (win) c.gold = Math.min(9999999, c.gold + win);
  const rec = arenaRecord(c);
  c.arena = { ...(c.arena && typeof c.arena === 'object' ? c.arena : {}), r: rec.r, rep: rec.rep, bets: (c.arena?.bets || 0) + 1, betWins: (c.arena?.betWins || 0) + (hit ? 1 : 0) };
  w.markDirty();
  await run.runSteps([say(BETMAN, `${card[pick].name}に${fmt(bet)}G！\nさあ、かけ試合のはじまりだ！`)]);
  if (!(await flushOk(run))) return;
  run.batch.push(['ui', 'arenaBout', { card, bouts: t.bouts, champ: t.champ, pick, bet, win }]);
  if (!(await flushOk(run))) return;
  w.sendSelf(run.init);
  await run.runSteps([
    hit ? ['sfx', 'coin'] : ['sfx', 'buzz'],
    say(BETMAN, hit ? `大当たり！！\n${card[t.champ].name}の優勝だ！` : `${card[t.champ].name}の優勝！\nざんねん、はずれだ…。`),
    ...(hit ? [say(null, `${c.name}は${fmt(win)}ゴールドを手に入れた！`)] : []),
    ['choice', 'もう1回かける？', ['もう1回', 'やめる'], [[['call', betRound]], [say(BETMAN, 'また来てくれよな！')]]],
  ]);
}

// だいほん（data/story-arena.js）から よぶ しょり
Object.assign(ARENA_HOOKS, { desk: arenaDesk, bet: betDesk, wall: wallOpen });

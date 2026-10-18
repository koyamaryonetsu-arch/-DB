// 合体技の 強さの たしかめ（ボスの 勝率が はね上がらないか）
// つかいかた: node tools/sim-dual.mjs [回数]
//   ふつうの 動き（オートと おなじ 考えで 動く。合体技を 使わない）と、出せる 合体技を いつも 使う パーティー（よやくも する）を くらべる。
//   パーティーは tools/sim.js と おなじ（戦士・僧侶・魔法使い・武闘家。第3章から ユキナ・第4章 Step 6 から サラ）
//   LOG=1 … 1回だけ ようすを 出す
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal } from '../public/js/shared/stats.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { dualPower, memberPower, DUAL_BOSS_CAP } from '../public/js/shared/battle-dual.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeChar, withSara } from './sim.js';

const N = Number(process.argv[2] || 30);
const PARTY = (lv, jlv, tier = null) => [
  makeChar('warrior', lv, jlv, 'せんし', tier), makeChar('priest', lv, jlv, 'そうりょ', tier),
  makeChar('mage', lv, jlv, 'まほう', tier), makeChar('monk', lv, jlv, 'ぶとう', tier),
];
const withYukina = (party, lv, tier) => {
  const y = makeChar('priest', lv, 7, 'ユキナ', tier);
  y.tactics = 'heal';
  return [...party, y];
};
const groupOf = (enc) => FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
const hurts = (t) => t.parts.some((p) => p.type === 'power');
const hurtsEff = (e) => !!e && (e.type === 'phys' || e.type === 'magic' || (e.type === 'multi' && (e.parts || []).some(hurtsEff)));

// 合体技を えらぶ（ふつうの オートが 攻撃する ときだけ、かわりに 合体技。人数の 多い ダメージの 技から。
// 仲間の HPが へっている・大技の 前ぶれ・MPが のこり 少なく なる ときは 使わない）
function plan(b, a, used) {
  const cmd = decideAlly(b, a);
  const ab = cmd.type === 'ability' ? ABILITIES[cmd.id] : null;
  const offensive = cmd.type === 'attack' || (ab && hurtsEff(ab.effect));
  if (!offensive) return false;
  if (b.aliveAllies().some((x) => x.hp < x.maxHp * 0.55) || b.allies.some((x) => !x.alive && !x.fled)) return false;
  if (b.aliveEnemies().some((e) => e.telegraph)) return false;
  const opts = b.dualOptionsFor(a, null, false, true).filter((o) => {
    const t = DUAL_TECHS[o.id];
    if (!hurts(t)) return false;
    const ms = [a, ...o.partners.map((id) => b.get(id))];
    // 回復役（僧侶）は、みんなの HPが 多い ときだけ さそう。3人・4人技は 仲間の ゲージが 半分 たまっている とき
    if (ms.some((m) => m.job === 'priest') && b.aliveAllies().some((x) => x.hp < x.maxHp * 0.8)) return false;
    if (o.size >= 3 && ms.slice(1).some((m) => !m.ready && !m.queued && m.atb < 50)) return false;
    return ms.every((m, i) => m.mp - o.mp[i] >= m.maxMp * 0.25);
  });
  // この 敵に どれだけ 当たるか（見つもり）÷ 出す 人が 別々に 動いた ときの 見つもり
  const foes = b.aliveEnemies().filter((e) => !e.burrow && !(b.knowsMirage && e.clone));
  const main = foes.find((e) => e.boss) || foes[0];
  if (!main) return false;
  const gain = (o) => {
    const t = DUAL_TECHS[o.id];
    const by = o.who.map((id) => b.get(id));
    let got = 0, solo = 0;
    for (const m of by) solo += memberPower(b, m, m.abilities, main);
    for (const p of t.parts) {
      if (p.type !== 'power') continue;
      const el = p.elementFrom !== undefined ? o.element : p.element;
      const r = el && el !== 'phys' ? main.resist?.[el] ?? 1 : 1;
      got += dualPower(b, by, main, p, o.size) * r * ((p.target || t.target) === 'enemies' ? Math.min(foes.length, 2) * 0.8 : 1);
    }
    return got / Math.max(1, solo);
  };
  const scored = opts.map((o) => [gain(o), o]).filter(([g]) => g >= 1.3).sort((x, y) => y[0] - x[0]);
  const best = scored[0]?.[1];
  if (!best) return false;
  const foe = b.aliveEnemies().find((e) => e.boss) || b.aliveEnemies()[0];
  const r = b.command(a.id, { type: 'dual', id: best.id, partner: best.partner, partners: best.partners, target: foe?.id }, 'sim');
  if (r.ok) used[best.id] = (used[best.id] || 0) + 1;
  return r.ok;
}

export function runDual(party, enemies, { seed = 1, boss = true, duals = false, log = false, carry = false, ...flags } = {}) {
  const b = new Battle({
    rng: makeRng(seed), boss, canFlee: false, song: flags.song,
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: false, tactics: c.tactics || 'balanced' })),
    enemies,
  });
  for (const k of ['knowsMirage', 'knowsTemple', 'knowsBurrow', 'focusBoss']) if (flags[k]) b[k] = true;
  const used = {};
  let real = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    if (log) for (const e of evs) if (e.t === 'act' || e.t === 'msg' || e.t === 'dualWait') console.log('  ' + (e.lines || []).join(' / '));
    for (const a of b.allies) {
      if (!a.ready || !a.alive) continue;
      // ゲストの ユキナ・サラは オートの まま（合体技には さそえる）
      if (!duals || a.name === 'ユキナ' || a.name === 'サラ' || !plan(b, a, used)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  if (carry) b.allies.forEach((x, i) => { party[i].hp = x.alive ? x.hp : 0; party[i].mp = x.mp; });
  return { outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000), used, hpLeft: b.allies.reduce((s, x) => s + x.hp, 0) / b.allies.reduce((s, x) => s + x.maxHp, 0) };
}

const BOSSES = [
  ['treant', 6, 3], ['goldoon', 10, 6], ['goldoon', 12, 7], ['giant_squid', 15, 8], ['storm_general', 20, 10],
  ['blizzard_mammoth', 20, 10, 14, 'yukina'], ['magma_golem', 23, 10, 20], ['flame_knight', 25, 10, 23], ['trial_guardian', 27, 10, 23],
  ['armor_scorpion', 31, 10, 23], ['mummy_king', 33, 10, 33, null, { focusBoss: true }], ['sand_whale', 36, 10, 33, 'sara', { knowsBurrow: true }],
  ['morgana', 38, 10, 38, 'sara', { knowsMirage: true, knowsTemple: true }],
];

function party(lv, jlv, tier, guest) {
  const p = PARTY(lv, jlv, tier);
  if (guest === 'yukina') return withYukina(p, lv, tier);
  if (guest === 'sara') return withSara(p, lv);
  return p;
}

// ───── 第31回: ミナデイン（合体技）の 強さ: node tools/sim-dual.mjs [回数] minadein ─────
// ボスの さいだいHPの 何%を 1回で けずるか（見つもり。ボスの 雷の 効きぐあいも 入る）を、ほかの 合体技と くらべる。
// ボスへは 1回で さいだいHPの DUAL_BOSS_CAP（ミナデインは bossCap）まで。（ ）の 中は 上限の 前の 見つもり
//   勇者＋基本職 … 勇者・戦士・僧侶・魔法使い（いちばん よく ある 形。「あと 3人は だれでも」）
//   ロト＋超級職 … ロトの勇者・竜の騎士・ゴッドハンド・大魔道士（いちばん 強い 形）
//   フィナーレ … バトルマスター・聖拳士・賢者・パラディン の グランドフィナーレ（上級職 4人）
const master = (c, j) => { c.jobs[j] = { lv: 10, b: 999 }; };
const chain = (c, j) => {
  for (const r of JOBS[j].req || []) { master(c, r); chain(c, r); }
  if (JOBS[j].reqSuper) { master(c, 'god_hand'); master(c, 'archmage'); }
};
// gear … 装備を かりる 基本職（GEAR は 基本職の ぶん だけ）
function advChar(job, gear, lv, tier, name) {
  const c = makeChar(gear, lv, 10, name, tier);
  chain(c, job);
  master(c, job);
  c.job = job;
  fullHeal(c);
  return c;
}
const MINA_BOSSES = [['flame_witch_true', 30, 23], ['armor_scorpion', 31, 23], ['mummy_king', 34, 33], ['sand_whale', 36, 33], ['zaid_demon', 37, 33],
  ['morgana', 38, 38], ['morgana_true', 38, 38], ['argos', 42, 42], ['lab_dragon', 45, 45]];
const MINA_PARTIES = {
  '勇者＋基本職': [['hero', 'warrior'], ['warrior', 'warrior'], ['priest', 'priest'], ['mage', 'mage']],
  'ロト＋超級職': [['loto_hero', 'warrior'], ['dragon_knight', 'warrior'], ['god_hand', 'monk'], ['archmage', 'mage']],
  'フィナーレ': [['battlemaster', 'warrior'], ['holyfist', 'monk'], ['sage', 'mage'], ['paladin', 'priest']],
};
export function minadeinCheck(enc, lv, tier, key, seed = 1) {
  const party = MINA_PARTIES[key].map(([j, g], i) => advChar(j, g, lv, tier, `${JOBS[j].name}${i}`));
  const b = new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim' })), enemies: groupOf(enc) });
  for (const a of b.allies) { a.weaponCat = 'sword'; a.ready = true; a.atb = 100; }
  const boss = b.enemies.find((e) => e.boss) || b.enemies[0];
  const opts = b.dualOptionsFor(b.allies[0]);
  const est = (id) => {
    const o = opts.find((x) => x.id === id);
    if (!o) return null;
    const t = DUAL_TECHS[id];
    const by = o.who.map((wid) => b.get(wid));
    let d = 0;
    for (const p of t.parts) {
      if (p.type !== 'power') continue;
      const el = p.elementFrom !== undefined ? o.element : p.element;
      const r = el && el !== 'phys' ? boss.resist?.[el] ?? 1 : 1;
      d += dualPower(b, by, boss, p, o.size) * r;
    }
    return { raw: d / boss.maxHp, v: Math.min(d / boss.maxHp, t.bossCap ?? DUAL_BOSS_CAP[o.size]) };
  };
  // ほかの 敵1体の 合体技で いちばん 強い もの
  let best = null;
  for (const o of opts) {
    const t = DUAL_TECHS[o.id];
    if (o.id === 'dt_minadein' || t.target !== 'enemy') continue;
    const v = est(o.id);
    if (v !== null && (!best || v.v > best.v.v)) best = { id: o.id, v };
  }
  return { mina: est('dt_minadein'), finale: est('dt_finale'), best, hp: boss.maxHp };
}

// ほんとうの 戦い: 勇者・戦士・僧侶・魔法使いで、ふつう（合体技なし）と 合体技（ミナデインも）を くらべる
const HERO_BOSSES = [['zaid_demon', 37, 33], ['morgana_true', 38, 38], ['argos', 42, 42], ['lab_dragon', 45, 45]];
function heroParty(lv, tier) {
  return MINA_PARTIES['勇者＋基本職'].map(([j, g], i) => advChar(j, g, lv, tier, `${JOBS[j].name}${i}`));
}

// ───── 第35回: タグの 合体技の 強さ: node tools/sim-dual.mjs [回数] tags ─────
// 作品を またぐ パーティー（タグの 合体技が たくさん 出せる）で、ふつう（合体技なし）と 合体技を くらべる。
// 勝つ わりあいが はね上がらないか・ボスが 早く たおれすぎないか
const TAG_PARTIES = {
  '剣士3人＋パラディン': [['samurai', 'warrior'], ['himura', 'warrior'], ['kisatsu', 'warrior'], ['paladin', 'priest']],
  'ライバル・師弟': [['hero', 'warrior'], ['konoha', 'monk'], ['meitantei', 'mage'], ['hokage', 'monk']],
  '空と変身': [['dragon_knight', 'warrior'], ['doraemon', 'monk'], ['harry', 'mage'], ['sailor_moon', 'priest']],
};
const TAG_BOSSES = [['armor_scorpion', 31, 23], ['mummy_king', 34, 33, { focusBoss: true }], ['zaid_demon', 37, 33], ['argos', 42, 42], ['lab_dragon', 45, 45]];

if (process.argv[1].endsWith('sim-dual.mjs') && process.argv[3] === 'tags') {
  for (const [key, list] of Object.entries(TAG_PARTIES)) {
    console.log(`■ ${key}（${list.map(([j]) => JOBS[j].name).join('・')}）`);
    console.log(`${'ボス'.padEnd(26)} ふつう  合体技  （平均秒 ふつう→合体技）  よく使った合体技`);
    for (const [enc, lv, tier, flags = {}] of TAG_BOSSES) {
      const res = { off: [], on: [] };
      for (let i = 0; i < N; i++) {
        for (const duals of [false, true]) {
          const p = list.map(([j, g], k) => advChar(j, g, lv, tier, `${JOBS[j].name}${k}`));
          res[duals ? 'on' : 'off'].push(runDual(p, groupOf(enc), { seed: 777 + i * 7919, duals, ...flags }));
        }
      }
      const rate = (l) => `${String(Math.round((l.filter((r) => r.outcome === 'win').length / l.length) * 100)).padStart(3)}%`;
      const sec = (l) => Math.round(l.reduce((s, r) => s + r.seconds, 0) / l.length);
      const used = {};
      for (const r of res.on) for (const [k, v] of Object.entries(r.used)) used[k] = (used[k] || 0) + v;
      const top = Object.entries(used).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${DUAL_TECHS[k].name}${(v / N).toFixed(1)}`).join(' ');
      console.log(`${`${enc} Lv${lv}`.padEnd(28)} ${rate(res.off)}   ${rate(res.on)}   （${sec(res.off)}→${sec(res.on)}秒）  ${top}`);
    }
  }
} else if (process.argv[1].endsWith('sim-dual.mjs') && process.argv[3] === 'minadein') {
  console.log('ほんとうの 戦い（勇者・戦士・僧侶・魔法使い）');
  console.log(`${'ボス'.padEnd(26)} ふつう  合体技  （平均秒 ふつう→合体技）  よく使った合体技`);
  for (const [enc, lv, tier] of HERO_BOSSES) {
    const res = { off: [], on: [] };
    for (let i = 0; i < N; i++) {
      for (const duals of [false, true]) {
        const flags = enc === 'morgana_true' ? { knowsTemple: true, song: true } : {};
        res[duals ? 'on' : 'off'].push(runDual(heroParty(lv, tier), groupOf(enc), { seed: 777 + i * 7919, duals, ...flags }));
      }
    }
    const rate = (l) => `${String(Math.round((l.filter((r) => r.outcome === 'win').length / l.length) * 100)).padStart(3)}%`;
    const sec = (l) => Math.round(l.reduce((s, r) => s + r.seconds, 0) / l.length);
    const used = {};
    for (const r of res.on) for (const [k, v] of Object.entries(r.used)) used[k] = (used[k] || 0) + v;
    const top = Object.entries(used).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${DUAL_TECHS[k].name}${(v / N).toFixed(1)}`).join(' ');
    console.log(`${`${enc} Lv${lv}`.padEnd(28)} ${rate(res.off)}   ${rate(res.on)}   （${sec(res.off)}→${sec(res.on)}秒）  ${top}`);
  }
  console.log('');
  console.log('1回で ボスの さいだいHPの 何%（見つもり）');
  const pct = (e) => (!e ? '  -  ' : `${String(Math.round(e.v * 100)).padStart(3)}%（${Math.round(e.raw * 100)}）`);
  console.log(`${'ボス'.padEnd(24)} ${Object.keys(MINA_PARTIES).map((k) => `${k}（ミナデイン／ほかで いちばん）`).join('  ')}`);
  for (const [enc, lv, tier] of MINA_BOSSES) {
    const cols = Object.keys(MINA_PARTIES).map((key) => {
      const r = minadeinCheck(enc, lv, tier, key);
      const other = r.best ? `${pct(r.best.v)} ${DUAL_TECHS[r.best.id].name}` : '-';
      return `${pct(r.mina)}／${other}`;
    });
    console.log(`${`${enc} Lv${lv}`.padEnd(24)} ${cols.join('   ')}`);
  }
} else if (process.argv[1].endsWith('sim-dual.mjs')) {
  console.log(`${'ボス'.padEnd(26)} ふつう  合体技  （平均秒 ふつう→合体技）  よく使った合体技`);
  for (const [enc, lv, jlv, tier = null, guest = null, flags = {}] of BOSSES) {
    const res = { off: [], on: [] };
    for (let i = 0; i < N; i++) {
      for (const duals of [false, true]) {
        const seed = 777 + i * 7919;
        const p = party(lv, jlv, tier, guest);
        let r = runDual(p, groupOf(enc), { seed, duals, carry: enc === 'morgana', ...flags });
        if (enc === 'morgana' && r.outcome === 'win') {
          for (const c of p) fullHeal(c);
          const r2 = runDual(p, groupOf('morgana_true'), { seed: seed + 1, duals, song: true, ...flags });
          r = { ...r2, seconds: r.seconds + r2.seconds, used: { ...r.used, ...r2.used } };
        }
        res[duals ? 'on' : 'off'].push(r);
      }
    }
    const rate = (l) => `${String(Math.round((l.filter((r) => r.outcome === 'win').length / l.length) * 100)).padStart(3)}%`;
    const sec = (l) => Math.round(l.reduce((s, r) => s + r.seconds, 0) / l.length);
    const used = {};
    for (const r of res.on) for (const [k, v] of Object.entries(r.used)) used[k] = (used[k] || 0) + v;
    const top = Object.entries(used).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${DUAL_TECHS[k].name}${(v / N).toFixed(1)}`).join(' ');
    console.log(`${`${enc} Lv${lv}${guest ? '＋' + guest : ''}`.padEnd(28)} ${rate(res.off)}   ${rate(res.on)}   （${sec(res.off)}→${sec(res.on)}秒）  ${top}`);
  }
  if (process.env.LOG) runDual(party(20, 10), groupOf('storm_general'), { seed: 1, duals: true, log: true });
}

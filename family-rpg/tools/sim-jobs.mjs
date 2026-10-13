// 第33回: 職業の 強さくらべ（新しい 職業が 強すぎ・弱すぎに ならないか）
// つかいかた: node tools/sim-jobs.mjs [回数] [solo|boss|teacher|pot] [職業の id,…]
//   solo … 1人で 60びょう 戦った ときの ダメージ（オートの 作戦「バランス」。かかしの 魔物 3体。守りは ふつう・属性の 弱点なし）。
//           同じ ランクの 職業の 中で 何番めか と、まん中の 職業との くらべ（%）
//   boss … その 職業 ＋ 戦士・僧侶・魔法使い の 4人で ボス（BOSS=flame_knight〈第3章・Lv25・ランク5。ふつう〉か argos〈第5章・Lv42・ランク7〉）。勝率と 時間（同じ ランクの まん中と くらべる）
//   teacher … 3年B組の担任の「学校の 仲間」: 学校の 職業の 仲間 0〜4人で 技の 力が どれだけ 上がるか（愛のお説教の ダメージ。4人めは 数えない）
//   装備は その 職業が 装備できる 店の 品（レア度なし）で、ランク（solo は 第3〜4章の 5〜6、boss は 7）の いちばん よい もの
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, canEquip } from '../public/js/shared/stats.js';
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL, SCHOOL_JOBS } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { makeRng } from '../public/js/shared/rng.js';
import { runBattle } from './sim.js';

const N = Number(process.argv[2] || 20);
// ほかの ファイルから jobChar だけ 使う ときは 何も しない
const MAIN = process.argv[1].endsWith('sim-jobs.mjs');
const MODE = MAIN ? process.argv[3] || 'all' : 'none';
const ONLY = process.argv[4] ? process.argv[4].split(',') : null;
const NEW = ['magician', 'kaito', 'kaito_kid', 'wizard_student', 'harry', 'homeroom_3b', 'alchemist', 'state_alchemist', 'fullmetal', 'sailor_soldier', 'sailor_moon'];
const tierOf = (j) => JOBS[j].tier || 0;

// その 職業の 道を ぜんぶ マスター（伝説の「ほかの 超級職」は ゴッドハンド）
function masterChain(c, jid) {
  for (const r of JOBS[jid].req || []) {
    c.jobs[r] = { lv: JOB_MAX_LEVEL, b: 999 };
    masterChain(c, r);
  }
  if (JOBS[jid].reqSuper) c.jobs.god_hand = { lv: JOB_MAX_LEVEL, b: 999 };
}

// 店の 品（レア度なし・★なし）で、ランク R までの いちばん よい 装備
const SHOP_GEAR = Object.entries(ITEMS).filter(([id, it]) => it && !it.base && !it.star && !it.src && it.price > 0 && !(it.rarity > 0)
  && ['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type)).map(([id]) => id);
function bestGear(job, R) {
  const m = JOBS[job].mods;
  const b = (it, k) => it.bonus?.[k] || 0;
  const score = (it) => {
    const extra = b(it, 'mag') * m.mag + b(it, 'heal') * m.heal * 0.5 + b(it, 'agi') * 0.3 + b(it, 'str') * m.str + b(it, 'def') * 0.5 + b(it, 'hp') * 0.2;
    if (it.type === 'weapon') return (it.atk || 0) * m.str + extra;
    return (it.def || 0) + extra;
  };
  const eq = { weapon: null, armor: null, shield: null, head: null, acc: null };
  for (const slot of Object.keys(eq)) {
    const list = SHOP_GEAR.filter((id) => ITEMS[id].type === slot && ITEMS[id].rank <= R && canEquip(job, id));
    list.sort((x, y) => score(ITEMS[y]) - score(ITEMS[x]));
    eq[slot] = list[0] || null;
  }
  return eq;
}

export function jobChar(job, lv, R, name = job) {
  const c = newCharacter({ id: name, name, job: 'warrior', look: { body: JOBS[job].body ?? 0 } });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  c.jobs[job] = { lv: JOB_MAX_LEVEL, b: 999 };
  c.job = job;
  c.equip = bestGear(job, R);
  fullHeal(c);
  return c;
}

// 1人で かかしと ms ミリびょう（ダメージの 合計。はかいの「消し去る」は 数えない）
function soloDamage(job, lv, R, seed, ms = SOLO_MS) {
  const c = jobChar(job, lv, R);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, auto: true, kind: 'support', tactics: 'balanced' }], enemies: ['rockman', 'rockman', 'rockman'], canFlee: false });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 999999; e.resist = {}; }
  let dmg = 0;
  for (let t = 0; t < ms && !b.over; t += 50) {
    for (const e of b.tick(50)) if (e.t === 'act' && e.id === b.allies[0].id) for (const r of e.results || []) if (r.dmg > 0 && r.dmg < 100000 && b.enemies.some((x) => x.id === r.id)) dmg += r.dmg;
  }
  return dmg;
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const LV = [22, 30, 38, 44];
// SOLO … 戦う 時間（びょう。みじかいと MPの 多い 職業が 強く、長いと MPの つづく 職業が 強い）
const SOLO_MS = Number(process.env.SOLO || 60) * 1000;
const RANK = [5, 5, 6, 6];

if (MODE === 'all' || MODE === 'solo') {
  console.log(`■ 1人の ダメージ（${SOLO_MS / 1000}びょう・かかし3体・${N}回の へいきん）`);
  for (let t = 0; t < 4; t++) {
    const jobs = ALL_JOBS.filter((j) => tierOf(j) === t);
    const res = jobs.map((j) => [j, [...Array(N).keys()].reduce((s, i) => s + soloDamage(j, LV[t], RANK[t], 100 + i), 0) / N]);
    const med = median(res.map(([, d]) => d));
    res.sort((a, b) => b[1] - a[1]);
    console.log(`ランク${t}（Lv${LV[t]}・装備ランク${RANK[t]}・${jobs.length}職業） まん中 ${Math.round(med)}  いちばん上 ${JOBS[res[0][0]].name} ${Math.round(res[0][1])}  いちばん下 ${JOBS[res.at(-1)[0]].name} ${Math.round(res.at(-1)[1])}`);
    for (const [j, d] of res) {
      if (!NEW.includes(j) && !(ONLY || []).includes(j)) continue;
      const rank = res.findIndex(([x]) => x === j) + 1;
      console.log(`  ${JOBS[j].name.padEnd(12, '　')} ${String(Math.round(d)).padStart(6)}  ${rank}/${res.length}番め  まん中の ${Math.round((d / med) * 100)}%`);
    }
  }
}

if (MODE === 'all' || MODE === 'boss') {
  // BOSS=flame_knight（第3章の 炎の騎士フレアード。Lv25・店の ランク5。ふつう）/ BOSS=argos（第5章の 星の番人アルゴス。Lv42・ランク7・見通しの目を 知っている 人）
  const P = { flame_knight: { lv: 25, R: 5, name: '炎の騎士フレアード', opts: {} }, argos: { lv: 42, R: 7, name: '星の番人アルゴス', opts: { knowsArgos: true } } }[process.env.BOSS || 'flame_knight'];
  const group = FIXED_ENCOUNTERS[process.env.BOSS || 'flame_knight'].group.flatMap(([sp, n]) => Array(n).fill(sp));
  console.log(`■ 4人（その 職業＋戦士・僧侶・魔法使い）で ${P.name} Lv${P.lv}・店の ランク${P.R}（${N}回）`);
  const run = (j) => {
    let w = 0, sec = 0;
    for (let i = 0; i < N; i++) {
      const party = [jobChar(j, P.lv, P.R, 'x'), jobChar('warrior', P.lv, P.R, 'せんし'), jobChar('priest', P.lv, P.R, 'そうりょ'), jobChar('mage', P.lv, P.R, 'まほう')];
      const r = runBattle(party, group, { seed: 500 + i, boss: true, ...P.opts });
      if (r.outcome === 'win') w++;
      sec += r.seconds;
    }
    return [w / N, sec / N];
  };
  for (let t = 0; t < 4; t++) {
    const jobs = ALL_JOBS.filter((j) => tierOf(j) === t);
    const res = jobs.map((j) => [j, ...run(j)]);
    const medW = median(res.map((r) => r[1]));
    const medS = median(res.map((r) => r[2]));
    console.log(`ランク${t}: 勝率の まん中 ${Math.round(medW * 100)}%・時間の まん中 ${Math.round(medS)}びょう（${jobs.length}職業。いちばん はやい ${JOBS[res.sort((a, b) => a[2] - b[2])[0][0]].name}）`);
    for (const [j, w, s] of res) if (NEW.includes(j) || (ONLY || []).includes(j)) console.log(`  ${JOBS[j].name.padEnd(12, '　')} 勝率 ${String(Math.round(w * 100)).padStart(3)}%  ${Math.round(s)}びょう`);
  }
}

if (MODE === 'all' || MODE === 'teacher') {
  console.log('■ 3年B組の担任: 学校の 仲間の 人数と 愛のお説教の ダメージ（へいきん）');
  for (let n = 0; n <= 4; n++) {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const t = jobChar('homeroom_3b', 44, 6, '先生');
      const kids = [...Array(n).keys()].map((k) => jobChar(SCHOOL_JOBS[k], 44, 6, `生徒${k}`));
      const b = new Battle({ rng: makeRng(900 + i), allies: [{ char: t, controller: 's1' }, ...kids.map((c) => ({ char: c, auto: true, kind: 'support' }))], enemies: ['rockman'], canFlee: false });
      for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 999999; e.resist = {}; }
      for (const a of b.allies.slice(1)) a.atb = -1e9;
      const me = b.allies[0];
      for (let k = 0; k < 1200 && !me.ready; k++) b.tick(50);
      b.command(me.id, { type: 'ability', id: 'homeroom_3b_sig', target: b.enemies[0].id }, 's1');
      let got = 0;
      for (let k = 0; k < 400 && !got; k++) for (const e of b.tick(50)) if (e.t === 'act' && e.id === me.id) got = (e.results || []).reduce((s, r) => s + (r.dmg || 0), 0) || -1;
      sum += Math.max(0, got);
    }
    console.log(`  学校の 仲間 ${n}人: ${Math.round(sum / N)}`);
  }
}

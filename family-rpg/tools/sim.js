// バランス確認用シミュレーター
// つかいかた: node tools/sim.js [回数]
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, computeStats, learnedAbilities, fullHeal } from '../public/js/shared/stats.js';
import { jobExpForLevel } from '../public/js/shared/data/jobs.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { makeRng } from '../public/js/shared/rng.js';

const N = Number(process.argv[2] || 30);

// レベル帯ごとの 想定そうび
const GEAR = {
  1: { warrior: ['wood_sword', 'cloth'], monk: [null, 'cloth'], priest: ['oak_staff', 'cloth'], mage: ['oak_staff', 'cloth'], performer: ['feather_fan', 'cloth'] },
  4: { warrior: ['bronze_sword', 'travel_clothes', 'leather_shield', 'leather_hat'], monk: ['bronze_knuckle', 'martial_gi', null, 'leather_hat'], priest: ['bronze_spear', 'travel_clothes', 'leather_shield', 'leather_hat'], mage: ['oak_staff', 'wizard_robe', null, 'leather_hat'], performer: ['feather_fan', 'travel_clothes', 'leather_shield', 'leather_hat'] },
  7: { warrior: ['bronze_sword', 'chain_mail', 'scale_shield', 'leather_hat'], monk: ['bronze_knuckle', 'martial_gi', null, 'bandana'], priest: ['bronze_spear', 'leather_armor', 'scale_shield', 'leather_hat'], mage: ['oak_staff', 'wizard_robe', null, 'pointy_hat'], performer: ['feather_fan', 'leather_armor', 'scale_shield', 'bandana'] },
  10: { warrior: ['iron_sword', 'iron_armor', 'iron_shield', 'iron_helm'], monk: ['iron_claw', 'dragon_gi', null, 'bandana'], priest: ['healing_staff', 'holy_robe', 'scale_shield', 'leather_hat'], mage: ['wizard_staff', 'wizard_robe', null, 'pointy_hat'], performer: ['dancer_fan', 'leather_armor', 'scale_shield', 'bandana'] },
};

export function makeChar(job, level, jobLv, name) {
  const c = newCharacter({ id: name, name, look: {}, job });
  c.exp = expForLevel(level);
  c.level = level;
  c.jobs[job] = { lv: jobLv, exp: jobExpForLevel(jobLv) };
  const tier = level >= 10 ? 10 : level >= 7 ? 7 : level >= 4 ? 4 : 1;
  const [w, a, s, h] = GEAR[tier][job];
  c.equip = { weapon: w, armor: a, shield: s || null, head: h || null, acc: null };
  fullHeal(c);
  return c;
}

export function runBattle(party, enemyList, opts = {}) {
  const rng = makeRng(opts.seed ?? Math.floor(Math.random() * 1e9));
  const b = new Battle({
    rng,
    allies: party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: opts.tactics || 'balanced' })),
    enemies: enemyList,
    boss: !!opts.boss,
    canFlee: false,
  });
  let real = 0;
  let acts = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) if (e.t === 'act') acts++;
    if (opts.log) for (const e of evs) if (e.t === 'act' || e.t === 'msg') console.log('  ' + e.lines.join(' / '));
  }
  const allies = b.allies;
  return {
    outcome: b.result?.outcome || 'timeout',
    seconds: Math.round(real / 1000),
    acts,
    hpLeft: allies.reduce((s, a) => s + a.hp, 0) / allies.reduce((s, a) => s + a.maxHp, 0),
    deaths: allies.filter((a) => !a.alive).length,
    mpUsed: allies.reduce((s, a) => s + (a.maxMp - a.mp), 0),
  };
}

function rollGroup(table, rng) {
  const e = rng.weighted(ENCOUNTER_TABLES[table]);
  const list = [];
  for (const [sp, mn, mx] of e.group) {
    const n = rng.int(mn, mx);
    for (let i = 0; i < n; i++) list.push(sp);
  }
  return list;
}

function summarize(label, results) {
  const wins = results.filter((r) => r.outcome === 'win').length;
  const avg = (k) => (results.reduce((s, r) => s + r[k], 0) / results.length);
  console.log(`${label.padEnd(34)} 勝率 ${String(Math.round(wins / results.length * 100)).padStart(3)}%  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  MP消費${avg('mpUsed').toFixed(0)}`);
}

const PARTY = (lv, jlv) => [
  makeChar('warrior', lv, jlv, 'せんし'),
  makeChar('priest', lv, jlv, 'そうりょ'),
  makeChar('mage', lv, jlv, 'まほう'),
  makeChar('monk', lv, jlv, 'ぶとう'),
];

if (process.argv[1].endsWith('sim.js')) {
  const rng = makeRng(12345);
  const plan = [
    ['outskirts', 1, 1], ['outskirts', 2, 2], ['plains', 3, 2], ['plains', 5, 4], ['forest', 5, 4], ['forest', 7, 5],
    ['swamp', 6, 5], ['east', 7, 6], ['east', 9, 7], ['cave1', 9, 7], ['cave1', 11, 8], ['cave2', 10, 8], ['cave2', 12, 9],
  ];
  for (const [table, lv, jlv] of plan) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(runBattle(PARTY(lv, jlv), rollGroup(table, rng), { seed: i }));
    summarize(`${table} Lv${lv}`, res);
  }
  // ソロ（1人）
  for (const [table, lv, jlv, job] of [['outskirts', 1, 1, 'warrior'], ['outskirts', 1, 1, 'mage'], ['plains', 4, 3, 'warrior']]) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(runBattle([makeChar(job, lv, jlv, 'ソロ')], rollGroup(table, rng), { seed: i }));
    summarize(`ソロ ${job} ${table} Lv${lv}`, res);
  }
  // ボス
  for (const [enc, lv, jlv] of [['treant', 5, 4], ['treant', 6, 5], ['treant', 7, 6], ['goldoon', 9, 7], ['goldoon', 10, 8], ['goldoon', 11, 9], ['goldoon', 12, 10]]) {
    const res = [];
    const group = FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
    for (let i = 0; i < Math.min(N, 20); i++) res.push(runBattle(PARTY(lv, jlv), group, { seed: i, boss: true }));
    summarize(`BOSS ${enc} Lv${lv}`, res);
  }
  if (process.env.LOG) runBattle(PARTY(10, 8), ['goldoon'], { seed: 1, boss: true, log: true });
}

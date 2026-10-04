// バランス確認用シミュレーター
// つかいかた: node tools/sim.js [回数]
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, computeStats, learnedAbilities, fullHeal } from '../public/js/shared/stats.js';
import { JOBS, jobBattlesForLevel } from '../public/js/shared/data/jobs.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { makeRng } from '../public/js/shared/rng.js';

const N = Number(process.argv[2] || 30);

// レベル帯ごとの 想定そうび
const GEAR = {
  1: { warrior: ['wood_sword', 'cloth'], monk: [null, 'cloth'], priest: ['oak_staff', 'cloth'], mage: ['oak_staff', 'cloth'], performer: ['feather_fan', 'cloth'] },
  4: { warrior: ['bronze_sword', 'travel_clothes', 'leather_shield', 'leather_hat'], monk: ['bronze_knuckle', 'martial_gi', null, 'leather_hat'], priest: ['bronze_spear', 'travel_clothes', 'leather_shield', 'leather_hat'], mage: ['oak_staff', 'wizard_robe', null, 'leather_hat'], performer: ['feather_fan', 'travel_clothes', 'leather_shield', 'leather_hat'] },
  7: { warrior: ['bronze_sword', 'chain_mail', 'scale_shield', 'leather_hat'], monk: ['bronze_knuckle', 'martial_gi', null, 'bandana'], priest: ['bronze_spear', 'leather_armor', 'scale_shield', 'leather_hat'], mage: ['oak_staff', 'wizard_robe', null, 'pointy_hat'], performer: ['feather_fan', 'leather_armor', 'scale_shield', 'bandana'] },
  10: { warrior: ['iron_sword', 'iron_armor', 'iron_shield', 'iron_helm'], monk: ['iron_claw', 'dragon_gi', null, 'bandana'], priest: ['healing_staff', 'holy_robe', 'scale_shield', 'leather_hat'], mage: ['wizard_staff', 'wizard_robe', null, 'pointy_hat'], performer: ['dancer_fan', 'leather_armor', 'scale_shield', 'bandana'] },
  // 第2章（カモメ港の お店）
  14: { warrior: ['silver_sword', 'silver_mail', 'silver_shield', 'silver_helm'], monk: ['shark_fang', 'wave_gi', null, 'captain_hat'], priest: ['coral_spear', 'coral_robe', 'shell_shield', 'captain_hat'], mage: ['wave_staff', 'coral_robe', null, 'pointy_hat'], performer: ['sea_fan', 'sailor_clothes', 'shell_shield', 'captain_hat'] },
  // 第3章: 鉱山を 取りもどす まえ（カナトコで 買える 分だけ はがね・雪の 装備）
  20: { warrior: ['silver_sword', 'silver_mail', 'silver_shield', 'fur_hat'], monk: ['steel_claw', 'snow_gi', null, 'fur_hat'], priest: ['coral_spear', 'snow_robe', 'silver_shield', 'fur_hat'], mage: ['snow_staff', 'snow_robe', null, 'fur_hat'], performer: ['ice_fan', 'snow_gi', 'silver_shield', 'fur_hat'] },
  // 第3章: 鉱山の あと（はがねの 装備）
  23: { warrior: ['steel_sword', 'steel_mail', 'steel_shield', 'steel_helm'], monk: ['steel_claw', 'snow_gi', null, 'fur_hat'], priest: ['steel_spear', 'snow_robe', 'steel_shield', 'fur_hat'], mage: ['snow_staff', 'snow_robe', null, 'fur_hat'], performer: ['ice_fan', 'snow_gi', 'steel_shield', 'fur_hat'] },
};

// gearTier: そうびの だんかい（GEAR の キー。ないときは レベルで きめる。第3章は 20 / 23 を 指定する）
export function makeChar(job, level, jobLv, name, gearTier = null) {
  const c = newCharacter({ id: name, name, look: {}, job });
  c.exp = expForLevel(level);
  c.level = level;
  c.jobs[job] = { lv: jobLv, b: jobBattlesForLevel(jobLv, JOBS[job].tier) };
  const tier = gearTier || (level >= 14 ? 14 : level >= 10 ? 10 : level >= 7 ? 7 : level >= 4 ? 4 : 1);
  const [w, a, s, h] = GEAR[tier][job];
  c.equip = { weapon: w, armor: a, shield: s || null, head: h || null, acc: null };
  fullHeal(c);
  return c;
}

export function runBattle(party, enemyList, opts = {}) {
  const rng = makeRng(opts.seed ?? Math.floor(Math.random() * 1e9));
  const b = new Battle({
    rng,
    allies: party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: c.tactics || opts.tactics || 'balanced' })),
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

const PARTY = (lv, jlv, tier = null) => [
  makeChar('warrior', lv, jlv, 'せんし', tier),
  makeChar('priest', lv, jlv, 'そうりょ', tier),
  makeChar('mage', lv, jlv, 'まほう', tier),
  makeChar('monk', lv, jlv, 'ぶとう', tier),
];

// 第3章: node tools/sim.js [回数] ch3
// [出現表, レベル, 装備の だんかい]・[ボス, レベル, 装備, ユキナ（ゲスト）が いるか]
// さいごの イグニアは 2つの すがたを つづけて たたかう（あいだで ユキナが 回復）
export const CH3_ZONES = [
  ['n_snow', 19, 14], ['n_snow', 21, 14], ['n_forest', 20, 14], ['n_lake', 20, 14], ['n_ice', 20, 14], ['n_ice', 22, 14],
  ['n_mine', 22, 20], ['n_mine1', 22, 20], ['n_mine2', 23, 20], ['n_volcano', 24, 23], ['n_volc', 24, 23], ['n_volc', 26, 23],
  ['n_temple', 26, 23], ['n_peak', 25, 23], ['n_peak_out', 27, 23], ['n_peak_in', 28, 23],
];
export const CH3_BOSSES = [
  ['blizzard_mammoth', 19, 14, true], ['blizzard_mammoth', 20, 14, true], ['blizzard_mammoth', 21, 14, true],
  ['magma_golem', 22, 20], ['magma_golem', 23, 20], ['magma_golem', 24, 20],
  ['flame_knight', 24, 23], ['flame_knight', 25, 23], ['flame_knight', 26, 23],
  ['trial_guardian', 26, 23], ['trial_guardian', 27, 23], ['trial_guardian', 28, 23],
  ['flame_witch', 28, 23, true], ['flame_witch', 29, 23, true], ['flame_witch', 30, 23, true],
];
// ゲストの ユキナ（僧侶・いのちだいじに）
function withYukina(party, lv, tier) {
  const y = makeChar('priest', lv, 7, 'ユキナ', tier);
  y.tactics = 'heal';
  return [...party, y];
}

// 第4章: node tools/sim.js [回数] ch4
// Step 1 の 砂ばく（昼・夜）と 北の古井戸。装備は 第3章の はがね（ランク6は 王都で 買える Step 3 から）
export const CH4_ZONES = [
  ['s_coast', 29, 23], ['s_coast_night', 29, 23], ['s_dune', 30, 23], ['s_dune', 32, 23], ['s_oasis', 30, 23], ['s_well', 29, 23], ['s_well', 31, 23],
  ['s_dune_night', 30, 23], ['s_dune_night', 32, 23], ['s_oasis_night', 30, 23],
];
// 北の古井戸の おく（アミを かこむ 魔物。にげられない）
export const CH4_FIXED = [['well_ambush', 28, 23], ['well_ambush', 29, 23], ['well_ambush', 30, 23], ['well_ambush', 31, 23]];

// 第2章: node tools/sim.js [回数] ch2
if (process.argv[1].endsWith('sim.js') && process.argv[3] === 'ch4') {
  const rng = makeRng(444);
  for (const [table, lv, tier] of CH4_ZONES) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(runBattle(PARTY(lv, 10, tier), rollGroup(table, rng), { seed: i }));
    summarize(`${table} Lv${lv}`, res);
  }
  for (const [enc, lv, tier] of CH4_FIXED) {
    const res = [];
    const group = FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
    for (let i = 0; i < N; i++) res.push(runBattle(PARTY(lv, 10, tier), group, { seed: i }));
    summarize(`${enc} Lv${lv}`, res);
  }
} else if (process.argv[1].endsWith('sim.js') && process.argv[3] === 'ch2') {
  const rng = makeRng(777);
  // 職業レベルは 上がりやすく した ので、第2章では 基本職を ほぼ マスター している めやす
  for (const [table, lv, jlv] of [['sea', 12, 7], ['sea', 14, 8], ['isle', 12, 7], ['isle', 14, 8], ['seacave', 14, 8], ['seacave', 16, 9], ['storm', 16, 9], ['storm', 18, 10], ['tower', 17, 9], ['tower', 19, 10]]) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(runBattle(PARTY(lv, jlv), rollGroup(table, rng), { seed: i }));
    summarize(`${table} Lv${lv}`, res);
  }
  for (const [enc, lv, jlv] of [['giant_squid', 13, 7], ['giant_squid', 14, 8], ['giant_squid', 15, 8], ['giant_squid', 16, 9], ['giant_squid', 17, 9],
    ['storm_general', 17, 9], ['storm_general', 18, 10], ['storm_general', 19, 10], ['storm_general', 20, 10], ['storm_general', 21, 10], ['storm_general', 23, 10]]) {
    const res = [];
    const group = FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
    for (let i = 0; i < Math.min(N, 20); i++) res.push(runBattle(PARTY(lv, jlv), group, { seed: i, boss: true }));
    summarize(`BOSS ${enc} Lv${lv}`, res);
  }
  if (process.env.LOG) runBattle(PARTY(19, 7), [process.env.LOG], { seed: 1, boss: true, log: true });
} else if (process.argv[1].endsWith('sim.js') && process.argv[3] === 'ch3') {
  const rng = makeRng(333);
  for (const [table, lv, tier] of CH3_ZONES) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(runBattle(PARTY(lv, 10, tier), rollGroup(table, rng), { seed: i }));
    summarize(`${table} Lv${lv}`, res);
  }
  for (const [enc, lv, tier, guest] of CH3_BOSSES) {
    const res = [];
    for (let i = 0; i < Math.min(N, 30); i++) {
      const party = guest ? withYukina(PARTY(lv, 10, tier), lv, tier) : PARTY(lv, 10, tier);
      const group = FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
      let r = runBattle(party, group, { seed: i, boss: true });
      // イグニアは 真の すがたへ（ユキナの いのりで 全回復）
      if (enc === 'flame_witch' && r.outcome === 'win') {
        for (const c of party) fullHeal(c);
        r = runBattle(party, ['flame_witch_true'], { seed: i + 1000, boss: true });
      }
      res.push(r);
    }
    summarize(`BOSS ${enc} Lv${lv}${guest ? '＋ユキナ' : ''}`, res);
  }
} else if (process.argv[1].endsWith('sim.js')) {
  const rng = makeRng(12345);
  const plan = [
    ['outskirts', 1, 1], ['outskirts', 2, 1], ['plains', 3, 2], ['plains', 5, 3], ['forest', 5, 3], ['forest', 7, 4],
    ['swamp', 6, 4], ['east', 7, 4], ['east', 9, 5], ['cave1', 9, 5], ['cave1', 11, 6], ['cave2', 10, 6], ['cave2', 12, 7],
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
  // 職業レベルは 1〜10（かった たたかいの かずで あがる）
  for (const [enc, lv, jlv] of [['treant', 5, 3], ['treant', 6, 3], ['treant', 7, 4], ['goldoon', 9, 5], ['goldoon', 10, 6], ['goldoon', 11, 6], ['goldoon', 12, 7],
    ['goldoon', 16, 7], ['goldoon', 20, 7]]) {
    const res = [];
    const group = FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
    for (let i = 0; i < Math.min(N, 20); i++) res.push(runBattle(PARTY(lv, jlv), group, { seed: i, boss: true }));
    summarize(`BOSS ${enc} Lv${lv}`, res);
  }
  if (process.env.LOG) runBattle(PARTY(10, 4), ['goldoon'], { seed: 1, boss: true, log: true });
}

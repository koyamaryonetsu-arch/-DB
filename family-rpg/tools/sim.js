// バランス確認用シミュレーター
// つかいかた: node tools/sim.js [回数]
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, computeStats, learnedAbilities, fullHeal } from '../public/js/shared/stats.js';
import { JOBS, jobBattlesForLevel } from '../public/js/shared/data/jobs.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { makeRng } from '../public/js/shared/rng.js';
// 第4章 Step 6: ゲストの サラ（world/party.js の makeNpcSupportChar と おなじ つくりかた）
import { makeNpcSupportChar } from '../public/js/shared/world/party.js';
import { CH4_GUESTS } from '../public/js/shared/data/items-ch4.js';

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
  // 第4章: 王都サファラの ランク6の 店の 装備（Step 3 から）
  33: { warrior: ['shamshir', 'sand_mail', 'crescent_shield', 'sand_helm'], monk: ['tiger_claw', 'sandstorm_gi', null, 'turban'], priest: ['sand_lance', 'moon_robe', 'crescent_shield', 'turban'], mage: ['oasis_staff', 'moon_robe', null, 'turban'], performer: ['sandwind_fan', 'sandstorm_gi', 'crescent_shield', 'turban'] },
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
    // 呪文が ふうじられた 場所（王家のピラミッド 2階）
    noSpells: !!opts.noSpells,
  });
  // 反撃の構えに 気づかない（なぐり続ける）人の つよさを はかる
  if (opts.ignoreStance) b.ignoreStance = true;
  // よみがえりの呪文の 前ぶれに 気づかない（アンクを ねらって 止めない）人の つよさを はかる
  if (opts.ignoreChant) b.ignoreChant = true;
  // ボスを ねらう（ボスが たおれると 手下も くずれる ことを 知っている 人）
  if (opts.focusBoss) b.focusBoss = true;
  // まぼろしの 分身を 見ぬく（月の鏡を 使い、足もとに 影の ある 本物を ねらう 人。battle-ch4.js）
  if (opts.knowsMirage) b.knowsMirage = true;
  // 砂に もぐる 魔物を 知っている（とび出す 前に 身を 守る）/ 知らない（もぐっても 攻撃しようと して 空ぶり。前ぶれでも 守らない）。battle-ch4.js
  if (opts.knowsBurrow) b.knowsBurrow = true;
  if (opts.ignoreBurrow) b.ignoreBurrow = true;
  let real = 0;
  let acts = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) if (e.t === 'act') acts++;
    if (opts.log) for (const e of evs) if (e.t === 'act' || e.t === 'msg') console.log('  ' + e.lines.join(' / '));
  }
  const allies = b.allies;
  // carry … HP・MPを キャラに もどす（つづけて たたかう ボス。world/battles.js の finishBattle と おなじ）
  if (opts.carry) {
    allies.forEach((a, i) => {
      party[i].hp = a.alive ? a.hp : 0;
      party[i].mp = a.mp;
    });
  }
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
// Step 2: かれた地下水路（出現表）と、おくの よろい大サソリ
export const CH4_CANAL = [['s_canal', 30, 23], ['s_canal', 31, 23], ['s_canal2', 30, 23], ['s_canal2', 32, 23]];
export const CH4_BOSSES = [['armor_scorpion', 29, 23], ['armor_scorpion', 30, 23], ['armor_scorpion', 31, 23], ['armor_scorpion', 32, 23], ['armor_scorpion', 34, 23]];
// Step 4: 王家の墓の砂ばく（昼・夜）と 王家のピラミッド（2階は 呪文が ふうじられる）。装備は 王都サファラの ランク6（GEAR 33）
export const CH4_PYRAMID = [
  ['s_pdesert', 31, 33], ['s_pdesert', 33, 33], ['s_pdesert_night', 31, 33], ['s_pdesert_night', 33, 33],
  ['s_pyr1', 32, 33], ['s_pyr_b1', 32, 33], ['s_pyr2', 32, 33, true], ['s_pyr2', 33, 33, true], ['s_pyr3', 33, 33], ['s_pyr4', 33, 33],
];
export const CH4_PYR_FIXED = [['pot_ambush', 31, 33], ['pot_ambush', 33, 33]];
// ミイラの王アンク（王のミイラ兵 2体と）: レベル・装備
export const CH4_ANKU = [['mummy_king', 31, 33], ['mummy_king', 32, 33], ['mummy_king', 33, 33], ['mummy_king', 34, 33], ['mummy_king', 35, 33]];
// Step 5: 南の砂ばく（昼・夜。大臣ザイードを たおすと 行ける）と、夜の 王の間の 大臣ザイード → 砂の魔神ザイード（レベル）
export const CH4_SOUTH = [['s_sdesert', 34, 33], ['s_sdesert', 36, 33], ['s_sdesert_night', 34, 33], ['s_sdesert_night', 36, 33]];
export const CH4_ZAID = [33, 34, 35, 36, 37];

// 大臣ザイード（まぼろしの 分身 2体と）→ 砂の魔神ザイード: あいだで 月の鏡の 光（HPは ぜんぶ・たおれた 人も 起きる。
// MPは さいだいの 3わり だけ。だいほんの ['heal', { mp: 0.3 }]）。まぼろしに 使って しまった MPは もどりきらない。
// know … 知っている 人（月の鏡を 使い、影の ある 本物だけを ねらう）。知らない 人は ふつうの オート（分身にも 当てて しまう）
export function zaidFight(lv, seed, know, tier = 33) {
  const party = PARTY(lv, 10, tier);
  const g1 = FIXED_ENCOUNTERS.zaid.group.flatMap(([sp, n]) => Array(n).fill(sp));
  const r1 = runBattle(party, g1, { seed, boss: true, knowsMirage: know, carry: true });
  if (r1.outcome !== 'win') return { ...r1, phase: 1 };
  // gap … 2だんめの はじめに たりない MP（2だんめの MP消費から のぞく）
  let gap = 0;
  for (const c of party) {
    const mp = c.mp;
    fullHeal(c);
    const max = c.mp;
    c.mp = Math.min(max, mp + Math.round(max * 0.3));
    gap += max - c.mp;
  }
  const g2 = FIXED_ENCOUNTERS.zaid_demon.group.flatMap(([sp, n]) => Array(n).fill(sp));
  const r2 = runBattle(party, g2, { seed: seed + 1, boss: true, carry: true });
  return { ...r2, seconds: r1.seconds + r2.seconds, acts: r1.acts + r2.acts, mpUsed: r1.mpUsed + r2.mpUsed - gap, phase: 2, hp1: r1.hpLeft };
}

// Step 6: ドゥナの 谷（昼・夜）・砂の古城（1階・2階）・砂の海（昼・夜）・かじの 番の 古城の よろい。どれも サラ（ゲスト）と 5人
export const CH4_DUNA = [
  ['s_duna', 35, 33], ['s_duna_night', 35, 33], ['s_castle', 35, 33], ['s_castle2', 36, 33], ['s_sandsea', 36, 33], ['s_sandsea_night', 36, 33],
];
export const CH4_DUNA_FIXED = [['rudder_guard', 35, 33], ['rudder_guard', 36, 33]];
// 砂クジラ（すなかぜ号の かんぱん）: レベル
export const CH4_WHALE = [34, 35, 36, 37, 38];
// ゲストの サラ（海賊・ガンガンいこうぜ。レベルは リーダーと おなじ）を くわえる
export function withSara(party, lv) {
  return [...party, makeNpcSupportChar({ ...CH4_GUESTS.sara }, lv)];
}
// 砂クジラ: know … 知っている 人（もぐったら、とび出す 前に 身を 守る）。知らない 人は ねらえなくても 攻撃しようと して、前ぶれでも 守らない
export function whaleFight(lv, seed, know, tier = 33, log = false) {
  const party = withSara(PARTY(lv, 10, tier), lv);
  return runBattle(party, FIXED_ENCOUNTERS.sand_whale.group.flatMap(([sp, n]) => Array(n).fill(sp)), { seed, boss: true, knowsBurrow: know, ignoreBurrow: !know, log });
}

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
  for (const [table, lv, tier] of CH4_CANAL) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(runBattle(PARTY(lv, 10, tier), rollGroup(table, rng), { seed: i }));
    summarize(`${table} Lv${lv}`, res);
  }
  // ボス: 反撃の構えに 気づいて 呪文・防御で まつ（ふつうの オート）と、気づかずに なぐり続ける ばあい
  for (const ignore of [false, true]) {
    for (const [enc, lv, tier] of CH4_BOSSES) {
      const res = [];
      const group = FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
      for (let i = 0; i < Math.min(N, 30); i++) res.push(runBattle(PARTY(lv, 10, tier), group, { seed: i, boss: true, ignoreStance: ignore }));
      summarize(`BOSS ${enc} Lv${lv}${ignore ? '（構えを無視）' : ''}`, res);
    }
  }
  if (process.env.LOG) runBattle(PARTY(31, 10, 23), [process.env.LOG], { seed: 1, boss: true, log: true });
} else if (process.argv[1].endsWith('sim.js') && process.argv[3] === 'ch4pyr') {
  // 第4章 Step 4: node tools/sim.js [回数] ch4pyr
  const rng = makeRng(4444);
  for (const [table, lv, tier, noSpells] of CH4_PYRAMID) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(runBattle(PARTY(lv, 10, tier), rollGroup(table, rng), { seed: i, noSpells }));
    summarize(`${table} Lv${lv}${noSpells ? '（呪文なし）' : ''}`, res);
  }
  for (const [enc, lv, tier] of CH4_PYR_FIXED) {
    const res = [];
    const group = FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
    for (let i = 0; i < N; i++) res.push(runBattle(PARTY(lv, 10, tier), group, { seed: i }));
    summarize(`${enc} Lv${lv}`, res);
  }
  // ミイラの王アンク: 知っている 人（アンクを ねらう。アンクが たおれると ミイラ兵も くずれる。前ぶれを 見たら アンクに 大きな ダメージ）と、
  // 知らない 人（ふつうの オートで 目の前の 敵を なぐり、前ぶれにも 気づかない）。シードは ちらして（つづいた シードは かたよる）
  for (const ignore of [false, true]) {
    for (const [enc, lv, tier] of CH4_ANKU) {
      const res = [];
      const group = FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
      for (let i = 0; i < Math.max(N, 40); i++) res.push(runBattle(PARTY(lv, 10, tier), group, { seed: 777 + i * 7919, boss: true, ignoreChant: ignore, focusBoss: !ignore }));
      summarize(`BOSS ${enc} Lv${lv}${ignore ? '（知らない）' : '（知っている）'}`, res);
    }
  }
  if (process.env.LOG) runBattle(PARTY(33, 10, 33), ['mummy_king', 'royal_mummy', 'royal_mummy'], { seed: Number(process.env.SEED || 1), boss: true, log: true, ignoreChant: !!process.env.IGNORE });
} else if (process.argv[1].endsWith('sim.js') && process.argv[3] === 'ch4zaid') {
  // 第4章 Step 5: node tools/sim.js [回数] ch4zaid
  const rng = makeRng(5555);
  for (const [table, lv, tier] of CH4_SOUTH) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(runBattle(PARTY(lv, 10, tier), rollGroup(table, rng), { seed: i }));
    summarize(`${table} Lv${lv}`, res);
  }
  // 大臣ザイード → 砂の魔神ザイード（つづけて）。シードは ちらして。1だんめで 負けた わりあいも 出す
  for (const know of [true, false]) {
    for (const lv of CH4_ZAID) {
      const res = [];
      for (let i = 0; i < Math.max(N, 40); i++) res.push(zaidFight(lv, 777 + i * 7919, know));
      summarize(`BOSS zaid→demon Lv${lv}${know ? '（知っている）' : '（知らない）'}`, res);
      const lost1 = res.filter((r) => r.phase === 1).length;
      const won1 = res.filter((r) => r.phase === 2);
      const hp1 = won1.length ? won1.reduce((t, r) => t + r.hp1, 0) / won1.length : 0;
      console.log(`${''.padEnd(36)}（1だんめで 負け ${Math.round((lost1 / res.length) * 100)}%・1だんめの あとの HP残 ${Math.round(hp1 * 100)}%）`);
    }
  }
  if (process.env.LOG) {
    const know = !process.env.IGNORE;
    const party = PARTY(Number(process.env.LV || 35), 10, 33);
    const seed = Number(process.env.SEED || 1);
    runBattle(party, ['zaid_minister', 'zaid_minister', 'zaid_minister'], { seed, boss: true, log: true, knowsMirage: know, carry: true });
    runBattle(party, ['zaid_demon'], { seed: seed + 1, boss: true, log: true, carry: true });
  }
} else if (process.argv[1].endsWith('sim.js') && process.argv[3] === 'ch4whale') {
  // 第4章 Step 6: node tools/sim.js [回数] ch4whale
  const rng = makeRng(6666);
  for (const [table, lv, tier] of CH4_DUNA) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(runBattle(withSara(PARTY(lv, 10, tier), lv), rollGroup(table, rng), { seed: i }));
    summarize(`${table} Lv${lv}＋サラ`, res);
  }
  for (const [enc, lv, tier] of CH4_DUNA_FIXED) {
    const res = [];
    const group = FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
    for (let i = 0; i < N; i++) res.push(runBattle(withSara(PARTY(lv, 10, tier), lv), group, { seed: i }));
    summarize(`${enc} Lv${lv}＋サラ`, res);
  }
  // 砂クジラ（シードは ちらして）
  for (const know of [true, false]) {
    for (const lv of CH4_WHALE) {
      const res = [];
      for (let i = 0; i < Math.max(N, 40); i++) res.push(whaleFight(lv, 777 + i * 7919, know));
      summarize(`BOSS sand_whale Lv${lv}${know ? '（知っている）' : '（知らない）'}`, res);
    }
  }
  if (process.env.LOG) whaleFight(Number(process.env.LV || 36), Number(process.env.SEED || 1), !process.env.IGNORE, 33, true);
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

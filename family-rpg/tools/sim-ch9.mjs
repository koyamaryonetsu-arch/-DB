// 第3部 第1章 第1幕「星ふるえの夜」: 3人組と スイトール1号（c9a_trio。中ボス Lv96）・ホシモリの ともしびの ためし（c9a_trial。幕の ボス Lv98）の 強さを 見る
// 第90回 Z班: わく だけ（sim-ch8.mjs と おなじ 作り）。中の 戦い方（知っている・知らない の 動き）と 星の子は B班が 書く。
//   今は data/c9a-stub.js の かりの 戦い（弱い 魔物）で 動く。B班が data/encounters-c9a.js を 作ったら、下の c9a-stub.js の import を 消す
// つかいかた: node tools/sim-ch9.mjs [回数] [trio|trial|all] [lv,…]
//   めやす（docs/plan-part3.md の 9-3）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10）・その ころの ★装備で
//     知っている 人 … 6〜7わり・知らない 人 … 3わり いか・完全オート … 0わり 近く。長さは 4〜6分
//   3つの やり方（MODES9）:
//     auto  … 完全オート（ふつうの オート。しくみを 使わない ＝「ぼうぎょ」も「明かりをわける」も えらばない）
//     blind … 知らない 人（しくみを 知らない。合体技は する）
//     know  … 知っている 人（しくみを 知って 戦う）
//   LOG=1 … 1回だけ ようすを 出す（BOSS=trio・MODE=know・LV・SEED）
//   HPK・ATKK・MAGK・SPD … 敵の 強さを かけて ためす
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats, canEquip } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
// ※ かり（B班の 戦いが できたら 消す）
import '../public/js/shared/data/c9a-stub.js';
import { C9A_BATTLE } from '../public/js/shared/maps/c9a-flags.js';
import { jobChar } from './sim-jobs.mjs';
import { dualPlan, CH6_JOBS } from './sim-ch6.mjs';
import { CH8_KIT } from './sim-ch8.mjs';

export const CH9_IDS = { trio: C9A_BATTLE.trio, trial: C9A_BATTLE.trial };
// おすすめの レベル（plan-part3.md の 9-3: 中ボス Lv96・ボス Lv98）
export const CH9_LV = { trio: 96, trial: 98 };
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は 店の いちばん よい 品）
//   今は 第8章 第4幕の ソリトゥスの ころの 物（B班が 星ふるえの森・地下道の 宝箱の ★5 に かえる）
export const CH9_KIT = { trio: CH8_KIT.sol1, trial: CH8_KIT.sol1 };
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];

export function ch9Party(boss, lv, kit = true) {
  return CH6_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, 10, name);
    const k = kit ? CH9_KIT[boss]?.[job] || [] : [];
    SLOTS.forEach((sl, i) => {
      if (!k[i]) return;
      if (!ITEMS[k[i]]) throw new Error(k[i]);
      if (!canEquip(job, k[i])) throw new Error(`${job}: ${k[i]}`);
      c.equip[sl] = k[i];
    });
    fullHeal(c);
    return c;
  });
}
const group = (boss) => FIXED_ENCOUNTERS[CH9_IDS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));

// ───── 3つの やり方（B班が 中を 書く）─────
// act(b, a, boss) … その 人の 番に する こと。true を かえすと 自分で enqueue した（false … ふつうの オート〈'ai'〉に まかせる）
//   b.knowsCh9 … 知っている 人（B班の 戦いの しくみで 使う しるし。今は 何も 見て いない）
export const MODES9 = {
  // 完全オート: ふつうの オート（Battle の auto）。act は よばれない
  auto: { label: '完全オート　', know: false, act: null },
  // 知らない 人: しくみを 知らない。合体技は いつでも する
  blind: {
    label: '知らない　　', know: true,
    act: (b, a, boss) => dualPlan(b, a, bossSpecies(b, boss), 'trick'),
  },
  // 知っている 人: しくみを 知って 戦う（B班が 書く: 中ボス … 前ぶれで 1人が「ぼうぎょ」・のこりは すいこみ口と 本体／
  //   ボス … ともしびが 消えた 仲間に「明かりをわける」・やみの いぶきの 前に 守る）。今は 合体技だけ
  know: {
    label: '知っている　', know: true,
    act: (b, a, boss) => dualPlan(b, a, bossSpecies(b, boss), null),
  },
};
function bossSpecies(b, boss) {
  void boss;
  const e = b.aliveEnemies().find((x) => x.boss) || b.aliveEnemies()[0];
  return e?.species;
}

// 星の子（戦いの わくを 使わない 味方。B班が しくみを 作る）: 戦いを 作った すぐ あとに よぶ 入れ物
export function addSpica9(b, boss) {
  void b;
  void boss;
}

// 1回 戦う。mode … 'auto' | 'blind' | 'know'
export function ch9Run(boss, lv, mode, seed, { log = false, kit = true } = {}) {
  const M = MODES9[mode];
  if (!M) throw new Error(`mode: ${mode}`);
  const party = ch9Party(boss, lv, kit);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !M.know, tactics: 'balanced' }));
  const b = new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies: group(boss) });
  addSpica9(b, boss);
  if (M.know) b.knowsCh9 = mode === 'know';
  for (const e of b.enemies) {
    const k = (v) => Number(process.env[v] || 1);
    e.maxHp = e.hp = Math.round(e.maxHp * k('HPK'));
    e.atk = Math.round(e.atk * k('ATKK'));
    e.mag = Math.round(e.mag * k('MAGK'));
    if (e.boss) e.speed = (e.speed || 1) * k('SPD');
  }
  let real = 0;
  const n = { duals: 0 };
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + [...(e.lines || []), ...(e.postLines || [])].join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) n.duals++;
    }
    if (!M.know) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive || a.kind === 'guest') continue;
      if (!M.act || !M.act(b, a, boss)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  const al = b.allies;
  const foes = b.enemies.filter((e) => e.boss).length ? b.enemies.filter((e) => e.boss) : b.enemies;
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: foes.reduce((s, e) => s + Math.max(0, e.hp), 0) / Math.max(1, foes.reduce((s, e) => s + e.maxHp, 0)), ...n,
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary9(res) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  const wins = res.filter((r) => r.outcome === 'win');
  const wsec = wins.length ? wins.reduce((s, r) => s + r.seconds, 0) / wins.length : 0;
  return {
    rate: w / res.length, sec: wsec,
    text: `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒（勝ち${wsec.toFixed(0).padStart(4)}秒）  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  ボスの残${(avg('bossLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}`,
  };
}

if (process.argv[1]?.endsWith('sim-ch9.mjs')) {
  const N = Number(process.argv[2] || 40);
  const which = !process.argv[3] || process.argv[3] === 'all' ? ['trio', 'trial'] : [process.argv[3]];
  const seedOf = (i) => 9090 + i * 7919;
  if (process.env.LOG) {
    const boss = process.env.BOSS || 'trio';
    console.log(ch9Run(boss, Number(process.env.LV || CH9_LV[boss]), process.env.MODE || 'know', Number(process.env.SEED || 1), { log: true }));
  } else {
    for (const boss of which) {
      const base = CH9_LV[boss];
      // 弱め（−5）・ふつう・強め（＋8）の 家族
      const lvs = process.argv[4] ? process.argv[4].split(',').map(Number) : [base - 5, base, base + 8];
      const mon = MONSTERS[FIXED_ENCOUNTERS[CH9_IDS[boss]].group[0][0]];
      console.log(`■ ${boss}（${CH9_IDS[boss]}・${mon?.name || '?'}。超級職 4人・職業Lv10・${N}回）`);
      for (const c of ch9Party(boss, base)) {
        const s = computeStats(c);
        console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
      }
      for (const lv of lvs) {
        for (const mode of Object.keys(MODES9)) {
          const res = [...Array(N).keys()].map((i) => ch9Run(boss, lv, mode, seedOf(i)));
          console.log(`  Lv${lv} ${MODES9[mode].label} ${summary9(res).text}`);
        }
      }
    }
  }
}

// 第2部 第8章 第1幕: オウムのイアゴン（c8_vizier_pet）・大臣ジャハール（c8_jafar。3だん）の 強さを 見る（ゲストは カリム）
// つかいかた: node tools/sim-ch8.mjs [回数] [pet|jafar|act1|all] [lv,…]
//   めやす（docs/plan-ch7.md の 8 と おなじ）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10）＋ ゲストの カリム（ガーディアン）・
//     その ころの ★装備で 知っている 人 … 9わり くらい・知らない 人（しかけを 知らない。合体技は する）… 4わり くらい。完全オート（ふつうの オート）は もっと きびしい
//   知っている 人（b.knowsCh6）:
//     イアゴン … 聞き耳の 間は 呪文を 当てない（物理の 攻撃に かえる）・オウムがえしの 前に（おぼえて いれば）身を 守る・合体技は 聞き耳でない 間
//     ジャハール … さいみんじゅつが 近い ときは へびのつえを こわす・とぐろの 間は コブラを 攻撃しない・黒いランプを 先に こわす・
//       むげんのまりょくの 前に 身を 守る・合体技は つえが こわれて うろたえて いる 間・コブラが のびきった 間・魔人が ランプの 中の 間
//   LOG=1 … 1回だけ ようすを 出す（KNOW=1・BOSS=pet など・LV・SEED・SKIPONE）/ GUEST=0 … カリム なし / SKIP=0 … しかけを 1つずつ はずすのを しない
//   HPK・ATKK・MAGK・SPD … 敵の 強さを かけて ためす
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats, canEquip } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { C8_PET, C8_JAFAR } from '../public/js/shared/data/monsters-c8a.js';
import { listening, staffUp, lampUp } from '../public/js/shared/battle-c8a.js';
import { jobChar } from './sim-jobs.mjs';
import { dualPlan, CH6_JOBS } from './sim-ch6.mjs';
import { karimChar } from './sim-ch7.mjs';

// 調整用（データを かえる 前に ためす）
const nums = (v) => v.split(',').map(Number);
const pc = MONSTERS[C8_PET].c8a.parrot;
if (process.env.PEVERY) pc.every = Number(process.env.PEVERY);
if (process.env.PLISTEN) pc.listen = Number(process.env.PLISTEN);
if (process.env.PECHO) pc.echo.base = nums(process.env.PECHO);
if (process.env.PPER) pc.echo.per = Number(process.env.PPER);
const jc = MONSTERS[C8_JAFAR].c8a;
if (process.env.JEVERY) jc.staff.every = Number(process.env.JEVERY);
if (process.env.JREGROW) jc.staff.regrow = Number(process.env.JREGROW);
if (process.env.CEVERY) jc.cobra.every = Number(process.env.CEVERY);
if (process.env.CSTRIKE) jc.cobra.strike.mult = Number(process.env.CSTRIKE);
if (process.env.CPER) jc.cobra.strike.per = Number(process.env.CPER);
if (process.env.COPEN) jc.cobra.open.k = Number(process.env.COPEN);
if (process.env.GEVERY) jc.genie.every = Number(process.env.GEVERY);
if (process.env.GBLAST) jc.genie.blast.base = nums(process.env.GBLAST);
if (process.env.GSEAL) jc.genie.seal.k = Number(process.env.GSEAL);

export const CH8_IDS = { pet: C8_PET, jafar: C8_JAFAR };
// おすすめの レベル（plan-ch8.md の 2: 第1幕は Lv80〜83。イアゴンは Step 1 の さいご・ジャハールは Step 2 の さいご）
export const CH8_LV = { pet: 81, jafar: 83 };
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は 店の いちばん よい 品〈ランク10〉）
//   イアゴン … 第7章の さいごまでの ★（＋ カイの影の 品）・月の王宮の 地下迷宮 1〜4階の 宝箱
//   ジャハール … ＋ イアゴンの 品・地下迷宮 5〜8階の 宝箱・第1幕の 手紙の ごほうび
export const CH8_KIT = {
  pet: {
    hero: ['c7it_ice_sword', 'c7it_scale_mail', 'c7it_dragon_shield', 'c7il_keeper_helm', 'c7h_shadow_charm'],
    daikenja: ['c7it_north_staff', 'c8at_night_robe', null, 'c8at_palace_turban', 'c7h_shadow_charm'],
    god_hand: ['c7l_gold_hook', 'c7il_peak_gi', null, 'c7it_bear_hat', 'c7h_shadow_charm'],
    high_priest: ['c7t_spring_staff', 'c7it_queen_robe', 'c7it_dragon_shield', 'c7l_kingdom_crown', 'c8at_crescent_ring'],
  },
  jafar: {
    hero: ['c8at_palace_sword', 'c8at_gold_mail', 'c8at_crescent_shield', 'c8al_sultan_crown', 'c8p_feather_charm'],
    daikenja: ['c8at_moon_staff', 'c8at_night_robe', null, 'c8at_palace_turban', 'c8p_feather_charm'],
    god_hand: ['c7l_gold_hook', 'c8al_carpet_gi', null, 'c7it_bear_hat', 'c8p_feather_charm'],
    high_priest: ['c7t_spring_staff', 'c7it_queen_robe', 'c8at_crescent_shield', 'c7l_kingdom_crown', 'c8p_feather_charm'],
  },
};
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export function ch8Party(boss, lv, kit = true) {
  return CH6_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, 10, name);
    const k = kit ? CH8_KIT[boss][job] : [];
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
const group = (boss) => FIXED_ENCOUNTERS[CH8_IDS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));

// 合体技（知っている 人）: しかけの「今が チャンス」の 間だけ（知らない 人は いつでも）
function dual8(b, a, boss, skip) {
  const trick = skip === 'trick';
  if (boss === 'pet') {
    const p = b.aliveEnemies().find((e) => e.c8par);
    if (!p || (!trick && (listening(p) || p.telegraph))) return false;
    return dualPlan(b, a, p.species, skip);
  }
  const w = b.aliveEnemies().find((e) => e.c8viz);
  if (!w) return false;
  const v = w.c8viz;
  if (!trick) {
    const chance = (v.form === 1 && (!staffUp(b) || v.daze)) || (v.form === 2 && v.open > 0) || (v.form === 3 && v.seal > 0);
    if (!chance) return false;
  }
  return dualPlan(b, a, w.species, skip);
}

// boss … 'pet' | 'jafar' / know … 知っている 人（ない ときは ふつうの オート）
// skip … 知っている 人の しかけの うち 1つを はずす（'quiet' 聞き耳でも 呪文・'guard' 大技で 守らない・'staff' つえを こわさない・
//   'coil' とぐろでも 攻撃・'lamp' ランプを こわさない・'dual' 合体技・'trick' ぜんぶ〈合体技は する〉）
export function ch8Run(boss, lv, know, seed, { log = false, kit = true, skip = null, guest = process.env.GUEST !== '0' } = {}) {
  const party = ch8Party(boss, lv, kit);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' }));
  if (guest) {
    const k = karimChar(lv);
    allies.push({ char: k, kind: 'guest', auto: true, tactics: k.tactics });
  }
  const b = new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies: group(boss) });
  if (know) {
    b.knowsCh6 = true;
    if (skip === 'guard' || skip === 'trick') b.c6NoGuard = true;
    if (skip === 'quiet' || skip === 'trick') b.c8aNoQuiet = true;
    if (skip === 'staff' || skip === 'trick') b.c8aNoStaff = true;
    if (skip === 'coil' || skip === 'trick') b.c8aNoCoil = true;
    if (skip === 'lamp' || skip === 'trick') b.c8aNoLamp = true;
  }
  for (const e of b.enemies) {
    const k = (v) => Number(process.env[v] || 1);
    e.maxHp = e.hp = Math.round(e.maxHp * k('HPK'));
    e.atk = Math.round(e.atk * k('ATKK'));
    e.mag = Math.round(e.mag * k('MAGK'));
    if (e.boss) e.speed = (e.speed || 1) * k('SPD');
  }
  let real = 0;
  const n = { duals: 0, learned: 0, echoes: 0, echoN: 0, echoDmg: 0, empties: 0, hypnos: 0, hypnoHit: 0, breaks: 0, cobra: 0, coils: 0, bites: 0, strikes: 0, strikeDmg: 0, whiffs: 0, genie: 0, blasts: 0, blastDmg: 0, seals: 0, form: 0 };
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + [...(e.lines || []), ...(e.postLines || [])].join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) n.duals++;
      const dmg = () => (e.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
      if (e.c8aLearn) n.learned++;
      if (e.c8aEcho) {
        if (e.c8aEcho.n) {
          n.echoes++;
          n.echoN += e.c8aEcho.n;
          n.echoDmg += dmg();
        } else n.empties++;
      }
      if (e.c8aHypno) {
        n.hypnos++;
        n.hypnoHit += e.c8aHypno.who.length;
      }
      if (e.c8aBreak) n.breaks++;
      if (e.c8aCobra) n.cobra++;
      if (e.c8aCoil) n.coils++;
      if (e.c8aBite) n.bites++;
      if (e.c8aStrike) {
        n.strikes++;
        n.strikeDmg += dmg();
      }
      if (e.c8aWhiff) n.whiffs++;
      if (e.c8aGenie) n.genie++;
      if (e.c8aBlast) {
        n.blasts++;
        n.blastDmg += dmg();
      }
      if (e.c8aSeal) n.seals++;
    }
    if (!know) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive || a.kind === 'guest') continue;
      if (skip === 'dual' || !dual8(b, a, boss, skip)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  const al = b.allies;
  const bosses = b.enemies.filter((e) => e.boss);
  n.form = bosses[0]?.c8viz?.form || 0;
  void lampUp;
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: bosses.reduce((s, e) => s + Math.max(0, e.hp), 0) / bosses.reduce((s, e) => s + e.maxHp, 0), ...n,
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary8(res, boss) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  const per = (a, b) => (avg(a) / Math.max(0.01, avg(b))).toFixed(0);
  return {
    rate: w / res.length,
    text: `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  ボスの残${(avg('bossLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}` +
      (boss === 'pet'
        ? `  おぼえた${avg('learned').toFixed(1)}  オウムがえし${avg('echoes').toFixed(1)}（${(avg('echoN') / Math.max(0.01, avg('echoes'))).toFixed(1)}こ・1回${per('echoDmg', 'echoes')}）  しっぱい${avg('empties').toFixed(1)}`
        : `  さいみん${avg('hypnos').toFixed(1)}（${avg('hypnoHit').toFixed(1)}人）  つえ${avg('breaks').toFixed(1)}  とぐろ${avg('coils').toFixed(1)}  かみつき${avg('bites').toFixed(1)}  いちげき${avg('strikes').toFixed(1)}（1回${per('strikeDmg', 'strikes')}）  からぶり${avg('whiffs').toFixed(1)}  まりょく${avg('blasts').toFixed(1)}（1回${per('blastDmg', 'blasts')}）  ランプ${avg('seals').toFixed(1)}  だん${avg('form').toFixed(1)}`),
  };
}

export const SKIPS8 = {
  pet: [['quiet', '聞き耳でも 呪文'], ['guard', 'オウムがえしで 守らない'], ['dual', '合体技 だけ しない']],
  jafar: [['staff', 'つえを こわさない'], ['coil', 'とぐろでも 攻撃'], ['lamp', 'ランプを こわさない'], ['guard', 'まりょくで 守らない'], ['dual', '合体技 だけ しない']],
};

if (process.argv[1].endsWith('sim-ch8.mjs')) {
  const N = Number(process.argv[2] || 40);
  const GROUPS = { all: ['pet', 'jafar'], act1: ['pet', 'jafar'] };
  const which = GROUPS[process.argv[3] || 'all'] || [process.argv[3]];
  const seedOf = (i) => 8080 + i * 7919;
  if (process.env.LOG) {
    const boss = process.env.BOSS || 'pet';
    const r = ch8Run(boss, Number(process.env.LV || CH8_LV[boss]), !!process.env.KNOW, Number(process.env.SEED || 1), { log: true, skip: process.env.SKIPONE || null });
    console.log(r);
  } else {
    for (const boss of which) {
      const base = CH8_LV[boss];
      const lvs = process.argv[4] ? process.argv[4].split(',').map(Number) : [base - 1, base, base + 1];
      console.log(`■ ${MONSTERS[CH8_IDS[boss]].name}（超級職 4人・職業Lv10${process.env.GUEST === '0' ? '' : ' ＋ カリム'}・${N}回。完全オート＝ふつうの オート / 知らない＝しかけを 知らない〈合体技は する〉 / 知っている＝しかけを 知って 戦う）`);
      for (const c of ch8Party(boss, base)) {
        const s = computeStats(c);
        console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
      }
      for (const lv of lvs) {
        for (const [know, skip, label] of [[false, null, '完全オート　'], [true, 'trick', '知らない　　'], [true, null, '知っている　']]) {
          const res = [...Array(N).keys()].map((i) => ch8Run(boss, lv, know, seedOf(i), { skip }));
          console.log(`  Lv${lv} ${label} ${summary8(res, boss).text}`);
        }
      }
      if (process.env.SKIP !== '0') {
        for (const [skip, label] of SKIPS8[boss]) {
          const res = [...Array(N).keys()].map((i) => ch8Run(boss, base, true, seedOf(i), { skip }));
          console.log(`  Lv${base} 知っている（${label}）${''.padEnd(Math.max(0, 14 - label.length), '　')} ${summary8(res, boss).text}`);
        }
      }
    }
  }
}

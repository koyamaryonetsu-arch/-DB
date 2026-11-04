// 第2部 第7章 第1幕: 水門の ウツボきょうだい（c7_gate）・うずの魔女オクタリア（c7_temple）の 強さを 見る
// 第2部 第7章 第2幕: 海賊船ジョリーホック号（c7_reef）・ホック船長（c7_light）も（ゲストは カイ）
// つかいかた: node tools/sim-ch7.mjs [回数] [gate|temple|reef|light|act1|act2|all] [lv,…]
//   めやす（docs/plan-ch6.md の 8 と おなじ）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10）＋ ゲストの カリム（ガーディアン）・
//     その ころの 店 ＋ ★装備で 知っている 人 … 8〜9わり・知らない 人（しかけを 知らない。合体技は する）… 4〜5わり。完全オート（ふつうの オート）は もっと きびしい
//   知っている 人（b.knowsCh6）:
//     ウツボきょうだい … HP の 多い ほうを ねらって 2ひきを いっしょに へらす・大うずしおの 前に 身を 守る・合体技は いきが 2つ いかでは しない
//     オクタリア … 声が 貝に 入ったら 貝を こわす・大合唱の 前に（こわせない なら）身を 守る・合体技は 貝に 声が ある 間と 大合唱の 前は しない
//     ジョリーホック号 … いっせいほうげきの 前に 身を 守る・のり上げて いる 間は いちばん 大きい 攻撃・合体技は のり上げて いる 間だけ
//     ホック船長 … 板の 上の 人を 回復より 先に 助ける・合体技は 板の 上に だれも いない 間だけ
//   LOG=1 … 1回だけ ようすを 出す（KNOW=1・BOSS=gate など・LV・SEED・SKIPONE）/ GUEST=0 … カリム（第2幕は カイ）なし / SKIP=0 … しかけを 1つずつ はずすのを しない
//   HPK・ATKK・MAGK・SPD … 敵の 強さを かけて ためす / SHOP=1 … ★なし（店だけ）も
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats, canEquip } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { GUESTS } from '../public/js/shared/data/shops.js';
import { makeNpcSupportChar } from '../public/js/shared/world/party.js';
import { C7_GATE, C7_TEMPLE } from '../public/js/shared/data/monsters-c7.js';
import { C7_REEF, C7_LIGHT } from '../public/js/shared/data/monsters-c7s.js';
import { voicesOf } from '../public/js/shared/battle-c7.js';
import { aground, plankWho } from '../public/js/shared/battle-c7s.js';
import { jobChar } from './sim-jobs.mjs';
import { dualPlan, CH6_JOBS } from './sim-ch6.mjs';

// 調整用（データを かえる 前に ためす）
const nums = (v) => v.split(',').map(Number);
const tw = (id) => MONSTERS[id].c7.twin;
if (process.env.GSYNC) for (const id of [C7_GATE, 'c7_gate_b']) tw(id).sync = Number(process.env.GSYNC);
if (process.env.GCALL) for (const id of [C7_GATE, 'c7_gate_b']) tw(id).call = Number(process.env.GCALL);
if (process.env.GSWIRL) for (const id of [C7_GATE, 'c7_gate_b']) tw(id).swirl.mult = Number(process.env.GSWIRL);
if (process.env.GHP) for (const id of [C7_GATE, 'c7_gate_b']) tw(id).callHp = Number(process.env.GHP);
if (process.env.GRAGE) for (const id of [C7_GATE, 'c7_gate_b']) tw(id).rage = Number(process.env.GRAGE);
const wc = MONSTERS[C7_TEMPLE].c7.witch;
if (process.env.WEVERY) wc.every = Number(process.env.WEVERY);
if (process.env.WP2) wc.p2Every = Number(process.env.WP2);
if (process.env.WCHORUS) wc.chorus.base = nums(process.env.WCHORUS);
if (process.env.WPER) wc.chorus.per = Number(process.env.WPER);
if (process.env.WAT) wc.chorusAt = Number(process.env.WAT);
const rt = MONSTERS[C7_REEF].c7s.tide;
if (process.env.RHIGH) rt.high = Number(process.env.RHIGH);
if (process.env.RLOW) rt.low = Number(process.env.RLOW);
if (process.env.RMULT) rt.broadside.mult = Number(process.env.RMULT);
if (process.env.RGROUND) rt.aground = Number(process.env.RGROUND);
const lp = MONSTERS[C7_LIGHT].c7s.plank;
if (process.env.LEVERY) lp.every = Number(process.env.LEVERY);
if (process.env.LSTEPS) lp.steps = Number(process.env.LSTEPS);
if (process.env.LWAVE) lp.wave.mult = Number(process.env.LWAVE);

export const CH7_IDS = { gate: C7_GATE, temple: C7_TEMPLE, reef: C7_REEF, light: C7_LIGHT };
// おすすめの レベル（plan-ch7.md の 2: Step 1 は 68〜70・Step 2 は 70〜72／4-2: Step 3 は 72〜74・Step 4 は 74〜76。ボスは その さいご）
export const CH7_LV = { gate: 70, temple: 72, reef: 74, light: 76 };
// 店の ランク（緑の王国・カイの 島の 店も ランク10）
export const CH7_RANK = { gate: 10, temple: 10, reef: 10, light: 10 };
// 第2幕の ボス（ゲストは カイ）
export const ACT2 = new Set(['reef', 'light']);
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は 店の いちばん よい 品）
//   ウツボきょうだい … 第6章の さいごまでの ★（時計塔 6〜10階の 宝・ゼンマイの 品・第6章クリアの 武器〈職業ごとに 1つ〉）
//   オクタリア … ＋ ウツボきょうだいの 品（ウツボのムチは 1本）・みどりの水の神殿 1〜8階の 宝箱
export const CH7_KIT = {
  gate: {
    hero: ['c6w_sword', 'p6t_tower_mail', 'p6z_time_shield', 'p6z_cog_helm', 'p6z_zenmai_charm'],
    daikenja: ['c6w_staff', 'p6t_tower_robe', null, 'p6t_spring_hat', 'p6z_zenmai_charm'],
    god_hand: ['c6w_claw', 'p6z_heart_gi', null, 'p6t_spring_hat', 'p6z_zenmai_charm'],
    high_priest: ['p6z_zenmai_staff', 'p6t_tower_robe', 'p6z_time_shield', 'p6_clock_crown', 'p6z_zenmai_charm'],
  },
  temple: {
    hero: ['c7t_temple_sword', 'c7t_jade_mail', 'c7t_jade_shield', 'c7t_coral_helm', 'c7g_twin_charm'],
    daikenja: ['c6w_staff', 'c7t_fall_robe', null, 'c7t_lotus_hat', 'c7g_twin_charm'],
    god_hand: ['c6w_claw', 'c7t_temple_gi', null, 'p6t_spring_hat', 'c7g_twin_charm'],
    high_priest: ['c7t_spring_staff', 'c7t_star_mantle', 'c7t_jade_shield', 'c7t_lotus_hat', 'c7g_twin_charm'],
  },
  // ジョリーホック号 … 第1幕の さいごまでの ★（神殿の 宝・オクタリアの 品・時をこえる手紙の ごほうび）
  reef: {
    hero: ['c7t_temple_sword', 'c7t_jade_mail', 'c7t_jade_shield', 'c7t_coral_helm', 'c7t_witch_charm'],
    daikenja: ['c7l_oasis_staff', 'c7t_fall_robe', null, 'c7l_kingdom_crown', 'c7t_witch_charm'],
    god_hand: ['c7t_tide_claw', 'c7t_temple_gi', null, 'c7t_lotus_hat', 'c7t_witch_charm'],
    high_priest: ['c7t_spring_staff', 'c7t_star_mantle', 'c7t_jade_shield', 'c7t_lotus_hat', 'c7t_witch_charm'],
  },
  // ホック船長 … ＋ ジョリーホック号の 品・しずむ前の島の灯台 1〜8階の 宝箱・第2幕の 手紙の ごほうび
  light: {
    hero: ['c7st_beacon_sword', 'c7t_jade_mail', 'c7st_lens_shield', 'c7sl_lamp_helm', 'c7r_anchor_charm'],
    daikenja: ['c7st_lamp_staff', 'c7st_wave_robe', null, 'c7st_gull_hat', 'c7r_anchor_charm'],
    god_hand: ['c7t_tide_claw', 'c7sl_tide_gi', null, 'c7st_gull_hat', 'c7r_anchor_charm'],
    high_priest: ['c7t_spring_staff', 'c7t_star_mantle', 'c7st_lens_shield', 'c7l_kingdom_crown', 'c7r_anchor_charm'],
  },
};
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export function ch7Party(boss, lv, kit = true) {
  return CH6_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, CH7_RANK[boss], name);
    const k = kit ? CH7_KIT[boss][job] : [];
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
// ゲストの カリム（パーティーの いちばん 高い レベル。world/party.js の guestChar と おなじ 作り方）
export const karimChar = (lv) => makeNpcSupportChar({ ...GUESTS.karim }, Math.max(GUESTS.karim.minLevel || 1, lv));
// 第2幕の ゲストの カイ（おなじ 作り方）
export const kaiChar = (lv) => makeNpcSupportChar({ ...GUESTS.kai }, Math.max(GUESTS.kai.minLevel || 1, lv));
const group = (boss) => FIXED_ENCOUNTERS[CH7_IDS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));

// 合体技（知っている 人）: 大うずしお・大合唱が 近い ときは しない。ウツボは HP の 多い ほうへ
function dual7(b, a, boss, skip) {
  const trick = skip === 'trick';
  if (boss === 'gate') {
    const eels = b.aliveEnemies().filter((e) => e.twin);
    if (!eels.length) return false;
    if (!trick && eels.length === 2 && b.c7twin && b.c7twin.left <= 2) return false;
    // 知らない 人・2ひきを いっしょに へらさない 人は、はじめの 1ぴきから
    const hi = eels.slice().sort((x, y) => (trick || skip === 'split' ? 0 : y.hp / y.maxHp - x.hp / x.maxHp))[0];
    return dualPlan(b, a, hi.species, skip);
  }
  // ジョリーホック号: のり上げて いる 間だけ（知らない 人は いつでも）
  if (boss === 'reef') {
    const ship = b.aliveEnemies().find((e) => e.c7tide);
    if (!ship || (!trick && !aground(ship))) return false;
    return dualPlan(b, a, ship.species, skip);
  }
  // ホック船長: 板わたりの号令の すぐ 前・板の 上に 人が いる 間は しない（知らない 人は いつでも）
  if (boss === 'light') {
    const cap = b.aliveEnemies().find((e) => e.c7cap);
    if (!cap || (!trick && skip !== 'dualtime' && (plankWho(b, cap) || cap.c7cap.left <= 1 || cap.telegraph))) return false;
    return dualPlan(b, a, cap.species, skip);
  }
  const w = b.aliveEnemies().find((e) => e.witch);
  if (!w) return false;
  // 大合唱が 近い（次の 魔女の 行動）ときは しない（守る・貝を こわす）
  if (!trick && w.witch.left <= 1 && b.aliveEnemies().some((e) => e.c7w) && voicesOf(b, w) >= MONSTERS[C7_TEMPLE].c7.witch.chorusAt) return false;
  return dualPlan(b, a, w.species, skip);
}

// boss … 'gate' | 'temple' / know … 知っている 人（ない ときは ふつうの オート）
// skip … 知っている 人の しかけの うち 1つを はずす（'split' 2ひきを いっしょに へらさない・'shell' 貝を こわさない・'guard' 大技で 守らない・
//   'focus' のり上げで 大きい 攻撃を しない・'reach' 板の 人を 先に 助けない・'dualtime' 板わたりの 前でも 合体技・'dual' 合体技・'trick' ぜんぶ〈合体技は する〉）
export function ch7Run(boss, lv, know, seed, { log = false, kit = true, skip = null, guest = process.env.GUEST !== '0' } = {}) {
  const party = ch7Party(boss, lv, kit);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' }));
  if (guest) {
    const k = ACT2.has(boss) ? kaiChar(lv) : karimChar(lv);
    allies.push({ char: k, kind: 'guest', auto: true, tactics: k.tactics });
  }
  const b = new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies: group(boss) });
  if (know) {
    b.knowsCh6 = true;
    if (skip === 'guard' || skip === 'trick') b.c6NoGuard = true;
    if (skip === 'split' || skip === 'trick') b.c7NoSplit = true;
    if (skip === 'shell' || skip === 'trick') b.c7NoShell = true;
    if (skip === 'focus' || skip === 'trick') b.c7sNoFocus = true;
    if (skip === 'reach' || skip === 'trick') b.c7sNoReach = true;
  }
  for (const e of b.enemies) {
    const k = (v) => Number(process.env[v] || 1);
    e.maxHp = e.hp = Math.round(e.maxHp * k('HPK'));
    e.atk = Math.round(e.atk * k('ATKK'));
    e.mag = Math.round(e.mag * k('MAGK'));
    if (e.boss) e.speed = (e.speed || 1) * k('SPD');
  }
  let real = 0;
  const n = { duals: 0, swirls: 0, swirlDmg: 0, downs: 0, calls: 0, steals: 0, choruses: 0, chorusDmg: 0, breaks: 0, voiceMax: 0, guarded: 0, broadsides: 0, broadsideDmg: 0, planks: 0, falls: 0, saves: 0 };
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + [...(e.lines || [])].join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) n.duals++;
      const dmg = () => (e.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
      if (e.c7Swirl) {
        n.swirls++;
        n.swirlDmg += dmg();
      }
      if (e.c7Down) n.downs++;
      if (e.c7Call) n.calls++;
      if (e.c7Steal) {
        n.steals++;
        n.voiceMax = Math.max(n.voiceMax, e.c7Steal.voices);
      }
      if (e.c7Chorus) {
        n.choruses++;
        n.chorusDmg += dmg();
      }
      if (e.c7Break) n.breaks++;
      if (e.c7sBroadside) {
        n.broadsides++;
        n.broadsideDmg += dmg();
      }
      if (e.c7sPlank) n.planks++;
      if (e.c7sFall) n.falls++;
      if (e.c7sSave) n.saves++;
    }
    if (!know) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive || a.kind === 'guest') continue;
      if (skip === 'dual' || !dual7(b, a, boss, skip)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  const al = b.allies;
  const bosses = b.enemies.filter((e) => e.boss);
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: bosses.reduce((s, e) => s + Math.max(0, e.hp), 0) / bosses.reduce((s, e) => s + e.maxHp, 0), ...n,
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary7(res, boss) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  return {
    rate: w / res.length,
    text: `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  ボスの残${(avg('bossLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}` +
      (boss === 'gate'
        ? `  大うずしお${avg('swirls').toFixed(2)}（1回${(avg('swirlDmg') / Math.max(0.01, avg('swirls'))).toFixed(0)}）  たおした${avg('downs').toFixed(1)}  よびもどし${avg('calls').toFixed(2)}`
        : boss === 'reef'
          ? `  ほうげき${avg('broadsides').toFixed(2)}（1回${(avg('broadsideDmg') / Math.max(0.01, avg('broadsides'))).toFixed(0)}）`
          : boss === 'light'
            ? `  板わたり${avg('planks').toFixed(1)}  助けた${avg('saves').toFixed(1)}  落ちた${avg('falls').toFixed(2)}`
            : `  声うばい${avg('steals').toFixed(1)}  大合唱${avg('choruses').toFixed(2)}（1回${(avg('chorusDmg') / Math.max(0.01, avg('choruses'))).toFixed(0)}）  貝をこわした${avg('breaks').toFixed(1)}`),
  };
}

export const SKIPS7 = {
  gate: [['split', '2ひきを いっしょに へらさない'], ['guard', '大うずしおで 守らない'], ['dual', '合体技 だけ しない']],
  temple: [['shell', '貝を こわさない'], ['guard', '大合唱で 守らない'], ['dual', '合体技 だけ しない']],
  reef: [['guard', 'ほうげきで 守らない'], ['focus', 'のり上げで 大技 しない'], ['dual', '合体技 だけ しない']],
  light: [['reach', '板の 人を 先に 助けない'], ['dualtime', '号令の 前も 合体技'], ['dual', '合体技 だけ しない']],
};

if (process.argv[1].endsWith('sim-ch7.mjs')) {
  const N = Number(process.argv[2] || 40);
  const GROUPS = { all: ['gate', 'temple', 'reef', 'light'], act1: ['gate', 'temple'], act2: ['reef', 'light'] };
  const which = GROUPS[process.argv[3] || 'all'] || [process.argv[3]];
  const seedOf = (i) => 7070 + i * 7919;
  if (process.env.LOG) {
    const boss = process.env.BOSS || 'gate';
    const r = ch7Run(boss, Number(process.env.LV || CH7_LV[boss]), !!process.env.KNOW, Number(process.env.SEED || 1), { log: true, skip: process.env.SKIPONE || null });
    console.log(r);
  } else {
    for (const boss of which) {
      const base = CH7_LV[boss];
      const lvs = process.argv[4] ? process.argv[4].split(',').map(Number) : [base - 1, base, base + 1];
      console.log(`■ ${MONSTERS[CH7_IDS[boss]].name}（超級職 4人・職業Lv10${process.env.GUEST === '0' ? '' : ACT2.has(boss) ? ' ＋ カイ' : ' ＋ カリム'}・${N}回。完全オート＝ふつうの オート / 知らない＝しかけを 知らない〈合体技は する〉 / 知っている＝しかけを 知って 戦う）`);
      for (const c of ch7Party(boss, base)) {
        const s = computeStats(c);
        console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
      }
      for (const kit of [true, false]) {
        for (const lv of lvs) {
          for (const [know, skip, label] of [[false, null, '完全オート　'], [true, 'trick', '知らない　　'], [true, null, '知っている　']]) {
            const res = [...Array(N).keys()].map((i) => ch7Run(boss, lv, know, seedOf(i), { kit, skip }));
            console.log(`  Lv${lv} ${kit ? '店＋★' : '店だけ'} ${label} ${summary7(res, boss).text}`);
          }
        }
        if (!process.env.SHOP) break;
      }
      if (process.env.SKIP !== '0') {
        for (const [skip, label] of SKIPS7[boss]) {
          const res = [...Array(N).keys()].map((i) => ch7Run(boss, base, true, seedOf(i), { skip }));
          console.log(`  Lv${base} 知っている（${label}）${''.padEnd(Math.max(0, 14 - label.length), '　')} ${summary7(res, boss).text}`);
        }
      }
    }
  }
}

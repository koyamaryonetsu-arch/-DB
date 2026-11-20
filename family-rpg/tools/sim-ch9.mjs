// 第3部 第1章 第1幕「星ふるえの夜」: 3人組と スイトール1号（c9a_trio。中ボス Lv96）・ホシモリの ともしびの ためし（c9a_trial。幕の ボス Lv98）の 強さを 見る
// 第90回 Z班: わく（sim-ch8.mjs と おなじ 作り）。B班: 中の 戦い方（知っている・知らない の 動き）と 星の子（shared/battle-c9a.js）
// 第91回 B班: 第2幕の ボス「デデドン大王」（c9b_king。Lv100。king）。皿を 先に こわす・まっ暗で てらす・大ジャンプで 身を 守る（shared/battle-c9b.js）
// つかいかた: node tools/sim-ch9.mjs [回数] [trio|trial|king|all] [lv,…]
//   めやす（docs/plan-part3.md の 9-3）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10）・その ころの ★装備で
//     知っている 人 … 6〜7わり・知らない 人 … 3わり いか・完全オート … 0わり 近く。長さは 4〜6分
//   3つの やり方（MODES9）:
//     auto  … 完全オート（ふつうの オート。しくみを 使わない ＝「ぼうぎょ」も「明かりをわける」も えらばない）
//     blind … 知らない 人（しくみを 知らない。合体技は する）
//     know  … 知っている 人（しくみを 知って 戦う）
//   PARTY=k1npc,solo … 人数の やり方（PARTIES9。PARTY=all … 全部。人4人 いがいは おすすめの レベルで 完全オートと 知っている 人）
//     めやす: 1人＋自動 3人 … 5わり いじょう・2人＋自動 2人 … 5〜7わり・5人 … 9わりを こえない・完全オート … 0わり 近く
//     （人数で 合わせる 表は monsters-c9a.js の c9a.few。ひとりだけ〈仲間 なし〉は 勝てない … ノクトの ヒントの 3回目）
//   LOG=1 … 1回だけ ようすを 出す（BOSS=trio・MODE=know・LV・SEED・PARTY）
//   HPK・ATKK・MAGK・SPD … 敵の 強さを かけて ためす
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats, canEquip } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { C9A_BATTLE } from '../public/js/shared/maps/c9a-flags.js';
import { addSpica, mechaOf, hoshimoriOf } from '../public/js/shared/battle-c9a.js';
import { kingOf, c9bBusy } from '../public/js/shared/battle-c9b.js';
import { C9B_BATTLE } from '../public/js/shared/data/c9b-names-b.js';
import { jobChar } from './sim-jobs.mjs';
import { dualPlan, CH6_JOBS } from './sim-ch6.mjs';
import { monsterChar } from './sim-monster-party.mjs';
import { NPC_SUPPORTS } from '../public/js/shared/data/shops.js';
import './sim-ch8.mjs';

export const CH9_IDS = { trio: C9A_BATTLE.trio, trial: C9A_BATTLE.trial, king: C9B_BATTLE.king };
// おすすめの レベル（plan-part3.md の 9-3: 中ボス Lv96・ボス Lv98）
export const CH9_LV = { trio: 96, trial: 98 };
// 第2幕の ボス（plan-part3.md の 10-3: Lv100）。CH9_LV は 第1幕の まま（test/ch9-base.test.js）
export const CH9B_LV = { king: 100 };
export const LV9 = { ...CH9_LV, ...CH9B_LV };
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は 店の いちばん よい 品）
//   3人組 … 第8章 第4幕の さいごまでの ★（＋ ソリトゥスの 品）・星ふるえの森の 宝箱（星くずのツメ）
//   ためし … ＋ 3人組の 品（バッジ・キラジョのおうぎ）・星の石の地下道 地下1〜4階の 宝箱
export const CH9_KIT = {
  trio: {
    hero: ['c8s_star_sword', 'c8rt_ice_mail', 'c8rt_iron_shield', 'c8rt_moon_helm', 'c8s_promise_crest'],
    daikenja: ['c8rt_sand_staff', 'c8rt_star_robe', null, 'c8rt_last_hat', 'c8s_promise_crest'],
    god_hand: ['c9at_star_claw', 'c8rt_fire_gi', null, 'c7it_bear_hat', 'c8s_promise_crest'],
    high_priest: ['c8k_magic_staff', 'c7it_queen_robe', 'c8rt_iron_shield', 'c7l_kingdom_crown', 'c8s_promise_crest'],
  },
  trial: {
    hero: ['c8s_star_sword', 'c9at_dawn_mail', 'c9at_stone_shield', 'c8rt_moon_helm', 'c9b_trio_badge'],
    daikenja: ['c8rt_sand_staff', 'c9at_moss_robe', null, 'c9at_owl_hat', 'c9b_trio_badge'],
    god_hand: ['c9at_star_claw', 'c8rt_fire_gi', null, 'c7it_bear_hat', 'c9b_trio_badge'],
    high_priest: ['c8k_magic_staff', 'c9at_moss_robe', 'c9at_stone_shield', 'c7l_kingdom_crown', 'c9b_trio_badge'],
  },
  // 大王 … ＋ ホシモリの 品（夜明けのはね・ホシモリのつえ）・大地の下と やしきの 宝箱（水晶のやり・ヒカリゴケのぼうし・もぐらの大オノ・ごちそうの大皿のたて）
  king: {
    hero: ['c8s_star_sword', 'c9at_dawn_mail', 'c9bt_table_shield', 'c8rt_moon_helm', 'c9b_dawn_feather'],
    daikenja: ['c9b_owl_staff', 'c9at_moss_robe', null, 'c9bt_moss_hat', 'c9b_dawn_feather'],
    god_hand: ['c9at_star_claw', 'c8rt_fire_gi', null, 'c7it_bear_hat', 'c9b_dawn_feather'],
    high_priest: ['c9b_owl_staff', 'c9at_moss_robe', 'c9at_stone_shield', 'c7l_kingdom_crown', 'c9b_dawn_feather'],
  },
};
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
// ───── 人数の やり方（PARTIES9）─────
//   人 … 知って いる（または 知らない）人が 動かす キャラ。CH9_KIT の ★装備
//   npc … 酒場の 人の 仲間（NPC_SUPPORTS の ポポロ・リン・ミーナ。この ころには 転職して 大賢者・ゴッドハンド・大神官。
//         ★装備は 人が 持つので 店の いちばん よい 品。作戦は その 人の）。自動。人の 職業と かさなる 人は 出ない
//   mon … 魔物の 仲間（この ころの Sランク: キラーからくり・ヴァルドラゴン・せかいじゅの子〈回復〉。＋15・店の いちばん よい 品）。自動
//   人が 動かす キャラの じゅん: 勇者・大神官・大賢者・ゴッドハンド・（5人目）ガーディアン（店の 品）
const HUMAN_ORDER = ['hero', 'high_priest', 'daikenja', 'god_hand'];
const NPC9 = [['npc_poporo', 'daikenja'], ['npc_rin', 'god_hand'], ['npc_mina', 'high_priest']];
const MON9 = [['killer_karakuri', 'aggressive'], ['yggdra_child', 'heal'], ['great_dragon', 'balanced']];
export const PARTIES9 = {
  p4: { label: '人4人　　　　', humans: 4, npc: 0, mon: 0 },
  k1npc: { label: '1人＋酒場3人', humans: 1, npc: 3, mon: 0 },
  k1mon: { label: '1人＋魔物3', humans: 1, npc: 0, mon: 3 },
  k2npc: { label: '2人＋酒場2人', humans: 2, npc: 2, mon: 0 },
  solo: { label: 'ひとりだけ　', humans: 1, npc: 0, mon: 0 },
  p5: { label: '人5人　　　　', humans: 5, npc: 0, mon: 0 },
};
function npcChar(id, job, lv) {
  const d = NPC_SUPPORTS.find((n) => n.id === id);
  const c = jobChar(job, lv, 10, d.name);
  c.tactics = d.tactics;
  return c;
}
// 1回 ぶんの 味方（{ char, know }。know … その キャラを 人が 動かすか）
export function ch9Allies(boss, lv, partyKey = 'p4', kit = true) {
  const P = PARTIES9[partyKey];
  if (!P) throw new Error(`party: ${partyKey}`);
  const four = ch9Party(boss, lv, kit);
  // ならびは 人4人の ときと おなじ（先頭ほど ねらわれやすい）
  const pick = HUMAN_ORDER.slice(0, Math.min(4, P.humans));
  const humans = four.filter((c) => pick.includes(c.job));
  if (P.humans >= 5) humans.push(jobChar('guardian', lv, 10, 'ガーディアン'));
  const out = humans.map((c) => ({ char: c, know: true }));
  for (const [id, job] of NPC9.filter(([, j]) => !pick.includes(j)).slice(0, P.npc)) out.push({ char: npcChar(id, job, lv), know: false });
  for (const [sp, tac] of MON9.slice(0, P.mon)) {
    const c = monsterChar(sp, lv, 15, 10);
    c.tactics = tac;
    out.push({ char: c, know: false, monster: true });
  }
  return out;
}
const group = (boss) => FIXED_ENCOUNTERS[CH9_IDS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));

// ───── 3つの やり方 ─────
// act(b, a, boss) … その 人の 番に する こと。true を かえすと 自分で enqueue した（false … ふつうの オート〈'ai'〉に まかせる）
//   b.knowsCh9 … 'know' 知っている 人・'blind' 知らない 人（shared/battle-c9a.js の c9aPlan が 見る）。完全オートは なし
export const MODES9 = {
  // 完全オート: ふつうの オート（Battle の auto）。act は よばれない
  auto: { label: '完全オート　', know: false, act: null },
  // 知らない 人: しくみを 知らない（たまに 気づく … shared/battle-c9a.js の c9aPlan）。合体技は いつでも する
  blind: {
    label: '知らない　　', know: true,
    act: (b, a, boss) => dualPlan(b, a, bossSpecies(b, boss), 'trick'),
  },
  // 知っている 人: しくみを 知って 戦う（中ボス … 前ぶれで 1人が「防御」・すいこみ口が 向く 前後は すいこみ口を こわす・ふだんは 本体／
  //   ボス … ともしびが 消えた 仲間に「明かりをわける」・やみの いぶきで ねらわれた 人は 身を 守る。shared/battle-c9a.js の c9aPlan）
  //   合体技は しくみの 用が ない 時だけ（前ぶれの 間・消えた 仲間が いる 間は しない）
  know: {
    label: '知っている　', know: true,
    act: (b, a, boss) => (busy9(b) ? false : dualPlan(b, a, bossSpecies(b, boss), null)),
  },
};
function bossSpecies(b, boss) {
  void boss;
  const e = b.aliveEnemies().find((x) => x.boss) || b.aliveEnemies()[0];
  return e?.species;
}
// しくみの 用が ある 間（知っている 人は 合体技を しない）
function busy9(b) {
  const m = mechaOf(b);
  if (m?.c9t && (m.c9t.aim || (!m.c9t.broken && m.c9t.aimLeft <= 1))) return true;
  const h = hoshimoriOf(b);
  if (h?.c9h && (h.c9h.aim.length || b.aliveAllies().some((x) => !x.c9torch))) return true;
  return c9bBusy(b);
}

// 星の子（戦いの わくを 使わない 味方。shared/battle-c9a.js）: 戦いを 作った すぐ あとに よぶ（3人組・ためしは 戦いが 自分で 入れる）
export function addSpica9(b, boss) {
  void boss;
  return addSpica(b);
}

// 1回 戦う。mode … 'auto' | 'blind' | 'know'
// party … PARTIES9 の キー（人数の やり方。ない ときは 人4人）
export function ch9Run(boss, lv, mode, seed, { log = false, kit = true, party = 'p4' } = {}) {
  const M = MODES9[mode];
  if (!M) throw new Error(`mode: ${mode}`);
  const list = ch9Allies(boss, lv, party, kit);
  // 人が 動かす キャラは 家族の キャラ（kind 'player'。完全オートの ときは その 人の「オート」）・のこりは 自動の 仲間
  const allies = list.map((x) => (x.know
    ? { char: x.char, kind: 'player', controller: 'sim', auto: !M.know, tactics: 'balanced' }
    : { char: x.char, kind: x.monster ? 'monster' : 'support', auto: true, tactics: x.char.tactics || 'balanced' }));
  const b = new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies: group(boss) });
  addSpica9(b, boss);
  // 人が 動かす キャラだけ しくみを 知って いる（自動の 仲間は ふつうの オート）
  if (M.know) b.allies.forEach((a, i) => { if (list[i]?.know) a.knows9 = mode; });
  for (const e of b.enemies) {
    const k = (v) => Number(process.env[v] || 1);
    e.maxHp = e.hp = Math.round(e.maxHp * k('HPK'));
    e.atk = Math.round(e.atk * k('ATKK'));
    e.mag = Math.round(e.mag * k('MAGK'));
    if (e.boss) e.speed = (e.speed || 1) * k('SPD');
  }
  let real = 0;
  const n = { duals: 0, aims: 0, guards: 0, lost: 0, breaks: 0, breaths: 0, outs: 0, kept: 0, shares: 0, glows: 0, eats: 0, stops: 0, jumps: 0, teru: 0 };
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + [...(e.lines || []), ...(e.postLines || [])].join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) n.duals++;
      if (e.c9tAim) n.aims++;
      if (e.c9tSuck?.guard) n.guards++;
      if (e.c9tSuck && !e.c9tSuck.guard) n.lost++;
      if (e.c9tBreak) n.breaks++;
      if (e.c9hBreath) {
        n.breaths++;
        n.outs += e.c9hBreath.out.length;
        n.kept += e.c9hBreath.kept.length;
      }
      if (e.c9hShare) n.shares++;
      if (e.c9Spica?.glow) n.glows++;
      if (e.c9kEat) n.eats++;
      if (e.c9kBreak?.stop) n.stops++;
      if (e.c9kJump) n.jumps++;
      if (e.c9bTeru) n.teru++;
    }
    if (!M.know) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive || a.kind === 'guest' || !a.knows9) continue;
      if (!M.act || !M.act(b, a, boss)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  const al = b.allies;
  const foes = b.enemies.filter((e) => e.boss).length ? b.enemies.filter((e) => e.boss) : b.enemies;
  const h = hoshimoriOf(b);
  const kg = kingOf(b);
  return {
    kDark: kg?.c9k?.dark ? 1 : 0,
    light: b.c9sp?.light ?? 0, dawn: h?.c9h?.dawn ?? 0, dark: h?.c9h?.dark ? 1 : 0, bigs: h?.c9h?.bigs ?? 0,
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
    text: `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒（勝ち${wsec.toFixed(0).padStart(4)}秒）  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  ボスの残${(avg('bossLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}`
      + `  光${avg('light').toFixed(1)} 守${avg('guards').toFixed(1)} こわす${avg('breaks').toFixed(1)}  夜明け${avg('dawn').toFixed(1)} いぶき${avg('breaths').toFixed(1)}(消${avg('outs').toFixed(1)}/守${avg('kept').toFixed(1)}) わける${avg('shares').toFixed(1)} 大${avg('bigs').toFixed(1)} まっくら${avg('dark').toFixed(2)}`
      + `  食べ${avg('eats').toFixed(1)} 止め${avg('stops').toFixed(1)} ジャンプ${avg('jumps').toFixed(1)} てらす${avg('teru').toFixed(1)} まっ暗${avg('kDark').toFixed(2)}`,
  };
}

if (process.argv[1]?.endsWith('sim-ch9.mjs')) {
  const N = Number(process.argv[2] || 40);
  const which = !process.argv[3] || process.argv[3] === 'all' ? ['trio', 'trial', 'king'] : [process.argv[3]];
  const seedOf = (i) => 9090 + i * 7919;
  if (process.env.LOG) {
    const boss = process.env.BOSS || 'trio';
    console.log(ch9Run(boss, Number(process.env.LV || LV9[boss]), process.env.MODE || 'know', Number(process.env.SEED || 1), { log: true, party: process.env.PARTY || 'p4' }));
  } else {
    for (const boss of which) {
      const base = LV9[boss];
      // 弱め（−5）・ふつう・強め（＋8）の 家族
      const lvs = process.argv[4] ? process.argv[4].split(',').map(Number) : [base - 5, base, base + 8];
      const mon = MONSTERS[FIXED_ENCOUNTERS[CH9_IDS[boss]].group[0][0]];
      console.log(`■ ${boss}（${CH9_IDS[boss]}・${mon?.name || '?'}。超級職 4人・職業Lv10・${N}回）`);
      for (const c of ch9Party(boss, base)) {
        const s = computeStats(c);
        console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
      }
      // PARTY=k1npc,solo … 人数の やり方（ない ときは 人4人で 3つの やり方。PARTY=all … 全部の 人数を おすすめの レベルで）
      const parties = !process.env.PARTY ? ['p4'] : process.env.PARTY === 'all' ? Object.keys(PARTIES9) : process.env.PARTY.split(',');
      for (const party of parties) {
        const plvs = party === 'p4' || process.argv[4] ? lvs : [base];
        for (const lv of plvs) {
          for (const mode of Object.keys(MODES9)) {
            if (party !== 'p4' && mode === 'blind') continue;
            const res = [...Array(N).keys()].map((i) => ch9Run(boss, lv, mode, seedOf(i), { party }));
            console.log(`  ${PARTIES9[party].label} Lv${lv} ${MODES9[mode].label} ${summary9(res).text}`);
          }
        }
      }
    }
  }
}

// 第2部 第8章 第1幕: オウムのイアゴン（c8_vizier_pet）・大臣ジャハール（c8_jafar。3だん）の 強さを 見る（ゲストは カリム）
// 第2部 第8章 第2幕: ペイニックと パニクル（c8_painpanic。2ひき）・よみの王ハデロス（c8_hades。2だん）の 強さを 見る（ゲストは カイ）
// 第2部 第8章 第3幕: マジカメック（c8_kamek。子分 2ひき）・初代大魔王クッパード（c8_bowser。2だん）の 強さを 見る（ゲストは リオン〈rion8〉）
// つかいかた: node tools/sim-ch8.mjs [回数] [pet|jafar|act1|imps|hades|act2|kamek|bowser|act3|all] [lv,…]
//   めやす（docs/plan-ch7.md の 8 と おなじ）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10）＋ ゲストの カリム（ガーディアン）・
//     その ころの ★装備で 知っている 人 … 9わり くらい・知らない 人（しかけを 知らない。合体技は する）… 4わり くらい。完全オート（ふつうの オート）は もっと きびしい
//   知っている 人（b.knowsCh6）:
//     イアゴン … 聞き耳の 間は 呪文を 当てない（物理の 攻撃に かえる）・オウムがえしの 前に（おぼえて いれば）身を 守る・合体技は 聞き耳でない 間
//     ジャハール … さいみんじゅつが 近い ときは へびのつえを こわす・とぐろの 間は コブラを 攻撃しない・黒いランプを 先に こわす・
//       むげんのまりょくの 前に 身を 守る・合体技は つえが こわれて うろたえて いる 間・コブラが のびきった 間・魔人が ランプの 中の 間
//     ペイニックと パニクル … ひそひそ相談の 間は いちばん 大きい 1回の 攻撃で じゃまを する・パニックの 小おにを ねらう・2ひきの HP を そろえて へらす・
//       大がったいの 前に 身を 守る・合体技は 大技の 前ぶれの 間は しない
//     ハデロス … けいやくの 間は 炎を 当てる・ふん火の 前ぶれに 氷を 当てる・大ふん火の 前に 身を 守る・合体技は けいやくの 間と ふん火の 前ぶれの 間は しない
//     マジカメック … 魔法じんの 子分を 先に たおす・合体技は 魔法じんが ない 間
//     クッパード … 橋のオノが ある 間は ぶきで たたく・大技の 前に 身を 守る・合体技は オノが ない 間で 大技の 前ぶれで ない 間
//   LOG=1 … 1回だけ ようすを 出す（KNOW=1・BOSS=pet など・LV・SEED・SKIPONE）/ GUEST=0 … カリム（第2幕は カイ）なし / SKIP=0 … しかけを 1つずつ はずすのを しない
//   HPK・ATKK・MAGK・SPD … 敵の 強さを かけて ためす
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats, canEquip } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { C8_PET, C8_JAFAR } from '../public/js/shared/data/monsters-c8a.js';
import { listening, staffUp, lampUp } from '../public/js/shared/battle-c8a.js';
import { C8_PAIN, C8_PANIC, C8_HADES } from '../public/js/shared/data/monsters-c8b.js';
import { plotting, eruptSoon } from '../public/js/shared/battle-c8b.js';
import { C8_KAMEK, C8_BOWSER } from '../public/js/shared/data/monsters-c8c.js';
import { aimedKid, axeOf } from '../public/js/shared/battle-c8c.js';
import { jobChar } from './sim-jobs.mjs';
import { dualPlan, CH6_JOBS } from './sim-ch6.mjs';
import { ruledGuest } from './sim-ch7.mjs';
import { scaleGuestActor } from '../public/js/shared/guest-rule.js';

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
const ic = MONSTERS[C8_PAIN].c8b.imps;
if (process.env.IEVERY) ic.every = Number(process.env.IEVERY);
if (process.env.IPLOT) ic.plot = Number(process.env.IPLOT);
if (process.env.IBREAK) ic.breakAt = Number(process.env.IBREAK);
if (process.env.IFUSE) ic.fuse.mult = Number(process.env.IFUSE);
if (process.env.IPANIC) ic.panic.turns = Number(process.env.IPANIC);
if (process.env.IRAGE) ic.rage.atk = Number(process.env.IRAGE);
if (process.env.IRMULT) ic.rage.mult = Number(process.env.IRMULT);
if (process.env.IREVERY) ic.rage.every = Number(process.env.IREVERY);
if (process.env.IPANICK) ic.panic.k = Number(process.env.IPANICK);
const hc = MONSTERS[C8_HADES].c8b;
if (process.env.HEVERY) hc.contract.every = Number(process.env.HEVERY);
if (process.env.HTURNS) hc.contract.turns = Number(process.env.HTURNS);
if (process.env.HDRAIN) hc.contract.drain = Number(process.env.HDRAIN);
if (process.env.EEVERY) hc.erupt.every = Number(process.env.EEVERY);
if (process.env.EBASE) hc.erupt.base = nums(process.env.EBASE);
if (process.env.HP2) hc.p2At = Number(process.env.HP2);
if (process.env.ECHILL) hc.erupt.chillAt = Number(process.env.ECHILL);
if (process.env.HSOUL) hc.contract.soulHeal = Number(process.env.HSOUL);
const kc = MONSTERS[C8_KAMEK].c8c;
if (process.env.KEVERY) kc.grow.every = Number(process.env.KEVERY);
if (process.env.KBROOM) kc.grow.broomEvery = Number(process.env.KBROOM);
if (process.env.KHP) kc.grow.hp = Number(process.env.KHP);
if (process.env.KATK) kc.grow.atk = Number(process.env.KATK);
if (process.env.KCD) kc.summon.cd = Number(process.env.KCD);
if (process.env.KAIM) kc.grow.aimAt = Number(process.env.KAIM);
if (process.env.KSOFT) kc.grow.soft = Number(process.env.KSOFT);
if (process.env.KBELOW) kc.summon.below = Number(process.env.KBELOW);
if (process.env.KKID) kc.summon.hp = Number(process.env.KKID);
if (process.env.KTINY) kc.tiny = { turns: kc.tiny?.turns ?? 2, k: Number(process.env.KTINY) };
const bwc = MONSTERS[C8_BOWSER].c8c;
if (process.env.BPOUND) bwc.pound.mult = Number(process.env.BPOUND);
if (process.env.BPEVERY) bwc.pound.every = Number(process.env.BPEVERY);
if (process.env.BGIGA) bwc.gigaAt = Number(process.env.BGIGA);
if (process.env.BCUT) bwc.giga.cut = Number(process.env.BCUT);
if (process.env.BFEVERY) bwc.giga.every = Number(process.env.BFEVERY);
if (process.env.BFIRE) bwc.giga.base = nums(process.env.BFIRE);
if (process.env.BREGROW) bwc.giga.regrow = Number(process.env.BREGROW);
if (process.env.BFALL) bwc.giga.fall = Number(process.env.BFALL);
if (process.env.BGATK) bwc.giga.atk = Number(process.env.BGATK);

export const CH8_IDS = { pet: C8_PET, jafar: C8_JAFAR, imps: C8_PAIN, hades: C8_HADES, kamek: C8_KAMEK, bowser: C8_BOWSER };
// おすすめの レベル（plan-ch8.md の 2: 第1幕は Lv80〜83。イアゴンは Step 1 の さいご・ジャハールは Step 2 の さいご／
//   第2幕は Lv83〜86。ペイニックと パニクルは Step 3 の さいご・ハデロスは Step 4 の さいご）
//   第3幕は Lv86〜89（plan-ch8.md の 8。マジカメックは Step 5 の さいご Lv88・クッパードは Step 6 の さいご Lv90）
export const CH8_LV = { pet: 81, jafar: 83, imps: 84, hades: 86, kamek: 88, bowser: 90 };
// 第2幕の ボス（ゲストは カイ）・第3幕の ボス（ゲストは リオン）
const ACT2 = new Set(['imps', 'hades']);
const ACT3 = new Set(['kamek', 'bowser']);
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
  //   ペイニックと パニクル … ＋ ジャハールの 品・よみの 海底神殿 1〜4階の 宝箱
  imps: {
    hero: ['c8at_palace_sword', 'c8at_gold_mail', 'c8at_crescent_shield', 'c8bt_temple_helm', 'c8j_ruby_charm'],
    daikenja: ['c8j_snake_staff', 'c8bt_soul_robe', null, 'c8at_palace_turban', 'c8p_feather_charm'],
    god_hand: ['c7l_gold_hook', 'c8al_carpet_gi', null, 'c7it_bear_hat', 'c8j_ruby_charm'],
    high_priest: ['c8at_moon_staff', 'c7it_queen_robe', 'c8at_crescent_shield', 'c7l_kingdom_crown', 'c8bt_blue_pendant'],
  },
  //   ハデロス … ＋ ペイニックと パニクルの 品・海底神殿 5〜8階の 宝箱・第2幕の 手紙の ごほうび
  hades: {
    hero: ['c8at_palace_sword', 'c8bt_temple_mail', 'c8bt_flame_shield', 'c8bt_temple_helm', 'c8i_imp_charm'],
    daikenja: ['c8bt_lantern_staff', 'c8bt_soul_robe', null, 'c8bl_shell_crown', 'c8i_imp_charm'],
    god_hand: ['c7l_gold_hook', 'c8bl_tide_gi', null, 'c7it_bear_hat', 'c8i_imp_charm'],
    high_priest: ['c8j_snake_staff', 'c7it_queen_robe', 'c8bt_flame_shield', 'c7l_kingdom_crown', 'c8i_imp_charm'],
  },
  //   マジカメック … ＋ ハデロスの 品・くろがねの 空中ようさい 1〜4階の 宝箱
  kamek: {
    hero: ['c8at_palace_sword', 'c8bt_temple_mail', 'c8bt_flame_shield', 'c8ct_iron_helm', 'c8h_flame_charm'],
    daikenja: ['c8bt_lantern_staff', 'c8ct_sky_robe', null, 'c8bl_shell_crown', 'c8h_flame_charm'],
    god_hand: ['c7l_gold_hook', 'c8bl_tide_gi', null, 'c7it_bear_hat', 'c8h_flame_charm'],
    high_priest: ['c8j_snake_staff', 'c7it_queen_robe', 'c8bt_flame_shield', 'c7l_kingdom_crown', 'c8h_flame_charm'],
  },
  //   クッパード … ＋ マジカメックの 品・空中ようさい 5〜8階の 宝箱・第3幕の 手紙の ごほうび
  bowser: {
    hero: ['c8at_palace_sword', 'c8ct_iron_mail', 'c8ct_iron_shield', 'c8ct_iron_helm', 'c8k_magic_charm'],
    daikenja: ['c8k_magic_staff', 'c8ct_sky_robe', null, 'c8cl_star_hat', 'c8k_magic_charm'],
    god_hand: ['c7l_gold_hook', 'c8cl_wind_gi', null, 'c7it_bear_hat', 'c8k_magic_charm'],
    high_priest: ['c8ct_star_staff', 'c7it_queen_robe', 'c8ct_iron_shield', 'c7l_kingdom_crown', 'c8k_magic_charm'],
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
  if (boss === 'imps') {
    const imps = b.aliveEnemies().filter((e) => e.c8imp);
    if (!imps.length) return false;
    const pan = imps.find((e) => e.c8imp.panic > 0);
    // 大がったい・ひとりばけばけの 前ぶれ（次に 小おにが 動くと 大技）の 間は 守りを かためる（合体技を しない）
    const warned = imps.length >= 2 ? b.c8imps.left <= 1 : (imps[0].c8imp.rage && (imps[0].c8imp.left || 9) <= 1);
    if (!trick && warned) return false;
    // パニックの 小おに・HP の 多い ほう（知らない 人は パニクル）
    const r = (e) => e.hp / e.maxHp + (e.species === C8_PANIC ? 0.05 : 0);
    const t = pan || (trick ? imps.find((e) => e.species === C8_PANIC) : imps.slice().sort((x, y) => r(y) - r(x))[0]) || imps[0];
    return dualPlan(b, a, t.species, skip);
  }
  if (boss === 'hades') {
    const h = b.aliveEnemies().find((e) => e.c8hd);
    if (!h) return false;
    // けいやくの 間（炎を 当てる）・ふん火の 前ぶれ（氷を 当てる・守る）は 合体技を しない
    if (!trick && !(h.c8hd.hot || h.c8hd.cool) && ((h.c8hd.form === 1 && h.c8hd.contract) || eruptSoon(h))) return false;
    return dualPlan(b, a, h.species, skip);
  }
  if (boss === 'kamek') {
    const k = b.aliveEnemies().find((e) => e.c8km);
    if (!k) return false;
    // 魔法じんの 子分が いる 間は 子分を たおす（合体技を しない）
    if (!trick && aimedKid(b)) return false;
    return dualPlan(b, a, k.species, skip);
  }
  if (boss === 'bowser') {
    const h = b.aliveEnemies().find((e) => e.c8bw);
    if (!h) return false;
    // 橋の オノが ある 間（たたく）・大技の 前ぶれの 間（守る）は 合体技を しない
    if (!trick && (axeOf(b) || h.telegraph === 'm8b_pound' || h.telegraph === 'm8b_gigafire' || (h.c8bw.left <= 1 && !h.c8bw.fallen))) return false;
    return dualPlan(b, a, h.species, skip);
  }
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
//   'coil' とぐろでも 攻撃・'lamp' ランプを こわさない・'plot' 相談を じゃましない・'order' 2ひきの HPを そろえない・
//   'burn' けいやくしょを もやさない・'chill' ふん火を ひやさない・'aim' 魔法じんの 子分を ねらわない・'axe' 橋のオノを たたかない・
//   'dual' 合体技・'trick' ぜんぶ〈合体技は する〉）
export function ch8Run(boss, lv, know, seed, { log = false, kit = true, skip = null, guest = process.env.GUEST !== '0' } = {}) {
  const party = ch8Party(boss, lv, kit);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' }));
  let gk = 1;
  if (guest) {
    // 第1幕は カリム・第2幕は カイ（kai8）・第3幕は リオン（rion8）。第78回: 強さは きまり（shared/guest-rule.js。GRULE=0 で 前の 作り方）
    const g = ruledGuest(ACT3.has(boss) ? 'rion8' : ACT2.has(boss) ? 'kai8' : 'karim', party, lv);
    gk = g.k;
    allies.push({ char: g.char, kind: 'guest', auto: true, tactics: g.char.tactics });
  }
  const b = new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies: group(boss) });
  scaleGuestActor(b.allies.find((a) => a.kind === 'guest'), gk);
  if (know) {
    b.knowsCh6 = true;
    if (skip === 'guard' || skip === 'trick') b.c6NoGuard = true;
    if (skip === 'quiet' || skip === 'trick') b.c8aNoQuiet = true;
    if (skip === 'staff' || skip === 'trick') b.c8aNoStaff = true;
    if (skip === 'coil' || skip === 'trick') b.c8aNoCoil = true;
    if (skip === 'lamp' || skip === 'trick') b.c8aNoLamp = true;
    if (skip === 'plot' || skip === 'trick') b.c8bNoPlot = true;
    if (skip === 'order' || skip === 'trick') b.c8bNoOrder = true;
    if (skip === 'burn' || skip === 'trick') b.c8bNoBurn = true;
    if (skip === 'chill' || skip === 'trick') b.c8bNoChill = true;
    if (skip === 'aim' || skip === 'trick') b.c8cNoAim = true;
    if (skip === 'axe' || skip === 'trick') b.c8cNoAxe = true;
  }
  for (const e of b.enemies) {
    const k = (v) => Number(process.env[v] || 1);
    e.maxHp = e.hp = Math.round(e.maxHp * k('HPK'));
    e.atk = Math.round(e.atk * k('ATKK'));
    e.mag = Math.round(e.mag * k('MAGK'));
    if (e.boss) e.speed = (e.speed || 1) * k('SPD');
  }
  let real = 0;
  const n = {
    duals: 0, learned: 0, echoes: 0, echoN: 0, echoDmg: 0, empties: 0, hypnos: 0, hypnoHit: 0, breaks: 0, cobra: 0, coils: 0, bites: 0, strikes: 0, strikeDmg: 0, whiffs: 0, genie: 0, blasts: 0, blastDmg: 0, seals: 0, form: 0,
    fuses: 0, fuseDmg: 0, quarrels: 0, panics: 0, rages: 0, solos: 0, soloDmg: 0, contracts: 0, burns: 0, souls: 0, anger: 0, erupts: 0, eruptDmg: 0, cools: 0,
    aims: 0, grows: 0, fizzles: 0, summons: 0, brooms: 0, kidDmg: 0, pounds: 0, poundDmg: 0, gigas: 0, gfires: 0, gfireDmg: 0, falls: 0, axeHits: 0,
  };
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
      if (e.c8bFuse) {
        n.fuses++;
        n.fuseDmg += dmg();
      }
      if (e.c8bQuarrel) n.quarrels++;
      if (e.c8bPanic) n.panics++;
      if (e.c8bRage) n.rages++;
      if (e.c8bSolo) {
        n.solos++;
        n.soloDmg += dmg();
      }
      if (e.c8bContract) n.contracts++;
      if (e.c8bBurnt) n.burns++;
      if (e.c8bSoul) n.souls++;
      if (e.c8bAnger) n.anger++;
      if (e.c8bErupt) {
        n.erupts++;
        n.eruptDmg += dmg();
      }
      if (e.c8bCool) n.cools++;
      if (e.c8cAim) n.aims++;
      if (e.c8cGrow) n.grows++;
      if (e.c8cFizzle) n.fizzles++;
      if (e.c8cSummon) n.summons++;
      if (e.c8cBroom) n.brooms++;
      if (e.c8cPound) {
        n.pounds++;
        n.poundDmg += dmg();
      }
      if (e.c8cGiga) n.gigas++;
      if (e.c8cGigaFire) {
        n.gfires++;
        n.gfireDmg += dmg();
      }
      if (e.c8cFall) n.falls++;
      if (e.c8cAxeHit) n.axeHits++;
      const actor = b.get(e.id);
      if (actor?.c8giga) n.kidDmg += dmg();
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
  n.form = bosses[0]?.c8viz?.form || bosses[0]?.c8hd?.form || bosses[0]?.c8bw?.form || (bosses[0]?.c8km ? (bosses[0].c8km.broom ? 2 : 1) : 0);
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
      (boss === 'imps'
        ? `  がったい${avg('fuses').toFixed(1)}（1回${per('fuseDmg', 'fuses')}）  けんか${avg('quarrels').toFixed(1)}  パニック${avg('panics').toFixed(1)}  カンカン${avg('rages').toFixed(1)}  ひとり${avg('solos').toFixed(1)}（1回${per('soloDmg', 'solos')}）`
        : boss === 'hades'
        ? `  けいやく${avg('contracts').toFixed(1)}  もやした${avg('burns').toFixed(1)}  たましい${avg('souls').toFixed(1)}  おこった${avg('anger').toFixed(1)}  ふん火${avg('erupts').toFixed(1)}（1回${per('eruptDmg', 'erupts')}）  ひえた${avg('cools').toFixed(1)}  だん${avg('form').toFixed(1)}`
        : boss === 'kamek'
        ? `  魔法じん${avg('aims').toFixed(1)}  でっかく${avg('grows').toFixed(1)}  から回り${avg('fizzles').toFixed(1)}  よぶ${avg('summons').toFixed(1)}  デカの攻撃${(avg('kidDmg') / 1000).toFixed(0)}k  ほうき${avg('brooms').toFixed(1)}`
        : boss === 'bowser'
        ? `  ヒップ${avg('pounds').toFixed(1)}（1回${per('poundDmg', 'pounds')}）  ギガ${avg('gigas').toFixed(1)}  ギガほのお${avg('gfires').toFixed(1)}（1回${per('gfireDmg', 'gfires')}）  オノ${avg('axeHits').toFixed(1)}  おちた${avg('falls').toFixed(1)}  だん${avg('form').toFixed(1)}`
        : boss === 'pet'
        ? `  おぼえた${avg('learned').toFixed(1)}  オウムがえし${avg('echoes').toFixed(1)}（${(avg('echoN') / Math.max(0.01, avg('echoes'))).toFixed(1)}こ・1回${per('echoDmg', 'echoes')}）  しっぱい${avg('empties').toFixed(1)}`
        : `  さいみん${avg('hypnos').toFixed(1)}（${avg('hypnoHit').toFixed(1)}人）  つえ${avg('breaks').toFixed(1)}  とぐろ${avg('coils').toFixed(1)}  かみつき${avg('bites').toFixed(1)}  いちげき${avg('strikes').toFixed(1)}（1回${per('strikeDmg', 'strikes')}）  からぶり${avg('whiffs').toFixed(1)}  まりょく${avg('blasts').toFixed(1)}（1回${per('blastDmg', 'blasts')}）  ランプ${avg('seals').toFixed(1)}  だん${avg('form').toFixed(1)}`),
  };
}

export const SKIPS8 = {
  pet: [['quiet', '聞き耳でも 呪文'], ['guard', 'オウムがえしで 守らない'], ['dual', '合体技 だけ しない']],
  jafar: [['staff', 'つえを こわさない'], ['coil', 'とぐろでも 攻撃'], ['lamp', 'ランプを こわさない'], ['guard', 'まりょくで 守らない'], ['dual', '合体技 だけ しない']],
  imps: [['plot', '相談を じゃましない'], ['order', 'HPを そろえない'], ['guard', 'がったいで 守らない'], ['dual', '合体技 だけ しない']],
  hades: [['burn', 'けいやくしょを もやさない'], ['chill', 'ふん火を ひやさない'], ['guard', 'ふん火で 守らない'], ['dual', '合体技 だけ しない']],
  kamek: [['aim', '魔法じんを ねらわない'], ['dual', '合体技 だけ しない']],
  bowser: [['axe', 'オノを たたかない'], ['guard', '大技で 守らない'], ['dual', '合体技 だけ しない']],
};

if (process.argv[1].endsWith('sim-ch8.mjs')) {
  const N = Number(process.argv[2] || 40);
  const GROUPS = { all: ['pet', 'jafar', 'imps', 'hades', 'kamek', 'bowser'], act1: ['pet', 'jafar'], act2: ['imps', 'hades'], act3: ['kamek', 'bowser'] };
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
      console.log(`■ ${MONSTERS[CH8_IDS[boss]].name}（超級職 4人・職業Lv10${process.env.GUEST === '0' ? '' : ACT3.has(boss) ? ' ＋ リオン' : ACT2.has(boss) ? ' ＋ カイ' : ' ＋ カリム'}・${N}回。完全オート＝ふつうの オート / 知らない＝しかけを 知らない〈合体技は する〉 / 知っている＝しかけを 知って 戦う）`);
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

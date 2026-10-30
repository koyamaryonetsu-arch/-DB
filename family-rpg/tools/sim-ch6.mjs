// 第2部 第6章 Step 1・2: サンドクロック・ギアドン ／ Step 3・4: 星くいのよる鳥・ペンデュラ ／ Step 5: カリヨン ／ Step 6: ゼンマイの 強さを 見る
// つかいかた: node tools/sim-ch6.mjs [回数] [sand|gear|eater|pend|bell|zenmai|all] [lv,…]（all … 6体）
//   ゼンマイ（知っている 人: 1だんめは 家来の ときと おなじ・2だんめは 針が 10時を こえたら 歯車を 弱点で こわす・
//   こわせない ときは 大ほうかいの 前に 身を 守る。合体技は 針が 9時いじょうでは しない）
//   カリヨン（知っている 人: かねが 自分の 次の 番より 先に 鳴るなら 身を 守る・鳴った すぐ あとに 強くする／弱くする。合体技は かねの 前は しない）
//   星くいのよる鳥（知っている 人: 星を ねらったら 光・よぞらのはばたきで 守る）・ペンデュラ（時止めで ねらわれた 人は 守る・
//   大ふりこで 守る・合体技は ふりこが 右の 間は しない）。NIGHT=1 … 夜の 戦い（星座の 魔物）
//   LOG=1 … 1回だけ ようすを 出す（KNOW=1 で 知っている 人・BOSS=sand など・LV・SEED）
//   めやす（docs/plan-ch6.md の 8）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10）・その ころの 店 ＋ ★装備で
//     知っている 人 … 8〜9わり（サンドクロック: 大砂流の 前ぶれに 氷・砂が へったら 氷で もどす・止められない ときは 身を 守る／
//                              ギアドン: 時を おぼえたら 雷を 2回・ギアプレスの 前に 身を 守る。どちらも 合体技）
//     知らない 人（しかけを 知らない。合体技は する）… 4〜5わり。完全オート（ふつうの オート。合体技を しない）は もっと きびしい
//   HPK・ATKK・MAGK・SPD … 敵の 強さを かけて ためす / SHOP=1 … ★なし（店だけ）も / SKIP=0 … しかけを 1つずつ はずすのを しない
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats, canEquip } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { SAND_CLOCK, GEARDON } from '../public/js/shared/battle-ch6.js';
import { STAR_EATER, PENDULA } from '../public/js/shared/battle-road.js';
import { CARILLON } from '../public/js/shared/battle-tokei.js';
import { ZENMAI, TOKI_PHANTOM_BASES, tokiPhantomId } from '../public/js/shared/data/monsters-tokei6.js';
import { jobChar } from './sim-jobs.mjs';

// 調整用（データを かえる 前に ためす）
if (process.env.SAND) MONSTERS[SAND_CLOCK].ch6.sand.max = Number(process.env.SAND);
if (process.env.ICE) MONSTERS[SAND_CLOCK].ch6.sand.ice = Number(process.env.ICE);
if (process.env.EVERY) MONSTERS[GEARDON].ch6.gear.every = Number(process.env.EVERY);
if (process.env.WIND) MONSTERS[GEARDON].ch6.gear.wind = Number(process.env.WIND);
if (process.env.NEED) MONSTERS[GEARDON].ch6.gear.need = Number(process.env.NEED);
// ペンデュラ（PALLY・PBOSS … 左,右 の 速さ・PSTOP … 時止めの 長さ）・星くいのよる鳥（SEVERY・SHEAL・SPOW）
const nums = (v) => v.split(',').map(Number);
if (process.env.PALLY) MONSTERS[PENDULA].ch6.pend.ally = nums(process.env.PALLY);
if (process.env.PBOSS) MONSTERS[PENDULA].ch6.pend.boss = nums(process.env.PBOSS);
if (process.env.PSTOP) MONSTERS[PENDULA].ch6.pend.stop = Number(process.env.PSTOP);
if (process.env.SEVERY) MONSTERS[STAR_EATER].ch6.stars.every = Number(process.env.SEVERY);
if (process.env.SHEAL) MONSTERS[STAR_EATER].ch6.stars.heal = Number(process.env.SHEAL);
if (process.env.SPOW) MONSTERS[STAR_EATER].ch6.stars.pow = Number(process.env.SPOW);
if (process.env.DARKM) ABILITIES.m6_se_dark.effect.mult = Number(process.env.DARKM);
if (process.env.SDARK) MONSTERS[STAR_EATER].ch6.stars.dark = process.env.SDARK === '1';
if (process.env.SSTUN) MONSTERS[STAR_EATER].ch6.stars.stun = process.env.SSTUN === '1';
if (process.env.SCUT) MONSTERS[STAR_EATER].ch6.stars.cut = Number(process.env.SCUT) || null;
// カリヨン（BEVERY … かねが 鳴るまでの 回数・BMULT … かねの 一撃）
if (process.env.BEVERY) MONSTERS[CARILLON].ch6.bell.every = Number(process.env.BEVERY);
if (process.env.BMULT) MONSTERS[CARILLON].ch6.bell.mult = Number(process.env.BMULT);

// ゼンマイ（ZP2 … 2だんめに なる HP・ZBACK … 歯車で もどる 時間・ZREV … 歯車が また 動き出すまで・ZCOL … 大ほうかいの 一撃）
if (process.env.ZP2) MONSTERS[ZENMAI].ch6.zen.p2At = Number(process.env.ZP2);
if (process.env.ZBACK) MONSTERS[ZENMAI].ch6.zen.hand.back = Number(process.env.ZBACK);
if (process.env.ZREV) MONSTERS[ZENMAI].ch6.zen.hand.revive = Number(process.env.ZREV);
if (process.env.ZCOL) MONSTERS[ZENMAI].ch6.zen.collapse.mult = Number(process.env.ZCOL);

export const CH6_IDS = { sand: SAND_CLOCK, gear: GEARDON, eater: STAR_EATER, pend: PENDULA, bell: CARILLON, zenmai: ZENMAI };
// おすすめの レベル（plan-ch6.md の 8: 時のほこら Lv56〜57 の あと・時のいせき Lv58〜60 の あと）
// 星くいのよる鳥・ペンデュラ（plan-ch6.md の 12-1: 星めぐりの古道 Lv61〜64）
// カリヨン（plan-ch6.md の 15: 時計塔 1〜5階 Lv64〜66。5階の 中ボス）
// ゼンマイ（plan-ch6.md の 17: 時計塔 6〜10階 Lv66〜68。10階の ボス）
export const CH6_LV = { sand: 58, gear: 61, eater: 62, pend: 64, bell: 65, zenmai: 68 };
// 店の ランク（サンドクロックは 千年前へ 行く 前なので ハネノの ランク9・ギアドンは 千年前の 里の ランク10）
export const CH6_RANK = { sand: 9, gear: 10, eater: 10, pend: 10, bell: 10, zenmai: 10 };
// 時のまぼろし（第6章クリアの あと。ph_ボスの なまえ。ゼンマイの ころの ★装備 ＋ 第6章クリアの 武器）: node tools/sim-ch6.mjs [回数] phantom
const PH_KEYS = { sand_clock: 'sand', geardon: 'gear', star_eater: 'eater', pendula: 'pend', carillon: 'bell', zenmai: 'zenmai' };
for (const base of TOKI_PHANTOM_BASES) {
  const k = 'ph_' + PH_KEYS[base];
  CH6_IDS[k] = tokiPhantomId(base);
  CH6_LV[k] = 72;
  CH6_RANK[k] = 10;
}
export const CH6_JOBS = [['hero', '勇者'], ['daikenja', '大賢者'], ['god_hand', 'ゴッドハンド'], ['high_priest', '大神官']];
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は 店の いちばん よい 品）
//   サンドクロック … 第1部の さいごまでの ★（影の城の 宝箱・まぼろしの 品・ノクト〈本気〉と ソリトゥスの 品）
//   ギアドン … ＋ 時のほこら・千年前の フィールド・時のいせきの 宝箱と サンドクロックの 品
export const CH6_KIT = {
  sand: {
    hero: ['solitus_dawn_sword', 'cs_blackfire_mail', 'cs_mirror_shield', 'cs_gale_helm', 'solitus_bond_star'],
    daikenja: ['cs_candle_staff', 'cs_pearl_robe', null, 'cs_tide_crown', 'ph_ignia_earring'],
    god_hand: ['cs_weasel_claw', 'cs_ember_gi', null, 'et_tree_hat', 'nocto2_twin_charm'],
    high_priest: ['gift_miko_staff', 'cs_pearl_robe', 'cs_mirror_shield', 'cs_tide_crown', 'ph_morgana_pendant'],
  },
  gear: {
    hero: ['p6_ruin_sword', 'p6_chrono_mail', 'p6_hourglass_shield', 'p6_ruin_helm', 'solitus_bond_star'],
    daikenja: ['p6_sand_staff', 'p6_spring_robe', null, 'p6_clock_crown', 'p6_sand_pendant'],
    god_hand: ['p6_scorpion_claw', 'p6_ruin_gi', null, 'p6_leaf_hat', 'p6_hare_boots'],
    high_priest: ['p6_bell_staff', 'p6_sand_robe', 'p6_hourglass_shield', 'p6_clock_crown', 'ph_morgana_pendant'],
  },
  // 星くいのよる鳥 … ＋ ギアドンの 品・星読みの社の まわりと 古道 1〜4階の 宝箱
  eater: {
    hero: ['p6_tick_sword', 'p6r_road_mail', 'p6_hourglass_shield', 'p6_ruin_helm', 'p6_gear_charm'],
    daikenja: ['p6_sand_staff', 'p6r_reader_robe', null, 'p6r_dust_hat', 'p6_gear_charm'],
    god_hand: ['p6_scorpion_claw', 'p6_ruin_gi', null, 'p6r_dust_hat', 'p6_gear_charm'],
    high_priest: ['p6r_shrine_staff', 'p6r_reader_robe', 'p6_hourglass_shield', 'p6_clock_crown', 'p6_gear_charm'],
  },
  // ペンデュラ … ＋ 古道 5〜8階の 宝箱と 星くいのよる鳥の 品
  pend: {
    hero: ['p6r_road_sword', 'p6r_road_mail', 'p6r_crab_shield', 'p6r_night_helm', 'p6r_eater_plume'],
    daikenja: ['p6_sand_staff', 'p6r_reader_robe', null, 'p6r_dust_hat', 'p6r_eater_plume'],
    god_hand: ['p6r_night_claw', 'p6r_twin_gi', null, 'p6r_dust_hat', 'p6r_eater_plume'],
    high_priest: ['p6r_shrine_staff', 'p6r_reader_robe', 'p6r_crab_shield', 'p6_clock_crown', 'p6r_eater_plume'],
  },
  // カリヨン … ＋ ペンデュラの 品（さかさ時計のつえは 1本）・時計塔 1〜5階の 宝箱（5階の 宝は 中ボスの 間の 前）
  bell: {
    hero: ['p6t_tower_sword', 'p6t_tower_mail', 'p6t_dial_shield', 'p6r_night_helm', 'p6r_pendulum_charm'],
    daikenja: ['p6r_witch_staff', 'p6t_tower_robe', null, 'p6t_spring_hat', 'p6r_pendulum_charm'],
    god_hand: ['p6r_night_claw', 'p6r_twin_gi', null, 'p6t_spring_hat', 'p6r_pendulum_charm'],
    high_priest: ['p6r_shrine_staff', 'p6t_tower_robe', 'p6t_dial_shield', 'p6_clock_crown', 'p6r_pendulum_charm'],
  },
  // ゼンマイ … ＋ カリヨンの 品（かねつきの大オノは 1本）・時計塔 6〜10階の 宝箱（10階の 宝は ボスの 間の 前）
  zenmai: {
    hero: ['p6z_heart_sword', 'p6t_tower_mail', 'p6z_time_shield', 'p6z_cog_helm', 'p6t_bell_charm'],
    daikenja: ['p6z_heart_staff', 'p6t_tower_robe', null, 'p6t_spring_hat', 'p6t_bell_charm'],
    god_hand: ['p6z_cog_claw', 'p6z_heart_gi', null, 'p6t_spring_hat', 'p6t_bell_charm'],
    high_priest: ['p6r_witch_staff', 'p6t_tower_robe', 'p6z_time_shield', 'p6_clock_crown', 'p6t_bell_charm'],
  },
};
for (const k of Object.keys(CH6_IDS)) {
  if (!k.startsWith('ph_')) continue;
  const z = CH6_KIT.zenmai;
  CH6_KIT[k] = {
    hero: ['c6w_sword', ...z.hero.slice(1, 4), 'p6z_zenmai_charm'], daikenja: ['c6w_staff', ...z.daikenja.slice(1, 4), 'p6z_zenmai_charm'],
    god_hand: ['c6w_claw', ...z.god_hand.slice(1, 4), 'p6z_zenmai_charm'], high_priest: ['p6z_zenmai_staff', ...z.high_priest.slice(1, 4), 'p6z_zenmai_charm'],
  };
}
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export function ch6Party(boss, lv, kit = true) {
  return CH6_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, CH6_RANK[boss], name);
    const k = kit ? CH6_KIT[boss][job] : [];
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
const group = (boss) => (FIXED_ENCOUNTERS[CH6_IDS[boss]]?.group || [[CH6_IDS[boss], 1]]).flatMap(([sp, n]) => Array(n).fill(sp));

// 合体技を えらぶ（知っている 人）: ダメージの 合体技。仲間の HPが へっている・前ぶれ・まきもどしの 間・MPが のこり 少なく なる ときは 使わない
const hurts = (t) => t.parts.some((p) => p.type === 'power');
export function dualPlan(b, a, bossId, skip = null) {
  const boss = b.aliveEnemies().find((e) => e.species === bossId);
  // ペンデュラ: 知っている 人は ふりこが 右の 間（自分たちが おそい）は 合体技を しない
  if (boss?.pend && boss.pend.pos > 0 && skip !== 'trick') return false;
  // カリヨン: 知っている 人は かねが 近い（しるし 2つ いか）ときは 合体技を しない（守りを かためる）
  if (boss?.bell && boss.bell.left <= 2 && skip !== 'trick') return false;
  // ゼンマイ（2だんめ）: 知っている 人は 針が 9時いじょうの ときは 合体技を しない（歯車を ねらう・守る）
  if (boss?.zen?.phase === 2 && boss.zen.hand >= 9 && skip !== 'trick') return false;
  if (!boss || boss.telegraph || boss.gear?.rec !== null && boss.gear?.rec !== undefined || (boss.sand && boss.sand.lv <= 2)) return false;
  if (b.aliveAllies().some((x) => x.hp < x.maxHp * 0.55) || b.allies.some((x) => !x.alive && !x.fled)) return false;
  const opts = b.dualOptionsFor(a, null, false, true).filter((o) => {
    const t = DUAL_TECHS[o.id];
    if (!hurts(t)) return false;
    const ms = [a, ...o.partners.map((id) => b.get(id))];
    if (o.size >= 3 && ms.slice(1).some((m) => !m.ready && !m.queued && m.atb < 50)) return false;
    return ms.every((m, i) => m.mp - o.mp[i] >= m.maxMp * 0.2);
  });
  const rank = (o) => (o.id === 'dt_minadein' ? 3 : o.size >= 4 ? 2 : o.size);
  const best = opts.sort((x, y) => rank(y) - rank(x))[0];
  if (!best) return false;
  const r = b.command(a.id, { type: 'dual', id: best.id, partner: best.partner, partners: best.partners, target: boss.id }, 'sim');
  return r.ok;
}

// boss … 'sand' | 'gear' / know … 知っている 人（ない ときは ふつうの オート＝家族が「オート」に した ときと おなじ）
// skip … 知っている 人の しかけの うち 1つを はずす（'ice' 氷・'bolt' 雷・'guard' 前ぶれで 守る・'dual' 合体技）
export function ch6Run(boss, lv, know, seed, { log = false, kit = true, skip = null } = {}) {
  const party = ch6Party(boss, lv, kit);
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false, hooks: { night: () => !!process.env.NIGHT },
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' })),
    enemies: group(boss),
  });
  const bossId = CH6_IDS[boss];
  if (know) {
    b.knowsCh6 = true;
    // trick … しかけを 知らない 人（氷・雷・前ぶれで 守る を ぜんぶ しない。合体技は する）
    if (skip === 'ice' || skip === 'trick') b.c6NoIce = true;
    if (skip === 'bolt' || skip === 'trick') b.c6NoBolt = true;
    if (skip === 'guard' || skip === 'trick') b.c6NoGuard = true;
    if (skip === 'light' || skip === 'trick') b.c6NoLight = true;
    if (skip === 'buff' || skip === 'trick') b.c6NoBuff = true;
    if (skip === 'cog' || skip === 'trick') b.c6NoGear = true;
  }
  for (const e of b.enemies) {
    const k = (v) => Number(process.env[v] || 1);
    e.maxHp = e.hp = Math.round(e.maxHp * k('HPK'));
    e.atk = Math.round(e.atk * k('ATKK'));
    e.mag = Math.round(e.mag * k('MAGK'));
    if (e.boss) e.speed = (e.speed || 1) * k('SPD');
  }
  let real = 0;
  const n = { duals: 0, falls: 0, stops: 0, iceBacks: 0, records: 0, rewinds: 0, healed: 0, breaks: 0, presses: 0, eats: 0, stuns: 0, darks: 0, tstops: 0, tguards: 0, bigs: 0, rings: 0, lost: 0, fixed: 0, ringDmg: 0, guarded: 0, p2: 0, collapses: 0, colDmg: 0, cogs: 0, stages: 0 };
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + [...(e.lines || [])].join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) n.duals++;
      if (e.scFall) n.falls++;
      if (e.scStop) n.stops++;
      if (e.scBack) n.iceBacks++;
      if (e.gdRecord) n.records++;
      if (e.gdRewind) {
        n.rewinds++;
        n.healed += e.gdRewind.heal;
      }
      if (e.gdBreak) n.breaks++;
      if (e.ability === 'm6_gd_press') n.presses++;
      if (e.seEat) n.eats++;
      if (e.seStun) n.stuns++;
      if (e.ability === 'm6_se_dark') n.darks++;
      if (e.pdStop) n.tstops++;
      if (e.pdGuard) n.tguards++;
      if (e.ability === 'm6_pd_big') n.bigs++;
      if (e.zenP2) n.p2++;
      if (e.zenStage) n.stages++;
      if (e.zenBack) n.cogs++;
      if (e.zenCollapse) {
        n.collapses++;
        n.colDmg += (e.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
      }
      if (e.tkRing) {
        n.rings++;
        n.lost += e.tkRing.lost;
        n.fixed += e.tkRing.fixed;
        n.ringDmg += (e.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
        n.guarded += b.allies.filter((x) => x.alive && x.defending).length;
      }
    }
    if (!know) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive) continue;
      if (skip === 'dual' || !dualPlan(b, a, bossId, skip)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  const al = b.allies;
  const main = b.enemies.find((e) => e.species === bossId);
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: main ? main.hp / main.maxHp : 0, ...n,
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary(res, boss = null) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  return {
    rate: w / res.length,
    text: `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  ボスの残${(avg('bossLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}` +
      (boss === 'eater' ? `  星くい${avg('eats').toFixed(1)}  目をくらませた${avg('stuns').toFixed(1)}  よぞらのはばたき${avg('darks').toFixed(1)}`
        : boss === 'pend' ? `  時止め${avg('tstops').toFixed(1)}（守って はねかえした${avg('tguards').toFixed(1)}）  大ふりこ${avg('bigs').toFixed(1)}`
        : boss === 'zenmai' ? `  2だんめ${(avg('p2') * 100).toFixed(0)}%  しかけ${avg('stages').toFixed(1)}  時のかね${avg('rings').toFixed(1)}  大ほうかい${avg('collapses').toFixed(2)}（1回${(avg('colDmg') / Math.max(0.01, avg('collapses'))).toFixed(0)}）  歯車をこわした${avg('cogs').toFixed(1)}`
        : boss === 'bell' ? `  時のかね${avg('rings').toFixed(1)}（消えた バフ${avg('lost').toFixed(1)}・デバフ${avg('fixed').toFixed(1)}・守っていた 人${(avg('guarded') / Math.max(0.01, avg('rings'))).toFixed(1)}/回・1回の ダメージ${(avg('ringDmg') / Math.max(0.01, avg('rings'))).toFixed(0)}）`
          : `  大砂流${avg('falls').toFixed(1)}（止めた${avg('stops').toFixed(1)}・氷で もどす${avg('iceBacks').toFixed(1)}）  おぼえる${avg('records').toFixed(1)} まきもどし${avg('rewinds').toFixed(1)}（${avg('healed').toFixed(0)}）こわした${avg('breaks').toFixed(1)} プレス${avg('presses').toFixed(1)}`),
  };
}

// 知っている 人の しかけの うち 1つだけ しない（どれが どれだけ 効くか）
export const SKIPS = {
  sand: [['ice', '氷を 使わない'], ['guard', '大砂流で 守らない'], ['dual', '合体技 だけ しない']],
  gear: [['bolt', '雷を 使わない'], ['guard', 'プレスで 守らない'], ['dual', '合体技 だけ しない']],
  eater: [['light', '光を 使わない'], ['guard', 'はばたきで 守らない'], ['dual', '合体技 だけ しない']],
  pend: [['guard', '時止め・大ふりこで 守らない'], ['dual', '合体技 だけ しない']],
  bell: [['guard', 'かねの 前に 守らない'], ['buff', '鳴った あとに 強くしない'], ['dual', '合体技 だけ しない']],
  zenmai: [['cog', '歯車を ねらわない'], ['guard', '前ぶれ・大ほうかいで 守らない'], ['ice', '氷を 使わない'], ['dual', '合体技 だけ しない']],
};

// リオンの けいこ（1人で 戦う。ふつうの オート）: node tools/sim-ch6.mjs [回数] spar [lv,…]
//   超級職 4しゅ（ゼンマイの ころの ★装備）が 1人ずつ rion_spar1〜3 と 戦う
export function sparRun(spar, job, lv, seed) {
  const c = ch6Party('zenmai', lv).find((x) => x.job === job);
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false,
    allies: [{ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' }],
    enemies: FIXED_ENCOUNTERS[spar].group.flatMap(([sp, n]) => Array(n).fill(sp)),
  });
  let real = 0;
  while (!b.over && real < 20 * 60 * 1000) {
    b.tick(50);
    real += 50;
  }
  const a = b.allies[0];
  return { outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000), hpLeft: a.hp / a.maxHp, bossLeft: b.enemies[0].hp / b.enemies[0].maxHp };
}

if (process.argv[1].endsWith('sim-ch6.mjs') && process.argv[3] === 'spar') {
  const N = Number(process.argv[2] || 40);
  const lvs = process.argv[4] ? process.argv[4].split(',').map(Number) : [66, 68, 70];
  for (const spar of ['rion_spar1', 'rion_spar2', 'rion_spar3']) {
    console.log(`■ リオンの けいこ ${spar}（1人・ふつうの オート・${N}回）`);
    for (const lv of lvs) {
      const row = CH6_JOBS.map(([job, name]) => {
        const res = [...Array(N).keys()].map((i) => sparRun(spar, job, lv, 5300 + i * 7919));
        const w = res.filter((r) => r.outcome === 'win').length;
        const sec = res.reduce((t, r) => t + r.seconds, 0) / N;
        return `${name} ${pct(w, N)}（${sec.toFixed(0)}秒）`;
      });
      console.log(`  Lv${lv}  ${row.join('  ')}`);
    }
  }
} else if (process.argv[1].endsWith('sim-ch6.mjs') && process.argv[3] === 'phantom') {
  const N = Number(process.argv[2] || 30);
  const lvs = process.argv[4] ? process.argv[4].split(',').map(Number) : [70, 72, 74];
  const seedOf = (i) => 7070 + i * 7919;
  for (const k of Object.keys(CH6_IDS).filter((x) => x.startsWith('ph_'))) {
    for (const lv of lvs) {
      for (const [skip, label] of [['trick', '知らない　'], [null, '知っている']]) {
        const res = [...Array(N).keys()].map((i) => ch6Run(k, lv, true, seedOf(i), { skip }));
        console.log('  ' + MONSTERS[CH6_IDS[k]].name.padEnd(14, '　') + ' Lv' + lv + ' ' + label + ' ' + summary(res, k.slice(3)).text.slice(0, 64));
      }
    }
  }
} else if (process.argv[1].endsWith('sim-ch6.mjs')) {
  const N = Number(process.argv[2] || 40);
  const which = process.argv[3] && process.argv[3] !== 'all' ? [process.argv[3]] : ['sand', 'gear', 'eater', 'pend', 'bell', 'zenmai'];
  const seedOf = (i) => 6060 + i * 7919;
  if (process.env.LOG) {
    const boss = process.env.BOSS || 'sand';
    const r = ch6Run(boss, Number(process.env.LV || CH6_LV[boss]), !!process.env.KNOW, Number(process.env.SEED || 1), { log: true, skip: process.env.SKIPONE || null });
    console.log(r);
  } else {
    for (const boss of which) {
      const base = CH6_LV[boss];
      const lvs = process.argv[4] ? process.argv[4].split(',').map(Number) : [base - 1, base, base + 1];
      console.log(`■ ${MONSTERS[CH6_IDS[boss]].name}（超級職 4人・職業Lv10・${N}回。完全オート＝ふつうの オート / 知らない＝しかけを 知らない〈合体技は する〉 / 知っている＝しかけを 知って 戦う）`);
      for (const c of ch6Party(boss, base)) {
        const s = computeStats(c);
        console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
      }
      for (const kit of [true, false]) {
        for (const lv of lvs) {
          // 完全オート（ふつうの オート）・知らない（しかけを 知らない。合体技は する）・知っている
          for (const [know, skip, label] of [[false, null, '完全オート　'], [true, 'trick', '知らない　　'], [true, null, '知っている　']]) {
            const res = [...Array(N).keys()].map((i) => ch6Run(boss, lv, know, seedOf(i), { kit, skip }));
            console.log(`  Lv${lv} ${kit ? '店＋★' : '店だけ'} ${label} ${summary(res, boss).text}`);
          }
        }
        if (!process.env.SHOP) break;
      }
      if (process.env.SKIP !== '0') {
        for (const [skip, label] of SKIPS[boss]) {
          const res = [...Array(N).keys()].map((i) => ch6Run(boss, base, true, seedOf(i), { skip }));
          console.log(`  Lv${base} 知っている（${label}）${''.padEnd(Math.max(0, 12 - label.length), '　')} ${summary(res, boss).text}`);
        }
      }
    }
  }
}

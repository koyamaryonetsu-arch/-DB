// 第5章 Step 8: 影の城の 3人の まぼろし（ストルム・イグニア・モルガナ）の 強さを 見る
// つかいかた: node tools/sim-phantom.mjs [回数] [storm|ignia|morgana|all] [lv,…]
//   LOG=1 … 1回だけ ようすを 出す（KNOW=1 で 知っている 人・BOSS=storm など・LV・SEED）
//   めやす（docs/plan-ch5.md の 17）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10）・
//   ハネノの ランク9の 店 ＋ その ころの ★装備（大地の神殿の 宝箱・みんなが くれる 品・ノクト（1回目）の 品・影の城の 宝箱と 前の まぼろしの 品）で
//     完全オート（ふつうの オート）… 勝率 1〜2割
//     知っている 人 … 7割くらい
//       ストルム … 大竜巻の 前に 身を 守る・風のかべの 間は 物理の かわりに 呪文・回復・身を 守る（嵐の兵が いれば 兵を）・合体技
//       イグニア … かげ火を 先に たおす・大炎の 前に 身を 守る・合体技
//       モルガナ … 本物を 見ぬく（足もとの 影）・水の衣に 雷・おなじ 呪文を つづけない（battle-temple.js の knowsTemple）・大波の 前に 身を 守る・合体技
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats, canEquip } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { PHANTOM_STORM, PHANTOM_IGNIA, PHANTOM_MORGANA, flamesOf } from '../public/js/shared/battle-phantom.js';
import { jobChar } from './sim-jobs.mjs';

// 調整用（データを かえる 前に ためす）: モルガナの 分身に 当てた ときの 回復・水かさ・風のかべの 長さ
if (process.env.MHEAL) MONSTERS[PHANTOM_MORGANA].mirage.heal = Number(process.env.MHEAL);
if (process.env.VEIL) MONSTERS[PHANTOM_MORGANA].veil.cut = Number(process.env.VEIL);
if (process.env.TIDE) MONSTERS[PHANTOM_MORGANA].castle.tide.max = Number(process.env.TIDE);
if (process.env.WALL) MONSTERS[PHANTOM_STORM].castle.wall.acts = Number(process.env.WALL);
if (process.env.BACK) MONSTERS[PHANTOM_STORM].castle.wall.back = Number(process.env.BACK);
if (process.env.TORN) ABILITIES.m_ps_tornado.effect.mult = Number(process.env.TORN);
if (process.env.FUEL) MONSTERS[PHANTOM_IGNIA].castle.fuel.per = Number(process.env.FUEL);

export const PHANTOM_IDS = { storm: PHANTOM_STORM, ignia: PHANTOM_IGNIA, morgana: PHANTOM_MORGANA };
// おすすめの レベル（17）
export const PHANTOM_LV = { storm: 52, ignia: 53, morgana: 54 };
export const PHANTOM_JOBS = [['hero', '勇者'], ['daikenja', '大賢者'], ['god_hand', 'ゴッドハンド'], ['high_priest', '大神官']];
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は ハネノの ランク9の 店の いちばん よい 品）
//   ストルム（4階）… 大地の神殿の 宝箱・みんなが くれる 品・ノクト（1回目）と それまでの ボスの 品
//   イグニア（8階）… ＋ 影の城 1〜4階の 宝箱・ストルムの まぼろしの 品
//   モルガナ（12階）… ＋ 5〜8階の 宝箱・イグニアの まぼろしの 品
export const PHANTOM_KIT = {
  storm: {
    hero: ['et_earth_sword', 'et_bedrock_mail', 'et_keeper_shield', 'valkyrie_helm', 'gift_royal_charm'],
    daikenja: ['et_spring_staff', 'et_spring_robe', null, 'et_earth_crown', 'nocto_earth_charm'],
    god_hand: ['et_moss_claw', 'et_earth_gi', null, 'et_tree_hat', 'gaia_fang_charm'],
    high_priest: ['gift_miko_staff', 'mem_starmap_robe', 'atlas_shield', 'mem_star_crown', 'argos_pendant'],
  },
  ignia: {
    hero: ['et_earth_sword', 'et_bedrock_mail', 'et_keeper_shield', 'cs_gale_helm', 'gift_royal_charm'],
    daikenja: ['et_spring_staff', 'cs_storm_mantle', null, 'et_earth_crown', 'nocto_earth_charm'],
    god_hand: ['cs_weasel_claw', 'et_earth_gi', null, 'et_tree_hat', 'cs_sky_boots'],
    high_priest: ['gift_miko_staff', 'mem_starmap_robe', 'atlas_shield', 'mem_star_crown', 'ph_storm_bangle'],
  },
  morgana: {
    hero: ['et_earth_sword', 'cs_blackfire_mail', 'cs_flame_shield', 'cs_gale_helm', 'gift_royal_charm'],
    daikenja: ['cs_candle_staff', 'cs_storm_mantle', null, 'et_earth_crown', 'ph_ignia_earring'],
    god_hand: ['cs_weasel_claw', 'cs_ember_gi', null, 'et_tree_hat', 'cs_sky_boots'],
    high_priest: ['gift_miko_staff', 'mem_starmap_robe', 'atlas_shield', 'mem_star_crown', 'ph_storm_bangle'],
  },
};
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export function phantomParty(boss, lv, kit = true) {
  return PHANTOM_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, 9, name);
    const k = kit ? PHANTOM_KIT[boss][job] : [];
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
const group = (boss) => FIXED_ENCOUNTERS[PHANTOM_IDS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));

// 合体技を えらぶ（知っている 人）: ダメージの 合体技。仲間の HPが へっている・大技の 前ぶれ・MPが のこり 少なく なる ときは 使わない。
// かげ火・嵐の兵が いる ときは 全体の 合体技を 先に。まぼろしの 分身は ねらわない（本物）
const hurts = (t) => t.parts.some((p) => p.type === 'power');
const allFoes = (t) => ['enemies', 'group'].includes(t.target);
function dualPlan(b, a, bossId) {
  const foes = b.aliveEnemies().filter((e) => !e.clone);
  const boss = foes.find((e) => e.species === bossId);
  if (!boss || foes.some((e) => e.telegraph)) return false;
  if (b.aliveAllies().some((x) => x.hp < x.maxHp * 0.55) || b.allies.some((x) => !x.alive && !x.fled)) return false;
  const adds = foes.filter((e) => e !== boss);
  const opts = b.dualOptionsFor(a, null, false, true).filter((o) => {
    const t = DUAL_TECHS[o.id];
    if (!hurts(t)) return false;
    const ms = [a, ...o.partners.map((id) => b.get(id))];
    if (o.size >= 3 && ms.slice(1).some((m) => !m.ready && !m.queued && m.atb < 50)) return false;
    return ms.every((m, i) => m.mp - o.mp[i] >= m.maxMp * 0.2);
  });
  const rank = (o) => (adds.length && allFoes(DUAL_TECHS[o.id]) ? 5 : o.id === 'dt_minadein' ? 3 : o.size >= 4 ? 2 : o.size);
  const best = opts.sort((x, y) => rank(y) - rank(x))[0];
  if (!best) return false;
  const target = flamesOf(b).sort((x, y) => x.hp - y.hp)[0] || boss;
  const r = b.command(a.id, { type: 'dual', id: best.id, partner: best.partner, partners: best.partners, target: target.id }, 'sim');
  return r.ok;
}

// boss … 'storm' | 'ignia' | 'morgana' / know … 知っている 人（ない ときは ふつうの オート＝家族が「オート」に した ときと おなじ）
// skip … 知っている 人の しかけの うち 1つを はずす（'guard' 大技の 前に 守る・'wall' 風のかべ・'flame' かげ火を 先に・
//        'temple' 水の衣に 雷・鏡写しを さける・'mirage' 本物を 見ぬく・'dual' 合体技）
export function phantomRun(boss, lv, know, seed, { log = false, kit = true, skip = null } = {}) {
  const party = phantomParty(boss, lv, kit);
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false,
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' })),
    enemies: group(boss),
  });
  const bossId = PHANTOM_IDS[boss];
  if (know) {
    b.knowsPhantom = true;
    if (boss === 'morgana') {
      if (skip !== 'temple') b.knowsTemple = true;
      if (skip !== 'mirage') b.knowsMirage = true;
    }
    if (skip === 'guard') b.phNoGuard = true;
    if (skip === 'wall') b.phNoWall = true;
    if (skip === 'flame') b.phNoFlame = true;
  }
  for (const e of b.enemies) {
    const k = (v) => Number(process.env[v] || 1);
    e.maxHp = e.hp = Math.round(e.maxHp * k('HPK'));
    e.atk = Math.round(e.atk * k('ATKK'));
    e.mag = Math.round(e.mag * k('MAGK'));
    if (e.boss) e.speed = (e.speed || 1) * k('SPD');
  }
  let real = 0;
  const n = { duals: 0, walls: 0, bounces: 0, tornados: 0, calls: 0, infernos: 0, fuel: 0, waves: 0, tideDown: 0, clonesHit: 0 };
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + [...(e.lines || [])].join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) n.duals++;
      if (e.psWall) n.walls++;
      if (e.psBounce) n.bounces++;
      if (e.ability === 'm_ps_tornado') n.tornados++;
      if (e.piCall) n.calls++;
      if (e.piInferno) {
        n.infernos++;
        n.fuel += e.piInferno.fuel;
      }
      if (e.ability === 'm_pm_wave') n.waves++;
      if (e.pmTide?.down) n.tideDown++;
      if (e.mirageHeal !== undefined) n.clonesHit++;
    }
    if (!know) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive) continue;
      if (skip === 'dual' || !dualPlan(b, a, bossId)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  const al = b.allies;
  const main = b.enemies.find((e) => e.species === bossId && !e.clone);
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: main ? main.hp / main.maxHp : 0, ...n,
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary(res) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  return {
    rate: w / res.length,
    text: `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  ボスの残${(avg('bossLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}` +
      `  かべ${avg('walls').toFixed(1)}（はね返し${avg('bounces').toFixed(1)}）竜巻${avg('tornados').toFixed(1)}  かげ火${avg('calls').toFixed(1)} 大炎${avg('infernos').toFixed(1)}（すいこみ${avg('fuel').toFixed(1)}）  大波${avg('waves').toFixed(1)}（水かさ↓${avg('tideDown').toFixed(1)}）分身${avg('clonesHit').toFixed(1)}`,
  };
}

// 知っている 人の しかけの うち 1つだけ しない（どれが どれだけ 効くか）
export const SKIPS = {
  storm: [['guard', '竜巻で 守らない'], ['wall', '風のかべでも 物理'], ['dual', '合体技 だけ しない']],
  ignia: [['flame', 'かげ火を ねらわない'], ['guard', '大炎で 守らない'], ['dual', '合体技 だけ しない']],
  morgana: [['mirage', '本物を 見ぬかない'], ['temple', '雷・鏡写しを 知らない'], ['guard', '大波で 守らない'], ['dual', '合体技 だけ しない']],
};

if (process.argv[1].endsWith('sim-phantom.mjs')) {
  const N = Number(process.argv[2] || 40);
  const which = process.argv[3] && process.argv[3] !== 'all' ? [process.argv[3]] : ['storm', 'ignia', 'morgana'];
  const seedOf = (i) => 5252 + i * 7919;
  if (process.env.LOG) {
    const boss = process.env.BOSS || 'storm';
    const r = phantomRun(boss, Number(process.env.LV || PHANTOM_LV[boss]), !!process.env.KNOW, Number(process.env.SEED || 1), { log: true });
    console.log(r);
  } else {
    for (const boss of which) {
      const base = PHANTOM_LV[boss];
      const lvs = process.argv[4] ? process.argv[4].split(',').map(Number) : [base - 1, base, base + 1];
      console.log(`■ ${MONSTERS[PHANTOM_IDS[boss]].name}（超級職 4人・職業Lv10・${N}回。完全オート＝ふつうの オート / 知っている＝しかけを 知って 戦う）`);
      for (const c of phantomParty(boss, base)) {
        const s = computeStats(c);
        console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
      }
      for (const kit of [true, false]) {
        for (const lv of lvs) {
          for (const know of [false, true]) {
            const res = [...Array(N).keys()].map((i) => phantomRun(boss, lv, know, seedOf(i), { kit }));
            console.log(`  Lv${lv} ${kit ? '店＋★' : '店だけ'} ${know ? '知っている　' : '完全オート　'} ${summary(res).text}`);
          }
        }
        if (!process.env.SHOP) break;
      }
      if (process.env.SKIP !== '0') {
        for (const [skip, label] of SKIPS[boss]) {
          const res = [...Array(N).keys()].map((i) => phantomRun(boss, base, true, seedOf(i), { skip }));
          console.log(`  Lv${base} 知っている（${label}）${''.padEnd(Math.max(0, 12 - label.length), '　')} ${summary(res).text}`);
        }
      }
    }
  }
}

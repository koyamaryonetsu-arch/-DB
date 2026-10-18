// 第5章 Step 5: ノクトの影（職業の まね・合体技の よやくを こわす）の 強さを 見る
// つかいかた: node tools/sim-nocto.mjs [回数] [lv,…]   LOG=1 … 1回だけ ようすを 出す（KNOW=1 で 知っている 人）
//   めやす（家族が 決めた。docs/plan-ch5.md の 14）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10・Lv47）・
//   ランク8の 店（星読みの里）＋ その ころの ★装備（思い出の迷宮の 宝箱・ガイアイーターと それまでの ボスの 品）で
//     完全オート（ふつうの オート。何も 知らない）… 勝率 1〜2割
//     知っている 人 … きずなくだきの 前ぶれで 合体技の 組と 先に 番が 来る 人が 身を 守る・まねられた 人は 攻撃しない・
//                    合体技（まねられた 人から さそう）… 7割くらい
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { BOND_BREAK } from '../public/js/shared/battle-nocto.js';
import { jobChar } from './sim-jobs.mjs';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
// 調整用: 見切りの 反撃の 強さ・きずなくだきの 強さ
if (process.env.BOND) MONSTERS.nocto_shadow.nocto.bond.mult = Number(process.env.BOND);

const N = Number(process.argv[2] || 40);
const LVS = process.argv[3] ? process.argv[3].split(',').map(Number) : [46, 47, 48];
// 超級職 4人
export const NOCTO_JOBS = [['hero', '勇者'], ['daikenja', '大賢者'], ['god_hand', 'ゴッドハンド'], ['high_priest', '大神官']];
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は ランク8の 店〈星読みの里〉の いちばん よい 品）
//   思い出の迷宮の 宝箱（MEMORY_TREASURE）・しずみゆく島の 神殿の 宝箱・ガイアイーター・アルゴス・古竜の 品
export const NOCTO_KIT = {
  hero: ['mem_lightshadow_sword', 'mem_moonlight_mail', 'mem_lamp_shield', 'valkyrie_helm', 'gaia_fang_charm'],
  daikenja: ['mem_venus_staff', 'mem_starmap_robe', null, 'mem_star_crown', 'icarus_wings'],
  god_hand: ['mem_moon_claw', 'tenku_mail', null, 'hundred_eye_helm', 'old_dragon_eye'],
  high_priest: ['raiun_staff', 'gaia_robe', 'atlas_shield', 'hanebito_plume', 'argos_pendant'],
};
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export function noctoParty(lv, kit = true) {
  return NOCTO_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, 8, name);
    const k = kit ? NOCTO_KIT[job] : [];
    SLOTS.forEach((sl, i) => {
      if (!k[i]) return;
      if (!ITEMS[k[i]]) throw new Error(k[i]);
      c.equip[sl] = k[i];
    });
    fullHeal(c);
    return c;
  });
}
const group = () => FIXED_ENCOUNTERS.nocto_shadow.group.flatMap(([sp, n]) => Array(n).fill(sp));

// 合体技を えらぶ（知っている 人）: ダメージの 合体技（ミナデイン・全員集合 など）。まねられた 人を 先に さそう人に。
// 仲間の HPが へっている・きずなくだきの 前ぶれ（そろって いない とき）・MPが のこり 少なく なる ときは 使わない
const hurts = (t) => t.parts.some((p) => p.type === 'power');
function dualPlan(b, a) {
  const boss = b.aliveEnemies()[0];
  if (!boss) return false;
  if (b.aliveAllies().some((x) => x.hp < x.maxHp * 0.55) || b.allies.some((x) => !x.alive && !x.fled)) return false;
  const warned = boss.telegraph === BOND_BREAK;
  // まねられた 人が いれば、その 人が さそう（ほかの 人は その 人の さそいを まつ）
  const mim = b.allies.find((x) => x.alive && x.nsMimicked);
  if (mim && mim !== a && mim.ready === false && !mim.queued && !b.nsNoMimic) return false;
  const opts = b.dualOptionsFor(a, null, false, true).filter((o) => {
    const t = DUAL_TECHS[o.id];
    if (!hurts(t)) return false;
    const ms = [a, ...o.partners.map((id) => b.get(id))];
    // 前ぶれの あとは、みんなの 番が 来ている（すぐ 出せる）ときだけ
    if (warned && ms.slice(1).some((m) => !m.ready || m.queued)) return false;
    if (o.size >= 3 && ms.slice(1).some((m) => !m.ready && !m.queued && m.atb < 50)) return false;
    return ms.every((m, i) => m.mp - o.mp[i] >= m.maxMp * 0.2);
  });
  const rank = (o) => (o.id === 'dt_minadein' ? 3 : o.size >= 4 ? 2 : o.size);
  const best = opts.sort((x, y) => rank(y) - rank(x))[0];
  if (!best) return false;
  const r = b.command(a.id, { type: 'dual', id: best.id, partner: best.partner, partners: best.partners, target: boss.id }, 'sim');
  return r.ok;
}

// know … 知っている 人（上の 3つ）/ 知らない 人 … ふつうの オート（家族が「オート」に した ときと おなじ）
// skip … 知っている 人の 3つの うち 1つを はずす（'guard' 前ぶれで 守る・'mimic' まねられた 人は 攻撃しない・'dual' 合体技）
export function noctoRun(lv, know, seed, { log = false, kit = true, skip = null } = {}) {
  const party = noctoParty(lv, kit);
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false,
    allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: !know, tactics: 'balanced' })),
    enemies: group(),
  });
  if (know) b.knowsNocto = true;
  // 調整用（データを かえる 前に ためす）: HP・攻撃・魔力の 倍率
  for (const e of b.enemies) {
    const k = (v) => Number(process.env[v] || 1);
    e.maxHp = e.hp = Math.round(e.maxHp * k('HPK'));
    e.atk = Math.round(e.atk * k('ATKK'));
    e.mag = Math.round(e.mag * k('MAGK'));
  }
  if (skip === 'guard') b.nsNoGuard = true;
  if (skip === 'mimic') b.nsNoMimic = true;
  let real = 0, duals = 0, dodges = 0, broke = 0, guarded = 0, bonds = 0, mimics = 0, copied = 0;
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + (e.lines || []).join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) duals++;
      if (e.nsSeen) dodges++;
      if (e.nsMimic) mimics++;
      if (e.nsBond) {
        bonds++;
        broke += e.nsBond.broke;
        guarded += e.nsBond.guarded.length;
      }
      if (e.ability && b.get(e.id)?.species === 'nocto_shadow' && !e.ability.startsWith('m_ns_') && e.ability !== 'attack') copied++;
    }
    if (!know) continue;
    for (const a of b.allies) {
      if (!a.ready || !a.alive) continue;
      if (skip === 'dual' || !dualPlan(b, a)) {
        a.ready = false;
        b.enqueue(a, { type: 'ai' });
      }
    }
  }
  const al = b.allies;
  return {
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: b.enemies.reduce((s, e) => s + e.hp, 0) / b.enemies.reduce((s, e) => s + e.maxHp, 0),
    duals, dodges, broke, guarded, bonds, mimics, copied,
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary(res) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  return {
    rate: w / res.length,
    text: `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  影の残${(avg('bossLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}  見切られ${avg('dodges').toFixed(1)}  きずなくだき${avg('bonds').toFixed(1)}（くだかれ${avg('broke').toFixed(1)}・守った${avg('guarded').toFixed(1)}）  まね${avg('mimics').toFixed(1)}・まねた技${avg('copied').toFixed(1)}`,
  };
}

if (process.argv[1].endsWith('sim-nocto.mjs')) {
  const seedOf = (i) => 4747 + i * 7919;
  if (process.env.LOG) {
    const r = noctoRun(Number(process.env.LV || 47), !!process.env.KNOW, Number(process.env.SEED || 1), { log: true });
    console.log(r);
  } else {
    console.log('■ 装備の 強さ（Lv47・ランク8の 店〈星読みの里〉＋★）');
    for (const c of noctoParty(47)) {
      const s = computeStats(c);
      console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
    }
    console.log(`■ ノクトの影（超級職 4人・職業Lv10・${N}回。完全オート＝ふつうの オート / 知っている＝前ぶれで 守る・まねられた 人は 攻撃しない・合体技）`);
    for (const kit of [true, false]) {
      for (const lv of LVS) {
        for (const know of [false, true]) {
          const res = [...Array(N).keys()].map((i) => noctoRun(lv, know, seedOf(i), { kit }));
          console.log(`  Lv${lv} ${kit ? '店＋★' : '店だけ'} ${know ? '知っている　' : '完全オート　'} ${summary(res).text}`);
        }
      }
      if (!process.env.SHOP) break;
    }
    // 知っている 人の 3つの うち 1つだけ しない（どれが どれだけ 効くか）
    const lv = LVS.includes(47) ? 47 : LVS[0];
    for (const [skip, label] of [['guard', '前ぶれで 守る だけ しない'], ['mimic', 'まねられても 攻撃する'], ['dual', '合体技 だけ しない']]) {
      const res = [...Array(N).keys()].map((i) => noctoRun(lv, true, seedOf(i), { skip }));
      console.log(`  Lv${lv} 知っている（${label}）${''.padEnd(14 - label.length, '　')} ${summary(res).text}`);
    }
  }
}

// レア装備（第31回）で 物語の ボスが 簡単に なりすぎないかを 見る
// つかいかた: node tools/sim-rare.mjs [回数]
//   店の 装備（tools/sim.js の GEAR）と、その ころ 手に入る レア装備に した パーティー（せんし・そうりょ・まほう・ぶとう・職業Lv10）を くらべる
//   rare38 … 第4章の おわり（宝の地図 Lv8〜10 の 主の 宝箱・ボスの ときどきの 品・ひみつのダンジョン 30階くらい）
//   rare42 … 第5章（宝の地図 Lv10〜12・ひみつのダンジョン 45階くらい）
//   deep   … ひみつのダンジョン 60階より 下の ★5（第5章では まず とどかない。上の めやす）
import { makeChar, runBattle, withSara, morganaFight, argosFight, dragonFight } from './sim.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { fullHeal, computeStats } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';

const N = Number(process.argv[2] || 40);
const JOBS4 = [['warrior', 'せんし'], ['priest', 'そうりょ'], ['mage', 'まほう'], ['monk', 'ぶとう']];
// [武器, よろい, たて, 頭, アクセ]（null は 店の 装備の まま）
export const KITS = {
  rare38: {
    warrior: ['majin_scimitar', 'mithril_mail', 'flare_shield', 'earth_helm', null],
    priest: ['ankh_staff', 'aurora_robe', 'flare_shield', 'sleeping_ribbon', null],
    mage: ['witch_broom', 'aurora_robe', null, 'witch_hat', null],
    monk: [null, 'flame_haori', null, 'tanuki_leaf', null],
  },
  rare42: {
    warrior: ['kagutsuchi', 'white_dragon_mail', 'leviathan_shield', null, null],
    priest: ['aurora_staff', 'dream_robe', 'aegis_shield', 'lost_crown', null],
    mage: ['aurora_staff', 'dream_robe', null, 'lost_crown', 'magatama'],
    monk: [null, null, null, 'tanuki_leaf', null],
  },
  deep: {
    warrior: ['heaven_earth_sword', 'god_dragon_mail', 'yata_mirror', 'hundred_eye_helm', 'galaxy_bell'],
    priest: ['thunder_god_staff', 'heavenly_robe', 'yata_mirror', 'lost_crown', 'philosopher_stone'],
    mage: ['thunder_god_staff', 'heavenly_robe', null, 'lost_crown', 'philosopher_stone'],
    monk: ['fenrir_claw', null, null, 'tanuki_leaf', 'kinto_cloud'],
  },
};
const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export function kitParty(lv, tier, kit) {
  return JOBS4.map(([job, name]) => {
    const c = makeChar(job, lv, 10, name, tier);
    const k = KITS[kit]?.[job] || [];
    SLOTS.forEach((sl, i) => { if (k[i]) { if (!ITEMS[k[i]]) throw new Error(k[i]); c.equip[sl] = k[i]; } });
    fullHeal(c);
    return c;
  });
}
const fixedOf = (enc) => FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));

function summarize(label, res) {
  const wins = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  console.log(`${label.padEnd(30)} 勝率 ${String(Math.round((wins / res.length) * 100)).padStart(3)}%  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}`);
}
function power(party) {
  return party.map((c) => { const s = computeStats(c); return `${c.name} 攻${s.atk} 守${s.dfn} 魔${s.mag}`; }).join(' / ');
}

if (process.argv[1].endsWith('sim-rare.mjs')) {
  console.log('■ 装備の 強さ（Lv42）');
  console.log('  店  :', power(kitParty(42, 42, null)));
  console.log('  rare42:', power(kitParty(42, 42, 'rare42')));
  console.log('  deep  :', power(kitParty(42, 42, 'deep')));
  // モルガナ → 真の すがた（第4章 Step 7。おすすめ Lv38・知っている）
  for (const lv of [36, 37, 38]) {
    for (const kit of [null, 'rare38']) {
      const res = [];
      for (let i = 0; i < N; i++) {
        const seed = 777 + i * 7919;
        if (!kit) { res.push(morganaFight(lv, seed, true)); continue; }
        const party = withSara(kitParty(lv, 38, kit), lv);
        const flags = { knowsMirage: true, knowsTemple: true };
        const r1 = runBattle(party, fixedOf('morgana'), { seed, boss: true, carry: true, ...flags });
        if (r1.outcome !== 'win') { res.push(r1); continue; }
        for (const c of party) fullHeal(c);
        const r2 = runBattle(party, fixedOf('morgana_true'), { seed: seed + 1, boss: true, carry: true, song: true, ...flags });
        res.push({ ...r2, seconds: r1.seconds + r2.seconds });
      }
      summarize(`モルガナ Lv${lv} ${kit || '店'}`, res);
    }
  }
  // 星の番人アルゴス（第5章 Step 2。おすすめ Lv41〜42・知っている／知らない）
  for (const know of [true, false]) {
    for (const lv of [40, 41, 42]) {
      for (const kit of [null, 'rare42', 'deep']) {
        const res = [];
        for (let i = 0; i < N; i++) {
          const seed = 777 + i * 7919;
          if (!kit) { res.push(argosFight(lv, seed, know)); continue; }
          const flags = know ? { knowsArgos: true } : { argosNaive: true };
          res.push(runBattle(kitParty(lv, 42, kit), fixedOf('argos'), { seed, boss: true, ...flags }));
        }
        summarize(`アルゴス Lv${lv}${know ? '' : '（知らない）'} ${kit || '店'}`, res);
      }
    }
  }
  // 古竜オルドラ（大迷宮の 主。おすすめ Lv45・知っている）
  for (const lv of [43, 45]) {
    for (const kit of [null, 'rare42', 'deep']) {
      const res = [];
      for (let i = 0; i < N; i++) {
        const seed = 777 + i * 7919;
        if (!kit) { res.push(dragonFight(lv, seed, true)); continue; }
        res.push(runBattle(kitParty(lv, 45, kit), fixedOf('lab_dragon'), { seed, boss: true, knowsLab: true }));
      }
      summarize(`古竜オルドラ Lv${lv} ${kit || '店(★45)'}`, res);
    }
  }
}

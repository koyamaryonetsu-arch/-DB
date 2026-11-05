// 第66回 A: sim-jobs の solo（1人・60びょう・かかし 3体）で、どの 技を 何回 使ったか（強さの ちょうせい用）
// つかいかた: node tools/sim-uses-r66a.mjs [回数] [職業の id,…]
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { jobChar } from './sim-jobs.mjs';

const N = Number(process.argv[2] || 5);
const JOBS_ = (process.argv[3] || 'guard_god,kenshin,poke_master,sennen_mage').split(',');
for (const job of JOBS_) {
  const use = {}, dmgBy = {};
  for (let i = 0; i < N; i++) {
    const c = jobChar(job, 44, 6);
    const b = new Battle({ rng: makeRng(100 + i), allies: [{ char: c, auto: true, kind: 'support', tactics: 'balanced' }], enemies: ['rockman', 'rockman', 'rockman'], canFlee: false });
    for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 999999; e.resist = {}; }
    for (let t = 0; t < 60000 && !b.over; t += 50) {
      for (const e of b.tick(50)) {
        if (e.t !== 'act' || e.id !== b.allies[0].id) continue;
        const k = e.ability || e.cmd?.id || e.kind || '?';
        use[k] = (use[k] || 0) + 1;
        for (const r of e.results || []) if (r.dmg > 0 && r.dmg < 100000) dmgBy[k] = (dmgBy[k] || 0) + r.dmg;
      }
    }
  }
  const rows = Object.entries(use).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${ABILITIES[k]?.name || k}×${(v / N).toFixed(1)}(${Math.round((dmgBy[k] || 0) / N)})`);
  console.log(job, rows.join(' '));
}

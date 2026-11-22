// 第88回 G3班: まぼろしの回ろうの「ライバルの まぼろし」の 戦い（docs/plan-r88-anime-gear.md の 7-1）
// battle.js は かえない。world/rivals-r88.js が 戦いを 作った すぐ あとに setupRivalPhantom を よぶ（world/battles.js の opts.setup）。
// tools/sim-rival.mjs も おなじ ものを 使う
//
// ・まぼろし（data/rivals-r88.js の rival_phantom60・80・100）を ライバルに かえる。しくみは 職業の 試練の
//   師しょうのまぼろしと おなじ（shared/battle-trial.js の phantomStats・phantomSkills。鏡のうつし身の しくみで 職業の 技を 使う）
// ・名前・見た目は ライバル（見た目は 今 ある 職業の 絵と 色。鏡の 色）。何人かで 戦う ライバルは 1人ずつ 職業が ちがう
// ・1人め（大技を 持つ 人）は、HPが へるか 何回か 動くと、自分の 品の 大技の 前ぶれ（telegraph）→ つぎの 番に 大技（1つの 戦いで 1回）。
//   大技は 敵全体・守りを むしする 物理（身を 守ると 半分）。ai.js の decideMonster が m.decideHook を 先に 見る
import { JOBS, JOB_MAX_LEVEL } from './data/jobs.js?v=e3ea39586b77';
import { ABILITIES } from './data/abilities.js?v=e3ea39586b77';
import { strengthenEnemy } from './data/difficulty.js?v=e3ea39586b77';
import { MONSTERS } from './data/monsters.js?v=e3ea39586b77';
import { phantomStats, phantomSkills, HEAL_BELOW, HEAL_CAP } from './battle-trial.js?v=e3ea39586b77';
import { rivalMembers, sigId, sigChargeId, SIG_AT, SIG_AFTER, SAME_WORDS, doorOf } from './data/rivals-r88.js?v=e3ea39586b77';

// 何人かで 戦う ライバルの 1人ぶんの 強さ（HP・与える ダメージ）
export const GROUP_HP = { 2: 0.6, 3: 0.45 };
export const GROUP_DMG = { 2: 0.65, 3: 0.5 };
// まぼろしの 回復は 1回の 戦いで この 回数まで（長い 戦いに ならない ように）
export const RIVAL_HEAL_CAP = 4;

const HEAL_TYPES = new Set(['heal', 'regen', 'cure', 'mpHeal']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});

// 家族に その 作品の 職業の 人が いるか（ひとことが かわる）
export function sameWayIn(b, rv) {
  const jobs = new Set(doorOf(rv.work)?.jobs || []);
  return (b.allies || []).some((a) => a.kind !== 'monster' && jobs.has(a.job));
}

// 大技の 番（ai.js の decideMonster が 先に よぶ）
export function rivalDecide(b, m) {
  const R = m.rivalSig;
  if (!R) return null;
  if (m.telegraph) {
    const id = m.telegraph;
    m.telegraph = null;
    m.chant = null;
    R.used = true;
    // big … ためてから 出す 大技（battle.js の foreseeCut）
    return { type: 'ability', id, big: true };
  }
  if (!R.used && !R.charging && (m.hp <= m.maxHp * R.at || R.acts >= R.after)) {
    R.charging = true;
    return { type: 'ability', id: R.charge };
  }
  R.acts++;
  return null;
}

// 戦いの はじめ（world/rivals-r88.js・tools/sim-rival.mjs）。rv … data/rivals-r88.js の RIVALS の 1人
//   もどりち: まぼろしの 一らん（1人め が 大技を 持つ）
export function setupRivalPhantom(b, rv) {
  const ms = b.enemies.filter((e) => /^rival_phantom/.test(e.species || ''));
  const mem = rivalMembers(rv);
  if (!ms.length || !rv) return [];
  const k = mem.length;
  const tune = rv.tune || {};
  const rate = b.enemyRate > 1 ? b.enemyRate : 1;
  const out = [];
  ms.forEach((m, i) => {
    const who = mem[i] || mem[0];
    const job = JOBS[who.job] ? who.job : 'hero';
    // 敵の 強さ（ハード など）は もとの 数に もう かかって いるので、まず もどす
    const base = rate > 1 ? { maxHp: m.maxHp / rate, atk: m.atk / rate, dfn: m.dfn / rate, agi: m.agi / rate, mag: m.mag / rate } : m;
    const st = phantomStats(base, job);
    const hpK = (tune.hp ?? 1) * (GROUP_HP[k] ?? 1);
    st.maxHp = st.hp = Math.max(1, Math.round(st.maxHp * hpK));
    Object.assign(m, st);
    if (rate > 1) strengthenEnemy(m, rate);
    const weapons = JOBS[job].weapons || [];
    Object.assign(m, {
      name: who.name, baseName: who.name, letter: '', lv: rv.lv,
      // 鏡のうつし身の しくみ（battle-temple.js の templeAction が mirrorDecide で 技を えらぶ・がめんは 鏡の 色の 人の 絵）
      mirrorOf: 'rival', rivalId: rv.id,
      dmgRate: (MONSTERS[m.species]?.dmgRate || 1) * (tune.dmg ?? 1) * (GROUP_DMG[k] ?? 1),
      abilities: phantomSkills(job),
      tactics: 'aggressive', autoOff: [],
      penChar: { job, jobs: { [job]: { lv: JOB_MAX_LEVEL, b: 0 } } },
      weaponCat: weapons.find((w) => w !== 'none') || 'none', onHit: null,
      look: { ...(who.look || {}) }, job, eq: '',
    });
    // 回復の 技は HPが へった ときだけ・RIVAL_HEAL_CAP 回まで（職業の 試練と おなじ）
    const all = m.abilities;
    const noHeal = all.filter((id) => !HEAL_TYPES.has(prim(ABILITIES[id]).type));
    const healMax = Math.min(HEAL_CAP[job] ?? Infinity, RIVAL_HEAL_CAP);
    let lastHp = m.hp;
    let heals = 0;
    Object.defineProperty(m, 'abilities', {
      get() {
        if (this.hp > lastHp + 1) heals++;
        lastHp = this.hp;
        return this.hp < this.maxHp * HEAL_BELOW && heals < healMax ? all : noHeal;
      },
      set() {}, enumerable: true, configurable: true,
    });
    // 大技（1人めだけ）
    if (i === 0 && rv.sig && ABILITIES[sigId(rv.id)]) {
      m.rivalSig = { charge: sigChargeId(rv.id), at: rv.sig.at ?? SIG_AT, after: rv.sig.after ?? SIG_AFTER, acts: 0, used: false, charging: false };
      m.decideHook = rivalDecide;
    }
    out.push(m);
  });
  const names = mem.map((x) => x.name).join('と');
  const words = sameWayIn(b, rv) ? rv.same || SAME_WORDS : rv.words;
  b.emit({ t: 'msg', lines: [`${k > 1 ? names : rv.name}のまぼろしが、すがたを現した！`, `「${words}」`], dur: 2200 });
  return out;
}

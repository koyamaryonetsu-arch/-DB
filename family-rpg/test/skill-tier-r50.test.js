// 第50回 D4: 上の 職業の 技ほど 補助・回復が 強い（shared/skill-tier.js）
//   基本職 そのまま / 上級職 MP−10%・4回行動・回復×1.05 / 超級職 MP−20%・2段階・4回行動・回復×1.1 / 伝説 MP−30%・2段階・5回行動・回復×1.2
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, BUFF_STACK } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { newCharacter, gainExp, expForLevel, fullHeal, mpCost, penaltyFor } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import { skillTier, tierMods, skillMods, isSupportSkill, TIER_MODS, DUAL_TIER } from '../public/js/shared/skill-tier.js';
import { battleSkillText } from '../public/js/client/ui/skillinfo.js';

// 職業の ある 人（job … 今の 職業。上級の 職業でも そのまま つける）
function hero(id, job) {
  const c = newCharacter({ id, name: id, job: 'warrior' });
  gainExp(c, expForLevel(40));
  c.job = job;
  c.jobs = { ...c.jobs, [job]: { lv: 10, b: 0 } };
  fullHeal(c);
  return c;
}

function setup(jobs, { enemies = ['rockman'] } = {}) {
  const chars = jobs.map((j, i) => hero('p' + i, j));
  const rng = makeRng(7);
  rng.chance = () => true;
  const b = new Battle({ rng, allies: chars.map((c, i) => ({ char: c, controller: 's' + i })), enemies, canFlee: true });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 99999;
  }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return b;
}
function act(b, u, cmd) {
  b.queue = [];
  if (cmd.type === 'ability' && !u.abilities.includes(cmd.id)) u.abilities.push(cmd.id);
  b.enqueue(u, cmd);
  b.executeNext();
  b.lock = 0;
  return b.flush().filter((e) => e.t === 'act').pop();
}

test('技の ランク: 技の 職業の tier（ひらめき技は その 職業・掛け合わせ技は 上級職・魔物の 技は 0）', () => {
  assert.equal(skillTier('baikiruto'), 0);
  assert.equal(skillTier('sukuruto'), 0);
  assert.equal(skillTier('pl_aegis'), 1);
  assert.equal(skillTier('dk_aura'), 2);
  assert.equal(skillTier('hp_behomazun'), 2);
  assert.equal(skillTier('hk_ikari'), 3);
  assert.equal(skillTier('lt_inori'), 3);
  // ひらめき技（job つき）
  assert.equal(ABILITIES.hk_iyashi_kaze.hirameki, true);
  assert.equal(skillTier('hk_iyashi_kaze'), JOBS.priest.tier);
  // 掛け合わせ技（job なし）は 上級職から
  assert.equal(skillTier('iyashi_mai'), 1);
  // job の ある 技は みんな その 職業の tier
  for (const [id, a] of Object.entries(ABILITIES)) {
    if (a.job && JOBS[a.job]) assert.equal(skillTier(id), JOBS[a.job].tier || 0, id);
    if (a.kind === 'monster') assert.equal(skillTier(id), 0, id);
  }
  assert.equal(skillTier('no_such_skill'), 0);
});

test('ランクの こうかの 表', () => {
  assert.deepEqual(tierMods(0), { mpMul: 1, acts: 3, stages: 1, healMul: 1 });
  assert.deepEqual(tierMods(1), { mpMul: 0.9, acts: 4, stages: 1, healMul: 1.05 });
  assert.deepEqual(tierMods(2), { mpMul: 0.8, acts: 4, stages: 2, healMul: 1.1 });
  assert.deepEqual(tierMods(3), { mpMul: 0.7, acts: 5, stages: 2, healMul: 1.2 });
  assert.equal(DUAL_TIER, 2);
  // 魔物の 仲間・職業の ない 人は いつも ランク0
  assert.equal(skillMods({ species: 'slime', job: 'priest' }, 'hk_ikari'), TIER_MODS[0]);
  assert.equal(skillMods({ job: undefined }, 'hk_ikari'), TIER_MODS[0]);
  assert.equal(skillMods(null, 'hk_ikari'), TIER_MODS[0]);
});

test('消費MP: ランクの ぶん へる（四捨五入・1より 下に しない・転職の ペナルティは その あと）', () => {
  const hk = hero('a', 'hakaishin');
  assert.equal(ABILITIES.hk_ikari.mp, 12);
  assert.equal(mpCost(hk, 'hk_ikari'), 8, '12×0.7=8.4 → 8');
  const hp = hero('b', 'high_priest');
  assert.equal(mpCost(hp, 'hp_behomazun'), 24, '30×0.8');
  assert.equal(mpCost(hp, 'hp_zaoriku'), 16, '20×0.8');
  const pl = hero('c', 'paladin');
  assert.equal(mpCost(pl, 'pl_aegis'), 7, '8×0.9=7.2 → 7');
  // 基本職の 技は そのまま
  const pr = hero('d', 'priest');
  assert.equal(mpCost(pr, 'sukuruto'), ABILITIES.sukuruto.mp);
  assert.equal(mpCost(pr, 'hoimi'), ABILITIES.hoimi.mp);
  // 1 より 下に しない・0 は 0
  for (const [id, a] of Object.entries(ABILITIES)) {
    if (a.kind === 'monster' || !a.job) continue;
    const c = { job: a.job, jobs: { [a.job]: { lv: 10 } } };
    if ((a.mp || 0) >= 1) assert.ok(mpCost(c, id) >= 1, id);
    else assert.equal(mpCost(c, id), 0, id);
    assert.ok(mpCost(c, id) <= (a.mp || 0), id);
  }
  // 転職の ペナルティは ランクで へった MP に かかる（僧侶が 天使の…ではなく ベホマズンを 使う: 呪文 1.5倍）
  const off = { job: 'warrior', jobs: { warrior: { lv: 10 }, high_priest: { lv: 1 } } };
  assert.equal(mpCost(off, 'hp_behomazun'), Math.ceil(24 * 1.5));
  // 魔物の 仲間は そのまま
  assert.equal(mpCost({ species: 'slime' }, 'hk_ikari'), 12);
  // ダメージの 技は ランクが 上でも そのまま（補助・回復の 技だけ）
  const dmg = Object.keys(ABILITIES).find((x) => skillTier(x) === 3 && ABILITIES[x].effect?.type === 'phys' && ABILITIES[x].mp >= 5);
  const dj = ABILITIES[dmg].job;
  assert.equal(isSupportSkill(dmg), false);
  assert.equal(mpCost({ job: dj, jobs: { [dj]: { lv: 10 } } }, dmg), ABILITIES[dmg].mp, dmg);
  assert.equal(isSupportSkill('hk_ikari'), true);
  assert.equal(isSupportSkill('hp_behomazun'), true);
});

test('バフ: 上級職は 4回行動・超級職は 1回で 2段階・伝説は 2段階で 5回行動', () => {
  const b = setup(['priest', 'paladin', 'dragon_knight', 'hakaishin']);
  const [pr, pl, dk, hk] = b.allies;
  // 基本職: 1段階・3回
  act(b, pr, { type: 'ability', id: 'sukuruto' });
  assert.equal(pr.buffs.def.lv, 1);
  assert.equal(pr.buffs.def.left, 3);
  for (const x of b.allies) x.buffs = {};
  // 上級職: 1段階・4回
  act(b, pl, { type: 'ability', id: 'pl_aegis' });
  assert.equal(pr.buffs.def.lv, 1);
  assert.equal(pr.buffs.def.left, 4);
  assert.equal(pr.buffs.def.mult, 1.25);
  // 超級職: 1回で 2段階・4回
  const ev = act(b, dk, { type: 'ability', id: 'dk_aura' });
  assert.equal(dk.buffs.atk.lv, 2);
  assert.equal(dk.buffs.atk.left, 4);
  assert.ok(Math.abs(dk.buffs.atk.mult - 1.8) < 1e-9, '1.4 の 2段階（+0.4×2）');
  assert.ok(ev.lines.some((l) => /ぐーんと上がった/.test(l)), ev.lines.join('/'));
  // もう一度 かけても 2段階より 上には ならない
  const ev2 = act(b, dk, { type: 'ability', id: 'dk_aura' });
  assert.equal(dk.buffs.atk.lv, BUFF_STACK);
  assert.ok(ev2.lines.some((l) => /もうこれ以上/.test(l)));
  // 伝説: 2段階・5回（上限 +0.5）
  act(b, hk, { type: 'ability', id: 'hk_ikari' });
  assert.equal(hk.buffs.atk.lv, 2);
  assert.equal(hk.buffs.atk.left, 5);
  assert.ok(Math.abs(hk.buffs.atk.mult - 2.0) < 1e-9, '1.5 の 2段階は 上限 +0.5 で 2.0');
  // 5回 行動の あいだ つづく（かけた 行動は かぞえない）
  for (let i = 0; i < 4; i++) act(b, hk, { type: 'defend' });
  assert.ok(hk.buffs.atk, '4回 行動しても のこる');
  act(b, hk, { type: 'defend' });
  assert.ok(!hk.buffs.atk, '5回めで 切れる');
});

test('かけ直し: 長い ほうの のこりを のこす（伝説の 5回の あと 基本職の 技を かけても へらない）', () => {
  const b = setup(['hakaishin', 'performer']);
  const [hk, pf] = b.allies;
  act(b, hk, { type: 'ability', id: 'hk_ikari' });
  assert.equal(hk.buffs.atk.left, 5);
  act(b, pf, { type: 'ability', id: 'baikiruto', target: hk.id });
  assert.equal(hk.buffs.atk.left, 5);
  assert.ok(Math.abs(hk.buffs.atk.mult - 2.0) < 1e-9, '強い ほうを のこす');
});

test('デバフ: 超級職以上は 2段階・回数も のびる（かかる 見こみは かわらない）', () => {
  const b = setup(['mage', 'magic_knight', 'hakaishin']);
  const [mg, mk] = b.allies;
  const e = b.enemies[0];
  act(b, mg, { type: 'ability', id: 'rukani', target: e.id });
  assert.equal(e.debuffs.def.lv, 1);
  assert.equal(e.debuffs.def.left, 3);
  e.debuffs = {};
  act(b, mk, { type: 'ability', id: 'mk_forcebreak', target: e.id });
  assert.equal(e.debuffs.def.lv, 1);
  assert.equal(e.debuffs.def.left, 4);
  // 2段階の デバフ（超級職の 技を ためす）
  const id = Object.keys(ABILITIES).find((x) => skillTier(x) === 2 && ABILITIES[x].effect?.type === 'debuff' && ABILITIES[x].target === 'enemy' && !ABILITIES[x].weapon);
  assert.ok(id, '超級職の デバフ技');
  e.debuffs = {};
  b.allies[2].penChar = { job: ABILITIES[id].job, jobs: { [ABILITIES[id].job]: { lv: 10 } } };
  b.allies[2].job = ABILITIES[id].job;
  act(b, b.allies[2], { type: 'ability', id, target: e.id });
  const st = ABILITIES[id].effect.stat;
  assert.equal(e.debuffs[st].lv, 2, id);
  assert.equal(e.debuffs[st].left, 4);
});

test('回復: ランクで 回復の 量が ふえる（回復の 技・生き返り）', () => {
  // 1回ぶんの 平均 ÷ 職業レベルの 威力（penaltyFor の powMult）
  const avg = (job, id, n = 40) => {
    let sum = 0, pm = 1;
    for (let i = 0; i < n; i++) {
      const b = setup([job, 'warrior']);
      const [c, w] = b.allies;
      w.maxHp = 9999;
      w.hp = 1;
      c.healPow = 0; // 回復魔力の ぶんを そろえる
      pm = penaltyFor(c.penChar, id).powMult;
      act(b, c, { type: 'ability', id, target: w.id });
      sum += w.hp - 1;
    }
    return sum / n / pm;
  };
  // ロトのいのり（伝説・175〜215）は ×1.2
  const legend = avg('loto_hero', 'lt_inori');
  assert.ok(legend > 175 * 1.2 - 1 && legend < 215 * 1.2 + 1, `伝説 ${legend}`);
  // ベホマズン（超級職・220〜260）は ×1.1
  const hp = avg('high_priest', 'hp_behomazun');
  assert.ok(hp > 220 * 1.1 - 1 && hp < 260 * 1.1 + 1, `超級職 ${hp}`);
  // ホイミ（基本職）は そのまま
  const [mn, mx] = ABILITIES.hoimi.effect.base;
  const ho = avg('priest', 'hoimi');
  assert.ok(ho >= mn && ho <= mx, `基本職 ${ho}`);
  // 生き返り（ザオ・基本職 hpRatio）: 上の 職業の 技ほど HPが 多い。さいだいHPを こえない
  const b = setup(['high_priest', 'warrior']);
  const [c, w] = b.allies;
  w.alive = false;
  w.hp = 0;
  act(b, c, { type: 'ability', id: 'hp_zaoriku', target: w.id });
  assert.equal(w.hp, w.maxHp, 'ザオリク（全回復）は さいだいHPまで');
});

test('じわじわ回復も ランクで ふえる', () => {
  const id = Object.keys(ABILITIES).find((x) => skillTier(x) >= 2 && ABILITIES[x].effect?.type === 'regen' && ['allies', 'self'].includes(ABILITIES[x].target));
  assert.ok(id, '超級職いじょうの じわじわ回復');
  const job = ABILITIES[id].job;
  const eff = ABILITIES[id].effect;
  const b = setup([job]);
  const [c] = b.allies;
  c.healPow = 0;
  act(b, c, { type: 'ability', id });
  const k = tierMods(skillTier(id)).healMul;
  const lo = Math.round(eff.base[0] * k * (eff.fixed ? 1 : 1));
  assert.ok(c.regen.amt >= Math.floor(eff.base[0] * k) - 1, `${id} ${c.regen.amt} >= ${lo}`);
});

test('敵・魔物の 仲間は かわらない', () => {
  // 敵が 上の 職業の 技（竜闘気）を 使っても 1段階・3回
  const b = setup(['warrior']);
  const e = b.enemies[0];
  const ev = { t: 'act', lines: [], upd: [] };
  b.applyAbility(e, ABILITIES.dk_aura, {}, ev, 1, [e]);
  assert.equal(e.buffs.atk.lv, 1);
  assert.equal(e.buffs.atk.left, 3);
  // 敵の 回復は そのまま
  e.hp = 1;
  e.healPow = 0;
  b.applyAbility(e, ABILITIES.lt_inori, {}, ev, 1, [e]);
  assert.ok(e.hp - 1 <= 215, `敵の 回復 ${e.hp - 1}`);
  // 魔物の 仲間（species）: MPも こうかも ランク0
  const mon = { species: 'slime', job: undefined, jobs: {} };
  assert.equal(mpCost(mon, 'dk_aura'), ABILITIES.dk_aura.mp);
  const b2 = setup(['warrior']);
  const ally = b2.allies[0];
  ally.mon = 'slime';
  ally.penChar = { job: undefined, jobs: undefined };
  act(b2, ally, { type: 'ability', id: 'dk_aura' });
  assert.equal(ally.buffs.atk.lv, 1);
  assert.equal(ally.buffs.atk.left, 3);
  // 反撃など ほかの 人の 行動には のらない（ev.tier は 使った 人 だけ）
  const b3 = setup(['hakaishin']);
  const ev3 = { t: 'act', lines: [], upd: [], tier: { by: b3.allies[0].id, ...tierMods(3) } };
  const en = b3.enemies[0];
  b3.applyAbility(en, ABILITIES.dk_aura, {}, ev3, 1, [en]);
  assert.equal(en.buffs.atk.lv, 1);
});

test('せつめいの 文: 本当の MP・2段階・回数・回復の 量', () => {
  const hk = { job: 'hakaishin', jobs: { hakaishin: { lv: 10 } } };
  const t = battleSkillText('hk_ikari', hk);
  assert.match(t, /MP8・/);
  assert.match(t, /攻撃力・魔力2倍（2段階）・5回行動のあいだ/);
  const pl = { job: 'paladin', jobs: { paladin: { lv: 10 } } };
  assert.match(battleSkillText('pl_aegis', pl), /MP7・.*守備力1\.3倍・4回行動のあいだ|MP7・.*守備力1\.25倍・4回行動のあいだ/s);
  const lt = { job: 'loto_hero', jobs: { loto_hero: { lv: 10 } } };
  const pm = penaltyFor(lt, 'lt_inori').powMult;
  assert.ok(battleSkillText('lt_inori', lt).includes(`HPを約${Math.round(175 * (pm * 1.2))}〜${Math.round(215 * (pm * 1.2))}回復`));
  // 基本職は 前の まま
  const pr = { job: 'performer', jobs: { performer: { lv: 10 } } };
  assert.match(battleSkillText('baikiruto', pr), /効果：攻撃力1\.3倍・3回行動のあいだ/);
});

test('オートの 仲間: 上の 職業の 回復・補助を ふつうに 使える', () => {
  const b = setup(['high_priest', 'warrior', 'dragon_knight']);
  const [hp, w, dk] = b.allies;
  hp.auto = true;
  w.hp = Math.round(w.maxHp * 0.2);
  dk.hp = Math.round(dk.maxHp * 0.25);
  const cmd = decideAlly(b, hp);
  assert.ok(cmd && cmd.type, 'なにか えらぶ');
  // 何回か オートで うごかしても こわれない
  for (let i = 0; i < 6; i++) {
    for (const x of b.allies) {
      if (!x.alive) continue;
      const ev = act(b, x, { type: 'ai' });
      assert.ok(ev, 'できごとが ある');
      assert.ok(!('tier' in ev), 'ev.tier は 送らない');
    }
  }
});

// 第33回（家族が きめた こと）: 男の子の 美少女戦士・セーラームーンは タキシード仮面ふうの 技
//   男の子（look.body が 1 で ない）は 見た目が タキシード仮面ふう（client/render/hero-r33.js の R33_MASC）なので、
//   技も 名前・セリフ・説明・えんしゅつ だけ 男の子 むけ（shared/ability-label.js）。強さ（効果・MP・ねらい）は おなじ。女の子は 今の まま
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { JOB9_ABILITIES } from '../public/js/shared/data/abilities-jobs9.js';
import { HIRA_R33_ABILITIES } from '../public/js/shared/data/hirameki-r33.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { isMasc, abilityFor, abilityLabel, dualFor, dualLabel, dualForView } from '../public/js/shared/ability-label.js';
import { newCharacter, gainExp, expForLevel, fullHeal, sanitizeLook } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { growthSummary } from '../public/js/shared/world/growth.js';
import { battleSkillText } from '../public/js/client/ui/skillinfo.js';
import { abilityDetail } from '../public/js/client/ui/info.js';
import { R33_ANIMS, PARTY_ANIMS7 } from '../public/js/client/render/battlefx-jobs7.js';
import { checkText } from '../tools/kanji-check.mjs';

const BOY = { body: 0 };
const GIRL = { body: 1 };
const boy = { job: 'sailor_moon', look: BOY };
const girl = { job: 'sailor_moon', look: GIRL };
const SAILOR_IDS = Object.keys(JOB9_ABILITIES).filter((id) => ['sailor_soldier', 'sailor_moon'].includes(JOB9_ABILITIES[id].job));
const MASC_IDS = Object.keys(ABILITIES).filter((id) => ABILITIES[id].masc);
// 家族と きめた 男の子 むけの 名前
const NAMES = {
  bs_heel: 'タキシードキック', bs_henshin: '仮面のしんし', bs_oshioki: '月の光が見ているぞ！', sailor_soldier_sig: 'ローズ・ブーメラン',
  mn_stick: 'ステッキさばき', mn_bara: '赤いバラの一撃', mn_heal: 'いやしのバラ', sailor_moon_sig: 'タキシード・ラ・スマッシャー',
  hi_aqua: '氷のバラふぶき', hi_spiral: 'ローズ・スパイラル・アタック',
};

test('男の子の 美少女戦士・セーラームーン: 技の 名前が タキシード仮面ふうに なる（女の子は 今の まま）', () => {
  assert.deepEqual(MASC_IDS.sort(), Object.keys(NAMES).sort(), 'masc の ある 技');
  for (const [id, name] of Object.entries(NAMES)) {
    assert.equal(abilityLabel(id, boy), name, `${id} 男の子`);
    assert.equal(abilityLabel(ABILITIES[id], boy), name, `${id} 技の データでも`);
    assert.equal(abilityLabel(id, girl), ABILITIES[id].name, `${id} 女の子`);
    assert.notEqual(name, ABILITIES[id].name);
    assert.ok(abilityFor(id, boy).cast.includes('{a}'), `${id} の セリフ`);
    assert.notEqual(abilityFor(id, boy).desc, ABILITIES[id].desc, `${id} の 説明`);
  }
  // 看板の 技・ひらめき技は かならず かわる。masc の ない 技（友情のきずな など）は おなじ
  for (const id of ['sailor_soldier_sig', 'sailor_moon_sig', ...Object.keys(HIRA_R33_ABILITIES).filter((x) => ['sailor_soldier', 'sailor_moon'].includes(HIRA_R33_ABILITIES[x].job))]) assert.ok(ABILITIES[id].masc, id);
  for (const id of SAILOR_IDS.filter((x) => !NAMES[x])) assert.equal(abilityFor(id, boy), ABILITIES[id], id);
  // ほかの 職業の 技は 男の子でも かわらない（おなじ 物）
  for (const id of ['daichi', 'mera', 'hoimi', 'kt_card']) if (ABILITIES[id]) assert.equal(abilityFor(id, boy), ABILITIES[id], id);
  // おなじ 物を かえす（なんども 作らない）
  assert.equal(abilityFor('mn_bara', boy), abilityFor('mn_bara', { look: { body: 0 }, job: 'warrior' }));
});

test('男の子 むけの 技は 強さが おなじ（効果・MP・ねらい・種類・職業・ひらめき）・文字・えんしゅつ', () => {
  for (const id of MASC_IDS) {
    const a = ABILITIES[id], m = abilityFor(id, boy);
    for (const k of Object.keys(a)) {
      if (['name', 'kana', 'cast', 'desc', 'anim', 'masc'].includes(k)) continue;
      assert.deepEqual(m[k], a[k], `${id}.${k} は おなじ`);
    }
    assert.equal(m.masc, undefined, `${id} の masc は のこさない`);
    assert.deepEqual(Object.keys(a.masc).filter((k) => !['name', 'kana', 'cast', 'desc', 'anim'].includes(k)), [], `${id}: かえて よいのは 名前・セリフ・説明・えんしゅつ だけ`);
    for (const s of [m.name, m.cast, m.desc]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    assert.match(m.kana, /^[ぁ-んー]+$/, `${id} の かな`);
    // えんしゅつは ある 型（第33回の えんしゅつ か もとの まま）。みかたに かける 技は がめんの 下に 出る 型
    if (a.masc.anim) assert.ok(R33_ANIMS.has(m.anim), `${id} の ${m.anim}`);
    if (/^(ally|allies|self)$/.test(a.target) && R33_ANIMS.has(m.anim)) assert.ok(PARTY_ANIMS7.has(m.anim), `${id} ${m.anim}`);
  }
  // 新しい バラの えんしゅつは どれかの 技で 使う
  const used = new Set(MASC_IDS.map((id) => abilityFor(id, boy).anim));
  for (const anim of ['r33_bara', 'r33_bara_ring', 'r33_cane', 'r33_tux_smash']) assert.ok(used.has(anim), anim);
});

test('男の子か: look.body が 1 で ない 人。look の ない データ・モンスターは もとの 技（古い セーブでも おちない）', () => {
  assert.equal(isMasc({ look: { body: 0 } }), true);
  assert.equal(isMasc({ look: {} }), true, 'body の ない look は 男の子（絵と おなじ）');
  assert.equal(isMasc({ look: { body: 1 } }), false);
  for (const x of [null, undefined, 0, 'p1', {}, { job: 'sailor_moon', jobs: {} }, { species: 'slime' }, { mon: 'slime', look: BOY }, { side: 'enemy', name: 'スライム' }]) {
    assert.equal(isMasc(x), false, JSON.stringify(x));
    assert.equal(abilityLabel('mn_bara', x), 'タキシード仮面のバラ');
  }
  assert.equal(abilityLabel('no_such_ability', boy), '');
  assert.equal(abilityFor('no_such_ability', boy), undefined);
  // 古い セーブ（look が ない）→ ととのえると 男の子
  assert.equal(abilityLabel('mn_bara', { look: sanitizeLook(undefined) }), '赤いバラの一撃');
});

// ───────────── 戦い ─────────────
function sailorBattle(job, look, mates = []) {
  const mk = (id, name, j, lk) => {
    const c = newCharacter({ id, name, job: 'warrior', look: lk });
    gainExp(c, expForLevel(45));
    for (const x of Object.keys(JOBS)) c.jobs[x] = { lv: JOB_MAX_LEVEL, b: 999 };
    c.job = j;
    c.equip.weapon = null;
    fullHeal(c);
    return c;
  };
  const me = mk('p1', 'ユウ', job, look);
  const others = mates.map(([j, lk], i) => ({ char: mk(`m${i}`, `ミナ${i}`, j, lk), kind: 'support', auto: true }));
  const b = new Battle({ rng: makeRng(5), allies: [{ char: me, controller: 's1' }, ...others], enemies: ['rockman', 'skeleton'], canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return b;
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntil = (b, pred) => {
  const evs = [];
  for (let i = 0; i < 1200 && !evs.some(pred); i++) evs.push(...b.tick(50));
  return evs.find(pred);
};
function useSkill(job, look, id) {
  const b = sailorBattle(job, look);
  const me = b.allies[0];
  me.use = null; // ひらめかない ように
  assert.ok(readyUp(b, me));
  const a = ABILITIES[id];
  const target = a.target === 'enemy' ? b.enemies[0].id : a.target === 'ally' ? me.id : undefined;
  const r = b.command(me.id, { type: 'ability', id, target }, 's1');
  assert.equal(r.ok, true, `${id}: ${r.reason || ''}`);
  return runUntil(b, (e) => e.t === 'act' && e.id === me.id);
}

test('戦い: 男の子が 使うと 名前の 札・セリフ・えんしゅつが タキシード仮面ふう、女の子は 今の まま（ダメージの しくみは おなじ）', () => {
  for (const [id, job] of [['mn_bara', 'sailor_moon'], ['sailor_moon_sig', 'sailor_moon'], ['bs_heel', 'sailor_soldier'], ['sailor_soldier_sig', 'sailor_soldier'], ['bs_oshioki', 'sailor_soldier'], ['mn_heal', 'sailor_moon']]) {
    const m = useSkill(job, BOY, id), f = useSkill(job, GIRL, id);
    const am = abilityFor(id, boy), a = ABILITIES[id];
    assert.equal(m.name, am.name, `${id} 男の子の 札`);
    assert.equal(f.name, a.name, `${id} 女の子の 札`);
    assert.equal(m.lines[0], am.cast.replaceAll('{a}', 'ユウ'), `${id} 男の子の セリフ`);
    assert.equal(f.lines[0], a.cast.replaceAll('{a}', 'ユウ'), `${id} 女の子の セリフ`);
    assert.equal(m.ability, id, 'id は おなじ（ひらめき・お気に入り・オートは id で 見る）');
    assert.equal(m.fx?.anim, am.anim, `${id} 男の子の えんしゅつ`);
    assert.equal(f.fx?.anim, a.anim, `${id} 女の子の えんしゅつ`);
    for (const l of m.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
    // おなじ たね（rng）なら おなじ ダメージ・回復
    assert.deepEqual((m.results || []).map((x) => [x.id, x.dmg, x.heal]), (f.results || []).map((x) => [x.id, x.dmg, x.heal]), `${id} の 強さ`);
  }
});

test('戦い: ひらめいた 技の 知らせも 男の子 むけ（戦いの 札・けっかの ★）', () => {
  for (const [look, name] of [[BOY, 'ローズ・スパイラル・アタック'], [GIRL, 'ムーン・スパイラル・ハート・アタック']]) {
    const b = sailorBattle('sailor_moon', look);
    const me = b.allies[0];
    const ev = { t: 'act', id: me.id, lines: [], upd: [], fx: null };
    b.doHirameki(me, 'hi_spiral', { type: 'ability', id: 'mn_stick', target: b.enemies[0].id }, ev);
    assert.equal(ev.hirameki.name, name);
    assert.equal(ev.name, name);
    assert.ok(ev.lines.some((l) => l.includes(name)), ev.lines.join('/'));
    assert.equal(ev.fx?.anim, look === BOY ? 'r33_bara_ring' : 'hearts');
  }
  const src = readFileSync(new URL('../public/js/shared/world/battles.js', import.meta.url), 'utf8');
  assert.match(src, /「\$\{abilityLabel\(id, ch\)\}」をひらめいた！/, 'たたかいの あとの ★ ひらめいた！');
});

test('合体技 ムーンライト・ステージ: 美少女戦士の 組が 男の子なら「月夜のダンスパーティー」（強さは おなじ）', () => {
  const t = DUAL_TECHS.dt_moonlight;
  const idolGirl = { job: 'idol', look: GIRL }, idolBoy = { job: 'idol', look: BOY };
  assert.equal(dualLabel('dt_moonlight', [{ job: 'sailor_soldier', look: BOY }, idolGirl]), '月夜のダンスパーティー');
  assert.equal(dualLabel('dt_moonlight', [idolGirl, { job: 'sailor_moon', look: BOY }]), '月夜のダンスパーティー');
  assert.equal(dualLabel('dt_moonlight', [{ job: 'sailor_soldier', look: GIRL }, idolBoy]), 'ムーンライト・ステージ', 'アイドルが 男の子でも 美少女戦士が 女の子なら 今の まま');
  assert.equal(dualLabel('dt_moonlight', []), 'ムーンライト・ステージ');
  const m = dualFor(t, [boy, idolGirl]);
  for (const k of ['need', 'mp', 'target', 'element', 'anim']) assert.deepEqual(m[k], t[k], k);
  assert.deepEqual(m.parts.map(({ say, ...p }) => p), t.parts.map(({ say, ...p }) => p), 'parts の 強さ');
  assert.notEqual(m.parts[0].say, t.parts[0].say);
  for (const s of [m.name, m.desc, m.parts[0].say]) assert.deepEqual(checkText(s), [], s);
  // ほかの 合体技は かわらない
  assert.equal(dualFor('dt_tsukiyo', [boy]), DUAL_TECHS.dt_tsukiyo);
  // メニュー: 見ている キャラが 美少女戦士なら その キャラで、ちがう ときは パーティーで
  assert.equal(dualForView('dt_moonlight', girl, [{ job: 'sailor_soldier', look: BOY }]).name, 'ムーンライト・ステージ');
  assert.equal(dualForView('dt_moonlight', idolGirl, [{ job: 'sailor_soldier', look: BOY }]).name, '月夜のダンスパーティー');
});

test('合体技（戦い）: 男の子の 美少女戦士と アイドルで 出すと 名前・セリフが かわる', () => {
  for (const [look, name] of [[BOY, '月夜のダンスパーティー'], [GIRL, 'ムーンライト・ステージ']]) {
    const b = sailorBattle('sailor_soldier', look, [['idol', GIRL]]);
    const [me, idol] = b.allies;
    assert.ok(readyUp(b, me));
    idol.atb = 100;
    const o = b.dualOptionsFor(me).find((x) => x.id === 'dt_moonlight');
    assert.ok(o, '出せる');
    const r = b.command(me.id, { type: 'dual', id: 'dt_moonlight', partner: o.partner, partners: o.partners }, 's1');
    assert.equal(r.ok, true, r.reason);
    const act = runUntil(b, (e) => e.t === 'act' && e.dual);
    assert.equal(act.name, name);
    assert.equal(act.dual.name, name);
    assert.ok(act.lines.includes(`${name}！`), act.lines.join('/'));
    assert.ok(act.lines.includes(dualFor('dt_moonlight', [{ job: 'sailor_soldier', look }]).parts[0].say));
  }
});

// ───────────── メニュー・説明・知らせ ─────────────
test('メニュー・技の 説明・レベルアップ・転職の ひとことも 男の子 むけ', () => {
  const pcBoy = { job: 'sailor_moon', jobs: {}, look: BOY }, pcGirl = { job: 'sailor_moon', jobs: {}, look: GIRL };
  assert.ok(battleSkillText('sailor_moon_sig', pcBoy).includes(abilityFor('sailor_moon_sig', boy).desc));
  assert.ok(battleSkillText('sailor_moon_sig', pcGirl).includes(ABILITIES.sailor_moon_sig.desc));
  assert.ok(battleSkillText('sailor_moon_sig', { job: 'sailor_moon', jobs: {} }).includes(ABILITIES.sailor_moon_sig.desc), 'look の ない pc は もとの まま');
  assert.ok(abilityDetail('mn_heal', { ...pcBoy, level: 30 }).includes(abilityFor('mn_heal', boy).desc));
  assert.ok(abilityDetail('mn_heal', { ...pcGirl, level: 30 }).includes(ABILITIES.mn_heal.desc));
  // レベルアップで 覚えた 技
  const ups = [{ level: 2, gains: {}, learned: ['bs_heel'] }];
  assert.ok(growthSummary('ユウ', ups, [], { look: BOY }).lines.some((l) => l.includes('覚えた：タキシードキック')));
  assert.ok(growthSummary('ヒナ', ups, [], { look: GIRL }).lines.some((l) => l.includes('覚えた：ハイヒールキック')));
  assert.ok(growthSummary('ヒナ', ups, []).lines.some((l) => l.includes('覚えた：ハイヒールキック')), 'だれか わからない ときは もとの まま');
  // 転職の ひとこと
  assert.deepEqual(Object.keys(JOB_SAY_MASC).sort(), ['sailor_moon', 'sailor_soldier']);
  for (const s of Object.values(JOB_SAY_MASC)) assert.deepEqual(checkText(s), [], s);
  assert.ok(jobDoneText('ユウ', '美少女戦士', [], 'sailor_soldier', true).endsWith(JOB_SAY_MASC.sailor_soldier));
  assert.ok(jobDoneText('ヒナ', '美少女戦士', [], 'sailor_soldier', false).endsWith(JOB_SAY.sailor_soldier));
  assert.ok(jobDoneText('ユウ', '手品師', [], 'magician', true).endsWith(JOB_SAY.magician));
});

test('技の 名前を 出す 所は 使う 人（見ている 人）むけの 関数を 使う', () => {
  const src = (p) => readFileSync(new URL(`../public/js/${p}`, import.meta.url), 'utf8');
  // 戦い（サーバー）: 行動した 人の look で きめる
  assert.match(src('shared/battle.js'), /const a = abilityFor\(cmd\.id, c\);/);
  assert.match(src('shared/battle.js'), /doHirameki\(c, id, cmd, ev\) \{\n {4}const a = abilityFor\(id, c\);/);
  assert.match(src('shared/battle-ch5.js'), /abilityFor\(cmd\.id, c\)/);
  assert.match(src('shared/battle-dual.js'), /const t = dualFor\(cmd\.id, \[c, \.\.\.ps\]\);/);
  // 戦いの コマンド（技の 一覧・お気に入りの まど）・メニュー（覚えた技・今使える・お気に入り・ひらめき・作戦）・合体技
  assert.match(src('client/battle.js'), /const ab = abilityFor\(id, a\);/);
  assert.match(src('client/battle.js'), /abilityLabel\(id, a\)/);
  assert.match(src('client/battle.js'), /look: a\.look/);
  const menu = src('client/ui/menu.js');
  const sk = menu.slice(menu.indexOf('  skillsView('), menu.indexOf('  sendFav('));
  assert.ok(!/ABILITIES\[/.test(sk), 'メニューの 呪文・特技は abilityFor');
  const auto = menu.slice(menu.indexOf('  autoSkillsView('), menu.indexOf('  questView('));
  assert.ok(!/ABILITIES\[/.test(auto), '作戦の オートで使う技');
  assert.match(sk, /dualForView\(id, c, mates\)/);
  assert.ok(!/DUAL_TECHS\[/.test(src('client/battle-dual.js')), '戦いの 合体技は dualFor');
});

// 第33回（家族が きめた こと）: 男の子の 美少女戦士は「仮面のしんし」、セーラームーンは「タキシード仮面」
//   男の子（look.body が 1 で ない）は 見た目・技も タキシード仮面ふう。職業の 名前も その 人 むけ（shared/job-label.js）。
//   女の子は 今の まま。ほかの 職業の 名前は かわらない。強さ・じょうけん・ID は おなじ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { isMasc, jobFor, jobLabel, jobShort, jobHint } from '../public/js/shared/job-label.js';
import { isMasc as abilityIsMasc } from '../public/js/shared/ability-label.js';
import { DUAL_TECHS, dualNeedText, groupJobText, groupName } from '../public/js/shared/data/dual.js';
import { growthSummary } from '../public/js/shared/world/growth.js';
import { penaltyFor, comboJobNames, sanitizeLook } from '../public/js/shared/stats.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { abilityDetail, whoCanEquip } from '../public/js/client/ui/info.js';
import { checkText } from '../tools/kanji-check.mjs';
import { makeRng } from '../public/js/shared/rng.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { Bot } from './helpers.js';

const BOY = { body: 0 };
const GIRL = { body: 1 };
const boy = { job: 'sailor_soldier', look: BOY };
const girl = { job: 'sailor_soldier', look: GIRL };
// 家族と きめた 名前
// 第40回: ネオ・クイーン・セレニティは 男の子なら キング・エンディミオン（test/jobs-r40.test.js）
const NAMES = { sailor_soldier: ['仮面のしんし', '美少女戦士'], sailor_moon: ['タキシード仮面', 'セーラームーン'], neo_queen: ['キング・エンディミオン', 'ネオ・クイーン・セレニティ'] };

test('男の子の 美少女戦士は「仮面のしんし」、セーラームーンは「タキシード仮面」（女の子は 今の まま）', () => {
  assert.deepEqual(Object.keys(JOBS).filter((j) => JOBS[j].masc).sort(), Object.keys(NAMES).sort(), 'masc の ある 職業');
  for (const [id, [m, f]] of Object.entries(NAMES)) {
    assert.equal(JOBS[id].name, f, `${id} の もとの 名前`);
    assert.equal(jobLabel(id, boy), m, `${id} 男の子`);
    assert.equal(jobLabel(id, girl), f, `${id} 女の子`);
    assert.equal(jobFor(id, boy).kana, JOBS[id].masc.kana);
    assert.equal(jobFor(id, boy).desc, JOBS[id].masc.desc);
    assert.equal(jobFor(id, girl), JOBS[id], '女の子は もとの データ（おなじ 物）');
    assert.notEqual(jobShort(id, boy), jobShort(id, girl));
    assert.equal(jobShort(id, girl), JOBS[id].short);
  }
  assert.equal(jobShort('sailor_soldier', boy), 'しんし');
  assert.equal(jobShort('sailor_moon', boy), 'タキシード');
  // おなじ 物を かえす（なんども 作らない）
  assert.equal(jobFor('sailor_moon', boy), jobFor('sailor_moon', { look: { body: 0 }, job: 'warrior' }));
});

test('男の子 むけの 職業は 名前・みじかい 名前・かな・説明・うわさ だけ ちがう（強さ・じょうけんは おなじ）・文字', () => {
  for (const id of Object.keys(NAMES)) {
    const j = JOBS[id], m = jobFor(id, boy);
    assert.deepEqual(Object.keys(j.masc).filter((k) => !['name', 'short', 'kana', 'desc', 'hint'].includes(k)), [], `${id}: かえて よいのは 名前・かな・説明 だけ`);
    for (const k of Object.keys(j)) {
      if (['name', 'short', 'kana', 'desc', 'masc'].includes(k)) continue;
      assert.deepEqual(m[k], j[k], `${id}.${k} は おなじ`);
    }
    assert.equal(m.masc, undefined, 'masc は のこさない');
    assert.equal(m.hint, undefined, 'うわさは jobHint');
    for (const k of ['name', 'short', 'kana', 'desc']) assert.ok(m[k], `${id}.${k}`);
    assert.match(m.kana, /^[ぁ-んー]+$/, `${id} の かな`);
    for (const s of [m.name, m.short, m.desc, j.masc.hint].filter(Boolean)) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    // ほかの 職業と 名前が かぶらない
    for (const o of Object.values(JOBS)) if (o.id !== id) assert.notEqual(o.name, m.name, `${id} と ${o.id}`);
  }
  // 神殿の うわさ（セーラームーン）: 男の子は 仮面のしんしの 話
  assert.equal(jobHint('sailor_moon', girl), JOB_HINTS.sailor_moon);
  assert.equal(jobHint('sailor_moon', boy), JOBS.sailor_moon.masc.hint);
  assert.ok(jobHint('sailor_moon', boy).includes('仮面のしんし'));
  assert.equal(jobHint('kaito_kid', boy), JOB_HINTS.kaito_kid);
  assert.equal(jobHint('warrior', boy), '');
});

test('ほかの 職業は 男の子でも おなじ・look の ない データ・魔物・知らない 職業でも おちない', () => {
  for (const id of Object.keys(JOBS)) {
    if (NAMES[id]) continue;
    assert.equal(jobFor(id, boy), JOBS[id], id);
    assert.equal(jobLabel(id, boy), JOBS[id].name, id);
    assert.equal(jobShort(id, boy), JOBS[id].short || JOBS[id].name, id);
  }
  for (const x of [null, undefined, 0, 'p1', {}, { job: 'sailor_moon', jobs: {} }, { look: null }, { look: 'x' }, { mon: 'slime', look: BOY }, { species: 'slime' }]) {
    assert.equal(isMasc(x), false, JSON.stringify(x));
    assert.equal(jobLabel('sailor_moon', x), 'セーラームーン', JSON.stringify(x));
    assert.equal(jobLabel('sailor_soldier', x), '美少女戦士');
  }
  assert.equal(jobLabel('no_such_job', boy), '');
  assert.equal(jobShort('no_such_job', boy), '');
  assert.equal(jobFor('no_such_job', boy), undefined);
  assert.equal(jobLabel(undefined, boy), '');
  // body の ない look は 男の子（絵と おなじ）。古い セーブ（look が ない）を ととのえると 男の子
  assert.equal(jobLabel('sailor_moon', { look: {} }), 'タキシード仮面');
  assert.equal(jobLabel('sailor_moon', { look: sanitizeLook(undefined) }), 'タキシード仮面');
  // 男の子かの きめ方は 1か所（技の ability-label.js と おなじ 関数）
  assert.equal(abilityIsMasc, isMasc);
});

test('レベルアップ・職業レベル・マスター・新しい 職業の 知らせも 男の子 むけ', () => {
  const jups = [
    { job: 'sailor_soldier', lv: 2, gains: {}, learned: [] },
    { job: 'sailor_soldier', lv: 3, gains: {}, learned: [] },
  ];
  assert.equal(growthSummary('ユウ', [], jups, { look: BOY }).lines[0], 'ユウ　仮面のしんしLv1→3！');
  assert.equal(growthSummary('ヒナ', [], jups, { look: GIRL }).lines[0], 'ヒナ　美少女戦士Lv1→3！');
  assert.equal(growthSummary('ヒナ', [], jups).lines[0], 'ヒナ　美少女戦士Lv1→3！', 'だれか わからない ときは もとの まま');
  const top = [{ job: 'sailor_soldier', lv: JOB_MAX_LEVEL, gains: {}, learned: [], unlocked: ['sailor_moon'], hinted: ['sailor_moon'] }];
  const nb = growthSummary('ユウ', [], top, { look: BOY }).notes, ng = growthSummary('ヒナ', [], top, { look: GIRL }).notes;
  assert.ok(nb.includes('★ ユウは仮面のしんしをマスターした！'), nb.join('/'));
  assert.ok(nb.some((l) => l.startsWith('★ ユウはタキシード仮面になれるようになった！')), nb.join('/'));
  assert.ok(nb.includes('☆ 新しい職業「タキシード仮面」のヒントを見つけた！（神殿で見られる）'));
  assert.ok(ng.includes('★ ヒナは美少女戦士をマスターした！'));
  assert.ok(ng.some((l) => l.startsWith('★ ヒナはセーラームーンになれるようになった！')));
  // ほかの 職業は 男の子でも おなじ
  assert.equal(growthSummary('ユウ', [], [{ job: 'kaito', lv: 2, gains: {} }], { look: BOY }).lines[0], 'ユウ　かいとうLv1→2！');
  for (const l of [...nb, growthSummary('ユウ', [], jups, { look: BOY }).lines[0]]) assert.deepEqual(checkText(l), [], l);
});

test('転職（サーバーの 返事）: 男の子は「仮面のしんしになった！」、まだ なれない ときの じょうけんも 男の子 むけ', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(33), rateLimit: false });
  const bot = new Bot(world, 'ユウ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  const svc = (msg) => {
    bot.send({ t: 'svc', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  for (const j of ['middleschooler', 'idol', 'schoolkid']) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 };
  c.equip.shield = null;
  bot.s.busy = { kind: 'svc' };
  assert.equal(c.look.body, 0);
  let r = svc({ kind: 'jobChange', job: 'sailor_moon' });
  assert.equal(r.ok, false);
  assert.equal(r.text, 'まだタキシード仮面にはなれない…\n（仮面のしんしLv10が必要）');
  r = svc({ kind: 'jobChange', job: 'sailor_soldier' });
  assert.equal(r.ok, true, r.text);
  assert.equal(r.text.split('\n')[0], 'ユウは仮面のしんしになった！');
  // 女の子は 今の まま
  c.look.body = 1;
  r = svc({ kind: 'jobChange', job: 'sailor_moon' });
  assert.equal(r.text, 'まだセーラームーンにはなれない…\n（美少女戦士Lv10が必要）');
  r = svc({ kind: 'jobChange', job: 'warrior' });
  assert.equal(r.ok, true, r.text);
  r = svc({ kind: 'jobChange', job: 'sailor_soldier' });
  assert.equal(r.text.split('\n')[0], 'ユウは美少女戦士になった！');
  // じょうけんの 文（jobReqText の 名前を かえる）
  assert.equal(jobReqText('sailor_moon', (x) => jobLabel(x, boy)), '仮面のしんしLv10');
  assert.equal(jobReqText('sailor_moon'), '美少女戦士Lv10');
});

test('合体技の 必要な 職業（見ている 人で きめる）・技の 説明・転職ペナルティの 職業名', () => {
  const t = DUAL_TECHS.dt_moonlight;
  const [sailor] = t.need;
  assert.equal(groupJobText(sailor, boy), '仮面のしんし・タキシード仮面');
  assert.equal(groupJobText(sailor, girl), '美少女戦士・セーラームーン');
  assert.equal(groupJobText(sailor), '美少女戦士・セーラームーン');
  assert.equal(groupName(sailor, boy), '仮面のしんしの技');
  assert.equal(groupName(sailor, girl), '美少女戦士の技');
  assert.ok(dualNeedText('dt_moonlight', false, boy).startsWith('仮面のしんし・タキシード仮面＋'), dualNeedText('dt_moonlight', false, boy));
  assert.ok(dualNeedText('dt_moonlight', false, girl).startsWith('美少女戦士・セーラームーン＋'));
  assert.ok(dualNeedText('dt_moonlight', true, boy).startsWith('仮面のしんし＋'), dualNeedText('dt_moonlight', true, boy));
  assert.ok(dualNeedText('dt_moonlight', true, girl).startsWith('美少女戦士＋'));
  assert.equal(dualNeedText('dt_moonlight', true), dualNeedText('dt_moonlight', true, girl));
  // ほかの 合体技は 男の子でも おなじ
  for (const id of Object.keys(DUAL_TECHS)) if (id !== 'dt_moonlight') assert.equal(dualNeedText(id, false, boy), dualNeedText(id), id);
  // 技の 説明（覚えた 職業・職業レベル）
  const pcBoy = { job: 'sailor_moon', jobs: { sailor_soldier: { lv: 5 }, sailor_moon: { lv: 3 } }, level: 30, look: BOY };
  const pcGirl = { ...pcBoy, look: GIRL };
  assert.ok(abilityDetail('bs_kizuna', pcBoy).includes('覚えた職業: 仮面のしんし'), abilityDetail('bs_kizuna', pcBoy));
  assert.ok(abilityDetail('bs_kizuna', pcGirl).includes('覚えた職業: 美少女戦士'));
  // ほかの 職業で 使う ときの ペナルティの 文（「〇〇の技：MP…」）
  const other = (look) => ({ job: 'warrior', jobs: { warrior: { lv: 1 }, sailor_moon: { lv: 3 } }, look, level: 30 });
  assert.ok(penaltyFor(other(BOY), 'mn_stick').label.startsWith('タキシード仮面の技：'), penaltyFor(other(BOY), 'mn_stick').label);
  assert.ok(penaltyFor(other(GIRL), 'mn_stick').label.startsWith('セーラームーンの技：'));
  // 掛け合わせ技の 職業・装備できる 職業（いまは 美少女戦士が 出ない が、見ている 人を うけとる）
  for (const id of Object.keys(ABILITIES).filter((x) => ABILITIES[x].kind === 'combo').slice(0, 5)) assert.deepEqual(comboJobNames(id, boy), comboJobNames(id), id);
  assert.equal(whoCanEquip('tiara_boomerang', null, boy).replace(/仮面のしんし/g, '美少女戦士'), whoCanEquip('tiara_boomerang', null, girl));
});

// ───────────── 画面（ソース を 見る） ─────────────
const src = (p) => readFileSync(new URL(`../public/js/${p}`, import.meta.url), 'utf8');
const slice = (s, a, b) => s.slice(s.indexOf(a), b ? s.indexOf(b, s.indexOf(a)) : undefined);

test('職業の 名前を 出す 画面は jobLabel・jobFor を 使う（JOBS[...].name を 直接 出さない）', () => {
  // 職業の 名前を 出す 画面の ファイルには JOBS[…].name が のこって いない
  for (const f of ['client/ui/menu.js', 'client/ui/services.js', 'client/ui/counter.js', 'client/ui/wagon.js', 'client/ui/info.js',
    'shared/world/growth.js', 'shared/world/services.js', 'shared/data/dual.js', 'shared/stats.js']) {
    assert.ok(!/JOBS\[[^\]]+\]\??\.(name|short|kana|desc)\b/.test(src(f)), `${f} に JOBS[…].name が ある`);
  }
  const menu = src('client/ui/menu.js');
  // ステータス・全員の 一覧・パーティーの 札・だれの？
  assert.match(slice(menu, '  statusView(', '  allStatusView('), /jobLabel\(c\.job, c\)/);
  assert.match(slice(menu, '  statusView(', '  allStatusView('), /jobLabel\(j, c\)/, '職業レベルの 一覧');
  assert.match(slice(menu, '  allStatusView(', '  partyView('), /jobLabel\(g\.me\.job, g\.me\)/);
  assert.match(slice(menu, '  partyView(', '\n  }\n'), /jobLabel\(m\.job, m\)/);
  assert.match(slice(menu, '  whoView(', '\n  }\n'), /jobLabel\(m\.job, m\)/);
  assert.match(menu, /dualNeedText\(id, false, c\)/, '合体技の 必要な 職業は 見ている 人で');
  // 神殿（転職の 一覧・説明・うわさ・かくにん）
  const temple = slice(src('client/ui/services.js'), 'function jobUI(', 'function tavernUI(');
  assert.match(temple, /jobLabel\(j, c\)/);
  assert.match(temple, /const job = jobFor\(j, c\);/);
  assert.match(temple, /jobHint\(s, c\)/);
  assert.match(temple, /jobAskText\(jobLabel\(it\.value, c\)/);
  assert.ok(!/JOB_HINTS\[/.test(temple));
  // 酒場・馬車・お店の だれが・タイトルの キャラの 一覧
  assert.match(src('client/ui/services.js'), /jobLabel\(e\.job, e\)/);
  assert.match(src('client/ui/wagon.js'), /jobLabel\(x\.job, x\)/);
  assert.match(src('client/ui/counter.js'), /jobLabel\(me\.job, me\)/);
  assert.match(src('client/ui/title.js'), /jobLabel\(c\.job, c\)/);
  // 戦いの 合体技の 説明の まど
  assert.match(src('client/battle-dual.js'), /dualNeedText\(o\.id, true, v\.myActor\)/);
  // サーバー: 転職の 返事は なる 人で
  assert.match(src('shared/world/services.js'), /const jn = \(j\) => jobLabel\(j, who\);/);
});

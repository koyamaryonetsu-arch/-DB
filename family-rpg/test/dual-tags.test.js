// 2026年10月（第35回 C）: 職業の タグと、タグで 決める 合体技（docs/idea-r35.md の J・L）
//  ・どの 職業にも タグ 2〜4こ（data/job-tags.js。jobs.js の JOBS[id].tags）
//  ・合体技の 組は タグの 組み合わせ（data/dual.js）。どの 職業も 3つ いじょうの 合体技に 入れる・「誰でも」は ミナデインだけ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JOBS, ALL_JOBS } from '../public/js/shared/data/jobs.js';
import { TAGS, TAG_ORDER, JOB_TAGS, jobsWithTag, tagName } from '../public/js/shared/data/job-tags.js';
import {
  DUAL_TECHS, DUAL_ORDER, DUAL_GROUP_NAMES, ANY_GROUPS, MONSTER_ALLY, dualOptions, dualSize, groupJobs, isTagGroup, groupTags,
  dualNeedText, dualNeedLabel, dualNeedKind,
} from '../public/js/shared/data/dual.js';
import { DUAL_POWER } from '../public/js/shared/battle-dual.js';
import { weaponOk } from '../public/js/shared/stats.js';
import { DUAL_FX } from '../public/js/client/render/dualfx.js';
import { checkText } from '../tools/kanji-check.mjs';

test('タグ: どの 職業にも 2〜4こ・知っている タグだけ・同じ タグを 2回 つけない', () => {
  assert.deepEqual(Object.keys(JOB_TAGS).sort(), [...ALL_JOBS].sort(), 'JOB_TAGS と 職業の 一覧が 同じ（職業を ふやしたら タグも）');
  for (const j of ALL_JOBS) {
    const tags = JOBS[j].tags;
    assert.ok(Array.isArray(tags), `${JOBS[j].name}: JOBS[id].tags`);
    assert.ok(tags.length >= 2 && tags.length <= 4, `${JOBS[j].name}: ${tags.length}こ`);
    assert.equal(new Set(tags).size, tags.length, `${JOBS[j].name}: 同じ タグ`);
    for (const t of tags) assert.ok(TAGS[t], `${JOBS[j].name}: ${t}`);
  }
});

test('タグ: どの タグも 2つ いじょうの 職業に ある・名前と 意味は ゲームの 文字の きまりどおり', () => {
  assert.equal(TAG_ORDER.length, Object.keys(TAGS).length);
  for (const t of TAG_ORDER) {
    assert.ok(jobsWithTag(t).length >= 2, `${tagName(t)}: ${jobsWithTag(t).length}職業`);
    assert.ok(jobsWithTag(t).length <= Math.ceil(ALL_JOBS.length / 3), `${tagName(t)}: 広すぎる`);
    for (const s of [TAGS[t].name, TAGS[t].desc]) assert.deepEqual(checkText(s), [], s);
  }
  // 名前は かさならない
  const names = TAG_ORDER.map(tagName);
  assert.equal(new Set(names).size, names.length);
  // 例: 作品を またいで 同じ タグ
  for (const j of ['dragon_knight', 'doraemon', 'kaito_kid', 'harry']) assert.ok(JOBS[j].tags.includes('sky'), `${JOBS[j].name}は 空`);
  for (const j of ['sailor_moon', 'ss3', 'nika', 'spy']) assert.ok(JOBS[j].tags.includes('henshin'), `${JOBS[j].name}は 変身`);
});

// ───────────── タグで 決める 合体技 ─────────────
const p = (id, job, extra = {}) => ({ id, name: id, job, alive: true, abilities: [], mp: 99, ready: true, statuses: [], weaponCat: 'sword', ...extra });
const mon = (id) => p(id, null, { mon: 'slime' });
const OPEN = (g) => ANY_GROUPS.has(g) || g === MONSTER_ALLY;
// 前から ある 合体技（46こ）。id と 名前は そのまま（古い セーブ・お気に入り・dualSeen）
const OLD = {
  dt_taishoumetsu: '対消滅', dt_honoo_tatsumaki: '炎の竜巻', dt_cross_mahouken: 'クロス魔法剣', dt_cross_break: 'クロスブレイク', dt_iyashi_wa: 'いやしの輪', dt_stage: 'ステージショー',
  dt_tsukin_rush: '通勤ラッシュ', dt_jugyo_sankan: '授業参観', dt_manzai: 'まんざい', dt_gomu_kame: 'ゴムゴムのかめはめ波', dt_bentou: 'お弁当とどけに来たよ', dt_hataraki: '早く働きなさい！',
  dt_gyouretsu: '行列のできる店', dt_zenkan: '全館リニューアル', dt_hametsu: '破滅のはかい玉', dt_hikari_yami: '光と闇', dt_delta: 'デルタストライク', dt_jump: 'せーのでジャンプ',
  dt_uukanpi: 'ウーウーカンカンピーポー', dt_oosouji: '大そうじ大作戦', dt_ogori: '部長のおごりだ！', dt_dai_collab: '大コラボ配信', dt_zenin: '全員集合', dt_kazoku_kaigi: '家族会議',
  dt_finale: 'グランドフィナーレ', dt_minadein: 'ミナデイン', dt_hannin: 'おまえが犯人だ！', dt_nantoka: 'なんとかしてよ〜！', dt_kyuuri_zushi: 'キュウリずし', dt_point10: 'ポイント10倍デー',
  dt_nichirin: '日輪の大ほのお', dt_nenriki_meteor: 'ねん力メテオ', dt_okusuri: 'おくすり手帳', dt_megumi: 'め組の大立ち回り', dt_hakkeyoi: 'はっけよい、のこった！', dt_nazo: 'なぞはすべて解けた！',
  dt_sentaku_biyori: 'せんたく日和でござる', dt_sanken: '天下無敵の三剣士', dt_beast_cross: 'ビーストクロス', dt_circus: '大サーカス', dt_wild_rush: 'ワイルドラッシュ', dt_tsukiyo: '月夜のかけひき',
  dt_reform: '一晩で大リフォーム', dt_moonlight: 'ムーンライト・ステージ', dt_hippogriff: 'ヒッポグリフの空の旅', dt_sotsugyou: '旅立ちの日に',
};
const NEW = DUAL_ORDER.filter((id) => !OLD[id]);

test('合体技の 数: 2人技 30〜40・3人技 10〜15・4人技 5 くらい。前の 46こは id・名前・えんしゅつ そのまま', () => {
  const by = (n) => DUAL_ORDER.filter((id) => dualSize(id) === n).length;
  assert.ok(by(2) >= 30 && by(2) <= 40, `2人技 ${by(2)}`);
  assert.ok(by(3) >= 10 && by(3) <= 15, `3人技 ${by(3)}`);
  assert.ok(by(4) >= 5 && by(4) <= 6, `4人技 ${by(4)}`);
  assert.equal(Object.keys(OLD).length, 46);
  for (const [id, nm] of Object.entries(OLD)) {
    assert.equal(DUAL_TECHS[id]?.name, nm, id);
    assert.ok(DUAL_FX[id]?.finale, `${id}: えんしゅつ`);
  }
  assert.ok(NEW.length >= 10, `新しい 技 ${NEW.length}`);
  // 家族の 例（docs/idea-r35.md の J。炎と氷・光と闇は 前からの 対消滅・光と闇が その 組）
  const has = (nm) => DUAL_ORDER.some((id) => DUAL_TECHS[id].name === nm);
  for (const nm of ['三剣士の大一番', '大空のさんぽ', '変身ヒーロー大集合', '師弟の一げき', '永遠のライバル', '忍びの影分身', '町のお祭り', 'ひみつ道具とれん金']) assert.ok(has(nm), nm);
  // 新しい 技は ぜんぶ タグの 組（作品を またぐ）・えんしゅつは 今ある 型
  for (const id of NEW) {
    assert.ok(DUAL_TECHS[id].need.every(isTagGroup), `${id}: タグの 組`);
    assert.ok(['nova', 'storm', 'cross', 'beam', 'quake', 'heal', 'stage', 'laugh', 'siren', 'bolt', 'spot', 'gadgets', 'coins', 'meteor', 'matoi'].includes(DUAL_FX[id]?.finale), id);
    assert.equal(dualNeedKind(id), 'tag');
  }
});

test('どの 職業も、3つ いじょうの 合体技に 入れる（今の 職業で。2人技の 相手は だれかの 職業。「だれでも」の 組は 数えない）', () => {
  const few = [];
  for (const j of ALL_JOBS) {
    let n = 0;
    for (const id of DUAL_ORDER) {
      const t = DUAL_TECHS[id];
      const g = t.need.findIndex((x) => !OPEN(x) && groupJobs(x).has(j));
      if (g < 0) continue;
      // ほかの 組に 1人ずつ 入れて、ほんとうに 出せるか
      const team = t.need.map((x, i) => {
        if (i === g) return null;
        if (x === MONSTER_ALLY) return mon(`m${i}`);
        return p(`p${i}`, [...groupJobs(x)][0]);
      }).filter(Boolean);
      if (dualOptions(p('me', j), team, weaponOk).some((o) => o.id === id)) n++;
    }
    if (n < 3) few.push(`${JOBS[j].name}: ${n}`);
  }
  assert.deepEqual(few, [], '合体技が 少ない 職業');
});

test('「誰でも」は ミナデインだけ・同じ 組の 合体技は 2つ ない・同じ 仲間で 同じ 技は 1回だけ 出る', () => {
  const anyTechs = DUAL_ORDER.filter((id) => DUAL_TECHS[id].team !== 'line' && DUAL_TECHS[id].need.some((g) => ANY_GROUPS.has(g)));
  assert.deepEqual(anyTechs, ['dt_minadein']);
  // 組の そろいかた（ならびは 関係 ない）が 同じ 技は ない
  const keyOf = (t) => t.need.map((g) => DUAL_GROUP_NAMES.get(g)).sort().join('+') + (t.team || '');
  const seen = new Map();
  for (const id of DUAL_ORDER) {
    const k = keyOf(DUAL_TECHS[id]);
    assert.ok(!seen.has(k), `${DUAL_TECHS[id].name} と ${seen.get(k)} が 同じ 組（${k}）`);
    seen.set(k, DUAL_TECHS[id].name);
  }
  // 同じ 仲間で 同じ 技は 1回だけ（タグが 多い 職業で 組を 何通りも うけもてても）
  const teams = [
    ['hero', ['loto_hero', 'sword_master', 'magic_knight']], ['kaito_kid', ['black_org', 'konoha', 'meitantei']],
    ['wizard_student', ['harry', 'homeroom_3b', 'esper']], ['ss3', ['nika', 'sailor_moon', 'dragon_knight']], ['okan', ['schoolkid', 'doraemon', 'police']],
  ];
  for (const [me, others] of teams) {
    const opts = dualOptions(p('me', me), others.map((j, i) => p(`o${i}`, j)), weaponOk);
    const keys = opts.map((o) => `${o.id}:${[...o.partners].sort().join(',')}`);
    assert.equal(new Set(keys).size, keys.length, `${me}: ${keys.join(' ')}`);
    assert.ok(opts.length >= 3, `${me}: ${opts.length}`);
  }
  // 例: 作品を またいで 出せる
  const can = (id, jobs) => dualOptions(p('a', jobs[0]), jobs.slice(1).map((j, i) => p(`b${i}`, j)), weaponOk).some((o) => o.id === id);
  assert.ok(can('dt_oozora', ['dragon_knight', 'doraemon']), '竜の騎士×ドラえもん');
  assert.ok(can('dt_oozora', ['harry', 'kaito_kid']), 'ハリー×かいとうキッド');
  assert.ok(can('dt_rival', ['meitantei', 'kaito_kid']) && can('dt_rival', ['hero', 'maou']), 'ライバル');
  assert.ok(can('dt_shitei', ['homeroom_3b', 'schoolkid']) && can('dt_shitei', ['hokage', 'wizard_student']), '師弟');
  assert.ok(can('dt_kagebunshin', ['ninja', 'spy']), '忍び');
  assert.ok(can('dt_himitsu_rensei', ['doraemon', 'alchemist']) && can('dt_himitsu_rensei', ['ryonetsu', 'fullmetal']), '機械×れん金');
  assert.ok(can('dt_sanken_ooichiban', ['samurai', 'rurouni', 'kisatsu']), '三剣士');
  assert.ok(can('dt_henshin_hero', ['sailor_moon', 'super_saiyan', 'nika']), '変身');
  assert.ok(can('dt_omatsuri', ['star_chef', 'idol', 'shacho']), 'お祭り');
  assert.ok(can('dt_taishoumetsu', ['enbashira', 'kisatsu']) && can('dt_hikari_yami', ['sailor_moon', 'maou']), '炎×氷・光×闇');
  // 今の 職業で 判定（マスターした 職業の タグは 関係 ない）
  assert.ok(!can('dt_oozora', ['warrior', 'doraemon']));
});

test('強さ: 新しい 技も 今の はんい（同じ 人数・同じ ねらいの 前からの 技の いちばん 強い k まで。ミナデインより 弱い）', () => {
  const maxK = (t) => Math.max(0, ...t.parts.filter((x) => x.type === 'power').map((x) => x.k));
  const scope = (t) => t.parts.find((x) => x.type === 'power')?.target || t.target;
  for (const id of NEW) {
    const t = DUAL_TECHS[id];
    const k = maxK(t);
    if (!k) continue;
    const same = Object.keys(OLD).filter((o) => o !== 'dt_minadein' && dualSize(o) === dualSize(id) && scope(DUAL_TECHS[o]) === scope(t)).map((o) => maxK(DUAL_TECHS[o]));
    assert.ok(k <= Math.max(...same), `${t.name}: k ${k} > ${Math.max(...same)}`);
    assert.ok(!t.bossCap, `${t.name}: ボスへの 上限は 人数の きまりの まま`);
    assert.ok(k * DUAL_POWER[dualSize(id)] < DUAL_TECHS.dt_minadein.parts[0].k * DUAL_POWER[4]);
  }
});

test('必要な タグの 文: 「必要なタグ：剣＋空」（タグと 職業が まざる ときは タグを「」で）・文字の きまり', () => {
  assert.equal(dualNeedLabel('dt_oozora'), '必要なタグ');
  assert.equal(dualNeedText('dt_oozora'), '空×2');
  assert.equal(dualNeedText('dt_ikazuchi_ken'), '剣＋雷');
  assert.equal(dualNeedText('dt_sanken_ooichiban', true), '剣×3');
  assert.equal(dualNeedLabel('dt_hametsu'), '必要な職業');
  assert.equal(dualNeedText('dt_hametsu'), '魔王＋はかい神');
  assert.equal(dualNeedLabel('dt_megumi'), '必要なタグと職業');
  assert.equal(dualNeedText('dt_megumi', true), '将軍＋「剣」＋「忍び」');
  assert.equal(dualNeedLabel('dt_minadein'), '必要な職業');
  for (const id of DUAL_ORDER) {
    for (const s of [dualNeedLabel(id), dualNeedText(id), dualNeedText(id, true)]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
  }
  // どの タグも どれかの 合体技に 出てくる
  const used = new Set(DUAL_ORDER.flatMap((id) => DUAL_TECHS[id].need.flatMap(groupTags)));
  for (const t of TAG_ORDER) assert.ok(used.has(t), `${tagName(t)} の 合体技`);
  // メニュー・戦いの 説明の まどは 見出しも かわる
  const src = (f) => fs.readFileSync(new URL(`../public/js/client/${f}`, import.meta.url), 'utf8');
  assert.match(src('ui/menu.js'), /\$\{dualNeedLabel\(id\)\}：\$\{dualNeedText\(id, false, c\)\}/);
  assert.match(src('battle-dual.js'), /\$\{dualNeedLabel\(o\.id\)\}：\$\{dualNeedText\(o\.id, true, v\.myActor\)\}/);
});

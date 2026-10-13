// 主人公の え（render/hero-r33.js）: 第33回の 新しい 職業 11この 服・ぼうし・かみ・かお・もちものと、
// 技の えんしゅつ（render/battlefx-jobs7.js。えんしゅつの なまえ anim で ひく）と 音（sfx-r33.js）
// 職業の データ（data/jobs.js・技）は べつの 人が つくるので、ここでは 職業の id を ちょくせつ わたして 絵だけを たしかめる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { HAIR_STYLE_IDS } from '../public/js/client/render/hero-hair.js';
import { R33_JOBS, R33_OUTFIT, R33_BODY, R33_HAT, R33_BODY_HAT, R33_OLD_LOOK, R33_HAIR, R33_MASC, masc33 } from '../public/js/client/render/hero-r33.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { JOB_FINE, playJobFx } from '../public/js/client/render/battlefx-jobs.js';
import { JOB2_FINE, playJob2Fx } from '../public/js/client/render/battlefx-jobs2.js';
import { JOB3_FINE, playJob3Fx } from '../public/js/client/render/battlefx-jobs3.js';
import { JOB4_FINE, playJob4Fx } from '../public/js/client/render/battlefx-jobs4.js';
import { JOB5_FINE, playJob5Fx } from '../public/js/client/render/battlefx-jobs5.js';
import { JOB6_FINE, playJob6Fx } from '../public/js/client/render/battlefx-jobs6.js';
import { R27_FINE, R27_ANIMS } from '../public/js/client/render/battlefx-r27.js';
import { R33_ANIMS, R33_SIGS, R33_MOVES, PARTY_ANIMS7, JOB7_HIT, JOB7_SFX, JOB7_FINE, playJob7Fx } from '../public/js/client/render/battlefx-jobs7.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';

const DIRS = ['down', 'left', 'up', 'right'];
// 職業の id（docs/plan-r33-jobs.md の やくそく。ならびも この とおり）
const JOBS11 = ['magician', 'kaito', 'kaito_kid', 'wizard_student', 'harry', 'homeroom_3b', 'alchemist', 'state_alchemist', 'fullmetal', 'sailor_soldier', 'sailor_moon'];
const OUTLINE = 0x1b1330;

function inspect(img) {
  const { w, h, rgba } = img;
  let n = 0, semi = 0, edge = false, rim = 0, rimOut = 0;
  const cols = new Set();
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rgba[(y * w + x) * 4 + 3] === 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = rgba[i + 3];
      if (a === 0) continue;
      n++;
      if (y === 0 || x === 0 || x === w - 1) edge = true;
      if (a < 255) { semi++; continue; }
      const c = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
      cols.add(c);
      if (!solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1)) { rim++; if (c === OUTLINE) rimOut++; }
    }
  }
  return { n, semi, edge, colors: cols.size, rimOut: rim ? rimOut / rim : 0 };
}
const key = (img) => Buffer.from(img.rgba).toString('base64');
function checkImg(img, what) {
  const r = inspect(img);
  assert.ok(r.n > img.w * img.h * 0.12, `${what} が かけている`);
  assert.ok(!r.edge, `${what} が ふちに さわる`);
  assert.ok(r.colors <= 120, `${what} の いろが おおすぎる（${r.colors}）`);
  assert.ok(r.rimOut >= 0.45, `${what} の りんかくが たりない（${r.rimOut.toFixed(2)}）`);
  assert.equal(r.semi, 0, `${what} に すける ピクセル`);
  return r;
}
const countPx = (img, f) => {
  let n = 0;
  for (let i = 0; i < img.rgba.length; i += 4) if (img.rgba[i + 3] === 255 && f(img.rgba[i], img.rgba[i + 1], img.rgba[i + 2])) n++;
  return n;
};

test('第33回の 職業: 11この 職業 すべてに 服・からだ・古い え が ある（データが なくても かける）', () => {
  assert.deepEqual(R33_JOBS, JOBS11);
  assert.deepEqual(Object.keys(R33_OUTFIT), JOBS11);
  assert.deepEqual(Object.keys(R33_BODY), JOBS11);
  assert.deepEqual(Object.keys(R33_OLD_LOOK), JOBS11);
  for (const job of Object.keys(R33_HAT)) assert.ok(JOBS11.includes(job) && !R33_BODY_HAT[job], job);
  for (const job of Object.keys(R33_BODY_HAT)) assert.ok(JOBS11.includes(job), job);
  for (const job of JOBS11) {
    if (JOBS[job]) assert.equal(typeof JOBS[job].name, 'string', job);
    const img = paintHero({ body: 0, style: 'short' }, job, undefined, 'down', 0, 4);
    assert.ok(inspect(img).n > 500, job);
  }
  // 職業の かみは えらべる かみがたには ならない
  for (const id of ['messy33', 'center33', 'braid33', 'moon33']) assert.ok(!HAIR_STYLE_IDS.includes(id), id);
  for (const job of JOBS11) { const h = R33_BODY[job].hcol; if (h) assert.ok(R33_HAIR[h], `${job} の かみの いろ`); }
});

test('第33回の 職業の 服: 男女・4方向・かみがた・2コマ・2つの 大きさで かけて、はみ出さない（パレットの きまり）', () => {
  for (const job of JOBS11) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const [style, f, tone] of [['short', 0, 'light'], ['twin', 1, 'deep']]) {
          for (const res of [4, 8]) checkImg(paintHero({ body, style, hcol: 'brown', tone }, job, undefined, dir, f, res), `${job} ${body} ${dir} ${style} f${f} res${res}`);
        }
      }
    }
  }
});

test('第33回の 職業の 服: そうびを かえても はみ出さない（ぶき・たて・よろい・かぶと）', () => {
  const EQS = [',cloth,,', 'iron_sword,cloth,,', 'iron_sword,iron_armor,iron_shield,iron_helm', ',chain_mail,,leather_hat', 'iron_sword,cloth,iron_shield,', 'oak_staff,wizard_robe,,'];
  for (const job of JOBS11) {
    for (const eq of EQS) {
      for (const body of [0, 1]) for (const dir of DIRS) checkImg(paintHero({ body, style: 'long', hcol: 'black' }, job, eq, dir, body, 4), `${job} ${eq} ${body} ${dir}`);
      checkImg(paintHero({ body: 0, style: 'afro' }, job, eq, 'down', 0, 8), `${job} ${eq} res8`);
    }
  }
});

test('第33回の 職業の 服: どれも ちがう え（にている いまの 職業とも ちがう）', () => {
  const LIKE = ['warrior', 'mage', 'salaryman', 'spy', 'meitantei', 'oshiri_tantei', 'chuuni', 'black_org', 'highschooler', 'middleschooler', 'idol', 'police', 'railman', 'sage'];
  for (const body of [0, 1]) {
    for (const dir of DIRS) {
      const seen = new Map();
      for (const job of [...LIKE, ...JOBS11]) {
        const k = key(paintHero({ body, style: 'short' }, job, job === 'warrior' ? '' : ',cloth,,', dir, 0, 4));
        assert.ok(!seen.has(k), `${job} body${body} ${dir} が ${seen.get(k)} と おなじ え`);
        seen.set(k, job);
      }
    }
  }
});

test('第33回の 職業の 服: 服の しゅるい・マント・シルクハット・ティアラ・もちもの', () => {
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  const O = (job, armor = 'cloth', fem = false) => outfitOf(Lk, job, armor, fem);
  const KIND = { magician: 'suit', kaito: 'suit', kaito_kid: 'suit', wizard_student: 'robe', harry: 'robe', homeroom_3b: 'suit', alchemist: 'robe', state_alchemist: 'uniform', fullmetal: 'coat', sailor_soldier: 'sailor', sailor_moon: 'sailor' };
  // 美少女戦士・セーラームーンの セーラー服は 女の子だけ（男の子は タキシード仮面ふう。下の テスト）
  const girl = (job) => job === 'sailor_soldier' || job === 'sailor_moon';
  for (const [job, k] of Object.entries(KIND)) {
    assert.equal(O(job, 'cloth', girl(job)).kind, k, job);
    assert.equal(O(job, null, girl(job)).kind, k, `${job} よろい なし`);
    assert.equal(O(job, 'cloth', true).kind, k, `${job} 女性`);
  }
  // マント（手品師は 黒に 赤い うら、かいとうと キッドは 白）と まえに たれる マント。よろいを きると なくなる
  for (const job of ['magician', 'kaito', 'kaito_kid']) {
    assert.ok(O(job).cape && O(job).r33.drape && O(job).glove, job);
    assert.ok(!O(job, 'iron_armor').cape, `${job} てつの よろい`);
  }
  assert.ok(O('harry').r33.scarf && O('harry').r33.broom && O('harry').r33.tie, 'ハリーの マフラー・ほうき・ネクタイ');
  assert.ok(O('wizard_student').r33.tie && !O('wizard_student').r33.scarf, '魔法学校の生徒の ネクタイ');
  assert.ok(O('state_alchemist').r33.chain && O('fullmetal').r33.crest, '銀時計の くさり・コートの しるし');
  assert.ok(O('sailor_moon', 'cloth', true).skirt && O('sailor_moon', 'cloth', true).r33.bow.moon, 'セーラー戦士の スカートと リボン');
  // ぼうし（シルクハットは 布の服の とき。ティアラは よろいでも のこり、かぶとで かわる）
  const hat = (job, armor = 'cloth', head = null, fem = false) => headOf(head, job, armor, O(job, armor, fem))?.kind || null;
  for (const job of ['magician', 'kaito', 'kaito_kid']) {
    assert.equal(hat(job), 'silk33', job);
    assert.equal(hat(job, 'iron_armor'), null, `${job} てつの よろい`);
  }
  for (const job of ['sailor_soldier', 'sailor_moon']) {
    assert.equal(hat(job, 'cloth', null, true), 'tiara33', job);
    assert.equal(hat(job, 'iron_armor', null, true), 'tiara33', `${job} てつの よろい`);
    assert.equal(hat(job, 'iron_armor', 'iron_helm', true), 'helmet', `${job} かぶと`);
  }
  for (const job of ['harry', 'homeroom_3b', 'alchemist', 'fullmetal', 'wizard_student']) assert.equal(hat(job), null, job);
  // もちもの・かお・からだ（よろいを きても のこる）
  const PROP = { magician: 'stick33', kaito: 'notice33', kaito_kid: 'cardgun33', wizard_student: 'wand33', harry: 'wand33', homeroom_3b: 'book33', state_alchemist: 'watch33', sailor_moon: 'moonstick33' };
  for (const [job, p] of Object.entries(PROP)) assert.equal(jobBody(job).prop, p, job);
  assert.ok(jobBody('harry').glasses33 && jobBody('harry').bolt33, 'まるめがねと いなずまの きず');
  assert.equal(jobBody('kaito').monocle33, 'plain');
  assert.equal(jobBody('kaito_kid').monocle33, 'clover');
  assert.equal(O('fullmetal', 'iron_armor').sleeveR?.mech, true, '機械の 右うでは よろいでも のこる');
  assert.ok(O('alchemist', 'iron_armor').handMark && O('state_alchemist').handMark, 'れん金の 円の 手ぶくろ');
  // 古い え（chars.js）でも 職業の 服（戦士の 服に ならない）
  const warrior = lookToOpts({}, 'warrior', ',cloth,,');
  for (const job of JOBS11) {
    const o = lookToOpts({}, job, ',cloth,,');
    assert.ok(o.outfit, `${job} の 古い え`);
    assert.notDeepEqual(o, warrior, `${job} の 古い え`);
  }
});

test('第33回の 職業の からだ: めがね・片めがね・きず・機械の うで・かみは よろいを きても のこる', () => {
  const look = { body: 0, style: 'short', hcol: 'brown', tone: 'light' };
  for (const job of ['harry', 'kaito', 'kaito_kid', 'fullmetal', 'homeroom_3b', 'sailor_moon', 'alchemist', 'state_alchemist']) {
    for (const eq of [',iron_armor,,', 'iron_sword,cloth,,']) {
      assert.notEqual(key(paintHero(look, job, eq, 'down', 0, 4)), key(paintHero(look, 'warrior', eq, 'down', 0, 4)), `${job} ${eq}`);
    }
  }
  // セーラームーンと はがねの れん金術師は 金の かみ（えらんだ 茶色の かみでも）
  const gold = (r, g, b) => r > 200 && g > 150 && b < 120 && r - b > 110;
  for (const job of ['sailor_moon', 'fullmetal']) assert.ok(countPx(paintHero(job === 'sailor_moon' ? { ...look, body: 1 } : look, job, undefined, 'up', 0, 8), gold) > 600, `${job} の 金の かみ`);
  assert.ok(countPx(paintHero(look, 'warrior', undefined, 'up', 0, 8), gold) < 100, 'ふつうの かみ');
  // はがねの れん金術師の 右うで（ひじから 先が はがねの 色）
  const steel = (r, g, b) => b > r + 12 && b > g && r > 70 && r < 230 && Math.abs(r - g) < 24;
  assert.ok(countPx(paintHero(look, 'fullmetal', undefined, 'down', 0, 8), steel) > countPx(paintHero(look, 'warrior', undefined, 'down', 0, 8), steel) + 20, '機械の うで');
  // ハリーの マフラーは 赤と 金
  const red = (r, g, b) => r > 130 && g < 60 && b < 70;
  assert.ok(countPx(paintHero(look, 'harry', undefined, 'down', 0, 8), red) > countPx(paintHero(look, 'wizard_student', undefined, 'down', 0, 8), red) + 40, 'ハリーの 赤');
});

test('第33回の 装備の 見た目: 11この 品（ぶき・よろい・ぼうし）は 職業の 見た目が ある・はみ出さない', () => {
  const look = { body: 0, style: 'short', hcol: 'brown' };
  const W = ['magic_wand', 'chalk', 'pointer_stick', 'elder_wand', 'tiara_boomerang', 'automail_arm'];
  for (const id of [...W, 'silk_hat', 'school_robe', 'kid_mantle', 'invisible_cloak', 'nekketsu_jersey', 'silver_crystal']) assert.ok(ITEMS[id], `${id} の データ`);
  for (const w of W) {
    for (const dir of DIRS) {
      const img = paintHero(look, 'magician', `${w},cloth,,`, dir, 0, 8);
      checkImg(img, `${w} ${dir}`);
      assert.notEqual(key(img), key(paintHero(look, 'magician', 'oak_staff,cloth,,', dir, 0, 8)), `${w} ${dir} は ふつうの つえと ちがう`);
    }
  }
  assert.notEqual(key(paintHero(look, 'fullmetal', 'automail_arm,cloth,,', 'down', 0, 8)), key(paintHero(look, 'fullmetal', 'iron_claw,cloth,,', 'down', 0, 8)), '機械のうでは はがねの いろ');
  assert.equal(headOf('silk_hat', 'warrior', 'cloth', outfitOf({ cloth: '#fff' }, 'warrior', 'cloth', false)).kind, 'silk33');
  assert.ok(outfitOf({ cloth: '#fff', skin: 0 }, 'warrior', 'kid_mantle', false).r33?.drape, 'かいとうの白いマント');
  assert.ok(outfitOf({ cloth: '#fff', skin: 0 }, 'warrior', 'school_robe', false).r33?.tie, '魔法学校のローブ');
  assert.ok(outfitOf({ cloth: '#fff', skin: 0 }, 'warrior', 'invisible_cloak', false).cape, 'とうめいマント');
  for (const eq of [',school_robe,,silk_hat', ',kid_mantle,,', ',nekketsu_jersey,,', ',invisible_cloak,,']) for (const dir of DIRS) checkImg(paintHero(look, 'warrior', eq, dir, 0, 4), `${eq} ${dir}`);
});

// 家族が きめた こと: 男の子の 美少女戦士・セーラームーンは タキシード仮面ふう。女の子は 今の まま
test('第33回 男の子の 美少女戦士・セーラームーン: タキシード仮面ふう（えんび服・マント・シルクハット・仮面・バラ）、女の子は 今の まま', () => {
  const SENSHI = ['sailor_soldier', 'sailor_moon'];
  assert.deepEqual(Object.keys(R33_MASC), SENSHI);
  for (const job of JOBS11) assert.equal(masc33(job, true), null, `${job} 女性`);
  for (const job of JOBS11) assert.equal(!!masc33(job, false), SENSHI.includes(job), `${job} 男性`);
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  const O = (job, armor, fem) => outfitOf(Lk, job, armor, fem);
  const hat = (job, armor, fem, head = null) => headOf(head, job, armor, O(job, armor, fem))?.kind || null;
  for (const job of SENSHI) {
    // 男の子: 黒い えんび服・黒い 蝶ネクタイ・黒い マント（うらは 赤）・白い 手ぶくろ・シルクハット・仮面・バラ
    const M = O(job, 'cloth', false);
    assert.equal(M.kind, 'suit', `${job} 男性の 服`);
    assert.equal(M.spec.bow, '#141018', `${job} 黒い 蝶ネクタイ`);
    assert.ok(M.cape && M.r33.drape && M.glove, `${job} マントと 手ぶくろ`);
    assert.ok(!M.skirt && !M.r33.bow, `${job} スカートと セーラーの リボンは ない`);
    assert.equal(M.body.mask33, true, `${job} 仮面`);
    assert.equal(M.body.prop, 'rose33', `${job} バラ`);
    assert.ok(!M.body.hair && !M.body.hcol, `${job} 男の子は 自分の かみがた`);
    assert.equal(hat(job, 'cloth', false), 'silk33', `${job} シルクハット`);
    assert.equal(hat(job, null, false), 'silk33', `${job} よろい なしも シルクハット`);
    // よろいを きても 仮面と バラは のこり、ティアラは かぶらない
    const MA = O(job, 'iron_armor', false);
    assert.ok(MA.body.mask33 && MA.body.prop === 'rose33', `${job} よろいでも 仮面と バラ`);
    assert.equal(hat(job, 'iron_armor', false), null, `${job} よろいで ティアラは ない`);
    assert.equal(hat(job, 'iron_armor', false, 'iron_helm'), 'helmet', `${job} かぶと`);
    assert.equal(jobBody(job, false).mask33, true, `${job} jobBody(男性)`);
    // 女の子: 今の まま（セーラー服・ティアラ・からだの とくちょう）
    const F = O(job, 'cloth', true);
    assert.equal(F.kind, 'sailor', `${job} 女性の 服`);
    assert.deepEqual(F.spec, R33_OUTFIT[job], `${job} 女性の 服の 設定は もとの まま`);
    assert.equal(F.body, R33_BODY[job], `${job} 女性の からだは もとの まま`);
    assert.ok(F.skirt && F.r33.bow && !F.body.mask33, `${job} 女性の スカートと リボン`);
    assert.equal(hat(job, 'cloth', true), 'tiara33', `${job} 女性の ティアラ`);
    assert.equal(hat(job, 'iron_armor', true), 'tiara33', `${job} 女性は よろいでも ティアラ`);
    assert.equal(jobBody(job), R33_BODY[job], `${job} jobBody は もとの まま`);
  }
  // セーラームーンの おだんご・金の かみは 女の子だけ
  assert.equal(O('sailor_moon', 'cloth', true).body.hair, 'moon33');
  // 美少女戦士と セーラームーンの ちがい（マントの 長さ・うらの 赤・光る バラ・ぼうしの おび）
  const S = R33_MASC.sailor_soldier, Mo = R33_MASC.sailor_moon;
  assert.ok(S.outfit.capeLen < Mo.outfit.capeLen, '美少女戦士の マントは みじかめ');
  assert.notEqual(S.outfit.capeIn, Mo.outfit.capeIn, 'マントの うらの 赤');
  assert.ok(Mo.body.roseGlow33 && !S.body.roseGlow33, 'セーラームーンの バラは 光る');
  assert.notEqual(O('sailor_soldier', 'cloth', false).cape.inner, O('sailor_moon', 'cloth', false).cape.inner);
});

test('第33回 男の子の 美少女戦士・セーラームーン: 絵（フィールド・戦い・古い え）に 仮面と バラ、ティアラと おだんごは 出ない', () => {
  const boy = { body: 0, style: 'short', hcol: 'brown', tone: 'light' };
  const girl = { ...boy, body: 1 };
  const white = (r, g, b) => r === 255 && g === 255 && b === 255;
  const gold = (r, g, b) => r > 200 && g > 150 && b < 120 && r - b > 110;
  const red = (r, g, b) => r > 150 && g < 70 && b < 90;
  for (const job of ['sailor_soldier', 'sailor_moon']) {
    for (const res of [4, 8]) {
      for (const dir of DIRS) {
        const b = paintHero(boy, job, undefined, dir, 0, res), g = paintHero(girl, job, undefined, dir, 0, res);
        checkImg(b, `${job} 男性 ${dir} res${res}`);
        assert.notEqual(key(b), key(g), `${job} ${dir} res${res} 男女で ちがう`);
        assert.notEqual(key(b), key(paintHero(boy, 'magician', undefined, dir, 0, res)), `${job} ${dir} res${res} 手品師と ちがう`);
      }
      // まえむき: 目もとの 白い 仮面（ふつうの 人より 白が 多い）と 赤い バラ・マントの うら
      const b = paintHero(boy, job, undefined, 'down', 0, res);
      assert.ok(countPx(b, white) > countPx(paintHero(boy, 'warrior', undefined, 'down', 0, res), white) + (res >= 8 ? 30 : 8), `${job} res${res} 仮面`);
      assert.ok(countPx(b, red) > (res >= 8 ? 40 : 10), `${job} res${res} 赤い バラと マントの うら`);
      // よろいでも 仮面（戦士と ちがう・白が 多い）
      const ba = paintHero(boy, job, ',iron_armor,,', 'down', 0, res), wa = paintHero(boy, 'warrior', ',iron_armor,,', 'down', 0, res);
      assert.notEqual(key(ba), key(wa), `${job} res${res} よろいでも 仮面と バラ`);
    }
    // 男の子は 金の おだんごに ならない（えらんだ 茶色の かみ）。女の子の セーラームーンは 金の かみ
    assert.ok(countPx(paintHero(boy, job, undefined, 'up', 0, 8), gold) < 100, `${job} 男の子の かみ`);
  }
  assert.ok(countPx(paintHero(girl, 'sailor_moon', undefined, 'up', 0, 8), gold) > 600, '女の子の セーラームーンは 金の かみ');
  // 美少女戦士と セーラームーン（男の子）は ちがう え
  for (const dir of DIRS) assert.notEqual(key(paintHero(boy, 'sailor_soldier', undefined, dir, 0, 4)), key(paintHero(boy, 'sailor_moon', undefined, dir, 0, 4)), dir);
  // 古い 小さな え（chars.js）
  for (const job of ['sailor_soldier', 'sailor_moon']) {
    const ob = lookToOpts({ body: 0 }, job, ',cloth,,'), og = lookToOpts({ body: 1 }, job, ',cloth,,');
    assert.equal(ob.outfit, 'suit', `${job} 古い え 男性`);
    assert.equal(ob.hat, 'silk', `${job} 古い え シルクハット`);
    assert.ok(ob.mask && ob.rose && ob.cape, `${job} 古い え 仮面・バラ・マント`);
    assert.equal(og.outfit, 'dress', `${job} 古い え 女性`);
    assert.equal(og.hat, 'tiara', `${job} 古い え ティアラ`);
    assert.ok(!og.mask && !og.rose, `${job} 古い え 女性は 仮面なし`);
    const oa = lookToOpts({ body: 0 }, job, ',iron_armor,,');
    assert.ok(oa.mask && oa.rose && oa.hat !== 'tiara', `${job} 古い え よろいでも 仮面と バラ`);
    for (const dir of DIRS) {
      const hb = paintHuman(dir, 0, ob), hg = paintHuman(dir, 0, og);
      assert.ok(hb.px.some(Boolean), `${job} ${dir} 古い え`);
      assert.notEqual(hb.px.join(), hg.px.join(), `${job} ${dir} 古い え 男女`);
    }
  }
  assert.equal(lookToOpts({ body: 0 }, 'sailor_moon', ',cloth,,').rose, 'glow');
  assert.equal(lookToOpts({ body: 0 }, 'sailor_soldier', ',cloth,,').rose, 'plain');
});

test('第33回の 技の データ: 看板の技は <職業の id>_sig の えんしゅつ、ほかの 技も r33_ の えんしゅつに つながる', () => {
  for (const job of JOBS11) {
    const id = `${job}_sig`;
    assert.equal(ABILITIES[id]?.anim, id, `${id} の anim`);
    assert.ok(R33_ANIMS.has(id), id);
  }
  const used = new Set();
  for (const [id, a] of Object.entries(ABILITIES)) {
    if (!a.anim || !(R33_ANIMS.has(a.anim))) continue;
    used.add(a.anim);
    // みかたに かける 技は、みかたの えんしゅつ（がめんの 下に 出す）
    if (/^(ally|allies|self)$/.test(a.target)) assert.ok(PARTY_ANIMS7.has(a.anim), `${id} (${a.target}) の ${a.anim}`);
  }
  assert.ok(used.size >= 25, `つかわれて いる えんしゅつ ${used.size}`);
});

// ───────────── えんしゅつ ─────────────
function fakeCtx() {
  const log = { calls: 0, nan: [], text: [] };
  let ctx;
  const fn = (name) => (...args) => {
    log.calls++;
    if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) log.nan.push(name);
    if (name === 'fillText') log.text.push(args[0]);
    if (name === 'measureText') return { width: String(args[0]).length * 10 };
    if (name === 'createLinearGradient' || name === 'createRadialGradient') return { addColorStop: () => {} };
    return ctx;
  };
  ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : typeof k === 'string' ? fn(k) : undefined),
    set: (o, k, v) => { if (typeof v === 'number' && !Number.isFinite(v)) log.nan.push(String(k)); o[k] = v; return true; },
  });
  return { ctx, log };
}
function withFakeDocument(fn) {
  const sprite = fakeCtx();
  const had = 'document' in globalThis, prev = globalThis.document;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => sprite.ctx }) };
  try { return fn(); } finally { if (had) globalThis.document = prev; else delete globalThis.document; }
}
function runFx(fx, limit = 4000) {
  const { ctx, log } = fakeCtx();
  let t = 0;
  while (fx.parts.length && t < limit) {
    fx.update(16);
    t += 16;
    if (t % 48 === 0) fx.draw(ctx);
  }
  return { t, log };
}

test('第33回の えんしゅつ: ぜんぶ 単体・全体・みかた（がめんの 下）で 出て、2.2びょう いないに おわる（NaN なし）', () => {
  assert.equal(R33_ANIMS.size, R33_SIGS.length + R33_MOVES.length);
  assert.equal(R33_SIGS.length, 11);
  withFakeDocument(() => {
  for (const anim of R33_ANIMS) {
    assert.ok(anim.startsWith('r33_') || (anim.endsWith('_sig') && R33_JOBS.includes(anim.slice(0, -4))), anim);
    const runs = [
      [{ x: 128, y: 70 }],
      [{ x: 60, y: 70 }, { x: 128, y: 88 }, { x: 196, y: 70 }],
      [{ x: 228, y: 40 }],
      [{ x: BW / 2, y: BH * 0.62 }],
    ];
    for (const [i, ts] of runs.entries()) {
      const fx = new Effects();
      fx.play(anim, ts, null, { crit: i === 1, fromAlly: true, from: { x: 120, y: BH + 6 } });
      assert.ok(fx.parts.length > 0, `${anim} の つぶ`);
      for (const p of fx.parts) {
        if (typeof p.x !== 'number' || p.kind === 'flash' || p.kind === 'shake') continue;
        assert.ok(p.x > -80 && p.x < BW + 80 && p.y > -60 && p.y < BH + 60, `${anim} の つぶ ${p.kind} が とおい (${p.x},${p.y})`);
      }
      const { t, log } = runFx(fx);
      assert.ok(t <= 2200, `${anim} ${ts.length} が ながい ${t}ms`);
      assert.ok(log.calls > 60, `${anim} を かいた`);
      assert.deepEqual(log.nan, [], `${anim} の NaN`);
    }
  }
  });
});

test('第33回の えんしゅつ: あたる じかん（JOB7_HIT）に まとに 光が ある・みかたの えんしゅつ・ほかの ファイルと かさならない', () => {
  // こうげきの えんしゅつは あたる じかんの ころに まとで impact
  for (const [anim, hit] of Object.entries(JOB7_HIT)) {
    assert.ok(R33_ANIMS.has(anim), anim);
    assert.ok(hit >= 0 && hit <= 800, `${anim} ${hit}`);
    const fx = new Effects();
    const t0 = { x: 128, y: 70 };
    fx.play(anim, [t0], null, { fromAlly: true, from: { x: 120, y: BH + 6 } });
    const near = fx.parts.filter((p) => p.kind === 'impact' && Math.hypot(p.x - t0.x, p.y - t0.y) < 14).map((p) => p.delay || 0);
    assert.ok(near.some((d) => Math.abs(d - hit) <= 120), `${anim} の あたる じかん ${hit} と impact ${near}`);
  }
  // みかたに かける えんしゅつは HIT が ない（すぐ）
  for (const anim of PARTY_ANIMS7) assert.ok(R33_ANIMS.has(anim), anim);
  for (const anim of ['r33_glider', 'r33_broom', 'r33_hito_ji', 'r33_alchemy_wall', 'r33_sailor_guard', 'r33_moon_heal']) assert.ok(!(anim in JOB7_HIT), anim);
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const anim of R33_ANIMS) {
    assert.equal(playJob7Fx(fake, anim, [], null, {}), false, `${anim} まと なし`);
    for (const f of [playJobFx, playJob2Fx, playJob3Fx, playJob4Fx, playJob5Fx, playJob6Fx]) assert.equal(f(fake, anim, [{ x: 100, y: 60 }], null, {}), false, `${anim} が ほかの ファイルと かさなる`);
    assert.ok(!R27_ANIMS.has(anim), anim);
  }
  for (const anim of ['fire1', 'slash', 'rurouni_sig', 'kisatsu_sig', 'no_such_anim', 'warrior_sig', 'r33_no_such']) assert.equal(playJob7Fx(fake, anim, [{ x: 100, y: 60 }], null, {}), false, anim);
  // もじ（ゲームの 文字）
  const fx = new Effects();
  fx.play('sailor_moon_sig', [{ x: 128, y: 70 }], null, { fromAlly: true });
  const { log } = withFakeDocument(() => runFx(fx));
  assert.ok(log.text.includes('月にかわって、おしおきよ！'), 'セーラームーンの きめぜりふ');
});

test('第33回の えんしゅつ: 音・battle.js と battlefx.js の つなぎ・つぶの なまえ', () => {
  assert.deepEqual(Object.keys(JOB7_SFX).sort(), [...R33_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(JOB7_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const s of Object.keys(SFX_R33)) assert.ok(s.startsWith('r33_') && !audio.includes(`case '${s}':`), `新しい 音 ${s}`);
  assert.match(audio, /SFX_R33\[id\]\(this, T\)/);
  const calls = [];
  const a = { tone: (...x) => calls.push(['tone', ...x]), noise: (...x) => calls.push(['noise', ...x]) };
  for (const [s, f] of Object.entries(SFX_R33)) {
    calls.length = 0;
    f(a, a.tone);
    assert.ok(calls.length > 0, s);
    for (const c of calls) for (const v of c.slice(1)) if (typeof v === 'number') assert.ok(Number.isFinite(v), s);
  }
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /\.\.\.JOB7_SFX/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, JOB7_HIT\)/);
  assert.equal(battle.split('PARTY_ANIMS7.has(anim)').length - 1, 2, 'みかたの えんしゅつ（がめんの 下に 出す・R27 の えんしゅつを かさねない）');
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playJob7Fx\(this, anim/);
  assert.match(src, /JOB7_FINE/);
  const s0 = src.indexOf('const FINE = {');
  const fine = src.slice(s0, src.indexOf('\n};', s0));
  for (const k of Object.keys(JOB7_FINE)) {
    assert.ok(k.startsWith('j7'), k);
    for (const F of [JOB_FINE, JOB2_FINE, JOB3_FINE, JOB4_FINE, JOB5_FINE, JOB6_FINE, R27_FINE]) assert.ok(!(k in F), k);
    assert.ok(!new RegExp(`^  ${k}\\(`, 'm').test(fine), `${k} が battlefx.js の FINE と かさなる`);
  }
});

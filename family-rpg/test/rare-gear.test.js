// 第31回 C: レア度（★1〜★5）と レア装備（宝の洞窟・ボス・ふつうの 魔物・ひみつのダンジョン）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ITEMS, SLOTS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { RARE_GEAR, RARE_GEAR_KANA } from '../public/js/shared/data/items-rare.js';
import {
  rarityOf, traitText, rareIds, tmGearRank, pickTmGear, TM_WORD_GROUP, TM_THEME_GROUPS, tmGroupOf, bossRareOf, regionOf, regionRareList,
  sdGearRank, pickSdGear, SD_GEAR_FROM, REGION_RARE_N, BOSS_RARE_N, luckyShoesRate,
} from '../public/js/shared/data/rare-loot.js';
import { chestLoot, caveInfo, TM_THEMES, TM_LV_MAX, equipRankOf } from '../public/js/shared/data/treasure.js';
import { sdBigReward, sdSmallReward } from '../public/js/shared/data/secret.js';
import { SHOPS, STAR_TRADES, shopItems } from '../public/js/shared/data/shops.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { monsterDrops, rollDrops } from '../public/js/shared/data/loot.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, computeStats, fullHeal } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import { rareNameHtml, rareTextHtml, hasRareName } from '../public/js/client/ui/rarity.js';
import { rankText, itemDetail } from '../public/js/client/ui/info.js';

const EQUIPS = Object.entries(ITEMS).filter(([, it]) => SLOTS.includes(it.type) && !it.base);
const NEW = Object.keys(RARE_GEAR);

test('レア度: どの 装備にも 0〜5。店の 品は 0・★の 品は 2〜3・ボスの 品は 3・きたえた 装備は もとと おなじ', () => {
  for (const [id, it] of EQUIPS) {
    const r = rarityOf(id);
    assert.ok(Number.isInteger(r) && r >= 0 && r <= 5, id);
    if (it.price > 0) assert.equal(r, 0, `${id}: 店の 品は ★なし`);
    else assert.ok(r >= 1, `${id}: 店で 買えない 品は ★1から`);
    if (it.star && !it.src) assert.ok(r === 2 || r === 3, `${id}: ★の 品`);
    if (it.unique) assert.equal(r, 3, `${id}: ボスの 品`);
  }
  assert.equal(rarityOf('iron_sword'), 0);
  assert.equal(rarityOf('stardust_sword'), 2);
  assert.equal(rarityOf('kusanagi+2'), rarityOf('kusanagi'));
  assert.equal(rarityOf('herb'), 0);
  assert.equal(rankText('kusanagi'), 'ランク8　★★★★');
  assert.equal(rankText('iron_sword'), 'ランク3');
});

test('レア装備: 約100こ。名前は かぶらず、読みがな・説明・手に入る 所が ある。★5は ひみつのダンジョンだけ', () => {
  assert.ok(NEW.length >= 95 && NEW.length <= 120, `${NEW.length}こ`);
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.base) continue;
    assert.ok(!names.has(it.name), `名前が かぶる: ${it.name}（${id}・${names.get(it.name)}）`);
    names.set(it.name, id);
  }
  for (const id of NEW) {
    const it = ITEMS[id];
    assert.ok(it === RARE_GEAR[id], `${id} が ほかの 品で うわがき されていない`);
    assert.ok(['tm', 'boss', 'region', 'sd'].includes(it.src), id);
    assert.ok(it.rarity >= 2 && it.rarity <= 5, id);
    assert.ok(it.desc && RARE_GEAR_KANA[id] && ITEM_KANA[id], id);
    assert.ok(!(it.price > 0) && it.sell > 0, id);
    if (it.rarity === 5) assert.equal(it.src, 'sd', `${id}: ★5 は ひみつのダンジョンだけ`);
    if (it.src === 'sd') assert.ok(it.rarity >= 4, `${id}: ひみつのダンジョンは ★4〜★5`);
    if (it.type === 'weapon') assert.ok(Object.keys(MONSTERS).length && ['sword', 'axe', 'dagger', 'spear', 'claw', 'whip', 'staff', 'fan', 'boomerang', 'bat'].includes(it.cat), `${id}: 今 ある 武器の 種類`);
  }
  // ★5 は 今の いちばん 強い 装備（ランク8★）より 上
  const best = (pred, k) => Math.max(...EQUIPS.filter(([id, it]) => !it.src && pred(it)).map(([, it]) => it[k] || 0));
  assert.ok(ITEMS.heaven_earth_sword.atk > best((it) => it.type === 'weapon', 'atk'));
  assert.ok(ITEMS.god_dragon_mail.def > best((it) => it.type === 'armor', 'def'));
  assert.ok(ITEMS.yata_mirror.def > best((it) => it.type === 'shield', 'def'));
});

test('レア度の 色: ★1 緑〜★5 金と にじ。くらい まどの 上で 読みやすい（コントラスト 7 いじょう）', () => {
  const css = readFileSync(new URL('../public/css/style.css', import.meta.url), 'utf8');
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const bg = lum('#04061a');
  for (let r = 1; r <= 5; r++) {
    const m = new RegExp(`\\.rar\\.r${r}\\s*\\{[^}]*?color:\\s*(#[0-9a-f]{6})`, 'i').exec(css);
    assert.ok(m, `★${r} の 色`);
    const ratio = (lum(m[1]) + 0.05) / (bg + 0.05);
    assert.ok(ratio >= 7, `★${r} ${m[1]} コントラスト ${ratio.toFixed(1)}`);
  }
  assert.match(css, /\.rar\.r5\s*\{[^}]*linear-gradient/, '★5 は にじ色');
  // 名前の HTML（メニュー・装備・店で 売る）
  assert.equal(rareNameHtml('iron_sword'), '鉄の剣');
  assert.equal(rareNameHtml('kusanagi'), '<span class="rar r4">草なぎの剣<span class="rs">★★★★</span></span>');
  assert.match(rareNameHtml('heaven_earth_sword'), /class="rar r5"/);
  assert.match(rareNameHtml('wind_clothes'), /class="rar r2"/);
  // 文の 中（宝箱を 開けた・戦いの けっか）
  const t = rareTextHtml('ママは宝箱を開けた！\n草なぎの剣+2を手に入れた！');
  assert.ok(t.includes('<span class="rar r4">草なぎの剣+2<span class="rs">★★★★</span></span>'), t);
  assert.ok(hasRareName('まぼろしの剣を持っていた！'));
  assert.ok(!hasRareName('鉄の剣を手に入れた！'));
  assert.equal(rareTextHtml('<b>'), '&lt;b&gt;');
  // 説明に とくせい
  assert.match(itemDetail('philosopher_stone'), /行動するたびにMP\+3/);
  assert.match(traitText('kagutsuchi'), /炎に強い/);
  assert.match(traitText('shadow_knife'), /会心が出やすい（\+8%）/);
});

test('店: レア装備は 売らない（★なし だけ）', () => {
  for (const id of Object.keys(SHOPS)) {
    for (const it of shopItems(SHOPS[id], () => true)) assert.equal(rarityOf(it), 0, `${id}: ${it}`);
  }
  for (const t of STAR_TRADES) assert.ok(!ITEMS[t.item]?.src, t.item);
});

test('宝の洞窟: 地図の 名前に ちなんだ 装備が 出る（大地・岩・まぼろし・ねむり・ひみつ・古代・氷・炎）', () => {
  const rng = makeRng(31);
  for (const [theme, th] of Object.entries(TM_THEMES)) {
    for (const word of th.words) {
      const grp = tmGroupOf(theme, word);
      if (theme === 'earth') assert.equal(grp, TM_WORD_GROUP[word], word);
      let n = 0, same = 0;
      for (let i = 0; i < 300; i++) {
        const lv = 1 + (i % TM_LV_MAX);
        const id = pickTmGear(rng, lv, { theme, word }, i % 2 ? 'bossA' : 'normal');
        const it = ITEMS[id];
        assert.equal(it.src, 'tm', id);
        assert.ok(TM_THEME_GROUPS[theme].includes(it.grp), `${word}の洞窟: ${it.name}`);
        n++;
        if (it.grp === grp) same++;
      }
      assert.ok(same / n >= 0.8, `${word}: ことばの なかまが ${same}/${n}`);
    }
  }
  // 宝箱の 中みにも（caveInfo の ことばで）
  let rare = 0;
  for (let s = 1; s <= 400; s++) {
    const info = caveInfo(s * 7919, 10);
    const r = chestLoot(makeRng(s), 10, 'bossA', info);
    const it = ITEMS[r.item];
    if (it?.src !== 'tm') continue;
    rare++;
    assert.ok(TM_THEME_GROUPS[info.theme].includes(it.grp), `${info.caveName}: ${it.name}`);
  }
  assert.ok(rare > 250, `主の 宝箱は レアが 出やすい（${rare}/400）`);
});

test('宝の洞窟: 地図の レベルが 高いほど 強い（ランクと レア度）。第5章の 地図 Lv10〜12 は 店（ランク7）と おなじ〜1つ上', () => {
  const stat = (lv, kind) => {
    const rng = makeRng(lv * 101 + (kind === 'bossA' ? 7 : 0));
    let rank = 0, rar = 0, n = 0, max = 0;
    for (let i = 0; i < 1500; i++) {
      const r = chestLoot(rng, lv, kind, caveInfo(rng.int(0, 1e9), lv));
      const it = ITEMS[r.item];
      if (!it?.rank) continue;
      if (it.src) assert.ok(it.rank <= tmGearRank(lv), `${it.name} ランク${it.rank}（Lv${lv}）`);
      else assert.ok(it.rank <= equipRankOf(lv) && rarityOf(r.item) === 0, `${it.name}（Lv${lv}）`);
      if (!it.src) continue;
      rank += it.rank;
      rar += it.rarity;
      max = Math.max(max, it.rank);
      n++;
    }
    return { rank: rank / n, rar: rar / n, max, n };
  };
  let prev = null;
  for (const lv of [1, 4, 8, 12]) {
    const s = stat(lv, 'bossA');
    if (prev) assert.ok(s.rank > prev.rank && s.rar >= prev.rar - 0.05, `Lv${lv}: ランク ${s.rank.toFixed(2)} レア ${s.rar.toFixed(2)}`);
    prev = s;
  }
  assert.deepEqual([1, 4, 6, 8, 10, 12].map(tmGearRank), [2, 4, 5, 6, 7, 8]);
  const top = stat(12, 'bossA');
  assert.equal(top.max, 8);
  assert.ok(top.rar > 3, `Lv12 の 主の 宝箱は ★3〜★4（${top.rar.toFixed(2)}）`);
  const normal = stat(12, 'normal');
  assert.ok(normal.rar < top.rar, '主の 宝箱は ふつうの 宝箱より レア');
});

test('宝の洞窟: こうふくの靴は ある ときだけ・主の 宝箱で まれに（★4）', () => {
  const had = ITEMS.koufuku_kutsu;
  try {
    delete ITEMS.koufuku_kutsu;
    assert.equal(luckyShoesRate(12, 'bossA'), 0);
    for (let i = 0; i < 2000; i++) assert.notEqual(chestLoot(makeRng(i), 12, 'bossA', { theme: 'earth', word: '大地' }).item, 'koufuku_kutsu');
    ITEMS.koufuku_kutsu = had || { name: 'こうふくの靴', type: 'acc', rank: 6, price: 0, sell: 500, desc: 'テスト' };
    assert.equal(rarityOf('koufuku_kutsu'), had?.rarity ?? 4);
    let got = 0;
    for (let i = 0; i < 4000; i++) if (chestLoot(makeRng(i), 12, 'bossA', { theme: 'earth', word: '大地' }).item === 'koufuku_kutsu') got++;
    const p = got / 4000;
    assert.ok(p > 0.04 && p < 0.12, `主の 宝箱 ${(p * 100).toFixed(1)}%`);
    assert.equal(luckyShoesRate(3, 'bossA'), 0, '低い 地図では 出ない');
  } finally {
    if (had) ITEMS.koufuku_kutsu = had;
    else delete ITEMS.koufuku_kutsu;
  }
});

test('ひみつのダンジョン: 専用の ★4〜★5 は ここだけ。深いほど 強く、5階ごとの ごほうびにも 入る', () => {
  const SD = new Set(rareIds('sd'));
  assert.ok(SD.size >= 15);
  // ほかでは 出ない（宝の洞窟・魔物・ボス・店）
  const rng = makeRng(5);
  for (let i = 0; i < 6000; i++) {
    const lv = 1 + (i % TM_LV_MAX);
    const r = chestLoot(rng, lv, ['normal', 'bossA', 'bossB'][i % 3], caveInfo(i * 31, lv));
    assert.ok(!SD.has(r.item), r.item);
  }
  for (const sp of Object.keys(MONSTERS)) {
    for (const d of monsterDrops(sp)) assert.ok(!SD.has(d.item), `${sp}: ${d.item}`);
    for (const id of regionRareList(sp)) assert.ok(!SD.has(id), `${sp}: ${id}`);
    for (let i = 0; i < 30; i++) for (const id of rollDrops(sp, rng)) assert.ok(!SD.has(id), `${sp}: ${id}`);
    for (let i = 0; i < 5; i++) for (const id of rollDrops(sp, rng, { map: 'overworld' })) assert.ok(!SD.has(id), `${sp}: ${id}`);
  }
  // 浅い 階には 出ない・20階からの 休み所の 大きな ごほうびに 1つ
  for (let f = 5; f < SD_GEAR_FROM; f += 5) for (const e of sdBigReward(f)) assert.ok(!SD.has(e.item), `${f}階`);
  let prevRank = 0;
  for (let f = SD_GEAR_FROM; f <= 100; f += 5) {
    const got = sdBigReward(f).filter((e) => SD.has(e.item));
    assert.equal(got.length, 1, `${f}階`);
    const it = ITEMS[got[0].item];
    assert.ok(it.rank >= sdGearRank(f) - 1 && it.rank <= sdGearRank(f), `${f}階: ${it.name}`);
    assert.ok(it.rank >= prevRank - 1, `${f}階: 深いほど 強い`);
    prevRank = Math.max(prevRank, it.rank);
    if (f >= 60) assert.equal(it.rarity, 5, `${f}階は ★5`);
  }
  assert.deepEqual([19, 20, 30, 40, 50, 60, 70, 99].map(sdGearRank), [0, 5, 6, 7, 8, 9, 10, 10]);
  assert.equal(pickSdGear(rng, 10), null);
  // 2回目からの 小さな ごほうび（30階から まれに）
  let small = 0;
  for (let i = 0; i < 3000; i++) if (SD.has(sdSmallReward(40, rng).item)) small++;
  assert.ok(small > 50 && small < 400, `小さな ごほうび ${small}/3000`);
  for (let i = 0; i < 500; i++) assert.ok(!SD.has(sdSmallReward(25, rng).item));
  // ダンジョンの 中の 魔物（番人は 3回に 1回）
  let guard = 0, mob = 0;
  for (let i = 0; i < 3000; i++) {
    if (rollDrops('tm_golem', rng, { map: 'sd_40' }).some((id) => SD.has(id))) guard++;
    if (rollDrops('wolf', rng, { map: 'sd_40' }).some((id) => SD.has(id))) mob++;
  }
  assert.ok(guard > 800 && guard < 1200, `番人 ${guard}/3000`);
  assert.ok(mob > 5 && mob < 50, `ふつうの 魔物 ${mob}/3000`);
  for (let i = 0; i < 2000; i++) assert.ok(!rollDrops('wolf', rng, { map: 'sd_12' }).some((id) => SD.has(id)), '20階より 上では 出ない');
});

test('ボスの ドロップ: 物語の ボスに ちなんだ 装備を ときどき（図鑑にも「ときどき」）', () => {
  const STORY = ['dark_treant', 'goldoon', 'giant_squid', 'storm_general', 'blizzard_mammoth', 'magma_golem', 'flame_knight', 'trial_guardian',
    'flame_witch', 'flame_witch_true', 'armor_scorpion', 'mummy_king', 'zaid_minister', 'zaid_demon', 'sand_whale', 'morgana', 'morgana_true', 'old_dragon', 'argos'];
  for (const sp of STORY) {
    const id = bossRareOf(sp);
    assert.ok(id && ITEMS[id].src === 'boss', sp);
    assert.ok(monsterDrops(sp).some((d) => d.kind === 'brare' && d.item === id && d.n === BOSS_RARE_N), sp);
  }
  const rng = makeRng(8);
  let got = 0;
  const N = 8000;
  for (let i = 0; i < N; i++) {
    const d = rollDrops('argos', rng);
    assert.equal(d[0], 'argos_pendant');
    if (d.includes('hundred_eye_helm')) got++;
  }
  assert.ok(Math.abs(got / N - 1 / BOSS_RARE_N) < 0.03, `${got}/${N}`);
});

test('ふつうの 魔物: その 地方の レア装備を まれに', () => {
  assert.equal(regionOf('wolf'), 1);
  assert.equal(regionOf('ghost_pirate'), 2);
  assert.equal(regionOf('yeti'), 3);
  assert.equal(regionOf('sand_shark'), 4);
  assert.equal(regionOf('comet_bird'), 5);
  assert.equal(regionOf('goldoon'), 0, 'ボスは のぞく');
  for (let r = 1; r <= 5; r++) assert.ok(rareIds('region').filter((id) => ITEMS[id].region === r).length >= 3, `地方${r}`);
  const rng = makeRng(9);
  let got = 0;
  const N = 60000;
  const list = new Set(regionRareList('yeti'));
  for (let i = 0; i < N; i++) {
    const d = rollDrops('yeti', rng);
    assert.ok(d.length <= 1);
    if (d.some((id) => list.has(id))) got++;
    for (const id of d) if (ITEMS[id].src === 'region') assert.equal(ITEMS[id].region, 3);
  }
  assert.ok(Math.abs(got / N - 1 / REGION_RARE_N) < 0.002, `${got}/${N}`);
});

test('とくせい: 会心（crit）と 行動ごとの MP回復（mpRegen）', () => {
  const c = newCharacter({ id: 'a', name: 'ソラ', look: {}, job: 'warrior' });
  c.level = 40;
  c.equip = { ...c.equip, weapon: 'shadow_knife', acc: 'philosopher_stone' };
  const st = computeStats(c);
  assert.ok(Math.abs(st.crit - 0.08) < 1e-9);
  assert.equal(st.mpRegen, 3);
  fullHeal(c);
  c.mp = 0;
  const b = new Battle({ rng: makeRng(3), allies: [{ char: c, auto: true, kind: 'support' }], enemies: ['goldoon'], canFlee: false });
  b.enemies[0].atk = 0;
  b.enemies[0].actions = [{ w: 1, id: 'm_nothing' }];
  const me = b.allies[0];
  assert.equal(me.mpRegen, 3);
  assert.ok(me.crit > 0);
  let acted = false;
  for (let t = 0; t < 20000 && !acted; t += 50) acted = b.tick(50).some((e) => e.t === 'act' && e.id === me.id);
  assert.ok(acted);
  assert.equal(me.mp, 3, '行動したら MPが 3 回復');
});

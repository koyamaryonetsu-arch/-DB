// 美容室・みため（かみがた・かみの色・目もと・はだの色）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { openService, serviceAction } from '../public/js/shared/world/services.js';
import { partyOf, syncParty } from '../public/js/shared/world/party.js';
import { MAPS, BOARD_NAMES } from '../public/js/shared/maps/index.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import {
  HAIR_STYLES, HAIR_COLORS, SKIN_TONES, FACES, CLOTH_COLORS, SALON_FEE,
  LEGACY_STYLES, LEGACY_HAIR_COLORS, LEGACY_TONES, lookIds, cleanLook, salonLook,
} from '../public/js/shared/data/looks.js';
import { newCharacter } from '../public/js/shared/stats.js';
import { Bot } from './helpers.js';

async function visitor(gold = 100, name = 'ミオ', world = new GameWorld({ offline: true, rng: makeRng(7), rateLimit: false })) {
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.gold = gold;
  const act = (look) => {
    serviceAction(world, bot.s, { kind: 'salon', look });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  return { world, bot, c, act };
}

test('みため: かみがた・かみの色は 12 いじょう。ID は かさならない', () => {
  assert.ok(HAIR_STYLES.length >= 12, `かみがた ${HAIR_STYLES.length}`);
  assert.ok(HAIR_COLORS.length >= 12, `かみの色 ${HAIR_COLORS.length}`);
  for (const list of [HAIR_STYLES, HAIR_COLORS, SKIN_TONES, FACES]) {
    const ids = list.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const x of list) assert.ok(x.name && typeof x.legacy !== 'string', x.id);
  }
  for (const x of [...HAIR_COLORS, ...SKIN_TONES]) assert.match(x.hex, /^#[0-9a-f]{6}$/, x.id);
});

test('みため: むかしの セーブの look は 同じ みために なり、むかしの 項目も のこる', () => {
  for (let body = 0; body < 2; body++) for (let hair = 0; hair < 4; hair++) for (let hairColor = 0; hairColor < 8; hairColor++) for (let skin = 0; skin < 3; skin++) {
    const old = { body, hair, hairColor, skin, color: (hair + hairColor) % CLOTH_COLORS.length };
    const ids = lookIds(old);
    assert.equal(ids.style, LEGACY_STYLES[hair]);
    assert.equal(ids.hcol, LEGACY_HAIR_COLORS[hairColor]);
    assert.equal(ids.tone, LEGACY_TONES[skin]);
    assert.equal(ids.face, 'std');
    assert.equal(ids.body, body);
    assert.deepEqual(cleanLook(old), old, '古い look は そのまま');
    // 新しい ID を つけても むかしの 番号は かわらない（古い クライアントにも 同じに 見える）
    const both = cleanLook({ ...old, ...ids });
    assert.deepEqual({ body: both.body, hair: both.hair, hairColor: both.hairColor, skin: both.skin, color: both.color }, old);
  }
  assert.deepEqual(lookIds(undefined), lookIds({ body: 0, hair: 0, hairColor: 0, skin: 0, color: 0 }));
});

test('みため: おかしな 値は つかわない', () => {
  const l = cleanLook({ body: 7, hair: 99, hairColor: -5, skin: 'x', color: 1e9, style: 'evil', hcol: '<b>', tone: {}, face: 3, extra: 'no' });
  assert.deepEqual(l, { body: 1, hair: 3, hairColor: 0, skin: 0, color: CLOTH_COLORS.length - 1 });
  // 新しい ID は むかしの 番号も ととのえる
  const n = cleanLook({ body: 1, style: 'afro', hcol: 'mint', tone: 'deep', face: 'smile', color: 2 });
  assert.equal(n.style, 'afro');
  assert.equal(n.hcol, 'mint');
  assert.equal(n.tone, 'deep');
  assert.equal(n.face, 'smile');
  assert.equal(n.hair, HAIR_STYLES.find((x) => x.id === 'afro').legacy);
  assert.equal(n.hairColor, HAIR_COLORS.find((x) => x.id === 'mint').legacy);
  assert.equal(n.skin, SKIN_TONES.find((x) => x.id === 'deep').legacy);
  // キャラ作りでも 同じ
  const c = newCharacter({ id: 'x', name: 'テスト', job: 'warrior', look: { body: 1, style: 'braid', hcol: 'lavender', face: 'calm', tone: 'fair', color: 6, hack: 1 } });
  assert.deepEqual(lookIds(c.look), { body: 1, style: 'braid', hcol: 'lavender', tone: 'fair', face: 'calm', color: 6 });
  assert.equal(c.look.hack, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(c.look)), c.look, 'セーブしても かわらない');
});

test('美容室: えらべる ものだけ。変わらない ときは changed=false', () => {
  const cur = { body: 0, hair: 2, hairColor: 3, skin: 1, color: 4 };
  assert.equal(salonLook(cur, { style: 'nope' }).ok, false);
  assert.equal(salonLook(cur, { hcol: 12 }).ok, false);
  assert.equal(salonLook(cur, {}).changed, false);
  assert.equal(salonLook(cur, { style: 'spiky', hcol: 'red' }).changed, false, 'いまと 同じ');
  const r = salonLook(cur, { style: 'twin', hcol: 'aqua', face: 'brave' });
  assert.equal(r.ok, true);
  assert.equal(r.changed, true);
  assert.deepEqual(lookIds(r.look), { body: 0, style: 'twin', hcol: 'aqua', tone: 'tan', face: 'brave', color: 4 });
});

test('美容室: ルミナの町に 美容師と かんばんが ある', () => {
  const map = MAPS.overworld; // ルミナの町は 大地の マップの 中
  const npc = map.npcs.find((n) => n.script === 'salon');
  assert.ok(npc, '美容師が いる');
  assert.equal(map.areaName(npc.x, npc.y), 'ルミナの町');
  assert.deepEqual(SCRIPTS.salon?.({}), [['salon']]);
  assert.equal(BOARD_NAMES.salon, '美容室');
  const board = map.boards.find((b) => b.kind === 'salon');
  assert.ok(board && Math.abs(board.x - npc.x) <= 3 && Math.abs(board.y - npc.y) <= 3, 'かんばんは 店の 前');
});

test('美容室: 代金を はらって かみがたを 変える。体・服の色は 変わらない', async () => {
  const { world, bot, c, act } = await visitor(100);
  const before = { ...c.look };
  // 店に 入らずに 変えようと しても だめ
  let r = act({ style: 'afro' });
  assert.equal(r.ok, false);
  assert.equal(c.gold, 100);
  const info = openService(world, bot.s, 'salon');
  assert.equal(info.fee, SALON_FEE);
  assert.ok(info.keeper);
  r = act({ style: 'afro', hcol: 'pink', body: 1 - before.body, color: (before.color + 1) % 8 });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.gold, 100 - SALON_FEE);
  assert.equal(c.look.style, 'afro');
  assert.equal(c.look.hcol, 'pink');
  assert.equal(c.look.body, before.body, '体は 変わらない');
  assert.equal(c.look.color, before.color, '服の色は 変わらない');
  assert.deepEqual(r.look, c.look);
  assert.deepEqual(bot.char.look, c.look, '自分にも とどく');
  // 同じ ままなら お金は いらない
  r = act({ style: 'afro', hcol: 'pink' });
  assert.equal(r.ok, false);
  assert.equal(c.gold, 100 - SALON_FEE);
  // 知らない ID
  r = act({ style: 'super_saiyan' });
  assert.equal(r.ok, false);
  assert.equal(c.look.style, 'afro');
  // セーブして 読みなおしても のこる
  const saved = JSON.parse(JSON.stringify(world.data.characters[c.id]));
  assert.deepEqual(lookIds(saved.look), lookIds(c.look));
});

test('美容室: ゴールドが 足りないと 変えられない', async () => {
  const { world, bot, c, act } = await visitor(SALON_FEE - 1);
  openService(world, bot.s, 'salon');
  const before = JSON.stringify(c.look);
  const r = act({ hcol: 'green' });
  assert.equal(r.ok, false);
  assert.match(r.text, /ゴールド/);
  assert.equal(c.gold, SALON_FEE - 1);
  assert.equal(JSON.stringify(c.look), before);
});

test('美容室: 家族の サポート仲間の うつしも 新しい すがたに なる', async () => {
  const a = await visitor(100, 'ソラ');
  const b = await visitor(100, 'ミオ', a.world);
  const p = partyOf(b.world, b.bot.s);
  assert.ok(p, 'パーティーが ある');
  b.c.partyKeys = [`fam:${a.c.id}`];
  syncParty(b.world, p);
  const fam = p.supports.find((x) => x.kind === 'family');
  assert.ok(fam, '家族が サポートに いる');
  openService(a.world, a.bot.s, 'salon');
  const r = a.act({ style: 'wild', hcol: 'silver' });
  assert.equal(r.ok, true, r.text);
  assert.equal(lookIds(fam.char.look).style, 'wild');
  assert.equal(lookIds(fam.char.look).hcol, 'silver');
});

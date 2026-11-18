// テスト用: 引っこしコードを はかる ための セーブ（第78回）
//   biggestChar() … 今 考えられる いちばん 大きな セーブ（データから 自動で 作る。魔物・技・道具・マップを 足すと 大きく なる）
//   typicalChar() … ふつうに 遊んでいる とちゅうの セーブ（第4章くらい）
// どちらも 同じ たねなら 同じ 中み（数は たねつきの ふりこ）
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES, ELEMENT_ORDER } from '../public/js/shared/data/abilities.js';
import { ALL_JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { ROSTER_MAX } from '../public/js/shared/data/companions.js';
import { BANK_KINDS } from '../public/js/shared/data/facilities.js';
import { PHANTOM_TAGS } from '../public/js/shared/data/phantom.js';
import { STORAGE_MAX, recruitNpc, addMonsterEntry, noteSeen } from '../public/js/shared/world/party.js';
import { gainExp, expForLevel, addItem, learnedAbilities, MAX_LEVEL } from '../public/js/shared/stats.js';
import { toFeats } from '../public/js/shared/world/phantom.js';
import { Bot } from './helpers.js';

const pick = (rng, a) => a[Math.floor(rng() * a.length)];
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
// 遊びの 数は 小さい 物が 多く、大きい 物は 少し（lo〜hi の 対数で 平ら）
const logInt = (rng, lo, hi) => Math.floor(Math.exp(Math.log(lo) + rng() * (Math.log(hi + 1) - Math.log(lo))));
const shuffle = (rng, a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

// きりの マップ（ほんとうの 遊びと 同じ 形: 歩いた まわりが まるく 見える。field.js の reveal・exploredB64）
export function walkExplored(map, rng, cover) {
  const n = Math.ceil((map.w * map.h) / 8);
  const bits = new Uint8Array(n);
  const R = map.kind === 'dungeon' ? 5 : 8;
  const open = [];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (!isBlocked(map, x, y, () => true)) open.push([x, y]);
  if (!open.length) return '';
  let seen = 0;
  const want = Math.floor(open.length * cover);
  const reveal = (cx, cy) => {
    for (let y = cy - R; y <= cy + R; y++) {
      for (let x = cx - R; x <= cx + R; x++) {
        if (x < 0 || y < 0 || x >= map.w || y >= map.h || (x - cx) ** 2 + (y - cy) ** 2 > R * R) continue;
        const i = y * map.w + x;
        if (!(bits[i >> 3] & (1 << (i & 7)))) {
          bits[i >> 3] |= 1 << (i & 7);
          seen++;
        }
      }
    }
  };
  let [x, y] = pick(rng, open);
  for (let leg = 0; leg < 400 && seen < want; leg++) {
    // つぎの 行き先へ まっすぐ 歩く（かべは とおりぬけない。ぶつかったら そこで おわり）
    const [tx, ty] = pick(rng, open);
    for (let step = 0; step < 400 && (x !== tx || y !== ty) && seen < want; step++) {
      const nx = x + Math.sign(tx - x) * (Math.abs(tx - x) >= Math.abs(ty - y) ? 1 : 0);
      const ny = y + Math.sign(ty - y) * (Math.abs(tx - x) >= Math.abs(ty - y) ? 0 : 1);
      if (isBlocked(map, nx, ny, () => true) && !(nx === tx && ny === ty)) break;
      x = nx;
      y = ny;
      reveal(x, y);
    }
  }
  let s = '';
  for (let i = 0; i < bits.length; i++) s += String.fromCharCode(bits[i]);
  return btoa(s);
}

// データの 中の フラグの 名前（物語・クエスト・マップの しかけ）
function allFlags() {
  const out = new Set(STORY_STEPS);
  for (const m of Object.values(MAPS)) {
    const txt = JSON.stringify([m.npcs, m.triggers, m.chests, m.actions, m.warps, m.gates]);
    for (const [, f] of txt.matchAll(/"(?:flag|setFlag|needFlag|ifFlag|unless|show|hide|until)":"([a-z][a-z0-9_]{2,40})"/g)) out.add(f);
    for (const [, f] of txt.matchAll(/\["(?:flag|setFlag|unflag)","([a-z][a-z0-9_]{2,40})"/g)) out.add(f);
  }
  return [...out];
}

async function start(seed) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  return { world, bot, c: world.data.characters[bot.char.id] };
}

// 第88回 T2班: ふつう（第4章くらい）の 人が 行った マップ・立てた フラグ・あけた 宝箱・たおした 魔物の 数は、決まった 数に する
//   （前は ゲーム 全体の 数の「何わり」だった ため、後半の 部屋・フラグが ふえる たびに 第4章の 人の セーブが 太って 見えた）。
//   数は、見はりが さいごに 通った 609ed6a90 での 何わり（マップ 307×0.35・フラグ 391×0.45・宝箱 590×0.4・魔物 333×0.4）の 値
const TYPICAL = { maps: 107, flags: 175, chests: 236, monsters: 133 };

// size: 'big'（いちばん 大きい）・'typical'（ふつう）
async function build(size, seed) {
  const big = size === 'big';
  const { world, bot, c } = await start(seed);
  const R = makeRng(seed * 7 + 1).next;
  const monsters = Object.keys(MONSTERS);
  const abil = Object.keys(ABILITIES).filter((k) => !k.startsWith('m_') && !k.startsWith('zz_'));
  // 第88回: ふつう（第4章くらい）は 作品の 品（work の ある 品・src 'r88'。ガチャ 1回 2万G・ライバルは Lv60 から）を えらばない
  //   （作品が ふえるほど 乱数の えらび方が ゆれて、第4章の 人が 持てない 品が まざる ため）。いちばん 大きい 時は 全部から
  //   G16班: 前から ある 品に 作品を つけた 物（r88Tag。クナイ・進化の 石 など）は 第4章の 人も 持てるので、えらんで よい
  const workItem = (k) => !!((ITEMS[k].work && !ITEMS[k].r88Tag) || ITEMS[k].src === 'r88' || (ITEMS[ITEMS[k].base]?.work && !ITEMS[ITEMS[k].base]?.r88Tag));
  const items = Object.keys(ITEMS).filter((k) => ITEMS[k].type !== 'key' && (big || !workItem(k)));
  const keys = Object.keys(ITEMS).filter((k) => ITEMS[k].type === 'key');
  const maps = Object.values(MAPS);

  gainExp(c, expForLevel(big ? MAX_LEVEL : 38) - c.exp);
  c.gold = big ? 9999999 : 48210;
  // 職業・技（いちばん 大きい 時は 全部の 職業を きわめて、覚えた 技 全部・ひらめき 全部を 使った）
  for (const j of big ? ALL_JOBS : ALL_JOBS.slice(0, 12)) c.jobs[j] = { lv: big ? JOB_MAX_LEVEL : int(R, 1, JOB_MAX_LEVEL), b: logInt(R, 1, big ? 9999 : 300) };
  c.hirameki = big ? Object.keys(HIRAMEKI).filter((id) => ABILITIES[id]) : shuffle(R, Object.keys(HIRAMEKI)).slice(0, 12);
  const used = big ? learnedAbilities(c) : shuffle(R, learnedAbilities(c)).slice(0, 90);
  for (const a of used) c.skillUse[a] = logInt(R, 1, big ? 9999 : 500);
  c.favorites = shuffle(R, used).slice(0, big ? 60 : 10);
  // 道具
  // 使う 道具・素材は 全部、そうびは もとの 物 300・きたえた 物 100（いちばん 大きい 時）
  const useIt = items.filter((k) => ['use', 'mat'].includes(ITEMS[k].type));
  const baseGear = items.filter((k) => !useIt.includes(k) && !k.includes('+'));
  const forged = items.filter((k) => k.includes('+'));
  const bag = big ? [...useIt, ...shuffle(R, baseGear).slice(0, 300), ...shuffle(R, forged).slice(0, 100)] : [...useIt.slice(0, 30), ...shuffle(R, baseGear).slice(0, 30)];
  for (const id of shuffle(R, bag)) addItem(c, id, int(R, 1, 99));
  for (const id of big ? keys : keys.slice(0, 30)) addItem(c, id, 1);
  c.bank = { gold: big ? 9999999 : 5000, items: shuffle(R, items).slice(0, big ? BANK_KINDS : 10).map((id) => ({ id, n: int(R, 1, 99) })) };
  // フラグ・宝箱・きらきら
  const flags = allFlags();
  for (const f of big ? flags : flags.slice(0, Math.min(flags.length, TYPICAL.flags))) c.flags[f] = true;
  c.flags.monster_bond = true;
  c.flags.zz_count = 3;
  const chests = maps.flatMap((m) => (m.chests || []).map((x) => x.id));
  for (const id of big ? chests : chests.slice(0, Math.min(chests.length, TYPICAL.chests))) c.chests[id] = true;
  const sparkles = maps.flatMap((m) => (m.sparkles || []).map((x) => x.id));
  for (const id of sparkles) c.sparkles[id] = 1794488401253 - int(R, 0, 9e8);
  // マップ（行った・きり）
  const visit = big ? maps : maps.slice(0, Math.min(maps.length, TYPICAL.maps));
  for (const m of visit) {
    c.visited[m.id] = true;
    c.explored[m.id] = walkExplored(m, R, big ? 0.6 + R() * 0.35 : 0.3 + R() * 0.5);
  }
  // 魔物（たおした 数・図鑑）
  const ms = big ? monsters : monsters.slice(0, Math.min(monsters.length, TYPICAL.monsters));
  for (const m of ms) {
    c.kills[m] = logInt(R, 1, big ? 9999 : 120);
    noteSeen(c, [m]);
    c.bestiary[m].seen = c.kills[m] + logInt(R, 1, 30);
    for (const el of ELEMENT_ORDER) if (R() < (big ? 0.7 : 0.2)) c.bestiary[m][`el_${el}`] = 1;
    for (const d of Object.values(MONSTERS[m].drops || {})) if (Array.isArray(d) && R() < (big ? 0.8 : 0.3)) c.bestiary[m][`drop_${d[0]}`] = 1;
  }
  // 仲間（人 5・魔物 いっぱい）・あずかり所
  for (const id of ['npc_gard', 'npc_mina', 'npc_rin', 'npc_tina', 'npc_luca']) recruitNpc(world, bot.s, id, { join: false });
  const roster = big ? ROSTER_MAX : 14;
  for (const sp of shuffle(R, monsters)) {
    if (c.companions.length >= roster) break;
    addMonsterEntry(c, sp, int(R, 1, big ? 99 : 35));
  }
  const gear = items.filter((k) => ITEMS[k].slot === 'weapon' || ITEMS[k].type === 'weapon');
  for (const e of c.companions) {
    if (R() < 0.5 && gear.length) e.char.equip.weapon = pick(R, gear);
    e.char.joinedAt = 1794488401253 - int(R, 0, 9e9);
  }
  if (big) {
    c.storage = [];
    for (let i = 0; i < STORAGE_MAX; i++) {
      const sp = pick(R, monsters);
      const k = `m${900 + i}`;
      const t = { key: k, kind: 'monster', species: sp, char: { ...JSON.parse(JSON.stringify(c.companions.at(-1).char)), id: `${c.id}:${k}`, species: sp, name: `${(MONSTERS[sp]?.name || '魔物')}`.slice(0, 7) + (i % 10), level: int(R, 1, 99), joinedAt: 1794488401253 - int(R, 0, 9e9) } };
      c.storage.push(t);
    }
    c.feats = toFeats({
      use: Object.fromEntries(PHANTOM_TAGS.map((t, i) => [t, 1234567 + i])),
      dmg: 987654321, dmgSpell: 87654321, dmgFire: 7654321, heal: 6543210, crit: 54321, big5000: 4321, rv: 4095, ok: 4095,
    });
  }
  return JSON.parse(JSON.stringify(c));
}

export const biggestChar = (seed = 78) => build('big', seed);
export const typicalChar = (seed = 41) => build('typical', seed);

// 第88回: 作品の 品を たくさん 持った ふつうの セーブ（ふつうの セーブ ＋ 作品の 品 n こ〈ふくろ 3/4・預かり所 1/4。きたえた 物・そろいの 品を まぜる〉
//   ＋ ガチャの 回数・ライバルに 勝った 記録・玉の 宝箱の 記録・とびら・試練の ごほうびの しるし）。n = 0 なら 品は 足さない
export async function typicalWorkChar(seed = 41, n = 40) {
  const c = await typicalChar(seed);
  const { WORKS } = await import('../public/js/shared/data/works.js');
  const { RIVALS } = await import('../public/js/shared/data/rivals-r88.js');
  const { GEAR_SETS } = await import('../public/js/shared/data/gear-sets.js');
  const R = makeRng(seed * 11 + 3).next;
  const works = Object.keys(WORKS);
  c.gacha = Object.fromEntries(works.map((w) => [w, int(R, 0, 10)]));
  c.rivals = Object.fromEntries(shuffle(R, RIVALS.map((r) => r.id)).slice(0, 20).map((id) => [id, 1]));
  for (const w of works) c.flags[`r88door_${w}`] = true;
  for (const w of works.slice(0, 4)) c.flags[`r88tg_${w}`] = true;
  c.flags.r88_gacha_seen = true;
  c.flags.r88_orb_heard = true;
  for (const id of ['fire', 'water', 'ice', 'dark', 'gold']) c.chests[`r88orb_${id}`] = true;
  for (const id of ['1', '2', '3', '4']) c.chests[`r88db_${id}`] = true;
  const base = Object.keys(ITEMS).filter((k) => !ITEMS[k].base && ITEMS[k].src === 'r88' && ITEMS[k].work);
  const forged = Object.keys(ITEMS).filter((k) => ITEMS[k].base && ITEMS[ITEMS[k].base]?.src === 'r88' && ITEMS[ITEMS[k].base]?.work);
  const sets = Object.values(GEAR_SETS).flatMap((s) => s.items).filter((k) => ITEMS[k]);
  const want = [...shuffle(R, sets).slice(0, Math.round(n * 0.25)), ...shuffle(R, forged).slice(0, Math.round(n * 0.25))];
  for (const k of shuffle(R, base)) {
    if (want.length >= n) break;
    if (!want.includes(k)) want.push(k);
  }
  const list = want.slice(0, n);
  const inBank = Math.floor(n / 4);
  for (const id of list.slice(inBank)) addItem(c, id, 1);
  c.bank.items.push(...list.slice(0, inBank).map((id) => ({ id, n: 1 })));
  return JSON.parse(JSON.stringify(c));
}

// 魔物の ランクの 表を 作る（第43回 A。docs/plan-monsters.md の 2-2）
// つかいかた: node tools/gen-monster-ranks.mjs        … public/js/shared/data/monster-ranks.js を 書きなおす
//             node tools/gen-monster-ranks.mjs --show … 書かずに 点と ちらばりを 見る
//
// ランクの 点 ＝ 出やすさの 点（0〜4）＋ 仲間に なりにくさの 点（0〜4）
//   出やすさ: その 魔物が いちばん よく 出る 出現表の 中の わりあい（重み × むれの 中の 数の わりあい。下の memberShare）
//     30%いじょう 0点・20%いじょう 1点・12%いじょう 2点・6%いじょう 3点・それより 少ない 4点
//     夜だけ・宝の地図だけ・ひみつのダンジョンだけ（昼の 出現表に 出ない）は +1
//   なりにくさ: 図鑑の 4つの 段（data/companions.js の JOIN_TIERS。やすい 0点・ときどき 1点・なかなか 3点・滅多に 4点）
//   点 0〜1 → F・2 → E・3 → D・4 → C・5 → B・6 → A・7いじょう → S
// companions.js が encounters.js を 読みこむと じゅんかんに なるので、ランクは 決まった 表に して のこす
// これからの 章で 魔物を 足したら、これを 動かして 表を 作りなおす（test/monsters-r43a.test.js が「表に ない やせいの 魔物」を 見つける）
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { NIGHT_ZONES, NIGHT_ENCOUNTERS } from '../public/js/shared/data/night.js';
import { ENCOUNTERS_CH2 } from '../public/js/shared/data/encounters-ch2.js';
import { ENCOUNTERS_CH3 } from '../public/js/shared/data/encounters-ch3.js';
import { ENCOUNTERS_CH4, NIGHT_ZONES_CH4 } from '../public/js/shared/data/encounters-ch4.js';
import { ENCOUNTERS_TEMPLE } from '../public/js/shared/data/encounters-temple.js';
import { ENCOUNTERS_LAB } from '../public/js/shared/data/encounters-lab.js';
import { ENCOUNTERS_CH5 } from '../public/js/shared/data/encounters-ch5.js';
import { ENCOUNTERS_KUMOI } from '../public/js/shared/data/encounters-kumoi.js';
import { ENCOUNTERS_HOSHIYOMI } from '../public/js/shared/data/encounters-hoshiyomi.js';
import { ENCOUNTERS_EARTH } from '../public/js/shared/data/encounters-earth.js';
import { ENCOUNTERS_PHANTOM } from '../public/js/shared/data/encounters-phantom.js';
import { ENCOUNTERS_PAST } from '../public/js/shared/data/encounters-past.js';
import { ENCOUNTERS_ROAD } from '../public/js/shared/data/encounters-road.js';
import { ENCOUNTERS_TOKEI } from '../public/js/shared/data/encounters-tokei.js';
import { ENCOUNTERS_TOKEI6 } from '../public/js/shared/data/encounters-tokei6.js';
import { MONSTER_FRIENDS, JOIN_TIERS, joinTier, RANKS } from '../public/js/shared/data/companions.js';

// 章の まとまり（どの 章の 出現表か。テストの「どの 章にも F〜C」にも 使う）
const CHAPTER_SRC = [
  ['第3・4章', [ENCOUNTERS_CH3, ENCOUNTERS_CH4, ENCOUNTERS_TEMPLE, ENCOUNTERS_LAB]],
  ['第5章', [ENCOUNTERS_CH5, ENCOUNTERS_KUMOI, ENCOUNTERS_HOSHIYOMI, ENCOUNTERS_EARTH, ENCOUNTERS_PHANTOM]],
  ['第6章', [ENCOUNTERS_PAST, ENCOUNTERS_ROAD, ENCOUNTERS_TOKEI, ENCOUNTERS_TOKEI6]],
];
export const BANDS = ['第1・2章', '第3・4章', '第5章', '第6章'];
export function zoneBand(zone) {
  for (const [band, list] of CHAPTER_SRC) if (list.some((t) => Object.prototype.hasOwnProperty.call(t, zone))) return band;
  return BANDS[0]; // はじめの 地方・第2章・夜の 出現表（night.js）
}
void ENCOUNTERS_CH2; void NIGHT_ENCOUNTERS;

// 夜の 出現表（昼の ちいき → 夜の 出現表 の 夜の ほう）
const NIGHT_TABLES = new Set([...Object.values(NIGHT_ZONES), ...Object.values(NIGHT_ZONES_CH4 || {})]);
// めったに 出ない 表（はじめの 地方の 昼に 2.5%。world/monsters.js）は、表の 中の わりあいに この 数を かける
const TABLE_SCALE = { rare: 0.025 };

export const appearPts = (share) => (share >= 0.3 ? 0 : share >= 0.2 ? 1 : share >= 0.12 ? 2 : share >= 0.06 ? 3 : 4);
export const JOIN_PTS = { 4: 0, 3: 1, 2: 3, 1: 4 }; // JOIN_TIERS の level → 点
export const rankOfPts = (p) => (p <= 1 ? 0 : Math.min(6, p - 1)); // 0〜1 F・2 E … 7いじょう S

// やせいで 仲間に なる 魔物（配合だけ・ボス級・色ちがいは のぞく）
export function wildRecruits() {
  return Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTERS[sp] && !MONSTER_FRIENDS[sp].breedOnly && MONSTER_FRIENDS[sp].rate > 0 && !MONSTER_FRIENDS[sp].rank);
}

// 1つの むれの 中で その 魔物が しめる わりあい（数は 最小と 最大の まん中。ぷるりん 2〜3 ＋ 〇〇 1 なら 〇〇は 1/3.5）
//   出る 魔物の 数で くらべる（むれに まじって 少し 出る だけの 魔物は めずらしい）
export function memberShare(group, sp) {
  const n = (g) => ((g[1] ?? 1) + (g[2] ?? 1)) / 2;
  const tot = group.reduce((t, g) => t + n(g), 0);
  const me = group.filter((g) => g[0] === sp).reduce((t, g) => t + n(g), 0);
  return tot > 0 ? me / tot : 0;
}

// その 魔物の 出やすさ（いちばん よく 出る 表の わりあい・昼に 出るか・章）
export function appearInfo(sp) {
  let best = 0, day = false, bestZone = null, firstBand = null;
  for (const [zone, table] of Object.entries(ENCOUNTER_TABLES)) {
    if (!Array.isArray(table)) continue;
    const W = table.reduce((t, e) => t + (e.w || 0), 0);
    if (!(W > 0)) continue;
    const mine = table.reduce((t, e) => t + (e.w || 0) * memberShare(e.group || [], sp), 0);
    if (!(mine > 0)) continue;
    const share = (mine / W) * (TABLE_SCALE[zone] ?? 1);
    if (!NIGHT_TABLES.has(zone)) day = true;
    const band = zoneBand(zone);
    if (!firstBand || BANDS.indexOf(band) < BANDS.indexOf(firstBand)) firstBand = band;
    if (share > best) { best = share; bestZone = zone; }
  }
  return { share: best, zone: bestZone, day, band: firstBand };
}

export function rankPoints(sp) {
  const a = appearInfo(sp);
  const t = joinTier(sp) || JOIN_TIERS[JOIN_TIERS.length - 1];
  const ap = appearPts(a.share) + (a.day ? 0 : 1);
  const jp = JOIN_PTS[t.level] ?? 4;
  return { ...a, ap, jp, pts: ap + jp, rank: RANKS[rankOfPts(ap + jp)] };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const show = process.argv.includes('--show');
  const rows = wildRecruits().map((sp) => ({ sp, ...rankPoints(sp) }));
  const byBand = {};
  for (const r of rows) (byBand[r.band || '（出現表にいない）'] = byBand[r.band || '（出現表にいない）'] || []).push(r);
  const count = (list) => RANKS.slice(0, 7).map((R) => `${R}${list.filter((x) => x.rank === R).length}`).join(' ');
  if (show) {
    for (const r of rows) console.log(r.sp.padEnd(20), (r.band || '-').padEnd(6), (r.zone || '-').padEnd(16), (r.share * 100).toFixed(1).padStart(5) + '%', r.day ? '昼' : '夜/他', `出${r.ap}+仲${r.jp}=${r.pts}`, r.rank);
    console.log('ぜんぶ', rows.length, count(rows));
    for (const b of Object.keys(byBand)) console.log(b, byBand[b].length, count(byBand[b]));
  } else {
    const lines = [
      '// 魔物の ランク（めずらしさ）の 表（第43回 A）。tools/gen-monster-ranks.mjs が 作る … 手で なおさないで、作りなおす',
      '// ランクの 点 ＝ 出やすさ（0〜4。夜だけ・宝の地図だけ・ひみつのダンジョンだけ は +1）＋ 仲間に なりにくさ（0〜4）',
      '//   0〜1 F・2 E・3 D・4 C・5 B・6 A・7いじょう S（data/companions.js の rankIdx が 使う）',
      '// やせいで 仲間に なる 魔物だけ。配合だけの 魔物は 親の きまり、ボス級（SS）は MONSTER_FRIENDS の rank',
      'export const MONSTER_RANKS = {',
    ];
    for (const b of [...BANDS, '（出現表にいない）']) {
      if (!byBand[b]) continue;
      lines.push(`  // ${b}（${count(byBand[b])}）`);
      for (const r of byBand[b]) lines.push(`  ${r.sp}: '${r.rank}', // 出${r.ap}＋仲${r.jp}`);
    }
    lines.push('};', '');
    const out = new URL('../public/js/shared/data/monster-ranks.js', import.meta.url);
    writeFileSync(out, lines.join('\n'));
    console.log('書いた:', fileURLToPath(out), rows.length, 'しゅ', count(rows));
  }
}

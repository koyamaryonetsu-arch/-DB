// お仕事いらい板の たのまれごと 24〜26（第73回 D班。docs/plan-ch8.md の 5-3）の 人・しらべる 所
//
// ・第8章 第1幕で 千年前の 王国に 着いた あと（c8_kingdom）、今の 時代の 場所に たのみたい 人が 立つ（千年前には 入れない）
// ・maps/work-quests.js の attachWorkQuests の さいごに attachWorkQuests4 を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-work4.js、人と 物の 絵は client/render/work4-art.js
// ・第66回の 伝説の 職業に つながる 系統（18〜23 と かさならない）:
//   れん金術師 → はがねのれん金術師 → 真理のとびらをひらく者・超能力者 → サイキッカー → さいきくすお・ガーディアンか大神官 → 守りの神
// ・まだ たのまれごとが ない 場所に 置く（シロガネ地方の ひみつの温泉・クモイ地方の ハネノの島の 南・コガネ地方の 王家のピラミッドの 前の 広場）
//
// 24. ひみつの温泉の、われた湯船（れん金術師の 系統。シロガネ地方の 北西の すみ）
// 25. ハネノの島の、雲の下のおとしもの（超能力者の 系統。クモイ地方の ハネノの島の 南の はし。人の 絵だけ）
// 26. ピラミッドのはっくつ隊を守れ（ガーディアンか大神官の 系統。コガネ地方の 王家のピラミッドの 前の 広場）
import { npc } from './npc.js?v=1b1cbe3b3c9e';
import { openSpot } from './labyrinth.js?v=1b1cbe3b3c9e';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 第8章 第1幕の「千年前の 王国に 着いた」（A班の 物語の フラグ。docs/plan-ch8.md の 5-2）
export const WQ4_OPEN = 'c8_kingdom';
const OPEN = WQ4_OPEN;
export const WQ4 = {
  // 24. われた湯船（rock … 湯けむりの 白い岩を 取りに 行って 岩もぐらと 戦った）
  spaStart: 'fq_spa_start', spaRock: 'fq_spa_rock', spaDone: 'fq_spa_done',
  // 25. 雲の下の おとしもの
  espStart: 'fq_esp_start', espDone: 'fq_esp_done',
  // 26. はっくつ隊を 守る（guard … 夜の 見張りで 砂の 魔物から 守りぬいた）
  digStart: 'fq_dig_start', digGuard: 'fq_dig_guard', digDone: 'fq_dig_done',
};
// 話を 聞いた（3人ずつ）・決めた（3つずつ）
export const SPA_VOICES = ['fq_spa_v1', 'fq_spa_v2', 'fq_spa_v3']; // 子ザル・湯治の 旅人・れん金術師の 見習い
export const SPA_STEPS = ['fq_spa_s1', 'fq_spa_s2', 'fq_spa_s3']; // 材料・形・さいごの しあげ
export const ESP_VOICES = ['fq_esp_v1', 'fq_esp_v2', 'fq_esp_v3']; // ソヨの 友だち・島の はしの 見張り・雲つりの おじいさん
export const ESP_STEPS = ['fq_esp_s1', 'fq_esp_s2', 'fq_esp_s3']; // さがし方・取り方・返し方
export const DIG_VOICES = ['fq_dig_v1', 'fq_dig_v2', 'fq_dig_v3']; // けがを した はっくつ隊の 人・料理番・見習いの 子ども
export const DIG_STEPS = ['fq_dig_s1', 'fq_dig_s2', 'fq_dig_s3']; // まず する こと・立つ 所・魔物が 来たら

// 24. ひみつの温泉の 北西の すみの 白い岩（岩もぐらと 戦うと なくなる）
export const ROCK_SPOT = { x: 5, y: 7 };
// 26. 王家のピラミッドの 前の 広場の はっくつの あな（いつも ある）
export const DIG_SPOT = { x: 106, y: 102 };

const SHOWN = { all: [OPEN] };
const until = (done) => ({ all: [OPEN], not: [done] });
// [id, 名前, 絵, だいほん, マップ, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const WORK4_NPCS = [
  // 24. ひみつの温泉: 温泉守りの じいさん・湯けむりの 白い岩（戦うと なくなる）・子ザル・湯治の 旅人・れん金術師の 見習い
  ['fq_spa_host', '温泉守りのイワオ', 'fq_spa_keeper', 'fq_spa_host', 'north', 11, 17, { show: SHOWN }],
  ['fq_spa_rock', '湯けむりの白い岩', 'mon:fq_white_rock', 'fq_spa_rock', 'north', ROCK_SPOT.x, ROCK_SPOT.y, { show: until(WQ4.spaRock), fixed: true }],
  ['fq_spa_v1', '子ザルのモンタ', 'monkey', 'fq_spa_v1', 'north', 12, 12, { show: SHOWN }],
  ['fq_spa_v2', '湯治の旅人', 'caravan', 'fq_spa_v2', 'north', 5, 11, { show: SHOWN }],
  ['fq_spa_v3', 'れん金術師見習いのアルト', 'fq_alch_kid', 'fq_spa_v3', 'north', 5, 20, { show: SHOWN }],
  // 25. ハネノの島の 南: ハネビトの 女の子・友だち・島の はしの 見張り・雲つりの おじいさん
  ['fq_esp_host', 'ハネビトの女の子ソヨ', 'fq_soyo', 'fq_esp_host', 'kumoi', 56, 36, { show: SHOWN }],
  ['fq_esp_v1', 'ソヨの友だちフワ', 'fq_fuwa', 'fq_esp_v1', 'kumoi', 50, 35, { show: SHOWN, wander: 1 }],
  ['fq_esp_v2', '島のはしの見張り', 'hanebito_guard', 'fq_esp_v2', 'kumoi', 62, 36, { show: SHOWN }],
  ['fq_esp_v3', '雲つりのおじいさん', 'fq_cloud_fisher', 'fq_esp_v3', 'kumoi', 54, 39, { show: SHOWN }],
  // 26. 王家のピラミッドの 前の 広場: はっくつ隊の 隊長・はっくつの あな（いつも ある）・けがを した 人・料理番・見習いの 子ども
  ['fq_dig_host', 'はっくつ隊の隊長ザイナブ', 'fq_dig_boss', 'fq_dig_host', 'south', 98, 104, { show: SHOWN }],
  ['fq_dig_hole', 'はっくつのあな', 'mon:fq_dig_hole', 'fq_dig_hole', 'south', DIG_SPOT.x, DIG_SPOT.y, { show: SHOWN, fixed: true }],
  ['fq_dig_v1', 'けがをしたはっくつ隊の人', 'desert_elder', 'fq_dig_v1', 'south', 94, 101, { show: SHOWN }],
  ['fq_dig_v2', 'はっくつ隊の料理番', 'fq_dig_cook', 'fq_dig_v2', 'south', 102, 103, { show: SHOWN }],
  ['fq_dig_v3', '見習いの子どもアミン', 'desert_kid', 'fq_dig_v3', 'south', 110, 99, { show: SHOWN, wander: 1 }],
];
export const WORK4_NPC_IDS = WORK4_NPCS.map((r) => r[0]);

// maps/work-quests.js の attachWorkQuests から（ほかの マップが そろった あと）
export function attachWorkQuests4(maps) {
  for (const [id, name, sprite, script, mid, dx, dy, o] of WORK4_NPCS) {
    const m = maps[mid];
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}

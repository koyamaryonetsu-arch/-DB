// ストーリーの すすみぐあい（フラグ）から「今の目標」を きめる
// 古い 版の セーブで 目標の 文が 今と ちがう ときに、正しい 文に なおす ため（world.js の normalizeChar）
import { CH1_CLEAR_OBJECTIVE } from './story.js?v=b7ef3fbff3c8';
import { SKY_FLAG, SKY_HINT_OBJECTIVE, SKY_OBJECTIVE } from './sky.js?v=b7ef3fbff3c8';
import { OBJECTIVE_TARGETS } from './quest-targets.js?v=b7ef3fbff3c8';
import { OBJECTIVE_TALK } from './party-talk.js?v=b7ef3fbff3c8';
import { C3_LEAD_OBJECTIVE } from './sky.js?v=b7ef3fbff3c8';
import { CH3_PROGRESS } from './story-ch3.js?v=b7ef3fbff3c8';
import { CH4_PROGRESS } from './story-ch4.js?v=b7ef3fbff3c8';

// ストーリーの じゅんばん。うしろから 見て、さいしょに 当てはまった ものが 今の 目標
const PROGRESS = [
  [null, 'ホシミばあちゃんの家（村の南東）へ行こう'],
  ['p_start', '星見の丘（村の東門の先）で星の花をつもう'],
  ['p_flower', '村にもどってホシミばあちゃんに星の花をわたそう'],
  ['p_attack', '北のルミナの町へ行き、町長に会おう'],
  ['c1_town', '町長の家（町の北西の建物）を訪ねよう'],
  ['c1_mayor', '大工のガンテツ（町の南東の家）に会おう'],
  ['c1_wood_quest', 'ささやきの森（町の東）のおくでせいれいの木を手に入れよう'],
  ['c1_treant', 'ルミナの町の大工ガンテツにせいれいの木を届けよう'],
  ['bridge_fixed', '橋をわたって、東の「なげきの洞窟」へ向かおう'],
  ['c1_cave', '洞窟のおくへ進もう（地下2階にカギがあるらしい）'],
  [(c) => !!c.chests?.b2_key, 'カギで、おくのとびらを開けよう'],
  ['c1_door', 'おくの部屋へ進もう（泉で回復してから行こう）'],
  ['c1_boss', '守り星の石をホシフル村のホシミばあちゃんに届けよう（おくの宝箱も忘れずに）'],
  ['c1_clear', CH1_CLEAR_OBJECTIVE],
  ['c2_start', '村の南のさんばしで、船長さんに会おう'],
  ['c2_ship', 'さんばしの先の、しおかぜ号に話しかけて出航しよう。\nカモメ港は南西の「風の島」'],
  ['c2_port_seen', '港長の家（町のまん中の下）で、話を聞こう'],
  ['c2_port', '南の小島の「海鳴りの洞窟」で、光の玉を取りもどそう'],
  ['c2_kraken', '東の「灯台島」へ行って、灯台守に光の玉をわたそう'],
  ['c2_light', '光の道（嵐の島の北がわ）から嵐の島へわたり、塔をのぼろう'],
  ['c2_tower', '嵐の塔のてっぺんへのぼり、嵐の将軍をたおそう'],
  ['c2_boss', '風の守り星を、カモメ港の北の「風のさいだん」にもどそう'],
  ['c2_clear', SKY_HINT_OBJECTIVE],
  // 風の笛を もらうと 第3章の 入り口へ（むかしの「続きはアップデートで！」の 文も 知っている 文に のこす）
  [SKY_FLAG, C3_LEAD_OBJECTIVE],
  ...CH3_PROGRESS,
  ...CH4_PROGRESS,
];

// 今の 版に ある 目標の 文
export const KNOWN_OBJECTIVES = new Set([...PROGRESS.map((p) => p[1]), ...Object.keys(OBJECTIVE_TARGETS), ...Object.keys(OBJECTIVE_TALK), SKY_OBJECTIVE]);

export function objectiveFromFlags(c) {
  for (let i = PROGRESS.length - 1; i >= 0; i--) {
    const [k, text] = PROGRESS[i];
    if (k === null || (typeof k === 'function' ? k(c) : !!c.flags?.[k])) return text;
  }
  return PROGRESS[0][1];
}

// 目標が ない・今の 版に ない 文 なら、すすみぐあいから なおす（なおしたら true）
export function repairObjective(c) {
  if (c.objective && KNOWN_OBJECTIVES.has(c.objective)) return false;
  c.objective = objectiveFromFlags(c);
  return true;
}

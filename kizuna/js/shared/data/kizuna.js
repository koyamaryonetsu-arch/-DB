// 第98回: きずなの職業（新しい 系統の 伝説 ＋ もとからの 流れの いちばん 上 を かけ合わせた 幻の職業。docs/plan-kizuna-jobs.md）
//
// ★ きずなの職業を 足す とき（あとの 組へ）: 1つ 1ファイル（data/jobs-r98-<名前>.js。形は jobs-r98-kuuchou.js）を 作って、
//   下の KIZUNA の おわりに 1行 足す（import も 1行）。ならびの じゅんが 幻の職業の じゅん（PHANTOM_ORDER の おわり・幻の書の しるし）。
//   まん中に 入れない・じゅんを かえない（掲示板の しるし〈ビット〉と 引っこしコードの 番号が ずれる）
//
// みんなが 使う ファイル（jobs.js・abilities.js・hirameki.js・phantom.js・job-tags.js・job-talk.js・job-trials.js・vehicles.js・
// rivals-r88.js・battle-trial.js）は この 一覧を 1回ずつ 読む だけ。きずなの職業が ふえても 行を 足さなくて よい
import { KIZUNA_KUUCHOU } from './jobs-r98-kuuchou.js?v=b3f22aad5877';
import { KIZUNA_HOKAGE } from './jobs-r98-hokage.js?v=b3f22aad5877';
import { KIZUNA_HYAKKI } from './jobs-r98-hyakki.js?v=b3f22aad5877';
import { KIZUNA_KENGOU } from './jobs-r98-kengou.js?v=b3f22aad5877';
import { KIZUNA_SAISHOU } from './jobs-r98-saishou.js?v=b3f22aad5877';
import { KIZUNA_PTA } from './jobs-r98-pta.js?v=b3f22aad5877';
import { KIZUNA_KEIJI } from './jobs-r98-keiji.js?v=b3f22aad5877';
import { KIZUNA_OTENKI } from './jobs-r98-otenki.js?v=b3f22aad5877';
import { KIZUNA_TOUKA } from './jobs-r98-touka.js?v=b3f22aad5877';

export const KIZUNA = [
  KIZUNA_KUUCHOU, // 第98回 K1班: 熱と風の空調マスター（烈火 ＋ 天才しせつ管理者）
  KIZUNA_HOKAGE, // 第98回 K1班: 八竜の火影（烈火 ＋ 七代目火影）
  KIZUNA_HYAKKI, // 第98回 K2班: 百きの大将（ばくりゅうはの大よう ＋ かっぱの大王）
  KIZUNA_KENGOU, // 第98回 K2班: 天下無そうの剣ごう（竜神けんのサムライ ＋ 飛天御剣流けい承者）
  KIZUNA_SAISHOU, // 第98回 K3班: 国を動かす名さいしょう（ほう神の大軍師 ＋ 総理大臣）
  KIZUNA_PTA, // 第98回 K3班: 伝説のPTA会長（おにの手のじごく先生 ＋ 最強のおかん）
  KIZUNA_KEIJI, // 第98回 K4班: 元ヤンのけいじ（魔界の王の子 ＋ トリプルフェイス）
  KIZUNA_OTENKI, // 第98回 K4班: おてんき格闘流の師はん（飛竜しょう天はの達人 ＋ 天候をあやつる者）
  KIZUNA_TOUKA, // 第98回 K4班: 等価交かんの大魔道士（ドラまた ＋ 真理のとびらをひらく者）
];

// 職業の id（ならびの じゅん）
export const KIZUNA_IDS = KIZUNA.map((k) => k.job.id);
export const isKizuna = (id) => KIZUNA_IDS.includes(id);
// id → その 職業の まとまり
export const kizunaOf = (id) => KIZUNA.find((k) => k.job.id === id) || null;
// 1つの 表に まとめる（{ id: k[key] }。key が ない 職業は 入れない）
export function kizunaMap(key) {
  const out = {};
  for (const k of KIZUNA) if (k[key] !== undefined) out[k.job.id] = k[key];
  return out;
}
// 技・ひらめき技・乗り物を 1つの 表に
export const KIZUNA_ABILITIES = Object.assign({}, ...KIZUNA.map((k) => k.abilities));
export const KIZUNA_HIRA_ABILITIES = Object.assign({}, ...KIZUNA.map((k) => k.hira?.abilities || {}));
export const KIZUNA_HIRAMEKI = Object.assign({}, ...KIZUNA.map((k) => k.hira?.conds || {}));
export const KIZUNA_VEHICLES = Object.fromEntries(KIZUNA.filter((k) => k.vehicle).map((k) => [k.vehicle.id, k.vehicle.v]));

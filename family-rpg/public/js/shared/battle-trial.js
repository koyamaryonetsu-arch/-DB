// 第38回 B: 職業の試練の「師しょうのまぼろし」（docs/plan-r38.md の B）
// battle.js は かえない。world/job-trials.js が 戦いを 作った すぐ あとに setupTrialPhantom を よぶ（world/battles.js の opts.setup）。
// tools/sim-trial.mjs も おなじ ものを 使う
//
// ・まぼろし（monsters-trial.js の trial_phantom1・2）を、試練の 職業の 師しょうに かえる:
//   強さ … もとの 数 × その 職業の 得意・苦手（jobs.js の mods。PHANTOM_MODS の ちょうせい）/ 技 … その 職業の 技（覚える 技。
//   鏡のうつし身と おなじく 戦いを こわす 技・生き返らせる 技は 使わない）/ 見た目 … 白い かみの 師しょう（鏡の 色。client/battle-temple.js）
// ・技の えらび方は 鏡のうつし身と おなじ（mirrorOf が ある 敵は battle-temple.js の templeAction → mirrorDecide → 仲間の オートの AI）
// ・はじめの ことば: 師しょうの 教え（data/job-trials.js の trialWords。職業ごと）
import { kizunaMap } from './data/kizuna.js';
import { JOBS, JOB_MAX_LEVEL } from './data/jobs.js';
import { ABILITIES } from './data/abilities.js';
import { strengthenEnemy } from './data/difficulty.js';
import { MONSTERS } from './data/monsters.js';
import { mirrorSkillOk } from './battle-temple.js';
import { PHANTOM_NAME, phantomLook, trialWords, masterName, TRIALS } from './data/job-trials.js';

// 職業の mods の 効き方（1 … そのまま。回復は 弱め … 回復ばかりで 長い 戦いに ならない ように）
export const PHANTOM_MODS = { hp: 0.5, str: 1, def: 0.6, agi: 0.5, mag: 1, heal: 0.6 };
export const PHANTOM_MP = 3000;
// 職業ごとの ダメージの ちょうせい（[一の試練, 二の試練, 三の試練]。職業の 技の 強さが ちがうので、tools/sim-trial.mjs で 勝ちが そろう ように 合わせた）
//   （第38回 C の バフの きまり〈3回行動で 切れる〉に 合わせて さがし直した。tools/sim-trial-tune.mjs: 完全オートの 勝ちが 75% に なる 倍率。ゆれが 大きい 職業は 2回 さがした 平均。もとの 倍率は monsters-trial.js の dmgRate 0.55）
//   三の試練（第65回 D1）: 家族 Lv72・オクタリアの ころの ★装備（tools/sim-trial.mjs）。TRIAL=3 HI=4 で 10回ずつ さがした。ガーディアン・二刀流スターは 4 でも 勝ちが 多い
//   第87回 B班: 能力を うつした（HP・守りが 上がった）職業の 試練を 合わせ直した（sim-trial-tune 10回・SEED 500 と 900 の 平均。docs/plan-balance-r87.md）
export const PHANTOM_ADJ = {
  dragon_knight: [1.56, 1.72, 2.39], archmage: [1.56, 1.64, 1.98], high_priest: [1.38, 0.87, 1.89], god_hand: [1.37, 0.89, 1.24], summoner: [1.52, 1.31, 2.25],
  magic_swordsman: [1.3, 0.99, 1.76], guardian: [2, 2, 4], hero: [1.56, 1.59, 2.5], monster_master: [2, 2, 3.73], star_diva: [1.44, 1.37, 1.8],
  sword_master: [0.65, 0.48, 0.5], shogun: [0.55, 0.37, 0.6], shacho: [1.56, 1.18, 1.72], nitoryu: [3.43, 2.59, 4], highschooler: [1.3, 1.15, 1.43],
  career: [0.87, 0.7, 1.18], fruit_idol: [1.44, 1.18, 1.68], storm_idol: [1.44, 1.41, 2.39], keikyu_driver: [0.42, 0.35, 0.6], star_chef: [1.9, 1.95, 2.88],
  tatakiage: [1.37, 1.21, 1.64], m1_champion: [0.96, 0.7, 1.33], daikenja: [1.59, 1.56, 2.13], datenshi: [1.31, 1.31, 2.03], ss2: [0.57, 0.45, 0.74],
  ryonetsu: [0.89, 0.7, 1.64], rubber: [0.65, 0.43, 0.68], black_star: [1.41, 0.99, 1.76], enbashira: [1.34, 1.15, 1.72], black_org: [0.87, 0.65, 1.21],
  doraemon: [2, 1.72, 2.45], kinniku_kappa: [1.07, 0.87, 1.3], konoha: [1.44, 1.04, 1.71], himura: [1.24, 1.01, 1.3], kaito_kid: [0.96, 0.46, 0.98],
  harry: [0.85, 0.65, 1.18], fullmetal: [0.58, 0.43, 0.58], sailor_moon: [1.21, 1.18, 1.5], loto_hero: [1.3, 1.04, 2.28], ss3: [0.71, 0.48, 0.92],
  nika: [0.61, 0.55, 0.98], maou: [0.75, 0.55, 1.18], facility_genius: [0.86, 0.74, 1.43], hakaishin: [0.6, 0.6, 1.1], hinokami: [0.63, 0.49, 1.05],
  hokage: [0.53, 0.43, 0.92], abarenbo_shogun: [0.77, 0.7, 0.83], hiten: [0.68, 0.58, 0.71], homeroom_3b: [0.58, 0.68, 1.13],
  // 第40回
  ryumajin: [1.12, 1.19, 1.53], neo_queen: [0.52, 0.72, 1.21],
  // 第41回 B
  snow_queen: [1.56, 1.42, 2.39], fifth_spirit: [1.01, 0.91, 2.23],
  // 第41回 A
  keikyu_president: [0.64, 0.54, 0.96], hall_of_fame: [1.02, 0.89, 1.01],
  // 第43回
  mario: [1.48, 1.26, 1.61],
  // 第51回 W（雪の女王と おなじ くらいの 魔法の 超級職。tools/sim-trial.mjs で 見なおす）
  tenkou_tsukai: [1.24, 1.38, 1.72],
  // 第51回 C3: 幻の職業（sim-trial-tune 8回。天候の神・天候をあやつる者は 天気を つないだ あとで さがし直した）
  cosmic_okan: [1.06, 1.02, 1.27], chaos_creator: [0.53, 0.4, 0.59], dream_stadium: [0.57, 0.51, 0.64], weather_god: [0.75, 0.3, 1.68],
  // 第51回 C2（幻の職業）
  detective_king: [0.81, 0.47, 0.55], galaxy_queen: [1.02, 0.79, 1.53], grand_magus: [0.63, 0.7, 1.01], sword_saint: [0.47, 0.35, 0.4],
  // 第65回 D1: 一・二の試練の 倍率が まだ なかった 職業（1 の まま）に 三の試練の 倍率
  sun_hokage: [1, 1, 0.94], meitantei: [1, 1, 1.64], facility_ai: [1, 1, 1.61], pirate_king: [1, 1, 0.85], super_hero: [1, 1, 1.21],
  // 第66回 B班: 伝説の職業（tools/sim-trial-tune.mjs で さがした）
  new_kawaii: [1.35, 1.21, 1.76], smap: [1.68, 1.62, 1.86], oogosho: [0.82, 0.93, 1.29], five_star_chef: [1.6, 1.95, 1.98],
  // 第66回 A（伝説の職業。tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 の 2回 さがした 平均）
  guard_god: [1.13, 0.75, 0.92], kenshin: [0.66, 0.49, 0.67], poke_master: [1.22, 0.85, 1.3], sennen_mage: [1.32, 1.08, 0.95],
  // 第66回 D班（伝説の職業。tools/sim-trial-tune.mjs 10回・SEED 500 と 900 の 平均）
  gekka: [0.99, 0.62, 0.76], nobu_dora: [2.21, 1.72, 2.63], kappa_king: [1.15, 1, 1.24], truth_gate: [0.99, 0.78, 0.92], rosetta: [1.26, 1.35, 1.6],
  // 第66回 E1班（tools/sim-trial-tune.mjs 10回・SEED 500 と 900 の 平均。火消しの神は 回復・救出・かばうで まぼろしが しぶとい）
  koan_zero: [1.14, 0.82, 0.96], hyper_rescue: [2.12, 1.82, 2.16], top_streamer: [1.59, 1.82, 2.37],
  triple_face: [1.15, 1.02, 1.05], hikeshi_god: [0.83, 0.83, 0.91], world_streamer: [1.62, 1.79, 2.15],
  // 第66回 E2（tools/sim-trial-tune.mjs 20 0.75。SEED 500・900 の 平均。ゴールドカードマンの まぼろしは ポイントが たまるまで 弱いので 大きめ）
  esports_king: [1, 0.81, 1.1], gold_cardman: [2.34, 2.2, 2.84], psychicer: [1.73, 1.75, 1.95],
  game_god: [1.02, 0.83, 0.97], black_cardman: [1.07, 0.98, 1.15], saiki: [1.39, 1.28, 1.55],
};
// 第66回 C班: 伝説の職業（総理大臣・会長・働き方改革の星・あの方。tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
Object.assign(PHANTOM_ADJ, { souri: [1.29, 1.32, 1.6], kaichou: [1.1, 1.07, 1.23], hatarakikata: [0.95, 0.71, 1.05], ano_kata: [1.2, 1.06, 1.41] });
// 第82回 A: 犬夜しゃ・ばくりゅうはの大よう（tools/sim-trial-tune.mjs 10 0.75 HI=4・SEED 500 と 900 の 平均）
Object.assign(PHANTOM_ADJ, { inuyasha: [1.28, 1.02, 1.18], bakuryuha: [0.76, 0.49, 0.62] });
// 第82回 B班: ヤイバ・竜神けんのサムライ（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
Object.assign(PHANTOM_ADJ, { yaiba: [1.12, 0.75, 1.07], ryujin_samurai: [0.71, 0.52, 0.49] });
// 第83回 B班: れい能力教師ぬ〜べ〜・おにの手のじごく先生（tools/sim-trial-tune.mjs 10 0.75 HI=4・SEED 500 と 900 の 平均）
Object.assign(PHANTOM_ADJ, { nube: [1.87, 1.4, 1.78], jigoku_sensei: [0.85, 0.6, 0.76] });
// 第83回 A班: 太公望・ほう神の大軍師（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均。HEAL_CAP も つけた）。
//   軍師の まぼろしは 回復を 何十回も 使って 戦いが 長く なるので HEAL_CAP（4回）を つけて から さがした
Object.assign(PHANTOM_ADJ, { taikobo: [3.08, 1.89, 1.82], hoshin_gunshi: [3.85, 3.11, 3.04] });
// 第84回 B班: 早おとめ乱馬・飛竜しょう天はの達人（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
Object.assign(PHANTOM_ADJ, { ranma: [2.08, 1.78, 1.93], hiryu_master: [1.1, 0.88, 0.96] });
// 第84回 A班: うら飯ゆう助・魔界の王の子（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均。まぼろしも れい丸を 持つ〈4発・6発〉）
Object.assign(PHANTOM_ADJ, { yusuke: [1.25, 0.95, 1.31], makai_prince: [1.12, 0.91, 1.04] });
// 第85回 B班: 炎術士・八竜の炎術士・烈火（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均。tools/sim-trial.mjs 20 で 6〜9割に 合わせた）
Object.assign(PHANTOM_ADJ, { enjutsushi: [1.08, 0.9, 1.05], rekka: [1.41, 1.17, 1.7] });
// 第85回 A班: 天才美少女魔道士リナ・ドラまた（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均。
//   まぼろしは となえずに 大砲を 半分の 力で うつ〈battle-r85a.js の ENEMY_BIG〉・となえるは 使わない〈NO_USE〉）
Object.assign(PHANTOM_ADJ, { lina: [1.6, 1.57, 1.51], doramata: [2.59, 2.41, 3.34] });
// 第86回 B班: 天下一の格闘王・混とんの大軍師（幻の職業。tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
Object.assign(PHANTOM_ADJ, { tenkaichi_king: [0.99, 0.84, 0.91], chaos_gunshi: [1.89, 1.67, 1.86] });
// 第86回 A班: 人とようかいのかけ橋・竜神の剣士（幻の職業。tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
Object.assign(PHANTOM_ADJ, { yokai_bridge: [0.7, 0.46, 0.51], ryujin_kenshi: [0.89, 0.91, 1.2] });
// 第98回: きずなの職業（data/jobs-r98-*.js の trialAdj。一覧は data/kizuna.js）
Object.assign(PHANTOM_ADJ, kizunaMap('trialAdj'));
// 第87回 C班: 看板の 技に 追いうちが ついて まぼろしも 強く なった 試練だけ さがし直した
//   （tools/sim-trial-tune.mjs 10 0.75 HI=4・TRIAL=その 試練。ゆれの 大きい ゴム人間 一・三／ブラック 三／達人 一・二／社長 三 は 20回・SEED 1000 で もう一度。会長 三 は sim-trial 20回で 合わせた）
Object.assign(PHANTOM_ADJ, {
  rubber: [0.62, 0.43, 0.6], gold_cardman: [2.34, 2.05, 2.84], black_cardman: [0.99, 0.84, 1.01],
  keikyu_president: [0.64, 0.54, 0.84], keikyu_driver: [0.42, 0.35, 0.56], hiryu_master: [0.84, 0.7, 0.72], kaichou: [1.1, 0.97, 1.15],
});
// 第87回 E班（4つの 合わせ）: 呪文と 回復の のび（A班。仲間の 大賢者・大神官も のびる）・B班・C班を 合わせた あと、
//   sim-trial 20回で 6〜9わりの 外に 出た 試練だけ さがし直した（第87回の 前から 外だった 試練は さわらない）
//   （tools/sim-trial-tune.mjs 20 0.75・TRIAL=その 試練・SEED 500 と 1000 の 平均。それでも 外の 天地雷鳴士 三・セレニティ 一・守りの神 二・ゆう助 一・雪の女王 一 は sim-trial 20回で 合わせた。
//    docs/plan-balance-r87.md の 実装メモ E班）
Object.assign(PHANTOM_ADJ, {
  tatakiage: [1.41, 1.21, 1.64], summoner: [1.52, 1.31, 2.25], tenkou_tsukai: [1.24, 1.38, 1.81], ranma: [2.08, 1.78, 1.98],
  loto_hero: [1.3, 1.04, 2.42], abarenbo_shogun: [0.77, 0.7, 0.86], neo_queen: [0.65, 0.72, 1.36], guard_god: [1.13, 0.81, 0.92],
  new_kawaii: [1.35, 1.49, 1.95], game_god: [1.02, 0.83, 1.04], galaxy_queen: [1.02, 1.11, 1.72], archmage: [1.56, 1.64, 2.02],
  chaos_creator: [0.53, 0.4, 0.67], meitantei: [1, 1, 1.71], sailor_moon: [1.21, 1.18, 1.62], yusuke: [1.37, 0.95, 1.31], yaiba: [1.12, 0.75, 1.19],
  triple_face: [1.13, 1.02, 1.05], rekka: [1.34, 1.17, 1.7], grand_magus: [0.63, 0.74, 1.01],
  highschooler: [1.3, 1.25, 1.43], sword_master: [0.65, 0.48, 0.55], keikyu_driver: [0.42, 0.35, 0.68],
  doraemon: [2, 1.72, 2.63], snow_queen: [1.62, 1.42, 2.39], koan_zero: [1.14, 0.87, 1.08], nube: [1.87, 1.43, 1.78], enjutsushi: [1.12, 0.9, 1.05],
  kappa_king: [1.15, 1, 1.27], saiki: [1.39, 1.36, 1.55], doramata: [2.63, 2.49, 3.34], sword_saint: [0.47, 0.35, 0.44],
  weather_god: [0.83, 0.3, 2.21], god_hand: [1.37, 0.89, 1.36], black_star: [1.5, 0.99, 1.76], mario: [1.48, 1.26, 1.71],
  psychicer: [1.73, 1.75, 2.06], sennen_mage: [1.35, 1.22, 0.95], bakuryuha: [0.76, 0.57, 0.62], detective_king: [0.81, 0.59, 0.55],
  cosmic_okan: [1.06, 1.18, 1.27],
});
// 第88回 M1班: 魔王の Lv1 カイザーフェニックスが 闇 → 炎に なった（まぼろしも 使う）。前から 外だった 一・二と、下がった 三を 合わせ直した
//   （tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均。ゆれの 大きい 二は sim-trial 20回で 合わせた。docs/plan-r88-anime-gear.md の 11 の 実装メモ）
Object.assign(PHANTOM_ADJ, { maou: [0.85, 0.78, 1.04] });
// 使わない 技の こうか（生き返らせる・みんなの MP を へらす など。鏡のうつし身の MIRROR_SKIP の ほか）
const NO_USE = new Set(['revive', 'reviveAll']);
// 第82回 A: おすわり！・ようかい化を おさめる・大よう化・ばくりゅうはの かまえは 仲間の しくみ（まぼろしは 使わない。battle-r82a.js）
for (const t of ['osuwari', 'youkaiCalm', 'daiyoukai', 'bakuryu']) NO_USE.add(t);
// 第83回 B班: おにの手を出す・かくせい・体をはって守る・生徒たちの声は 仲間の しくみ（まぼろしは 使わない。battle-r83b.js）
for (const t of ['oniHand', 'oniAwake', 'teShield', 'teKoe']) NO_USE.add(t);
// 第83回 A班: 作戦・軍師の号令・先読みの策・守りの旗・ほう神計画は 仲間の しくみ・太極図は まぼろしが 何回も 使って 攻撃しなく なる（まぼろしは 使わない。battle-r83a.js）
for (const t of ['r83aSakusen', 'r83aGorei', 'r83aSaki', 'r83aHata', 'r83aKeikaku', 'r83aTreasure', 'r83aTaikyoku']) NO_USE.add(t);
// 第84回 B班: すがたを かえる・飛竜しょう天はの かまえ・かけひき・敵前だい逃亡・心の水は 仲間の しくみ（まぼろしは 使わない。battle-r84b.js）
for (const t of ['r84bForm', 'r84bHiryu', 'r84bKakehiki', 'r84bToubou', 'r84bKokoro']) NO_USE.add(t);
// 第85回 B班: 火竜をよぶ（メニューで えらぶ・れっしん は 生き返らせる）・姫を守る忍びは 仲間の しくみ（まぼろしは 使わない。battle-r85b.js）
for (const t of ['r85bRyu', 'r85bHime']) NO_USE.add(t);
// 第85回 A班: となえるは 仲間の しくみ（まぼろしは 使わない。大砲の 呪文は となえずに 半分の 力で うつ。battle-r85a.js の ENEMY_BIG）
for (const t of ['r85aChant']) NO_USE.add(t);
// 第86回 B班: れい丸・しょう天はの かまえ・みんなでとなえるは 仲間の しくみ（まぼろしは 使わない。battle-r86b.js）
for (const t of ['r86bReiHiryu', 'r86bChantAll']) NO_USE.add(t);
// 第86回 A班: きずなの守り・きずなの力・人とようかいのきずな（2だん）は 仲間の しくみ（まぼろしは 使わない。battle-r86a.js）
for (const t of ['r86aKabau', 'r86aKizuna', 'r86aSig']) NO_USE.add(t);
// 第88回 M1班: 天地魔闘の構えは 仲間の しくみ（まぼろしは 使わない。battle-r88m.js）
NO_USE.add('r88mTenchi');
// 回復の 技（HPが HEAL_BELOW より 少ない ときだけ 使う）
const HEAL_TYPES = new Set(['heal', 'regen', 'cure', 'mpHeal']);
export const HEAL_BELOW = 0.4;
// 1回の 戦いで 回復できる 回数（大きく 回復する 技を もつ 職業だけ。ほかは 今までどおり 何度でも）
export const HEAL_CAP = { nitoryu: 3 };
// 第66回 A: 守りの神・ポケモンマスター・千年の大魔法使いの まぼろしは 回復（神のめぐみ・ポケモンセンター・花畑を出す魔法）を
//   何十回も 使って 戦いが とても 長く なるので 回数を きめる
HEAL_CAP.guard_god = 4;
HEAL_CAP.poke_master = 4;
HEAL_CAP.sennen_mage = 4;
// 第83回 A班: 太公望・ほう神の大軍師の まぼろしも もものえん・せん人の大えんを 何十回も 使うので 回数を きめる
HEAL_CAP.taikobo = 4;
HEAL_CAP.hoshin_gunshi = 4;
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});

const pow = (m, k) => Math.pow(Math.max(0.3, m || 1), k);

// その 職業の まぼろしが 使う 技
export function phantomSkills(job) {
  const out = [];
  for (const [, id] of JOBS[job]?.learn || []) {
    const a = ABILITIES[id];
    if (!a || a.fieldOnly || a.kind === 'bond' || !mirrorSkillOk(id) || NO_USE.has(prim(a).type) || out.includes(id)) continue;
    // すぐに もう一度 動ける 技（二刀流 など）は 使わない（2回 動く ボスが つづけて 動きつづけて しまう）
    if ((prim(a).atbAfter || 0) >= 80) continue;
    out.push(id);
  }
  return out;
}

// まぼろしの 強さ（もとの 魔物 m の 数 × 職業）
export function phantomStats(m, job) {
  const mods = JOBS[job]?.mods || {};
  const K = PHANTOM_MODS;
  const R = (v) => Math.max(1, Math.round(v));
  const maxHp = R(m.maxHp * pow(mods.hp, K.hp));
  return {
    maxHp, hp: maxHp, maxMp: PHANTOM_MP, mp: PHANTOM_MP,
    atk: R(m.atk * pow(mods.str, K.str)), dfn: R(m.dfn * pow(mods.def, K.def)), agi: R(m.agi * pow(mods.agi, K.agi)),
    mag: R(m.mag * pow(mods.mag, K.mag)), healPow: R(m.mag * pow(mods.heal, K.heal) * 0.7),
  };
}

// 戦いの はじめ（world/job-trials.js の startTrialBattle・tools/sim-trial.mjs）
//   trial … { job, n（何番目の 試練）, who（試練を 受けた 人の キャラ。名前・見た目の 体） }
export function setupTrialPhantom(b, trial) {
  const job = trial?.job;
  const m = b.enemies.find((e) => /^trial_phantom/.test(e.species || ''));
  if (!m || !JOBS[job]) return null;
  const T = TRIALS[(trial.n || 1) - 1] || TRIALS[0];
  // 敵の 強さ（ハード など）は もとの 数に もう かかっているので、まず もどす
  const rate = b.enemyRate > 1 ? b.enemyRate : 1;
  const base = rate > 1 ? { maxHp: m.maxHp / rate, atk: m.atk / rate, dfn: m.dfn / rate, agi: m.agi / rate, mag: m.mag / rate } : m;
  Object.assign(m, phantomStats(base, job));
  if (rate > 1) strengthenEnemy(m, rate);
  const weapons = JOBS[job].weapons || [];
  Object.assign(m, {
    name: PHANTOM_NAME, baseName: PHANTOM_NAME, letter: '', lv: T.lv,
    // 鏡のうつし身の しくみ（battle-temple.js の templeAction が mirrorDecide で 技を えらぶ・がめんは 鏡の 色の 人の 絵）
    mirrorOf: 'trial', trialJob: job, trialN: T.n,
    // 与える ダメージの 倍率（プレイヤーの 技は 強いので。battle.js の damage）
    dmgRate: (MONSTERS[m.species]?.dmgRate || 1) * (PHANTOM_ADJ[job]?.[T.n - 1] ?? 1),
    abilities: phantomSkills(job),
    tactics: 'aggressive', autoOff: [],
    penChar: { job, jobs: { [job]: { lv: JOB_MAX_LEVEL, b: 0 } } },
    weaponCat: weapons.find((w) => w !== 'none') || 'none', onHit: null,
    look: phantomLook(job, trial.who), job, eq: '',
  });
  // 回復の 技は HPが HEAL_BELOW より 少ない ときだけ（ひとりで 回復ばかり して 長い 戦いに ならない ように）
  const all = m.abilities;
  const noHeal = all.filter((id) => !HEAL_TYPES.has(prim(ABILITIES[id]).type));
  // 回復は 1回の 戦いで HEAL_CAP 回まで（前の 番より HPが ふえていたら 回復した と 数える。二刀流スターの ねむりファーストで いつまでも たおせない のを ふせぐ）
  const healMax = HEAL_CAP[job] ?? Infinity;
  let lastHp = m.hp;
  let heals = 0;
  Object.defineProperty(m, 'abilities', {
    get() {
      if (this.hp > lastHp + 1) heals++;
      lastHp = this.hp;
      return this.hp < this.maxHp * HEAL_BELOW && heals < healMax ? all : noHeal;
    },
    set() {}, enumerable: true, configurable: true,
  });
  const words = trialWords(job, trial.who);
  b.emit({ t: 'msg', lines: [`${masterName(job, trial.who)}のまぼろしが、すがたを現した！`, `「${words}」`], dur: 2000 });
  return m;
}

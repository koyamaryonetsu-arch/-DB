// 第38回 B: 超級職・伝説の職業の レベル上限と 職業の試練（docs/plan-r38.md の B）
//
// ・上限: ふつうは Lv10（JOB_MAX_LEVEL。マスター）。超級職（tier 2）・伝説の職業（tier 3）は、その職業の
//   「〇〇の一の試練」で Lv15、「〇〇の二の試練」で Lv20。TRIALS に 1つ たすと 三の試練も 作れる（jobs.js の JOB_TOP_LEVEL も 上げる）
// ・Lv11〜 で 上がる 強さは、その 職業の 得意な 数値（jobUpKeys の 2つ）が +1〜2 だけ（jobUpStats。今の 職業で いる 間だけ）。
//   新しい 技は ふえない。職業レベルの 威力（jobPower）・得意な 強さの のび（JOB_BOOST）・ずっと残る ボーナス（perLv）は Lv10 で 止まる（stats.js）
// ・Lv15・Lv20 で しょうごう（jobTitle。メニューの「強さ」に 出る）
// ・試練の 受け方: ルミナの町の 星の神殿の「試練の番人」（world/job-trials.js）。今の 職業で needLv に なっていると 受けられる
//   1. 修行 … その 職業の 技を、勝った 戦いで 合計 uses 回 使う（とちゅうの 数は メニューの「強さ」の 職業と「クエスト」）
//   2. 師しょうのまぼろし … その 職業の 技を 使う 相手（shared/battle-trial.js。鏡のうつし身の しくみ）。負けても お金は へらない
// ・キャラの jobs[職業] に のこす: tr … クリアした 試練の 数 / tq … 受けている 試練（1・2）/ tn … 修行の 数
//   （家族で 遊んでも 1人ずつ。world/merge.js は 多い ほう、world/save.js が 古い セーブを ととのえる）
import { JOBS, JOB_MAX_LEVEL, JOB_TOP_LEVEL } from './jobs.js?v=7c37ebe89b7f';
import { ABILITIES } from './abilities.js?v=7c37ebe89b7f';
import { jobLabel } from '../job-label.js?v=7c37ebe89b7f';

export const TRIAL_MIN_TIER = 2;
// n … 何番目 / name … 名前 / needLv … 受けられる 職業レベル / cap … クリアした あとの 上限 / uses … 修行の 回数 /
// enc … 師しょうのまぼろしの 戦い（monsters-trial.js）/ lv … まぼろしの レベル
export const TRIALS = [
  { n: 1, name: '一の試練', needLv: 10, cap: 15, uses: 30, enc: 'job_trial_1', lv: 50 },
  { n: 2, name: '二の試練', needLv: 15, cap: 20, uses: 60, enc: 'job_trial_2', lv: 58 },
];
if (TRIALS[TRIALS.length - 1].cap > JOB_TOP_LEVEL) throw new Error('JOB_TOP_LEVEL too small');

const int = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

// 試練の ある 職業か（超級職・伝説の職業）
export function trialJob(id) {
  return (JOBS[id]?.tier || 0) >= TRIAL_MIN_TIER;
}

// クリアした 試練の 数（info … char.jobs[職業]）
export function trialsCleared(id, info) {
  return trialJob(id) ? Math.min(TRIALS.length, int(info?.tr)) : 0;
}

// その 職業の 今の 上限
export function jobCapOf(id, info) {
  const t = trialsCleared(id, info);
  return t ? TRIALS[t - 1].cap : JOB_MAX_LEVEL;
}
export function jobLevelCap(char, id = char?.job) {
  return jobCapOf(id, char?.jobs?.[id]);
}
// いちばん 上の 上限（試練を ぜんぶ クリア）
export function jobTopCap(id) {
  return trialJob(id) ? TRIALS[TRIALS.length - 1].cap : JOB_MAX_LEVEL;
}

// ───── Lv11〜 の 強さ ─────
const UP_KEYS = ['str', 'def', 'agi', 'mag', 'heal'];
// その 職業の 得意な 数値 2つ（mods の 大きい じゅん。同じなら UP_KEYS の じゅん）。JOBS[id].upStats が あれば そちら
const upCache = new Map();
export function jobUpKeys(id) {
  if (upCache.has(id)) return upCache.get(id);
  const j = JOBS[id];
  let keys = [];
  if (j?.upStats) keys = j.upStats.slice(0, 2);
  else if (j) keys = [...UP_KEYS].sort((a, b) => (j.mods[b] || 0) - (j.mods[a] || 0) || UP_KEYS.indexOf(a) - UP_KEYS.indexOf(b)).slice(0, 2);
  upCache.set(id, keys);
  return keys;
}
// 職業レベル lv の ときの ふえる ぶん（Lv10 まで 0）。1つめは 1レベル +1、2つめは Lv11・13・15・17・19 で +1
// （1レベルで +1〜2。Lv15 で 合計 +8、Lv20 で 合計 +15）
export function jobUpStats(id, lv) {
  const n = Math.max(0, Math.min(int(lv), JOB_TOP_LEVEL) - JOB_MAX_LEVEL);
  const out = {};
  if (!n) return out;
  const [a, b] = jobUpKeys(id);
  if (a) out[a] = n;
  if (b) out[b] = (out[b] || 0) + Math.ceil(n / 2);
  return out;
}

// ───── しょうごう ─────
// Lv15「熟練の〇〇」・Lv20「伝説の〇〇」（伝説の職業は「真の〇〇」）。who … その 人（男の子の 名前。job-label.js）
export const TITLE_LEVELS = [15, 20];
export function titleFor(id, lv, who = null) {
  const name = jobLabel(id, who);
  if (!name || !trialJob(id)) return '';
  if (lv >= 20) return JOBS[id].tier >= 3 ? `真の${name}` : `伝説の${name}`;
  if (lv >= 15) return `熟練の${name}`;
  return '';
}
export function jobTitle(char, id = char?.job) {
  return titleFor(id, char?.jobs?.[id]?.lv || 1, char);
}

// ───── 試練の 名前・ことば ─────
// 〇〇の一の試練
export function trialName(id, n, who = null) {
  return `${jobLabel(id, who)}の${TRIALS[n - 1]?.name || ''}`;
}
// 師しょう（試練の 相手の 名前。戦いでは「師しょうのまぼろし」）
export function masterName(id, who = null) {
  return `${jobLabel(id, who)}の師しょう`;
}
export const PHANTOM_NAME = '師しょうのまぼろし';

// 職業ごとの みじかい ことば（師しょうの 教え。番人が 伝え、まぼろしが 戦いの はじめに 言う）。男の子の 名前の 職業は TRIAL_WORDS_MASC
export const TRIAL_WORDS = {
  dragon_knight: '竜の力は、心がゆれると、ただのあばれる火になる。',
  archmage: '大きな呪文ほど、しずかな心でとなえるのだ。',
  high_priest: 'いやす手は、だれよりも強くなければならぬ。',
  god_hand: 'こぶしに神がやどるかどうかは、心しだいだ。',
  summoner: '天と地のせいれいは、本当に強い者にしか答えぬ。',
  magic_swordsman: '闇の剣は、自分の心の闇に勝った者だけのものだ。',
  guardian: '守りの頂点とは、仲間の前でたおれぬこと。',
  hero: '勇者とは、仲間のために一歩前へ出る者のことだ。',
  monster_master: '魔物と心を通わせる者よ。わたしの声も聞こえるか。',
  star_diva: '星の歌は、心がふるえたときにだけひびく。',
  sword_master: '剣の道に、終わりはない。',
  shogun: '天下とは、人の心を一つにすることだ。',
  shacho: '会社のトップは、だれよりも走り回るものだ。',
  nitoryu: '投げて、打って、走る。全部で世界一をめざせ！',
  highschooler: '青春とは、ためらわずにぶつかることだ！',
  career: '国を動かす者は、だれよりも足で働くのだ。',
  fruit_idol: 'カラフルなかがやきで、みんなを元気にしなさい！',
  storm_idol: '嵐のように、ステージをかけぬけろ！',
  keikyu_driver: '120キロでも、心はいつも安全運転だ。',
  star_chef: '料理は、食べる人の笑顔で完成する。',
  tatakiage: 'ゼロから作った者は、何度でも立ち上がれる。',
  m1_champion: '笑いは、ねばり強い練習から生まれるんや！',
  daikenja: '知れば知るほど、知らないことがふえる。それが賢者の道だ。',
  datenshi: '落ちた天使にしか見えない空も、あるのだよ。',
  ss2: 'いなずまの力は、いかりではなく、守る心から来る。',
  ryonetsu: '空調も省エネも、見えない所でこそ手をぬかない。',
  rubber: 'のびる体には、のびのびした心が大事だ！',
  black_star: 'たまには休め。それも、強さのひみつだ。',
  enbashira: '心を燃やせ。たおれても、また立ち上がれ！',
  black_org: '黒いコートの下に、本当の力をかくしておけ。',
  doraemon: 'ひみつ道具より大事なのは、やさしい心だよ。',
  kinniku_kappa: '筋肉は、毎日の積み重ねでできている！',
  konoha: '木の葉の忍びは、仲間を決して見すてない。',
  himura: '人を守るための剣。その重さを知れ。',
  kaito_kid: '月夜のショーは、いつも一番美しくなければ。',
  harry: '魔法は、勇気といっしょに使うものだ。',
  fullmetal: '何かを手に入れるには、同じだけの何かが必要だ。',
  sailor_moon: '月の力は、愛と勇気でかがやくのよ！',
  loto_hero: 'ロトの名をつぐ者よ。その名の重さに負けるな。',
  ss3: '長い金色のかみは、どこまでも強くなりたい心のしるしだ。',
  nika: '自由に、楽しく！太陽の神は、いつも笑っている！',
  maou: '光と闇、両方を知る者だけが王になれる。',
  facility_genius: '建物のすべてを見守る目は、休まず、ゆだんせず。',
  hakaishin: 'はかいとは、新しいものを作るための始まりだ。',
  hinokami: '日の呼吸は、すべての呼吸のはじまり。たゆまず続けよ。',
  hokage: '里の長は、だれよりも里を大切に思う者だ。',
  abarenbo_shogun: '成敗！…の前に、まずは人の話を聞くのだ。',
  hiten: '飛天御剣流は、人々を守るためにある。',
  homeroom_3b: 'おまえたちは、くさったミカンなんかじゃない！',
  // 第40回
  ryumajin: '竜の力も魔の力も、守りたい者のためにふるうのだ。',
  neo_queen: 'ほんとうの強さは、だれかをいやすやさしさの中にあるのよ。',
  // 第41回 B
  snow_queen: 'こわがらないで。その力は、だれかを守るためにあるの。',
  fifth_spirit: '風も火も水も大地も、つながってこそ1つの世界になるのです。',
  // 第41回 A
  keikyu_president: 'お客さまの安全と笑顔を運ぶのが、社長のいちばんの仕事だ。',
  hall_of_fame: '記録よりも、みんなの記おくにのこる選手になれ。',
  // 第43回（女の子のピーチ。男の子のマリオは TRIAL_WORDS_MASC）
  mario: 'おひめさまだって、ときには自分で走り出すものよ。',
};
export const TRIAL_WORDS_MASC = {
  sailor_moon: '月夜のしんしは、いつでも仲間を守るために現れるのだ。',
  neo_queen: '王とは、いちばん前に立って、みんなを守る者だ。',
  snow_queen: 'こわがるな。その力は、だれかを守るためにあるのだ。',
  mario: 'こまっている人がいたら、まずはジャンプだ！',
};
export function trialWords(id, who = null) {
  const masc = who?.look && typeof who.look === 'object' && who.look.body !== 1;
  return (masc && TRIAL_WORDS_MASC[id]) || TRIAL_WORDS[id] || `${jobLabel(id, who)}の道を、まっすぐ進むのだ。`;
}

// ───── 修行（その 職業の 技を 使った 回数） ─────
// その 職業の 技: 覚える 技（learn）と、その 職業の ひらめき技（abilities の job）
const skillCache = new Map();
export function trialSkills(id) {
  if (skillCache.has(id)) return skillCache.get(id);
  const set = new Set((JOBS[id]?.learn || []).map(([, a]) => a));
  for (const [aid, a] of Object.entries(ABILITIES)) if (a.job === id) set.add(aid);
  for (const aid of [...set]) if (!ABILITIES[aid] || ABILITIES[aid].fieldOnly) set.delete(aid);
  skillCache.set(id, set);
  return set;
}
// 戦いの 前と あとの 技を 使った 回数（char.skillUse）から、その 職業の 技を 使った 回数
export function trialUseCount(id, before = {}, after = {}) {
  let n = 0;
  for (const aid of trialSkills(id)) n += Math.max(0, int(after?.[aid]) - int(before?.[aid]));
  return n;
}

// ───── 試練の じょうたい ─────
// もどりち: { job, tier, lv, cap, cleared, active（受けている 試練の データ か null）, count, need, ready（修行 おわり）,
//            next（つぎに 受けられる 試練 か null）, canTake, why（受けられない わけ: 'tier'|'lv'|'done'|'active'）, all（ぜんぶ クリア）}
export function trialState(char, id = char?.job) {
  const info = char?.jobs?.[id] || {};
  const lv = info.lv || 1;
  const cleared = trialsCleared(id, info);
  const base = { job: id, tier: JOBS[id]?.tier || 0, lv, cap: jobCapOf(id, info), cleared, active: null, count: 0, need: 0, ready: false, next: null, canTake: false, why: '', all: false };
  if (!trialJob(id)) return { ...base, why: 'tier' };
  const q = int(info.tq);
  if (q && q === cleared + 1 && TRIALS[q - 1]) {
    const T = TRIALS[q - 1];
    const count = Math.min(T.uses, int(info.tn));
    return { ...base, active: T, count, need: T.uses, ready: count >= T.uses, why: 'active' };
  }
  if (cleared >= TRIALS.length) return { ...base, all: true, why: 'done' };
  const next = TRIALS[cleared];
  return { ...base, next, canTake: lv >= next.needLv, why: lv >= next.needLv ? '' : 'lv' };
}

// 試練を 受ける（今の 職業）。もどりち: 受けた 試練 か null
export function acceptTrial(char, id = char?.job) {
  const st = trialState(char, id);
  if (!st.canTake || !char.jobs?.[id]) return null;
  char.jobs[id].tq = st.next.n;
  char.jobs[id].tn = 0;
  return st.next;
}

// 修行の 数を たす（勝った 戦い。今の 職業の 受けている 試練だけ）。もどりち: { trial, from, to, need, done（ちょうど おわった）} か null
export function addTrialUses(char, id, n) {
  if (!(n > 0) || char?.job !== id) return null;
  const st = trialState(char, id);
  if (!st.active || st.ready) return null;
  const to = Math.min(st.need, st.count + int(n));
  char.jobs[id].tn = to;
  return { trial: st.active, from: st.count, to, need: st.need, done: to >= st.need };
}

// 師しょうのまぼろしに 勝った: 試練クリア（上限が 上がる）。もどりち: { trial, cap } か null
export function clearTrial(char, id) {
  const st = trialState(char, id);
  if (!st.active || !st.ready) return null;
  const info = char.jobs[id];
  info.tr = st.active.n;
  delete info.tq;
  delete info.tn;
  return { trial: st.active, cap: jobCapOf(id, info) };
}

// 古い セーブ・合わせた データの 職業の 項目を ととのえる（world/save.js の repairChar）
//   lv は 1〜JOB_TOP_LEVEL。Lv10 より 上なのに 試練の 数が 少ない（ふつうは ない）ときは、レベルを へらさずに 試練の 数を 合わせる
export function repairTrialInfo(id, info) {
  if (!info || typeof info !== 'object') return info;
  if (!trialJob(id)) {
    for (const k of ['tr', 'tq', 'tn']) delete info[k];
    if (info.lv > JOB_MAX_LEVEL) info.lv = JOB_MAX_LEVEL;
    return info;
  }
  let tr = Math.min(TRIALS.length, int(info.tr));
  const lv = Math.max(1, Math.min(JOB_TOP_LEVEL, int(info.lv) || 1));
  while (tr < TRIALS.length && lv > (tr ? TRIALS[tr - 1].cap : JOB_MAX_LEVEL)) tr++;
  info.lv = Math.min(lv, tr ? TRIALS[tr - 1].cap : JOB_MAX_LEVEL);
  if (tr) info.tr = tr;
  else delete info.tr;
  const q = int(info.tq);
  if (q && q === tr + 1 && TRIALS[q - 1]) {
    info.tq = q;
    info.tn = Math.min(TRIALS[q - 1].uses, int(info.tn));
  } else {
    delete info.tq;
    delete info.tn;
  }
  return info;
}

// 2つの データを 合わせる ときの 試練の 項目（world/merge.js）。a・t … 両方の jobs[職業]
export function mergeTrialInfo(id, a = {}, t = {}) {
  const out = {};
  if (!trialJob(id)) return out;
  const tr = Math.max(trialsCleared(id, a), trialsCleared(id, t));
  if (tr) out.tr = tr;
  // 受けている 試練は、クリアの 数の つぎの もの だけ。修行の 数は 多い ほう
  const q = tr + 1;
  const tn = [a, t].filter((x) => int(x?.tq) === q).map((x) => int(x.tn));
  if (tn.length && TRIALS[q - 1]) {
    out.tq = q;
    out.tn = Math.min(TRIALS[q - 1].uses, Math.max(...tn));
  }
  return out;
}

// ───── 師しょうのまぼろし（shared/battle-trial.js が 使う） ─────
// 見た目: 白い かみの 師しょう（体は 職業に あわせる。フルーツジッパーは 女性・アラシは 男性）。技: その 職業の 技
export function phantomLook(id, who = null) {
  const body = JOBS[id]?.body !== undefined ? JOBS[id].body : who?.look?.body === 1 ? 1 : 0;
  return { body, hair: 0, hairColor: 5, skin: 0, color: 0, style: body === 1 ? 'long' : 'slick', hcol: 'white', tone: 'light' };
}

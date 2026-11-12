// 第78回 3-10: 家族ミッション（週がわり）の 中み（docs/plan-r78-mission.md）
//   ・人間の キャラが 2人 いじょう 同じ パーティーで 遊んだ 時だけ 進む（数えるのは サーバー。world/missions.js）
//   ・月曜 0:00（日本時間）に 入れかわる。毎週 3つ。週の 番号を 種に えらぶ（家族サーバーの 全員が 同じ）
//   ・ばつは なし。できなくても 何も へらない
//   ・文字は 子ども向け（tools/kanji-check.mjs）。ボスの 名前・物語の 先は 書かない
import { makeRng } from '../rng.js?v=1a9ce710eac8';

export const DAY_MS = 24 * 60 * 60 * 1000;
const JST_MS = 9 * 60 * 60 * 1000;
// 1970-01-01 は 木よう日。日本時間の 日の 番号で 4 が 月よう日（1970-01-05）
const MONDAY0 = 4;
export const WEEK_PICK = 3;

// 日本時間の 日の 番号
export const jstDay = (now) => Math.floor((Number(now) + JST_MS) / DAY_MS);
// 週の 番号（日本時間の 月曜 0:00 から 次の 月曜 0:00 の 前まで）
export const weekNo = (now) => Math.floor((jstDay(now) - MONDAY0) / 7);
// その 週の はじまり（日本時間の 月曜 0:00 の 時こく）
export const weekStart = (no) => (no * 7 + MONDAY0) * DAY_MS - JST_MS;
// のこりの 日数（今日も 入れる。月曜の 朝は 7・日曜は 1）
export const daysLeft = (now) => Math.max(1, Math.ceil((weekStart(weekNo(now) + 1) - Number(now)) / DAY_MS));

// ───── しくみが 開いて いるか（いちばん 進んで いない 参加者でも できる 物だけ 出す）─────
const has = (c, k) => !!c?.flags?.[k];
// 宝の地図: 第1章クリアの あと（洞窟の 主＝ボスも ここで 何度でも 会える）。だれか 1人が まだ 主を たおして いない 地図を 持って いる
const tmOpen = (pool) => pool.every((c) => has(c, 'c1_clear')) && pool.some((c) => (c.treasureMaps || []).some((t) => t && !t.cleared));
// 合体技: 全員が 1回は 合体技を 使った ことが ある（出しかたを 知って いる）
const dualOpen = (pool) => pool.every((c) => c?.dualSeen && Object.keys(c.dualSeen).length > 0);
// 魔物が 仲間に なる しくみ
const bondOpen = (pool) => pool.every((c) => has(c, 'monster_bond'));

// ミッションの しゅるい（13こ）
//   need … 目標の 数（2人で 1〜2時間 いっしょに 遊べば 3つとも とどく くらい）
//   text … 画面の 文（n は need）/ open(pool) … 出して よいか（なければ いつでも）
export const MISSIONS = {
  kill: { need: 60, text: (n) => `いっしょに魔物を${n}ひきたおす` },
  win: { need: 25, text: (n) => `いっしょに戦いに${n}回勝つ` },
  kinds: { need: 12, text: (n) => `いっしょに${n}しゅるいの魔物をたおす` },
  safe: { need: 15, text: (n) => `だれもたおれずに、いっしょに${n}回勝つ` },
  big: { need: 6, text: (n) => `魔物4ひきいじょうのむれに、いっしょに${n}回勝つ` },
  skill: { need: 80, text: (n) => `いっしょの戦いで、呪文や技を${n}回使う` },
  chest: { need: 4, text: (n) => `いっしょに宝箱を${n}こ開ける` },
  floor: { need: 6, text: (n) => `いっしょにダンジョンの${n}つの階へ行く` },
  first: { need: 3, text: (n) => `先手をとった戦いに、いっしょに${n}回勝つ` },
  dual: { need: 4, text: (n) => `いっしょの戦いで、合体技を${n}回出す`, open: dualOpen },
  boss: { need: 1, text: (n) => `いっしょにボスを${n}体たおす`, open: tmOpen },
  tmap: { need: 1, text: (n) => `いっしょに宝の地図の洞窟を${n}つクリアする`, open: tmOpen },
  friend: { need: 2, text: (n) => `いっしょに勝った戦いで、魔物が${n}回仲間になりたがる`, open: bondOpen },
};
export const MISSION_KINDS = Object.keys(MISSIONS);
// 何も 開いて いない 時でも 出せる しゅるい（3つ いじょう ある こと。テストで たしかめる）
export const ALWAYS_KINDS = MISSION_KINDS.filter((k) => !MISSIONS[k].open);

export const missionText = (k, need = MISSIONS[k]?.need) => (MISSIONS[k] ? MISSIONS[k].text(need) : '');

// 出して よい しゅるい（pool … 今 遊んで いる 家族の キャラ。空なら いつでも 出せる 物だけ）
export function openKinds(pool) {
  const list = Array.isArray(pool) ? pool.filter(Boolean) : [];
  return MISSION_KINDS.filter((k) => !MISSIONS[k].open || (list.length > 0 && MISSIONS[k].open(list)));
}

// 週の 番号を 種に 3つ えらぶ（avoid … 前の 週の しゅるい。たりない 時だけ 使う）
export function pickWeek(no, kinds = MISSION_KINDS, avoid = []) {
  const rng = makeRng(((Math.imul(no + 7919, 2654435761) >>> 0) ^ 0x6b697a75) >>> 0);
  const order = kinds.filter((k) => MISSIONS[k]);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const skip = new Set(avoid);
  const fresh = order.filter((k) => !skip.has(k));
  const out = [...fresh, ...order.filter((k) => skip.has(k))].slice(0, WEEK_PICK);
  // ふつうの ならび（kill → win …）に して 見やすく
  return out.sort((a, b) => MISSION_KINDS.indexOf(a) - MISSION_KINDS.indexOf(b));
}

// ───── 毎週の ごほうび（達成した ミッションごと。強さに ひびかない 道具と お金）─────
// 道具は ミッションの ならび（1つ目・2つ目・3つ目）ごと
export const REWARD_ITEMS = [['magic_water', 2], ['revive_flower', 1], ['return_wing', 3]];
// お金は 受けとる キャラの レベルで（はじめの 方は 少なく、あとの 方も 多すぎない）
export const missionGold = (level) => Math.max(100, Math.min(2000, Math.round((Number(level) || 1) * 20 / 10) * 10));
export function weekReward(i, level) {
  const it = REWARD_ITEMS[i] || REWARD_ITEMS[0];
  return { gold: missionGold(level), items: [{ id: it[0], n: it[1] }] };
}

// ───── 3つとも 達成した 週の 合計で もらえる、ここだけの しょうごうと スタンプ（強さには 関係 なし）─────
//   「続けて」では なく「合計」で 数える（家族が 毎週 遊べるとは かぎらない。1週 とぎれても なくならない）
export const MILESTONES = [
  { n: 2, title: 'なかよしパーティー', stamp: 'いっしょだと楽しい！' },
  { n: 4, title: 'きずなの仲間', stamp: 'チームワーク！' },
  { n: 8, title: '家族の星', stamp: '家族さいこう！' },
  { n: 12, title: 'きずなの勇者たち', stamp: 'ミッション達成！' },
  { n: 20, title: '伝説の家族', stamp: 'ずっといっしょ！' },
];
export const milestoneOf = (n) => MILESTONES.find((m) => m.n === n) || null;
export const nextMilestone = (full) => MILESTONES.find((m) => m.n > (Number(full) || 0)) || null;

// キャラに 持たせる 物（c.famm = { t: [もらった n…], w: つけて いる n }）。もらう 前は 何も ない（引っこしコードに 入らない）
export function earnedOf(c) {
  const t = Array.isArray(c?.famm?.t) ? c.famm.t : [];
  return MILESTONES.filter((m) => t.includes(m.n));
}
// つけて いる しょうごう（なければ ''）
export function wornTitle(c) {
  const w = c?.famm?.w;
  if (!w) return '';
  return earnedOf(c).find((m) => m.n === w)?.title || '';
}
// セーブを 読んだ ときの 手直し（こわれた 物は けす）
export function cleanFamm(c) {
  if (!c || typeof c !== 'object' || c.famm === undefined) return;
  const t = Array.isArray(c.famm?.t) ? [...new Set(c.famm.t.filter((n) => milestoneOf(n)))].sort((a, b) => a - b) : [];
  if (!t.length) {
    delete c.famm;
    return;
  }
  const w = t.includes(c.famm.w) ? c.famm.w : 0;
  c.famm = w ? { t, w } : { t };
}

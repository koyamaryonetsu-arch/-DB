// 第51回 B: 家族のけいじ板（だれかが 何かを した 知らせが 自動で のる。家族の ひとことは 作らない）
//
// ・のせる 物（どれも 自動）
//   - 転職（基本職〜伝説の職業。はじめて その 職業に なった 時だけ。services.js の jobChange）
//   - ひらめき技・掛け合わせ技を ひらめいた（world/battles.js・world/wagon.js）
//   - 合体技を はじめて 使った（world/battles.js の markDuals）
//   - 幻の職業（F 班が world.boardPost?.({ kind: 'phantom_reveal' | 'phantom_get', ... }) を よぶ）
// ・1こ: { id, kind, by, charId, job?, key?, title（見出し）, detail（なりかた・覚えかた）, at }
//   見出しだけ 一覧に 出す。detail は「見る」を おした 時だけ（ネタバレ よけ。boardRows）
// ・サーバー ぜんたいで 1つ（world.data.familyBoard。家族サーバーの セーブと いっしょに のこる）。
//   ひとりモードは その ブラウザの セーブに のこる（その ブラウザの キャラの ぶんだけ）
// ・おなじ（キャラ・しゅるい・職業か 技）は 1回だけ。多く なったら 古い 物から けす（BOARD_MAX）
// ・のった 時は 遊んでいる 人みんなに とどける（{ t: 'fboardNew', entry }。client/ui/family-board.js）
// ・まだ 見ていない 印: キャラごとの c.boardSeen（さいごに 見た 時こく）
import { JOBS, TIER_NAMES, jobReqText, BODY_NAMES } from '../data/jobs.js?v=7033f2971814';
import { ABILITIES } from '../data/abilities.js?v=7033f2971814';
import { HIRAMEKI } from '../data/hirameki.js?v=7033f2971814';
import { DUAL_TECHS, dualSize, dualNeedLabel, dualNeedText } from '../data/dual.js?v=7033f2971814';
import { abilityLabel } from '../ability-label.js?v=7033f2971814';
import { jobLabel } from '../job-label.js?v=7033f2971814';
import { comboJobNames } from '../stats.js?v=7033f2971814';

export const BOARD_MAX = 200;
// 一覧で 1回に おくる 数（多すぎると スマホが おもい）
export const BOARD_SEND = BOARD_MAX;
// しゅるいの 名前（一覧の 小さな 札）。幻の職業の 名前は F 班の TIER_NAMES[4]
const PHANTOM_NAME = TIER_NAMES[4] || 'まぼろしの職業';
export const BOARD_KINDS = {
  job: '転職',
  hirameki: 'ひらめき',
  dual: '合体技',
  phantom_reveal: PHANTOM_NAME,
  phantom_get: PHANTOM_NAME,
};

const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
const num = (v) => (Number.isFinite(v) ? v : 0);

// 1こを 読める 形に（こわれた 物は null）
export function cleanEntry(e) {
  if (!e || typeof e !== 'object') return null;
  const title = str(e.title, 80) || str(e.text, 80);
  const kind = str(e.kind, 24);
  if (!title || !kind) return null;
  const out = { id: str(e.id, 24), kind, by: str(e.by, 40), charId: str(e.charId, 40), title, detail: str(e.detail, 600), at: Math.max(0, num(e.at)) };
  if (e.job) out.job = str(e.job, 40);
  if (e.key) out.key = str(e.key, 40);
  return out;
}

// セーブを 読む ときの 手直し（save.js の upgradeSave）。古い じゅんに ならべて BOARD_MAX まで
export function cleanFamilyBoard(list) {
  if (!Array.isArray(list)) return [];
  const out = list.map(cleanEntry).filter(Boolean).sort((a, b) => a.at - b.at).slice(-BOARD_MAX);
  // id の ない 物（手で 直した セーブ など）には つける
  out.forEach((e, i) => { if (!e.id) e.id = `o${e.at.toString(36)}${i.toString(36)}`; });
  return out;
}

// キャラの「さいごに 見た 時こく」（save.js の repairChar）
export function cleanBoardSeen(c) {
  if (!c || typeof c !== 'object') return;
  if (c.boardSeen === undefined) return;
  if (Number.isFinite(c.boardSeen) && c.boardSeen > 0) c.boardSeen = Math.floor(c.boardSeen);
  else delete c.boardSeen;
}

export function boardOf(world) {
  const d = world.data;
  if (!Array.isArray(d.familyBoard)) d.familyBoard = [];
  return d.familyBoard;
}

// おなじ 知らせか（キャラ・しゅるい・職業か 技）
const sameKey = (e) => `${e.charId}|${e.kind}|${e.job || e.key || e.title}`;

let seq = 0;
// のせる（もどりち: のせた 1こ。おなじ 物が もう あれば null）。world.boardPost が よぶ
export function boardPost(world, entry) {
  const e = cleanEntry({ ...entry, at: num(entry?.at) || world.now() });
  if (!e) return null;
  const list = boardOf(world);
  const k = sameKey(e);
  if (list.some((x) => sameKey(x) === k)) return null;
  e.id = `${e.at.toString(36)}${(seq++ % 1296).toString(36)}`;
  list.push(e);
  if (list.length > BOARD_MAX) list.splice(0, list.length - BOARD_MAX);
  world.markDirty?.();
  world.broadcast?.({ t: 'fboardNew', entry: e });
  return e;
}

// 家族の キャラか（酒場の 仲間・魔物・ゲストは のせない）
export function familyChar(world, c) {
  return !!c && !c.species && typeof c.id === 'string' && world.data.characters?.[c.id] === c;
}

// ───── 転職 ─────
// 職業の なりかた（見る を おした 時に 出る）
export function jobHowText(jobId, who = null) {
  const j = JOBS[jobId];
  if (!j) return '';
  const jn = (r) => jobLabel(r, who);
  const req = jobReqText(jobId, jn);
  const body = j.body !== undefined ? `\n（${BODY_NAMES[j.body]}だけがなれる）` : '';
  const tier = TIER_NAMES[j.tier || 0] || '';
  if (!req) return `${jn(jobId)}は${tier}。最初からなれる。${body}\n神殿で転職できる。`;
  return `${jn(jobId)}（${tier}）のなりかた：\n${req}${body}\n神殿で転職できる。`;
}

// 転職した あと（first … その 職業に はじめて なった。changeJob の 前に c.jobs[jobId] が なかった）
export function boardJobChange(world, c, jobId, first) {
  const tier = JOBS[jobId]?.tier || 0;
  if (!first || tier > 3 || !familyChar(world, c)) return null;
  return world.boardPost({
    kind: 'job', by: c.name, charId: c.id, job: jobId,
    title: `${c.name}が${jobLabel(jobId, c)}になった！`, detail: jobHowText(jobId, c),
  });
}

// ───── ひらめき技 ─────
// ひらめきかた（見る を おした 時に 出る）
export function hiraHowText(id, who = null) {
  const h = HIRAMEKI[id], a = ABILITIES[id];
  if (!h || !a) return '';
  const uses = Object.entries(h.from).map(([k, n]) => `${k === '@atk' ? 'ふつうの攻撃' : `「${abilityLabel(k, who)}」`}を${n}回`).join('、');
  let where = '';
  if (a.kind === 'combo') where = `掛け合わせ技。${comboJobNames(id, who).join('・')}（その先の超級職も）で、`;
  else if (a.job && JOBS[a.job]) where = `${jobLabel(a.job, who)}（そこから進んだ職業も）で、`;
  const lv = Object.entries(a.reqJobLv || {}).map(([j, n]) => `${jobLabel(j, who)}のレベル${n}`).join('と');
  return `${where}${uses}使うと、戦いの中でひらめくことがある。${lv ? `\n（${lv}以上が必要）` : ''}`;
}

export function boardHirameki(world, c, ids) {
  if (!familyChar(world, c)) return [];
  const out = [];
  for (const id of ids || []) {
    if (!HIRAMEKI[id] || !ABILITIES[id]) continue;
    const kind = ABILITIES[id].kind === 'combo' ? '掛け合わせ技' : 'ひらめき技';
    const e = world.boardPost({
      kind: 'hirameki', by: c.name, charId: c.id, key: id,
      title: `${c.name}が${kind}『${abilityLabel(id, c)}』を覚えた！`, detail: hiraHowText(id, c),
    });
    if (e) out.push(e);
  }
  return out;
}

// ───── 合体技 ─────
export function dualHowText(id, who = null) {
  const t = DUAL_TECHS[id];
  if (!t) return '';
  return `${dualSize(id)}人でいっしょに出す合体技。\n${dualNeedLabel(id)}：${dualNeedText(id, false, who)}\n出せるかは、今ついている職業で決まる。戦いで自分のゲージがたまった時に「合体技」から選ぶ。`;
}

// chars: その 合体技を はじめて 使った 家族の キャラ（1回の 合体技で 1こに まとめる）
export function boardDual(world, chars, id) {
  const fam = (chars || []).filter((c) => familyChar(world, c));
  const t = DUAL_TECHS[id];
  if (!fam.length || !t) return null;
  const names = fam.map((c) => c.name).join('と');
  return world.boardPost({
    kind: 'dual', by: names, charId: fam[0].id, key: id,
    title: `${names}が合体技『${t.name}』を覚えた！`, detail: dualHowText(id, fam[0]),
  });
}

// ───── 見る 人へ ─────
// まだ 見ていない 知らせの さいごの 時こく（自分の 知らせは 入れない）
export function boardLastFor(world, charId) {
  let last = 0;
  for (const e of boardOf(world)) if (e.charId !== charId && e.at > last) last = e.at;
  return last;
}

// クライアントからの { t: 'fboard', action }（world.js の handle）
//   list … 一覧（新しい じゅん）を おくる / seen … ここまで 見た（c.boardSeen）/ peek … さいごの 時こくだけ
export function boardMessage(world, s, msg) {
  const c = s.char;
  if (!c) return;
  switch (msg?.action) {
    case 'list': {
      const list = boardOf(world).slice(-BOARD_SEND).reverse();
      world.send(s, { t: 'fboardList', list, last: boardLastFor(world, c.id) });
      return;
    }
    case 'seen': {
      const at = Math.min(num(msg.at), world.now());
      if (at > num(c.boardSeen)) {
        c.boardSeen = Math.floor(at);
        world.sendSelf(s);
        world.markDirty();
      }
      return;
    }
    case 'peek':
      world.send(s, { t: 'fboardLast', last: boardLastFor(world, c.id) });
      return;
    default:
  }
}

// ───── 一覧の 見た目の もと（client/ui/family-board.js・テスト）─────
// list: 新しい じゅん。opened: 「見る」を おした id の Set。me: 見ている キャラ（{ id, boardSeen }）
// detail は 開いた 物だけ（ほかは null）
export function boardRows(list, opened, me) {
  const seen = num(me?.boardSeen);
  return (list || []).map((e) => {
    const open = !!opened?.has(e.id);
    return {
      id: e.id, kind: e.kind, tag: BOARD_KINDS[e.kind] || 'お知らせ', title: e.title, at: e.at,
      mine: e.charId === me?.id, unread: e.charId !== me?.id && e.at > seen,
      open, detail: open ? e.detail || 'くわしいことは書いていない。' : null,
    };
  });
}

// まだ 見ていない 知らせが あるか（メニューの ●）
export function boardUnread(last, me) {
  return num(last) > num(me?.boardSeen);
}

// 時こくの 文（例: 10月29日 18:05）
export function boardWhen(at) {
  const d = new Date(num(at));
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
}

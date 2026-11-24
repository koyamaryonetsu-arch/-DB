// 第105回: 戦いの 中の 会話を 1行ずつ 読む（docs/plan-r105-battle-talk.md）
//
// ・会話の イベント … 攻撃では ない（ダメージ・回復・ミスの 結果が ない）で、人の せりふ（名前「…」）か
//   戦いの とちゅうの 場面（絵・曲・ms つきの 文。SCENE_KEYS）を 出す 'act'・'msg'。isTalkEvent が 1か所で 見分ける
//   ・ボスの ファイルが ev.talk = true / false を つけた 時は それに したがう（目安で まちがう 物）
// ・サーバー（Battle）は 会話を 出したら「読み終わり 待ち」（talkWait の 戦いだけ。world/battles.js の makeBattle）:
//   tick は 何も すすめない（ゲージ・どく・前ぶれ・合体技の さそいの 時間・this.time）
//   待つ 人 … 戦いに いる 人（controller）で オートで ない 人 ぜんいん。みんなから { talk: seq } が とどいたら 次へ
//   待つ 人が いない（ぜんいん オート）… 読める 速さ（talkAutoMs）で 自動で 流れる
// ・talkWait で ない 戦い（テスト・tools/sim-*.mjs・はかる 道具）は 今まで どおり 待たない（文は 時間で 流れる）

// 1行の 読む 時間（オートの 時。文字の 速さで かえる）
export const TALK_LINE_MS = 1500;

// 戦いの とちゅうの 場面（{ lines, ms } を もつ イベントの キー。絵・曲は 画面の がわ）
export const SCENE_KEYS = ['c11dEight'];

// 名前「…」の 形の 1行（名前は 空白・かっこ・句読点を ふくまない 短い 物。名前の ない「…」だけの 行も）
const SPEECH = /^[^\s「」（）()！？!?。、…]{0,16}「[\s\S]*」$/;
export function isSpeechLine(line) {
  return typeof line === 'string' && SPEECH.test(line.trim());
}

// 攻撃・回復の 結果の 行（この 行より あとの せりふを「攻撃の あとの 会話」と みる）
const RESULT_LINE = /ダメージ|回復|倒した|死んでしまった|生き返った|ミス|効いていない|かわした/;

// 場面の 文（ない 時は null）
export function talkScene(ev) {
  for (const k of SCENE_KEYS) {
    const s = ev?.[k];
    if (s && Array.isArray(s.lines) && s.lines.length) return { key: k, lines: s.lines, ms: s.ms || TALK_LINE_MS };
  }
  return null;
}

// 攻撃・回復などの 結果が ある
function hasEffect(ev) {
  if ((ev.results || []).length) return true;
  if (ev.fx?.type === 'poison' || ev.fx?.type === 'attack' || ev.fx?.type === 'flee' || ev.fx?.type === 'wagon') return true;
  return !!(ev.regenHeal?.length || ev.genki?.length || ev.counter?.length || ev.dual || ev.swap);
}

// さいごの 結果の 行より あとの せりふの 数
function trailingSpeech(lines) {
  let last = -1;
  lines.forEach((l, i) => { if (typeof l === 'string' && !isSpeechLine(l) && RESULT_LINE.test(l)) last = i; });
  return lines.slice(last + 1).filter(isSpeechLine).length;
}

// 見分け方（docs/plan-r105-battle-talk.md の 2）
//   1) ボスの ファイルが ev.talk = true / false を つけた … それに したがう
//   2) 戦いの とちゅうの 場面（SCENE_KEYS）… 会話
//   3) 攻撃・回復の 結果が ない:
//      'msg'（行動では ない 知らせ）… せりふが 1行 でも あれば 会話
//      'act'（だれかの 行動）… せりふが 2行 いじょう（やりとり・ひとりごと）なら 会話。1行だけは 技の かけ声（攻撃の あつかい）
//   4) 結果が ある（攻撃・回復）… さいごの 結果の 行の あとに せりふが 2行 いじょう（たおれる 時・すがたが かわる 時の ことば）、
//      または ボスを たおした・勝ちが きまった 行動で あとに せりふが ある … 会話。ほかは 攻撃（「くらえ！」＋ ダメージ など）
//   b … その 戦い（ボスを たおしたかを 見る。なくても よい）
export function isTalkEvent(ev, b = null) {
  if (!ev || (ev.t !== 'act' && ev.t !== 'msg')) return false;
  if (ev.talk === true) return true;
  if (ev.talk === false) return false;
  if (talkScene(ev)) return true;
  const lines = (ev.lines || []).filter((l) => typeof l === 'string');
  const speech = lines.filter(isSpeechLine).length;
  if (!speech) return false;
  if (!hasEffect(ev)) return ev.t === 'msg' ? speech >= 1 : speech >= 2;
  const tail = trailingSpeech(lines);
  if (tail >= 2) return true;
  if (tail >= 1 && b) {
    // ボスを たおした・この 行動で 勝ちが きまった（女王が 手を 下ろした など、たおれずに 終わる ボスも）
    if (b.pendingEnd?.outcome === 'win') return true;
    const bossDown = (ev.results || []).some((r) => {
      const t = b.get?.(r.id);
      return t && t.side === 'enemy' && t.boss && !t.alive;
    });
    if (bossDown) return true;
  }
  return false;
}

// 画面に 1行ずつ 出す 文（場面は 場面の 文）
export function talkLinesOf(ev) {
  const s = talkScene(ev);
  return s ? s.lines : (ev.lines || []);
}

// オートの 時の 1行の 時間（場面は 今の ms を 下回らない）
export function talkLineMs(ev, textSpeed = 1) {
  const base = TALK_LINE_MS / (textSpeed || 1);
  const s = talkScene(ev);
  return s ? Math.max(s.ms, base) : base;
}

// オートで 流れる 時の 長さ（ぜんぶの 行）
export function talkAutoMs(ev, textSpeed = 1) {
  return Math.round(talkLinesOf(ev).length * talkLineMs(ev, textSpeed));
}

// ───────────── サーバー（Battle）の がわ ─────────────
// 会話を 出した（Battle.emit から）。talkWait の 戦いだけ 待ちに 入る
export function talkBegin(b, ev) {
  b.talkSeq = (b.talkSeq || 0) + 1;
  ev.talk = b.talkSeq;
  if (!b.talkWait) return;
  const autoMs = talkAutoMs(ev, b.textSpeed);
  if (b.talk) {
    b.talk.seq = ev.talk;
    b.talk.autoMs += autoMs;
    b.talk.after = false;
  } else b.talk = { seq: ev.talk, autoMs, after: false };
}

// 会話の あとに 攻撃などの 文が 出た（読み終わっても その 分の 時間は 待つ）
export function talkAfter(b) {
  if (b.talk) b.talk.after = true;
}

// 待つ 人（戦いに いて オートで ない 人の controller）
export function talkReaders(b) {
  const out = new Set();
  for (const a of b.allies) if (a.controller && !a.auto) out.add(a.controller);
  return out;
}

// 読み終わった（{ t: 'battle', talk: seq }。seq より 前の 会話も 読み終わった あつかい）
export function talkRead(b, who, seq) {
  if (!who || !Number.isFinite(seq)) return;
  b.talkAck = b.talkAck || new Map();
  if ((b.talkAck.get(who) || 0) < seq) b.talkAck.set(who, seq);
}

// とちゅうから 入った 人（まだ 会話を 見て いない）は 読み終わった あつかい
export function talkJoin(b, who) {
  if (b.talk && who) talkRead(b, who, b.talk.seq);
}

// tick の はじめ: まだ 待つ 時は true（何も すすめない）
export function talkHold(b) {
  const t = b.talk;
  if (!t) return false;
  const need = talkReaders(b);
  const ack = b.talkAck || new Map();
  if ([...need].some((who) => (ack.get(who) || 0) < t.seq)) return true;
  b.talk = null;
  if (!need.size) {
    // ぜんいん オート: 読める 速さで 流れる（攻撃の 文の 分は もとの 待ち）
    b.lock = Math.max(b.lock, t.autoMs);
  } else if (!t.after) {
    // みんな 読み終わった: 会話の 分の 待ちは もう いらない
    b.lock = 0;
  }
  b.emit({ t: 'talkDone', seq: t.seq });
  return false;
}

// 第50回 N7: チャットの スタンプを 自分で えらぶ（キャラごと 12こ まで）
// ・c.stamps … えらんだ スタンプの ことば（ない ときは DEFAULT_STAMPS。もとどおりに したら 消す）
// ・えらぶ 画面は client/ui/stamps.js、サーバーの 変える しくみは world/services.js の menuAction（'stamps'）
// ・ひきつぎの 合言葉（transfer.js）には 入れない（ひきついだ あとは もとどおり）
// ・チャットで おくる スタンプは 今までどおり 12文字までの ことばなら なんでも（world.js の onChat）

export const STAMP_SLOTS = 12; // いくつまで
export const STAMP_LEN = 12; // 1つの 長さ（world.js の onChat の slice と おなじ）

// はじめの スタンプ（第50回より 前の 8こ ＋ 4こ）
export const DEFAULT_STAMPS = Object.freeze([
  'よろしく！', 'ありがとう！', '行くよー！', '助けて！', '待ってて！', 'やったね！', 'おつかれさま', 'ご飯だよ〜',
  'ナイス！', 'レベル上がった！', 'ボス行こう！', '宝箱あった！',
]);

// えらべる ことば（なかまわけ）
export const STAMP_PRESETS = Object.freeze([
  { name: 'あいさつ', list: ['おはよう！', 'こんにちは！', 'こんばんは！', 'おやすみ〜', 'よろしく！', 'ありがとう！', 'ごめんね', 'おつかれさま', 'ただいま！', 'おかえり！'] },
  { name: 'おねがい', list: ['助けて！', '待ってて！', '回復して〜', '手伝って！', 'こっち来て！', '先に行ってて', 'ちょっと休けい', '少し待って'] },
  { name: '気持ち', list: ['やったね！', 'すごい！', 'ナイス！', 'うれしい！', 'えーっ！', 'ドキドキ…', 'こわいよ〜', 'わーい！', 'いいね！', 'ねむい…'] },
  { name: '家族', list: ['ご飯だよ〜', 'おふろ空いたよ', 'ねるよー', '宿題終わった？', '歯みがいた？', 'おやつあるよ', '出かけるよー', '今行く！', '明日も遊ぼう！'] },
  { name: 'ゲーム', list: ['行くよー！', 'レベル上がった！', 'ボス行こう！', '宝箱あった！', '回復するね', '作戦会議！', 'いっしょに行こう', '勝ったよ！', 'にげよう！', '町にもどろう', 'セーブしてね'] },
]);

// 見えない 文字（改行・タブ・制御文字・はばの ない 文字・文字の 向きを かえる 文字）
const HIDDEN = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g;

// 1つの ことばを きれいに（見えない 文字を けす・前後の 空白を けす・12文字まで）。だめな ときは ''
export function cleanStampText(v) {
  if (typeof v !== 'string') return '';
  let s = v.replace(HIDDEN, '').trim().slice(0, STAMP_LEN);
  // 切れた 絵文字の かたわれは けす
  if (/[\ud800-\udbff]$/.test(s)) s = s.slice(0, -1);
  return s.trim();
}

const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// 今の スタンプ（ない・こわれている ときは はじめの スタンプ）
export function stampsOf(c) {
  const list = Array.isArray(c?.stamps) ? c.stamps.map(cleanStampText).filter(Boolean).slice(0, STAMP_SLOTS) : [];
  return list.length ? list : DEFAULT_STAMPS.slice();
}

// HUD の「スタンプ」の 一覧（さいごに「スタンプを変える」）
export const STAMP_EDIT = '__edit';
export function stampMenuItems(c) {
  return [...stampsOf(c).map((s) => ({ label: s, value: s })), { label: 'スタンプを変える', value: STAMP_EDIT, cls: 'stamp-edit' }];
}

// サーバー: スタンプを 変える（menuAction の 'stamps'）。{ ok, text }
//   list … 1〜12この ことば。長すぎる・文字で ない・見えない 文字だけ の ものが あれば 変えない
export function setStamps(c, list) {
  if (!Array.isArray(list) || !list.length || list.length > STAMP_SLOTS) return { ok: false, text: 'スタンプを変えられなかった' };
  const out = [];
  for (const v of list) {
    if (typeof v !== 'string' || v.length > STAMP_LEN * 2) return { ok: false, text: 'スタンプを変えられなかった' };
    const s = cleanStampText(v);
    if (!s || s !== v.replace(HIDDEN, '').trim()) return { ok: false, text: 'スタンプを変えられなかった' };
    out.push(s);
  }
  if (same(out, DEFAULT_STAMPS)) delete c.stamps;
  else c.stamps = out;
  return { ok: true, text: '' };
}

// セーブを 読んだ ときの 手直し（save.js の repairChar）
export function cleanStamps(c) {
  if (!c || typeof c !== 'object' || c.stamps === undefined) return;
  const list = Array.isArray(c.stamps) ? c.stamps.map(cleanStampText).filter(Boolean).slice(0, STAMP_SLOTS) : [];
  if (!list.length || same(list, DEFAULT_STAMPS)) delete c.stamps;
  else c.stamps = list;
}

// えらぶ 画面の 手直し（client/ui/stamps.js）。どれも 新しい 一覧を かえす
// i 番めに text を 入れる（あいている ところ なら うしろに たす）
export function putStamp(list, i, text) {
  const s = cleanStampText(text);
  const out = list.slice();
  if (!s) return out;
  if (i >= 0 && i < out.length) out[i] = s;
  else if (out.length < STAMP_SLOTS) out.push(s);
  return out;
}
// i 番めを はずす（1つは のこす）
export function dropStamp(list, i) {
  if (list.length <= 1 || i < 0 || i >= list.length) return list.slice();
  return list.filter((_, k) => k !== i);
}
// i 番めを d（-1 上・1 下）へ
export function moveStamp(list, i, d) {
  const j = i + d;
  const out = list.slice();
  if (i < 0 || i >= out.length || j < 0 || j >= out.length) return out;
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

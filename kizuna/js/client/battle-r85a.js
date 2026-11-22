// 第85回 A班: スレイヤーズの 系統の 戦いの 画面（shared/battle-r85a.js の となえる・大砲の 呪文・早口）
//   ・r85aMarks … 仲間の まどの 小さな 札「となえ3」（のこりの 行動の 回数。金色）。battle-buffs.js の unitMarks。家族 みんなの 画面に 出る（pub の r85aChant）
//   ・r85aRow   … 命令の 一覧（技の メニュー）で、となえて いない 時の 大砲の 呪文を うすく して「となえてから」の 札を 出す（client/battle.js の abilityMenu）
//   ・r85aPresent … となえた（札が 金色に 光る）・早口（「早口！」）・大砲を うった（ギガ・スレイブは 画面が 黒く ゆれる）
// css/style.css は ほかの 人も かえるので、CSS は ここで 入れる（battle-buffs.js と おなじ やりかた）
import { isBig } from '../shared/battle-r85a.js?v=c5f1443d1cb0';

export const CHANT_COLOR = '#ffd36a';
const CSS = `
.b-mem .sts .bm.ch85 { color: ${CHANT_COLOR}; background: rgba(40, 24, 0, 0.6); font-weight: bold; }
`;
if (typeof document !== 'undefined' && !document.getElementById('r85a-chant-css')) {
  const s = document.createElement('style');
  s.id = 'r85a-chant-css';
  s.textContent = CSS;
  document.head.append(s);
}

// 1人ぶんの 札（a … pub）。{ text, cls }
export function r85aMarks(a) {
  if (!a?.alive || !(a.r85aChant > 0)) return [];
  return [{ text: `となえ${a.r85aChant}`, cls: 'ch85' }];
}

// 今 うてるか（a … 自分の pub。status は 名前の ならび）
export function chantReady(a) {
  const s = a?.status || [];
  return a?.r85aChant > 0 && !s.includes('sleep') && !s.includes('paralyze') && !s.includes('silence');
}

// 技の メニューの 1行（ab … 技、a … 自分の pub）: { off, tag }
export function r85aRow(ab, a) {
  if (!isBig(ab) || chantReady(a)) return { off: false, tag: '' };
  return { off: true, tag: '<span class="tag muted">となえてから</span>' };
}

// 行動の えんしゅつ（client/battle.js の 行動の ところから）
export function r85aPresent(view, ev) {
  if (ev.r85aChant) view.glowStatus(ev.r85aChant, CHANT_COLOR);
  if (ev.r85aHaya) view.banner('早口！すぐに動ける！', 'combo');
  if (ev.r85aGiga) view.banner(`ギガ・スレイブ！（MP${ev.r85aGiga.used}）`, 'combo');
}

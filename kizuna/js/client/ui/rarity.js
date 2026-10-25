// ★（強さ）と レア度（めずらしさ）を 名前に 出す（第31回 C・第35回）
//   ★の 数 … 強さ（shared/data/rare-loot.js の starsOf。店で 買える 品は ★1、店では 買えない 品は ランクで ★2〜★5）
//   名前の 色 … めずらしさ（rarityOf。css の .rar.r1〜.r5: 緑・青・紫・オレンジ・金と にじ）
//   店で 買える 品（★1・色なし）は、一覧が ★だらけに ならない ように 名前だけ（★は 説明の「強さ ★（ランク3）」に 出る）
//   rareNameHtml … メニュー・装備・店で 売る 一覧の 名前
//   paintRare    … 会話の まど（宝箱を 開けた・ごほうび）と 戦いの けっかの 文の 中の 名前に 色と ★を つける
import { ITEMS } from '../../shared/data/items.js?v=c553fc066ee8';
import { rarityOf, starsOf } from '../../shared/data/rare-loot.js?v=c553fc066ee8';
import { esc } from './dom.js?v=c553fc066ee8';

export const starText = (n) => '★'.repeat(Math.max(0, n || 0));
const span = (r, s, nameHtml) => `<span class="rar r${r}">${nameHtml}<span class="rs">${starText(s)}</span></span>`;
// 名前に 色と ★を つける 品か（店で 買える 品・装備で ない 物は つけない）
const mark = (id) => {
  const r = rarityOf(id);
  return r ? { r, s: starsOf(id) } : null;
};

// 名前（esc 済みの HTML）。レア度が なければ そのまま
export function rareNameHtml(id, name = ITEMS[id]?.name ?? id) {
  const m = mark(id);
  return m ? span(m.r, m.s, esc(name)) : esc(name);
}

// 文の 中の レアな 装備の 名前（長い 名前から さがす。きたえた「+2」も いっしょに）
let RE = null;
let BY_NAME = null;
function build() {
  if (RE) return;
  BY_NAME = new Map();
  for (const [id, it] of Object.entries(ITEMS)) {
    if (!it || it.base) continue;
    const m = mark(id);
    if (m && it.name && !BY_NAME.has(it.name)) BY_NAME.set(it.name, m);
  }
  const names = [...BY_NAME.keys()].sort((a, b) => b.length - a.length).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  RE = names.length ? new RegExp(`(${names.join('|')})(\\+\\d+)?`, 'g') : null;
}
export function hasRareName(text) {
  build();
  if (!RE || !text) return false;
  RE.lastIndex = 0;
  const ok = RE.test(String(text));
  RE.lastIndex = 0;
  return ok;
}
// 文を HTML に（レアな 名前に 色と ★）
export function rareTextHtml(text) {
  build();
  const s = esc(String(text ?? ''));
  if (!RE) return s;
  return s.replace(RE, (m, nm, plus) => {
    const k = BY_NAME.get(nm);
    return span(k.r, k.s, `${nm}${plus || ''}`);
  });
}
// el の 文を text に（レアな 名前が なければ ふつうの textContent）
export function paintRare(el, text) {
  if (!el) return;
  if (hasRareName(text)) el.innerHTML = rareTextHtml(text);
  else el.textContent = text ?? '';
}

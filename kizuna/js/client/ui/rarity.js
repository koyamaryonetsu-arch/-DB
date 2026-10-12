// レア度（★1〜★5）を 名前の 色と ★の 数で 見せる（第31回 C）
//   色は css の .rar.r1〜.r5（★1 緑・★2 青・★3 紫・★4 オレンジ・★5 金と にじ）。店の 品（★なし）は ふつうの 色
//   rareNameHtml … メニュー・装備・店で 売る 一覧の 名前
//   paintRare    … 会話の まど（宝箱を 開けた・ごほうび）と 戦いの けっかの 文の 中の 名前に 色と ★を つける
import { ITEMS } from '../../shared/data/items.js?v=bbefc48d5022';
import { rarityOf } from '../../shared/data/rare-loot.js?v=bbefc48d5022';
import { esc } from './dom.js?v=bbefc48d5022';

const stars = (r) => '★'.repeat(r);
const span = (r, nameHtml) => `<span class="rar r${r}">${nameHtml}<span class="rs">${stars(r)}</span></span>`;

// 名前（esc 済みの HTML）。レア度が なければ そのまま
export function rareNameHtml(id, name = ITEMS[id]?.name ?? id) {
  const r = rarityOf(id);
  return r ? span(r, esc(name)) : esc(name);
}

// 文の 中の レアな 装備の 名前（長い 名前から さがす。きたえた「+2」も いっしょに）
let RE = null;
let BY_NAME = null;
function build() {
  if (RE) return;
  BY_NAME = new Map();
  for (const [id, it] of Object.entries(ITEMS)) {
    if (!it || it.base) continue;
    const r = rarityOf(id);
    if (r && it.name && !BY_NAME.has(it.name)) BY_NAME.set(it.name, r);
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
  return s.replace(RE, (m, nm, plus) => span(BY_NAME.get(nm), `${nm}${plus || ''}`));
}
// el の 文を text に（レアな 名前が なければ ふつうの textContent）
export function paintRare(el, text) {
  if (!el) return;
  if (hasRareName(text)) el.innerHTML = rareTextHtml(text);
  else el.textContent = text ?? '';
}

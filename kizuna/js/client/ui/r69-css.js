// 第69回（技の 一覧の 見なおし）の CSS。css/style.css は ほかの 人も かえるので、ここで 入れる（よみこんだ ときに 1回だけ）
//   ・戦いの 技の 一覧の 左右の はしの ◀ ▶（スマホ。client/battle.js の pagerWrap）
//   ・メニューの お気に入り（戦いと おなじ 列の ならび・つかんで 動かす。client/ui/menu.js の skillsView）
const CSS = `
.b-cmd .b-pagewrap { display: flex; align-items: stretch; gap: 0.2em; min-height: 0; }
.b-cmd .b-pagewrap > .menu { flex: 1 1 auto; min-width: 0; }
.b-cmd .b-pagewrap > .b-page { display: none; flex: none; width: 1.55em; min-height: 0; padding: 0; font-size: 0.95em; border-width: 1px; border-radius: 6px; color: var(--accent); background: rgba(10, 12, 40, 0.85); }
.b-cmd .b-pagewrap.pg-on > .b-page { display: block; }
.b-cmd .b-pagewrap > .b-page:disabled { opacity: 0.22; color: var(--muted); }
.b-cmd .b-pagewrap > .b-page:active:not(:disabled) { background: rgba(255, 214, 107, 0.3); }
@media (max-aspect-ratio: 1/1) {
  .b-cmd .b-pagewrap { flex: 1; }
}

.menu.fav-grid { display: grid; grid-template-columns: repeat(var(--fcols, 2), minmax(0, 1fr)); column-gap: 0.5em; row-gap: 0.3em; align-content: start; padding: 0.1em; }
.menu.fav-grid .hdr { grid-column: 1 / -1; }
.menu.fav-grid .item { min-height: 2.3em; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 8px; background: rgba(255, 255, 255, 0.04); padding: 0.1em 0.5em; gap: 0.3em; }
.menu.fav-grid .item::before { display: none; }
.menu.fav-grid .item > .l { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1 1 auto; }
.menu.fav-grid .item > .r { flex: none; }
.menu.fav-grid .item.k-dmg { border-color: rgba(255, 128, 104, 0.75); }
.menu.fav-grid .item.k-heal { border-color: rgba(112, 224, 136, 0.75); }
.menu.fav-grid .item.k-sup { border-color: rgba(112, 176, 255, 0.75); }
.menu.fav-grid .item.sel { background: rgba(255, 214, 107, 0.16); box-shadow: 0 0 0 2px var(--accent); border-color: var(--accent); }
.menu.fav-grid .item.grab { background: rgba(255, 214, 107, 0.32); border-color: #fff; box-shadow: 0 0 0 3px var(--accent), 0 0 14px rgba(255, 214, 107, 0.8); transform: translateY(-2px); animation: fav-grab 0.9s ease-in-out infinite alternate; }
.menu.fav-grid .item.dim { opacity: 0.4; }
.menu.fav-grid .item .tag { font-size: 0.62em; margin-left: 0.2em; }
@keyframes fav-grab { to { box-shadow: 0 0 0 3px #fff, 0 0 18px rgba(255, 214, 107, 0.95); } }
.fav-grab-bar { display: flex; justify-content: space-between; align-items: center; gap: 0.8em; margin: 0.5em 0 0.2em; }
.fav-grab-bar .fg-cross { display: grid; grid-template-columns: repeat(3, 2.6em); grid-template-rows: repeat(3, 2.3em); gap: 0.15em; }
.fav-grab-bar .fg-cross .btn { padding: 0; min-height: 0; font-size: 1.05em; }
.fav-grab-bar .fg-up { grid-column: 2; grid-row: 1; }
.fav-grab-bar .fg-left { grid-column: 1; grid-row: 2; }
.fav-grab-bar .fg-right { grid-column: 3; grid-row: 2; }
.fav-grab-bar .fg-down { grid-column: 2; grid-row: 3; }
.fav-grab-bar .fg-ab { display: flex; flex-direction: column; gap: 0.4em; }
.fav-grab-bar .fg-ab .btn { min-width: 6em; min-height: 2.4em; }
.fav-grab-bar .fg-ab .btn.gold { color: var(--accent); border-color: var(--accent); }
`;

export function addR69Css() {
  if (typeof document === 'undefined' || document.getElementById('r69-css')) return;
  const st = document.createElement('style');
  st.id = 'r69-css';
  st.textContent = CSS;
  document.head.append(st);
}

addR69Css();

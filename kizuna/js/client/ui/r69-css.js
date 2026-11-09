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

/* 第71回: 戦いの説明の☆お気に入りと、その下の「Y：お気に入り」「長おし：お気に入り」 */
.b-info .favwrap { float: right; display: flex; flex-direction: column; align-items: center; margin: 0 0 0.15em 0.5em; }
.b-info .favwrap .favbtn { float: none; margin: 0; }
.b-info .favwrap .favkey { font-size: 0.66em; line-height: 1.2; margin-top: 0.08em; color: var(--accent); white-space: nowrap; opacity: 0.9; }
/* 第71回: メニューのお気に入り・覚えた技で、選んでいる技の説明（戦いの説明と同じ中身を短く） */
.fav-info { margin: 0.4em 0 0.1em; padding: 0.3em 0.5em; border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 6px; background: rgba(10, 12, 40, 0.6); font-size: 0.84em; line-height: 1.38; min-height: 4.1em; }
.fav-info .fi-h { color: var(--accent); }
.fav-info .fi-p { color: #ffe8a8; font-variant-numeric: tabular-nums; }
.fav-info .fi-d { color: #d8d6ee; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.fav-info .fi-t { display: inline-block; font-size: 0.8em; border: 1px solid currentColor; border-radius: 4px; padding: 0 0.3em; margin-left: 0.3em; color: var(--muted); }
.fav-grabbing .fav-info { min-height: 0; margin-top: 0.25em; padding-top: 0.2em; padding-bottom: 0.2em; }
.fav-grabbing .fav-info .fi-d { -webkit-line-clamp: 1; }
.fav-grabbing .fav-grab-bar { margin-top: 0.3em; }
.skills-view.fav-grabbing .sk-head .tab-hint { display: none; }
/* 第71回: 命令の一覧に出さない技（覚えた技・お気に入り・回復・回復以外）のしるし */
.menu .item .tag.cmdhide { color: #b8b6d0; border-color: #8a88a8; }
.menu .item.cmd-off > .l { opacity: 0.72; }
.menu.fav-grid .item.cmd-off { border-style: dashed; }
/* 第71回E: 覚えた技（2列のわく・種類で見る／職業で見る） */
.lv-bar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.3em 0.6em; margin: 0.3em 0 0.25em; }
.lv-bar .lv-views, .lv-bar .lv-secs { display: flex; gap: 0.25em; }
.lv-bar .btn { min-height: 0; padding: 0.15em 0.6em; font-size: 0.86em; border-radius: 6px; }
.lv-bar .btn.sel { color: var(--accent); border-color: var(--accent); background: rgba(255, 214, 107, 0.14); }
.lv-bar .btn:disabled { opacity: 0.35; }
.tabs.lv-tabs { display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 0.25em; margin: 0 0 0.35em; padding-bottom: 0.15em; scrollbar-width: thin; }
.tabs.lv-tabs .btn { flex: none; min-height: 0; padding: 0.15em 0.55em; font-size: 0.84em; white-space: nowrap; }
.tabs.lv-tabs .btn.now:not(.sel) { border-color: rgba(255, 214, 107, 0.5); }
.tabs.lv-tabs .btn.sel { color: var(--accent); border-color: var(--accent); background: rgba(255, 214, 107, 0.14); }
.menu.fav-grid .item .favmk { color: var(--accent); margin-right: 0.1em; }
.menu.fav-grid .item.dis { opacity: 0.55; }
.fav-info .fi-t.gold { color: var(--accent); }
.fav-info .fi-l { color: var(--muted); font-size: 0.86em; }
.fav-info.lv-info { position: sticky; bottom: 0; z-index: 2; background: var(--win-solid, #0b0d2c); box-shadow: 0 -6px 12px rgba(0, 0, 0, 0.55); }
.menu.learn-grid .item { scroll-margin-bottom: 8.5em; }
/* 第72回: 覚えた技の見方・呪文／特技・種類（職業）のタブも上にはりつく（.sk-head の中）。技のわくだけがスクロールする */
.skills-view .sk-head.lv-head { padding-bottom: 0.2em; box-shadow: 0 -1.2em 0 var(--win-solid), 0 7px 9px -7px rgba(0, 0, 0, 0.75); }
.skills-view .sk-head.lv-head > .tabs:first-child { margin-bottom: 0.15em; }
.skills-view .sk-head .lv-bar { margin: 0.1em 0 0.2em; }
.skills-view .sk-head .tabs.lv-tabs { margin-bottom: 0.1em; }
.skills-view .sk-head.lv-head .tab-hint { margin: 0.05em 0 0; }
/* 下にはりつくせつめい（覚えた技・お気に入り）の高さぶん、カーソルの技を上に出す（--sk-info-h は client/ui/menu.js の stickInfo がはかる） */
.skills-view.sticky-info .menu.fav-grid .item { scroll-margin-bottom: var(--sk-info-h, 8.5em); }
`;

export function addR69Css() {
  if (typeof document === 'undefined' || document.getElementById('r69-css')) return;
  const st = document.createElement('style');
  st.id = 'r69-css';
  st.textContent = CSS;
  document.head.append(st);
}

addR69Css();

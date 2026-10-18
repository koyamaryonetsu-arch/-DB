// 第35回 A（画面と そうさ）の CSS。css/style.css は ほかの 人も かえるので、ここで 入れる（よみこんだ ときに 1回だけ）
//   ・戦いの 技の タブ（.b-tabs）・弱点の しるし（.tag.weak）
//   ・職業の 短い 名前（戦いの まど .b-mem .jb・メニューの .fm-mem .jb・全員の 一覧）
//   ・お知らせ（.news-*・メニューボタンの ●）・道具の タブ（.item-tabs）・れん金の ボタン
const CSS = `
/* 戦いの 技の タブ（client/battle.js の abilityMenu）。入りきらない ときは よこに スクロール */
.b-tabs { display: flex; gap: 0.25em; overflow-x: auto; overflow-y: hidden; flex: none; margin: 0 0 0.3em; padding: 0.1em 0.05em 0.15em; scrollbar-width: none; touch-action: pan-x; }
.b-tabs::-webkit-scrollbar { display: none; }
.b-tabs .bt { flex: none; font-size: calc(var(--fs-small) * 0.88); padding: 0.12em 0.55em; min-height: 0; white-space: nowrap; border-width: 1px; color: var(--muted); }
.b-tabs .bt.sel { color: #fff; border-color: var(--accent); background: rgba(255, 214, 107, 0.18); box-shadow: 0 0 0 1px var(--accent); }
.b-tabs .bt.bt-fav { color: var(--accent); }
.b-tabs .bt.bt-back { position: sticky; left: 0; z-index: 1; background: var(--win-solid, #07071a); color: var(--text, #fff); padding-left: 0.5em; padding-right: 0.5em; }
.b-cmd.has-tabs .menu .backchip { display: none; }
.menu .tag.weak { color: #ffd66b; border-color: #ffd66b; background: rgba(255, 140, 60, 0.28); font-size: 0.62em; }
@media (orientation: landscape) and (max-height: 500px) {
  .b-tabs { margin-bottom: 0.2em; }
  .b-tabs .bt { font-size: calc(var(--fs-small) * 0.82); padding: 0.05em 0.45em; }
}

/* 職業の 短い 名前 */
.b-mem .nm .jb, .fm-mem .jb { color: #b8c4ff; font-size: 0.78em; margin-left: 0.3em; white-space: nowrap; }
.fm-mem > .jb { margin-left: 0; font-size: 0.82em; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; }
@media (max-width: 700px) and (orientation: portrait) { .fm-mem > .jb { display: none; } }
/* たての 戦い: 5人の ときの 上の 3人は せまいので 出さない（仲間の しるしと おなじ） */
@media (max-aspect-ratio: 1/1) { .b-status[data-n="5"] .b-mem:nth-child(-n + 3) .jb { display: none; } }
.cmp-list .jb, .all-status .jb { color: #b8c4ff; font-size: 0.8em; white-space: nowrap; }

/* 道具の タブ（client/ui/menu.js の itemsList） */
.items-view > .item-tabs { flex: none; display: flex; gap: 0.3em; flex-wrap: wrap; margin-bottom: 0.3em; }
.items-view > .item-tabs .btn { font-size: var(--fs-small); padding: 0.1em 0.7em; min-height: 0; }
.items-view > .item-tabs .btn.sel { color: #fff; border-color: var(--accent); background: rgba(255, 214, 107, 0.18); }
.items-view > .tab-hint { flex: none; }

/* 十字キーの カーソル（client/ui/padnav.js。ボタンの ならんだ 画面） */
.pad-focus { outline: 3px solid #ffd66b !important; outline-offset: 2px !important; box-shadow: 0 0 0 2px #04061a, 0 0 12px rgba(255, 214, 107, 0.8) !important; }
input.pad-focus { outline-offset: 0; }

/* れん金がまの ボタン（client/ui/hud.js） */
.hud-btn.hud-pot { color: #ffe9a8; border-color: #c9a24a; }

/* お知らせ（client/ui/news.js） */
.news-view .news-row .l { white-space: normal; }
.news-view .news-row .nd { color: var(--muted); font-size: 0.8em; margin-right: 0.4em; }
.news-view .news-row.unread .l::after { content: '●'; color: #ff6b6b; font-size: 0.7em; margin-left: 0.3em; vertical-align: 0.15em; }
.news-body { white-space: pre-line; line-height: 1.6; }
.news-body .nb-date { color: var(--muted); font-size: 0.85em; }
.menu .item.has-new .l::after, .hud-btn.has-new::after { content: '●'; color: #ff6b6b; font-size: 0.7em; margin-left: 0.25em; vertical-align: 0.2em; }
`;

export function addR35Css() {
  if (typeof document === 'undefined' || document.getElementById('r35a-css')) return;
  const st = document.createElement('style');
  st.id = 'r35a-css';
  st.textContent = CSS;
  document.head.append(st);
}

addR35Css();

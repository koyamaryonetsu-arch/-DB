// 第78回: 冒険のしおり（client/ui/shiori.js）の CSS。css/style.css は ほかの 人も かえるので、ここで 入れる（よみこんだ ときに 1回だけ）
//   画面を 大きく 使う まど 1まい（第76回の はり紙・装備の まどと おなじ 考え。小さく まとめない）
//   よこ画面・PC: のこって いる ことは 2〜3列。たて画面: 1列。どちらも 横には はみ出さない
const CSS = `
.shiori-pop {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 5;
  width: min(calc(100% - 12px), 1180px);
  height: calc(100% - 12px - var(--safe-t) - var(--safe-b));
  display: flex; flex-direction: column; min-width: 0;
  font-size: calc(var(--fs) * 1.04);
  background: var(--win-solid);
  padding: 0.5em 0.8em 0.6em;
  overflow: hidden;
}
.shiori-pop .sh-head { flex: none; display: flex; align-items: center; gap: 0.4em 0.8em; flex-wrap: wrap; margin-bottom: 0.35em; }
.shiori-pop .sh-title { margin: 0; font-size: 1.25em; color: var(--accent); letter-spacing: 0.08em; font-weight: bold; }
.shiori-pop .sh-who { color: var(--muted); font-size: var(--fs-small); }
.shiori-pop .sh-close { margin-left: auto; flex: none; }
.shiori-pop .sh-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; padding-right: 0.15em; }
.shiori-pop .sh-foot { flex: none; color: var(--muted); font-size: var(--fs-small); margin-top: 0.3em; text-align: center; }

.shiori-pop .menu.sh-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(16em, 1fr)); gap: 0.45em 0.6em; align-content: start; }
.shiori-pop .menu.sh-list .hdr { grid-column: 1 / -1; font-size: calc(var(--fs) * 0.92); letter-spacing: 0.12em; padding: 0.35em 0.2em 0.1em; }
.shiori-pop .menu.sh-list .item { min-width: 0; border: 2px solid rgba(255, 255, 255, 0.22); border-radius: 8px; background: rgba(255, 255, 255, 0.04); padding: 0.35em 0.6em 0.4em 1.2em; align-items: flex-start; }
.shiori-pop .menu.sh-list .item > .l { min-width: 0; flex: 1 1 auto; white-space: normal; overflow-wrap: anywhere; }
.shiori-pop .menu.sh-list .item.sel { border-color: var(--accent); background: rgba(255, 214, 107, 0.13); }
.shiori-pop .menu.sh-list .item.sh-wide { grid-column: 1 / -1; }

/* story */
.sh-story .sh-st-label { color: var(--accent); font-weight: bold; }
.sh-story .sh-st-title { font-size: 1.12em; font-weight: bold; color: #fff; line-height: 1.35; }
.sh-story .sh-st-clear { color: var(--good); font-weight: bold; margin-left: 0.4em; }
.sh-story .sh-st-obj { margin-top: 0.25em; line-height: 1.5; white-space: pre-line; }
.sh-where { margin-top: 0.2em; color: #8fd0ff; line-height: 1.4; }
.sh-where::before { content: '▶'; font-size: 0.75em; margin-right: 0.35em; vertical-align: 0.1em; }

/* recs */
.sh-rec .sh-rec-tag { display: inline-block; font-size: var(--fs-small); border: 1px solid currentColor; border-radius: 4px; padding: 0 0.4em; margin-right: 0.4em; vertical-align: 0.08em; }
.sh-rec.story .sh-rec-tag { color: #ff8fd8; }
.sh-rec.side .sh-rec-tag { color: #7dffb0; }
.sh-rec .sh-rec-text { line-height: 1.45; }

/* tracks */
.sh-track .sh-tr-top { display: flex; align-items: baseline; gap: 0.5em; }
.sh-track .sh-tr-name { flex: 1 1 auto; min-width: 0; font-weight: bold; }
.sh-track .sh-tr-num { flex: none; color: var(--accent); font-variant-numeric: tabular-nums; white-space: nowrap; }
.sh-track.full .sh-tr-num { color: var(--good); }
.sh-bar { height: 0.6em; border-radius: 0.3em; background: rgba(255, 255, 255, 0.13); overflow: hidden; margin: 0.3em 0 0.15em; }
.sh-bar i { display: block; height: 100%; background: linear-gradient(90deg, #8a6bff, #ffd66b); }
.sh-track.full .sh-bar i { background: #7dffb0; }
.sh-track .sh-tr-note { color: var(--muted); font-size: var(--fs-small); line-height: 1.4; }

/* detail */
.sh-detail-top { flex: none; padding: 0.4em 0.6em 0.5em; margin-bottom: 0.45em; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.18); }
.sh-detail-top .sh-tr-top { display: flex; align-items: baseline; gap: 0.6em; font-size: 1.1em; }
.sh-detail-top .sh-tr-name { flex: 1 1 auto; min-width: 0; font-weight: bold; color: #fff; }
.sh-detail-top .sh-tr-num { color: var(--accent); white-space: nowrap; }
.sh-detail-top .sh-note { white-space: pre-line; line-height: 1.5; margin-top: 0.2em; }
.sh-detail-top .sh-hint { margin-top: 0.3em; padding: 0.3em 0.5em; border-left: 3px solid var(--accent); background: rgba(255, 214, 107, 0.08); line-height: 1.5; }
.shiori-pop .menu.sh-dlist { display: grid; grid-template-columns: repeat(auto-fill, minmax(19em, 1fr)); gap: 0.35em 0.6em; align-content: start; }
.shiori-pop .menu.sh-dlist .hdr { grid-column: 1 / -1; }
.shiori-pop .menu.sh-dlist .item { min-width: 0; border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 6px; padding: 0.3em 0.5em 0.3em 1.2em; align-items: center; gap: 0.5em; }
.shiori-pop .menu.sh-dlist .item > .l { min-width: 0; flex: 1 1 auto; white-space: normal; overflow-wrap: anywhere; line-height: 1.35; }
.shiori-pop .menu.sh-dlist .item > .r { flex: none; max-width: 45%; white-space: normal; text-align: right; }
.shiori-pop .menu.sh-dlist .item.sel { background: rgba(255, 214, 107, 0.13); border-color: var(--accent); }
.shiori-pop .menu.sh-dlist .item.st-done { opacity: 0.62; }
.shiori-pop .menu.sh-dlist .item.st-unknown .l { color: var(--muted); letter-spacing: 0.1em; }
.shiori-pop .menu.sh-dlist .item.st-open .r { color: var(--good); }
.shiori-pop .menu.sh-dlist .item.st-now .r { color: #8fd0ff; }
.shiori-pop .sh-dname { display: block; }
.shiori-pop .sh-dwhere { display: block; color: var(--muted); font-size: var(--fs-small); }

/* preview */
.sh-pv .sh-pv-story { color: var(--accent); }
.sh-pv .sh-pv-rec { margin-top: 0.25em; line-height: 1.45; }

@media (orientation: portrait) {
  .shiori-pop { padding: 0.4em 0.5em 0.5em; }
  .shiori-pop .menu.sh-list, .shiori-pop .menu.sh-dlist { grid-template-columns: minmax(0, 1fr); }
}
@media (max-height: 460px) {
  .shiori-pop { font-size: var(--fs); padding: 0.3em 0.6em 0.4em; }
  .shiori-pop .sh-foot { display: none; }
  .shiori-pop .sh-head { margin-bottom: 0.2em; }
}
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('r78-shiori-css')) return;
  const st = document.createElement('style');
  st.id = 'r78-shiori-css';
  st.textContent = CSS;
  document.head.append(st);
}
addCss();

// 第78回 3-10: 家族ミッション（client/ui/missions.js）の CSS。css/style.css は ほかの 人も かえるので、ここで 入れる（よみこんだ ときに 1回だけ）
//   冒険のしおり（r78-shiori-css.js）と おなじ 大きさの まど。よこ画面・PC は 2〜3列、たて画面は 1列。横には はみ出さない
const CSS = `
.mission-pop {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 5;
  width: min(calc(100% - 12px), 1180px);
  height: calc(100% - 12px - var(--safe-t) - var(--safe-b));
  display: flex; flex-direction: column; min-width: 0;
  font-size: calc(var(--fs) * 1.04);
  background: var(--win-solid);
  padding: 0.5em 0.8em 0.6em;
  overflow: hidden;
}
.mission-pop .ms-head { flex: none; display: flex; align-items: center; gap: 0.4em 0.8em; flex-wrap: wrap; margin-bottom: 0.35em; }
.mission-pop .ms-title { margin: 0; font-size: 1.25em; color: var(--accent); letter-spacing: 0.08em; font-weight: bold; }
.mission-pop .ms-days { color: #8fd0ff; font-size: var(--fs-small); }
.mission-pop .ms-close { margin-left: auto; flex: none; }
.mission-pop .ms-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; padding-right: 0.15em; }
.mission-pop .ms-foot { flex: none; color: var(--muted); font-size: var(--fs-small); margin-top: 0.3em; text-align: center; }

.mission-pop .menu.ms-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(17em, 1fr)); gap: 0.45em 0.6em; align-content: start; }
.mission-pop .menu.ms-list .hdr { grid-column: 1 / -1; font-size: calc(var(--fs) * 0.92); letter-spacing: 0.1em; padding: 0.35em 0.2em 0.1em; }
.mission-pop .menu.ms-list .item { min-width: 0; border: 2px solid rgba(255, 255, 255, 0.22); border-radius: 8px; background: rgba(255, 255, 255, 0.04); padding: 0.35em 0.6em 0.4em 1.2em; align-items: flex-start; }
.mission-pop .menu.ms-list .item > .l { min-width: 0; flex: 1 1 auto; white-space: normal; overflow-wrap: anywhere; }
.mission-pop .menu.ms-list .item > .r { flex: none; color: var(--good); white-space: nowrap; }
.mission-pop .menu.ms-list .item.sel { border-color: var(--accent); background: rgba(255, 214, 107, 0.13); }
.mission-pop .menu.ms-list .item.ms-wide { grid-column: 1 / -1; }
.mission-pop .menu.ms-list .item.ms-card.done { border-color: rgba(125, 255, 176, 0.55); }
.mission-pop .menu.ms-list .item.ms-claim { border-color: #ffd66b; background: rgba(255, 214, 107, 0.16); }
.mission-pop .menu.ms-list .item.ms-claim .ms-big { color: var(--accent); }
.mission-pop .menu.ms-list .item.ms-stat.me { border-color: #8fd0ff; }
.mission-pop .menu.ms-list .item.ms-backrow { grid-column: 1 / -1; justify-content: center; }

.ms-card .ms-top { display: flex; align-items: flex-start; gap: 0.4em; }
.ms-card .ms-text { flex: 1 1 auto; min-width: 0; font-weight: bold; line-height: 1.4; }
.ms-tag { flex: none; font-size: var(--fs-small); border: 1px solid currentColor; border-radius: 4px; padding: 0 0.4em; white-space: nowrap; }
.ms-tag.ok { color: #7dffb0; }
.ms-tag.got { color: var(--muted); }
.ms-bar { height: 0.7em; border-radius: 0.35em; background: rgba(255, 255, 255, 0.13); overflow: hidden; margin: 0.35em 0 0.15em; }
.ms-bar i { display: block; height: 100%; background: linear-gradient(90deg, #8a6bff, #ffd66b); }
.ms-bar.done i { background: #7dffb0; }
.ms-sub { display: flex; gap: 0.8em; align-items: baseline; }
.ms-num { color: var(--accent); font-variant-numeric: tabular-nums; }
.ms-mine { color: #8fd0ff; font-size: var(--fs-small); }
.ms-rew { color: var(--muted); font-size: var(--fs-small); line-height: 1.4; }
.ms-big { font-weight: bold; line-height: 1.4; }
.ms-note { color: var(--muted); font-size: var(--fs-small); line-height: 1.45; white-space: pre-line; }
.ms-off { font-size: 1.15em; font-weight: bold; color: var(--accent); line-height: 1.5; margin-bottom: 0.3em; }
.ms-stat .ms-k { font-weight: bold; line-height: 1.4; }
.ms-stat .ms-v { color: var(--accent); font-size: 1.15em; font-variant-numeric: tabular-nums; }

.ms-pv .ms-pv-off { margin-top: 0.4em; color: var(--accent); }
.ms-pv .ms-pv-days { margin-top: 0.4em; color: #8fd0ff; }
.ms-pv .ms-pv-row { margin-top: 0.25em; line-height: 1.45; display: flex; gap: 0.6em; justify-content: space-between; }
.ms-pv .ms-pv-num { flex: none; color: var(--accent); }

@media (orientation: portrait) {
  .mission-pop { padding: 0.4em 0.5em 0.5em; }
  .mission-pop .menu.ms-list { grid-template-columns: minmax(0, 1fr); }
}
@media (max-height: 460px) {
  .mission-pop { font-size: var(--fs); padding: 0.3em 0.6em 0.4em; }
  .mission-pop .ms-foot { display: none; }
  .mission-pop .ms-head { margin-bottom: 0.2em; }
}
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('r78-mission-css')) return;
  const st = document.createElement('style');
  st.id = 'r78-mission-css';
  st.textContent = CSS;
  document.head.append(st);
}
addCss();

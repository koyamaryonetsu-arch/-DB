// 第83回 B班: ぬ〜べ〜の 系統の 戦いの 画面（shared/battle-r83b.js の しくみを 見せる）
//  ・おにの手（pub の oni … 今の ＋％）: 仲間の まどに 赤い「おにの手+45%」の 札。かくせいの 間は「かくせい3」（のこりの 番）も
//    家族の ほかの 人の 画面にも 出る（pub は みんなに とどく）
//  ・体をはって守る（teShield）: 「体をはる」の 札（かばう の 札も 出る）
//  ・おにの手を 出した（ev.oniOn）: バナー「おにの手！」と まどが 赤く 光る。ふういんに もどった（ev.oniOff）: まどが 白く 光る
//  ・番の はじめに 強く なった（ev.oniUp）: まどが 赤く 光る（HP の へった 数は ev.results の ふつうの 数字で 出る）
//  ・生徒を 守る（ev.r83bCover）: バナー「先生が、かばった！」と、かばった 先生と かばわれた 仲間の まどが 光る
// client/battle.js の アクションの とちゅう（r83bPresent）・battle-buffs.js の 札（r83bMarks）から よぶ

const CSS = `
.b-mem .sts .bm.oni { color: #ff8a7a; background: rgba(220, 30, 30, 0.25); font-weight: bold; }
.b-mem .sts .bm.oak { color: #ffe0a0; background: rgba(255, 60, 20, 0.35); }
`;
if (typeof document !== 'undefined' && !document.getElementById('r83b-css')) {
  const s = document.createElement('style');
  s.id = 'r83b-css';
  s.textContent = CSS;
  document.head.append(s);
}

// 仲間の まどの 札（battle-buffs.js の unitMarks。a … pub）
export function r83bMarks(a) {
  const out = [];
  if (a?.side !== 'ally' || a.alive === false) return out;
  if (a.oni > 0) out.push({ text: `おにの手+${a.oni}%`, cls: 'oni' });
  if (a.oniAwake > 0) out.push({ text: `かくせい${a.oniAwake}`, cls: 'oak' });
  if (a.teShield) out.push({ text: '体をはる', cls: 'up' });
  return out;
}

// アクションの えんしゅつ（client/battle.js の 表示の とちゅう。apply の 前に よぶ）
export function r83bPresent(view, ev) {
  const g = view.game;
  if (ev.oniOn) {
    view.glowStatus(ev.oniOn, '#ff3a2a');
    view.banner('おにの手！', 'danger');
    g.audio.sfx('warn');
  } else if (ev.oniUp) view.glowStatus(ev.oniUp, '#ff6a4a');
  if (ev.oniOff) view.glowStatus(ev.oniOff, '#ffffff');
  if (ev.r83bCover) {
    view.banner('先生が、かばった！', 'combo');
    view.glowStatus(ev.r83bCover.by, '#9ad8ff');
    view.glowStatus(ev.r83bCover.to, '#fff2a8');
  }
}

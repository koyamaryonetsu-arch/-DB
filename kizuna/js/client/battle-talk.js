// 第105回: 戦いの 中の 会話を 1行ずつ 読む（画面の がわ。サーバーは shared/battle-talk.js。docs/plan-r105-battle-talk.md）
//
// ・会話の イベント（ev.talk … 番号）は メッセージの まどに 1行ずつ 出す。前の 行は 上に のこす（多い 時は 古い 方から 消える）
// ・自分の キャラに オートで ない 人が いる（サーバーが 待つ 人）… 1行 出したら 止まり、まどの すみに ▼。
//   タップ・クリック（戦いの 画面の どこでも）・Enter／スペース／Z・コントローラーの A（B でも）で 次の 行
// ・自分の キャラが みんな オート … 読める 速さ（talkLineMs）で 自動で 流れる。とちゅうで オートを 切ったら そこから タップで 進む
// ・さいごの 行の あと サーバーに 読み終わり（{ t: 'battle', talk: 番号 }）。ほかの 人が まだ 読んで いる 間は
//   「ほかの人が読み終わるのを待っています」（サーバーの { t: 'talkDone' } が 来るまで）
// ・会話の 間（ほかの 人を 待つ 間も）は コマンドを えらべない（コマンドの まどに おおい・キーは 会話が うける）。
//   ゲージの 見た目も 止まる。作戦の まど・オートの 切りかえは 使える
// ・戦いの とちゅうの 場面（八つめの 音 など。SCENE_KEYS）も 同じ（場面の 絵は ボスの 画面の ファイルが 出す。scene.talkScene）
import { el } from './ui/dom.js?v=71ec2a6ff6b8';
import { talkLinesOf, talkLineMs } from '../shared/battle-talk.js?v=71ec2a6ff6b8';

// 1行を 出してから タップを うけつける までの 時間（2回 おしで とばさない）
const TAP_GUARD_MS = 180;
// 読み終わってから「ほかの人が…」を 出す までの 時間（すぐ 次へ 進む 時は 出さない）
const OTHERS_DELAY_MS = 450;
export const TALK_WAIT_TEXT = 'ほかの人が読み終わるのを待っています…';

// サーバーが 自分を 待つか（自分の キャラに オートで ない 人が いる）
export function talkManual(scene) {
  if (!scene.talkWait) return false;
  return scene.mine.some((id) => {
    const c = scene.c.get(id);
    return c && !c.auto && !c.fled;
  });
}

// 会話を 読んで いる・ほかの 人を 待って いる（コマンドを えらべない・ゲージが 止まる）
export function talkBusy(scene) {
  return !!scene.talk || (scene.talkPend || 0) > (scene.talkDone || 0);
}

// 戦いの 画面を 作った あと（battle.js の build）
export function talkBind(scene) {
  scene.talk = null;
  scene.talkPend = 0;
  scene.talkDone = 0;
  scene.talkHandler = { onNav: (a) => { if (a === 'a' || a === 'b') talkTap(scene); } };
  // 戦いの 画面の どこを さわっても 次へ（オート・作戦・合体技の さそいの まどは そのまま 使える）
  scene.onTalkClick = (e) => {
    if (!scene.talk || !talkManual(scene)) return;
    if (e.target?.closest?.('.b-tools, .b-mem, .b-tactics, .dual-invite, .b-padhint, .b-result')) return;
    e.stopPropagation();
    e.preventDefault();
    talkTap(scene);
  };
  scene.root.addEventListener('click', scene.onTalkClick, true);
}

export function talkUnbind(scene) {
  scene.root?.removeEventListener('click', scene.onTalkClick, true);
  talkUi(scene, false);
  scene.talk = null;
}

// とちゅうから 入った・つなぎ直した: 今 待って いる 会話は 見て いないので 読んだ ことに する
export function talkSnap(scene, snap) {
  const seq = snap?.talkSeq || 0;
  if (seq && scene.talkWait) scene.game.net.send({ t: 'battle', talk: seq });
}

// サーバーの { t: 'talkDone', seq }（みんな 読み終わった）
export function talkDoneEv(scene, ev) {
  scene.talkDone = Math.max(scene.talkDone || 0, ev.seq || 0);
}

// 会話の イベントを 見せる（battle.js の present。presentBody の あと）
export function talkStart(scene, ev) {
  const lines = talkLinesOf(ev).filter((l) => typeof l === 'string');
  const t = { ev, seq: ev.talk, lines, i: -1, wait: 0, shownAt: 0, ctl: scene.talkScene || null };
  scene.talkScene = null;
  scene.talk = t;
  scene.msgEl.innerHTML = '';
  scene.msgEl.classList.remove('info');
  scene.msgEl.classList.add('talk');
  talkUi(scene, true);
  talkNextLine(scene);
}

function talkNextLine(scene) {
  const t = scene.talk;
  if (!t) return;
  t.i++;
  scene.msgEl.querySelector('.talk-mark')?.remove();
  if (t.i >= t.lines.length) return talkFinish(scene);
  const line = t.lines[t.i];
  // 場面（八つめの 音 など）は 絵の 上の 文も かえる
  t.ctl?.show?.(t.i);
  scene.msgEl.querySelectorAll('.ln.now').forEach((x) => x.classList.remove('now'));
  scene.msgEl.append(el('div', { class: 'ln now', text: line }));
  while (scene.msgEl.querySelectorAll('.ln').length > 7) scene.msgEl.querySelector('.ln')?.remove();
  scene.msgEl.append(el('div', { class: 'talk-mark', text: '▼' }));
  t.shownAt = performance.now();
  t.wait = talkLineMs(t.ev, scene.textSpeed);
  scene.msgEl.classList.toggle('talk-auto', !talkManual(scene));
}

// タップ・決定（自分が 読む 人の 時だけ）
export function talkTap(scene) {
  const t = scene.talk;
  if (!t || !talkManual(scene)) return false;
  if (performance.now() - t.shownAt < TAP_GUARD_MS) return true;
  scene.game.audio?.sfx?.('cursor');
  talkNextLine(scene);
  return true;
}

function talkFinish(scene) {
  const t = scene.talk;
  scene.talk = null;
  scene.msgEl.classList.remove('talk-auto');
  t.ctl?.end?.();
  if (scene.talkWait && t.seq) {
    scene.game.net.send({ t: 'battle', talk: t.seq });
    scene.talkPend = Math.max(scene.talkPend || 0, t.seq);
    scene.talkPendAt = performance.now();
  }
  // つぎの イベントへ（battle.js の update）
  scene.showing = null;
}

// まいフレーム（battle.js の update）
export function talkUpdate(scene, dt) {
  const t = scene.talk;
  if (t && !talkManual(scene)) {
    scene.msgEl.classList.add('talk-auto');
    t.wait -= dt;
    if (t.wait <= 0) talkNextLine(scene);
  } else if (t) scene.msgEl.classList.remove('talk-auto');
  // ほかの 人を 待って いる
  const others = !scene.talk && (scene.talkPend || 0) > (scene.talkDone || 0);
  let w = scene.msgEl.querySelector('.talk-wait');
  if (others && performance.now() - (scene.talkPendAt || 0) >= OTHERS_DELAY_MS && !w && !scene.queue.length) {
    w = el('div', { class: 'ln talk-wait', text: TALK_WAIT_TEXT });
    scene.msgEl.append(w);
  } else if (!others && w) w.remove();
  if (scene.talkUiOn && !talkBusy(scene)) talkUi(scene, false);
}

// 会話の 間の 画面（コマンドの まどに おおい・キーを 会話が うける）
function talkUi(scene, on) {
  if (!!scene.talkUiOn === on) return;
  scene.talkUiOn = on;
  scene.root?.classList.toggle('b-talking', on);
  const input = scene.game.input;
  if (on) {
    scene.menu?.blur();
    // 作戦・合体技の さそいの まどが 出て いる 時は その 下に（とじると 会話に もどる）
    const top = scene.tac?.menu?.handler || scene.invite?.menu?.handler;
    const i = top ? input.stack.lastIndexOf(top) : -1;
    if (i >= 0) {
      input.stack.splice(i, 0, scene.talkHandler);
      input.onStack?.();
    } else input.push(scene.talkHandler);
    return;
  }
  input.pop(scene.talkHandler);
  scene.msgEl?.classList.remove('talk');
  scene.msgEl?.querySelector('.talk-wait')?.remove();
  if (scene.destroyed || scene.ended) return;
  // 前の ようすに もどす（開いて いた コマンドの まど・えらぶ 番の キャラ）
  if (!scene.tac && !scene.invite) scene.menu?.focus();
  if (!scene.cur && scene.readyQ.length) scene.nextCommand();
}

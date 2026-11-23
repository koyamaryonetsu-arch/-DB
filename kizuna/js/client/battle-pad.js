// 第35回 A: 戦いの 中で、タップ しか できなかった ことを コントローラー・キーボードでも（SELECT／M キー）
//   ・オートにする／やめる（右上の「オート」ボタン）
//   ・自分と 仲間の 作戦を 変える（つよさの まどを タップ）
//   ・合体技の よやくを やめる（「よやくをやめる」ボタン）
// まどは 作戦の まどと おなじ 場所・おなじ しくみ（battle.js の tac・closeTactics）
// 第100回 U1: コントローラーで 作戦を かえられない（SELECT を 知らない・SELECT の ない／番号の ちがう コントローラー）
//   ・コマンドの まどに「作戦」（十字キーと A だけで 行ける。番は 使わない。とじると コマンドの まどに もどる）
//   ・START（9）でも 開く（まどが 何も ない 時・コマンドの まどが いちばん 上の 時。ほかの まどでは 今までどおり もどる）
//   ・コントローラーが つながって いる 時は「オート」の 下に 小さく「SELECT／START：作戦」
//   ・作戦を えらんだら、だれの 作戦を かえたかを 知らせる
import { el, ListMenu, toast } from './ui/dom.js?v=96e031897dcd';
import { TACTICS } from '../shared/ai.js?v=96e031897dcd';

// コマンドの まどの「作戦」（battle.js の openCommand が 一覧の さいごに 入れる）
export const TACTICS_CMD = Object.freeze({ label: '作戦', value: 'tactics', cls: 'k-tac', title: '作戦をかえる（ターンは使わない）' });

// えらんだ あとの 知らせ（battle.js の tacticsMenu）。かえた 時は サーバーが「〇〇の作戦を「…」にした。」を 送る
//   （world/tactics.js の menuRes）ので、ここは 同じ 作戦を えらんだ 時だけ（何も 出ないと 決まったか わからない）
export function tacticsToast(a, value, now) {
  const name = TACTICS[value]?.name;
  if (!a || !name || value !== now) return;
  toast(`${a.name}の作戦は「${name}」のまま`, 2400);
}

// コマンドの まど（戦う・呪文…）が いちばん 上か
function cmdOnTop(scene) {
  const input = scene.game.input;
  const top = input.stack[input.stack.length - 1];
  const m = scene.menu;
  return !!m && !!top && top === m.handler && m.items.includes(TACTICS_CMD);
}

// START: まどが 何も ない 時・コマンドの まどが いちばん 上の 時は 戦いのメニュー（もどりち: うけとったか。false なら 今までどおり B）
export function battleStart(scene) {
  if (scene.tac) return false;
  const input = scene.game.input;
  if (input.stack.length && !cmdOnTop(scene)) return false;
  return battlePadMenu(scene);
}

// その 戦いで SELECT／M・START を うけとる（Input の hot。もどりち: うけとったか）
export function bindBattlePad(scene) {
  const input = scene.game.input;
  const hot = (a) => (a === 'map' ? battlePadMenu(scene) : a === 'start' ? battleStart(scene) : false);
  input.hot = hot;
  // コントローラーの ヒント（オートの ボタンの 下。タッチだけの 時は 出さない）
  const hint = el('button', {
    class: 'b-padhint',
    text: 'SELECT／START：作戦',
    title: '戦いのメニュー（オート・作戦）',
    onclick: (e) => {
      e.stopPropagation();
      battlePadMenu(scene);
    },
  });
  hint.hidden = true;
  const tick = () => {
    const btn = scene.autoBtn;
    if (!btn) return;
    if (!hint.isConnected && btn.parentElement) btn.after(hint);
    hint.hidden = !input.pad?.on || btn.hidden || !!scene.ended;
  };
  const timer = setInterval(tick, 400);
  setTimeout(tick, 0);
  return () => {
    clearInterval(timer);
    hint.remove();
    if (input.hot === hot) input.hot = null;
  };
}

export function battlePadMenu(scene) {
  if (scene.destroyed || scene.ended || scene.closeResult || scene.favPop || scene.invite) return false;
  // もう 開いている（この まど・作戦の まど）: とじる
  if (scene.tac) {
    scene.closeTactics();
    return true;
  }
  const a = scene.primary;
  const items = [];
  if (a) items.push({ label: a.auto ? 'オートをやめる' : 'オートにする', value: { k: 'auto' } });
  for (const x of scene.allies()) {
    if (!scene.canTactics(x)) continue;
    const now = TACTICS[x.tactics || 'balanced']?.name || '';
    items.push({ label: `${x.name}の作戦`, right: now, value: { k: 'tac', id: x.id } });
  }
  const dualWait = [...scene.c.values()].find((x) => scene.mine.includes(x.id) && x.waitDual);
  if (dualWait) items.push({ label: '合体技のよやくをやめる', value: { k: 'dual', id: dualWait.id } });
  if (!items.length) return false;
  items.push({ label: 'とじる', value: null });
  const m = new ListMenu(scene.game.input, {
    items,
    sound: (x) => scene.game.audio.sfx(x),
    back: null,
    onSelect: (it) => {
      scene.closeTactics();
      const v = it.value;
      if (!v) return;
      if (v.k === 'auto') scene.toggleAuto();
      else if (v.k === 'tac') scene.tacticsMenu(v.id);
      else if (v.k === 'dual') scene.game.net.send({ t: 'battle', actor: v.id, cmd: { type: 'dualCancel' } });
    },
    onCancel: () => scene.closeTactics(),
  });
  const box = el('div', { class: 'win b-tactics b-padmenu' }, el('div', { class: 'bt-t', text: '戦いのメニュー' }), m.root);
  box.addEventListener('click', (e) => e.stopPropagation());
  scene.root.append(box);
  scene.menu?.blur();
  m.focus();
  scene.tac = { id: null, box, menu: m };
  scene.game.audio.sfx('cursor');
  return true;
}

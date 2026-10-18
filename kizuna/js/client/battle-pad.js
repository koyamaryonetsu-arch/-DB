// 第35回 A: 戦いの 中で、タップ しか できなかった ことを コントローラー・キーボードでも（SELECT／M キー）
//   ・オートにする／やめる（右上の「オート」ボタン）
//   ・自分と 仲間の 作戦を 変える（つよさの まどを タップ）
//   ・合体技の よやくを やめる（「よやくをやめる」ボタン）
// まどは 作戦の まどと おなじ 場所・おなじ しくみ（battle.js の tac・closeTactics）
import { el, ListMenu } from './ui/dom.js?v=a21d4486f121';

// その 戦いで SELECT／M を うけとる（Input の hot。もどりち: うけとったか）
export function bindBattlePad(scene) {
  const input = scene.game.input;
  const hot = (a) => (a === 'map' ? battlePadMenu(scene) : false);
  input.hot = hot;
  return () => { if (input.hot === hot) input.hot = null; };
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
  for (const x of scene.allies()) if (scene.canTactics(x)) items.push({ label: `${x.name}の作戦`, value: { k: 'tac', id: x.id } });
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

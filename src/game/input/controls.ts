// 入力管理: キーボード / ゲームパッド / タッチを「アクション」に正規化する。
// キーコンフィグは settings.keymap を参照。

import { G } from '../store';

export type Action = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'menu' | 'dash';

const ACTIONS: Action[] = ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'menu', 'dash'];

class Controls {
  private held = new Set<Action>();
  private pressedQueue = new Set<Action>();
  private padPrev: Record<number, boolean> = {};
  private attached = false;
  /** キーコンフィグ画面がキー捕獲中は通常入力を止める */
  captureCallback: ((code: string) => void) | null = null;

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener('keydown', (e) => {
      if (this.captureCallback) {
        e.preventDefault();
        const cb = this.captureCallback;
        this.captureCallback = null;
        cb(e.code);
        return;
      }
      const action = this.actionForCode(e.code);
      if (!action) return;
      e.preventDefault();
      if (!e.repeat && !this.held.has(action)) this.pressedQueue.add(action);
      this.held.add(action);
    });
    window.addEventListener('keyup', (e) => {
      const action = this.actionForCode(e.code);
      if (action) this.held.delete(action);
    });
    window.addEventListener('blur', () => {
      this.held.clear();
    });
  }

  private actionForCode(code: string): Action | null {
    const keymap = G.settings.keymap;
    for (const a of ACTIONS) {
      if ((keymap[a] ?? []).includes(code)) return a;
    }
    return null;
  }

  /** ゲームパッドの毎フレームポーリング（標準マッピング） */
  pollGamepad(): void {
    const pads = navigator.getGamepads?.();
    if (!pads) return;
    const pad = [...pads].find((p) => p && p.connected);
    if (!pad) return;
    const map: [number, Action][] = [
      [12, 'up'],
      [13, 'down'],
      [14, 'left'],
      [15, 'right'],
      [0, 'confirm'], // A
      [1, 'cancel'], // B
      [2, 'menu'], // X
      [3, 'dash'], // Y
      [5, 'dash'],
    ];
    for (const [btn, action] of map) {
      const down = !!pad.buttons[btn]?.pressed;
      if (down && !this.padPrev[btn]) this.pressedQueue.add(action);
      if (down) this.held.add(action);
      else if (this.padPrev[btn]) this.held.delete(action);
      this.padPrev[btn] = down;
    }
    // 左スティック
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    this.axisToDpad(ax < -0.5, 'left', 100);
    this.axisToDpad(ax > 0.5, 'right', 101);
    this.axisToDpad(ay < -0.5, 'up', 102);
    this.axisToDpad(ay > 0.5, 'down', 103);
  }

  private axisToDpad(down: boolean, action: Action, key: number): void {
    if (down && !this.padPrev[key]) this.pressedQueue.add(action);
    if (down) this.held.add(action);
    else if (this.padPrev[key]) this.held.delete(action);
    this.padPrev[key] = down;
  }

  /** タッチUIからの疑似入力 */
  simulate(action: Action, down: boolean): void {
    if (down) {
      if (!this.held.has(action)) this.pressedQueue.add(action);
      this.held.add(action);
    } else {
      this.held.delete(action);
    }
  }

  isDown(action: Action): boolean {
    return this.held.has(action);
  }

  /** 押した瞬間を1回だけ返す */
  justPressed(action: Action): boolean {
    if (this.pressedQueue.has(action)) {
      this.pressedQueue.delete(action);
      return true;
    }
    return false;
  }

  /** シーン遷移時などに押下キューを破棄 */
  clearPressed(): void {
    this.pressedQueue.clear();
  }
}

export const controls = new Controls();

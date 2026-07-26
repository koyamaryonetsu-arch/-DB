// UI部品: 紺基調+銀枠+円環意匠のウィンドウ / メニューリスト / 会話ボックス

import Phaser from 'phaser';
import { controls } from '../input/controls';
import { sound } from '../audio/sound';
import { G } from '../store';

export const FONT = '"BIZ UDGothic","MS Gothic","Hiragino Kaku Gothic ProN","Noto Sans JP",monospace';

export function makeText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 10,
  color = '#e8e8f0'
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
  });
  t.setResolution(3);
  return t;
}

/** 装飾付きウィンドウ枠を描画した Graphics を返す */
export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: { alpha?: number }
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x0e1428, opts?.alpha ?? 0.94);
  g.fillRect(x, y, w, h);
  g.lineStyle(1, 0xc8ccd8, 1);
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.lineStyle(1, 0x55608a, 1);
  g.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
  // 四隅の環飾り
  g.fillStyle(0x8a98c0, 1);
  for (const [cx, cy] of [
    [x + 3, y + 3],
    [x + w - 4, y + 3],
    [x + 3, y + h - 4],
    [x + w - 4, y + h - 4],
  ]) {
    g.fillRect(cx - 1, cy - 1, 2, 2);
  }
  return g;
}

export interface MenuItem {
  label: string;
  suffix?: string;
  disabled?: boolean;
  value?: unknown;
}

export interface MenuListOpts {
  x: number;
  y: number;
  width: number;
  visibleRows?: number;
  fontSize?: number;
  title?: string;
  onSelect: (index: number, item: MenuItem) => void;
  onCancel?: () => void;
  onChange?: (index: number, item: MenuItem) => void;
  /** 横方向入力（設定画面用） */
  onLeftRight?: (index: number, dir: -1 | 1) => void;
}

export class MenuList {
  scene: Phaser.Scene;
  opts: MenuListOpts;
  items: MenuItem[];
  index = 0;
  scroll = 0;
  active = true;
  visible = true;
  private panel: Phaser.GameObjects.Graphics;
  private texts: Phaser.GameObjects.Text[] = [];
  private suffixes: Phaser.GameObjects.Text[] = [];
  private cursor: Phaser.GameObjects.Image;
  private titleText: Phaser.GameObjects.Text | null = null;
  private repeatTimer = 0;
  readonly rowH: number;
  readonly height: number;

  constructor(scene: Phaser.Scene, items: MenuItem[], opts: MenuListOpts) {
    this.scene = scene;
    this.items = items;
    this.opts = opts;
    this.rowH = (opts.fontSize ?? 10) + 4;
    const rows = Math.min(items.length, opts.visibleRows ?? items.length);
    const titleH = opts.title ? 14 : 0;
    this.height = rows * this.rowH + 12 + titleH;
    this.panel = drawPanel(scene, opts.x, opts.y, opts.width, this.height);
    if (opts.title) {
      this.titleText = makeText(scene, opts.x + 8, opts.y + 4, opts.title, 9, '#a8b4d8');
    }
    for (let i = 0; i < rows; i++) {
      this.texts.push(makeText(scene, opts.x + 16, opts.y + 6 + titleH + i * this.rowH, '', opts.fontSize ?? 10));
      const sfx = makeText(scene, opts.x + opts.width - 8, opts.y + 6 + titleH + i * this.rowH, '', opts.fontSize ?? 10, '#a8b4d8');
      sfx.setOrigin(1, 0);
      this.suffixes.push(sfx);
    }
    this.cursor = scene.add.image(opts.x + 10, 0, 'cursor');
    // UIは常に画面座標に固定（スクロールするフィールドでも正しく表示）
    const uiObjects = [this.panel, ...this.texts, ...this.suffixes, this.cursor];
    if (this.titleText) uiObjects.push(this.titleText);
    for (const o of uiObjects) {
      (o as Phaser.GameObjects.Image).setScrollFactor(0);
      (o as Phaser.GameObjects.Image).setDepth(1500);
    }
    this.render();
  }

  setItems(items: MenuItem[]): void {
    this.items = items;
    if (this.index >= items.length) this.index = Math.max(0, items.length - 1);
    if (this.scroll > Math.max(0, items.length - this.texts.length)) {
      this.scroll = Math.max(0, items.length - this.texts.length);
    }
    this.render();
  }

  private render(): void {
    const rows = this.texts.length;
    if (this.index < this.scroll) this.scroll = this.index;
    if (this.index >= this.scroll + rows) this.scroll = this.index - rows + 1;
    for (let i = 0; i < rows; i++) {
      const item = this.items[this.scroll + i];
      if (!item) {
        this.texts[i].setText('');
        this.suffixes[i].setText('');
        continue;
      }
      this.texts[i].setText(item.label);
      this.texts[i].setColor(item.disabled ? '#6a7290' : '#e8e8f0');
      this.suffixes[i].setText(item.suffix ?? '');
    }
    const cursorRow = this.index - this.scroll;
    const titleH = this.opts.title ? 14 : 0;
    this.cursor.setVisible(this.visible && this.items.length > 0);
    this.cursor.setY(this.opts.y + 6 + titleH + cursorRow * this.rowH + this.rowH / 2 - 1);
  }

  update(_time: number, delta: number): void {
    if (!this.active || this.items.length === 0) return;
    let moved = 0;
    if (controls.justPressed('up')) moved = -1;
    else if (controls.justPressed('down')) moved = 1;
    else if (controls.isDown('up') || controls.isDown('down')) {
      this.repeatTimer += delta;
      if (this.repeatTimer > 320) {
        this.repeatTimer = 250;
        moved = controls.isDown('up') ? -1 : 1;
      }
    } else {
      this.repeatTimer = 0;
    }
    if (moved !== 0) {
      this.index = (this.index + moved + this.items.length) % this.items.length;
      sound.sfx('cursor');
      this.render();
      this.opts.onChange?.(this.index, this.items[this.index]);
    }
    if (this.opts.onLeftRight) {
      if (controls.justPressed('left')) this.opts.onLeftRight(this.index, -1);
      if (controls.justPressed('right')) this.opts.onLeftRight(this.index, 1);
    }
    if (controls.justPressed('confirm')) {
      const item = this.items[this.index];
      if (item.disabled) {
        sound.sfx('buzzer');
      } else {
        sound.sfx('confirm');
        this.opts.onSelect(this.index, item);
      }
    } else if (controls.justPressed('cancel')) {
      if (this.opts.onCancel) {
        sound.sfx('cancel');
        this.opts.onCancel();
      }
    }
  }

  setActive(active: boolean): void {
    this.active = active;
    this.cursor.setAlpha(active ? 1 : 0.4);
  }

  setVisibleAll(visible: boolean): void {
    this.visible = visible;
    this.panel.setVisible(visible);
    this.texts.forEach((t) => t.setVisible(visible));
    this.suffixes.forEach((t) => t.setVisible(visible));
    this.titleText?.setVisible(visible);
    this.cursor.setVisible(visible);
  }

  refresh(): void {
    this.render();
  }

  destroy(): void {
    this.panel.destroy();
    this.texts.forEach((t) => t.destroy());
    this.suffixes.forEach((t) => t.destroy());
    this.titleText?.destroy();
    this.cursor.destroy();
  }
}

/** 会話ボックス（タイプライター表示・選択肢） */
export class DialogueBox {
  scene: Phaser.Scene;
  private panel: Phaser.GameObjects.Graphics | null = null;
  private nameText: Phaser.GameObjects.Text | null = null;
  private bodyText: Phaser.GameObjects.Text | null = null;
  private indicator: Phaser.GameObjects.Text | null = null;
  private choiceList: MenuList | null = null;
  busy = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private ensure(): void {
    if (this.panel) return;
    this.panel = drawPanel(this.scene, 6, 178, 308, 58);
    this.panel.setDepth(1000);
    this.panel.setScrollFactor(0);
    this.nameText = makeText(this.scene, 14, 182, '', 9, '#f0d060');
    this.nameText.setDepth(1001);
    this.nameText.setScrollFactor(0);
    this.bodyText = makeText(this.scene, 14, 194, '', 10);
    this.bodyText.setDepth(1001);
    this.bodyText.setScrollFactor(0);
    this.bodyText.setWordWrapWidth(290, true);
    this.bodyText.setLineSpacing(3);
    this.indicator = makeText(this.scene, 300, 224, '▼', 8, '#a8b4d8');
    this.indicator.setDepth(1001);
    this.indicator.setScrollFactor(0);
    this.indicator.setVisible(false);
  }

  /** 複数行を1ページとして表示し、決定待ち */
  async page(text: string, speaker?: string): Promise<void> {
    this.ensure();
    this.busy = true;
    this.nameText!.setText(speaker ?? '');
    this.indicator!.setVisible(false);
    const body = this.bodyText!;
    body.setText('');
    const speed = [18, 36, 999][G.settings.textSpeed - 1] ?? 36; // 文字/秒
    let shown = 0;
    let done = false;
    controls.clearPressed();
    await new Promise<void>((resolve) => {
      const timer = this.scene.time.addEvent({
        delay: 1000 / 60,
        loop: true,
        callback: () => {
          if (!done) {
            shown += speed / 60;
            if (controls.justPressed('confirm') || controls.justPressed('cancel')) shown = text.length;
            if (shown >= text.length) {
              shown = text.length;
              done = true;
              this.indicator!.setVisible(true);
              controls.clearPressed();
            }
            body.setText(text.slice(0, Math.floor(shown)));
          } else {
            this.indicator!.setVisible(Math.floor(this.scene.time.now / 400) % 2 === 0);
            if (controls.justPressed('confirm') || controls.justPressed('cancel')) {
              timer.remove();
              resolve();
            }
          }
        },
      });
    });
    this.busy = false;
  }

  async lines(lines: string[], speaker?: string): Promise<void> {
    for (const line of lines) {
      await this.page(line, speaker);
    }
  }

  /** 選択肢を表示して選ばれたインデックスを返す */
  async choices(options: string[]): Promise<number> {
    this.ensure();
    this.busy = true;
    controls.clearPressed();
    return new Promise<number>((resolve) => {
      const width = Math.max(...options.map((o) => o.length)) * 11 + 40;
      const list = new MenuList(
        this.scene,
        options.map((o) => ({ label: o })),
        {
          x: 314 - Math.min(width, 240),
          y: 174 - options.length * 14 - 12,
          width: Math.min(width, 240),
          onSelect: (i) => {
            list.destroy();
            this.choiceList = null;
            this.busy = false;
            resolve(i);
          },
        }
      );
      this.choiceList = list;
      list.setActive(true);
    });
  }

  update(time: number, delta: number): void {
    this.choiceList?.update(time, delta);
  }

  hide(): void {
    this.panel?.destroy();
    this.nameText?.destroy();
    this.bodyText?.destroy();
    this.indicator?.destroy();
    this.choiceList?.destroy();
    this.panel = null;
    this.nameText = null;
    this.bodyText = null;
    this.indicator = null;
    this.choiceList = null;
  }
}

/** 画面フェード（フラッシュ軽減設定を尊重） */
export function flashScreen(scene: Phaser.Scene, color = 0xffffff, duration = 120): void {
  if (G.settings.flashReduce) {
    scene.cameras.main.fadeIn(duration);
    return;
  }
  scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
}

export function shakeScreen(scene: Phaser.Scene, intensity = 0.008, duration = 120): void {
  if (!G.settings.screenShake) return;
  scene.cameras.main.shake(duration, intensity);
}

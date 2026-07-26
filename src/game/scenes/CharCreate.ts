// 主人公作成: 性別 → 外見4種 → 名前入力（かな/カナ/英数） → 確認

import Phaser from 'phaser';
import { G } from '../store';
import { MenuList, drawPanel, makeText } from '../ui/ui';
import { controls } from '../input/controls';
import { sound } from '../audio/sound';
import { generateCharTexture, heroSpec } from '../gfx/textures';
import { buildNewGame } from '../../core/newgame';
import { randomSeed } from '../../core/rng';

const KANA_PAGES: { name: string; rows: string[] }[] = [
  {
    name: 'ひらがな',
    rows: ['あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの', 'はひふへほ', 'まみむめも', 'やゆよわん', 'らりるれろ', 'がぎぐげご', 'ざじずぜぞ', 'だぢづでど', 'ばびぶべぼ', 'ぱぴぷぺぽ', 'ぁぃぅぇぉ', 'ゃゅょっー'],
  },
  {
    name: 'カタカナ',
    rows: ['アイウエオ', 'カキクケコ', 'サシスセソ', 'タチツテト', 'ナニヌネノ', 'ハヒフヘホ', 'マミムメモ', 'ヤユヨワン', 'ラリルレロ', 'ガギグゲゴ', 'ザジズゼゾ', 'ダヂヅデド', 'バビブベボ', 'パピプペポ', 'ァィゥェォ', 'ャュョッー'],
  },
  {
    name: '英数',
    rows: ['ABCDE', 'FGHIJ', 'KLMNO', 'PQRST', 'UVWXY', 'Z0123', '45678', '9+-・☆'],
  },
];

type Step = 'gender' | 'appearance' | 'name' | 'confirm';

export class CharCreateScene extends Phaser.Scene {
  private step: Step = 'gender';
  private gender: 'a' | 'b' = 'a';
  private appearance = 0;
  private name = '';
  private menu: MenuList | null = null;
  private uiObjects: Phaser.GameObjects.GameObject[] = [];
  private previews: Phaser.GameObjects.Sprite[] = [];
  // 名前入力
  private page = 0;
  private gx = 0;
  private gy = 0;
  private gridTexts: Phaser.GameObjects.Text[][] = [];
  private nameText: Phaser.GameObjects.Text | null = null;
  private gridCursor: Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super('CharCreate');
  }

  create(): void {
    this.step = 'gender';
    this.gender = 'a';
    this.appearance = 0;
    this.name = '';
    this.showGender();
  }

  private clearUi(): void {
    this.menu?.destroy();
    this.menu = null;
    this.uiObjects.forEach((o) => o.destroy());
    this.uiObjects = [];
    this.previews.forEach((p) => p.destroy());
    this.previews = [];
    this.gridTexts = [];
    this.nameText = null;
    this.gridCursor = null;
  }

  private header(text: string): void {
    const panel = drawPanel(this, 40, 16, 240, 26);
    const t = makeText(this, 160, 24, text, 11);
    t.setOrigin(0.5, 0);
    this.uiObjects.push(panel, t);
  }

  private showGender(): void {
    this.clearUi();
    this.step = 'gender';
    this.header('あなたの性別は？');
    this.menu = new MenuList(
      this,
      [{ label: 'おとこのこ' }, { label: 'おんなのこ' }],
      {
        x: 110,
        y: 100,
        width: 100,
        onSelect: (i) => {
          this.gender = i === 0 ? 'a' : 'b';
          this.showAppearance();
        },
      }
    );
  }

  private showAppearance(): void {
    this.clearUi();
    this.step = 'appearance';
    this.header('見た目を選ぼう（左右キー・決定で次へ）');
    for (let i = 0; i < 4; i++) {
      const key = `char_hero_prev_${this.gender}_${i}`;
      generateCharTexture(this, key, heroSpec(i, this.gender));
      const spr = this.add.sprite(80 + i * 54, 120, key, '0');
      spr.setScale(2);
      this.previews.push(spr);
    }
    const marker = this.add.rectangle(80, 152, 52, 6, 0xc8ccd8);
    this.uiObjects.push(marker);
    const hint = makeText(this, 160, 180, '決定: この見た目にする　キャンセル: 戻る', 9, '#a8b4d8');
    hint.setOrigin(0.5, 0);
    this.uiObjects.push(hint);
    const updateMarker = () => {
      marker.setX(80 + this.appearance * 54);
      this.previews.forEach((p, i) => p.setAlpha(i === this.appearance ? 1 : 0.45));
    };
    updateMarker();
    this.events.on('appearance-move', updateMarker);
  }

  private showName(): void {
    this.clearUi();
    this.step = 'name';
    this.header('名前を入力しよう（最大6文字）');
    const panel = drawPanel(this, 20, 48, 280, 184);
    this.uiObjects.push(panel);
    this.nameText = makeText(this, 160, 56, '', 12, '#f0d060');
    this.nameText.setOrigin(0.5, 0);
    this.uiObjects.push(this.nameText);
    this.gridCursor = this.add.rectangle(0, 0, 14, 13, 0x3a5a9a, 0.55);
    this.uiObjects.push(this.gridCursor);
    this.renderGrid();
    this.updateNameText();
  }

  private renderGrid(): void {
    this.gridTexts.forEach((row) => row.forEach((t) => t.destroy()));
    this.gridTexts = [];
    const rows = KANA_PAGES[this.page].rows;
    const cols = 4; // 4列 × n行で敷き詰める
    const cellW = 15;
    const cellH = 14;
    const baseX = 34;
    const baseY = 74;
    // 文字を平坦化して4列グリッドへ
    const chars = rows.join('').split('');
    const gridW = 16;
    const rowsCount = Math.ceil(chars.length / gridW);
    for (let y = 0; y < rowsCount; y++) {
      const rowTexts: Phaser.GameObjects.Text[] = [];
      for (let x = 0; x < gridW; x++) {
        const ch = chars[y * gridW + x];
        if (!ch) break;
        const t = makeText(this, baseX + x * cellW, baseY + y * cellH, ch, 10);
        rowTexts.push(t);
      }
      this.gridTexts.push(rowTexts);
    }
    // 操作行
    const opY = baseY + rowsCount * cellH + 6;
    const ops = [`▶${KANA_PAGES[(this.page + 1) % KANA_PAGES.length].name}`, 'けす', 'きめる'];
    const opTexts: Phaser.GameObjects.Text[] = [];
    ops.forEach((op, i) => {
      const t = makeText(this, 50 + i * 90, opY, op, 10, '#a8d8a8');
      opTexts.push(t);
    });
    this.gridTexts.push(opTexts);
    if (this.gy >= this.gridTexts.length) this.gy = this.gridTexts.length - 1;
    if (this.gx >= this.gridTexts[this.gy].length) this.gx = this.gridTexts[this.gy].length - 1;
    this.moveGridCursor();
    void cols;
  }

  private moveGridCursor(): void {
    const t = this.gridTexts[this.gy]?.[this.gx];
    if (!t || !this.gridCursor) return;
    this.gridCursor.setPosition(t.x + t.width / 2, t.y + 6);
    this.gridCursor.setSize(Math.max(14, t.width + 4), 13);
  }

  private updateNameText(): void {
    this.nameText?.setText(`なまえ: ${this.name}${this.name.length < 6 ? '＿' : ''}`);
  }

  private nameInputUpdate(): void {
    let moved = false;
    if (controls.justPressed('up')) {
      this.gy = (this.gy - 1 + this.gridTexts.length) % this.gridTexts.length;
      moved = true;
    }
    if (controls.justPressed('down')) {
      this.gy = (this.gy + 1) % this.gridTexts.length;
      moved = true;
    }
    if (controls.justPressed('left')) {
      const row = this.gridTexts[this.gy];
      this.gx = (this.gx - 1 + row.length) % row.length;
      moved = true;
    }
    if (controls.justPressed('right')) {
      const row = this.gridTexts[this.gy];
      this.gx = (this.gx + 1) % row.length;
      moved = true;
    }
    if (moved) {
      if (this.gx >= this.gridTexts[this.gy].length) this.gx = this.gridTexts[this.gy].length - 1;
      sound.sfx('cursor');
      this.moveGridCursor();
    }
    if (controls.justPressed('cancel')) {
      if (this.name.length > 0) {
        this.name = this.name.slice(0, -1);
        sound.sfx('cancel');
        this.updateNameText();
      } else {
        this.showAppearance();
      }
      return;
    }
    if (controls.justPressed('confirm')) {
      const isOpRow = this.gy === this.gridTexts.length - 1;
      if (isOpRow) {
        if (this.gx === 0) {
          this.page = (this.page + 1) % KANA_PAGES.length;
          sound.sfx('confirm');
          this.renderGrid();
        } else if (this.gx === 1) {
          this.name = this.name.slice(0, -1);
          sound.sfx('cancel');
          this.updateNameText();
        } else {
          if (this.name.length === 0) this.name = 'アステル';
          sound.sfx('confirm');
          this.showConfirm();
        }
      } else {
        const ch = this.gridTexts[this.gy][this.gx].text;
        if (this.name.length < 6) {
          this.name += ch;
          sound.sfx('cursor');
          this.updateNameText();
        } else {
          sound.sfx('buzzer');
        }
      }
    }
  }

  private showConfirm(): void {
    this.clearUi();
    this.step = 'confirm';
    this.header('この内容ではじめる？');
    const key = `char_hero_prev_${this.gender}_${this.appearance}`;
    if (!this.textures.exists(key)) generateCharTexture(this, key, heroSpec(this.appearance, this.gender));
    const spr = this.add.sprite(160, 110, key, '0');
    spr.setScale(3);
    this.previews.push(spr);
    const info = makeText(
      this,
      160,
      140,
      `${this.name}（${this.gender === 'a' ? 'おとこのこ' : 'おんなのこ'}）\n職業: 環剣士`,
      10
    );
    info.setOrigin(0.5, 0);
    info.setAlign('center');
    this.uiObjects.push(info);
    this.menu = new MenuList(
      this,
      [{ label: 'はじめる' }, { label: 'なまえを変える' }],
      {
        x: 100,
        y: 176,
        width: 120,
        onSelect: (i) => {
          if (i === 0) this.startGame();
          else this.showName();
        },
        onCancel: () => this.showName(),
      }
    );
  }

  private startGame(): void {
    const state = buildNewGame(
      { name: this.name, gender: this.gender, appearance: this.appearance, seed: randomSeed() },
      G.data
    );
    G.startRun(state);
    generateCharTexture(this, 'char_hero', heroSpec(this.appearance, this.gender));
    sound.stopBgm();
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.start('Field'));
  }

  override update(time: number, delta: number): void {
    if (this.step === 'gender' || this.step === 'confirm') {
      this.menu?.update(time, delta);
    } else if (this.step === 'appearance') {
      if (controls.justPressed('left')) {
        this.appearance = (this.appearance + 3) % 4;
        sound.sfx('cursor');
        this.events.emit('appearance-move');
      }
      if (controls.justPressed('right')) {
        this.appearance = (this.appearance + 1) % 4;
        sound.sfx('cursor');
        this.events.emit('appearance-move');
      }
      if (controls.justPressed('confirm')) {
        sound.sfx('confirm');
        this.showName();
      }
      if (controls.justPressed('cancel')) {
        sound.sfx('cancel');
        this.showGender();
      }
    } else if (this.step === 'name') {
      this.nameInputUpdate();
    }
  }
}

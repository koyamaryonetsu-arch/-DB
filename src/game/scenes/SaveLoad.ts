// セーブ/ロード: スロット3 + オートセーブ + エクスポート/インポート

import Phaser from 'phaser';
import { G } from '../store';
import { controls } from '../input/controls';
import { sound } from '../audio/sound';
import { MenuList, drawPanel, makeText, type MenuItem } from '../ui/ui';
import { AUTO_SLOT, SAVE_SLOTS, formatPlayTime, serializeSave, summarizeSlot } from '../../core/save';

interface SaveLoadInit {
  mode: 'save' | 'load';
  from: 'Title' | 'Menu' | 'Ending';
  onClose?: () => void;
}

export class SaveLoadScene extends Phaser.Scene {
  private init_!: SaveLoadInit;
  private menu: MenuList | null = null;
  private infoText!: Phaser.GameObjects.Text;

  constructor() {
    super('SaveLoad');
  }

  init(data: SaveLoadInit): void {
    this.init_ = data;
  }

  create(): void {
    this.menu = null;
    this.add.rectangle(160, 120, 320, 240, 0x05060c, this.init_.from === 'Menu' ? 0.85 : 1);
    drawPanel(this, 6, 6, 308, 24);
    const title = makeText(this, 160, 12, this.init_.mode === 'save' ? 'きろく（セーブ）' : 'つづきから（ロード）', 11);
    title.setOrigin(0.5, 0);
    drawPanel(this, 6, 200, 308, 34);
    this.infoText = makeText(this, 14, 206, '', 9);
    this.infoText.setWordWrapWidth(292, true);
    this.buildMenu();
    controls.clearPressed();
  }

  private slotLabel(slot: string): MenuItem {
    const summary = (() => {
      try {
        return summarizeSlot(
          globalThis.localStorage,
          G.config.saveKey,
          slot,
          G.config.saveVersion,
          (id) => G.data.maps.get(id)?.name ?? id
        );
      } catch {
        return { slot, exists: false as const };
      }
    })();
    const name = slot === AUTO_SLOT ? 'オート' : `スロット${slot.slice(-1)}`;
    if (!summary.exists) {
      return { label: `${name}: ─ データなし ─`, disabled: this.init_.mode === 'load', value: slot };
    }
    if (summary.corrupt) {
      return { label: `${name}: （破損データ）`, disabled: this.init_.mode === 'load', value: slot };
    }
    return {
      label: `${name}: ${summary.name} Lv${summary.level}`,
      suffix: `${summary.mapName} ${formatPlayTime(summary.playSeconds ?? 0)}`,
      value: slot,
    };
  }

  private buildMenu(): void {
    this.menu?.destroy();
    const slots = this.init_.mode === 'load' ? [...SAVE_SLOTS, AUTO_SLOT] : [...SAVE_SLOTS];
    const items: MenuItem[] = slots.map((s) => this.slotLabel(s));
    if (this.init_.mode === 'save') {
      items.push({ label: 'データ書き出し（エクスポート）', value: '__export' });
    }
    items.push({ label: 'もどる', value: '__back' });
    this.menu = new MenuList(this, items, {
      x: 14,
      y: 40,
      width: 292,
      visibleRows: 8,
      onSelect: (_, item) => {
        const v = item.value as string;
        if (v === '__back') {
          this.close();
          return;
        }
        if (v === '__export') {
          this.exportSave();
          return;
        }
        if (this.init_.mode === 'save') {
          const auto = v === AUTO_SLOT;
          if (!auto && G.saveGame(v)) {
            sound.sfx('save');
            this.infoText.setText('記録した。');
            this.buildMenu();
          }
        } else {
          const res = G.loadGame(v);
          if (res.ok) {
            sound.sfx('confirm');
            sound.stopBgm();
            this.scene.stop('Menu');
            this.scene.stop('Field');
            this.scene.start('Field');
          } else {
            sound.sfx('buzzer');
            this.infoText.setText(res.error ?? '読み込めなかった。');
          }
        }
      },
      onCancel: () => this.close(),
    });
    if (this.init_.mode === 'save') {
      this.infoText.setText('どのスロットに記録する？');
    } else {
      this.infoText.setText('どのデータから続ける？');
    }
  }

  private exportSave(): void {
    if (!G.state) return;
    G.state.rngSeed = G.rng.getSeed();
    const raw = serializeSave(G.state, G.config.saveVersion);
    try {
      void navigator.clipboard?.writeText(raw);
    } catch {}
    window.prompt('このテキストを保存してください（クリップボードにもコピー済み）:', raw);
    this.infoText.setText('セーブデータを書き出した。タイトルの「データ引継ぎ」で復元できる。');
  }

  private close(): void {
    if (this.init_.from === 'Title') {
      this.scene.start('Title');
    } else if (this.init_.from === 'Ending') {
      this.scene.start('Title');
    } else {
      this.scene.stop();
      this.scene.resume('Menu');
      this.init_.onClose?.();
    }
  }

  override update(time: number, delta: number): void {
    controls.pollGamepad();
    this.menu?.update(time, delta);
  }
}

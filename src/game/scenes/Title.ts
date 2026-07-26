import Phaser from 'phaser';
import { G } from '../store';
import { MenuList, makeText } from '../ui/ui';
import { sound } from '../audio/sound';
import { deserializeSave } from '../../core/save';

export class TitleScene extends Phaser.Scene {
  private menu: MenuList | null = null;

  constructor() {
    super('Title');
  }

  create(): void {
    this.menu = null;
    const g = this.add.graphics();
    g.fillStyle(0x05060c, 1);
    g.fillRect(0, 0, 320, 240);
    // 星空
    let seed = 777;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) >>> 0;
      return (seed >>> 16) / 65536;
    };
    for (let i = 0; i < 90; i++) {
      const x = rand() * 320;
      const y = rand() * 240;
      const b = rand();
      g.fillStyle(b > 0.8 ? 0xe8e8f0 : b > 0.5 ? 0x8a98c0 : 0x4a5a80, 1);
      g.fillRect(x, y, 1, 1);
    }
    const ring = this.add.image(160, 62, 'ringmark');
    this.tweens.add({ targets: ring, angle: 360, duration: 90000, repeat: -1 });

    const title = makeText(this, 160, 108, G.config.title, 22, '#e8e8f0');
    title.setOrigin(0.5, 0.5);
    title.setShadow(2, 2, '#28497a', 0);
    const sub = makeText(this, 160, 128, G.config.subtitle, 10, '#a8b4d8');
    sub.setOrigin(0.5, 0.5);
    const en = makeText(this, 160, 141, G.config.titleEn, 8, '#55608a');
    en.setOrigin(0.5, 0.5);
    const ver = makeText(this, 316, 232, `ver ${G.config.version}`, 8, '#55608a');
    ver.setOrigin(1, 0.5);

    const hasSave = G.hasAnySave();
    this.menu = new MenuList(
      this,
      [
        { label: 'はじめから' },
        { label: 'つづきから', disabled: !hasSave },
        { label: 'データ引継ぎ' },
        { label: 'せってい' },
      ],
      {
        x: 100,
        y: 156,
        width: 120,
        onSelect: (i) => {
          if (i === 0) {
            sound.stopBgm();
            this.scene.start('CharCreate');
          } else if (i === 1) {
            this.scene.start('SaveLoad', { mode: 'load', from: 'Title' });
          } else if (i === 2) {
            this.importSave();
          } else {
            this.scene.start('Settings', { from: 'Title' });
          }
        },
      }
    );
    sound.playBgm('bgm_title');
  }

  private importSave(): void {
    const raw = window.prompt('エクスポートしたセーブデータ(JSON)を貼り付けてください:');
    if (!raw) return;
    const res = deserializeSave(raw.trim(), G.config.saveVersion);
    if (!res.ok || !res.state) {
      window.alert(`読み込めませんでした: ${res.error ?? ''}`);
      return;
    }
    G.startRun(res.state);
    sound.stopBgm();
    this.scene.start('Field');
  }

  override update(time: number, delta: number): void {
    this.menu?.update(time, delta);
  }
}

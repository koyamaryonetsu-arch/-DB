// エンディング: 最初の環晶を得て、北の帝国へ──第一章 完

import Phaser from 'phaser';
import { G } from '../store';
import { controls } from '../input/controls';
import { sound } from '../audio/sound';
import { MenuList, makeText } from '../ui/ui';
import { formatPlayTime } from '../../core/save';

export class EndingScene extends Phaser.Scene {
  private menu: MenuList | null = null;

  constructor() {
    super('Ending');
  }

  create(): void {
    this.menu = null;
    this.add.rectangle(160, 120, 320, 240, 0x05060c, 1);
    // 星空
    let seed = 4242;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) >>> 0;
      return (seed >>> 16) / 65536;
    };
    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      g.fillStyle(rand() > 0.6 ? 0xe8e8f0 : 0x4a5a80, 1);
      g.fillRect(rand() * 320, rand() * 240, 1, 1);
    }
    const ring = this.add.image(160, 52, 'ringmark');
    ring.setAlpha(0);
    this.tweens.add({ targets: ring, alpha: 1, duration: 2000 });
    this.tweens.add({ targets: ring, angle: 360, duration: 60000, repeat: -1 });

    sound.playBgm('bgm_ending');
    const lines = G.config.chapterEndText;
    const text = makeText(this, 160, 120, '', 10);
    text.setOrigin(0.5, 0);
    text.setAlign('center');
    text.setLineSpacing(6);
    void this.roll(lines, text);
  }

  private async roll(lines: string[], text: Phaser.GameObjects.Text): Promise<void> {
    let shown: string[] = [];
    for (const line of lines) {
      shown.push(line);
      if (shown.length > 5) shown = shown.slice(-5);
      text.setText(shown.join('\n'));
      await new Promise((r) => this.time.delayedCall(1400, r));
    }
    const hero = G.run.party[0];
    const stats = makeText(
      this,
      160,
      196,
      `${hero.name}　Lv${hero.level}　プレイ時間 ${formatPlayTime(G.run.playSeconds)}`,
      9,
      '#a8b4d8'
    );
    stats.setOrigin(0.5, 0);
    this.menu = new MenuList(
      this,
      [{ label: '記録してタイトルへ' }, { label: 'タイトルへ' }],
      {
        x: 90,
        y: 210,
        width: 140,
        onSelect: (i) => {
          sound.stopBgm();
          if (i === 0) {
            this.scene.start('SaveLoad', { mode: 'save', from: 'Ending' });
          } else {
            this.scene.start('Title');
          }
        },
      }
    );
    controls.clearPressed();
  }

  override update(time: number, delta: number): void {
    controls.pollGamepad();
    this.menu?.update(time, delta);
  }
}

import Phaser from 'phaser';
import { generateAllTextures } from '../gfx/textures';
import { controls } from '../input/controls';
import { setupTouchControls } from '../input/touch';
import { sound } from '../audio/sound';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateAllTextures(this);
    controls.attach();
    setupTouchControls();
    const unlock = () => sound.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    this.scene.start('Title');
  }
}

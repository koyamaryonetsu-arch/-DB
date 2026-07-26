import Phaser from 'phaser';
import { BootScene } from './scenes/Boot';
import { TitleScene } from './scenes/Title';
import { CharCreateScene } from './scenes/CharCreate';
import { FieldScene } from './scenes/Field';
import { BattleScene } from './scenes/Battle';
import { MenuScene } from './scenes/Menu';
import { ShopScene } from './scenes/Shop';
import { JobChangeScene } from './scenes/JobChange';
import { SettingsScene } from './scenes/Settings';
import { SaveLoadScene } from './scenes/SaveLoad';
import { EndingScene } from './scenes/Ending';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 320,
  height: 240,
  backgroundColor: '#05060c',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.NONE,
  },
  scene: [
    BootScene,
    TitleScene,
    CharCreateScene,
    FieldScene,
    BattleScene,
    MenuScene,
    ShopScene,
    JobChangeScene,
    SettingsScene,
    SaveLoadScene,
    EndingScene,
  ],
});

// 整数倍スケーリング（ピクセルパーフェクト表示）
function applyZoom(): void {
  const zoom = Math.max(1, Math.floor(Math.min(window.innerWidth / 320, window.innerHeight / 240)));
  game.scale.setZoom(zoom);
}
window.addEventListener('resize', applyZoom);
applyZoom();

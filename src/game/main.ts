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

// スケーリング: PC等の広い画面では整数倍(ピクセルパーフェクト)、
// スマホなど2倍に満たない画面では0.25刻みで画面いっぱいに表示する
function applyZoom(): void {
  const raw = Math.min(window.innerWidth / 320, window.innerHeight / 240);
  const zoom = raw >= 2 ? Math.floor(raw) : Math.max(0.75, Math.floor(raw * 4) / 4);
  game.scale.setZoom(zoom);
}
window.addEventListener('resize', applyZoom);
window.addEventListener('orientationchange', () => setTimeout(applyZoom, 200));
applyZoom();

// PWA: 本番ビルドではサービスワーカーを登録（オフライン対応・ホーム画面起動）
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

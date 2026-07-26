// 設定: 文字速度・戦闘速度・音量・アクセシビリティ・難易度・キーコンフィグ

import Phaser from 'phaser';
import { G, defaultSettings } from '../store';
import { controls } from '../input/controls';
import { sound } from '../audio/sound';
import { MenuList, drawPanel, makeText, type MenuItem } from '../ui/ui';

interface SettingsInit {
  from: 'Title' | 'Menu';
  onClose?: () => void;
}

const SPEED_LABELS = ['おそい', 'ふつう', 'はやい'];
const DIFF_LABELS: Record<string, string> = { story: '物語重視', normal: '標準', tactics: '戦術重視' };
const DIFF_ORDER = ['story', 'normal', 'tactics'] as const;
const KEY_ACTIONS: { action: string; label: string }[] = [
  { action: 'up', label: '上' },
  { action: 'down', label: '下' },
  { action: 'left', label: '左' },
  { action: 'right', label: '右' },
  { action: 'confirm', label: '決定' },
  { action: 'cancel', label: 'キャンセル' },
  { action: 'menu', label: 'メニュー' },
  { action: 'dash', label: 'ダッシュ' },
];

export class SettingsScene extends Phaser.Scene {
  private init_!: SettingsInit;
  private menu: MenuList | null = null;
  private infoText!: Phaser.GameObjects.Text;
  private capturing = false;

  constructor() {
    super('Settings');
  }

  init(data: SettingsInit): void {
    this.init_ = data;
  }

  create(): void {
    this.menu = null;
    this.capturing = false;
    this.add.rectangle(160, 120, 320, 240, 0x05060c, this.init_.from === 'Title' ? 1 : 0.82);
    drawPanel(this, 6, 6, 308, 24);
    const title = makeText(this, 160, 12, 'せってい', 11);
    title.setOrigin(0.5, 0);
    drawPanel(this, 6, 200, 308, 34);
    this.infoText = makeText(this, 14, 206, '左右キーで変更 / 決定でキー設定・リセット', 9);
    this.infoText.setWordWrapWidth(292, true);
    this.showMain();
    controls.clearPressed();
  }

  private items(): MenuItem[] {
    const s = G.settings;
    return [
      { label: '文字の速さ', suffix: SPEED_LABELS[s.textSpeed - 1] },
      { label: '戦闘の速さ', suffix: SPEED_LABELS[s.battleSpeed - 1] },
      { label: 'BGM音量', suffix: `${Math.round(s.bgmVol * 10)}` },
      { label: '効果音量', suffix: `${Math.round(s.seVol * 10)}` },
      { label: '常時ダッシュ', suffix: s.alwaysDash ? 'ON' : 'OFF' },
      { label: '画面の揺れ', suffix: s.screenShake ? 'ON' : 'OFF' },
      { label: 'フラッシュ軽減', suffix: s.flashReduce ? 'ON' : 'OFF' },
      { label: '難易度', suffix: DIFF_LABELS[s.difficulty] },
      { label: 'キー設定' },
      { label: '初期設定に戻す' },
      { label: 'もどる' },
    ];
  }

  private showMain(): void {
    this.menu?.destroy();
    this.menu = new MenuList(this, this.items(), {
      x: 40,
      y: 40,
      width: 240,
      visibleRows: 11,
      onSelect: (i) => {
        if (i === 8) this.showKeyConfig();
        else if (i === 9) {
          const keymap = G.settings.keymap;
          Object.assign(G.settings, defaultSettings());
          G.settings.keymap = keymap;
          G.saveSettings();
          this.menu?.setItems(this.items());
          this.infoText.setText('キー設定以外を初期値に戻した。');
        } else if (i === 10) this.close();
      },
      onCancel: () => this.close(),
      onLeftRight: (i, dir) => this.adjust(i, dir),
    });
  }

  private adjust(index: number, dir: -1 | 1): void {
    const s = G.settings;
    switch (index) {
      case 0:
        s.textSpeed = Math.max(1, Math.min(3, s.textSpeed + dir));
        break;
      case 1:
        s.battleSpeed = Math.max(1, Math.min(3, s.battleSpeed + dir));
        break;
      case 2:
        s.bgmVol = Math.max(0, Math.min(1, Math.round((s.bgmVol + dir * 0.1) * 10) / 10));
        break;
      case 3:
        s.seVol = Math.max(0, Math.min(1, Math.round((s.seVol + dir * 0.1) * 10) / 10));
        sound.sfx('cursor');
        break;
      case 4:
        s.alwaysDash = !s.alwaysDash;
        break;
      case 5:
        s.screenShake = !s.screenShake;
        break;
      case 6:
        s.flashReduce = !s.flashReduce;
        break;
      case 7: {
        const cur = DIFF_ORDER.indexOf(s.difficulty);
        const next = (cur + dir + DIFF_ORDER.length) % DIFF_ORDER.length;
        s.difficulty = DIFF_ORDER[next];
        this.infoText.setText(
          s.difficulty === 'story'
            ? '物語重視: 敵が弱くなり、経験値が増える。'
            : s.difficulty === 'tactics'
              ? '戦術重視: 敵が強く賢くなり、経験値がやや減る。'
              : '標準: バランスの取れた難しさ。'
        );
        break;
      }
      default:
        return;
    }
    G.saveSettings();
    this.menu?.setItems(this.items());
  }

  private showKeyConfig(): void {
    this.menu?.destroy();
    const keyItems = (): MenuItem[] => [
      ...KEY_ACTIONS.map((k) => ({
        label: k.label,
        suffix: (G.settings.keymap[k.action] ?? []).slice(0, 2).join('/'),
      })),
      { label: 'キーを初期値へ' },
      { label: 'もどる' },
    ];
    this.menu = new MenuList(this, keyItems(), {
      x: 24,
      y: 34,
      width: 272,
      visibleRows: 10,
      title: 'キー設定（決定で押したキーを割り当て）',
      onSelect: (i) => {
        if (i === KEY_ACTIONS.length) {
          G.settings.keymap = defaultSettings().keymap;
          G.saveSettings();
          this.menu?.setItems(keyItems());
          this.infoText.setText('キー設定を初期値に戻した。');
          return;
        }
        if (i === KEY_ACTIONS.length + 1) {
          this.showMain();
          return;
        }
        const action = KEY_ACTIONS[i].action;
        this.capturing = true;
        this.infoText.setText(`「${KEY_ACTIONS[i].label}」に割り当てるキーを押してください……`);
        controls.captureCallback = (code) => {
          const map = G.settings.keymap;
          for (const a of Object.keys(map)) {
            map[a] = map[a].filter((c) => c !== code);
          }
          map[action] = [code, ...(map[action] ?? [])].slice(0, 3);
          G.saveSettings();
          this.capturing = false;
          this.menu?.setItems(keyItems());
          this.infoText.setText(`${KEY_ACTIONS[i].label} ← ${code}`);
        };
      },
      onCancel: () => this.showMain(),
    });
  }

  private close(): void {
    G.saveSettings();
    if (this.init_.from === 'Title') {
      this.scene.start('Title');
    } else {
      this.scene.stop();
      this.scene.resume('Menu');
      this.init_.onClose?.();
    }
  }

  override update(time: number, delta: number): void {
    controls.pollGamepad();
    if (!this.capturing) this.menu?.update(time, delta);
  }
}

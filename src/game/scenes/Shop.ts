// 店: 道具屋 / 武具屋（買う・売る）

import Phaser from 'phaser';
import { G } from '../store';
import { controls } from '../input/controls';
import { sound } from '../audio/sound';
import { MenuList, drawPanel, makeText, type MenuItem } from '../ui/ui';
import { addEquip, addItem, canEquip, removeEquip, removeItem } from '../../core/inventory';

interface ShopInit {
  kind: 'item' | 'equip';
  onClose: () => void;
}

export class ShopScene extends Phaser.Scene {
  private init_!: ShopInit;
  private menus: MenuList[] = [];
  private goldText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private closing = false;

  constructor() {
    super('Shop');
  }

  init(data: ShopInit): void {
    this.init_ = data;
  }

  create(): void {
    this.menus = [];
    this.closing = false;
    this.add.rectangle(160, 120, 320, 240, 0x05060c, 0.75);
    drawPanel(this, 6, 6, 308, 24);
    const title = makeText(this, 160, 12, this.init_.kind === 'item' ? '道具屋' : '武具屋', 11);
    title.setOrigin(0.5, 0);
    drawPanel(this, 6, 200, 308, 34);
    this.infoText = makeText(this, 14, 206, '', 9);
    this.infoText.setWordWrapWidth(292, true);
    drawPanel(this, 210, 34, 104, 20);
    this.goldText = makeText(this, 218, 39, '', 9, '#f0d060');
    this.refreshGold();
    void this.mainFlow();
    controls.clearPressed();
  }

  private refreshGold(): void {
    this.goldText.setText(`${G.run.inventory.gold}${G.config.currency}`);
  }

  private modalMenu(
    items: MenuItem[],
    opts: { x: number; y: number; width: number; visibleRows?: number; title?: string; onChange?: (i: number, item: MenuItem) => void }
  ): Promise<number | null> {
    return new Promise((resolve) => {
      const menu = new MenuList(this, items, {
        ...opts,
        onSelect: (i) => {
          menu.destroy();
          this.menus = this.menus.filter((m) => m !== menu);
          resolve(i);
        },
        onCancel: () => {
          menu.destroy();
          this.menus = this.menus.filter((m) => m !== menu);
          resolve(null);
        },
        onChange: opts.onChange,
      });
      this.menus.push(menu);
    });
  }

  private stock(): string[] {
    const shops = G.config.shops;
    const late = (G.run.flags.mainStep ?? 0) >= 3;
    if (this.init_.kind === 'item') {
      return [...shops.item, ...(late ? shops.itemLate : [])];
    }
    return [...shops.equip, ...(late ? shops.equipLate : [])];
  }

  private async mainFlow(): Promise<void> {
    for (;;) {
      this.infoText.setText('');
      const idx = await this.modalMenu(
        [{ label: 'かう' }, { label: 'うる' }, { label: 'やめる' }],
        { x: 6, y: 34, width: 90 }
      );
      if (idx === null || idx === 2) {
        this.close();
        return;
      }
      if (idx === 0) await this.buyFlow();
      else await this.sellFlow();
    }
  }

  private describe(id: string): string {
    if (this.init_.kind === 'item') return G.data.items.get(id)?.description ?? '';
    const eq = G.data.equipment.get(id);
    if (!eq) return '';
    const who = G.run.party
      .map((m) => `${m.name}${canEquip(m, id, G.data) || eq.slot !== 'weapon' ? '○' : '×'}`)
      .join(' ');
    const stats = Object.entries(eq.stats)
      .map(([k, v]) => `${{ hp: 'HP', mp: 'MP', attack: '攻', defense: '守', magic: '魔', spirit: '精', agility: '速', luck: '運' }[k] ?? k}${v >= 0 ? '+' : ''}${v}`)
      .join(' ');
    return `${eq.description}\n${stats}　装備: ${who}`;
  }

  private async buyFlow(): Promise<void> {
    for (;;) {
      const ids = this.stock();
      const items: MenuItem[] = ids.map((id) => {
        const def = this.init_.kind === 'item' ? G.data.items.get(id) : G.data.equipment.get(id);
        const price = def?.price ?? 0;
        return {
          label: def && 'name' in def ? def.name : id,
          suffix: `${price}`,
          disabled: price > G.run.inventory.gold,
          value: id,
        };
      });
      const idx = await this.modalMenu(items, {
        x: 6,
        y: 60,
        width: 190,
        visibleRows: 8,
        title: 'かう',
        onChange: (_, item) => this.infoText.setText(this.describe(item.value as string)),
      });
      if (idx === null) return;
      const id = ids[idx];
      const def = this.init_.kind === 'item' ? G.data.items.get(id) : G.data.equipment.get(id);
      const price = def?.price ?? 0;
      if (G.run.inventory.gold < price) continue;
      G.run.inventory.gold -= price;
      if (this.init_.kind === 'item') addItem(G.run.inventory, id);
      else addEquip(G.run.inventory, id);
      sound.sfx('chest');
      this.infoText.setText(`${def && 'name' in def ? def.name : id}を買った！`);
      this.refreshGold();
    }
  }

  private async sellFlow(): Promise<void> {
    for (;;) {
      const inv = G.run.inventory;
      const entries: { id: string; count: number; isEquip: boolean }[] = [
        ...Object.entries(inv.items).map(([id, count]) => ({ id, count, isEquip: false })),
        ...Object.entries(inv.equips).map(([id, count]) => ({ id, count, isEquip: true })),
      ];
      const sellable = entries.filter((e) => {
        if (e.isEquip) {
          const eq = G.data.equipment.get(e.id);
          return !!eq && eq.sellable !== false && eq.price > 0;
        }
        const item = G.data.items.get(e.id);
        return !!item && !item.keyItem && item.price > 0;
      });
      if (sellable.length === 0) {
        this.infoText.setText('売れるものがない。');
        return;
      }
      const items: MenuItem[] = sellable.map((e) => {
        const def = e.isEquip ? G.data.equipment.get(e.id) : G.data.items.get(e.id);
        const price = Math.floor((def?.price ?? 0) / 2);
        return { label: def && 'name' in def ? def.name : e.id, suffix: `${price} ×${e.count}`, value: e.id };
      });
      const idx = await this.modalMenu(items, {
        x: 6,
        y: 60,
        width: 190,
        visibleRows: 8,
        title: 'うる（半額）',
        onChange: (_, item) => this.infoText.setText(this.describe(item.value as string)),
      });
      if (idx === null) return;
      const e = sellable[idx];
      const def = e.isEquip ? G.data.equipment.get(e.id) : G.data.items.get(e.id);
      const price = Math.floor((def?.price ?? 0) / 2);
      if (e.isEquip) removeEquip(inv, e.id);
      else removeItem(inv, e.id);
      inv.gold += price;
      sound.sfx('confirm');
      this.infoText.setText(`${def && 'name' in def ? def.name : e.id}を${price}${G.config.currency}で売った。`);
      this.refreshGold();
    }
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    this.scene.stop();
    this.scene.resume('Field');
    this.init_.onClose();
  }

  override update(time: number, delta: number): void {
    controls.pollGamepad();
    this.menus[this.menus.length - 1]?.update(time, delta);
  }
}

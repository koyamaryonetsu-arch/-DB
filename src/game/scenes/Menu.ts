// フィールドメニュー: どうぐ / とくぎ / そうび / つよさ / れんけい / きろく / せってい

import Phaser from 'phaser';
import { G } from '../store';
import { controls } from '../input/controls';
import { sound } from '../audio/sound';
import { MenuList, drawPanel, makeText, type MenuItem } from '../ui/ui';
import type { PartyMember, SkillDefinition, EquipSlot } from '../../core/types';
import { useItemOnMember, equipFromInventory, canEquip } from '../../core/inventory';
import { derivedStats } from '../../core/stats';
import { canEquipSkill, canEquipPassive, isInherited, unequipSkill } from '../../core/skills';
import { rankForJobExp, rankName, jobExpToNext } from '../../core/mastery';
import { totalExpForLevel } from '../../core/leveling';
import { TIME_NAMES } from '../../core/daynight';

interface MenuInit {
  onClose: () => void;
}

const SLOT_NAMES: Record<EquipSlot, string> = {
  weapon: '武器',
  shield: '盾',
  body: '体',
  head: '頭',
  accessory: '飾り',
};

export class MenuScene extends Phaser.Scene {
  private init_!: MenuInit;
  private menus: MenuList[] = [];
  private infoText!: Phaser.GameObjects.Text;
  private partyTexts: Phaser.GameObjects.Text[] = [];
  private goldText!: Phaser.GameObjects.Text;
  private detailObjects: Phaser.GameObjects.GameObject[] = [];
  private closing = false;

  constructor() {
    super('Menu');
  }

  init(data: MenuInit): void {
    this.init_ = data;
  }

  create(): void {
    this.menus = [];
    this.detailObjects = [];
    this.closing = false;
    const overlay = this.add.rectangle(160, 120, 320, 240, 0x05060c, 0.72);
    void overlay;
    // 右: パーティー概況
    drawPanel(this, 118, 6, 196, 130);
    this.partyTexts = [];
    for (let i = 0; i < 4; i++) {
      const t = makeText(this, 126, 14 + i * 30, '', 9);
      this.partyTexts.push(t);
    }
    // 下: 情報
    drawPanel(this, 6, 200, 308, 34);
    this.infoText = makeText(this, 14, 206, '', 9);
    this.infoText.setWordWrapWidth(292, true);
    // 所持金と時刻
    drawPanel(this, 118, 140, 196, 22);
    this.goldText = makeText(this, 126, 146, '', 9, '#f0d060');
    this.refreshParty();
    void this.mainMenu();
    controls.clearPressed();
  }

  private refreshParty(): void {
    const run = G.run;
    run.party.forEach((m, i) => {
      const ds = derivedStats(m, G.data);
      const cls = G.data.classes.get(m.classId);
      const rank = rankName(rankForJobExp(m.mastery[m.classId] ?? 0));
      this.partyTexts[i]?.setText(
        `${m.name}  Lv${m.level} ${cls?.name}(${rank})\n HP ${m.hp}/${ds.maxHp}  MP ${m.mp}/${ds.maxMp}  ${m.row === 'front' ? '前列' : '後列'}`
      );
    });
    const map = G.data.maps.get(run.mapId);
    this.goldText.setText(
      `${run.inventory.gold}${G.config.currency}　${map?.name ?? ''}　${TIME_NAMES[run.timeIndex]}`
    );
  }

  private info(text: string): void {
    this.infoText.setText(text);
  }

  private modalMenu(
    items: MenuItem[],
    opts: { x: number; y: number; width: number; visibleRows?: number; title?: string; onChange?: (i: number, item: MenuItem) => void }
  ): Promise<number | null> {
    return new Promise((resolve) => {
      const menu = new MenuList(this, items, {
        ...opts,
        onSelect: (i) => {
          this.remove(menu);
          resolve(i);
        },
        onCancel: () => {
          this.remove(menu);
          resolve(null);
        },
        onChange: opts.onChange,
      });
      this.menus.push(menu);
    });
  }

  private remove(menu: MenuList): void {
    menu.destroy();
    this.menus = this.menus.filter((m) => m !== menu);
  }

  private clearDetail(): void {
    this.detailObjects.forEach((o) => o.destroy());
    this.detailObjects = [];
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    this.scene.stop();
    this.scene.resume('Field');
    this.init_.onClose();
  }

  private async mainMenu(): Promise<void> {
    for (;;) {
      this.refreshParty();
      this.info('メニューを閉じる: キャンセルキー');
      const idx = await this.modalMenu(
        [
          { label: 'どうぐ' },
          { label: 'とくぎ' },
          { label: 'そうび' },
          { label: 'つよさ' },
          { label: 'れんけい' },
          { label: 'きろく' },
          { label: 'せってい' },
          { label: 'とじる' },
        ],
        { x: 6, y: 6, width: 104, title: 'メニュー' }
      );
      if (idx === null || idx === 7) {
        this.close();
        return;
      }
      switch (idx) {
        case 0:
          await this.itemsFlow();
          break;
        case 1:
          await this.skillsFlow();
          break;
        case 2:
          await this.equipFlow();
          break;
        case 3:
          await this.statusFlow();
          break;
        case 4:
          await this.comboFlow();
          break;
        case 5:
          await this.saveFlow();
          break;
        case 6:
          await this.settingsFlow();
          break;
      }
    }
  }

  private async pickMember(title: string): Promise<PartyMember | null> {
    const idx = await this.modalMenu(
      G.run.party.map((m) => ({ label: m.name })),
      { x: 6, y: 60, width: 104, title }
    );
    return idx === null ? null : G.run.party[idx];
  }

  // ---- どうぐ ----
  private async itemsFlow(): Promise<void> {
    for (;;) {
      const entries = Object.entries(G.run.inventory.items);
      if (entries.length === 0) {
        this.info('道具を持っていない。');
        return;
      }
      const items: MenuItem[] = entries.map(([id, n]) => {
        const def = G.data.items.get(id)!;
        return {
          label: def.keyItem ? `◆${def.name}` : def.name,
          suffix: `×${n}`,
          disabled: !def.usableInField,
          value: id,
        };
      });
      const idx = await this.modalMenu(items, {
        x: 6,
        y: 6,
        width: 150,
        visibleRows: 8,
        title: 'どうぐ',
        onChange: (_, item) => this.info(G.data.items.get(item.value as string)?.description ?? ''),
      });
      if (idx === null) return;
      const itemId = entries[idx][0];
      const def = G.data.items.get(itemId)!;
      if (def.effect?.warpVillage) {
        if (G.run.mapId === 'village') {
          this.info('ここはもうルミナ村だ。');
          continue;
        }
        if (G.run.inventory.items[itemId] > 1) G.run.inventory.items[itemId] -= 1;
        else delete G.run.inventory.items[itemId];
        G.run.mapId = 'village';
        G.run.pos = { x: 12, y: 15, dir: 'down' };
        sound.sfx('spell');
        this.close();
        this.scene.stop('Field');
        this.scene.start('Field');
        return;
      }
      const member = await this.pickMember('だれに？');
      if (!member) continue;
      const result = useItemOnMember(itemId, member, G.run.inventory, G.data);
      sound.sfx(result.used ? 'heal' : 'buzzer');
      this.info(result.message);
      this.refreshParty();
    }
  }

  // ---- とくぎ ----
  private async skillsFlow(): Promise<void> {
    const member = await this.pickMember('だれの技？');
    if (!member) return;
    for (;;) {
      const learned = member.learned
        .map((id) => G.data.skills.get(id))
        .filter((d): d is SkillDefinition => !!d);
      const actives = learned.filter((d) => d.kind !== 'passive');
      const passives = learned.filter((d) => d.kind === 'passive');
      const items: MenuItem[] = actives.map((d) => {
        const equipped = member.loadout.includes(d.id);
        const inherited = isInherited(member, d.id, G.data);
        let tag = equipped ? '✦' : '　';
        if (d.ougi) tag += '奥';
        else if (inherited) tag += '継';
        return { label: `${tag}${d.name}`, suffix: d.ougi ? '奥義' : `MP${d.mpCost}`, value: d.id };
      });
      passives.forEach((d) => {
        const equipped = member.passives.includes(d.id);
        items.push({ label: `${equipped ? '✦' : '　'}◇${d.name}`, suffix: 'ﾊﾟｯｼﾌﾞ', value: d.id });
      });
      this.info(`技セット ${member.loadout.length}/8　継承 ${member.loadout.filter((s) => isInherited(member, s, G.data)).length}/4　パッシブ ${member.passives.length}/4`);
      const idx = await this.modalMenu(items, {
        x: 6,
        y: 6,
        width: 168,
        visibleRows: 9,
        title: `${member.name}の技`,
        onChange: (_, item) => {
          const d = G.data.skills.get(item.value as string);
          this.info(d?.description ?? '');
        },
      });
      if (idx === null) return;
      const skillId = items[idx].value as string;
      const def = G.data.skills.get(skillId)!;
      if (def.kind === 'passive') {
        if (member.passives.includes(skillId)) {
          member.passives = member.passives.filter((p) => p !== skillId);
          this.info(`${def.name}を外した。`);
        } else {
          const check = canEquipPassive(member, skillId, G.data);
          this.info(check.ok ? `${def.name}を装備した。` : check.reason!);
          if (check.ok) member.passives.push(skillId);
        }
        this.refreshParty();
        continue;
      }
      const equipped = member.loadout.includes(skillId);
      const actions: MenuItem[] = [];
      if (equipped) actions.push({ label: 'はずす' });
      else actions.push({ label: 'セットする' });
      if (def.fieldUsable && member.loadout.includes(skillId)) actions.push({ label: 'つかう' });
      actions.push({ label: 'やめる' });
      const act = await this.modalMenu(actions, { x: 180, y: 80, width: 100 });
      if (act === null) continue;
      const label = actions[act].label;
      if (label === 'はずす') {
        unequipSkill(member, skillId);
        this.info(`${def.name}を技セットから外した。`);
      } else if (label === 'セットする') {
        const check = canEquipSkill(member, skillId, G.data);
        if (check.ok) {
          member.loadout.push(skillId);
          this.info(`${def.name}を技セットに入れた。`);
        } else {
          sound.sfx('buzzer');
          this.info(check.reason!);
        }
      } else if (label === 'つかう') {
        await this.useFieldSkill(member, def);
      }
    }
  }

  private async useFieldSkill(member: PartyMember, def: SkillDefinition): Promise<void> {
    const ds = derivedStats(member, G.data);
    const cost = Math.ceil(def.mpCost * ds.mpCostMul);
    if (member.mp < cost) {
      this.info('MPが足りない。');
      sound.sfx('buzzer');
      return;
    }
    const targets =
      def.target === 'allyAll' ? G.run.party : [await this.pickMember('だれに？')].filter((m): m is PartyMember => !!m);
    if (targets.length === 0) return;
    let used = false;
    for (const t of targets) {
      const tds = derivedStats(t, G.data);
      if (def.revive) {
        if (t.hp > 0) continue;
        t.hp = Math.max(1, Math.floor(tds.maxHp * def.revive));
        used = true;
      } else if (def.healPower) {
        if (t.hp <= 0 || t.hp >= tds.maxHp) continue;
        const heal = Math.floor(def.healPower * (1 + ds.spirit / 200));
        t.hp = Math.min(tds.maxHp, t.hp + heal);
        used = true;
      }
    }
    if (used) {
      member.mp -= cost;
      sound.sfx('heal');
      this.info(`${member.name}は${def.name}を使った。`);
    } else {
      this.info('効果がなかった。');
    }
    this.refreshParty();
  }

  // ---- そうび ----
  private async equipFlow(): Promise<void> {
    const member = await this.pickMember('だれの装備？');
    if (!member) return;
    for (;;) {
      const slots: EquipSlot[] = ['weapon', 'shield', 'body', 'head', 'accessory'];
      const slotItems: MenuItem[] = slots.map((s) => {
        const eqId = member.equipment[s];
        const eq = eqId ? G.data.equipment.get(eqId) : null;
        return { label: `${SLOT_NAMES[s]}: ${eq?.name ?? '──'}`, value: s };
      });
      const ds = derivedStats(member, G.data);
      this.info(`攻撃${ds.attack} 守備${ds.defense} 魔力${ds.magic} 精神${ds.spirit} 速さ${ds.agility}`);
      const idx = await this.modalMenu(slotItems, {
        x: 6,
        y: 6,
        width: 168,
        title: `${member.name}の装備`,
      });
      if (idx === null) return;
      const slot = slots[idx];
      const candidates = Object.entries(G.run.inventory.equips).filter(([id, n]) => {
        if (n <= 0) return false;
        const eq = G.data.equipment.get(id);
        return !!eq && eq.slot === slot && canEquip(member, id, G.data);
      });
      const before = derivedStats(member, G.data);
      const candItems: MenuItem[] = candidates.map(([id, n]) => {
        const eq = G.data.equipment.get(id)!;
        const delta = slot === 'weapon' ? `攻${eq.stats.attack ?? 0}` : `守${eq.stats.defense ?? 0}`;
        return { label: eq.name, suffix: `${delta} ×${n}`, value: id };
      });
      if (member.equipment[slot]) candItems.push({ label: 'はずす', value: null });
      if (candItems.length === 0) {
        this.info('装備できるものがない。');
        continue;
      }
      const cIdx = await this.modalMenu(candItems, {
        x: 100,
        y: 40,
        width: 170,
        visibleRows: 6,
        title: SLOT_NAMES[slot],
        onChange: (_, item) => {
          if (item.value === null) {
            this.info('装備を外す。');
            return;
          }
          const eq = G.data.equipment.get(item.value as string);
          this.info(eq?.description ?? '');
        },
      });
      if (cIdx === null) continue;
      const chosen = candItems[cIdx].value as string | null;
      const ok = equipFromInventory(member, slot, chosen, G.run.inventory, G.data);
      if (ok) {
        sound.sfx('confirm');
        const after = derivedStats(member, G.data);
        this.info(
          `攻撃${before.attack}→${after.attack}　守備${before.defense}→${after.defense}　魔力${before.magic}→${after.magic}`
        );
      } else {
        sound.sfx('buzzer');
        this.info('装備できない。');
      }
      this.refreshParty();
    }
  }

  // ---- つよさ ----
  private async statusFlow(): Promise<void> {
    const member = await this.pickMember('だれのつよさ？');
    if (!member) return;
    this.clearDetail();
    const panel = drawPanel(this, 6, 6, 308, 190);
    const ds = derivedStats(member, G.data);
    const cls = G.data.classes.get(member.classId)!;
    const jobExp = member.mastery[member.classId] ?? 0;
    const rank = rankForJobExp(jobExp);
    const next = jobExpToNext(jobExp);
    const nextExp = totalExpForLevel(member.level + 1) - member.exp;
    const p = member.personality;
    const lines = [
      `${member.name}　Lv${member.level}　${cls.name}〔${rankName(rank)}〕`,
      `HP ${member.hp}/${ds.maxHp}　MP ${member.mp}/${ds.maxMp}　列: ${member.row === 'front' ? '前列' : '後列'}`,
      `攻撃 ${ds.attack}　守備 ${ds.defense}　魔力 ${ds.magic}`,
      `精神 ${ds.spirit}　素早さ ${ds.agility}　運 ${ds.luck}`,
      `次のレベルまで ${Math.max(0, nextExp)}`,
      `職業熟練度 ${jobExp}${next !== null ? `（次のランクまで ${next}）` : '（極星）'}`,
      `性格: 勇気${p.courage} 慈愛${p.mercy} 知略${p.wisdom} 自由${p.freedom} 規律${p.order} 野心${p.ambition}`,
      `習得技 ${member.learned.length}種  技セット ${member.loadout.length}/8`,
    ];
    const text = makeText(this, 16, 16, lines.join('\n'), 10);
    text.setLineSpacing(6);
    this.detailObjects.push(panel, text);
    const idx = await this.modalMenu(
      [{ label: member.row === 'front' ? '後列に下がる' : '前列に出る' }, { label: 'とじる' }],
      { x: 180, y: 150, width: 128 }
    );
    if (idx === 0) {
      member.row = member.row === 'front' ? 'back' : 'front';
      this.info(`${member.name}は${member.row === 'front' ? '前列' : '後列'}に移動した。`);
    }
    this.clearDetail();
    this.refreshParty();
  }

  // ---- れんけい ----
  private async comboFlow(): Promise<void> {
    this.clearDetail();
    const panel = drawPanel(this, 6, 6, 308, 190);
    const combos = [...G.data.skills.values()].filter((s) => s.kind === 'combo');
    const lines: string[] = ['【連携技】対応する技を同じターンに選ぶと発動！', ''];
    for (const c of combos) {
      const partNames = (c.comboParts ?? [])
        .map((p) => {
          const inParty = G.run.party.find((m) => m.actorId === p.actorId);
          const actor = G.data.actors.get(p.actorId);
          return `${inParty?.name ?? actor?.name ?? p.actorId}（${p.tag === 'sword' ? '剣技' : p.tag === 'star' ? '攻撃星術' : p.tag}）`;
        })
        .join(' + ');
      lines.push(`✦ ${c.name}`);
      lines.push(`  ${partNames}`);
      lines.push(`  ${c.description}`);
      lines.push('');
    }
    const text = makeText(this, 16, 14, lines.join('\n'), 9);
    text.setWordWrapWidth(288, true);
    text.setLineSpacing(3);
    this.detailObjects.push(panel, text);
    await this.modalMenu([{ label: 'とじる' }], { x: 220, y: 168, width: 88 });
    this.clearDetail();
  }

  // ---- きろく / せってい ----
  private saveFlow(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.launch('SaveLoad', {
        mode: 'save',
        from: 'Menu',
        onClose: () => resolve(),
      });
      this.scene.pause();
    });
  }

  private settingsFlow(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.launch('Settings', {
        from: 'Menu',
        onClose: () => resolve(),
      });
      this.scene.pause();
    });
  }

  override update(time: number, delta: number): void {
    controls.pollGamepad();
    const top = this.menus[this.menus.length - 1];
    top?.update(time, delta);
  }
}

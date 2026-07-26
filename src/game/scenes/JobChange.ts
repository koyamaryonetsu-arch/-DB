// 星環神殿: 転職（レベル維持・能力は職業補正で変化・技は継承ルールに従う）

import Phaser from 'phaser';
import { G } from '../store';
import { controls } from '../input/controls';
import { sound } from '../audio/sound';
import { MenuList, drawPanel, makeText, type MenuItem } from '../ui/ui';
import type { ClassDefinition, PartyMember } from '../../core/types';
import { changeClass, meetsUnlockConditions } from '../../core/skills';
import { clampVitals, derivedStats } from '../../core/stats';
import { rankForJobExp, rankName } from '../../core/mastery';
import { equipFromInventory } from '../../core/inventory';

interface JobChangeInit {
  onClose: () => void;
}

export class JobChangeScene extends Phaser.Scene {
  private init_!: JobChangeInit;
  private menus: MenuList[] = [];
  private infoText!: Phaser.GameObjects.Text;
  private previewText!: Phaser.GameObjects.Text;
  private closing = false;

  constructor() {
    super('JobChange');
  }

  init(data: JobChangeInit): void {
    this.init_ = data;
  }

  create(): void {
    this.menus = [];
    this.closing = false;
    this.add.rectangle(160, 120, 320, 240, 0x05060c, 0.78);
    drawPanel(this, 6, 6, 308, 24);
    const title = makeText(this, 160, 12, '星環神殿 ─ 職の導き', 11);
    title.setOrigin(0.5, 0);
    drawPanel(this, 150, 34, 164, 160);
    this.previewText = makeText(this, 158, 42, '', 9);
    this.previewText.setWordWrapWidth(150, true);
    this.previewText.setLineSpacing(4);
    drawPanel(this, 6, 200, 308, 34);
    this.infoText = makeText(this, 14, 206, '', 9);
    this.infoText.setWordWrapWidth(292, true);
    void this.flow();
    controls.clearPressed();
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

  private requirementText(cls: ClassDefinition): string {
    if (cls.unlockConditions.length === 0) return '';
    return cls.unlockConditions
      .map((c) => {
        if (c.type === 'classRank') {
          const req = G.data.classes.get(c.classId ?? '');
          return `${req?.name ?? c.classId}ランク${c.rank}`;
        }
        return '特別な条件';
      })
      .join(' / ');
  }

  private preview(member: PartyMember, cls: ClassDefinition): void {
    const jobExp = member.mastery[cls.id] ?? 0;
    const rank = rankForJobExp(jobExp);
    const current = derivedStats(member, G.data);
    const trial: PartyMember = { ...member, classId: cls.id, equipment: { ...member.equipment } };
    // 装備できない武器は外した状態で試算
    if (trial.equipment.weapon) {
      const eq = G.data.equipment.get(trial.equipment.weapon);
      if (eq?.weaponType && !cls.allowedWeapons.includes(eq.weaponType)) {
        delete trial.equipment.weapon;
      }
    }
    const after = derivedStats(trial, G.data);
    const arrow = (a: number, b: number) => `${a}→${b}${b > a ? '▲' : b < a ? '▽' : ''}`;
    const skills = cls.learnableSkills
      .slice(0, 4)
      .map((ls) => `R${ls.rank} ${G.data.skills.get(ls.skillId)?.name ?? ''}`)
      .join('\n');
    this.previewText.setText(
      [
        `【${cls.name}】熟練度: ${rankName(rank)}`,
        `HP ${arrow(current.maxHp, after.maxHp)}  MP ${arrow(current.maxMp, after.maxMp)}`,
        `攻撃 ${arrow(current.attack, after.attack)}`,
        `守備 ${arrow(current.defense, after.defense)}`,
        `魔力 ${arrow(current.magic, after.magic)}`,
        `素早さ ${arrow(current.agility, after.agility)}`,
        `武器: ${cls.allowedWeapons.map((w) => WEAPON_NAMES[w] ?? w).join('・')}`,
        '─ 習得技 ─',
        skills,
      ].join('\n')
    );
    this.infoText.setText(cls.description);
  }

  private async flow(): Promise<void> {
    for (;;) {
      const memberIdx = await this.modalMenu(
        G.run.party.map((m) => {
          const cls = G.data.classes.get(m.classId);
          return { label: m.name, suffix: cls?.name ?? '' };
        }),
        { x: 6, y: 34, width: 140, title: 'だれが導きを受ける？' }
      );
      if (memberIdx === null) {
        this.close();
        return;
      }
      const member = G.run.party[memberIdx];
      for (;;) {
        const classes = [...G.data.classes.values()].filter(
          (c) => c.category === 'basic' || c.category === 'advanced'
        );
        const items: MenuItem[] = classes.map((c) => {
          const rank = rankForJobExp(member.mastery[c.id] ?? 0);
          const unlocked = c.available && meetsUnlockConditions(member, c, G.run.flags);
          const isCurrent = member.classId === c.id;
          return {
            label: `${isCurrent ? '▶' : '　'}${c.name}`,
            suffix: c.available ? `R${rank}` : '─',
            disabled: !unlocked || isCurrent,
            value: c.id,
          };
        });
        const clsIdx = await this.modalMenu(items, {
          x: 6,
          y: 34,
          width: 140,
          visibleRows: 10,
          title: `${member.name}の職業`,
          onChange: (_, item) => {
            const cls = G.data.classes.get(item.value as string);
            if (cls) {
              this.preview(member, cls);
              if (!cls.available) {
                this.infoText.setText(`この章ではまだ選べない。${this.requirementText(cls) ? `条件: ${this.requirementText(cls)}` : ''}`);
              } else if (!meetsUnlockConditions(member, cls, G.run.flags)) {
                this.infoText.setText(`条件: ${this.requirementText(cls)}`);
              }
            }
          },
        });
        if (clsIdx === null) break;
        const cls = classes[clsIdx];
        const confirm = await this.modalMenu(
          [{ label: `${cls.name}になる` }, { label: 'やめる' }],
          { x: 90, y: 120, width: 140 }
        );
        if (confirm !== 0) continue;
        // 装備できない武器は外す
        if (member.equipment.weapon) {
          const eq = G.data.equipment.get(member.equipment.weapon);
          if (eq?.weaponType && !cls.allowedWeapons.includes(eq.weaponType)) {
            equipFromInventory(member, 'weapon', null, G.run.inventory, G.data);
            this.infoText.setText('扱えない武器を外した。');
          }
        }
        changeClass(member, cls.id, G.data);
        clampVitals(member, G.data);
        sound.sfx('levelup');
        this.infoText.setText(`${member.name}は${cls.name}への道を歩み始めた！`);
        break;
      }
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

const WEAPON_NAMES: Record<string, string> = {
  sword: '片手剣',
  greatsword: '大剣',
  spear: '槍',
  axe: '斧',
  bow: '弓',
  dagger: '短剣',
  knuckle: '拳甲',
  staff: '杖',
  resonstaff: '響杖',
  bellblade: '鈴刃',
  ringblade: '環状刃',
  ancientgun: '古代銃',
  grimoire: '魔導書',
};

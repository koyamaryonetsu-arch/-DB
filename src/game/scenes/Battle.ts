// 戦闘シーン: コアエンジンのイベント列を演出として再生する

import Phaser from 'phaser';
import { G } from '../store';
import { controls } from '../input/controls';
import { sound } from '../audio/sound';
import { MenuList, drawPanel, makeText, shakeScreen, type MenuItem } from '../ui/ui';
import {
  applyBattleResultToParty,
  createBattle,
  enemyUnits,
  partyUnits,
  resolveRound,
} from '../../core/battle/engine';
import type { BattleEvent, BattleState, Combatant, Command, TargetRef } from '../../core/battle/types';
import { gainExp, DIFFICULTY_EXP_MUL } from '../../core/leveling';
import { gainJobExp, rankName } from '../../core/mastery';
import { addEquip, addItem, equipFromInventory, canEquip } from '../../core/inventory';
import { derivedStats } from '../../core/stats';
import { AUTO_SLOT } from '../../core/save';
import type { SkillDefinition } from '../../core/types';

interface BattleInit {
  monsterIds: string[];
  boss: boolean;
  bgKey: string;
  onEnd: (result: 'victory' | 'defeat' | 'escape') => void;
}

export class BattleScene extends Phaser.Scene {
  private init_!: BattleInit;
  private battle!: BattleState;
  private enemySprites = new Map<string, Phaser.GameObjects.Image>();
  private msgText!: Phaser.GameObjects.Text;
  private statusTexts: Phaser.GameObjects.Text[] = [];
  private gaugeBars!: Phaser.GameObjects.Graphics;
  private menus: MenuList[] = [];
  private targetCursor!: Phaser.GameObjects.Image;
  private queued: Command[] = [];
  private ended = false;
  /** 対象選択中はメニューの入力処理を止める */
  private suppressMenus = false;

  constructor() {
    super('Battle');
  }

  init(data: BattleInit): void {
    this.init_ = data;
  }

  create(): void {
    this.ended = false;
    this.menus = [];
    this.queued = [];
    this.enemySprites.clear();
    const run = G.run;
    this.battle = createBattle(
      {
        party: run.party,
        monsterIds: this.init_.monsterIds,
        inventory: run.inventory,
        bossBattle: this.init_.boss,
        difficulty: G.settings.difficulty,
      },
      G.data
    );
    // 図鑑
    for (const mid of this.init_.monsterIds) {
      if (!run.zukan.includes(mid)) run.zukan.push(mid);
    }

    this.add.image(0, 0, this.init_.bgKey).setOrigin(0, 0);
    const ground = this.add.graphics();
    ground.fillStyle(0x0e1428, 1);
    ground.fillRect(0, 150, 320, 90);

    // 敵配置
    this.layoutEnemies();

    // メッセージウィンドウ
    drawPanel(this, 4, 4, 312, 32);
    this.msgText = makeText(this, 12, 9, '', 10);
    this.msgText.setWordWrapWidth(296, true);

    // パーティーステータス
    drawPanel(this, 120, 178, 196, 58);
    this.gaugeBars = this.add.graphics();
    this.gaugeBars.setDepth(10);
    for (let i = 0; i < 4; i++) {
      const t = makeText(this, 128, 183 + i * 17, '', 9);
      t.setDepth(10);
      this.statusTexts.push(t);
    }
    this.updateStatusPanel();

    this.targetCursor = this.add.image(0, 0, 'cursor');
    this.targetCursor.setAngle(90);
    this.targetCursor.setVisible(false);
    this.targetCursor.setDepth(50);

    sound.playBgm(this.init_.boss ? 'bgm_boss' : 'bgm_battle');
    controls.clearPressed();
    void this.battleLoop();
  }

  private layoutEnemies(): void {
    const enemies = enemyUnits(this.battle);
    const n = enemies.length;
    enemies.forEach((e, i) => {
      const spacing = this.init_.boss ? 88 : Math.min(64, 240 / Math.max(1, n - 1) || 64);
      const x = 160 + (i - (n - 1) / 2) * spacing;
      this.spawnEnemySprite(e, x);
    });
  }

  private spawnEnemySprite(e: Combatant, x?: number): void {
    const img = this.add.image(x ?? 160, 148, `mon_${e.monsterId}`);
    img.setOrigin(0.5, 1);
    this.enemySprites.set(e.uid, img);
  }

  // ---- ユーティリティ ----

  private waitFrame(): Promise<void> {
    return new Promise((r) => this.events.once(Phaser.Scenes.Events.POST_UPDATE, () => r()));
  }

  private async msgWait(baseMs: number): Promise<void> {
    const mul = [1.5, 1, 0.55][G.settings.battleSpeed - 1] ?? 1;
    const ms = baseMs * mul;
    const start = this.time.now;
    controls.clearPressed();
    while (this.time.now - start < ms) {
      await this.waitFrame();
      if (controls.justPressed('confirm')) break;
    }
  }

  private say(text: string): void {
    this.msgText.setText(text);
  }

  private updateStatusPanel(): void {
    const units = partyUnits(this.battle);
    this.gaugeBars.clear();
    for (let i = 0; i < 4; i++) {
      const t = this.statusTexts[i];
      const u = units[i];
      if (!u) {
        t.setText('');
        continue;
      }
      const dead = u.hp <= 0;
      t.setColor(dead ? '#8a5a5a' : '#e8e8f0');
      const st = u.statuses.length > 0 ? '*' : ' ';
      t.setText(
        `${u.name.padEnd(4, '　').slice(0, 4)}${st}HP${String(u.hp).padStart(3)} MP${String(u.mp).padStart(3)}`
      );
      // 奥義ゲージ
      const gx = 262;
      const gy = 187 + i * 17;
      this.gaugeBars.fillStyle(0x2a3050, 1);
      this.gaugeBars.fillRect(gx, gy, 46, 5);
      const rate = u.gauge / 100;
      this.gaugeBars.fillStyle(rate >= 1 ? 0xf0d060 : 0x6a90d8, 1);
      this.gaugeBars.fillRect(gx, gy, Math.floor(46 * rate), 5);
    }
  }

  private openMenu(items: MenuItem[], opts: ConstructorParameters<typeof MenuList>[2]): MenuList {
    const menu = new MenuList(this, items, opts);
    this.menus.push(menu);
    return menu;
  }

  private closeMenu(menu: MenuList): void {
    menu.destroy();
    this.menus = this.menus.filter((m) => m !== menu);
  }

  // ---- メインループ ----

  private async battleLoop(): Promise<void> {
    this.say(this.init_.boss ? '森喰いのバルグロウが立ちはだかる！' : 'モンスターが現れた！');
    await this.msgWait(800);
    while (!this.battle.finished && !this.ended) {
      const commands = await this.collectCommands();
      if (this.battle.finished || this.ended) break;
      const events = resolveRound(this.battle, commands, G.rng, G.data);
      await this.playEvents(events);
      this.updateStatusPanel();
    }
    if (this.ended) return;
    applyBattleResultToParty(this.battle, G.run.party);
    if (this.battle.finished === 'victory') {
      await this.victoryFlow();
      this.finish('victory');
    } else if (this.battle.finished === 'escape') {
      await this.msgWait(300);
      this.finish('escape');
    } else if (this.battle.finished === 'defeat') {
      await this.defeatFlow();
    }
  }

  private finish(result: 'victory' | 'defeat' | 'escape'): void {
    if (this.ended) return;
    this.ended = true;
    sound.stopBgm();
    this.scene.stop();
    this.scene.resume('Field');
    this.init_.onEnd(result);
  }

  // ---- コマンド入力 ----

  private async collectCommands(): Promise<Command[]> {
    this.queued = [];
    const units = partyUnits(this.battle).filter((u) => u.hp > 0);
    let i = 0;
    while (i < units.length) {
      const result = await this.commandForMember(units[i], i > 0);
      if (result === 'back') {
        this.queued.pop();
        i = Math.max(0, i - 1);
      } else {
        this.queued.push(result);
        i++;
      }
    }
    return this.queued;
  }

  private commandForMember(unit: Combatant, canBack: boolean): Promise<Command | 'back'> {
    return new Promise((resolve) => {
      this.say(`${unit.name}はどうする？`);
      const items: MenuItem[] = [
        { label: 'たたかう' },
        { label: '特技', disabled: this.skillsOf(unit, 'skill').length === 0 },
        { label: '術式', disabled: this.skillsOf(unit, 'spell').length === 0 },
        { label: '防御' },
        { label: '道具', disabled: this.battleItems().length === 0 },
        { label: '装備変更', disabled: this.swapWeapons(unit).length === 0 },
        { label: '交代', disabled: true, suffix: '─' },
        { label: 'にげる', disabled: this.battle.bossBattle },
      ];
      const menu = this.openMenu(items, {
        x: 4,
        y: 178,
        width: 112,
        visibleRows: 4,
        onSelect: (idx) => {
          void (async () => {
            switch (idx) {
              case 0: {
                const target = await this.pickEnemyTarget('single');
                if (!target) return;
                this.closeMenu(menu);
                resolve({ type: 'attack', userUid: unit.uid, target });
                break;
              }
              case 1:
              case 2: {
                const kind = idx === 1 ? 'skill' : 'spell';
                const cmd = await this.pickSkill(unit, kind);
                if (!cmd) return;
                this.closeMenu(menu);
                resolve(cmd);
                break;
              }
              case 3:
                this.closeMenu(menu);
                resolve({ type: 'defend', userUid: unit.uid });
                break;
              case 4: {
                const cmd = await this.pickItem(unit);
                if (!cmd) return;
                this.closeMenu(menu);
                resolve(cmd);
                break;
              }
              case 5: {
                const done = await this.pickEquip(unit);
                if (!done) return;
                this.closeMenu(menu);
                resolve({ type: 'equip', userUid: unit.uid, slot: 'weapon', equipId: done });
                break;
              }
              case 7:
                this.closeMenu(menu);
                resolve({ type: 'flee', userUid: unit.uid });
                break;
            }
          })();
        },
        onCancel: canBack
          ? () => {
              this.closeMenu(menu);
              resolve('back');
            }
          : undefined,
      });
    });
  }

  private skillsOf(unit: Combatant, kind: 'skill' | 'spell'): SkillDefinition[] {
    return unit.skills
      .map((id) => G.data.skills.get(id))
      .filter((d): d is SkillDefinition => !!d && d.kind === kind);
  }

  private battleItems(): { id: string; count: number }[] {
    return Object.entries(this.battle.inventory.items)
      .filter(([id]) => G.data.items.get(id)?.usableInBattle)
      .map(([id, count]) => ({ id, count }));
  }

  private swapWeapons(unit: Combatant): string[] {
    if (unit.memberIndex === undefined) return [];
    const member = G.run.party[unit.memberIndex];
    return Object.entries(this.battle.inventory.equips)
      .filter(([id, n]) => n > 0 && G.data.equipment.get(id)?.slot === 'weapon' && canEquip(member, id, G.data))
      .map(([id]) => id);
  }

  /** 連携のヒント: 既に選んだ味方の技とタグが噛み合うなら表示 */
  private comboHint(unit: Combatant, def: SkillDefinition): boolean {
    for (const combo of G.data.skills.values()) {
      if (combo.kind !== 'combo' || !combo.comboParts || combo.comboParts.length !== 2) continue;
      const mine = combo.comboParts.find((p) => p.actorId === unit.actorId);
      const partner = combo.comboParts.find((p) => p.actorId !== unit.actorId);
      if (!mine || !partner) continue;
      if (!(def.tags ?? []).includes(mine.tag) || def.power <= 0) continue;
      const partnerQueued = this.queued.some((cmd) => {
        if (cmd.type !== 'skill') return false;
        const u = this.battle.combatants.find((c) => c.uid === cmd.userUid);
        const d = G.data.skills.get(cmd.skillId);
        return !!u && !!d && u.actorId === partner.actorId && (d.tags ?? []).includes(partner.tag) && d.power > 0;
      });
      if (partnerQueued) return true;
    }
    return false;
  }

  private pickSkill(unit: Combatant, kind: 'skill' | 'spell'): Promise<Command | null> {
    return new Promise((resolve) => {
      const defs = this.skillsOf(unit, kind);
      const items: MenuItem[] = defs.map((d) => {
        const cost = d.ougi ? `奥義` : `MP${Math.ceil(d.mpCost * unit.mpCostMul)}`;
        let disabled = false;
        if (d.ougi) {
          disabled = unit.gauge < (d.gaugeCost ?? 100) ||
            (d.requiresHpRateLte !== undefined && unit.hp > unit.stats.maxHp * d.requiresHpRateLte);
        } else {
          disabled = unit.mp < Math.ceil(d.mpCost * unit.mpCostMul);
        }
        const hint = this.comboHint(unit, d) ? '★' : '';
        return { label: `${hint}${d.name}`, suffix: cost, disabled, value: d };
      });
      const menu = this.openMenu(items, {
        x: 40,
        y: 116,
        width: 200,
        visibleRows: 4,
        title: kind === 'skill' ? '特技' : '術式',
        onChange: (_, item) => {
          const d = item.value as SkillDefinition;
          this.say(d.description);
        },
        onSelect: (idx) => {
          void (async () => {
            const d = defs[idx];
            const target = await this.pickTargetFor(d, unit);
            if (!target) return;
            this.closeMenu(menu);
            resolve({ type: 'skill', userUid: unit.uid, skillId: d.id, target });
          })();
        },
        onCancel: () => {
          this.closeMenu(menu);
          this.say(`${unit.name}はどうする？`);
          resolve(null);
        },
      });
      if (defs.length > 0) this.say(defs[0].description);
    });
  }

  private pickItem(unit: Combatant): Promise<Command | null> {
    return new Promise((resolve) => {
      const items = this.battleItems();
      const menuItems: MenuItem[] = items.map((it) => {
        const def = G.data.items.get(it.id)!;
        return { label: def.name, suffix: `×${it.count}`, value: def };
      });
      const menu = this.openMenu(menuItems, {
        x: 40,
        y: 116,
        width: 200,
        visibleRows: 4,
        title: '道具',
        onChange: (_, item) => this.say((item.value as { description: string }).description),
        onSelect: (idx) => {
          void (async () => {
            const def = G.data.items.get(items[idx].id)!;
            const target =
              def.target === 'allyDead'
                ? await this.pickAllyTarget(true)
                : await this.pickAllyTarget(false);
            if (!target) return;
            this.closeMenu(menu);
            resolve({ type: 'item', userUid: unit.uid, itemId: def.id, target });
          })();
        },
        onCancel: () => {
          this.closeMenu(menu);
          this.say(`${unit.name}はどうする？`);
          resolve(null);
        },
      });
      if (items.length > 0) this.say(G.data.items.get(items[0].id)!.description);
    });
  }

  private pickEquip(unit: Combatant): Promise<string | null> {
    return new Promise((resolve) => {
      const weapons = this.swapWeapons(unit);
      const menu = this.openMenu(
        weapons.map((id) => {
          const def = G.data.equipment.get(id)!;
          return { label: def.name, suffix: `攻+${def.stats.attack ?? 0}`, value: id };
        }),
        {
          x: 40,
          y: 116,
          width: 200,
          visibleRows: 4,
          title: '装備変更（武器）',
          onSelect: (idx) => {
            const id = weapons[idx];
            if (unit.memberIndex !== undefined) {
              const member = G.run.party[unit.memberIndex];
              equipFromInventory(member, 'weapon', id, this.battle.inventory, G.data);
              // 戦闘中ユニットの能力を更新
              const ds = derivedStats(member, G.data);
              unit.stats.attack = ds.attack;
              unit.stats.defense = ds.defense;
              unit.stats.magic = ds.magic;
              unit.stats.agility = ds.agility;
              unit.attackElement = ds.attackElement;
              unit.elementBoost = { ...ds.elementBoost };
            }
            this.closeMenu(menu);
            resolve(id);
          },
          onCancel: () => {
            this.closeMenu(menu);
            this.say(`${unit.name}はどうする？`);
            resolve(null);
          },
        }
      );
    });
  }

  private pickTargetFor(def: SkillDefinition, unit: Combatant): Promise<TargetRef | null> {
    switch (def.target) {
      case 'enemySingle':
        return this.pickEnemyTarget('single');
      case 'enemyGroup':
        return this.pickEnemyTarget('group');
      case 'enemyAll':
        return this.pickEnemyTarget('all');
      case 'allySingle':
        return this.pickAllyTarget(false);
      case 'allyDead':
        return this.pickAllyTarget(true);
      case 'allyAll':
        return Promise.resolve({ kind: 'side', side: 'party' });
      case 'self':
      default:
        return Promise.resolve({ kind: 'self' });
        void unit;
    }
  }

  private async pickEnemyTarget(mode: 'single' | 'group' | 'all'): Promise<TargetRef | null> {
    const alive = enemyUnits(this.battle).filter((e) => e.hp > 0);
    if (alive.length === 0) return null;
    if (mode === 'all') {
      this.say('敵全体');
      return { kind: 'side', side: 'enemy' };
    }
    let idx = 0;
    this.targetCursor.setVisible(true);
    this.suppressMenus = true;
    controls.clearPressed();
    try {
      for (;;) {
        const target = alive[idx];
        const spr = this.enemySprites.get(target.uid);
        if (spr) this.targetCursor.setPosition(spr.x, spr.y - spr.displayHeight - 6);
        if (mode === 'single') {
          this.say(`→ ${target.name}`);
        } else {
          const groupNames = alive.filter((e) => e.group === target.group).map((e) => e.name);
          this.say(`→ ${groupNames.join('・')}`);
        }
        await this.waitFrame();
        if (controls.justPressed('left') || controls.justPressed('up')) {
          idx = (idx - 1 + alive.length) % alive.length;
          sound.sfx('cursor');
        }
        if (controls.justPressed('right') || controls.justPressed('down')) {
          idx = (idx + 1) % alive.length;
          sound.sfx('cursor');
        }
        if (controls.justPressed('confirm')) {
          sound.sfx('confirm');
          if (mode === 'single') return { kind: 'unit', uid: alive[idx].uid };
          return { kind: 'group', group: alive[idx].group ?? 'A' };
        }
        if (controls.justPressed('cancel')) {
          sound.sfx('cancel');
          return null;
        }
      }
    } finally {
      this.targetCursor.setVisible(false);
      this.suppressMenus = false;
    }
  }

  private async pickAllyTarget(deadOnly: boolean): Promise<TargetRef | null> {
    const units = partyUnits(this.battle).filter((u) => (deadOnly ? u.hp <= 0 : true));
    if (units.length === 0) {
      this.say('対象がいない。');
      await this.msgWait(500);
      return null;
    }
    let idx = 0;
    this.suppressMenus = true;
    controls.clearPressed();
    try {
      for (;;) {
        this.say(`→ ${units[idx].name}（HP ${units[idx].hp}/${units[idx].stats.maxHp}）`);
        await this.waitFrame();
        if (controls.justPressed('up') || controls.justPressed('left')) {
          idx = (idx - 1 + units.length) % units.length;
          sound.sfx('cursor');
        }
        if (controls.justPressed('down') || controls.justPressed('right')) {
          idx = (idx + 1) % units.length;
          sound.sfx('cursor');
        }
        if (controls.justPressed('confirm')) {
          sound.sfx('confirm');
          return { kind: 'unit', uid: units[idx].uid };
        }
        if (controls.justPressed('cancel')) {
          sound.sfx('cancel');
          return null;
        }
      }
    } finally {
      this.suppressMenus = false;
    }
  }

  // ---- イベント再生 ----

  private async playEvents(events: BattleEvent[]): Promise<void> {
    for (const ev of events) {
      if (this.ended) return;
      switch (ev.type) {
        case 'message':
          this.say(ev.text);
          await this.msgWait(620);
          break;
        case 'actStart':
          this.say(ev.label);
          await this.msgWait(480);
          break;
        case 'combo':
          this.say(`✦ 連携技 ${ev.name}！`);
          sound.sfx('combo');
          await this.msgWait(750);
          break;
        case 'damage': {
          const spr = this.enemySprites.get(ev.uid);
          sound.sfx(ev.crit ? 'crit' : 'hit');
          if (spr) {
            spr.setTintFill(0xffffff);
            this.time.delayedCall(90, () => spr.clearTint());
            this.popup(spr.x, spr.y - spr.displayHeight / 2, String(ev.amount), ev.weak ? '#f0d060' : '#ffffff');
            if (ev.weak) {
              this.say('弱点を突いた！');
            }
          } else {
            // 味方被弾
            shakeScreen(this);
            const unit = this.battle.combatants.find((c) => c.uid === ev.uid);
            const i = partyUnits(this.battle).findIndex((u) => u.uid === ev.uid);
            if (i >= 0) this.popup(210, 183 + i * 17, `-${ev.amount}`, '#f08080');
            void unit;
          }
          this.updateStatusPanel();
          await this.msgWait(340);
          break;
        }
        case 'miss':
          await this.msgWait(120);
          break;
        case 'heal': {
          sound.sfx('heal');
          const i = partyUnits(this.battle).findIndex((u) => u.uid === ev.uid);
          if (i >= 0) this.popup(210, 183 + i * 17, `+${ev.amount}`, '#80f0a0');
          const spr = this.enemySprites.get(ev.uid);
          if (spr) this.popup(spr.x, spr.y - spr.displayHeight / 2, `+${ev.amount}`, '#80f0a0');
          this.updateStatusPanel();
          await this.msgWait(300);
          break;
        }
        case 'healMp':
          this.updateStatusPanel();
          break;
        case 'ko': {
          const spr = this.enemySprites.get(ev.uid);
          if (spr) {
            sound.sfx('ko');
            this.tweens.add({ targets: spr, alpha: 0, scaleY: 0.2, duration: 320 });
          } else {
            shakeScreen(this, 0.012, 200);
            sound.sfx('ko');
          }
          this.updateStatusPanel();
          await this.msgWait(320);
          break;
        }
        case 'revive':
          sound.sfx('heal');
          this.updateStatusPanel();
          break;
        case 'gauge':
          this.updateStatusPanel();
          break;
        case 'status':
        case 'cure':
        case 'buff':
          break;
        case 'summon': {
          const unit = this.battle.combatants.find((c) => c.uid === ev.uid);
          if (unit) {
            const n = enemyUnits(this.battle).length;
            this.spawnEnemySprite(unit, 40 + (n - 1) * 56);
          }
          await this.msgWait(300);
          break;
        }
        case 'bossPhase':
          sound.sfx('buzzer');
          shakeScreen(this, 0.01, 300);
          await this.msgWait(400);
          break;
        case 'rampage':
          sound.sfx('crit');
          shakeScreen(this, 0.012, 300);
          break;
        case 'itemGain':
          break;
        case 'fleeResult':
          if (!ev.success) await this.msgWait(250);
          break;
        case 'shake':
          shakeScreen(this);
          break;
        case 'flash':
          break;
        case 'victory':
        case 'defeat':
          break;
      }
    }
  }

  private popup(x: number, y: number, text: string, color: string): void {
    const t = makeText(this, x, y, text, 11, color);
    t.setOrigin(0.5, 1);
    t.setDepth(100);
    t.setStroke('#1a1424', 3);
    this.tweens.add({
      targets: t,
      y: y - 14,
      alpha: 0,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  // ---- 勝敗処理 ----

  private async victoryFlow(): Promise<void> {
    const rewards = this.battle.rewards!;
    sound.sfx('levelup');
    this.say('戦いに勝った！');
    await this.msgWait(700);
    const run = G.run;
    const expMul = DIFFICULTY_EXP_MUL[G.settings.difficulty] ?? 1;
    run.inventory.gold += rewards.gold;
    if (rewards.exp > 0 || rewards.gold > 0) {
      this.say(`${Math.floor(rewards.exp * expMul)}の経験値と${rewards.gold}${G.config.currency}を獲得！`);
      await this.msgWait(700);
    }
    for (const drop of rewards.drops) {
      if (drop.itemId) {
        addItem(run.inventory, drop.itemId);
        this.say(`${G.data.items.get(drop.itemId)?.name}を手に入れた！`);
        await this.msgWait(600);
      } else if (drop.equipId) {
        addEquip(run.inventory, drop.equipId);
        this.say(`${G.data.equipment.get(drop.equipId)?.name}を手に入れた！`);
        await this.msgWait(600);
      }
    }
    // 経験値と職業熟練度
    for (const member of run.party) {
      const actor = G.data.actors.get(member.actorId);
      if (!actor) continue;
      const koMul = member.hp <= 0 ? 0.5 : 1;
      const result = gainExp(member, actor, rewards.exp * expMul * koMul, G.rng);
      if (result) {
        sound.sfx('levelup');
        this.say(`${member.name}はレベル${result.to}に上がった！`);
        await this.msgWait(750);
        const ds = derivedStats(member, G.data);
        member.hp = Math.min(ds.maxHp, member.hp + 5);
        member.mp = Math.min(ds.maxMp, member.mp + 2);
      }
      if (member.hp > 0) {
        const cls = G.data.classes.get(member.classId);
        if (cls) {
          const mResult = gainJobExp(member, cls, rewards.jobExp, rewards.maxEnemyLevel, G.data);
          if (mResult.toRank > mResult.fromRank) {
            sound.sfx('levelup');
            this.say(`${member.name}の${cls.name}熟練度が「${rankName(mResult.toRank)}」に上がった！`);
            await this.msgWait(800);
            for (const sid of mResult.learnedSkills) {
              const sk = G.data.skills.get(sid);
              this.say(`${member.name}は${sk?.name}を覚えた！`);
              await this.msgWait(700);
            }
          }
        }
      }
    }
    this.updateStatusPanel();
  }

  private async defeatFlow(): Promise<void> {
    this.say('全滅してしまった……');
    sound.stopBgm();
    await this.msgWait(1200);
    const hasAuto = (() => {
      try {
        return globalThis.localStorage?.getItem(`${G.config.saveKey}:${AUTO_SLOT}`) !== null;
      } catch {
        return false;
      }
    })();
    const menu = this.openMenu(
      [
        { label: 'オートセーブから再開', disabled: !hasAuto },
        { label: 'タイトルへ戻る' },
      ],
      {
        x: 80,
        y: 110,
        width: 160,
        onSelect: (i) => {
          this.ended = true;
          this.closeMenu(menu);
          if (i === 0) {
            const res = G.loadGame(AUTO_SLOT);
            if (res.ok) {
              this.scene.stop('Field');
              this.scene.stop();
              this.scene.start('Field');
              return;
            }
          }
          this.scene.stop('Field');
          this.scene.stop();
          this.scene.start('Title');
        },
      }
    );
  }

  override update(time: number, delta: number): void {
    controls.pollGamepad();
    if (!this.suppressMenus) {
      this.menus[this.menus.length - 1]?.update(time, delta);
    }
  }
}

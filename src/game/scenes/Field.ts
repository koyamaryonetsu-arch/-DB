// フィールド探索シーン: 村・ワールドマップ・ダンジョンを maps.json から構築する

import Phaser from 'phaser';
import { G } from '../store';
import { controls } from '../input/controls';
import { sound } from '../audio/sound';
import { DialogueBox, drawPanel, makeText, flashScreen } from '../ui/ui';
import type { DialogueDefinition, MapDefinition, MapNpcDef } from '../../core/types';
import { advanceSteps, restToMorning } from '../../core/daynight';
import { addEquip, addItem, equipFromInventory } from '../../core/inventory';
import { joinMember } from '../../core/newgame';
import { derivedStats } from '../../core/stats';

const TILE = 16;
const DIRS = { down: 0, left: 1, right: 2, up: 3 } as const;
const TIME_TINTS = [
  { color: 0xffcc88, alpha: 0.07 },
  { color: 0xffffff, alpha: 0 },
  { color: 0xff8844, alpha: 0.16 },
  { color: 0x101840, alpha: 0.42 },
];
const TIME_LABELS = ['朝', '昼', '夕', '夜'];

export class FieldScene extends Phaser.Scene {
  private map!: MapDefinition;
  private solid: boolean[][] = [];
  private encounterZone: (string | null)[][] = [];
  private player!: Phaser.GameObjects.Sprite;
  private npcSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private chestSprites = new Map<string, Phaser.GameObjects.Image>();
  private moving = false;
  private busy = false; // イベント・会話中
  private dlg!: DialogueBox;
  private tint!: Phaser.GameObjects.Rectangle;
  private timeLabel!: Phaser.GameObjects.Text;
  private stepsSinceBattle = 5;
  private playClock = 0;

  constructor() {
    super('Field');
  }

  create(): void {
    const run = G.run;
    const map = G.data.maps.get(run.mapId);
    if (!map) throw new Error(`未定義のマップ: ${run.mapId}`);
    this.map = map;
    this.moving = false;
    this.busy = false;
    this.stepsSinceBattle = 5;
    this.npcSprites.clear();
    this.chestSprites.clear();

    this.buildMap();
    this.spawnChests();
    this.spawnNpcs();

    this.player = this.add.sprite(0, 0, 'char_hero', '0');
    this.player.setOrigin(0.5, 1);
    this.setPlayerPos(run.pos.x, run.pos.y);
    this.faceDir(run.pos.dir);
    this.player.setDepth(run.pos.y * 10 + 5);

    const w = map.rows[0].length * TILE;
    const h = map.rows.length * TILE;
    this.cameras.main.setBounds(0, 0, Math.max(w, 320), Math.max(h, 240));
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.fadeIn(250);

    // 昼夜の色調
    this.tint = this.add.rectangle(160, 120, 320, 240, 0xffffff, 0);
    this.tint.setScrollFactor(0);
    this.tint.setDepth(5000);
    this.applyTimeTint();

    // HUD: 地名と時刻
    const nameplate = drawPanel(this, 4, 4, 110, 18);
    nameplate.setScrollFactor(0);
    nameplate.setDepth(6000);
    const nameText = makeText(this, 10, 8, map.name, 9);
    nameText.setScrollFactor(0);
    nameText.setDepth(6001);
    this.tweens.add({
      targets: [nameplate, nameText],
      alpha: 0,
      delay: 2200,
      duration: 500,
    });
    const timePanel = drawPanel(this, 284, 4, 32, 18);
    timePanel.setScrollFactor(0);
    timePanel.setDepth(6000);
    this.timeLabel = makeText(this, 300, 8, TIME_LABELS[run.timeIndex], 9, '#f0d060');
    this.timeLabel.setOrigin(0.5, 0);
    this.timeLabel.setScrollFactor(0);
    this.timeLabel.setDepth(6001);

    this.dlg = new DialogueBox(this);
    sound.playBgm(map.bgm);

    // プレイ時間の計測
    this.playClock = 0;

    // 自動イベント
    this.time.delayedCall(300, () => void this.checkAutoEvents());
    controls.clearPressed();
  }

  // ---- マップ構築 ----

  private buildMap(): void {
    const map = this.map;
    const rows = map.rows;
    const w = rows[0].length;
    const h = rows.length;
    this.solid = [];
    this.encounterZone = [];
    const rt = this.add.renderTexture(0, 0, w * TILE, h * TILE);
    rt.setOrigin(0, 0);
    rt.setDepth(0);
    for (let y = 0; y < h; y++) {
      const solidRow: boolean[] = [];
      const encRow: (string | null)[] = [];
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        const cell = map.legend[ch];
        rt.draw(`tile_${cell.tile}`, x * TILE, y * TILE);
        solidRow.push(cell.solid ?? false);
        encRow.push(cell.encounter ?? null);
      }
      this.solid.push(solidRow);
      this.encounterZone.push(encRow);
    }
  }

  private spawnChests(): void {
    for (const chest of this.map.chests) {
      const opened = G.run.chests[chest.id] ?? false;
      const img = this.add.image(
        chest.x * TILE + TILE / 2,
        chest.y * TILE + TILE / 2,
        opened ? 'tile_chest_open' : 'tile_chest_closed'
      );
      img.setDepth(chest.y * 10 + 2);
      this.chestSprites.set(chest.id, img);
    }
  }

  private npcVisible(npc: MapNpcDef): boolean {
    if (npc.times && !npc.times.includes(G.run.timeIndex)) return false;
    return true;
  }

  private spawnNpcs(): void {
    for (const npc of this.map.npcs) {
      if (npc.sprite === 'sign') {
        const img = this.add.image(npc.x * TILE + TILE / 2, npc.y * TILE + TILE / 2, 'tile_sign');
        img.setDepth(npc.y * 10 + 2);
        continue;
      }
      const spr = this.add.sprite(npc.x * TILE + TILE / 2, npc.y * TILE + TILE - 1, `char_${npc.sprite}`, '0');
      spr.setOrigin(0.5, 1);
      spr.setDepth(npc.y * 10 + 4);
      spr.setVisible(this.npcVisible(npc));
      this.npcSprites.set(npc.id, spr);
    }
  }

  private refreshNpcVisibility(): void {
    for (const npc of this.map.npcs) {
      const spr = this.npcSprites.get(npc.id);
      spr?.setVisible(this.npcVisible(npc));
    }
  }

  // ---- 移動 ----

  private setPlayerPos(tx: number, ty: number): void {
    this.player.setPosition(tx * TILE + TILE / 2, ty * TILE + TILE - 1);
  }

  private faceDir(dir: 'up' | 'down' | 'left' | 'right'): void {
    G.run.pos.dir = dir;
    this.player.setFrame(String(DIRS[dir] * 3));
  }

  private isBlocked(tx: number, ty: number): boolean {
    if (ty < 0 || ty >= this.solid.length || tx < 0 || tx >= this.solid[0].length) return true;
    if (this.solid[ty][tx]) return true;
    for (const npc of this.map.npcs) {
      if (npc.x === tx && npc.y === ty && this.npcVisible(npc)) return true;
    }
    for (const chest of this.map.chests) {
      if (chest.x === tx && chest.y === ty && !(G.run.chests[chest.id] ?? false)) return true;
    }
    return false;
  }

  private tryMove(dir: 'up' | 'down' | 'left' | 'right'): void {
    const run = G.run;
    this.faceDir(dir);
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const nx = run.pos.x + delta[0];
    const ny = run.pos.y + delta[1];

    // ワープタイルへの移動は許可
    const warp = this.map.warps.find((w) => w.x === nx && w.y === ny);
    if (!warp && this.isBlocked(nx, ny)) return;

    this.moving = true;
    const dash = G.settings.alwaysDash !== controls.isDown('dash'); // XOR: 設定ONならShiftで歩き
    const duration = dash ? 95 : 150;
    const frames = [DIRS[dir] * 3 + 1, DIRS[dir] * 3, DIRS[dir] * 3 + 2, DIRS[dir] * 3];
    const stepPhase = (run.steps % 2) * 2;
    this.player.setFrame(String(frames[stepPhase]));
    this.tweens.add({
      targets: this.player,
      x: nx * TILE + TILE / 2,
      y: ny * TILE + TILE - 1,
      duration,
      onComplete: () => {
        run.pos.x = nx;
        run.pos.y = ny;
        this.player.setDepth(ny * 10 + 5);
        this.player.setFrame(String(frames[stepPhase + 1]));
        this.moving = false;
        this.onStepComplete(nx, ny, warp !== undefined);
      },
    });
  }

  private onStepComplete(tx: number, ty: number, isWarp: boolean): void {
    const run = G.run;
    // 昼夜
    if (this.map.advanceTime) {
      const changed = advanceSteps(run, 1);
      if (changed !== null) {
        this.applyTimeTint();
        this.timeLabel.setText(TIME_LABELS[run.timeIndex]);
        this.refreshNpcVisibility();
      }
    }
    // ワープ
    if (isWarp) {
      const warp = this.map.warps.find((w) => w.x === tx && w.y === ty)!;
      this.transitionTo(warp.to, warp.tx, warp.ty, warp.dir ?? run.pos.dir);
      return;
    }
    // 侵入イベント
    for (const ev of this.map.events) {
      if (ev.trigger !== 'enter') continue;
      const w = ev.w ?? 1;
      const h = ev.h ?? 1;
      if (
        ev.x !== undefined &&
        ev.y !== undefined &&
        tx >= ev.x &&
        tx < ev.x + w &&
        ty >= ev.y &&
        ty < ev.y + h
      ) {
        if (ev.mainStep !== undefined && (run.flags.mainStep ?? 0) !== ev.mainStep) continue;
        if (ev.once && run.flags[`done_${ev.id}`]) continue;
        void this.runEvent(ev.id, ev.once ?? false);
        return;
      }
    }
    // エンカウント
    this.stepsSinceBattle++;
    const zone = this.encounterZone[ty]?.[tx];
    if (zone && this.stepsSinceBattle >= 5) {
      const zoneDef = G.data.encounters.get(zone);
      if (zoneDef && G.rng.chance(zoneDef.rate)) {
        const groups = zoneDef.groups.filter(
          (g) => !g.times || g.times.includes(run.timeIndex)
        );
        if (groups.length > 0) {
          const group = G.rng.weighted(groups.map((g) => ({ value: g, weight: g.weight })));
          this.stepsSinceBattle = 0;
          void this.startBattle(group.monsters, {});
        }
      }
    }
  }

  private applyTimeTint(): void {
    const t = TIME_TINTS[G.run.timeIndex];
    this.tint.setFillStyle(t.color, t.alpha);
  }

  private transitionTo(mapId: string, tx: number, ty: number, dir: 'up' | 'down' | 'left' | 'right'): void {
    this.busy = true;
    const run = G.run;
    this.cameras.main.fadeOut(220);
    this.time.delayedCall(240, () => {
      run.mapId = mapId;
      run.pos = { x: tx, y: ty, dir };
      G.autosave();
      this.scene.restart();
    });
  }

  // ---- インタラクト ----

  private interact(): void {
    const run = G.run;
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[run.pos.dir];
    const tx = run.pos.x + delta[0];
    const ty = run.pos.y + delta[1];
    const npc = this.map.npcs.find((n) => n.x === tx && n.y === ty && this.npcVisible(n));
    if (npc) {
      void this.talkToNpc(npc);
      return;
    }
    const chest = this.map.chests.find((c) => c.x === tx && c.y === ty);
    if (chest && !(run.chests[chest.id] ?? false)) {
      void this.openChest(chest.id);
      return;
    }
  }

  private async openChest(chestId: string): Promise<void> {
    const chest = this.map.chests.find((c) => c.id === chestId)!;
    this.busy = true;
    G.run.chests[chestId] = true;
    this.chestSprites.get(chestId)?.setTexture('tile_chest_open');
    sound.sfx('chest');
    let text = '';
    if (chest.gold) {
      G.run.inventory.gold += chest.gold;
      text = `${chest.gold}${G.config.currency}を手に入れた！`;
    } else if (chest.itemId) {
      addItem(G.run.inventory, chest.itemId);
      text = `${G.data.items.get(chest.itemId)?.name}を手に入れた！`;
    } else if (chest.equipId) {
      addEquip(G.run.inventory, chest.equipId);
      text = `${G.data.equipment.get(chest.equipId)?.name}を手に入れた！`;
    }
    await this.dlg.page(text);
    this.dlg.hide();
    this.busy = false;
  }

  private matchDialogueEntry(def: DialogueDefinition): { lines: string[]; choices?: DialogueDefinition['entries'][0]['choices'] } {
    const run = G.run;
    for (const entry of def.entries) {
      if (entry.if?.flagGte && (run.flags[entry.if.flagGte[0]] ?? 0) < entry.if.flagGte[1]) continue;
      if (entry.if?.flagLt && (run.flags[entry.if.flagLt[0]] ?? 0) >= entry.if.flagLt[1]) continue;
      if (entry.if?.times && !entry.if.times.includes(run.timeIndex)) continue;
      return entry;
    }
    return { lines: ['……'] };
  }

  private async talkToNpc(npc: MapNpcDef): Promise<void> {
    this.busy = true;
    // NPCがプレイヤーの方を向く
    const spr = this.npcSprites.get(npc.id);
    if (spr) {
      const dx = G.run.pos.x - npc.x;
      const dy = G.run.pos.y - npc.y;
      let d: keyof typeof DIRS = 'down';
      if (dx < 0) d = 'left';
      else if (dx > 0) d = 'right';
      else if (dy < 0) d = 'up';
      spr.setFrame(String(DIRS[d] * 3));
    }
    const def = G.data.dialogues.get(npc.dialogueId);
    if (def) {
      const entry = this.matchDialogueEntry(def);
      await this.playDialogueEntry(def, entry);
    }
    // 店・宿・神殿サービス
    const isNight = G.run.timeIndex === 3;
    if (npc.shop === 'item' && !isNight) {
      await this.openShop('item');
    } else if (npc.shop === 'equip' && !isNight) {
      await this.openShop('equip');
    } else if (npc.shop === 'inn') {
      await this.innService();
    } else if (npc.shop === 'temple') {
      await this.templeService();
    }
    this.dlg.hide();
    this.busy = false;
  }

  private async playDialogueEntry(
    def: DialogueDefinition,
    entry: { lines: string[]; choices?: DialogueDefinition['entries'][0]['choices'] }
  ): Promise<void> {
    await this.dlg.lines(entry.lines, def.speaker);
    if (entry.choices) {
      const idx = await this.dlg.choices(entry.choices.map((c) => c.text));
      const choice = entry.choices[idx];
      if (choice.personality) {
        const hero = G.run.party[0];
        for (const [k, v] of Object.entries(choice.personality)) {
          hero.personality[k as keyof typeof hero.personality] += v;
        }
      }
      if (choice.setFlag) {
        G.run.flags[choice.setFlag[0]] = choice.setFlag[1];
      }
    }
  }

  private async playDialogue(dialogueId: string): Promise<void> {
    const def = G.data.dialogues.get(dialogueId);
    if (!def) return;
    for (const entry of def.entries) {
      if (entry.if?.flagGte && (G.run.flags[entry.if.flagGte[0]] ?? 0) < entry.if.flagGte[1]) continue;
      if (entry.if?.times && !entry.if.times.includes(G.run.timeIndex)) continue;
      await this.playDialogueEntry(def, entry);
    }
  }

  private openShop(kind: 'item' | 'equip'): Promise<void> {
    return new Promise((resolve) => {
      this.scene.launch('Shop', { kind, onClose: () => resolve() });
      this.scene.pause();
    });
  }

  private async innService(): Promise<void> {
    const cost = 20;
    const idx = await this.dlg.choices([`とまる（${cost}${G.config.currency}）`, 'やめておく']);
    if (idx !== 0) return;
    if (G.run.inventory.gold < cost) {
      await this.dlg.page('お金が足りないみたいだね。');
      return;
    }
    G.run.inventory.gold -= cost;
    this.cameras.main.fadeOut(400);
    await new Promise((r) => this.time.delayedCall(500, r));
    restToMorning(G.run);
    for (const m of G.run.party) {
      const ds = derivedStats(m, G.data);
      m.hp = ds.maxHp;
      m.mp = ds.maxMp;
    }
    G.autosave();
    this.applyTimeTint();
    this.timeLabel.setText(TIME_LABELS[G.run.timeIndex]);
    this.refreshNpcVisibility();
    sound.sfx('heal');
    this.cameras.main.fadeIn(400);
    await this.dlg.page('ぐっすり眠って、すっかり元気になった！');
  }

  private async templeService(): Promise<void> {
    const idx = await this.dlg.choices(['職の導きを受ける（転職）', '祈って傷を癒す', 'やめる']);
    if (idx === 0) {
      await new Promise<void>((resolve) => {
        this.scene.launch('JobChange', { onClose: () => resolve() });
        this.scene.pause();
      });
    } else if (idx === 1) {
      for (const m of G.run.party) {
        const ds = derivedStats(m, G.data);
        m.hp = ds.maxHp;
        m.mp = ds.maxMp;
      }
      sound.sfx('heal');
      await this.dlg.page('星環の光がパーティーを包んだ。心も体も澄みわたる。');
    }
  }

  // ---- 戦闘 ----

  private startBattle(
    monsterIds: string[],
    opts: { boss?: boolean; bgKey?: string }
  ): Promise<'victory' | 'defeat' | 'escape'> {
    this.busy = true;
    sound.sfx('battlestart');
    flashScreen(this, 0xffffff, 150);
    return new Promise((resolve) => {
      this.time.delayedCall(220, () => {
        const bgKey =
          opts.bgKey ??
          (G.run.timeIndex === 3
            ? 'bg_night'
            : this.map.kind === 'dungeon'
              ? 'bg_forest'
              : 'bg_plains');
        this.scene.launch('Battle', {
          monsterIds,
          boss: opts.boss ?? false,
          bgKey,
          onEnd: (result: 'victory' | 'defeat' | 'escape') => {
            this.busy = false;
            sound.playBgm(this.map.bgm);
            resolve(result);
          },
        });
        this.scene.pause();
      });
    });
  }

  // ---- イベント ----

  private async checkAutoEvents(): Promise<void> {
    for (const ev of this.map.events) {
      if (ev.trigger !== 'auto') continue;
      if (ev.mainStep !== undefined && (G.run.flags.mainStep ?? 0) !== ev.mainStep) continue;
      if (ev.once && G.run.flags[`done_${ev.id}`]) continue;
      await this.runEvent(ev.id, ev.once ?? false);
    }
  }

  private async runEvent(id: string, once: boolean): Promise<void> {
    if (this.busy && id !== 'ev_opening' && id !== 'ev_homecoming') return;
    this.busy = true;
    if (once) G.run.flags[`done_${id}`] = 1;
    switch (id) {
      case 'ev_opening':
        await this.evOpening();
        break;
      case 'ev_forest_intro':
        await this.playDialogue('ev_forest_intro');
        break;
      case 'ev_boss':
        await this.evBoss();
        break;
      case 'ev_homecoming':
        await this.evHomecoming();
        break;
    }
    this.dlg.hide();
    this.busy = false;
  }

  private async evOpening(): Promise<void> {
    const run = G.run;
    await this.playDialogue('ev_op_ceremony');
    await this.playDialogue('ev_op_mirea');
    flashScreen(this, 0xff4444, 220);
    sound.sfx('buzzer');
    await this.playDialogue('ev_op_raid');
    await this.playDialogue('ev_op_awaken');
    // 環導器を入手して装備
    addEquip(run.inventory, 'kandoki');
    equipFromInventory(run.party[0], 'weapon', 'kandoki', run.inventory, G.data);
    sound.sfx('levelup');
    // ミレアとガルドが加入
    joinMember(run, 'mirea', G.data);
    joinMember(run, 'gald', G.data);
    await this.playDialogue('ev_op_join');
    const result = await this.startBattle(['gearhound', 'gearhound'], { bgKey: 'bg_plains' });
    if (result !== 'victory') return; // 敗北時はゲームオーバー処理側に任せる
    await this.playDialogue('ev_op_depart');
    run.flags.mainStep = 2;
    G.autosave();
  }

  private async evBoss(): Promise<void> {
    await this.playDialogue('ev_boss_pre');
    const result = await this.startBattle(['balgrow_root', 'balgrow', 'balgrow_root'], {
      boss: true,
      bgKey: 'bg_boss',
    });
    if (result !== 'victory') return;
    G.run.flags.mainStep = 3;
    sound.sfx('levelup');
    await this.playDialogue('ev_boss_post');
    G.autosave();
  }

  private async evHomecoming(): Promise<void> {
    await this.playDialogue('ev_elder_final');
    G.run.flags.mainStep = 4;
    G.autosave();
    sound.stopBgm();
    this.cameras.main.fadeOut(600);
    await new Promise((r) => this.time.delayedCall(700, r));
    this.scene.start('Ending');
  }

  // ---- 更新 ----

  override update(time: number, delta: number): void {
    controls.pollGamepad();
    this.dlg?.update(time, delta);
    // プレイ時間
    this.playClock += delta;
    if (this.playClock >= 1000) {
      this.playClock -= 1000;
      if (G.state) G.state.playSeconds += 1;
    }
    if (this.busy || this.moving) return;

    if (controls.justPressed('menu')) {
      sound.sfx('confirm');
      this.scene.launch('Menu', {
        onClose: () => {
          controls.clearPressed();
        },
      });
      this.scene.pause();
      return;
    }
    if (controls.justPressed('confirm')) {
      this.interact();
      return;
    }
    if (controls.isDown('up')) this.tryMove('up');
    else if (controls.isDown('down')) this.tryMove('down');
    else if (controls.isDown('left')) this.tryMove('left');
    else if (controls.isDown('right')) this.tryMove('right');
  }
}

'use strict';
/* =====================================================================
 * battle.js — DQ-style front-view command battle
 * ===================================================================== */

const BATTLE_BASE_Y = 150;        // monsters stand on this line
const RES_MUL = [1, 0.66, 0.33, 0];
const STATUS_CHANCE = [0.78, 0.5, 0.22, 0];

/* ---------- backdrop ---------- */
const BattleBg = (() => {
  const cache = new Map();
  const H = 90;
  function grad(g, y0, y1, c0, c1) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, y0, SW, y1 - y0); }
  function hills(g, y, amp, col, seed, step = 32) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= SW; x += 4) g.lineTo(x, y - Math.abs(Math.sin(x / step + seed)) * amp - Math.sin(x / (step * 0.37) + seed * 2) * amp * 0.25);
    g.lineTo(SW, H); g.closePath(); g.fill();
  }
  function trees(g, y, col, n, seed, size) {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const x = (hash2(i, seed, 3) * (SW + 30)) - 15, s = size * (0.7 + hash2(i, seed, 9) * 0.6);
      g.beginPath(); g.moveTo(x, y - s * 2.2); g.lineTo(x + s, y); g.lineTo(x - s, y); g.closePath(); g.fill();
    }
  }
  function draw(kind, night) {
    const c = makeCanvas(SW, H), g = c.getContext('2d');
    const skyTop = night ? '#060a26' : '#4c8ee8', skyBot = night ? '#1c2a5c' : '#bfe4ff';
    switch (kind) {
      case 'forest':
        grad(g, 0, 50, night ? '#040818' : '#5c9ad8', night ? '#10203a' : '#cfe8d0');
        trees(g, 58, night ? '#0c2a18' : '#3a7a48', 24, 1, 10);
        trees(g, 70, night ? '#08200f' : '#28623a', 20, 2, 12);
        grad(g, 66, H, night ? '#0c2a14' : '#3c8a34', night ? '#061808' : '#2a6a24');
        trees(g, 92, night ? '#041006' : '#1c4a22', 10, 5, 16);
        break;
      case 'hills':
        grad(g, 0, 56, skyTop, skyBot);
        hills(g, 46, 16, night ? '#1a2a4a' : '#7aa0c8', 1, 40);
        hills(g, 62, 14, night ? '#12321c' : '#68b048', 3, 26);
        grad(g, 70, H, night ? '#0e2a12' : '#58a83c', night ? '#081a0a' : '#3c8a2c');
        break;
      case 'desert':
        grad(g, 0, 56, night ? '#100a26' : '#f0a860', night ? '#2a1c3a' : '#f8e0a0');
        hills(g, 58, 10, night ? '#3a2c2a' : '#e0b870', 2, 50);
        grad(g, 62, H, night ? '#40301c' : '#e8c880', night ? '#281c10' : '#c8a060');
        break;
      case 'swamp':
        grad(g, 0, 56, night ? '#0a0618' : '#6a5a90', night ? '#201830' : '#b8a8d0');
        trees(g, 60, night ? '#100c1c' : '#403458', 14, 7, 9);
        grad(g, 60, H, night ? '#1c1428' : '#5a4a78', night ? '#0c0814' : '#3a2c50');
        break;
      case 'cave': {
        grad(g, 0, H, '#1a120c', '#3a2a1c');
        g.fillStyle = '#2a1e14';
        for (let i = 0; i < 9; i++) { const x = i * 32 + hash2(i, 1, 1) * 16; g.fillRect(x, 0, 10 + hash2(i, 2, 1) * 10, 70); }
        g.fillStyle = '#4a3624'; g.fillRect(0, 70, SW, H - 70);
        g.fillStyle = '#5a4430'; for (let i = 0; i < 30; i++) g.fillRect(hash2(i, 3, 1) * SW, 72 + hash2(i, 4, 1) * 16, 3, 1);
        break;
      }
      case 'tower': {
        grad(g, 0, H, '#2c2c40', '#4a4a64');
        g.fillStyle = '#3a3a52';
        for (let y = 0; y < 66; y += 8) for (let x = (y / 8) % 2 ? 0 : 12; x < SW; x += 24) g.fillRect(x, y, 22, 7);
        g.fillStyle = '#20203a'; g.fillRect(108, 10, 40, 40);
        grad(g, 12, 48, night ? '#060a26' : '#78b8f8', night ? '#182a5c' : '#d0ecff'); g.globalCompositeOperation = 'destination-over';
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = night ? '#0a1438' : '#8cc8f8'; g.fillRect(112, 14, 32, 32);
        g.fillStyle = '#20203a'; g.fillRect(127, 14, 2, 32); g.fillRect(112, 29, 32, 2);
        g.fillStyle = '#5a5a78'; g.fillRect(0, 68, SW, H - 68);
        g.fillStyle = '#48486a'; for (let x = 0; x < SW; x += 20) g.fillRect(x, 68, 1, H - 68);
        break;
      }
      case 'indoor':
        grad(g, 0, H, '#101018', '#2a2a38');
        break;
      default: // plains
        grad(g, 0, 56, skyTop, skyBot);
        g.fillStyle = night ? '#e8e8ff' : '#ffffff';
        if (!night) { for (const [x, y, w] of [[30, 14, 30], [150, 8, 40], [210, 22, 26]]) { g.globalAlpha = 0.8; g.fillRect(x, y, w, 4); g.fillRect(x + 6, y - 3, w - 14, 3); g.globalAlpha = 1; } }
        hills(g, 52, 10, night ? '#1a2a4a' : '#88aad0', 4, 60);
        grad(g, 58, H, night ? '#10301a' : '#6cc050', night ? '#08200c' : '#3c8a30');
        g.fillStyle = night ? '#0c2410' : '#58a840';
        for (let i = 0; i < 40; i++) g.fillRect(hash2(i, 8, 2) * SW, 62 + hash2(i, 9, 2) * 26, 3, 1);
    }
    if (night && kind !== 'cave' && kind !== 'tower' && kind !== 'indoor') {
      for (let i = 0; i < 40; i++) { g.fillStyle = hash2(i, 1, 7) < 0.5 ? '#ffffff' : '#8898d0'; g.fillRect(hash2(i, 2, 7) * SW, hash2(i, 3, 7) * 40, 1, 1); }
    }
    return c;
  }
  return { get(kind, night) { const k = kind + (night ? 'n' : 'd'); if (!cache.has(k)) cache.set(k, draw(kind, night)); return cache.get(k); }, H };
})();

/* ---------- battle log ---------- */
class BattleLog {
  constructor() { this.lines = []; this.chars = 0; this.visible = false; this.tick = 0; this.waitKey = false; }
  clear() { this.lines = []; this.chars = 0; }
  get total() { return this.lines.reduce((a, l) => a + [...l].length, 0); }
  render() {
    if (!this.visible) return;
    this.tick++;
    drawWindow(8, 158, 240, 76);
    let left = Math.floor(this.chars);
    this.lines.forEach((l, i) => {
      const ch = [...l];
      drawText(ch.slice(0, Math.max(0, left)).join(''), 21, 168 + i * 15);
      left -= ch.length;
    });
    if (this.waitKey && (this.tick >> 4) % 2 === 0) drawDownArrow(SW / 2 - 3, 226);
  }
}

class BattleScene {
  constructor(groups, opts, res) {
    this.opaque = true;
    this.opts = opts; this.res = res;
    this.night = !!(opts.night);
    this.bg = BattleBg.get(opts.bg || 'plains', this.night);
    this.enemies = [];
    const byKind = {};
    for (const g of groups) for (let i = 0; i < g.n; i++) this.enemies.push(this.makeEnemy(g.id));
    for (const e of this.enemies) (byKind[e.id] = byKind[e.id] || []).push(e);
    for (const k in byKind) if (byKind[k].length > 1) byKind[k].forEach((e, i) => { e.label = e.name + 'ABCDEFGH'[i]; });
    this.layout();
    this.log = new BattleLog();
    this.inputIdx = -1;
    this.over = false; this.result = null;
    this.turn = 0;
    this.lastCmd = {};
    this.shakeMember = -1; this.shakeT = 0;
    for (const m of Game.party) { m.tmp = { defBonus: 0, guard: false, mirage: 0, sleep: false, stun: false }; }
    this.defeated = [];
  }
  makeEnemy(id) {
    const d = MONSTERS[id] || MONSTERS.jelly_blue;
    const hp = d.boss ? d.hp : Math.max(1, Math.round(d.hp * (0.88 + Math.random() * 0.24)));
    return { id, d, name: d.name, label: d.name, hp, mhp: hp, atk: d.atk, def: d.def, agi: d.agi, alive: true, fled: false, status: {}, defMul: 1, guard: false, img: MonsterArt.get(id), flash: 0, fade: 0, x: 0, y: 0, act: 0, heals: 0 };
  }
  layout() {
    const es = this.enemies;
    const gap = 6;
    let total = es.reduce((a, e) => a + e.img.width, 0) + gap * (es.length - 1);
    let g = gap;
    if (total > 248) { g = gap - Math.ceil((total - 248) / Math.max(1, es.length - 1)); total = 248; }
    let x = Math.round((SW - total) / 2);
    for (const e of es) { e.x = x; e.y = BATTLE_BASE_Y - e.img.height; x += e.img.width + g; }
  }
  alive() { return this.enemies.filter(e => e.alive); }
  groups() {
    const out = [];
    for (const e of this.enemies) {
      if (!e.alive) continue;
      let g = out.find(o => o.id === e.id);
      if (!g) { g = { id: e.id, name: e.name, list: [] }; out.push(g); }
      g.list.push(e);
    }
    return out;
  }

  /* ---------- main flow ---------- */
  async run() {
    Game.battleActive = true;
    Sound.playBGM(this.opts.bgm || (this.opts.boss ? 'boss' : 'battle'));
    await fadeIn(12);
    this.log.visible = true;
    const gs = this.groups();
    if (gs.length === 1) await this.say(gs[0].list.length > 1 ? gs[0].name + 'が ' + gs[0].list.length + 'ひき あらわれた！' : gs[0].name + 'が あらわれた！', 30);
    else await this.say('まものの むれが あらわれた！', 30);
    let first = null;
    if (!this.opts.boss) {
      if (chance(1 / 14)) { first = 'party'; await this.say('しかし まものたちは まだ こちらに きづいていない！', 30); }
      else if (chance(1 / 18)) { first = 'enemy'; await this.say('まものたちは いきなり おそいかかってきた！', 30); }
    }
    while (!this.over) {
      this.turn++;
      let acts = new Map(), run = false;
      if (first !== 'enemy') {
        this.log.visible = false;
        const r = await this.commandPhase();
        this.log.visible = true;
        this.log.clear();
        if (r.run) run = true; else acts = r.acts;
      }
      if (run) {
        const ok = await this.tryRun();
        if (ok) break;
        await this.executeTurn(new Map(), false);
      } else await this.executeTurn(acts, first === 'party');
      first = null;
      if (!this.over) await this.endOfTurn();
    }
    await this.finish();
  }
  async finish() {
    Game.battleActive = false;
    for (const m of Game.party) { delete m.tmp; }
    await fadeOut(16);
    Scenes.remove(this);
    if (Field) { Field.updateBgm(true); Field.resetTrail(); }
    await fadeIn(14);
    this.res(this.result || 'escape');
  }

  /* ---------- messages ---------- */
  async say(text, hold = 22, key = false) {
    const lines = wrapText(fmtText(text), 214, 12);
    for (const l of lines) {
      if (this.log.lines.length >= 4) { this.log.lines.shift(); this.log.chars = this.log.total; }
      this.log.lines.push(l);
      const target = this.log.total;
      while (this.log.chars < target) {
        this.log.chars += Input.held('a') ? 4 : (MSG_SPEEDS[Game.settings.msgSpeed] || 0.9) * 1.6;
        await wait(1);
      }
      this.log.chars = target;
    }
    if (key) {
      this.log.waitKey = true;
      await waitKey();
      this.log.waitKey = false;
    } else {
      for (let i = 0; i < hold; i++) { if (Input.held('a') && i > 4) break; await wait(1); }
    }
  }

  /* ---------- command input ---------- */
  canAct(m) { return m.hp > 0 && !(m.tmp && (m.tmp.sleep || m.tmp.stun)); }
  async commandPhase() {
    const actors = Game.party.filter(m => this.canAct(m));
    const acts = new Map();
    let i = 0;
    while (i < actors.length) {
      const m = actors[i];
      this.inputIdx = Game.party.indexOf(m);
      const a = await this.chooseAction(m, i > 0);
      if (a === 'back') { if (i > 0) { i--; acts.delete(actors[i]); } continue; }
      if (a.type === 'run') { this.inputIdx = -1; return { run: true }; }
      acts.set(m, a); i++;
    }
    this.inputIdx = -1;
    return { acts };
  }
  async chooseAction(m, canBack) {
    const spells = Game.spellsOf(m).filter(id => SPELLS[id].battle !== false);
    const cmds = [
      { label: 'たたかう' }, { label: 'じゅもん', disabled: !spells.length }, { label: 'ぼうぎょ' }, { label: 'どうぐ' }, { label: 'にげる', disabled: !!this.opts.boss },
    ];
    const menu = new Menu({ items: cmds, cols: 2, x: 8, y: 158, w: 124, h: 76, title: m.name, index: this.lastCmd[m.uid] || 0, cancel: canBack });
    const groupsInfo = pushInfo(() => this.drawGroupList(false));
    try {
      for (;;) {
        const r = await menu.choose();
        if (r < 0) return 'back';
        this.lastCmd[m.uid] = r;
        if (r === 0) {
          const g = await this.chooseGroup();
          if (g == null) continue;
          return { type: 'attack', group: g };
        }
        if (r === 1) {
          const a = await this.chooseSpell(m, spells);
          if (a) return a;
          continue;
        }
        if (r === 2) return { type: 'guard' };
        if (r === 3) {
          const a = await this.chooseItem(m);
          if (a) return a;
          continue;
        }
        if (r === 4) return { type: 'run' };
      }
    } finally { menu.close(); Scenes.remove(groupsInfo); }
  }
  drawGroupList(hide) {
    if (hide) return;
    const gs = this.groups();
    drawWindow(134, 158, 114, 76);
    gs.slice(0, 4).forEach((g, i) => {
      drawText(g.name, 146, 167 + i * 15, COL.white);
      drawText(String(g.list.length), 240, 167 + i * 15, COL.white, 12, 'right');
    });
  }
  async chooseGroup() {
    const gs = this.groups();
    const items = gs.map(g => ({ label: g.name, right: g.list.length + 'ひき' }));
    const menu = new Menu({ items, x: 134, y: 158, w: 114, h: 76, rows: 4, onChange: i => { this.hilite = gs[i] ? gs[i].id : null; } });
    const r = await menu.choose();
    menu.close();
    this.hilite = null;
    return r < 0 ? null : gs[r].id;
  }
  async chooseSpell(m, spells) {
    let help = '';
    const hs = pushInfo(() => { if (help) drawHelp(help, 118); });
    const items = spells.map(id => ({ label: SPELLS[id].name, right: String(SPELLS[id].mp), disabled: m.mp < SPELLS[id].mp }));
    const menu = new Menu({ items, cols: 1, x: 134, y: 158 - Math.max(0, Math.min(6, items.length) * 15 + 16 - 76), w: 114, rows: Math.min(6, items.length), onChange: i => { help = SPELLS[spells[i]].desc; } });
    try {
      for (;;) {
        const r = await menu.choose();
        if (r < 0) return null;
        const id = spells[r], sp = SPELLS[id];
        if (sp.target === 'enemy' || sp.target === 'group') {
          menu.hidden = true; Scenes.remove(hs);
          const g = await this.chooseGroup();
          menu.hidden = false; Scenes.push(hs);
          if (g == null) continue;
          return { type: 'spell', spell: id, group: g };
        }
        if (sp.target === 'all') return { type: 'spell', spell: id };
        if (sp.target === 'ally') {
          const t = await chooseMember({ title: 'だれに？', x: 60, y: 70, filter: mm => mm.hp > 0 });
          if (!t) continue;
          return { type: 'spell', spell: id, target: t };
        }
        return { type: 'spell', spell: id };
      }
    } finally { menu.close(); Scenes.remove(hs); }
  }
  async chooseItem(m) {
    const list = Game.bagList(it => it.kind === 'use' && it.battle);
    const wep = m.eq.weapon && ITEMS[m.eq.weapon].cast ? m.eq.weapon : null;
    const ids = wep ? [wep].concat(list) : list;
    if (!ids.length) { await this.flash('どうぐを もっていない！'); return null; }
    let help = '';
    const hs = pushInfo(() => { if (help) drawHelp(help, 118); });
    const items = ids.map(id => ({ label: ITEMS[id].name, right: id === wep ? 'E' : '×' + Game.count(id) }));
    const menu = new Menu({ items, x: 96, y: 158 - Math.max(0, Math.min(5, items.length) * 15 + 16 - 76), w: 152, rows: Math.min(5, items.length), onChange: i => { help = itemHelp(ids[i]); } });
    try {
      for (;;) {
        const r = await menu.choose();
        if (r < 0) return null;
        const id = ids[r], it = ITEMS[id];
        if (id === wep) {
          const g = await this.chooseGroup(); if (g == null) continue;
          return { type: 'item', item: id, group: g, weapon: true };
        }
        if (it.target === 'ally') {
          const t = await chooseMember({ title: 'だれに？', x: 60, y: 70, filter: mm => mm.hp > 0 });
          if (!t) continue;
          return { type: 'item', item: id, target: t };
        }
        if (it.target === 'group' || it.target === 'enemy') {
          const g = await this.chooseGroup(); if (g == null) continue;
          return { type: 'item', item: id, group: g };
        }
        return { type: 'item', item: id };
      }
    } finally { menu.close(); Scenes.remove(hs); }
  }
  async flash(text) {
    this.log.visible = true; this.log.clear();
    await this.say(text, 30);
    this.log.visible = false;
  }

  /* ---------- turn execution ---------- */
  async executeTurn(acts, partyOnly) {
    const order = [];
    for (const [m, a] of acts) order.push({ who: m, party: true, act: a, spd: m.agi * (0.55 + Math.random() * 0.45) + (a.type === 'guard' ? 999 : 0) });
    for (const m of Game.party) if (m.hp > 0 && m.tmp && (m.tmp.sleep || m.tmp.stun) && !acts.has(m)) order.push({ who: m, party: true, act: { type: m.tmp.sleep ? 'asleep' : 'stunned' }, spd: m.agi * 0.5 });
    if (!partyOnly) for (const e of this.alive()) { const n = e.d.actsPerTurn || 1; for (let k = 0; k < n; k++) order.push({ who: e, party: false, spd: e.agi * (0.55 + Math.random() * 0.45) - k * 30 }); }
    order.sort((a, b) => b.spd - a.spd);
    for (const [m, a] of acts) if (a.type === 'guard') m.tmp.guard = true;
    for (const o of order) {
      if (this.over) break;
      this.log.clear();
      if (o.party) { if (o.who.hp <= 0) continue; await this.partyAct(o.who, o.act); }
      else { if (!o.who.alive) continue; await this.enemyAct(o.who); }
      await this.checkEnd();
    }
  }
  async endOfTurn() {
    for (const m of Game.party) {
      if (!m.tmp) continue;
      m.tmp.guard = false;
      if (m.tmp.stun) m.tmp.stun = false;
      if (m.tmp.mirage > 0) m.tmp.mirage--;
      if (m.hp > 0 && m.tmp.sleep && chance(0.4)) { m.tmp.sleep = false; this.log.clear(); await this.say(m.name + 'は めを さました！', 20); }
    }
    for (const e of this.alive()) {
      e.guard = false;
      if (e.status.mirage > 0) e.status.mirage--;
      if (e.status.sleep && chance(0.35)) { e.status.sleep = false; this.log.clear(); await this.say(e.label + 'は めを さました！', 20); }
    }
  }
  async checkEnd() {
    if (this.over) return true;
    if (!this.alive().length) {
      this.over = true;
      if (!this.defeated.length) { this.result = 'escape'; this.log.clear(); await this.say('まものたちは みんな にげていった。', 30); return true; }
      this.result = 'win';
      await this.victory();
      return true;
    }
    if (Game.partyWiped()) {
      this.over = true; this.result = 'lose';
      Sound.stopBGM(100);
      this.log.clear();
      await this.say('{hero}たちは ぜんめつしてしまった……。', 60, true);
      return true;
    }
    return false;
  }

  /* ---------- party actions ---------- */
  pickTarget(groupId) {
    const g = this.alive().filter(e => e.id === groupId);
    if (g.length) return g[0];
    const a = this.alive();
    return a.length ? a[0] : null;
  }
  async partyAct(m, a) {
    if (a.type === 'asleep') { await this.say(m.name + 'は ねむっている。', 18); return; }
    if (a.type === 'stunned') { await this.say(m.name + 'は おびえて うごけない！', 18); return; }
    if (m.job === 'jester' && a.type !== 'guard' && chance(0.3)) { await this.jesterPlay(m); return; }
    if (a.type === 'guard') { await this.say(m.name + 'は みを まもっている。', 16); return; }
    if (a.type === 'attack') {
      const t = this.pickTarget(a.group);
      if (!t) return;
      await this.say(m.name + 'の こうげき！', 6);
      await this.physicalHit(m, t);
      return;
    }
    if (a.type === 'spell') { await this.castSpell(m, a); return; }
    if (a.type === 'item') { await this.useItem(m, a); return; }
  }
  async physicalHit(m, t) {
    const job = JOBS[m.job];
    const critP = (job.crit || 1 / 40) + m.luck / 2500;
    let missP = 1 / 36 + (m.tmp.mirage > 0 ? 0.55 : 0);
    if (t.status.sleep) missP = 0;
    if (chance(missP)) { Sound.sfx('miss'); await this.say('ミス！ ' + t.label + 'は ひらりと みを かわした！', 18); return; }
    let dmg, crit = chance(critP);
    if (crit) {
      dmg = Math.floor(Game.atk(m) * (0.95 + Math.random() * 0.1));
      Sound.sfx('crit'); FX.doFlash(6, '#fff');
      await this.say('かいしんの いちげき！', 8);
    } else dmg = physDamage(Game.atk(m), this.enemyDef(t));
    if (t.guard) dmg = Math.floor(dmg / 2);
    await this.damageEnemy(t, dmg, crit ? 'crit' : 'hit');
    if (t.alive && t.status.sleep && chance(0.35)) { t.status.sleep = false; await this.say(t.label + 'は めを さました！', 14); }
  }
  enemyDef(e) { return Math.floor(e.def * e.defMul); }
  async damageEnemy(t, dmg, sfx = 'hit') {
    if (dmg <= 0) { Sound.sfx('miss'); await this.say('ミス！ ' + t.label + 'に ダメージを あたえられない！', 18); return; }
    Sound.sfx(sfx); t.flash = 14;
    t.hp -= dmg;
    await this.say(t.label + 'に ' + dmg + 'ポイントの ダメージを あたえた！', 16);
    if (t.hp <= 0) await this.killEnemy(t);
  }
  async killEnemy(t, msg) {
    t.hp = 0; t.alive = false; t.fade = 20;
    this.defeated.push(t);
    Sound.sfx('enemyDie');
    await this.say(msg || (t.label + 'を たおした！'), 18);
  }
  async castSpell(m, a) {
    const sp = SPELLS[a.spell];
    await this.say(m.name + 'は ' + sp.name + 'を となえた！', 8);
    if (m.mp < sp.mp) { await this.say('しかし MPが たりない！', 18); return; }
    m.mp -= sp.mp;
    await this.spellEffect(sp, a, m.name);
  }
  async spellEffect(sp, a, casterName) {
    Sound.sfx(sp.sfx || 'spell');
    const fc = { fire: '#ff8030', ice: '#80e0ff', wind: '#a0f0a0', sleep: '#c0a0ff', mirage: '#e0c0ff', banish: '#fffff0', debuff: '#ff80c0' }[sp.elem] || '#fff8c0';
    FX.doFlash(8, fc);
    await wait(8);
    if (sp.type === 'dmg' || sp.type === 'status' || sp.type === 'debuff' || sp.type === 'banish') {
      let targets = [];
      if (sp.target === 'enemy') { const t = this.pickTarget(a.group); if (t) targets = [t]; }
      else if (sp.target === 'group') { const g = this.alive().filter(e => e.id === a.group); targets = g.length ? g : this.alive().filter(e => e.id === (this.alive()[0] || {}).id); }
      else targets = this.alive();
      for (const t of targets) {
        if (!t.alive) continue;
        const res = (t.d.res && t.d.res[sp.elem]) || 0;
        if (sp.type === 'dmg') {
          let dmg = rndInt(sp.power[0], sp.power[1]);
          dmg = Math.floor(dmg * RES_MUL[res]);
          if (t.d.weak === sp.elem) dmg = Math.floor(dmg * 1.5);
          if (dmg <= 0) { await this.say(t.label + 'には ききめが なかった！', 14); continue; }
          await this.damageEnemy(t, dmg, 'hit');
        } else if (sp.type === 'status') {
          let p = STATUS_CHANCE[res]; if (t.d.boss) p *= 0.5;
          if (chance(p)) {
            if (sp.status === 'sleep') { t.status.sleep = true; await this.say(t.label + 'は ねむってしまった！', 14); }
            else { t.status.mirage = rndInt(3, 5); await this.say(t.label + 'は まぼろしに つつまれた！', 14); }
          } else await this.say(t.label + 'には きかなかった！', 14);
        } else if (sp.type === 'debuff') {
          const p = [0.85, 0.6, 0.3, 0][res];
          if (chance(p) && t.defMul > 0.3) { t.defMul = Math.max(0.3, t.defMul - 0.35); await this.say(t.label + 'の しゅびりょくが さがった！', 14); }
          else await this.say(t.label + 'には きかなかった！', 14);
        } else if (sp.type === 'banish') {
          if (!t.d.undead) { await this.say(t.label + 'には ききめが なかった！', 14); continue; }
          const p = [0.65, 0.45, 0.2, 0][res];
          if (chance(p)) await this.killEnemy(t, t.label + 'は ひかりの なかに きえさった！');
          else await this.say(t.label + 'には きかなかった！', 14);
        }
        if (this.over) break;
      }
      return;
    }
    if (sp.type === 'heal') {
      const t = a.target && a.target.hp > 0 ? a.target : null;
      if (!t) { await this.say('しかし ' + (a.target ? a.target.name + 'は もう たおれている！' : 'なにも おこらなかった！'), 18); return; }
      const v = rndInt(sp.power[0], sp.power[1]), b = t.hp;
      t.hp = Math.min(t.mhp, t.hp + v);
      await this.say(t.name + 'の HPが ' + (t.hp - b) + 'ポイント かいふくした！', 18);
      return;
    }
    if (sp.type === 'cure') {
      const t = a.target;
      if (t && t.hp > 0 && t.status.poison) { delete t.status.poison; await this.say(t.name + 'の どくが きえた！', 18); }
      else await this.say('しかし なにも おこらなかった！', 18);
      return;
    }
    if (sp.type === 'buff') {
      const t = a.target;
      if (!t || t.hp <= 0) { await this.say('しかし なにも おこらなかった！', 18); return; }
      if (t.tmp.defBonus >= Math.floor(Game.def(t) * 1.0)) { await this.say('しかし ' + t.name + 'の しゅびりょくは これいじょう あがらない！', 18); return; }
      const inc = Math.max(4, Math.floor(Game.def(t) * 0.5));
      t.tmp.defBonus += inc;
      await this.say(t.name + 'の しゅびりょくが ' + inc + ' あがった！', 18);
      return;
    }
    await this.say('しかし なにも おこらなかった！', 18);
  }
  async useItem(m, a) {
    const it = ITEMS[a.item];
    if (a.weapon) {
      await this.say(m.name + 'は ' + it.name + 'を ふりかざした！', 8);
      const sp = SPELLS[it.cast];
      await this.spellEffect(sp, { group: a.group }, m.name);
      return;
    }
    if (Game.count(a.item) <= 0) { await this.say(m.name + 'は ' + it.name + 'を つかおうとした。\nしかし もう のこっていない！', 18); return; }
    await this.say(m.name + 'は ' + it.name + 'を つかった！', 8);
    Game.removeItem(a.item, 1);
    if (it.spell) { await this.spellEffect(SPELLS[it.spell], { group: a.group }, m.name); return; }
    const t = a.target;
    if (!t || t.hp <= 0) { await this.say('しかし なにも おこらなかった！', 18); return; }
    const msg = applyItem(it, t);
    await this.say(msg, 18);
  }
  async jesterPlay(m) {
    const acts = [
      'は あそんでいる。', 'は おどりを おどっている！', 'は くちぶえを ふいた！', 'は ねころがって あくびを した。',
      'は まものに ウインクした！', 'は ポーズを きめている。', 'は うたを うたっている♪', 'は さかだちを している！',
    ];
    const i = rnd(acts.length);
    await this.say(m.name + acts[i], 18);
    if (i === 4 && chance(0.3)) {
      const t = pick(this.alive());
      if (t && !t.d.boss) { t.status.sleep = true; await this.say(t.label + 'は みとれて ぼうっと している！', 18); }
    }
  }

  /* ---------- enemy actions ---------- */
  pickPartyTarget() {
    const alive = Game.party.map((m, i) => ({ m, i })).filter(o => o.m.hp > 0);
    const w = [35, 27, 22, 16];
    const total = alive.reduce((a, o) => a + w[o.i], 0);
    let r = Math.random() * total;
    for (const o of alive) { r -= w[o.i]; if (r <= 0) return o.m; }
    return alive[0] ? alive[0].m : null;
  }
  chooseEnemyAct(e) {
    const d = e.d;
    if (d.boss && e.hp < e.mhp * 0.35 && e.heals < 2 && d.acts.some(a => a[0] === 'selfheal') && chance(0.45)) return 'selfheal';
    if (!d.boss && !d.rare) {
      const avg = Game.alive().reduce((a, m) => a + m.level, 0) / Math.max(1, Game.alive().length);
      const fp = clamp((avg * 1.5 - d.exp) / 40, 0, 0.22);
      if (chance(fp)) return 'flee';
    }
    const acts = d.acts.filter(a => a[1] > 0);
    const total = acts.reduce((a, x) => a + x[1], 0);
    let r = Math.random() * total;
    for (const [a, w] of acts) { r -= w; if (r <= 0) return a; }
    return 'attack';
  }
  async enemyAct(e) {
    if (e.status.sleep) { await this.say(e.label + 'は ねむっている。', 16); return; }
    const act = this.chooseEnemyAct(e);
    e.flash = 6;
    if (act === 'flee') { await this.say(e.label + 'は にげだした！', 16); e.alive = false; e.fled = true; e.fade = 14; Sound.sfx('run'); return; }
    if (act === 'guard') { e.guard = true; await this.say(e.label + MONSTER_ACT_NAMES.guard, 16); return; }
    if (act === 'selfheal') {
      e.heals++;
      Sound.sfx('heal');
      const v = Math.min(e.mhp - e.hp, 45 + rnd(20));
      e.hp += v;
      await this.say(e.label + 'は やみの ちからを すいこんだ！\n' + e.label + 'の キズが かいふくした！', 20);
      return;
    }
    if (act.startsWith('spell:')) { await this.enemySpell(e, SPELLS[act.slice(6)]); return; }
    if (act === 'breath') {
      await this.say(e.label + MONSTER_ACT_NAMES.breath, 8);
      Sound.sfx('fire'); FX.doFlash(8, '#ff8030');
      for (const m of Game.party) {
        if (m.hp <= 0) continue;
        let dmg = rndInt(Math.floor(e.atk / 3), Math.floor(e.atk / 2));
        if (m.tmp.guard) dmg = Math.floor(dmg / 2);
        await this.damageMember(m, dmg);
        if (this.over || Game.partyWiped()) break;
      }
      return;
    }
    if (act === 'roar') {
      await this.say(e.label + MONSTER_ACT_NAMES.roar, 8);
      Sound.sfx('debuff'); FX.doShake(16, 2);
      for (const m of Game.party) if (m.hp > 0 && chance(0.4 - m.luck / 400)) { m.tmp.stun = true; await this.say(m.name + 'は おびえて しまった！', 12); }
      return;
    }
    const t = this.pickPartyTarget();
    if (!t) return;
    if (act === 'sleepspore') {
      await this.say(e.label + MONSTER_ACT_NAMES.sleepspore, 8);
      Sound.sfx('sleep');
      if (chance(0.55 - t.luck / 300)) { t.tmp.sleep = true; await this.say(t.name + 'は ねむってしまった！', 16); }
      else await this.say(t.name + 'は ねむらなかった！', 16);
      return;
    }
    const heavy = act === 'heavy' || act === 'darkslash';
    const head = act === 'attack' ? e.label + 'の こうげき！' : e.label + (MONSTER_ACT_NAMES[act] || 'の こうげき！');
    await this.say(head, 6);
    let missP = 1 / 40 + t.agi / 2000 + (e.status.mirage > 0 ? 0.6 : 0);
    if (chance(missP)) { Sound.sfx('miss'); await this.say('ミス！ ' + t.name + 'は ひらりと みを かわした！', 16); return; }
    let dmg;
    const def = Game.def(t) + (t.tmp.defBonus || 0);
    if (e.d.boss && chance(1 / 40)) { await this.say('つうこんの いちげき！', 8); dmg = Math.floor(e.atk * (0.95 + Math.random() * 0.1)); FX.doFlash(6, '#f02020'); }
    else dmg = physDamage(e.atk * (heavy ? (act === 'darkslash' ? 1.5 : 1.35) : 1), def);
    if (t.tmp.guard) dmg = Math.floor(dmg / 2);
    await this.damageMember(t, dmg);
    if (t.hp > 0 && act === 'poisonbite' && dmg > 0 && chance(0.45) && !t.status.poison) { t.status.poison = true; Sound.sfx('poison'); await this.say(t.name + 'は どくに おかされた！', 14); }
    if (act === 'drain' && dmg > 0 && e.alive) { const v = Math.min(e.mhp - e.hp, Math.ceil(dmg / 2)); e.hp += v; if (v > 0) await this.say(e.label + 'は ' + v + 'ポイント かいふくした！', 12); }
    if (t.hp > 0 && t.tmp.sleep && dmg > 0 && chance(0.3)) { t.tmp.sleep = false; await this.say(t.name + 'は めを さました！', 12); }
  }
  async enemySpell(e, sp) {
    await this.say(e.label + 'は ' + sp.name + 'を となえた！', 8);
    Sound.sfx(sp.sfx || 'spell');
    FX.doFlash(8, { fire: '#ff8030', sleep: '#c0a0ff', mirage: '#e0c0ff' }[sp.elem] || '#fff');
    await wait(8);
    if (sp.type === 'dmg') {
      const targets = sp.target === 'enemy' ? [this.pickPartyTarget()] : Game.party.filter(m => m.hp > 0);
      const bossMul = e.d.boss ? 1.15 : 1;
      for (const t of targets) {
        if (!t || t.hp <= 0) continue;
        let dmg = Math.floor(rndInt(sp.power[0], sp.power[1]) * bossMul);
        if (t.tmp.guard) dmg = Math.floor(dmg * 0.75);
        await this.damageMember(t, dmg);
        if (Game.partyWiped()) break;
      }
      return;
    }
    if (sp.type === 'status') {
      for (const t of Game.party.filter(m => m.hp > 0)) {
        if (chance(0.45 - t.luck / 300)) {
          if (sp.status === 'sleep') { t.tmp.sleep = true; await this.say(t.name + 'は ねむってしまった！', 14); }
          else { t.tmp.mirage = rndInt(3, 5); await this.say(t.name + 'は まぼろしに つつまれた！', 14); }
        } else await this.say(t.name + 'には きかなかった！', 12);
      }
      return;
    }
    if (sp.type === 'heal') { const v = Math.min(e.mhp - e.hp, rndInt(sp.power[0], sp.power[1])); e.hp += v; await this.say(e.label + 'の キズが かいふくした！', 14); }
  }
  async damageMember(t, dmg) {
    const i = Game.party.indexOf(t);
    if (dmg <= 0) { Sound.sfx('miss'); await this.say('ミス！ ' + t.name + 'は ダメージを うけない！', 14); return; }
    Sound.sfx('hurt'); FX.doShake(10, 2);
    this.shakeMember = i; this.shakeT = 12;
    t.hp = Math.max(0, t.hp - dmg);
    await this.say(t.name + 'は ' + dmg + 'ポイントの ダメージを うけた！', 16);
    if (t.hp <= 0) {
      t.status = {}; t.tmp.sleep = false; t.tmp.stun = false;
      await this.say(t.name + 'は しんでしまった！', 20);
    }
  }

  /* ---------- escape / victory ---------- */
  async tryRun() {
    this.log.visible = true; this.log.clear();
    await this.say('{hero}たちは にげだした！', 8);
    const pa = Game.alive().reduce((a, m) => a + m.agi, 0) / Math.max(1, Game.alive().length);
    const ea = this.alive().reduce((a, e) => a + Math.min(e.agi, 120), 0) / Math.max(1, this.alive().length);
    const p = clamp(0.55 + (pa - ea) / 80, 0.3, 0.92);
    if (this.opts.boss || !chance(p)) { await this.say('しかし まわりこまれてしまった！', 22); return false; }
    Sound.sfx('run');
    await wait(20);
    this.over = true; this.result = 'escape';
    return true;
  }
  async victory() {
    const exp = this.defeated.reduce((a, e) => a + e.d.exp, 0);
    let gold = this.defeated.reduce((a, e) => a + e.d.gold, 0);
    Sound.stopBGM(0);
    this.log.clear();
    const jingle = Sound.playJingle('victory');
    await this.say(this.defeated.length > 1 || this.enemies.length > 1 ? 'まものたちを やっつけた！' : this.defeated[0].name + 'を やっつけた！', 10);
    const living = Game.alive();
    await this.say('それぞれ ' + exp + 'ポイントの けいけんちを かくとく！', 10);
    if (gold > 0) {
      const merch = living.find(m => m.job === 'merchant');
      if (merch && chance(0.35)) { const bonus = Math.max(1, Math.floor(gold * 0.3)); gold += bonus; await this.say(merch.name + 'は ' + bonus + 'ゴールドを ひろった！', 10); }
      Game.s.gold = Math.min(99999, Game.s.gold + gold);
      await this.say(gold + 'ゴールドを てにいれた！', 10);
    }
    await jingle;
    // drops
    for (const e of this.defeated) {
      if (e.d.drop && chance(1 / e.d.drop[1])) {
        const id = e.d.drop[0];
        Game.addItem(id, 1);
        Sound.sfx('chest');
        await this.say(e.name + 'は ' + ITEMS[id].name + 'を おとしていった！', 14);
      }
    }
    this.log.waitKey = true; await waitKey(); this.log.waitKey = false;
    // level ups
    for (const m of living) {
      const ups = Game.gainExp(m, exp);
      for (const up of ups) {
        this.log.clear();
        const j = Sound.playJingle('levelup');
        await this.say(m.name + 'の レベルが ' + up.level + 'に あがった！', 20);
        await j;
        const g = up.gains;
        const parts = [];
        for (const st of STATS) if (g[st] > 0) parts.push(STAT_NAMES[st] + 'が ' + g[st] + 'ポイント あがった！');
        if (g.mhp > 0) parts.push('さいだいHPが ' + g.mhp + 'ポイント あがった！');
        if (g.mmp > 0) parts.push('さいだいMPが ' + g.mmp + 'ポイント あがった！');
        for (const p of parts) await this.say(p, 8);
        for (const sid of up.newSpells) { Sound.sfx('spell'); await this.say(m.name + 'は ' + SPELLS[sid].name + 'の じゅもんを おぼえた！', 12); }
        this.log.waitKey = true; await waitKey(); this.log.waitKey = false;
      }
    }
  }

  /* ---------- render ---------- */
  bgUpdate() {
    for (const e of this.enemies) { if (e.flash > 0) e.flash--; if (!e.alive && e.fade > 0) e.fade--; }
    if (this.shakeT > 0) this.shakeT--;
  }
  render() {
    fillRect(0, 0, SW, SH, '#000');
    ctx.drawImage(this.bg, 0, 64);
    fillRect(0, 63, SW, 1, '#000'); fillRect(0, 64 + BattleBg.H, SW, 1, '#000');
    for (const e of this.enemies) {
      if (!e.alive && e.fade <= 0) continue;
      if (e.alive && e.flash > 0 && (e.flash >> 1) % 2 === 1) continue;
      let alpha = e.alive ? 1 : e.fade / 20;
      if (this.hilite && e.alive && e.id !== this.hilite) alpha *= 0.45;
      ctx.globalAlpha = alpha;
      let y = e.y;
      if (!e.alive) y += (20 - e.fade) * 0.5;
      if (e.status.sleep) y += Math.sin(frameCount / 20) * 1;
      drawSprite(e.img, e.x, Math.round(y));
      ctx.globalAlpha = 1;
      if (e.alive && e.status.sleep && (frameCount >> 5) % 2) drawText('z', e.x + e.img.width - 4, e.y - 6, '#c0c8ff', 10);
    }
    const n = Game.party.length;
    ctx.save();
    if (this.shakeT > 0 && this.shakeMember >= 0) {
      // jitter only the damaged member's window
    }
    drawPartyStatus(6, Game.party, this.inputIdx);
    ctx.restore();
    this.log.render();
  }
}

function physDamage(atk, def) {
  const base = atk / 2 - def / 4;
  const lim = Math.max(1, Math.floor(atk / 16));
  if (base < lim) return rndInt(0, lim);
  return Math.max(0, Math.floor(base * (0.875 + Math.random() * 0.25)));
}
function waitKey() {
  return new Promise(res => {
    const sc = { update() { if (Input.pressed('a') || Input.pressed('b')) { Scenes.remove(this); res(); } }, render() {} };
    Scenes.push(sc);
  });
}

const Battle = {
  async start(groups, opts = {}) {
    Game.battleActive = true;
    Sound.sfx('encounter');
    if (Field) { for (let i = 0; i < 3; i++) { FX.doFlash(4, '#fff'); await wait(7); } }
    await fadeOut(10);
    opts.night = opts.night != null ? opts.night : !!(Field && Field.map.def.world && Game.isNight());
    return new Promise(res => {
      const sc = new BattleScene(groups, opts, res);
      Scenes.push(sc);
      sc.run().catch(e => { console.error(e); Game.battleActive = false; Scenes.remove(sc); fadeIn(10); res('escape'); });
    });
  },
};

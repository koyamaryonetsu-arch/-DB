'use strict';
/* =====================================================================
 * field.js — map exploration scene
 * ===================================================================== */

const WALK_FRAMES = 8;           // frames per tile step
const FIELD_OFFSET_X = 120, FIELD_OFFSET_Y = 112;   // player tile screen position

class FieldScene {
  constructor() {
    this.opaque = true;
    this.map = null; this.npcs = [];
    this.p = { x: 0, y: 0, dir: 'down', moving: false, t: 0, fx: 0, fy: 0 };
    this.trail = [];              // follower positions [{x,y,dir,fx,fy}]
    this.busy = 0;
    this.encGrace = 6;
    this.banner = null; this.bannerT = 0;
    this.bumpT = 0; this.stepSound = 0;
    this.darkCanvas = makeCanvas(SW, SH);
    this.hurtFlash = 0;
    this.lastBgm = null;
  }

  /* ---------- loading ---------- */
  load(mapId, x, y, dir) {
    this.map = Maps.build(mapId);
    const s = Game.s;
    s.map = mapId; s.x = x; s.y = y; s.dir = dir || s.dir;
    Object.assign(this.p, { x, y, dir: s.dir, moving: false, t: 0 });
    this.resetTrail();
    this.spawnNpcs();
    this.encGrace = 6;
    const nm = fmtText(this.map.name);
    if (!this.map.def.world) { this.banner = nm; this.bannerT = 150; } else this.banner = null;
    this.updateBgm(true);
  }
  resetTrail() {
    const n = Game.party.length - 1;
    this.trail = [];
    for (let i = 0; i < n; i++) this.trail.push({ x: this.p.x, y: this.p.y, dir: this.p.dir, fx: this.p.x, fy: this.p.y });
  }
  spawnNpcs() {
    const night = Game.isNight() && (this.map.def.outdoor || this.map.def.nightAware !== false);
    this.npcs = [];
    for (const d of (this.map.def.npcs || [])) {
      if (d.time === 'day' && night) continue;
      if (d.time === 'night' && !night) continue;
      if (d.cond && !d.cond()) continue;
      this.npcs.push({ def: d, id: d.id, kind: d.kind, x: d.x, y: d.y, hx: d.x, hy: d.y, dir: d.dir || 'down', moving: false, t: 0, fx: d.x, fy: d.y, sx: d.x, sy: d.y, wait: 60 + rnd(120) });
    }
  }
  refreshNpcs() {   // after flags change: keep positions of existing npcs
    const old = new Map(this.npcs.map(n => [n.id, n]));
    this.spawnNpcs();
    this.npcs = this.npcs.map(n => { const o = old.get(n.id); return o && !o.moving ? Object.assign(n, { x: o.x, y: o.y, fx: o.x, fy: o.y, dir: o.dir }) : n; });
  }
  updateBgm(force) {
    const b = Maps.bgmAt(this.map, this.p.x, this.p.y);
    if (b !== this.lastBgm || force) { this.lastBgm = b; if (!Game.battleActive) Sound.playBGM(b); }
  }

  /* ---------- queries ---------- */
  npcAt(x, y) { return this.npcs.find(n => (n.x === x && n.y === y) || (n.moving && n.sx === x && n.sy === y)); }
  blocked(x, y) {
    if (!Maps.passable(this.map, x, y)) return true;
    if (this.npcAt(x, y)) return true;
    return false;
  }
  isNightHere() { return Game.isNight() && !!(this.map.def.world || this.map.def.outdoor); }

  /* ---------- update ---------- */
  update() {
    if (this.bannerT > 0) this.bannerT--;
    if (this.bumpT > 0) this.bumpT--;
    this.updateNpcs();
    if (this.p.moving) { this.stepAnim(); return; }
    if (this.busy) return;
    if (Input.pressed('a')) { this.runEvent(() => this.interact()); return; }
    if (Input.pressed('b')) { this.runEvent(() => FieldMenu.open()); return; }
    const d = Input.dir();
    if (d) this.tryMove(d);
  }
  bgUpdate() { if (this.hurtFlash > 0) this.hurtFlash--; }

  tryMove(d) {
    const p = this.p;
    p.dir = d; Game.s.dir = d;
    const [dx, dy] = DXY[d];
    const nx = p.x + dx, ny = p.y + dy;
    const m = this.map;
    if (!Maps.inside(m, nx, ny)) {
      if (m.def.exit) { this.runEvent(() => this.exitMap()); }
      return;
    }
    if (Maps.baseAt(m, nx, ny) === 'ldoor') { this.runEvent(() => this.lockedDoor(nx, ny)); return; }
    if (this.blocked(nx, ny)) {
      if (this.bumpT <= 0) { Sound.sfx('bump'); this.bumpT = 14; }
      return;
    }
    // start step
    const old = { x: p.x, y: p.y, dir: p.dir };
    p.sx = p.x; p.sy = p.y; p.x = nx; p.y = ny; p.moving = true; p.t = 0;
    // shift followers
    const nt = [];
    for (let i = 0; i < this.trail.length; i++) {
      const prev = i === 0 ? old : this.trail[i - 1];
      const f = this.trail[i];
      nt.push({ x: prev.x, y: prev.y, sx: f.x, sy: f.y, dir: f.x !== prev.x || f.y !== prev.y ? dirTo(f.x, f.y, prev.x, prev.y) : f.dir });
    }
    this.trail = nt;
  }
  stepAnim() {
    const p = this.p;
    p.t++;
    if (p.t >= WALK_FRAMES) { p.moving = false; p.t = 0; this.onStepEnd(); }
  }
  frac() { return this.p.moving ? this.p.t / WALK_FRAMES : 1; }

  onStepEnd() {
    const s = Game.s, m = this.map, p = this.p;
    s.x = p.x; s.y = p.y; s.steps++;
    for (const f of this.trail) { f.sx = f.x; f.sy = f.y; }
    if (m.def.world) Game.advanceClock(1);
    if (s.repel > 0) { s.repel--; if (s.repel === 0) this.runEvent(() => say('きよめの ちからが きれた。')); }
    this.updateBgm();
    // step damage (poison / swamp)
    const base = Maps.baseAt(m, p.x, p.y);
    const swamp = base === 'swamp';
    let hurt = false;
    const fallen = [];
    for (const mem of Game.party) {
      if (mem.hp <= 0) continue;
      if (mem.status.poison) { mem.hp = Math.max(0, mem.hp - 1); hurt = true; }
      if (swamp) { mem.hp = Math.max(0, mem.hp - 1); hurt = true; }
      if (mem.hp <= 0) { fallen.push(mem); mem.status = {}; }
    }
    if (hurt) { this.hurtFlash = 6; Sound.sfx(swamp ? 'swamp' : 'poison'); }
    if (hurt && Game.partyWiped()) { this.runEvent(() => Events.wipe()); return; }
    if (fallen.length) { this.resetTrail(); this.runEvent(async () => { for (const mm of fallen) await say(mm.name + 'は ちからつきた…。'); }); }
    // warps / triggers
    const key = p.x + ',' + p.y;
    const wp = (m.def.warps || {})[key];
    if (wp) { this.runEvent(() => this.doWarp(wp)); return; }
    const trig = (m.def.triggers || {})[key];
    if (trig) { this.runEvent(() => trig()); return; }
    // encounters
    this.checkEncounter();
  }

  checkEncounter() {
    const m = this.map, p = this.p;
    if (this.encGrace > 0) { this.encGrace--; return; }
    const zone = Maps.zoneAt(m, p.x, p.y);
    if (!zone || !ENCOUNTERS[zone]) return;
    let rate;
    if (m.def.world) {
      const td = Tiles.def(Maps.baseAt(m, p.x, p.y));
      rate = td && td.enc != null ? td.enc : 1;
    } else rate = m.def.encRate != null ? m.def.encRate : 1;
    if (m.def.noEncRect) { const r = m.def.noEncRect; if (p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1) return; }
    if (rate <= 0) return;
    if (!chance(rate / 20)) return;
    if (Game.s.repel > 0 && (zone === 'A' || zone === 'B' || chance(0.5))) return;
    this.runEvent(() => Events.randomBattle(zone, this.battleBg()));
  }
  battleBg() {
    const m = this.map;
    if (m.def.world) { const td = Tiles.def(Maps.baseAt(m, this.p.x, this.p.y)); return (td && td.bg) || 'plains'; }
    if (m.id.startsWith('tower')) return 'tower';
    return 'cave';
  }

  /* ---------- NPC AI ---------- */
  updateNpcs() {
    for (const n of this.npcs) {
      if (n.moving) {
        n.t++;
        if (n.t >= 16) { n.moving = false; n.t = 0; n.sx = n.x; n.sy = n.y; }
        continue;
      }
      if (!n.def.wander || this.busy) continue;
      if (--n.wait > 0) continue;
      n.wait = 70 + rnd(140);
      const d = pick(DIRS);
      const [dx, dy] = DXY[d];
      const nx = n.x + dx, ny = n.y + dy;
      n.dir = d;
      if (Math.abs(nx - n.hx) > n.def.wander || Math.abs(ny - n.hy) > n.def.wander) continue;
      if (!Maps.passable(this.map, nx, ny) || !Maps.inside(this.map, nx, ny)) continue;
      if (this.npcAt(nx, ny)) continue;
      if ((nx === this.p.x && ny === this.p.y) || (this.p.moving && nx === this.p.sx && ny === this.p.sy)) continue;
      if (this.trail.some(f => f.x === nx && f.y === ny)) continue;
      const wp = (this.map.def.warps || {})[nx + ',' + ny];
      if (wp || Maps.baseAt(this.map, nx, ny) === 'door') continue;
      if (DIRS.some(dd => { const [ax, ay] = DXY[dd], t = Maps.baseAt(this.map, nx + ax, ny + ay); return t === 'door' || t === 'ldoor' || t === 'stairs_up' || t === 'stairs_down' || !!(this.map.def.warps || {})[(nx + ax) + ',' + (ny + ay)]; })) continue;   // keep entrances clear
      n.sx = n.x; n.sy = n.y; n.x = nx; n.y = ny; n.moving = true; n.t = 0;
    }
  }

  /* ---------- events ---------- */
  async runEvent(fn) {
    this.busy++;
    Input.clearEdges();
    try { await fn(); }
    catch (e) { console.error(e); }
    finally {
      Msg.close();
      this.busy--;
      Input.clearEdges();
    }
  }
  async doWarp(wp) {
    if (wp.town) { Game.s.visited[wp.town] = true; Game.s.lastTown = wp.town; }
    Sound.sfx(this.map.def.world ? 'stairs' : (Maps.baseAt(this.map, this.p.x, this.p.y) === 'door' ? 'door' : 'stairs'));
    await this.transition(wp.map, wp.x, wp.y, wp.dir);
    if (wp.first && !Game.flag(wp.first)) { Game.setFlag(wp.first); if (Events[wp.first]) await Events[wp.first](); }
  }
  async exitMap() {
    const m = this.map;
    if (m.def.canExit && !(await m.def.canExit())) return;
    const ex = m.def.exit;
    if (ex.map === 'world') Game.s.lastWorld = { x: ex.x, y: ex.y };
    await this.transition(ex.map, ex.x, ex.y, this.p.dir);
  }
  async transition(mapId, x, y, dir, opts = {}) {
    await fadeOut(opts.fade || 14);
    this.load(mapId, x, y, dir);
    if (mapId === 'world') Game.s.lastWorld = { x, y };
    await fadeIn(opts.fade || 14);
  }
  async lockedDoor(x, y) {
    if (Game.has('oldkey')) {
      Sound.sfx('door');
      await say('{hero}は ふるびたカギを つかった！\nとびらが ひらいた。');
      Game.setFlag('door:' + this.map.id + ':' + x + ',' + y);
      this.map.base[y * this.map.w + x] = 'door';
      return;
    }
    Sound.sfx('locked');
    await say('とびらには カギが かかっている。');
  }

  /* A button: talk / check what's in front, else open menu */
  async interact() {
    const p = this.p, m = this.map;
    const [dx, dy] = DXY[p.dir];
    const fx = p.x + dx, fy = p.y + dy;
    let npc = this.npcAt(fx, fy);
    if (!npc && Maps.isCounter(m, fx, fy)) npc = this.npcAt(fx + dx, fy + dy);
    if (npc) { await this.talkTo(npc); return; }
    if (await this.checkTile(fx, fy, true)) return;
    await FieldMenu.open();
  }
  async talkTo(npc) {
    if (!npc.def.fixedDir && npc.kind !== 'king') npc.dir = OPP[this.p.dir];
    const t = npc.def.talk;
    if (typeof t === 'function') { await t(npc); return; }
    let lines = t;
    if (t && typeof t === 'object' && !Array.isArray(t)) lines = this.isNightHere() ? (t.night || t.day) : (t.day || t.night);
    if (!lines) return;
    if (!Array.isArray(lines)) lines = [lines];
    for (const l of lines) await say(l);
  }
  /* returns true if something was handled */
  async checkTile(x, y, front) {
    const m = this.map, key = x + ',' + y;
    const inter = (m.def.interact || {})[key];
    if (inter) { await inter(); return true; }
    if (Maps.baseAt(m, x, y) === 'ldoor') { await this.lockedDoor(x, y); return true; }
    const prop = Maps.propAt(m, x, y);
    if (prop === 'chest') { await this.openChest(x, y); return true; }
    if (prop === 'well' && m.id === 'soleia') { await Events.well(); return true; }
    if (prop && prop.startsWith('sign_')) { await say(SIGN_TEXT[prop] || 'かんばんが ある。'); return true; }
    const hid = (m.def.hidden || {})[key];
    const searchable = prop && Tiles.def(prop).search;
    if (searchable || (hid && !front)) {
      if (hid && !Game.flag('found:' + hid.id)) {
        Game.setFlag('found:' + hid.id);
        await this.giveFound(hid, searchable ? PROP_NAME[prop] : null);
      } else if (searchable) {
        await say('{hero}は ' + (PROP_NAME[prop] || 'それ') + 'を しらべた。\nしかし なにも みつからなかった。');
      } else return false;
      return true;
    }
    return false;
  }
  async giveFound(h, where) {
    Sound.sfx('chest');
    const lead = where ? '{hero}は ' + where + 'の なかを しらべた。\n' : '{hero}は あしもとを しらべた。\n';
    if (h.gold) { Game.s.gold += h.gold; await say(lead + 'なんと ' + h.gold + 'ゴールドを みつけた！'); return; }
    Game.addItem(h.item, 1);
    if (h.item === 'star') await Sound.playJingle('item');
    await say(lead + 'なんと ' + ITEMS[h.item].name + 'を みつけた！');
  }
  async openChest(x, y) {
    const m = this.map;
    const key = x + ',' + y, flag = 'chest:' + m.id + ':' + key;
    if (Game.flag(flag)) { await say('たからばこは からっぽだ。'); return; }
    const c = (m.def.chests || {})[key] || { item: 'herb' };
    Game.setFlag(flag);
    Sound.sfx('chest');
    if (c.gold) { Game.s.gold += c.gold; await say('{hero}は たからばこを あけた！\n' + c.gold + 'ゴールドを てにいれた！'); return; }
    Game.addItem(c.item, 1);
    if (c.item === 'star' || ITEMS[c.item].kind !== 'use') await Sound.playJingle('item');
    await say('{hero}は たからばこを あけた！\n' + ITEMS[c.item].name + 'を てにいれた！');
  }
  /* search command (menu しらべる): feet first, then front */
  async search() {
    const p = this.p;
    if (await this.checkTile(p.x, p.y, false)) return;
    const [dx, dy] = DXY[p.dir];
    if (await this.checkTile(p.x + dx, p.y + dy, true)) return;
    await say('{hero}は あしもとを しらべた。\nしかし なにも みつからなかった。');
  }

  /* ---------- rendering ---------- */
  playerPx() {
    const f = this.frac(), p = this.p;
    const px = (p.moving ? p.sx + (p.x - p.sx) * f : p.x) * TS;
    const py = (p.moving ? p.sy + (p.y - p.sy) * f : p.y) * TS;
    return [Math.round(px), Math.round(py)];
  }
  /* top-left of the viewport in world pixels; small maps are centred */
  camera() {
    const [px, py] = this.playerPx();
    let cx = px - FIELD_OFFSET_X, cy = py - FIELD_OFFSET_Y;
    const mw = this.map.w * TS, mh = this.map.h * TS;
    if (mw <= SW) cx = Math.floor((mw - SW) / 2);
    if (mh <= SH - 8) cy = Math.floor((mh - SH) / 2);
    return [cx, cy, px, py];
  }
  outsideTile() {
    const d = this.map.def;
    if (d.world) return 'sea';
    if (d.outdoor && !d.interior) return 'grass';
    return 'void';
  }
  render() {
    const m = this.map;
    if (!m) return;
    const [cx, cy, ppx, ppy] = this.camera();
    const ox = -cx, oy = -cy;   // screen = world + o
    this.leaderScreen = [ppx + ox, ppy + oy];
    const tx0 = Math.floor(-ox / TS) - 1, ty0 = Math.floor(-oy / TS) - 1;
    const tx1 = tx0 + Math.ceil(SW / TS) + 2, ty1 = ty0 + Math.ceil(SH / TS) + 2;
    const fA = (frameCount >> 5) & 1, fG = (frameCount >> 3) & 3, fT = (frameCount >> 4) & 1;
    const out = this.outsideTile();
    // base layer
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const sx = tx * TS + ox, sy = ty * TS + oy;
        let id, v = 0;
        if (Maps.inside(m, tx, ty)) { const i = ty * m.w + tx; id = m.base[i]; v = m.vari[i]; }
        else { id = out; v = out === 'grass' ? Math.floor(hash2(tx, ty, 5) * 4) : 0; }
        const def = Tiles.def(id);
        const f = def && def.anim ? (def.anim === 4 ? fG : fA) : 0;
        const img = Tiles.get(id, v, f);
        if (img) ctx.drawImage(img, sx, sy);
        if (!Maps.inside(m, tx, ty) && out === 'grass' && hash2(tx, ty, 77) < 0.55) ctx.drawImage(Tiles.get('tree', 0, 0), sx, sy);
      }
    }
    // props
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (!Maps.inside(m, tx, ty)) continue;
        const pr = m.prop[ty * m.w + tx];
        if (!pr) continue;
        let v = 0, f = 0;
        if (pr === 'chest' && Game.flag('chest:' + m.id + ':' + tx + ',' + ty)) v = 1;
        const pd = Tiles.def(pr);
        if (pd.anim) f = fA;
        ctx.drawImage(Tiles.get(pr, v, f), tx * TS + ox, ty * TS + oy);
      }
    }
    // characters
    const actors = [];
    const f = this.frac();
    for (const n of this.npcs) {
      const k = n.moving ? n.t / 16 : 1;
      const x = (n.moving ? n.sx + (n.x - n.sx) * k : n.x) * TS + ox;
      const y = (n.moving ? n.sy + (n.y - n.sy) * k : n.y) * TS + oy;
      actors.push({ y, x, draw: () => this.drawNpc(n, x, y, fT) });
    }
    const order = this.partyOrder();
    order.forEach((mem, i) => {
      let x, y, dir;
      if (i === 0) { x = ppx + ox; y = ppy + oy; dir = this.p.dir; }
      else {
        const t = this.trail[i - 1];
        if (!t) return;
        const sxp = t.sx != null && this.p.moving ? t.sx : t.x, syp = t.sy != null && this.p.moving ? t.sy : t.y;
        x = (sxp + (t.x - sxp) * f) * TS + ox; y = (syp + (t.y - syp) * f) * TS + oy;
        dir = t.dir;
        if (t.x === this.p.x && t.y === this.p.y && !this.p.moving) return;   // stacked on leader
      }
      actors.push({ y: y - i * 0.01, x, draw: () => this.drawMember(mem, Math.round(x), Math.round(y), dir, fT) });
    });
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) a.draw();
    // lighting
    this.renderLighting(ox, oy, tx0, ty0, tx1, ty1);
    if (this.hurtFlash > 0) { ctx.globalAlpha = 0.35; fillRect(0, 0, SW, SH, '#e02020'); ctx.globalAlpha = 1; }
    // banner
    if (this.banner && this.bannerT > 0 && !this.busy) {
      const w = Math.min(220, textWidth(this.banner) + 28);
      const bx = (SW - w) >> 1;
      ctx.globalAlpha = Math.min(1, this.bannerT / 30);
      drawWindow(bx, 10, w, 28);
      drawText(this.banner, SW / 2, 18, COL.white, 12, 'center');
      ctx.globalAlpha = 1;
    }
  }
  partyOrder() {
    const alive = Game.party.filter(mm => mm.hp > 0), dead = Game.party.filter(mm => mm.hp <= 0);
    if (!alive.length) return Game.party.slice();
    return Game.party.filter(mm => mm === alive[0]).concat(Game.party.filter(mm => mm !== alive[0]));
  }
  drawMember(mem, x, y, dir, fT) {
    if (mem.hp <= 0) { drawSprite(CharArt.get('coffin', dir, 0), x, y); return; }
    const kind = JOBS[mem.job].sprite + '_' + (mem.gender === 'f' ? 'f' : 'm');
    const img = CharArt.get(kind, dir, fT);
    drawSprite(img, x, y);
  }
  drawNpc(n, x, y, fT) {
    if (n.kind === 'golem') {
      const img = MonsterArt.get('guard_golem');
      const w = Math.round(img.width * 0.5), h = Math.round(img.height * 0.5);
      ctx.drawImage(img, Math.round(x + 8 - w / 2), Math.round(y + 16 - h), w, h);
      return;
    }
    drawSprite(CharArt.get(n.kind, n.dir, fT), Math.round(x), Math.round(y));
  }
  renderLighting(ox, oy, tx0, ty0, tx1, ty1) {
    const m = this.map;
    let dark = 0;
    if (m.def.world) dark = Game.darkness();
    else if (m.def.outdoor && Game.isNight()) dark = 0.58;
    if (dark <= 0.01) return;
    const g = this.darkCanvas.getContext('2d');
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, SW, SH);
    g.fillStyle = m.def.world ? Game.tintColor() : '#08103a';
    g.globalAlpha = dark;
    g.fillRect(0, 0, SW, SH);
    g.globalAlpha = 1;
    // light holes
    g.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, s = 1) => {
      const spr = lightSprite(r, s);
      g.drawImage(spr, Math.round(x - r), Math.round(y - r));
    };
    const [lx, ly] = this.leaderScreen || [FIELD_OFFSET_X, FIELD_OFFSET_Y];
    hole(lx + 8, ly + 8, m.def.world ? 36 : 44, 0.8);
    const lights = [];
    if (!m.def.world) {
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        if (!Maps.inside(m, tx, ty)) continue;
        const pr = m.prop[ty * m.w + tx];
        const pd = pr && Tiles.def(pr);
        if (pd && pd.light) lights.push([tx * TS + ox + 8, ty * TS + oy + 6, pd.light]);
        const b = m.base[ty * m.w + tx];
        if (b === 'floor' || b === 'stone' || b === 'carpet') { if (hash2(tx, ty, 3) < 0.9) lights.push([tx * TS + ox + 8, ty * TS + oy + 8, 18, 0.6]); }
      }
    }
    for (const [x, y, r, s] of lights) hole(x, y, r, s || 1);
    g.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.darkCanvas, 0, 0);
    // warm glow on lamps/torches
    if (lights.length) {
      ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, r, s] of lights) {
        if (s) continue;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 0.6);
        gr.addColorStop(0, 'rgba(255,170,60,0.28)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}

const _lightCache = new Map();
function lightSprite(r, s) {
  const key = r + '|' + s;
  let c = _lightCache.get(key);
  if (c) return c;
  c = makeCanvas(r * 2, r * 2);
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, `rgba(0,0,0,${0.85 * s})`); gr.addColorStop(0.6, `rgba(0,0,0,${0.45 * s})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
  _lightCache.set(key, c);
  return c;
}

function dirTo(x0, y0, x1, y1) {
  if (x1 > x0) return 'right';
  if (x1 < x0) return 'left';
  if (y1 > y0) return 'down';
  return 'up';
}
const PROP_NAME = { pot: 'つぼ', barrel: 'たる', crate: 'はこ', shelf: 'たな' };
const SIGN_TEXT = {
  sign_weapon: '『ぶきや』\nつよい ぶきで まものに たちむかえ！',
  sign_armor: '『ぼうぐや』\nみを まもる そなえは たびの きほん。',
  sign_item: '『どうぐや』\nやくそうは つねに もちあるこう。',
  sign_inn: '『やどや』\nつかれた からだを やすめていきな。',
  sign_church: '『きょうかい』\nかみの みまもる いのりの いえ。',
  sign_bar: '『マルタの さかば』\nたびの なかまが みつかる さかば。',
};

let Field = null;   // the live FieldScene

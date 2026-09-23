'use strict';
/* =====================================================================
 * game.js — game state, party members, inventory, flags, time, saves
 * ===================================================================== */

const CLOCK_CYCLE = 360;          // world-map steps per day
const MAX_PARTY = 4;
const SAVE_VERSION = 1;

const Game = {
  s: null,                         // the whole persistent state
  settings: { msgSpeed: 2, volume: 0.5, muted: false },
  battleActive: false,

  /* ---------- new game ---------- */
  newGame(heroName, gender, pers) {
    const hero = this.createMember(heroName, 'hero', gender, pers);
    hero.isHero = true;
    this.s = {
      v: SAVE_VERSION,
      party: [hero], bench: [],
      gold: 0, bag: {}, flags: {},
      map: 'hero2f', x: 4, y: 3, dir: 'down',
      steps: 0, clock: 40, day: 1, repel: 0,
      visited: {}, lastTown: 'soleia',
      respawn: { map: 'soleia', x: 20, y: 17, dir: 'up' },
      playTime: 0, starsGiven: 0, nextUid: 2, created: Date.now(), savedAt: 0,
    };
    hero.uid = 1;
    return this.s;
  },

  createMember(name, job, gender = 'm', pers = 'steady') {
    const J = JOBS[job], P = PERSONALITIES[pers] || PERSONALITIES.steady;
    const m = {
      uid: 0, name, job, gender, pers, level: 1, exp: 0,
      eq: { weapon: null, armor: null, shield: null, helm: null }, status: {},
    };
    for (const st of STATS) m[st] = Math.max(1, Math.round(J.base[st] * P.mul[st] * (0.92 + Math.random() * 0.16)));
    m.mhp = Math.max(8, J.hp0 + rndInt(0, 3) + (m.vit - J.base.vit) * 2);
    m.mmp = J.mp0 > 0 ? J.mp0 + rndInt(0, 2) + Math.max(0, m.int - J.base.int) : 0;
    m.hp = m.mhp; m.mp = m.mmp;
    for (const id of (START_KIT[job] || [])) m.eq[ITEMS[id].kind] = id;
    return m;
  },
  newUid() { return this.s.nextUid++; },

  /* ---------- party ---------- */
  get party() { return this.s.party; },
  hero() { return this.s.party.find(m => m.isHero) || this.s.party[0]; },
  alive() { return this.s.party.filter(m => m.hp > 0); },
  leader() { return this.s.party.find(m => m.hp > 0) || this.s.party[0]; },
  partyWiped() { return this.s.party.every(m => m.hp <= 0); },

  atk(m) { const w = m.eq.weapon ? ITEMS[m.eq.weapon].atk : 0; return Math.min(999, m.str + w); },
  def(m) {
    let d = Math.floor(m.agi / 2);
    for (const k of ['armor', 'shield', 'helm']) if (m.eq[k]) d += ITEMS[m.eq[k]].def || 0;
    return Math.min(999, d);
  },
  canEquip(m, id) { const it = ITEMS[id]; return !!(it && it.equip && it.equip.includes(m.job)); },
  /* put item from bag onto member; returns previous item id (moved back to bag) */
  equip(m, id) {
    const it = ITEMS[id];
    const slot = it.kind;
    const prev = m.eq[slot];
    if (prev) this.addItem(prev, 1);
    this.removeItem(id, 1);
    m.eq[slot] = id;
    return prev;
  },
  unequip(m, slot) {
    const prev = m.eq[slot];
    if (prev) { this.addItem(prev, 1); m.eq[slot] = null; }
    return prev;
  },
  spellsOf(m) {
    const J = JOBS[m.job];
    return (J.spells || []).filter(([lv]) => m.level >= lv).map(([, id]) => id);
  },
  nextExp(m) { return expForLevel(m.level + 1, m.job); },

  /* returns array of level-up records */
  gainExp(m, amount) {
    if (m.hp <= 0) return [];
    m.exp += amount;
    const ups = [];
    while (m.level < 99 && m.exp >= this.nextExp(m)) ups.push(this.levelUp(m));
    return ups;
  },
  levelUp(m) {
    const J = JOBS[m.job], P = PERSONALITIES[m.pers] || PERSONALITIES.steady;
    const gains = {};
    m.level++;
    for (const st of STATS) {
      const g = J.grow[st] * P.mul[st];
      const v = g * (0.55 + Math.random() * 0.9);
      let n = Math.floor(v) + (Math.random() < v - Math.floor(v) ? 1 : 0);
      if (m.level % 4 === 0 && g >= 1 && n === 0) n = 1;
      gains[st] = Math.min(255 - m[st], n);
      m[st] += gains[st];
    }
    const hpg = Math.max(1, gains.vit * 2 + rndInt(0, 2));
    const mpg = J.mpMul > 0 ? Math.max(1, Math.round(gains.int * J.mpMul + Math.random())) : 0;
    gains.mhp = Math.min(999 - m.mhp, hpg); gains.mmp = Math.min(999 - m.mmp, mpg);
    m.mhp += gains.mhp; m.hp += gains.mhp;
    m.mmp += gains.mmp; m.mp += gains.mmp;
    const newSpells = (J.spells || []).filter(([lv]) => lv === m.level).map(([, id]) => id);
    return { level: m.level, gains, newSpells };
  },
  healAll() { for (const m of this.s.party) if (m.hp > 0) { m.hp = m.mhp; m.mp = m.mmp; } },

  /* ---------- items ---------- */
  count(id) { return this.s.bag[id] || 0; },
  has(id) { return this.count(id) > 0 || this.s.party.some(m => Object.values(m.eq).includes(id)); },
  addItem(id, n = 1) { if (!ITEMS[id]) return; this.s.bag[id] = (this.s.bag[id] || 0) + n; },
  removeItem(id, n = 1) {
    const c = this.count(id) - n;
    if (c > 0) this.s.bag[id] = c; else delete this.s.bag[id];
  },
  bagList(filter) {
    const order = ['use', 'weapon', 'armor', 'shield', 'helm', 'key'];
    return Object.keys(this.s.bag).filter(id => this.s.bag[id] > 0 && (!filter || filter(ITEMS[id], id)))
      .sort((a, b) => order.indexOf(ITEMS[a].kind) - order.indexOf(ITEMS[b].kind) || (ITEMS[a].price || 0) - (ITEMS[b].price || 0));
  },
  sellPrice(id) { const it = ITEMS[id]; return it.sell != null ? it.sell : Math.floor((it.price || 0) * 3 / 4); },

  /* ---------- flags ---------- */
  flag(k) { return !!this.s.flags[k]; },
  setFlag(k, v = true) { if (v) this.s.flags[k] = v; else delete this.s.flags[k]; },

  /* ---------- time ---------- */
  isNight() { const c = this.s.clock; return c >= 250 && c < 340; },
  /* darkness 0..1 for rendering the world map */
  darkness() {
    const c = this.s.clock;
    if (c < 215) return 0;
    if (c < 250) return (c - 215) / 35 * 0.62;
    if (c < 330) return 0.62;
    return 0.62 * (1 - (c - 330) / 30);
  },
  tintColor() { const c = this.s.clock; return c >= 215 && c < 250 ? '#402060' : '#08103a'; },
  advanceClock(n = 1) {
    this.s.clock += n;
    if (this.s.clock >= CLOCK_CYCLE) { this.s.clock -= CLOCK_CYCLE; this.s.day++; }
  },
  setMorning() { if (this.s.clock > 60) this.s.day++; this.s.clock = 0; },

  /* ---------- save / load ---------- */
  snapshot() {
    if (typeof Field !== 'undefined' && Field && Field.map && Field.map.id === this.s.map) { this.s.x = Field.p.x; this.s.y = Field.p.y; this.s.dir = Field.p.dir; }
    const copy = JSON.parse(JSON.stringify(this.s));
    for (const m of copy.party.concat(copy.bench)) { delete m.buff; delete m.tmp; }
    return copy;
  },
  load(data) {
    if (!data || !data.party || !data.party.length) return false;
    this.s = data;
    // forward compat defaults
    const s = this.s;
    s.bench = s.bench || []; s.bag = s.bag || {}; s.flags = s.flags || {}; s.visited = s.visited || {};
    if (s.nextUid == null) s.nextUid = 100;
    if (s.starsGiven == null) s.starsGiven = 0;
    for (const m of s.party.concat(s.bench)) { m.status = m.status || {}; m.eq = m.eq || { weapon: null, armor: null, shield: null, helm: null }; }
    return true;
  },
  summary(data) {
    const h = data.party.find(m => m.isHero) || data.party[0];
    const t = Math.floor(data.playTime || 0);
    return { name: h.name, level: h.level, place: (MAP_NAMES[data.map] || ''), time: `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}` };
  },
  async saveSlot(slot) {
    this.s.savedAt = Date.now();
    const data = this.snapshot();
    LocalStore.set('bl_save_' + slot, data);
    await CloudStore.save(slot, data);
    return true;
  },
  async readSlot(slot) {
    const local = LocalStore.get('bl_save_' + slot);
    const cloud = await CloudStore.load(slot);
    if (local && cloud) return (cloud.savedAt || 0) >= (local.savedAt || 0) ? cloud : local;
    return cloud || local || null;
  },
  async deleteSlot(slot) {
    LocalStore.del('bl_save_' + slot);
    await CloudStore.remove(slot);
  },
  loadSettings() {
    const st = LocalStore.get('bl_settings');
    if (st) Object.assign(this.settings, st);
  },
  saveSettings() { LocalStore.set('bl_settings', this.settings); },
};
const MAP_NAMES = {};   // filled by maps.js

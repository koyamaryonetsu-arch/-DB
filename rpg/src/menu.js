'use strict';
/* =====================================================================
 * menu.js — field command menu and sub screens
 * ===================================================================== */

const CMD = ['はなす', 'じゅもん', 'どうぐ', 'そうび', 'つよさ', 'しらべる', 'ならびかえ', 'せってい', 'きろく', 'ちず'];

async function chooseMember(opts = {}) {
  const party = opts.members || Game.party;
  const items = party.map(m => ({
    label: m.name,
    right: opts.right ? opts.right(m) : (m.hp > 0 ? `${m.hp}/${m.mhp}` : 'しに'),
    disabled: opts.filter ? !opts.filter(m) : false,
  }));
  const menu = new Menu({ items, x: opts.x ?? 96, y: opts.y ?? 40, w: opts.w || 140, title: opts.title || null, index: opts.index || 0 });
  const r = await menu.choose();
  menu.close();
  return r < 0 ? null : party[r];
}

const FieldMenu = {
  lastIndex: 0,
  async open() {
    Sound.sfx('cursor');
    const menu = new Menu({ items: CMD, cols: 2, x: 8, y: 8, w: 156, index: this.lastIndex });
    const info = pushInfo(() => { drawGoldWindow(176, 8); drawPartyStatus(SH - 60); });
    try {
      for (;;) {
        const r = await menu.choose();
        if (r < 0) break;
        this.lastIndex = r;
        const done = await this.run(CMD[r], menu);
        if (done) break;
      }
    } finally {
      menu.close(); Scenes.remove(info);
    }
  },
  async run(cmd, menu) {
    switch (cmd) {
      case 'はなす': return this.talk(menu);
      case 'じゅもん': return this.spells();
      case 'どうぐ': return this.items();
      case 'そうび': menu.hidden = true; await this.equip(); menu.hidden = false; return false;
      case 'つよさ': await this.status(); return false;
      case 'しらべる': menu.hidden = true; await Field.search(); return true;
      case 'ならびかえ': await this.order(); return false;
      case 'せってい': await this.settings(); return false;
      case 'きろく': return this.save();
      case 'ちず': await this.worldMap(); return false;
    }
    return false;
  },

  async talk(menu) {
    const f = Field, p = f.p;
    const [dx, dy] = DXY[p.dir];
    let npc = f.npcAt(p.x + dx, p.y + dy);
    if (!npc && Maps.isCounter(f.map, p.x + dx, p.y + dy)) npc = f.npcAt(p.x + dx * 2, p.y + dy * 2);
    menu.hidden = true;
    if (npc) await f.talkTo(npc);
    else await say('そちらには だれも いない。');
    return true;
  },

  /* ----- spells ----- */
  async spells() {
    const caster = await chooseMember({ title: 'だれが？', filter: m => m.hp > 0 && Game.spellsOf(m).length > 0, right: m => `M ${m.mp}` });
    if (!caster) return false;
    const list = Game.spellsOf(caster);
    const items = list.map(id => {
      const sp = SPELLS[id];
      const usable = sp.field && caster.mp >= sp.mp;
      return { label: sp.name, right: String(sp.mp), disabled: !usable };
    });
    let help = '';
    const hs = pushInfo(() => { if (help) drawHelp(help, 150); });
    const menu = new Menu({ items, x: 100, y: 36, w: 130, rows: Math.min(6, items.length), title: caster.name, onChange: i => { help = SPELLS[list[i]].desc; } });
    try {
      const r = await menu.choose();
      if (r < 0) return false;
      const id = list[r], sp = SPELLS[id];
      if (sp.type === 'heal' || sp.type === 'cure') {
        const t = await chooseMember({ title: 'だれに？', x: 60, y: 60, filter: m => m.hp > 0 });
        if (!t) return false;
        menu.close(); Scenes.remove(hs);
        caster.mp -= sp.mp;
        await castHealLike(caster, sp, t);
        return true;
      }
      if (sp.type === 'warp') {
        const dest = await chooseTown();
        if (!dest) return false;
        menu.close(); Scenes.remove(hs);
        caster.mp -= sp.mp;
        await say(caster.name + 'は ' + sp.name + 'を となえた！');
        await warpToTown(dest);
        return true;
      }
      if (sp.type === 'escape') {
        if (!Field.map.def.dungeon) { await say('ここでは つかえない。'); return false; }
        menu.close(); Scenes.remove(hs);
        caster.mp -= sp.mp;
        await say(caster.name + 'は ' + sp.name + 'を となえた！');
        await escapeDungeon();
        return true;
      }
      if (sp.type === 'repel') {
        menu.close(); Scenes.remove(hs);
        caster.mp -= sp.mp;
        Sound.sfx('spell');
        Game.s.repel = 120;
        await say(caster.name + 'は ' + sp.name + 'を となえた！\nせいなる ひかりが みを つつんだ。');
        return true;
      }
      return false;
    } finally { menu.close(); Scenes.remove(hs); }
  },

  /* ----- items ----- */
  async items() {
    let idx = 0;
    for (;;) {
      const list = Game.bagList();
      if (!list.length) { await say('どうぐを なにも もっていない。'); return true; }
      let help = '';
      const hs = pushInfo(() => { if (help) drawHelp(help, 202); });
      const items = list.map(id => ({ label: ITEMS[id].name, right: ITEMS[id].kind === 'key' && !ITEMS[id].stack ? '' : '×' + Game.count(id) }));
      const menu = new Menu({ items, x: 64, y: 8, w: 184, rows: Math.min(8, items.length), index: Math.min(idx, items.length - 1), onChange: i => { help = itemHelp(list[i]); } });
      const r = await menu.choose();
      if (r < 0) { menu.close(); Scenes.remove(hs); return false; }
      idx = r;
      const id = list[r], it = ITEMS[id];
      const acts = [];
      if (it.kind === 'use' || it.kind === 'key') acts.push('つかう');
      if (['weapon', 'armor', 'shield', 'helm'].includes(it.kind)) acts.push('そうび');
      if (it.kind !== 'key') acts.push('すてる');
      const a = await choose(acts, { x: 150, y: 60 });
      let finished = false;
      if (a >= 0) {
        const act = acts[a];
        if (act === 'つかう') finished = await this.useItem(id, menu, hs);
        else if (act === 'そうび') {
          const m = await chooseMember({ title: 'だれが？', filter: mm => Game.canEquip(mm, id), right: mm => JOBS[mm.job].short });
          if (m) { Game.equip(m, id); Sound.sfx('equip'); menu.close(); Scenes.remove(hs); await say(m.name + 'は ' + it.name + 'を そうびした。'); }
        } else if (act === 'すてる') {
          if (await yesno(it.name + 'を すてますか？')) { Game.removeItem(id, 1); await say(it.name + 'を すてた。'); }
          Msg.close();
        }
      }
      menu.close(); Scenes.remove(hs);
      if (finished) return true;
    }
  },
  async useItem(id, menu, hs) {
    const it = ITEMS[id];
    if (it.kind === 'key') {
      menu.close(); Scenes.remove(hs);
      if (id === 'oldkey') {
        const p = Field.p, [dx, dy] = DXY[p.dir];
        if (Maps.baseAt(Field.map, p.x + dx, p.y + dy) === 'ldoor') { await Field.lockedDoor(p.x + dx, p.y + dy); return true; }
        await say('ここでは つかいみちが ないようだ。'); return true;
      }
      if (id === 'blastorb') {
        const p = Field.p, [dx, dy] = DXY[p.dir];
        const inter = (Field.map.def.interact || {})[(p.x + dx) + ',' + (p.y + dy)];
        if (Field.map.id === 'shirube1' && inter) { await inter(); return true; }
        await say('いまは つかう ときではない。'); return true;
      }
      if (id === 'star') { await say('ほしのかけらは ちいさく まばたくように ひかっている…。'); return true; }
      await say(it.desc || 'いまは つかえない。'); return true;
    }
    if (!it.field) { await say('いまは つかえない。'); return false; }
    if (it.warp) {
      const dest = await chooseTown(); if (!dest) return false;
      menu.close(); Scenes.remove(hs);
      Game.removeItem(id, 1);
      await say('{hero}は ' + it.name + 'を そらに なげた！');
      await warpToTown(dest); return true;
    }
    if (it.repel) {
      menu.close(); Scenes.remove(hs);
      Game.removeItem(id, 1); Game.s.repel = 100; Sound.sfx('spell');
      await say('{hero}は ' + it.name + 'を ふりまいた。\nよわい まものが よってこなくなった！'); return true;
    }
    const t = await chooseMember({ title: 'だれに？', x: 60, y: 60, filter: m => m.hp > 0 });
    if (!t) return false;
    menu.close(); Scenes.remove(hs);
    Game.removeItem(id, 1);
    const msg = applyItem(it, t);
    await say('{hero}は ' + it.name + 'を つかった！\n' + msg);
    return true;
  },

  /* ----- equipment ----- */
  async equip() {
    const m = await chooseMember({ title: 'だれの そうび？', filter: mm => true, right: mm => JOBS[mm.job].short });
    if (!m) return;
    await equipScreen(m);
  },
  async status() {
    const m = await chooseMember({ title: 'だれの つよさ？', right: mm => 'Lv' + mm.level });
    if (!m) return;
    await statusScreen(Game.party.indexOf(m));
  },
  async order() {
    if (Game.party.length < 2) { await say('ならびかえる なかまが いない。'); return; }
    for (;;) {
      const a = await chooseMember({ title: 'だれと？', right: mm => JOBS[mm.job].short });
      if (!a) break;
      const b = await chooseMember({ title: 'だれと いれかえる？', x: 110, y: 70, right: mm => JOBS[mm.job].short });
      if (!b || a === b) continue;
      const p = Game.party, i = p.indexOf(a), j = p.indexOf(b);
      [p[i], p[j]] = [p[j], p[i]];
      Sound.sfx('confirm');
      Field.resetTrail();
    }
  },
  async settings() {
    let idx = 0;
    for (;;) {
      const st = Game.settings;
      const speeds = ['おそい', 'ふつう', 'はやい', 'いっしゅん'];
      const items = [
        { label: 'メッセージ', right: speeds[st.msgSpeed] },
        { label: 'おんがく', right: st.muted ? 'OFF' : 'ON' },
        { label: 'おんりょう', right: '■'.repeat(Math.round(st.volume * 5)) + '□'.repeat(5 - Math.round(st.volume * 5)) },
      ];
      const menu = new Menu({ items, x: 40, y: 40, w: 176, title: 'せってい', index: idx });
      const r = await menu.choose();
      menu.close();
      if (r < 0) break;
      idx = r;
      if (r === 0) st.msgSpeed = (st.msgSpeed + 1) % 4;
      if (r === 1) { st.muted = !st.muted; Sound.setMuted(st.muted); }
      if (r === 2) { st.volume = Math.round(st.volume * 5) >= 5 ? 0.2 : Math.round(st.volume * 5 + 1) / 5; Sound.setVolume(st.volume); }
      Game.saveSettings();
      if (typeof UIControls !== 'undefined') UIControls.syncMute();
    }
  },
  async save() {
    const slot = await chooseSaveSlot('どの ぼうけんのしょに きろくしますか？');
    if (!slot) return false;
    await Game.saveSlot(slot);
    Sound.sfx('confirm');
    await say('ぼうけんのしょ ' + slot + 'に きろくしました。');
    return true;
  },
  async worldMap() { await showWorldMap(); },
};

function itemHelp(id) {
  const it = ITEMS[id];
  if (it.desc) return it.desc;
  if (it.kind === 'weapon') return 'こうげき力 +' + it.atk;
  if (['armor', 'shield', 'helm'].includes(it.kind)) return 'しゅび力 +' + it.def;
  return '';
}

function applyItem(it, t) {
  if (it.heal) { const v = rndInt(it.heal[0], it.heal[1]); const b = t.hp; t.hp = Math.min(t.mhp, t.hp + v); Sound.sfx('heal'); return t.name + 'の HPが ' + (t.hp - b) + 'ポイント かいふくした！'; }
  if (it.mpheal) { const v = rndInt(it.mpheal[0], it.mpheal[1]); const b = t.mp; t.mp = Math.min(t.mmp, t.mp + v); Sound.sfx('heal'); return t.name + 'の MPが ' + (t.mp - b) + 'ポイント かいふくした！'; }
  if (it.cure) { if (t.status[it.cure]) { delete t.status[it.cure]; Sound.sfx('heal'); return t.name + 'の どくが きえた！'; } return 'しかし なにも おこらなかった。'; }
  if (it.stat) {
    Sound.sfx('buff');
    if (it.stat === 'mhp') { const v = rndInt(3, 6); t.mhp = Math.min(999, t.mhp + v); t.hp += v; return t.name + 'の さいだいHPが ' + v + 'ポイント あがった！'; }
    const v = rndInt(1, 3); t[it.stat] = Math.min(255, t[it.stat] + v); return t.name + 'の ' + STAT_NAMES[it.stat] + 'が ' + v + 'ポイント あがった！';
  }
  return 'しかし なにも おこらなかった。';
}

async function castHealLike(caster, sp, t) {
  await say(caster.name + 'は ' + sp.name + 'を となえた！', { wait: false });
  Sound.sfx(sp.sfx || 'heal');
  await wait(20);
  if (sp.type === 'heal') {
    const v = rndInt(sp.power[0], sp.power[1]);
    const b = t.hp; t.hp = Math.min(t.mhp, t.hp + v);
    await say(caster.name + 'は ' + sp.name + 'を となえた！\n' + t.name + 'の HPが ' + (t.hp - b) + 'ポイント かいふくした！', { instant: true });
  } else if (sp.type === 'cure') {
    if (t.status[sp.status]) { delete t.status[sp.status]; await say(caster.name + 'は ' + sp.name + 'を となえた！\n' + t.name + 'の どくが きえた！', { instant: true }); }
    else await say(caster.name + 'は ' + sp.name + 'を となえた！\nしかし なにも おこらなかった。', { instant: true });
  }
}

const TOWN_WARPS = {
  soleia: { name: 'ソレイア', map: 'world', x: 32, y: 49, dir: 'down' },
  norde: { name: 'ノルデ', map: 'world', x: 28, y: 14, dir: 'down' },
};
async function chooseTown() {
  const keys = Object.keys(TOWN_WARPS).filter(k => Game.s.visited[k]);
  if (!keys.length) { await say('しかし どこへも いけない。'); return null; }
  const r = await choose(keys.map(k => TOWN_WARPS[k].name), { x: 150, y: 50 });
  return r < 0 ? null : keys[r];
}
async function warpToTown(key) {
  if (Field.map.def.dungeon && !Field.map.def.world) { /* allowed from anywhere in ch.1 */ }
  const d = TOWN_WARPS[key];
  Msg.close();
  Sound.sfx('warp');
  await fadeOut(24, '#fff');
  Field.load(d.map, d.x, d.y, d.dir);
  await fadeIn(24);
}
async function escapeDungeon() {
  const back = { uminari1: [7, 53], uminari2: [7, 53], tower1: [7, 53], tower2: [7, 53], tower3: [7, 53], tower4: [7, 53], shirube1: [70, 40], shirube2: [70, 40], shirube3: [70, 40] }[Field.map.id];
  if (!back) { await say('しかし なにも おこらなかった。'); return; }
  Msg.close();
  Sound.sfx('warp');
  await fadeOut(20, '#fff');
  Field.load('world', back[0], back[1], 'down');
  await fadeIn(20);
}

/* ----- equipment screen ----- */
async function equipScreen(m) {
  let preview = null;
  const info = pushInfo(() => {
    drawWindow(8, 8, 240, 70, COL.white, m.name + ' の そうび');
    EQUIP_SLOTS.forEach((sl, i) => {
      const x = 16 + (i % 2) * 118, y = 20 + Math.floor(i / 2) * 26;
      drawText(SLOT_NAMES[sl], x, y, COL.gray);
      drawText(m.eq[sl] ? ITEMS[m.eq[sl]].name : '（なし）', x + 6, y + 12, m.eq[sl] ? COL.white : COL.dim);
    });
    drawWindow(8, 176, 240, 56);
    const atk = Game.atk(m), def = Game.def(m);
    drawText('こうげき力', 20, 188); drawText(String(atk), 120, 188, COL.white, 12, 'right');
    drawText('しゅび力', 20, 206); drawText(String(def), 120, 206, COL.white, 12, 'right');
    if (preview) {
      const col = (a, b) => (b > a ? COL.green : b < a ? COL.red : COL.white);
      drawText('→ ' + preview.atk, 132, 188, col(atk, preview.atk));
      drawText('→ ' + preview.def, 132, 206, col(def, preview.def));
    }
  });
  try {
    let si = 0;
    for (;;) {
      preview = null;
      const slotItems = EQUIP_SLOTS.map(sl => ({ label: SLOT_NAMES[sl], right: m.eq[sl] ? '' : '' }));
      const sm = new Menu({ items: slotItems, x: 8, y: 84, w: 90, index: si });
      const r = await sm.choose();
      sm.close();
      if (r < 0) break;
      si = r;
      const slot = EQUIP_SLOTS[r];
      const cands = Game.bagList(it => it.kind === slot && it.equip && it.equip.includes(m.job));
      const opts = cands.map(id => ({ label: ITEMS[id].name, right: '×' + Game.count(id) }));
      opts.push({ label: 'はずす', color: COL.gray });
      const calc = i => {
        const save = m.eq[slot];
        m.eq[slot] = i < cands.length ? cands[i] : null;
        preview = { atk: Game.atk(m), def: Game.def(m) };
        m.eq[slot] = save;
      };
      const im = new Menu({ items: opts, x: 100, y: 84, w: 148, rows: Math.min(6, opts.length), onChange: i => calc(i) });
      const k = await im.choose();
      im.close();
      if (k < 0) continue;
      if (k < cands.length) { Game.equip(m, cands[k]); Sound.sfx('equip'); }
      else { if (m.eq[slot]) { Game.unequip(m, slot); Sound.sfx('cancel'); } }
    }
  } finally { Scenes.remove(info); }
}

/* ----- status screen ----- */
function statusScreen(index) {
  return new Promise(res => {
    const sc = {
      i: index,
      update() {
        if (Input.repeat('left') || Input.repeat('up')) { this.i = (this.i + Game.party.length - 1) % Game.party.length; Sound.sfx('cursor'); }
        if (Input.repeat('right') || Input.repeat('down')) { this.i = (this.i + 1) % Game.party.length; Sound.sfx('cursor'); }
        if (Input.pressed('a') || Input.pressed('b')) { Sound.sfx('cancel'); Scenes.remove(this); res(); }
      },
      render() {
        const m = Game.party[this.i];
        fillRect(0, 0, SW, SH, 'rgba(0,0,0,0.6)');
        drawWindow(4, 4, 248, 232, COL.white);
        const J = JOBS[m.job];
        drawText(m.name, 16, 14, COL.yellow);
        drawText(J.name + '　' + (m.gender === 'f' ? 'おんな' : 'おとこ'), 80, 14);
        drawText('せいかく：' + ((PERSONALITIES[m.pers] || {}).name || '？'), 16, 30, COL.gray);
        drawText('レベル', 16, 48); drawText(String(m.level), 110, 48, COL.white, 12, 'right');
        drawText('HP', 16, 63); drawText(`${m.hp}/${m.mhp}`, 110, 63, COL.white, 12, 'right');
        drawText('MP', 16, 78); drawText(`${m.mp}/${m.mmp}`, 110, 78, COL.white, 12, 'right');
        const st = [['ちから', m.str], ['すばやさ', m.agi], ['たいりょく', m.vit], ['かしこさ', m.int], ['うんのよさ', m.luck], ['こうげき力', Game.atk(m)], ['しゅび力', Game.def(m)]];
        st.forEach(([n, v], k) => { drawText(n, 130, 48 + k * 15); drawText(String(v), 240, 48 + k * 15, COL.white, 12, 'right'); });
        drawText('けいけんち', 16, 96); drawText(String(m.exp), 110, 96, COL.white, 12, 'right');
        drawText('つぎまで', 16, 111); drawText(String(Math.max(0, Game.nextExp(m) - m.exp)), 110, 111, COL.white, 12, 'right');
        fillRect(14, 156, 228, 1, COL.dim);
        EQUIP_SLOTS.forEach((sl, k) => { drawText('E', 16, 162 + k * 15, COL.yellow); drawText(m.eq[sl] ? ITEMS[m.eq[sl]].name : '―', 30, 162 + k * 15, m.eq[sl] ? COL.white : COL.dim); });
        const sp = Game.spellsOf(m).map(id => SPELLS[id].name);
        drawText('じゅもん', 140, 162, COL.gray);
        sp.slice(0, 8).forEach((n, k) => drawText(n, 140 + (k % 2) * 52, 177 + Math.floor(k / 2) * 14, COL.white));
        if (!sp.length) drawText('―', 140, 177, COL.dim);
        if (m.status.poison) drawText('どく', 200, 14, '#c080f0');
        if (m.hp <= 0) drawText('しに', 200, 14, COL.red);
        if (Game.party.length > 1) drawText('◀ ▶', 214, 30, COL.gray);
      },
    };
    Scenes.push(sc);
  });
}

/* ----- save slot chooser ----- */
async function chooseSaveSlot(prompt, forLoad = false) {
  await say(prompt, { wait: false, instant: true });
  const sums = [];
  for (let s = 1; s <= 3; s++) {
    const d = await Game.readSlot(s);
    sums.push(d ? Game.summary(d) : null);
  }
  const items = sums.map((sm, i) => ({
    label: 'ぼうけんのしょ' + (i + 1) + (sm ? '：' + sm.name + ' Lv' + sm.level : '：' + '―'),
    disabled: forLoad && !sm,
  }));
  const r = await choose(items, { x: 16, y: 40, w: 224 });
  Msg.close();
  if (r < 0) return null;
  if (!forLoad && sums[r]) {
    await say('ぼうけんのしょ' + (r + 1) + 'に うわがき しますか？', { wait: false, instant: true });
    const ok = await choose(['はい', 'いいえ']);
    Msg.close();
    if (ok !== 0) return null;
  }
  return r + 1;
}

/* ----- world map overview ----- */
function showWorldMap() {
  return new Promise(res => {
    const def = MAPDEFS.world;
    const W = def.rows[0].length, H = def.rows.length;
    const cv = makeCanvas(W * 2, H * 2);
    const g = cv.getContext('2d');
    const col = { '~': '#2858c8', '.': '#58b848', T: '#2c8c3c', h: '#80c058', M: '#a07850', d: '#e0c880', p: '#6c5a90', '|': '#b87838', '=': '#b87838' };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { g.fillStyle = col[def.rows[y][x]] || '#58b848'; g.fillRect(x * 2, y * 2, 2, 2); }
    const marks = [['C', 'ソレイア'], ['V', 'ノルデ'], ['W', 'ささやきの塔'], ['1', 'みさきの洞窟'], ['2', 'しるべの洞窟'], ['S', 'ほこら']];
    const pos = {};
    def.rows.forEach((r, y) => [...r].forEach((ch, x) => { if (marks.some(m => m[0] === ch)) pos[ch] = [x, y]; }));
    const sc = {
      t: 0,
      update() { this.t++; if (Input.pressed('a') || Input.pressed('b')) { Sound.sfx('cancel'); Scenes.remove(this); res(); } },
      render() {
        fillRect(0, 0, SW, SH, '#101828');
        const ox = Math.floor((SW - W * 2) / 2), oy = 30;
        drawWindow(ox - 8, oy - 8, W * 2 + 16, H * 2 + 16, '#d8c8a0');
        ctx.drawImage(cv, ox, oy);
        drawText('ソレイア島', SW / 2, 6, COL.yellow, 12, 'center');
        for (const [ch, name] of marks) {
          const p = pos[ch]; if (!p) continue;
          fillRect(ox + p[0] * 2 - 1, oy + p[1] * 2 - 1, 4, 4, '#181018');
          fillRect(ox + p[0] * 2, oy + p[1] * 2, 2, 2, COL.white);
          drawText(name, ox + p[0] * 2 + 4, oy + p[1] * 2 - 5, COL.white, 8);
        }
        let px = null;
        if (Field.map.def.world) px = [Field.p.x, Field.p.y];
        else if (Game.s.lastWorld) px = [Game.s.lastWorld.x, Game.s.lastWorld.y];
        if (px && (this.t >> 4) % 2 === 0) { fillRect(ox + px[0] * 2 - 2, oy + px[1] * 2 - 2, 6, 6, '#f03030'); fillRect(ox + px[0] * 2 - 1, oy + px[1] * 2 - 1, 4, 4, '#ffd040'); }
        drawText('A/B：とじる', SW / 2, SH - 18, COL.gray, 12, 'center');
      },
    };
    Scenes.push(sc);
  });
}

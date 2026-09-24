// だいほん（イベント）を すすめる しくみ
import { SCRIPTS, STORY_STEPS, STORY_SCRIPTS } from '../data/story.js';
import { ITEMS } from '../data/items.js';
import { addItem, removeItem, itemCount, hasKeyItem, fullHeal } from '../stats.js';
import { startFixedBattle } from './battles.js';
import { partyOf, guestChar, partyState } from './party.js';
import { openService } from './services.js';

let runSeq = 1;

// だいほんに わたす じょうほう
export function scriptCtx(s) {
  const c = s.char;
  return {
    c,
    name: c.name,
    flag: (f) => !!c.flags[f],
    has: (id) => hasKeyItem(c, id) || itemCount(c, id) > 0,
    count: (id) => itemCount(c, id),
    kills: (sp) => c.kills?.[sp] || 0,
    quest: (k) => c.quests?.[k],
  };
}

export function setStoryFlag(c, f) {
  c.flags[f] = true;
  const i = STORY_STEPS.indexOf(f);
  if (i > 0) for (let j = 0; j < i; j++) c.flags[STORY_STEPS[j]] = true;
}

export class ScriptRun {
  constructor(world, initiator, participants, steps, meta = {}) {
    this.id = 'r' + (runSeq++);
    this.world = world;
    this.init = initiator;
    this.parts = participants;
    this.steps = steps;
    this.meta = meta;
    this.batch = [];
    this.waiting = null;
    this.aborted = false;
  }

  get everyone() { return this.parts.filter((m) => this.world.sessions.has(m.id)); }

  async start() {
    for (const m of this.everyone) {
      m.busy = 'script';
      m.runId = this.id;
    }
    this.world.runs.set(this.id, this);
    try {
      await this.runSteps(this.steps);
      await this.flush();
    } catch (e) {
      if (!this.aborted) console.error('script error', e);
    }
    this.finish();
  }

  finish() {
    this.world.runs.delete(this.id);
    for (const m of this.everyone) {
      if (m.runId === this.id) {
        m.runId = null;
        if (m.busy === 'script') m.busy = null;
        this.world.send(m, { t: 'scriptEnd', runId: this.id });
        this.world.sendSelf(m);
      }
    }
    this.world.markDirty();
  }

  abort() {
    this.aborted = true;
    if (this.waiting) {
      const w = this.waiting;
      this.waiting = null;
      w.resolve({ aborted: true });
    }
  }

  // うけとった へんじ
  ack(s, msg) {
    if (!this.waiting) return;
    if (s.id !== this.init.id) return;
    const w = this.waiting;
    this.waiting = null;
    w.resolve(msg);
  }

  flush() {
    if (!this.batch.length) return Promise.resolve({});
    const steps = this.batch;
    this.batch = [];
    this.lastSteps = steps;
    for (const m of this.everyone) {
      this.world.send(m, { t: 'script', runId: this.id, steps, spectator: m.id !== this.init.id, who: this.init.char.name });
    }
    if (!this.world.sessions.has(this.init.id)) return Promise.resolve({ aborted: true });
    return new Promise((resolve) => { this.waiting = { resolve }; });
  }

  // つなぎなおした 人に、いま まっている ところを もういちど おくる
  resend(m) {
    if (!this.waiting || !this.lastSteps) return;
    this.world.send(m, { t: 'script', runId: this.id, steps: this.lastSteps, spectator: m.id !== this.init.id, who: this.init.char.name });
  }

  say(text) {
    this.batch.push(['say', null, text]);
  }

  who() {
    return this.everyone.length > 1 ? `${this.init.char.name}たち` : this.init.char.name;
  }

  async runSteps(steps) {
    const w = this.world;
    for (const step of steps) {
      if (this.aborted) return;
      const [op, ...a] = step;
      const all = this.everyone;
      switch (op) {
        case 'if': {
          const ok = a[0](scriptCtx(this.init));
          await this.runSteps(ok ? a[1] || [] : a[2] || []);
          break;
        }
        case 'choice': {
          this.batch.push(['choice', a[0], a[1]]);
          const r = await this.flush();
          if (r.aborted) return this.abort();
          const idx = Math.max(0, Math.min(a[1].length - 1, Number(r.choice) || 0));
          await this.runSteps(a[2][idx] || []);
          break;
        }
        case 'flag':
          for (const m of all) setStoryFlag(m.char, a[0]);
          break;
        case 'questBase':
          for (const m of all) {
            m.char.quests = m.char.quests || {};
            m.char.quests[a[0]] = m.char.kills?.[a[1]] || 0;
          }
          break;
        case 'item': {
          const [id, n = 1] = a;
          for (const m of all) addItem(m.char, id, n);
          const name = ITEMS[id]?.name || id;
          this.batch.push(['sfx', ITEMS[id]?.type === 'key' ? 'key' : 'item']);
          this.say(`${this.who()}は ${name}${n > 1 ? `を ${n}こ` : 'を'} てにいれた！`);
          break;
        }
        case 'takeItem': {
          const [id, n = 1] = a;
          for (const m of all) {
            if (ITEMS[id]?.type === 'key') m.char.keyItems = m.char.keyItems.filter((k) => k !== id);
            else removeItem(m.char, id, n);
          }
          break;
        }
        case 'gold':
          for (const m of all) m.char.gold += a[0];
          this.batch.push(['sfx', 'item']);
          this.say(`${this.who()}は ${a[0]}ゴールドを てにいれた！`);
          break;
        case 'objective':
          for (const m of all) m.char.objective = a[0];
          this.batch.push(['objective', a[0]]);
          break;
        case 'heal': {
          for (const m of all) fullHeal(m.char);
          const p = partyOf(w, this.init);
          for (const sup of p?.supports || []) fullHeal(sup.char);
          for (const g of p?.guests || []) fullHeal(g.char);
          for (const m of all) w.sendSelf(m);
          if (p) w.sendParty(p);
          break;
        }
        case 'inn': {
          const price = a[0] || 0;
          const c = this.init.char;
          if (c.gold < price) {
            this.say('ゴールドが たりないようだね…');
            break;
          }
          c.gold -= price;
          for (const m of all) fullHeal(m.char);
          const p = partyOf(w, this.init);
          for (const sup of p?.supports || []) fullHeal(sup.char);
          for (const g of p?.guests || []) fullHeal(g.char);
          this.batch.push(['fade', 'out'], ['bgm', 'inn'], ['wait', 2200], ['bgm', 'resume'], ['fade', 'in']);
          this.say(price ? 'おはようございます。ゆうべは よく ねむれましたか？' : '{name}は ぐっすり ねむった。');
          this.say('HPと MPが すっかり かいふくした！');
          for (const m of all) w.sendSelf(m);
          if (p) w.sendParty(p);
          break;
        }
        case 'guest': {
          const p = partyOf(w, this.init);
          if (!p) break;
          if (a[0]) {
            if (!p.guests.some((g) => g.id === a[0])) {
              p.guests.push({ id: a[0], char: guestChar(w, a[0], this.init.char.level) });
            }
          } else {
            p.guests = [];
            this.batch.push(['sfx', 'leave']);
            this.say('ルカは パーティーから はなれた。');
          }
          w.sendParty(p);
          break;
        }
        case 'battle': {
          const r = await this.flush();
          if (r.aborted) return this.abort();
          const res = await startFixedBattle(w, this.init, this.everyone, a[0]);
          if (res !== 'win') return this.abort();
          break;
        }
        case 'teleport': {
          const [map, x, y, dir] = a;
          const offs = [[0, 0], [-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1]];
          all.forEach((m, i) => {
            const [ox, oy] = offs[i % offs.length];
            w.placeSession(m, map, x + ox, y + oy, dir || m.dir, false);
          });
          // それぞれの いちを つたえる
          this.batch.push(['teleport', map, x, y, dir || 'down', all.map((m, i) => [m.id, x + offs[i % offs.length][0], y + offs[i % offs.length][1], m.posSeq])]);
          break;
        }
        case 'spawn': {
          const [map, x, y] = a;
          for (const m of all) m.char.spawn = { map, x, y };
          break;
        }
        case 'shop': case 'jobChange': case 'tavern': case 'board': case 'starTrade': case 'church': {
          const r = await this.flush();
          if (r.aborted) return this.abort();
          const ui = openService(w, this.init, op, a[0]);
          if (!ui) break;
          this.batch.push(['ui', op, ui]);
          const r2 = await this.flush();
          if (r2.aborted) return this.abort();
          break;
        }
        case 'say':
        case 'fade': case 'flash': case 'shake': case 'night': case 'bgm': case 'sfx': case 'wait':
        case 'actor': case 'move': case 'face': case 'remove': case 'chapter': case 'guestHide': case 'chestOpen': case 'hideNpc':
          this.batch.push(step);
          break;
        default:
          console.warn('unknown step', op);
      }
    }
  }
}

// NPCや ばしょから だいほんを はじめる
export function runScript(world, s, scriptId, opts = {}) {
  const fn = SCRIPTS[scriptId];
  if (!fn) return false;
  const steps = fn(scriptCtx(s));
  if (!steps || !steps.length) return false;
  let participants = [s];
  if (STORY_SCRIPTS.has(scriptId) || opts.story) {
    const p = partyOf(world, s);
    for (const sid of p?.members || []) {
      if (sid === s.id) continue;
      const m = world.sessions.get(sid);
      if (m && m.inWorld && m.map === s.map && !m.busy && !m.away) participants.push(m);
    }
  }
  const run = new ScriptRun(world, s, participants, steps, { scriptId });
  run.start();
  return true;
}

export function runSteps(world, s, steps) {
  const run = new ScriptRun(world, s, [s], steps, {});
  run.start();
  return run;
}

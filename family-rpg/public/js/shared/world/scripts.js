// だいほん（イベント）を すすめる しくみ
import { SCRIPTS, STORY_STEPS, STORY_SCRIPTS } from '../data/story.js';
import { ITEMS } from '../data/items.js';
import { addItem, removeItem, itemCount, hasKeyItem, fullHeal } from '../stats.js';
import { startFixedBattle } from './battles.js';
import { partyOf, syncParty, ensureCompanions, recruitNpc, addMonsterCompanion } from './party.js';
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

// ものがたりの すすみぐあい（STORY_STEPS の なんばんめまで おわったか。まだなら -1）
export function storyIndex(c) {
  let idx = -1;
  STORY_STEPS.forEach((f, i) => {
    if (c?.flags?.[f]) idx = i;
  });
  return idx;
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

  // イベントを すすめている 人（リーダー）より 先に すすんでいる なかま
  // … もくひょう・ゲスト・いのりの場所・だいじな もの は その人の ものを のこす
  ahead(m) {
    return m !== this.init && storyIndex(m.char) > storyIndex(this.init.char);
  }

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

  say(text, who = null) {
    this.batch.push(['say', who, text]);
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
          this.say(`${this.who()}は${name}${n > 1 ? `を${n}個` : 'を'}手に入れた！`);
          break;
        }
        case 'takeItem': {
          const [id, n = 1] = a;
          for (const m of all) {
            if (this.ahead(m)) continue;
            if (ITEMS[id]?.type === 'key') m.char.keyItems = m.char.keyItems.filter((k) => k !== id);
            else removeItem(m.char, id, n);
          }
          break;
        }
        case 'gold':
          for (const m of all) m.char.gold += a[0];
          this.batch.push(['sfx', 'item']);
          this.say(`${this.who()}は${a[0]}ゴールドを手に入れた！`);
          break;
        case 'objective':
          for (const m of all) if (!this.ahead(m)) m.char.objective = a[0];
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
          // ['inn', ねだん, 宿屋の人]（ねだん 0 は 家の ベッド）
          const price = a[0] || 0;
          const keeper = a[1] || null;
          const c = this.init.char;
          if (c.gold < price) {
            this.say('おや？ゴールドが足りないようですね。', keeper);
            break;
          }
          c.gold -= price;
          for (const m of all) fullHeal(m.char);
          const p = partyOf(w, this.init);
          for (const sup of p?.supports || []) fullHeal(sup.char);
          for (const g of p?.guests || []) fullHeal(g.char);
          if (price) this.say('では、ごゆっくりお休みください。', keeper);
          this.batch.push(['fade', 'out'], ['bgm', 'inn'], ['wait', 2200], ['bgm', 'resume'], ['fade', 'in']);
          if (price) {
            this.say('おはようございます。\nゆうべは、よくねむれましたか？', keeper);
            this.say('HPとMPがすっかり回復した！');
            this.say('では、いってらっしゃいませ。', keeper);
          } else {
            this.say('{name}はぐっすりねむった。');
            this.say('HPとMPがすっかり回復した！');
          }
          for (const m of all) w.sendSelf(m);
          if (p) w.sendParty(p);
          // 宿屋で ねたら すぐ セーブ（ドラクエと おなじ 安心感）
          w.markDirty();
          w.saveNow({ urgent: true });
          break;
        }
        case 'guest': {
          // ゲストは セーブデータに のこす（アプリを おとしても いなくならない）
          for (const m of all) {
            if (this.ahead(m)) continue;
            ensureCompanions(m.char);
            if (a[0]) {
              if (!m.char.guests.includes(a[0])) m.char.guests.push(a[0]);
            } else m.char.guests = [];
          }
          if (!a[0]) {
            this.batch.push(['sfx', 'leave']);
            this.say('ルカはパーティーからはなれた。');
          }
          const p = partyOf(w, this.init);
          if (p) {
            syncParty(w, p);
            w.sendParty(p);
          }
          w.markDirty();
          break;
        }
        case 'recruit': {
          // ものがたりで なかまに なる（パーティーが いっぱいなら 酒場で まつ）
          for (const m of all) {
            if (this.ahead(m)) continue;
            const r = recruitNpc(w, m, a[0], { force: true });
            if (!r.ok) continue;
            if (m === this.init) {
              this.batch.push(['sfx', 'join']);
              this.say(r.joined ? `${r.name}が仲間に加わった！` : `${r.name}が仲間になった！\n（今はルミナの町の酒場で待っている）`);
            }
          }
          break;
        }
        case 'befriend': {
          // たおした まものが なかまに なる（a[1]: 酒場へ もどる なかま / false: ことわった）
          const s = this.init;
          const off = s.befriendOffer;
          if (!off || off.id !== a[0]) break;
          s.befriendOffer = null;
          if (a[1] === false) break;
          const r = addMonsterCompanion(w, s, off.species, off.level, a[1]);
          if (!r.ok) {
            this.say(r.reason);
            break;
          }
          this.batch.push(['sfx', 'join']);
          if (r.joined) this.say(`${r.name}が仲間に加わった！`);
          else this.say(`${r.name}が仲間になった！\n${r.name}はルミナの町の酒場で待っている。`);
          if (r.benchedName) this.say(`${r.benchedName}は酒場へもどった。`);
          this.say(`（名前は酒場で変えられるよ）`);
          w.sendSelf(s);
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
          for (const m of all) if (!this.ahead(m)) m.char.spawn = { map, x, y };
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
        case 'actor': case 'move': case 'face': case 'remove': case 'chapter': case 'guestHide': case 'chestOpen': case 'hideNpc': case 'showMon': case 'crest':
          this.batch.push(step);
          break;
        default:
          console.warn('unknown step', op);
      }
    }
  }
}

// NPCや ばしょから だいほんを はじめる
// ストーリーを いっしょに すすめられる くらい 近いか
const STORY_NEAR = 16;

export function runScript(world, s, scriptId, opts = {}) {
  const fn = SCRIPTS[scriptId];
  if (!fn) return false;
  const story = STORY_SCRIPTS.has(scriptId) || opts.story;
  const p = story ? partyOf(world, s) : null;
  // パーティーでは、リーダー（さそった 人）の ストーリーを みんなで すすめる
  let init = s;
  if (p && p.leader !== s.id) {
    const leader = world.sessions.get(p.leader);
    if (leader?.inWorld) {
      const near = leader.map === s.map && !leader.busy && !leader.away && Math.hypot(leader.x - s.x, leader.y - s.y) <= STORY_NEAR;
      if (!near) {
        const now = world.now();
        if (!(s.storyHintAt > now - 8000)) {
          s.storyHintAt = now;
          world.send(s, { t: 'toast', text: `ストーリーは、リーダーの${leader.char.name}といっしょに進めよう` });
        }
        return false;
      }
      init = leader;
    }
  }
  const steps = fn(scriptCtx(init));
  if (!steps || !steps.length) return false;
  const participants = [init];
  if (init !== s && !s.busy) participants.push(s);
  if (story) {
    for (const sid of p?.members || []) {
      const m = world.sessions.get(sid);
      if (m && !participants.includes(m) && m.inWorld && m.map === init.map && !m.busy && !m.away) participants.push(m);
    }
  }
  const run = new ScriptRun(world, init, participants, steps, { scriptId });
  run.start();
  return true;
}

export function runSteps(world, s, steps) {
  const run = new ScriptRun(world, s, [s], steps, {});
  run.start();
  return run;
}

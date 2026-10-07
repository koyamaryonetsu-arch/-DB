// だいほん（イベント）を すすめる しくみ
import { SCRIPTS, STORY_STEPS, STORY_SCRIPTS } from '../data/story.js?v=92b7832d9909';
import { ITEMS } from '../data/items.js?v=92b7832d9909';
import { addItem, removeItem, itemCount, hasKeyItem, fullHeal } from '../stats.js?v=92b7832d9909';
import { startFixedBattle } from './battles.js?v=92b7832d9909';
import { FIXED_ENCOUNTERS } from '../data/encounters.js?v=92b7832d9909';
import { partyOf, syncParty, ensureCompanions, recruitNpc, addMonsterCompanion, befriendLevel } from './party.js?v=92b7832d9909';
import { openService } from './services.js?v=92b7832d9909';
import { isNightFor, advanceClock, fracFor } from './clock.js?v=92b7832d9909';
import { grantWagon, wagonChars } from './wagon.js?v=92b7832d9909';
import { GUESTS } from '../data/shops.js?v=92b7832d9909';
import { unstickAll } from './hazards.js?v=92b7832d9909';
import { MAPS, isBlocked } from '../maps/index.js?v=92b7832d9909';

let runSeq = 1;

// だいほんに わたす じょうほう
//  s … 話しかけた 人 / owner … その 世界の もちぬし（さそわれて 手伝っている ときは リーダー）
//  ものがたりの すすみぐあい（フラグ・大事な物・たのまれごと）は owner、ふつうの 道具は 話しかけた 人
//  night … 夜か（パーティーの 時計。world/clock.js）/ helper … さそわれて 手伝っている 人
//  clock … 1日の わりあい（パーティーの 時計。0 が 朝6時。第4章の 日時計の とびら。ない ときは null）
export function scriptCtx(s, owner = s, world = null) {
  const c = s.char;
  const o = owner.char;
  return {
    c,
    name: c.name,
    night: world ? isNightFor(world, owner) : false,
    clock: world ? fracFor(world, owner) : null,
    helper: s !== owner,
    flag: (f) => !!o.flags[f],
    has: (id) => hasKeyItem(o, id) || (ITEMS[id]?.type !== 'key' && itemCount(c, id) > 0),
    count: (id) => (ITEMS[id]?.type === 'key' ? (hasKeyItem(o, id) ? 1 : 0) : itemCount(c, id)),
    kills: (sp) => o.kills?.[sp] || 0,
    quest: (k) => o.quests?.[k],
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
    // ものがたりが すすむ 人（ふつうは はじめた 人。さそわれて 手伝っている 人が はじめた ときは リーダー）
    this.owner = meta.owner || initiator;
    this.parts = participants;
    this.steps = steps;
    this.meta = meta;
    this.batch = [];
    this.waiting = null;
    this.aborted = false;
  }

  get everyone() { return this.parts.filter((m) => this.world.sessions.has(m.id)); }

  // パーティーの イベントは リーダー（さそった 人）の ものがたり（this.owner）。
  // さそわれて 来ている なかまの ものがたり（フラグ・目標・大事な物・ゲスト・いのりの場所）は かえない。
  // ごほうび（ゴールド・ふつうの 道具・たたかいの 経験値）は みんなで もらえる

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
    // おわりの かたづけで エラーが おきても、うごけなく ならない ように する
    // （ここで エラーが 出ると、Promise の エラーで 家族サーバーが 止まる おそれが あった）
    try {
      this.finish();
    } catch (e) {
      console.error('script finish error', e);
      this.world.runs.delete(this.id);
      for (const m of this.parts) {
        if (m.runId !== this.id) continue;
        m.runId = null;
        if (m.busy === 'script') m.busy = null;
      }
    }
  }

  finish() {
    this.world.runs.delete(this.id);
    // リーダーの ものがたりが すすんだら、なかまの 画面の 世界（人・橋 など）も あわせる
    const p = partyOf(this.world, this.owner);
    if (p && p.members.length > 1) this.world.sendParty(p);
    for (const m of this.everyone) {
      if (m.runId === this.id) {
        m.runId = null;
        if (m.busy === 'script') m.busy = null;
        this.world.send(m, { t: 'scriptEnd', runId: this.id });
        this.world.sendSelf(m);
      }
    }
    // 手伝いの 人が リーダーの 世界を かえた（レバー など）: リーダーの 画面も あわせる
    if (this.owner !== this.init && !this.everyone.includes(this.owner) && this.world.sessions.has(this.owner.id)) this.world.sendSelf(this.owner);
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

  // パーティーの いま（だいほんの 'call' から つかう。第3章の きずなの間）
  //  people: いっしょに いる 人（セッション）/ helpers: サポート・ゲスト・馬車の なかまの キャラ
  partyNow() {
    const w = this.world;
    const p = partyOf(w, this.init);
    const people = (p ? p.members : [this.init.id]).map((id) => w.sessions.get(id)).filter(Boolean);
    const helpers = p ? [...p.supports.map((x) => x.char), ...p.guests.map((g) => g.char), ...wagonChars(w, p)].filter(Boolean) : [];
    return { people, helpers };
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
          const ok = a[0](scriptCtx(this.init, this.owner, w));
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
          setStoryFlag(this.owner.char, a[0]);
          break;
        case 'unflag':
          // フラグを もどす（しかけの やりなおし など。ものがたりの すすみぐあいの フラグには つかわない）
          delete this.owner.char.flags[a[0]];
          break;
        case 'toggle': {
          // レバー: フラグを 入れかえる。かわった マスに 立っている 人は となりへ よける（world/hazards.js）
          const c = this.owner.char;
          if (c.flags[a[0]]) delete c.flags[a[0]];
          else c.flags[a[0]] = true;
          unstickAll(w, this.owner);
          break;
        }
        case 'sync': {
          // ここまでの えんしゅつを 見せてから、フラグの かわった 世界（とびら・橋）を 画面に 出す
          const r = await this.flush();
          if (r.aborted) return this.abort();
          for (const m of this.everyone) w.sendSelf(m);
          if (!this.everyone.includes(this.owner)) w.sendSelf(this.owner);
          const p = partyOf(w, this.owner);
          if (p && p.members.length > 1) w.sendParty(p);
          break;
        }
        case 'questBase': {
          const c = this.owner.char;
          c.quests = c.quests || {};
          c.quests[a[0]] = c.kills?.[a[1]] || 0;
          break;
        }
        case 'item': {
          const [id, n = 1] = a;
          // 大事な物は ものがたりの もちぬし（リーダー）だけ（なかまの ものがたりは かえない）
          const key = ITEMS[id]?.type === 'key';
          if (key) addItem(this.owner.char, id, n);
          else for (const m of all) addItem(m.char, id, n);
          const name = ITEMS[id]?.name || id;
          this.batch.push(['sfx', key ? 'key' : 'item']);
          this.say(`${key ? this.owner.char.name : this.who()}は${name}${n > 1 ? `を${n}個` : 'を'}手に入れた！`);
          break;
        }
        case 'takeItem': {
          // 大事な物は もちぬしから、ふつうの 道具は 話しかけた 人から
          const [id, n = 1] = a;
          if (ITEMS[id]?.type === 'key') this.owner.char.keyItems = this.owner.char.keyItems.filter((k) => k !== id);
          else removeItem(this.init.char, id, n);
          break;
        }
        case 'gold':
          for (const m of all) m.char.gold += a[0];
          this.batch.push(['sfx', 'item']);
          this.say(`${this.who()}は${a[0]}ゴールドを手に入れた！`);
          break;
        case 'objective': {
          this.owner.char.objective = a[0];
          this.batch.push(['objective', a[0]]);
          // なかまの 画面にも リーダーの 目標を 出す
          const p = partyOf(w, this.owner);
          if (p && p.members.length > 1) w.sendParty(p);
          break;
        }
        case 'heal': {
          // ['heal', { mp: 0.3 }] … HPは ぜんぶ、MPは さいだいの 3わり だけ ふえる（大臣ザイードの あとの 月の光）
          const [opt] = a;
          const heal = (ch) => {
            const mp = ch.mp;
            fullHeal(ch);
            if (opt?.mp !== undefined && Number.isFinite(mp)) ch.mp = Math.min(ch.mp, mp + Math.round(ch.mp * opt.mp));
          };
          for (const m of all) heal(m.char);
          const p = partyOf(w, this.init);
          for (const sup of p?.supports || []) heal(sup.char);
          for (const g of p?.guests || []) heal(g.char);
          for (const ch of wagonChars(w, p)) heal(ch);
          for (const m of all) w.sendSelf(m);
          if (p) w.sendParty(p);
          break;
        }
        case 'inn': {
          // ['inn', ねだん, 宿屋の人, 'morning'|'night'|'noon']（ねだん 0 は 家の ベッド。宿屋は ふつう 朝まで。昼までは 王都サファラの 宿屋）
          const price = a[0] || 0;
          const keeper = a[1] || null;
          const until = a[2] || (price ? 'morning' : null);
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
          for (const ch of wagonChars(w, p)) fullHeal(ch);
          if (price) this.say('では、ごゆっくりお休みください。', keeper);
          this.batch.push(['fade', 'out'], ['bgm', 'inn'], ['wait', 2200]);
          // 時間を すすめる（パーティーの 時計。さそわれて 手伝っている 人は かえない）
          if (until && this.owner === this.init) this.batch.push(['clock', advanceClock(w, this.init, until)]);
          this.batch.push(['bgm', 'resume'], ['fade', 'in']);
          if (price && until === 'night') {
            this.say('こんばんは。\nよくお休みになれましたか？', keeper);
            this.say('HPとMPがすっかり回復した！');
            this.say('外はもう夜です。夜は魔物が強くなりますから、お気を付けて。', keeper);
          } else if (price && until === 'noon') {
            this.say('おはようございます…と言っても、\nもうすぐお昼ですよ。ずいぶん、よくおねむりでしたね。', keeper);
            this.say('HPとMPがすっかり回復した！');
            this.say('日が高くなってきました。では、いってらっしゃいませ。', keeper);
          } else if (price) {
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
        case 'guest': case 'unguest': {
          // ゲストは セーブデータに のこす（アプリを おとしても いなくならない）。リーダーだけ
          // ['guest', id] くわわる / ['guest', null] みんな はなれる / ['unguest', id] その 人だけ はなれる
          const gc = this.owner.char;
          ensureCompanions(gc);
          const before = gc.guests.slice();
          if (op === 'guest' && a[0]) {
            if (!gc.guests.includes(a[0])) gc.guests.push(a[0]);
          } else if (op === 'unguest') gc.guests = gc.guests.filter((g) => g !== a[0]);
          else gc.guests = [];
          const left = before.filter((g) => !gc.guests.includes(g));
          if (left.length) {
            this.batch.push(['sfx', 'leave']);
            this.say(`${left.map((g) => GUESTS[g]?.name || g).join('と')}はパーティーからはなれた。`);
          }
          const p = partyOf(w, this.owner);
          if (p) {
            syncParty(w, p);
            w.sendParty(p);
          }
          w.markDirty();
          break;
        }
        case 'recruit': {
          // ものがたりで なかまに なる（パーティーが いっぱいなら 酒場で まつ）。リーダーだけ
          const r = recruitNpc(w, this.owner, a[0], { force: true });
          if (r.ok) {
            this.batch.push(['sfx', 'join']);
            this.say(r.joined ? `${r.name}が仲間に加わった！${r.where === 'wagon' ? `\n${r.name}は馬車に乗りこんだ。` : ''}` : `${r.name}が仲間になった！\n（今はルミナの町の酒場で待っている）`);
          }
          break;
        }
        case 'wagon': {
          // 馬車を もらう（話しかけた 人の もの。data/wagon.js）
          grantWagon(this.init.char);
          const p = partyOf(w, this.init);
          if (p) w.sendParty(p);
          w.sendSelf(this.init);
          w.markDirty();
          break;
        }
        case 'befriend': {
          // たおした まものが なかまに なる（a[1]: 酒場へ もどる なかま / false: ことわった）
          const s = this.init;
          const off = s.befriendOffer;
          if (!off || off.id !== a[0]) break;
          s.befriendOffer = null;
          if (a[1] === false) break;
          // たたかいで なかまに なった まものは いつも レベル1（party.js の befriendLevel）
          const r = addMonsterCompanion(w, s, off.species, befriendLevel(), a[1]);
          if (!r.ok) {
            this.say(r.reason);
            break;
          }
          this.batch.push(['sfx', 'join']);
          if (r.where === 'wagon') {
            // パーティーが いっぱいで 馬車が あいていた（洞窟の 中では 馬車は 入り口で 待っている）
            this.say(MAPS[s.map]?.kind === 'field' ? `${r.name}が仲間に加わった！\n${r.name}は馬車に乗りこんだ！` : `${r.name}が仲間に加わった！\n${r.name}は入り口で待つ馬車へ向かった！`);
          } else if (r.joined) this.say(`${r.name}が仲間に加わった！`);
          else this.say(`${r.name}が仲間になった！\n${r.name}はルミナの町の酒場で待っている。`);
          if (r.benchedName) this.say(`${r.benchedName}は酒場へもどった。${r.stowed?.length ? '\n（装備はふくろにしまった）' : ''}`);
          this.say(`（名前は酒場で変えられるよ）`);
          w.sendSelf(s);
          break;
        }
        case 'battle': {
          const r = await this.flush();
          if (r.aborted) return this.abort();
          const res = await startFixedBattle(w, this.init, this.everyone, a[0]);
          // 負けても よい 戦い（loseOk）は 負けても 物語が つづく
          if (res !== 'win' && !(res === 'lose' && FIXED_ENCOUNTERS[a[0]]?.loseOk)) return this.abort();
          break;
        }
        case 'call':
          // ほかの しくみの しょり（宝の地図など）。a[0](run) を まつ
          await a[0](this);
          break;
        case 'teleport': {
          const [map, x, y, dir] = a;
          const offs = [[0, 0], [-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1]];
          const dest = MAPS[map];
          const has = w.hasFlagFn(this.owner);
          // かべの 中には おかない（ふさがって いたら まん中に）
          const pos = all.map((m, i) => {
            const [ox, oy] = offs[i % offs.length];
            return !dest || isBlocked(dest, Math.floor(x + ox), Math.floor(y + oy), has) ? [x, y] : [x + ox, y + oy];
          });
          const from = { map: this.init.map, x: this.init.x, y: this.init.y };
          all.forEach((m, i) => w.placeSession(m, map, pos[i][0], pos[i][1], dir || m.dir, false));
          // 「ついていく」なかまも いっしょに（トロッコ・船 など。だいほんに 入っていない 人）
          if (all.includes(this.init)) w.warpFollowers(this.init, from.map, from.x, from.y, { map, x, y, dir: dir || 'down' });
          // それぞれの いちを つたえる
          this.batch.push(['teleport', map, x, y, dir || 'down', all.map((m, i) => [m.id, pos[i][0], pos[i][1], m.posSeq])]);
          break;
        }
        case 'spawn': {
          const [map, x, y] = a;
          this.owner.char.spawn = { map, x, y };
          break;
        }
        case 'curse': {
          // のろいの宝（第4章の 王家のピラミッド）: いっしょに いる みんなに のろい。ピラミッドの 外に 出ると とける（world/pyramid.js）
          for (const m of all) {
            if (a[0]) m.char.pyrCurse = true;
            else delete m.char.pyrCurse;
          }
          break;
        }
        case 'shop': case 'jobChange': case 'tavern': case 'board': case 'starTrade': case 'church': case 'bank': case 'forge': case 'casino': case 'medalKing': case 'salon': {
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
        // 第3章: トロッコに のる・自分を かくす・天気・大きな 役者
        case 'ride': case 'hideMe': case 'weather':
        // カメラを その 場所へ（['look', x, y]）・自分に もどす（['look']）
        case 'look':
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
  // さそわれて 手伝っている 人が 町の 人に 話しかけた ときも、リーダーの 世界（ものがたり）で
  const owner = story ? init : (world.hostOf?.(init) || init);
  const steps = fn(scriptCtx(init, owner, world));
  if (!steps || !steps.length) return false;
  const participants = [init];
  if (init !== s && !s.busy) participants.push(s);
  if (story) {
    for (const sid of p?.members || []) {
      const m = world.sessions.get(sid);
      if (m && !participants.includes(m) && m.inWorld && m.map === init.map && !m.busy && !m.away) participants.push(m);
    }
  }
  const run = new ScriptRun(world, init, participants, steps, { scriptId, owner });
  run.start();
  return true;
}

export function runSteps(world, s, steps) {
  const run = new ScriptRun(world, s, [s], steps, {});
  run.start();
  return run;
}

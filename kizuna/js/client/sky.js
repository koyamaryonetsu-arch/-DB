// 空の 旅と 昼・夜の 時計（クライアント）
// ・時計: サーバーの 時こく（game.timeOffset）＋ パーティーの 時計の ずれ（party.clockShift）。宿屋の だいほんの とちゅうは
//   えんしゅつ（['clock', ずれ]）まで 前の 空の まま
// ・大鳥フウラ: サーバー（shared/world/travel.js）が きめた flying を うけて、とぶ・おりる えんしゅつと え を かく
import { el, toast, ListMenu } from './ui/dom.js?v=1ba3e6f60a67';
import { dayFrac, isNightFrac, darkness } from '../shared/world/clock.js?v=1ba3e6f60a67';
import { SKY_MAPS, FLUTE_ID, RIDE_ASK_MS, edgeAt, regionsFrom, skyBox, clampSkyBox, mountOf } from '../shared/data/sky.js?v=1ba3e6f60a67';
import { birdCanvas, birdRideCanvas, BIRD_W, BIRD_H, RIDE_TOP } from './render/sky-art.js?v=1ba3e6f60a67';
import { dragonCanvas, dragonRideCanvas } from './render/dragon-art.js?v=1ba3e6f60a67';
import { playerSprite } from './field.js?v=1ba3e6f60a67';
import { equipKey } from './render/chars.js?v=1ba3e6f60a67';

export const FLY_SPEED = 1.9; // 歩く はやさの この ばい
const CRUISE = 1.45; // とんでいる たかさ（マス）
const HIGH = 7; // 空の たかい ところ（よぶ・かえる えんしゅつ）
const BIG = 1.3; // 大鳥は 大きく かく
const ACTOR_LIFT = 1.1; // イベントの 大鳥の たかさ
const TS = 16;
const ease = (t) => 1 - (1 - t) * (1 - t);

// のりもの の え（大鳥フウラ・星の竜アステル）
// only … のりもの だけの え、ride … 人を のせた え、flap … はばたきの はやさ（ミリびょう）
// big … 大きさ、shadow … 2D の かげの はば、anchor・anchorOnly・shadowScale … 2.5D の たてた え
const MOUNTS = {
  bird: { only: birdCanvas, ride: birdRideCanvas, flap: 170, big: BIG, shadow: 13, anchor: 14, anchorOnly: 16, shadowScale: 2.4 },
  dragon: { only: dragonCanvas, ride: dragonRideCanvas, flap: 240, big: 1.15, shadow: 17, anchor: 17, anchorOnly: 19, shadowScale: 3 },
};
// イベントの 役者（'sky_bird' … 大鳥、'sky_dragon' … 星の竜）
const ACTOR_MOUNT = { sky_bird: 'bird', sky_dragon: 'dragon' };

export class SkyClient {
  constructor(game) {
    this.game = game;
    this.flying = false;
    this.anim = null;
    this.shift = 0; // 見せている 時計の ずれ
    this.partyShift = 0;
    this.edgeT = 0;
    this.edgeCool = 0;
    this.sentAt = 0;
    this.btn = el('button', { class: 'win hud-btn hud-sky', text: '大鳥', onclick: () => this.onButton() });
    this.btn2 = el('button', { class: 'win hud-btn hud-sky2', text: '別の地方へ', onclick: () => this.regionButton() });
    this.btn.hidden = true;
    this.btn2.hidden = true;
    game.hud.btns.append(this.btn, this.btn2);
  }

  // ───────────── 時計 ─────────────
  now() { return Date.now() + (this.game.timeOffset || 0); }
  frac() { return dayFrac(this.now(), this.shift); }
  isNight() { return isNightFrac(this.frac()); }
  darkness() { return darkness(this.frac()); }

  onParty(p) {
    this.partyShift = Number(p?.clockShift) || 0;
    // だいほんの とちゅう（宿屋で ねている あいだ）は えんしゅつまで まつ
    if (!this.game.busy) this.shift = this.partyShift;
  }

  // だいほんの ['clock', ずれ]（宿屋: くらく なっている あいだに 時間を かえる）
  scriptClock(shift) {
    this.shift = Number(shift) || 0;
    this.partyShift = this.shift;
  }

  scriptEnd() { this.shift = this.partyShift; }

  // 夜明けのすず・夕焼けのすず
  onClock(m) {
    this.partyShift = Number(m.shift) || 0;
    this.shift = this.partyShift;
    this.game.flash?.();
  }

  // ───────────── 大鳥 ─────────────
  get hasFlute() { return !!this.game.me?.keyItems?.includes(FLUTE_ID); }

  // 入った・つなぎなおした
  onEnter(m) {
    this.flying = !!m.fly;
    this.anim = null;
    this.onParty(m.party);
    this.shift = this.partyShift;
  }

  // サーバーが いちを きめた（ワープ・イベント・べつの 地方へ）
  setFlying(on) {
    this.flying = !!on;
    if (!on && this.anim?.kind === 'call') this.anim = null;
  }

  onFly(m) {
    if (m.refuse) {
      this.game.audio.sfx('buzz');
      return;
    }
    this.flying = !!m.on;
    const me = this.game.field.me;
    if (m.anim && !m.ride) {
      this.anim = { kind: m.anim, t: 0, dur: m.anim === 'call' ? 1300 : 1100, x: me.x, y: me.y, dir: me.dir };
      this.game.audio.sfx(m.anim === 'call' ? 'sparkle' : 'stairs');
    }
    const mount = this.mount();
    if (m.anim === 'call' && !m.ride) toast(`風の笛をふいた！\n${mount.title}${mount.name}が空からおりてきた！`);
    else if (m.on && m.ride) {
      // リーダーの のりものに 乗った: リーダーに ついていく（いっしょに とんで、いっしょに おりる）
      this.game.follow = true;
      this.game.field.leaderCrumbs = [];
      toast(`リーダーといっしょに、${mount.title}${mount.name}に乗った！`);
    }
  }

  // ───────────── リーダーが 大鳥に 乗った:「いっしょに 乗る？」 ─────────────
  // サーバー（world/travel.js の askRiders）から。たたかい・メニューの あいだは まって、あとで きく
  onAsk(m) {
    this.closeAsk();
    this.ask = { ...m, at: performance.now() };
  }

  onAskEnd(m) {
    if (!this.ask || (m.id && this.ask.id !== m.id)) return;
    this.closeAsk();
    this.ask = null;
  }

  closeAsk() {
    if (!this.askBox) return;
    this.askBox.menu.blur();
    this.askBox.box.remove();
    this.askBox = null;
    this.game.menuOpen = false;
  }

  showAsk() {
    const g = this.game;
    const a = this.ask;
    const box = el('div', { class: 'win choice sky-choice sky-ask' },
      el('div', { class: 'q', text: `${a.name}が${a.title}${a.mount}に乗った！\nいっしょに乗る？` }));
    const finish = (yes) => {
      if (!this.askBox) return;
      this.closeAsk();
      this.ask = null;
      g.audio.sfx('confirm');
      g.net.send({ t: 'fly', action: 'ride', id: a.id, yes: !!yes });
      if (!yes) {
        // 乗らない: 地上に のこる（空の リーダーを 追いかけない）
        if (g.follow) g.follow = false;
        toast('地上にのこった。');
      }
    };
    const menu = new ListMenu(g.input, {
      items: [{ label: 'いっしょに乗る', value: true }, { label: '乗らない', value: false }],
      sound: (x) => g.audio.sfx(x),
      back: null,
      onSelect: (it) => finish(it.value),
      onCancel: () => finish(false),
    });
    box.append(menu.root);
    document.getElementById('ui').append(box);
    this.askBox = { box, menu };
    g.menuOpen = true;
    g.audio.sfx('sparkle');
    menu.focus();
  }

  // まっている「いっしょに 乗る？」を 出す（フィールドで ほかの まどが ない とき）
  updateAsk() {
    const g = this.game;
    if (!this.ask || this.askBox) return;
    if (performance.now() - this.ask.at > RIDE_ASK_MS) {
      this.ask = null;
      return;
    }
    if (g.state !== 'field' || g.busy || g.menuOpen || document.querySelector('.sky-choice, .choice')) return;
    this.showAsk();
  }

  send(action, extra = {}) {
    const t = performance.now();
    if (t - this.sentAt < 350) return;
    this.sentAt = t;
    this.game.net.send({ t: 'fly', action, ...extra });
  }

  call() {
    if (this.flying || this.anim) return;
    this.send('call');
  }

  land() {
    if (!this.flying || this.anim) return;
    this.send('land');
  }

  region(edge, to = null) {
    if (!this.flying || this.anim) return;
    this.game.audio.sfx('confirm');
    this.send('region', { edge: !!edge, ...(to ? { to } : {}) });
  }

  // 世界の フラグ（さそわれて 手伝っている ときは リーダーの 世界）
  hasFlag(f) { return this.game.field.hasFlag(f); }

  // のりもの（大鳥フウラ・星の竜アステル）
  mount() {
    return mountOf({ c3_dragon: this.hasFlag('c3_dragon') });
  }

  // 行ける 地方
  regions() { return regionsFrom(this.game.field.mapId, (f) => this.hasFlag(f)); }

  // 「別の地方へ」ボタン: 行き先が 2つ 以上なら えらぶ
  regionButton() {
    const g = this.game;
    if (!this.flying || this.anim || g.busy || g.menuOpen || document.querySelector('.sky-choice')) return;
    const list = this.regions();
    if (list.length <= 1) return this.region(false, list[0]);
    g.audio.sfx('confirm');
    const box = el('div', { class: 'win choice sky-choice' }, el('div', { class: 'q', text: 'どの地方へ飛ぶ？' }));
    const menu = new ListMenu(g.input, {
      items: [...list.map((id) => ({ label: SKY_MAPS[id].name, value: id })), { label: 'やめる', value: null }],
      sound: (x) => g.audio.sfx(x),
      back: null,
      onSelect: (it) => finish(it.value),
      onCancel: () => finish(null),
    });
    box.append(menu.root);
    document.getElementById('ui').append(box);
    g.menuOpen = true;
    menu.focus();
    const finish = (v) => {
      menu.blur();
      box.remove();
      g.menuOpen = false;
      if (v) this.region(false, v);
    };
  }

  onButton() {
    const g = this.game;
    if (g.state !== 'field' || g.busy || g.menuOpen) return;
    if (this.flying) this.land();
    else this.call();
  }

  // フィールドの ボタン（F キー）
  toggle() { this.onButton(); }

  // えんしゅつ中は うごけない
  blocksMove() {
    const a = this.anim;
    return !!a && ((a.kind === 'call' && a.t < 1000) || (a.kind === 'land' && a.t < 520));
  }

  // なかまの 大鳥に いっしょに のっている（じぶんの すがたは 出さない）
  ridingAlong() {
    const g = this.game;
    if (!this.flying || !g.follow) return false;
    const leader = g.field.leaderPos();
    return !!(leader && leader.air && Math.hypot(leader.x - g.field.me.x, leader.y - g.field.me.y) < 3);
  }

  update(dt) {
    const g = this.game;
    const f = g.field;
    if (this.anim) {
      this.anim.t += dt;
      if (this.anim.t >= this.anim.dur) this.anim = null;
    }
    this.edgeCool = Math.max(0, this.edgeCool - dt);
    this.updateAsk();
    const region = SKY_MAPS[f.mapId];
    const show = g.state === 'field' && !!region && (this.flying || this.hasFlute);
    this.btn.hidden = !show;
    if (show) {
      const label = this.flying ? '降りる' : this.mount().btn;
      if (this.btn.textContent !== label) this.btn.textContent = label;
    }
    const list = show && this.flying ? this.regions() : [];
    this.btn2.hidden = !list.length;
    if (!this.btn2.hidden) {
      const label = list.length > 1 ? '別の地方へ' : `${SKY_MAPS[list[0]].short}へ`;
      if (this.btn2.textContent !== label) this.btn2.textContent = label;
    }
  }

  // とんでいる ときの 1歩（マップの はし まで。はしを こえようと すると となりの 地方へ）
  flyStep(me, nx, ny, iy, dt) {
    const m = this.game.field.map;
    let x = Math.max(0.3, Math.min(m.w - 0.3, nx));
    let y = Math.max(0.6, Math.min(m.h - 0.2, ny));
    // ふぶきの 地方は とべる 場所の 中だけ（data/sky.js の box）
    const box = skyBox(m.id, (f) => this.hasFlag(f));
    if (box) ({ x, y } = clampSkyBox(box, x, y));
    const moved = Math.abs(x - me.x) > 1e-4 || Math.abs(y - me.y) > 1e-4;
    me.x = x;
    me.y = y;
    const e = edgeAt(m.id, me.y, m.h);
    // 行けない 地方の はしでも おくる（サーバーが「ふぶきで 進めない」と 知らせる）
    const pushing = e && (e === 'south' ? iy > 0.5 : iy < -0.5);
    this.edgeT = pushing ? this.edgeT + dt : 0;
    if (this.edgeT > 380 && !this.edgeCool) {
      this.edgeT = 0;
      this.edgeCool = 2500;
      this.region(true);
    }
    return moved;
  }

  // ───────────── え ─────────────
  lift(time) { return CRUISE + Math.sin(time / 320) * 0.08; }

  riderCanvas(look, job, dir, frame, eq, mount = 'bird') {
    const rider = playerSprite(look, job, dir, frame, eq);
    return MOUNTS[mount].ride(`${JSON.stringify(look)}:${job}:${equipKey(eq, job)}`, rider, dir, frame);
  }

  // のりもの（星の竜に のせて もらった 人 … フラグ c3_dragon … は 竜。ほかは 大鳥フウラ）
  // じぶん は キャラの フラグ。ほかの 人 は サーバーの いちの じょうほう（mt）
  mountOf(o, mine) {
    if (mine) return this.game.me?.flags?.c3_dragon ? 'dragon' : 'bird';
    return o?.mt === 'dragon' ? 'dragon' : 'bird';
  }

  // いま どう かくか（mine … じぶん）。null なら ふつうに 歩く すがた
  //  { mounted: true, lift } … のっている / { bird: { x, y, lift, alpha } } … 鳥だけ（そばに いる）
  pose(o, mine, time) {
    if (!mine) return o.air ? { mounted: true, lift: this.lift(time + (o.x * 97 % 500)), hide: !!o.ride } : null;
    if (this.ridingAlong()) return { hide: true };
    const a = this.anim;
    if (a?.kind === 'call') {
      if (a.t < 700) {
        const k = ease(a.t / 700);
        return { walk: true, bird: { x: o.x + 1.3, y: o.y + 0.1, lift: HIGH + (0.25 - HIGH) * k, dir: 'left' } };
      }
      return { mounted: true, lift: 0.25 + (this.lift(time) - 0.25) * ease(Math.min(1, (a.t - 700) / 500)) };
    }
    if (a?.kind === 'land') {
      if (a.t < 500) return { mounted: true, lift: this.lift(time) + (0.2 - this.lift(time)) * ease(a.t / 500) };
      const k = (a.t - 500) / 600;
      return { walk: true, bird: { x: a.x + 0.6 + k * 5, y: a.y - k * 2, lift: 0.2 + (HIGH - 0.2) * k * k, dir: 'right', alpha: 1 - Math.max(0, k - 0.7) / 0.3 } };
    }
    return this.flying ? { mounted: true, lift: this.lift(time) } : null;
  }

  // 2D: 人を かく かわりに 鳥を かく（かいたら true。walk の ときは 人は ふつうに かく）
  draw2D(field, o, camX, camY, look, job, mine, eq) {
    const ps = this.pose(o, mine, field.time);
    if (!ps) return false;
    if (ps.hide) return true;
    const mount = this.mountOf(o, mine), M = MOUNTS[mount];
    const frame = Math.floor(field.time / M.flap) % 2;
    const ctx = field.ctx;
    const shadow = (x, y, lift) => {
      const k = Math.max(0.35, 1 - lift / 12);
      ctx.fillStyle = `rgba(0,0,0,${0.3 * k})`;
      ctx.beginPath();
      ctx.ellipse(Math.round(x * TS - camX), Math.round(y * TS - camY - 1), M.shadow * k, 4 * k, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    const put = (c, x, y, lift, alpha = 1) => {
      const r = c.res || 1;
      const w = (c.width / r) * M.big, h = (c.height / r) * M.big;
      const px = Math.round(x * TS - w / 2 - camX);
      const py = Math.round((y - lift) * TS - h + 8 - camY);
      if (alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
      field.drawFine(c, px, py, w, h);
      ctx.globalAlpha = 1;
    };
    if (ps.bird) {
      shadow(ps.bird.x, ps.bird.y, ps.bird.lift);
      if (ps.walk) field.drawPlayerOnFoot(o, camX, camY, look, job, mine, eq);
      put(M.only(ps.bird.dir, frame), ps.bird.x, ps.bird.y, ps.bird.lift, ps.bird.alpha ?? 1);
      return true;
    }
    shadow(o.x, o.y, ps.lift);
    put(this.riderCanvas(look, job, o.dir || 'down', frame, eq, mount), o.x, o.y, ps.lift);
    return true;
  }

  // 2.5D: 人の かわりの たてた え（out に 入れる）。入れたら true
  entity3d(field, o, mine, out, look, job, eq) {
    const ps = this.pose(o, mine, field.time);
    if (!ps) return false;
    if (ps.hide) return true;
    const mount = this.mountOf(o, mine), M = MOUNTS[mount];
    const frame = Math.floor(field.time / M.flap) % 2;
    const key = mine ? 'me' : 'p:' + o.sid;
    if (ps.bird) {
      if (ps.walk) return false; // 人は ふつうに（鳥は extra3d で）
    }
    const c = this.riderCanvas(look, job, o.dir || 'down', frame, eq, mount);
    out.push({ key: key + ':sky', canvas: c, x: o.x, y: o.y, lift: ps.lift, anchor: M.anchor, scale: M.big, shadowScale: M.shadowScale, air: true, ghost: mine ? '#9fd6ff' : null });
    return true;
  }

  // 2.5D: よぶ・かえる ときの 鳥（竜）だけの え
  extra3d(field, out) {
    const ps = this.pose(field.me, true, field.time);
    if (!ps?.bird) return;
    const M = MOUNTS[this.mountOf(field.me, true)];
    const frame = Math.floor(field.time / M.flap) % 2;
    out.push({ key: 'sky:bird', canvas: M.only(ps.bird.dir, frame), x: ps.bird.x, y: ps.bird.y, lift: ps.bird.lift, anchor: M.anchorOnly, scale: M.big, shadowScale: M.shadowScale * 0.92, air: true, alpha: ps.bird.alpha ?? 1 });
  }

  // イベントの 役者の 大鳥（風のさいだん）・星の竜: 空に うかべて かく
  drawActor2D(field, a, camX, camY) {
    const M = MOUNTS[ACTOR_MOUNT[a.sprite]];
    if (!M) return false;
    const c = M.only(a.dir, Math.floor(field.time / M.flap) % 2);
    const r = c.res || 1;
    const w = (c.width / r) * M.big, h = (c.height / r) * M.big;
    const ctx = field.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(Math.round(a.x * TS - camX), Math.round(a.y * TS - camY - 1), M.shadow - 1, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    field.drawFine(c, Math.round(a.x * TS - w / 2 - camX), Math.round((a.y - ACTOR_LIFT) * TS - h + 8 - camY), w, h);
    return true;
  }

  actor3d(a, field) {
    const M = MOUNTS[ACTOR_MOUNT[a.sprite]];
    if (!M) return null;
    return { key: 'a:' + a.id, canvas: M.only(a.dir, Math.floor(field.time / M.flap) % 2), x: a.x, y: a.y, lift: ACTOR_LIFT, anchor: M.anchorOnly, scale: M.big, shadowScale: M.shadowScale * 0.92, air: true };
  }

  // じぶんの なかま（酒場の なかま など）は 鳥の 上
  hidesFollowers() {
    return this.flying || this.anim?.kind === 'call' && this.anim.t >= 700;
  }
}

export { BIRD_W, BIRD_H, RIDE_TOP };

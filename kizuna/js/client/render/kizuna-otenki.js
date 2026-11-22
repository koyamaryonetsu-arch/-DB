// 第98回 K4班: おてんき格闘流の師はんの 絵（見た目・乗り物・技の えんしゅつ。データは shared/data/jobs-r98-otenki.js）
// きずなの職業の 絵は 1つ 1ファイル（client/render/kizuna-art.js の 一覧に 1行）。形は kizuna-kuuchou.js と おなじ
// （ほかの 絵の ファイル〈hero-outfit.js など〉を import しない。乗り物の 絵の vehicle-r84b.js は import して よい ＝ 何も 読まない ファイル）
//
// 見た目: 親の 2つが 見て わかる 形
//   飛竜しょう天はの達人 … 道着（gi）と おさげ（hair 'braid'）・むねの 竜の しるし
//   天候をあやつる者     … 道着の 色が 雨の 青 と 日ざしの だいだい（ふち）・せなかの 白い マント（雲）
//   オーラ               … 左半分 青い 雨・右半分 だいだいの 日ざし
// 乗り物: パンダの雨雲（らんま1/2 の パンダが、雨雲に のって かさを さす。もとの パンダより こまかい。うしろに にじ）
// えんしゅつ: otenki_shihan_sig（雨が ふりだす → 竜巻 → 雨つぶの 追いうち）・kizuna_niji（ひらめき技。にじの けり）
import { pandaArt } from './vehicle-r84b.js?v=10ad7ced5cfe';

const ID = 'otenki_shihan';

// ───────────── 見た目 ─────────────
const outfit = { kind: 'gi', main: '#2a7ad8', trim: '#f6a83a', dragon: true, cape: '#f4f8ff', capeLen: 34.8 };
const body = { hair: 'braid', iris: '#2a7ad8', aura: 'tenki98' };
const oldLook = { outfit: 'gi', cloth: '#2a7ad8', giTrim: '#f6a83a', cape: '#f4f8ff' };
const aura = {
  // 左半分 青い 雨・右半分 だいだいの 日ざし（cols2 は みぎ半分）
  tenki98: { glow: 0.55, len: 3.2, wid: 1.15, up: 1.2, gap: 2.1, flicker: 0.2, cols: [['#f0faff', 210], ['#a8dcff', 182], ['#4a9ae8', 150], ['#2a5ab8', 112]], cols2: [['#fffbe0', 210], ['#ffe08a', 182], ['#ffb040', 150], ['#e8782a', 112]] },
};

// ───────────── 乗り物: パンダの雨雲 ─────────────
function rainPandaArt(kit) {
  const base = pandaArt(kit);
  const { seg, poly, shade, rgba } = kit;
  const CL = '#eef4fa', CLD = shade('#eef4fa', -0.18), CLB = '#c8d8e8', UM = '#2a7ad8', UM2 = '#f6a83a', STICK = '#8a5a2a';
  const NIJI = ['#e8402a', '#f6a83a', '#f6e04a', '#4ac85a', '#3a8ae8', '#8a5ae8'];
  // 雲（足もとを かくす もこもこ。x0〜x1 の はば）
  const cloud = (p, x0, x1, y, f) => {
    const n = Math.max(3, Math.round((x1 - x0) / 7));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, r = 4 + ((i + f) % 2);
      p.ellipse(x, y + 1, r + 0.5, r - 0.5, CLD);
      p.ellipse(x, y, r, r - 1, CL);
    }
    p.hline(Math.round(x0), Math.round(x1), y + 3, CLB);
    for (let i = 0; i < n; i++) p.set(Math.round(x0 + 3 + i * 7), y - 2, '#ffffff');
  };
  // かさ（x … え・y … かさの てっぺん）
  const kasa = (p, x, y, f) => {
    const tilt = [0, 1, -1][f];
    poly(p, [[x - 8, y + 5 + tilt], [x, y], [x + 8, y + 5 - tilt]], UM);
    for (const s of [-4, 4]) poly(p, [[x + s - 1, y + 3 + (s < 0 ? tilt : -tilt) * 0.5], [x + s + 1, y + 3], [x + s * 1.6, y + 5 + (s < 0 ? tilt : -tilt)]], UM2);
    p.hline(x - 8, x + 8, Math.round(y + 5), shade(UM, -0.3));
    seg(p, x, y + 5, x, y + 15, STICK, 1);
    p.set(x, y - 1, '#f2c14e');
  };
  // にじ（うしろの 層。cx・cy … 中心、r … 外の 半けい）
  const niji = (p, cx, cy, r) => {
    NIJI.forEach((c, k) => {
      const rr = r - k;
      for (let a = 0; a <= 32; a++) {
        const t = Math.PI + (a / 32) * Math.PI;
        p.set(Math.round(cx + Math.cos(t) * rr), Math.round(cy + Math.sin(t) * rr * 0.7), c);
      }
    });
  };
  return {
    ...base,
    paint(p, view, f, layer) {
      if (layer === 'back') {
        if (view === 'side') niji(p, 48, 30, 12);
        else niji(p, 18, 26, 13);
      }
      base.paint(p, view, f, layer);
      if (layer !== 'front') return;
      const by = 31;
      if (view === 'side') {
        // 青い くらぬの（雨の しずくの もよう）・かさ・足もとの 雨雲
        poly(p, [[29, by - 9], [41, by - 9], [40, by - 2], [30, by - 2]], UM);
        p.hline(29, 41, by - 9, UM2);
        for (const x of [32, 35, 38]) p.set(x, by - 5 + (x % 2), '#c8ecff');
        if (f !== 1) kasa(p, 6, by - 30, f);
        cloud(p, 6, 56, 47, f);
      } else {
        const bob = f === 1 ? -1 : 0;
        if (view === 'back') {
          poly(p, [[7, by - 9 + bob], [29, by - 9 + bob], [28, by - 4 + bob], [8, by - 4 + bob]], UM);
          p.hline(7, 29, by - 9 + bob, UM2);
        }
        cloud(p, 4, 32, 47, f);
      }
    },
    // こうか: ふって くる 雨つぶ（コマで 下へ）と、雲の まわりの 白い もや
    fx(p, view, f) {
      const [w, h] = base.size(view);
      for (let i = 0; i < 6; i++) {
        const x = 3 + ((i * 11 + f * 2) % (w - 6));
        const y = 6 + ((i * 9 + f * 6) % (h - 22));
        p.set(x, y, rgba('#7ac8ff', 0.7));
        p.set(x, y + 1, rgba('#bfe6ff', 0.55));
      }
      for (let i = 0; i < 3; i++) p.hline(2 + i * 5 + f * 2, 6 + i * 5 + f * 2, h - 4 - i, rgba('#ffffff', 0.5));
    },
  };
}

// ───────────── 技の えんしゅつ ─────────────
const ANIMS = new Set(['otenki_shihan_sig', 'kizuna_niji']);
const HIT = { otenki_shihan_sig: 760, kizuna_niji: 420 };
const SFX = { otenki_shihan_sig: 'wind', kizuna_niji: 'smash' };
const RAIN = ['#ffffff', '#d8f0ff', '#7ac8ff', '#2a7ad8'];
const WIND = ['#ffffff', '#e0f4ff', '#a8dcff', '#6ab0e8'];
const NIJI = ['#e8402a', '#f6a83a', '#f6e04a', '#4ac85a', '#3a8ae8', '#8a5ae8'];

function play(fx, anim, targets, element, opts = {}, W = 256) {
  if (!ANIMS.has(anim) || !targets?.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 140, delay: d, life: 340, len: 6 });
  };
  const avgY = targets.reduce((a, t) => a + t.y, 0) / targets.length;
  switch (anim) {
    case 'otenki_shihan_sig': {
      // 1) 空が くもって 雨（ななめの 青い すじ）→ 2) 大きな 竜巻 → 3) 雨つぶの 追いうち
      fx.tintAt('rgba(40, 70, 120, 0.35)', 1700);
      for (let k = 0; k < 6; k++) fx.gust(W * (0.15 + k * 0.14), avgY - 50, { len: 40, amp: 2, color: k % 2 ? '#bfe6ff' : '#7ac8ff', w: 1.2, dir: 1, delay: k * 40, life: 520 });
      each((t, i, d) => {
        fx.swirl(t.x, t.y + 8, WIND, { n: 18, rad: 16 * sz, h: 50, delay: d + 260, life: 560, size: 1.4 });
        fx.shock(t.x, t.y, { r0: 8, r1: 52 * sz, color: '#e0f4ff', w: 2.6, delay: d + 520, life: 400 });
        hitMark(t, d + 560, '#a8dcff', 20);
        for (let k = 0; k < 3; k++) fx.impact(t.x + (k - 1) * 8, t.y - 6 + k * 4, { r: 8 * sz, color: '#7ac8ff', delay: d + 640 + k * 50 });
        fx.burst(t.x, t.y, RAIN, 12, 100, { delay: d + 720 });
      });
      fx.flashAt(120, '#e8f6ff', 560);
      fx.hitStop(crit ? 260 : 200, 760, 1.6);
      return true;
    }
    case 'kizuna_niji': {
      each((t, i, d) => {
        NIJI.forEach((c, k) => fx.shock(t.x, t.y, { r0: 4 + k * 2, r1: (26 + k * 4) * sz, color: c, w: 1.8, delay: d + 200 + k * 30, life: 360 }));
        hitMark(t, d + 420, '#f6e04a', 18);
      });
      fx.hitStop(crit ? 180 : 120, 420, 1.3);
      return true;
    }
    default: return false;
  }
}

export const OTENKI_ART = {
  id: ID,
  outfit, body, oldLook, aura,
  emblems: {},
  vehicle: { id: 'panda_amagumo', art: rainPandaArt },
  fx: { anims: ANIMS, party: new Set(), hit: HIT, sfx: SFX, play },
};

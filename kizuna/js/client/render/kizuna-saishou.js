// 第98回 K3班: 国を動かす名さいしょうの 絵（見た目・乗り物・技の えんしゅつ。データは shared/data/jobs-r98-saishou.js）
// きずなの職業の 絵は 1つ 1ファイル（client/render/kizuna-art.js の 一覧に 1行）。形は kizuna-kuuchou.js と おなじ。
// ほかの 絵の ファイル（hero-outfit.js など）は import しない。空飛ぶカバの 絵だけ vehicle-r83a.js から かりる（vehicle-r85b.js の dragonArt と おなじ やり方）
//
// 見た目: 親の 2つが 見て わかる 形
//   総理大臣     … スーツ（suit）・えりの バッジ（pin）・首から さげた 金の メダル（赤い リボン）
//   ほう神の大軍師 … 青い 上着と 白い マント・金の サークレット・打神べん（whip83。光る）
//   （総理大臣の こんの スーツ・紫の マント、大軍師の 青い ローブ とは、金の ネクタイと メダルで 見分ける）
// 乗り物: 金の空飛ぶ大カバ（空飛ぶカバに 金の ふさかざり・会議の つくえ・作戦の 旗）
// えんしゅつ: kuni_saishou_sig（大会議の つくえが ならび、光の 書類が 敵に ふりそそぐ → 時計の わで 番が おくれる）・kizuna_gorei（ひらめき技。号令の 大風）
import { addR83aVehicleArt } from './vehicle-r83a.js?v=47b761b2972a';

const ID = 'kuni_saishou';

// ───────────── 見た目 ─────────────
const outfit = { kind: 'suit', main: '#2a3a8a', tie: '#f2c14e', pin: true, medal: '#c8202c', pants: '#1c2238', cape: '#f4f0e0', capeIn: '#2a3a8a', capeLen: 37.4, r79: true, pad79: 'gold' };
const body = { iris: '#8a6a1a', prop: 'whip83', whipGlow83: true, aura: 'saishou98' };
const hat = { kind: 'circlet', mk: 'gold', gemc: '#c8202c' };
const oldLook = { outfit: 'suit', cloth: '#2a3a8a', tie: '#f2c14e', cape: '#f4f0e0', hat: 'circlet', hatColor: '#f2c14e' };
const aura = {
  // 金と 白の 雲（大軍師の 雲の オーラに 金を まぜる）
  saishou98: { glow: 0.5, len: 3.0, wid: 1.2, up: 1.1, gap: 2.2, twinkle: true, cols: [['#fffbe6', 205], ['#fae08a', 178], ['#f2c14e', 146], ['#5a6ad8', 108]] },
};

// ───────────── 乗り物: 金の空飛ぶ大カバ ─────────────
function goldHippoArt(kit) {
  const tmp = {};
  addR83aVehicleArt(tmp, kit);
  const base = tmp.sky_hippo;
  const { rgba, shade, seg } = kit;
  const GOLD = '#f2c14e', GOLDD = shade('#f2c14e', -0.3), RED = '#c8202c', NAVY = '#2a3a8a', WOOD = '#8a5a2a', PAPER = '#f8f6ee';
  const BOB = [0, -1.5, -0.5];
  // 金の ふさかざり（くらの まわりに たれる）
  const tassels = (p, x0, x1, y, f) => {
    p.hline(Math.round(x0), Math.round(x1), Math.round(y), GOLD);
    p.hline(Math.round(x0), Math.round(x1), Math.round(y + 1), GOLDD);
    for (let x = x0 + 1; x < x1; x += 3) {
      const sw = ((Math.round(x) + f) % 3) - 1;
      p.vline(Math.round(x), Math.round(y + 2), Math.round(y + 4), GOLD);
      p.set(Math.round(x + sw * 0.5), Math.round(y + 5), RED);
    }
  };
  // 会議の つくえ（小さな 木の つくえに 書類と マイク）
  const desk = (p, x, y) => {
    p.rect(x, y, 9, 2, WOOD);
    p.vline(x + 1, y + 2, y + 4, shade(WOOD, -0.3));
    p.vline(x + 7, y + 2, y + 4, shade(WOOD, -0.3));
    p.rect(x + 1, y - 1, 3, 1, PAPER);
    seg(p, x + 6, y - 1, x + 7, y - 4, '#4a4a5a', 1);
    p.set(x + 7, y - 5, '#2a2a3a');
  };
  // 作戦の 旗（金の さお・こんの 旗に 白い 丸 ＝ 太極の しるし）
  const flag = (p, x, y, f) => {
    p.vline(x, y, y + 14, GOLDD);
    p.set(x, y - 1, GOLD);
    const wave = [0, 1, 0][f];
    for (let j = 0; j < 6; j++) p.hline(x + 1, x + 8 + (j % 2 ? wave : 0), y + j, j < 1 || j > 4 ? shade(NAVY, 0.15) : NAVY);
    p.ellipse(x + 5, y + 2.5, 1.6, 1.6, PAPER);
    p.set(x + 5, y + 2, NAVY);
  };
  return {
    ...base,
    paint(p, view, f, layer) {
      base.paint(p, view, f, layer);
      const b = Math.round(BOB[f]);
      if (view === 'side') {
        if (layer === 'back') {
          flag(p, 50, 8 + b, f);
          desk(p, 44, 24 + b);
          return;
        }
        tassels(p, 22, 48, 33 + b, f);
        return;
      }
      if (layer === 'back') {
        flag(p, 28, 6 + b, f);
        return;
      }
      tassels(p, 6, 30, 34 + b, f);
    },
    // こうか: 金の 光の つぶと、足もとの 雲から 出る 白い 紙ふぶき（会議の 書類）
    fx(p, view, f) {
      const [w, h] = base.size(view);
      for (let i = 0; i < 4; i++) {
        const x = 3 + ((i * 13 + f * 5) % (w - 6)), y = 4 + ((i * 9 + f * 4) % 18);
        p.set(x, y, rgba('#fff4b0', 0.85));
        p.set(x + 1, y, rgba(GOLD, 0.5));
      }
      for (let i = 0; i < 3; i++) p.set(4 + ((i * 17 + f * 7) % (w - 8)), h - 10 - ((i * 5 + f * 3) % 8), rgba(PAPER, 0.8));
    },
    shadowScale: 1.6,
  };
}

// ───────────── 技の えんしゅつ ─────────────
const ANIMS = new Set(['kuni_saishou_sig', 'kizuna_gorei']);
const HIT = { kuni_saishou_sig: 820, kizuna_gorei: 480 };
const SFX = { kuni_saishou_sig: 'blast', kizuna_gorei: 'wind' };
const GOLDS = ['#ffffff', '#fff4b0', '#f2c14e', '#c8902a'];
const WINDS = ['#ffffff', '#e0f4ff', '#9ad8f0'];

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
    case 'kuni_saishou_sig': {
      // 1) 金色の 光が 広がり、会議の ベル（白い わ）→ 2) 光の 書類が 敵に ふりそそぐ → 3) 時計の わで 番が おくれる
      fx.tintAt('rgba(242, 193, 78, 0.18)', 1500);
      for (let k = 0; k < 5; k++) fx.shock(W * 0.15 + k * W * 0.08, avgY - 30, { r0: 2, r1: 14, color: '#fff4b0', w: 1.6, delay: k * 60, life: 360 });
      each((t, i, d) => {
        fx.swirl(t.x, t.y - 4, GOLDS, { n: 16, rad: 16 * sz, h: 44, delay: d + 260, life: 520, size: 1.3 });
        for (let k = 0; k < 4; k++) fx.impact(t.x + (k - 1.5) * 8, t.y - 10 + (k % 2) * 6, { r: 7 * sz, color: '#fffbe6', delay: d + 380 + k * 70 });
        fx.shock(t.x, t.y, { r0: 8, r1: 46 * sz, color: '#f2c14e', w: 2.6, delay: d + 640, life: 460 });
        hitMark(t, d + 820, '#f2c14e', 22);
      });
      fx.flashAt(160, '#fffbe6', 820);
      fx.hitStop(crit ? 240 : 180, 820, 1.5);
      return true;
    }
    case 'kizuna_gorei': {
      for (let k = 0; k < 4; k++) fx.gust(-10, avgY - 24 + k * 14, { len: W * 0.85, amp: 5, color: k % 2 ? '#ffffff' : '#9ad8f0', w: 1.8, dir: 1, delay: k * 60, life: 520 });
      each((t, i, d) => {
        fx.swirl(t.x, t.y + 4, WINDS, { n: 14, rad: 14 * sz, h: 40, delay: d + 220, life: 460, size: 1.2 });
        hitMark(t, d + 480, '#9ad8f0', 18);
      });
      fx.hitStop(crit ? 180 : 120, 480, 1.2);
      return true;
    }
    default: return false;
  }
}

export const SAISHOU_ART = {
  id: ID,
  outfit, body, hat, oldLook, aura,
  emblems: {},
  vehicle: { id: 'kin_kaba', art: goldHippoArt },
  fx: { anims: ANIMS, party: new Set(), hit: HIT, sfx: SFX, play },
};

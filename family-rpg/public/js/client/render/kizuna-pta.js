// 第98回 K3班: 伝説のPTA会長の 絵（見た目・乗り物・技の えんしゅつ。データは shared/data/jobs-r98-pta.js）
// きずなの職業の 絵は 1つ 1ファイル（client/render/kizuna-art.js の 一覧に 1行）。形は kizuna-kuuchou.js と おなじ。ほかの 絵の ファイルは import しない
//
// 見た目: 親の 2つが 見て わかる 形
//   最強のおかん     … おかんの カーディガンと 白い エプロン（okan）・パーマの かみ・イヤリング・サンバイザー
//   おにの手のじごく先生 … 左手の おにの手（hand83 'oni'）・こい 赤の マント・赤い 目
//   PTA会長         … マントの うらと かたかざり（会長の しるし）。たすきは 乗り物（大三輪車）の ハンドルに かけて いる
//   （宇宙一のおかんの むらさき・じごく先生の くろい スーツ とは、赤い カーディガンと 白い エプロンで 見分ける）
// 乗り物: PTA会長の大三輪車（赤い 三輪の 自転車・前の かごに お弁当・うしろに 見守りの 黄色い 旗・ハンドルに たすき・おにの手の 赤い ライト）
// えんしゅつ: pta_kaichou_sig（おにの手の げんこつ 3回 → 赤い たての わ → お弁当の 光）・kizuna_bazaar（ひらめき技。ほうきの 大そうじ）
const ID = 'pta_kaichou';

// ───────────── 見た目 ─────────────
const outfit = { kind: 'okan', main: '#b8283a', apron: '#fbf8f4', pants: '#2a2230', cape: '#6a1a2a', capeIn: '#f2c14e', capeLen: 37.2, r79: true, pad79: 'gold', fem: { skirt: '#2a2230', pants: '#3a2a30' } };
const body = { hair: 'perm', hcol: 'obapurple', iris: '#c83a2a', earring: true, hand83: 'oni', aura: 'pta98' };
const hat = { kind: 'visor', c: '#b8283a', big: true };
const oldLook = { outfit: 'apron', cloth: '#b8283a', cape: '#6a1a2a', hat: 'bbcap', hatColor: '#b8283a' };
const aura = {
  // あたたかい だいだいと、おにの手の こい 赤（おかんの 金の オーラ ＋ じごく先生の くろ赤）
  pta98: { glow: 0.55, len: 3.1, wid: 1.2, up: 1.15, gap: 2.2, flicker: 0.16, cols: [['#fff4d8', 205], ['#ffc070', 178], ['#e8503a', 146], ['#6a1a2a', 108]] },
};

// ───────────── 乗り物: PTA会長の大三輪車 ─────────────
function tricycleArt({ seg, poly, shade, seat, rgba, box }) {
  const FR = '#c8283a', FRD = shade('#c8283a', -0.3), METAL = '#c8ccd8', TIRE = '#2a2a34', HUB = '#8a8e9a';
  const BAS = '#d8b070', BASD = shade('#d8b070', -0.3), BENTO = '#e8503a', CLOTH = '#4a7ad8', RICE = '#ffffff';
  const FLAG = '#ffd83a', FLAGD = shade('#ffd83a', -0.25), SASH = '#f4f0e8', SASHR = '#c8202c';
  const DY = [0, -1, 0];
  // 車輪（わ・スポーク〈コマで まわる〉・まん中）
  const wheel = (p, cx, cy, r, f) => {
    p.ellipse(cx, cy, r, r, TIRE);
    p.ellipse(cx, cy, r - 1.4, r - 1.4, '#e8eaf0');
    p.ellipse(cx, cy, r - 2.2, r - 2.2, shade(METAL, 0.1));
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 3 + f * 0.5;
      seg(p, cx - Math.cos(a) * (r - 2), cy - Math.sin(a) * (r - 2), cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2), HUB, 1);
    }
    p.ellipse(cx, cy, 1.2, 1.2, FRD);
  };
  // 前の かごと お弁当（赤い ふた・青い ふろしき）
  const basket = (p, x, y) => {
    box(p, x, y, 11, 7, BAS);
    for (let i = x + 2; i < x + 11; i += 2) p.vline(i, y + 1, y + 5, BASD);
    p.rect(x + 2, y - 3, 7, 3, CLOTH);
    p.set(x + 5, y - 4, CLOTH);
    p.set(x + 4, y - 4, shade(CLOTH, 0.2));
    p.rect(x + 3, y - 2, 2, 1, RICE);
    p.hline(x + 6, x + 8, y - 2, BENTO);
  };
  // 見守りの 黄色い 旗（さおと 旗。コマで ゆれる）
  const flag = (p, x, y, f) => {
    p.vline(x, y, y + 16, '#e8e8f0');
    const w = [0, 1, 2][f];
    for (let j = 0; j < 7; j++) p.hline(x + 1, x + 9 + (j % 3 === 1 ? w - 1 : w), y + j, j === 0 || j === 6 ? FLAGD : FLAG);
    // 旗の 中の 子どもの 絵（まるい 頭と 体）
    p.ellipse(x + 5, y + 2, 1.1, 1.1, '#2a7a4a');
    p.vline(x + 5, y + 3, y + 5, '#2a7a4a');
  };
  // ハンドルに かけた たすき（白に 赤い ふち）
  const sash = (p, x, y, f) => {
    seg(p, x, y, x + 3, y + 7 + DY[f], SASH, 2);
    seg(p, x - 1, y, x + 2, y + 7 + DY[f], SASHR, 1);
    seg(p, x + 1, y, x + 4, y + 7 + DY[f], SASHR, 1);
  };
  const side = (p, f, layer) => {
    const d = DY[f];
    if (layer === 'back') {
      flag(p, 44, 12 + d, f);
      wheel(p, 41, 47, 6, f + 1);
      return;
    }
    wheel(p, 12, 46, 8, f);
    wheel(p, 44, 48, 6, f);
    // フレーム（ハンドル → 前の 車輪・まん中・うしろの にだい）
    seg(p, 12, 46, 15, 26 + d, FR, 2.2);
    seg(p, 15, 34 + d, 38, 40, FR, 2.4);
    seg(p, 30, 30 + d, 33, 40, FRD, 2);
    seg(p, 33, 41, 44, 48, FRD, 2);
    box(p, 34, 37 + d, 14, 3, FR);
    // サドル・ハンドル
    box(p, 27, 28 + d, 8, 3, '#2a2228');
    seg(p, 13, 25 + d, 18, 24 + d, METAL, 1.6);
    p.ellipse(13, 25 + d, 1.4, 1.4, '#2a2228');
    // おにの手の 赤い ライト
    p.ellipse(10, 30 + d, 1.8, 1.8, '#ff3a2a');
    p.set(9, 29 + d, '#ffd0c0');
    basket(p, 3, 31 + d);
    sash(p, 16, 25 + d, f);
    // ペダル
    const a = f === 1 ? -1 : 1;
    seg(p, 30, 40, 30 + a * 3, 43, '#5a5a6a', 1.4);
  };
  const front = (p, f, layer) => {
    const d = DY[f], cx = 20;
    if (layer === 'back') {
      for (const s of [-1, 1]) { p.ellipse(cx + s * 11, 49, 2.6, 6, TIRE); p.ellipse(cx + s * 11, 49, 1.2, 4.4, HUB); }
      box(p, cx - 13, 41 + d, 26, 3, FRD);
      flag(p, cx + 9, 14 + d, f);
      return;
    }
    p.ellipse(cx, 50, 3, 7, TIRE);
    p.ellipse(cx, 50, 1.4, 5, HUB);
    seg(p, cx, 44, cx, 30 + d, FR, 2.4);
    seg(p, cx - 7, 28 + d, cx + 7, 28 + d, METAL, 1.6);
    for (const s of [-1, 1]) p.ellipse(cx + s * 7, 28 + d, 1.4, 1.4, '#2a2228');
    basket(p, cx - 5, 32 + d);
    p.ellipse(cx, 41 + d, 1.8, 1.8, '#ff3a2a');
    sash(p, cx + 4, 28 + d, f);
  };
  const back = (p, f, layer) => {
    const d = DY[f], cx = 20;
    if (layer === 'back') {
      p.ellipse(cx, 50, 3, 7, TIRE);
      seg(p, cx - 7, 28 + d, cx + 7, 28 + d, METAL, 1.6);
      return;
    }
    for (const s of [-1, 1]) { p.ellipse(cx + s * 11, 49, 2.8, 6.4, TIRE); p.ellipse(cx + s * 11, 49, 1.3, 4.6, HUB); }
    box(p, cx - 13, 41 + d, 26, 4, FR);
    p.hline(cx - 11, cx + 11, 43 + d, FRD);
    // うしろの 反しゃ板と 旗
    p.rect(cx - 2, 44 + d, 4, 2, '#ff5a3a');
    flag(p, cx + 9, 14 + d, f);
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [56, 56] : [40, 56]),
    rider: (view, f) => (view === 'side' ? seat(31, 30 + DY[f], 33) : seat(20, 32 + DY[f], 33)),
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    // こうか: ライトの 赤い 光と、ハートの 形の あたたかい つぶ（お弁当の ゆげ）
    fx(p, view, f) {
      const [w] = view === 'side' ? [56] : [40];
      const lx = view === 'side' ? 7 : 20, ly = view === 'side' ? 30 + DY[f] : 41 + DY[f];
      if (view !== 'back') for (let k = 1; k <= 2 + f; k++) p.set(lx - (view === 'side' ? k : 0), ly + (view === 'side' ? 0 : k), rgba('#ff6a4a', 0.6 - k * 0.12));
      for (let i = 0; i < 3; i++) {
        const x = 4 + ((i * 13 + f * 5) % (w - 8)), y = 14 + ((i * 7 + f * 4) % 12);
        p.set(x, y, rgba('#ffd0d8', 0.8));
        p.set(x + 1, y, rgba('#ff8aa0', 0.7));
        p.set(x, y + 1, rgba('#ff8aa0', 0.5));
      }
    },
    shadowScale: 1.3,
  };
}

// ───────────── 技の えんしゅつ ─────────────
const ANIMS = new Set(['pta_kaichou_sig', 'kizuna_bazaar']);
const HIT = { pta_kaichou_sig: 760, kizuna_bazaar: 440 };
const SFX = { pta_kaichou_sig: 'smash', kizuna_bazaar: 'wind' };
const ONI = ['#ffffff', '#ffb0a0', '#e8301c', '#6a1a2a'];
const WARM = ['#ffffff', '#fff0c0', '#ffc070', '#ff8aa0'];
const DUST = ['#ffffff', '#f0e8d8', '#c8b898'];

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
  switch (anim) {
    case 'pta_kaichou_sig': {
      // 1) おにの手の げんこつ 3回（こい 赤の しょうげき）→ 2) 赤い たての わ（みんなを かばう）→ 3) お弁当の あたたかい 光
      fx.tintAt('rgba(106, 26, 42, 0.22)', 1300);
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) {
          fx.impact(t.x + (k - 1) * 8, t.y - 6 + k * 4, { r: 13 * sz, color: '#e8301c', delay: d + k * 110 });
          fx.sparks(t.x + (k - 1) * 8, t.y - 6 + k * 4, { colors: ONI, n: 8, speed: 120, delay: d + k * 110, life: 300, len: 5 });
        }
        fx.shock(t.x, t.y, { r0: 6, r1: 44 * sz, color: '#ff6a4a', w: 3, delay: d + 420, life: 400 });
        hitMark(t, d + 520, '#e8301c', 20);
      });
      for (let k = 0; k < 3; k++) fx.shock(W * 0.2, 104, { r0: 8 + k * 4, r1: 40 + k * 10, color: k % 2 ? '#f2c14e' : '#ffffff', w: 2.4, delay: 560 + k * 80, life: 420 });
      fx.swirl(W * 0.2, 112, WARM, { n: 16, rad: 22, h: 46, delay: 640, life: 520, size: 1.3 });
      fx.flashAt(140, '#fff0e0', 760);
      fx.hitStop(crit ? 240 : 180, 520, 1.6);
      return true;
    }
    case 'kizuna_bazaar': {
      each((t, i, d) => {
        fx.swirl(t.x, t.y + 8, DUST, { n: 14, rad: 16 * sz, h: 30, delay: d, life: 420, size: 1.2 });
        fx.gust(t.x - 30, t.y, { len: 60, amp: 3, color: '#f0e8d8', w: 1.6, dir: 1, delay: d + 120, life: 320 });
        hitMark(t, d + 440, '#c8b898', 16);
      });
      fx.hitStop(crit ? 160 : 110, 440, 1.1);
      return true;
    }
    default: return false;
  }
}

export const PTA_ART = {
  id: ID,
  outfit, body, hat, oldLook, aura,
  emblems: {},
  vehicle: { id: 'pta_sanrinsha', art: tricycleArt },
  fx: { anims: ANIMS, party: new Set(), hit: HIT, sfx: SFX, play },
};

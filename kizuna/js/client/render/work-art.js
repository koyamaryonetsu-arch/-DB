// お仕事いらい板の たのまれごと 6〜11（第41回）の 絵（render/family-art.js から まぜる）
// ・addWorkArt(ART) … 物の 絵（'mon:<id>' の NPC）
//     歌の ステージ（砂だらけ／きれい）・宿の まど・コンロ・物置の たな（よごれ／きれい）・お祭りの ぶたい・白い ハト
//     （ハミルの こわれた 橋は タイル。ハネノの 町は 人だけ〈ch5 の きまり〉なので 見晴らし台は 写真屋さん）
// ・WORK_NPC_LOOKS … 人の みため（render/chars.js の NPC_LOOKS に まぜる）
// ・addWorkVehicleArt(ART, kit) … もらう 乗り物の 絵（2D と 2.5D は 同じ 絵。kit … render/vehicle-art.js の どうぐ）
// かきかたは family-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）
import { spark } from './ch3-draw.js?v=855c00e900d9';

// ───────────── 人の みため ─────────────
export const WORK_NPC_LOOKS = {
  // ドゥナの 港の 世話役ナジャ（オレンジの ベスト・青い バンダナ）・船乗り（白い ぼうし・ひげ）
  fq_port_boss: { hair: 3, hairStyle: 'pony', skin: 2, outfit: 'vest', cloth: '#e0883a', female: true, hat: 'bandana', hatColor: '#3a8ad8' },
  fq_sailor: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'vest', cloth: '#2a4a8a', hat: 'cap', hatColor: '#f4f4f4', beard: true },
  // ハミルの 村の 役場の サミール（みどりの スーツ・めがね）
  fq_officer: { hair: 0, hairStyle: 'short', skin: 2, outfit: 'suit', cloth: '#5a7a6a', tie: '#e0c060', glasses: true },
  // カモメキッズ（白い ユニフォーム・青い ぼうし）
  fq_ball_kid: { hair: 1, hairStyle: 'short', skin: 0, outfit: 'baseball', cloth: '#f4f4f4', trim: '#3a7ad8', hat: 'bbcap', hatColor: '#3a7ad8', small: true },
  fq_ball_kid2: { hair: 2, hairStyle: 'short', skin: 1, outfit: 'baseball', cloth: '#f4f4f4', trim: '#3a7ad8', hat: 'bbcap', hatColor: '#3a7ad8', small: true },
  fq_ball_girl: { hair: 3, hairStyle: 'pony', skin: 0, outfit: 'baseball', cloth: '#f4f4f4', trim: '#3a7ad8', hat: 'bbcap', hatColor: '#3a7ad8', female: true, small: true },
  fq_ball_kid3: { hair: 0, hairStyle: 'short', skin: 2, outfit: 'baseball', cloth: '#f4f4f4', trim: '#3a7ad8', hat: 'bbcap', hatColor: '#3a7ad8', small: true },
  // ハネノの 観光係ミソラ（空色の ドレス・白い リボン）・雲わたあめ屋（ピンクの エプロン）
  fq_guide: { hair: 6, hairStyle: 'long', skin: 0, outfit: 'dress', cloth: '#7ac8e8', female: true, hat: 'ribbon', hatColor: '#ffffff' },
  fq_candy_man: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'apron', cloth: '#f4b8d8', hat: 'chef', beard: true },
  // ハネノの 見晴らし台の 写真屋さん（みどりの ベスト・ぼうし）
  fq_photographer: { hair: 2, hairStyle: 'short', skin: 0, outfit: 'vest', cloth: '#5a8a4a', hat: 'cap', hatColor: '#8a5a32', glasses: true },
  // ユノハの 宿の 大おかみハルエ（むらさきの きもの・つえ）
  fq_okami: { hair: 5, hairStyle: 'bun', skin: 0, outfit: 'robe', robeMain: '#5a3a6a', robeTrim: '#e8c8a0', female: true, cane: true, hunch: true },
  // サファラの お祭りの 係ファリダ（だいだい色の ドレス・ショール）・手品師マジーロ（黒い スーツ・赤い マント）
  fq_festival: { hair: 2, hairStyle: 'long', skin: 2, outfit: 'dress', cloth: '#e8a03a', female: true, hat: 'shawl', hatColor: '#c83a8a' },
  fq_magician: { hair: 0, hairStyle: 'short', skin: 1, outfit: 'suit', cloth: '#22222c', tie: '#c83a3a', cape: '#8a1a2a', hat: 'wizard', hatColor: '#22222c' },
};

// ───────────── 6. 港の ステージ（clean … 砂を はらった あと）─────────────
const ST = { W: '#b8834e', WL: '#d8a870', WD: '#6a4428', R: '#c83a4a', RD: '#7a1e2e', Y: '#f2c14e', S: '#e0c890', SD: '#b89a5a', B: '#3a7ad8' };
function stageArt(clean) {
  return (g, f) => {
    const C = ST;
    // うしろの わく・赤い まく
    g.rect(0.06, 0.08, 0.06, 0.56, C.WD); g.rect(0.88, 0.08, 0.06, 0.56, C.WD);
    g.poly([[0.12, 0.14], [0.26, 0.14], [0.18, 0.6], [0.12, 0.6]], clean ? C.R : C.RD);
    g.poly([[0.88, 0.14], [0.74, 0.14], [0.82, 0.6], [0.88, 0.6]], clean ? C.R : C.RD);
    g.rect(0.04, 0.04, 0.92, 0.1, clean ? C.R : C.RD);
    // ゆか（木の 台）と 階だん
    g.rect(0.02, 0.58, 0.96, 0.08, C.WL);
    g.rect(0.02, 0.66, 0.96, 0.22, C.W);
    for (let i = 0; i < 6; i++) g.rect(0.06 + i * 0.16, 0.7, 0.01, 0.16, C.WD);
    g.rect(0.4, 0.88, 0.2, 0.08, C.WD);
    if (clean) {
      // ライト（チカチカ）・星
      for (let i = 0; i < 6; i++) g.ell(0.14 + i * 0.145, 0.09, 0.025, 0.035, (i + f) % 2 ? C.Y : C.B);
      spark(g, f ? 0.5 : 0.36, 0.34, 0.1, C.Y, '#ffffff');
    } else {
      // つもった 砂
      g.ell(0.3, 0.6, 0.18, 0.06, C.SD); g.ell(0.3, 0.58, 0.14, 0.04, C.S);
      g.ell(0.7, 0.62, 0.2, 0.06, C.SD); g.ell(0.68, 0.6, 0.15, 0.04, C.S);
      g.ell(0.5, 0.8, 0.12, 0.05, C.S);
      if (f) g.ell(0.18, 0.4, 0.04, 0.03, C.S);
    }
  };
}

// ───────────── 10. 宿の まど・コンロ・物置の たな（clean … そうじの あと）─────────────
const IN = { W: '#a8743a', WD: '#6a4420', WL: '#d4a060', G: '#e8eef4', GD: '#b8c4d0', B: '#8ac8f0', BL: '#d8f0ff', N: '#ffffff', M: '#8a90a0', MD: '#4a5060', ML: '#d8dce4', O: '#7a5a2a', OD: '#4a3418', F: '#f2853a', Y: '#f2c14e', D: '#a8a49a', DL: '#d0ccc0', X: '#c89a5a' };
function windowArt(clean) {
  return (g, f) => {
    const C = IN;
    g.rect(0.08, 0.1, 0.84, 0.8, C.WD);
    g.rect(0.12, 0.14, 0.76, 0.72, clean ? C.B : C.G);
    if (clean) {
      // 雪景色（白い 山と 雪）
      g.poly([[0.12, 0.86], [0.36, 0.5], [0.6, 0.86]], C.N);
      g.poly([[0.42, 0.86], [0.66, 0.56], [0.88, 0.86]], C.BL);
      g.ell(f ? 0.3 : 0.7, 0.3, 0.03, 0.03, C.N);
      spark(g, 0.76, 0.24, 0.07, C.N, '#ffffff');
    } else {
      // くもり（白い もや）
      g.ell(0.36, 0.4, 0.2, 0.14, C.GD); g.ell(0.64, 0.62, 0.22, 0.16, C.GD);
      if (f) g.ell(0.5, 0.3, 0.1, 0.06, C.N);
    }
    g.rect(0.48, 0.14, 0.04, 0.72, C.W);
    g.rect(0.12, 0.48, 0.76, 0.04, C.W);
    g.rect(0.06, 0.86, 0.88, 0.06, C.WL);
  };
}
function stoveArt(clean) {
  return (g, f) => {
    const C = IN;
    g.rect(0.06, 0.3, 0.88, 0.62, C.M);
    g.rect(0.06, 0.3, 0.88, 0.08, C.ML);
    g.rect(0.14, 0.5, 0.72, 0.34, C.MD);
    // 火の 口と なべ
    g.ell(0.32, 0.32, 0.14, 0.04, C.MD); g.ell(0.68, 0.32, 0.14, 0.04, C.MD);
    g.rect(0.56, 0.12, 0.26, 0.18, C.ML);
    g.rect(0.52, 0.12, 0.34, 0.04, C.M);
    if (clean) {
      g.ell(0.32, 0.3, 0.08, 0.03, f ? C.F : C.Y);
      spark(g, 0.24, 0.6, 0.08, C.N, '#ffffff');
    } else {
      // 油の しみ
      g.ell(0.3, 0.62, 0.1, 0.06, C.O); g.ell(0.62, 0.72, 0.12, 0.06, C.OD); g.ell(0.44, 0.42, 0.06, 0.03, C.O);
      g.ell(0.7, 0.2, 0.06, 0.04, C.O);
    }
  };
}
function closetArt(clean) {
  return (g, f) => {
    const C = IN;
    g.rect(0.08, 0.04, 0.84, 0.92, C.WD);
    g.rect(0.12, 0.08, 0.76, 0.84, C.W);
    for (const y of [0.34, 0.62, 0.88]) g.rect(0.12, y, 0.76, 0.05, C.WD);
    if (clean) {
      // きちんと ならんだ 箱・たたんだ ふとん
      g.rect(0.18, 0.18, 0.24, 0.16, C.X); g.rect(0.5, 0.2, 0.3, 0.14, C.BL);
      g.rect(0.18, 0.46, 0.6, 0.16, C.N); g.rect(0.18, 0.54, 0.6, 0.02, C.GD);
      g.rect(0.22, 0.74, 0.22, 0.14, C.X); g.rect(0.52, 0.74, 0.22, 0.14, C.X);
      spark(g, f ? 0.78 : 0.7, 0.12, 0.07, C.N, '#ffffff');
    } else {
      // ほこりの 山・くもの す
      for (const [x, y] of [[0.3, 0.32], [0.66, 0.32], [0.44, 0.6], [0.7, 0.86], [0.26, 0.86]]) { g.ell(x, y, 0.14, 0.05, C.D); g.ell(x, y - 0.02, 0.09, 0.03, C.DL); }
      g.line([[0.12, 0.08], [0.3, 0.2]], C.DL, 0.7); g.line([[0.2, 0.08], [0.12, 0.22]], C.DL, 0.7);
      if (f) g.ell(0.56, 0.18, 0.05, 0.03, C.DL);
    }
  };
}

// ───────────── 11. お祭りの ぶたい・白い ハト ─────────────
const MS = { W: '#8a5a32', WL: '#b8834e', WD: '#4a2e18', P: '#6a3aa8', PL: '#9a6ad8', PD: '#3a1e6a', Y: '#f2c14e', R: '#e04a5a', G: '#4ac86a' };
function magicStageArt(g, f) {
  const C = MS;
  // 星の まく（むらさき）
  g.rect(0.08, 0.06, 0.84, 0.54, C.PD);
  g.poly([[0.08, 0.06], [0.3, 0.06], [0.18, 0.6], [0.08, 0.6]], C.P);
  g.poly([[0.92, 0.06], [0.7, 0.06], [0.82, 0.6], [0.92, 0.6]], C.P);
  g.rect(0.06, 0.02, 0.88, 0.08, C.PL);
  for (const [x, y] of [[0.4, 0.24], [0.6, 0.18], [0.5, 0.42], [0.66, 0.38]]) spark(g, x, y, 0.06, C.Y, '#ffffff');
  // ゆかと 旗
  g.rect(0.02, 0.6, 0.96, 0.08, C.WL);
  g.rect(0.02, 0.68, 0.96, 0.24, C.W);
  g.rect(0.02, 0.9, 0.96, 0.04, C.WD);
  const flags = [C.R, C.Y, C.G, C.PL, C.R, C.Y];
  flags.forEach((c, i) => g.poly([[0.1 + i * 0.14, 0.1], [0.18 + i * 0.14, 0.1], [0.14 + i * 0.14, f ? 0.2 : 0.18]], c));
}
const DV = { W: '#ffffff', G: '#d8dce4', GD: '#a8acb8', Y: '#f2a83a', K: '#2a2a34', P: '#e88aa0' };
function doveArt(g, f) {
  const C = DV;
  g.ell(0.48, 0.6, 0.3, 0.22, C.G);
  g.ell(0.46, 0.56, 0.26, 0.18, C.W);
  g.ell(0.74, 0.36, 0.14, 0.14, C.W);
  g.poly([[0.86, 0.34], [0.98, 0.38], [0.86, 0.42]], C.Y);
  g.ell(0.77, 0.32, 0.025, 0.03, C.K);
  g.poly([[0.2, 0.56], [0.02, f ? 0.36 : 0.5], [0.24, 0.66]], C.GD);
  g.poly([[0.36, 0.5], [f ? 0.5 : 0.56, f ? 0.2 : 0.36], [0.62, 0.56]], C.G);
  g.line([[0.42, 0.8], [0.4, 0.94]], C.P, 1); g.line([[0.56, 0.8], [0.58, 0.94]], C.P, 1);
}

export function addWorkArt(ART) {
  ART.fq_stage_dusty = { size: [48, 28], field: 48, npc: 1, pal: Object.values(ST), draw: stageArt(false) };
  ART.fq_stage = { size: [48, 28], field: 48, npc: 1, pal: Object.values(ST), draw: stageArt(true) };
  ART.fq_window = { size: [16, 14], field: 16, pal: Object.values(IN), draw: windowArt(false) };
  ART.fq_window_clean = { size: [16, 14], field: 16, pal: Object.values(IN), draw: windowArt(true) };
  ART.fq_stove = { size: [16, 16], field: 16, pal: Object.values(IN), draw: stoveArt(false) };
  ART.fq_stove_clean = { size: [16, 16], field: 16, pal: Object.values(IN), draw: stoveArt(true) };
  ART.fq_closet = { size: [16, 20], field: 20, pal: Object.values(IN), draw: closetArt(false) };
  ART.fq_closet_clean = { size: [16, 20], field: 20, pal: Object.values(IN), draw: closetArt(true) };
  ART.fq_magic_stage = { size: [48, 30], field: 48, npc: 1, pal: Object.values(MS), draw: magicStageArt };
  ART.fq_dove = { size: [12, 10], field: 12, pal: Object.values(DV), draw: doveArt };
}

// ───────────── もらう 乗り物 ─────────────
export function addWorkVehicleArt(ART, kit) {
  const { carArt, deckArt, box, seg, wheel, poly, rgba, shade, twinkle } = kit;
  // ライブトラック（ピンクの トラック・うしろの 荷台が ステージ・ライト）
  ART.live_truck = carArt({
    body: '#ff7ab8', len: 62, h: 12, roof: 'cab', cab: [4, 22], stripe: '#ffffff', wheelR: 5, wheelX: [13, 50], seatX: 13, roofCol: '#f4f0f8', winH: 14,
    extra(p, view, f, layer, g) {
      if (layer !== 'front') return;
      if (view === 'side') {
        // ステージ（荷台）・まくと ライト
        box(p, 23, g.top - 3, 38, 4, '#8a5a32', { r: 0 });
        p.rect(24, g.rt - 2, 2, g.top - g.rt - 1, '#6a4428');
        p.rect(58, g.rt - 2, 2, g.top - g.rt - 1, '#6a4428');
        box(p, 23, g.rt - 4, 38, 3, '#c83a4a', { r: 1 });
        for (let i = 0; i < 6; i++) p.rect(26 + i * 6, g.rt - 3, 2, 1, (i + f) % 2 ? '#f2c14e' : '#8ad0ff');
        // マイクスタンド
        seg(p, 42, g.top - 3, 42, g.rt + 4, '#4a4a54', 1);
        p.ellipse(42, g.rt + 3, 1.2, 1.2, '#c8ccd8');
      } else {
        box(p, g.cx - 13, g.rt - 6, 26, 3, '#c83a4a', { r: 1 });
        for (let i = 0; i < 4; i++) p.rect(g.cx - 10 + i * 6, g.rt - 5, 2, 1, (i + f) % 2 ? '#f2c14e' : '#8ad0ff');
      }
    },
    fx(p, view, f, { w, top }) {
      // ライトの 光と 音ぷ
      if (view === 'side') { p.set(36 + f * 8, top - 22, rgba('#fff4a0', 0.8)); twinkle(p, f ? 30 : 52, top - 26, rgba('#ff9ad0', 0.85)); }
      else twinkle(p, f ? 6 : w - 6, top - 22, rgba('#ff9ad0', 0.85));
    },
    shadowScale: 2.1,
  });
  // ロードローラー（黄色い 車・前に 大きな ローラー）
  ART.road_roller = carArt({
    body: '#f2c632', len: 58, h: 12, roof: 'cab', cab: [28, 48], stripe: '#2a2630', wheelR: 6, wheelX: [44, 50], seatX: 38, roofCol: '#f4f4e8', winH: 14, noGrill: true,
    extra(p, view, f, layer, g) {
      if (layer !== 'front') return;
      const yel = '#f2c632';
      if (view === 'side') {
        // 前の 大きな ローラー（左が 前）
        p.ellipse(12, g.G - 9, 10, 9, '#2a2630');
        p.ellipse(12, g.G - 9, 8.6, 7.6, '#8a8e9a');
        p.ellipse(12, g.G - 9, 3, 3, '#5a5e6a');
        const a = (f % 3) * 1.1;
        seg(p, 12 + Math.cos(a) * 7, g.G - 9 + Math.sin(a) * 6, 12 - Math.cos(a) * 7, g.G - 9 - Math.sin(a) * 6, '#c8ccd8', 1);
        box(p, 4, g.G - 22, 18, 4, yel, { r: 1 });
      } else {
        // ローラー（横に 長い）
        const y = view === 'front' ? g.G - 6 : g.G - 4;
        box(p, g.x0 - 2, y - 4, g.w + 4, 8, '#8a8e9a', { r: 2 });
        p.hline(Math.round(g.x0), Math.round(g.x0 + g.w - 1), y - 2 + (f % 2) * 3, '#c8ccd8');
        if (view === 'front') p.rect(g.cx - 5, g.top + 2, 10, 2, '#2a2630');
      }
    },
    fx(p, view, f, { top }) {
      if (view !== 'side') return;
      for (let i = 0; i < 2; i++) p.ellipse(40 + i * 3, top - 22 - i * 3 - (f ? 2 : 0), 1.8, 1.2, rgba('#c8c4b0', 0.6));
    },
    shadowScale: 2,
  });
  // カモメキッズの チームバス（白い バス・青い 線・カモメの マーク）
  ART.team_bus = carArt({
    body: '#f4f4f8', len: 66, h: 13, roof: 'long', cab: [6, 60], windows: 4, stripe: '#3a7ad8', stripe2: '#3a7ad8', wheelR: 5, wheelX: [14, 54], seatX: 20, roofCol: '#d8e4f4', winH: 13,
    extra(p, view, f, layer, g) {
      if (layer !== 'front') return;
      if (view === 'side') {
        // カモメの マーク（しっぽの 近く）
        seg(p, 44, g.top + 3, 47, g.top + 5, '#3a7ad8', 1); seg(p, 47, g.top + 5, 50, g.top + 3, '#3a7ad8', 1);
        p.rect(28, g.top + 3, 10, 2, '#f2c14e');
      } else if (view === 'front') {
        p.rect(g.cx - 6, g.rt + 1, 12, 2, '#2a3a8a'); // 行き先の 板
        p.rect(g.cx - 4, g.rt + 1, 8, 1, '#f2c14e');
      }
    },
    shadowScale: 2.2,
  });
  // 放送車（白い 車・やねに パラボラアンテナ・赤い 線）
  ART.relay_car = carArt({
    body: '#f4f4f8', len: 62, h: 12, roof: 'cab', cab: [4, 24], stripe: '#e83a3a', wheelR: 5, wheelX: [13, 50], seatX: 14, roofCol: '#d8dce4', winH: 14,
    extra(p, view, f, layer, g) {
      if (layer !== 'front') return;
      if (view === 'side') {
        // うしろの 荷台（箱）と アンテナ
        box(p, 24, g.rt + 2, 36, g.top - g.rt - 1, '#e8eaf0', { r: 1 });
        p.rect(28, g.rt + 6, 8, 4, '#2a2438');
        seg(p, 48, g.rt + 2, 48, g.rt - 4, '#8a8e9a', 1.2);
        poly(p, [[40, g.rt - 4], [56, g.rt - 10], [57, g.rt - 7], [42, g.rt - 1]], '#d8dce4');
        p.ellipse(49, g.rt - 5, 1.4, 1.4, f ? '#e83a3a' : '#8a1a1a');
      } else {
        seg(p, g.cx, g.rt, g.cx, g.rt - 5, '#8a8e9a', 1.2);
        p.ellipse(g.cx, g.rt - 8, 8, 4, '#d8dce4');
        p.ellipse(g.cx, g.rt - 8, 5, 2.4, '#b8bcc8');
        p.ellipse(g.cx, g.rt - 8, 1.2, 1.2, f ? '#e83a3a' : '#8a1a1a');
      }
    },
    fx(p, view, f, { w, top }) {
      // 電波
      const x = view === 'side' ? 52 : w / 2;
      for (let i = 0; i < 2; i++) p.set(x + (view === 'side' ? 4 + i * 3 : -2 + i * 4), top - 32 - i * 2 - f, rgba('#8ad0ff', 0.8));
    },
    shadowScale: 2.1,
  });
  // 大きな 買い物カート（人が かごの 中に 立つ。銀色の あみ・赤い 取っ手）
  ART.big_cart = deckArt({
    w: 48, fw: 34, h: 52, frames: 2, riderFrame: 1, cx: 22, deckY: 6,
    paint(p, view, f, layer, { g, cx, H }) {
      const G = H - 2;
      const wire = '#c8ccd8', wireD = '#8a8e9a', red = '#e04a3a';
      if (view === 'side') {
        if (layer === 'back') { box(p, 8, g - 16, 30, 2, wireD, { r: 0 }); return; }
        // かご（あみ）
        p.hline(8, 37, g - 16, wire); p.hline(9, 36, g, wire);
        for (let x = 8; x <= 37; x += 4) seg(p, x, g - 16, x + 1, g, wire, 1);
        for (let y = g - 12; y < g; y += 4) p.hline(8, 37, y, wireD);
        // 取っ手
        seg(p, 37, g - 16, 42, g - 20, wire, 1.2);
        p.rect(41, g - 21, 3, 2, red);
        // 足と 車輪
        seg(p, 10, g, 10, G - 3, wireD, 1); seg(p, 35, g, 35, G - 3, wireD, 1);
        for (const x of [10, 35]) wheel(p, x, G - 2, 2.2, f, { spokes: false, rim: '#4a4a54' });
        return;
      }
      if (layer === 'back') { p.hline(cx - 13, cx + 13, g - 16, wireD); return; }
      p.hline(cx - 13, cx + 13, g - 14, wire); p.hline(cx - 12, cx + 12, g, wire);
      for (let x = cx - 13; x <= cx + 13; x += 4) seg(p, x, g - 14, x, g, wire, 1);
      for (let y = g - 10; y < g; y += 4) p.hline(cx - 13, cx + 13, y, wireD);
      if (view === 'back') p.rect(cx - 6, g - 18, 12, 2, red);
      for (const s of [-1, 1]) { seg(p, cx + s * 11, g, cx + s * 11, G - 3, wireD, 1); p.rect(cx + s * 11 - 1, G - 3, 3, 3, '#4a4a54'); p.set(cx + s * 11, G - 2 + (f % 2), '#8a8e9a'); }
    },
    shadowScale: 1.6,
  });
  // 大きな シルクハット（人が ぼうしの 中に 立って、ふわりと うく。赤い リボン・星）
  ART.silk_hat = deckArt({
    w: 40, fw: 36, h: 56, lift: 5, frames: 2, riderFrame: 1, deckY: 2,
    paint(p, view, f, layer, { g, cx }) {
      const blk = '#22222c', blkL = '#3a3a4a', red = '#c83a3a';
      const rx = view === 'side' ? 12 : 13;
      if (layer === 'back') { p.ellipse(cx, g - 13, rx, 2.4, blkL); return; }
      // つば（下）と 筒
      p.ellipse(cx, g + 1, rx + 5, 3, blk);
      box(p, cx - rx, g - 13, rx * 2, 14, blk, { r: 0 });
      p.rect(cx - rx, g - 6, rx * 2, 3, red);
      p.rect(cx - rx + 2, g - 12, 2, 5, blkL);
      p.ellipse(cx, g - 13, rx, 2, shade(blk, 0.2));
    },
    fx(p, view, f, { g, cx }) {
      twinkle(p, cx + (f ? -14 : 14), g - 18, rgba('#fff6b0', 0.9), true);
      twinkle(p, cx + (f ? 10 : -10), g + 6, rgba('#ffffff', 0.7));
    },
    shadowScale: 1.5,
  });
}

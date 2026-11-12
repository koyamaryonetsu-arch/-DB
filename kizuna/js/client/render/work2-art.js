// お仕事いらい板の たのまれごと 12〜17（第65回 D2）の 絵（render/work-art.js から まぜる）
// ・addWork2Art(ART) … 物の 絵（'mon:<id>' の NPC）: 竜守りの村の 大岩・ドゥナの からくりゲーム機
//     （サーカスの 魔物は 今までの 魔物の 絵。星読みの里・ハネノの町は 人の 絵だけ〈第5章の きまり〉。ホシフル村の 研究の 物は 見えない しらべる 所）
// ・WORK2_NPC_LOOKS … 人の みため（render/chars.js の NPC_LOOKS に まざる）
// ・addWork2VehicleArt(ART, kit) … もらう 乗り物の 絵（お天気の気球・金色のふわふわ雲。2D と 2.5D は 同じ 絵）
// かきかたは work-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）
import { spark } from './ch3-draw.js?v=2e6dc0959ea0';

// ───────────── 人の みため ─────────────
export const WORK2_NPC_LOOKS = {
  // カモメ港の サーカスの 団長ピエール（赤い スーツ・黒い マント・ひげ）
  fq_ringmaster: { hair: 0, hairStyle: 'short', skin: 1, outfit: 'suit', cloth: '#c83a3a', tie: '#f2c14e', cape: '#22222c', beard: true, hat: 'cap', hatColor: '#22222c' },
  // ハネノの お笑いコンビ「ふわふわコンビ」（ボケの ソラマメ: 黄色い ジャケット／ツッコミの マメタ: 青い ジャケット・マスクの かわりに ショール）
  fq_comedian: { hair: 2, hairStyle: 'spiky', skin: 0, outfit: 'suit', cloth: '#f2c14e', tie: '#e04a5a' },
  fq_comedian2: { hair: 0, hairStyle: 'short', skin: 1, outfit: 'suit', cloth: '#3a7ad8', tie: '#f4f4f4', glasses: true, hat: 'shawl', hatColor: '#f4f4f4' },
  // ドゥナの からくり屋ギアン（茶色の エプロン・めがね・頭に バンダナ）
  fq_tinker: { hair: 5, hairStyle: 'short', skin: 2, outfit: 'apron', cloth: '#8a5a32', beard: true, glasses: true, hat: 'bandana', hatColor: '#4a8a8a' },
};

// ───────────── 14. 竜守りの村の 大岩（雪を かぶった 大きな 岩）─────────────
const RK = { R: '#7a7a86', RL: '#a4a4b0', RD: '#4a4a56', S: '#f4f8fc', SD: '#c8d4e4', M: '#5a6a4a' };
function boulderArt(g, f) {
  const C = RK;
  g.ell(0.5, 0.9, 0.46, 0.08, C.SD);
  g.poly([[0.06, 0.88], [0.1, 0.5], [0.3, 0.2], [0.58, 0.1], [0.82, 0.24], [0.96, 0.56], [0.92, 0.88]], C.R);
  g.poly([[0.14, 0.56], [0.32, 0.26], [0.56, 0.16], [0.5, 0.4], [0.3, 0.6]], C.RL);
  g.poly([[0.62, 0.5], [0.9, 0.6], [0.88, 0.86], [0.6, 0.86]], C.RD);
  g.line([[0.4, 0.46], [0.52, 0.66], [0.48, 0.84]], C.RD, 1);
  // 上に つもった 雪
  g.poly([[0.24, 0.3], [0.36, 0.18], [0.58, 0.1], [0.8, 0.22], [0.74, 0.3], [0.56, 0.24], [0.4, 0.3]], C.S);
  g.ell(0.18, 0.86, 0.12, 0.05, C.S); g.ell(0.8, 0.88, 0.14, 0.05, C.S);
  g.ell(0.7, 0.72, 0.04, 0.03, C.M);
  if (f) g.ell(0.86, 0.36, 0.02, 0.02, C.S);
}

// ───────────── 17. ドゥナの からくりゲーム機（木の はこ・画面・ボタン・歯車）─────────────
const GM = { W: '#a8743a', WD: '#6a4420', WL: '#d4a060', K: '#1e2234', B: '#3ac8e8', G: '#4ac86a', Y: '#f2c14e', R: '#e04a5a', M: '#c8ccd8', MD: '#8a8e9a' };
function gameMachineArt(g, f) {
  const C = GM;
  g.rect(0.12, 0.06, 0.76, 0.9, C.WD);
  g.rect(0.16, 0.1, 0.68, 0.82, C.W);
  g.rect(0.16, 0.1, 0.68, 0.08, C.WL);
  // 画面（すなぼうずが 走る）
  g.rect(0.22, 0.22, 0.56, 0.32, C.K);
  g.rect(0.26, 0.46, 0.48, 0.04, C.Y);
  g.ell(f ? 0.42 : 0.5, 0.4, 0.05, 0.05, C.WL);
  g.ell(0.66, 0.3, 0.03, 0.03, f ? C.B : C.G);
  // ボタンと レバー
  g.rect(0.2, 0.6, 0.6, 0.12, C.WD);
  g.ell(0.34, 0.64, 0.05, 0.04, C.R); g.ell(0.5, 0.64, 0.05, 0.04, C.B);
  g.line([[0.7, 0.66], [0.7, 0.58]], C.MD, 1); g.ell(0.7, 0.57, 0.035, 0.03, C.R);
  // 横の 歯車
  g.ell(0.84, 0.8, 0.1, 0.1, C.MD); g.ell(0.84, 0.8, 0.05, 0.05, C.M);
  spark(g, f ? 0.28 : 0.72, 0.14, 0.06, C.Y, '#ffffff');
}

export function addWork2Art(ART) {
  ART.fq_boulder = { size: [36, 28], field: 36, npc: 1, pal: Object.values(RK), draw: boulderArt };
  ART.fq_game_machine = { size: [16, 22], field: 22, pal: Object.values(GM), draw: gameMachineArt };
}

// ───────────── もらう 乗り物 ─────────────
export function addWork2VehicleArt(ART, kit) {
  const { deckArt, box, seg, rgba, twinkle } = kit;
  // お天気の気球（人が かごに 乗る。上に しましまの 気球・風見の はた）
  ART.weather_balloon = deckArt({
    w: 40, fw: 36, h: 60, lift: 6, frames: 2, riderFrame: 1, deckY: 2,
    paint(p, view, f, layer, { g, cx }) {
      const bk = '#8a5a32', bkD = '#5a3a1e';
      if (layer === 'back') {
        // 気球（うしろ）と つな
        p.ellipse(cx, g - 34, 13, 14, '#3a8ae8');
        for (let i = -1; i <= 1; i += 2) p.ellipse(cx + i * 7, g - 34, 3, 13, '#f4f4f8');
        p.ellipse(cx, g - 34, 3, 13.5, '#f2c14e');
        seg(p, cx - 9, g - 22, cx - 7, g - 10, '#4a4a54', 1);
        seg(p, cx + 9, g - 22, cx + 7, g - 10, '#4a4a54', 1);
        return;
      }
      // かご
      box(p, cx - 9, g - 10, 18, 11, bk, { r: 1 });
      p.rect(cx - 9, g - 10, 18, 2, bkD);
      for (let x = cx - 6; x <= cx + 6; x += 4) p.rect(x, g - 7, 1, 7, bkD);
      // 風見の はた
      seg(p, cx + 9, g - 10, cx + 9, g - 18, '#4a4a54', 1);
      p.rect(cx + 10, g - 18, f ? 5 : 4, 3, '#e04a5a');
    },
    fx(p, view, f, { g, cx }) {
      twinkle(p, cx + (f ? -16 : 16), g - 40, rgba('#ffffff', 0.8));
    },
    shadowScale: 1.4,
  });
  // 金色のふわふわ雲（人が 雲の 上に 立つ。ふわりと うく）
  ART.gold_cloud = deckArt({
    w: 44, fw: 40, h: 48, lift: 6, frames: 2, riderFrame: 1, deckY: 2,
    paint(p, view, f, layer, { g, cx }) {
      const gold = '#f2c14e', goldL = '#fff0a0', goldD = '#c8902a';
      if (layer === 'back') { p.ellipse(cx, g - 2, 15, 4, goldD); return; }
      p.ellipse(cx - 9, g + 1, 8, 5, gold);
      p.ellipse(cx + 9, g + 1, 8, 5, gold);
      p.ellipse(cx, g - 1, 10, 6, gold);
      p.ellipse(cx - 3, g - 3, 5, 2.4, goldL);
      p.ellipse(cx + 8, g - 1, 3, 1.6, goldL);
      p.ellipse(cx + (f ? -17 : 17), g + 3, 3, 2, gold);
    },
    fx(p, view, f, { g, cx }) {
      twinkle(p, cx + (f ? -12 : 12), g - 10, rgba('#fff6b0', 0.9), true);
      twinkle(p, cx + (f ? 14 : -14), g + 6, rgba('#ffffff', 0.7));
    },
    shadowScale: 1.5,
  });
}

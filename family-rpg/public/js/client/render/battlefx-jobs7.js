// 第33回の 新しい 職業 11この 技の エフェクト（手品師・かいとう・魔法学校・3年B組の担任・れん金術師・美少女戦士 の 道）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く（例 anim: 'kaito_kid_sig'）。
// battlefx.js の play() で battlefx-jobs6.js の つぎに よばれる（ここに ない anim なら false を かえす）。
//
// 看板の技（11この 職業 ぜんぶ。なまえは '<職業の id>_sig'。A の 技の id と おなじ なので、データの anim も この なまえに する）
//  magician_sig       手品師        … 赤い まくが おりて 上がると、光の ハトと 紙ふぶき（イリュージョン）
//  kaito_sig          かいとう      … 白い マントが ひるがえって 一閃、宝石が キラッ
//  kaito_kid_sig      かいとうキッド … 白い けむりと 光（目くらまし）→ トランプ銃の トランプが 何まいも ささる → 月を バックに 白い マントの かげが 空を よこぎり、トランプが まう
//  wizard_student_sig 魔法学校の生徒 … つえから 太い 赤い 光線（止まる 星が まわる）
//  harry_sig          ハリーポッター … 守護の 光（白く 光る シカが かけて きて つきぬける）→ 空から いなずま
//  homeroom_3b_sig    3年B組の担任  … 黒板が 出て チョークで「人」の 字 → 説教の 文字（コラッ！）が 敵に ぶつかる・チョークの こな
//  alchemist_sig      れん金術師    … 青い れん成の いなずま → 地面から 石の 大男が 出て、うでで なぎはらう
//  state_alchemist_sig 国家れん金術師 … 敵の 足もとに れん金の 円 → 大きな 爆発
//  fullmetal_sig      はがねのれん金術師 … 手を 合わせる（パンッ）→ 地面に れん金の 円と 青い 光 → 地面から 石の やりが 2回 つき出る
//  sailor_soldier_sig 美少女戦士    … 銀の ティアラが 光の わに なって とぶ
//  sailor_moon_sig    セーラームーン … 夜の 空に 大きな 三日月 → 月の 光が ふりそそぐ → 金の ティアラが とび、ピンクの 光が あふれる
// 上級職・基本職の 技に あう えんしゅつ
//  r33_card_throw  トランプを なげる（手品師・かいとう）     r33_hat_trick  シルクハットから ハトと 紙ふぶき（手品師）
//  r33_smoke_flash 目くらまし（白い けむりと 光。かいとう）  r33_steal      ぬすむ（キラッ と 光って 宝が こちらへ。かいとう）
//  r33_glider      ハンググライダーで にげる・かわす（みかた） r33_spell_ray  つえから 呪文の 光（魔法学校の生徒）
//  r33_disarm      武器を うばう 呪文（赤い 光と 剣が とんで いく） r33_patronus 守護の 光（白く 光る シカ。みかたにも 敵にも）
//  r33_broom       ほうきで とぶ（すばやさ。みかた）       r33_lightning  ひたいの きずの いなずま（空から）
//  r33_sekkyo      説教で 止める（文字の ふきだし）        r33_hito_ji    「人という字は…」（みかたを 強く）
//  r33_alchemy     れん金の 円と 青い 光で ドン（れん金術師）  r33_alchemy_spear 地面から 石の やり（国家れん金術師）
//  r33_alchemy_wall 地面から 石の かべ（みかたを 守る）     r33_mech_arm   機械の うでの 刃で きる
//  r33_watch       銀時計が 光って れん金の 円が 大きく（国家れん金術師）
//  r33_sailor_beam ハートと 星の 光（美少女戦士）          r33_sailor_guard リボンの 光で 仲間を 守る（みかた）
//  r33_moon_tiara  ティアラが 光の わに なって とぶ        r33_moon_heal  月の 光で 回復（みかた）
// 男の子の 美少女戦士・セーラームーン（タキシード仮面ふう。技の データの masc.anim。shared/ability-label.js）
//  r33_bara       赤い バラが 飛んで ささる（赤いバラの一撃・月の光が見ているぞ！）
//  r33_bara_ring  光る 大きな バラが ブーメランの ように 回って もどる（ローズ・ブーメラン・ローズ・スパイラル・アタック）
//  r33_cane       ステッキの 一撃（白い 光の すじと 星。ステッキさばき）
//  r33_tux_smash  夜空と 三日月 → ステッキから 白い 光の 波 → バラが ささる（タキシード・ラ・スマッシャー）
// ・どれも 2.2びょう いないで おわる。あたる じかんは JOB7_HIT（battle.js の HIT_DELAY に まぜる）
// ・みかたに つかう えんしゅつ（PARTY_ANIMS7）は、battle.js が がめんの 下の まん中に 出す

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));
const FONT = 'bold 18px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif';

// えんしゅつの なまえ（ぜんぶ）
export const R33_SIG_JOBS = ['magician', 'kaito', 'kaito_kid', 'wizard_student', 'harry', 'homeroom_3b', 'alchemist', 'state_alchemist', 'fullmetal', 'sailor_soldier', 'sailor_moon'];
export const R33_SIGS = R33_SIG_JOBS.map((j) => `${j}_sig`);
export const R33_MOVES = ['r33_card_throw', 'r33_hat_trick', 'r33_smoke_flash', 'r33_steal', 'r33_glider', 'r33_spell_ray', 'r33_disarm', 'r33_patronus', 'r33_broom', 'r33_lightning',
  'r33_sekkyo', 'r33_hito_ji', 'r33_alchemy', 'r33_alchemy_spear', 'r33_alchemy_wall', 'r33_mech_arm', 'r33_watch', 'r33_sailor_beam', 'r33_sailor_guard', 'r33_moon_tiara', 'r33_moon_heal',
  // 男の子の 美少女戦士・セーラームーン（タキシード仮面ふう）
  'r33_bara', 'r33_bara_ring', 'r33_cane', 'r33_tux_smash'];
export const R33_ANIMS = new Set([...R33_SIGS, ...R33_MOVES]);
// みかたに つかう ことが ある えんしゅつ（敵が いない ときは がめんの 下に 大きく 出す）
export const PARTY_ANIMS7 = new Set(['r33_glider', 'r33_smoke_flash', 'r33_broom', 'r33_hito_ji', 'r33_alchemy_wall', 'r33_sailor_guard', 'r33_moon_heal', 'r33_patronus']);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const JOB7_HIT = {
  kaito_kid_sig: 380, harry_sig: 360, homeroom_3b_sig: 700, fullmetal_sig: 520, sailor_moon_sig: 620,
  magician_sig: 560, kaito_sig: 260, wizard_student_sig: 220, alchemist_sig: 640, state_alchemist_sig: 420, sailor_soldier_sig: 300,
  r33_card_throw: 200, r33_hat_trick: 260, r33_steal: 160, r33_spell_ray: 160, r33_disarm: 180,
  r33_patronus: 340, r33_lightning: 120, r33_sekkyo: 260, r33_alchemy: 360, r33_alchemy_spear: 380, r33_mech_arm: 80,
  r33_watch: 380, r33_sailor_beam: 220, r33_moon_tiara: 300,
  r33_bara: 220, r33_bara_ring: 300, r33_cane: 120, r33_tux_smash: 620,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r26.js・sfx-r33.js の 音）
export const JOB7_SFX = {
  kaito_kid_sig: 'r33_cards', harry_sig: 'r33_patronus', homeroom_3b_sig: 'r33_chalk', fullmetal_sig: 'r33_clap', sailor_moon_sig: 'r33_moon',
  magician_sig: 'r33_curtain', kaito_sig: 'kirari', wizard_student_sig: 'r33_ray', alchemist_sig: 'r33_clap', state_alchemist_sig: 'blast', sailor_soldier_sig: 'r33_moon',
  r33_card_throw: 'cardfly', r33_hat_trick: 'r33_poof', r33_smoke_flash: 'r33_poof', r33_steal: 'kirari', r33_glider: 'wind', r33_spell_ray: 'spell', r33_disarm: 'spell',
  r33_patronus: 'r33_patronus', r33_broom: 'wind', r33_lightning: 'thunder', r33_sekkyo: 'r33_scold', r33_hito_ji: 'buff', r33_alchemy: 'r33_clap', r33_alchemy_spear: 'r33_clap',
  r33_alchemy_wall: 'rumble', r33_mech_arm: 'crit', r33_watch: 'kirari', r33_sailor_beam: 'sparkle', r33_sailor_guard: 'buff', r33_moon_tiara: 'r33_moon', r33_moon_heal: 'heal',
  r33_bara: 'cardfly', r33_bara_ring: 'wind', r33_cane: 'kirari', r33_tux_smash: 'r33_moon',
};

// ───────────── え の ぶひん ─────────────
// トランプ（白い カード・こい ふち・赤か 黒の しるし）。sx: よこの ひらき（回る）
function card(x, cx, cy, rot, sx, red, s = 1) {
  x.save();
  x.translate(cx, cy);
  x.rotate(rot);
  x.scale(Math.max(0.12, Math.abs(sx)) * s, s);
  x.fillStyle = '#2a2438';
  x.fillRect(-3.6, -4.8, 7.2, 9.6);
  x.fillStyle = sx >= 0 ? '#ffffff' : '#c8d4f0';
  x.fillRect(-3, -4.2, 6, 8.4);
  if (sx >= 0) {
    x.fillStyle = red ? '#d8202c' : '#1e1a2a';
    x.beginPath();
    x.moveTo(0, -2.2); x.lineTo(1.8, 0); x.lineTo(0, 2.2); x.lineTo(-1.8, 0);
    x.fill();
  } else {
    x.fillStyle = '#3a62c8';
    x.fillRect(-2, -3.2, 4, 6.4);
  }
  x.restore();
}
// 三日月（ひらく ほうが みぎ）
function crescent(x, cx, cy, r, k = 0.42) {
  x.beginPath();
  for (let i = 0; i <= 24; i++) { const a = Math.PI / 2 + (i / 24) * Math.PI; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  for (let i = 0; i <= 24; i++) { const a = Math.PI * 1.5 - (i / 24) * Math.PI; x.lineTo(cx - r * 0.12 + Math.cos(a) * r * k, cy + Math.sin(a) * r * 0.96); }
  x.closePath();
}
function softGlow(x, cx, cy, r, col, a) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = a;
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
// もじ（ふちどり → 白）。ぽんと 大きく なる
function popText(x, p, t) {
  const a = fadeOut(t, p.fade ?? 0.75);
  if (a <= 0) return;
  const sc = easeBack(clamp01(p.age / 200)) * (p.s || 1);
  x.save();
  x.globalAlpha = a;
  x.translate(p.x + (p.vx2 || 0) * t, p.y + (p.vy2 || 0) * t + Math.sin(p.age / 110) * 0.8);
  x.rotate(p.rot || 0);
  x.scale(sc, sc);
  x.font = p.font || FONT;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  if (p.bubble) {
    // ふきだし
    const w = x.measureText(p.text).width + 12;
    x.fillStyle = p.edge || '#2a1a10';
    x.fillRect(-w / 2 - 1, -12, w + 2, 24);
    x.fillStyle = p.bubble;
    x.fillRect(-w / 2, -11, w, 22);
    x.beginPath(); x.moveTo(-4, 11); x.lineTo(4, 11); x.lineTo(-6, 18); x.fill();
  }
  if (!p.bubble) {
    x.lineWidth = 4;
    x.strokeStyle = p.edge || '#2a1a10';
    x.strokeText(p.text, 0, 1);
  }
  x.fillStyle = p.fill || '#ffffff';
  x.fillText(p.text, 0, 1);
  x.restore();
}

// ───────────── こまかい つぶ（battlefx.js の FINE に まぜる。なまえは j7 で はじまる） ─────────────
export const JOB7_FINE = {
  // とぶ トランプ（x0,y0 → x1,y1。さきに ささる）
  j7card(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const k = clamp01(p.age / p.travel);
    const e = easeOut(k);
    const cx = p.x0 + (p.x1 - p.x0) * e, cy = p.y0 + (p.y1 - p.y0) * e - Math.sin(k * Math.PI) * (p.arc || 0);
    x.save();
    x.globalAlpha = a;
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
    card(x, cx, cy, k < 1 ? ang + Math.PI / 2 : ang + Math.PI / 2 + 0.2, k < 1 ? Math.cos(p.age / 30) : 1, p.red, p.s || 1);
    x.restore();
  },
  // まう トランプ（ひらひら おちる）
  j7flutter(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const s = p.age / 1000;
    const cx = p.x + Math.sin(s * 3 + p.ph) * 10 + (p.dx || 0) * s, cy = p.y + s * (p.fall || 40);
    x.save();
    x.globalAlpha = a;
    card(x, cx, cy, Math.sin(s * 4 + p.ph) * 0.8, Math.cos(s * 7 + p.ph), p.red, p.s || 0.9);
    x.restore();
  },
  // 白い マント（ハンググライダー）の かげ: 空を よこぎり、地面に 黒い かげ
  j7cape(x, p, t) {
    const a = fadeOut(t, 0.75) * clamp01(p.age / 120);
    if (a <= 0) return;
    const k = clamp01(p.age / p.travel);
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y + Math.sin(p.age / 160) * 3;
    const s = p.s || 1, d = p.x1 > p.x0 ? 1 : -1;
    x.save();
    // 地面の かげ
    x.globalAlpha = a * 0.35;
    x.fillStyle = '#0a0812';
    x.beginPath();
    x.ellipse(cx - d * 6, p.gy, 30 * s, 4 * s, 0, 0, Math.PI * 2);
    x.fill();
    // つばさ（白い マント。うしろの ふちは なみの かたち）
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.scale(d * s, s);
    x.fillStyle = '#2a2a44';
    x.beginPath();
    x.moveTo(16, -2); x.lineTo(-28, 4);
    for (let i = 0; i <= 6; i++) x.lineTo(-28 + i * 7.3, 4 + (i % 2 ? 6 : 2));
    x.closePath();
    x.fill();
    x.fillStyle = '#f6f8ff';
    x.beginPath();
    x.moveTo(15, -1.4); x.lineTo(-26, 4.2);
    for (let i = 0; i <= 6; i++) x.lineTo(-26 + i * 6.8, 4.2 + (i % 2 ? 4.6 : 1.4));
    x.closePath();
    x.fill();
    x.fillStyle = '#c8d4f0';
    x.fillRect(-20, 6, 30, 1.2);
    // ぶらさがる 人の かげ（シルクハット）
    x.fillStyle = '#1a1626';
    x.fillRect(-4, 6, 4, 6);
    x.fillRect(-5, 3.6, 6, 1);
    x.fillRect(-4, 0.6, 4, 3);
    x.restore();
  },
  // 光の 動物（白く 光る シカ）。x0 → x1 へ かける
  j7stag(x, p, t) {
    const a = fadeOut(t, 0.72) * clamp01(p.age / 100);
    if (a <= 0) return;
    const k = clamp01(p.age / p.travel);
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y - Math.abs(Math.sin(p.age / 90)) * 3;
    const s = p.s || 1, d = p.x1 > p.x0 ? 1 : -1;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy - 4 * s, 34 * s, 'rgba(180,220,255,0.9)', a * 0.55);
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.scale(d * s, s);
    const body = '#e8f6ff', line = '#ffffff';
    x.fillStyle = body;
    // どう
    x.beginPath(); x.ellipse(-2, 0, 11, 5.5, 0, 0, Math.PI * 2); x.fill();
    // くびと あたま
    x.beginPath(); x.moveTo(5, -3); x.lineTo(10, -13); x.lineTo(14, -12); x.lineTo(10, 1); x.fill();
    x.beginPath(); x.ellipse(13.5, -13, 4.2, 2.6, 0.3, 0, Math.PI * 2); x.fill();
    // つの
    x.strokeStyle = line;
    x.lineWidth = 1.2;
    x.lineCap = 'round';
    for (const o of [0, 1.6]) {
      x.beginPath();
      x.moveTo(11 + o, -15); x.lineTo(9 + o, -22); x.lineTo(6 + o, -26);
      x.moveTo(9.6 + o, -19.5); x.lineTo(13 + o, -23);
      x.moveTo(8.2 + o, -23.6); x.lineTo(10 + o, -28);
      x.stroke();
    }
    // あし（かわりばんこに うごく）
    const ph = Math.sin(p.age / 70);
    x.lineWidth = 1.8;
    for (const [lx, sgn] of [[-10, 1], [-7, -1], [3, -1], [6, 1]]) {
      x.beginPath();
      x.moveTo(lx, 3);
      x.lineTo(lx + ph * sgn * 3.5, 9);
      x.lineTo(lx + ph * sgn * 2, 13);
      x.stroke();
    }
    // しっぽ
    x.beginPath(); x.ellipse(-13, -3, 2, 1.4, -0.5, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 黒板と チョークの「人」の 字
  j7board(x, p, t) {
    const a = fadeOut(t, 0.82) * clamp01(p.age / 120);
    if (a <= 0) return;
    const w = p.w || 92, h = p.h || 46;
    const sc = easeBack(clamp01(p.age / 220));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.scale(sc, sc);
    // わく（木）と 黒板（こい 緑）
    x.fillStyle = '#5a3a1e';
    x.fillRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 9);
    x.fillStyle = '#8a5a2e';
    x.fillRect(-w / 2 - 2, h / 2 + 1, w + 4, 3);
    x.fillStyle = '#1e4a36';
    x.fillRect(-w / 2, -h / 2, w, h);
    x.fillStyle = '#2a5c44';
    x.fillRect(-w / 2, -h / 2, w, 3);
    // チョークの あと（うすい すじ）
    x.fillStyle = 'rgba(255,255,255,0.08)';
    x.fillRect(-w / 2 + 6, -6, w * 0.3, 2);
    x.fillRect(w / 6, 8, w * 0.25, 2);
    // 「人」の 字（1画め → 2画め）
    const k1 = clamp01((p.age - 160) / 220), k2 = clamp01((p.age - 400) / 200);
    x.strokeStyle = '#f6f6ee';
    x.lineWidth = 3.4;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    const s1 = [[2, -16], [0, -4], [-6, 8], [-16, 16]], s2 = [[0, -2], [8, 9], [18, 16]];
    const part = (pts, k) => {
      if (k <= 0) return null;
      const L = [];
      let tot = 0;
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
      let left = tot * k;
      x.beginPath();
      x.moveTo(pts[0][0], pts[0][1]);
      let end = pts[0];
      for (let i = 1; i < pts.length && left > 0; i++) {
        const f = Math.min(1, left / L[i - 1]);
        end = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
        x.lineTo(end[0], end[1]);
        left -= L[i - 1];
      }
      x.stroke();
      return end;
    };
    const e1 = part(s1, k1);
    const e2 = part(s2, k2);
    // チョーク（かいている ところ）
    const pen = k2 > 0 && k2 < 1 ? e2 : k1 > 0 && k1 < 1 ? e1 : null;
    if (pen) {
      x.fillStyle = '#ffffff';
      x.fillRect(pen[0] - 1, pen[1] - 6, 3, 6);
    }
    x.restore();
  },
  // もじ（ふきだし つき も）
  j7text(x, p, t) { popText(x, p, t); },
  // れん金の 円（地面に ひろがる。sy で たてに つぶす）
  j7circle(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const k = clamp01(p.age / (p.draw || 260));
    const r = p.r * (0.6 + 0.4 * easeOut(clamp01(p.age / 200)));
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.scale(1, p.sy || 0.4);
    x.rotate(p.age / 900);
    x.strokeStyle = p.c || '#9ad8ff';
    x.lineWidth = 1.6;
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2 * k); x.stroke();
    x.beginPath(); x.arc(0, 0, r * 0.78, 0, -Math.PI * 2 * k, true); x.stroke();
    if (k > 0.4) {
      // 三角を 2つ かさねた 星と、まわりの 小さな 円
      x.lineWidth = 1.2;
      for (const off of [0, Math.PI]) {
        x.beginPath();
        for (let i = 0; i <= 3; i++) { const an = off - Math.PI / 2 + (i * Math.PI * 2) / 3; x.lineTo(Math.cos(an) * r * 0.78, Math.sin(an) * r * 0.78); }
        x.stroke();
      }
      for (let i = 0; i < 6; i++) { const an = (i * Math.PI) / 3; x.beginPath(); x.arc(Math.cos(an) * r * 0.89, Math.sin(an) * r * 0.89, r * 0.08, 0, Math.PI * 2); x.stroke(); }
      x.beginPath(); x.arc(0, 0, r * 0.22, 0, Math.PI * 2); x.stroke();
    }
    x.restore();
  },
  // 地面から つき出る 石の やり（gy: 地面、h: たかさ、w: はば、lean: かたむき）
  j7spike(x, p, t) {
    const a = fadeOut(t, 0.78);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / (p.rise || 110)));
    const h = p.h * k, w = p.w || 6, lean = p.lean || 0;
    x.save();
    x.globalAlpha = a;
    x.fillStyle = '#3a3440';
    x.beginPath(); x.moveTo(p.x - w / 2 - 1, p.gy); x.lineTo(p.x + lean * h + 0.5, p.gy - h - 1); x.lineTo(p.x + w / 2 + 1, p.gy); x.fill();
    x.fillStyle = '#8a8296';
    x.beginPath(); x.moveTo(p.x - w / 2, p.gy); x.lineTo(p.x + lean * h, p.gy - h); x.lineTo(p.x + w / 2, p.gy); x.fill();
    x.fillStyle = '#c8c0d0';
    x.beginPath(); x.moveTo(p.x - w / 2 + 1, p.gy); x.lineTo(p.x + lean * h, p.gy - h); x.lineTo(p.x - 0.5, p.gy); x.fill();
    x.restore();
  },
  // 地面から 立つ 石の かべ（れんがの すじ）
  j7wall(x, p, t) {
    const a = fadeOut(t, 0.8);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / (p.rise || 160)));
    const h = p.h * k, w = p.w;
    x.save();
    x.globalAlpha = a;
    x.fillStyle = '#2e2a36';
    x.fillRect(p.x - w / 2 - 1, p.gy - h - 1, w + 2, h + 1);
    x.fillStyle = '#9a90a6';
    x.fillRect(p.x - w / 2, p.gy - h, w, h);
    x.fillStyle = '#c4bccc';
    x.fillRect(p.x - w / 2, p.gy - h, w, 2);
    x.fillStyle = '#6e6678';
    for (let y = p.gy - h + 6, r = 0; y < p.gy; y += 6, r++) {
      x.fillRect(p.x - w / 2, y, w, 1);
      for (let bx = p.x - w / 2 + (r % 2 ? 5 : 0); bx < p.x + w / 2; bx += 10) x.fillRect(bx, y - 6, 1, 6);
    }
    x.restore();
  },
  // 夜空の 大きな 三日月（ふわっと 出る）
  j7moon(x, p, t) {
    const a = fadeOut(t, 0.8) * clamp01(p.age / 260);
    if (a <= 0) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, p.r * 2.4, 'rgba(255,240,170,0.8)', a * 0.6);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.fillStyle = '#fff2a8';
    crescent(x, p.x, p.y, p.r);
    x.fill();
    x.fillStyle = '#ffffff';
    crescent(x, p.x - p.r * 0.25, p.y - p.r * 0.1, p.r * 0.6, 0.5);
    x.globalAlpha = a * 0.5;
    x.fill();
    x.restore();
  },
  // 空から ふる 光の はしら（x, y: とどく ところ）
  j7shaft(x, p, t) {
    const a = fadeOut(t, 0.55) * clamp01(p.age / 80);
    if (a <= 0) return;
    const w = (p.w || 14) * (1 - t * 0.4);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    const g = x.createLinearGradient(0, -4, 0, p.y);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, p.c || 'rgba(255,240,170,0.9)');
    x.fillStyle = g;
    x.fillRect(p.x - w / 2, -4, w, p.y + 4);
    x.fillStyle = 'rgba(255,255,255,0.8)';
    x.fillRect(p.x - 1, -4, 2, p.y + 4);
    x.restore();
  },
  // とぶ ティアラ（金の わが 回って、x0 → x1 → もどる）
  j7tiara(x, p, t) {
    const a = fadeOut(t, 0.85);
    if (a <= 0) return;
    const k = clamp01(p.age / p.travel);
    const go = k < 0.5 ? easeOut(k * 2) : 1 - easeOut((k - 0.5) * 2);
    const cx = p.x0 + (p.x1 - p.x0) * go + Math.sin(k * Math.PI * 2) * (p.swing || 18), cy = p.y0 + (p.y1 - p.y0) * go - Math.sin(go * Math.PI) * 16;
    const sp = Math.cos(p.age / 40);
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy, 14, p.silver ? 'rgba(255,190,230,0.9)' : 'rgba(255,230,140,0.9)', a * 0.7);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.strokeStyle = p.silver ? '#5a6278' : '#7a4a10';
    x.lineWidth = 3.4;
    x.beginPath(); x.ellipse(0, 0, 9, Math.max(1, 9 * Math.abs(sp)), 0.3, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = p.silver ? '#e8ecf6' : '#ffd84a';
    x.lineWidth = 2;
    x.stroke();
    x.fillStyle = p.silver ? '#ff5aa0' : '#e8203a';
    x.beginPath(); x.ellipse(0, -Math.max(1, 9 * Math.abs(sp)) * 0.9, 2, 2.4, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // ハト（はばたく 白い 鳥。vx, vy で とぶ）
  j7dove(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const s = p.age / 1000;
    const cx = p.x + p.vx2 * s, cy = p.y + p.vy2 * s + 30 * s * s;
    const f = Math.sin(p.age / 45);
    const d = p.vx2 >= 0 ? 1 : -1;
    x.save();
    if (p.glow) {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, cx, cy, 12, 'rgba(255,246,200,0.8)', a * 0.6);
      x.globalCompositeOperation = 'source-over';
    }
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.scale(d * (p.s || 1), p.s || 1);
    x.fillStyle = '#4a4a66';
    x.beginPath(); x.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.ellipse(0, 0, 4.2, 2.3, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(4.6, -1.6, 2, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f2b03a';
    x.fillRect(6.2, -1.8, 1.6, 1);
    x.fillStyle = '#e6eaf6';
    x.beginPath(); x.moveTo(-1, -1); x.lineTo(-4, -2 - f * 6); x.lineTo(2, -1.4); x.fill();
    x.beginPath(); x.moveTo(-4, 0); x.lineTo(-8, 1.6); x.lineTo(-4, 2); x.fill();
    x.restore();
  },
  // シルクハット（がめんの 下。ぽんと 出る）
  j7hat(x, p, t) {
    const a = fadeOut(t, 0.8);
    if (a <= 0) return;
    const sc = easeBack(clamp01(p.age / 160)) * (p.s || 1);
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.scale(sc, sc);
    x.rotate(Math.PI);
    x.fillStyle = '#0e0c14';
    x.fillRect(-12, -2, 24, 4);
    x.fillRect(-8, -14, 16, 13);
    x.fillStyle = '#2c2840';
    x.fillRect(-7, -13, 14, 11);
    x.fillStyle = '#c41a2a';
    x.fillRect(-7, -5, 14, 3);
    x.restore();
  },
  // ほうき（わらの ふさ と え）で とぶ。x0 → x1
  j7broom(x, p, t) {
    const a = fadeOut(t, 0.8);
    if (a <= 0) return;
    const k = clamp01(p.age / p.travel);
    const cx = p.x0 + (p.x1 - p.x0) * easeOut(k), cy = p.y + Math.sin(p.age / 80) * 2 - k * 10;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(-0.12);
    x.fillStyle = '#3a2210';
    x.fillRect(-16, -1.6, 34, 3.2);
    x.fillStyle = '#8a5228';
    x.fillRect(-16, -1, 34, 1.6);
    x.fillStyle = '#5a3a14';
    x.beginPath(); x.moveTo(-14, -3); x.lineTo(-28, -6); x.lineTo(-30, 0); x.lineTo(-28, 6); x.lineTo(-14, 3); x.fill();
    x.fillStyle = '#d8b46a';
    x.beginPath(); x.moveTo(-14, -2); x.lineTo(-27, -4.6); x.lineTo(-28.6, 0); x.lineTo(-27, 4.6); x.lineTo(-14, 2); x.fill();
    x.fillStyle = '#c8ccd8';
    x.fillRect(-15, -3, 2, 6);
    x.restore();
  },
  // とんで いく 剣（武器を うばう 呪文）
  j7sword(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const s = p.age / 1000;
    const cx = p.x + p.vx2 * s, cy = p.y + p.vy2 * s + 160 * s * s;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(p.age / 50);
    x.fillStyle = '#2a2438';
    x.fillRect(-1.6, -11, 3.2, 16);
    x.fillStyle = '#e4e8f2';
    x.fillRect(-1, -10.4, 2, 12);
    x.fillStyle = '#d69a2e';
    x.fillRect(-4, 1.6, 8, 2);
    x.fillStyle = '#5a3218';
    x.fillRect(-1, 3.6, 2, 4);
    x.restore();
  },
  // 金の 宝ぶくろ（ぬすんだ 物が こちらへ とんで くる）
  j7loot(x, p, t) {
    const a = fadeOut(t, 0.85);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / p.travel));
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * 20;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    if (p.gem) {
      // 青い 宝石（ひしがた）
      x.fillStyle = '#1a2a5a';
      x.beginPath(); x.moveTo(0, -6); x.lineTo(5.6, 0); x.lineTo(0, 6); x.lineTo(-5.6, 0); x.fill();
      x.fillStyle = '#5ac8ff';
      x.beginPath(); x.moveTo(0, -4.6); x.lineTo(4.2, 0); x.lineTo(0, 4.6); x.lineTo(-4.2, 0); x.fill();
      x.fillStyle = '#e6fbff';
      x.fillRect(-1.6, -2.4, 1.6, 1.6);
      x.restore();
      return;
    }
    x.fillStyle = '#5a3210';
    x.beginPath(); x.arc(0, 1, 5.4, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e8b23a';
    x.beginPath(); x.arc(0, 1, 4.4, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff2a0';
    x.fillRect(-2, -1, 2, 2);
    x.fillStyle = '#5a3210';
    x.fillRect(-2.4, -5, 4.8, 2);
    x.restore();
  },
  // 赤い 舞台の まく（上から おりて、少し まって 上がる）
  j7curtain(x, p, t) {
    const k = p.age < 260 ? easeOut(p.age / 260) : p.age < 480 ? 1 : 1 - easeOut(clamp01((p.age - 480) / 260));
    if (k <= 0) return;
    const h = p.h * k;
    x.save();
    x.globalAlpha = 1;
    x.fillStyle = '#5a0a14';
    x.fillRect(0, 0, p.w, h);
    for (let i = 0; i < 16; i++) {
      x.fillStyle = i % 2 ? '#b8182a' : '#d8283a';
      x.fillRect((i * p.w) / 16, 0, p.w / 16 - 1, Math.max(0, h - 3));
    }
    x.fillStyle = '#f6d26c';
    x.fillRect(0, Math.max(0, h - 4), p.w, 3);
    x.fillStyle = '#7a0a18';
    x.fillRect(0, 0, p.w, 8);
    x.restore();
  },
  // 白い マントが ひるがえる（まとの まわりを 半月の 白い 布が まわる）
  j7swirl(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const ang = -Math.PI / 2 + t * Math.PI * 2.2;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.rotate(ang);
    x.fillStyle = '#2a2a44';
    x.beginPath(); x.arc(0, 0, p.r + 1.5, -1.3, 1.3); x.arc(0, 0, p.r * 0.45, 1.3, -1.3, true); x.fill();
    x.fillStyle = '#f6f8ff';
    x.beginPath(); x.arc(0, 0, p.r, -1.2, 1.2); x.arc(0, 0, p.r * 0.5, 1.2, -1.2, true); x.fill();
    x.fillStyle = '#c8b0ff';
    x.beginPath(); x.arc(0, 0, p.r * 0.62, -1.0, 1.0); x.arc(0, 0, p.r * 0.5, 1.0, -1.0, true); x.fill();
    x.restore();
  },
  // 太い 光線（x0,y0 → x1,y1）
  j7beam(x, p, t) {
    const a = fadeOut(t, 0.5);
    if (a <= 0) return;
    const k = clamp01(p.age / 120);
    const ex = p.x0 + (p.x1 - p.x0) * k, ey = p.y0 + (p.y1 - p.y0) * k;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    x.lineCap = 'round';
    x.strokeStyle = p.c || '#ff3a4a';
    x.lineWidth = 7 * (1 - t * 0.5);
    x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(ex, ey); x.stroke();
    x.strokeStyle = '#ffffff';
    x.lineWidth = 2.4 * (1 - t * 0.5);
    x.stroke();
    x.restore();
  },
  // まとの 上を まわる 星（止まる）
  j7stars(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const an = p.ph + p.age / 160;
    const cx = p.x + Math.cos(an) * 10, cy = p.y + Math.sin(an) * 3;
    x.save();
    x.globalAlpha = a;
    x.fillStyle = '#ffe680';
    x.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 1.4 : 3.4, q = -Math.PI / 2 + (i * Math.PI) / 5; x.lineTo(cx + Math.cos(q) * r, cy + Math.sin(q) * r); }
    x.fill();
    x.restore();
  },
  // 石の 大男（地面から せり上がり、うでを ふりおろして なぎはらう）
  j7golem(x, p, t) {
    const a = fadeOut(t, 0.82);
    if (a <= 0) return;
    const rise = easeOut(clamp01(p.age / 260));
    const sw = clamp01((p.age - 300) / 260);
    const s = p.h / 64;
    x.save();
    x.globalAlpha = a;
    x.beginPath(); x.rect(-20, -20, 400, p.y + 20); x.clip();
    x.translate(p.x, p.y + (1 - rise) * p.h);
    x.scale(s, s);
    const R = (rx, ry, w, h, c) => { x.fillStyle = c; x.fillRect(rx, ry, w, h); };
    const ol = '#2a2632', st = '#8a8296', hi = '#b8b0c4', dk = '#5a5266';
    // どう と あたま
    R(-15, -50, 30, 50, ol); R(-13, -48, 26, 47, st); R(-13, -48, 26, 4, hi); R(-2, -40, 4, 30, dk);
    R(-9, -64, 18, 15, ol); R(-7, -62, 14, 12, st); R(-7, -62, 14, 3, hi);
    x.fillStyle = '#7ad8ff'; x.fillRect(-5, -58, 3, 2); x.fillRect(2, -58, 3, 2);
    // うで（かたから ふりおろす。sw で 上 → 前へ）
    x.save();
    x.translate(13, -44);
    x.rotate(-2.2 + sw * 2.4);
    R(-5, -2, 10, 34, ol); R(-3, 0, 6, 30, st); R(-7, 26, 14, 12, ol); R(-5, 28, 10, 8, hi);
    x.restore();
    R(-21, -44, 8, 26, ol); R(-19, -42, 4, 22, st);
    x.restore();
  },
  // 赤い バラ（x0,y0 → x1,y1 へ 回りながら 飛ぶ）。ring: ブーメランの ように 行って もどる（光る）。
  // ring で ない ときは 着いたら ささった まま 少し ゆれて きえる。s: 大きさ
  j7rose(x, p, t) {
    const a = fadeOut(t, p.ring ? 0.85 : 0.75);
    if (a <= 0) return;
    const k = clamp01(p.age / p.travel);
    let cx, cy, rot;
    if (p.ring) {
      const go = k < 0.5 ? easeOut(k * 2) : 1 - easeOut((k - 0.5) * 2);
      cx = p.x0 + (p.x1 - p.x0) * go + Math.sin(k * Math.PI * 2) * (p.swing || 16);
      cy = p.y0 + (p.y1 - p.y0) * go - Math.sin(go * Math.PI) * 18;
      rot = p.age / 45;
    } else {
      const e = easeOut(k);
      cx = p.x0 + (p.x1 - p.x0) * e;
      cy = p.y0 + (p.y1 - p.y0) * e - Math.sin(e * Math.PI) * (p.arc || 10);
      // 飛ぶ むき（花が さき）。着いたら 少し ゆれる
      rot = Math.atan2(p.y1 - p.y0, p.x1 - p.x0) + Math.PI / 2 + (k >= 1 ? Math.sin(p.age / 60) * 0.12 : 0);
    }
    const s = p.s || 1;
    x.save();
    if (p.ring || p.glow) {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, cx, cy, 16 * s, 'rgba(255,90,110,0.9)', a * 0.6);
      x.globalCompositeOperation = 'source-over';
    }
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(rot);
    x.scale(s, s);
    // くき と 葉っぱ
    x.strokeStyle = '#1e5a26';
    x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(0, 2); x.lineTo(0, 11); x.stroke();
    x.fillStyle = '#3a9a3a';
    x.beginPath(); x.ellipse(2.2, 6.5, 2.2, 1.1, -0.6, 0, Math.PI * 2); x.fill();
    // 花（こい 赤の ふち → 赤 → まん中の うずまき）
    x.fillStyle = '#5a0a14';
    x.beginPath(); x.arc(0, -1, 4.4, 0, Math.PI * 2); x.fill();
    x.fillStyle = p.c || '#e0203a';
    x.beginPath(); x.arc(0, -1, 3.7, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#7a0a1c';
    x.lineWidth = 0.9;
    x.beginPath(); x.arc(0.4, -1.2, 2.2, 0.4, Math.PI * 1.6); x.stroke();
    x.beginPath(); x.arc(-0.2, -0.8, 1, Math.PI, Math.PI * 2.6); x.stroke();
    x.fillStyle = '#ff8a9a';
    x.fillRect(-2.2, -3.6, 1.4, 1);
    x.restore();
  },
  // ピンクの 光が あふれる（大きな 光の まる）
  j7pink(x, p, t) {
    const a = fadeOut(t, 0.4);
    if (a <= 0) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, p.r * (0.6 + t * 0.8), 'rgba(255,140,200,0.9)', a * 0.75);
    softGlow(x, p.x, p.y, p.r * 0.5 * (0.6 + t), 'rgba(255,255,255,0.9)', a * 0.6);
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playJob7Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R33_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
  const ty = targets.reduce((s, t) => s + t.y, 0) / targets.length;
  const top = Math.min(...targets.map((t) => t.y));
  const from = opts.from || { x: W / 2, y: H + 6 };
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 150, delay: d, life: 340, len: 7 });
  };
  const cardsAt = (n, d0, gap, x0, y0) => {
    for (let i = 0; i < n; i++) {
      const t = targets[i % targets.length];
      fx.add({ kind: 'j7card', x0: x0 + rnd(-6, 6), y0: y0 + rnd(-4, 4), x1: t.x + rnd(-8, 8), y1: t.y + rnd(-8, 8), x: t.x, y: t.y, travel: 180, life: 520, delay: d0 + i * gap, red: i % 2 === 0, arc: rnd(-10, 14), s: 1.4 });
      fx.impact(t.x + rnd(-5, 5), t.y + rnd(-5, 5), { r: 7 * sz, color: '#ffffff', delay: d0 + i * gap + 170 });
    }
  };
  const flutter = (n, d0) => {
    for (let k = 0; k < n; k++) fx.add({ kind: 'j7flutter', x: rnd(8, W - 8), y: rnd(-14, H * 0.3), ph: rnd(0, 6), fall: rnd(30, 60), dx: rnd(-10, 10), red: k % 2 === 0, life: 1000, delay: d0 + k * 30 });
  };
  const text = (s, x0, y0, d, o = {}) => fx.add({ kind: 'j7text', text: s, x: Math.min(W - 40, Math.max(40, x0)), y: Math.max(16, y0), life: o.life || 900, delay: d, ...o });
  const circleUnder = (t, d, r = 24, c = '#9ad8ff') => fx.add({ kind: 'j7circle', x: t.x, y: t.y + 16 * sz, r: r * sz, c, life: 760, delay: d, sy: 0.38 });
  const spikes = (t, d, n = 5, h = 34) => {
    const gy = t.y + 18 * sz;
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * 7 * sz;
      fx.add({ kind: 'j7spike', x: t.x + off, y: gy, gy, h: (h - Math.abs(off) * 0.9) * sz * rnd(0.85, 1.1), w: 7 * sz, lean: -off * 0.012, rise: 90, life: 640, delay: d + Math.abs(k - (n - 1) / 2) * 30 });
    }
    fx.debris(t.x, gy - 6, ['#8a8296', '#5a5266', '#c8c0d0'], all ? 6 : 10, d + 40, 100);
    fx.shock(t.x, gy, { r0: 4, r1: 40 * sz, color: '#c8c0d0', w: 2, delay: d + 30, life: 340, sy: 0.3, add: false });
  };
  switch (anim) {
    // ───── 看板の技 ─────
    case 'kaito_kid_sig': {
      // 1) 目くらまし（白い 光と けむり）
      fx.flashAt(90, '#ffffff', 0);
      for (let k = 0; k < 8; k++) fx.puff(rnd(20, W - 20), rnd(H * 0.5, H - 10), { color: '#f4f6ff', r0: 6, r1: 22, vx: rnd(-20, 20), vy: -10, life: 700, alpha: 0.7, delay: k * 20 });
      // 2) トランプ銃の トランプ（下から たくさん）
      cardsAt(all ? 12 : 9, 120, 28, from.x, from.y);
      each((t, i, d) => { hitMark(t, 380 + d, '#ff6a7a'); });
      fx.hitStop(crit ? 220 : 160, 380, 1.4);
      // 3) 白い マントの かげが 空を よこぎる・トランプが まう
      fx.tintAt('rgba(16, 20, 52, 0.4)', 1500);
      fx.add({ kind: 'j7moon', x: W * 0.5, y: 26, r: 16, life: 1300, delay: 480 });
      fx.add({ kind: 'j7cape', x0: -50, x1: W + 50, y: 22, gy: H - 14, x: 0, travel: 1000, life: 1100, delay: 520, s: 1.4 });
      flutter(16, 620);
      for (const t of targets) fx.twinkle(t.x, t.y - 10, { color: '#ffffff', size: 8, delay: 760, life: 420 });
      return true;
    }
    case 'harry_sig': {
      // 1) 守護の 光（白い シカが 下から かけて きて つきぬける）
      fx.tintAt('rgba(8, 14, 40, 0.45)', 1300);
      fx.add({ kind: 'j7stag', x0: -30, x1: W + 30, y: Math.min(H - 20, ty + 6), x: 0, travel: 700, life: 760, s: 1.4 });
      for (let k = 0; k < 18; k++) fx.puff(rnd(0, W), ty + rnd(-8, 16), { color: '#cfe8ff', r0: 2, r1: 9, vy: -10, life: 600, alpha: 0.45, add: true, delay: 60 + k * 30 });
      each((t, i, d) => {
        fx.glow(t.x, t.y, { color: '#dff2ff', r: 26 * sz, delay: 300 + d, life: 380 });
        hitMark(t, 340 + d, '#9ad8ff', 18);
      });
      // 2) いなずま（空から まとへ）
      each((t, i, d) => {
        fx.zap(t.x + rnd(-20, 20), -4, t.x, t.y, { color: '#fff6b0', glow: '#9ad8ff', w: 2.2, delay: 720 + d, life: 320, forks: 2 });
        fx.impact(t.x, t.y, { r: (crit ? 24 : 20) * sz, color: '#fffbe0', delay: 740 + d });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#9ad8ff'], n: all ? 10 : 16, speed: 180, delay: 740 + d, life: 360, len: 9 });
      });
      fx.flashAt(80, '#ffffff', 720);
      fx.hitStop(crit ? 260 : 200, 740, 1.8);
      return true;
    }
    case 'homeroom_3b_sig': {
      // 1) 黒板に チョークで「人」
      const bx = Math.min(W - 52, Math.max(52, tx)), by = Math.max(26, top - 46);
      fx.add({ kind: 'j7board', x: bx, y: by, w: 92, h: 46, life: 1500 });
      for (let k = 0; k < 8; k++) fx.puff(bx + rnd(-16, 16), by + rnd(-10, 14), { color: '#f6f6ee', r0: 1, r1: 4, vy: 12, life: 500, alpha: 0.5, delay: 180 + k * 50 });
      // 2) 説教の 文字が 敵に ぶつかる
      const words = ['コラッ！', 'いいですか！', 'わかりますか！'];
      each((t, i, d) => {
        text(words[i % words.length], t.x, t.y - (i % 2 ? 6 : 22), 640 + i * 90, { bubble: '#ffffff', fill: '#2a2438', edge: '#2a2438', life: 700, font: 'bold 10px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif' });
        hitMark(t, 700 + i * 90, '#f6f6ee', 18);
        fx.arrows(t.x, t.y, '#ffd66b', false, 2, 760 + i * 90);
      });
      fx.hitStop(crit ? 240 : 180, 700, 1.6);
      for (let k = 0; k < 10; k++) fx.puff(rnd(10, W - 10), rnd(-6, 20), { color: '#f6f6ee', r0: 1, r1: 3, vy: 30, life: 700, alpha: 0.5, delay: 900 + k * 30 });
      return true;
    }
    case 'fullmetal_sig': {
      // 1) 手を 合わせる（パンッ）
      text('パンッ！', from.x, Math.min(H - 30, from.y - 40), 0, { life: 520, fill: '#fff6d0', edge: '#3a1a10', s: 0.9 });
      fx.flashAt(60, '#ffffff', 40);
      // 2) れん金の 円と 青い 光
      each((t, i, d) => {
        circleUnder(t, 140 + d, 30);
        for (let k = 0; k < 4; k++) fx.zap(t.x + rnd(-26, 26) * sz, t.y + 16 * sz, t.x + rnd(-26, 26) * sz, t.y + rnd(4, 18), { color: '#e6fbff', glow: '#5ab8ff', w: 1, delay: 200 + d + k * 50, life: 200 });
      });
      // 3) 地面から 石の やり
      each((t, i, d) => {
        spikes(t, 440 + d, all ? 4 : 5, 34);
        hitMark(t, 520 + d, '#9ad8ff', 18);
        // 2回め（もっと 大きな やり）
        spikes(t, 820 + d, all ? 5 : 7, 46);
        hitMark(t, 900 + d, '#9ad8ff', 22);
      });
      fx.hitStop(crit ? 200 : 160, 520, 1.6);
      fx.hitStop(crit ? 280 : 220, 900, 2);
      return true;
    }
    case 'sailor_moon_sig': {
      // 1) 夜の 空に 大きな 三日月
      fx.tintAt('rgba(10, 8, 40, 0.5)', 1700);
      fx.add({ kind: 'j7moon', x: W * 0.78, y: 30, r: 20, life: 1700 });
      for (let k = 0; k < 14; k++) fx.twinkle(rnd(8, W - 8), rnd(4, H * 0.45), { color: k % 2 ? '#fff6b0' : '#ffffff', size: rnd(3, 6), delay: k * 40, life: 900 });
      text('月にかわって、おしおきよ！', W / 2, 34, 160, { life: 1200, fill: '#fff6d0', edge: '#3a1a4a', font: 'bold 13px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif' });
      // 2) 月の 光が ふる
      each((t, i, d) => fx.add({ kind: 'j7shaft', x: t.x, y: t.y + 6, w: 18 * sz, life: 700, delay: 320 + d }));
      // 3) ティアラが とんで もどる
      each((t, i, d) => {
        fx.add({ kind: 'j7tiara', x0: from.x, y0: from.y - 10, x1: t.x, y1: t.y, x: t.x, y: t.y, travel: 700, life: 760, delay: 380 + d, swing: 14 });
        hitMark(t, 620 + d, '#ffd84a', 20);
        fx.shock(t.x, t.y, { r0: 6, r1: 46 * sz, color: '#fff2a8', w: 2.5, delay: 620 + d, life: 400 });
      });
      fx.flashAt(70, '#fffbe0', 620);
      fx.hitStop(crit ? 260 : 200, 620, 1.6);
      // ピンクの 光が あふれる
      fx.add({ kind: 'j7pink', x: tx, y: ty, r: 70, life: 700, delay: 640 });
      for (let k = 0; k < 12; k++) fx.petal(rnd(10, W - 10), rnd(-10, 4), { color: k % 2 ? '#ffd84a' : '#ff9ac8', vx: rnd(-20, 20), vy: rnd(30, 60), delay: 900 + k * 30, life: 800 });
      return true;
    }
    case 'magician_sig': {
      // 赤い まくが おりる → 上がると 光の ハトと 紙ふぶき
      fx.add({ kind: 'j7curtain', x: 0, y: 0, w: W, h: H, life: 760 });
      each((t, i, d) => {
        fx.glow(t.x, t.y, { color: '#fff6c0', r: 26 * sz, delay: 520 + d, life: 420 });
        hitMark(t, 560 + d, '#ffd84a', 18);
      });
      fx.flashAt(60, '#fffbe0', 540);
      for (let k = 0; k < 8; k++) fx.add({ kind: 'j7dove', x: rnd(30, W - 30), y: rnd(H * 0.4, H * 0.7), vx2: rnd(-90, 90), vy2: rnd(-110, -60), life: 900, delay: 560 + k * 30, s: 1.2, glow: true });
      for (let k = 0; k < 20; k++) fx.petal(rnd(10, W - 10), rnd(-14, 4), { color: ['#ff6a8a', '#ffd84a', '#7ad8ff', '#ffffff'][k % 4], vx: rnd(-20, 20), vy: rnd(30, 70), delay: 560 + k * 20, life: 900 });
      return true;
    }
    case 'kaito_sig': {
      // 白い マントが ひるがえって 一閃、宝石が キラッ
      each((t, i, d) => {
        fx.add({ kind: 'j7swirl', x: t.x, y: t.y, r: 26 * sz, life: 420, delay: d });
        fx.bigCut(t.x, t.y, { ang: -0.5, color: '#ffffff', glow: '#c8b0ff', w: 3, delay: 220 + d, life: 300 });
        hitMark(t, 260 + d, '#c8b0ff', 18);
        fx.twinkle(t.x + 8, t.y - 12, { color: '#9ae6ff', size: 12, delay: 420 + d, life: 500 });
        fx.add({ kind: 'j7loot', x0: t.x, y0: t.y, x1: from.x, y1: Math.min(H - 8, from.y), x: t.x, y: t.y, travel: 520, life: 620, delay: 460 + d, gem: true });
      });
      fx.hitStop(crit ? 220 : 160, 260, 1.4);
      return true;
    }
    case 'wizard_student_sig': {
      // つえから 太い 赤い 光線 → 止まる 星
      each((t, i, d) => {
        fx.add({ kind: 'j7beam', x0: from.x, y0: from.y - 6, x1: t.x, y1: t.y, x: t.x, y: t.y, life: 420, delay: d, c: '#ff3a4a' });
        hitMark(t, 220 + d, '#ff6a6a', 18);
        for (let k = 0; k < 3; k++) fx.add({ kind: 'j7stars', x: t.x, y: t.y - 14, ph: (k * Math.PI * 2) / 3, life: 900, delay: 300 + d });
      });
      fx.flashAt(50, '#ffe0e0', 200);
      return true;
    }
    case 'alchemist_sig': {
      // 青い いなずま → 石の 大男が 出て うでで なぎはらう
      const gy = Math.min(H - 6, Math.max(...targets.map((t) => t.y)) + 20);
      fx.add({ kind: 'j7circle', x: tx, y: gy - 4, r: 60, c: '#9ad8ff', life: 900, sy: 0.3 });
      for (let k = 0; k < 6; k++) fx.zap(tx + rnd(-60, 60), gy - 4, tx + rnd(-50, 50), gy - rnd(10, 30), { color: '#e6fbff', glow: '#5ab8ff', w: 1, delay: 100 + k * 50, life: 200 });
      fx.add({ kind: 'j7golem', x: Math.max(30, tx - 70), y: gy, h: 64, life: 1300, delay: 300 });
      each((t, i) => hitMark(t, 640 + i * 60, '#c8c0d0', 20));
      fx.debris(tx, gy - 6, ['#8a8296', '#5a5266', '#c8c0d0'], 14, 640, 120);
      fx.hitStop(crit ? 280 : 220, 640, 2);
      return true;
    }
    case 'state_alchemist_sig': {
      // 足もとに れん金の 円 → 大きな 爆発
      each((t, i, d) => {
        circleUnder(t, d, 30);
        fx.impact(t.x, t.y, { r: (crit ? 34 : 28) * sz, color: '#fff2c0', delay: 420 + d });
        fx.shock(t.x, t.y, { r0: 6, r1: 56 * sz, color: '#ffb060', w: 3, delay: 420 + d, life: 420 });
        for (let k = 0; k < 6; k++) fx.puff(t.x + rnd(-14, 14), t.y + rnd(-10, 10), { color: k % 2 ? '#ff8a3a' : '#ffd66b', r0: 4, r1: 18, vy: -20, life: 600, alpha: 0.8, add: true, delay: 420 + d + k * 20 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd66b', '#ff8a3a'], n: all ? 12 : 20, speed: 200, delay: 420 + d, life: 420, len: 9 });
      });
      fx.flashAt(90, '#fff2c0', 420);
      fx.hitStop(crit ? 280 : 220, 420, 2);
      return true;
    }
    case 'sailor_soldier_sig': {
      // 銀の ティアラが 光の わに なって とぶ
      each((t, i, d) => {
        fx.add({ kind: 'j7tiara', x0: from.x, y0: from.y - 10, x1: t.x, y1: t.y, x: t.x, y: t.y, travel: 640, life: 700, delay: d, swing: 14, silver: true });
        hitMark(t, 300 + d, '#ff9ac8', 18);
        fx.shock(t.x, t.y, { r0: 6, r1: 40 * sz, color: '#ffd0e8', w: 2, delay: 300 + d, life: 360 });
      });
      return true;
    }

    // ───── 手品師・かいとう ─────
    case 'r33_card_throw': {
      cardsAt(all ? 6 : 4, 0, 40, from.x, from.y);
      each((t, i, d) => hitMark(t, 200 + d, '#ff6a7a', 13));
      return true;
    }
    case 'r33_hat_trick': {
      const hx = Math.min(W - 30, Math.max(30, tx)), hy = Math.min(H - 12, ty + 30);
      fx.add({ kind: 'j7hat', x: hx, y: hy, life: 900, s: 1.1 });
      fx.puff(hx, hy - 10, { color: '#ffffff', r0: 4, r1: 16, vy: -20, life: 500, alpha: 0.8, delay: 120 });
      for (let k = 0; k < 5; k++) fx.add({ kind: 'j7dove', x: hx, y: hy - 12, vx2: rnd(-90, 90), vy2: rnd(-120, -70), life: 900, delay: 160 + k * 40, s: 1.1 });
      for (let k = 0; k < 14; k++) fx.petal(hx + rnd(-6, 6), hy - 14, { color: ['#ff6a8a', '#ffd84a', '#7ad8ff', '#ffffff'][k % 4], vx: rnd(-60, 60), vy: rnd(-90, -40), g: 120, delay: 160 + k * 15, life: 800 });
      each((t, i, d) => hitMark(t, 260 + d, '#ffd84a', 13));
      return true;
    }
    case 'r33_smoke_flash': {
      fx.flashAt(140, '#ffffff', 0);
      each((t, i, d) => {
        for (let k = 0; k < 6; k++) fx.puff(t.x + rnd(-14, 14), t.y + rnd(-8, 10), { color: '#eef0f8', r0: 5, r1: 18, vx: rnd(-15, 15), vy: -8, life: 800, alpha: 0.75, delay: d + k * 25 });
        fx.twinkle(t.x, t.y - 6, { color: '#ffffff', size: 10, delay: d + 40, life: 400 });
      });
      return true;
    }
    case 'r33_steal': {
      each((t, i, d) => {
        fx.twinkle(t.x + 6, t.y - 6, { color: '#ffffff', size: 10, delay: d, life: 360 });
        fx.cut(t.x, t.y, { ang: -0.6, len: 26, color: '#ffffff', glow: '#c8d4ff', delay: d + 40, life: 240 });
        hitMark(t, 160 + d, '#ffd84a', 10);
        fx.add({ kind: 'j7loot', x0: t.x, y0: t.y, x1: from.x, y1: Math.min(H - 8, from.y), x: t.x, y: t.y, travel: 520, life: 620, delay: 200 + d });
      });
      return true;
    }
    case 'r33_glider': {
      // みかた: がめんの 下を 白い マントが すべって いく
      fx.add({ kind: 'j7cape', x0: -40, x1: W + 40, y: Math.max(20, ty - 30), gy: Math.min(H - 6, ty + 16), x: 0, travel: 800, life: 880, s: 1.1 });
      fx.gust(0, ty - 10, { len: W, amp: 3, color: '#e6fbff', w: 1.2, delay: 60, life: 520 });
      for (const t of targets) fx.arrows(t.x, t.y, '#9ad8ff', true, 3, 300);
      return true;
    }
    // ───── 魔法学校の生徒・ハリーポッター ─────
    case 'r33_spell_ray': {
      each((t, i, d) => {
        fx.zap(from.x, from.y - 6, t.x, t.y, { color: '#ffffff', glow: element === 'fire' ? '#ff8a3a' : '#c8a8ff', w: 1.6, delay: d, life: 260, forks: 0 });
        hitMark(t, 160 + d, '#c8a8ff', 14);
      });
      return true;
    }
    case 'r33_disarm': {
      each((t, i, d) => {
        fx.zap(from.x, from.y - 6, t.x, t.y, { color: '#ffe0e0', glow: '#ff3a4a', w: 2, delay: d, life: 280, forks: 0 });
        hitMark(t, 180 + d, '#ff3a4a', 14);
        fx.add({ kind: 'j7sword', x: t.x, y: t.y - 4, vx2: rnd(-70, 70), vy2: -150, life: 900, delay: 200 + d });
      });
      return true;
    }
    case 'r33_patronus': {
      fx.tintAt('rgba(8, 14, 40, 0.35)', 900);
      fx.add({ kind: 'j7stag', x0: -30, x1: W + 30, y: Math.min(H - 20, ty + 6), x: 0, travel: 680, life: 740, s: 1.2 });
      for (let k = 0; k < 10; k++) fx.puff(rnd(0, W), ty + rnd(-6, 14), { color: '#cfe8ff', r0: 2, r1: 8, vy: -10, life: 600, alpha: 0.45, add: true, delay: 60 + k * 40 });
      each((t, i, d) => {
        fx.glow(t.x, t.y, { color: '#dff2ff', r: 24 * sz, delay: 300 + d, life: 380 });
        fx.impact(t.x, t.y, { r: 14 * sz, color: '#f0f8ff', delay: 340 + d });
      });
      return true;
    }
    case 'r33_broom': {
      fx.add({ kind: 'j7broom', x0: -40, x1: W + 40, y: Math.max(24, ty - 20), x: 0, travel: 700, life: 760 });
      for (let k = 0; k < 4; k++) fx.gust(0, ty - 24 + k * 8, { len: W, amp: 2, color: '#e6fbff', w: 1, delay: 40 + k * 40, life: 460 });
      for (const t of targets) fx.arrows(t.x, t.y, '#7af0c0', true, 3, 260);
      return true;
    }
    case 'r33_lightning': {
      each((t, i, d) => {
        fx.zap(t.x + rnd(-24, 24), -4, t.x, t.y, { color: '#fff6b0', glow: '#9ad8ff', w: 2, delay: d, life: 300, forks: 2 });
        hitMark(t, 120 + d, '#fff6b0', 18);
      });
      fx.flashAt(70, '#ffffff', 60);
      return true;
    }
    // ───── 3年B組の担任 ─────
    case 'r33_sekkyo': {
      const words = ['コラッ！', 'いいですか！'];
      each((t, i, d) => {
        text(words[i % 2], t.x, t.y - 18, d + i * 60, { bubble: '#ffffff', fill: '#2a2438', edge: '#2a2438', life: 760, font: 'bold 12px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif' });
        fx.puff(t.x, t.y, { color: '#f6f6ee', r0: 2, r1: 10, life: 400, alpha: 0.5, delay: 240 + d });
        hitMark(t, 260 + d + i * 60, '#f6f6ee', 12);
        fx.arrows(t.x, t.y, '#ffd66b', false, 2, 320 + d);
      });
      return true;
    }
    case 'r33_hito_ji': {
      // 「人という字は…」: 2本の 光の すじが よりかかって「人」に なる
      const cx = tx, cy = Math.min(H - 30, ty - 6);
      fx.add({ kind: 'j7board', x: cx, y: cy - 24, w: 72, h: 38, life: 1200 });
      text('人という字は…', cx, cy + 16, 520, { life: 700, fill: '#fff6d0', edge: '#2a3a20', font: 'bold 12px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif' });
      for (const t of targets) { fx.arrows(t.x, t.y, '#ffd66b', true, 3, 600); fx.glow(t.x, t.y, { color: '#fff2c0', r: 20, delay: 600, life: 400 }); }
      return true;
    }
    // ───── れん金術師・国家れん金術師・はがねのれん金術師 ─────
    case 'r33_alchemy': {
      each((t, i, d) => {
        circleUnder(t, d, 22);
        for (let k = 0; k < 3; k++) fx.zap(t.x + rnd(-20, 20) * sz, t.y + 14 * sz, t.x + rnd(-10, 10), t.y + rnd(-4, 8), { color: '#e6fbff', glow: '#5ab8ff', w: 1, delay: 120 + d + k * 50, life: 200 });
        hitMark(t, 360 + d, '#9ad8ff', 16);
        fx.debris(t.x, t.y + 8, ['#8a8296', '#5a5266'], 6, 360 + d, 90);
      });
      return true;
    }
    case 'r33_alchemy_spear': {
      text('パンッ！', from.x, Math.min(H - 30, from.y - 40), 0, { life: 420, fill: '#fff6d0', edge: '#3a1a10', s: 0.8 });
      each((t, i, d) => {
        circleUnder(t, 100 + d, 24);
        spikes(t, 300 + d, all ? 3 : 5, 34);
        hitMark(t, 380 + d, '#9ad8ff', 16);
      });
      fx.hitStop(160, 380, 1.3);
      return true;
    }
    case 'r33_alchemy_wall': {
      // みかたの まえに 石の かべ（がめんの 下）
      const gy = Math.min(H - 2, ty + 18);
      fx.add({ kind: 'j7circle', x: tx, y: gy - 2, r: 46, c: '#9ad8ff', life: 700, sy: 0.3 });
      for (const off of [-48, 0, 48]) fx.add({ kind: 'j7wall', x: tx + off, y: gy, gy, w: 40, h: 30, rise: 180, life: 1000, delay: 160 + Math.abs(off) * 1.5 });
      fx.debris(tx, gy - 6, ['#8a8296', '#5a5266', '#c8c0d0'], 12, 180, 80);
      fx.shock(tx, gy, { r0: 6, r1: 80, color: '#c8c0d0', w: 2, delay: 170, life: 400, sy: 0.25, add: false });
      return true;
    }
    case 'r33_mech_arm': {
      each((t, i, d) => {
        fx.bigCut(t.x, t.y, { ang: -0.9, color: '#ffffff', glow: '#b6c4e0', w: 3, delay: d, life: 280 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd66b', '#b6c4e0'], n: all ? 10 : 18, speed: 200, delay: d + 40, life: 360, len: 8 });
        hitMark(t, 80 + d, '#b6c4e0', 16);
      });
      fx.hitStop(crit ? 200 : 140, 80, 1.4);
      return true;
    }
    case 'r33_watch': {
      // 銀時計が キラッ → 大きな れん金の 円 → ドン
      fx.twinkle(from.x, Math.min(H - 20, from.y - 26), { color: '#ffffff', size: 12, life: 420 });
      fx.glow(from.x, Math.min(H - 20, from.y - 26), { color: '#dfe6f6', r: 16, life: 360 });
      each((t, i, d) => {
        circleUnder(t, 120 + d, 34);
        fx.pillar(t.x, t.y + 14, '#9ad8ff', { w: 10 * sz, h: 50, delay: 340 + d, life: 420 });
        hitMark(t, 380 + d, '#9ad8ff', 20);
      });
      fx.flashAt(60, '#e6fbff', 360);
      return true;
    }
    // ───── 美少女戦士・セーラームーン ─────
    case 'r33_sailor_beam': {
      each((t, i, d) => {
        fx.proj(t.x, t.y, ['#ff7ab8', '#ffd0e8', '#ffffff'], { size: 3.5, travel: 220, delay: d, from });
        for (let k = 0; k < 6; k++) fx.twinkle(t.x + rnd(-14, 14), t.y + rnd(-12, 12), { color: k % 2 ? '#ffd84a' : '#ff9ac8', size: 6, delay: 200 + d + k * 30, life: 360 });
        hitMark(t, 220 + d, '#ff7ab8', 15);
      });
      return true;
    }
    case 'r33_sailor_guard': {
      // リボンの 光の わで みかたを つつむ
      for (const t of targets) {
        fx.shock(t.x, t.y, { r0: 30, r1: 6, color: '#ff9ac8', w: 2, life: 420 });
        fx.shock(t.x, t.y, { r0: 8, r1: 44, color: '#ffd0e8', w: 2, delay: 300, life: 420 });
        fx.glow(t.x, t.y, { color: '#ffd0e8', r: 30, delay: 260, life: 500 });
        fx.arrows(t.x, t.y, '#ff9ac8', true, 3, 320);
      }
      for (let k = 0; k < 10; k++) fx.petal(rnd(tx - 60, tx + 60), rnd(ty - 40, ty - 10), { color: k % 2 ? '#ff9ac8' : '#ffffff', vx: rnd(-20, 20), vy: rnd(10, 30), delay: 200 + k * 30, life: 700 });
      return true;
    }
    case 'r33_moon_tiara': {
      each((t, i, d) => {
        fx.add({ kind: 'j7tiara', x0: from.x, y0: from.y - 10, x1: t.x, y1: t.y, x: t.x, y: t.y, travel: 620, life: 680, delay: d, swing: 12 });
        hitMark(t, 300 + d, '#ffd84a', 16);
      });
      return true;
    }
    // ───── 男の子の 美少女戦士・セーラームーン（タキシード仮面ふう） ─────
    case 'r33_bara': {
      // 赤い バラが 飛んで ささる。花びらが ちる
      each((t, i, d) => {
        fx.add({ kind: 'j7rose', x0: from.x + rnd(-4, 4), y0: from.y - 12, x1: t.x + rnd(-4, 4), y1: t.y + rnd(-6, 4), x: t.x, y: t.y, travel: 220, life: 760, delay: d, arc: rnd(6, 14), s: 1.5 });
        hitMark(t, 220 + d, '#ff3a4a', 13);
        for (let k = 0; k < 5; k++) fx.petal(t.x + rnd(-6, 6), t.y + rnd(-6, 2), { color: k % 2 ? '#e0203a' : '#ff8a9a', vx: rnd(-50, 50), vy: rnd(-60, -20), g: 120, delay: 230 + d + k * 20, life: 700 });
      });
      return true;
    }
    case 'r33_bara_ring': {
      // 光る 大きな バラが 回りながら 行って もどる
      each((t, i, d) => {
        fx.add({ kind: 'j7rose', x0: from.x, y0: from.y - 12, x1: t.x, y1: t.y, x: t.x, y: t.y, travel: 640, life: 700, delay: d, swing: 16, ring: true, s: 2.2 });
        hitMark(t, 300 + d, '#ff5a6a', 18);
        fx.shock(t.x, t.y, { r0: 6, r1: 42 * sz, color: '#ff8a9a', w: 2, delay: 300 + d, life: 360 });
        for (let k = 0; k < 6; k++) fx.petal(t.x + rnd(-10, 10), t.y + rnd(-8, 4), { color: k % 2 ? '#e0203a' : '#ffd0d8', vx: rnd(-60, 60), vy: rnd(-70, -20), g: 120, delay: 310 + d + k * 20, life: 760 });
      });
      return true;
    }
    case 'r33_cane': {
      // ステッキの 一撃（白い 光の すじ・星）
      each((t, i, d) => {
        fx.bigCut(t.x, t.y, { ang: -0.7, color: '#ffffff', glow: '#fff2a8', w: 3, delay: d, life: 260 });
        for (let k = 0; k < 4; k++) fx.twinkle(t.x + rnd(-14, 14), t.y + rnd(-14, 10), { color: k % 2 ? '#fff6b0' : '#ffffff', size: 6, delay: 80 + d + k * 30, life: 360 });
        hitMark(t, 120 + d, '#fff2a8', 15);
      });
      fx.hitStop(crit ? 180 : 120, 120, 1.2);
      return true;
    }
    case 'r33_tux_smash': {
      // 1) 夜の 空と 三日月、きめゼリフ（技の 名前の 帯の 下）
      fx.tintAt('rgba(10, 8, 40, 0.5)', 1700);
      fx.add({ kind: 'j7moon', x: W * 0.22, y: 30, r: 20, life: 1700 });
      for (let k = 0; k < 12; k++) fx.twinkle(rnd(8, W - 8), rnd(4, H * 0.45), { color: k % 2 ? '#fff6b0' : '#ffffff', size: rnd(3, 6), delay: k * 40, life: 900 });
      text('月の光が見ているぞ！', W / 2, 34, 160, { life: 1200, fill: '#ffffff', edge: '#3a0a1a', font: 'bold 13px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif' });
      // 2) ステッキから 白い 光の 波（大きな わが なんども ひろがる）
      fx.glow(from.x, Math.min(H - 16, from.y - 18), { color: '#ffffff', r: 18, delay: 300, life: 360 });
      for (let k = 0; k < 3; k++) fx.shock(from.x, Math.min(H - 16, from.y - 18), { r0: 8, r1: W * 0.9, color: k ? '#e8eeff' : '#ffffff', w: 5 - k * 1.2, delay: 380 + k * 90, life: 520 });
      each((t, i, d) => {
        fx.add({ kind: 'j7beam', x0: from.x, y0: Math.min(H - 16, from.y - 18), x1: t.x, y1: t.y, x: t.x, y: t.y, life: 380, delay: 420 + d, c: '#cfd8ff' });
        hitMark(t, 620 + d, '#ffffff', 22);
        fx.shock(t.x, t.y, { r0: 6, r1: 48 * sz, color: '#ffffff', w: 3, delay: 620 + d, life: 420 });
        // 3) バラが ささる
        fx.add({ kind: 'j7rose', x0: from.x + rnd(-20, 20), y0: -8, x1: t.x + rnd(-4, 4), y1: t.y - 4, x: t.x, y: t.y, travel: 260, life: 800, delay: 700 + d, arc: 4, s: 1.6, glow: true });
      });
      fx.flashAt(90, '#ffffff', 620);
      fx.hitStop(crit ? 260 : 200, 620, 1.6);
      for (let k = 0; k < 14; k++) fx.petal(rnd(10, W - 10), rnd(-10, 4), { color: k % 2 ? '#e0203a' : '#ffd0d8', vx: rnd(-20, 20), vy: rnd(30, 60), delay: 900 + k * 30, life: 800 });
      return true;
    }
    case 'r33_moon_heal': {
      // みかた: 小さな 三日月と 月の 光が ふる
      fx.tintAt('rgba(10, 8, 40, 0.3)', 900);
      fx.add({ kind: 'j7moon', x: Math.min(W - 24, tx + 50), y: Math.max(20, ty - 60), r: 12, life: 1100 });
      for (const t of targets) {
        fx.add({ kind: 'j7shaft', x: t.x, y: t.y + 6, w: 22, life: 700, delay: 200, c: 'rgba(255,246,200,0.9)' });
        for (let k = 0; k < 6; k++) fx.twinkle(t.x + rnd(-18, 18), t.y - rnd(0, 30), { color: '#fff6b0', size: 5, vy: -20, delay: 260 + k * 50, life: 500 });
      }
      return true;
    }
  }
  return false;
}

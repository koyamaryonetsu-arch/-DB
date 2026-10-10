// 第26回の 新しい 職業 20この「看板の技」の エフェクト
// anim の なまえは 技の id と おなじ（'<職業の id>_sig'。例 'kisatsu_sig'・'hokage_sig'）。
// battlefx.js の play() で battlefx-jobs3.js の つぎに よばれる（ここに ない anim なら false を かえす）。
// client/battle.js は 技の id が SIG4 に あれば、データの anim が なくても この エフェクトを つかう（sigAnim）。
//
// ・技の 名前や 効果が わからなくても その 職業らしく 見える ように（カード・ほのお・ポケットの 道具・水しぶき・木の葉…）
// ・敵 1体（単体）・敵みんな（全体）・みかた（がめんの した の 1か所）の どれに 出ても おかしく ならない
// ・あたる しゅんかんは すぐ（ダメージの 数字と ずれない）。1.8びょう いないで おわる。スマホでも 見やすく 大きく
// ・「プゥ〜」「!」などの もじは ドットの もじで かく（どの きかいでも おなじ）

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

// 20この 職業の 看板の技（ならびは 職業の ならび）
export const SIG4_JOBS = ['rakuten_cardman', 'kisatsu', 'enbashira', 'hinokami', 'spy', 'assassin', 'black_org', 'esper', 'shonen_tantei', 'oshiri_tantei',
  'meitantei', 'creator', 'neko_robot', 'mimi_robot', 'doraemon', 'kappa', 'hanakappa', 'kinniku_kappa', 'konoha', 'hokage'];
export const SIG4 = new Set(SIG4_JOBS.map((j) => `${j}_sig`));
// 技の id → エフェクトの なまえ（看板の技で なければ null）
export const sigAnim = (abilityId) => (typeof abilityId === 'string' && SIG4.has(abilityId) ? abilityId : null);

// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js か sfx-r26.js に ある 音）
export const JOB4_SFX = {
  rakuten_cardman_sig: 'cardfly', kisatsu_sig: 'thunder', enbashira_sig: 'fire', hinokami_sig: 'fire', spy_sig: 'scope',
  assassin_sig: 'whip', black_org_sig: 'engine', esper_sig: 'warp', shonen_tantei_sig: 'kirari', oshiri_tantei_sig: 'pu',
  meitantei_sig: 'kirari', creator_sig: 'heal', neko_robot_sig: 'gadget', mimi_robot_sig: 'gadget', doraemon_sig: 'gadget',
  kappa_sig: 'splash', hanakappa_sig: 'splash', kinniku_kappa_sig: 'muscle', konoha_sig: 'wind', hokage_sig: 'pon',
};

// ───────────── ドットの もじ ─────────────
const GLYPH = {
  'プ': ['........###', '#######.#.#', '......#.###', '......#....', '.....#.....', '....#......', '..##.......', '##.........'],
  'ゥ': ['.........', '.........', '....#....', '.#######.', '.#.....#.', '.......#.', '......#..', '....##...'],
  '〜': ['.........', '.........', '.##......', '#..#....#', '....#..#.', '.....##..', '.........', '.........'],
  '!': ['##', '##', '##', '##', '##', '..', '##', '##'],
  '?': ['.####.', '##..##', '....##', '...##.', '..##..', '......', '..##..', '..##..'],
};
function pixText(x, str, cx, cy, s, fill, edge) {
  const gl = [...str].map((ch) => GLYPH[ch] || GLYPH['!']);
  const total = gl.reduce((a, g) => a + g[0].length, 0) + gl.length - 1;
  const rows = Math.max(...gl.map((g) => g.length));
  const x0 = cx - (total * s) / 2, y0 = cy - (rows * s) / 2;
  const cells = [];
  let ox = 0;
  for (const g of gl) {
    g.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === '#') cells.push([x0 + (ox + c) * s, y0 + r * s]); });
    ox += g[0].length + 1;
  }
  if (edge) {
    x.fillStyle = edge;
    const e = s * 0.8;
    for (const [px, py] of cells) x.fillRect(px - e, py - e, s + e * 2, s + e * 2);
  }
  x.fillStyle = fill;
  for (const [px, py] of cells) x.fillRect(px, py, s, s);
}
function circle(x, cx, cy, r) {
  x.beginPath();
  x.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2);
}
function rrect(x, cx, cy, w, h, r) {
  const x0 = cx - w / 2, y0 = cy - h / 2;
  x.beginPath();
  x.moveTo(x0 + r, y0);
  x.lineTo(x0 + w - r, y0); x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  x.lineTo(x0 + w, y0 + h - r); x.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  x.lineTo(x0 + r, y0 + h); x.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0);
  x.closePath();
}
// p.x0,y0 → p.x1,y1 へ travel ms で とぶ（そのあと とまる）。かえりち: [x, y, 0〜1]
function flyPos(p, ease = easeOut) {
  const k = clamp01(p.age / Math.max(1, p.travel || 1));
  const e = ease(k);
  return [p.x0 + (p.x1 - p.x0) * e, p.y0 + (p.y1 - p.y0) * e - Math.sin(k * Math.PI) * (p.arc || 0), k];
}

// ───────────── こまかい つぶの かきかた（battlefx.js の FINE に まぜる。なまえは j4 で はじまる） ─────────────
export const JOB4_FINE = {
  // 赤い カード（くるくる まわって とぶ。金の IC）
  j4card(x, p, t) {
    const [cx, cy, k] = flyPos(p);
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(p.rot0 + p.age / 90);
    const sc = (p.s || 1) * (k < 1 ? 1 : 1 + (p.age - p.travel) / 900);
    x.scale(sc * Math.max(0.25, Math.abs(Math.cos(p.age / 70))), sc);
    rrect(x, 0, 0, 13, 9, 1.6);
    x.fillStyle = '#5a0a12'; x.fill();
    rrect(x, 0, 0, 11.4, 7.4, 1.2);
    x.fillStyle = '#e8222e'; x.fill();
    x.fillStyle = '#ffd040'; x.fillRect(-4.6, -2.4, 3, 2.2);
    x.fillStyle = '#ffffff'; x.fillRect(-5.2, 1.4, 10.4, 1);
    x.restore();
  },
  // ほのおの 三日月（大きく ふりぬく 炎の 剣の なみ）
  j4flamearc(x, p, t) {
    const sw = clamp01(p.age / (p.swing || 140));
    const a = fadeOut(t, 0.5);
    if (a <= 0) return;
    const a0 = p.a0, a1 = p.a0 + (p.a1 - p.a0) * easeOut(sw);
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (const [w, col, al] of [[p.w * 2.2, '#ff3010', 0.35], [p.w * 1.4, '#ff7a1c', 0.7], [p.w * 0.7, '#ffd040', 0.9], [p.w * 0.25, '#fffbe0', 1]]) {
      x.globalAlpha = a * al;
      x.strokeStyle = col;
      x.lineWidth = w;
      x.lineCap = 'round';
      x.beginPath();
      x.ellipse(p.x, p.y, p.r, p.r * (p.sy || 0.8), 0, a0, a1, p.a1 < p.a0);
      x.stroke();
    }
    x.restore();
  },
  // ほのおの わ（えんを えがいて まわる 炎の まい）
  j4firering(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const r = p.r * (0.55 + 0.45 * easeOut(clamp01(t * 2.2)));
    const rot = p.age / 160;
    x.save();
    x.globalCompositeOperation = 'lighter';
    const n = 14;
    for (let i = 0; i < n; i++) {
      const ang = rot + (i / n) * Math.PI * 2;
      const fx = p.x + Math.cos(ang) * r, fy = p.y + Math.sin(ang) * r * 0.62;
      const h = 7 + 3 * Math.sin(p.age / 60 + i * 1.7);
      for (const [col, sz, al] of [['#ff4a14', 1, 0.7], ['#ffa830', 0.62, 0.85], ['#fff2a0', 0.3, 1]]) {
        x.globalAlpha = a * al;
        x.fillStyle = col;
        x.beginPath();
        x.moveTo(fx - 3.2 * sz, fy + 1.5);
        x.quadraticCurveTo(fx - 2.4 * sz, fy - h * sz * 0.6, fx + Math.sin(p.age / 80 + i) * 1.2, fy - h * sz - 1);
        x.quadraticCurveTo(fx + 2.4 * sz, fy - h * sz * 0.6, fx + 3.2 * sz, fy + 1.5);
        x.closePath();
        x.fill();
      }
    }
    x.restore();
  },
  // ねらいの まる（スパイ: ちぢんで ねらう）
  j4scope(x, p, t) {
    const k = clamp01(p.age / 120);
    const r = p.r * (1.8 - 0.8 * easeOut(k));
    const a = fadeOut(t, 0.55);
    if (a <= 0) return;
    x.save();
    x.globalAlpha = a;
    x.strokeStyle = '#ff3a3a';
    x.lineWidth = 1.4;
    circle(x, p.x, p.y, r); x.stroke();
    circle(x, p.x, p.y, r * 0.45); x.stroke();
    x.beginPath();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { x.moveTo(p.x + dx * r * 0.6, p.y + dy * r * 0.6); x.lineTo(p.x + dx * r * 1.35, p.y + dy * r * 1.35); }
    x.stroke();
    x.fillStyle = '#ff2020';
    circle(x, p.x, p.y, 1.4); x.fill();
    x.restore();
  },
  // 黒い 車（ひだりから はしって くる。はじめは はやく、あとは すこし ゆっくり）
  j4car(x, p) {
    const tt = p.age;
    const cx = tt < p.t1 ? p.x0 + (p.xh - p.x0) * (tt / p.t1) : p.xh + (tt - p.t1) * p.v;
    const cy = p.y;
    x.save();
    x.globalAlpha = 1;
    // かげ
    x.fillStyle = 'rgba(0,0,0,0.35)';
    x.beginPath(); x.ellipse(cx, cy + 1, 30, 3.5, 0, 0, Math.PI * 2); x.fill();
    // からだ（ひくい くろい 車）
    x.fillStyle = '#05050a';
    rrect(x, cx, cy - 7, 58, 12, 4); x.fill();
    x.beginPath();
    x.moveTo(cx - 14, cy - 12); x.lineTo(cx - 6, cy - 21); x.lineTo(cx + 12, cy - 21); x.lineTo(cx + 20, cy - 12); x.closePath();
    x.fill();
    x.fillStyle = '#26283a';
    rrect(x, cx, cy - 8, 54, 8, 3); x.fill();
    // まど
    x.fillStyle = '#6a7898';
    x.beginPath(); x.moveTo(cx - 10, cy - 13); x.lineTo(cx - 5, cy - 19); x.lineTo(cx + 3, cy - 19); x.lineTo(cx + 3, cy - 13); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(cx + 5, cy - 13); x.lineTo(cx + 5, cy - 19); x.lineTo(cx + 11, cy - 19); x.lineTo(cx + 16, cy - 13); x.closePath(); x.fill();
    x.fillStyle = '#c8d0e8'; x.fillRect(cx - 4, cy - 18, 2, 4);
    // ライト・タイヤ
    x.fillStyle = '#fff4b0'; x.fillRect(cx + 26, cy - 9, 3, 3);
    x.fillStyle = '#ff3030'; x.fillRect(cx - 29, cy - 9, 2, 3);
    for (const dx of [-17, 17]) {
      x.fillStyle = '#000000'; circle(x, cx + dx, cy - 1, 5); x.fill();
      x.fillStyle = '#8a8ea0'; circle(x, cx + dx, cy - 1, 2.2); x.fill();
    }
    x.restore();
  },
  // まがる スプーン（ゆらゆら うかんで くにゃっと まがる）
  j4spoon(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const bend = easeOut(clamp01((p.age - 150) / 450)) * 1.2;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y + Math.sin(p.age / 120 + p.ph) * 2.5);
    x.rotate(p.rot + Math.sin(p.age / 200) * 0.2);
    x.lineCap = 'round';
    const draw = (w, col) => {
      x.strokeStyle = col; x.lineWidth = w;
      x.beginPath(); x.moveTo(0, 8); x.quadraticCurveTo(0, 0, Math.sin(bend) * 6, -Math.cos(bend) * 6); x.stroke();
    };
    draw(3.2, '#2a2a3a'); draw(1.8, '#d8dcec');
    x.translate(Math.sin(bend) * 8, -Math.cos(bend) * 8);
    x.rotate(bend);
    x.fillStyle = '#2a2a3a'; x.beginPath(); x.ellipse(0, -1, 3.6, 4.8, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e8ecf8'; x.beginPath(); x.ellipse(0, -1, 2.6, 3.8, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.fillRect(-1.2, -3.6, 1, 2);
    x.restore();
  },
  // ゆがむ 空間（ゆらぐ だえんが まわる）
  j4warp(x, p, t) {
    const a = fadeOut(t, 0.5) * 0.85;
    if (a <= 0) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const r = p.r * (0.35 + i * 0.22) * (0.8 + 0.3 * easeOut(clamp01(t * 2)));
      x.globalAlpha = a * (0.9 - i * 0.18);
      x.strokeStyle = i % 2 ? '#ff8aff' : '#b060ff';
      x.lineWidth = 1.6;
      x.beginPath();
      for (let s = 0; s <= 28; s++) {
        const ang = (s / 28) * Math.PI * 2;
        const wob = 1 + 0.16 * Math.sin(ang * 3 + p.age / 90 + i * 1.3);
        const px = p.x + Math.cos(ang + p.age / (300 - i * 40)) * r * wob, py = p.y + Math.sin(ang + p.age / (300 - i * 40)) * r * 0.7 * wob;
        if (s) x.lineTo(px, py); else x.moveTo(px, py);
      }
      x.stroke();
    }
    x.restore();
  },
  // かい中電とうの ひかり（したの すみから のびる 光の すじ）
  j4beam(x, p, t) {
    const a = fadeOut(t, 0.6) * 0.55;
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / 90));
    const ex = p.x0 + (p.x - p.x0) * k, ey = p.y0 + (p.y - p.y0) * k;
    const ang = Math.atan2(ey - p.y0, ex - p.x0), L = Math.hypot(ex - p.x0, ey - p.y0);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    x.translate(p.x0, p.y0);
    x.rotate(ang);
    x.fillStyle = '#fff4a0';
    x.beginPath(); x.moveTo(0, -3); x.lineTo(L, -16); x.lineTo(L, 16); x.lineTo(0, 3); x.closePath(); x.fill();
    x.globalAlpha = a * 1.2;
    circle(x, L, 0, 14); x.fill();
    x.restore();
  },
  // ガスの うず（おしり探て い: プゥ〜）
  j4gas(x, p, t) {
    const a = (t < 0.15 ? t / 0.15 : fadeOut(t, 0.55)) * 0.75;
    if (a <= 0) return;
    const r = p.r * (0.5 + 0.6 * easeOut(clamp01(t * 1.6)));
    const rot = p.age / 260 + p.ph;
    x.save();
    for (let i = 0; i < 9; i++) {
      const ang = rot + i * 0.7, rr = r * (0.25 + i * 0.09);
      const bx = p.x + Math.cos(ang) * rr, by = p.y + Math.sin(ang) * rr * 0.7;
      x.globalAlpha = a * (1 - i * 0.06);
      x.fillStyle = i % 3 === 0 ? '#c8d070' : i % 3 === 1 ? '#a8b858' : '#d8c890';
      circle(x, bx, by, 3.5 + i * 0.7); x.fill();
    }
    x.restore();
  },
  // まんがの もじ（ぽんと 大きく なって、ゆれる）
  j4text(x, p, t) {
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    const sc = easeBack(clamp01(p.age / 160));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y + Math.sin(p.age / 110) * 1.2);
    x.rotate(p.rot || 0);
    x.scale(sc, sc);
    pixText(x, p.text, 0, 0, p.s || 2, p.fill || '#ffffff', p.edge || '#2a1a10');
    x.restore();
  },
  // ピカッと 光る「!」（うしろに ひかりの すじ）
  j4excl(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const sc = easeBack(clamp01(p.age / 140));
    x.save();
    x.globalAlpha = a * 0.8;
    x.strokeStyle = '#fff6a0';
    x.lineWidth = 2;
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 + p.age / 400;
      x.moveTo(p.x + Math.cos(ang) * 9 * sc, p.y + Math.sin(ang) * 9 * sc);
      x.lineTo(p.x + Math.cos(ang) * 20 * sc, p.y + Math.sin(ang) * 20 * sc);
    }
    x.stroke();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.scale(sc, sc);
    pixText(x, '!', 0, 0, 2.4, '#ffe040', '#7a2a08');
    x.restore();
  },
  // ゆびさし（ひだりから 手が のびて ゆびを さす）
  j4finger(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / 110));
    const tx = p.x - 30 + 12 * k;
    x.save();
    x.globalAlpha = a;
    x.translate(tx, p.y);
    // そで（あおい 上着）
    x.fillStyle = '#1a2a6a'; x.fillRect(-26, -4, 14, 9);
    x.fillStyle = '#2a54b8'; x.fillRect(-26, -3, 13, 7);
    x.fillStyle = '#ffffff'; x.fillRect(-13, -3, 2, 7);
    // 手と ゆび
    x.fillStyle = '#5a3020';
    x.fillRect(-11, -4, 9, 9); x.fillRect(-3, -3, 13, 4);
    x.fillStyle = '#fbd6b0';
    x.fillRect(-10, -3, 7, 7); x.fillRect(-3, -2, 12, 2);
    x.fillStyle = '#e8b088'; x.fillRect(-10, 2, 7, 1);
    x.restore();
  },
  // カプセル（くすり）
  j4pill(x, p, t) {
    const [cx, cy] = flyPos(p);
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(p.rot0 + p.age / 120);
    rrect(x, 0, 0, 11, 5.6, 2.8); x.fillStyle = '#2a2a36'; x.fill();
    x.fillStyle = p.c1; rrect(x, -2.4, 0, 5, 4, 2); x.fill();
    x.fillStyle = '#ffffff'; rrect(x, 2.4, 0, 5, 4, 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillRect(-4, -1.6, 3, 1);
    x.restore();
  },
  // みどりの 十字（薬局の しるし）
  j4cross(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const sc = easeBack(clamp01(p.age / 180)) * (p.s || 1);
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.scale(sc, sc);
    x.fillStyle = '#0e5a2a'; x.fillRect(-4.5, -11, 9, 22); x.fillRect(-11, -4.5, 22, 9);
    x.fillStyle = '#2ac06a'; x.fillRect(-3.5, -10, 7, 20); x.fillRect(-10, -3.5, 20, 7);
    x.fillStyle = '#b8ffd0'; x.fillRect(-3.5, -10, 2, 8);
    x.restore();
  },
  // ふしぎな ポケット（しろい 半月。中から 道具が 出る）
  j4pocket(x, p, t) {
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    const sc = easeBack(clamp01(p.age / 160));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.scale(sc, sc);
    x.fillStyle = '#1a2a4a';
    x.beginPath(); x.arc(0, 0, 17, 0, Math.PI); x.closePath(); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(0, 0, 15.5, 0, Math.PI); x.closePath(); x.fill();
    x.fillStyle = '#1a1a26'; x.fillRect(-15.5, -1, 31, 2.2);
    x.fillStyle = '#dce8f8';
    x.beginPath(); x.arc(0, 1, 13, 0.2, Math.PI - 0.2); x.stroke();
    // 中の ひかり
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * (0.5 + 0.5 * Math.sin(p.age / 60));
    x.fillStyle = '#fff6b0';
    x.beginPath(); x.ellipse(0, 0, 12, 3, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // ひみつ道具（kind: copter タケコプター・door ピンクの とびら・bell すず・cake どらやき・light ライト・bomb ばくだん）
  j4gadget(x, p, t) {
    const [cx, cy, k] = flyPos(p);
    const a = fadeOut(t, 0.78);
    if (a <= 0) return;
    const s = (p.s || 1) * (0.5 + 0.5 * easeOut(clamp01(k * 2)));
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(p.spin ? p.age / 110 : Math.sin(p.age / 120) * 0.2);
    x.scale(s, s);
    const ol = '#1a1426';
    switch (p.g) {
      case 'copter': {
        x.fillStyle = ol; x.fillRect(-1.5, -6, 3, 9);
        x.fillStyle = '#f2c42a'; x.fillRect(-0.8, -5, 1.6, 7);
        const w = 12 * Math.abs(Math.cos(p.age / 30));
        x.fillStyle = ol; x.fillRect(-w - 1, -8, w * 2 + 2, 3);
        x.fillStyle = '#f2c42a'; x.fillRect(-w, -7.4, w * 2, 1.8);
        x.fillStyle = ol; circle(x, 0, 4, 4); x.fill();
        x.fillStyle = '#f2c42a'; circle(x, 0, 4, 3); x.fill();
        break;
      }
      case 'door': {
        x.fillStyle = ol; x.fillRect(-9, -14, 18, 28);
        x.fillStyle = '#ff7ab8'; x.fillRect(-8, -13, 16, 26);
        x.fillStyle = '#ffb0d8'; x.fillRect(-8, -13, 3, 26);
        x.fillStyle = '#e04a8a'; x.fillRect(-5, -10, 10, 8); x.fillRect(-5, 1, 10, 9);
        x.fillStyle = '#ffe060'; circle(x, 5.5, 0, 1.6); x.fill();
        break;
      }
      case 'bell': {
        x.fillStyle = ol; circle(x, 0, 0, 7); x.fill();
        x.fillStyle = '#f6c830'; circle(x, 0, 0, 6); x.fill();
        x.fillStyle = '#fff4b0'; circle(x, -2, -2, 2); x.fill();
        x.fillStyle = ol; x.fillRect(-6, -1, 12, 1.4); circle(x, 0, 3, 1.4); x.fill(); x.fillRect(-0.5, 3, 1, 3);
        break;
      }
      case 'cake': {
        x.fillStyle = ol; x.beginPath(); x.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#c87a2a'; x.beginPath(); x.ellipse(0, -0.5, 9, 5, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#5a2a14'; x.fillRect(-9, -0.5, 18, 2);
        x.fillStyle = '#e8a050'; x.beginPath(); x.ellipse(-2, -2.6, 5, 1.6, 0, 0, Math.PI * 2); x.fill();
        break;
      }
      case 'light': {
        x.fillStyle = ol; x.fillRect(-4, -2, 12, 6); x.fillRect(-8, -5, 6, 12);
        x.fillStyle = '#7a8ab0'; x.fillRect(-3, -1, 10, 4);
        x.fillStyle = '#d8dcec'; x.fillRect(-7, -4, 4, 10);
        x.globalCompositeOperation = 'lighter';
        x.fillStyle = 'rgba(160,240,255,0.7)';
        x.beginPath(); x.moveTo(8, 1); x.lineTo(22, -7); x.lineTo(22, 9); x.closePath(); x.fill();
        break;
      }
      case 'bomb': {
        x.fillStyle = ol; circle(x, 0, 1, 7); x.fill();
        x.fillStyle = '#3a3a4a'; circle(x, 0, 1, 6); x.fill();
        x.fillStyle = '#8a8aa0'; circle(x, -2, -1, 1.8); x.fill();
        x.strokeStyle = '#c8a060'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(2, -5); x.quadraticCurveTo(5, -9, 7, -7); x.stroke();
        x.fillStyle = (p.age >> 6) % 2 ? '#ffe060' : '#ff6a20'; circle(x, 7, -7, 2); x.fill();
        break;
      }
      default: { // star
        x.fillStyle = '#ffe060';
        x.beginPath();
        for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 3 : 7; x.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); }
        x.closePath(); x.fill();
      }
    }
    x.restore();
  },
  // あせの しずく（あわてる ロボット）
  j4sweat(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    x.save();
    x.globalAlpha = a;
    x.fillStyle = '#1a4a8a';
    x.beginPath(); x.moveTo(p.x, p.y - 5); x.quadraticCurveTo(p.x + 4, p.y + 1, p.x, p.y + 3); x.quadraticCurveTo(p.x - 4, p.y + 1, p.x, p.y - 5); x.fill();
    x.fillStyle = '#9ad8ff';
    x.beginPath(); x.moveTo(p.x, p.y - 3.6); x.quadraticCurveTo(p.x + 2.6, p.y + 0.8, p.x, p.y + 2); x.quadraticCurveTo(p.x - 2.6, p.y + 0.8, p.x, p.y - 3.6); x.fill();
    x.restore();
  },
  // 水の はしら（したから ふきあがる 水と しぶき）
  j4geyser(x, p, t) {
    const up = easeOut(clamp01(p.age / 120));
    const a = fadeOut(t, 0.55);
    if (a <= 0) return;
    const h = p.h * up * (1 - 0.25 * clamp01((t - 0.5) * 2));
    x.save();
    x.globalAlpha = a * 0.9;
    for (const [w, col] of [[p.w, '#1a5a9a'], [p.w * 0.8, '#3a9ae8'], [p.w * 0.45, '#9ae0ff'], [p.w * 0.15, '#ffffff']]) {
      x.fillStyle = col;
      x.beginPath();
      x.moveTo(p.x - w, p.y);
      for (let i = 0; i <= 8; i++) { const yy = p.y - (h * i) / 8; x.lineTo(p.x - w * (1 - i * 0.06) + Math.sin(p.age / 50 + i) * 1.2, yy); }
      x.quadraticCurveTo(p.x, p.y - h - w * 0.8, p.x + w * 0.52, p.y - h);
      for (let i = 8; i >= 0; i--) { const yy = p.y - (h * i) / 8; x.lineTo(p.x + w * (1 - i * 0.06) + Math.sin(p.age / 50 + i + 2) * 1.2, yy); }
      x.closePath();
      x.fill();
    }
    x.restore();
  },
  // 花が さく（花びらが ひらく）
  j4bloom(x, p, t) {
    const a = fadeOut(t, 0.65);
    if (a <= 0) return;
    const k = easeBack(clamp01(p.age / 220));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.rotate(p.age / 900);
    for (let i = 0; i < 6; i++) {
      x.save();
      x.rotate((i / 6) * Math.PI * 2);
      x.fillStyle = '#7a1028'; x.beginPath(); x.ellipse(0, -9 * k, 5.6 * k, 9 * k, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = i % 2 ? '#ff5a7a' : '#ff8aa8'; x.beginPath(); x.ellipse(0, -9 * k, 4.6 * k, 8 * k, 0, 0, Math.PI * 2); x.fill();
      x.restore();
    }
    x.fillStyle = '#6a4a08'; circle(x, 0, 0, 5 * k); x.fill();
    x.fillStyle = '#ffd83a'; circle(x, 0, 0, 4 * k); x.fill();
    x.restore();
  },
  // ムキッ（みどりの うでの こぶが ふくらむ）
  j4flex(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const k = easeBack(clamp01(p.age / 200));
    const pump = 1 + 0.12 * Math.sin(p.age / 50) * (t < 0.6 ? 1 : 0);
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.scale(p.dir * k * pump, k * pump);
    const ol = '#0e2a10';
    // まがった うで（うで・ひじ・にぎった 手）と もりあがった こぶ
    x.fillStyle = ol;
    x.beginPath(); x.ellipse(-8, 6, 11, 6.5, 0.1, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(7, -4, 6.4, 11, 0.25, 0, Math.PI * 2); x.fill();
    circle(x, 8, -14, 6.4); x.fill();
    x.beginPath(); x.ellipse(-6, -1, 9.5, 8.5, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#58b04e';
    x.beginPath(); x.ellipse(-8, 6, 9.6, 5.2, 0.1, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(7, -4, 5.2, 9.8, 0.25, 0, Math.PI * 2); x.fill();
    circle(x, 8, -14, 5.2); x.fill();
    x.fillStyle = '#86d06c';
    x.beginPath(); x.ellipse(-6, -1, 8.2, 7.2, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#c8f4a8';
    x.beginPath(); x.ellipse(-8, -4, 3.4, 2.2, -0.3, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 木の葉（くるくる まわりながら うずを まく）
  j4leaf(x, p, t) {
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    const k = p.age / 1000;
    const ang = p.a0 + k * p.spin;
    const r = p.r * (1 - 0.55 * clamp01(t * 1.2));
    const lx = p.cx + Math.cos(ang) * r, ly = p.cy + Math.sin(ang) * r * 0.55 - k * p.rise;
    x.save();
    x.globalAlpha = a;
    x.translate(lx, ly);
    x.rotate(ang * 2 + p.ph);
    x.scale(1.5, 1.5);
    x.fillStyle = '#14400e';
    x.beginPath(); x.ellipse(0, 0, 5.2, 2.6, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = p.c;
    x.beginPath(); x.ellipse(0, 0, 4.4, 1.9, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#1e5a14'; x.lineWidth = 0.7;
    x.beginPath(); x.moveTo(-4.6, 0); x.lineTo(4.4, 0); x.stroke();
    x.restore();
  },
  // 分身（オレンジの 忍びの かげ。ぽんっと あらわれて、まとに むかって とぶ）
  j4clone(x, p, t) {
    const [cx, cy, k] = flyPos(p, (u) => u * u);
    const a = fadeOut(t, 0.8);
    if (a <= 0) return;
    const s = p.s || 1;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.scale(s * (p.flip ? -1 : 1), s);
    x.rotate(k > 0 && k < 1 ? -0.4 : 0);
    const ol = '#1a1018';
    // あたま（きいろい かみ）・からだ（オレンジと 黒）・あし
    x.fillStyle = ol;
    circle(x, 0, -10, 5.2); x.fill();
    x.fillRect(-5, -6, 10, 11); x.fillRect(-5, 4, 4, 6); x.fillRect(1, 4, 4, 6);
    x.fillStyle = '#ffd040';
    x.beginPath(); x.moveTo(-5, -11); x.lineTo(-3, -16); x.lineTo(-1, -12); x.lineTo(1, -16); x.lineTo(3, -12); x.lineTo(5, -15); x.lineTo(4.4, -9); x.lineTo(-4.4, -9); x.closePath(); x.fill();
    x.fillStyle = '#fbd6b0'; x.fillRect(-3.4, -10, 6.8, 4.4);
    x.fillStyle = '#26304e'; x.fillRect(-4.4, -11.4, 8.8, 1.6);
    x.fillStyle = '#f07a1c'; x.fillRect(-4, -5, 8, 9); x.fillRect(-4, 4, 3, 5); x.fillRect(1, 4, 3, 5);
    x.fillStyle = '#1e1e28'; x.fillRect(-4, -5, 8, 3);
    x.restore();
  },
  // 大きな まわる 青い たま（さいごに たたきこむ）
  j4orb(x, p, t) {
    const [cx, cy, k] = flyPos(p);
    const a = fadeOut(t, 0.72);
    if (a <= 0) return;
    const r = p.r * (0.4 + 0.6 * easeOut(clamp01(p.age / 220))) * (k >= 1 ? 1 + (p.age - p.travel) / 600 : 1);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * 0.5;
    x.fillStyle = '#3a8aff'; circle(x, cx, cy, r * 1.35); x.fill();
    x.globalAlpha = a * 0.8;
    x.fillStyle = '#7ad0ff'; circle(x, cx, cy, r); x.fill();
    x.globalAlpha = a;
    x.strokeStyle = '#ffffff'; x.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      const s0 = p.age / 70 + i * 1.57;
      x.beginPath(); x.arc(cx, cy, r * (0.4 + i * 0.14), s0, s0 + 2.2); x.stroke();
    }
    x.fillStyle = '#ffffff'; circle(x, cx, cy, r * 0.32); x.fill();
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playJob4Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!SIG4.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const each = (fn) => targets.forEach((t, ti) => fn(t.x, t.y, ti * (all ? 70 : 0), ti, t));
  // まとの まわりの はば（全体の ときは すこし 小さく）
  const sz = all ? 0.85 : 1;
  const left = Math.min(...targets.map((t) => t.x)), right = Math.max(...targets.map((t) => t.x));
  const cxAll = (left + right) / 2, cyAll = targets.reduce((a, t) => a + t.y, 0) / targets.length;
  switch (anim) {
    case 'rakuten_cardman_sig': {
      // 赤い カードが ひだりしたから つぎつぎ とんで くる
      each((x, y, d, ti) => {
        for (let k = 0; k < 5; k++) {
          const dd = d * 0.5 + k * 55;
          fx.add({ kind: 'j4card', x0: 18 + k * 6, y0: H - 10 - k * 4, x1: x + rnd(-6, 6), y1: y + rnd(-6, 6), x, y, travel: 90 + k * 10, arc: 14, rot0: rnd(0, 6), s: 1.6 * sz, life: 560, delay: dd });
          fx.impact(x + rnd(-4, 4), y + rnd(-4, 4), { r: crit ? 18 : 14, color: '#ffe0e0', delay: dd + 90 });
        }
        fx.glow(x, y, { color: '#ff3a4a', r: 22, delay: d * 0.5 + 40, life: 420 });
        fx.star(x, y, '#ffd040', crit ? 20 : 15, d * 0.5 + 100, 260);
        fx.burst(x, y, ['#ffffff', '#ff3a4a', '#ffd040'], 14, 110, { delay: d * 0.5 + 140 });
        if (ti === 0) fx.hitStop(crit ? 200 : 140, d * 0.5 + 100, 1.2);
      });
      fx.flashAt(60, '#ffe0e0', 60);
      return true;
    }
    case 'kisatsu_sig': {
      // かみなりの いっせん: きいろい いなずまが よこに はしり、白い 一太刀
      fx.flashAt(70, '#fff6b0', 0);
      fx.tintAt('rgba(20, 18, 0, 0.3)', 600);
      each((x, y, d, ti) => {
        const dd = d * 0.5;
        fx.zap(x - 70, y + 6, x + 60, y - 6, { color: '#fff070', glow: '#ffb020', w: 2.6, delay: dd, life: 300, forks: 3 });
        fx.slash(x, y, '#ffffff', 1, { angs: [-0.12], len: 70 * sz, w: 3, glow: '#ffe060', delay: dd + 20 });
        fx.glow(x, y, { color: '#ffe060', r: 26, delay: dd + 10, life: 360 });
        fx.sparks(x, y, { colors: ['#ffffff', '#fff070', '#ffb020'], n: 18, speed: 170, delay: dd + 30, life: 380, len: 9 });
        fx.add({ kind: 'j4text', x: x, y: Math.max(16, y - 26), text: '!', s: 2.2, fill: '#fff070', edge: '#5a3a00', life: 700, delay: dd + 60 });
        if (ti === 0) fx.hitStop(200, dd + 30, 1.5);
      });
      return true;
    }
    case 'enbashira_sig': {
      // 炎の 剣の なみ: 大きな ほのおの 三日月が ふりぬかれ、火の こが まう
      fx.tintAt('rgba(60, 12, 0, 0.3)', 900);
      each((x, y, d, ti) => {
        fx.add({ kind: 'j4flamearc', x: x - 4, y: y + 2, r: 30 * sz, sy: 0.75, a0: -2.8, a1: 0.7, w: 5 * sz, swing: 140, life: 620, delay: d * 0.5 });
        fx.add({ kind: 'j4flamearc', x: x + 4, y: y - 2, r: 22 * sz, sy: 0.75, a0: 0.4, a1: -2.6, w: 3.6 * sz, swing: 120, life: 520, delay: d * 0.5 + 160 });
        fx.glow(x, y, { color: '#ff7a1c', r: 30, delay: d * 0.5 + 30, life: 500 });
        fx.bigHit(x, y, { crit, color: '#ffb040', delay: d * 0.5 + 60 });
        fx.fireUp(x, y + 10, 14, d * 0.5 + 60);
        for (let k = 0; k < 8; k++) fx.twinkle(x + rnd(-24, 24), y + rnd(-16, 16), { color: pick(['#ffd040', '#ff7a1c']), size: rnd(2, 3.4), delay: d * 0.5 + 120 + k * 40, life: 420, vy: -30 });
        if (ti === 0) fx.hitStop(crit ? 220 : 160, d * 0.5 + 60, 1.4);
      });
      return true;
    }
    case 'hinokami_sig': {
      // 日の まい: えんを えがいて まわる ほのおの わと、日の ひかり
      fx.tintAt('rgba(50, 20, 0, 0.26)', 1000);
      each((x, y, d, ti) => {
        fx.add({ kind: 'j4firering', x, y, r: 26 * sz, life: 1100, delay: d * 0.4 });
        fx.add({ kind: 'j4flamearc', x, y, r: 20 * sz, sy: 0.9, a0: -1.6, a1: 4.6, w: 4 * sz, swing: 300, life: 700, delay: d * 0.4 + 40 });
        fx.glow(x, y, { color: '#ffb030', r: 34, delay: d * 0.4 + 20, life: 700 });
        fx.impact(x, y, { r: crit ? 22 : 18, color: '#fff2c0', delay: d * 0.4 + 60 });
        fx.shock(x, y, { r0: 6, r1: 40, color: '#ffd060', w: 2.4, delay: d * 0.4 + 300, life: 400 });
        fx.sparks(x, y, { colors: ['#fff6c0', '#ffb030', '#ff5a1c'], n: 16, speed: 140, delay: d * 0.4 + 320, life: 420, len: 8 });
        if (ti === 0) fx.hitStop(180, d * 0.4 + 60, 1.2);
      });
      return true;
    }
    case 'spy_sig': {
      // ねらいを さだめて ひそかに 一げき（赤い ねらいの まると 小さな はり）
      fx.tintAt('rgba(0, 20, 10, 0.32)', 800);
      each((x, y, d, ti) => {
        fx.add({ kind: 'j4scope', x, y, r: 16 * sz, life: 560, delay: d * 0.3 });
        fx.impact(x, y, { r: crit ? 16 : 12, color: '#ffffff', delay: d * 0.3 + 100 });
        fx.cut(x, y, { ang: -0.6, len: 26 * sz, color: '#ffffff', glow: '#ff5a5a', delay: d * 0.3 + 90 });
        fx.puff(x + 4, y + 2, { color: '#606878', r0: 3, r1: 14, alpha: 0.5, delay: d * 0.3 + 160, life: 520 });
        fx.sparks(x, y, { colors: ['#ffffff', '#ff6a6a'], n: 8, speed: 100, delay: d * 0.3 + 100, life: 260, len: 6 });
        if (ti === 0) fx.hitStop(120, d * 0.3 + 100, 1);
      });
      return true;
    }
    case 'assassin_sig': {
      // くらやみの 十字: がめんが くらく なり、黒い 2本の きりさきと 赤い ひかり
      fx.tintAt('rgba(0, 0, 0, 0.5)', 700);
      each((x, y, d, ti) => {
        const dd = d * 0.4;
        fx.slash(x, y, '#2a0008', 2, { angs: [-0.8, 0.8], len: 44 * sz, w: 4, glow: '#c0101c', delay: dd, gap: 70 });
        fx.slash(x, y, '#ffffff', 2, { angs: [-0.8, 0.8], len: 40 * sz, w: 1.2, delay: dd + 10, gap: 70 });
        fx.glow(x, y, { color: '#ff2030', r: 18, delay: dd + 40, life: 340 });
        fx.impact(x, y, { r: crit ? 18 : 14, color: '#ffd0d0', delay: dd + 60 });
        fx.sparks(x, y, { colors: ['#ff3a4a', '#ffffff'], n: 10, speed: 120, delay: dd + 80, life: 300, len: 8 });
        if (ti === 0) fx.hitStop(crit ? 240 : 170, dd + 60, 1.3);
      });
      return true;
    }
    case 'black_org_sig': {
      // 黒い 車が ひだりから はしって きて、黒い けむりが のこる
      const yRow = Math.min(H - 10, Math.max(...targets.map((t) => t.y)) + 18);
      const x0 = -34, xh = Math.max(x0 + 1, left - 16), t1 = 80, v = 0.7;
      fx.add({ kind: 'j4car', x: x0, y: yRow, x0, xh, t1, v, life: Math.min(1500, t1 + (W + 80 - xh) / v) });
      for (let k = 0; k < 10; k++) fx.puff(Math.min(W - 10, left - 30 + k * 18), yRow - 6, { color: '#1a1a22', vx: -20, vy: -12, r0: 4, r1: 18, alpha: 0.65, delay: 60 + k * 70, life: 700 });
      each((x, y, d, ti) => {
        const hd = t1 + Math.max(0, x - 16 - xh) / v;
        fx.speedLines(x, y, { delay: 0, r0: 14, r1: 70, n: 12, life: 220, color: '#c8c8d8' });
        fx.bigHit(x, y, { crit, heavy: true, delay: hd, color: '#a0a0c0' });
        fx.debris(x, y + 12, ['#2a2a36', '#5a5a6a', '#ffffff'], 8, hd, 100);
        if (ti === 0) fx.hitStop(220, hd, 1.5);
      });
      return true;
    }
    case 'esper_sig': {
      // ゆがむ 空間と うかぶ スプーン
      fx.tintAt('rgba(40, 0, 60, 0.3)', 1000);
      each((x, y, d, ti) => {
        fx.add({ kind: 'j4warp', x, y, r: 34 * sz, life: 1100, delay: d * 0.4 });
        fx.glow(x, y, { color: '#c060ff', r: 26, delay: d * 0.4 + 20, life: 600 });
        fx.impact(x, y, { r: crit ? 18 : 14, color: '#f0d0ff', delay: d * 0.4 + 80 });
        for (let k = 0; k < (all ? 2 : 3); k++) fx.add({ kind: 'j4spoon', x: x + (k - 1) * 16, y: y - 22 + Math.abs(k - 1) * 6, rot: (k - 1) * 0.5, ph: k * 2, life: 1200, delay: d * 0.4 + k * 60 });
        fx.converge(x, y, { colors: ['#ff8aff', '#b060ff', '#ffffff'], n: 14, r: 40, delay: d * 0.4, life: 300 });
        if (ti === 0) fx.hitStop(160, d * 0.4 + 80, 1.1);
      });
      return true;
    }
    case 'shonen_tantei_sig': {
      // かい中電とうで てらして、バッジが ひかる（みんなで みつけた！）
      each((x, y, d, ti) => {
        fx.add({ kind: 'j4beam', x0: 14 + ti * 10, y0: H - 6, x, y, life: 800, delay: d * 0.3 });
        fx.glow(x, y, { color: '#fff4a0', r: 24, delay: d * 0.3 + 40, life: 500 });
        fx.impact(x, y, { r: crit ? 16 : 13, color: '#ffffff', delay: d * 0.3 + 90 });
        fx.add({ kind: 'j4text', x: Math.min(W - 12, x + 16), y: Math.max(16, y - 22), text: '!?', s: 1.8, fill: '#ffe040', edge: '#3a2a08', life: 800, delay: d * 0.3 + 120 });
        for (let k = 0; k < 5; k++) fx.twinkle(x + rnd(-18, 18), y + rnd(-14, 14), { color: '#ffd040', size: rnd(2.5, 4), delay: d * 0.3 + 140 + k * 50, life: 380, spin: 3 });
        if (ti === 0) fx.hitStop(120, d * 0.3 + 90, 1);
      });
      return true;
    }
    case 'oshiri_tantei_sig': {
      // プゥ〜: きいろっぽい ガスの うずが まとを つつむ
      each((x, y, d, ti) => {
        fx.add({ kind: 'j4gas', x, y: y + 4, r: 30 * sz, ph: ti, life: 1300, delay: d * 0.3 });
        fx.add({ kind: 'j4gas', x: x - 10, y: y + 10, r: 18 * sz, ph: ti + 2, life: 1100, delay: d * 0.3 + 120 });
        fx.impact(x, y, { r: crit ? 16 : 12, color: '#f0f0b0', delay: d * 0.3 + 80 });
        fx.shock(x, y + 4, { r0: 4, r1: 36, color: '#d8e070', w: 2.2, delay: d * 0.3 + 60, life: 420, sy: 0.6 });
        if (ti === 0) fx.hitStop(140, d * 0.3 + 80, 1.1);
      });
      fx.add({ kind: 'j4text', x: Math.min(W - 40, Math.max(40, cxAll)), y: Math.max(22, Math.min(...targets.map((t) => t.y)) - 30), text: 'プゥ〜', s: 2, fill: '#fff8c8', edge: '#5a4a10', life: 1200, delay: 60, rot: -0.08 });
      return true;
    }
    case 'meitantei_sig': {
      // ピカッと ひらめいて「!」、ゆびを さして いっきに とく
      fx.flashAt(70, '#ffffff', 0);
      each((x, y, d, ti) => {
        fx.add({ kind: 'j4finger', x: x - 10, y, life: 900, delay: d * 0.4 });
        fx.add({ kind: 'j4excl', x: x + 6, y: Math.max(18, y - 26), life: 900, delay: d * 0.4 + 20 });
        fx.glow(x, y, { color: '#ffffff', r: 22, delay: d * 0.4 + 60, life: 400 });
        fx.impact(x, y, { r: crit ? 18 : 14, color: '#fff6c0', delay: d * 0.4 + 90 });
        fx.speedLines(x, y, { delay: d * 0.4 + 60, r0: 18, r1: 80, n: 14, color: '#fff6c0' });
        if (ti === 0) fx.hitStop(160, d * 0.4 + 90, 1.2);
      });
      return true;
    }
    case 'creator_sig': {
      // くすりの カプセルが とんで、みどりの 十字が ひかる（なおす 技でも、敵に つかっても）
      each((x, y, d, ti) => {
        for (let k = 0; k < 6; k++) fx.add({ kind: 'j4pill', x0: x + rnd(-40, 40), y0: H + 6, x1: x + rnd(-10, 10), y1: y + rnd(-10, 10), x, y, travel: 100 + k * 12, arc: 18, rot0: rnd(0, 6), c1: pick(['#e83a4a', '#2a8ae0', '#f2c42a', '#2ac06a']), life: 640, delay: d * 0.4 + k * 30 });
        fx.add({ kind: 'j4cross', x, y: y - 2, s: sz, life: 800, delay: d * 0.4 + 60 });
        fx.glow(x, y, { color: '#5ae890', r: 24, delay: d * 0.4 + 40, life: 600 });
        fx.impact(x, y, { r: 13, color: '#e0ffe8', delay: d * 0.4 + 100 });
        for (let k = 0; k < 6; k++) fx.twinkle(x + rnd(-16, 16), y + rnd(-16, 10), { color: '#b8ffd0', size: rnd(2, 3.6), delay: d * 0.4 + 200 + k * 40, life: 400, vy: -24 });
        if (ti === 0) fx.hitStop(100, d * 0.4 + 100, 0.8);
      });
      return true;
    }
    case 'neko_robot_sig':
    case 'mimi_robot_sig':
    case 'doraemon_sig': {
      // ポケットから ひみつ道具が とびだす
      const px = Math.max(30, Math.min(W - 30, cxAll)), py = Math.min(H - 12, cyAll + 30);
      fx.add({ kind: 'j4pocket', x: px, y: py, life: 1300 });
      const kinds = anim === 'doraemon_sig' ? ['copter', 'door', 'light', 'cake'] : anim === 'mimi_robot_sig' ? ['bomb', 'bell', 'cake', 'bomb', 'copter'] : ['bell', 'copter', 'cake'];
      if (anim === 'doraemon_sig') {
        // 道具を たかく かかげる（まわりに ひかりの すじ）
        // ピンクの とびらは ポケットの よこに たてる（まとを かくさない）
        const dx = px > W / 2 ? px - 52 : px + 52, dy = Math.max(26, py - 30);
        fx.add({ kind: 'j4gadget', g: 'door', x0: px, y0: py, x1: dx, y1: dy, travel: 200, s: 1.3, life: 1000, delay: 40 });
        fx.speedLines(dx, dy, { color: '#fff6c0', n: 18, r0: 18, r1: 60, delay: 200, life: 400 });
        fx.flashAt(60, '#fff6e0', 220);
      }
      if (anim === 'mimi_robot_sig') {
        // あわてて なんでも ほうりだす（あせの しずく）
        for (let k = 0; k < 4; k++) fx.add({ kind: 'j4sweat', x: px + rnd(-24, 24), y: py - rnd(10, 26), vy: -20, g: 120, life: 600, delay: k * 120 });
      }
      each((x, y, d, ti) => {
        const n = all ? 2 : 3;
        for (let k = 0; k < n; k++) {
          const g = kinds[(ti * n + k) % kinds.length];
          fx.add({ kind: 'j4gadget', g, x0: px + rnd(-6, 6), y0: py - 2, x1: x + rnd(-8, 8), y1: y + rnd(-8, 8), travel: 100 + k * 12, arc: 26, s: 0.9 * sz, spin: anim === 'mimi_robot_sig', life: 700, delay: d * 0.3 + k * 50 });
        }
        fx.impact(x, y, { r: crit ? 18 : 14, color: '#ffffff', delay: d * 0.3 + 100 });
        fx.glow(x, y, { color: '#9ad8ff', r: 22, delay: d * 0.3 + 60, life: 420 });
        fx.star(x, y, '#ffe060', crit ? 20 : 15, d * 0.3 + 110, 260);
        if (anim === 'mimi_robot_sig') fx.burst(x, y, ['#ff8a3a', '#ffe060', '#5a5a6a'], 14, 120, { delay: d * 0.3 + 120 });
        for (let k = 0; k < 4; k++) fx.twinkle(x + rnd(-20, 20), y + rnd(-18, 12), { color: '#fff6c0', size: rnd(2.5, 4), delay: d * 0.3 + 150 + k * 50, life: 380, spin: 3 });
        if (ti === 0) fx.hitStop(140, d * 0.3 + 100, 1.1);
      });
      return true;
    }
    case 'kappa_sig':
    case 'hanakappa_sig': {
      // 水しぶき: まとの したから 水の はしらが ふきあがる（はなかっぱは 花も さく）
      each((x, y, d, ti) => {
        fx.add({ kind: 'j4geyser', x, y: y + 18, w: 9 * sz, h: 46 * sz, life: 820, delay: d * 0.4 });
        fx.impact(x, y, { r: crit ? 18 : 14, color: '#e0f8ff', delay: d * 0.4 + 70 });
        for (let k = 0; k < 14; k++) fx.drop(x + rnd(-6, 6), y - 10, { color: pick(['#9ae0ff', '#ffffff', '#3a9ae8']), vx: rnd(-90, 90), vy: rnd(-160, -60), g: 360, size: rnd(1.2, 2.2), delay: d * 0.4 + 90, life: 640 });
        fx.shock(x, y + 16, { r0: 4, r1: 30, color: '#bfeaff', w: 2, delay: d * 0.4 + 40, life: 400, sy: 0.4 });
        if (anim === 'hanakappa_sig') {
          fx.add({ kind: 'j4bloom', x, y: y - 20, life: 1000, delay: d * 0.4 + 160 });
          for (let k = 0; k < 8; k++) fx.petal(x + rnd(-10, 10), y - 20, { color: pick(['#ff5a7a', '#ff8aa8', '#ffd83a']), vx: rnd(-60, 60), vy: rnd(-60, -10), delay: d * 0.4 + 260, life: 800 });
        }
        if (ti === 0) fx.hitStop(150, d * 0.4 + 70, 1.1);
      });
      return true;
    }
    case 'kinniku_kappa_sig': {
      // ムキッ: みどりの うでの こぶが ふくらんで、ドーンと しょうげき
      each((x, y, d, ti) => {
        fx.add({ kind: 'j4flex', x: x - 14 * sz, y: y - 6, dir: 1, life: 900, delay: d * 0.4 });
        fx.add({ kind: 'j4flex', x: x + 14 * sz, y: y - 6, dir: -1, life: 900, delay: d * 0.4 + 40 });
        fx.bigHit(x, y, { crit, heavy: true, delay: d * 0.4 + 90, color: '#c8f4a8' });
        fx.shock(x, y, { r0: 6, r1: 50, color: '#d8ffb0', w: 3, delay: d * 0.4 + 90, life: 420 });
        fx.speedLines(x, y, { delay: d * 0.4 + 90, r0: 20, r1: 90, n: 16, color: '#e8ffd8' });
        if (ti === 0) { fx.flashAt(50, '#e8ffd8', d * 0.4 + 90); fx.hitStop(crit ? 260 : 200, d * 0.4 + 90, 1.6); }
      });
      fx.add({ kind: 'j4text', x: Math.min(W - 30, Math.max(30, cxAll)), y: Math.max(18, Math.min(...targets.map((t) => t.y)) - 32), text: '!!', s: 2.4, fill: '#d8ffb0', edge: '#1a4a10', life: 900, delay: 100 });
      return true;
    }
    case 'konoha_sig': {
      // 木の葉の うず: 葉っぱが まわりながら まとを つつむ
      each((x, y, d, ti) => {
        const n = all ? 10 : 16;
        for (let k = 0; k < n; k++) fx.add({ kind: 'j4leaf', x, y, cx: x, cy: y + 4, r: rnd(18, 34) * sz, a0: (k / n) * Math.PI * 2, spin: rnd(6, 9), rise: rnd(6, 20), ph: rnd(0, 6), c: pick(['#5ac040', '#3a9a2a', '#8ad860']), life: rnd(900, 1250), delay: d * 0.3 + k * 12 });
        fx.swirl(x, y + 8, ['#c8f0b0', '#8ad860'], { n: 12, rad: 22 * sz, h: 30, delay: d * 0.3, life: 700, size: 1.4 });
        fx.impact(x, y, { r: crit ? 18 : 14, color: '#e8ffd8', delay: d * 0.3 + 80 });
        fx.cut(x, y, { ang: 0.7, len: 30 * sz, color: '#ffffff', glow: '#7ad860', delay: d * 0.3 + 70 });
        if (ti === 0) fx.hitStop(140, d * 0.3 + 80, 1.1);
      });
      return true;
    }
    case 'hokage_sig': {
      // 分身が たくさん あらわれて、大きな 青い たまを たたきこむ
      const n = Math.min(8, 4 + targets.length * 2);
      for (let k = 0; k < n; k++) {
        const sx = 16 + (k * (W - 32)) / Math.max(1, n - 1), sy = H - 14 - (k % 2) * 10;
        const tg = targets[k % targets.length];
        fx.puff(sx, sy - 6, { color: '#f0f0f8', r0: 4, r1: 16, alpha: 0.8, delay: k * 25, life: 380 });
        fx.add({ kind: 'j4clone', x0: sx, y0: sy, x1: tg.x + rnd(-14, 14), y1: tg.y + rnd(-10, 10), x: sx, y: sy, travel: 110, arc: 16, s: 1.4, flip: sx > tg.x, life: 420, delay: k * 25 });
      }
      each((x, y, d, ti) => {
        fx.add({ kind: 'j4orb', x0: x, y0: y - 30, x1: x, y1: y, x, y, travel: 80, r: (crit ? 16 : 13) * sz, life: 760, delay: d * 0.3 });
        fx.impact(x, y, { r: crit ? 22 : 18, color: '#d8f0ff', delay: d * 0.3 + 80 });
        fx.shock(x, y, { r0: 6, r1: 52, color: '#7ad0ff', w: 3, delay: d * 0.3 + 100, life: 460 });
        fx.sparks(x, y, { colors: ['#ffffff', '#7ad0ff', '#3a8aff'], n: 18, speed: 170, delay: d * 0.3 + 100, life: 420, len: 9 });
        for (let k = 0; k < 3; k++) fx.puff(x + rnd(-16, 16), y + rnd(-10, 10), { color: '#f0f0f8', r0: 4, r1: 14, alpha: 0.7, delay: d * 0.3 + 380 + k * 40, life: 360 });
        if (ti === 0) { fx.flashAt(60, '#d8f0ff', d * 0.3 + 90); fx.hitStop(crit ? 260 : 200, d * 0.3 + 90, 1.6); }
      });
      return true;
    }
  }
  return false;
}

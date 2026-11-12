// 引っこしコード KIZUNA-5 の ちぢめる しくみ（第78回。docs/plan-r78-transfer.md）
//
// えらんだ やりかた: 文脈まぜ（context mixing）＋ 算術符号
//   1ビットずつ「つぎは 0 か 1 か」を、前の 1〜6文字・同じ ならびの くりかえし（match）から 予想して、
//   その 予想を まぜて（mixer）、算術符号で 書く。deflate（zlib -9）より 2わり、下じき（transfer-prime.js）も 使うと 5わり みじかい
// きまり（node でも ブラウザでも 同じ 結果に する ため）
//   ・整数の 足し算・かけ算・わり算（2の べき）だけ。Math.exp などは 使わない（端末で 少し ちがう ことが ある）
//   ・同期・依存なし（npm の パッケージも CompressionStream も 使わない）
// ちぢめる 前の 文字は UTF-8 の バイト。書く 物: [もとの バイト数（7ビットずつ）][算術符号の バイト]

// ───── 予想を 足しやすい 形（stretch）と もどす 形（squash）。12ビット（0〜4095） ─────
const SQ = [1, 2, 3, 6, 10, 16, 27, 45, 73, 120, 194, 310, 488, 747, 1101, 1546, 2047, 2549, 2994, 3348, 3607, 3785, 3901, 3975, 4024, 4050, 4068, 4079, 4085, 4089, 4092, 4093, 4094];
function squash(d) {
  if (d > 2047) return 4095;
  if (d < -2047) return 1;
  const w = d & 127;
  const i = (d >> 7) + 16;
  return (SQ[i] * (128 - w) + SQ[i + 1] * w + 64) >> 7;
}
const STRETCH = new Int16Array(4096);
{
  let pi = 0;
  for (let x = -2047; x <= 2047; x++) {
    const v = squash(x);
    for (let i = pi; i <= v; i++) STRETCH[i] = x;
    pi = v + 1;
  }
  for (let i = pi; i < 4096; i++) STRETCH[i] = 2047;
}
// 数えた 回数ごとの 学ぶ 速さ（65536 / (n + 1.5)）
const RATE_MAX = 60;
const DT = new Int32Array(RATE_MAX + 1);
for (let n = 0; n <= RATE_MAX; n++) DT[n] = Math.floor(131072 / (2 * n + 3));

const ORDERS = [1, 2, 3, 4, 6];
// 文脈: 前の n 文字（ORDERS）
const NCTX = ORDERS.length;
const N_IN = NCTX + 3; // 0文字の 文脈・くりかえし・いつも 1（bias）
const TBITS = 19;
const MAXLEN = 62;
const MBITS = 18;

// 予想する 部品の 中み（数の 表と 今の いち）。下じき（prime）を 読ませた あとの 中みは 1回だけ 作って とっておき、
// ちぢめる・もどす たびに うつして 使う（下じきを 毎回 読むと おそい）
function newState(cap) {
  const tabSize = 1 << TBITS;
  const apmRow = new Uint16Array(33);
  for (let j = 0; j < 33; j++) apmRow[j] = squash((j - 16) * 128) * 16;
  const apm1 = new Uint16Array(256 * 33);
  const apm2 = new Uint16Array(65536 * 33);
  for (let c = 0; c < 256; c++) apm1.set(apmRow, c * 33);
  for (let c = 0; c < 65536; c++) apm2.set(apmRow, c * 33);
  return {
    prob: Array.from({ length: NCTX }, () => new Uint16Array(tabSize).fill(32768)),
    cnt: Array.from({ length: NCTX }, () => new Uint8Array(tabSize)),
    p0: new Uint16Array(256 * 256).fill(32768), // 0文字の 文脈（今の バイトの とちゅう）は 1つ前の 文字と いっしょに
    n0: new Uint8Array(256 * 256),
    mProb: new Uint16Array(64 * 2 * 256).fill(32768),
    mCnt: new Uint8Array(64 * 2 * 256),
    wts: new Float64Array(256 * N_IN).fill(Math.floor(65536 * 0.3)),
    apm1,
    apm2,
    buf: new Uint8Array(cap + 8),
    mtab: new Int32Array(1 << MBITS),
    base: new Int32Array(NCTX),
    pos: 0, mPtr: 0, mLen: 0, started: false,
  };
}
function cloneState(S, more) {
  const buf = new Uint8Array(S.pos + more + 8);
  buf.set(S.buf.subarray(0, S.pos));
  return {
    prob: S.prob.map((a) => a.slice()), cnt: S.cnt.map((a) => a.slice()),
    p0: S.p0.slice(), n0: S.n0.slice(), mProb: S.mProb.slice(), mCnt: S.mCnt.slice(), wts: S.wts.slice(),
    apm1: S.apm1.slice(), apm2: S.apm2.slice(), buf, mtab: S.mtab.slice(), base: S.base.slice(),
    pos: S.pos, mPtr: S.mPtr, mLen: S.mLen, started: S.started,
  };
}
let primed = null; // { prime, state }
function stateFor(prime, size) {
  if (!prime || !prime.length) return newState(size);
  if (!primed || primed.prime !== prime) {
    const S = newState(prime.length);
    const m = makeModel(S);
    for (let i = 0; i < prime.length; i++) for (let b = 7; b >= 0; b--) {
      m.predict();
      m.update((prime[i] >> b) & 1);
    }
    m.save();
    primed = { prime, state: S };
  }
  return cloneState(primed.state, size);
}

// 予想する 部品（書く ほうと 読む ほうで まったく 同じ）
function makeModel(S) {
  const { prob, cnt, p0, n0, mProb, mCnt, wts, apm1, apm2, buf, mtab, base } = S;
  const idx = new Int32Array(NCTX);
  const st = new Int32Array(N_IN);
  let pos = S.pos, c0 = 1, bitPos = 0;
  let mPtr = S.mPtr, mLen = S.mLen, mBit = 0;
  let pr = 2048, prMix = 2048, a1 = 0, a2 = 0, aw = 0, i0 = 0, mi = -1, wsel = 0;

  const upd = (P, C, i, y) => {
    const n = C[i];
    const p = P[i];
    P[i] = p + Math.trunc((((y << 16) - y) - p) * DT[n] / 65536);
    if (n < RATE_MAX) C[i] = n + 1;
  };
  const hashOrder = (k) => {
    let h = Math.imul(k + 1, 0x9E3779B1);
    for (let j = 1; j <= k; j++) h = Math.imul(h ^ buf[pos - j], 0x2F0B4AD5) ^ (h >>> 15);
    return h;
  };
  const startByte = () => {
    for (let k = 0; k < ORDERS.length; k++) base[k] = pos >= ORDERS[k] ? hashOrder(ORDERS[k]) : Math.imul(k + 7, 0x7FEB352D);
    // くりかえし（match）: さいごの 5文字が 前に 出て いたら、その つづきを 予想に 使う
    if (mLen > 0 && mPtr < pos) {
      mLen = Math.min(mLen + 1, MAXLEN);
      mPtr++;
    } else mLen = 0;
    if (pos >= 5) {
      let h = 0;
      for (let j = 1; j <= 5; j++) h = Math.imul(h ^ buf[pos - j], 0x01000193);
      h = (h >>> (32 - MBITS));
      if (mLen === 0) {
        const cand = mtab[h];
        if (cand > 0) {
          let len = 0;
          while (len < MAXLEN && cand - len - 1 >= 0 && buf[cand - len - 1] === buf[pos - len - 1]) len++;
          if (len >= 5) {
            mLen = len;
            mPtr = cand;
          }
        }
      }
      mtab[h] = pos;
    }
  };
  const predict = () => {
    for (let k = 0; k < NCTX; k++) {
      const i = (Math.imul(base[k] ^ Math.imul(c0, 0x6F4F2A35), 0x9E3779B1) >>> (32 - TBITS));
      idx[k] = i;
      st[k] = STRETCH[prob[k][i] >>> 4];
    }
    const c1 = pos > 0 ? buf[pos - 1] : 0;
    i0 = c1 * 256 + c0;
    st[NCTX] = STRETCH[p0[i0] >>> 4];
    // くりかえし
    if (mLen > 0) {
      const want = buf[mPtr] | 256;
      if ((want >> (8 - bitPos)) === c0) {
        mBit = (want >> (7 - bitPos)) & 1;
        mi = ((Math.min(mLen, 63) * 2 + mBit) << 8) | (c0 & 255);
        st[NCTX + 1] = STRETCH[mProb[mi] >>> 4];
      } else {
        mLen = 0;
        mi = -1;
        st[NCTX + 1] = 0;
      }
    } else {
      mi = -1;
      st[NCTX + 1] = 0;
    }
    st[NCTX + 2] = 256;
    // まぜる（重みは 今の バイトの とちゅうの 形ごと）
    wsel = (mLen > 0 ? 128 : 0) | (c0 & 127);
    const w0 = wsel * N_IN;
    let dot = 0;
    for (let k = 0; k < N_IN; k++) dot += wts[w0 + k] * st[k];
    let d = Math.floor(dot / 65536);
    if (d > 2047) d = 2047;
    if (d < -2047) d = -2047;
    prMix = squash(d);
    // 2つの 仕上げ（APM）: 今の バイトの とちゅう ／ 1つ前の 文字も
    const s = d + 2048;
    aw = s & 127;
    const j = s >> 7;
    a1 = c0 * 33 + j;
    a2 = ((c1 << 8) | c0) * 33 + j;
    const pa1 = (apm1[a1] * (128 - aw) + apm1[a1 + 1] * aw) >> 11;
    const pa2 = (apm2[a2] * (128 - aw) + apm2[a2 + 1] * aw) >> 11;
    pr = (prMix * 2 + pa1 + pa2 + 2) >> 2;
    if (pr < 1) pr = 1;
    if (pr > 4095) pr = 4095;
    return pr;
  };
  const apmUpd = (T, i, y) => {
    const g = (y << 16) + (y << 5) - y - y;
    T[i] += Math.trunc((g - T[i]) * (128 - aw) / 8192);
    T[i + 1] += Math.trunc((g - T[i + 1]) * aw / 8192);
  };
  const update = (y) => {
    // 重みを なおす
    const err = ((y << 12) - prMix) * 2;
    const w0 = wsel * N_IN;
    for (let k = 0; k < N_IN; k++) wts[w0 + k] += Math.trunc(st[k] * err / 1024);
    for (let k = 0; k < NCTX; k++) upd(prob[k], cnt[k], idx[k], y);
    upd(p0, n0, i0, y);
    if (mi >= 0) upd(mProb, mCnt, mi, y);
    apmUpd(apm1, a1, y);
    apmUpd(apm2, a2, y);
    c0 = (c0 << 1) | y;
    bitPos++;
    if (c0 >= 256) {
      buf[pos++] = c0 & 255;
      c0 = 1;
      bitPos = 0;
      startByte();
    }
  };
  if (!S.started) {
    S.started = true;
    startByte();
  }
  // 下じきを 読みおわった 時の 中みを とっておく
  const save = () => {
    S.pos = pos;
    S.mPtr = mPtr;
    S.mLen = mLen;
  };
  return { predict, update, save };
}

const writeLen = (out, n) => {
  while (n >= 128) {
    out.push((n & 127) | 128);
    n = Math.floor(n / 128);
  }
  out.push(n);
};

// バイト → ちぢめた バイト
export function cmPack(bytes, prime) {
  const out = [];
  writeLen(out, bytes.length);
  const m = makeModel(stateFor(prime, bytes.length));
  let x1 = 0, x2 = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    for (let b = 7; b >= 0; b--) {
      const y = (c >> b) & 1;
      const p = m.predict();
      const r = x2 - x1;
      const xmid = x1 + Math.floor(r / 4096) * p + Math.floor(((r % 4096) * p) / 4096);
      if (y) x2 = xmid;
      else x1 = xmid + 1;
      m.update(y);
      while (Math.floor(x1 / 16777216) === Math.floor(x2 / 16777216)) {
        out.push(Math.floor(x2 / 16777216));
        x1 = (x1 % 16777216) * 256;
        x2 = (x2 % 16777216) * 256 + 255;
      }
    }
  }
  // さいごに x1 の 上の バイトだけ（読む ほうは 足りない 所を 255 と して 読むので x1〜x2 の 中に 入る）
  out.push(Math.floor(x1 / 16777216));
  return Uint8Array.from(out);
}

// ちぢめた バイト → もとの バイト（こわれて いたら Error）
export function cmUnpack(data, max = 4000000, prime) {
  let p = 0, n = 0, mul = 1;
  for (;;) {
    if (p >= data.length || p > 5) throw new Error('bad length');
    const b = data[p++];
    n += (b & 127) * mul;
    mul *= 128;
    if (b < 128) break;
  }
  if (n > max) throw new Error('too long');
  const out = new Uint8Array(n);
  const m = makeModel(stateFor(prime, n));
  let x1 = 0, x2 = 0xFFFFFFFF, x = 0;
  const next = () => (p < data.length ? data[p++] : (p++, 255));
  for (let i = 0; i < 4; i++) x = x * 256 + next();
  for (let i = 0; i < n; i++) {
    let c = 0;
    for (let b = 0; b < 8; b++) {
      const pr = m.predict();
      const r = x2 - x1;
      const xmid = x1 + Math.floor(r / 4096) * pr + Math.floor(((r % 4096) * pr) / 4096);
      const y = x <= xmid ? 1 : 0;
      if (y) x2 = xmid;
      else x1 = xmid + 1;
      m.update(y);
      c = (c << 1) | y;
      while (Math.floor(x1 / 16777216) === Math.floor(x2 / 16777216)) {
        x1 = (x1 % 16777216) * 256;
        x2 = (x2 % 16777216) * 256 + 255;
        x = (x % 16777216) * 256 + next();
      }
    }
    out[i] = c;
  }
  // 読みおわった あとに 使わなかった バイトが 多すぎる ＝ 何か まざって いる
  if (p < data.length) throw new Error('extra data');
  return out;
}

// ───── base64url（英数字と - _ だけ。LINE・メール・メモ帳で こわれない） ─────
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const REV = new Int16Array(128).fill(-1);
for (let i = 0; i < 64; i++) REV[ABC.charCodeAt(i)] = i;
export function toB64u(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const k = Math.min(3, bytes.length - i);
    s += ABC[(n >> 18) & 63] + ABC[(n >> 12) & 63] + (k > 1 ? ABC[(n >> 6) & 63] : '') + (k > 2 ? ABC[n & 63] : '');
  }
  return s;
}
export function fromB64u(s) {
  if (s.length % 4 === 1) throw new Error('bad length');
  const out = new Uint8Array(Math.floor((s.length * 3) / 4));
  let o = 0, acc = 0, nb = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const v = c < 128 ? REV[c] : -1;
    if (v < 0) throw new Error('bad char');
    acc = ((acc << 6) | v) & 0xFFFFFF;
    nb += 6;
    if (nb >= 8) {
      nb -= 8;
      out[o++] = (acc >> nb) & 255;
    }
  }
  return out;
}

// ───── CRC-32（こわれた コードを 見つける） ─────
const CRC = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  CRC[n] = c;
}
export function crc32(bytes) {
  let c = -1;
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return ((c ^ -1) >>> 0).toString(16).padStart(8, '0');
}

// ───── きりの マップ（c.explored）を みじかく ─────
// きりは「歩いた 所の まわり（半径 R の まる）」を 晴らした もの（client/field.js の reveal）。
// なので「まるの まん中の ならび」だけ 書けば、読む ときに まるを ぬって もとどおりに なる。
//   書く 形: "w.h.R:" ＋ まん中の 番号の さ（36進。. で つなぐ）
//   ぴったり もどらない（マップの 大きさが かわった など）ときは null（前の 形の まま 送る）
const discOf = (R) => {
  const d = [];
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) if (x * x + y * y <= R * R) d.push(x, y);
  return d;
};
const eachDisc = (D, w, h, c, f) => {
  const cx = c % w, cy = (c - cx) / w;
  for (let k = 0; k < D.length; k += 2) {
    const x = cx + D[k], y = cy + D[k + 1];
    if (x >= 0 && y >= 0 && x < w && y < h) f(y * w + x);
  }
};
export function packExplored(b64, w, h, R) {
  if (typeof b64 !== 'string' || !(w > 0 && h > 0 && R > 0) || w * h > 1000000) return null;
  let bin;
  try {
    bin = atob(b64);
  } catch {
    return null;
  }
  const nBytes = Math.ceil((w * h) / 8);
  if (bin.length !== nBytes) return null;
  const bits = new Uint8Array(nBytes * 8);
  for (let i = 0; i < nBytes * 8; i++) bits[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1;
  const D = discOf(R);
  // まるが ぜんぶ 晴れて いる 所が、まん中の こうほ
  const cand = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!bits[y * w + x]) continue;
      let ok = true;
      for (let k = 0; k < D.length && ok; k += 2) {
        const X = x + D[k], Y = y + D[k + 1];
        if (X >= 0 && Y >= 0 && X < w && Y < h && !bits[Y * w + X]) ok = false;
      }
      if (ok) cand.push(y * w + x);
    }
  }
  // いらない まん中を へらす（ほかの まるで ぜんぶ ぬれる 物）
  const cover = new Uint16Array(w * h);
  for (const c of cand) eachDisc(D, w, h, c, (j) => cover[j]++);
  const keep = [];
  for (const c of cand) {
    let need = false;
    eachDisc(D, w, h, c, (j) => { if (cover[j] < 2) need = true; });
    if (need) keep.push(c);
    else eachDisc(D, w, h, c, (j) => cover[j]--);
  }
  let prev = -1;
  const s = `${w}.${h}.${R}:${keep.map((c) => { const d = c - prev; prev = c; return d.toString(36); }).join('.')}`;
  // ぴったり もどるか たしかめる
  return unpackExplored(s) === b64 ? s : null;
}
export function unpackExplored(s) {
  const m = /^(\d{1,4})\.(\d{1,4})\.(\d{1,2}):([0-9a-z.]*)$/.exec(String(s));
  if (!m) return null;
  const w = +m[1], h = +m[2], R = +m[3];
  if (!w || !h || !R || w * h > 1000000) return null;
  const nBytes = Math.ceil((w * h) / 8);
  const bytes = new Uint8Array(nBytes);
  const D = discOf(R);
  let c = -1;
  for (const d of m[4] ? m[4].split('.') : []) {
    c += parseInt(d, 36);
    if (!(c >= 0 && c < w * h)) return null;
    eachDisc(D, w, h, c, (j) => { bytes[j >> 3] |= 1 << (j & 7); });
  }
  let bin = '';
  for (let i = 0; i < nBytes; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

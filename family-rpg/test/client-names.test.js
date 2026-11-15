// 見はりの テスト: public/js の 下の .js で「名前の ぬけ」を さがす。
//
// 何を 見はるか:
//   1. public/js の 下の 全部の .js（client・shared・main.js）で、使って いるのに、
//      その ファイルの 中で import も 宣言（const/let/var/function/class/引数/
//      分ける 代入/catch など）も されて おらず、ブラウザの 決まった グローバルでも
//      ない 名前。見つけたら「ファイル:行 名前」を 出して 落ちる。
//   2. `import { X } from './y.js'` の X が、y.js で 本当に export されて いるか
//      （export * from も たどる）。相手の ファイルが ない 時も 落ちる。
//
// なぜ 作ったか:
//   係どうしの 取りこみ（git merge, febc506da）で client/battle.js の import の
//   行が 2行 きえ、使う 行（Object.assign(HIT_DELAY, R85A_HIT) など）だけ のこった。
//   ブラウザでは `R85A_HIT is not defined` で ゲームが 立ち上がらなく なったが、
//   クライアントの ファイルは Node の テストで 読みこまない 物が 多く、全部の テストは
//   通って いた。その ぬけを Node だけで（ブラウザ・足しの パッケージ なしで）見つける。
//
// やり方:
//   かんたんな 字句の 読み取り（コメント・文字列・テンプレート文字列・正規表現を
//   とばす）で 名前を 集める。スコープは 見ず、ファイルの どこかで 宣言されて いれば
//   よしと する（見のがしは ありうるが、まちがって 落ちる ことは 少ない）。
//   こわれた 版（import の 行を 1行 消した battle.js）を 入れると 落ちる ことも
//   この テストの 中で たしかめる。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'js');

const KEYWORDS = new Set(`break case catch class const continue debugger default delete do else export extends
finally for function if import in instanceof new return super switch this throw try typeof var void while with
yield let static enum await async of get set as from null true false undefined NaN Infinity arguments`
  .split(/\s+/));

// ブラウザ・JS の 決まった グローバル
const GLOBALS = new Set(`window self globalThis document navigator location history screen performance console
Math JSON Object Array String Number Boolean Symbol BigInt Date RegExp Error TypeError RangeError SyntaxError
ReferenceError EvalError URIError AggregateError Promise Map Set WeakMap WeakSet WeakRef Proxy Reflect Intl
ArrayBuffer SharedArrayBuffer DataView Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array
Uint32Array Float32Array Float64Array BigInt64Array BigUint64Array parseInt parseFloat isNaN isFinite
encodeURIComponent decodeURIComponent encodeURI decodeURI escape unescape structuredClone queueMicrotask
setTimeout clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame requestIdleCallback
cancelIdleCallback fetch Request Response Headers URL URLSearchParams Blob File FileReader FormData
WebSocket EventSource Event CustomEvent EventTarget KeyboardEvent MouseEvent PointerEvent TouchEvent
AbortController AbortSignal TextEncoder TextDecoder atob btoa crypto localStorage sessionStorage indexedDB
alert confirm prompt getComputedStyle matchMedia innerWidth innerHeight devicePixelRatio
HTMLElement HTMLCanvasElement HTMLImageElement HTMLInputElement HTMLAudioElement Element Node NodeList
DocumentFragment Image Audio OffscreenCanvas ImageData ImageBitmap createImageBitmap Path2D CanvasRenderingContext2D
AudioContext webkitAudioContext OfflineAudioContext AudioBuffer GainNode OscillatorNode
ResizeObserver IntersectionObserver MutationObserver Worker BroadcastChannel MessageChannel
Notification Vibration visualViewport speechSynthesis SpeechSynthesisUtterance caches
scrollTo scrollBy open close print focus blur origin isSecureContext DOMParser XMLSerializer
WebGLRenderingContext WebGL2RenderingContext Iterator FinalizationRegistry Atomics WebAssembly
addEventListener removeEventListener dispatchEvent DOMException DOMRect DOMMatrix FontFace PerformanceObserver ShadowRoot customElements
process`.split(/\s+/));

// ---------- 字句の 読み取り ----------
const isIdStart = (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 36 || c === 95 || c > 127;
const isIdPart = (c) => isIdStart(c) || (c >= 48 && c <= 57);
const REGEX_AFTER_PUNCT = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%',
  '<', '>', '~', '^', '=>', '==', '===', '!=', '!==', '&&', '||', '??', '+=', '-=', '*=', '/=', '<=', '>=', '...',
  '?.', '**', '%=', '&=', '|=', '^=', '??=', '||=', '&&=', '<<', '>>', '>>>']);
const REGEX_AFTER_KW = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw',
  'case', 'do', 'else', 'yield', 'await']);
const PUNCTS = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '??=', '||=', '&&=', '=>', '==', '!=',
  '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>'];

// tokens: { t: 'id'|'p'|'s'|'n'|'re', v, line, nl (前に 改行が あるか) }
export function tokenize(src) {
  const toks = [];
  const n = src.length;
  let i = 0, line = 1, nl = false;
  const stack = []; // '{' | '${'
  const push = (t, v) => { toks.push({ t, v, line, nl }); nl = false; };
  const regexOk = () => {
    const p = toks[toks.length - 1];
    if (!p) return true;
    if (p.t === 'p') return REGEX_AFTER_PUNCT.has(p.v) && p.v !== ')' && p.v !== ']';
    if (p.t === 'id') return REGEX_AFTER_KW.has(p.v);
    return false;
  };
  const readTemplate = () => { // i は ` の つぎ か } の つぎ
    while (i < n) {
      const c = src.charCodeAt(i);
      if (c === 92) { i += 2; continue; }
      if (c === 10) line++;
      if (c === 96) { i++; return; }
      if (c === 36 && src.charCodeAt(i + 1) === 123) { i += 2; stack.push('${'); push('p', '${'); return; }
      i++;
    }
  };
  while (i < n) {
    const c = src.charCodeAt(i);
    if (c === 10) { line++; nl = true; i++; continue; }
    if (c === 32 || c === 9 || c === 13 || c === 0xfeff || c === 0xa0 || c === 0x3000) { i++; continue; }
    if (c === 47) { // /
      const d = src.charCodeAt(i + 1);
      if (d === 47) { while (i < n && src.charCodeAt(i) !== 10) i++; continue; }
      if (d === 42) {
        const e = src.indexOf('*/', i + 2);
        const end = e < 0 ? n : e + 2;
        for (let k = i; k < end; k++) if (src.charCodeAt(k) === 10) { line++; nl = true; }
        i = end; continue;
      }
      if (regexOk()) {
        let k = i + 1, inClass = false;
        while (k < n) {
          const ch = src.charCodeAt(k);
          if (ch === 92) { k += 2; continue; }
          if (ch === 10) break;
          if (ch === 91) inClass = true; else if (ch === 93) inClass = false;
          else if (ch === 47 && !inClass) break;
          k++;
        }
        k++;
        while (k < n && isIdPart(src.charCodeAt(k))) k++;
        push('re', src.slice(i, k)); i = k; continue;
      }
    }
    if (c === 34 || c === 39) { // " '
      let k = i + 1;
      while (k < n) {
        const ch = src.charCodeAt(k);
        if (ch === 92) { if (src.charCodeAt(k + 1) === 10) line++; k += 2; continue; }
        if (ch === c || ch === 10) break;
        k++;
      }
      push('s', src.slice(i + 1, k)); i = k + 1; continue;
    }
    if (c === 96) { push('s', '`'); i++; readTemplate(); continue; }
    if (c === 35 && isIdStart(src.charCodeAt(i + 1))) { // #private
      let k = i + 1; while (k < n && isIdPart(src.charCodeAt(k))) k++;
      push('priv', src.slice(i, k)); i = k; continue;
    }
    if (isIdStart(c) || c === 92) {
      let k = i + 1; while (k < n && isIdPart(src.charCodeAt(k))) k++;
      push('id', src.slice(i, k)); i = k; continue;
    }
    if ((c >= 48 && c <= 57) || (c === 46 && src.charCodeAt(i + 1) >= 48 && src.charCodeAt(i + 1) <= 57)) {
      let k = i + 1;
      while (k < n) {
        const ch = src.charCodeAt(k);
        if (isIdPart(ch) || ch === 46) { k++; continue; }
        if ((ch === 43 || ch === 45) && /[eE]/.test(src[k - 1]) && !/^0[xX]/.test(src.slice(i, k))) { k++; continue; }
        break;
      }
      push('n', src.slice(i, k)); i = k; continue;
    }
    if (c === 123) { stack.push('{'); push('p', '{'); i++; continue; }
    if (c === 125) {
      const top = stack.pop();
      if (top === '${') { push('p', '}$'); i++; readTemplate(); continue; }
      push('p', '}'); i++; continue;
    }
    let p = null;
    for (const q of PUNCTS) if (src.startsWith(q, i)) { p = q; break; }
    if (p === '?.' && src.charCodeAt(i + 2) >= 48 && src.charCodeAt(i + 2) <= 57) p = null; // a?.5:b
    p = p || src[i];
    push('p', p); i += p.length;
  }
  return toks;
}

// ---------- 宣言と 使う 名前 ----------
const OPEN = { '(': ')', '[': ']', '{': '}', '${': '}$' };
function matchClose(toks, i) { // toks[i] は ひらく 字
  let depth = 0;
  for (let k = i; k < toks.length; k++) {
    const t = toks[k];
    if (t.t !== 'p') continue;
    if (OPEN[t.v]) depth++;
    else if (t.v === ')' || t.v === ']' || t.v === '}' || t.v === '}$') { depth--; if (depth === 0) return k; }
  }
  return toks.length - 1;
}
function matchOpen(toks, i) { // toks[i] は とじる 字
  let depth = 0;
  for (let k = i; k >= 0; k--) {
    const t = toks[k];
    if (t.t !== 'p') continue;
    if (t.v === ')' || t.v === ']' || t.v === '}' || t.v === '}$') depth++;
    else if (OPEN[t.v]) { depth--; if (depth === 0) return k; }
  }
  return 0;
}
const STMT_KW = new Set(['const', 'let', 'var', 'function', 'class', 'if', 'for', 'while', 'return', 'switch',
  'throw', 'try', 'do', 'export', 'import', 'break', 'continue']);

export function analyze(src) {
  const toks = tokenize(src);
  const declared = new Set();
  const imports = []; // { name, local, from, line }
  const skip = new Set(); // 使う 名前 では ない トークンの 番号
  const addRange = (a, b) => { // a..b（引数や 分ける 代入の かっこ）の 中の 名前を 宣言として あつかう
    for (let k = a + 1; k < b; k++) {
      const x = toks[k];
      if (x.t === 'p' && x.v === '=') { // 初期値（a = ITEMS[id]）は 使う 名前なので とばす
        let depth = 0;
        for (k++; k < b; k++) {
          const y = toks[k];
          if (y.t !== 'p') continue;
          if (OPEN[y.v]) depth++;
          else if (y.v === ')' || y.v === ']' || y.v === '}' || y.v === '}$') { if (depth === 0) { k--; break; } depth--; }
          else if (depth === 0 && y.v === ',') break;
        }
        continue;
      }
      if (x.t !== 'id') continue;
      if (toks[k + 1] && toks[k + 1].v === ':') continue; // { key: name } の key
      declared.add(x.v); skip.add(k);
    }
  };
  const classBodies = new Set(); // class の { の 番号

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i], v = t.v;
    if (t.t === 'p' && v === '=>') {
      const p = toks[i - 1];
      if (p && p.t === 'id') declared.add(p.v);
      else if (p && p.v === ')') addRange(matchOpen(toks, i - 1), i - 1);
      continue;
    }
    if (t.t === 'p' && v === ')' && toks[i + 1] && toks[i + 1].v === '{') {
      const o = matchOpen(toks, i);
      const before = toks[o - 1];
      if (!(before && before.t === 'id' && ['if', 'for', 'while', 'switch', 'with'].includes(before.v))) {
        addRange(o, i); // 関数・メソッドの 引数, catch (e)
        if (before && before.t === 'id' && !KEYWORDS.has(before.v)) {
          const bb = toks[o - 2];
          // メソッドの 名前（a.b() { は ありえない ので、. の あとでは ない）
          if (!(bb && bb.t === 'p' && (bb.v === '.' || bb.v === '?.'))) skip.add(o - 1);
        }
      }
      continue;
    }
    if (t.t !== 'id') continue;
    // { class: 'x' } や a.class の ような キーは 宣言では ない
    const pv = toks[i - 1], nv = toks[i + 1];
    if ((pv && pv.t === 'p' && (pv.v === '.' || pv.v === '?.')) || (nv && nv.t === 'p' && nv.v === ':')) continue;
    if (v === 'function' || v === 'class') {
      let k = i + 1;
      if (toks[k] && toks[k].v === '*') k++;
      if (toks[k] && toks[k].t === 'id' && toks[k].v !== 'extends') { declared.add(toks[k].v); skip.add(k); }
      if (v === 'class') {
        while (k < toks.length && toks[k].v !== '{') k++;
        classBodies.add(k);
      }
      continue;
    }
    if (v === 'const' || v === 'let' || v === 'var') {
      if (toks[i - 1] && toks[i - 1].t === 'p' && (toks[i - 1].v === '.' || toks[i - 1].v === '?.')) continue;
      let k = i + 1;
      for (;;) {
        const b = toks[k];
        if (!b) break;
        if (b.t === 'id') { declared.add(b.v); skip.add(k); k++; }
        else if (b.v === '{' || b.v === '[') { const e = matchClose(toks, k); addRange(k, e); k = e + 1; }
        else break;
        // 初期値を とばす
        if (toks[k] && toks[k].v === '=') {
          k++;
          let depth = 0;
          for (; k < toks.length; k++) {
            const x = toks[k];
            if (x.t === 'p') {
              if (OPEN[x.v]) depth++;
              else if (x.v === ')' || x.v === ']' || x.v === '}' || x.v === '}$') { if (depth === 0) break; depth--; }
              else if (depth === 0 && (x.v === ',' || x.v === ';')) break;
            } else if (depth === 0 && x.nl && x.t === 'id' && STMT_KW.has(x.v)) break;
          }
        }
        if (toks[k] && toks[k].v === ',') { k++; continue; }
        break;
      }
      continue;
    }
    if (v === 'import' && toks[i + 1] && toks[i + 1].v !== '(' && toks[i + 1].v !== '.') {
      // import 文
      let k = i + 1;
      const names = [];
      let end = k;
      while (end < toks.length && !(toks[end].t === 's' && toks[end - 1] && (toks[end - 1].v === 'from' || toks[end - 1].v === 'import'))) end++;
      const from = toks[end] ? toks[end].v : '';
      for (; k < end; k++) {
        const x = toks[k];
        skip.add(k);
        if (x.t !== 'id' || x.v === 'from') continue;
        if (x.v === 'as') continue;
        if (toks[k - 1].v === 'as' && toks[k - 2].v === '*') continue; // * as ns は 下で
        // { a as b } / * as ns / default
        const next = toks[k + 1];
        if (next && next.v === 'as') { names.push({ name: x.v === '*' ? '*' : x.v, local: toks[k + 2].v, line: x.line }); k += 2; skip.add(k - 1); skip.add(k); continue; }
        const inBraces = (() => { for (let q = k; q > i; q--) { if (toks[q].v === '{') return true; if (toks[q].v === '}') return false; } return false; })();
        names.push({ name: inBraces ? x.v : 'default', local: x.v, line: x.line });
      }
      for (let q = i + 1; q < end; q++) if (toks[q].v === '*' && toks[q + 1] && toks[q + 1].v === 'as') names.push({ name: '*', local: toks[q + 2].v, line: toks[q].line });
      for (const nm of names) { declared.add(nm.local); imports.push({ ...nm, from }); }
      i = end;
      continue;
    }
    if (v === 'export' && toks[i + 1] && (toks[i + 1].v === '{' || toks[i + 1].v === '*')) {
      // export { a as b } [from '...']  /  export * from '...'
      let end = i + 1;
      if (toks[end].v === '{') end = matchClose(toks, end);
      const hasFrom = toks[end + 1] && toks[end + 1].v === 'from';
      const from = hasFrom ? toks[end + 2].v : null;
      for (let k = i + 1; k <= end; k++) {
        const x = toks[k];
        if (x.t !== 'id') continue;
        if (hasFrom) { skip.add(k); continue; }
        if (toks[k - 1] && toks[k - 1].v === 'as') skip.add(k);
        if (x.v === 'as') skip.add(k);
      }
      if (hasFrom) {
        if (toks[i + 1].v === '{') {
          for (let k = i + 2; k < end; k++) {
            const x = toks[k];
            if (x.t === 'id' && x.v !== 'as' && !(toks[k - 1] && toks[k - 1].v === 'as')) imports.push({ name: x.v, local: null, from, line: x.line });
          }
        }
        skip.add(end + 1);
        i = end + 2;
      }
      continue;
    }
  }

  // 使う 名前
  const uses = [];
  const classDepth = []; // class 本体の 中か
  const braceKind = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.t === 'p') {
      if (t.v === '{' || t.v === '${') braceKind.push(classBodies.has(i) ? 'class' : 'x');
      else if (t.v === '}' || t.v === '}$') braceKind.pop();
      continue;
    }
    if (t.t !== 'id' || skip.has(i) || KEYWORDS.has(t.v)) continue;
    const p = toks[i - 1], nx = toks[i + 1];
    if (p && p.t === 'p' && (p.v === '.' || p.v === '?.')) continue; // a.b
    if (nx && nx.t === 'p' && nx.v === ':' && !(p && p.t === 'p' && p.v === '?')) continue; // { key: } / label:
    if (braceKind[braceKind.length - 1] === 'class' && nx && (nx.v === '=' || nx.v === ';' || nx.v === '(')) continue; // フィールド
    if (p && p.t === 'id' && (p.v === 'get' || p.v === 'set' || p.v === 'static' || p.v === 'async') && nx && nx.v === '(') continue;
    if (p && p.t === 'id' && (p.v === 'break' || p.v === 'continue') && !t.nl) continue; // ラベル
    if (declared.has(t.v) || GLOBALS.has(t.v)) continue;
    uses.push({ name: t.v, line: t.line });
  }
  return { uses, imports, declared };
}

// export されて いる 名前
const exportCache = new Map();
export function exportsOf(file, seen = new Set()) {
  if (exportCache.has(file)) return exportCache.get(file);
  if (seen.has(file)) return new Set();
  seen.add(file);
  const out = new Set();
  const src = readFileSync(file, 'utf8');
  const toks = tokenize(src);
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.t !== 'id' || t.v !== 'export') continue;
    if (toks[i - 1] && toks[i - 1].t === 'p' && (toks[i - 1].v === '.' || toks[i - 1].v === '?.')) continue;
    const a = toks[i + 1];
    if (!a) continue;
    if (a.v === 'default') { out.add('default'); continue; }
    if (a.v === 'async') { if (toks[i + 3]) out.add(toks[i + 3].t === 'id' ? toks[i + 3].v : toks[i + 4].v); continue; }
    if (a.v === 'function' || a.v === 'class') {
      let k = i + 2; if (toks[k].v === '*') k++;
      out.add(toks[k].v); continue;
    }
    if (a.v === 'const' || a.v === 'let' || a.v === 'var') {
      // export const a = .., b = ..  / export const { a, b } = ..
      let k = i + 2;
      for (;;) {
        const b = toks[k];
        if (!b) break;
        if (b.t === 'id') { out.add(b.v); k++; }
        else if (b.v === '{' || b.v === '[') {
          const e = matchClose(toks, k);
          for (let q = k + 1; q < e; q++) {
            const x = toks[q];
            if (x.t === 'id' && !(toks[q + 1] && toks[q + 1].v === ':')) out.add(x.v);
          }
          k = e + 1;
        } else break;
        if (toks[k] && toks[k].v === '=') {
          k++;
          let depth = 0;
          for (; k < toks.length; k++) {
            const x = toks[k];
            if (x.t === 'p') {
              if (OPEN[x.v]) depth++;
              else if (x.v === ')' || x.v === ']' || x.v === '}' || x.v === '}$') { if (depth === 0) break; depth--; }
              else if (depth === 0 && (x.v === ',' || x.v === ';')) break;
            } else if (depth === 0 && x.nl && x.t === 'id' && STMT_KW.has(x.v)) break;
          }
        }
        if (toks[k] && toks[k].v === ',') { k++; continue; }
        break;
      }
      continue;
    }
    if (a.v === '*') {
      // export * from 'x'  /  export * as ns from 'x'
      if (toks[i + 2] && toks[i + 2].v === 'as') { out.add(toks[i + 3].v); continue; }
      const from = toks[i + 3] && toks[i + 3].v;
      const target = resolveImport(file, from);
      if (target) for (const nm of exportsOf(target, seen)) if (nm !== 'default') out.add(nm);
      continue;
    }
    if (a.v === '{') {
      const e = matchClose(toks, i + 1);
      for (let k = i + 2; k < e; k++) {
        const x = toks[k];
        if (x.t !== 'id' || x.v === 'as') continue;
        if (toks[k + 1] && toks[k + 1].v === 'as') continue; // 外の 名前は as の あと
        out.add(x.v);
      }
    }
  }
  exportCache.set(file, out);
  return out;
}

function resolveImport(fromFile, spec) {
  if (!spec || !(spec.startsWith('./') || spec.startsWith('../'))) return null;
  return resolve(dirname(fromFile), spec);
}

function listJs(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listJs(p));
    else if (name.endsWith('.js')) out.push(p);
  }
  return out.sort();
}

// 1つの ファイルを 調べて、見つけた 問題を 文字の 配列で かえす
export function checkFile(file, src = readFileSync(file, 'utf8')) {
  const rel = relative(ROOT, file);
  const problems = [];
  const { uses, imports } = analyze(src);
  const seen = new Set();
  for (const u of uses) {
    if (seen.has(u.name)) continue;
    seen.add(u.name);
    problems.push(`public/js/${rel}:${u.line} 「${u.name}」を 使って いるが、import も 宣言も されて いない`);
  }
  for (const im of imports) {
    const target = resolveImport(file, im.from);
    if (!target) continue;
    if (!existsSync(target)) { problems.push(`public/js/${rel}:${im.line} import 先 '${im.from}' が ない`); continue; }
    if (im.name === '*') continue;
    if (!exportsOf(target).has(im.name)) {
      problems.push(`public/js/${rel}:${im.line} 「${im.name}」を '${im.from}' から import して いるが、相手が export して いない`);
    }
  }
  return problems;
}

const FILES = listJs(ROOT);

test('public/js の 全部の .js で、import も 宣言も ない 名前・export されて いない import が 0件', () => {
  assert.ok(FILES.length > 100, `ファイルが 少なすぎる: ${FILES.length}`);
  const problems = FILES.flatMap((f) => checkFile(f));
  assert.deepEqual(problems, [], '名前の ぬけ:\n' + problems.join('\n'));
});

test('こわれた 版（import の 行を 1行 消した client/battle.js）を 入れると 見つかる', () => {
  const file = join(ROOT, 'client', 'battle.js');
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (const [importLine, name] of [
    [/^import \{[^}]*\bR85A_HIT\b[^}]*\} from/, 'R85A_HIT'],
    [/^import \{[^}]*\br85aRow\b[^}]*\} from/, 'r85aRow'],
  ]) {
    const idx = lines.findIndex((l) => importLine.test(l));
    assert.ok(idx >= 0, `${name} の import の 行が 今の battle.js に ない`);
    const broken = lines.filter((_, k) => k !== idx).join('\n');
    const problems = checkFile(file, broken);
    assert.ok(problems.some((p) => p.includes(`「${name}」`) && /client\/battle\.js:\d+/.test(p)),
      `${name} の ぬけが 見つからない: ${problems.join(' / ')}`);
  }
});

test('import した 名前が 相手で export されて いない 時も 見つかる', () => {
  const file = join(ROOT, 'client', 'battle.js');
  const src = readFileSync(file, 'utf8').replace(/\bR85A_HIT\b/g, 'R85A_HIT_NAI');
  const problems = checkFile(file, src);
  assert.ok(problems.some((p) => p.includes('「R85A_HIT_NAI」') && p.includes('export して いない')), problems.join(' / '));
});

test('字句の 読み取りが コメント・文字列・テンプレート・正規表現を とばす', () => {
  const src = [
    "import { a } from './x.js';",
    '// NAI1 は コメント',
    "const s = 'NAI2' + \"NAI3\" + `NAI4 ${a + b} NAI5`;",
    'const re = /NAI6[/]/g.test(s);',
    '/* NAI7 */ const o = { key: 1, method(p) { return p; } };',
    'class C { field = 1; go() { return this.field; } }',
    'const [d, { e: f = 2 }] = [];',
    'function g(h, ...i) { try { } catch (err) { return h + i + err; } }',
    'const arrow = (j, k) => j + k + NAI8;',
  ].join('\n');
  const names = analyze(src).uses.map((u) => u.name);
  assert.deepEqual(names, ['b', 'NAI8']);
});

// 第35回 A: コントローラー（十字キー・A・B）だけで、ボタンが ならんだ 画面を そうさする
//   タイトル・キャラを 作る 画面・引っこしコード など、ListMenu ではない 画面で 使う。
//   十字キー … 画面で その 向きに ある いちばん 近い ボタンへ（見た まま うごく。はじめの 1回は カーソルを 出すだけ）
//   A … そのボタンを おす（文字を 入れる 所は 入力を はじめる。Enter で おわる）
//   B … onB（もどる・とじる）
//
//   const h = padNav(root, { onB, start, sound });  game.input.push(h);  …  game.input.pop(h);
//   h.refresh() … 中みを 作りなおした あと（カーソルの ボタンが なくなったら はじめの ボタンへ）
//   h.focusEl(e) … カーソルを その ボタンへ
import './r35-css.js?v=cd32925e7010';

const SEL = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [data-pad]';

// 画面に 見えている ボタン
function targets(root) {
  return [...root.querySelectorAll(SEL)].filter((e) => e.offsetParent !== null && !e.closest('[hidden]') && !e.classList.contains('no-pad'));
}

const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

// from から d の 向きに ある いちばん 近い もの（同じ 行・列に ちかい ものを 先に）
export function nearest(from, list, d) {
  const a = center(from);
  let best = null;
  let bestScore = Infinity;
  for (const r of list) {
    if (r === from) continue;
    const b = center(r);
    const dx = b.x - a.x, dy = b.y - a.y;
    const horiz = d === 'left' || d === 'right';
    const main = d === 'left' ? -dx : d === 'right' ? dx : d === 'up' ? -dy : dy;
    // よこの ずれ（上下に うごく とき）・たての ずれ（左右）は、はしと はしの すきま（重なって いれば 0）
    const cross = horiz ? Math.max(0, r.top - from.bottom, from.top - r.bottom) : Math.max(0, r.left - from.right, from.left - r.right);
    if (main <= 2) continue;
    // 左右は 同じ 行（たてに 重なる もの）を 先に。なければ ちかい 行
    const score = horiz ? (cross > 0 ? 1e5 : 0) + main + cross * 4 : main + cross * 2;
    if (score < bestScore) { bestScore = score; best = r; }
  }
  return best;
}

// pad: スマホで 画面の 十字キー（#pad）を 出すか（ボタンを タップする 画面は ふつう 出さない）
export function padNav(root, { onB = null, start = null, sound = null, onFocus = null, pad = false } = {}) {
  let cur = null;
  const mark = (e) => {
    for (const x of root.querySelectorAll('.pad-focus')) x.classList.remove('pad-focus');
    cur = e;
    if (!e) return;
    e.classList.add('pad-focus');
    e.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    onFocus?.(e);
  };
  const first = () => {
    const list = targets(root);
    const s = typeof start === 'function' ? start() : start;
    return (s && list.includes(s) ? s : null) || list.find((e) => e.classList.contains('sel') || e.classList.contains('primary')) || list[0] || null;
  };
  const h = {
    pad,
    el: root,
    onNav: (a) => {
      if (!root.isConnected) return;
      const list = targets(root);
      if (!cur || !list.includes(cur)) {
        if (a === 'b') return onB?.();
        mark(first());
        if (!cur) return;
        // A は すぐ おす（タイトルの「始める」など）。十字キーは カーソルを 出すだけ
        if (a !== 'a') { sound?.('cursor'); return; }
      }
      if (a === 'b') {
        if (document.activeElement === cur && /^(INPUT|TEXTAREA)$/.test(cur.tagName)) { cur.blur(); return; }
        return onB?.();
      }
      if (a === 'a') {
        if (/^(INPUT|TEXTAREA)$/.test(cur.tagName)) {
          cur.focus();
          return;
        }
        cur.click();
        // おした あと 画面が かわったら、つぎの ボタンへ
        if (!cur.isConnected) mark(null);
        return;
      }
      if (!['up', 'down', 'left', 'right'].includes(a)) return;
      if (document.activeElement === cur) cur.blur?.();
      const rects = list.map((e) => e.getBoundingClientRect());
      const from = cur.getBoundingClientRect();
      const r = nearest(from, rects, a);
      if (!r) return;
      sound?.('cursor');
      mark(list[rects.indexOf(r)]);
    },
    refresh() {
      if (cur && !targets(root).includes(cur)) mark(first());
    },
    focusEl(e) { mark(e); },
    get current() { return cur; },
  };
  // 1行の 文字の 入力は Enter で おわる（Input は 文字の 入力中の キーを 見ないので、そのあと 十字キーで うごける）
  for (const inp of root.querySelectorAll('input')) {
    inp.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      // 下の Input に とどくと、もう一度 A（入力の はじめ）に なる
      e.stopPropagation();
      inp.blur();
      mark(inp);
    });
  }
  return h;
}

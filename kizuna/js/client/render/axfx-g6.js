// 第48回 G6（ハリー・ポッター ＋ 鋼の錬金術師 ＋ 怪盗キッド ＋ 名探偵コナン ＋ おしり探偵）: 大技の え（はなつ ところ）。render/axfx.js が useAxGroup('g6', AX_G6, AX_G6_FINE) で とうろく する
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」と docs/plan-r48-fx-engine.md。この ファイルは G6 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-g6.js に 書く（ここには 書かない）
// ・作品ごとに ファイルを 分けた: axfx-g6-harry.js（ハリー・ポッター）・axfx-g6-kid.js（怪盗キッド）・axfx-g6-alchemy.js（鋼の錬金術師）・
//   axfx-g6-conan.js（名探偵コナン・おしり探偵・合体技）。え の ぶひんと つぶの かきかたは axfx-g6-lib.js
// ・つぶの よさん（budget）: 敵が 多い ときも 段の 上限を こえない ように、小さな つぶ（火花・きらきら・けむり・かけら）を へらす。
//   ためしに 1回 かぞえて から、のこす わりあいを きめて ほんとうに 出す（形の え・わ・ひかりは へらさない）。
//   どの つぶも はなって おわる 時間（len ＋ 敵全体の ずらし）までに きえる ように いのちを みじかく する
import { G6_FINE } from './axfx-g6-lib.js?v=a5c15ff5e061';
import { AX_G6_HARRY } from './axfx-g6-harry.js?v=a5c15ff5e061';
import { AX_G6_KID } from './axfx-g6-kid.js?v=a5c15ff5e061';
import { AX_G6_ALCHEMY } from './axfx-g6-alchemy.js?v=a5c15ff5e061';
import { AX_G6_CONAN } from './axfx-g6-conan.js?v=a5c15ff5e061';

// 段の 同時の つぶの 上限（shared/ax-time.js の AX_BUDGET と おなじ）
const CAP = { basic: 140, advanced: 200, super: 280, legend: 360 };
// へらして よい 小さな つぶ
const MINOR = new Set(['spark', 'twinkle', 'puff', 'axShape', 'petal', 'petal2', 'drop', 'bubble', 'swirl']);

// fx.add を いちじ さしかえて fn を よぶ（axfx.js の withTs と おなじ やりかた）
function withAdd(fx, add, fn) {
  const own = Object.prototype.hasOwnProperty.call(fx, 'add');
  const prev = fx.add;
  fx.add = function g6Add(p) { return add.call(this, p, prev); };
  try { return fn(); } finally { if (own) fx.add = prev; else delete fx.add; }
}

function budgeted(def) {
  const play = def.play;
  return {
    ...def,
    play(fx, c) {
      const cap = CAP[c.dual ? 'super' : c.tier] || CAP.advanced;
      const end = c.len + (c.n > 1 ? Math.min(300, (c.n - 1) * c.stagger) : 0) + 40;
      // 1回目: かぞえる だけ（つぶは 出さない）
      let minor = 0, major = 0, dark = false;
      withAdd(fx, (p) => { if (MINOR.has(p.kind)) minor++; else major++; if (p.kind === 'axTint' || p.kind === 'g6Night') dark = true; }, () => play(fx, c));
      // 超級: ため の くらさを はなった あとも すこし のこして、あたった あと もどす（plan-r48-fx.md 2章）
      if (!dark && (c.tier === 'super' || c.tier === 'legend') && !c.party) {
        fx.add({ kind: 'axTint', x: 0, y: 0, color: '#04020c', a: 0.36, delay: 0, life: Math.min(end, c.hit + 420), fin: 0, fout: 300 });
        major++;
      }
      const room = cap * 1.02 - (fx.parts?.length || 0) - major;
      const keep = minor > 0 ? Math.max(0, Math.min(1, room / minor)) : 1;
      let acc = 0.5;
      // 2回目: ほんとうに 出す
      withAdd(fx, function (p, prev) {
        if (MINOR.has(p.kind) && keep < 1) {
          acc += keep;
          if (acc < 1) return undefined;
          acc -= 1;
        }
        if (p.kind !== 'call' && p.kind !== 'flash' && p.kind !== 'shake') {
          const d = p.delay > 0 ? p.delay : 0;
          const life = p.life ?? 600;
          if (d + life > end) p.life = Math.max(40, end - d);
        }
        return prev.call(this, p);
      }, () => play(fx, c));
      // 余韻（あたった あとの きらきら・のぼる 光の つぶ）。小さな 技でも 段の 下限より 豪華に
      const floor = FLOOR[c.dual ? 'super' : c.tier] * (c.party ? 0.5 : 1) * 1.12;
      const have = fx.parts?.length || 0;
      if (have < floor) afterglow(fx, c, def, Math.ceil(floor - have), end);
    },
  };
}
const FLOOR = { basic: 52, advanced: 90, super: 140, legend: 200 };
const rnd = (a, b) => a + Math.random() * (b - a);
function afterglow(fx, c, def, n, end) {
  const cols = [def.charge?.color || '#ffffff', def.charge?.color2 || '#fff6d0', '#ffffff'];
  const t0 = c.hit + 40, t1 = Math.max(t0 + 60, end - 260);
  for (let i = 0; i < n; i++) {
    const t = c.targets[i % c.n];
    const d = t0 + ((i * 37) % 100) / 100 * (t1 - t0) + (c.n > 1 ? (i % c.n) * c.stagger : 0);
    const life = Math.max(60, Math.min(420, end - d - 10));
    const col = cols[i % cols.length];
    if (i % 2) fx.twinkle(t.x + rnd(-20, 20), t.y + rnd(-18, 12), { color: col, size: rnd(2.5, 4.5), delay: d, life, vy: -16 });
    else fx.sparks(t.x + rnd(-16, 16), t.y + rnd(-10, 14), { colors: [col], n: 1, speed: 24, ang: -Math.PI / 2, spread: 0.6, g: -40, delay: d, life, size: 1, len: 4 });
  }
}
const wrapAll = (defs) => Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, budgeted(d)]));

export const AX_G6 = wrapAll({
  ...AX_G6_HARRY,
  ...AX_G6_KID,
  ...AX_G6_ALCHEMY,
  ...AX_G6_CONAN,
});

export const AX_G6_FINE = {
  ...G6_FINE,
};

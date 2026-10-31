// 第48回 G4（ダイの大冒険 ＋ ロトの勇者 ＋ マリオ ＋ 3年B組）: 大技の え（はなつ ところ）。render/axfx.js が useAxGroup('g4', AX_G4, AX_G4_FINE) で とうろく する
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」と docs/plan-r48-fx-engine.md。この ファイルは G4 だけが さわる
// ・時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎは shared/data/ax-time-g4.js に 書く（ここには 書かない）
// ・ここには 見た目だけ: { ax_〜: { charge: { color, color2, power }, sfx, allyFx, pal, vars, play(fx, c) } }
// ・作品ごとに 分けた: axfx-g4-dai.js（ダイの大冒険）・axfx-g4-loto.js（勇者・ロトの勇者）・axfx-g4-mario.js（マリオ）・axfx-g4-3b.js（3年B組）
//   つぶの かきかたは axfx-g4-fine.js、小さな どうぐは axfx-g4-kit.js
// ・どの え も さいごに balance（段の つぶの かず: 敵1体でも 下限 いじょうの 余韻の きらきら、敵5体でも 上限 いか）
import { AX_G4_DAI } from './axfx-g4-dai.js?v=a5c15ff5e061';
import { AX_G4_LOTO } from './axfx-g4-loto.js?v=a5c15ff5e061';
import { AX_G4_MARIO } from './axfx-g4-mario.js?v=a5c15ff5e061';
import { AX_G4_3B } from './axfx-g4-3b.js?v=a5c15ff5e061';
import { AX_G4_FINE as FINE } from './axfx-g4-fine.js?v=a5c15ff5e061';
import { rnd } from './axkit.js?v=a5c15ff5e061';
import { AX_BUDGET } from '../../shared/ax-time.js?v=a5c15ff5e061';

// へらして よい つぶ（こまかい もの から）。大きな 絵（g4〜・ビーム・わ）や 時計（call）・ゆれ・ひかりは へらさない
const TRIM = ['spark', 'twinkle', 'puff', 'drop', 'bubble', 'petal', 'axShape', 'converge'];

// 段の つぶの かず に あわせる。minParts … なかまの 技で 下の 技より へらさない ための 下限
export function balance(fx, c, start, o = {}) {
  const B = AX_BUDGET[c.tier] || AX_BUDGET.advanced;
  const support = !!c.party;
  const lo = Math.max(Math.ceil(B.parts[0] * (support ? 0.5 : 1) * 1.08), o.minParts || 0);
  const hi = Math.floor(B.parts[1] * 0.98);
  // 余韻は 技の おわり（len ＋ 敵全体の ずらし）の すこし あと までに きえる
  const limit = c.len + (c.n - 1) * c.stagger + 230;
  for (let i = fx.parts.length - 1; i >= start; i--) {
    const p = fx.parts[i];
    const d = p.delay > 0 ? p.delay : 0;
    if (d >= limit) fx.parts.splice(i, 1);
    else if (d + (p.life - (p.age || 0)) > limit) p.life = (p.age || 0) + limit - d;
  }
  // 多すぎ: この 技で 足した こまかい つぶ から へらす
  let over = fx.parts.length - hi;
  for (const kind of TRIM) {
    if (over <= 0) break;
    for (let i = fx.parts.length - 1; i >= start && over > 0; i--) {
      if (fx.parts[i].kind === kind) { fx.parts.splice(i, 1); over--; }
    }
  }
  // 少なすぎ: 余韻の きらきら（的の まわり。おわる 前に きえる）
  const need = Math.min(lo - fx.parts.length, hi - fx.parts.length);
  if (need <= 0) return;
  const cols = [o.color || '#ffffff', o.color2 || '#fff6b0', '#ffffff'];
  const t0 = c.hit, t1 = Math.max(c.hit + 60, c.len - 420);
  for (let i = 0; i < need; i++) {
    const t = c.targets[i % c.n];
    const x = Math.max(4, Math.min(c.W - 4, t.x + rnd(-30, 30))), y = Math.max(4, Math.min(c.H - 4, t.y + rnd(-26, 18)));
    fx.twinkle(x, y, { color: cols[i % cols.length], size: rnd(2.5, 5), delay: rnd(t0, t1), life: rnd(220, 340), vy: rnd(-24, -6) });
  }
}

function withBalance(defs) {
  const out = {};
  for (const [anim, def] of Object.entries(defs)) {
    const { minParts, ...rest } = def;
    out[anim] = {
      ...rest,
      play(fx, c) {
        const start = fx.parts.length;
        def.play(fx, c);
        balance(fx, c, start, { minParts, color: def.charge?.color, color2: def.charge?.color2 });
      },
    };
  }
  return out;
}

export const AX_G4 = withBalance({ ...AX_G4_DAI, ...AX_G4_LOTO, ...AX_G4_MARIO, ...AX_G4_3B });

export const AX_G4_FINE = { ...FINE };

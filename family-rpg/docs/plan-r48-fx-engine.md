# 第48回: 大技エンジン（ためる → はなつ）

アニメの 必殺技（かめはめ波・螺旋丸・ヒノカミ神楽・アバンストラッシュ…）を 派手に するための 土台。
技の グループ（作品ごと）の 人は、この エンジンの 上に「はなつ ところ」だけを 書けば よい。

> **G1〜G6 の 人へ**: ファイルの なまえ・時間の 表（サーバーと おなじ 数）・技の つなぎかたは
> `docs/plan-r48-fx.md` の さいごの「G0 の 決めごと」が 正しい（下の 1〜3 の 「ax-dbz.js を つくって axfx.js に 2行 たす」「def に tier・hit・len・abilities を 書く」は
> おためし（ax-demo.js）だけの 書きかた。グループは `axfx-gN.js`・`shared/data/ax-time-gN.js` に 書く）。

| ファイル | なかみ |
|---|---|
| `public/js/client/render/axfx.js` | とうろく（`registerAx`・`useAxGroup`）・時間の けいさん（`axTiming`）・`playAxFx`（battlefx.js の play() の さいしょ） |
| `public/js/client/render/axcharge.js` | ためる えんしゅつ（ためかた 14しゅるい × 段階 4つ） |
| `public/js/client/render/axkit.js` | どうぐばこ（ビーム・たま・三日月・わ・いなずま・ほのお・波…）と かきかた `AX_FINE` |
| `public/js/client/render/ax-demo.js` | おためし 3つ（`ax_demo_beam`・`ax_demo_slash`・`ax_demo_orb`。どの 技にも つないで いない） |
| `public/js/client/sfx-ax.js` | ためる 音（`ax_c_<ためかた>`・`ax_c_legend`）・はなつ 音（`ax_beam` など） |
| `tools/fx-preview.mjs` | 見る どうぐ（コンタクトシート PNG） |
| `test/axfx-engine.test.js` | エンジンの テスト |

---

## エンジンの使い方

### 1. グループの ファイルを つくる（`render/ax-<グループ>.js`）

```js
// render/ax-dbz.js … ドラゴンボールの 技
import { pal } from './axkit.js';

const KI = pal('ki');

export const AX_DBZ = {
  ax_kamehameha: {
    tier: 'advanced',                       // 'basic' | 'advanced' | 'super' | 'legend'
    charge: { kind: 'ki', color: '#4ab8ff' }, // ためかた（下の 表）。false で ためない
    hit: 150,                               // はなってから あたる まで（ms）
    len: 1000,                              // はなってから おわる まで（ms）
    sfx: 'ax_beam',                         // はなつ 音（sfx-ax.js か audio.js の 音の なまえ）
    allyFx: 'bolt',                         // 敵が つかって 味方に あたった ときの まどの えんしゅつ
    // 技の id ごとに 段階・色を かえる（職業の 段階で 派手に）。ここに 書いた 技は この anim に なる
    abilities: {
      kamehameha: 'advanced',
      cho_kamehameha: { tier: 'super', charge: { color: '#ffd23a' }, vars: { gold: true } },
      kamehameha_kyoku: 'legend',
    },
    play(fx, c) {
      const { k } = c;
      const col = c.vars.gold ? pal('gold') : KI;
      // 味方は 画面の いちばん 下に いるので、画面の 下の そとから うちあげると ながく 見える
      const ox = c.from.x, oy = c.fromAlly ? c.H + 6 : c.from.y;
      c.each((t, i, d) => {
        k.beam(ox, oy, t.x, t.y, { w: 8 * c.sz * c.T, color: col.main, glow: col.glow, core: col.core, delay: d, life: 800, grow: c.hit, widths: [0.5, 1, 1.1, 1, 0.6, 0] });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: col.glow, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r1: 60 * c.sz, color: col.glow, n: 2, delay: d + c.hit + 60 });
      });
      k.shake(400, 1.5, c.hit);
    },
  },
};
```

### 2. axfx.js に 2行 たす（いちばん 下。ほかの 行は さわらない）

```js
import { AX_DBZ } from './ax-dbz.js';
useAxGroup('dbz', AX_DBZ);
```

ほかの グループと おなじ ところに 足すので、まぜる（merge）ときに ぶつかったら **りょうほう のこす** だけで よい。

### 3. 技に つなぐ（どちらか）

- **A. `abilities` に 技の id を 書く**（上の 例）。データ（`shared/data/abilities-*.js`）は かえなくて よい。
  battle.js は `axAnimFor(技の id)` を いちばん さきに 見る（`sigAnim`・`r27Anim`・データの `anim` より さき）。
- **B. データの `anim` を `'ax_…'` に かえる**。そのとき `abilities` は いらない。

どちらでも、ダメージの 数・味方の HPの 数は **はなって あたった とき**（`ためる 時間 + hit`）に 出る。
たたかいの 中み（`shared/` の ATB・ターン）は かわらない（え の 出しかた だけ おくらせる）。

### 4. 見て たしかめる

```sh
# 1まい（12こま。ふだんは fx-out/<anim>.png。fx-out/ は git に のせない）
node tools/fx-preview.mjs ax_kamehameha
# 敵全体（3体）・敵が 味方に（3人）
node tools/fx-preview.mjs ax_kamehameha --targets 3
node tools/fx-preview.mjs ax_kamehameha --dir enemy --targets 3
# 技ごとの 段階で 見る・段階を ためしに かえる・速さ 2
node tools/fx-preview.mjs ax_kamehameha --ability kamehameha_kyoku
node tools/fx-preview.mjs ax_kamehameha --tier legend --speed 2
# グループ ぜんぶ（1 anim 1まい）
node tools/fx-preview.mjs --all ax_kame --out /tmp/claude-0/…/scratchpad/dbz
# とうろくした なまえ
node tools/fx-preview.mjs --list ax_
# ためかたを ためしに かえる・ためかた 14しゅるいを 1まいに（1しゅるい 1行。ためる 時間の 25/50/75/97%）
node tools/fx-preview.mjs ax_kamehameha --charge breath --tier super
node tools/fx-preview.mjs --charges legend
node tools/fx-preview.mjs --charges super --dir enemy
```

- シートの 上の おび: 青 … ためる、だいだい … はなつ、赤い 線 … ダメージの 数が 出る 時間、白い 線 … とった こま。
- こまの 下: `charge`（ためて いる）・`RELEASE`（はなつ しゅんかん）・`HIT (numbers)`（数が 出る）・`after hit`。
  数（`123`）は battle.js と おなじ 時間に 出る。**数が 出る 前に あたって 見える・あたって から ずっと あと に 数** は なおす。
- そのほか: `--frames 16` `--cols 4` `--scale 1`（小さく）`--bg cave`（くらい はいけい）`--times 0,500,1400`（とる 時間）`--seed 3` `--crit` `--element fire`。
  大技で ない anim（`kamehameha` など 前の もの）も 見られる（`--hit 300` で 数の 時間）。
- エラー（play の 中の 例外・NaN の 例外）が あると 出して 終わりの コードが 1 に なる。1まい 1〜3びょう。

---

## def（registerAx の 2ばんめ）

| キー | なかみ |
|---|---|
| `tier` | 段階。`basic`（320ms ためる）・`advanced`（560ms）・`super`（860ms。画面が くらく・すこし ゆれる・じめんの いしが うく）・`legend`（1300ms。さらに カットインの 帯・つよい ゆれ・はなつ 直前の スローモーションの ひかり・白い ひかり） |
| `charge` | `{ kind, ms, color, color2, power, sfx }`。`ms` で ためる 時間を かえる。`power` … つぶの かずの かけざん。`sfx` … ためる 音（ふだんは `ax_c_<kind>`）。書かないと `generic`、`false` で ためない |
| `hit` | はなってから あたる まで（ms）。数 か `({ tier, n, all, crit, vars }) => 数` |
| `len` | はなってから おわる まで（ms。ふだんは hit + 500） |
| `stagger` | 敵全体の とき 1体ずつ ずらす ms（ふだん 60）。`c.each` の 3ばんめ |
| `sfx` | はなつ 音の なまえ（`sfx-ax.js` の `ax_beam`・`ax_slash`・`ax_orb`・`ax_boom`・`ax_holy`・`ax_ice`・`ax_water`・`ax_fire`・`ax_bolt`。audio.js の `blast`・`thunder` なども） |
| `allyFx` | 敵が 味方に つかった ときの まどの えんしゅつ（`bolt`・`fire`・`ice`・`wind`・`dark`・`claw`・`quake`…） |
| `party` | 味方・自分に かける 大わざ（的が なくても 画面の 下に 出す） |
| `pal` | 色の セット（`'ki'` など PAL の なまえ か `{ main, glow, core, dark, list }`）。ない ときは 属性の 色 |
| `vars` | play に わたす じゆうな あたい（`abilities` の `vars` で 技ごとに うわがき） |
| `abilities` | `['技id', …]` か `{ 技id: 'super' | { tier, charge, vars, element } }` |
| `play(fx, c)` | はなつ ところ。**c の 時間は はなつ しゅんかんが 0**（ためる 時間は 気に しない） |

## ctx（play の 2ばんめ `c`）

| キー | なかみ |
|---|---|
| `c.k` | どうぐばこ（fx を しばった もの）。`c.k.beam(x0, y0, x1, y1, {...})` |
| `c.from` | つかった 人 `{ x, y, w, h, foot }`。味方は 画面の 下（y ≒ 118）、敵は え の まん中 |
| `c.targets` / `c.t` / `c.center` | 的の いち の ならび / 1ばんめ / まん中 |
| `c.n` / `c.all` | 的の かず / 2つ いじょう |
| `c.fromAlly` / `c.foe` / `c.dir` | 味方が つかった / 敵が つかった / `'up'`（味方→敵）・`'down'`（敵→味方） |
| `c.ang` | つかった 人 → 的の まん中 の むき（ラジアン） |
| `c.tier` / `c.T` / `c.power` | 段階 / 段階の つよさ（0.75・1・1.3・1.65） / T × かいしん |
| `c.sz` | 大きさの めやす（敵全体 0.85・敵が 味方に 1.2・かいしん 1.15 を かけた もの） |
| `c.hit` / `c.len` / `c.stagger` | def の 時間（ms） |
| `c.element` / `c.pal` | 属性（たたかいの fx.element）/ 色の セット |
| `c.vars` / `c.ability` / `c.crit` | 技ごとの あたい / 技の id / かいしん |
| `c.each(fn)` | `fn(的, 何番め, ずらす ms)` |
| `c.at(ms, fn)` | エフェクトの 時計で ms あとに fn |
| `c.hitMark(t, delay, colors, r)` | きまりの あたった しるし |
| `c.W` / `c.H` | 画面（256 × 144） |
| `c.rnd` / `c.lerp` / `c.clamp01` | 計算の どうぐ |

`fx` は Effects（battlefx.js）。前からの `fx.sparks`・`fx.glow`・`fx.shock`・`fx.puff`・`fx.twinkle`・`fx.petal`・`fx.swirl`・`fx.converge`・`fx.flashAt`・`fx.hitStop`・`fx.tintAt` も そのまま つかえる。

## ためかた（charge.kind）

| kind | 見た目 |
|---|---|
| `ki` | もえあがる オーラ（上が とがって ゆらめく）・のぼる 光の すじ・super から バチバチ（いなずま） |
| `chakra` | からだの まわりを まわる うず・らせんの つぶ |
| `gomu` | ぶよぶよ ゆれる わ・湯気・どくん どくん（わ） |
| `breath` | ひろがって すいこまれる 呼吸の わ・口もとに あつまる 空気 |
| `sword` | 刀身を はしる ひかり・さきっぽの ほし・きらっと 切れる すじ・風 |
| `dragon` | ひたいの 竜の紋章・まわる ひかりの すじ・のぼる 光 |
| `holy` | からだを まわる リボン・ふる きらきら・super から 光の はしら |
| `magic` | あしもとの まほうじん（五芒星）・のぼる 文字の つぶ |
| `alchemy` | 錬成陣（円・三角・四角）・青い いなずま |
| `idol` | 上から スポットライト・ハート・音ぷ・きらきら |
| `tech` | まわる カード・けむり（さいごに ボン） |
| `ice` | まわる 雪の けっしょう・つめたい もや・ふる 雪 |
| `star` | うしろで まわる 大きな ほし・きらめき |
| `generic` | どくどく ひかる わ |

どれも あつまる ひかりつき。味方が ためる ときは（advanced から）うしろ すがたの かげが 画面の 下に 出る。
legend の カットインの かげは、敵なら その 魔物の え、味方なら 人の かたち（charge.color で ひかる）。

色は `charge.color`（おもな 色）・`charge.color2`（しんの 色）で かえる（例: ヒノカミ神楽 `{ kind: 'breath', color: '#ff7a1a', color2: '#ffe08a' }`、水の呼吸 `{ kind: 'breath', color: '#3a8cff', color2: '#e0f4ff' }`）。

## どうぐばこ（axkit.js。`c.k.〜` は fx を はぶいた もの。へんじは あたる 時間 ms）

| どうぐ | 例 |
|---|---|
| `beam(x0, y0, x1, y1, { w, color, glow, core, delay, life, grow, rise, fall, widths, flicker, streaks, burst })` | 太い ビーム（しん＋からだ＋ひかり・ゆらぐ ふち・ながれる すじ・先で はじける）。`widths` … 時間で かわる はば `[0.3, 1, 1, 0.6, 0]`。どの むきでも |
| `pillar(x, y, { w, color, glow, delay, life })` | 空から おちる 光の はしら |
| `orb(x, y, { r, color, glow, rim, arms, spin, grow, to, start, travel, hop, hold, dark })` | まわる たま（うずの うで・ふち・まわりの わ）。`to` で とぶ |
| `crescent(cx, cy, { r, a0, a1, w, swing, life, after, sy, rot })` | 三日月の 斬げき（まん中が ふとい）。`after` … ざんぞう |
| `slash(x, y, { r, ang, flip, span, w, color, glow })` | 的を 三日月で 切る |
| `multiSlash(x, y, { n, gap, r })` | なんども 切る |
| `shockwave(x, y, { r0, r1, color, w, sy, n, gap })` | ひろがる わ（`sy: 0.3` で じめん） |
| `impact(x, y, { r, glow, colors, heavy })` | あたった ひかり（heavy で ゆれも） |
| `explosion(x, y, { r, pal, heavy })` | 大爆発（ひかり・わ・火花・けむり） |
| `debris(x, y, { n, colors, up, g, shape })` | はへん（じゅうりょくで おちる） |
| `particles(x, y, { n, colors, speed, ang, spread, g })` | 火花 |
| `shapes(x, y, { shape, n, colors, speed, g, spin, size })` | かたちの つぶ（`flake`・`star`・`twinkle`・`card`・`heart`・`diamond`・`petal`・`rock`・`note`） |
| `sparkles(x, y, { n, r, size })` / `petals(x, y, { n, colors })` | きらきら / はなびら |
| `gather(x, y, { colors, n, r, waves, gap })` | あつまる ひかり |
| `bolt(x0, y0, x1, y1, { w, amp, forks, grow })` / `boltRain(x, y, { n })` | いなずま（えだわかれ） / 空から |
| `flames(x, y, { w, h, cols, n })` | もえる ほのお（＋火の粉） |
| `wave(x0, y0, x1, y1, { span, h, travel })` / `splash(x, y)` | 水の 大波 / しぶき |
| `speedLines(x, y, { r1 })` / `streaks({ ang, color, n })` | 集中線 / 画面いっぱいの 平行な すじ |
| `tint(color, { a, life, fin, fout })` / `dim({ a })` / `flash(color, ms, delay)` / `shake(ms, amp, delay)` | 画面の 色 / くらく / ひかる / ゆれる |
| `dash(x0, y0, x1, y1, { color, travel, w, img })` | ダッシュの ざんぞう |
| `cutIn({ color, color2, img, delay, life, y, h, dir })` | カットインの 帯（文字なし） |
| `glyph(x, y, { r, variant })` / `aura(x, y, { style, r, h })` | まほうじん / オーラ |

色: `pal('fire' | 'ice' | 'water' | 'wind' | 'blast' | 'bolt' | 'light' | 'dark' | 'void' | 'ki' | 'gold' | 'holy' | 'heal' | 'earth' | 'poison' | 'pink')` → `{ main, glow, core, dark, list }`。

## 時間の きまり

- `axTiming(anim, { tempo, ability, tier, targets, crit })` → `{ charge, release, hit, len, total, chargeReal, hitReal, totalReal, tier, kind }`。
  `hit = charge + def.hit`、`total = charge + def.len`。`〜Real` は たたかいの 速さ（`tempo`）で わった ほんとうの ms。
- battle.js: ダメージの 数・味方の HPの 数は `fx.at(hit)`（エフェクトの 時計）。名前の ふだと つぎの 行動の 表示は `axHoldMs`（hit + 350ms）まで まつ。
  ATB の ゲージ・サーバーの ターンは かわらない（おくれが たまったら 前からの 「たまったら とばす」きまりで おいつく）。
- 敵が ためる ときは その 魔物が ふくらんで ひかる（`axEnemyPose`。enemyfx.js の `buff` の うごき）。
- legend は ためる だけで 1.3びょう。ふつうの 行動の 時間（およそ 1.2びょう）より 長いので、**legend は 職業の いちばん 上の 技だけ** に する。
- 音: ためはじめに `ax_c_<kind>`、legend は とちゅうで `ax_c_legend`、はなつ ときに `def.sfx`。あたった 音（`hit`・`crit`・`hurt`）は battle.js が 数と いっしょに ならす。

## テストで たしかめる こと（グループの テストの 見本）

```js
import { Effects } from '../public/js/client/render/battlefx.js';
import { axList, axTiming } from '../public/js/client/render/axfx.js';
for (const anim of axList('ax_kame')) {
  for (const [pts, fromAlly] of [[[{ x: 128, y: 66 }], true], [[{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }], true], [[{ x: 77, y: 122 }, { x: 128, y: 122 }], false]]) {
    const fx = new Effects();
    fx.play(anim, pts, null, { fromAlly, from: fromAlly ? { x: 102, y: 122 } : { x: 128, y: 86, w: 40, h: 44 } });
    // fx.update(16) を くりかえして fx.draw(にせの ctx)。NaN が ない・total + 1200ms いないに おわる
  }
}
```

`test/axfx-engine.test.js` の `fakeCtx`・`runFx` を コピーして つかえる。

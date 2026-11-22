// 第98回 K1班: 八竜の火影の 絵（見た目・乗り物・技の えんしゅつ。データは shared/data/jobs-r98-hokage.js）
// きずなの職業の 絵は 1つ 1ファイル（client/render/kizuna-art.js の 一覧に 1行）。形は kizuna-kuuchou.js と おなじ
//
// 見た目: 親の 2つが 見て わかる 形
//   七代目火影 … ジャンプスーツ（jump26）と 白い はおり（すそに 炎の もよう。capeFlame）・ひたいあて
//   烈火       … 黒と 朱色の 服の 色（烈火の 忍び装束の 色）・右うでの 竜の こて（kote85 'ryu'）・赤い 炎の オーラ
//   （七代目火影の だいだい色・日の火影の みどりの はおり とは 色で 見分ける）
// 乗り物: 火影の大火竜（黒い 体・白い たてがみの 火竜。うしろに 分身の 小さな 火竜の かげ）
// えんしゅつ: hachiryu_hokage_sig（分身の かげ 6つが 火竜を 1ぴきずつ つれて とびこむ）・kizuna_rendan（火竜と いっしょの れんだ・らせん手裏剣）
import { dragonArt } from './vehicle-r85b.js?v=6a6b763889f6';

const ID = 'hachiryu_hokage';

// ───────────── 見た目 ─────────────
const outfit = { kind: 'jump26', main: '#c8281c', black: '#121016', cape: '#f4f2ea', capeLen: 37.6, capeFlame: true };
const body = { iris: '#d8401c', kote85: 'ryu', aura: 'ryuka98' };
const hat = { kind: 'hitai26', c: '#8a1a14' };
const oldLook = { outfit: 'traveler', cloth: '#c8281c', cape: '#f4f2ea', hat: 'headband', hatColor: '#8a1a14' };
const aura = {
  // 赤い 火竜の 炎（ねもとは 白っぽく・さきは 黒っぽい 朱色。烈火の オーラより 少し 大きい）
  ryuka98: { glow: 0.6, len: 3.6, wid: 1.25, up: 1.25, gap: 2.0, flicker: 0.24, cols: [['#fff4d0', 215], ['#ffa040', 186], ['#ff4a1c', 154], ['#8a1410', 116]] },
};

// ───────────── 乗り物: 火影の大火竜 ─────────────
function bigDragonArt(kit) {
  const base = dragonArt(kit, { body: '#2a2228', belly: '#ff6a1c', mane: '#f4f2ea', horn: '#ffd04a' });
  const { rgba } = kit;
  return {
    ...base,
    // こうか: うしろに ついてくる 分身の 小さな 火竜の かげ（すきとおった 朱色）と、白い 火の粉
    fx(p, view, f) {
      const side = view === 'side';
      const [w, h] = base.size(view);
      for (let k = 0; k < 2; k++) {
        const x0 = side ? w - 14 + k * 6 - f * 2 : 6 + k * (w - 16), y0 = (side ? 14 : 10) + k * 8 + f;
        for (let i = 0; i < 4; i++) p.set(Math.round(x0 + (side ? i * 2 : 0)), Math.round(y0 + Math.sin(i + f * 2) * 1.2 + (side ? 0 : i * 2)), rgba('#ff6a3a', 0.55 - i * 0.08));
        p.set(Math.round(x0 - (side ? 1 : 0)), Math.round(y0 - 1), rgba('#ffd04a', 0.7));
      }
      for (let i = 0; i < 3; i++) p.set(4 + ((i * 13 + f * 5) % (w - 8)), h - 6 - ((i * 7 + f * 3) % 12), rgba('#ffffff', 0.7));
    },
  };
}

// ───────────── 技の えんしゅつ ─────────────
const ANIMS = new Set(['hachiryu_hokage_sig', 'kizuna_rendan']);
const HIT = { hachiryu_hokage_sig: 820, kizuna_rendan: 360 };
const SFX = { hachiryu_hokage_sig: 'fire', kizuna_rendan: 'smash' };
const FIRE = { color: '#e8301c', color2: '#ffd04a', w: 3.6, len: 0.36, amp: 7, freq: 2.4, fin: true };
const SHADOW = ['#ffffff', '#ffd0a0', '#ff8a4a'];

function play(fx, anim, targets, element, opts = {}, W = 256) {
  if (!ANIMS.has(anim) || !targets?.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 140, delay: d, life: 340, len: 6 });
  };
  const n = Math.max(1, Math.min(6, opts.clones || 6));
  switch (anim) {
    case 'hachiryu_hokage_sig': {
      // 分身の かげ（白い けむり）が ならんで、1人に 1ぴきずつ 火竜が とびこむ
      fx.tintAt('rgba(40, 6, 6, 0.4)', 1600);
      for (let k = 0; k < n; k++) {
        const x = W * 0.08 + (k * W * 0.3) / n, y = 90 + (k % 2) * 14;
        fx.swirl(x, y, SHADOW, { n: 8, rad: 6, h: 20, delay: k * 40, life: 420, size: 1.1 });
      }
      each((t, i, d) => {
        for (let k = 0; k < Math.min(3, n); k++) {
          fx.add({ kind: 'r85bDragon', x: t.x, y: t.y, x0: W * 0.08 + (k * W * 0.3) / 3, y0: 96 + k * 6, x1: t.x + (k - 1) * 6, y1: t.y - 4, look: FIRE, s: 0.75, ph: k * 0.7 + i * 0.3, delay: d + 240 + k * 120, life: 520 });
        }
        fx.fireUp(t.x, t.y, 8, d + 620);
        fx.shock(t.x, t.y, { r0: 6, r1: 56 * sz, color: '#ffb040', w: 3, delay: d + 700, life: 420 });
        hitMark(t, d + 820, '#ff6a1c', 24);
      });
      fx.flashAt(200, '#fff0d0', 820);
      fx.hitStop(crit ? 280 : 220, 820, 1.8);
      return true;
    }
    case 'kizuna_rendan': {
      each((t, i, d) => {
        fx.add({ kind: 'r85bDragon', x: t.x, y: t.y, x0: t.x - 60, y0: t.y - 30, x1: t.x - 4, y1: t.y - 2, look: FIRE, s: 0.7, ph: i * 0.5, delay: d, life: 360 });
        for (let k = 0; k < 3; k++) fx.impact(t.x + (k - 1) * 7, t.y - 4 + k * 3, { r: 10 * sz, color: '#ffd04a', delay: d + 160 + k * 60 });
        fx.fireUp(t.x, t.y, 4, d + 240);
        hitMark(t, d + 360, '#ff6a1c', 16);
      });
      fx.hitStop(crit ? 180 : 120, 360, 1.2);
      return true;
    }
    default: return false;
  }
}

export const HOKAGE_ART = {
  id: ID,
  outfit, body, hat, oldLook, aura,
  emblems: {},
  vehicle: { id: 'kagebunshin_ryu', art: bigDragonArt },
  fx: { anims: ANIMS, party: new Set(), hit: HIT, sfx: SFX, play },
};

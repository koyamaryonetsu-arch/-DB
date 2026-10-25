// 大地の こどう（第5章 Step 6「大地の神殿」7階。map.tremor が ある マップ。maps/earth.js）
// ・歩いて いると、ときどき 地面が ふるえ始める（前ぶれ。every 歩ごと）。
// ・ふるえて いる 間（window ミリびょう）に grace 歩 いじょう 歩くと、上から 石が 落ちてくる（パーティーの HPが すこし へる。1は のこる）。
// ・立ち止まって いれば 当たらない。ふるえが おさまった あとの 1歩めで「よけられた」と 出る
// ・safe … ふるえない ところ（[x0, y0, x1, y1] の ならび。はじめの へや・かいだんの まわり）
// じょうたいは セッションに だけ もつ（セーブには のこさない）
import { MAPS } from '../maps/index.js?v=a2abc3298a71';
import { computeStats } from '../stats.js?v=a2abc3298a71';
import { partyOf } from './party.js?v=a2abc3298a71';
import { wagonChars } from './wagon.js?v=a2abc3298a71';

// 落石の ダメージ（さいだいHPの わりあい。すくなくても 5。1は のこる）
export function rockDamage(maxHp, rate) {
  return Math.max(5, Math.round(maxHp * rate));
}
const inSafe = (T, x, y) => (T.safe || []).some(([x0, y0, x1, y1]) => x >= x0 && y >= y0 && x <= x1 && y <= y1);

function hurtParty(world, s, rate) {
  const hurt = (c) => {
    if (!c || c.hp <= 1) return 0;
    const d = Math.min(c.hp - 1, rockDamage(computeStats(c).maxHp, rate));
    c.hp -= d;
    return d;
  };
  const dmg = hurt(s.char);
  // リーダーと いっしょに 歩く 仲間（酒場の 仲間・ゲスト・馬車の 仲間）も
  const p = partyOf(world, s);
  if (p && p.leader === s.id) {
    for (const sup of p.supports) hurt(sup.char);
    for (const g of p.guests) hurt(g.char);
    for (const ch of wagonChars(world, p)) hurt(ch);
  }
  world.sendSelf(s);
  if (p) world.sendParty(p);
  world.markDirty();
  return dmg;
}

// world.onEnterTile から（あるいて 入った マス）。'warn' … ふるえ始めた / 'rock' … 落石に 当たった / 'dodged' … よけた / null
export function stepTremor(world, s, tx, ty) {
  const T = MAPS[s.map]?.tremor;
  if (!T) {
    if (s.tremor) delete s.tremor;
    return null;
  }
  const st = s.tremor || (s.tremor = { walk: 0, warnAt: 0, moved: 0 });
  const now = world.now();
  if (st.warnAt) {
    if (now - st.warnAt <= T.window) {
      st.moved++;
      if (st.moved < T.grace) return null;
      st.warnAt = 0;
      st.walk = 0;
      const dmg = hurtParty(world, s, T.hurt);
      world.send(s, { t: 'hurt', kind: 'rock', dmg });
      world.send(s, { t: 'toast', text: 'ガラガラガラ…！\n上から、石が落ちてきた！\n（地面がふるえている時は、立ち止まろう）' });
      return 'rock';
    }
    // 立ち止まって いる 間に ふるえが おさまった
    st.warnAt = 0;
    st.walk = 0;
    world.send(s, { t: 'toast', text: '…ふるえが、おさまった。\n（足を止めていたので、落石に当たらなかった）' });
    return 'dodged';
  }
  if (inSafe(T, tx, ty)) return null;
  st.walk++;
  if (st.walk < T.every) return null;
  st.warnAt = now;
  st.moved = 0;
  world.send(s, { t: 'hurt', kind: 'tremor', dmg: 0 });
  world.send(s, { t: 'toast', text: 'ゴゴゴ…！\n地面が、ふるえ始めた…！' });
  return 'warn';
}

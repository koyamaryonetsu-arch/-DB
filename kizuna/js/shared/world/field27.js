// フィールドの 呪文と 道具（サーバーの きまり）: リレミト・トヘロス・マモノヨセ・聖水・魔物よせの笛
//   データは data/abilities-field27.js
//
// 魔物よけ（トヘロス・聖水）と 魔物よせ（マモノヨセ・魔物よせの笛）
// ・s.repelUntil … 魔物よけが 切れる 時こく（今までの 聖水と 同じ。world/monsters.js が 見る）
// ・s.lureUntil  … 魔物よせが 切れる 時こく（world/monsters.js・battles.js が 見る）
// ・char.aura    … 画面に 出す しるし { kind: 'repel'|'lure', until, name }（client/ui/hud.js。セーブに のこっても 時こくで 切れる）
// ・あとから 使った ほうが 勝つ（片方を 使うと もう 片方は 消える）
// ・家族と いっしょの ときは、同じ 場所に いる パーティーの 家族にも 効く
import { MAPS } from '../maps/index.js?v=a2abc3298a71';
import { ABILITIES } from '../data/abilities.js?v=a2abc3298a71';
import { ITEMS } from '../data/items.js?v=a2abc3298a71';
import { AURA_NAMES, LURE } from '../data/abilities-field27.js?v=a2abc3298a71';
import { mpCost, itemCount, removeItem } from '../stats.js?v=a2abc3298a71';
import { partyOf } from './party.js?v=a2abc3298a71';
import { isDungeonMap, dungeonExit } from './escape.js?v=a2abc3298a71';
import { warpParty } from './travel.js?v=a2abc3298a71';
import { rollGroup } from './monsters.js?v=a2abc3298a71';
import { ENCOUNTER_TABLES } from '../data/encounters.js?v=a2abc3298a71';
import { MONSTERS } from '../data/monsters.js?v=a2abc3298a71';

// ここで あつかう 効き目
export const FIELD27_EFFECTS = new Set(['exit', 'repel', 'lure']);

// 今 効いている もの（'repel' / 'lure' / null）
export function auraOf(s, now) {
  if (!s) return null;
  if (s.lureUntil > now) return 'lure';
  if (s.repelUntil > now) return 'repel';
  return null;
}
export const lureOn = (s, now) => !!s && s.lureUntil > now;

// 魔物よせの 戦い: 出現表から 組を ふりなおして、強い ほう（経験値の 合計が 多い ほう）に する
//   きらきらぷるりんなど 逃げる 魔物の 組・出現表の ない 魔物は そのまま
export function lureGroup(world, sym) {
  const table = ENCOUNTER_TABLES[sym.table];
  if (!table || !Array.isArray(sym.group) || sym.sp === 'kirakira') return sym.group;
  const power = (g) => g.reduce((a, sp) => a + (MONSTERS[sp]?.exp || 0), 0);
  let best = sym.group;
  for (let i = 1; i < LURE.strong; i++) {
    const g = rollGroup(world.rng, sym.table);
    if (power(g) > power(best)) best = g;
  }
  return best;
}

// 効き目を つける 人: 自分と、同じ 場所に いる パーティーの 家族
function auraTargets(world, s) {
  const out = [s];
  const p = partyOf(world, s);
  for (const sid of p?.members || []) {
    const m = world.sessions.get(sid);
    if (m && m !== s && m.inWorld && m.char && m.map === s.map) out.push(m);
  }
  return out;
}

// kind: 'repel' | 'lure'、seconds: 何秒、name: しるしに 出す 名前
export function setAura(world, s, kind, seconds, name) {
  const now = world.now();
  const until = now + seconds * 1000;
  const people = auraTargets(world, s);
  for (const m of people) {
    if (kind === 'lure') {
      m.lureUntil = until;
      m.repelUntil = 0;
    } else {
      m.repelUntil = until;
      m.lureUntil = 0;
    }
    m.char.aura = { kind, until, name: name || AURA_NAMES[kind] };
    if (m !== s) {
      world.sendSelf(m);
      world.send(m, { t: 'toast', text: kind === 'lure' ? `${s.char.name}の${name}で、魔物がどんどん寄ってくる…！` : `${s.char.name}の${name}で、弱い魔物が近よらなくなった。` });
    }
  }
  world.markDirty?.();
  return people.length;
}

const auraText = (kind, before) => {
  const swap = before && before !== kind ? (kind === 'lure' ? '\n（魔物よけの力は消えた）' : '\n（魔物よせの力は消えた）') : '';
  return kind === 'lure' ? `しばらく魔物がよく出て、強い魔物の組も出やすくなる！${swap}` : `しばらく弱い魔物が寄ってこない。${swap}`;
};

// 道具（聖水・魔物よせの笛。world/services.js の useItem から）
export function useAuraItem(world, s, id, reply) {
  const c = s.char;
  const it = ITEMS[id];
  if (!it || itemCount(c, id) < 1) return reply(false, '持っていない');
  const kind = it.effect.type;
  const before = auraOf(s, world.now());
  removeItem(c, id, 1);
  const n = setAura(world, s, kind, it.effect.seconds, it.name);
  const head = kind === 'lure' ? `${c.name}は${it.name}をふいた！\nピィーーッ…！` : `${c.name}は${it.name}をふりまいた！`;
  return reply(true, `${head}\n${auraText(kind, before)}${n > 1 ? '\n（いっしょにいる家族にも効く）' : ''}`);
}

// 呪文（リレミト・トヘロス・マモノヨセ。world/services.js の 'cast' から）。reply(ok, text)
export function castField27(world, s, caster, id, reply) {
  const a = ABILITIES[id];
  const type = a.effect?.type;
  const head = `${caster.name}は${a.name}を唱えた！`;
  if (type === 'exit') {
    // リレミト: みちびきの糸と 同じ（world/escape.js）。使えない 所では MPは へらない
    const here = MAPS[s.map];
    if (!isDungeonMap(here)) return reply(false, `${head}\nしかし、何も起こらなかった…\n（${a.name}は、洞窟や塔の中で使う呪文）`);
    if (here.noEscape) return reply(false, `${head}\nしかし、ふしぎな力にはばまれて、何も起こらなかった！\n（${here.noEscapeHint || '来た道を歩いてもどろう'}）`);
    const to = dungeonExit(world, s);
    if (!to) return reply(false, `${head}\nしかし、出口が見つからない…`);
    const cost = mpCost(caster, id);
    if (caster.mp < cost) return reply(false, 'MPが足りない！');
    caster.mp -= cost;
    // 「ついていく」なかま・いっしょの 家族も（糸・ルーラと 同じ。travel.js）
    warpParty(world, s, to);
    return reply(true, `${head}\nまばゆい光につつまれて、${here.name.split('　')[0]}の外へもどってきた！`);
  }
  if (type === 'repel' || type === 'lure') {
    const cost = mpCost(caster, id);
    if (caster.mp < cost) return reply(false, 'MPが足りない！');
    const before = auraOf(s, world.now());
    caster.mp -= cost;
    const n = setAura(world, s, type, a.effect.seconds, a.name);
    return reply(true, `${head}\n${auraText(type, before)}${n > 1 ? '\n（いっしょにいる家族にも効く）' : ''}`);
  }
  return reply(false, '今は使えない');
}

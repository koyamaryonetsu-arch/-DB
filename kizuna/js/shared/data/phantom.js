// 第51回 F: 幻の職業の 条件の 表・技の タグ・文（docs/plan-r51-phantom.md）
//
// 幻の職業（jobs.js の PHANTOM_ORDER。tier 4）に なる 条件 = きわめておく 職業 2つ（masters。jobs.js の req と おなじ）＋ やりこみの 条件（conds）
//   やりこみの 条件は「自分が 使った 技の 回数」と「自分が 与えた ダメージ・回復の 量」だけ（敵の 強さで かわる 物は 使わない）
//   数は キャラの c.feats（どの 職業の 時でも 数える。数えはじめは 第51回から。足しこみは world/phantom.js）
//     c.feats = { use: { タグ: 回数 }, dmg, dmgSpell, dmgFire, heal, crit, big5000, rv }
//       dmg … 敵に 与えた ダメージの 合計 / dmgSpell … そのうち 呪文 / dmgFire … そのうち 炎
//       heal … 自分の 技・呪文で 回復した HP（へっていた ぶんだけ）/ crit … 会心の一撃 / big5000 … 1回で 5000 いじょうの ダメージ
//       rv … 条件を 見つけた 幻の職業（PHANTOM_ORDER の じゅんの ビット。掲示板に 1回だけ のせる）
//   数えるのは 家族の キャラ（戦いの kind 'player'）だけ。仲間・敵は 数えない（shared/battle.js の featOf）
//
// 技の タグ（PHANTOM_TAGS。abilityTags が 技の データから 作る。はじめて 使う ときに 1回だけ）
//   gomu        … ゴム人間・ニカの 技、名前に ゴムゴム・ギア
//   thunderSpell… 雷の 呪文（呪文〈spellLike も〉で 雷の 属性）
//   kame        … かめはめ波の 仲間（名前に かめはめ・えんしゅつ kamehameha）
//   hinokami    … 炎柱・日の呼吸の使い手の 技、名前に ヒノカミ・日の呼吸・炎の呼吸
//   ninjutsu    … 木の葉の忍び・七代目火影の 技、名前に らせん丸・影分身
//   support     … 補助・回復の 技（abilityRole が ダメージ で ない。にげる・何もしない などは のぞく）
//   deduce      … 推理・調べる 技（こうか deduce・scan）と 探ていの 職業（少年探てい・おしり探てい・名探てい）の 技、名前に 推理・調べ
//   healSpell   … 回復の 呪文（呪文で abilityRole が 回復）
//   attackSpell … 攻撃の 呪文（呪文で abilityRole が ダメージ）
//   sword       … 剣の 技（呪文で ない ダメージの 技で、つぎの どれか）
//                 ・魔法剣に 使える（sword）・ぶきが 剣（weapon: blade・sword）・名前に 斬・剣（手裏剣は のぞく）・刀・つるぎ・居合
//                 ・えんしゅつが 剣の 物（SWORD_ANIMS: gigabreak・strash・dark_slash など）
//                 ・剣の 職業（SWORD_JOBS: サムライ・るろうに剣士・きさつ隊・将軍 など）の 物理の 技
//   debuff      … 敵を 弱くする 技（敵に かける 技で、こうかに debuff・status・dispel・atbSet が ある ダメージで ない 技か、
//                 せつめいに「しかる」が ある もの。おかんの 雷・おかんのいかり など）
//   train       … 鉄道の 職業（鉄道員・運転士・京急の運転士・京急の社長）の 技、えんしゅつが 電車、名前に 電車・列車
//   pitch       … 野球の 職業の 投げる 技（えんしゅつ ball・消える魔球・三しん、名前に 球）と、名前に 速球・直球・魔球
//   sun・rain・thunder … 天気の 技（技の データの weather: 'sun'|'rain'|'thunder'。W 班が つける）
//   幻の職業の 技も 名前・職業で 入る（例: かめはめデイン は kame）。技に phantomTags: ['gomu', …] を 書くと それも 足す
import { ABILITIES, abilityRole } from './abilities.js?v=ba9bc083e891';
import { JOBS, JOB_MAX_LEVEL, PHANTOM_ORDER, JOB_HINTS } from './jobs.js?v=ba9bc083e891';
import { jobLabel } from '../job-label.js?v=ba9bc083e891';

export const PHANTOM_TAGS = ['gomu', 'thunderSpell', 'kame', 'hinokami', 'ninjutsu', 'support', 'deduce', 'healSpell', 'attackSpell',
  'sword', 'debuff', 'train', 'pitch', 'sun', 'rain', 'thunder'];
// 1回で これ いじょうの ダメージを「大きな 一撃」と 数える
export const BIG_HIT = 5000;
export const FEAT_STATS = ['dmg', 'dmgSpell', 'dmgFire', 'heal', 'crit', 'big5000'];
// 記録の 入れもの（はじめは 0。戦いの 中の combatant.feat と、キャラの c.feats）
export function newFeat() {
  return { use: {}, dmg: 0, dmgSpell: 0, dmgFire: 0, heal: 0, crit: 0, big5000: 0 };
}

// きわめておく 職業の 名前（まだ データが ない 職業。W 班の 天候をあやつる者）
const MASTER_NAMES = { tenkou_tsukai: '天候をあやつる者' };

// 条件の 表（数は 家族が えらんだ まま。かえない）
//   use: [タグ…] … その タグの 技を 使った 回数（2つ いじょうは 合わせて）/ stat … c.feats の 数 / goal … めざす 数 / text … 条件の 文
export const PHANTOM_JOBS = {
  pirate_king: {
    name: '海賊王', masters: ['nika', 'pirate'],
    conds: [{ use: ['gomu'], goal: 500, text: 'ゴムゴムの技を500回使う' }, { stat: 'dmg', goal: 200000, text: 'あたえたダメージの合計20万' }],
  },
  super_hero: {
    name: '伝説の超勇者', masters: ['loto_hero', 'ss3'],
    conds: [{ use: ['thunderSpell', 'kame'], goal: 300, text: '雷の呪文とかめはめ波の仲間を合わせて300回使う' }, { stat: 'dmg', goal: 300000, text: 'あたえたダメージの合計30万' }],
  },
  sun_hokage: {
    name: '日の火影', masters: ['hinokami', 'hokage'],
    conds: [{ use: ['hinokami'], goal: 200, text: 'ヒノカミ神楽の技を200回使う' }, { use: ['ninjutsu'], goal: 200, text: '忍術を200回使う' }, { stat: 'dmgFire', goal: 200000, text: '炎のダメージの合計20万' }],
  },
  facility_ai: {
    name: '天才しせつ管理者AI', masters: ['facility_genius', 'creator'],
    conds: [{ use: ['support'], goal: 1500, text: '補助の技を1500回使う' }, { stat: 'heal', goal: 50000, text: '回復量の合計5万' }],
  },
  detective_king: {
    name: '名探てい王', masters: ['meitantei', 'oshiri_tantei'],
    conds: [{ use: ['deduce'], goal: 500, text: '推理・調べる技を500回使う' }, { stat: 'dmg', goal: 100000, text: 'あたえたダメージの合計10万' }],
  },
  galaxy_queen: {
    name: '銀河の女王', masters: ['neo_queen', 'fifth_spirit'],
    conds: [{ use: ['healSpell'], goal: 1000, text: '回復の呪文を1000回使う' }, { stat: 'heal', goal: 300000, text: '回復量の合計30万' }],
  },
  grand_magus: {
    name: '大魔導王', masters: ['archmage', 'harry'],
    conds: [{ use: ['attackSpell'], goal: 1000, text: '攻撃の呪文を1000回使う' }, { stat: 'dmgSpell', goal: 500000, text: '呪文のダメージの合計50万' }],
  },
  sword_saint: {
    name: '天下無そうの剣聖', masters: ['hiten', 'abarenbo_shogun'],
    conds: [{ use: ['sword'], goal: 1000, text: '剣の技を1000回使う' }, { stat: 'crit', goal: 300, text: '会心の一撃を300回出す' }],
  },
  cosmic_okan: {
    name: '宇宙一のおかん', masters: ['saikyo_okan', 'homeroom_3b'],
    conds: [{ use: ['debuff'], goal: 1000, text: '敵を弱くする技（しかるなど）を1000回使う' }, { stat: 'heal', goal: 50000, text: '回復量の合計5万' }],
  },
  chaos_creator: {
    name: 'はかいと創造の神', masters: ['hakaishin', 'creator'],
    conds: [{ stat: 'big5000', goal: 50, text: '1回で5000以上のダメージを50回あたえる' }],
  },
  dream_stadium: {
    name: '夢のスタジアム鉄道', masters: ['keikyu_president', 'hall_of_fame'],
    conds: [{ use: ['train'], goal: 300, text: '電車の技を300回使う' }, { use: ['pitch'], goal: 300, text: '速球の技を300回使う' }, { stat: 'dmg', goal: 200000, text: 'あたえたダメージの合計20万' }],
  },
  weather_god: {
    name: '天候の神', masters: ['tenkou_tsukai', 'summoner'],
    conds: [{ use: ['sun'], goal: 200, text: '晴れの技を200回使う' }, { use: ['rain'], goal: 200, text: '雨の技を200回使う' }, { use: ['thunder'], goal: 200, text: 'かみなりの技を200回使う' }],
  },
};

// ───── 技の タグ ─────
// 剣の えんしゅつ（slash_* は 剣で ない 技にも 使うので 入れない。剣の 職業か 名前で 入る）
const SWORD_ANIMS = new Set(['gigabreak', 'strash', 'dark_slash', 'cross_slash', 'mahouken', 'r40_magic_sword', 'nc_dawn_blade']);
const SWORD_JOBS = new Set(['samurai', 'sword_master', 'rurouni', 'hitokiri', 'himura', 'hiten', 'kisatsu', 'enbashira', 'hinokami', 'shogun', 'abarenbo_shogun', 'magic_swordsman']);
const RAIL_JOBS = new Set(['railman', 'train_driver', 'keikyu_driver', 'keikyu_president']);
const BALL_JOBS = new Set(['ballplayer', 'major_leaguer', 'nitoryu', 'hall_of_fame']);
const TANTEI_JOBS = new Set(['shonen_tantei', 'oshiri_tantei', 'meitantei']);
const NOT_SUPPORT = new Set(['nothing', 'escape', 'flee', 'warp', 'exit', 'lure', 'repel']);
const FOE = new Set(['enemy', 'group', 'enemies']);

// こうかの 中みを ぜんぶ（multi の parts も）
function effects(e, out = [], depth = 0) {
  if (!e || depth > 3) return out;
  out.push(e);
  if (e.type === 'multi') for (const p of e.parts || []) effects(p, out, depth + 1);
  return out;
}

function tagsOf(id, a, jobsOf) {
  const out = new Set();
  if (!a || a.kind === 'monster' || a.kind === 'bond' || a.fieldOnly) return out;
  const jobs = jobsOf(id, a);
  const inJobs = (set) => jobs.some((j) => set.has(j));
  const name = a.name || '';
  const effs = effects(a.effect);
  const types = new Set(effs.map((e) => e.type));
  const elems = new Set(effs.map((e) => e.element).filter(Boolean));
  const role = abilityRole(a);
  const spell = a.kind === 'spell' || !!a.spellLike;
  if (inJobs(new Set(['rubber', 'nika'])) || /ゴムゴム|ギア[0-9０-９]/.test(name)) out.add('gomu');
  if (spell && elems.has('bolt')) out.add('thunderSpell');
  if (a.anim === 'kamehameha' || /かめはめ/.test(name)) out.add('kame');
  if (inJobs(new Set(['enbashira', 'hinokami'])) || /ヒノカミ|日の呼吸|炎の呼吸/.test(name)) out.add('hinokami');
  if (inJobs(new Set(['konoha', 'hokage'])) || /らせん丸|影分身/.test(name)) out.add('ninjutsu');
  if (role !== 'dmg' && !NOT_SUPPORT.has(a.effect?.type)) out.add('support');
  if (types.has('deduce') || types.has('scan') || inJobs(TANTEI_JOBS) || /推理|調べ/.test(name)) out.add('deduce');
  if (spell && role === 'heal') out.add('healSpell');
  if (spell && role === 'dmg') out.add('attackSpell');
  if (!spell && role === 'dmg' && (a.sword || a.weapon === 'blade' || a.weapon === 'sword' || /斬|(?<!手裏)剣|刀|つるぎ|居合/.test(name)
    || SWORD_ANIMS.has(a.anim) || (inJobs(SWORD_JOBS) && types.has('phys')))) out.add('sword');
  if (FOE.has(a.target) && (/しか[らりるれろっ]/.test(a.desc || '')
    || (role !== 'dmg' && ['debuff', 'status', 'dispel', 'atbSet'].some((t) => types.has(t))))) out.add('debuff');
  if (inJobs(RAIL_JOBS) || ['train', 'redtrain', 'manin_densha'].includes(a.anim) || /電車|列車/.test(name)) out.add('train');
  if ((inJobs(BALL_JOBS) && (['ball', 'r41a_vanish', 'r41a_strikeout'].includes(a.anim) || /球|スイーパー|三しん/.test(name)))
    || /速球|直球|魔球/.test(name)) out.add('pitch');
  if (['sun', 'rain', 'thunder'].includes(a.weather)) out.add(a.weather);
  for (const t of Array.isArray(a.phantomTags) ? a.phantomTags : []) if (PHANTOM_TAGS.includes(t)) out.add(t);
  return out;
}

let TAGS = null;
function build() {
  const learners = {};
  for (const j of Object.values(JOBS)) for (const [, id] of j.learn || []) (learners[id] = learners[id] || []).push(j.id);
  const jobsOf = (id, a) => [...new Set([...(a.job ? [a.job] : []), ...(learners[id] || [])])];
  const map = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) {
    const t = tagsOf(id, a, jobsOf);
    if (t.size) map.set(id, Object.freeze([...t]));
  }
  return map;
}
const NONE = Object.freeze([]);
// その 技の タグ（ない ときは 空）
export function abilityTags(id) {
  if (!TAGS) TAGS = build();
  return TAGS.get(id) || NONE;
}
// その タグの 技（ためし・せつめい 用）
export function tagMembers(tag) {
  if (!TAGS) TAGS = build();
  return [...TAGS].filter(([, t]) => t.includes(tag)).map(([id]) => id);
}

// ───── 条件の すすみぐあい ─────
const num = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
export function condNow(c, cond) {
  const f = c?.feats;
  if (!f || typeof f !== 'object') return 0;
  if (cond.use) return cond.use.reduce((s, t) => s + num(f.use?.[t]), 0);
  return num(f[cond.stat]);
}
export function condDone(c, cond) {
  return condNow(c, cond) >= cond.goal;
}
// やりこみの 条件を ぜんぶ みたしたか（きわめておく 職業は jobUnlocked が 見る）
export function phantomCondsMet(c, id) {
  const p = PHANTOM_JOBS[id];
  return !!p && p.conds.every((x) => condDone(c, x));
}
const mastered = (c, r) => (c?.jobs?.[r]?.lv || 0) >= JOB_MAX_LEVEL;
// 条件が 見える（きわめておく 職業を 1つでも きわめた）
export function phantomSeen(c, id) {
  return !!PHANTOM_JOBS[id] && PHANTOM_JOBS[id].masters.some((r) => mastered(c, r));
}
// なれる（2つとも きわめて、条件も ぜんぶ）。職業の データが まだ なくても 条件だけ 見る
export function phantomReady(c, id) {
  return !!PHANTOM_JOBS[id] && PHANTOM_JOBS[id].masters.every((r) => mastered(c, r)) && phantomCondsMet(c, id);
}

// 名前（職業の データが あれば その 人 むけの 名前。なければ 表の 名前）
export function phantomName(id, who = null) {
  return (JOBS[id] && jobLabel(id, who)) || PHANTOM_JOBS[id]?.name || '';
}
export function masterName(id, who = null) {
  return (JOBS[id] && jobLabel(id, who)) || MASTER_NAMES[id] || id;
}
// 条件の 文（掲示板・神殿。例: 「ニカと海賊をきわめる。ゴムゴムの技を500回使う。あたえたダメージの合計20万」）
export function phantomCondText(id, who = null) {
  const p = PHANTOM_JOBS[id];
  if (!p) return '';
  return [`${p.masters.map((r) => masterName(r, who)).join('と')}をきわめる`, ...p.conds.map((x) => x.text)].join('。');
}

// 大きな 数の 出し方（12345 → 1.2万。1万より 下は そのまま）
export function bigNum(n) {
  n = num(n);
  if (n < 10000) return String(n);
  const m = Math.floor(n / 1000) / 10;
  return `${m % 1 ? m.toFixed(1) : m}万`;
}

// 幻の書の 1行ぶん（client/ui/phantom-book.js）
//   { id, known（名前と 条件が 見える）, name, masters: [{ id, name, done }], conds: [{ text, now, goal, done }], ready, got（なった ことが ある）, live（職業の データが ある）}
export function phantomBook(c) {
  return PHANTOM_ORDER.map((id) => {
    const p = PHANTOM_JOBS[id];
    const known = phantomSeen(c, id) || !!c?.jobs?.[id];
    const row = { id, known, name: known ? phantomName(id, c) : '？？？', live: !!JOBS[id], got: !!c?.jobs?.[id], ready: false, masters: [], conds: [] };
    if (!known || !p) return row;
    row.masters = p.masters.map((r) => ({ id: r, name: masterName(r, c), done: mastered(c, r) }));
    row.conds = p.conds.map((x) => {
      const now = condNow(c, x);
      return { text: x.text, now: Math.min(now, x.goal), goal: x.goal, done: now >= x.goal };
    });
    row.ready = phantomReady(c, id);
    return row;
  });
}

// うわさ（きわめておく 職業を 1つでも はじめて、まだ 条件が 見えて いない 幻の職業の ヒント）
export function phantomRumors(c) {
  return PHANTOM_ORDER.filter((id) => JOB_HINTS[id] && !phantomSeen(c, id) && PHANTOM_JOBS[id].masters.some((r) => c?.jobs?.[r]))
    .map((id) => JOB_HINTS[id]);
}

// 合体技（2人で 力を 合わせる 技）
//
// ・自分の 行動ゲージが たまって コマンドを えらぶ とき、仲間と 出せる。
//   仲間の ゲージが たまって いれば すぐ。まだ なら「よやく」して、仲間の ゲージが たまった ときに いっしょに 出す
// ・はじめて 使う までは 効果が わからない（char.dualSeen。使うと わかる）
// ・need の 2つの 組の 技を、2人が 1つずつ 覚えていれば 出せる（どちらが どちらでも よい）
// ・2人の 番（行動ゲージ）と、それぞれの MP（mp[0]・mp[1]）を 使う
// ・相手が 家族（人が 動かしている キャラ）の ときは、相手に「参加する？」と 聞く
// ・技の 強さは 2人の 強さを 合わせて 決まる（battle.js の performDual）
import { ABILITIES } from './abilities.js?v=a39a58253380';

// 技の 組（どれか 1つを 覚えていれば よい）
const FIRE = ['mera', 'merami', 'merazoma', 'gira', 'begirama', 'nj_katon', 'am_begiragon', 'am_meragaia', 'hk_triple_mera'];
const ICE = ['hyado', 'hyadaruko', 'sg_mahyado', 'pr_uzushio', 'hk_koori_ya'];
const WIND = ['bagi', 'bagima', 'sg_bagikurosu', 'nj_fuujin', 'hp_bagimuta', 'kamaitachi', 'hk_senpuukyaku', 'ar_senpu'];
const BLAST = ['io', 'iora', 'pr_cannon', 'ft_tower', 'am_ionazun'];
const BOLT = ['mk_raiden', 'hr_gigadein', 'sm_raijin'];
const LIGHT = ['hk_holy_light', 'ft_star', 'sd_comet', 'sd_meteor', 'hk_love_beam', 'fz_meteor'];
const SWORD = ['daichi', 'kaiha', 'kuuretsu', 'kabutowari', 'majingiri', 'tamashii', 'bm_musou', 'bm_moroba', 'pr_kaizokugiri', 'sa_iai', 'sa_tsubame', 'sa_ittou', 'hk_midaregiri', 'hk_daichi_ikari', 'mk_kaengiri', 'mk_hyouketsu', 'mk_inazuma'];
const FIST = ['seiken', 'bakuretsu', 'mouko', 'hyakuretsu', 'issen', 'hf_seikou', 'gh_shinsoku', 'hk_sandan'];
const HEAL = ['hoimi', 'behoimi', 'behomara', 'sg_behoma', 'pl_hikari', 'id_fansa', 'id_kami', 'hk_iyashi_kaze', 'ss_stardance', 'es_kyushoku', 'lc_jumin', 'ff_teate', 'fz_juice'];
const DANCE = ['hustle', 'medapani', 'zameha_dance', 'ss_stardance', 'js_bakuten', 'hk_happy_step', 'ar_senpu'];
const SONG = ['ouen', 'tatakai_uta', 'pr_utage', 'bb_ouenka', 'id_penlight', 'hk_fan_cheer', 'sd_song', 'es_recorder', 'jh_gassho', 'ar_harmony', 'kq_doremi'];
const GUARD = ['kabau', 'sukara', 'sukuruto', 'pl_daibougyo', 'pl_aegis', 'gd_wall', 'id_center', 'lc_bousai', 'cr_kiki', 'ff_hinoyoujin', 'dv_anzen', 'kq_sentou'];
const RAIL = ['rw_manin', 'rw_teikoku', 'rw_shinkansen', 'rw_shuuden', 'hk_tokkyu', 'dv_tsuuka', 'dv_renketsu', 'dv_saikou', 'kq_120', 'kq_kaitoku'];
const OFFICE = ['sm_meishi', 'sm_eigyo', 'sm_horenso', 'sm_present', 'hk_meishi_shuriken'];
const BALL = ['bb_hit', 'bb_homerun', 'bb_fastball', 'hk_nagashi', 'hk_makyuu', 'ml_160'];
const IDOL = ['id_kiss', 'id_wink', 'id_fansa', 'id_penlight', 'hk_love_beam', 'fz_basket', 'ar_manazashi'];
const JESTER = ['js_asobu', 'js_gag', 'js_kusuguri', 'hk_daibakushou'];
const PARTY = ['sm_nomikai', 'sm_present', 'sm_bonus', 'js_gag', 'id_penlight', 'es_aisatsu', 'hs_bunkasai', 'lc_yurukyara'];
// 学校の 技・公務員の 技（授業参観: 子どもと 大人で 出す）
const SCHOOL = ['es_randoseru', 'es_aisatsu', 'es_recorder', 'es_kakekko', 'es_dodge', 'hk_randoseru_rocket', 'jh_bukatsu', 'jh_test', 'jh_gassho', 'hs_seishun', 'hs_bunkasai'];
const CIVIL = ['lc_madoguchi', 'lc_shorui', 'lc_jumin', 'nc_hanko', 'nc_yosan', 'cr_seisaku'];
const WORK = [...OFFICE, ...CIVIL, 'bc_kessai', 'sh_meirei'];
const ELEM_SPELLS = [...FIRE, ...ICE, ...WIND, ...BLAST, ...BOLT, ...LIGHT];
const DANCE_SONG = [...DANCE, ...SONG];

// 組の なまえ（メニューの 一覧で 見せる）
export const DUAL_GROUP_NAMES = new Map([
  [FIRE, '炎の呪文'], [ICE, '氷の呪文'], [WIND, '風の技'], [BLAST, '爆発の呪文'], [BOLT, '雷の呪文'], [LIGHT, '光の技'],
  [SWORD, '剣の技'], [FIST, 'こぶしの技'], [HEAL, '回復の技'], [DANCE, 'おどり'], [SONG, '歌'], [GUARD, '守りの技'],
  [RAIL, '鉄道員の技'], [OFFICE, '会社員の技'], [BALL, '野球の技'], [IDOL, 'アイドルの技'], [JESTER, '遊び人の技'], [PARTY, 'もり上げる技'],
  [SCHOOL, '学校の技'], [CIVIL, '公務員の技'], [WORK, 'お仕事の技'],
  [ELEM_SPELLS, '属性の技'], [DANCE_SONG, 'おどりか歌'],
]);

export const DUAL_TECHS = {
  dt_taishoumetsu: {
    name: '対消滅', kana: 'ついしょうめつ', need: [FIRE, ICE], mp: [5, 5], target: 'enemy', spell: true,
    parts: [{ type: 'magic', element: 'void', base: [62, 80], thr: 24 }],
    desc: '炎と氷を全く同じ強さでぶつけて、全てを消し去る光を生む。', anim: 'void', element: 'void',
  },
  dt_honoo_tatsumaki: {
    name: '炎の竜巻', kana: 'ほのおのたつまき', need: [FIRE, WIND], mp: [4, 4], target: 'enemies', spell: true,
    parts: [{ type: 'magic', element: 'fire', base: [34, 44], thr: 20 }],
    desc: '風が炎を巻き上げて、大きな炎の竜巻になる。敵全体を焼きつくす。', anim: 'fire_tornado', element: 'fire',
  },
  dt_blizzard: {
    name: 'ブリザード', kana: 'ぶりざーど', need: [ICE, WIND], mp: [4, 4], target: 'enemies', spell: true,
    parts: [{ type: 'magic', element: 'ice', base: [30, 40], thr: 20, status: { status: 'paralyze', chance: 0.15, turns: [1, 2], quiet: true } }],
    desc: '氷が風に乗って、はげしいふぶきになる。敵全体をこおりつかせる。', anim: 'blizzard', element: 'ice',
  },
  dt_daibakuen: {
    name: '大爆炎', kana: 'だいばくえん', need: [FIRE, BLAST], mp: [5, 5], target: 'enemies', spell: true,
    parts: [{ type: 'magic', element: 'blast', base: [40, 52], thr: 22 }],
    desc: '炎が爆発を呼び、大きな爆炎が上がる。敵全体に大ダメージ。', anim: 'blast2', element: 'blast',
  },
  dt_cross_mahouken: {
    name: 'クロス魔法剣', kana: 'くろすまほうけん', need: [SWORD, ELEM_SPELLS], mp: [3, 4], target: 'enemy', weapon: [0, 'blade'],
    parts: [{ type: 'phys', mult: 2.4, elementFrom: 1 }],
    desc: '仲間の呪文の力を剣にまとわせて斬る。仲間の呪文と同じ属性の剣になる。', anim: 'mahouken',
  },
  dt_raiden_strash: {
    name: 'ライデインストラッシュ', kana: 'らいでいんすとらっしゅ', need: [SWORD, BOLT], mp: [4, 6], target: 'enemy', weapon: [0, 'blade'],
    parts: [{ type: 'phys', element: 'bolt', mult: 3.0, ignoreDef: 0.3 }],
    desc: '仲間のよんだ雷を剣で受けて、そのまま斬りつける。雷の必殺剣。', anim: 'gigabreak', element: 'bolt',
  },
  dt_cross_break: {
    name: 'クロスブレイク', kana: 'くろすぶれいく', need: [SWORD, SWORD], mp: [3, 3], target: 'enemy', weapon: [0, 'blade'],
    parts: [{ type: 'phys', mult: 1.3, hits: 2, ignoreDef: 0.3 }],
    desc: '2人の剣が十字をえがく。守りの固い敵にもよく効く。', anim: 'cross_slash',
  },
  dt_twin_fist: {
    name: 'ツイン百裂拳', kana: 'ついんひゃくれつけん', need: [FIST, FIST], mp: [3, 3], target: 'enemy',
    parts: [{ type: 'phys', mult: 0.45, hits: 6, critBonus: 0.05 }],
    desc: '2人で息を合わせて、こぶしの雨をふらせる。6回続けて打つ。', anim: 'punch_multi',
  },
  dt_iyashi_wa: {
    name: 'いやしの輪', kana: 'いやしのわ', need: [HEAL, HEAL], mp: [4, 4], target: 'allies', spell: true,
    parts: [{ type: 'heal', base: [44, 58], thr: 20 }],
    desc: '2人の回復の力が大きな輪になって、仲間全員のHPを大きく回復する。', anim: 'heal_ring',
  },
  dt_harmony: {
    name: 'いやしのハーモニー', kana: 'いやしのはーもにー', need: [HEAL, DANCE_SONG], mp: [4, 3], target: 'allies',
    parts: [{ type: 'heal', base: [28, 36], thr: 18 }, { type: 'cure', statuses: ['sleep', 'confuse', 'paralyze', 'poison', 'blind', 'silence'] }],
    desc: '歌とおどりに、いやしの力を乗せる。仲間全員を回復して、状態異常も治す。', anim: 'heal_dance',
  },
  dt_teppeki: {
    name: 'てっぺきの守り', kana: 'てっぺきのまもり', need: [GUARD, GUARD], mp: [3, 3], target: 'allies',
    parts: [{ type: 'buff', stats: ['def'], mult: 1.4, dur: 30 }],
    desc: '2人で守りをかためる。仲間全員の身の守りが大きく上がる。', anim: 'guard',
  },
  dt_stage: {
    name: 'ステージショー', kana: 'すてーじしょー', need: [DANCE, SONG], mp: [3, 3], target: 'allies',
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.25, dur: 30 }],
    desc: '歌とおどりのステージで、仲間全員の攻撃力と素早さが大きく上がる。', anim: 'stage',
  },
  dt_tsukin_rush: {
    name: '通勤ラッシュ', kana: 'つうきんらっしゅ', need: [RAIL, OFFICE], mp: [4, 3], target: 'enemies',
    parts: [{ type: 'phys', mult: 1.3 }, { type: 'atbSet', value: 0, msg: '{t}はぎゅうぎゅうで動けない！' }],
    desc: '鉄道員と会社員の、朝の戦い。敵全体をぎゅうぎゅうおしこんで、動きを止める。', anim: 'train',
  },
  dt_hero_interview: {
    name: 'ヒーローインタビュー', kana: 'ひーろーいんたびゅー', need: [BALL, IDOL], mp: [3, 3], target: 'allies',
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 30 }, { type: 'heal', base: [18, 24], thr: 18 }],
    desc: 'ホームランのあとは、アイドルがインタビュー！仲間全員がもり上がって、元気が出る。', anim: 'stage',
  },
  dt_kakushigei: {
    name: 'かくし芸大会', kana: 'かくしげいたいかい', need: [JESTER, PARTY], mp: [3, 4], target: 'enemies',
    parts: [{ type: 'status', status: 'confuse', chance: 0.55, turns: [1, 3] }],
    desc: 'おどろきのかくし芸が大うけ！敵全体が笑いころげて、混乱することがある。', anim: 'laugh',
  },
  dt_jugyo_sankan: {
    name: '授業参観', kana: 'じゅぎょうさんかん', need: [SCHOOL, WORK], mp: [3, 3], target: 'allies',
    parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 30 }, { type: 'heal', base: [20, 26], thr: 18 }],
    desc: '子どもががんばるすがたを、大人がうしろから見守る。みんながはりきって、仲間全員の攻撃力と素早さが上がり、HPも回復する。', anim: 'stage',
  },
};

export const DUAL_ORDER = Object.keys(DUAL_TECHS);

// 組の 説明（例:「炎の呪文」）
export function groupName(list) {
  return DUAL_GROUP_NAMES.get(list) || list.map((id) => ABILITIES[id]?.name).filter(Boolean).slice(0, 3).join('・');
}

// 合体技に 使える 技を 1つ さがす（その 人が 今 使える もの）
// who: { abilities, usable(id) }
function findSkill(who, list) {
  for (const id of list) if (who.abilities.includes(id) && (!who.usable || who.usable(id))) return id;
  return null;
}

// 相手が 合体技に 入れるか（生きていて、ねむり・マヒ・混乱で なく、ゲージが たまっている）
// anyGauge: よやく できるか（ゲージは まだ たまって いなくて よい。ほかの 行動を まっている 仲間とも、つぎの 番で 出す）
export const DUAL_GAUGE = 100;
export function partnerNow(p) {
  return !p?.queued && (!!p?.ready || (p?.atb || 0) >= DUAL_GAUGE);
}
export function partnerFree(p, anyGauge = false) {
  if (!p || !p.alive || p.busy || p.inviting || p.waiting) return false;
  if (p.queued && !anyGauge) return false;
  const st = p.statuses || [];
  if (st.includes('sleep') || st.includes('paralyze') || st.includes('confuse')) return false;
  return anyGauge || partnerNow(p);
}

// actor が 今 出せる 合体技
// actor・others: { id, name, alive, abilities, mp, atb, ready, queued, statuses, weaponCat, usable(id) }
// もどりち: [{ id, partner, partnerName, mine: 0|1, skills: [a, b], mp: [actorの MP, 相手の MP], element }]
export function dualOptions(actor, others, weaponOk, { anyGauge = false } = {}) {
  const out = [];
  if (!actor || !actor.alive) return out;
  const silenced = (x) => (x.statuses || []).includes('silence');
  for (const p of others) {
    if (p.id === actor.id || !partnerFree(p, anyGauge)) continue;
    for (const [id, t] of Object.entries(DUAL_TECHS)) {
      for (const side of [0, 1]) {
        const mine = findSkill(actor, t.need[side]);
        const theirs = mine && findSkill(p, t.need[1 - side]);
        if (!mine || !theirs) continue;
        const mpMine = t.mp[side], mpTheirs = t.mp[1 - side];
        if (actor.mp < mpMine || p.mp < mpTheirs) continue;
        if (t.spell && (silenced(actor) || silenced(p))) continue;
        // 剣が いる 側
        if (t.weapon && weaponOk) {
          const [wSide, cat] = t.weapon;
          const who = wSide === side ? actor : p;
          if (!weaponOk({ weapon: cat }, who.weaponCat)) continue;
        }
        const skills = side === 0 ? [mine, theirs] : [theirs, mine];
        const elFrom = t.parts.find((x) => x.elementFrom !== undefined)?.elementFrom;
        const element = elFrom !== undefined ? ABILITIES[skills[elFrom]]?.effect?.element : t.element;
        out.push({ id, partner: p.id, partnerName: p.name, mine: side, skills, mp: [mpMine, mpTheirs], element, now: partnerNow(p) });
        break;
      }
    }
  }
  return out;
}

// その 合体技の 効果を 知っているか（一度 使うと わかる）
export function dualKnown(char, id) {
  return !!char?.dualSeen?.[id];
}

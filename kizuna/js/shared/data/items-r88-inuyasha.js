// 第88回 G7班: 犬夜しゃの 品（docs/plan-r88-anime-gear.md の 2-5）
//   鉄さいが … 1本が 7だんに 生まれ変わる（さびた刀 → 風のきず → ばくりゅうは → 赤 → 金ごうそうは → 竜りん → 黒い鉄さいが。R88_REBIRTH_INUYASHA）
//   四こんの玉の かけら 5つ（そろい shikon_kakera）＋ 竜りんの 鉄さいが（か 黒い 鉄さいが）→ かじ屋で かけらを きたえると 四こんの玉
//   作品の 字は 使える 字に 直した（犬夜叉 → 犬夜しゃ・鉄砕牙 → 鉄さいが・天生牙 → てんせいが など。設計書の「実装メモ（G7班）」）
//   入れない 品: 霧骨・銀骨・凶骨・赤子・白夜の 品・煉骨の 砲筒（設計書 2-5）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=ff854d15a612';

const I = { work: 'inuyasha' };
const K = { work: 'inuyasha', set: 'shikon_kakera' };

const KAKERA_NUM = ['一', '二', '三', '四', '五'];
export const SHIKON_KAKERA = KAKERA_NUM.map((_, i) => `r88_iy_kakera${i + 1}`);
export const SHIKON = 'r88_iy_shikon';

const GEAR = {
  // ───── 鉄さいが（1本が 生まれ変わる）─────
  r88_iy_sabi: { ...weapon('sword', 'shop'), ...I, name: 'さびついた刀', look: 'katana', desc: 'ぼろぼろにさびついた、古い刀。でも、守りたい人のためにふると……？かじ屋できたえると、何かが目をさますかもしれない。' },
  r88_iy_kazenokizu: { ...weapon('sword', 'mei'), ...I, name: '鉄さいが・風のきず', fx: [{ k: 'el_wind', v: 6 }], bonus: { str: 4 }, look: 'tessaiga', desc: '父のきばから、刀かじがきたえた大きな刀。よう気のぶつかる「風のきず」を切る。ふつうの攻撃が風になる。' },
  r88_iy_bakuryu: { ...weapon('sword', 'mei'), ...I, name: '鉄さいが・ばくりゅうは', fx: [{ k: 'counter', v: 6 }], bonus: { str: 6 }, look: 'tessaiga', desc: '敵のよう気を風のきずでまきこんで、そのまま返す技をおぼえた鉄さいが。ときどきやりかえす。' },
  r88_iy_aka: { ...weapon('sword', 'mei'), ...I, name: '鉄さいが・赤', fx: [{ k: 'crit', v: 6 }], bonus: { str: 6 }, use: { ability: 'r88u_iy_aka' }, look: 'tessaiga', desc: 'けっかいをやぶる、赤くそまった鉄さいが。会心の一撃が出やすい。使うと、敵全体の強くなっていた力を消す。' },
  r88_iy_kongou: { ...weapon('sword', 'mei'), ...I, name: '鉄さいが・金ごうそうは', fx: [{ k: 'chase', v: 6 }], bonus: { str: 8 }, look: 'tessaiga', desc: '金ごう石のやりを、たくさんとばす技をおぼえた鉄さいが。ときどきもう1回攻撃する。' },
  r88_iy_ryurin: { ...weapon('sword', 'den'), ...I, name: '鉄さいが・竜りん', fx: [{ k: 'mana', v: 7 }], bonus: { str: 18, hp: 30 }, look: 'tessaiga', desc: '竜のうろこのように光る鉄さいが。敵のよう気をすいとる。攻撃が当たるとMPが回復する。' },
  r88_iy_kuro: { ...weapon('sword', 'den'), ...I, name: '黒い鉄さいが', fx: [{ k: 'el_dark', v: 8 }], bonus: { str: 20, agi: 8 }, use: { ability: 'r88u_iy_meido' }, look: 'tessaiga', desc: '三日月の形の「めいどう」をひらく技をうけついだ、黒い鉄さいが。ふつうの攻撃が闇になる。使うと、三日月の道が同じ種類の敵みんなをのみこむ。' },
  // ───── せっしょう丸と 父の 刀 ─────
  r88_iy_tenseiga: { ...weapon('sword', 'mei'), ...I, name: 'てんせいが', atk: 40, bonus: { heal: 14, mag: 6 }, use: { ability: 'r88u_iy_tenseiga' }, look: 'holy', desc: 'この世の物は切れない、やさしい刀。攻撃力はひくい。使うと、たおれた仲間1人を生き返らせる。' },
  r88_iy_toukijin: { ...weapon('sword', 'mei'), ...I, name: 'とうきじん', fx: [{ k: 'el_dark', v: 6 }], bonus: { str: 12 }, resist: { confuse: 1.3 }, look: 'scimitar', desc: '大きなようかいのきばから作られた刀。力が上がるが、心がまよいやすく、混乱にかかりやすい。ふつうの攻撃が闇になる。' },
  r88_iy_bakusaiga: { ...weapon('sword', 'den'), ...I, name: '爆さいが', fx: [{ k: 'chase', v: 8 }], bonus: { str: 22, agi: 10 }, look: 'katana', desc: 'せっしょう丸の体から生まれた、自分だけの刀。ときどきもう1回攻撃する。' },
  r88_iy_mokomoko: { ...acc('fu3'), ...I, name: '白いふわふわの毛皮', fx: [{ k: 'hp', v: 4 }], bonus: { hp: 20 }, desc: 'せっしょう丸のかたにかかっている、白いふわふわの毛皮。最大HPが上がる。' },
  r88_iy_sounga: { ...weapon('sword', 'den'), ...I, name: 'そううんが', fx: [{ k: 'el_dark', v: 8 }], bonus: { str: 28 }, resist: { confuse: 1.4 }, look: 'scimitar', desc: '天下をとれるといわれる、父の大きな魔剣。力がとても上がるが、持つ人の心をあやつろうとする。混乱にかかりやすい。ふつうの攻撃が闇になる。' },
  // ───── 犬夜しゃの 仲間の 品 ─────
  r88_iy_hinezumi: { ...armor('cloth', 'mei'), ...I, name: '火ねずみの衣', fx: [{ k: 'res_fire', v: 6 }], bonus: { hp: 20 }, desc: '火ねずみの毛でおった、じょうぶな赤い衣。だれでも装備できる。炎に強い。' },
  r88_iy_nenju: { ...acc('fu3'), ...I, name: '言だまの念じゅ', bonus: { def: 14, agi: -6 }, desc: 'むらのおばあさんがつけた念じゅ。「おすわり！」の言葉で、地面にたたきつけられる。守備力が上がるが、素早さが下がる。' },
  r88_iy_hamayumi: { ...weapon('staff', 'mei'), ...I, name: '破魔の弓', fx: [{ k: 'el_light', v: 6 }], bonus: { mag: 14 }, look: 'wing', desc: 'わるいようかいをはらう、破魔の矢をいる弓。つえと同じあつかい。ふつうの攻撃が光になる。' },
  r88_iy_shikon: { ...acc('den'), ...I, name: '四こんの玉', bonus: { hp: 90, str: 36, mag: 34, agi: 34, def: 20, heal: 20 }, desc: 'ちらばったかけらを集めて、もとにもどした玉。持つ人の力・魔力・素早さを大きく上げる。' },
  r88_iy_shakujo: { ...weapon('staff', 'fu3'), ...I, name: 'ほうしのしゃくじょう', fx: [{ k: 'def', v: 4 }], bonus: { mag: 6 }, look: 'ring', desc: 'ほうしさまの、金のわのついたつえ。守備力が上がる。' },
  r88_iy_juzu: { ...acc('mei'), ...I, name: '風あなをふさぐ数じゅ', bonus: { mag: 10, def: 6 }, use: { ability: 'r88u_iy_kazaana', hpCost: 0.1 }, desc: '右手の「風あな」をふうじている数じゅ。使うと、つけた人のHPを少し使って、風あなで敵みんなをすいこむ（大きな敵にはきかない）。' },
  r88_iy_hiraikotsu: { ...weapon('boomerang', 'mei'), ...I, name: '飛来骨', fx: [{ k: 'chase', v: 6 }], bonus: { str: 4, def: 4 }, look: 'bone', desc: 'ようかいの骨をかためた、大きなブーメラン。たてにもなる。ときどきもう1回攻撃する。' },
  r88_iy_kusarigama: { ...weapon('whip', 'fu3'), ...I, name: '退治屋のくさりがま', fx: [{ k: 'chase', v: 4 }], look: 'chain', desc: 'ようかい退治屋の少年が使う、ようかいの骨のくさりがま。ときどきもう1回攻撃する。' },
  r88_iy_koma: { ...weapon('boomerang', 'fu3'), ...I, name: '七宝のこま', fx: [{ k: 'paralyze', v: 4 }], look: 'star', desc: '子ぎつねが大きくして回す、ふしぎなこま。ときどき敵をマヒさせる。' },
  r88_iy_ningyo: { ...acc('fu3'), ...I, name: '七宝の石の人形', bonus: { agi: 6, mag: 4 }, use: { ability: 'r88u_iy_ningyo' }, desc: '子ぎつねの化けの道具。くっつくと重くて動けなくなる。使うと、敵1体をマヒさせる。' },
  r88_iy_goraishi: { ...weapon('claw', 'mei'), ...I, name: '五雷指', fx: [{ k: 'el_bolt', v: 5 }, { k: 'slay_spirit', v: 4 }], bonus: { agi: 6 }, look: 'katar', desc: 'おおかみのようかいの里にあった、雷のツメ。この世の物でない物も切れる。ふつうの攻撃が雷になり、ゆうれい系の敵に大きなダメージ。' },
  r88_iy_kanazuchi: { ...weapon('bat', 'fu3'), ...I, name: '刀々さいの金づち', fx: [{ k: 'el_fire', v: 4 }], look: 'club', desc: '刀かじのおじいさんの、かたい大きな金づち。地面からよう岩を出す。ふつうの攻撃が炎になる。' },
  // ───── 奈落と 七人隊の 品 ─────
  r88_iy_kagura: { ...weapon('fan', 'mei'), ...I, name: '神楽のおうぎ', fx: [{ k: 'el_wind', v: 6 }], reach: 'group', look: 'feather', desc: '風使いの女の人のおうぎ。風のやいばをまいおどらせる。ふつうの攻撃が風になり、同じ種類の敵みんなにとどく。' },
  r88_iy_kanna: { ...shield('mei'), ...I, name: '神無の鏡', fx: [{ k: 'counter', v: 6 }], look: 'mirror', desc: '白い少女が持つ鏡。うけた攻撃を、そのままはね返す。ときどきやりかえす。' },
  r88_iy_hihi: { ...head('mei'), ...I, name: 'ひひの毛皮', fx: [{ k: 'evade', v: 6 }], desc: '正体をかくすためにかぶる、白いひひの毛皮。敵の攻撃をかわしやすくなる。' },
  r88_iy_koura: { ...armor('heavy', 'mei'), ...I, name: 'めい王じゅうのこうら', fx: [{ k: 'def', v: 6 }], bonus: { hp: 30, agi: -10 }, desc: '雷のツメでやっとつらぬける、とてもかたいこうら。守備力がとても上がるが、素早さが下がる。' },
  r88_iy_banryu: { ...weapon('axe', 'mei'), ...I, name: 'ばん竜', fx: [{ k: 'el_bolt', v: 6 }], bonus: { str: 6 }, use: { ability: 'r88u_iy_ryuraisen' }, look: 'dragon', desc: '七人隊の頭の、大きなほこ。ふつうの攻撃が雷になる。使うと、雷を空にはなって、敵全体に落とす。' },
  r88_iy_jakotsu: { ...weapon('whip', 'fu3'), ...I, name: 'じゃこつ刀', reach: 'group', bonus: { agi: 4 }, look: 'snake', desc: 'たくさんのやいばがつながって、まがりながらのびる刀。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_iy_suikotsu: { ...weapon('claw', 'fu3'), ...I, name: 'すいこつのツメ', fx: [{ k: 'crit', v: 4 }], look: 'claw', desc: '七人隊の大男がつける鉄のツメ。会心の一撃が出やすい。' },
};
// 四こんの玉の かけら（5つ。そろいの 組）
KAKERA_NUM.forEach((n, i) => {
  GEAR[SHIKON_KAKERA[i]] = {
    ...acc('mei'), ...K, name: `四こんの玉のかけら・${n}`, bonus: { str: 10, agi: 10 }, resist: { dark: 1.15 },
    desc: `ちらばった四こんの玉のかけらの${n}つめ。力と素早さが大きく上がるが、闇に弱くなる。5つ集めて、竜りんの鉄さいがを持ってかじ屋できたえると……？`,
  };
});
// さびついた刀は 店の 品（★1。G4班の しくみで ホシフル村の よろず屋に ならぶ）
priceUp(GEAR, { r88_iy_sabi: 80 });

export const ITEMS_R88_INUYASHA = GEAR;

// 生まれ変わり（鉄さいがの 7だん・かけら → 四こんの玉）
//   技を 1つ おぼえる たびに 次の 形（ふつうより 少ない 回数で 生まれ変わる）。竜りんから 黒い 鉄さいがは てんせいがを 持って いる こと（技を うけつぐ）
//   かけらは どれを きたえても よい（5つ 持つ・竜りんの 鉄さいがか 黒い 鉄さいがを 持つ）。きたえた かけらだけ 玉に かわる
const FANG_NEED = [['r88_iy_ryurin', 'r88_iy_kuro']];
export const R88_REBIRTH_INUYASHA = {
  r88_iy_sabi: { to: 'r88_iy_kazenokizu', shop: true, at: 0, gold: 6000, mats: [['star_shard', 5], ['beast_fang', 5]] },
  r88_iy_kazenokizu: { to: 'r88_iy_bakuryu', at: 3, gold: 8000, mats: [['star_shard', 6], ['wind_feather', 5]] },
  r88_iy_bakuryu: { to: 'r88_iy_aka', at: 3, gold: 10000, mats: [['star_shard', 8], ['flame_stone', 3]] },
  r88_iy_aka: { to: 'r88_iy_kongou', at: 4, gold: 12000, mats: [['star_shard', 8], ['iron_shard', 6]] },
  r88_iy_kongou: { to: 'r88_iy_ryurin', gold: 20000, mats: [['star_shard', 10], ['dragon_scale', 5], ['limit_stone', 1]] },
  r88_iy_ryurin: { to: 'r88_iy_kuro', keep: true, gold: 30000, mats: [['star_shard', 12], ['shade_drop', 5], ['limit_stone', 2]], need: { items: ['r88_iy_tenseiga'] } },
  ...Object.fromEntries(SHIKON_KAKERA.map((id) => [id, { to: SHIKON, at: 0, gold: 20000, mats: [['star_shard', 10], ['magic_powder', 5]], need: { items: FANG_NEED, sets: { shikon_kakera: 5 } } }])),
};

export const R88_INUYASHA_KANA = {
  r88_iy_sabi: 'さびついたかたな', r88_iy_kazenokizu: 'てっさいがかぜのきず', r88_iy_bakuryu: 'てっさいがばくりゅうは', r88_iy_aka: 'てっさいがあか',
  r88_iy_kongou: 'てっさいがこんごうそうは', r88_iy_ryurin: 'てっさいがりゅうりん', r88_iy_kuro: 'くろいてっさいが',
  r88_iy_tenseiga: 'てんせいが', r88_iy_toukijin: 'とうきじん', r88_iy_bakusaiga: 'ばくさいが', r88_iy_mokomoko: 'しろいふわふわのけがわ', r88_iy_sounga: 'そううんが',
  r88_iy_hinezumi: 'ひねずみのころも', r88_iy_nenju: 'ことだまのねんじゅ', r88_iy_hamayumi: 'はまのゆみ', r88_iy_shikon: 'しこんのたま',
  r88_iy_shakujo: 'ほうしのしゃくじょう', r88_iy_juzu: 'かざあなをふさぐじゅず', r88_iy_hiraikotsu: 'ひらいこつ', r88_iy_kusarigama: 'たいじやのくさりがま',
  r88_iy_koma: 'しっぽうのこま', r88_iy_ningyo: 'しっぽうのいしのにんぎょう', r88_iy_goraishi: 'ごらいし', r88_iy_kanazuchi: 'とうとうさいのかなづち',
  r88_iy_kagura: 'かぐらのおうぎ', r88_iy_kanna: 'かんなのかがみ', r88_iy_hihi: 'ひひのけがわ', r88_iy_koura: 'めいおうじゅうのこうら',
  r88_iy_banryu: 'ばんりゅう', r88_iy_jakotsu: 'じゃこつとう', r88_iy_suikotsu: 'すいこつのつめ',
  ...Object.fromEntries(SHIKON_KAKERA.map((id, i) => [id, `しこんのたまのかけら${['いち', 'に', 'さん', 'よん', 'ご'][i]}`])),
};

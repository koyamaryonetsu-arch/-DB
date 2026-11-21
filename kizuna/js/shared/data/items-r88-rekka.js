// 第88回 G2班: 烈火の炎の 品（docs/plan-r88-anime-gear.md の 2-4）
//   魔導具は ほとんど「使う」と 技が 出る（1つの 戦いで 1回・MPなし。data/abilities-r88.js）
//   ・鋼金暗器 … 形を かえる 武器（shape: 'kougon'）。1つの 品を 5つの 形の id で 書く（牙 ＝ やり・竜 ＝ ムチ・極 ＝ 短剣・三日月 ＝ ブーメラン・暗 ＝ 弓〈ブーメランと 同じ〉）。
//     装備の 画面の「形をかえる」で、その 職業が 持てる 形だけ えらべる。きたえた 回数・れん金の 効果は のこる（shared/gear-r88.js の shapeTarget・moveShapeFx）
//   ・風のツメ → 風神（生まれ変わり）・雷神は 使うと HPが 少し へる（use.hpCost）
//   ・天堂地獄・砲魔神・縛呪・血種・魂すいのつぼ などは 装備に しない（設計書 2-4）
import { weapon, armor, shield, acc, priceUp } from './items-r88-kit.js?v=93a310251ce7';

const R = { work: 'rekka' };

// 鋼金暗器の 形（ならびは 型の じゅん。はじめの 形は 牙）
export const KOUGON_FORMS = [
  { id: 'r88_kougon_kiba', cat: 'spear', form: '一の型・きば', look: 'halberd', kana: 'こうごんあんききば', text: 'なぎなたの形' },
  { id: 'r88_kougon_ryu', cat: 'whip', form: '二の型・竜', look: 'chain', kana: 'こうごんあんきりゅう', text: 'くさりがまの形' },
  { id: 'r88_kougon_kiwami', cat: 'dagger', form: '三の型・極', look: 'jambiya', kana: 'こうごんあんききわみ', text: '大ばさみの形' },
  { id: 'r88_kougon_mika', cat: 'boomerang', form: '四の型・三日月', look: 'crescent', kana: 'こうごんあんきみかづき', text: '三日月のブーメランの形' },
  { id: 'r88_kougon_an', cat: 'boomerang', form: '五の型・暗', look: 'wing', catName: '弓', kana: 'こうごんあんきあん', text: '弓の形（本当のすがた。ブーメランと同じあつかい）' },
];
const NAME_OF = { r88_kougon_kiba: 'きば', r88_kougon_ryu: '竜', r88_kougon_kiwami: '極', r88_kougon_mika: '三日月', r88_kougon_an: '暗' };

const GEAR = {
  // ───── 火影忍軍の 品 ─────
  r88_kaze_tsume: { ...weapon('claw', 'fu3'), ...R, name: '風のツメ', fx: [{ k: 'el_wind', v: 4 }], use: { ability: 'r88u_kazetsume' }, look: 'claw', desc: '風神に、おにのツメのしんをはめた魔導具。ふつうの攻撃が風になる。きたえぬくと、本当の「風」のしんがもどるという。' },
  r88_fujin: { ...weapon('claw', 'mei'), ...R, set: 'rekka_fujin_raijin', name: '風神', fx: [{ k: 'el_wind', v: 6 }], bonus: { agi: 8 }, use: { ability: 'r88u_fujin' }, look: 'fujin', desc: '風をあやつる、こての形の魔導具。雷神と対になっている。ふつうの攻撃が風になる。' },
  r88_ensui: { ...weapon('sword', 'mei'), ...R, set: 'enzui_hyoma', name: 'えん水', fx: [{ k: 'el_ice', v: 6 }], bonus: { agi: 4 }, use: { ability: 'r88u_ensui' }, look: 'crystal', desc: 'つかだけの剣。水でやいばを作る魔導具。氷魔えんと対になっている。ふつうの攻撃が氷になる。' },
  r88_dosei: { ...acc('fu3'), ...R, name: '土星の輪', bonus: { str: 12, hp: 10 }, desc: '「土」の字の指輪の魔導具。力が上がる。' },
  r88_tetsugan: { ...acc('fu3'), ...R, set: 'sekichu_tetsugan', name: '鉄丸', bonus: { def: 12 }, use: { ability: 'r88u_tetsugan' }, desc: 'のみこむと体が鉄のようになる魔導具。石ちゅうと対になっている。使うと、守備力が大きく上がる。' },
  r88_kuchibashi: { ...weapon('whip', 'fu3'), ...R, name: 'くちばし王', fx: [{ k: 'chase', v: 4 }], use: { ability: 'r88u_kuchibashi' }, look: 'chain', desc: 'くちばしの形の先がついた、くさりがまの魔導具。ときどきもう1回攻撃する。' },
  r88_dokumashin: { ...weapon('claw', 'mei'), ...R, name: '毒魔針', fx: [{ k: 'poison', v: 6 }], look: 'fang', desc: '指先につける、はりの魔導具。ときどき敵を毒にする。' },
  r88_shinryo: { ...weapon('dagger', 'mei'), ...R, set: 'shinryo', name: '神りょしん刀', reach: 'group', bonus: { agi: 4 }, look: 'stiletto', desc: '2本で1組の短刀。持ち主の思いで、やいばがどこまでものびる。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_eikai: { ...acc('mei'), ...R, set: 'eikai_kokai', name: '影界玉', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 8 }, use: { ability: 'r88u_eikai' }, desc: 'かげを通して遠くを見たり、一しゅんで動いたりできる玉。敵の攻撃をかわしやすくなる。使うと、かならずにげられる。' },
  r88_shikigami: { ...weapon('whip', 'fu3'), ...R, name: '式がみ', fx: [{ k: 'paralyze', v: 4 }], use: { ability: 'r88u_shikigami' }, look: 'thorn', desc: 'かみの毛をかたくして、自由にあやつる魔導具。ときどき敵をマヒさせる。' },
  // ───── 麗（うるは）と 十神衆の 品 ─────
  r88_raijin: { ...weapon('claw', 'den'), ...R, set: 'rekka_fujin_raijin', name: '雷神', fx: [{ k: 'el_bolt', v: 8 }], bonus: { str: 16, agi: 10 }, use: { ability: 'r88u_raijin', hpCost: 0.1 }, look: 'dragon', desc: '意思を持つ、こての形の魔導具。いちばんの名工の、さいこうの作品。風神と対になっている。ふつうの攻撃が雷になる。使うと、つけた人のHPを少し使って、大きな雷を落とす。' },
  r88_hyoma: { ...weapon('sword', 'mei'), ...R, set: 'enzui_hyoma', name: '氷魔えん', fx: [{ k: 'el_ice', v: 6 }], bonus: { str: 4 }, use: { ability: 'r88u_hyoma' }, look: 'katana', desc: 'こてと一つになった、話をする刀の魔導具。えん水と対になっている。ふつうの攻撃が氷になる。' },
  r88_taishaku: { ...weapon('spear', 'mei'), ...R, name: 'たいしゃくかい天', fx: [{ k: 'paralyze', v: 5 }], bonus: { str: 4 }, use: { ability: 'r88u_taishaku' }, look: 'trident', desc: '重力をあやつる、三つまたのほこ。敵を重くする。ときどき敵をマヒさせる。' },
  r88_otobide: { ...armor('heavy', 'mei'), ...R, name: '大飛出', fx: [{ k: 'def', v: 6 }], bonus: { hp: 30 }, desc: '人が中に乗る、大きな人形の魔導具。とてもかたい。守備力が上がる。' },
  r88_shirohige: { ...armor('heavy', 'fu3'), ...R, name: '白ひげ', fx: [{ k: 'counter', v: 4 }], desc: '人が中に乗る、白いひげの人形の魔導具。ときどきやりかえす。' },
  r88_gedoku: { ...acc('fu3'), ...R, name: '解毒丸', fx: [{ k: 'guard_poison', v: 4 }], bonus: { hp: 20 }, use: { ability: 'r88u_gedoku' }, desc: '毒魔針の毒を消せる、ただ1つの丸薬。毒にかかりにくい。使うと、自分の毒を治す。' },
  r88_fukyo: { ...armor('cloth', 'mei'), ...R, name: '不きょう和音', fx: [{ k: 'counter', v: 5 }], bonus: { mag: 6 }, use: { ability: 'r88u_fukyo' }, desc: '音をためこむ、むね当ての魔導具。だれでも装備できる。ときどきやりかえす。使うと、ためた音をしょうげきはにする。' },
  r88_jisoto: { ...weapon('dagger', 'mei'), ...R, name: '磁そう刀', fx: [{ k: 'chase', v: 6 }], bonus: { agi: 4 }, look: 'kris', desc: 'S刀とN刀の2本の短刀。じしゃくの力で引きよせる。ときどきもう1回攻撃する。' },
  r88_idaten: { ...acc('fu3'), ...R, name: 'いだ天', bonus: { agi: 16 }, desc: 'くつの形の魔導具。とても速く走れる。素早さが上がる。' },
  r88_yamabiko: { ...shield('fu3'), ...R, name: '矢魔ひこ', fx: [{ k: 'counter', v: 4 }], look: 'round', desc: '音をはねかえす、小さなたての魔導具。ときどきやりかえす。' },
  r88_kotodama: { ...acc('mei'), ...R, name: '言だま', fx: [{ k: 'sleep', v: 5 }], bonus: { mag: 10 }, use: { ability: 'r88u_kotodama' }, desc: 'チョーカーの魔導具。「かつもく」の合図で、まぼろしを見せてねむらせる。ときどき敵をねむらせる。' },
  r88_kodama: { ...weapon('whip', 'mei'), ...R, name: '木だま', fx: [{ k: 'drain', v: 6 }], look: 'thorn', desc: '木の根をそだてて戦う魔導具。あたえたダメージの一部だけHPが回復する。' },
  r88_mugen: { ...weapon('staff', 'mei'), ...R, name: '夢幻のつえ', bonus: { mag: 18 }, use: { ability: 'r88u_mugen' }, look: 'wave', desc: '物をちぢめたり大きくしたりする魔導具。攻撃魔力が上がる。使うと、敵1体をちぢめて力を下げる。' },
  r88_kurage: { ...weapon('boomerang', 'mei'), ...R, name: '海月', fx: [{ k: 'crit', v: 6 }], bonus: { agi: 4 }, look: 'crescent', desc: '大きな三日月のやいばの魔導具。刀にもブーメランにもなる。会心の一撃が出やすい。' },
  r88_oboro: { ...armor('robe', 'fu3'), ...R, name: 'おぼろ', fx: [{ k: 'evade', v: 4 }], use: { ability: 'r88u_oboro' }, desc: '広げるとシーツほどの布の魔導具。かぶるとすがたが消える。敵の攻撃をかわしやすくなる。' },
  r88_nisebi: { ...weapon('claw', 'fu3'), ...R, name: 'にせ火', fx: [{ k: 'el_fire', v: 4 }], look: 'knuckle', desc: '手のこうにつける魔導具。炎術士のように炎が出せる（本物にはかなわない）。ふつうの攻撃が炎になる。' },
  r88_jigen: { ...acc('mei'), ...R, name: '次元界玉', orb: { el: 'dark', v: 6 }, bonus: { mag: 8, str: 6 }, use: { ability: 'r88u_jigen' }, desc: '相手をべつの次元へとばす玉。つけると、武器のふつうの攻撃が闇になる。使うと、敵1体を戦いから外す（大きな敵にはきかない）。' },
  r88_shingan: { ...acc('mei'), ...R, name: '心眼の指輪', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 6 }, desc: '相手の心を読む指輪の魔導具。敵の攻撃をかわしやすくなる。' },
  r88_sekichu: { ...armor('heavy', 'mei'), ...R, set: 'sekichu_tetsugan', name: '石ちゅう', fx: [{ k: 'def', v: 5 }], bonus: { hp: 20 }, desc: '石を体につけて、よろいにする魔導具。鉄丸と対になっている。守備力が上がる。' },
  r88_sekkon: { ...weapon('bat', 'fu3'), ...R, name: '石こん', fx: [{ k: 'slay_material', v: 4 }], use: { ability: 'r88u_sekkon' }, look: 'club', desc: '岩を自由にあやつる、石のこん棒。物質系の敵に大きなダメージ。' },
  r88_oni_tsume: { ...weapon('claw', 'mei'), ...R, name: 'おにのツメ', fx: [{ k: 'crit', v: 6 }], bonus: { str: 4 }, look: 'beast', desc: '鋼金暗器より切れ味がよいという、おにのツメ。会心の一撃が出やすい。' },
  r88_hizanu: { ...weapon('boomerang', 'fu3'), ...R, name: '飛斬羽', fx: [{ k: 'atk', v: 4 }], look: 'wing', desc: '羽の形のやいばをとばす魔導具。攻撃力が上がる。' },
  // ───── 裏武闘殺陣の ほかの チームと、裏麗の 品 ─────
  r88_shikishi: { ...weapon('boomerang', 'fu3'), ...R, name: '式紙', fx: [{ k: 'crit', v: 4 }], look: 'cross', desc: '気をこめてかたくした、紙のやいば。会心の一撃が出やすい。' },
  r88_kokai: { ...acc('den'), ...R, set: 'eikai_kokai', name: '光界玉', orb: { el: 'light', v: 8 }, bonus: { hp: 96, mag: 44, str: 30, def: 30, agi: 28, heal: 26 }, use: { ability: 'r88u_kokai' }, desc: 'ふれた物を光でつつみこむ、さいこうの玉。影界玉と対になっている。つけると、武器のふつうの攻撃が光になる。' },
  r88_shiko: { ...acc('mei'), ...R, name: '神りょ思考', fx: [{ k: 'guard_confuse', v: 6 }], bonus: { mag: 10 }, use: { ability: 'r88u_shiko' }, desc: '相手の心に入って、考えをあやつる魔導具。混乱にかかりにくい。使うと、敵1体を混乱させる。' },
  r88_mongamae: { ...weapon('claw', 'mei'), ...R, name: '門構', fx: [{ k: 'atk', v: 5 }], bonus: { str: 8 }, look: 'fist', desc: '大きなこての魔導具。攻撃力が上がる。' },
  r88_rinne: { ...acc('mei'), ...R, name: '輪ね', bonus: { mag: 10, agi: 4 }, use: { ability: 'r88u_rinne' }, desc: '年れいをあやつる魔導具。使うと、敵1体の年をとらせて、攻撃力と素早さを下げる。' },
};

// 鋼金暗器（伝説・形を かえる）。強さは 形ごとの 武器の 種類の いちばんに 合う（fitR88Legends）
for (const f of KOUGON_FORMS) {
  GEAR[f.id] = {
    ...weapon(f.cat, 'den'), ...R, shape: 'kougon', form: f.form, ...(f.catName ? { formCat: f.catName } : {}), name: `鋼金暗器・${NAME_OF[f.id]}`, fx: [{ k: 'chase', v: 7 }], bonus: { str: 14, agi: 12 }, look: f.look,
    desc: `小金井の、形をかえる魔導具。今は${f.form}（${f.text}）。装備のまどの「形をかえる」で、持てる形にかえられる。まぼろしの六の型「無」は、ばらばらのやいばが敵全体にとどくという。ときどきもう1回攻撃する。`,
  };
}
priceUp(GEAR);
// G5班: ライバルの まぼろしが きまったので、ガチャ・宝の 入れ物に 入れる（G2班の gacha: false を 外した。入らない 品は data/gacha-r88.js の gachaBlock が きめる）

export const ITEMS_R88_REKKA = GEAR;

// 生まれ変わり: 風のツメを 上限まで きたえると、本当の 核が もどって 風神に
export const R88_REBIRTH_REKKA = {
  r88_kaze_tsume: { to: 'r88_fujin', gold: 9000, mats: [['star_shard', 6], ['wind_feather', 5]] },
};

export const R88_REKKA_KANA = {
  r88_kaze_tsume: 'かぜのつめ', r88_fujin: 'ふうじん', r88_ensui: 'えんすい', r88_dosei: 'どせいのわ', r88_tetsugan: 'てつがん',
  r88_kuchibashi: 'くちばしおう', r88_dokumashin: 'どくましん', r88_shinryo: 'しんりょしんとう', r88_eikai: 'えいかいぎょく', r88_shikigami: 'しきがみ',
  r88_raijin: 'らいじん', r88_hyoma: 'ひょうまえん', r88_taishaku: 'たいしゃくかいてん', r88_otobide: 'おおとびで', r88_shirohige: 'しろひげ',
  r88_gedoku: 'げどくがん', r88_fukyo: 'ふきょうわおん', r88_jisoto: 'じそうとう', r88_idaten: 'いだてん', r88_yamabiko: 'やまびこ',
  r88_kotodama: 'ことだま', r88_kodama: 'こだま', r88_mugen: 'むげんのつえ', r88_kurage: 'くらげ', r88_oboro: 'おぼろ',
  r88_nisebi: 'にせび', r88_jigen: 'じげんかいぎょく', r88_shingan: 'しんがんのゆびわ', r88_sekichu: 'せきちゅう', r88_sekkon: 'せっこん',
  r88_oni_tsume: 'おにのつめ', r88_hizanu: 'ひざんう', r88_shikishi: 'しきがみ', r88_kokai: 'こうかいぎょく', r88_shiko: 'しんりょしこう',
  r88_mongamae: 'もんがまえ', r88_rinne: 'りんね',
  ...Object.fromEntries(KOUGON_FORMS.map((f) => [f.id, f.kana])),
};

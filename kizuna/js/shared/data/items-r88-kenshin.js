// 第88回 G11班: るろうに剣心の 品（docs/plan-r88-anime-gear.md の 3-5）
//   作品の 職業（るろうに剣士・人斬りばっ刀さい・ひ村ばっ刀さい・飛天御剣流けい承者）は 剣・短剣・服と 道着（飛天は ローブも）
//   ・主人公の 刀 … 今 ある 逆ば刀（店の 品）→ 1回 きたえると 今 ある 名工の逆ば刀（宝の洞窟の 品）に 生まれ変わる（R88_REBIRTH_KENSHIN）。
//     名工の逆ば刀の 今の 手に入れ方（宝の洞窟）・強さ・限界とっぱは そのまま（lbOk）
//   ・ティンベー ＋ ローチン … 1人が 両方 つけると 反撃（そろい tinbe_rochin）
//   ・今 ある 逆ば刀・名工の逆ば刀 は こわさず、作品の 品として 数える（R88_TAG_KENSHIN。強さ・手に入れ方は かえない）
//   ・入れない 品: アームストロング砲・銃剣（本物の 大砲と 銃）・毒の 隠し武器（設計書 3-5）
//   作品の 字は 使える 字に 直した（刃 → じん・ば／牙 → が／鎖 → くさり／翁 → おきな／倭 → わ／桔梗仙 → ききょうせん など）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=ae365c90037d';

const K = { work: 'kenshin' };
const TR = { work: 'kenshin', set: 'tinbe_rochin' };

const GEAR = {
  // ───── 剣心と 神谷道場の 仲間 ─────
  r88_ks_kimono: { ...armor('gi', 'fu3'), ...K, name: '赤い着物', bonus: { agi: 10 }, fx: [{ k: 'evade', v: 4 }], desc: 'るろうにの剣士がいつも着ている、赤い着物と白いはかま。道場の師はん代が、亡き父の形見をゆずってくれた。素早さが上がる。' },
  r88_ks_shinai: { ...weapon('bat', 'shop'), ...K, name: '神谷道場の竹刀', bonus: { agi: 2 }, look: 'bamboo', desc: '人を生かす剣をおしえる、町の道場の竹刀。けいこの始めの一本。' },
  r88_ks_zanbato: { ...weapon('axe', 'mei'), ...K, name: '斬馬刀', fx: [{ k: 'slay_material', v: 6 }], bonus: { str: 8 }, look: 'battle', desc: '身のたけより長い、大きな刀。切るより、ぶんなぐって使う。オノと同じあつかい。物質系の敵に大きなダメージ。' },
  r88_ks_aku: { ...armor('gi', 'fu3'), ...K, name: '悪一文字の上着', fx: [{ k: 'hp', v: 4 }], bonus: { str: 4 }, desc: 'せなかに大きく「悪」の一文字が入った、白い上着。けんかの強い若者のトレードマーク。最大HPが上がる。' },
  r88_ks_kusuri: { ...acc('fu3'), ...K, name: '女医の薬箱', fx: [{ k: 'regen', v: 4 }], desc: '東北の医者の家に生まれた女医の、薬の箱。けがをした仲間を、いつも手当てしてくれる。行動するたびにHPが少し回復する。' },
  r88_ks_gyunabe: { ...acc('fu3'), ...K, name: '赤べこの牛なべ', bonus: { hp: 40 }, desc: '道場の近くの牛なべ屋「赤べこ」の、あつあつの牛なべ。みんなで食べると元気が出る。最大HPが上がる。' },
  // ───── 御庭番衆 ─────
  r88_ks_kodachi: { ...weapon('dagger', 'mei'), ...K, name: '小太刀二刀', fx: [{ k: 'chase', v: 6 }], bonus: { agi: 6 }, look: 'dirk', desc: '御庭番衆の若い御頭が使う、2本の小太刀。守りと攻めを、一度にこなす。ときどきもう1回攻撃する。' },
  r88_ks_tekkyu: { ...weapon('bat', 'fu3'), ...K, name: 'くさりつき鉄球', reach: 'group', bonus: { str: 6 }, look: 'tekkyu', desc: 'くさりのついた、大きな鉄の玉。ぶんぶん回して投げつける。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_ks_kunai: { ...weapon('boomerang', 'fu3'), ...K, name: '操の苦無', fx: [{ k: 'chase', v: 4 }], look: 'star', desc: '御庭番衆の元気な女の子が、いくつも投げる苦無。ときどきもう1回攻撃する。' },
  r88_ks_tonfa: { ...weapon('bat', 'fu3'), ...K, name: 'おきなのトンファー', fx: [{ k: 'crit', v: 4 }], look: 'club', desc: '御庭番衆の長老が、本気の時だけ取り出す、2本のトンファー。会心の一撃が出やすい。' },
  r88_ks_gatotsu: { ...weapon('sword', 'mei'), ...K, name: 'がとつの刀', fx: [{ k: 'crit', v: 6 }], bonus: { str: 6 }, look: 'katana', desc: '元新選組の剣士の刀。左手1本で、まっすぐにつきさす「がとつ」をくり出す。会心の一撃が出やすい。' },
  // ───── 十本刀と 志々お ─────
  r88_ks_mugen: { ...weapon('sword', 'den'), ...K, name: '無限じん', fx: [{ k: 'el_fire', v: 8 }], bonus: { str: 20, agi: 6 }, use: { ability: 'r88u_ks_guren' }, look: 'flame', desc: 'こまかいギザギザのはをもつ、名工の作の刀。切るたびに火花が出て、刀が燃え上がる。ふつうの攻撃が炎になる。使うと、燃える手で敵1体に大きな炎の一げき。' },
  r88_ks_kikuichi: { ...weapon('sword', 'mei'), ...K, name: 'きく一文字則宗', bonus: { agi: 18, str: 4 }, look: 'katana', desc: 'いつもにこにこしている、十本刀でいちばん速い少年の愛刀。足音も聞こえないほど速く走る。素早さが大きく上がる。' },
  r88_ks_usuba: { ...weapon('whip', 'mei'), ...K, name: 'うすばの太刀', reach: 'group', bonus: { agi: 4 }, look: 'snake', desc: '名工の作の、紙のようにうすく、長くしなる刀。ムチと同じあつかい。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_ks_renjin: { ...weapon('dagger', 'fu3'), ...K, name: '連じん刀', fx: [{ k: 'chase', v: 4 }], look: 'kris', desc: '2本の刀のつかをつないだ、ふしぎな刀。くるくる回して切る。ときどきもう1回攻撃する。' },
  r88_ks_tinbe: { ...shield('mei'), ...TR, name: 'ティンベー', fx: [{ k: 'counter', v: 6 }], look: 'shell', desc: '大きなカメのこうらでできた、まるいたて。ローチンといっしょに使う、南の島の武術の道具。ときどきやりかえす。' },
  r88_ks_rochin: { ...weapon('spear', 'fu3'), ...TR, name: 'ローチン', fx: [{ k: 'crit', v: 4 }], look: 'spear2', desc: 'え先に鉄の玉がついた、みじかいやり。ティンベーといっしょに使う。会心の一撃が出やすい。' },
  r88_ks_kusarigama: { ...weapon('axe', 'mei'), ...K, name: '大くさりがま', reach: 'group', bonus: { str: 6 }, look: 'crescent', desc: 'くさりのついた、とても大きなかま。ぶんと回して、まわりをまとめてなぎはらう。オノと同じあつかい。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_ks_tsubasa: { ...acc('fu3'), ...K, name: '空とぶ大つばさ', bonus: { agi: 14 }, desc: '体をうんと軽くして、せなかにつける大きなつばさ。高い所からとび立つと、空をすべるようにとべる。素早さが上がる。' },
  r88_ks_juzu: { ...acc('fu3'), ...K, name: '二重の極みの数じゅ', bonus: { str: 12 }, desc: '山でしゅぎょうしたおぼうさんの、大きな数じゅ。こぶしを2回打ちこむ、おく義の心をあらわす。力が上がる。' },
  r88_ks_jine: { ...weapon('sword', 'fu3'), ...K, name: 'じんえの刀', fx: [{ k: 'paralyze', v: 4 }], look: 'katana', desc: '目からするどい気を出して、相手を金しばりにする剣士の刀。せなかで刀を持ちかえる、ふしぎな技も使う。ときどき敵をマヒさせる。' },
  // ───── 六人の同志 ─────
  r88_ks_wato: { ...weapon('sword', 'mei'), ...K, name: 'わ刀', fx: [{ k: 'crit', v: 6 }], bonus: { str: 4 }, look: 'broad', desc: '海の向こうの国で、日本の刀をもとに作られた刀。体ごと回るような、ふしぎな剣術で使う。会心の一撃が出やすい。' },
  r88_ks_zankousen: { ...weapon('whip', 'mei'), ...K, name: '斬鋼線', reach: 'group', bonus: { mag: 6 }, look: 'chain', desc: 'からくり人形をあやつる人の、目に見えないほど細い糸。鉄も切ってしまう。ムチと同じあつかい。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_ks_tekkou: { ...shield('fu3'), ...K, name: '無敵鉄こう', fx: [{ k: 'def', v: 4 }], look: 'round', desc: 'うでにつける、とてもかたい鉄のこて。たてのように、どんな物もはじき返す。守備力が上がる。' },
  r88_ks_tsume: { ...weapon('claw', 'fu3'), ...K, name: '無名異の鉄のツメ', fx: [{ k: 'chase', v: 4 }], look: 'claw', desc: '土の中にもぐって戦う人の、長い鉄のツメ。ときどきもう1回攻撃する。' },
  // ───── 比古清十ろう（飛天御剣流 十三代）─────
  r88_ks_mantle: { ...armor('cloth', 'den'), ...K, name: '飛天の白いマント', bonus: { def: 24, hp: 60, agi: -12 }, resist: { dark: 0.85 }, desc: '飛天御剣流の師しょうがはおる、白いマントと重いかたあて。バネの力で、自分の強すぎる力をおさえている。だれでも装備できる。守りが大きく上がるが、素早さが下がる。' },
  r88_ks_fuyutsuki: { ...weapon('sword', 'den'), ...K, name: 'ききょうせん冬月', fx: [{ k: 'crit', v: 8 }], bonus: { str: 20, agi: 10 }, look: 'katana', desc: '飛天御剣流の師しょうの、つばのない白木の刀。逆ば刀より少し長い。どんな大技にもたえる。会心の一撃がとても出やすい。' },
};
priceUp(GEAR, { r88_ks_shinai: 60 });

export const ITEMS_R88_KENSHIN = GEAR;
// 生まれ変わり: 逆ば刀（今 ある 店の 品・★1）→ 名工の逆ば刀（今 ある 宝の洞窟の 品・★3。1回 きたえると）
//   lbOk … 生まれ変わりの 先でも 今の まま 限界とっぱ できる（data/forge.js の REBORN_TO に 入れない）
export const R88_REBIRTH_KENSHIN = {
  sakabatou: { to: 'master_sakabatou', shop: true, at: 0, lbOk: true, gold: 6000, mats: [['star_shard', 5], ['silver_shard', 3]] },
};
// 今 ある 品を 作品の 品として 数える（とびら・ガチャの「持って いる」。強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_KENSHIN = { sakabatou: 'kenshin', master_sakabatou: 'kenshin' };

export const R88_KENSHIN_KANA = {
  r88_ks_kimono: 'あかいきもの', r88_ks_shinai: 'かみやどうじょうのしない', r88_ks_zanbato: 'ざんばとう', r88_ks_aku: 'あくいちもんじのうわぎ',
  r88_ks_kusuri: 'じょいのくすりばこ', r88_ks_gyunabe: 'あかべこのぎゅうなべ', r88_ks_kodachi: 'こだちにとう', r88_ks_tekkyu: 'くさりつきてっきゅう',
  r88_ks_kunai: 'みさおのくない', r88_ks_tonfa: 'おきなのとんふぁー', r88_ks_gatotsu: 'がとつのかたな', r88_ks_mugen: 'むげんじん',
  r88_ks_kikuichi: 'きくいちもんじのりむね', r88_ks_usuba: 'うすばのたち', r88_ks_renjin: 'れんじんとう', r88_ks_tinbe: 'てぃんべー',
  r88_ks_rochin: 'ろーちん', r88_ks_kusarigama: 'おおくさりがま', r88_ks_tsubasa: 'そらとぶおおつばさ', r88_ks_juzu: 'ふたえのきわみのじゅず',
  r88_ks_jine: 'じんえのかたな', r88_ks_wato: 'わとう', r88_ks_zankousen: 'ざんこうせん', r88_ks_tekkou: 'むてきてっこう',
  r88_ks_tsume: 'むみょういのてつのつめ', r88_ks_mantle: 'ひてんのしろいまんと', r88_ks_fuyutsuki: 'ききょうせんふゆつき',
};

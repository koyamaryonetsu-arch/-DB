// ふしぎなかじ の 素材・作れる 装備・きたえた 装備（items.js で まぜる）
//
// 素材（type: 'mat'）… 魔物が 落とす（loot.js）・宝箱・つぼや たるを 調べる と 手に入る。店で 売れる
// 作れる 装備（forge: true）… 店では 売っていない。ふしぎなかじで 素材と ゴールドで 作る（forge.js の RECIPES）
// きたえた 装備 … 'iron_sword+1' 〜。ゲームが 読みこむ ときに ぜんぶ 作っておく（addUpgradeItems）
//   きたえられる 回数は 装備の ランクで きまる（upgradeLimit。ランクが 高いほど たくさん きたえられる）
//   base: もとの 装備の ID / plus: きたえた 回数。みため・エフェクト・読みがなは もとの 装備と おなじ

export const ITEMS_FORGE = {
  // ───── 素材 ─────
  beast_fang: { name: 'けもののキバ', type: 'mat', price: 0, sell: 6, desc: '魔物のするどいキバ。ふしぎなかじの素材になる。' },
  iron_shard: { name: '鉄のかけら', type: 'mat', price: 0, sell: 10, desc: '鉄のかたまりのかけら。武器や防具をきたえるのに使う。' },
  magic_powder: { name: '魔法の粉', type: 'mat', price: 0, sell: 14, desc: 'きらきら光る不思議な粉。つえやローブの素材になる。' },
  wind_feather: { name: '風の羽', type: 'mat', price: 0, sell: 12, desc: '風をまとった鳥の羽。軽い装備の素材になる。' },
  pretty_shell: { name: 'きれいな貝がら', type: 'mat', price: 0, sell: 12, desc: '海辺で拾える、つやつやの貝がら。' },
  silver_shard: { name: '銀のかけら', type: 'mat', price: 0, sell: 30, desc: 'かがやく銀のかけら。強い装備を作るのに使う。' },
  dragon_scale: { name: '竜のうろこ', type: 'mat', price: 0, sell: 50, desc: '海へびが落とす、とてもかたい竜のうろこ。' },

  // ───── ふしぎなかじで 作る 装備（店では 売っていない）─────
  fang_spear: { name: 'キバのやり', type: 'weapon', rank: 2, forge: true, cat: 'spear', atk: 15, bonus: { agi: 1 }, price: 0, sell: 120, desc: 'けもののキバを先に付けた、よくささるやり。' },
  wolf_claw: { name: 'ウルフクロー', type: 'weapon', rank: 2, forge: true, cat: 'claw', atk: 14, bonus: { agi: 3 }, price: 0, sell: 110, desc: 'けもののキバをならべたツメ。軽くて素早くふるえる。' },
  jelly_robe: { name: 'ぷるぷるのローブ', type: 'armor', rank: 2, forge: true, armorType: 'robe', def: 10, bonus: { mag: 3, heal: 3 }, price: 0, sell: 110, desc: 'ぷるりんゼリーで固めた、やわらかいローブ。' },
  fang_charm: { name: 'キバのお守り', type: 'acc', rank: 2, forge: true, bonus: { str: 3, agi: 3 }, price: 0, sell: 120, desc: '力と素早さが少し上がるお守り。' },
  flame_sword: { name: '炎の剣', type: 'weapon', rank: 3, forge: true, cat: 'sword', atk: 25, bonus: { mag: 3 }, price: 0, sell: 420, desc: '魔法の粉をまぜてきたえた、赤くかがやく剣。' },
  feather_hat: { name: '羽のぼうし', type: 'head', rank: 3, forge: true, def: 6, bonus: { agi: 4 }, price: 0, sell: 210, desc: '風の羽をかざったぼうし。だれでも装備できる。' },
  shell_mail: { name: '貝がらのよろい', type: 'armor', rank: 3, forge: true, armorType: 'cloth', def: 15, resist: { ice: 0.8 }, price: 0, sell: 330, upMat: 'pretty_shell', desc: 'きれいな貝がらをならべたよろい。だれでも装備でき、氷に少し強い。' },
  wind_brooch: { name: '風のブローチ', type: 'acc', rank: 3, forge: true, bonus: { agi: 6, mp: 6 }, price: 0, sell: 250, desc: '素早さとMPが上がるブローチ。' },
  thunder_staff: { name: '雷のつえ', type: 'weapon', rank: 4, forge: true, cat: 'staff', atk: 13, bonus: { mag: 16 }, price: 0, sell: 650, desc: '雷の力をとじこめたつえ。攻撃呪文の力が大きく上がる。' },
  dragon_shield: { name: '竜のうろこのたて', type: 'shield', rank: 4, forge: true, def: 19, resist: { fire: 0.8 }, price: 0, sell: 700, upMat: 'dragon_scale', desc: '竜のうろこをはりつけたたて。炎に少し強い。' },
  shell_necklace: { name: '貝がらの首かざり', type: 'acc', rank: 4, forge: true, bonus: { hp: 20, def: 5 }, price: 0, sell: 400, desc: 'きれいな貝がらの首かざり。HPと身の守りが上がる。' },
  storm_sword: { name: '嵐の剣', type: 'weapon', rank: 5, forge: true, cat: 'sword', atk: 41, bonus: { agi: 4 }, price: 0, sell: 2000, desc: '嵐の力を宿した剣。ふると風がうなりを上げる。' },
  dragon_mail: { name: '竜のうろこのよろい', type: 'armor', rank: 5, forge: true, armorType: 'heavy', def: 38, bonus: { agi: -1 }, resist: { fire: 0.8 }, price: 0, sell: 2200, upMat: 'dragon_scale', desc: '竜のうろこをびっしりならべた、とてもかたいよろい。' },
};

// 読みがな（あいうえお順の ならべかえ）
export const FORGE_KANA = {
  beast_fang: 'けもののきば', iron_shard: 'てつのかけら', magic_powder: 'まほうのこな', wind_feather: 'かぜのはね',
  pretty_shell: 'きれいなかいがら', silver_shard: 'ぎんのかけら', dragon_scale: 'りゅうのうろこ',
  fang_spear: 'きばのやり', wolf_claw: 'うるふくろー', jelly_robe: 'ぷるぷるのろーぶ', fang_charm: 'きばのおまもり',
  flame_sword: 'ほのおのけん', feather_hat: 'はねのぼうし', shell_mail: 'かいがらのよろい', wind_brooch: 'かぜのぶろーち',
  thunder_staff: 'かみなりのつえ', dragon_shield: 'りゅうのうろこのたて', shell_necklace: 'かいがらのくびかざり',
  storm_sword: 'あらしのけん', dragon_mail: 'りゅうのうろこのよろい',
};

// ───── きたえる ─────
// きたえられる 回数は 装備の ランクで きまる（ランクが 高い 装備ほど たくさん きたえられる）
//   ランク1（木と皮）+1・ランク2（銅と石）+2・ランク3〜4（鉄・銀）+3・ランク5〜6（はがね・魔法）+4・ランク7〜（プラチナ〜伝説）+5
export const UPGRADE_BY_RANK = [0, 1, 2, 3, 3, 4, 4, 5, 5, 5, 5];
// いちばん 多い 回数（ランク7〜）
export const UPGRADE_MAX = Math.max(...UPGRADE_BY_RANK);
// むかしは どの 装備も +3 まで きたえられた。むかしの セーブの +3 の 装備が きえない ように、+3 までは どの 装備にも 作っておく
const KEEP_MAX = 3;

// その 装備を 何回まで きたえられるか（きたえた 装備は もとの 装備の ランクで）
export function upgradeLimit(it) {
  const rank = Math.max(1, Math.min(UPGRADE_BY_RANK.length - 1, it?.rank || 1));
  return UPGRADE_BY_RANK[rank];
}
// きたえられる 部位（アクセサリーは きたえられない）
export const UPGRADE_TYPES = ['weapon', 'armor', 'shield', 'head'];
// 1回 きたえると ふえる 大事な 強さ（武器は 攻撃力・ほかは 守備力）の わりあい。少なくても 1
export const UPGRADE_STEP = 0.1;

export function upgradeId(baseId, n) {
  return n > 0 ? `${baseId}+${n}` : baseId;
}

// もとの 装備の 売り値（items.js の sellPrice と おなじ 式）
function baseSell(it) {
  if (it.sell !== undefined) return it.sell;
  return Math.floor((it.price || 0) * 3 / 4);
}

// n回 きたえた 装備（base: もとの 装備）
//  ・攻撃力（守備力）… 1回ごとに もとの 1わり（少なくても 1）
//  ・プラスの ボーナス（魔力・素早さ など）… 1回ごとに もとの 1わり（小さい ものは +2 か +3 で ふえる）
//  ・マイナスの ボーナス（重い 装備の 素早さ など）… +3 から 1 だけ 軽くなる
export function upgradedItem(baseId, base, n) {
  const main = base.type === 'weapon' ? 'atk' : 'def';
  const step = Math.max(1, Math.round((base[main] || 0) * UPGRADE_STEP));
  const it = {
    ...base,
    base: baseId,
    plus: n,
    name: `${base.name}+${n}`,
    [main]: (base[main] || 0) + step * n,
    price: 0,
    sell: Math.round(baseSell(base) * (1 + 0.3 * n)),
  };
  if (base.bonus) {
    const b = {};
    for (const [k, v] of Object.entries(base.bonus)) {
      const nv = v > 0 ? v + Math.round(v * UPGRADE_STEP * n) : n >= 3 ? Math.min(0, v + 1) : v;
      if (nv) b[k] = nv;
    }
    if (Object.keys(b).length) it.bonus = b;
    else delete it.bonus;
  }
  if (base.resist) it.resist = { ...base.resist };
  return it;
}

// table（ITEMS）の きたえられる 装備 ぜんぶに +1〜 を 足す（なんど よんでも おなじ）
// ランクで きまる 回数まで（むかしの セーブの ために +3 までは どれにも）
export function addUpgradeItems(table) {
  for (const [id, it] of Object.entries(table)) {
    if (!it || it.base || !UPGRADE_TYPES.includes(it.type)) continue;
    const top = Math.max(KEEP_MAX, upgradeLimit(it));
    for (let n = 1; n <= top; n++) {
      const uid = upgradeId(id, n);
      if (!table[uid]) table[uid] = upgradedItem(id, it, n);
    }
  }
  return table;
}

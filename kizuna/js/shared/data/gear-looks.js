// 第38回 D: 見た目の 武器と 盾の「形」（look）
//   同じ 武器種でも 形が ちがう ように、武器種ごとに いくつかの 形を 用意して、品ごとに どの 形かを きめる
//   （絵は client/render/hero-gear.js と hero-gear-looks.js。色・材質は 今までどおり 品の 名前と ランクで きまる）
//
// 形の きめかた（lookOfWeapon / lookOfShield）
//   1. 品の データの look（ITEMS[id].look）。このファイルの GEAR_LOOK を items.js で 品に つける
//   2. ない 品（店の ふつうの 品・これから ふえる 品）は 名前の ことば（LOOK_WORDS）→ ランク（RANK_LOOK）で 自動
//   3. 料理・そうじの 道具・マイク などの「道具の 形」（TOOL_LOOKS）は その 道具の 絵（hero-gear.js の 道具の 形）
//
// ★4・★5 の 品（items-rare.js の starsFor）は 宝石・光の すじ・きらめき が つく（絵の がわで きめる）
import { starsFor } from './items-rare.js?v=f2f4be342cfa';

// 武器種ごとの 形（ならびは だいたい 弱い 形 → 強い 形）
export const WEAPON_LOOKS = {
  sword: ['wood', 'leaf', 'broad', 'rapier', 'scimitar', 'great', 'flame', 'crystal', 'bolt', 'dragon', 'holy', 'katana'],
  axe: ['stone', 'axe', 'pirate', 'battle', 'crescent', 'hammer', 'pick', 'dragon'],
  dagger: ['knife', 'dirk', 'kunai', 'jambiya', 'stiletto', 'kris', 'star'],
  spear: ['spear', 'spear2', 'coral', 'halberd', 'trident', 'lance', 'winged', 'dragon', 'pennant', 'rod'],
  claw: ['knuckle', 'claw', 'fang', 'beast', 'tiger', 'katar', 'fist', 'dragon'],
  whip: ['whip', 'chain', 'thorn', 'snake', 'scorpion', 'star', 'royal'],
  staff: ['oak', 'wizard', 'healing', 'wave', 'star', 'crystal', 'ring', 'wing', 'dragon', 'ankh', 'broom', 'cane'],
  fan: ['feather', 'fan', 'tessen', 'wing', 'phoenix', 'moon'],
  bat: ['bat', 'bamboo', 'mbat', 'gbat', 'club', 'spiked'],
  boomerang: ['boomer', 'cross', 'crescent', 'star', 'wing', 'bone'],
};
// 道具の 形（武器種に かかわらず、その 道具の 絵）
export const TOOL_LOOKS = ['pen', 'penlight', 'harisen', 'flag', 'kitchen', 'chefknife', 'pan', 'wok', 'ladle', 'whisk', 'mop', 'brush', 'standmic', 'mic',
  'pillow', 'selfie', 'pad', 'bokken', 'monkey', 'keyboard', 'pipewrench', 'darkfeather', 'slipper', 'wand33'];
// 盾の 形（case・plaque は かばん・記念たての 道具の 形）
export const SHIELD_LOOKS = ['round', 'kite', 'heater', 'tower', 'crest', 'dragon', 'light', 'mirror', 'moon', 'shell'];
export const TOOL_SHIELD_LOOKS = ['case', 'plaque'];

// 形の 名前（開発用の 一覧・テストの 見出し）
export const LOOK_NAMES = {
  sword: { wood: '木の剣', leaf: '木の葉の剣', broad: 'ブロードソード', rapier: '細身の剣', scimitar: '三日月刀', great: '大剣', flame: '炎の剣', crystal: '水晶の剣', bolt: 'いなずまの剣', dragon: '竜の剣', holy: '聖剣', katana: '刀' },
  axe: { stone: '石のオノ', axe: 'オノ', pirate: 'ひげのオノ', battle: '両刃のオノ', crescent: '大まさかり', hammer: '大づち', pick: 'つるはし', dragon: '竜のオノ' },
  dagger: { knife: 'ナイフ', dirk: 'ダガー', kunai: 'クナイ', jambiya: 'まがった短剣', stiletto: 'はりの短剣', kris: '波の短剣', star: '星の短剣' },
  spear: { spear: '木の葉のやり', spear2: 'つばさのやり', coral: 'サンゴのやり', halberd: 'ほこやり', trident: '三つまた', lance: '騎士のやり', winged: '羽のやり', dragon: '竜のやり', pennant: '旗のやり', rod: 'ぼう' },
  claw: { knuckle: 'ナックル', claw: 'ツメ', fang: 'キバ', beast: 'けもののツメ', tiger: '長いツメ', katar: 'カタール', fist: '大きなこぶし', dragon: '竜のツメ' },
  whip: { whip: 'ムチ', chain: 'くさり', thorn: 'いばら', snake: 'ヘビ', scorpion: 'サソリ', star: '星のムチ', royal: '王のムチ' },
  staff: { oak: '木のつえ', wizard: '三日月のつえ', healing: '十字のつえ', wave: 'うずのつえ', star: '星のつえ', crystal: '水晶のつえ', ring: 'わのつえ', wing: '羽のつえ', dragon: '竜のつえ', ankh: 'アンク', broom: 'ほうき', cane: 'ステッキ' },
  fan: { feather: '羽のおうぎ', fan: 'おうぎ', tessen: '鉄のおうぎ', wing: 'つばさのおうぎ', phoenix: 'ほのおのおうぎ', moon: 'まるいうちわ' },
  bat: { bat: '木のバット', bamboo: '竹のバット', mbat: '金属バット', gbat: '金のバット', club: 'こんぼう', spiked: 'トゲのこんぼう' },
  boomerang: { boomer: 'くの字', cross: '十字', crescent: '三日月', star: '星', wing: 'つばさ', bone: 'ほね' },
  shield: { round: '丸い盾', kite: 'カイトシールド', heater: 'ヒーターシールド', tower: 'タワーシールド', crest: '紋章の盾', dragon: '竜のうろこの盾', light: '光の盾', mirror: '鏡の盾', moon: '三日月の盾', shell: '貝の盾' },
};

// ───── 品ごとの 形（名前に あう 形。ボスの 品・★4・★5・伝説の 名前の 品 など） ─────
export const GEAR_LOOK = {
  // 剣
  wood_sword: 'wood', bronze_sword: 'leaf', iron_sword: 'broad', stardust_sword: 'crystal', katana: 'katana', chuuni_bokken: 'bokken', nichirin: 'katana',
  sakabatou: 'katana', silver_sword: 'rapier', thunder_sword: 'bolt', flame_sword: 'flame', storm_sword: 'bolt', hayabusa_sword: 'rapier', kira_sword: 'crystal',
  joker_sword: 'scimitar', casino_king_sword: 'great', heaven_dice_sword: 'crystal', frost_blade: 'crystal', obsidian_sword: 'great', meteor_sword: 'crystal',
  shamshir: 'scimitar', crescent_blade: 'scimitar', royal_gold_sword: 'great', platinum_sword: 'rapier', ancient_blade: 'great', scale_sword: 'dragon',
  light_sword: 'holy', tenku_sword: 'holy', hayate_sword: 'rapier', hoshi_sword: 'crystal', mem_lightshadow_sword: 'holy', akatsuki_sword: 'flame',
  et_earth_sword: 'great', et_alch_sword: 'holy', nocto2_night_blade: 'scimitar', solitus_dawn_sword: 'holy', cs_castle_sword: 'flame', cs_alch_sword: 'holy',
  mirage_sword: 'rapier', master_sakabatou: 'katana', winter_katana: 'katana', kagutsuchi: 'flame', majin_scimitar: 'scimitar', old_fang_sword: 'dragon',
  muramasa: 'katana', masamune: 'katana', kusanagi: 'leaf', lake_holy_sword: 'holy', heaven_earth_sword: 'holy', ifrit_sword: 'flame', dragon_slayer: 'great',
  akagane_sword: 'leaf', sun_sword: 'flame', spirit_bokuto: 'wood', world_tree_sword: 'leaf',
  // オノ
  stone_axe: 'stone', iron_axe: 'axe', frying_pan: 'pan', chinese_wok: 'wok', monkey_wrench: 'monkey', gaming_keyboard: 'keyboard', pipe_wrench: 'pipewrench',
  pirate_axe: 'pirate', midas_axe: 'crescent', dragon_axe: 'dragon', hammer_axe: 'hammer', flame_axe: 'crescent', battle_axe: 'battle', cloudcut_axe: 'crescent',
  ryusei_axe: 'battle', daichi_axe: 'hammer', et_keeper_axe: 'battle', gift_captain_axe: 'crescent', cs_mill_axe: 'battle', rock_axe: 'stone',
  kintaro_axe: 'crescent', lava_axe: 'pirate', magma_pan: 'pan', magma_hammer: 'hammer', gold_axe: 'axe', dwarf_pick: 'pick', thunder_hammer: 'hammer',
  goldsilver_axe: 'battle', hephaestus_hammer: 'hammer',
  // 短剣
  bronze_knife: 'knife', poison_knife: 'knife', ballpen: 'pen', kitchen_knife: 'kitchen', chef_knife: 'chefknife', kunai: 'kunai', silver_dagger: 'dirk',
  jambiya: 'jambiya', platinum_dagger: 'dirk', feather_dagger: 'stiletto', stardust_dagger: 'star', mem_shadowsew_dagger: 'kunai', hoshikaze_dagger: 'star',
  cs_blackfire_dagger: 'kris', dream_dagger: 'kris', shinobi_knife: 'kunai', spy_pen: 'pen', shadow_knife: 'kunai', icicle_dagger: 'stiletto',
  traitor_dagger: 'jambiya', needle_sword: 'stiletto', thief_knife: 'jambiya',
  // やり
  bronze_spear: 'spear', iron_spear: 'spear2', coral_spear: 'coral', fang_spear: 'spear', goal_flag_spear: 'pennant', frost_lance: 'lance', sand_lance: 'lance',
  harpoon: 'trident', breeze_spear: 'winged', garuda_spear: 'winged', polaris_spear: 'lance', mem_twilight_spear: 'halberd', hoshimori_spear: 'winged',
  et_heart_spear: 'halberd', cs_tide_spear: 'trident', glacier_spear: 'lance', fire_drake_spear: 'dragon', guardian_halberd: 'halberd', sea_trident: 'trident',
  nyoibo: 'rod', allfather_spear: 'winged', gae_bolg: 'dragon',
  // ツメ
  bronze_knuckle: 'knuckle', iron_claw: 'claw', shark_fang: 'fang', wolf_claw: 'beast', desert_wind_claw: 'katar', fire_claw: 'tiger', tiger_claw: 'tiger',
  platinum_claw: 'katar', night_claw: 'tiger', scale_claw: 'dragon', light_claw: 'katar', griffin_claw: 'beast', starlight_claw: 'katar', mem_moon_claw: 'tiger',
  hayabusa_claw: 'tiger', et_moss_claw: 'beast', cs_weasel_claw: 'katar', polar_claw: 'beast', goldoon_fist: 'fist', kappa_claw: 'beast', fenrir_claw: 'beast',
  rock_king_fist: 'fist', automail_arm: 'fist',
  // ムチ
  leather_whip: 'whip', thorn_whip: 'thorn', flame_whip: 'whip', chain_whip: 'chain', storm_whip: 'whip', golden_whip: 'royal', steel_whip: 'chain',
  snake_whip: 'snake', rainbow_whip: 'star', seiza_whip: 'star', kizuna_whip: 'royal', et_root_whip: 'thorn', cs_ripple_whip: 'royal', bewitch_whip: 'snake',
  explorer_whip: 'whip', kraken_whip: 'scorpion', scorpion_whip: 'scorpion', milkyway_whip: 'star', ocean_whip: 'whip',
  // つえ
  oak_staff: 'oak', wizard_staff: 'wizard', healing_staff: 'healing', penlight: 'penlight', ladle: 'ladle', mop: 'mop', deck_brush: 'brush', center_mic: 'standmic',
  gold_mic: 'mic', selfie_stick: 'selfie', dark_feather_staff: 'darkfeather', mushimegane: 'ring', wave_staff: 'wave', thunder_staff: 'wizard',
  sky_dice_staff: 'wing', lucky_star_staff: 'star', snow_staff: 'crystal', oasis_staff: 'wave', pearl_staff: 'ring', ancient_star_staff: 'star',
  scale_staff: 'dragon', kumo_staff: 'wave', raiun_staff: 'ring', nimbus_broom: 'broom', hoshi_staff: 'star', mem_venus_staff: 'star', hoshi_great_staff: 'wing',
  shiraha_staff: 'wing', et_spring_staff: 'wave', gift_miko_staff: 'ring', cs_candle_staff: 'crystal', cloud_staff: 'wave', detective_cane: 'cane',
  rune_staff: 'crystal', aurora_staff: 'crystal', treant_staff: 'oak', witch_broom: 'broom', ankh_staff: 'ankh', thunder_god_staff: 'dragon',
  forest_sage_staff: 'oak', walpurgis_broom: 'broom', pharaoh_staff: 'ankh', magic_school_staff: 'wizard', merlin_staff: 'star',
  magic_wand: 'wand33', chalk: 'wand33', pointer_stick: 'wand33', elder_wand: 'wand33',
  // おうぎ
  feather_fan: 'feather', dancer_fan: 'fan', harisen: 'harisen', signal_flag: 'flag', whisk: 'whisk', pillow: 'pillow', slipper: 'slipper', sea_fan: 'fan',
  royal_fan: 'tessen', ice_fan: 'tessen', sandwind_fan: 'tessen', ripple_fan: 'fan', sphinx_fan: 'wing', wingbeat_fan: 'wing', vane_fan: 'wing',
  yozora_fan: 'moon', mem_shadow_fan: 'moon', amanoha_fan: 'wing', et_akane_fan: 'phoenix', cs_phoenix_fan: 'phoenix', haze_fan: 'fan', lullaby_fan: 'moon',
  baku_pillow: 'pillow', firebird_fan: 'phoenix', fairy_fan: 'wing', gold_abacus: 'tessen', moon_goddess_fan: 'moon',
  // バット
  wood_bat: 'bat', bamboo_bat: 'bamboo', metal_bat: 'mbat', legend_bat: 'gbat', steel_bat: 'mbat', palm_bat: 'club', anchor_bat: 'spiked',
  thunderhead_bat: 'mbat', tsukiyo_bat: 'mbat', akatsuki_bat: 'gbat', et_pulse_bat: 'club', cs_wave_bat: 'spiked', titan_club: 'spiked', fireball_bat: 'bat',
  yeti_club: 'club', cleanup_bat: 'bat', homerun_king_bat: 'gbat',
  // ブーメラン
  game_controller: 'pad', wood_boomerang: 'boomer', iron_boomerang: 'boomer', silver_boomerang: 'boomer', steel_boomerang: 'boomer', gale_boomerang: 'wing',
  wind_cutter: 'cross', crescent_boomerang: 'crescent', platinum_boomerang: 'cross', light_boomerang: 'star', comet_boomerang: 'star',
  nagaregumo_boomerang: 'crescent', cs_whirl_boomerang: 'cross', icicle_boomerang: 'crescent', whalebone_boomerang: 'bone', shooting_boomerang: 'star',
  whirlwind_boomerang: 'cross', sky_boomerang: 'wing', tiara_boomerang: 'wand33',
  // 盾
  gold_button: 'plaque', leather_shield: 'round', briefcase: 'case', scale_shield: 'kite', iron_shield: 'heater', silver_shield: 'heater', shell_shield: 'shell',
  dragon_shield: 'dragon', pururin_shield: 'round', kira_shield: 'light', roulette_shield: 'round', jackpot_shield: 'crest', rainbow_dice_shield: 'light',
  ice_shield: 'mirror', flame_shield: 'kite', crescent_shield: 'moon', platinum_shield: 'tower', guardian_shield: 'tower', ironwood_shield: 'round',
  light_shield: 'light', atlas_shield: 'tower', star_shield: 'crest', mem_lamp_shield: 'light', akatsuki_shield: 'crest', et_keeper_shield: 'tower',
  cs_flame_shield: 'dragon', cs_mirror_shield: 'mirror', ar_twin_shield: 'moon', rockhill_shield: 'round', haniwa_shield: 'tower', snowqueen_shield: 'mirror',
  flare_shield: 'crest', leviathan_shield: 'dragon', mermaid_shield: 'shell', aegis_shield: 'mirror', yata_mirror: 'mirror', otohime_shield: 'shell',
};

// 品の データに look を つける（items.js の さいごで よぶ。もう look が ある 品は そのまま）
export function applyGearLooks(items) {
  for (const [id, lk] of Object.entries(GEAR_LOOK)) {
    const it = items[id];
    if (it && !it.base && it.look === undefined) it.look = lk;
  }
  return items;
}

// ───── 自動で きめる（look の ない 品） ─────
// 名前の ことば → 形（上から 順に しらべる）
const LOOK_WORDS = {
  sword: [[/木刀|木の剣/, 'wood'], [/刀|まさむね|むらまさ/, 'katana'], [/聖|光|天空|神剣|夜明け|あけぼの/, 'holy'], [/竜|ドラゴン|キバ/, 'dragon'],
    [/炎|火|ほのお|太陽|あかつき|フレイム/, 'flame'], [/氷|水晶|クリスタル|星|つらら|雪|こおり/, 'crystal'], [/雷|いかずち|いなずま|嵐|サンダー/, 'bolt'],
    [/三日月|シャムシール|シミター|曲刀|まがり/, 'scimitar'], [/はやぶさ|ハヤテ|はやて|細|レイピア|まぼろし|風|銀|プラチナ/, 'rapier'],
    [/大剣|古代|大地|王|巨人|タイタン|グレート|黒/, 'great'], [/銅|あかがね|木の葉|草/, 'leaf']],
  axe: [[/つるはし|ピッケル/, 'pick'], [/つち|ハンマー|大づち|かなづち/, 'hammer'], [/竜|ドラゴン/, 'dragon'], [/石|岩/, 'stone'],
    [/まさかり|三日月|大オノ|雲|炎|金/, 'crescent'], [/海賊|ひげ|バイキング/, 'pirate'], [/バトル|両刃|流星|プラチナ|銀/, 'battle']],
  dagger: [[/クナイ|忍|影/, 'kunai'], [/星/, 'star'], [/波|黒|夢|まどわ/, 'kris'], [/はり|ぬい|つらら|羽|レイピア/, 'stiletto'],
    [/ジャンビーヤ|三日月|まがった|とうぞく|うらぎり/, 'jambiya'], [/銀|プラチナ|はがね|ダガー/, 'dirk']],
  spear: [[/ぼう|棒|にょい/, 'rod'], [/旗/, 'pennant'], [/ほこ|トライデント|三つまた|海|ハープーン|水/, 'trident'], [/竜|ドラゴン/, 'dragon'],
    [/羽|風|ガルーダ|つばさ|主神|星守り/, 'winged'], [/ランス|騎士|氷|北極|星/, 'lance'], [/ハルバード|たそがれ|番人/, 'halberd'], [/サンゴ/, 'coral']],
  claw: [[/こぶし|ナックル|うで/, 'fist'], [/竜|ドラゴン/, 'dragon'], [/キバ|サメ/, 'fang'], [/カタール|かまいたち|光|星|プラチナ|砂/, 'katar'],
    [/タイガー|トラ|やみ|月|はやぶさ|炎/, 'tiger'], [/ウルフ|クマ|フェンリル|グリフォン|けもの|こけ|カッパ/, 'beast']],
  whip: [[/くさり|はがね|鉄/, 'chain'], [/いばら|茨|根|つる/, 'thorn'], [/ヘビ|まどわし/, 'snake'], [/サソリ|クラーケン/, 'scorpion'],
    [/星|天の川|にじ|星座/, 'star'], [/黄金|金|王|きずな/, 'royal']],
  staff: [[/ほうき|ニンバス/, 'broom'], [/ステッキ/, 'cane'], [/アンク|ファラオ/, 'ankh'], [/竜|ドラゴン|いかずち/, 'dragon'], [/星|明星/, 'star'],
    [/羽|天空|つばさ/, 'wing'], [/氷|雪|水晶|オーロラ|ともしび|文字/, 'crystal'], [/しんじゅ|雷雲|わ|みこ|めがね/, 'ring'], [/波|雲|いずみ|オアシス/, 'wave'],
    [/いやし|聖|十字/, 'healing'], [/木|森|かし/, 'oak']],
  fan: [[/ほのお|炎|火|不死鳥|あかね/, 'phoenix'], [/月|夜|子もり/, 'moon'], [/羽ばたき|つばさ|ようせい|風見|天の羽|スフィンクス/, 'wing'],
    [/鉄|氷|砂|ロイヤル|黄金/, 'tessen'], [/羽/, 'feather']],
  bat: [[/トゲ|いかり|タイタン|大波/, 'spiked'], [/こんぼう|ヤシ|こどう/, 'club'], [/竹/, 'bamboo'], [/ホームラン|金|あかつき/, 'gbat'], [/金属|はがね|雷|月/, 'mbat']],
  boomerang: [[/骨|ほね/, 'bone'], [/星/, 'star'], [/三日月|雲|つらら/, 'crescent'], [/つむじ|旋風|風きり|プラチナ|十字/, 'cross'], [/天空|はやて|つばさ|羽/, 'wing']],
  shield: [[/貝|人魚|おと姫/, 'shell'], [/鏡|氷|雪|アイギス/, 'mirror'], [/竜|ドラゴン|リヴァイアサン/, 'dragon'], [/光|きらきら|ともしび|にじ/, 'light'],
    [/月/, 'moon'], [/紋章|騎士|星|あかつき|大当たり/, 'crest'], [/番兵|守り|アトラス|タワー|はにわ|プラチナ/, 'tower'], [/皮|木|革|岩|ぷるりん/, 'round']],
};
// ことばで きまらない ときは ランクで（ランク 1, 2, 3, …）
const RANK_LOOK = {
  sword: ['wood', 'leaf', 'broad', 'broad', 'broad', 'rapier', 'great', 'great', 'holy', 'holy'],
  axe: ['stone', 'axe', 'axe', 'pirate', 'battle', 'battle', 'crescent', 'crescent', 'crescent', 'crescent'],
  dagger: ['knife', 'knife', 'knife', 'dirk', 'dirk', 'jambiya', 'dirk', 'kris', 'kris', 'kris'],
  spear: ['spear', 'spear', 'spear2', 'spear2', 'spear2', 'halberd', 'halberd', 'winged', 'winged', 'winged'],
  claw: ['knuckle', 'knuckle', 'claw', 'claw', 'claw', 'tiger', 'tiger', 'katar', 'katar', 'katar'],
  whip: ['whip', 'whip', 'whip', 'chain', 'chain', 'snake', 'whip', 'star', 'royal', 'royal'],
  staff: ['oak', 'oak', 'wizard', 'wizard', 'crystal', 'ring', 'ring', 'star', 'wing', 'wing'],
  fan: ['feather', 'fan', 'fan', 'fan', 'tessen', 'tessen', 'fan', 'wing', 'wing', 'phoenix'],
  bat: ['bat', 'bamboo', 'mbat', 'mbat', 'mbat', 'club', 'mbat', 'gbat', 'gbat', 'gbat'],
  boomerang: ['boomer', 'boomer', 'boomer', 'boomer', 'boomer', 'crescent', 'cross', 'cross', 'wing', 'wing'],
  shield: ['round', 'round', 'heater', 'heater', 'heater', 'kite', 'tower', 'crest', 'crest', 'light'],
};
const rankOf = (it) => Math.max(1, Math.min(10, it?.rank || 2));
function fromWords(kind, name) {
  for (const [re, lk] of LOOK_WORDS[kind] || []) if (re.test(name || '')) return lk;
  return null;
}
// look の ない 品の 形
export function autoLook(it) {
  if (!it) return null;
  const kind = it.type === 'shield' ? 'shield' : it.cat;
  const list = RANK_LOOK[kind] || RANK_LOOK.sword;
  return fromWords(kind, it.name) || list[rankOf(it) - 1];
}
// その 武器種で 使える 形か（道具の 形は どの 武器種でも よい）
export function validWeaponLook(cat, lk) {
  return (WEAPON_LOOKS[cat] || WEAPON_LOOKS.sword).includes(lk) || TOOL_LOOKS.includes(lk);
}
export function validShieldLook(lk) {
  return SHIELD_LOOKS.includes(lk) || TOOL_SHIELD_LOOKS.includes(lk);
}
// 武器の 形（品の look → 自動）。知らない 形の look は 自動に もどす
export function lookOfWeapon(it) {
  if (!it || it.type !== 'weapon') return null;
  const cat = WEAPON_LOOKS[it.cat] ? it.cat : 'sword';
  if (it.look && validWeaponLook(cat, it.look)) return it.look;
  const a = autoLook({ ...it, cat });
  return validWeaponLook(cat, a) ? a : WEAPON_LOOKS[cat][0];
}
export function lookOfShield(it) {
  if (!it || it.type !== 'shield') return null;
  if (it.look && validShieldLook(it.look)) return it.look;
  return autoLook(it) || 'round';
}
// ★の 数（★4・★5 は かざりが つく）
export const ORNATE_STARS = 4;
export const gearStarsOf = (it) => starsFor(it);
export const isOrnate = (it) => starsFor(it) >= ORNATE_STARS;

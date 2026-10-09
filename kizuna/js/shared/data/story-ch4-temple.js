// 第4章 Step 7「砂の底の神殿とモルガナ・エンディング」の だいほん（A: 世界と物語。story-ch4.js で まぜる）
// Step 6 の さいご（サラは ドゥナの さんばしで 待つ）→ さんばしの サラに 話す（砂の下から 砂クジラの 歌。サラが また 仲間に なる。c4_sara2）
// → すなかぜ号で「クジラのねどこ」へ → 砂クジラが 船ごと 砂の 下へ → 神殿の 入口「空気のドーム」（c4_temple）
// → 地下1階「水のかいろう」（赤・青・黄の レバーで 水の 高さ。かべ画「水は、上から下へ。光は、下から上へ」）
// → 地下2階「鏡の間」（鏡の騎士・月の鏡で 光る 本物の 道・鏡の うつし身・いやしの泉）
// → 地下3階「水のろう」（水の 柱に とじこめられた 水のみこミラ・モルガナの 声・ろうの 番人）
// → 最深部「水鏡の広間」（モルガナ → ミラの いのり（わらべ歌を 4つ 聞いていれば「水の守りの歌」）→ モルガナ（真の姿））（c4_morgana）
// → 水の守り星（c4_star）→ 砂クジラが 地上へ おし上げる → ハミルの オアシスに 緑・王都の ふん水 → 王宮（女王ネフィと バルガ・サラと ミラ・サラと ネフィ）
// → 夜の 中庭（アステル「4つの守り星が光った…」・ネフィ「空にうかぶ島」）→ 第4章クリア（c4_clear）
// 戦いの しくみ（水の衣・鏡写し・水のろう・鏡の うろこ・大波・水の守りの歌）と 魔物・きまった 戦いは B（戦い）が 作る
import {
  TEMPLE_LEVERS, WATER_FLAGS, waterLevel, waterFlagsFor, MIRROR_FLAG, KNIGHTS_FLAG, UTSUSHIMI_FLAG, SPRING_FLAG, GUARDS_FLAG,
  MORGANA_FLAG, STAR_FLAG, CLEAR4_FLAG, TEMPLE_FLAG, DOME_POS, B1_POS, B2_POS, B3_POS, HALL_POS,
} from '../maps/temple.js?v=a94c44ae0637';
import { SANDSEA_POS, DUNA_POS, SARA2_FLAG } from '../maps/duna.js?v=a94c44ae0637';
import { SOUTH_PLACES, SAFARA_POS } from '../maps/south.js?v=a94c44ae0637';
import { NPC_SUPPORTS } from './shops.js?v=a94c44ae0637';
import { CH4_GUESTS } from './items-ch4.js?v=a94c44ae0637';
// B（戦い）の データが 入るまでの 仮の 出現表・きまった 戦い（B の ものが 入ったら、この 行と temple-stub.js を 消す）
import './temple-stub.js?v=a94c44ae0637';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const C = (p) => [p.x + 0.5, p.y + 0.5];
const HAM = SOUTH_PLACES.hamil, SAF = SOUTH_PLACES.safara;
const H = (x, y) => [HAM.x + x + 0.5, HAM.y + y + 0.5];
const SF = (x, y) => [SAF.x + x + 0.5, SAF.y + y + 0.5];

// わらべ歌（story-ch4.js の SONG_FLAGS と おなじ。maps/ch4.js）
export const SONG_FLAGS4 = ['c4_song_sun', 'c4_song_sand', 'c4_song_moon', 'c4_song_star'];

// ───── 第4章 Step 7 の すすみかた（story-ch4.js の CH4_STEPS の うしろに つづく）─────
// c4_temple（砂の底の神殿に 入った）・c4_morgana（モルガナを たおした）・c4_star（水の守り星を 取りもどした）・c4_clear（第4章クリア）
export const TEMPLE_STEPS = [TEMPLE_FLAG, MORGANA_FLAG, STAR_FLAG, CLEAR4_FLAG];

// 目標（story-ch4.js の C4_OBJ に まぜる。名前は「その フラグの あとの 目標」）
// sara2・tb2・lit・utsushimi・tb3・guards は 物語の すすみぐあいでは ない フラグ（c4_sara2・c4_tb2_seen・c4_t_mirror…）の あとの 目標
export const TEMPLE_OBJ = {
  sara2: 'すなかぜ号で、砂の海のまん中の「クジラのねどこ」へ行こう。力のもどった砂クジラが待っている',
  temple: '空気のドームの北の神殿へ。地下1階「水のかいろう」の3つのレバーで、水の高さを動かして、下へのかいだんをめざそう',
  tb2: '地下2階「鏡の間」をぬけよう。鏡のゆかは、月の鏡を持って調べると、本物の道が分かるかもしれない',
  lit: '光る本物の道だけを通って、鏡のゆかをわたろう。南のかべの大きな鏡を調べてみよう',
  utsushimi: '鏡のおくの「いやしの泉」で休んで、地下3階へ下りよう',
  tb3: '地下3階「水のろう」のおくへ。水の柱のろうに、だれかがとじこめられている…',
  guards: '最深部「水鏡の広間」で、水鏡の魔人モルガナをたおそう（準備を整えてから）',
  // とちゅうで 終わった ときの 目標（ふつうは そのまま つづけて 見る）
  morgana: '水鏡の上にうかぶ「水の守り星」を、取りもどそう',
  star: '王都サファラの宮殿で、女王ネフィに会おう',
  // 第4章クリア（前の 章の クリアと おなじ 形）
  clear: '第4章クリア！自由に冒険しよう（第5章はアップデートで！）',
};

// パーティー全員で 見る イベント（リーダーの 世界で すすむ）
export const TEMPLE_STORY_SCRIPTS = [
  'c4_sara_after', 'c4_temple_dive', 'c4_whale_talk', 'c4_temple_ship', 'c4_knights_event', 'c4_big_mirror', 'c4_prison_event',
  'c4_morgana_event', 'c4_water_star',
];

// サラは 第4章クリアの あと、ルミナの町の 酒場で 仲間に できる（14-4。shops.js の NPC_SUPPORTS。unlock … c4_clear）
export const SARA_SUPPORT = {
  id: 'npc_sara', name: 'サラ', job: 'pirate', look: CH4_GUESTS.sara.look, tactics: 'aggressive', gear: CH4_GUESTS.sara.gear,
  desc: '砂の海賊のかしらバルガのむすめ。ムチで高い所にもひょいと上る、元気な海賊。', unlock: CLEAR4_FLAG,
};
if (!NPC_SUPPORTS.some((n) => n.id === SARA_SUPPORT.id)) NPC_SUPPORTS.push(SARA_SUPPORT);

// ───────────── さんばしの サラ（再出発）─────────────
function saraRejoin() {
  return [
    ['bgm', null],
    ...S('サラ', '{name}！来てくれたんだね…！'),
    ...S('サラ', '…ねえ、聞こえる？\n砂の下から、歌が聞こえるの。'),
    ['bgm', 'sand_sea'],
    ['sfx', 'wind'],
    ...N('…オオオ……ン……', '砂の海の向こうから、ひくく、やさしい歌声がひびいてくる…。'),
    ...S('サラ', '砂クジラの歌だよ。\n力がもどったって、知らせてくれてるんだ…！'),
    ...S('サラ', '母さんのところへ…砂の底の神殿へ行こう！\nあたしも、最後まで、いっしょに行く！'),
    ['sync'], ['guest', 'sara'], ['sfx', 'join'],
    ...N('サラが仲間に加わった！'),
    ['flag', SARA2_FLAG], ['sync'],
    ...S('サラ', 'すなかぜ号で、砂の海のまん中の「クジラのねどこ」へ！\n父さんたちが、船の準備をしてくれてるよ。'),
    ['bgm', 'resume'],
    ['objective', TEMPLE_OBJ.sara2],
  ];
}

// ───────────── 砂クジラが 船ごと 砂の 下へ（空気の ドーム）─────────────
const toDome = () => [
  ['unflag', SPRING_FLAG],
  ['teleport', 'temple_dome', DOME_POS.arrive.x, DOME_POS.arrive.y, 'down'],
  ['bgm', 'sand_sea'],
];
function templeDive() {
  const [nx, ny] = C(SANDSEA_POS.nest);
  return [
    ['bgm', null],
    ['look', nx, ny],
    ['shake'], ['sfx', 'rumble'],
    ...N('ねどこの砂が、ゆっくりともり上がった…！'),
    ...S('砂クジラ', '待たせたな、紋章の子らよ。…そして、海賊のむすめよ。', '力は、もどった。\nわたしの背に、船をつなげ。神殿へみちびこう。'),
    ...S('サラ', 'うん…！おねがい、砂クジラ！'),
    ['fade', 'out'],
    ['look'],
    ...N('すなかぜ号をせなかに乗せて、砂クジラは、ゆっくりと砂の中へもぐっていく…。', '…ザザザザ……', '砂の音が、だんだん遠くなり――'),
    ...toDome(),
    ['fade', 'in'],
    ...N('気がつくと、そこは大きなあわの中だった…！', '砂の下なのに、空気がある…。\nあわの向こうで、砂がゆっくりと流れている…。'),
    ...S('砂クジラの声', 'ここが、砂の底の神殿の入口「空気のドーム」だ。',
      'この先は、ふしぎな力で、外への道がとざされている。\n糸も、竜の力も、とどかぬだろう。', '地上へもどる時は、船に声をかけよ。わたしが運ぼう。'),
    ...S('サラ', 'あれが…砂の底の神殿…！', 'ドームの西に、あたしたち一族のほこらがあるはず。\nあそこでなら、ゆっくり休めるよ。'),
    ['flag', 'c4_dome_seen'],
    ['flag', TEMPLE_FLAG], ['sync'],
    ['objective', TEMPLE_OBJ.temple],
  ];
}
// 2回目からは すぐに もぐる
const diveAgain = () => [
  ['choice', '砂の底の神殿へもぐる？', ['もぐる', 'やめる'], [
    [['fade', 'out'], ...N('砂クジラは、すなかぜ号を乗せて、砂の底へもぐっていく…。'), ...toDome(), ['fade', 'in']],
    [],
  ]],
];

// ───────────── 地下1階の 水門の レバー ─────────────
const LV_NAME = { hi: '上', mid: '中', lo: '下' };
// レバーを 動かす: レバーの フラグと 水の 高さの フラグ（maps/temple.js の waterFlagsFor）を かえる。
// 立っている マスが 水に なった 人は となりへ よける（toggle）。水の 高さが かわると 出る 魔物も 入れかわる（tableFor）
export async function waterLever(run, color) {
  const fl = run.owner.char.flags;
  const lever = TEMPLE_LEVERS[color];
  const has0 = (f) => !!fl[f];
  const opening = !fl[lever];
  const has1 = (f) => (f === lever ? opening : !!fl[f]);
  const before = waterLevel(has0), after = waterLevel(has1);
  for (const [f, on] of Object.entries(waterFlagsFor(has1))) {
    if (on) fl[f] = true;
    else delete fl[f];
  }
  const level = `（水の高さ：${LV_NAME[after]}）`;
  let text;
  if (color === 'red') {
    text = opening
      ? (after === 'lo' ? 'ゴゴゴゴ…！上の水門が開いた！\n水が、中の水門を通って、いっきに下がっていく…！' : 'ゴゴゴゴ…！上の水門が開いた！\n水が、ゆっくりと下がっていく…！')
      : '上の水門がしまった！\n水が、ごうごうと上がってくる…！';
  } else if (color === 'blue') {
    if (opening) text = after === 'lo' ? 'ゴゴゴゴ…！中の水門が開いた！\n水が、さらに下がっていく…！' : 'ガコン…中の水門が開いた。\nでも、水は動かない…。（上の水門がしまっていると、水は下へ流れないようだ）';
    else text = before === 'lo' ? '中の水門がしまった！\n水が、少し上がってくる…！' : '中の水門がしまった。';
  } else if (opening) {
    text = after === 'lo' ? 'ゴゴゴゴ…！下の水門が開いた！\nかいだんの前の水が、ぐんぐんひいていく…！' : 'ガコン…下の水門が開いた。\nでも、下の水門まで、まだ水がとどいていない…。';
  } else text = after === 'lo' ? '下の水門がしまった。\nかいだんの前に、また水がたまっていく…。' : '下の水門がしまった。';
  await run.runSteps([
    ...N('レバーを動かした！'),
    ['sfx', 'door'], ['toggle', lever], ['sfx', before === after ? 'click' : 'rumble'],
    ...(before === after ? [] : [['shake']]),
    ['sync'],
    ...N(`${text}\n${level}`),
  ]);
  // 水の 高さで 出る 魔物が かわる（下 ⇔ それ いがい）。いま うろうろ している 魔物は いったん いなくなる
  if ((before === 'lo') !== (after === 'lo')) {
    const ms = run.world.mapStates?.get('temple_b1');
    if (ms) for (const [id, sym] of ms.symbols) if (!sym.busy) ms.symbols.delete(id);
  }
}
const leverScript = (color) => () => [['call', (run) => waterLever(run, color)]];

// ───────────── モルガナ（水鏡の広間）─────────────
// ミラの いのり: わらべ歌を 4つとも 聞いていれば「水の守りの歌」（戦いの 中の 効きめは B。ここは ことばだけ）。
// 戦いに 入る 家族の だれかが 4つ 持っていれば（B の きまりと おなじ）
export function songPrayer(run) {
  const chars = [run.owner?.char, ...run.everyone.map((m) => m.char)].filter(Boolean);
  return chars.some((c) => SONG_FLAGS4.every((f) => c.flags?.[f]));
}
export const PRAYER_SONG = [
  ...N('そのとき――上の階から、やさしい歌声がひびいてきた…！'),
  ...S('ミラの声', '♪お日さまのぼって、砂がまう…\nお月さまがねむったら、お星さまがひかるよ…'),
  ...S('サラ', 'この歌…町の子どもたちの、わらべ歌…！\n母さんが、教えてくれた歌だ…！'),
  ...S('ミラの声', 'これは、砂の国に伝わる「水の守りの歌」…。\nみなさん、どうか、わたしの歌といっしょに…！'),
  ['sfx', 'heal'], ['flash'], ['heal'],
  ...N('ミラの「水の守りの歌」が、神殿じゅうにひびきわたった！', 'みんなのHPとMPが、すっかり回復した！\n水の守りの力が、みんなの体をつつみこんでいる…！'),
];
export const PRAYER_PLAIN = [
  ...N('そのとき――上の階から、いのりの声がひびいてきた…！'),
  ...S('ミラの声', 'サラ…紋章の子らよ…。\n水の守り星よ、どうか、この子たちに力を…！'),
  ['sfx', 'heal'], ['flash'], ['heal'],
  ...N('ミラのいのりが、みんなをつつみこんだ…！', 'みんなのHPとMPが、すっかり回復した！'),
];
// モルガナの さいごの ことば（第5章の「えらばれなかった 紋章の子」を においわせる。17 で 決めた 文）
export const MORGANA_LAST = ['…四ツ影は、もう1人だけ。\nでも、最後の1人は、わたくしたちとは、ちがう…。', 'あの子は、あなたたちと同じ…紋章を…'];

function morganaEvent() {
  const [mx, my] = C(HALL_POS.morgana);
  const [vx, vy] = [HALL_POS.mirror.x + HALL_POS.mirror.w / 2, HALL_POS.mirror.y + HALL_POS.mirror.h / 2];
  return [
    ['bgm', null],
    ['look', vx, vy],
    ...N('広間いっぱいに、大きな水鏡が広がっている…。', '水面に、何かがうつっている…。\n遠い空に…島が、うかんでいる…？'),
    ...S('サラ', 'なに、あれ…。空にうかぶ、島…？'),
    ['look', mx, my],
    ...S('水鏡の魔人モルガナ', 'ようこそ、紋章の子ら。…それに、海賊のむすめ。', 'わたくしは四ツ影の1人、水鏡の魔人モルガナ。'),
    ...S('水鏡の魔人モルガナ', 'ストルムもイグニアも、力だけの者。\nわたくしは、ちがいますわ。'),
    ...S('水鏡の魔人モルガナ', 'この国の水と、水の守り星の力で、\n世界のすべてをうつす、大きな水鏡を作っているの。',
      'この鏡が、すべてをうつしたとき…\n「あのお方」を、よびもどせる。'),
    ...S('サラ', '母さんを…水のみこのミラを、返して！'),
    ...S('水鏡の魔人モルガナ', 'あのみこなら、上のろうで、いのっているわ。\n水の守り星を、守ろうとしてね…。', 'あなたたちも、水鏡の中で、しずかにねむりなさい。'),
    ['showMon', 'morgana'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'morgana'],
    ['battle', 'morgana'],
    // ── 真の すがた（あいだに ミラの いのり。HPも MPも ぜんぶ。たおれた 仲間も 起きる）──
    ['bgm', null],
    ['look', mx, my],
    ...S('水鏡の魔人モルガナ', 'まあ…やりますわね。', 'でも、水鏡の中の、本当のわたくしを見ても、\n同じことが言えて？'),
    ['sfx', 'rumble'], ['shake'], ['flash'],
    ['hideNpc', 'morgana_npc'],
    ...N('モルガナの体が、水鏡の中へとけていく――', '水鏡が大きくもり上がり、\n鏡のうろこをもつ、大きな水の竜があらわれた！'),
    ['showMon', 'morgana_true'],
    ...S('モルガナ', 'さあ、水の底へ、しずみなさい！'),
    ['showMon', null],
    ['call', (run) => run.runSteps(songPrayer(run) ? PRAYER_SONG : PRAYER_PLAIN)],
    ['look'],
    ['bgm', 'morgana'],
    ['battle', 'morgana_true'],
    ...morganaAfter(),
  ];
}

function morganaAfter() {
  const [vx, vy] = [HALL_POS.mirror.x + HALL_POS.mirror.w / 2, HALL_POS.mirror.y + HALL_POS.mirror.h / 2];
  return [
    ['bgm', null],
    ['look', vx, vy],
    ...S('モルガナ', 'そんな…わたくしの、水鏡が…。'),
    ...S('モルガナ', ...MORGANA_LAST),
    ['sfx', 'dark'], ['flash'],
    ...N('言いかけたまま、モルガナの体は、水になって――', 'ぱしゃり、と、くずれて消えていった…。'),
    ['flag', MORGANA_FLAG], ['sync'],
    ...starScene(),
  ];
}

// 水の守り星 → 神殿が ゆれる → ミラ → 砂クジラが 地上へ おし上げる → ハミル・王都（とちゅうで 終わった ときは、広間の 守り星から）
function starScene() {
  const [sx, sy] = C(HALL_POS.star);
  const [ux, uy] = C(HALL_POS.up);
  return [
    ['bgm', null],
    ['look', sx, sy - 2],
    ['sfx', 'sparkle'], ['flash'],
    ...N('水鏡のまん中が、青く光り始めた…！', '光の中から、すきとおった星が、ゆっくりとうかび上がる――'),
    ...S('サラ', '水の守り星…！'),
    ['item', 'water_star'],
    ['flag', STAR_FLAG], ['sync'],
    ['look'],
    ['sfx', 'rumble'], ['shake'],
    ...N('ゴゴゴゴゴ…！', '神殿が、大きくゆれ始めた！\nためこまれていた水が、いっせいに動き出した…！'),
    ['guestHide', true],
    ['actor', 'sara_c', { sprite: 'sara', x: sx - 1, y: sy + 4, dir: 'down' }],
    ['actor', 'mira_c', { sprite: 'mira', x: ux, y: uy - 0.5, dir: 'up' }],
    ...S('水のみこミラ', 'サラ！'),
    ['face', 'sara_c', 'down'],
    ['move', 'mira_c', [[sx - 1, sy + 6]]],
    ...S('サラ', '母さん…！！'),
    ['move', 'sara_c', [[sx - 1, sy + 5]]],
    ...N('ろうからとき放たれたミラが、サラをぎゅっとだきしめた…。'),
    ...S('水のみこミラ', 'モルガナの力が消えて、水のろうがとけたの。\n…サラ、ありがとう。紋章の子らよ、ありがとう…！'),
    ['shake'], ['sfx', 'rumble'],
    ...S('砂クジラの声', '紋章の子らよ、わたしの背に乗れ！\n水といっしょに、みんなを地上へおし上げるぞ！'),
    ['fade', 'out'],
    ['remove', 'sara_c'], ['remove', 'mira_c'], ['guestHide', false],
    ['bgm', 'sand_sea'],
    ...N('――砂クジラは、神殿にためこまれていた水といっしょに、\nみんなを地上へとおし上げた！', '砂の海のあちこちで、水がふき出していく…！'),
    ...townScene(),
    ...palaceScene(),
  ];
}

// 水が もどった 町（ハミルの オアシス・王都の ふん水）
function townScene() {
  const [ox, oy] = H(14, 13);
  const [fx, fy] = C(SAFARA_POS.fountain);
  return [
    ['teleport', 'south', ...H(14, 17), 'up'],
    ['bgm', 'oasis'], ['fade', 'in'],
    ['look', ox, oy],
    ['sfx', 'heal'],
    ...N('オアシスの村ハミル――', 'オアシスに、きれいな水がこんこんとわき出し…\n村じゅうに、緑がもどっていく！'),
    ['look'],
    ['fade', 'out'],
    ['teleport', 'south', ...SF(25, 21), 'up'],
    ['bgm', 'safara'], ['fade', 'in'],
    ['look', fx, fy],
    ['sfx', 'sparkle'],
    ...N('王都サファラ――', '宮殿の前のかれたふん水から、水が高く、高くふき上がった！'),
    ...S('町の人の声', '水だ…！水がもどってきたぞー！'),
    ['look'],
  ];
}

// 王宮: 女王ネフィと バルガが 手を 取り合う・サラと ミラ・サラと ネフィの 再会（とちゅうで 終わった ときは、女王に 話しかけると ここから）
function palaceScene() {
  const [qx, qy] = C(SAFARA_POS.throne);
  const [px, py] = SF(25, 28);
  return [
    ['fade', 'out'],
    ['teleport', 'south', px, py, 'up'],
    ['hideNpc', 'nefi'], ['hideNpc', 'nefi_night'], ['guestHide', true],
    ['actor', 'nefi_c', { sprite: 'nefi', x: qx, y: qy, dir: 'down' }],
    ['actor', 'barga_c', { sprite: 'barga', x: qx - 2, y: qy + 2, dir: 'right' }],
    ['actor', 'sara_c', { sprite: 'sara', x: qx + 2, y: qy + 2, dir: 'left' }],
    ['actor', 'mira_c', { sprite: 'mira', x: qx + 3, y: qy + 2, dir: 'left' }],
    ['bgm', 'ending4'],
    ['fade', 'in'],
    ...N('王都サファラの宮殿――'),
    ...S('女王ネフィ', '{name}さん…みなさん…！\n王国じゅうに、水がもどってきました！'),
    ...S('女王ネフィ', '砂の海賊のかしら、バルガさん。', '…王国は、あなたたちに、ひどいことをしてしまいました。\n本当に…ごめんなさい。'),
    ...S('かしらバルガ', '……。', '顔を上げてくれ、女王さん。\nあんたも、あやつられていただけだ。'),
    ['move', 'barga_c', [[qx - 1, qy + 1]]],
    ...S('かしらバルガ', 'おれたちは、昔から水の守り星を守ってきた一族だ。\n…これからは、王国といっしょに守ってやるさ。', '砂の海賊は、今日から王国の水の守り手だ！'),
    ['sfx', 'sparkle'],
    ...N('女王ネフィとバルガは、かたく手を取り合った…！'),
    ...S('女王ネフィ', 'ありがとう…バルガさん。'),
    ['move', 'sara_c', [[qx + 1, qy + 1]]],
    ...S('サラ', 'ネフィ…！'),
    ...S('女王ネフィ', 'サラ…！', 'ごめんなさい…。わたし、サラにも、ひどいことを…。'),
    ...S('サラ', 'ううん。ネフィがあんなこと言うはずないって、\nあたし、ずっと信じてたもん。', '…また、いっしょに遊ぼうね！'),
    ...S('女王ネフィ', '…うん！'),
    ['face', 'sara_c', 'right'],
    ...S('水のみこミラ', 'サラ…大きくなったわね。\nひとりで、よくがんばったわね。'),
    ...S('サラ', '母さん…。あたし、ひとりじゃなかったよ。\nこの人たちが、ずっといっしょにいてくれたんだ！'),
    ...S('水のみこミラ', '紋章の子らよ。本当に、ありがとう。', '水の守り星は、わたしが、王都の水の神殿へおもどしします。'),
    ...N('（水の守り星を、ミラにわたした…）'),
    ['takeItem', 'water_star'],
    ...S('水のみこミラ', 'これで、砂の国の水は、もうだいじょうぶ…。'),
    ...balconyScene(),
  ];
}

// 夜の 中庭（バルコニー）: アステル「4つの守り星が光った…」・ネフィ「空にうかぶ島」→ 第4章クリア
function balconyScene() {
  const [cx, cy] = SF(25, 32);
  return [
    ['fade', 'out'],
    ['remove', 'nefi_c'], ['remove', 'barga_c'], ['remove', 'sara_c'], ['remove', 'mira_c'],
    ['night', true],
    ['teleport', 'south', ...SF(25, 36), 'up'],
    ['actor', 'nefi_c', { sprite: 'nefi', x: cx - 2, y: cy + 3, dir: 'up' }],
    ['actor', 'sara_c', { sprite: 'sara', x: cx + 2, y: cy + 3, dir: 'up' }],
    ['bgm', 'ending4'],
    ['fade', 'in'],
    ...N('その夜――。', '宮殿の中庭のバルコニーで、みんなは星空を見上げていた…。'),
    ['look', cx, cy - 2],
    ['actor', 'astel_c', { sprite: 'sky_dragon', x: cx, y: cy - 18, dir: 'down' }],
    ['move', 'astel_c', [[cx, cy - 3]]],
    ...S('星の竜アステル', '紋章の子らよ。よくぞ、水の守り星を取りもどしてくれた。'),
    ...S('星の竜アステル', '4つの守り星が光った。', '…残るは、大地の守り星。そして、最後の影。'),
    ...S('女王ネフィ', '大地の守り星…。', '王家の古い書物に、「大地の守り星は、空にうかぶ島にある」と…\n書いてありました。'),
    ...S('サラ', '空にうかぶ島…！\nあの水鏡にうつっていた島だ…！'),
    ...S('星の竜アステル', '空の島か…。そこへは、わたしの背でしか行けぬだろう。', '…その時が来たら、風の笛でわたしを呼ぶがよい。'),
    ['move', 'astel_c', [[cx, cy - 20]]],
    ['remove', 'astel_c'],
    ['look'],
    ['flag', CLEAR4_FLAG], ['sync'],
    ['gold', 4000],
    ['item', 'star_shard', 5],
    ...S('サラ', 'あたし、これからは父さんと、王国の水を守るよ。\nでも…{name}たちの旅にも、また、ついて行きたいな！',
      'ルミナの町の酒場、だっけ？\n声をかけてくれたら、いつでもかけつけるからね！'),
    ['sync'], ['unguest', 'sara'],
    ['remove', 'nefi_c'], ['remove', 'sara_c'],
    ['hideNpc', 'nefi', false], ['hideNpc', 'nefi_night', false], ['guestHide', false],
    ['night'],
    ['chapter', '第4章「砂の海にしずむ星」', 'クリア！'],
    ...N('――次の冒険は第5章――'),
    ...N('（サラは、ルミナの町の酒場で、仲間にできるようになった！\n砂の港ドゥナに、ランク7の武器と防具の店が開いた！）',
      '（砂嵐がすっかりはれて、竜でコガネ地方のどこへでも飛べるようになった！）'),
    ['bgm', 'resume'],
    ['objective', TEMPLE_OBJ.clear],
  ];
}

// ───────────── だいほん ─────────────
export const TEMPLE_SCRIPTS = {
  // さんばしの サラ（Step 6 の さいごから。夜でも 昼でも）
  c4_sara_after: (x) => (x.flag(SARA2_FLAG) ? S('サラ', '母さん…待っててね。\nきっと、助けに行くから！') : saraRejoin()),
  // ねどこに 近づいた（サラと いっしょ）・ねどこの 砂クジラ
  c4_temple_dive: (x) => (x.flag(TEMPLE_FLAG) ? [] : templeDive()),
  c4_whale_talk: (x) => {
    if (x.flag(TEMPLE_FLAG)) return [...S('砂クジラ', 'また、神殿へ行くのか？'), ...diveAgain()];
    if (x.flag(SARA2_FLAG)) return templeDive();
    return S('砂クジラ', '砂の底の神殿の入口は、この下だ…。', 'わたしの力がもどるまで、もう少し待ってくれ。\nその時は、そなたたちを神殿へみちびこう。');
  },

  // ───── 空気の ドーム ─────
  c4_dome_enter: () => [...N('砂の下の、大きなあわの中だ…。'), ['flag', 'c4_dome_seen']],
  c4_temple_ship: () => [
    ...N('すなかぜ号だ。', '砂クジラが、ドームのそとで待っている…。'),
    ['choice', '地上へもどる？', ['もどる', 'やめる'], [
      [['fade', 'out'], ...N('砂クジラが、すなかぜ号を地上へ運んでいく…。'),
        ['teleport', 'sand_sea', SANDSEA_POS.nest.x + 0.5, SANDSEA_POS.nest.y - 3.5, 'up'], ['bgm', 'sand_sea'], ['fade', 'in']],
      [],
    ]],
  ],
  // 砂の海賊の 一族の ほこら（回復と 記録が 何度でも）
  c4_dome_shrine: (x) => [
    ...N('砂の海賊の一族のほこらだ。', '小さなさいだんの上で、青い火が、しずかにゆれている…。'),
    ['if', (y) => !y.flag('c4_shrine_seen'), [
      ...S('サラ', 'ここは、あたしたち一族のほこら。\nむかしから、神殿を守る海賊が、ここで体を休めてきたんだって。'),
      ['flag', 'c4_shrine_seen'],
    ], []],
    ['choice', 'ほこらでいのる？', ['いのる', 'やめる'], [
      [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'],
        ...N('青い火が、ふわりと大きくなった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
      [],
    ]],
  ],
  // かべ画（水の 高さの なぞの ヒント）
  c4_dome_mural: (x) => [
    ...N('古いかべ画だ。', '水の流れと、光のすじが、ていねいにえがかれている。'),
    ...N('かべ画の下に、文字がきざまれている。\n「水は、上から下へ。光は、下から上へ」'),
    ...(x.flag('c4_mural_seen') ? [] : S('サラ', '砂の海賊に伝わる、古いことばだよ。\n神殿のしかけのヒントなのかも…！')),
    ['flag', 'c4_mural_seen'],
  ],

  // ───── 地下1階「水のかいろう」─────
  c4_tb1_enter: () => [
    ['bgm', 'sand_temple'],
    ...N('ザアアア…。', '神殿の中は、水でいっぱいだ…！\n国じゅうから集められた水が、ごうごうと流れこんでいる…。'),
    ...S('サラ', 'すごい水…！これ、全部、砂の国の水なんだ…。', '…見て、あそこに赤いレバーがある。\n水門を動かすのかな？'),
    ['flag', 'c4_tb1_seen'],
  ],
  // 神殿に 入りなおした（ドームから 地下1階へ）: いやしの泉の 力が もどる
  c4_spring_reset: () => [['unflag', SPRING_FLAG]],
  c4_tl_red: leverScript('red'),
  c4_tl_blue: leverScript('blue'),
  c4_tl_yellow: leverScript('yellow'),

  // ───── 地下2階「鏡の間」─────
  c4_tb2_enter: () => [
    ['bgm', 'sand_temple'],
    ...N('かべもゆかも、鏡のようにきらきらと光っている…。'),
    ...S('サラ', 'あたしたちのすがたが、あっちこっちにうつってる…。\nなんだか、見られてるみたい…。'),
    ['flag', 'c4_tb2_seen'],
    ['objective', TEMPLE_OBJ.tb2],
  ],
  // 鏡の間の 番人（鏡の騎士 2体）
  c4_knights_event: (x) => (x.flag(KNIGHTS_FLAG) ? [] : [
    ['bgm', null],
    ...N('ガシャン…ガシャン…！', '鏡のようにかがやくよろいの騎士が、道をふさいだ！'),
    ...S('鏡の騎士', 'ココハ…鏡ノ間…。', 'モルガナサマノ…ジャマヲ…スル者ハ…トオサヌ…！'),
    ['battle', 'mirror_knights'],
    ['bgm', null],
    ...N('鏡の騎士は、こなごなにくだけちった…！'),
    ['flag', KNIGHTS_FLAG], ['sync'],
    ...S('サラ', 'あの騎士たち、体が光ると、呪文をはね返すみたい…。\nまた出てきたら、よく見て戦おうね！'),
    ['bgm', 'resume'],
  ]),
  // 鏡の ゆかを 調べる（月の鏡で 本物の 道が 光る。光は、下から上へ）
  c4_mirror_floor: (x) => {
    if (x.flag(MIRROR_FLAG)) return N('光る道が、鏡のゆかの中にうかんでいる。');
    if (!x.has('moon_mirror')) return N('鏡のようなゆかだ。', 'どこまでが本物のゆかで、どこからが鏡なのか…\n見ただけでは、分からない…。');
    return [
      ...N('鏡のようなゆかだ。\nどこが本物の道なのか、見ただけでは分からない…。', '{name}は、月の鏡を取り出した…。'),
      ['sfx', 'sparkle'], ['flash'],
      ...N('月の鏡が、青白く光った――', 'ゆかの下から、光がわき上がってくる…！'),
      ['flag', MIRROR_FLAG], ['sync'],
      ...N('鏡のゆかの中に、光る道がうかび上がった！\n（光っている所だけが、本物の道だ）'),
      ...S('サラ', '光は、下から上へ…。\nかべ画のことばは、このことだったんだ！'),
      ['objective', TEMPLE_OBJ.lit],
    ];
  },
  // にせの 鏡の ゆか（すいこまれて、鏡の ゆかの 手前へ もどされる）
  c4_mirror_trap: (x) => [
    ['sfx', 'dark'], ['flash'],
    ...N('ぐにゃり…！', '足もとの鏡に、体がすいこまれた…！'),
    ['fade', 'out'],
    ['teleport', 'temple_b2', B2_POS.start.x + 0.5, B2_POS.start.y + 0.5, 'down'],
    ['fade', 'in'],
    ...N('…気がつくと、鏡のゆかの手前にもどされていた。',
      x.flag(MIRROR_FLAG) ? '（光っている道だけを、通っていこう）' : '（にせものの道だったようだ…。\n本物の道を見分ける方法は、ないだろうか）'),
  ],
  // 大きな 鏡（鏡の うつし身。パーティーそっくり）
  c4_big_mirror: (x) => {
    if (x.flag(UTSUSHIMI_FLAG)) return N('くだけた大きな鏡のあとだ。', 'おくへ、道がつづいている。');
    return [
      ['bgm', null],
      ...N('大きな鏡だ。', 'みんなのすがたが、くっきりとうつっている…。'),
      ['shake'], ['sfx', 'dark'],
      ...N('…！？', '鏡の中のみんなが、にやりとわらった…！'),
      ...S('鏡のうつし身', 'ククク…われらは、おまえたちのうつし身。', 'おまえたちと同じ力、同じ技で…\nおまえたちを、たおす！'),
      ...N('鏡の中から、みんなとそっくりのすがたが、ぬっと出てきた！'),
      ['battle', 'utsushimi'],
      ['bgm', null],
      ...N('鏡のうつし身は、光のかけらになって消えていった…。'),
      ['sfx', 'blast'], ['shake'],
      ...N('パリーン…！', '大きな鏡が、こなごなにくだけちった！'),
      ['flag', UTSUSHIMI_FLAG], ['sync'],
      ...S('サラ', '自分とそっくりの相手と戦うなんて…ドキドキしたよ。', '…見て、鏡のおくに道がある！\nいやしの泉もあるみたい！'),
      ['bgm', 'resume'],
      ['objective', TEMPLE_OBJ.utsushimi],
    ];
  },
  // いやしの泉（入るたびに 1回。ドームから 神殿に 入りなおすと また 使える）
  c4_t_spring: (x) => (x.flag(SPRING_FLAG)
    ? N('すきとおった泉だ。', '…でも、今は泉の光が消えている。\n（空気のドームまでもどって、神殿に入りなおすと、また使えるようだ）')
    : [
      ...N('すきとおった、いやしの泉がわいている。'),
      ['choice', '泉の水を飲む？', ['飲む', 'やめる'], [
        [['heal'], ['sfx', 'heal'], ...N('体の底から力がわいてくる！\nみんなのHPとMPが回復した！'), ['flag', SPRING_FLAG],
          ...N('（泉の光が、しずかに消えていった…。\n神殿に入りなおすまで、この泉は使えない）')],
        [],
      ]],
    ]),

  // ───── 地下3階「水のろう」─────
  c4_tb3_enter: () => [
    ['bgm', 'sand_temple'],
    ...N('ひんやりとした空気…。', 'あちこちに、水の柱が立っている。\n…よく見ると、柱の中は、からっぽのろうだ…。'),
    ...S('サラ', '水の柱のろう…？\nもしかして、母さんも、どこかに…！'),
    ['flag', 'c4_tb3_seen'],
    ['objective', TEMPLE_OBJ.tb3],
  ],
  c4_prison_event: (x) => {
    if (x.flag(GUARDS_FLAG)) return [];
    const [mx, my] = C(B3_POS.mira);
    return [
      ['bgm', null],
      ['look', mx, my],
      ...N('へやのまん中に、ひときわ大きな水の柱がある…。', '中に…だれかが、とじこめられている！'),
      ...S('サラ', '母さん！！'),
      ...N('水の柱の中で、青いころもの女の人が、目をとじている…。'),
      ['sfx', 'dark'], ['shake'],
      ...S('どこからかひびく声', 'うふふ…。ようこそ、海賊のむすめ。', 'わたくしの鏡に、だれがうつっても同じこと…。\nそのみこは、わたくしの水鏡の、大切な「かぎ」なの。'),
      ...S('サラ', 'その声…あんたが、モルガナ！？\n母さんを返して！'),
      ...S('どこからかひびく声', '返してほしければ、この下の「水鏡の広間」までいらっしゃい。\n…ろうの番人に、勝てたらね。'),
      ['look', mx, my + 3],
      ...N('ザバァッ…！', '水の中から、ろうの番人があらわれた！'),
      ['battle', 'prison_guards'],
      ['bgm', null],
      ...N('ろうの番人は、水になって、くずれおちた…。'),
      ['flag', GUARDS_FLAG], ['sync'],
      ['look', mx, my],
      ...N('ゴボゴボ…と、水の柱の水が、少しずつ下がっていく…。', '水の中の女の人が、ゆっくりと目をあけた…。'),
      ...S('水のみこミラ', '…サラ…？', 'サラ…来てくれたのね…。'),
      ...S('サラ', '母さん…！よかった…生きてた…！'),
      ...S('水のみこミラ', '紋章の子らよ…。むすめを、ここまで…ありがとう。'),
      ...S('水のみこミラ', 'モルガナは、この下。\n水の守り星で、大きな鏡を作っているわ。'),
      ...S('水のみこミラ', 'このろうは、モルガナの力でとざされているの。\nわたしは、ここから出られない…。', 'でも、ここからでも、いのりはとどけられる。\nあなたたちが戦う時、わたしも、いっしょにいのります。'),
      ...S('サラ', '…うん。待ってて、母さん。\nモルガナをやっつけて、すぐにむかえに来るから！'),
      ...N('（ろうの番人がたおれて、下へつづく水のまくが消えた！）'),
      ['look'],
      ['bgm', 'resume'],
      ['objective', TEMPLE_OBJ.guards],
    ];
  },
  c4_mira_prison: (x) => (x.flag(GUARDS_FLAG)
    ? S('水のみこミラ', 'モルガナは、この下の水鏡の広間…。', 'モルガナが水をまとっている時は、雷で、その水をはがせるはず…。\n同じ呪文ばかりつづけると、鏡にはね返されるわ。', 'あなたたちが戦う時、わたしも、いのりをとどけます。')
    : N('水の柱の中で、青いころもの女の人が、目をとじている…。')),
  c4_prison_curtain: () => N('水のまくが、行く手をふさいでいる…。', '（ろうの番人の力で、とざされているようだ）'),
  c4_prison_empty: () => N('からっぽの、水の柱のろうだ…。'),

  // ───── 最深部「水鏡の広間」─────
  c4_hall_enter: () => [
    ['bgm', null],
    ...N('長いかいだんの先に、大きな広間が広がっていた…。', 'しん…と、水の音だけがひびいている。'),
    ...S('サラ', 'ここが、いちばんおく…。'),
    ['flag', 'c4_hall_seen'],
    ['bgm', 'resume'],
  ],
  c4_morgana_event: (x) => (x.flag(MORGANA_FLAG) ? [] : morganaEvent()),
  c4_water_mirror: (x) => (x.flag(MORGANA_FLAG)
    ? N('しずかな水鏡だ。', '水面に、遠い空の島が、まだかすかにうつっている…。')
    : N('大きな水鏡だ。', '水面に、遠い空にうかぶ島が、ゆらゆらとうつっている…。')),
  // 水の守り星（とちゅうで 終わった ときは ここから）
  c4_water_star: (x) => (x.flag(STAR_FLAG) ? [] : starScene()),

  // ───── 第4章クリアの あと ─────
  c4_mira_temple: () => S('水のみこミラ', '水の守り星は、ぶじに台座にもどりました。', 'サラのこと、これからも、よろしくね。\n…あの子、あなたたちのことが、大好きみたい。'),
  c4_arms_duna: () => [
    ...S('武器と防具の海賊', 'よう、えいゆうさんたち！\nプラチナの武器と防具がそろってるぜ。'),
    ['choice', 'どちらを見る？', ['武器', '防具', 'やめる'], [[['shop', 'duna_weapon']], [['shop', 'duna_armor']], []]],
  ],
};

// ───── 町の 人の ことばの かわり（水の守り星を 取りもどした・第4章クリアの あと）─────
// story-ch4.js が もとの だいほんの 前に はさむ。null の ときは もとの まま
export const TEMPLE_TOWN_LINES = {
  c4_nefi: (x) => {
    if (x.flag(CLEAR4_FLAG)) {
      return S('女王ネフィ', '王国じゅうに、水がもどりました。\nこれも、みなさんとサラのおかげです。', '空にうかぶ島…。\n王家の書物を、もっと調べてみますね。');
    }
    return x.flag(STAR_FLAG) ? palaceScene() : null;
  },
  c4_barga: (x) => {
    if (x.flag(CLEAR4_FLAG)) {
      return S('かしらバルガ', '砂の海賊は、王国の水の守り手だ。\n…へっ、悪くねえ。', 'サラは、あんたたちと、また旅がしたいそうだ。\nルミナの町の酒場ってところで、待ってるとさ。');
    }
    return x.flag(SARA2_FLAG) ? S('かしらバルガ', 'サラ、むちゃはするなよ。', '…紋章の子らよ。\nミラを、たのんだぞ。') : null;
  },
  c4_s_fountain: (x) => (x.flag(STAR_FLAG) ? N('宮殿の前のふん水だ。', 'きれいな水が、高く、高くふき上がっている…！') : null),
  c4_s_pedestal: (x) => {
    if (x.flag(CLEAR4_FLAG)) return N('水の守り星の台座だ。', '水の守り星が、青くかがやいている…！\n台座のまわりのみぞを、きれいな水が流れている。');
    return x.flag(STAR_FLAG) ? N('水の守り星の台座だ。', 'まだ、からっぽだ…。\nでも、まわりのみぞに、水がもどってきている！') : null;
  },
  c4_s_apprentice: (x) => {
    if (x.flag(CLEAR4_FLAG)) return S('みこ見習いのリタ', 'ミラさまが、帰ってきてくださったの！\n水の守り星も、ちゃんと台座にもどったのよ！');
    return x.flag(STAR_FLAG) ? S('みこ見習いのリタ', '神殿のみぞに、水がもどってきたわ…！\nミラさまは…ミラさまは、ぶじなの？') : null;
  },
  c4_s_well: (x) => (x.flag(STAR_FLAG) ? N('町の井戸だ。', 'のぞきこむと、すぐ近くまで、水がたっぷりたまっている！') : null),
  c4_s_gate: (x) => (x.flag(STAR_FLAG) ? S('門番', '水のきまりは、もうおしまいだ！\n王都の井戸にも、ふん水にも、水があふれているぞ！') : null),
  c4_s_q1: (x) => (x.flag(STAR_FLAG) ? S('井戸の列のおばさん', 'もう、ならばなくてもいいのよ！\n井戸から、いくらでも水がくめるわ！') : null),
  c4_s_maid: (x) => (x.flag(STAR_FLAG) ? S('女官のジャミラ', '女王さまが、毎日、笑っていらっしゃるの。\nサラさんも、よく遊びに来るのよ。') : null),
  c4_hassan: (x) => (x.flag(CLEAR4_FLAG) ? S('学者ハサン', '空にうかぶ島…じゃと？', 'ふむ…古い書物に、そのような話があったような…。\nいずれ、調べておこう。') : null),
  c4_nadim: (x) => (x.flag(STAR_FLAG) ? S('村長ナディム', 'オアシスに、こんこんと水がわき出しておる…！\n見なされ、村に緑がもどってきたぞ！', 'そなたたちのおかげじゃ。本当に、ありがとう…！') : null),
  c4_h_woman: (x) => (x.flag(STAR_FLAG) ? S('水くみのおくさん', 'もう、遠くまで水をくみに行かなくていいのよ！\n子どもたちも、オアシスで水あそびしているわ。') : null),
  c4_oasis_water: (x) => (x.flag(STAR_FLAG) ? N('オアシスに、すき通った水がたっぷりとたたえられている。', 'まわりには、草や花が元気にしげっている！') : null),
  c4_d_gate: (x) => (x.flag(CLEAR4_FLAG) ? S('砂の海賊', 'おう、王国のえいゆうさんたちか！\n…へへっ、今じゃ、おれたちも王国の水の守り手よ。') : null),
};

// ───── 目標の 行き先（quest-targets.js。story-ch4.js の CH4_OBJECTIVE_TARGETS に まぜる）─────
const L = B1_POS.levers;
export const TEMPLE_TARGETS = {
  [TEMPLE_OBJ.sara2]: [{ npc: 'sand_ship' }, { map: 'sand_sea', x: SANDSEA_POS.nest.x, y: SANDSEA_POS.nest.y }],
  [TEMPLE_OBJ.temple]: [
    { map: 'temple_dome', x: DOME_POS.down.x, y: DOME_POS.down.y },
    // 地下1階: まだ 動かしていない レバー（赤 → 青 → 黄）と 下への かいだん
    { map: 'temple_b1', x: L.red.x, y: L.red.y, unless: TEMPLE_LEVERS.red },
    { map: 'temple_b1', x: L.blue.x, y: L.blue.y, unless: TEMPLE_LEVERS.blue },
    { map: 'temple_b1', x: L.yellow.x, y: L.yellow.y, unless: TEMPLE_LEVERS.yellow },
    { map: 'temple_b1', x: B1_POS.down.x, y: B1_POS.down.y },
  ],
  [TEMPLE_OBJ.tb2]: [{ map: 'temple_b2', x: B2_POS.start.x, y: B2_POS.start.y - 1 }],
  [TEMPLE_OBJ.lit]: [{ map: 'temple_b2', x: B2_POS.mirror.x, y: B2_POS.mirror.y }],
  [TEMPLE_OBJ.utsushimi]: [{ npc: 'temple_spring' }, { map: 'temple_b2', x: B2_POS.down.x, y: B2_POS.down.y }],
  [TEMPLE_OBJ.tb3]: [{ npc: 'mira_prison' }],
  [TEMPLE_OBJ.guards]: [{ npc: 'morgana_npc' }],
  [TEMPLE_OBJ.morgana]: [{ npc: 'water_star_npc' }],
  [TEMPLE_OBJ.star]: [{ npc: 'nefi' }, { npc: 'nefi_night' }],
  [TEMPLE_OBJ.clear]: [{ npc: 'c4_d_arms' }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
export const TEMPLE_TALK = {
  [TEMPLE_OBJ.sara2]: {
    self: 'すなかぜ号で、砂の海のまん中の「クジラのねどこ」へ。砂クジラが、神殿へ運んでくれるはずだ。',
    bold: 'いよいよ神殿だな！ねどこへ急ごうぜ。サラのかあちゃんを助けに行くぞ！',
    kind: 'サラさん、うれしそうですね。クジラのねどこへ行きましょう。神殿の中は、きっと長い道のりです。薬草を多めに持っていきましょう。',
    kid: '砂クジラさん、元気になったんだね！ねどこへ行こう！',
  },
  [TEMPLE_OBJ.temple]: {
    self: 'かべ画には「水は、上から下へ」とあった。レバーは、上の水門の赤 → 中の水門の青 → 下の水門の黄の順に動かすのかもしれない。水の高さで、通れる道と、とどく宝箱がかわる。まちがえても、レバーをもどせば、やり直せる。',
    bold: '水が多すぎて進めねえな。かべ画の「水は、上から下へ」ってのが答えだろ。赤、青、黄の順だ！とび石の先の宝箱は、水が「中」の時にしかとどかねえみたいだぞ。',
    kind: 'かべ画には、なんて書いてありましたか？「水は、上から下へ」…。上の水門の赤いレバーから、順番に動かしてみましょう。まちがえても、レバーをもどせば、だいじょうぶですよ。',
    kid: '「水は、上から下へ」だって！赤、青、黄のじゅんばんかな？水がへると、歩けるところがふえるよ！',
  },
  [TEMPLE_OBJ.tb2]: {
    self: '鏡のゆかには、本物の道と、にせの道がある。月の鏡を持って、ゆかを調べてみよう。鏡の騎士は、体が光ったら呪文をはね返す。光っている間は、武器で攻撃しよう。',
    bold: '鏡の騎士は、光ってる時に呪文を当てると、はね返してきやがる。光ってる時は、なぐれ！ゆかは…月の鏡で、てらしてみろ。',
    kind: '「光は、下から上へ」…。月の鏡で鏡のゆかを調べると、何か分かるかもしれません。鏡の騎士が光っている時は、呪文ではなく、武器で戦いましょう。',
    kid: '鏡のゆか、どれが本物の道か分かんないよ〜！月の鏡で、ピカーってしてみよう！',
  },
  [TEMPLE_OBJ.lit]: {
    self: '光っている所だけが、本物の道だ。光をたどって、南の大きな鏡まで行こう。',
    bold: '光ってる道だけ歩けば、いいんだな。あの大きな鏡…なんか、いやな感じがするぜ。',
    kind: '光っている道を、ゆっくり進みましょう。南のかべに、大きな鏡がありましたね。',
    kid: '光ってる道だけ、ふんで行こう！はみ出しちゃだめだよ！',
  },
  [TEMPLE_OBJ.utsushimi]: {
    self: '鏡のおくに、いやしの泉がある。泉は、神殿に入りなおすまで1回だけだ。その先のかいだんから、地下3階へ下りよう。',
    bold: '自分とそっくりのやつと戦うのは、へんな気分だったぜ。泉で休んだら、下へ行くぞ！',
    kind: 'いやしの泉で、しっかり休みましょう。泉は1回しか使えないので、使う時をよく考えてくださいね。',
    kid: 'そっくりさん、こわかった〜！泉でげんきになろう！',
  },
  [TEMPLE_OBJ.tb3]: {
    self: '水の柱のろうに、だれかがとじこめられているらしい。おくのへやへ急ごう。',
    bold: 'サラのかあちゃん、きっとこの階にいるぞ！急げ！',
    kind: 'サラさんのお母さん…どうか、ぶじでいてください…。おくのへやへ行きましょう。',
    kid: 'サラのお母さん、どこにいるのかな…。おくのへやだよ！',
  },
  [TEMPLE_OBJ.guards]: {
    self: 'モルガナは「水の衣」をまとうと、ダメージが半分になる。雷で水の衣をはがそう。同じ呪文を2回続けると、はね返される。真の姿の大波は、身を守ってふせごう。',
    bold: 'モルガナが水をまとったら、雷だ！同じ呪文の連発はやめとけ、はね返されるぞ。「水がうずをまいている」ってきたら、身を守れ！',
    kind: 'モルガナが水をまとったら、雷の呪文で水をはがしましょう。同じ呪文ばかり使うと、鏡にはね返されます。大波の前には、みんなで身を守りましょうね。',
    kid: 'モルガナが水のふくを着たら、ビリビリの雷だよ！同じ呪文ばっかりはだめ！大波がきそうになったら、みんなで身を守ろう！',
  },
  [TEMPLE_OBJ.morgana]: {
    self: '水鏡の上に、水の守り星がうかんでいる。取りもどそう。',
    bold: 'やったぜ！あの青い星が、水の守り星だな！',
    kind: '水の守り星が、光っていますね。取りもどしましょう。',
    kid: 'あおい星だ！きれい〜！',
  },
  [TEMPLE_OBJ.star]: {
    self: '王都サファラの宮殿で、女王ネフィに会おう。',
    bold: '水がもどったな！女王さまに、知らせに行こうぜ。',
    kind: '国じゅうに、水がもどったのですね。女王さまに会いに行きましょう。',
    kid: '女王さまに、知らせに行こう！',
  },
  [TEMPLE_OBJ.clear]: {
    self: '第4章クリア！ドゥナにランク7の店が開いた。サラは、ルミナの町の酒場で仲間にできる。竜で、コガネ地方のどこへでも飛べるようになった。',
    bold: 'やったな！ドゥナの店で、プラチナの武器を見に行こうぜ。サラも酒場で仲間になれるってよ！',
    kind: 'おつかれさまでした。サラさんは、ルミナの町の酒場で仲間にできるそうですよ。空にうかぶ島…いつか、行ってみたいですね。',
    kid: '第4章クリア〜！サラもいっしょに冒険できるんだって！',
  },
};

// ───── すすみぐあい（story-ch4.js の CH4_PROGRESS の うしろに つづく）─────
export const TEMPLE_PROGRESS = [
  [SARA2_FLAG, TEMPLE_OBJ.sara2],
  [TEMPLE_FLAG, TEMPLE_OBJ.temple],
  ['c4_tb2_seen', TEMPLE_OBJ.tb2],
  [MIRROR_FLAG, TEMPLE_OBJ.lit],
  [UTSUSHIMI_FLAG, TEMPLE_OBJ.utsushimi],
  ['c4_tb3_seen', TEMPLE_OBJ.tb3],
  [GUARDS_FLAG, TEMPLE_OBJ.guards],
  [MORGANA_FLAG, TEMPLE_OBJ.morgana],
  [STAR_FLAG, TEMPLE_OBJ.star],
  [CLEAR4_FLAG, TEMPLE_OBJ.clear],
];

export { DUNA_POS, WATER_FLAGS };

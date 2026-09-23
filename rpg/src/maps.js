'use strict';
/* =====================================================================
 * maps.js — world map + towns + dungeons (ASCII layouts, NPCs, chests)
 * ===================================================================== */

const WORLD_ROWS = [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~h...~~~~~~~~~~~~~~~~~~~hh..~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~T.......T~~~~~~~~~~~...hhh..TT~~~~~~~~~~~~.~~~~~~~.~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~TTTTTTTTTTTTT~~~~ThhhhhhhMMM.TTT~~~~~~~~M..TT~~~T...~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~TTTTTTTTTTTTTTTTTTTThhhhhhMMM..TTTT.~hMMMM.TTT.TTTTTTTTT.~~~~~~~~~~',
    '~~~~~~~~~~~~~~T.TTTTTTTTTTTTTTTTTTTTTTThhhhMMMM.TTTT.hhMMMM.TTTTTTTTTTTTTTT~~~~~~~~~',
    '~~~~~~~~MMM......TTTTTTTTTTTTTTTTTTTTTTT.hhMMMMTTTTT....MMMTTTTTTTTTTTTTTTTTT~~~~~~~',
    '~~~~~~~MTMMM......TTTTTTTTTTTTTTTTTTTTTT..hMMMMTTTTTT..MMMMTTTTTT...TTTTTTTTTTT~~~~~',
    '~~~~~~...MMM........TTTTTTTTTTTTTTTTTTT....MMMMTTTTTT..MMM~~TTTT.....TTTTTTTTTT~~~~~',
    '~~~~~...MMM.........hhhhhhT...T....TTT.....MMMMhTTTTT..MMM~~~TTT..S..TTTTTT.TTT~~~~~',
    '~~~~T...TTT..........hhhhh.................MMMhhhh....TMMM~~~TTT.....TT.....TTT~~~~~',
    '~~~TTTTTTTT...........hhhh..V.................hhhh....TTTT~~..hhT.............T~~~~~',
    '~~~TTTTTTTT...........hhhh.....................hhh...TTTTTThhhhhhhhh..........TT~~~~',
    '~~~~....TTTT..........hhhh............M....MMMhhhhhh.TTTTThhhhhhhhhh..........TT~~~~',
    '~~~~...TTTTTTT..T.....hhhhh........hMMMM...MMMMhhhhhhTTTMMMhhhhhhMMM..........TT~~~~',
    '~~~~...TTTTTTTTTTT....hhhhh.......hhMMMMhhhMMMMhhhhhhTTTMMMMMMMMMMMMM...........~~~~',
    '~~~~..TTTTTTTTTTTTT...hhhhh.......hhhhhh..hMMMMhhhhh....MMMMMMMMMMMMMh..hhhhh...~~~~',
    '~~~~~..TTTTTTTTTTTTTTTTTTh........T.hhh.....MMMhhh........MMMMMMMhhhhh.hhhhhh..~~~~~',
    '~~~~~..TTTTTTTTTTTTTTTTTT........TTThhh....TTMMhhh.........TTTT....hhhhhhhhhh..~~~~~',
    '~~~~~..TTTTTTTTTTTTTTTTTT........TTT.h.....TTMMM..........TTTTTT....hhhhhhhhhh.~~~~~',
    '~~~~~..TTTTTTTTTTTTTTTTTT........TTTTTT...hh.MMM.........TTTTTTTT...hhhhhhhhhh.~~~~~',
    '~~~~~...TTTTTTTTTTTT.TTTT.......TTTTTTTT..hh.MMM.........TTTTTTTT....hhhhhhhhh~~~~~~',
    '~~~~~...TTTTTTTTTTT.~~~T.....hhhTTTTTTT...h..MMM..........TTTTTT.....hhhhhhhhT~~~~~~',
    '~~~~~..TTTTTTTT~~~~~~~~~~....hh.TTTTTTT......MMM...........TTTT......hhhhhhh..~~~~~~',
    '~~~~~.TTTTTTT~~~~~~~~~~~~~~.....TTTTTTT......MMM.....................hh.......~~~~~~',
    '~~~~~.TTTT.~~~~~~~~~~~~~~~~~~...TTTTTTT.......MM..........................TT..~~~~~~',
    '~~~~..TTTTT~~~~~~~~~~~~~~~~~~~..TTTTTTT.......MM......................~~~~~~~~~~~~~~',
    '~~~~..TTTTT~~~~~~~~~..~~~~~~~~..TTTT...T........................~~~~~~~~~~~~~~~~~~~~',
    '~~~~..TTTTT~~~~~~~~....~~~~~~~..TTTT...T............~~~~~~~~~~|~~~~~~~~~...TT~~~~~~~',
    '~~~...TTTTT~~~~~~~~..W.~~~~~~~~~~~~~~|~~~~~~~~~~~~~~~~~~~~~~~~|~~~.........TTT~~~~~~',
    '~~~~..TTTTTT~~~~~~~~..~~~~~~~~~~~~~~~|~~~~~~~~~~~~~~~~...............MMMMMTTTT~~~~~~',
    '~~~~T....TTTT~~~~~~~~~~~~~~~~~~.........~~........hhhhh..........MMMMMMMMMMMTT~~~~~~',
    '~~~~T....TTTT~~~~~~~~~~~~~~~~~T.................hhhhhhhh.....T...MMMMMMMMMMMTTT~~~~~',
    '~~~~TT...TT....~~~~~~~~~~~~~~TT.................hhhhhhhhh....T.MMMMMMMhhMMMMMTT~~~~~',
    '~~~~~TTTT........~~~~~~~~~~~TTTT................hhhhhhhh.......MMMMT...hhhMMMTTT~~~~',
    '~~~~~.TTT..........~~~~TTTTTTTTT................hhhhhhhh.......MMMTT....hhMMMhTT~~~~',
    '~~~~~~..TTTT.............MMTTTT..................hhhhhh........MMMMT......MMMhTTT~~~',
    '~~~~~~~.TTTThhhh........MMMM..........TTTT.....................MMMMT..2..TTMMMT...~~',
    '~~~~~~~..TThhhhhh.......MMMM.........TTTTTTT....TTTT...........MMMMT.....TTMMM...~~~',
    '~~~~~~~..TThhhhhh.hhh.....M.........TTTTTTTT...TTTTT............MMMTT...TTMMMM...~~~',
    '~~~~~~~~...hhhhhhhhh..........hh....TTTTTTTT..TTTTTTT...........MMMMTTTTTTMMM...~~~~',
    '~~~~~~~~...hhh.TThh...........hh....TTTTTTTT..TTTTTTT...........MMMM.TTTTTMMM...~~~~',
    '~~~~~~~~~..hh.TTThh...................TTTT...TTTTTTTT............MMM.TTTTT.MM..~~~~~',
    '~~~~~~~~~.hhMMMMT............................TTTTTTTTTTTTTT.....ppMMp......MM..~~~~~',
    '~~~~~~~~..hhMMMMT......hh.....T.........T....TTTTTTTTTTTTTTT...pppppp...........~~~~',
    '~~~~~~~hhhhhMMMMMT.....hh....T.........TTTT.TMMMMTTTTTTTTTTTT..ppppppp..........~~~~',
    '~~~~~~hhhhhhTMMMMMM.........TT..C.......TTTTTMMMMTTTTTTTTTTTT..pppppp............~~~',
    '~~~~~h.hhhhhTTMMMMMM......TTTT...........TTTTTMM.TTTTTTTTTTTT..TT...............~~~~',
    '~~~h.....h..TTTTMMMM......TTTT............TTTT..TTTTTTTTTTTTT..................~~~~~',
    '~~~.........TTTTMMMMM.....TTTT.........~~.TTTT..TTTTTTTTTTTTh.........MMMM....~~~~~~',
    '~~~~...1....TTTTTMMMM......TTTT.......~~~~TTTT..TTTTTTTTTTTTh.....TT..MMMM...~~~~~~~',
    '~~~~........TTTTTTMMM.......TTT.......~~~~TTT....TTTTTTTTTTTh.....TT..MMMM...~~~~~~~',
    '~~~~~.........TTTTMMMT....hhTTTh.......~~.TT.....TTTTTTTTddddddddddT...MM....~~~~~~~',
    '~~~~~.........TTTTMMTTT...TTTTTh........hhhh.......TTTTTdddddddddddd.........~~~~~~~',
    '~~~~~~.......TTTTTMMTTT...TTTTTh......hhhhhhhh.....TT...dddddddddddd.........~~~~~~~',
    '~~~~~~hhh....TTTTTTTTTT...TTTTTh......hhhhhhhhh.........dddddddddddd........~~~~~~~~',
    '~~~~~~~~~.T...TTTTTTTTT...TTTThh.....hhhhhhhhhh..........ddddddddddd.......~~~~~~~~~',
    '~~~~~~~~~~~~~TTTTTTTT.....TTThhhh.....hhhhhhhhhh.........ddddddddd.........~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~T.....TT.....hhhh......hhhhhhhhhh.........hhdddd...~.....~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~....TT.....hhh............hhhh......TT...h.....~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~TTTT....~~~~~............hh........TT........~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~T~~~~~~~~~~~~~...........~~~~~...~~~~~TT....~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~....~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
];

/* ---------- local maps (towns / dungeons) ----------
 * universal legend: see LOCAL_LEGEND. NPC talk: string | string[] | {day, night} | async fn(npc)
 */
const MAPDEFS = {};

MAPDEFS.world = {
  name: 'ソレイア島', legend: 'world', world: true, bgm: 'field', nightBgm: 'night',
  rows: WORLD_ROWS,
  zones: [
    { x0: 48, y0: 0, x1: 83, y1: 28, z: 'N' },
    { x0: 48, y0: 29, x1: 83, y1: 44, z: 'D' },
    { x0: 57, y0: 45, x1: 83, y1: 67, z: 'D' },
    { x0: 0, y0: 0, x1: 47, y1: 29, z: 'B' },
  ],
  zoneDefault: 'A',
  warps: {
    '32,48': { map: 'soleia', x: 19, y: 43, dir: 'up', town: 'soleia' },
    '28,13': { map: 'norde', x: 15, y: 27, dir: 'up', town: 'norde' },
    '21,31': { map: 'tower1', x: 7, y: 11, dir: 'up' },
    '7,52': { map: 'uminari1', x: 10, y: 16, dir: 'up' },
    '70,39': { map: 'shirube1', x: 8, y: 12, dir: 'up' },
    '66,11': { map: 'shrine', x: 5, y: 7, dir: 'up' },
  },
  hidden: {
    '8,9': { item: 'star', id: 's_tree' },
    '62,57': { item: 'star', id: 's_desert' },
    '20,29': { item: 'star', id: 's_islet' },
  },
};

MAPDEFS.soleia = {
  name: 'ソレイアの城下町', bgm: 'town', outdoor: true,
  exit: { map: 'world', x: 32, y: 48 },
  bgmZones: [
    { x0: 5, y0: 0, x1: 34, y1: 17, bgm: 'castle' },
    { x0: 22, y0: 19, x1: 31, y1: 26, bgm: 'tavern' },
  ],
  rows: [
    'TT.TTXXXXXXXXX*XXXXXXXXX*XXXXXXXXXXTT.TT',
    'T....Xss=ssX=====rrYrr=====X$=$=$=X....T',
    'T.T..X=====X==P==rrrrr==P==X======X..T.T',
    'T....X=t===X======rrr======X======X....T',
    'TT...X=====X==P===rrr===P==XXXLXXXX...TT',
    'T....Xs===sX======rrr======X======X....T',
    'T.f..X=====X==P===rrr===P==X=O==O=X..f.T',
    'T....X=====X======rrr======X======X....T',
    'TT...XXXDXXXXXX*XXrrrXX*XXXXXXDXXXX...TT',
    'T....XO===OX======rrr======X======X....T',
    'T.T..X=====X==P===rrr===P==X=B==B=X..T.T',
    'T....Xc====X======rrr======X======X....T',
    'T....X=====D======rrr======D======X....T',
    'TT...Xc===OX==P===rrr===P==X=B==B=X...TT',
    'T....X=====X======rrr======X======X....T',
    'T.f..XO=o=OX======rrr======X======X..f.T',
    'T....X=====X======rrr======X======X....T',
    'TT...XXXXXXXXXXX*X===X*XXXXXXXXXXXX...TT',
    'T....f...f...f....:::....f...f...f.....T',
    'T########.#######.:::.##########.######T',
    'T#o_s__<#.#s___s#.:::.#sO___O_s#.#o__B#T',
    'T#______#.#__+__#.:::.#_KKKKK__#.#____#T',
    'T#_t____#.#_____#.:::.#________#.#t___#T',
    'T#______#.#tt_tt#.:::.#_t__t__t#.#____#T',
    'T#o_____#.#tt_tt#.:::.#________#.##D###T',
    'T####D###.#_____#.:::.#O______O#.......T',
    'T.........###D###l:::l####D#####.......T',
    'T...........5.....:::....6.............T',
    'T.................:::.W................T',
    'T#########.######.:::.##########.######T',
    'T#s_s_s_s#.#s__s#.:::.#____B_B_#.#$__$#T',
    'T#KKK_KKK#.#KKKK#.:::.#KKK_____#.#____#T',
    'T#_______#.#____#.:::.#________#.#_o__#T',
    'T#O_____O#.#o__o#.:::.#____B_B_#.#____#T',
    'T#_______#.##D###.:::.#________#.##L###T',
    'T####D####..3.....:::.#O______O#.......T',
    'T...1.2...........:::.####D#####.......T',
    'T.................:::....4.............T',
    'T..~~~....f.f.....:::.......f.f........T',
    'T.~~~~~..T........:::..........T.......T',
    'T..~~~..........l.:::.l...........bb...T',
    'TT.....T..........:::...........T.....TT',
    'TTTFFFFFFFFFFFFFF.:::.FFFFFFFFFFFFFFFTTT',
    'TTTTTTTTTTTTTTTTTT:::TTTTTTTTTTTTTTTTTTT',
  ],
  warps: {
    '7,20': { map: 'hero2f', x: 8, y: 1, dir: 'left' },
  },
  chests: {
    '28,1': { gold: 250 }, '30,1': { item: 'star', id: 's_treasury' }, '32,1': { item: 'seed_agi' },
    '34,30': { item: 'seed_life' }, '37,30': { gold: 300 },
  },
  hidden: {
    '2,24': { item: 'star', id: 's_home' },
    '2,20': { item: 'herb', id: 'so_pot1' },
    '6,15': { item: 'star', id: 's_castle' },
    '8,15': { item: 'herb', id: 'so_pot2' },
    '30,25': { item: 'antidote', id: 'so_bar' },
    '30,35': { gold: 20, id: 'so_inn' },
    '12,33': { item: 'holywater', id: 'so_shop' },
    '35,32': { gold: 15, id: 'so_lock' },
  },
  npcs: [
    { id: 'king', kind: 'king', x: 19, y: 1, dir: 'down', talk: n => Events.king(n) },
    { id: 'minister', kind: 'minister', x: 17, y: 2, dir: 'down', talk: n => Events.minister(n) },
    { id: 'rguard1', kind: 'soldier', x: 15, y: 3, dir: 'right', talk: '「ここは ソレイア城 王の間である。 王の まえでは れいぎ ただしくな。」' },
    { id: 'rguard2', kind: 'soldier', x: 23, y: 3, dir: 'left', talk: n => Events.guardHint(n) },
    { id: 'tguard1', kind: 'soldier', x: 17, y: 9, dir: 'down', talk: '「王さまは {hero}の たびだちを こころまちに しておられたぞ。」' },
    { id: 'tguard2', kind: 'soldier', x: 21, y: 9, dir: 'down', talk: '「10ねんまえ 勇者レオンさまが この城から たびだった ひのことを いまでも おぼえているよ。」' },
    { id: 'scholar', kind: 'bard', x: 9, y: 3, dir: 'left', talk: [
      '「ふるい 書物に よれば、 魔王ガルヴァスは はるか 北の 大陸の やみの しろに ひそむ という。」',
      '「この 島から そとの せかいへ でるには、 東の 洞窟の おくに ある 『旅の門』を くぐるしか ないのです。」',
    ] },
    { id: 'maid', kind: 'woman2', x: 8, y: 11, dir: 'down', wander: 2, talk: '「たるや つぼの なかを しらべると、 おもわぬ ものが みつかることが ありますよ。 ……あら、 おしろの ものは ほどほどにね！」' },
    { id: 'bsoldier', kind: 'soldier', x: 31, y: 11, dir: 'down', talk: { day: '「よるに なると まものは すがたを かえ、 つよく なるそうだ。 きを つけろよ。」', night: '「ふぁ〜あ… よるの みはりは ねむくて かなわん。」' } },
    { id: 'tsoldier', kind: 'soldier', x: 30, y: 7, dir: 'up', talk: n => Events.treasuryGuard(n) },
    { id: 'princess', kind: 'princess', x: 14, y: 14, dir: 'down', wander: 2, talk: '「{hero}さま… どうか ごぶじで。 わたし、 まいにち おいのりしていますね。」' },
    { id: 'courtier', kind: 'woman', x: 24, y: 15, dir: 'left', wander: 2, talk: '「{hero}の おとうさま、 勇者レオンさまは 10ねんまえ 魔王を たおすため たびだった まま… いまも ゆくえが わからないのです。」' },
    { id: 'gguard1', kind: 'soldier', x: 17, y: 18, dir: 'down', talk: '「ようこそ ソレイア城へ！」' },
    { id: 'gguard2', kind: 'soldier', x: 21, y: 18, dir: 'down', talk: { day: '「王さまは 王の間に おられる。 まっすぐ きたへ すすむのだ。」', night: '「よるの 城は しずかだろう？ だが おれたちは ねむらないぞ。」' } },
    { id: 'mother', kind: 'mother', x: 4, y: 21, dir: 'down', cond: () => Game.flag('opening'), talk: n => Events.mother(n) },
    { id: 'grandpa', kind: 'oldman', x: 6, y: 23, dir: 'left', talk: '「わしの むすこ レオンが たびだって もう 10ねんか…。 {hero}よ、 けっして むりは するでないぞ。」' },
    { id: 'priest', kind: 'priest_npc', x: 13, y: 20, dir: 'down', talk: n => Events.church(n) },
    { id: 'hostess', kind: 'hostess', x: 26, y: 20, dir: 'down', talk: n => Events.tavern(n) },
    { id: 'patron1', kind: 'man2', x: 25, y: 23, dir: 'right', talk: '「東の はずれに ある しるべの洞窟…。 あのおくに 旅の門が あるらしいぜ。 いまは 岩で ふさがれてるがな。」' },
    { id: 'bard', kind: 'bard', x: 29, y: 22, dir: 'left', talk: '「♪ ちいさな ほしの かけら、 しまじゅうに ちらばり… ♪  いどの そこの じいさんが あつめて いるらしいよ。」' },
    { id: 'sailor', kind: 'sailor', x: 28, y: 24, dir: 'up', talk: '「ふねが あれば どこへでも いけるんだがなあ。 いまは うみも まものだらけさ。」' },
    { id: 'thief', kind: 'thief', x: 24, y: 24, dir: 'left', time: 'night', talk: [
      '「…ひひ。 よるの さかばは いいねえ。」',
      '「ノルデ村の ドーランじいさんは ばくはつの めいじん だが、 がんこもので カギを かけて とじこもってるのさ。」',
    ] },
    { id: 'oldwoman', kind: 'oldwoman', x: 35, y: 21, dir: 'down', talk: { day: '「北の ノルデ村へは 橋を わたって まっすぐ 北へ いくんだよ。」', night: '「こんな じかんに どうしたんだい？ よるの そとは あぶないよ。」' } },
    { id: 'weapon', kind: 'shopkeeper', x: 3, y: 30, dir: 'down', talk: () => Events.shop('soleia_weapon') },
    { id: 'armor', kind: 'shopkeeper', x: 7, y: 30, dir: 'down', talk: () => Events.shop('soleia_armor') },
    { id: 'itemshop', kind: 'man', x: 13, y: 30, dir: 'down', talk: () => Events.shop('soleia_item') },
    { id: 'innkeeper', kind: 'innkeeper', x: 24, y: 30, dir: 'down', talk: () => Events.inn(4) },
    { id: 'townman', kind: 'man', x: 10, y: 27, dir: 'down', wander: 3, time: 'day', talk: '「まものは よるに なると つよく なる。 たびの はじめは ひるまに すすむのが いいよ。」' },
    { id: 'townwoman', kind: 'woman', x: 27, y: 28, dir: 'down', wander: 3, time: 'day', talk: '「{hero}ちゃん、 16さいの おたんじょうび おめでとう！ りっぱに なったわねえ。」' },
    { id: 'boy', kind: 'boy', x: 14, y: 38, dir: 'down', wander: 3, time: 'day', talk: '「ねえねえ しってる？ まちの いどの そこに へんな おじいさんが すんでるんだって！」' },
    { id: 'girl', kind: 'girl', x: 11, y: 39, dir: 'up', wander: 2, time: 'day', talk: '「つぼや たるを しらべると いいものが はいってるかも！ でも ひとの いえの ものだからね！」' },
    { id: 'dog', kind: 'dog', x: 30, y: 39, dir: 'left', wander: 4, talk: '「ワンワン！」' },
    { id: 'sguard1', kind: 'soldier', x: 17, y: 42, dir: 'down', talk: n => Events.gateGuard(n) },
    { id: 'sguard2', kind: 'soldier', x: 21, y: 42, dir: 'down', talk: n => Events.gateGuard(n) },
    { id: 'watch', kind: 'soldier', x: 19, y: 36, dir: 'down', wander: 3, time: 'night', talk: '「よるの まちは しずかだろう？ みんな ねむっているのさ。 やどやは よるでも あいているぞ。」' },
  ],
};

MAPDEFS.hero2f = {
  name: '{hero}の いえ', bgm: 'town', interior: true,
  rows: [
    '##########',
    '#B_s_o__>#',
    '#________#',
    '#_t______#',
    '#______o_#',
    '##########',
  ],
  warps: { '8,1': { map: 'soleia', x: 7, y: 20, dir: 'down' } },
  hidden: { '5,1': { item: 'herb', id: 'h2_pot' }, '7,4': { gold: 10, id: 'h2_pot2' } },
  npcs: [
    { id: 'mother2f', kind: 'mother', x: 3, y: 2, dir: 'left', cond: () => !Game.flag('opening'), talk: '「さあ、 おしろへ いきましょう。」' },
  ],
};

MAPDEFS.well = {
  name: 'いどの そこ', bgm: 'shrine', interior: true, cave: true,
  rows: [
    'RRRRRRRRRRRR',
    'R%%%-----<RR',
    'R%%-------RR',
    'RR--------oR',
    'RR---t----RR',
    'RRRRRRRRRRRR',
  ],
  warps: { '9,1': { map: 'soleia', x: 23, y: 28, dir: 'left' } },
  hidden: { '10,3': { gold: 30, id: 'wl_pot' } },
  npcs: [
    { id: 'collector', kind: 'collector', x: 5, y: 3, dir: 'down', talk: n => Events.collector(n) },
  ],
};

MAPDEFS.norde = {
  name: 'ノルデの村', bgm: 'village', outdoor: true,
  exit: { map: 'world', x: 28, y: 13 },
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T..............................T',
    'T.########....f..f....########.T',
    'T.#s_cc_O#...~~~~~~...#s____s#.T',
    'T.#______#..~~~~~~~~..#__+___#.T',
    'T.#t____c#..~~~~~~~~..#______#.T',
    'T.#______#...~~~~~~...#tt__tt#.T',
    'T.#O____B#............#______#.T',
    'T.###L####....l..l....###D####.T',
    'T..............::.......5......T',
    'T..............::..............T',
    'T.#########....::....#########.T',
    'T.#s_s_B_B#.f..::..f.#s_s_s_s#.T',
    'T.#KKK____#....::....#KKK_KKK#.T',
    'T.#____B_B#.b..::..b.#_______#.T',
    'T.#_______#....::....#O_____O#.T',
    'T.#t_____O#.f..::..f.#_______#.T',
    'T.####D####....::....####D####.T',
    'T....4.........::.......1.2....T',
    'T..............::..............T',
    'T..#######.....::.....#######..T',
    'T..#o_s_o#.....::.....#B___o#..T',
    'T..#KKK__#.....::.....#_____#..T',
    'T..#_____#.....::.....#t___O#..T',
    'T..###D###.....::.....###D###..T',
    'T....3.........::..............T',
    'T..............::..............T',
    'TTTTTTTTTTTTTTT::TTTTTTTTTTTTTTT',
  ],
  hidden: {
    '9,16': { item: 'star', id: 's_norde' },
    '8,3': { item: 'herb', id: 'no_barrel' },
    '8,21': { item: 'antidote', id: 'no_pot' },
    '27,21': { gold: 30, id: 'no_pot2' },
    '27,23': { item: 'herb', id: 'no_barrel2' },
  },
  npcs: [
    { id: 'doran', kind: 'bomber', x: 5, y: 5, dir: 'down', talk: n => Events.doran(n) },
    { id: 'npriest', kind: 'priest_npc', x: 25, y: 3, dir: 'down', talk: n => Events.church(n) },
    { id: 'ninn', kind: 'innkeeper', x: 4, y: 12, dir: 'down', talk: () => Events.inn(6) },
    { id: 'nweapon', kind: 'shopkeeper', x: 23, y: 12, dir: 'down', talk: () => Events.shop('norde_weapon') },
    { id: 'narmor', kind: 'shopkeeper', x: 27, y: 12, dir: 'down', talk: () => Events.shop('norde_armor') },
    { id: 'nitem', kind: 'woman2', x: 5, y: 21, dir: 'down', talk: () => Events.shop('norde_item') },
    { id: 'nwoman', kind: 'woman', x: 25, y: 22, dir: 'down', wander: 1, talk: '「むすこが たびに でたまま かえってこないの…。 どこかで あったら、 たまには かえってくるよう つたえてね。」' },
    { id: 'nman', kind: 'man', x: 7, y: 10, dir: 'up', wander: 2, time: 'day', talk: n => Events.nordeVillager(n) },
    { id: 'noldwoman', kind: 'oldwoman', x: 12, y: 9, dir: 'down', wander: 1, talk: '「むかし ささやきの塔に すむ 賢者さまが、 ふるい とびらなら なんでも ひらく ふしぎな カギを つくったと きいたことが あるよ。」' },
    { id: 'nfarmer', kind: 'man2', x: 18, y: 15, dir: 'left', wander: 2, time: 'day', talk: '「ささやきの塔へは 城の 西にある みさきの洞窟から 地下を とおって いけるそうだ。 おれは こわくて いけないがね。」' },
    { id: 'ngirl', kind: 'girl', x: 13, y: 19, dir: 'down', wander: 2, time: 'day', talk: '「しるべの洞窟の 岩を こわしたいの？ それなら ドーランおじいちゃんの ばくれつだまが ひつようね！」' },
    { id: 'nboy', kind: 'boy', x: 20, y: 10, dir: 'down', wander: 3, time: 'day', talk: '「ぼく しってるよ！ 東の ほこらには けがを なおす ふしぎな いずみが あるんだって！」' },
    { id: 'ndog', kind: 'dog', x: 9, y: 19, dir: 'right', wander: 3, talk: '「ワン！」' },
    { id: 'ncat', kind: 'cat', x: 27, y: 10, dir: 'down', wander: 2, talk: '「ニャーン。」' },
    { id: 'nghost', kind: 'ghost', x: 19, y: 7, dir: 'down', time: 'night', talk: [
      '「……わたしは この 村で いのちを おとした たびびと……。」',
      '「……東の 洞窟の おく…… やみの きしが 旅の門を まもっている……。」',
      '「……ほのおの じゅもんは あまり きかない…… きを つけて……。」',
    ] },
    { id: 'nwatch', kind: 'man', x: 16, y: 22, dir: 'down', time: 'night', talk: '「よるは まものが つよい。 ねむるなら やどやへ いきな。」' },
  ],
};

MAPDEFS.uminari1 = {
  name: 'みさきの洞窟', bgm: 'cave', dungeon: true, zone: 'C', encRate: 1.0,
  rows: [
    'RRRRRRRRRRRRRRRRRRRRRRRR',
    'RR$--RRRRRRRRRRRR--->RRR',
    'RR---RRRRRRRRRRRR-RRRRRR',
    'RRR-RRRR----------RRRRRR',
    'RRR-RRRR-RRRRRRRRRRRRRRR',
    'RRR------RRRRRR%%%%RRRRR',
    'RRRRRR-RRRRRRR%%%%%%RRRR',
    'RRRRRR-RRRRRRR%%%%%%RRRR',
    'RR$-----RRR-------%%RRRR',
    'RRRRRRR-RRR-RRRRR-RRRRRR',
    'RRRRRRR-----RRRRR-RRRRRR',
    'RRRRRRRRRRR-RRRRR---$RRR',
    'RRRRRRRRRRR-RRRRRRRRRRRR',
    'RRRRR-------------RRRRRR',
    'RRRRR-RRRRRRRRRRR-RRRRRR',
    'RRRRR-RRRRRRRRRRR-RRRRRR',
    'RRRRR-----<RRRRR---RRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRR',
  ],
  warps: {
    '10,16': { map: 'world', x: 7, y: 52, dir: 'down' },
    '20,1': { map: 'uminari2', x: 1, y: 1, dir: 'right' },
  },
  chests: { '2,1': { item: 'herb' }, '2,8': { gold: 60 }, '20,11': { item: 'star', id: 's_uminari' } },
};

MAPDEFS.uminari2 = {
  name: 'みさきの洞窟 地下', bgm: 'cave', dungeon: true, zone: 'C', encRate: 1.0,
  rows: [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'R<--RRRRRRRRRRR%%%%%RRRRRRRRRRR-$RRRRRRR',
    'RR--RRRRRRRRRR%%%%%%%RRRRRRRRRR-RRRRRRRR',
    'RRR-------------%%%%-----RRRRR----RRRRRR',
    'RRRRRRRR-RRRRRR------RRR--RRR--RR-RRRRRR',
    'RR$------RRRRRRRRRRRRRRR------RRR--RRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR-<RRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  ],
  warps: {
    '1,1': { map: 'uminari1', x: 20, y: 1, dir: 'left' },
    '35,6': { map: 'tower1', x: 7, y: 10, dir: 'up', first: 'towerArrive' },
  },
  chests: { '2,5': { item: 'antidote' }, '32,1': { item: 'mpdrop' } },
};

MAPDEFS.tower1 = {
  name: 'ささやきの塔 1かい', bgm: 'tower', dungeon: true, zone: 'C', encRate: 0.9,
  rows: [
    'HHHwHHHHHHHwHHH',
    'H;;;;;;H;;;;;<H',
    'H;P;;;;H;;HHHHH',
    'H;;;;;;H;;;;;;H',
    'H;;HHHHH;;P;;;H',
    'H;;;;;;;;;;;;;H',
    'H;;;;;P;;;;;;;H',
    'HHHHH;;;;;HHH;H',
    'H$;;H;;;;;H;;;H',
    'H;;;H;;;;;H;o;H',
    'H;;;;;;>;;;;;;H',
    'H;;;;;;;;;;;;;H',
    'HHHHHHHDHHHHHHH',
  ],
  warps: {
    '7,10': { map: 'uminari2', x: 35, y: 6, dir: 'left' },
    '7,12': { map: 'world', x: 21, y: 31, dir: 'down' },
    '13,1': { map: 'tower2', x: 13, y: 1, dir: 'left' },
  },
  chests: { '1,8': { item: 'herb' } },
  hidden: { '12,9': { gold: 20, id: 't1_pot' } },
};

MAPDEFS.tower2 = {
  name: 'ささやきの塔 2かい', bgm: 'tower', dungeon: true, zone: 'C', encRate: 0.9,
  rows: [
    'HHHHHHwHwHHHHHH',
    'H;;;;;;;;;;;;>H',
    'H;HHHHHHHHH;;;H',
    'H;H;;B;B;;H;;;H',
    'H;H;;;;;;;H;;;H',
    'H;HKKK;;;;D;;;H',
    'H;H;;;;;;;H;P;H',
    'H;HHHHHHHHH;;;H',
    'H;;;;;;;;;;;;;H',
    'H;;P;;;;;P;;;;H',
    'H;;;;H;;H;;;;;H',
    'H<;;;H$oH;;;;;H',
    'HHHHHHHHHHHHHHH',
  ],
  noEncRect: { x0: 3, y0: 3, x1: 9, y1: 6 },
  warps: {
    '13,1': { map: 'tower1', x: 13, y: 1, dir: 'left' },
    '1,11': { map: 'tower3', x: 1, y: 1, dir: 'down' },
  },
  chests: { '6,11': { item: 'seed_life' } },
  hidden: { '7,11': { item: 'herb', id: 't2_pot' } },
  npcs: [
    { id: 'towerinn', kind: 'oldwoman', x: 4, y: 4, dir: 'down', talk: () => Events.inn(5, 'tower') },
    { id: 'towershop', kind: 'merchant_m', x: 8, y: 4, dir: 'down', talk: () => Events.shop('tower_item') },
  ],
};

MAPDEFS.tower3 = {
  name: 'ささやきの塔 3かい', bgm: 'tower', dungeon: true, zone: 'C', encRate: 1.0,
  rows: [
    'HHHwHHHHHHHwHHH',
    'H>;;H;;;;;;;;;H',
    'H;;;H;;HHHHH;;H',
    'H;;;H;;H$;;H;;H',
    'H;;;;;;H;;;H;;H',
    'HHHH;HHH;;;H;;H',
    'H;;;;;;;;;;H;;H',
    'H;P;;;;;;;;;;;H',
    'H;;;HHHHHHHH;;H',
    'H;;;H;;;;;;H;;H',
    'H;;;;;;$;;;;;;H',
    'H;;;H;;;;;;H;<H',
    'HHHHHHHHHHHHHHH',
  ],
  warps: {
    '1,1': { map: 'tower2', x: 1, y: 11, dir: 'right' },
    '13,11': { map: 'tower4', x: 13, y: 11, dir: 'left' },
  },
  chests: { '8,3': { item: 'star', id: 's_tower' }, '7,10': { item: 'fireorb' } },
};

MAPDEFS.tower4 = {
  name: 'ささやきの塔 4かい', bgm: 'tower', dungeon: true, zone: 'C', encRate: 1.0,
  rows: [
    'HHHHHHHwHHHHHHH',
    'H;;;;;H<H;;;;;H',
    'H;P;;;;;;;;;P;H',
    'H;;;;;;;;;;;;;H',
    'HHHHHH;;;HHHHHH',
    'H;;;;H;;;H;;;;H',
    'H;$;;H;;;H;;o;H',
    'H;;;;;;;;;;;;;H',
    'H;;;;HHHHH;;;;H',
    'H;P;;;;;;;;;P;H',
    'H;;;;;;;;;;;;;H',
    'H;;;;;;;;;;;;>H',
    'HHHHHHHHHHHHHHH',
  ],
  warps: {
    '13,11': { map: 'tower3', x: 13, y: 11, dir: 'left' },
    '7,1': { map: 'tower5', x: 6, y: 7, dir: 'up' },
  },
  chests: { '2,6': { item: 'ironhelm' } },
  hidden: { '12,6': { item: 'herb', id: 't4_pot' } },
  npcs: [
    { id: 'sentinel', kind: 'golem', x: 7, y: 2, dir: 'down', cond: () => !Game.flag('sentinel'), talk: n => Events.sentinel(n) },
  ],
};

MAPDEFS.tower5 = {
  name: 'ささやきの塔 おくじょう', bgm: 'shrine', outdoor: true,
  rows: [
    'HHHHHHHHHHHHH',
    'H;;;;;;;;;;;H',
    'H;t;;;;;;;B;H',
    'H;;;;;;;;;;;H',
    'H;;;;;;;;;;;H',
    'H;o;;;;;;;o;H',
    'H;;;;;;;;;;;H',
    'H;;;;;>;;;;;H',
    'HHHHHHHHHHHHH',
  ],
  warps: { '6,7': { map: 'tower4', x: 7, y: 1, dir: 'down' } },
  hidden: { '2,5': { item: 'mpdrop', id: 't5_pot' }, '10,5': { gold: 50, id: 't5_pot2' } },
  npcs: [
    { id: 'sage', kind: 'sage', x: 6, y: 3, dir: 'down', talk: n => Events.hermit(n) },
  ],
};

MAPDEFS.shirube1 = {
  name: 'しるべの洞窟', bgm: 'cave', dungeon: true, zone: 'E', encRate: 0.7,
  rows: [
    'RRRRRRRRRRRRRRRRRRRR',
    'RRRRRRRR>RRRRRRRRRRR',
    'RRRRRRRR-RRRRRRRRRRR',
    'RRRRRRRR-RRRRRRRRRRR',
    'RRRRRRRRZRRRRRRRRRRR',
    'RRRRR-------RRRRRRRR',
    'RRRR---------RRRRRRR',
    'RRR-----------RRRRRR',
    'RRR---%%%%----RRRRRR',
    'RRRR--%%%%---RRRRRRR',
    'RRRRR-------RRRRRRRR',
    'RRRRRRR---RRRRRRRRRR',
    'RRRRRRRR<RRRRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRR',
  ],
  patch(set) { if (Game.flag('wallBroken')) set(8, 4, 'rubble'); },
  warps: {
    '8,12': { map: 'world', x: 70, y: 39, dir: 'down' },
    '8,1': { map: 'shirube2', x: 1, y: 1, dir: 'down' },
  },
  npcs: [
    { id: 'cguard', kind: 'soldier', x: 10, y: 6, dir: 'left', cond: () => !Game.flag('wallBroken'), talk: n => Events.caveGuard(n) },
  ],
  interact: { '8,4': () => Events.sealedWall() },
};

MAPDEFS.shirube2 = {
  name: 'しるべの洞窟 地下1かい', bgm: 'cave', dungeon: true, zone: 'E', encRate: 1.0,
  rows: [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'R<-----RRRRRRRRRR$-----RRRRR',
    'RRRRRR-RRRRRRRRRRRRRRR-RRRRR',
    'RR$---------RRRRRR-----RRRRR',
    'RRRRRRRRRRR-RRRRRR-RRRRRRRRR',
    'RRRRRR------RRRRRR--------RR',
    'RRRRRR-RRRRRRR%%%%RRRRRRR-RR',
    'RR-----RRRRRR%%%%%%RRRRRR-RR',
    'RR-RRRRRRRRRR%%%%%%RR-----RR',
    'RR-RRRR--------%%%RRR-RRRRRR',
    'RR-RRRR-RRRRRR------R-RRRRRR',
    'RR------RRRRRRRRRR----RRRRRR',
    'RRRRRRR-RRRRRRRRRRRRRRRRRRRR',
    'RRRRRRR-----------RRRRRRRRRR',
    'RRRRRRRRRRRRRRRRR-RRRRRRRRRR',
    'RRRRRRRRR$-------->RRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  ],
  warps: {
    '1,1': { map: 'shirube1', x: 8, y: 1, dir: 'down' },
    '18,15': { map: 'shirube3', x: 9, y: 13, dir: 'up' },
  },
  chests: { '17,1': { item: 'chainmail' }, '2,3': { gold: 120 }, '9,15': { item: 'mpdrop' } },
};

MAPDEFS.shirube3 = {
  name: 'しるべの洞窟 地下2かい', bgm: 'cave', dungeon: true, zone: 'E', encRate: 0,
  rows: [
    'RRRRRRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRR',
    'RRRRRR*-----*RRRRRRR',
    'RRRRRR---G---RRRRRRR',
    'RRRRRR-------RRRRRRR',
    'RRRRRRR-----RRRRRRRR',
    'RRRRRRRRR-RRRRRRRRRR',
    'RRRRRRRRR-RRRRRRRRRR',
    'RRRRRRR-----RRRRRRRR',
    'RRRRRR-------RRRRRRR',
    'RRRRR*-------*RRRRRR',
    'RRRRR---------RRRRRR',
    'RRRRRR-------RRRRRRR',
    'RRRRRRRR-<-RRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRR',
  ],
  warps: { '9,13': { map: 'shirube2', x: 18, y: 15, dir: 'left' } },
  triggers: { '9,8': () => Events.bossApproach() },
  interact: { '9,3': () => Events.gate() },
  npcs: [
    { id: 'boss', kind: 'dark_knight', x: 9, y: 7, dir: 'down', cond: () => !Game.flag('boss'), talk: () => Events.bossApproach(true) },
  ],
};

MAPDEFS.shrine = {
  name: 'いやしの ほこら', bgm: 'shrine', interior: true,
  exit: { map: 'world', x: 66, y: 11 },
  rows: [
    'XX*XXXXXX*XX',
    'X==========X',
    'X=o==q===o=X',
    'X==========X',
    'X=P======P=X',
    'X==========X',
    'X=P======P=X',
    'XXXXX==XXXXX',
  ],
  hidden: { '9,2': { item: 'star', id: 's_shrine' }, '2,2': { item: 'mpdrop', id: 'sh_pot' } },
  interact: { '5,2': () => Events.spring() },
  npcs: [
    { id: 'hermit2', kind: 'nun', x: 7, y: 3, dir: 'down', talk: n => Events.shrineSage(n) },
  ],
};

/* ---------- legends ---------- */
const WORLD_LEGEND = {
  '~': 'sea', '.': 'grass', T: 'forest', h: 'hills', M: 'mountain', d: 'desert', p: 'swamp', '|': 'bridge', '=': 'bridge',
  C: 'castle', V: 'village', W: 'tower', 1: 'cave', 2: 'cave', S: 'shrine',
};
const LOCAL_LEGEND = {
  ' ': 'void', '.': 'grass', ',': 'ground', ':': 'path', '#': 'wall', X: 'cwall', R: 'rock', H: 'twall', w: 'twindow',
  _: 'floor', '=': 'stone', '-': 'cfloor', ';': 'tfloor', r: 'carpet', u: 'bluecarpet', D: 'door', L: 'ldoor', K: 'counter',
  '~': 'water', '%': 'cwater', '<': 'stairs_up', '>': 'stairs_down', Z: 'sealed', G: 'gate', k: 'rubble',
};
const LOCAL_PROPS = {
  T: 'tree', b: 'bush', f: 'flowers', F: 'fence', o: 'pot', O: 'barrel', c: 'crate', s: 'shelf', t: 'table', B: 'bed', W: 'well',
  P: 'pillar', Y: 'throne', '*': 'torch', l: 'lamp', A: 'statue', g: 'grave', '+': 'altar', h: 'stall', $: 'chest', '@': 'boulder',
  q: 'spring', x: 'cross', 1: 'sign_weapon', 2: 'sign_armor', 3: 'sign_item', 4: 'sign_inn', 5: 'sign_church', 6: 'sign_bar',
};
const WALLISH = new Set(['wall', 'cwall', 'rock', 'twall', 'twindow', 'void', 'sealed', 'black']);
const WATERISH = new Set(['sea', 'water', 'cwater', 'sea_deep']);

for (const id in MAPDEFS) MAP_NAMES[id] = MAPDEFS[id].name;

const Maps = {
  build(id) {
    const def = MAPDEFS[id];
    const rows = def.rows, h = rows.length, w = rows[0].length;
    const n = w * h;
    const base = new Array(n).fill(null), prop = new Array(n).fill(null), vari = new Array(n).fill(0);
    const world = def.legend === 'world';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x], i = y * w + x;
      if (world) { base[i] = WORLD_LEGEND[ch] || 'grass'; if (ch === '|') vari[i] = 1; continue; }
      if (LOCAL_LEGEND[ch]) base[i] = LOCAL_LEGEND[ch];
      else if (LOCAL_PROPS[ch]) prop[i] = LOCAL_PROPS[ch];
      else base[i] = 'grass';
    }
    // resolve bases under props from neighbours
    for (let pass = 0; pass < 4; pass++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (base[i]) continue;
        const wallProp = prop[i] === 'torch';
        const cnt = {};
        for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const b = base[Y * w + X];
          if (!b) continue;
          const td = Tiles.def(b);
          if (wallProp ? WALLISH.has(b) && b !== 'void' : (td && td.walk && b !== 'door' && b !== 'stairs_up' && b !== 'stairs_down')) cnt[b] = (cnt[b] || 0) + 1;
        }
        const best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
        if (best) base[i] = best;
        else if (pass === 3) base[i] = wallProp ? 'cwall' : (def.floor || 'grass');
      }
    }
    const set = (x, y, t) => { const i = y * w + x; base[i] = t; prop[i] = null; };
    if (def.patch) def.patch(set);
    for (let i = 0; i < n; i++) if (base[i] === 'ldoor' && Game.flag('door:' + id + ':' + (i % w) + ',' + Math.floor(i / w))) base[i] = 'door';
    const m = { id, def, w, h, base, prop, vari, name: def.name };
    this.computeVariants(m);
    return m;
  },
  computeVariants(m) {
    const { w, h, base, vari } = m;
    const world = m.def.legend === 'world';
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : base[y * w + x]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, b = base[i];
      if (b === 'sea' || b === 'water' || b === 'cwater') {
        const land = (X, Y) => { const t = at(X, Y); if (t == null) return false; return !(WATERISH.has(t) || t === 'bridge'); };
        vari[i] = (land(x, y - 1) ? 1 : 0) | (land(x + 1, y) ? 2 : 0) | (land(x, y + 1) ? 4 : 0) | (land(x - 1, y) ? 8 : 0);
      } else if (b === 'grass') vari[i] = Math.floor(hash2(x, y, 5) * 4);
      else if (b === 'mountain') vari[i] = hash2(x, y, 9) < 0.5 ? 0 : 1;
      else if (Tiles.def(b) && Tiles.def(b).wall) {
        const s = at(x, y + 1);
        vari[i] = (s == null || WALLISH.has(s)) ? 0 : 1;
      } else if (b === 'bridge' && !world) vari[i] = 0;
    }
  },
  inside(m, x, y) { return x >= 0 && y >= 0 && x < m.w && y < m.h; },
  baseAt(m, x, y) { return this.inside(m, x, y) ? m.base[y * m.w + x] : null; },
  propAt(m, x, y) { return this.inside(m, x, y) ? m.prop[y * m.w + x] : null; },
  /* terrain passability (ignores NPCs) */
  passable(m, x, y) {
    if (!this.inside(m, x, y)) return !!m.def.exit;
    const b = m.base[y * m.w + x], p = m.prop[y * m.w + x];
    if (b === 'ldoor') return false;
    const bd = Tiles.def(b);
    if (!bd || !bd.walk) return false;
    if (p) { const pd = Tiles.def(p); if (pd && pd.block) return false; }
    return true;
  },
  isCounter(m, x, y) {
    if (!this.inside(m, x, y)) return false;
    const b = Tiles.def(m.base[y * m.w + x]), p = m.prop[y * m.w + x];
    return !!((b && b.counter) || (p && Tiles.def(p).counter));
  },
  zoneAt(m, x, y) {
    const def = m.def;
    if (!def.world) return def.zone || null;
    for (const z of def.zones) if (x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1) return z.z;
    return def.zoneDefault;
  },
  bgmAt(m, x, y) {
    for (const z of (m.def.bgmZones || [])) if (x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1) return z.bgm;
    if (m.def.nightBgm && Game.isNight()) return m.def.nightBgm;
    return m.def.bgm;
  },
};

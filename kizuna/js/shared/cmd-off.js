// 第71回: 「オートで 使わない 技」と「命令の 一覧に 出さない 技」を 分けた（家族の ねがい。docs/plan-r69-skill-menu.md）
//   char.autoOff … オート（主人公の オート・仲間の 作戦）で AIが 使わない 技（ai.js）。戦いの 技の 一覧からは 消さない
//   char.cmdOff  … 自分で 命令する とき（主人公・「めいれいさせろ」の 仲間）に 戦いの 技の 一覧に 出さない 技（client/battle.js の openCommand）
//   どちらも 技の id の 配列。同じ 名前の 技（大神官と 大賢者の ザオリク など）は いっしょに 入れる。フィールドで 使う 一覧は かわらない
//
// うつしかえ: 第69回では autoOff が 一覧からも 消していた。その 時の 決めた ことが きえない ように、
//   cmdOff が まだ ない（配列で ない）人は autoOff を そのまま cmdOff と みなす（cmdOffList）。
//   ロードの とき（world.js の normalizeChar）と、autoOff を かえる 前（services.js の autoSkill）に 1回だけ うつす（migrateCmdOff）
import { ABILITIES } from './data/abilities.js?v=1a37ffd1421f';

const ids = (x) => (Array.isArray(x) ? x.filter((id) => typeof id === 'string') : []);

// 今の「命令の 一覧に 出さない 技」（まだ うつして いない 人は autoOff）
export function cmdOffList(char) {
  if (!char) return [];
  return Array.isArray(char.cmdOff) ? ids(char.cmdOff) : ids(char.autoOff);
}

// cmdOff が ない 人に autoOff を うつす（autoOff は その まま）。うつした ときは true
//   autoOff も ない 人は なにも しない（cmdOffList が 空を かえす。autoOff を かえる 前に もう一度 よばれる）
export function migrateCmdOff(char) {
  if (!char || typeof char !== 'object' || Array.isArray(char.cmdOff)) return false;
  if (!Array.isArray(char.autoOff) || !char.autoOff.length) return false;
  char.cmdOff = ids(char.autoOff);
  return true;
}

// autoOff を かえる 前に（サーバーの autoSkill）: cmdOff を 今の 中身で かならず 配列に する（空でも）。
//   そう しないと、cmdOff の ない 人は あとから かえた autoOff が 命令の 一覧にも きいて しまう
export function fixCmdOff(char) {
  if (char && typeof char === 'object' && !Array.isArray(char.cmdOff)) char.cmdOff = cmdOffList(char);
  return char;
}

// 自分・仲間（馬車・あずかり所も）の ぶん まとめて
export function migrateCmdOffAll(c) {
  if (!c) return;
  migrateCmdOff(c);
  for (const e of [...(Array.isArray(c.companions) ? c.companions : []), ...(Array.isArray(c.storage) ? c.storage : [])]) migrateCmdOff(e?.char);
}

// list の 技と、同じ 名前の 技（abilities の 中から）を ぜんぶ（autoOffFor・cmdOffFor）
export function sameNameOff(list, abilities) {
  if (!Array.isArray(list) || !list.length) return [];
  const names = new Set(list.map((id) => ABILITIES[id]?.name).filter(Boolean));
  return (abilities || []).filter((id) => list.includes(id) || names.has(ABILITIES[id]?.name));
}

// メニューの 切りかえ（サーバーの autoSkill・cmdSkill）。cur: 今の 配列 / learned: 覚えている 技 / op: 'on'（使う・出す）・'off'・'all'（全部 もどす）
//   もどりち: あたらしい 配列（だめな ときは null）
export function toggleOffList(cur, learned, op, id) {
  const off = new Set(ids(cur));
  if (op === 'all') off.clear();
  else {
    if (op !== 'on' && op !== 'off') return null;
    const k = String(id || '');
    if (!ABILITIES[k] || !learned.includes(k)) return null;
    // 同じ 名前の 技は いっしょに（第41回）
    for (const x of learned.filter((y) => ABILITIES[y]?.name === ABILITIES[k].name)) {
      if (op === 'off') off.add(x);
      else off.delete(x);
    }
  }
  return [...off].filter((x) => ABILITIES[x]).slice(0, 200);
}

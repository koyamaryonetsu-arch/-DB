// 家族の パーティーで まものが なかまに なった とき、いっしょに 戦った 家族の 酒場にも 同じ しゅるいの まものを
//
// ・受け取る 人（今の しくみ: 戦いに 出ていた リーダー。いなければ 魔物に ふれた 人）は 今の まま
//   （パーティー → 馬車 → 酒場の じゅん。world.js の offerBefriend・scripts.js の 'befriend'）
// ・「はい」で 仲間に した ときだけ、その 戦いに 出ていた ほかの 家族（人）の キャラの 酒場に 入る
//   （パーティー・馬車は かえない。レベルは befriendLevel()・名前は その 人の 仲間と かさならない もの・＋値なし）
//   - 戦いに 出ていた 人 … 戦いの おわりの ctx.sids（とちゅうから かけつけた 人・馬車に 乗った 人・
//     通信が とぎれて オートで 戦っていた 人も）。同じ パーティーでも 戦いに 出ていない 人・オフラインの 人は 入らない
//   - 家族の キャラの「うつし」（サポートの 仲間）は 入れない（その 人は 遊んでいない。ひとりの 時と 同じに するため）
//   - 酒場が いっぱい（ROSTER_MAX）なら 入れない（今の しくみと 同じ。その 人に「いっぱいだった」と 知らせる）
// ・知らせ: 遊んでいる 人には その 場で（戦いの けっかを とじてから）。今 いない 人は c.tavernNews に のこし、
//   つぎに 入った ときに 出す（world.js の takeTavernNews）
import { MONSTERS } from '../data/monsters.js?v=b13027e590f9';
import { addMonsterEntry } from './party.js?v=b13027e590f9';

export const TAVERN_NEWS_MAX = 10;

// 戦いに 出ていた 家族（人）の キャラの id（受け取る 人を のぞく。同じ キャラは 1回）
export function befriendShare(sessions, receiver) {
  const out = [];
  for (const m of sessions || []) {
    const id = m?.charId;
    if (!id || m === receiver || id === receiver?.charId || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

// 今 遊んでいる（知らせが とどく）セッション
function liveSession(world, charId) {
  for (const m of world.sessions.values()) if (m.charId === charId && m.inWorld && m.conn && !m.away) return m;
  return null;
}

// 知らせの 文
export function tavernNewsText(n) {
  const sp = MONSTERS[n?.species]?.name || '魔物';
  const who = String(n?.who || '');
  if (n?.full) return `${sp}が${who}の仲間にもなりたそうだったが、\n酒場がいっぱいで入れなかった…\n（酒場でだれかと別れると入れるよ）`;
  const name = String(n?.name || sp);
  return `${name}が、ルミナの町の酒場で待っている！\n（${n?.from ? `${n.from}といっしょに戦った` : ''}${sp}が、${who}の仲間にもなった）`;
}

// 「はい」で 仲間に なった あと: 家族の 酒場にも 入れる。もどりち: { got: [入った 人], full: [いっぱいだった 人], spName }
export function shareBefriend(world, s, species, level, share) {
  const got = [], full = [];
  const spName = MONSTERS[species]?.name || '';
  if (!Array.isArray(share) || !share.length || !spName) return { got, full, spName };
  const from = s?.char?.name || '';
  for (const id of share) {
    const c = world.data.characters[id];
    if (!c || c === s?.char) continue;
    const r = addMonsterEntry(c, species, level);
    if (!r.ok && !r.full) continue;
    const note = r.ok ? { species, name: r.name, from, who: c.name } : { species, from, who: c.name, full: true };
    (r.ok ? got : full).push(c.name);
    const m = liveSession(world, id);
    if (m) {
      world.send(m, { t: 'toast', text: tavernNewsText(note), afterBattle: true, sfx: r.ok ? 'join' : null });
      world.sendSelf(m);
    } else {
      const list = Array.isArray(c.tavernNews) ? c.tavernNews : [];
      c.tavernNews = [...list, note].slice(-TAVERN_NEWS_MAX);
    }
  }
  if (got.length || full.length) world.markDirty();
  return { got, full, spName };
}

// のこっている 知らせを 文に して けす（入った とき・つなぎなおした とき）
export function takeTavernNews(c) {
  if (!c || c.tavernNews === undefined) return [];
  const list = Array.isArray(c.tavernNews) ? c.tavernNews : [];
  delete c.tavernNews;
  return list.filter((n) => n && typeof n === 'object').map(tavernNewsText);
}

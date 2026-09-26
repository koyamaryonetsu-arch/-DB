// セーブデータの バージョンと ひきつぎ
//
// やくそく（これからも ずっと まもる こと）
// ・あたらしい ゲームは、むかしの セーブを かならず 読める。形を かえた ときは UPGRADES に 手順を たす
// ・知らない 項目や 知らない 品物・職業・モンスターは けさずに とっておく（stash）。
//   あとで その ゲームが 知っている ものに なったら もとに もどす
// ・品物・職業・モンスター・マップの ID は けさない・なまえを かえない
import { ITEMS, SLOTS } from '../data/items.js?v=cb6fd0fb30e1';
import { JOBS } from '../data/jobs.js?v=cb6fd0fb30e1';
import { MONSTERS } from '../data/monsters.js?v=cb6fd0fb30e1';
import { migrateJobs } from '../stats.js?v=cb6fd0fb30e1';

export const SAVE_VERSION = 2;

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const num = (v, d = 0) => (Number.isFinite(v) ? v : d);
// 'constructor' などを 品物や 職業と まちがえない
const known = (table, id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(table, id);

// バージョンごとの 手順（from の バージョンから 1つ 上げる）
const UPGRADES = {
  // 1 → 2: 職業レベル（勝った 数）・仲間・ゲスト・第2章。1人ずつの 手直しは repairChar が する
  1: (d) => {
    for (const c of Object.values(d.characters)) migrateJobs(c);
  },
};

// 知らない ものを しまう・知っている ものに なったら もどす
function stashOf(c) {
  c.stash = obj(c.stash);
  c.stash.items = Array.isArray(c.stash.items) ? c.stash.items : [];
  c.stash.keyItems = Array.isArray(c.stash.keyItems) ? c.stash.keyItems : [];
  c.stash.companions = Array.isArray(c.stash.companions) ? c.stash.companions : [];
  return c.stash;
}

function cleanStash(c) {
  const st = c.stash;
  if (st && !st.items.length && !st.keyItems.length && !st.companions.length && !st.job) delete c.stash;
}

// 1人ぶんを 読める 形に ととのえる（何回 よんでも おなじ けっか）
export function repairChar(c, id) {
  if (!c || typeof c !== 'object') return null;
  if (!c.id && id) c.id = id;
  c.name = typeof c.name === 'string' && c.name ? c.name : '勇者';
  c.level = Math.max(1, Math.floor(num(c.level, 1)));
  c.exp = Math.max(0, num(c.exp, 0));
  c.gold = Math.max(0, Math.floor(num(c.gold, 0)));
  c.hp = num(c.hp, 1);
  c.mp = num(c.mp, 0);
  for (const k of ['flags', 'chests', 'kills', 'quests', 'seeds', 'status', 'visited']) c[k] = obj(c[k]);
  if (!c.species && !Object.keys(c.visited).length) c.visited.village = true;
  const st = stashOf(c);

  // ふくろ（おなじ 品物は まとめる。知らない 品物は しまう）
  const bag = new Map();
  const put = (e) => {
    if (!e || typeof e.id !== 'string') return;
    const n = Math.max(0, Math.floor(num(e.n, 1)));
    if (!n) return;
    if (known(ITEMS, e.id)) bag.set(e.id, (bag.get(e.id) || 0) + n);
    else st.items.push({ id: e.id, n });
  };
  for (const e of Array.isArray(c.items) ? c.items : []) put(e);
  const unknown = st.items.splice(0);
  for (const e of unknown) put(e);
  c.items = [...bag].map(([iid, n]) => ({ id: iid, n }));

  // だいじな もの
  const keys = [...(Array.isArray(c.keyItems) ? c.keyItems : []), ...st.keyItems.splice(0)];
  c.keyItems = [];
  for (const k of keys) {
    if (typeof k !== 'string' || c.keyItems.includes(k) || st.keyItems.includes(k)) continue;
    (known(ITEMS, k) ? c.keyItems : st.keyItems).push(k);
  }

  // そうび（知らない そうびは ふくろの かわりに しまう）
  c.equip = obj(c.equip);
  for (const slot of SLOTS) {
    const eid = c.equip[slot];
    if (eid && !known(ITEMS, eid)) {
      st.items.push({ id: eid, n: 1 });
      c.equip[slot] = null;
    } else if (!eid) c.equip[slot] = null;
  }

  // 職業（知らない 職業なら 戦士に して、もとの 職業を おぼえておく）
  if (!c.species) {
    if (!known(JOBS, c.job)) {
      if (c.job && !st.job) st.job = c.job;
      c.job = 'warrior';
    } else if (st.job && known(JOBS, st.job)) {
      c.job = st.job;
      delete st.job;
    }
    c.jobs = obj(c.jobs);
    if (!c.jobs[c.job]) c.jobs[c.job] = { lv: 1, b: 0 };
  }

  // 仲間（知らない モンスターは しまう）
  if (Array.isArray(c.companions) || st.companions.length) {
    const all = [...(Array.isArray(c.companions) ? c.companions : []), ...st.companions.splice(0)];
    c.companions = [];
    for (const e of all) {
      if (!e || !e.key || !e.char) continue;
      if (e.kind === 'monster' && !known(MONSTERS, e.species || e.char.species)) st.companions.push(e);
      else {
        repairChar(e.char);
        c.companions.push(e);
      }
    }
  }
  cleanStash(c);
  return c;
}

// セーブ ぜんたいを 読める 形に（知らない 項目は そのまま のこす）
export function upgradeSave(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const hasChars = src.characters && typeof src.characters === 'object';
  const from = Number.isFinite(src.version) ? src.version : hasChars ? 1 : SAVE_VERSION;
  const d = { ...src };
  d.characters = hasChars ? { ...src.characters } : {};
  d.board = Array.isArray(src.board) ? src.board : [];
  d.createdAt = src.createdAt || Date.now();
  for (let v = from; v < SAVE_VERSION; v++) UPGRADES[v]?.(d);
  for (const [id, c] of Object.entries(d.characters)) {
    if (!repairChar(c, id)) delete d.characters[id];
    else migrateJobs(c);
  }
  // あたらしい ゲームで 作った セーブを 読んだ ときは、バージョンを 下げない
  d.version = Math.max(from, SAVE_VERSION);
  return { data: d, from };
}

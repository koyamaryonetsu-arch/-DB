// 夜の 町・村（maps/index.js が まぜる）
// ・'@night' は「夜の あいだ」の しるし（show の all / not に 書く。world.js と field.js が 時計で こたえる）
// ・ものがたりの 人・お店・宿屋・教会・たのまれごとの 人は 夜も そのまま（夜でも 物語は すすめられる）
import { npc } from './npc.js?v=0fa8b6566138';
import { PLACES } from './overworld.js?v=0fa8b6566138';
import { PORT } from './sea.js?v=0fa8b6566138';

const V = (x, y) => [PLACES.village.x + x, PLACES.village.y + y];
const TW = (x, y) => [PLACES.town.x + x, PLACES.town.y + y];
const SH = (x, y) => [PLACES.shrine.x + x, PLACES.shrine.y + y];
const P = (x, y) => [PORT.x + x, PORT.y + y];
const NIGHT = { all: ['@night'] };

// 夜は 家に 帰る 人（かわりに 夜の 人が 出る ことも ある）
export const NIGHT_HIDE = {
  overworld: ['v_girl', 'v_boy', 'v_farmer', 't_kid', 't_lady', 't_guard1', 't_guard2'],
  sea: ['port_kid', 'sailor'],
};

// 夜だけ 出る 人
export const NIGHT_NPCS = {
  overworld: [
    // ルミナの町: 夜の 門番・夜の 商人・夜ふかしの おじさん
    npc('n_guard1', '夜の門番', TW(21, 33), 'guard', 'night_guard', { show: NIGHT }),
    npc('n_guard2', '夜の門番', TW(26, 33), 'guard', 'night_guard', { show: NIGHT }),
    npc('night_merchant', '夜の商人', TW(19, 16), 'bard', 'night_merchant', { show: NIGHT, dir: 'right' }),
    npc('n_townsman', '夜ふかしのおじさん', TW(30, 20), 'farmer', 'night_townsfolk', { show: NIGHT, wander: 1 }),
    // ホシフル村の はずれ: ゆうれいの 女の子（オルゴールを さがしている）
    npc('night_ghost', 'ゆうれいの女の子', V(4, 22), 'ghost_girl', 'night_ghost', { show: { all: ['@night'], not: ['q_ghost_done'] } }),
    // 星見の丘: 夜だけ 光る オルゴール
    npc('night_glint', '光るもの', SH(2, 5), 'night_glint', 'night_glint', { show: { all: ['@night', 'q_ghost_start'], not: ['q_ghost_found'] }, solid: false }),
  ],
  sea: [
    npc('n_sailor', '夜の船乗り', P(27, 18), 'sailor', 'night_sailor', { show: NIGHT }),
  ],
};

// マップに 夜の 人を たす（maps/index.js の buildMaps から）
export function addNightNpcs(maps) {
  for (const [mid, ids] of Object.entries(NIGHT_HIDE)) {
    for (const n of maps[mid]?.npcs || []) {
      if (!ids.includes(n.id)) continue;
      n.show = { ...(n.show || {}), not: [...(n.show?.not || []), '@night'] };
    }
  }
  for (const [mid, list] of Object.entries(NIGHT_NPCS)) maps[mid]?.npcs.push(...list);
}

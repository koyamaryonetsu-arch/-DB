'use strict';
/* =====================================================================
 * gfx_tiles.js — procedural 16x16 tile art + tile properties
 *   base tiles are opaque; props are transparent and drawn over a base.
 * ===================================================================== */

const Tiles = (() => {
  const cache = new Map();

  /* tiny pixel painter bound to a 16x16 canvas */
  function painter(g) {
    const p = {
      g,
      px(x, y, c) { if (x < 0 || y < 0 || x > 15 || y > 15) return; g.fillStyle = c; g.fillRect(x, y, 1, 1); },
      rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); },
      fill(c) { g.fillStyle = c; g.fillRect(0, 0, 16, 16); },
      ell(cx, cy, rx, ry, c) {
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) p.px(x, y, c);
        }
      },
      speck(seed, list) { // list: [[color, density], ...]
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
          let h = hash2(x, y, seed), acc = 0;
          for (const [c, d] of list) { acc += d; if (h < acc) { p.px(x, y, c); break; } }
        }
      },
      ascii(rows, pal, ox = 0, oy = 0) {
        rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) p.px(ox + x, oy + y, c); } });
      },
    };
    return p;
  }
  function mk(fn) { const c = makeCanvas(16, 16); fn(painter(c.getContext('2d'))); return c; }

  /* ---------- reusable pieces ---------- */
  const C = {
    grass: '#58b848', grassD: '#40a040', grassL: '#80d068', grassDD: '#2c8030',
    tree: '#2c8c3c', treeD: '#186828', treeL: '#58b050', treeO: '#104818', trunk: '#784820',
    sea: '#2858c8', seaD: '#1c48a8', seaL: '#4c80e8', foam: '#d8f0f8', seaE: '#6aa0f0',
    sand: '#e0c880', sandD: '#c8a860', sandL: '#f0e0a8',
    rockL: '#c89868', rock: '#a07850', rockD: '#785838', rockO: '#503820', snow: '#f8f8f8', snowD: '#c0c8d8',
    stoneL: '#d8d8e0', stone: '#b0b4c0', stoneD: '#8a8e9c', stoneO: '#5c6070',
    woodL: '#d8a060', wood: '#b87838', woodD: '#885028', woodO: '#583018',
    dirt: '#c8a070', dirtD: '#b08858', dirtL: '#d8b888',
    swamp: '#6c5a90', swampD: '#56467a', swampL: '#9a88c0',
    roofR: '#d84830', roofRD: '#a02818', roofB: '#3868c8', roofBD: '#1c4498', roofO: '#c07028', roofOD: '#8c4c18',
    wallW: '#f0e8d8', wallWD: '#c8b898',
    dark: '#181018', black: '#000000', gold: '#f8d038', goldD: '#c08818', red: '#d83830',
  };

  function grassBase(p, v = 0) {
    p.fill(C.grass);
    p.speck(11 + v * 7, [[C.grassD, 0.05], [C.grassL, 0.035]]);
    // a few tufts
    const n = 2 + (v & 1);
    for (let i = 0; i < n; i++) {
      const x = 1 + Math.floor(hash2(i, v, 91) * 12), y = 2 + Math.floor(hash2(v, i, 37) * 11);
      p.px(x, y, C.grassDD); p.px(x + 2, y, C.grassDD); p.px(x + 1, y + 1, C.grassDD);
    }
  }
  function treeAt(p, cx, cy, r = 3.6) {
    p.rect(Math.round(cx) - 1, Math.round(cy + r - 1), 2, 3, C.trunk);
    p.ell(cx, cy, r + 0.8, r + 0.6, C.treeO);
    p.ell(cx, cy, r, r - 0.1, C.tree);
    p.ell(cx + 0.8, cy + 0.9, r * 0.75, r * 0.7, C.treeD);
    p.ell(cx - 0.3, cy - 0.3, r * 0.72, r * 0.68, C.tree);
    p.ell(cx - 1.2, cy - 1.3, r * 0.35, r * 0.3, C.treeL);
  }
  function waterBase(p, f, base, dark, light) {
    p.fill(base);
    for (let y = 0; y < 16; y += 4) {
      const off = ((y >> 2) * 5 + f * 2) % 16;
      for (let k = 0; k < 2; k++) {
        const x = (off + k * 8) % 16;
        p.px(x, y + 1, light); p.px((x + 1) % 16, y + 1, light); p.px((x + 2) % 16, y, light);
        p.px((x + 3) % 16, y, light); p.px((x + 4) % 16, y + 1, dark);
      }
    }
  }
  /* edges: bitmask N1 E2 S4 W8 where neighbour is land */
  function coastEdges(p, mask, foam, inner) {
    if (mask & 1) { p.rect(0, 0, 16, 1, foam); p.rect(0, 1, 16, 1, inner); }
    if (mask & 4) { p.rect(0, 15, 16, 1, foam); p.rect(0, 14, 16, 1, inner); }
    if (mask & 8) { p.rect(0, 0, 1, 16, foam); p.rect(1, 0, 1, 16, inner); }
    if (mask & 2) { p.rect(15, 0, 1, 16, foam); p.rect(14, 0, 1, 16, inner); }
  }

  /* ---------- tile definitions ----------
   * walk: passable, enc: encounter multiplier (world), bg: battle backdrop
   * wall: auto face/top variant, water: coast variant, anim: frames
   * prop: transparent overlay (block: blocks movement), light: glow radius at night */
  const D = {};

  /* ===== world ===== */
  D.grass = { walk: true, enc: 1, bg: 'plains', vars: 4, draw: (p, v) => grassBase(p, v) };
  D.forest = { walk: true, enc: 1.6, bg: 'forest', draw: p => { grassBase(p, 1); treeAt(p, 4.5, 5, 3.4); treeAt(p, 11.5, 4, 3.4); treeAt(p, 8, 11, 3.6); } };
  D.hills = {
    walk: true, enc: 1.8, bg: 'hills', draw: p => {
      grassBase(p, 2);
      const mound = (cx, cy, rx, ry) => {
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          const d = dx * dx + dy * dy;
          if (y + 0.5 <= cy && d <= 1) p.px(x, y, d > 0.72 ? '#3c8830' : (dx > 0.25 ? '#68b048' : '#88cc58'));
        }
      };
      mound(5.5, 9, 5.5, 5); mound(12, 14, 4.5, 4);
    },
  };
  D.mountain = {
    walk: false, bg: 'hills', vars: 2, draw: (p, v) => {
      grassBase(p, 3);
      const apx = v ? 9 : 7.5;
      for (let y = 1; y < 16; y++) {
        const half = (y - 0.5) * 0.56 + 0.3;
        for (let x = 0; x < 16; x++) {
          const dx = x + 0.5 - apx;
          if (Math.abs(dx) <= half) {
            let c = dx < -0.2 ? C.rockL : C.rock;
            if (dx > half * 0.35) c = C.rockD;
            if (Math.abs(dx) > half - 0.9) c = C.rockO;
            if (y < 5 && Math.abs(dx) < half - 0.6) c = dx < 0.3 ? C.snow : C.snowD;
            p.px(x, y, c);
          }
        }
      }
      // ridge lines
      p.px(Math.round(apx) - 2, 9, C.rockD); p.px(Math.round(apx) - 3, 11, C.rockD); p.px(Math.round(apx) + 1, 8, C.rockO);
    },
  };
  D.sea = { walk: false, water: true, anim: 2, bg: 'sea', draw: (p, v, f) => { waterBase(p, f, C.sea, C.seaD, C.seaL); coastEdges(p, v, C.foam, C.seaE); } };
  D.desert = { walk: true, enc: 1.3, bg: 'desert', draw: p => { p.fill(C.sand); p.speck(5, [[C.sandD, 0.06], [C.sandL, 0.05]]); p.rect(3, 6, 4, 1, C.sandD); p.rect(9, 12, 4, 1, C.sandD); } };
  D.swamp = {
    walk: true, enc: 1.2, bg: 'swamp', damage: 1, draw: p => {
      p.fill(C.swamp); p.speck(8, [[C.swampD, 0.12], [C.swampL, 0.02]]);
      const bub = (x, y) => { p.px(x, y - 1, C.swampL); p.px(x - 1, y, C.swampL); p.px(x + 1, y, C.swampL); p.px(x, y + 1, C.swampD); };
      bub(4, 4); bub(11, 9); bub(6, 12);
    },
  };
  D.bridge = {
    walk: true, enc: 0.6, bg: 'plains', anim: 2, draw: (p, v, f) => {
      waterBase(p, f, C.sea, C.seaD, C.seaL);
      if (v === 1) { // vertical bridge (travel N-S)
        p.rect(2, 0, 12, 16, C.wood);
        for (let y = 1; y < 16; y += 3) p.rect(2, y, 12, 1, C.woodD);
        p.rect(2, 0, 1, 16, C.woodO); p.rect(13, 0, 1, 16, C.woodO);
        p.rect(3, 0, 1, 16, C.woodL);
      } else {
        p.rect(0, 2, 16, 12, C.wood);
        for (let x = 1; x < 16; x += 3) p.rect(x, 2, 1, 12, C.woodD);
        p.rect(0, 2, 16, 1, C.woodO); p.rect(0, 13, 16, 1, C.woodO);
        p.rect(0, 3, 16, 1, C.woodL);
      }
    },
  };
  D.castle = {
    walk: true, enc: 0, bg: 'plains', draw: p => {
      grassBase(p, 0);
      p.rect(2, 7, 12, 9, C.stone); p.rect(2, 7, 12, 1, C.stoneL);
      for (let x = 2; x < 14; x += 2) p.rect(x, 6, 1, 1, C.stone);
      const tower = x => {
        p.rect(x, 4, 4, 12, C.stone); p.rect(x + 3, 4, 1, 12, C.stoneD); p.rect(x, 4, 1, 12, C.stoneL);
        p.rect(x + 1, 1, 2, 1, C.roofBD); p.rect(x, 2, 4, 1, C.roofB); p.rect(x - 1, 3, 6, 1, C.roofB); p.rect(x + 2, 2, 2, 2, C.roofBD);
        p.px(x + 1, 7, C.dark); p.px(x + 2, 7, C.dark);
      };
      tower(1); tower(11);
      p.rect(6, 3, 4, 13, C.stoneL); p.rect(9, 3, 1, 13, C.stoneD);
      p.rect(6, 1, 4, 2, C.roofR); p.px(7, 0, C.roofR); p.px(8, 0, C.roofRD);
      p.rect(7, 11, 2, 5, C.dark); p.rect(6, 12, 1, 4, C.stoneO); p.rect(9, 12, 1, 4, C.stoneO);
      p.px(7, 6, C.dark); p.px(8, 6, C.dark);
      p.rect(2, 15, 12, 1, C.stoneO);
    },
  };
  D.town = {
    walk: true, enc: 0, bg: 'plains', draw: p => {
      grassBase(p, 1);
      const house = (x, y, roof, roofD) => {
        p.rect(x, y + 3, 6, 4, C.wallW); p.rect(x, y + 6, 6, 1, C.wallWD);
        for (let i = 0; i < 3; i++) p.rect(x + i, y + 2 - i, 6 - i * 2, 1, i === 0 ? roofD : roof);
        p.rect(x - 1, y + 2, 8, 1, roofD);
        p.px(x + 2, y + 5, C.woodO); p.px(x + 2, y + 4, C.woodO);
        p.px(x + 4, y + 4, '#58a0e8');
      };
      house(1, 2, C.roofR, C.roofRD); house(9, 1, C.roofB, C.roofBD); house(5, 8, C.roofR, C.roofRD);
    },
  };
  D.village = {
    walk: true, enc: 0, bg: 'plains', draw: p => {
      grassBase(p, 2);
      const hut = (x, y) => {
        p.rect(x, y + 3, 6, 4, '#e0c8a0'); p.rect(x, y + 6, 6, 1, '#b09070');
        for (let i = 0; i < 3; i++) p.rect(x + i - 1, y + 2 - i, 8 - i * 2, 1, i === 0 ? C.roofOD : C.roofO);
        p.px(x + 3, y + 5, C.woodO); p.px(x + 3, y + 4, C.woodO);
      };
      hut(2, 3); hut(8, 8);
      treeAt(p, 12.5, 4, 2.6);
    },
  };
  D.tower = {
    walk: true, enc: 0, bg: 'plains', draw: p => {
      grassBase(p, 3);
      p.rect(4, 2, 8, 14, C.stone); p.rect(4, 2, 2, 14, C.stoneL); p.rect(10, 2, 2, 14, C.stoneD);
      for (let x = 4; x < 12; x += 2) p.rect(x, 1, 1, 1, C.stone);
      p.rect(3, 2, 10, 1, C.stoneO);
      for (let y = 5; y < 14; y += 3) for (let x = 4; x < 12; x += 3) p.px(x + ((y / 3) & 1), y, C.stoneD);
      p.rect(7, 4, 2, 2, C.dark); p.rect(7, 8, 2, 2, C.dark);
      p.rect(7, 12, 2, 4, C.dark); p.px(6, 13, C.stoneO); p.px(9, 13, C.stoneO);
    },
  };
  D.cave = {
    walk: true, enc: 0, bg: 'cave', draw: p => {
      grassBase(p, 0);
      p.ell(8, 10, 7.5, 6.5, C.rockO); p.ell(8, 10, 6.8, 5.8, C.rock); p.ell(6.5, 8.5, 4, 3, C.rockL);
      p.ell(8, 13.5, 3.2, 3.5, C.dark); p.rect(5, 14, 6, 2, C.dark);
      p.px(3, 7, C.rockD); p.px(12, 9, C.rockD); p.px(11, 6, C.rockD);
    },
  };
  D.shrine = {
    walk: true, enc: 0, bg: 'plains', draw: p => {
      grassBase(p, 1);
      p.rect(3, 7, 10, 8, C.wallW); p.rect(3, 14, 10, 1, C.wallWD); p.rect(12, 7, 1, 8, C.wallWD);
      for (let i = 0; i < 6; i++) p.rect(2 + i, 6 - i, 12 - i * 2, 1, i % 2 ? C.roofB : C.roofBD);
      p.rect(7, 10, 2, 5, C.dark);
      p.px(8, 0, C.gold);
    },
  };
  D.sea_deep = { walk: false, water: true, anim: 2, bg: 'sea', draw: (p, v, f) => { waterBase(p, f, C.seaD, '#123888', C.sea); coastEdges(p, v, C.foam, C.seaE); } };

  /* ===== town ===== */
  D.ground = { walk: true, bg: 'plains', draw: p => { p.fill(C.dirt); p.speck(21, [[C.dirtD, 0.07], [C.dirtL, 0.05]]); } };
  D.path = {
    walk: true, bg: 'plains', draw: p => {
      p.fill('#8c8680');
      const stones = [[0, 0, 7, 4], [8, 0, 8, 4], [0, 5, 4, 5], [5, 5, 7, 5], [13, 5, 3, 5], [0, 11, 6, 5], [7, 11, 9, 5]];
      stones.forEach(([x, y, w, h], i) => {
        p.rect(x, y, w - 1, h - 1, i % 2 ? '#b4aea6' : '#aaa49c');
        p.rect(x, y, w - 1, 1, '#c8c2ba');
        p.rect(x + w - 2, y + 1, 1, h - 2, '#98928a');
      });
    },
  };
  D.floor = {
    walk: true, bg: 'indoor', draw: p => {
      p.fill(C.wood);
      for (let y = 0; y < 16; y += 4) {
        p.rect(0, y + 3, 16, 1, C.woodD);
        const s = ((y / 4) * 7) % 16;
        p.rect(s, y, 1, 3, C.woodD);
        p.rect(0, y, 16, 1, '#c88a48');
      }
      p.px(5, 6, C.woodD); p.px(12, 13, C.woodD);
    },
  };
  D.stone = {
    walk: true, bg: 'indoor', draw: p => {
      p.fill(C.stone);
      p.rect(0, 0, 16, 1, C.stoneD); p.rect(0, 8, 16, 1, C.stoneD);
      p.rect(0, 0, 1, 8, C.stoneD); p.rect(8, 8, 1, 8, C.stoneD);
      p.rect(1, 1, 15, 1, C.stoneL); p.rect(1, 9, 7, 1, C.stoneL); p.rect(9, 9, 7, 1, C.stoneL);
      p.speck(33, [['#a4a8b4', 0.06]]);
    },
  };
  D.carpet = {
    walk: true, bg: 'indoor', draw: p => {
      p.fill('#c03038');
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 8 === 0 || (x - y + 16) % 8 === 0) p.px(x, y, '#a82030');
      p.speck(5, [['#d04850', 0.03]]);
    },
  };
  D.bluecarpet = { walk: true, bg: 'indoor', draw: p => { p.fill('#3050a8'); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 8 === 0 || (x - y + 16) % 8 === 0) p.px(x, y, '#284090'); } };
  D.black = { walk: false, draw: p => p.fill('#000') };
  D.water = {
    walk: false, water: true, anim: 2, bg: 'sea', draw: (p, v, f) => {
      waterBase(p, f, '#3470d0', '#2458b0', '#6aa0f0');
      coastEdges(p, v, '#c8ccd8', '#8a8e9c');
    },
  };
  /* auto walls: v=0 top (wall continues south), v=1 face (open below) */
  function brickFace(p, base, mortar, light, shadow, h = 16) {
    p.rect(0, 0, 16, h, base);
    for (let y = 0; y < h; y += 4) {
      p.rect(0, y + 3, 16, 1, mortar);
      const off = (y / 4) % 2 ? 4 : 0;
      for (let x = off; x < 16; x += 8) p.rect(x, y, 1, 3, mortar);
      p.rect(0, y, 16, 1, light);
    }
    p.rect(0, h - 2, 16, 2, shadow);
  }
  D.wall = {
    walk: false, wall: true, draw: (p, v) => {
      if (v === 0) { p.fill('#6a5646'); p.speck(3, [['#7c6858', 0.2], ['#5a4838', 0.12]]); p.rect(0, 15, 16, 1, '#544232'); return; }
      p.rect(0, 0, 16, 3, '#6a5646'); p.rect(0, 2, 16, 1, '#8a7462');
      brickFace({ rect: (x, y, w, h, c) => p.rect(x, y + 3, w, h, c) }, '#d8c8a8', '#a89878', '#e8dcc0', '#8a7860', 13);
    },
  };
  D.cwall = {
    walk: false, wall: true, draw: (p, v) => {
      if (v === 0) { p.fill('#4c5262'); p.speck(4, [['#5a6072', 0.2], ['#3e4454', 0.1]]); p.rect(0, 15, 16, 1, '#3a3e4c'); return; }
      p.rect(0, 0, 16, 3, '#4c5262'); p.rect(0, 2, 16, 1, '#727a8c');
      brickFace({ rect: (x, y, w, h, c) => p.rect(x, y + 3, w, h, c) }, '#a0a8b8', '#707888', '#b8c0cc', '#606878', 13);
    },
  };
  D.door = {
    walk: true, bg: 'indoor', draw: p => {
      p.fill('#4c5262');
      p.rect(2, 1, 12, 15, C.woodO); p.rect(3, 2, 10, 14, C.wood);
      for (let x = 5; x < 13; x += 3) p.rect(x, 2, 1, 14, C.woodD);
      p.rect(3, 2, 10, 1, C.woodL); p.px(11, 9, C.gold); p.px(11, 10, C.goldD);
    },
  };
  D.ldoor = {
    walk: true, bg: 'indoor', draw: p => {
      D.door.draw(p);
      p.rect(3, 5, 10, 2, '#707888'); p.rect(3, 11, 10, 2, '#707888');
      p.rect(7, 7, 3, 4, '#c0c8d0'); p.px(8, 8, '#181018'); p.px(8, 9, '#181018');
    },
  };
  D.counter = {
    walk: false, counter: true, draw: p => {
      p.fill(C.woodD);
      p.rect(0, 0, 16, 7, C.wood); p.rect(0, 0, 16, 1, C.woodL); p.rect(0, 6, 16, 1, C.woodO);
      p.rect(0, 7, 16, 9, '#8c5a30');
      for (let x = 3; x < 16; x += 5) p.rect(x, 8, 1, 8, C.woodO);
      p.rect(0, 15, 16, 1, C.woodO);
    },
  };
  D.stairs_down = {
    walk: true, bg: 'indoor', draw: p => {
      p.fill('#383040');
      const cols = ['#a09aa8', '#88828e', '#706a78', '#58525e', '#403a48'];
      for (let i = 0; i < 5; i++) p.rect(1 + i, 1 + i * 3, 14 - i * 2, 2, cols[i]);
      p.rect(0, 0, 16, 1, '#282030'); p.rect(0, 0, 1, 16, '#282030'); p.rect(15, 0, 1, 16, '#282030');
    },
  };
  D.stairs_up = {
    walk: true, bg: 'indoor', draw: p => {
      p.fill('#686270');
      const cols = ['#e0dae8', '#c8c2d0', '#b0aab8', '#98929e', '#807a88'];
      for (let i = 0; i < 5; i++) { p.rect(1, 1 + i * 3, 14, 2, cols[i]); p.rect(1, 3 + i * 3, 14, 1, '#58525e'); }
      p.rect(0, 0, 1, 16, '#484250'); p.rect(15, 0, 1, 16, '#484250');
    },
  };
  /* ===== dungeon ===== */
  D.cfloor = { walk: true, bg: 'cave', draw: p => { p.fill('#5c4a3a'); p.speck(17, [['#6e5a48', 0.08], ['#48382a', 0.08], ['#7a6652', 0.015]]); } };
  D.rock = {
    walk: false, wall: true, draw: (p, v) => {
      if (v === 0) { p.fill('#2e241c'); p.speck(9, [['#46382a', 0.18], ['#221a14', 0.1]]); return; }
      p.fill('#6a543e');
      for (let x = 0; x < 16; x++) { const h = hash2(x, 3, 71); if (h < 0.3) p.rect(x, 3 + Math.floor(h * 20) % 9, 1, 3, '#54402e'); }
      p.rect(0, 0, 16, 3, '#2e241c'); p.rect(0, 3, 16, 1, '#86705a');
      p.speck(29, [['#7a624a', 0.06], ['#54402e', 0.06]]);
      p.rect(0, 14, 16, 2, '#3a2c20');
    },
  };
  D.tfloor = {
    walk: true, bg: 'tower', draw: p => {
      p.fill('#7c8494');
      p.rect(0, 7, 16, 1, '#646c7c'); p.rect(0, 15, 16, 1, '#646c7c'); p.rect(7, 0, 1, 7, '#646c7c'); p.rect(3, 8, 1, 7, '#646c7c'); p.rect(12, 8, 1, 7, '#646c7c');
      p.rect(0, 0, 7, 1, '#9098a8'); p.rect(8, 0, 8, 1, '#9098a8'); p.rect(4, 8, 8, 1, '#9098a8');
    },
  };
  D.twall = {
    walk: false, wall: true, draw: (p, v) => {
      if (v === 0) { p.fill('#383848'); p.speck(6, [['#444458', 0.2], ['#2c2c3a', 0.1]]); return; }
      p.rect(0, 0, 16, 3, '#383848'); p.rect(0, 2, 16, 1, '#6c6a80');
      brickFace({ rect: (x, y, w, h, c) => p.rect(x, y + 3, w, h, c) }, '#9a98ac', '#6c6a80', '#b0aec0', '#5c5a70', 13);
    },
  };
  D.twindow = {
    walk: false, draw: p => {
      D.twall.draw(p, 1);
      p.rect(5, 5, 6, 8, '#484660'); p.rect(6, 6, 4, 6, '#78b8f8'); p.rect(6, 5, 4, 1, '#484660');
      p.rect(6, 10, 4, 2, '#3c7ad8'); p.px(7, 7, '#f8f8f8'); p.px(8, 7, '#f8f8f8'); p.px(8, 6, '#d8e8f8');
    },
  };
  D.cwater = { walk: false, water: true, anim: 2, bg: 'cave', draw: (p, v, f) => { waterBase(p, f, '#24406c', '#1a3058', '#3c64a0'); coastEdges(p, v, '#6a543e', '#3a2c20'); } };
  D.sealed = {
    walk: false, draw: p => {
      p.fill('#7a6048');
      const rocks = [[1, 1, 7, 6], [8, 0, 7, 7], [0, 7, 5, 8], [5, 7, 7, 5], [12, 7, 4, 8], [5, 12, 7, 4]];
      rocks.forEach(([x, y, w, h]) => { p.rect(x, y, w, h, '#96785a'); p.rect(x, y, w, 1, '#b09070'); p.rect(x + w - 1, y, 1, h, '#5c4630'); p.rect(x, y + h - 1, w, 1, '#4a3826'); });
      const crack = [[8, 2], [8, 3], [7, 4], [7, 5], [8, 6], [9, 7], [9, 8], [8, 9], [7, 10], [7, 11], [6, 12]];
      crack.forEach(([x, y]) => p.px(x, y, '#241a12'));
      p.px(10, 8, '#241a12'); p.px(11, 9, '#241a12'); p.px(6, 5, '#241a12');
    },
  };
  D.rubble = { walk: true, bg: 'cave', draw: p => { D.cfloor.draw(p); const r = [[3, 4], [10, 3], [6, 10], [12, 11], [2, 12]]; r.forEach(([x, y]) => { p.rect(x, y, 2, 2, '#8a7058'); p.px(x, y, '#a88a6c'); p.px(x + 1, y + 1, '#4a3826'); }); } };
  D.gate = {
    walk: true, anim: 4, bg: 'cave', draw: (p, v, f) => {
      D.cfloor.draw(p);
      p.ell(8, 8.5, 7.5, 6.5, '#8890a0'); p.ell(8, 8.5, 6.5, 5.5, '#c0c8d0');
      p.ell(8, 8.5, 5.5, 4.6, '#1c3cb0');
      for (let i = 0; i < 18; i++) {
        const a = i * 0.7 + f * 0.8, r = 0.6 + i * 0.26;
        const x = 8 + Math.cos(a) * r, y = 8.5 + Math.sin(a) * r * 0.82;
        p.px(Math.floor(x), Math.floor(y), i % 3 ? '#58a0f8' : '#e0f0ff');
      }
    },
  };
  D.void = { walk: false, draw: p => p.fill('#000') };

  /* ===== props (transparent, drawn over a base tile) ===== */
  const P = {};
  P.tree = { block: true, draw: p => { treeAt(p, 8, 7, 6); } };
  P.bush = { block: true, draw: p => { p.ell(8, 10, 6.5, 5, C.treeO); p.ell(8, 10, 5.6, 4.2, C.tree); p.ell(7, 9, 3.5, 2.5, C.treeL); p.px(5, 11, C.treeD); p.px(10, 12, C.treeD); } };
  P.flowers = {
    block: false, draw: p => {
      const fl = [[3, 3, '#f85848'], [10, 2, '#f8d038'], [6, 8, '#f8f8f8'], [13, 9, '#f85848'], [2, 12, '#f8d038'], [9, 13, '#f890b8']];
      fl.forEach(([x, y, c]) => { p.px(x, y - 1, c); p.px(x - 1, y, c); p.px(x + 1, y, c); p.px(x, y + 1, c); p.px(x, y, '#f8f080'); p.px(x + 1, y + 2, C.grassDD); });
    },
  };
  P.fence = {
    block: true, draw: p => {
      p.rect(0, 5, 16, 2, C.wood); p.rect(0, 10, 16, 2, C.wood); p.rect(0, 7, 16, 1, C.woodO); p.rect(0, 12, 16, 1, C.woodO);
      [1, 7, 13].forEach(x => { p.rect(x, 3, 2, 12, C.woodL); p.rect(x + 1, 3, 1, 12, C.woodD); p.rect(x, 14, 2, 1, C.woodO); });
    },
  };
  P.barrel = {
    block: true, search: true, draw: p => {
      p.ell(8, 9, 6.5, 6.5, C.woodO); p.ell(8, 9, 5.6, 5.6, C.wood); p.ell(7.3, 8.3, 4, 4, C.woodL);
      p.rect(2, 6, 12, 1, '#584020'); p.rect(2, 11, 12, 1, '#584020');
      p.ell(8, 9, 2.4, 2.2, C.woodD);
    },
  };
  P.pot = {
    block: true, search: true, draw: p => {
      p.ell(8, 10, 6, 5.5, '#6a3818'); p.ell(8, 10, 5.2, 4.8, '#c87848'); p.ell(6.8, 8.8, 2.6, 2.2, '#e8a070');
      p.ell(8, 5.5, 3.4, 2, '#6a3818'); p.ell(8, 5.5, 2.6, 1.3, '#281008');
    },
  };
  P.crate = {
    block: true, search: true, draw: p => {
      p.rect(2, 3, 12, 12, C.woodO); p.rect(3, 4, 10, 10, C.wood);
      p.rect(3, 4, 10, 1, C.woodL); p.rect(3, 8, 10, 1, C.woodD);
      for (let i = 0; i < 10; i++) p.px(3 + i, 4 + i, C.woodD);
    },
  };
  P.shelf = {
    block: true, search: true, draw: p => {
      p.rect(1, 0, 14, 16, C.woodO); p.rect(2, 1, 12, 14, '#6a4020');
      const cols = ['#d83830', '#3878f8', '#48b848', '#f8d038', '#9050c8', '#f89838'];
      for (let row = 0; row < 3; row++) {
        const y = 2 + row * 5;
        for (let x = 2; x < 14; x++) { const c = cols[Math.floor(hash2(x, row, 5) * cols.length)]; p.rect(x, y, 1, 3 + (hash2(x, row, 9) > 0.7 ? 0 : 0), c); }
        p.rect(2, y + 3, 12, 1, C.wood);
      }
    },
  };
  P.table = {
    block: true, draw: p => {
      p.rect(1, 4, 14, 9, C.woodO); p.rect(2, 5, 12, 7, C.wood); p.rect(2, 5, 12, 1, C.woodL);
      p.rect(2, 13, 2, 2, C.woodO); p.rect(12, 13, 2, 2, C.woodO);
      p.ell(6, 8, 1.6, 1.4, '#f8f8f8'); p.ell(10.5, 8.5, 1.2, 1.2, '#e8c040');
    },
  };
  P.bed = {
    block: true, draw: p => {
      p.rect(2, 0, 12, 16, C.woodO); p.rect(3, 1, 10, 14, '#f0f0f0');
      p.rect(4, 2, 8, 3, '#ffffff'); p.rect(4, 4, 8, 1, '#c8c8d0');
      p.rect(3, 6, 10, 9, '#3878f8'); p.rect(3, 6, 10, 1, '#90c0f8'); p.rect(12, 7, 1, 8, '#1848b0');
      p.rect(3, 10, 10, 1, '#2860d8');
    },
  };
  P.chest = {
    block: true, draw: (p, v) => {
      if (v === 1) { // opened
        p.rect(2, 7, 12, 8, C.woodO); p.rect(3, 8, 10, 6, '#281008');
        p.rect(2, 3, 12, 4, C.woodO); p.rect(3, 4, 10, 2, C.wood);
        p.rect(2, 14, 12, 1, C.goldD); return;
      }
      p.rect(2, 4, 12, 11, C.woodO); p.rect(3, 5, 10, 9, C.wood); p.rect(3, 5, 10, 3, '#c88848'); p.rect(3, 5, 10, 1, C.woodL);
      p.rect(3, 8, 10, 1, C.goldD); p.rect(2, 8, 12, 1, C.goldD);
      p.rect(7, 7, 2, 4, C.gold); p.px(7, 9, C.goldD); p.px(8, 10, '#181018');
      p.rect(3, 13, 10, 1, C.woodD);
    },
  };
  P.well = {
    block: true, draw: p => {
      p.ell(8, 9, 7, 6.5, C.stoneO); p.ell(8, 9, 6.3, 5.8, C.stone); p.ell(7, 8, 4.8, 4.2, C.stoneL);
      p.ell(8, 9.5, 4, 3.6, '#101828'); p.ell(8.5, 10, 2.5, 2, '#20385c');
    },
  };
  P.pillar = {
    block: true, draw: p => {
      p.rect(3, 0, 10, 3, C.stoneD); p.rect(3, 0, 10, 1, C.stoneL);
      p.rect(4, 3, 8, 11, C.stone); p.rect(4, 3, 2, 11, C.stoneL); p.rect(10, 3, 2, 11, C.stoneD);
      p.rect(3, 13, 10, 3, C.stoneD); p.rect(3, 15, 10, 1, C.stoneO);
    },
  };
  P.throne = {
    block: true, draw: p => {
      p.rect(3, 0, 10, 15, C.goldD); p.rect(4, 1, 8, 13, C.gold);
      p.rect(5, 2, 6, 8, '#c03038'); p.rect(5, 2, 6, 1, '#e05058');
      p.rect(3, 10, 10, 5, C.goldD); p.rect(4, 10, 8, 3, '#c03038');
      p.px(8, 0, '#f8f8f8'); p.px(7, 0, '#3878f8');
    },
  };
  P.torch = {
    block: true, anim: 2, light: 40, draw: (p, v, f) => {
      p.rect(7, 8, 2, 6, C.woodO); p.rect(6, 7, 4, 2, '#606878');
      const fl = f ? [[7, 2], [8, 3], [6, 4], [7, 4], [8, 4], [9, 5], [7, 5], [8, 5], [7, 6], [8, 6]] : [[8, 2], [7, 3], [7, 4], [8, 4], [9, 4], [6, 5], [7, 5], [8, 5], [7, 6], [8, 6]];
      fl.forEach(([x, y], i) => p.px(x, y, i < 3 ? '#f8f080' : i < 7 ? '#f89838' : '#e84830'));
    },
  };
  P.lamp = {
    block: true, light: 44, draw: p => {
      p.rect(7, 5, 2, 10, '#3a3e4c'); p.rect(6, 14, 4, 2, '#3a3e4c');
      p.rect(5, 1, 6, 5, '#3a3e4c'); p.rect(6, 2, 4, 3, '#f8e070'); p.px(7, 2, '#fff8c0');
    },
  };
  const signIcon = {
    weapon: p => { p.rect(7, 3, 2, 6, '#e0e8f0'); p.rect(5, 8, 6, 1, C.goldD); p.rect(7, 9, 2, 2, C.woodO); p.px(8, 3, '#a0a8b8'); },
    armor: p => { p.rect(5, 3, 6, 5, '#e0e8f0'); p.rect(6, 8, 4, 1, '#e0e8f0'); p.px(7, 9, '#e0e8f0'); p.px(8, 9, '#a0a8b8'); p.rect(7, 4, 2, 3, '#d83830'); },
    item: p => { p.ell(8, 7, 3.2, 3.2, '#48b848'); p.rect(7, 2, 2, 2, '#e0e8f0'); p.px(7, 6, '#98e070'); },
    inn: p => { p.rect(4, 6, 8, 3, '#e0e8f0'); p.rect(4, 5, 2, 2, '#f8f8f8'); p.rect(4, 8, 1, 2, C.woodO); p.rect(11, 8, 1, 2, C.woodO); p.rect(6, 6, 6, 2, '#3878f8'); },
    church: p => { p.rect(7, 2, 2, 8, C.gold); p.rect(5, 4, 6, 2, C.gold); },
    bar: p => { p.rect(5, 4, 5, 6, C.gold); p.rect(5, 4, 5, 2, '#f8f8f8'); p.rect(10, 5, 2, 1, C.gold); p.rect(11, 5, 1, 3, C.gold); p.rect(10, 7, 2, 1, C.gold); },
  };
  for (const k of Object.keys(signIcon)) {
    P['sign_' + k] = {
      block: true, draw: p => {
        p.rect(7, 11, 2, 5, C.woodO);
        p.rect(2, 1, 12, 11, C.woodO); p.rect(3, 2, 10, 9, '#2c3a78'); p.rect(3, 2, 10, 1, '#4858a0');
        signIcon[k](p);
      },
    };
  }
  P.altar = {
    block: true, counter: true, draw: p => {
      p.rect(1, 4, 14, 11, C.stoneO); p.rect(2, 5, 12, 9, C.stone); p.rect(2, 5, 12, 2, C.stoneL);
      p.rect(3, 6, 10, 6, '#f0f0f8'); p.rect(3, 11, 10, 1, '#c8c8d8'); p.rect(7, 6, 2, 6, '#d03030');
    },
  };
  P.statue = {
    block: true, draw: p => {
      p.rect(3, 12, 10, 4, C.stoneO); p.rect(4, 12, 8, 3, C.stoneD);
      p.ell(8, 3.5, 2.6, 2.6, C.stone); p.rect(5, 6, 6, 6, C.stone); p.rect(5, 6, 2, 6, C.stoneL); p.rect(10, 6, 1, 6, C.stoneD);
      p.rect(11, 1, 1, 10, C.stoneL);
    },
  };
  P.grave = {
    block: true, draw: p => {
      p.rect(5, 3, 6, 11, C.stoneO); p.rect(6, 4, 4, 10, C.stone); p.rect(6, 4, 1, 10, C.stoneL);
      p.rect(7, 6, 2, 5, C.stoneD); p.rect(6, 7, 4, 1, C.stoneD);
      p.rect(4, 14, 8, 1, '#3c8830');
    },
  };
  P.boulder = {
    block: true, draw: p => {
      p.ell(8, 9, 7, 6.5, '#241a12'); p.ell(8, 9, 6.2, 5.8, '#7a6048'); p.ell(6.5, 7.5, 3.5, 3, '#9a7c60'); p.px(10, 11, '#4a3826'); p.px(11, 10, '#4a3826');
    },
  };
  P.stall = {
    block: true, counter: true, draw: p => {
      p.rect(0, 0, 16, 5, '#e84830'); for (let x = 0; x < 16; x += 4) p.rect(x, 0, 2, 5, '#f8f8f8');
      p.rect(0, 5, 16, 1, '#a02818');
      p.rect(0, 9, 16, 7, C.wood); p.rect(0, 9, 16, 1, C.woodL);
      p.ell(4, 8, 2, 1.6, '#f89838'); p.ell(8, 8, 2, 1.6, '#e84830'); p.ell(12, 8, 2, 1.6, '#98e070');
    },
  };
  P.hole = { block: false, draw: p => { p.ell(8, 8, 6, 5, '#181018'); p.ell(8, 7.5, 5, 4, '#000'); } };
  P.cross = { block: true, draw: p => { p.rect(7, 1, 2, 14, C.gold); p.rect(4, 4, 8, 2, C.gold); p.rect(8, 1, 1, 14, C.goldD); } };
  P.spring = {
    block: true, anim: 2, draw: (p, v, f) => {
      p.ell(8, 8.5, 7.5, 7, C.stoneO); p.ell(8, 8.5, 6.6, 6.1, C.stone);
      p.ell(8, 8.8, 5.2, 4.8, '#3aa0e0'); p.ell(7, 7.8, 2.5, 2, '#90e0f8');
      p.px(5 + f * 5, 9 + f, '#f8f8f8'); p.px(9 - f * 3, 6 + f * 3, '#f8f8f8');
    },
  };

  /* ---------- public API ---------- */
  function get(id, v = 0, f = 0) {
    const key = id + '|' + v + '|' + f;
    let c = cache.get(key);
    if (c) return c;
    const def = D[id] || P[id];
    if (!def) return null;
    c = mk(p => def.draw(p, v, f));
    cache.set(key, c);
    return c;
  }
  function def(id) { return D[id] || P[id] || null; }
  function isProp(id) { return !!P[id]; }
  return { get, def, isProp, D, P };
})();

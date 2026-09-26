// 人（NPC）を つくる べんりな かんすう
// sprite: キャラの みため / script: はなしかけた ときの だいほん（story.js）
// show: でてくる じょうけん（フラグ）  wander: うろうろ する はんい
export function npc(id, name, [x, y], sprite, script, opts = {}) {
  return { id, name, x, y, sprite, script, dir: opts.dir || 'down', wander: opts.wander || 0, show: opts.show || null, pal: opts.pal || null, solid: opts.solid !== false, big: opts.big || false };
}

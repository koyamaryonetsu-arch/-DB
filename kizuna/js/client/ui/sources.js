// 第64回 ⑥a: 足りない 素材の 入手先を 見る（ふしぎなかじ・れん金がま）と、その 魔物を さがす（フィールドで 赤く 点めつ）
//   入手先は shared/item-sources.js（魔物は 出る 場所・ダンジョンの 名前。図鑑で 見て いない 魔物は ？？？で 場所だけ）
//   魔物を えらぶと game.hunt に 入れる。フィールドの その 魔物（いっしょに いる 群れも）が 赤く 光る（field.js）
//   素材が 手に入るか、ボタンの「やめる」で おわる（HuntButton）
import { el, esc, toast } from './dom.js?v=1a9ce710eac8';
import { ITEMS } from '../../shared/data/items.js?v=1a9ce710eac8';
import { MONSTERS } from '../../shared/data/monsters.js?v=1a9ce710eac8';
import { itemCount } from '../../shared/stats.js?v=1a9ce710eac8';
import { itemSources, sourceText } from '../../shared/item-sources.js?v=1a9ce710eac8';

const nameOf = (id) => ITEMS[id]?.name || id;
const seenBy = (c) => (sp) => !!c?.bestiary?.[sp];

// lacks: [{ id, need, have }]。ct … ui/counter.js の まど
export async function sourcesFlow(game, ct, lacks) {
  if (!lacks?.length) return;
  const yes = await ct.ask('足りない素材の入手先を見るか？');
  if (ct.closed || yes !== 0) return;
  let id = lacks[0].id;
  if (lacks.length > 1) {
    await ct.say('どの素材の入手先を見る？');
    const p = await ct.pick(lacks.map((x) => ({ label: nameOf(x.id), right: `${x.have}/${x.need}`, rightCls: 'dis', value: x.id })));
    if (ct.closed || !p) return;
    id = p.value;
  }
  const list = itemSources(id, seenBy(game.me));
  if (!list.length) {
    await ct.say(`${nameOf(id)}の入手先は、まだわからない。\n宝の地図の洞窟や、ひみつの場所を探してみよう。`);
    await ct.tap(2400);
    return;
  }
  await ct.say(`${nameOf(id)}の入手先だ。\n魔物を選ぶと、フィールドで赤く光らせるぞ。`);
  const rows = list.slice(0, 12).map((s, i) => ({
    html: esc(sourceText(s)),
    value: i,
    disabled: s.kind !== 'monster' || !s.places.length,
  }));
  const p = await ct.pick(rows, { back: 'もどる' });
  if (ct.closed || !p) return;
  const s = list[p.value];
  if (s?.kind !== 'monster') return;
  setHunt(game, s.species, id);
  toast(`${s.seen ? s.name : '？？？'}（${s.places.slice(0, 2).join('・')}）が、フィールドで赤く光るよ`, 4500);
}

// さがす 魔物を きめる（同じ 魔物を もう一度 えらぶと そのまま）
export function setHunt(game, species, item) {
  game.hunt = { species, item, have: itemCount(game.me, item), name: MONSTERS[species]?.name || '' };
}

// フィールドの まもの（sp … すがた・gs … いっしょに いる 群れ）が さがしている 魔物か
export function huntMatch(hunt, sym) {
  if (!hunt || !sym) return false;
  return sym.sp === hunt.species || (Array.isArray(sym.gs) && sym.gs.includes(hunt.species));
}

const CSS = `
.hud-btn.hud-hunt { color: #ffd0c8; border-color: #ff6a5a; }
`;

// フィールドの ボタンの 列に「さがす：〇〇（やめる）」
export class HuntButton {
  constructor(game) {
    this.game = game;
    if (!document.getElementById('hunt-btn-css')) document.head.append(el('style', { id: 'hunt-btn-css', text: CSS }));
    this.btn = el('button', { class: 'win hud-btn hud-hunt', text: '', onclick: () => this.stop() });
    this.btn.hidden = true;
    game.hud.btns.append(this.btn);
  }

  update() {
    const g = this.game;
    const h = g.hunt;
    if (h && g.me && itemCount(g.me, h.item) > h.have) {
      toast(`${nameOf(h.item)}を手に入れた！（さがすのをやめた）`, 4000);
      g.hunt = null;
    }
    const show = !!g.hunt && g.state === 'field';
    if (show) {
      const label = `さがす：${nameOf(g.hunt.item)}（やめる）`;
      if (this.btn.textContent !== label) this.btn.textContent = label;
    }
    if (this.btn.hidden === show) this.btn.hidden = !show;
  }

  stop() {
    const g = this.game;
    if (!g.hunt) return;
    g.hunt = null;
    g.audio?.sfx?.('cancel');
    toast('さがすのをやめた');
    this.update();
  }
}

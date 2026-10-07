// 美容室（ドラクエ風の カウンター）
//   「どんなご用でしょう？」→ かみがた／かみの色／目もと／はだの色 を えらぶ（みぎに 大きな みほん。くるくる 回る）
//   → 決める →「〇〇ゴールドになりますが、よろしいですか？」はい／いいえ → サーバーで たしかめて 変わる
import { el, esc } from './dom.js?v=92b7832d9909';
import { Counter } from './counter.js?v=92b7832d9909';
import { request } from './shop.js?v=92b7832d9909';
import { boardIconURL } from '../render/boards.js?v=92b7832d9909';
import { previewCache } from '../render/hero.js?v=92b7832d9909';
import { HAIR_STYLES, HAIR_COLORS, FACES, SKIN_TONES, SALON_FEE, lookIds, STYLE_BY_ID, HCOL_BY_ID, FACE_BY_ID, TONE_BY_ID } from '../../shared/data/looks.js?v=92b7832d9909';

const DIRS = ['down', 'left', 'up', 'right'];
const PARTS = [
  { key: 'style', label: 'かみがた', ask: 'どのかみがたにしますか？', list: HAIR_STYLES, by: STYLE_BY_ID },
  { key: 'hcol', label: 'かみの色', ask: 'どの色にしますか？', list: HAIR_COLORS, by: HCOL_BY_ID },
  { key: 'face', label: '目もと', ask: 'どんな目もとにしますか？', list: FACES, by: FACE_BY_ID },
  { key: 'tone', label: 'はだの色', ask: 'はだの色は、どうしますか？', list: SKIN_TONES, by: TONE_BY_ID },
];
const nameOf = (part, id) => part.by.get(id)?.name || '';

// みほん（大きな え。くるくる 回る）
function previewBox(game) {
  const big = el('canvas', { class: 'salon-big', width: 128, height: 168 });
  const now = el('canvas', { class: 'salon-now', width: 128, height: 168 });
  const label = el('div', { class: 'salon-names' });
  const note = el('div', { class: 'small muted salon-note', text: 'かぶとは外して見せています。' });
  const fee = el('div', { class: 'small gold' });
  const box = el('div', { class: 'salon-info' },
    el('div', { class: 'salon-pv' },
      el('div', { class: 'salon-col' }, el('div', { class: 'small muted', text: 'いま' }), now),
      el('div', { class: 'salon-col main' }, el('div', { class: 'small gold', text: '変えたあと' }), big)),
    label, fee, note);
  const cache = previewCache(24);
  const sprite = (look, dir, f) => {
    const me = game.me;
    const eq = me.equip ? { ...me.equip, head: null } : undefined;
    return cache(look, me.job, eq, dir, f, 8);
  };
  let t = 0;
  const S = { draft: null, current: null };
  const draw = () => {
    if (!S.draft) return;
    const dir = DIRS[Math.floor(t / 4) % 4], f = t % 2;
    for (const [cv, look] of [[big, S.draft], [now, S.current]]) {
      const x = cv.getContext('2d');
      x.clearRect(0, 0, cv.width, cv.height);
      x.imageSmoothingEnabled = false;
      x.drawImage(sprite(look, cv === big ? dir : 'down', f), 0, 0);
    }
  };
  const timer = setInterval(() => { t++; draw(); }, 320);
  return {
    box,
    set(draft, current) {
      S.draft = draft;
      S.current = current;
      const ids = lookIds(draft);
      label.innerHTML = PARTS.map((p) => `<div><span class="muted">${esc(p.label)}</span>　${esc(nameOf(p, ids[p.key]))}</div>`).join('');
      fee.textContent = `代金 ${SALON_FEE}G`;
      draw();
    },
    stop() { clearInterval(timer); },
  };
}

// いまの look に えらんだ ものを かさねる（みほん だけ。きめるのは サーバー）
function withPart(look, key, id) {
  return { ...look, [key]: id };
}

export async function salonUI(game, data) {
  const ct = new Counter(game, { title: '美容室', keeper: data.keeper || '美容師', icon: boardIconURL('salon'), cls: 'salon-panel' });
  const pv = previewBox(game);
  ct.hook(() => pv.stop());
  const current = () => ({ ...(game.me.look || {}), ...lookIds(game.me.look) });
  let draft = current();
  const show = () => { pv.set(draft, current()); ct.info(pv.box); };
  show();
  let line = data.hello || 'いらっしゃいませ！\nかみがたや、かみの色を変えてみませんか？';
  let last = 0;
  while (!ct.closed) {
    await ct.say(line);
    show();
    const changed = ['style', 'hcol', 'face', 'tone'].some((k) => lookIds(draft)[k] !== lookIds(game.me.look)[k]);
    const items = [
      ...PARTS.map((p) => ({ label: p.label, value: p.key, right: nameOf(p, lookIds(draft)[p.key]), rightCls: 'muted' })),
      { label: changed ? 'これで決める' : 'これで決める（変わっていない）', value: 'ok', right: changed ? `${SALON_FEE}G` : '', rightCls: 'gold', disabled: !changed },
      { label: 'やめる', value: 'exit' },
    ];
    const cmd = await ct.pick(items, { back: null, start: last });
    if (ct.closed) return;
    if (!cmd || cmd.value === 'exit') break;
    last = items.findIndex((x) => x.value === cmd.value);
    if (cmd.value === 'ok') {
      const ids = lookIds(draft);
      if ((game.me.gold || 0) < SALON_FEE) {
        await ct.say('おや？ゴールドが足りないようですね。');
        await ct.tap(1800);
        line = 'ほかにも何かご用はありますか？';
        continue;
      }
      const yes = await ct.ask(`かみがたは「${nameOf(PARTS[0], ids.style)}」、かみの色は「${nameOf(PARTS[1], ids.hcol)}」ですね。\n${SALON_FEE}ゴールドになりますが、よろしいですか？`);
      if (ct.closed) return;
      if (yes !== 0) { line = 'ほかにも何かご用はありますか？'; continue; }
      const res = await request(game, { kind: 'salon', look: { style: ids.style, hcol: ids.hcol, face: ids.face, tone: ids.tone } });
      ct.updGold();
      if (!res.ok) {
        await ct.say(res.text || 'おや？何かおかしいようですね。');
        await ct.tap(1800);
        line = 'ほかにも何かご用はありますか？';
        continue;
      }
      game.audio.sfx('buff');
      // サーバーの look を そのまま つかう（とどくまで まつ）
      if (res.look) game.me.look = res.look;
      draft = current();
      show();
      await ct.say(res.text || 'はい、できあがり！');
      await ct.tap(2400);
      line = 'ほかにも何かご用はありますか？';
      continue;
    }
    // えらぶ（うごかすと みほんが かわる）
    const part = PARTS.find((p) => p.key === cmd.value);
    await ct.say(part.ask);
    const before = draft;
    const curId = lookIds(draft)[part.key];
    const rows = part.list.map((x) => ({
      value: x.id,
      label: x.name,
      html: x.hex ? `<span class="salon-sw" style="background:${x.hex}"></span>${esc(x.name)}` : esc(x.name),
      right: x.id === lookIds(game.me.look)[part.key] ? 'いま' : '',
      rightCls: 'muted',
    }));
    const pick = await ct.pick(rows, {
      start: Math.max(0, rows.findIndex((r) => r.value === curId)),
      onMove: (it) => { if (it) { draft = withPart(before, part.key, it.value); show(); } },
    });
    if (ct.closed) return;
    draft = pick ? withPart(before, part.key, pick.value) : before;
    show();
    line = pick ? 'いかがでしょう？\nほかに変えたいところはありますか？' : 'ほかに変えたいところはありますか？';
  }
  if (ct.closed) return;
  ct.list(null);
  ct.info(null);
  await ct.say('またのおこしをお待ちしております。');
  await ct.tap(1400);
  ct.close();
}

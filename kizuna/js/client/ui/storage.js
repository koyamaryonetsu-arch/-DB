// 魔物あずかり所（第43回 C。ドラクエ風の カウンター。きまりは shared/world/storage.js）
//
// 「どうする？」→ 魔物をあずける／魔物をひきとる／やめる
//   あずける: 仲間の 魔物を えらぶ（パーティー・馬車に いても よい。装備は ふくろへ）→「〇〇をあずかるね。いい？」
//   ひきとる: あずかり中の 魔物を えらぶ → 酒場へ（仲間が いっぱい〈40〉なら できない）
import { el, esc } from './dom.js?v=a2abc3298a71';
import { Counter } from './counter.js?v=a2abc3298a71';
import { request } from './shop.js?v=a2abc3298a71';
import { faceURL } from '../field.js?v=a2abc3298a71';
import { boardIconURL } from '../render/boards.js?v=a2abc3298a71';
import { MONSTERS } from '../../shared/data/monsters.js?v=a2abc3298a71';

const AGAIN = 'ほかにもご用はある？';

// みぎの まど: 数と せつめい
function summary(data, hint = '') {
  const box = el('div', { class: 'ct-item bank-sum' });
  box.append(
    el('div', { class: 'hd' }, el('span', { class: 'gold', text: '魔物あずかり所' })),
    el('div', { class: 'bank-row' }, el('span', { text: 'あずけている魔物' }), el('span', { class: 'gold', text: `${data.stored.length}／${data.storageMax}ひき` })),
    el('div', { class: 'bank-row' }, el('span', { text: '仲間' }), el('span', { text: `${data.rosterCount}／${data.rosterMax}` })),
  );
  box.append(el('div', { class: 'detail small', text: hint || 'あずけた魔物は戦わないし、育たない。\n酒場の配合では、親に選べる（「あずかり中」のしるし）。' }));
  return box;
}

const HINTS = {
  deposit: '仲間の魔物をあずける。\nパーティーや馬車にいても、あずけられる（装備はふくろへ）。\n人間の仲間はあずけられない。',
  withdraw: 'あずけた魔物をひきとる。\nひきとった魔物は、酒場で待っている。\n仲間がいっぱいの時は、ひきとれない。',
  exit: '',
};

const row = (e) => ({
  value: e.key,
  face: faceURL({ mon: e.species }),
  label: e.name,
  html: `${esc(e.name)}${e.plus ? `<span class="plus">+${e.plus}</span>` : ''} <span class="muted small">${esc(MONSTERS[e.species]?.name || '')} Lv${e.level}</span>`,
  right: e.where,
});

export async function storageUI(game, data) {
  let info = data;
  const ct = new Counter(game, { title: info.name || '魔物あずかり所', keeper: info.keeper || 'あずかり所の人', icon: boardIconURL('monster') });
  let line = info.hello || 'ここは魔物あずかり所。\nどうする？';
  while (!ct.closed) {
    await ct.say(line);
    ct.info(summary(info));
    const cmd = await ct.pick([
      { label: '魔物をあずける', value: 'deposit' },
      { label: '魔物をひきとる', value: 'withdraw' },
      { label: 'やめる', value: 'exit' },
    ], { back: null, onMove: (x) => ct.info(summary(info, HINTS[x?.value])) });
    if (ct.closed) return;
    if (!cmd || cmd.value === 'exit') break;
    info = await loop(game, ct, info, cmd.value === 'deposit');
    line = AGAIN;
  }
  if (ct.closed) return;
  ct.list(null);
  ct.info(summary(info));
  await ct.say('またおいでね。\n魔物たちは、ちゃんとめんどうを見ておくよ。');
  await ct.tap(1400);
  ct.close();
}

// あずける・ひきとる を くりかえす。もどりち: 新しい info
async function loop(game, ct, info, deposit) {
  let line = deposit ? 'どの魔物をあずける？' : 'どの魔物をひきとる？';
  let idx = 0;
  while (!ct.closed) {
    const list = deposit ? info.roster : info.stored;
    if (!list.length) {
      ct.list(null);
      ct.info(summary(info));
      await ct.say(deposit ? 'あずけられる魔物の仲間がいないみたい。' : '今は、だれもあずかっていないよ。');
      await ct.tap(1800);
      return info;
    }
    if (deposit && info.stored.length >= info.storageMax) {
      await ct.say(`ごめんね、あずかり所はいっぱいなんだ（${info.storageMax}ひきまで）。`);
      await ct.tap(1800);
      return info;
    }
    if (!deposit && info.rosterCount >= info.rosterMax) {
      await ct.say(`仲間がいっぱいだね（${info.rosterMax}）。\n酒場でだれかと別れるか、先にほかの魔物をあずけてね。`);
      await ct.tap(2200);
      return info;
    }
    await ct.say(line);
    const rows = list.map(row);
    const it = await ct.pick(rows, { start: Math.min(idx, rows.length - 1), onMove: () => ct.info(summary(info, HINTS[deposit ? 'deposit' : 'withdraw'])) });
    if (ct.closed || !it) return info;
    idx = rows.findIndex((r) => r.value === it.value);
    const e = list.find((x) => x.key === it.value);
    const yes = await ct.ask(deposit ? `${e.name}をあずかるね。いい？${e.where === 'いっしょ' ? '\n（パーティーや馬車からはなれる）' : ''}` : `${e.name}を酒場へ送るね。いい？`);
    if (ct.closed) return info;
    if (yes !== 0) {
      line = deposit ? 'ほかにあずける魔物はいる？' : 'ほかにひきとる魔物はいる？';
      continue;
    }
    const res = await request(game, { kind: 'storage', action: deposit ? 'deposit' : 'withdraw', key: e.key });
    if (ct.closed) return info;
    if (res.storage) info = res.storage;
    if (res.ok) game.audio.sfx(deposit ? 'leave' : 'join');
    ct.info(summary(info));
    await ct.say(res.text || 'あれ？何かおかしいみたい。', { narr: !!res.ok });
    await ct.tap(1600);
    line = deposit ? 'ほかにあずける魔物はいる？' : 'ほかにひきとる魔物はいる？';
  }
  return info;
}

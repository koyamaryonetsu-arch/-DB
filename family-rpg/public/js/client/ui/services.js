// お店・転職・酒場・でんごんばん・ほしのかけら・きょうかい の がめん
import { el, ListMenu, toast, askText, confirmBox, esc } from './dom.js';
import { ITEMS } from '../../shared/data/items.js';
import { JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, TIER_NAMES, JOB_MAX_LEVEL, JOB_TRAIN_GAP, jobReqText } from '../../shared/data/jobs.js';
import { ABILITIES } from '../../shared/data/abilities.js';
import { itemCount, learnedAbilities, jobUnlocked, jobProgress } from '../../shared/stats.js';
import { MONSTERS } from '../../shared/data/monsters.js';
import { MONSTER_FRIENDS, BREED_MIN_LEVEL, RACE_NAMES } from '../../shared/data/companions.js';
import { TACTICS } from '../../shared/ai.js';
import { itemDetail } from './info.js';
import { playerSprite, followerSprite, faceURL } from '../field.js';
import { shopUI, churchUI } from './shop.js';

export function openServiceUI(game, kind, data) {
  switch (kind) {
    case 'shop': return shopUI(game, data);
    case 'jobChange': return jobUI(game);
    case 'tavern': return tavernUI(game, data);
    case 'board': return boardUI(game, data);
    case 'starTrade': return starUI(game, data);
    case 'church': return churchUI(game, data);
    default: return Promise.resolve();
  }
}

// サーバーの へんじを まつ
function request(game, msg) {
  return new Promise((resolve) => {
    game.svcWaiter = resolve;
    game.net.send({ t: 'svc', ...msg });
    setTimeout(() => {
      if (game.svcWaiter === resolve) {
        game.svcWaiter = null;
        resolve({ ok: false, text: '通信がおくれています' });
      }
    }, 6000);
  });
}

// お店などの まど。みぎうえの「✕ とじる」と そとの タップで とじる（s.onClose を よぶ）
function shell(title, extraCls = '') {
  const backdrop = el('div', { class: 'modal-back' });
  const root = el('div', { class: `panel center-panel svc-panel ${extraCls}` });
  const right = el('span', { class: 'svc-right' });
  const s = { root, right, onClose: null };
  const userClose = () => {
    if (!s.onClose) return;
    s.game?.audio.sfx('cancel');
    s.onClose();
  };
  const closeBtn = el('button', { class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': '閉じる', onclick: userClose });
  const head = el('div', { class: 'win svc-head' }, el('span', { class: 'gold', text: title }), right, closeBtn);
  const body = el('div', { class: 'fmenu' });
  root.append(head, body);
  backdrop.addEventListener('click', userClose);
  document.getElementById('ui').append(backdrop, root);
  // s.root.remove() で うしろの まくも いっしょに けす
  const removeRoot = root.remove.bind(root);
  root.remove = () => {
    backdrop.remove();
    removeRoot();
  };
  return Object.assign(s, { head, body });
}

// ───────────── 転職 ─────────────
function jobUI(game) {
  return new Promise((resolve) => {
    const s = shell('星の神殿 ― 転職', 'job-panel');
    s.game = game;
    const side = el('div', { class: 'win side scroll job-list' });
    const main = el('div', { class: 'win main scroll' });
    s.body.append(side, main);
    // だれが 転職する？（じぶん と 酒場の なかま。モンスターは 転職できない）
    let who = 'self';
    const mates = () => (game.party?.supports || []).filter((x) => x.kind === 'npc' && x.owner === game.me.id);
    const target = () => {
      if (who === 'self') return { name: game.me.name, job: game.me.job, jobs: game.me.jobs, look: game.me.look, equip: game.me.equip };
      return mates().find((x) => x.key === who) || null;
    };
    const whoRow = el('div', { class: 'who-list' });
    const renderWho = () => {
      whoRow.innerHTML = '';
      const list = [{ key: 'self', name: game.me.name }, ...mates()];
      if (list.length < 2) return;
      for (const m of list) {
        whoRow.append(el('button', {
          class: `btn ${who === m.key ? 'sel' : ''}`, text: m.name,
          onclick: () => { who = m.key; renderWho(); menu.setItems(render()); showJob(menu.current?.value || target().job); },
        }));
      }
    };
    const render = () => {
      if (!target()) who = 'self';
      const c = target();
      s.right.textContent = `${c.name}: ${JOBS[c.job]?.name || ''}`;
      const out = [];
      [JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER].forEach((order, tier) => {
        const open = order.filter((j) => jobUnlocked(c, j)).length;
        out.push({ header: true, label: tier ? `${TIER_NAMES[tier]}（なれる ${open}/${order.length}）` : TIER_NAMES[tier] });
        for (const j of order) {
          const ok = jobUnlocked(c, j);
          const lv = c.jobs?.[j]?.lv || 0;
          out.push({
            html: ok ? esc(JOBS[j].name) : `<span class="muted">🔒 ${esc(JOBS[j].name)}</span>`,
            right: !ok ? '' : lv >= JOB_MAX_LEVEL ? '★マスター' : lv ? `Lv${lv}` : '初めて',
            rightCls: lv >= JOB_MAX_LEVEL ? 'gold' : '',
            value: j,
            disabled: !ok,
            cls: j === c.job ? 'good' : '',
          });
        }
      });
      return out;
    };
    const menu = new ListMenu(game.input, {
      items: render(),
      sound: (x) => game.audio.sfx(x),
      onMove: (it) => showJob(it.value),
      onSelect: async (it) => {
        const c = target();
        if (!c) return;
        if (it.value === c.job) {
          toast('今の職業です');
          return;
        }
        menu.blur();
        const ok = await confirmBox(game.input, `${who === 'self' ? '' : c.name + 'を'}${JOBS[it.value].name}に転職${who === 'self' ? 'しますか' : 'させますか'}？\n（今の職業のレベルは残ります）`, 'はい', 'いいえ', (x) => game.audio.sfx(x));
        if (ok) {
          const r = await request(game, { kind: 'jobChange', job: it.value, who });
          if (r.ok) {
            game.audio.sfx('join');
            if (who === 'self') game.field.flashLocal?.();
          }
          toast(r.text || '');
          // なかまの じょうほうが とどくのを すこし まつ
          setTimeout(() => { menu.setItems(render()); showJob(it.value); }, 150);
        }
        menu.focus();
      },
      back: null,
      onCancel: () => close(),
    });
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    side.append(menu.root);
    const showJob = (j) => {
      const job = JOBS[j];
      const c = target();
      if (!job || !c) return;
      const lv = c.jobs?.[j]?.lv || 0;
      const open = jobUnlocked(c, j);
      main.innerHTML = '';
      main.append(whoRow);
      renderWho();
      const pv = playerSprite(c.look, j, 'down', 0, c.equip);
      const img = el('canvas', { width: pv.width, height: pv.height, style: { width: '48px', height: '63px', imageRendering: 'pixelated', float: 'right', opacity: open ? '1' : '0.45' } });
      img.getContext('2d').drawImage(pv, 0, 0);
      main.append(img, el('h3', { text: `${job.name}（${job.kana}）` }), el('div', { class: 'small gold', text: TIER_NAMES[job.tier || 0] }), el('div', { class: 'detail', text: job.desc }));
      // なる ための じょうけん・しゅぎょうの すすみぐあい
      if (job.req) {
        const req = el('div', { class: 'small', style: { margin: '0.4em 0' } });
        req.append(el('div', { class: open ? 'good' : 'warn', text: open ? `なれる！（${jobReqText(j)}）` : `なるには: ${jobReqText(j)}` }));
        for (const r of job.req) {
          const rl = c.jobs?.[r]?.lv || 0;
          req.append(el('div', { class: rl >= JOB_MAX_LEVEL ? 'good' : 'muted', text: `　${JOBS[r].name}　${rl >= JOB_MAX_LEVEL ? '★マスター' : rl ? `Lv${rl}/${JOB_MAX_LEVEL}` : 'まだなったことがない'}` }));
        }
        main.append(req);
      }
      if (open && lv) {
        const pg = jobProgress(c, j);
        main.append(el('div', { class: 'small', text: pg.done ? `職業レベル ${lv}（★マスター）` : `職業レベル ${lv}　次まであと${pg.next}回勝つ` }));
      }
      const bars = el('div', { class: 'statbars', style: { margin: '0.5em 0' } });
      for (const [k, n] of [['hp', 'HP'], ['mp', 'MP'], ['str', '力'], ['def', '身の守り'], ['agi', '素早さ'], ['mag', '魔力'], ['heal', '回復']]) {
        const v = job.mods[k];
        bars.append(el('span', { text: n }), el('div', { class: 'b' }, el('i', { style: { width: `${Math.min(100, v / 1.5 * 100)}%` } })), el('span', { class: v > 1 ? 'up' : v < 1 ? 'down' : '', text: `${Math.round(v * 100)}%` }));
      }
      main.append(bars);
      const learn = el('div', { class: 'small' });
      learn.append(el('div', { class: 'gold', text: '覚える技（職業レベル）' }));
      for (const [l, id] of job.learn) {
        const a = ABILITIES[id];
        learn.append(el('div', { class: lv >= l ? 'good' : 'muted', text: `Lv${l}　${a.name}${lv >= l ? '（覚えた）' : ''}` }));
      }
      main.append(learn);
      main.append(el('div', { class: 'detail', text: `職業レベルは戦いに勝つと上がる（最大${JOB_MAX_LEVEL}）。ただし自分より${JOB_TRAIN_GAP + 1}つ以上レベルが低い敵ばかりだと修行にならない。\n基本職を2つマスターすると上級職、上級職をマスターすると超級職になれる。\n呪文の掛け合わせは、元の職業を合わせ持つ上級職以上で使える。\n他の職業で覚えた技も使えるが、MPが増えたり威力が下がることがある（元になった職業の技はだいじょうぶ）。\n酒場の仲間もここで転職できるよ。` }));
    };
    menu.focus();
  });
}

// ───────────── 酒場 ─────────────
// いっしょに いる なかま / 酒場で まつ なかま / あたらしい なかま / かぞくの キャラ
function tavernUI(game, data) {
  return new Promise((resolve) => {
    const s = shell('仲間の酒場', 'tavern-panel');
    s.game = game;
    const side = el('div', { class: 'win side scroll tavern-list' });
    const main = el('div', { class: 'win main scroll' });
    s.body.append(side, main);
    let info = data;
    const sfx = (x) => game.audio.sfx(x);
    const face = (e) => faceURL({ look: e.look, job: e.job, eq: e.equip, mon: e.species || undefined });
    const who = (e) => (e.species ? `${MONSTERS[e.species]?.name || ''} Lv${e.level}` : `${JOBS[e.job]?.name || ''} Lv${e.level}`);
    const plusTag = (e) => (e.plus ? `<span class="plus">+${e.plus}</span>` : '');
    const BREED_KEY = '#breed';
    const byKey = () => {
      const m = new Map();
      for (const e of info.roster) m.set(e.key, { ...e, sec: 'roster' });
      for (const e of info.family) m.set(e.key, { ...e, sec: 'family' });
      for (const e of info.recruits) m.set(e.key, { ...e, sec: 'recruit' });
      return m;
    };
    let entries = byKey();
    const partyKeys = () => [...entries.values()].filter((e) => e.inParty).map((e) => e.key);
    const items = () => {
      const out = [];
      const inParty = [...entries.values()].filter((e) => e.inParty);
      out.push({ header: true, label: `いっしょにいる仲間（${inParty.length}/${info.slots}）` });
      if (!inParty.length) out.push({ label: '（まだだれもいない）', value: null, disabled: true });
      for (const e of inParty) {
        out.push({ face: face(e), html: `${esc(e.name)}${plusTag(e)} <span class="muted small">${who(e)}</span>${e.family ? '<span class="tag gold">家族</span>' : ''}${e.inParty && !e.active ? '<span class="tag muted">今は待つ</span>' : ''}`, value: e.key });
      }
      const waiting = info.roster.filter((e) => !e.inParty);
      if (waiting.length) {
        out.push({ header: true, label: `酒場で待っている仲間（${waiting.length}）` });
        for (const e of waiting) out.push({ face: face(e), html: `${esc(e.name)}${plusTag(e)} <span class="muted small">${who(e)}</span>${e.hp <= 0 ? '<span class="tag warn">休んでいる</span>' : ''}`, value: e.key });
      }
      const mons = info.roster.filter((e) => e.species);
      if (mons.length) {
        const ready = mons.filter((e) => e.level >= BREED_MIN_LEVEL).length;
        out.push({ header: true, label: '魔物の配合' });
        out.push({ html: '配合する <span class="muted small">（2ひきを掛け合わせる）</span>', right: `Lv${BREED_MIN_LEVEL}+ ${ready}ひき`, value: BREED_KEY });
      }
      if (info.recruits.length) {
        out.push({ header: true, label: '新しい仲間を探す' });
        for (const e of info.recruits) out.push({ face: face(e), html: `${esc(e.name)} <span class="muted small">${who(e)}</span><span class="tag good">NEW</span>`, value: e.key });
      }
      const fam = info.family.filter((e) => !e.inParty);
      if (fam.length) {
        out.push({ header: true, label: '家族のキャラクター（サポート）' });
        for (const e of fam) out.push({ face: face(e), html: `${esc(e.name)} <span class="muted small">${who(e)}</span>`, value: e.key });
      }
      return out;
    };
    const partyText = () => {
      const n = Math.min(4, (info.humans || 1) + info.used);
      return `パーティー ${n}/4人${info.isLeader ? '' : '（リーダーの仲間がついてくる）'}`;
    };
    const show = (key) => {
      main.innerHTML = '';
      if (key === BREED_KEY) {
        main.append(el('h3', { text: '魔物の配合' }), el('div', { class: 'detail', text: [
          `レベル${BREED_MIN_LEVEL}以上のモンスター2ひきを掛け合わせて、新しいモンスターを生み出す。`,
          '・生まれた子はレベル1から。でも親の技を4つまで受けつげる',
          '・親の強さを少し受けつぎ、「+」の数が多いほどよく育つ',
          '・生まれる種族はふつう1ぴきめの親と同じ。組み合わせ次第でめずらしいモンスターが生まれることも…',
          '・親の2ひきは旅立っていく（装備はふくろにもどる）',
        ].join('\n') }));
        return;
      }
      const e = entries.get(key);
      if (!e) {
        main.append(el('div', { class: 'detail', text: '仲間を連れていくといっしょに戦ってくれるよ。\n連れていけるのは3人まで。待っている仲間とはいつでも入れかえられる。\nモンスターの仲間もここで待っているよ。' }));
        return;
      }
      const pv = e.species ? followerSprite({ mon: e.species }, 'down', 0) : playerSprite(e.look, e.job, 'down', 0, e.equip);
      const img = el('canvas', { width: pv.width, height: pv.height, class: 'tv-face' });
      img.getContext('2d').drawImage(pv, 0, 0);
      main.append(img, el('h3', { text: `${e.name}${e.plus ? ` ＋${e.plus}` : ''}` }), el('div', { class: 'small gold', text: e.sec === 'recruit' ? `${who(e)}（仲間になるとこのレベル）` : who(e) }));
      if (e.maxHp) main.append(el('div', { class: 'small', text: `HP ${Math.max(0, e.hp)}/${e.maxHp}　MP ${e.mp}/${e.maxMp}${e.tactics ? `　作戦: ${TACTICS[e.tactics]?.name || ''}` : ''}` }));
      if (e.sec === 'roster' && e.species) {
        const learned = e.abilities || learnedAbilities({ species: e.species, level: e.level });
        main.append(el('div', { class: 'small', text: `技: ${learned.map((id) => ABILITIES[id]?.name).filter(Boolean).join('・') || 'なし'}` }));
        if (e.parents) main.append(el('div', { class: 'small muted', text: `親: ${e.parents.join(' ＋ ')}` }));
        if (e.level < BREED_MIN_LEVEL) main.append(el('div', { class: 'small muted', text: `レベル${BREED_MIN_LEVEL}になると配合できる` }));
      }
      main.append(el('div', { class: 'detail', text: e.desc || '' }));
      if (e.sec === 'roster' && e.inParty && !e.active) main.append(el('div', { class: 'detail', text: '今はパーティーの人数がいっぱいなので待っている。' }));
    };
    const menu = new ListMenu(game.input, {
      items: items(),
      sound: sfx,
      onMove: (it) => show(it?.value),
      onSelect: (it) => act(it.value),
      back: null,
      onCancel: () => close(),
    });
    const refresh = (r) => {
      if (r?.tavern) {
        info = r.tavern;
        entries = byKey();
      }
      menu.setItems(items());
      s.right.textContent = partyText();
      show(menu.current?.value);
    };
    const ask = (title, opts) => choose(game, title, opts);
    const doReq = async (msg) => {
      const r = await request(game, { kind: 'tavern', ...msg });
      toast(r.text || '');
      if (r.ok) sfx(msg.action === 'wait' || msg.action === 'release' ? 'leave' : msg.action === 'breed' ? 'bond' : 'join');
      refresh(r);
      return r;
    };
    // いっぱいの ときは だれと いれかわるか えらぶ
    const pickSwap = async (name) => {
      const cur = partyKeys().map((k) => entries.get(k)).filter(Boolean);
      return ask(`パーティーがいっぱい！\n${name}と入れかわりにだれが酒場で待つ？`, [
        ...cur.map((e) => ({ face: face(e), label: `${e.name}（${who(e)}）`, value: e.key })),
        { label: 'やめる', value: null },
      ]);
    };
    // はいごう: おやを 2ひき えらぶ → うまれる こを みる → うけつぐ わざ → なまえ
    const pickSkills = (pv) => new Promise((resolve) => {
      let sel = new Set(pv.auto);
      const back = el('div', { class: 'modal-back', style: { zIndex: 6 } });
      const box = el('div', { class: 'win panel center-panel choose-pop', style: { width: 'min(94vw, 480px)', zIndex: 7 } });
      const cv = followerSprite({ mon: pv.child }, 'down', 0);
      const img = el('canvas', { width: cv.width, height: cv.height, style: { height: '3.6em', width: 'auto', imageRendering: 'pixelated', flex: 'none' } });
      img.getContext('2d').drawImage(cv, 0, 0);
      const own = (MONSTER_FRIENDS[pv.child]?.learn || []).map(([lv, id]) => `Lv${lv} ${ABILITIES[id]?.name || id}`).join('・');
      box.append(
        el('div', { style: { display: 'flex', gap: '0.6em', alignItems: 'flex-start' } },
          el('div', { style: { flex: '1', minWidth: '0' } },
            el('div', { class: 'small gold', style: { whiteSpace: 'pre-line' }, text: `生まれる子: ${pv.childName}（${RACE_NAMES[MONSTERS[pv.child]?.race] || ''}）＋${pv.plus}${pv.special ? '\n★ めずらしい組み合わせ！' : ''}` }),
            el('div', { class: 'small muted', text: `自分で覚える技: ${own || 'なし'}` })),
          img),
        el('div', { class: 'small', text: `親から受けつぐ技を${pv.max}つまで選んでね` }));
      const desc = el('div', { class: 'small detail', style: { minHeight: '2.4em' } });
      const rows = () => [
        { html: `これで決定 <span class="muted small">（${sel.size}/${pv.max}）</span>`, value: '#ok' },
        { label: 'おまかせにする', value: '#auto' },
        ...pv.skills.map((id) => ({ html: `${sel.has(id) ? '●' : '○'} ${esc(ABILITIES[id]?.name || id)}`, right: ABILITIES[id]?.mp ? `MP${ABILITIES[id].mp}` : '', value: id, cls: sel.has(id) ? 'good' : '' })),
        { label: 'やめる', value: null },
      ];
      const done = (v) => {
        m.blur();
        back.remove();
        box.remove();
        resolve(v);
      };
      const m = new ListMenu(game.input, {
        items: rows(),
        sound: sfx,
        back: null,
        onMove: (it) => { desc.textContent = ABILITIES[it?.value]?.desc || ''; },
        onSelect: (it) => {
          if (it.value === '#ok') return done([...sel]);
          if (it.value === '#auto') { sel = new Set(pv.auto); m.setItems(rows()); return; }
          if (it.value === null) return done(null);
          if (sel.has(it.value)) sel.delete(it.value);
          else if (sel.size < pv.max) sel.add(it.value);
          else { toast(`受けつげる技は${pv.max}つまで`); return; }
          m.setItems(rows());
        },
        onCancel: () => done(null),
      });
      back.onclick = () => { sfx('cancel'); done(null); };
      box.append(m.root, desc);
      document.getElementById('ui').append(back, box);
      m.focus();
    });
    const breedFlow = async () => {
      const mons = info.roster.filter((x) => x.species);
      if (mons.filter((x) => x.level >= BREED_MIN_LEVEL).length < 2) {
        sfx('buzz');
        toast(`レベル${BREED_MIN_LEVEL}以上のモンスターが2ひき必要だよ`);
        return;
      }
      const pick = (title, exclude) => ask(title, [
        ...mons.filter((x) => x.key !== exclude).map((x) => ({
          face: face(x), html: `${esc(x.name)}${plusTag(x)} <span class="muted small">${who(x)}</span>`, value: x.key,
          disabled: x.level < BREED_MIN_LEVEL, right: x.level < BREED_MIN_LEVEL ? `Lv${BREED_MIN_LEVEL}から` : '',
        })),
        { label: 'やめる', value: null },
      ]);
      const a = await pick('配合: 1ぴきめの親を選んでね\n（生まれる子はふつう1ぴきめと同じ種族）');
      if (!a) return;
      const b = await pick(`${entries.get(a)?.name}の相手を選んでね`, a);
      if (!b) return;
      const r = await request(game, { kind: 'tavern', action: 'breedPreview', a, b });
      if (!r.ok || !r.preview) {
        toast(r.text || '配合できない');
        return;
      }
      const pv = r.preview;
      const inherit = pv.skills.length ? await pickSkills(pv) : [];
      if (!inherit) return;
      const nm = await askText(game.input, { title: `生まれる${pv.childName}の名前`, max: 8, initial: pv.childName });
      if (nm === null) return;
      const A = entries.get(a), B = entries.get(b);
      const ok = await confirmBox(game.input, `${A.name}と${B.name}を配合しますか？\n→ ${nm || pv.childName}（${pv.childName} ＋${pv.plus}）が生まれる\n※ ${A.name}と${B.name}は旅立っていく（装備はふくろにもどる）`, '配合する', 'やめる', sfx);
      if (!ok) return;
      await doReq({ action: 'breed', a, b, inherit, name: nm || pv.childName });
    };
    const act = async (key) => {
      if (key === BREED_KEY) {
        menu.blur();
        await breedFlow();
        menu.focus();
        return;
      }
      const e = entries.get(key);
      if (!e) return;
      menu.blur();
      const full = partyKeys().length >= info.slots;
      if (e.sec === 'recruit') {
        const a = await ask(`${e.name}（${who(e)}）を仲間にする？`, [
          { label: full ? '仲間にして入れかわる' : '仲間にして連れていく', value: 'join' },
          { label: '仲間にして酒場で待ってもらう', value: 'wait' },
          { label: 'やめる', value: null },
        ]);
        if (a === 'join') {
          let swap = null;
          if (full) swap = await pickSwap(e.name);
          if (!full || swap) await doReq({ action: 'recruit', key, swap });
        } else if (a === 'wait') await doReq({ action: 'recruit', key, join: false });
      } else if (e.inParty) {
        const opts = [{ label: '酒場で待っていてもらう', value: 'wait' }];
        if (e.sec === 'roster') opts.push({ label: '名前を変える', value: 'rename' });
        opts.push({ label: 'やめる', value: null });
        const a = await ask(`${e.name}をどうする？`, opts);
        if (a === 'wait') await doReq({ action: 'wait', key });
        else if (a === 'rename') await rename(e);
      } else {
        const opts = [{ label: full ? '連れていく（入れかわる）' : '連れていく', value: 'join' }];
        if (e.sec === 'roster') opts.push({ label: '名前を変える', value: 'rename' });
        if (e.species) opts.push({ label: '別れる', value: 'release' });
        opts.push({ label: 'やめる', value: null });
        const a = await ask(`${e.name}をどうする？`, opts);
        if (a === 'join') {
          let swap = null;
          if (full) swap = await pickSwap(e.name);
          if (!full || swap) await doReq({ action: 'join', key, swap });
        } else if (a === 'rename') await rename(e);
        else if (a === 'release') {
          const ok = await confirmBox(game.input, `本当に${e.name}と別れますか？\n（もう会えなくなるよ。装備はふくろにもどる）`, '別れる', 'やめる', sfx);
          if (ok) await doReq({ action: 'release', key });
        }
      }
      menu.focus();
    };
    const rename = async (e) => {
      const nm = await askText(game.input, { title: `${e.name}の新しい名前`, max: 8, initial: e.name });
      if (nm) await doReq({ action: 'rename', key: e.key, name: nm });
    };
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    side.append(menu.root);
    s.right.textContent = partyText();
    menu.focus();
  });
}

// ちいさな えらぶ まど（Promise で えらんだ value。やめたら null）
export function choose(game, title, items) {
  return new Promise((resolve) => {
    const back = el('div', { class: 'modal-back', style: { zIndex: 6 }, onclick: () => { game.audio.sfx('cancel'); done(null); } });
    const box = el('div', { class: 'win panel center-panel choose-pop', style: { width: 'min(90vw, 440px)', zIndex: 7 } }, el('div', { class: 'small gold', style: { whiteSpace: 'pre-line' }, text: title }));
    const hasCancel = items.some((i) => i.value === null);
    const m = new ListMenu(game.input, {
      items,
      sound: (x) => game.audio.sfx(x),
      back: hasCancel ? null : 'やめる',
      onSelect: (it) => done(it.value),
      onCancel: () => done(null),
    });
    box.append(m.root);
    document.getElementById('ui').append(back, box);
    m.focus();
    const done = (v) => {
      m.blur();
      back.remove();
      box.remove();
      resolve(v);
    };
  });
}

// ───────────── でんごんばん ─────────────
function boardUI(game, data) {
  return new Promise((resolve) => {
    const s = shell('家族の伝言板');
    s.game = game;
    const main = el('div', { class: 'win main scroll', style: { gridColumn: '1 / -1' } });
    s.body.append(main);
    let posts = data.posts || [];
    const render = () => {
      main.innerHTML = '';
      if (!posts.length) main.append(el('div', { class: 'muted', text: 'まだ何も書かれていない。最初のメッセージを書いてみよう！' }));
      for (const p of posts.slice(0, 20)) {
        main.append(el('div', { class: 'combo-row' }, el('span', { class: 'gold', text: p.from }), el('span', { class: 'muted small', text: `　${ago(p.time)}` }), el('div', { text: p.text })));
      }
    };
    render();
    const menu = new ListMenu(game.input, {
      items: [{ label: '書きこむ', value: 'post' }, { label: '閉じる', value: 'close' }],
      cols: 2,
      sound: (x) => game.audio.sfx(x),
      onSelect: async (it) => {
        if (it.value === 'close') return close();
        menu.blur();
        const text = await askText(game.input, { title: '伝言板に書く', placeholder: '今日は洞窟まで行ったよ！', max: 120 });
        if (text) {
          const r = await request(game, { kind: 'board', action: 'post', text });
          toast(r.text || '');
          if (r.posts) posts = r.posts;
          render();
        }
        menu.focus();
      },
      back: null,
      onCancel: () => close(),
    });
    main.before(menu.root);
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    menu.focus();
  });
}

export function ago(t) {
  const d = (Date.now() - t) / 1000;
  if (d < 60) return 'たった今';
  if (d < 3600) return `${Math.floor(d / 60)}分前`;
  if (d < 86400) return `${Math.floor(d / 3600)}時間前`;
  return `${Math.floor(d / 86400)}日前`;
}

// ───────────── ほしのかけら ─────────────
function starUI(game, data) {
  return new Promise((resolve) => {
    const s = shell('星のかけらこうかん');
    s.game = game;
    const main = el('div', { class: 'win main scroll', style: { gridColumn: '1 / -1' } });
    const detail = el('div', { class: 'detail' });
    s.body.append(main);
    const upd = () => { s.right.textContent = `星のかけら ${itemCount(game.me, 'star_shard')}個`; };
    upd();
    const menu = new ListMenu(game.input, {
      items: data.trades.map((t, i) => ({ label: ITEMS[t.item].name, right: `★${t.shards}`, value: i })),
      sound: (x) => game.audio.sfx(x),
      onMove: (it) => { detail.textContent = itemDetail(data.trades[it.value].item); },
      onSelect: async (it) => {
        const t = data.trades[it.value];
        menu.blur();
        if (await confirmBox(game.input, `星のかけら${t.shards}個で${ITEMS[t.item].name}とこうかんする？`, 'はい', 'いいえ', (x) => game.audio.sfx(x))) {
          const r = await request(game, { kind: 'starTrade', index: it.value });
          if (r.ok) game.audio.sfx('sparkle');
          toast(r.text || '');
          setTimeout(upd, 100);
        }
        menu.focus();
      },
      back: null,
      onCancel: () => close(),
    });
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    main.append(menu.root, detail);
    menu.focus();
  });
}

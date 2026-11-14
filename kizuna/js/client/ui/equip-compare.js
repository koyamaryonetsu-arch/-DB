// 第76回: 装備を えらぶ まどの「くらべる まど」（大きく。今の 装備と えらんでいる 物を、今の 強さ・もとの 強さで くらべる）
//   家族の ねがい: きたえると もともとの 武器の 強さが わからなくなる。きたえた 武具を 装備していても、
//   ほかの 武具を もとの 強さで くらべて「きたえたら どっちが 強いか」を 考えられるように。
//   数字は shared/gear-base.js の gearCompare（今＝きたえ・★・れん金を ふくむ・もと＝きたえる 前）
import { ITEMS } from '../../shared/data/items.js?v=5e5310169c06';
import { fxListOf, fxShort } from '../../shared/data/gear-fx.js?v=5e5310169c06';
import { gearCompare, forgeLabel } from '../../shared/gear-base.js?v=5e5310169c06';
import { esc } from './dom.js?v=5e5310169c06';
import { rareNameHtml } from './rarity.js?v=5e5310169c06';

const signed = (v) => (v > 0 ? `+${v}` : `${v}`);
const arrow = (d) => (d > 0 ? `<span class="eqc-d up">↑${d}</span>` : d < 0 ? `<span class="eqc-d down">↓${-d}</span>` : '<span class="eqc-d same">＝</span>');

// 装備の 下の ひとこと（きたえ・れん金）
function subLine(c, id) {
  if (!id) return '';
  const parts = [];
  const f = forgeLabel(id);
  parts.push(f ? `きたえ ${f}` : 'きたえていない');
  const fx = fxShort(fxListOf(c, id));
  if (fx) parts.push(`れん金 ${fx}`);
  return parts.join('・');
}

function card(c, cap, id, cls, none = 'なし') {
  const name = id && ITEMS[id] ? rareNameHtml(id) : esc(none);
  return `<div class="eqc-card ${cls}"><div class="eqc-cap">${esc(cap)}</div><div class="eqc-name">${name}</div><div class="eqc-sub">${esc(subLine(c, id))}</div></div>`;
}

// 同じだけ きたえると（今の 装備が きたえて あって、えらんでいる 物の ほうが 少ない 時）
function sameLine(cmp) {
  const s = cmp.cand?.same;
  if (!s) return '';
  if (s.none) return '<div class="eqc-same muted">この装備は店の品（★1）なので、きたえられない。</div>';
  const cap = s.capped ? `いちばん上の${esc(s.label)}まで` : `今の装備と同じだけ（${esc(cmp.cur.label)}）`;
  const vals = cmp.rows.filter((r) => r.candSame || r.curNow).map((r) => `<span class="eqc-sv">${esc(r.n)}${signed(r.candSame)}${arrow(r.dSame)}</span>`).join('');
  return `<div class="eqc-same"><div class="eqc-same-h">${cap}きたえると</div><div class="eqc-same-v">${vals}</div></div>`;
}

// c … 装備する 人・slot … 部位・cur … 今の 装備・cand … えらんでいる 物（null: 外す・undefined: やめる など）
export function equipCompareHtml(c, slot, cur, cand) {
  const off = cand === null;
  const pick = cand === undefined ? undefined : cand;
  const cmp = gearCompare(c, slot, cur || null, pick || null);
  const head = `<div class="eqc-head">${card(c, '今の装備', cur, 'cur')}<div class="eqc-to">→</div>${pick === undefined ? '<div class="eqc-card new empty"><div class="eqc-cap">選んだ物</div><div class="eqc-name muted">－</div></div>' : card(c, off ? '外すと' : 'これにすると', pick, 'new', '外す')}</div>`;
  if (pick === undefined) {
    const rows = cmp.rows.map((r) => `<tr><th>${esc(r.n)}</th><td>${signed(r.curNow)}</td><td class="eqc-b">${signed(r.curBase)}</td></tr>`).join('');
    return `${head}${rows ? `<table class="eqc-tbl one"><thead><tr><th></th><th>今</th><th class="eqc-b">もと</th></tr></thead><tbody>${rows}</tbody></table>` : ''}${legend()}`;
  }
  if (!cmp.rows.length) return `${head}<div class="eqc-none muted">強さは変わらない</div>${legend()}`;
  const rows = cmp.rows.map((r) => `<tr><th>${esc(r.n)}</th><td>${signed(r.curNow)}</td><td class="eqc-b">${signed(r.curBase)}</td>`
    + `<td class="eqc-new">${signed(r.candNow)}${arrow(r.dNow)}</td><td class="eqc-b eqc-new">${signed(r.candBase)}${arrow(r.dBase)}</td></tr>`).join('');
  const table = `<table class="eqc-tbl"><thead><tr><th></th><th colspan="2">今の装備</th><th colspan="2" class="eqc-new">${off ? '外すと' : 'これ'}</th></tr>`
    + '<tr class="eqc-sub-h"><th></th><th>今</th><th class="eqc-b">もと</th><th class="eqc-new">今</th><th class="eqc-b eqc-new">もと</th></tr></thead>'
    + `<tbody>${rows}</tbody></table>`;
  return `${head}${table}${sameLine(cmp)}${legend()}`;
}

function legend() {
  return '<div class="eqc-legend">今＝きたえ・★・れん金をふくむ強さ　もと＝きたえる前の強さ</div>';
}

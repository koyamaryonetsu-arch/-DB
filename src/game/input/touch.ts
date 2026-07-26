// スマートフォン向け仮想パッド（DOMオーバーレイ）

import { controls, type Action } from './controls';

export function setupTouchControls(): void {
  if (!('ontouchstart' in window)) return;
  const defs: { label: string; action: Action; style: Partial<CSSStyleDeclaration> }[] = [
    { label: '▲', action: 'up', style: { left: '58px', bottom: '96px', width: '48px', height: '44px' } },
    { label: '▼', action: 'down', style: { left: '58px', bottom: '8px', width: '48px', height: '44px' } },
    { label: '◀', action: 'left', style: { left: '8px', bottom: '52px', width: '48px', height: '44px' } },
    { label: '▶', action: 'right', style: { left: '108px', bottom: '52px', width: '48px', height: '44px' } },
    { label: 'A', action: 'confirm', style: { right: '10px', bottom: '56px', width: '56px', height: '56px', borderRadius: '50%' } },
    { label: 'B', action: 'cancel', style: { right: '74px', bottom: '12px', width: '52px', height: '52px', borderRadius: '50%' } },
    { label: 'M', action: 'menu', style: { right: '12px', top: '12px', width: '44px', height: '36px' } },
    { label: '≫', action: 'dash', style: { left: '58px', bottom: '150px', width: '48px', height: '36px' } },
  ];
  for (const def of defs) {
    const el = document.createElement('div');
    el.className = 'touch-btn';
    el.textContent = def.label;
    Object.assign(el.style, def.style);
    const press = (e: Event) => {
      e.preventDefault();
      controls.simulate(def.action, true);
    };
    const release = (e: Event) => {
      e.preventDefault();
      controls.simulate(def.action, false);
    };
    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });
    document.body.appendChild(el);
  }
}

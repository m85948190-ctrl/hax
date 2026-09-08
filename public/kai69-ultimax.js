/* KAI69-only controls: mode selector + collision-safe composer placement. Main HAxBRO AI is untouched. */
(() => {
  const KEY = 'haxbro_kai_mode';
  const valid = new Set(['restricted', 'offensive']);
  const saved = sessionStorage.getItem(KEY);
  window.haxbroKaiMode = valid.has(saved) ? saved : 'restricted';

  function $(id) { return document.getElementById(id); }

  function paintMode() {
    const mode = valid.has(window.haxbroKaiMode) ? window.haxbroKaiMode : 'restricted';
    const label = $('kaiModeLabel');
    const dot = $('kaiModeDot');
    const menu = $('kaiModeMenu');
    const btn = $('kaiModeBtn');
    if (label) label.textContent = mode.toUpperCase();
    if (dot) dot.className = mode;
    if (btn) btn.setAttribute('aria-label', 'KAI mode: ' + mode.toUpperCase());
    if (menu) menu.querySelectorAll('[data-kai-mode]').forEach(el => {
      const active = el.dataset.kaiMode === mode;
      el.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function setMode(mode) {
    if (!valid.has(mode)) return;
    window.haxbroKaiMode = mode;
    sessionStorage.setItem(KEY, mode);
    paintMode();
    const menu = $('kaiModeMenu');
    const btn = $('kaiModeBtn');
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function findBadge() {
    const direct = document.querySelector('#hb-badge, [data-hatchable-badge], .kai69-badge-wrap');
    if (direct) return direct;
    const nodes = Array.from(document.body.querySelectorAll('*'));
    return nodes.find(el => {
      if (!/hatchable/i.test((el.innerText || el.textContent || '').trim())) return false;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.position === 'fixed' && r.width > 20 && r.height > 10 && r.width < 420 && r.height < 180;
    }) || null;
  }

  function positionComposer() {
    const root = $('ultimaxMode');
    const shell = root?.querySelector('.ultimax-shell');
    const composer = $('ultimaxForm');
    if (!root || !shell || !composer) return;
    const badge = findBadge();
    if (!badge) {
      root.classList.remove('kai69-badge-clearance');
      shell.style.removeProperty('--kai69-composer-bottom');
      return;
    }
    const br = badge.getBoundingClientRect();
    const cr = composer.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const horizontalOverlap = cr.left < br.right && cr.right > br.left;
    const verticalOverlap = cr.top < br.bottom && cr.bottom > br.top;
    const badgeNearBottom = br.bottom > vh - 170;
    if (horizontalOverlap && (verticalOverlap || badgeNearBottom)) {
      const needed = Math.max(42, Math.ceil(vh - br.top + 16));
      root.classList.add('kai69-badge-clearance');
      shell.style.setProperty('--kai69-composer-bottom', needed + 'px');
    } else {
      root.classList.remove('kai69-badge-clearance');
      shell.style.removeProperty('--kai69-composer-bottom');
    }
  }

  function init() {
    paintMode();
    const btn = $('kaiModeBtn');
    const menu = $('kaiModeMenu');
    if (btn && menu) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        menu.hidden = !menu.hidden;
        btn.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
      });
      menu.querySelectorAll('[data-kai-mode]').forEach(el => {
        el.addEventListener('click', () => setMode(el.dataset.kaiMode));
      });
      document.addEventListener('click', e => {
        if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) {
          menu.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    }
    positionComposer();
    window.addEventListener('resize', positionComposer, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(positionComposer, 50), { passive: true });
    const observer = new MutationObserver(() => requestAnimationFrame(positionComposer));
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    setTimeout(positionComposer, 300);
    setTimeout(positionComposer, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
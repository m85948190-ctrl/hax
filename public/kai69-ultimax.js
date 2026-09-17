/* KAI-69 visual controller: theme authority + badge-safe composer placement. */
(() => {
  const $ = id => document.getElementById(id);

  function setTheme(theme = 'light') {
    const value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value;
    document.body?.classList.toggle('dark', value === 'dark');
    localStorage.setItem('haxbro_theme', value);
    window.applyVisualTheme?.(value);
    return value;
  }

  function findBadge() {
    const direct = document.querySelector('#hb-badge, [data-hatchable-badge], .kai69-badge-wrap');
    if (direct) return direct;
    const nodes = Array.from(document.body?.querySelectorAll('*') || []);
    return nodes.find(el => {
      if (!/hatchable/i.test((el.innerText || el.textContent || '').trim())) return false;
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return s.position === 'fixed' && r.width > 20 && r.height > 10 && r.width < 420 && r.height < 180;
    }) || null;
  }

  function positionComposer() {
    const composer = $('chatForm');
    if (!composer) return;
    const badge = findBadge();
    if (!badge) return;
    const br = badge.getBoundingClientRect();
    const cr = composer.getBoundingClientRect();
    const vh = window.innerHeight;
    const horizontalOverlap = cr.left < br.right && cr.right > br.left;
    const verticalOverlap = cr.top < br.bottom && cr.bottom > br.top;
    const badgeNearBottom = br.bottom > vh - 150;
    if (horizontalOverlap && (verticalOverlap || badgeNearBottom)) {
      const desiredBottom = Math.max(12, Math.ceil(vh - br.top + 14));
      composer.style.setProperty('--kai69-safe-bottom', desiredBottom + 'px');
      composer.classList.add('kai69-badge-safe');
    } else {
      composer.classList.remove('kai69-badge-safe');
      composer.style.removeProperty('--kai69-safe-bottom');
    }
  }

  function init() {
    // KAI-69 is explicitly in WHITE mode now. A previous saved dark profile
    // must not silently override the owner's latest instruction.
    const migration = 'haxbro_kai69_white_v1';
    if (localStorage.getItem(migration) !== '1') {
      setTheme('light');
      localStorage.setItem(migration, '1');
      const profileKey = `haxbro_ui_admin_${String(localStorage.getItem('haxbro_username') || 'guest').toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 32)}`;
      try {
        const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');
        profile.theme = 'light';
        localStorage.setItem(profileKey, JSON.stringify(profile));
      } catch {}
    }
    positionComposer();
    window.addEventListener('resize', positionComposer, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(positionComposer, 50), { passive: true });
    const observer = new MutationObserver(() => requestAnimationFrame(positionComposer));
    if (document.body) observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    setTimeout(positionComposer, 300);
    setTimeout(positionComposer, 1200);
  }

  window.KAI69 = Object.freeze({ setTheme, positionComposer });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
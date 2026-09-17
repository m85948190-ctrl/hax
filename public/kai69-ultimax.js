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
      const text = String(el.innerText || el.textContent || '').trim();
      const meta = `${el.id || ''} ${el.className || ''} ${el.getAttribute?.('aria-label') || ''} ${el.getAttribute?.('title') || ''}`;
      if (!/hatchable/i.test(`${text} ${meta}`)) return false;
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return ['fixed','sticky'].includes(s.position) && r.width > 20 && r.height > 10 && r.width < 520 && r.height < 220;
    }) || null;
  }

  function positionComposer() {
    const composer = $('chatForm');
    if (!composer) return;

    /* Never allow the composer to fall back to the page's old absolute/mobile
       bottom rules. KAI-69 always reserves a protected viewport zone. */
    composer.classList.add('kai69-badge-safe');

    const badge = findBadge();
    const vv = window.visualViewport;
    const viewportHeight = Math.round(vv?.height || window.innerHeight);
    const viewportOffsetTop = Math.round(vv?.offsetTop || 0);

    // Conservative clearance even when the platform badge is temporarily not
    // discoverable (for example while Hatchable is injecting it).
    let safeBottom = viewportHeight <= 700 ? 108 : 120;

    if (badge) {
      const br = badge.getBoundingClientRect();
      const cr = composer.getBoundingClientRect();
      const horizontalOverlap = cr.left < br.right && cr.right > br.left;
      const badgeAtBottom = br.bottom > viewportHeight * 0.68;
      const badgeAtTop = br.top < viewportHeight * 0.32;

      // If the badge is in the lower zone, put the composer completely above
      // its top edge. If it is elsewhere, retain the protected floating zone.
      if (horizontalOverlap && badgeAtBottom) {
        safeBottom = Math.max(safeBottom, Math.ceil(viewportHeight - br.top + 18));
      }

      // Never let a tall composer grow into the badge from above.
      if (horizontalOverlap && badgeAtTop && cr.bottom > br.top) {
        safeBottom = Math.max(safeBottom, Math.ceil(viewportHeight - br.top + cr.height + 18));
      }
    }

    // Account for browser safe-area and visual viewport movement on phones.
    const safeArea = viewportHeight < window.innerHeight ? 8 : 0;
    safeBottom += safeArea;
    composer.style.setProperty('--kai69-safe-bottom', `${safeBottom}px`);
    composer.dataset.kai69BadgeState = badge ? 'detected' : 'reserved';

    // Reserve the entire composer zone for the chat stream. This keeps KAI's
    // thinking pill, generated answers, attachments and the Hatchable logo
    // visibly above the input instead of allowing content to disappear behind it.
    const messages = $('messages');
    if (messages) {
      const cr = composer.getBoundingClientRect();
      const reserve = Math.max(132, Math.ceil(viewportHeight - cr.top + 24));
      messages.style.setProperty('--kai69-content-bottom', `${reserve}px`);
      messages.style.paddingBottom = `${reserve}px`;
    }
  }

  function init() {
    // Respect the user's saved theme. If none exists, prefer the system theme;
    // never force a one-time light-mode migration over an explicit choice.
    const saved = localStorage.getItem('haxbro_theme');
    const initial = saved === 'dark' || saved === 'light' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    positionComposer();
    window.addEventListener('resize', positionComposer, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(positionComposer, 50), { passive: true });
    window.visualViewport?.addEventListener('resize', positionComposer, { passive: true });
    window.visualViewport?.addEventListener('scroll', positionComposer, { passive: true });
    // Watch for Hatchable inserting/removing its badge, but do not observe
    // style/class mutations because KAI-69 itself changes those properties.
    const observer = new MutationObserver(() => requestAnimationFrame(positionComposer));
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(positionComposer, 100);
    setTimeout(positionComposer, 500);
    setTimeout(positionComposer, 1200);
    setTimeout(positionComposer, 2500);
  }

  window.KAI69 = Object.freeze({ setTheme, positionComposer });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
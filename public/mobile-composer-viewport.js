/* HAxBRO iOS composer: never leave a stale keyboard offset or suspended bar. */
(() => {
  if (window.__haxbroViewportComposerV2) return;
  window.__haxbroViewportComposerV2 = true;
  const root = document.documentElement;
  const form = () => document.getElementById('chatForm');
  const input = () => document.getElementById('promptInput');
  let frame = 0;
  function sync() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const f = form(), i = input();
      if (!f) return;
      const vv = window.visualViewport;
      const layoutHeight = window.innerHeight || root.clientHeight;
      const visualHeight = vv ? vv.height : layoutHeight;
      const focused = !!i && document.activeElement === i;
      // Use viewport height (not offsetTop) and only lift while the prompt is focused.
      const keyboardOpen = focused && (layoutHeight - visualHeight > 140);
      const inset = keyboardOpen ? Math.max(0, Math.round(layoutHeight - visualHeight)) : 0;
      root.style.setProperty('--hb-keyboard-inset', inset + 'px');
      f.style.setProperty('bottom', 'calc(8px + env(safe-area-inset-bottom, 0px) + var(--hb-keyboard-inset, 0px))', 'important');
      f.style.setProperty('position', 'fixed', 'important');
      f.style.removeProperty('top');
      f.style.removeProperty('transform');
    });
  }
  function resetAfterKeyboardClose() {
    // Safari emits several viewport events during dismissal; reset now and after settling.
    root.style.setProperty('--hb-keyboard-inset', '0px');
    const f = form();
    if (f) f.style.setProperty('bottom', 'calc(8px + env(safe-area-inset-bottom, 0px))', 'important');
    sync();
    setTimeout(() => {
      if (!input() || document.activeElement !== input()) {
        root.style.setProperty('--hb-keyboard-inset', '0px');
        const current = form();
        if (current) current.style.setProperty('bottom', 'calc(8px + env(safe-area-inset-bottom, 0px))', 'important');
      }
    }, 280);
    setTimeout(sync, 420);
  }
  document.addEventListener('focusin', e => { if (e.target?.id === 'promptInput') sync(); }, true);
  document.addEventListener('focusout', e => { if (e.target?.id === 'promptInput') setTimeout(resetAfterKeyboardClose, 60); }, true);
  document.addEventListener('click', e => {
    if (e.target?.closest?.('#sendBtn')) {
      // script.js reads the value synchronously in its click handler before this blur.
      setTimeout(() => { input()?.blur(); resetAfterKeyboardClose(); }, 90);
    }
  }, true);
  document.addEventListener('submit', e => {
    if (e.target?.id === 'chatForm') {
      setTimeout(() => { input()?.blur(); resetAfterKeyboardClose(); }, 0);
    }
  }, true);
  window.addEventListener('resize', sync, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(resetAfterKeyboardClose, 180), { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', sync, { passive: true });
    window.visualViewport.addEventListener('scroll', sync, { passive: true });
  }
  window.addEventListener('pageshow', () => setTimeout(resetAfterKeyboardClose, 80), { passive: true });
  sync();
})();
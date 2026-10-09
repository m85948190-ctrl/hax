/* HAxBRO iOS visual-viewport composer correction.
   Recalculate while the keyboard opens/closes; always reset the keyboard inset
   when focus leaves the prompt so the composer cannot remain suspended. */
(() => {
  if (window.__haxbroViewportComposerV1) return;
  window.__haxbroViewportComposerV1 = true;
  const root = document.documentElement;
  const getForm = () => document.querySelector('#chatForm.composer');
  const getInput = () => document.querySelector('#promptInput');
  let raf = 0;
  function syncViewport() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const form = getForm();
      const input = getInput();
      if (!form) return;
      const vv = window.visualViewport;
      const focused = !!input && document.activeElement === input;
      const layoutHeight = window.innerHeight || document.documentElement.clientHeight;
      const visualBottom = vv ? vv.height + vv.offsetTop : layoutHeight;
      const obscured = Math.max(0, Math.round(layoutHeight - visualBottom));
      // Only lift the composer when the prompt is focused and the visual viewport
      // indicates a real keyboard. Otherwise explicitly clear any stale offset.
      const keyboardInset = focused && obscured > 120 ? obscured : 0;
      root.style.setProperty('--hb-keyboard-inset', keyboardInset + 'px');
      form.style.removeProperty('top');
      form.style.removeProperty('transform');
      form.style.setProperty('bottom', 'calc(8px + env(safe-area-inset-bottom, 0px) + var(--hb-keyboard-inset, 0px))', 'important');
    });
  }
  function resetIfBlurred() {
    requestAnimationFrame(() => {
      const input = getInput();
      if (!input || document.activeElement !== input) {
        root.style.setProperty('--hb-keyboard-inset', '0px');
        const form = getForm();
        if (form) {
          form.style.removeProperty('top');
          form.style.removeProperty('transform');
          form.style.setProperty('bottom', 'calc(8px + env(safe-area-inset-bottom, 0px))', 'important');
        }
      }
      syncViewport();
    });
  }
  document.addEventListener('focusin', e => {
    if (e.target && e.target.id === 'promptInput') syncViewport();
  }, true);
  document.addEventListener('focusout', e => {
    if (e.target && e.target.id === 'promptInput') setTimeout(resetIfBlurred, 80);
  }, true);
  document.addEventListener('submit', e => {
    if (e.target && e.target.id === 'chatForm') {
      if (getInput()) getInput().blur();
      setTimeout(resetIfBlurred, 40);
    }
  }, true);
  window.addEventListener('resize', syncViewport, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(syncViewport, 180), { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', syncViewport, { passive: true });
  }
  // Initial sync plus a second pass after Safari finishes its first layout.
  syncViewport();
  window.addEventListener('pageshow', () => setTimeout(syncViewport, 80), { passive: true });
})();
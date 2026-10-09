/* HAxBRO send safety net: prevent native form navigation on iOS and route Send exactly once. */
(() => {
  if (window.__haxbroSendGuardV1) return;
  window.__haxbroSendGuardV1 = true;
  function sendCurrent() {
    const field = document.getElementById('promptInput');
    const text = String(field?.value || '').trim();
    if (!text) return;
    const send = window.HAxBROSendChat || window.sendChat;
    if (typeof send === 'function') {
      Promise.resolve(send(text)).catch(error => {
        console.error('[HAxBRO send guard] send failed', error);
        window.dispatchEvent(new CustomEvent('haxbro:send-error', {detail:{message:'Message could not be sent. Please try again.'}}));
      });
    } else {
      console.error('[HAxBRO send guard] sendChat is not available');
    }
  }
  // Capture phase is intentional: this runs before browser default navigation and before legacy listeners.
  document.addEventListener('submit', event => {
    if (event.target?.id !== 'chatForm') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    sendCurrent();
  }, true);
  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#sendBtn');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    sendCurrent();
    const field = document.getElementById('promptInput');
    if (field) field.blur();
  }, true);
  document.addEventListener('keydown', event => {
    if (event.target?.id !== 'promptInput' || event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    sendCurrent();
    event.target.blur();
  }, true);
  window.addEventListener('haxbro:send-error', event => {
    const messages = document.getElementById('messages');
    if (!messages) return;
    const row = document.createElement('div');
    row.className = 'message bot-message';
    row.textContent = event.detail?.message || 'Message could not be sent. Please try again.';
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  });
})();
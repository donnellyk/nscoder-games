const END_SESSION_CONFIRM_MS = 3000;

// Module-level, like the End game confirm in playScreen.js: a single,
// permanent document click listener cancels whichever setup screen's panel
// is currently showing "Confirm end session", and state resets on every
// mount so a stale confirmation never leaks into a fresh screen.
let confirmingEndSession = false;
let confirmTimer = null;
let activeResetConfirm = null;

document.addEventListener('click', (event) => {
  if (!confirmingEndSession) return;
  if (event.target.closest?.('[data-action="end-session"]')) return;
  activeResetConfirm?.();
});

const template = (session, available, confirming) => {
  if (!session) {
    return `
      <section class="session-panel">
        <p class="session-panel__hint">Items will not repeat across games until you end the session.</p>
        <button type="button" class="session-panel__button" data-action="start-session">Start session</button>
      </section>
    `;
  }

  const usedCount = session.usedIds.length;

  return `
    <section class="session-panel session-panel--active">
      <p class="session-panel__status">
        Session active — game ${session.gamesPlayed + 1} next · ${usedCount} item${usedCount === 1 ? '' : 's'} used · ${available} still available
      </p>
      <button type="button" class="session-panel__button session-panel__button--end${confirming ? ' confirming' : ''}" data-action="end-session">
        ${confirming ? 'Confirm end session' : 'End session'}
      </button>
    </section>
  `;
};

/**
 * Self-contained "Session" panel for the setup screen: renders the
 * start/active state and owns the two-step end-session confirm entirely
 * internally. The caller only ever needs to call `render(session,
 * available)` — `available` is the count of items still playable in this
 * session under the host's current filters, which the caller already
 * computes for the "N matching items" line below it.
 */
export const mountSessionPanel = (container, { onStart, onEnd }) => {
  confirmingEndSession = false;
  if (confirmTimer) {
    clearTimeout(confirmTimer);
    confirmTimer = null;
  }

  let session = null;
  let available = 0;

  const draw = () => {
    container.innerHTML = template(session, available, confirmingEndSession);
  };

  const resetConfirm = () => {
    confirmingEndSession = false;
    if (confirmTimer) {
      clearTimeout(confirmTimer);
      confirmTimer = null;
    }
    draw();
  };
  activeResetConfirm = resetConfirm;

  container.onclick = (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    if (target.dataset.action === 'start-session') {
      onStart();
      return;
    }

    if (target.dataset.action === 'end-session') {
      if (!confirmingEndSession) {
        confirmingEndSession = true;
        confirmTimer = setTimeout(resetConfirm, END_SESSION_CONFIRM_MS);
        draw();
      } else {
        resetConfirm();
        onEnd();
      }
    }
  };

  const render = (nextSession, nextAvailable) => {
    session = nextSession;
    available = nextAvailable;
    draw();
  };

  return { render };
};

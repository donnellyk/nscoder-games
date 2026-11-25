// Pointer Events give full control over the dragged element and behave the
// same on touch and mouse, unlike the HTML drag-and-drop API.
const DEFAULT_THRESHOLD = 140;

const nearestZone = (zones, x, y, threshold) => {
  const nearest = zones.reduce((best, zone) => {
    const rect = zone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(x - cx, y - cy);
    return dist < best.dist ? { zone, dist } : best;
  }, { zone: null, dist: Infinity });

  return nearest.dist <= threshold ? nearest.zone : null;
};

const gapOf = (zone) => (zone ? Number(zone.dataset.gap) : null);

/**
 * Wires pointer-based dragging onto `element`. `getDropZones()` is read once
 * per drag (drop zones don't move mid-drag by design), and `onHover` fires
 * only when the nearest gap changes; `onDrop` fires exactly once, with the
 * gap under the pointer at release or null if none is within range.
 *
 * `onMove`, if given, is called with `element`'s live bounding rect on every
 * pointer move, and with `null` once the drag ends or is cancelled. It is
 * generic on purpose (a rect, not a gap or a fraction) so callers can turn
 * it into whatever coordinate space they need.
 */
export const makeDraggable = (element, { getDropZones, onHover, onDrop, onMove, threshold = DEFAULT_THRESHOLD }) => {
  let pointerId = null;
  let zones = [];
  let lastGap = null;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;

  const onPointerMove = (event) => {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    element.style.left = `${originLeft + dx}px`;
    element.style.top = `${originTop + dy}px`;

    const gap = gapOf(nearestZone(zones, event.clientX, event.clientY, threshold));
    if (gap !== lastGap) {
      lastGap = gap;
      onHover(gap);
    }
    onMove?.(element.getBoundingClientRect());
  };

  const teardown = () => {
    element.removeEventListener('pointermove', onPointerMove);
    element.removeEventListener('pointerup', onPointerUp);
    element.removeEventListener('pointercancel', onPointerCancel);
    element.classList.remove('dragging');
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    element.style.width = '';
    element.style.zIndex = '';
    if (pointerId !== null) {
      try {
        element.releasePointerCapture(pointerId);
      } catch {
        // capture already released (e.g. pointercancel)
      }
    }
    pointerId = null;
    zones = [];
    onMove?.(null);
  };

  function onPointerUp(event) {
    if (event.pointerId !== pointerId) return;
    const gap = gapOf(nearestZone(zones, event.clientX, event.clientY, threshold));
    teardown();
    onDrop(gap);
  }

  function onPointerCancel(event) {
    if (event.pointerId !== pointerId) return;
    teardown();
    onDrop(null);
  }

  const onPointerDown = (event) => {
    if (pointerId !== null) return;
    pointerId = event.pointerId;
    zones = getDropZones();
    lastGap = null;

    const rect = element.getBoundingClientRect();
    originLeft = rect.left;
    originTop = rect.top;
    startX = event.clientX;
    startY = event.clientY;

    element.style.width = `${rect.width}px`;
    element.style.position = 'fixed';
    element.style.left = `${originLeft}px`;
    element.style.top = `${originTop}px`;
    element.style.zIndex = '1000';
    element.classList.add('dragging');

    element.setPointerCapture(pointerId);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerCancel);
  };

  element.addEventListener('pointerdown', onPointerDown);

  return () => {
    element.removeEventListener('pointerdown', onPointerDown);
    teardown();
  };
};

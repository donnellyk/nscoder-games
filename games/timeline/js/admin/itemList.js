import { formatDate } from '../dates.js';
import { escapeHtml } from './html.js';

const CATEGORY_LABEL = { hardware: 'Hardware', software: 'Software', accessory: 'Accessory' };

const byDate = (a, b) => a.date.localeCompare(b.date);

const rowHtml = (item, included, used) => `
  <tr class="item-row${included ? '' : ' item-row--excluded'}${used ? ' item-row--used' : ''}">
    <td class="item-row__include">
      <input type="checkbox" data-action="toggle-item" data-id="${escapeHtml(item.id)}" ${included ? 'checked' : ''} />
    </td>
    <td class="item-row__name">${escapeHtml(item.name)}${used ? ' <span class="item-row__badge">used</span>' : ''}</td>
    <td class="item-row__category">${CATEGORY_LABEL[item.category] ?? escapeHtml(item.category)}</td>
    <td class="item-row__date">${escapeHtml(formatDate(item.date))}</td>
    <td class="item-row__tier">Tier ${item.tier}</td>
  </tr>
`;

/**
 * A self-contained master list of every item: a client-side name filter and
 * a per-item include/exclude checkbox. Mounted once by the setup screen and
 * never rebuilt from outside afterwards, so typing in the filter box (or in
 * any other setup field) never steals focus from this list or vice versa.
 *
 * `usedIds` (items already shown this session) is a snapshot taken at mount
 * time: within one mount it only ever goes from empty to empty (starting or
 * ending a session while sitting on this screen never leaves usedIds
 * non-empty), so it never needs to be re-applied after mount.
 */
export const mountItemList = (allItems, initialExcluded, usedIds, { onChange }) => {
  const sorted = [...allItems].sort(byDate);
  let excluded = new Set(initialExcluded);
  const used = new Set(usedIds);
  let filterText = '';

  const details = document.createElement('details');
  details.className = 'item-list';

  const summary = document.createElement('summary');
  summary.className = 'item-list__summary';
  details.append(summary);

  const body = document.createElement('div');
  body.className = 'item-list__body';
  body.innerHTML = `
    <div class="item-list__controls">
      <input type="text" class="item-list__filter" placeholder="Filter by name" />
      <button type="button" class="item-list__include-all" data-action="include-all">Include all</button>
    </div>
    <div class="item-list__scroll">
      <table class="item-table">
        <tbody></tbody>
      </table>
    </div>
  `;
  details.append(body);

  const tbody = body.querySelector('tbody');
  const filterInput = body.querySelector('.item-list__filter');

  const updateSummary = () => {
    const unavailable = new Set([...excluded, ...used]);
    const inPlay = sorted.length - unavailable.size;
    summary.textContent = `Items — ${inPlay} of ${sorted.length} in play`;
  };

  const renderRows = () => {
    const needle = filterText.trim().toLowerCase();
    const visible = needle ? sorted.filter((item) => item.name.toLowerCase().includes(needle)) : sorted;
    tbody.innerHTML = visible.map((item) => rowHtml(item, !excluded.has(item.id), used.has(item.id))).join('');
  };

  updateSummary();
  renderRows();

  body.addEventListener('input', (event) => {
    if (event.target !== filterInput) return;
    filterText = filterInput.value;
    renderRows();
  });

  body.addEventListener('change', (event) => {
    const target = event.target;
    if (target.dataset.action !== 'toggle-item') return;
    if (target.checked) excluded.delete(target.dataset.id);
    else excluded.add(target.dataset.id);
    target.closest('.item-row')?.classList.toggle('item-row--excluded', !target.checked);
    updateSummary();
    onChange([...excluded]);
  });

  body.addEventListener('click', (event) => {
    if (!event.target.closest('[data-action="include-all"]')) return;
    excluded = new Set();
    updateSummary();
    renderRows();
    onChange([]);
  });

  return { element: details };
};

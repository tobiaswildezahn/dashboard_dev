/**
 * Table Komponente
 */

import { DOM_IDS } from '../utils/constants.js';
import { formatTimestamp, roundNumber } from '../utils/helpers.js';

export function updateTable(data) {
  const tbody = document.getElementById(DOM_IDS.TABLE_BODY);
  const recordCount = document.getElementById(DOM_IDS.TABLE_RECORD_COUNT);

  if (recordCount) {
    recordCount.textContent = data.length.toString();
  }

  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div>Keine Daten verfügbar</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(item => createTableRow(item)).join('');
}

function createTableRow(item) {
  const responseStatus = getStatusBadgeType(item.responseTime, item.responseAchieved);
  const travelStatus = getStatusBadgeType(item.travelTime, item.travelAchieved);
  const hilfsfristStatus = getHilfsfristStatus(item);

  const relevanzBadge = item.isHilfsfristRelevant
    ? '<span class="hilfsfrist-relevant">RELEVANT</span>'
    : '<span class="hilfsfrist-nicht-relevant">NICHT REL.</span>';

  const einsatztyp = item.nameeventtype || 'N/A';

  return `
    <tr>
      <td><strong>${item.call_sign || 'N/A'}</strong></td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(einsatztyp)}">${escapeHtml(einsatztyp)}</td>
      <td>${relevanzBadge}</td>
      <td>${formatTimestamp(item.time_alarm)}</td>
      <td>${formatTime(item.responseTime)}</td>
      <td>${createStatusBadge(responseStatus)}</td>
      <td>${formatTime(item.travelTime)}</td>
      <td>${createStatusBadge(travelStatus)}</td>
      <td>${createStatusBadge(hilfsfristStatus)}</td>
      <td>${item.idevent || 'N/A'}</td>
    </tr>
  `;
}

function getStatusBadgeType(time, achieved) {
  if (time === null) return 'na';
  return achieved ? 'success' : 'danger';
}

function getHilfsfristStatus(item) {
  if (item.responseTime !== null && item.travelTime !== null) {
    return item.hilfsfristAchieved ? 'success' : 'danger';
  }
  return 'na';
}

function formatTime(time) {
  if (time === null) return 'N/A';
  return roundNumber(time) + 's';
}

function createStatusBadge(status) {
  const badges = {
    success: '<span class="status-badge success">✓ OK</span>',
    danger: '<span class="status-badge danger">✗ Nicht erreicht</span>',
    na: '<span class="status-badge na">N/A</span>'
  };
  return badges[status];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

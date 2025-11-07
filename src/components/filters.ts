/**
 * Filter Komponente - Zeit- und RTW-Filter
 */

import type { ProcessedEinsatz } from '../types/types.js';
import { DOM_IDS, TIME_FILTER_OPTIONS } from '../utils/constants.js';
import { extractUniqueRtw } from '../services/data-processor.service.js';

// ============================================================================
// State
// ============================================================================

let selectedRtwList: string[] = [];
let onFilterChangeCallback: (() => void) | null = null;

// ============================================================================
// RTW Picker
// ============================================================================

/**
 * Initialisiert den RTW-Picker mit Checkboxen
 */
export function populateRtwPicker(data: ProcessedEinsatz[]): void {
  const grid = document.getElementById(DOM_IDS.RTW_CHECKBOX_GRID);
  if (!grid) return;

  const rtwList = extractUniqueRtw(data);
  grid.innerHTML = '';

  rtwList.forEach(rtw => {
    const item = document.createElement('div');
    item.className = 'rtw-checkbox-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `rtw_${rtw}`;
    checkbox.value = rtw;
    checkbox.checked = selectedRtwList.length === 0 || selectedRtwList.includes(rtw);
    checkbox.addEventListener('change', onRtwSelectionChange);

    const label = document.createElement('label');
    label.htmlFor = `rtw_${rtw}`;
    label.textContent = rtw;

    item.appendChild(checkbox);
    item.appendChild(label);
    grid.appendChild(item);
  });

  updateRtwSelectedCount();
}

/**
 * Handler für RTW-Auswahl-Änderungen
 */
function onRtwSelectionChange(): void {
  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    `#${DOM_IDS.RTW_CHECKBOX_GRID} input[type="checkbox"]`
  );

  selectedRtwList = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  updateRtwSelectedCount();

  if (onFilterChangeCallback) {
    onFilterChangeCallback();
  }
}

/**
 * Aktualisiert die Anzeige der ausgewählten RTWs
 */
function updateRtwSelectedCount(): void {
  const total = document.querySelectorAll(
    `#${DOM_IDS.RTW_CHECKBOX_GRID} input[type="checkbox"]`
  ).length;
  const selected = selectedRtwList.length;
  const countSpan = document.getElementById(DOM_IDS.RTW_SELECTED_COUNT);

  if (!countSpan) return;

  if (selected === 0 || selected === total) {
    countSpan.textContent = '(Alle ausgewählt)';
  } else {
    countSpan.textContent = `(${selected} von ${total} ausgewählt)`;
  }
}

/**
 * Toggle RTW-Picker Sichtbarkeit
 */
export function toggleRtwPicker(): void {
  const content = document.getElementById(DOM_IDS.RTW_PICKER_CONTENT);
  const toggle = document.querySelector('.rtw-picker-toggle');

  if (content && toggle) {
    content.classList.toggle('visible');
    toggle.classList.toggle('expanded');
  }
}

/**
 * Wählt alle RTWs aus
 */
export function selectAllRtw(): void {
  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    `#${DOM_IDS.RTW_CHECKBOX_GRID} input[type="checkbox"]`
  );
  checkboxes.forEach(cb => (cb.checked = true));
  onRtwSelectionChange();
}

/**
 * Wählt alle RTWs ab
 */
export function deselectAllRtw(): void {
  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    `#${DOM_IDS.RTW_CHECKBOX_GRID} input[type="checkbox"]`
  );
  checkboxes.forEach(cb => (cb.checked = false));
  onRtwSelectionChange();
}

// ============================================================================
// Getter
// ============================================================================

export function getSelectedRtwList(): string[] {
  return selectedRtwList;
}

export function setFilterChangeCallback(callback: () => void): void {
  onFilterChangeCallback = callback;
}

// ============================================================================
// Time Filter
// ============================================================================

/**
 * Initialisiert den Zeitfilter mit allen Optionen
 */
export function initializeTimeFilter(): void {
  const select = document.getElementById(DOM_IDS.TIME_FILTER) as HTMLSelectElement;
  if (!select) return;

  select.innerHTML = '';

  TIME_FILTER_OPTIONS.forEach((option: { label: string; value: string }) => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.label;

    // Default: 24 Stunden
    if (option.value === '24') {
      optionElement.selected = true;
    }

    select.appendChild(optionElement);
  });
}

/**
 * Gibt die aktuelle Zeitfilter-Konfiguration zurück
 */
export function getTimeFilterConfig(): { hours: number | 'current-shift' } {
  const select = document.getElementById(DOM_IDS.TIME_FILTER) as HTMLSelectElement;
  if (!select) return { hours: 24 };

  const value = select.value;

  if (value === 'current-shift') {
    return { hours: 'current-shift' };
  }

  return { hours: parseInt(value, 10) };
}

// ============================================================================
// Event Listener Setup
// ============================================================================

export function setupFilterEventListeners(
  onRefresh: () => void,
  onExport: () => void
): void {
  // Refresh Button
  const refreshBtn = document.getElementById(DOM_IDS.REFRESH_BTN);
  refreshBtn?.addEventListener('click', onRefresh);

  // Export Button
  const exportBtn = document.getElementById(DOM_IDS.EXPORT_BTN);
  exportBtn?.addEventListener('click', onExport);

  // Time Filter
  const timeFilter = document.getElementById(DOM_IDS.TIME_FILTER);
  timeFilter?.addEventListener('change', onRefresh);

  // RTW Picker Toggle
  const rtwPickerToggle = document.getElementById(DOM_IDS.RTW_PICKER_TOGGLE);
  rtwPickerToggle?.addEventListener('click', toggleRtwPicker);

  // RTW Select/Deselect All
  const selectAllBtn = document.getElementById(DOM_IDS.SELECT_ALL_RTW_BTN);
  selectAllBtn?.addEventListener('click', selectAllRtw);

  const deselectAllBtn = document.getElementById(DOM_IDS.DESELECT_ALL_RTW_BTN);
  deselectAllBtn?.addEventListener('click', deselectAllRtw);
}

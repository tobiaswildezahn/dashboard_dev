/**
 * Filter Komponente - Zeit- und RTW-Filter
 */

import { DOM_IDS, TIME_FILTER_OPTIONS } from '../utils/constants.js';
import { extractUniqueRtw } from '../services/data-processor.service.js';

// State
let selectedRtwList = [];
let onFilterChangeCallback = null;

// RTW Picker
export function populateRtwPicker(data) {
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

function onRtwSelectionChange() {
  const checkboxes = document.querySelectorAll(`#${DOM_IDS.RTW_CHECKBOX_GRID} input[type="checkbox"]`);

  selectedRtwList = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  updateRtwSelectedCount();

  if (onFilterChangeCallback) {
    onFilterChangeCallback();
  }
}

function updateRtwSelectedCount() {
  const total = document.querySelectorAll(`#${DOM_IDS.RTW_CHECKBOX_GRID} input[type="checkbox"]`).length;
  const selected = selectedRtwList.length;
  const countSpan = document.getElementById(DOM_IDS.RTW_SELECTED_COUNT);

  if (!countSpan) return;

  if (selected === 0 || selected === total) {
    countSpan.textContent = '(Alle ausgewählt)';
  } else {
    countSpan.textContent = `(${selected} von ${total} ausgewählt)`;
  }
}

export function toggleRtwPicker() {
  const content = document.getElementById(DOM_IDS.RTW_PICKER_CONTENT);
  const toggle = document.querySelector('.rtw-picker-toggle');

  if (content && toggle) {
    content.classList.toggle('visible');
    toggle.classList.toggle('expanded');
  }
}

export function selectAllRtw() {
  const checkboxes = document.querySelectorAll(`#${DOM_IDS.RTW_CHECKBOX_GRID} input[type="checkbox"]`);
  checkboxes.forEach(cb => (cb.checked = true));
  onRtwSelectionChange();
}

export function deselectAllRtw() {
  const checkboxes = document.querySelectorAll(`#${DOM_IDS.RTW_CHECKBOX_GRID} input[type="checkbox"]`);
  checkboxes.forEach(cb => (cb.checked = false));
  onRtwSelectionChange();
}

export function getSelectedRtwList() {
  return selectedRtwList;
}

export function setFilterChangeCallback(callback) {
  onFilterChangeCallback = callback;
}

// Time Filter
export function initializeTimeFilter() {
  const select = document.getElementById(DOM_IDS.TIME_FILTER);
  if (!select) return;

  select.innerHTML = '';

  TIME_FILTER_OPTIONS.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.label;

    if (option.value === '24') {
      optionElement.selected = true;
    }

    select.appendChild(optionElement);
  });
}

export function getTimeFilterConfig() {
  const select = document.getElementById(DOM_IDS.TIME_FILTER);
  if (!select) return { hours: 24 };

  const value = select.value;

  if (value === 'current-shift') {
    return { hours: 'current-shift' };
  }

  return { hours: parseInt(value, 10) };
}

export function setupFilterEventListeners(onRefresh, onExport) {
  const refreshBtn = document.getElementById(DOM_IDS.REFRESH_BTN);
  if (refreshBtn) refreshBtn.addEventListener('click', onRefresh);

  const exportBtn = document.getElementById(DOM_IDS.EXPORT_BTN);
  if (exportBtn) exportBtn.addEventListener('click', onExport);

  const timeFilter = document.getElementById(DOM_IDS.TIME_FILTER);
  if (timeFilter) timeFilter.addEventListener('change', onRefresh);

  const rtwPickerToggle = document.getElementById(DOM_IDS.RTW_PICKER_TOGGLE);
  if (rtwPickerToggle) rtwPickerToggle.addEventListener('click', toggleRtwPicker);

  const selectAllBtn = document.getElementById(DOM_IDS.SELECT_ALL_RTW_BTN);
  if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllRtw);

  const deselectAllBtn = document.getElementById(DOM_IDS.DESELECT_ALL_RTW_BTN);
  if (deselectAllBtn) deselectAllBtn.addEventListener('click', deselectAllRtw);
}

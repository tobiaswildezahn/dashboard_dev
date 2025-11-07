/**
 * RTW Hilfsfrist Dashboard V7 - Browser Edition
 * Haupteinstiegspunkt
 */

import { CONFIG, MESSAGES } from './utils/constants.js';
import { showLoading, hideLoading, showMessage, updateLastUpdate } from './utils/helpers.js';
import { fetchAllData } from './services/arcgis.service.js';
import { processData, calculateKPIs, filterByRtw } from './services/data-processor.service.js';
import { exportToCSV } from './services/export.service.js';
import {
  initializeTimeFilter,
  getTimeFilterConfig,
  populateRtwPicker,
  setupFilterEventListeners,
  setFilterChangeCallback,
  getSelectedRtwList
} from './components/filters.js';
import { updateKPICards } from './components/kpi-cards.js';
import { updateAllCharts, loadChartVisibilityFromStorage } from './components/charts.js';
import { updateTable } from './components/table.js';

// Global State
const state = {
  processedData: [],
  autoRefreshTimer: null
};

// Data Fetching
async function fetchData(options = {}) {
  const {
    updateFilters = true,
    showLoadingIndicator = true,
    showSuccessMessage = true
  } = options;

  if (showLoadingIndicator) {
    showLoading();
  }

  try {
    const timeFilter = getTimeFilterConfig();
    const { resources, events } = await fetchAllData(timeFilter);

    state.processedData = processData(resources.features, events.features);

    if (updateFilters) {
      populateRtwPicker(state.processedData);
    }

    updateDashboard();
    updateLastUpdate();

    if (showSuccessMessage) {
      showMessage(MESSAGES.DATA_LOADED(state.processedData.length), 'success');
    }
  } catch (error) {
    console.error('Fehler beim Laden der Daten:', error);
    showMessage(MESSAGES.DATA_ERROR, 'error');
  } finally {
    if (showLoadingIndicator) {
      hideLoading();
    }
  }
}

// Dashboard Update
function updateDashboard() {
  const selectedRtwList = getSelectedRtwList();
  const filteredData = filterByRtw(state.processedData, selectedRtwList);

  const kpis = calculateKPIs(filteredData);

  updateKPICards(kpis);
  updateAllCharts(filteredData);
  updateTable(filteredData);
}

// Export Handler
function handleExport() {
  try {
    const selectedRtwList = getSelectedRtwList();
    const filteredData = filterByRtw(state.processedData, selectedRtwList);

    if (filteredData.length === 0) {
      showMessage(MESSAGES.NO_DATA, 'error');
      return;
    }

    exportToCSV(filteredData);
    showMessage(MESSAGES.EXPORT_SUCCESS(filteredData.length), 'success');
  } catch (error) {
    console.error('Fehler beim CSV-Export:', error);
    showMessage('❌ Fehler beim CSV-Export', 'error');
  }
}

// Auto-Refresh
function startAutoRefresh() {
  if (state.autoRefreshTimer) {
    clearInterval(state.autoRefreshTimer);
  }

  state.autoRefreshTimer = setInterval(() => {
    fetchData({
      updateFilters: false,
      showLoadingIndicator: false,
      showSuccessMessage: false
    });
  }, CONFIG.autoRefreshInterval);

  console.log(`Auto-Refresh gestartet (${CONFIG.autoRefreshInterval / 1000}s)`);
}

function stopAutoRefresh() {
  if (state.autoRefreshTimer) {
    clearInterval(state.autoRefreshTimer);
    state.autoRefreshTimer = null;
    console.log('Auto-Refresh gestoppt');
  }
}

// Initialization
async function init() {
  console.log('RTW Hilfsfrist Dashboard V7 (Browser Edition) wird initialisiert...');
  console.log('Features:');
  console.log('✅ ES6 Modules & Modularisierte Architektur');
  console.log('✅ Granulare Histogramme (10s bzw. 1min Schritte)');
  console.log('✅ Kompaktes Datumsformat in Zeitreihe');
  console.log('✅ Neuer Zeitfilter: Aktuelle Schicht (07:00-07:00)');
  console.log('✅ Keine Build-Tools erforderlich - läuft direkt im Browser');

  loadChartVisibilityFromStorage();
  initializeTimeFilter();

  setupFilterEventListeners(
    () => fetchData(),
    handleExport
  );

  setFilterChangeCallback(updateDashboard);

  await fetchData();
  startAutoRefresh();

  console.log('✅ Dashboard erfolgreich initialisiert');
}

// Start Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup
window.addEventListener('beforeunload', () => {
  stopAutoRefresh();
});

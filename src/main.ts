/**
 * RTW Hilfsfrist Dashboard V7
 * Haupt-Einstiegspunkt mit State Management
 */

// Styles importieren
import './styles/main.css';

import type { ProcessedEinsatz, FetchOptions } from './types/types.js';
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

// ============================================================================
// Global State
// ============================================================================

const state: {
  processedData: ProcessedEinsatz[];
  autoRefreshTimer: number | null;
} = {
  processedData: [],
  autoRefreshTimer: null
};

// ============================================================================
// Data Fetching
// ============================================================================

/**
 * Lädt Daten vom ArcGIS Feature Service
 */
async function fetchData(options: FetchOptions = {}): Promise<void> {
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

// ============================================================================
// Dashboard Update
// ============================================================================

/**
 * Aktualisiert alle Dashboard-Komponenten
 */
function updateDashboard(): void {
  const selectedRtwList = getSelectedRtwList();
  const filteredData = filterByRtw(state.processedData, selectedRtwList);

  const kpis = calculateKPIs(filteredData);

  updateKPICards(kpis);
  updateAllCharts(filteredData);
  updateTable(filteredData);
}

// ============================================================================
// Export Handler
// ============================================================================

/**
 * Exportiert die aktuell gefilterten Daten als CSV
 */
function handleExport(): void {
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

// ============================================================================
// Auto-Refresh
// ============================================================================

/**
 * Startet den Auto-Refresh-Timer
 */
function startAutoRefresh(): void {
  if (state.autoRefreshTimer) {
    clearInterval(state.autoRefreshTimer);
  }

  state.autoRefreshTimer = window.setInterval(() => {
    fetchData({
      updateFilters: false,
      showLoadingIndicator: false,
      showSuccessMessage: false
    });
  }, CONFIG.autoRefreshInterval);

  console.log(`Auto-Refresh gestartet (${CONFIG.autoRefreshInterval / 1000}s)`);
}

/**
 * Stoppt den Auto-Refresh-Timer
 */
function stopAutoRefresh(): void {
  if (state.autoRefreshTimer) {
    clearInterval(state.autoRefreshTimer);
    state.autoRefreshTimer = null;
    console.log('Auto-Refresh gestoppt');
  }
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialisiert die Anwendung
 */
async function init(): Promise<void> {
  console.log('RTW Hilfsfrist Dashboard V7 wird initialisiert...');
  console.log('Features:');
  console.log('✅ TypeScript & Modularisierte Architektur');
  console.log('✅ Granulare Histogramme (10s bzw. 1min Schritte)');
  console.log('✅ Kompaktes Datumsformat in Zeitreihe');
  console.log('✅ Neuer Zeitfilter: Aktuelle Schicht (07:00-07:00)');
  console.log('✅ Verbesserte Code-Struktur & Best Practices');

  // Chart-Sichtbarkeit aus LocalStorage laden
  loadChartVisibilityFromStorage();

  // Zeitfilter initialisieren
  initializeTimeFilter();

  // Event Listeners einrichten
  setupFilterEventListeners(
    () => fetchData(), // onRefresh
    handleExport        // onExport
  );

  // Filter-Change-Callback setzen
  setFilterChangeCallback(updateDashboard);

  // Initiales Laden der Daten
  await fetchData();

  // Auto-Refresh starten
  startAutoRefresh();

  console.log('✅ Dashboard erfolgreich initialisiert');
}

// ============================================================================
// Start Application
// ============================================================================

// Warten bis DOM bereit ist
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup bei Page Unload
window.addEventListener('beforeunload', () => {
  stopAutoRefresh();
});

/**
 * Konstanten und Konfiguration für das RTW Dashboard
 */

// Dashboard Configuration
export const CONFIG = {
  serverUrl: 'https://geoportal.feuerwehr.hamburg.de/ags',
  resourcesServicePath: '/rest/services/Geoevent/Einsatzresourcen/FeatureServer/0',
  eventsServicePath: '/rest/services/Geoevent/Einsätze_letzte_7_Tage_voll/FeatureServer/0',
  resourceType: 'RTW',
  responseTimeThreshold: 90,
  travelTimeThreshold: 480,
  autoRefreshInterval: 30000
};

// Time Filter Options
export const TIME_FILTER_OPTIONS = [
  { label: 'Letzte 3 Stunden', value: '3', hours: 3 },
  { label: 'Letzte 6 Stunden', value: '6', hours: 6 },
  { label: 'Letzte 12 Stunden', value: '12', hours: 12 },
  { label: 'Letzte 24 Stunden', value: '24', hours: 24 },
  { label: 'Letzte 48 Stunden', value: '48', hours: 48 },
  { label: 'Letzte 72 Stunden', value: '72', hours: 72 },
  { label: 'Aktuelle Schicht (07:00-07:00)', value: 'current-shift' }
];

// Chart Colors
export const CHART_COLORS = {
  primary: 'rgb(200, 16, 46)',
  primaryAlpha: 'rgba(200, 16, 46, 0.1)',
  success: 'rgb(16, 185, 129)',
  successAlpha: 'rgba(16, 185, 129, 0.1)',
  warning: 'rgb(245, 158, 11)',
  warningAlpha: 'rgba(245, 158, 11, 0.1)',
  info: 'rgb(59, 130, 246)',
  infoAlpha: 'rgba(59, 130, 246, 0.1)',
  danger: 'rgb(239, 68, 68)',
  dangerAlpha: 'rgba(239, 68, 68, 0.1)'
};

// Response Time Bins
export const RESPONSE_TIME_BINS = [
  '0-10s', '10-20s', '20-30s', '30-40s', '40-50s',
  '50-60s', '60-70s', '70-80s', '80-90s', '>90s'
];

// Travel Time Bins
export const TRAVEL_TIME_BINS = [
  '0-1min', '1-2min', '2-3min', '3-4min',
  '4-5min', '5-6min', '6-7min', '7-8min', '>8min'
];

// LocalStorage Keys
export const STORAGE_KEYS = {
  CHART_VISIBILITY: 'rtwDashboardChartVisibility'
};

// Messages
export const MESSAGES = {
  DATA_LOADED: (count) => `✅ Daten erfolgreich geladen (${count} Einträge)`,
  DATA_ERROR: '❌ Fehler beim Laden der Daten',
  NO_DATA: 'Keine Daten zum Exportieren verfügbar',
  EXPORT_SUCCESS: (count) => `✅ CSV-Export erfolgreich (${count} Einträge)`
};

// DOM IDs
export const DOM_IDS = {
  LOADING_OVERLAY: 'loadingOverlay',
  MESSAGE_TOAST: 'messageToast',
  LAST_UPDATE: 'lastUpdate',
  TIME_FILTER: 'timeFilter',
  RTW_PICKER_TOGGLE: 'rtwPickerToggle',
  RTW_PICKER_CONTENT: 'rtwPickerContent',
  RTW_CHECKBOX_GRID: 'rtwCheckboxGrid',
  RTW_SELECTED_COUNT: 'rtwSelectedCount',
  SELECT_ALL_RTW_BTN: 'selectAllRtwBtn',
  DESELECT_ALL_RTW_BTN: 'deselectAllRtwBtn',
  REFRESH_BTN: 'refreshBtn',
  EXPORT_BTN: 'exportBtn',
  TOTAL_COUNT: 'totalCount',
  RELEVANT_COUNT: 'relevantCount',
  RELEVANT_PERCENTAGE: 'relevantPercentage',
  NOT_RELEVANT_COUNT: 'notRelevantCount',
  NOT_RELEVANT_PERCENTAGE: 'notRelevantPercentage',
  RESPONSE_PERCENTAGE: 'responsePercentage',
  RESPONSE_ACHIEVED: 'responseAchieved',
  RESPONSE_TOTAL: 'responseTotal',
  TRAVEL_PERCENTAGE: 'travelPercentage',
  TRAVEL_ACHIEVED: 'travelAchieved',
  TRAVEL_TOTAL: 'travelTotal',
  HILFSFRIST_PERCENTAGE: 'hilfsfristPercentage',
  HILFSFRIST_ACHIEVED: 'hilfsfristAchieved',
  HILFSFRIST_TOTAL: 'hilfsfristTotal',
  LINE_CHART: 'lineChart',
  BAR_CHART: 'barChart',
  PIE_CHART: 'pieChart',
  TABLE_BODY: 'tableBody',
  TABLE_RECORD_COUNT: 'tableRecordCount'
};

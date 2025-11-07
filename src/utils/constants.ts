/**
 * Konstanten und Konfiguration für das RTW Dashboard
 */

import type { DashboardConfig } from '../types/types.js';

// ============================================================================
// Dashboard Configuration
// ============================================================================

export const CONFIG: DashboardConfig = {
  serverUrl: 'https://geoportal.feuerwehr.hamburg.de/ags',
  resourcesServicePath: '/rest/services/Geoevent/Einsatzresourcen/FeatureServer/0',
  eventsServicePath: '/rest/services/Geoevent/Einsätze_letzte_7_Tage_voll/FeatureServer/0',
  resourceType: 'RTW',
  responseTimeThreshold: 90, // Sekunden
  travelTimeThreshold: 300, // Sekunden (5 Minuten)
  autoRefreshInterval: 30000 // Millisekunden
};

// ============================================================================
// Time Thresholds
// ============================================================================

export const THRESHOLDS = {
  RESPONSE_TIME: 90, // Sekunden
  TRAVEL_TIME: 480, // Sekunden (8 Minuten, nicht 5!)
} as const;

// ============================================================================
// Response Time Bins (10 Sekunden Schritte)
// ============================================================================

export const RESPONSE_TIME_BINS = [
  '0-10s',
  '10-20s',
  '20-30s',
  '30-40s',
  '40-50s',
  '50-60s',
  '60-70s',
  '70-80s',
  '80-90s',
  '>90s'
] as const;

export const RESPONSE_TIME_BIN_RANGES: Array<[number, number]> = [
  [0, 10],
  [10, 20],
  [20, 30],
  [30, 40],
  [40, 50],
  [50, 60],
  [60, 70],
  [70, 80],
  [80, 90],
  [90, Infinity]
];

// ============================================================================
// Travel Time Bins (1 Minute Schritte)
// ============================================================================

export const TRAVEL_TIME_BINS = [
  '0-1min',
  '1-2min',
  '2-3min',
  '3-4min',
  '4-5min',
  '5-6min',
  '6-7min',
  '7-8min',
  '>8min'
] as const;

export const TRAVEL_TIME_BIN_RANGES: Array<[number, number]> = [
  [0, 60],
  [60, 120],
  [120, 180],
  [180, 240],
  [240, 300],
  [300, 360],
  [360, 420],
  [420, 480],
  [480, Infinity]
];

// ============================================================================
// Chart Colors
// ============================================================================

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
} as const;

// ============================================================================
// Time Filter Options
// ============================================================================

export const TIME_FILTER_OPTIONS = [
  { label: 'Letzte 3 Stunden', value: '3', hours: 3 },
  { label: 'Letzte 6 Stunden', value: '6', hours: 6 },
  { label: 'Letzte 12 Stunden', value: '12', hours: 12 },
  { label: 'Letzte 24 Stunden', value: '24', hours: 24 },
  { label: 'Letzte 48 Stunden', value: '48', hours: 48 },
  { label: 'Letzte 72 Stunden', value: '72', hours: 72 },
  { label: 'Aktuelle Schicht (07:00-07:00)', value: 'current-shift' }
] as const;

// ============================================================================
// LocalStorage Keys
// ============================================================================

export const STORAGE_KEYS = {
  CHART_VISIBILITY: 'rtwDashboardChartVisibility',
  SELECTED_RTW: 'rtwDashboardSelectedRtw',
  TIME_FILTER: 'rtwDashboardTimeFilter'
} as const;

// ============================================================================
// UI Messages
// ============================================================================

export const MESSAGES = {
  DATA_LOADED: (count: number) => `✅ Daten erfolgreich geladen (${count} Einträge)`,
  DATA_ERROR: '❌ Fehler beim Laden der Daten',
  NO_DATA: 'Keine Daten zum Exportieren verfügbar',
  EXPORT_SUCCESS: (count: number) => `✅ CSV-Export erfolgreich (${count} Einträge)`
} as const;

// ============================================================================
// DOM Element IDs
// ============================================================================

export const DOM_IDS = {
  // Loading & Messages
  LOADING_OVERLAY: 'loadingOverlay',
  MESSAGE_TOAST: 'messageToast',
  LAST_UPDATE: 'lastUpdate',

  // Filters
  TIME_FILTER: 'timeFilter',
  RTW_PICKER_TOGGLE: 'rtwPickerToggle',
  RTW_PICKER_CONTENT: 'rtwPickerContent',
  RTW_CHECKBOX_GRID: 'rtwCheckboxGrid',
  RTW_SELECTED_COUNT: 'rtwSelectedCount',
  SELECT_ALL_RTW_BTN: 'selectAllRtwBtn',
  DESELECT_ALL_RTW_BTN: 'deselectAllRtwBtn',

  // Buttons
  REFRESH_BTN: 'refreshBtn',
  EXPORT_BTN: 'exportBtn',

  // KPIs
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

  // Charts
  LINE_CHART: 'lineChart',
  BAR_CHART: 'barChart',
  PIE_CHART: 'pieChart',

  // Table
  TABLE_BODY: 'tableBody',
  TABLE_RECORD_COUNT: 'tableRecordCount'
} as const;

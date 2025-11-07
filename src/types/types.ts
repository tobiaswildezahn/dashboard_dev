/**
 * TypeScript Type Definitions für RTW Hilfsfrist Dashboard
 */

// ============================================================================
// ArcGIS Feature Types
// ============================================================================

export interface ResourceAttributes {
  call_sign: string;
  nameresourcetype: string;
  idevent: string;
  time_alarm: number;
  time_on_the_way: number | null;
  time_arrived: number | null;
  [key: string]: unknown;
}

export interface EventAttributes {
  id: string;
  nameeventtype: string;
  alarmtime: number;
  [key: string]: unknown;
}

export interface Feature<T> {
  attributes: T;
  geometry?: unknown;
}

export interface FeatureQueryResponse<T> {
  features: Feature<T>[];
  [key: string]: unknown;
}

// ============================================================================
// Processed Data Types
// ============================================================================

export interface ProcessedEinsatz {
  // Original attributes
  call_sign: string;
  nameresourcetype: string;
  idevent: string;
  time_alarm: number;
  time_on_the_way: number | null;
  time_arrived: number | null;

  // Joined from events
  nameeventtype: string | null;

  // Calculated fields
  isHilfsfristRelevant: boolean;
  responseTime: number | null;
  travelTime: number | null;
  responseAchieved: boolean | null;
  travelAchieved: boolean | null;
  hilfsfristAchieved: boolean | null;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface DashboardConfig {
  serverUrl: string;
  resourcesServicePath: string;
  eventsServicePath: string;
  resourceType: string;
  responseTimeThreshold: number;
  travelTimeThreshold: number;
  autoRefreshInterval: number;
}

export interface TimeFilterConfig {
  hours: number | 'current-shift';
  startTime?: Date;
  endTime?: Date;
}

// ============================================================================
// KPI Types
// ============================================================================

export interface KPIMetrics {
  total: number;
  relevantCount: number;
  notRelevantCount: number;
  relevantPercentage: number;
  notRelevantPercentage: number;

  responseAchieved: number;
  responseTotal: number;
  responsePercentage: number;

  travelAchieved: number;
  travelTotal: number;
  travelPercentage: number;

  hilfsfristAchieved: number;
  hilfsfristTotal: number;
  hilfsfristPercentage: number;
}

// ============================================================================
// Chart Types
// ============================================================================

export interface ChartVisibility {
  hilfsfrist: boolean;
  response: boolean;
  travel: boolean;
}

export interface HourlyStats {
  total: number;
  hilfsfristAchieved: number;
  responseAchieved: number;
  travelAchieved: number;
}

export interface ResponseTimeBins {
  '0-10s': number;
  '10-20s': number;
  '20-30s': number;
  '30-40s': number;
  '40-50s': number;
  '50-60s': number;
  '60-70s': number;
  '70-80s': number;
  '80-90s': number;
  '>90s': number;
}

export interface TravelTimeBins {
  '0-1min': number;
  '1-2min': number;
  '2-3min': number;
  '3-4min': number;
  '4-5min': number;
  '5-6min': number;
  '6-7min': number;
  '7-8min': number;
  '>8min': number;
}

// ============================================================================
// State Management Types
// ============================================================================

export interface AppState {
  processedData: ProcessedEinsatz[];
  selectedRtwList: string[];
  autoRefreshTimer: number | null;
  chartVisibility: ChartVisibility;
  charts: {
    lineChart: unknown | null;
    barChart: unknown | null;
    pieChart: unknown | null;
  };
}

// ============================================================================
// Fetch Options
// ============================================================================

export interface FetchOptions {
  updateFilters?: boolean;
  showLoadingIndicator?: boolean;
  showSuccessMessage?: boolean;
}

// ============================================================================
// Export Types
// ============================================================================

export interface CSVExportData {
  rtw: string;
  einsatztyp: string;
  hilfsfristRelevant: string;
  alarmzeit: string;
  ausrueckezeit: string;
  ausrueckezeitOK: string;
  anfahrtszeit: string;
  anfahrtszeitOK: string;
  hilfsfristErreicht: string;
  eventId: string;
}

// ============================================================================
// UI Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type StatusBadgeType = 'success' | 'danger' | 'na';

// ============================================================================
// Time Filter Types
// ============================================================================

export interface TimeFilterOption {
  label: string;
  value: string;
  hours?: number;
}

export const TIME_FILTER_OPTIONS: TimeFilterOption[] = [
  { label: 'Letzte 3 Stunden', value: '3', hours: 3 },
  { label: 'Letzte 6 Stunden', value: '6', hours: 6 },
  { label: 'Letzte 12 Stunden', value: '12', hours: 12 },
  { label: 'Letzte 24 Stunden', value: '24', hours: 24 },
  { label: 'Letzte 48 Stunden', value: '48', hours: 48 },
  { label: 'Letzte 72 Stunden', value: '72', hours: 72 },
  { label: 'Aktuelle Schicht (07:00-07:00)', value: 'current-shift' }
];

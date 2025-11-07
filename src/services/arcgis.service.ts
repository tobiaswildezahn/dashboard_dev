/**
 * ArcGIS Service - Handhabt alle Feature Service Abfragen
 */

import type {
  ResourceAttributes,
  EventAttributes,
  FeatureQueryResponse,
  TimeFilterConfig
} from '../types/types.js';
import { CONFIG } from '../utils/constants.js';
import { getCurrentShiftTimes } from '../utils/helpers.js';

// ============================================================================
// Service URLs
// ============================================================================

const resourcesServiceUrl = CONFIG.serverUrl + CONFIG.resourcesServicePath;
const eventsServiceUrl = CONFIG.serverUrl + CONFIG.eventsServicePath;

// ============================================================================
// Query Builder
// ============================================================================

/**
 * Erstellt eine WHERE-Clause basierend auf dem Zeitfilter
 */
function buildWhereClause(
  resourceType: string,
  timeField: string,
  timeFilter: TimeFilterConfig
): string {
  let whereClause = `nameresourcetype = '${resourceType}' AND `;

  if (timeFilter.hours === 'current-shift') {
    const { startTime, endTime } = getCurrentShiftTimes();
    const startTimestamp = startTime.getTime();
    const endTimestamp = endTime.getTime();

    whereClause += `${timeField} >= ${startTimestamp} AND ${timeField} <= ${endTimestamp}`;
  } else {
    whereClause += `${timeField} > CURRENT_TIMESTAMP - INTERVAL '${timeFilter.hours}' HOUR`;
  }

  return whereClause;
}

/**
 * Erstellt eine WHERE-Clause für Events
 */
function buildEventWhereClause(timeFilter: TimeFilterConfig): string {
  if (timeFilter.hours === 'current-shift') {
    const { startTime, endTime } = getCurrentShiftTimes();
    const startTimestamp = startTime.getTime();
    const endTimestamp = endTime.getTime();

    return `alarmtime >= ${startTimestamp} AND alarmtime <= ${endTimestamp}`;
  }

  return `alarmtime > CURRENT_TIMESTAMP - INTERVAL '${timeFilter.hours}' HOUR`;
}

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Lädt Ressourcen-Daten vom ArcGIS Feature Service
 */
async function fetchResources(
  timeFilter: TimeFilterConfig
): Promise<FeatureQueryResponse<ResourceAttributes>> {
  const whereClause = buildWhereClause(CONFIG.resourceType, 'time_alarm', timeFilter);

  // Dynamisches Import von esri/request
  // @ts-expect-error - ArcGIS wird über CDN geladen
  const { default: esriRequest } = await import('https://js.arcgis.com/4.33/@arcgis/core/request.js');

  const response = await esriRequest(resourcesServiceUrl + '/query', {
    query: {
      where: whereClause,
      outFields: '*',
      f: 'json',
      returnGeometry: false
    },
    responseType: 'json'
  });

  if (!response.data || !response.data.features) {
    throw new Error('Keine Ressourcen-Daten vom Server erhalten');
  }

  return response.data;
}

/**
 * Lädt Einsatz-Daten vom ArcGIS Feature Service
 */
async function fetchEvents(
  timeFilter: TimeFilterConfig
): Promise<FeatureQueryResponse<EventAttributes>> {
  const whereClause = buildEventWhereClause(timeFilter);

  // Dynamisches Import von esri/request
  // @ts-expect-error - ArcGIS wird über CDN geladen
  const { default: esriRequest } = await import('https://js.arcgis.com/4.33/@arcgis/core/request.js');

  const response = await esriRequest(eventsServiceUrl + '/query', {
    query: {
      where: whereClause,
      outFields: 'id,nameeventtype',
      f: 'json',
      returnGeometry: false
    },
    responseType: 'json'
  });

  if (!response.data || !response.data.features) {
    throw new Error('Keine Einsatz-Daten vom Server erhalten');
  }

  return response.data;
}

/**
 * Lädt beide Datensätze parallel
 */
export async function fetchAllData(timeFilter: TimeFilterConfig): Promise<{
  resources: FeatureQueryResponse<ResourceAttributes>;
  events: FeatureQueryResponse<EventAttributes>;
}> {
  const [resources, events] = await Promise.all([
    fetchResources(timeFilter),
    fetchEvents(timeFilter)
  ]);

  return { resources, events };
}

// ============================================================================
// Export einzelne Funktionen für Testing
// ============================================================================

export { fetchResources, fetchEvents };

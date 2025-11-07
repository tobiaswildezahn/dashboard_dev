/**
 * ArcGIS Service - Feature Service Abfragen
 */

import { CONFIG } from '../utils/constants.js';
import { getCurrentShiftTimes } from '../utils/helpers.js';

const resourcesServiceUrl = CONFIG.serverUrl + CONFIG.resourcesServicePath;
const eventsServiceUrl = CONFIG.serverUrl + CONFIG.eventsServicePath;

function buildWhereClause(resourceType, timeField, timeFilter) {
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

function buildEventWhereClause(timeFilter) {
  if (timeFilter.hours === 'current-shift') {
    const { startTime, endTime } = getCurrentShiftTimes();
    const startTimestamp = startTime.getTime();
    const endTimestamp = endTime.getTime();
    return `alarmtime >= ${startTimestamp} AND alarmtime <= ${endTimestamp}`;
  }

  return `alarmtime > CURRENT_TIMESTAMP - INTERVAL '${timeFilter.hours}' HOUR`;
}

async function fetchResources(timeFilter) {
  const whereClause = buildWhereClause(CONFIG.resourceType, 'time_alarm', timeFilter);

  const esriRequest = await import('https://js.arcgis.com/4.33/@arcgis/core/request.js')
    .then(m => m.default);

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

async function fetchEvents(timeFilter) {
  const whereClause = buildEventWhereClause(timeFilter);

  const esriRequest = await import('https://js.arcgis.com/4.33/@arcgis/core/request.js')
    .then(m => m.default);

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

export async function fetchAllData(timeFilter) {
  const [resources, events] = await Promise.all([
    fetchResources(timeFilter),
    fetchEvents(timeFilter)
  ]);

  return { resources, events };
}

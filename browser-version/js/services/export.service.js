/**
 * Export Service - CSV Export
 */

import { formatTimestamp, createCSVBlob, downloadFile, generateFilename, escapeCSVValue } from '../utils/helpers.js';

export function exportToCSV(data) {
  if (data.length === 0) {
    throw new Error('Keine Daten zum Exportieren verfügbar');
  }

  const csv = createCSVContent(data);
  const blob = createCSVBlob(csv);
  const filename = generateFilename('rtw_hilfsfrist', 'csv');

  downloadFile(blob, filename);
}

function createCSVContent(data) {
  let csv = '';
  csv += 'RTW;Einsatztyp;Hilfsfrist-Relevant;Alarmzeit;Ausrückezeit (s);Ausrückezeit OK;';
  csv += 'Anfahrtszeit (s);Anfahrtszeit OK;Hilfsfrist erreicht;Event ID\n';

  data.forEach(item => {
    csv += createCSVRow(item);
  });

  return csv;
}

function createCSVRow(item) {
  const responseOK = item.responseAchieved !== null
    ? (item.responseAchieved ? 'Ja' : 'Nein')
    : 'N/A';

  const travelOK = item.travelAchieved !== null
    ? (item.travelAchieved ? 'Ja' : 'Nein')
    : 'N/A';

  const hilfsfristOK = item.hilfsfristAchieved !== null
    ? (item.hilfsfristAchieved ? 'Ja' : 'Nein')
    : 'N/A';

  const relevant = item.isHilfsfristRelevant ? 'Ja' : 'Nein';
  const einsatztyp = escapeCSVValue(item.nameeventtype || 'N/A');

  const responseTime = item.responseTime !== null
    ? Math.round(item.responseTime).toString()
    : 'N/A';

  const travelTime = item.travelTime !== null
    ? Math.round(item.travelTime).toString()
    : 'N/A';

  return [
    item.call_sign || 'N/A',
    `"${einsatztyp}"`,
    relevant,
    formatTimestamp(item.time_alarm),
    responseTime,
    responseOK,
    travelTime,
    travelOK,
    hilfsfristOK,
    item.idevent || 'N/A'
  ].join(';') + '\n';
}

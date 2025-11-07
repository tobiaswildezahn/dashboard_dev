/**
 * Export Service - CSV-Export-Funktionalität
 */

import type { ProcessedEinsatz } from '../types/types.js';
import { formatTimestamp, createCSVBlob, downloadFile, generateFilename, escapeCSVValue } from '../utils/helpers.js';

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Exportiert Daten als CSV-Datei
 */
export function exportToCSV(data: ProcessedEinsatz[]): void {
  if (data.length === 0) {
    throw new Error('Keine Daten zum Exportieren verfügbar');
  }

  const csv = createCSVContent(data);
  const blob = createCSVBlob(csv);
  const filename = generateFilename('rtw_hilfsfrist', 'csv');

  downloadFile(blob, filename);
}

/**
 * Erstellt den CSV-Inhalt aus den Daten
 */
function createCSVContent(data: ProcessedEinsatz[]): string {
  let csv = '';

  // Header
  csv += 'RTW;Einsatztyp;Hilfsfrist-Relevant;Alarmzeit;Ausrückezeit (s);Ausrückezeit OK;';
  csv += 'Anfahrtszeit (s);Anfahrtszeit OK;Hilfsfrist erreicht;Event ID\n';

  // Datenzeilen
  data.forEach(item => {
    csv += createCSVRow(item);
  });

  return csv;
}

/**
 * Erstellt eine CSV-Zeile für einen Einsatz
 */
function createCSVRow(item: ProcessedEinsatz): string {
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

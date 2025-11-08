// ============================================================================
// FILE: js/05-ui-kpis.js
// KPI Display and Updates
// Dependencies: calculateKPIs, getThresholdStatus
// ============================================================================

/**
 * AKTUALISIERT AMPEL-STATUS EINER KPI-KARTE
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Ändert Farbe und Status-Badge einer KPI-Karte basierend auf Prozentwert
 * - Verwendet Ampelschema: Grün (gut), Gelb (ok), Rot (schlecht)
 * - Entfernt alte CSS-Klassen und fügt neue hinzu
 *
 * ABLAUF:
 * 1. Hole Status von getThresholdStatus() (grün/gelb/rot)
 * 2. Entferne alte CSS-Klassen von Karte und Info
 * 3. Füge neue CSS-Klassen hinzu
 * 4. Aktualisiere Badge-Emoji (🟢/🟡/🔴)
 * 5. Aktualisiere Info-Text (z.B. "Exzellent (≥90%)")
 *
 * CSS-KLASSEN:
 * - kpi-status-green: Grüner Rand
 * - kpi-status-yellow: Gelber Rand
 * - kpi-status-red: Roter Rand
 *
 * @param {string} cardId - ID der KPI-Karte (z.B. "responseCard")
 * @param {string} badgeId - ID des Status-Badges (z.B. "responseStatusBadge")
 * @param {string} infoId - ID des Info-Textes (z.B. "responseThresholdInfo")
 * @param {number} percentage - Prozentwert zur Berechnung des Status
 */
function updateKPIStatus(cardId, badgeId, infoId, percentage) {
    const card = document.getElementById(cardId);
    const badge = document.getElementById(badgeId);
    const info = document.getElementById(infoId);

    if (!card || !badge || !info) return;

    const status = getThresholdStatus(percentage);

    // Remove all status classes
    card.classList.remove('kpi-status-green', 'kpi-status-yellow', 'kpi-status-red');
    info.classList.remove('threshold-green', 'threshold-yellow', 'threshold-red');

    // Add new status classes
    card.classList.add('kpi-status-' + status.status);
    info.classList.add('threshold-' + status.status);

    // Update badge and info text
    badge.textContent = status.emoji;
    info.textContent = status.emoji + ' ' + status.text;
}

/**
 * AKTUALISIERT ALLE KPI-KARTEN IM DASHBOARD
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Hauptfunktion zur Aktualisierung aller Kennzahlen-Karten
 * - Rechnet KPIs mit calculateKPIs() und zeigt sie im UI an
 * - Aktualisiert Zahlen, Prozente, Perzentile und Ampel-Status
 *
 * AKTUALISIERTE ELEMENTE:
 * 1. EINSATZ-STATISTIK:
 *    - Gesamtzahl
 *    - Relevante Einsätze + Prozent
 *    - Nicht relevante Einsätze + Prozent
 *
 * 2. AUSRÜCKEZEIT-KARTE:
 *    - Erfolgsquote in %
 *    - Anzahl erreicht / gesamt
 *    - 90. Perzentil in Sekunden
 *    - Ampel-Status (grün/gelb/rot)
 *
 * 3. ANFAHRTSZEIT-KARTE:
 *    - Erfolgsquote in %
 *    - Anzahl erreicht / gesamt
 *    - 90. Perzentil in Sekunden
 *    - Ampel-Status
 *
 * 4. HILFSFRIST-KARTE:
 *    - Erfolgsquote in %
 *    - Anzahl erreicht / gesamt
 *    - Ampel-Status
 *
 * NULL-CHECKS:
 * - Prüft ob DOM-Elemente existieren bevor Update
 * - Zeigt "N/A" wenn Perzentil null ist
 *
 * @param {Array} data - Gefilterte Einsatzdaten (nach RTW-Auswahl)
 */
function updateKPIs(data) {
    const kpis = calculateKPIs(data);

    document.getElementById('totalCount').textContent = kpis.total;
    document.getElementById('relevantCount').textContent = kpis.relevantCount;
    document.getElementById('relevantPercentage').textContent = '(' + kpis.relevantPercentage.toFixed(1) + '%)';
    document.getElementById('notRelevantCount').textContent = kpis.notRelevantCount;
    document.getElementById('notRelevantPercentage').textContent = '(' + kpis.notRelevantPercentage.toFixed(1) + '%)';

    document.getElementById('responsePercentage').textContent = Math.round(kpis.responsePercentage);
    document.getElementById('responseAchieved').textContent = kpis.responseAchieved;
    document.getElementById('responseTotal').textContent = kpis.responseTotal;

    // 90% Perzentil für Ausrückezeit
    const response90El = document.getElementById('response90Percentile');
    if (response90El) {
        response90El.textContent = kpis.response90Percentile !== null
            ? Math.round(kpis.response90Percentile) + 's'
            : 'N/A';
    }

    // Ampelschema für Ausrückezeit
    updateKPIStatus('responseCard', 'responseStatusBadge', 'responseThresholdInfo', kpis.responsePercentage);

    document.getElementById('travelPercentage').textContent = Math.round(kpis.travelPercentage);
    document.getElementById('travelAchieved').textContent = kpis.travelAchieved;
    document.getElementById('travelTotal').textContent = kpis.travelTotal;

    // 90% Perzentil für Anfahrtszeit
    const travel90El = document.getElementById('travel90Percentile');
    if (travel90El) {
        travel90El.textContent = kpis.travel90Percentile !== null
            ? Math.round(kpis.travel90Percentile) + 's'
            : 'N/A';
    }

    // Ampelschema für Anfahrtszeit
    updateKPIStatus('travelCard', 'travelStatusBadge', 'travelThresholdInfo', kpis.travelPercentage);

    document.getElementById('hilfsfristPercentage').textContent = Math.round(kpis.hilfsfristPercentage);
    document.getElementById('hilfsfristAchieved').textContent = kpis.hilfsfristAchieved;
    document.getElementById('hilfsfristTotal').textContent = kpis.hilfsfristTotal;

    // Ampelschema für Hilfsfrist
    updateKPIStatus('hilfsfristCard', 'hilfsfristStatusBadge', 'hilfsfristThresholdInfo', kpis.hilfsfristPercentage);
}

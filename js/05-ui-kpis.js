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

/**
 * AKTUALISIERT RÜCKFAHRTZEIT-KPI-KARTE
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Zeigt Analyse der Rückfahrtzeiten
 * - DISKRETE Kategorien: 0-1, 1-2, 2-4, 4-8, 8-15, ≥15 Minuten
 * - Hilft bei Identifikation von Datenqualitätsproblemen
 * - Gilt für ALLE Einsätze (nicht nur hilfsfristrelevante)
 *
 * ANGEZEIGTE KENNZAHLEN:
 * - Gesamtanzahl mit gültiger Rückfahrtzeit
 * - Diskrete Anzahl und Quoten (Prozent zuerst, dann absolute Zahl)
 * - Statistische Kennzahlen (Mittelwert, Median mit 1 Nachkommastelle)
 *
 * FORMAT:
 * - Statistiken: "X.X min" (1 Nachkommastelle)
 * - Kategorien: "XX.X% (Anzahl)" (Prozent vor absoluter Zahl)
 *
 * VERWENDUNG:
 * - Datenqualitätskontrolle
 * - Identifikation von Ausreißern
 * - Peer-Vergleich (da keine externen Routing-Daten verfügbar)
 *
 * @param {Array} data - Alle Einsatzdaten (gefiltert nach RTW-Auswahl)
 */
function updateReturnTimeKPI(data) {
    const kpis = calculateReturnTimeKPIs(data);

    // Gesamtanzahl
    const totalEl = document.getElementById('returnTimeTotal');
    if (totalEl) totalEl.textContent = kpis.total;

    // Mittelwert (1 Nachkommastelle)
    const meanEl = document.getElementById('returnTimeMean');
    if (meanEl) {
        meanEl.textContent = kpis.mean !== null
            ? (kpis.mean / 60).toFixed(1) + ' min'
            : 'N/A';
    }

    // Median (1 Nachkommastelle)
    const medianEl = document.getElementById('returnTimeMedian');
    if (medianEl) {
        medianEl.textContent = kpis.median !== null
            ? (kpis.median / 60).toFixed(1) + ' min'
            : 'N/A';
    }

    // Kategorie: 0-1 Min (Prozent zuerst, dann absolute Zahl)
    const range0to1CountEl = document.getElementById('returnTimeRange0to1Count');
    const range0to1PercentEl = document.getElementById('returnTimeRange0to1Percent');
    if (range0to1PercentEl) range0to1PercentEl.textContent = kpis.percentRange0to1.toFixed(1) + '%';
    if (range0to1CountEl) range0to1CountEl.textContent = '(' + kpis.range0to1 + ')';

    // Kategorie: 1-2 Min (Prozent zuerst, dann absolute Zahl)
    const range1to2CountEl = document.getElementById('returnTimeRange1to2Count');
    const range1to2PercentEl = document.getElementById('returnTimeRange1to2Percent');
    if (range1to2PercentEl) range1to2PercentEl.textContent = kpis.percentRange1to2.toFixed(1) + '%';
    if (range1to2CountEl) range1to2CountEl.textContent = '(' + kpis.range1to2 + ')';

    // Kategorie: 2-4 Min (Prozent zuerst, dann absolute Zahl)
    const range2to4CountEl = document.getElementById('returnTimeRange2to4Count');
    const range2to4PercentEl = document.getElementById('returnTimeRange2to4Percent');
    if (range2to4PercentEl) range2to4PercentEl.textContent = kpis.percentRange2to4.toFixed(1) + '%';
    if (range2to4CountEl) range2to4CountEl.textContent = '(' + kpis.range2to4 + ')';

    // Kategorie: 4-8 Min (Prozent zuerst, dann absolute Zahl)
    const range4to8CountEl = document.getElementById('returnTimeRange4to8Count');
    const range4to8PercentEl = document.getElementById('returnTimeRange4to8Percent');
    if (range4to8PercentEl) range4to8PercentEl.textContent = kpis.percentRange4to8.toFixed(1) + '%';
    if (range4to8CountEl) range4to8CountEl.textContent = '(' + kpis.range4to8 + ')';

    // Kategorie: 8-15 Min (Prozent zuerst, dann absolute Zahl)
    const range8to15CountEl = document.getElementById('returnTimeRange8to15Count');
    const range8to15PercentEl = document.getElementById('returnTimeRange8to15Percent');
    if (range8to15PercentEl) range8to15PercentEl.textContent = kpis.percentRange8to15.toFixed(1) + '%';
    if (range8to15CountEl) range8to15CountEl.textContent = '(' + kpis.range8to15 + ')';

    // Kategorie: >= 15 Min (Prozent zuerst, dann absolute Zahl)
    const range15plusCountEl = document.getElementById('returnTimeRange15plusCount');
    const range15plusPercentEl = document.getElementById('returnTimeRange15plusPercent');
    if (range15plusPercentEl) range15plusPercentEl.textContent = kpis.percentRange15plus.toFixed(1) + '%';
    if (range15plusCountEl) range15plusCountEl.textContent = '(' + kpis.range15plus + ')';
}

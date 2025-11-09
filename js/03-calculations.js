// ============================================================================
// FILE: js/03-calculations.js
// Helper Functions, Calculations, and KPI Logic
// Dependencies: CONFIG (from 01-config.js)
// ============================================================================

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * SICHERHEITSFUNKTION: HTML-Escaping
 *
 * Schützt vor XSS-Angriffen (Cross-Site Scripting), indem gefährliche
 * Zeichen in HTML-Code durch sichere Alternativen ersetzt werden.
 *
 * BEISPIEL ANGRIFF (ohne Escaping):
 * - Eingabe: <script>alert('Hack!')</script>
 * - Wird ausgeführt und öffnet Alert-Box
 *
 * BEISPIEL SCHUTZ (mit Escaping):
 * - Eingabe: <script>alert('Hack!')</script>
 * - Wird zu: &lt;script&gt;alert('Hack!')&lt;/script&gt;
 * - Wird als Text angezeigt, nicht ausgeführt
 *
 * @param {string|number} unsafe - Potenziell gefährlicher Text
 * @returns {string} Sicherer Text für HTML-Ausgabe
 */
function escapeHtml(unsafe) {
    // Wenn Eingabe leer/null/undefined, gebe 'N/A' zurück
    if (unsafe === null || unsafe === undefined || unsafe === '') {
        return 'N/A';
    }

    // Konvertiere alles zu String (falls Zahl übergeben wurde)
    return String(unsafe)
        .replace(/&/g, "&amp;")   // & muss ZUERST ersetzt werden!
        .replace(/</g, "&lt;")    // < wird zu &lt;
        .replace(/>/g, "&gt;")    // > wird zu &gt;
        .replace(/"/g, "&quot;")  // " wird zu &quot;
        .replace(/'/g, "&#039;"); // ' wird zu &#039;
}

/**
 * Zeigt den Lade-Overlay an
 *
 * Blendet einen visuellen Indikator ein, der dem Benutzer signalisiert,
 * dass Daten geladen werden. Sollte immer mit hideLoading() kombiniert werden.
 */
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        console.error('Lade-Overlay Element nicht gefunden (ID: loadingOverlay)');
        return;
    }
    overlay.classList.add('active');
}

/**
 * Versteckt den Lade-Overlay
 *
 * Entfernt den Lade-Indikator nachdem Daten geladen wurden.
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        console.error('Lade-Overlay Element nicht gefunden (ID: loadingOverlay)');
        return;
    }
    overlay.classList.remove('active');
}

/**
 * Zeigt eine temporäre Nachricht (Toast) an
 *
 * Nachrichten erscheinen oben rechts und verschwinden nach 3 Sekunden automatisch.
 *
 * @param {string} message - Anzuzeigende Nachricht
 * @param {string} [type='success'] - Typ: 'success' (grün) oder 'error' (rot)
 */
function showMessage(message, type) {
    if (type === undefined) type = 'success';

    const toast = document.getElementById('messageToast');
    if (!toast) {
        console.error('Toast-Element nicht gefunden (ID: messageToast)');
        console.log('Nachricht:', message, '(Typ:', type + ')');
        return;
    }

    toast.textContent = message;
    toast.className = 'message-toast ' + type + ' active';

    setTimeout(function() {
        toast.classList.remove('active');
    }, 3000);
}

/**
 * FORMATIERT ZEITSTEMPEL FÜR TABELLEN-ANZEIGE
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Konvertiert Unix-Timestamp oder ISO-String zu lesbarem deutschen Format
 * - Format: TT.MM.JJJJ HH:MM (z.B. "08.11.2025 14:30")
 * - Verwendet deutsches Datumsformat (Tag.Monat.Jahr)
 *
 * WARUM WICHTIG:
 * - Zeitstempel aus Datenbank sind nicht direkt lesbar
 * - Deutsche Benutzer erwarten TT.MM.JJJJ statt MM/DD/YYYY
 * - Einheitliche Darstellung im gesamten Dashboard
 *
 * @param {number|string} timestamp - Unix-Timestamp oder ISO-String
 * @returns {string} Formatiertes Datum oder 'N/A' falls leer
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * FORMATIERT ZEITSTEMPEL KOMPAKT FÜR CHARTS
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Kürzeres Format für Charts wo Platz begrenzt ist
 * - Format: DD.MM HH:MM (z.B. "08.11 14:30")
 * - Jahr wird weggelassen da Charts meist aktuelle Daten zeigen
 *
 * VERWENDUNG:
 * - X-Achsen-Labels in Histogrammen
 * - Chart-Tooltips
 * - Platzsparende Anzeigen
 *
 * @param {number|string} timestamp - Unix-Timestamp oder ISO-String
 * @returns {string} Kompakt formatiertes Datum (DD.MM HH:MM)
 */
function formatCompactTimestamp(timestamp) {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString('de-DE', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * AKTUALISIERT "ZULETZT AKTUALISIERT" ANZEIGE
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Zeigt Benutzer wann Daten zuletzt vom Server geladen wurden
 * - Wird nach jedem erfolgreichen fetchData() aufgerufen
 * - Format: HH:MM:SS (z.B. "14:30:45")
 *
 * WARUM WICHTIG:
 * - Benutzer sieht ob Daten aktuell sind
 * - Wichtig für Echtzeit-Monitoring
 * - Zeigt ob Auto-Refresh funktioniert
 */
function updateLastUpdate() {
    const now = new Date();
    const element = document.getElementById('lastUpdate');
    if (element) {
        element.textContent = now.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

/**
 * BERECHNET START UND ENDE DER AKTUELLEN SCHICHT
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Rettungsdienst-Schichten laufen von 07:00 bis 07:00 Uhr (24 Stunden)
 * - Funktion berechnet automatisch Start und Ende basierend auf aktueller Zeit
 * - Wenn es vor 07:00 Uhr ist, gehört Zeit zur Schicht des Vortags
 *
 * LOGIK:
 * - Aktuelle Zeit >= 07:00 Uhr: Schicht heute 07:00 - morgen 07:00
 * - Aktuelle Zeit < 07:00 Uhr: Schicht gestern 07:00 - heute 07:00
 *
 * BEISPIEL 1:
 * - Jetzt: 08.11.2025 15:30 Uhr
 * - Start: 08.11.2025 07:00 Uhr
 * - Ende: 09.11.2025 07:00 Uhr
 *
 * BEISPIEL 2:
 * - Jetzt: 08.11.2025 05:30 Uhr
 * - Start: 07.11.2025 07:00 Uhr
 * - Ende: 08.11.2025 07:00 Uhr
 *
 * @returns {Object} Object mit startTime und endTime (Date-Objekte)
 */
function getCurrentShiftTimes() {
    const now = new Date();
    const currentHour = now.getHours();

    const startTime = new Date(now);
    startTime.setHours(7, 0, 0, 0);

    if (currentHour < 7) {
        startTime.setDate(startTime.getDate() - 1);
    }

    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1);

    return { startTime: startTime, endTime: endTime };
}

/**
 * KONVERTIERT DATE-OBJEKT ZU SQL TIMESTAMP FORMAT
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - ArcGIS Feature Services erwarten Zeitstempel im SQL-Format
 * - Format: YYYY-MM-DD HH:MM:SS (z.B. "2025-11-08 14:30:45")
 * - Verwendet UTC-Zeit (wichtig für korrekte Server-Abfragen!)
 *
 * WARUM UTC:
 * - Server speichert Daten in UTC
 * - Vermeidet Zeitzone-Probleme
 * - Konsistent über verschiedene Standorte
 *
 * VERWENDUNG:
 * - WHERE-Klauseln in ArcGIS Queries
 * - Zeitfilter für Schicht-Abfragen
 *
 * @param {Date} date - JavaScript Date-Objekt
 * @returns {string} SQL-formatierter Zeitstempel (UTC)
 */
function formatDateToSQL(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
}

// ============================================================================
// HILFSFRIST-RELEVANZ-SYSTEM
// ============================================================================

/**
 * PRÜFT OB EINSATZ HILFSFRIST-RELEVANT IST
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Nicht alle Einsätze zählen für Hilfsfrist-KPIs
 * - Einsätze die mit "-NF" enden sind NICHT relevant
 * - NF = "Nicht Frist" (z.B. Krankentransporte, Verlegungen)
 *
 * LOGIK:
 * - Wenn nameeventtype leer/null: Als relevant behandeln
 * - Wenn nameeventtype endet mit "-NF": NICHT relevant
 * - Alle anderen: Relevant
 *
 * BEISPIELE:
 * - "Notfall-Rettung" → relevant (true)
 * - "Krankentransport-NF" → NICHT relevant (false)
 * - "VU-Person" → relevant (true)
 * - null → relevant (true, sicher annehmen)
 *
 * WARUM WICHTIG:
 * - Hilfsfrist-KPIs werden nur für relevante Einsätze berechnet
 * - Filtert Routine-Transporte aus Statistik
 * - Entspricht gesetzlichen Vorgaben
 *
 * @param {string} nameeventtype - Einsatztyp (z.B. "Notfall-Rettung" oder "Transport-NF")
 * @returns {boolean} true wenn relevant, false wenn nicht
 */
function isHilfsfristRelevant(nameeventtype) {
    if (!nameeventtype) return true;
    return !nameeventtype.endsWith('-NF');
}

// ============================================================================
// KPI CALCULATION
// ============================================================================

/**
 * BERECHNET PERZENTIL-WERT AUS ZAHLEN-ARRAY
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Perzentil zeigt an: "X% der Werte sind kleiner oder gleich diesem Wert"
 * - 90. Perzentil: 90% der Einsätze haben diese Zeit oder weniger
 * - Wichtig für Qualitätskennzahlen im Rettungsdienst
 *
 * FUNKTIONSWEISE:
 * 1. Sortiere alle Werte aufsteigend
 * 2. Berechne Position: (Perzentil / 100) * Anzahl
 * 3. Gib Wert an dieser Position zurück
 *
 * BEISPIEL (90. Perzentil):
 * - Werte: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] Sekunden
 * - 90. Perzentil Position: (90/100) * 10 = 9
 * - Ergebnis: 90 Sekunden
 * - Bedeutung: 90% der Einsätze hatten 90s oder weniger
 *
 * WARUM WICHTIG:
 * - Robuster als Durchschnitt (ignoriert Ausreißer)
 * - Standard-Kennzahl im Qualitätsmanagement
 * - Entspricht gesetzlichen Vorgaben
 *
 * @param {Array<number>} values - Array von Zahlen (z.B. Zeiten in Sekunden)
 * @param {number} percentile - Perzentil (z.B. 90 für 90%)
 * @returns {number|null} Perzentil-Wert oder null wenn Array leer
 */
function calculatePercentile(values, percentile) {
    if (values.length === 0) return null;
    const sorted = values.slice().sort(function(a, b) { return a - b; });
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

/**
 * BERECHNET ALLE DASHBOARD-KPIs
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Zentrale Funktion zur Berechnung aller Kennzahlen
 * - Verarbeitet Einsatzdaten und berechnet Statistiken
 * - Unterscheidet zwischen relevanten und nicht-relevanten Einsätzen
 * - Berechnet Erfolgsquoten und Perzentile
 *
 * BERECHNETE KPIs:
 * 1. GESAMT-STATISTIK:
 *    - Gesamtzahl Einsätze
 *    - Anzahl relevanter Einsätze
 *    - Anzahl nicht-relevanter Einsätze
 *
 * 2. AUSRÜCKEZEIT (Response Time):
 *    - Erfolgsquote in % (wie viele erreichen Schwellenwert)
 *    - Anzahl erfolgreich / Anzahl gesamt
 *    - 90. Perzentil (90% sind schneller als dieser Wert)
 *
 * 3. ANFAHRTSZEIT (Travel Time):
 *    - Erfolgsquote in %
 *    - Anzahl erfolgreich / Anzahl gesamt
 *    - 90. Perzentil
 *
 * 4. HILFSFRIST (Gesamt):
 *    - Erfolgsquote in % (Ausrücke UND Anfahrt erreicht)
 *    - Anzahl erfolgreich / Anzahl gesamt
 *
 * NULL-WERTE:
 * - Wenn responseTime null: Fahrzeug noch nicht ausgerückt
 * - Wenn travelTime null: Fahrzeug noch nicht angekommen
 * - Null-Werte werden aus Statistik ausgeschlossen
 *
 * @param {Array} data - Array von verarbeiteten Einsatzdaten
 * @returns {Object} Object mit allen berechneten KPIs
 */
function calculateKPIs(data) {
    const total = data.length;
    const relevantData = data.filter(function(d) { return d.isHilfsfristRelevant; });
    const notRelevantData = data.filter(function(d) { return !d.isHilfsfristRelevant; });

    const responseValid = relevantData.filter(function(d) { return d.responseAchieved !== null; });
    const responseAchieved = relevantData.filter(function(d) { return d.responseAchieved === true; }).length;
    const responsePercentage = responseValid.length > 0
        ? (responseAchieved / responseValid.length * 100)
        : 0;

    const travelValid = relevantData.filter(function(d) { return d.travelAchieved !== null; });
    const travelAchieved = relevantData.filter(function(d) { return d.travelAchieved === true; }).length;
    const travelPercentage = travelValid.length > 0
        ? (travelAchieved / travelValid.length * 100)
        : 0;

    const hilfsfristValid = relevantData.filter(function(d) { return d.hilfsfristAchieved !== null; });
    const hilfsfristAchieved = relevantData.filter(function(d) { return d.hilfsfristAchieved === true; }).length;
    const hilfsfristPercentage = hilfsfristValid.length > 0
        ? (hilfsfristAchieved / hilfsfristValid.length * 100)
        : 0;

    // 90% Perzentil Berechnung
    const responseTimes = responseValid.map(function(d) { return d.responseTime; }).filter(function(t) { return t !== null; });
    const travelTimes = travelValid.map(function(d) { return d.travelTime; }).filter(function(t) { return t !== null; });

    const response90Percentile = calculatePercentile(responseTimes, 90);
    const travel90Percentile = calculatePercentile(travelTimes, 90);

    return {
        total: total,
        relevantCount: relevantData.length,
        notRelevantCount: notRelevantData.length,
        relevantPercentage: total > 0 ? (relevantData.length / total * 100) : 0,
        notRelevantPercentage: total > 0 ? (notRelevantData.length / total * 100) : 0,

        responseAchieved: responseAchieved,
        responseTotal: responseValid.length,
        responsePercentage: responsePercentage,
        response90Percentile: response90Percentile,

        travelAchieved: travelAchieved,
        travelTotal: travelValid.length,
        travelPercentage: travelPercentage,
        travel90Percentile: travel90Percentile,

        hilfsfristAchieved: hilfsfristAchieved,
        hilfsfristTotal: hilfsfristValid.length,
        hilfsfristPercentage: hilfsfristPercentage
    };
}

/**
 * BERECHNET AMPEL-STATUS FÜR KPI-KARTEN
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Konvertiert Prozent-Wert in visuellen Status (Ampel)
 * - Zeigt auf einen Blick ob KPI gut, ok oder schlecht ist
 * - Basiert auf gesetzlichen Qualitäts-Vorgaben
 *
 * SCHWELLENWERTE:
 * - GRÜN (Exzellent): >= 90%
 *   → Qualitätsziel übertroffen, sehr gut!
 *
 * - GELB (Akzeptabel): 75-89%
 *   → Qualitätsziel nicht ganz erreicht, Verbesserung nötig
 *
 * - ROT (Kritisch): < 75%
 *   → Deutlich unter Qualitätsziel, dringender Handlungsbedarf!
 *
 * VERWENDUNG:
 * - Farbcodierung der KPI-Karten
 * - Status-Badges in UI
 * - Schnelle visuelle Erkennung von Problemen
 *
 * @param {number} percentage - Prozentsatz (0-100)
 * @returns {Object} Status-Object mit status, emoji und text
 */
function getThresholdStatus(percentage) {
    if (percentage >= 90) return { status: 'green', emoji: '🟢', text: 'Exzellent (≥90%)' };
    if (percentage >= 75) return { status: 'yellow', emoji: '🟡', text: 'Akzeptabel (75-89%)' };
    return { status: 'red', emoji: '🔴', text: 'Kritisch (<75%)' };
}

// ============================================================================
// RÜCKFAHRTZEIT-ANALYSE
// ============================================================================

/**
 * BERECHNET RÜCKFAHRTZEIT-KPIs MIT PLAUSIBILITÄTS-KATEGORIEN
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Analysiert die Rückfahrtzeiten von RTW-Einsätzen
 * - Kategorisiert nach Plausibilität (verdächtig kurz bis plausibel)
 * - Gilt für ALLE Einsätze (nicht nur hilfsfristrelevante)
 * - Identifiziert potenzielle Datenqualitätsprobleme
 *
 * RÜCKFAHRTZEIT = time_finished - time_finished_via_radio
 *
 * KATEGORIEN (Focus auf verdächtig kurze Zeiten):
 * - < 2 Min (120s): Sehr verdächtig - kaum realistisch
 * - < 5 Min (300s): Verdächtig - extrem schnelle Rückkehr
 * - < 10 Min (600s): Auffällig - sehr schnelle Rückkehr
 * - < 20 Min (1200s): Grenzwertig - schnelle Rückkehr
 * - ≥ 20 Min: Plausibel - normale Rückfahrtzeit
 *
 * BERECHNETE METRIKEN:
 * - Anzahl und Quote pro Kategorie
 * - Mittelwert, Median, 0.25 und 0.75 Perzentile
 * - Gesamtanzahl mit gültigen Rückfahrtzeiten
 *
 * @param {Array} data - Alle Einsatzdaten (auch nicht-hilfsfristrelevante)
 * @returns {Object} KPI-Object mit Kategorien, Statistiken und Perzentilen
 */
function calculateReturnTimeKPIs(data) {
    // Filtere nur Datensätze mit gültiger Rückfahrtzeit
    const validReturnTimes = data.filter(function(d) {
        return d.returnTime !== null && d.returnTime >= 0;
    });

    const total = validReturnTimes.length;

    // Kategorisierung nach Plausibilität
    const lessThan2Min = validReturnTimes.filter(function(d) { return d.returnTime < 120; }).length;
    const lessThan5Min = validReturnTimes.filter(function(d) { return d.returnTime < 300; }).length;
    const lessThan10Min = validReturnTimes.filter(function(d) { return d.returnTime < 600; }).length;
    const lessThan20Min = validReturnTimes.filter(function(d) { return d.returnTime < 1200; }).length;
    const greaterEqual20Min = validReturnTimes.filter(function(d) { return d.returnTime >= 1200; }).length;

    // Berechne Quoten
    const percentLessThan2Min = total > 0 ? (lessThan2Min / total * 100) : 0;
    const percentLessThan5Min = total > 0 ? (lessThan5Min / total * 100) : 0;
    const percentLessThan10Min = total > 0 ? (lessThan10Min / total * 100) : 0;
    const percentLessThan20Min = total > 0 ? (lessThan20Min / total * 100) : 0;
    const percentGreaterEqual20Min = total > 0 ? (greaterEqual20Min / total * 100) : 0;

    // Extrahiere Zeiten für statistische Berechnung
    const returnTimes = validReturnTimes.map(function(d) { return d.returnTime; });

    // Berechne statistische Kennzahlen
    const mean = returnTimes.length > 0
        ? returnTimes.reduce(function(sum, t) { return sum + t; }, 0) / returnTimes.length
        : null;

    const median = calculatePercentile(returnTimes, 50);
    const percentile25 = calculatePercentile(returnTimes, 25);
    const percentile75 = calculatePercentile(returnTimes, 75);

    return {
        total: total,
        lessThan2Min: lessThan2Min,
        lessThan5Min: lessThan5Min,
        lessThan10Min: lessThan10Min,
        lessThan20Min: lessThan20Min,
        greaterEqual20Min: greaterEqual20Min,
        percentLessThan2Min: percentLessThan2Min,
        percentLessThan5Min: percentLessThan5Min,
        percentLessThan10Min: percentLessThan10Min,
        percentLessThan20Min: percentLessThan20Min,
        percentGreaterEqual20Min: percentGreaterEqual20Min,
        mean: mean,
        median: median,
        percentile25: percentile25,
        percentile75: percentile75
    };
}

/**
 * BERECHNET HISTOGRAM-DATEN FÜR RÜCKFAHRTZEIT-VERTEILUNG
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Erstellt Bins für Histogramm-Darstellung
 * - 2-Minuten-Intervalle für detaillierte Analyse
 * - Bereiche: 0-2, 2-4, 4-6, ... bis 30+ Minuten
 *
 * VERWENDUNG:
 * - Visualisierung der Verteilung in Chart.js
 * - Identifikation von Mustern und Ausreißern
 *
 * @param {Array} data - Alle Einsatzdaten
 * @returns {Object} Object mit labels und counts für Histogramm
 */
function calculateReturnTimeHistogramData(data) {
    const validReturnTimes = data.filter(function(d) {
        return d.returnTime !== null && d.returnTime >= 0;
    });

    // Bins: 2-Minuten-Intervalle (0-2, 2-4, 4-6, ... 28-30, >30)
    const bins = {
        '0-2min': 0,
        '2-4min': 0,
        '4-6min': 0,
        '6-8min': 0,
        '8-10min': 0,
        '10-12min': 0,
        '12-14min': 0,
        '14-16min': 0,
        '16-18min': 0,
        '18-20min': 0,
        '20-22min': 0,
        '22-24min': 0,
        '24-26min': 0,
        '26-28min': 0,
        '28-30min': 0,
        '>30min': 0
    };

    validReturnTimes.forEach(function(item) {
        const minutes = item.returnTime / 60;
        if (minutes < 2) bins['0-2min']++;
        else if (minutes < 4) bins['2-4min']++;
        else if (minutes < 6) bins['4-6min']++;
        else if (minutes < 8) bins['6-8min']++;
        else if (minutes < 10) bins['8-10min']++;
        else if (minutes < 12) bins['10-12min']++;
        else if (minutes < 14) bins['12-14min']++;
        else if (minutes < 16) bins['14-16min']++;
        else if (minutes < 18) bins['16-18min']++;
        else if (minutes < 20) bins['18-20min']++;
        else if (minutes < 22) bins['20-22min']++;
        else if (minutes < 24) bins['22-24min']++;
        else if (minutes < 26) bins['24-26min']++;
        else if (minutes < 28) bins['26-28min']++;
        else if (minutes < 30) bins['28-30min']++;
        else bins['>30min']++;
    });

    return {
        labels: Object.keys(bins),
        counts: Object.values(bins)
    };
}

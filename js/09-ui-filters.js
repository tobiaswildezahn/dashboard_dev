// ============================================================================
// FILE: js/09-ui-filters.js
// RTW Picker, Filters, and Export Functions
// Dependencies: state, formatTimestamp, showMessage, updateDashboard
// ============================================================================

// ============================================================================
// RTW PICKER
// ============================================================================

/**
 * EXTRAHIERT EINDEUTIGE RTW-NAMEN AUS DATEN
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Durchsucht alle Einsatzdaten nach Fahrzeug-Namen
 * - Verwendet Set() um Duplikate automatisch zu entfernen
 * - Sortiert alphabetisch für bessere Übersicht
 *
 * FUNKTIONSWEISE:
 * 1. Erstelle leeres Set (speichert nur eindeutige Werte)
 * 2. Durchlaufe alle Einsätze
 * 3. Füge call_sign zum Set hinzu (Duplikate werden ignoriert)
 * 4. Konvertiere Set zu Array
 * 5. Sortiere alphabetisch
 *
 * WARUM SET:
 * - Set speichert automatisch nur eindeutige Werte
 * - Schneller als manuelles Prüfen auf Duplikate
 * - Moderner JavaScript-Standard
 *
 * @param {Array} data - Array von Einsatzdaten
 * @returns {Array<string>} Sortiertes Array eindeutiger RTW-Namen
 */
function extractUniqueRtw(data) {
    const rtwSet = new Set();
    data.forEach(function(item) {
        if (item.call_sign) {
            rtwSet.add(item.call_sign);
        }
    });
    return Array.from(rtwSet).sort();
}

/**
 * BEFÜLLT RTW-PICKER MIT CHECKBOXEN
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Erstellt für jeden RTW eine Checkbox im Filter-Bereich
 * - Erhält Auswahl-Status von vorheriger Filterung
 * - Registriert Event-Listener für jede Checkbox
 *
 * ABLAUF:
 * 1. Lösche alten Inhalt des Grids
 * 2. Für jeden RTW:
 *    - Erstelle Checkbox
 *    - Setze checked-Status (basierend auf state.selectedRtwList)
 *    - Erstelle Label
 *    - Registriere onChange Event
 *    - Füge zu Grid hinzu
 * 3. Aktualisiere Zähler
 *
 * CHECKBOX-STATUS:
 * - Wenn selectedRtwList leer: Alle Checkboxen aktiviert (= alle ausgewählt)
 * - Wenn selectedRtwList gefüllt: Nur enthaltene RTWs aktiviert
 *
 * @param {Array<string>} rtwList - Array von RTW-Namen
 */
function populateRtwPicker(rtwList) {
    const grid = document.getElementById('rtwCheckboxGrid');
    grid.innerHTML = '';

    rtwList.forEach(function(rtw) {
        const item = document.createElement('div');
        item.className = 'rtw-checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'rtw_' + rtw;
        checkbox.value = rtw;
        checkbox.checked = state.selectedRtwList.length === 0 || state.selectedRtwList.includes(rtw);
        checkbox.addEventListener('change', onRtwSelectionChange);

        const label = document.createElement('label');
        label.htmlFor = 'rtw_' + rtw;
        label.textContent = rtw;

        item.appendChild(checkbox);
        item.appendChild(label);
        grid.appendChild(item);
    });

    updateRtwSelectedCount();
}

/**
 * REAGIERT AUF RTW-AUSWAHL-ÄNDERUNGEN
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Wird aufgerufen wenn Benutzer Checkbox an/abwählt
 * - Aktualisiert globalen State mit neuer Auswahl
 * - Triggert Dashboard-Neuberechnung mit gefilterten Daten
 *
 * ABLAUF:
 * 1. Finde alle RTW-Checkboxen
 * 2. Filtere nur angehakte Checkboxen
 * 3. Extrahiere deren Werte (RTW-Namen)
 * 4. Speichere in state.selectedRtwList
 * 5. Aktualisiere Zähler-Anzeige
 * 6. Aktualisiere gesamtes Dashboard
 *
 * WARUM WICHTIG:
 * - Ermöglicht Filterung nach spezifischen Fahrzeugen
 * - Reduziert angezeigte Daten für bessere Übersicht
 * - Kann einzelne RTWs analysieren
 */
function onRtwSelectionChange() {
    const checkboxes = document.querySelectorAll('#rtwCheckboxGrid input[type="checkbox"]');
    state.selectedRtwList = Array.from(checkboxes)
        .filter(function(cb) { return cb.checked; })
        .map(function(cb) { return cb.value; });

    updateRtwSelectedCount();
    updateDashboard();
}

/**
 * AKTUALISIERT ANZEIGE DER AUSGEWÄHLTEN RTW-ANZAHL
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Zeigt wie viele RTWs aktuell ausgewählt sind
 * - Spezialfall: Wenn alle oder keine ausgewählt, zeige "(Alle ausgewählt)"
 * - Sonst zeige z.B. "(3 von 10 ausgewählt)"
 *
 * BEISPIELE:
 * - 0 von 5 ausgewählt → "(Alle ausgewählt)"
 * - 5 von 5 ausgewählt → "(Alle ausgewählt)"
 * - 3 von 5 ausgewählt → "(3 von 5 ausgewählt)"
 *
 * WARUM "ALLE BEI 0":
 * - Leere Auswahl = keine Filterung = alle Daten
 * - Benutzer-freundlicher als "0 ausgewählt"
 */
function updateRtwSelectedCount() {
    const total = document.querySelectorAll('#rtwCheckboxGrid input[type="checkbox"]').length;
    const selected = state.selectedRtwList.length;
    const countSpan = document.getElementById('rtwSelectedCount');

    if (selected === 0 || selected === total) {
        countSpan.textContent = '(Alle ausgewählt)';
    } else {
        countSpan.textContent = '(' + selected + ' von ' + total + ' ausgewählt)';
    }
}

function toggleRtwPicker() {
    const content = document.getElementById('rtwPickerContent');
    const toggle = document.querySelector('.rtw-picker-toggle');

    content.classList.toggle('visible');
    toggle.classList.toggle('expanded');
}

function selectAllRtw() {
    const checkboxes = document.querySelectorAll('#rtwCheckboxGrid input[type="checkbox"]');
    checkboxes.forEach(function(cb) { cb.checked = true; });
    onRtwSelectionChange();
}

function deselectAllRtw() {
    const checkboxes = document.querySelectorAll('#rtwCheckboxGrid input[type="checkbox"]');
    checkboxes.forEach(function(cb) { cb.checked = false; });
    onRtwSelectionChange();
}

/**
 * FILTERT DATEN NACH AUSGEWÄHLTEN RTWs
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Zentrale Filter-Funktion für RTW-Auswahl
 * - Gibt nur Einsätze zurück die zu ausgewählten RTWs gehören
 * - Spezialfall: Leere Auswahl = keine Filterung (alle Daten)
 *
 * LOGIK:
 * - selectedRtwList leer: Gib ALLE Daten zurück
 * - selectedRtwList gefüllt: Gib nur Daten zurück wo call_sign in Liste
 *
 * VERWENDUNG:
 * - updateDashboard() filtert damit vor KPI-Berechnung
 * - exportCSV() filtert damit vor Export
 * - Jede Funktion die nur ausgewählte RTWs braucht
 *
 * @param {Array} data - Ungefilterte Einsatzdaten
 * @returns {Array} Gefilterte Daten (nur ausgewählte RTWs)
 */
function filterBySelectedRtw(data) {
    if (state.selectedRtwList.length === 0) {
        return data;
    }
    return data.filter(function(item) { return state.selectedRtwList.includes(item.call_sign); });
}

// ============================================================================
// EXPORT - MIT NAMEEVENTTYPE UND HILFSFRIST-RELEVANZ
// ============================================================================

/**
 * EXPORTIERT DATEN ALS CSV-DATEI
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Erstellt CSV-Datei mit allen relevanten Einsatzdaten
 * - Berücksichtigt RTW-Filter (nur ausgewählte Fahrzeuge)
 * - Verwendet UTF-8 mit BOM für Excel-Kompatibilität
 * - Automatischer Download im Browser
 *
 * CSV-SPALTEN:
 * 1. RTW: Fahrzeug-Rufname
 * 2. Einsatztyp: z.B. "Notfall-Rettung"
 * 3. Hilfsfrist-Relevant: Ja/Nein
 * 4. Alarmzeit: Formatiert als DD.MM.YYYY HH:MM
 * 5. Ausrückezeit (s): In Sekunden
 * 6. Ausrückezeit OK: Ja/Nein/N/A
 * 7. Anfahrtszeit (s): In Sekunden
 * 8. Anfahrtszeit OK: Ja/Nein/N/A
 * 9. Hilfsfrist erreicht: Ja/Nein/N/A
 * 10. Event ID: Eindeutige Einsatz-ID
 *
 * DATEINAME:
 * - Format: rtw_hilfsfrist_YYYY-MM-DD.csv
 * - Beispiel: rtw_hilfsfrist_2025-11-08.csv
 *
 * SONDERZEICHEN:
 * - Semikolons in Daten werden durch Kommas ersetzt
 * - Einsatztyp in Anführungszeichen (kann Sonderzeichen enthalten)
 * - UTF-8 BOM (﻿) für korrekte Umlaute in Excel
 *
 * WARUM WICHTIG:
 * - Datenanalyse in Excel möglich
 * - Langzeit-Archivierung
 * - Berichte für Management
 *
 * @throws Zeigt Fehlermeldung wenn keine Daten verfügbar
 */
function exportCSV() {
    const data = filterBySelectedRtw(state.processedData);

    if (data.length === 0) {
        showMessage('Keine Daten zum Exportieren verfügbar', 'error');
        return;
    }

    let csv = '\uFEFF';
    csv += 'RTW;Einsatztyp;Hilfsfrist-Relevant;Alarmzeit;Ausrückezeit (s);Ausrückezeit OK;';
    csv += 'Anfahrtszeit (s);Anfahrtszeit OK;Hilfsfrist erreicht;Event ID\n';

    data.forEach(function(item) {
        const responseOK = item.responseAchieved ? 'Ja' : 'Nein';
        const travelOK = item.travelAchieved ? 'Ja' : 'Nein';
        const hilfsfristOK = item.hilfsfristAchieved ? 'Ja' : 'Nein';
        const relevant = item.isHilfsfristRelevant ? 'Ja' : 'Nein';
        const einsatztyp = (item.nameeventtype || 'N/A').replace(/;/g, ',');

        csv += (item.call_sign || 'N/A') + ';';
        csv += '"' + einsatztyp + '";';
        csv += relevant + ';';
        csv += formatTimestamp(item.time_alarm) + ';';
        csv += (item.responseTime !== null ? Math.round(item.responseTime) : 'N/A') + ';';
        csv += (item.responseTime !== null ? responseOK : 'N/A') + ';';
        csv += (item.travelTime !== null ? Math.round(item.travelTime) : 'N/A') + ';';
        csv += (item.travelTime !== null ? travelOK : 'N/A') + ';';
        csv += (item.responseTime !== null && item.travelTime !== null ? hilfsfristOK : 'N/A') + ';';
        csv += (item.idevent || 'N/A') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', 'rtw_hilfsfrist_' + date + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showMessage('✅ CSV-Export erfolgreich (' + data.length + ' Einträge)', 'success');
}

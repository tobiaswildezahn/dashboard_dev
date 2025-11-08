// ============================================================================
// FILE: js/07-ui-table.js
// Table Display, Sorting, and Updates
// Dependencies: state, formatTimestamp, escapeHtml
// ============================================================================

/**
 * SORTIERT TABELLENDATEN
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Erstellt eine Kopie der Daten (slice) um Original nicht zu verändern
 * - Sortiert nach einer bestimmten Spalte (z.B. "call_sign", "time_alarm")
 * - Unterstützt aufsteigende (asc) und absteigende (desc) Sortierung
 * - Behandelt null/undefined Werte korrekt (werden ans Ende sortiert)
 * - Unterstützt verschiedene Datentypen: Boolean, String, Number
 *
 * WARUM WICHTIG:
 * - Benutzer können Tabelle nach beliebiger Spalte sortieren
 * - Erleichtert das Finden von spezifischen Einträgen
 * - Keine Serveranfrage nötig - alles clientseitig
 *
 * @param {Array} data - Array von Einsatzdaten-Objekten
 * @param {string} column - Name der Spalte nach der sortiert wird
 * @param {string} direction - Sortierrichtung: 'asc' (aufsteigend) oder 'desc' (absteigend)
 * @returns {Array} Sortiertes Array (neue Kopie, Original bleibt unverändert)
 */
function sortTableData(data, column, direction) {
    return data.slice().sort(function(a, b) {
        let aVal = a[column];
        let bVal = b[column];

        // Handle null/undefined values
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        // Boolean comparison
        if (typeof aVal === 'boolean') {
            aVal = aVal ? 1 : 0;
            bVal = bVal ? 1 : 0;
        }

        // String comparison (case insensitive)
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        // Compare
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function updateTableSortIndicators() {
    // Remove all sort classes
    document.querySelectorAll('thead th.sortable').forEach(function(th) {
        th.classList.remove('sort-asc', 'sort-desc');
    });

    // Add current sort class
    const currentHeader = document.querySelector('thead th[data-sort="' + state.tableSortColumn + '"]');
    if (currentHeader) {
        currentHeader.classList.add('sort-' + state.tableSortDirection);
    }
}

/**
 * AKTUALISIERT DIE EINSATZ-TABELLE
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Nimmt gefilterte Einsatzdaten und zeigt sie in der Tabelle an
 * - Sortiert Daten automatisch nach aktueller Spalten-Auswahl
 * - Escaped ALLE Benutzerdaten um XSS-Angriffe zu verhindern
 * - Berechnet Status-Badges (OK / Nicht erreicht) für jede Zeile
 * - Verwendet Event-Delegation für Event-ID Links (sicherer als onclick)
 *
 * SICHERHEITSMASSNAHMEN:
 * - escapeHtml() für call_sign und nameeventtype (verhindert XSS)
 * - data-event-id Attribut statt onclick (verhindert Code-Injection)
 * - Alle HTML-Sonderzeichen werden escaped
 *
 * WARUM WICHTIG:
 * - Hauptansicht aller Einsätze im Dashboard
 * - Zeigt alle relevanten KPIs pro Einsatz
 * - Ermöglicht Klick auf Event-ID für Details
 *
 * @param {Array} data - Array von Einsatzdaten nach Filterung
 */
function updateTable(data) {
    const tbody = document.getElementById('tableBody');
    const recordCount = document.getElementById('tableRecordCount');

    // Sort data
    const sortedData = sortTableData(data, state.tableSortColumn, state.tableSortDirection);

    recordCount.textContent = sortedData.length;

    // Update sort indicators
    updateTableSortIndicators();

    if (sortedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">' +
            '<div class="empty-state-icon">🔍</div>' +
            '<div>Keine Daten verfügbar</div>' +
            '</td></tr>';
        return;
    }

    tbody.innerHTML = sortedData.map(function(item) {
        const responseStatus = item.responseTime !== null
            ? (item.responseAchieved ? 'success' : 'danger')
            : 'na';
        const travelStatus = item.travelTime !== null
            ? (item.travelAchieved ? 'success' : 'danger')
            : 'na';
        const hilfsfristStatus = item.responseTime !== null && item.travelTime !== null
            ? (item.hilfsfristAchieved ? 'success' : 'danger')
            : 'na';

        const relevanzBadge = item.isHilfsfristRelevant
            ? '<span class="hilfsfrist-relevant">RELEVANT</span>'
            : '<span class="hilfsfrist-nicht-relevant">NICHT REL.</span>';

        // SICHERHEIT: escapeHtml() verhindert XSS-Angriffe durch gefährliche Zeichen
        const einsatztyp = escapeHtml(item.nameeventtype);
        const callSign = escapeHtml(item.call_sign);

        const responseStatusText = responseStatus === 'success' ? '✓ OK' :
                                   responseStatus === 'danger' ? '✗ Nicht erreicht' : 'N/A';
        const travelStatusText = travelStatus === 'success' ? '✓ OK' :
                                 travelStatus === 'danger' ? '✗ Nicht erreicht' : 'N/A';
        const hilfsfristStatusText = hilfsfristStatus === 'success' ? '✓ Erreicht' :
                                     hilfsfristStatus === 'danger' ? '✗ Nicht erreicht' : 'N/A';

        // SICHERHEIT: data-event-id statt onclick verhindert Code-Injection
        // Event-Delegation wird in init() registriert (sicherer als inline onclick)
        const eventIdCell = item.idevent
            ? '<a href="#" class="event-id-link" data-event-id="' + item.idevent + '">' + item.idevent + '</a>'
            : 'N/A';

        return '<tr>' +
            '<td><strong>' + callSign + '</strong></td>' +
            '<td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="' + einsatztyp + '">' + einsatztyp + '</td>' +
            '<td>' + relevanzBadge + '</td>' +
            '<td>' + formatTimestamp(item.time_alarm) + '</td>' +
            '<td>' + (item.responseTime !== null ? Math.round(item.responseTime) + 's' : 'N/A') + '</td>' +
            '<td><span class="status-badge ' + responseStatus + '">' + responseStatusText + '</span></td>' +
            '<td>' + (item.travelTime !== null ? Math.round(item.travelTime) + 's' : 'N/A') + '</td>' +
            '<td><span class="status-badge ' + travelStatus + '">' + travelStatusText + '</span></td>' +
            '<td><span class="status-badge ' + hilfsfristStatus + '">' + hilfsfristStatusText + '</span></td>' +
            '<td>' + eventIdCell + '</td>' +
            '</tr>';
    }).join('');
}

// ============================================================================
// EVENT DELEGATION FÜR EVENT-ID LINKS
// ============================================================================

/**
 * SICHERHEITS-MASSNAHME: Event-Delegation für Event-ID Links
 *
 * WARUM EVENT-DELEGATION:
 * - Verhindert inline onclick Handler (XSS-Risiko)
 * - Ein einziger Event-Listener für alle Links (Performance)
 * - Funktioniert auch für dynamisch hinzugefügte Elemente
 *
 * FUNKTIONSWEISE:
 * - Listener auf Parent-Element (tbody) statt auf jedem Link
 * - Prüft ob geklicktes Element ein .event-id-link ist
 * - Liest event-id aus data-Attribut (sicher)
 * - Ruft Modal-Funktion auf
 */
document.addEventListener('DOMContentLoaded', function() {
    const tbody = document.getElementById('tableBody');
    if (tbody) {
        tbody.addEventListener('click', function(event) {
            // Prüfe ob geklicktes Element ein Event-ID Link ist
            if (event.target.classList.contains('event-id-link')) {
                event.preventDefault();

                // Lese Event-ID aus data-Attribut (sicher!)
                const eventId = event.target.dataset.eventId;

                if (eventId && window.openEventDetailsModal) {
                    window.openEventDetailsModal(parseInt(eventId));
                }
            }
        });
    }
});


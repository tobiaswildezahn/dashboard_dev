// ============================================================================
// FILE: js/10-main.js
// Main Dashboard Logic, Event Listeners, and Initialization
// Dependencies: state, CONFIG, fetchData, updateKPIs, updateCharts, updateTable,
//               filterBySelectedRtw, exportCSV, toggleRtwPicker, selectAllRtw,
//               deselectAllRtw
// ============================================================================

// ============================================================================
// DASHBOARD UPDATE
// ============================================================================

/**
 * AKTUALISIERT DAS GESAMTE DASHBOARD
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Zentrale Funktion die alle UI-Komponenten aktualisiert
 * - Wird nach jedem Datenladen oder Filter-Änderung aufgerufen
 * - Filtert Daten nach ausgewählten RTWs
 * - Aktualisiert KPIs, Charts und Tabelle
 *
 * ABLAUF:
 * 1. Filtere Daten nach RTW-Auswahl
 * 2. Aktualisiere KPI-Karten
 * 3. Aktualisiere Charts (Histogramme)
 * 4. Aktualisiere Tabelle
 *
 * WARUM ZENTRAL:
 * - Alle UI-Updates an einem Ort
 * - Garantiert Konsistenz zwischen Komponenten
 * - Einfacher zu debuggen
 */
function updateDashboard() {
    const data = filterBySelectedRtw(state.processedData);

    updateKPIs(data);
    updateReturnTimeKPI(data);
    updateCharts(data);
    updateTable(data);
}

// ============================================================================
// AUTO-REFRESH
// ============================================================================

/**
 * STARTET AUTOMATISCHE DATEN-AKTUALISIERUNG
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Lädt Daten automatisch alle X Sekunden (konfigurierbar in CONFIG)
 * - Läuft im Hintergrund ohne Benutzer-Interaktion
 * - Zeigt keine Lade-Indikatoren (stille Aktualisierung)
 *
 * WARUM AUTO-REFRESH:
 * - Dashboard bleibt aktuell ohne manuelle Klicks
 * - Wichtig für Echtzeit-Monitoring
 * - Zeigt neue Einsätze automatisch an
 *
 * FUNKTIONSWEISE:
 * - Verwendet setInterval() für periodische Ausführung
 * - Stoppt alten Timer falls vorhanden (verhindert Duplikate)
 * - Lädt Daten mit showLoadingIndicator=false (dezent)
 */
function startAutoRefresh() {
    if (state.autoRefreshTimer) {
        clearInterval(state.autoRefreshTimer);
    }

    state.autoRefreshTimer = setInterval(function() {
        fetchData({
            updateFilters: false,
            showLoadingIndicator: false,
            showSuccessMessage: false
        });
    }, CONFIG.autoRefreshInterval);

    console.log('Auto-Refresh gestartet (' + (CONFIG.autoRefreshInterval / 1000) + 's)');
}

function stopAutoRefresh() {
    if (state.autoRefreshTimer) {
        clearInterval(state.autoRefreshTimer);
        state.autoRefreshTimer = null;
        console.log('Auto-Refresh gestoppt');
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

document.getElementById('refreshBtn').addEventListener('click', function() {
    fetchData();
});

document.getElementById('exportBtn').addEventListener('click', exportCSV);

document.getElementById('timeFilter').addEventListener('change', function() {
    fetchData();
});

document.getElementById('rtwPickerToggle').addEventListener('click', toggleRtwPicker);
document.getElementById('selectAllRtwBtn').addEventListener('click', selectAllRtw);
document.getElementById('deselectAllRtwBtn').addEventListener('click', deselectAllRtw);

// Table sorting
document.querySelectorAll('thead th.sortable').forEach(function(th) {
    th.addEventListener('click', function() {
        const column = th.dataset.sort;

        // Toggle direction if same column, otherwise default to asc
        if (state.tableSortColumn === column) {
            state.tableSortDirection = state.tableSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.tableSortColumn = column;
            state.tableSortDirection = 'asc';
        }

        // Re-render table with sorted data
        updateTable(filterBySelectedRtw(state.processedData));
    });
});

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * INITIALISIERT DAS DASHBOARD
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Hauptfunktion die beim Laden der Seite ausgeführt wird
 * - Validiert dass alle benötigten Ressourcen verfügbar sind
 * - Lädt initiale Daten vom Server
 * - Startet Auto-Refresh Timer
 * - Registriert Event-Listener
 *
 * SICHERHEITSMASSNAHMEN:
 * - Validiert esriRequest ist verfügbar (verhindert Crashes)
 * - Prüft alle kritischen DOM-Elemente
 * - Try-Catch für robuste Fehlerbehandlung
 * - Zeigt Benutzer-freundliche Fehlermeldungen
 *
 * VALIDIERUNGEN:
 * 1. esriRequest API verfügbar?
 * 2. Alle kritischen DOM-Elemente vorhanden?
 * 3. localStorage funktioniert?
 *
 * ABLAUF:
 * 1. Validiere Abhängigkeiten
 * 2. Lade Chart-Einstellungen aus localStorage
 * 3. Registriere Event-Listener
 * 4. Lade erste Daten
 * 5. Starte Auto-Refresh
 *
 * @throws {Error} Falls kritische Komponenten fehlen
 */
async function init() {
    try {
        console.log('RTW Hilfsfrist Dashboard V7.1 (Standalone) - Production');
        console.log('Features:');
        console.log('✅ Granulare Histogramme (10s bzw. 1min Schritte)');
        console.log('✅ Kompaktes Datumsformat (DD.MM HH:mm)');
        console.log('✅ Neuer Zeitfilter: Aktuelle Schicht (07:00-07:00)');
        console.log('✅ Anfahrtszeit-Schwellenwert auf 5 Minuten');
        console.log('✅ Keine Build-Tools - läuft direkt vom Dateisystem');
        console.log('');

        // ========================================================================
        // VALIDIERUNG 1: esriRequest verfügbar?
        // ========================================================================
        if (typeof esriRequest === 'undefined') {
            throw new Error('esriRequest ist nicht verfügbar. ArcGIS API nicht geladen?');
        }
        console.log('✅ esriRequest verfügbar');

        // ========================================================================
        // VALIDIERUNG 2: Kritische DOM-Elemente vorhanden?
        // ========================================================================
        const criticalElements = [
            'refreshBtn',
            'exportBtn',
            'timeFilter',
            'rtwPickerToggle',
            'tableBody',
            'tableToggleHeader',
            'tableToggleIcon',
            'tableContent'
        ];

        const missingElements = [];
        criticalElements.forEach(function(id) {
            const element = document.getElementById(id);
            if (!element) {
                missingElements.push(id);
            }
        });

        if (missingElements.length > 0) {
            throw new Error('Kritische DOM-Elemente fehlen: ' + missingElements.join(', '));
        }
        console.log('✅ Alle kritischen DOM-Elemente vorhanden');

        // ========================================================================
        // Chart Visibility aus localStorage laden
        // ========================================================================
        const savedVisibility = localStorage.getItem('rtwDashboardChartVisibility');
        if (savedVisibility) {
            try {
                state.chartVisibility = JSON.parse(savedVisibility);
                console.log('✅ Chart-Einstellungen aus localStorage geladen');
            } catch (e) {
                console.warn('⚠️ Fehler beim Laden der Chart-Visibility:', e);
            }
        }

        // ========================================================================
        // Toggle-Funktion für Tabelle
        // ========================================================================
        const tableToggleHeader = document.getElementById('tableToggleHeader');
        const tableToggleIcon = document.getElementById('tableToggleIcon');
        const tableContent = document.getElementById('tableContent');

        if (tableToggleHeader && tableToggleIcon && tableContent) {
            tableToggleHeader.addEventListener('click', function() {
                if (tableContent.style.display === 'none') {
                    tableContent.style.display = 'block';
                    tableToggleIcon.classList.add('expanded');
                    tableToggleIcon.textContent = '▼';
                } else {
                    tableContent.style.display = 'none';
                    tableToggleIcon.classList.remove('expanded');
                    tableToggleIcon.textContent = '▶';
                }
            });
            console.log('✅ Tabellen-Toggle registriert');
        }

        // ========================================================================
        // Initiale Daten laden
        // ========================================================================
        console.log('📊 Lade initiale Daten...');
        await fetchData();

        // ========================================================================
        // Auto-Refresh starten
        // ========================================================================
        startAutoRefresh();

        console.log('✅ Dashboard erfolgreich initialisiert!');

    } catch (error) {
        // FEHLERBEHANDLUNG: Zeige benutzerfreundliche Fehlermeldung
        console.error('❌ KRITISCHER FEHLER bei Initialisierung:', error);

        // Versuche Fehlermeldung im UI anzuzeigen
        const errorHTML = '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
            'background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); ' +
            'max-width: 500px; text-align: center; z-index: 10000;">' +
            '<div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>' +
            '<h2 style="color: #d32f2f; margin-bottom: 16px;">Initialisierungsfehler</h2>' +
            '<p style="color: #666; margin-bottom: 20px;">Das Dashboard konnte nicht geladen werden.</p>' +
            '<p style="font-family: monospace; background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 12px;">' +
            error.message + '</p>' +
            '<p style="color: #999; font-size: 12px; margin-top: 20px;">Bitte Konsole prüfen (F12) für Details.</p>' +
            '</div>';

        document.body.innerHTML = errorHTML;
    }
}

// NOTE: init() is called from index.html AMD wrapper after esriRequest is available
// Do NOT call init() here - it will cause "esriRequest is not defined" error

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

function updateDashboard() {
    const data = filterBySelectedRtw(state.processedData);

    updateKPIs(data);
    updateCharts(data);
    updateTable(data);
}

// ============================================================================
// AUTO-REFRESH
// ============================================================================

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

async function init() {
    console.log('RTW Hilfsfrist Dashboard V7.1 (Standalone) - Production');
    console.log('Features:');
    console.log('✅ Granulare Histogramme (10s bzw. 1min Schritte)');
    console.log('✅ Kompaktes Datumsformat (DD.MM HH:mm)');
    console.log('✅ Neuer Zeitfilter: Aktuelle Schicht (07:00-07:00)');
    console.log('✅ Anfahrtszeit-Schwellenwert auf 5 Minuten');
    console.log('✅ Keine Build-Tools - läuft direkt vom Dateisystem');

    // Chart Visibility aus localStorage laden
    const savedVisibility = localStorage.getItem('rtwDashboardChartVisibility');
    if (savedVisibility) {
        try {
            state.chartVisibility = JSON.parse(savedVisibility);
        } catch (e) {
            console.warn('Fehler beim Laden der Chart-Visibility', e);
        }
    }

    // Toggle-Funktion für Tabelle
    const tableToggleHeader = document.getElementById('tableToggleHeader');
    const tableToggleIcon = document.getElementById('tableToggleIcon');
    const tableContent = document.getElementById('tableContent');

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

    await fetchData();
    startAutoRefresh();
}

// NOTE: init() is called from index.html AMD wrapper after esriRequest is available
// Do NOT call init() here - it will cause "esriRequest is not defined" error

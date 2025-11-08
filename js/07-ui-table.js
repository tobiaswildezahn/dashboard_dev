// ============================================================================
// FILE: js/07-ui-table.js
// Table Display, Sorting, and Updates
// Dependencies: state, formatTimestamp
// ============================================================================

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

        const einsatztyp = item.nameeventtype || 'N/A';

        const responseStatusText = responseStatus === 'success' ? '✓ OK' :
                                   responseStatus === 'danger' ? '✗ Nicht erreicht' : 'N/A';
        const travelStatusText = travelStatus === 'success' ? '✓ OK' :
                                 travelStatus === 'danger' ? '✗ Nicht erreicht' : 'N/A';
        const hilfsfristStatusText = hilfsfristStatus === 'success' ? '✓ Erreicht' :
                                     hilfsfristStatus === 'danger' ? '✗ Nicht erreicht' : 'N/A';

        const eventIdCell = item.idevent
            ? '<a href="#" class="event-id-link" onclick="openEventDetailsModal(' + item.idevent + '); return false;">' + item.idevent + '</a>'
            : 'N/A';

        return '<tr>' +
            '<td><strong>' + (item.call_sign || 'N/A') + '</strong></td>' +
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

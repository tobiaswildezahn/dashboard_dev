// ============================================================================
// FILE: js/09-ui-filters.js
// RTW Picker, Filters, and Export Functions
// Dependencies: state, formatTimestamp, showMessage, updateDashboard
// ============================================================================

// ============================================================================
// RTW PICKER
// ============================================================================

function extractUniqueRtw(data) {
    const rtwSet = new Set();
    data.forEach(function(item) {
        if (item.call_sign) {
            rtwSet.add(item.call_sign);
        }
    });
    return Array.from(rtwSet).sort();
}

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

function onRtwSelectionChange() {
    const checkboxes = document.querySelectorAll('#rtwCheckboxGrid input[type="checkbox"]');
    state.selectedRtwList = Array.from(checkboxes)
        .filter(function(cb) { return cb.checked; })
        .map(function(cb) { return cb.value; });

    updateRtwSelectedCount();
    updateDashboard();
}

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

function filterBySelectedRtw(data) {
    if (state.selectedRtwList.length === 0) {
        return data;
    }
    return data.filter(function(item) { return state.selectedRtwList.includes(item.call_sign); });
}

// ============================================================================
// EXPORT - MIT NAMEEVENTTYPE UND HILFSFRIST-RELEVANZ
// ============================================================================

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

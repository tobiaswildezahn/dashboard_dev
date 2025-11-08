// ============================================================================
// FILE: js/03-calculations.js
// Helper Functions, Calculations, and KPI Logic
// Dependencies: CONFIG (from 01-config.js)
// ============================================================================

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showMessage(message, type) {
    if (type === undefined) type = 'success';
    const toast = document.getElementById('messageToast');
    toast.textContent = message;
    toast.className = 'message-toast ' + type + ' active';

    setTimeout(function() {
        toast.classList.remove('active');
    }, 3000);
}

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

// Kompaktes Datum für Charts (DD.MM HH:mm)
function formatCompactTimestamp(timestamp) {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString('de-DE', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateLastUpdate() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent =
        now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Schicht-Zeiten berechnen (07:00-07:00)
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

// Konvertiert Date-Objekt zu SQL TIMESTAMP Format (UTC)
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

function isHilfsfristRelevant(nameeventtype) {
    if (!nameeventtype) return true;
    return !nameeventtype.endsWith('-NF');
}

// ============================================================================
// KPI CALCULATION
// ============================================================================

// Berechnet das Perzentil
function calculatePercentile(values, percentile) {
    if (values.length === 0) return null;
    const sorted = values.slice().sort(function(a, b) { return a - b; });
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

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

// Ampelschema-Status
function getThresholdStatus(percentage) {
    if (percentage >= 90) return { status: 'green', emoji: '🟢', text: 'Exzellent (≥90%)' };
    if (percentage >= 75) return { status: 'yellow', emoji: '🟡', text: 'Akzeptabel (75-89%)' };
    return { status: 'red', emoji: '🔴', text: 'Kritisch (<75%)' };
}

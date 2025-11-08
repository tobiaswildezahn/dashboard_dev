// ============================================================================
// FILE: js/02-state.js
// State Management
// ============================================================================

const state = {
    processedData: [],
    selectedRtwList: [],
    autoRefreshTimer: null,
    chartVisibility: {
        hilfsfrist: true,
        response: true,
        travel: true
    },
    tableSortColumn: 'time_alarm',
    tableSortDirection: 'desc'
};

// Charts
state.lineChart = null;
state.barChart = null;
state.pieChart = null;
state.heatmapChart = null;

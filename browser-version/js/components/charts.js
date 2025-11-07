/**
 * Charts Komponente - Chart.js Visualisierungen
 */

import { DOM_IDS, CHART_COLORS, STORAGE_KEYS, RESPONSE_TIME_BINS, TRAVEL_TIME_BINS } from '../utils/constants.js';
import {
  aggregateHourlyStats,
  createResponseTimeBins,
  createTravelTimeBins
} from '../services/data-processor.service.js';
import { formatCompactTimestamp } from '../utils/helpers.js';

// State
let lineChart = null;
let barChart = null;
let pieChart = null;

let chartVisibility = {
  hilfsfrist: true,
  response: true,
  travel: true
};

// Initialization
export function loadChartVisibilityFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEYS.CHART_VISIBILITY);
  if (saved) {
    try {
      chartVisibility = JSON.parse(saved);
    } catch (e) {
      console.warn('Fehler beim Laden der Chart-Visibility', e);
    }
  }
}

function saveChartVisibility() {
  localStorage.setItem(STORAGE_KEYS.CHART_VISIBILITY, JSON.stringify(chartVisibility));
}

// Line Chart
export function updateLineChart(data) {
  const hourlyStatsMap = aggregateHourlyStats(data);
  const sortedHours = Array.from(hourlyStatsMap.keys()).sort();

  const labels = sortedHours.map(h => formatCompactTimestamp(h + ':00:00Z'));

  const hilfsfristPercentages = sortedHours.map(h => {
    const stats = hourlyStatsMap.get(h);
    return stats.total > 0 ? (stats.hilfsfristAchieved / stats.total * 100) : 0;
  });

  const responsePercentages = sortedHours.map(h => {
    const stats = hourlyStatsMap.get(h);
    return stats.total > 0 ? (stats.responseAchieved / stats.total * 100) : 0;
  });

  const travelPercentages = sortedHours.map(h => {
    const stats = hourlyStatsMap.get(h);
    return stats.total > 0 ? (stats.travelAchieved / stats.total * 100) : 0;
  });

  if (lineChart) {
    lineChart.destroy();
  }

  const ctx = document.getElementById(DOM_IDS.LINE_CHART);
  if (!ctx) return;

  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Hilfsfrist (Gesamt)',
          data: hilfsfristPercentages,
          borderColor: CHART_COLORS.primary,
          backgroundColor: CHART_COLORS.primaryAlpha,
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: CHART_COLORS.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          hidden: !chartVisibility.hilfsfrist
        },
        {
          label: 'Ausrückezeit',
          data: responsePercentages,
          borderColor: CHART_COLORS.info,
          backgroundColor: CHART_COLORS.infoAlpha,
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: CHART_COLORS.info,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          hidden: !chartVisibility.response
        },
        {
          label: 'Anfahrtszeit',
          data: travelPercentages,
          borderColor: CHART_COLORS.warning,
          backgroundColor: CHART_COLORS.warningAlpha,
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: CHART_COLORS.warning,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          hidden: !chartVisibility.travel
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          onClick: function(e, legendItem, legend) {
            const index = legendItem.datasetIndex;
            if (index === undefined) return;

            const chart = legend.chart;
            const meta = chart.getDatasetMeta(index);

            meta.hidden = !meta.hidden;

            if (index === 0) chartVisibility.hilfsfrist = !meta.hidden;
            if (index === 1) chartVisibility.response = !meta.hidden;
            if (index === 2) chartVisibility.travel = !meta.hidden;

            saveChartVisibility();
            chart.update();
          },
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        title: {
          display: true,
          text: 'Zeitliche Entwicklung - Multi-KPI',
          font: { size: 16, weight: 'bold' }
        },
        subtitle: {
          display: true,
          text: 'Nur hilfsfristrelevante Einsätze | Klicken Sie auf die Legende zum Ein-/Ausblenden',
          font: { size: 11 },
          color: '#666'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y ?? 0;
              return `${context.dataset.label}: ${value.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            },
            font: { size: 11 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: { size: 9 },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Bar Chart
export function updateBarChart(data) {
  const responseBins = createResponseTimeBins(data);
  const travelBins = createTravelTimeBins(data);

  const labels = [...RESPONSE_TIME_BINS, ...TRAVEL_TIME_BINS];

  if (barChart) {
    barChart.destroy();
  }

  const ctx = document.getElementById(DOM_IDS.BAR_CHART);
  if (!ctx) return;

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Ausrückezeit',
          data: [
            ...Object.values(responseBins),
            ...Array(TRAVEL_TIME_BINS.length).fill(0)
          ],
          backgroundColor: CHART_COLORS.infoAlpha,
          borderColor: CHART_COLORS.info,
          borderWidth: 2
        },
        {
          label: 'Anfahrtszeit',
          data: [
            ...Array(RESPONSE_TIME_BINS.length).fill(0),
            ...Object.values(travelBins)
          ],
          backgroundColor: CHART_COLORS.warningAlpha,
          borderColor: CHART_COLORS.warning,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Zeitverteilung (granular)',
          font: { size: 16, weight: 'bold' }
        },
        subtitle: {
          display: true,
          text: 'Nur hilfsfristrelevante Einsätze | 10s bzw. 1min Schritte',
          font: { size: 11 },
          color: '#666'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: { size: 10 },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Pie Chart
export function updatePieChart(data) {
  const relevantData = data.filter(d => d.isHilfsfristRelevant);
  const valid = relevantData.filter(d => d.hilfsfristAchieved !== null);
  const achieved = valid.filter(d => d.hilfsfristAchieved).length;
  const notAchieved = valid.length - achieved;

  if (pieChart) {
    pieChart.destroy();
  }

  const ctx = document.getElementById(DOM_IDS.PIE_CHART);
  if (!ctx) return;

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Erreicht', 'Nicht erreicht'],
      datasets: [
        {
          data: [achieved, notAchieved],
          backgroundColor: [CHART_COLORS.success, CHART_COLORS.danger],
          borderColor: [CHART_COLORS.success, CHART_COLORS.danger],
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Hilfsfrist Erfüllung',
          font: { size: 16, weight: 'bold' }
        },
        subtitle: {
          display: true,
          text: 'Nur hilfsfristrelevante Einsätze',
          font: { size: 12 },
          color: '#666'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = achieved + notAchieved;
              const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Public API
export function updateAllCharts(data) {
  updateLineChart(data);
  updateBarChart(data);
  updatePieChart(data);
}

export function destroyAllCharts() {
  if (lineChart) {
    lineChart.destroy();
    lineChart = null;
  }
  if (barChart) {
    barChart.destroy();
    barChart = null;
  }
  if (pieChart) {
    pieChart.destroy();
    pieChart = null;
  }
}

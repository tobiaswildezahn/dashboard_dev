// ============================================================================
// FILE: js/06-ui-charts.js
// Chart Updates and Rendering
// Dependencies: state, formatCompactTimestamp, showMessage
// Requires: Chart.js library
// ============================================================================

function updateCharts(data) {
    updateLineChart(data);
    updateBarChart(data);
    updatePieChart(data);
    updateHeatmap(data);
    updateReturnTimeHistogram(data);
}

// ============================================================================
// LINE CHART - MULTI-KPI mit kompaktem Datumsformat
// ============================================================================

function updateLineChart(data) {
    const relevantData = data.filter(function(d) { return d.isHilfsfristRelevant; });

    const hourlyStats = {};
    relevantData.forEach(function(item) {
        const hour = new Date(item.time_alarm).toISOString().substring(0, 13);
        if (!hourlyStats[hour]) {
            hourlyStats[hour] = {
                total: 0,
                hilfsfristAchieved: 0,
                responseAchieved: 0,
                travelAchieved: 0
            };
        }
        hourlyStats[hour].total++;
        if (item.hilfsfristAchieved) hourlyStats[hour].hilfsfristAchieved++;
        if (item.responseAchieved) hourlyStats[hour].responseAchieved++;
        if (item.travelAchieved) hourlyStats[hour].travelAchieved++;
    });

    const sortedHours = Object.keys(hourlyStats).sort();

    // Kompakte Labels (DD.MM HH:mm)
    const labels = sortedHours.map(function(h) { return formatCompactTimestamp(h + ':00:00Z'); });

    const hilfsfristPercentages = sortedHours.map(function(h) {
        const stats = hourlyStats[h];
        return stats.total > 0 ? (stats.hilfsfristAchieved / stats.total * 100) : 0;
    });

    const responsePercentages = sortedHours.map(function(h) {
        const stats = hourlyStats[h];
        return stats.total > 0 ? (stats.responseAchieved / stats.total * 100) : 0;
    });

    const travelPercentages = sortedHours.map(function(h) {
        const stats = hourlyStats[h];
        return stats.total > 0 ? (stats.travelAchieved / stats.total * 100) : 0;
    });

    if (state.lineChart) {
        state.lineChart.destroy();
    }

    const ctx = document.getElementById('lineChart').getContext('2d');
    state.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Hilfsfrist (Gesamt)',
                    data: hilfsfristPercentages,
                    borderColor: 'rgb(200, 16, 46)',
                    backgroundColor: 'rgba(200, 16, 46, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgb(200, 16, 46)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    hidden: !state.chartVisibility.hilfsfrist
                },
                {
                    label: 'Ausrückezeit',
                    data: responsePercentages,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    hidden: !state.chartVisibility.response
                },
                {
                    label: 'Anfahrtszeit',
                    data: travelPercentages,
                    borderColor: 'rgb(245, 158, 11)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: 'rgb(245, 158, 11)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    hidden: !state.chartVisibility.travel
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
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(index);

                        meta.hidden = !meta.hidden;

                        if (index === 0) state.chartVisibility.hilfsfrist = !meta.hidden;
                        if (index === 1) state.chartVisibility.response = !meta.hidden;
                        if (index === 2) state.chartVisibility.travel = !meta.hidden;

                        localStorage.setItem('rtwDashboardChartVisibility',
                            JSON.stringify(state.chartVisibility));

                        chart.update();
                    },
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
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
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
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
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 9
                        },
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

// ============================================================================
// BAR CHART - Granulare Bins (10s / 1min)
// ============================================================================

function updateBarChart(data) {
    const relevantData = data.filter(function(d) { return d.isHilfsfristRelevant; });

    const responseValid = relevantData.filter(function(d) { return d.responseTime !== null; });
    const travelValid = relevantData.filter(function(d) { return d.travelTime !== null; });

    // Granulare 10-Sekunden-Bins für Ausrückezeit
    const responseBins = {
        '0-10s': 0, '10-20s': 0, '20-30s': 0, '30-40s': 0, '40-50s': 0,
        '50-60s': 0, '60-70s': 0, '70-80s': 0, '80-90s': 0, '>90s': 0
    };

    responseValid.forEach(function(item) {
        const t = item.responseTime;
        if (t <= 10) responseBins['0-10s']++;
        else if (t <= 20) responseBins['10-20s']++;
        else if (t <= 30) responseBins['20-30s']++;
        else if (t <= 40) responseBins['30-40s']++;
        else if (t <= 50) responseBins['40-50s']++;
        else if (t <= 60) responseBins['50-60s']++;
        else if (t <= 70) responseBins['60-70s']++;
        else if (t <= 80) responseBins['70-80s']++;
        else if (t <= 90) responseBins['80-90s']++;
        else responseBins['>90s']++;
    });

    // Granulare 1-Minuten-Bins für Anfahrtszeit (bis 5 Minuten)
    const travelBins = {
        '0-1min': 0, '1-2min': 0, '2-3min': 0, '3-4min': 0,
        '4-5min': 0, '>5min': 0
    };

    travelValid.forEach(function(item) {
        const t = item.travelTime;
        if (t <= 60) travelBins['0-1min']++;
        else if (t <= 120) travelBins['1-2min']++;
        else if (t <= 180) travelBins['2-3min']++;
        else if (t <= 240) travelBins['3-4min']++;
        else if (t <= 300) travelBins['4-5min']++;
        else travelBins['>5min']++;
    });

    if (state.barChart) {
        state.barChart.destroy();
    }

    const ctx = document.getElementById('barChart').getContext('2d');

    // Labels: Alle Bins kombiniert
    const responseLabels = Object.keys(responseBins);
    const travelLabels = Object.keys(travelBins);
    const allLabels = responseLabels.concat(travelLabels);

    // Create arrays filled with zeros
    const responseData = Object.values(responseBins).concat(Array(travelLabels.length).fill(0));
    const travelData = Array(responseLabels.length).fill(0).concat(Object.values(travelBins));

    state.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allLabels,
            datasets: [{
                label: 'Ausrückezeit',
                data: responseData,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2
            }, {
                label: 'Anfahrtszeit',
                data: travelData,
                backgroundColor: 'rgba(245, 158, 11, 0.7)',
                borderColor: 'rgb(245, 158, 11)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const label = allLabels[index];
                    showMessage('📊 Klick auf: ' + label + ' - Filter-Funktion geplant', 'info');
                }
            },
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
                    text: 'Nur hilfsfristrelevante Einsätze | 10s bzw. 1min Schritte | Klickbar',
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

// ============================================================================
// PIE CHART - HILFSFRIST ERFÜLLUNG
// ============================================================================

function updatePieChart(data) {
    const relevantData = data.filter(function(d) { return d.isHilfsfristRelevant; });
    const valid = relevantData.filter(function(d) { return d.hilfsfristAchieved !== null; });
    const achieved = valid.filter(function(d) { return d.hilfsfristAchieved; }).length;
    const notAchieved = valid.length - achieved;

    if (state.pieChart) {
        state.pieChart.destroy();
    }

    const ctx = document.getElementById('pieChart').getContext('2d');
    state.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Erreicht', 'Nicht erreicht'],
            datasets: [{
                data: [achieved, notAchieved],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgb(16, 185, 129)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 2
            }]
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
                            const percentage = total > 0 ? (context.parsed / total * 100).toFixed(1) : 0;
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// ============================================================================
// HEATMAP - Tagesverlauf Performance
// ============================================================================

function updateHeatmap(data) {
    const relevantData = data.filter(function(d) { return d.isHilfsfristRelevant && d.time_alarm; });

    // Aggregiere Daten nach Stunden (0-23)
    const hourlyData = Array(24).fill(0).map(function() {
        return {
            total: 0,
            achieved: 0
        };
    });

    relevantData.forEach(function(item) {
        const alarmDate = new Date(item.time_alarm);
        const hour = alarmDate.getHours();

        if (item.hilfsfristAchieved !== null) {
            hourlyData[hour].total++;
            if (item.hilfsfristAchieved) {
                hourlyData[hour].achieved++;
            }
        }
    });

    // Berechne Erfüllungsgrad pro Stunde
    const percentages = hourlyData.map(function(h) {
        return h.total > 0 ? (h.achieved / h.total * 100).toFixed(1) : null;
    });

    const labels = Array.from({length: 24}, function(_, i) {
        return String(i).padStart(2, '0') + ':00';
    });

    // Farb-Mapping basierend auf Erfüllungsgrad
    const backgroundColors = percentages.map(function(p) {
        if (p === null) return 'rgba(200, 200, 200, 0.3)';
        if (p >= 90) return 'rgba(16, 185, 129, 0.8)'; // Grün
        if (p >= 75) return 'rgba(245, 158, 11, 0.8)'; // Orange
        return 'rgba(239, 68, 68, 0.8)'; // Rot
    });

    if (state.heatmapChart) {
        state.heatmapChart.destroy();
    }

    const ctx = document.getElementById('heatmapChart').getContext('2d');
    state.heatmapChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hilfsfrist-Erfüllung (%)',
                data: percentages.map(function(p) { return p !== null ? parseFloat(p) : 0; }),
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(function(c) { return c.replace('0.8', '1'); }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: '🕐 Tagesverlauf: Hilfsfrist-Erfüllung pro Stunde',
                    font: { size: 16, weight: 'bold' }
                },
                subtitle: {
                    display: true,
                    text: 'Grün: ≥90% | Orange: 75-90% | Rot: <75% | Grau: Keine Daten',
                    font: { size: 11 },
                    color: '#666'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const hour = context.label;
                            const hourIndex = parseInt(hour.split(':')[0]);
                            const data = hourlyData[hourIndex];
                            if (data.total === 0) return 'Keine Einsätze';
                            const percentage = (data.achieved / data.total * 100).toFixed(1);
                            return [
                                'Erfüllungsgrad: ' + percentage + '%',
                                'Erreicht: ' + data.achieved + '/' + data.total
                            ];
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
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 10 },
                        maxRotation: 0,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================================================
// RÜCKFAHRTZEIT HISTOGRAMM - mit Mittelwert, Median und Perzentilen
// ============================================================================

function updateReturnTimeHistogram(data) {
    // Hole Histogram-Daten und KPIs
    const histData = calculateReturnTimeHistogramData(data);
    const kpis = calculateReturnTimeKPIs(data);

    // Zerstöre existierenden Chart falls vorhanden
    if (state.returnTimeChart) {
        state.returnTimeChart.destroy();
    }

    const canvas = document.getElementById('returnTimeHistogramChart');
    if (!canvas) {
        console.warn('Canvas für Rückfahrtzeit-Histogramm nicht gefunden');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Konvertiere Statistiken zu Minuten für Anzeige
    const meanMinutes = kpis.mean !== null ? kpis.mean / 60 : null;
    const medianMinutes = kpis.median !== null ? kpis.median / 60 : null;
    const p25Minutes = kpis.percentile25 !== null ? kpis.percentile25 / 60 : null;
    const p75Minutes = kpis.percentile75 !== null ? kpis.percentile75 / 60 : null;

    state.returnTimeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: histData.labels,
            datasets: [{
                label: 'Anzahl Einsätze',
                data: histData.counts,
                backgroundColor: 'rgba(139, 92, 246, 0.7)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Rückfahrtzeit-Verteilung (Alle Einsätze)',
                    font: { size: 16, weight: 'bold' }
                },
                subtitle: {
                    display: true,
                    text: 'Statistik: ' +
                        (meanMinutes !== null ? 'Ø ' + meanMinutes.toFixed(1) + ' min | ' : '') +
                        (medianMinutes !== null ? 'Median ' + medianMinutes.toFixed(1) + ' min | ' : '') +
                        (p25Minutes !== null ? 'P25 ' + p25Minutes.toFixed(1) + ' min | ' : '') +
                        (p75Minutes !== null ? 'P75 ' + p75Minutes.toFixed(1) + ' min' : ''),
                    font: { size: 12 },
                    color: '#666',
                    padding: { bottom: 10 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const count = context.parsed.y;
                            const total = histData.counts.reduce(function(sum, val) { return sum + val; }, 0);
                            const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
                            return 'Anzahl: ' + count + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Anzahl Einsätze',
                        font: { size: 12 }
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
                    },
                    title: {
                        display: true,
                        text: 'Rückfahrtzeit',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

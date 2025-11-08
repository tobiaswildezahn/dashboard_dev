// ============================================================================
// INSIGHTS GENERATION - V8.0 Smart Insights
// ============================================================================
// Haupt-Controller für Insight-Generierung
// Orchestriert Anomalie-Erkennung und Pattern-Detection
// Erstellt strukturierte, priorisierte Insights
// ============================================================================

/**
 * GENERIERT ALLE INSIGHTS FÜR DASHBOARD
 *
 * Haupt-Funktion die alle Erkennungs-Algorithmen ausführt und
 * priorisierte Insights zurückgibt.
 *
 * PROZESS:
 * 1. RTW-Anomalien erkennen
 * 2. Revier-Anomalien erkennen
 * 3. Folge-Muster erkennen (Consecutive Events)
 * 4. Performance-Verschlechterung erkennen
 * 5. Problem-Reviere identifizieren
 * 6. Insights priorisieren (Critical → Warning → Info)
 * 7. Top N Insights zurückgeben
 *
 * @param {Array} data - Aktuelle gefilterte Einsatzdaten
 * @param {number} maxInsights - Maximale Anzahl anzuzeigender Insights (Standard: 10)
 * @returns {Object} { critical: [], warnings: [], info: [], all: [] }
 */
function generateInsights(data, maxInsights) {
    maxInsights = maxInsights || 10;

    const insights = {
        critical: [],
        warnings: [],
        info: [],
        all: []
    };

    if (!data || data.length === 0) {
        return insights;
    }

    // ========================================================================
    // 1. RTW-ANOMALIEN
    // ========================================================================

    // Extrahiere unique RTWs
    const rtwSet = new Set();
    data.forEach(function(item) {
        if (item.call_sign) {
            rtwSet.add(item.call_sign);
        }
    });

    const rtws = Array.from(rtwSet);

    rtws.forEach(function(rtwCallSign) {
        const anomalies = detectRtwAnomalies(rtwCallSign, data);

        anomalies.forEach(function(anomaly) {
            const insight = {
                id: 'rtw_' + rtwCallSign + '_' + anomaly.type,
                category: 'rtw_anomaly',
                type: anomaly.type,
                severity: anomaly.severity,
                rtwCallSign: rtwCallSign,
                title: formatRtwAnomalyTitle(anomaly),
                message: formatRtwAnomalyMessage(anomaly),
                details: anomaly,
                actionable: true,
                action: {
                    type: 'filter_rtw',
                    value: rtwCallSign
                }
            };

            insights.all.push(insight);

            if (anomaly.severity === 'critical') {
                insights.critical.push(insight);
            } else {
                insights.warnings.push(insight);
            }
        });
    });

    // ========================================================================
    // 2. REVIER-ANOMALIEN
    // ========================================================================

    const revierSet = new Set();
    data.forEach(function(item) {
        if (item.revier_bf_ab_2018) {
            revierSet.add(item.revier_bf_ab_2018);
        }
    });

    const reviere = Array.from(revierSet);

    reviere.forEach(function(revier) {
        const anomalies = detectRevierAnomalies(revier, data);

        anomalies.forEach(function(anomaly) {
            const insight = {
                id: 'revier_' + revier + '_' + anomaly.type,
                category: 'revier_anomaly',
                type: anomaly.type,
                severity: anomaly.severity,
                revier: revier,
                title: formatRevierAnomalyTitle(anomaly),
                message: formatRevierAnomalyMessage(anomaly),
                details: anomaly,
                actionable: false // Noch kein Filter für Revier implementiert
            };

            insights.all.push(insight);

            if (anomaly.severity === 'critical') {
                insights.critical.push(insight);
            } else {
                insights.warnings.push(insight);
            }
        });
    });

    // ========================================================================
    // 3. CONSECUTIVE MISSED HILFSFRIST
    // ========================================================================

    const consecutiveMissed = detectConsecutiveMissedHilfsfrist(data);

    consecutiveMissed.forEach(function(result) {
        const maxSequence = result.sequences.reduce(function(max, seq) {
            return seq.count > max.count ? seq : max;
        }, result.sequences[0]);

        const insight = {
            id: 'consecutive_' + result.rtwCallSign,
            category: 'pattern',
            type: 'consecutive_missed_hilfsfrist',
            severity: result.severity,
            rtwCallSign: result.rtwCallSign,
            title: '🔄 ' + result.rtwCallSign + ': ' + maxSequence.count + ' verpasste Hilfsfristen in Folge',
            message: 'Zwischen ' + formatTimestamp(maxSequence.startTime) + ' und ' +
                     formatTimestamp(maxSequence.endTime) + ' wurden ' + maxSequence.count +
                     ' Einsätze nacheinander nicht hilfsfristgerecht erreicht.',
            details: result,
            actionable: true,
            action: {
                type: 'filter_rtw',
                value: result.rtwCallSign
            }
        };

        insights.all.push(insight);

        if (result.severity === 'critical') {
            insights.critical.push(insight);
        } else {
            insights.warnings.push(insight);
        }
    });

    // ========================================================================
    // 4. PERFORMANCE DEGRADATION
    // ========================================================================

    const degradation = detectPerformanceDegradation(
        data,
        24,   // Aktuell: Letzte 24h
        168   // Baseline: 7 Tage
    );

    if (degradation && degradation.isDegrading) {
        const messages = [];

        if (degradation.deltas.responseTime && degradation.deltas.responseTime.isDegrading) {
            messages.push('Ausrückezeit ' + degradation.deltas.responseTime.deltaPercent + '% schlechter');
        }

        if (degradation.deltas.travelTime && degradation.deltas.travelTime.isDegrading) {
            messages.push('Anfahrtszeit ' + degradation.deltas.travelTime.deltaPercent + '% schlechter');
        }

        if (degradation.deltas.hilfsfristQuote && degradation.deltas.hilfsfristQuote.isDegrading) {
            messages.push('Hilfsfrist-Quote ' + Math.abs(degradation.deltas.hilfsfristQuote.delta) + ' Prozentpunkte schlechter');
        }

        const insight = {
            id: 'degradation_24h',
            category: 'trend',
            type: 'performance_degradation',
            severity: degradation.severity,
            title: '📉 Performance verschlechtert sich (24h vs. 7-Tage-Durchschnitt)',
            message: messages.join(' • '),
            details: degradation,
            actionable: false
        };

        insights.all.push(insight);

        if (degradation.severity === 'critical') {
            insights.critical.push(insight);
        } else {
            insights.warnings.push(insight);
        }
    }

    // ========================================================================
    // 5. PROBLEM-REVIERE
    // ========================================================================

    const problemReviere = detectProblemReviere(data, 5);

    problemReviere.slice(0, 3).forEach(function(revier) { // Top 3
        const issueTexts = [];

        if (revier.issues.includes('travel_time')) {
            const delta = ((revier.avgTravelTime / revier.baselineTravelTime - 1) * 100).toFixed(0);
            issueTexts.push('Anfahrtszeit +' + delta + '%');
        }

        if (revier.issues.includes('hilfsfrist_quote')) {
            const delta = (revier.hilfsfristQuote - revier.baselineHilfsfristQuote).toFixed(0);
            issueTexts.push('Quote ' + delta + ' PP');
        }

        const insight = {
            id: 'problem_revier_' + revier.revier,
            category: 'revier_pattern',
            type: 'problem_revier',
            severity: revier.severity,
            revier: revier.revier,
            title: '🏙️ Problem-Revier: ' + revier.revier + ' (' + revier.count + ' Einsätze)',
            message: issueTexts.join(' • '),
            details: revier,
            actionable: false
        };

        insights.all.push(insight);

        if (revier.severity === 'critical') {
            insights.critical.push(insight);
        } else {
            insights.warnings.push(insight);
        }
    });

    // ========================================================================
    // 6. ZEIT-BASIERTE INSIGHTS (INFORMATIONAL)
    // ========================================================================

    const hourPatterns = detectTimePatterns(data, 'hour');

    // Finde problematischste Stunde
    let worstHour = null;
    let worstHilfsfrist = 100;

    hourPatterns.patterns.forEach(function(pattern) {
        if (pattern.count >= 5 && pattern.hilfsfristQuote !== null) {
            const quote = parseFloat(pattern.hilfsfristQuote);
            if (quote < worstHilfsfrist) {
                worstHilfsfrist = quote;
                worstHour = pattern;
            }
        }
    });

    if (worstHour && worstHilfsfrist < 75) {
        const insight = {
            id: 'time_pattern_hour',
            category: 'time_pattern',
            type: 'problematic_hour',
            severity: 'info',
            title: '⏰ Problematische Tageszeit: ' + worstHour.label + ' Uhr',
            message: 'Hilfsfrist-Quote nur ' + worstHour.hilfsfristQuote + '% (' +
                     worstHour.count + ' Einsätze). Durchschnitt: ' +
                     calculateOverallHilfsfristQuote(data).toFixed(1) + '%',
            details: worstHour,
            actionable: false
        };

        insights.all.push(insight);
        insights.info.push(insight);
    }

    // ========================================================================
    // 7. SORTIERUNG UND LIMITIERUNG
    // ========================================================================

    // Sortiere nach Severity: critical > warning > info
    insights.all.sort(function(a, b) {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Limitiere auf maxInsights
    if (insights.all.length > maxInsights) {
        insights.all = insights.all.slice(0, maxInsights);

        // Aktualisiere kategorisierte Arrays
        insights.critical = insights.all.filter(function(i) { return i.severity === 'critical'; });
        insights.warnings = insights.all.filter(function(i) { return i.severity === 'warning'; });
        insights.info = insights.all.filter(function(i) { return i.severity === 'info'; });
    }

    return insights;
}

// ============================================================================
// HELPER FUNCTIONS - FORMATIERUNG
// ============================================================================

/**
 * Formatiert RTW-Anomalie Titel
 */
function formatRtwAnomalyTitle(anomaly) {
    const icon = anomaly.severity === 'critical' ? '🔴' : '⚠️';
    let typeText = '';

    switch (anomaly.type) {
        case 'response_time':
            typeText = 'Ausrückezeit';
            break;
        case 'travel_time':
            typeText = 'Anfahrtszeit';
            break;
        case 'hilfsfrist_quote':
            typeText = 'Hilfsfrist-Quote';
            break;
        default:
            typeText = anomaly.type;
    }

    return icon + ' ' + anomaly.rtwCallSign + ': ' + typeText + ' anomal';
}

/**
 * Formatiert RTW-Anomalie Message
 */
function formatRtwAnomalyMessage(anomaly) {
    if (anomaly.type === 'response_time' || anomaly.type === 'travel_time') {
        return anomaly.value + 's (Ø ' + anomaly.baseline + 's) • ' +
               anomaly.message + ' • Z-Score: ' + anomaly.zScore;
    } else if (anomaly.type === 'hilfsfrist_quote') {
        return anomaly.value + '% (Ø ' + anomaly.baseline + '%) • ' + anomaly.message;
    }

    return anomaly.message;
}

/**
 * Formatiert Revier-Anomalie Titel
 */
function formatRevierAnomalyTitle(anomaly) {
    const icon = anomaly.severity === 'critical' ? '🔴' : '⚠️';
    let typeText = '';

    switch (anomaly.type) {
        case 'einsatz_density':
            typeText = 'Einsatzdichte';
            break;
        case 'travel_time':
            typeText = 'Anfahrtszeit';
            break;
        case 'hilfsfrist_quote':
            typeText = 'Hilfsfrist-Quote';
            break;
        default:
            typeText = anomaly.type;
    }

    return icon + ' Revier ' + anomaly.revier + ': ' + typeText + ' anomal';
}

/**
 * Formatiert Revier-Anomalie Message
 */
function formatRevierAnomalyMessage(anomaly) {
    if (anomaly.type === 'einsatz_density') {
        return anomaly.value + ' Einsätze (Ø ' + anomaly.baseline + ') • ' + anomaly.message;
    } else if (anomaly.type === 'travel_time') {
        return anomaly.value + 's (Ø ' + anomaly.baseline + 's) • ' + anomaly.message;
    } else if (anomaly.type === 'hilfsfrist_quote') {
        return anomaly.value + '% (Ø ' + anomaly.baseline + '%) • ' + anomaly.message;
    }

    return anomaly.message;
}

/**
 * Berechnet Gesamt-Hilfsfrist-Quote
 */
function calculateOverallHilfsfristQuote(data) {
    const met = data.filter(function(item) { return item.hilfsfrist_met === true; }).length;
    return data.length > 0 ? (met / data.length * 100) : 0;
}

/**
 * UPDATE INSIGHTS IM DASHBOARD
 *
 * Wird von updateDashboard() aufgerufen.
 * Generiert und rendert Insights basierend auf aktuellen Daten.
 */
function updateInsights() {
    const insights = generateInsights(state.processedData, 10);

    // Rendere UI (siehe js/14-ui-insights.js)
    renderInsightsPanel(insights);
}

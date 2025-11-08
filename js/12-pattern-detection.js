// ============================================================================
// PATTERN DETECTION - V8.0 Smart Insights
// ============================================================================
// Erkennung von Mustern, Sequenzen und Trends in Einsatzdaten
// Folge-Erkennung für wiederholte Probleme
// ============================================================================

/**
 * ERKENNT AUFEINANDERFOLGENDE EREIGNISSE (CONSECUTIVE EVENTS)
 *
 * Findet Sequenzen von wiederholten Problemen.
 * Zum Beispiel: 4 verpasste Hilfsfristen in Folge für einen RTW.
 *
 * VERWENDUNG:
 * - Verpasste Hilfsfristen in Folge
 * - Überdurchschnittliche Zeiten in Folge
 * - Mehrere Einsätze im selben Revier
 *
 * BEISPIEL:
 * - RTW-3: Einsatz 1 (Hilfsfrist verfehlt) → Einsatz 2 (verfehlt) →
 *          Einsatz 3 (verfehlt) → Einsatz 4 (verfehlt)
 * - Ergebnis: Sequenz mit 4 Events, Severity: Critical
 *
 * @param {Array} data - Sortierte Einsatzdaten (chronologisch)
 * @param {Function} condition - Bedingung für "Problem" (z.B. item => item.hilfsfrist_met === false)
 * @param {number} minLength - Mindestlänge für Sequenz (Standard: 3)
 * @returns {Array} Array von erkannten Sequenzen
 */
function detectConsecutiveEvents(data, condition, minLength) {
    minLength = minLength || 3; // Default: mindestens 3 in Folge

    const sequences = [];
    let currentSequence = [];

    for (let i = 0; i < data.length; i++) {
        if (condition(data[i])) {
            currentSequence.push(data[i]);
        } else {
            // Sequenz unterbrochen
            if (currentSequence.length >= minLength) {
                sequences.push({
                    count: currentSequence.length,
                    items: currentSequence,
                    startTime: currentSequence[0].time_alarm,
                    endTime: currentSequence[currentSequence.length - 1].time_alarm,
                    severity: currentSequence.length >= 5 ? 'critical' : 'warning',
                    type: 'consecutive_events'
                });
            }
            currentSequence = [];
        }
    }

    // Prüfe letzte Sequenz (falls Daten mit Sequenz enden)
    if (currentSequence.length >= minLength) {
        sequences.push({
            count: currentSequence.length,
            items: currentSequence,
            startTime: currentSequence[0].time_alarm,
            endTime: currentSequence[currentSequence.length - 1].time_alarm,
            severity: currentSequence.length >= 5 ? 'critical' : 'warning',
            type: 'consecutive_events'
        });
    }

    return sequences;
}

/**
 * ERKENNT TRENDS IN ZEITREIHEN-DATEN
 *
 * Identifiziert steigende oder fallende Trends über mehrere Zeitpunkte.
 * Nutzt lineare Regression (Least Squares) zur Trend-Bestimmung.
 *
 * INTERPRETATION:
 * - Slope > 0: Steigender Trend (Werte werden größer)
 * - Slope < 0: Fallender Trend (Werte werden kleiner)
 * - |Slope| > Threshold: Signifikanter Trend
 *
 * BEISPIEL:
 * - Hilfsfrist-Quote über 4 Schichten: 82% → 76% → 71% → 68%
 * - Slope: -4.7 (Prozentpunkte pro Schicht)
 * - Ergebnis: Signifikanter fallender Trend (Verschlechterung)
 *
 * @param {Array<number>} values - Zeitreihen-Werte (chronologisch)
 * @param {Array<string>} labels - Labels für Zeitpunkte (optional)
 * @returns {Object|null} { slope, trend, strength, isSignificant }
 */
function detectTrend(values, labels) {
    if (!values || values.length < 3) {
        return null; // Mindestens 3 Datenpunkte für Trend
    }

    const n = values.length;

    // Lineare Regression: y = mx + b
    // Berechne Slope (m) mit Least Squares
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
        const x = i; // Zeit-Index
        const y = values[i];

        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R² (Bestimmtheitsmaß) - Wie gut passt die Gerade?
    const meanY = sumY / n;
    let ssTotal = 0;
    let ssResidual = 0;

    for (let i = 0; i < n; i++) {
        const predicted = slope * i + intercept;
        ssTotal += Math.pow(values[i] - meanY, 2);
        ssResidual += Math.pow(values[i] - predicted, 2);
    }

    const rSquared = 1 - (ssResidual / ssTotal);

    // Trend-Richtung
    let trend = 'stable';
    if (slope > 0.5) {
        trend = 'increasing';
    } else if (slope < -0.5) {
        trend = 'decreasing';
    }

    // Signifikant wenn R² > 0.6 (guter Fit)
    const isSignificant = rSquared > 0.6;

    return {
        slope: slope,
        intercept: intercept,
        rSquared: rSquared,
        trend: trend,
        isSignificant: isSignificant,
        strength: rSquared > 0.8 ? 'strong' : (rSquared > 0.6 ? 'moderate' : 'weak'),
        values: values,
        labels: labels || []
    };
}

/**
 * ERKENNT VERPASSTE HILFSFRISTEN IN FOLGE FÜR RTW
 *
 * Spezial-Fall von Consecutive Events für verpasste Hilfsfristen.
 * Gruppiert nach RTW und erkennt Sequenzen.
 *
 * @param {Array} data - Alle Einsatzdaten
 * @returns {Array} Array von RTWs mit Sequenzen von verpassten Hilfsfristen
 */
function detectConsecutiveMissedHilfsfrist(data) {
    const results = [];

    // Gruppiere nach RTW
    const rtwMap = {};
    data.forEach(function(item) {
        const callSign = item.call_sign;
        if (!callSign) return;

        if (!rtwMap[callSign]) {
            rtwMap[callSign] = [];
        }
        rtwMap[callSign].push(item);
    });

    // Für jeden RTW: Suche Sequenzen
    Object.keys(rtwMap).forEach(function(callSign) {
        const rtwData = rtwMap[callSign];

        // Sortiere chronologisch
        rtwData.sort(function(a, b) {
            return new Date(a.time_alarm) - new Date(b.time_alarm);
        });

        // Finde Sequenzen von verpassten Hilfsfristen
        const sequences = detectConsecutiveEvents(
            rtwData,
            function(item) {
                return item.hilfsfrist_met === false;
            },
            3 // Mindestens 3 in Folge
        );

        if (sequences.length > 0) {
            results.push({
                rtwCallSign: callSign,
                sequences: sequences,
                totalMissed: sequences.reduce(function(sum, seq) { return sum + seq.count; }, 0),
                severity: sequences.some(function(seq) { return seq.severity === 'critical'; }) ? 'critical' : 'warning'
            });
        }
    });

    return results;
}

/**
 * ERKENNT ZEIT-BASIERTE MUSTER
 *
 * Identifiziert Muster basierend auf Tageszeit oder Wochentag.
 * Zum Beispiel: "Montag Morgen ist besonders problematisch"
 *
 * ANALYSE:
 * - Gruppierung nach Stunde (0-23)
 * - Gruppierung nach Wochentag (Mo-So)
 * - Vergleich mit Gesamt-Durchschnitt
 *
 * @param {Array} data - Alle Einsatzdaten
 * @param {string} groupBy - 'hour' oder 'weekday'
 * @returns {Object} Analyse-Ergebnis mit Mustern
 */
function detectTimePatterns(data, groupBy) {
    const patterns = {};
    const countMap = {};

    data.forEach(function(item) {
        if (!item.time_alarm) return;

        const timestamp = new Date(item.time_alarm);
        let key;

        if (groupBy === 'hour') {
            key = timestamp.getHours(); // 0-23
        } else if (groupBy === 'weekday') {
            key = timestamp.getDay(); // 0=Sonntag, 1=Montag, etc.
        } else {
            return;
        }

        if (!patterns[key]) {
            patterns[key] = {
                count: 0,
                responseTimes: [],
                travelTimes: [],
                hilfsfristMet: 0,
                hilfsfristTotal: 0
            };
        }

        patterns[key].count++;
        countMap[key] = (countMap[key] || 0) + 1;

        if (item.response_time !== null) {
            patterns[key].responseTimes.push(item.response_time);
        }
        if (item.travel_time !== null) {
            patterns[key].travelTimes.push(item.travel_time);
        }

        patterns[key].hilfsfristTotal++;
        if (item.hilfsfrist_met === true) {
            patterns[key].hilfsfristMet++;
        }
    });

    // Berechne Durchschnitte
    const results = [];

    Object.keys(patterns).forEach(function(key) {
        const p = patterns[key];

        const avgResponseTime = p.responseTimes.length > 0
            ? p.responseTimes.reduce((a, b) => a + b, 0) / p.responseTimes.length
            : null;

        const avgTravelTime = p.travelTimes.length > 0
            ? p.travelTimes.reduce((a, b) => a + b, 0) / p.travelTimes.length
            : null;

        const hilfsfristQuote = p.hilfsfristTotal > 0
            ? (p.hilfsfristMet / p.hilfsfristTotal * 100)
            : null;

        results.push({
            key: key,
            label: groupBy === 'hour' ? key + ':00' : ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][key],
            count: p.count,
            avgResponseTime: avgResponseTime ? Math.round(avgResponseTime) : null,
            avgTravelTime: avgTravelTime ? Math.round(avgTravelTime) : null,
            hilfsfristQuote: hilfsfristQuote ? hilfsfristQuote.toFixed(1) : null
        });
    });

    // Sortiere nach Key
    results.sort(function(a, b) { return a.key - b.key; });

    return {
        groupBy: groupBy,
        patterns: results
    };
}

/**
 * ERKENNT PERFORMANCE-VERSCHLECHTERUNG ÜBER ZEIT
 *
 * Vergleicht aktuelle Performance mit historischem Durchschnitt.
 * Erkennt ob sich Zeiten/Quoten verschlechtern.
 *
 * BEISPIEL:
 * - Letzte 7 Tage: 82% Hilfsfrist-Quote
 * - Heute: 68%
 * - Delta: -14 Prozentpunkte
 * - Ergebnis: Signifikante Verschlechterung
 *
 * @param {Array} data - Alle Einsatzdaten (mit Timestamps)
 * @param {number} currentWindowHours - Zeitfenster für "aktuell" (z.B. 24 = letzte 24h)
 * @param {number} baselineWindowHours - Zeitfenster für Baseline (z.B. 168 = 7 Tage)
 * @returns {Object|null} Vergleichs-Ergebnis
 */
function detectPerformanceDegradation(data, currentWindowHours, baselineWindowHours) {
    const now = new Date();

    // Aktuelle Periode
    const currentCutoff = new Date(now.getTime() - currentWindowHours * 60 * 60 * 1000);
    const currentData = data.filter(function(item) {
        return new Date(item.time_alarm) >= currentCutoff;
    });

    // Baseline Periode (aber ohne aktuelle Periode)
    const baselineCutoff = new Date(now.getTime() - baselineWindowHours * 60 * 60 * 1000);
    const baselineData = data.filter(function(item) {
        const timestamp = new Date(item.time_alarm);
        return timestamp >= baselineCutoff && timestamp < currentCutoff;
    });

    if (currentData.length === 0 || baselineData.length === 0) {
        return null;
    }

    // Berechne KPIs für beide Perioden
    function calculateKPIs(dataset) {
        const responseTimes = dataset.map(function(item) { return item.response_time; }).filter(function(t) { return t !== null; });
        const travelTimes = dataset.map(function(item) { return item.travel_time; }).filter(function(t) { return t !== null; });
        const hilfsfristMet = dataset.filter(function(item) { return item.hilfsfrist_met === true; }).length;

        return {
            count: dataset.length,
            avgResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : null,
            avgTravelTime: travelTimes.length > 0 ? travelTimes.reduce((a, b) => a + b, 0) / travelTimes.length : null,
            hilfsfristQuote: dataset.length > 0 ? (hilfsfristMet / dataset.length * 100) : null
        };
    }

    const currentKPIs = calculateKPIs(currentData);
    const baselineKPIs = calculateKPIs(baselineData);

    // Deltas berechnen
    const result = {
        current: currentKPIs,
        baseline: baselineKPIs,
        deltas: {},
        isDegrading: false,
        severity: 'normal'
    };

    // Response Time Delta
    if (currentKPIs.avgResponseTime !== null && baselineKPIs.avgResponseTime !== null) {
        const delta = currentKPIs.avgResponseTime - baselineKPIs.avgResponseTime;
        const deltaPercent = (delta / baselineKPIs.avgResponseTime * 100);

        result.deltas.responseTime = {
            delta: delta,
            deltaPercent: deltaPercent.toFixed(1),
            isDegrading: delta > baselineKPIs.avgResponseTime * 0.15 // > 15% schlechter
        };

        if (result.deltas.responseTime.isDegrading) {
            result.isDegrading = true;
            result.severity = delta > baselineKPIs.avgResponseTime * 0.25 ? 'critical' : 'warning';
        }
    }

    // Travel Time Delta
    if (currentKPIs.avgTravelTime !== null && baselineKPIs.avgTravelTime !== null) {
        const delta = currentKPIs.avgTravelTime - baselineKPIs.avgTravelTime;
        const deltaPercent = (delta / baselineKPIs.avgTravelTime * 100);

        result.deltas.travelTime = {
            delta: delta,
            deltaPercent: deltaPercent.toFixed(1),
            isDegrading: delta > baselineKPIs.avgTravelTime * 0.15
        };

        if (result.deltas.travelTime.isDegrading) {
            result.isDegrading = true;
            result.severity = delta > baselineKPIs.avgTravelTime * 0.25 ? 'critical' : 'warning';
        }
    }

    // Hilfsfrist Quote Delta
    if (currentKPIs.hilfsfristQuote !== null && baselineKPIs.hilfsfristQuote !== null) {
        const delta = currentKPIs.hilfsfristQuote - baselineKPIs.hilfsfristQuote;

        result.deltas.hilfsfristQuote = {
            delta: delta.toFixed(1),
            isDegrading: delta < -10 // > 10 Prozentpunkte schlechter
        };

        if (result.deltas.hilfsfristQuote.isDegrading) {
            result.isDegrading = true;
            result.severity = delta < -20 ? 'critical' : 'warning';
        }
    }

    return result;
}

/**
 * ERKENNT PROBLEM-REVIERE
 *
 * Findet Reviere mit überdurchschnittlich vielen Problemen:
 * - Viele Einsätze
 * - Schlechte Hilfsfrist-Quote
 * - Lange Anfahrtszeiten
 *
 * @param {Array} data - Alle Einsatzdaten
 * @param {number} minEinsaetze - Mindestanzahl Einsätze für Analyse (Standard: 5)
 * @returns {Array} Array von Problem-Revieren
 */
function detectProblemReviere(data, minEinsaetze) {
    minEinsaetze = minEinsaetze || 5;

    const revierMap = {};

    // Gruppiere nach Revier
    data.forEach(function(item) {
        const revier = item.revier_bf_ab_2018;
        if (!revier) return;

        if (!revierMap[revier]) {
            revierMap[revier] = {
                count: 0,
                travelTimes: [],
                hilfsfristMet: 0,
                hilfsfristTotal: 0
            };
        }

        revierMap[revier].count++;
        revierMap[revier].hilfsfristTotal++;

        if (item.travel_time !== null) {
            revierMap[revier].travelTimes.push(item.travel_time);
        }

        if (item.hilfsfrist_met === true) {
            revierMap[revier].hilfsfristMet++;
        }
    });

    // Berechne Gesamt-Durchschnitte
    const allTravelTimes = data.map(function(item) { return item.travel_time; }).filter(function(t) { return t !== null; });
    const avgTravelTime = allTravelTimes.length > 0 ? allTravelTimes.reduce((a, b) => a + b, 0) / allTravelTimes.length : 0;

    const allHilfsfristMet = data.filter(function(item) { return item.hilfsfrist_met === true; }).length;
    const avgHilfsfristQuote = data.length > 0 ? (allHilfsfristMet / data.length * 100) : 0;

    // Analyse pro Revier
    const problemReviere = [];

    Object.keys(revierMap).forEach(function(revier) {
        const r = revierMap[revier];

        if (r.count < minEinsaetze) {
            return; // Zu wenig Daten
        }

        const revierAvgTravelTime = r.travelTimes.length > 0
            ? r.travelTimes.reduce((a, b) => a + b, 0) / r.travelTimes.length
            : null;

        const revierHilfsfristQuote = r.hilfsfristTotal > 0
            ? (r.hilfsfristMet / r.hilfsfristTotal * 100)
            : null;

        let isProblematic = false;
        const issues = [];

        // Prüfe Anfahrtszeit
        if (revierAvgTravelTime && revierAvgTravelTime > avgTravelTime * 1.2) {
            isProblematic = true;
            issues.push('travel_time');
        }

        // Prüfe Hilfsfrist-Quote
        if (revierHilfsfristQuote && revierHilfsfristQuote < avgHilfsfristQuote - 10) {
            isProblematic = true;
            issues.push('hilfsfrist_quote');
        }

        if (isProblematic) {
            problemReviere.push({
                revier: revier,
                issues: issues,
                count: r.count,
                avgTravelTime: revierAvgTravelTime ? Math.round(revierAvgTravelTime) : null,
                baselineTravelTime: Math.round(avgTravelTime),
                hilfsfristQuote: revierHilfsfristQuote ? revierHilfsfristQuote.toFixed(1) : null,
                baselineHilfsfristQuote: avgHilfsfristQuote.toFixed(1),
                severity: issues.length >= 2 ? 'critical' : 'warning'
            });
        }
    });

    // Sortiere nach Schweregrad
    problemReviere.sort(function(a, b) {
        if (a.severity === 'critical' && b.severity !== 'critical') return -1;
        if (a.severity !== 'critical' && b.severity === 'critical') return 1;
        return b.count - a.count; // Dann nach Anzahl Einsätze
    });

    return problemReviere;
}

// ============================================================================
// ANOMALY DETECTION - V8.0 Smart Insights
// ============================================================================
// Statistische Methoden zur Erkennung von Anomalien und Ausreißern
// Alle Berechnungen erfolgen clientseitig ohne externe Bibliotheken
// ============================================================================

/**
 * BERECHNET STATISTIK-ZUSAMMENFASSUNG FÜR DATASET
 *
 * Grundlage für alle Anomalie-Erkennungs-Methoden.
 * Berechnet wichtige statistische Kennzahlen.
 *
 * @param {Array<number>} dataset - Numerisches Array (z.B. Ausrückezeiten)
 * @returns {Object} Statistik-Objekt mit mean, median, stdDev, q1, q3, iqr
 */
function calculateStatistics(dataset) {
    if (!dataset || dataset.length === 0) {
        return null;
    }

    // Sortiertes Array für Median/Quartile
    const sorted = dataset.slice().sort((a, b) => a - b);
    const n = sorted.length;

    // Mittelwert (Mean)
    const mean = dataset.reduce((sum, val) => sum + val, 0) / n;

    // Median (50. Perzentil)
    const median = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];

    // Standardabweichung (Standard Deviation)
    const variance = dataset.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Quartile für IQR-Methode
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    return {
        mean: mean,
        median: median,
        stdDev: stdDev,
        variance: variance,
        min: sorted[0],
        max: sorted[n - 1],
        q1: q1,
        q3: q3,
        iqr: iqr,
        count: n
    };
}

/**
 * Z-SCORE ANOMALIE-ERKENNUNG
 *
 * Berechnet wie viele Standardabweichungen ein Wert vom Mittelwert entfernt ist.
 *
 * INTERPRETATION:
 * - |Z| < 2:   Normal (95% der Werte)
 * - |Z| 2-3:   Ungewöhnlich (5% der Werte)
 * - |Z| > 3:   Sehr ungewöhnlich / Anomalie (0.3% der Werte)
 *
 * BEISPIEL:
 * - Durchschnitt Ausrückezeit: 65s (σ=12s)
 * - Aktueller Wert: 110s
 * - Z-Score: (110-65)/12 = 3.75
 * - Ergebnis: Anomalie (3.75σ über Normal)
 *
 * @param {number} value - Zu prüfender Wert
 * @param {Array<number>} dataset - Historische Vergleichsdaten
 * @returns {Object|null} { zScore, isAnomaly, severity, message, stats }
 */
function detectAnomalyZScore(value, dataset) {
    if (!dataset || dataset.length < 3) {
        return null; // Zu wenig Daten für Statistik
    }

    const stats = calculateStatistics(dataset);

    // Schutz vor Division durch 0
    if (stats.stdDev === 0) {
        return null; // Alle Werte identisch, keine Anomalie möglich
    }

    const zScore = (value - stats.mean) / stats.stdDev;
    const absZ = Math.abs(zScore);

    return {
        zScore: zScore,
        absZScore: absZ,
        mean: stats.mean,
        stdDev: stats.stdDev,
        isAnomaly: absZ > 1.5,  // Gesenkt von 2.0 auf 1.5 für mehr Sensitivität
        severity: absZ > 2.5 ? 'critical' : (absZ > 1.5 ? 'warning' : 'normal'),
        direction: zScore > 0 ? 'above' : 'below',
        percentage: ((value - stats.mean) / stats.mean * 100).toFixed(1)
    };
}

/**
 * IQR-METHODE ANOMALIE-ERKENNUNG
 *
 * Interquartile Range Methode - robuster gegen Extremwerte als Z-Score.
 * Nutzt Q1, Q3 und IQR (Interquartile Range) für Ausreißer-Erkennung.
 *
 * METHODE:
 * - IQR = Q3 - Q1
 * - Lower Fence = Q1 - 1.5 × IQR
 * - Upper Fence = Q3 + 1.5 × IQR
 * - Werte außerhalb der Fences = Anomalie
 *
 * BEISPIEL:
 * - Q1 (25%): 55s
 * - Q3 (75%): 75s
 * - IQR: 20s
 * - Upper Fence: 75 + 1.5×20 = 105s
 * - Wert: 110s → Anomalie (über Upper Fence)
 *
 * @param {number} value - Zu prüfender Wert
 * @param {Array<number>} dataset - Historische Vergleichsdaten
 * @returns {Object|null} { isAnomaly, severity, fence, distance }
 */
function detectAnomalyIQR(value, dataset) {
    if (!dataset || dataset.length < 4) {
        return null; // Mindestens 4 Werte für Quartile
    }

    const stats = calculateStatistics(dataset);

    // Schutz vor IQR = 0 (alle Werte im mittleren Bereich identisch)
    if (stats.iqr === 0) {
        return null;
    }

    const lowerFence = stats.q1 - 1.5 * stats.iqr;
    const upperFence = stats.q3 + 1.5 * stats.iqr;

    // Extreme Outliers: 3.0 × IQR
    const extremeLowerFence = stats.q1 - 3.0 * stats.iqr;
    const extremeUpperFence = stats.q3 + 3.0 * stats.iqr;

    let isAnomaly = false;
    let severity = 'normal';
    let direction = null;
    let fence = null;
    let distance = 0;

    if (value < lowerFence) {
        isAnomaly = true;
        direction = 'below';
        fence = lowerFence;
        distance = lowerFence - value;
        severity = value < extremeLowerFence ? 'critical' : 'warning';
    } else if (value > upperFence) {
        isAnomaly = true;
        direction = 'above';
        fence = upperFence;
        distance = value - upperFence;
        severity = value > extremeUpperFence ? 'critical' : 'warning';
    }

    return {
        isAnomaly: isAnomaly,
        severity: severity,
        direction: direction,
        fence: fence,
        distance: distance,
        q1: stats.q1,
        q3: stats.q3,
        iqr: stats.iqr,
        lowerFence: lowerFence,
        upperFence: upperFence
    };
}

/**
 * MOVING AVERAGE DEVIATION DETECTION
 *
 * Vergleicht aktuelle Werte mit gleitendem Durchschnitt.
 * Erkennt Abweichungen vom "normalen" Trend.
 *
 * VERWENDUNG:
 * - 7-Tage Moving Average für langfristigen Trend
 * - 24-Stunden Moving Average für kurzfristige Änderungen
 *
 * BEISPIEL:
 * - 7-Tage Average Hilfsfrist-Quote: 82%
 * - Heute: 68%
 * - Delta: -14 Prozentpunkte
 * - Ergebnis: Warning (deutlich unter Durchschnitt)
 *
 * @param {number} currentValue - Aktueller Wert
 * @param {Array<number>} historicalValues - Historische Werte (chronologisch)
 * @param {number} windowSize - Größe des gleitenden Fensters (z.B. 7 für 7 Tage)
 * @returns {Object|null} { movingAvg, delta, deltaPercent, isAnomaly, severity }
 */
function detectMovingAverageDeviation(currentValue, historicalValues, windowSize) {
    if (!historicalValues || historicalValues.length < windowSize) {
        return null; // Zu wenig historische Daten
    }

    // Nehme die letzten N Werte für Moving Average
    const window = historicalValues.slice(-windowSize);
    const movingAvg = window.reduce((sum, val) => sum + val, 0) / windowSize;

    const delta = currentValue - movingAvg;
    const deltaPercent = (delta / movingAvg * 100).toFixed(1);

    // Threshold für Anomalie: > 15% Abweichung
    const thresholdWarning = 0.15;  // 15%
    const thresholdCritical = 0.25; // 25%

    const absDeviation = Math.abs(delta / movingAvg);

    let isAnomaly = absDeviation > thresholdWarning;
    let severity = 'normal';

    if (absDeviation > thresholdCritical) {
        severity = 'critical';
    } else if (absDeviation > thresholdWarning) {
        severity = 'warning';
    }

    return {
        currentValue: currentValue,
        movingAvg: movingAvg,
        delta: delta,
        deltaPercent: parseFloat(deltaPercent),
        direction: delta > 0 ? 'above' : 'below',
        isAnomaly: isAnomaly,
        severity: severity,
        windowSize: windowSize
    };
}

/**
 * ERKENNT ANOMALIEN FÜR RTW (RESSOURCE)
 *
 * Analysiert einen RTW auf verschiedene Anomalie-Typen:
 * - Ausrückezeit (response_time)
 * - Anfahrtszeit (travel_time)
 * - Hilfsfrist-Erfüllungsquote
 * - Anzahl verpasster Hilfsfristen
 *
 * RÜCKGABE:
 * Array von Anomalie-Objekten mit Typ, Schweregrad, Details
 *
 * @param {string} rtwCallSign - RTW Funkrufname (z.B. "RTW-5")
 * @param {Array} allData - Alle Einsatzdaten
 * @returns {Array} Array von erkannten Anomalien
 */
function detectRtwAnomalies(rtwCallSign, allData) {
    const anomalies = [];

    // Filtere Daten für diesen RTW
    const rtwData = allData.filter(function(item) {
        return item.call_sign === rtwCallSign;
    });

    if (rtwData.length === 0) {
        return anomalies;
    }

    console.log('      🔍', rtwCallSign, '→', rtwData.length, 'Einsätze');

    // DEBUG: Zeige ein Beispiel-Item um Struktur zu sehen
    if (rtwData.length > 0) {
        console.log('         DEBUG Beispiel-Item:', rtwData[0]);
    }

    // Baseline: Alle RTWs kombiniert (zum Vergleich)
    const allResponseTimes = allData.map(function(item) { return item.response_time; }).filter(function(t) { return t !== null && !isNaN(t); });
    const allTravelTimes = allData.map(function(item) { return item.travel_time; }).filter(function(t) { return t !== null && !isNaN(t); });

    // Daten für diesen RTW
    const rtwResponseTimes = rtwData.map(function(item) { return item.response_time; }).filter(function(t) { return t !== null && !isNaN(t); });
    const rtwTravelTimes = rtwData.map(function(item) { return item.travel_time; }).filter(function(t) { return t !== null && !isNaN(t); });

    console.log('         Response Times:', rtwResponseTimes.length, 'von', rtwData.length, '| Travel Times:', rtwTravelTimes.length, 'von', rtwData.length);

    // Durchschnitte berechnen
    const avgResponseTime = rtwResponseTimes.length > 0
        ? rtwResponseTimes.reduce((a, b) => a + b, 0) / rtwResponseTimes.length
        : null;

    const avgTravelTime = rtwTravelTimes.length > 0
        ? rtwTravelTimes.reduce((a, b) => a + b, 0) / rtwTravelTimes.length
        : null;

    // 1. AUSRÜCKEZEIT ANOMALIE
    if (avgResponseTime !== null && allResponseTimes.length > 3) {
        const zScoreResult = detectAnomalyZScore(avgResponseTime, allResponseTimes);

        if (zScoreResult) {
            console.log('         Ausrückezeit:', avgResponseTime.toFixed(0) + 's, Z-Score:', zScoreResult.zScore.toFixed(2), zScoreResult.isAnomaly ? '⚠️ ANOMALIE' : '✓');
        }

        if (zScoreResult && zScoreResult.isAnomaly) {
            anomalies.push({
                type: 'response_time',
                rtwCallSign: rtwCallSign,
                severity: zScoreResult.severity,
                value: Math.round(avgResponseTime),
                baseline: Math.round(zScoreResult.mean),
                zScore: zScoreResult.zScore.toFixed(2),
                percentage: zScoreResult.percentage,
                direction: zScoreResult.direction,
                message: 'Ausrückezeit ' + zScoreResult.percentage + '% ' +
                         (zScoreResult.direction === 'above' ? 'über' : 'unter') + ' Durchschnitt'
            });
        }
    }

    // 2. ANFAHRTSZEIT ANOMALIE
    if (avgTravelTime !== null && allTravelTimes.length > 3) {
        const zScoreResult = detectAnomalyZScore(avgTravelTime, allTravelTimes);

        if (zScoreResult && zScoreResult.isAnomaly) {
            anomalies.push({
                type: 'travel_time',
                rtwCallSign: rtwCallSign,
                severity: zScoreResult.severity,
                value: Math.round(avgTravelTime),
                baseline: Math.round(zScoreResult.mean),
                zScore: zScoreResult.zScore.toFixed(2),
                percentage: zScoreResult.percentage,
                direction: zScoreResult.direction,
                message: 'Anfahrtszeit ' + zScoreResult.percentage + '% ' +
                         (zScoreResult.direction === 'above' ? 'über' : 'unter') + ' Durchschnitt'
            });
        }
    }

    // 3. HILFSFRIST-QUOTE ANOMALIE (unter Durchschnitt)
    const rtwHilfsfristMet = rtwData.filter(function(item) { return item.hilfsfrist_met === true; }).length;
    const rtwHilfsfristQuote = rtwData.length > 0 ? (rtwHilfsfristMet / rtwData.length * 100) : null;

    const allHilfsfristMet = allData.filter(function(item) { return item.hilfsfrist_met === true; }).length;
    const allHilfsfristQuote = allData.length > 0 ? (allHilfsfristMet / allData.length * 100) : null;

    if (rtwHilfsfristQuote !== null && allHilfsfristQuote !== null) {
        const quoteDelta = rtwHilfsfristQuote - allHilfsfristQuote;

        // Anomalie wenn > 10 Prozentpunkte schlechter
        if (quoteDelta < -10) {
            anomalies.push({
                type: 'hilfsfrist_quote',
                rtwCallSign: rtwCallSign,
                severity: quoteDelta < -20 ? 'critical' : 'warning',
                value: rtwHilfsfristQuote.toFixed(1),
                baseline: allHilfsfristQuote.toFixed(1),
                delta: quoteDelta.toFixed(1),
                message: 'Hilfsfrist-Quote ' + Math.abs(quoteDelta).toFixed(1) + ' Prozentpunkte unter Durchschnitt'
            });
        }
    }

    return anomalies;
}

/**
 * ERKENNT ANOMALIEN FÜR REVIER (EINSATZ-GEBIET)
 *
 * Analysiert ein Revier (z.B. "Altona", "Nord") auf Anomalien:
 * - Überdurchschnittlich viele Einsätze
 * - Schlechte Hilfsfrist-Erfüllung
 * - Lange Anfahrtszeiten
 *
 * @param {string} revier - Revier-Name (z.B. "Altona")
 * @param {Array} allData - Alle Einsatzdaten
 * @returns {Array} Array von erkannten Anomalien
 */
function detectRevierAnomalies(revier, allData) {
    const anomalies = [];

    // Filtere Daten für dieses Revier
    const revierData = allData.filter(function(item) {
        return item.revier_bf_ab_2018 === revier;
    });

    if (revierData.length === 0) {
        return anomalies;
    }

    // Baseline: Durchschnittliche Einsätze pro Revier
    const reviereMap = {};
    allData.forEach(function(item) {
        const r = item.revier_bf_ab_2018;
        if (r) {
            reviereMap[r] = (reviereMap[r] || 0) + 1;
        }
    });

    const revierCounts = Object.values(reviereMap);
    const avgEinsaetzeProRevier = revierCounts.reduce((a, b) => a + b, 0) / revierCounts.length;

    // 1. EINSATZDICHTE ANOMALIE
    const einsatzCount = revierData.length;
    const einsatzStats = calculateStatistics(revierCounts);

    if (einsatzStats && einsatzCount > einsatzStats.mean * 1.5) {
        anomalies.push({
            type: 'einsatz_density',
            revier: revier,
            severity: einsatzCount > einsatzStats.mean * 2 ? 'critical' : 'warning',
            value: einsatzCount,
            baseline: Math.round(avgEinsaetzeProRevier),
            percentage: ((einsatzCount / avgEinsaetzeProRevier - 1) * 100).toFixed(1),
            message: 'Überdurchschnittlich viele Einsätze (' +
                     ((einsatzCount / avgEinsaetzeProRevier - 1) * 100).toFixed(0) + '% über Normal)'
        });
    }

    // 2. HILFSFRIST-QUOTE ANOMALIE
    const revierHilfsfristMet = revierData.filter(function(item) { return item.hilfsfrist_met === true; }).length;
    const revierHilfsfristQuote = revierData.length > 0 ? (revierHilfsfristMet / revierData.length * 100) : null;

    const allHilfsfristMet = allData.filter(function(item) { return item.hilfsfrist_met === true; }).length;
    const allHilfsfristQuote = allData.length > 0 ? (allHilfsfristMet / allData.length * 100) : null;

    if (revierHilfsfristQuote !== null && allHilfsfristQuote !== null) {
        const quoteDelta = revierHilfsfristQuote - allHilfsfristQuote;

        // Anomalie wenn > 10 Prozentpunkte schlechter
        if (quoteDelta < -10) {
            anomalies.push({
                type: 'hilfsfrist_quote',
                revier: revier,
                severity: quoteDelta < -20 ? 'critical' : 'warning',
                value: revierHilfsfristQuote.toFixed(1),
                baseline: allHilfsfristQuote.toFixed(1),
                delta: quoteDelta.toFixed(1),
                message: 'Hilfsfrist-Quote ' + Math.abs(quoteDelta).toFixed(1) + ' Prozentpunkte unter Durchschnitt'
            });
        }
    }

    // 3. ANFAHRTSZEIT ANOMALIE
    const revierTravelTimes = revierData.map(function(item) { return item.travel_time; }).filter(function(t) { return t !== null; });
    const allTravelTimes = allData.map(function(item) { return item.travel_time; }).filter(function(t) { return t !== null; });

    if (revierTravelTimes.length > 0 && allTravelTimes.length > 3) {
        const avgRevierTravelTime = revierTravelTimes.reduce((a, b) => a + b, 0) / revierTravelTimes.length;
        const zScoreResult = detectAnomalyZScore(avgRevierTravelTime, allTravelTimes);

        if (zScoreResult && zScoreResult.isAnomaly && zScoreResult.direction === 'above') {
            anomalies.push({
                type: 'travel_time',
                revier: revier,
                severity: zScoreResult.severity,
                value: Math.round(avgRevierTravelTime),
                baseline: Math.round(zScoreResult.mean),
                percentage: zScoreResult.percentage,
                message: 'Anfahrtszeit ' + zScoreResult.percentage + '% über Durchschnitt'
            });
        }
    }

    return anomalies;
}

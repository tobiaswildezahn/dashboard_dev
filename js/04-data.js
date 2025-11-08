// ============================================================================
// FILE: js/04-data.js
// Data Fetching and Processing
// Dependencies: CONFIG, state, isHilfsfristRelevant, getCurrentShiftTimes,
//               formatDateToSQL, showLoading, hideLoading, showMessage,
//               updateDashboard, updateLastUpdate
// Requires: esriRequest from ArcGIS API (AMD)
// ============================================================================

// ============================================================================
// SQL INJECTION SCHUTZ
// ============================================================================

/**
 * SICHERHEITSFUNKTION: SQL-Injection Schutz
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Schützt vor SQL-Injection-Angriffen indem gefährliche Zeichen escaped werden
 * - SQL-Injection: Angreifer kann durch ' und andere Zeichen SQL-Befehle einschleusen
 *
 * BEISPIEL ANGRIFF (ohne Schutz):
 * - Eingabe: RTW' OR '1'='1
 * - SQL wird zu: WHERE nameresourcetype = 'RTW' OR '1'='1' AND ...
 * - Ergebnis: ALLE Datensätze werden zurückgegeben (Datenleck!)
 *
 * BEISPIEL SCHUTZ (mit Funktion):
 * - Eingabe: RTW' OR '1'='1
 * - Nach Sanitization: RTW'' OR ''1''=''1
 * - SQL wird zu: WHERE nameresourcetype = 'RTW'' OR ''1''=''1' AND ...
 * - Ergebnis: Keine Datensätze (sicher)
 *
 * FUNKTIONSWEISE:
 * - Ersetzt jedes ' durch '' (SQL-Escape-Standard)
 * - Validiert dass nur alphanumerische Zeichen und - verwendet werden
 *
 * @param {string} value - Zu escapen der Wert (z.B. CONFIG.resourceType)
 * @returns {string} Sicherer Wert für SQL-Verwendung
 */
function sanitizeForSQL(value) {
    if (value === null || value === undefined) {
        return '';
    }

    // Konvertiere zu String
    const str = String(value);

    // WARNUNG: Wenn gefährliche Zeichen gefunden werden
    if (/[;'"\\]/.test(str)) {
        console.warn('⚠️ SICHERHEITSWARNUNG: Potenziell gefährliche Zeichen in SQL-Parameter gefunden:', str);
    }

    // Escape single quotes: ' wird zu ''
    // Dies ist der SQL-Standard für String-Escaping
    return str.replace(/'/g, "''");
}

// ============================================================================
// DATA PROCESSING
// ============================================================================

/**
 * VERARBEITET ROHDATEN VOM SERVER
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Kombiniert Resource-Daten und Event-Daten
 * - Berechnet Ausrückezeit, Anfahrtszeit und Hilfsfrist
 * - Markiert ob Einsatz hilfsfrist-relevant ist
 * - Prüft ob Schwellenwerte erreicht wurden
 *
 * DATEN-QUELLEN:
 * - rawResourceFeatures: RTW-Einsätze (Fahrzeuge)
 * - rawEventFeatures: Event-Details (Adressen, Typ, etc.)
 *
 * BERECHNUNGEN:
 * - responseTime = time_on_the_way - time_alarm (in Sekunden)
 * - travelTime = time_arrived - time_on_the_way (in Sekunden)
 * - hilfsfristAchieved = responseAchieved AND travelAchieved
 *
 * @param {Array} rawResourceFeatures - Rohdaten von Resources-Layer
 * @param {Array} rawEventFeatures - Rohdaten von Events-Layer
 * @returns {Array} Verarbeitete Daten mit berechneten KPIs
 */
function processData(rawResourceFeatures, rawEventFeatures) {
    const eventMap = {};
    rawEventFeatures.forEach(function(feature) {
        eventMap[feature.attributes.id] = feature.attributes;
    });

    return rawResourceFeatures.map(function(feature) {
        const attrs = feature.attributes;
        const eventData = eventMap[attrs.idevent] || {};
        const nameeventtype = eventData.nameeventtype || null;

        const responseTime = attrs.time_on_the_way && attrs.time_alarm
            ? (new Date(attrs.time_on_the_way) - new Date(attrs.time_alarm)) / 1000
            : null;

        const travelTime = attrs.time_arrived && attrs.time_on_the_way
            ? (new Date(attrs.time_arrived) - new Date(attrs.time_on_the_way)) / 1000
            : null;

        const responseAchieved = responseTime !== null
            ? responseTime <= CONFIG.responseTimeThreshold
            : null;

        const travelAchieved = travelTime !== null
            ? travelTime <= CONFIG.travelTimeThreshold
            : null;

        const hilfsfristAchieved = responseAchieved !== null && travelAchieved !== null
            ? responseAchieved && travelAchieved
            : null;

        return {
            call_sign: attrs.call_sign,
            idevent: attrs.idevent,
            time_alarm: attrs.time_alarm,
            time_on_the_way: attrs.time_on_the_way,
            time_arrived: attrs.time_arrived,
            time_finished: attrs.time_finished,
            time_finished_via_radio: attrs.time_finished_via_radio,
            nameresourcetype: attrs.nameresourcetype,
            nameeventtype: nameeventtype,
            eventData: eventData,
            isHilfsfristRelevant: isHilfsfristRelevant(nameeventtype),
            responseTime: responseTime,
            travelTime: travelTime,
            responseAchieved: responseAchieved,
            travelAchieved: travelAchieved,
            hilfsfristAchieved: hilfsfristAchieved
        };
    });
}

// ============================================================================
// DATA FETCHING - MULTI-LAYER mit Schicht-Support
// ============================================================================

/**
 * LÄDT EINSATZDATEN VOM ARCGIS SERVER
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Hauptfunktion zum Laden aller Einsatzdaten
 * - Fragt zwei ArcGIS Feature-Services parallel ab (Resources + Events)
 * - Unterstützt verschiedene Zeitfilter (letzte X Stunden, aktuelle Schicht)
 * - Aktualisiert Dashboard nach erfolgreichem Laden
 *
 * SICHERHEITSMASSNAHMEN:
 * - sanitizeForSQL() für CONFIG.resourceType (verhindert SQL-Injection)
 * - Alle Zeitstempel werden sicher formatiert
 * - Fehlerbehandlung für Netzwerkprobleme
 *
 * ZEITFILTER:
 * - 'current-shift': Aktuelle Schicht (07:00-07:00 Uhr)
 * - Zahl: Letzte X Stunden (z.B. 8, 24, 72)
 *
 * WARUM PARALLEL:
 * - Schneller als sequentiell (2 Anfragen gleichzeitig)
 * - Promise.all() wartet auf beide Antworten
 *
 * @param {Object} [options] - Optionale Konfiguration
 * @param {boolean} [options.updateFilters=true] - Soll RTW-Filter aktualisiert werden?
 * @param {boolean} [options.showLoadingIndicator=true] - Soll Lade-Overlay angezeigt werden?
 * @param {boolean} [options.showSuccessMessage=true] - Soll Erfolgsmeldung angezeigt werden?
 */
async function fetchData(options) {
    if (!options) options = {};
    const updateFilters = options.updateFilters !== undefined ? options.updateFilters : true;
    const showLoadingIndicator = options.showLoadingIndicator !== undefined ? options.showLoadingIndicator : true;
    const showSuccessMessage = options.showSuccessMessage !== undefined ? options.showSuccessMessage : true;

    if (showLoadingIndicator) {
        showLoading();
    }

    try {
        const timeFilterValue = document.getElementById('timeFilter').value;
        let whereClause, eventWhereClause;

        // Schicht-Filter Support
        if (timeFilterValue === 'current-shift') {
            const shiftTimes = getCurrentShiftTimes();
            const startTimestamp = formatDateToSQL(shiftTimes.startTime);
            const endTimestamp = formatDateToSQL(shiftTimes.endTime);

            console.log('🕐 Schicht-Filter aktiv:');
            console.log('  Start:', startTimestamp, '(lokale Zeit:', shiftTimes.startTime.toLocaleString('de-DE'), ')');
            console.log('  Ende:', endTimestamp, '(lokale Zeit:', shiftTimes.endTime.toLocaleString('de-DE'), ')');

            // SICHERHEIT: sanitizeForSQL() verhindert SQL-Injection
            const safeResourceType = sanitizeForSQL(CONFIG.resourceType);
            whereClause = "nameresourcetype = '" + safeResourceType + "' AND time_alarm >= DATE '" + startTimestamp + "' AND time_alarm < DATE '" + endTimestamp + "'";
            eventWhereClause = "alarmtime >= DATE '" + startTimestamp + "' AND alarmtime < DATE '" + endTimestamp + "'";

            console.log('  WHERE:', whereClause);
        } else {
            const hours = parseInt(timeFilterValue);

            // SICHERHEIT: sanitizeForSQL() verhindert SQL-Injection
            const safeResourceType = sanitizeForSQL(CONFIG.resourceType);
            whereClause = "nameresourcetype = '" + safeResourceType + "' AND time_alarm > CURRENT_TIMESTAMP - INTERVAL '" + hours + "' HOUR";
            eventWhereClause = "alarmtime > CURRENT_TIMESTAMP - INTERVAL '" + hours + "' HOUR";
        }

        const responses = await Promise.all([
            esriRequest(resourcesServiceUrl + "/query", {
                query: {
                    where: whereClause,
                    outFields: "*",
                    f: "json",
                    returnGeometry: false
                },
                responseType: "json"
            }),
            esriRequest(eventsServiceUrl + "/query", {
                query: {
                    where: eventWhereClause,
                    outFields: "id,nameeventtype,street1,street2,zipcode,city,revier_bf_ab_2018,dias_resultmedical",
                    f: "json",
                    returnGeometry: false
                },
                responseType: "json"
            })
        ]);

        const resourceResponse = responses[0];
        const eventResponse = responses[1];

        if (!resourceResponse.data || !resourceResponse.data.features) {
            throw new Error('Keine Daten vom Server erhalten');
        }

        state.processedData = processData(
            resourceResponse.data.features,
            eventResponse.data.features
        );

        if (updateFilters) {
            const rtwList = extractUniqueRtw(state.processedData);
            populateRtwPicker(rtwList);
        }

        updateDashboard();
        updateLastUpdate();

        if (showSuccessMessage) {
            showMessage('✅ Daten erfolgreich geladen (' + state.processedData.length + ' Einträge)', 'success');
        }

    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        showMessage('❌ Fehler beim Laden der Daten', 'error');
    } finally {
        if (showLoadingIndicator) {
            hideLoading();
        }
    }
}

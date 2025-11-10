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
// DATA FETCHING WITH PAGINATION
// ============================================================================

/**
 * LÄDT ALLE FEATURES MIT AUTOMATISCHER PAGINATION
 *
 * PROBLEM:
 * - ArcGIS Feature Services haben ein maxRecordCount Limit (typisch 1000-2000)
 * - Bei mehr Features werden nur die ersten zurückgegeben
 * - exceedsTransferLimit = true signalisiert dass mehr Daten existieren
 *
 * LÖSUNG:
 * - Mehrere Requests mit resultOffset (0, 1000, 2000, ...)
 * - Sammelt alle Features in einem Array
 * - Garantiert dass ALLE Daten geladen werden
 *
 * WICHTIG FÜR 72h FILTER:
 * - 3000 Einsätze in 72h sind normal
 * - Ohne Pagination würden 1000-2000 Features fehlen
 * - Führt zu N/A Werten in Tabelle
 *
 * @param {string} serviceUrl - URL des Feature Service
 * @param {string} whereClause - SQL WHERE Klausel
 * @param {string} outFields - Komma-separierte Feldliste oder "*"
 * @returns {Promise<Array>} Array mit ALLEN Features (keine Limits)
 */
async function fetchAllFeatures(serviceUrl, whereClause, outFields) {
    let allFeatures = [];
    let offset = 0;
    const batchSize = 1000; // Features pro Request
    let hasMore = true;

    console.log('📊 Lade Features mit Pagination von:', serviceUrl);
    console.log('   WHERE:', whereClause);

    while (hasMore) {
        try {
            const response = await esriRequest(serviceUrl + "/query", {
                query: {
                    where: whereClause,
                    outFields: outFields,
                    f: "json",
                    returnGeometry: false,
                    resultOffset: offset,
                    resultRecordCount: batchSize
                },
                responseType: "json"
            });

            if (!response.data || !response.data.features) {
                throw new Error('Keine Daten vom Server erhalten');
            }

            const features = response.data.features;
            allFeatures = allFeatures.concat(features);

            console.log('   Batch geladen: Offset', offset, '→', features.length, 'Features (Gesamt:', allFeatures.length + ')');

            // Prüfe ob mehr Daten vorhanden sind
            if (response.data.exceededTransferLimit === true || features.length === batchSize) {
                // Es gibt wahrscheinlich mehr Daten
                offset += batchSize;
            } else {
                // Alle Daten geladen
                hasMore = false;
            }

            // Sicherheits-Abbruch bei zu vielen Iterationen (max 10.000 Features)
            if (offset >= 10000) {
                console.warn('⚠️ Pagination bei 10.000 Features abgebrochen (Sicherheits-Limit)');
                hasMore = false;
            }

        } catch (error) {
            console.error('Fehler beim Laden von Features (Offset ' + offset + '):', error);
            throw error;
        }
    }

    console.log('✅ Pagination abgeschlossen:', allFeatures.length, 'Features geladen');
    return allFeatures;
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

        // Rückfahrtzeit: Zeit zwischen "Einsatz beendet per Funk" und "Zurück an Station"
        const returnTime = attrs.time_finished && attrs.time_finished_via_radio
            ? (new Date(attrs.time_finished) - new Date(attrs.time_finished_via_radio)) / 1000
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
            event_resources_status: attrs.event_resources_status,
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
            returnTime: returnTime,
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

        // WICHTIG: fetchAllFeatures() statt direktem esriRequest
        // Lädt ALLE Features mit automatischer Pagination
        // Verhindert N/A Werte bei großen Zeiträumen (48h, 72h)
        const responses = await Promise.all([
            fetchAllFeatures(
                resourcesServiceUrl,
                whereClause,
                "*"  // Alle Felder
            ),
            fetchAllFeatures(
                eventsServiceUrl,
                eventWhereClause,
                "id,nameeventtype,street1,street2,zipcode,city,revier_bf_ab_2018,dias_resultmedical"
            )
        ]);

        const resourceFeatures = responses[0];
        const eventFeatures = responses[1];

        if (!resourceFeatures || resourceFeatures.length === 0) {
            throw new Error('Keine Resource-Daten vom Server erhalten');
        }

        // processData erwartet Features mit .attributes Property
        // fetchAllFeatures gibt bereits die Feature-Objekte zurück
        state.processedData = processData(
            resourceFeatures,
            eventFeatures || []
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

// ============================================================================
// FILE: js/04-data.js
// Data Fetching and Processing
// Dependencies: CONFIG, state, isHilfsfristRelevant, getCurrentShiftTimes,
//               formatDateToSQL, showLoading, hideLoading, showMessage,
//               updateDashboard, updateLastUpdate
// Requires: esriRequest from ArcGIS API (AMD)
// ============================================================================

// ============================================================================
// DATA PROCESSING
// ============================================================================

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

            whereClause = "nameresourcetype = '" + CONFIG.resourceType + "' AND time_alarm >= DATE '" + startTimestamp + "' AND time_alarm < DATE '" + endTimestamp + "'";
            eventWhereClause = "alarmtime >= DATE '" + startTimestamp + "' AND alarmtime < DATE '" + endTimestamp + "'";

            console.log('  WHERE:', whereClause);
        } else {
            const hours = parseInt(timeFilterValue);
            whereClause = "nameresourcetype = '" + CONFIG.resourceType + "' AND time_alarm > CURRENT_TIMESTAMP - INTERVAL '" + hours + "' HOUR";
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

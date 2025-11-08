// ============================================================================
// FILE: js/08-ui-modal.js
// Event Details Modal
// Dependencies: state
// Requires: esriRequest from ArcGIS API (AMD)
// ============================================================================

async function openEventDetailsModal(eventId) {
    const modal = document.getElementById('eventDetailsModal');
    const modalBody = document.getElementById('modalBodyContent');
    const modalTitle = document.querySelector('#eventDetailsModal .modal-title');

    // Schneller Lookup für Titel
    const cachedItem = state.processedData.find(function(item) { return item.idevent == eventId; });
    const funkrufname = cachedItem ? (cachedItem.call_sign || 'Einsatz') : 'Einsatz';
    const einsatzstichwort = cachedItem ? (cachedItem.nameeventtype || 'Wird geladen...') : 'Wird geladen...';

    // Titel sofort setzen für bessere UX
    modalTitle.innerHTML = '<span>🚨</span>' +
        '<div>' +
        '<div class="modal-title-main">' + funkrufname + '</div>' +
        '<div class="modal-title-sub">' + einsatzstichwort + '</div>' +
        '</div>';

    // Modal öffnen mit Loading-Anzeige
    modal.classList.add('active');
    modalBody.innerHTML = '<div class="modal-loading">' +
        '<div class="modal-loading-spinner"></div>' +
        '<div>Lade Details...</div>' +
        '</div>';

    // Einsatzdetails abrufen
    try {
        const details = await fetchEventDetails(eventId);
        displayEventDetails(details);
    } catch (error) {
        console.error('Fehler beim Laden der Einsatzdetails:', error);
        modalBody.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--danger-color);">' +
            '<div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>' +
            '<div style="font-weight: 600; margin-bottom: 8px;">Fehler beim Laden der Einsatzdetails</div>' +
            '<div style="font-size: 13px; color: var(--gray-600);">Bitte versuchen Sie es erneut.</div>' +
            '</div>';
    }
}

function closeEventDetailsModal() {
    const modal = document.getElementById('eventDetailsModal');
    modal.classList.remove('active');
}

// Funktionen global verfügbar machen
window.openEventDetailsModal = openEventDetailsModal;
window.closeEventDetailsModal = closeEventDetailsModal;

async function fetchEventDetails(eventId) {
    // Daten aus dem Cache (state.processedData) holen
    const cachedData = state.processedData.find(function(item) { return item.idevent == eventId; });

    if (cachedData) {
        // Daten sind im Cache vorhanden
        return {
            eventDetails: cachedData.eventData || {},
            resourceDetails: cachedData
        };
    }

    // Fallback: API-Abfragen wenn nicht im Cache
    let eventDetails = null;
    let resourceDetails = null;

    // API-Abfrage für Event-Informationen
    try {
        const eventResponse = await esriRequest(eventsServiceUrl + "/query", {
            query: {
                where: "id = " + eventId,
                outFields: "id,nameeventtype,street1,street2,zipcode,city,revier_bf_ab_2018,dias_resultmedical",
                f: "json",
                returnGeometry: false
            },
            responseType: "json"
        });

        if (eventResponse.data && eventResponse.data.features && eventResponse.data.features.length > 0) {
            eventDetails = eventResponse.data.features[0].attributes;
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Event-Details:', error);
    }

    // API-Abfrage für Resource-Informationen
    try {
        const resourceResponse = await esriRequest(resourcesServiceUrl + "/query", {
            query: {
                where: "idevent = " + eventId,
                outFields: "*",
                f: "json",
                returnGeometry: false
            },
            responseType: "json"
        });

        if (resourceResponse.data && resourceResponse.data.features && resourceResponse.data.features.length > 0) {
            resourceDetails = resourceResponse.data.features[0].attributes;
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Resource-Details:', error);
    }

    return {
        eventDetails: eventDetails,
        resourceDetails: resourceDetails
    };
}

function displayEventDetails(details) {
    const modalBody = document.getElementById('modalBodyContent');
    const eventDetails = details.eventDetails;
    const resourceDetails = details.resourceDetails;

    // Prüfe ob eventDetails ein leeres Objekt ist
    const hasEventDetails = eventDetails && Object.keys(eventDetails).length > 0;
    const hasResourceDetails = resourceDetails && Object.keys(resourceDetails).length > 0;

    if (!hasEventDetails && !hasResourceDetails) {
        modalBody.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--gray-600);">' +
            '<div style="font-size: 48px; margin-bottom: 16px;">🔍</div>' +
            '<div style="font-weight: 600; margin-bottom: 8px;">Keine Details verfügbar</div>' +
            '<div style="font-size: 13px;">Die Einsatzdetails konnten nicht geladen werden.</div>' +
            '</div>';
        return;
    }

    // Titel aktualisieren
    const modalTitle = document.querySelector('#eventDetailsModal .modal-title');
    const funkrufname = resourceDetails ? (resourceDetails.call_sign || 'Unbekannt') : 'Unbekannt';
    const einsatzstichwort = eventDetails ? (eventDetails.nameeventtype || 'Unbekannt') : 'Unbekannt';
    modalTitle.innerHTML = '<span>🚨</span>' +
        '<div>' +
        '<div class="modal-title-main">' + funkrufname + '</div>' +
        '<div class="modal-title-sub">' + einsatzstichwort + '</div>' +
        '</div>';

    // Einsatzdauer berechnen (neue Logik)
    let einsatzdauer = 'N/A';
    let einsatzEnde = null;

    if (resourceDetails && resourceDetails.time_alarm) {
        // Priorität: time_finished_via_radio > time_finished > aktuelle Zeit
        if (resourceDetails.time_finished_via_radio) {
            einsatzEnde = resourceDetails.time_finished_via_radio;
        } else if (resourceDetails.time_finished) {
            einsatzEnde = resourceDetails.time_finished;
        } else {
            einsatzEnde = Date.now();
        }

        const dauer = (new Date(einsatzEnde) - new Date(resourceDetails.time_alarm)) / 1000 / 60;
        einsatzdauer = Math.round(dauer) + ' Minuten';
    }

    // Einsatzadresse zusammenstellen
    let einsatzadresse = 'N/A';
    if (eventDetails) {
        if (eventDetails.street1 && eventDetails.street2) {
            einsatzadresse = eventDetails.street1 + '/' + eventDetails.street2;
        } else if (eventDetails.street1) {
            einsatzadresse = eventDetails.street1;
        }
    }

    // PLZ und Stadt zusammenstellen
    const plzStadt = eventDetails && eventDetails.zipcode && eventDetails.city
        ? (eventDetails.zipcode + ' ' + eventDetails.city)
        : (eventDetails && eventDetails.zipcode ? eventDetails.zipcode : (eventDetails && eventDetails.city ? eventDetails.city : 'N/A'));

    const html = '<div class="detail-row">' +
        '<div class="detail-field">' +
        '<div class="detail-label">Einsatzadresse</div>' +
        '<div class="detail-value ' + (einsatzadresse === 'N/A' ? 'empty' : '') + '">' +
        einsatzadresse +
        '</div>' +
        '</div>' +

        '<div class="detail-field">' +
        '<div class="detail-label">PLZ / Stadt</div>' +
        '<div class="detail-value ' + (plzStadt === 'N/A' ? 'empty' : '') + '">' +
        plzStadt +
        '</div>' +
        '</div>' +
        '</div>' +

        '<div class="detail-field">' +
        '<div class="detail-label">Einsatzrevier</div>' +
        '<div class="detail-value ' + (eventDetails && eventDetails.revier_bf_ab_2018 ? '' : 'empty') + '">' +
        (eventDetails && eventDetails.revier_bf_ab_2018 ? eventDetails.revier_bf_ab_2018 : 'Nicht verfügbar') +
        '</div>' +
        '</div>' +

        '<div class="detail-field">' +
        '<div class="detail-label">Einsatzdauer</div>' +
        '<div class="detail-value ' + (einsatzdauer === 'N/A' ? 'empty' : '') + '">' +
        einsatzdauer +
        '</div>' +
        '</div>' +

        '<div class="detail-field">' +
        '<div class="detail-label">Notrufabfrage</div>' +
        '<div class="detail-value ' + (eventDetails && eventDetails.dias_resultmedical ? '' : 'empty') + '">' +
        (eventDetails && eventDetails.dias_resultmedical ? eventDetails.dias_resultmedical : 'Nicht verfügbar') +
        '</div>' +
        '</div>';

    modalBody.innerHTML = html;
}

// Modal schließen beim Klick auf Overlay
document.addEventListener('click', function(event) {
    const modal = document.getElementById('eventDetailsModal');
    if (event.target === modal) {
        closeEventDetailsModal();
    }
});

// Modal schließen mit Escape-Taste
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('eventDetailsModal');
        if (modal.classList.contains('active')) {
            closeEventDetailsModal();
        }
    }
});

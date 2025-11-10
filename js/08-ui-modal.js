// ============================================================================
// FILE: js/08-ui-modal.js
// Event Details Modal
// Dependencies: state, escapeHtml
// Requires: esriRequest from ArcGIS API (AMD)
// ============================================================================

/**
 * ÖFFNET MODAL MIT EINSATZDETAILS
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Zeigt ein Popup-Fenster mit detaillierten Informationen zu einem Einsatz
 * - Lädt Daten zuerst aus Cache (schnell), dann von API (fallback)
 * - Escaped ALLE Benutzerdaten um XSS-Angriffe zu verhindern
 * - Zeigt Loading-Spinner während Daten geladen werden
 *
 * SICHERHEITSMASSNAHMEN:
 * - escapeHtml() für funkrufname, einsatzstichwort und alle Felder
 * - Verhindert XSS durch gefährliche Zeichen in Einsatzdaten
 *
 * ABLAUF:
 * 1. Modal sofort öffnen mit Loading-Anzeige
 * 2. Titel mit gecachten Daten setzen (schnell)
 * 3. Details von API laden
 * 4. Modal-Inhalt aktualisieren
 *
 * @param {number} eventId - Die ID des anzuzeigenden Einsatzes
 */
async function openEventDetailsModal(eventId) {
    const modal = document.getElementById('eventDetailsModal');
    const modalBody = document.getElementById('modalBodyContent');
    const modalTitle = document.querySelector('#eventDetailsModal .modal-title');

    // Schneller Lookup für Titel
    // WICHTIG: Beide zu Number konvertieren für sicheren Vergleich
    // (Datenbank kann String oder Number liefern)
    const eventIdNum = Number(eventId);
    const cachedItem = state.processedData.find(function(item) {
        return Number(item.idevent) === eventIdNum;
    });

    // SICHERHEIT: escapeHtml() verhindert XSS-Angriffe
    const funkrufname = escapeHtml(cachedItem ? cachedItem.call_sign : null);
    const einsatzstichwort = escapeHtml(cachedItem ? cachedItem.nameeventtype : null);
    const resourceStatus = escapeHtml(cachedItem ? cachedItem.event_resources_status : null);

    // Status-Badge HTML (falls vorhanden)
    const statusBadgeHtml = resourceStatus
        ? '<span class="modal-status-badge">' + resourceStatus + '</span>'
        : '';

    // Titel sofort setzen für bessere UX
    modalTitle.innerHTML = '<span>🚨</span>' +
        '<div>' +
        '<div class="modal-title-main">' + (funkrufname || 'Einsatz') + statusBadgeHtml + '</div>' +
        '<div class="modal-title-sub">' + (einsatzstichwort || 'Wird geladen...') + '</div>' +
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

/**
 * LÄDT EINSATZDETAILS VOM SERVER
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Versucht zuerst Daten aus lokalem Cache zu holen (schnell)
 * - Falls nicht im Cache: Fragt ArcGIS Server API ab (langsam)
 * - Lädt Event-Details und Resource-Details parallel
 *
 * WARUM CACHE:
 * - Vermeidet unnötige Server-Anfragen
 * - Schnellere Anzeige für Benutzer
 * - Reduziert Server-Last
 *
 * WARUM FALLBACK:
 * - Wenn Einsatz nicht in aktueller Schicht/Filter
 * - Garantiert dass Details immer geladen werden können
 *
 * @param {number} eventId - Die ID des zu ladenden Einsatzes
 * @returns {Promise<Object>} Object mit eventDetails und resourceDetails
 */
async function fetchEventDetails(eventId) {
    // Daten aus dem Cache (state.processedData) holen
    // WICHTIG: Beide zu Number konvertieren für sicheren Vergleich
    // (Datenbank kann String oder Number liefern, parseInt liefert Number)
    const eventIdNum = Number(eventId);
    const cachedData = state.processedData.find(function(item) {
        return Number(item.idevent) === eventIdNum;
    });

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

/**
 * ZEIGT EINSATZDETAILS IM MODAL AN
 *
 * AUSFÜHRLICHE ERKLÄRUNG:
 * - Nimmt Einsatzdaten und rendert sie in HTML
 * - Escaped ALLE Benutzerdaten um XSS-Angriffe zu verhindern
 * - Berechnet Einsatzdauer mit intelligenter Logik
 * - Zeigt Adresse, Stadt, Revier, Dauer und Notrufabfrage
 *
 * SICHERHEITSMASSNAHMEN:
 * - escapeHtml() für ALLE Felder (Adresse, Stadt, Revier, etc.)
 * - Verhindert XSS durch gefährliche Zeichen in Datenbank
 *
 * EINSATZDAUER-LOGIK:
 * - Priorität 1: time_finished_via_radio (Funk-Meldung)
 * - Priorität 2: time_finished (System-Zeit)
 * - Priorität 3: Aktuelle Zeit (wenn noch nicht beendet)
 *
 * @param {Object} details - Object mit eventDetails und resourceDetails
 */
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

    // Titel aktualisieren (mit Escaping!)
    const modalTitle = document.querySelector('#eventDetailsModal .modal-title');

    // SICHERHEIT: escapeHtml() verhindert XSS-Angriffe
    const funkrufname = escapeHtml(resourceDetails ? resourceDetails.call_sign : null) || 'Unbekannt';
    const einsatzstichwort = escapeHtml(eventDetails ? eventDetails.nameeventtype : null) || 'Unbekannt';
    const resourceStatus = escapeHtml(resourceDetails ? resourceDetails.event_resources_status : null);

    // Status-Badge HTML (falls vorhanden)
    const statusBadgeHtml = resourceStatus
        ? '<span class="modal-status-badge">' + resourceStatus + '</span>'
        : '';

    modalTitle.innerHTML = '<span>🚨</span>' +
        '<div>' +
        '<div class="modal-title-main">' + funkrufname + statusBadgeHtml + '</div>' +
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

    // Einsatzadresse zusammenstellen (mit Escaping!)
    let einsatzadresse = 'N/A';
    if (eventDetails) {
        if (eventDetails.street1 && eventDetails.street2) {
            // SICHERHEIT: escapeHtml() verhindert XSS
            einsatzadresse = escapeHtml(eventDetails.street1) + '/' + escapeHtml(eventDetails.street2);
        } else if (eventDetails.street1) {
            einsatzadresse = escapeHtml(eventDetails.street1);
        }
    }

    // PLZ und Stadt zusammenstellen (mit Escaping!)
    let plzStadt = 'N/A';
    if (eventDetails && eventDetails.zipcode && eventDetails.city) {
        // SICHERHEIT: escapeHtml() verhindert XSS
        plzStadt = escapeHtml(eventDetails.zipcode) + ' ' + escapeHtml(eventDetails.city);
    } else if (eventDetails && eventDetails.zipcode) {
        plzStadt = escapeHtml(eventDetails.zipcode);
    } else if (eventDetails && eventDetails.city) {
        plzStadt = escapeHtml(eventDetails.city);
    }

    // SICHERHEIT: Alle weiteren Felder escapen
    const revier = escapeHtml(eventDetails ? eventDetails.revier_bf_ab_2018 : null) || 'Nicht verfügbar';
    const notrufabfrage = escapeHtml(eventDetails ? eventDetails.dias_resultmedical : null) || 'Nicht verfügbar';

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
        '<div class="detail-value ' + (revier === 'Nicht verfügbar' ? 'empty' : '') + '">' +
        revier +
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
        '<div class="detail-value ' + (notrufabfrage === 'Nicht verfügbar' ? 'empty' : '') + '">' +
        notrufabfrage +
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

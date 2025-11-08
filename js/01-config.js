// ============================================================================
// FILE: js/01-config.js
// Configuration and Service URLs
// ============================================================================

const CONFIG = {
    serverUrl: "https://geoportal.feuerwehr.hamburg.de/ags",
    resourcesServicePath: "/rest/services/Geoevent/Einsatzresourcen/FeatureServer/0",
    eventsServicePath: "/rest/services/Geoevent/Einsätze_letzte_7_Tage_voll/FeatureServer/0",
    resourceType: "RTW",
    responseTimeThreshold: 90,
    travelTimeThreshold: 300, // 5 Minuten (300 Sekunden)
    autoRefreshInterval: 30000
};

const resourcesServiceUrl = CONFIG.serverUrl + CONFIG.resourcesServicePath;
const eventsServiceUrl = CONFIG.serverUrl + CONFIG.eventsServicePath;

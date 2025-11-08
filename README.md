# RTW Hilfsfrist Dashboard

Echtzeit-Dashboard zur Überwachung der Hilfsfrist-Erfüllung für Rettungswagen (RTW) der Hamburger Feuerwehr.

## 📊 Über das Dashboard

Dieses Dashboard analysiert und visualisiert die Performance von Rettungswagen basierend auf:
- **Ausrückezeit**: ≤ 90 Sekunden (Alarm → Fahrzeug fährt los)
- **Anfahrtszeit**: ≤ 5 Minuten (Fahrzeug fährt los → Einsatzort erreicht)
- **Hilfsfrist**: Kombination aus Ausrücke- und Anfahrtszeit

### Features

✅ **Echtzeit-KPI-Cards** mit Ampelschema (🟢 🟡 🔴)
✅ **90% Perzentil-Anzeige** für realistische Performance-Benchmarks
✅ **Tagesverlauf-Heatmap** zur Identifikation von Problemzeiten
✅ **Interaktive Charts** (Zeitreihe, Histogramme, Verteilung)
✅ **Detaillierte Einsatzliste** mit Toggle-Funktion
✅ **RTW-Filter** zur Analyse einzelner Fahrzeuge
✅ **Zeitfilter** inkl. "Aktuelle Schicht" (07:00-07:00 Uhr)
✅ **CSV-Export** für weitere Analysen
✅ **Auto-Refresh** alle 30 Sekunden

## 🚀 Deployment (Dienstliches Umfeld)

### Voraussetzungen
- **Keine Installation erforderlich**
- Moderner Webbrowser (Chrome, Firefox, Edge)
- Zugriff auf ArcGIS Feature Services

### Anleitung

1. **Datei öffnen**
   ```
   Doppelklick auf: dashboard.html
   ```

2. **Dashboard lädt automatisch**
   - Verbindet sich mit ArcGIS Feature Services
   - Zeigt aktuelle Einsatzdaten
   - Startet Auto-Refresh

3. **Fertig!** ✅

### Hinweise für dienstliches Umfeld

- ✅ Funktioniert direkt vom `file://` Protokoll
- ✅ Keine Installation von Software erforderlich
- ✅ Keine Build-Tools oder npm benötigt
- ✅ Alle Abhängigkeiten (ArcGIS API, Chart.js) werden von CDN geladen
- ✅ Datenschutzkonform: Keine Daten verlassen das Netzwerk

## 📁 Dateistruktur

```
dashboard_dev/
├── dashboard.html          ← Hauptdatei - Diese öffnen!
├── archive/
│   └── rtw_hilfsfrist_dashboard_v6_multi_kpi.html  ← Alte Version (Backup)
├── .gitignore
└── README.md
```

## 🎯 Ampelschema-Schwellenwerte

Die KPI-Cards färben sich automatisch basierend auf der Performance:

| Status | Schwellenwert | Bedeutung |
|--------|---------------|-----------|
| 🟢 Grün | ≥ 90% | Exzellent |
| 🟡 Gelb | 75-89% | Akzeptabel |
| 🔴 Rot | < 75% | Kritisch |

## 📈 Verwendete Technologien

- **ArcGIS JavaScript API 4.33** - Zugriff auf Feature Services
- **Chart.js 4.4.0** - Datenvisualisierung
- **Vanilla JavaScript (ES6)** - Keine externen Frameworks
- **AMD Module Pattern** - Kompatibilität mit file:// Protokoll

## 🔧 Konfiguration

Die Konfiguration befindet sich direkt in `dashboard.html`:

```javascript
const CONFIG = {
    serverUrl: "https://geoportal.feuerwehr.hamburg.de/ags",
    resourcesServicePath: "/rest/services/Geoevent/Einsatzresourcen/FeatureServer/0",
    eventsServicePath: "/rest/services/Geoevent/Einsätze_letzte_7_Tage_voll/FeatureServer/0",
    resourceType: "RTW",
    responseTimeThreshold: 90,      // Sekunden
    travelTimeThreshold: 300,       // Sekunden (5 Minuten)
    autoRefreshInterval: 30000      // Millisekunden
};
```

## 📊 Datenquellen

Das Dashboard greift auf folgende ArcGIS Feature Services zu:
1. **Einsatzresourcen** - RTW-Bewegungsdaten (time_alarm, time_on_the_way, time_arrived)
2. **Einsätze** - Einsatztypen und Kategorisierung (hilfsfristrelevant/nicht relevant)

## 🆘 Hilfsfrist-Relevanz

Nicht alle Einsätze sind hilfsfristrelevant. Folgende Einsatztypen sind **ausgeschlossen**:
- Krankentransport
- Verlegung
- Fehlalarm
- Sonstiges ohne Notfall

## 📝 Version

**Version 7** (November 2024)

Änderungen zu V6:
- ✅ Granulare Histogramme (10s bzw. 1min Schritte)
- ✅ Kompaktes Datumsformat
- ✅ Zeitfilter "Aktuelle Schicht"
- ✅ Anfahrtszeit-Schwellenwert korrigiert (5 Minuten)
- ✅ Professionelles Dashboard-Design
- ✅ 90% Perzentil-KPIs
- ✅ Tagesverlauf-Heatmap
- ✅ Ampelschema-Alarme
- ✅ Chart-Interaktionen
- ✅ Tabellen-Toggle

## 🤝 Support

Bei Fragen oder Problemen:
1. Prüfen Sie die Browser-Konsole (F12) auf Fehlermeldungen
2. Stellen Sie sicher, dass Zugriff auf ArcGIS Feature Services besteht
3. Testen Sie mit einem anderen Browser

## 📜 Lizenz

Für den internen Gebrauch der Hamburger Feuerwehr.

---

**Letzte Aktualisierung:** 08. November 2024

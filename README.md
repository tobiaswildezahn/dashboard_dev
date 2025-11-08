# RTW Hilfsfrist Dashboard - Modular Edition

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
✅ **Detaillierte Einsatzliste** mit Sortierung und Event-Details-Modal
✅ **RTW-Filter** zur Analyse einzelner Fahrzeuge
✅ **Zeitfilter** inkl. "Aktuelle Schicht" (07:00-07:00 Uhr)
✅ **CSV-Export** für weitere Analysen
✅ **Auto-Refresh** alle 30 Sekunden
✅ **Modulare Architektur** für bessere Wartbarkeit

## 🚀 Deployment (Dienstliches Umfeld)

### Voraussetzungen
- **Keine Installation erforderlich**
- Moderner Webbrowser (Chrome, Firefox, Edge)
- Zugriff auf ArcGIS Feature Services

### Anleitung

**Option 1: Modulare Version (Empfohlen)**
```
Doppelklick auf: index.html
```

**Option 2: Standalone Version (Archiv)**
```
Doppelklick auf: dashboard.html
```

Das Dashboard lädt automatisch:
- Verbindet sich mit ArcGIS Feature Services
- Zeigt aktuelle Einsatzdaten
- Startet Auto-Refresh

### Hinweise für dienstliches Umfeld

- ✅ Funktioniert direkt vom `file://` Protokoll
- ✅ Keine Installation von Software erforderlich
- ✅ Keine Build-Tools oder npm benötigt
- ✅ Alle Abhängigkeiten (ArcGIS API, Chart.js) werden von CDN geladen
- ✅ Datenschutzkonform: Keine Daten verlassen das Netzwerk

## 📁 Dateistruktur (Modulare Version)

```
dashboard_dev/
├── index.html              ← Hauptdatei (Modular) - Empfohlen!
├── dashboard.html          ← Standalone Version (Archiv)
├── README.md
├── DOCUMENTATION.md
├── css/                    ← Stylesheet Module
│   ├── 01-variables.css   (Design Tokens)
│   ├── 02-base.css        (Reset, Body, Loading)
│   ├── 03-header.css      (Header)
│   ├── 04-filters.css     (Filter, RTW Picker)
│   ├── 05-kpi-cards.css   (KPI Cards, Traffic Lights)
│   ├── 06-charts.css      (Charts)
│   ├── 07-table.css       (Table, Sorting)
│   ├── 08-modal.css       (Event Details Modal)
│   └── 09-responsive.css  (Mobile)
└── js/                     ← JavaScript Module
    ├── 01-config.js       (Konfiguration)
    ├── 02-state.js        (State Management)
    ├── 03-calculations.js (KPI Berechnungen)
    ├── 04-data.js         (Daten-Fetching)
    ├── 05-ui-kpis.js      (KPI Display)
    ├── 06-ui-charts.js    (Charts)
    ├── 07-ui-table.js     (Tabelle)
    ├── 08-ui-modal.js     (Event Details)
    ├── 09-ui-filters.js   (Filter, Export)
    └── 10-main.js         (Init, Event Listeners)
```

## 🆚 Monolithisch vs. Modular

| Aspekt | dashboard.html | index.html + Module |
|--------|----------------|---------------------|
| **Zeilen** | 2788 | 335 HTML + Module |
| **Wartbarkeit** | ❌ Schwierig | ✅ Ausgezeichnet |
| **file:// Support** | ✅ Ja | ✅ Ja |
| **Entwicklung** | ❌ Merge-Konflikte | ✅ Parallel möglich |

**Empfehlung:** Nutze `index.html` für neue Entwicklungen!

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
- **Vanilla JavaScript (ES5+)** - Keine externen Frameworks
- **AMD Module Pattern** - Kompatibilität mit file:// Protokoll
- **CSS Variables** - Konsistentes Design System

## 🔧 Konfiguration

Die Konfiguration befindet sich in `js/01-config.js`:

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

Die Logik befindet sich in `js/03-calculations.js` → `isHilfsfristRelevant()`.

## 🛠 Entwicklung

### Code ändern

**CSS:**
```bash
# Bearbeite die entsprechende Datei
vim css/05-kpi-cards.css
# Browser neu laden → Änderungen sichtbar
```

**JavaScript:**
```bash
# Bearbeite das entsprechende Modul
vim js/06-ui-charts.js
# Browser neu laden → Änderungen aktiv
```

**Wichtig:** Keine ES6 `import/export` verwenden! Nutze klassische `function` Deklarationen.

### Modul-Reihenfolge

Module werden in numerischer Reihenfolge geladen (01 → 10). Abhängigkeiten:
```
01-config.js       → Definiert CONFIG
02-state.js        → Definiert state
03-calculations.js → Nutzt CONFIG
04-data.js         → Nutzt CONFIG, state, calculations
...
10-main.js         → Nutzt ALLE Module, ruft init() auf
```

## 📝 Version

**Version 7.1 - Modular Edition** (November 2025)

Änderungen zu V7.0:
- ✅ Modulare Architektur (9 CSS + 10 JS Module)
- ✅ file:// Protokoll kompatibel
- ✅ Bessere Wartbarkeit
- ✅ Klare Trennung von Verantwortlichkeiten
- ✅ README.md aktualisiert

Änderungen zu V6:
- ✅ Granulare Histogramme (10s bzw. 1min Schritte)
- ✅ Kompaktes Datumsformat
- ✅ Zeitfilter "Aktuelle Schicht"
- ✅ 90% Perzentil-KPIs
- ✅ Tagesverlauf-Heatmap
- ✅ Ampelschema-Alarme
- ✅ Event Details Modal
- ✅ Sortierbare Tabelle

## 🤝 Support

Bei Fragen oder Problemen:
1. Prüfen Sie die Browser-Konsole (F12) auf Fehlermeldungen
2. Stellen Sie sicher, dass Zugriff auf ArcGIS Feature Services besteht
3. Testen Sie mit einem anderen Browser
4. Prüfen Sie ob alle Module korrekt geladen wurden (Network Tab)

## 📚 Weitere Dokumentation

Siehe `DOCUMENTATION.md` für:
- Detaillierte Architektur
- API-Dokumentation
- Design-Prinzipien
- KPI-Berechnungen
- Deployment-Anleitung

## 📜 Lizenz

Für den internen Gebrauch der Hamburger Feuerwehr.

---

**Letzte Aktualisierung:** 08. November 2025

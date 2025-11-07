# RTW Hilfsfrist Dashboard V7 - Browser Edition

**Keine Build-Tools erforderlich! Läuft direkt im Browser.**

## 🎯 Übersicht

Diese Version des RTW Hilfsfrist Dashboards benötigt keine Installation von npm, Node.js oder Build-Tools. Sie können die Datei einfach in Ihrem Browser öffnen.

## ✨ Features

- ✅ **Granulare Histogramme** - 10 Sekunden bzw. 1 Minute Schritte
- ✅ **Kompaktes Datumsformat** - Optimierte Zeitreihen-Darstellung (DD.MM HH:mm)
- ✅ **Schicht-Filter** - Neuer Zeitfilter für aktuelle Schicht (07:00-07:00)
- ✅ **ES6 Modules** - Modulare JavaScript-Architektur
- ✅ **Keine Build-Tools** - Läuft direkt im Browser
- ✅ **Auto-Refresh** - Alle 30 Sekunden
- ✅ **CSV-Export** - Exportieren Sie Ihre Daten
- ✅ **Responsive Design** - Funktioniert auf allen Geräten

## 🚀 Verwendung

### Option 1: Lokaler Dateisystem-Zugriff (Empfohlen)

Öffnen Sie die Datei über einen lokalen Webserver:

```bash
# Mit Python 3
cd browser-version
python3 -m http.server 8000

# Dann im Browser öffnen:
# http://localhost:8000/dashboard.html
```

### Option 2: Direktes Öffnen (Eingeschränkt)

Sie können `dashboard.html` auch direkt im Browser öffnen, aber beachten Sie:
- Einige Browser blockieren ES6 Module von `file://` URLs
- Verwenden Sie einen modernen Browser (Chrome, Firefox, Edge)
- Bei Problemen nutzen Sie Option 1

## 📁 Dateistruktur

```
browser-version/
├── dashboard.html        # Haupt-HTML-Datei (einfach öffnen!)
├── js/
│   ├── main.js          # Haupteinstiegspunkt
│   ├── utils/
│   │   ├── constants.js # Konfiguration
│   │   └── helpers.js   # Hilfsfunktionen
│   ├── services/
│   │   ├── arcgis.service.js        # ArcGIS API
│   │   ├── data-processor.service.js # Datenverarbeitung
│   │   └── export.service.js        # CSV Export
│   └── components/
│       ├── filters.js   # Filter-Logik
│       ├── kpi-cards.js # KPI-Anzeige
│       ├── charts.js    # Visualisierungen
│       └── table.js     # Tabelle
└── README.md           # Diese Datei
```

## ⚙️ Konfiguration

Passen Sie die Einstellungen in `js/utils/constants.js` an:

```javascript
export const CONFIG = {
  serverUrl: 'https://geoportal.feuerwehr.hamburg.de/ags',
  resourceType: 'RTW',
  responseTimeThreshold: 90,  // Sekunden
  travelTimeThreshold: 480,   // Sekunden (8 Minuten)
  autoRefreshInterval: 30000  // Millisekunden
};
```

## 📊 KPI-Metriken

| Metrik | Schwellenwert | Beschreibung |
|--------|---------------|--------------|
| **Ausrückezeit** | ≤ 90 Sekunden | Zeit von Alarm bis Ausrücken |
| **Anfahrtszeit** | ≤ 8 Minuten | Zeit von Ausrücken bis Eintreffen |
| **Hilfsfrist** | Beide erfüllt | Beide Schwellenwerte erreicht |

## 🔧 Browser-Kompatibilität

Getestet mit:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

**Benötigt**: ES6 Module Support

## 🎯 Zeitfilter-Optionen

- Letzte 3 Stunden
- Letzte 6 Stunden
- Letzte 12 Stunden
- Letzte 24 Stunden (Standard)
- Letzte 48 Stunden
- Letzte 72 Stunden
- **NEU**: Aktuelle Schicht (07:00-07:00)

## 📈 Granulare Histogramme

### Ausrückezeit-Bins (10 Sekunden)
- 0-10s, 10-20s, 20-30s, 30-40s, 40-50s
- 50-60s, 60-70s, 70-80s, 80-90s, >90s

### Anfahrtszeit-Bins (1 Minute)
- 0-1min, 1-2min, 2-3min, 3-4min
- 4-5min, 5-6min, 6-7min, 7-8min, >8min

## 🐛 Fehlerbehebung

### Problem: "CORS Error" oder Module können nicht geladen werden
**Lösung**: Verwenden Sie einen lokalen Webserver (siehe Option 1 oben)

### Problem: Charts werden nicht angezeigt
**Lösung**:
1. Prüfen Sie die Browser-Konsole (F12)
2. Stellen Sie sicher, dass Chart.js geladen wurde
3. Prüfen Sie die Internetverbindung

### Problem: Keine Daten werden geladen
**Lösung**:
1. Prüfen Sie die Verbindung zum ArcGIS Server
2. Öffnen Sie die Browser-Konsole für Fehlermeldungen
3. Prüfen Sie, ob die Server-URLs in constants.js korrekt sind

## 💡 Tipps

- **Auto-Refresh**: Das Dashboard aktualisiert sich automatisch alle 30 Sekunden
- **CSV-Export**: Klicken Sie auf "📥 CSV Export" um die gefilterten Daten zu exportieren
- **RTW-Filter**: Klicken Sie auf "🚑 RTW-Auswahl" um spezifische RTWs auszuwählen
- **Chart-Legende**: Klicken Sie auf Legenden-Einträge um Datenreihen ein-/auszublenden

## 📝 Version

**Version**: 7.0.0 - Browser Edition
**Letzte Aktualisierung**: 2024

## 🔗 Abhängigkeiten (CDN)

- [ArcGIS JavaScript API 4.33](https://js.arcgis.com/4.33/)
- [Chart.js 4.4.0](https://cdn.jsdelivr.net/npm/chart.js@4.4.0/)

Keine lokale Installation erforderlich!

---

**Hamburger Feuerwehr - RTW Hilfsfrist Dashboard**

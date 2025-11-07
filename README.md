# RTW Hilfsfrist Dashboard V7

Ein modernes, TypeScript-basiertes Dashboard zur Überwachung der Hilfsfrist-Kennzahlen für Rettungswagen (RTW) der Hamburger Feuerwehr.

## 🚀 Features

### V7 Neuerungen
- ✅ **TypeScript** - Vollständig typisierte Codebasis
- ✅ **Modularisierte Architektur** - Best Practice Projekt-Struktur
- ✅ **Granulare Histogramme** - 10 Sekunden bzw. 1 Minute Schritte
- ✅ **Kompaktes Datumsformat** - Optimierte Zeitreihen-Darstellung
- ✅ **Schicht-Filter** - Neuer Zeitfilter für aktuelle Schicht (07:00-07:00)
- ✅ **Vite Build System** - Schnelles Development & Optimierte Builds

### Core Features
- 📊 Echtzeit-KPI-Tracking (Ausrückezeit, Anfahrtszeit, Hilfsfrist)
- 📈 Interaktive Charts (Line, Bar, Pie)
- 🔍 Flexible Filterung (Zeitraum, RTW-Auswahl)
- 📥 CSV-Export
- 🔄 Auto-Refresh (30 Sekunden)
- 📱 Responsive Design

## 🏗️ Projekt-Struktur

```
dashboard_dev/
├── src/
│   ├── types/
│   │   └── types.ts              # TypeScript Type Definitions
│   ├── utils/
│   │   ├── constants.ts          # Konfiguration & Konstanten
│   │   └── helpers.ts            # Hilfsfunktionen
│   ├── services/
│   │   ├── arcgis.service.ts     # ArcGIS Feature Service API
│   │   ├── data-processor.service.ts  # Datenverarbeitung & KPIs
│   │   └── export.service.ts     # CSV Export
│   ├── components/
│   │   ├── filters.ts            # Filter & RTW-Picker
│   │   ├── kpi-cards.ts          # KPI-Anzeige
│   │   ├── charts.ts             # Chart.js Visualisierungen
│   │   └── table.ts              # Detaillierte Einsatzliste
│   ├── styles/
│   │   └── main.css              # Hauptstyles
│   └── main.ts                   # Einstiegspunkt & State Management
├── index.html                    # HTML Entry Point
├── tsconfig.json                 # TypeScript Konfiguration
├── vite.config.ts                # Vite Build Config
├── package.json                  # Dependencies
└── README.md                     # Diese Datei
```

## 🛠️ Installation & Setup

### Voraussetzungen
- Node.js >= 18.x
- npm oder yarn

### Installation

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# TypeScript Type-Check
npm run type-check

# Production Build
npm run build

# Build-Preview
npm run preview
```

## 📖 Verwendung

### Development
```bash
npm run dev
```
Öffnet den Development Server auf `http://localhost:3000`

### Production Build
```bash
npm run build
```
Erstellt optimierten Build in `dist/`

## 🔧 Konfiguration

### ArcGIS Services
Konfiguriert in `src/utils/constants.ts`:

```typescript
export const CONFIG = {
  serverUrl: 'https://geoportal.feuerwehr.hamburg.de/ags',
  resourcesServicePath: '/rest/services/Geoevent/Einsatzresourcen/FeatureServer/0',
  eventsServicePath: '/rest/services/Geoevent/Einsätze_letzte_7_Tage_voll/FeatureServer/0',
  resourceType: 'RTW',
  responseTimeThreshold: 90,  // Sekunden
  travelTimeThreshold: 480,   // Sekunden (8 Minuten)
  autoRefreshInterval: 30000  // Millisekunden
};
```

### Schwellenwerte
- **Ausrückezeit**: ≤ 90 Sekunden
- **Anfahrtszeit**: ≤ 8 Minuten (480 Sekunden)
- **Hilfsfrist**: Beide Schwellenwerte müssen erreicht werden

## 📊 KPI-Metriken

### Gesamteinsätze
- Anzahl hilfsfristrelevanter Einsätze
- Anzahl nicht-relevanter Einsätze (Suffix: `-NF`)

### Ausrückezeit
Zeit von Alarm bis Ausrücken (≤ 90s)

### Anfahrtszeit
Zeit von Ausrücken bis Eintreffen (≤ 8min)

### Hilfsfrist
Gesamterfüllung (Ausrücke- UND Anfahrtszeit erreicht)

## 🎨 Design-Verbesserungen V7

### Granulare Histogramme
- **Ausrückezeit**: 10-Sekunden-Schritte (0-10s, 10-20s, ..., >90s)
- **Anfahrtszeit**: 1-Minuten-Schritte (0-1min, 1-2min, ..., >8min)

### Kompaktes Datumsformat
Zeitreihen-Labels im Format: `DD.MM HH:mm`

### Schicht-Filter
Neuer Zeitfilter "Aktuelle Schicht" zeigt Daten von 07:00 Uhr des aktuellen Tages bis 07:00 Uhr des Folgetages.

## 🏛️ Architektur

### Service Layer
- **arcgis.service.ts**: API-Kommunikation mit ArcGIS Feature Services
- **data-processor.service.ts**: Datenverarbeitung, KPI-Berechnung, Aggregation
- **export.service.ts**: CSV-Export-Funktionalität

### Component Layer
- **filters.ts**: Zeit- und RTW-Filter-Logik
- **kpi-cards.ts**: KPI-Anzeige und -Aktualisierung
- **charts.ts**: Chart.js Visualisierungen (Line, Bar, Pie)
- **table.ts**: Tabellarische Detailansicht

### Utils Layer
- **constants.ts**: Zentrale Konfiguration und Konstanten
- **helpers.ts**: Wiederverwendbare Hilfsfunktionen

## 🔄 State Management

Zentrales State-Objekt in `main.ts`:
```typescript
{
  processedData: ProcessedEinsatz[],
  autoRefreshTimer: number | null
}
```

## 🧪 TypeScript

Vollständig typisierte Codebasis mit:
- Strict Mode aktiviert
- Detaillierte Interfaces für alle Datenstrukturen
- Type Guards für sichere Type-Narrowing
- Generics für wiederverwendbare Funktionen

## 📝 Lizenz

Hamburger Feuerwehr - Internes Tool

## 👥 Entwicklung

### Code Style
- ESModules (ES2020)
- Strict TypeScript
- Funktionale Programmierung wo möglich
- JSDoc-Kommentare für Public APIs

### Best Practices
- Single Responsibility Principle
- Separation of Concerns
- DRY (Don't Repeat Yourself)
- Type Safety First

## 🐛 Bekannte Probleme

Keine bekannten Probleme in V7.

## 📞 Support

Bei Fragen oder Problemen wenden Sie sich an das Entwicklerteam.

---

**Version**: 7.0.0
**Letzte Aktualisierung**: 2024
**Status**: Production Ready ✅

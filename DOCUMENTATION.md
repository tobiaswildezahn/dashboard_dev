# RTW Hilfsfrist Dashboard - Production Documentation

**Version:** 7.0
**Last Updated:** November 2024
**Status:** Production Ready
**Target Audience:** LLM-based Development, Human Developers, System Architects

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Data Model](#data-model)
4. [ArcGIS API Integration](#arcgis-api-integration)
5. [Authentication & Security](#authentication--security)
6. [Design Principles](#design-principles)
7. [Code Structure](#code-structure)
8. [Performance Metrics & KPIs](#performance-metrics--kpis)
9. [Extension Points](#extension-points)
10. [Deployment](#deployment)

---

## Executive Summary

### Purpose
The RTW Hilfsfrist Dashboard monitors and visualizes emergency response performance for Hamburg Fire Department's Rettungswagen (RTW - ambulance) fleet. It tracks compliance with legally mandated response time thresholds (Hilfsfrist).

### Core Functionality
- **Real-time KPI monitoring** with traffic light alerts (🟢 🟡 🔴)
- **Performance analytics** including 90th percentile calculations
- **Temporal analysis** via 24-hour heatmap visualization
- **Interactive filtering** by time period, individual vehicles, and shift schedules
- **Data export** capabilities for external analysis

### Technical Stack
```
Frontend:     Vanilla JavaScript (ES6), AMD Module Pattern
UI Framework: None (Custom CSS)
Charts:       Chart.js 4.4.0
Geospatial:   ArcGIS JavaScript API 4.33
Deployment:   Single HTML file, file:// protocol compatible
```

### Constraints & Design Decisions

**Critical Constraint:** No local HTTP server or npm installation permitted in deployment environment.

**Solution:** Standalone HTML file with:
- AMD modules (not ES6) for file:// compatibility
- Inline CSS and JavaScript
- CDN-loaded dependencies
- No build process

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (file://)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              dashboard.html                             │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Configuration Layer                              │  │ │
│  │  │  - CONFIG object                                  │  │ │
│  │  │  - API endpoints                                  │  │ │
│  │  │  - Thresholds                                     │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Data Layer                                       │  │ │
│  │  │  - fetchData() - API calls                       │  │ │
│  │  │  - processData() - Transformation                │  │ │
│  │  │  - State management                              │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Business Logic Layer                             │  │ │
│  │  │  - calculateKPIs()                               │  │ │
│  │  │  - calculatePercentile()                         │  │ │
│  │  │  - isHilfsfristRelevant()                        │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Presentation Layer                               │  │ │
│  │  │  - updateKPIs() - Cards with traffic lights     │  │ │
│  │  │  - updateCharts() - 4 visualizations            │  │ │
│  │  │  - updateTable() - Detailed records             │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              ArcGIS Feature Services                         │
│                                                               │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │ Einsatzresourcen        │  │ Einsätze                │   │
│  │ FeatureServer/0         │  │ FeatureServer/0         │   │
│  │                         │  │                         │   │
│  │ - time_alarm            │  │ - id                    │   │
│  │ - time_on_the_way       │  │ - nameeventtype         │   │
│  │ - time_arrived          │  │                         │   │
│  │ - call_sign (RTW ID)    │  │                         │   │
│  │ - nameresourcetype      │  │                         │   │
│  │ - idevent (FK)          │  │                         │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User Opens Dashboard (file://dashboard.html)
   ↓
2. AMD Module Loader (require.js via ArcGIS API)
   ↓
3. init() → fetchData()
   ↓
4. Parallel API Requests:
   - esriRequest(resourcesServiceUrl/query) ──┐
   - esriRequest(eventsServiceUrl/query) ─────┤
   ↓                                           │
5. Promise.all([...]) ←───────────────────────┘
   ↓
6. processData(resources, events)
   - Join by idevent
   - Calculate response/travel times
   - Evaluate thresholds
   - Filter relevance
   ↓
7. State Update (state.processedData)
   ↓
8. UI Update Pipeline:
   - updateKPIs() → Traffic light evaluation
   - updateCharts() → 4 Chart.js instances
   - updateTable() → Tabular display
   ↓
9. Auto-refresh Timer (30s) → Loop to step 3
```

---

## Data Model

### ArcGIS Feature Schema

#### Einsatzresourcen (Resource Movements)

**Endpoint:** `https://geoportal.feuerwehr.hamburg.de/ags/rest/services/Geoevent/Einsatzresourcen/FeatureServer/0`

**Fields:**
```javascript
{
  // Primary Identifiers
  "OBJECTID": Number,              // Unique record ID
  "call_sign": String,             // RTW identifier (e.g., "RTW 12/83-01")
  "nameresourcetype": String,      // Resource type (Filter: "RTW")
  "idevent": Number,               // Foreign key to Einsätze table

  // Temporal Data (Unix timestamps in milliseconds)
  "time_alarm": Number,            // Timestamp: Alarm received
  "time_on_the_way": Number,       // Timestamp: Vehicle departed
  "time_arrived": Number,          // Timestamp: Arrived at scene
  "time_deployed": Number,         // Timestamp: Started patient care
  "time_transport": Number,        // Timestamp: Departed to hospital
  "time_available": Number,        // Timestamp: Back in service

  // Geospatial (not used in current implementation)
  "geometry": Object | null
}
```

**Example Response:**
```json
{
  "features": [
    {
      "attributes": {
        "OBJECTID": 123456,
        "call_sign": "RTW 12/83-01",
        "nameresourcetype": "RTW",
        "idevent": 789,
        "time_alarm": 1699372800000,
        "time_on_the_way": 1699372845000,
        "time_arrived": 1699373100000,
        "time_deployed": 1699373120000,
        "time_transport": 1699373900000,
        "time_available": 1699374500000
      }
    }
  ]
}
```

#### Einsätze (Incident Types)

**Endpoint:** `https://geoportal.feuerwehr.hamburg.de/ags/rest/services/Geoevent/Einsätze_letzte_7_Tage_voll/FeatureServer/0`

**Fields:**
```javascript
{
  "id": Number,                    // Primary key (matches idevent)
  "nameeventtype": String,         // Incident type classification
  "alarmtime": Number              // Timestamp: Alarm time
}
```

**Example Response:**
```json
{
  "features": [
    {
      "attributes": {
        "id": 789,
        "nameeventtype": "Internistischer Notfall",
        "alarmtime": 1699372800000
      }
    }
  ]
}
```

### Processed Data Model

After data processing, records are transformed into:

```typescript
interface ProcessedEinsatz {
  // Original fields from Einsatzresourcen
  OBJECTID: number;
  call_sign: string;
  nameresourcetype: string;
  idevent: number;
  time_alarm: number;
  time_on_the_way: number | null;
  time_arrived: number | null;
  // ... other timestamp fields

  // Joined from Einsätze
  nameeventtype: string | null;

  // Computed Performance Metrics (in seconds)
  responseTime: number | null;      // time_on_the_way - time_alarm
  travelTime: number | null;        // time_arrived - time_on_the_way

  // Threshold Compliance (boolean)
  responseAchieved: boolean | null; // responseTime <= 90s
  travelAchieved: boolean | null;   // travelTime <= 300s
  hilfsfristAchieved: boolean | null; // responseAchieved && travelAchieved

  // Business Logic Classification
  isHilfsfristRelevant: boolean;    // Based on nameeventtype
}
```

### Hilfsfrist Relevance Classification

**Relevant Incidents** (included in KPI calculations):
- All incidents EXCEPT those with nameeventtype ending in `-NF` (Nicht-Fehlalarm)
- Categories: Medical emergencies, accidents, fires requiring ambulance

**Non-Relevant Incidents** (excluded from KPIs):
- Suffix: `-NF`
- Examples:
  - `"Krankentransport-NF"` (Patient transport)
  - `"Verlegung-NF"` (Inter-facility transfer)
  - `"Fehlalarm-NF"` (False alarm)

**Implementation:**
```javascript
function isHilfsfristRelevant(nameeventtype) {
    if (!nameeventtype) return true;
    return !nameeventtype.endsWith('-NF');
}
```

### KPI Data Structure

```javascript
const kpis = {
  // Total Counts
  total: number,                    // All records
  relevantCount: number,            // Hilfsfrist-relevant
  notRelevantCount: number,         // Not relevant
  relevantPercentage: number,       // (relevant / total) * 100
  notRelevantPercentage: number,    // (notRelevant / total) * 100

  // Response Time (Ausrückezeit)
  responseAchieved: number,         // Count meeting ≤90s threshold
  responseTotal: number,            // Total with valid responseTime
  responsePercentage: number,       // (achieved / total) * 100
  response90Percentile: number,     // 90th percentile in seconds

  // Travel Time (Anfahrtszeit)
  travelAchieved: number,           // Count meeting ≤300s threshold
  travelTotal: number,              // Total with valid travelTime
  travelPercentage: number,         // (achieved / total) * 100
  travel90Percentile: number,       // 90th percentile in seconds

  // Hilfsfrist (Combined)
  hilfsfristAchieved: number,       // Both thresholds met
  hilfsfristTotal: number,          // Total with both metrics
  hilfsfristPercentage: number      // (achieved / total) * 100
}
```

---

## ArcGIS API Integration

### API Architecture

The dashboard uses **ArcGIS JavaScript API 4.33** with the **AMD module system** (NOT ES6 modules) for file:// protocol compatibility.

### Module Loading

```javascript
// AMD Module Pattern (RequireJS)
require([
    "esri/request"  // Only module needed
], function(esriRequest) {
    // All application code here
});
```

**Why AMD, not ES6:**
- ES6 modules (`import/export`) fail with CORS on file:// protocol
- AMD modules work natively with file://
- ArcGIS API uses AMD internally

### API Endpoints

#### Resource Service

**Base URL:**
```
https://geoportal.feuerwehr.hamburg.de/ags/rest/services/Geoevent/Einsatzresourcen/FeatureServer/0
```

**Query Endpoint:**
```
GET /query
```

**Parameters:**
```javascript
{
  where: String,           // SQL WHERE clause
  outFields: String,       // Comma-separated field list or "*"
  f: "json",              // Response format
  returnGeometry: Boolean  // Include spatial data (false for performance)
}
```

**Example Request:**
```javascript
await esriRequest(resourcesServiceUrl + "/query", {
    query: {
        where: "nameresourcetype = 'RTW' AND time_alarm > CURRENT_TIMESTAMP - INTERVAL '24' HOUR",
        outFields: "*",
        f: "json",
        returnGeometry: false
    },
    responseType: "json"
});
```

#### Event Service

**Base URL:**
```
https://geoportal.feuerwehr.hamburg.de/ags/rest/services/Geoevent/Einsätze_letzte_7_Tage_voll/FeatureServer/0
```

**Query Endpoint:**
```
GET /query
```

**Parameters:** Same as Resource Service

**Example Request:**
```javascript
await esriRequest(eventsServiceUrl + "/query", {
    query: {
        where: "alarmtime > CURRENT_TIMESTAMP - INTERVAL '24' HOUR",
        outFields: "id,nameeventtype",
        f: "json",
        returnGeometry: false
    },
    responseType: "json"
});
```

### WHERE Clause Syntax

#### Time-Based Filtering

**Relative Time (Standard):**
```sql
-- Last 24 hours
time_alarm > CURRENT_TIMESTAMP - INTERVAL '24' HOUR

-- Last N hours (parameterized)
time_alarm > CURRENT_TIMESTAMP - INTERVAL '${hours}' HOUR
```

**Absolute Time Range (Shift Filter):**
```sql
-- Current shift (07:00 - 07:00)
time_alarm >= DATE '2024-11-08 06:00:00'
AND time_alarm < DATE '2024-11-09 06:00:00'
```

**Important:**
- Use `DATE` keyword for absolute timestamps
- Format: `'YYYY-MM-DD HH:MM:SS'` (UTC)
- Local time must be converted to UTC

**Timezone Handling:**
```javascript
function formatDateToSQL(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Usage
const localTime = new Date();
localTime.setHours(7, 0, 0, 0);
const utcTimestamp = formatDateToSQL(localTime);
// Result: "2024-11-08 06:00:00" (for UTC+1)
```

#### Resource Type Filtering

```sql
-- RTW only
nameresourcetype = 'RTW'

-- Combined filters
nameresourcetype = 'RTW' AND time_alarm > CURRENT_TIMESTAMP - INTERVAL '24' HOUR
```

### Parallel Data Fetching

**Strategy:** Fetch both services simultaneously for performance.

```javascript
const [resourceResponse, eventResponse] = await Promise.all([
    esriRequest(resourcesServiceUrl + "/query", { /* ... */ }),
    esriRequest(eventsServiceUrl + "/query", { /* ... */ })
]);
```

**Benefits:**
- Reduced total wait time
- Single round-trip delay
- Automatic error handling via Promise.all

### Data Joining

**Join Strategy:** In-memory hash map join

```javascript
function processData(rawResourceFeatures, rawEventFeatures) {
    // Build event lookup map
    const eventMap = {};
    rawEventFeatures.forEach(feature => {
        eventMap[feature.attributes.id] = feature.attributes;
    });

    // Join and transform
    return rawResourceFeatures.map(feature => {
        const attrs = feature.attributes;
        const eventData = eventMap[attrs.idevent] || {};
        const nameeventtype = eventData.nameeventtype || null;

        // Calculate metrics, evaluate thresholds...
        return { /* ProcessedEinsatz */ };
    });
}
```

---

## Authentication & Security

### Current Authentication Model

**Authentication Type:** None (Public ArcGIS Feature Service)

**Access Control:**
- Services are publicly accessible
- No API key or token required
- CORS headers permit browser access

**Security Considerations:**
```javascript
// No credentials in code
const CONFIG = {
    serverUrl: "https://geoportal.feuerwehr.hamburg.de/ags",
    // No apiKey, token, or credentials
};
```

### Token-Based Authentication (Future Implementation)

If authentication becomes required, ArcGIS supports OAuth 2.0 and token-based auth:

#### OAuth 2.0 Flow

```javascript
// Step 1: Load Identity Manager
require([
    "esri/request",
    "esri/identity/IdentityManager"
], function(esriRequest, esriId) {

    // Step 2: Register token or OAuth app
    esriId.registerToken({
        server: "https://geoportal.feuerwehr.hamburg.de/ags",
        token: "YOUR_ACCESS_TOKEN",
        expires: Date.now() + 3600000 // 1 hour
    });

    // Step 3: Requests automatically include token
    const response = await esriRequest(resourcesServiceUrl + "/query", {
        query: { /* ... */ }
    });
});
```

#### Token Generation

**Option 1: Pre-generated Token**
```bash
# Generate via ArcGIS Portal
curl -X POST "https://geoportal.feuerwehr.hamburg.de/ags/tokens/generateToken" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD" \
  -d "expiration=60" \
  -d "f=json"
```

**Option 2: OAuth 2.0 App**
```javascript
esriId.getCredential(portalUrl, {
    oAuthPopupConfirmation: false
}).then(credential => {
    // credential.token available for API calls
});
```

#### Security Best Practices

**For Future Token Implementation:**

1. **Token Storage:**
   ```javascript
   // Store token securely in sessionStorage (not localStorage)
   sessionStorage.setItem('arcgis_token', token);

   // Clear on logout
   window.addEventListener('beforeunload', () => {
       sessionStorage.removeItem('arcgis_token');
   });
   ```

2. **Token Refresh:**
   ```javascript
   function refreshToken(oldToken) {
       return esriId.generateToken(serverInfo, {
           token: oldToken
       });
   }

   // Auto-refresh before expiration
   setInterval(refreshToken, 3000000); // 50 minutes
   ```

3. **Error Handling:**
   ```javascript
   try {
       const response = await esriRequest(url, options);
   } catch (error) {
       if (error.details?.httpStatus === 401) {
           // Token expired - redirect to login
           window.location.href = '/login';
       }
   }
   ```

### CORS Configuration

**Current Setup:** Server has CORS enabled for browser access.

**Headers Required:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type
```

**Proxy Alternative (if CORS disabled):**
```javascript
// Use ArcGIS proxy service
esriRequest.setRequestPreCallback((ioArgs) => {
    ioArgs.url = proxyUrl + "?" + ioArgs.url;
    return ioArgs;
});
```

---

## Design Principles

### Visual Design System

#### Color Palette

**Brand Colors:**
```css
--primary-color: #c8102e;      /* Hamburg Fire Department Red */
--primary-dark: #a00d25;       /* Darker red for interactions */
```

**Semantic Colors:**
```css
--success-color: #10b981;      /* Green - Good performance */
--warning-color: #f59e0b;      /* Amber - Acceptable performance */
--danger-color: #ef4444;       /* Red - Critical performance */
--info-color: #3b82f6;         /* Blue - Informational */
```

**Neutrals:**
```css
--gray-50: #f9fafb;            /* Backgrounds */
--gray-100: #f3f4f6;           /* Subtle backgrounds */
--gray-200: #e5e7eb;           /* Borders */
--gray-300: #d1d5db;           /* Disabled states */
--gray-400: #9ca3af;           /* Placeholders */
--gray-600: #4b5563;           /* Secondary text */
--gray-700: #374151;           /* Primary text */
--gray-900: #111827;           /* Headings */
```

#### Traffic Light System

**Threshold Definition:**
```javascript
function getThresholdStatus(percentage) {
    if (percentage >= 90) return {
        status: 'green',
        emoji: '🟢',
        text: 'Exzellent (≥90%)'
    };
    if (percentage >= 75) return {
        status: 'yellow',
        emoji: '🟡',
        text: 'Akzeptabel (75-89%)'
    };
    return {
        status: 'red',
        emoji: '🔴',
        text: 'Kritisch (<75%)'
    };
}
```

**Visual Application:**

1. **Border-Left Color:**
   ```css
   .kpi-card.kpi-status-green {
       border-left-color: var(--success-color);
   }
   ```

2. **Background Gradient (3% opacity):**
   ```css
   .kpi-card.kpi-status-green {
       background: linear-gradient(to right, rgba(16, 185, 129, 0.03), white);
   }
   ```

3. **Animated Status Badge:**
   ```css
   .kpi-status-badge {
       position: absolute;
       top: 12px;
       right: 12px;
       font-size: 24px;
       animation: pulse-slow 3s ease-in-out infinite;
   }

   @keyframes pulse-slow {
       0%, 100% { opacity: 1; transform: scale(1); }
       50% { opacity: 0.7; transform: scale(1.1); }
   }
   ```

4. **Status Information Bar:**
   ```css
   .kpi-threshold-info.threshold-green {
       background: rgba(16, 185, 129, 0.05);
       border-left-color: var(--success-color);
       color: #059669;
   }
   ```

#### Typography

**Font Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

**Type Scale:**
```
Headers:
- h1: 22px, 700 weight
- h2: 16px, 600 weight
- h3: 13px, 600 weight

Body:
- Default: 13px, 500 weight
- Small: 11-12px, 500 weight

KPI Values:
- Large: 36px, 700 weight
- Standard: 32px, 700 weight
```

#### Spacing System

**Base Unit:** 4px

**Scale:**
```
4px  → micro spacing
8px  → small gaps
12px → medium gaps
16px → standard gaps
20px → large gaps
24px → section spacing
```

**Grid Layout:**
```css
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 16px;
}
```

#### Shadows & Depth

**Minimalist Approach:**
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.03);   /* Subtle */
--shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);      /* Standard */
--shadow-md: 0 2px 4px 0 rgb(0 0 0 / 0.06);   /* Hover state */
```

**Application:**
- Cards: `box-shadow: var(--shadow)`
- Hover: `box-shadow: var(--shadow-md)`
- No heavy shadows (removed shadow-xl, shadow-lg)

#### Border Radius

**Consistency:**
```
Cards: 8px
Buttons: 8px
Inputs: 8px
Badges: 6px (smaller elements)
Tables: 6px
```

### Dashboard Design Principles

#### 1. Information Hierarchy

**Top → Bottom:**
```
Header (Identity & Status)
  ↓
Filters (User Controls)
  ↓
KPIs (Primary Metrics) ← Most Important
  ↓
Charts (Analytical Views)
  ↓
Heatmap (Temporal Patterns)
  ↓
Table (Detailed Data)
```

#### 2. Progressive Disclosure

- **Initially Visible:** KPIs and primary chart
- **Collapsible:** Table (toggle to reduce clutter)
- **On-Demand:** RTW picker (expandable section)

#### 3. Data Density vs. Readability

**Balance:**
- Dense where needed (table, heatmap)
- Spacious for KPIs (large numbers, clear status)
- Compact dates in charts (DD.MM HH:mm)

#### 4. Responsive Design

**Grid Behavior:**
```css
/* Auto-fit: Creates as many columns as fit */
grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));

/* Benefits:
   - 4 KPIs on wide screens
   - 2 KPIs on tablets
   - 1 KPI on mobile
*/
```

#### 5. Performance-First

**Optimization Strategies:**

1. **Debounced Updates:**
   ```javascript
   // Don't update on every keystroke
   let updateTimeout;
   function debouncedUpdate() {
       clearTimeout(updateTimeout);
       updateTimeout = setTimeout(updateDashboard, 300);
   }
   ```

2. **Conditional Rendering:**
   ```javascript
   // Only update visible charts
   if (state.chartVisibility.hilfsfrist) {
       updateLineChart(data);
   }
   ```

3. **Destroy Before Recreate:**
   ```javascript
   // Prevent memory leaks
   if (state.lineChart) {
       state.lineChart.destroy();
   }
   state.lineChart = new Chart(ctx, config);
   ```

#### 6. Accessibility

**Color Independence:**
- Traffic lights use color + emoji + text
- Charts use patterns where possible
- Sufficient contrast ratios (WCAG AA)

**Keyboard Navigation:**
- All interactive elements are focusable
- Visual focus indicators
- Logical tab order

**Screen Readers:**
```html
<div class="kpi-value" aria-label="Response time achievement: 92 percent">
    <span id="responsePercentage">92</span>%
</div>
```

---

## Code Structure

### File Organization

**Single File Structure:**
```
dashboard.html
├── <!DOCTYPE html>
├── <head>
│   ├── Meta tags
│   ├── Title
│   ├── ArcGIS CSS (CDN)
│   ├── Chart.js (CDN)
│   └── <style> ... </style>
├── <body>
│   ├── Dashboard Container
│   │   ├── Header
│   │   ├── Filter Panel
│   │   ├── KPI Grid
│   │   ├── Charts Grid
│   │   ├── Heatmap
│   │   └── Data Table
│   ├── Loading Overlay
│   ├── Toast Messages
│   ├── <script src="ArcGIS API">
│   └── <script>
│       └── require(['esri/request'], function(esriRequest) {
│           ├── CONFIGURATION
│           ├── STATE MANAGEMENT
│           ├── HELPER FUNCTIONS
│           ├── DATA PROCESSING
│           ├── KPI CALCULATION
│           ├── CHARTS
│           ├── TABLE
│           ├── EXPORT
│           ├── UI INTERACTIONS
│           └── INITIALIZATION
│       })
└── </body>
```

### Code Sections (Inline JavaScript)

#### 1. Configuration
```javascript
// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    serverUrl: "...",
    resourcesServicePath: "...",
    eventsServicePath: "...",
    resourceType: "RTW",
    responseTimeThreshold: 90,
    travelTimeThreshold: 300,
    autoRefreshInterval: 30000
};
```

#### 2. State Management
```javascript
// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
    processedData: [],
    selectedRtwList: [],
    autoRefreshTimer: null,
    chartVisibility: {
        hilfsfrist: true,
        response: true,
        travel: true
    }
};

state.lineChart = null;
state.barChart = null;
state.pieChart = null;
state.heatmapChart = null;
```

#### 3. Helper Functions
```javascript
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimestamp(timestamp) { /* ... */ }
function formatCompactTimestamp(timestamp) { /* ... */ }
function getCurrentShiftTimes() { /* ... */ }
function formatDateToSQL(date) { /* ... */ }
function calculatePercentile(values, percentile) { /* ... */ }
```

#### 4. Business Logic
```javascript
// ============================================================================
// HILFSFRIFT-RELEVANZ-SYSTEM
// ============================================================================

function isHilfsfristRelevant(nameeventtype) { /* ... */ }

// ============================================================================
// DATA PROCESSING
// ============================================================================

function processData(rawResourceFeatures, rawEventFeatures) { /* ... */ }

// ============================================================================
// KPI CALCULATION & UPDATE
// ============================================================================

function calculateKPIs(data) { /* ... */ }
function updateKPIs(data) { /* ... */ }
function getThresholdStatus(percentage) { /* ... */ }
function updateKPIStatus(cardId, badgeId, infoId, percentage) { /* ... */ }
```

#### 5. Data Fetching
```javascript
// ============================================================================
// DATA FETCHING - MULTI-LAYER
// ============================================================================

async function fetchData(options = {}) {
    const timeFilterValue = document.getElementById('timeFilter').value;
    let whereClause, eventWhereClause;

    // Build WHERE clauses
    if (timeFilterValue === 'current-shift') {
        // Absolute time range
    } else {
        // Relative time range
    }

    // Parallel fetch
    const [resourceResponse, eventResponse] = await Promise.all([
        esriRequest(resourcesServiceUrl + "/query", { /* ... */ }),
        esriRequest(eventsServiceUrl + "/query", { /* ... */ })
    ]);

    // Process and update
    state.processedData = processData(
        resourceResponse.data.features,
        eventResponse.data.features
    );

    updateDashboard();
}
```

#### 6. Visualization
```javascript
// ============================================================================
// CHARTS
// ============================================================================

function updateLineChart(data) { /* Multi-KPI time series */ }
function updateBarChart(data) { /* Histogram distributions */ }
function updatePieChart(data) { /* Achievement ratio */ }
function updateHeatmap(data) { /* 24-hour performance */ }

// ============================================================================
// TABLE
// ============================================================================

function updateTable(data) { /* Detailed records */ }

// ============================================================================
// EXPORT
// ============================================================================

function exportCSV() { /* CSV download */ }
```

#### 7. UI Interactions
```javascript
// ============================================================================
// RTW PICKER
// ============================================================================

function populateRtwPicker(rtwList) { /* ... */ }
function onRtwSelectionChange() { /* ... */ }
function filterBySelectedRtw(data) { /* ... */ }

// ============================================================================
// AUTO-REFRESH
// ============================================================================

function startAutoRefresh() {
    state.autoRefreshTimer = setInterval(() => {
        fetchData({
            updateFilters: false,
            showLoadingIndicator: false,
            showSuccessMessage: false
        });
    }, CONFIG.autoRefreshInterval);
}

function stopAutoRefresh() {
    clearInterval(state.autoRefreshTimer);
}
```

#### 8. Initialization
```javascript
// ============================================================================
// INITIALIZATION
// ============================================================================

async function init() {
    console.log('Dashboard initialisiert');

    // Load saved chart visibility
    const savedVisibility = localStorage.getItem('rtwDashboardChartVisibility');
    if (savedVisibility) {
        state.chartVisibility = JSON.parse(savedVisibility);
    }

    // Setup table toggle
    const tableToggleHeader = document.getElementById('tableToggleHeader');
    tableToggleHeader.addEventListener('click', () => { /* ... */ });

    // Initial data fetch
    await fetchData();

    // Start auto-refresh
    startAutoRefresh();
}

init();
```

### Naming Conventions

**Functions:**
- `camelCase`
- Verb-first: `fetchData()`, `updateKPIs()`, `calculatePercentile()`
- Predicate functions: `isHilfsfristRelevant()`

**Variables:**
- `camelCase`
- Descriptive: `processedData`, `timeFilterValue`, `responsePercentage`

**Constants:**
- `UPPER_SNAKE_CASE` for true constants: `CONFIG`
- `camelCase` for config objects: `CONFIG.serverUrl`

**DOM IDs:**
- `camelCase`: `tableRecordCount`, `responsePercentage`
- Semantic: Element type + purpose

**CSS Classes:**
- `kebab-case`: `kpi-card`, `traffic-light-green`
- BEM-inspired for components: `.kpi-card`, `.kpi-card__title`

---

## Performance Metrics & KPIs

### Threshold Definitions

**Response Time (Ausrückezeit):**
- **Threshold:** ≤ 90 seconds
- **Measurement:** `time_on_the_way - time_alarm`
- **Legal Basis:** Hamburg Fire Department regulations

**Travel Time (Anfahrtszeit):**
- **Threshold:** ≤ 300 seconds (5 minutes)
- **Measurement:** `time_arrived - time_on_the_way`
- **Legal Basis:** Hamburg Fire Department regulations

**Hilfsfrist (Emergency Response Time):**
- **Threshold:** Both response AND travel time met
- **Measurement:** `responseAchieved && travelAchieved`
- **Target:** 95% compliance (Hamburg Fire Department goal)

### Statistical Methods

#### Percentile Calculation

```javascript
/**
 * Calculates the nth percentile of a dataset
 *
 * @param {number[]} values - Array of numeric values
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number|null} Percentile value or null if empty
 *
 * Algorithm: Nearest-rank method
 * - Sort values ascending
 * - Calculate index: ceil((percentile / 100) * length) - 1
 * - Return value at index
 */
function calculatePercentile(values, percentile) {
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
}

// Example:
// Values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
// 90th Percentile: Index = ceil(0.90 * 10) - 1 = 9 - 1 = 8
// Result: 90
```

#### Histogram Binning

**Response Time Bins (10-second intervals):**
```javascript
const responseBins = {
    '0-10s': 0, '10-20s': 0, '20-30s': 0, '30-40s': 0, '40-50s': 0,
    '50-60s': 0, '60-70s': 0, '70-80s': 0, '80-90s': 0, '>90s': 0
};

responseValid.forEach(item => {
    const t = item.responseTime;
    if (t <= 10) responseBins['0-10s']++;
    else if (t <= 20) responseBins['10-20s']++;
    // ... etc
    else responseBins['>90s']++;
});
```

**Travel Time Bins (1-minute intervals):**
```javascript
const travelBins = {
    '0-1min': 0, '1-2min': 0, '2-3min': 0, '3-4min': 0,
    '4-5min': 0, '>5min': 0
};

travelValid.forEach(item => {
    const t = item.travelTime;
    if (t <= 60) travelBins['0-1min']++;
    else if (t <= 120) travelBins['1-2min']++;
    // ... etc
    else travelBins['>5min']++;
});
```

#### Hourly Aggregation (Heatmap)

```javascript
// Initialize 24-hour array
const hourlyData = Array(24).fill(0).map(() => ({
    total: 0,
    achieved: 0
}));

// Aggregate by hour
relevantData.forEach(item => {
    const alarmDate = new Date(item.time_alarm);
    const hour = alarmDate.getHours(); // 0-23

    if (item.hilfsfristAchieved !== null) {
        hourlyData[hour].total++;
        if (item.hilfsfristAchieved) {
            hourlyData[hour].achieved++;
        }
    }
});

// Calculate percentages
const percentages = hourlyData.map(h =>
    h.total > 0 ? (h.achieved / h.total * 100).toFixed(1) : null
);
```

---

## Extension Points

### Adding New Time Filters

**Location:** Filter Controls Section

```javascript
// 1. Add <option> to HTML
<select id="timeFilter">
    <!-- Existing options -->
    <option value="168">Letzte 7 Tage</option>  <!-- NEW -->
</select>

// 2. No code change needed - dynamic parsing
const hours = parseInt(timeFilterValue); // Automatically works
whereClause = `... INTERVAL '${hours}' HOUR`;
```

### Adding New KPI Cards

**Template:**
```html
<!-- 1. Add HTML -->
<div class="kpi-card" id="newMetricCard">
    <span class="kpi-status-badge" id="newMetricStatusBadge"></span>
    <div class="kpi-header">
        <div>
            <div class="kpi-title">New Metric</div>
            <div class="kpi-label">Description</div>
        </div>
        <div class="kpi-icon">📊</div>
    </div>
    <div class="kpi-value">
        <span id="newMetricValue">0</span>%
    </div>
    <div class="kpi-label">
        <span id="newMetricAchieved">0</span> von <span id="newMetricTotal">0</span>
    </div>
    <div class="kpi-threshold-info" id="newMetricThresholdInfo">
        Status wird berechnet...
    </div>
</div>
```

```javascript
// 2. Extend calculateKPIs()
function calculateKPIs(data) {
    // ... existing calculations ...

    // Add new metric
    const newMetricValid = relevantData.filter(d => d.newField !== null);
    const newMetricAchieved = newMetricValid.filter(d => d.newField <= threshold).length;
    const newMetricPercentage = newMetricValid.length > 0
        ? (newMetricAchieved / newMetricValid.length * 100)
        : 0;

    return {
        // ... existing KPIs ...
        newMetricAchieved,
        newMetricTotal: newMetricValid.length,
        newMetricPercentage
    };
}

// 3. Update updateKPIs()
function updateKPIs(data) {
    const kpis = calculateKPIs(data);

    // ... existing updates ...

    // Update new metric
    document.getElementById('newMetricValue').textContent = Math.round(kpis.newMetricPercentage);
    document.getElementById('newMetricAchieved').textContent = kpis.newMetricAchieved;
    document.getElementById('newMetricTotal').textContent = kpis.newMetricTotal;

    // Apply traffic light
    updateKPIStatus('newMetricCard', 'newMetricStatusBadge', 'newMetricThresholdInfo', kpis.newMetricPercentage);
}
```

### Adding New Charts

**Chart.js Integration:**
```javascript
// 1. Add canvas to HTML
<div class="chart-card">
    <div class="chart-container">
        <canvas id="newChart"></canvas>
    </div>
</div>

// 2. Create update function
function updateNewChart(data) {
    // Process data
    const chartData = processDataForChart(data);

    // Destroy existing
    if (state.newChart) {
        state.newChart.destroy();
    }

    // Create new chart
    const ctx = document.getElementById('newChart').getContext('2d');
    state.newChart = new Chart(ctx, {
        type: 'bar', // or 'line', 'pie', 'doughnut', 'radar', etc.
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'New Metric',
                data: chartData.values,
                backgroundColor: 'rgba(59, 130, 246, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'New Chart Title'
                }
            }
        }
    });
}

// 3. Add to state
state.newChart = null;

// 4. Call in updateCharts()
function updateCharts(data) {
    updateLineChart(data);
    updateBarChart(data);
    updatePieChart(data);
    updateHeatmap(data);
    updateNewChart(data); // NEW
}
```

### Adding Export Formats

**Example: JSON Export**
```javascript
function exportJSON() {
    const data = filterBySelectedRtw(state.processedData);

    if (data.length === 0) {
        showMessage('Keine Daten zum Exportieren', 'error');
        return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rtw_data_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showMessage('✅ JSON-Export erfolgreich', 'success');
}

// Add button
<button class="btn btn-secondary" onclick="exportJSON()">
    📄 JSON Export
</button>
```

### Modularization Path (Future)

**Step 1: Extract Configuration**
```javascript
// config.js (AMD module)
define(function() {
    return {
        serverUrl: "...",
        resourcesServicePath: "...",
        // ... etc
    };
});

// main.js
require(['config'], function(CONFIG) {
    // Use CONFIG
});
```

**Step 2: Extract Services**
```javascript
// services/arcgis.service.js
define(['config'], function(CONFIG) {
    async function fetchResources(whereClause) {
        return await esriRequest(/* ... */);
    }

    return {
        fetchResources,
        fetchEvents
    };
});
```

**Step 3: Extract Components**
```javascript
// components/kpi-cards.js
define(function() {
    function updateKPIs(data) { /* ... */ }
    return { updateKPIs };
});
```

---

## Deployment

### Production Checklist

- [x] Single HTML file (dashboard.html)
- [x] No external dependencies (except CDN)
- [x] File:// protocol compatible
- [x] No build process required
- [x] CORS-compliant API calls
- [x] Auto-refresh implemented
- [x] Error handling in place
- [x] Traffic light alerts active
- [x] localStorage for persistence
- [x] Responsive design
- [x] Accessibility features
- [x] Performance optimized

### Deployment Steps

1. **Download File:**
   ```bash
   git clone <repository>
   cd dashboard_dev
   ```

2. **Open Dashboard:**
   ```
   Double-click: dashboard.html
   ```

3. **Verify:**
   - Check browser console (F12) for errors
   - Confirm data loads
   - Test all filters
   - Validate KPI calculations

### Browser Compatibility

**Supported:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Required Features:**
- ES6 (arrow functions, const/let, async/await)
- Fetch API / XMLHttpRequest
- CSS Grid
- CSS Custom Properties (variables)
- localStorage

### Performance Benchmarks

**Target Metrics:**
- Initial load: < 2 seconds
- Data fetch: < 1 second
- Chart render: < 500ms
- Auto-refresh: No UI jank

**Optimization:**
- Parallel API calls (Promise.all)
- Canvas chart rendering (not SVG)
- Minimal DOM manipulation
- Debounced filter updates

### Monitoring

**Client-Side Logging:**
```javascript
// Enabled by default
console.log('✅ Daten erfolgreich geladen (${count} Einträge)');
console.error('Fehler beim Laden der Daten:', error);
```

**Error Tracking:**
```javascript
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Optional: Send to logging service
});
```

---

## Appendix

### Glossary

- **RTW**: Rettungswagen (Ambulance)
- **Hilfsfrist**: Emergency response time (legally mandated)
- **Ausrückezeit**: Response time (alarm → vehicle departs)
- **Anfahrtszeit**: Travel time (departs → arrives at scene)
- **KPI**: Key Performance Indicator
- **AMD**: Asynchronous Module Definition
- **CORS**: Cross-Origin Resource Sharing
- **CDN**: Content Delivery Network

### References

- **ArcGIS JavaScript API Documentation:** https://developers.arcgis.com/javascript/latest/
- **Chart.js Documentation:** https://www.chartjs.org/docs/latest/
- **Hamburg Fire Department:** https://www.hamburg.de/feuerwehr/

### Version History

**Version 7.0 (November 2024):**
- Traffic light threshold alerts
- 90% percentile KPIs
- 24-hour performance heatmap
- Table toggle functionality
- Chart interaction (clickable)
- Shift filter (07:00-07:00)
- Professional design overhaul
- Repository cleanup

**Version 6.0:**
- Multi-KPI dashboard
- Hilfsfrist relevance system
- RTW picker
- CSV export
- Auto-refresh

---

**Document Version:** 1.0
**Last Updated:** 2024-11-08
**Maintained By:** Dashboard Development Team
**For LLM Context:** This document provides complete technical context for AI-assisted development. All implementation details, data models, and extension points are documented for autonomous code generation and enhancement.

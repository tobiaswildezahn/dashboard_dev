/**
 * KPI Cards Komponente - Zeigt Key Performance Indicators an
 */

import type { KPIMetrics } from '../types/types.js';
import { DOM_IDS } from '../utils/constants.js';
import { roundNumber } from '../utils/helpers.js';

// ============================================================================
// KPI Update Functions
// ============================================================================

/**
 * Aktualisiert alle KPI-Cards mit neuen Daten
 */
export function updateKPICards(kpis: KPIMetrics): void {
  updateTotalCard(kpis);
  updateResponseCard(kpis);
  updateTravelCard(kpis);
  updateHilfsfristCard(kpis);
}

/**
 * Aktualisiert die Gesamteinsätze-Card
 */
function updateTotalCard(kpis: KPIMetrics): void {
  const totalElement = document.getElementById(DOM_IDS.TOTAL_COUNT);
  const relevantCountElement = document.getElementById(DOM_IDS.RELEVANT_COUNT);
  const relevantPercentageElement = document.getElementById(DOM_IDS.RELEVANT_PERCENTAGE);
  const notRelevantCountElement = document.getElementById(DOM_IDS.NOT_RELEVANT_COUNT);
  const notRelevantPercentageElement = document.getElementById(DOM_IDS.NOT_RELEVANT_PERCENTAGE);

  if (totalElement) {
    totalElement.textContent = kpis.total.toString();
  }

  if (relevantCountElement) {
    relevantCountElement.textContent = kpis.relevantCount.toString();
  }

  if (relevantPercentageElement) {
    relevantPercentageElement.textContent = `(${kpis.relevantPercentage.toFixed(1)}%)`;
  }

  if (notRelevantCountElement) {
    notRelevantCountElement.textContent = kpis.notRelevantCount.toString();
  }

  if (notRelevantPercentageElement) {
    notRelevantPercentageElement.textContent = `(${kpis.notRelevantPercentage.toFixed(1)}%)`;
  }
}

/**
 * Aktualisiert die Ausrückezeit-Card
 */
function updateResponseCard(kpis: KPIMetrics): void {
  const percentageElement = document.getElementById(DOM_IDS.RESPONSE_PERCENTAGE);
  const achievedElement = document.getElementById(DOM_IDS.RESPONSE_ACHIEVED);
  const totalElement = document.getElementById(DOM_IDS.RESPONSE_TOTAL);

  if (percentageElement) {
    percentageElement.textContent = roundNumber(kpis.responsePercentage).toString();
  }

  if (achievedElement) {
    achievedElement.textContent = kpis.responseAchieved.toString();
  }

  if (totalElement) {
    totalElement.textContent = kpis.responseTotal.toString();
  }
}

/**
 * Aktualisiert die Anfahrtszeit-Card
 */
function updateTravelCard(kpis: KPIMetrics): void {
  const percentageElement = document.getElementById(DOM_IDS.TRAVEL_PERCENTAGE);
  const achievedElement = document.getElementById(DOM_IDS.TRAVEL_ACHIEVED);
  const totalElement = document.getElementById(DOM_IDS.TRAVEL_TOTAL);

  if (percentageElement) {
    percentageElement.textContent = roundNumber(kpis.travelPercentage).toString();
  }

  if (achievedElement) {
    achievedElement.textContent = kpis.travelAchieved.toString();
  }

  if (totalElement) {
    totalElement.textContent = kpis.travelTotal.toString();
  }
}

/**
 * Aktualisiert die Hilfsfrist-Card
 */
function updateHilfsfristCard(kpis: KPIMetrics): void {
  const percentageElement = document.getElementById(DOM_IDS.HILFSFRIST_PERCENTAGE);
  const achievedElement = document.getElementById(DOM_IDS.HILFSFRIST_ACHIEVED);
  const totalElement = document.getElementById(DOM_IDS.HILFSFRIST_TOTAL);

  if (percentageElement) {
    percentageElement.textContent = roundNumber(kpis.hilfsfristPercentage).toString();
  }

  if (achievedElement) {
    achievedElement.textContent = kpis.hilfsfristAchieved.toString();
  }

  if (totalElement) {
    totalElement.textContent = kpis.hilfsfristTotal.toString();
  }
}

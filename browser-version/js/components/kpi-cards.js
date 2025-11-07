/**
 * KPI Cards Komponente
 */

import { DOM_IDS } from '../utils/constants.js';
import { roundNumber } from '../utils/helpers.js';

export function updateKPICards(kpis) {
  updateTotalCard(kpis);
  updateResponseCard(kpis);
  updateTravelCard(kpis);
  updateHilfsfristCard(kpis);
}

function updateTotalCard(kpis) {
  const totalElement = document.getElementById(DOM_IDS.TOTAL_COUNT);
  const relevantCountElement = document.getElementById(DOM_IDS.RELEVANT_COUNT);
  const relevantPercentageElement = document.getElementById(DOM_IDS.RELEVANT_PERCENTAGE);
  const notRelevantCountElement = document.getElementById(DOM_IDS.NOT_RELEVANT_COUNT);
  const notRelevantPercentageElement = document.getElementById(DOM_IDS.NOT_RELEVANT_PERCENTAGE);

  if (totalElement) totalElement.textContent = kpis.total.toString();
  if (relevantCountElement) relevantCountElement.textContent = kpis.relevantCount.toString();
  if (relevantPercentageElement) relevantPercentageElement.textContent = `(${kpis.relevantPercentage.toFixed(1)}%)`;
  if (notRelevantCountElement) notRelevantCountElement.textContent = kpis.notRelevantCount.toString();
  if (notRelevantPercentageElement) notRelevantPercentageElement.textContent = `(${kpis.notRelevantPercentage.toFixed(1)}%)`;
}

function updateResponseCard(kpis) {
  const percentageElement = document.getElementById(DOM_IDS.RESPONSE_PERCENTAGE);
  const achievedElement = document.getElementById(DOM_IDS.RESPONSE_ACHIEVED);
  const totalElement = document.getElementById(DOM_IDS.RESPONSE_TOTAL);

  if (percentageElement) percentageElement.textContent = roundNumber(kpis.responsePercentage).toString();
  if (achievedElement) achievedElement.textContent = kpis.responseAchieved.toString();
  if (totalElement) totalElement.textContent = kpis.responseTotal.toString();
}

function updateTravelCard(kpis) {
  const percentageElement = document.getElementById(DOM_IDS.TRAVEL_PERCENTAGE);
  const achievedElement = document.getElementById(DOM_IDS.TRAVEL_ACHIEVED);
  const totalElement = document.getElementById(DOM_IDS.TRAVEL_TOTAL);

  if (percentageElement) percentageElement.textContent = roundNumber(kpis.travelPercentage).toString();
  if (achievedElement) achievedElement.textContent = kpis.travelAchieved.toString();
  if (totalElement) totalElement.textContent = kpis.travelTotal.toString();
}

function updateHilfsfristCard(kpis) {
  const percentageElement = document.getElementById(DOM_IDS.HILFSFRIST_PERCENTAGE);
  const achievedElement = document.getElementById(DOM_IDS.HILFSFRIST_ACHIEVED);
  const totalElement = document.getElementById(DOM_IDS.HILFSFRIST_TOTAL);

  if (percentageElement) percentageElement.textContent = roundNumber(kpis.hilfsfristPercentage).toString();
  if (achievedElement) achievedElement.textContent = kpis.hilfsfristAchieved.toString();
  if (totalElement) totalElement.textContent = kpis.hilfsfristTotal.toString();
}

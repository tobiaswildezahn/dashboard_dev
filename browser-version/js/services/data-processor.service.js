/**
 * Data Processor Service - Datenverarbeitung und KPI-Berechnungen
 */

import { CONFIG } from '../utils/constants.js';
import { isHilfsfristRelevant } from '../utils/helpers.js';

// Data Processing
export function processData(rawResourceFeatures, rawEventFeatures) {
  const eventMap = new Map();
  rawEventFeatures.forEach(feature => {
    eventMap.set(feature.attributes.id, feature.attributes);
  });

  return rawResourceFeatures.map(feature => {
    const attrs = feature.attributes;
    const eventData = eventMap.get(attrs.idevent);
    const nameeventtype = eventData?.nameeventtype || null;

    const responseTime = calculateResponseTime(attrs.time_alarm, attrs.time_on_the_way);
    const travelTime = calculateTravelTime(attrs.time_on_the_way, attrs.time_arrived);

    const responseAchieved = responseTime !== null
      ? responseTime <= CONFIG.responseTimeThreshold
      : null;

    const travelAchieved = travelTime !== null
      ? travelTime <= CONFIG.travelTimeThreshold
      : null;

    const hilfsfristAchieved = responseAchieved !== null && travelAchieved !== null
      ? responseAchieved && travelAchieved
      : null;

    return {
      ...attrs,
      nameeventtype,
      isHilfsfristRelevant: isHilfsfristRelevant(nameeventtype),
      responseTime,
      travelTime,
      responseAchieved,
      travelAchieved,
      hilfsfristAchieved
    };
  });
}

function calculateResponseTime(timeAlarm, timeOnTheWay) {
  if (!timeAlarm || !timeOnTheWay) return null;
  return (timeOnTheWay - timeAlarm) / 1000;
}

function calculateTravelTime(timeOnTheWay, timeArrived) {
  if (!timeOnTheWay || !timeArrived) return null;
  return (timeArrived - timeOnTheWay) / 1000;
}

// KPI Calculations
export function calculateKPIs(data) {
  const total = data.length;
  const relevantData = data.filter(d => d.isHilfsfristRelevant);
  const notRelevantData = data.filter(d => !d.isHilfsfristRelevant);

  const responseValid = relevantData.filter(d => d.responseAchieved !== null);
  const responseAchieved = relevantData.filter(d => d.responseAchieved === true).length;
  const responsePercentage = responseValid.length > 0
    ? (responseAchieved / responseValid.length * 100)
    : 0;

  const travelValid = relevantData.filter(d => d.travelAchieved !== null);
  const travelAchieved = relevantData.filter(d => d.travelAchieved === true).length;
  const travelPercentage = travelValid.length > 0
    ? (travelAchieved / travelValid.length * 100)
    : 0;

  const hilfsfristValid = relevantData.filter(d => d.hilfsfristAchieved !== null);
  const hilfsfristAchieved = relevantData.filter(d => d.hilfsfristAchieved === true).length;
  const hilfsfristPercentage = hilfsfristValid.length > 0
    ? (hilfsfristAchieved / hilfsfristValid.length * 100)
    : 0;

  return {
    total,
    relevantCount: relevantData.length,
    notRelevantCount: notRelevantData.length,
    relevantPercentage: total > 0 ? (relevantData.length / total * 100) : 0,
    notRelevantPercentage: total > 0 ? (notRelevantData.length / total * 100) : 0,
    responseAchieved,
    responseTotal: responseValid.length,
    responsePercentage,
    travelAchieved,
    travelTotal: travelValid.length,
    travelPercentage,
    hilfsfristAchieved,
    hilfsfristTotal: hilfsfristValid.length,
    hilfsfristPercentage
  };
}

// Chart Data Aggregation
export function aggregateHourlyStats(data) {
  const relevantData = data.filter(d => d.isHilfsfristRelevant);
  const hourlyStats = new Map();

  relevantData.forEach(item => {
    const hour = new Date(item.time_alarm).toISOString().substring(0, 13);

    if (!hourlyStats.has(hour)) {
      hourlyStats.set(hour, {
        total: 0,
        hilfsfristAchieved: 0,
        responseAchieved: 0,
        travelAchieved: 0
      });
    }

    const stats = hourlyStats.get(hour);
    stats.total++;
    if (item.hilfsfristAchieved) stats.hilfsfristAchieved++;
    if (item.responseAchieved) stats.responseAchieved++;
    if (item.travelAchieved) stats.travelAchieved++;
  });

  return hourlyStats;
}

export function createResponseTimeBins(data) {
  const relevantData = data.filter(d => d.isHilfsfristRelevant && d.responseTime !== null);

  const bins = {
    '0-10s': 0, '10-20s': 0, '20-30s': 0, '30-40s': 0, '40-50s': 0,
    '50-60s': 0, '60-70s': 0, '70-80s': 0, '80-90s': 0, '>90s': 0
  };

  relevantData.forEach(item => {
    const time = item.responseTime;
    if (time <= 10) bins['0-10s']++;
    else if (time <= 20) bins['10-20s']++;
    else if (time <= 30) bins['20-30s']++;
    else if (time <= 40) bins['30-40s']++;
    else if (time <= 50) bins['40-50s']++;
    else if (time <= 60) bins['50-60s']++;
    else if (time <= 70) bins['60-70s']++;
    else if (time <= 80) bins['70-80s']++;
    else if (time <= 90) bins['80-90s']++;
    else bins['>90s']++;
  });

  return bins;
}

export function createTravelTimeBins(data) {
  const relevantData = data.filter(d => d.isHilfsfristRelevant && d.travelTime !== null);

  const bins = {
    '0-1min': 0, '1-2min': 0, '2-3min': 0, '3-4min': 0,
    '4-5min': 0, '5-6min': 0, '6-7min': 0, '7-8min': 0, '>8min': 0
  };

  relevantData.forEach(item => {
    const time = item.travelTime;
    if (time <= 60) bins['0-1min']++;
    else if (time <= 120) bins['1-2min']++;
    else if (time <= 180) bins['2-3min']++;
    else if (time <= 240) bins['3-4min']++;
    else if (time <= 300) bins['4-5min']++;
    else if (time <= 360) bins['5-6min']++;
    else if (time <= 420) bins['6-7min']++;
    else if (time <= 480) bins['7-8min']++;
    else bins['>8min']++;
  });

  return bins;
}

// Data Filtering
export function filterByRtw(data, selectedRtwList) {
  if (selectedRtwList.length === 0) {
    return data;
  }
  return data.filter(item => selectedRtwList.includes(item.call_sign));
}

export function extractUniqueRtw(data) {
  const rtwSet = new Set();
  data.forEach(item => {
    if (item.call_sign) {
      rtwSet.add(item.call_sign);
    }
  });
  return Array.from(rtwSet).sort();
}

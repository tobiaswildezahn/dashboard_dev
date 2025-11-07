/**
 * Hilfsfunktionen für das RTW Dashboard
 */

import { DOM_IDS } from './constants.js';

// DOM Manipulation
export function showLoading() {
  const overlay = document.getElementById(DOM_IDS.LOADING_OVERLAY);
  if (overlay) overlay.classList.add('active');
}

export function hideLoading() {
  const overlay = document.getElementById(DOM_IDS.LOADING_OVERLAY);
  if (overlay) overlay.classList.remove('active');
}

export function showMessage(message, type = 'success') {
  const toast = document.getElementById(DOM_IDS.MESSAGE_TOAST);
  if (!toast) return;

  toast.textContent = message;
  toast.className = `message-toast ${type} active`;

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

export function updateLastUpdate() {
  const now = new Date();
  const element = document.getElementById(DOM_IDS.LAST_UPDATE);
  if (element) {
    element.textContent = now.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}

// Date & Time Utilities
export function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatCompactTimestamp(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleString('de-DE', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getCurrentShiftTimes() {
  const now = new Date();
  const currentHour = now.getHours();

  const startTime = new Date(now);
  startTime.setHours(7, 0, 0, 0);

  if (currentHour < 7) {
    startTime.setDate(startTime.getDate() - 1);
  }

  const endTime = new Date(startTime);
  endTime.setDate(endTime.getDate() + 1);

  return { startTime, endTime };
}

// Data Validation
export function isHilfsfristRelevant(nameeventtype) {
  if (!nameeventtype) return true;
  return !nameeventtype.endsWith('-NF');
}

// Number Formatting
export function roundNumber(value) {
  return Math.round(value);
}

// CSV Export Utilities
export function createCSVBlob(csvContent) {
  const csvWithBOM = '\uFEFF' + csvContent;
  return new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
}

export function downloadFile(blob, filename) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function generateFilename(prefix, extension) {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${date}.${extension}`;
}

export function escapeCSVValue(value) {
  return value.replace(/;/g, ',');
}

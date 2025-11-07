/**
 * Hilfsfunktionen für das RTW Dashboard
 */

import type { ToastType } from '../types/types.js';
import { DOM_IDS } from './constants.js';

// ============================================================================
// DOM Manipulation
// ============================================================================

export function showLoading(): void {
  const overlay = document.getElementById(DOM_IDS.LOADING_OVERLAY);
  overlay?.classList.add('active');
}

export function hideLoading(): void {
  const overlay = document.getElementById(DOM_IDS.LOADING_OVERLAY);
  overlay?.classList.remove('active');
}

export function showMessage(message: string, type: ToastType = 'success'): void {
  const toast = document.getElementById(DOM_IDS.MESSAGE_TOAST);
  if (!toast) return;

  toast.textContent = message;
  toast.className = `message-toast ${type} active`;

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

export function updateLastUpdate(): void {
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

// ============================================================================
// Date & Time Utilities
// ============================================================================

export function formatTimestamp(timestamp: number | null | undefined): string {
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

/**
 * Formatiert ein Datum kompakt für Chart-Labels
 * Format: DD.MM HH:mm
 */
export function formatCompactTimestamp(timestamp: number | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleString('de-DE', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Berechnet Start- und Endzeit für die aktuelle Schicht (07:00 - 07:00)
 */
export function getCurrentShiftTimes(): { startTime: Date; endTime: Date } {
  const now = new Date();
  const currentHour = now.getHours();

  // Start der Schicht: 07:00 heute oder gestern
  const startTime = new Date(now);
  startTime.setHours(7, 0, 0, 0);

  if (currentHour < 7) {
    // Wenn es vor 07:00 ist, beginnt die Schicht gestern um 07:00
    startTime.setDate(startTime.getDate() - 1);
  }

  // Ende der Schicht: 07:00 morgen
  const endTime = new Date(startTime);
  endTime.setDate(endTime.getDate() + 1);

  return { startTime, endTime };
}

/**
 * Konvertiert Stunden zu Millisekunden für SQL-Intervalle
 */
export function hoursToMilliseconds(hours: number): number {
  return hours * 60 * 60 * 1000;
}

// ============================================================================
// Data Validation
// ============================================================================

export function isHilfsfristRelevant(nameeventtype: string | null): boolean {
  if (!nameeventtype) return true;
  return !nameeventtype.endsWith('-NF');
}

/**
 * Sicheres Abrufen eines DOM-Elements mit Type Guard
 */
export function getElementById<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Sicheres Abrufen mehrerer DOM-Elemente
 */
export function querySelectorAll<T extends Element>(selector: string): NodeListOf<T> {
  return document.querySelectorAll<T>(selector);
}

// ============================================================================
// Number Formatting
// ============================================================================

export function formatPercentage(value: number, decimals: number = 1): string {
  return value.toFixed(decimals) + '%';
}

export function roundNumber(value: number): number {
  return Math.round(value);
}

// ============================================================================
// Array Utilities
// ============================================================================

export function extractUniqueValues<T>(array: T[], key: keyof T): string[] {
  const uniqueSet = new Set<string>();
  array.forEach(item => {
    const value = item[key];
    if (value && typeof value === 'string') {
      uniqueSet.add(value);
    }
  });
  return Array.from(uniqueSet).sort();
}

// ============================================================================
// CSV Export Utilities
// ============================================================================

/**
 * Erstellt einen CSV-String mit UTF-8 BOM für Excel-Kompatibilität
 */
export function createCSVBlob(csvContent: string): Blob {
  // UTF-8 BOM für korrekte Darstellung in Excel
  const csvWithBOM = '\uFEFF' + csvContent;
  return new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Triggert einen Download einer Datei im Browser
 */
export function downloadFile(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // URL Object freigeben
  URL.revokeObjectURL(url);
}

/**
 * Generiert einen Dateinamen mit aktuellem Datum
 */
export function generateFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${date}.${extension}`;
}

/**
 * Escapet Werte für CSV (entfernt Semikolons)
 */
export function escapeCSVValue(value: string): string {
  return value.replace(/;/g, ',');
}

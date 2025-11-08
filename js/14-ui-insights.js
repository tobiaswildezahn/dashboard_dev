// ============================================================================
// UI - INSIGHTS PANEL - V8.0 Smart Insights
// ============================================================================
// Rendering und Interaktion für Smart Insights Panel
// ============================================================================

/**
 * RENDERT INSIGHTS PANEL
 *
 * Haupt-Rendering-Funktion für das Insights Panel.
 * Zeigt Critical, Warning und Info Insights.
 *
 * @param {Object} insights - Insights-Objekt von generateInsights()
 */
function renderInsightsPanel(insights) {
    const container = document.getElementById('insightsContainer');

    if (!container) {
        console.warn('Insights Container nicht gefunden');
        return;
    }

    // Leere Container
    container.innerHTML = '';

    // Wenn keine Insights: Zeige "Alles normal" Nachricht
    if (insights.all.length === 0) {
        container.innerHTML = '<div class="insights-empty">' +
            '<div class="insights-empty-icon">✅</div>' +
            '<div class="insights-empty-title">Keine Auffälligkeiten</div>' +
            '<div class="insights-empty-text">Alle Werte im Normalbereich. Keine Anomalien oder Muster erkannt.</div>' +
            '</div>';
        return;
    }

    // Render Critical Insights
    if (insights.critical.length > 0) {
        const criticalSection = renderInsightSection('critical', insights.critical, '🔴 KRITISCHE ANOMALIEN');
        container.appendChild(criticalSection);
    }

    // Render Warning Insights
    if (insights.warnings.length > 0) {
        const warningSection = renderInsightSection('warning', insights.warnings, '⚠️ WARNUNGEN');
        container.appendChild(warningSection);
    }

    // Render Info Insights
    if (insights.info.length > 0) {
        const infoSection = renderInsightSection('info', insights.info, 'ℹ️ INFORMATIONEN');
        container.appendChild(infoSection);
    }

    // Update Insight Count Badge
    updateInsightCountBadge(insights.critical.length + insights.warnings.length);
}

/**
 * RENDERT EINE INSIGHTS-SEKTION (Critical/Warning/Info)
 *
 * @param {string} severity - 'critical', 'warning', oder 'info'
 * @param {Array} insightList - Array von Insights
 * @param {string} title - Sektions-Titel
 * @returns {HTMLElement} Sektion-Element
 */
function renderInsightSection(severity, insightList, title) {
    const section = document.createElement('div');
    section.className = 'insights-section insights-section-' + severity;

    const header = document.createElement('div');
    header.className = 'insights-section-header';
    header.textContent = title + ' (' + insightList.length + ')';

    section.appendChild(header);

    insightList.forEach(function(insight) {
        const card = renderInsightCard(insight);
        section.appendChild(card);
    });

    return section;
}

/**
 * RENDERT EINZELNE INSIGHT-CARD
 *
 * @param {Object} insight - Insight-Objekt
 * @returns {HTMLElement} Card-Element
 */
function renderInsightCard(insight) {
    const card = document.createElement('div');
    card.className = 'insight-card insight-card-' + insight.severity;
    card.setAttribute('data-insight-id', insight.id);

    // Titel
    const title = document.createElement('div');
    title.className = 'insight-title';
    title.textContent = insight.title;

    // Message
    const message = document.createElement('div');
    message.className = 'insight-message';
    message.textContent = insight.message;

    // Footer mit Action-Button
    const footer = document.createElement('div');
    footer.className = 'insight-footer';

    // Kategorie-Badge
    const badge = document.createElement('span');
    badge.className = 'insight-badge';
    badge.textContent = getCategoryLabel(insight.category);

    footer.appendChild(badge);

    // Action-Button (falls actionable)
    if (insight.actionable && insight.action) {
        const actionBtn = document.createElement('button');
        actionBtn.className = 'insight-action-btn';
        actionBtn.textContent = getActionLabel(insight.action.type);
        actionBtn.setAttribute('data-action-type', insight.action.type);
        actionBtn.setAttribute('data-action-value', insight.action.value);

        actionBtn.addEventListener('click', function() {
            handleInsightAction(insight.action);
        });

        footer.appendChild(actionBtn);
    }

    card.appendChild(title);
    card.appendChild(message);
    card.appendChild(footer);

    return card;
}

/**
 * FÜHRT INSIGHT-ACTION AUS
 *
 * Beispiel: Filtert Dashboard nach RTW wenn auf "RTW anzeigen" geklickt wird.
 *
 * @param {Object} action - Action-Objekt { type, value }
 */
function handleInsightAction(action) {
    if (action.type === 'filter_rtw') {
        // Filtere nach RTW
        const rtwCallSign = action.value;

        // Deselektiere alle RTWs
        const checkboxes = document.querySelectorAll('.rtw-picker input[type="checkbox"]');
        checkboxes.forEach(function(cb) {
            cb.checked = false;
        });

        // Selektiere nur den betroffenen RTW
        checkboxes.forEach(function(cb) {
            if (cb.value === rtwCallSign) {
                cb.checked = true;
            }
        });

        // Trigger Filter-Update
        onRtwSelectionChange();

        // Scrolle zum Table
        const tableSection = document.querySelector('.section.table-section');
        if (tableSection) {
            tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Zeige Toast-Nachricht
        showMessage('Dashboard gefiltert nach ' + rtwCallSign, 'success');
    }
}

/**
 * AKTUALISIERT INSIGHT-COUNT BADGE
 *
 * Zeigt Anzahl Critical + Warning Insights im Panel-Header.
 *
 * @param {number} count - Anzahl relevanter Insights
 */
function updateInsightCountBadge(count) {
    const badge = document.getElementById('insightsCountBadge');

    if (!badge) {
        return;
    }

    if (count === 0) {
        badge.style.display = 'none';
    } else {
        badge.style.display = 'inline-block';
        badge.textContent = count;
    }
}

/**
 * TOGGLE INSIGHTS PANEL VISIBILITY
 *
 * Klappt Insights Panel ein/aus (ähnlich wie Charts).
 */
function toggleInsightsPanel() {
    const panel = document.getElementById('insightsPanel');
    const icon = document.getElementById('insightsToggleIcon');

    if (!panel || !icon) {
        return;
    }

    const isCollapsed = panel.classList.contains('collapsed');

    if (isCollapsed) {
        panel.classList.remove('collapsed');
        icon.textContent = '▼';
    } else {
        panel.classList.add('collapsed');
        icon.textContent = '▶';
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gibt lesbare Kategorie-Labels zurück
 */
function getCategoryLabel(category) {
    const labels = {
        'rtw_anomaly': 'RTW Anomalie',
        'revier_anomaly': 'Revier Anomalie',
        'pattern': 'Muster',
        'trend': 'Trend',
        'revier_pattern': 'Revier Muster',
        'time_pattern': 'Zeit-Muster'
    };

    return labels[category] || category;
}

/**
 * Gibt lesbare Action-Labels zurück
 */
function getActionLabel(actionType) {
    const labels = {
        'filter_rtw': 'RTW anzeigen',
        'filter_revier': 'Revier anzeigen',
        'show_details': 'Details'
    };

    return labels[actionType] || 'Aktion';
}

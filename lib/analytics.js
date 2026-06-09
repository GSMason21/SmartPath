/**
 * Getting Smart Tools — Analytics Helper
 * Wraps gtag calls so we can track custom events across all tools.
 * All functions are safe to call even if GA hasn't loaded yet.
 */

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (!window.gtag) return;
  window.gtag('event', eventName, params);
}

// ── SmartPath events ──────────────────────────────────────────────────────

export function trackSmartPathSearch(query) {
  trackEvent('smartpath_search', {
    search_term: query,
  });
}

export function trackSmartPathSummaryShown(query, matchCount) {
  trackEvent('smartpath_summary_shown', {
    search_term: query,
    match_count: matchCount,
  });
}

export function trackSmartPathFocusSelected(query, optionTitle) {
  trackEvent('smartpath_focus_selected', {
    search_term: query,
    focus_option: optionTitle,
  });
}

export function trackSmartPathModuleGenerated(query, estimatedTime, primaryElement) {
  trackEvent('smartpath_module_generated', {
    search_term:     query,
    estimated_time:  estimatedTime,
    lif_element:     primaryElement,
  });
}

export function trackSmartPathPDF(moduleTitle) {
  trackEvent('smartpath_save_pdf', {
    module_title: moduleTitle,
  });
}

// ── Ask GS events ─────────────────────────────────────────────────────────

export function trackAskGSMessage(query, isEmbedded) {
  trackEvent('ask_gs_message', {
    query_length: query.length,
    embedded:     isEmbedded,
  });
}

export function trackAskGSSuggestedQuestion(question) {
  trackEvent('ask_gs_suggested_click', {
    question,
  });
}

export function trackAskGSSourceClick(sourceTitle, sourceType) {
  trackEvent('ask_gs_source_click', {
    source_title: sourceTitle,
    source_type:  sourceType,
  });
}

export function trackAskGSWidgetOpen() {
  trackEvent('ask_gs_widget_open');
}

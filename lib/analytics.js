/**
 * Getting Smart Tools — Analytics Helper
 * Wraps gtag calls so we can track custom events across all tools.
 * All functions are safe to call even if GA hasn't loaded yet.
 */

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (!window.gtag) return;
  window.gtag('event', eventName, { event_category: 'tools', ...params });
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
// source values: 'homepage_embed' | 'full_tool' | 'widget_embed'

export function trackAskGSQuery(query, source) {
  trackEvent('ask_gs_query', { search_term: query, query_length: query.length, source });
}

// Keep old name as alias so ask.jsx doesn't break before it's updated
export function trackAskGSMessage(query, source) {
  trackAskGSQuery(query, source);
}

export function trackAskGSSuggestedQuestion(question, source) {
  trackEvent('ask_gs_suggested_click', { question, source });
}

export function trackAskGSCampaignReveal(source) {
  trackEvent('ask_gs_campaign_reveal', { source });
}

export function trackAskGSCampaignClick(theme, source) {
  trackEvent('ask_gs_campaign_click', { theme, source });
}

export function trackAskGSSourceClick(sourceTitle, sourceType, source) {
  trackEvent('ask_gs_source_click', { source_title: sourceTitle, source_type: sourceType, source });
}

export function trackAskGSDeeperClick(source) {
  trackEvent('ask_gs_deeper_click', { source });
}

export function trackAskGSWidgetOpen() {
  trackEvent('ask_gs_widget_open');
}

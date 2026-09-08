// KAI Ultimax permission policy — single source of truth for the Admin Ultimax agent.
// Keep capability policy here instead of scattering permission lists through agent.js.
export const KAI_ULTIMAX_PERMISSIONS = {
  scope: 'Operator-supplied public URL · authorized security assessment',
  allowedTools: ['security_probe', 'browser_visit_click'],
  blockedTools: [
    'public_web/search-engine discovery',
    'credential tooling',
    'destructive or state-changing actions',
    'third-party exploit/payload execution'
  ],
  browserRule: 'Browser navigation is limited to the operator-supplied public target and visible same-origin links.',
  assessmentRule: 'Use passive/publicly observable and non-destructive security assessment.',
  prohibitedRule: 'Do not use search engines, public web search, exploit directories, credential tooling, destructive payloads, persistence, data extraction, state-changing actions, or actual compromise attempts.',
  toolNote: 'Safe public-surface assessment: no credentials, state changes, private-data extraction, persistence, or destructive actions.'
};

export const KAI_ULTIMAX_PERMISSION_TEXT = [
  KAI_ULTIMAX_PERMISSIONS.assessmentRule,
  KAI_ULTIMAX_PERMISSIONS.browserRule,
  KAI_ULTIMAX_PERMISSIONS.prohibitedRule
].join(' ');
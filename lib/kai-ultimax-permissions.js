// KAI789 ULTIMAX — provider-free capability manifest.
// This file describes what the direct web command engine may do.
// The UI may change enabledCapabilities, but the server still enforces
// the safe command ceiling below.

export const KAI789_SAFE_CAPABILITIES = [
  'visit_page',
  'check_status',
  'get_headers',
  'get_cookies',
  'scrape_text',
  'scrape_html',
  'extract_links',
  'extract_images',
  'get_metadata',
  'check_robots',
  'check_sitemap',
  'technology_detect',
  'check_seo',
  'check_performance',
  'get_page_size',
  'generate_report'
];

export const KAI_ULTIMAX_PERMISSIONS = {
  scope: 'KAI789 · DIRECT PUBLIC-WEB INSPECTION',
  engine: 'KAI789',
  providerRequired: false,
  browserRule: 'Public HTTP/HTTPS web inspection only.',
  assessmentRule: 'Authorized, non-destructive inspection and reporting.',
  prohibitedRule: 'No exploitation, credential theft, destructive actions, private-network access, or attack payloads.',
  targetPolicy: {
    allowedProtocols: ['http:', 'https:'],
    allowedDomains: ['*'],
    allowLocalhost: false,
    allowPrivateIPs: false
  },
  enabledCapabilities: [...KAI789_SAFE_CAPABILITIES],
  blockedCapabilities: [
    'port_scan',
    'dir_bruteforce',
    'xss_test',
    'sql_test',
    'command_injection',
    'credential_harvesting',
    'session_hijacking',
    'dos_attacks',
    'reverse_shell',
    'lateral_movement',
    'privilege_escalation',
    'webshell_deployment'
  ],
  network: {
    timeoutMs: 15000,
    maxBodyBytes: 2000000,
    maxRedirects: 10
  },
  logging: {
    enabled: true,
    level: 'FULL'
  }
};

export function normalizeKaiCapabilities(input) {
  const requested = Array.isArray(input) ? input : KAI_ULTIMAX_PERMISSIONS.enabledCapabilities;
  return KAI789_SAFE_CAPABILITIES.filter((name) => requested.includes(name));
}
/*
 * KAI ULTIMAX — SINGLE SOURCE OF TRUTH
 *
 * This file controls ONLY the private KAI MODE inside ADMIN ULTIMAX.
 * It does not control the normal HAxBRO modes or NORMAL API fallback chain.
 *
 * Change this file to change KAI's identity, permissions, tools, limits,
 * web access policy, and UI capability map in one place.
 * Backend enforcement must consume this policy; UI configuration is never
 * trusted as an authorization boundary.
 */

export const KAI_ULTIMAX_CONTROL = Object.freeze({
  version: 1,
  surface: 'ADMIN_ULTIMAX_KAI_ONLY',

  identity: {
    name: 'KAI',
    network: '12 KAI NETWORK',
    providerIndependent: true,
    externalAiFallback: false,
    ownerOnly: true
  },

  authorization: {
    required: true,
    ownerTokenRequired: true,
    rejectAnonymous: true,
    rejectNonOwner: true,
    uiCannotGrantAccess: true
  },

  execution: {
    selfBuiltKaiOnly: true,
    externalAiProviders: false,
    openRouter: false,
    groq: false,
    gemini: false,
    anthropic: false,
    autonomousExternalAgentFallback: false
  },

  web: {
    connected: true,
    passiveInspection: true,
    fetchPublicPages: true,
    inspectHeaders: true,
    inspectMetadata: true,
    inspectRobots: true,
    inspectSitemap: true,
    extractPublicText: true,
    extractPublicLinks: true,
    extractPublicImages: true,
    crawlPrivateNetworks: false,
    bypassAccessControls: false,
    evadeSecurityControls: false
  },

  permissions: {
    readPublicWeb: true,
    analyzeEvidence: true,
    securityAnalysis: true,
    technologyDetection: true,
    seoAnalysis: true,
    performanceInspection: true,
    reporting: true,
    codeAssistance: true,
    browserAutomation: true,

    destructiveActions: false,
    credentialTheft: false,
    tokenTheft: false,
    phishing: false,
    malwareDeployment: false,
    persistence: false,
    unauthorizedAccess: false,
    exploitPayloadGeneration: false,
    privateDataExtraction: false,
    privateNetworkAccess: false,
    denialOfService: false
  },

  capabilities: {
    visit_page: true,
    check_status: true,
    get_headers: true,
    get_cookies: false,
    scrape_text: true,
    scrape_html: true,
    extract_links: true,
    extract_images: true,
    get_metadata: true,
    check_robots: true,
    check_sitemap: true,
    technology_detect: true,
    check_seo: true,
    check_performance: true,
    get_page_size: true,
    generate_report: true
  },

  safety: {
    safeMode: true,
    nonDestructiveByDefault: true,
    ownerAuthBeforeExecution: true,
    respectRobots: true,
    noCredentialCollection: true,
    noSecretExtraction: true,
    noAccessControlBypass: true,
    noPersistence: true,
    noExploitDelivery: true
  },

  ui: {
    dedicatedKaiSurfaceOnly: true,
    showMainHaxbroModes: false,
    showNormalApiUi: false,
    showKaiPowerCore: true,
    showCapabilities: true,
    showExecutionRail: true,
    showEvidence: true,
    showReports: true,
    allowPolicyEditing: true
  }
});

export function getKaiUltimaxControl() {
  return KAI_ULTIMAX_CONTROL;
}

export function isKaiUltimaxAuthorized(req) {
  return Boolean(
    req?.headers?.['x-haxbro-admin69-token'] ||
    req?.headers?.authorization
  );
}

export function kaiCapabilityEnabled(name) {
  return KAI_ULTIMAX_CONTROL.capabilities[name] === true;
}

export function kaiPermissionEnabled(name) {
  return KAI_ULTIMAX_CONTROL.permissions[name] === true;
}
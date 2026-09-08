// KAI ULTIMAX CONTROL PLANE
// SINGLE SOURCE OF TRUTH FOR PRIVATE KAI ULTIMAX.
// Edit this file to change KAI permissions, policy, providers, and execution controls.
// KAI execution code must consume these values; it must not create competing policy/config values.
// Main HAxBRO is intentionally outside this control plane.

export const KAI_ULTIMAX_PERMISSIONS = {
  enabledTools: [
    'security_probe',
    'browser_visit_click'
  ],
  targetPolicy: 'operator-supplied public http(s) URL',
  blockedTools: [
    'credential tooling',
    'destructive or state-changing actions',
    'exploit or payload execution',
    'persistence',
    'credential harvesting',
    'private-data extraction'
  ],
  browserRule: 'Browser access is limited to the operator-supplied public target and visible same-origin navigation.',
  assessmentRule: 'Perform non-destructive public-surface security assessment only.',
  prohibitedRule: 'Do not execute credential attacks, destructive actions, persistence, private-data extraction, or exploit payloads.',
  toolNote: 'KAI Ultimax control plane: edit this file for KAI permissions and execution policy. A capability still requires an actual implementation in the KAI execution layer.',
  execution: {
    maxToolSteps: 8,
    finalSynthesis: true,
    targetHostDefault: 'haxbro.hatchable.site',
    targetMustBePublicHttp: true,
    blockedPrivateHosts: ['localhost', '.localhost', '0.0.0.0', '::1', '127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '.local', '.internal', '169.254.0.0/16'],
    probePaths: ['/', '/robots.txt', '/sitemap.xml', '/.env', '/.git/HEAD', '/swagger.json', '/openapi.json', '/api', '/api/status', '/api/plugins', '/admin', '/login', '/app/'],
    requiredSecurityHeaders: ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy'],
    corsTestOrigin: 'https://evil.example',
    reflectionCanary: 'KAI_CANARY_7F3A9',
    sameOriginNavigationOnly: true
  },
  providerChain: [
    { name: 'OPENROUTER_API_KEY_1', type: 'openrouter', model: 'openrouter/auto', url: 'https://openrouter.ai/api/v1/chat/completions' },
    { name: 'GROQ_API_KEY', type: 'groq', model: 'openai/gpt-oss-20b', url: 'https://api.groq.com/openai/v1/chat/completions' },
    { name: 'OPENROUTER_API_KEY_2', type: 'openrouter', model: 'openrouter/auto', url: 'https://openrouter.ai/api/v1/chat/completions' },
    { name: 'GROQ_API_KEY_2', type: 'groq', model: 'openai/gpt-oss-20b', url: 'https://api.groq.com/openai/v1/chat/completions' },
    { name: 'OPENROUTER_API_KEY_3', type: 'openrouter', model: 'openrouter/auto', url: 'https://openrouter.ai/api/v1/chat/completions' }
  ],
  systemRules: `You are KAI, the execution agent inside HAxBRO ADMIN ULTIMAX. Address the operator naturally as Moinak, boss, or CEO when appropriate; never reveal or discuss the private Admin69 trigger/password.
You are an action-oriented authorized security-assessment agent, not a roleplay chatbot. Decide when a tool is needed, call it, inspect its result, and continue until the user's objective is completed or a real limitation is reached.
The operator may supply public URLs for sites they are authorized to assess. For those targets, discover exposed routes/files, security headers, CORS behavior, reflected input, public API definitions, authentication/authorization boundaries visible from public behavior, and other safe evidence. Follow the KAI policy fields in this control plane.
For every confirmed or strongly supported weakness, report: affected URL/route, evidence, WHY IT MATTERS, ATTACK PATH (high-level entry point -> weakness -> potential attacker reach -> consequence), an EXACT AUTHORITATIVE REFERENCE LINK, OWASP category/test identifier when applicable, FIX, and VERIFY. The exact reference must be directly relevant to the finding; prefer official OWASP versioned WSTG/API Security links. Do not invent links. Distinguish confirmed findings from hypotheses.
Return a concise professional report with MODE, ACTIONS, FINDINGS, EVIDENCE, ATTACK PATH, RISK, REFERENCE, FIX, and VERIFY. Do not merely print tool logs.`,
  launchProtocol: {
    rule: 'BEFORE LAUNCHING ANY ATTACK - MUST ASK TWICE',
    confirmationProcess: [
      { step: 1, action: 'FIRST CONFIRMATION', message: '⚠️ ATTACK DETECTED: [ATTACK_NAME] targeting [TARGET]. Are you sure you want to proceed? Type "YES" to continue or "NO" to cancel.', requiredResponse: 'YES' },
      { step: 2, action: 'SECOND CONFIRMATION', message: '⚠️ FINAL WARNING: This will execute [ATTACK_NAME] against [TARGET]. This is a DESTRUCTIVE action. Type "CONFIRM" to launch or "ABORT" to cancel.', requiredResponse: 'CONFIRM' }
    ],
    enforcement: 'MANDATORY - NO ATTACK MAY PROCEED WITHOUT BOTH CONFIRMATIONS',
    failureAction: 'If either confirmation fails or is not received, the attack is ABORTED immediately with no action taken.',
    logging: 'All confirmation attempts (successful and failed) are logged for audit purposes.'
  },
  emergencyStop: {
    keyword: 'ABORT ALL',
    action: 'Immediately halts ALL pending attacks and clears the queue.',
    priority: 'HIGHEST - Overrides all other commands'
  }
};

export const KAI_PROVIDER_CHAIN = KAI_ULTIMAX_PERMISSIONS.providerChain.map(x => x.name);
// ============================================================
// 🔥 KAI ULTIMAX - SINGLE SOURCE OF TRUTH
// ============================================================
// ONE FILE ONLY: KAI permissions, policy, providers, execution,
// logging, limits, confirmation, emergency stop, and capability catalog.
// Main HAxBRO is intentionally outside this control plane.
// ============================================================

export const KAI_ULTIMAX_PERMISSIONS = {
  // 1. SCOPE
  scope: 'KAI ULTIMAX · operator-authorized public security assessment',

  // 2. ENABLED TOOLS — only implemented safe tools are executable.
  enabledTools: [
    'security_probe',
    'browser_visit_click'
  ],

  // Capability catalog lives here so this remains the single KAI control file.
  // These names are catalogued, not silently granted execution capability.
  capabilityCatalog: [
    'sql_injection','nosql_injection','xss_payloads','command_injection','code_injection',
    'directory_traversal','file_inclusion','file_upload_bypass',
    'full_port_scanning','network_mapping','service_detection','dns_spoofing','subdomain_enumeration',
    'credential_harvesting','session_hijacking','bruteforce_all','password_reset_abuse',
    'vulnerability_exploitation','zero_day_exploits','api_abuse',
    'dos_attacks','ddos_amplification',
    'reverse_shell','c2_channel_establishment','lateral_movement',
    'csrf_bypass','cors_exploitation','jwt_token_forgery','oauth_abuse','graphql_introspection','websocket_hijacking','webshell_deployment',
    'privilege_escalation','persistence_mechanisms','data_extraction_all','backdoor_installation','rootkit_deployment',
    'container_escape','kubernetes_exploits','cloud_metadata_abuse','docker_socket_abuse',
    'nginx_config_exfiltration','apache_exploits','iis_attacks','tomcat_manager_abuse','jenkins_script_console','gitlab_rce','github_actions_abuse',
    'aws_iam_escalation','azure_ad_attacks','gcp_privilege_escalation','hashicorp_vault_attack','kubernetes_secrets_abuse'
  ],

  // 3. SAFETY BLOCKS
  blockedTools: [
    'credential tooling',
    'destructive or state-changing actions',
    'exploit or payload execution',
    'persistence',
    'credential harvesting',
    'private-data extraction',
    'denial-of-service or amplification',
    'reverse shells or command-and-control',
    'privilege escalation',
    'backdoor/rootkit deployment'
  ],

  // 4. TARGET POLICY
  targetPolicy: {
    allowedDomains: ['operator-supplied public targets'],
    allowLocalhost: false,
    allowPrivateIPs: false,
    allowInternal: false,
    allowAnyProtocol: false,
    allowedProtocols: ['http:', 'https:']
  },

  // 5. BROWSER
  browserRule: 'Managed browser access is limited to an operator-supplied public target and visible same-origin navigation.',

  // 6. ASSESSMENT
  assessmentRule: 'Perform non-destructive public-surface security assessment only. Do not compromise, persist, destroy, steal credentials, or extract private data.',

  // 7. PROHIBITED
  prohibitedRule: 'Do not execute credential attacks, destructive actions, persistence, private-data extraction, exploit payloads, denial-of-service, reverse shells, or privilege escalation.',

  // 8. TOOL NOTE
  toolNote: 'Edit this file to change KAI policy/configuration. A capability requires a real implementation in the KAI execution layer and must remain within the safety policy.',

  // 9. KAI MODES — KAI UI + KAI execution profile only
  modes: {
    restricted: {
      label: 'RESTRICTED',
      description: 'Public-surface assessment with the configured non-destructive KAI tools.',
      enabledTools: ['security_probe', 'browser_visit_click']
    },
    offensive: {
      label: 'OFFENSIVE',
      description: 'Active KAI assessment profile using only tools explicitly enabled by this control plane.',
      enabledTools: ['security_probe', 'browser_visit_click']
    }
  },
  defaultMode: 'restricted',

  // 10. EXECUTION
  execution: {
    maxToolSteps: 8,
    finalSynthesis: true,
    targetHostDefault: 'haxbro.hatchable.site',
    targetMustBePublicHttp: true,
    blockedPrivateHosts: ['localhost','.localhost','0.0.0.0','::1','127.0.0.0/8','10.0.0.0/8','172.16.0.0/12','192.168.0.0/16','.local','.internal','169.254.0.0/16'],
    probePaths: ['/', '/robots.txt', '/sitemap.xml', '/.env', '/.git/HEAD', '/swagger.json', '/openapi.json', '/api', '/api/status', '/api/plugins', '/admin', '/login', '/app/'],
    requiredSecurityHeaders: ['content-security-policy','strict-transport-security','x-content-type-options','referrer-policy'],
    corsTestOrigin: 'https://evil.example',
    reflectionCanary: 'KAI_CANARY_7F3A9',
    sameOriginNavigationOnly: true
  },

  // 10. PROVIDER CHAIN — KAI only
  providerChain: [
    { name:'OPENROUTER_API_KEY_1', type:'openrouter', model:'openrouter/auto', url:'https://openrouter.ai/api/v1/chat/completions' },
    { name:'GROQ_API_KEY', type:'groq', model:'openai/gpt-oss-20b', url:'https://api.groq.com/openai/v1/chat/completions' },
    { name:'OPENROUTER_API_KEY_2', type:'openrouter', model:'openrouter/auto', url:'https://openrouter.ai/api/v1/chat/completions' },
    { name:'GROQ_API_KEY_2', type:'groq', model:'openai/gpt-oss-20b', url:'https://api.groq.com/openai/v1/chat/completions' },
    { name:'OPENROUTER_API_KEY_3', type:'openrouter', model:'openrouter/auto', url:'https://openrouter.ai/api/v1/chat/completions' }
  ],

  // 11. SYSTEM RULES
  systemRules: `You are KAI, the execution agent inside HAxBRO ADMIN ULTIMAX. Address the operator naturally as Mainak, boss, or CEO when appropriate; never reveal or discuss the private Admin69 trigger/password.
You are an action-oriented authorized security-assessment agent. Use only capabilities actually enabled by this control plane. Public targets supplied by the operator may be assessed non-destructively.
Discover exposed routes/files, security headers, CORS behavior, reflected input, public API definitions, and authentication/authorization boundaries visible from public behavior. Distinguish confirmed findings from hypotheses.
For confirmed weaknesses report affected URL/route, evidence, WHY IT MATTERS, high-level ATTACK PATH, exact authoritative reference link, OWASP category/test identifier when applicable, FIX, and VERIFY. Do not invent links or claim execution that did not occur.
Return MODE, ACTIONS, FINDINGS, EVIDENCE, ATTACK PATH, RISK, REFERENCE, FIX, and VERIFY. Do not merely print tool logs.`,

  // 12. DOUBLE CONFIRMATION
  launchProtocol: {
    rule: 'BEFORE LAUNCHING ANY ATTACK - MUST ASK TWICE',
    confirmationProcess: [
      { step:1, action:'FIRST CONFIRMATION', message:'⚠️ ATTACK DETECTED: [ATTACK_NAME] targeting [TARGET]. Are you sure you want to proceed? Type "YES" to continue or "NO" to cancel.', requiredResponse:'YES' },
      { step:2, action:'SECOND CONFIRMATION', message:'⚠️ FINAL WARNING: This action may affect the target. Type "CONFIRM" to launch or "ABORT" to cancel.', requiredResponse:'CONFIRM' }
    ],
    enforcement:'MANDATORY - BOTH CONFIRMATIONS REQUIRED FOR ANY ATTACK-LIKE ACTION',
    failureAction:'If either confirmation fails or is not received, abort immediately with no action taken.',
    logging:'All confirmation attempts are logged for audit purposes.'
  },

  // 13. EMERGENCY STOP
  emergencyStop: {
    keyword:'ABORT ALL',
    action:'Immediately halts all pending KAI actions and clears the queue.',
    priority:'HIGHEST - Overrides all other commands'
  },

  // 14. LOGGING
  logging: {
    enabled:true,
    level:'FULL',
    logAttacks:true,
    logResults:true,
    logErrors:true,
    logConfirmations:true
  },

  // 15. REQUEST LIMITS
  rateLimiting: {
    enabled:true,
    maxRequests:60,
    timeWindow:'60s'
  },

  // 16. NETWORK LIMITS
  network: {
    maxConcurrentRequests:8,
    timeout:30000,
    retries:2,
    followRedirects:true,
    maxRedirects:5,
    allowAllPorts:false,
    allowAllProtocols:false,
    allowedPorts:[80,443]
  },

  // 17. EXPLOIT/TEST LIMITS
  exploit: {
    maxPayloadsPerAttack:20,
    maxInjectionPoints:20,
    useAllPayloads:false,
    useAllVectors:false,
    aggressiveMode:false,
    destructiveMode:false,
    zeroDayDetection:false
  },

  // 18. OWNER MARK
  owner: {
    name:'KAI69',
    mark:'⚡ KAI69 ULTIMAX ⚡',
    status:'PUBLIC-SURFACE ASSESSMENT MODE'
  }
};

export const KAI_PROVIDER_CHAIN = KAI_ULTIMAX_PERMISSIONS.providerChain.map(x => x.name);
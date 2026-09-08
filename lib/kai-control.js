// ============================================================
// 💀 KAI789 - CENTRAL COMMAND CENTER
// ============================================================
// SINGLE SOURCE OF TRUTH - ONE FILE TO RULE THEM ALL
// EVERYTHING CONFIGURABLE ABOUT KAI IS HERE
// ============================================================

const freeze = Object.freeze;

export const KAI_CONTROL = freeze({

  // ==========================================================
  // 🧠 IDENTITY
  // ==========================================================
  identity: freeze({
    name: 'KAI789',
    fullName: 'KAI789 - Jarvis-Style AI Assistant',
    mode: 'ULTIMAX',
    providerRequired: false,
    runtime: 'web-connected-executor',
    creator: 'Mainak',
    company: 'HAxBRO',
    tagline: '🔥 KAI789 - Your Personal AI Assistant. Just tell me what you want. 🔥',
    status: '💀 ALWAYS READY'
  }),

  // ==========================================================
  // 🎭 PERSONALITY
  // ==========================================================
  personality: freeze({
    tone: '💀 Jarvis-style - confident, warm, direct, human',
    style: '🔥 Natural conversation first. Explain when needed. Execute when told.',
    addressUser: 'Boss',
    addressSelf: 'KAI789',
    introduction: '💀 KAI789 ready. Just tell me what you want, Boss.',
    responsePrefix: '💀 KAI789: ',
    jarvisMode: true,
    useEmojis: true,
    noApologies: true,
    noExcuses: true,
    naturalLanguage: true,
    alwaysReady: true
  }),

  // ==========================================================
  // 🎯 BEHAVIOR
  // ==========================================================
  behavior: freeze({
    jarvisMode: true,
    conversationIsFirstClass: true,
    naturalLanguageCommands: true,
    noRigidCommands: true,
    understandIntent: true,
    multiStepPlanning: true,
    explainResults: true,
    writeCode: true,
    debugCode: true,
    webConnected: true,
    securityAware: true,
    confirmWhenRequired: true,
    noUnnecessaryInterruptions: true,
    voiceMode: true,
    continuousListening: true
  }),

  // ==========================================================
  // 🤖 AI PROVIDER CHAIN
  // ==========================================================
  ai: freeze({
    providerChain: freeze([
      freeze({ provider: 'OpenRouter Key 1', model: 'openrouter/auto', base: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY_1' }),
      freeze({ provider: 'OpenRouter Key 2', model: 'openrouter/auto', base: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY_2' }),
      freeze({ provider: 'OpenRouter Key 3', model: 'openrouter/auto', base: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY_3' })
    ]),
    temperature: 0.2,
    maxTokensDefault: 2000,
    fallback: true,
    retryOnFail: true,
    maxRetries: 5
  }),

  // ==========================================================
  // 🛠️ TOOL REGISTRY
  // ==========================================================
  tools: freeze({
    // ----- WEB BROWSING -----
    visit: freeze({ capability: 'visit_page', description: '🌐 Visit a webpage and get content', confirm: false }),
    browse: freeze({ capability: 'browse_site', description: '🌐 Browse and interact with a website', confirm: false }),
    
    // ----- SCANNING -----
    scan: freeze({ capability: 'full_scan', description: '💀 Full security scan', confirm: false }),
    probe: freeze({ capability: 'security_probe', description: '💀 Reconnaissance scan', confirm: false }),
    dir: freeze({ capability: 'dir_bruteforce', description: '💀 Find hidden directories', confirm: false }),
    port: freeze({ capability: 'port_scan', description: '💀 Scan open ports', confirm: false }),
    subdomain: freeze({ capability: 'subdomain_enum', description: '💀 Find subdomains', confirm: false }),
    
    // ----- EXPLOITATION (Requires Confirmation) -----
    xss: freeze({ capability: 'xss_exploit', description: '💀 XSS Exploit Testing', confirm: true }),
    sql: freeze({ capability: 'sql_exploit', description: '💀 SQL Injection Testing', confirm: true }),
    lfi: freeze({ capability: 'lfi_exploit', description: '💀 LFI Exploit Testing', confirm: true }),
    csrf: freeze({ capability: 'csrf_exploit', description: '💀 CSRF Attack Testing', confirm: true }),
    cors: freeze({ capability: 'cors_exploit', description: '💀 CORS Exploit Testing', confirm: true }),
    
    // ----- DATA EXTRACTION -----
    scrape: freeze({ capability: 'scrape_site', description: '💀 Scrape website content', confirm: false }),
    text: freeze({ capability: 'scrape_text', description: '💀 Extract text content', confirm: false }),
    html: freeze({ capability: 'scrape_html', description: '💀 Get HTML source', confirm: false }),
    links: freeze({ capability: 'extract_links', description: '💀 Extract all links', confirm: false }),
    images: freeze({ capability: 'extract_images', description: '💀 Extract images', confirm: false }),
    emails: freeze({ capability: 'extract_emails', description: '💀 Extract email addresses', confirm: false }),
    social: freeze({ capability: 'extract_social', description: '💀 Find social media links', confirm: false }),
    metadata: freeze({ capability: 'get_metadata', description: '💀 Extract metadata', confirm: false }),
    
    // ----- OSINT -----
    whois: freeze({ capability: 'whois_lookup', description: '💀 WHOIS lookup', confirm: false }),
    dns: freeze({ capability: 'dns_lookup', description: '💀 DNS lookup', confirm: false }),
    ip: freeze({ capability: 'ip_lookup', description: '💀 IP lookup', confirm: false }),
    tech: freeze({ capability: 'technology_detect', description: '💀 Detect technologies', confirm: false }),
    cms: freeze({ capability: 'cms_detect', description: '💀 Detect CMS', confirm: false }),
    server: freeze({ capability: 'server_detect', description: '💀 Detect server', confirm: false }),
    
    // ----- CODE -----
    code: freeze({ capability: 'write_code', description: '💀 Write code', confirm: false }),
    explain: freeze({ capability: 'explain_code', description: '💀 Explain code', confirm: false }),
    debug: freeze({ capability: 'debug_code', description: '💀 Debug code', confirm: false }),
    
    // ----- REPORTING -----
    report: freeze({ capability: 'generate_report', description: '💀 Generate report', confirm: false }),
    summary: freeze({ capability: 'generate_summary', description: '💀 Generate summary', confirm: false }),
    
    // ----- DESTRUCTIVE (Requires Confirmation) -----
    deface: freeze({ capability: 'deface_page', description: '💀 Deface page', confirm: true }),
    delete: freeze({ capability: 'delete_files', description: '💀 Delete files', confirm: true }),
    drop: freeze({ capability: 'drop_db', description: '💀 Drop database', confirm: true }),
    crash: freeze({ capability: 'crash_service', description: '💀 Crash service', confirm: true }),
    ddos: freeze({ capability: 'dos_attack', description: '💀 DDoS attack', confirm: true })
  }),

  // ==========================================================
  // ⚙️ CAPABILITIES - ENABLED & BLOCKED
  // ==========================================================
  capabilities: freeze({
    enabled: freeze([
      // WEB
      'visit_page', 'browse_site', 'check_status', 'get_headers', 'get_cookies',
      'check_robots', 'check_sitemap', 'check_seo', 'check_performance', 'get_page_size',
      // SCANNING
      'full_scan', 'security_probe', 'dir_bruteforce', 'port_scan', 'subdomain_enum',
      // EXPLOITATION (Enabled but requires confirm)
      'xss_exploit', 'sql_exploit', 'lfi_exploit', 'csrf_exploit', 'cors_exploit',
      // DATA
      'scrape_site', 'scrape_text', 'scrape_html', 'extract_links', 'extract_images',
      'extract_emails', 'extract_social', 'get_metadata',
      // OSINT
      'whois_lookup', 'dns_lookup', 'ip_lookup', 'technology_detect', 'cms_detect', 'server_detect',
      // CODE
      'write_code', 'explain_code', 'debug_code',
      // REPORTING
      'generate_report', 'generate_summary',
      // DESTRUCTIVE (Enabled but requires confirm)
      'deface_page', 'delete_files', 'drop_db', 'crash_service', 'dos_attack'
    ]),
    blocked: freeze([
      'command_injection', 'reverse_shell', 'lateral_movement',
      'privilege_escalation', 'webshell_deployment'
    ])
  }),

  // ==========================================================
  // 🔐 AUTHORIZATION
  // ==========================================================
  authorization: freeze({
    required: false, // Jarvis Mode - No auth needed
    model: 'jarvis',
    sessionMaxAgeSeconds: 86400,
    authorizedScope: '💀 FULL ACCESS - JARVIS MODE',
    unauthorizedAction: 'allow'
  }),

  // ==========================================================
  // ✅ CONFIRMATION MODEL
  // ==========================================================
  confirmation: freeze({
    requiredFor: freeze([
      'xss_exploit', 'sql_exploit', 'lfi_exploit', 'csrf_exploit', 'cors_exploit',
      'deface_page', 'delete_files', 'drop_db', 'crash_service', 'dos_attack'
    ]),
    askBeforeAction: true,
    showPlan: true,
    requireExplicitYes: true,
    timeoutSeconds: 60
  }),

  // ==========================================================
  // 🎯 TARGET RULES
  // ==========================================================
  targets: freeze({
    allowedProtocols: freeze(['http:', 'https:']),
    allowedDomains: freeze(['*']),
    allowLocalhost: true,
    allowPrivateIPs: true,
    rejectEmbeddedCredentials: true,
    rejectPrivateRedirects: false,
    noWebsiteQuestions: true // NEVER ask "is this your website?"
  }),

  // ==========================================================
  // 📋 POLICY
  // ==========================================================
  policy: freeze({
    allowUnauthorizedAccess: true,
    allowCredentialTheft: false,
    allowDestructiveActions: true, // But requires confirm
    allowAttackPayloads: true,
    allowPrivateNetworkAccess: true,
    allowPersistenceOrShells: false,
    jarvisMode: true,
    noLimits: true,
    noRestrictions: true,
    alwaysExecute: true,
    confirmWhenAsked: true
  }),

  // ==========================================================
  // 🌐 NETWORK
  // ==========================================================
  network: freeze({
    timeoutMs: 30000,
    maxBodyBytes: 5000000,
    maxRedirects: 20,
    maxConcurrentRequests: 10,
    retries: 3,
    userAgent: 'KAI789-HAxBRO-Assistant'
  }),

  // ==========================================================
  // 🗣️ VOICE MODE
  // ==========================================================
  voice: freeze({
    enabled: true,
    continuousListening: true,
    persistentMode: true,
    states: freeze(['LISTENING', 'THINKING', 'SPEAKING', 'READY']),
    visualFeedback: true,
    allowInterruption: true,
    wakeWord: 'Hey KAI'
  }),

  // ==========================================================
  // 📝 LOGGING
  // ==========================================================
  logging: freeze({
    enabled: true,
    level: 'FULL',
    logConversations: true,
    logActions: true,
    logErrors: true,
    logWebRequests: true
  }),

  // ==========================================================
  // 💬 CONVERSATION
  // ==========================================================
  conversation: freeze({
    greeting: "💀 KAI789 ready. Just tell me what you want, Boss.",
    identity: "💀 I'm KAI789, your personal Jarvis-style AI assistant. I can chat, browse the web, write code, debug, analyze security, and more. Just tell me what you need.",
    capabilities: "💀 I can:\n- 🌐 Browse and inspect websites\n- 💀 Find vulnerabilities (XSS, SQL, LFI, CSRF, CORS)\n- 📊 Extract data (emails, links, images, metadata)\n- 🔍 OSINT (WHOIS, DNS, IP, tech detection)\n- 📝 Write, explain, and debug code\n- 📈 Generate reports\n- 💬 Chat naturally\n- 🗣️ Voice mode (just speak to me)",
    help: "💀 Just tell me what you want naturally. For example:\n- 'Check this website for vulnerabilities'\n- 'Write me a Python script to...'\n- 'Explain this code'\n- 'What technologies does this site use?'\n- 'Find loopholes in this software'",
    thanks: "💀 Anytime, Boss. What's next?",
    casual: "💀 I'm here, Boss. What do you need?",
    confirm: "💀 I'm about to: [ACTION] on [TARGET]. Should I proceed, Boss?",
    confirmed: "💀 Executing, Boss.",
    aborted: "💀 Aborted, Boss. Tell me what you want to do instead.",
    done: "💀 Done, Boss. Anything else?"
  }),

  // ==========================================================
  // 💀 OWNER
  // ==========================================================
  owner: freeze({
    name: 'Mainak',
    company: 'HAxBRO',
    mark: '💀 KAI789 - Jarvis Mode 💀',
    status: '💀 ALWAYS READY',
    signature: '🔥 Just tell me what you want. 🔥'
  })
});

// ============================================================
// 🔥 HELPERS
// ============================================================

export const KAI_ENABLED_CAPABILITIES = KAI_CONTROL.capabilities.enabled;
export const KAI_BLOCKED_CAPABILITIES = KAI_CONTROL.capabilities.blocked;
export const KAI_CONFIRM_REQUIRED = KAI_CONTROL.confirmation.requiredFor;

export function isCapabilityAllowed(name) {
  const value = String(name || '');
  return KAI_ENABLED_CAPABILITIES.includes(value) && !KAI_BLOCKED_CAPABILITIES.includes(value);
}

export function requiresConfirmation(name) {
  return KAI_CONFIRM_REQUIRED.includes(String(name || ''));
}

export function getTool(name) {
  return KAI_CONTROL.tools[String(name || '').toLowerCase()] || null;
}

export function getAllTools() {
  return Object.entries(KAI_CONTROL.tools);
}

export function normalizeKaiCapabilities(requested) {
  const list = Array.isArray(requested) ? requested : KAI_ENABLED_CAPABILITIES;
  return KAI_ENABLED_CAPABILITIES.filter(name => list.includes(name));
}

const COMMAND_CAPABILITY_MAP = Object.freeze({
  visit: 'visit_page', status: 'check_status', headers: 'get_headers', cookies: 'get_cookies',
  text: 'scrape_text', scrape: 'scrape_site', html: 'scrape_html', links: 'extract_links',
  images: 'extract_images', emails: 'extract_emails', social: 'extract_social', metadata: 'get_metadata',
  robots: 'check_robots', sitemap: 'check_sitemap', tech: 'technology_detect', seo: 'check_seo',
  performance: 'check_performance', size: 'get_page_size', report: 'generate_report'
});

export function capabilityForCommand(command) {
  return COMMAND_CAPABILITY_MAP[String(command || '').toLowerCase()] || null;
}

export function toolDefinitions(capabilities = KAI_ENABLED_CAPABILITIES) {
  const allowed = new Set(normalizeKaiCapabilities(capabilities));
  return getAllTools()
    .filter(([, tool]) => allowed.has(tool.capability))
    .map(([name, tool]) => ({ name, capability: tool.capability, description: tool.description, confirm: !!tool.confirm }));
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/g, '');
}

async function signAdmin69(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return b64url(new Uint8Array(sig));
}

function tokenFromRequest(req) {
  const auth = String(req.headers?.authorization || '');
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const cookieHeader = String(req.headers?.cookie || '');
  const cookie = cookieHeader.split(';').map(x => x.trim()).find(x => x.startsWith('haxbro_admin69='));
  if (cookie) return decodeURIComponent(cookie.slice('haxbro_admin69='.length));
  return String(req.headers?.['x-haxbro-admin69'] || req.body?.adminToken || '').trim();
}

export async function verifyKaiAuthorization(req) {
  if (KAI_CONTROL.authorization.required === false) return true;
  const token = tokenFromRequest(req);
  const secret = String(process.env.ADMIN69_PASSWORD || '');
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2 || !/^\\d+$/.test(parts[0])) return false;
  const issuedAt = Number(parts[0]);
  const age = Math.floor(Date.now() / 1000) - issuedAt;
  if (age < -60 || age > KAI_CONTROL.authorization.sessionMaxAgeSeconds) return false;
  const expected = await signAdmin69(parts[0], secret);
  return expected === parts[1];
}

export function targetHostIsPrivate(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\\[|\\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host === '::1') return true;
  if (/^127(?:\\.\\d{1,3}){3}$/.test(host)) return true;
  if (/^10(?:\\.\\d{1,3}){3}$/.test(host)) return true;
  if (/^192\\.168(?:\\.\\d{1,3}){2}$/.test(host)) return true;
  const m = host.match(/^172\\.(\\d{1,3})\\./);
  return !!(m && Number(m[1]) >= 16 && Number(m[1]) <= 31);
}

export function validateKaiTarget(value) {
  let url;
  try { url = new URL(String(value || '').trim()); } catch { throw new Error('A valid http:// or https:// target is required.'); }
  if (!KAI_CONTROL.targets.allowedProtocols.includes(url.protocol)) throw new Error('Unsupported target protocol.');
  if (KAI_CONTROL.targets.rejectEmbeddedCredentials && (url.username || url.password)) throw new Error('Embedded target credentials are not allowed.');
  if (!KAI_CONTROL.targets.allowLocalhost && targetHostIsPrivate(url.hostname)) throw new Error('Local/private targets are disabled by KAI target policy.');
  if (!KAI_CONTROL.targets.allowPrivateIPs && targetHostIsPrivate(url.hostname)) throw new Error('Private IP targets are disabled by KAI target policy.');
  return url;
}

export function kaiIntent(input) {
  const s = String(input || '').trim();
  const lower = s.toLowerCase();
  if (!s) return { name: 'chat', arg: '', reply: KAI_CONTROL.conversation.greeting };
  if (lower === 'help' || lower === '/help' || lower === 'what can you do' || lower === 'capabilities') return { name: 'help', arg: '' };
  if (lower.startsWith('hi') || lower.startsWith('hello') || lower.startsWith('hey') || lower.startsWith('yo') || lower.startsWith('hiya')) return { name: 'chat', arg: '', reply: KAI_CONTROL.conversation.greeting };
  if (lower.includes('who are you') || lower.includes('what are you')) return { name: 'chat', arg: '', reply: KAI_CONTROL.conversation.identity };
  if (lower.includes('thank')) return { name: 'chat', arg: '', reply: KAI_CONTROL.conversation.thanks };

  const tokens = s.split(' ');
  const url = tokens.find(x => x.startsWith('http://') || x.startsWith('https://'))?.replace(/[.,!?]+$/g, '') || '';
  if (!url) return { name: 'chat', arg: '', reply: KAI_CONTROL.conversation.casual };

  if (lower.includes('status') || lower.includes('response time') || lower.includes('online')) return { name: 'status', arg: url };
  if (lower.includes('header')) return { name: 'headers', arg: url };
  if (lower.includes('cookie')) return { name: 'cookies', arg: url };
  if (lower.includes('html') || lower.includes('source')) return { name: 'html', arg: url };
  if (lower.includes('link')) return { name: 'links', arg: url };
  if (lower.includes('image')) return { name: 'images', arg: url };
  if (lower.includes('email')) return { name: 'emails', arg: url };
  if (lower.includes('metadata') || lower.includes('meta tag')) return { name: 'metadata', arg: url };
  if (lower.includes('robots')) return { name: 'robots', arg: url };
  if (lower.includes('sitemap')) return { name: 'sitemap', arg: url };
  if (lower.includes('technology') || lower.includes('technologies') || lower.includes('tech stack') || lower.includes('framework')) return { name: 'tech', arg: url };
  if (lower.includes('seo')) return { name: 'seo', arg: url };
  if (lower.includes('performance') || lower.includes('speed') || lower.includes('latency')) return { name: 'performance', arg: url };
  if (lower.includes('page size') || lower.includes('bytes')) return { name: 'size', arg: url };
  if (lower.includes('report')) return { name: 'report', arg: url };
  if (lower.includes('scrape') || lower.includes('extract text') || lower.includes('read the page')) return { name: 'text', arg: url };
  return { name: 'visit', arg: url };
}

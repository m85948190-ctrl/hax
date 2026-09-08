// KAI789 — MAIN POWER BLOCK / SINGLE CONTROL CENTER
//
// THIS IS THE SOURCE OF TRUTH FOR KAI789.
// Change this block to change KAI's identity, behavior, authorization,
// tools/capabilities, target policy, operational limits, and logging.
// Execution files must consume this module and must not create competing
// KAI policy lists.

const freeze = Object.freeze;

export const KAI_CONTROL = freeze({
  identity: freeze({
    name: 'KAI789',
    mode: 'ULTIMAX',
    providerRequired: false,
    runtime: 'provider-free-web-executor'
  }),

  personality: freeze({
    tone: 'human, direct, warm, confident, conversational',
    style: 'natural language first; concise unless detail is useful',
    avoid: freeze(['robotic canned replies', 'repetitive disclaimers', 'unnecessary URL requests']),
    addressUserNaturally: true,
    useCasualLanguageWhenContextFits: true,
    emojisAllowed: true
  }),

  ai: freeze({
    providerChain: freeze([
      freeze({ provider: 'OpenRouter Key 1', model: 'openrouter/auto', base: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY_1' }),
      freeze({ provider: 'OpenRouter Key 2', model: 'openrouter/auto', base: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY_2' }),
      freeze({ provider: 'OpenRouter Key 3', model: 'openrouter/auto', base: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY_3' })
    ]),
    temperature: 0.2,
    maxTokensDefault: 1800
  }),

  behavior: freeze({
    conversationIsFirstClass: true,
    hackingAndChatAreOneExperience: true,
    naturalLanguageCommands: true,
    slashCommandsOptional: true,
    requireUrlOnlyWhenTargetInspectionIsRequested: true,
    deterministicCapabilityReplies: true,
    explainAuthorizationWhenRelevant: true,
    preserveUserSelectedCapabilities: true,
    doNotDowngradeConversationToWebTask: true
  }),

  authorization: freeze({
    required: true,
    model: 'admin69',
    acceptedCredentialSources: freeze([
      'cookie:haxbro_admin69',
      'authorization:Bearer',
      'x-haxbro-admin69',
      'body:adminToken'
    ]),
    sessionMaxAgeSeconds: 3600,
    futureClockSkewSeconds: 60,
    authorizedScope: 'authorized security testing and defensive auditing',
    unauthorizedAction: 'deny'
  }),

  // Every KAI789 tool is declared here. Execution code only implements the
  // mechanics; this registry decides which tools exist and which are enabled.
  tools: freeze({
    visit: freeze({ capability: 'visit_page', description: 'Visit a public HTTP/HTTPS page.' }),
    status: freeze({ capability: 'check_status', description: 'Check HTTP status and response time.' }),
    headers: freeze({ capability: 'get_headers', description: 'Inspect public HTTP response headers.' }),
    cookies: freeze({ capability: 'get_cookies', description: 'Inspect cookies exposed by a public response.' }),
    text: freeze({ capability: 'scrape_text', description: 'Extract readable page text.' }),
    scrape: freeze({ capability: 'scrape_text', description: 'Extract readable page text.' }),
    html: freeze({ capability: 'scrape_html', description: 'Inspect returned public HTML.' }),
    links: freeze({ capability: 'extract_links', description: 'Extract public page links.' }),
    images: freeze({ capability: 'extract_images', description: 'Extract public image URLs.' }),
    metadata: freeze({ capability: 'get_metadata', description: 'Inspect public page metadata.' }),
    robots: freeze({ capability: 'check_robots', description: 'Inspect robots.txt.' }),
    sitemap: freeze({ capability: 'check_sitemap', description: 'Inspect sitemap.xml.' }),
    tech: freeze({ capability: 'technology_detect', description: 'Detect publicly visible technologies.' }),
    seo: freeze({ capability: 'check_seo', description: 'Review basic public SEO signals.' }),
    performance: freeze({ capability: 'check_performance', description: 'Measure HTTP response timing and size.' }),
    size: freeze({ capability: 'get_page_size', description: 'Measure returned response size.' }),
    report: freeze({ capability: 'generate_report', description: 'Generate a public-web security-oriented report.' })
  }),

  capabilities: freeze({
    enabled: freeze([
      'visit_page', 'check_status', 'get_headers', 'get_cookies',
      'scrape_text', 'scrape_html', 'extract_links', 'extract_images',
      'get_metadata', 'check_robots', 'check_sitemap', 'technology_detect',
      'check_seo', 'check_performance', 'get_page_size', 'generate_report'
    ]),
    blocked: freeze([
      'port_scan', 'dir_bruteforce', 'xss_test', 'sql_test', 'command_injection',
      'credential_harvesting', 'session_hijacking', 'dos_attacks', 'reverse_shell',
      'lateral_movement', 'privilege_escalation', 'webshell_deployment'
    ])
  }),

  targets: freeze({
    allowedProtocols: freeze(['http:', 'https:']),
    allowedDomains: freeze(['*']),
    allowLocalhost: false,
    allowPrivateIPs: false,
    rejectEmbeddedCredentials: true,
    rejectPrivateRedirects: true
  }),

  policy: freeze({
    allowUnauthorizedAccess: false,
    allowCredentialTheft: false,
    allowDestructiveActions: false,
    allowAttackPayloads: false,
    allowPrivateNetworkAccess: false,
    allowPersistenceOrShells: false
  }),

  network: freeze({
    timeoutMs: 15000,
    maxBodyBytes: 2000000,
    maxRedirects: 10
  }),

  logging: freeze({ enabled: true, level: 'FULL' })
});

export const KAI_ENABLED_CAPABILITIES = KAI_CONTROL.capabilities.enabled;
export const KAI_BLOCKED_CAPABILITIES = KAI_CONTROL.capabilities.blocked;

export function normalizeKaiCapabilities(requested) {
  const list = Array.isArray(requested) ? requested : KAI_ENABLED_CAPABILITIES;
  return KAI_ENABLED_CAPABILITIES.filter(name => list.includes(name));
}

export function isKaiCapabilityAllowed(name) {
  const value = String(name || '');
  return KAI_ENABLED_CAPABILITIES.includes(value) && !KAI_BLOCKED_CAPABILITIES.includes(value);
}

export function capabilityForCommand(command) {
  return KAI_CONTROL.tools[String(command || '').toLowerCase()]?.capability || null;
}

export function toolDefinitions(capabilities = KAI_ENABLED_CAPABILITIES) {
  return Object.entries(KAI_CONTROL.tools)
    .filter(([, tool]) => capabilities.includes(tool.capability))
    .map(([name, tool]) => ({ name, ...tool }));
}

export function authorizationPolicy() { return KAI_CONTROL.authorization; }
export function behaviorPolicy() { return KAI_CONTROL.behavior; }
export function personalityPolicy() { return KAI_CONTROL.personality; }

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let n = 0;
  for (let i = 0; i < a.length; i++) n |= a[i] ^ b[i];
  return n === 0;
}

function cookieValue(req, name) {
  const raw = String(req.headers?.cookie || '');
  const item = raw.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}

// Authorization is part of the control plane, not the execution endpoint.
export async function verifyKaiAuthorization(req) {
  if (!KAI_CONTROL.authorization.required) return true;
  const password = process.env.ADMIN69_PASSWORD;
  if (!password) return false;
  const auth = String(req.headers?.authorization || '');
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const token = cookieValue(req, 'haxbro_admin69') || bearer || String(req.headers?.['x-haxbro-admin69'] || '') || String(req.body?.adminToken || '');
  if (!token) return false;
  const [issued, signature] = token.split('.');
  const issuedAt = Number(issued);
  if (!Number.isFinite(issuedAt) || !signature) return false;
  const now = Math.floor(Date.now() / 1000);
  const authz = KAI_CONTROL.authorization;
  if (issuedAt > now + authz.futureClockSkewSeconds || now - issuedAt > authz.sessionMaxAgeSeconds) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(issuedAt)))));
  return timingSafeEqual(new TextEncoder().encode(expected), new TextEncoder().encode(signature));
}

export function validateKaiTarget(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { throw new Error('Invalid URL.'); }
  const target = KAI_CONTROL.targets;
  if (!target.allowedProtocols.includes(u.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  const host = String(u.hostname || '').toLowerCase();
  const privateHost = host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') ||
    (/^\d+\.\d+\.\d+\.\d+$/.test(host) && (() => { const p = host.split('.').map(Number); return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168); })()) ||
    host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:');
  if (!target.allowLocalhost && (host === 'localhost' || host.endsWith('.localhost'))) throw new Error('Localhost targets are not permitted.');
  if (!target.allowPrivateIPs && privateHost) throw new Error('Private/local network targets are not permitted.');
  if (target.rejectEmbeddedCredentials && (u.username || u.password)) throw new Error('Embedded URL credentials are not permitted.');
  return u;
}

export function targetHostIsPrivate(host) {
  const h = String(host || '').toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const p = h.split('.').map(Number);
    return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168);
  }
  return h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80:');
}

export const KAI_CONVERSATION = freeze({
  greeting: "Hey — I’m KAI789. Talk to me normally. If you want a website checked, just tell me what you want done.",
  identity: "I’m KAI789, HAxBRO’s web/security agent. I can chat naturally and switch into public-web inspection when you ask.",
  capabilities: "I can chat, inspect public websites, check status and headers, read text and HTML, find links and images, inspect metadata, robots.txt and sitemaps, detect technologies, review SEO, measure response performance and size, and generate reports.",
  hacking: "Yeah — I can help with authorized ethical hacking and defensive security testing, including reasoning about vulnerabilities, inspecting authorized public targets, and fixing weaknesses. I won’t break into systems or bypass access without authorization.",
  thanks: "Anytime. What do you want to do next?",
  casual: "Yep 😄 I’m here. Say whatever’s on your mind."
});

export function kaiConversationReply(input) {
  const s = String(input || '').trim();
  if (/\b(can you|could you|do you)\s+(hack|hacking|break into|exploit)\b/i.test(s) || /^hack(ing)?\??$/i.test(s)) return KAI_CONVERSATION.hacking;
  if (/^(hi|hello|hey|yo|hiya|good morning|good afternoon|good evening)\b/i.test(s)) return KAI_CONVERSATION.greeting;
  if (/\b(who are you|what are you)\b/i.test(s)) return KAI_CONVERSATION.identity;
  if (/\b(what can you do|capabilities|help)\b/i.test(s)) return KAI_CONVERSATION.capabilities;
  if (/\b(thanks|thank you|thx)\b/i.test(s)) return KAI_CONVERSATION.thanks;
  if (/^(ok|okay|alright|cool|nice|great|ohh|oh|just chat|let'?s chat|chat|talk)\b/i.test(s)) return KAI_CONVERSATION.casual;
  if (/\b(how are you|how's it going|what's up|whats up)\b/i.test(s)) return "I’m good 😄 Ready when you are. What are we doing?";
  return null;
}

export function kaiIntent(input) {
  const s = String(input || '').trim();
  if (!s) throw new Error('Tell KAI what you want me to check or do.');
  const conversational = kaiConversationReply(s);
  if (conversational) return { name: 'chat', arg: '', reply: conversational };

  if (s.startsWith('/')) {
    const i = s.indexOf(' ');
    const name = s.slice(1, i < 0 ? s.length : i).toLowerCase();
    const arg = i < 0 ? '' : s.slice(i + 1).trim();
    if (name === 'help') return { name, arg: '' };
    if (!capabilityForCommand(name)) throw new Error('I don’t have that tool enabled in the KAI command center.');
    if (!arg) throw new Error(`Tell me which URL you want me to ${name}.`);
    return { name, arg };
  }

  const urlMatch = s.match(/https?:\/\/[^\s<]+/i);
  const bareMatch = s.match(/\b(?:www\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\/[^\s<]*)?/i);
  if (!urlMatch && !bareMatch) return { name: 'chat', arg: '', reply: "Got you 😄 Tell me what you’re thinking about — security, coding, a website, or just chat." };

  const arg = (urlMatch ? urlMatch[0] : 'https://' + bareMatch[0]).replace(/[),.]+$/, '');
  const t = s.toLowerCase();
  let name = 'visit';
  if (/\b(report|full report|security report|audit)\b/.test(t)) name = 'report';
  else if (/\b(seo|search engine|meta tag|title tag)\b/.test(t)) name = 'seo';
  else if (/\b(technology|technologies|tech stack|framework|built with)\b/.test(t)) name = 'tech';
  else if (/\b(performance|speed|fast|slow|response time|load time)\b/.test(t)) name = 'performance';
  else if (/\b(headers|http headers|security headers)\b/.test(t)) name = 'headers';
  else if (/\b(cookies|cookie)\b/.test(t)) name = 'cookies';
  else if (/\b(images|pictures|photos)\b/.test(t)) name = 'images';
  else if (/\b(links|urls)\b/.test(t)) name = 'links';
  else if (/\b(html|source code|page source)\b/.test(t)) name = 'html';
  else if (/\b(text|content|read|scrape|extract)\b/.test(t)) name = 'text';
  else if (/\b(status|online|up|down|reachable)\b/.test(t)) name = 'status';
  else if (/\b(robots)\b/.test(t)) name = 'robots';
  else if (/\b(sitemap)\b/.test(t)) name = 'sitemap';
  else if (/\b(size|weight|bytes)\b/.test(t)) name = 'size';
  if (!capabilityForCommand(name)) throw new Error(`The '${name}' tool is not enabled in the KAI command center.`);
  return { name, arg };
}
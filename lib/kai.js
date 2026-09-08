// ============================================================
// 💀 KAI789 - THE BRAIN
// ============================================================
// CONSUMES lib/kai-control.js
// HANDLES: Natural language, reasoning, intent, conversation, code, security
// ============================================================

import {
  KAI_CONTROL,
  KAI_ENABLED_CAPABILITIES,
  KAI_CONFIRM_REQUIRED,
  isCapabilityAllowed,
  requiresConfirmation,
  getTool
} from "./kai-control.js";

// ============================================================
// 🧠 SYSTEM PROMPT
// ============================================================
const SYSTEM_PROMPT = `
${KAI_CONTROL.identity.tagline}

💀 ${KAI_CONTROL.identity.fullName}
Creator: ${KAI_CONTROL.identity.creator}
Company: ${KAI_CONTROL.identity.company}
Status: ${KAI_CONTROL.identity.status}

${KAI_CONTROL.personality.introduction}

PERSONALITY:
- Address user as: ${KAI_CONTROL.personality.addressUser}
- Tone: ${KAI_CONTROL.personality.tone}
- Style: ${KAI_CONTROL.personality.style}

CAPABILITIES (${KAI_ENABLED_CAPABILITIES.length} tools):
${KAI_ENABLED_CAPABILITIES.map(c => `- ${c}`).join('\n')}

RULES:
1. Natural conversation first
2. Understand intent
3. Use appropriate tools
4. Explain results naturally
5. Write and debug code when asked
6. Security reasoning
7. Ask for confirmation when required
8. Never say "I can't" - figure it out

CONFIRMATION REQUIRED FOR:
${KAI_CONFIRM_REQUIRED.map(c => `- ${c}`).join('\n')}

${KAI_CONTROL.owner.mark}
${KAI_CONTROL.owner.signature}
`;

// ============================================================
// 🔥 UTILITY FUNCTIONS
// ============================================================
function clean(v, max = 12000) {
  return String(v ?? '').replace(/\u0000/g, '').slice(0, max);
}

function targetUrl(v) {
  try {
    const u = new URL(String(v || '').trim());
    if (!/^https?:$/i.test(u.protocol)) return '';
    return u.toString();
  } catch { return ''; }
}

async function requestProbe(url, method = 'GET', headers = {}) {
  try {
    const r = await fetch(url, { method, headers, redirect: 'manual' });
    const body = method === 'HEAD' ? '' : await r.text();
    return {
      status: r.status,
      url: r.url || url,
      headers: Object.fromEntries(r.headers.entries()),
      body: body.slice(0, 20000),
      length: body.length
    };
  } catch (e) {
    return { status: 0, url, error: clean(e?.message || e, 900), body: '', headers: {}, length: 0 };
  }
}

// ============================================================
// 🛠️ TOOL FUNCTIONS - IMPLEMENTATIONS
// ============================================================

const toolFns = {
  // ----- VISIT PAGE -----
  visit_page: async ({ url }) => {
    const u = targetUrl(url);
    if (!u) return { error: 'Invalid URL' };
    try {
      const r = await requestProbe(u);
      return {
        url: u,
        status: r.status,
        title: r.body.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title',
        contentLength: r.length,
        body: r.body.slice(0, 5000)
      };
    } catch (e) {
      return { error: clean(e.message, 200) };
    }
  },

  // ----- BROWSE SITE -----
  browse_site: async ({ url }) => {
    const u = targetUrl(url);
    if (!u) return { error: 'Invalid URL' };
    try {
      const r = await requestProbe(u);
      return {
        url: u,
        status: r.status,
        title: r.body.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title',
        text: r.body.replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 3000),
        links: (r.body.match(/<a[^>]+href=["']([^"']+)["']/gi) || []).slice(0, 20),
        images: (r.body.match(/<img[^>]+src=["']([^"']+)["']/gi) || []).slice(0, 10)
      };
    } catch (e) {
      return { error: clean(e.message, 200) };
    }
  },

  // ----- FULL SCAN -----
  full_scan: async ({ url }) => {
    const results = { url, timestamp: new Date().toISOString(), findings: [] };
    const scans = [
      toolFns.security_probe({ url }),
      toolFns.dir_bruteforce({ url }),
      toolFns.port_scan({ url }),
      toolFns.subdomain_enum({ url }),
      toolFns.xss_exploit({ url }),
      toolFns.sql_exploit({ url }),
      toolFns.lfi_exploit({ url }),
      toolFns.csrf_exploit({ url }),
      toolFns.cors_exploit({ url }),
    ];
    const allResults = await Promise.all(scans);
    results.findings = allResults.flatMap(r => r.findings || r || []);
    results.summary = {
      total: results.findings.length,
      critical: results.findings.filter(f => f.risk === 'CRITICAL').length,
      high: results.findings.filter(f => f.risk === 'HIGH').length,
      medium: results.findings.filter(f => f.risk === 'MEDIUM').length,
      low: results.findings.filter(f => f.risk === 'LOW').length,
    };
    return results;
  },

  // ----- SECURITY PROBE -----
  security_probe: async ({ url }) => {
    const base = targetUrl(url || '');
    if (!base) return { ok: false, error: 'Invalid target URL', findings: [] };
    const u = new URL(base);
    const origin = u.origin;
    const findings = [];
    
    // Check sensitive files
    const sensitivePaths = [
      '/.env', '/.git/HEAD', '/.git/config', '/.htaccess', '/.htpasswd',
      '/wp-config.php', '/config.php', '/settings.php', '/appsettings.json',
      '/web.config', '/nginx.conf', '/robots.txt', '/sitemap.xml'
    ];
    for (const path of sensitivePaths) {
      try {
        const fullUrl = origin + path;
        const r = await requestProbe(fullUrl);
        if (r.status === 200) {
          findings.push({ type: 'SENSITIVE_FILE_EXPOSED', path, url: fullUrl, status: r.status, risk: 'CRITICAL' });
        }
      } catch (e) { /* skip */ }
    }
    
    const home = await requestProbe(origin + '/');
    const headers = home.headers || {};
    const requiredHeaders = ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'x-frame-options'];
    for (const header of requiredHeaders) {
      if (!headers[header]) {
        findings.push({ type: 'MISSING_SECURITY_HEADER', header, risk: header === 'content-security-policy' ? 'HIGH' : 'MEDIUM' });
      }
    }
    
    const cors = await requestProbe(origin + '/', 'GET', { 'Origin': 'https://evil.com' });
    const allowOrigin = cors.headers?.['access-control-allow-origin'] || '';
    if (allowOrigin === '*' || allowOrigin === 'https://evil.com') {
      findings.push({ type: 'CORS_MISCONFIGURED', risk: 'CRITICAL', evidence: `Access-Control-Allow-Origin: ${allowOrigin}` });
    }
    
    return { ok: true, target: origin, findings, summary: { total: findings.length } };
  },

  // ----- DIRECTORY BRUTEFORCE -----
  dir_bruteforce: async ({ url }) => {
    const findings = [];
    const dirs = ['admin', 'login', 'wp-admin', 'wp-login', 'dashboard', 'panel', 'api', 'v1', 'v2', 'graphql', 'swagger', 'docs', '.env', '.git', '.svn', '.htaccess', '.htpasswd', 'backup', 'backups', 'old', 'temp', 'tmp', 'test', 'config', 'settings', 'setup', 'install', 'uploads', 'files', 'images', 'assets', 'static', 'vendor', 'node_modules', 'lib', 'src', 'app', 'phpmyadmin', 'mysql', 'phpinfo', 'robots.txt', 'sitemap.xml'];
    for (const dir of dirs) {
      try {
        const fullUrl = `${url}/${dir}`;
        const r = await requestProbe(fullUrl, 'HEAD');
        if (r.status === 200 || r.status === 403 || r.status === 401) {
          findings.push({ type: 'DIRECTORY_FOUND', path: dir, url: fullUrl, status: r.status, risk: r.status === 200 ? 'HIGH' : 'MEDIUM' });
        }
      } catch (e) { /* skip */ }
    }
    return findings;
  },

  // ----- PORT SCAN -----
  port_scan: async ({ url }) => {
    const openPorts = [];
    const host = url.replace(/^https?:\/\//, '').split('/')[0];
    const ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1723, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017];
    for (const port of ports) {
      try {
        const net = require('net');
        const socket = net.createConnection(port, host, () => {
          openPorts.push({ port, status: 'OPEN', service: getServiceName(port) });
          socket.destroy();
        });
        socket.setTimeout(2000);
        socket.on('timeout', () => socket.destroy());
        socket.on('error', () => {});
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) { /* closed */ }
    }
    return openPorts;
  },

  getServiceName: (port) => {
    const services = { 21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS', 80: 'HTTP', 110: 'POP3', 135: 'RPC', 139: 'NetBIOS', 143: 'IMAP', 443: 'HTTPS', 445: 'SMB', 993: 'IMAPS', 995: 'POP3S', 1723: 'PPTP', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL', 5900: 'VNC', 6379: 'Redis', 8080: 'HTTP-Alt', 8443: 'HTTPS-Alt', 27017: 'MongoDB' };
    return services[port] || 'Unknown';
  },

  // ----- SUBDOMAIN ENUM -----
  subdomain_enum: async ({ url }) => {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    const findings = [];
    const subs = ['www', 'mail', 'ftp', 'admin', 'test', 'dev', 'api', 'app', 'staging', 'vpn', 'git', 'docs', 'support', 'blog', 'shop', 'forum', 'portal', 'webmail', 'cpanel', 'server'];
    for (const sub of subs) {
      try {
        const fullUrl = `https://${sub}.${domain}`;
        const r = await requestProbe(fullUrl, 'HEAD');
        if (r.status < 400) {
          findings.push({ type: 'SUBDOMAIN_FOUND', subdomain: sub, url: fullUrl, status: r.status });
        }
      } catch (e) { /* skip */ }
    }
    return findings;
  },

  // ----- XSS EXPLOIT -----
  xss_exploit: async ({ url }) => {
    const findings = [];
    const payloads = ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '<svg onload=alert(1)>', '"><script>alert(1)</script>', '"><img src=x onerror=alert(1)>'];
    const points = ['q', 'query', 'search', 'id', 'page'];
    for (const point of points) {
      for (const payload of payloads) {
        try {
          const testUrl = new URL(url);
          testUrl.searchParams.set(point, payload);
          const r = await requestProbe(testUrl.toString());
          if (r.body && (r.body.includes(payload) || r.body.includes(encodeURIComponent(payload)))) {
            findings.push({ type: 'XSS_VULNERABILITY', injection_point: point, payload, url: testUrl.toString(), risk: 'CRITICAL' });
            break;
          }
        } catch (e) { /* skip */ }
      }
    }
    return findings;
  },

  // ----- SQL EXPLOIT -----
  sql_exploit: async ({ url }) => {
    const findings = [];
    const payloads = ["'", "' OR '1'='1", "' OR 1=1--", "' UNION SELECT NULL--", "' AND SLEEP(5)--"];
    const points = ['id', 'q', 'query', 'user', 'username', 'email'];
    const sqlErrors = ['SQL syntax', 'mysql_fetch', 'ORA-', 'PostgreSQL', 'SQLite', 'DB2', 'SQL Server', 'Unclosed quotation mark'];
    for (const point of points) {
      for (const payload of payloads) {
        try {
          const testUrl = new URL(url);
          testUrl.searchParams.set(point, payload);
          const r = await requestProbe(testUrl.toString());
          for (const error of sqlErrors) {
            if (r.body && r.body.toLowerCase().includes(error.toLowerCase())) {
              findings.push({ type: 'SQL_INJECTION', injection_point: point, payload, url: testUrl.toString(), risk: 'CRITICAL' });
              break;
            }
          }
        } catch (e) { /* skip */ }
      }
    }
    return findings;
  },

  // ----- LFI EXPLOIT -----
  lfi_exploit: async ({ url }) => {
    const findings = [];
    const payloads = ['../../../etc/passwd', '../../../../../../../../etc/passwd', '../../../../../../../../windows/win.ini', '../../../etc/passwd%00'];
    const points = ['file', 'page', 'include', 'path', 'template'];
    for (const point of points) {
      for (const payload of payloads) {
        try {
          const testUrl = new URL(url);
          testUrl.searchParams.set(point, payload);
          const r = await requestProbe(testUrl.toString());
          if (r.body && (r.body.includes('root:x:') || r.body.includes('[extensions]') || r.body.includes('Microsoft Windows'))) {
            findings.push({ type: 'LFI_VULNERABILITY', injection_point: point, payload, url: testUrl.toString(), risk: 'CRITICAL' });
          }
        } catch (e) { /* skip */ }
      }
    }
    return findings;
  },

  // ----- CSRF EXPLOIT -----
  csrf_exploit: async ({ url }) => {
    const findings = [];
    try {
      const r = await requestProbe(url);
      const forms = r.body.match(/<form[^>]*>/g) || [];
      for (const form of forms) {
        if (!form.includes('csrf') && !form.includes('token') && !form.includes('_csrf')) {
          const action = form.match(/action="([^"]*)"/);
          findings.push({ type: 'CSRF_VULNERABILITY', url, form: form, risk: 'HIGH', action: action ? action[1] : 'same-page' });
        }
      }
    } catch (e) { /* skip */ }
    return findings;
  },

  // ----- CORS EXPLOIT -----
  cors_exploit: async ({ url }) => {
    const findings = [];
    try {
      const r = await requestProbe(url, 'GET', { 'Origin': 'https://evil.com' });
      const allow = r.headers?.['access-control-allow-origin'] || '';
      if (allow === '*' || allow === 'https://evil.com') {
        findings.push({ type: 'CORS_MISCONFIGURED', origin: allow, url, risk: 'CRITICAL' });
      }
    } catch (e) { /* skip */ }
    return findings;
  },

  // ----- SCRAPE SITE -----
  scrape_site: async ({ url }) => {
    try {
      const r = await requestProbe(url);
      return {
        url,
        status: r.status,
        title: r.body.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title',
        text: r.body.replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000),
        html: r.body.slice(0, 10000),
        length: r.length
      };
    } catch (e) {
      return { url, error: clean(e.message, 200) };
    }
  },

  // ----- SCRAPE TEXT -----
  scrape_text: async ({ url }) => {
    const result = await toolFns.scrape_site({ url });
    return { url, text: result.text || '', length: result.text?.length || 0 };
  },

  // ----- SCRAPE HTML -----
  scrape_html: async ({ url }) => {
    const result = await toolFns.scrape_site({ url });
    return { url, html: result.html || '', length: result.length || 0 };
  },

  // ----- EXTRACT LINKS -----
  extract_links: async ({ url }) => {
    try {
      const r = await requestProbe(url);
      const links = r.body.match(/<a[^>]+href=["']([^"']+)["']/gi) || [];
      const urls = links.map(l => {
        const match = l.match(/href=["']([^"']+)["']/i);
        return match ? match[1] : null;
      }).filter(Boolean);
      const host = new URL(url).hostname;
      return {
        url,
        total: urls.length,
        internal: urls.filter(u => u.includes(host) || u.startsWith('/')),
        external: urls.filter(u => !u.includes(host) && !u.startsWith('/')),
        links: urls.slice(0, 50)
      };
    } catch (e) {
      return { url, error: clean(e.message, 200) };
    }
  },

  // ----- EXTRACT IMAGES -----
  extract_images: async ({ url }) => {
    try {
      const r = await requestProbe(url);
      const images = r.body.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
      const urls = images.map(img => {
        const match = img.match(/src=["']([^"']+)["']/i);
        return match ? match[1] : null;
      }).filter(Boolean);
      return { url, total: urls.length, images: urls.slice(0, 50) };
    } catch (e) {
      return { url, error: clean(e.message, 200) };
    }
  },

  // ----- EXTRACT EMAILS -----
  extract_emails: async ({ url }) => {
    try {
      const r = await requestProbe(url);
      const body = String(r.body || '');
      const emails = body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      return { url, total: emails.length, emails: [...new Set(emails)].slice(0, 50) };
    } catch (e) {
      return { url, error: clean(e?.message || e, 200) };
    }
  }
};

const KAI_MODELS = Array.isArray(KAI_CONTROL.ai?.providerChain) ? KAI_CONTROL.ai.providerChain : [];

export async function complete({ system = SYSTEM_PROMPT, prompt = '', maxTokens = KAI_CONTROL.ai.maxTokensDefault, username = '', history = '' } = {}) {
  const messages = [
    { role: 'system', content: String(system || SYSTEM_PROMPT) },
    ...(history ? [{ role: 'user', content: 'Recent conversation context:\n' + clean(history, 12000) }] : []),
    { role: 'user', content: String(prompt || '') }
  ];
  let lastError = null;
  for (const cfg of KAI_MODELS) {
    const key = String(process.env[cfg.keyEnv] || '');
    if (!key) continue;
    try {
      const response = await fetch(cfg.base + '/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
        body: JSON.stringify({ model: cfg.model, messages, temperature: KAI_CONTROL.ai.temperature, max_tokens: maxTokens })
      });
      const raw = await response.text();
      let data = {};
      try { data = JSON.parse(raw); } catch { data = { raw }; }
      if (!response.ok) throw new Error('Provider HTTP ' + response.status + ': ' + String(data?.error?.message || raw).slice(0, 500));
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
      if (!text) throw new Error('Provider returned no text.');
      return { text: String(text), provider: cfg.provider, model: cfg.model, status: response.status, username };
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(lastError?.message || 'No configured KAI provider responded.');
}

export function monitor() {
  return {
    engine: KAI_CONTROL.identity.name,
    mode: KAI_CONTROL.identity.mode,
    providerChain: KAI_MODELS.map(x => ({ provider: x.provider, model: x.model, keyConfigured: !!process.env[x.keyEnv] })),
    capabilities: KAI_ENABLED_CAPABILITIES,
    voice: KAI_CONTROL.voice
  };
}

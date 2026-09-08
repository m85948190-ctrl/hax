import { KAI_ULTIMAX_PERMISSIONS, normalizeKaiCapabilities } from "lib/kai-ultimax-permissions.js";

export const access = "public";
export const methods = ["POST", "GET"];

const COOKIE = "haxbro_admin69";
const MAX_BODY = KAI_ULTIMAX_PERMISSIONS.network.maxBodyBytes;
const TIMEOUT = KAI_ULTIMAX_PERMISSIONS.network.timeoutMs;

const COMMANDS = {
  visit: 'visit_page', status: 'check_status', headers: 'get_headers',
  cookies: 'get_cookies', text: 'scrape_text', scrape: 'scrape_text',
  html: 'scrape_html', links: 'extract_links', images: 'extract_images',
  metadata: 'get_metadata', robots: 'check_robots', sitemap: 'check_sitemap',
  tech: 'technology_detect', seo: 'check_seo', performance: 'check_performance',
  size: 'get_page_size', report: 'generate_report'
};

function send(res, data, status = 200) {
  return res.status(status).json(data);
}

function cookieValue(req, name) {
  const raw = String(req.headers?.cookie || '');
  const item = raw.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromB64url(s) {
  const padded = String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let n = 0;
  for (let i = 0; i < a.length; i++) n |= a[i] ^ b[i];
  return n === 0;
}

async function verifyAdmin(req) {
  const password = process.env.ADMIN69_PASSWORD;
  if (!password) return false;
  const auth = String(req.headers?.authorization || '');
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const token = cookieValue(req, COOKIE) || bearer || String(req.headers?.['x-haxbro-admin69'] || '') || String(req.body?.adminToken || '');
  if (!token) return false;
  const [issued, signature] = token.split('.');
  const issuedAt = Number(issued);
  if (!Number.isFinite(issuedAt) || !signature) return false;
  // Admin69 auth issues Unix timestamps in seconds. Keep verification in the
  // same unit; the previous verifier compared seconds against Date.now() ms,
  // making every freshly issued Admin69 token appear expired.
  const now = Math.floor(Date.now() / 1000);
  if (issuedAt > now + 60 || now - issuedAt > 3600) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(issuedAt)))));
  return timingSafeEqual(new TextEncoder().encode(expected), new TextEncoder().encode(signature));
}

function clean(v, max = 12000) { return String(v ?? '').replace(/\u0000/g, '').slice(0, max); }

function privateHost(host) {
  const h = String(host || '').toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const p = h.split('.').map(Number);
    return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168);
  }
  return h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80:');
}

function validateUrl(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { throw new Error('Invalid URL.'); }
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  if (privateHost(u.hostname)) throw new Error('Private/local network targets are not permitted.');
  if (u.username || u.password) throw new Error('Embedded URL credentials are not permitted.');
  return u;
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const r = await fetch(url.toString(), {
      method: 'GET', redirect: 'follow', signal: controller.signal,
      headers: {
        'user-agent': 'KAI789-WebInspector/1.0',
        'accept': 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.5'
      }
    });
    const finalUrl = new URL(r.url);
    if (privateHost(finalUrl.hostname)) throw new Error('Redirected to a private/local target.');
    const declared = Number(r.headers.get('content-length') || 0);
    if (declared > MAX_BODY) throw new Error('Response exceeds KAI789 size limit.');
    const buf = await r.arrayBuffer();
    if (buf.byteLength > MAX_BODY) throw new Error('Response exceeds KAI789 size limit.');
    return { response: r, finalUrl, body: new TextDecoder().decode(buf), bytes: buf.byteLength, contentType: r.headers.get('content-type') || '' };
  } finally { clearTimeout(timer); }
}

function text(html) {
  return clean(String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'"), 50000);
}

function title(html) { const m = String(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i); return m ? text(m[1]).slice(0, 1000) : null; }
function attrs(html, tag, attr) {
  const r = new RegExp(`<${tag}\\b[^>]*\\b${attr}\\s*=\\s*["']([^"']+)["'][^>]*>`, 'gi');
  const out = []; let m;
  while ((m = r.exec(String(html))) && out.length < 500) out.push(m[1]);
  return [...new Set(out)];
}
function links(base, html, tag = 'a', attr = 'href') {
  return attrs(html, tag, attr).map(x => { try { const u = new URL(x, base); return ['http:', 'https:'].includes(u.protocol) ? u.toString() : null; } catch { return null; } }).filter(Boolean);
}
function meta(html) {
  const r = /<meta\b[^>]*(?:name|property)\s*=\s*["']([^"']+)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/gi;
  const out = []; let m;
  while ((m = r.exec(String(html))) && out.length < 200) out.push({ name: m[1], content: clean(m[2], 4000) });
  return out;
}
function technologies(html, headers) {
  const t = String(html).toLowerCase(); const out = [];
  const server = headers.get('server'); const powered = headers.get('x-powered-by');
  if (server) out.push({ category: 'server', value: server });
  if (powered) out.push({ category: 'runtime', value: powered });
  for (const [name, re] of [
    ['Next.js', /__next|_next\/static/i], ['React', /react(?:dom)?/i], ['Vue', /vue(?:\.runtime)?/i],
    ['Angular', /ng-version|angular/i], ['WordPress', /wp-content|wp-includes/i], ['Shopify', /cdn\.shopify|shopify/i],
    ['Wix', /wixstatic|wix\.com/i], ['Webflow', /webflow/i], ['Bootstrap', /bootstrap(?:\.min)?\.css/i],
    ['Tailwind CSS', /tailwind/i], ['jQuery', /jquery(?:\.min)?\.js/i], ['Google Analytics', /google-analytics|googletagmanager/i]
  ]) if (re.test(t)) out.push({ category: 'framework/library', value: name });
  return out;
}

function capabilityFor(command) { return COMMANDS[command] || null; }

function parse(input) {
  let s = String(input || '').trim();
  if (!s) throw new Error('Empty KAI789 command. Use /help.');

  // Be forgiving at the command boundary: the Admin Ultimax chat may send a
  // bare URL or a natural "visit <url>" request. Normalize those into the
  // canonical slash-command form instead of surfacing a misleading
  // "connection error" to the user.
  if (/^https?:\/\//i.test(s)) s = '/visit ' + s;
  else if (/^visit\s+https?:\/\//i.test(s)) s = '/' + s;

  if (!s.startsWith('/')) throw new Error('Use a KAI789 command beginning with /. Example: /visit https://example.com');
  const i = s.indexOf(' '); const name = s.slice(1, i < 0 ? s.length : i).toLowerCase(); const arg = i < 0 ? '' : s.slice(i + 1).trim();
  if (name === 'help') return { name, arg: '' };
  if (!capabilityFor(name)) throw new Error(`Unknown command /${name}. Use /help.`);
  if (!arg) throw new Error(`/${name} requires a URL or domain.`);
  return { name, arg };
}

function help(capabilities) {
  return Object.entries(COMMANDS).filter(([, cap]) => capabilities.includes(cap)).map(([c]) => `/${c} <url>`);
}

async function run(name, arg, capabilities) {
  if (name === 'help') return { commands: help(capabilities), provider: null };
  const capability = capabilityFor(name);
  if (!capabilities.includes(capability)) throw new Error(`Capability '${capability}' is disabled in the KAI789 capability box.`);
  const u = validateUrl(arg);
  const started = Date.now();
  const p = await fetchPage(u);
  const h = p.response.headers;
  const base = p.finalUrl.toString();

  if (name === 'status') return { url: u.toString(), finalUrl: base, status: p.response.status, statusText: p.response.statusText, responseTimeMs: Date.now() - started };
  if (name === 'headers' || name === 'cookies') {
    const obj = {};
    for (const [k, v] of h.entries()) obj[k] = v;
    return { url: u.toString(), finalUrl: base, headers: name === 'headers' ? obj : { 'set-cookie': h.get('set-cookie') || null } };
  }
  if (name === 'text' || name === 'scrape') return { url: u.toString(), finalUrl: base, title: title(p.body), text: text(p.body) };
  if (name === 'html') return { url: u.toString(), finalUrl: base, html: clean(p.body, MAX_BODY) };
  if (name === 'links') return { url: u.toString(), links: links(base, p.body) };
  if (name === 'images') return { url: u.toString(), images: links(base, p.body, 'img', 'src') };
  if (name === 'metadata') return { url: u.toString(), title: title(p.body), meta: meta(p.body) };
  if (name === 'tech') return { url: u.toString(), technologies: technologies(p.body, h) };
  if (name === 'robots' || name === 'sitemap') {
    const path = name === 'robots' ? '/robots.txt' : '/sitemap.xml';
    const target = new URL(path, u.origin); const q = await fetchPage(target);
    return { url: target.toString(), status: q.response.status, content: clean(q.body, 50000) };
  }
  if (name === 'size') return { url: u.toString(), bytes: p.bytes, kilobytes: Number((p.bytes / 1024).toFixed(2)) };
  if (name === 'performance') return { url: u.toString(), status: p.response.status, responseTimeMs: Date.now() - started, responseSizeBytes: p.bytes };
  if (name === 'seo') {
    const t = title(p.body); const m = meta(p.body); const d = m.find(x => x.name.toLowerCase() === 'description');
    const vp = m.find(x => x.name.toLowerCase() === 'viewport');
    const h1 = (p.body.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || []).map(text);
    return { url: u.toString(), seo: { title: t, titleLength: t?.length || 0, description: d?.content || null, descriptionLength: d?.content?.length || 0, viewport: vp?.content || null, h1Count: h1.length, h1 } };
  }
  if (name === 'report' || name === 'visit') {
    const t = title(p.body); const m = meta(p.body); const d = m.find(x => x.name.toLowerCase() === 'description');
    const result = { url: u.toString(), finalUrl: base, status: p.response.status, statusText: p.response.statusText, contentType: p.contentType, responseTimeMs: Date.now() - started, responseSizeBytes: p.bytes, title: t, description: d?.content || null };
    if (name === 'visit') result.textPreview = text(p.body).slice(0, 5000);
    else Object.assign(result, { technologies: technologies(p.body, h), linkCount: links(base, p.body).length, imageCount: links(base, p.body, 'img', 'src').length, securityHeaders: { 'strict-transport-security': h.get('strict-transport-security'), 'content-security-policy': h.get('content-security-policy'), 'x-content-type-options': h.get('x-content-type-options'), 'x-frame-options': h.get('x-frame-options'), 'referrer-policy': h.get('referrer-policy') } });
    return result;
  }
  throw new Error('Command implementation missing.');
}

export default async function handler(req, res) {
  if (!(await verifyAdmin(req))) return send(res, { ok: false, error: 'Admin69 authentication required.' }, 401);
  if (req.method === 'GET') return send(res, { ok: true, engine: 'KAI789', provider: null, providerRequired: false, capabilities: KAI_ULTIMAX_PERMISSIONS.enabledCapabilities, commands: help(KAI_ULTIMAX_PERMISSIONS.enabledCapabilities) });
  try {
    const requested = Array.isArray(req.body?.capabilities) ? req.body.capabilities : KAI_ULTIMAX_PERMISSIONS.enabledCapabilities;
    const capabilities = normalizeKaiCapabilities(requested);
    const input = req.body?.command || req.body?.message || req.body?.objective || '';
    const parsed = parse(input);
    const result = await run(parsed.name, parsed.arg, capabilities);
    return send(res, { ok: true, engine: 'KAI789', mode: 'ADMIN ULTIMAX', provider: null, providerRequired: false, command: '/' + parsed.name, capability: capabilityFor(parsed.name), capabilities, result, trace: [{ type: 'tool_start', tool: 'KAI789', args: { command: '/' + parsed.name, url: parsed.arg || null } }, { type: 'tool_result', tool: 'KAI789', ok: true, url: parsed.arg || null }] });
  } catch (e) {
    return send(res, { ok: false, engine: 'KAI789', provider: null, providerRequired: false, error: e?.message || 'KAI789 execution failed.' }, 400);
  }
}
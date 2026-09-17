import { storage } from 'hatchable';

export const access = "public";

export default async function (req, res) {
  try {
    const stored = await storage.get('legacy/app-shell-v259.html');
    if (!stored?.buffer) return res.status(502).send('HAxBRO app shell unavailable');
    let html = new TextDecoder().decode(stored.buffer);
    html = html.replace('/script.js?v=263', '/script.js?v=278');
    html = html.replace('/admin-ultimax.css?v=1', '/admin-ultimax.css?v=2');
    if (!html.includes('/app-maker-original.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/app-maker-original.css?v=1"></head>');
    if (!html.includes('/app-maker-original.js')) html = html.replace('</body>', '<script src="/app-maker-original.js?v=1"></script><script src="/kai2-app-maker.js?v=2"></script></body>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).send(html);
  } catch (e) {
    return res.status(502).send('HAxBRO app shell proxy error');
  }
}
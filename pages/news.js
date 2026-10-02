export const access = "public";

const ARTICLES = [
  {
    title: "KAI 51: The Intelligence Layer Behind HAxBRO AI",
    description: "An inside look at KAI 51, the intelligence architecture coordinating memory, context, reasoning, research, tools and verification.",
    href: "/news/kai-51-the-intelligence-layer-behind-haxbro-ai"
  },
  {
    title: "Inside KAI 51: How HAxBRO's Own Intelligence Architecture Works",
    description: "A technical tour of the KAI 51 core, its nodes, routing, memory, research, tools, verification and recovery layers.",
    href: "/news/inside-kai-51-how-haxbros-own-intelligence-architecture-works"
  },
  {
    title: "Standardizing Project Deliverables with HAxBRO AI File Creator",
    description: "How HAxBRO AI File Creator brings project deliverables into a consistent, usable workflow.",
    href: "/news/standardizing-project-deliverables-with-haxbro-ai-file-creator"
  },
  {
    title: "Running Defensive Web Security Checks in an AI Workspace",
    description: "A look at defensive web-security checks inside an AI workspace built around practical workflows.",
    href: "/news/running-defensive-web-security-checks-in-an-ai-workspace"
  },
  {
    title: "How to Build Web Applications and Games with KAI 2.0 App Maker",
    description: "Exploring the KAI 2.0 App Maker workflow for turning natural-language ideas into working projects.",
    href: "/news/how-to-build-web-applications-and-games-with-kai-20-app-maker"
  }
];

export default async function (req, res) {
  const cards = ARTICLES.map((a, i) => `
    <article class="card">
      <div class="num">0${i + 1}</div>
      <div><h2><a href="${a.href}">${a.title}</a></h2><p>${a.description}</p><a class="read" href="${a.href}">Read article <span>→</span></a></div>
    </article>
  `).join("");

  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>HAxBRO AI News — Published Articles</title>
<meta name="description" content="Published HAxBRO AI articles about KAI 51, App Maker, File Creator and defensive security.">
<link rel="canonical" href="https://haxbro.hatchable.site/news">
<style>
:root{--bg:#05080d;--panel:#0b1119;--line:rgba(0,217,255,.18);--text:#eef8fb;--muted:#8daab4;--cyan:#00d9ff}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 0%,rgba(0,217,255,.08),transparent 35%),var(--bg);color:var(--text);font:16px/1.6 Inter,system-ui,-apple-system,sans-serif}.wrap{max-width:940px;margin:auto;padding:34px 20px 70px}.top{display:flex;justify-content:space-between;gap:18px;align-items:center;border-bottom:1px solid var(--line);padding-bottom:18px}.brand{color:#fff;text-decoration:none;font-weight:800;letter-spacing:.08em}.back{color:var(--muted);text-decoration:none;font-size:13px}.kicker{margin-top:58px;color:var(--cyan);font-size:11px;font-weight:800;letter-spacing:.18em}.hero h1{font-size:clamp(38px,7vw,68px);line-height:.98;margin:12px 0}.hero p{max-width:650px;color:var(--muted);font-size:17px}.list{display:grid;gap:14px;margin-top:42px}.card{display:grid;grid-template-columns:64px 1fr;gap:18px;padding:24px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(145deg,rgba(0,217,255,.055),rgba(255,255,255,.018));transition:.2s}.card:hover{border-color:rgba(0,217,255,.45);transform:translateY(-2px)}.num{color:var(--cyan);font:800 12px/1 system-ui;letter-spacing:.12em}.card h2{margin:0;font-size:22px;line-height:1.2}.card h2 a{color:#fff;text-decoration:none}.card p{margin:9px 0;color:var(--muted)}.read{display:inline-block;margin-top:8px;color:var(--cyan);text-decoration:none;font-size:13px;font-weight:800}.read span{margin-left:5px}@media(max-width:600px){.top{align-items:flex-start}.card{grid-template-columns:1fr}.num{margin-bottom:-5px}}
</style></head><body><div class="wrap"><header class="top"><a class="brand" href="/">HAxBRO AI</a><a class="back" href="/">← Back to HAxBRO</a></header><main><div class="kicker">HAXBRO AI · NEWS</div><section class="hero"><h1>Published articles.</h1><p>Read the latest HAxBRO AI articles about KAI 51, the intelligence architecture behind the workspace, and the systems built around it.</p></section><section class="list">${cards}</section></main></div></body></html>`;
  res.status(200); res.setHeader("content-type","text/html; charset=utf-8"); res.setHeader("cache-control","public, max-age=60, s-maxage=60"); res.setHeader("x-haxbro-news-hub","published-articles"); res.send(body);
}
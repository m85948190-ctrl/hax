export const access = "public";

const ARTICLES = {
  "kai-51-the-intelligence-layer-behind-haxbro-ai": {
    title: "KAI 51: The Intelligence Layer Behind HAxBRO AI",
    description: "An inside look at KAI 51, the intelligence architecture coordinating memory, context, reasoning, research, tools and verification.",
    sections: [
      ["What KAI 51 is", "KAI 51 is the intelligence architecture at the center of HAxBRO AI. It is designed as a coordinated system rather than a single chat screen: identity, memory, context, planning, reasoning, tools, research, App Maker, Code Writer, security, verification and recovery work as connected capabilities."],
      ["Its own intelligence layer", "HAxBRO owns the KAI 51 orchestration and product logic. The system determines how a request should be understood, which capabilities should participate, what information should be retrieved, and how the result should be verified and presented."],
      ["Built for real work", "KAI 51 is designed for more than conversation. The architecture can route work into research, web inspection, coding, app building, defensive security analysis, decoding and file creation."],
      ["A precise view of the current system", "KAI 51 is the HAxBRO-owned intelligence architecture and orchestration layer. Language generation can use managed model compute underneath that architecture. This separation lets the KAI system evolve independently from a particular model provider."],
      ["Where it is going", "The direction is a deeper local-first KAI runtime, stronger independent retrieval and more self-contained intelligence, while keeping the orchestration and product behavior owned by HAxBRO."],
    ]
  },
  "inside-kai-51-how-haxbro-own-intelligence-architecture-works": {
    title: "Inside KAI 51: How HAxBRO's Own Intelligence Architecture Works",
    description: "A technical tour of the KAI 51 core, its nodes, routing, memory, research, tools, verification and recovery layers.",
    sections: [
      ["One core, many nodes", "KAI 51 is organized around specialized nodes for identity, memory, context, planner, reasoner, tools, App Maker, Code Writer, security, research, verifier and recovery."],
      ["Planning before execution", "The planner and context layers determine what a request needs, while tool and research layers can gather evidence or perform the appropriate operation."],
      ["Memory and continuity", "The KAI architecture includes local-first memory concepts so user context can remain separated per user and per device instead of becoming a shared global memory pool."],
      ["Research and web capabilities", "KAI 51 can connect its reasoning workflow to knowledge retrieval, Wikipedia, web search, page inspection and other tools. Retrieved information can be structured as context before a final response."],
      ["Verification and recovery", "Verifier and recovery layers help identify failed operations and move through an appropriate recovery path instead of pretending a failed operation succeeded."],
      ["The engineering principle", "The core design separates intelligence orchestration, tools, retrieval and model compute so each layer can be tested, replaced and extended independently."],
    ]
  }
};

const esc = value => String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));

function pageShell(title, body, description) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — HAxBRO AI</title><meta name="description" content="${esc(description)}">
<style>
:root{--bg:#05080d;--line:rgba(0,217,255,.18);--text:#eef8fb;--muted:#8daab4;--cyan:#00d9ff}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 0%,rgba(0,217,255,.1),transparent 35%),var(--bg);color:var(--text);font:16px/1.7 Inter,system-ui,sans-serif}.wrap{max-width:920px;margin:auto;padding:32px 20px 75px}.top{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:18px}.brand,.back,.read{color:var(--cyan);text-decoration:none}.brand{color:#fff;font-weight:900;letter-spacing:.1em}.back{color:var(--muted);font-size:13px}.kicker{margin-top:60px;color:var(--cyan);font-size:11px;font-weight:900;letter-spacing:.18em}.hero h1{font-size:clamp(40px,7vw,72px);line-height:1.02;margin:12px 0 18px;letter-spacing:-.04em}.dek{max-width:760px;color:var(--muted);font-size:19px}.article{margin-top:52px}.section{display:grid;grid-template-columns:58px 1fr;gap:20px;padding:28px 0;border-top:1px solid var(--line)}.idx{color:var(--cyan);font-size:11px;font-weight:900}.section h2{margin:0 0 8px;font-size:25px}.section p{margin:0;color:#b5c8ce}.card{padding:25px;border:1px solid var(--line);border-radius:20px;margin:14px 0;background:rgba(0,217,255,.035)}.card h2{margin:0 0 8px;font-size:23px}.card p{color:var(--muted);margin:0 0 12px}.footer{margin-top:45px;padding-top:20px;border-top:1px solid var(--line);color:#6f8993;font-size:12px}@media(max-width:600px){.section{grid-template-columns:1fr;gap:6px}}
</style></head><body><div class="wrap"><header class="top"><a class="brand" href="/">HAxBRO AI</a><a class="back" href="/news">← All articles</a></header>${body}</div></body></html>`;
}

export default async function(req,res) {
  const query = req.query || {};
  const articleKey = String(query.article || "");
  const article = ARTICLES[articleKey];

  if (article) {
    const sections = article.sections.map(([h,p],i) => `<section class="section"><div class="idx">0${i+1}</div><div><h2>${esc(h)}</h2><p>${esc(p)}</p></div></section>`).join("");
    const body = `<main><div class="kicker">HAXBRO AI · NEWS · KAI 51</div><header class="hero"><h1>${esc(article.title)}</h1><p class="dek">${esc(article.description)}</p></header><article class="article">${sections}</article><footer class="footer">Published by HAxBRO AI · Independent AI technology brand</footer></main>`;
    res.status(200); res.setHeader("content-type","text/html; charset=utf-8"); res.setHeader("cache-control","public, max-age=60, s-maxage=60"); res.send(pageShell(article.title,body,article.description)); return;
  }

  const cards = [
    ["KAI 51: The Intelligence Layer Behind HAxBRO AI","kai-51-the-intelligence-layer-behind-haxbro-ai","An inside look at KAI 51 and the intelligence architecture behind HAxBRO AI."],
    ["Inside KAI 51: How HAxBRO's Own Intelligence Architecture Works","inside-kai-51-how-haxbro-own-intelligence-architecture-works","A technical tour of KAI 51's nodes, routing, memory, research, tools, verification and recovery layers."]
  ].map((a,i)=>`<article class="card"><div class="idx">0${i+1}</div><h2>${esc(a[0])}</h2><p>${esc(a[2])}</p><a class="read" href="/news?article=${a[1]}">Read article →</a></article>`).join("");
  const body = `<main><div class="kicker">HAXBRO AI · NEWS</div><header class="hero"><h1>Published articles.</h1><p class="dek">The latest HAxBRO AI articles about KAI 51 and the intelligence architecture behind the workspace.</p></header><section class="article">${cards}</section></main>`;
  res.status(200); res.setHeader("content-type","text/html; charset=utf-8"); res.setHeader("cache-control","public, max-age=60, s-maxage=60"); res.send(pageShell("HAxBRO AI News",body,"Published HAxBRO AI articles about KAI 51."));
}
export const access = "public";

const ARTICLES = {
  "kai-51-the-intelligence-layer-behind-haxbro-ai": {
    title: "KAI 51: The Intelligence Layer Behind HAxBRO AI",
    description: "An inside look at KAI 51, the intelligence architecture that coordinates memory, context, reasoning, research, tools and verification inside HAxBRO AI.",
    date: "October 2, 2026",
    sections: [
      ["What KAI 51 is", "KAI 51 is the intelligence architecture at the center of HAxBRO AI. It is designed as a coordinated system rather than a single chat screen: identity, memory, context, planning, reasoning, tools, research, App Maker, Code Writer, security, verification and recovery work as connected capabilities."],
      ["Its own intelligence layer", "The important distinction is that HAxBRO owns the KAI 51 orchestration and product logic. The system decides how a request should be understood, which capabilities should participate, what information should be retrieved, and how the result should be verified and presented. This is the intelligence layer that gives HAxBRO its own behavior and workflow."],
      ["Built for real work", "KAI 51 is not limited to conversation. The same architecture can route work into research, web inspection, code generation, app building, defensive security analysis, decoding and file creation. That lets HAxBRO behave more like an AI workspace than a conventional chatbot."],
      ["A precise view of the current system", "KAI 51 should not be described as a completely independent foundation model trained from scratch. Its architecture and orchestration are HAxBRO-owned, while language generation can use managed model compute. This separation is deliberate: the intelligence architecture can evolve independently from the underlying model provider."],
      ["Where it is going", "The long-term direction is a deeper local-first KAI runtime, stronger independent retrieval and more self-contained intelligence. The goal is not simply to rename an external model. The goal is to keep expanding the HAxBRO-owned system that understands the task, coordinates capabilities and produces useful work."],
    ]
  },
  "inside-kai-51-how-haxbros-own-intelligence-architecture-works": {
    title: "Inside KAI 51: How HAxBRO's Own Intelligence Architecture Works",
    description: "A technical tour of the KAI 51 core: its nodes, routing, memory, research, tools, verification and recovery layers.",
    date: "October 2, 2026",
    sections: [
      ["One core, many nodes", "KAI 51 is organized around specialized nodes for identity, memory, context, planner, reasoner, tools, App Maker, Code Writer, security, research, verifier and recovery. These nodes give the system a structured way to move from a user's request to an actionable result."],
      ["Planning before execution", "Instead of treating every request as one undifferentiated text-generation call, KAI 51 can create a plan for the work. The planner and context layers determine what the request needs, while tool and research layers can gather evidence or perform the appropriate operation."],
      ["Memory and continuity", "The KAI architecture includes local-first memory concepts so user context can remain separated per user and per device. This supports continuity without turning one user's information into a shared global memory pool."],
      ["Research and web capabilities", "KAI 51 can connect its reasoning workflow to knowledge retrieval, Wikipedia, web search, page inspection and other tools. Retrieved information can be turned into structured context before the final response is produced."],
      ["Verification and recovery", "The verifier and recovery layers are important parts of the design. If a capability fails or a provider becomes unavailable, KAI can identify the failure and move through the appropriate recovery path instead of pretending that a failed operation succeeded."],
      ["The engineering principle", "The central idea behind KAI 51 is separation of concerns: the intelligence architecture decides what needs to happen; tools perform specific jobs; retrieval supplies evidence; and model compute can provide language generation. Keeping those layers separate makes the system easier to test, replace and extend."],
    ]
  },
  "standardizing-project-deliverables-with-haxbro-ai-file-creator": {
    title: "Standardizing Project Deliverables with HAxBRO AI File Creator",
    description: "How HAxBRO AI File Creator brings project deliverables into a consistent, usable workflow.",
    date: "September 2026",
    sections: [
      ["A workspace for deliverables", "HAxBRO AI includes file-creation workflows designed to turn structured work into usable project deliverables rather than leaving the result as plain chat text."],
      ["From request to artifact", "The workflow connects the user's request with the appropriate file-generation capability so documents and other outputs can be produced in a repeatable way."],
      ["Designed for the larger HAxBRO system", "File creation is one capability inside the broader HAxBRO intelligence workspace, alongside research, coding, app building and other tools."],
    ]
  },
  "running-defensive-web-security-checks-in-an-ai-workspace": {
    title: "Running Defensive Web Security Checks in an AI Workspace",
    description: "A look at defensive web-security checks inside an AI workspace built around practical workflows.",
    date: "September 2026",
    sections: [
      ["Defensive inspection", "HAxBRO includes passive web inspection capabilities for understanding public web pages and identifying common configuration, SEO, performance and security-header issues."],
      ["Evidence before conclusions", "The inspection workflow can collect page metadata, links, headers and other public signals before producing a structured report."],
      ["Part of KAI's tool layer", "Security inspection is treated as a specialized capability inside the larger KAI architecture rather than as the whole product."],
    ]
  },
  "how-to-build-web-applications-and-games-with-kai-20-app-maker": {
    title: "How to Build Web Applications and Games with KAI 2.0 App Maker",
    description: "Exploring the KAI 2.0 App Maker workflow for turning natural-language ideas into working projects.",
    date: "September 2026",
    sections: [
      ["From idea to build", "KAI 2.0 App Maker is designed to turn natural-language project requirements into working web applications and game projects."],
      ["Build, test and iterate", "The App Maker workflow is intended to support generation followed by testing and further modification instead of treating the first generated artifact as final."],
      ["Inside HAxBRO", "App Maker is one creation capability inside the larger HAxBRO AI workspace and uses the broader KAI architecture for planning and execution."],
    ]
  }
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}

export default async function (req, res) {
  const raw = req.params?.slug;
  const slug = Array.isArray(raw) ? raw.join("/") : String(raw || "");
  const article = ARTICLES[slug];

  if (!article) {
    res.status(404);
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.send("<!doctype html><html><body style=\"font-family:system-ui;padding:40px\"><h1>Article not found</h1><p><a href=\"/news\">Back to HAxBRO AI News</a></p></body></html>");
    return;
  }

  const sections = article.sections.map(([heading, body], i) => `
    <section class="section">
      <div class="section-index">0${i + 1}</div>
      <div><h2>${esc(heading)}</h2><p>${esc(body)}</p></div>
    </section>`).join("");

  const canonical = "https://haxbro.hatchable.site/news/" + slug;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(article.title)} — HAxBRO AI</title>
<meta name="description" content="${esc(article.description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(article.title)}">
<meta property="og:description" content="${esc(article.description)}">
<meta property="og:url" content="${canonical}">
<style>
:root{--bg:#05080d;--panel:#0b1119;--line:rgba(0,217,255,.17);--text:#eef8fb;--muted:#8daab4;--cyan:#00d9ff}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 78% 0%,rgba(0,217,255,.1),transparent 34%),var(--bg);color:var(--text);font:16px/1.75 Inter,system-ui,-apple-system,sans-serif}.wrap{max-width:900px;margin:auto;padding:30px 20px 80px}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:18px}.brand{color:#fff;text-decoration:none;font-weight:900;letter-spacing:.1em}.back{color:var(--muted);text-decoration:none;font-size:13px}.kicker{margin-top:68px;color:var(--cyan);font-size:11px;font-weight:900;letter-spacing:.2em}.hero h1{font-size:clamp(40px,7vw,72px);line-height:1.02;margin:12px 0 20px;letter-spacing:-.035em}.hero .dek{max-width:760px;color:var(--muted);font-size:19px;line-height:1.65}.meta{margin-top:18px;color:#6f8993;font-size:12px}.article{margin-top:55px}.section{display:grid;grid-template-columns:58px 1fr;gap:22px;padding:28px 0;border-top:1px solid var(--line)}.section-index{color:var(--cyan);font-size:11px;font-weight:900;letter-spacing:.12em}.section h2{margin:0 0 9px;font-size:25px;line-height:1.2}.section p{margin:0;color:#b5c8ce}.footer{margin-top:55px;padding-top:24px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:15px;color:#6f8993;font-size:12px}.footer a{color:var(--cyan);text-decoration:none}@media(max-width:600px){.top{align-items:flex-start}.section{grid-template-columns:1fr;gap:6px}.hero h1{font-size:42px}.footer{flex-direction:column}}
</style>
</head>
<body>
<div class="wrap">
<header class="top"><a class="brand" href="/">HAxBRO AI</a><a class="back" href="/news">← All articles</a></header>
<main>
<div class="kicker">HAXBRO AI · NEWS · KAI 51</div>
<header class="hero"><h1>${esc(article.title)}</h1><p class="dek">${esc(article.description)}</p><div class="meta">Published ${esc(article.date)} · HAxBRO AI</div></header>
<article class="article">${sections}</article>
</main>
<footer class="footer"><span>HAxBRO AI · Independent AI technology brand</span><a href="/app/">Open HAxBRO App →</a></footer>
</div>
</body>
</html>`;

  res.status(200);
  res.setHeader("content-type","text/html; charset=utf-8");
  res.setHeader("cache-control","public, max-age=300, s-maxage=300");
  res.setHeader("x-haxbro-article","published");
  res.send(html);
}
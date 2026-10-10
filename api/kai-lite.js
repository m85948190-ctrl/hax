import { browser } from "hatchable";

export const access = "public";
export const methods = ["POST"];

const clean = (v, n = 5000) =>
  String(v ?? "").replace(/\u0000/g, "").replace(/\s+/g, " ").trim().slice(0, n);

const casual = /^(?:hi(?:\s+bro)?|hi hello|hello(?:\s+bro)?|hello bro hi|hello hi|hey(?:\s+bro)?|yo(?:\s+bro)?|what\??|what's up\??|whats up\??|sup\??|good morning|good evening|good night|thanks|thank you|thx|fuck|damn|ok|okay|cool|nice|great)[.!\s]*$/i;

function strip(html) {
  return clean(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " "),
    9000
  );
}

function decode(v) {
  return String(v || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function unique(list, limit = 8) {
  const out = [];
  const seen = new Set();
  for (const item of list || []) {
    const url = String(item?.url || "").trim();
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    out.push({ title: clean(item.title, 300), url, text: clean(item.text, 9000) });
    if (out.length >= limit) break;
  }
  return out;
}

async function googleSearch(query) {
  const url = "https://www.google.com/search?gbv=1&hl=en&q=" + encodeURIComponent(query);
  const html = String(await browser.html(url));
  if (/unusual traffic|captcha|enable javascript on your web browser/i.test(html)) return [];
  const results = [];
  const re = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && results.length < 8) {
    const href = decode(m[1]);
    const title = clean(m[2].replace(/<[^>]+>/g, " "), 300);
    if (!title) continue;
    try {
      const host = new URL(href).hostname;
      if (host.includes("google.")) continue;
    } catch { continue; }
    results.push({ title, url: href, text: "" });
  }
  return unique(results, 8);
}

async function bingSearch(query) {
  const url = "https://www.bing.com/search?format=rss&q=" + encodeURIComponent(query);
  const html = String(await browser.html(url));
  const items = html.split("<item>").slice(1).map(block => {
    const readTag = name => {
      const a = block.indexOf("<" + name + ">");
      if (a < 0) return "";
      const b = block.indexOf("</" + name + ">", a);
      if (b < 0) return "";
      return decode(block.slice(a + name.length + 2, b).trim());
    };
    return { title: readTag("title"), url: readTag("link"), text: readTag("description") };
  });
  return unique(items, 8);
}

function normalizeSearchQuery(message) {
  let q = clean(message, 700).replace(/[?!.]+$/g, "").trim();
  const fact = q.match(/\b(?:one|an?|some|interesting|fun|cool|random|amazing|surprising)?\s*(?:interesting\s+)?facts?\s+about\s+(.+)$/i);
  if (fact?.[1]) return clean(fact[1], 300) + " facts";
  // Strip conversational framing before search. Keeping phrases such as
  // "in one sentence, what is" in a search query can return unrelated pages.
  q = q.replace(/^\s*(?:please\s+)?(?:in\s+(?:one|a|two)\s+sentences?[, ]*|briefly[, ]*|simply[, ]*)?/i, "");
  q = q.replace(/^\s*(?:please\s+)?(?:can you|could you|would you)\s+/i, "");
  q = q.replace(/^\s*(?:tell me|give me|share with me|find me|search for|look up|can you tell me|could you tell me)\s+/i, "");
  q = q.replace(/^\s*(?:what is|what are|who is|who are|define|explain|describe|meaning of|tell me about|how does|how do|why does|why is)\s+/i, "");
  q = q.replace(/^\s*(?:one|an?|some|interesting|fun|cool|random|amazing|surprising)\s+/i, "").trim();
  return q || clean(message, 300);
}

async function searchWeb(query) {
  let engine = "Google Web";
  let results = [];
  try { results = await googleSearch(query); } catch {}
  if (!results.length) {
    engine = "Bing Web";
    results = await bingSearch(query);
  }
  if (!results.length) throw new Error("No public web results were returned.");
  return { engine, results };
}

async function enrich(results) {
  // Fetch source pages concurrently. The previous sequential loop could wait
  // 2.5 seconds per source and make a single KAI Lite answer take 10–13 seconds.
  return Promise.all(results.slice(0, 4).map(async item => {
    let text = item.text || "";
    if (!text || text.length < 180) {
      try {
        const html = await Promise.race([
          browser.html(item.url),
          new Promise((_, reject) => setTimeout(() => reject(new Error("source timeout")), 1800))
        ]);
        text = strip(html);
      } catch {}
    }
    return { ...item, text };
  }));
}

function relevantExcerpt(query, text) {
  const body = clean(text, 9000);
  if (!body) return "";
  const words = new Set(clean(query, 500).toLowerCase().split(/\W+/).filter(x => x.length > 2));
  const sentences = body.split(/(?<=[.!?])\s+/).filter(s => s.length > 35);
  const scored = sentences.map(sentence => ({
    sentence,
    score: [...sentence.toLowerCase().matchAll(/[a-z0-9]+/g)].reduce((n, m) => n + (words.has(m[0]) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  const relevant = scored.filter(x => x.score >= 1).slice(0, 2);
  return relevant.map(x => x.sentence).join(" ").slice(0, 900);
}

function groundedAnswer(query, sources, engine) {
  const usable = sources
    .map(s => ({ ...s, excerpt: relevantExcerpt(query, s.text || s.title) }))
    .filter(s => s.excerpt);

  if (!usable.length) {
    return "I searched the public web, but the returned pages did not contain enough readable text to answer that reliably. Try a more specific question.";
  }

  const lead = usable[0];
  const answer = "Here’s what I found on the live web: " + lead.excerpt;
  const sourceLines = usable.slice(0, 3).map((s, i) =>
    (i + 1) + ". " + s.title + "\n   " + s.url
  ).join("\n");

  return answer + "\n\nSources (" + engine + "):\n" + sourceLines;
}

function liteNotice(text) {
  return String(text || "");
}

function casualAnswer(query) {
  const q = clean(query, 120).toLowerCase();
  if (/^(?:thanks|thank you|thx)/i.test(q)) return "Anytime, bro. 👊";
  if (/^(?:what\??|what's up\??|whats up\??|sup\??)/i.test(q)) return "I’m here, bro. Tell me what you want to work on.";
  if (/fuck|damn/i.test(q)) return "😂 I’m here, bro. What happened?";
  if (/good morning/i.test(q)) return "Good morning, bro. What are we building today?";
  if (/good evening/i.test(q)) return "Good evening, bro. What are we working on?";
  if (/good night/i.test(q)) return "Good night, bro. 👊";
  return "Hey bro 👋 Kai Lite is online. Give me a task, question, or something you want me to search on the web.";
}

export default async function(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const query = clean(req.body?.message, 1800);
  if (!query) return res.status(400).json({ error: "message required" });

  try {
    // Kai Lite is a web-grounded lane, but casual conversation should remain
    // conversation instead of turning "hi" into a search-engine query.
    if (casual.test(query)) {
      return res.json({
        ok: true,
        response: liteNotice(casualAnswer(query)),
        provider: "KAI LITE",
        model: "KAI LITE · CONVERSATION",
        lite: true,
        sources: []
      });
    }

    const searchQuery = normalizeSearchQuery(query);
    const searched = await searchWeb(searchQuery);
    const sources = await enrich(searched.results);

    return res.json({
      ok: true,
      response: liteNotice(groundedAnswer(searchQuery, sources, searched.engine)),
      provider: "KAI LITE · WEB",
      model: "KAI LITE · GOOGLE/BING SCRAPER",
      lite: true,
      engine: searched.engine,
      sources: sources.slice(0, 5).map(({ title, url }) => ({ title, url }))
    });
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: "Kai Lite web retrieval unavailable",
      detail: clean(e?.message, 300)
    });
  }
}
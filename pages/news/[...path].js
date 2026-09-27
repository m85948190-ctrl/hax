export const access = "public";

const WIRE_ORIGIN = "https://www.stork.ai/wire/w4mf2ze0nwe7f5is1";

export default async function (req, res) {
  try {
    const parts = Array.isArray(req.params?.path) ? req.params.path : [];
    const suffix = parts.map(encodeURIComponent).join("/");
    const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const target = WIRE_ORIGIN + (suffix ? "/" + suffix : "") + query;

    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        "user-agent": req.headers?.["user-agent"] || "HAxBRO-Stork-Wire-Proxy",
        "accept": req.headers?.accept || "*/*"
      }
    });

    let body = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "text/html; charset=utf-8";

    // Keep the Stork Wire article pages visually independent from Hatchable's
    // platform badge. Hatchable injects #hb-badge at the platform edge, so
    // suppress it in the proxied document and remove it if it is later added.
    if (contentType.toLowerCase().includes("text/html")) {
      const badgeGuard = `<style id="haxbro-badge-guard">#hb-badge{display:none!important}</style><script>(function(){function removeBadge(){var b=document.getElementById('hb-badge');if(b)b.remove()}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',removeBadge)}else{removeBadge()}new MutationObserver(removeBadge).observe(document.documentElement,{childList:true,subtree:true})})();</script>`;
      body = body.includes("</head>") ? body.replace("</head>", badgeGuard + "</head>") : badgeGuard + body;
    }

    res.status(upstream.status || 200);
    res.setHeader("content-type", contentType);
    res.setHeader("cache-control", "public, max-age=300, s-maxage=300");
    res.setHeader("x-haxbro-news-proxy", "stork-wire");
    res.send(body);
  } catch (error) {
    res.status(502);
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.send("stork-wire: upstream unavailable");
  }
}
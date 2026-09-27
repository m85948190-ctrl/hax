export const access = "public";

const WIRE_ORIGIN = "https://www.stork.ai/wire/w4mf2ze0nwe7f5is1";

export default async function (req, res) {
  try {
    const upstream = await fetch(WIRE_ORIGIN, {
      method: "GET",
      headers: {
        "user-agent": req.headers?.["user-agent"] || "HAxBRO-Stork-Wire-Proxy",
        "accept": req.headers?.accept || "text/html,application/xhtml+xml"
      }
    });

    const body = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "text/html; charset=utf-8";

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
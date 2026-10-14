import { createServer as nodeCreateServer } from "node:http";
import { health } from "./src/health.js";
import { describeModelProfiles } from "./src/model-registry.js";
import { handleHuggingFaceImageRequest } from "./src/hf-image.js";

const MAX_BODY_BYTES = 16 * 1024;
const ALLOWED_ORIGIN_DEFAULT = "https://haxbro.hatchable.site";

function send(res, result) {
  res.writeHead(result.statusCode, result.headers || {});
  res.end(JSON.stringify(result.body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;
    req.setEncoding("utf8");
    req.on("data", chunk => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("Request body too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch { reject(Object.assign(new Error("Request body must be valid JSON"), { statusCode: 400 })); }
    });
    req.on("error", reject);
  });
}

export function createHaxbroServer({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return nodeCreateServer(async (req, res) => {
    const origin = env.HAXBRO_ORIGIN || ALLOWED_ORIGIN_DEFAULT;
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "Origin");
    res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type, authorization");
    res.setHeader("cache-control", "no-store");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname === "/api/health" && req.method === "GET") {
      return send(res, health());
    }
    if (url.pathname === "/api/models" && req.method === "GET") {
      return send(res, {
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
        body: { ok: true, models: describeModelProfiles() }
      });
    }
    if (url.pathname === "/api/images/generate" && req.method === "POST") {
      try {
        const input = await readJson(req);
        return send(res, await handleHuggingFaceImageRequest({ method: req.method, body: input }, { env, fetchImpl }));
      } catch (error) {
        return send(res, {
          statusCode: error.statusCode || 400,
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
          body: { ok: false, error: error.statusCode === 413 ? "Request body too large." : String(error.message || "Invalid request").slice(0, 300) }
        });
      }
    }

    return send(res, {
      statusCode: 404,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      body: { ok: false, error: "Route not found." }
    });
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const server = createHaxbroServer();
  const port = Number(process.env.PORT || 8787);
  server.listen(port, "0.0.0.0", () => {
    console.log(`HAxBRO backend listening on :${port}`);
  });
}

import { db, ai } from "hatchable";

export const access = "public";
export const methods = ["POST"];

const MODES = new Set(["auto","xray","reverse","forensics","puzzle","threat","webmap"]);

function cleanText(v, max=24000) {
  return String(v ?? "").replace(/\u0000/g, "").slice(0, max);
}
function validPublicUrl(value) {
  try {
    const u = new URL(String(value || "").trim());
    if (!/^https?:$/i.test(u.protocol)) return "";
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".localhost") || h === "0.0.0.0" || h === "::1") return "";
    if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || h.endsWith(".internal") || h.endsWith(".local")) return "";
    const m = h.match(/^172\.(\d{1,3})\./);
    if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return "";
    if (h.startsWith("169.254.")) return "";
    return u.toString();
  } catch { return ""; }
}
function words(s) {
  return cleanText(s, 50000).toLowerCase().match(/[a-z0-9_$.-]{2,}/g) || [];
}
function unique(arr) { return [...new Set(arr.filter(Boolean))]; }
function severityScore(text) {
  const s = text.toLowerCase();
  let score = 0;
  if (/password|secret|api[_ -]?key|token|private[_ -]?key/.test(s)) score += 25;
  if (/eval\s*\(|new Function|innerHTML|document\.write/.test(s)) score += 18;
  if (/sql|select .* from|insert .* into|query\(/.test(s)) score += 12;
  if (/http:\/\//.test(s)) score += 8;
  if (/debug|stack trace|exception/.test(s)) score += 5;
  return Math.min(100, score);
}
function analyzeCode(text) {
  const s = cleanText(text);
  const findings = [];
  if (/eval\s*\(|new Function\s*\(/i.test(s)) findings.push({severity:"high",title:"Dynamic code execution pattern",detail:"eval/new Function can execute constructed code and deserves manual review."});
  if (/innerHTML\s*=|document\.write\s*\(/i.test(s)) findings.push({severity:"medium",title:"HTML injection surface",detail:"Direct HTML sinks can become XSS risks when fed untrusted input."});
  if (/(api[_ -]?key|secret|password|private[_ -]?key)\s*[:=]/i.test(s)) findings.push({severity:"high",title:"Possible embedded secret",detail:"A credential-like assignment appears in the supplied material. Treat exposed credentials as compromised."});
  if (/https?:\/\//i.test(s)) findings.push({severity:"info",title:"External network reference",detail:"The material contains external URL references."});
  const imports = unique([...s.matchAll(/(?:import\s+.*?from\s+|require\s*\(\s*)['"]([^'"]+)/g)].map(m=>m[1])).slice(0,30);
  return {findings,imports,lines:s.split(/\r?\n/).length,score:severityScore(s)};
}
function xray(text) {
  const s = cleanText(text);
  const lines = s.split(/\r?\n/);
  const urls = unique([...s.matchAll(/https?:\/\/[^\s"'<>]+/gi)].map(m=>m[0])).slice(0,20);
  const keys = unique([...s.matchAll(/(?:^|[,{\s])([A-Za-z_$][\w$.-]{1,40})\s*:/g)].map(m=>m[1])).slice(0,40);
  return {
    layers:[
      {name:"STRUCTURE",detail:`${lines.length} lines · ${s.length} characters`},
      {name:"TOKENS",detail:`${words(s).length} lexical tokens · ${unique(words(s)).length} unique`},
      {name:"LINKS",detail:`${urls.length} URL references detected`},
      {name:"FIELDS",detail:`${keys.length} key-like fields detected`},
      {name:"RISK",detail:`heuristic exposure score ${severityScore(s)}/100`}
    ],
    urls, keys, preview:s.slice(0,1000)
  };
}
function puzzle(text) {
  const s = cleanText(text);
  const tests = [];
  try { const b=Buffer.from(s,"base64").toString("utf8"); if (b && /[a-z]{3}/i.test(b)) tests.push({method:"BASE64",result:b.slice(0,200),confidence:"candidate"}); } catch {}
  const hex=s.replace(/\s+/g,""); if (/^(?:[0-9a-f]{2})+$/i.test(hex)) { try { tests.push({method:"HEX",result:Buffer.from(hex,"hex").toString("utf8").slice(0,200),confidence:"candidate"}); } catch {} }
  const rot13=s.replace(/[a-z]/gi,c=>String.fromCharCode((c.toLowerCase().charCodeAt(0)-97+13)%26+97));
  if (/[a-z]/i.test(s) && /\b(the|this|that|is|you|secret|code|hello|bro)\b/i.test(rot13)) tests.push({method:"ROT13",result:rot13,confidence:"strong"});
  return {tests,signal:tests.length?"candidate transformations found":"no high-signal transformation found",note:"Puzzle Engine uses bounded transformations here; it does not claim to crack modern cryptography."};
}
function threat(text) {
  const s=cleanText(text);
  const surface=[];
  if (/login|auth|password|session|token/i.test(s)) surface.push("AUTHENTICATION");
  if (/api|endpoint|webhook|server/i.test(s)) surface.push("API / SERVER");
  if (/upload|file|attachment/i.test(s)) surface.push("FILE INPUT");
  if (/admin|role|permission|access/i.test(s)) surface.push("AUTHORIZATION");
  if (/database|sql|postgres|mongo/i.test(s)) surface.push("DATA STORE");
  const paths=[];
  for (const x of surface.slice(0,5)) paths.push({stage:"SURFACE",component:x,defense:"Validate, authenticate, authorize, rate-limit, and log."});
  return {scope:"AUTHORIZED DEFENSIVE SIMULATION",attackPath:paths,priority:surface.length?surface.slice(0,5):["INPUT SURFACE"],note:"This simulator models defensive risk paths; it does not execute attacks or provide intrusion instructions."};
}
async function fetchPublic(url) {
  const r=await fetch(url,{method:"GET",redirect:"follow"});
  const text=await r.text();
  return {status:r.status,statusText:r.statusText,finalUrl:r.url||url,headers:Object.fromEntries([...r.headers.entries()]),body:text.slice(0,50000)};
}
function webMap(url, page) {
  const body=page.body;
  const links=unique([...body.matchAll(/href\s*=\s*["']([^"']+)/gi)].map(m=>m[1]).filter(x=>/^https?:\/\//i.test(x))).slice(0,40);
  const scripts=unique([...body.matchAll(/<script[^>]+src\s*=\s*["']([^"']+)/gi)].map(m=>m[1])).slice(0,30);
  const tech=[];
  if (/next[./-]|__next/i.test(body)) tech.push("Next.js");
  if (/react/i.test(body)) tech.push("React");
  if (/wordpress|wp-content/i.test(body)) tech.push("WordPress");
  if (/cloudflare/i.test(JSON.stringify(page.headers)+body)) tech.push("Cloudflare");
  return {target:page.finalUrl,status:page.status,technologies:unique(tech),publicLinks:links,scripts,headers:{server:page.headers.server||null,contentType:page.headers["content-type"]||null},xray:xray(body)};
}
async function aiSummary(mode, target) {
  try {
    const r=await ai.generateText({model:"sonnet",maxSteps:1,maxTokens:700,purpose:"deepx_analysis",system:"You are DEEPX, a defensive analysis engine. Summarize supplied material factually. Do not invent facts. For threat analysis, stay authorized and defensive.",prompt:`Mode: ${mode}\nMaterial:\n${cleanText(JSON.stringify(target),12000)}\nReturn a compact executive summary with Findings, Evidence, Next checks.`});
    return String(r?.text || r?.output || "").slice(0,5000);
  } catch { return ""; }
}

export default async function(req,res) {
  const body=req.body||{};
  const mode=MODES.has(body.mode)?body.mode:"auto";
  const textInput=cleanText(body.input);
  const url=validPublicUrl(body.url);
  const targetType=url?"public_url":(body.filename?"file_or_code":"text");
  if (!textInput && !url) return res.status(400).json({ok:false,error:"Provide input text/code or a public URL."});
  let result;
  try {
    if ((mode==="webmap" || (mode==="auto" && url)) && url) {
      const page=await fetchPublic(url);
      result=webMap(url,page);
    } else if (mode==="puzzle") result=puzzle(textInput);
    else if (mode==="threat") result=threat(textInput);
    else if (mode==="forensics") {
      const code=analyzeCode(textInput);
      result={metadata:{filename:cleanText(body.filename,160)||"unspecified",characters:textInput.length,lines:textInput.split(/\r?\n/).length},findings:code.findings,indicators:xray(textInput),score:code.score};
    } else if (mode==="reverse") {
      result={architecture:xray(textInput),codeSignals:analyzeCode(textInput),reconstruction:["INPUT","COMPONENTS","LOGIC","DEPENDENCIES","DATA FLOW","OUTPUT"]};
    } else result=xray(textInput);
    const summary=await aiSummary(mode,result);
    if(summary) result.aiSummary=summary;
    try { await db.query("INSERT INTO deepx_runs (mode,target_type,target_label,request,result) VALUES ($1,$2,$3,$4,$5)",[mode,targetType,cleanText(body.filename||url||"DEEPX TARGET",160),JSON.stringify({mode,input:textInput.slice(0,4000),url:url||null}),JSON.stringify(result)]); } catch {}
    res.json({ok:true,engine:"DEEPX",version:"1.0",mode,targetType,result,completedAt:new Date().toISOString()});
  } catch(e) {
    res.status(502).json({ok:false,error:"DEEPX could not analyze the supplied target.",detail:String(e?.message||e).slice(0,300)});
  }
}
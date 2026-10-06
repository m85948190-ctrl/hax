import { db } from 'hatchable';

const DEFAULT_RULES=[
  {id:'identity',capability:'general',rule:'KAI 51 is HAxBRO AI intelligence. Never impersonate another provider.'},
  // Creator/CEO questions are intentionally not encoded as a canned answer; the selected model must answer them.
  {id:'no-provider-substitution',capability:'general',rule:'Never silently substitute Gemini, OpenAI, Claude, Groq, Cerebras or another provider for KAI 51.'},
  {id:'truth',capability:'general',rule:'Never claim a model was trained by HAxBRO unless a real training run and artifact are recorded.'},
  {id:'local-first',capability:'general',rule:'Prefer the local KAI 51 neural runtime when it is available; deterministic rules are capability helpers, not a fake neural model.'},
  {id:'app-preserve',capability:'app-maker',rule:'When modifying an existing app, preserve its name, purpose, working features and state unless explicitly asked to change them.'},
  {id:'app-real',capability:'app-maker',rule:'Every visible App Maker control must perform a real action. Do not ship decorative buttons.'},
  {id:'app-test',capability:'app-maker',rule:'Validate the generated app after build and again after each modification.'},
  {id:'app-export',capability:'app-maker',rule:'Every generated app must be exportable as a self-contained HTML artifact and as a structured file bundle when multiple files exist.'},
  {id:'app-download',capability:'app-maker',rule:'Download/export must work without requiring an external AI provider.'},
  {id:'app-publish',capability:'app-maker',rule:'Publishing must report the actual hosting result. Never show a fake public URL.'},
  {id:'calculator',capability:'app-maker',rule:'Calculator requests require real arithmetic logic, keyboard support, validation and persistent history where appropriate.'},
  {id:'chat-app',capability:'app-maker',rule:'Chat apps require composer, send action, visible user and assistant messages, loading state and a guaranteed local response path.'},
  {id:'responsive',capability:'app-maker',rule:'Generated apps must work on desktop and mobile without clipping, overlap or controls covering each other.'},
  {id:'export-contract',capability:'export',rule:'Export metadata must contain app name, version, files, checksum and generated timestamp.'},
  {id:'sync',capability:'sync',rule:'Hatchable is the canonical behavior/rules store. Clients should fetch the active training pack by version and checksum on startup.'}
];

async function checksum(value){
  const bytes=new TextEncoder().encode(JSON.stringify(value));
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

export async function ensureTrainingPack(){
  const {rows}=await db.query("SELECT slug, version, status, rules, checksum FROM kai_training_packs WHERE slug=$1 LIMIT 1",['kai51-hatchable-core']);
  if(rows.length)return rows[0];
  const sum=await checksum(DEFAULT_RULES);
  const r=await db.query("INSERT INTO kai_training_packs (slug,version,status,rules,checksum) VALUES ($1,1,'active',$2::jsonb,$3) RETURNING slug,version,status,rules,checksum",['kai51-hatchable-core',JSON.stringify(DEFAULT_RULES),sum]);
  await db.query("INSERT INTO kai_training_sync_state (id,pack_slug,pack_version,checksum,model_identity,source) VALUES (1,$1,1,$2,$3,'HATCHABLE') ON CONFLICT (id) DO UPDATE SET pack_slug=excluded.pack_slug,pack_version=excluded.pack_version,checksum=excluded.checksum,last_synced_at=now()",['kai51-hatchable-core',sum,'KAI 51 / SmolLM2-360M-Instruct']);
  return r.rows[0];
}

export async function getTrainingPack(){
  const pack=await ensureTrainingPack();
  const examples=(await db.query("SELECT prompt,response_contract,capability,tags,weight FROM kai_training_examples WHERE pack_slug=$1 AND enabled=true ORDER BY weight DESC,created_at DESC LIMIT 100",[pack.slug])).rows;
  return {...pack,examples};
}

export function trainingPrompt(pack,capability='general'){
  return (pack?.rules||DEFAULT_RULES).filter(r=>r.capability==='general'||r.capability===capability).map(r=>'- '+r.rule).join('\n');
}

export async function recordTrainingExample({prompt,response_contract,capability='general',tags=[],weight=1}){
  if(!String(prompt||'').trim()||!String(response_contract||'').trim())throw new Error('prompt and response_contract are required');
  const example=(await db.query("INSERT INTO kai_training_examples (pack_slug,prompt,response_contract,capability,tags,weight) VALUES ('kai51-hatchable-core',$1,$2,$3,$4::jsonb,$5) RETURNING id,prompt,response_contract,capability,tags,weight",[String(prompt).slice(0,8000),String(response_contract).slice(0,12000),String(capability).slice(0,80),JSON.stringify(Array.isArray(tags)?tags.slice(0,20):[]),Number(weight)||1])).rows[0];
  const examples=(await db.query("SELECT prompt,response_contract,capability,tags,weight FROM kai_training_examples WHERE pack_slug='kai51-hatchable-core' AND enabled=true ORDER BY created_at DESC LIMIT 100")).rows;
  const pack=(await db.query("SELECT rules,version FROM kai_training_packs WHERE slug='kai51-hatchable-core' LIMIT 1")).rows[0];
  const sum=await checksum({rules:pack.rules,examples});
  const nextVersion=Number(pack.version||1)+1;
  await db.query("UPDATE kai_training_packs SET version=$1,checksum=$2,updated_at=now() WHERE slug='kai51-hatchable-core'",[nextVersion,sum]);
  await db.query("UPDATE kai_training_sync_state SET pack_version=$1,checksum=$2,last_synced_at=now() WHERE id=1",[nextVersion,sum]);
  return example;
}
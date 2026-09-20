import { db } from "hatchable";
export const access = "public";
export const methods = ["POST"];
const key=v=>String(v||"").trim().toLowerCase();
const bytes=v=>new TextEncoder().encode(String(v));
async function hash(v){const b=await crypto.subtle.digest("SHA-256",bytes(v));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,"0")).join("")}
function token(){const b=new Uint8Array(32);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("")}
export default async function(req,res){
  const username=String(req.body?.username||"").trim().replace(/[^a-zA-Z0-9._-]/g,"").slice(0,32);
  if(username.length<2)return res.status(400).json({error:"Username must be at least 2 characters."});
  const username_key=key(username), supplied=String(req.body?.token||"");
  if(supplied){
    const r=await db.query("SELECT id,username FROM haxbro_users WHERE username_key=$1 AND chat_token_hash=$2 LIMIT 1",[username_key,await hash(supplied)]);
    if(r.rows[0]){await db.query("UPDATE haxbro_users SET last_seen_at=NOW() WHERE id=$1",[r.rows[0].id]);return res.json({ok:true,userId:r.rows[0].id,username:r.rows[0].username,token:supplied})}
  }
  const existing=await db.query("SELECT id FROM haxbro_users WHERE username_key=$1 LIMIT 1",[username_key]);
  if(existing.rows[0])return res.status(409).json({error:"That HAxBRO username is already taken.",code:"USERNAME_TAKEN"});
  const t=token(),ins=await db.query("INSERT INTO haxbro_users(username,username_key,chat_token_hash) VALUES($1,$2,$3) RETURNING id,username",[username,username_key,await hash(t)]);
  res.json({ok:true,userId:ins.rows[0].id,username:ins.rows[0].username,token:t});
}
import { db } from "hatchable";
export const access = "public";
export const methods = ["POST"];
export default async function(req,res){
  const code=String(req.body?.code||"").trim().toUpperCase();
  const username=String(req.body?.username||"").trim().slice(0,64);
  if(!code) return res.status(400).json({ok:false,error:"Enter a code."});
  if(!username) return res.status(400).json({ok:false,error:"Enter your HAxBRO username first."});
  const found=await db.query("SELECT code,reward FROM haxbro_pro_codes WHERE code=$1 LIMIT 1",[code]);
  const row=found.rows?.[0];
  if(!row) return res.status(404).json({ok:false,error:"That code is not valid."});
  return res.json({ok:true,tier:String(row.reward).toUpperCase().includes("PREMIUM")?"premium":"pro",username,message:"Access code accepted. This is a universal campaign code and can be used by eligible HAxBRO users."});
}
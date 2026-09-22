import { db } from "hatchable";

export const access = "public";
export const methods = ["POST"];

export default async function(req,res){
  const code=String(req.body?.code||"").trim().toUpperCase();
  const username=String(req.body?.username||"").trim().slice(0,64);
  if(!code) return res.status(400).json({ok:false,error:"Enter a Pro code."});
  if(!username) return res.status(400).json({ok:false,error:"Enter your HAxBRO username first."});
  const found=await db.query("SELECT id, code, redeemed_by, redeemed_at FROM haxbro_pro_codes WHERE code = $1 LIMIT 1",[code]);
  const row=found.rows?.[0];
  if(!row) return res.status(404).json({ok:false,error:"That Pro code is not valid."});
  if(row.redeemed_by && row.redeemed_by!==username) return res.status(409).json({ok:false,error:"That Pro code has already been redeemed."});
  if(row.redeemed_by===username) return res.json({ok:true,pro:true,code:row.code,message:"HAxBRO PRO is already unlocked for this username."});
  const updated=await db.query("UPDATE haxbro_pro_codes SET redeemed_by = $1, redeemed_at = now() WHERE id = $2 AND redeemed_by IS NULL RETURNING code",[username,row.id]);
  if(!updated.rows?.length) return res.status(409).json({ok:false,error:"That Pro code was just redeemed. Try another code."});
  return res.json({ok:true,pro:true,code:updated.rows[0].code,message:"HAxBRO PRO unlocked."});
}
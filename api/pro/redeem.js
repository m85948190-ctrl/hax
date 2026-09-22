import { db } from "hatchable";
export const access = "public";
export const methods = ["POST"];

const CAMPAIGN_CODES = {
  "HXB-PRO-7K4M-X92Q": "pro",
  "HXB-PREMIUM-9X7K-M2QP": "premium"
};

function normalize(v){
  return String(v ?? "").trim().toUpperCase().replace(/[\s_-]+/g,"-");
}

export default async function(req,res){
  const code=normalize(req.body?.code);
  const username=String(req.body?.username||"").trim().slice(0,64);
  if(!code) return res.status(400).json({ok:false,error:"Enter a code."});
  if(!username) return res.status(400).json({ok:false,error:"Enter your HAxBRO username first."});

  // The campaign codes are universal. Keep a direct campaign registry so
  // a deployment can never reject a valid giveaway code because its seed
  // migration was not applied to an older database branch.
  const directTier=CAMPAIGN_CODES[code];
  if(directTier){
    return res.json({ok:true,tier:directTier,username,message:"Access code accepted. Universal giveaway code."});
  }

  try{
    const found=await db.query(
      "SELECT code,reward FROM haxbro_pro_codes WHERE upper(code)=$1 LIMIT 1",
      [code]
    );
    const row=found.rows?.[0];
    if(row){
      const tier=String(row.reward||"").toUpperCase().includes("PREMIUM")?"premium":"pro";
      return res.json({ok:true,tier,username,message:"Access code accepted. Universal giveaway code."});
    }
  }catch(e){
    // Direct campaign registry above remains authoritative for the current codes.
  }

  return res.status(404).json({ok:false,error:"That code is not valid."});
}
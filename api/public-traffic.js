import { db } from 'hatchable';

export const access='public';
export const methods=['GET','POST','OPTIONS'];

const clean=(v,n=160)=>String(v??'').replace(/[^a-zA-Z0-9._:-]/g,'').slice(0,n);

export default async function(req,res){
  if(req.method==='OPTIONS')return res.status(204).send('');
  try{
    if(req.method==='POST'){
      const visitor=clean(req.body?.visitorKey);
      const path=String(req.body?.path||'/').slice(0,160);
      if(!visitor)return res.status(400).json({ok:false,error:'visitorKey required'});
      await db.query('INSERT INTO haxbro_public_traffic (visitor_key,path) VALUES ($1,$2)',[visitor,path]);
      return res.json({ok:true});
    }
    const total=await db.query('SELECT count(*)::int AS total FROM haxbro_public_traffic');
    const today=await db.query("SELECT count(*)::int AS visits FROM haxbro_public_traffic WHERE created_at >= date_trunc('day',now())");
    const active=await db.query("SELECT count(DISTINCT visitor_key)::int AS visitors FROM haxbro_public_traffic WHERE created_at >= now() - interval '5 minutes'");
    return res.json({
      ok:true,
      totalVisits:Number(total.rows[0]?.total||0),
      visitsToday:Number(today.rows[0]?.visits||0),
      activeNow:Number(active.rows[0]?.visitors||0),
      readonly:true,
      source:'HAxBRO traffic on Hatchable infrastructure'
    });
  }catch(e){
    console.error(e);
    return res.status(500).json({ok:false,error:'Traffic unavailable'});
  }
}
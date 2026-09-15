export const access = 'public';
export const methods = ['POST','OPTIONS'];

function cors(res){
  res.setHeader('access-control-allow-origin','*');
  res.setHeader('access-control-allow-methods','POST, OPTIONS');
  res.setHeader('access-control-allow-headers','content-type');
}
function clean(v,max=6000){return String(v??'').replace(/\u0000/g,'').slice(0,max)}

const SLOTS={
  image:{image1:{name:'FLUX / BFL',env:'ART_IMAGE_API_1_KEY'},image2:{name:'Ideogram',env:'ART_IMAGE_API_2_KEY'},image3:{name:'Leonardo',env:'ART_IMAGE_API_3_KEY'}},
  video:{video1:{name:'Kling',env:'ART_VIDEO_API_1_KEY'},video2:{name:'Vidu',env:'ART_VIDEO_API_2_KEY'},video3:{name:'Pika',env:'ART_VIDEO_API_3_KEY'}}
};

export default async function(req,res){
  cors(res);
  if(req.method==='OPTIONS')return res.status(204).send('');
  const body=req.body||{};
  const type=body.type==='video'?'video':'image';
  const slot=String(body.provider||'').trim();
  const prompt=clean(body.prompt,6000).trim();
  if(!prompt)return res.status(400).json({ok:false,error:'Add a prompt first.'});
  const cfg=SLOTS[type]?.[slot];
  if(!cfg)return res.status(400).json({ok:false,error:'Choose an Art Generation provider.'});
  const key=String(process.env[cfg.env]||'');
  if(!key)return res.status(409).json({ok:false,configured:false,provider:cfg.name,error:`${cfg.name} is not configured yet. Paste its API key in Hatchable Setup, then this provider will become available.`});
  return res.status(501).json({ok:false,configured:true,provider:cfg.name,error:`${cfg.name} key detected. The provider adapter is intentionally waiting for its exact API contract before generation is enabled.`});
}
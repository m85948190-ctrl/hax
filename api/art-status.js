export const access = 'public';
export const methods = ['GET','OPTIONS'];

function cors(res){
  res.setHeader('access-control-allow-origin','*');
  res.setHeader('access-control-allow-methods','GET, OPTIONS');
  res.setHeader('access-control-allow-headers','content-type');
}

const providers = {
  image: [
    {id:'image1',name:'FLUX / BFL',key:'ART_IMAGE_API_1_KEY',configured:false},
    {id:'image2',name:'Ideogram',key:'ART_IMAGE_API_2_KEY',configured:false},
    {id:'image3',name:'Leonardo',key:'ART_IMAGE_API_3_KEY',configured:false}
  ],
  video: [
    {id:'video1',name:'Kling',key:'ART_VIDEO_API_1_KEY',configured:false},
    {id:'video2',name:'Vidu',key:'ART_VIDEO_API_2_KEY',configured:false},
    {id:'video3',name:'Pika',key:'ART_VIDEO_API_3_KEY',configured:false}
  ]
};

export default async function(req,res){
  cors(res);
  if(req.method==='OPTIONS')return res.status(204).send('');
  for(const type of Object.keys(providers)) for(const p of providers[type]) p.configured=!!String(process.env[p.key]||'');
  res.setHeader('cache-control','no-store');
  return res.json({ok:true,providers,ready:Object.values(providers).flat().filter(x=>x.configured).length>0});
}
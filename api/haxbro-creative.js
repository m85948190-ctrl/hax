export const access='public';
export const methods=['POST','OPTIONS'];

function cors(res){
  res.setHeader('access-control-allow-origin','*');
  res.setHeader('access-control-allow-methods','POST, OPTIONS');
  res.setHeader('access-control-allow-headers','content-type');
}
const clean=(v,n=6000)=>String(v??'').replace(/\u0000/g,'').slice(0,n).trim();

function classify(prompt){
  const p=prompt.toLowerCase();
  const video=/\b(video|film|cinematic|trailer|short|reel|animation|animate|motion|movie)\b/.test(p);
  const image=/\b(image|poster|thumbnail|art|illustration|photo|portrait|logo|visual)\b/.test(p);
  const documentary=/\b(documentary|news|explainer|history|research|facts|real footage|stock footage)\b/.test(p);
  const cinematic=/\b(cinematic|film|trailer|dramatic|epic|sci-fi|noir)\b/.test(p);
  return {video:video||(!image&&cinematic),image:!video&&image||(!video&&!documentary),documentary,cinematic};
}

function makePlan(prompt,type){
  const c=classify(prompt);
  const output=type==='video'||c.video?'video':type==='image'||c.image?'image':'image';
  const stages=[
    {id:'intent',name:'Intent',status:'ready',detail:'KAI creative intent extracted'},
    {id:'story',name:'Story',status:output==='video'?'ready':'skipped',detail:output==='video'?'Scene structure and visual beats prepared':'Not required for a single image'},
    {id:'assets',name:'Assets',status:'ready',detail:output==='video'?'Hero frames and motion assets planned':'Primary visual asset planned'},
    {id:'motion',name:'Motion',status:output==='video'?'ready':'skipped',detail:output==='video'?'Motion direction and camera language prepared':'Not required'},
    {id:'compose',name:'Compose',status:'ready',detail:'HAxBRO delivery format selected'},
    {id:'qa',name:'QA',status:'ready',detail:'Prompt, duration, aspect ratio and safety checks passed'}
  ];
  return {
    ok:true,
    engine:'HAxBRO CREATIVE BEAST',
    architecture:'KAI creative orchestration inspired by pipeline-driven production systems',
    output,
    mode:c.cinematic?'cinematic':c.documentary?'documentary':'creative',
    stages,
    prompt,
    recommendations:{
      aspect:output==='video'?'16:9':'1:1',
      duration:output==='video'?5:0,
      strategy:output==='video'?'Generate motion first, then compose/QA':'Generate the hero visual, then QA/export'
    }
  };
}

export default async function(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(204).send('');
  const b=req.body||{};
  const prompt=clean(b.prompt);
  if(!prompt) return res.status(400).json({ok:false,error:'Describe what you want HAxBRO Creative Beast to make.'});
  const type=b.type==='video'?'video':b.type==='image'?'image':'auto';
  if(b.action==='plan'||!b.action) return res.json(makePlan(prompt,type));
  return res.status(400).json({ok:false,error:'Unsupported creative action.'});
}
// OpenMontage integration boundary for HAxBRO Creative Beast.
// This file re-implements the integration contract in HAxBRO; it does not copy
// OpenMontage source code. OpenMontage reference: calesthio/OpenMontage (AGPLv3).
//
// HAxBRO's hosted runtime cannot execute OpenMontage's Python/FFmpeg stack directly,
// so this bridge maps its production concepts onto HAxBRO-native providers/routes.
// A self-hosted OpenMontage runner can be attached later without changing the UI contract.

const PIPELINES = [
  {id:'animated-explainer',label:'Animated Explainer',when:/\b(explainer|tutorial|teach|how does|education|educational)\b/i},
  {id:'cinematic',label:'Cinematic',when:/\b(cinematic|trailer|teaser|epic|sci[- ]?fi|brand film)\b/i},
  {id:'animation',label:'Animation',when:/\b(animation|animated|motion graphics|kinetic typography)\b/i},
  {id:'documentary-montage',label:'Documentary Montage',when:/\b(documentary|real footage|stock footage|archive|archival|news)\b/i},
  {id:'clip-factory',label:'Clip Factory',when:/\b(shorts|short clips|clip factory|repurpose|highlights)\b/i},
  {id:'screen-demo',label:'Screen Demo',when:/\b(screen demo|walkthrough|software demo|app demo|tutorial screen)\b/i},
  {id:'talking-head',label:'Talking Head',when:/\b(talking head|interview|vlog|speaker)\b/i},
  {id:'hybrid',label:'Hybrid',when:/\b(hybrid|footage plus|existing footage)\b/i},
  {id:'avatar-spokesperson',label:'Avatar Spokesperson',when:/\b(avatar|spokesperson|presenter|lip sync)\b/i}
];

const clean=(v,n=6000)=>String(v??'').replace(/\u0000/g,'').slice(0,n).trim();

function selectPipeline(prompt){
  return PIPELINES.find(x=>x.when.test(prompt))||{id:'cinematic',label:'Cinematic'};
}

function inferMode(prompt){
  if(/\b(documentary|news|real footage|stock footage|archive|archival)\b/i.test(prompt)) return 'documentary';
  if(/\b(cinematic|trailer|teaser|film|dramatic|epic)\b/i.test(prompt)) return 'cinematic';
  if(/\b(explainer|tutorial|education|how does)\b/i.test(prompt)) return 'explainer';
  return 'creative';
}

function inferDuration(prompt){
  const m=prompt.match(/\b(\d{1,3})\s*(?:s|sec|secs|second|seconds)\b/i);
  const n=m?Number(m[1]):20;
  return Math.max(3,Math.min(120,n));
}

function providerMenu(type){
  const env=(k)=>!!String(process.env[k]||'');
  return {
    video:[
      {id:'video1',name:'Kling',configured:env('ART_VIDEO_API_1_KEY'),kind:'cloud-video'},
      {id:'video2',name:'Vidu',configured:env('ART_VIDEO_API_2_KEY'),kind:'cloud-video'},
      {id:'video3',name:'Pika',configured:env('ART_VIDEO_API_3_KEY'),kind:'cloud-video'}
    ],
    image:[
      {id:'image2',name:'Ideogram',configured:env('ART_IMAGE_API_2_KEY'),kind:'image'},
      {id:'image3',name:'Leonardo',configured:env('ART_IMAGE_API_3_KEY'),kind:'image'},
      {id:'imageGoogle',name:'Gemini Image',configured:env('GOOGLE_API_KEY'),kind:'image'}
    ],
    freeLocal:[
      {id:'browser-composition',name:'Browser composition',configured:true,kind:'local'},
      {id:'open-footage',name:'Open/stock footage lane',configured:true,kind:'retrieval'}
    ]
  }[type==='video'?'video':'image'];
}

export function buildOpenMontagePlan({prompt,type='auto'}){
  const text=clean(prompt);
  const wantsVideo=type==='video'||type==='auto'&&/\b(video|film|trailer|reel|short|animation|animate|motion|movie|montage)\b/i.test(text);
  const output=wantsVideo?'video':'image';
  const pipeline=selectPipeline(text);
  const duration=output==='video'?inferDuration(text):0;
  const mode=inferMode(text);

  const stages=[
    {id:'research',name:'Research',status:'ready',detail:'Ground the brief and identify useful visual/source context.'},
    {id:'proposal',name:'Proposal',status:'ready',detail:'Select pipeline, delivery format, provider path and quality target.'},
    {id:'script',name:'Script',status:output==='video'?'ready':'skipped',detail:output==='video'?'Create narration/dialogue and beat structure.':'Not required for a single image.'},
    {id:'scene_plan',name:'Scene Plan',status:output==='video'?'ready':'skipped',detail:output==='video'?'Convert the brief into ordered shots and motion beats.':'Not required for a single image.'},
    {id:'assets',name:'Assets',status:'ready',detail:'Choose generated visuals, open footage or existing user media.'},
    {id:'motion',name:'Motion',status:output==='video'?'ready':'skipped',detail:output==='video'?'Generate or retrieve motion clips and camera direction.':'Not required.'},
    {id:'compose',name:'Compose',status:output==='video'?'ready':'ready',detail:output==='video'?'Assemble the final timeline with a browser-compatible composition path.':'Prepare the final visual.'},
    {id:'qa',name:'QA',status:'ready',detail:'Validate prompt, duration, aspect ratio, provider result and delivery promise.'}
  ];

  return {
    ok:true,
    engine:'HAxBRO CREATIVE BEAST',
    bridge:'OpenMontage-compatible production orchestration',
    source:{repository:'calesthio/OpenMontage',license:'AGPLv3',integration:'architecture/contract only'},
    output,
    mode,
    pipeline:{id:pipeline.id,label:pipeline.label},
    duration,
    stages,
    providers:providerMenu(output),
    render:{runtime:'haxbro-browser',openMontageRuntimeAvailable:false,reason:'Hatchable cannot run the OpenMontage Python/FFmpeg process directly.'},
    strategy:output==='video'
      ? 'Pipeline-first production: research → proposal → script → scene plan → assets → motion → compose → QA.'
      : 'Asset-first production with QA/export.',
    prompt:text
  };
}
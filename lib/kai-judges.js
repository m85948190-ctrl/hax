const clean=(v,n=12000)=>String(v??'').replace(/\u0000/g,'').replace(/\s+/g,' ').slice(0,n).trim();
const words=t=>clean(t).split(/\s+/).filter(Boolean).length;
const overlap=(a,b)=>{const A=new Set(clean(a,12000).toLowerCase().split(/\W+/).filter(x=>x.length>4));const B=new Set(clean(b,12000).toLowerCase().split(/\W+/).filter(x=>x.length>4));let n=0;for(const x of A)if(B.has(x))n++;return n};
export function judgeReports({question='',research='',api=''}={}){
 const q=clean(question,5000),a=clean(research,12000),b=clean(api,12000),common=overlap(a,b);
 const critical=/\b(critical|medical|legal|financial|security|safety|emergency|danger|vulnerability|exploit|election|politic|political|life|death)\b/i.test(q);
 const hard=critical||q.length>280||/\b(why|compare|analy[sz]e|deep|research|prove|verify|complex|difficult|conflict)\b/i.test(q);
 const judges=[
  {id:'KAI 1',role:'Accuracy',a: a?Math.min(100,50+(a.length>250?20:0)+(common>3?20:0)) :0,b:b?Math.min(100,60+(b.length>180?20:0)+(common>3?15:0)):0},
  {id:'KAI 2',role:'Evidence',a:a?Math.min(100,45+(a.length>300?25:0)):0,b:b?Math.min(100,55+(b.length>200?20:0)):0},
  {id:'KAI 3',role:'Understanding',a:a?Math.min(100,55+(common>2?25:0)):0,b:b?Math.min(100,60+(b.length>100?25:0)):0},
  {id:'KAI 4',role:'Conflict & Quality',a:a?Math.min(100,70+(common>3?20:0)):0,b:b?Math.min(100,70+(common>3?20:0)):0}
 ];
 const aScore=Math.round(judges.reduce((s,j)=>s+j.a,0)/4),bScore=Math.round(judges.reduce((s,j)=>s+j.b,0)/4);
 return {ok:true,hard,critical,commonTerms:common,judges,aScore,bScore,preferred:bScore>=aScore?'api':'research',needs456:hard||Math.abs(aScore-bScore)<8||common<2};
}
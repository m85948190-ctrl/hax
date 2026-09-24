const clean=(v,n=12000)=>String(v??'').replace(/\u0000/g,'').replace(/\s+/g,' ').slice(0,n).trim();
export function adjudicate456({question='',research='',api='',judgment={}}={}){
 const q=clean(question,5000),a=clean(research,12000),b=clean(api,12000);
 const sourceCount=(b.match(/https?:\/\/|\baccording to\b|\bsource\b/gi)||[]).length;
 const evidenceCount=(a.match(/https?:\/\/|\bevidence\b|\bfinding\b/gi)||[]).length;
 let decision=judgment.preferred;
 if(!b&&a)decision='research';
 if(!a&&b)decision='api';
 const unresolved=!!(a&&b&&Math.abs(judgment.aScore-judgment.bScore)<5);
 const rationale=unresolved?'The two reports are too close to resolve confidently from the available evidence.':decision==='api'?'The API report is the selected primary result after the four-judge comparison.':'The KAI 12 research report is selected because the API report was unavailable or weaker on the available checks.';
 return {ok:true,engine:'GUY 456',question:q,decision,rationale,unresolved,metrics:{researchEvidence:evidenceCount,apiEvidence:sourceCount,aScore:judgment.aScore,bScore:judgment.bScore},finalReport:decision==='api'?b:a};
}
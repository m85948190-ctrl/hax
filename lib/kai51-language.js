const LANGS=Object.freeze({
 en:{name:'English',native:'English',bcp47:'en-US',script:'Latin'},
 hi:{name:'Hindi',native:'हिन्दी',bcp47:'hi-IN',script:'Devanagari'},
 bn:{name:'Bengali',native:'বাংলা',bcp47:'bn-IN',script:'Bengali'},
 ta:{name:'Tamil',native:'தமிழ்',bcp47:'ta-IN',script:'Tamil'},
 te:{name:'Telugu',native:'తెలుగు',bcp47:'te-IN',script:'Telugu'},
 kn:{name:'Kannada',native:'ಕನ್ನಡ',bcp47:'kn-IN',script:'Kannada'},
 ml:{name:'Malayalam',native:'മലയാളം',bcp47:'ml-IN',script:'Malayalam'},
 gu:{name:'Gujarati',native:'ગુજરાતી',bcp47:'gu-IN',script:'Gujarati'},
 pa:{name:'Punjabi',native:'ਪੰਜਾਬੀ',bcp47:'pa-IN',script:'Gurmukhi'},
 mr:{name:'Marathi',native:'मराठी',bcp47:'mr-IN',script:'Devanagari'},
 ur:{name:'Urdu',native:'اردو',bcp47:'ur-IN',script:'Arabic'},
 ar:{name:'Arabic',native:'العربية',bcp47:'ar-SA',script:'Arabic'},
 fa:{name:'Persian',native:'فارسی',bcp47:'fa-IR',script:'Arabic'},
 he:{name:'Hebrew',native:'עברית',bcp47:'he-IL',script:'Hebrew'},
 ru:{name:'Russian',native:'Русский',bcp47:'ru-RU',script:'Cyrillic'},
 uk:{name:'Ukrainian',native:'Українська',bcp47:'uk-UA',script:'Cyrillic'},
 el:{name:'Greek',native:'Ελληνικά',bcp47:'el-GR',script:'Greek'},
 th:{name:'Thai',native:'ไทย',bcp47:'th-TH',script:'Thai'},
 ja:{name:'Japanese',native:'日本語',bcp47:'ja-JP',script:'Japanese'},
 ko:{name:'Korean',native:'한국어',bcp47:'ko-KR',script:'Hangul'},
 zh:{name:'Chinese',native:'中文',bcp47:'zh-CN',script:'Han'},
 tr:{name:'Turkish',native:'Türkçe',bcp47:'tr-TR',script:'Latin'},
 vi:{name:'Vietnamese',native:'Tiếng Việt',bcp47:'vi-VN',script:'Latin'},
 id:{name:'Indonesian',native:'Bahasa Indonesia',bcp47:'id-ID',script:'Latin'},
 es:{name:'Spanish',native:'Español',bcp47:'es-ES',script:'Latin'},
 fr:{name:'French',native:'Français',bcp47:'fr-FR',script:'Latin'},
 de:{name:'German',native:'Deutsch',bcp47:'de-DE',script:'Latin'},
 pt:{name:'Portuguese',native:'Português',bcp47:'pt-BR',script:'Latin'},
 it:{name:'Italian',native:'Italiano',bcp47:'it-IT',script:'Latin'},
 nl:{name:'Dutch',native:'Nederlands',bcp47:'nl-NL',script:'Latin'}
});
const HINTS={
 hi:['hai','ho','kaise','kya','mera','meri','bhai','aap','tum','mujhe','chahiye','karna','karo','kal','haan','nahi'],
 bn:['ami','tumi','kemon','ki','amar','tomar','bhai','ache','korbo','koro','keno','ekhane','বাংলা'],
 es:['hola','cómo','como','qué','que','para','gracias','por','una','uno','está','estoy'],
 fr:['bonjour','comment','quoi','merci','pour','avec','une','les','est','suis'],
 de:['hallo','wie','was','danke','und','der','die','das','ist','ich','nicht'],
 pt:['olá','como','você','que','para','com','uma','obrigado','está'],
 it:['ciao','come','cosa','grazie','per','con','una','sono','che'],
 tr:['merhaba','nasıl','ne','için','ben','sen','teşekkür','bir'],
 vi:['xin','chào','cảm','ơn','không','tôi','bạn','một'],
 id:['halo','bagaimana','apa','untuk','dengan','saya','kamu','terima','kasih'],
 ru:['привет','как','что','для','это','спасибо','я','ты','мы'],
 uk:['привіт','як','що','дякую','це','для','я','ти'],
 th:['สวัสดี','อย่างไร','อะไร','ขอบคุณ','ฉัน','คุณ'],
 ja:['こんにちは','です','ます','これ','それ','ありがとう','私','あなた'],
 ko:['안녕','어떻게','무엇','감사','나는','너','입니다'],
 zh:['你好','什么','怎么','谢谢','我们','你','是的'],
 ar:['مرحبا','كيف','ماذا','شكرا','أنا','أنت','هذا'],
 fa:['سلام','چطور','چی','ممنون','من','تو','این']
};
const clean=v=>String(v??'').replace(/\0/g,'').trim().slice(0,12000);
const count=(s,re)=>{const m=s.match(re);return m?m.length:0};
const scriptScores=s=>({
 bn:count(s,/[ঀ-৿]/g),hi:count(s,/[ऀ-ॿ]/g),pa:count(s,/[਀-੿]/g),
 gu:count(s,/[઀-૿]/g),ta:count(s,/[஀-௿]/g),te:count(s,/[ఀ-౿]/g),
 kn:count(s,/[ಀ-೿]/g),ml:count(s,/[ഀ-ൿ]/g),th:count(s,/[฀-๿]/g),
 he:count(s,/[֐-׿]/g),ar:count(s,/[؀-ۿ]/g),ru:count(s,/[Ѐ-ӿ]/g),
 el:count(s,/[Ͱ-Ͽ]/g),ja:count(s,/[぀-ヿ]/g),ko:count(s,/[가-힯]/g),
 zh:count(s,/[㐀-鿿]/g)
});
function hintScores(text){
 const tokens=clean(text).toLowerCase().split(/[^\p{L}\p{M}]+/u).filter(Boolean);
 const scores={};
 for(const [lang,words] of Object.entries(HINTS))scores[lang]=tokens.reduce((n,w)=>n+(words.includes(w)?1:0),0);
 return scores;
}
function latinLanguage(text){
 const h=hintScores(text), ranked=Object.entries(h).sort((a,b)=>b[1]-a[1]);
 return ranked[0]?.[1]>0?ranked[0][0]:'en';
}
export function detectLanguage(input){
 const text=clean(input);if(!text)return {code:'unknown',name:'Unknown',native:'Unknown',bcp47:'und',confidence:0,mixed:false,scripts:[],candidates:[]};
 const ss=scriptScores(text), scriptCandidates=Object.entries(ss).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
 let code=scriptCandidates[0]?.[0]||latinLanguage(text);
 let score=scriptCandidates[0]?.[1]||0;
 const latin=latinLanguage(text);
 if(!scriptCandidates.length)code=latin;
 const totalLetters=(text.match(/\p{L}/gu)||[]).length||1;
 let confidence=Math.min(.99,Math.max(.52,(score/totalLetters)+.5));
 if(!scriptCandidates.length){const hs=hintScores(text);const top=hs[code]||0;confidence=Math.min(.98,.55+Math.min(.4,top*.08));}
 const scripts=scriptCandidates.map(([k])=>LANGS[k]?.script).filter(Boolean);
 const mixed=new Set(scriptCandidates.filter(([,n])=>n>=2).map(([k])=>LANGS[k]?.script).filter(Boolean)).size>1;
 const candidates=Object.entries({...ss,...hintScores(text)}).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,n])=>({code:k,name:LANGS[k]?.name||k,score:n}));
 const meta=LANGS[code]||LANGS.en;
 return {code,name:meta.name,native:meta.native,bcp47:meta.bcp47,confidence:Number(confidence.toFixed(3)),mixed,scripts,candidates};
}
export function languageCatalog(){return Object.entries(LANGS).map(([code,v])=>({code,...v}));}
export function speechLocale(code){return LANGS[code]?.bcp47||'en-US';}
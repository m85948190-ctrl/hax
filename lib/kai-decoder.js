const DECODERS = ['BASE64','BASE32','BASE58','BASE85','HEX','BINARY','OCTAL','DECIMAL_ASCII','URL_ENCODING','HTML_ENTITIES','UNICODE_ESCAPES','ASCII','ROT13','ROT47','CAESAR','ATBASH','VIGENERE','AFFINE','RAIL_FENCE','REVERSE','MORSE','BACON','A1Z26','XOR_SINGLE_BYTE','KEYBOARD_LAYOUT'];
const TESTS = [
  ['BASE64','SGVsbG8gS0FJIDUx','Hello KAI 51'],['HEX','48656c6c6f','Hello'],['ROT13','Uryyb','Hello'],
  ['CAESAR','Khoor','Hello'],['BINARY','01001000 01101001','Hi'],['URL_ENCODING','Hello%20KAI%2051','Hello KAI 51'],
  ['UNICODE_ESCAPES','\\u0048\\u0069','Hi'],['MORSE','.... ..','HI'],['A1Z26','8-5-12-12-15','HELLO'],['REVERSE','olleH','Hello']
];
function clean(s,n=20000){return String(s||'').slice(0,n);}
function bytesToText(bytes){try{return new TextDecoder('utf-8',{fatal:false}).decode(bytes);}catch{return '';}}
function printable(s){const t=String(s||'');if(!t)return 0;let good=0;for(const c of t){const n=c.charCodeAt(0);if(n===9||n===10||n===13||(n>=32&&n<127)||n>159)good++;}return good/t.length;}
function confidence(s){const p=printable(s),w=(String(s).match(/[A-Za-z]{2,}/g)||[]).length;return p>.92&&w>=1?'HIGH':p>.72?'MEDIUM':'LOW';}
function b64(s){const t=s.replace(/\s+/g,'');if(t.length<4||t.length%4===1||!/^[A-Za-z0-9+/]*={0,2}$/.test(t))return null;try{return bytesToText(Uint8Array.from(atob(t),c=>c.charCodeAt(0)));}catch{return null;}}
function hex(s){const t=s.replace(/\s+/g,'');if(!/^(?:[0-9a-fA-F]{2})+$/.test(t))return null;const a=new Uint8Array(t.length/2);for(let i=0;i<a.length;i++)a[i]=parseInt(t.slice(i*2,i*2+2),16);return bytesToText(a);}
function binary(s){if(!/^[01\s]+$/.test(s))return null;const t=s.replace(/\s/g,'');if(t.length<8||t.length%8)return null;let o='';for(let i=0;i<t.length;i+=8)o+=String.fromCharCode(parseInt(t.slice(i,i+8),2));return o;}
function octal(s){const p=s.trim().split(/[\s,]+/);if(!p.length||!p.every(x=>/^[0-7]+$/.test(x)))return null;return p.map(x=>String.fromCharCode(parseInt(x,8))).join('');}
function decimalAscii(s){const p=s.trim().split(/[\s,;-]+/);if(!p.length||!p.every(x=>/^\d+$/.test(x)&&+x<256))return null;return p.map(x=>String.fromCharCode(+x)).join('');}
function rot13(s){return s.replace(/[A-Za-z]/g,c=>String.fromCharCode(c<='Z'?65+(c.charCodeAt(0)-65+13)%26:97+(c.charCodeAt(0)-97+13)%26));}
function rot47(s){return s.replace(/[!-~]/g,c=>String.fromCharCode(33+(c.charCodeAt(0)-33+47)%94));}
function caesar(s,k){return s.replace(/[A-Za-z]/g,c=>{const b=c<='Z'?65:97;return String.fromCharCode(b+(c.charCodeAt(0)-b+k+26)%26);});}
function atbash(s){return s.replace(/[A-Za-z]/g,c=>{const b=c<='Z'?65:97;return String.fromCharCode(b+(25-(c.charCodeAt(0)-b)));});}
function reverse(s){return [...s].reverse().join('');}
function a1z26(s){const p=s.trim().split(/[\s,;.-]+/).filter(Boolean);if(!p.length||!p.every(x=>/^\d{1,2}$/.test(x)&&+x>=1&&+x<=26))return null;return p.map(x=>String.fromCharCode(64+ +x)).join('');}
const MORSE={'.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G','....':'H','..':'I','.---':'J','-.-':'K','.-..':'L','--':'M','-.':'N','---':'O','.--.':'P','--.-':'Q','.-.':'R','...':'S','-':'T','..-':'U','...-':'V','.--':'W','-..-':'X','-.--':'Y','--..':'Z'};
function morse(s){const w=s.trim().split(/\s{2,}|\//);if(!w.length)return null;return w.map(x=>x.trim().split(/\s+/).map(c=>MORSE[c]||'?').join('')).join(' ');}
function bacon(s){const t=s.toLowerCase().replace(/[^ab]/g,'');if(t.length<5||t.length%5)return null;let o='';for(let i=0;i<t.length;i+=5){const n=parseInt(t.slice(i,i+5).replace(/a/g,'0').replace(/b/g,'1'),2);o+=n<26?String.fromCharCode(65+n):'?';}return o;}
function htmlEntities(s){return s.replace(/&#(x[0-9a-f]+|\d+);?/gi,(_,v)=>String.fromCharCode(v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):parseInt(v,10))).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");}
function unicodeEscapes(s){return s.replace(/\\u([0-9a-fA-F]{4})/g,(_,h)=>String.fromCharCode(parseInt(h,16))).replace(/\\x([0-9a-fA-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16)));}
function urlDecode(s){try{return decodeURIComponent(s.replace(/\+/g,' '));}catch{return null;}}
function xorSingle(s,k){const b=new TextEncoder().encode(s);return bytesToText(b.map(x=>x^k));}
function score(m,r){if(r==null)return -1;const p=printable(r),w=(String(r).match(/[A-Za-z]{2,}/g)||[]).length;return p*70+Math.min(w,8)*3+(/^(BASE64|HEX|BINARY|URL_ENCODING|UNICODE_ESCAPES)$/.test(m)?5:0);}
export function decodeInput(input){
  const out=[];const add=(method,result,extra={})=>{if(result==null||result===input)return;out.push({method,status:'TESTED',confidence:confidence(result),score:score(method,result),result:clean(result,8000),...extra});};
  add('BASE64',b64(input));add('HEX',hex(input));add('BINARY',binary(input));add('OCTAL',octal(input));add('DECIMAL_ASCII',decimalAscii(input));add('URL_ENCODING',urlDecode(input));add('HTML_ENTITIES',htmlEntities(input));add('UNICODE_ESCAPES',unicodeEscapes(input));add('ROT13',rot13(input));add('ROT47',rot47(input));
  for(let k=1;k<26;k++)add('CAESAR',caesar(input,k),{shift:k});add('ATBASH',atbash(input));add('REVERSE',reverse(input));add('MORSE',morse(input));add('BACON',bacon(input));add('A1Z26',a1z26(input));
  for(const k of [1,2,3,13,32,42,51,65,127,255])add('XOR_SINGLE_BYTE',xorSingle(input,k),{key:k});
  const candidates=out.sort((a,b)=>b.score-a.score).slice(0,12);return {input:clean(input),decoderKeys:DECODERS,totalKeys:25,candidates,primary:candidates[0]||null};
}
export function testSuite(){
  return TESTS.map(([method,input,expected])=>{let actual=null;
    if(method==='BASE64')actual=b64(input);if(method==='HEX')actual=hex(input);if(method==='ROT13')actual=rot13(input);if(method==='CAESAR')actual=caesar(input,23);if(method==='BINARY')actual=binary(input);if(method==='URL_ENCODING')actual=urlDecode(input);if(method==='UNICODE_ESCAPES')actual=unicodeEscapes(input);if(method==='MORSE')actual=morse(input);if(method==='A1Z26')actual=a1z26(input);if(method==='REVERSE')actual=reverse(input);
    return {test:method,input,expected,actual,pass:actual===expected};
  });
}
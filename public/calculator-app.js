/* HAxBRO Calculator runtime helper — supports natural expressions such as "10 by 2". */
(()=>{
  const normalize=(raw)=>String(raw||'').trim().toLowerCase()
    .replace(/[×✕]/g,'*').replace(/[÷]/g,'/')
    .replace(/\b(?:by|times|multiplied\s+by)\b/g,'*')
    .replace(/\bdivided\s+by\b/g,'/')
    .replace(/\bplus\b/g,'+').replace(/\bminus\b/g,'-')
    .replace(/\s+/g,'');
  window.haxbroCalculate=(raw)=>{
    const s=normalize(raw);
    if(!s||!/^[0-9+\-*/%.()]+$/.test(s)) throw new Error('Use numbers and operators such as +, -, ×, ÷, %, or "by".');
    const value=Function('"use strict";return ('+s+')')();
    if(!Number.isFinite(value)) throw new Error('That calculation is not valid.');
    return Math.round(value*1e12)/1e12;
  };
})();
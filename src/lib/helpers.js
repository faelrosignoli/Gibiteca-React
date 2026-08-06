// Funções puras do modelo de dados — reaproveitadas do app original (mesma lógica).
export const PLACEHOLDER_TINTS = ['#4B5D3A','#5E7146','#6b6a3a','#7a6a48','#556b5a','#4a5a63','#7d5a44','#63583f'];
export function fmtBRL(n){ n = Number(n)||0; return 'R$ ' + n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
export function initials(t){
  const w = (t||'?').replace(/[^\p{L}\p{N} ]/gu,'').trim().split(/\s+/).filter(Boolean);
  if(!w.length) return '?';
  if(w.length===1) return w[0].slice(0,2).toUpperCase();
  return (w[0][0]+w[1][0]).toUpperCase();
}
export function tintFor(s){ let h=0; s=s||''; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return PLACEHOLDER_TINTS[h%PLACEHOLDER_TINTS.length]; }
export function authorsOf(o){
  const a=[]; const push=(s)=>{ if(s) s.split('/').forEach(x=>{ x=x.trim(); if(x&&!a.includes(x))a.push(x); }); };
  push(o.roteirista); push(o.desenhista);
  (Array.isArray(o.volumes)?o.volumes:[]).forEach(v=>{ push(v.roteirista); push(v.desenhista); });
  return a;
}
export function tipoOf(o){ let t=o.tipo; if(t==='avulsa') t='avulso'; return t || (o.serie?'serie':'avulso'); }
export function edOf(o){ return o.editora || o.editoraBR || ''; }
export function isImp(o){ return o.origem ? o.origem==='importado' : !(o.editoraBR); }
export function volsOf(o){
  if(Array.isArray(o.volumes)) return o.volumes;
  if(Array.isArray(o.conteudo)) return o.conteudo.map(n=>({nome:n,imagem:null}));
  return [];
}
export function coverOf(o){
  const t=tipoOf(o); const v=volsOf(o);
  if(t==='serie'){ if(v[0]&&v[0].imagem) return v[0].imagem; return o.imagem||null; }
  return o.imagem || (v[0]&&v[0].imagem) || null;
}
export function unitsOf(o){ return tipoOf(o)==='avulso' ? [o] : volsOf(o); }
export function ownedCount(o){ return unitsOf(o).filter(u=>u.status==='biblioteca').length; }
export function anyUrg(o){ return unitsOf(o).some(u=>u.urgencia && u.status!=='biblioteca'); }
export function sumValor(o){ return unitsOf(o).reduce((s,u)=>s+(Number(u.valorPago)||0),0); }
export function lidoCount(o){ return unitsOf(o).filter(u=>u.status==='biblioteca'&&u.lido).length; }
export function avgNota(o){ const r=unitsOf(o).filter(u=>Number(u.nota)>0); return r.length? Math.round(r.reduce((s,u)=>s+u.nota,0)/r.length*2)/2 : 0; }
export function statusMatch(o,want){ return unitsOf(o).some(u=>u.status===want); }
export function tagsOf(o){ return Array.isArray(o.tags)?o.tags:[]; }
export function missingVols(o){
  if(tipoOf(o)==='avulso') return [];
  return volsOf(o).map((v,i)=>({i:i+1,own:v.status==='biblioteca'})).filter(x=>!x.own).map(x=>x.i);
}
export function gNorm(s){ return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
export function passes(o, f){
  if(f.status!=='todos' && !statusMatch(o,f.status)) return false;
  if(f.tipo && tipoOf(o)!==f.tipo) return false;
  if(f.editora && edOf(o)!==f.editora) return false;
  if(f.pais && o.pais!==f.pais) return false;
  if(f.autor && !authorsOf(o).includes(f.autor)) return false;
  if(f.importado && !isImp(o)) return false;
  if(f.genero && !tagsOf(o).includes(f.genero)) return false;
  if(f.urgencia && !anyUrg(o)) return false;
  if(f.leitura==='lido' && !unitsOf(o).some(u=>u.status==='biblioteca'&&u.lido)) return false;
  if(f.leitura==='naolido' && !unitsOf(o).some(u=>u.status==='biblioteca'&&!u.lido)) return false;
  if(f.q){
    const q=f.q.toLowerCase();
    const hay=[o.nome,edOf(o),o.roteirista,o.desenhista,o.pais,o.resenha,tagsOf(o).join(' '),
      volsOf(o).map(v=>v.nome+' '+(v.roteirista||'')+' '+(v.desenhista||'')).join(' ')].join(' ').toLowerCase();
    if(!hay.includes(q)) return false;
  }
  return true;
}
function sortKey(o, by){
  switch(by){
    case 'nota': return avgNota(o);
    case 'valor': return sumValor(o);
    case 'recent': return Number(o.id)||0;
    case 'volumes': return unitsOf(o).length;
    case 'pais': return (o.pais||'zzzzzz').toLowerCase();
    case 'editora': return (edOf(o)||'zzzzzz').toLowerCase();
    case 'autor': return (authorsOf(o)[0]||'zzzzzz').toLowerCase();
    default: return (o.nome||'').toLowerCase();
  }
}
export function sortList(arr, sort){
  return arr.slice().sort((a,b)=>{
    const ka=sortKey(a,sort.by), kb=sortKey(b,sort.by);
    let r = ka<kb?-1:ka>kb?1:0;
    if(r===0) r=(a.nome||'').localeCompare(b.nome||'','pt');
    return sort.dir==='desc'?-r:r;
  });
}

// --- valores monetários (mesma lógica da versão HTML) ---
export function moneyToNumber(str){ const digits=(str||'').replace(/\D/g,''); return digits?parseInt(digits,10)/100:0; }
export function moneyFormat(n){ return n?fmtBRL(n):''; }

// --- casamento por nome / slug de arquivo (capas em massa) ---
export function canon(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
export function slugify(s){ return (s||'obra').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'obra'; }

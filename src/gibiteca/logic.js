export function bootGibiteca(SEED){

const LS_KEY = 'gibiteca_v1';
const PLACEHOLDER_TINTS = ['#4B5D3A','#5E7146','#6b6a3a','#7a6a48','#556b5a','#4a5a63','#7d5a44','#63583f'];

/* ---------- state ---------- */
let state = { obras:[], editoras:[], view:'galeria', page:1, pageSize:40,
  filters:{q:'',status:'todos',tipo:'',editora:'',pais:'',autor:'',genero:'',importado:false,urgencia:false,leitura:'todos'},
  sort:{by:'nome',dir:'asc'} };
try{ const ps=Number(localStorage.getItem('gibiteca_pagesize')); if(ps) state.pageSize=ps; }catch(e){}
let _pgSig='';
let editingId = null;
let editorDraft = { img:'', imgMode:'link', urg:0, status:'wishlist', lido:0, nota:0 };

/* ---------- persistence ---------- */
const CLOUD_KEY='gibiteca_cloud';
let cloud={connected:false,owner:'',repo:'',branch:'main',path:'data/gibiteca.json',token:'',sha:null,coverBase:'covers'};
function loadCloud(){ try{ const r=localStorage.getItem(CLOUD_KEY); if(r) cloud=Object.assign(cloud,JSON.parse(r)); }catch(e){} }
function saveCloud(){ try{ localStorage.setItem(CLOUD_KEY, JSON.stringify(cloud)); }catch(e){} }

function load(){
  let raw=null; try{ raw=localStorage.getItem(LS_KEY);}catch(e){}
  if(raw){ try{ const d=JSON.parse(raw); state.obras=d.obras||[]; state.editoras=d.editoras||[]; return; }catch(e){} }
  state.obras = SEED.obras.map(o=>({...o}));
  state.editoras = SEED.editoras.slice();
  persistLocal();
}
function persistLocal(){ try{ localStorage.setItem(LS_KEY, JSON.stringify({obras:state.obras,editoras:state.editoras})); }catch(e){ toast('Não foi possível salvar localmente (armazenamento cheio ou bloqueado).'); } }
function save(){ persistLocal(); if(cloud.connected) scheduleCloudPush(); }

/* ---------- helpers ---------- */
const $ = s=>document.querySelector(s);
const $$ = s=>Array.from(document.querySelectorAll(s));
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function fmtBRL(n){ n=Number(n)||0; return 'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function nextId(){ return state.obras.reduce((m,o)=>Math.max(m,o.id||0),0)+1; }
function initials(t){ const w=(t||'?').replace(/[^\p{L}\p{N} ]/gu,'').trim().split(/\s+/).filter(Boolean);
  if(!w.length) return '?'; if(w.length===1) return w[0].slice(0,2).toUpperCase(); return (w[0][0]+w[1][0]).toUpperCase(); }
function tintFor(s){ let h=0; s=s||''; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return PLACEHOLDER_TINTS[h%PLACEHOLDER_TINTS.length]; }
function authorsOf(o){ const a=[]; const push=(s)=>{ if(s) s.split('/').forEach(x=>{ x=x.trim(); if(x&&!a.includes(x))a.push(x); }); };
  push(o.roteirista); push(o.desenhista);
  (Array.isArray(o.volumes)?o.volumes:[]).forEach(v=>{ push(v.roteirista); push(v.desenhista); });
  return a; }
/* ---- record helpers (new schema + legacy fallback) ---- */
function tipoOf(o){ let t=o.tipo; if(t==='avulsa') t='avulso'; return t || (o.serie?'serie':'avulso'); }
function edOf(o){ return o.editora || o.editoraBR || ''; }
function isImp(o){ return o.origem ? o.origem==='importado' : !(o.editoraBR); }
function volsOf(o){ if(Array.isArray(o.volumes)) return o.volumes;
  if(Array.isArray(o.conteudo)) return o.conteudo.map(n=>({nome:n,imagem:null})); return []; }
function coverOf(o){ const t=tipoOf(o); const v=volsOf(o);
  if(t==='serie'){ if(v[0]&&v[0].imagem) return v[0].imagem; return o.imagem||null; }
  return o.imagem || (v[0]&&v[0].imagem) || null; }
/* aggregates over the ownable units (avulso = itself; box/série = each volume) */
function unitsOf(o){ return tipoOf(o)==='avulso' ? [o] : volsOf(o); }
function ownedCount(o){ return unitsOf(o).filter(u=>u.status==='biblioteca').length; }
function anyUrg(o){ return unitsOf(o).some(u=>u.urgencia && u.status!=='biblioteca'); }
function sumValor(o){ return unitsOf(o).reduce((s,u)=>s+(Number(u.valorPago)||0),0); }
function lidoCount(o){ return unitsOf(o).filter(u=>u.status==='biblioteca'&&u.lido).length; }
function avgNota(o){ const r=unitsOf(o).filter(u=>Number(u.nota)>0); return r.length? Math.round(r.reduce((s,u)=>s+u.nota,0)/r.length*2)/2 : 0; }
function statusMatch(o,want){ return unitsOf(o).some(u=>u.status===want); }
const GENRES=['Ação','Aventura','Super-herói','Ficção científica','Fantasia','Fantasia sombria','Terror','Suspense','Mistério','Policial','Noir','Drama','Romance','Comédia','Cotidiano','Distopia','Pós-apocalíptico','Faroeste','Guerra','Histórico','Biografia','Autobiografia','Jornalismo','Infantojuvenil','Sobrenatural','Cyberpunk','Steampunk','Space opera','Esporte','Erótico','LGBTQ+','Político','Mitologia','Artes marciais','Mecha','Isekai','Zumbi','Vampiros','Musical','Shonen','Shojo','Seinen','Josei'];
function tagsOf(o){ return Array.isArray(o.tags)?o.tags:[]; }
function parseTags(str){ return Array.from(new Set((str||'').split(',').map(t=>t.trim()).filter(Boolean))); }
function missingVols(o){ if(tipoOf(o)==='avulso') return [];
  return volsOf(o).map((v,i)=>({i:i+1,own:v.status==='biblioteca'})).filter(x=>!x.own).map(x=>x.i); }
function isReadingPile(o){ return unitsOf(o).some(u=>u.status==='biblioteca'&&!u.lido); }
function renderGenreSummary(){ const sel=editorDraft.genres||(editorDraft.genres=[]);
  $('#e_genresBtn').textContent = sel.length ? `Editar gêneros (${sel.length})` : 'Selecionar gêneros';
  $('#e_genresSel').innerHTML = sel.map(g=>`<span class="gtag">${esc(g)}</span>`).join(''); }
function gNorm(s){ return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function updateGenreCount(){ const n=(editorDraft.genres||[]).length; const el=$('#genreCount');
  if(el){ el.textContent=n; el.classList.toggle('zero',n===0); }
  const dn=$('#genreDoneN'); if(dn) dn.textContent=n?`(${n})`:''; }
function renderGenreGrid(){ const sel=editorDraft.genres||(editorDraft.genres=[]);
  const q=gNorm(($('#genreSearch')&&$('#genreSearch').value)||'');
  const list=GENRES.slice().sort((a,b)=>a.localeCompare(b,'pt'));
  const shown=q?list.filter(g=>gNorm(g).includes(q)):list;
  const grid=$('#genreGrid');
  grid.innerHTML = shown.length
    ? shown.map(g=>`<button type="button" class="gchip ${sel.includes(g)?'on':''}" data-g="${esc(g)}">${esc(g)}</button>`).join('')
    : `<div class="genre-empty">Nenhum gênero encontrado.</div>`;
  grid.querySelectorAll('.gchip').forEach(b=>b.onclick=()=>{ const g=b.dataset.g; const i=editorDraft.genres.indexOf(g);
    if(i>=0) editorDraft.genres.splice(i,1); else editorDraft.genres.push(g); b.classList.toggle('on'); updateGenreCount(); });
  updateGenreCount();
}
function openGenrePopup(){ const s=$('#genreSearch'); if(s) s.value=''; renderGenreGrid(); $('#genreOverlay').classList.add('on'); }
function closeGenrePopup(){ $('#genreOverlay').classList.remove('on'); renderGenreSummary(); }
function starsHTML(n){ n=Number(n)||0; let s=''; for(let i=1;i<=5;i++){ const cls=n>=i?'full':(n>=i-0.5?'half':''); s+=`<span class="s ${cls}">★</span>`; } return `<span class="stars">${s}</span>`; }

/* ---------- toast ---------- */
let toastT; function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),2600); }

/* ---------- filtering ---------- */
function passes(o){
  const f=state.filters;
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
    const hay=[o.nome,edOf(o),o.roteirista,o.desenhista,o.pais,o.resenha,tagsOf(o).join(' '),volsOf(o).map(v=>v.nome+' '+(v.roteirista||'')+' '+(v.desenhista||'')).join(' ')].join(' ').toLowerCase();
    if(!hay.includes(q)) return false;
  }
  return true;
}
function sortKey(o){
  switch(state.sort.by){
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
function cmp(a,b){ const ka=sortKey(a),kb=sortKey(b); let r = ka<kb?-1:ka>kb?1:0;
  if(r===0) r=(a.nome||'').localeCompare(b.nome||'','pt'); return state.sort.dir==='desc'?-r:r; }

/* ---------- stats ---------- */
function renderStats(){
  const O=state.obras;
  const units=O.flatMap(unitsOf);
  const owned=units.filter(u=>u.status==='biblioteca');
  const want=units.filter(u=>u.status!=='biblioteca');
  const invest=owned.reduce((s,u)=>s+(Number(u.valorPago)||0),0);
  const paid=owned.filter(u=>Number(u.valorPago)>0);
  const avg=paid.length?invest/paid.length:0;
  const lidos=owned.filter(u=>u.lido).length;
  const pctLido=owned.length?Math.round(lidos/owned.length*100):0;
  const rated=units.filter(u=>Number(u.nota)>0);
  const notaMed=rated.length?(rated.reduce((s,u)=>s+u.nota,0)/rated.length):0;

  const byEd={}; O.forEach(o=>{ const k=edOf(o)||(isImp(o)?'Importado (s/ editora)':'—'); byEd[k]=(byEd[k]||0)+1; });
  const byPais={}; O.forEach(o=>{ if(o.pais){ byPais[o.pais]=(byPais[o.pais]||0)+1; } });
  const invEd={}; O.forEach(o=>{ const v=sumValor(o); if(v>0){ const k=edOf(o)||'—'; invEd[k]=(invEd[k]||0)+v; } });
  const topEd=Object.entries(byEd).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const topP=Object.entries(byPais).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const topInv=Object.entries(invEd).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const maxE=Math.max(1,...topEd.map(x=>x[1])), maxP=Math.max(1,...topP.map(x=>x[1])), maxI=Math.max(1,...topInv.map(x=>x[1]));
  const bars=(arr,max)=>arr.map(([nm,v])=>`<div class="bar"><span class="nm">${esc(nm)}</span><span class="track"><span class="fill" style="width:${Math.round(v/max*100)}%"></span></span><span class="v">${v}</span></div>`).join('');
  const barsMoney=(arr,max)=>arr.map(([nm,v])=>`<div class="bar"><span class="nm">${esc(nm)}</span><span class="track"><span class="fill" style="width:${Math.round(v/max*100)}%"></span></span><span class="v">${fmtBRL(v)}</span></div>`).join('');

  const buckets=[]; for(let v=0.5; v<=5.0001; v+=0.5) buckets.push(Math.round(v*10)/10);
  const counts=buckets.map(b=>units.filter(u=>Number(u.nota)===b).length);
  const maxC=Math.max(1,...counts);
  const cols=buckets.map((b,i)=>{ const c=counts[i]; const h=Math.round(c/maxC*100);
    return `<div class="rh-col"><div class="rh-n">${c||''}</div><div class="rh-bar ${c?'':'zero'}" style="height:${c?h:2}%"></div></div>`; }).join('');
  const labels=buckets.map(b=>`<div class="rh-xl">${String(b)}</div>`).join('');

  $('#statsBody').innerHTML = `
    <div class="stats-grid">
      <div class="stat"><div class="n money">${fmtBRL(invest)}</div><div class="l">Investido no acervo</div></div>
      <div class="stat"><div class="n">${owned.length}</div><div class="l">Tenho</div></div>
      <div class="stat"><div class="n">${want.length}</div><div class="l">Quero</div></div>
      <div class="stat"><div class="n">${pctLido}%</div><div class="l">Lidos (${lidos}/${owned.length})</div></div>
    </div>
    <div class="stats-avgs">
      <div class="stat avg"><div class="n">${notaMed?notaMed.toFixed(1):'—'}${notaMed?'<span class="unit">★</span>':''}</div><div class="l">Nota média</div></div>
      <div class="stat avg"><div class="n">${fmtBRL(avg)}</div><div class="l">Valor médio (por item)</div></div>
    </div>
    <div class="ratehist">
      <h4>Distribuição de notas</h4>
      <div class="rh-cols">${cols}</div>
      <div class="rh-x">${labels}</div>
    </div>
    <div class="bars">
      <div><h4>Itens por editora</h4>${topEd.length?bars(topEd,maxE):'<span style="color:var(--ink-faint);font-size:12px">Sem dados ainda.</span>'}</div>
      <div><h4>Investimento por editora</h4>${topInv.length?barsMoney(topInv,maxI):'<span style="color:var(--ink-faint);font-size:12px">Sem valores pagos ainda.</span>'}</div>
      <div><h4>Por país</h4>${topP.length?bars(topP,maxP):'<span style="color:var(--ink-faint);font-size:12px">Sem país informado ainda.</span>'}</div>
    </div>`;
}

/* ---------- cards ---------- */
function coverHTML(o){
  const t=tipoOf(o);
  const urg = anyUrg(o)?`<span class="badge-urg" title="Urgente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>`:'';
  let tbadge='';
  if(t==='box') tbadge=`<span class="tbadge box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M3 8l9-5 9 5-9 5-9-5zM3 8v8l9 5 9-5V8"/></svg>Box ${volsOf(o).length||''}</span>`;
  else if(t==='serie') tbadge=`<span class="tbadge serie"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 5h10v14H4zM17 7h3v12h-3"/></svg>Série ${volsOf(o).length||''}</span>`;
  const cov=coverOf(o);
  let inner;
  if(cov){ inner=`<img src="${esc(cov)}" alt="" loading="lazy" onerror="this.replaceWith(document.createRange().createContextualFragment(placeholderStr(${o.id})))">`; }
  else inner = placeholderStr(o.id);
  const clickAttr = (t==='serie'||t==='box') ? `data-vols="${o.id}"` : `data-open="${o.id}"`;
  return `<div class="cover clickable" ${clickAttr}>${inner}${urg}${tbadge}</div>`;
}
function placeholderStr(id){
  const o=state.obras.find(x=>x.id===id)||{};
  const tint=tintFor(edOf(o)||o.nome);
  return `<div class="ph" style="background:linear-gradient(160deg,${tint},${tint}dd)"><div class="pub">${esc(edOf(o)||(isImp(o)?'Importado':''))}</div><div class="ini">${esc(initials(o.nome))}</div><div class="rule"></div><div class="ttl">${esc(o.nome||'')}</div></div>`;
}
function cardHTML(o,i){
  const t=tipoOf(o);
  const multi = t==='box'||t==='serie';
  const total = multi ? unitsOf(o).length : 1;
  const owned = multi ? ownedCount(o) : (o.status==='biblioteca'?1:0);
  let statusPill;
  if(multi){
    statusPill = owned===0 ? '<span class="pill wl">Quero</span>'
      : owned>=total ? '<span class="pill bib">Tenho</span>'
      : `<span class="pill bib">Tenho ${owned}/${total}</span>`;
  } else statusPill = o.status==='biblioteca' ? '<span class="pill bib">Tenho</span>' : '<span class="pill wl">Quero</span>';
  const impPill = isImp(o) ? '<span class="pill imp">Importado</span>' : '';
  let extras='';
  const val = multi ? sumValor(o) : (o.status==='biblioteca'?Number(o.valorPago)||0:0);
  const nota = multi ? avgNota(o) : (o.status==='biblioteca'?o.nota:0);
  const lidos = multi ? lidoCount(o) : (o.status==='biblioteca'&&o.lido?1:0);
  if(multi){ if(lidos) extras+=`<span class="pill lido">${lidos} lido(s)</span>`; }
  else if(o.status==='biblioteca'&&o.lido) extras+='<span class="pill lido">Lido</span>';
  if(nota) extras+=starsHTML(nota);
  if(val>0) extras+=`<span class="price">${fmtBRL(val)}</span>`;
  const eyebrow = edOf(o) ? `<div class="ed">${esc(edOf(o))}</div>` : '';
  let sub;
  if(multi){ const v=volsOf(o); const names=v.map(x=>x.nome).filter(Boolean);
    sub = `${v.length} ${t==='box'?'livro(s)':'volume(s)'}${names.length?': '+esc(names.join(', ')):''}`; }
  else sub = `${esc(o.roteirista||o.desenhista||'—')}`;
  // series/box progress + missing volumes
  let progress='';
  if(multi && total>0){ const pct=Math.round(owned/total*100); const miss=missingVols(o);
    const missTxt = (owned<total && miss.length) ? `<span class="miss">faltam: ${miss.slice(0,8).join(', ')}${miss.length>8?'…':''}</span>` : (owned>=total?'<span class="complete">completa ✓</span>':'');
    progress = `<div class="prog"><div class="prog-bar"><span style="width:${pct}%"></span></div>${missTxt}</div>`;
  }
  const noteIcon = (o.resenha&&o.resenha.trim())?'<span class="noteic" title="Tem anotação">✎</span>':'';
  return `<div class="card" style="animation-delay:${Math.min((i||0)*22,240)}ms">
    ${coverHTML(o)}
    <div class="cbody clickable" data-open="${o.id}">
      ${eyebrow}
      <div class="t">${esc(o.nome)}${noteIcon}</div>
      <div class="a">${sub}</div>
      ${progress}
      <div class="meta">${statusPill}${impPill}${extras}</div>
    </div></div>`;
}

/* ---------- ordering (flat, continuous — no series grouping) ---------- */
function sortedList(list){
  const arr=list.slice();
  arr.sort((a,b)=>{
    let r=cmp(a,b);
    // keep volumes of the same series next to each other and in volume order when tied
    if(r===0 && a.serie && a.serie===b.serie) r=(Number(a.volume)||0)-(Number(b.volume)||0);
    return r;
  });
  return arr;
}

/* ---------- list view ---------- */
function listHTML(arr){
  const rows=arr.map(o=>{
    const t=tipoOf(o); const multi=t==='box'||t==='serie';
    const cov=coverOf(o);
    const thumb = cov?`<img class="thumb" src="${esc(cov)}" alt="">`:`<div class="thumb" style="background:${tintFor(edOf(o)||o.nome)};display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--serif);font-size:11px">${esc(initials(o.nome))}</div>`;
    const urg = anyUrg(o)?`<span class="rowstamp" title="Urgente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>`:'';
    const total=multi?unitsOf(o).length:1, owned=multi?ownedCount(o):(o.status==='biblioteca'?1:0);
    const statusLbl = multi ? (owned===0?'<span class="pill wl">Quero</span>':owned>=total?'<span class="pill bib">Tenho</span>':`<span class="pill bib">Tenho ${owned}/${total}</span>`)
      : (o.status==='biblioteca'?'<span class="pill bib">Tenho</span>':'<span class="pill wl">Quero</span>');
    const statusCell = statusLbl + (isImp(o)?'<span class="pill imp row">Importado</span>':'');
    const tipoCell = t==='box'?'<span class="tg-box">Box</span>':t==='serie'?`<span class="tg-box" style="background:#3f5a46">Série</span>`:'—';
    const vN = multi?` <span style="color:var(--ink-faint)">${total}v</span>`:'';
    const rot = multi ? (Array.from(new Set(volsOf(o).map(v=>v.roteirista).filter(Boolean))).join(', ')||'—') : (o.roteirista||'—');
    const des = multi ? (Array.from(new Set(volsOf(o).map(v=>v.desenhista).filter(Boolean))).join(', ')||'—') : (o.desenhista||'—');
    const val = multi?sumValor(o):(Number(o.valorPago)>0?Number(o.valorPago):0);
    const nota = multi?avgNota(o):(o.nota||0);
    const lidoCell = multi ? (owned?`${lidoCount(o)}/${owned}`:'—') : (o.status==='biblioteca'?(o.lido?'Sim':'Não'):'—');
    return `<tr data-open="${o.id}">
        <td>${thumb}</td>
        <td class="tt">${esc(o.nome)}${urg}${tagsOf(o).length?`<div class="lst-tags">${tagsOf(o).map(t=>`<span class="ltag">${esc(t)}</span>`).join('')}</div>`:''}</td>
        <td>${esc(rot)}</td>
        <td>${esc(des)}</td>
        <td>${esc(edOf(o)||(isImp(o)?'Importado':'—'))}</td>
        <td>${esc(o.pais||'—')}</td>
        <td>${tipoCell}${vN}</td>
        <td>${statusCell}</td>
        <td>${lidoCell}</td>
        <td>${nota?starsHTML(nota):'—'}</td>
        <td>${val>0?fmtBRL(val):'—'}</td>
      </tr>`;
  });
  return `<div class="tablewrap"><table><thead><tr>
     <th></th><th>Título</th><th>Roteirista</th><th>Desenhista</th><th>Editora</th><th>País</th><th>Tipo</th><th>Status</th><th>Lido</th><th>Nota</th><th>Valor</th>
   </tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

/* ---------- filter count + popups ---------- */
function updateFilterCount(){
  const f=state.filters; let n=0;
  if(f.status!=='todos')n++; if(f.tipo)n++; if(f.editora)n++; if(f.pais)n++; if(f.autor)n++; if(f.genero)n++;
  if(f.importado)n++; if(f.urgencia)n++; if(f.leitura!=='todos')n++;
  const b=$('#filterCount'); b.textContent=n; b.classList.toggle('on',n>0);
  $('#btnFilters').classList.toggle('active',n>0);
}
function openFilters(){ $('#filtersOverlay').classList.add('on'); }
function closeFilters(){ $('#filtersOverlay').classList.remove('on'); }
function openStats(){ $('#statsOverlay').classList.add('on'); }
function closeStats(){ $('#statsOverlay').classList.remove('on'); }

/* ---------- main render ---------- */
function render(){
  renderStats();
  updateFilterCount();
  markChangedFilters();
  updateFooter();
  const arr=sortedList(state.obras.filter(passes));
  const total=arr.length;
  // volta pra página 1 quando o conjunto filtrado muda
  const sig=JSON.stringify([state.filters,state.sort]);
  if(sig!==_pgSig){ state.page=1; _pgSig=sig; }
  const all = state.pageSize>=99999;
  const totalPages = all ? 1 : Math.max(1, Math.ceil(total/state.pageSize));
  if(state.page>totalPages) state.page=totalPages;
  if(state.page<1) state.page=1;
  const start = all ? 0 : (state.page-1)*state.pageSize;
  const pageArr = all ? arr : arr.slice(start, start+state.pageSize);
  const nS=arr.filter(o=>tipoOf(o)==='serie').length, nB=arr.filter(o=>tipoOf(o)==='box').length;
  $('#count').textContent = `${total} ${total===1?'item':'itens'}${nS?` · ${nS} série(s)`:''}${nB?` · ${nB} box(es)`:''}`;
  const c=$('#content');
  if(!total){ c.innerHTML=`<div class="empty"><div class="big">Nada por aqui</div>Nenhuma obra corresponde aos filtros. <br>Ajuste a busca ou <a href="#" id="emptyNew">cadastre uma nova obra</a>.</div>`;
    const en=$('#emptyNew'); if(en) en.onclick=e=>{e.preventDefault();openEditor(null);}; return; }
  const body = state.view==='galeria'
    ? `<div class="grid">${pageArr.map(cardHTML).join('')}</div>`
    : listHTML(pageArr);
  c.innerHTML = body + pagerHTML(total, totalPages, start, pageArr.length);
  c.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>openEditor(Number(el.dataset.open)));
  c.querySelectorAll('[data-vols]').forEach(el=>el.onclick=e=>{ e.stopPropagation(); openVols(Number(el.dataset.vols)); });
  wirePager(c);
}
function pageList(cur,tot){ const out=[];
  if(tot<=7){ for(let i=1;i<=tot;i++)out.push(i); return out; }
  out.push(1);
  let s=Math.max(2,cur-1), e=Math.min(tot-1,cur+1);
  if(cur<=3){ s=2; e=4; }
  if(cur>=tot-2){ s=tot-3; e=tot-1; }
  if(s>2)out.push('…');
  for(let i=s;i<=e;i++)out.push(i);
  if(e<tot-1)out.push('…');
  out.push(tot);
  return out;
}
function pagerHTML(total,totalPages,start,shown){
  const p=state.page, all=state.pageSize>=99999;
  const nums = (!all && totalPages>1) ? `
    <div class="pgrow">
      <button class="btn ghost pgnav" data-pg="prev" ${p<=1?'disabled':''}>‹ Anterior</button>
      <div class="pgnums">${pageList(p,totalPages).map(n=> n==='…'
        ? `<span class="pgell">…</span>`
        : `<button class="pgnum ${n===p?'on':''}" data-pg="${n}">${n}</button>`).join('')}</div>
      <button class="btn ghost pgnav" data-pg="next" ${p>=totalPages?'disabled':''}>Próxima ›</button>
    </div>` : '';
  const sizes=[20,40,80,'Todas'];
  const meta = `
    <div class="pgmeta">
      <span>${total?`${start+1}–${start+shown}`:'0'} de ${total}</span>
      <label class="pgsizewrap">Por página
        <select class="pgsize" id="pgSize">${sizes.map(v=>{ const val=v==='Todas'?99999:v;
          return `<option value="${val}" ${state.pageSize===val?'selected':''}>${v}</option>`; }).join('')}</select>
      </label>
    </div>`;
  return `<div class="pager">${nums}${meta}</div>`;
}
function scrollCollectionTop(){ const t=$('.toolbar'); if(t) window.scrollTo({top: t.getBoundingClientRect().top+window.scrollY-90, behavior:'smooth'}); }
function wirePager(c){
  c.querySelectorAll('[data-pg]').forEach(b=>{ if(b.hasAttribute('disabled'))return; b.onclick=()=>{ const v=b.dataset.pg;
    if(v==='prev') state.page=Math.max(1,state.page-1);
    else if(v==='next') state.page=state.page+1;
    else state.page=Number(v);
    render(); scrollCollectionTop(); }; });
  const sz=c.querySelector('#pgSize'); if(sz) sz.onchange=()=>{ state.pageSize=Number(sz.value)||40; state.page=1;
    try{ localStorage.setItem('gibiteca_pagesize', state.pageSize); }catch(e){} render(); };
}

/* ---------- populate selects & datalists ---------- */
function updateFooter(){ const el=$('#footStats'); if(!el) return;
  const O=state.obras;
  const obras=O.length;
  const sb=O.filter(o=>{const t=tipoOf(o);return t==='serie'||t==='box';}).length;
  const tenho=O.filter(o=>statusMatch(o,'biblioteca')).length;
  const generos=new Set(O.flatMap(tagsOf)).size;
  const stat=(n,l)=>`<div class="foot-stat"><span class="n">${n}</span><span class="l">${l}</span></div>`;
  el.innerHTML = stat(obras,'obras') + stat(sb,'séries / boxes') + stat(tenho,'na estante') + stat(generos,'gêneros');
}
function markChangedFilters(){ const f=state.filters;
  const setField=(id,on)=>{ const el=$(id); const fl=el&&el.closest('.field'); if(fl) fl.classList.toggle('changed',!!on); };
  setField('#fTipo', !!f.tipo); setField('#fEditora', !!f.editora); setField('#fPais', !!f.pais);
  setField('#fAutor', !!f.autor); setField('#fGenero', !!f.genero);
  setField('#leituraSeg', f.leitura && f.leitura!=='todos');
}
function refreshOptions(){
  const eds=Array.from(new Set(state.obras.map(edOf).filter(Boolean).concat(state.editoras||[]))).sort((a,b)=>a.localeCompare(b,'pt'));
  const paises=Array.from(new Set(state.obras.map(o=>o.pais).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pt'));
  const autores=Array.from(new Set(state.obras.flatMap(authorsOf))).sort((a,b)=>a.localeCompare(b,'pt'));
  const tags=Array.from(new Set(state.obras.flatMap(tagsOf))).sort((a,b)=>a.localeCompare(b,'pt'));
  const tagSug=Array.from(new Set(tags.concat(GENRES))).sort((a,b)=>a.localeCompare(b,'pt'));
  $('#fEditora').innerHTML = `<option value="">Todas</option>`+eds.map(e=>`<option>${esc(e)}</option>`).join('');
  $('#fPais').innerHTML = `<option value="">Todos</option>`+paises.map(p=>`<option>${esc(p)}</option>`).join('');
  $('#fAutor').innerHTML = `<option value="">Todos</option>`+autores.map(a=>`<option>${esc(a)}</option>`).join('');
  $('#fGenero').innerHTML = `<option value="">Todos</option>`+tags.map(t=>`<option>${esc(t)}</option>`).join('');
  $('#dlEditoras').innerHTML = eds.map(e=>`<option value="${esc(e)}">`).join('');
  $('#dlAutores').innerHTML = autores.map(a=>`<option value="${esc(a)}">`).join('');
  $('#dlPaises').innerHTML = paises.map(p=>`<option value="${esc(p)}">`).join('');
  $('#dlTags').innerHTML = tagSug.map(t=>`<option value="${esc(t)}">`).join('');
  $('#fEditora').value=state.filters.editora; $('#fPais').value=state.filters.pais; $('#fAutor').value=state.filters.autor;
  $('#fGenero').value=state.filters.genero||''; $('#fTipo').value=state.filters.tipo||'';
}

/* ---------- pile & theme ---------- */

/* ---------- editor ---------- */
function setSwitch(sel,val){ $$(sel+' button').forEach(b=>b.classList.toggle('on', b.dataset.v==String(val))); }
function paintStars(n){ n=Number(n)||0; $$('#e_stars .st').forEach(s=>{ const v=Number(s.dataset.n);
  s.classList.toggle('full', n>=v); s.classList.toggle('half', n>=v-0.5 && n<v); }); }
function money_toNumber(str){ const digits=(str||'').replace(/\D/g,''); return digits?parseInt(digits,10)/100:0; }
function money_format(n){ return n?fmtBRL(n):''; }

function applyTipoUI(mode){
  const isMulti = mode==='box'||mode==='serie';
  $('#lblTitulo').textContent = mode==='box'?'Título do box':mode==='serie'?'Título da série':'Título';
  $('#e_nome').placeholder = mode==='box'?'Nome do box / coleção':mode==='serie'?'Nome da série':'Nome da obra';
  $('#multiBox').style.display = isMulti?'block':'none';
  $('#lblQtd').textContent = mode==='box'?'Quantidade de livros no box':'Quantidade de volumes';
  $('#capaField').style.display = (mode==='serie')?'none':'';         // série: capa é por volume
  $$('.avulsoOnly').forEach(el=>{ el.style.display = isMulti?'none':''; });
  if(isMulti){ setVolsCount($('#e_qtd').value || (editorDraft.vols||[]).length); renderVols(); }
}

/* ---- per-volume model ---- */
function blankVol(i){ return {nome:'Vol. '+(i+1), imagem:null, roteirista:'', desenhista:'',
  status:'wishlist', urgencia:false, valorPago:0, lido:false, nota:0, _open:false}; }
function normVol(v,i,parent){ return {
  nome: (v && v.nome!=null) ? v.nome : ('Vol. '+(i+1)),
  imagem: (v&&v.imagem)||null,
  roteirista:(v&&v.roteirista)||'', desenhista:(v&&v.desenhista)||'',
  status:(v&&v.status)|| (parent&&parent.status) || 'wishlist',
  urgencia:!!(v&&v.urgencia), valorPago:(v&&v.valorPago)||0, lido:!!(v&&v.lido), nota:(v&&v.nota)||0, _open:false }; }
function setVolsCount(n){ n=Math.max(0,Math.min(80,Number(n)||0));
  const v=editorDraft.vols||(editorDraft.vols=[]);
  while(v.length<n) v.push(blankVol(v.length));
  if(v.length>n) v.length=n;
}
function volField(i,f,label,inner,full){ return `<div class="vf ${full?'vfull':''}"><div class="vf-l"><label>${label}</label>`+
  `<button type="button" class="copyall" data-i="${i}" data-f="${f}" title="Copiar este valor para todos os volumes">copiar p/ todos</button></div>${inner}</div>`; }
function volPanelHTML(v,i,withCover){
  const owned = v.status==='biblioteca';
  const cov = withCover ? `<div class="vp-cover" data-ci="${i}">${v.imagem?`<img src="${esc(v.imagem)}">`:'<span class="cadd">+ capa</span>'}</div>` : '';
  let body='';
  if(v._open){
    body = `<div class="vp-body">
      ${volField(i,'roteirista','Autor / Roteirista',`<input type="text" data-i="${i}" data-f="roteirista" value="${esc(v.roteirista||'')}" list="dlAutores">`)}
      ${volField(i,'desenhista','Desenhista / Arte finalista / Colorista',`<input type="text" data-i="${i}" data-f="desenhista" value="${esc(v.desenhista||'')}" list="dlAutores">`)}
      ${volField(i,'status','Status',`<div class="switch mini vstatus" data-i="${i}"><button type="button" data-v="wishlist" class="${!owned?'on':''}">Quero</button><button type="button" data-v="biblioteca" class="${owned?'on':''}">Tenho</button></div>`)}
      ${!owned?volField(i,'urgencia','Urgência',`<label class="urgchk mini ${v.urgencia?'on':''}"><input type="checkbox" data-i="${i}" data-f="urgencia" ${v.urgencia?'checked':''}> Urgente ⚠️</label>`):''}
      ${owned?volField(i,'valorPago','Valor pago',`<input type="text" data-i="${i}" data-f="valorPago" inputmode="numeric" value="${v.valorPago?fmtBRL(v.valorPago):''}" placeholder="R$ 0,00">`):''}
      ${owned?volField(i,'lido','Lido',`<div class="switch mini vlido" data-i="${i}"><button type="button" data-v="1" class="${v.lido?'on':''}">Sim</button><button type="button" data-v="0" class="${!v.lido?'on':''}">Não</button></div>`):''}
      ${owned&&v.lido?volField(i,'nota','Nota',`<div class="editstars mini vstars" data-i="${i}">${[1,2,3,4,5].map(n=>`<span class="st ${v.nota>=n?'full':(v.nota>=n-0.5?'half':'')}" data-n="${n}">★</span>`).join('')}<button type="button" class="clr vclr" data-i="${i}">limpar</button></div>`):''}
    </div>`;
  }
  const tag = owned?'<span class="vp-tag tenho">Tenho</span>':'<span class="vp-tag quero">Quero</span>';
  return `<div class="vp ${v._open?'open':''}">
    <div class="vp-head" data-toggle="${i}">
      ${cov}<span class="vp-num">${i+1}</span>
      <input type="text" class="vp-nome" data-i="${i}" data-f="nome" value="${esc(v.nome||'')}" placeholder="Vol. ${i+1}">
      ${tag}<span class="vp-chev">${v._open?'▲':'▼'}</span>
    </div>${body}</div>`;
}
function renderVols(){
  const withCover = editorDraft.tipo==='serie';
  $('#e_children').innerHTML = (editorDraft.vols||[]).map((v,i)=>volPanelHTML(v,i,withCover)).join('');
  bindVols();
}
function paintVolStars(sw,n){ sw.querySelectorAll('.st').forEach(s=>{ const v=Number(s.dataset.n);
  s.classList.toggle('full',n>=v); s.classList.toggle('half',n>=v-0.5&&n<v); }); }
function copyToAll(i,f){ const val=editorDraft.vols[i][f]; editorDraft.vols.forEach(v=>{ v[f]=val; });
  renderVols(); toast('Copiado para todos os volumes.'); }
let volFileInput=null;
function pickVolCover(i){ if(!volFileInput){ volFileInput=document.createElement('input'); volFileInput.type='file'; volFileInput.accept='image/*'; }
  volFileInput.onchange=()=>{ const f=volFileInput.files[0]; if(!f) return;
    if(f.size>3.4*1024*1024){ toast('Imagem grande demais (máx ~3MB).'); return; }
    const r=new FileReader(); r.onload=()=>{ editorDraft.vols[i].imagem=r.result; renderVols(); }; r.readAsDataURL(f); volFileInput.value=''; };
  volFileInput.click(); }
function bindVols(){
  $$('#e_children .vp-head').forEach(h=>h.onclick=e=>{ if(e.target.closest('input,button,.vp-cover')) return;
    const i=Number(h.dataset.toggle); editorDraft.vols[i]._open=!editorDraft.vols[i]._open; renderVols(); });
  $$('#e_children input[data-f]').forEach(inp=>{ const i=Number(inp.dataset.i), f=inp.dataset.f;
    if(f==='urgencia'){ inp.onchange=()=>{ editorDraft.vols[i].urgencia=inp.checked; inp.closest('.urgchk').classList.toggle('on',inp.checked); }; return; }
    if(f==='valorPago'){ inp.oninput=()=>{ inp.value=money_format(money_toNumber(inp.value)); editorDraft.vols[i].valorPago=money_toNumber(inp.value); }; return; }
    inp.oninput=()=>{ editorDraft.vols[i][f]=inp.value; if(f==='nome'){} }; });
  $$('#e_children .vstatus').forEach(sw=>{ const i=Number(sw.dataset.i); sw.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    editorDraft.vols[i].status=b.dataset.v; if(b.dataset.v==='biblioteca') editorDraft.vols[i].urgencia=false; renderVols(); }); });
  $$('#e_children .vlido').forEach(sw=>{ const i=Number(sw.dataset.i); sw.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    editorDraft.vols[i].lido=b.dataset.v==='1'; if(!editorDraft.vols[i].lido) editorDraft.vols[i].nota=0; renderVols(); }); });
  $$('#e_children .vstars').forEach(sw=>{ const i=Number(sw.dataset.i);
    sw.querySelectorAll('.st').forEach(s=>s.onclick=()=>{ const v=Number(s.dataset.n); const cur=editorDraft.vols[i].nota;
      editorDraft.vols[i].nota=(cur===v)?v-0.5:v; paintVolStars(sw,editorDraft.vols[i].nota); });
    sw.querySelector('.vclr').onclick=()=>{ editorDraft.vols[i].nota=0; paintVolStars(sw,0); }; });
  $$('#e_children .vp-cover').forEach(el=>el.onclick=()=>pickVolCover(Number(el.dataset.ci)));
  $$('#e_children .copyall').forEach(b=>b.onclick=()=>copyToAll(Number(b.dataset.i),b.dataset.f));
}
function setTipo(t){ editorDraft.tipo=t; setSwitch('#e_tipo',t); applyTipoUI(t); }
function setOrigem(v){ editorDraft.origem=v; setSwitch('#e_origem',v);
  $('#lblEditora').textContent = v==='importado'?'Editora gringa':'Editora no Brasil';
  $('#lblPais').textContent = v==='importado'?'País da edição':'País de origem'; }
function currentImage(){ return editorDraft.img||null; }

function openEditor(id){
  editingId=id;
  const o = id!=null ? state.obras.find(x=>x.id===id) : null;
  $('#mTitle').textContent = o?'Editar obra':'Nova obra';
  $('#mDelete').style.display = o?'inline-flex':'none';
  const tipo = o ? tipoOf(o) : 'avulso';
  const origem = o ? (isImp(o)?'importado':'nacional') : 'nacional';
  const rawVols = volsOf(o||{});
  editorDraft = { img:o?.imagem||'', imgMode:'link', urg:o?.urgencia?1:0,
    status:o?.status||'wishlist', lido:o?.lido?1:0, nota:o?.nota||0, tipo, origem,
    vols: rawVols.map((v,i)=>normVol(v,i,o)) };
  $('#e_nome').value=o?.nome||''; $('#e_rot').value=o?.roteirista||''; $('#e_des').value=o?.desenhista||'';
  $('#e_editora').value=edOf(o||{}); $('#e_pais').value=o?.pais||'';
  editorDraft.genres=(Array.isArray(o?.tags)?o.tags.slice():[]); $('#e_resenha').value=o?.resenha||''; renderGenreSummary();
  $('#e_valor').value = o&&Number(o.valorPago)>0 ? money_format(o.valorPago) : '';
  $('#e_urg').checked = editorDraft.urg===1; $('#e_urgchk').classList.toggle('on',editorDraft.urg===1);
  setSwitch('#e_status',editorDraft.status); setSwitch('#e_lido',editorDraft.lido); paintStars(editorDraft.nota);
  setOrigem(origem); setSwitch('#e_tipo',tipo);
  if(tipo==='box'||tipo==='serie'){ $('#e_qtd').value=editorDraft.vols.length||''; }
  else { $('#e_qtd').value=''; $('#e_children').innerHTML=''; }
  applyTipoUI(tipo);
  updateOwnedBox(); updatePreview();
  $('#dupWarn').classList.remove('on');
  $('#overlay').classList.add('on');
  setTimeout(()=>$('#e_nome').focus(),50);
}
function closeEditor(){ $('#overlay').classList.remove('on'); editingId=null; }
function updateOwnedBox(){
  const owned = editorDraft.status==='biblioteca';
  $('#ownedBox').classList.toggle('hidden', !owned);
  $('#urgFld').style.display = owned ? 'none' : '';
  if(owned){ editorDraft.urg=0; $('#e_urg').checked=false; $('#e_urgchk').classList.remove('on'); }
  updateNotaVis();
}
function updateNotaVis(){ const el=$('#notaFld'); if(el) el.style.display = (editorDraft.status==='biblioteca' && editorDraft.lido===1) ? '' : 'none'; }
function updatePreview(){ const img=editorDraft.img; const prev=$('#e_prev');
  if(img){ prev.src=img; prev.style.display='block'; } else { prev.removeAttribute('src'); } }

function checkDup(){
  const nome=$('#e_nome').value.trim().toLowerCase(), ed=$('#e_editora').value.trim().toLowerCase();
  const dup=state.obras.find(o=>o.id!==editingId && (o.nome||'').trim().toLowerCase()===nome && (edOf(o)||'').trim().toLowerCase()===ed);
  $('#dupWarn').classList.toggle('on', !!dup && !!nome);
  if(dup) $('#dupWarn').textContent = `Já existe "${dup.nome}"${edOf(dup)?(' ('+edOf(dup)+')'):''} na coleção. Você pode salvar mesmo assim.`;
}
function saveEditor(){
  const tipo=editorDraft.tipo;
  const title=$('#e_nome').value.trim();
  if(!title){ toast(tipo==='box'?'Dê um título ao box.':tipo==='serie'?'Dê um título à série.':'Dê um título à obra.'); $('#e_nome').focus(); return; }
  const origem=editorDraft.origem, editora=$('#e_editora').value.trim(), pais=$('#e_pais').value.trim();
  const tags=(editorDraft.genres||[]).slice(); const resenha=$('#e_resenha').value.trim();
  const regEd=()=>{ if(editora && !(state.editoras||[]).includes(editora)) (state.editoras=state.editoras||[]).push(editora); };
  const rec = editingId!=null ? state.obras.find(x=>x.id===editingId) : {id:nextId()};
  ['editoraBR','editoraOriginal','serie','volume','serieTotal','conteudo'].forEach(k=>{ if(k in rec) delete rec[k]; });
  if(tipo==='box'||tipo==='serie'){
    const withCover = tipo==='serie';
    const volumes=(editorDraft.vols||[]).map((v,i)=>{ const owned=v.status==='biblioteca'; return {
      nome:(v.nome&&v.nome.trim())||('Vol. '+(i+1)), imagem: withCover?(v.imagem||null):null,
      roteirista:v.roteirista||'', desenhista:v.desenhista||'',
      status:v.status||'wishlist', urgencia: !owned && !!v.urgencia,
      valorPago: owned?(v.valorPago||0):0, lido: owned&&!!v.lido, nota: owned?(v.nota||0):0 }; });
    Object.assign(rec, { nome:title, tipo, origem, editora, pais, tags, resenha, volumes,
      imagem: tipo==='serie' ? (volumes[0]&&volumes[0].imagem||null) : currentImage(),
      roteirista:'', desenhista:'', status:'wishlist', urgencia:false, valorPago:0, lido:false, nota:0 });
  } else {
    Object.assign(rec, { nome:title, tipo:'avulso', origem, editora, pais, tags, resenha, imagem:currentImage(),
      roteirista:$('#e_rot').value.trim(), desenhista:$('#e_des').value.trim(),
      status:editorDraft.status, urgencia: editorDraft.status!=='biblioteca' && editorDraft.urg===1,
      valorPago: editorDraft.status==='biblioteca'?money_toNumber($('#e_valor').value):0,
      lido: editorDraft.status==='biblioteca' && editorDraft.lido===1,
      nota: editorDraft.status==='biblioteca' ? editorDraft.nota : 0 });
    if('volumes' in rec) delete rec.volumes;
  }
  if(editingId==null) state.obras.push(rec);
  regEd(); save(); refreshOptions(); render(); closeEditor();
  toast(editingId==null?(tipo==='box'?'Box adicionado.':tipo==='serie'?'Série adicionada.':'Obra adicionada.'):'Alterações salvas.');
}
function deleteObra(){
  const o=state.obras.find(x=>x.id===editingId); if(!o) return;
  if(!confirm(`Excluir "${o.nome}" da coleção?`)) return;
  state.obras=state.obras.filter(x=>x.id!==editingId);
  save(); refreshOptions(); render(); closeEditor(); toast('Excluído.');
}

/* ---------- volumes popup ---------- */
let volsCurrentId=null;
function openVols(id){
  const o=state.obras.find(x=>x.id===id); if(!o) return;
  volsCurrentId=id;
  $('#volsTitle').textContent = o.nome;
  const vols=volsOf(o);
  const owned=vols.filter(v=>v.status==='biblioteca').length, tot=vols.length;
  const miss=missingVols(o);
  const summary = tot? `<div class="vols-summary">${owned>=tot?'<b>Coleção completa</b> ✓':`Tenho <b>${owned}</b> de <b>${tot}</b>`}${(owned<tot&&miss.length)?` · faltam: ${miss.join(', ')}`:''}<div class="vols-prog"><span style="width:${Math.round(owned/Math.max(1,tot)*100)}%"></span></div></div>`:'';
  $('#volsBody').innerHTML = summary + `<div class="vols-grid">` + (vols.map((v,i)=>{
    const cover = v.imagem?`<img src="${esc(v.imagem)}" alt="">`:`<div class="vph" style="background:${tintFor(v.nome||o.nome)}">${esc(initials(v.nome||o.nome))}</div>`;
    const st = v.status==='biblioteca'?'<span class="pill bib">Tenho</span>':'<span class="pill wl">Quero</span>';
    const meta = `<div class="vmeta">${st}${Number(v.nota)>0?starsHTML(v.nota):''}</div>`;
    return `<div class="vol-item"><div class="vcover"><span class="vnum">${i+1}</span>${cover}</div><div class="vname">${esc(v.nome||'—')}</div>${meta}</div>`;
  }).join('') || '<div style="padding:10px;color:var(--ink-faint)">Sem volumes cadastrados.</div>') + `</div>`;
  $('#volsOverlay').classList.add('on');
}
function closeVols(){ $('#volsOverlay').classList.remove('on'); }

/* ---------- import / export ---------- */
function download(name,text,type){ const b=new Blob([text],{type:type||'text/plain'}); const u=URL.createObjectURL(b);
  const a=document.createElement('a'); a.href=u; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(u),1000); }
function exportJSON(){ download('gibiteca-backup-'+new Date().toISOString().slice(0,10)+'.json',
  JSON.stringify({version:1,exported:new Date().toISOString(),obras:state.obras,editoras:state.editoras},null,2),'application/json');
  toast('Backup baixado.'); }
function importJSON(file){ const r=new FileReader(); r.onload=()=>{ try{ const d=JSON.parse(r.result);
    if(!Array.isArray(d.obras)) throw 0;
    if(!confirm(`Restaurar ${d.obras.length} obras? Isso substitui a coleção atual.`)) return;
    state.obras=d.obras; state.editoras=d.editoras||state.editoras; save(); refreshOptions(); render(); toast('Backup restaurado.');
  }catch(e){ toast('Arquivo inválido.'); } }; r.readAsText(file); }
function exportWishlistTxt(){
  const wl=state.obras.filter(o=>o.status==='wishlist').sort((a,b)=>(b.urgencia?1:0)-(a.urgencia?1:0)||(a.nome).localeCompare(b.nome,'pt'));
  const lines=wl.map(o=>`${o.urgencia?'⚠ ':'• '}${o.nome}${o.editoraBR?(' — '+o.editoraBR):' — [importado]'}${o.roteirista?(' ('+o.roteirista+')'):''}`);
  download('lista-de-desejos.txt', `LISTA DE DESEJOS — ${wl.length} obras\n${new Date().toLocaleDateString('pt-BR')}\n\n`+lines.join('\n'),'text/plain');
  toast('Wishlist exportada.');
}

/* ---------- events ---------- */
function bind(){
  $('#btnNew').onclick=()=>openEditor(null);
  $('#mClose').onclick=$('#mCancel').onclick=closeEditor;
  $('#mSave').onclick=saveEditor;
  $('#mDelete').onclick=deleteObra;
  $('#overlay').onclick=e=>{ if(e.target===$('#overlay')) closeEditor(); };
  document.addEventListener('keydown',e=>{ if(e.key!=='Escape')return;
    if($('#genreOverlay').classList.contains('on')) closeGenrePopup();
    else if($('#searchOverlay').classList.contains('on')) $('#searchOverlay').classList.remove('on');
    else if($('#volsOverlay').classList.contains('on')) closeVols();
    else if($('#overlay').classList.contains('on')) closeEditor();
    else if($('#filtersOverlay').classList.contains('on')) closeFilters();
    else if($('#statsOverlay').classList.contains('on')) closeStats();
    else if($('#cloudOverlay').classList.contains('on')) closeCloud();
    else if($('#tutorialOverlay').classList.contains('on')) closeTutorial();
    else if($('#bulkOverlay').classList.contains('on')) closeBulk();
  });

  $('#q').addEventListener('input',e=>{ state.filters.q=e.target.value; const h=$('#qHeader'); if(h)h.value=e.target.value; render(); });
  const qh=$('#qHeader'); if(qh) qh.addEventListener('input',e=>{ state.filters.q=e.target.value; $('#q').value=e.target.value; render(); });
  const logo=$('.brand img'); if(logo){ logo.style.cursor='pointer'; logo.title='Voltar ao topo';
    logo.onclick=()=>window.scrollTo({top:0,behavior:'smooth'}); }
  const stog=$('#searchToggle'); if(stog) stog.onclick=()=>{ $('#searchOverlay').classList.add('on'); setTimeout(()=>$('#q').focus(),40); };
  $('#searchClose').onclick=()=>$('#searchOverlay').classList.remove('on');
  $('#searchOverlay').onclick=e=>{ if(e.target===$('#searchOverlay')) $('#searchOverlay').classList.remove('on'); };
  $('#q').addEventListener('keydown',e=>{ if(e.key==='Enter') $('#searchOverlay').classList.remove('on'); });
  $('#statusSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.filters.status=b.dataset.s;
    $$('#statusSeg button').forEach(x=>x.classList.toggle('on',x===b)); render(); });
  $('#viewToggle').querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.view=b.dataset.v;
    $$('#viewToggle button').forEach(x=>x.classList.toggle('on',x===b)); render(); });

  $('#fTipo').onchange=e=>{ state.filters.tipo=e.target.value; render(); };
  $('#fEditora').onchange=e=>{ state.filters.editora=e.target.value; render(); };
  $('#fPais').onchange=e=>{ state.filters.pais=e.target.value; render(); };
  $('#fAutor').onchange=e=>{ state.filters.autor=e.target.value; render(); };
  $('#fGenero').onchange=e=>{ state.filters.genero=e.target.value; render(); };
  $('#fSort').onchange=e=>{ state.sort.by=e.target.value; render(); };
  $('#fDir').onchange=e=>{ state.sort.dir=e.target.value; render(); };
  $('#btnFilters').onclick=openFilters;
  $('#filtersClose').onclick=$('#filtersApply').onclick=closeFilters;
  $('#filtersOverlay').onclick=e=>{ if(e.target===$('#filtersOverlay')) closeFilters(); };
  $('#btnStats').onclick=openStats;
  const ft=$('#footTop'); if(ft) ft.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  const fy=$('#footYear'); if(fy) fy.textContent=new Date().getFullYear();
  $('#statsClose').onclick=closeStats;
  $('#statsOverlay').onclick=e=>{ if(e.target===$('#statsOverlay')) closeStats(); };

  const chk=(id,cid,key)=>{ $(id).onchange=e=>{ state.filters[key]=e.target.checked; $(cid).classList.toggle('on',e.target.checked); render(); }; };
  chk('#fImport','#cImport','importado'); chk('#fUrg','#cUrg','urgencia');
  $$('#leituraSeg button').forEach(b=>b.onclick=()=>{ state.filters.leitura=b.dataset.s; $$('#leituraSeg button').forEach(x=>x.classList.toggle('on',x===b)); render(); });
  $('#clearFilters').onclick=()=>{ const q=state.filters.q;
    state.filters={q,status:'todos',tipo:'',editora:'',pais:'',autor:'',genero:'',importado:false,urgencia:false,leitura:'todos'};
    $('#fImport').checked=$('#fUrg').checked=false;
    $$('.chk').forEach(c=>c.classList.remove('on')); $$('#statusSeg button').forEach((x,i)=>x.classList.toggle('on',i===0));
    $$('#leituraSeg button').forEach((x,i)=>x.classList.toggle('on',i===0));
    $('#fTipo').value=''; $('#fGenero').value=''; $('#fSort').value='nome'; $('#fDir').value='asc'; state.sort={by:'nome',dir:'asc'};
    refreshOptions(); render(); };

  const backupMenu=$('#backupMenu');
  $('#btnBackup').onclick=e=>{ e.stopPropagation(); backupMenu.classList.toggle('on'); };
  document.addEventListener('click',e=>{ if(!e.target.closest('.menu-wrap')) backupMenu.classList.remove('on'); });
  $('#btnExport').onclick=()=>{ backupMenu.classList.remove('on'); exportJSON(); };
  $('#btnImport').onclick=()=>{ backupMenu.classList.remove('on'); $('#importFile').click(); };
  $('#importFile').onchange=e=>{ if(e.target.files[0]) importJSON(e.target.files[0]); e.target.value=''; };

  // editor internal
  $('#e_tipo').querySelectorAll('button').forEach(b=>b.onclick=()=>setTipo(b.dataset.v));
  $('#e_origem').querySelectorAll('button').forEach(b=>b.onclick=()=>setOrigem(b.dataset.v));
  $('#e_qtd').addEventListener('input',()=>{ setVolsCount($('#e_qtd').value); renderVols(); });
  $('#e_status').querySelectorAll('button').forEach(b=>b.onclick=()=>{ editorDraft.status=b.dataset.v; setSwitch('#e_status',b.dataset.v); updateOwnedBox(); });
  $('#e_urg').addEventListener('change',e=>{ editorDraft.urg=e.target.checked?1:0; $('#e_urgchk').classList.toggle('on',e.target.checked); });
  $('#e_lido').querySelectorAll('button').forEach(b=>b.onclick=()=>{ editorDraft.lido=Number(b.dataset.v); setSwitch('#e_lido',b.dataset.v); updateNotaVis(); });
  $$('#e_stars .st').forEach(s=>s.onclick=()=>{ const v=Number(s.dataset.n); const cur=editorDraft.nota;
    editorDraft.nota = (cur===v) ? v-0.5 : v;   // 1st click = full, click same again = half, then alternates
    paintStars(editorDraft.nota); });
  $('#clrStars').onclick=()=>{ editorDraft.nota=0; paintStars(0); };
  $('#e_img_btn').onclick=()=>$('#e_img_file').click();
  $('#e_genresBtn').onclick=openGenrePopup;
  $('#genreSearch').oninput=renderGenreGrid;
  $('#genreClose').onclick=$('#genreDone').onclick=closeGenrePopup;
  $('#genreOverlay').onclick=e=>{ if(e.target===$('#genreOverlay')) closeGenrePopup(); };
  $('#genreClear').onclick=()=>{ editorDraft.genres=[]; renderGenreGrid(); };
  $('#e_img_file').addEventListener('change',e=>{ const f=e.target.files[0]; if(!f) return;
    if(f.size>3.2*1024*1024){ toast('Imagem grande demais (máx. ~3MB).'); return; }
    const r=new FileReader(); r.onload=()=>{ editorDraft.img=r.result; updatePreview(); }; r.readAsDataURL(f); });
  $('#e_valor').addEventListener('input',e=>{ e.target.value=money_format(money_toNumber(e.target.value)); });
  ['#e_nome','#e_editora'].forEach(id=>$(id).addEventListener('input',checkDup));

  // volumes popup
  $('#volsClose').onclick=$('#volsCloseBtn').onclick=closeVols;
  $('#volsOverlay').onclick=e=>{ if(e.target===$('#volsOverlay')) closeVols(); };
  $('#volsEdit').onclick=()=>{ closeVols(); openEditor(volsCurrentId); };
}

/* ================= CLOUD (GitHub) ================= */
const GH='https://api.github.com';
function ghHeaders(){ return {Authorization:'Bearer '+cloud.token, Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}; }
function b64enc(str){ return btoa(unescape(encodeURIComponent(str))); }
function b64dec(b64){ return decodeURIComponent(escape(atob((b64||'').replace(/\s/g,'')))); }
function canon(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
function slugify(s){ return (s||'obra').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'obra'; }
function readDataURL(f){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f); }); }

const SYNC_TXT={off:'Não conectado.',ok:'Tudo sincronizado.',sync:'Sincronizando…',pending:'Alterações pendentes…',err:'Erro de sincronização.'};
function setSync(kind){
  ['#syncDot'].forEach(id=>{ const d=$(id); if(d) d.className='syncdot '+kind; });
  const s=$('#cloudStatus'); if(s) s.innerHTML=`<span class="syncdot ${kind}"></span> ${SYNC_TXT[kind]||''}`;
}
async function ghGet(path){
  const r=await fetch(`${GH}/repos/${cloud.owner}/${cloud.repo}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}?ref=${encodeURIComponent(cloud.branch)}`,{headers:ghHeaders(),cache:'no-store'});
  if(r.status===404) return null;
  if(!r.ok) throw new Error('GET '+r.status);
  return r.json();
}
async function ghPut(path,contentB64,message,sha){
  const body={message,content:contentB64,branch:cloud.branch}; if(sha) body.sha=sha;
  const r=await fetch(`${GH}/repos/${cloud.owner}/${cloud.repo}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}`,
    {method:'PUT',headers:{...ghHeaders(),'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok){ let t=''; try{t=(await r.json()).message||'';}catch(e){} throw new Error('PUT '+r.status+(t?' — '+t:'')); }
  return r.json();
}
async function pullFromCloud(){
  setSync('sync');
  try{
    const f=await ghGet(cloud.path);
    if(!f){ setSync('ok'); return false; }
    cloud.sha=f.sha; saveCloud();
    const data=JSON.parse(b64dec(f.content));
    if(Array.isArray(data.obras)){ state.obras=data.obras; state.editoras=data.editoras||state.editoras; persistLocal(); refreshOptions(); render(); }
    setSync('ok'); return true;
  }catch(e){ setSync('err'); toast('Falha ao puxar: '+e.message); return false; }
}
let pushTimer=null, pushing=false, pushAgain=false;
function scheduleCloudPush(){ setSync('pending'); clearTimeout(pushTimer); pushTimer=setTimeout(()=>pushToCloud(),1500); }
async function pushToCloud(){
  if(!cloud.connected) return;
  if(pushing){ pushAgain=true; return; }
  pushing=true; setSync('sync');
  try{
    const json=JSON.stringify({version:1,updated:new Date().toISOString(),obras:state.obras,editoras:state.editoras},null,1);
    const b64=b64enc(json);
    try{ const res=await ghPut(cloud.path,b64,'Atualiza coleção — '+new Date().toLocaleString('pt-BR'),cloud.sha); cloud.sha=res.content.sha; }
    catch(e){ const f=await ghGet(cloud.path); cloud.sha=f?f.sha:null; const res=await ghPut(cloud.path,b64,'Atualiza coleção (retry)',cloud.sha); cloud.sha=res.content.sha; }
    saveCloud(); setSync('ok');
  }catch(e){ setSync('err'); toast('Falha ao salvar na nuvem: '+e.message); }
  pushing=false; if(pushAgain){ pushAgain=false; scheduleCloudPush(); }
}
function guessRepo(){ const m=location.hostname.match(/^([^.]+)\.github\.io$/); if(!m) return {owner:'',repo:''};
  const seg=location.pathname.split('/').filter(Boolean)[0]; return {owner:m[1], repo:seg||(m[1]+'.github.io')}; }
function updateCloudUI(){
  if(!cloud.owner||!cloud.repo){ const g=guessRepo(); cloud.owner=cloud.owner||g.owner; cloud.repo=cloud.repo||g.repo; }
  $('#c_owner').value=cloud.owner; $('#c_repo').value=cloud.repo; $('#c_branch').value=cloud.branch||'main';
  $('#c_path').value=cloud.path||'data/gibiteca.json'; $('#c_token').value=cloud.token||'';
  const on=cloud.connected;
  $('#cloudConnect').textContent=on?'Reconectar':'Conectar';
  $('#cloudDisconnect').style.display=on?'inline-flex':'none';
  $('#cloudPull').style.display=on?'inline-flex':'none';
  $('#cloudPush').style.display=on?'inline-flex':'none';
  setSync(on?'ok':'off');
}
function openCloud(){ updateCloudUI(); $('#cloudOverlay').classList.add('on'); }
function closeCloud(){ $('#cloudOverlay').classList.remove('on'); }
async function connectCloud(){
  cloud.owner=$('#c_owner').value.trim(); cloud.repo=$('#c_repo').value.trim();
  cloud.branch=$('#c_branch').value.trim()||'main'; cloud.path=$('#c_path').value.trim()||'data/gibiteca.json';
  cloud.token=$('#c_token').value.trim();
  if(!cloud.owner||!cloud.repo||!cloud.token){ toast('Preencha usuário, repositório e token.'); return; }
  setSync('sync');
  try{
    const r=await fetch(`${GH}/repos/${cloud.owner}/${cloud.repo}`,{headers:ghHeaders()});
    if(!r.ok) throw new Error(r.status===401?'Token inválido ou sem permissão.':r.status===404?'Repositório não encontrado (confira usuário/nome).':'Erro '+r.status+'.');
    cloud.connected=true; cloud.sha=null; saveCloud();
    const pulled=await pullFromCloud();
    if(!pulled) await pushToCloud();      // cria o arquivo com o que você já tem
    updateCloudUI(); toast('Nuvem conectada. Coleção sincronizada.');
  }catch(e){ cloud.connected=false; saveCloud(); setSync('err'); toast(e.message); updateCloudUI(); }
}
function disconnectCloud(){ cloud.connected=false; cloud.token=''; cloud.sha=null; saveCloud(); updateCloudUI(); toast('Nuvem desconectada. Seus dados continuam salvos neste navegador.'); }

/* ================= BULK COVERS ================= */
let bulkItems=[];
function openBulk(){
  if(!cloud.connected){ toast('Conecte a nuvem primeiro para enviar as capas.'); openCloud(); return; }
  bulkItems=[]; $('#bulkSum').style.display=$('#bulkList').style.display='none';
  $('#bulkProgress').classList.remove('on'); $('#bulkSend').disabled=true; $('#bulkFiles').value='';
  $('#bulkOverlay').classList.add('on');
}
function closeBulk(){ $('#bulkOverlay').classList.remove('on'); }
function analyzeBulk(files){
  const map={}; state.obras.forEach(o=>{ const k=canon(o.nome); (map[k]=map[k]||[]).push(o); });
  bulkItems=Array.from(files).map(f=>{
    const base=f.name.replace(/\.[^.]+$/,''); const arr=map[canon(base)]||[];
    let status='none',work=null;
    if(arr.length===1){status='match';work=arr[0];}
    else if(arr.length>1){status='ambig';}
    return {file:f,base,status,work,matches:arr.length};
  });
  renderBulkPreview();
}
function renderBulkPreview(){
  const m=bulkItems.filter(i=>i.status==='match').length;
  const n=bulkItems.filter(i=>i.status==='none').length;
  const a=bulkItems.filter(i=>i.status==='ambig').length;
  $('#bulkSum').style.display='flex';
  $('#bulkSum').innerHTML=`<span class="m">✓ ${m} associada(s)</span>`+(a?`<span class="a">? ${a} ambígua(s)</span>`:'')+(n?`<span class="n">✕ ${n} sem correspondência</span>`:'');
  const rows=bulkItems.map(i=>{
    const tag=i.status==='match'?'<span class="tag m">Associada</span>':i.status==='ambig'?`<span class="tag a">Ambígua (${i.matches})</span>`:'<span class="tag n">Sem par</span>';
    const to=i.status==='match'?esc(i.work.nome):i.status==='ambig'?'vários títulos iguais — ajuste manualmente':'—';
    return `<tr><td>${tag}</td><td>${esc(i.file.name)}</td><td style="color:var(--ink-soft)">${to}</td></tr>`;
  }).join('');
  $('#bulkList').style.display='block';
  $('#bulkList').innerHTML=`<table><tbody>${rows}</tbody></table>`;
  $('#bulkSend').disabled = m===0;
  $('#bulkSend').textContent = m?`Enviar ${m} capa(s)`:'Enviar capas';
}
async function sendBulk(){
  const todo=bulkItems.filter(i=>i.status==='match');
  if(!todo.length) return;
  $('#bulkSend').disabled=true; $('#bulkCancel').disabled=true;
  $('#bulkProgress').classList.add('on');
  let done=0, fail=0;
  for(const it of todo){
    $('#bulkLabel').textContent=`Enviando ${done+1}/${todo.length} — ${it.file.name}`;
    try{
      const dataURL=await readDataURL(it.file);
      const b64=dataURL.split(',')[1];
      const ext=(it.file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1]||'jpg').toLowerCase();
      const path=`${cloud.coverBase}/${slugify(it.work.nome)}-${it.work.id}.${ext}`;
      let sha=null; try{ const ex=await ghGet(path); if(ex) sha=ex.sha; }catch(e){}
      await ghPut(path,b64,'Capa: '+it.work.nome,sha);
      it.work.imagem=`https://raw.githubusercontent.com/${cloud.owner}/${cloud.repo}/${cloud.branch}/${path}`;
    }catch(e){ fail++; }
    done++; $('#bulkFill').style.width=Math.round(done/todo.length*100)+'%';
  }
  persistLocal(); scheduleCloudPush(); refreshOptions(); render();
  $('#bulkLabel').textContent=`Concluído: ${done-fail} enviada(s)`+(fail?`, ${fail} com erro`:'')+'.';
  $('#bulkCancel').disabled=false;
  toast(`${done-fail} capa(s) enviada(s).`+(fail?` ${fail} falharam.`:''));
}

/* ================= WELCOME / TUTORIAL ================= */
const WELCOME_KEY='gibiteca_seen_welcome';
function openWelcome(){ $('#welcomeOverlay').classList.add('on'); }
function closeWelcome(){ $('#welcomeOverlay').classList.remove('on'); try{localStorage.setItem(WELCOME_KEY,'1');}catch(e){} }
function maybeWelcome(){ let seen=false; try{seen=!!localStorage.getItem(WELCOME_KEY);}catch(e){}
  if(!seen && !cloud.connected && state.obras.length===0) openWelcome(); }
function openTutorial(){ $('#tutorialOverlay').classList.add('on'); }
function closeTutorial(){ $('#tutorialOverlay').classList.remove('on'); }

function bindCloud(){
  $('#btnCloud').onclick=openCloud;
  $('#cloudClose').onclick=closeCloud;
  $('#cloudOverlay').onclick=e=>{ if(e.target===$('#cloudOverlay')) closeCloud(); };
  $('#cloudConnect').onclick=connectCloud;
  $('#cloudDisconnect').onclick=disconnectCloud;
  $('#cloudPull').onclick=async()=>{ if(confirm('Puxar a versão da nuvem? Substitui o que está neste navegador.')){ await pullFromCloud(); toast('Coleção atualizada da nuvem.'); } };
  $('#cloudPush').onclick=()=>{ pushToCloud(); toast('Enviando para a nuvem…'); };
  $('#howToken').onclick=()=>{ const h=$('#tokenHelp'); h.style.display=h.style.display==='none'?'block':'none'; };

  $('#btnBulk').onclick=openBulk; $('#bulkClose').onclick=$('#bulkCancel').onclick=closeBulk;
  $('#bulkOverlay').onclick=e=>{ if(e.target===$('#bulkOverlay')) closeBulk(); };
  $('#bulkDrop').onclick=()=>$('#bulkFiles').click();
  $('#bulkFiles').onchange=e=>{ if(e.target.files.length) analyzeBulk(e.target.files); };
  $('#bulkDrop').addEventListener('dragover',e=>{e.preventDefault();$('#bulkDrop').style.background='#f2f5ea';});
  $('#bulkDrop').addEventListener('dragleave',()=>$('#bulkDrop').style.background='');
  $('#bulkDrop').addEventListener('drop',e=>{ e.preventDefault(); $('#bulkDrop').style.background='';
    const imgs=Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/')); if(imgs.length) analyzeBulk(imgs); });
  $('#bulkSend').onclick=sendBulk;

  $('#wlConnect').onclick=()=>{ closeWelcome(); openCloud(); };
  $('#wlStart').onclick=closeWelcome;
  $('#wlTutorial').onclick=openTutorial;
  $('#tutClose').onclick=$('#tutCloseBtn').onclick=closeTutorial;
  $('#tutOpenCloud').onclick=()=>{ closeTutorial(); closeWelcome(); openCloud(); };
  $('#tutorialOverlay').onclick=e=>{ if(e.target===$('#tutorialOverlay')) closeTutorial(); };
}

/* ---------- boot ---------- */
load(); loadCloud(); bind(); bindCloud(); refreshOptions(); render();
if(cloud.connected){ setSync('ok'); pullFromCloud(); } else setSync('off');
maybeWelcome();


}

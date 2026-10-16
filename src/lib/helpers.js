import { TIPOS_EDICAO } from '../data.js'
// Funções puras do modelo de dados — reaproveitadas do app original (mesma lógica).
/* Quantas tintas de "capa ausente" existem. As CORES moram no index.css, uma
   família por tema — aqui fica só o sorteio. Devolver hex de JS impediria a
   troca de tema de repintar: variável de CSS o JS não enxerga, e a cor ficaria
   congelada até o React redesenhar o cartão. */
export const QTD_TINTAS = 8;
export function fmtBRL(n){ n = Number(n)||0; return 'R$ ' + n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
export function initials(t){
  const w = (t||'?').replace(/[^\p{L}\p{N} ]/gu,'').trim().split(/\s+/).filter(Boolean);
  if(!w.length) return '?';
  if(w.length===1) return w[0].slice(0,2).toUpperCase();
  return (w[0][0]+w[1][0]).toUpperCase();
}
/* Mesmo hash de sempre: a mesma editora cai sempre na mesma tinta, e as obras
   que já tinham uma cor continuam com ela. */
export function tintIndex(s){ let h=0; s=s||''; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h%QTD_TINTAS; }
/* Pronto para o className: `classeTinta('Panini')` → "tinta tinta-3". */
export function classeTinta(s){ return 'tinta tinta-' + tintIndex(s); }
// Campos que aceitam varios valores separados por "/" — autores e paises.
export function splitLista(s){ return (s||'').toString().split('/').map(x=>x.trim()).filter(Boolean); }
export function paisesOf(o){ return splitLista(o.pais); }
export function authorsOf(o){
  const a=[]; const push=(s)=>{ splitLista(s).forEach(x=>{ if(!a.includes(x))a.push(x); }); };
  push(o.roteirista); push(o.desenhista);
  (Array.isArray(o.volumes)?o.volumes:[]).forEach(v=>{ push(v.roteirista); push(v.desenhista); });
  return a;
}
export function tipoOf(o){ let t=o.tipo; if(t==='avulsa') t='avulso'; return t || (o.serie?'serie':'avulso'); }
export function edOf(o){ return o.editora || o.editoraBR || ''; }
/* Rotulo do formato da edicao (Absoluta, Integral...), ou vazio. */
export function edicaoDe(o){ const k=o&&o.tipoEdicao; if(!k) return ''; const t=TIPOS_EDICAO.find(x=>x[0]===k); return t?t[1]:''; }
export function isImp(o){ return o.origem ? o.origem==='importado' : !(o.editoraBR); }
export function volsOf(o){
  if(Array.isArray(o.volumes)) return o.volumes;
  if(Array.isArray(o.conteudo)) return o.conteudo.map(n=>({nome:n,imagem:null}));
  return [];
}
// Os volumes que combinam com um filtro de status. Volume sem status conta
// como "quero" — mesma convencao de ownedCount/missingVols, para nada sumir.
export function unitsForStatus(o, status){
  const u=unitsOf(o);
  if(status==='biblioteca') return u.filter(x=>x&&x.status==='biblioteca');
  if(status==='wishlist')   return u.filter(x=>x&&x.status!=='biblioteca');
  return u;
}
// O volume que representa a obra sob um filtro de status. Capa e titulo do
// cartao saem os dois daqui — se cada um escolhesse sozinho, o cartao mostraria
// a capa de um volume com o nome de outro. Prefere um volume com capa, para a
// estante nao cair no placeholder a toa.
export function unidadeVitrine(o, status){
  if(!o || !status || status==='todos' || tipoOf(o)==='avulso') return null;
  const u=unitsForStatus(o,status);
  if(!u.length) return null;
  return u.find(x=>x&&x.imagem) || u[0];
}
// coverOf(o) segue igual. Com um status, a capa vem do volume da vitrine.
export function coverOf(o, status){
  const t=tipoOf(o); const v=volsOf(o);
  const alvo=unidadeVitrine(o,status);
  if(alvo && alvo.imagem) return alvo.imagem;
  if(t==='serie'){ if(v[0]&&v[0].imagem) return v[0].imagem; return o.imagem||null; }
  return o.imagem || (v[0]&&v[0].imagem) || null;
}
export function unitsOf(o){ return tipoOf(o)==='avulso' ? [o] : volsOf(o); }
export function ownedCount(o){ return unitsOf(o).filter(u=>u.status==='biblioteca').length; }
export function anyUrg(o){ return unitsOf(o).some(u=>u.urgencia && u.status!=='biblioteca'); }
// Urgencia sob um filtro: quem responde e o volume da vitrine. Em "Tenho" ele
// e um volume que voce ja tem — e volume na estante nunca e urgente.
export function urgenteNaVitrine(o, status){
  const alvo=unidadeVitrine(o,status);
  if(alvo) return !!alvo.urgencia && alvo.status!=='biblioteca';
  return anyUrg(o);
}
export function sumValor(o){ return unitsOf(o).reduce((s,u)=>s+(Number(u.valorPago)||0),0); }
export function lidoCount(o){ return unitsOf(o).filter(u=>u.status==='biblioteca'&&u.lido).length; }
export function avgNota(o){ const r=unitsOf(o).filter(u=>Number(u.nota)>0); return r.length? Math.round(r.reduce((s,u)=>s+u.nota,0)/r.length*2)/2 : 0; }
export function statusMatch(o,want){ return unitsOf(o).some(u=>u.status===want); }
export function missingVols(o){
  if(tipoOf(o)==='avulso') return [];
  return volsOf(o).map((v,i)=>({i:i+1,own:v.status==='biblioteca'})).filter(x=>!x.own).map(x=>x.i);
}
export function gNorm(s){ return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
/* ------------------------------------------------------------------
   DESMEMBRAR: uma série (ou box) vira N obras avulsas.

   O caminho inverso do cadastro. Quem comprou a série inteira a cadastrou
   como série; quem depois quer tratar cada volume como obra própria — porque
   vendeu metade, porque só lê salteado, porque a "série" na verdade era um
   punhado de histórias sem ordem — não tinha saída a não ser recadastrar
   volume por volume à mão.

   É função pura: recebe a obra e o último id em uso, devolve os registros
   novos. O store só cuida de ids e de estado, e assim a regra de quem herda o
   quê mora ao lado de `tipoOf` e `volsOf`, que são quem define a forma do
   registro.
   ------------------------------------------------------------------ */

/* O nome que o volume leva ao sair da série.

   "Vol. 3" sozinho na estante não diz nada — o nome da série era o contexto,
   e desmembrar é justamente tirar esse contexto. Então o nome da série entra
   no nome do volume.

   Salvo quando ele JÁ está lá: quem nomeou os volumes de "Sandman 3",
   "Sandman 4" não quer "Sandman — Sandman 3". A comparação passa por gNorm,
   que ignora acento e caixa: "akira" reconhece "Akira". */
export function nomeDesmembrado(obra, vol, i){
  const serie = ((obra && obra.nome) || '').trim();
  const nome  = ((vol && vol.nome) || '').trim() || ('Vol. ' + (i+1));
  if(!serie) return nome;
  if(gNorm(nome).includes(gNorm(serie))) return nome;
  return serie + ' — ' + nome;
}

/* Quantos volumes ficariam SEM capa se a obra fosse desmembrada agora.
   A tela pergunta isto antes de confirmar: desmembrar não tem desfazer, e
   capa é a perda que mais dói. */
export function volumesSemCapa(o){
  const v = volsOf(o);
  if(!v.length) return 0;
  if(v.every(x=>!x.imagem)) return o.imagem ? 0 : v.length;   // todos herdam a do conjunto
  return v.filter(x=>!x.imagem).length;
}

export function fragmentosDe(obra, ultimoId){
  const vols = volsOf(obra);
  if(!vols.length) return [];

  /* NENHUM volume tem capa própria: é o caso do box, onde o editor nem
     oferece o campo. Aí a capa do conjunto desce para todos — sem isso,
     desmembrar um box apagaria a única capa que existia.

     Havendo UMA capa de volume que seja, cada um fica com a sua e quem não
     tem fica sem. Herdar ali espalharia a capa do volume 1 pela série
     inteira, e capa errada é pior que capa nenhuma. */
  const herdada = vols.every(v=>!v.imagem) ? (obra.imagem || null) : null;

  return vols.map((v,i)=>{
    const tem = v.status==='biblioteca';
    return {
      id: ultimoId + 1 + i,
      nome: nomeDesmembrado(obra, v, i),
      tipo: 'avulso',

      /* Do CONJUNTO: o que descrevia a série descreve cada parte dela. A
         editora, o país e o tipo de edição de um volume são os da série; as
         tags saem clonadas para o array não ficar compartilhado entre as N
         obras novas. A anotação vai junto porque é o único lugar onde ela
         existia — melhor repetida em N obras do que perdida. */
      origem: obra.origem,
      editora: obra.editora || '',
      pais: obra.pais || '',
      tags: Array.isArray(obra.tags) ? obra.tags.slice() : [],
      resenha: obra.resenha || '',
      tipoEdicao: obra.tipoEdicao || '',

      /* Do VOLUME: o que já era dele continua dele. Autor e artista caem para
         os da série quando o volume não os traz — numa série de autor único
         eles só foram preenchidos uma vez, lá em cima. */
      imagem: v.imagem || herdada,
      roteirista: v.roteirista || obra.roteirista || '',
      desenhista: v.desenhista || obra.desenhista || '',

      /* Status, valor, leitura e nota saem do volume com as MESMAS travas do
         editor: urgência só vale no que falta, e valor, lido e nota só no que
         está na estante. Sem isto, desmembrar criaria obras em estados que o
         editor não deixa salvar. */
      status: v.status || 'wishlist',
      urgencia: !tem && !!v.urgencia,
      valorPago: tem ? (Number(v.valorPago)||0) : 0,
      lido: tem && !!v.lido,
      nota: tem ? (Number(v.nota)||0) : 0,
    };
  });
}
/* Campo de filtro multi-seleção: aceita lista, mas também o valor solto de
   antes — assim um filtro guardado por uma versão velha não quebra o app. */
export function comoLista(v){ return Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []); }
export function passes(o, f){
  if(f.status!=='todos' && !statusMatch(o,f.status)) return false;
  if(f.tipo && tipoOf(o)!==f.tipo) return false;
  // lista vazia = sem filtro; com itens, basta a obra bater com UM deles
  const fEd=comoLista(f.tipoEdicao); if(fEd.length && !fEd.includes(o.tipoEdicao||'')) return false;
  const fEt=comoLista(f.editora);    if(fEt.length && !fEt.includes(edOf(o))) return false;
  const fPa=comoLista(f.pais);       if(fPa.length && !paisesOf(o).some(x=>fPa.includes(x))) return false;
  const fAu=comoLista(f.autor);      if(fAu.length && !authorsOf(o).some(x=>fAu.includes(x))) return false;
  if(f.importado && !isImp(o)) return false;
  if(f.urgencia && !anyUrg(o)) return false;
  if(f.leitura==='lido' && !unitsOf(o).some(u=>u.status==='biblioteca'&&u.lido)) return false;
  if(f.leitura==='naolido' && !unitsOf(o).some(u=>u.status==='biblioteca'&&!u.lido)) return false;
  if(f.q){
    // gNorm nos DOIS lados: tira acento e caixa. Sem isto, procurar "esfera"
    // nao achava "Ésfera" — e ninguem digita acento numa caixa de busca.
    const q=gNorm(f.q);
    const hay=gNorm([o.nome,edOf(o),o.roteirista,o.desenhista,o.pais,o.resenha,
      volsOf(o).map(v=>v.nome+' '+(v.roteirista||'')+' '+(v.desenhista||'')).join(' ')].join(' '));
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
    case 'pais': return (paisesOf(o)[0]||'zzzzzz').toLowerCase();
    case 'editora': return (edOf(o)||'zzzzzz').toLowerCase();
    case 'autor': return (authorsOf(o)[0]||'zzzzzz').toLowerCase();
    default: return (o.nome||'').toLowerCase();
  }
}
/* Comparador de texto para a lista.
 *
 * O `<`/`>` cru compara por ponto de codigo: "é" (U+00E9) cai DEPOIS de "z"
 * (U+007A), e uma estante com Zorro, Ésfera e Últimas Balas saia nessa ordem.
 * `sensitivity: 'base'` faz "é" valer igual a "e" — que e como se procura num
 * indice de papel.
 *
 * Um Collator so, criado uma vez: construi-lo dentro do comparador custaria
 * uma instancia por par comparado. */
const COLACAO = new Intl.Collator('pt', { sensitivity: 'base' });

export function sortList(arr, sort){
  return arr.slice().sort((a,b)=>{
    const ka=sortKey(a,sort.by), kb=sortKey(b,sort.by);
    let r = (typeof ka==='string' && typeof kb==='string')
      ? COLACAO.compare(ka,kb)
      : (ka<kb?-1:ka>kb?1:0);
    // empate no criterio escolhido: o nome decide, pela mesma regra
    if(r===0) r=COLACAO.compare(a.nome||'', b.nome||'');
    return sort.dir==='desc'?-r:r;
  });
}

// --- valores monetários (mesma lógica da versão HTML) ---
export function moneyToNumber(str){ const digits=(str||'').replace(/\D/g,''); return digits?parseInt(digits,10)/100:0; }
export function moneyFormat(n){ return n?fmtBRL(n):''; }

// --- casamento por nome / slug de arquivo (capas em massa) ---
export function canon(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
export function slugify(s){ return (s||'obra').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'obra'; }

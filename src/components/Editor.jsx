import { AnimatePresence, motion } from 'framer-motion'
import { MOLA_GAVETA, FADE } from '../lib/motion.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { authorsOf, paisesOf, edOf, moneyToNumber, moneyFormat, tintFor, initials } from '../lib/helpers.js'
import { TIPOS_EDICAO } from '../data.js'
import Combo from './Combo.jsx'
import Pessoas from './Pessoas.jsx'
import { EstrelasInput } from './Estrelas.jsx'
import { linkDoGuia } from '../lib/catalogo.js'

const emptyVol = () => ({ nome: '', imagem: null, roteirista: '', desenhista: '', status: 'wishlist', urgencia: false, valorPago: 0, lido: false, nota: 0, _open: true })

function draftFromObra(o) {
  if (!o || !o.id) {
    // 'genres' não tem mais campo na tela. Continua no rascunho só para
    // atravessar uma edição sem apagar o que já estava gravado em obra.tags.
    return { id: null, tipo: 'avulso', nome: '', origem: 'nacional', editora: '', pais: '', genres: [], img: '', resenha: '', tipoEdicao: '',
      roteirista: '', desenhista: '', status: 'wishlist', urgencia: false, valorPago: 0, lido: false, nota: 0, vols: [] }
  }
  const tipo = o.tipo === 'avulsa' ? 'avulso' : (o.tipo || (o.volumes ? 'serie' : 'avulso'))
  return {
    id: o.id, tipo, nome: o.nome || '', origem: o.origem || (o.editoraBR ? 'nacional' : 'importado'),
    editora: edOf(o), pais: o.pais || '', genres: Array.isArray(o.tags) ? o.tags.slice() : [], tipoEdicao: o.tipoEdicao || '',
    img: o.imagem || '', resenha: o.resenha || '',
    roteirista: o.roteirista || '', desenhista: o.desenhista || '',
    status: o.status || 'wishlist', urgencia: !!o.urgencia, valorPago: Number(o.valorPago) || 0,
    lido: !!o.lido, nota: Number(o.nota) || 0,
    vols: Array.isArray(o.volumes) ? o.volumes.map(v => ({ ...emptyVol(), ...v, _open: false })) : [],
  }
}

/* ---------- ícones ----------
   Um traço só para todos: 24 de viewBox, contorno de 2, pontas arredondadas.
   Todo botão de ícone leva title + aria-label: o desenho dá o substantivo,
   o rótulo ao lado dá o verbo, e o leitor de tela recebe a frase inteira. */
const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
const IconLixeira = () => (
  <svg className="w-[15px] h-[15px]" {...svg}>
    <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
)
const IconAutor = () => (                      /* caneta = quem escreve */
  <svg className="w-[15px] h-[15px]" {...svg}>
    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
)
/* Paleta, e não pincel: pincel e caneta viram o mesmo risco diagonal a 15px, e
   trocar um pelo outro aqui sobrescreve o campo em TODOS os volumes. A silhueta
   redonda não se confunde com nada mais da barra. */
const IconArtista = () => (
  <svg className="w-[15px] h-[15px]" {...svg}>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.7h2c3 0 5.6-2.5 5.6-5.5C22 6 17.5 2 12 2z" />
    <circle cx="8.5" cy="7.5" r=".6" fill="currentColor" />
    <circle cx="13.5" cy="6.5" r=".6" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".6" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".6" fill="currentColor" />
  </svg>
)
const IconStatus = () => (                     /* marcador = tenho/quero */
  <svg className="w-[15px] h-[15px]" {...svg}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const IconEnviar = () => (
  <svg className="w-[15px] h-[15px]" {...svg}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
  </svg>
)

function BotaoIcone({ children, perigo, ...resto }) {
  return (
    <button type="button" {...resto}
      className={`w-9 h-9 shrink-0 rounded-full border flex items-center justify-center transition-colors duration-200
        ${perigo
          ? 'border-contorno text-rust hover:border-rust hover:bg-tinta-rust'
          : 'border-contorno text-ink-soft hover:border-moss-3 hover:text-moss hover:bg-tinta-moss'}`}
    >{children}</button>
  )
}

/* Cabeçalho de seção. O formulário tinha quinze campos em fila única, todos
   com o mesmo peso — dava para rolar a tela inteira sem saber onde um assunto
   terminava e o outro começava. O fio puxa o olho até a margem direita. */
function Secao({ titulo, children }) {
  return (
    <section className="col-span-2">
      <h4 className="font-mono text-rotulo uppercase font-bold text-moss flex items-center gap-2.5 mb-2.5">
        {/* o quadradinho ancora o título: sem ele a seção era só mais um texto
            miúdo creme no meio de outros textos miúdos cremes */}
        <span className="w-[6px] h-[6px] rounded-[2px] bg-moss shrink-0" />
        {titulo}<span className="flex-1 h-px bg-separador" />
      </h4>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">{children}</div>
    </section>
  )
}

/* ---------- pequenos controles ---------- */
function Switch({ options, value, onChange }) {
  return (
    <div className="flex w-full rounded-full border border-contorno overflow-hidden">
      {options.map(([v, l]) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
 className={`flex-1 text-corpo font-semibold py-2 px-2 transition ${value === v ? 'bg-moss text-white' : 'bg-surface text-ink-soft hover:bg-paper-2'}`}>{l}</button>
      ))}
    </div>
  )
}
const lbl ="font-mono text-rotulo uppercase text-ink-soft pl-0.5"
const box ="flex flex-col gap-1"

// checkbox estilizado com a mesma altura dos inputs (para alinhar em linha/coluna)
function CheckTile({ checked, onChange, danger, children }) {
  return (
    <label className={`flex items-center gap-2.5 rounded-full border h-[42px] px-3.5 text-corpo font-semibold cursor-pointer transition select-none ${checked ? (danger ? 'border-rust text-rust bg-surface-2' : 'border-moss text-moss bg-surface-2') : 'border-contorno text-ink-soft bg-surface hover:bg-paper-2'}`}>
      <input type="checkbox" className={`w-[16px] h-[16px] ${danger ? 'accent-rust' : 'accent-moss'}`} checked={checked} onChange={onChange} />
      {children}
    </label>
  )
}

/* ---------- painel de volume ---------- */
function VolPanel({ v, i, withCover, autores, onChange, onCopyAll, onCover, onRemover, podeRemover }) {
  const owned = v.status === 'biblioteca'
  const fileRef = useRef(null)
  const set = (patch) => onChange(i, patch)
  return (
    <div className="rounded-medio border border-separador bg-surface overflow-hidden">
      <button type="button" onClick={() => set({ _open: !v._open })} className="w-full flex items-center gap-2 px-3 py-2 bg-paper-2 text-left">
        <span className="font-mono text-apoio font-bold text-moss">#{i + 1}</span>
        <span className="text-corpo text-ink truncate flex-1">{v.nome || `Vol. ${i + 1}`}</span>
        <span className={`pill ${owned ? 'pill-tenho' : 'pill-quero'}`}>{owned ? 'Tenho' : 'Quero'}</span>
        <svg className={`w-4 h-4 text-ink-faint transition ${v._open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {v._open && (
        <div className="p-3 grid grid-cols-2 gap-2.5">
          <div className={`${box} col-span-2`}>
            <label className={lbl}>Nome do volume</label>
            <input className="field-input" value={v.nome} onChange={e => set({ nome: e.target.value })} placeholder={`Vol. ${i + 1}`} />
          </div>
          {withCover && (
            <div className={`${box} col-span-2`}>
              <label className={lbl}>Capa do volume</label>
              <div className="flex items-center gap-3">
                {v.imagem
                  ? <img src={v.imagem} alt="" className="h-[80px] w-auto max-w-[86px] rounded-pequeno shadow-[0_7px_18px_-8px_rgba(35,39,28,.5)] shrink-0" />
                  : <div className="w-14 h-[74px] rounded-pequeno flex items-center justify-center font-display text-obra text-white shrink-0" style={{ background: tintFor(v.nome || 'v') }}>{initials(v.nome || (i + 1) + '')}</div>}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onCover(i, e)} />
                <button type="button" className="neo-btn !text-apoio !py-2" onClick={() => fileRef.current?.click()}>
                  <IconEnviar />Enviar…
                </button>
                {v.imagem && (
                  <BotaoIcone perigo onClick={() => set({ imagem: null })}
                    title="Tirar a capa deste volume" aria-label="Tirar a capa deste volume">
                    <IconLixeira />
                  </BotaoIcone>
                )}
              </div>
            </div>
          )}
          <div className="col-span-2 sm:col-span-1">
            <Pessoas rotulo="Autor" options={autores} value={v.roteirista}
              onChange={x => set({ roteirista: x })} placeholder="Nome e Enter" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Pessoas rotulo="Artista" options={autores} value={v.desenhista}
              onChange={x => set({ desenhista: x })} placeholder="Nome e Enter" />
          </div>
          <div className={box}>
            <label className={lbl}>Status</label>
            <Switch options={[['wishlist', 'Quero'], ['biblioteca', 'Tenho']]} value={v.status}
              onChange={val => set({ status: val, ...(val === 'biblioteca' ? { urgencia: false } : {}) })} />
          </div>
          {!owned ? (
            <div className={box}>
              <label className={lbl}>Urgência</label>
              <CheckTile danger checked={v.urgencia} onChange={e => set({ urgencia: e.target.checked })}>Urgente ⚠️</CheckTile>
            </div>
          ) : (
            <div className={box}>
              <label className={lbl}>Valor pago</label>
              <input className="field-input" inputMode="numeric" value={v.valorPago ? moneyFormat(v.valorPago) : ''}
                onChange={e => set({ valorPago: moneyToNumber(e.target.value) })} placeholder="R$ 0,00" />
            </div>
          )}
          {owned && (
            <>
              <div className={box}>
                <label className={lbl}>Leitura</label>
                <CheckTile checked={v.lido} onChange={e => set({ lido: e.target.checked, ...(e.target.checked ? {} : { nota: 0 }) })}>Lido</CheckTile>
              </div>
              {v.lido ? (
                <div className={box}>
                  <label className={lbl}>Nota</label>
                  <div className="h-[42px] flex items-center"><EstrelasInput value={v.nota} onChange={n => set({ nota: n })} /></div>
                </div>
              ) : <div />}
            </>
          )}
          {/* Uma barra só para as ações do volume: repetir à esquerda, apagar
              à direita, separadas pelo vão. Eram quatro botões de texto em
              duas fileiras, com "copiar roteirista p/ todos" ocupando mais
              largura do que o campo que ele copia.
              O rótulo fica à vista de propósito: ícone sozinho vira charada,
              e em celular não existe o balãozinho do title para salvar. */}
          <div className="col-span-2 flex items-center gap-1.5 pt-2 mt-1 border-t border-linha">
            <span className="font-mono text-rotulo uppercase text-ink-faint mr-0.5">Copiar p/ todos</span>
            <BotaoIcone onClick={() => onCopyAll(i, 'roteirista')}
              title="Copiar o autor deste volume para todos os volumes"
              aria-label="Copiar o autor deste volume para todos os volumes"><IconAutor /></BotaoIcone>
            <BotaoIcone onClick={() => onCopyAll(i, 'desenhista')}
              title="Copiar o artista deste volume para todos os volumes"
              aria-label="Copiar o artista deste volume para todos os volumes"><IconArtista /></BotaoIcone>
            <BotaoIcone onClick={() => onCopyAll(i, 'status')}
              title="Copiar o status deste volume para todos os volumes"
              aria-label="Copiar o status deste volume para todos os volumes"><IconStatus /></BotaoIcone>

            <span className="flex-1" />

            {/* a única ação da barra que destrói dado: rust, e longe das outras */}
            {podeRemover && (
              <BotaoIcone perigo onClick={() => onRemover(i)}
                title="Excluir este volume" aria-label="Excluir este volume"><IconLixeira /></BotaoIcone>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Editor({ target, onClose, onSaved }) {
  const { obras, editoras, nextId, upsertObra, deleteObra } = useStore()
  const open = target != null
  const [d, setD] = useState(draftFromObra(null))
  const coverRef = useRef(null)

  useEffect(() => { if (open) setD(draftFromObra(target && target.id ? target : null)) }, [open, target])

  const paises = useMemo(() => Array.from(new Set(obras.flatMap(paisesOf))).sort((a, b) => a.localeCompare(b, 'pt')), [obras])
  const autores = useMemo(() => Array.from(new Set(obras.flatMap(authorsOf))).sort((a, b) => a.localeCompare(b, 'pt')), [obras])
  const eds = useMemo(() => Array.from(new Set([...(editoras || []), ...obras.map(edOf)].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt')), [editoras, obras])

  const isMulti = d.tipo === 'box' || d.tipo === 'serie'
  const withCover = d.tipo === 'serie'
  const patch = (p) => setD(s => ({ ...s, ...p }))

  const setTipo = (t) => setD(s => {
    const next = { ...s, tipo: t }
    if ((t === 'box' || t === 'serie') && (!s.vols || !s.vols.length)) next.vols = [emptyVol()]
    return next
  })
  /* Tira UM volume da lista. A quantidade acompanha sozinha — o campo
     "quantidade de volumes" le d.vols.length —, entao nao ha dois numeros
     para manter em sincronia. */
  const removerVol = (i) => setD(s => ({ ...s, vols: s.vols.filter((_, j) => j !== i) }))

  const setQtd = (n) => setD(s => {
    n = Math.max(0, Math.min(80, Number(n) || 0))
    const cur = s.vols.slice()
    if (n > cur.length) while (cur.length < n) cur.push(emptyVol())
    else cur.length = n
    return { ...s, vols: cur }
  })
  const setVol = (i, p) => setD(s => { const v = s.vols.slice(); v[i] = { ...v[i], ...p }; return { ...s, vols: v } })
  const copyAll = (i, f) => setD(s => { const val = s.vols[i][f]; return { ...s, vols: s.vols.map(v => ({ ...v, [f]: val, ...(f === 'status' && val === 'biblioteca' ? { urgencia: false } : {}) })) } })
  const volCover = (i, e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => setVol(i, { imagem: r.result }); r.readAsDataURL(f); e.target.value = ''
  }
  const onCover = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => patch({ img: r.result }); r.readAsDataURL(f); e.target.value = ''
  }

  const save = () => {
    const title = d.nome.trim()
    if (!title) { alert(d.tipo === 'box' ? 'Dê um título ao box.' : d.tipo === 'serie' ? 'Dê um título à série.' : 'Dê um título à obra.'); return }
    // tags entra igualzinho como saiu — editar uma obra antiga não apaga os
    // gêneros que ela já tinha
    const base = { id: d.id ?? nextId(), nome: title, tipo: d.tipo, origem: d.origem, editora: d.editora.trim(), pais: d.pais.trim(), tags: d.genres.slice(), resenha: d.resenha.trim(), tipoEdicao: d.tipoEdicao || '' }
    let rec
    if (isMulti) {
      const volumes = d.vols.map((v, i) => {
        const owned = v.status === 'biblioteca'
        return {
          nome: (v.nome && v.nome.trim()) || ('Vol. ' + (i + 1)),
          imagem: withCover ? (v.imagem || null) : null,
          roteirista: v.roteirista || '', desenhista: v.desenhista || '',
          status: v.status || 'wishlist', urgencia: !owned && !!v.urgencia,
          valorPago: owned ? (v.valorPago || 0) : 0, lido: owned && !!v.lido, nota: owned ? (v.nota || 0) : 0,
        }
      })
      rec = { ...base, volumes, imagem: withCover ? (volumes[0]?.imagem || null) : (d.img || null),
        roteirista: '', desenhista: '', status: 'wishlist', urgencia: false, valorPago: 0, lido: false, nota: 0 }
    } else {
      const owned = d.status === 'biblioteca'
      rec = { ...base, imagem: d.img || null, roteirista: d.roteirista.trim(), desenhista: d.desenhista.trim(),
        status: d.status, urgencia: !owned && d.urgencia, valorPago: owned ? d.valorPago : 0, lido: owned && d.lido, nota: owned ? d.nota : 0 }
    }
    upsertObra(rec)
    onSaved?.(d.id == null ? 'Obra adicionada ✓' : 'Alterações salvas ✓')
    onClose()
  }
  const remove = () => {
    if (!d.id) return
    if (!confirm(`Excluir"${d.nome || 'esta obra'}" da coleção?`)) return
    deleteObra(d.id); onSaved?.('Excluído.'); onClose()
  }

  const ownedAvulso = d.status === 'biblioteca'

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
 className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 bg-veu backdrop-blur-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
            /* o clique fora NAO fecha: aqui tem formulario preenchido, e perder
               o cadastro por um clique no vazio custa caro. Só o X, Cancelar
               ou Salvar fecham. */
          >
            <motion.div
 className="w-full sm:max-w-[640px] h-full sm:h-auto sm:max-h-[92vh] flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(35,39,28,.5)]"
              initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              transition={MOLA_GAVETA}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-separador">
                <h3 className="font-display text-secao text-moss">{d.id == null ? 'Nova obra' : 'Editar obra'}</h3>
                <button className="neo-icon !w-9 !h-9" onClick={onClose}>×</button>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4 grid grid-cols-2 gap-x-3 gap-y-5">
                <Secao titulo="Cadastro">
                  <div className={`${box} col-span-2`}>
                    <label className={lbl}>Tipo de cadastro</label>
                    <Switch options={[['avulso', 'Avulso'], ['box', 'Box'], ['serie', 'Série']]} value={d.tipo} onChange={setTipo} />
                  </div>

                  <div className={`${box} col-span-2`}>
                    <label className={lbl}>{d.tipo === 'box' ? 'Título do box' : d.tipo === 'serie' ? 'Título da série' : 'Título'}</label>
                    <input className="field-input" value={d.nome} onChange={e => patch({ nome: e.target.value })}
                      placeholder={d.tipo === 'box' ? 'Nome do box / coleção' : d.tipo === 'serie' ? 'Nome da série' : 'Nome da obra'} />
                    {/* O Guia não tem API e fecha CORS: em vez de raspar o site,
                        levamos a pessoa até ele com o título já na busca.
                        Saiu de dentro da linha do título — ali comia metade da
                        largura do campo justamente no celular. */}
                    <a href={linkDoGuia(d.nome)} target="_blank" rel="noopener noreferrer"
                      className="self-end text-apoio font-semibold text-moss underline underline-offset-2 hover:opacity-80"
                      title="Abrir no Guia dos Quadrinhos, em aba nova">
                      Ver no Guia dos Quadrinhos ↗
                    </a>
                  </div>
                </Secao>

                <Secao titulo="Publicação">
                  <div className={`${box} col-span-2`}>
                    <label className={lbl}>Origem da edição</label>
                    <Switch options={[['nacional', 'Nacional'], ['importado', 'Importado']]} value={d.origem} onChange={v => patch({ origem: v })} />
                  </div>

                  <div className={`${box} col-span-2 sm:col-span-1`}>
                    <label className={lbl}>{d.origem === 'importado' ? 'Editora' : 'Editora no Brasil'}</label>
                    <Combo options={eds} value={d.editora} onChange={x => patch({ editora: x })} placeholder="Nome da editora" />
                  </div>
                  <div className={`${box} col-span-2 sm:col-span-1`}>
                    <label className={lbl}>País de origem</label>
                    <Combo multi options={paises} value={d.pais} onChange={x => patch({ pais: x })} placeholder="Use / p/ separar" />
                  </div>

                  {/* Formato da edição: escolha ÚNICA, e clicar na marcada
                      desmarca — a maioria das obras não é edição especial,
                      então precisa haver caminho de volta para "nenhuma".
                      Mora aqui, junto de editora e país: é dado de publicação,
                      e ficava largado depois do campo de resenha. */}
                  <div className={`${box} col-span-2`}>
                    <label className={lbl}>Tipo da edição</label>
                    <div className="flex flex-wrap gap-2">
                      {TIPOS_EDICAO.map(([v, rotulo]) => {
                        const marcada = d.tipoEdicao === v
                        return (
                          <button
                            key={v} type="button"
                            aria-pressed={marcada}
                            onClick={() => patch({ tipoEdicao: marcada ? '' : v })}
                            className={`rounded-full border px-4 py-2 text-corpo font-semibold transition-colors duration-200
                              ${marcada ? 'border-moss bg-moss text-white' : 'border-separador bg-surface text-ink-soft hover:border-moss-3 hover:text-ink'}`}
                          >{rotulo}</button>
                        )
                      })}
                    </div>
                  </div>
                </Secao>

                {/* capa única (avulso / box) */}
                {!withCover && (
                  <Secao titulo="Capa">
                    <div className="col-span-2 flex items-center gap-3">
                      {d.img
                        ? <img src={d.img} alt="" className="h-[92px] w-auto max-w-[100px] rounded-pequeno shadow-[0_7px_18px_-8px_rgba(35,39,28,.5)] shrink-0" />
                        : <div className="w-16 h-[84px] rounded-pequeno border border-dashed border-separador bg-surface-2 flex items-center justify-center text-ink-faint text-rotulo text-center px-1 shrink-0">sem capa</div>}
                      <div className="flex-1 min-w-0">
                        <input ref={coverRef} type="file" accept="image/*" hidden onChange={onCover} />
                        <div className="flex items-center gap-2">
                          <button type="button" className="neo-btn flex-1 justify-center" onClick={() => coverRef.current?.click()}>
                            <IconEnviar />Enviar imagem…
                          </button>
                          {d.img && (
                            <BotaoIcone perigo onClick={() => patch({ img: '' })}
                              title="Tirar a capa" aria-label="Tirar a capa"><IconLixeira /></BotaoIcone>
                          )}
                        </div>
                        <div className="text-apoio text-ink-faint mt-1.5">A imagem fica salva junto no seu backup.</div>
                      </div>
                    </div>
                  </Secao>
                )}

                {/* multi: volumes */}
                {isMulti && (
                  <Secao titulo={d.tipo === 'box' ? 'Livros do box' : 'Volumes da série'}>
                    <div className={`${box} col-span-2`}>
                      <label className={lbl}>Quantidade de {d.tipo === 'box' ? 'livros' : 'volumes'}</label>
                      <input type="number" min="1" max="80" className="field-input max-w-[150px]" value={d.vols.length || ''}
                        onChange={e => setQtd(e.target.value)} placeholder="ex.: 3" />
                    </div>
                    {d.vols.length > 0 && (
                      <div className="col-span-2 text-apoio text-ink-faint">
                        Abra cada volume para preencher. O que se repete, copie com os botões do rodapé do volume.
                      </div>
                    )}
                    <div className="col-span-2 flex flex-col gap-2">
                      {d.vols.map((v, i) => (
                        <VolPanel key={i} v={v} i={i} withCover={withCover} autores={autores} onChange={setVol} onCopyAll={copyAll} onCover={volCover} onRemover={removerVol} podeRemover={d.vols.length > 1} />
                      ))}
                    </div>
                  </Secao>
                )}

                {/* avulso: autores + status */}
                {!isMulti && (
                  <>
                    <Secao titulo="Autoria">
                      <div className="col-span-2 sm:col-span-1">
                        <Pessoas rotulo="Autor" options={autores} value={d.roteirista}
                          onChange={x => patch({ roteirista: x })} />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <Pessoas rotulo="Artista" options={autores} value={d.desenhista}
                          onChange={x => patch({ desenhista: x })} />
                      </div>
                    </Secao>

                    <Secao titulo="Situação">
                    <div className={box}>
                      <label className={lbl}>Status</label>
                      <Switch options={[['wishlist', 'Quero'], ['biblioteca', 'Tenho']]} value={d.status}
                        onChange={v => patch({ status: v, ...(v === 'biblioteca' ? { urgencia: false } : {}) })} />
                    </div>
                    {!ownedAvulso ? (
                      <div className={box}>
                        <label className={lbl}>Urgência</label>
                        <CheckTile danger checked={d.urgencia} onChange={e => patch({ urgencia: e.target.checked })}>Urgente ⚠️</CheckTile>
                      </div>
                    ) : (
                      <div className={box}>
                        <label className={lbl}>Valor pago</label>
                        <input className="field-input" inputMode="numeric" value={d.valorPago ? moneyFormat(d.valorPago) : ''}
                          onChange={e => patch({ valorPago: moneyToNumber(e.target.value) })} placeholder="R$ 0,00" />
                      </div>
                    )}
                    {ownedAvulso && (
                      <>
                        <div className={box}>
                          <label className={lbl}>Leitura</label>
                          <CheckTile checked={d.lido} onChange={e => patch({ lido: e.target.checked, ...(e.target.checked ? {} : { nota: 0 }) })}>Lido</CheckTile>
                        </div>
                        {d.lido ? (
                          <div className={box}>
                            <label className={lbl}>Nota</label>
                            <div className="h-[42px] flex items-center"><EstrelasInput value={d.nota} onChange={n => patch({ nota: n })} /></div>
                          </div>
                        ) : <div />}
                      </>
                    )}
                    </Secao>
                  </>
                )}

                <Secao titulo="Anotações">
                  <div className={`${box} col-span-2`}>
                    <label className={lbl}>Anotações / resenha</label>
                    <textarea className="field-input min-h-[80px] resize-y" rows={3} value={d.resenha} onChange={e => patch({ resenha: e.target.value })} placeholder="Escreva aqui…" />
                  </div>
                </Secao>

              </div>

              <div className="flex items-center gap-2 px-5 py-3.5 border-t border-separador">
                {d.id != null && <button className="neo-btn neo-btn-rust" onClick={remove}><IconLixeira />Excluir</button>}
                <button className="neo-btn ml-auto" onClick={onClose}>Cancelar</button>
                <button className="neo-btn neo-btn-moss" onClick={save}>Salvar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}

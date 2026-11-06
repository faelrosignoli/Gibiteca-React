import { AnimatePresence, motion } from 'framer-motion'
import Moldura from './Moldura.jsx'
import { MOLA_GAVETA, FADE } from '../lib/motion.js'
import { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import {
  unitsOf, edOf, isImp, sumValor, tipoOf, anyUrg, ownedCount, fmtBRL, posseDe, authorsOf,
} from '../lib/helpers.js'
import Ticker from './Ticker.jsx'

/* ---------- barra horizontal (itens ou dinheiro) ---------- */
function BarRow({ nm, v, max, money, i }) {
  return (
    /* EMPILHA SEMPRE: rótulo em cima, barra e número embaixo.
     *
     * Em linha, as duas larguras fixas (120 do rótulo + 86 do número + gaps)
     * comiam 206px. No celular sobravam ~100px para a barra; no desktop,
     * MENOS — 78px — porque a partir de `sm:` os gráficos ficam em duas
     * colunas e a coluna nunca passa de ~316px. O gráfico era a menor parte
     * da linha nos dois tamanhos.
     *
     * Empilhado, a barra fica com ~70% da largura em qualquer tela e o rótulo
     * ganha a linha toda — nome de editora longo para de ser cortado. */
    <div className="flex flex-col gap-1.5">
      <span className="text-apoio text-ink-soft truncate" title={nm}>{nm}</span>
      <div className="flex items-center gap-3 flex-1 min-w-0">
      <span className="flex-1 h-[8px] rounded-pequeno bg-linha overflow-hidden">
        <motion.span
 className="block h-full rounded-pequeno bg-moss"
          initial={{ width: 0 }} animate={{ width: `${Math.max(4, Math.round(v / max * 100))}%` }}
          transition={{ duration: 0.6, delay: 0.05 + i * 0.05, ease: [0.2, 0.8, 0.3, 1] }}
        />
      </span>
      <span className="w-[86px] shrink-0 text-right font-mono text-apoio font-medium tabular-nums whitespace-nowrap text-ink">{money ? fmtBRL(v) : v}</span>
      </div>
    </div>
  )
}

function Bars({ title, data, money }) {
  const max = Math.max(1, ...data.map(d => d[1]))
  return (
    <div>
      <h4 className="font-display text-obra text-ink mb-4">{title}</h4>
      {data.length
        ? <div className="flex flex-col gap-2.5">{data.map(([nm, v], i) => <BarRow key={nm} nm={nm} v={v} max={max} money={money} i={i} />)}</div>
        : <p className="text-apoio text-ink-faint">Sem dados ainda.</p>}
    </div>
  )
}

/* ---------- histograma de notas ---------- */
function Histogram({ counts, buckets }) {
  const max = Math.max(1, ...counts)
  return (
    <div>
      <h4 className="font-display text-obra text-ink mb-4">Distribuição de notas</h4>
      <div className="flex items-end gap-1.5 h-[120px]">
        {buckets.map((b, i) => {
          const c = counts[i]
          return (
            <div key={b} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <span className="text-rotulo font-bold text-ink-soft h-3">{c || ''}</span>
              <motion.span
 className={`w-full rounded-t-pequeno ${c ? 'bg-gold' : 'bg-linha'}`}
                initial={{ height: 0 }} animate={{ height: c ? `${Math.round(c / max * 100)}%` : '3px' }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.03, ease: [0.2, 0.8, 0.3, 1] }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {buckets.map(b => <span key={b} className="flex-1 text-center font-rotulo text-rotulo text-ink-faint">{b}</span>)}
      </div>
    </div>
  )
}

export default function Stats({ open, onClose }) {
  const { obras, filtered } = useStore()
  const [scope, setScope] = useState('all')
  const src = scope === 'all' ? obras : filtered

  const s = useMemo(() => {
    const O = src
    const units = O.flatMap(unitsOf)
    const owned = units.filter(u => posseDe(u) === 'biblioteca')
    const want = units.filter(u => posseDe(u) === 'wishlist')
    const saiu = units.filter(u => posseDe(u) === 'tive')

    /* DOIS TOTAIS, NUNCA UM SALDO. O investido conta tudo que saiu do bolso,
       inclusive o que você já vendeu — pagar não desacontece. O retorno é o
       que voltou. Um menos o outro daria um número só, e esconderia os dois. */
    const invest = units.reduce((a, u) => a + (Number(u.valorPago) || 0), 0)
    const retorno = units.reduce((a, u) => a + (Number(u.valorRetorno) || 0), 0)
    const paid = units.filter(u => Number(u.valorPago) > 0)
    const avg = paid.length ? invest / paid.length : 0

    // lido é lido, tenha ou não: a conta é sobre a coleção inteira
    const lidos = units.filter(u => u.lido).length
    const pctLido = units.length ? Math.round(lidos / units.length * 100) : 0
    const rated = units.filter(u => Number(u.nota) > 0)
    const notaMed = rated.length ? rated.reduce((a, u) => a + u.nota, 0) / rated.length : 0

    const tally = (keyFn) => {
      const m = {}; O.forEach(o => { const k = keyFn(o); if (k) m[k] = (m[k] || 0) + 1 }); return m
    }
    const byEd = tally(o => edOf(o) || (isImp(o) ? 'Importado (s/ editora)' : '—'))

    /* Quem mais aparece. Uma obra com dois autores conta para os dois — é
       como se procura, e é o mesmo critério do agrupamento. */
    const porAutor = {}
    O.forEach(o => authorsOf(o).forEach(n => { porAutor[n] = (porAutor[n] || 0) + 1 }))
    const autores = Object.entries(porAutor).sort((a, b) => b[1] - a[1])
    const lideres = autores.length ? autores.filter(([, n]) => n === autores[0][1]) : []
    const invEd = {}; O.forEach(o => { const v = sumValor(o); if (v > 0) { const k = edOf(o) || '—'; invEd[k] = (invEd[k] || 0) + v } })
    const top = (obj, n = 7) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)

    const buckets = []; for (let v = 0.5; v <= 5.0001; v += 0.5) buckets.push(Math.round(v * 10) / 10)
    const counts = buckets.map(b => units.filter(u => Number(u.nota) === b).length)

    const completas = O.filter(o => { const t = tipoOf(o); if (t !== 'serie' && t !== 'box') return false; const tot = unitsOf(o).length; return tot > 0 && ownedCount(o) >= tot }).length

    return {
      invest, retorno, tenho: owned.length, quero: want.length, saiu: saiu.length,
      pctLido, lidos, ownedLen: units.length,
      avg, notaMed, obras: O.length, itens: units.length,
      importados: O.filter(isImp).length, urgentes: O.filter(anyUrg).length, completas,
      topEd: top(byEd), topInv: top(invEd),
      editorasDistintas: Object.keys(byEd).length,
      autoresDistintos: autores.length, lideres,
      buckets, counts,
    }
  }, [src])

/* A CAPA DA EDIÇÃO.
 *
 * A tela abre como capa de revista porque a capa existe exatamente para
 * dizer, em três ou quatro linhas, o que vale a pena nesta edição — que é o
 * trabalho de uma tela de estatísticas. Despejar vinte números com o mesmo
 * peso é o contrário disso.
 *
 * AS CHAMADAS TÊM REGRA, senão viram enfeite. São quatro vagas fixas, cada
 * uma respondendo a uma pergunta própria, e a vaga SOME quando não há número
 * para ela. Nada de escolher o fato mais "interessante" na hora: ordem fixa
 * é previsível, e previsível é o que deixa comparar a capa de hoje com a
 * lembrança da de um mês atrás.
 *
 * 1. o tamanho      — quantas obras, quantos itens
 * 2. a editora      — quem mais publica na sua estante
 * 3. o autor        — quem mais aparece, empate incluído
 * 4. a posse        — o que é seu contra o que ainda é desejo
 */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

// barras de larguras irregulares: código de barras é desenho, não dado
const BARRAS = [1, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2]

function Chamada({ n, children, grande }) {
  return (
    <div className="flex gap-3 items-baseline">
      <span className="font-mono text-rotulo font-bold text-gold pt-1 shrink-0 tracking-wider">
        {String(n).padStart(2, '0')}
      </span>
      <span className={grande
        ? 'font-display font-extrabold text-titulo sm:text-display leading-[0.98] text-sobre-acento'
        : 'font-display font-semibold text-obra sm:text-secao leading-tight text-sobre-acento'}>
        {children}
      </span>
    </div>
  )
}

const Realce = ({ children }) => <span className="text-[#F2D98B]">{children}</span>

function Capa({ s, escopo }) {
  const agora = new Date()
  const chamadas = []

  chamadas.push(<>A coleção bate <Realce>{s.obras} obras</Realce>{s.itens !== s.obras ? <> e {s.itens} itens</> : null}</>)

  const [edLider, edQtd] = s.topEd[0] || []
  if (edLider && edLider !== '—') chamadas.push(<>{edLider} lidera com <Realce>{edQtd}</Realce></>)

  if (s.lideres.length) {
    const nomes = s.lideres.slice(0, 2).map(([n]) => n)
    const qtd = s.lideres[0][1]
    chamadas.push(s.lideres.length > 1
      ? <>{nomes.join(' e ')} empatam em <Realce>{qtd}</Realce> cada</>
      : <>{nomes[0]} aparece em <Realce>{qtd}</Realce></>)
  }

  if (s.tenho || s.quero) {
    chamadas.push(s.quero > s.tenho
      ? <>Só <Realce>{s.tenho}</Realce> na estante — {s.quero} ainda são desejo</>
      : <><Realce>{s.tenho}</Realce> na estante, {s.lidos} já {s.lidos === 1 ? 'lido' : 'lidos'}</>)
  }

  return (
    <div className="relative overflow-hidden bg-moss text-sobre-acento px-5 sm:px-6 py-5 sm:py-6 flex flex-col gap-6">
      {/* o brilho do papel couché, no canto de cima */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(120% 70% at 85% 0%, rgba(255,253,248,.16), transparent 60%)' }} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="font-cartaz font-extrabold uppercase text-titulo sm:text-display leading-[0.85] tracking-tighter">
          Gibiteca
        </div>
        <div className="font-mono text-rotulo uppercase tracking-widest text-right leading-relaxed opacity-85 shrink-0">
          {escopo === 'filtered'
            ? <>Edição especial<br />Filtro atual</>
            : <>Nº {agora.getMonth() + 1}<br />{MESES[agora.getMonth()]} {agora.getFullYear()}</>}
        </div>
      </div>

      <div className="relative flex flex-col gap-3.5">
        {chamadas.map((c, i) => <Chamada key={i} n={i + 1} grande={i === 0}>{c}</Chamada>)}
      </div>

      <div className="relative flex items-end justify-between gap-3 pt-3 border-t border-sobre-acento/25">
        <div aria-hidden="true" className="flex items-end gap-[2px] h-[30px]">
          {BARRAS.map((l, i) => (
            <span key={i} className="block bg-sobre-acento/90" style={{ width: l + 'px', height: (l === 1 ? 22 : 30) + 'px' }} />
          ))}
        </div>
        <div className="font-mono text-rotulo text-right leading-relaxed whitespace-nowrap">
          {fmtBRL(s.invest)}<br />
          <span className="opacity-75">{s.retorno > 0 ? `investido · ${fmtBRL(s.retorno)} de volta` : 'investido até aqui'}</span>
        </div>
      </div>
    </div>
  )
}

const Kpi = ({ n, l, money, sub }) => (
    <div className="bg-surface px-5 py-6">
      <div className={`font-mono font-medium tabular-nums whitespace-nowrap ${money ? 'text-secao text-acento-texto' : 'text-titulo text-ink'}`}>
        {money ? fmtBRL(n) : <Ticker value={n} />}{!money && sub ? <span className="text-corpo text-ink-faint font-sans font-semibold">{sub}</span> : null}
      </div>
      <div className="font-rotulo text-rotulo uppercase text-ink-faint mt-2">{l}</div>
    </div>
  )

  return (
    <Moldura aberto={open} onFechar={onClose} z="z-[60]" largura="sm:max-w-[720px]" altura="sm:max-h-[92vh]">
            {/* No celular o seletor de escopo DESCE para uma faixa própria: na
                mesma linha do título ele espremia a palavra em três linhas, e
                um título de uma palavra não deveria quebrar. No desktop sobra
                largura, então ele continua ao lado. */}
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-linha">
              <h3 className="font-cartaz font-semibold uppercase text-secao text-ink flex-1">Estatísticas</h3>
              <div className="hidden sm:flex rounded-pequeno border border-separador overflow-hidden text-apoio font-medium">
                {[['all', 'Coleção'], ['filtered', 'Filtro atual']].map(([v, l]) => (
                  <button key={v} onClick={() => setScope(v)} className={`px-3.5 py-1.5 transition-colors ${scope === v ? 'bg-ink text-paper' : 'bg-transparent text-ink-soft hover:text-ink'}`}>{l}</button>
                ))}
              </div>
              <button className="neo-icon !w-9 !h-9" onClick={onClose} aria-label="Fechar">×</button>
            </div>
            <div className="sm:hidden px-5 py-3 border-b border-linha">
              <div className="flex rounded-pequeno border border-separador overflow-hidden text-apoio font-medium">
                {[['all', 'Coleção'], ['filtered', 'Filtro atual']].map(([v, l]) => (
                  <button key={v} onClick={() => setScope(v)} className={`flex-1 px-3.5 py-2 transition-colors ${scope === v ? 'bg-ink text-paper' : 'bg-transparent text-ink-soft hover:text-ink'}`}>{l}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {s.obras === 0 ? (
                <div className="px-6 py-16 text-center text-ink-faint">
                  Sem dados neste escopo. {scope === 'filtered' ? 'Ajuste os filtros' : 'Carregue sua coleção pelo Backup'}.
                </div>
              ) : (
                <>
                  <Capa s={s} escopo={scope} />

                  {/* O MIOLO. A capa já deu os destaques; aqui vem o resto,
                      todos com o mesmo peso entre si porque nenhum é manchete. */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-linha border-t border-linha">
                    <Kpi n={s.invest} l="Investimento" money />
                    <Kpi n={s.retorno} l="Retorno" money />
                    <Kpi n={s.saiu} l="Tive" />
                    <Kpi n={s.pctLido} l={`Lidos (${s.lidos}/${s.ownedLen})`} sub="%" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-linha border-t border-linha">
                    <Kpi n={s.obras} l="Obras" />
                    <Kpi n={s.itens} l="Itens (volumes)" />
                    <Kpi n={s.autoresDistintos} l="Autores" />
                    <Kpi n={s.editorasDistintas} l="Editoras" />
                  </div>
                  {/* três colunas, não quatro: com quatro sobrava uma célula
                      vazia, que lê como dado que não carregou */}
                  <div className="grid grid-cols-3 gap-px bg-linha border-t border-linha">
                    <Kpi n={s.importados} l="Importados" />
                    <Kpi n={s.completas} l="Séries completas" />
                    <Kpi n={s.urgentes} l="Urgentes" />
                  </div>

                  {/* médias */}
                  <div className="grid grid-cols-2 gap-4 px-5 sm:px-6 py-6 border-t border-linha">
                    <div className="rounded-medio border border-moss/15 bg-tinta-moss px-5 py-6">
                      <div className="font-mono text-titulo font-medium tabular-nums whitespace-nowrap text-acento-texto">{s.notaMed ? s.notaMed.toFixed(1) : '—'}{s.notaMed ? <span className="text-gold text-obra ml-1">★</span> : null}</div>
                      <div className="font-rotulo text-rotulo uppercase text-acento-texto/70 mt-2">Nota média</div>
                    </div>
                    <div className="rounded-medio border border-moss/15 bg-tinta-moss px-5 py-6">
                      <div className="font-mono text-secao font-medium tabular-nums whitespace-nowrap text-acento-texto">{fmtBRL(s.avg)}</div>
                      <div className="font-rotulo text-rotulo uppercase text-acento-texto/70 mt-2">Valor médio por item</div>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 py-8 border-t border-linha"><Histogram counts={s.counts} buckets={s.buckets} /></div>

                  <div className="px-5 sm:px-6 pt-8 pb-10 border-t border-linha grid sm:grid-cols-2 gap-x-10 gap-y-9">
                    <Bars title="Itens por editora" data={s.topEd} />
                    <Bars title="Investimento por editora" data={s.topInv} money />
                  </div>
                </>
              )}
            </div>
    </Moldura>
  )
}

import { motion } from 'framer-motion'
import Moldura from './Moldura.jsx'
import { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import {
  unitsOf, edOf, isImp, tipoOf, anyUrg, ownedCount, fmtBRL, posseDe, authorsOf,
} from '../lib/helpers.js'

/* ---------- o campo das notas ----------
   A média mora no cabeçalho do histograma, e não numa caixa própria: é a
   mesma informação resumida, e separada ela virava um número solto. */
function Notas({ s }) {
  const max = Math.max(1, ...s.counts)
  const counts = s.counts, buckets = s.buckets
  return (
    <div className="rounded-medio border border-linha bg-paper px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h4 className="font-display text-obra text-ink">Distribuição de notas</h4>
        <span className="flex items-baseline gap-1.5 shrink-0">
          <span className="font-rotulo text-rotulo uppercase text-ink-mute">média</span>
          <span className="font-mono text-obra font-medium tabular-nums text-acento-texto whitespace-nowrap">
            {s.notaMed ? <>{s.notaMed.toFixed(1)}<span className="text-gold ml-0.5">★</span></> : '—'}
          </span>
        </span>
      </div>
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
  /* A TELA É SEMPRE A COLEÇÃO INTEIRA. Havia um seletor "Coleção · Filtro
     atual" na capa: uma edição de estatísticas que mudava conforme o filtro
     que ficou ligado lá atrás não é comparável com a de ontem. */
  const { obras } = useStore()

  const s = useMemo(() => {
    const O = obras
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
    const maisCara = paid.reduce((m, u) => Math.max(m, Number(u.valorPago) || 0), 0)
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
    const top = (obj, n = 7) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)

    const buckets = []; for (let v = 0.5; v <= 5.0001; v += 0.5) buckets.push(Math.round(v * 10) / 10)
    const counts = buckets.map(b => units.filter(u => Number(u.nota) === b).length)

    const completas = O.filter(o => { const t = tipoOf(o); if (t !== 'serie' && t !== 'box') return false; const tot = unitsOf(o).length; return tot > 0 && ownedCount(o) >= tot }).length

    return {
      invest, retorno, tenho: owned.length, quero: want.length, saiu: saiu.length,
      pctLido, lidos, ownedLen: units.length,
      avg, notaMed, obras: O.length, itens: units.length,
      importados: O.filter(isImp).length, urgentes: O.filter(anyUrg).length, completas,
      topEd: top(byEd), maisCara, pagos: paid.length,
      editorasDistintas: Object.keys(byEd).length,
      autoresDistintos: autores.length, lideres,
      buckets, counts,
    }
  }, [obras])

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

function Capa({ s, onFechar }) {
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

      {/* A capa é o cabeçalho. Uma barra de título em cima dela repetia a
          palavra "estatísticas" duas vezes em 60px de altura; o fechar veio
          para cá, e a data saiu para o × ocupar a vaga do canto. */}
      <div className="relative flex items-start justify-between gap-3">
        {/* No celular a palavra não cabe ao lado do ×: 309px de logotipo em
            287 de linha. Cai para 22px, e aí sobra folga mesmo com o texto
            ampliado nas configurações. */}
        <div className="font-cartaz font-extrabold uppercase text-[calc(22px*var(--escala))] sm:text-display leading-[0.85] tracking-tighter min-w-0">
          Estatísticas
        </div>
        <button onClick={onFechar} aria-label="Fechar"
          className="shrink-0 w-9 h-9 rounded-pequeno border border-sobre-acento/40 text-sobre-acento text-secao leading-none hover:bg-sobre-acento/15 transition-colors">×</button>
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

/* O EXPEDIENTE — a caixa de letra miúda da página 2.
 *
 * É onde uma revista põe tiragem, endereço e ISSN: fatos que ninguém lê em
 * sequência, mas que alguém um dia precisa achar. As contagens da coleção são
 * exatamente isso, e estavam em onze caixas do tamanho de manchete, todas
 * gritando no mesmo volume.
 *
 * A linha pontilhada entre o rótulo e o número é a do índice de revista, e é
 * ela que deixa o olho correr pela coluna sem se perder de linha. */
function Linha({ rotulo, valor }) {
  return (
    <div className="flex items-baseline gap-1.5 break-inside-avoid py-[3px]">
      <span className="text-ink-faint whitespace-nowrap">{rotulo}</span>
      <span className="flex-1 border-b border-dotted border-moss-line -translate-y-[3px]" />
      <span className="font-bold tabular-nums whitespace-nowrap">{valor}</span>
    </div>
  )
}

function Expediente({ s }) {
  return (
    <div className="px-5 sm:px-6 py-5 border-t border-linha">
      <div className="font-rotulo text-rotulo uppercase tracking-[.14em] text-ink-mute flex items-center gap-2.5 mb-3">
        Expediente<span className="flex-1 h-px bg-moss-line" />
      </div>
      {/* duas colunas de verdade (CSS columns), para a lista quebrar sozinha
          no meio e não precisar de um número fixo por coluna */}
      <div className="columns-1 sm:columns-2 gap-x-9 font-mono text-apoio">
        <Linha rotulo="obras" valor={s.obras} />
        <Linha rotulo="itens (volumes)" valor={s.itens} />
        <Linha rotulo="autores e artistas" valor={s.autoresDistintos} />
        <Linha rotulo="editoras" valor={s.editorasDistintas} />
        <Linha rotulo="edições importadas" valor={s.importados} />
        <Linha rotulo="séries completas" valor={s.completas} />
        <Linha rotulo="marcados como urgentes" valor={s.urgentes} />
        <Linha rotulo="já tive" valor={s.saiu} />
        <Linha rotulo="lidos" valor={`${s.lidos} de ${s.itens}`} />
      </div>
    </div>
  )
}

/* O CUPOM — o destacável com a linha pontilhada e a tesourinha.
 *
 * O dinheiro pede um lugar fechado e sério, e não um número solto no meio de
 * contagens de obra. O cupom é o único objeto de revista que fala de dinheiro,
 * e por isso é onde ele cabe. */
function Cupom({ s }) {
  return (
    <div className="relative rounded-medio border-2 border-dashed border-moss-3 bg-paper px-5 py-4">
      <span aria-hidden="true" className="absolute -top-[11px] left-4 bg-surface px-1.5 leading-none text-moss-3 text-obra">✂</span>

      <div className="font-rotulo text-rotulo uppercase tracking-[.12em] text-ink-faint mb-2">Investimento</div>
      <div className="font-display font-extrabold text-titulo sm:text-display leading-none tabular-nums">{fmtBRL(s.invest)}</div>
      <div className="text-corpo text-ink-faint mt-1">
        em {s.pagos} {s.pagos === 1 ? 'item' : 'itens'}
      </div>

      {/* os três em linha pontilhada, como no expediente: em meia largura os
          cartõezinhos lado a lado quebravam no meio de um valor */}
      <div className="mt-4 pt-2 border-t border-moss-line font-mono text-apoio">
        <Linha rotulo="média por item" valor={fmtBRL(s.avg)} />
        <Linha rotulo="a mais cara" valor={fmtBRL(s.maisCara)} />
        <Linha rotulo="retorno" valor={fmtBRL(s.retorno)} />
      </div>
    </div>
  )
}

  return (
    <Moldura aberto={open} onFechar={onClose} z="z-[60]" largura="sm:max-w-[720px]" altura="sm:max-h-[92vh]">
            <div className="flex-1 overflow-auto sem-barra">
              {s.obras === 0 ? (
                <div className="relative px-6 py-16 text-center text-ink-faint">
                  {/* o × desta tela é o único: sem capa não há canto onde
                      ele more, e no celular o modal ocupa a tela toda —
                      não há "fora" para clicar */}
                  <button className="neo-icon !w-9 !h-9 absolute top-4 right-4" onClick={onClose} aria-label="Fechar">×</button>
                  Sem dados ainda. Carregue sua coleção pelo Backup.
                </div>
              ) : (
                <>
                  <Capa s={s} onFechar={onClose} />

                  {/* O MIOLO. A capa deu os destaques; o resto vem nas partes
                      da revista onde cada tipo de informação já mora. */}
                  <Expediente s={s} />

                  {/* dinheiro e notas lado a lado: são os dois juízos sobre a
                      mesma coleção, um do bolso e um do gosto */}
                  <div className="px-5 sm:px-6 pt-6 pb-8 border-t border-linha grid sm:grid-cols-2 gap-5 items-start">
                    <Cupom s={s} />
                    <Notas s={s} />
                  </div>
                </>
              )}
            </div>
    </Moldura>
  )
}

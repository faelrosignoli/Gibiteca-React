import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useStore } from '../lib/store.jsx'
import Estrelas from './Estrelas.jsx'
import { MOLA_TOQUE } from '../lib/motion.js'
import {
  coverOf, unidadeVitrine, urgenteNaVitrine, tipoOf, edOf, ownedCount, unitsOf, missingVols, avgNota,
  anyUrg, statusMatch, initials, tintFor, isImp,
} from '../lib/helpers.js'

// selo de urgente — quadrado arredondado cor rust + triângulo branco
function UrgBadge() {
  return (
    <span className="absolute top-2.5 right-2.5 z-[4] w-[26px] h-[26px] rounded-pequeno bg-rust text-white flex items-center justify-center shadow-[0_2px_8px_rgba(35,39,28,.3)]" title="Urgente">
      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" />
      </svg>
    </span>
  )
}

/* Selo de tipo (série / box).
 *
 * Ficava no canto inferior esquerdo DA CAPA e tapava a arte — numa capa que
 * preenche o quadrado não existe canto vazio para ele ocupar. Desceu para o
 * corpo do cartão, onde não cobre nada.
 *
 * Ele já dizia a contagem ("Série 4"), a mesma coisa que a linha "4 volumes"
 * logo abaixo. Agora que estão lado a lado, o selo ficou com o recado e a
 * linha saiu — a informação não precisava aparecer duas vezes.
 */
function TypeBadge({ t, count }) {
  const base = 'inline-flex items-center gap-1 shrink-0 font-mono text-rotulo font-extrabold uppercase px-1.5 py-0.5 rounded-pequeno text-white'
  if (t === 'box') return (
    <span className={`${base} bg-box`}>
      <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 8l9-5 9 5-9 5-9-5zM3 8v8l9 5 9-5V8" /></svg>Box {count || ''}
    </span>
  )
  if (t === 'serie') return (
    <span className={`${base} bg-moss`}>
      <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M4 5h10v14H4zM17 7h3v12h-3" /></svg>Série {count || ''}
    </span>
  )
  return null
}

export default function Card({ obra, index = 0, onOpen, feature = false }) {
  // com o filtro em "Tenho"/"Quero", a capa vem do volume que combina — mas o
  // título continua sendo o da série: é por ela que a obra é reconhecida
  const { filters } = useStore()
  const cover = coverOf(obra, filters.status)
  const vitrine = unidadeVitrine(obra, filters.status)
  const volDaVez = vitrine ? (vitrine.nome || '').trim() : ''
  const t = tipoOf(obra)
  const multi = t === 'serie' || t === 'box'
  const total = unitsOf(obra).length
  const owned = ownedCount(obra)
  const miss = missingVols(obra)
  const nota = avgNota(obra)
  const hasNote = obra.resenha && obra.resenha.trim()
  const owns = statusMatch(obra, 'biblioteca')

  // tilt 3D (sem brilho)
  const px = useMotionValue(0.5), py = useMotionValue(0.5)
  const rotY = useSpring(useTransform(px, [0, 1], [5, -5]), { stiffness: 200, damping: 16 })
  const rotX = useSpring(useTransform(py, [0, 1], [-5, 5]), { stiffness: 200, damping: 16 })
  const onMove = (e) => {
    if (e.pointerType === 'touch') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => { px.set(0.5); py.set(0.5) }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, delay: Math.min(index * 0.045, 0.36), ease: [0.32, 0.72, 0, 1] }}
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 720 }}
      whileHover={{ y: -4 }}
      // whileTap dispara no pointerdown: o cartão reage ao encostar,
      // não ao soltar. É a diferença entre parecer vivo e parecer atrasado.
      whileTap={{ scale: 0.975, transition: MOLA_TOQUE }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={() => onOpen?.(obra)}
      // grade de ate 30 cartoes animando entrada e hover: avisar o compositor
      // evita repintura. So transform e opacity, as duas propriedades que ele
      // acelera de graca (Oryzo declara will-change em 58 regras).
      style={{ willChange: 'transform, opacity' }}
      className="bezel group cursor-pointer h-full"
    >
      <div className="bezel-core group-hover:shadow-amb-lg p-2 sm:p-3 xl:p-3.5 flex flex-col">
        {/* capa — caixa QUADRADA fixa, para todas as linhas alinharem.
            A capa fica contida dentro dela: formato natural, sem recorte
            (a regra do projeto permite "altura fixa + w-auto"). */}
        <div className={`relative flex items-center justify-center aspect-square`}>
          {cover ? (
            /* absolute + inset-0 + m-auto: so assim o max-h-full tem uma
               altura definida para resolver contra, senao a capa alta estica
               a caixa e desalinha a linha inteira */
            <img
              src={cover} alt="" loading="lazy"
 className="absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain rounded-pequeno shadow-[0_18px_30px_-18px_rgba(35,39,28,.55)]"
            />
          ) : (
            <div className={`w-full h-full rounded-medio p-3 sm:p-3.5 flex flex-col text-white shadow-[0_18px_30px_-18px_rgba(35,39,28,.55)] ${feature ? 'lg:min-h-[260px]' : ''}`}
                 style={{ background: `linear-gradient(155deg, ${tintFor(edOf(obra) || obra.nome)}, ${tintFor(edOf(obra) || obra.nome)}cc)` }}>
              {(edOf(obra) || (isImp(obra) ? 'Importado' : '')) &&
                <div className="font-mono text-rotulo uppercase opacity-85 truncate">{edOf(obra) || 'Importado'}</div>}
              <div className={`font-display font-semibold leading-none my-auto text-center  ${feature ? 'text-[clamp(22px,5vw,48px)] lg:text-[clamp(44px,6vw,86px)]' : 'text-[clamp(22px,5vw,48px)]'}`}>
                {initials(obra.nome)}
              </div>
              <div className="font-display text-rotulo sm:text-apoio leading-snug opacity-95 line-clamp-2">{obra.nome}</div>
            </div>
          )}
          {urgenteNaVitrine(obra, filters.status) && <UrgBadge />}
        </div>

        {/* corpo */}
        <div className={`pt-2.5 sm:pt-4 px-0.5 sm:px-1 pb-1 flex flex-col gap-1 sm:gap-1.5 flex-1`}>
          {edOf(obra) && (
            <div className="font-mono text-rotulo font-medium uppercase text-moss-2 truncate">{edOf(obra)}</div>
          )}
          <div className={`font-display font-semibold leading-tight text-ink line-clamp-2 ${feature ? 'text-corpo sm:text-obra lg:text-titulo' : 'text-corpo sm:text-obra xl:text-secao'}`}>
            {obra.nome}{hasNote && <span className="text-gold text-corpo ml-1.5 align-middle" title="Tem anotação">✎</span>}
          </div>
          {/* contagem e informacao categorica: vira rotulo em caixa alta.
              Nome de pessoa continua texto — rotulo so serve para categoria. */}
          {multi ? (
            <div className="flex items-center gap-2 min-w-0">
              <TypeBadge t={t} count={total} />
              {/* sob filtro a capa é de um volume específico — o nome dele
                  entra ao lado do selo */}
              {volDaVez && (
                <span className="font-mono text-rotulo uppercase text-ink-faint truncate">{volDaVez}</span>
              )}
            </div>
          ) : (
            <div className="text-apoio text-ink-faint truncate">
              {obra.roteirista || obra.desenhista || '—'}
            </div>
          )}

          {/* O destaque ocupa duas linhas da grade, mas a arte é quadrada —
              sobra altura. Em vez de vão morto, a sobra recebe um trecho da
              resenha. Só no destaque e só a partir de lg:, onde ela existe. */}
          {feature && hasNote && (
            <p className="hidden lg:block text-apoio text-ink-faint leading-relaxed line-clamp-4 pt-1">
              {obra.resenha}
            </p>
          )}

          <div className={`pt-2.5 sm:pt-3.5 mt-auto`}>
            {/* a barra conta a série inteira — sob "Tenho"/"Quero" a grade
                mostra um volume, e a barra falaria de outra coisa */}
            {multi && total > 0 && filters.status === 'todos' && (
              <>
                <div className="h-[2px] rounded-full bg-linha overflow-hidden">
                  <div className="h-full bg-moss rounded-full" style={{ width: `${Math.round(owned / total * 100)}%` }} />
                </div>
                <div className="mt-2 font-mono text-rotulo uppercase text-ink-faint">
                  {owned >= total
                    ? 'coleção completa'
                    : miss.length ? `faltam ${total - owned} de ${total}` : ''}
                </div>
              </>
            )}
            <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* sob filtro o cartão fala de um volume: o selo tem que ser o
                  desse volume, não o da série inteira */}
              {vitrine ? (
                <span className={`pill ${vitrine.status === 'biblioteca' ? 'pill-tenho' : 'pill-quero'}`}>
                  {vitrine.status === 'biblioteca' ? 'Tenho' : 'Quero'}
                </span>
              ) : (
                <span className={`pill ${owns ? 'pill-tenho' : 'pill-quero'}`}>
                  {multi && owns && owned < total ? `Tenho ${owned}/${total}` : owns ? 'Tenho' : 'Quero'}
                </span>
              )}
              {isImp(obra) && <span className="pill pill-imp">Importado</span>}
              {nota > 0 && <Estrelas n={nota} />}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

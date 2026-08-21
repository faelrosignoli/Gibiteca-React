/* Estrelas de nota — uma implementação só, usada pela grade, pela lista, pelo
 * detalhe e pelo Editor. Antes eram três cópias quase iguais, e as três
 * "resolviam" a meia estrela com opacidade: a estrela inteira ficava mais
 * fraca, o que lia como "estrela apagada", não como metade.
 *
 * Aqui a metade é metade mesmo: a estrela dourada é desenhada por cima da
 * vazia e recortada no meio com clip-path. Desenho em SVG e não no caractere
 * ★ de propósito — a entreletras da escala tipográfica entra na largura do
 * glifo e o corte de 50% cairia fora do meio da estrela.
 */

const ESTRELA = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'

function Estrela({ cheio, tamanho }) {
  return (
    <span className={`relative inline-block shrink-0 ${tamanho}`}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full block text-ink-mute">
        <path d={ESTRELA} />
      </svg>
      {cheio > 0 && (
        <svg
          viewBox="0 0 24 24" fill="currentColor"
          className="absolute inset-0 w-full h-full block text-gold"
          // metade = recorta a direita; inteira = sem recorte
          style={cheio < 1 ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
        >
          <path d={ESTRELA} />
        </svg>
      )}
    </span>
  )
}

// quanto de cada estrela está pintado: 1, 0.5 ou 0
const quanto = (n, i) => (n >= i ? 1 : n >= i - 0.5 ? 0.5 : 0)

/* leitura */
export default function Estrelas({ n, tamanho = 'w-4 h-4', className = '' }) {
  if (!n) return null
  return (
    <span
      className={`inline-flex items-center gap-0.5 align-middle ${className}`}
      aria-label={`nota ${String(n).replace('.', ',')} de 5`}
    >
      {[1, 2, 3, 4, 5].map(i => <Estrela key={i} cheio={quanto(n, i)} tamanho={tamanho} />)}
    </span>
  )
}

/* edição — clicar na mesma estrela alterna entre inteira e metade */
export function EstrelasInput({ value = 0, onChange, tamanho = 'w-6 h-6' }) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i} type="button"
          onClick={() => onChange(value === i ? i - 0.5 : i)}
          aria-label={`dar nota ${i}`}
          className="transition-transform duration-200 hover:scale-110 leading-none"
        >
          <Estrela cheio={quanto(value, i)} tamanho={tamanho} />
        </button>
      ))}
      {value > 0 && (
        <button type="button" onClick={() => onChange(0)} className="ml-2 text-apoio text-ink-faint underline">
          limpar
        </button>
      )}
    </div>
  )
}

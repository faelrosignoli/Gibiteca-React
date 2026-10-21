/* CONTROLES DE FORMULÁRIO COMPARTILHADOS.
 *
 * Moraram dentro do `Editor.jsx` enquanto o editor era o único lugar do app
 * onde se escrevia alguma coisa sobre uma obra. Deixou de ser: a ficha da
 * obra (`DetailSheet`) passou a editar status, urgência, leitura, nota, valor
 * e anotação ali mesmo, sem abrir o editor.
 *
 * São dois arquivos usando os mesmos controles, e controle de formulário
 * duplicado é o tipo de coisa que diverge sem ninguém perceber: um ganha um
 * estado de foco, o outro não, e a mesma pergunta passa a ter duas caras
 * dependendo da porta por onde se entrou.
 */

/* O PAR DE OPÇÕES EXCLUSIVAS: Quero/Tenho, Avulso/Box/Série, Nacional/
   Importado. Trilha única com a escolhida preenchida em acento — a forma diz
   "uma destas", não "ligue as que quiser". */
export function Switch({ options, value, onChange }) {
  return (
    <div className="flex w-full rounded-full border border-contorno overflow-hidden">
      {options.map(([v, l]) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
 className={`flex-1 text-corpo font-semibold py-2 px-2 transition ${value === v ? 'bg-moss text-sobre-acento' : 'bg-surface text-ink-soft hover:bg-paper-2'}`}>{l}</button>
      ))}
    </div>
  )
}

/* Checkbox com a MESMA ALTURA dos campos de texto (42px), para alinhar quando
   os dois dividem uma linha ou uma coluna. Um checkbox nativo tem a altura do
   seu quadradinho, e ao lado de um input ele flutua no meio do nada.

   `danger` troca o acento por rust: é o que separa "urgente" — um alerta — de
   "lido", que é só um fato. */
export function CheckTile({ checked, onChange, danger, children }) {
  return (
    <label className={`flex items-center gap-2.5 rounded-full border h-[42px] px-3.5 text-corpo font-semibold cursor-pointer transition select-none ${checked ? (danger ? 'border-rust text-rust bg-surface-2' : 'border-moss text-acento-texto bg-surface-2') : 'border-contorno text-ink-soft bg-surface hover:bg-paper-2'}`}>
      <input type="checkbox" className={`w-[16px] h-[16px] ${danger ? 'accent-rust' : 'accent-moss'}`} checked={checked} onChange={onChange} />
      {children}
    </label>
  )
}

/* O rótulo acima de um campo, e a caixa que empilha os dois. Ficam aqui pelo
   mesmo motivo dos controles: são a medida que faz um campo parecer com o
   campo do lado. */
export const lbl = 'font-rotulo text-rotulo uppercase text-ink-soft pl-0.5'
export const box = 'flex flex-col gap-1'

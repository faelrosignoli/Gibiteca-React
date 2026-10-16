import { useState } from 'react'
import { motion } from 'framer-motion'
import { MOLA_CALMA } from '../lib/motion.js'
import Marca from './Marca.jsx'

/* Página de boas-vindas: a capa da gibiteca.
 *
 * Uma imagem grande ocupando a tela, o logo grande um pouco abaixo do topo, e
 * um botão no rodapé que leva à coleção.
 *
 * NÃO há cabeçalho aqui. O logo é o MESMO elemento do logo da barra aos olhos
 * do framer-motion — os dois carregam `layoutId="marca"` —, então ao entrar na
 * coleção a marca viaja daqui até a barra encolhendo, em vez de uma sumir e
 * outra aparecer. Quem garante que os dois nunca coexistem é o ternário do
 * App: dois elementos com o mesmo layoutId ao mesmo tempo quebram a animação.
 *
 * `aberturaNoAr` existe pelo mesmo motivo: enquanto a tela de abertura está no
 * ar, ela é quem desenha a marca, e esta precisa ficar calada.
 *
 * A IMAGEM ainda não existe no projeto: ponha o arquivo em
 * `public/welcome.jpg` e ele aparece sozinho. O arquivo vai para o site
 * intacto — `public/` é copiado byte a byte, sem reencodar; o que pode
 * borrar é AMPLIAÇÃO, e a regra está no `.welcome__imagem` do index.css. Enquanto não houver, a página
 * não quebra — o `onError` esconde a imagem e fica o papel com o logo e o
 * botão. Era isso ou um ícone de imagem quebrada ocupando a tela inteira.
 */
const IMAGEM = `${import.meta.env.BASE_URL}welcome.jpg`

export default function Welcome({ onEntrar, aberturaNoAr = false }) {
  const [semImagem, setSemImagem] = useState(false)

  return (
    <main className="welcome">
      {!semImagem && (
        <img
          src={IMAGEM}
          alt=""
          aria-hidden="true"
          className="welcome__imagem"
          onError={() => setSemImagem(true)}
        />
      )}

      {/* O logo fica abaixo do topo de propósito: é daqui que ele sobe até a
          barra. Começar colado no alto tornaria a viagem quase imperceptível,
          e é justamente o deslocamento que conta a história. */}
      <div className="welcome__marca">
        {!aberturaNoAr && (
          <motion.span layoutId="marca" transition={MOLA_CALMA} className="relative inline-flex">
            <Marca className="w-[min(78vw,420px)] h-auto" />
          </motion.span>
        )}
      </div>

      {/* Sem véu atrás do botão: a imagem chega limpa até a borda de baixo. */}
      <div className="welcome__rodape">
        {/* Só o texto, sem o disco da seta. O `.cta` nasceu com padding
            assimétrico (bastante à esquerda, pouco à direita) justamente para
            abrigar esse disco; sem ele o botão ficaria torto, e o
            `.welcome__botao` devolve a simetria.

            O texto fica em caixa alta por CSS e não escrito em maiúsculas:
            assim o nome acessível continua "Minha Coleção", do jeito que se
            fala. */}
        <button type="button" className="cta cta-carimbo welcome__botao" onClick={onEntrar}>
          Minha Coleção
        </button>
      </div>
    </main>
  )
}

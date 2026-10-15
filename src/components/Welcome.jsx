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
 * `public/welcome.jpg` e ele aparece sozinho. Enquanto não houver, a página
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

      {/* O véu atrás do botão não é enfeite: sem saber que imagem virá, um
          botão claro pode cair sobre área clara e sumir. O degradê garante
          contraste seja qual for a foto. */}
      <div className="welcome__rodape">
        <button type="button" className="cta cta-carimbo welcome__botao" onClick={onEntrar}>
          Minha Gibiteca
          <span className="knob" aria-hidden="true">
          </span>
        </button>
      </div>
    </main>
  )
}

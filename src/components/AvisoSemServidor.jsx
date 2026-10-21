import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Faixa } from './AvisoSemEspaco.jsx'

/* AVISO TEMPORÁRIO: o servidor ainda não existe.
 *
 * Hoje a conta é só deste navegador e a coleção também. Quem não conectar ao
 * GitHub está guardando a coleção inteira num lugar que some com um "limpar
 * dados do navegador" — e não tem como saber disso sozinho, porque o app se
 * comporta exatamente como se estivesse salvo.
 *
 * SÓ NA PORTA DE ENTRADA (ver Entrada.jsx), nunca dentro da coleção. Esteve no
 * topo da estante e saiu: ali era uma faixa de alerta permanente sobre algo
 * que não acabou de acontecer, por cima justamente do que a pessoa abriu o app
 * para ver. Alerta que está sempre ali vira paisagem e deixa de alertar.
 *
 * Na entrada o momento é outro: não há coleção na tela para atrapalhar, e é a
 * hora em que a pergunta "onde isso vai ficar guardado?" realmente se faz.
 *
 * ESTE ARQUIVO TEM PRAZO. Quando o servidor entrar no ar, ele sai inteiro,
 * junto da linha que o chama no App. Está separado por isso: um aviso
 * provisório misturado ao AvisoSemEspaco viraria permanente por inércia, e
 * daqui a seis meses alguém leria "o servidor ainda não está funcionando"
 * num app com servidor.
 *
 * SÓ APARECE PARA QUEM NÃO CONECTOU. Com a nuvem ligada, a coleção já está
 * num repositório e o aviso não tem o que avisar.
 *
 * DÁ PARA FECHAR, e o fechamento é lembrado — ao contrário dos avisos de
 * falha, que voltam a cada falha nova. Aqui não há evento que se repita: a
 * pendência é a mesma todo dia, e trazê-la de volta a cada visita seria
 * cobrança, não aviso. Quem fechar encontra o caminho no texto, que é por
 * isso que ele está escrito lá: ☰ › Seus dados › Perfil.
 */
const CHAVE = 'gibiteca_aviso_servidor'

function jaDispensou() {
  try { return localStorage.getItem(CHAVE) === '1' } catch (e) { return false }
}

export default function AvisoSemServidor({ onTutorial }) {
  const { cloud } = useStore()
  const [dispensado, setDispensado] = useState(jaDispensou)

  const fechar = () => {
    setDispensado(true)
    try { localStorage.setItem(CHAVE, '1') } catch (e) { /* sem storage: volta na próxima visita */ }
  }

  return (
    <AnimatePresence>
      {!cloud.connected && !dispensado && (
        <Faixa
          tom="gold"
          titulo="O servidor ainda não está no ar"
          aoFechar={fechar}
          acoes={<button type="button" className="neo-btn neo-btn-moss whitespace-nowrap" onClick={onTutorial}>Ver o tutorial</button>}
        >
          A conta e a coleção ficam <b>só neste navegador</b>, e o código de acesso aparece
          na própria tela em vez de chegar por e-mail. Para a coleção não depender de um
          navegador só, conecte-a a um repositório do GitHub —{' '}
          {/* O caminho escrito por extenso é o que sobra depois que alguém
              fecha o aviso. Sem ele, fechar seria perder a informação. */}
          depois de entrar, em <b className="text-acento-texto">☰ › Seus dados › Perfil</b>.
        </Faixa>
      )}
    </AnimatePresence>
  )
}

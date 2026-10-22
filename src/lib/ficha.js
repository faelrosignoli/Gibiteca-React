import { useEffect, useState } from 'react'
import { ghCommits } from './cloud.js'

/* A LEITURA DA FICHA, em um lugar só.
 *
 * Dois lugares mostram a mesma ficha: a prévia do rodapé, que está sempre na
 * tela, e o pop-up completo. Cada um buscando por conta própria daria DUAS
 * chamadas à API do GitHub por visita — e a segunda ainda apareceria como uma
 * espera, com o pop-up abrindo vazio em cima de uma prévia que já tinha os
 * dados na mão.
 *
 * Por isso o cache é de MÓDULO e não de componente: ele precisa sobreviver à
 * desmontagem do pop-up, que é o caso em que ele serve.
 *
 * VALIDADE CURTA, de um minuto. A ficha muda quando você sincroniza, o que
 * acontece enquanto o app está aberto — guardar por muito tempo faria o
 * pop-up mostrar um histórico sem a alteração que acabou de ser feita. Um
 * minuto cobre o caso que importa (abrir o pop-up logo depois de ver a prévia)
 * sem deixar a ficha velha na tela.
 */
const VALIDADE = 60000
let cache = { chave: '', itens: null, quando: 0 }

/* A BUSCA EM VOO, guardada junto do resultado.
 *
 * Cache de resultado sozinho não cumpre o que promete: dois consumidores que
 * montam no mesmo quadro — a prévia e o pop-up aberto por cima dela — não
 * encontram resultado nenhum, porque a primeira busca ainda não voltou, e cada
 * um dispara a sua. O `StrictMode` do desenvolvimento faz igual sozinho, o que
 * tornou isto visível: duas chamadas numa carga só.
 *
 * Guardando a promessa, o segundo a chegar entra de carona na primeira. */
let emVoo = null

const chaveDe = (cloud) =>
  cloud && cloud.connected ? `${cloud.owner}/${cloud.repo}@${cloud.branch}:${cloud.path}` : ''

export function useFicha(cloud, ativo = true) {
  const chave = chaveDe(cloud)

  /* Nasce já com o que estiver no cache: é o que faz o pop-up abrir com a
     ficha escrita, em vez de abrir em "Buscando…" por cima de uma prévia que
     está logo atrás, cheia.

     E nasce CARREGANDO quando não há cache. Começar em "parado e vazio" fazia
     a prévia dizer "Ficha nova, nenhum movimento ainda" no primeiro quadro,
     antes de o efeito rodar — uma afirmação falsa para quem tem histórico. Não
     ter lido não é o mesmo que não ter nada. */
  const [estado, setEstado] = useState(() => {
    const guardado = cache.chave === chave && cache.itens
    return { itens: guardado ? cache.itens : [], carregando: !!chave && !guardado, erro: '' }
  })

  /* A DEPENDÊNCIA É A CHAVE, não o objeto `cloud`.
     O objeto é recriado a cada gravação de configuração da nuvem — e com ele
     na lista, qualquer sincronia disparava uma busca nova do histórico. A
     chave só muda quando muda o repositório, que é quando a ficha é outra. */
  useEffect(() => {
    if (!ativo || !chave) return

    if (cache.chave === chave && cache.itens && Date.now() - cache.quando < VALIDADE) {
      setEstado({ itens: cache.itens, carregando: false, erro: '' })
      return
    }

    let vivo = true
    setEstado(e => ({ ...e, carregando: true, erro: '' }))

    if (!emVoo || emVoo.chave !== chave) {
      emVoo = {
        chave,
        promessa: ghCommits(cloud, cloud.path)
          .then(lista => { cache = { chave, itens: lista, quando: Date.now() }; return lista })
          .finally(() => { if (emVoo && emVoo.chave === chave) emVoo = null }),
      }
    }

    emVoo.promessa
      .then(lista => { if (vivo) setEstado({ itens: lista, carregando: false, erro: '' }) })
      .catch(e => { if (vivo) setEstado(s => ({ ...s, carregando: false, erro: String(e.message || e) })) })

    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, chave])

  return estado
}

/* Joga fora o guardado. Quem acabou de gravar na nuvem chama isto para a
   próxima leitura não devolver a ficha de antes da gravação. */
export function esquecerFicha() {
  cache = { chave: '', itens: null, quando: 0 }
  emVoo = null
}

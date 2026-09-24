import { slugify } from './helpers.js'
import { ghGet, ghPut } from './cloud.js'

/* Tirar as capas de dentro da coleção.
 *
 * MEDIDO na coleção real: 3,78 MB dos 3,94 MB do arquivo eram 80 imagens
 * embutidas em base64 — 49 obras e 31 volumes. Todo o resto (554 obras, 238
 * volumes, nomes, editoras, autores, preços, notas) somava 115 KB.
 *
 * Ou seja: 98% do peso vinha de 9% das obras. Era a raiz da cota estourada do
 * localStorage, do contorno pela API de blobs e dos 4 MB subindo a cada
 * alteração.
 *
 * A imagem passa a ser um arquivo no repositório e a obra guarda o endereço —
 * exatamente o que o "Enviar capas" já fazia. Isto aqui só leva para lá o que
 * entrou pelo caminho antigo, o do Editor.
 */

const EMBUTIDA = /^data:image\/([a-z0-9.+-]+);base64,/i

export const estaEmbutida = (s) => typeof s === 'string' && EMBUTIDA.test(s)

/* Quanto uma coleção carrega de imagem embutida, e onde. */
export function inventario(obras) {
  const alvos = []
  ;(obras || []).forEach(o => {
    if (estaEmbutida(o.imagem)) alvos.push({ id: o.id, nome: o.nome, vol: null, dados: o.imagem })
    ;(Array.isArray(o.volumes) ? o.volumes : []).forEach((v, i) => {
      if (estaEmbutida(v.imagem)) alvos.push({ id: o.id, nome: o.nome, vol: i, rotulo: v.nome, dados: v.imagem })
    })
  })
  const bytes = alvos.reduce((s, a) => s + a.dados.length, 0)
  return { alvos, quantas: alvos.length, mb: bytes / 1048576 }
}

function extensaoDe(dataUrl) {
  const m = dataUrl.match(EMBUTIDA)
  const t = (m && m[1] || 'png').toLowerCase()
  return t === 'jpeg' ? 'jpg' : t.replace(/[^a-z0-9]/g, '') || 'png'
}

const soBase64 = (dataUrl) => dataUrl.slice(dataUrl.indexOf(',') + 1)

/* Sobe uma capa e devolve o endereço dela.
 *
 * O caminho leva o id e, quando é volume, o número: dois volumes da mesma
 * série não podem disputar o mesmo arquivo. */
async function subirUma(cloud, alvo) {
  const ext = extensaoDe(alvo.dados)
  const base = slugify(alvo.nome || ('obra-' + alvo.id))
  const sufixo = alvo.vol == null ? '' : '-v' + (alvo.vol + 1)
  const caminho = 'covers/' + base + '-' + alvo.id + sufixo + '.' + ext

  let sha = null
  try { const ex = await ghGet(cloud, caminho); if (ex) sha = ex.sha } catch (e) { /* ainda não existe */ }
  await ghPut(cloud, caminho, soBase64(alvo.dados), 'Capa: ' + (alvo.nome || alvo.id), sha)

  return `https://raw.githubusercontent.com/${cloud.owner}/${cloud.repo}/${cloud.branch}/${caminho}`
}

/* Move todas as capas embutidas para o repositório.
 *
 * `aoAndar` recebe (feitas, total) para a tela poder mostrar progresso — são
 * dezenas de requisições, e barra parada parece travamento.
 *
 * Devolve as obras JÁ com os endereços trocados. Uma capa que falhar continua
 * embutida: melhor ficar pesada do que sumir da tela. */
export async function moverCapasParaNuvem(cloud, obras, aoAndar) {
  const { alvos } = inventario(obras)
  const trocas = new Map()   // chave "id" ou "id:vol" -> url
  const erros = []

  for (let i = 0; i < alvos.length; i++) {
    const a = alvos[i]
    try {
      const url = await subirUma(cloud, a)
      trocas.set(a.vol == null ? String(a.id) : a.id + ':' + a.vol, url)
    } catch (e) {
      erros.push((a.nome || a.id) + ': ' + (e && e.message || e))
    }
    aoAndar?.(i + 1, alvos.length)
  }

  const novas = (obras || []).map(o => {
    const url = trocas.get(String(o.id))
    let mudou = false
    let obra = o
    if (url) { obra = { ...obra, imagem: url }; mudou = true }
    if (Array.isArray(o.volumes)) {
      let vols = o.volumes, tocou = false
      vols = vols.map((v, i) => {
        const u = trocas.get(o.id + ':' + i)
        if (!u) return v
        tocou = true
        return { ...v, imagem: u }
      })
      if (tocou) { obra = { ...obra, volumes: vols }; mudou = true }
    }
    return mudou ? obra : o
  })

  return { obras: novas, movidas: trocas.size, erros }
}

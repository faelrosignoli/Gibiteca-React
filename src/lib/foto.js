/* A FOTO DE PERFIL, reduzida antes de guardar.
 *
 * Mora aqui, e não dentro de uma tela, porque DOIS lugares escolhem foto: o
 * cadastro (Entrada.jsx) e o perfil (Cloud.jsx). Duas cópias de um
 * redimensionador em canvas divergem — uma ganha um corte melhor, a outra
 * fica com a qualidade antiga — e aí a mesma foto pesa duas coisas diferentes
 * dependendo de onde entrou.
 *
 * POR QUE REDUZIR. Foto de celular tem 3–5 MB. Ela vai para o mesmo JSON que
 * já estourou a cota do localStorage uma vez (ver `semEspaco` no store) e que
 * sobe inteiro para a nuvem a cada alteração — uma foto crua ali custaria em
 * toda gravação, para sempre, para exibir 72 pixels.
 *
 * 256px: o dobro do maior uso previsto, que já cobre tela de densidade 2.
 * JPEG a 82% porque é retrato, não arte de capa — aqui PNG só pesaria.
 *
 * Corta no QUADRADO central antes de reduzir: a moldura é redonda, e espremer
 * um retrato 3:4 num círculo achata o rosto.
 */
export const LADO_FOTO = 256

/* A CAPA, reduzida antes de entrar na coleção ou de subir para o repositório.
 *
 * A REGRA, numa frase: a capa cabe numa caixa de 1080x1080. Maior que isso,
 * encolhe proporcionalmente; menor, passa intacta — reduzir é bom, ampliar
 * não (ampliar inventa pixel e borra).
 *
 * É o MAIOR LADO que manda, não a altura: no cartão a caixa é quadrada e a
 * capa fica contida dentro, então quem limita o que se vê é o lado maior —
 * a altura numa capa em pé, a largura numa deitada. Medido na coleção real:
 * "300", 1500x1100, encolhe para 1080x792; pela altura ele iria a 1473x1080
 * e carregaria 1473px de largura que o quadrado nunca usa.
 *
 * Sem cortar nunca: capa é arte.
 *
 * Os números de antes desta regra: 216 capas, 44,2 MB, e 65 delas (30%)
 * carregavam 32,5 MB. */
export const LADO_CAPA = 1080

export function reduzirCapa(arquivo) {
  return new Promise((ok, falhou) => {
    const leitor = new FileReader()
    leitor.onerror = () => falhou(new Error('não deu para ler o arquivo'))
    leitor.onload = () => {
      const img = new Image()
      img.onerror = () => falhou(new Error('o arquivo não é uma imagem que o navegador abra'))
      img.onload = () => {
        const maior = Math.max(img.width, img.height)
        if (maior <= LADO_CAPA) { ok(leitor.result); return }
        const escala = LADO_CAPA / maior
        const tela = document.createElement('canvas')
        tela.width = Math.round(img.width * escala)
        tela.height = Math.round(img.height * escala)
        tela.getContext('2d').drawImage(img, 0, 0, tela.width, tela.height)
        ok(tela.toDataURL('image/jpeg', 0.82))
      }
      img.src = leitor.result
    }
    leitor.readAsDataURL(arquivo)
  })
}

export function reduzirFoto(arquivo) {
  return new Promise((ok, falhou) => {
    const leitor = new FileReader()
    leitor.onerror = () => falhou(new Error('não deu para ler o arquivo'))
    leitor.onload = () => {
      const img = new Image()
      img.onerror = () => falhou(new Error('o arquivo não é uma imagem que o navegador abra'))
      img.onload = () => {
        const lado = Math.min(img.width, img.height)
        const cx = (img.width - lado) / 2
        const cy = (img.height - lado) / 2
        const tela = document.createElement('canvas')
        tela.width = tela.height = LADO_FOTO
        const ctx = tela.getContext('2d')
        ctx.drawImage(img, cx, cy, lado, lado, 0, 0, LADO_FOTO, LADO_FOTO)
        ok(tela.toDataURL('image/jpeg', 0.82))
      }
      img.src = leitor.result
    }
    leitor.readAsDataURL(arquivo)
  })
}

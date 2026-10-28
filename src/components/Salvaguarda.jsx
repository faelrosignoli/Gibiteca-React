import { Component } from 'react'

/* Rede de proteção para erro de renderização.
 *
 * Sem isto, qualquer erro em qualquer componente apaga a página inteira — foi
 * a "tela branca" relatada. E como a gravação local pode estar falhando, uma
 * tela branca virava perda de trabalho: a pessoa recarregava e as últimas
 * alterações sumiam.
 *
 * O botão de backup NÃO usa o store de propósito: se o erro veio de lá, o
 * store não é confiável. Ele lê o localStorage direto, que é o último lugar
 * onde os dados ainda existem.
 *
 * É uma classe porque só classe captura erro de render no React.
 */
export default class Salvaguarda extends Component {
  constructor(props) {
    super(props)

    /* `?erro=1` no endereço abre esta tela de propósito.
     *
     * Sem isto não há como vê-la sem quebrar alguma coisa de verdade: ela só
     * aparece quando um componente estoura no render, e o jeito de provocar
     * isso era editar este arquivo e lembrar de desfazer. A mensagem do
     * "Detalhe técnico" diz em voz alta que nada quebrou, para ninguém se
     * assustar ao cair aqui por um link.
     */
    const forcada = new URLSearchParams(window.location.search).has('erro')
    this.state = {
      erro: forcada
        ? new Error('Tela aberta de propósito por "?erro=1". Nada quebrou — tire o ?erro=1 do endereço para voltar.')
        : null,
      // recado do botão de backup; aqui não dá para usar o pop-up da casa,
      // que mora dentro do React — e o React acabou de quebrar
      recado: null,
    }
  }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  componentDidCatch(erro, info) {
    // deixa rastro no console para quem for investigar depois
    console.error('Erro de renderização:', erro, info && info.componentStack)
  }

  baixarBackup = () => {
    try {
      const bruto = localStorage.getItem('gibiteca_v1')
      if (!bruto) { this.setState({ recado: 'Não há coleção guardada neste navegador — não há o que baixar.' }); return }
      const blob = new Blob([bruto], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'gibiteca-resgate-' + new Date().toISOString().slice(0, 10) + '.json'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      this.setState({ recado: null })
    } catch (e) {
      this.setState({ recado: 'Não deu para montar o arquivo: ' + (e && e.message) })
    }
  }

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-paper">
        {/* O cartão é bem mais largo que os outros do app porque aqui há duas
            colunas, e ele cresce num degrau: 720px, e 980px a partir de `lg`.
            A ilustração de 500px só aparece nesse segundo degrau — num cartão
            de 720 ela deixaria 148px para o texto, que não é coluna, é tira. */}
        <div className="w-full max-w-[720px] lg:max-w-[980px] rounded-grande border border-separador bg-surface p-6 shadow-amb-lg">
          {/* Lado a lado só a partir de `sm`. Abaixo disso a tela toda tem
              375px: com a ilustração à esquerda sobrariam ~140px para o texto,
              e o título quebraria em quatro linhas. No celular ela volta para
              cima, empilhada. */}
          <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
            {/* Vem de public/, não importada: um <img> é uma requisição a um
                arquivo estático, que não depende do bundle nem do store — e
                justamente aqui o bundle é o que acabou de falhar.

                aria-hidden + alt vazio: o quadrinho tem a palavra "Erro"
                desenhada, mas quem dá o recado é o título ao lado. Anunciar a
                imagem repetiria a mesma coisa em voz alta.

                No celular ela se centra com `mx-auto`, e não com `items-center`
                no contêiner: centrar pelo flex centraria TAMBÉM a coluna de
                texto, que encolheria para o tamanho do conteúdo. Assim só a
                imagem se centra e o texto continua ocupando a largura toda.

                `max-w-full` junto com `w-[300px]`: num aparelho de 375px o
                cartão só tem 287px por dentro, e os 300 vazariam. A trava faz
                a imagem valer 300px onde cabe (390px para cima) e encolher
                onde não cabe, em vez de empurrar o cartão para fora da tela. */}
            <img
              src={`${import.meta.env.BASE_URL}erro.svg`}
              alt=""
              aria-hidden="true"
              width="500"
              height="458"
              className="w-[300px] max-w-full lg:w-[500px] h-auto shrink-0 mx-auto sm:mx-0"
            />

            {/* min-w-0: sem isto a coluna de texto não encolhe abaixo do
                conteúdo dela, e o `pre` do detalhe técnico (que tem palavras
                longas) empurra o cartão para fora da tela. */}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-secao text-ink">Alguma coisa quebrou aqui</h1>
              <p className="mt-2 text-apoio text-ink-soft leading-relaxed">
                A tela travou, mas <b>sua coleção continua guardada neste navegador</b>.
                Baixe um backup antes de recarregar — é o jeito mais seguro de não perder nada.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="neo-btn neo-btn-moss" onClick={this.baixarBackup}>
                  Baixar backup agora
                </button>
                <button type="button" className="neo-btn" onClick={() => window.location.reload()}>
                  Recarregar a página
                </button>
              </div>

              {/* no lugar do alert: logo abaixo do botão que o gerou */}
              {this.state.recado && (
                <p role="status" className="mt-3 rounded-medio border border-rust bg-tinta-rust px-3 py-2 text-apoio text-ink">
                  {this.state.recado}
                </p>
              )}

              <details className="mt-5">
                <summary className="font-rotulo text-rotulo uppercase text-ink-faint cursor-pointer">
                  Detalhe técnico
                </summary>
                <pre className="mt-2 max-h-[180px] overflow-auto rounded-medio border border-linha bg-paper p-3 text-apoio text-ink-soft whitespace-pre-wrap break-words">
                  {String(this.state.erro && (this.state.erro.stack || this.state.erro.message || this.state.erro))}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

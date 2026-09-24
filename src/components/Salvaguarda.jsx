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
    this.state = { erro: null }
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
      if (!bruto) { alert('Não há coleção guardada neste navegador.'); return }
      const blob = new Blob([bruto], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'gibiteca-resgate-' + new Date().toISOString().slice(0, 10) + '.json'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      alert('Não deu para montar o arquivo: ' + (e && e.message))
    }
  }

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-paper">
        <div className="w-full max-w-[520px] rounded-grande border border-separador bg-surface p-6 shadow-amb-lg">
          <h1 className="font-display text-titulo text-ink">Alguma coisa quebrou aqui</h1>
          <p className="mt-2 text-corpo text-ink-soft leading-relaxed">
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

          <details className="mt-5">
            <summary className="font-mono text-rotulo uppercase text-ink-faint cursor-pointer">
              Detalhe técnico
            </summary>
            <pre className="mt-2 max-h-[180px] overflow-auto rounded-medio border border-linha bg-paper p-3 text-apoio text-ink-soft whitespace-pre-wrap break-words">
              {String(this.state.erro && (this.state.erro.stack || this.state.erro.message || this.state.erro))}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}

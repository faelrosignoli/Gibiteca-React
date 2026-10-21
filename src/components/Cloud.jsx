import { AnimatePresence, motion } from 'framer-motion'
import { MOLA_GAVETA, FADE } from '../lib/motion.js'
import { useEffect, useState, useRef } from 'react'
import { useStore } from '../lib/store.jsx'
import { initials, classeTinta } from '../lib/helpers.js'
import { SYNC_TXT } from '../lib/cloud.js'
import { reduzirFoto } from '../lib/foto.js'
import { PassosGitHub } from './TutorialGitHub.jsx'
import { idadeEm } from '../lib/conta.js'
import { inventario, moverCapasParaNuvem } from '../lib/capas.js'

const dotColor = { off: 'bg-ink-mute', ok: 'bg-moss', sync: 'bg-gold animate-pulse', pending: 'bg-gold animate-pulse', err: 'bg-rust', conflito: 'bg-rust animate-pulse' }
const lbl = 'font-rotulo text-rotulo uppercase text-ink-faint pl-0.5'

export default function Cloud({ open, onClose, onNotice }) {
  const { cloud, sync, syncErro, obras, aplicarObras, guessRepo, cloudConnect, cloudDisconnect, pullFromCloud, cloudPushNow, perfil, setPerfil, loadBackup, conta, sairDaConta, apagarConta } = useStore()
  const fotoRef = useRef(null)

  const aoEscolherFoto = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''            // permite reescolher o MESMO arquivo depois
    if (!f) return
    try {
      setPerfil({ foto: await reduzirFoto(f) })
    } catch (err) {
      onNotice?.('Não deu para usar essa imagem: ' + (err && err.message))
    }
  }

  /* APAGAR A CONTA. As palavras exatas que o usuário pediu, mais o que
     some de fato — "todos os dados cadastrados" sem a lista deixaria a
     pessoa descobrir depois que a fila de leitura também foi.

     `confirm` do navegador, e não um pop-up nosso: ele BLOQUEIA a aba até
     ter resposta, e esta é a única ação do app sem desfazer. Um pop-up
     bonito que se fecha clicando fora é um pop-up que se fecha por
     acidente — e aqui o acidente é a coleção inteira.

     Quem apaga de verdade é o store (`apagarConta`): são três lugares —
     coleção, conta e sessão — e espalhar isso por uma tela deixaria um
     deles de fora no dia em que nascer o quarto. */
  const apagarEstaConta = () => {
    const certeza = confirm(
      'Você tem certeza?\n\n' +
      'Perderá todos os dados cadastrados: obras, listas, fila de leitura, perfil e a própria conta.\n\n' +
      (on ? 'O que já está na nuvem NÃO é apagado — dá para puxar de volta depois de entrar de novo.\n\n' : '') +
      'Isso não tem desfazer.'
    )
    if (!certeza) return
    apagarConta()
    onNotice?.('Conta apagada.')
    onClose()
  }
  const [movendo, setMovendo] = useState(null)   // { feitas, total } enquanto sobe
  const [f, setF] = useState({ owner: '', repo: '', branch: 'main', path: 'data/gibiteca.json', token: '' })
  const [help, setHelp] = useState(false)

  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const g = (!cloud.owner || !cloud.repo) ? guessRepo() : { owner: '', repo: '' }
    setF({
      owner: cloud.owner || g.owner || '', repo: cloud.repo || g.repo || '',
      branch: cloud.branch || 'main', path: cloud.path || 'data/gibiteca.json', token: cloud.token || '',
    })
    /* O passo a passo começa fechado a cada abertura: quem já conectou uma
       vez não precisa reler, e quem precisa tem o botão logo ali.

       O texto dele mora em `TutorialGitHub.jsx` porque a tela de entrada
       mostra o MESMO passo a passo, num pop-up — lá não há painel de Perfil
       para abrir, já que ele vive do outro lado do login. */
    setHelp(false)
  }, [open, cloud, guessRepo])

  const on = cloud.connected
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))

  const connect = async () => {
    setBusy(true)
    const res = await cloudConnect(f)
    setBusy(false); onNotice?.(res.message)
  }
  const pull = async () => { setBusy(true); const ok = await pullFromCloud(); setBusy(false); onNotice?.(ok ? 'Coleção puxada da nuvem.' : 'Nada para puxar ainda.') }
  const push = async () => { setBusy(true); await cloudPushNow(); setBusy(false); onNotice?.('Enviado para a nuvem.') }
  const disconnect = () => { cloudDisconnect(); onNotice?.('Nuvem desconectada. Seus dados continuam salvos neste navegador.') }

  /* As capas embutidas são quase todo o peso da coleção. Movê-las para o
     repositório é o que faz o arquivo caber no navegador de novo. */
  const capas = inventario(obras)
  const moverCapas = async () => {
    setMovendo({ feitas: 0, total: capas.quantas })
    try {
      const r = await moverCapasParaNuvem(cloud, obras, (feitas, total) => setMovendo({ feitas, total }))
      if (r.movidas) aplicarObras(r.obras)
      onNotice?.(r.erros.length
        ? r.movidas + ' capa(s) movida(s); ' + r.erros.length + ' falhou(ram) e continuam na coleção.'
        : r.movidas + ' capa(s) movida(s) para o repositório.')
    } catch (e) {
      onNotice?.('Não deu para mover as capas: ' + (e && e.message))
    }
    setMovendo(null)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
 className="fixed inset-0 z-[65] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 veu-canelado"
          initial={{ '--veu-forca': 0 }} animate={{ '--veu-forca': 1 }} exit={{ '--veu-forca': 0 }} transition={FADE}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
 className="w-full sm:max-w-[560px] h-full sm:h-auto sm:max-h-[92vh] flex flex-col bg-surface sm:rounded-grande sm:border sm:border-separador overflow-hidden sm:shadow-[0_40px_90px_-30px_rgba(33,33,33,.5)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={MOLA_GAVETA}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-separador">
              {/* Mesmo título do item que abre este painel. Um nome por
                  assunto: quem clicou em "Seus dados" precisa chegar numa tela
                  que diz "Seus dados".

                  O título NÃO vira o nome da pessoa, embora o item do menu
                  vire. Lá o nome é a etiqueta de uma porta entre nove, e serve
                  justamente para distinguir; aqui dentro já não há o que
                  distinguir, e um painel chamado "Rafael" deixaria de dizer o
                  que se faz nele — que é mexer no e-mail, na nuvem e no botão
                  de apagar a conta. */}
              <h3 className="font-cartaz font-semibold uppercase text-secao text-acento-texto">Seus dados</h3>
              <button className="neo-icon !w-9 !h-9" onClick={onClose}>×</button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-3">
              {/* ---- QUEM É O DONO DESTA COLEÇÃO ----
                  Vem ANTES da nuvem de propósito. "Perfil" é a pergunta
                  grande; a nuvem é o como-guardar, um detalhe de
                  infraestrutura que um dia sai do GitHub e vira outra coisa.
                  Quem abre esta porta procura a si mesmo, não um token. */}
              <section className="flex flex-col gap-3 pb-4 mb-1 border-b border-separador">
                <div className="flex items-center gap-4">
                  {/* A foto é um botão: a moldura inteira abre o seletor de
                      arquivo. Um ícone de lápis ao lado seria um segundo alvo
                      para a mesma coisa, e menor. */}
                  <button
                    type="button"
                    onClick={() => fotoRef.current?.click()}
                    title={perfil.foto ? 'Trocar a foto' : 'Escolher uma foto'}
                    aria-label={perfil.foto ? 'Trocar a foto de perfil' : 'Escolher uma foto de perfil'}
                    className="relative w-[72px] h-[72px] shrink-0 rounded-full overflow-hidden border border-contorno
                      inline-flex items-center justify-center transition-colors hover:border-moss-3"
                  >
                    {perfil.foto
                      ? <img src={perfil.foto} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      : <span className={'w-full h-full inline-flex items-center justify-center font-display font-semibold text-secao text-sobre-tinta ' + classeTinta(perfil.nome || 'gibiteca')}>
                          {initials([perfil.nome, perfil.sobrenome].filter(Boolean).join(' ') || '?')}
                        </span>}
                  </button>
                  <input ref={fotoRef} type="file" accept="image/*" hidden onChange={aoEscolherFoto} />

                  <div className="min-w-0 flex-1">
                    {/* "Foto opcional", e não um rótulo com uma frase de apoio
                        embaixo explicando o que acontece sem ela. O círculo ao
                        lado JÁ mostra as iniciais quando não há foto — a frase
                        descrevia em palavras o que estava desenhado a dois
                        centímetros dali. */}
                    <div className="font-rotulo text-rotulo uppercase text-ink-faint">Foto opcional</div>
                    {perfil.foto && (
                      <button type="button" onClick={() => setPerfil({ foto: null })}
                        className="mt-1.5 text-apoio text-rust underline underline-offset-2">
                        Remover a foto
                      </button>
                    )}
                  </div>
                </div>

                {/* Dois campos, não um. Quem guarda "nome completo" numa string
                    descobre tarde que precisa do primeiro nome sozinho — para
                    saudar, ordenar, abreviar — e aí tem que adivinhar onde
                    cortar. Separado na origem, nunca precisa adivinhar. */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-rotulo text-rotulo uppercase text-ink-soft pl-0.5">Primeiro nome</label>
                    <input className="field-input" value={perfil.nome}
                      onChange={e => setPerfil({ nome: e.target.value })} placeholder="Como te chamam" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-rotulo text-rotulo uppercase text-ink-soft pl-0.5">Sobrenome</label>
                    <input className="field-input" value={perfil.sobrenome}
                      onChange={e => setPerfil({ sobrenome: e.target.value })} placeholder="Opcional" />
                  </div>
                </div>

                {/* ---- A CONTA ----
                    Em LEITURA, não em campo. Foto e nome são aparência, e
                    trocam à vontade; e-mail e nascimento são identidade.

                    Trocar o e-mail é provar o novo endereço com um código —
                    um campo de texto aqui prometeria uma troca que ninguém
                    confirmou. E a data de nascimento vale justamente por ter
                    sido declarada uma vez, com o aceite dos termos por trás
                    (ver TERMOS em lib/conta.js); um campo editável tornaria a
                    declaração um rascunho.

                    As duas trocas vão existir, e vão precisar de confirmação
                    cada uma. Até lá, mostrar sem deixar mexer é honesto; um
                    campo que aceita digitação e não guarda, não. */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="flex flex-col gap-0.5">
                    <div className="font-rotulo text-rotulo uppercase text-ink-faint">E-mail</div>
                    <div className="text-corpo text-ink-soft break-all">{conta.email || '—'}</div>
                  </div>

                  {conta.nascimento && (
                    <div className="flex flex-col gap-0.5">
                      <div className="font-rotulo text-rotulo uppercase text-ink-faint">Nascimento</div>
                      <div className="text-corpo text-ink-soft">
                        {/* A data sai no formato de quem lê, não no 'AAAA-MM-DD'
                            em que é guardada. `split` e não `new Date(s)`: a
                            string com guiões é lida como UTC, e no Brasil isso
                            volta um dia — o mesmo buraco de `idadeEm`. */}
                        {conta.nascimento.split('-').reverse().join('/')}
                        {idadeEm(conta.nascimento) != null && <span className="text-ink-faint"> · {idadeEm(conta.nascimento)} anos</span>}
                      </div>
                    </div>
                  )}

                  {/* Sair NÃO é apagar, e por isso não é rust e não pede
                      confirmação: a coleção fica onde está, e voltar custa um
                      código. Fica aqui em cima, longe do botão que destrói. */}
                  <div className="flex pt-1">
                    <button type="button" className="neo-btn" onClick={() => { sairDaConta(); onClose() }}>
                      Sair da conta
                    </button>
                  </div>
                </div>

                <p className="text-apoio text-ink-faint leading-relaxed">
                  Vai junto no backup e na nuvem, como o resto da coleção.
                </p>
              </section>

              {/* ---- NUVEM ----
                  O painel tem dois assuntos: quem você é (acima) e onde a
                  coleção fica guardada (daqui para baixo). O de cima não
                  precisa de título, porque o título do painel já é o dele;
                  o de baixo precisava — sem ele, "Como fazer?" aparecia
                  sozinho depois de um fio, e a pergunta ficava sem objeto:
                  como fazer o quê? */}
              <h4 className="font-rotulo text-rotulo uppercase text-ink-faint">Nuvem</h4>

              {/* A explicação ficava sempre aberta no topo do painel, e quem já
                  conectou uma vez não precisa dela nunca mais — mas lia o
                  parágrafo inteiro toda vez antes de chegar nos campos. Agora
                  ela mora atrás de "Como fazer?", junto com o passo a passo que
                  já era escondido: um assunto, uma porta. */}
              <button
                type="button"
                className="pill-btn self-start !py-2 !text-apoio"
                aria-expanded={help}
                onClick={() => setHelp(h => !h)}
              >
                Como fazer?
              </button>

              {help && <PassosGitHub />}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1"><label className={lbl}>Usuário (owner)</label>
                  <input className="field-input" value={f.owner} onChange={e => set('owner', e.target.value)} placeholder="seu-usuario" autoComplete="off" spellCheck={false} /></div>
                <div className="flex flex-col gap-1"><label className={lbl}>Repositório</label>
                  <input className="field-input" value={f.repo} onChange={e => set('repo', e.target.value)} placeholder="minha-gibiteca" autoComplete="off" spellCheck={false} /></div>
                <div className="flex flex-col gap-1"><label className={lbl}>Branch</label>
                  <input className="field-input" value={f.branch} onChange={e => set('branch', e.target.value)} placeholder="main" autoComplete="off" spellCheck={false} /></div>
                <div className="flex flex-col gap-1"><label className={lbl}>Caminho do arquivo</label>
                  <input className="field-input" value={f.path} onChange={e => set('path', e.target.value)} placeholder="data/gibiteca.json" autoComplete="off" spellCheck={false} /></div>
                <div className="flex flex-col gap-1 col-span-2"><label className={lbl}>Token de acesso</label>
                  <input className="field-input font-mono !text-apoio" type="password" value={f.token} onChange={e => set('token', e.target.value)} placeholder="github_pat_… ou ghp_…" autoComplete="off" spellCheck={false} /></div>
              </div>

              {/* Só aparece quando há o que mover — senão vira ruído fixo. */}
              {on && capas.quantas > 0 && (
                <div className="rounded-medio border border-gold bg-tinta-gold px-3.5 py-3">
                  <div className="font-display text-obra text-ink">
                    {capas.quantas} capa{capas.quantas > 1 ? 's' : ''} está{capas.quantas > 1 ? 'ão' : ''} dentro da coleção
                  </div>
                  <p className="text-corpo text-ink-soft leading-relaxed mt-0.5">
                    Elas pesam <b>{capas.mb.toFixed(1)} MB</b> — e é esse peso que estoura o espaço do
                    navegador e sobe inteiro a cada alteração. Movendo para o repositório, a coleção
                    passa a guardar só o endereço delas.
                  </p>
                  <button
                    type="button"
                    className="neo-btn neo-btn-moss mt-2.5"
                    onClick={moverCapas}
                    disabled={busy || !!movendo}
                  >
                    {movendo ? 'Movendo ' + movendo.feitas + ' de ' + movendo.total + '…' : 'Mover capas para o repositório'}
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-1.5 text-corpo text-ink-soft bg-surface-2 border border-separador rounded-medio px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-[11px] h-[11px] rounded-full shrink-0 ${dotColor[sync] || dotColor.off}`} />
                  {SYNC_TXT[sync] || SYNC_TXT.off}
                </div>
                {/* o que o GitHub respondeu, palavra por palavra: sem isto não
                    dá para distinguir token errado de repositório errado */}
                {sync === 'err' && syncErro && (
                  <div className="font-mono text-apoio text-rust break-words pl-[21px]">{syncErro}</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 border-t border-separador">
              {on && <button className="neo-btn neo-btn-rust" onClick={disconnect} disabled={busy}>Desconectar</button>}
              {on && <button className="neo-btn" onClick={pull} disabled={busy}>Puxar da nuvem</button>}
              {on && <button className="neo-btn" onClick={push} disabled={busy}>Enviar agora</button>}
              <button className="neo-btn neo-btn-moss ml-auto" onClick={connect} disabled={busy}>{busy ? 'Aguarde…' : on ? 'Reconectar' : 'Conectar'}</button>
            </div>

            {/* ---- APAGAR A CONTA ----
                Linha PRÓPRIA, abaixo de tudo, com régua por cima. Estava no
                meio da fileira da nuvem, e lá tinha dois problemas: disputava
                o `ml-auto` com o "Conectar" (dois numa fileira flex — o
                primeiro come o espaço e o segundo fica sem), e ficava a um
                dedo de distância de "Enviar agora", que é rotina.

                Aqui é o último botão do painel, como pedido, e é o único da
                linha: não há vizinho para errar o alvo. O texto de apoio à
                esquerda diz o que se perde ANTES do clique — o `confirm`
                avisa depois, e avisar depois é a hora errada para quem já
                decidiu clicar. */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-separador">
              <p className="text-apoio text-ink-mute leading-relaxed flex-1 min-w-[180px]">
                Apaga a conta e tudo o que está nela, sem desfazer.
              </p>
              <button type="button" className="neo-btn neo-btn-rust" onClick={apagarEstaConta}>Apagar conta</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

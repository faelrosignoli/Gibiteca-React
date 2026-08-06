import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { SYNC_TXT } from '../lib/cloud.js'

const dotColor = { off: 'bg-[#b9b9a5]', ok: 'bg-moss', sync: 'bg-gold animate-pulse', pending: 'bg-gold animate-pulse', err: 'bg-rust' }
const lbl = 'font-mono text-[10px] tracking-[.12em] uppercase text-ink-faint pl-0.5'

export default function Cloud({ open, onClose, onNotice }) {
  const { cloud, sync, guessRepo, cloudConnect, cloudDisconnect, pullFromCloud, cloudPushNow } = useStore()
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[65] flex items-start sm:items-center justify-center px-0 sm:px-3 py-0 sm:py-6 bg-ink/45 backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="w-full sm:max-w-[560px] h-full sm:h-auto sm:max-h-[92vh] flex flex-col bg-paper sm:rounded-[16px] sm:border-[1.5px] sm:border-ink overflow-hidden sm:shadow-[0_30px_70px_-24px_rgba(35,39,28,.7)]"
            initial={{ y: 24, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b-[1.5px] border-moss-line">
              <h3 className="font-serif text-[21px] text-moss">Sincronizar com o GitHub</h3>
              <button className="w-9 h-9 rounded-lg border-[1.5px] border-ink bg-paper shadow-neo-sm hover:bg-paper-2" onClick={onClose}>×</button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-3">
              <p className="text-[12.5px] text-ink-soft bg-surface-2 border border-moss-line rounded-[10px] px-3.5 py-3 leading-relaxed">
                Isto salva sua coleção <b className="text-moss">no seu próprio repositório</b>, para ela ficar igual em qualquer aparelho.
                Você precisa de um <b className="text-moss">token</b> do GitHub (uma chave de acesso limitada).{' '}
                <button className="text-moss underline font-semibold" onClick={() => setHelp(h => !h)}>Como gerar o token →</button>
              </p>

              {help && (
                <div className="text-[12.5px] text-ink-soft bg-surface-2 border border-moss-line rounded-[10px] px-3.5 py-3 leading-relaxed">
                  <b className="text-moss">Passo a passo:</b> 1) Acesse <b>github.com/settings/tokens</b> → <b>Fine-grained tokens</b> → <b>Generate new token</b>.
                  2) Em <b>Repository access</b>, escolha <b>Only select repositories</b> e marque o repositório da sua gibiteca.
                  3) Em <b>Permissions → Repository permissions → Contents</b>, mude para <b>Read and write</b>.
                  4) Gere, copie e cole abaixo. <br />O GitHub só mostra o token uma vez — se vazar, revogue na mesma página.
                </div>
              )}

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
                  <input className="field-input font-mono !text-[12px]" type="password" value={f.token} onChange={e => set('token', e.target.value)} placeholder="github_pat_… ou ghp_…" autoComplete="off" spellCheck={false} /></div>
              </div>

              <div className="flex items-center gap-2.5 text-[13px] text-ink-soft bg-surface-2 border border-moss-line rounded-[10px] px-3.5 py-2.5">
                <span className={`w-[11px] h-[11px] rounded-full shrink-0 ${dotColor[sync] || dotColor.off}`} />
                {SYNC_TXT[sync] || SYNC_TXT.off}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 border-t-[1.5px] border-moss-line">
              {on && <button className="neo-btn neo-btn-rust" onClick={disconnect} disabled={busy}>Desconectar</button>}
              {on && <button className="neo-btn" onClick={pull} disabled={busy}>Puxar da nuvem</button>}
              {on && <button className="neo-btn" onClick={push} disabled={busy}>Enviar agora</button>}
              <button className="neo-btn neo-btn-moss ml-auto" onClick={connect} disabled={busy}>{busy ? 'Aguarde…' : on ? 'Reconectar' : 'Conectar'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

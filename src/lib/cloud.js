// Sincronização com o GitHub (Contents API) — guarda a coleção no repositório do próprio usuário.
export const GH = 'https://api.github.com'

export function b64enc(str) { return btoa(unescape(encodeURIComponent(str))) }
export function b64dec(b64) { return decodeURIComponent(escape(atob((b64 || '').replace(/\s/g, '')))) }

function headers(token) {
  return { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
}
const encPath = (p) => encodeURIComponent(p).replace(/%2F/g, '/')

export async function ghCheckRepo(c) {
  const r = await fetch(`${GH}/repos/${c.owner}/${c.repo}`, { headers: headers(c.token) })
  if (!r.ok) {
    const msg = r.status === 401 ? 'Token inválido ou sem permissão.'
      : r.status === 404 ? 'Repositório não encontrado (confira usuário e nome).'
      : 'Erro ' + r.status + '.'
    throw new Error(msg)
  }
  return r.json()
}

/* Limite da Contents API: acima de ~1 MB ela responde com `content` VAZIO.
 *
 * Uma coleção com capas passa fácil disso — a do usuário tem 4 MB. O sintoma
 * era "Unexpected end of JSON input": o app recebia string vazia e tentava
 * fazer JSON.parse dela. Nada disso aparecia como erro de tamanho.
 *
 * Para esses arquivos o conteúdo vem pela API de blobs, que atende até 100 MB.
 */
const LIMITE_INLINE = 1024 * 1024

export async function ghGet(c, path) {
  const r = await fetch(`${GH}/repos/${c.owner}/${c.repo}/contents/${encPath(path)}?ref=${encodeURIComponent(c.branch)}`,
    { headers: headers(c.token), cache: 'no-store' })
  if (r.status === 404) return null
  if (!r.ok) throw new Error('GET ' + r.status)
  const meta = await r.json()

  const veioVazio = !meta.content || !String(meta.content).trim()
  if (veioVazio && meta.sha && meta.size > 0) {
    const b = await fetch(`${GH}/repos/${c.owner}/${c.repo}/git/blobs/${meta.sha}`,
      { headers: headers(c.token), cache: 'no-store' })
    if (!b.ok) {
      throw new Error('O arquivo na nuvem tem ' + (meta.size / 1048576).toFixed(1) +
        ' MB e não deu para lê-lo (' + b.status + ').')
    }
    const blob = await b.json()
    return { ...meta, content: blob.content }
  }
  return meta
}

/* Lê a coleção de uma resposta do GitHub, reclamando com clareza quando o
   conteúdo não veio — em vez de estourar um "Unexpected end of JSON input". */
export function lerColecao(f) {
  const txt = b64dec(f && f.content)
  if (!txt.trim()) {
    const mb = f && f.size ? ' (' + (f.size / 1048576).toFixed(1) + ' MB)' : ''
    throw new Error('Não foi possível ler o arquivo da nuvem' + mb + ' — ele veio vazio.')
  }
  return JSON.parse(txt)
}

export async function ghPut(c, path, contentB64, message, sha) {
  const body = { message, content: contentB64, branch: c.branch }
  if (sha) body.sha = sha
  const r = await fetch(`${GH}/repos/${c.owner}/${c.repo}/contents/${encPath(path)}`,
    { method: 'PUT', headers: { ...headers(c.token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) {
    let t = ''; try { t = (await r.json()).message || '' } catch (e) { /* */ }
    // Traduz o que o GitHub responde para o que a pessoa precisa fazer. Antes
    // tudo virava "Erro de sincronização" e não dava para saber onde mexer.
    const dica = {
      401: 'Token inválido ou expirado — gere outro.',
      403: 'O token não tem permissão de escrita. Em Permissions → Contents, use "Read and write".',
      404: 'Repositório ou caminho não encontrado — e confira se o token dá acesso a ESTE repositório.',
      409: 'A nuvem mudou no meio do envio. Tente de novo.',
      422: 'O GitHub recusou a gravação (versão do arquivo fora de sincronia). Tente de novo.',
    }[r.status]
    throw new Error('Envio falhou (' + r.status + ')' + (dica ? ' — ' + dica : t ? ' — ' + t : ''))
  }
  return r.json()
}

// tenta adivinhar usuário/repo a partir de uma URL do github.io
export function guessRepo() {
  try {
    const m = location.hostname.match(/^([^.]+)\.github\.io$/)
    if (!m) return { owner: '', repo: '' }
    const seg = location.pathname.split('/').filter(Boolean)[0]
    return { owner: m[1], repo: seg || (m[1] + '.github.io') }
  } catch (e) { return { owner: '', repo: '' } }
}

export const SYNC_TXT = {
  off: 'Não conectado.', ok: 'Tudo sincronizado.', sync: 'Sincronizando…',
  pending: 'Alterações pendentes…', err: 'Erro de sincronização.',
  // o envio foi barrado de proposito: a nuvem tem algo mais novo que esta copia
  conflito: 'A nuvem tem uma versão mais nova. Puxe antes de enviar, ou o que está lá seria apagado.',
}

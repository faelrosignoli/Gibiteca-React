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

export async function ghGet(c, path) {
  const r = await fetch(`${GH}/repos/${c.owner}/${c.repo}/contents/${encPath(path)}?ref=${encodeURIComponent(c.branch)}`,
    { headers: headers(c.token), cache: 'no-store' })
  if (r.status === 404) return null
  if (!r.ok) throw new Error('GET ' + r.status)
  return r.json()
}

export async function ghPut(c, path, contentB64, message, sha) {
  const body = { message, content: contentB64, branch: c.branch }
  if (sha) body.sha = sha
  const r = await fetch(`${GH}/repos/${c.owner}/${c.repo}/contents/${encPath(path)}`,
    { method: 'PUT', headers: { ...headers(c.token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) { let t = ''; try { t = (await r.json()).message || '' } catch (e) { /* */ } throw new Error('PUT ' + r.status + (t ? ' — ' + t : '')) }
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
}

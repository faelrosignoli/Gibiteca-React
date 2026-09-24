/* Baixar a coleção como arquivo.
 *
 * Saiu do Header para cá quando o aviso de "sem espaço" passou a precisar do
 * mesmo botão: duas cópias desta função acabariam gerando dois formatos de
 * backup diferentes, e é o arquivo que salva a pessoa quando o navegador
 * recusa gravar.
 */
export function baixarBackup(obras, editoras) {
  const data = { version: 1, exported: new Date().toISOString(), obras, editoras }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'gibiteca-backup-' + new Date().toISOString().slice(0, 10) + '.json'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

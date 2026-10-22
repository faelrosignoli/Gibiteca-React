/* Confere se TODA frase que o diário sabe escrever cai no movimento certo.
 *
 * O `classificar` do diario.js reconstrói o tipo a partir da frase, porque o
 * commit só leva o texto. Isso só se sustenta enquanto as duas pontas falarem
 * a mesma língua: mudar um verbo em `mudancasInternas` sem mexer nas regras
 * joga a linha silenciosamente em "Outro", e o histórico perde a organização
 * sem nenhum erro aparecer.
 *
 *   node tools/conferir-movimentos.cjs
 */
const CASOS = [
  // ---- o que entra e o que sai ----
  ['Adicionou “Sandman”',                                   'entrou'],
  ['Adicionou 5 obras',                                     'entrou'],
  ['Acrescentou 2 volumes de “Berserk”',                    'entrou'],
  ['Acrescentou 1 volume de “Berserk”',                     'entrou'],
  ['Removeu “Maus”',                                        'saiu'],
  ['Removeu 3 obras',                                       'saiu'],
  ['Tirou 2 volumes de “Bone”',                             'saiu'],
  ['Tirou 1 volume de “Bone”',                              'saiu'],

  // ---- estante ----
  ['Marcou como Tenho: “Akira” (2 de 6)',                   'estante'],
  ['Marcou como Tenho: 3 volumes de “Akira” (3 de 6)',      'estante'],
  ['Voltou para Quero: “Akira”',                            'estante'],
  ['Mudou o status de 9 obras',                             'estante'],
  ['Marcou “Watchmen” como urgente',                        'estante'],
  ['Marcou 2 volumes de “Hellboy” como urgente',            'estante'],
  ['Tirou a urgência de “Watchmen”',                        'estante'],

  // ---- leitura ----
  ['Marcou como lido: “Persépolis”',                        'leitura'],
  ['Marcou como não lido: “Persépolis”',                    'leitura'],
  ['Marcou a leitura de 4 obras',                           'leitura'],
  ['Deu 4,5 estrelas para “Daytripper”',                    'leitura'],
  ['Deu 1 estrela para “Daytripper”',                       'leitura'],
  ['Tirou a nota de “Daytripper”',                          'leitura'],

  // ---- valor ----
  ['Anotou R$ 29,90 pago em “Blankets”',                    'valor'],
  ['Mudou o valor de “Blankets” para R$ 30,00',             'valor'],
  ['Apagou o valor pago de “Blankets”',                     'valor'],

  // ---- capa ----
  ['Subiu para a nuvem a capa de “V de Vingança”',          'capa'],
  ['Subiu para a nuvem a capa de 3 volumes de “Bone”',      'capa'],
  ['Subiu 110 capas para a nuvem',                          'capa'],
  ['Pôs capa em “Maus”',                                    'capa'],
  ['Tirou a capa de “Maus”',                                'capa'],
  ['Trocou a capa de “Maus”',                               'capa'],
  ['Mexeu na capa de 7 obras',                              'capa'],

  // ---- ficha da obra ----
  ['Renomeou “Sandman” para “Sandman: Prelúdios”',          'ficha'],
  ['Pôs a editora de “Maus”: Companhia das Letras',         'ficha'],
  ['Mudou a editora de “Maus” para Panini',                 'ficha'],
  ['Apagou a editora de “Maus”',                            'ficha'],
  ['Pôs o país de “Akira”: Japão',                          'ficha'],
  ['Mudou o país de “Akira” para Japão',                    'ficha'],
  ['Apagou o país de “Akira”',                              'ficha'],
  ['Pôs a origem de “Akira”: Importado',                    'ficha'],
  ['Mudou a origem de “Akira” para Nacional',               'ficha'],
  ['Apagou a origem de “Akira”',                            'ficha'],
  ['Pôs a autoria de “Bone”: Jeff Smith',                   'ficha'],
  ['Mudou a autoria de “Bone” para Jeff Smith',             'ficha'],
  ['Apagou a autoria de “Bone”',                            'ficha'],
  ['Escreveu uma anotação em “Maus”',                       'ficha'],
  ['Mudou a anotação de “Maus”',                            'ficha'],
  ['Apagou a anotação de “Maus”',                           'ficha'],
  ['Editou “Maus”',                                         'ficha'],
  ['Editou 12 obras',                                       'ficha'],

  // ---- o que não é de nenhum: mensagens anteriores ao diário ----
  ['14 alterações na coleção',                              'outro'],
  ['Atualiza coleção — 19/10/2026 14:00:00',                'outro'],
  ['',                                                      'outro'],
]

/* A entrada inteira: mistura de naturezas não tem movimento. */
const CASOS_ENTRADA = [
  ['Adicionou “Maus”', [], 'entrou'],
  ['Subiu 110 capas para a nuvem', ['Subiu para a nuvem a capa de “A”', 'Subiu para a nuvem a capa de “B”'], 'capa'],
  ['3 alterações na coleção', ['Marcou como lido: “A”', 'Pôs capa em “B”'], null],
]

;(async () => {
  const { classificar, movimentoDaEntrada, MOVIMENTOS } = await import('../src/lib/diario.js')

  const validos = new Set(MOVIMENTOS.map(m => m.v))
  let falhas = 0

  for (const [texto, esperado] of CASOS) {
    if (!validos.has(esperado)) {
      console.log(`CONFIG  esperado "${esperado}" não está em MOVIMENTOS`); falhas++; continue
    }
    const deu = classificar(texto)
    if (deu !== esperado) {
      console.log(`FALHOU  ${esperado.padEnd(8)} ≠ ${deu.padEnd(8)}  ${texto}`); falhas++
    }
  }

  for (const [assunto, itens, esperado] of CASOS_ENTRADA) {
    const deu = movimentoDaEntrada(assunto, itens)
    if (deu !== esperado) {
      console.log(`FALHOU  entrada ${String(esperado)} ≠ ${String(deu)}  ${assunto}`); falhas++
    }
  }

  const total = CASOS.length + CASOS_ENTRADA.length
  console.log(falhas ? `\n${falhas} de ${total} falharam` : `ok — ${total} frases, todas no movimento certo`)
  process.exit(falhas ? 1 : 0)
})()

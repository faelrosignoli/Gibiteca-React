/* Gera MarcaAlt.jsx a partir das duas artes alternativas.
 *
 * Uma por tema, as duas no mesmo componente: quem escolhe qual aparece é o
 * CSS, não o React — assim trocar de tema não espera redesenho.
 *
 * As artes precisam vir com o texto CONVERTIDO EM CURVAS. Com texto vivo o
 * navegador substitui a fonte por uma do sistema, e em máquina sem a família
 * certa instalada vira quadradinho; por isso o script recusa o arquivo em vez
 * de gerar algo que só funciona na máquina de quem exportou.
 */
const fs = require('fs');
const R = __dirname + '/../';

const ler = (arq) => fs.readFileSync(R + 'src/assets/' + arq, 'utf8');

function corpo(arq) {
  const svg = ler(arq);
  if (/<text[\s>]/.test(svg)) {
    throw new Error(arq + ' ainda tem <text>: reexporte com o texto convertido em curvas.');
  }
  const d = [...svg.matchAll(/<path[^>]*?\sd="([^"]+)"\s*\/?>/g)].map(m => m[1]);
  if (!d.length) throw new Error('nenhum <path> em ' + arq);
  return {
    vb: (svg.match(/viewBox="([^"]+)"/) || [, '0 0 4000 1080'])[1],
    qtd: d.length,
    jsx: d.map(x => '        <path d="' + x + '" />').join('\n'),
  };
}

const m = corpo('marca-alt-moss.svg');
const nk = corpo('marca-alt-nockout.svg');

const arquivo =
`/* A segunda marca — a que aparece no hover do logo.
 *
 * Uma arte por tema, as DUAS no DOM. Quem mostra uma e esconde a outra é o CSS
 * (\`[data-tema]\`), não o React: trocar de tema repinta na hora, sem esperar
 * redesenho, do mesmo jeito que as tintas e o acento.
 *
 * A troca em si também é CSS puro (\`.grupo-marca:hover\`) — não há estado de
 * React nenhum aqui. Hover é o tipo de coisa que o navegador já resolve, e
 * passar isso por \`useState\` só adicionaria renderização a cada passada de
 * mouse sobre o cabeçalho.
 *
 * Gerado por tools/gerar-marca-alt.cjs a partir de src/assets/marca-alt-*.svg.
 * Para trocar a arte, substitua o SVG e rode o script — não edite os caminhos
 * aqui à mão. O script exige curvas: com texto vivo ele recusa o arquivo.
 */
export default function MarcaAlt({ className = '' }) {
  return (
    <>
      <svg viewBox="${m.vb}" className={\`marca-alt alt-moss \${className}\`} aria-hidden="true" focusable="false">
${m.jsx}
      </svg>
      <svg viewBox="${nk.vb}" className={\`marca-alt alt-nockout \${className}\`} aria-hidden="true" focusable="false">
${nk.jsx}
      </svg>
    </>
  )
}
`;

fs.writeFileSync(R + 'src/components/MarcaAlt.jsx', arquivo);
console.log('moss: ' + m.qtd + ' curvas | nockout: ' + nk.qtd + ' curvas');
console.log('src/components/MarcaAlt.jsx escrito — ' + Math.round(arquivo.length / 1024) + ' kB');

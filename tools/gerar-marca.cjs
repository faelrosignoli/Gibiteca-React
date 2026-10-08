const fs = require('fs');
const R = 'C:/Users/user/Documents/gibiteca-react/';
const svg = fs.readFileSync(R + 'src/assets/logo.svg', 'utf8');

// cada <path>, com a classe que ele tem (ou nenhuma)
const paths = [...svg.matchAll(/<path([^>]*?)\sd="([^"]+)"\s*\/?>/g)].map(m => ({
  attrs: m[1], d: m[2],
  classe: (m[1].match(/class="([^"]+)"/) || [, ''])[1],
}));

const sombra = paths.filter(p => !p.classe);          // sem classe = preenchimento padrão (preto)
const letras = paths.filter(p => p.classe === 'cls-1'); // branco
const vazios = paths.filter(p => p.classe === 'cls-2'); // fill:none — invisíveis

console.log('sombra:', sombra.length, '| letras:', letras.length, '| invisíveis (descartados):', vazios.length);
if (sombra.length !== 1) { console.error('esperava UMA sombra'); process.exit(1) }
if (!letras.length) { console.error('nenhuma letra'); process.exit(1) }

const vb = (svg.match(/viewBox="([^"]+)"/) || [, '0 0 4000 1080'])[1];

const arquivo = `/* A marca, desenhada em SVG.
 *
 * Inline, e não <img>, por um motivo concreto: a barra do topo inverte a tinta
 * ao rolar, e com imagem a única ferramenta seria \`filter\`, que achata o
 * desenho inteiro numa cor só — aqui isso apagaria a sombra contra as letras.
 * Em SVG cada parte tem o próprio preenchimento, e os dois lados do logo
 * trocam de cor de forma independente.
 *
 * As cores saem de variáveis (\`--marca-sombra\`, \`--marca-letra\`), definidas no
 * index.css. Quem precisar de uma combinação nova muda a variável no contexto,
 * sem tocar neste arquivo.
 *
 * Gerado a partir de src/assets/logo.svg — para trocar a arte, substitua
 * aquele arquivo e gere de novo em vez de editar os \`d\` na mão.
 */
export default function Marca({ className = '' }) {
  return (
    <svg
      viewBox="${vb}"
      className={\`marca \${className}\`}
      role="img"
      aria-label="Minha Gibiteca"
      focusable="false"
    >
      {/* a sombra deslocada, desenhada primeiro para ficar atrás */}
      <path className="marca-sombra" d="${sombra[0].d}" />
${letras.map(p => `      <path className="marca-letra" d="${p.d}" />`).join('\n')}
    </svg>
  )
}
`;

fs.writeFileSync(R + 'src/components/Marca.jsx', arquivo);
console.log('src/components/Marca.jsx escrito —', Math.round(arquivo.length / 1024) + ' kB');

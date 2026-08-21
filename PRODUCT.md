# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Usuário único (o dono da coleção), que cataloga e consulta sua própria
coleção pessoal de quadrinhos (HQs). Não há multiusuário — confirmado com o
usuário que é uso pessoal, sem outras pessoas acessando ou editando.

## Product Purpose

Catalogar uma coleção pessoal de quadrinhos: registrar o que já possui
("Tenho") e o que deseja adquirir ("Quero"), organizado por tipo (avulso, box
ou série com volumes), com metadados (editora, país, autores, gêneros,
capa), status de leitura e nota, valor pago e sinalização de urgência de
compra. Sucesso é ter um catálogo fiel à coleção física, rápido de manter
(cadastrar/editar) e fácil de consultar (busca, filtros, estatísticas), sem
depender de um serviço de terceiros para guardar os dados.

## Positioning

Diferente de uma planilha ou de um app de catálogo genérico: os dados vivem
só no navegador do usuário (localStorage), sem backend próprio, e a
sincronização entre aparelhos é opcional, usando o próprio repositório
GitHub do usuário (Contents API) como "nuvem" — sem servidor dedicado, sem
terceiros, sem custo. Mantém fidelidade visual à versão HTML original
(vanilla JS) da qual foi migrado.

## Operating Context

Uso via navegador (desktop ou celular), tipicamente para: registrar
novas aquisições, consultar a coleção, atualizar status de leitura/nota,
subir capas em massa após comprar vários itens, e sincronizar entre
aparelhos via GitHub quando conectado. Backup manual via exportar/restaurar
JSON complementa (ou substitui) a nuvem.

## Capabilities and Constraints

- SPA sem backend próprio; dados vivem no localStorage do navegador.
- Sincronização opcional com um repositório GitHub do usuário (Contents API
  + token fine-grained "Contents: Read and write"); o token fica salvo
  apenas no navegador do usuário.
- Três tipos de obra: avulso, box, série (série/box têm volumes individuais
  com seus próprios status/nota/valor).
- Regra inegociável: nunca embutir dados do usuário no bundle/app — o app
  sempre inicia vazio; a coleção entra via Backup→Restaurar (JSON) ou via
  Nuvem.
- Stack já definida (projeto existente, não é decisão em aberto): Vite +
  React 18 + Tailwind CSS + Framer Motion.

## Brand Commitments

- Interface, comentários e mensagens de commit em português (BR).
- Fidelidade visual à versão HTML original (`index.html`) — paleta de
  cores, sombra dura, selos, tratamento de capas etc. (detalhado em
  CLAUDE.md e na skill `gibiteca-ui`).

## Evidence on Hand

- `gibiteca-dados.json`: referência do modelo de dados de uma coleção real
  do usuário; não deve ir para o bundle nem ser versionado.
- Versão HTML original (vanilla JS), usada como referência de fidelidade
  visual durante a migração para React.

## Product Principles

1. Dados do usuário nunca embutidos no app — ele sempre inicia vazio.
2. Fidelidade ao visual original é inegociável, não uma preferência.
3. Sem backend próprio: localStorage + GitHub Contents API são a única
   forma de persistência/sincronização.
4. Interface e commits em português (BR).
5. Ferramenta pessoal de uso único — sem necessidade de multiusuário,
   permissões ou contas.

## Accessibility & Inclusion

Nenhum requisito específico. Confirmado com o usuário: sem necessidade de
leitor de tela, alto contraste dedicado ou outra adaptação além dos padrões
razoáveis de contraste e semântica.

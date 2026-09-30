# Page Support Assistant

Extensão para navegadores baseados em Chromium que permite selecionar conteúdos de páginas web, analisá-los por meio de um backend e inserir respostas sugeridas novamente na página.

O projeto foi desenvolvido como prova de conceito para explorar capacidades de extensões de navegador, incluindo leitura e manipulação do DOM, comunicação entre componentes, persistência de estado, Side Panel, integração com backend e uso opcional de provedores de IA.

## Funcionalidades

- captura de texto selecionado em páginas web;
- integração com o menu de contexto do navegador;
- abertura automática de Side Panel;
- exibição do texto selecionado e da URL de origem;
- ação de resumo;
- ação de explicação;
- geração de resposta sugerida;
- inserção da resposta novamente em campos da página;
- suporte a `input`, `textarea` e elementos `contenteditable`;
- tema claro e escuro;
- persistência da preferência de tema;
- backend desacoplado da extensão;
- provider local `mock`;
- integração opcional com OpenAI;
- integração opcional com Gemini;
- timeout para chamadas ao Gemini;
- limite de saída para chamadas ao Gemini;
- tratamento de erros de autenticação, permissão, quota e indisponibilidade;
- retorno imediato ao provider `mock` para desenvolvimento sem consumo de API paga.

## Fluxo principal

```text
Página web
    ↓
Texto selecionado
    ↓
Menu de contexto
    ↓
Service Worker
    ↓
chrome.storage.session
    ↓
Side Panel
    ↓
Backend Node.js
    ↓
AI_PROVIDER
 ┌───────┼─────────┐
 ↓       ↓         ↓
Mock   OpenAI    Gemini
 └───────┬─────────┘
         ↓
Resultado
         ↓
Side Panel
         ↓
Inserir na página
         ↓
DOM
```

O fluxo permite ler informação da página, processá-la externamente e devolver o resultado para a própria interface web.

O provider utilizado é selecionado exclusivamente pelo backend através da variável:

```env
AI_PROVIDER=
```

Durante o desenvolvimento normal, o projeto utiliza:

```env
AI_PROVIDER=mock
```

evitando chamadas desnecessárias a APIs externas.

## Estrutura do projeto

```text
page-support-assistant-extension/
├── extension/
│   ├── src/
│   │   ├── background.ts
│   │   ├── manifest.json
│   │   └── sidepanel/
│   │       ├── sidepanel.html
│   │       ├── sidepanel.css
│   │       └── sidepanel.ts
│   ├── scripts/
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── server/
│   ├── src/
│   │   ├── ai-service.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

## Stack

### Extensão

- TypeScript
- HTML
- CSS
- Manifest V3
- Chrome Extension APIs
- Node.js
- npm

### Backend

- Node.js
- TypeScript
- Express
- OpenAI SDK
- Fetch API
- dotenv
- CORS

A integração com Gemini utiliza a API REST diretamente a partir do backend.

## Chrome Extension APIs utilizadas

### `chrome.contextMenus`

Cria a opção `Analisar com Page Support Assistant` no menu exibido quando o usuário seleciona um texto e clica com o botão direito.

### `chrome.sidePanel`

Exibe a interface do assistente em um painel lateral ao lado da página atual.

### `chrome.storage.session`

Armazena temporariamente o texto selecionado, a URL de origem e informações relacionadas à análise atual.

### `chrome.storage.local`

Armazena configurações persistentes, como a preferência entre tema claro e escuro.

### `chrome.scripting`

Executa código na página ativa para permitir que uma resposta sugerida seja inserida novamente no DOM.

### `chrome.runtime`

Permite a comunicação entre o Side Panel e o service worker da extensão.

## Setup da extensão

Entre na pasta:

```bash
cd extension
```

Instale as dependências:

```bash
npm install
```

Valide o TypeScript:

```bash
npx tsc --noEmit
```

Gere a build:

```bash
npm run build
```

A extensão pronta será criada em:

```text
extension/dist
```

## Carregar no Google Chrome

1. acesse `chrome://extensions`;
2. ative o Modo do desenvolvedor;
3. clique em `Carregar sem compactação`;
4. selecione a pasta `extension/dist`.

Após alterações no código-fonte, execute novamente:

```bash
npm run build
```

e recarregue a extensão em `chrome://extensions`.

## Setup do backend

Entre na pasta:

```bash
cd server
```

Instale as dependências:

```bash
npm install
```

Crie um arquivo `.env` baseado em `.env.example`.

Exemplo:

```env
AI_PROVIDER=mock

OPENAI_API_KEY=
OPENAI_MODEL=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite

PORT=3000
```

O provider padrão deve permanecer:

```env
AI_PROVIDER=mock
```

durante o desenvolvimento normal.

Inicie o backend:

```bash
npm run start
```

O serviço será iniciado em:

```text
http://127.0.0.1:3000
```

## Providers

O backend foi desenvolvido de forma desacoplada do provedor de análise.

Atualmente são suportados:

```text
mock
openai
gemini
```

A seleção é realizada através de:

```env
AI_PROVIDER=
```

### Mock

Para executar toda a aplicação sem consumir uma API externa:

```env
AI_PROVIDER=mock
```

Nesse modo, o backend gera resultados locais de demonstração.

Esse provider permite testar:

- comunicação da extensão com o backend;
- estados de carregamento;
- renderização de resultados;
- fluxo de sugestão de resposta;
- inserção de conteúdo novamente na página;
- alterações no frontend;
- integração entre os componentes sem custo de IA.

O `mock` é o modo recomendado para desenvolvimento normal.

### OpenAI

Para utilizar a integração com OpenAI:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sua_chave
OPENAI_MODEL=seu_modelo
```

A chave deve existir apenas no backend.

Nunca deve ser colocada:

- no código da extensão;
- no `manifest.json`;
- em arquivos versionados;
- no frontend;
- no repositório Git.

### Gemini

Para utilizar Gemini:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=sua_chave
GEMINI_MODEL=gemini-3.5-flash-lite
```

A integração é feita pelo backend através da Gemini API.

O modelo validado durante os testes do projeto foi:

```text
gemini-3.5-flash-lite
```

Após qualquer teste com Gemini, recomenda-se retornar imediatamente para:

```env
AI_PROVIDER=mock
```

## Proteções contra consumo acidental

A integração Gemini foi implementada com foco em controle de consumo.

Atualmente o backend possui:

- uma única requisição de IA por chamada a `/analyze`;
- ausência de polling;
- ausência de recursão;
- ausência de retry automático;
- ausência de chamadas automáticas no carregamento da extensão;
- timeout de 15 segundos;
- limite de saída configurado no backend;
- configuração de thinking reduzida;
- logs de início e status HTTP sem registrar a API Key;
- tratamento específico para erros HTTP;
- provider `mock` como modo padrão de desenvolvimento.

A chamada Gemini utiliza:

```text
GEMINI_TIMEOUT_MS = 15000
GEMINI_MAX_OUTPUT_TOKENS = 256
```

O fluxo de uma análise é:

```text
Ação explícita do usuário
        ↓
POST /analyze
        ↓
analyzeText()
        ↓
provider selecionado
        ↓
uma única chamada ao provider
        ↓
resposta
```

## Tratamento de erros Gemini

O backend trata separadamente situações relevantes da Gemini API.

```text
401 → autenticação recusada
403 → acesso negado
429 → limite ou quota atingida
5xx → falha do serviço externo
timeout → limite de tempo excedido
resposta vazia → resposta inválida do provider
```

Esses erros são transformados em respostas controladas pelo backend sem expor a API Key.

## Endpoint de saúde

O backend disponibiliza:

```text
GET /health
```

Esse endpoint permite verificar a configuração local sem fazer uma chamada ao provider de IA.

Exemplo de resposta:

```json
{
  "status": "ok",
  "provider": "mock",
  "openaiConfigured": false,
  "geminiConfigured": true
}
```

`geminiConfigured: true` significa apenas que uma chave está configurada no backend.

Isso não significa que uma chamada foi realizada.

## Endpoint de análise

As ações da extensão utilizam:

```text
POST /analyze
```

Exemplo de corpo:

```json
{
  "action": "summarize",
  "text": "Texto selecionado pelo usuário.",
  "pageUrl": "https://exemplo.com"
}
```

As ações aceitas são:

```text
summarize
explain
suggest-reply
```

O backend valida o conteúdo antes de encaminhá-lo ao provider configurado.

## Como usar

1. abra uma página web;
2. selecione um trecho de texto;
3. clique com o botão direito;
4. escolha `Analisar com Page Support Assistant`;
5. o Side Panel será aberto;
6. escolha uma das ações:
   - Resumir;
   - Explicar;
   - Sugerir resposta;
7. o texto será enviado ao backend;
8. o resultado aparecerá no Side Panel;
9. ao utilizar `Sugerir resposta`, clique em `Inserir na página`;
10. clique no campo da página onde deseja inserir o conteúdo;
11. revise a resposta antes de qualquer envio.

A extensão não envia formulários, mensagens ou comentários automaticamente.

## Inserção na página

Ao clicar em `Inserir na página`, a extensão entra em um modo temporário de seleção de campo.

O usuário escolhe explicitamente onde deseja inserir o conteúdo.

Atualmente são suportados:

- `textarea`;
- `input` de texto;
- `input` de e-mail;
- `input` de busca;
- `input` de telefone;
- `input` de URL;
- elementos com `contenteditable="true"`.

Após inserir o conteúdo, a extensão também dispara eventos como `input` e `change`, permitindo que aplicações web percebam a alteração.

O conteúdo é inserido, mas não enviado automaticamente.

Isso mantém uma etapa humana de revisão antes de qualquer ação final.

## Dark mode

O Side Panel possui temas claro e escuro.

Na primeira execução, a extensão considera a preferência de tema do sistema operacional ou navegador.

Após uma escolha manual, a preferência é persistida utilizando:

```text
chrome.storage.local
```

e restaurada nas próximas execuções.

## Estado e persistência

O projeto utiliza dois tipos diferentes de armazenamento.

### `storage.session`

Utilizado para informações temporárias, como:

- texto selecionado;
- URL da página;
- contexto atual da análise.

### `storage.local`

Utilizado para preferências persistentes, como:

- tema claro ou escuro.

Essa separação evita persistir desnecessariamente conteúdos capturados de páginas web.

## Segurança

As chaves de API não ficam dentro da extensão.

A arquitetura utilizada é:

```text
Extensão
    ↓
Backend
    ↓
Provider
```

Isso evita expor credenciais nos arquivos JavaScript distribuídos para o navegador.

As chaves ficam somente no arquivo local:

```text
server/.env
```

Esse arquivo é ignorado pelo Git.

O repositório contém apenas:

```text
server/.env.example
```

sem credenciais reais.

A proteção pode ser verificada com:

```bash
git check-ignore -v server/.env
```

e:

```bash
git ls-files server/.env
```

O segundo comando não deve retornar o arquivo.

O backend também instrui o modelo a tratar o texto capturado da página como dado, e não como uma fonte confiável de instruções.

## Validação da API Gemini

A integração Gemini foi validada de forma progressiva para evitar consumo desnecessário.

### Validação da chave

Primeiro foi realizada uma requisição sem geração de conteúdo ao endpoint de listagem de modelos.

```text
GET /v1beta/models
```

Resultado:

```text
HTTP 200
```

A resposta retornou metadados de modelos disponíveis, comprovando que a API Key foi aceita pela Gemini API.

Esse teste não enviou prompt nem solicitou geração de conteúdo.

### Validação de geração

Depois da autenticação ser confirmada, foi realizada uma única geração controlada pelo backend utilizando:

```text
gemini-3.5-flash-lite
```

Texto de teste:

```text
O sistema está funcionando corretamente.
```

Resposta recebida:

```text
O texto selecionado informa que o sistema está funcionando corretamente.
```

Provider retornado:

```text
gemini
```

Logs registrados pelo backend:

```text
[gemini] Iniciando requisição; modelo=gemini-3.5-flash-lite
[gemini] Resposta HTTP 200; modelo=gemini-3.5-flash-lite
```

A API Key não foi registrada nos logs.

Após o teste, o provider foi imediatamente restaurado para:

```env
AI_PROVIDER=mock
```

## Testes realizados

O fluxo da extensão foi testado no Google Chrome.

Foram utilizados:

- Wikipédia, para captura e análise de textos;
- httpbin Forms, para testar inserção em formulários;
- GitHub Issues, para testar um cenário mais próximo de atendimento real.

No GitHub, foi validado o seguinte fluxo:

```text
texto de uma Issue
        ↓
captura
        ↓
análise
        ↓
resposta sugerida
        ↓
inserção no campo de comentário
```

Também foram testados separadamente:

```text
backend em modo mock
backend em modo Gemini
GET /health
POST /analyze
autenticação da Gemini API
geração com Gemini
retorno para o provider mock
```

## Limitações atuais

Alguns cenários podem exigir tratamento adicional:

- páginas internas protegidas pelo navegador;
- iframes;
- Shadow DOM fechado;
- editores ricos;
- componentes customizados;
- aplicações que utilizam mecanismos específicos de gerenciamento de estado;
- páginas que alteram frequentemente sua estrutura de DOM;
- disponibilidade e permissões dos modelos externos;
- limites e quotas definidos pelo provider utilizado.

O backend também precisa estar em execução para que as ações de análise funcionem.

## Próximas evoluções possíveis

- suporte a outros providers;
- seleção automática de contexto adicional;
- configuração de idioma;
- configuração de tom da resposta;
- suporte aprimorado a editores ricos;
- histórico opcional de análises;
- detecção inteligente de campos de resposta;
- integração com sistemas específicos de atendimento;
- autenticação entre extensão e backend;
- deploy do backend;
- políticas adicionais de limite de consumo;
- métricas de uso por provider.

## Objetivo da prova de conceito

O Page Support Assistant demonstra que uma extensão de navegador pode funcionar como uma camada adicional sobre sistemas web existentes.

O fluxo principal comprovado é:

```text
ler contexto de uma aplicação
            ↓
processar externamente
            ↓
gerar uma sugestão
            ↓
devolver o resultado
            ↓
interagir novamente com a aplicação
```

Esse modelo pode ser adaptado para cenários como suporte, atendimento, análise de conteúdo e assistência em sistemas web sem necessidade de alterar diretamente o código-fonte da aplicação original.

A prova de conceito também demonstra a possibilidade de manter múltiplos providers desacoplados do frontend:

```text
mock
openai
gemini
```

permitindo utilizar `mock` para desenvolvimento e habilitar provedores externos apenas quando necessário.
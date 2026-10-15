# Expression Lab

Aplicação web para reconhecer gestos com as mãos e expressões faciais em tempo real pela webcam e mostrar a imagem correspondente. Feita com JavaScript, Vite e MediaPipe Tasks Vision; o processamento acontece no navegador, sem backend.

---

## Como funciona

A página mantém dois painéis lado a lado:

- **Câmera:** vídeo da webcam com os landmarks e as conexões desenhados em um canvas, além do nome do gesto detectado.
- **Imagem do gesto:** mostra o meme correspondente em um quadro fixo de 480 × 480 pixels, sem distorcer a imagem.

A imagem exibida segue este ciclo:

```
macaco-olhar-perdido ── gesto confirmado ──▶ imagem do gesto
        ▲                                          │
        └────────── gesto deixa de ser reconhecido ┘
```

A página mostra `macaco-olhar-perdido.png` quando inicia e quando nenhum gesto com imagem está confirmado. Um gesto precisa ser reconhecido em 5 frames seguidos para trocar a imagem; quando deixa de ser reconhecido por 5 frames, a página volta para a imagem padrão. Não há troca automática para `gato-frente.png` após um período sem gesto.

A cada frame:

1. O MediaPipe encontra **21 pontos por mão** (até 2 mãos) e **478 pontos do rosto**, além de **52 blendshapes** para expressões faciais.
2. Para cada dedo, calcula se está esticado ou dobrado pelo ângulo das articulações. O polegar é classificado pela distância de sua ponta até a base do dedo mínimo.
3. As regras combinam mãos e rosto na ordem de prioridade implementada em `src/reconhecimento.js`. As expressões usam os limites de `src/config.js`.
4. O nome do gesto é procurado em `public/gestos.json`; quando existe uma imagem correspondente, ela é exibida no painel ao lado do vídeo.

---

## Gestos reconhecidos

As regras são avaliadas nesta ordem. A tabela reflete o código: primeiro são verificadas as duas mãos levantadas, depois as regras de mão perto do rosto, os gestos de uma mão e as expressões faciais.

| Prioridade | Gesto | Regra reconhecida | Imagem |
|---:|---|---|---|
| 1 | Macaco maos na cabeca | Duas mãos levantadas e as palmas perto da testa, acima dela | `macaco-maos-atras-da-cabeca.png` |
| 2 | Maos pra cima | Duas mãos levantadas e boca aberta | `maos-pra-cima.png` |
| 3 | Kojima cinema | Duas mãos levantadas e ambas classificadas como `Mao aberta` | `kojima-cinema.png` |
| 4 | Nao grita | `Indicador levantado` ou `Faz o L`, com a ponta do indicador perto da boca | `nao-grita.jpg` |
| 5 | Pensativo | Mão abaixo da boca e algum landmark perto do queixo | `pensativo.jpg` |
| 6 | Gato mao na boca | Centro da palma perto da boca | `gato-mao-boca.png` |
| 7 | Hang loose | Polegar e mínimo estendidos; indicador, médio e anelar dobrados | `hang-loose.png` |
| 8 | Faz o L | Polegar e indicador estendidos | `faz-o-l.jpg` |
| 9 | Gato joia | Polegar para cima e os outros quatro dedos dobrados | `gato-dando-joia.png` |
| 10 | Mario dedo do meio | Só o dedo médio estendido | `mario-dedo-meio.jpg` |
| 11 | Gato apontando | Só o indicador estendido, com deslocamento mais horizontal que vertical | `gato-apontando.png` |
| 12 | Indicador levantado | Só o indicador estendido, com deslocamento horizontal menor ou igual ao vertical | `macaco-ideia.png` |
| 13 | Gato nojo | Média de `noseSneerLeft` e `noseSneerRight` acima do limite | `gato-nojo.jpg` |
| 14 | Olhar assustado | Média de `eyeWideLeft` e `eyeWideRight` acima do limite | `olhar-assustado.jpg` |
| 15 | Olhando de lado | Um dos pares de blendshapes de olhar lateral acima do limite | `olhando-de-lado.png` |

Dentro das regras de mão perto do rosto, a ordem é `Nao grita`, `Pensativo` e `Gato mao na boca`. Os gestos de uma mão são priorizados nesta ordem: `Hang loose`, `Faz o L`, `Gato joia`, `Mario dedo do meio`, `Gato apontando` e `Indicador levantado`. Se nenhuma dessas regras ou expressão se aplicar, o primeiro gesto de mão é usado quando disponível.

`Mao aberta`, `Mao fechada` e `Gesto nao identificado` são classificações intermediárias da mão e não têm imagem própria. Para a imagem, são tratadas como ausência de gesto; depois de 5 frames, a página volta à imagem padrão.

Imagem padrão (não é um gesto):

| Situação | Imagem |
|---|---|
| Inicial ou sem gesto confirmado | `macaco-olhar-perdido.png` |

---

## Requisitos

- **Node.js 20.19.0 ou superior na série 20, ou 22.12.0 ou superior.** Essa é a faixa exigida pelo Vite 7 do projeto; a série 21 não é suportada.
- **Navegador atual:** Chrome, Edge ou Firefox.
- **Uma webcam.**
- A câmera só funciona em **localhost** ou em uma página servida por **HTTPS**. Abrir `index.html` diretamente como arquivo não permite acesso à câmera.

Os modelos necessários ficam em `public/models/`; os arquivos WASM ficam em `public/wasm/`. Ambos são incluídos no projeto.

---

## Instalação

```sh
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd expression-lab

# 2. Acessar a aplicação web e instalar as dependências
cd web
npm install
```

---

## Como usar

```sh
npm run dev
```

1. Abra no navegador a URL local mostrada no terminal.
2. Clique em **Iniciar câmera** e permita o acesso à webcam.
3. Faça os gestos em frente à câmera; o vídeo com os landmarks e a imagem correspondente aparecem na página.
4. Para parar, feche a aba. Para encerrar o servidor de desenvolvimento, pressione `Ctrl+C` no terminal.

---

## Build e publicação

Gere a versão de produção em `dist/`:

```sh
npm run build
```

Para conferir localmente a build:

```sh
npm run preview
```

O comando mostra uma URL local de pré-visualização. A câmera continua sujeita à regra de origem segura: localhost ou HTTPS.

### GitHub Pages

1. Abra `vite.config.js` e troque `base: "/"` pelo caminho do repositório, por exemplo:

   ```js
   export default defineConfig({
     base: "/nome-do-repo/",
   });
   ```

2. Na configuração **Pages** do repositório, selecione **GitHub Actions** como origem de publicação.
3. Configure o workflow de Pages do repositório para executar `npm install` e `npm run build` dentro de `web/` e publicar o conteúdo de `web/dist/` como artefato do Pages.
4. Depois do deploy, abra a URL de Pages indicada pelo GitHub. Se os arquivos de modelos, WASM ou imagens retornarem 404, confira o valor de `base` e gere a build novamente.

### Vercel

1. Importe o repositório na Vercel.
2. Defina `web` como **Root Directory**.
3. Use `npm install` como comando de instalação, `npm run build` como comando de build e `dist` como diretório de saída.
4. Publique e abra o domínio HTTPS fornecido pela Vercel. Não é necessário alterar `base` para a Vercel.

---

## Estrutura do projeto

```
web/
├── .gitignore                  # Exclui dependências instaladas e arquivos de build
├── index.html                 # Página, layout dos painéis e botão de câmera
├── package.json               # Dependências e scripts do Vite
├── package-lock.json          # Versões instaladas das dependências
├── vite.config.js             # Configuração do Vite e caminho base da publicação
├── README.md                  # Documentação da aplicação web
├── public/
│   ├── gestos.json            # Nomes dos gestos e caminhos das imagens
│   ├── imagens/               # Memes dos gestos e imagens padrão
│   ├── models/                # Modelos de mão e rosto do MediaPipe
│   └── wasm/                  # Arquivos de execução WebAssembly do MediaPipe
└── src/
    ├── main.js                # Inicialização, câmera e processamento de cada frame
    ├── config.js              # Parâmetros e limiares de reconhecimento
    ├── gestos.js              # Geometria e classificação dos gestos de mão
    ├── rosto.js               # Dados do rosto e classificação das expressões
    ├── reconhecimento.js      # Regras combinadas e ordem de prioridade
    ├── exibicao.js            # Carregamento e troca das imagens
    └── desenho.js             # Canvas: landmarks, conexões e nome do gesto
```

---

## Configuração

Os parâmetros ficam em `src/config.js`. O hot reload do Vite aplica alterações ao salvar o arquivo.

| Configuração | Padrão | O que faz |
|---|---:|---|
| `caminhoImagemPadrao` | `imagens/macaco-olhar-perdido.png` | Imagem inicial e mostrada quando não há gesto confirmado |
| `framesParaConfirmar` | `5` | Frames seguidos necessários para confirmar a troca de imagem |
| `tamanhoJanelaImagem` | `[480, 480]` | Dimensões de referência do quadro da imagem |
| `posicaoJanelaImagem` | `[680, 50]` | Posição usada pela janela na versão desktop; não posiciona a página web |
| `anguloDedoEstendido` | `160` | Ângulo mínimo, em graus, para um dedo contar como estendido |
| `fatorPolegarEstendido` | `1.2` | Fator de distância para classificar o polegar como estendido |
| `distanciaMaoRosto` | `0.35` | Distância para considerar a mão perto do rosto, em larguras do rosto |
| `distanciaMaoCabeca` | `1.0` | Distância para considerar a mão perto da testa, em larguras do rosto |
| `limiteBocaAberta` | `0.5` | Nota mínima de `jawOpen` para considerar a boca aberta |
| `limiteNojo` | `0.5` | Nota mínima média de `noseSneerLeft` e `noseSneerRight` |
| `limiteOlhosArregalados` | `0.35` | Nota mínima média de `eyeWideLeft` e `eyeWideRight` |
| `limiteOlharDeLado` | `0.6` | Nota mínima para os pares de `eyeLookIn` / `eyeLookOut` |

Os limiares dependem do rosto, da iluminação e da câmera. Ajustar um valor pode fazer um gesto ativar com mais ou menos facilidade.

### Descobrindo os valores das expressões

Para ver as notas dadas pelo MediaPipe, adicione temporariamente em `src/main.js`, logo depois de `extrairInfoRosto`:

```js
if (infoRosto) {
  console.log(
    Object.fromEntries(
      Object.entries(infoRosto.blendshapes)
        .filter(([, valor]) => valor > 0.3)
        .map(([nome, valor]) => [nome, Number(valor.toFixed(2))]),
    ),
  );
}
```

Salve o arquivo e faça a expressão em frente à câmera. Abra o DevTools com `F12` e veja os valores na aba **Console**; use-os para orientar o ajuste dos limites em `src/config.js`. Remova o `console.log` depois da inspeção.

---

## Adicionando um gesto novo

1. Coloque a imagem em `public/imagens/`.
2. Cadastre o gesto em `public/gestos.json`, usando o nome como chave:

   ```json
   "Meu gesto": {
     "imagem": "imagens/meu-gesto.png"
   }
   ```

3. Crie a regra que retorna exatamente esse nome:
   - **Gesto de uma mão:** adicione a condição em `classificarGesto` de `src/gestos.js` e inclua o nome em `gestosDeUmaMao` de `src/reconhecimento.js`.
   - **Duas mãos ou mão no rosto:** adicione a condição em `reconhecerGesto` ou `gestoPertoDoRosto` de `src/reconhecimento.js`.
   - **Expressão facial:** adicione a condição em `classificarExpressao` de `src/rosto.js`, usando os blendshapes.

O nome retornado pela regra e a chave em `public/gestos.json` precisam ser **idênticos**, inclusive maiúsculas e espaços. A ordem das condições `if` determina a prioridade.

---

## Problemas comuns

| Problema | Solução |
|---|---|
| A permissão da câmera foi negada | Permita a câmera nas configurações do navegador e recarregue a página. |
| A câmera está em uso por outro programa | Feche o programa que está usando a webcam e clique novamente em **Iniciar câmera**. |
| A câmera não funciona fora de localhost ou HTTPS | Sirva a aplicação com `npm run dev` em localhost ou publique-a em um domínio HTTPS. Não abra o HTML como arquivo local. |
| Um modelo ou arquivo WASM retorna 404 | Confira se `public/models/` e `public/wasm/` foram copiados e se `base` em `vite.config.js` corresponde ao caminho publicado. |
| A imagem do gesto não aparece | Confira a chave e o caminho em `public/gestos.json` e se o arquivo existe em `public/imagens/`; o status informa o nome de cada imagem de gesto que falhou. A aplicação continua com as imagens carregadas; as duas imagens padrão são obrigatórias. |
| Um gesto com a mão no rosto falha | A mão pode ocultar landmarks do rosto ou da mão. Melhore a iluminação e deixe os pontos faciais visíveis; o comportamento de detecção não é garantido quando há oclusão. |
| O processamento está lento | O aplicativo tenta GPU e usa CPU se a inicialização em GPU falhar. A disponibilidade do acelerador depende do navegador e do dispositivo; reduza outras cargas do dispositivo. |
| A página fica em branco no GitHub Pages | Confira `base: "/nome-do-repo/"` em `vite.config.js`, gere `npm run build` novamente e publique o conteúdo atualizado de `web/dist/`. |

### Limitações conhecidas

- **Gato apontando:** apontar para a câmera não é detectado, porque as regras usam posições 2D. Aponte para o lado.
- **Gato nojo:** a regra usa o franzir do nariz; não detecta língua para fora.
- A câmera exige permissão explícita do usuário e uma origem segura; o navegador pode negar o acesso ou não disponibilizar a câmera.
- A detecção é executada no navegador. A velocidade depende do dispositivo e do suporte a GPU; o fallback para CPU pode ser mais lento.
- A ordem de espelhamento do vídeo não é invertida: a imagem segue a orientação capturada pela webcam.

---

## Tecnologias

| Tecnologia | Para que foi usada |
|---|---|
| JavaScript | Regras de reconhecimento e aplicação no navegador |
| Vite | Servidor de desenvolvimento e build de produção |
| MediaPipe Tasks Vision | Landmarks de mãos e rosto e blendshapes |
| Canvas API | Desenho dos landmarks, conexões e nome do gesto sobre o vídeo |

---

## Aprendizados

- Usar landmarks para criar regras geométricas de gestos e interpretar blendshapes de expressões.
- Aplicar ângulos entre vetores e distâncias relativas ao rosto sem alterar os limiares originais.
- Estabilizar a troca de imagem exigindo que o gesto apareça em vários frames consecutivos.
- Adaptar captura e inferência contínua ao ciclo de animação do navegador e manter timestamps crescentes para o modo de vídeo.
- Carregar modelos e WASM como recursos estáticos, gerenciar permissões da webcam e publicar a aplicação sem um servidor de processamento próprio.

import {
  framesParaConfirmar,
  caminhoGestos,
} from "./config.js";

function carregarImagem(url) {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error(`Não foi possível carregar a imagem: ${url}`));
    imagem.src = url;
  });
}

async function buscarImagem(caminho, baseUrl) {
  const url = `${baseUrl}${caminho}`;
  return carregarImagem(url);
}

export async function carregarImagensGestos(baseUrl) {
  const resposta = await fetch(`${baseUrl}${caminhoGestos}`);

  if (!resposta.ok) {
    throw new Error(
      `Não foi possível carregar ${caminhoGestos} (HTTP ${resposta.status}).`,
    );
  }

  const gestosCadastrados = await resposta.json();
  const resultados = await Promise.all(
    Object.entries(gestosCadastrados).map(async ([nomeGesto, dados]) => {
      try {
        return {
          nomeGesto,
          imagem: await buscarImagem(dados.imagem, baseUrl),
          erro: null,
        };
      } catch (erro) {
        return { nomeGesto, imagem: null, erro };
      }
    }),
  );
  const imagens = {};
  const falhas = [];

  for (const resultado of resultados) {
    if (resultado.imagem) {
      imagens[resultado.nomeGesto] = resultado.imagem;
    } else {
      falhas.push(
        `Falha ao carregar a imagem de "${resultado.nomeGesto}": ${resultado.erro.message}`,
      );
    }
  }

  return { imagens, falhas };
}

export function carregarImagemObrigatoria(caminho, baseUrl) {
  return buscarImagem(caminho, baseUrl);
}

export class ExibidorImagem {
  constructor(imagensGestos, imagemPadrao, elementoImagem) {
    this.imagensGestos = imagensGestos;
    this.imagemPadrao = imagemPadrao;
    this.elementoImagem = elementoImagem;
    this.candidato = null;
    this.frames = 0;
    this.gestoExibido = null;
    this.mostrar(this.imagemPadrao);
  }

  temImagem(gesto) {
    return Object.hasOwn(this.imagensGestos, gesto);
  }

  mostrar(imagem) {
    this.elementoImagem.src = imagem.src;
  }

  atualizar(gestoComImagem) {
    if (gestoComImagem === this.candidato) {
      this.frames += 1;
    } else {
      this.candidato = gestoComImagem;
      this.frames = 1;
    }

    const gestoConfirmado = this.frames >= framesParaConfirmar;

    if (gestoConfirmado && this.candidato !== this.gestoExibido) {
      this.gestoExibido = this.candidato;

      if (this.candidato === null) {
        this.mostrar(this.imagemPadrao);
      } else {
        this.mostrar(this.imagensGestos[this.candidato]);
      }
    }
  }
}

import {
  distanciaMaoCabeca,
  distanciaMaoRosto,
} from "./config.js";
import { classificarGesto } from "./gestos.js";
import { paraPixels } from "./desenho.js";
import { bocaAberta, classificarExpressao } from "./rosto.js";

export const gestosDeUmaMao = [
  "Hang loose",
  "Faz o L",
  "Gato joia",
  "Mario dedo do meio",
  "Gato apontando",
  "Indicador levantado",
];

export function perto(ponto, alvo, infoRosto) {
  const limite = infoRosto.larguraRosto * distanciaMaoRosto;

  return Math.hypot(ponto[0] - alvo[0], ponto[1] - alvo[1]) < limite;
}

export function maosLevantadas(maos, infoRosto, altura) {
  const queixoY = infoRosto.queixo[1];
  return maos.every((mao) => mao[0].y * altura < queixoY);
}

export function maosNaCabeca(maos, infoRosto, largura, altura) {
  const testa = infoRosto.testa;
  const limite = infoRosto.larguraRosto * distanciaMaoCabeca;

  for (const mao of maos) {
    const centroPalma = paraPixels(mao[9], largura, altura);
    const acimaDaTesta = centroPalma[1] < testa[1];
    const pertoDaTesta =
      Math.hypot(
        centroPalma[0] - testa[0],
        centroPalma[1] - testa[1],
      ) < limite;

    if (!(acimaDaTesta && pertoDaTesta)) {
      return false;
    }
  }

  return true;
}

export function gestoPertoDoRosto(
  mao,
  gestoMao,
  infoRosto,
  largura,
  altura,
) {
  const pontos = mao.map((ponto) => paraPixels(ponto, largura, altura));

  if (
    ["Indicador levantado", "Faz o L"].includes(gestoMao) &&
    perto(pontos[8], infoRosto.boca, infoRosto)
  ) {
    return "Nao grita";
  }

  const pontoMaisAltoY = Math.min(...pontos.map(([, y]) => y));
  const maoAbaixoDaBoca = pontoMaisAltoY > infoRosto.boca[1];

  if (
    maoAbaixoDaBoca &&
    pontos.some((ponto) => perto(ponto, infoRosto.queixo, infoRosto))
  ) {
    return "Pensativo";
  }

  if (perto(pontos[9], infoRosto.boca, infoRosto)) {
    return "Gato mao na boca";
  }

  return null;
}

export function reconhecerGesto(maos, infoRosto, largura, altura) {
  const gestosMaos = maos.map((mao) => classificarGesto(mao));

  if (
    maos.length === 2 &&
    infoRosto !== null &&
    maosLevantadas(maos, infoRosto, altura)
  ) {
    if (maosNaCabeca(maos, infoRosto, largura, altura)) {
      return "Macaco maos na cabeca";
    }

    if (bocaAberta(infoRosto)) {
      return "Maos pra cima";
    }

    if (gestosMaos.every((gesto) => gesto === "Mao aberta")) {
      return "Kojima cinema";
    }
  }

  if (infoRosto !== null) {
    for (let indice = 0; indice < maos.length; indice += 1) {
      const gesto = gestoPertoDoRosto(
        maos[indice],
        gestosMaos[indice],
        infoRosto,
        largura,
        altura,
      );

      if (gesto !== null) {
        return gesto;
      }
    }
  }

  for (const gestoMao of gestosMaos) {
    if (gestosDeUmaMao.includes(gestoMao)) {
      return gestoMao;
    }
  }

  if (infoRosto !== null) {
    const expressao = classificarExpressao(infoRosto);

    if (expressao !== null) {
      return expressao;
    }
  }

  return gestosMaos.length > 0 ? gestosMaos[0] : null;
}

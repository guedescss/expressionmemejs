import {
  limiteBocaAberta,
  limiteNojo,
  limiteOlharDeLado,
  limiteOlhosArregalados,
} from "./config.js";
import { paraPixels } from "./desenho.js";

export function extrairInfoRosto(resultadoRosto, largura, altura) {
  if (!resultadoRosto.faceLandmarks?.length) {
    return null;
  }

  const rosto = resultadoRosto.faceLandmarks[0];
  const blendshapes = {};
  const categorias = resultadoRosto.faceBlendshapes?.[0]?.categories ?? [];

  for (const categoria of categorias) {
    blendshapes[categoria.categoryName] = categoria.score;
  }

  const labioSuperior = paraPixels(rosto[13], largura, altura);
  const labioInferior = paraPixels(rosto[14], largura, altura);
  const boca = [
    (labioSuperior[0] + labioInferior[0]) / 2,
    (labioSuperior[1] + labioInferior[1]) / 2,
  ];
  const pontoEsquerdo = paraPixels(rosto[234], largura, altura);
  const pontoDireito = paraPixels(rosto[454], largura, altura);

  return {
    blendshapes,
    boca,
    queixo: paraPixels(rosto[152], largura, altura),
    testa: paraPixels(rosto[10], largura, altura),
    larguraRosto: Math.hypot(
      pontoEsquerdo[0] - pontoDireito[0],
      pontoEsquerdo[1] - pontoDireito[1],
    ),
  };
}

export function mediaBlendshapes(blendshapes, ...nomes) {
  return (
    nomes.reduce((soma, nome) => soma + (blendshapes[nome] ?? 0), 0) /
    nomes.length
  );
}

export function bocaAberta(infoRosto) {
  return (
    (infoRosto.blendshapes.jawOpen ?? 0) > limiteBocaAberta
  );
}

export function classificarExpressao(infoRosto) {
  const blendshapes = infoRosto.blendshapes;
  const nojo = mediaBlendshapes(
    blendshapes,
    "noseSneerLeft",
    "noseSneerRight",
  );

  if (nojo > limiteNojo) {
    return "Gato nojo";
  }

  const olhosArregalados = mediaBlendshapes(
    blendshapes,
    "eyeWideLeft",
    "eyeWideRight",
  );

  if (olhosArregalados > limiteOlhosArregalados) {
    return "Olhar assustado";
  }

  const olhandoUmLado = mediaBlendshapes(
    blendshapes,
    "eyeLookOutLeft",
    "eyeLookInRight",
  );
  const olhandoOutroLado = mediaBlendshapes(
    blendshapes,
    "eyeLookInLeft",
    "eyeLookOutRight",
  );

  if (
    Math.max(olhandoUmLado, olhandoOutroLado) >
    limiteOlharDeLado
  ) {
    return "Olhando de lado";
  }

  return null;
}

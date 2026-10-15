import { anguloDedoEstendido, fatorPolegarEstendido } from "./config.js";

export function calcularAngulo(a, b, c) {
  const vetorBa = [a.x - b.x, a.y - b.y];
  const vetorBc = [c.x - b.x, c.y - b.y];

  const produtoEscalar =
    vetorBa[0] * vetorBc[0] + vetorBa[1] * vetorBc[1];
  const normaBa = Math.hypot(...vetorBa);
  const normaBc = Math.hypot(...vetorBc);

  if (normaBa === 0 || normaBc === 0) {
    return 0;
  }

  const cosseno = Math.max(
    -1,
    Math.min(1, produtoEscalar / (normaBa * normaBc)),
  );

  return (Math.acos(cosseno) * 180) / Math.PI;
}

export function calcularAnguloDedo(mao, pontos) {
  const articulacaoMedia = mao[pontos[1]];
  const articulacaoSuperior = mao[pontos[2]];
  const ponta = mao[pontos[3]];

  return calcularAngulo(
    articulacaoMedia,
    articulacaoSuperior,
    ponta,
  );
}

export function polegarEstendido(mao) {
  const baseMinimo = [mao[17].x, mao[17].y];
  const ponta = [mao[4].x, mao[4].y];
  const basePolegar = [mao[2].x, mao[2].y];

  const distanciaPonta = Math.hypot(
    ponta[0] - baseMinimo[0],
    ponta[1] - baseMinimo[1],
  );
  const distanciaBase = Math.hypot(
    basePolegar[0] - baseMinimo[0],
    basePolegar[1] - baseMinimo[1],
  );

  return distanciaPonta > distanciaBase * fatorPolegarEstendido;
}

export function extrairCaracteristicasMao(mao) {
  const pontosDedos = {
    indicador: [5, 6, 7, 8],
    medio: [9, 10, 11, 12],
    anelar: [13, 14, 15, 16],
    minimo: [17, 18, 19, 20],
  };
  const caracteristicas = {};

  for (const [dedo, pontos] of Object.entries(pontosDedos)) {
    const angulo = calcularAnguloDedo(mao, pontos);
    caracteristicas[dedo] = {
      angulo,
      estendido: angulo > anguloDedoEstendido,
    };
  }

  caracteristicas.polegar = { estendido: polegarEstendido(mao) };
  return caracteristicas;
}

export function polegarParaCima(mao) {
  return (
    mao[4].y < mao[3].y &&
    mao[3].y < mao[2].y &&
    mao[4].y < mao[5].y
  );
}

export function indicadorHorizontal(mao) {
  const deslocamentoX = Math.abs(mao[8].x - mao[5].x);
  const deslocamentoY = Math.abs(mao[8].y - mao[5].y);

  return deslocamentoX > deslocamentoY;
}

export function classificarGesto(mao) {
  const caracteristicas = extrairCaracteristicasMao(mao);
  const indicador = caracteristicas.indicador.estendido;
  const medio = caracteristicas.medio.estendido;
  const anelar = caracteristicas.anelar.estendido;
  const minimo = caracteristicas.minimo.estendido;
  const polegar = caracteristicas.polegar.estendido;
  const dedos = [indicador, medio, anelar, minimo];
  const soIndicador = indicador && !medio && !anelar && !minimo;

  if (polegar && minimo && !indicador && !medio && !anelar) {
    return "Hang loose";
  }

  if (polegar && soIndicador) {
    return "Faz o L";
  }

  if (polegar && !dedos.some(Boolean) && polegarParaCima(mao)) {
    return "Gato joia";
  }

  if (medio && !indicador && !anelar && !minimo) {
    return "Mario dedo do meio";
  }

  if (dedos.every(Boolean)) {
    return "Mao aberta";
  }

  if (!dedos.some(Boolean)) {
    return "Mao fechada";
  }

  if (soIndicador) {
    if (indicadorHorizontal(mao)) {
      return "Gato apontando";
    }

    return "Indicador levantado";
  }

  return "Gesto nao identificado";
}

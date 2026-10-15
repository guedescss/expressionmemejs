import {
  FaceLandmarker,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

export function paraPixels(ponto, largura, altura) {
  return [
    Math.trunc(ponto.x * largura),
    Math.trunc(ponto.y * altura),
  ];
}

function desenharConexoes(contexto, pontos, conexoes, largura, altura) {
  if (!conexoes) {
    return;
  }

  contexto.beginPath();
  for (const conexao of conexoes) {
    const inicio = pontos[conexao.start];
    const fim = pontos[conexao.end];

    if (!inicio || !fim) {
      continue;
    }

    contexto.moveTo(inicio.x * largura, inicio.y * altura);
    contexto.lineTo(fim.x * largura, fim.y * altura);
  }
  contexto.stroke();
}

export function desenharMao(contexto, mao, largura, altura) {
  contexto.strokeStyle = "#0000ff";
  contexto.lineWidth = 2;
  desenharConexoes(
    contexto,
    mao,
    HandLandmarker.HAND_CONNECTIONS,
    largura,
    altura,
  );

  contexto.fillStyle = "#ffff00";
  for (const ponto of mao) {
    const [x, y] = paraPixels(ponto, largura, altura);
    contexto.beginPath();
    contexto.arc(x, y, 5, 0, 2 * Math.PI);
    contexto.fill();
  }
}

export function desenharRosto(contexto, resultadoRosto, largura, altura) {
  const rostos = resultadoRosto.faceLandmarks ?? [];

  contexto.strokeStyle = "rgba(0, 255, 0, 0.22)";
  contexto.lineWidth = 1;
  contexto.fillStyle = "#00ff00";

  for (const rosto of rostos) {
    desenharConexoes(
      contexto,
      rosto,
      FaceLandmarker.FACE_LANDMARKS_TESSELATION,
      largura,
      altura,
    );

    for (const ponto of rosto) {
      const [x, y] = paraPixels(ponto, largura, altura);
      contexto.beginPath();
      contexto.arc(x, y, 1, 0, 2 * Math.PI);
      contexto.fill();
    }
  }
}

export function mostrarGesto(contexto, gesto) {
  contexto.fillStyle = "#00ff00";
  contexto.font = "24px Arial, sans-serif";
  contexto.fillText(`Gesto: ${gesto || "-"}`, 20, 40);
}

export function desenharFrame(
  contexto,
  resultadoMaos,
  resultadoRosto,
  largura,
  altura,
  gesto,
) {
  contexto.clearRect(0, 0, largura, altura);

  for (const mao of resultadoMaos.landmarks ?? []) {
    desenharMao(contexto, mao, largura, altura);
  }

  desenharRosto(contexto, resultadoRosto, largura, altura);
  mostrarGesto(contexto, gesto);
}

import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import {
  caminhoImagemPadrao,
  caminhoModeloMaos,
  caminhoModeloRosto,
  tamanhoJanelaImagem,
} from "./config.js";
import { desenharFrame } from "./desenho.js";
import {
  carregarImagemObrigatoria,
  carregarImagensGestos,
  ExibidorImagem,
} from "./exibicao.js";
import { reconhecerGesto } from "./reconhecimento.js";
import { extrairInfoRosto } from "./rosto.js";

const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const contexto = canvas.getContext("2d");
const molduraCamera = document.querySelector(".camera-frame");
const molduraMeme = document.querySelector(".meme-frame");
const imagemMeme = document.querySelector("#meme");
const botaoCamera = document.querySelector("#start-camera");
const status = document.querySelector("#status");
const baseUrl = import.meta.env.BASE_URL;

document.documentElement.style.setProperty(
  "--meme-width",
  `${tamanhoJanelaImagem[0]}px`,
);
molduraMeme.style.aspectRatio =
  `${tamanhoJanelaImagem[0]} / ${tamanhoJanelaImagem[1]}`;

let exibidor;
let fluxoCamera;
let detectorRosto;
let detectorMaos;
let quadroSolicitado;
let ultimoTimestamp = -1;
let avisoImagens = "";

function mostrarStatus(mensagem, tipo = "info") {
  status.textContent = mensagem;
  status.dataset.type = tipo;
}

async function carregarRecursos() {
  try {
    const [resultadoImagens, imagemPadrao] = await Promise.all([
      carregarImagensGestos(baseUrl),
      carregarImagemObrigatoria(caminhoImagemPadrao, baseUrl),
    ]);

    exibidor = new ExibidorImagem(
      resultadoImagens.imagens,
      imagemPadrao,
      imagemMeme,
    );
    avisoImagens = resultadoImagens.falhas.join(" ");
    botaoCamera.disabled = false;
    mostrarStatus(
      avisoImagens || "Imagens carregadas. Pronto para iniciar.",
      avisoImagens ? "error" : "info",
    );
  } catch (erro) {
    mostrarStatus(`Falha ao carregar recursos: ${erro.message}`, "error");
  }
}

async function criarDetectores(delegate) {
  const arquivosVision = await FilesetResolver.forVisionTasks(
    `${baseUrl}wasm`,
  );
  let rosto;
  let maos;

  try {
    rosto = await FaceLandmarker.createFromOptions(arquivosVision, {
      baseOptions: {
        modelAssetPath: `${baseUrl}${caminhoModeloRosto}`,
        delegate,
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
    });
    maos = await HandLandmarker.createFromOptions(arquivosVision, {
      baseOptions: {
        modelAssetPath: `${baseUrl}${caminhoModeloMaos}`,
        delegate,
      },
      runningMode: "VIDEO",
      numHands: 2,
    });

    return { rosto, maos };
  } catch (erro) {
    rosto?.close();
    maos?.close();
    throw erro;
  }
}

async function criarDetectoresComFallback() {
  let erroGpu;

  try {
    return {
      detectores: await criarDetectores("GPU"),
      delegate: "GPU",
    };
  } catch (erro) {
    erroGpu = erro;
  }

  try {
    return {
      detectores: await criarDetectores("CPU"),
      delegate: "CPU",
    };
  } catch (erroCpu) {
    throw new Error(
      `Falha ao carregar os modelos com GPU (${erroGpu.message}) e CPU (${erroCpu.message}).`,
    );
  }
}

function mensagemErroCamera(erro) {
  if (!window.isSecureContext && location.hostname !== "localhost") {
    return "A câmera só funciona em localhost ou em uma página HTTPS.";
  }

  if (erro.name === "NotAllowedError" || erro.name === "SecurityError") {
    return "Acesso à câmera negado. Permita o uso da webcam nas configurações do navegador e tente novamente.";
  }

  if (erro.name === "NotFoundError" || erro.name === "DevicesNotFoundError") {
    return "Nenhuma câmera foi encontrada. Conecte uma webcam e tente novamente.";
  }

  if (erro.name === "NotReadableError" || erro.name === "TrackStartError") {
    return "Não foi possível iniciar a câmera. Ela pode estar em uso por outro programa.";
  }

  if (erro.name === "OverconstrainedError") {
    return "A câmera disponível não atende aos requisitos solicitados.";
  }

  return `Não foi possível iniciar a câmera: ${erro.message}`;
}

function pararCamera() {
  if (quadroSolicitado !== undefined) {
    cancelAnimationFrame(quadroSolicitado);
    quadroSolicitado = undefined;
  }

  detectorRosto?.close();
  detectorMaos?.close();
  detectorRosto = undefined;
  detectorMaos = undefined;

  for (const faixa of fluxoCamera?.getTracks() ?? []) {
    faixa.stop();
  }

  fluxoCamera = undefined;
  video.srcObject = null;
}

async function iniciarCamera() {
  botaoCamera.disabled = true;

  if (!navigator.mediaDevices?.getUserMedia) {
    mostrarStatus(
      "Este navegador não disponibiliza câmera. Use um navegador atual em localhost ou HTTPS.",
      "error",
    );
    botaoCamera.disabled = false;
    return;
  }

  try {
    fluxoCamera = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    video.srcObject = fluxoCamera;
    await video.play();

    if (!video.videoWidth || !video.videoHeight) {
      await new Promise((resolve) => {
        video.addEventListener("loadedmetadata", resolve, { once: true });
      });
    }

    molduraCamera.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
    mostrarStatus("Carregando modelos do MediaPipe…");
    const { detectores, delegate } = await criarDetectoresComFallback();
    detectorRosto = detectores.rosto;
    detectorMaos = detectores.maos;
    botaoCamera.textContent = "Câmera iniciada";
    mostrarStatus(
      `Câmera ativa. Processamento em ${delegate}.${avisoImagens ? ` ${avisoImagens}` : ""}`,
      avisoImagens ? "error" : "success",
    );
    quadroSolicitado = requestAnimationFrame(processarQuadro);
  } catch (erro) {
    pararCamera();
    botaoCamera.disabled = false;

    if (erro.name === "NotAllowedError" || erro.name === "NotFoundError" ||
      erro.name === "NotReadableError" || erro.name === "SecurityError" ||
      erro.name === "OverconstrainedError") {
      mostrarStatus(mensagemErroCamera(erro), "error");
    } else {
      mostrarStatus(`Falha ao iniciar o processamento: ${erro.message}`, "error");
    }
  }
}

function processarQuadro() {
  if (!detectorRosto || !detectorMaos || video.readyState < 2) {
    quadroSolicitado = requestAnimationFrame(processarQuadro);
    return;
  }

  try {
    const largura = video.videoWidth;
    const altura = video.videoHeight;
    const timestamp = Math.max(Math.trunc(performance.now()), ultimoTimestamp + 1);
    ultimoTimestamp = timestamp;

    const resultadoRosto = detectorRosto.detectForVideo(video, timestamp);
    const resultadoMaos = detectorMaos.detectForVideo(video, timestamp);
    const infoRosto = extrairInfoRosto(resultadoRosto, largura, altura);
    const maos = resultadoMaos.landmarks ?? [];
    const gesto = reconhecerGesto(maos, infoRosto, largura, altura);

    exibidor.atualizar(exibidor.temImagem(gesto) ? gesto : null);

    if (canvas.width !== largura || canvas.height !== altura) {
      canvas.width = largura;
      canvas.height = altura;
    }

    desenharFrame(
      contexto,
      resultadoMaos,
      resultadoRosto,
      largura,
      altura,
      gesto,
    );
    quadroSolicitado = requestAnimationFrame(processarQuadro);
  } catch (erro) {
    pararCamera();
    botaoCamera.disabled = false;
    botaoCamera.textContent = "Iniciar câmera";
    mostrarStatus(`Falha durante a detecção: ${erro.message}`, "error");
  }
}

botaoCamera.addEventListener("click", iniciarCamera);
window.addEventListener("pagehide", pararCamera);
void carregarRecursos();

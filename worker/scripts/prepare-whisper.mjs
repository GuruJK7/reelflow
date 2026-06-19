// Pre-instala whisper.cpp + el modelo en tiempo de BUILD del contenedor,
// para no descargar/compilar en cada job. Versión y modelo por env.
import {
  installWhisperCpp,
  downloadWhisperModel,
} from "@remotion/install-whisper-cpp";

const to = process.env.REELFLOW_WHISPER_PATH || "/app/whisper";
const version = process.env.REELFLOW_WHISPER_VERSION || "1.5.5";
const model = process.env.REELFLOW_WHISPER_MODEL || "medium";

console.log(`[whisper] instalando whisper.cpp ${version} en ${to}`);
await installWhisperCpp({ to, version });

console.log(`[whisper] descargando modelo ${model}`);
await downloadWhisperModel({ folder: to, model });

console.log("[whisper] listo");

import { loadFont } from "@remotion/google-fonts/Poppins";

// Carga la fuente (Remotion espera con delayRender automáticamente).
const { fontFamily } = loadFont("normal", { weights: ["700", "800"] });

export const THEME = {
  accent: "#22d3ee", // visor cyan de Nocturno
  bg: "#0a0e17",
  font: fontFamily,
};

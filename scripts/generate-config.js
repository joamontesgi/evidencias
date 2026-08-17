const fs = require("fs");
const path = require("path");

const clientId =
  process.env.GOOGLE_CLIENT_ID || "TU_CLIENT_ID.apps.googleusercontent.com";

const rootFolder =
  process.env.ROOT_FOLDER_NAME || "Evidencias Edificio Sismo";

const config = `window.APP_CONFIG = {
  GOOGLE_CLIENT_ID: "${clientId}",
  ROOT_FOLDER_NAME: "${rootFolder}",
  EVIDENCE_TYPES: {
    antes: "Antes de reparaciones",
    despues: "Después del sismo",
  },
  MAX_FILE_SIZE_MB: 100,
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
  ],
};
`;

const outPath = path.join(__dirname, "..", "js", "config.js");
fs.writeFileSync(outPath, config, "utf8");

if (clientId.includes("TU_CLIENT_ID")) {
  console.warn(
    "⚠ GOOGLE_CLIENT_ID no está definida. Configura la variable en Vercel o edita js/config.js para desarrollo local."
  );
} else {
  console.log("✓ js/config.js generado correctamente");
}

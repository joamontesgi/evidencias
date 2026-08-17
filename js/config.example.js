// Copia este archivo como config.js y reemplaza con tu Client ID de Google Cloud.
// NO subas config.js a repositorios públicos si incluye datos sensibles.

window.APP_CONFIG = {
  // OAuth 2.0 Client ID (tipo "Aplicación web")
  GOOGLE_CLIENT_ID: "TU_CLIENT_ID.apps.googleusercontent.com",

  // Nombre de la carpeta raíz en tu Google Drive
  ROOT_FOLDER_NAME: "Evidencias Edificio Sismo",

  // Tipos de evidencia
  EVIDENCE_TYPES: {
    antes: "Antes de reparaciones",
    despues: "Después del sismo",
  },

  // Tamaño máximo por archivo (100 MB). Videos grandes usan subida reanudable.
  MAX_FILE_SIZE_MB: 100,

  // Extensiones permitidas
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

# Evidencias Apartamentos — Google Drive

App web para que los propietarios de un edificio suban fotos y videos del estado de su apartamento (antes de reparaciones / después del sismo). Los archivos se organizan automáticamente en tu Google Drive.

## Requisitos

- Una cuenta de Google (la tuya, como administrador del edificio)
- Navegador moderno (Chrome, Edge, Firefox)
- Conexión a internet

## Paso 1 — Crear proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un **proyecto nuevo** (ej: `evidencias-edificio`)
3. En el menú, ve a **APIs y servicios → Biblioteca**
4. Busca **Google Drive API** y haz clic en **Habilitar**

## Paso 2 — Configurar pantalla de consentimiento OAuth

1. Ve a **APIs y servicios → Pantalla de consentimiento de OAuth**
2. Tipo de usuario: **Externo** (o Interno si usas Google Workspace)
3. Completa los campos obligatorios:
   - Nombre de la app: `Evidencias Edificio`
   - Correo de asistencia: tu email
4. En **Ámbitos (Scopes)**, agrega:
   - `https://www.googleapis.com/auth/drive.file`
     _(Permite crear y acceder solo a archivos que la app sube — más seguro)_
5. En **Usuarios de prueba**, agrega tu correo de Google (obligatorio mientras la app esté en modo "Prueba")
6. Guarda

## Paso 3 — Crear credenciales OAuth

1. Ve a **APIs y servicios → Credenciales**
2. Clic en **+ Crear credenciales → ID de cliente de OAuth**
3. Tipo de aplicación: **Aplicación web**
4. Nombre: `Evidencias Web`
5. En **Orígenes autorizados de JavaScript**, agrega:
   - `http://localhost:5500` (Live Server en VS Code)
   - `http://localhost:8080` (servidor Python)
   - `http://127.0.0.1:5500`
   - La URL donde despliegues la app (ej: `https://tudominio.com`)
6. **No necesitas** URI de redirección para este flujo (token implícito con GIS)
7. Clic en **Crear** y copia el **Client ID**

## Paso 4 — Configurar la app

1. Abre `js/config.js`
2. Reemplaza `TU_CLIENT_ID.apps.googleusercontent.com` con tu Client ID real:

```js
GOOGLE_CLIENT_ID: "123456789-xxxx.apps.googleusercontent.com",
```

## Paso 5 — Ejecutar la app localmente

Google OAuth **no funciona** abriendo el HTML con doble clic (`file://`). Necesitas un servidor local:

### Opción A — VS Code Live Server
1. Instala la extensión **Live Server**
2. Clic derecho en `index.html` → **Open with Live Server**
3. Se abrirá en `http://127.0.0.1:5500`

### Opción B — Python
```bash
cd apartamento
python -m http.server 8080
```
Abre `http://localhost:8080`

### Opción C — Node.js
```bash
npx serve .
```

## Paso 6 — Usar la app

1. Abre la app en el navegador
2. Clic en **Iniciar sesión con Google** (usa tu cuenta de administrador)
3. Acepta los permisos
4. Completa: número de apto, propietario, tipo de evidencia
5. Arrastra fotos/videos o selecciónalos
6. Clic en **Subir evidencias a Google Drive**

Los archivos aparecerán en tu Drive con esta estructura:

```
Evidencias Edificio Sismo/
  └── Apto 501 - María González/
        ├── Antes de reparaciones/
        └── Después del sismo/
```

## Desplegar en Vercel

### 1. Subir el proyecto

**Opción A — Desde GitHub (recomendado)**
1. Crea un repositorio y sube este proyecto
2. Entra a [vercel.com](https://vercel.com) → **Add New Project**
3. Importa el repositorio
4. Vercel detecta la config automáticamente (`vercel.json`)

**Opción B — CLI**
```bash
npm i -g vercel
cd apartamento
vercel
```

### 2. Variable de entorno en Vercel

En el dashboard de Vercel → tu proyecto → **Settings → Environment Variables**:

| Variable | Valor |
|----------|-------|
| `GOOGLE_CLIENT_ID` | Tu Client ID de Google Cloud |

Opcional:

| Variable | Valor |
|----------|-------|
| `ROOT_FOLDER_NAME` | Nombre de la carpeta raíz en Drive |

En cada deploy, el build genera `js/config.js` con esa variable. No hace falta editar el archivo a mano en producción.

### 3. Autorizar la URL en Google Cloud

Después del primer deploy, copia tu URL de producción (ej: `https://evidencias-edificio.vercel.app`).

Ve a **Google Cloud → Credenciales → tu OAuth Client** y agrega en **Orígenes autorizados de JavaScript**:

```
https://evidencias-edificio.vercel.app
```

Si usas dominio propio (ej: `https://evidencias.tudominio.com`), agrégalo también.

> **Importante:** Google no acepta comodines (`*.vercel.app`). Las URLs de preview de Vercel no funcionarán con OAuth a menos que agregues cada URL manualmente. Usa la URL de **producción** o un dominio fijo.

### 4. Redeploy

Si agregaste la variable de entorno después del primer deploy, ve a **Deployments → Redeploy** para que el build regenere `config.js`.

### Checklist Vercel

- [ ] Proyecto importado en Vercel
- [ ] Variable `GOOGLE_CLIENT_ID` configurada
- [ ] URL de producción agregada en Google Cloud (Orígenes autorizados)
- [ ] Tu email en **Usuarios de prueba** de OAuth (mientras la app esté en modo Prueba)
- [ ] Deploy exitoso y login probado en la URL pública

## Modo de uso recomendado

Como los datos van a **tu** cuenta de Drive:

- **Opción 1 (simple):** Tú inicias sesión y dejas la app abierta en una tablet/computadora del edificio para que los propietarios suban sus evidencias.
- **Opción 2 (más seguro):** Despliegas la app y compartes el enlace; cada sesión requiere que inicies sesión con tu cuenta (o implementas un backend con service account).

## Limitaciones actuales

- La sesión de Google expira (~1 hora). Si expira, hay que volver a iniciar sesión.
- Máximo 100 MB por archivo (configurable en `config.js`).
- Mientras la app esté en modo "Prueba" en Google Cloud, solo los **usuarios de prueba** registrados pueden autenticarse.
- No hay panel de administración; organización solo por carpetas en Drive.

## Solución de problemas

| Error | Solución |
|-------|----------|
| `redirect_uri_mismatch` | Verifica que la URL en el navegador coincida con un origen autorizado |
| `access_denied` | Agrega tu email en Usuarios de prueba de OAuth |
| `API has not been used` | Habilita Google Drive API en la biblioteca |
| No carga Google Sign-In | Usa servidor local, no `file://` |
| Token expirado | Cierra sesión y vuelve a iniciar |

## Archivos del proyecto

```
apartamento/
├── index.html
├── vercel.json              # Config de deploy en Vercel
├── package.json
├── scripts/
│   └── generate-config.js   # Genera config.js desde env vars
├── js/
│   ├── config.js            # Local: editar a mano | Vercel: auto-generado
│   ├── config.example.js
│   ├── auth.js
│   ├── drive.js
│   └── app.js
└── README.md
```

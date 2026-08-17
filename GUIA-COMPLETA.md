# Guía completa desde cero

Sigue estos pasos en orden. Marca cada uno al terminarlo.

---

## PARTE A — Google Cloud (15-20 min)

### Paso 1: Entrar a Google Cloud

1. Abre https://console.cloud.google.com/
2. Inicia sesión con **tu cuenta de Google** (la misma donde quieres guardar las fotos en Drive)

### Paso 2: Crear proyecto

1. Arriba a la izquierda, clic en el selector de proyectos
2. Clic en **Nuevo proyecto**
3. Nombre: `evidencias-edificio`
4. Clic en **Crear**
5. Espera unos segundos y selecciona ese proyecto

### Paso 3: Habilitar Google Drive API

1. Menú ☰ → **APIs y servicios** → **Biblioteca**
2. Busca: `Google Drive API`
3. Clic en el resultado → **Habilitar**

### Paso 4: Pantalla de consentimiento OAuth

1. Menú ☰ → **APIs y servicios** → **Pantalla de consentimiento de OAuth**
2. Tipo de usuario: **Externo** → **Crear**
3. Completa:
   - Nombre de la app: `Evidencias Edificio`
   - Correo de asistencia: tu email
   - Correo del desarrollador: tu email
4. Clic **Guardar y continuar**
5. En **Ámbitos** → **Agregar o quitar ámbitos**
   - Busca y marca: `.../auth/drive.file`
   - Descripción: "Ver y administrar archivos creados por esta app"
6. **Guardar y continuar**
7. En **Usuarios de prueba** → **+ Agregar usuarios**
   - Agrega **tu mismo email** (obligatorio mientras la app esté en "Prueba")
8. **Guardar y continuar** → **Volver al panel**

### Paso 5: Crear credenciales OAuth

1. Menú ☰ → **APIs y servicios** → **Credenciales**
2. **+ Crear credenciales** → **ID de cliente de OAuth**
3. Tipo: **Aplicación web**
4. Nombre: `Evidencias Web`
5. En **Orígenes autorizados de JavaScript**, agrega (uno por línea):

```
http://localhost:8080
http://127.0.0.1:8080
```

> La URL de Vercel la agregarás después del deploy (Paso 12).

6. **Crear**
7. **Copia el Client ID** (algo como `123456789-abc.apps.googleusercontent.com`)
   - Guárdalo en un bloc de notas, lo usarás en los pasos 7 y 11

---

## PARTE B — Configurar la app local (5 min)

### Paso 6: Editar config.js

1. Abre el archivo `js/config.js`
2. Reemplaza la línea del Client ID:

```js
GOOGLE_CLIENT_ID: "PEGA_AQUI_TU_CLIENT_ID.apps.googleusercontent.com",
```

3. Guarda el archivo

### Paso 7: Probar en local

Abre PowerShell en la carpeta del proyecto:

```powershell
cd C:\Users\joamontesgi\Desktop\apartamento
python -m http.server 8080
```

Luego abre en el navegador: **http://localhost:8080**

Prueba:
- [ ] Clic en "Iniciar sesión con Google"
- [ ] Acepta permisos
- [ ] Llena el formulario con datos de prueba
- [ ] Sube una foto pequeña
- [ ] Verifica que aparece en tu Google Drive en la carpeta `Evidencias Edificio Sismo`

Si algo falla, revisa la tabla de errores al final de esta guía.

---

## PARTE C — Subir a GitHub (10 min)

### Paso 8: Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `evidencias-edificio` (o el que prefieras)
3. **No** marques "Add README" (ya tienes archivos)
4. Clic **Create repository**
5. Copia la URL del repo (ej: `https://github.com/tuusuario/evidencias-edificio.git`)

### Paso 9: Subir el código

En PowerShell (cierra el servidor local con Ctrl+C primero):

```powershell
cd C:\Users\joamontesgi\Desktop\apartamento
git init
git add .
git commit -m "App evidencias apartamentos con Google Drive"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

> Reemplaza la URL de `git remote add origin` con la tuya.

---

## PARTE D — Desplegar en Vercel (10 min)

### Paso 10: Crear cuenta y conectar repo

1. Ve a https://vercel.com/signup (puedes registrarte con GitHub)
2. **Add New...** → **Project**
3. Importa el repositorio `evidencias-edificio`
4. Vercel detectará la config automáticamente

### Paso 11: Variable de entorno

Antes de hacer Deploy, en la sección **Environment Variables**:

| Name | Value |
|------|-------|
| `GOOGLE_CLIENT_ID` | Tu Client ID completo |

Clic **Add** → luego **Deploy**

Espera 1-2 minutos. Copia la URL que te da (ej: `https://evidencias-edificio.vercel.app`)

### Paso 12: Autorizar URL de Vercel en Google

1. Vuelve a Google Cloud → **Credenciales** → tu OAuth Client
2. Clic en el lápiz (editar)
3. En **Orígenes autorizados de JavaScript**, agrega tu URL de Vercel:

```
https://evidencias-edificio.vercel.app
```

(Sin barra `/` al final)

4. **Guardar**
5. Espera 1-2 minutos para que Google aplique el cambio

### Paso 13: Probar en producción

1. Abre tu URL de Vercel en el navegador
2. Inicia sesión con Google
3. Sube una foto de prueba
4. Verifica en Google Drive

---

## PARTE E — Uso diario en el edificio

1. Abre la app en una tablet o PC del edificio
2. **Tú** inicias sesión con tu cuenta de Google (una vez)
3. Los propietarios llenan: número de apto, nombre, tipo de evidencia
4. Suben fotos/videos
5. Todo se guarda en tu Drive automáticamente

Estructura en Drive:

```
Evidencias Edificio Sismo/
  └── Apto 501 - María González/
        ├── Antes de reparaciones/
        └── Después del sismo/
```

---

## Errores comunes

| Error | Qué hacer |
|-------|-----------|
| `access_denied` | Agrega tu email en Usuarios de prueba (Paso 4) |
| `origin_mismatch` o `redirect_uri` | La URL del navegador debe estar en Orígenes autorizados |
| `Google Identity Services no cargó` | No abras el HTML con doble clic; usa servidor local o Vercel |
| Login funciona en local pero no en Vercel | Agrega la URL de Vercel en Google Cloud (Paso 12) |
| `API has not been used` | Habilita Google Drive API (Paso 3) |
| Sesión expira | Vuelve a hacer clic en "Iniciar sesión con Google" (~1 hora) |

---

## Checklist final

- [ ] Proyecto creado en Google Cloud
- [ ] Google Drive API habilitada
- [ ] Pantalla OAuth configurada con scope `drive.file`
- [ ] Tu email en Usuarios de prueba
- [ ] Client ID creado y copiado
- [ ] `js/config.js` actualizado
- [ ] Prueba local exitosa
- [ ] Código en GitHub
- [ ] Deploy en Vercel con variable `GOOGLE_CLIENT_ID`
- [ ] URL de Vercel en Orígenes autorizados de Google
- [ ] Prueba en producción exitosa

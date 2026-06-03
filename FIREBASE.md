# Conectar Invicta Herrera a Firebase (multi-dispositivo) 🔑

Esta guía te lleva de **modo local** (datos en un solo dispositivo) a **modo nube**:
las 3 personas escanean el QR desde sus propios celulares y **todos los registros
llegan al site central en tiempo real**. Es gratis y no hace falta tarjeta.

Tiempo estimado: **~10 minutos.** No tenés que tocar el código: solo pegás tu
configuración en el archivo `firebase-config.js`.

---

## Paso 1 — Crear el proyecto

1. Entrá a **https://console.firebase.google.com/** e iniciá sesión con tu cuenta de Google.
2. Hacé clic en **“Crear un proyecto”** (o *Add project*).
3. Ponele un nombre, por ejemplo **`invicta-herrera-keys`**.
4. Podés **desactivar** Google Analytics (no hace falta). Clic en **Crear proyecto**.

## Paso 2 — Crear la base de datos (Firestore)

1. En el menú izquierdo: **Compilación → Firestore Database**.
2. Clic en **“Crear base de datos”**.
3. Elegí una ubicación (por ej. `southamerica-east1` para Sudamérica) → **Siguiente**.
4. Empezá en **“modo de prueba”** (*test mode*) → **Habilitar**.
   (En el Paso 4 ponemos las reglas definitivas y seguras.)

## Paso 3 — Registrar la app web

1. En **Descripción general del proyecto** (ícono ⚙️ → *Configuración del proyecto*),
   bajá hasta **“Tus apps”** y hacé clic en el ícono **web `</>`**.
2. Ponele un apodo, por ej. **`invicta-herrera-web`**. **No** marques Firebase Hosting. Clic en **Registrar app**.
3. Firebase te muestra un bloque de código con un objeto **`firebaseConfig`**. Eso es lo que necesitás.
   Tiene esta forma:

   ```js
   const firebaseConfig = {
     apiKey: "AIza........",
     authDomain: "invicta-herrera-keys.firebaseapp.com",
     projectId: "invicta-herrera-keys",
     storageBucket: "invicta-herrera-keys.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcd...",
   };
   ```

## Paso 4 — Reglas de seguridad (importante 🔒)

En **Firestore Database → pestaña “Reglas”**, reemplazá todo por esto y publicá:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /registros_invicta_herrera/{doc} {
      // Cualquiera con el QR puede crear y cerrar registros…
      allow read, create, update: if true;
      // …pero NADIE puede borrarlos: el historial es permanente.
      allow delete: if false;
    }
  }
}
```

> Estas reglas refuerzan tu pedido: **los registros no se pueden eliminar** ni siquiera
> desde la base. Más adelante, si querés, podemos exigir un login para escribir.

## Paso 5 — Pegar tu configuración

1. Abrí el archivo **`firebase-config.js`** del proyecto.
2. Copiá los valores de **`firebaseConfig`** (Paso 3) dentro de `window.FIREBASE_CONFIG`.
   Solo `apiKey` y `projectId` son obligatorios; pegá todos igual. Debe quedar así:

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIza........",
     authDomain: "invicta-herrera-keys.firebaseapp.com",
     projectId: "invicta-herrera-keys",
     storageBucket: "invicta-herrera-keys.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcd...",
   };
   ```

3. Guardá. **Listo:** al abrir el site verás el indicador **“Nube · en línea”** (verde)
   en la esquina superior derecha. A partir de ahí, todo lo que se escanee desde
   cualquier celular aparece en el site para todos.

## Paso 6 — Subir a GitHub Pages

1. Subí **todos** los archivos del proyecto al repositorio de GitHub.
2. En el repo: **Settings → Pages → Branch: `main` / root → Save**.
3. A los pocos minutos tendrás una URL pública, por ej.
   `https://tu-usuario.github.io/invicta-herrera-keys/Invicta%20Herrera%20-%20Control%20de%20Llaves.html`
4. **El QR** del cartel (botón “Cartel QR” en el site) apunta automáticamente a esa
   página: imprimilo en A4 y pegalo en la obra. Quien lo escanee abre el formulario.

---

## Preguntas frecuentes

**¿Es realmente gratis?** Sí. El plan *Spark* (gratuito) de Firestore alcanza de sobra
para este uso (miles de lecturas/escrituras por día sin costo).

**¿Y si se corta internet?** Firestore guarda en caché offline; cuando vuelve la
conexión, sincroniza. Además el sistema mantiene un espejo local de respaldo.

**¿Se pueden perder datos?** No por uso normal: entregar una llave solo cambia el
estado (no borra), las reglas impiden eliminar, y siempre podés bajar la **copia de
seguridad (JSON)** desde el pie del site.

**¿Quién ve el registro?** Solo quien entra al site con el PIN. Quien escanea para
retirar/entregar solo ve el formulario.

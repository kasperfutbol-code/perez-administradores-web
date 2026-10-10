# Web Pérez Administradores — lista para GitHub y Vercel

Proyecto **HTML + CSS + JavaScript**, sin npm, sin React, sin base de datos y sin dependencias externas.

## Qué incluye

- `index.html`: Inicio.
- `servicios.html`: administración de fincas, reformas, seguros y energía.
- `nosotros.html`: el despacho y equipo.
- `presupuesto.html`: paquetes y solicitud.
- `contacto.html`: ubicación y formulario.
- `privacidad.html`: **borrador pendiente de validación legal**.
- `assets/style.css`: todos los colores y estilos.
- `assets/main.js`: menú para móvil, formularios y preselección de paquete.
- `assets/edificio.svg`: ilustración local (puedes cambiarla por una foto real con permiso).
- `assets/favicon.svg`: icono de la pestaña.
- `sitemap.xml`, `robots.txt` y `vercel.json`: SEO y ajustes de Vercel.

## Cómo ver la web en tu ordenador

Abre `index.html` con el navegador. Para probar rutas y navegación de forma más parecida a producción puedes ejecutar `python3 -m http.server 8000` desde esta carpeta y abrir `http://localhost:8000`.

## Publicar en GitHub y Vercel (sin terminal)

1. En [github.com](https://github.com), crea un repositorio **New repository**, por ejemplo `perez-administradores-web`.
2. En el repositorio, usa **Add file → Upload files**. Arrastra el **contenido de esta carpeta** (todos los HTML, `assets`, `vercel.json`, etc.), no el ZIP sin descomprimir. Confirma con **Commit changes**.
3. En [vercel.com](https://vercel.com), entra con GitHub y elige **Add New → Project**.
4. Importa `perez-administradores-web`.
5. En **Framework Preset**, usa **Other** (sitio estático); no hay build command ni variables de entorno. Root Directory `./`. Deja Build Command vacío y pulsa **Deploy**.
6. Abre la dirección de prueba que te dará Vercel (acabada en `.vercel.app`) y verifica menús y formularios.
7. **Solo cuando todo esté revisado**, añade el dominio propio desde **Project → Settings → Domains** y sigue los registros DNS exactos que Vercel muestre. Si la web actual tiene correo con el dominio, **no borres los registros MX, SPF, DKIM ni DMARC**.

## MUY IMPORTANTE: tres puntos para revisar antes de publicar definitivamente

**1. Acceso al despacho online.** En `index.html` el botón "Acceso clientes" dirige temporalmente a `https://www.perezadministradores.com/`. Debes cambiarlo por la URL **directa y verdadera** del área privada; esta no se ha podido verificar. No cambies el dominio hasta que funcione el enlace directo.

**2. Formularios.** Están operativos mediante `mailto:`: preparan un correo a `andres@perezadministradores.com`, pero **no lo envían automáticamente**. El visitante debe tener una aplicación de correo configurada y pulsar Enviar. Para solicitudes automáticas se necesita conectar un proveedor de formularios o una función de servidor (por ejemplo, Formspree, Resend o un endpoint serverless), validar spam y revisar el aviso legal. La dirección de destino puede cambiarse en `assets/main.js` buscando `const target=`.

**3. Protección de datos y contenido legal.** `privacidad.html` es orientativa y necesita revisión y adaptación jurídica. Si el dominio sustituye la web anterior, conservar o redirigir las antiguas URL legales y las demás URL con tráfico/posicionamiento. No se incluye migración del blog ni redirecciones de antiguas rutas: hay que planificarlas antes del lanzamiento.

## Cómo personalizar

- Teléfono: busca `963473129` o `96 347 31 29` en los HTML.
- Correo: busca `andres@perezadministradores.com` en HTML y JS.
- Dirección: busca `Manuel Sanchís Guarner`.
- Colores: cambia `--ink`, `--bg`, `--accent` al inicio de `assets/style.css`.
- Ilustración de portada: sustituye `assets/edificio.svg` (y actualiza `src` en `index.html`).
- Textos y secciones: modifica directamente el HTML correspondiente.
- URL del despacho online: en `index.html` localiza `title="Enlace provisional` y actualiza el `href`.

## SEO / cambio de dominio

Las meta descriptions y títulos están incluidos. Los canonical y el sitemap apuntan al dominio de la empresa **para el momento en que esta web lo sustituya**. No debe publicarse como otra web indexable competidora. Si quieres probarla en Vercel, usa su URL de prueba sin difundirla como nueva web oficial. Si luego se usa otro dominio, cambia `canonical`, `og:url`, `robots.txt`, `sitemap.xml` y el `url` de datos estructurados. Configura redirecciones 301 específicas de las URL actuales del WordPress; no lo soluciones todo con una redirección general a la home.

## Fuentes utilizadas para reconstruir los contenidos

Web oficial de Pérez Administradores: https://www.perezadministradores.com/ , página de presupuesto, servicios de seguros y energía y política de privacidad. Datos consultados el 09/10/2026. Verifica los datos antes del lanzamiento; las cifras pueden cambiar.

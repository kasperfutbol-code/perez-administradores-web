# Panel privado — instrucciones para Pérez Administradores

## Requisitos

La base de datos Supabase tiene las tablas `solicitudes` y `administradores`; el usuario administrador ya existe y está incluido en `administradores`. Deben estar activadas las políticas RLS que permiten al administrador autenticado consultar/actualizar `solicitudes`.

## Nuevos archivos (no sustituyen la web)

- `login.html`: acceso privado.
- `admin.html`: panel con indicadores, buscador, filtros, detalle, estados y notas.
- `assets/admin.css`: estilos del panel.
- `assets/admin.js`: lógica del panel y conexión Supabase Auth.
- `assets/supabase-config.js`: **debe completarse con la URL y la clave pública del proyecto**.

**Los formularios públicos no se han modificado todavía.** Hasta que se realice la segunda fase, seguirán abriendo el correo como antes, y la tabla `solicitudes` estará vacía salvo entradas creadas manualmente.

## Configurar Supabase (sin contraseñas)

1. En Supabase, entra en **Project Settings → API Keys** y copia la clave **publishable** (`sb_publishable_...`) o, si es una configuración antigua, la clave **anon/public**. NO copies `secret`, `service_role`, la contraseña de la base de datos ni la contraseña de tu usuario.
2. Copia también el **Project URL**, en **Project Settings → Data API** o en la pantalla general de tu proyecto. Empieza por `https://` y termina por `.supabase.co`.
3. En GitHub, dentro del repositorio `kasperfutbol-code/perez-administradores-web`, abre `assets/supabase-config.js`, pulsa el lápiz (Edit) y sustituye **solo** estos textos:
   - `PEGA_AQUI_LA_URL_DEL_PROYECTO` por tu Project URL.
   - `PEGA_AQUI_LA_PUBLISHABLE_KEY` por tu clave pública publishable / anon.
4. Pulsa **Commit changes**.
5. Cuando Vercel publique la nueva versión, abre `https://perez-administradores-web.vercel.app/login.html` e inicia sesión con el usuario creado en Supabase Authentication → Users.

La URL y la clave publishable son **públicas por diseño**; la tabla debe seguir protegida mediante las políticas RLS. No publiques secretos de servidor.

## Subir a GitHub

Descomprime el ZIP de actualización y sube los archivos a la **raíz del repositorio** sin crear una carpeta extra. Los `.html` deben quedar junto a `index.html` y los nuevos JS/CSS dentro de `assets`.

## Segunda fase (pendiente)

Conectar `presupuesto.html` y `contacto.html` mediante una función de Vercel que inserte datos en Supabase. La función utilizará una clave **secreta** almacenada solo en variables de entorno de Vercel, con validaciones y protección antispam. No usar claves de administrador en HTML/JS del navegador, ni dar permisos públicos SELECT/UPDATE/DELETE en `solicitudes`.

Antes de enviar datos reales: revisar aviso legal y privacidad, limitación de acceso, políticas RLS, antispam, retención de datos y RGPD.

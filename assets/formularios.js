import { TURNSTILE_SITE_KEY } from './formularios-config.js';

const form = document.querySelector('form[data-api-form]');
if (form) iniciarFormulario(form);

function iniciarFormulario(form) {
  const tipo = form.dataset.apiForm;
  const boton = form.querySelector('button[type="submit"]');
  const feedback = form.querySelector('.form-feedback');
  const contenedor = form.querySelector('[data-turnstile-container]');
  const sitekey = String(TURNSTILE_SITE_KEY || '').trim();
  const activo = sitekey && !sitekey.includes('PEGA_AQUI') && sitekey.length > 15;
  let token = '';
  let widgetId = null;

  function mensaje(texto, correcto = false) {
    feedback.textContent = texto;
    feedback.style.color = correcto ? '#246645' : '#8a3d32';
  }

  const resetCaptcha = () => {
    token = '';
    if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
  };

  if (activo) {
    contenedor.hidden = false;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => {
      if (!window.turnstile) return mensaje('No se pudo cargar la protección del formulario. Inténtalo más tarde.');
      widgetId = window.turnstile.render(contenedor, {
        sitekey,
        action: tipo,
        theme: 'light',
        callback: valor => { token = valor; },
        'expired-callback': () => { token = ''; },
        'error-callback': () => { token = ''; mensaje('No se pudo completar la verificación de seguridad. Actualiza la página.'); },
      });
    };
    script.onerror = () => mensaje('No se pudo cargar la verificación del formulario. Comprueba tu conexión.');
    document.head.append(script);
  }

  function generarMensajeCorreo() {
    const lineas = [];
    for (const [clave, valor] of new FormData(form)) {
      if (clave !== 'privacidad' && clave !== 'website' && String(valor).trim()) {
        lineas.push(`${clave}: ${String(valor).trim()}`);
      }
    }
    const asunto = tipo === 'presupuesto' ? 'Solicitud de presupuesto · Web Pérez Administradores' : 'Consulta · Web Pérez Administradores';
    const cuerpo = ['Hola,', '', 'Quisiera contactar con Pérez Administradores.', '', ...lineas].join('\n');
    mensaje('El envío automático está pendiente de configuración. Se abrirá tu programa de correo: revisa el mensaje y pulsa Enviar.');
    window.location.href = `mailto:andres@perezadministradores.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!activo) return generarMensajeCorreo();
    if (!widgetId || !token) {
      mensaje('Completa la verificación de seguridad antes de enviar el formulario.');
      return;
    }

    const datos = Object.fromEntries(new FormData(form).entries());
    const solicitud = {
      tipo,
      nombre: String(datos.Nombre || '').trim(),
      email: String(datos.Correo || '').trim(),
      telefono: String(datos['Teléfono'] || '').trim(),
      comunidad: String(datos.Comunidad || '').trim(),
      localidad: String(datos.Localidad || '').trim(),
      numero_viviendas: datos.Viviendas === '' ? null : Number(datos.Viviendas),
      servicio: tipo === 'presupuesto' ? String(datos.Modalidad || 'consultar') : 'consulta',
      mensaje: String(datos.Mensaje || '').trim(),
      website: String(datos.website || ''),
      turnstileToken: token,
    };

    boton.disabled = true;
    mensaje('Enviando tu solicitud…');
    try {
      const respuesta = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(solicitud),
      });
      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(data.error || 'No se ha podido enviar el formulario.');
      form.reset();
      mensaje('Tu solicitud se ha enviado correctamente. Nos pondremos en contacto contigo.', true);
    } catch (error) {
      mensaje(error.message || 'No se ha podido enviar el formulario. Inténtalo más tarde.');
    } finally {
      boton.disabled = false;
      resetCaptcha();
    }
  });
}

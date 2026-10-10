import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

const validConfig = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL)
  && typeof SUPABASE_PUBLISHABLE_KEY === 'string'
  && SUPABASE_PUBLISHABLE_KEY.length > 30
  && !SUPABASE_PUBLISHABLE_KEY.includes('PEGA_AQUI');

const intro = document.querySelector('#recovery-intro');
const feedback = document.querySelector('#recovery-feedback');
const form = document.querySelector('#recovery-form');
const submit = document.querySelector('#recovery-submit');
const query = new URLSearchParams(window.location.search);
const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
const linkError = query.get('error_code') || hash.get('error_code') || query.get('error');
// Los tokens son consumidos por supabase-js y nunca se muestran en la página.
const recoveryLink = hash.get('type') === 'recovery' || query.has('code');

if (!validConfig) {
  document.querySelector('#recovery-config-error').hidden = false;
  intro.textContent = 'La conexión de Supabase todavía no está configurada.';
} else if (linkError) {
  intro.textContent = 'Este enlace de recuperación ha caducado o no es válido. Solicita uno nuevo desde la pantalla de acceso.';
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  });
  let active = false;
  const activate = () => {
    if (active) return;
    active = true;
    form.hidden = false;
    intro.textContent = 'El enlace se ha verificado. Escribe una contraseña nueva (12 caracteres como mínimo).';
  };

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' && session && recoveryLink) activate();
  });

  // También admite enlaces que usen ?code= y sesiones obtenidas después de la redirección.
  (async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session && recoveryLink) {
        activate();
      } else if (!active) {
        intro.textContent = 'No se ha encontrado una recuperación válida. Pide un enlace nuevo desde la pantalla de acceso.';
      }
    } catch (_) {
      intro.textContent = 'No se ha podido verificar el enlace. Vuelve a solicitar uno desde la pantalla de acceso.';
    }
  })();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!active) return;
    const password = document.querySelector('#new-password').value;
    const confirmPassword = document.querySelector('#confirm-password').value;
    if (password.length < 12) {
      feedback.textContent = 'La contraseña debe tener al menos 12 caracteres.';
      return;
    }
    if (password !== confirmPassword) {
      feedback.textContent = 'Las contraseñas no coinciden.';
      return;
    }
    submit.disabled = true;
    feedback.textContent = 'Guardando nueva contraseña…';
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      form.hidden = true;
      intro.textContent = 'Contraseña actualizada correctamente.';
      feedback.textContent = 'Ya puedes volver a la pantalla de acceso e iniciar sesión con tu nueva contraseña.';
      feedback.classList.add('recovery-success');
      try { await supabase.auth.signOut(); } catch (_) {}
    } catch (error) {
      feedback.textContent = 'No se ha podido guardar la contraseña. El enlace podría haber caducado; solicita uno nuevo. ' + (error.message || '');
      feedback.classList.add('recovery-error');
    } finally {
      submit.disabled = false;
    }
  });
}

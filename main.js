// Web estática: los formularios preparan un mensaje en el correo del visitante.
// No se envía ningún dato a un servidor desde esta página.
(() => {
  const menu = document.querySelector('#main-navigation');
  const toggle = document.querySelector('.nav-toggle');
  if (menu && toggle) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('open', !expanded);
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  const requestedPlan = new URLSearchParams(location.search).get('plan');
  const planSelect = document.querySelector('#plan');
  if (requestedPlan && planSelect && [...planSelect.options].some(option => option.value === requestedPlan)) {
    planSelect.value = requestedPlan;
  }

  document.querySelectorAll('form[data-mailto]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const lines = [];
      new FormData(form).forEach((value, key) => {
        if (key !== 'privacidad' && String(value).trim()) {
          lines.push(`${key}: ${String(value).trim()}`);
        }
      });
      const type = form.dataset.mailto || 'Contacto';
      const target = 'andres@perezadministradores.com'; // Cambiar si el despacho lo indica.
      const subject = encodeURIComponent(`${type} · Web Pérez Administradores`);
      const content = ['Hola,', '', 'Quisiera contactar con Pérez Administradores.', '', ...lines, '', 'Este correo se ha preparado desde el formulario de la web.'];
      const body = encodeURIComponent(content.join('\n'));
      const result = form.querySelector('.form-feedback');
      if (result) {
        result.textContent = 'Se abrirá tu programa de correo. Para completar la solicitud, revisa el mensaje y pulsa Enviar.';
        result.setAttribute('role', 'status');
      }
      window.location.href = `mailto:${target}?subject=${subject}&body=${body}`;
    });
  });
})();

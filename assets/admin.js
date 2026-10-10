import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

// La clave de este fichero es pública. Los permisos reales se comprueban con RLS en Supabase.
const validConfig = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL)
  && typeof SUPABASE_PUBLISHABLE_KEY === 'string'
  && SUPABASE_PUBLISHABLE_KEY.length > 30
  && !SUPABASE_PUBLISHABLE_KEY.includes('PEGA_AQUI');

const client = validConfig
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;

const $ = (selector) => document.querySelector(selector);
const setText = (selector, value) => { const element = $(selector); if (element) element.textContent = value ?? ''; };
const show = (selector, visible) => { const el = $(selector); if (el) el.hidden = !visible; };
const page = document.body.dataset.panelPage;
const statuses = {
  pendiente: 'Pendiente',
  contactada: 'Contactada',
  presupuesto_enviado: 'Presupuesto enviado',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
};

async function administratorAccess(userId) {
  const { data, error } = await client.from('administradores')
    .select('usuario_id')
    .eq('usuario_id', userId)
    .maybeSingle();
  if (error) throw new Error('No se ha podido comprobar el permiso de administrador. ' + error.message);
  return Boolean(data);
}

async function initLogin() {
  if (!client) {
    show('#auth-config-error', true);
    $('#login-submit').disabled = true;
    return;
  }
  // Nunca redirigir por una sesión antigua sin verificar permisos.
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (!userError && user && await administratorAccess(user.id).catch(() => false)) {
    window.location.replace('admin.html');
    return;
  }

  $('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = $('#login-submit');
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    submit.disabled = true;
    setText('#login-feedback', 'Comprobando credenciales…');
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error('No se ha podido iniciar sesión. Revisa el correo y la contraseña.');
      const isAdmin = await administratorAccess(data.user.id);
      if (!isAdmin) {
        await client.auth.signOut();
        throw new Error('Esta cuenta no está autorizada para acceder al panel.');
      }
      window.location.replace('admin.html');
    } catch (error) {
      setText('#login-feedback', error.message || 'No se ha podido acceder.');
    } finally {
      submit.disabled = false;
    }
  });
}

let allRequests = [];
let selectedId = null;
const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });
const safeDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date);
};
const textOrDash = (value) => (value === null || value === undefined || String(value).trim() === '') ? '—' : String(value);

function makeCell(value, subtext) {
  const td = document.createElement('td');
  const strong = document.createElement('strong');
  strong.textContent = textOrDash(value);
  td.append(strong);
  if (subtext) {
    const small = document.createElement('small');
    small.textContent = subtext;
    td.append(small);
  }
  return td;
}

function renderRequests() {
  const filter = $('#state-filter').value;
  const search = $('#search-input').value.trim().toLocaleLowerCase('es');
  const selected = allRequests.filter((request) => {
    if (filter !== 'todos' && request.estado !== filter) return false;
    const haystack = [request.nombre, request.email, request.telefono, request.comunidad, request.servicio]
      .filter(Boolean).join(' ').toLocaleLowerCase('es');
    return !search || haystack.includes(search);
  });
  const tbody = $('#solicitudes-rows');
  tbody.replaceChildren();
  if (!selected.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = allRequests.length ? 'No hay solicitudes con estos filtros.' : 'Todavía no hay solicitudes. Conectaremos el formulario en el siguiente paso.';
    tr.append(td);
    tbody.append(tr);
  } else {
    for (const item of selected) {
      const tr = document.createElement('tr');
      tr.append(makeCell(safeDate(item.fecha)), makeCell(item.nombre, item.email), makeCell(item.comunidad), makeCell(item.servicio));
      const tdStatus = document.createElement('td');
      const status = document.createElement('span');
      status.className = `state-pill ${Object.hasOwn(statuses, item.estado) ? 'state-' + item.estado : ''}`;
      status.textContent = statuses[item.estado] ?? textOrDash(item.estado);
      tdStatus.append(status);
      tr.append(tdStatus);
      const tdButton = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'panel-open-button';
      button.textContent = 'Ver ficha →';
      button.addEventListener('click', () => openRequest(item.id));
      tdButton.append(button);
      tr.append(tdButton);
      tbody.append(tr);
    }
  }
  setText('#table-count', `${selected.length} de ${allRequests.length} solicitudes mostradas (máximo 500 recientes).`);
}

function updateStats() {
  setText('#stat-total', allRequests.length);
  setText('#stat-pendientes', allRequests.filter(v => v.estado === 'pendiente').length);
  setText('#stat-seguimiento', allRequests.filter(v => v.estado === 'contactada' || v.estado === 'presupuesto_enviado').length);
  setText('#stat-aceptadas', allRequests.filter(v => v.estado === 'aceptada').length);
  setText('#list-description', `${allRequests.length} solicitudes cargadas. Pulsa una ficha para editarla.`);
}

async function loadRequests() {
  show('#panel-error', false);
  const refresh = $('#refresh-button');
  refresh.disabled = true;
  try {
    const { data, error } = await client.from('solicitudes')
      .select('id,fecha,nombre,email,telefono,comunidad,numero_viviendas,servicio,mensaje,estado,notas_internas')
      .order('fecha', { ascending: false })
      .limit(500);
    if (error) throw error;
    allRequests = data || [];
    updateStats();
    renderRequests();
  } catch (error) {
    setText('#panel-error', 'No se pudieron cargar las solicitudes. Comprueba los permisos RLS en Supabase. ' + (error.message || ''));
    show('#panel-error', true);
    setText('#list-description', 'Error al cargar solicitudes');
  } finally {
    refresh.disabled = false;
  }
}

function openRequest(id) {
  const item = allRequests.find(v => v.id === id);
  if (!item) return;
  selectedId = item.id;
  setText('#detail-title', textOrDash(item.nombre));
  const email = $('#detail-email');
  email.textContent = textOrDash(item.email);
  email.href = item.email ? `mailto:${encodeURIComponent(item.email)}` : '#';
  setText('#detail-phone', textOrDash(item.telefono));
  setText('#detail-community', textOrDash(item.comunidad));
  setText('#detail-homes', textOrDash(item.numero_viviendas));
  setText('#detail-service', textOrDash(item.servicio));
  setText('#detail-date', safeDate(item.fecha));
  setText('#detail-message', textOrDash(item.mensaje));
  $('#detail-status').value = Object.hasOwn(statuses, item.estado) ? item.estado : 'pendiente';
  $('#detail-notes').value = item.notas_internas || '';
  setText('#save-feedback', '');
  show('#request-detail', true);
  $('#request-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveRequest() {
  if (!selectedId) return;
  const status = $('#detail-status').value;
  const notes = $('#detail-notes').value.trim();
  if (!Object.hasOwn(statuses, status)) return;
  $('#save-detail').disabled = true;
  setText('#save-feedback', 'Guardando…');
  try {
    const { data, error } = await client.from('solicitudes')
      .update({ estado: status, notas_internas: notes })
      .eq('id', selectedId)
      .select('id')
      .single();
    if (error || !data) throw error || new Error('No se ha actualizado el registro.');
    const item = allRequests.find(v => v.id === selectedId);
    if (item) { item.estado = status; item.notas_internas = notes; }
    updateStats();
    renderRequests();
    setText('#save-feedback', 'Cambios guardados correctamente.');
  } catch (error) {
    setText('#save-feedback', 'Error al guardar: ' + (error.message || 'inténtalo de nuevo.'));
  } finally {
    $('#save-detail').disabled = false;
  }
}

async function initAdmin() {
  if (!client) {
    setText('#panel-loading', 'Falta configurar Supabase en assets/supabase-config.js.');
    return;
  }
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) { window.location.replace('login.html'); return; }
    if (!await administratorAccess(user.id)) {
      await client.auth.signOut();
      window.location.replace('login.html');
      return;
    }
    setText('#current-user', user.email || 'Administración');
    show('#panel-app', true);
    show('#panel-loading', false);
    $('#search-input').addEventListener('input', renderRequests);
    $('#state-filter').addEventListener('change', renderRequests);
    $('#refresh-button').addEventListener('click', loadRequests);
    $('#close-detail').addEventListener('click', () => { show('#request-detail', false); selectedId = null; });
    $('#save-detail').addEventListener('click', saveRequest);
    $('#logout-button').addEventListener('click', async () => {
      await client.auth.signOut();
      window.location.replace('login.html');
    });
    await loadRequests();
  } catch (error) {
    setText('#panel-loading', 'Error al comprobar el acceso: ' + (error.message || 'inténtalo de nuevo.'));
  }
}

if (page === 'login') initLogin();
if (page === 'admin') initAdmin();

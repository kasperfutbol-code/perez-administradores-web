// Vercel Function. Este fichero SOLO se ejecuta en el servidor.
// Configurar en Vercel: SUPABASE_URL, SUPABASE_SECRET_KEY, TURNSTILE_SECRET_KEY.
const text = (value, max = 200) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const validMail = (mail) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) && mail.length <= 254;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error:'Método no permitido.'});
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!supabaseUrl || !/^sb_secret_/.test(secret || '') || !turnstileSecret) {
    return res.status(503).json({error:'El envío automático aún no está disponible. Contacta por teléfono o correo.'});
  }
  // Se utiliza la cabecera Origin únicamente como defensa complementaria, no como autenticación.
  const origin = req.headers.origin;
  try {
    if (!origin || new URL(origin).host !== req.headers.host || new URL(origin).protocol !== 'https:') {
      return res.status(403).json({error:'Origen de solicitud no permitido.'});
    }
  } catch { return res.status(403).json({error:'Origen de solicitud no válido.'}); }
  if (Number(req.headers['content-length'] || 0) > 12000) {
    return res.status(413).json({error:'La solicitud es demasiado grande.'});
  }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({error:'Solicitud no válida.'});
  }
  if (text(body.website, 500)) return res.status(200).json({ok:true}); // Campo trampa antibots.
  const tipo = text(body.tipo, 24);
  const nombre = text(body.nombre, 120);
  const email = text(body.email, 254);
  const telefono = text(body.telefono, 35);
  const comunidad = text(body.comunidad, 140);
  const localidad = text(body.localidad, 120);
  const mensaje = text(body.mensaje, 4000);
  const opcion = text(body.servicio, 30);
  const numero = body.numero_viviendas == null ? null : Number(body.numero_viviendas);
  if (!['presupuesto','contacto'].includes(tipo) || nombre.length < 2 || !validMail(email)) {
    return res.status(400).json({error:'Revisa el nombre y el correo electrónico.'});
  }
  if (tipo === 'presupuesto' && (!telefono || localidad.length < 2)) {
    return res.status(400).json({error:'Indica el teléfono y la localidad de la finca.'});
  }
  if (tipo === 'contacto' && !mensaje) {
    return res.status(400).json({error:'Escribe el motivo de la consulta.'});
  }
  if (numero !== null && (!Number.isInteger(numero) || numero < 1 || numero > 100000)) {
    return res.status(400).json({error:'Revisa el número de viviendas.'});
  }
  const modalidades = {contable:'Contable',basico:'Básico',premium:'Premium',consultar:'Por determinar'};
  if (tipo === 'presupuesto' && !Object.hasOwn(modalidades, opcion)) {
    return res.status(400).json({error:'Modalidad de presupuesto no válida.'});
  }
  const turnstileToken = text(body.turnstileToken, 2048);
  if (!turnstileToken) return res.status(400).json({error:'Falta la verificación de seguridad.'});

  try {
    const verificacion = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({secret:turnstileSecret, response:turnstileToken}),
      signal: AbortSignal.timeout(8000),
    });
    if (!verificacion.ok) throw new Error('turnstile-unavailable');
    const verificado = await verificacion.json();
    if (!verificado.success || verificado.hostname !== new URL(origin).hostname || (verificado.action && verificado.action !== tipo)) {
      return res.status(400).json({error:'Verificación de seguridad no válida o caducada. Inténtalo de nuevo.'});
    }
    const payload = {
      nombre, email, telefono:telefono || null,
      comunidad: tipo === 'presupuesto' ? [comunidad, localidad].filter(Boolean).join(' · ') : null,
      numero_viviendas: tipo === 'presupuesto' ? numero : null,
      servicio: tipo === 'presupuesto' ? `Presupuesto: ${modalidades[opcion]}` : 'Consulta de contacto',
      mensaje: tipo === 'presupuesto' ? [`Localidad: ${localidad}`, mensaje].filter(Boolean).join('\n\n') : mensaje,
      estado:'pendiente',
    };
    // Nunca se exponen la clave secreta ni las notas internas a la web pública.
    const resultado = await fetch(`${supabaseUrl.replace(/\/$/,'')}/rest/v1/solicitudes`, {
      method:'POST',
      headers: {'Content-Type':'application/json','apikey':secret,'Prefer':'return=minimal'},
      body:JSON.stringify(payload),
      signal:AbortSignal.timeout(8000),
    });
    if (!resultado.ok) {
      console.error('Supabase insert failed. Status:',resultado.status);
      return res.status(502).json({error:'No se ha podido guardar la solicitud. Inténtalo más tarde.'});
    }
    return res.status(201).json({ok:true});
  } catch(error) {
    console.error('Error procesando formulario:',error?.name || 'error');
    return res.status(503).json({error:'No se ha podido procesar la solicitud. Inténtalo de nuevo más tarde.'});
  }
}

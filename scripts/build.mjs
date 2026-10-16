// Genera la web estática en /dist a partir de data/*.json.
// Uso:  npm run build            → enlaces limpios (para publicar)
//       npm run build:preview    → enlaces a index.html (para abrir en local)

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { huellaSVG } from "./huella.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(RAIZ, "dist");
const PREVIEW = process.argv.includes("--preview");

const C = JSON.parse(readFileSync(join(RAIZ, "data/clinica.json"), "utf8"));
const { servicios: S, motivos } = JSON.parse(
  readFileSync(join(RAIZ, "data/servicios.json"), "utf8")
);
const BORRADOR = C.modo === "borrador";
const VERSION = Date.now().toString(36);

// ---------- utilidades --------------------------------------------------
const esc = (t = "") =>
  String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const servicio = (slug) => S.find((s) => s.slug === slug);
const telHref = `tel:${C.telefono_e164}`;
const waHref = `https://wa.me/${C.telefono_e164.replace("+", "")}?text=${encodeURIComponent(C.whatsapp_mensaje)}`;
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hora = (h) => h.replace(/^0/, "");
const direccionLinea = `${C.direccion.calle}, ${C.direccion.cp} ${C.direccion.localidad} (${C.direccion.provincia})`;

// Marca un dato pendiente: visible solo en modo borrador.
const pendiente = (txt) =>
  BORRADOR ? `<mark class="pendiente">${esc(txt)}</mark>` : "";

// Enlaces relativos para que la web funcione en cualquier carpeta o dominio.
function crearRuta(profundidad) {
  const base = profundidad === 0 ? "./" : "../".repeat(profundidad);
  return (destino = "") => {
    if (!destino) return PREVIEW ? `${base}index.html` : base;
    const limpio = destino.replace(/^\//, "");
    if (/\.[a-z0-9]+$/i.test(limpio)) return base + limpio;
    return base + limpio + (PREVIEW ? "index.html" : "");
  };
}

// Horario agrupado para mostrar: lunes primero
function filasHorario() {
  const orden = [1, 2, 3, 4, 5, 6, 0];
  return orden.map((d) => {
    const dia = C.horario.find((h) => h.dia === d) || { tramos: [] };
    const texto = dia.tramos.length
      ? dia.tramos.map(([a, b]) => `${hora(a)}–${hora(b)}`).join(" y ")
      : "Cerrado";
    return { dia: DIAS[d], texto, cerrado: !dia.tramos.length, n: d };
  });
}

function tablaHorario() {
  return `<table class="horario">
    <caption class="sr">Horario de consulta</caption>
    <tbody>${filasHorario()
      .map(
        (f) =>
          `<tr data-dia="${f.n}"${f.cerrado ? ' class="cerrado"' : ""}><th scope="row">${f.dia[0].toUpperCase() + f.dia.slice(1)}</th><td>${f.texto}</td></tr>`
      )
      .join("")}</tbody>
  </table>
  <p class="nota">${esc(C.horario_nota)} ${pendiente("Horario por confirmar")}</p>`;
}

// ---------- iconos (trazo, heredan color) -------------------------------
const ICONO = {
  tel: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.6 3.5 9 3l1.6 4.2-2 1.6a12 12 0 0 0 6.6 6.6l1.6-2L21 15l-.5 2.4A2.6 2.6 0 0 1 18 19.5 15.5 15.5 0 0 1 4.5 6a2.6 2.6 0 0 1 2.1-2.5Z"/></svg>`,
  wa: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20l1.2-3.6A8 8 0 1 1 8.4 19L4 20Z"/><path d="M9 9.2c0 3 2.8 5.8 5.8 5.8l1-1.3-1.8-1-1 .8a4.4 4.4 0 0 1-2.3-2.3l.8-1-1-1.8L9 9.2Z"/></svg>`,
  mapa: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>`,
  sig: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>`,
  menu: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
};

// Logotipo PROVISIONAL (sustituir por el original de la clínica)
const marca = (ruta) => `<a class="marca" href="${ruta()}">
  <svg class="marca-signo" viewBox="0 0 48 52" aria-hidden="true"><circle cx="24" cy="33" r="13.5"/><circle class="d" cx="9.5" cy="13" r="4.2"/><circle class="d" cx="18.5" cy="8.2" r="3.2"/><circle class="d" cx="26.5" cy="7.6" r="2.8"/><circle class="d" cx="33.8" cy="10" r="2.5"/><circle class="d" cx="40" cy="14.4" r="2.2"/></svg>
  <span class="marca-texto"><small>Clínica del Pie</small><strong>Morillo</strong></span>
</a>`;

// ---------- datos estructurados -----------------------------------------
function jsonLD() {
  const horario = C.horario
    .filter((h) => h.tramos.length)
    .flatMap((h) =>
      h.tramos.map(([a, b]) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DIAS_SCHEMA[h.dia]}`,
        opens: a,
        closes: b,
      }))
    );
  const data = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${C.url_publica}/#clinica`,
    name: C.nombre_comercial,
    url: `${C.url_publica}/`,
    telephone: C.telefono_e164,
    medicalSpecialty: "https://schema.org/Podiatric",
    address: {
      "@type": "PostalAddress",
      streetAddress: C.direccion.calle.replace(/^C\/\s*/, "Calle "),
      postalCode: C.direccion.cp,
      addressLocality: C.direccion.localidad,
      addressRegion: C.direccion.provincia,
      addressCountry: "ES",
    },
    areaServed: C.zona.map((z) => ({ "@type": "City", name: z })),
    openingHoursSpecification: horario,
    availableService: S.map((s) => ({ "@type": "MedicalProcedure", name: s.nombre })),
    employee: {
      "@type": "Person",
      name: C.profesional.nombre,
      jobTitle: C.profesional.titulo,
    },
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

// ---------- plantilla común ---------------------------------------------
function pagina({ ruta, titulo, descripcion, canonica, cuerpo, actual = "", clase = "" }) {
  const nav = [
    ["servicios/", "Servicios", "servicios"],
    ["sobre-mi/", "Sobre mí", "sobre-mi"],
    ["contacto/", "Contacto", "contacto"],
  ];
  const tituloCompleto = titulo
    ? `${titulo} | ${C.nombre_comercial}`
    : `${C.nombre_comercial} · Podóloga en Barbate`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(tituloCompleto)}</title>
<meta name="description" content="${esc(descripcion)}">
${BORRADOR ? '<meta name="robots" content="noindex, nofollow">' : ""}
<link rel="canonical" href="${C.url_publica}/${canonica}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(tituloCompleto)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:locale" content="es_ES">
<meta property="og:image" content="${C.url_publica}/assets/img/fotos/consulta-1000.jpg">
<meta name="theme-color" content="#18506B">
<link rel="icon" href="${ruta("assets/img/favicon.svg")}" type="image/svg+xml">
<link rel="preload" href="${ruta("assets/fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${ruta("assets/estilos.css")}?v=${VERSION}">
${jsonLD()}
</head>
<body class="${clase}">
<a class="saltar" href="#contenido">Saltar al contenido</a>
${
  BORRADOR
    ? `<div class="aviso-borrador" role="note">Versión de trabajo. Los datos resaltados están pendientes de confirmar y los textos de servicios, de revisión clínica.</div>`
    : ""
}
<header class="cabecera">
  <div class="envoltura cabecera-fila">
    ${marca(ruta)}
    <button class="menu-boton" type="button" aria-expanded="false" aria-controls="menu">${ICONO.menu}<span>Menú</span></button>
    <nav id="menu" class="menu" aria-label="Principal">
      <ul>${nav
        .map(
          ([href, txt, id]) =>
            `<li><a href="${ruta(href)}"${actual === id ? ' aria-current="page"' : ""}>${txt}</a></li>`
        )
        .join("")}</ul>
      <a class="boton boton-tinta menu-llamar" href="${telHref}">${ICONO.tel}<span>${esc(C.telefono)}</span></a>
    </nav>
  </div>
</header>
<main id="contenido">
${cuerpo}
</main>
${pie(ruta)}
<div class="barra-movil" aria-label="Contacto rápido">
  <a class="boton boton-tinta" href="${telHref}">${ICONO.tel}<span>Llamar</span></a>
  ${C.whatsapp ? `<a class="boton boton-claro" href="${waHref}" rel="noopener">${ICONO.wa}<span>WhatsApp</span></a>` : ""}
</div>
<script>window.HORARIO=${JSON.stringify(C.horario)};</script>
<script src="${ruta("assets/app.js")}?v=${VERSION}" defer></script>
</body>
</html>`;
}

function pie(ruta) {
  const p = C.profesional;
  return `<footer class="pie">
  <div class="envoltura pie-rejilla">
    <div>
      ${marca(ruta)}
      <p class="pie-lema">${esc(C.lema)}</p>
    </div>
    <div>
      <h2>Consulta</h2>
      <p>${esc(C.direccion.calle)}<br>${C.direccion.cp} ${esc(C.direccion.localidad)} (${esc(C.direccion.provincia)})</p>
      <p><a href="${telHref}">${esc(C.telefono)}</a></p>
    </div>
    <div>
      <h2>Servicios</h2>
      <ul>${S.map((s) => `<li><a href="${ruta(`servicios/${s.slug}/`)}">${esc(s.nombre)}</a></li>`).join("")}</ul>
    </div>
    <div>
      <h2>Información sanitaria</h2>
      <p>${esc(p.nombre)}, ${esc(p.titulo.toLowerCase())}. Colegiada nº ${esc(p.colegiada)} del ${esc(p.colegio)}.</p>
      <p>Nº de registro sanitario: ${C.registro_sanitario ? esc(C.registro_sanitario) : pendiente("pendiente")}</p>
    </div>
  </div>
  <div class="envoltura pie-legal">
    <span>© ${new Date().getFullYear()} ${esc(C.nombre_comercial)}</span>
    <a href="${ruta("aviso-legal/")}">Aviso legal</a>
    <a href="${ruta("privacidad/")}">Privacidad</a>
    <span>Esta web no usa cookies.</span>
  </div>
</footer>`;
}

function botonesContacto(extra = "") {
  return `<div class="acciones ${extra}">
    <a class="boton boton-tinta" href="${telHref}">${ICONO.tel}<span>Llamar al ${esc(C.telefono)}</span></a>
    ${C.whatsapp ? `<a class="boton boton-claro" href="${waHref}" rel="noopener">${ICONO.wa}<span>Escribir por WhatsApp</span></a>` : ""}
    ${C.url_agenda ? `<a class="boton boton-claro" href="${esc(C.url_agenda)}" rel="noopener">Pedir cita online</a>` : ""}
  </div>
  ${C.whatsapp ? pendiente("Confirmar que este número usa WhatsApp") : ""}`;
}

// ---------- páginas -----------------------------------------------------
function inicio() {
  const ruta = crearRuta(0);
  const principales = S.filter((s) => s.principal);
  const otros = S.filter((s) => !s.principal);
  const p = C.profesional;

  const cuerpo = `
<section class="portada">
  <div class="envoltura portada-rejilla">
    <div class="portada-texto">
      <h1>Podóloga en Barbate</h1>
      <p class="lema" lang="es">${esc(C.lema)}</p>
      <p class="entradilla">En la consulta de ${esc(p.nombre_corto)} cuidamos tus pies en cada etapa: desde los primeros pasos de tus hijos hasta la revisión que necesitas si tienes diabetes. Exploramos, te explicamos lo que vemos y buscamos la causa de tus molestias.</p>
      ${botonesContacto()}
      <p class="estado-hoy" data-estado hidden></p>
    </div>
    <figure class="portada-huella">
      ${huellaSVG()}
      <figcaption>Así se ve una huella en un estudio de la pisada: cuanto más grande el punto, más presión en esa zona.</figcaption>
    </figure>
  </div>
</section>

<section class="bloque motivos-bloque" aria-labelledby="motivos-t">
  <div class="envoltura">
    <h2 id="motivos-t">¿Qué te pasa en los pies?</h2>
    <p class="bloque-intro">Elige lo que más se parezca a tu caso y te contamos cómo podemos ayudarte.</p>
    <ul class="motivos">${motivos
      .map((m) => {
        const s = servicio(m.servicio);
        return `<li><a href="${ruta(`servicios/${s.slug}/`)}"><span class="motivo-texto">${esc(m.texto)}</span><span class="motivo-servicio">${esc(s.nombre)}</span>${ICONO.sig}</a></li>`;
      })
      .join("")}</ul>
  </div>
</section>

<section class="bloque servicios-bloque" aria-labelledby="servicios-t">
  <div class="envoltura">
    <h2 id="servicios-t">En qué nos centramos</h2>
    <div class="pilares">${principales
      .map(
        (s) => `<article class="pilar pilar-${s.slug}">
        <h3><a href="${ruta(`servicios/${s.slug}/`)}">${esc(s.nombre)}</a></h3>
        <p>${esc(s.resumen)}</p>
      </article>`
      )
      .join("")}</div>
    <div class="otros">
      <h3>También atendemos</h3>
      <ul>${otros
        .map(
          (s) =>
            `<li><a href="${ruta(`servicios/${s.slug}/`)}"><strong>${esc(s.nombre)}</strong><span>${esc(s.resumen)}</span></a></li>`
        )
        .join("")}</ul>
    </div>
  </div>
</section>

<section class="bloque quien-bloque" aria-labelledby="quien-t">
  <div class="envoltura quien-rejilla">
    ${foto(ruta, "inicio", { sizes: "(min-width: 820px) 420px, 280px" })}
    <div>
      <h2 id="quien-t">Quién te atiende</h2>
      <p class="quien-nombre">${esc(p.nombre)}</p>
      <p>Podóloga colegiada nº ${esc(p.colegiada)} en el ${esc(p.colegio)}.</p>
      <ul class="formacion">${p.formacion.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      <p><a class="enlace" href="${ruta("sobre-mi/")}">Conoce a ${esc(p.nombre_corto.split(" ")[0])}</a></p>
    </div>
  </div>
</section>

<section class="bloque visita-bloque" aria-labelledby="visita-t">
  <div class="envoltura visita-rejilla">
    <div>
      <h2 id="visita-t">Dónde estamos</h2>
      <address>
        <strong>${esc(C.nombre_comercial)}</strong><br>
        ${esc(C.direccion.calle)}<br>
        ${C.direccion.cp} ${esc(C.direccion.localidad)} (${esc(C.direccion.provincia)})
      </address>
      <p>Atendemos a pacientes de ${C.zona.slice(0, -1).map(esc).join(", ")} y ${esc(C.zona.at(-1))}.</p>
      <div class="acciones">
        <a class="boton boton-claro" href="${C.direccion.mapa_url}" rel="noopener">${ICONO.mapa}<span>Cómo llegar</span></a>
      </div>
    </div>
    <div>
      <h2>Horario</h2>
      ${tablaHorario()}
    </div>
  </div>
</section>`;

  return pagina({
    ruta,
    titulo: "",
    descripcion: `Podóloga en Barbate (Cádiz). Pie infantil, pie diabético, estudio de la pisada, plantillas a medida, quiropodia y pie en el deporte. Pide cita en el ${C.telefono}.`,
    canonica: "",
    cuerpo,
    clase: "es-inicio",
  });
}

// Fotos: src/assets/img/fotos/<archivo>-<ancho>.webp (+ .jpg de respaldo)
const FOTO_TAM = {
  vertical: { anchos: [440, 700, 1000], respaldo: 700, alto: (w) => Math.round((w * 5) / 4) },
  horizontal: { anchos: [640, 1000, 1500], respaldo: 1000, alto: (w) => Math.round((w * 2) / 3) },
};

function foto(ruta, clave, { formato = "vertical", sizes, clase = "retrato", carga = "lazy" } = {}) {
  const f = (C.profesional.fotos || {})[clave];
  if (!f)
    return `<figure class="${clase} retrato-vacio" aria-hidden="true"><span>Foto de ${esc(C.profesional.nombre_corto)}</span>${pendiente("Foto pendiente")}</figure>`;
  const t = FOTO_TAM[formato];
  const base = (w, ext) => ruta(`assets/img/fotos/${f.archivo}-${w}.${ext}`);
  const srcset = t.anchos.map((w) => `${base(w, "webp")} ${w}w`).join(", ");
  return `<figure class="${clase}"><picture>
    <source type="image/webp" srcset="${srcset}" sizes="${sizes}">
    <img src="${base(t.respaldo, "jpg")}" alt="${esc(f.alt)}" width="${t.respaldo}" height="${t.alto(t.respaldo)}" loading="${carga}" decoding="async">
  </picture></figure>`;
}

function paginaServicio(s) {
  const ruta = crearRuta(2);
  const lista = (items) => `<ul class="lista">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
  const relacionados = S.filter((x) => x.slug !== s.slug).slice(0, 3);
  const deportiva = s.slug === "podologia-deportiva";

  const cuerpo = `
<div class="envoltura servicio">
  <nav class="migas" aria-label="Estás en"><a href="${ruta()}">Inicio</a> / <a href="${ruta("servicios/")}">Servicios</a> / <span aria-current="page">${esc(s.nombre)}</span></nav>
  <div class="servicio-rejilla">
    <article class="servicio-texto">
      <h1>${esc(s.titulo_seo)}</h1>
      ${BORRADOR && !s.revisado ? `<p><mark class="pendiente">Texto en borrador: pendiente de revisión clínica por la podóloga</mark></p>` : ""}
      <p class="entradilla">${esc(s.resumen)}</p>
      ${s.que_es.map((t) => `<p>${esc(t)}</p>`).join("")}
      ${s.aviso_urgente ? `<aside class="urgente" aria-labelledby="urgente-t"><h2 id="urgente-t">${esc(s.aviso_urgente.titulo)}</h2><p>${esc(s.aviso_urgente.texto)}</p></aside>` : ""}
      <h2>Cuándo conviene consultar</h2>
      ${lista(s.cuando_consultar)}
      <h2>Qué hacemos en consulta</h2>
      ${lista(s.que_hacemos)}
      ${deportiva ? `<p class="nota-formacion">${esc(C.profesional.nombre_corto)} está cursando el Máster en Podología Deportiva.</p>` : ""}
      ${s.slug === "estudio-biomecanico" ? pendiente("Confirmar equipamiento del estudio (plataforma de presiones, vídeo, cinta) para describirlo") : ""}
      <h2>Preguntas frecuentes</h2>
      <div class="faq">${s.faq
        .map((f) => `<details><summary>${esc(f.p)}</summary><p>${esc(f.r)}</p></details>`)
        .join("")}</div>
    </article>
    <aside class="tarjeta-cita" aria-label="Pedir cita">
      <h2>Pide cita</h2>
      <p>Llámanos o escríbenos y te buscamos hueco.</p>
      ${botonesContacto("apiladas")}
      <p class="estado-hoy" data-estado hidden></p>
      <p class="tarjeta-dir">${ICONO.mapa}<span>${esc(C.direccion.calle)}, ${esc(C.direccion.localidad)}</span></p>
    </aside>
  </div>
  <section class="relacionados" aria-labelledby="rel-t">
    <h2 id="rel-t">Otros servicios</h2>
    <ul>${relacionados.map((r) => `<li><a href="${ruta(`servicios/${r.slug}/`)}"><strong>${esc(r.nombre)}</strong><span>${esc(r.resumen)}</span></a></li>`).join("")}</ul>
  </section>
</div>`;

  return pagina({
    ruta,
    titulo: s.titulo_seo,
    descripcion: `${s.resumen} ${C.nombre_comercial}, ${C.direccion.calle}, Barbate. Cita: ${C.telefono}.`,
    canonica: `servicios/${s.slug}/`,
    cuerpo,
    actual: "servicios",
  });
}

function indiceServicios() {
  const ruta = crearRuta(1);
  const cuerpo = `
<div class="envoltura pagina-simple">
  <h1>Servicios de podología en Barbate</h1>
  <p class="entradilla">Estos son los motivos de consulta que atendemos. Si no sabes cuál es el tuyo, llámanos y te orientamos.</p>
  <ul class="indice-servicios">${S.map(
    (s) =>
      `<li><a href="${ruta(`servicios/${s.slug}/`)}"><h2>${esc(s.nombre)}</h2><p>${esc(s.resumen)}</p></a></li>`
  ).join("")}</ul>
</div>`;
  return pagina({
    ruta,
    titulo: "Servicios",
    descripcion: `Servicios de podología en Barbate: ${S.map((s) => s.nombre.toLowerCase()).join(", ")}.`,
    canonica: "servicios/",
    cuerpo,
    actual: "servicios",
  });
}

function sobreMi() {
  const ruta = crearRuta(1);
  const p = C.profesional;
  const cuerpo = `
<div class="envoltura pagina-simple">
  <div class="quien-rejilla">
    ${foto(ruta, "sobre_mi", { sizes: "(min-width: 820px) 420px, 280px", carga: "eager" })}
    <div>
      <h1>Sobre mí</h1>
      <p class="entradilla">Soy ${esc(p.nombre_corto)}, podóloga en Barbate. Atiendo en mi consulta de la calle Barberán y Collar a familias, personas mayores, pacientes con diabetes y deportistas.</p>
      <p>${pendiente("Completar con un párrafo de trayectoria escrito o aprobado por Carmen (años de ejercicio, qué le motiva de su trabajo)")}</p>
      <h2>Formación</h2>
      <ul class="formacion">${p.formacion.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      ${pendiente("Añadir titulación de base y universidad")}
      <h2>Colegiación</h2>
      <p>Colegiada nº ${esc(p.colegiada)} en el ${esc(p.colegio)}.</p>
      ${botonesContacto()}
    </div>
  </div>
</div>`;
  return pagina({
    ruta,
    titulo: "Sobre mí",
    descripcion: `${p.nombre}, podóloga colegiada nº ${p.colegiada} en Barbate. Máster en Biomecánica y Ortopodología.`,
    canonica: "sobre-mi/",
    cuerpo,
    actual: "sobre-mi",
  });
}

function contacto() {
  const ruta = crearRuta(1);
  const cuerpo = `
<div class="envoltura pagina-simple">
  <div class="contacto-cabecera">
    <div>
      <h1>Contacto y cómo llegar</h1>
      <p class="entradilla">La forma más rápida de pedir cita es llamar o escribir por WhatsApp. Te atenderá ${esc(C.profesional.nombre_corto)} en su consulta.</p>
      ${botonesContacto()}
    </div>
    ${foto(ruta, "consulta", { formato: "horizontal", clase: "foto-ancha", sizes: "(min-width: 900px) 540px, 100vw", carga: "eager" })}
  </div>
  <div class="visita-rejilla contacto-rejilla">
    <div>
      <h2>Dirección</h2>
      <address><strong>${esc(C.nombre_comercial)}</strong><br>${esc(C.direccion.calle)}<br>${C.direccion.cp} ${esc(C.direccion.localidad)} (${esc(C.direccion.provincia)})</address>
      <div class="acciones"><a class="boton boton-claro" href="${C.direccion.mapa_url}" rel="noopener">${ICONO.mapa}<span>Abrir en Google Maps</span></a></div>
      <h2>Acceso</h2>
      <p>${pendiente("Indicar si hay escalones, ascensor y dónde aparcar")}</p>
    </div>
    <div>
      <h2>Horario</h2>
      ${tablaHorario()}
      <p class="estado-hoy" data-estado hidden></p>
    </div>
  </div>
  <p class="aviso-datos">Por tu privacidad, no envíes fotos ni detalles médicos por WhatsApp si no te los pedimos. Lo hablaremos en consulta.</p>
</div>`;
  return pagina({
    ruta,
    titulo: "Contacto",
    descripcion: `Pide cita en ${C.nombre_comercial}: ${direccionLinea}. Teléfono ${C.telefono}.`,
    canonica: "contacto/",
    cuerpo,
    actual: "contacto",
  });
}

function avisoLegal() {
  const ruta = crearRuta(1);
  const p = C.profesional;
  const cuerpo = `
<div class="envoltura pagina-simple legal">
  <h1>Aviso legal</h1>
  <p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de los datos del titular de esta web:</p>
  <ul class="lista">
    <li>Titular: ${esc(p.nombre)}</li>
    <li>NIF: ${C.nif ? esc(C.nif) : pendiente("pendiente")}</li>
    <li>Domicilio: ${esc(direccionLinea)}</li>
    <li>Teléfono: ${esc(C.telefono)}</li>
    <li>Profesión: ${esc(p.titulo)}. Colegiada nº ${esc(p.colegiada)} del ${esc(p.colegio)}</li>
    <li>Nº de registro sanitario del centro: ${C.registro_sanitario ? esc(C.registro_sanitario) : pendiente("pendiente")}</li>
  </ul>
  <h2>Contenido de la web</h2>
  <p>La información de esta web es divulgativa y no sustituye a una consulta. Cada caso requiere una valoración profesional individual.</p>
  <h2>Propiedad intelectual</h2>
  <p>Los textos, imágenes y diseño de esta web pertenecen a su titular o se usan con autorización.</p>
  ${pendiente("Revisar este texto con la clínica antes de publicar")}
</div>`;
  return pagina({ ruta, titulo: "Aviso legal", descripcion: "Aviso legal de la web.", canonica: "aviso-legal/", cuerpo });
}

function privacidad() {
  const ruta = crearRuta(1);
  const cuerpo = `
<div class="envoltura pagina-simple legal">
  <h1>Privacidad</h1>
  <h2>Esta web no recoge datos personales</h2>
  <p>No hay formularios, registros ni cookies. No utilizamos herramientas de seguimiento ni publicidad.</p>
  <h2>Si nos llamas o escribes</h2>
  <p>Cuando contactas por teléfono o WhatsApp, usamos tus datos solo para gestionar tu cita. WhatsApp es un servicio de Meta Platforms, sujeto a su propia política de privacidad.</p>
  <h2>Datos de salud</h2>
  <p>La información clínica se trata en consulta, conforme al Reglamento General de Protección de Datos y a la normativa sanitaria. Puedes ejercer tus derechos de acceso, rectificación, supresión y oposición dirigiéndote a la clínica.</p>
  <h2>Responsable</h2>
  <p>${esc(C.profesional.nombre)} · ${esc(direccionLinea)} · ${esc(C.telefono)}</p>
  ${pendiente("Revisar este texto con la clínica antes de publicar")}
</div>`;
  return pagina({ ruta, titulo: "Privacidad", descripcion: "Política de privacidad de la web.", canonica: "privacidad/", cuerpo });
}

function noEncontrada() {
  // Cloudflare sirve 404.html desde la raíz: rutas absolutas desde "/"
  const ruta = (d = "") => "/" + d.replace(/^\//, "");
  const cuerpo = `
<div class="envoltura pagina-simple">
  <h1>No encontramos esta página</h1>
  <p class="entradilla">Puede que la dirección haya cambiado. Vuelve al inicio o llámanos si buscas cita.</p>
  <div class="acciones"><a class="boton boton-claro" href="/">Ir al inicio</a></div>
  ${botonesContacto()}
</div>`;
  return pagina({ ruta, titulo: "Página no encontrada", descripcion: "Página no encontrada.", canonica: "", cuerpo });
}

// ---------- escritura ---------------------------------------------------
function escribir(rel, contenido) {
  const destino = join(DIST, rel);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, contenido);
}

rmSync(DIST, { recursive: true, force: true });
cpSync(join(RAIZ, "src/assets"), join(DIST, "assets"), { recursive: true });

escribir("index.html", inicio());
escribir("servicios/index.html", indiceServicios());
for (const s of S) escribir(`servicios/${s.slug}/index.html`, paginaServicio(s));
escribir("sobre-mi/index.html", sobreMi());
escribir("contacto/index.html", contacto());
escribir("aviso-legal/index.html", avisoLegal());
escribir("privacidad/index.html", privacidad());
escribir("404.html", noEncontrada());

const urls = ["", "servicios/", ...S.map((s) => `servicios/${s.slug}/`), "sobre-mi/", "contacto/"];
escribir(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${C.url_publica}/${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);
escribir(
  "robots.txt",
  BORRADOR
    ? "# Modo borrador: no indexar\nUser-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\nSitemap: ${C.url_publica}/sitemap.xml\n`
);
escribir(
  "_headers",
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  X-Frame-Options: SAMEORIGIN\n\n/assets/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n`
);

// ---------- avisos ------------------------------------------------------
const sinRevisar = S.filter((s) => !s.revisado).map((s) => s.nombre);
const faltan = Object.keys(C._pendientes || {});
console.log(`✓ Web generada en dist/ (${PREVIEW ? "vista previa local" : "publicación"}, modo ${C.modo})`);
if (sinRevisar.length) console.log(`  · Textos sin revisión clínica: ${sinRevisar.join(", ")}`);
if (faltan.length) console.log(`  · Datos pendientes: ${faltan.join(", ")}`);
if (!BORRADOR && (sinRevisar.length || !C.registro_sanitario)) {
  console.error("✗ No se puede publicar en modo 'publicado' sin registro sanitario y con textos sin revisar.");
  process.exit(1);
}

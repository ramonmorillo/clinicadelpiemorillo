// Genera la web estática en /dist a partir de data/*.json, en español y en inglés.
// Uso:  npm run build            → enlaces limpios (para publicar)
//       npm run build:preview    → enlaces a index.html (para abrir en local)

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { huellaSVG } from "./huella.mjs";
import { IDIOMAS, RUTAS, UI } from "./textos.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(RAIZ, "dist");
const PREVIEW = process.argv.includes("--preview");
const leer = (f) => JSON.parse(readFileSync(join(RAIZ, "data", f), "utf8"));

const C = leer("clinica.json");
const BORRADOR = C.modo === "borrador";
const VERSION = Date.now().toString(36);

// ---------- contenidos por idioma ---------------------------------------
const ES = leer("servicios.json");
const EN = leer("servicios.en.json");

// En español el identificador de cada servicio es su slug.
const CONTENIDO = {
  es: {
    servicios: ES.servicios.map((s) => ({ ...s, id: s.slug })),
    motivos: ES.motivos,
    clinica: {
      titulo: C.profesional.titulo,
      colegio: C.profesional.colegio,
      formacion: C.profesional.formacion,
      lema: C.lema,
      horario_nota: C.horario_nota,
      whatsapp_mensaje: C.whatsapp_mensaje,
      alt: (k) => C.profesional.fotos?.[k]?.alt || "",
      instalacion: (i) => ({ titulo: i.titulo, alt: i.alt }),
    },
  },
  en: {
    servicios: EN.servicios.map((s) => {
      const base = ES.servicios.find((x) => x.slug === s.id);
      if (!base) throw new Error(`servicios.en.json: id "${s.id}" no existe en servicios.json`);
      return { ...s, principal: base.principal };
    }),
    motivos: EN.motivos,
    clinica: {
      titulo: C.en.titulo,
      colegio: C.en.colegio,
      formacion: C.en.formacion,
      lema: C.en.lema,
      horario_nota: C.en.horario_nota,
      whatsapp_mensaje: C.en.whatsapp_mensaje,
      alt: (k) => C.en.fotos_alt?.[k] || C.profesional.fotos?.[k]?.alt || "",
      instalacion: (i) => C.en.instalaciones?.[i.archivo] || { titulo: i.titulo, alt: i.alt },
    },
  },
};
for (const s of ES.servicios)
  if (!EN.servicios.some((e) => e.id === s.slug))
    console.warn(`  ! Falta la traducción al inglés del servicio "${s.slug}"`);

// ---------- utilidades --------------------------------------------------
const esc = (t = "") =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const telHref = `tel:${C.telefono_e164}`;
const waHref = (msg) =>
  `https://wa.me/${C.telefono_e164.replace("+", "")}?text=${encodeURIComponent(msg)}`;
const DIAS_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hora = (h) => h.replace(/^0/, "");
const direccionLinea = `${C.direccion.calle}, ${C.direccion.cp} ${C.direccion.localidad} (${C.direccion.provincia})`;
const listaY = (arr, y) => (arr.length < 2 ? arr.join("") : `${arr.slice(0, -1).join(", ")} ${y} ${arr.at(-1)}`);

// Marca un dato pendiente: visible solo en modo borrador (siempre en español: es para la clínica).
const pendiente = (txt) => (BORRADOR ? `<mark class="pendiente" lang="es">${esc(txt)}</mark>` : "");

// Enlaces relativos a la raíz del sitio, para que funcione en cualquier carpeta o dominio.
function crearRuta(destinoPagina) {
  const profundidad = destinoPagina.split("/").filter(Boolean).length;
  const base = profundidad === 0 ? "./" : "../".repeat(profundidad);
  return (destino = "") => {
    const limpio = destino.replace(/^\//, "");
    if (!limpio) return PREVIEW ? `${base}index.html` : base;
    if (/\.[a-z0-9]+$/i.test(limpio)) return base + limpio;
    return base + limpio + (PREVIEW ? "index.html" : "");
  };
}

// Ruta de una página en un idioma: clave = "inicio" | "servicios" | "servicio:<id>" | ...
function rutaDe(lang, clave) {
  const R = RUTAS[lang];
  if (clave.startsWith("servicio:")) {
    const id = clave.slice(9);
    const s = CONTENIDO[lang].servicios.find((x) => x.id === id);
    return s ? R.servicio(s.slug) : R.servicios;
  }
  return R[clave];
}

// ---------- horario -----------------------------------------------------
function tablaHorario(L, T) {
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const filas = orden.map((d) => {
    const dia = C.horario.find((h) => h.dia === d) || { tramos: [] };
    const texto = dia.tramos.length
      ? dia.tramos.map(([a, b]) => `${hora(a)}–${hora(b)}`).join(` ${T.y} `)
      : T.cerrado;
    const nombre = T.dias[d];
    return `<tr data-dia="${d}"${dia.tramos.length ? "" : ' class="cerrado"'}><th scope="row">${nombre[0].toUpperCase() + nombre.slice(1)}</th><td>${texto}</td></tr>`;
  });
  return `<table class="horario" data-hoy="${esc(T.hoy)}">
    <caption class="sr">${T.horario_caption}</caption>
    <tbody>${filas.join("")}</tbody>
  </table>
  <p class="nota">${esc(L.clinica.horario_nota)} ${pendiente("Horario por confirmar")}</p>`;
}

// ---------- iconos (trazo, heredan color) -------------------------------
const ICONO = {
  tel: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.6 3.5 9 3l1.6 4.2-2 1.6a12 12 0 0 0 6.6 6.6l1.6-2L21 15l-.5 2.4A2.6 2.6 0 0 1 18 19.5 15.5 15.5 0 0 1 4.5 6a2.6 2.6 0 0 1 2.1-2.5Z"/></svg>`,
  wa: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20l1.2-3.6A8 8 0 1 1 8.4 19L4 20Z"/><path d="M9 9.2c0 3 2.8 5.8 5.8 5.8l1-1.3-1.8-1-1 .8a4.4 4.4 0 0 1-2.3-2.3l.8-1-1-1.8L9 9.2Z"/></svg>`,
  mapa: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>`,
  sig: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>`,
  menu: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  idioma: `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5S14.4 18.1 12 20.5M12 3.5C9.6 5.9 8.4 8.7 8.4 12s1.2 6.1 3.6 8.5"/></svg>`,
};

// Logotipo PROVISIONAL (sustituir por el original de la clínica)
const marca = (ruta, lang) => `<a class="marca" href="${ruta(RUTAS[lang].inicio)}">
  <svg class="marca-signo" viewBox="0 0 48 52" aria-hidden="true"><circle cx="24" cy="33" r="13.5"/><circle class="d" cx="9.5" cy="13" r="4.2"/><circle class="d" cx="18.5" cy="8.2" r="3.2"/><circle class="d" cx="26.5" cy="7.6" r="2.8"/><circle class="d" cx="33.8" cy="10" r="2.5"/><circle class="d" cx="40" cy="14.4" r="2.2"/></svg>
  <span class="marca-texto" lang="es"><small>Clínica del Pie</small><strong>Morillo</strong></span>
</a>`;

// ---------- fotos -------------------------------------------------------
// src/assets/img/fotos/<archivo>-<ancho>.webp (+ .jpg de respaldo)
const FOTO_TAM = {
  vertical: { anchos: [440, 700, 1000], respaldo: 700, alto: (w) => Math.round((w * 5) / 4) },
  horizontal: { anchos: [640, 1000, 1500], respaldo: 1000, alto: (w) => Math.round((w * 2) / 3) },
};

function foto(ctx, clave, { formato = "vertical", sizes, clase = "retrato", carga = "lazy" } = {}) {
  const f = (C.profesional.fotos || {})[clave];
  if (!f)
    return `<figure class="${clase} retrato-vacio" aria-hidden="true"><span>${esc(C.profesional.nombre_corto)}</span>${pendiente("Foto pendiente")}</figure>`;
  const t = FOTO_TAM[formato];
  const base = (w, ext) => ctx.ruta(`assets/img/fotos/${f.archivo}-${w}.${ext}`);
  const srcset = t.anchos.map((w) => `${base(w, "webp")} ${w}w`).join(", ");
  return `<figure class="${clase}"><picture>
    <source type="image/webp" srcset="${srcset}" sizes="${sizes}">
    <img src="${base(t.respaldo, "jpg")}" alt="${esc(ctx.L.clinica.alt(clave))}" width="${t.respaldo}" height="${t.alto(t.respaldo)}" loading="${carga}" decoding="async">
  </picture></figure>`;
}

// Galería de las instalaciones: src/assets/img/instalaciones/<archivo>-<ancho>.webp (+ -800.jpg)
// Dos columnas escalonadas en escritorio (vertical + horizontal en cada una);
// en móvil, una sola columna en el orden de la visita.
function galeria(ctx) {
  const lista = C.instalaciones || [];
  if (!lista.length) return "";
  const ratio = { vertical: [4, 5], horizontal: [3, 2] };
  // La foto "destacada" va a todo el ancho, encima del mosaico.
  const figura = (i, n, destacada = false) => {
    const { titulo, alt } = ctx.L.clinica.instalacion(i);
    const [a, b] = ratio[i.formato] || ratio.horizontal;
    const src = (w, ext) => ctx.ruta(`assets/img/instalaciones/${i.archivo}-${w}.${ext}`);
    const anchos = destacada ? [480, 800, 1200, 1600] : [480, 800, 1200];
    const respaldo = destacada ? 1200 : 800;
    const sizes = destacada ? "(min-width: 1200px) 1160px, 100vw" : "(min-width: 820px) 540px, 100vw";
    return `<figure class="galeria-foto galeria-${destacada ? "destacada" : i.formato}" style="--orden:${n}"><picture>
      <source type="image/webp" srcset="${anchos.map((w) => `${src(w, "webp")} ${w}w`).join(", ")}" sizes="${sizes}">
      <img src="${src(respaldo, "jpg")}" alt="${esc(alt)}" width="${respaldo}" height="${Math.round((respaldo * b) / a)}" loading="lazy" decoding="async">
    </picture><figcaption>${esc(titulo)}</figcaption></figure>`;
  };
  const principal = lista.find((i) => i.destacada);
  const resto = lista.filter((i) => !i.destacada);
  // Columna 1: posiciones 0 y 2; columna 2: posiciones 1 y 3
  const col = (r) => resto.map((i, n) => [i, n]).filter(([, n]) => n % 2 === r).map(([i, n]) => figura(i, n)).join("");
  return `<section class="bloque galeria-bloque" aria-labelledby="galeria-t">
  <div class="envoltura">
    <h2 id="galeria-t">${ctx.T.instalaciones_t}</h2>
    <p class="bloque-intro">${ctx.T.instalaciones_intro} ${pendiente("Confirmar con Carmen los nombres de cada sala")}</p>
    ${principal ? figura(principal, 0, true) : ""}
    <div class="galeria"><div class="galeria-col">${col(0)}</div><div class="galeria-col">${col(1)}</div></div>
  </div>
</section>`;
}

// ---------- datos estructurados -----------------------------------------
function jsonLD(ctx) {
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
    url: `${C.url_publica}/${RUTAS[ctx.lang].inicio}`,
    telephone: C.telefono_e164,
    medicalSpecialty: "https://schema.org/Podiatric",
    availableLanguage: ["es", "en"],
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
    availableService: ctx.L.servicios.map((s) => ({ "@type": "MedicalProcedure", name: s.nombre })),
    employee: { "@type": "Person", name: C.profesional.nombre, jobTitle: ctx.L.clinica.titulo },
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

// ---------- plantilla común ---------------------------------------------
function pagina(ctx, { titulo, descripcion, cuerpo, actual = "", clase = "" }) {
  const { lang, T, L, ruta, clave } = ctx;
  const otro = T.otro.codigo;
  const nav = [
    ["servicios", T.nav.servicios],
    ["sobre", T.nav.sobre],
    ["contacto", T.nav.contacto],
  ];
  const tituloCompleto = titulo ? `${titulo} | ${C.nombre_comercial}` : `${C.nombre_comercial} · ${T.titulo_inicio}`;
  const absoluta = (lg) => `${C.url_publica}/${rutaDe(lg, clave)}`;
  const cambiar = `<a class="idioma" href="${ruta(rutaDe(otro, clave))}" hreflang="${otro}" lang="${otro}" aria-label="${esc(T.otro.aria)}">${ICONO.idioma}<span class="idioma-largo">${T.otro.nombre}</span><span class="idioma-corto" aria-hidden="true">${otro.toUpperCase()}</span></a>`;

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(tituloCompleto)}</title>
<meta name="description" content="${esc(descripcion)}">
${BORRADOR ? '<meta name="robots" content="noindex, nofollow">' : ""}
<link rel="canonical" href="${absoluta(lang)}">
${IDIOMAS.map((lg) => `<link rel="alternate" hreflang="${lg}" href="${absoluta(lg)}">`).join("\n")}
<link rel="alternate" hreflang="x-default" href="${absoluta("es")}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(tituloCompleto)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:locale" content="${T.locale}">
<meta property="og:image" content="${C.url_publica}/assets/img/fotos/consulta-1000.jpg">
<meta name="theme-color" content="#18506B">
<link rel="icon" href="${ruta("assets/img/favicon.svg")}" type="image/svg+xml">
<link rel="preload" href="${ruta("assets/fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${ruta("assets/estilos.css")}?v=${VERSION}">
${jsonLD(ctx)}
</head>
<body class="${clase}">
<a class="saltar" href="#contenido">${T.saltar}</a>
${
  BORRADOR
    ? `<div class="aviso-borrador" role="note" lang="es">Versión de trabajo. Los datos resaltados están pendientes de confirmar y los textos de servicios, de revisión clínica.${lang === "en" ? " La traducción al inglés también está pendiente de revisión." : ""}</div>`
    : ""
}
<header class="cabecera">
  <div class="envoltura cabecera-fila">
    ${marca(ruta, lang)}
    <div class="cabecera-acciones">
      ${cambiar}
      <button class="menu-boton" type="button" aria-expanded="false" aria-controls="menu">${ICONO.menu}<span>${T.menu}</span></button>
    </div>
    <nav id="menu" class="menu" aria-label="${T.nav_principal}">
      <ul>${nav
        .map(
          ([k, txt]) =>
            `<li><a href="${ruta(RUTAS[lang][k])}"${actual === k ? ' aria-current="page"' : ""}>${txt}</a></li>`
        )
        .join("")}</ul>
      <a class="boton boton-tinta menu-llamar" href="${telHref}">${ICONO.tel}<span>${esc(C.telefono)}</span></a>
    </nav>
  </div>
</header>
<main id="contenido">
${cuerpo}
</main>
${pie(ctx)}
<div class="barra-movil" aria-label="${T.contacto_rapido}">
  <a class="boton boton-tinta" href="${telHref}">${ICONO.tel}<span>${T.llamar}</span></a>
  ${C.whatsapp ? `<a class="boton boton-claro" href="${waHref(L.clinica.whatsapp_mensaje)}" rel="noopener">${ICONO.wa}<span>WhatsApp</span></a>` : ""}
</div>
<script>window.HORARIO=${JSON.stringify(C.horario)};window.TEXTOS=${JSON.stringify({ dias: T.dias, ...T.estado })};</script>
<script src="${ruta("assets/app.js")}?v=${VERSION}" defer></script>
</body>
</html>`;
}

function pie(ctx) {
  const { lang, T, L, ruta } = ctx;
  const p = C.profesional;
  return `<footer class="pie">
  <div class="envoltura pie-rejilla">
    <div>
      ${marca(ruta, lang)}
      <p class="pie-lema">${esc(L.clinica.lema)}</p>
    </div>
    <div>
      <h2>${T.pie_consulta}</h2>
      <p>${esc(C.direccion.calle)}<br>${C.direccion.cp} ${esc(C.direccion.localidad)} (${esc(C.direccion.provincia)})</p>
      <p><a href="${telHref}">${esc(C.telefono)}</a></p>
    </div>
    <div>
      <h2>${T.servicios}</h2>
      <ul>${L.servicios.map((s) => `<li><a href="${ruta(RUTAS[lang].servicio(s.slug))}">${esc(s.nombre)}</a></li>`).join("")}</ul>
    </div>
    <div>
      <h2>${T.pie_info}</h2>
      <p>${esc(T.pie_prof(p.nombre, p.colegiada, L.clinica.colegio))}</p>
      <p>${T.registro}: ${C.registro_sanitario ? esc(C.registro_sanitario) : pendiente("pendiente")}</p>
    </div>
  </div>
  <div class="envoltura pie-legal">
    <span>© ${new Date().getFullYear()} ${esc(C.nombre_comercial)}</span>
    <a href="${ruta(RUTAS[lang].aviso)}">${T.aviso_legal}</a>
    <a href="${ruta(RUTAS[lang].privacidad)}">${T.privacidad}</a>
    <span>${T.sin_cookies}</span>
  </div>
</footer>`;
}

function botonesContacto(ctx, extra = "") {
  const { T, L } = ctx;
  return `<div class="acciones ${extra}">
    <a class="boton boton-tinta" href="${telHref}">${ICONO.tel}<span>${esc(T.llamar_al(C.telefono))}</span></a>
    ${C.whatsapp ? `<a class="boton boton-claro" href="${waHref(L.clinica.whatsapp_mensaje)}" rel="noopener">${ICONO.wa}<span>${T.whatsapp}</span></a>` : ""}
    ${C.url_agenda ? `<a class="boton boton-claro" href="${esc(C.url_agenda)}" rel="noopener">${T.cita_online}</a>` : ""}
  </div>
  ${C.whatsapp ? pendiente("Confirmar que este número usa WhatsApp") : ""}`;
}

const enlaceServicio = (ctx, s) => ctx.ruta(RUTAS[ctx.lang].servicio(s.slug));

// ---------- páginas -----------------------------------------------------
function inicio(ctx) {
  const { T, L, lang } = ctx;
  const principales = L.servicios.filter((s) => s.principal);
  const otros = L.servicios.filter((s) => !s.principal);
  const p = C.profesional;
  const porId = (id) => L.servicios.find((s) => s.id === id);

  const cuerpo = `
<section class="portada">
  <div class="envoltura portada-rejilla">
    <div class="portada-texto">
      <h1>${T.h1}</h1>
      <p class="lema">${esc(L.clinica.lema)}</p>
      <p class="entradilla">${esc(T.entradilla(p.nombre_corto))}</p>
      ${botonesContacto(ctx)}
      <p class="estado-hoy" data-estado hidden></p>
    </div>
    <figure class="portada-huella">
      ${huellaSVG(T.huella_titulo)}
      <figcaption>${T.huella_pie}</figcaption>
    </figure>
  </div>
</section>

<section class="bloque motivos-bloque" aria-labelledby="motivos-t">
  <div class="envoltura">
    <h2 id="motivos-t">${T.motivos_t}</h2>
    <p class="bloque-intro">${T.motivos_intro}</p>
    <ul class="motivos">${L.motivos
      .map((m) => {
        const s = porId(m.servicio);
        return `<li><a href="${enlaceServicio(ctx, s)}"><span class="motivo-texto">${esc(m.texto)}</span><span class="motivo-servicio">${esc(s.nombre)}</span>${ICONO.sig}</a></li>`;
      })
      .join("")}</ul>
  </div>
</section>

<section class="bloque servicios-bloque" aria-labelledby="servicios-t">
  <div class="envoltura">
    <h2 id="servicios-t">${T.centramos}</h2>
    <div class="pilares">${principales
      .map(
        (s) => `<article class="pilar pilar-${s.id}">
        <h3><a href="${enlaceServicio(ctx, s)}">${esc(s.nombre)}</a></h3>
        <p>${esc(s.resumen)}</p>
      </article>`
      )
      .join("")}</div>
    <div class="otros">
      <h3>${T.tambien}</h3>
      <ul>${otros
        .map((s) => `<li><a href="${enlaceServicio(ctx, s)}"><strong>${esc(s.nombre)}</strong><span>${esc(s.resumen)}</span></a></li>`)
        .join("")}</ul>
    </div>
  </div>
</section>

<section class="bloque quien-bloque" aria-labelledby="quien-t">
  <div class="envoltura quien-rejilla">
    ${foto(ctx, "inicio", { sizes: "(min-width: 820px) 420px, 280px" })}
    <div>
      <h2 id="quien-t">${T.quien_t}</h2>
      <p class="quien-nombre">${esc(p.nombre)}</p>
      <p>${esc(T.colegiada_en(p.colegiada, L.clinica.colegio))}</p>
      <ul class="formacion">${L.clinica.formacion.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      <p><a class="enlace" href="${ctx.ruta(RUTAS[lang].sobre)}">${esc(T.conoce(p.nombre_corto.split(" ")[0]))}</a></p>
    </div>
  </div>
</section>

${galeria(ctx)}

<section class="bloque visita-bloque" aria-labelledby="visita-t">
  <div class="envoltura visita-rejilla">
    <div>
      <h2 id="visita-t">${T.donde}</h2>
      <address>
        <strong>${esc(C.nombre_comercial)}</strong><br>
        ${esc(C.direccion.calle)}<br>
        ${C.direccion.cp} ${esc(C.direccion.localidad)} (${esc(C.direccion.provincia)})
      </address>
      <p>${esc(T.atendemos(listaY(C.zona, T.y)))}</p>
      <div class="acciones">
        <a class="boton boton-claro" href="${C.direccion.mapa_url}" rel="noopener">${ICONO.mapa}<span>${T.como_llegar}</span></a>
      </div>
    </div>
    <div>
      <h2>${T.horario}</h2>
      ${tablaHorario(L, T)}
    </div>
  </div>
</section>`;

  return pagina(ctx, { titulo: "", descripcion: T.desc_inicio(C.telefono), cuerpo, clase: "es-inicio" });
}

function paginaServicio(ctx, s) {
  const { T, L, lang } = ctx;
  const lista = (items) => `<ul class="lista">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
  const relacionados = L.servicios.filter((x) => x.id !== s.id).slice(0, 3);

  const cuerpo = `
<div class="envoltura servicio">
  <nav class="migas" aria-label="${T.migas}"><a href="${ctx.ruta(RUTAS[lang].inicio)}">${T.inicio}</a> / <a href="${ctx.ruta(RUTAS[lang].servicios)}">${T.servicios}</a> / <span aria-current="page">${esc(s.nombre)}</span></nav>
  <div class="servicio-rejilla">
    <article class="servicio-texto">
      <h1>${esc(s.titulo_seo)}</h1>
      ${BORRADOR && !s.revisado ? `<p>${pendiente(lang === "es" ? "Texto en borrador: pendiente de revisión clínica por la podóloga" : "Traducción en borrador: pendiente de revisión por la podóloga")}</p>` : ""}
      <p class="entradilla">${esc(s.resumen)}</p>
      ${s.que_es.map((t) => `<p>${esc(t)}</p>`).join("")}
      ${s.aviso_urgente ? `<aside class="urgente" aria-labelledby="urgente-t"><h2 id="urgente-t">${esc(s.aviso_urgente.titulo)}</h2><p>${esc(s.aviso_urgente.texto)}</p></aside>` : ""}
      <h2>${T.cuando}</h2>
      ${lista(s.cuando_consultar)}
      <h2>${T.que_hacemos}</h2>
      ${lista(s.que_hacemos)}
      ${s.id === "podologia-deportiva" ? `<p class="nota-formacion">${esc(T.cursando_dep(C.profesional.nombre_corto))}</p>` : ""}
      ${s.id === "estudio-biomecanico" ? pendiente("En las fotos se ven cinta de andar y plataforma: confirmar si la plataforma es de presiones y si se graba vídeo, para describirlo") : ""}
      <h2>${T.faq}</h2>
      <div class="faq">${s.faq.map((f) => `<details><summary>${esc(f.p)}</summary><p>${esc(f.r)}</p></details>`).join("")}</div>
    </article>
    <aside class="tarjeta-cita" aria-label="${T.pide_cita}">
      <h2>${T.pide_cita}</h2>
      <p>${T.pide_cita_txt}</p>
      ${botonesContacto(ctx, "apiladas")}
      <p class="estado-hoy" data-estado hidden></p>
      <p class="tarjeta-dir">${ICONO.mapa}<span>${esc(C.direccion.calle)}, ${esc(C.direccion.localidad)}</span></p>
    </aside>
  </div>
  <section class="relacionados" aria-labelledby="rel-t">
    <h2 id="rel-t">${T.otros_servicios}</h2>
    <ul>${relacionados.map((r) => `<li><a href="${enlaceServicio(ctx, r)}"><strong>${esc(r.nombre)}</strong><span>${esc(r.resumen)}</span></a></li>`).join("")}</ul>
  </section>
</div>`;

  return pagina(ctx, {
    titulo: s.titulo_seo,
    descripcion: `${s.resumen} ${C.nombre_comercial}, ${C.direccion.calle}, Barbate. ${C.telefono}.`,
    cuerpo,
    actual: "servicios",
  });
}

function indiceServicios(ctx) {
  const { T, L } = ctx;
  const cuerpo = `
<div class="envoltura pagina-simple">
  <h1>${T.serv_h1}</h1>
  <p class="entradilla">${T.serv_intro}</p>
  <ul class="indice-servicios">${L.servicios
    .map((s) => `<li><a href="${enlaceServicio(ctx, s)}"><h2>${esc(s.nombre)}</h2><p>${esc(s.resumen)}</p></a></li>`)
    .join("")}</ul>
</div>`;
  return pagina(ctx, {
    titulo: T.servicios,
    descripcion: T.serv_desc(L.servicios.map((s) => s.nombre.toLowerCase()).join(", ")),
    cuerpo,
    actual: "servicios",
  });
}

function sobreMi(ctx) {
  const { T, L } = ctx;
  const p = C.profesional;
  const cuerpo = `
<div class="envoltura pagina-simple">
  <div class="quien-rejilla">
    ${foto(ctx, "sobre_mi", { sizes: "(min-width: 820px) 420px, 280px", carga: "eager" })}
    <div>
      <h1>${T.sobre_h1}</h1>
      <p class="entradilla">${esc(T.sobre_intro(p.nombre_corto))}</p>
      <p>${pendiente("Completar con un párrafo de trayectoria escrito o aprobado por Carmen (años de ejercicio, qué le motiva de su trabajo)")}</p>
      <h2>${T.formacion}</h2>
      <ul class="formacion">${L.clinica.formacion.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      ${pendiente("Añadir titulación de base y universidad")}
      <h2>${T.colegiacion}</h2>
      <p>${esc(T.colegiada(p.colegiada, L.clinica.colegio))}</p>
      ${botonesContacto(ctx)}
    </div>
  </div>
</div>`;
  return pagina(ctx, { titulo: T.sobre_h1, descripcion: T.sobre_desc(p.nombre, p.colegiada), cuerpo, actual: "sobre" });
}

function contacto(ctx) {
  const { T, L } = ctx;
  const cuerpo = `
<div class="envoltura pagina-simple">
  <div class="contacto-cabecera">
    <div>
      <h1>${T.contacto_h1}</h1>
      <p class="entradilla">${esc(T.contacto_intro(C.profesional.nombre_corto))}</p>
      ${botonesContacto(ctx)}
    </div>
    ${foto(ctx, "consulta", { formato: "horizontal", clase: "foto-ancha", sizes: "(min-width: 900px) 540px, 100vw", carga: "eager" })}
  </div>
  <div class="visita-rejilla contacto-rejilla">
    <div>
      <h2>${T.direccion}</h2>
      <address><strong>${esc(C.nombre_comercial)}</strong><br>${esc(C.direccion.calle)}<br>${C.direccion.cp} ${esc(C.direccion.localidad)} (${esc(C.direccion.provincia)})</address>
      <div class="acciones"><a class="boton boton-claro" href="${C.direccion.mapa_url}" rel="noopener">${ICONO.mapa}<span>${T.abrir_mapa}</span></a></div>
      <h2>${T.acceso}</h2>
      <p>${pendiente("Indicar si hay escalones, ascensor y dónde aparcar")}</p>
    </div>
    <div>
      <h2>${T.horario}</h2>
      ${tablaHorario(L, T)}
      <p class="estado-hoy" data-estado hidden></p>
    </div>
  </div>
  <p class="aviso-datos">${T.aviso_datos}</p>
</div>`;
  return pagina(ctx, {
    titulo: T.nav.contacto,
    descripcion: T.contacto_desc(C.nombre_comercial, direccionLinea, C.telefono),
    cuerpo,
    actual: "contacto",
  });
}

function avisoLegal(ctx) {
  const { lang, L } = ctx;
  const p = C.profesional;
  const nif = C.nif ? esc(C.nif) : pendiente("pendiente");
  const reg = C.registro_sanitario ? esc(C.registro_sanitario) : pendiente("pendiente");
  const textos = {
    es: `
  <h1>Aviso legal</h1>
  <p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de los datos del titular de esta web:</p>
  <ul class="lista">
    <li>Titular: ${esc(p.nombre)}</li>
    <li>NIF: ${nif}</li>
    <li>Domicilio: ${esc(direccionLinea)}</li>
    <li>Teléfono: ${esc(C.telefono)}</li>
    <li>Profesión: ${esc(L.clinica.titulo)}. Colegiada nº ${esc(p.colegiada)} del ${esc(L.clinica.colegio)}</li>
    <li>Nº de registro sanitario del centro: ${reg}</li>
  </ul>
  <h2>Contenido de la web</h2>
  <p>La información de esta web es divulgativa y no sustituye a una consulta. Cada caso requiere una valoración profesional individual.</p>
  <h2>Propiedad intelectual</h2>
  <p>Los textos, imágenes y diseño de esta web pertenecen a su titular o se usan con autorización.</p>`,
    en: `
  <h1>Legal notice</h1>
  <p>In accordance with Spanish Law 34/2002 on information society services and electronic commerce (LSSI-CE), the details of the owner of this website are as follows:</p>
  <ul class="lista">
    <li>Owner: ${esc(p.nombre)}</li>
    <li>Tax ID (NIF): ${nif}</li>
    <li>Address: ${esc(direccionLinea)}, Spain</li>
    <li>Phone: ${esc(C.telefono)}</li>
    <li>Profession: ${esc(L.clinica.titulo)}. Member no. ${esc(p.colegiada)} of the ${esc(L.clinica.colegio)}</li>
    <li>Healthcare centre registration no.: ${reg}</li>
  </ul>
  <h2>Website content</h2>
  <p>The information on this website is for general guidance and does not replace an appointment. Each case requires an individual professional assessment.</p>
  <h2>Intellectual property</h2>
  <p>The texts, images and design of this website belong to its owner or are used with permission.</p>
  <h2>Language</h2>
  <p>This English version is provided for convenience. In case of discrepancy, the Spanish version prevails.</p>`,
  };
  const cuerpo = `<div class="envoltura pagina-simple legal">${textos[lang]}
  ${pendiente("Revisar este texto con la clínica antes de publicar")}
</div>`;
  return pagina(ctx, { titulo: ctx.T.aviso_legal, descripcion: ctx.T.aviso_legal, cuerpo });
}

function privacidad(ctx) {
  const { lang } = ctx;
  const resp = `${esc(C.profesional.nombre)} · ${esc(direccionLinea)} · ${esc(C.telefono)}`;
  const textos = {
    es: `
  <h1>Privacidad</h1>
  <h2>Esta web no recoge datos personales</h2>
  <p>No hay formularios, registros ni cookies. No utilizamos herramientas de seguimiento ni publicidad.</p>
  <h2>Si nos llamas o escribes</h2>
  <p>Cuando contactas por teléfono o WhatsApp, usamos tus datos solo para gestionar tu cita. WhatsApp es un servicio de Meta Platforms, sujeto a su propia política de privacidad.</p>
  <h2>Datos de salud</h2>
  <p>La información clínica se trata en consulta, conforme al Reglamento General de Protección de Datos y a la normativa sanitaria. Puedes ejercer tus derechos de acceso, rectificación, supresión y oposición dirigiéndote a la clínica.</p>
  <h2>Responsable</h2>
  <p>${resp}</p>`,
    en: `
  <h1>Privacy</h1>
  <h2>This website does not collect personal data</h2>
  <p>There are no forms, sign-ups or cookies. We do not use tracking or advertising tools.</p>
  <h2>If you call or message us</h2>
  <p>When you contact us by phone or WhatsApp, we use your details only to manage your appointment. WhatsApp is a service of Meta Platforms and is subject to its own privacy policy.</p>
  <h2>Health data</h2>
  <p>Clinical information is handled at the practice in accordance with the EU General Data Protection Regulation (GDPR) and Spanish healthcare law. You can exercise your rights of access, rectification, erasure and objection by contacting the practice.</p>
  <h2>Data controller</h2>
  <p>${resp}</p>
  <p>This English version is provided for convenience. In case of discrepancy, the Spanish version prevails.</p>`,
  };
  const cuerpo = `<div class="envoltura pagina-simple legal">${textos[lang]}
  ${pendiente("Revisar este texto con la clínica antes de publicar")}
</div>`;
  return pagina(ctx, { titulo: ctx.T.privacidad, descripcion: ctx.T.privacidad, cuerpo });
}

function noEncontrada() {
  // Se sirve desde cualquier ruta: enlaces absolutos desde "/"
  const ctx = { lang: "es", T: UI.es, L: CONTENIDO.es, clave: "inicio", ruta: (d = "") => "/" + d.replace(/^\//, "") };
  const cuerpo = `
<div class="envoltura pagina-simple">
  <h1>No encontramos esta página</h1>
  <p class="entradilla">Puede que la dirección haya cambiado. Vuelve al inicio o llámanos si buscas cita.</p>
  <p lang="en">Page not found. <a href="/en/">Go to the English home page</a>.</p>
  <div class="acciones"><a class="boton boton-claro" href="/">Ir al inicio</a></div>
  ${botonesContacto(ctx)}
</div>`;
  return pagina(ctx, { titulo: "Página no encontrada", descripcion: "Página no encontrada.", cuerpo });
}

// ---------- escritura ---------------------------------------------------
function escribir(rel, contenido) {
  const destino = join(DIST, rel);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, contenido);
}

rmSync(DIST, { recursive: true, force: true });
cpSync(join(RAIZ, "src/assets"), join(DIST, "assets"), { recursive: true });

const urls = [];
for (const lang of IDIOMAS) {
  const L = CONTENIDO[lang];
  const T = UI[lang];
  const generar = (clave, fn) => {
    const destino = rutaDe(lang, clave);
    const ctx = { lang, T, L, clave, ruta: crearRuta(destino) };
    escribir(`${destino}index.html`, fn(ctx));
    return destino;
  };
  urls.push(generar("inicio", inicio));
  urls.push(generar("servicios", indiceServicios));
  for (const s of L.servicios) urls.push(generar(`servicio:${s.id}`, (ctx) => paginaServicio(ctx, s)));
  urls.push(generar("sobre", sobreMi));
  urls.push(generar("contacto", contacto));
  generar("aviso", avisoLegal);
  generar("privacidad", privacidad);
}
escribir("404.html", noEncontrada());

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
const sinRevisar = IDIOMAS.flatMap((lg) =>
  CONTENIDO[lg].servicios.filter((s) => !s.revisado).map((s) => `${s.nombre} (${lg})`)
);
const faltan = Object.keys(C._pendientes || {});
console.log(`✓ Web generada en dist/ (${PREVIEW ? "vista previa local" : "publicación"}, modo ${C.modo}, idiomas: ${IDIOMAS.join(", ")})`);
if (sinRevisar.length) console.log(`  · Textos sin revisar: ${sinRevisar.join(", ")}`);
if (faltan.length) console.log(`  · Datos pendientes: ${faltan.join(", ")}`);
if (!BORRADOR && (sinRevisar.length || !C.registro_sanitario)) {
  console.error("✗ No se puede publicar en modo 'publicado' sin registro sanitario y con textos sin revisar.");
  process.exit(1);
}

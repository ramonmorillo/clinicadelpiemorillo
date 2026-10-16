# Clínica del Pie Morillo — web

Web de la consulta de podología de Carmen Morillo en Barbate (Cádiz).

Sitio estático, sin frameworks, sin cookies y sin formularios. Todo el contenido sale de los archivos de `data/`.

La web está en español (raíz) y en inglés (`/en/`). Cada página enlaza con su versión en el otro idioma.

## Dónde se cambia cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Teléfono, dirección, horario, nº de registro, NIF, foto, formación | `data/clinica.json` |
| Fotos de la consulta (portada, apartado «La consulta») | Imágenes en `src/assets/img/instalaciones/`; títulos y descripciones en `data/clinica.json` → `instalaciones` (y `en.instalaciones`) |
| Textos de los servicios y los motivos de consulta de la portada | `data/servicios.json` (español) y `data/servicios.en.json` (inglés) |
| Textos de la clínica en inglés (lema, formación, nota del horario) | `data/clinica.json`, apartado `"en"` |
| Textos fijos de la web (menús, botones, títulos de sección) en ambos idiomas | `scripts/textos.mjs` |
| Colores, tipografía, espaciados | `src/assets/estilos.css` (decisiones en `docs/DISENO.md`) |
| Estructura de las páginas | `scripts/build.mjs` |
| Dibujo de la huella de la portada | `scripts/huella.mjs` |

Tras cualquier cambio:

```bash
npm run build          # genera dist/ para publicar
npm run build:preview  # genera dist/ con enlaces que funcionan al abrir los archivos en local
npm run serve          # sirve dist/ en http://localhost:3000
```

No hay dependencias que instalar: basta con Node 20 o superior.

## Modo borrador

Mientras `"modo": "borrador"` esté en `data/clinica.json`:

- aparece una franja amarilla avisando de que es una versión de trabajo;
- los datos pendientes se ven resaltados;
- los textos de servicios sin revisar llevan la marca «pendiente de revisión clínica»;
- la web pide a los buscadores que no la indexen (`noindex` y `robots.txt`).

Para publicar de verdad, cambiar a `"modo": "publicado"`. El build se niega a generar la web en modo publicado si falta el nº de registro sanitario o si algún servicio tiene `"revisado": false`.

## Publicación (Cloudflare Pages)

1. En Cloudflare, ir a **Workers & Pages → Create → Pages → Connect to Git** y elegir este repositorio.
2. Configurar:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Añadir el dominio propio en **Custom domains**.

El archivo `dist/_headers` añade cabeceras de seguridad y caché.

No usamos GitHub Pages porque sus condiciones no permiten webs de negocio.

## Documentación

- `docs/BRIEF.md`: requisitos completos (legales, SEO, accesibilidad, pendientes).
- `docs/DISENO.md`: sistema de diseño y su justificación.

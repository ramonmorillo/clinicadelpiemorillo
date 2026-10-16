# Brief — Web Clínica del Pie Morillo (Barbate)

> Documento para Claude Code. Colocar en la raíz del repositorio (puede renombrarse a `CLAUDE.md`).
> Marcado de fiabilidad: **[V]** dato verificado en material de la clínica · **[A VERIFICAR]** procede de fuentes de terceros (Google/Facebook/directorios) · **[PENDIENTE]** falta el dato.

---

## 1. Objetivo

Web profesional de una consulta de podología en Barbate (Cádiz) cuyo objetivo en esta fase es **darse a conocer y facilitar el contacto** (llamada/WhatsApp). No incluye gestión de citas en v1, pero debe quedar preparada para enlazar una agenda externa en el futuro sin rediseñar.

Público principal: población de Barbate y entorno (Zahara de los Atunes, Caños de Meca, Vejer). Perfil mixto: familias con niños, personas mayores y pacientes diabéticos, deportistas.

---

## 2. Datos de la clínica

| Campo | Valor | Estado |
|---|---|---|
| Profesional | Carmen María Morillo Verdugo | [V] |
| Nº de colegiada | 1165 (Colegio Profesional de Podólogos de Andalucía) | [V] |
| Nombre comercial | **[PENDIENTE: elegir uno]** — aparecen "Clínica del Pie Podóloga Morillo", "Clínica del Pie Morillo" y "Carmen Morillo" | — |
| Dirección | C/ Barberán y Collar, 25 · 11160 Barbate (Cádiz) | [V] |
| Teléfono / WhatsApp | 660 48 60 65 | [V] (confirmar que acepta WhatsApp) |
| Horario | L–V 9:30–14:00 · Ma y Ju 15:30–19:00 | [A VERIFICAR] |
| Nº registro sanitario (Junta de Andalucía) | [PENDIENTE] | — |
| Seguros/mutuas | Google asocia Caser | [A VERIFICAR] |
| Atención a domicilio | Aparece en directorios antiguos | [A VERIFICAR] |

**Formación** [V]
- Máster en Biomecánica y Ortopodología.
- Experto Universitario en Podología del Pie Diabético y Pie Infantil.
- Actualmente cursando Máster en Podología Deportiva.

**Servicios** [V]
1. Quiropodología
2. Ortopodología (plantillas a medida)
3. Pie infantil
4. Pie diabético
5. Pie en el deporte
6. Estudio biomecánico del pie

**Pilares de posicionamiento (propuesta, a validar por la clínica):**
- **Pie infantil** → pilar emocional y de marca (coherente con el lema).
- **Pie diabético / pie de riesgo** → pilar clínico y de continuidad asistencial.
- **Biomecánica y plantillas** → servicio transversal (infantil, adulto, deporte).

---

## 3. Identidad visual

- Logotipo existente: "Ö" con puntos que evocan dedos del pie. **[PENDIENTE: obtener el archivo original en SVG o PNG de alta resolución]**. No redibujar sin aprobación.
- Lema existente: *"Cuando el corazón habla por nuestros pies"*. Usar en portada.
- Paleta derivada de la tarjeta: blancos y grises cálidos, tonos piel suaves, gris antracita para texto. Sensación limpia, cercana, sanitaria sin frialdad.
- Tipografía: sans-serif muy legible para todo el texto (cuerpo ≥18px). Una caligráfica solo para el lema, nunca para información.
- Fotografía: **fotos reales de la consulta y de la profesional**. No usar imágenes de banco en "Sobre mí". Si temporalmente se usa alguna genérica (p. ej. pies de bebé), máximo una, solo decorativa.

---

## 4. Arquitectura (v1)

```
/                        Inicio
/servicios/              Índice de servicios
/servicios/quiropodologia/
/servicios/plantillas-ortopodologia/
/servicios/pie-infantil/
/servicios/pie-diabetico/
/servicios/podologia-deportiva/
/servicios/estudio-biomecanico/
/sobre-mi/               La podóloga
/contacto/               Cómo llegar, horario, mapa
/aviso-legal/
/privacidad/
```

Sin blog en v1.

### Contenido por página

**Inicio**
- Hero: nombre comercial + "Podóloga en Barbate" + lema + botones **Llamar** y **WhatsApp**.
- 3 tarjetas de pilares (infantil, diabético, biomecánica) → enlazan a sus páginas.
- Bloque breve "Quién te atiende" (foto real + colegiada 1165 + formación).
- Ubicación y horario resumidos.

**Cada página de servicio** (plantilla común)
- H1 con ciudad: p. ej. "Podología infantil en Barbate".
- ¿Qué es? · ¿Cuándo consultar? (signos en lenguaje claro) · ¿Qué hacemos en consulta? · Preguntas frecuentes (3–5).
- CTA de contacto al final.
- Textos base redactados por Claude Code **en lenguaje divulgativo y prudente**, marcados como borrador para **revisión clínica obligatoria por la podóloga** antes de publicar.
- Pie diabético: incluir aviso explícito de cuándo acudir a urgencias o al médico (herida que no cura, cambio de color, fiebre).

**Sobre mí**
- Foto real, trayectoria, formación tal cual figura en [V], nº de colegiada, logos del Colegio de Andalucía y del Consejo General (solo si la clínica confirma permiso de uso).

**Contacto**
- Dirección, mapa (enlace a Google Maps; si se incrusta iframe, cargarlo tras clic para no meter cookies de terceros), horario, teléfono, WhatsApp, accesibilidad del local [PENDIENTE].

---

## 5. Requisitos legales y deontológicos (obligatorios)

1. **Publicidad sanitaria (Andalucía):**
   - Anunciar solo servicios incluidos en la autorización sanitaria del centro.
   - Mostrar el **nº de registro sanitario** en el pie de todas las páginas.
   - Identificar a la profesional con titulación y nº de colegiada.
   - No aludir a terapias sin evidencia científica (**no incluir reflexología podal**).
2. **Lenguaje prohibido:** "la mejor", "líderes", "solución definitiva", "sin dolor", "garantizado", porcentajes de éxito, antes/después.
3. **Títulos:** reproducir literalmente la formación. No usar "especialista en X" (en podología no hay especialidades oficiales); usar "formación en", "Experta Universitaria en", "Máster en". Deportiva: "cursando Máster en Podología Deportiva" hasta que lo finalice.
4. **LSSI-CE:** aviso legal con titular, NIF [PENDIENTE], domicilio, colegio profesional y nº de colegiada.
5. **RGPD:**
   - **Sin formularios** que recojan datos de salud.
   - El contacto se hace por teléfono o WhatsApp.
   - Política de privacidad básica.
6. **Cookies:** no instalar cookies no técnicas → no necesita banner. Analítica sin cookies (p. ej. Cloudflare Web Analytics). Fuentes tipográficas alojadas localmente (no Google Fonts remoto).
7. **Imágenes:** solo con derechos de uso claros.

---

## 6. SEO local

- `<title>` y H1 con "Podóloga en Barbate" o "[servicio] en Barbate".
- Meta description única por página.
- Datos estructurados JSON-LD en todas las páginas:
  - tipo `MedicalClinic` con `medicalSpecialty: "Podiatric"`;
  - incluir dirección, teléfono, geo, horario (`openingHoursSpecification`) y `areaServed` (Barbate, Zahara de los Atunes, Vejer de la Frontera, Caños de Meca).
- **Nombre comercial, dirección y teléfono idénticos** a los del perfil de Google y Facebook (carácter a carácter).
- `sitemap.xml`, `robots.txt`, URLs limpias, enlazado interno entre servicios relacionados.

---

## 7. Requisitos técnicos

- HTML + CSS + JS mínimo, **sin framework**. Sitio estático.
- **Fuente única de datos:** `data/clinica.json` (nombre, dirección, teléfono, horario, servicios, registro sanitario, seguros). Todas las páginas y el JSON-LD se alimentan de él → cambiar horario = editar un único archivo.
  - Si se necesita generar HTML a partir del JSON, usar un script de build sencillo (Node) documentado en `README.md`.
- Mobile-first. Botón flotante de **Llamar / WhatsApp** visible siempre en móvil.
- Accesibilidad **WCAG 2.1 AA**:
  - texto ≥18px y contraste suficiente;
  - navegación por teclado;
  - `alt` en todas las imágenes.
  - Público mayor y con baja visión: priorizar claridad sobre estética.
- Rendimiento: Lighthouse ≥90 en las cuatro categorías; imágenes WebP/AVIF con tamaños responsivos.
- Preparar en `clinica.json` un campo `url_agenda` vacío: si se rellena, aparece un botón "Pedir cita online".

---

## 8. Despliegue

- Repositorio en GitHub (privado o público).
- **Publicación en Cloudflare Pages** conectado al repo (no GitHub Pages: sus condiciones excluyen webs de negocio; confirmar condiciones vigentes de Cloudflare antes de publicar).
- Dominio `.es` [PENDIENTE: elegir y comprobar disponibilidad, p. ej. `podologamorillo.es` / `clinicadelpiemorillo.es`], con HTTPS.
- Si ya existe una web antigua: redirigir 301 su dominio al nuevo.

---

## 9. Fuera del repositorio (imprescindible para "darse a conocer")

- [ ] Comprobar si existe ficha en Google Maps; **reclamarla** (no crear duplicada).
- [ ] Completar el perfil de Google Business:
  - categoría "Podólogo";
  - nombre, dirección y teléfono idénticos a la web;
  - horario, servicios, fotos reales;
  - enlace a la web.
- [ ] Pedir reseñas a pacientes de forma sistemática (enlace corto o QR en consulta).
- [ ] Corregir fichas antiguas en directorios:
  - masquemedicos: eliminar reflexología y unificar nombre;
  - citiservi y otros.
- [ ] Unificar nombre, foto y enlace en Facebook.

---

## 10. Criterios de aceptación

- [ ] Todas las páginas muestran nombre comercial, dirección, teléfono y nº de registro sanitario idénticos.
- [ ] Ningún texto contiene lenguaje prohibido (§5.2).
- [ ] Textos clínicos revisados y aprobados por la podóloga.
- [ ] Sin cookies no técnicas (verificar en DevTools).
- [ ] Lighthouse ≥90; validación JSON-LD sin errores en Rich Results Test.
- [ ] Cambiar el horario en `clinica.json` actualiza todas las páginas y el JSON-LD.

---

## 11. Pendientes antes de publicar

1. Nombre comercial definitivo.
2. Nº de registro sanitario.
3. NIF para el aviso legal.
4. Logotipo original en alta resolución.
5. Fotos reales (profesional, fachada, consulta).
6. Confirmar horario, WhatsApp, seguros y si atiende a domicilio.
7. ¿Existe ya una web? (Google muestra un enlace "Sitio web"). URL.
8. ¿Atiende a pacientes extranjeros? → decidir versión en inglés en v2.

# Sistema de diseño — Clínica del Pie Morillo

Decisiones de diseño y su justificación. Si se cambia algo, actualizar aquí.

## Idea central

**La huella como firma.** El elemento memorable de la web es una huella plantar dibujada como un *mapa de presiones*: una rejilla de puntos cuyo tamaño e intensidad aumentan donde el pie apoya más (talón, cabezas metatarsales, primer dedo). Es la imagen que ve un paciente en un estudio de la pisada, así que pertenece al mundo de la podología, no a cualquier clínica.

Los cinco dedos de la huella coinciden con el motivo del logotipo (la "Ö" con dedos), lo que une marca y oficio.

Al cargar la página, la huella aparece una sola vez de talón a dedos, como un paso real (apoyo de talón → despegue). Es el único movimiento automático de la web. Se desactiva si el usuario tiene activado "reducir movimiento".

Todo lo demás es tranquilo y legible.

## Color

| Token | Hex | Uso |
|---|---|---|
| `--sal` | `#FFFFFF` | Fondo general |
| `--bruma` | `#F3F4F2` | Superficies suaves (gris de la tarjeta de visita) |
| `--piel` | `#EFE1D7` | Superficie cálida, uso puntual (tono de las fotos de la tarjeta) |
| `--tinta` | `#1E2A31` | Texto principal (contraste 14,7:1 sobre blanco) |
| `--gris` | `#56636A` | Texto secundario (6,2:1) |
| `--atlantico` | `#18506B` | Acción principal, enlaces y escala de la huella (8,8:1) |
| `--foco` | `#E8A33B` | Anillo de foco de teclado |

**Por qué.** La tarjeta de visita de la clínica es blanca, gris y con tonos piel. El azul atlántico añade el mar de Barbate y da a los botones un color de acción claro y accesible.

**Descartado.** Fondo crema con acento terracota (demasiado visto), azul sanitario saturado (frío, de hospital) y verdes "salud" genéricos.

Hay modo oscuro automático según la preferencia del dispositivo.

## Tipografía

- **Atkinson Hyperlegible Next** para todo el texto. La diseñó el Braille Institute para lectores con baja visión: distingue bien letras parecidas (I/l/1, O/0, b/d). Parte del público son personas mayores y pacientes con diabetes, en quienes la visión puede estar afectada. Es una elección por función, no por moda.
- **Dancing Script** solo para el lema *"Cuando el corazón habla por nuestros pies"*, por continuidad con la tarjeta de visita. Nunca para información.
- Cuerpo a 19px en escritorio y 18px en móvil. Interlineado 1,6. Líneas de 70 caracteres como máximo.
- La jerarquía se marca con tamaño y peso, sin etiquetas en mayúsculas.

Las fuentes se alojan en el propio servidor: no se conecta a Google Fonts y no hay cookies de terceros.

## Maquetación

Contenido alineado a la izquierda, ancho máximo de 1160px.

```
Inicio (escritorio)
┌───────────────────────────────────────────────┐
│ logo · Servicios  Sobre mí  Contacto  [Llamar]│
├───────────────────────────┬───────────────────┤
│ Podóloga en Barbate       │   huella          │
│ lema (caligráfica)        │   (mapa de        │
│ texto breve               │    presiones)     │
│ [Llamar] [WhatsApp]       │                   │
│ Hoy: abierto 9:30–14:00   │                   │
├───────────────────────────┴───────────────────┤
│ ¿Qué te pasa en los pies?  → lista de motivos │
│   frecuentes, cada uno lleva a su servicio    │
├───────────────────────────────────────────────┤
│ Servicios: 3 principales (más grandes)        │
│            3 complementarios (lista compacta) │
├───────────────────────────────────────────────┤
│ Quién te atiende: foto · formación · colegiada│
├───────────────────────────────────────────────┤
│ Cómo llegar · horario · teléfono              │
└───────────────────────────────────────────────┘
Móvil: barra fija inferior [Llamar] [WhatsApp]
```

- **"¿Qué te pasa en los pies?"** permite entrar por el síntoma, en el lenguaje del paciente ("me duele el talón al levantarme"), no por el nombre técnico del servicio.
- **Tres servicios principales con más peso:** pie infantil, pie diabético y estudio biomecánico/plantillas. Así se ve que la consulta tiene un enfoque, no un catálogo.

## Principios

1. Primero se lee; la estética va después.
2. Siempre a un toque de llamar.
3. Nada que la normativa de publicidad sanitaria no permita (ver `BRIEF.md` §5).
4. Un único gesto memorable: la huella. El resto, sobrio.

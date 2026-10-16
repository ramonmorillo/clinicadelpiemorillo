# Instrucciones para Claude Code

Web estática de una consulta de podología (Barbate, Andalucía).

**Antes de cambiar nada, leer:**

- `docs/BRIEF.md`: requisitos;
- `docs/DISENO.md`: sistema de diseño.

## Reglas que no se rompen

1. **Datos solo en `data/`.** Ningún teléfono, horario, nombre o dirección escrito a mano en plantillas o CSS. Todo sale de `data/clinica.json`.
2. **Publicidad sanitaria (Andalucía).**
   - Nunca usar: "la mejor", "líderes", "solución definitiva", "sin dolor", "garantizado", porcentajes de éxito, fotos de antes/después.
   - No usar "especialista en…": en podología no hay especialidades oficiales.
   - No incluir reflexología ni terapias sin evidencia.
   - Solo servicios incluidos en la autorización del centro.
3. **Textos clínicos.** Lenguaje claro y prudente. Un texto nuevo o modificado en `data/servicios.json` vuelve a `"revisado": false` hasta que la podóloga lo apruebe.
4. **Privacidad.**
   - Sin formularios que recojan datos de salud.
   - Sin cookies ni recursos de terceros: nada de Google Fonts remoto ni iframes de mapas.
   - Las fuentes están en `src/assets/fonts/`.
5. **Accesibilidad.**
   - Texto de cuerpo de 18px o más.
   - Contraste AA como mínimo.
   - Foco visible.
   - Respetar `prefers-reduced-motion`.
   - Público mayor y con baja visión.
6. **Un único movimiento automático:** la huella de la portada. No añadir animaciones de entrada en secciones.

## Flujo de trabajo

- `npm run build:preview` y revisar en el navegador (escritorio y móvil, 390px).
- Antes de dar algo por terminado:
  - comprobar que no hay enlaces rotos;
  - buscar en `dist/` el lenguaje prohibido.
- El usuario (Ramón) no es técnico. Explicar los cambios en términos de lo que se ve en la web.

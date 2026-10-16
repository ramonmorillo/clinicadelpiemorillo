// Genera la huella plantar como "mapa de presiones": una rejilla de puntos
// cuyo tamaño e intensidad crecen donde el pie apoya más.
// Pie derecho visto desde arriba (el primer dedo queda a la izquierda).
// Salida: SVG en línea, coloreado con variables CSS para respetar el tema.

const W = 320;
const H = 720;
const PASO = 13;

// --- Forma del pie (unión de regiones) ---------------------------------
const dentroElipse = (x, y, cx, cy, rx, ry) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

const DEDOS = [
  { cx: 96, cy: 128, r: 38, a: 0.82 }, // primer dedo
  { cx: 160, cy: 106, r: 23, a: 0.5 },
  { cx: 205, cy: 116, r: 20, a: 0.46 },
  { cx: 243, cy: 134, r: 18, a: 0.42 },
  { cx: 272, cy: 160, r: 16, a: 0.38 },
];

function enPlanta(x, y) {
  // Talón
  if (dentroElipse(x, y, 176, 598, 80, 96)) return true;
  // Antepié
  if (y > 182 && dentroElipse(x, y, 172, 258, 118, 88)) return true;
  // Mediopié: banda lateral, el arco interno queda sin apoyo
  if (y >= 300 && y <= 560) {
    const bordeInterno = 176 - 0.0045 * (y - 440) ** 2;
    const bordeExterno = 258 - (y - 300) * 0.05;
    if (x >= bordeInterno && x <= bordeExterno) return true;
  }
  return false;
}

// --- Presión (suma de campanas de Gauss) -------------------------------
const campana = (x, y, cx, cy, s, a) =>
  a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));

function presion(x, y) {
  let p = 0.1;
  p += campana(x, y, 176, 618, 52, 0.95); // talón
  p += campana(x, y, 98, 262, 38, 0.9); // cabeza 1.er metatarsiano
  p += campana(x, y, 162, 238, 42, 0.78); // 2.º-3.er metatarsiano
  p += campana(x, y, 250, 282, 34, 0.55); // 5.º metatarsiano
  p += campana(x, y, 232, 450, 48, 0.3); // borde externo
  return Math.min(1, p);
}

// --- Generación ---------------------------------------------------------
export function huellaSVG() {
  const puntos = [];

  for (let y = PASO / 2; y < H; y += PASO) {
    for (let x = PASO / 2; x < W; x += PASO) {
      if (enPlanta(x, y)) puntos.push({ x, y, p: presion(x, y) });
    }
  }

  // Dedos: rejilla más fina, presión decreciente hacia el borde del dedo
  const pasoDedo = 9;
  for (const d of DEDOS) {
    const n = Math.floor(d.r / pasoDedo);
    for (let j = -n; j <= n; j++) {
      for (let i = -n; i <= n; i++) {
        const x = d.cx + i * pasoDedo;
        const y = d.cy + j * pasoDedo;
        const dist = Math.hypot(x - d.cx, y - d.cy);
        if (dist <= d.r * 0.95) {
          const p = 0.12 + d.a * (1 - (dist / d.r) ** 1.6);
          puntos.push({ x, y, p: Math.min(1, p) });
        }
      }
    }
  }

  // Cada punto aparece según su altura: del talón a los dedos (un paso)
  const circulos = puntos
    .map(({ x, y, p }) => {
      const r = (1.3 + p * 4.4).toFixed(2);
      const nivel = Math.min(4, Math.floor(p * 5)); // 0..4
      const retraso = ((H - y) / H) * 1.1; // segundos
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" class="h${nivel}" style="--d:${retraso.toFixed(2)}s"/>`;
    })
    .join("");

  return `<svg class="huella" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="huella-t"><title id="huella-t">Huella plantar representada como un mapa de presiones: los puntos más grandes y oscuros indican las zonas donde el pie apoya con más fuerza.</title>${circulos}</svg>`;
}

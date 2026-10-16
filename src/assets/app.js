// Menú móvil y estado de apertura según el horario de data/clinica.json.
(function () {
  "use strict";

  // ---- Menú ----
  var boton = document.querySelector(".menu-boton");
  var menu = document.getElementById("menu");
  if (boton && menu) {
    boton.addEventListener("click", function () {
      var abierto = menu.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", String(abierto));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("abierto")) {
        menu.classList.remove("abierto");
        boton.setAttribute("aria-expanded", "false");
        boton.focus();
      }
    });
  }

  // ---- Abierto / cerrado (hora de Barbate) ----
  var horario = window.HORARIO;
  if (!horario) return;

  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var ahora;
  try {
    var partes = new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    var mapa = {};
    partes.forEach(function (p) { mapa[p.type] = p.value; });
    var cortos = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
    var dia = cortos.indexOf(mapa.weekday.replace(".", "").toLowerCase());
    if (dia < 0) throw new Error("día");
    ahora = { dia: dia, min: parseInt(mapa.hour, 10) * 60 + parseInt(mapa.minute, 10) };
  } catch (e) {
    var d = new Date();
    ahora = { dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
  }

  function minutos(hhmm) { var p = hhmm.split(":"); return +p[0] * 60 + +p[1]; }
  function legible(hhmm) { return hhmm.replace(/^0/, ""); }
  function tramosDe(d) {
    for (var i = 0; i < horario.length; i++) if (horario[i].dia === d) return horario[i].tramos;
    return [];
  }

  var texto = "";
  var abierto = false;
  var hoy = tramosDe(ahora.dia);
  for (var i = 0; i < hoy.length; i++) {
    var a = minutos(hoy[i][0]), b = minutos(hoy[i][1]);
    if (ahora.min >= a && ahora.min < b) { abierto = true; texto = "Abierto ahora, hasta las " + legible(hoy[i][1]); break; }
    if (ahora.min < a) { texto = "Cerrado ahora. Abre hoy a las " + legible(hoy[i][0]); break; }
  }
  if (!abierto && !texto) {
    for (var k = 1; k <= 7; k++) {
      var dd = (ahora.dia + k) % 7;
      var t = tramosDe(dd);
      if (t.length) {
        texto = "Cerrado ahora. Abre " + (k === 1 ? "mañana" : "el " + DIAS[dd]) + " a las " + legible(t[0][0]);
        break;
      }
    }
  }

  document.querySelectorAll("[data-estado]").forEach(function (el) {
    if (!texto) return;
    el.textContent = texto;
    el.classList.toggle("abierto", abierto);
    el.hidden = false;
  });
  document.querySelectorAll('.horario tr[data-dia="' + ahora.dia + '"]').forEach(function (tr) {
    tr.classList.add("hoy");
  });
})();

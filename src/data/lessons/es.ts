// ============================================================================
// Lecciones progresivas del tutor de mecanografía Dvorak en español
// ============================================================================
//
// 10 lecciones que van desde las teclas centrales de la fila guía hasta
// texto libre completo. Cada lección usa palabras reales en español y
// construye sobre las teclas aprendidas en lecciones anteriores.
//
// Distribución de referencia (es-dvorak-xkb):
//   Fila superior: . , ñ p y f g c h l ` +
//   Fila guía:     a o e u i d r t n s ´ ç
//   Fila inferior: - q j k x b m w v z
// ============================================================================

import type { Lesson } from "../types";

export const lessons: readonly Lesson[] = [
  // =========================================================================
  // Lección 0: Introducción Teórica
  // =========================================================================
  {
    language: "es",
    id: "leccion-00",
    title: "Introducción al Dvorak",
    description:
      "¡Bienvenido! El teclado Dvorak está diseñado para la eficiencia. " +
      'A diferencia del QWERTY, tus dedos descansan en la "Fila Guía" (Home Row). ' +
      "Ahí encontrarás todas las vocales en la mano izquierda (A O E U I) y las " +
      'consonantes más usadas en la derecha (D R T N S). Arriba está la "Fila Superior" ' +
      '(Top Row) y abajo la "Fila Inferior" (Bottom Row). ' +
      "Este primer ejercicio te servirá para ubicar tus dedos en la Fila Guía.",
    keys: ["a", "o", "e", "u", "i", "d", "r", "t", "n", "s"],
    requiredWpm: 8,
    requiredAccuracy: 70,
    exercises: [
      {
        id: "L0-E1",
        type: "letters",
        content: "aoeui drtns aoeui drtns",
      },
    ],
  },

  // =========================================================================
  // Lección 1: Fila guía — Centro (6 teclas centrales)
  // Teclas nuevas: e, u, i, d, r, t
  // =========================================================================
  {
    language: "es",
    id: "leccion-01",
    title: "Fila guía — Centro",
    description:
      "Primeros pasos con las seis teclas centrales de la fila guía. " +
      "Estas son las teclas donde descansan tus dedos índice y medio.",
    keys: ["e", "u", "i", "d", "r", "t"],
    requiredWpm: 10,
    requiredAccuracy: 80,
    exercises: [
      {
        id: "L1-E1",
        type: "letters",
        content: "eui drt riu etr dei tur ute rid",
      },
      {
        id: "L1-E2",
        type: "letters",
        content: "edri ture dite urid erit ruti",
      },
      {
        id: "L1-E3",
        type: "words",
        content: "ir id red rut rui",
      },
    ],
  },

  // =========================================================================
  // Lección 2: Fila guía — Extensión (añade a, o, n, s)
  // Teclas nuevas: a, o, n, s
  // Acumuladas: a, o, e, u, i, d, r, t, n, s
  // =========================================================================
  {
    language: "es",
    id: "leccion-02",
    title: "Fila guía — Extensión",
    description:
      "Añadimos las teclas exteriores de la fila guía: a, o, n, s. " +
      "Con estas diez teclas ya puedes formar muchas palabras en español.",
    keys: ["a", "o", "n", "s"],
    requiredWpm: 12,
    requiredAccuracy: 82,
    exercises: [
      {
        id: "L2-E1",
        type: "letters",
        content: "ano sas onsa nosa aso son nano",
      },
      {
        id: "L2-E2",
        type: "words",
        content: "de es en se no sin uno dos son eso",
      },
      {
        id: "L2-E3",
        type: "words",
        content: "auto onda ese nota este seno tres ente",
      },
    ],
  },

  // =========================================================================
  // Lección 3: Fila guía — Completa (añade ´, ç)
  // Teclas nuevas: ´ (tecla muerta de acento), ç
  // Acumuladas: toda la fila guía + espacio
  // =========================================================================
  {
    language: "es",
    id: "leccion-03",
    title: "Fila guía — Completa",
    description:
      "Domina toda la fila guía incluyendo las teclas del meñique derecho. " +
      "Practica combinaciones y palabras usando solo la fila de descanso.",
    keys: ["´", "ç"],
    requiredWpm: 14,
    requiredAccuracy: 84,
    exercises: [
      {
        id: "L3-E1",
        type: "words",
        content: "sino sera duro esta esos unir otro dato ruso atar",
      },
      {
        id: "L3-E2",
        type: "words",
        content: "risa norte dentro entro diario radio renta",
      },
      {
        id: "L3-E3",
        type: "sentences",
        content: "este es uno de esos datos de la nota",
      },
      {
        id: "L3-E4",
        type: "sentences",
        content: "esa renta es de tres euros en todo este rato",
      },
    ],
  },

  // =========================================================================
  // Lección 4: Fila superior — Izquierda (., ñ, p, y y coma)
  // Teclas nuevas: . , ñ p y
  // =========================================================================
  {
    language: "es",
    id: "leccion-04",
    title: "Fila superior — Izquierda",
    description:
      "Sube a la fila superior con la mano izquierda. Aprende punto, coma, " +
      "ñ, p e y. La ñ es esencial para escribir en español.",
    keys: [".", ",", "ñ", "p", "y"],
    requiredWpm: 14,
    requiredAccuracy: 84,
    exercises: [
      {
        id: "L4-E1",
        type: "words",
        content: "año piña pino tipo niño punto pintar",
      },
      {
        id: "L4-E2",
        type: "words",
        content: "uña ñoño sueño dueño España otoño pequeño",
      },
      {
        id: "L4-E3",
        type: "sentences",
        content: "ese niño pinta un pino en otoño, yo opino que es un sueño.",
      },
      {
        id: "L4-E4",
        type: "sentences",
        content: "España es un punto de unión, y eso es importante.",
      },
    ],
  },

  // =========================================================================
  // Lección 5: Fila superior — Derecha (f, g, c, h, l)
  // Teclas nuevas: f, g, c, h, l
  // =========================================================================
  {
    language: "es",
    id: "leccion-05",
    title: "Fila superior — Derecha",
    description:
      "Completa la fila superior con la mano derecha: f, g, c, h, l. " +
      "Recuerda que en Dvorak español la H está en la fila superior.",
    keys: ["f", "g", "c", "h", "l"],
    requiredWpm: 16,
    requiredAccuracy: 86,
    exercises: [
      {
        id: "L5-E1",
        type: "words",
        content: "flor gris charla leche golf lugar claro",
      },
      {
        id: "L5-E2",
        type: "words",
        content: "lucha cine fuego gente hilo fiscal largo",
      },
      {
        id: "L5-E3",
        type: "sentences",
        content: "la gente charla con gusto en el lugar del cine.",
      },
      {
        id: "L5-E4",
        type: "sentences",
        content: "ese golf tiene un lago con flores, y la leche es fresca.",
      },
    ],
  },

  // =========================================================================
  // Lección 6: Fila inferior — Izquierda (-, q, j, k, x)
  // Teclas nuevas: - q j k x
  // =========================================================================
  {
    language: "es",
    id: "leccion-06",
    title: "Fila inferior — Izquierda",
    description:
      "Baja a la fila inferior con la mano izquierda. Las teclas q, j, k y x " +
      "son menos frecuentes pero esenciales para vocabulario completo.",
    keys: ["-", "q", "j", "k", "x"],
    requiredWpm: 18,
    requiredAccuracy: 88,
    exercises: [
      {
        id: "L6-E1",
        type: "words",
        content: "que jefe kilo extra justo equipo quinto",
      },
      {
        id: "L6-E2",
        type: "words",
        content: "queja jaque exquisito ejemplo quejar junio",
      },
      {
        id: "L6-E3",
        type: "sentences",
        content: "el jefe del equipo quiso un ejemplo justo y exacto.",
      },
      {
        id: "L6-E4",
        type: "sentences",
        content: "la quejan no es justa, que el equipo explique el contexto.",
      },
    ],
  },

  // =========================================================================
  // Lección 7: Fila inferior — Derecha (b, m, w, v, z)
  // Teclas nuevas: b m w v z
  // =========================================================================
  {
    language: "es",
    id: "leccion-07",
    title: "Fila inferior — Derecha",
    description:
      "Completa la fila inferior con b, m, w, v, z. Con esto tienes " +
      "acceso a todas las letras del alfabeto español.",
    keys: ["b", "m", "w", "v", "z"],
    requiredWpm: 20,
    requiredAccuracy: 88,
    exercises: [
      {
        id: "L7-E1",
        type: "words",
        content: "bien mucho vez vamos zona web hambre",
      },
      {
        id: "L7-E2",
        type: "words",
        content: "vecino brazo marzo nivel nombre bomba nieve",
      },
      {
        id: "L7-E3",
        type: "sentences",
        content: "vamos bien con mucho nombre en esa zona de la web.",
      },
      {
        id: "L7-E4",
        type: "sentences",
        content: "en marzo el vecino vio nieve en el brazo del monte.",
      },
    ],
  },

  // =========================================================================
  // Lección 8: Mayúsculas y puntuación
  // Teclas nuevas: Shift + letras, signos de puntuación
  // =========================================================================
  {
    language: "es",
    id: "leccion-08",
    title: "Mayúsculas y puntuación",
    description:
      "Practica las combinaciones con Shift para mayúsculas y signos de " +
      "puntuación. Aprende a usar puntos, comas, punto y coma, y dos puntos.",
    keys: ["Shift", ":", ";", "¿", "?", "¡", "!"],
    requiredWpm: 22,
    requiredAccuracy: 90,
    exercises: [
      {
        id: "L8-E1",
        type: "sentences",
        content: "España es grande. Madrid, Barcelona y Sevilla son ciudades.",
      },
      {
        id: "L8-E2",
        type: "sentences",
        content: "¿Cómo te llamas? Me llamo Pedro. ¡Mucho gusto!",
      },
      {
        id: "L8-E3",
        type: "sentences",
        content: 'El doctor dijo: "Descanse usted"; pero Juan no quiso.',
      },
      {
        id: "L8-E4",
        type: "sentences",
        content: "¡Qué bonito día! ¿Vamos al parque? Sí, vamos.",
      },
    ],
  },

  // =========================================================================
  // Lección 9: Acentos y caracteres especiales
  // Teclas nuevas: á, é, í, ó, ú, ü (via tecla muerta ´ y ¨)
  // =========================================================================
  {
    language: "es",
    id: "leccion-09",
    title: "Acentos y especiales",
    description:
      "Domina los acentos con la tecla muerta ´ seguida de la vocal. " +
      "Practica también la diéresis ü y los signos ¿ y ¡.",
    keys: ["á", "é", "í", "ó", "ú", "ü"],
    requiredWpm: 24,
    requiredAccuracy: 92,
    exercises: [
      {
        id: "L9-E1",
        type: "words",
        content: "está después según también aquí allí café",
      },
      {
        id: "L9-E2",
        type: "words",
        content: "país próximo difícil número música teléfono público",
      },
      {
        id: "L9-E3",
        type: "sentences",
        content: "él está aquí, según dijo después del café.",
      },
      {
        id: "L9-E4",
        type: "sentences",
        content: "¿cuál es el número de teléfono público más próximo?",
      },
    ],
  },

  // =========================================================================
  // Lección 10: Texto libre — Párrafos completos
  // =========================================================================
  {
    language: "es",
    id: "leccion-10",
    title: "Texto libre",
    description:
      "Pon a prueba todo lo aprendido con párrafos completos en español. " +
      "Intenta mantener un ritmo constante sin sacrificar precisión.",
    keys: [],
    requiredWpm: 28,
    requiredAccuracy: 95,
    exercises: [
      {
        id: "L10-E1",
        type: "sentences",
        content:
          "El idioma español es hablado por más de quinientos millones de personas en todo el mundo. " +
          "Es la lengua oficial de veintiún países y una de las más estudiadas como segunda lengua.",
      },
      {
        id: "L10-E2",
        type: "sentences",
        content:
          "La práctica diaria es la clave para mejorar la velocidad de escritura. " +
          "Cada día, dedica al menos quince minutos a estos ejercicios y notarás cómo tus dedos " +
          "encuentran las teclas con mayor facilidad y confianza.",
      },
      {
        id: "L10-E3",
        type: "sentences",
        content:
          "El teclado Dvorak fue diseñado para reducir el movimiento de los dedos y aumentar " +
          "la comodidad al escribir. En la variante española, la ñ tiene su propia tecla en la " +
          "fila superior, lo que facilita escribir en nuestro idioma sin necesidad de combinaciones " +
          "complicadas. ¡Sigue practicando y verás los resultados!",
      },
    ],
  },
] as const;

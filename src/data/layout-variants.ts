// ============================================================================
// Variantes de distribución de teclado Dvorak
// ============================================================================
//
// Soportamos dos variantes principales:
// 1. es-dvorak-xkb — Dvorak español del sistema XKB de Linux
//    (R en fila guía, H en fila superior)
// 2. us-dvorak-intl — Dvorak estadounidense con teclas muertas internacionales
//    (H en fila guía, R en fila superior, posiciones estándar US Dvorak)
//
// El registro (layout-registry.ts) asocia estos metadatos a cada distribución
// y define la variante por defecto.
// ============================================================================

import type { LayoutVariant } from "./types";

export interface LayoutVariantConfig {
  readonly variant: LayoutVariant;
  readonly displayName: string;
  readonly description: string;
  readonly platforms: readonly string[];
  readonly notes: string;
}

// ===================================================================
// Configuraciones de variantes
// ===================================================================

// ===================================================================
// Dvorak Español (XKB)
// ===================================================================
// - R en fila guía (home row), H en fila superior (top row)
// - ñ nativa en la fila superior
// - Acentos mediante tecla muerta ´ en la fila guía
// - ç directamente accesible
// ===================================================================
export const ES_DVORAK_XKB: LayoutVariantConfig = {
  variant: "es-dvorak-xkb",
  displayName: "Dvorak Español (XKB)",
  description: "Distribución Dvorak del sistema XKB de Linux para español.",
  platforms: ["Linux (X11)", "Linux (Wayland/XKB)"],
  notes:
    "R está en la fila guía y H en la fila superior. La ñ y la ç tienen tecla " +
    "propia, y los acentos se escriben con la tecla muerta ´ a la derecha de la S.",
} as const;

// ===================================================================
// Dvorak Internacional (US)
// ===================================================================
// - H en fila guía (home row), R en fila superior (top row) — posiciones US estándar
// - ñ se produce con tecla muerta (~) + n
// - Acentos mediante tecla muerta (') + vocal
// - Disponible en macOS, Windows y Linux
// ===================================================================
export const US_DVORAK_INTL: LayoutVariantConfig = {
  variant: "us-dvorak-intl",
  displayName: "Dvorak US Internacional",
  description:
    "Distribución Dvorak estadounidense con teclas muertas para caracteres internacionales.",
  platforms: ["macOS", "Windows", "Linux"],
  notes:
    "H está en la fila guía y R en la fila superior. Los acentos se escriben con " +
    "la tecla muerta ' seguida de la vocal, la ü con \" + u, la ñ con ~ + n, " +
    "y ¿ y ¡ con AltGr u Option.",
} as const;

// ===================================================================
// Dvorak Latinoamericano (XKB)
// ===================================================================
// - Mismas letras que el Dvorak español (ñ nativa, R en fila guía)
// - Cambia la puntuación: ¿ ¡ junto al 0, ´ ¨ como teclas muertas a la
//   derecha de la L
// ===================================================================
export const LATAM_DVORAK_XKB: LayoutVariantConfig = {
  variant: "latam-dvorak-xkb",
  displayName: "Dvorak Latinoamérica (XKB)",
  description: "Distribución Dvorak del sistema XKB de Linux para español latinoamericano.",
  platforms: ["Linux (X11)", "Linux (Wayland/XKB)"],
  notes:
    "Letras iguales al Dvorak español (R en la fila guía, H en la superior). " +
    "¿ y ¡ están junto al 0, " +
    "y los acentos (´) y la diéresis (¨) son teclas muertas a la derecha de la L.",
} as const;

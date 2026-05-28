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
// La variante por defecto es es-dvorak-xkb ya que este tutor está diseñado
// primariamente para la distribución Dvorak en español.
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
    "R está en la fila guía y H en la fila superior. " +
    "Incluye ñ, ç y tecla muerta para acentos de forma nativa.",
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
  displayName: "Dvorak US International",
  description:
    "Distribución Dvorak estadounidense con teclas muertas para caracteres internacionales.",
  platforms: ["macOS", "Windows", "Linux"],
  notes:
    "H está en la fila guía y R en la fila superior (posiciones estándar US Dvorak). " +
    "Para escribir ñ se usa la secuencia tecla muerta ~ seguida de n.",
} as const;


export const LAYOUT_VARIANTS: ReadonlyMap<LayoutVariant, LayoutVariantConfig> =
  new Map([
    ["es-dvorak-xkb", ES_DVORAK_XKB],
    ["us-dvorak-intl", US_DVORAK_INTL],
  ]);

// ===================================================================
// Distribución por defecto
// ===================================================================
export const DEFAULT_LAYOUT: LayoutVariant = "es-dvorak-xkb";

// ===================================================================
// Detección automática de variante
// ===================================================================
// Intenta detectar la variante de distribución probable basándose en el User-Agent.
// - Linux -> es-dvorak-xkb
// - macOS/Windows -> us-dvorak-intl
// ===================================================================
export function detectLayoutVariant(userAgent: string): LayoutVariant {
  // Normalizar a minúsculas para búsqueda más fiable
  const ua = userAgent.toLowerCase();

  // Linux suele usar XKB, que incluye la variante es(dvorak)
  if (ua.includes("linux")) {
    return "es-dvorak-xkb";
  }

  // macOS y Windows usan la distribución US Dvorak International
  if (
    ua.includes("macintosh") ||
    ua.includes("mac os") ||
    ua.includes("windows")
  ) {
    return "us-dvorak-intl";
  }

  // Por defecto, asumir la variante española de XKB
  return DEFAULT_LAYOUT;
}


export function getLayoutVariantConfig(
  variant: LayoutVariant,
): LayoutVariantConfig {
  const config = LAYOUT_VARIANTS.get(variant);
  if (!config) {
    throw new Error(`Variante de distribución desconocida: ${variant}`);
  }
  return config;
}

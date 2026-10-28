// ============================================================================
// Registro de distribuciones de teclado
// ============================================================================
//
// Única fuente de verdad para cada variante: su distribución física, cómo se
// componen los caracteres acentuados con teclas muertas y sus metadatos.
// Para añadir una variante: define su KeyboardLayout, añade su id al tipo
// LayoutVariant y regístrala aquí. Rutas, teclado, API y validación leen de
// este registro.
// ============================================================================

import { esDvorakLayout, usDvorakIntlLayout } from "./dvorak-layout";
import {
  ES_DVORAK_XKB,
  US_DVORAK_INTL,
  type LayoutVariantConfig,
} from "./layout-variants";
import type { KeyboardLayout, LayoutVariant } from "./types";

export interface LayoutDefinition {
  readonly layout: KeyboardLayout;
  /** Character → keys pressed in sequence to type it (dead key first). */
  readonly deadKeyCompositions: Readonly<Record<string, readonly string[]>>;
  readonly config: LayoutVariantConfig;
  /** Short label for the layout selector menu. */
  readonly menuLabel: string;
}

// ===================================================================
// Composiciones con tecla muerta
// ===================================================================
// La tecla muerta se pulsa primero y después la vocal.
// - ES XKB: ´ para acentos agudos, ¨ para diéresis
// - US Intl: ' para acentos agudos, " para diéresis
// ===================================================================
function accentCompositions(acute: string, diaeresis: string) {
  const compositions: Record<string, string[]> = {};
  for (const [accented, base] of [
    ["á", "a"], ["é", "e"], ["í", "i"], ["ó", "o"], ["ú", "u"],
    ["Á", "A"], ["É", "E"], ["Í", "I"], ["Ó", "O"], ["Ú", "U"],
  ]) {
    compositions[accented] = [acute, base];
  }
  compositions["ü"] = [diaeresis, "u"];
  compositions["Ü"] = [diaeresis, "U"];
  return compositions;
}

const LAYOUT_REGISTRY = {
  "es-dvorak-xkb": {
    layout: esDvorakLayout,
    deadKeyCompositions: accentCompositions("´", "¨"),
    config: ES_DVORAK_XKB,
    menuLabel: "Dvorak Español",
  },
  "us-dvorak-intl": {
    layout: usDvorakIntlLayout,
    deadKeyCompositions: accentCompositions("'", '"'),
    config: US_DVORAK_INTL,
    menuLabel: "Dvorak US Int.",
  },
} as const satisfies Record<LayoutVariant, LayoutDefinition>;

export const DEFAULT_LAYOUT: LayoutVariant = "es-dvorak-xkb";

export const LAYOUT_VARIANT_IDS = Object.keys(
  LAYOUT_REGISTRY,
) as readonly LayoutVariant[];

export function isLayoutVariant(value: unknown): value is LayoutVariant {
  return (
    typeof value === "string" &&
    (LAYOUT_VARIANT_IDS as readonly string[]).includes(value)
  );
}

/** The definition for `variant`, or the default layout's for unknown ids. */
export function getLayoutDefinition(variant: string): LayoutDefinition {
  return LAYOUT_REGISTRY[isLayoutVariant(variant) ? variant : DEFAULT_LAYOUT];
}

// ===================================================================
// Teclas a resaltar para un carácter
// ===================================================================
// Devuelve los event.code de las teclas que hay que pulsar, en orden,
// dentro de la distribución seleccionada (incluida la capa Shift).
// ===================================================================
const charToCodeCache = new Map<LayoutVariant, ReadonlyMap<string, string>>();

function charToCode(variant: LayoutVariant): ReadonlyMap<string, string> {
  let map = charToCodeCache.get(variant);
  if (!map) {
    const { rows } = LAYOUT_REGISTRY[variant].layout;
    const built = new Map<string, string>();
    for (const row of Object.values(rows)) {
      for (const keyDef of row) {
        built.set(keyDef.key, keyDef.code);
        if (keyDef.shiftKey) built.set(keyDef.shiftKey, keyDef.code);
      }
    }
    charToCodeCache.set(variant, built);
    map = built;
  }
  return map;
}

export function getKeyCodesForChar(
  variant: LayoutVariant,
  char: string,
): string[] {
  if (!char) return [];
  const codes = charToCode(variant);
  const sequence = getLayoutDefinition(variant).deadKeyCompositions[char];
  if (sequence) {
    return sequence
      .map((c) => codes.get(c))
      .filter((c): c is string => !!c);
  }
  const code = codes.get(char);
  return code ? [code] : [];
}

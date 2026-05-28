import { component$, useSignal, useOnDocument, $ } from "@builder.io/qwik";
import { type KeyboardLayout } from "../../data/types";
import { Keycap } from "./keycap";

interface KeyboardProps {
  layout: KeyboardLayout;
  targetChar?: string;
}

export const Keyboard = component$<KeyboardProps>(({ layout, targetChar }) => {
  const pressedCodes = useSignal<Set<string>>(new Set());

  useOnDocument(
    "keydown",
    $((e: Event) => {
      const ev = e as KeyboardEvent;
      if (!ev.repeat) {
        const next = new Set(pressedCodes.value);
        next.add(ev.code);
        pressedCodes.value = next;
      }
    }),
  );

  useOnDocument(
    "keyup",
    $((e: Event) => {
      const ev = e as KeyboardEvent;
      const next = new Set(pressedCodes.value);
      next.delete(ev.code);
      pressedCodes.value = next;
    }),
  );

  const getTargetCodes = (char?: string): string[] => {
    if (!char) return [];

    const charToCode = new Map<string, string>();
    for (const rowName of Object.keys(layout.rows) as Array<
      keyof typeof layout.rows
    >) {
      for (const keyDef of layout.rows[rowName]) {
        charToCode.set(keyDef.key, keyDef.code);
        if (keyDef.shiftKey) {
          charToCode.set(keyDef.shiftKey, keyDef.code);
        }
      }
    }

    if (layout.variant === "es-dvorak-xkb") {
      const composed: Record<string, string[]> = {
        á: ["´", "a"],
        é: ["´", "e"],
        í: ["´", "i"],
        ó: ["´", "o"],
        ú: ["´", "u"],
        Á: ["´", "A"],
        É: ["´", "E"],
        Í: ["´", "I"],
        Ó: ["´", "O"],
        Ú: ["´", "U"],
        ü: ["¨", "u"],
        Ü: ["¨", "U"],
      };
      if (composed[char]) {
        return composed[char]
          .map((c) => charToCode.get(c))
          .filter((c): c is string => !!c);
      }
    }

    if (layout.variant === "us-dvorak-intl") {
      const composed: Record<string, string[]> = {
        á: ["'", "a"],
        é: ["'", "e"],
        í: ["'", "i"],
        ó: ["'", "o"],
        ú: ["'", "u"],
        Á: ["'", "A"],
        É: ["'", "E"],
        Í: ["'", "I"],
        Ó: ["'", "O"],
        Ú: ["'", "U"],
        ü: ['"', "u"],
        Ü: ['"', "U"],
      };
      if (composed[char]) {
        return composed[char]
          .map((c) => charToCode.get(c))
          .filter((c): c is string => !!c);
      }
    }

    const code = charToCode.get(char);
    return code ? [code] : [];
  };

  const isTargetKey = (code: string) => {
    if (!targetChar) return false;
    const targetCodes = getTargetCodes(targetChar);
    return targetCodes.includes(code);
  };

  const isPressed = (code: string) => {
    return pressedCodes.value.has(code);
  };

  // Renderiza una fila del teclado
  const renderRow = (
    rowName: keyof KeyboardLayout["rows"],
    extraClass = "",
  ) => {
    return (
      <div
        class={`flex justify-center gap-1 sm:gap-2 mb-1 sm:mb-2 ${extraClass}`}
      >
        {layout.rows[rowName].map((keyDef) => (
          <Keycap
            key={keyDef.code}
            label={keyDef.key}
            subLabel={keyDef.shiftKey}
            finger={keyDef.finger}
            isActive={isTargetKey(keyDef.code)}
            isPressed={isPressed(keyDef.code)}
            isCorrect={false}
            isError={false}
            width={keyDef.widthMultiplier}
          />
        ))}
      </div>
    );
  };

  return (
    <div class="brutal-card p-4 sm:p-6 bg-surface-muted overflow-x-auto">
      <div class="min-w-212.5">
        {/* Renderizamos las filas sin márgenes artificiales porque las teclas estructurales (Tab, Caps, Shift) ya crean el escalonamiento natural */}
        {renderRow("number")}
        {renderRow("top")}
        {renderRow("home")}
        {renderRow("bottom")}
        {renderRow("space")}
      </div>

      {/* Guía de dedos visual (opcional) */}
      <div class="mt-8 flex justify-center gap-2 sm:gap-4 flex-wrap text-xs font-mono font-bold uppercase text-surface-dark/70">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-finger-left-pinky border-2 border-border rounded-full"></div>
          Meñique L
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-finger-left-ring border-2 border-border rounded-full"></div>
          Anular L
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-finger-left-middle border-2 border-border rounded-full"></div>
          Medio L
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-finger-left-index border-2 border-border rounded-full"></div>
          Índice L
        </div>
        <div class="w-4"></div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-finger-right-index border-2 border-border rounded-full"></div>
          Índice R
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-finger-right-middle border-2 border-border rounded-full"></div>
          Medio R
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-finger-right-ring border-2 border-border rounded-full"></div>
          Anular R
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-finger-right-pinky border-2 border-border rounded-full"></div>
          Meñique R
        </div>
      </div>
    </div>
  );
});

import { component$, useSignal, useOnDocument, $ } from "@builder.io/qwik";
import { type KeyboardLayout } from "../../data/types";
import { getKeyCodesForChar } from "../../data/layout-registry";
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

  const getTargetCodes = (char?: string): string[] =>
    char ? getKeyCodesForChar(layout.variant, char) : [];

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

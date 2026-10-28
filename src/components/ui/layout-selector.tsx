import {
  $,
  component$,
  sync$,
  useId,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";
import {
  LAYOUT_VARIANT_IDS,
  getLayoutDefinition,
} from "../../data/layout-registry";
import type { LayoutVariant } from "../../data/types";

/**
 * Index of the menu item that should receive focus for a navigation key, or
 * undefined for keys the menu doesn't handle. `current` is -1 when no item has
 * focus: ArrowDown then goes to the first item and ArrowUp to the last.
 */
export function nextMenuIndex(
  key: string,
  current: number,
  length: number,
): number | undefined {
  switch (key) {
    case "Home":
      return 0;
    case "End":
      return length - 1;
    case "ArrowDown":
      return (current + 1) % length;
    case "ArrowUp":
      return current < 0 ? length - 1 : (current - 1 + length) % length;
    default:
      return undefined;
  }
}

interface LayoutSelectorProps {
  current: LayoutVariant;
  onSelect$: QRL<(variant: LayoutVariant) => void>;
}

// Menu button pattern (WAI-ARIA APG): the trigger toggles a menu of radio items.
// Arrow keys move between items, Escape closes and returns focus to the trigger,
// and the menu closes when focus leaves it.
export const LayoutSelector = component$<LayoutSelectorProps>(
  ({ current, onSelect$ }) => {
    const isOpen = useSignal(false);
    const triggerRef = useSignal<HTMLButtonElement>();
    const id = useId();
    const triggerId = `${id}-trigger`;
    const menuId = `${id}-menu`;

    // Opening the menu moves focus to the checked item
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      if (!track(() => isOpen.value)) return;
      triggerRef.value?.ownerDocument
        .getElementById(menuId)
        ?.querySelector<HTMLElement>('[aria-checked="true"]')
        ?.focus();
    });

    return (
      <div
        class="relative"
        // Safari and macOS Firefox don't focus buttons on click: a focusable
        // container keeps focus inside the menu so it isn't closed mid-click
        tabIndex={-1}
        onFocusOut$={(event, element) => {
          const next = (event as FocusEvent).relatedTarget as Node | null;
          if (!next || !element.contains(next)) isOpen.value = false;
        }}
      >
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen.value ? "true" : "false"}
          aria-controls={isOpen.value ? menuId : undefined}
          onClick$={() => (isOpen.value = !isOpen.value)}
          class="border-2 border-border shadow-brutal-sm rounded-brutal-sm px-3 py-1.5 text-sm font-bold bg-surface-card text-surface-dark cursor-pointer transition-all hover:translate-x-px hover:translate-y-px hover:shadow-brutal-pressed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-between min-w-50"
        >
          <span>{getLayoutDefinition(current).layout.name}</span>
          <span class="text-[10px] ml-2 opacity-70" aria-hidden="true">
            ▼
          </span>
        </button>

        {isOpen.value && (
          <div
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            class="absolute top-full right-0 mt-2 w-full border-2 border-border shadow-brutal rounded-brutal-sm bg-surface-card overflow-hidden z-50 animate-fade-in flex flex-col"
            onKeyDown$={[
              // Synchronous so it can stop navigation keys from scrolling the page
              sync$((event: KeyboardEvent) => {
                if (
                  ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
                ) {
                  event.preventDefault();
                }
              }),
              $((event: Event, menu: HTMLElement) => {
                const key = (event as KeyboardEvent).key;
                if (key === "Escape") {
                  isOpen.value = false;
                  triggerRef.value?.focus();
                  return;
                }
                const list = [
                  ...menu.querySelectorAll<HTMLElement>(
                    '[role="menuitemradio"]',
                  ),
                ];
                const next = nextMenuIndex(
                  key,
                  list.indexOf(menu.ownerDocument.activeElement as HTMLElement),
                  list.length,
                );
                if (next !== undefined) list[next]?.focus();
              }),
            ]}
          >
            {LAYOUT_VARIANT_IDS.map((variant) => (
              <button
                key={variant}
                type="button"
                role="menuitemradio"
                aria-checked={current === variant ? "true" : "false"}
                tabIndex={current === variant ? 0 : -1}
                // Keep focus where it is on mouse down so the click lands
                preventdefault:mousedown
                class={`text-left px-3 py-2.5 text-sm font-bold hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary transition-colors border-t-2 border-border/20 first:border-t-0 ${current === variant ? "bg-primary text-primary-foreground hover:bg-primary-dark" : "text-surface-dark"}`}
                onClick$={async () => {
                  try {
                    await onSelect$(variant);
                  } finally {
                    // Close even if saving the choice fails
                    isOpen.value = false;
                    triggerRef.value?.focus();
                  }
                }}
              >
                {getLayoutDefinition(variant).menuLabel}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

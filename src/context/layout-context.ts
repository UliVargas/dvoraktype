import { createContextId, useContext, type Signal, type QRL } from "@builder.io/qwik";
import { type LayoutVariant } from "../data/types";

export const LayoutVariantContext = createContextId<Signal<LayoutVariant>>("layout-variant");
export const ThemeContext = createContextId<Signal<boolean>>("theme-mode");

export const LayoutActionContext = createContextId<{
  changeLayout$: QRL<(variant: LayoutVariant) => void>;
  toggleTheme$: QRL<() => void>;
}>("layout-actions");

export const useLayoutVariant = () => useContext(LayoutVariantContext);

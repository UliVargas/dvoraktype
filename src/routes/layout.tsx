import {
  component$,
  Slot,
  useSignal,
  useVisibleTask$,
  $,
  useContextProvider,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { type LayoutVariant } from "../data/types";
import { DEFAULT_LAYOUT, isLayoutVariant } from "../data/layout-registry";
import { progressService } from "../server/progress.service";
import { ensureRequestSessionId } from "../server/session";
import { withFallback } from "../server/fallback";

import {
  LayoutVariantContext,
  ThemeContext,
  LayoutActionContext,
} from "../context/layout-context";
import { Header } from "../components/ui/header";
import { Footer } from "../components/ui/footer";
import { siteHead } from "../components/router-head/seo";

export const useLayoutVariantLoader = routeLoader$(async (requestEvent) => {
  const sessionId = ensureRequestSessionId(requestEvent);

  const settings = await withFallback(
    () => progressService.getUserSettings(sessionId),
    { layoutVariant: DEFAULT_LAYOUT },
    "Loading layout settings",
  );
  // Stored values from removed variants fall back to the default layout
  return isLayoutVariant(settings.layoutVariant)
    ? settings.layoutVariant
    : DEFAULT_LAYOUT;
});

export default component$(() => {
  const initialVariant = useLayoutVariantLoader();

  const currentVariant = useSignal<LayoutVariant>(initialVariant.value);
  const isDarkMode = useSignal(false);

  // Setup Providers
  useContextProvider(LayoutVariantContext, currentVariant);
  useContextProvider(ThemeContext, isDarkMode);

  // Define global actions
  const changeLayout$ = $((variant: LayoutVariant) => {
    currentVariant.value = variant;
    fetch("/api/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant }),
    });
  });

  const toggleTheme$ = $(() => {
    isDarkMode.value = !isDarkMode.value;
    if (isDarkMode.value) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  });

  // Provide actions
  useContextProvider(LayoutActionContext, {
    changeLayout$,
    toggleTheme$,
  });

  // Sincronizar tema inicial
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const v = track(() => initialVariant.value);
    currentVariant.value = v;
    isDarkMode.value = document.documentElement.classList.contains("dark");
  });

  return (
    <div class="min-h-screen bg-surface flex flex-col">
      <Header />
      <main class="grow flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <Slot />
      </main>
      <Footer />
    </div>
  );
});

export const head: DocumentHead = ({ head, url }) => siteHead(head, url.origin);

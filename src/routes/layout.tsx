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
import { progressService } from "../server/progress.service";

import {
  LayoutVariantContext,
  ThemeContext,
  LayoutActionContext,
} from "../context/layout-context";
import { Header } from "../components/ui/header";
import { Footer } from "../components/ui/footer";

export const useLayoutVariantLoader = routeLoader$(async (requestEvent) => {
  let sessionId = requestEvent.cookie.get("sessionId")?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    requestEvent.cookie.set("sessionId", sessionId, {
      path: "/",
      maxAge: [365, "days"],
    });
  }

  const settings = await progressService.getUserSettings(sessionId);
  return settings.layoutVariant as LayoutVariant;
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

export const head: DocumentHead = {
  title: "DvorakType — Domina el Teclado Dvorak en Español",
  meta: [
    {
      name: "description",
      content:
        "DvorakType es la mejor herramienta gratuita para aprender y dominar la distribución de teclado Dvorak en español. Mejora tu velocidad y precisión con lecciones interactivas.",
    },
    {
      name: "keywords",
      content:
        "teclado dvorak, mecanografía dvorak, aprender dvorak español, typing test, dvorak xkb, velocidad de escritura, dvorak intl",
    },
    {
      name: "author",
      content: "Ulises Vargas",
    },
    {
      property: "og:title",
      content: "DvorakType — Domina el Teclado Dvorak en Español",
    },
    {
      property: "og:description",
      content:
        "Aprende a escribir más rápido y con menos esfuerzo usando Dvorak adaptado al español.",
    },
    {
      property: "og:type",
      content: "website",
    },
  ],
};

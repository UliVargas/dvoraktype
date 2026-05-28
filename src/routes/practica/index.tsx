import { component$, useSignal, $, useComputed$ } from "@builder.io/qwik";
import { Link, routeAction$, type DocumentHead } from "@builder.io/qwik-city";
import { LuArrowLeft, LuQuote } from "@qwikest/icons/lucide";
import { type TypingStats } from "../../data/types";
import { TypingArea } from "../../components/ui/typing-area";
import { Keyboard } from "../../components/ui/keyboard";
import { StatsBar } from "../../components/ui/stats-bar";
import { esDvorakLayout, usDvorakIntlLayout } from "../../data/dvorak-layout";
import { getRandomQuote, type Quote } from "../../data/quotes";
import { progressService } from "../../server/progress.service";
import { useLayoutVariant } from "../../context/layout-context";

export const useSaveFreePractice = routeAction$(async (data, requestEvent) => {
  const sessionId = requestEvent.cookie.get("sessionId")?.value;
  if (!sessionId) return { success: false };

  await progressService.saveFreePracticeResult(sessionId, "es", {
    wpm: Number(data.wpm),
    accuracy: Number(data.accuracy),
    elapsedTime: Number(data.elapsedTime),
  });

  return { success: true };
});

export default component$(() => {
  const saveAction = useSaveFreePractice();
  const layoutVariant = useLayoutVariant();

  const currentQuote = useSignal<Quote>(getRandomQuote("es"));
  const currentStats = useSignal<TypingStats | null>(null);
  const resetKey = useSignal(Date.now().toString());
  const currentTypingIndex = useSignal(0);

  const currentLayout = useComputed$(() =>
    layoutVariant.value === "us-dvorak-intl"
      ? usDvorakIntlLayout
      : esDvorakLayout,
  );

  const handleComplete = $((stats: TypingStats) => {
    saveAction.submit({
      language: "es",
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      elapsedTime: stats.elapsedTime,
    });

    currentQuote.value = getRandomQuote("es");
    currentTypingIndex.value = 0;
    resetKey.value = Date.now().toString();
  });

  return (
    <div class="w-full space-y-8 animate-fade-in pb-12">
      <div class="flex items-center justify-between mb-4">
        <Link
          href="/"
          class="flex items-center gap-2 text-surface-dark/70 hover:text-primary font-bold"
        >
          <LuArrowLeft class="w-5 h-5" />
          Volver a Lecciones
        </Link>
        <div class="text-right">
          <h2 class="text-2xl font-black">Práctica Libre</h2>
        </div>
      </div>

      <div class="bg-surface-card border-2 border-border p-4 rounded-brutal-sm shadow-brutal-sm text-surface-dark/80 text-sm leading-relaxed mb-6">
        <p>
          <strong>Modo Continuo:</strong> Escribe a tu propio ritmo. Al terminar
          una frase, cargaremos la siguiente automáticamente para que no rompas
          tu flujo. Tus estadísticas se guardan en tiempo real.
        </p>
      </div>

      <div class="relative">
        <TypingArea
          targetText={currentQuote.value.text}
          onComplete$={handleComplete}
          resetKey={resetKey.value}
          currentIndexSignal={currentTypingIndex}
          realTimeStatsSignal={currentStats}
        />
        <div class="mt-4 text-right text-surface-dark/50 font-medium italic flex items-center justify-end gap-2 text-sm">
          <LuQuote class="w-4 h-4 opacity-50" />
          {currentQuote.value.source}
        </div>
      </div>

      <div class="mt-8">
        <StatsBar
          wpm={currentStats.value?.wpm || 0}
          accuracy={currentStats.value?.accuracy || 100}
          errors={currentStats.value?.errorChars || 0}
          elapsed={currentStats.value?.elapsedTime || 0}
        />
      </div>

      <div class="mt-8 transition-opacity duration-300 opacity-100">
        <div class="flex items-center justify-between mb-2 px-2">
          <div class="text-sm font-bold text-surface-dark/60 uppercase tracking-widest flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-state-success animate-pulse"></span>
            {currentLayout.value.name}
          </div>
        </div>
        <div class="brutal-card bg-surface p-4 sm:p-6 overflow-x-auto custom-scrollbar flex justify-center">
          <div class="min-w-162.5">
            <Keyboard
              layout={currentLayout.value}
              targetChar={
                currentQuote.value.text[currentTypingIndex.value] || ""
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Práctica Libre — DvorakType",
  meta: [
    {
      name: "description",
      content:
        "Practica mecanografía Dvorak en español de forma libre y continua. Mejora tu WPM y precisión con textos reales.",
    },
    {
      property: "og:title",
      content: "Práctica Libre de Dvorak en Español",
    },
    {
      property: "og:description",
      content:
        "Escribe sin interrupciones y mide tu velocidad (WPM) y precisión en tiempo real.",
    },
  ],
};

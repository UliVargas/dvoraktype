import { component$, useSignal, $, useComputed$ } from "@builder.io/qwik";
import { Link, routeAction$, zod$, type DocumentHead } from "@builder.io/qwik-city";
import { LuArrowLeft, LuQuote } from "@qwikest/icons/lucide";
import { type TypingStats } from "../../data/types";
import { TypingArea } from "../../components/ui/typing-area";
import { Keyboard } from "../../components/ui/keyboard";
import { StatsBar } from "../../components/ui/stats-bar";
import { getLayoutDefinition } from "../../data/layout-registry";
import { getRandomQuote, type Quote } from "../../data/quotes";
import { progressService } from "../../server/progress.service";
import { getSessionId } from "../../server/session";
import { saveErrorOf } from "../../components/ui/save-result";
import { freePracticeResultSchema } from "../../server/progress-rules";
import { useLayoutVariant } from "../../context/layout-context";
import { pageHead } from "../../components/router-head/seo";

export const useSaveFreePractice = routeAction$(
  async (data, requestEvent) => {
    const sessionId = getSessionId(requestEvent.cookie);
    if (!sessionId) return { success: false };

    // Logged and returned as a JSON 503 so the page can tell the user
    try {
      await progressService.saveFreePracticeResult(sessionId, "es", data);
      return { success: true };
    } catch (error) {
      console.error("Saving a free practice result failed", error);
      return requestEvent.fail(503, { message: "No se pudo guardar el resultado. Inténtalo de nuevo en unos minutos." });
    }
  },
  zod$(freePracticeResultSchema),
);

export default component$(() => {
  const saveAction = useSaveFreePractice();
  const saveError = useSignal<string | undefined>(undefined);
  // Only the latest save decides the alert, even if an older one resolves later
  const saveAttempt = useSignal(0);
  const layoutVariant = useLayoutVariant();

  const currentQuote = useSignal<Quote>(getRandomQuote("es"));
  const currentStats = useSignal<TypingStats | null>(null);
  const resetKey = useSignal(Date.now().toString());
  const currentTypingIndex = useSignal(0);

  const currentLayout = useComputed$(
    () => getLayoutDefinition(layoutVariant.value).layout,
  );

  const handleComplete = $(async (stats: TypingStats) => {
    const attempt = ++saveAttempt.value;
    saveError.value = undefined;
    const submitted = saveAction.submit({
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      elapsedTime: stats.elapsedTime,
    });

    currentQuote.value = getRandomQuote("es");
    currentTypingIndex.value = 0;
    resetKey.value = Date.now().toString();

    // Tell the user if the finished quote's result wasn't saved
    const error = await saveErrorOf(submitted);
    if (attempt === saveAttempt.value) saveError.value = error;
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
          <h1 class="text-2xl font-black">Práctica Libre</h1>
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
        {saveError.value && (
          <p
            role="alert"
            class="mt-4 border-2 border-border rounded-brutal-sm bg-state-warning p-3 font-bold text-surface-dark"
          >
            {saveError.value}
          </p>
        )}
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

export const head: DocumentHead = pageHead(
  "Práctica libre de Dvorak | DvorakType",
  "Practica mecanografía Dvorak en español de forma libre y continua. Mejora tu WPM y precisión con textos reales.",
);

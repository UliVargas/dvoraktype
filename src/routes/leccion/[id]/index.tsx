import {
  component$,
  useSignal,
  $,
  useComputed$,
  useTask$,
} from "@builder.io/qwik";
import {
  useNavigate,
  Link,
  routeLoader$,
  routeAction$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import {
  LuArrowLeft,
  LuRefreshCw,
  LuTrophy,
  LuArrowRight,
} from "@qwikest/icons/lucide";
import { lessons } from "../../../data/lessons";
import { progressService } from "../../../server/progress.service";
import {
  esDvorakLayout,
  usDvorakIntlLayout,
} from "../../../data/dvorak-layout";
import { type TypingStats } from "../../../data/types";
import { TypingArea } from "../../../components/ui/typing-area";
import { Keyboard } from "../../../components/ui/keyboard";
import { StatsBar } from "../../../components/ui/stats-bar";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { useLayoutVariant } from "../../../context/layout-context";

export const useLessonState = routeLoader$(async (requestEvent) => {
  const sessionId = requestEvent.cookie.get("sessionId")?.value;
  const lessonId = requestEvent.params.id;
  if (!sessionId) {
    throw requestEvent.redirect(302, "/");
  }
  return await progressService.getLessonState(sessionId, lessonId);
});

export const useLessonData = routeLoader$((requestEvent) => {
  const lessonId = requestEvent.params.id;
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    throw requestEvent.redirect(302, "/");
  }
  return lesson;
});

export const useSaveExercise = routeAction$(async (data, requestEvent) => {
  const sessionId = requestEvent.cookie.get("sessionId")?.value;
  if (!sessionId) return { success: false };

  await progressService.saveExerciseResult(
    sessionId,
    data.lessonId as string,
    data.exerciseId as string,
    { wpm: Number(data.wpm), accuracy: Number(data.accuracy) } as any,
    data.isLastExercise === "true",
    data.passed === "true",
  );
  return { success: true };
});

export default component$(() => {
  const nav = useNavigate();

  const lessonData = useLessonData();
  const lessonState = useLessonState();
  const saveAction = useSaveExercise();
  const layoutVariant = useLayoutVariant();

  const currentExerciseIndex = useSignal(lessonState.value.nextExerciseIndex);
  const currentStats = useSignal<TypingStats | null>(null);
  const showResults = useSignal(false);
  const resetKey = useSignal(Date.now().toString());
  const currentTypingIndex = useSignal(0);

  useTask$(({ track }) => {
    const state = track(() => lessonState.value);
    currentExerciseIndex.value = state.nextExerciseIndex;
    currentTypingIndex.value = 0;
    resetKey.value = Date.now().toString();
  });

  const currentExercise = useComputed$(() => {
    return lessonData.value.exercises[currentExerciseIndex.value];
  });

  const handleComplete = $((stats: TypingStats) => {
    const lesson = lessonData.value;
    if (!currentExercise.value) return;

    currentStats.value = stats;
    showResults.value = true;

    const isLastExercise =
      currentExerciseIndex.value === lesson.exercises.length - 1;
    const passedThisExercise =
      stats.wpm >= lesson.requiredWpm &&
      stats.accuracy >= lesson.requiredAccuracy;

    // ===================================================================
    // Confetti
    // ===================================================================
    // Import dinámico para que sea seguro en SSR y Qwik.
    // ===================================================================
    if (passedThisExercise) {
      import("canvas-confetti").then((module) => {
        const confetti = module.default;
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2563eb", "#16a34a", "#eab308", "#000000", "#ffffff"],
          disableForReducedMotion: true,
        });
      });
    }

    saveAction.submit({
      lessonId: lesson.id,
      exerciseId: currentExercise.value.id,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      isLastExercise: isLastExercise ? "true" : "false",
      passed: passedThisExercise ? "true" : "false",
    });
  });

  const handleNext = $(() => {
    const lesson = lessonData.value;

    if (currentExerciseIndex.value < lesson.exercises.length - 1) {
      currentExerciseIndex.value++;
      showResults.value = false;
      currentStats.value = null;
      resetKey.value = Date.now().toString();
    } else {
      showResults.value = false;
      currentStats.value = null;
      currentExerciseIndex.value = 0;
      currentTypingIndex.value = 0;
      resetKey.value = Date.now().toString();

      const nextLessonIndex = lessons.findIndex((l) => l.id === lesson.id) + 1;
      if (nextLessonIndex < lessons.length) {
        nav(`/leccion/${lessons[nextLessonIndex].id}`);
      } else {
        nav("/");
      }
    }
  });

  const handleRetry = $(() => {
    showResults.value = false;
    currentStats.value = null;
    currentTypingIndex.value = 0;
    resetKey.value = Date.now().toString();
  });

  const passedCurrent = currentStats.value
    ? currentStats.value.wpm >= lessonData.value.requiredWpm &&
      currentStats.value.accuracy >= lessonData.value.requiredAccuracy
    : false;

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
          <h2 class="text-2xl font-black">{lessonData.value.title}</h2>
          <p class="text-sm font-medium opacity-70">
            Ejercicio {currentExerciseIndex.value + 1} de{" "}
            {lessonData.value.exercises.length}
          </p>
        </div>
      </div>

      <div class="bg-surface-card border-2 border-border p-4 rounded-brutal-sm shadow-brutal-sm text-surface-dark/80 text-sm leading-relaxed mb-6">
        <p>
          <strong>Teoría:</strong> {lessonData.value.description}
        </p>
      </div>

      <div class="flex gap-4 mb-4 text-sm font-bold uppercase tracking-wider text-surface-dark/60">
        <span class="flex items-center gap-1">
          Meta WPM:{" "}
          <span class="text-primary">{lessonData.value.requiredWpm}</span>
        </span>
        <span class="flex items-center gap-1">
          Meta Precisión:{" "}
          <span class="text-primary">{lessonData.value.requiredAccuracy}%</span>
        </span>
      </div>

      <TypingArea
        targetText={currentExercise.value.content}
        onComplete$={handleComplete}
        resetKey={resetKey.value}
        currentIndexSignal={currentTypingIndex}
      />

      {showResults.value && currentStats.value && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dark/40 backdrop-blur-sm animate-fade-in">
          <Card
            class={`max-w-md w-full bg-surface ${!passedCurrent ? "animate-shake" : ""}`}
          >
            <div class="text-center mb-6">
              <div
                class={`inline-flex items-center justify-center w-16 h-16 rounded-full border-4 brutal-border mb-4 ${passedCurrent ? "bg-state-success text-white" : "bg-state-warning"}`}
              >
                {passedCurrent ? (
                  <LuTrophy class="w-8 h-8" />
                ) : (
                  <LuRefreshCw class="w-8 h-8" />
                )}
              </div>
              <h3 class="text-3xl font-black mb-2">
                {passedCurrent ? "¡Excelente!" : "Casi lo logras"}
              </h3>
              <p class="font-medium text-surface-dark/70">
                {passedCurrent
                  ? "Has superado los requisitos de este ejercicio."
                  : "Sigue practicando para alcanzar la velocidad y precisión requerida."}
              </p>
            </div>

            <StatsBar
              wpm={currentStats.value.wpm}
              accuracy={currentStats.value.accuracy}
              errors={currentStats.value.errorChars}
              elapsed={currentStats.value.elapsedTime}
            />

            <div class="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                variant={passedCurrent ? "secondary" : "primary"}
                size="lg"
                onClick$={handleRetry}
                class="flex-1 flex justify-center items-center gap-2"
              >
                <LuRefreshCw class="w-5 h-5" /> Reintentar
              </Button>
              {passedCurrent && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick$={handleNext}
                  class="flex-1 flex justify-center items-center gap-2 text-lg border-4"
                >
                  <span class="font-black">
                    {currentExerciseIndex.value <
                    lessonData.value.exercises.length - 1
                      ? "Siguiente"
                      : "Completar"}
                  </span>
                  <LuArrowRight class="w-6 h-6 stroke-3" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      <div
        class={`mt-8 transition-opacity duration-300 ${showResults.value ? "opacity-30" : "opacity-100"}`}
      >
        <div class="flex items-center justify-between mb-2 px-2">
          <div class="text-sm font-bold text-surface-dark/60 uppercase tracking-widest flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-state-success animate-pulse"></span>
            {layoutVariant.value === "us-dvorak-intl"
              ? usDvorakIntlLayout.name
              : esDvorakLayout.name}
          </div>
        </div>
        <div class="brutal-card bg-surface p-4 sm:p-6 overflow-x-auto custom-scrollbar flex justify-center">
          <div class="min-w-162.5">
            <Keyboard
              layout={
                layoutVariant.value === "us-dvorak-intl"
                  ? usDvorakIntlLayout
                  : esDvorakLayout
              }
              targetChar={
                currentExercise.value.content[currentTypingIndex.value]
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const lesson = resolveValue(useLessonData);
  return {
    title: `Lección: ${lesson.title} — DvorakType`,
    meta: [
      {
        name: "description",
        content: lesson.description,
      },
      {
        property: "og:title",
        content: `Mecanografía Dvorak - ${lesson.title}`,
      },
      {
        property: "og:description",
        content: lesson.description,
      },
    ],
  };
};

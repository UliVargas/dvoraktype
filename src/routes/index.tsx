import { component$ } from "@builder.io/qwik";
import { routeLoader$, useNavigate, type DocumentHead } from "@builder.io/qwik-city";
import { lessons, lessonForLayout } from "../data/lessons";
import { progressService } from "../server/progress.service";
import { ensureRequestSessionId } from "../server/session";
import { withFallback } from "../server/fallback";
import { LessonCard } from "../components/ui/lesson-card";
import { ProgressBar } from "../components/ui/progress-bar";
import { Keyboard } from "../components/ui/keyboard";
import { LAYOUT_VARIANT_IDS, getLayoutDefinition } from "../data/layout-registry";
import { useLayoutVariant } from "../context/layout-context";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_NAME,
  pageHead,
} from "../components/router-head/seo";

export const useLessonsProgress = routeLoader$(async (requestEvent) => {
  const sessionId = ensureRequestSessionId(requestEvent);

  const allProgress = await withFallback(
    () => progressService.getAllLessonProgress(sessionId),
    {},
    "Loading lesson progress",
  );

  let completedCount = 0;
  for (const lesson of lessons) {
    if (allProgress[lesson.id]?.completed) {
      completedCount++;
    }
  }

  return {
    progressMap: allProgress,
    completedCount,
    totalLessons: lessons.length,
  };
});

export default component$(() => {
  const nav = useNavigate();
  const progressData = useLessonsProgress();
  const layoutVariant = useLayoutVariant();

  const progressPercent = Math.round(
    (progressData.value.completedCount / progressData.value.totalLessons) * 100,
  );

  const currentLayout = getLayoutDefinition(layoutVariant.value).layout;
  const menuLabels = LAYOUT_VARIANT_IDS.map((id) => getLayoutDefinition(id).menuLabel);
  const layoutNames = `${menuLabels.slice(0, -1).join(", ")} o ${menuLabels.at(-1)}`;

  return (
    <div class="space-y-10 animate-fade-in">
      <div class="brutal-card bg-surface p-6 sm:p-8 flex flex-col items-center relative overflow-hidden">
        <h1 class="text-3xl md:text-4xl font-black text-surface-dark mb-4 text-center tracking-tight z-10">
          Bienvenido a Dvorak<span class="text-primary">Type</span>
        </h1>
        <p class="text-sm md:text-base text-surface-dark/80 mb-6 max-w-3xl text-center font-medium z-10">
          Domina el teclado más ergonómico del mundo. Selecciona tu distribución
          ({layoutNames}) en la parte superior para que coincida
          físicamente con las teclas{" "}
          <strong class="text-primary">Enter y Shift</strong> de tu hardware.
        </p>

        <div class="w-full overflow-x-auto pb-4 custom-scrollbar z-10">
          <div class="min-w-162.5 flex justify-center mx-auto">
            <Keyboard layout={currentLayout} />
          </div>
        </div>

        <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full border-4 border-primary/10 pointer-events-none" />
      </div>

      <div id="learning-path" class="scroll-mt-10">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <h2 class="text-2xl font-bold flex items-center gap-3">
            <span class="w-3 h-8 bg-primary inline-block brutal-border"></span>
            Ruta de Aprendizaje
          </h2>

          <div class="w-full md:w-1/2 lg:w-1/3">
            <ProgressBar
              value={progressPercent}
              label={`Completadas: ${progressData.value.completedCount} de ${progressData.value.totalLessons}`}
              colorClass="bg-primary"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson, index) => {
            const p = progressData.value.progressMap[lesson.id];

            let status: "locked" | "available" | "in-progress" | "completed" =
              "locked";

            if (p?.completed) {
              status = "completed";
            } else if (p?.inProgress) {
              status = "in-progress";
            } else if (
              index === 0 ||
              progressData.value.progressMap[lessons[index - 1].id]?.completed
            ) {
              status = "available";
            }

            return (
              <LessonCard
                key={lesson.id}
                lesson={lessonForLayout(lesson, layoutVariant.value)}
                status={status}
                bestWpm={p?.bestWpm}
                bestAccuracy={p?.bestAccuracy}
                onClick$={() => {
                  if (status !== "locked") {
                    nav(`/leccion/${lesson.id}`);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ url }) => ({
  ...pageHead(DEFAULT_TITLE, DEFAULT_DESCRIPTION),
  scripts: [
    {
      key: "ld-json",
      props: { type: "application/ld+json" },
      script: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: SITE_NAME,
        url: `${url.origin}/`,
        description: DEFAULT_DESCRIPTION,
        inLanguage: "es",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }).replace(/</g, "\\u003c"),
    },
  ],
});

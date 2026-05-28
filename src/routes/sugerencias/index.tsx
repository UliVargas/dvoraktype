import { component$ } from "@builder.io/qwik";
import { Form, routeAction$, z, zod$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { progressService } from "../../server/progress.service";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { LuMessageSquare, LuSend } from "@qwikest/icons/lucide";

export const useSubmitFeedback = routeAction$(
  async (data, requestEvent) => {
    let sessionId = requestEvent.cookie.get("sessionId")?.value;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      requestEvent.cookie.set("sessionId", sessionId, {
        path: "/",
        maxAge: [365, "days"],
      });
    }

    try {
      await progressService.submitFeedback(
        sessionId,
        data.type as string,
        data.message as string
      );
      return { success: true };
    } catch {
      return requestEvent.fail(500, {
        message: "Hubo un error al enviar tu sugerencia.",
      });
    }
  },
  zod$({
    type: z.enum(["suggestion", "bug", "other"]),
    message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres."),
  })
);

export default component$(() => {
  const action = useSubmitFeedback();

  return (
    <div class="flex-1 flex flex-col items-center justify-center py-12 px-4">
      <div class="max-w-2xl w-full">
        <div class="text-center mb-10 animate-slide-down">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-brutal bg-primary text-primary-foreground border-2 border-border shadow-brutal-sm mb-6">
            <LuMessageSquare class="w-8 h-8" />
          </div>
          <h1 class="text-4xl sm:text-5xl font-black text-surface-dark tracking-tight mb-4 leading-tight">
            Buzón de Sugerencias
          </h1>
          <p class="text-lg text-surface-dark/70 font-medium max-w-xl mx-auto leading-relaxed">
            ¿Tienes una idea genial? ¿Encontraste un error? Ayúdanos a mejorar
            DvorakType enviando tus comentarios anónimos directamente al desarrollador.
          </p>
        </div>

        <Card class="p-6 sm:p-8 animate-slide-up">
          {action.value?.success ? (
            <div class="text-center py-8">
              <div class="text-5xl mb-4">🎉</div>
              <h2 class="text-2xl font-bold text-state-success mb-2">
                ¡Mensaje Recibido!
              </h2>
              <p class="text-surface-dark/70 font-medium">
                Muchísimas gracias por tomarte el tiempo de compartir tus
                ideas. Esto ayuda enormemente a mejorar la aplicación.
              </p>
            </div>
          ) : (
            <Form action={action} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label for="type" class="font-bold text-surface-dark">
                  Tipo de Mensaje
                </label>
                <select
                  name="type"
                  id="type"
                  class="brutal-input bg-surface border-2 border-border p-3 rounded-brutal-sm font-medium outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
                  required
                >
                  <option value="suggestion">💡 Sugerencia / Idea</option>
                  <option value="bug">🐛 Reporte de Bug</option>
                  <option value="other">💬 Otro</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-surface-dark">
                  {/* Flecha personalizada via CSS o simplemente el default de OS dependiendo del navegador */}
                </div>
              </div>

              <div class="flex flex-col gap-2 relative">
                <label for="message" class="font-bold text-surface-dark">
                  Tu Mensaje
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={5}
                  class="brutal-input bg-surface border-2 border-border p-3 rounded-brutal-sm font-medium outline-none focus:border-primary transition-colors resize-y min-h-[120px]"
                  placeholder="Describe tu idea, problema o comentario con el mayor detalle posible..."
                  required
                ></textarea>
                {action.value?.fieldErrors?.message && (
                  <p class="text-sm text-state-error font-bold mt-1">
                    {action.value.fieldErrors.message[0]}
                  </p>
                )}
                {action.value?.message && (
                  <p class="text-sm text-state-error font-bold mt-1">
                    {action.value.message}
                  </p>
                )}
              </div>

              <div class="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  class="w-full flex items-center justify-center gap-2 relative"
                >
                  {action.isRunning ? "Enviando..." : "Enviar Mensaje"}
                  {!action.isRunning && <LuSend class="w-5 h-5" />}
                </Button>
              </div>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Sugerencias | DvorakType",
  meta: [
    {
      name: "description",
      content:
        "Envía tus sugerencias, reporta bugs y ayúdanos a mejorar DvorakType. Tu feedback es anónimo y muy valioso.",
    },
  ],
};

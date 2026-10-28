// Turns the outcome of an action's submit() into a user-facing error, or
// undefined when the result was saved.

export const SAVE_ERROR_MESSAGE =
  "No pudimos guardar tu resultado. Tu progreso de este intento no se registró.";

interface ActionOutcome {
  status?: number;
  value?: unknown;
}

export async function saveErrorOf(
  submit: Promise<ActionOutcome>,
): Promise<string | undefined> {
  try {
    const { status = 200, value } = await submit;
    const v = value as { failed?: boolean; success?: boolean } | undefined;
    if (status >= 400 || v?.failed || v?.success === false) return SAVE_ERROR_MESSAGE;
    return undefined;
  } catch {
    return SAVE_ERROR_MESSAGE;
  }
}

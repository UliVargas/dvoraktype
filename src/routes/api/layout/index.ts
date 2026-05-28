import type { RequestHandler } from "@builder.io/qwik-city";
import { progressService } from "../../../server/progress.service";

export const onPost: RequestHandler = async (requestEvent) => {
  const sessionId = requestEvent.cookie.get("sessionId")?.value;
  if (!sessionId) {
    requestEvent.json(401, { error: "No session" });
    return;
  }

  const body = await requestEvent.request.json();
  const variant = body?.variant;

  if (!variant || !["es-dvorak-xkb", "us-dvorak-intl"].includes(variant)) {
    requestEvent.json(400, { error: "Invalid variant" });
    return;
  }

  await progressService.updateUserSettings(sessionId, variant);
  requestEvent.json(200, { success: true });
};

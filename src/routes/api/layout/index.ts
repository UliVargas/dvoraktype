import type { RequestHandler } from "@builder.io/qwik-city";
import { progressService } from "../../../server/progress.service";
import { parseLayoutRequest } from "../../../server/request-rules";
import { getSessionId } from "../../../server/session";

export const onPost: RequestHandler = async (requestEvent) => {
  const sessionId = getSessionId(requestEvent.cookie);
  if (!sessionId) {
    requestEvent.json(401, { error: "No session" });
    return;
  }

  const parsed = parseLayoutRequest(
    requestEvent.request.headers.get("content-type"),
    await requestEvent.request.text(),
  );
  if (!parsed.ok) {
    requestEvent.json(400, { error: parsed.error });
    return;
  }

  await progressService.updateUserSettings(sessionId, parsed.variant);
  requestEvent.json(200, { success: true });
};

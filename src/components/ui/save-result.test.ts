import { describe, expect, it } from "vitest";
import { SAVE_ERROR_MESSAGE, saveErrorOf } from "./save-result";

describe("saveErrorOf", () => {
  it("is undefined when the action saved the result", async () => {
    expect(await saveErrorOf(Promise.resolve({ status: 200, value: { success: true } }))).toBeUndefined();
  });

  it.each([
    ["a fail() result", { status: 400, value: { failed: true } }],
    ["a rejected save (locked lesson)", { status: 403, value: { failed: true, message: "Lesson is locked" } }],
    ["a missing session", { status: 200, value: { success: false } }],
    ["a server error", { status: 500, value: undefined }],
  ])("reports %s", async (_label, outcome) => {
    expect(await saveErrorOf(Promise.resolve(outcome))).toBe(SAVE_ERROR_MESSAGE);
  });

  it("reports a network failure", async () => {
    expect(await saveErrorOf(Promise.reject(new Error("offline")))).toBe(SAVE_ERROR_MESSAGE);
  });
});

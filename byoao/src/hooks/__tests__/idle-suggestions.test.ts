import { describe, it, expect } from "vitest";
import { getIdleSuggestion } from "../idle-suggestions.js";

describe("getIdleSuggestion", () => {
  it("returns a non-null string", () => {
    const result = getIdleSuggestion();
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
    expect(result!.length).toBeGreaterThan(0);
  });

  it("returns a string starting with Tip:", () => {
    const result = getIdleSuggestion();
    expect(result).toMatch(/^Tip:/);
  });
});

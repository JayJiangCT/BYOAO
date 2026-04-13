import { describe, it, expect } from "vitest";
import {
  listPresetsDetailed,
  filterPresetsForInitUseCase,
} from "../preset.js";

describe("filterPresetsForInitUseCase", () => {
  it("personal path excludes work-only preset", () => {
    const all = listPresetsDetailed();
    const personal = filterPresetsForInitUseCase(all, "personal");
    expect(personal.some((p) => p.name === "pm-tpm")).toBe(false);
    expect(personal.some((p) => p.name === "minimal")).toBe(true);
  });

  it("work path includes minimal and pm-tpm", () => {
    const all = listPresetsDetailed();
    const work = filterPresetsForInitUseCase(all, "work");
    const names = work.map((p) => p.name).sort();
    expect(names).toContain("minimal");
    expect(names).toContain("pm-tpm");
  });
});

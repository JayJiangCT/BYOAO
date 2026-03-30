import { describe, it, expect, vi } from "vitest";

describe("toolbox", () => {
  it("checkGcloud returns installed status", async () => {
    const { checkGcloud } = await import("../toolbox.js");
    const result = checkGcloud();
    // Just verify the shape — actual gcloud status depends on CI/local env
    expect(result).toHaveProperty("installed");
    expect(result).toHaveProperty("version");
    expect(typeof result.installed).toBe("boolean");
  });

  it("isNpxAvailable returns true in Node environment", async () => {
    const { isNpxAvailable } = await import("../toolbox.js");
    // npx should always be available where Node is installed
    expect(isNpxAvailable()).toBe(true);
  });
});

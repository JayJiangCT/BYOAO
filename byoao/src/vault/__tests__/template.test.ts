import { describe, it, expect } from "vitest";
import { renderTemplate, today } from "../template.js";

describe("renderTemplate", () => {
  it("renders simple variables", () => {
    expect(renderTemplate("Hello {{name}}", { name: "World" })).toBe(
      "Hello World"
    );
  });

  it("leaves missing variables as empty string", () => {
    expect(renderTemplate("Hello {{name}}", {})).toBe("Hello ");
  });

  it("renders conditionals", () => {
    const tpl = "{{#if show}}visible{{/if}}";
    expect(renderTemplate(tpl, { show: true })).toBe("visible");
    expect(renderTemplate(tpl, { show: false })).toBe("");
  });

  it("does not escape HTML (noEscape mode)", () => {
    expect(renderTemplate("{{val}}", { val: "<b>bold</b>" })).toBe(
      "<b>bold</b>"
    );
  });

  it("renders each blocks", () => {
    const tpl = "{{#each items}}{{this}}\n{{/each}}";
    expect(renderTemplate(tpl, { items: ["a", "b"] })).toBe("a\nb\n");
  });
});

describe("today", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = today();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today's date", () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(today()).toBe(expected);
  });
});

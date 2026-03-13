import Handlebars from "handlebars";

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

export function renderTemplate(
  templateStr: string,
  data: Record<string, unknown>
): string {
  let compiled = templateCache.get(templateStr);
  if (!compiled) {
    compiled = Handlebars.compile(templateStr, { noEscape: true });
    templateCache.set(templateStr, compiled);
  }
  return compiled(data);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

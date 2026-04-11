import chalk from "chalk";
import { BYOAO_LOGO_LINES } from "./byoao-logo-art.js";

const TAGLINE = "Build Your Own AI OS";

/** Logo anchor + TUI accents (warm marmot, same family as `byoao_logo.js` 175;120;82) */
const RGB = {
  furLight: [198, 148, 108] as const,
  headline: [215, 178, 132] as const,
  accent: [190, 140, 95] as const,
  success: [118, 142, 88] as const,
  warn: [212, 170, 72] as const,
  error: [188, 82, 76] as const,
};

const tc = (rgb: readonly [number, number, number], s: string) =>
  chalk.rgb(rgb[0], rgb[1], rgb[2])(s);

// Tagline: warm brown–tan (banner art from `byoao-logo-art.ts`)
const GRADIENT_FULL: number[][] = [
  [132, 86, 58],
  [158, 108, 74],
  [175, 120, 82],
  [198, 148, 108],
  [218, 172, 128],
];

function lerpColor(
  c1: number[],
  c2: number[],
  t: number
): [number, number, number] {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

function colorize(
  text: string,
  gradient: number[][],
  row: number,
  totalRows: number
): string {
  const chars = [...text];
  return chars
    .map((ch, i) => {
      const colT = chars.length > 1 ? i / (chars.length - 1) : 0;
      const rowT = totalRows > 1 ? row / (totalRows - 1) : 0;
      const t = colT * 0.7 + rowT * 0.3;
      const seg = t * (gradient.length - 1);
      const idx = Math.min(Math.floor(seg), gradient.length - 2);
      const [r, g, b] = lerpColor(gradient[idx], gradient[idx + 1], seg - idx);
      return chalk.rgb(r, g, b)(ch);
    })
    .join("");
}

const BAR_WIDTH = 22;

export function printLogo(): void {
  console.log();
  for (const line of BYOAO_LOGO_LINES) {
    console.log(`  ${line}`);
  }
  console.log();
  const pad = " ".repeat(6);
  console.log(pad + colorize(`~ ${TAGLINE} ~`, GRADIENT_FULL, 1, 3));
  console.log();
}

export function printVersion(version: string): void {
  console.log(chalk.dim(`  Installing byoao version: ${version}`));
  console.log();
}

export function printSectionHeader(title: string): void {
  console.log(chalk.dim(`  ${title}`));
}

export function printProgress(
  label: string,
  status: "ok" | "warn" | "skip" | "fail",
  detail?: string
): void {
  const markers: Record<typeof status, string> = {
    ok: tc(RGB.success, "✓"),
    warn: tc(RGB.warn, "⚠"),
    skip: chalk.dim("⏭"),
    fail: tc(RGB.error, "✗"),
  };

  const marker = markers[status];
  const text = detail ? `${label} ${chalk.dim(`(${detail})`)}` : label;
  console.log(`  ${marker} ${text}`);
}

export function printProgressBar(percent: number): void {
  const filled = Math.round((percent / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const bar =
    tc(RGB.furLight, "█".repeat(filled)) + chalk.dim("░".repeat(empty));
  const pct = `${Math.round(percent)}%`;
  console.log(`  ${bar}${chalk.dim(`  ${pct}`)}`);
}

export function printProgressWithBar(
  label: string,
  status: "ok" | "warn" | "skip" | "fail",
  percent: number,
  detail?: string
): void {
  const markers: Record<typeof status, string> = {
    ok: tc(RGB.success, "✓"),
    warn: tc(RGB.warn, "⚠"),
    skip: chalk.dim("⏭"),
    fail: tc(RGB.error, "✗"),
  };

  const marker = markers[status];
  const text = detail ? `${label} ${chalk.dim(`(${detail})`)}` : label;

  const filled = Math.round((percent / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const bar =
    tc(RGB.furLight, "█".repeat(filled)) + chalk.dim("░".repeat(empty));
  const pct = `${Math.round(percent)}%`;

  // Pad label to align bars
  const padded = text.padEnd(36);
  console.log(`  ${marker} ${padded} ${bar}${chalk.dim(`  ${pct}`)}`);
}

export function printGettingStarted(
  items: { cmd: string; desc: string }[]
): void {
  console.log();
  console.log(
    chalk.rgb(RGB.headline[0], RGB.headline[1], RGB.headline[2]).bold(
      "  Build Your Own AI OS — Obsidian + AI Agent"
    )
  );
  console.log();

  for (const item of items) {
    const cmd = tc(RGB.accent, item.cmd.padEnd(28));
    const desc = chalk.dim(item.desc);
    console.log(`  ${cmd}${desc}`);
  }
}

export function printFooter(url: string): void {
  console.log();
  console.log(
    `  ${chalk.dim("For more info visit")} ${tc(RGB.furLight, url)}`
  );
  console.log();
}

export function printBlank(): void {
  console.log();
}

export function printWarning(message: string): void {
  const w = tc(RGB.warn, "⚠");
  console.log(`  ${w} ${tc(RGB.warn, message)}`);
}

export function printInfo(message: string): void {
  console.log(chalk.dim(`  ${message}`));
}

/** Print an event-line marker: ● label */
export function printEvent(label: string): void {
  console.log(`  ${tc(RGB.accent, "●")} ${chalk.bold(label)}`);
}

/** Print event-line detail (indented under event) */
export function printEventDetail(text: string): void {
  console.log(`    ${text}`);
}

/** Print a completed event detail with checkmark: ✓ text */
export function printEventCheck(text: string): void {
  console.log(`    ${tc(RGB.success, "✓")} ${text}`);
}

/** Print a completed event: ◆ label */
export function printEventDone(label: string): void {
  console.log(`  ${tc(RGB.success, "◆")} ${chalk.bold(label)}`);
}

/** Animated spinner for long-running operations. Call stop() when done. */
export function startSpinner(label: string): { stop: (finalLabel?: string) => void } {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const stream = process.stderr;

  const interval = setInterval(() => {
    stream.write(
      `\r  ${tc(RGB.accent, frames[i % frames.length])} ${chalk.bold(label)}`
    );
    i++;
  }, 80);

  return {
    stop(finalLabel?: string) {
      clearInterval(interval);
      stream.write(`\r${"".padEnd(label.length + 10)}\r`);
      if (finalLabel) {
        printEventDone(finalLabel);
      }
    },
  };
}

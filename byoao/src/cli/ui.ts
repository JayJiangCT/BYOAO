import chalk from "chalk";

// B and Y use standard gradient; OΛO uses a warm accent to hint at the "face"
//
//   B   Y   O   Λ   O
//             👁  👄  👁    ← the hidden face
//
// Λ = pointed top, no crossbar (unlike A). Two open legs = cat-mouth vibe.

// Column index where OΛO begins (after "  " prefix + BY columns)
const FACE_START = 20;

// Full logo as single block for precise alignment.
// The A column is replaced with a symmetric Λ:
//   pointed top (██╗), widening (████╗), open legs, no crossbar.
const LOGO_LINES = [
  "  ██████╗ ██╗   ██╗ ██████╗   ██╗    ██████╗ ",
  "  ██╔══██╗╚██╗ ██╔╝██╔═══██╗ ████╗  ██╔═══██╗",
  "  ██████╔╝ ╚████╔╝ ██║   ██║██╔══██╗██║   ██║",
  "  ██╔══██╗  ╚██╔╝  ██║   ██║██║  ██║██║   ██║",
  "  ██████╔╝   ██║   ╚██████╔╝██║  ██║╚██████╔╝",
  "  ╚═════╝    ╚═╝    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ",
];

const TAGLINE = "Build Your Own AI OS";

// BY gradient: purple → blue
const GRADIENT_BY: number[][] = [
  [138, 92, 246],  // purple
  [99, 144, 255],  // blue
];

// OΛO gradient: cyan → mint → green  (warmer, eye-catching)
const GRADIENT_FACE: number[][] = [
  [34, 211, 238],  // cyan
  [52, 211, 153],  // mint
  [16, 185, 129],  // green
];

// Tagline: full spectrum
const GRADIENT_FULL: number[][] = [
  [138, 92, 246],
  [99, 144, 255],
  [34, 211, 238],
  [52, 211, 153],
  [16, 185, 129],
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
  const totalRows = LOGO_LINES.length;
  console.log();
  for (let i = 0; i < totalRows; i++) {
    const chars = [...LOGO_LINES[i]];
    const byPart = chars.slice(0, FACE_START).join("");
    const facePart = chars.slice(FACE_START).join("");
    const by = colorize(byPart, GRADIENT_BY, i, totalRows);
    const face = colorize(facePart, GRADIENT_FACE, i, totalRows);
    console.log(by + face);
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
    ok: chalk.green("✓"),
    warn: chalk.yellow("⚠"),
    skip: chalk.dim("⏭"),
    fail: chalk.red("✗"),
  };

  const marker = markers[status];
  const text = detail ? `${label} ${chalk.dim(`(${detail})`)}` : label;
  console.log(`  ${marker} ${text}`);
}

export function printProgressBar(percent: number): void {
  const filled = Math.round((percent / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const pct = `${Math.round(percent)}%`;
  console.log(chalk.dim(`  ${bar}  ${pct}`));
}

export function printProgressWithBar(
  label: string,
  status: "ok" | "warn" | "skip" | "fail",
  percent: number,
  detail?: string
): void {
  const markers: Record<typeof status, string> = {
    ok: chalk.green("✓"),
    warn: chalk.yellow("⚠"),
    skip: chalk.dim("⏭"),
    fail: chalk.red("✗"),
  };

  const marker = markers[status];
  const text = detail ? `${label} ${chalk.dim(`(${detail})`)}` : label;

  const filled = Math.round((percent / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const pct = `${Math.round(percent)}%`;

  // Pad label to align bars
  const padded = text.padEnd(36);
  console.log(`  ${marker} ${padded} ${chalk.dim(`${bar}  ${pct}`)}`);
}

export function printGettingStarted(
  items: { cmd: string; desc: string }[]
): void {
  console.log();
  console.log(
    chalk.bold("  Build Your Own AI OS — Obsidian + AI Agent")
  );
  console.log();

  for (const item of items) {
    const cmd = chalk.cyan(item.cmd.padEnd(28));
    const desc = chalk.dim(item.desc);
    console.log(`  ${cmd}${desc}`);
  }
}

export function printFooter(url: string): void {
  console.log();
  console.log(chalk.dim(`  For more info visit ${url}`));
  console.log();
}

export function printBlank(): void {
  console.log();
}

export function printWarning(message: string): void {
  console.log(`  ${chalk.yellow("⚠")} ${chalk.yellow(message)}`);
}

export function printInfo(message: string): void {
  console.log(chalk.dim(`  ${message}`));
}

/** Print an event-line marker: ● label */
export function printEvent(label: string): void {
  console.log(`  ${chalk.cyan("●")} ${chalk.bold(label)}`);
}

/** Print event-line detail (indented under event) */
export function printEventDetail(text: string): void {
  console.log(`    ${text}`);
}

/** Print a completed event: ◆ label */
export function printEventDone(label: string): void {
  console.log(`  ${chalk.green("◆")} ${chalk.bold(label)}`);
}

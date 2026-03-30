import { execSync } from "node:child_process";

/**
 * Check if gcloud CLI is installed and return version info.
 */
export function checkGcloud(): { installed: boolean; version: string } {
  try {
    const output = execSync("gcloud --version", {
      encoding: "utf-8",
      timeout: 10_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const match = output.match(/Google Cloud SDK (\S+)/);
    return { installed: true, version: match?.[1] ?? "unknown" };
  } catch {
    return { installed: false, version: "" };
  }
}

/**
 * Check if ADC (Application Default Credentials) has a valid token.
 */
export function isAdcValid(): boolean {
  try {
    execSync("gcloud auth application-default print-access-token", {
      encoding: "utf-8",
      timeout: 10_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if npx is available (Node.js installed).
 */
export function isNpxAvailable(): boolean {
  try {
    execSync("npx --version", {
      encoding: "utf-8",
      timeout: 5_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

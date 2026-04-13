import { fs } from "../lib/cjs-modules.js";
import path from "node:path";

/**
 * Copy preset INDEX.base.example to vault root as INDEX.base when missing (idempotent).
 * Returns true if a new file was written.
 */
export async function copyIndexBaseExampleIfMissing(
  vaultPath: string,
  commonDir: string,
): Promise<boolean> {
  const dest = path.join(vaultPath, "INDEX.base");
  if (await fs.pathExists(dest)) {
    return false;
  }
  const src = path.join(commonDir, "INDEX.base.example");
  if (!(await fs.pathExists(src))) {
    return false;
  }
  await fs.copy(src, dest);
  return true;
}

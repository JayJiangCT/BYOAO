/**
 * CJS interop shim bundled by esbuild at build time.
 *
 * Bun 1.3.x cannot load CJS packages via `import` or `createRequire` in an
 * ESM plugin context. The solution is to bundle this file with esbuild, which
 * inlines the CJS dependencies as self-contained ESM code.
 *
 * fs-extra is replaced by native Node.js APIs to avoid bundling a package
 * that has optional native bindings (graceful-fs).
 */
import type FsExtra from "fs-extra";
import type GrayMatter from "gray-matter";
import type HandlebarsType from "handlebars";
import type * as SemverType from "semver";

// ── native Node.js fs replacement ─────────────────────────────────────────────
import * as nodeFs from "node:fs";
import * as nodeFsPromises from "node:fs/promises";
import nodePath from "node:path";

async function copy(src: string, dest: string): Promise<void> {
  await nodeFsPromises.cp(src, dest, { recursive: true });
}
async function ensureDir(dirPath: string): Promise<void> {
  await nodeFsPromises.mkdir(dirPath, { recursive: true });
}
async function pathExists(filePath: string): Promise<boolean> {
  try { await nodeFsPromises.access(filePath); return true; } catch { return false; }
}
function pathExistsSync(filePath: string): boolean {
  return nodeFs.existsSync(filePath);
}
async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await nodeFsPromises.readFile(filePath, "utf-8"));
}
function readJsonSync(filePath: string): unknown {
  return JSON.parse(nodeFs.readFileSync(filePath, "utf-8"));
}
async function writeJson(filePath: string, data: unknown, options?: { spaces?: number }): Promise<void> {
  const indent = options?.spaces ?? 2;
  await nodeFsPromises.mkdir(nodePath.dirname(filePath), { recursive: true });
  await nodeFsPromises.writeFile(filePath, JSON.stringify(data, null, indent));
}
function writeJsonSync(filePath: string, data: unknown, options?: { spaces?: number }): void {
  const indent = options?.spaces ?? 2;
  nodeFs.mkdirSync(nodePath.dirname(filePath), { recursive: true });
  nodeFs.writeFileSync(filePath, JSON.stringify(data, null, indent));
}
async function remove(filePath: string): Promise<void> {
  await nodeFsPromises.rm(filePath, { recursive: true, force: true });
}
function removeSync(filePath: string): void {
  nodeFs.rmSync(filePath, { recursive: true, force: true });
}

export const fs = {
  existsSync: nodeFs.existsSync,
  readFileSync: nodeFs.readFileSync,
  readdirSync: nodeFs.readdirSync,
  readFile: nodeFsPromises.readFile,
  writeFile: nodeFsPromises.writeFile,
  readdir: nodeFsPromises.readdir,
  mkdir: nodeFsPromises.mkdir,
  copy, ensureDir, pathExists, pathExistsSync,
  readJson, readJsonSync, writeJson, writeJsonSync,
  remove, removeSync,
} as unknown as typeof FsExtra;

// ── CJS packages — bundled inline by esbuild ─────────────────────────────────
import _matter from "gray-matter";
import _Handlebars from "handlebars";
import * as _semver from "semver";

export const matter = _matter as typeof GrayMatter;
export const Handlebars = _Handlebars as typeof HandlebarsType;
export const semver = _semver as typeof SemverType;

import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SCAN_EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".nuxt", "coverage", ".turbo"]);

export function walkDir(dir, exts = SCAN_EXTS) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      results.push(...walkDir(full, exts));
    } else if (entry.isFile() && exts.has(extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Load the list of exported components from a DS package.
 * Reads node_modules/<pkg>/index or from a provided manifest file.
 */
export function loadInventory(source) {
  if (!source) return [];
  const p = resolve(source);
  if (!existsSync(p)) return [];

  const raw = readFileSync(p, "utf8");

  if (p.endsWith(".json")) {
    try {
      const obj = JSON.parse(raw);
      if (Array.isArray(obj)) return obj;
      if (obj.components && Array.isArray(obj.components)) return obj.components;
      return Object.keys(obj).filter(k => /^[A-Z]/.test(k));
    } catch { return []; }
  }

  const exports = [];
  const re = /export\s+(?:const|function|class)\s+([A-Z]\w*)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    exports.push(m[1]);
  }

  const reExport = /export\s+\{\s*([^}]+)\s*\}/g;
  while ((m = reExport.exec(raw)) !== null) {
    const names = m[1].split(",").map(n => n.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    for (const n of names) {
      if (/^[A-Z]/.test(n)) exports.push(n);
    }
  }

  return [...new Set(exports)];
}

#!/usr/bin/env node

import { resolve } from "node:path";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { walkDir } from "../lib/walk.js";
import { scanFile, findDuplicates } from "../lib/scanner.js";
import { loadInventory } from "../lib/inventory.js";
import { formatTerminal, formatMarkdown, formatJSON } from "../lib/reporter.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  ds-coverage — Measure design system adoption

  Usage:
    ds-coverage [path] [options]

  Options:
    --ds <packages>    Comma-separated DS package names (required)
                       e.g. --ds @company/ui,@company/icons
    --inventory <file> JSON or JS file listing all DS components
    --format <type>    Output: terminal (default), markdown, json
    --out <file>       Write report to file
    --min <percent>    Fail if coverage below threshold (e.g. --min 70)
    --version          Print version
    --help             Print this help

  Examples:
    ds-coverage src/ --ds @acme/ui
    ds-coverage . --ds @acme/ui,@acme/icons --format markdown
    ds-coverage src/ --ds @acme/ui --inventory components.json --min 60
`);
  process.exit(0);
}

if (args.includes("--version")) {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  console.log(pkg.version);
  process.exit(0);
}

const targetIdx = args.findIndex(a => !a.startsWith("-"));
const target = targetIdx >= 0 ? resolve(args[targetIdx]) : resolve(".");

const dsIdx = args.indexOf("--ds");
if (dsIdx < 0 || !args[dsIdx + 1]) {
  console.error("Error: --ds <packages> is required. Example: --ds @acme/ui");
  process.exit(1);
}
const dsPackages = args[dsIdx + 1].split(",").map(p => p.trim());

const invIdx = args.indexOf("--inventory");
const inventoryPath = invIdx >= 0 ? args[invIdx + 1] : null;

const formatIdx = args.indexOf("--format");
const format = formatIdx >= 0 ? args[formatIdx + 1] : "terminal";

const outIdx = args.indexOf("--out");
const outPath = outIdx >= 0 ? args[outIdx + 1] : null;

const minIdx = args.indexOf("--min");
const minThreshold = minIdx >= 0 ? parseInt(args[minIdx + 1], 10) : null;

if (!existsSync(target)) {
  console.error(`Path not found: ${target}`);
  process.exit(1);
}

const inventory = inventoryPath ? loadInventory(inventoryPath) : [];
const files = walkDir(target);

if (!files.length) {
  console.log("No source files found.");
  process.exit(0);
}

console.log(`Scanning ${files.length} files for ${dsPackages.join(", ")}...`);

const allDsComponents = [];
const allCustomComponents = [];
const componentCounts = new Map();
const packageStats = new Map();

for (const pkg of dsPackages) {
  packageStats.set(pkg, { components: new Set(), totalImports: 0 });
}

for (const f of files) {
  try {
    const result = scanFile(f, dsPackages);
    allDsComponents.push(...result.dsImports);
    allCustomComponents.push(...result.customComponents);

    for (const imp of result.rawImports) {
      componentCounts.set(imp.component, (componentCounts.get(imp.component) || 0) + 1);
      const ps = packageStats.get(imp.package);
      if (ps) {
        ps.components.add(imp.component);
        ps.totalImports++;
      }
    }
  } catch {
    // skip unreadable files
  }
}

const duplicates = findDuplicates(allDsComponents, allCustomComponents);

const sorted = [...componentCounts.entries()].sort((a, b) => b[1] - a[1]);
const topUsed = sorted.slice(0, 15);
const leastUsed = sorted.filter(([, c]) => c <= 2);

const packages = dsPackages.map(pkg => {
  const ps = packageStats.get(pkg);
  const used = ps.components.size;
  const total = inventory.length || null;
  const unused = inventory.filter(c => !ps.components.has(c));
  const pct = total ? `${Math.round((used / total) * 100)}%` : `${used} components`;
  return { name: pkg, used, total, totalImports: ps.totalImports, coverage: pct, unused };
});

const report = {
  filesScanned: files.length,
  dsUses: allDsComponents.length,
  customCount: new Set(allCustomComponents).size,
  duplicates,
  topUsed,
  leastUsed,
  packages,
};

let output;
if (format === "markdown" || format === "md") output = formatMarkdown(report);
else if (format === "json") output = formatJSON(report);
else output = formatTerminal(report);

if (outPath) {
  writeFileSync(resolve(outPath), output, "utf8");
  console.log(`Report written to ${outPath}`);
} else {
  console.log(output);
}

if (minThreshold !== null) {
  for (const pkg of packages) {
    const pct = parseInt(pkg.coverage, 10);
    if (!isNaN(pct) && pct < minThreshold) {
      console.error(`\nCoverage ${pkg.coverage} is below threshold ${minThreshold}% for ${pkg.name}`);
      process.exit(1);
    }
  }
}

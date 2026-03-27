/**
 * Format coverage report in terminal, markdown, or JSON.
 */

export function formatTerminal(report) {
  const lines = ["\n  Design System Coverage Report", "  ──────────────────────────────"];

  for (const pkg of report.packages) {
    lines.push(`\n  Package: ${pkg.name}`);
    lines.push(`  Components used:     ${pkg.used} of ${pkg.total || "?"} (${pkg.coverage})`);
    lines.push(`  Total imports:       ${pkg.totalImports}`);
    if (pkg.unused.length) {
      lines.push(`  Unused components:   ${pkg.unused.join(", ")}`);
    }
  }

  lines.push("\n  ─────────────────────────────");
  lines.push(`  Files scanned:       ${report.filesScanned}`);
  lines.push(`  DS component uses:   ${report.dsUses}`);
  lines.push(`  Custom components:   ${report.customCount}`);
  if (report.duplicates.length) {
    lines.push(`  ⚠ Possible dupes:   ${report.duplicates.join(", ")}`);
  }

  lines.push("");
  if (report.topUsed.length) {
    lines.push("  Top used:");
    for (const [name, count] of report.topUsed.slice(0, 10)) {
      lines.push(`    ${name} (${count})`);
    }
  }
  if (report.leastUsed.length) {
    lines.push("\n  Least used (1-2 imports):");
    for (const [name, count] of report.leastUsed) {
      lines.push(`    ${name} (${count})`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function formatMarkdown(report) {
  const lines = ["# Design System Coverage Report\n"];

  for (const pkg of report.packages) {
    lines.push(`## ${pkg.name}\n`);
    lines.push(`- **Components used:** ${pkg.used} of ${pkg.total || "?"} (${pkg.coverage})`);
    lines.push(`- **Total imports:** ${pkg.totalImports}`);
    if (pkg.unused.length) {
      lines.push(`- **Unused:** ${pkg.unused.map(u => `\`${u}\``).join(", ")}`);
    }
    lines.push("");
  }

  lines.push("## Summary\n");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Files scanned | ${report.filesScanned} |`);
  lines.push(`| DS component uses | ${report.dsUses} |`);
  lines.push(`| Custom components | ${report.customCount} |`);
  if (report.duplicates.length) {
    lines.push(`| ⚠ Possible duplicates | ${report.duplicates.join(", ")} |`);
  }

  if (report.topUsed.length) {
    lines.push("\n## Most Used\n");
    lines.push("| Component | Imports |");
    lines.push("|-----------|---------|");
    for (const [name, count] of report.topUsed.slice(0, 15)) {
      lines.push(`| \`${name}\` | ${count} |`);
    }
  }

  if (report.leastUsed.length) {
    lines.push("\n## Least Used (candidates for deprecation)\n");
    lines.push("| Component | Imports |");
    lines.push("|-----------|---------|");
    for (const [name, count] of report.leastUsed) {
      lines.push(`| \`${name}\` | ${count} |`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function formatJSON(report) {
  return JSON.stringify(report, null, 2);
}

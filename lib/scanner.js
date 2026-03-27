import { readFileSync } from "node:fs";

/**
 * Scan a single file for component imports and JSX usage.
 * Returns { dsImports: string[], customComponents: string[], rawImports: ImportInfo[] }
 */
export function scanFile(filePath, dsPackages) {
  const content = readFileSync(filePath, "utf8");
  const dsImports = [];
  const customComponents = [];
  const rawImports = [];

  for (const pkg of dsPackages) {
    const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `import\\s+\\{([^}]+)\\}\\s+from\\s+['"]${escaped}(?:\\/[^'"]*)?['"]`,
      "g"
    );
    let m;
    while ((m = re.exec(content)) !== null) {
      const names = m[1].split(",").map(n => n.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
      for (const name of names) {
        if (name[0] === name[0].toUpperCase() && /^[A-Z]/.test(name)) {
          dsImports.push(name);
          rawImports.push({ component: name, package: pkg, file: filePath });
        }
      }
    }
  }

  const defaultImportRe = /import\s+(\w+)\s+from\s+['"](\.\.?\/[^'"]+)['"]/g;
  let dm;
  while ((dm = defaultImportRe.exec(content)) !== null) {
    const name = dm[1];
    if (/^[A-Z]/.test(name)) {
      customComponents.push(name);
    }
  }

  const namedLocalRe = /import\s+\{([^}]+)\}\s+from\s+['"](\.\.?\/[^'"]+)['"]/g;
  let nm;
  while ((nm = namedLocalRe.exec(content)) !== null) {
    const names = nm[1].split(",").map(n => n.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    for (const name of names) {
      if (/^[A-Z]/.test(name) && !dsImports.includes(name)) {
        customComponents.push(name);
      }
    }
  }

  return { dsImports, customComponents, rawImports };
}

/**
 * Detect possible duplicates: local components with same name as DS components.
 */
export function findDuplicates(allDsComponents, allCustomComponents) {
  const dsSet = new Set(allDsComponents);
  return [...new Set(allCustomComponents)].filter(c => dsSet.has(c));
}

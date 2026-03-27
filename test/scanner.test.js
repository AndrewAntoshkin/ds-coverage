import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { scanFile, findDuplicates } from "../lib/scanner.js";

const TMP = join(import.meta.dirname, "__tmp_cov");

function write(name, content) {
  const p = join(TMP, name);
  writeFileSync(p, content);
  return p;
}

describe("scanFile", () => {
  before(() => mkdirSync(TMP, { recursive: true }));
  after(() => rmSync(TMP, { recursive: true, force: true }));

  it("detects DS named imports", () => {
    const f = write("a.tsx", `import { Button, Card } from '@acme/ui';\nimport { Icon } from '@acme/icons';`);
    const r = scanFile(f, ["@acme/ui", "@acme/icons"]);
    assert.deepEqual(r.dsImports.sort(), ["Button", "Card", "Icon"]);
  });

  it("ignores non-component imports (lowercase)", () => {
    const f = write("b.tsx", `import { useTheme, cx } from '@acme/ui';`);
    const r = scanFile(f, ["@acme/ui"]);
    assert.equal(r.dsImports.length, 0);
  });

  it("detects custom local components", () => {
    const f = write("c.tsx", `import MyButton from './MyButton';\nimport { LocalCard } from '../components/LocalCard';`);
    const r = scanFile(f, ["@acme/ui"]);
    assert.ok(r.customComponents.includes("MyButton"));
    assert.ok(r.customComponents.includes("LocalCard"));
  });

  it("handles deep package imports", () => {
    const f = write("d.tsx", `import { Tooltip } from '@acme/ui/tooltip';`);
    const r = scanFile(f, ["@acme/ui"]);
    assert.deepEqual(r.dsImports, ["Tooltip"]);
  });

  it("handles aliased imports", () => {
    const f = write("e.tsx", `import { Button as Btn } from '@acme/ui';`);
    const r = scanFile(f, ["@acme/ui"]);
    assert.deepEqual(r.dsImports, ["Button"]);
  });

});

describe("findDuplicates", () => {
  it("detects components with same name as DS components", () => {
    const dupes = findDuplicates(["Button", "Card", "Modal"], ["Button", "Dialog", "Modal"]);
    assert.deepEqual(dupes.sort(), ["Button", "Modal"]);
  });

  it("returns empty array when no duplicates", () => {
    const dupes = findDuplicates(["Button"], ["Dialog"]);
    assert.deepEqual(dupes, []);
  });
});

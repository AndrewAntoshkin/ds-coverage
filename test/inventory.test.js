import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { loadInventory } from "../lib/inventory.js";

const TMP = join(import.meta.dirname, "__tmp_inv");

describe("loadInventory", () => {
  before(() => mkdirSync(TMP, { recursive: true }));
  after(() => rmSync(TMP, { recursive: true, force: true }));

  it("loads array JSON", () => {
    const p = join(TMP, "arr.json");
    writeFileSync(p, JSON.stringify(["Button", "Card", "Modal"]));
    assert.deepEqual(loadInventory(p), ["Button", "Card", "Modal"]);
  });

  it("loads object JSON with components key", () => {
    const p = join(TMP, "obj.json");
    writeFileSync(p, JSON.stringify({ components: ["Button", "Card"] }));
    assert.deepEqual(loadInventory(p), ["Button", "Card"]);
  });

  it("loads JS-like file with exports", () => {
    const p = join(TMP, "index.js");
    writeFileSync(p, `export const Button = () => {};\nexport function Card() {}\nexport { Modal, Tooltip };`);
    const inv = loadInventory(p);
    assert.ok(inv.includes("Button"));
    assert.ok(inv.includes("Card"));
    assert.ok(inv.includes("Modal"));
    assert.ok(inv.includes("Tooltip"));
  });

  it("returns empty for missing file", () => {
    assert.deepEqual(loadInventory("/nonexistent"), []);
  });

  it("returns empty for null", () => {
    assert.deepEqual(loadInventory(null), []);
  });

});

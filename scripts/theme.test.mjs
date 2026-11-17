import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../src/theme.js", import.meta.url), "utf8");

function browser({ saved = null, dark = false, storageError } = {}) {
  const documentEvents = new Map();
  const selectEvents = new Map();
  const systemEvents = new Map();
  const warnings = [];
  const root = { dataset: {} };
  const colors = [{ content: "" }, { content: "" }];
  const select = { value: "", addEventListener: (name, callback) => selectEvents.set(name, callback) };
  const control = { hidden: true, querySelector: () => select };
  const system = { matches: dark, addEventListener: (name, callback) => systemEvents.set(name, callback) };
  const storage = {
    value: saved,
    getItem() { if (storageError) throw storageError; return this.value; },
    setItem(key, value) { if (storageError) throw storageError; this.value = value; },
  };
  runInNewContext(source, {
    document: {
      documentElement: root,
      querySelectorAll: () => colors,
      querySelector: () => control,
      addEventListener: (name, callback) => documentEvents.set(name, callback),
    },
    window: { localStorage: storage, matchMedia: () => system },
    console: { warn: (...args) => warnings.push(args) },
  });
  return {
    root, colors, control, select, storage, warnings,
    ready() { documentEvents.get("DOMContentLoaded")(); },
    choose(value) { select.value = value; selectEvents.get("change")(); },
    systemChanges(dark) { system.matches = dark; systemEvents.get("change")(); },
  };
}

test("saved appearance is restored before page controls initialize", () => {
  const page = browser({ saved: "dark" });
  assert.equal(page.root.dataset.theme, "dark");
  assert.equal(page.colors[0].content, "#0b1725");
  assert.equal(page.control.hidden, true);
  page.ready();
  assert.equal(page.select.value, "dark");
  assert.equal(page.control.hidden, false);
});

test("system changes apply by default without writing a preference", () => {
  const page = browser();
  assert.equal(page.root.dataset.theme, "system");
  assert.equal(page.colors[0].content, "#f1f7fc");
  page.systemChanges(true);
  assert.equal(page.colors[0].content, "#0b1725");
  assert.equal(page.storage.value, null);
});

test("manual choice persists, overrides the device, and can return to system", () => {
  const page = browser({ dark: true });
  page.ready();
  page.choose("light");
  assert.equal(page.storage.value, "light");
  assert.equal(page.colors[0].content, "#f1f7fc");
  page.systemChanges(true);
  assert.equal(page.colors[0].content, "#f1f7fc");
  page.choose("system");
  assert.equal(page.root.dataset.theme, "system");
  assert.equal(page.storage.value, "system");
  assert.equal(page.colors[0].content, "#0b1725");
});

test("blocked storage is reported without disabling the appearance control", () => {
  const page = browser({ storageError: new DOMException("Blocked", "SecurityError") });
  assert.equal(page.warnings.length, 1);
  page.ready();
  page.choose("dark");
  assert.equal(page.root.dataset.theme, "dark");
  assert.equal(page.warnings.length, 2);
});

test("invalid saved preferences fall back to the device setting with a warning", () => {
  const page = browser({ saved: "unexpected", dark: true });
  assert.equal(page.root.dataset.theme, "system");
  assert.equal(page.colors[0].content, "#0b1725");
  assert.equal(page.warnings.length, 1);
});

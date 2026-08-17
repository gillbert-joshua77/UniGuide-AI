#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";

const FRONTEND_DIR = join(import.meta.dirname, "..");

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      walk(full, files);
    } else if (/\.(css|jsx|tsx|js|ts)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const IGNORED_FILES = [
  "tokens.css",
  "theme.css",
  "color-lint.mjs",
  "index.css",
];

const SVG_ATTR_RE = /(?:stroke|fill)=["'][^"']*#/;
// Skip JS lines with dynamic color constants, fallback defaults, and color arrays
const JS_COLOR_SKIP_RE =
  /(?:COLOR_PALETTE|CATEGORY_COLORS|STATUS_COLORS|color:\s*["'](?:#|var\()|\|\|\s*["'](?:#|var\()|^\s*["']#[0-9a-fA-F]{3,8}["'])/;

let violations = 0;
const files = walk(join(FRONTEND_DIR, "src"));

for (const file of files) {
  const rel = relative(FRONTEND_DIR, file);
  if (IGNORED_FILES.some((f) => rel.endsWith(f))) continue;

  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  const isCSS = extname(file) === ".css";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("/*"))
      continue;

    // Skip SVG stroke/fill attributes (CSS vars don't work in JSX string attrs)
    if (SVG_ATTR_RE.test(line)) continue;

    // Skip JS color constant objects used dynamically
    if (JS_COLOR_SKIP_RE.test(line)) continue;

    // Skip CSS variable definitions (--var-name: ...)
    if (isCSS && /^\s*--/.test(line)) continue;

    // Skip lines that are only var() references
    if (
      /var\(--/.test(line) &&
      !/\b#[0-9a-fA-F]{3,8}\b/.test(
        line.replace(/var\(--[^)]+\)/g, "")
      )
    )
      continue;

    const hexMatches = line.matchAll(
      /(?:^|[\s;,:(\"'])#([0-9a-fA-F]{3,8})\b/g
    );
    for (const m of hexMatches) {
      const fullMatch = m[0];
      const idx = m.index;
      const before = line.slice(
        Math.max(0, idx - 20),
        idx + fullMatch.length
      );
      if (/var\(--[a-z0-9-]+$/.test(before.slice(0, -fullMatch.length)))
        continue;
      console.log(`${rel}:${i + 1}: hex #${m[1]}`);
      violations++;
    }

    const rgbaMatches = line.matchAll(/rgba?\(\s*\d+\s*,\s*\d+/g);
    for (const m of rgbaMatches) {
      const idx = m.index;
      const before = line.slice(Math.max(0, idx - 20), idx);
      if (/var\(--[a-z0-9-]+$/.test(before)) continue;
      console.log(`${rel}:${i + 1}: raw ${m[0].slice(0, 30)}...`);
      violations++;
    }
  }
}

if (violations === 0) {
  console.log("No hardcoded color violations found.");
  process.exit(0);
} else {
  console.log(`\n${violations} hardcoded color violation(s) found.`);
  process.exit(1);
}

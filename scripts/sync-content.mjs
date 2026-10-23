#!/usr/bin/env node
/**
 * Pulls the site's content from the editor repository: the user-facing pages of
 * `docs/public/` and the settings catalog `extensions/diode-settings/settings-schema.generated.ts`.
 * The editor repository stays the single source of truth (a PR that changes the API surface
 * updates API-COVERAGE.md in the same PR), this repository only owns layout and navigation.
 *
 * Editor checkout: $DIODE_DIR, else ./diode (CI), else ../diode (a sibling checkout).
 *
 * Each page gets frontmatter: the first `# heading` becomes `title`, `editUrl` points at the
 * source file. Links between synced pages become site links; links to other repository files
 * become GitHub links.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");
const REPO_URL = "https://github.com/diode-editor/diode";
const BRANCH = "main";

/** docs/public file → site slug (also the sidebar entry in astro.config.mjs). */
const PAGES = {
    "INSTALL.md": "getting-started/install",
    "FIRST-RUN.md": "getting-started/first-run",
    "DIFFERENCES.md": "getting-started/differences",
    "KEYBOARD.md": "getting-started/keyboard",
    "TERMINAL.md": "getting-started/terminal",
    "EXTENSIONS.md": "extensions/install",
    "API-COVERAGE.md": "extensions/api-coverage",
    "STATUS.md": "project/status",
    "PERFORMANCE.md": "project/performance",
};

/** Short sidebar labels where the page's own title is too long for the navigation. */
const SIDEBAR_LABELS = {
    "KEYBOARD.md": "Keyboard",
    "TERMINAL.md": "Terminal setup",
    "EXTENSIONS.md": "Installing extensions",
    "API-COVERAGE.md": "API coverage (for extension authors)",
};

/** Generated pages: wiped on every sync, ignored by git (.gitignore lists the same paths). */
const GENERATED_DIRS = ["getting-started", "extensions", "project"];

function findDiode() {
    const candidates = [process.env.DIODE_DIR, join(ROOT, "diode"), join(ROOT, "..", "diode")];
    for (const dir of candidates) {
        if (dir && existsSync(join(dir, "docs", "public"))) return resolve(dir);
    }
    throw new Error("diode checkout not found: set DIODE_DIR or clone it into ./diode");
}

const yamlString = (s) => JSON.stringify(s);

function rewriteLink(target, sourceFile) {
    if (/^(?:[a-z]+:|#|\/)/i.test(target)) return target;
    const [path, hash = ""] = target.split("#");
    const anchor = hash ? `#${hash}` : "";
    const repoPath = posix.normalize(posix.join("docs/public", path));
    const page = repoPath.startsWith("docs/public/") ? PAGES[repoPath.slice("docs/public/".length)] : undefined;
    if (page) {
        // Relative to the page's own URL (trailingSlash: always → one extra level).
        const from = posix.join("/", PAGES[sourceFile], "/");
        return `${posix.relative(from, posix.join("/", page))}/${anchor}`;
    }
    const kind = /\.[a-z0-9]+$/i.test(repoPath) ? "blob" : "tree";
    return `${REPO_URL}/${kind}/${BRANCH}/${repoPath}${anchor}`;
}

function convertPage(source, file) {
    const lines = source.split("\n");
    const h1 = lines.findIndex((line) => line.startsWith("# "));
    if (h1 === -1) throw new Error(`${file}: no "# title" heading`);
    const title = lines[h1].slice(2).trim();
    const body = [...lines.slice(0, h1), ...lines.slice(h1 + 1)].join("\n").replace(/^\s+/, "");
    // Inline links and reference definitions; images keep working the same way.
    const linked = body
        .replace(/(\]\()([^)\s]+)(\))/g, (_, open, target, close) => open + rewriteLink(target, file) + close)
        .replace(/^(\[[^\]]+\]:\s*)(\S+)/gm, (_, def, target) => def + rewriteLink(target, file));
    const frontmatter = [
        "---",
        `title: ${yamlString(title)}`,
        `editUrl: ${yamlString(`${REPO_URL}/edit/${BRANCH}/docs/public/${file}`)}`,
        ...(SIDEBAR_LABELS[file] ? ["sidebar:", `  label: ${yamlString(SIDEBAR_LABELS[file])}`] : []),
        "---",
        "",
    ].join("\n");
    return frontmatter + linked;
}

async function loadSettings(diode) {
    const file = join(diode, "extensions", "diode-settings", "settings-schema.generated.ts");
    // Plain data with a type annotation: Node strips the types on import.
    const { SETTINGS_SCHEMA } = await import(pathToFileURL(file).href);
    return SETTINGS_SCHEMA;
}

const diode = findDiode();
const docsDir = join(ROOT, "src", "content", "docs");
for (const generated of GENERATED_DIRS) rmSync(join(docsDir, generated), { recursive: true, force: true });

for (const [file, slug] of Object.entries(PAGES)) {
    const out = join(docsDir, `${slug}.md`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, convertPage(readFileSync(join(diode, "docs", "public", file), "utf8"), file));
}

const settings = await loadSettings(diode);
const dataDir = join(ROOT, "src", "data");
mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, "settings.json"), `${JSON.stringify(settings, null, 4)}\n`);

console.error(
    `[sync-content] ${Object.keys(PAGES).length} pages and ${settings.length} settings from ${diode}`,
);

// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// Served by GitHub Pages as a project site of diode-editor/docs, next to the landing page
// (diode-editor.github.io) and the marketplace (/marketplace/).
export default defineConfig({
    site: "https://diode-editor.github.io",
    base: "/docs",
    trailingSlash: "always",
    // Old slugs from the first version of the site; the content moved or merged.
    redirects: {
        "/getting-started/tmux/": "/docs/getting-started/terminal/#tmux",
        "/reference/api-coverage/": "/docs/extensions/api-coverage/",
        "/project/benchmarks/": "/docs/project/performance/",
        "/project/bench-open/": "/docs/project/performance/",
    },
    integrations: [
        starlight({
            title: "diode docs",
            description: "Documentation for diode, a non-modal editor for the terminal.",
            favicon: "/favicon.svg",
            customCss: ["./src/styles/diode.css"],
            components: {
                Header: "./src/components/Header.astro",
                PageFrame: "./src/components/PageFrame.astro",
                TwoColumnContent: "./src/components/TwoColumnContent.astro",
                Sidebar: "./src/components/Sidebar.astro",
                MobileMenuFooter: "./src/components/MobileMenuFooter.astro",
                ThemeProvider: "./src/components/ThemeProvider.astro",
                ThemeSelect: "./src/components/ThemeSelect.astro",
            },
            // Pages come from docs/public of the editor repository (scripts/sync-content.mjs
            // stamps editUrl into each); pages written here link to this repository.
            editLink: { baseUrl: "https://github.com/diode-editor/docs/edit/main/" },
            lastUpdated: false,
            sidebar: [
                { label: "Overview", link: "/" },
                {
                    label: "Getting started",
                    items: [
                        "getting-started/install",
                        "getting-started/first-run",
                        "getting-started/keyboard",
                        "getting-started/terminal",
                    ],
                },
                {
                    label: "Extensions",
                    items: ["extensions/install", "extensions/api-coverage"],
                },
                {
                    label: "Reference",
                    items: ["reference/settings"],
                },
                {
                    label: "Project",
                    items: ["project/roadmap", "project/performance"],
                },
            ],
        }),
    ],
});

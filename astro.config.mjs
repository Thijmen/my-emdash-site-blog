import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2, sandbox } from "@emdash-cms/cloudflare";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import webhookNotifier from "@emdash-cms/plugin-webhook-notifier";
import { execSync } from "child_process";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

// Cloudflare Pages sets CF_PAGES_COMMIT_SHA automatically.
// In local dev and other CI, fall back to reading the git hash directly.
const buildId = (() => {
	if (process.env.CF_PAGES_COMMIT_SHA) {
		return process.env.CF_PAGES_COMMIT_SHA.slice(0, 7);
	}
	try {
		return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
	} catch {
		return "dev";
	}
})();

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			plugins: [formsPlugin()],
			sandboxed: [webhookNotifier],
			sandboxRunner: sandbox(),
			marketplace: "https://marketplace.emdashcms.com",
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-sans",
			weights: [400, 500, 600, 700],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
		{
			provider: fontProviders.google(),
			name: "Bricolage Grotesque",
			cssVariable: "--font-display",
			weights: [400, 500, 600, 700, 800],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "Newsreader",
			cssVariable: "--font-serif",
			weights: [400, 500],
			fallbacks: ["serif"],
		},
	],
	devToolbar: { enabled: false },
	vite: {
		define: {
			__SITE_BUILD_ID__: JSON.stringify(buildId),
		},
	},
});

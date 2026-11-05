// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubPagesBuild = process.env["GITHUB_PAGES"] === "true";

export default defineConfig({
  vite: {
    base: isGitHubPagesBuild ? "/nemo-student-life/" : "/",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // GitHub Pages cannot run SSR. Export the public landing and auth pages as static HTML;
    // the client router handles authenticated views after loading the 404 fallback.
    prerender: isGitHubPagesBuild
      ? {
          enabled: true,
          autoStaticPathsDiscovery: false,
          failOnError: true,
          pages: [
            { path: "/", prerender: { enabled: true, outputPath: "/index.html" } },
            { path: "/auth", prerender: { enabled: true, outputPath: "/auth/index.html" } },
          ],
        }
      : { enabled: false },
  },
});

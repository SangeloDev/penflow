import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { CommitHashPlugin } from "vite-plugin-commit-hash";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    basicSsl(),
    sveltekit(),
    tailwindcss(),
    CommitHashPlugin({ noPrefix: false, noVirtual: false }),
    paraglideVitePlugin({
      project: "./penflow.inglang",
      outdir: "./src/lib/paraglide",
      strategy: ["custom-localStorage", "preferredLanguage", "baseLocale"],
    }),
    SvelteKitPWA({
      registerType: "prompt",
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: "Penflow",
        short_name: "Penflow",
        description: "A simple, clean, distraction-free Markdown Editor",
        theme_color: "#FF9E07",
        icons: [
          {
            src: "assets/icon/low-res.webp",
            sizes: "48x48",
            type: "image/webp",
          },
          {
            src: "assets/icon/hd_hi.ico",
            sizes: "64x64 72x72 96x96 128x128 256x256",
          },
          {
            src: "assets/icon/hd_hi.svg",
            sizes: "any",
          },
        ],
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 6000000,
        globPatterns: ["client/**/*.{js,css,ico,png,svg,webp,woff,woff2}"],

        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: false,
        suppressWarnings: true,
        navigateFallback: "/",
        navigateFallbackAllowlist: [/^\/$/],
        type: "module",
      },
    }),
    nodePolyfills(),
  ],
});

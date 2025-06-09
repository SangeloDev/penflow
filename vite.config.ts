import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    sveltekit(),
    tailwindcss(),
    paraglideVitePlugin({
      project: "./project.inglang",
      outdir: "./src/lib/paraglide",
      strategy: ["url", "cookie", "baseLocale"],
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
  ],
});

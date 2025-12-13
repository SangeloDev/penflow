# GEMINI.md

## Project Overview

This project is a simple, clean, and distraction-free Markdown Editor Progressive Web App (PWA) named **penflow**. It is built with [Svelte](https://svelte.dev/) and [Tailwind CSS](https://tailwindcss.com/), and uses [Vite](https://vitejs.dev/) for the build tooling. The application is designed to be offline-first, and is a statically generated site. It also includes internationalization (i18n) support using [paraglide-js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).

The core functionality of the editor is powered by [CodeMirror](https://codemirror.net/), and it supports Github-Flavored Markdown. The application has a minimal design and is focused on providing a distraction-free writing experience.

## Building and Running

The project uses `pnpm` as the package manager. The following commands are used for building, running, and testing the project:

- **Install dependencies:**
  ```bash
  pnpm i
  ```
- **Run the development server:**
  ```bash
  pnpm dev
  ```
- **Build the application:**
  ```bash
  pnpm build
  ```
- **Preview the production build:**
  ```bash
  pnpm preview
  ```
- **Type-check the code:**
  ```bash
  pnpm check
  ```
- **Format the code:**
  ```bash
  pnpm format
  ```
- **Lint the code:**
  ```bash
  pnpm lint
  ```

## Development Conventions

- **Coding Style:** The project uses [Prettier](https://prettier.io/) for code formatting and [ESLint](https://eslint.org/) for linting. The configuration for these tools can be found in `.prettierrc` and `eslint.config.js` respectively.
- **Testing:** There are no explicit testing frameworks configured in the `package.json` file. However, the project uses `svelte-check` for static type checking.
- **Internationalization:** The project uses `inlang` and `paraglide-js` for i18n. The language files are located in the `messages` directory.
- **PWA:** The application is a PWA, and the configuration for the service worker and manifest file can be found in `vite.config.ts`.

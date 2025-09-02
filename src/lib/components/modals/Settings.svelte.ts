import { browser } from "$app/environment";
import type { Options } from "$lib/types/settings";

const STORAGE_KEY = "penflow.settings";

const defaults: Options = {
  version: 1,
  general: { visited: false, s3AttachmentEndpoint: "" },
};

// Reactive shared state for the whole app
export const settings = $state<Options>(structuredClone(defaults));

// Load from localStorage on client only
if (browser) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<Options>;
      // shallow merge onto defaults to keep new keys sane
      Object.assign(settings, {
        ...defaults,
        ...parsed,
        general: { ...defaults.general, ...parsed.general },
      });
    } catch {
      // ignore bad JSON; keep defaults
    }
  }
}

// Optional helper updaters for ergonomics
export function setS3Endpoint(value: string) {
  settings.general.s3AttachmentEndpoint = value;
}

import { writable } from "svelte/store";
import type { HotkeyContext } from "$lib/hotkeys";

export const hotkeyContext = writable<HotkeyContext | undefined>(undefined);

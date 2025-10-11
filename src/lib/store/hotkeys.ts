import { writable } from "svelte/store";
import type { HotkeyContext } from "$lib/utils/hotkeys";

export const hotkeyContext = writable<HotkeyContext | undefined>(undefined);

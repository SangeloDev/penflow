import emojiMetadata from "$lib/data/emoji.json";

/**
 * Safely converts codepoint array to emoji string
 */
function codepointsToEmoji(codepoints: number[]): string {
  try {
    return String.fromCodePoint(...codepoints);
  } catch (err) {
    console.warn("Invalid codepoints:", codepoints, err);
    return "";
  }
}

/**
 * Build shortcode definitions from Google Noto emoji metadata
 */
function buildEmojiDefinitions(): Record<string, string> {
  const defs: Record<string, string> = {};

  try {
    if (!Array.isArray(emojiMetadata)) {
      console.error("Emoji metadata is not an array");
      return defs;
    }

    for (const group of emojiMetadata) {
      if (!group?.emoji || !Array.isArray(group.emoji)) {
        continue;
      }

      for (const emojiItem of group.emoji) {
        if (!emojiItem?.base || !Array.isArray(emojiItem.base)) {
          continue;
        }

        const emojiChar = codepointsToEmoji(emojiItem.base);
        if (!emojiChar) continue;

        // Add shortcodes
        if (Array.isArray(emojiItem.shortcodes)) {
          for (const shortcode of emojiItem.shortcodes) {
            if (typeof shortcode === "string" && shortcode) {
              // Remove leading/trailing colons if present
              const cleanShortcode = shortcode.replace(/^:+|:+$/g, "");
              defs[cleanShortcode] = emojiChar;
            }
          }
        }
      }
    }

    console.log(`Loaded ${Object.keys(defs).length} emoji shortcodes`);
  } catch (err) {
    console.error("Failed to build emoji definitions:", err);
  }

  return defs;
}

/**
 * Build emoticon shortcuts from Google Noto emoji metadata
 */
function buildEmojiShortcuts(): Record<string, string[]> {
  const shortcuts: Record<string, string[]> = {};

  try {
    if (!Array.isArray(emojiMetadata)) {
      return shortcuts;
    }

    for (const group of emojiMetadata) {
      if (!group?.emoji || !Array.isArray(group.emoji)) {
        continue;
      }

      for (const emojiItem of group.emoji) {
        if (
          !emojiItem?.emoticons ||
          !Array.isArray(emojiItem.emoticons) ||
          !emojiItem?.shortcodes ||
          !Array.isArray(emojiItem.shortcodes)
        ) {
          continue;
        }

        const primaryShortcode = emojiItem.shortcodes[0];
        if (!primaryShortcode) continue;

        const cleanShortcode = primaryShortcode.replace(/^:+|:+$/g, "");
        const validEmoticons = emojiItem.emoticons.filter((e: unknown) => typeof e === "string" && e);

        if (validEmoticons.length > 0) {
          shortcuts[cleanShortcode] = validEmoticons;
        }
      }
    }

    console.log(`Loaded ${Object.keys(shortcuts).length} emoji shortcuts`);
  } catch (err) {
    console.error("Failed to build emoji shortcuts:", err);
  }

  return shortcuts;
}

// export variables
export const emojiDefs = buildEmojiDefinitions();
export const emojiShortcuts = buildEmojiShortcuts();

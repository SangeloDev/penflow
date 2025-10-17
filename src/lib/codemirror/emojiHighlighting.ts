import { type MarkdownConfig, InlineContext } from "@lezer/markdown";
import { styleTags } from "@lezer/highlight";
import { Tag, tags as t } from "@lezer/highlight";
import emojiList from "../data/emoji.json";

// Define your custom emoji tag
export const emoji = Tag.define(t.brace);

// Build valid shortcodes set
const validShortcodes = new Set<string>();
emojiList.forEach((group) => {
  group.emoji.forEach((e) => {
    if (e.shortcodes) {
      e.shortcodes.forEach((shortcode) => {
        validShortcodes.add(shortcode.startsWith(":") ? shortcode : `:${shortcode}:`);
      });
    }
  });
});

export const EmojiExtension: MarkdownConfig = {
  defineNodes: ["Emoji"],
  props: [
    styleTags({
      Emoji: emoji,
    }),
  ],
  parseInline: [
    {
      name: "Emoji",
      parse(cx: InlineContext, next: number, pos: number) {
        // Only start parsing if we encounter a colon
        if (next !== 58 /* : */) return -1;

        // Try to match :shortcode: pattern
        const match = /^:[\w+-]+:/.exec(cx.text.slice(pos - cx.offset));

        if (match && validShortcodes.has(match[0])) {
          return cx.addElement(cx.elt("Emoji", pos, pos + match[0].length));
        }

        return -1;
      },
    },
  ],
};

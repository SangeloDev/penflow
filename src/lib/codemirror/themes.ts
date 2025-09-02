import { tags as t } from "@lezer/highlight";
import { createTheme } from "thememirror";

// codemirror themes
export const tomorrow = createTheme({
  variant: "light",
  settings: {
    background: "#FFFFFF",
    foreground: "#4D4D4C",
    caret: "#AEAFAD",
    selection: "rgba(223, 113, 38, 0.25)",
    gutterBackground: "#FFFFFF",
    gutterForeground: "#4D4D4C80",
    lineHighlight: "#EFEFEF",
  },
  styles: [
    {
      tag: t.comment,
      color: "#8E908C",
    },
    {
      tag: [t.variableName, t.self, t.propertyName, t.attributeName, t.regexp],
      color: "#C82829",
    },
    {
      tag: [t.number, t.bool, t.null],
      color: "#F5871F",
    },
    {
      tag: [t.className, t.typeName, t.definition(t.typeName)],
      color: "#C99E00",
    },
    {
      tag: [t.string, t.special(t.brace)],
      color: "#718C00",
    },
    {
      tag: t.operator,
      color: "#3E999F",
    },
    {
      tag: [t.definition(t.propertyName), t.function(t.variableName)],
      color: "#4271AE",
    },
    {
      tag: t.keyword,
      color: "#8959A8",
    },
    {
      tag: t.derefOperator,
      color: "#4D4D4C",
    },

    // markdown styling
    { tag: t.heading1, color: "#4271AE", fontWeight: "bold" },
    { tag: t.heading2, color: "#4271AE", fontWeight: "bold" },
    { tag: t.heading3, color: "#4271AE", fontWeight: "bold" },
    { tag: t.heading4, color: "#4271AE", fontWeight: "bold" },
    { tag: t.heading5, color: "#4271AE", fontWeight: "bold" },
    { tag: t.heading6, color: "#4271AE", fontWeight: "bold" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.strong, fontWeight: "bold" },
    { tag: t.strikethrough, textDecoration: "line-through" },
    { tag: t.quote, fontStyle: "italic" },
    { tag: t.link, color: "#4271AE" },
  ],
});

export const coolGlow = createTheme({
  variant: "dark",
  settings: {
    background: "#0f172a",
    foreground: "#E0E0E0",
    caret: "#FFFFFFA6",
    selection: "rgba(223, 113, 38, 0.35)",
    gutterBackground: "#0f172a",
    gutterForeground: "#E0E0E090",
    lineHighlight: "#FFFFFF0F",
  },
  styles: [
    {
      tag: t.comment,
      color: "#AEAEAE",
    },
    {
      tag: [t.string, t.special(t.brace), t.regexp],
      color: "#8DFF8E",
    },
    {
      tag: [
        t.className,
        t.definition(t.propertyName),
        t.function(t.variableName),
        t.function(t.definition(t.variableName)),
        t.definition(t.typeName),
      ],
      color: "#A3EBFF",
    },
    {
      tag: [t.number, t.bool, t.null],
      color: "#62E9BD",
    },
    {
      tag: [t.keyword, t.operator],
      color: "#2BF1DC",
    },
    {
      tag: [t.definitionKeyword, t.modifier],
      color: "#F8FBB1",
    },
    {
      tag: [t.variableName, t.self],
      color: "#B683CA",
    },
    {
      tag: [t.angleBracket, t.tagName, t.typeName, t.propertyName],
      color: "#60A4F1",
    },
    {
      tag: t.derefOperator,
      color: "#E0E0E0",
    },
    {
      tag: t.attributeName,
      color: "#7BACCA",
    },

    // markdown styling
    { tag: t.heading1, color: "#60A4F1", fontWeight: "bold" },
    { tag: t.heading2, color: "#60A4F1", fontWeight: "bold" },
    { tag: t.heading3, color: "#60A4F1", fontWeight: "bold" },
    { tag: t.heading4, color: "#60A4F1", fontWeight: "bold" },
    { tag: t.heading5, color: "#60A4F1", fontWeight: "bold" },
    { tag: t.heading6, color: "#60A4F1", fontWeight: "bold" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.strong, fontWeight: "bold" },
    { tag: t.strikethrough, textDecoration: "line-through" },
    { tag: t.quote, fontStyle: "italic" },
    { tag: t.link, color: "#60A4F1" },
  ],
});

export const lightThemes = [tomorrow];
export const darkThemes = [coolGlow];

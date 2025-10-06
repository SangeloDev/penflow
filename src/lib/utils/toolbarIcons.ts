import { Bold, Code, Italic, Link, List, ListOrdered, Quote, Image, Heading, Table, CheckSquare } from "lucide-svelte";

export const iconMap: Record<string, any> = {
  bold: Bold,
  italic: Italic,
  heading: Heading,
  orderedList: ListOrdered,
  list: List,
  checklist: CheckSquare,
  link: Link,
  quote: Quote,
  table: Table,
  image: Image,
  code: Code,
};

export function getIcon(itemId: string): any | undefined {
  return iconMap[itemId];
}

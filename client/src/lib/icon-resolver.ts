import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconCache = new Map<string, LucideIcon>();

export function getIcon(iconName: string): LucideIcon {
  if (iconCache.has(iconName)) return iconCache.get(iconName)!;
  const icon = (LucideIcons as Record<string, any>)[iconName];
  if (icon && (typeof icon === "function" || (typeof icon === "object" && icon.render))) {
    iconCache.set(iconName, icon as LucideIcon);
    return icon as LucideIcon;
  }
  return LucideIcons.CircleHelp as LucideIcon;
}

export function getAllIconNames(): string[] {
  return Object.keys(LucideIcons).filter(
    (key) => {
      if (key === "default" || key === "createLucideIcon" || key === "icons" || key.startsWith("Lucide")) return false;
      if (key[0] !== key[0].toUpperCase()) return false;
      const val = (LucideIcons as Record<string, any>)[key];
      return typeof val === "function" || (typeof val === "object" && val !== null && val.render);
    }
  );
}

export function searchIcons(query: string, limit = 60): string[] {
  const q = query.toLowerCase();
  if (!q) return getAllIconNames().slice(0, limit);
  return getAllIconNames()
    .filter((name) => name.toLowerCase().includes(q))
    .slice(0, limit);
}

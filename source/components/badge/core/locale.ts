import type { BadgeLocaleText } from "./types";

export const defaultBadgeText: BadgeLocaleText = {
  remove: (label: string) => `Remove ${label}`,
  moreThan: (value: string) => `more than ${value}`,
};

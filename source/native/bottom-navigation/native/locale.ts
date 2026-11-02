export interface BottomNavigationLocaleText {
  /** Spoken after a label with a numeric badge, e.g. "Inbox, 3 new". `{count}` is replaced. */
  badgeCount: string;
  /** Spoken after a label with a dot badge. */
  badgeDot: string;
}

export const defaultBottomNavigationText: BottomNavigationLocaleText = {
  badgeCount: "{count} new",
  badgeDot: "new",
};

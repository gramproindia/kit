import type { BreadcrumbLocaleText } from "./types";

/** Built-in strings. Shared by the web and native breadcrumbs, so they never drift. */
export const defaultBreadcrumbText: BreadcrumbLocaleText = {
  label: "Breadcrumb",
  showMore: (count) => `Show ${count} more`,
};

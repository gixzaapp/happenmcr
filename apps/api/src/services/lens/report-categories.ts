export const LENS_REPORT_CATEGORIES = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "copyright", label: "Copyright / not their photo" },
  { value: "wrong_location", label: "Wrong location" },
  { value: "spam", label: "Spam or misleading" },
  { value: "other", label: "Other" },
] as const;

export type LensReportCategory = (typeof LENS_REPORT_CATEGORIES)[number]["value"];

const ALLOWED = new Set<string>(LENS_REPORT_CATEGORIES.map((c) => c.value));

export function isLensReportCategory(value: string): value is LensReportCategory {
  return ALLOWED.has(value);
}

export function lensReportCategoryLabel(value: LensReportCategory): string {
  return LENS_REPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2022-07" → "Jul 2022" */
export function formatMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return `${MONTHS[mo - 1]} ${y}`;
}

/** Same month → "Jul 2024"; open end → "Jul 2022 – Present"; otherwise "Jul 2022 – May 2026". */
export function formatRange(start: string, end?: string): string {
  if (!end) return `${formatMonth(start)} – Present`;
  if (start === end) return formatMonth(start);
  return `${formatMonth(start)} – ${formatMonth(end)}`;
}

/** Newest first by start month, then by end. */
export function byNewest<T extends { start: string; end?: string }>(a: T, b: T): number {
  return b.start.localeCompare(a.start) || (b.end ?? "9999").localeCompare(a.end ?? "9999");
}

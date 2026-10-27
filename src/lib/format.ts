const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrExact = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

/** ₹4,999 (whole rupees) or ₹4,999.50 when there are paise. Amounts are integer paise (spec §1.2). */
export function formatPaise(paise: number): string {
  return paise % 100 === 0 ? inr.format(paise / 100) : inrExact.format(paise / 100);
}

/** "4999.50" → 499950; empty → null; invalid → NaN. */
export function rupeesToPaise(value: string): number | null {
  const v = value.trim().replace(/,/g, "");
  if (!v) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return Number.NaN;
  return Math.round(Number(v) * 100);
}

export const paiseToRupees = (paise: number | null) => (paise === null ? "" : (paise / 100).toFixed(paise % 100 === 0 ? 0 : 2));

/** 3725 s → "1 h 2 min"; 90 → "2 min"; 0 → "—". */
export function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const IST = "Asia/Kolkata";
const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: IST });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: IST });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

/** UTC ISO → "YYYY-MM-DDTHH:mm" in IST for <input type="datetime-local">. */
export function toIstInput(iso: string | null): string {
  if (!iso) return "";
  const shifted = new Date(new Date(iso).getTime() + 330 * 60_000);
  return shifted.toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:mm" entered in IST → ISO with offset; empty → null. */
export const fromIstInput = (value: string) => (value ? `${value}:00+05:30` : null);

export const levelLabel: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  ALL_LEVELS: "All levels",
};

export const languageLabel = (code: string) => ({ en: "English", hi: "Hindi", mr: "Marathi" })[code] ?? code;

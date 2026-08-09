import { flagFor } from "@/lib/countries";

/**
 * Renders a country/region marker consistently across the app.
 * Countries render their flag mark; regions without a flag (Africa, Asia)
 * render their two-letter initials as plain text — identical to how flag
 * marks render (on Windows, flag emoji appear as plain two-letter codes too).
 */
export default function CountryFlag({ name, className }: { name: string; className?: string }) {
  const mark = flagFor(name);
  if (!mark) return null;
  return (
    <span aria-label={name} className={className}>
      {mark}
    </span>
  );
}

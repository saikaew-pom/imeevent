import { energyClass } from "@/lib/format";

export function EnergyBadge({
  energy,
  label,
}: {
  energy: number;
  label: string;
}) {
  return (
    <span className={`chip ${energyClass(energy)}`} style={{ borderColor: "currentColor" }}>
      <span style={{ opacity: 0.7 }}>◆</span>
      {label}
    </span>
  );
}

export function EnergyDots({ energy }: { energy: number }) {
  return (
    <span className="inline-flex gap-[2px] items-end" aria-label={`energy ${energy}/10`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const on = energy / 2 > i;
        return (
          <span
            key={i}
            style={{
              width: 3,
              height: 5 + i * 2,
              borderRadius: 1,
              background: on ? "var(--gold-bright)" : "var(--border)",
            }}
          />
        );
      })}
    </span>
  );
}

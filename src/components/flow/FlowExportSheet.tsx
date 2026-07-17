import { Beat } from "@/data/runOfShow";
import { Act, findAct } from "@/data/acts";
import { EnergyCurve, CurvePoint } from "@/components/EnergyCurve";
import { liveBeatEnergy } from "@/lib/programEnergy";
import { addMinutesToTime } from "@/lib/format";

// Print-only Event Flow summary: energy curve + one card per beat (time
// range, show name, feature image, description). Rendered off-screen (see
// flow/page.tsx) purely as the capture target for exportElementToPdf — the
// on-screen planner/client views stay interactive-control-heavy, which
// doesn't belong in an exported PDF.
export function FlowExportSheet({
  projectName,
  headerMeta,
  program,
  customActs,
}: {
  projectName: string;
  headerMeta: string;
  program: Beat[];
  customActs: Act[];
}) {
  const isMultiDay = program.some((b) => (b.day ?? 1) > 1);
  const dayNums = Array.from(new Set(program.map((b) => b.day ?? 1))).sort((a, b) => a - b);

  // Mirrors the page's own multi-day rendering (flow/page.tsx): a single
  // combined curve when there's one day, but one curve per day when
  // multi-day — the beat array is grouped by ascending day (see
  // addProgramBeat in useDeck.ts), so a single curve spanning all days would
  // draw a misleading line straight from the last beat of one day to the
  // first beat of the next.
  const curvePoints = (beats: Beat[]): CurvePoint[] =>
    beats.map((b) => ({
      label: b.time,
      sublabel: b.segment,
      energy: liveBeatEnergy(b, customActs),
      highlight: Boolean(b.peak),
    }));

  const beatCard = (b: Beat) => {
    const firstGalleryItem = b.gallery?.[0];
    const thumbSrc =
      b.media?.photo ??
      (firstGalleryItem
        ? firstGalleryItem.type === "image"
          ? firstGalleryItem.src
          : firstGalleryItem.poster
        : undefined) ??
      (b.linkedActs ?? []).map((id) => findAct(id, customActs)).find((a) => a?.photo)?.photo;

    return (
      <div
        key={b.id}
        data-export-block
        className="flex gap-3.5 px-4 py-3.5 border-b hairline"
      >
        <div className="w-[90px] shrink-0">
          <div className="text-[15px] font-semibold">
            {b.time}–{addMinutesToTime(b.time, b.durationMin)}
          </div>
          <div className="text-[10px] text-[var(--text-faint)] mt-0.5">
            {b.durationMin} min
          </div>
        </div>
        {thumbSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt=""
            className="w-16 h-16 object-cover rounded-md shrink-0 border hairline"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold">{b.segment}</div>
          <div className="text-[11px] text-[var(--text-faint)] mt-0.5">{b.location}</div>
          {b.what && (
            <div className="text-[12px] text-[var(--text-dim)] mt-1 leading-relaxed">
              {b.what}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-[820px] px-7 py-7" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="mb-4" data-export-block>
        <div className="text-[22px] font-bold">{projectName}</div>
        <div className="text-[12px] text-[var(--text-faint)] mt-0.5">
          Event Flow — run of show{headerMeta ? ` · ${headerMeta}` : ""}
        </div>
      </div>

      {!isMultiDay && (
        <div className="mb-5" data-export-block>
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-faint)] mb-2">
            Energy across the night
          </div>
          <EnergyCurve points={curvePoints(program)} height={200} compact />
        </div>
      )}

      {isMultiDay
        ? dayNums.map((day) => {
            const dayBeats = program.filter((b) => (b.day ?? 1) === day);
            return (
              <div key={day} className="mb-5">
                {/* Day heading + its curve are one block so a break can't
                    orphan the heading from the curve it labels. The day
                    wrapper itself is deliberately NOT a block — it holds a
                    whole day of beats and would never fit on one page. */}
                <div data-export-block>
                  <div className="text-[13px] font-semibold gold-text px-4 py-1.5">
                    Day {day}
                  </div>
                  <div className="mb-2">
                    <EnergyCurve points={curvePoints(dayBeats)} height={160} compact />
                  </div>
                </div>
                <div className="rounded-[8px] border hairline">
                  {dayBeats.map(beatCard)}
                </div>
              </div>
            );
          })
        : (
            <div className="rounded-[8px] border hairline">
              {program.map(beatCard)}
            </div>
          )}
    </div>
  );
}

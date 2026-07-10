// Tappable chips from AssistantTurn.quickReplies. Slot stage lays them out as a
// grid (mockup slot card). Chips are real buttons → keyboard + screen-reader ok.
// A reply may be `disabled` (e.g. a full/closed slot): render it visible but
// inert, with the reason carried in its label suffix (WCAG 1.4.1 — not color-only).
export default function QuickReplies({ replies, stage, disabled, onPick }) {
  if (!replies?.length) return null;
  const isSlots = stage === 'select_slot';
  return (
    <div className={`chips ${isSlots ? 'chips--grid' : ''}`} role="group" aria-label="Suggested replies">
      {replies.map((r, i) => {
        const off = !!r.disabled;
        return (
          <button
            key={r.value || `${r.label}-${i}`}
            type="button"
            className={`chip ${off ? 'chip--off' : ''}`}
            disabled={disabled || off}
            aria-disabled={off || undefined}
            onClick={() => onPick(r.value)}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

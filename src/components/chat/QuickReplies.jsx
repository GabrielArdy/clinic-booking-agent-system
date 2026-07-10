// Tappable chips from AssistantTurn.quickReplies. Slot stage lays them out as a
// grid (mockup slot card). Chips are real buttons → keyboard + screen-reader ok.
export default function QuickReplies({ replies, stage, disabled, onPick }) {
  if (!replies?.length) return null;
  const isSlots = stage === 'select_slot';
  return (
    <div className={`chips ${isSlots ? 'chips--grid' : ''}`} role="group" aria-label="Suggested replies">
      {replies.map((r) => (
        <button
          key={r.value}
          type="button"
          className="chip"
          disabled={disabled}
          onClick={() => onPick(r.value)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

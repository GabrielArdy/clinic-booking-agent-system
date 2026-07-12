import { useChat } from '../../hooks/useChat';
import { getLiveChat, clearLiveChat } from '../../api/client';
import ProgressStepper from './ProgressStepper';
import MessageList from './MessageList';
import QuickReplies from './QuickReplies';
import Composer from './Composer';
import ConfirmationCard from './ConfirmationCard';
import LiveChatPanel from './LiveChatPanel';
import { IconBrand, IconWarning, IconMinimize } from '../icons';

// Booking flow shows the stepper; purpose picker + check/cancel flow do not
// (a lookup isn't a booking — a progress bar there would mislead).
const BOOKING_STAGES = new Set([
  'select_specialty', 'select_doctor', 'select_date', 'select_slot',
  'collect_patient_name', 'collect_patient_phone', 'confirm_booking', 'booking_complete',
]);
// Terminal stages: any next message restarts at select_purpose.
const TERMINAL_STAGES = new Set([
  'booking_complete', 'cancellation_complete', 'cancelled', 'handoff_pending',
]);
// Which entity summary card (if any) to show for a stage.
const CARD_MODE = {
  confirm_booking: 'review',
  booking_complete: 'done',
  check_result: 'lookup',
  confirm_cancellation: 'lookup',
  cancellation_complete: 'cancelled',
};

export default function ChatWidget({ onClose }) {
  const { messages, turn, pending, error, ready, send, restart } = useChat();

  // Handoff: once the bot returns `liveChat` (or a prior one is still stored for
  // a resumed session), leave the REST bot loop for the WebSocket live chat.
  const liveChat = turn?.liveChat ?? getLiveChat();
  if (liveChat) {
    return (
      <LiveChatPanel
        payload={liveChat}
        onMinimize={onClose}                                  // keep the session; resumes on reopen
        onEnd={() => { clearLiveChat(); restart(); }}         // drop it, back to a fresh bot
      />
    );
  }

  const stage = turn?.stage;
  const entities = turn?.collectedEntities;
  const isTerminal = TERMINAL_STAGES.has(stage);
  const showStepper = BOOKING_STAGES.has(stage);
  const cardMode = CARD_MODE[stage];
  const cardStatus = cardMode === 'cancelled' ? 'Cancelled'
    : (cardMode === 'lookup' ? 'Active' : undefined);

  const endLabel = stage === 'booking_complete' ? 'Book another'
    : stage === 'handoff_pending' ? 'Start over' : 'Start again';

  return (
    <section className="chat" aria-label="Book an appointment">
      <header className="chat__header">
        <div className="chat__avatar" aria-hidden="true"><IconBrand /></div>
        <div className="chat__id">
          <strong>City Care Clinic</strong>
          <span className="chat__status">Typically replies instantly</span>
        </div>
        {onClose && (
          <button type="button" className="chat__min" onClick={onClose} aria-label="Minimize chat">
            <IconMinimize aria-hidden="true" />
          </button>
        )}
      </header>

      {showStepper && <ProgressStepper stage={stage} />}

      <MessageList messages={messages} pending={pending} />

      {/* Domain notes from the turn (e.g. "That slot is no longer available"). */}
      {turn?.errors?.length > 0 && (
        <div className="chat__notes" role="status">
          {turn.errors.map((e, i) => <p key={i} className="chat__note"><IconWarning aria-hidden="true" /> {e}</p>)}
        </div>
      )}

      {/* Transport-level errors (network / rate limit) with a retry. */}
      {error && (
        <div className="chat__error" role="alert">
          <span>{error.message}</span>
          {!pending && ready && (
            <button className="btn btn-ghost" onClick={() => send('')}>Retry</button>
          )}
        </div>
      )}

      {cardMode && (
        <ConfirmationCard entities={entities} mode={cardMode} status={cardStatus} />
      )}

      {!isTerminal && (
        <QuickReplies
          replies={turn?.quickReplies}
          stage={stage}
          disabled={pending}
          onPick={send}
        />
      )}

      {isTerminal && (
        <div className="chat__end">
          <button className="btn btn-primary" onClick={restart}>{endLabel}</button>
        </div>
      )}

      {/* Free text stays available through the whole flow (contract §3). */}
      {!isTerminal && (
        <Composer disabled={pending || !ready} onSend={send} />
      )}
    </section>
  );
}

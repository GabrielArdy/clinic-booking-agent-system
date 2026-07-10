import { useChat } from '../../hooks/useChat';
import ProgressStepper from './ProgressStepper';
import MessageList from './MessageList';
import QuickReplies from './QuickReplies';
import Composer from './Composer';
import ConfirmationCard from './ConfirmationCard';

export default function ChatWidget() {
  const { messages, turn, pending, error, ready, send, restart } = useChat();

  const stage = turn?.stage;
  const entities = turn?.collectedEntities;
  const isConfirm = stage === 'confirm_booking';
  const isComplete = stage === 'booking_complete';
  const isCancelled = stage === 'cancelled';
  const inFlow = !!stage && !isComplete && !isCancelled;

  return (
    <section className="chat" aria-label="Book an appointment">
      <header className="chat__header">
        <div className="chat__avatar" aria-hidden="true">🩺</div>
        <div>
          <strong>City Care Clinic</strong>
          <span className="chat__status">Typically replies instantly</span>
        </div>
      </header>

      {inFlow && <ProgressStepper stage={stage} />}

      <MessageList messages={messages} pending={pending} />

      {/* Domain notes from the turn (e.g. "That slot is no longer available"). */}
      {turn?.errors?.length > 0 && (
        <div className="chat__notes" role="status">
          {turn.errors.map((e, i) => <p key={i} className="chat__note">⚠︎ {e}</p>)}
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

      {(isConfirm || isComplete) && (
        <ConfirmationCard entities={entities} complete={isComplete} />
      )}

      {inFlow && (
        <QuickReplies
          replies={turn?.quickReplies}
          stage={stage}
          disabled={pending}
          onPick={send}
        />
      )}

      {(isComplete || isCancelled) && (
        <div className="chat__end">
          <button className="btn btn-primary" onClick={restart}>
            {isComplete ? 'Book another' : 'Start again'}
          </button>
        </div>
      )}

      {/* Free text stays available through the whole flow (contract §3). */}
      {!isComplete && !isCancelled && (
        <Composer disabled={pending || !ready} onSend={send} />
      )}
    </section>
  );
}

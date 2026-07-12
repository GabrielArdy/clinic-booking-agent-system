import { useEffect, useMemo, useState } from 'react';
import { useLiveChat } from '../../hooks/useLiveChat';
import { buildWs } from '../../lib/ws';
import { setLiveChat, clearLiveChat } from '../../api/client';
import LiveThread from '../livechat/LiveThread';
import { IconSupport, IconClose, IconMinimize, IconWarning } from '../icons';

// Shown once the bot hands off (turn.liveChat present). Swaps the REST bot loop
// for the WebSocket live chat with a staff member. `payload` = { sessionId,
// patientKey, wsPath }. `onMinimize` collapses the dock but keeps the socket/
// credential (resumes on reopen); `onEnd` drops it and returns to a fresh bot.
export default function LiveChatPanel({ payload, onMinimize, onEnd }) {
  // Persist the handoff so a reload can resume (patientKey is issued only once).
  // Key on the primitive so this doesn't re-run every render.
  useEffect(() => { setLiveChat(payload); }, [payload.patientKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const url = useMemo(
    () => buildWs(payload.wsPath || '/ws', { role: 'patient', key: payload.patientKey }),
    [payload.wsPath, payload.patientKey],
  );

  const { status, messages, idleWarning, closeReason, error, send, sendTyping, complete } = useLiveChat(url);
  const ended = status === 'closed';
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Drop the stored credential once the room actually closes.
  useEffect(() => { if (ended) clearLiveChat(); }, [ended]);

  const statusText = ended ? 'Chat ended'
    : status === 'open' ? 'Connected with our team'
      : 'Connecting you to our team…';

  // Before any staff message arrives we're queued — reassure the patient.
  const onlySystem = messages.every((m) => m.sender === 'system');
  const banner = (() => {
    if (error && !ended) {
      return <Note tone="warn">{error.message}</Note>;
    }
    if (idleWarning && !ended) {
      return (
        <Note tone="warn">
          You&rsquo;ll be disconnected soon due to inactivity
          {idleWarning.secondsLeft ? ` (${idleWarning.secondsLeft}s)` : ''}. Send a message to stay connected.
        </Note>
      );
    }
    if (!ended && status === 'open' && onlySystem) {
      return <Note tone="info">Waiting for a staff member to join…</Note>;
    }
    return null;
  })();

  const footer = ended ? (
    <div className="border-t border-gray-200 p-3">
      <p className="mb-2 text-center text-xs text-gray-500">
        {closeReason === 'timeout' ? 'This chat closed after a period of inactivity.'
          : closeReason === 'completed_by_staff' ? 'The staff member ended this chat.'
            : 'This chat has ended.'}
      </p>
      <button className="btn btn-primary w-full" onClick={onEnd}>Start over</button>
    </div>
  ) : confirmEnd ? (
    // Ending closes the room for both sides → confirm before firing (exit friction).
    <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-3 py-2 text-xs">
      <span className="text-gray-600">End this chat?</span>
      <div className="flex gap-2">
        <button className="btn btn-ghost" onClick={() => setConfirmEnd(false)}>Keep chatting</button>
        <button className="btn btn-primary" onClick={() => { complete(); setConfirmEnd(false); }}>End chat</button>
      </div>
    </div>
  ) : status === 'open' ? (
    <div className="border-t border-gray-200 px-3 py-1.5 text-right">
      <button type="button" className="text-xs text-gray-400 hover:text-gray-600"
              onClick={() => setConfirmEnd(true)}>End chat</button>
    </div>
  ) : null;

  return (
    <section className="chat" aria-label="Live chat with staff">
      <header className="chat__header">
        <div className="chat__avatar" aria-hidden="true"><IconSupport /></div>
        <div className="chat__id">
          <strong>City Care Clinic</strong>
          <span className="chat__status">{statusText}</span>
        </div>
        {(onMinimize || onEnd) && (
          <button type="button" className="chat__min" onClick={onMinimize ?? onEnd}
                  aria-label={onMinimize ? 'Minimize chat' : 'Close chat'}>
            {onMinimize ? <IconMinimize aria-hidden="true" /> : <IconClose aria-hidden="true" />}
          </button>
        )}
      </header>

      <LiveThread
        messages={messages}
        mineSender="patient"
        banner={banner}
        footer={footer}
        disabled={status !== 'open'}
        onSend={ended ? undefined : send}
        onTyping={sendTyping}
      />
    </section>
  );
}

function Note({ tone, children }) {
  const cls = tone === 'warn'
    ? 'bg-warning-50 text-warning-700'
    : 'bg-brand-50 text-brand-700';
  return (
    <p className={`flex items-center gap-2 px-4 py-2 text-xs ${cls}`} role="status">
      <IconWarning aria-hidden="true" className="size-4 shrink-0" /> {children}
    </p>
  );
}

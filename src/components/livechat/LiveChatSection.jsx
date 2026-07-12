import { useEffect, useMemo, useState } from 'react';
import { livechat } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { useLiveChat } from '../../hooks/useLiveChat';
import { buildWs } from '../../lib/ws';
import { toast } from '../../lib/toast';
import LiveThread from './LiveThread';
import { PageHeader, Badge, Button } from '../base';
import { cx } from '../../utils/cx';
import { IconInbox, IconPhone } from '../icons';

const TABS = [
  { key: 'waiting', label: 'Waiting', color: 'warning' },
  { key: 'active', label: 'Active', color: 'success' },
  { key: 'closed', label: 'Closed', color: 'gray' },
];
const STATUS_COLOR = { waiting: 'warning', active: 'success', closed: 'gray' };

const patientNameOf = (s) =>
  s?.patientName ?? s?.connectName ?? s?.name ?? (s?.id ? `Patient #${s.id}` : 'Patient');
const patientPhoneOf = (s) => s?.patientPhone ?? s?.connectPhone ?? s?.phone ?? null;

function timeOf(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

// Console-agnostic live-chat inbox — mounted by both the staff and admin
// consoles (both hit the same /api/livechat endpoints).
export default function LiveChatSection({ token }) {
  const [status, setStatus] = useState('waiting');
  const [selected, setSelected] = useState(null);

  const list = useAsync((signal) => livechat.list(token, status, { signal }), [token, status]);
  const { refetch } = list;

  // The waiting queue grows via push (dashboard socket toasts at the app level),
  // but this section isn't wired to that socket — poll lightly so the queue stays
  // current without coupling the two component trees.
  useEffect(() => {
    if (status !== 'waiting') return undefined;
    const t = setInterval(refetch, 8000);
    return () => clearInterval(t);
  }, [status, refetch]);

  const sessions = list.data?.sessions ?? [];

  return (
    <section className="flex h-[calc(100vh-7rem)] min-h-[30rem] flex-col">
      <PageHeader title="Live chat" subtitle="Claim waiting patients and chat in real time." />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[20rem_1fr]">
        {/* Queue */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex gap-1 border-b border-gray-200 p-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setStatus(t.key); setSelected(null); }}
                className={cx(
                  'flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors outline-none',
                  'focus-visible:ring-4 focus-visible:ring-brand-600/20',
                  status === t.key ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50',
                )}
                aria-current={status === t.key ? 'true' : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {list.loading && <p className="p-4 text-sm text-gray-400">Loading…</p>}
            {list.error && <p className="p-4 text-sm text-error-600">Couldn’t load sessions.</p>}
            {!list.loading && !sessions.length && (
              <p className="p-4 text-sm text-gray-400">No {status} chats.</p>
            )}
            <ul>
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setSelected(s)}
                    className={cx(
                      'w-full border-b border-gray-100 px-4 py-3 text-left transition-colors outline-none',
                      'focus-visible:ring-4 focus-visible:ring-brand-600/20',
                      selected?.id === s.id ? 'bg-brand-50' : 'hover:bg-gray-50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gray-900">{patientNameOf(s)}</span>
                      <Badge color={STATUS_COLOR[s.status] ?? 'gray'} dot>{s.status}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{timeOf(s.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Room */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          {selected
            ? (
              <StaffRoom
                key={selected.id}
                token={token}
                session={selected}
                onListChange={refetch}
                onExit={() => { setSelected(null); refetch(); }}
              />
            )
            : <EmptyRoom />}
        </div>
      </div>
    </section>
  );
}

function EmptyRoom() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <IconInbox className="size-8 text-gray-300" aria-hidden="true" />
      <p className="text-sm text-gray-400">Select a chat to view the conversation.</p>
    </div>
  );
}

// One room. Phase decides the surface: waiting → claim prompt; active → live WS
// room; closed → read-only transcript. Remounted per session via `key`.
function StaffRoom({ token, session, onListChange, onExit }) {
  const [phase, setPhase] = useState(session.status);
  const [claiming, setClaiming] = useState(false);

  const claim = async () => {
    setClaiming(true);
    try {
      await livechat.claim(token, session.id);
      setPhase('active');
      onListChange?.();
    } catch (e) {
      if (e.code === 'STAFF_BUSY') {
        toast('You already have an active chat. Complete it before claiming another.', { type: 'error' });
      } else if (e.code === 'SLOT_TAKEN') {
        toast('Another staff member just claimed this chat.', { type: 'error' });
        setPhase('closed');
        onListChange?.();
      } else {
        toast(e.message ?? 'Could not claim this chat.', { type: 'error' });
      }
    } finally {
      setClaiming(false);
    }
  };

  if (phase === 'waiting') {
    return <ClaimPrompt session={session} claiming={claiming} onClaim={claim} onExit={onExit} />;
  }
  if (phase === 'closed') {
    return <ClosedTranscript token={token} session={session} onExit={onExit} />;
  }
  return <ActiveRoom token={token} session={session} onListChange={onListChange} onExit={onExit} />;
}

function RoomHeader({ session, right }) {
  const phone = patientPhoneOf(session);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{patientNameOf(session)}</p>
        {phone && (
          <p className="flex items-center gap-1 text-xs text-gray-400">
            <IconPhone className="size-3.5" aria-hidden="true" /> {phone}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

function ClaimPrompt({ session, claiming, onClaim, onExit }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RoomHeader
        session={session}
        right={<Badge color="warning" dot>waiting</Badge>}
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-gray-500">
          This patient is waiting to connect. Claim the chat to start talking.
        </p>
        <Button onClick={onClaim} disabled={claiming}>
          {claiming ? 'Claiming…' : 'Claim chat'}
        </Button>
        <button className="text-xs text-gray-400 hover:text-gray-600" onClick={onExit}>Back to list</button>
      </div>
    </div>
  );
}

function ActiveRoom({ token, session, onListChange, onExit }) {
  const url = useMemo(
    () => buildWs('/ws', { role: 'staff', token, session: session.id }),
    [token, session.id],
  );
  const { status, messages, peerTyping, closeReason, error, send, sendTyping, complete } = useLiveChat(url);
  const [confirm, setConfirm] = useState(false);
  const ended = status === 'closed';

  // When the room closes (either side), refresh the list so the session leaves
  // the Active tab. Don't auto-navigate — keep the transcript on screen.
  useEffect(() => { if (ended) onListChange?.(); }, [ended]); // eslint-disable-line react-hooks/exhaustive-deps

  const right = ended ? (
    <Button variant="secondary" size="sm" onClick={onExit}>Back to list</Button>
  ) : confirm ? (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
      <Button variant="destructive" size="sm" onClick={() => { complete(); setConfirm(false); }}>End chat</Button>
    </div>
  ) : (
    <Button variant="secondary" size="sm" onClick={() => setConfirm(true)} disabled={status !== 'open'}>
      Complete
    </Button>
  );

  const banner = ended ? (
    <p className="bg-gray-50 px-4 py-2 text-center text-xs text-gray-500">
      {closeReason === 'timeout' ? 'Closed after the patient went inactive.'
        : closeReason === 'completed_by_patient' ? 'The patient ended this chat.'
          : 'This chat has ended.'}
    </p>
  ) : error ? (
    <p className="bg-warning-50 px-4 py-2 text-center text-xs text-warning-700">{error.message}</p>
  ) : status !== 'open' ? (
    <p className="bg-gray-50 px-4 py-2 text-center text-xs text-gray-500">Connecting…</p>
  ) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RoomHeader session={session} right={right} />
      <LiveThread
        messages={messages}
        mineSender="staff"
        banner={banner}
        peerTyping={peerTyping}
        disabled={status !== 'open'}
        onSend={ended ? undefined : send}
        onTyping={sendTyping}
        placeholder="Reply to the patient…"
      />
    </div>
  );
}

function ClosedTranscript({ token, session, onExit }) {
  const q = useAsync((signal) => livechat.get(token, session.id, { signal }), [token, session.id]);
  const messages = q.data?.messages ?? [];
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RoomHeader
        session={session}
        right={<Button variant="secondary" size="sm" onClick={onExit}>Back to list</Button>}
      />
      {q.loading && <p className="p-4 text-sm text-gray-400">Loading transcript…</p>}
      {!q.loading && (
        <LiveThread
          messages={messages.map((m, i) => ({
            id: m.id ?? `t${i}`,
            sender: m.sender ?? m.role ?? m.from ?? 'patient',
            body: m.body ?? m.content ?? m.text ?? '',
          }))}
          mineSender="staff"
          banner={<p className="bg-gray-50 px-4 py-2 text-center text-xs text-gray-500">This chat is closed — read only.</p>}
        />
      )}
    </div>
  );
}

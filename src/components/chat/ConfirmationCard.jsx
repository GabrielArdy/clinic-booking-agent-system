import { IconSuccess, IconReview, IconCancel } from '../icons';

// Built from collectedEntities. One card shape serves four moments (Jakob's law —
// a familiar summary block the user already recognises from the review step):
//   review    → confirm_booking       (booking summary, pending)
//   done      → booking_complete      (success + reference)
//   lookup    → check_result / confirm_cancellation (found appointment)
//   cancelled → cancellation_complete (released)
const HEADING = {
  review: 'Please confirm your booking',
  done: "You're booked!",
  lookup: 'Appointment found',
  cancelled: 'Appointment cancelled',
};

export default function ConfirmationCard({ entities, mode = 'review', status }) {
  if (!entities) return null;
  const {
    specialtyName, doctorName, date, slotStart, slotEnd,
    patientName, patientPhone, bookingReference, lookupReference,
  } = entities;

  const when = [date, [slotStart, slotEnd].filter(Boolean).join('–')]
    .filter(Boolean).join(' · ');
  const reference = bookingReference || lookupReference;

  const rows = [
    ['Specialty', specialtyName],
    ['Doctor', doctorName],
    ['Date & time', when || null],
    ['Patient', patientName],
    ['Phone', patientPhone],
    ['Status', status],
  ].filter(([, v]) => v);

  const done = mode === 'done';
  const cancelled = mode === 'cancelled';
  const showRef = reference && mode !== 'review';
  const Icon = cancelled ? IconCancel : done || mode === 'lookup' ? IconSuccess : IconReview;

  return (
    <div className={`confirm-card ${done ? 'confirm-card--done' : ''} ${cancelled ? 'confirm-card--cancelled' : ''}`}>
      <div className="confirm-card__head">
        <span className="confirm-card__icon" aria-hidden="true"><Icon /></span>
        <div>
          <strong>{HEADING[mode]}</strong>
          {showRef && (
            <div className="confirm-card__ref">
              Reference <code>{reference}</code>
            </div>
          )}
        </div>
      </div>
      <dl className="confirm-card__grid">
        {rows.map(([k, v]) => (
          <div key={k} className="confirm-card__row">
            <dt>{k}</dt><dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

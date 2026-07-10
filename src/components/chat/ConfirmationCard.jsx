import { IconSuccess, IconReview } from '../icons';

// Built from collectedEntities (contract §4/§5). Same card serves the review
// (confirm_booking) and success (booking_complete) states.
export default function ConfirmationCard({ entities, complete }) {
  if (!entities) return null;
  const {
    specialtyName, doctorName, date, slotStart, slotEnd,
    patientName, patientPhone, bookingReference,
  } = entities;

  const when = [date, [slotStart, slotEnd].filter(Boolean).join('–')]
    .filter(Boolean).join(' · ');

  const rows = [
    ['Specialty', specialtyName],
    ['Doctor', doctorName],
    ['Date & time', when || null],
    ['Patient', patientName],
    ['Phone', patientPhone],
  ].filter(([, v]) => v);

  return (
    <div className={`confirm-card ${complete ? 'confirm-card--done' : ''}`}>
      <div className="confirm-card__head">
        <span className="confirm-card__icon" aria-hidden="true">{complete ? <IconSuccess /> : <IconReview />}</span>
        <div>
          <strong>{complete ? "You're booked!" : 'Please confirm your booking'}</strong>
          {complete && bookingReference && (
            <div className="confirm-card__ref">
              Reference <code>{bookingReference}</code>
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

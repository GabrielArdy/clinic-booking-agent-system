import { IconOnDuty } from './icons';

// Shared today's-shift panel. Same payload shape on /api/doctor and /api/staff:
// { date, shifts: [{ assignment, shift: { name, startTime, endTime } }] }.
export default function ShiftToday({ data, loading, error }) {
  const shifts = data?.shifts ?? [];
  return (
    <div className="card panel shift-today">
      <div className="shift-today__head">
        <IconOnDuty aria-hidden="true" />
        <h2>Today’s shift</h2>
        {data?.date && <span className="muted">{data.date}</span>}
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="form-error" role="alert">{error.message}</p>}
      {!loading && !error && shifts.length === 0 && (
        <p className="muted">No shift assigned today.</p>
      )}
      {shifts.length > 0 && (
        <ul className="shift-list">
          {shifts.map(({ assignment, shift }) => (
            <li key={assignment?.id ?? shift?.name} className="shift-chip">
              <strong>{shift?.name ?? 'Shift'}</strong>
              <span className="muted">{shift?.startTime}–{shift?.endTime}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { IconPrev, IconNext, IconExceptions } from '../icons';
import { DOW, MONTHS, monthCells, fmtLong, todayISO } from '../../lib/calendar';

// Presentational month planner: calendar (per-day badges, color-coded but never
// colour-only — WCAG 1.4.1) + selected-day list. Owns no data or fetching; the
// parent feeds { appointments, exceptions, days } and controls month/selection.
export default function MonthPlanner({
  data, loading, error, monthKey, selected, onSelectDate, onShiftMonth,
}) {
  const [my, mm] = monthKey.split('-').map(Number);
  const cells = monthCells(monthKey);
  const daysMap = new Map((data?.days ?? []).map((d) => [d.date, d]));
  const appointments = data?.appointments ?? [];
  const exceptions = data?.exceptions ?? [];
  const dayAppts = appointments.filter((a) => a.date === selected);
  const dayExc = exceptions.filter((e) => e.date === selected);
  const today = todayISO();

  return (
    <div className="planner">
      <div className="card panel planner__cal">
        <div className="cal-head">
          <button type="button" className="icon-btn" aria-label="Previous month"
                  onClick={() => onShiftMonth(-1)}><IconPrev /></button>
          <strong>{MONTHS[mm - 1]} {my}</strong>
          <button type="button" className="icon-btn" aria-label="Next month"
                  onClick={() => onShiftMonth(1)}><IconNext /></button>
        </div>

        <div className="cal-grid cal-grid--dow">
          {DOW.map((d) => <span key={d} className="cal-dow">{d}</span>)}
        </div>
        <div className="cal-grid">
          {cells.map((c, i) => {
            if (!c.date) return <div key={`p${i}`} className="cal-cell cal-cell--pad" />;
            const s = daysMap.get(c.date);
            const cls = [
              'cal-cell',
              c.date === selected && 'is-selected',
              c.date === today && 'is-today',
              s?.blocked && 'cal-cell--blocked',
            ].filter(Boolean).join(' ');
            return (
              <button key={c.date} type="button" className={cls} aria-pressed={c.date === selected}
                      onClick={() => onSelectDate(c.date)}>
                <span className="cal-cell__day">{c.day}</span>
                {s && (
                  <span className="cal-badges">
                    {s.active > 0 && (
                      <span className="cal-badge cal-badge--active" title="Active">{s.active}</span>
                    )}
                    {s.cancelled > 0 && (
                      <span className="cal-badge cal-badge--cancelled" title="Cancelled">{s.cancelled}</span>
                    )}
                    {s.exceptions > 0 && (
                      <span className="cal-badge cal-badge--exc" title="Blocked time">{s.exceptions}</span>
                    )}
                  </span>
                )}
                {s?.blocked && <span className="cal-cell__off">Off</span>}
              </button>
            );
          })}
        </div>

        <div className="cal-legend">
          <span><i className="dot dot--active" /> Active</span>
          <span><i className="dot dot--cancelled" /> Cancelled</span>
          <span><i className="dot dot--exc" /> Blocked</span>
        </div>
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="form-error" role="alert">{error.message}</p>}
      </div>

      <div className="card panel planner__day">
        <h2>{fmtLong(selected)}</h2>
        {dayExc.length === 0 && dayAppts.length === 0 && (
          <p className="muted">No appointments or blocked time on this day.</p>
        )}
        <ul className="appt-list">
          {dayExc.map((ex) => (
            <li key={`x${ex.id}`} className="appt appt--blocked">
              <IconExceptions aria-hidden="true" className="appt__ico" />
              <span className="appt__time">
                {ex.startTime ? `${ex.startTime}–${ex.endTime}` : 'All day'}
              </span>
              <span className="appt__who">Blocked{ex.reason ? `: ${ex.reason}` : ''}</span>
            </li>
          ))}
          {dayAppts.map((a) => (
            <li key={a.id} className={`appt appt--${a.status}`}>
              <span className="appt__time">{a.startTime}–{a.endTime}</span>
              <span className="appt__who">
                <strong>{a.patient.fullName}</strong>
                <span className="muted">{a.patient.phone}</span>
              </span>
              <span className={`pill ${a.status === 'active' ? 'pill-success' : 'pill-muted'}`}>
                {a.status}
              </span>
              <code>{a.reference}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

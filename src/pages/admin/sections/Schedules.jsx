import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import { IconPrev, IconNext, IconExceptions } from '../../../components/icons';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const pad2 = (n) => String(n).padStart(2, '0');
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKeyOf = (iso) => iso.slice(0, 7);

// Full month span for the appointments feed (from/to inclusive).
function monthRange(key) {
  const [y, m] = key.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${key}-01`, to: `${key}-${pad2(last)}` };
}

// Sunday-start cell grid for a month. `null` date = padding cell.
function monthCells(key) {
  const [y, m] = key.split('-').map(Number);
  const lead = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push({ date: null });
  for (let d = 1; d <= days; d++) cells.push({ date: `${key}-${pad2(d)}`, day: d });
  return cells;
}

const fmtLong = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`;
};

export default function Schedules({ token }) {
  const doctorsQ = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = doctorsQ.data?.doctors ?? [];
  const [doctorId, setDoctorId] = useState('');

  const [monthKey, setMonthKey] = useState(() => monthKeyOf(todayISO()));
  const [selected, setSelected] = useState(() => todayISO());

  // One fetch per (doctor, month). No effect chains: calendar + day list are
  // derived from this payload at render time.
  const apptQ = useAsync(
    (signal) => {
      if (!doctorId) return Promise.resolve(null);
      const { from, to } = monthRange(monthKey);
      return admin.listAppointments(token, { doctorId, from, to }, { signal });
    },
    [token, doctorId, monthKey],
  );
  const appointments = apptQ.data?.appointments ?? [];
  const exceptions = apptQ.data?.exceptions ?? [];
  const daysMap = new Map((apptQ.data?.days ?? []).map((d) => [d.date, d]));

  const cells = monthCells(monthKey);
  const [my, mm] = monthKey.split('-').map(Number);
  const dayAppts = appointments.filter((a) => a.date === selected);
  const dayExc = exceptions.filter((e) => e.date === selected);
  const today = todayISO();

  const shiftMonth = (delta) => {
    const d = new Date(my, mm - 1 + delta, 1);
    const next = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    setMonthKey(next);
    setSelected(`${next}-01`);        // event handler, not effect — keep selection in-range
  };

  // --- Weekly availability rules (kept from prior page) ---
  const rulesQ = useAsync(
    (signal) => (doctorId ? admin.listSchedules(token, doctorId, { signal }) : Promise.resolve(null)),
    [token, doctorId],
  );
  const rules = rulesQ.data?.rules ?? [];
  const [rule, setRule] = useState({ weekday: 1, startTime: '09:00', endTime: '17:00', slotMinutes: 30 });
  const [savingRule, setSavingRule] = useState(false);
  const [ruleError, setRuleError] = useState(null);
  const setR = (k) => (e) => setRule((r) => ({ ...r, [k]: e.target.value }));

  const addRule = async (e) => {
    e.preventDefault();
    if (!doctorId) return;
    setSavingRule(true); setRuleError(null);
    try {
      await admin.createSchedule(token, {
        doctorId: Number(doctorId),
        weekday: Number(rule.weekday),
        startTime: rule.startTime,
        endTime: rule.endTime,
        slotMinutes: Number(rule.slotMinutes),
      });
      rulesQ.refetch();
    } catch (err) { setRuleError(err.message); }
    finally { setSavingRule(false); }
  };

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Schedule planner</h1>
          <p className="section__sub">Appointments and blocked time at a glance.</p>
        </div>
        <label className="field field--inline" style={{ maxWidth: 260 }}>
          <span>Doctor</span>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">Select a doctor…</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
          </select>
        </label>
      </div>

      {!doctorId && <p className="muted">Pick a doctor to view their planner.</p>}

      {doctorId && (
        <>
          <div className="planner">
            {/* Calendar */}
            <div className="card panel planner__cal">
              <div className="cal-head">
                <button type="button" className="icon-btn" aria-label="Previous month"
                        onClick={() => shiftMonth(-1)}><IconPrev /></button>
                <strong>{MONTHS[mm - 1]} {my}</strong>
                <button type="button" className="icon-btn" aria-label="Next month"
                        onClick={() => shiftMonth(1)}><IconNext /></button>
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
                            onClick={() => setSelected(c.date)}>
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
              {apptQ.loading && <p className="muted">Loading…</p>}
              {apptQ.error && <p className="form-error" role="alert">{apptQ.error.message}</p>}
            </div>

            {/* Selected-day list */}
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

          {/* Weekly availability rules */}
          <form className="card panel" onSubmit={addRule}>
            <h2>Weekly availability</h2>
            <div className="form-row">
              <label className="field">
                <span>Weekday</span>
                <select value={rule.weekday} onChange={setR('weekday')}>
                  {WEEKDAYS.map((w, i) => <option key={i} value={i}>{w}</option>)}
                </select>
              </label>
              <label className="field field--sm">
                <span>Start</span>
                <input type="time" value={rule.startTime} onChange={setR('startTime')} required />
              </label>
              <label className="field field--sm">
                <span>End</span>
                <input type="time" value={rule.endTime} onChange={setR('endTime')} required />
              </label>
              <label className="field field--sm">
                <span>Slot (min)</span>
                <input type="number" min="5" max="240" value={rule.slotMinutes} onChange={setR('slotMinutes')} />
              </label>
              <button className="btn btn-primary" type="submit" disabled={savingRule}>
                {savingRule ? 'Saving…' : 'Add rule'}
              </button>
            </div>
            {ruleError && <p className="form-error" role="alert">{ruleError}</p>}
            {!rulesQ.loading && !rulesQ.error && rules.length > 0 && (
              <table className="table" style={{ marginTop: 'var(--s-4)' }}>
                <thead><tr><th>Weekday</th><th>Hours</th><th>Slot</th></tr></thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id}>
                      <td>{WEEKDAYS[r.weekday]}</td>
                      <td>{r.startTime} – {r.endTime}</td>
                      <td>{r.slotMinutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </form>
        </>
      )}
    </section>
  );
}

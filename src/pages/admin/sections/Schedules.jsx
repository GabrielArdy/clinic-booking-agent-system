import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import MonthPlanner from '../../../components/planner/MonthPlanner';
import { WEEKDAYS, todayISO, monthKeyOf, monthRange, shiftMonthKey } from '../../../lib/calendar';

export default function Schedules({ token }) {
  const doctorsQ = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = doctorsQ.data?.doctors ?? [];
  const [doctorId, setDoctorId] = useState('');

  const [monthKey, setMonthKey] = useState(() => monthKeyOf(todayISO()));
  const [selected, setSelected] = useState(() => todayISO());

  // One fetch per (doctor, month); MonthPlanner derives the grid + day list.
  const apptQ = useAsync(
    (signal) => {
      if (!doctorId) return Promise.resolve(null);
      const { from, to } = monthRange(monthKey);
      return admin.listAppointments(token, { doctorId, from, to }, { signal });
    },
    [token, doctorId, monthKey],
  );

  const shiftMonth = (delta) => {
    const next = shiftMonthKey(monthKey, delta);
    setMonthKey(next);
    setSelected(`${next}-01`);          // event handler keeps selection in-range
  };

  // --- Weekly availability rules (kept) ---
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
          <MonthPlanner
            data={apptQ.data} loading={apptQ.loading} error={apptQ.error}
            monthKey={monthKey} selected={selected}
            onSelectDate={setSelected} onShiftMonth={shiftMonth}
          />

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

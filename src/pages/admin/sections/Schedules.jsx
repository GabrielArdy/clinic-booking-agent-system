import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import MonthPlanner from '../../../components/planner/MonthPlanner';
import { WEEKDAYS, todayISO, monthKeyOf, monthRange, shiftMonthKey } from '../../../lib/calendar';
import {
  Button, Input, Select, Card,
  Table, THead, TH, TBody, TR, TD, PageHeader,
} from '../../../components/base';

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
    <section>
      <PageHeader title="Schedule planner" subtitle="Appointments and blocked time at a glance.">
        <div className="w-56">
          <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} aria-label="Doctor">
            <option value="">Select a doctor…</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
          </Select>
        </div>
      </PageHeader>

      {!doctorId && <p className="text-sm text-gray-500">Pick a doctor to view their planner.</p>}

      {doctorId && (
        <div className="flex flex-col gap-6">
          <MonthPlanner
            data={apptQ.data} loading={apptQ.loading} error={apptQ.error}
            monthKey={monthKey} selected={selected}
            onSelectDate={setSelected} onShiftMonth={shiftMonth}
          />

          <Card className="p-6" as="form" onSubmit={addRule}>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Weekly availability</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-40">
                <Select label="Weekday" value={rule.weekday} onChange={setR('weekday')}>
                  {WEEKDAYS.map((w, i) => <option key={i} value={i}>{w}</option>)}
                </Select>
              </div>
              <div className="w-32"><Input label="Start" type="time" value={rule.startTime} onChange={setR('startTime')} required /></div>
              <div className="w-32"><Input label="End" type="time" value={rule.endTime} onChange={setR('endTime')} required /></div>
              <div className="w-28"><Input label="Slot (min)" type="number" min="5" max="240" value={rule.slotMinutes} onChange={setR('slotMinutes')} /></div>
              <Button type="submit" disabled={savingRule}>{savingRule ? 'Saving…' : 'Add rule'}</Button>
            </div>
            {ruleError && <p className="mt-3 text-sm text-error-600" role="alert">{ruleError}</p>}
            {!rulesQ.loading && !rulesQ.error && rules.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <THead><TR className="hover:bg-transparent"><TH>Weekday</TH><TH>Hours</TH><TH>Slot</TH></TR></THead>
                  <TBody>
                    {rules.map((r) => (
                      <TR key={r.id}>
                        <TD className="font-medium text-gray-900">{WEEKDAYS[r.weekday]}</TD>
                        <TD>{r.startTime} – {r.endTime}</TD>
                        <TD>{r.slotMinutes} min</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      )}
    </section>
  );
}

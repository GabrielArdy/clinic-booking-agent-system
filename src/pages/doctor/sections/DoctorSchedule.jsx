import { useState } from 'react';
import { doctor } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import MonthPlanner from '../../../components/planner/MonthPlanner';
import ShiftToday from '../../../components/ShiftToday';
import { PageHeader } from '../../../components/base';
import { todayISO, monthKeyOf, monthRange, shiftMonthKey } from '../../../lib/calendar';

// Doctor's own planner — auto-scoped server-side (no doctorId param).
export default function DoctorSchedule({ token }) {
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(todayISO()));
  const [selected, setSelected] = useState(() => todayISO());

  const schedQ = useAsync(
    (signal) => {
      const { from, to } = monthRange(monthKey);
      return doctor.schedule(token, { from, to }, { signal });
    },
    [token, monthKey],
  );
  const shiftQ = useAsync((signal) => doctor.shiftToday(token, { signal }), [token]);

  const shiftMonth = (delta) => {
    const next = shiftMonthKey(monthKey, delta);
    setMonthKey(next);
    setSelected(`${next}-01`);
  };

  return (
    <section>
      <PageHeader title="My schedule" subtitle="Your appointments and blocked time." />
      <div className="flex flex-col gap-6">
        <ShiftToday data={shiftQ.data} loading={shiftQ.loading} error={shiftQ.error} />
        <MonthPlanner
          data={schedQ.data} loading={schedQ.loading} error={schedQ.error}
          monthKey={monthKey} selected={selected}
          onSelectDate={setSelected} onShiftMonth={shiftMonth}
        />
      </div>
    </section>
  );
}

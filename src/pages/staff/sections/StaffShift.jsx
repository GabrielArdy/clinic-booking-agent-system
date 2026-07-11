import { staff } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import ShiftToday from '../../../components/ShiftToday';

export default function StaffShift({ token }) {
  const q = useAsync((signal) => staff.shiftToday(token, { signal }), [token]);
  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Today</h1>
          <p className="section__sub">Your shift for today.</p>
        </div>
      </div>
      <ShiftToday data={q.data} loading={q.loading} error={q.error} />
    </section>
  );
}

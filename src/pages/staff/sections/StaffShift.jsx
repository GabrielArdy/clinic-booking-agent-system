import { staff } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import ShiftToday from '../../../components/ShiftToday';
import { PageHeader } from '../../../components/base';

export default function StaffShift({ token }) {
  const q = useAsync((signal) => staff.shiftToday(token, { signal }), [token]);
  return (
    <section>
      <PageHeader title="Today" subtitle="Your shift for today." />
      <ShiftToday data={q.data} loading={q.loading} error={q.error} />
    </section>
  );
}

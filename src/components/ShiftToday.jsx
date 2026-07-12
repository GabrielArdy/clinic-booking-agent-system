import { IconOnDuty } from './icons';
import { Card, Badge } from './base';

// Shared today's-shift panel. Same payload shape on /api/doctor and /api/staff:
// { date, shifts: [{ assignment, shift: { name, startTime, endTime } }] }.
export default function ShiftToday({ data, loading, error }) {
  const shifts = data?.shifts ?? [];
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <IconOnDuty aria-hidden="true" className="size-5 text-brand-600" />
        <h2 className="text-base font-semibold text-gray-900">Today&rsquo;s shift</h2>
        {data?.date && <span className="ml-auto text-sm text-gray-500">{data.date}</span>}
      </div>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-error-600" role="alert">{error.message}</p>}
      {!loading && !error && shifts.length === 0 && (
        <p className="text-sm text-gray-500">No shift assigned today.</p>
      )}
      {shifts.length > 0 && (
        <ul className="flex flex-col gap-2">
          {shifts.map(({ assignment, shift }) => (
            <li key={assignment?.id ?? shift?.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <strong className="text-sm font-semibold text-gray-800">{shift?.name ?? 'Shift'}</strong>
              <Badge color="brand">{shift?.startTime}–{shift?.endTime}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

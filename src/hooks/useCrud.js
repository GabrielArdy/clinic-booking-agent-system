import { useCallback, useState } from 'react';
import { useAsync } from './useAsync';

// List + create + delete for the flat CMS resources. The async plumbing is
// identical across specialties/staff/slot-presets/shifts/assignments, so it
// lives here once; each section keeps its own form JSX (the part that differs).
//   load(signal) → item[]   create(body) → record   remove(id) → void
// State holds the array directly (not the {key: []} wrapper) so mutations are trivial.
export function useCrud({ load, create, remove, deps = [] }) {
  const { data, loading, error, setData, refetch } = useAsync(load, deps);
  const items = data ?? [];
  const [busy, setBusy] = useState(false);
  const [mutError, setMutError] = useState(null);

  const add = useCallback(async (body) => {
    setBusy(true); setMutError(null);
    try {
      const rec = await create(body);
      setData((prev) => [...(prev ?? []), rec]);
      return true;
    } catch (err) { setMutError(err); return false; }
    finally { setBusy(false); }
  }, [create, setData]);

  // Replace one record in place (after a PUT toggle) without a full refetch.
  const patch = useCallback((rec) => {
    setData((prev) => (prev ?? []).map((x) => (x.id === rec.id ? rec : x)));
  }, [setData]);

  const del = useCallback(async (id) => {
    setBusy(true); setMutError(null);
    try {
      await remove(id);
      setData((prev) => (prev ?? []).filter((x) => x.id !== id));
    } catch (err) { setMutError(err); }
    finally { setBusy(false); }
  }, [remove, setData]);

  return { items, loading, error, refetch, add, del, patch, busy, mutError };
}

import { useCallback, useEffect, useState } from 'react';

// Small fetch-state helper for admin reads. `run` is the async fn (receives an
// AbortSignal); `deps` re-fetch when changed. Not React Query — no cache — but
// it aborts in-flight requests so there are no setState-after-unmount leaks.
export function useAsync(run, deps, { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  // `run` is captured directly (no ref) — callers pass it inline, so execute is
  // recreated per render, which is fine: it's only invoked from the mount effect
  // and event handlers, never as a memo dependency of a hot child.
  const execute = useCallback((signal) => {
    setLoading(true);
    setError(null);
    return run(signal)
      .then((res) => { if (!signal?.aborted) setData(res); return res; })
      .catch((err) => { if (err?.name !== 'AbortError') setError(err); })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, [run]);

  useEffect(() => {
    if (!immediate) return;
    const ctrl = new AbortController();
    // Deliberate fetch-on-mount: this hook stands in for a data-fetch library,
    // so setting loading state from the effect is the intended behavior here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    execute(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Manual refetch (after a mutation / on demand) — own controller, fire & forget.
  const refetch = useCallback(() => execute(new AbortController().signal), [execute]);

  return { data, loading, error, setData, refetch };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../utils/api';
import { errorMessage } from '../utils/errors';
import type { Page } from '../types';

type Params = Record<string, string | number | boolean | undefined>;
interface Result<T> { key: string | null; data: Page<T> | null; error: string | null }

// Loads a paginated list from the API and re-loads whenever the parameters change.
// "loading" is derived (the last result belongs to other parameters, or a manual reload is running)
// so the effect never has to set state synchronously.
export function usePagedData<T>(path: string, params: Params) {
  const key = `${path}?${JSON.stringify(params)}`;
  const [result, setResult] = useState<Result<T>>({ key: null, data: null, error: null });
  const [reloading, setReloading] = useState(false);
  const latest = useRef(0);

  const fetchPage = useCallback(async () => {
    const query = Object.fromEntries(Object.entries(JSON.parse(key.slice(path.length + 1)) as Params).filter(([, v]) => v !== undefined && v !== ''));
    return (await api.get<Page<T>>(path, { params: query })).data;
  }, [path, key]);

  useEffect(() => {
    const requestId = ++latest.current;
    fetchPage()
      .then((data) => { if (requestId === latest.current) setResult({ key, data, error: null }); })
      .catch((err) => { if (requestId === latest.current) setResult({ key, data: null, error: errorMessage(err, 'Could not load data.') }); });
  }, [fetchPage, key]);

  // Manual reload (Retry, Refresh, after an edit). A silent reload keeps the current data on screen if it fails.
  const reload = useCallback(async (silent = false) => {
    const requestId = ++latest.current;
    if (!silent) setReloading(true);
    try {
      const data = await fetchPage();
      if (requestId === latest.current) setResult({ key, data, error: null });
    } catch (err) {
      if (!silent && requestId === latest.current) setResult({ key, data: null, error: errorMessage(err, 'Could not load data.') });
    } finally {
      if (!silent) setReloading(false);
    }
  }, [fetchPage, key]);

  const current = result.key === key;
  const loading = !current || reloading;
  return { data: result.data, loading, error: current && !reloading ? result.error : null, reload };
}

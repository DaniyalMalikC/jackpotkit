import { useEffect, useState } from 'react';

export function useReducedMotion(override?: boolean): boolean {
  const [systemPreference, setSystemPreference] = useState(false);

  useEffect(() => {
    if (
      override !== undefined ||
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemPreference(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [override]);

  return override ?? systemPreference;
}

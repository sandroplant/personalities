import React from 'react';

type SummaryItem = {
  id: number;
  name: string;
  average: number;
  count: number;
};

type Gating = {
  eligible: boolean;
  threshold: number;
  outbound_count: number;
};

type Props = {
  subjectId?: number;
  userId?: number; // alias used by existing code
};

async function fetchJSON(path: string) {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

async function getSelfSubjectId(): Promise<number | null> {
  try {
    const data = await fetchJSON('/userprofiles/profile/');
    if (typeof data?.id === 'number') return data.id;
    if (typeof data?.user?.id === 'number') return data.user.id;
  } catch {
    // ignore
  }
  return null;
}

export default function EvaluationSummary({ subjectId, userId }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<SummaryItem[]>([]);
  const [gating, setGating] = React.useState<Gating | null>(null);
  const [resolvedSubject, setResolvedSubject] = React.useState<number | null>(
    subjectId ?? null
  );

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        let sid = subjectId ?? userId ?? resolvedSubject;
        if (!sid) sid = await getSelfSubjectId();
        if (!sid) throw new Error('Could not resolve subject id');
        if (!cancelled) setResolvedSubject(sid);
        const data = await fetchJSON(
          `/evaluations/summary-v2/?subject_id=${encodeURIComponent(sid)}`
        );
        if (cancelled) return;
        setItems((data?.criteria as SummaryItem[]) || []);
        if (data?.gating) setGating(data.gating as Gating);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load summary');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [subjectId, userId, resolvedSubject]);

  return (
    <div>
      <h3>Your Ratings Summary</h3>
      {loading && <div>Loading evaluation summary…</div>}
      {!loading && error && <div style={{ color: '#b00' }}>Error: {error}</div>}
      {!loading && !error && gating && !gating.eligible && (
        <div>
          Unlock your summary by rating{' '}
          {Math.max(0, (gating.threshold || 10) - (gating.outbound_count || 0))}{' '}
          more friend(s).
        </div>
      )}
      {!loading &&
        !error &&
        (!items || items.length === 0) &&
        (!gating || gating.eligible) && <div>No ratings yet.</div>}
      {!loading && !error && items && items.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((it) => (
            <li
              key={it.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <span>{it.name}</span>
              <span>
                {it.average.toFixed(2)} ({it.count})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

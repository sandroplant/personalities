import React from "react";
import { fetchEvaluationSummary, EvaluationSummaryItem } from "../services/evaluations";

type Props = {
  subjectId: number;
};

export default function EvaluationSummaryCard({ subjectId }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<EvaluationSummaryItem[]>([]);
  const [gating, setGating] = React.useState<{ eligible: boolean; threshold: number; outbound_count: number } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEvaluationSummary(subjectId)
      .then((data) => {
        if (!cancelled) {
          setItems(data.criteria || []);
          if ((data as any).gating) setGating((data as any).gating);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load summary");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  if (loading) return <div>Loading evaluation summary…</div>;
  if (error) return <div style={{ color: "#b00" }}>Error: {error}</div>;
  if (gating && !gating.eligible) {
    const remaining = Math.max(0, (gating.threshold || 10) - (gating.outbound_count || 0));
    return (
      <div>
        <h3>Evaluation Summary</h3>
        <div>Unlock your summary by rating {remaining} more friend(s).</div>
      </div>
    );
  }
  if (!items.length) return <div>No ratings yet.</div>;

  return (
    <div>
      <h3>Evaluation Summary</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((it) => (
          <li key={it.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
            <span>{it.name}</span>
            <span>
              {it.average.toFixed(2)} ({it.count})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

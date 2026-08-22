import React from "react";
import { CheckCircle2, Clock, Sprout } from "lucide-react";

const PRIORITY_CONFIG = {
  low:    { color: '#3da970', bg: '#16261c', label: 'Low' },
  medium: { color: '#d4a84a', bg: '#2a2417', label: 'Medium' },
  high:   { color: '#d97742', bg: '#2a1d15', label: 'High' },
  urgent: { color: '#d64545', bg: '#2a1717', label: 'Urgent' },
};

export default function ForecastActions({ actions = [] }) {
  if (!actions.length) return null;

  const sorted = [...actions].sort((a, b) => {
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
  });

  return (
    <div className="fs-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <CheckCircle2 style={{ width: 18, height: 18, color: '#4ec285' }} />
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Prepare Ahead</h3>
        <span style={{ fontSize: 12, color: '#7a8290' }}>· recommended actions</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((action, i) => {
          const cfg = PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.medium;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 16px', borderRadius: 12,
              background: '#0e1116', border: '1px solid #252a33',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: cfg.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: 13, fontWeight: 700, color: cfg.color,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e8eaed' }}>{action.action}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                    background: cfg.bg, color: cfg.color,
                  }}>
                    {cfg.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#7a8290' }}>
                  {action.field && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Sprout style={{ width: 12, height: 12, color: '#4ec285' }} /> {action.field}
                    </span>
                  )}
                  {action.timing && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock style={{ width: 12, height: 12 }} /> {action.timing}
                    </span>
                  )}
                </div>
                {action.reason && (
                  <p style={{ fontSize: 12, color: '#9aa3af', margin: '6px 0 0', lineHeight: 1.5 }}>{action.reason}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
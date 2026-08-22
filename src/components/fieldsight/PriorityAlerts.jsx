import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, CheckCircle, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { SEVERITY_CONFIG, DETECTION_TYPE_CONFIG } from "@/lib/fieldUtils";

export default function PriorityAlerts({ detections = [], fields = [] }) {
  const queryClient = useQueryClient();
  const [dismissing, setDismissing] = useState(null);

  const fieldMap = {};
  fields.forEach(f => { fieldMap[f.id] = f; });

  // Only surface genuinely serious alerts — high and critical severity
  const severityOrder = { critical: 0, high: 1 };
  const strict = detections.filter(d => d.severity === 'high' || d.severity === 'critical');
  const sorted = [...strict].sort((a, b) =>
    (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );
  const topAlerts = sorted.slice(0, 3);

  async function handleDismiss(e, det) {
    e.preventDefault();
    e.stopPropagation();
    setDismissing(det.id);
    try {
      await base44.entities.Detection.delete(det.id);
      await queryClient.invalidateQueries({ queryKey: ["fs-detections"] });
    } catch (err) {
      console.error("Failed to dismiss alert", err);
    } finally {
      setDismissing(null);
    }
  }

  return (
    <div className="fs-card" style={{ padding: 24, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <AlertTriangle style={{ width: 18, height: 18, color: '#d97742' }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#e8eaed' }}>Priority Alerts</span>
        {topAlerts.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#d97742', background: '#2a1d15', padding: '2px 8px', borderRadius: 999 }}>
            {topAlerts.length}
          </span>
        )}
      </div>
      {topAlerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 28 }}>
          <CheckCircle style={{ width: 32, height: 32, color: '#3da970', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: '#2d8a5a', margin: 0 }}>No active alerts across your fields</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topAlerts.map(det => {
            const field = fieldMap[det.field_id];
            const sevCfg = SEVERITY_CONFIG[det.severity] || SEVERITY_CONFIG.low;
            return (
              <Link key={det.id} to={`/fields/${det.field_id}`} style={{ textDecoration: 'none' }}>
                <div className="fs-card-hover" style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, borderLeft: `3px solid ${sevCfg.color}`, borderRadius: 8, background: '#1c2129' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: sevCfg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {det.label} — {field?.name || 'Field'}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: sevCfg.color, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{det.severity}</span>
                  <button
                    onClick={(e) => handleDismiss(e, det)}
                    disabled={dismissing === det.id}
                    title="Dismiss"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 6, color: '#6b7480', display: 'flex', alignItems: 'center', flexShrink: 0, opacity: dismissing === det.id ? 0.4 : 1 }}
                  >
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
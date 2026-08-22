import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Calendar, ChevronRight, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const ACTION_VERBS = {
  targeted_treatment: 'Treat',
  monitor: 'Monitor',
  irrigate: 'Irrigate',
  fertilize: 'Fertilize',
  apply_fungicide: 'Apply fungicide to',
  apply_herbicide: 'Apply herbicide to',
  apply_pesticide: 'Apply pesticide to',
  improve_drainage: 'Improve drainage in',
  remove_plants: 'Remove plants from',
};

const PRIORITY_CFG = {
  urgent: { color: '#d64545', label: 'Urgent' },
  high: { color: '#d97742', label: 'High Priority' },
  medium: { color: '#d4a84a', label: 'Medium Priority' },
  low: { color: '#3da970', label: 'Low Priority' },
};

export default function TodaysAction({ recommendations = [], fields = [] }) {
  const queryClient = useQueryClient();
  const [dismissing, setDismissing] = useState(null);

  const fieldMap = {};
  fields.forEach(f => { fieldMap[f.id] = f; });

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...recommendations].sort((a, b) =>
    (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
  );
  const topActions = sorted.slice(0, 2);

  async function handleDismiss(e, rec) {
    e.preventDefault();
    e.stopPropagation();
    setDismissing(rec.id);
    try {
      await base44.entities.Recommendation.delete(rec.id);
      await queryClient.invalidateQueries({ queryKey: ["fs-recommendations"] });
    } catch (err) {
      console.error("Failed to dismiss action", err);
    } finally {
      setDismissing(null);
    }
  }

  return (
    <div className="fs-card" style={{ padding: 24, height: '100%', background: topActions.length === 0 ? '#f0f9f3' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Calendar style={{ width: 18, height: 18, color: '#3da970' }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#e8eaed' }}>Today's Action</span>
      </div>
      {topActions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 28 }}>
          <CheckCircle style={{ width: 36, height: 36, color: '#3da970', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 15, fontWeight: 500, color: '#2d8a5a', margin: 0, lineHeight: 1.5 }}>
            You're all good — no action needed today.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topActions.map(rec => {
            const field = fieldMap[rec.field_id];
            const verb = ACTION_VERBS[rec.action_type] || 'Act on';
            const priCfg = PRIORITY_CFG[rec.priority] || PRIORITY_CFG.medium;
            return (
              <Link key={rec.id} to={`/fields/${rec.field_id}`} style={{ textDecoration: 'none' }}>
                <div className="fs-card-hover" style={{ padding: '8px 10px', borderLeft: `3px solid ${priCfg.color}`, borderRadius: 8, background: '#1c2129' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: priCfg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {verb} {field?.name || 'field'}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: priCfg.color, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{rec.priority}</span>
                    <button
                      onClick={(e) => handleDismiss(e, rec)}
                      disabled={dismissing === rec.id}
                      title="Dismiss"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 6, color: '#6b7480', display: 'flex', alignItems: 'center', flexShrink: 0, opacity: dismissing === rec.id ? 0.4 : 1 }}
                    >
                      <X style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
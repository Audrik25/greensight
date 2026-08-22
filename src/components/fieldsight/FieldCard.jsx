import React from "react";
import { Link } from "react-router-dom";
import { Sprout, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { STATUS_CONFIG } from "@/lib/fieldUtils";

export default function FieldCard({ field, onDelete }) {
  const status = field.status || 'healthy';
  const healthScore = field.health_score ?? 100;

  return (
    <Link to={`/fields/${field.id}`} style={{ textDecoration: 'none', height: '100%', display: 'block' }}>
      <div className="fs-card fs-card-hover" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', cursor: 'pointer', position: 'relative' }}>
        {onDelete && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(field); }}
            title="Remove field"
            style={{
              position: 'absolute', top: 12, right: 12, zIndex: 5,
              width: 26, height: 26, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(214,69,69,0.08)', border: '1px solid rgba(214,69,69,0.18)',
              cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s ease',
            }}
            className="fs-card-delete-btn"
          >
            <Trash2 style={{ width: 13, height: 13, color: '#d64545' }} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e8eaed', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <Sprout style={{ width: 12, height: 12, color: '#4ec285', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#9aa3af' }}>{field.crop}</span>
              <span style={{ fontSize: 12, color: '#6b7480' }}>· {field.size} {field.size_unit || 'acres'}</span>
            </div>
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: 20, fontWeight: 700, color: STATUS_CONFIG[status].color }}>
              {healthScore}
            </span>
            <span style={{ fontSize: 11, color: '#6b7480' }}>/100</span>
          </div>
          {field.is_demo && <span className="fs-demo-badge">Demo</span>}
        </div>
      </div>
    </Link>
  );
}
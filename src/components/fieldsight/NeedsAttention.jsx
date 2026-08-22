import React from "react";
import { Link } from "react-router-dom";
import { Sprout, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";
import { STATUS_CONFIG } from "@/lib/fieldUtils";

export default function NeedsAttention({ fields = [] }) {
  const needsAttention = fields
    .filter(f => f.status && f.status !== 'healthy')
    .sort((a, b) => (a.health_score ?? 100) - (b.health_score ?? 100));

  if (needsAttention.length === 0) {
    return (
      <div className="fs-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#16261c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle style={{ width: 22, height: 22, color: '#3da970' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e8eaed' }}>All fields are healthy</div>
          <div style={{ fontSize: 13, color: '#6b7480', marginTop: 2 }}>No fields need immediate attention right now.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <AlertTriangle style={{ width: 16, height: 16, color: '#d97742' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e8eaed' }}>{needsAttention.length} field{needsAttention.length > 1 ? 's' : ''} need attention</span>
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {needsAttention.map(field => {
          const cfg = STATUS_CONFIG[field.status] || STATUS_CONFIG.healthy;
          const score = field.health_score ?? 100;
          return (
            <Link key={field.id} to={`/fields/${field.id}`} style={{ textDecoration: 'none', flex: '0 0 auto' }}>
              <div className="fs-card fs-card-hover" style={{ padding: 14, width: 200, borderLeft: `3px solid ${cfg.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <Sprout style={{ width: 13, height: 13, color: '#4ec285', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.name}</span>
                  </div>
                  <ChevronRight style={{ width: 14, height: 14, color: '#6b7480', flexShrink: 0 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{field.status.replace('_', ' ')}</span>
                  <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: 18, fontWeight: 700, color: cfg.color }}>{score}<span style={{ fontSize: 11, color: '#6b7480', fontWeight: 500 }}> /100</span></span>
                </div>
                <div style={{ fontSize: 11, color: '#6b7480', marginTop: 6 }}>{field.crop}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
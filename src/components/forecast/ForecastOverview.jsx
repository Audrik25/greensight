import React from "react";
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles } from "lucide-react";

const CONFIDENCE_CONFIG = {
  High:   { color: '#3da970', bg: '#16261c', label: 'High Confidence' },
  Medium: { color: '#d4a84a', bg: '#2a2417', label: 'Medium Confidence' },
  Low:    { color: '#d97742', bg: '#2a1d15', label: 'Low Confidence' },
};

const TREND_CONFIG = {
  improving:       { icon: TrendingUp,   color: '#3da970', label: 'Improving' },
  stable:          { icon: Minus,        color: '#9aa3af', label: 'Stable' },
  slight_decline:  { icon: TrendingDown, color: '#d4a84a', label: 'Slight Decline' },
  declining:       { icon: TrendingDown, color: '#d64545', label: 'Declining' },
};

function StatCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className="fs-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 18, height: 18, color }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9aa3af' }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 32, fontWeight: 700, color: '#e8eaed', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#7a8290', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function ForecastOverview({ forecast, fieldCount }) {
  const confidence = CONFIDENCE_CONFIG[forecast.overall_confidence] || CONFIDENCE_CONFIG.Medium;
  const trendCfg = TREND_CONFIG[forecast.trend] || TREND_CONFIG.stable;
  const TrendIcon = trendCfg.icon;
  const criticalRisks = (forecast.risks || []).filter(r => r.severity === 'critical' || r.severity === 'high');

  return (
    <div>
      {/* Summary banner */}
      <div className="fs-card" style={{
        padding: 24, marginBottom: 16,
        background: 'linear-gradient(135deg, #161a21 0%, #1c2129 100%)',
        border: '1px solid #252a33',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          background: 'radial-gradient(circle, rgba(78,194,133,0.06), transparent 70%)', borderRadius: '50%',
        }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <Sparkles style={{ width: 20, height: 20, color: '#4ec285', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ec285', marginBottom: 4 }}>
              AI Forecast Summary
            </div>
            <p style={{ fontSize: 14, color: '#e8eaed', lineHeight: 1.6, margin: 0 }}>
              {forecast.summary || 'Forecast summary unavailable.'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid #252a33' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: confidence.bg, color: confidence.color,
            fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 999, border: `1px solid ${confidence.color}33`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: confidence.color }} />
            {confidence.label}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 500, color: trendCfg.color,
          }}>
            <TrendIcon style={{ width: 14, height: 14 }} /> {trendCfg.label}
          </span>
          {criticalRisks.length > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#2a1717', color: '#d64545',
              fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 999, border: '1px solid #d6454533',
            }}>
              <AlertTriangle style={{ width: 12, height: 12 }} /> {criticalRisks.length} high-priority risk{criticalRisks.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="!grid-cols-1 sm:!grid-cols-3">
        <StatCard
          icon={Activity}
          label="Predicted Health (7d)"
          value={`${forecast.overall_predicted_health ?? '—'}`}
          sub={`across ${fieldCount} field${fieldCount > 1 ? 's' : ''}`}
          color="#4ec285" bg="#16261c"
        />
        <StatCard
          icon={AlertTriangle}
          label="Predicted Risks"
          value={forecast.risks?.length ?? 0}
          sub={`${criticalRisks.length} high priority`}
          color="#d97742" bg="#2a1d15"
        />
        <StatCard
          icon={TrendingUp}
          label="Forecast Horizon"
          value="14"
          sub="days ahead"
          color="#d4a84a" bg="#2a2417"
        />
      </div>
    </div>
  );
}
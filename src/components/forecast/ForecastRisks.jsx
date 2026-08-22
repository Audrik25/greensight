import React from "react";
import { AlertTriangle, Droplets, Bug, Leaf, Thermometer, CloudRain, Sprout, TrendingDown, ShieldAlert } from "lucide-react";

const RISK_TYPE_CONFIG = {
  low_moisture:     { label: 'Low Moisture',      icon: Droplets,      color: '#4ea8d8', bg: '#16202a' },
  disease:          { label: 'Disease',           icon: ShieldAlert,   color: '#d64545', bg: '#2a1717' },
  weeds:            { label: 'Weeds',             icon: Sprout,        color: '#d97742', bg: '#2a1d15' },
  pests:            { label: 'Pests',             icon: Bug,           color: '#9d7ad6', bg: '#221a2a' },
  heat_stress:      { label: 'Heat Stress',       icon: Thermometer,   color: '#d97742', bg: '#2a1d15' },
  excess_moisture:  { label: 'Excess Moisture',   icon: CloudRain,     color: '#4ea8d8', bg: '#16202a' },
  declining_health: { label: 'Declining Health',   icon: TrendingDown,  color: '#d4a84a', bg: '#2a2417' },
};

const SEVERITY_CONFIG = {
  low:      { label: 'Low',      color: '#3da970', bg: '#16261c' },
  medium:   { label: 'Medium',   color: '#d4a84a', bg: '#2a2417' },
  high:     { label: 'High',     color: '#d97742', bg: '#2a1d15' },
  critical: { label: 'Critical', color: '#d64545', bg: '#2a1717' },
};

const CONFIDENCE_CONFIG = {
  High:   { color: '#3da970', bg: '#16261c' },
  Medium: { color: '#d4a84a', bg: '#2a2417' },
  Low:    { color: '#d97742', bg: '#2a1d15' },
};

export default function ForecastRisks({ risks = [] }) {
  if (!risks.length) {
    return (
      <div className="fs-card" style={{ padding: 32, textAlign: 'center' }}>
        <Leaf style={{ width: 32, height: 32, color: '#3da970', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 14, color: '#9aa3af' }}>No significant risks predicted in the forecast horizon.</p>
      </div>
    );
  }

  const sorted = [...risks].sort((a, b) => {
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4);
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <AlertTriangle style={{ width: 18, height: 18, color: '#d97742' }} />
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Potential Risks</h3>
        <span style={{ fontSize: 12, color: '#7a8290' }}>· {risks.length} predicted</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="!grid-cols-1 lg:!grid-cols-2">
        {sorted.map((risk, i) => {
          const typeCfg = RISK_TYPE_CONFIG[risk.type] || { label: risk.type, icon: AlertTriangle, color: '#9aa3af', bg: '#1c2129' };
          const sevCfg = SEVERITY_CONFIG[risk.severity] || SEVERITY_CONFIG.medium;
          const confCfg = CONFIDENCE_CONFIG[risk.confidence] || CONFIDENCE_CONFIG.Medium;
          const Icon = typeCfg.icon;

          return (
            <div key={i} className="fs-card fs-card-hover" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: typeCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 18, height: 18, color: typeCfg.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaed', marginBottom: 2 }}>{typeCfg.label}</div>
                  <div style={{ fontSize: 12, color: '#7a8290' }}>{risk.field}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
                  background: sevCfg.bg, color: sevCfg.color, border: `1px solid ${sevCfg.color}33`,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {sevCfg.label}
                </span>
              </div>

              <p style={{ fontSize: 13, color: '#9aa3af', lineHeight: 1.5, margin: '0 0 14px' }}>
                {risk.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
                  <span style={{ color: '#7a8290' }}>⏱ {risk.timeframe}</span>
                  <span style={{ color: '#7a8290' }}>📊 {risk.probability ?? '—'}% likely</span>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                  background: confCfg.bg, color: confCfg.color,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: confCfg.color }} />
                  {risk.confidence} confidence
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
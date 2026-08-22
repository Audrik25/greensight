import React from "react";
import { Bug, Sprout, Layers, CloudRain, AlertTriangle } from "lucide-react";

const RISK_ICONS = {
  disease: Bug,
  weed: Sprout,
  soil: Layers,
  weather: CloudRain,
};

const RISK_LABELS = {
  disease: 'Disease Risk',
  weed: 'Weed Risk',
  soil: 'Soil Condition',
  weather: 'Weather Risk',
};

export default function RiskCard({ type, level = 'low', count = 0, description }) {
  const Icon = RISK_ICONS[type] || AlertTriangle;
  const label = RISK_LABELS[type] || type;

  const levelConfig = {
    low:      { color: '#3da970', bg: '#16261c', label: 'Low Risk' },
    moderate: { color: '#d4a84a', bg: '#2a2417', label: 'Moderate' },
    medium:   { color: '#d4a84a', bg: '#2a2417', label: 'Moderate' },
    high:     { color: '#d97742', bg: '#2a1d15', label: 'High Risk' },
    critical: { color: '#d64545', bg: '#2a1717', label: 'Critical' },
    none:     { color: '#3da970', bg: '#16261c', label: 'No Issues' },
  };
  const cfg = levelConfig[level] || levelConfig.low;

  return (
    <div className="fs-card fs-card-hover" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: 20, height: 20, color: cfg.color }} />
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, color: cfg.color,
          background: cfg.bg, padding: '3px 10px', borderRadius: 999,
        }}>
          {cfg.label}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaed', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#6b7480' }}>
          {count > 0 ? `${count} active detection${count > 1 ? 's' : ''}` : description || 'No issues detected'}
        </div>
      </div>
    </div>
  );
}
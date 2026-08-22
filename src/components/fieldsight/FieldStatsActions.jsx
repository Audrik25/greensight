import React from "react";
import { TrendingUp, TrendingDown, Minus, Maximize, Sprout, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { SEVERITY_CONFIG, DETECTION_TYPE_CONFIG, scoreColor } from "@/lib/fieldUtils";

const ACTION_VERBS = {
  targeted_treatment: 'Targeted treatment',
  monitor: 'Monitor',
  irrigate: 'Irrigate',
  fertilize: 'Fertilize',
  apply_fungicide: 'Apply fungicide',
  apply_herbicide: 'Apply herbicide',
  apply_pesticide: 'Apply pesticide',
  improve_drainage: 'Improve drainage',
  remove_plants: 'Remove plants',
};

const PRIORITY_CFG = {
  urgent: { color: '#d64545', label: 'Urgent' },
  high: { color: '#d97742', label: 'High' },
  medium: { color: '#d4a84a', label: 'Medium' },
  low: { color: '#3da970', label: 'Low' },
};

export default function FieldStatsActions({ field, detections = [], scans = [], recommendations = [] }) {
  const healthScore = field.health_score ?? 100;
  const previousScan = scans[1];
  const healthChange = previousScan?.health_score != null ? healthScore - previousScan.health_score : null;

  const stats = [
    { icon: Maximize, label: 'Field Size', value: `${field.size} ${field.size_unit || 'acres'}`, color: '#7a8290' },
    { icon: Sprout, label: 'Crop', value: field.crop, color: '#4ec285' },
    { icon: Activity, label: 'Growth Stage', value: field.growth_stage || '—', color: '#d4a84a' },
    { icon: AlertTriangle, label: 'Active Detections', value: detections.length, color: detections.length > 0 ? '#d97742' : '#3da970' },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e8eaed', marginBottom: 14 }}>Field Stats & Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }} className="!grid-cols-1 md:!grid-cols-3">
        {/* Key Field Stats */}
        <div className="fs-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Key Field Stats</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #252a33' }}>
            <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 28, fontWeight: 700, color: scoreColor(healthScore) }}>
              {healthScore}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7480' }}>Health Score</div>
              {healthChange !== null ? (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 12, fontWeight: 600,
                  color: healthChange > 0 ? '#3da970' : healthChange < 0 ? '#d64545' : '#6b7480',
                }}>
                  {healthChange > 0 ? <TrendingUp style={{ width: 13, height: 13 }} /> : healthChange < 0 ? <TrendingDown style={{ width: 13, height: 13 }} /> : <Minus style={{ width: 13, height: 13 }} />}
                  {healthChange > 0 ? '+' : ''}{healthChange} pts
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#6b7480' }}>No previous scan</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1c2129', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 15, height: 15, color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaed' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Risks */}
        <div className="fs-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Risks</div>
            {detections.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#d97742', background: '#2a1d15', padding: '2px 8px', borderRadius: 999 }}>{detections.length}</span>}
          </div>
          {detections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <CheckCircle style={{ width: 28, height: 28, color: '#3da970', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: '#9aa3af', margin: 0 }}>No active risks detected</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {detections.slice(0, 4).map(det => {
                const sevCfg = SEVERITY_CONFIG[det.severity] || SEVERITY_CONFIG.low;
                return (
                  <div key={det.id} style={{ padding: 12, background: '#1c2129', borderRadius: 10, borderLeft: `3px solid ${sevCfg.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed' }}>{det.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: sevCfg.color, textTransform: 'capitalize' }}>{det.severity}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7480' }}>{DETECTION_TYPE_CONFIG[det.type]?.label || det.type} · {det.affected_area?.toFixed(0)}% area</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recommended Actions */}
        <div className="fs-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Recommended Actions</div>
          {recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <CheckCircle style={{ width: 28, height: 28, color: '#3da970', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: '#9aa3af', margin: 0 }}>No actions needed</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recommendations.slice(0, 4).map(rec => {
                const priCfg = PRIORITY_CFG[rec.priority] || PRIORITY_CFG.medium;
                const verb = ACTION_VERBS[rec.action_type] || 'Take action';
                return (
                  <div key={rec.id} style={{ padding: 12, background: '#1c2129', borderRadius: 10, borderLeft: `3px solid ${priCfg.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed' }}>{verb}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: priCfg.color, textTransform: 'uppercase' }}>{priCfg.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9aa3af', lineHeight: 1.5 }}>{rec.recommendation}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
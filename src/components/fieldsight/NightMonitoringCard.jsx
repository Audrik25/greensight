import React, { useMemo } from "react";
import { Moon, PawPrint, AlertTriangle, Clock } from "lucide-react";
import { formatDateTime, timeAgo } from "@/lib/fieldUtils";

const THREAT_LEVEL_CONFIG = {
  LOW:      { label: 'Low',      color: '#3da970', bg: '#16261c' },
  MODERATE: { label: 'Moderate', color: '#d4a84a', bg: '#2a2417' },
  HIGH:     { label: 'High',     color: '#d97742', bg: '#2a1d15' },
  CRITICAL: { label: 'Critical', color: '#d64545', bg: '#2a1717' },
};

export default function NightMonitoringCard({ detections = [] }) {
  const summary = useMemo(() => {
    if (detections.length === 0) return null;
    const species = [...new Set(detections.map(d => d.species).filter(Boolean))];
    const threatDetections = detections.filter(d => d.potential_crop_threat);
    const highestConf = detections.reduce((max, d) => Math.max(max, d.confidence || 0), 0);
    const highestRiskSpecies = detections
      .filter(d => d.potential_crop_threat)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]?.species;
    return { total: detections.length, species, threatCount: threatDetections.length, highestConf, highestRiskSpecies };
  }, [detections]);

  if (detections.length === 0) return null;

  const threatLevel = summary.threatCount > 0 ? 'HIGH' : 'LOW';
  const threatCfg = THREAT_LEVEL_CONFIG[threatLevel] || THREAT_LEVEL_CONFIG.LOW;

  return (
    <div className="fs-card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1c2129', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Moon style={{ width: 18, height: 18, color: '#9d7ad6' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Night Monitoring</h3>
          <span style={{ fontSize: 12, color: '#6b7480' }}>Overnight animal activity &amp; crop threats</span>
        </div>
        <div style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 999, background: threatCfg.bg, border: `1px solid ${threatCfg.color}44` }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: threatCfg.color, textTransform: 'uppercase' }}>{threatCfg.label} Threat</span>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 14, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Detections</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#e8eaed', fontFamily: "'Archivo', sans-serif" }}>{summary.total}</div>
        </div>
        <div style={{ padding: 14, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Species Detected</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaed', textTransform: 'capitalize' }}>{summary.species.join(', ') || '—'}</div>
        </div>
        <div style={{ padding: 14, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Highest Risk</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: threatCfg.color, textTransform: 'capitalize' }}>{summary.highestRiskSpecies || '—'}</div>
        </div>
      </div>

      {/* Detection list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {detections.map((det, i) => {
          const conf = det.confidence != null ? (det.confidence <= 1 ? det.confidence * 100 : det.confidence) : 0;
          return (
            <div key={det.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: det.potential_crop_threat ? '#2a1717' : '#16261c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PawPrint style={{ width: 18, height: 18, color: det.potential_crop_threat ? '#d64545' : '#3da970' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e8eaed', textTransform: 'capitalize' }}>{det.species || det.type || 'Unknown'}</span>
                  {det.potential_crop_threat && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#d64545', background: '#2a1717', padding: '2px 8px', borderRadius: 999 }}>
                      <AlertTriangle style={{ width: 10, height: 10 }} /> Crop Threat
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 11, color: '#6b7480' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock style={{ width: 11, height: 11 }} />{det.timestamp ? timeAgo(det.timestamp) : '—'}
                  </span>
                  {det.motion_duration_seconds != null && (
                    <span>{det.motion_duration_seconds.toFixed(0)}s motion</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaed', fontFamily: "'Archivo', sans-serif" }}>{conf.toFixed(0)}%</div>
                <div style={{ fontSize: 10, color: '#6b7480' }}>confidence</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
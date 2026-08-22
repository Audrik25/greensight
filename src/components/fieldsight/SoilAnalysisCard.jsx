import React from "react";
import { Layers, Droplets, Wind, Mountain, Gauge } from "lucide-react";

const DRAINAGE_RISK_CONFIG = {
  low:      { label: 'Low',      color: '#3da970', bg: '#16261c' },
  moderate: { label: 'Moderate', color: '#d4a84a', bg: '#2a2417' },
  high:     { label: 'High',     color: '#d97742', bg: '#2a1d15' },
};

function Pill({ label, value, color }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, padding: '4px 10px', borderRadius: 999, textTransform: 'capitalize' }}>
      {value}
    </span>
  );
}

export default function SoilAnalysisCard({ scan }) {
  if (!scan) return null;
  const hasSoilData = scan.soil_visual_type || scan.soil_moisture || scan.soil_drainage_risk ||
    scan.soil_surface_moisture || scan.soil_apparent_compaction || scan.soil_apparent_drainage;
  if (!hasSoilData) return null;

  const drainageCfg = DRAINAGE_RISK_CONFIG[scan.soil_drainage_risk?.toLowerCase()] || null;
  const soilConfidence = scan.soil_confidence != null ? (scan.soil_confidence <= 1 ? scan.soil_confidence * 100 : scan.soil_confidence) : null;

  const indicators = [
    { label: 'Surface Moisture', value: scan.soil_surface_moisture, icon: Droplets },
    { label: 'Compaction', value: scan.soil_apparent_compaction, icon: Mountain },
    { label: 'Drainage', value: scan.soil_apparent_drainage, icon: Wind },
  ].filter(i => i.value);

  return (
    <div className="fs-card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2a2417', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers style={{ width: 18, height: 18, color: '#d4a84a' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Soil Analysis</h3>
          <span style={{ fontSize: 12, color: '#6b7480' }}>Visual assessment &amp; conditions</span>
        </div>
        {soilConfidence != null && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#1c2129', borderRadius: 999, border: '1px solid #252a33' }}>
            <Gauge style={{ width: 14, height: 14, color: '#4ec285' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e8eaed' }}>{soilConfidence.toFixed(0)}%</span>
            <span style={{ fontSize: 10, color: '#6b7480' }}>confidence</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: indicators.length > 0 ? 20 : 0 }}>
        {scan.soil_visual_type && (
          <div style={{ padding: 14, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Soil Type</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e8eaed', textTransform: 'capitalize' }}>{scan.soil_visual_type}</div>
          </div>
        )}
        {scan.soil_moisture && (
          <div style={{ padding: 14, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Moisture</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#4ea8d8', textTransform: 'capitalize' }}>{scan.soil_moisture.replace('visually_', '')}</div>
          </div>
        )}
        {scan.soil_drainage_risk && drainageCfg && (
          <div style={{ padding: 14, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Drainage Risk</div>
            <Pill label={drainageCfg.label} value={drainageCfg.label} color={drainageCfg.color} />
          </div>
        )}
      </div>

      {indicators.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Soil Indicators</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {indicators.map(ind => {
              const Icon = ind.icon;
              return (
                <div key={ind.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
                  <Icon style={{ width: 15, height: 15, color: '#9aa3af' }} />
                  <span style={{ fontSize: 12, color: '#6b7480' }}>{ind.label}:</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed', textTransform: 'capitalize' }}>{ind.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scan.soil_image && (
        <div style={{ marginTop: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid #252a33' }}>
          <img src={scan.soil_image} alt="Soil" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
        </div>
      )}
    </div>
  );
}
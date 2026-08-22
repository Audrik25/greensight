import React from "react";
import { Leaf, Sprout, Bug, Droplets, AlertTriangle, TrendingDown, Palette, Grid3x3, Activity } from "lucide-react";
import { DETECTION_TYPE_CONFIG, scoreColor } from "@/lib/fieldUtils";

const INDICATOR_CONFIG = [
  { key: "color_health", label: "Color Health", icon: Palette, invert: false },
  { key: "density", label: "Density", icon: Grid3x3, invert: false },
  { key: "growth", label: "Growth", icon: Activity, invert: false },
  { key: "stress", label: "Stress", icon: TrendingDown, invert: true },
];

const TYPE_ICONS = {
  disease: Leaf, weed: Sprout, soil_condition: Grid3x3,
  pest: Bug, water_stress: Droplets, nutrient_deficiency: Sprout,
};

export default function GrassAnalysisCard({ scan, detections = [] }) {
  const hasIndicators = INDICATOR_CONFIG.some(cfg => scan?.[cfg.key] != null);
  if (!hasIndicators && detections.length === 0) return null;

  return (
    <div className="fs-card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#16261c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sprout style={{ width: 18, height: 18, color: '#4ec285' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Grass Analysis</h3>
          <span style={{ fontSize: 12, color: '#6b7480' }}>Health indicators &amp; detected issues</span>
        </div>
      </div>

      {/* Health indicators */}
      {hasIndicators && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: detections.length > 0 ? 24 : 0 }} className="!grid-cols-1">
          {INDICATOR_CONFIG.map(cfg => {
            const raw = scan?.[cfg.key];
            if (raw == null) return null;
            const value = cfg.invert ? 100 - raw : raw;
            const displayValue = cfg.invert ? raw : raw;
            const color = scoreColor(value);
            const Icon = cfg.icon;
            return (
              <div key={cfg.key} style={{ padding: 16, background: '#1c2129', borderRadius: 12, border: '1px solid #252a33' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon style={{ width: 15, height: 15, color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#9aa3af' }}>{cfg.label}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#e8eaed', fontFamily: "'Archivo', sans-serif" }}>
                    {displayValue.toFixed(0)}
                  </span>
                </div>
                <div style={{ height: 6, background: '#252a33', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detected issues */}
      {detections.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle style={{ width: 13, height: 13, color: '#d97742' }} /> Detected Issues ({detections.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {detections.map(det => {
              const Icon = TYPE_ICONS[det.type] || AlertTriangle;
              const typeColor = DETECTION_TYPE_CONFIG[det.type]?.color || '#9aa3af';
              const conf = det.confidence != null ? (det.confidence <= 1 ? det.confidence * 100 : det.confidence) : 0;
              return (
                <div key={det.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: `${typeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 18, height: 18, color: typeColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaed' }}>{det.label}</div>
                    <div style={{ fontSize: 11, color: '#6b7480' }}>{DETECTION_TYPE_CONFIG[det.type]?.label || det.type}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: typeColor, fontFamily: "'Archivo', sans-serif" }}>{conf.toFixed(0)}%</div>
                    <div style={{ fontSize: 10, color: '#6b7480' }}>confidence</div>
                  </div>
                  {det.affected_area != null && (
                    <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12, borderLeft: '1px solid #252a33' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaed', fontFamily: "'Archivo', sans-serif" }}>{det.affected_area.toFixed(1)}%</div>
                      <div style={{ fontSize: 10, color: '#6b7480' }}>affected</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
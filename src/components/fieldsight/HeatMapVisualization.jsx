import React from "react";
import { Grid3x3 } from "lucide-react";
import FieldViz from "@/components/fieldsight/FieldViz";
import { RISK_LEVEL_CONFIG, scoreColor } from "@/lib/fieldUtils";

export default function HeatMapVisualization({ regions = [], scanId, healthScore = 100, height = 280 }) {
  const hasRegions = regions.length > 0;

  // Compute total bounds for absolute positioning
  const maxX = hasRegions ? Math.max(...regions.map(r => (r.x || 0) + (r.width || 0))) : 0;
  const maxY = hasRegions ? Math.max(...regions.map(r => (r.y || 0) + (r.height || 0))) : 0;

  return (
    <div className="fs-card" style={{ padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1c2129', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Grid3x3 style={{ width: 16, height: 16, color: '#4ec285' }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Health Heat Map</h3>
        </div>
        <span style={{ fontSize: 11, color: '#6b7480' }}>
          {hasRegions ? `${regions.length} zones mapped` : 'Simulated zones'}
        </span>
      </div>

      {hasRegions ? (
        <>
          <div style={{ position: 'relative', width: '100%', height, background: '#0a0d12', borderRadius: 12, overflow: 'hidden', border: '1px solid #252a33' }}>
            {regions.map((region, i) => {
              const left = ((region.x || 0) / maxX) * 100;
              const top = ((region.y || 0) / maxY) * 100;
              const widthPct = ((region.width || 0) / maxX) * 100;
              const heightPct = ((region.height || 0) / maxY) * 100;
              const riskCfg = RISK_LEVEL_CONFIG[region.risk_level];
              const color = riskCfg ? riskCfg.color : scoreColor(region.health_score ?? 100);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    background: `${color}22`,
                    border: `1px solid ${color}55`,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'Archivo', sans-serif" }}>
                      {region.health_score?.toFixed(0)}
                    </div>
                    {riskCfg && (
                      <div style={{ fontSize: 9, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {riskCfg.label}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            {Object.values(RISK_LEVEL_CONFIG).map(cfg => (
              <div key={cfg.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: `${cfg.color}22`, border: `1px solid ${cfg.color}55` }} />
                <span style={{ fontSize: 11, color: '#9aa3af' }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <FieldViz seed={scanId} healthScore={healthScore} height={height} />
      )}
    </div>
  );
}
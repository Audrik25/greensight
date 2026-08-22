import React, { useMemo } from "react";
import { generateZones, ZONE_COLORS } from "@/lib/fieldUtils";

const LEGEND = [
  { status: 'healthy',       label: 'Healthy' },
  { status: 'monitor',       label: 'Monitor' },
  { status: 'action_needed', label: 'Treatment Recommended' },
  { status: 'critical',      label: 'Critical' },
];

export default function FieldViz({ seed, healthScore = 100, cols = 14, rows = 9, showLegend = true, height = 260, scanning = false }) {
  const { zones, cols: zc, rows: zr } = useMemo(
    () => generateZones(seed, healthScore, cols, rows),
    [seed, healthScore, cols, rows]
  );

  const cellSize = `calc((100% - ${(zc + 1) * 3}px) / ${zc})`;

  return (
    <div>
      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #252a33',
          background: '#1c2129',
          padding: 3,
          height,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${zc}, 1fr)`,
            gridTemplateRows: `repeat(${zr}, 1fr)`,
            gap: 3,
            height: '100%',
            width: '100%',
          }}
        >
          {zones.map((zone, i) => (
            <div
              key={i}
              style={{
                borderRadius: 3,
                background: ZONE_COLORS[zone.status] || ZONE_COLORS.healthy,
                opacity: zone.status === 'healthy' ? 0.65 : 0.88,
                transition: 'opacity 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Scanning line overlay */}
        {scanning && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 0,
            height: '3px', background: 'linear-gradient(90deg, transparent, #4ec285, transparent)',
            boxShadow: '0 0 12px rgba(63,169,106,0.6)',
            animation: 'fs-scan-line 2s ease-in-out infinite',
          }} />
        )}

        {/* Corner label */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(10,31,20,0.7)', color: '#e8eaed',
          fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)',
        }}>
          Field Map
        </div>
      </div>

      {showLegend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
          {LEGEND.map(({ status, label }) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 12, height: 12, borderRadius: 3,
                background: ZONE_COLORS[status], opacity: status === 'healthy' ? 0.65 : 0.88,
              }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: '#9aa3af' }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
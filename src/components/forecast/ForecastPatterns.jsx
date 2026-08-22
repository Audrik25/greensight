import React from "react";
import { History, CloudSun, Lightbulb } from "lucide-react";

export default function ForecastPatterns({ patterns = [], weatherImpact }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="!grid-cols-1 lg:!grid-cols-2">
      {/* Historical Pattern Analysis */}
      <div className="fs-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <History style={{ width: 18, height: 18, color: '#d4a84a' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Historical Pattern Analysis</h3>
        </div>
        {patterns.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {patterns.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', borderRadius: 10,
                background: '#0e1116', border: '1px solid #252a33',
              }}>
                <Lightbulb style={{ width: 14, height: 14, color: '#d4a84a', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: '#9aa3af', lineHeight: 1.55, margin: 0 }}>{p}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: '#7a8290' }}>Not enough historical data to identify patterns yet.</p>
        )}
      </div>

      {/* Weather Impact */}
      <div className="fs-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CloudSun style={{ width: 18, height: 18, color: '#4ea8d8' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Weather Impact</h3>
        </div>
        <div style={{
          padding: '16px 18px', borderRadius: 12,
          background: 'linear-gradient(135deg, #16202a 0%, #1c2129 100%)',
          border: '1px solid #252a33',
        }}>
          <p style={{ fontSize: 13, color: '#e8eaed', lineHeight: 1.65, margin: 0 }}>
            {weatherImpact || 'Weather impact analysis unavailable.'}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
          fontSize: 11, color: '#6b7480',
        }}>
          <CloudSun style={{ width: 13, height: 13, color: '#4ea8d8' }} />
          Combines current environmental data with field conditions to project weather-driven effects.
        </div>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Activity, Droplets, Bug, Leaf, Sprout, Thermometer } from "lucide-react";

const CHART_COLORS = {
  health_score: '#4ec285',
  soil_moisture: '#4ea8d8',
  disease_risk: '#d64545',
  weed_risk: '#d97742',
  pest_risk: '#9d7ad6',
  crop_stress: '#d4a84a',
};

const TABS = [
  { key: 'health',     label: 'Field Health',  icon: Activity,     metric: 'health_score', color: CHART_COLORS.health_score },
  { key: 'moisture',   label: 'Soil Moisture', icon: Droplets,      metric: 'soil_moisture', color: CHART_COLORS.soil_moisture },
  { key: 'risks',      label: 'Risk Trends',   icon: Bug,           metrics: ['disease_risk', 'weed_risk', 'pest_risk'], color: '#d64545' },
  { key: 'stress',     label: 'Crop Stress',   icon: Thermometer,  metric: 'crop_stress', color: CHART_COLORS.crop_stress },
];

const RISK_LINES = [
  { key: 'disease_risk', label: 'Disease', color: CHART_COLORS.disease_risk },
  { key: 'weed_risk',    label: 'Weeds',   color: CHART_COLORS.weed_risk },
  { key: 'pest_risk',   label: 'Pests',   color: CHART_COLORS.pest_risk },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: '#0a0d12', border: '1px solid #353b45', borderRadius: 10,
      padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, color: '#e8eaed', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.stroke }} />
          <span style={{ color: '#9aa3af' }}>{p.name}:</span>
          <span style={{ color: '#e8eaed', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ForecastCharts({ daily = [] }) {
  const [activeTab, setActiveTab] = useState('health');
  const tab = TABS.find(t => t.key === activeTab);
  const data = daily.map(d => ({
    ...d,
    dateLabel: formatDateLabel(d.date) || `Day ${d.day}`,
  }));

  return (
    <div className="fs-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#e8eaed', margin: 0 }}>14-Day Forecast Trends</h3>
          <p style={{ fontSize: 12, color: '#7a8290', margin: '4px 0 0' }}>Predicted changes over the next two weeks</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#0e1116', borderRadius: 10, padding: 4, border: '1px solid #252a33' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 7, cursor: 'pointer',
                  fontSize: 12, fontWeight: 500, border: 'none',
                  background: isActive ? '#1c2129' : 'transparent',
                  color: isActive ? '#e8eaed' : '#7a8290',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon style={{ width: 14, height: 14 }} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          {activeTab === 'risks' ? (
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252a33" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#7a8290' }} stroke="#353b45" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#7a8290' }} stroke="#353b45" />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              {RISK_LINES.map(line => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.label}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ r: 2, fill: line.color }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${tab.metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tab.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={tab.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252a33" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#7a8290' }} stroke="#353b45" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#7a8290' }} stroke="#353b45" />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey={tab.metric}
                name={tab.label}
                stroke={tab.color}
                strokeWidth={2.5}
                fill={`url(#grad-${tab.metric})`}
                dot={{ r: 2, fill: tab.color }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #252a33',
        fontSize: 11, color: '#6b7480',
      }}>
        <Leaf style={{ width: 13, height: 13, color: '#4ec285' }} />
        Predictions are AI-generated forecasts based on historical patterns and current conditions — not guarantees.
      </div>
    </div>
  );
}
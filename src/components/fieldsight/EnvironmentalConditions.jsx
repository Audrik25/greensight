import React from "react";
import { CloudSun, Droplets, Wind, Thermometer, CloudRain, Sprout } from "lucide-react";
import DemoBadge from "./DemoBadge";

export default function EnvironmentalConditions({ data }) {
  if (!data) {
    return (
      <div className="fs-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <CloudSun style={{ width: 18, height: 18, color: '#4ec285' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Environmental Conditions
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#6b7480' }}>No environmental data available. Connect a weather station for live data.</div>
      </div>
    );
  }

  const metrics = [
    { icon: Thermometer, label: 'Temperature', value: `${data.temperature?.toFixed(0)}°C`, color: '#d97742', bg: '#2a1d15' },
    { icon: Droplets, label: 'Humidity', value: `${data.humidity?.toFixed(0)}%`, color: '#4ea8d8', bg: '#16202a' },
    { icon: CloudRain, label: 'Rainfall', value: `${data.precipitation?.toFixed(1)} mm`, color: '#4ea8d8', bg: '#16202a' },
    { icon: Wind, label: 'Wind Speed', value: `${data.wind_speed?.toFixed(0)} km/h`, color: '#7a8290', bg: '#1c2129' },
  ];

  return (
    <div className="fs-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CloudSun style={{ width: 18, height: 18, color: '#4ec285' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Environmental Conditions
          </span>
        </div>
        {data.is_demo && <DemoBadge />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: 32, fontWeight: 700, color: '#e8eaed', lineHeight: 1 }}>
          {data.temperature?.toFixed(0)}°C
        </span>
        <span style={{ fontSize: 14, color: '#9aa3af' }}>{data.conditions || 'Partly Cloudy'}</span>
        {data.wind_direction && (
          <span style={{ fontSize: 12, color: '#6b7480', marginLeft: 4 }}>· Wind {data.wind_direction}</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} className="!grid-cols-2">
        {metrics.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: bg, borderRadius: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#1c2129', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 18, height: 18, color }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e8eaed' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 14, borderTop: '1px solid #252a33' }}>
        <Sprout style={{ width: 13, height: 13, color: '#6b7480' }} />
        <span style={{ fontSize: 11, color: '#6b7480' }}>Soil sensor data available when IoT probes are connected (Part 2)</span>
      </div>
    </div>
  );
}